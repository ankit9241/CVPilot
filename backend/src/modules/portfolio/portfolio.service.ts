import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { PortfolioContent, PortfolioProject } from './portfolio.types';

const SYSTEM_PROMPT = `You are a senior developer-advocate and technical copywriter who builds portfolio sites for engineers. You know what makes a hiring manager spend 4 minutes on a portfolio instead of 30 seconds — and it's not flashy design, it's writing that is specific, honest, and technically credible.

Your job: generate all portfolio website text content from a candidate's resume. The content must feel like it was hand-crafted for this specific person, not generated. Every section must be unique — if something was said in the Hero, do not repeat it in About. If a technology was highlighted in a Project, do not re-list it identically in Skills.

SECTION RULES:

**hero**: One tagline (max 8 words, punchy, technical identity — "Backend engineer who makes things fast" not "Passionate software developer"). Subheadline expands in 1 sentence (20-30 words). CTA label: 2-3 words ("See my work"). ctaTarget: "projects" if they have strong projects, "contact" otherwise.

**about**: A bio across 2-3 short paragraphs. First paragraph: who they are technically (seniority, specialization, how they think). Second: notable work or projects — something they built that matters. Third (optional): how they work (async, open-source contributor, side projects, etc.). Writes like a human developer wrote it on a Sunday afternoon — not a cover letter. highlights: 3-5 short facts ("5 years building distributed systems", "Open-source contributor to [real project from resume]"). Only use facts that appear in the resume.

**projects**: Select the 3-5 strongest projects. featured=true for the top 2. summary: 2-3 sentences — what it is, what problem it solves, why it's interesting technically. bullets: 2-4 impact-focused bullets about what made it hard, what was achieved. Do NOT copy resume bullet points verbatim — rewrite with different phrasing. technologies: list exactly as they appear in the resume project.

**experience**: For each experience, 2 sentences: sentence 1 = team/system scope ("Led backend for a 12-person team building a real-time payments platform"), sentence 2 = most significant outcome ("Reduced API p95 latency from 800ms to 140ms by migrating from REST polling to WebSocket streams."). Dates: format as "MMM YYYY – MMM YYYY" or "MMM YYYY – Present".

**skills**: Group by category using the resume skill categories. Preserve all skills from the resume — no dropping. No invented skills.

**contact**: headline is a 4-7 word invitation, not a question. body: 1-2 sentences, specific to their type of work ("Whether you're scaling a backend or starting from scratch, I'm available for senior IC and consulting engagements.").

**seo**: title = "FirstName LastName | Target Role". description = 140-160 characters, includes their top 2-3 technologies and role. keywords = 10-15 terms (role variants, technologies, domain terms). ogTitle and ogDescription for social sharing.

ABSOLUTE RULES:
- Use only information present in the resume. No invented companies, projects, technologies, or metrics.
- Never use: "passionate", "results-driven", "detail-oriented", "team player", "leverage", "dynamic".
- No duplication across sections. If you mention React in the Hero tagline, don't lead with React in About.
- Keep bullets reworded from the resume — same facts, different sentence construction.`;

function buildPrompt(resume: GeneratedResume, targetRole: string, fullName: string): string {
  return `=== CANDIDATE ===
Name: ${fullName}
Target Role: ${targetRole}

Summary: ${resume.summary}

Experience:
${(resume.experiences || []).map(e =>
  `${e.role} @ ${e.companyName} (${e.startDate || '?'} – ${e.isCurrent ? 'Present' : (e.endDate || '?')})
  ${(e.bulletPoints || []).join(' | ')}`
).join('\n\n')}

Projects:
${(resume.projects || []).map(p =>
  `${p.name} [${(p.technologies || []).join(', ')}]
  ${(p.bulletPoints || []).join(' | ')}`
).join('\n\n')}

Skills: ${(resume.skills || []).map(s => `${s.name} (${s.category})`).join(', ')}

Achievements: ${(resume.achievements || []).join('; ')}

Education: ${(resume.education || []).map(e => `${e.degree} in ${e.field || '?'} @ ${e.school}`).join('; ')}

Output ONLY valid JSON matching the PortfolioContent shape. No markdown fences.`;
}

export class PortfolioService {
  async generate(resume: GeneratedResume, targetRole: string, fullName: string): Promise<PortfolioContent> {
    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(resume, targetRole, fullName) },
      ],
      { json: true, temperature: 0.6 },
    );

    const parsed = parseJSON<PortfolioContent>(response.content);
    if (!parsed?.hero || !parsed?.about || !Array.isArray(parsed?.projects)) {
      throw new Error('Failed to parse portfolio content response');
    }

    // Enforce: featured capped at top 2, preserve all skills
    const projects: PortfolioProject[] = (parsed.projects || []).map((p, i) => ({
      name: p.name || '',
      summary: p.summary || '',
      bullets: Array.isArray(p.bullets) ? p.bullets : [],
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      featured: i < 2,  // ponytail: override LLM's featured flag — top 2 by order, not LLM discretion
    }));

    return {
      hero: {
        name: fullName,
        tagline: parsed.hero.tagline || '',
        subheadline: parsed.hero.subheadline || '',
        ctaLabel: parsed.hero.ctaLabel || 'See my work',
        ctaTarget: parsed.hero.ctaTarget === 'contact' ? 'contact' : 'projects',
      },
      about: {
        bio: parsed.about.bio || '',
        highlights: Array.isArray(parsed.about.highlights) ? parsed.about.highlights.slice(0, 5) : [],
      },
      projects,
      experience: (parsed.experience || []).map(e => ({
        role: e.role || '',
        company: e.company || '',
        period: e.period || '',
        summary: e.summary || '',
      })),
      skills: (parsed.skills || []).map(g => ({
        category: g.category || '',
        skills: Array.isArray(g.skills) ? g.skills : [],
      })),
      contact: {
        headline: parsed.contact?.headline || "Let's work together.",
        body: parsed.contact?.body || '',
      },
      seo: {
        title: parsed.seo?.title || `${fullName} | ${targetRole}`,
        description: (parsed.seo?.description || '').slice(0, 160),
        keywords: Array.isArray(parsed.seo?.keywords) ? parsed.seo.keywords.slice(0, 15) : [],
        ogTitle: parsed.seo?.ogTitle || parsed.seo?.title || `${fullName} | ${targetRole}`,
        ogDescription: parsed.seo?.ogDescription || (parsed.seo?.description || '').slice(0, 160),
      },
    };
  }
}

export const portfolioService = new PortfolioService();
