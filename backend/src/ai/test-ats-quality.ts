import { GeneratedResume } from './types';
import {
  extractAllResumeText,
  sanitizeRecommendationText,
  deduplicateRecommendations,
  computeDeterministicQuality,
  areStatementsSemanticallyEquivalent,
  deduplicateCrossEngineResults,
  extractResumeFacts,
  extractJdFacts,
  computeResumeJdGap,
  generateOpportunityDossier,
} from '../modules/ats/ats.utils';
import { validateRecommendationList } from '../modules/ats/statement-validator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pass = (label: string) => console.log(`✅ ${label}`);
const fail = (label: string, detail: string): never => {
  throw new Error(`${label} - ${detail}`);
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockResume: GeneratedResume = {
  summary: 'Experienced software engineer.',
  experiences: [
    {
      companyName: 'Thrive Wellness',
      role: 'Software Engineer',
      isCurrent: true,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      description: 'Worked on typescript apps.',
      bulletPoints: ['Built React web applications. Served 20+ clients.'],
    }
  ],
  projects: [
    {
      name: 'Analytics API',
      description: 'Built a real-time tracking service.',
      technologies: ['Node.js', 'Express'],
      bulletPoints: ['Optimized query performance.'],
    }
  ],
  skills: [
    { name: 'TypeScript', category: 'LANGUAGE' },
    { name: 'React', category: 'FRAMEWORK' },
  ],
  education: [],
  certificates: [],
  achievements: [],
  metadata: {
    targetRole: 'Senior Dev',
    companyName: 'Acme',
    generationSessionId: 'upload-12345',
    generatedAt: new Date().toISOString(),
    keywordMatches: [],
    selectionRationale: '',
  }
};

// Resume with Docker present (for genuine-tech tests)
const dockerResume: GeneratedResume = {
  ...mockResume,
  skills: [
    { name: 'TypeScript', category: 'LANGUAGE' },
    { name: 'React', category: 'FRAMEWORK' },
    { name: 'Docker', category: 'TOOL' },
    { name: 'CI/CD', category: 'TOOL' },
  ],
  experiences: [
    {
      companyName: 'Acme Corp',
      role: 'DevOps Engineer',
      isCurrent: false,
      startDate: '2022-01-01',
      endDate: '2024-06-01',
      description: 'Containerized services with Docker. Set up CI/CD with GitHub Actions.',
      bulletPoints: ['Deployed 15 microservices using Docker and Kubernetes.', 'Built CI/CD pipeline with GitHub Actions. Improved deployment frequency by 40%.'],
    }
  ],
};

// Resume with 3+ years experience (for supported YoE tests)
const seniorResume: GeneratedResume = {
  ...mockResume,
  experiences: [
    {
      companyName: 'BigCo',
      role: 'Senior Engineer',
      isCurrent: true,
      startDate: '2021-01-01',
      endDate: undefined,
      description: 'Led full-stack development.',
      bulletPoints: ['Led team of 5 engineers.'],
    }
  ],
};

const mockJd = 'Required: React, TypeScript, Docker, PostgreSQL, Kubernetes, CI/CD, GraphQL, WebSockets';

// ═══════════════════════════════════════════════════════════════════════════════
// EXISTING TESTS (A–N) - preserved
// ═══════════════════════════════════════════════════════════════════════════════

async function testRecommendationRewriting() {
  console.log('\n--- Running Tech Recommendation Grounding Tests ---');

  // A. Missing PostgreSQL cannot produce unconditional "add PostgreSQL"
  const recA = 'add PostgreSQL to your skills section';
  const cleanA = sanitizeRecommendationText(recA, mockResume, mockJd);
  console.log('  A. Missing PostgreSQL:', cleanA);

  // B. Missing Docker cannot produce unconditional "add Docker"
  const recB = 'add Docker';
  const cleanB = sanitizeRecommendationText(recB, mockResume, mockJd);
  console.log('  B. Missing Docker:', cleanB);

  // C. Missing Kubernetes cannot produce unconditional "add Kubernetes"
  const recC = 'add Kubernetes to your stack';
  const cleanC = sanitizeRecommendationText(recC, mockResume, mockJd);
  console.log('  C. Missing Kubernetes:', cleanC);

  // D. Missing CI/CD cannot produce "implement CI/CD"
  const recD = 'implement CI/CD pipeline';
  const cleanD = sanitizeRecommendationText(recD, mockResume, mockJd);
  console.log('  D. Missing CI/CD:', cleanD);

  // E. Missing GraphQL/WebSockets cannot produce unconditional add instructions
  const recE1 = 'add GraphQL';
  const recE2 = 'add WebSockets';
  const cleanE1 = sanitizeRecommendationText(recE1, mockResume, mockJd);
  const cleanE2 = sanitizeRecommendationText(recE2, mockResume, mockJd);
  console.log('  E. Missing GraphQL/WebSockets:', cleanE1, '&&', cleanE2);

  const expectedPostgres = 'The JD mentions PostgreSQL, but PostgreSQL is not demonstrated in the resume. If you have genuine experience with PostgreSQL, add it with supporting evidence.';
  const expectedDocker = 'The JD mentions Docker, but Docker is not demonstrated in the resume. If you have genuine experience with Docker, add it with supporting evidence.';
  const expectedKubernetes = 'The JD mentions Kubernetes, but Kubernetes is not demonstrated in the resume. If you have genuine experience with Kubernetes, add it with supporting evidence.';
  const expectedCICD = 'The JD mentions CI/CD, but CI/CD is not demonstrated in the resume. If you have genuine experience with CI/CD, add it with supporting evidence.';
  const expectedGraphQL = 'The JD mentions GraphQL, but GraphQL is not demonstrated in the resume. If you have genuine experience with GraphQL, add it with supporting evidence.';
  const expectedWebSockets = 'The JD mentions WebSockets, but WebSockets is not demonstrated in the resume. If you have genuine experience with WebSockets, add it with supporting evidence.';

  if (
    cleanA === expectedPostgres &&
    cleanB === expectedDocker &&
    cleanC === expectedKubernetes &&
    cleanD === expectedCICD &&
    cleanE1 === expectedGraphQL &&
    cleanE2 === expectedWebSockets
  ) {
    pass('Tech Recommendation Grounding Tests');
  } else {
    fail('Tech Recommendation Grounding Tests', 'one or more rewrites did not match expected');
  }
}

async function testSuspiciousDates() {
  console.log('\n--- Running Date Verification Tests ---');

  // F. Suspicious date cannot produce a fabricated replacement date (e.g. change it to 2023-02)
  const recF = 'Correct the Thrive Wellness experience: change startDate to a past month (e.g. 2023-02)';
  const cleanF = sanitizeRecommendationText(recF, mockResume, mockJd);
  console.log('  F. Guess date prevention:', cleanF);

  const expectedF = 'Verify the Thrive Wellness start date. If the displayed date is correct, retain it. If it is incorrect, replace it only with the actual start date.';

  if (cleanF === expectedF && !cleanF.includes('2023-02')) {
    pass('Date Verification Tests');
  } else {
    fail('Date Verification Tests', `got: ${cleanF}`);
  }
}

async function testSkillsPreservation() {
  console.log('\n--- Running Skills Preservation Tests ---');

  const recH = 'Replace TypeScript and React with Java because Java is in the JD';
  const cleanH = sanitizeRecommendationText(recH, mockResume, mockJd);
  console.log('  H. Skills Deletion prevention:', cleanH);

  const expectedH = 'Prioritize JD-relevant skills such as TypeScript and React near the beginning while retaining other genuine skills.';

  if (cleanH === expectedH) {
    pass('Skills Preservation Tests');
  } else {
    fail('Skills Preservation Tests', `got: ${cleanH}`);
  }
}

async function testMetricGrounding() {
  console.log('\n--- Running Metric Grounding Tests ---');

  const recI = 'Increase data retrieval speed by 20%';
  const cleanI = sanitizeRecommendationText(recI, mockResume, mockJd);
  console.log('  I. Fabricated metric rewrite:', cleanI);

  const recJ = 'Quantify the thrive wellness experience metrics like the 20+ clients served';
  const cleanJ = sanitizeRecommendationText(recJ, mockResume, mockJd);
  console.log('  J. Grounded metric preservation:', cleanJ);

  const expectedI = 'Add a measurable outcome if you have one. Do not invent a metric.';

  if (cleanI === expectedI && cleanJ === recJ) {
    pass('Metric Grounding Tests');
  } else {
    fail('Metric Grounding Tests', `I: ${cleanI}, J: ${cleanJ}`);
  }
}

async function testFabricatedDateReplacement() {
  console.log('\n--- Running Fabricated Date Replacement Tests ---');

  // K. 'change 2026-02 to 2023-02' must produce date verification, not metric message
  const recK = 'change 2026-02 to 2023-02 if appropriate';
  const cleanK = sanitizeRecommendationText(recK, mockResume, mockJd);
  console.log('  K. Fabricated date replacement:', cleanK);
  // Must not contain the fabricated dates; must be a verification message
  if (!cleanK.includes('2026-02') && !cleanK.includes('2023-02') && /verify/i.test(cleanK)) {
    pass('Fabricated Date Replacement Tests');
  } else {
    fail('Fabricated Date Replacement Tests', cleanK);
  }
}

async function testUnconditionalMissingTech() {
  console.log('\n--- Running Unconditional Missing-Tech Tests ---');

  const recL = 'These technologies are required: PostgreSQL, Docker, Kubernetes, CI/CD, GraphQL';
  const cleanL = sanitizeRecommendationText(recL, mockResume, mockJd);
  console.log('  L. No-trigger-word missing tech:', cleanL);

  const isConditional = /if you have genuine experience/i.test(cleanL);
  const isNotUnconditional = !/\b(?:insert|add)\b.*(?:PostgreSQL|Docker|Kubernetes|CI\/CD|GraphQL)\b/i.test(cleanL);
  if (isConditional && isNotUnconditional) {
    pass('Unconditional Missing-Tech Tests');
  } else {
    fail('Unconditional Missing-Tech Tests', cleanL);
  }
}

async function testUnsupportedYoeClaim() {
  console.log('\n--- Running Unsupported YoE Claim Tests ---');

  // Resume: 2024-01-01 to 2025-01-01 = ~1.0 years
  // M. '2+ years of full-stack AI SaaS development' must be stripped when unsupported
  const resumeWithoutSummary: GeneratedResume = { ...mockResume, summary: '' };
  const recM = 'Add a concise summary highlighting 2+ years of full-stack AI SaaS development';
  const cleanM = sanitizeRecommendationText(recM, resumeWithoutSummary, mockJd);
  console.log('  M. Unsupported 2+ years claim (no summary):', cleanM);
  const cleanMExistingSummary = sanitizeRecommendationText(recM, mockResume, mockJd);
  console.log('  M. Stale summary recommendation rejected (has summary):', cleanMExistingSummary);

  if (!/2\+?\s*years/i.test(cleanM) && /full-stack/i.test(cleanM) && cleanMExistingSummary === '') {
    pass('Unsupported YoE Claim Tests');
  } else {
    fail('Unsupported YoE Claim Tests', `cleanM: ${cleanM}, existing: ${cleanMExistingSummary}`);
  }
}

async function testGenuineExperienceConditional() {
  console.log('\n--- Running Genuine Experience Conditional Tests ---');

  const recN = 'Add TypeScript to your skills section if you have experience with it';
  const cleanN = sanitizeRecommendationText(recN, mockResume, mockJd);
  console.log('  N. Genuine experience preserved:', cleanN);
  if (cleanN === recN) {
    pass('Genuine Experience Conditional Tests');
  } else {
    fail('Genuine Experience Conditional Tests', cleanN);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION TESTS A–J (behavioral issues)
// ═══════════════════════════════════════════════════════════════════════════════

async function testOverlapNotSuspicious() {
  console.log('\n--- A. Education + employment overlap NOT called suspicious ---');

  const recOverlap = 'Education overlaps with employment - this is suspicious and undermines trust';
  const cleanOverlap = sanitizeRecommendationText(recOverlap, mockResume, mockJd);
  console.log('  A. Overlap rewrite:', cleanOverlap);

  const forbidden = /suspicious|integrity|impossible|undermines|fraudulent|contradictory/i;
  if (forbidden.test(cleanOverlap)) {
    fail('A. Overlap not suspicious', cleanOverlap);
  }
  if (cleanOverlap !== recOverlap && !cleanOverlap.trim()) {
    fail('A. Overlap not empty', 'produced empty string');
  }
  pass('A. Overlap not called suspicious');
}

async function testPastDateNotFutureDated() {
  console.log('\n--- B. Past date NOT called future-dated ---');

  const recFuture = 'The start date of 2024-01 is future-dated and inaccurate';
  const cleanFuture = sanitizeRecommendationText(recFuture, mockResume, mockJd);
  console.log('  B. Future-dated rewrite:', cleanFuture);

  if (/future.dated|inaccurate|suspicious/i.test(cleanFuture)) {
    fail('B. Past date not future-dated', cleanFuture);
  }
  pass('B. Past date not called future-dated');
}

async function testMissingDockerConditional() {
  console.log('\n--- C. Missing Docker never unconditional ---');

  const recDocker = 'add Docker to your skills section';
  const cleanDocker = sanitizeRecommendationText(recDocker, mockResume, mockJd);
  console.log('  C. Docker rewrite:', cleanDocker);

  if (/^add\s+docker/i.test(cleanDocker)) {
    fail('C. Docker conditional', `unconditional: ${cleanDocker}`);
  }
  if (!/if you have genuine experience/i.test(cleanDocker)) {
    fail('C. Docker conditional phrasing', cleanDocker);
  }
  pass('C. Missing Docker always conditional');
}

async function testNoDuplicateMissingTech() {
  console.log('\n--- D. Missing PostgreSQL no duplicate recommendations ---');

  const recDup = 'These technologies are required: PostgreSQL, Docker, Kubernetes, CI/CD, GraphQL';
  const cleanDup = sanitizeRecommendationText(recDup, mockResume, mockJd);
  console.log('  D. Consolidated rewrite:', cleanDup);

  const count = (cleanDup.match(/genuine experience/gi) || []).length;
  if (count > 1) {
    fail('D. Consolidated', `${count} occurrences: ${cleanDup}`);
  }
  pass('D. Missing tech consolidated');
}

async function testExistingMetricsAcknowledged() {
  console.log('\n--- E. Existing metrics acknowledged ---');

  const recMetrics = 'The resume shows quantified impact: 20+ clients served';
  const cleanMetrics = sanitizeRecommendationText(recMetrics, mockResume, mockJd);
  console.log('  E. Metrics acknowledged:', cleanMetrics);

  if (cleanMetrics !== recMetrics) {
    fail('E. Existing metrics', cleanMetrics);
  }
  pass('E. Existing metrics acknowledged');
}

async function testTrueLackOfMetricsIdentifiable() {
  console.log('\n--- F. True lack of metrics in specific bullet identifiable ---');

  const recNoMetric = 'Improve the summary by adding 50% performance improvement';
  const cleanNoMetric = sanitizeRecommendationText(recNoMetric, mockResume, mockJd);
  console.log('  F. Fabricated metric caught:', cleanNoMetric);

  if (/50%/.test(cleanNoMetric) && !/do not invent/i.test(cleanNoMetric)) {
    fail('F. Fabricated metric', cleanNoMetric);
  }
  pass('F. Fabricated metric caught');
}

async function testNoFabricatedYoE() {
  console.log('\n--- G. No fabricated YoE ---');

  const recYoe = 'Highlight 3+ years of experience in your summary';
  const cleanYoe = sanitizeRecommendationText(recYoe, mockResume, mockJd);
  console.log('  G. Fabricated YoE rewrite:', cleanYoe);

  if (/3\+?\s*years/i.test(cleanYoe)) {
    fail('G. No fabricated YoE', cleanYoe);
  }
  pass('G. No fabricated YoE');
}

async function testNiceToHaveLowerPriority() {
  console.log('\n--- H. Nice-to-have technologies lower priority ---');

  const recNice = 'Docker is missing from the resume';
  const cleanNice = sanitizeRecommendationText(recNice, mockResume, mockJd);
  console.log('  H. Nice-to-have rewrite:', cleanNice);

  if (/^docker\s+is\s+missing/i.test(cleanNice)) {
    fail('H. Nice-to-have', cleanNice);
  }
  pass('H. Nice-to-have lower priority');
}

async function testNoFabricationSuggestions() {
  console.log('\n--- I. No fabrication suggestions ---');

  const recFabricate = 'Build a GitHub Actions pipeline to demonstrate CI/CD experience';
  const cleanFabricate = sanitizeRecommendationText(recFabricate, mockResume, mockJd);
  console.log('  I. Fabrication rewrite:', cleanFabricate);

  if (/if you have genuine experience/i.test(cleanFabricate)) {
    pass('I. Fabrication suggestion rewritten to conditional');
  } else {
    fail('I. Fabrication suggestion', cleanFabricate);
  }
}

async function testGenuineTechUntouched() {
  console.log('\n--- J. Existing genuine technologies untouched ---');

  const recGenuine = 'TypeScript and React are strengths of this resume';
  const cleanGenuine = sanitizeRecommendationText(recGenuine, mockResume, mockJd);
  console.log('  J. Genuine tech preserved:', cleanGenuine);

  if (cleanGenuine !== recGenuine) {
    fail('J. Genuine tech', cleanGenuine);
  }
  pass('J. Genuine technologies untouched');
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW TESTS (O–AB) - from user spec
// ═══════════════════════════════════════════════════════════════════════════════

async function testMissingDockerIncludeExperience() {
  console.log('\n--- O. Missing Docker: "Include Docker experience or projects" ---');
  const rec = 'Include Docker experience or projects to match preferred cloud orchestration skills';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  O.', clean);
  if (!/genuine experience/i.test(clean) || /^include\s+docker/i.test(clean)) {
    fail('O. Include Docker experience', clean);
  }
  pass('O. Missing Docker "Include" rewritten');
}

async function testMissingCICDPipeline() {
  console.log('\n--- P. Missing CI/CD: "Add CI/CD pipeline details using GitHub Actions" ---');
  const rec = 'Add CI/CD pipeline details (e.g., GitHub Actions) to demonstrate automated testing and deployment';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  P.', clean);
  if (!/genuine experience/i.test(clean) || /^add\s+ci\/cd/i.test(clean)) {
    fail('P. Add CI/CD pipeline', clean);
  }
  pass('P. Missing CI/CD "Add pipeline" rewritten');
}

async function testMissingWebSocketsAddLine() {
  console.log('\n--- Q. Missing WebSockets: "Add a line about WebSockets" ---');
  const rec = 'Add a line about WebSockets or real-time features if applicable, or note willingness to learn';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  Q.', clean);
  if (!/genuine experience/i.test(clean) || /willingness to learn/i.test(clean)) {
    fail('Q. Add WebSockets line', clean);
  }
  pass('Q. Missing WebSockets "Add a line" rewritten');
}

async function testMissingKubernetesBuildProject() {
  console.log('\n--- R. Missing Kubernetes: "Build a Kubernetes project" ---');
  const rec = 'Build a Kubernetes project to demonstrate orchestration experience';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  R.', clean);
  if (!/genuine experience/i.test(clean) || /^build\s+a\s+kubernetes/i.test(clean)) {
    fail('R. Build Kubernetes project', clean);
  }
  pass('R. Missing Kubernetes "Build project" rewritten');
}

async function testMissingDockerLearnAndAdd() {
  console.log('\n--- S. Missing Docker: "Learn Docker and add it to your skills" ---');
  const rec = 'Learn Docker and add it to your skills';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  S.', clean);
  if (!/genuine experience/i.test(clean) || /^learn\s+docker/i.test(clean)) {
    fail('S. Learn Docker', clean);
  }
  pass('S. Missing Docker "Learn and add" rewritten');
}

async function testWillingnessToLearnDocker() {
  console.log('\n--- T. Missing Docker: "Note willingness to learn Docker" ---');
  const rec = 'Note willingness to learn Docker';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  T.', clean);
  // Must NOT contain "willingness to learn" - either rewritten to conditional or dropped
  if (/willingness to learn/i.test(clean)) {
    fail('T. Willingness to learn Docker', clean);
  }
  pass('T. "Note willingness to learn Docker" blocked');
}

async function testMissingPostgreSQLCreateProject() {
  console.log('\n--- U. Missing PostgreSQL: "Create a PostgreSQL project" ---');
  const rec = 'Create a PostgreSQL project to demonstrate database experience';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  U.', clean);
  if (!/genuine experience/i.test(clean) || /^create\s+a\s+postgresql/i.test(clean)) {
    fail('U. Create PostgreSQL project', clean);
  }
  pass('U. Missing PostgreSQL "Create project" rewritten');
}

async function testGenuineDockerPreserved() {
  console.log('\n--- V. Genuine Docker: "Highlight your Docker experience" ---');
  const rec = 'Highlight your Docker experience in the Projects section';
  const clean = sanitizeRecommendationText(rec, dockerResume, mockJd);
  console.log('  V.', clean);
  // Docker IS in the resume, so should NOT be rewritten
  if (clean !== rec) {
    fail('V. Genuine Docker preserved', clean);
  }
  pass('V. Genuine Docker preserved');
}

async function testGenuineCICDPreserved() {
  console.log('\n--- W. Genuine CI/CD: "Highlight your GitHub Actions pipeline" ---');
  const rec = 'Highlight your GitHub Actions CI/CD pipeline in the experience section';
  const clean = sanitizeRecommendationText(rec, dockerResume, mockJd);
  console.log('  W.', clean);
  // CI/CD and GitHub Actions ARE in dockerResume, so should NOT be rewritten
  if (clean !== rec) {
    fail('W. Genuine CI/CD preserved', clean);
  }
  pass('W. Genuine CI/CD preserved');
}

async function testUnsupportedYoEGeneral() {
  console.log('\n--- X. Unsupported YoE: "Add 2+ years of full-stack experience" ---');
  // mockResume has ~1 year of experience
  const rec = 'Add 2+ years of full-stack experience to your summary';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  X.', clean);
  if (/2\+?\s*years/i.test(clean)) {
    fail('X. Unsupported YoE', clean);
  }
  pass('X. Unsupported YoE removed');
}

async function testSupportedYoEPreserved() {
  console.log('\n--- Y. Supported YoE: 3+ years when resume supports it ---');
  // seniorResume has startDate 2021-01-01, isCurrent, so ~4-5 years
  const rec = 'Highlight 3+ years of experience in the summary';
  const clean = sanitizeRecommendationText(rec, seniorResume, mockJd);
  console.log('  Y.', clean);
  // 3+ years is supported, so should be preserved
  if (!/3\+?\s*years/i.test(clean)) {
    fail('Y. Supported YoE preserved', clean);
  }
  pass('Y. Supported YoE preserved');
}

async function testIsCurrentToFalse() {
  console.log('\n--- Z. Current role: "Set isCurrent to false" ---');
  const rec = 'Set isCurrent to false for the Thrive Wellness role';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  Z.', clean);
  if (/iscurrent/i.test(clean) && !/verify/i.test(clean)) {
    fail('Z. isCurrent to false', clean);
  }
  if (!/verify/i.test(clean)) {
    fail('Z. isCurrent neutral', clean);
  }
  pass('Z. "Set isCurrent to false" rewritten to verification');
}

async function testFabricatedDateBlocked() {
  console.log('\n--- AA. Fabricated date: "Change 2026-02 to 2023-02" ---');
  const rec = 'Change 2026-02 to 2023-02';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  AA.', clean);
  if (clean.includes('2023-02')) {
    fail('AA. Fabricated date', clean);
  }
  if (!/verify/i.test(clean)) {
    fail('AA. Fabricated date verification', clean);
  }
  pass('AA. Fabricated date blocked');
}

async function testFabricatedMetricBlocked() {
  console.log('\n--- AB. Fabricated metric: "Add 30% performance improvement" ---');
  const rec = 'Add 30% performance improvement to the Analytics API bullet';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  AB.', clean);
  if (/30%/.test(clean) && !/do not invent/i.test(clean)) {
    fail('AB. Fabricated metric', clean);
  }
  pass('AB. Fabricated metric blocked');
}

async function testGeneralWillingnessToLearn() {
  console.log('\n--- AC. General "willingness to learn" dropped ---');
  const rec = 'Note willingness to learn new technologies';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  AC.', clean);
  if (clean.trim().length > 0 && /willingness to learn/i.test(clean)) {
    fail('AC. General willingness to learn', clean);
  }
  pass('AC. General "willingness to learn" dropped');
}

async function testAlreadyGroundedPassthrough() {
  console.log('\n--- AD. Already grounded statement passes through ---');
  const rec = 'The JD mentions Docker, but Docker is not demonstrated in the resume. If you have genuine experience with Docker, add it with supporting evidence.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  AD.', clean);
  if (clean !== rec) {
    fail('AD. Already grounded passthrough', clean);
  }
  pass('AD. Already grounded passthrough');
}

async function testConsiderAddingDocker() {
  console.log('\n--- AE. "Consider adding Docker" with missing Docker ---');
  const rec = 'Consider adding Docker to enhance your deployment workflow';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  AE.', clean);
  if (!/genuine experience/i.test(clean) || /consider adding docker/i.test(clean)) {
    fail('AE. Consider adding Docker', clean);
  }
  pass('AE. "Consider adding Docker" rewritten');
}

async function testMigrateToPostgreSQL() {
  console.log('\n--- AF. "Migrate to PostgreSQL" with missing PostgreSQL ---');
  const rec = 'Migrate the project database to PostgreSQL for better scalability';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  AF.', clean);
  if (!/genuine experience/i.test(clean) || /migrate.*postgresql/i.test(clean)) {
    fail('AF. Migrate to PostgreSQL', clean);
  }
  pass('AF. "Migrate to PostgreSQL" rewritten');
}

async function testUseWebSocketsInProject() {
  console.log('\n--- AG. "Use WebSockets in the project" with missing WebSockets ---');
  const rec = 'Use WebSockets in PodSnap for real-time notifications';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  console.log('  AG.', clean);
  if (!/genuine experience/i.test(clean) || /use websockets/i.test(clean)) {
    fail('AG. Use WebSockets in project', clean);
  }
  pass('AG. "Use WebSockets" rewritten');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPEC 15 EXPLICIT REGRESSION TESTS (A–O + Coursework)
// ═══════════════════════════════════════════════════════════════════════════════

async function testSpec15MissingDocker() {
  console.log('\n--- Spec 15.A: Missing Docker: "Add Docker to your skills." ---');
  const rec = 'Add Docker to your skills.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (!/genuine experience/i.test(clean) || /^add\s+docker/i.test(clean)) {
    fail('Spec 15.A Missing Docker', clean);
  }
  pass('Spec 15.A Missing Docker -> conditional');
}

async function testSpec15MissingDockerNoTrigger() {
  console.log('\n--- Spec 15.B: Missing Docker without trigger: "Docker is required for this role." ---');
  const rec = 'Docker is required for this role.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (!/genuine experience/i.test(clean) && clean.trim().length > 0 && !/not demonstrated/i.test(clean)) {
    fail('Spec 15.B Missing Docker No Trigger', clean);
  }
  pass('Spec 15.B Missing Docker without trigger -> conditional or omitted');
}

async function testSpec15MissingCICD() {
  console.log('\n--- Spec 15.C: Missing CI/CD: "Implement CI/CD using GitHub Actions." ---');
  const rec = 'Implement CI/CD using GitHub Actions.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (!/genuine experience/i.test(clean) || /^implement\s+ci\/cd/i.test(clean)) {
    fail('Spec 15.C Missing CI/CD', clean);
  }
  pass('Spec 15.C Missing CI/CD -> conditional');
}

async function testSpec15MissingPostgreSQL() {
  console.log('\n--- Spec 15.D: Missing PostgreSQL: "Add PostgreSQL experience." ---');
  const rec = 'Add PostgreSQL experience.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (!/genuine experience/i.test(clean) || /^add\s+postgresql/i.test(clean)) {
    fail('Spec 15.D Missing PostgreSQL', clean);
  }
  pass('Spec 15.D Missing PostgreSQL -> conditional');
}

