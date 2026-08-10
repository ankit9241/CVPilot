/**
 * Phase 32: ATS Calibration Benchmark.
 * Runs the deterministic CVPilot ATS over 25 resumes x 3 JDs each and
 * aggregates scores by role category. Read-only: does NOT modify the engine.
 *
 * Run: npx tsx ats-benchmark.ts
 */
import { analyzeATS } from './src/modules/ats/ats.utils';
import { GeneratedResume } from './src/ai/types';

// ─── JD pool ─────────────────────────────────────────────────────────────────
interface Jd { text: string; required: string[]; }
const JDS: Record<string, Jd> = {
  fresherGen: { text: 'Entry-level Software Engineer. Required: JavaScript, HTML, CSS, Git. Preferred: React. Nice to have: Node.js.', required: ['javascript', 'html', 'css', 'git'] },
  backendNode: { text: 'Backend Engineer. Required: Node.js, TypeScript, PostgreSQL, REST API. Preferred: AWS, Docker. Nice to have: Kubernetes.', required: ['node.js', 'typescript', 'postgresql', 'rest api'] },
  backendPy: { text: 'Python Backend Engineer. Required: Python, FastAPI, PostgreSQL, Docker. Preferred: AWS, Redis.', required: ['python', 'fastapi', 'postgresql', 'docker'] },
  backendJava: { text: 'Java Backend Engineer. Required: Java, Spring Boot, Kafka. Preferred: Kubernetes, PostgreSQL.', required: ['java', 'spring boot', 'kafka'] },
  frontend: { text: 'Frontend Engineer. Required: React, TypeScript, HTML, CSS. Preferred: Next.js, Tailwind. Nice to have: Redux.', required: ['react', 'typescript', 'html', 'css'] },
  frontendVue: { text: 'Frontend Engineer. Required: Vue, TypeScript, HTML, CSS. Preferred: Pinia, Vite.', required: ['vue', 'typescript', 'html', 'css'] },
  fullstack: { text: 'Full Stack Engineer. Required: React, Node.js, TypeScript, PostgreSQL. Preferred: Docker, AWS.', required: ['react', 'node.js', 'typescript', 'postgresql'] },
  dataAnalyst: { text: 'Data Analyst. Required: SQL, Excel, Data Visualization. Preferred: Tableau, Python.', required: ['sql'] },
  dataEng: { text: 'Data Engineer. Required: Python, SQL, Spark, Airflow. Preferred: AWS, Kafka.', required: ['python', 'sql', 'spark', 'airflow'] },
  dataSci: { text: 'Data Scientist. Required: Python, Pandas, Machine Learning, Statistics. Preferred: scikit-learn, SQL.', required: ['python', 'machine learning'] },
  mlEng: { text: 'ML Engineer. Required: Python, TensorFlow, PyTorch, Machine Learning. Preferred: Docker, AWS.', required: ['python', 'tensorflow', 'pytorch', 'machine learning'] },
  aiEng: { text: 'AI Engineer. Required: Python, LLM, LangChain, OpenAI API. Preferred: FastAPI, Docker.', required: ['python', 'llm', 'openai'] },
  mlops: { text: 'MLOps Engineer. Required: Docker, Kubernetes, AWS, MLflow, CI/CD. Preferred: Terraform.', required: ['docker', 'kubernetes', 'aws', 'ci/cd'] },
  seniorBackend: { text: 'Senior Backend Engineer. Required: Node.js, TypeScript, PostgreSQL, Redis, AWS, Docker. Preferred: Kubernetes, Kafka.', required: ['node.js', 'typescript', 'postgresql', 'redis', 'aws', 'docker'] },
  seniorFrontend: { text: 'Senior Frontend Engineer. Required: React, TypeScript, Next.js, Performance. Preferred: Testing, Design Systems.', required: ['react', 'typescript', 'next.js'] },
  seniorFullstack: { text: 'Senior Full Stack Engineer. Required: React, Node.js, TypeScript, AWS, PostgreSQL. Preferred: Kubernetes, GraphQL.', required: ['react', 'node.js', 'typescript', 'aws', 'postgresql'] },
  staff: { text: 'Staff Software Engineer. Required: Distributed Systems, Kafka, Kubernetes, System Design, Go. Preferred: AWS, Terraform.', required: ['kubernetes', 'kafka'] },
};

