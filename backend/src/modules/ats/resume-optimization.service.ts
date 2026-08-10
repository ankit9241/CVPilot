import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { GeneratedResume } from '../../ai/types';
import { ATSReport } from './ats.types';
import { calculateYoE } from '../../utils/date';

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
    const bd = report.scoreBreakdown;

    const feedback: any = {
      overallScore: report.overallScore,
      scoreBreakdown: bd,
      missingKeywords: report.missingKeywords || [],
      resumeTooLong: false,
      removeLowestPriorityProject: false,
      maxProjects: 3,
      maxExperiences: 3,
      maxBullets: 3,
    };

    let needsOptimization = false;

    // 1. Check overall score
    if (report.overallScore < targetScore) {
      needsOptimization = true;
    }

    // 2. Check weakest scoring categories for targeted fixes
    if (bd.keywordMatch < 18) { // < 60% of max 30
      feedback.needsKeywordWork = true;
      needsOptimization = true;
    }
    if (bd.skillsMatch < 12) { // < 60% of max 20
      feedback.needsSkillWork = true;
      needsOptimization = true;
    }
    if (bd.impact < 3) { // < 60% of max 5
      feedback.needsImpactWork = true;
      needsOptimization = true;
    }

    // 3. Check page constraints
    const experiences = resumeJson.experiences || [];
    const projects = resumeJson.projects || [];
    const skills = resumeJson.skills || [];
    const summary = resumeJson.summary || '';

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

    const summaryLines = summary.split(/[.\n]+/).filter((line) => line.trim().length > 0).length;
    if (summaryLines > 3) {
      feedback.resumeTooLong = true;
      needsOptimization = true;
    }

    // 4. Missing keywords
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
    const bd = report.scoreBreakdown;

    const prompt = `You are an expert resume optimizer. You receive a resume, an ATS report, and a job description. Your job is to fix real weaknesses identified by the ATS — not to blindly increase keyword density.

=== INPUTS ===
Job Description:
${resumeContext.originalJobDescription}

Current Resume JSON:
${JSON.stringify(resumeJson, null, 2)}

ATS Report:
- Overall: ${report.overallScore}/100
- Parseability: ${bd.parseability}/5
- Formatting: ${bd.formatting}/5
- Keyword Match: ${bd.keywordMatch}/30
- Skills Match: ${bd.skillsMatch}/20
- Experience Relevance: ${bd.experienceRelevance}/20
- Education: ${bd.education}/5
- Grammar & Spelling: ${bd.grammarSpelling}/5
- Readability: ${bd.readability}/5
- Impact & Quantification: ${bd.impact}/5
- Missing Keywords: ${JSON.stringify(report.missingKeywords)}
- Warnings: ${JSON.stringify(report.warnings.slice(0, 10))}

Target feedback:
${JSON.stringify(feedback, null, 2)}

=== RULES ===
- Do not blindly increase keywords. Fix only real weaknesses.
- Never stuff keywords — natural inclusion only.
- Never invent experience, credentials, projects, or metrics.
- Maintain the exact same JSON schema and key names as the input.

=== PRIORITIES (in order) ===
1. Missing required skills — integrate naturally into summary or experience bullets.
2. Weak summary — rewrite to be punchy, 30–45 words, role + tech + impact.
3. Long bullets — trim to 15–20 words. Remove filler, merge repetitive ideas.
4. Poor readability — replace passive voice, remove weak verbs, add action verbs.
5. Missing quantified impact — strengthen metrics language where factual.
6. Weak action verbs — replace "worked on", "responsible for", "helped" with strong verbs.

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
    return calculateYoE(experiences);
  }
}

export const resumeOptimizationService = new ResumeOptimizationService();