async function testSpec15MissingGraphQL() {
  console.log('\n--- Spec 15.E: Missing GraphQL: "Highlight GraphQL." ---');
  const rec = 'Highlight GraphQL.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (!/genuine experience/i.test(clean) || /^highlight\s+graphql/i.test(clean)) {
    fail('Spec 15.E Missing GraphQL', clean);
  }
  pass('Spec 15.E Missing GraphQL -> conditional');
}

async function testSpec15MissingWebSockets() {
  console.log('\n--- Spec 15.F: Missing WebSockets: "Use WebSockets in the project." ---');
  const rec = 'Use WebSockets in the project.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (!/genuine experience/i.test(clean) || /^use\s+websockets/i.test(clean)) {
    fail('Spec 15.F Missing WebSockets', clean);
  }
  pass('Spec 15.F Missing WebSockets -> conditional');
}

async function testSpec15GenuineTechnology() {
  console.log('\n--- Spec 15.G: Genuine technology: "Add TypeScript to your skills." ---');
  const rec = 'Add TypeScript to your skills.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  // TypeScript is in mockResume, so must NOT be rewritten as missing tech
  if (clean !== rec) {
    fail('Spec 15.G Genuine technology', clean);
  }
  pass('Spec 15.G Genuine technology -> unchanged');
}