// ─── Resume factory ──────────────────────────────────────────────────────────
interface Exp { c: string; r: string; s: string; e?: string; cur?: boolean; d: string; b: string[]; }
function R(category: string, summary: string, exps: Exp[], skills: string[], edu?: string): { category: string; resume: GeneratedResume } {
  const experiences: GeneratedResume['experiences'] = exps.map((x) => ({
    companyName: x.c, role: x.r, startDate: x.s, endDate: x.e, isCurrent: x.cur ?? !x.e,
    description: x.d, bulletPoints: x.b, location: '',
  }));
  return {
    category,
    resume: {
      summary,
      experiences,
      projects: [],
      skills: skills.map((name) => ({ name, category: 'OTHER' })),
      education: edu ? [{ school: 'University', degree: edu, field: 'Computer Science' }] : [],
      certificates: [], achievements: [],
      metadata: { targetRole: '', companyName: '', generationSessionId: '', generatedAt: '', keywordMatches: [], selectionRationale: '' },
    },
  };
}

// 25 resumes across required categories.
const RES = [
  R('fresher', 'Recent graduate passionate about building web applications.', [
    { c: 'Startup', r: 'Intern', s: '2024-06', e: '2024-12', d: 'Assisted frontend development.', b: ['Built responsive UI components with HTML, CSS and JavaScript.', 'Fixed 20+ accessibility issues across the marketing site.'] },
  ], ['JavaScript', 'HTML', 'CSS', 'Git', 'React']),
  R('fresher', 'New graduate interested in backend systems and APIs.', [
    { c: 'Bootcamp', r: 'Graduate Developer', s: '2024-09', e: '2025-03', d: 'Built full stack projects.', b: ['Created a REST API with Node.js and Express handling user auth.', 'Designed a MongoDB schema supporting 10+ entities.'] },
  ], ['JavaScript', 'Node.js', 'Express', 'MongoDB', 'Git']),
  R('junior', 'Backend developer with 1.5 years building APIs.', [
    { c: 'Fintech', r: 'Junior Backend Engineer', s: '2024-02', cur: true, d: 'Maintained core payment APIs.', b: ['Shipped 15 REST endpoints in Node.js and TypeScript.', 'Reduced p95 latency by 30% with query tuning.'] },
  ], ['Node.js', 'TypeScript', 'PostgreSQL', 'Express', 'Docker']),
  R('junior', 'Frontend developer with 1.5 years in React.', [
    { c: 'Agency', r: 'Junior Frontend Engineer', s: '2024-01', cur: true, d: 'Built client dashboards.', b: ['Implemented React components with TypeScript and Tailwind.', 'Cut bundle size by 25% with code splitting.'] },
  ], ['React', 'TypeScript', 'Tailwind', 'HTML', 'CSS', 'JavaScript']),
  R('junior', 'Full stack developer with 2 years experience.', [
    { c: 'Saas', r: 'Full Stack Developer', s: '2023-08', cur: true, d: 'Shipped customer-facing features end to end.', b: ['Built features across React, Node.js and MongoDB.', 'Automated deployments cutting release time by 50%.'] },
  ], ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'TypeScript']),
  R('mid', 'Backend engineer with 4 years in Node.js and cloud.', [
    { c: 'Logistics', r: 'Backend Engineer', s: '2022-03', cur: true, d: 'Owned order-processing services.', b: ['Designed event-driven services in Node.js and Redis.', 'Deployed to AWS serving 50k daily requests.', 'Improved throughput 2x with caching.'] },
  ], ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'AWS', 'Docker']),
  R('mid', 'Frontend engineer with 4 years in React and Next.js.', [
    { c: 'Ecommerce', r: 'Frontend Engineer', s: '2022-05', cur: true, d: 'Led checkout frontend.', b: ['Rebuilt checkout in React and Next.js.', 'Raised conversion by 15% with A/B-tested changes.', 'Introduced testing cutting regressions by 40%.'] },
  ], ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Redux']),
  R('mid', 'Full stack engineer with 4 years experience.', [
    { c: 'Healthtech', r: 'Full Stack Engineer', s: '2022-01', cur: true, d: 'Built provider dashboards.', b: ['Delivered features across React, Node.js and PostgreSQL.', 'Dockerized services and cut setup time by 60%.', 'Handled 10k concurrent users at peak.'] },
  ], ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'JavaScript']),
  R('mid', 'Data analyst with 4 years in SQL and analytics.', [
    { c: 'Retail', r: 'Data Analyst', s: '2022-02', cur: true, d: 'Reported on sales performance.', b: ['Built SQL pipelines powering 30 dashboards.', 'Delivered weekly insights to 5 product teams.', 'Identified churn drivers saving $200k annually.'] },
  ], ['SQL', 'Excel', 'Tableau', 'Python', 'Pandas']),
  R('senior', 'Senior backend engineer with 7 years in distributed systems.', [
    { c: 'RideShare', r: 'Senior Backend Engineer', s: '2021-04', cur: true, d: 'Owned dispatch platform.', b: ['Scaled dispatch to 2M daily trips with Node.js and Redis.', 'Cut infra cost 35% via AWS optimization.', 'Led 4-engineer team on latency initiative.', 'Migrated to Kubernetes serving 10k pods.'] },
  ], ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'AWS', 'Docker', 'Kubernetes']),
  R('senior', 'Senior frontend engineer with 8 years in React.', [
    { c: 'DesignTool', r: 'Senior Frontend Engineer', s: '2020-06', cur: true, d: 'Owned design-system platform.', b: ['Built design system used by 40 squads.', 'Improved render performance 3x via virtualization.', 'Mentored 6 engineers across teams.'] },
  ], ['React', 'TypeScript', 'Next.js', 'JavaScript', 'Redux', 'CSS']),
  R('senior', 'Senior full stack engineer with 8 years experience.', [
    { c: 'Marketplace', r: 'Senior Full Stack Engineer', s: '2019-08', cur: true, d: 'Led core listing experience.', b: ['Owned listing stack across React and Node.js.', 'Drove adoption of TypeScript across 12 services.', 'Scaled search to 1M requests with AWS.'] },
  ], ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'GraphQL', 'Docker']),
  R('staff', 'Staff engineer with 10 years in distributed systems.', [
    { c: 'Streaming', r: 'Staff Software Engineer', s: '2016-01', cur: true, d: 'Owned data platform.', b: ['Designed Kafka pipeline processing 5B events daily.', 'Led Kubernetes migration for 200 microservices.', 'Championed system design reviews across org.'] },
  ], ['Kafka', 'Kubernetes', 'Go', 'AWS', 'Terraform', 'Distributed Systems']),
  R('data', 'Data analyst with 3 years in analytics.', [
    { c: 'Insurance', r: 'Data Analyst', s: '2023-01', cur: true, d: 'Analyzed claims data.', b: ['Built SQL models tracking 50 KPIs.', 'Automated reports saving 10 hours weekly.', 'Presented insights to senior leadership monthly.'] },
  ], ['SQL', 'Excel', 'Tableau', 'Python']),
  R('data', 'Data engineer with 5 years building pipelines.', [
    { c: 'Bank', r: 'Data Engineer', s: '2021-03', cur: true, d: 'Owned analytics warehouse.', b: ['Built Spark pipelines transforming 2TB daily.', 'Orchestrated 80 DAGs in Airflow.', 'Deployed to AWS cutting job time by 45%.'] },
  ], ['Python', 'SQL', 'Spark', 'Airflow', 'AWS', 'Kafka']),
  R('data', 'Data scientist with 4 years in ML modeling.', [
    { c: 'Telecom', r: 'Data Scientist', s: '2022-04', cur: true, d: 'Built churn models.', b: ['Trained churn model lifting retention 8%.', 'Deployed models with scikit-learn and Python.', 'Improved forecast accuracy by 12%.'] },
  ], ['Python', 'Pandas', 'scikit-learn', 'SQL', 'Machine Learning']),
  R('ml', 'ML engineer with 5 years in production ML.', [
    { c: 'AdTech', r: 'ML Engineer', s: '2021-02', cur: true, d: 'Owned ranking models.', b: ['Shipped ranking models in TensorFlow serving 10M requests.', 'Cut training time 40% with PyTorch.', 'Deployed to AWS with Docker.'] },
  ], ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Docker', 'AWS']),
  R('ml', 'AI engineer with 4 years building LLM apps.', [
    { c: 'SaaS', r: 'AI Engineer', s: '2022-06', cur: true, d: 'Built AI assistant.', b: ['Built LLM assistant with LangChain and OpenAI.', 'Wired retrieval across 100k docs.', 'Deployed FastAPI service handling 5k queries daily.'] },
  ], ['Python', 'LLM', 'LangChain', 'OpenAI', 'FastAPI', 'Docker']),
  R('ml', 'MLOps engineer with 6 years in ML infra.', [
    { c: 'Fintech', r: 'MLOps Engineer', s: '2020-01', cur: true, d: 'Owned ML deployment platform.', b: ['Standardized model deploys on Kubernetes.', 'Built CI/CD reducing release time 70%.', 'Managed MLflow across 30 teams.', 'Cut AWS cost 30% via auto-scaling.'] },
  ], ['Docker', 'Kubernetes', 'AWS', 'MLflow', 'CI/CD', 'Terraform']),
  R('backend', 'Python backend engineer with 5 years.', [
    { c: 'EdTech', r: 'Backend Engineer', s: '2021-05', cur: true, d: 'Owned course APIs.', b: ['Built FastAPI services serving 1M users.', 'Designed PostgreSQL schemas for billing.', 'Containerized stack with Docker.'] },
  ], ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Redis']),
  R('backend', 'Java backend engineer with 6 years.', [
    { c: 'Payments', r: 'Backend Engineer', s: '2020-04', cur: true, d: 'Owned ledger services.', b: ['Built Spring Boot services processing 3M payments.', 'Designed Kafka consumers for event streaming.', 'Deployed on Kubernetes.'] },
  ], ['Java', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Kubernetes']),
  R('frontend', 'React developer with 5 years.', [
    { c: 'Fintech', r: 'Frontend Engineer', s: '2021-06', cur: true, d: 'Owned banking UI.', b: ['Built React and TypeScript app for 2M users.', 'Introduced Redux state layer across modules.', 'Improved load time 35% with lazy loading.'] },
  ], ['React', 'TypeScript', 'Redux', 'JavaScript', 'CSS']),
  R('frontend', 'Vue developer with 4 years.', [
    { c: 'Marketplace', r: 'Frontend Engineer', s: '2022-03', cur: true, d: 'Built seller dashboards.', b: ['Shipped Vue and TypeScript dashboards.', 'Set up Pinia state management.', 'Optimized Vite build cutting size 30%.'] },
  ], ['Vue', 'TypeScript', 'Pinia', 'Vite', 'HTML', 'CSS']),
  R('fullstack', 'Full stack developer with 5 years (Node + React).', [
    { c: 'Travel', r: 'Full Stack Engineer', s: '2021-01', cur: true, d: 'Owned booking platform.', b: ['Built booking flow across React and Node.js.', 'Designed PostgreSQL data model for 1M bookings.', 'Deployed to AWS handling 20k daily users.'] },
  ], ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS']),
  R('fullstack', 'Full stack developer with 3 years (Next + Prisma).', [
    { c: 'Startup', r: 'Full Stack Developer', s: '2023-04', cur: true, d: 'Built core product.', b: ['Developed Next.js app with Prisma and PostgreSQL.', 'Added auth and billing for 5k users.', 'Deployed with Vercel and Docker.'] },
  ], ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'React', 'Docker']),
];

// JD assignment per resume (3 JDs each: primary + adjacent + general/senior).
const JD_ASSIGN: Record<string, string[]> = {
  fresher: ['fresherGen', 'frontend', 'backendNode'],
  junior: ['backendNode', 'backendPy', 'fresherGen'],
  mid: ['backendNode', 'seniorBackend', 'fullstack'],
  senior: ['seniorBackend', 'backendNode', 'fullstack'],
  staff: ['staff', 'backendJava', 'seniorBackend'],
  data: ['dataAnalyst', 'dataEng', 'dataSci'],
  ml: ['mlEng', 'aiEng', 'mlops'],
  backend: ['backendNode', 'backendPy', 'backendJava'],
  frontend: ['frontend', 'frontendVue', 'seniorFrontend'],
  fullstack: ['fullstack', 'fullstack', 'seniorFullstack'],
};

// ─── Run benchmark ───────────────────────────────────────────────────────────
interface Row { resume: string; category: string; jd: string; overall: number; kw: number; skills: number; exp: number; fmt: number; imp: number; matchedReq: number; }

const rows: Row[] = [];
for (const { category, resume } of RES) {
  for (const jdKey of JD_ASSIGN[category] || []) {
    const jd = JDS[jdKey];
    if (!jd) continue;
    const rep = analyzeATS(resume, jd.text);
    const reqMatched = jd.required.filter((t) =>
      resume.skills.some((s) => s.name.toLowerCase().includes(t.split('.')[0].toLowerCase())) ||
      (resume.summary + ' ' + JSON.stringify(resume.experiences)).toLowerCase().includes(t)
    ).length;
    rows.push({
      resume: resume.experiences[0]?.companyName || category,
      category, jd: jdKey, overall: rep.overallScore,
      kw: rep.scoreBreakdown.keywordMatch, skills: rep.scoreBreakdown.skillsMatch,
      exp: rep.scoreBreakdown.experienceRelevance, fmt: rep.scoreBreakdown.formatting,
      imp: rep.scoreBreakdown.impact,
      matchedReq: reqMatched / Math.max(1, jd.required.length),
    });
  }
}

// ─── Aggregate + stats ───────────────────────────────────────────────────────
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const stdev = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / Math.max(1, a.length - 1));
};
const ci95 = (a: number[]) => {
  if (a.length < 2) return [mean(a), mean(a)];
  const m = mean(a), sd = stdev(a);
  const se = sd / Math.sqrt(a.length);
  const t = 1.96;
  return [Math.max(0, m - t * se), Math.min(100, m + t * se)];
};

const cats = [...new Set(rows.map((r) => r.category))];
console.log('=== CVPilot ATS Benchmark ===');
console.log(`Pairs analyzed: ${rows.length} (${RES.length} resumes x 3 JDs)\n`);
console.log('Category       n   Mean   Median  Min  Max   CI95(low)  CI95(high)  AvgReqMatch');
for (const c of cats) {
  const rs = rows.filter((r) => r.category === c).map((r) => r.overall);
  const sorted = [...rs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const [lo, hi] = ci95(rs);
  const req = mean(rows.filter((r) => r.category === c).map((r) => r.matchedReq));
  console.log(`${c.padEnd(14)} ${String(rs.length).padEnd(4)} ${mean(rs).toFixed(1).padEnd(6)} ${median.toFixed(0).padEnd(7)} ${Math.min(...rs).toFixed(0).padEnd(5)} ${Math.max(...rs).toFixed(0).padEnd(5)} ${lo.toFixed(1).padEnd(11)} ${hi.toFixed(1).padEnd(12)} ${(req * 100).toFixed(0)}%`);
}

console.log('\n=== Category breakdown (mean sub-scores) ===');
console.log('Category       Overall  Keyword  Skills  Experience  Format  Impact');
for (const c of cats) {
  const rs = rows.filter((r) => r.category === c);
  const fmt = (k: (r: Row) => number) => mean(rs.map(k)).toFixed(1);
  console.log(`${c.padEnd(14)} ${mean(rs.map(r=>r.overall)).toFixed(1).padEnd(8)} ${fmt(r=>r.kw).padEnd(8)} ${fmt(r=>r.skills).padEnd(7)} ${fmt(r=>r.exp).padEnd(11)} ${fmt(r=>r.fmt).padEnd(7)} ${fmt(r=>r.imp)}`);
}

// Correlation of overall vs required-tech match (calibration sanity signal)
const allOverall = rows.map((r) => r.overall);
const allReq = rows.map((r) => r.matchedReq);
const corr = (() => {
  const m1 = mean(allOverall), m2 = mean(allReq);
  const num = allOverall.reduce((s, o, i) => s + (o - m1) * (allReq[i] - m2), 0);
  const d1 = Math.sqrt(allOverall.reduce((s, o) => s + (o - m1) ** 2, 0));
  const d2 = Math.sqrt(allReq.reduce((s, r) => s + (r - m2) ** 2, 0));
  return d1 && d2 ? num / (d1 * d2) : 0;
})();
console.log(`\nCorrelation(overall, JD required-tech match): ${corr.toFixed(2)}`);
console.log('\n=== All pairs ===');
for (const r of rows) console.log(`${r.category.padEnd(10)} ${r.resume.padEnd(12)} vs ${r.jd.padEnd(14)} -> ${r.overall} (req ${Math.round(r.matchedReq * 100)}%)`);
