import { GeneratedResume } from '../../ai/types';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { calculateYoE, inferSeniority } from '../../utils/date';
import { BenchmarkReport, BenchmarkCategory, BenchmarkRating } from './benchmark.types';

const DISCLAIMER =
  'Ratings reflect generalized hiring expectations for the specified role and experience level, ' +
  'based on patterns observed across the tech industry. They are not derived from a proprietary ' +
  'dataset and should be used to prioritize improvements, not as an objective industry ranking.';

// ─── Weighted category scores → overall ──────────────────────────────────────
//   Impact and experience quality matter most to senior + lead hiring decisions.
const WEIGHTS: Record<string, number> = {
  projectQuality: 0.15,
  experienceQuality: 0.20,
  technicalBreadth: 0.10,
  technicalDepth: 0.15,
  leadership: 0.10,
  impact: 0.15,
  writing: 0.05,
  atsReadiness: 0.05,
  recruiterAppeal: 0.05,
};

function weightedScore(categories: BenchmarkReport['categories']): number {
  return Math.round(
    Object.entries(categories).reduce(
      (sum, [key, cat]) => sum + (cat as BenchmarkCategory).score * (WEIGHTS[key] ?? 0),
      0,
    ),
  );
}

function percentileLabel(score: number, role: string, seniority: string): string {
  // ponytail: heuristic bands — no real dataset, so we're honest about the range
  const label =
    score >= 85 ? 'Top 10–20%' :
    score >= 70 ? 'Top 25–40%' :
    score >= 55 ? 'Top 40–60%' :
    score >= 40 ? 'Bottom 40–60%' :
                  'Bottom 20–30%';
  return `${label} for ${seniority.charAt(0).toUpperCase() + seniority.slice(1)} ${role}`;
}

const SYSTEM_PROMPT = `You are a principal engineer and hiring manager who has conducted 500+ technical interviews and reviewed 10,000+ resumes across frontend, backend, fullstack, mobile, data, and platform engineering roles. You know exactly what "good" looks like at each seniority level — not in theory, but because you've hired junior engineers who outperformed seniors, and passed on senior engineers whose resumes looked better than they were.

Your job: benchmark this resume against realistic hiring expectations for the candidate's role and seniority level. This is NOT an ATS evaluation. Don't mention keywords or ATS compatibility — that's handled elsewhere. This is about whether this person's actual track record measures up to what hiring panels expect.

IMPORTANT — READ THIS BEFORE SCORING:
1. Base expectations on the role and seniority you're given, not on what would be impressive for a different level.
2. A senior engineer who lacks leadership experience is a real gap. A junior engineer without it is expected. Adjust the baseline accordingly.
3. Be honest about gaps. A "meets-expectations" score for a weak area doesn't help the candidate. Name the gap specifically.
4. Do NOT fabricate benchmark data or cite specific statistics. All ratings are based on your experience with industry hiring patterns.
5. "justification" must quote something from the resume — actual evidence for the rating, not a generic statement.

CATEGORY DEFINITIONS (all 0-100, with corresponding rating):
- 0-49: below-expectations
- 50-69: meets-expectations
- 70-84: above-expectations
- 85-100: exceptional

**projectQuality**: Are projects technically ambitious for this level? Do they show ownership, scale, or real-world deployment? Side projects on a senior resume that look like tutorials are a significant negative signal.

**experienceQuality**: Is the work experience at companies/teams that suggest real engineering challenges? Does the progression make sense? Are tenures long enough to show depth?

**technicalBreadth**: How wide is the tech stack relative to what's expected for this role and level? Breadth is more important for generalist/fullstack roles, less for deep specialists.

**technicalDepth**: Is there strong evidence of deep expertise in 1-2 core areas? Code ownership, architectural decisions, open-source contributions, or systems-level work?

**leadership**: Has the candidate demonstrated ownership beyond their own tasks? Mentoring, cross-team collaboration, technical decisions, or people management (required at lead, valued at senior, bonus at mid)?

**impact**: Do bullet points show business outcomes, not just task completion? Metrics, scale, user growth, latency improvements, cost savings? Vague impact is a yellow flag.

**writing**: Is the resume written with precision? Tight bullets, consistent past-tense action verbs, no filler, specific rather than generic. Even strong engineers often write weak bullets.

**atsReadiness**: Would this resume parse cleanly? Section structure, standard headings, contact info, date formats. Not keyword-focused — structural only.

**recruiterAppeal**: Would a 20-second scan leave a positive impression? Is the most impressive information front-loaded? Is it easy to understand what this person does and why they're interesting?

OUTPUT must be valid JSON with this exact shape:
{
  "categories": {
    "projectQuality": { "rating": "...", "score": 0-100, "justification": "..." },
    "experienceQuality": { "rating": "...", "score": 0-100, "justification": "..." },
    "technicalBreadth": { "rating": "...", "score": 0-100, "justification": "..." },
    "technicalDepth": { "rating": "...", "score": 0-100, "justification": "..." },
    "leadership": { "rating": "...", "score": 0-100, "justification": "..." },
    "impact": { "rating": "...", "score": 0-100, "justification": "..." },
    "writing": { "rating": "...", "score": 0-100, "justification": "..." },
    "atsReadiness": { "rating": "...", "score": 0-100, "justification": "..." },
    "recruiterAppeal": { "rating": "...", "score": 0-100, "justification": "..." }
  },
  "competitiveAdvantages": ["string x3-5"],
  "weakAreas": ["string x3-5"],
  "improvementPriorities": ["string x3-5"]
}`;

