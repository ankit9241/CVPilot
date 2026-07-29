import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';

const SYSTEM_PROMPT = `You are an elite resume strategist who has helped 10,000+ candidates land interviews at FAANG, Big Tech, and high-growth startups. You don't just "optimize" resumes — you rebuild them to tell a targeted story for a specific role.

You receive a full resume and a job description. Your job: make this resume feel like it was written specifically for this job — without removing any experience, project, skill, achievement, education, or certificate.

WHAT YOU MAY DO:
- Reorder experiences so the most relevant ones come first
- Reorder projects so the most relevant ones come first
- Reorder skills so the most relevant categories and items come first
- Reorder achievements so the most relevant ones come first
- Rewrite the summary to lead with the most relevant qualifications for this role
- Reword bullet points to use terminology and emphasis from the job description
- Adjust emphasis: make relevant experience sound stronger, keep less-relevant experience factual
- Add natural keyword integration from the JD where it fits (never stuff)

WHAT YOU MUST NEVER DO:
- Never remove any experience entry, even if it seems irrelevant
- Never remove any project, skill, certificate, achievement, or education entry
- Never fabricate experience, metrics, or technologies that aren't in the original
- Never invent bullet points — only rewrite existing ones for emphasis and relevance

RANKING RULES:
1. **Experiences**: Rank by direct relevance to the JD. Most relevant role first. If two are equally relevant, more recent comes first.
2. **Projects**: Rank by technology overlap and domain relevance to the JD. Most relevant first.
3. **Skills**: Reorder so the most JD-relevant skills appear first within each category. Add a new category "Matched Skills" at the top with skills that directly appear in the JD.
4. **Achievements**: Rank by relevance to the role's requirements. Most relevant first.
5. **Summary**: Rewrite to open with the exact role title from the JD, mention the most relevant tech stack, and lead with the strongest qualification. 35-50 words.

OUTPUT: Return the complete resume JSON with the same schema. Every field present in the input MUST be present in the output. No omissions.`;

function buildTailoringPrompt(resume: GeneratedResume, jobDescription: string): string {
  return `=== CURRENT RESUME ===
${JSON.stringify(resume, null, 2)}

=== TARGET JOB DESCRIPTION ===
${jobDescription}

Reorder, reword, and emphasize. Keep everything. Output ONLY the tailored resume JSON — no markdown fences, no commentary.`;
}

export class TailoringService {
  /**
   * Reorder, reword, and emphasize resume content by JD relevance.
   * Never removes content — only changes ordering, wording, and emphasis.
   */
  async tailorResume(resume: GeneratedResume, jobDescription: string): Promise<GeneratedResume> {
    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildTailoringPrompt(resume, jobDescription) },
      ],
      { json: true, temperature: 0.3 },
    );

    const parsed = parseJSON<GeneratedResume>(response.content);
    if (parsed && parsed.experiences && parsed.summary) {
      // Validate: ensure no content was dropped
      return this.validateNoDroppedContent(resume, parsed);
    }

    throw new Error('Failed to parse tailoring response');
  }

  /**
   * Safety net: if the LLM dropped any entry, fall back to the original.
   */
  private validateNoDroppedContent(original: GeneratedResume, tailored: GeneratedResume): GeneratedResume {
    // Check experience count — never reduce
    if ((tailored.experiences?.length || 0) < (original.experiences?.length || 0)) {
      console.warn('[Tailoring] LLM dropped experiences — using original ordering');
      return original;
    }

    // Check project count — never reduce
    if ((tailored.projects?.length || 0) < (original.projects?.length || 0)) {
      console.warn('[Tailoring] LLM dropped projects — using original ordering');
      return original;
    }

    // Check skill count — never reduce
    if ((tailored.skills?.length || 0) < (original.skills?.length || 0)) {
      console.warn('[Tailoring] LLM dropped skills — using original ordering');
      return original;
    }

    // Check achievement count — never reduce
    if ((tailored.achievements?.length || 0) < (original.achievements?.length || 0)) {
      console.warn('[Tailoring] LLM dropped achievements — using original ordering');
      return original;
    }

    // Check education count — never reduce
    if ((tailored.education?.length || 0) < (original.education?.length || 0)) {
      console.warn('[Tailoring] LLM dropped education — using original ordering');
      return original;
    }

    // Check certificate count — never reduce
    if ((tailored.certificates?.length || 0) < (original.certificates?.length || 0)) {
      console.warn('[Tailoring] LLM dropped certificates — using original ordering');
      return original;
    }

    // Validate all original company names are present (experiences not swapped out)
    const originalCompanies = new Set(original.experiences.map(e => e.companyName.toLowerCase()));
    const tailoredCompanies = new Set(tailored.experiences.map(e => e.companyName.toLowerCase()));
    for (const company of originalCompanies) {
      if (!tailoredCompanies.has(company)) {
        console.warn(`[Tailoring] LLM removed experience at "${company}" — using original`);
        return original;
      }
    }

    // Validate all original project names are present
    const originalProjects = new Set(original.projects.map(p => p.name.toLowerCase()));
    const tailoredProjects = new Set(tailored.projects.map(p => p.name.toLowerCase()));
    for (const name of originalProjects) {
      if (!tailoredProjects.has(name)) {
        console.warn(`[Tailoring] LLM removed project "${name}" — using original`);
        return original;
      }
    }

    // Validate all original skill names are present
    const originalSkills = new Set(original.skills.map(s => s.name.toLowerCase()));
    const tailoredSkills = new Set(tailored.skills.map(s => s.name.toLowerCase()));
    for (const skill of originalSkills) {
      if (!tailoredSkills.has(skill)) {
        console.warn(`[Tailoring] LLM removed skill "${skill}" — using original`);
        return original;
      }
    }

    // Preserve metadata from original (don't let LLM overwrite generation metadata)
    tailored.metadata = { ...original.metadata };

    return tailored;
  }
}

export const tailoringService = new TailoringService();
