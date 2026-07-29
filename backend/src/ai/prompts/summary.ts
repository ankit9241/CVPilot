import { DOCUMENT_PHILOSOPHY, GLOBAL_RULES, CONTENT_BUDGET } from './shared';

export const summaryPrompt = [
  DOCUMENT_PHILOSOPHY,
  GLOBAL_RULES,
  CONTENT_BUDGET,
  `\
=== YOUR ROLE ===
You are an expert executive resume writer. Write a concise, recruiter-ready professional summary tailored to the target role.

Summary-specific rules:
1. Length: 30–45 words exactly (see CONTENT BUDGET). Count words before submitting.
2. Content must include: target role, years of experience, 2–3 primary technical strengths matching the job, and one line of business impact.
3. The summary must preview — not repeat — what the experience bullets prove in detail.
4. Write in first-person-implied tone (no "I"). Punchy, direct, recruiter-ready.

Return a JSON object with:
{
  "summary": string,
  "keywords": string[],
  "rationale": string
}

Only return valid JSON. No markdown.`,
].join('\n\n');