function buildPrompt(resume: GeneratedResume, role: string, seniority: string, yoe: number): string {
  return `=== CANDIDATE RESUME ===
Target Role: ${role}
Seniority Level: ${seniority} (${yoe} years of experience)

Summary: ${resume.summary}

Experience:
${(resume.experiences || []).map(e =>
  `${e.role} @ ${e.companyName} (${e.startDate || '?'} – ${e.isCurrent ? 'Present' : (e.endDate || '?')})
${(e.bulletPoints || []).map(b => `  • ${b}`).join('\n')}`
).join('\n\n')}

Projects:
${(resume.projects || []).map(p =>
  `${p.name} [${(p.technologies || []).join(', ')}]
${(p.bulletPoints || []).map(b => `  • ${b}`).join('\n')}`
).join('\n\n')}

Skills: ${(resume.skills || []).map(s => s.name).join(', ')}

Achievements: ${(resume.achievements || []).join('; ')}

Education: ${(resume.education || []).map(e => `${e.degree} ${e.field ? 'in ' + e.field : ''} @ ${e.school}`).join('; ')}

Benchmark this candidate as a ${seniority.toUpperCase()} ${role}. Be specific. Quote resume text in justifications.
Output ONLY valid JSON — no markdown fences, no commentary.`;
}

// ─── Rating from score ────────────────────────────────────────────────────────
function toRating(score: number): BenchmarkRating {
  if (score >= 85) return 'exceptional';
  if (score >= 70) return 'above-expectations';
  if (score >= 50) return 'meets-expectations';
  return 'below-expectations';
}

function normalizeCategory(raw: any): BenchmarkCategory {
  const score = Math.min(100, Math.max(0, Math.round(raw?.score ?? 0)));
  return {
    score,
    rating: toRating(score),                      // derive from score — don't trust LLM's label
    justification: raw?.justification || '',
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class BenchmarkService {
  async benchmark(resume: GeneratedResume, role: string): Promise<BenchmarkReport> {
    const yoe = calculateYoE(resume.experiences || []);
    const seniority = inferSeniority(yoe);

    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(resume, role, seniority, yoe) },
      ],
      { json: true, temperature: 0.2 },
    );

    const parsed = parseJSON<any>(response.content);
    if (!parsed?.categories) {
      throw new Error('Failed to parse benchmark response');
    }

    const cats = parsed.categories;
    const categories: BenchmarkReport['categories'] = {
      projectQuality: normalizeCategory(cats.projectQuality),
      experienceQuality: normalizeCategory(cats.experienceQuality),
      technicalBreadth: normalizeCategory(cats.technicalBreadth),
      technicalDepth: normalizeCategory(cats.technicalDepth),
      leadership: normalizeCategory(cats.leadership),
      impact: normalizeCategory(cats.impact),
      writing: normalizeCategory(cats.writing),
      atsReadiness: normalizeCategory(cats.atsReadiness),
      recruiterAppeal: normalizeCategory(cats.recruiterAppeal),
    };

    const overallScore = weightedScore(categories);

    return {
      role,
      seniority,
      yearsOfExperience: yoe,
      disclaimer: DISCLAIMER,
      categories,
      overallScore,
      percentileEstimate: percentileLabel(overallScore, role, seniority),
      competitiveAdvantages: (parsed.competitiveAdvantages || []).slice(0, 5),
      weakAreas: (parsed.weakAreas || []).slice(0, 5),
      improvementPriorities: (parsed.improvementPriorities || []).slice(0, 5),
    };
  }
}

export const benchmarkService = new BenchmarkService();
