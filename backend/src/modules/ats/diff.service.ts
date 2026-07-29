import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { DiffReport, SectionDiff, DiffItem } from './ats.types';

const SYSTEM_PROMPT = `You are a senior technical recruiter and resume editor. You compare two versions of the same resume and identify every meaningful content change — the kind of changes that would actually move the needle with a hiring manager.

You receive two resume JSONs: an older version and a newer version. Compare them section by section.

SECTIONS TO COMPARE:
1. Summary
2. Experience (compare each role's bullets)
3. Projects (compare each project's bullets)
4. Skills
5. Achievements
6. Education

RULES:
- Ignore pure formatting changes (whitespace, punctuation style, capitalization). Only flag content changes.
- If a section has zero meaningful changes, omit it from the output entirely.
- For each change, quote the exact text from both versions (Previous Version → Improved Version).
- "reason" explains what changed and why it's better (or worse). Be specific: "Stronger action verb" is weak. "Changed 'Worked on' to 'Architected' — conveys ownership and technical leadership" is strong.
- "expectedBenefit" explains the recruiter/hiring-manager impact. One sentence.
- Compare bullet points by position within each experience/project. If bullets were reordered, compare by content match.
- If a bullet was split into two or vice versa, show the original → both new bullets.
- If content was added (new bullet, new skill, new project), show it as a change with empty previousVersion.
- If content was removed, show it as a change with empty improvedVersion and explain why removal improves the resume.

OUTPUT: A JSON object with "sections" array. Each section has "section" (name) and "changes" array of DiffItem objects. Include "totalChanges" as a count of all changes across sections.`;

function buildDiffPrompt(oldVersion: GeneratedResume, newVersion: GeneratedResume): string {
  return `=== OLDER VERSION (V1) ===
${JSON.stringify(oldVersion, null, 2)}

=== NEWER VERSION (V2) ===
${JSON.stringify(newVersion, null, 2)}

Compare these two resume versions. Identify every meaningful content change. Output ONLY valid JSON — no markdown fences, no commentary.`;
}

export class DiffService {
  /**
   * Compare two resume versions and report meaningful content changes.
   */
  async diffResumes(oldVersion: GeneratedResume, newVersion: GeneratedResume): Promise<DiffReport> {
    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildDiffPrompt(oldVersion, newVersion) },
      ],
      { json: true, temperature: 0.1 },
    );

    const parsed = parseJSON<DiffReport>(response.content);
    if (parsed && Array.isArray(parsed.sections)) {
      const sections = parsed.sections
        .filter((s: SectionDiff) => s.section && Array.isArray(s.changes) && s.changes.length > 0)
        .map((s: SectionDiff) => ({
          section: s.section,
          changes: s.changes.filter((c: DiffItem) =>
            c.previousVersion !== undefined || c.improvedVersion !== undefined,
          ),
        }));

      return {
        totalChanges: sections.reduce((sum: number, s: SectionDiff) => sum + s.changes.length, 0),
        sections,
      };
    }

    throw new Error('Failed to parse diff response');
  }
}

export const diffService = new DiffService();
