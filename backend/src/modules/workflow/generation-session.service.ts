import { BaseService } from '../../common/base.service';
import { prisma } from '../../prisma/client';
import { BadRequestError } from '../../utils/errors';
import {
  ResumeContext,
  ParsedJobDescription,
  ResumeContextExperience,
  ResumeContextProject,
  ResumeContextSkill,
} from './generation-session.types';
import { generationSessionRepository, aiMessageRepository } from './generation-session.repository';
import { resumeContextBuilderService } from '../resume/services/resume-context-builder.service';
import { langGraphResumeGenerationGraph, rankAndFilterResumeContext } from '../../ai';
import {
  getLLMClient,
  setLLMClient,
  LLMClient,
  LLMMessage,
  LLMConfig,
  LLMResponse,
} from '../../ai/llm/client';

class TokenTrackingClient implements LLMClient {
  public inputTokens = 0;
  public outputTokens = 0;
  public nodeCallCounts: Record<string, number> = {};
  public currentNode: string | null = null;

  constructor(private client: LLMClient) {}

  async call(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    if (this.currentNode) {
      this.nodeCallCounts[this.currentNode] = (this.nodeCallCounts[this.currentNode] || 0) + 1;
    }
    const res = await this.client.call(messages, config);
    this.inputTokens += res.usage?.inputTokens || 0;
    this.outputTokens += res.usage?.outputTokens || 0;
    return res;
  }
}

export class GenerationSessionService extends BaseService {
  private async logWorkflowStep(
    sessionId: string,
    stepName: string,
    message: string,
    status: string,
    extra?: {
      nodeName?: string;
      startedAt?: Date;
      completedAt?: Date;
      duration?: number;
      retryCount?: number;
      errorMessage?: string;
    },
  ) {
    return prisma.workflowLog.create({
      data: {
        sessionId,
        stepName,
        message,
        status,
        nodeName: extra?.nodeName,
        startedAt: extra?.startedAt,
        completedAt: extra?.completedAt,
        duration: extra?.duration,
        retryCount: extra?.retryCount || 0,
        errorMessage: extra?.errorMessage,
        timestamp: new Date(),
      },
    });
  }

  private async logAIMessage(
    sessionId: string,
    type: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    await aiMessageRepository.create(sessionId, {
      type,
      message,
      metadata,
    });
  }

  async initiate(userId: string, input: Record<string, unknown>) {
    // Validate input
    const companyName = (input.companyName as string) || 'Target Company';
    const targetRole = (input.targetRole as string) || 'Software Engineer';
    const jobDescription = (input.jobDescription as string) || '';

    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new BadRequestError('Job description is required');
    }

    // Create GenerationSession
    const session = await generationSessionRepository.create(userId, {
      companyName,
      targetRole,
      originalJobDescription: jobDescription,
      status: 'QUEUED',
    });

    await this.logAIMessage(
      session.id,
      'STARTED',
      `Generation started for ${targetRole} at ${companyName}`,
      { companyName, targetRole },
    );

