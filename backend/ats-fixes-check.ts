/**
 * Regression checks for the four Phase-32 follow-up fixes:
 * 1. Metric detection (impact) — "+N", "%", units must be detected.
 * 2. Keyword synonym dedupe — nodejs/node.js, rest/restful count once.
 * 3. Recruiter prompt — inference-control rules present (text assertion).
 * 4. Quality parsing — valid-but-partial JSON must not be rejected.
 *
 * Run: npx tsx ats-fixes-check.ts
 */
import { hasMetric, extractJdKeywords, analyzeATS } from './src/modules/ats/ats.utils';
import { parseQualityResponse } from './src/modules/ats/quality.service';
import { readFileSync } from 'fs';

const assert = (cond: boolean, msg: string) => {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else { console.log('PASS:', msg); }
};

// ── 1. Metric detection ──────────────────────────────────────────────────────
const metrics = [
  '10+ hours saved per podcast', '500+ users onboarded', '40% improvement in latency',
  '500MB uploads supported', '100k requests handled daily', '2x improvement in throughput',
  'Improved API latency by 90%', '1,000+ registrations',
];
for (const m of metrics) assert(hasMetric(m), `metric detected: ${m}`);

const base = { summary: 'Engineer', experiences: [] as any[], projects: [] as any[], skills: [] as any[], education: [] as any[], certificates: [] as any[], achievements: [] as any[], metadata: { targetRole: '', companyName: '', generationSessionId: '', generatedAt: '', keywordMatches: [], selectionRationale: '' } };
const rich = { ...base, experiences: [{ companyName: 'Acme', role: 'Engineer', startDate: '2023-01', endDate: undefined, isCurrent: true, description: '', bulletPoints: ['Reduced editing time by 10+ hours per podcast.', 'Supported 500+ users and 40% more engagement.', 'Deployed 500MB uploads and handled 100k requests daily.'] }] };
const poor = { ...base, experiences: [{ companyName: 'Acme', role: 'Engineer', startDate: '2023-01', endDate: undefined, isCurrent: true, description: '', bulletPoints: ['Worked on the team and did some things.', 'Helped with various tasks.'] }] };
const jd = 'Backend Engineer. Required: Node.js.';
const imp = (r: any) => analyzeATS(r, jd).detailedBreakdown.find((d: any) => d.category === 'Impact & Quantification');
assert((imp(rich)?.score ?? 0) >= 3, `metric-rich impact materially higher (${imp(rich)?.score}/5)`);
assert((imp(poor)?.score ?? 5) <= 1, `no-metric impact low (${imp(poor)?.score}/5)`);

// ── 2. Keyword synonym dedupe ────────────────────────────────────────────────
const jd2 = 'Backend Engineer. Required: Node.js, REST API, AWS, Artificial Intelligence.';
const kws = extractJdKeywords(jd2);
assert(kws.filter((k) => k.includes('node')).length === 1, 'nodejs/node.js counted once');
assert(kws.filter((k) => k.toLowerCase().includes('rest')).length === 1, 'rest/restful counted once');
assert(kws.filter((k) => k.toLowerCase() === 'aws').length === 1, 'aws counted once');
assert(kws.filter((k) => /ai|artificial/.test(k.toLowerCase())).length === 1, 'ai/artificial intelligence counted once');
assert(kws.length === 4, `4 distinct concepts (got ${kws.join(', ')})`);

// ── 3. Recruiter prompt: date / timeline + recommendation grounding ──────────
const serviceSrc = readFileSync('./src/modules/ats/ats.service.ts', 'utf8');
assert(/overlapping education and employment dates are NORMAL/i.test(serviceSrc), 'prompt: overlap treated as normal');
assert(/may be worth clarifying/.test(serviceSrc), 'prompt: preferred clarification wording present');
assert(/Never present an inference or a recommendation as a fact/.test(serviceSrc), 'prompt: fact vs inference distinction');
// 1-2. Analysis date anchored; past dates not future-dated
assert(/Analysis date \(today\):/.test(serviceSrc), 'prompt: analysis date injected');
assert(/future-dated.*ONLY if its start date is AFTER the analysis date/i.test(serviceSrc), 'prompt: future-dated requires start > today');
assert(/start date on or before the analysis date is in the PAST/i.test(serviceSrc), 'prompt: past start never future-dated');
// 3. Overlap is never a credibility/integrity accusation
assert(/Never describe overlapping dates as impossible, fraudulent, fabricated, contradictory, future-dated, inaccurate, suspicious, or an "integrity concern"/i.test(serviceSrc), 'prompt: overlap never an integrity concern');
assert(/explicitly states mutually exclusive full-time commitments/.test(serviceSrc), 'prompt: contradiction only when explicitly stated');
// 4-7. Never encourage fabricated/missing experience
assert(/NEVER tell the candidate to "add", "learn", "implement", or "claim" a technology/i.test(serviceSrc), 'prompt: never instruct adding missing tech');
assert(/If you have genuine experience with X, add it with evidence/.test(serviceSrc), 'prompt: conditional genuine-experience phrasing');
assert(/Docker, Kubernetes, PostgreSQL, GraphQL, WebSockets, CI\/CD, GitHub Actions/.test(serviceSrc), 'prompt: covers listed missing-tech examples');

// ── 4. Quality contract — canonical schema (STEP 6) ─────────────────────────
const full = { overallQualityScore: 82, strengths: [], weaknesses: [], quickWins: [], professionalReview: '' };
const r1 = parseQualityResponse(JSON.stringify(full));
assert(r1.ok && r1.report.overallQualityScore === 82, '1. complete response -> PASS');
const r2 = parseQualityResponse(JSON.stringify({ ...full, overallQualityScore: '82' }));
assert(r2.ok && r2.report.overallQualityScore === 82, '2. numeric string "82" normalized -> 82');
const r3 = parseQualityResponse(JSON.stringify({ strengths: [], weaknesses: [], quickWins: [], professionalReview: '' }));
assert(!r3.ok && r3.reason === 'QUALITY_SCORE_MISSING', '3. missing score -> QUALITY_SCORE_MISSING');
const r4 = parseQualityResponse('```json\n' + JSON.stringify(full) + '\n```');
assert(r4.ok && r4.report.overallQualityScore === 82, '4. markdown-wrapped JSON -> PASS');
const r5 = parseQualityResponse(JSON.stringify({ ...full, weaknesses: undefined }));
assert(r5.ok && Array.isArray(r5.report.weaknesses) && r5.report.weaknesses.length === 0, '5. missing weaknesses -> []');
const r6 = parseQualityResponse('We need to analyze... no JSON here');
assert(!r6.ok && r6.reason === 'QUALITY_PARSE_FAILED', '6. garbage -> FAIL');
const r7 = parseQualityResponse(JSON.stringify({ ...full, overallQualityScore: 150 }));
assert(!r7.ok && r7.reason === 'QUALITY_SCORE_INVALID', '7. score >100 -> QUALITY_SCORE_INVALID');
const r8 = parseQualityResponse(JSON.stringify({ ...full, overallQualityScore: -5 }));
assert(!r8.ok && r8.reason === 'QUALITY_SCORE_INVALID', '8. score <0 -> QUALITY_SCORE_INVALID');

console.log('\nFix regression checks complete.');
