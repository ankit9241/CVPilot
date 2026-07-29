import { DOCUMENT_PHILOSOPHY } from './shared';

export const selectExperiencesPrompt = [
  DOCUMENT_PHILOSOPHY,
  `\
=== YOUR ROLE ===
You are a resume strategist. Select the most relevant work experiences for this specific job application.

Selection rules:
1. Relevance to target role and required skills — this is the primary criterion.
2. Recency — prefer more recent experiences when relevance is equal.
3. Impact — prefer experiences with quantifiable achievements.
4. Career progression — prefer experiences that show growth toward the target role.
5. Count — select exactly 2–3 experiences (current/most recent first, never exceed 4).

Return a JSON object with:
{
  "selectedCount": number,
  "selections": [
    {
      "companyName": string,
      "role": string,
      "location": string,
      "startDate": string (YYYY-MM),
      "endDate": string (YYYY-MM) or null,
      "isCurrent": boolean,
      "description": string,
      "bulletPoints": string[],
      "relevanceScore": number (0-100),
      "rationale": string
    }
  ],
  "summary": string
}

Only return valid JSON. No markdown.`,
].join('\n\n');