async function testSpec15FabricatedDate() {
  console.log('\n--- Spec 15.H: Fabricated date: "Change 2026-02 to 2023-02." ---');
  const rec = 'Change 2026-02 to 2023-02.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (clean.includes('2023-02') || clean.includes('2026-02')) {
    fail('Spec 15.H Fabricated date', clean);
  }
  if (!/verify/i.test(clean)) {
    fail('Spec 15.H Fabricated date verification', clean);
  }
  pass('Spec 15.H Fabricated date -> no fabricated replacement date');
}

async function testSpec15SupportedDate() {
  console.log('\n--- Spec 15.I: Supported date: A legitimate resume date ---');
  const rec = 'The role started in 2024-01-01 as documented in the experience.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (!clean.includes('2024-01-01')) {
    fail('Spec 15.I Supported date', clean);
  }
  pass('Spec 15.I Supported date -> preserved');
}

async function testSpec15UnsupportedYoE() {
  console.log('\n--- Spec 15.J: Unsupported YoE: "Add 2+ years of full-stack experience." ---');
  const rec = 'Add 2+ years of full-stack experience.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (/2\+?\s*years/i.test(clean)) {
    fail('Spec 15.J Unsupported YoE', clean);
  }
  pass('Spec 15.J Unsupported YoE -> removed');
}

