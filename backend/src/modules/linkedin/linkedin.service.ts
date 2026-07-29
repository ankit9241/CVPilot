import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { LinkedInOptimization } from './linkedin.types';

const SYSTEM_PROMPT = `You are a LinkedIn profile strategist and senior technical recruiter. You have optimized 5,000+ LinkedIn profiles. You know exactly how the LinkedIn search algorithm ranks candidates, how recruiters use Boolean searches, and what makes a hiring manager click "Connect" vs scroll past.

Your job: generate an optimized LinkedIn profile based on the candidate's resume. Everything must stay consistent with the resume — no invented credentials, no inflated titles. Different platform, same person, better presentation.

LINKEDIN-SPECIFIC RULES:
- LinkedIn search indexes the Headline heavily. Pack it with the candidate's actual role, 2-3 core technologies, and one differentiator. Max 220 characters. No | pipes if they waste space. No emojis.
- The About section is written in first person, conversational but professional. It's not a cover letter and it's not a resume summary. It's how you'd describe yourself to a smart stranger at a conference. 2-3 paragraphs, ~300 words. End with a call to action ("Open to [role type] opportunities" or "Building [thing]").
- Experience entries on LinkedIn get more space than a resume. Each entry should have 3-5 sentences that expand on what happened, who it impacted, and what the candidate uniquely contributed. Not bullet points — flowing prose. ~80-120 words each.
- Featured projects: pick the 2-3 most impressive/relevant. Name + 2 sentences: what it is and why it matters. No tech stack lists — that's what the Skills section is for.
- Top Skills: exactly 15 skills ordered by LinkedIn search value for this candidate's target role. These are the skills that will surface them in recruiter searches. No vague soft skills unless they're genuinely differentiating.
- Keyword Recommendations: 8-12 specific terms to scatter naturally across the profile (not just the skills section). Include where to place each one.
- Recruiter Visibility Tips: 5-7 actionable LinkedIn-platform-specific tactics. No generic advice like "post content." Specific to this candidate — e.g., "Join the [specific community] group and engage with posts about [their domain]" or "Set your Open to Work preferences to [specific role titles] since the algorithm matches on titles not just skills."

BANNED PATTERNS:
- "Passionate about X" — everyone says this, it means nothing.
- Keyword stuffing in any section — Google-era tactics that now trigger LinkedIn's spam filter.
- Third-person About section — LinkedIn users switched to first person years ago.
- Repeating the same technology in every section — mention it once, let the endorsements reinforce it.`;

function buildPrompt(resume: GeneratedResume, targetRole: string): string {
  return `=== RESUME ===
Target Role: ${targetRole}
Summary: ${resume.summary}

Experience:
${(resume.experiences || []).map(e =>
  `${e.role} @ ${e.companyName}: ${e.bulletPoints?.join('; ')}`
).join('\n')}

Projects:
${(resume.projects || []).map(p =>
  `${p.name} [${(p.technologies || []).join(', ')}]: ${p.bulletPoints?.slice(0, 2).join('; ')}`
).join('\n')}

Skills: ${(resume.skills || []).map(s => s.name).join(', ')}

Achievements: ${(resume.achievements || []).slice(0, 5).join('; ')}

=== OUTPUT FORMAT ===
Output ONLY valid JSON with this exact shape — no markdown, no fences:
{
  "headline": "string (max 220 chars)",
  "about": "string (2-3 paragraphs, ~300 words, first person)",
  "experienceEntries": [
    { "role": "string", "company": "string", "description": "string (prose, 80-120 words)" }
  ],
  "featuredProjects": [
    { "name": "string", "description": "string (2 sentences)" }
  ],
  "topSkills": ["string x15"],
  "keywordRecommendations": ["string — include WHERE to place it"],
  "recruiterVisibilityTips": ["string x5-7"]
}`;
}

export class LinkedInService {
  async optimize(resume: GeneratedResume, targetRole: string): Promise<LinkedInOptimization> {
    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(resume, targetRole) },
      ],
      { json: true, temperature: 0.6 },
    );

    const parsed = parseJSON<LinkedInOptimization>(response.content);
    if (!parsed?.headline || !parsed?.about || !Array.isArray(parsed?.topSkills)) {
      throw new Error('Failed to parse LinkedIn optimization response');
    }

    return {
      headline: parsed.headline.slice(0, 220),                         // hard cap
      about: parsed.about,
      experienceEntries: (parsed.experienceEntries || []).map(e => ({
        role: e.role || '',
        company: e.company || '',
        description: e.description || '',
      })),
      featuredProjects: (parsed.featuredProjects || []).slice(0, 3).map(p => ({
        name: p.name || '',
        description: p.description || '',
      })),
      topSkills: (parsed.topSkills || []).slice(0, 15),
      keywordRecommendations: (parsed.keywordRecommendations || []).slice(0, 12),
      recruiterVisibilityTips: (parsed.recruiterVisibilityTips || []).slice(0, 7),
    };
  }
}

export const linkedInService = new LinkedInService();
