import { analyzeATS } from './src/modules/ats/ats.utils';
import { GeneratedResume } from './src/ai/types';

const resume: GeneratedResume = {
  summary: 'Full Stack Developer building scalable React and TypeScript applications with Node.js.',
  experiences: [
    {
      companyName: 'PodSnap',
      role: 'Full Stack Developer',
      startDate: '2025-01',
      endDate: undefined,
      isCurrent: true,
      description: 'Built production AI pipeline with WhisperX, Gemini and FFmpeg.',
      bulletPoints: [
        'Reduced creator editing time by 10+ hours per podcast.',
        'Supported 500+ users and 20+ clubs.',
        'Deployed GPU workloads on Modal Serverless handling 100k requests.',
      ],
    },
  ],
  projects: [],
  skills: [{ name: 'React', category: 'FRONTEND' }, { name: 'Node.js', category: 'BACKEND' }],
  education: [],
  certificates: [],
  achievements: [],
  metadata: { targetRole: '', companyName: '', generationSessionId: '', generatedAt: '', keywordMatches: [], selectionRationale: '' },
};

const jd = `Senior Full Stack Engineer
Required: React, Node.js, TypeScript, AWS
Preferred: Kubernetes, GraphQL
Nice to have: Docker`;

// 1. With JD — metrics should be detected, synonyms should match (Node vs Node.js), weighted scoring.
const withJd = analyzeATS(resume, jd);
const impact = withJd.detailedBreakdown.find((d) => d.category === 'Impact & Quantification');
const kw = withJd.detailedBreakdown.find((d) => d.category === 'Keyword Match');
console.log('WITH JD');
console.log('  overallScore:', withJd.overallScore);
console.log('  keyword evidence:', kw?.evidence);
console.log('  keyword deductions:', kw?.deductions);
console.log('  impact evidence:', impact?.evidence);
console.log('  impact deductions:', impact?.deductions);
console.log('  matched:', withJd.matchedKeywords, 'missing:', withJd.missingKeywords);

// 2. Without JD — JD-dependent categories marked N/A, overall score from structure only.
const noJd = analyzeATS(resume, '');
console.log('\nWITHOUT JD');
console.log('  overallScore:', noJd.overallScore);
console.log('  notApplicable:', noJd.notApplicable);
console.log('  keyword in breakdown:', noJd.detailedBreakdown.some((d) => d.category === 'Keyword Match'));

// Assertions
const assert = (cond: boolean, msg: string) => {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else { console.log('PASS:', msg); }
};

// Metrics detected in impact
assert((impact?.evidence ?? []).length > 0, 'impact evidence present (metrics detected)');
assert((impact?.deductions ?? []).some((d) => d.includes('metrics')) === false, 'no "lacks metrics" deduction');
// Synonyms + required/preferred/optional weighting
assert(withJd.matchedKeywords.includes('react'), 'react matched');
assert(withJd.matchedKeywords.includes('node.js'), 'node.js matched');
assert(withJd.matchedKeywords.includes('javascript') === false, 'no false javascript match from "js" in Node.js');
assert(withJd.matchedKeywords.includes('aws') === false, 'aws missing (required)');
const dockerDed = kw?.deductions?.find((d) => d.includes('docker'));
assert(!!dockerDed && dockerDed.includes('optional'), 'docker deduction labelled optional');
const awsDed = kw?.deductions?.find((d) => d.includes('aws'));
assert(!!awsDed && awsDed.includes('required'), 'aws deduction labelled required');

// Optional-only miss barely hurts: JD where the only miss is optional Docker.
const easyJd = `Required: React, Node.js, TypeScript. Nice to have: Docker.`;
const easy = analyzeATS(resume, easyJd);
const easyKw = easy.detailedBreakdown.find((d) => d.category === 'Keyword Match');
assert((easyKw?.score ?? 0) >= 18, `optional-only miss keeps keyword score high (${easyKw?.score}/20)`);

// N/A handling
assert(noJd.notApplicable?.includes('keywordMatch') === true, 'no-JD marks keywordMatch N/A');
assert(noJd.notApplicable?.includes('skillsMatch') === true, 'no-JD marks skillsMatch N/A');
assert(noJd.detailedBreakdown.some((d) => d.category === 'Keyword Match') === false, 'N/A category excluded from breakdown');
assert(noJd.overallScore > 0, 'no-JD overall score computed from structure only');