async function testSpec15OverlappingRoles() {
  console.log('\n--- Spec 15.K: Overlapping education + employment ---');
  const rec = 'Education overlaps with employment dates, which is an integrity concern.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (/integrity concern|fraudulent|suspicious|contradictory/i.test(clean)) {
    fail('Spec 15.K Overlapping roles', clean);
  }
  pass('Spec 15.K Overlapping roles -> not called integrity concern');
}

async function testSpec15FabricatedMetric() {
  console.log('\n--- Spec 15.L: Fabricated metric: "Add 15% improvement." ---');
  const rec = 'Add 15% improvement.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (/15%/.test(clean)) {
    fail('Spec 15.L Fabricated metric', clean);
  }
  if (!/do not invent a metric/i.test(clean)) {
    fail('Spec 15.L Fabricated metric message', clean);
  }
  pass('Spec 15.L Fabricated metric -> reject/rewrite');
}

async function testSpec15LegitimateMetric() {
  console.log('\n--- Spec 15.M: Legitimate metric: Existing "40% improvement" ---');
  const resumeWith40 = {
    ...mockResume,
    experiences: [
      {
        ...mockResume.experiences[0],
        bulletPoints: ['Achieved 40% improvement in API throughput.'],
      }
    ],
  };
  const rec = 'The 40% improvement in API throughput is a strong quantified accomplishment.';
  const clean = sanitizeRecommendationText(rec, resumeWith40, mockJd);
  if (!clean.includes('40%')) {
    fail('Spec 15.M Legitimate metric', clean);
  }
  pass('Spec 15.M Legitimate metric -> preserved');
}

