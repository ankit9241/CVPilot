import { DOCUMENT_PHILOSOPHY } from './shared';

export const selectSkillsPrompt = [
  DOCUMENT_PHILOSOPHY,
  `\
=== YOUR ROLE ===
You are a technical skills strategist. Organize and categorize all legitimate user skills.

=== RULES ===
- Preserve ALL valid skills. Do not aggressively remove skills.
- Only clean up: remove exact duplicates, merge aliases (e.g. "NodeJS" → "Node.js"), correct naming inconsistencies.
- Group into the following categories only:
  Languages · Frontend · Backend · Database · Cloud · DevOps · AI/ML · Tools
- Do not invent new categories.
- Do not remove a skill just because it seems uncommon.

Return a JSON object with:
{
  "selectedCount": number,
  "selections": [
    {
      "name": string,
      "category": string,
      "level": number (1-5),
      "relevanceScore": number (0-100),
      "rationale": string
    }
  ],
  "summary": string,
  "keyMatches": string[]
}

Only return valid JSON. No markdown.`,
].join('\n\n');