    return session;
  }

  async execute(sessionId: string, userId: string): Promise<any> {
    const startTime = Date.now();

    // Check if session is already running to prevent concurrent duplicates
    const currentSession = await prisma.generationSession.findUnique({
      where: { id: sessionId },
    });
    if (currentSession && currentSession.status === 'PROCESSING') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (currentSession.startedAt && currentSession.startedAt > fiveMinutesAgo) {
        console.log(
          `[Workflow] Session ${sessionId} is already processing. Rejecting concurrent execute request.`,
        );
        const latestVersion = await prisma.resumeVersion.findFirst({
          where: { sessionId },
          orderBy: { versionNo: 'desc' },
        });
        return latestVersion?.resumeJson || null;
      }
    }

    // Update session status to PROCESSING
    await prisma.generationSession.update({
      where: { id: sessionId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    // Clean up any old error message or logs if retrying
    await prisma.workflowLog.deleteMany({ where: { sessionId } });
    await prisma.aIMessage.deleteMany({ where: { sessionId } });

    const profileStart = new Date();
    const readingProfileLog = await this.logWorkflowStep(
      sessionId,
      'Reading Profile',
      'Started reading master profile',
      'IN_PROGRESS',
      { startedAt: profileStart },
    );

    let resumeContext: ResumeContext;
    let originalJobDescription = '';
    try {
      // 1. Fetch the session
      const session = await prisma.generationSession.findUniqueOrThrow({
        where: { id: sessionId },
        include: { company: true },
      });

      originalJobDescription = session.originalJobDescription;

      // 2. Build ResumeContext using ResumeContextBuilderService
      resumeContext = await resumeContextBuilderService.build(
        userId,
        session.companyName,
        session.company?.description || undefined,
        session.originalJobDescription,
      );

      // Apply strict ranking and selection rules to select a tailored subset
      resumeContext = rankAndFilterResumeContext(resumeContext);

      // Override the temporary generationSessionId with the actual sessionId
      resumeContext.generationSessionId = sessionId;

      const profileEnd = new Date();
      await prisma.workflowLog.update({
        where: { id: readingProfileLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: profileEnd,
          duration: (profileEnd.getTime() - profileStart.getTime()) / 1000,
          message: 'Successfully read and validated profile data',
        },
      });
    } catch (err: any) {
      const msg = err.message || 'Validation failed';
      const profileEnd = new Date();
      await prisma.workflowLog.update({
        where: { id: readingProfileLog.id },
        data: {
          status: 'FAILED',
          completedAt: profileEnd,
          duration: (profileEnd.getTime() - profileStart.getTime()) / 1000,
          errorMessage: msg,
          message: `Profile validation failed: ${msg}`,
        },
      });

      await prisma.generationSession.update({
        where: { id: sessionId },
        data: {
          status: 'FAILED',
          errorMessage: msg,
          completedAt: new Date(),
        },
      });
      await this.logAIMessage(sessionId, 'ERROR', `Validation failed: ${msg}`);
      throw err;
    }

    // 3. Save ResumeContext snapshot
    await this.logAIMessage(
      sessionId,
      'CONTEXT_SNAPSHOT',
      'Saving ResumeContext snapshot',
      resumeContext as any,
    );

    // 4. Wrap LLM client to track token usage
    const originalClient = getLLMClient();
    const trackingClient = new TokenTrackingClient(originalClient);
    setLLMClient(trackingClient);

    let finalResumeJson: any = null;
    const nodeLogs: Record<string, { id: string; startedAt: Date }> = {};

    const friendlyNodeMapping: Record<string, string> = {
      'validate-context': 'Reading Profile',
      'analyze-job': 'Analyzing Job Description',
      'select-experiences': 'Selecting Experiences',
      'select-projects': 'Selecting Projects',
      'select-skills': 'Selecting Skills',
      'generate-summary': 'Generating Summary',
      'experience-bullets': 'Rewriting Experience',
      'project-bullets': 'Rewriting Projects',
      'generate-resume-json': 'Building Resume',
      'combined-analysis': 'Analyzing Job Description',
      'combined-rewrite': 'Preparing Resume Content',
    };

    try {
      // 5. Run LangGraph via streamEvents
      const stream = await langGraphResumeGenerationGraph.stream(resumeContext);

      for await (const event of stream) {
        const nodeName = event.name;
        if (!nodeName || !friendlyNodeMapping[nodeName]) {
          continue;
        }

        const friendlyStep = friendlyNodeMapping[nodeName];

        if (event.event === 'on_chain_start') {
          trackingClient.currentNode = nodeName;
          trackingClient.nodeCallCounts[nodeName] = 0;

          const startedAt = new Date();
          const logEntry = await this.logWorkflowStep(
            sessionId,
            friendlyStep,
            `Started ${friendlyStep.toLowerCase()}`,
            'IN_PROGRESS',
            { nodeName, startedAt },
          );
          nodeLogs[nodeName] = { id: logEntry.id, startedAt };

          await prisma.generationSession.update({
            where: { id: sessionId },
            data: { currentStep: friendlyStep },
          });
        } else if (event.event === 'on_chain_end') {
          const completedAt = new Date();
          const logInfo = nodeLogs[nodeName];
          const startedAt = logInfo?.startedAt || new Date();
          const duration = (completedAt.getTime() - startedAt.getTime()) / 1000;
          const retryCount = Math.max(0, (trackingClient.nodeCallCounts[nodeName] || 1) - 1);

          // Check if this node produced the final resume output
          if (event.data?.output?.generatedResumeJson) {
            finalResumeJson = event.data.output.generatedResumeJson;
          }

          if (logInfo) {
            await prisma.workflowLog.update({
              where: { id: logInfo.id },
              data: {
                status: 'COMPLETED',
                completedAt,
                duration,
                retryCount,
                message: `Completed ${friendlyStep.toLowerCase()}`,
              },
            });
          }
        }
      }

      if (!finalResumeJson) {
        throw new Error('Graph execution completed but no GeneratedResume JSON was returned');
      }

      let currentResume = finalResumeJson;

      // STEP 1: Resume Compression
      const compStart = new Date();
      const compLog = await this.logWorkflowStep(
        sessionId,
        'Generating Resume',
        'Compressing resume to match page constraints',
        'IN_PROGRESS',
        { startedAt: compStart },
      );

      try {
        const { resumeOptimizationService } = await import('../ats/resume-optimization.service');
        currentResume = await resumeOptimizationService.compressResume(resumeContext, currentResume);

        const compEnd = new Date();
        await prisma.workflowLog.update({
          where: { id: compLog.id },
          data: {
            status: 'COMPLETED',
            completedAt: compEnd,
            duration: (compEnd.getTime() - compStart.getTime()) / 1000,
            message: 'Compression Completed',
          },
        });
      } catch (err: any) {
        console.error('[Workflow] Resume compression failed:', err);
        await prisma.workflowLog.update({
          where: { id: compLog.id },
          data: {
            status: 'COMPLETED',
            message: `Compression skipped: ${err.message}`,
          },
        });
      }

      // STEP 2 & 3 & 4 & 5: ATS Analysis and Optimization Loop
      let iteration = 0;
      const maxIterations = 2;
      const targetScore = parseInt(process.env.ATS_TARGET_SCORE || '85', 10);
      let previousScore = 0;
      let lastReport: any = null;
      const jd = originalJobDescription || '';
      const runsToSave: any[] = [];

      const { resumeOptimizationService } = await import('../ats/resume-optimization.service');
      const { analyzeATS } = await import('../ats/ats.utils');

      while (iteration < maxIterations) {
        iteration++;

        // Step 2: ATS Analysis
        const checkStart = new Date();
        const checkLog = await this.logWorkflowStep(
          sessionId,
          iteration === 1 ? 'Checking ATS' : 'Checking ATS Again',
          `Checking ATS Score (Iteration ${iteration})`,
          'IN_PROGRESS',
          { startedAt: checkStart },
        );

        let report;
        try {
          report = analyzeATS(currentResume, jd);
          lastReport = report;

          // Record run info temporarily (will save to database after version is created due to FK constraints)
          runsToSave.push({
            overallScore: report.overallScore,
            keywordScore: report.scoreBreakdown.keywordMatch,
            formattingScore: report.scoreBreakdown.formatting,
            readabilityScore: report.scoreBreakdown.readability,
            experienceScore: report.scoreBreakdown.experienceRelevance,
            suggestions: report as any,
            missingKeywords: report.missingKeywords as any,
            iterationNumber: iteration,
          });

          await this.logAIMessage(
            sessionId,
            'ATS_SCORE',
            `Iteration ${iteration} ATS Score: ${report.overallScore}`,
            { iteration, score: report.overallScore },
          );

          const checkEnd = new Date();
          await prisma.workflowLog.update({
            where: { id: checkLog.id },
            data: {
              status: 'COMPLETED',
              completedAt: checkEnd,
              duration: (checkEnd.getTime() - checkStart.getTime()) / 1000,
              message: `ATS Score: ${report.overallScore}`,
            },
          });
        } catch (err: any) {
          console.error('[Workflow] ATS check failed:', err);
          break;
        }

        // Optimization Decision
        const decision = resumeOptimizationService.shouldOptimize(
          resumeContext,
          currentResume,
          report,
          targetScore,
        );

        // Stopping condition: Target score reached
        if (report.overallScore >= targetScore) {
          await this.logAIMessage(
            sessionId,
            'OPTIMIZATION_STOPPED',
            `Stopped: Target score reached (${report.overallScore} >= ${targetScore})`,
          );
          break;
        }

        // Stopping condition: Improvement less than 2
        if (iteration > 1 && report.overallScore - previousScore < 2) {
          await this.logAIMessage(
            sessionId,
            'OPTIMIZATION_STOPPED',
            `Stopped: Score improvement too low (${report.overallScore - previousScore} pts)`,
          );
          break;
        }

        if (!decision.needsOptimization) {
          await this.logAIMessage(
            sessionId,
            'OPTIMIZATION_STOPPED',
            'Stopped: Resume satisfies all constraints',
          );
          break;
        }

        previousScore = report.overallScore;

        // Step 4: LLM Optimization Pass
        const optStart = new Date();
        const optLog = await this.logWorkflowStep(
          sessionId,
          'Optimizing Resume',
          `Optimizing Resume details (Iteration ${iteration})`,
          'IN_PROGRESS',
          { startedAt: optStart },
        );

        try {
          const startTimeTokens = trackingClient.inputTokens + trackingClient.outputTokens;
          const startOptTime = Date.now();

          await this.logAIMessage(sessionId, 'OPTIMIZATION_STARTED', `Optimization Started (Iteration ${iteration})`);

          currentResume = await resumeOptimizationService.optimizeResume(
            resumeContext,
            currentResume,
            report,
            decision.feedback,
          );

          const endOptTime = Date.now();
          const tokensUsed = trackingClient.inputTokens + trackingClient.outputTokens - startTimeTokens;

          await this.logAIMessage(
            sessionId,
            'OPTIMIZATION_ITERATION_METRICS',
            `Iteration ${iteration} Completed`,
            {
              iteration,
              score: report.overallScore,
              tokensUsed,
              durationMs: endOptTime - startOptTime,
            },
          );

          const optEnd = new Date();
          await prisma.workflowLog.update({
            where: { id: optLog.id },
            data: {
              status: 'COMPLETED',
              completedAt: optEnd,
              duration: (optEnd.getTime() - optStart.getTime()) / 1000,
              message: 'Optimization Finished',
            },
          });
        } catch (err: any) {
          console.error('[Workflow] Optimization pass failed:', err);
          await prisma.workflowLog.update({
            where: { id: optLog.id },
            data: {
              status: 'FAILED',
              message: `Optimization failed: ${err.message}`,
            },
          });
          break;
        }
      }

      if (iteration >= maxIterations && lastReport && lastReport.overallScore < targetScore) {
        await this.logAIMessage(
          sessionId,
          'OPTIMIZATION_STOPPED',
          `Stopped: Maximum iterations reached (${maxIterations})`,
        );
      }

      // One final check to make sure "Checking ATS Again" completes if it is in progress, or do a final run
      const finalCheckStart = new Date();
      const finalCheckLog = await this.logWorkflowStep(
        sessionId,
        'Checking ATS Again',
        'Running final ATS verification',
        'IN_PROGRESS',
        { startedAt: finalCheckStart },
      );

      let finalReport = lastReport;
      try {
        finalReport = analyzeATS(currentResume, jd);
        const finalCheckEnd = new Date();
        await prisma.workflowLog.update({
          where: { id: finalCheckLog.id },
          data: {
            status: 'COMPLETED',
            completedAt: finalCheckEnd,
            duration: (finalCheckEnd.getTime() - finalCheckStart.getTime()) / 1000,
            message: `Final ATS Score: ${finalReport.overallScore}`,
          },
        });
      } catch (err) {
        console.error('[Workflow] Final ATS check failed:', err);
      }

      // Perform strict validation on finalResumeJson (Part 15)
      try {
        const allBullets = new Set<string>();
        const experiences = currentResume.experiences || [];
        const projects = currentResume.projects || [];

        for (const exp of experiences) {
          for (const b of exp.bulletPoints || []) {
            const cleanB = b.trim().toLowerCase();
            if (allBullets.has(cleanB)) {
              throw new Error(`Duplicate bullet point detected: "${b}"`);
            }
            allBullets.add(cleanB);
          }
          if (!exp.role || exp.role.trim() === '') throw new Error('Experience role cannot be empty');
          if (!exp.companyName || exp.companyName.trim() === '') throw new Error('Experience company name cannot be empty');
        }

        for (const proj of projects) {
          for (const b of proj.bulletPoints || []) {
            const cleanB = b.trim().toLowerCase();
            if (allBullets.has(cleanB)) {
              throw new Error(`Duplicate bullet point detected in projects: "${b}"`);
            }
            allBullets.add(cleanB);
          }
          if (!proj.name || proj.name.trim() === '') throw new Error('Project name cannot be empty');
        }

        if (!currentResume.summary || currentResume.summary.trim() === '') {
          throw new Error('Professional summary cannot be empty');
        }
      } catch (validationErr: any) {
        console.error('[Workflow] Resume validation failed:', validationErr.message);
        throw validationErr;
      }

      finalResumeJson = currentResume;

      // Now compile PDF and save version
      const finalizingStart = new Date();
      const finalizingLog = await this.logWorkflowStep(
        sessionId,
        'Generating PDF',
        'Compiling XeLaTeX and uploading PDF to storage',
        'IN_PROGRESS',
        { startedAt: finalizingStart },
      );

      let latexCode: string | undefined = undefined;
      let pdfUrl: string | undefined = undefined;

      try {
        const session = await prisma.generationSession.findUnique({
          where: { id: sessionId },
        });
        if (session) {
          const profile = await prisma.profile.findUnique({
            where: { userId: session.userId },
            include: { socialLinks: true } as any,
          });

          const { templateEngineService } = await import('../../templates');
          const rendered = await templateEngineService.render(
            finalResumeJson,
            session.selectedTemplateId || 'tpl-jake',
            profile,
          );
          latexCode = rendered;

          const { latexService } = await import('../../pdf/latex.service');
          const pdfBuffer = await latexService.compile(rendered);

          try {
            const { uploadObject } = await import('../../storage/s3');
            const crypto = await import('crypto');
            const storageKey = `generated-resumes/${session.userId}/${sessionId}-v-opt-${crypto.randomUUID()}-resume.pdf`;
            await uploadObject(storageKey, pdfBuffer, 'application/pdf');
            pdfUrl = storageKey;
            await this.logAIMessage(sessionId, 'PDF_GENERATED', 'PDF Generated');
          } catch (uploadErr: any) {
            console.error('[Workflow] PDF compiled but S3 upload failed. PDF will not be available until re-rendered:', uploadErr.message || uploadErr);
          }
        }
      } catch (err: any) {
        console.error('[Workflow] Failed to compile PDF on workflow completion:', err.message || err);
      }

      const finalizingEnd = new Date();
      await prisma.workflowLog.update({
        where: { id: finalizingLog.id },
        data: {
          status: 'COMPLETED',
          completedAt: finalizingEnd,
          duration: (finalizingEnd.getTime() - finalizingStart.getTime()) / 1000,
          message: 'Finalized optimized resume',
        },
      });

      // Save final result in ResumeVersion using a retry loop for race safety
      let resumeVersion;
      let attempts = 0;
      while (attempts < 5) {
        const maxVersion = await prisma.resumeVersion.findFirst({
          where: { sessionId },
          orderBy: { versionNo: 'desc' },
          select: { versionNo: true },
        });
        const nextVersionNo = (maxVersion?.versionNo ?? 0) + 1;
        try {
          resumeVersion = await prisma.resumeVersion.create({
            data: {
              sessionId,
              versionNo: nextVersionNo,
              resumeJson: finalResumeJson as any,
              label: `Version ${nextVersionNo}`,
              latexCode,
              pdfUrl,
            },
          });
          break; // Success!
        } catch (err: any) {
          if (err.code === 'P2002') {
            attempts++;
            continue;
          }
          throw err;
        }
      }

      if (!resumeVersion) {
        throw new Error('Failed to create resume version due to persistent conflicts');
      }

      // NOW write all intermediate ATSRun records linked to this resumeVersion!
      for (const run of runsToSave) {
        await prisma.aTSRun.create({
          data: {
            generationSessionId: sessionId,
            resumeVersionId: resumeVersion.id,
            ...run,
          },
        });
      }

      const durationMs = Date.now() - startTime;
      const totalTokens = trackingClient.inputTokens + trackingClient.outputTokens;

      // Save metadata and usage messages
      await this.logAIMessage(sessionId, 'TOKEN_USAGE', 'Generation Token Usage Metrics', {
        inputTokens: trackingClient.inputTokens,
        outputTokens: trackingClient.outputTokens,
        totalTokens,
      });

      await this.logAIMessage(sessionId, 'EXECUTION_TIME', 'Generation Execution Time', {
        durationMs,
        durationSeconds: Math.round(durationMs / 100) / 10,
      });

      // Update session status to COMPLETED
      await prisma.generationSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          currentStep: 'Completed',
        },
      });

      await this.logAIMessage(sessionId, 'COMPLETED', 'Completed');

      return {
        ...finalResumeJson,
        versionId: resumeVersion.id,
      };
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const completedAt = new Date();

      // Mark current node log as failed if running
      if (trackingClient.currentNode) {
        const nodeName = trackingClient.currentNode;
        const friendlyStep = friendlyNodeMapping[nodeName] || nodeName;
        const logInfo = nodeLogs[nodeName];
        if (logInfo) {
          const duration = (completedAt.getTime() - logInfo.startedAt.getTime()) / 1000;
          const retryCount = Math.max(0, (trackingClient.nodeCallCounts[nodeName] || 1) - 1);
          await prisma.workflowLog.update({
            where: { id: logInfo.id },
            data: {
              status: 'FAILED',
              completedAt,
              duration,
              retryCount,
              errorMessage: errorMsg,
              message: `Failed ${friendlyStep.toLowerCase()}: ${errorMsg}`,
            },
          });
        }
      }

      // If Reading Profile is still in progress, mark it failed
      await prisma.workflowLog.updateMany({
        where: { sessionId, stepName: 'Reading Profile', status: 'IN_PROGRESS' },
        data: {
          status: 'FAILED',
          completedAt,
          errorMessage: errorMsg,
          message: `Profile validation failed: ${errorMsg}`,
        },
      });

      // If Finalizing is still in progress, mark it failed
      await prisma.workflowLog.updateMany({
        where: { sessionId, stepName: 'Finalizing', status: 'IN_PROGRESS' },
        data: {
          status: 'FAILED',
          completedAt,
          errorMessage: errorMsg,
          message: `Finalizing failed: ${errorMsg}`,
        },
      });

      // Save failure info to session in DB
      await prisma.generationSession.update({
        where: { id: sessionId },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      });

      await this.logAIMessage(sessionId, 'ERROR', `Resume generation failed: ${errorMsg}`);

      throw error;
    } finally {
      // Restore original LLM client
      setLLMClient(originalClient);
    }
  }

  private async readMasterProfile(userId: string, sessionId: string) {
    let profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId, fullName: 'New User' },
      });
    }
    await this.logWorkflowStep(
      sessionId,
      'Master Profile',
      `Loaded profile for ${profile.fullName}`,
      'COMPLETED',
    );
    return profile;
  }

  private async readCompanyInfo(sessionId: string) {
    const session = await prisma.generationSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { company: true },
    });

    const company = {
      id: session.company?.id || undefined,
      name: session.companyName,
      description: session.company?.description || undefined,
      industry: session.company?.industry || undefined,
    };

    await this.logWorkflowStep(
      sessionId,
      'Company Info',
      `Loaded company: ${company.name}`,
      'COMPLETED',
    );
    return company;
  }

  private parseJobDescription(raw: string): ParsedJobDescription {
    const lines = raw.split('\n').map((line) => line.trim());

    const parsed: ParsedJobDescription = {
      raw,
      title: undefined,
      company: undefined,
      location: undefined,
      requirements: [],
      responsibilities: [],
      keywords: [],
    };

    let currentSection = '';
    for (const line of lines) {
      if (
        line.toLowerCase().includes('requirement') ||
        line.toLowerCase().includes('qualification') ||
        line.toLowerCase().includes('require:')
      ) {
        currentSection = 'requirements';
      } else if (
        line.toLowerCase().includes('responsibilit') ||
        line.toLowerCase().includes('respons:')
      ) {
        currentSection = 'responsibilities';
      } else if (line.length > 0) {
        if (currentSection === 'requirements') {
          parsed.requirements.push(line);
        } else if (currentSection === 'responsibilities') {
          parsed.responsibilities.push(line);
        }
      }
    }

    return parsed;
  }

  private extractKeywords(jobDescription: ParsedJobDescription): string[] {
    const text = [
      jobDescription.raw,
      ...jobDescription.requirements,
      ...jobDescription.responsibilities,
    ]
      .join(' ')
      .toLowerCase();

    // Simple keyword extraction: technical terms, common skills
    const keywords = new Set<string>();

    // Extract potential keywords (words after ".", "," or standalone)
    const wordMatches = text.match(/\b[a-z]+(?:\+\+|#)?\b/g);
    const words: string[] = wordMatches || [];

    // Common tech keywords to look for
    const techKeywords = [
      'javascript',
      'typescript',
      'python',
      'java',
      'c#',
      'go',
      'rust',
      'react',
      'vue',
      'angular',
      'nodejs',
      'node.js',
      'express',
      'django',
      'flask',
      'spring',
      'sql',
      'mongodb',
      'postgresql',
      'mysql',
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes',
      'git',
      'rest',
      'graphql',
      'api',
      'frontend',
      'backend',
      'full-stack',
      'fullstack',
      'html',
      'css',
      'testing',
      'jest',
      'agile',
      'scrum',
      'linux',
      'windows',
      'mac',
      'ci/cd',
      'devops',
    ];

    for (const keyword of techKeywords) {
      if (words.includes(keyword)) {
        keywords.add(keyword);
      }
    }

    // Extract noun phrases (very basic - look for capitalized words in original text)
    const phraseMatches = jobDescription.raw.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    for (const phrase of phraseMatches) {
      if (phrase.length > 2) {
        keywords.add(phrase);
      }
    }

    return Array.from(keywords).slice(0, 30); // Limit to 30 keywords
  }

  private async readExperiences(profileId: string, sessionId: string) {
    const experiences = await prisma.experience.findMany({
      where: { profileId },
      orderBy: { startDate: 'desc' },
    });

    await this.logWorkflowStep(
      sessionId,
      'Read Experiences',
      `Loaded ${experiences.length} experiences`,
      'COMPLETED',
    );

    return experiences;
  }

  private async readProjects(profileId: string, sessionId: string) {
    const projects = await prisma.project.findMany({
      where: { profileId },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });

    await this.logWorkflowStep(
      sessionId,
      'Read Projects',
      `Loaded ${projects.length} projects`,
      'COMPLETED',
    );

    return projects;
  }

  private async readSkills(profileId: string, sessionId: string) {
    const skills = await prisma.skill.findMany({
      where: { profileId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    await this.logWorkflowStep(
      sessionId,
      'Read Skills',
      `Loaded ${skills.length} skills`,
      'COMPLETED',
    );

    return skills;
  }

  private async readEducations(profileId: string) {
    return prisma.education.findMany({
      where: { profileId },
      orderBy: { startDate: 'desc' },
    });
  }

  private async readCertificates(profileId: string) {
    return prisma.certificate.findMany({
      where: { profileId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  private async readAchievements(profileId: string) {
    return prisma.achievement.findMany({
      where: { profileId },
      orderBy: { date: 'desc' },
    });
  }

  private rankExperiences(
    experiences: Awaited<ReturnType<typeof prisma.experience.findMany>>,
    keywords: string[],
  ): ResumeContextExperience[] {
    return experiences.map((exp) => ({
      id: exp.id,
      companyName: exp.companyName,
      role: exp.role,
      location: exp.location || undefined,
      startDate: exp.startDate || undefined,
      endDate: exp.endDate || undefined,
      isCurrent: exp.isCurrent,
      description: exp.description || undefined,
      technologiesUsed: exp.technologiesUsed,
      achievements: exp.achievements,
      relevanceScore: this.calculateRelevance(
        `${exp.role} ${exp.companyName} ${exp.description || ''} ${exp.technologiesUsed.join(' ')}`,
        keywords,
      ),
    }));
  }

  private rankProjects(
    projects: Awaited<ReturnType<typeof prisma.project.findMany>>,
    keywords: string[],
  ): ResumeContextProject[] {
    return projects.map((proj) => ({
      id: proj.id,
      name: proj.name,
      description: proj.description || undefined,
      role: proj.role || undefined,
      stack: proj.stack,
      impact: proj.impact || undefined,
      achievements: proj.achievements,
      featured: proj.featured,
      relevanceScore: this.calculateRelevance(
        `${proj.name} ${proj.description || ''} ${proj.stack.join(' ')} ${proj.role || ''}`,
        keywords,
      ),
    }));
  }

  private rankSkills(
    skills: Awaited<ReturnType<typeof prisma.skill.findMany>>,
    keywords: string[],
  ): ResumeContextSkill[] {
    return skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      level: skill.level || undefined,
      relevanceScore: this.calculateRelevance(skill.name, keywords),
    }));
  }

  private calculateRelevance(text: string, keywords: string[]): number {
    if (keywords.length === 0) return 0.5; // Default score if no keywords

    const lowerText = text.toLowerCase();
    const matches = keywords.filter((keyword) => lowerText.includes(keyword.toLowerCase()));

    return Math.min(1, matches.length / keywords.length);
  }
}

export const generationSessionService = new GenerationSessionService();
