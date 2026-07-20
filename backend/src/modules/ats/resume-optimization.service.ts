import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { GeneratedResume } from '../../ai/types';
import { ATSReport } from './ats.types';

export class ResumeOptimizationService {
  /**
   * Compresses a verbose GeneratedResume JSON based on experience YOE.
   */
  async compressResume(resumeContext: any, resumeJson: GeneratedResume): Promise<GeneratedResume> {
    const experiences = resumeJson.experiences || [];
    const yoe = this.calculateYoE(experiences);
    const pageBudget = yoe <= 7 ? 1 : 2;

    const prompt = `You are an expert technical resume editor. Your job is to compress a verbose generated resume to match strict recruiter constraints and format rules.

Here is the candidate's total experience: ${yoe} years.
Target Page Budget: ${pageBudget} page(s).

CRITICAL COMPRESSION CONSTRAINTS:
1. SELECT ONLY:
   - Max 2 Experiences (exactly 2 if total experience <= 7 years).
   - Max 2 Projects (exactly 2 if total experience <= 7 years).
   - Max 12-15 Skills (exactly 12-15 if total experience <= 7 years).
   - Max 1 Certificate and Max 2 Achievements.
2. PROFESSIONAL SUMMARY:
   - Compress the summary to STRICTLY between 35 and 45 words.
   - Include: Target Role, Years of Experience, Primary Tech stack, Domain, and Strengths.
3. BULLET POINTS:
   - Max 3 bullets per experience, and max 3 bullets per project.
   - Every bullet MUST follow: Action Verb -> Technology/Tool used -> Quantifiable Impact/Result (max 22 words per bullet).
   - Collapse and combine minor accomplishments, and keep only the strongest metrics.
4. REMOVE DUPLICATION:
   - Never repeat the company name, project name, or role name in bullet points.
   - Never repeat technologies listed in headers in the bullets unless part of a specific project accomplishment.
   - Remove long introductory descriptions from experiences and projects entirely; keep ONLY bullet points.
5. NEVER fabricate or invent experiences, credentials, projects, or metrics.

Input resume:
${JSON.stringify(resumeJson, null, 2)}

Respond with the compressed resume JSON. The output MUST follow the exact same JSON schema as the input resume, with no additional text or explanations.`;

    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: 'You are a JSON-only resume compression assistant.' },
        { role: 'user', content: prompt },
      ],
      { json: true, temperature: 0.1 }
    );

    try {
      const parsed = parseJSON<GeneratedResume>(response.content);
      if (parsed && parsed.experiences) {
        return parsed;
      }
    } catch (err) {
      console.error('[Compression] Failed to parse compressed JSON. Falling back to original.', err);
    }
    return resumeJson;
  }

  /**
   * Evaluates if the resume requires optimization based on target score and constraints.
   */
  shouldOptimize(
    resumeContext: any,
    resumeJson: GeneratedResume,
    report: ATSReport,
    targetScore: number
  ): { needsOptimization: boolean; feedback: any } {
    const feedback: any = {
      overallScore: report.overallScore,
      missingKeywords: report.missingKeywords || [],
      resumeTooLong: false,
      removeLowestPriorityProject: false,
      maxProjects: 3,
      maxExperiences: 3,
      maxBullets: 3,
    };

    let needsOptimization = false;

    // 1. Check score
    if (report.overallScore < targetScore) {
      needsOptimization = true;
    }

    // 2. Check page constraints
    const experiences = resumeJson.experiences || [];
    const projects = resumeJson.projects || [];
    const skills = resumeJson.skills || [];
    const summary = resumeJson.summary || '';
    const yoe = this.calculateYoE(experiences);

    if (experiences.length > 3) {
      feedback.resumeTooLong = true;
      feedback.maxExperiences = 2;
      needsOptimization = true;
    }
    if (projects.length > 3) {
      feedback.resumeTooLong = true;
      feedback.maxProjects = 2;
      feedback.removeLowestPriorityProject = true;
      needsOptimization = true;
    }
    if (skills.length > 15) {
      feedback.resumeTooLong = true;
      needsOptimization = true;
    }

    // Check bullet counts
    for (const exp of experiences) {
      if (exp.bulletPoints && exp.bulletPoints.length > 3) {
        feedback.resumeTooLong = true;
        needsOptimization = true;
        break;
      }
    }
    for (const proj of projects) {
      if (proj.bulletPoints && proj.bulletPoints.length > 3) {
        feedback.resumeTooLong = true;
        needsOptimization = true;
        break;
      }
    }

    // Check summary lines
    const summaryLines = summary.split(/[.\n]+/).filter((line) => line.trim().length > 0).length;
    if (summaryLines > 3) {
      feedback.resumeTooLong = true;
      needsOptimization = true;
    }

    // 3. Missing keywords check
    if (report.missingKeywords && report.missingKeywords.length > 0) {
      needsOptimization = true;
    }

    return { needsOptimization, feedback };
  }

  /**
   * Runs an LLM rewrite optimization pass based on ATS feedback.
   */
  async optimizeResume(
    resumeContext: any,
    resumeJson: GeneratedResume,
    report: ATSReport,
    feedback: any
  ): Promise<GeneratedResume> {
    const prompt = `You are an expert technical resume optimization editor.
Your job is to optimize a candidate's resume based on detailed ATS report feedback to improve its match score.

Job Description:
${resumeContext.originalJobDescription}

Current Resume JSON:
${JSON.stringify(resumeJson, null, 2)}

ATS Report:
- Overall Score: ${report.overallScore}
- Missing Keywords: ${JSON.stringify(report.missingKeywords)}
- Suggestions: ${JSON.stringify(report.suggestions)}
- Warnings: ${JSON.stringify(report.warnings)}

Target structured feedback instructions:
${JSON.stringify(feedback, null, 2)}

CRITICAL OPTIMIZATION RULES:
1. ONLY improve weak sections listed in the suggestions/warnings or missing keywords.
2. PROFESSIONAL SUMMARY:
   - Keep the summary strictly under 45 words. Ensure it includes: Role, Years of experience, Primary tech, Domain, and Strengths.
3. BULLETS & ACHIEVEMENTS:
   - Enforce the STAR formula: Action Verb -> Technology -> Quantifiable Impact.
   - Max 3 bullets per experience, and max 3 bullets per project. Each bullet max 22 words.
   - Remove passive language (e.g., "worked on", "assisted").
4. REMOVE DUPLICATION:
   - Ensure there is absolutely no overlap between sections.
   - Delete experience and project introductory descriptions; use ONLY bullets.
5. NEVER invent or fabricate any experiences, credentials, projects, or metrics.
6. Maintain the exact same JSON schema and key names as the input.

Respond with the optimized resume JSON. Do not write any other explanation or text.`;

    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: 'You are a JSON-only resume optimization assistant.' },
        { role: 'user', content: prompt },
      ],
      { json: true, temperature: 0.1 }
    );

    try {
      const parsed = parseJSON<GeneratedResume>(response.content);
      if (parsed && parsed.experiences) {
        return parsed;
      }
    } catch (err) {
      console.error('[Optimization] Failed to parse optimized JSON. Falling back to input.', err);
    }
    return resumeJson;
  }

  /**
   * Helper to calculate Candidate total YoE
   */
  private calculateYoE(experiences: any[]): number {
    let totalMonths = 0;
    for (const exp of experiences) {
      const start = exp.startDate ? new Date(exp.startDate) : null;
      const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);

      if (start && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, diffMonths);
      }
    }
    return Math.round((totalMonths / 12) * 10) / 10;
  }
}

export const resumeOptimizationService = new ResumeOptimizationService();
