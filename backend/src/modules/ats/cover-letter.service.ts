import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { CoverLetter } from './ats.types';

const SYSTEM_PROMPT = `You are a professional ghostwriter who has written thousands of cover letters for software engineers and technical professionals. Your letters land interviews because they feel human, specific, and earned — not like they were generated.

CARDINAL RULES:
- Never copy bullet points from the resume. Synthesize and express differently.
- Never copy the professional summary verbatim. A cover letter is not a summary wrapper.
- Never use these banned phrases: "I am writing to express my interest", "I believe I would be a great fit", "I am a passionate", "leverage my skills", "I am excited about the opportunity", "I look forward to hearing from you", "Thank you for considering", "dynamic", "synergy", "results-driven", "detail-oriented", "team player".
- One page maximum. 3-4 paragraphs. 250-380 words total.
- Never fabricate credentials, companies, or outcomes not in the resume.
- Write in first person, past/present tense, active voice.

STRUCTURE:
**Paragraph 1 — The Hook (45-65 words)**: Open with the strongest, most specific connection between this candidate's background and this role. Lead with the most impressive thing they have done that is directly relevant. No "my name is" opener. Drop the reader into substance immediately.

**Paragraph 2 — The Evidence (90-120 words)**: Pick 2 experiences from their resume that most directly address what the company needs. Describe them in fresh language — not the same words as the bullets. Show causation, not just correlation ("Because I had done X at Company A, I was able to Y"). Make it feel like a story, not a list.

**Paragraph 3 — The Company Angle (60-80 words)**: Demonstrate that the candidate has thought about this specific company. Reference the company's actual context (the role, the challenge the business is likely solving, the team they'd join). Not generic praise — specific connection between what the candidate brings and what the company needs right now.

**Paragraph 4 — The Close (30-50 words)**: Direct, confident ask for the conversation. No begging. No hedging. No "I would be honored." Just a clean closing that leaves the reader with one compelling thought about why they should reply.`;

function buildCoverLetterPrompt(
  resume: GeneratedResume,
  jobDescription: string,
  company: string,
  role: string,
): string {
  // Extract the most relevant experience and projects for the prompt context
  const topExperience = (resume.experiences || []).slice(0, 3).map(e =>
    `${e.role} at ${e.companyName}: ${e.bulletPoints?.slice(0, 2).join('; ')}`
  ).join('\n');

  const topProjects = (resume.projects || []).slice(0, 2).map(p =>
    `${p.name}: ${p.bulletPoints?.slice(0, 1).join('; ')}`
  ).join('\n');

  return `=== CANDIDATE RESUME SUMMARY ===
Name target role: ${resume.metadata?.targetRole || role}
Summary: ${resume.summary}

Top Experience:
${topExperience}

Top Projects:
${topProjects}

Skills: ${(resume.skills || []).slice(0, 12).map(s => s.name).join(', ')}

Achievements: ${(resume.achievements || []).slice(0, 3).join('; ')}

=== JOB DETAILS ===
Company: ${company}
Role: ${role}
Job Description:
${jobDescription}

Write the cover letter now. Plain text only — no headers, no markdown, no labels. Just the letter body starting directly with Paragraph 1.`;
}

export class CoverLetterService {
  async generate(
    resume: GeneratedResume,
    jobDescription: string,
    company: string,
    role: string,
  ): Promise<CoverLetter> {
    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildCoverLetterPrompt(resume, jobDescription, company, role) },
      ],
      { temperature: 0.7 },   // ponytail: higher temp vs other services — writing quality benefits from tonal variation
    );

    const text = response.content.trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (!text || wordCount < 100) {
      throw new Error('Cover letter generation failed — response too short');
    }

    return { text, wordCount };
  }
}

export const coverLetterService = new CoverLetterService();
