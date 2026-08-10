import { GeneratedResume } from './src/ai/types';
import { analyzeATS } from './src/modules/ats/ats.utils';
import {
  validateRecruiterStatements,
  validateQualityStatements,
} from './src/modules/ats/statement-validator';

const resume: GeneratedResume = {
  summary: 'Full Stack Developer building React and TypeScript applications with Node.js and AWS.',
  experiences: [
    {
      companyName: 'PodSnap',
      role: 'Full Stack Developer',
      startDate: '2025-01',
      endDate: undefined,
      isCurrent: true,
      description: 'Built production AI pipeline with WhisperX, Gemini and FFmpeg; implemented backend integrations.',
      bulletPoints: [
        'Reduced creator editing time by 10+ hours per podcast.',
        'Supported 500+ users and 20+ clubs.',
        'Deployed GPU workloads on Modal Serverless handling 100k requests.',
      ],
    },
  ],
  projects: [],
  skills: [{ name: 'React', category: 'FRONTEND' }, { name: 'Node.js', category: 'BACKEND' }],
  education: [{ school: 'IIT Patna', degree: 'B.Tech', startDate: '2021-07', endDate: '2025-06' }],
  certificates: [{ name: 'AWS Certified Developer', issuer: 'Amazon' }],
  achievements: ['Hackathon winner'],
  metadata: { targetRole: '', companyName: '', generationSessionId: '', generatedAt: '', keywordMatches: [], selectionRationale: '' },
};

const jd = `Senior Full Stack Engineer
Required: React, Node.js, TypeScript, AWS
Preferred: GraphQL
Nice to have: Docker`;

const assert = (cond: boolean, msg: string) => {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else { console.log('PASS:', msg); }
};
const dropped = (r: string[]) => r.length > 0;
const kept = (list: string[], needle: string) =>
  list.some((s) => s.toLowerCase().includes(needle.toLowerCase()));

const report = analyzeATS(resume, jd);

// --- 1. Fabricated dates ---
{
  const r = validateRecruiterStatements(resume, ['Graduates in 2027 and joins the workforce.'], [], report);
  assert(dropped(r.droppedStrengths), 'fabricated year 2027 rejected');
  assert(!kept(r.strengths, '2027'), '2027 not backfilled');
}

// --- 2. Fabricated companies ---
{
  const r = validateRecruiterStatements(resume, ['Delivered systems at Google scale.'], [], report);
  assert(dropped(r.droppedStrengths), 'fabricated company (Google) rejected');
}

// --- 3. Fabricated technologies ---
{
  const r = validateRecruiterStatements(resume, ['Expert in Kubernetes orchestration and Kafka streaming.'], [], report);
  assert(dropped(r.droppedStrengths), 'fabricated technologies (Kubernetes/Kafka) rejected');
}

// --- 4. Fabricated skill ratings ---
{
  const r = validateRecruiterStatements(resume, ['Candidate rates React 3/5.'], [], report);
  assert(dropped(r.droppedStrengths), 'fabricated skill rating (3/5) rejected');
}

// --- 5. Fabricated certifications ---
{
  const r = validateRecruiterStatements(resume, ['Certified in Cisco CCNA.'], [], report);
  assert(dropped(r.droppedStrengths), 'fabricated certification (Cisco CCNA) rejected');
}

// --- 6. Fake education ---
{
  const r = validateRecruiterStatements(resume, ['Graduated from MIT with honors in 2027.'], [], report);
  assert(dropped(r.droppedStrengths), 'fake education (MIT + 2027) rejected');
}

// --- 7. Incorrect metric claims ---
{
  const r = validateRecruiterStatements(resume, ['Improved API latency by 90%.'], [], report);
  assert(dropped(r.droppedStrengths), 'fabricated metric (90%) rejected');
}

// --- 8. Synonym matching (Node vs Node.js) ---
{
  const r = validateRecruiterStatements(resume, ['Strong command of Node services.'], [], report);
  assert(kept(r.strengths, 'node'), 'synonym match kept (Node ~ Node.js)');
}

// --- 9. Token overlap + accurate negative ---
{
  const r = validateRecruiterStatements(resume, ['Demonstrates measurable backend optimization.'], ['Docker experience not demonstrated.'], report);
  assert(kept(r.strengths, 'backend'), 'token-overlap strength kept');
  assert(kept(r.weaknesses, 'docker'), 'accurate negative about absent tech kept');
}

// --- 10. ATS fallback generation ---
{
  const fabricated = ['Rates React 3/5.', 'Expert in Kubernetes.', 'Graduates in 2027.'];
  const fabricatedW = ['Lacks overall polish.', 'Does not use React properly.', 'Graduated from MIT.'];
  const r = validateRecruiterStatements(resume, fabricated, fabricatedW, report);
  assert(r.strengths.length >= 3, `ATS fallback fills strengths to >=3 (got ${r.strengths.length})`);
  assert(r.weaknesses.length >= 3, `ATS fallback fills weaknesses to >=3 (got ${r.weaknesses.length})`);
  const all = [...r.strengths, ...r.weaknesses].join(' | ').toLowerCase();
  assert(!all.includes('3/5') && !all.includes('2027') && !all.includes('kubernetes') && !all.includes('google'), 'backfill never reintroduces hallucinated content');
}

// --- Quality validator ---
{
  const r = validateQualityStatements(resume, ['Rates React 3/5.', 'Exemplary writing throughout.'], ['No quantified impact.'], );
  assert(dropped(r.droppedStrengths), 'quality: fabricated rating rejected');
  assert(dropped(r.droppedWeaknesses), 'quality: "no quantified impact" rejected (metrics exist)');
  assert(r.strengths.length >= 1, `quality: deterministic backfill present (${r.strengths.length})`);
}

console.log('\nValidator self-check complete.');