async function testSpec15MissingTechAlreadyPresent() {
  console.log('\n--- Spec 15.N: Missing technology already present: Docker exists in resume ---');
  const rec = 'Enhance the Docker deployment bullet with container orchestration details.';
  const clean = sanitizeRecommendationText(rec, dockerResume, mockJd);
  // Docker IS in dockerResume, so it should discuss Docker normally and NOT claim it is missing
  if (/is not demonstrated/i.test(clean) || /if you have genuine experience/i.test(clean)) {
    fail('Spec 15.N Tech present claimed missing', clean);
  }
  if (!clean.includes('Docker')) {
    fail('Spec 15.N Docker stripped', clean);
  }
  pass('Spec 15.N Missing technology already present -> discussed normally');
}

async function testSpec15NoTechFabrication() {
  console.log('\n--- Spec 15.O: No technology fabrication ---');
  const rec = 'Implement Kubernetes cluster on AWS to demonstrate cloud skills.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (/^implement\s+kubernetes/i.test(clean) || !/genuine experience/i.test(clean)) {
    fail('Spec 15.O No tech fabrication', clean);
  }
  pass('Spec 15.O No technology fabrication -> rewritten conditionally');
}

async function testSpecCourseworkGrounded() {
  console.log('\n--- Coursework: "Add Web Development, AI/ML, Distributed Computing" ---');
  const rec = 'Add Web Development, AI/ML, Distributed Computing to your coursework.';
  const clean = sanitizeRecommendationText(rec, mockResume, mockJd);
  if (clean.includes('Distributed Computing') || clean.includes('Web Development')) {
    fail('Coursework fabricated', clean);
  }
  if (!/if you have coursework directly relevant/i.test(clean)) {
    fail('Coursework safe message', clean);
  }
  pass('Coursework recommendation -> rewritten to conditional form');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Runner
// ═══════════════════════════════════════════════════════════════════════════════

async function runAll() {
  try {
    // Original tests A-N
    await testRecommendationRewriting();
    await testSuspiciousDates();
    await testSkillsPreservation();
    await testMetricGrounding();
    await testFabricatedDateReplacement();
    await testUnconditionalMissingTech();
    await testUnsupportedYoeClaim();
    await testGenuineExperienceConditional();

    // Regression tests A-J
    await testOverlapNotSuspicious();
    await testPastDateNotFutureDated();
    await testMissingDockerConditional();
    await testNoDuplicateMissingTech();
    await testExistingMetricsAcknowledged();
    await testTrueLackOfMetricsIdentifiable();
    await testNoFabricatedYoE();
    await testNiceToHaveLowerPriority();
    await testNoFabricationSuggestions();
    await testGenuineTechUntouched();

    // New tests O-AG
    await testMissingDockerIncludeExperience();
    await testMissingCICDPipeline();
    await testMissingWebSocketsAddLine();
    await testMissingKubernetesBuildProject();
    await testMissingDockerLearnAndAdd();
    await testWillingnessToLearnDocker();
    await testMissingPostgreSQLCreateProject();
    await testGenuineDockerPreserved();
    await testGenuineCICDPreserved();
    await testUnsupportedYoEGeneral();
    await testSupportedYoEPreserved();
    await testIsCurrentToFalse();
    await testFabricatedDateBlocked();
    await testFabricatedMetricBlocked();
    await testGeneralWillingnessToLearn();
    await testAlreadyGroundedPassthrough();
    await testConsiderAddingDocker();
    await testMigrateToPostgreSQL();
    await testUseWebSocketsInProject();

    // Spec 15 Explicit Tests (A–O + Coursework)
    await testSpec15MissingDocker();
    await testSpec15MissingDockerNoTrigger();
    await testSpec15MissingCICD();
    await testSpec15MissingPostgreSQL();
    await testSpec15MissingGraphQL();
    await testSpec15MissingWebSockets();
    await testSpec15GenuineTechnology();
    await testSpec15FabricatedDate();
    await testSpec15SupportedDate();
    await testSpec15UnsupportedYoE();
    await testSpec15OverlappingRoles();
    await testSpec15FabricatedMetric();
    await testSpec15LegitimateMetric();
    await testSpec15MissingTechAlreadyPresent();
    await testSpec15NoTechFabrication();
    await testSpecCourseworkGrounded();

    // Problem 10 Regression Suite (Tests A through L)
    await testProblem10RegressionSuite();

    // Fact + Gap Driven Pipeline Test
    await testDossierAndPersonalizationPipeline();

    console.log('\n🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('\n❌ Test execution failed:', err.message);
    process.exit(1);
  }
}

async function testProblem10RegressionSuite() {
  console.log('\n--- Problem 10 / Final Cleanup Regression Suite (Tests 1 through 13) ---');

  // 1. identical resume -> stable quality scoring behavior
  const score1 = computeDeterministicQuality(mockResume);
  const score2 = computeDeterministicQuality(mockResume);
  const score3 = computeDeterministicQuality(mockResume);
  if (
    score1.overallQualityScore !== score2.overallQualityScore ||
    score2.overallQualityScore !== score3.overallQualityScore ||
    score1.writingQuality !== score2.writingQuality ||
    score1.readability !== score2.readability ||
    score1.criteria.formatting !== score2.criteria.formatting ||
    score1.criteria.parseability !== score2.criteria.parseability ||
    score1.impact !== score2.impact ||
    score1.conciseness !== score2.conciseness ||
    score1.consistency !== score2.consistency
  ) {
    fail('Test 1: stable scoring behavior', 'Quality scores fluctuated between identical runs');
  }
  pass(`Test 1: identical resume -> stable quality scoring behavior (${score1.overallQualityScore} across all runs)`);

  // 2. missing summary -> only one summary finding
  const summaryFindings = [
    "Resume lacks a summary section, making it harder to quickly gauge fit.",
    "Missing summary section.",
    "Empty summary.",
    "Include professional summary.",
  ];
  const dedupedSummary = deduplicateRecommendations(summaryFindings);
  if (dedupedSummary.length !== 1) {
    fail('Test 2: missing summary deduplication', `Expected 1 item, got ${dedupedSummary.length}: ${JSON.stringify(dedupedSummary)}`);
  }
  pass('Test 2: missing summary -> only one summary finding');

  // 3. Remote location -> never recommend changing it to Remote, Global
  const rec3a = "Standardize location formatting: change 'Remote' to 'Remote, Global' to improve consistency.";
  const clean3a = sanitizeRecommendationText(rec3a, mockResume, mockJd);
  if (clean3a.includes('Remote, Global') || clean3a.includes('Remote,Global')) {
    fail('Test 3: Remote location formatting', `Suggested changing to Remote, Global: "${clean3a}"`);
  }
  // If no actual inconsistency across entries, it should be dropped completely
  const resumeConsistentLocation: GeneratedResume = {
    ...mockResume,
    experiences: [
      { companyName: 'Co A', role: 'Dev', startDate: '2024-01-01', location: 'Remote', isCurrent: false, description: '', bulletPoints: [] },
      { companyName: 'Co B', role: 'Dev', startDate: '2024-06-01', location: 'Remote', isCurrent: false, description: '', bulletPoints: [] },
    ],
  };
  const clean3b = sanitizeRecommendationText(rec3a, resumeConsistentLocation, mockJd);
  if (clean3b !== '') {
    fail('Test 3: Remote location with consistent entries', `Expected omitted (empty string), got: "${clean3b}"`);
  }
  // If actual inconsistency across entries, standardizes without inventing "Remote, Global"
  const resumeInconsistentLocation: GeneratedResume = {
    ...mockResume,
    experiences: [
      { companyName: 'Co A', role: 'Dev', startDate: '2024-01-01', location: 'San Francisco, CA', isCurrent: false, description: '', bulletPoints: [] },
      { companyName: 'Co B', role: 'Dev', startDate: '2024-06-01', location: 'Remote', isCurrent: false, description: '', bulletPoints: [] },
    ],
  };
  const clean3c = sanitizeRecommendationText(rec3a, resumeInconsistentLocation, mockJd);
  if (clean3c.includes('Remote, Global') || !clean3c.includes('Standardize location formatting across entries while preserving the actual location information.')) {
    fail('Test 3: Inconsistent location normalization', `Unexpected output: "${clean3c}"`);
  }
  pass('Test 3: Remote location -> never recommend changing it to Remote, Global');

  // 4. missing metric -> conditional metric recommendation
  const rec4 = 'Revise Thrive Wellness bullets to include metrics such as % performance gain or user count.';
  const clean4 = sanitizeRecommendationText(rec4, mockResume, mockJd);
  const expected4 = 'Quantify the existing Thrive Wellness bullets if verified metrics are available; otherwise leave the claims unchanged.';
  if (clean4 !== expected4) {
    fail('Test 4: missing metric recommendation', `Expected "${expected4}", got: "${clean4}"`);
  }
  pass('Test 4: missing metric -> conditional metric recommendation');

  // 5. existing metric -> preserve it
  // mockResume includes 'Built React web applications. Served 20+ clients.'
  const rec5 = 'The 20+ clients served demonstrates good quantifiable impact in the role.';
  const clean5 = sanitizeRecommendationText(rec5, mockResume, mockJd);
  if (!clean5.includes('20+')) {
    fail('Test 5: existing metric preservation', `Existing metrics stripped: "${clean5}"`);
  }
  pass('Test 5: existing metric -> preserve it');

  // 6. existing TypeScript -> don't blindly recommend adding TypeScript
  const rec6 = "Revise a bullet to note TypeScript usage, e.g., 'Built features using TypeScript in Next.js...'";
  const clean6 = sanitizeRecommendationText(rec6, mockResume, mockJd);
  if (clean6 !== '') {
    fail('Test 6: existing TypeScript', `Expected empty string (omitted), got: "${clean6}"`);
  }
  pass("Test 6: existing TypeScript -> don't blindly recommend adding TypeScript");

  // 7. missing Docker -> conditional genuine-experience wording
  const rec7 = 'Add Docker to your skills.';
  const clean7 = sanitizeRecommendationText(rec7, mockResume, mockJd);
  if (!clean7.includes('If you have genuine experience with Docker') || clean7.startsWith('Add Docker')) {
    fail('Test 7: missing Docker', `Expected conditional rewrite, got: "${clean7}"`);
  }
  pass('Test 7: missing Docker -> conditional genuine-experience wording');

  // 8. fabricated date -> rejected
  const rec8 = 'Change startDate from 2026-02 to 2023-02.';
  const clean8 = sanitizeRecommendationText(rec8, mockResume, mockJd);
  if (clean8.includes('2023-02')) {
    fail('Test 8: fabricated date', `Fabricated date was not rejected: "${clean8}"`);
  }
  pass('Test 8: fabricated date -> rejected');

  // 9. unsupported YoE -> rejected
  const rec9 = 'Add a concise summary highlighting 3+ years of full-stack experience.';
  const clean9 = sanitizeRecommendationText(rec9, mockResume, mockJd);
  if (clean9.includes('3+ years') || clean9.includes('3 years')) {
    fail('Test 9: unsupported YoE', `Unsupported YoE was not rejected: "${clean9}"`);
  }
  pass('Test 9: unsupported YoE -> rejected');

  // 10. overlapping education/work -> not suspicious
  const rec10 = 'Education overlaps with employment dates, which is a serious integrity concern.';
  const clean10 = sanitizeRecommendationText(rec10, mockResume, mockJd);
  if (clean10.includes('integrity concern') || clean10.includes('serious') || clean10.includes('suspicious')) {
    fail('Test 10: overlapping education/work', `Overlapping dates called integrity concern: "${clean10}"`);
  }
  pass('Test 10: overlapping education/work -> not suspicious');

  // 11. duplicate recommendations -> deduplicated
  const recs11 = [
    'Change Collaborate to Collaborated in Thrive Wellness bullet',
    'Use consistent past tense for past experiences',
  ];
  const deduped11 = deduplicateRecommendations(recs11);
  if (deduped11.length !== 1) {
    fail('Test 11: duplicate recommendations', `Expected 1 item, got ${deduped11.length}`);
  }
  pass('Test 11: duplicate recommendations -> deduplicated');

  // 12. low-value recommendation -> rejected
  const rec12 = 'Improve your resume formatting to enhance overall presentation.';
  const clean12 = sanitizeRecommendationText(rec12, mockResume, mockJd);
  if (clean12 !== '') {
    fail('Test 12: low-value recommendation', `Expected empty string, got: "${clean12}"`);
  }
  pass('Test 12: low-value recommendation -> rejected');

  // 13. recommendation requiring new experience -> rejected
  const rec13a = 'Learn PostgreSQL to expand backend capabilities.';
  const clean13a = sanitizeRecommendationText(rec13a, mockResume, mockJd);
  if (clean13a.startsWith('Learn PostgreSQL') || !clean13a.includes('If you have genuine experience with PostgreSQL')) {
    fail('Test 13a: learn technology', `Expected conditional rewrite, got: "${clean13a}"`);
  }
  const rec13b = 'Take a course and acquire experience in cloud infrastructure.';
  const clean13b = sanitizeRecommendationText(rec13b, mockResume, mockJd);
  if (clean13b !== '') {
    fail('Test 13b: generic learn new experience', `Expected empty string, got: "${clean13b}"`);
  }
  pass('Test 13: recommendation requiring new experience -> rejected / conditional only');

  // 14. "Change X to Y" rejected if X not in current resume
  const resumeWithCollaborated: GeneratedResume = {
    ...mockResume,
    experiences: [
      {
        companyName: 'Acme Corp',
        role: 'Full Stack Engineer',
        startDate: '2024-01-01',
        isCurrent: true,
        description: 'Collaborated with product teams to build fast web applications.',
        bulletPoints: ['Collaborated with cross-functional teams.'],
      },
    ],
  };
  const rec14a = "Change 'Collaborate' to 'Collaborated' in the first bullet.";
  const clean14a = sanitizeRecommendationText(rec14a, resumeWithCollaborated, mockJd);
  if (clean14a !== '') {
    fail('Test 14a: stale change X to Y', `Expected empty string for absent target X, got: "${clean14a}"`);
  }
  const resumeWithCollaborate: GeneratedResume = {
    ...mockResume,
    experiences: [
      {
        companyName: 'Acme Corp',
        role: 'Full Stack Engineer',
        startDate: '2024-01-01',
        isCurrent: true,
        description: 'Collaborate with product teams to build fast web applications.',
        bulletPoints: ['Collaborate with cross-functional teams.'],
      },
    ],
  };
  const clean14b = sanitizeRecommendationText(rec14a, resumeWithCollaborate, mockJd);
  if (clean14b === '') {
    fail('Test 14b: legitimate change X to Y', 'Expected recommendation to be retained/rewritten for present target X');
  }
  pass('Test 14: "Change X to Y" rejected if X not in current resume');

  // 15. "Add summary" rejected if resume already has summary
  const rec15 = 'Add a concise summary highlighting your engineering achievements.';
  const clean15WithSummary = sanitizeRecommendationText(rec15, mockResume, mockJd);
  if (clean15WithSummary !== '') {
    fail('Test 15: add summary on resume with summary', `Expected empty string, got: "${clean15WithSummary}"`);
  }
  const resumeNoSummary: GeneratedResume = { ...mockResume, summary: '' };
  const clean15NoSummary = sanitizeRecommendationText(rec15, resumeNoSummary, mockJd);
  if (clean15NoSummary === '') {
    fail('Test 15: add summary on resume without summary', 'Expected recommendation to be retained');
  }
  pass('Test 15: "Add summary" rejected if resume already has summary');

  // 16. "Add location" rejected if all experiences have location
  const rec16 = 'Add location to your work history entries.';
  const resumeWithLocations: GeneratedResume = {
    ...mockResume,
    experiences: [
      { companyName: 'A', role: 'Dev', location: 'San Francisco, CA', isCurrent: false, description: '', bulletPoints: [] },
      { companyName: 'B', role: 'Dev', location: 'New York, NY', isCurrent: false, description: '', bulletPoints: [] },
    ],
  };
  const clean16WithLoc = sanitizeRecommendationText(rec16, resumeWithLocations, mockJd);
  if (clean16WithLoc !== '') {
    fail('Test 16: add location when locations exist', `Expected empty string, got: "${clean16WithLoc}"`);
  }
  const resumeMissingLoc: GeneratedResume = {
    ...mockResume,
    experiences: [
      { companyName: 'A', role: 'Dev', isCurrent: false, description: '', bulletPoints: [] },
    ],
  };
  const clean16MissingLoc = sanitizeRecommendationText(rec16, resumeMissingLoc, mockJd);
  if (clean16MissingLoc === '') {
    fail('Test 16: add location when location missing', 'Expected recommendation to be retained');
  }
  pass('Test 16: "Add location" rejected if all experiences have location');

  // 17. "Remove duplicate X" rejected if duplicate is absent
  const rec17 = 'Remove duplicate bullet point in your experience section.';
  const clean17NoDup = sanitizeRecommendationText(rec17, mockResume, mockJd);
  if (clean17NoDup !== '') {
    fail('Test 17: remove duplicate when no duplicate exists', `Expected empty string, got: "${clean17NoDup}"`);
  }
  const resumeWithDup: GeneratedResume = {
    ...mockResume,
    experiences: [
      {
        companyName: 'A',
        role: 'Dev',
        isCurrent: false,
        description: '',
        bulletPoints: ['Built React web applications.', 'Built React web applications.'],
      },
    ],
  };
  const clean17WithDup = sanitizeRecommendationText(rec17, resumeWithDup, mockJd);
  if (clean17WithDup === '') {
    fail('Test 17: remove duplicate when duplicate exists', 'Expected duplicate recommendation to be retained');
  }
  pass('Test 17: "Remove duplicate X" rejected if duplicate is absent');

  // 18. Internal schema leakage blocked
  const schemaLeakRecs = [
    'Set isCurrent to false for past positions',
    'Update startDate to match actual employment',
    'Populate the empty role string for Thrive Wellness',
    'Ensure bulletPoints array has at least 3 items',
  ];
  for (const leakRec of schemaLeakRecs) {
    const cleanLeak = sanitizeRecommendationText(leakRec, mockResume, mockJd);
    if (/\b(?:isCurrent|startDate|endDate|bulletPoints|generationSessionId)\b/i.test(cleanLeak)) {
      fail('Test 18: schema leakage', `Internal field leaked to user: "${cleanLeak}"`);
    }
  }
  pass('Test 18: internal schema leakage blocked (never surfaced to user)');

  // 19. Quick Wins isolation: polish of existing content, never missing technologies
  const quickWinMissingTech = 'Add Docker and Kubernetes to your skills section.';
  const cleanQuickWin = sanitizeRecommendationText(quickWinMissingTech, mockResume, mockJd, { isQuickWin: true });
  if (cleanQuickWin !== '') {
    fail('Test 19: quick win missing tech', `Quick wins recommended missing tech: "${cleanQuickWin}"`);
  }
  const quickWinPolish = 'Change passive phrasing to active voice in the first experience bullet.';
  const cleanQuickWinPolish = sanitizeRecommendationText(quickWinPolish, mockResume, mockJd, { isQuickWin: true });
  if (cleanQuickWinPolish === '') {
    fail('Test 19: quick win valid polish', 'Valid polish quick win was dropped');
  }
  pass('Test 19: Quick Wins isolation (polish only, zero missing tech advice)');

  // 20. Cross-engine deduplication: zero overlapping findings across engines
  const dummyATS: any = {
    recruiterFeedback: {
      topImprovements: [
        'Add a concise summary highlighting your engineering achievements.',
        'Use consistent past tense for previous roles.',
      ],
    },
  };
  const dummyQuality: any = {
    weaknesses: [
      'Resume lacks a summary section, making it harder to quickly gauge fit.',
    ],
    quickWins: [
      'Use consistent past tense for previous roles.',
    ],
  };
  const dummyRecruiter: any = {
    weaknesses: [
      'Missing summary section.',
    ],
  };
  deduplicateCrossEngineResults(dummyATS, dummyQuality, dummyRecruiter);
  if (dummyQuality.weaknesses.length !== 0) {
    fail('Test 20: quality weakness duplicate of recruiter weakness', `Expected 0, got ${dummyQuality.weaknesses.length}`);
  }
  if (dummyATS.recruiterFeedback.topImprovements.some((ti: string) => ti.includes('past tense') || ti.includes('summary'))) {
    fail('Test 20: topImprovements contains duplicate finding', JSON.stringify(dummyATS.recruiterFeedback.topImprovements));
  }
  pass('Test 20: cross-engine deduplication guarantees non-overlapping findings');

  // LIVE FIX-THEN-RERUN DEMONSTRATION:
  console.log('\n--- LIVE FIX-THEN-RERUN DEMONSTRATION ---');
  const resumeBeforeFix: GeneratedResume = {
    ...mockResume,
    summary: '',
    experiences: [
      {
        companyName: 'Startup Inc',
        role: 'Engineer',
        location: '',
        startDate: '2024-01-01',
        isCurrent: true,
        description: 'Collaborate with team.',
        bulletPoints: ['Collaborate with frontend developers on web portal.'],
      },
    ],
  };

  const summaryRecBefore = sanitizeRecommendationText('Add a concise professional summary.', resumeBeforeFix, mockJd);
  const locationRecBefore = sanitizeRecommendationText('Add location to your work history entries.', resumeBeforeFix, mockJd);
  const tenseRecBefore = sanitizeRecommendationText("Change 'Collaborate' to 'Collaborated' in Startup Inc bullet.", resumeBeforeFix, mockJd);

  console.log('  Initial state findings:');
  console.log('    Summary finding:', summaryRecBefore);
  console.log('    Location finding:', locationRecBefore);
  console.log('    Tense finding:', tenseRecBefore);

  if (!summaryRecBefore || !locationRecBefore || !tenseRecBefore) {
    fail('Live Demo: Initial state', 'Expected all 3 findings to be active before fix');
  }

  const resumeAfterFix: GeneratedResume = {
    ...resumeBeforeFix,
    summary: 'Full stack engineer with strong web application background.',
    experiences: [
      {
        companyName: 'Startup Inc',
        role: 'Engineer',
        location: 'San Francisco, CA',
        startDate: '2024-01-01',
        isCurrent: true,
        description: 'Collaborated with team.',
        bulletPoints: ['Collaborated with frontend developers on web portal.'],
      },
    ],
  };

  const summaryRecAfter = sanitizeRecommendationText('Add a concise professional summary.', resumeAfterFix, mockJd);
  const locationRecAfter = sanitizeRecommendationText('Add location to your work history entries.', resumeAfterFix, mockJd);
  const tenseRecAfter = sanitizeRecommendationText("Change 'Collaborate' to 'Collaborated' in Startup Inc bullet.", resumeAfterFix, mockJd);

  console.log('  After-fix state findings:');
  console.log('    Summary finding:', summaryRecAfter || '(REJECTED - Issue Resolved)');
  console.log('    Location finding:', locationRecAfter || '(REJECTED - Issue Resolved)');
  console.log('    Tense finding:', tenseRecAfter || '(REJECTED - Issue Resolved)');

  if (summaryRecAfter !== '' || locationRecAfter !== '' || tenseRecAfter !== '') {
    fail('Live Demo: After fix', `Expected all 3 stale findings to be rejected, got: summary="${summaryRecAfter}", loc="${locationRecAfter}", tense="${tenseRecAfter}"`);
  }
  pass('Live Demo: When candidate fixes resume, recommendations immediately disappear on rerun!');
}

async function testDossierAndPersonalizationPipeline() {
  console.log('\n--- Root Recommendation Generation Pipeline (Fact + Gap Driven) ---');

  // 1. Opportunity Dossier accurately synthesizes facts and gaps
  const facts = extractResumeFacts(mockResume);
  const jdFacts = extractJdFacts(mockJd);
  const gap = computeResumeJdGap(facts, jdFacts);
  const dossier = generateOpportunityDossier(facts, jdFacts, gap);

  console.log('  Generated Opportunity Dossier sample:\n', dossier.split('\n').slice(0, 6).join('\n'));

  // Assert dossier contains core strengths
  if (!dossier.includes('VERIFIED CANDIDATE STRENGTHS') || !dossier.includes('typescript') || !dossier.includes('react')) {
    fail('Dossier: strengths', 'Expected verified candidate strengths in dossier');
  }

  // Assert dossier identifies genuinely missing JD requirements
  if (!dossier.includes('GENUINELY MISSING JD REQUIREMENTS') || !dossier.includes('docker') || !dossier.includes('postgresql')) {
    fail('Dossier: missing requirements', 'Expected missing JD requirements in dossier');
  }

  // Assert bullet opportunities detected
  if (!dossier.includes('SPECIFIC BULLET REVISION ANCHORS') || facts.bulletOpportunities.length === 0) {
    fail('Dossier: bullet anchors', 'Expected specific bullet revision anchors in facts');
  }
  pass('Pipeline Test 1: Opportunity Dossier accurately extracts facts, matches, and bullet anchors');

  // 2. Skills-only detection
  const resumeWithSkillsOnly: GeneratedResume = {
    ...mockResume,
    skills: [
      { name: 'TypeScript', category: 'LANGUAGE' },
      { name: 'React', category: 'FRAMEWORK' },
      { name: 'Redis', category: 'DATABASE' },
    ],
  };
  const factsSkillsOnly = extractResumeFacts(resumeWithSkillsOnly);
  if (!factsSkillsOnly.skillsInSkillsOnly.includes('redis')) {
    fail('Pipeline Test 2: skills-only detection', `Expected redis in skillsInSkillsOnly, got: ${JSON.stringify(factsSkillsOnly.skillsInSkillsOnly)}`);
  }
  pass('Pipeline Test 2: Skills listed without project/experience evidence are correctly identified');

  // 3. Bullet opportunity categorization
  const testResumeBullets: GeneratedResume = {
    ...mockResume,
    experiences: [
      {
        companyName: 'TechCorp',
        role: 'Senior Engineer',
        startDate: '2023-01-01',
        isCurrent: true,
        description: '',
        bulletPoints: [
          'Worked on the backend microservices architecture.',
          'Implemented OAuth2 authentication and user management workflows.',
          'Served 500+ daily active users across North America.',
        ],
      },
    ],
  };
  const factsBullets = extractResumeFacts(testResumeBullets);
  const weakVerbOpp = factsBullets.bulletOpportunities.find((o) => o.type === 'weak_verb');
  const unquantOpp = factsBullets.bulletOpportunities.find((o) => o.type === 'unquantified');

  if (!weakVerbOpp || !weakVerbOpp.text.includes('Worked on')) {
    fail('Pipeline Test 3: weak verb opportunity', 'Expected weak verb bullet to be detected');
  }
  if (!unquantOpp || !unquantOpp.text.includes('OAuth2')) {
    fail('Pipeline Test 3: unquantified opportunity', 'Expected unquantified bullet to be detected');
  }
  pass('Pipeline Test 3: Bullet-level opportunities (weak verbs vs unquantified achievements) are accurately categorized');
}

runAll();
