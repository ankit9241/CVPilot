#!/usr/bin/env node
/**
 * Prompt QA — validates all refactored prompts produce correct output
 * across 5 experience levels: Student, Fresher, 2 YoE, 5 YoE, 10 YoE.
 *
 * Run: npx ts-node src/ai/prompt-qa.ts
 *
 * Each persona is fed through: summary → experience-bullets → project-bullets → resume-json
 * Output is validated deterministically against the QA checklist.
 */

import { initializeAIModule, checkAIModuleHealth } from './init';
import 'dotenv/config';
import { getLLMClient } from './llm/client';
import { parseJSON } from './utils/json-parser';
import {
  summaryPrompt,
  experienceBulletsPrompt,
  projectBulletsPrompt,
  resumeJsonPrompt,
} from './prompts';
import { GeneratedResume } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface QAPersona {
  name: string;
  targetRole: string;
  companyName: string;
  experienceYears: number;
  summaryContext: string;
  experiences: Array<{
    companyName: string;
    role: string;
    description: string;
    bulletPoints: string[];
    technologies: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    role?: string;
    technologies: string[];
    bulletPoints: string[];
    impact: string;
  }>;
  skills: string[];
  educations: Array<{ school: string; degree: string; field?: string }>;
  certificates: Array<{ name: string; issuer: string }>;
  achievements: string[];
}

interface QAResult {
  persona: string;
  summary: { pass: boolean; wordCount: number; errors: string[] };
  experienceBullets: { pass: boolean; avgWords: number; errors: string[] };
  projectBullets: { pass: boolean; avgWords: number; maxTechs: number; errors: string[] };
  resume: {
    pass: boolean;
    totalWordCount: number;
    weakPhrases: string[];
    repeatedContent: string[];
    hallucinatedTechs: string[];
    noWeakVerbs: boolean;
    professionalTone: boolean;
    errors: string[];
  };
  overallPass: boolean;
  rawOutputs: Record<string, string>;
}

// ─── Persona Data ────────────────────────────────────────────────────────────

const WEAK_PHRASES = ['worked on', 'responsible for', 'helped with', 'participated in', 'assisted with'];
const ACTION_VERBS = [
  'architected', 'engineered', 'optimized', 'automated', 'launched', 'led',
  'scaled', 'delivered', 'designed', 'reduced', 'increased', 'streamlined',
  'built', 'implemented', 'improved', 'developed', 'created', 'established',
  'spearheaded', 'championed', 'transformed', 'revamped', 'constructed',
];

const PERSONAS: QAPersona[] = [
  // ── Student ────────────────────────────────────────────────────────────
  {
    name: 'Student',
    targetRole: 'Software Engineering Intern',
    companyName: 'Stripe',
    experienceYears: 0,
    summaryContext: 'Computer Science student seeking internship. Coursework in data structures, algorithms, web development. Side projects in React and Python.',
    experiences: [
      {
        companyName: 'University IT Services',
        role: 'Student Developer Intern',
        description: 'Built internal tools for the university portal.',
        bulletPoints: ['Developed a React-based course registration UI', 'Wrote Python scripts to automate grade report generation'],
        technologies: ['React', 'Python', 'JavaScript', 'SQL'],
      },
    ],
    projects: [
      {
        name: 'StudyBuddy',
        description: 'A collaborative study session tracker with real-time scheduling.',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'WebSocket'],
        bulletPoints: ['Built real-time collaborative study scheduling', 'Designed PostgreSQL schema for session persistence'],
        impact: 'Used by 200+ students in beta',
      },
      {
        name: 'Portfolio Site',
        description: 'Personal portfolio showcasing projects and blog posts.',
        technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
        bulletPoints: ['Created responsive portfolio with blog', 'Deployed on Vercel with custom domain'],
        impact: 'Hosts 6 project showcases',
      },
    ],
    skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'HTML', 'CSS', 'SQL'],
    educations: [{ school: 'University of Michigan', degree: 'B.S.', field: 'Computer Science (In Progress)' }],
    certificates: [],
    achievements: ['Dean\'s List Fall 2024'],
  },

  // ── Fresher ────────────────────────────────────────────────────────────
  {
    name: 'Fresher',
    targetRole: 'Junior Software Engineer',
    companyName: 'Microsoft',
    experienceYears: 1,
    summaryContext: 'Recent CS graduate with internship experience. Built full-stack applications. Familiar with cloud platforms.',
    experiences: [
      {
        companyName: 'TechStart Inc',
        role: 'Software Engineering Intern',
        description: 'Worked on the frontend team building customer-facing features.',
        bulletPoints: ['Implemented responsive UI components in React', 'Wrote unit tests with Jest achieving 85% coverage', 'Fixed 20+ accessibility issues in the onboarding flow'],
        technologies: ['React', 'TypeScript', 'Jest', 'CSS'],
      },
    ],
    projects: [
      {
        name: 'Expense Tracker',
        description: 'Full-stack personal finance tracker with budgeting features.',
        technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Chart.js'],
        bulletPoints: ['Built REST API for expense CRUD operations', 'Implemented interactive budget charts'],
        impact: 'Personal project with 50+ weekly users',
      },
      {
        name: 'Weather Dashboard',
        description: 'Real-time weather dashboard pulling from OpenWeatherMap API.',
        technologies: ['React', 'TypeScript', 'OpenWeatherMap API', 'Tailwind CSS'],
        bulletPoints: ['Integrated third-party weather API with caching', 'Designed responsive dark-mode UI'],
        impact: '',
      },
    ],
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Git', 'HTML', 'CSS', 'Jest'],
    educations: [{ school: 'University of Texas', degree: 'B.S.', field: 'Computer Science' }],
    certificates: [{ name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services' }],
    achievements: ['Hackathon Winner 2024'],
  },

  // ── 2 YoE ──────────────────────────────────────────────────────────────
  {
    name: '2 YoE',
    targetRole: 'Frontend Engineer',
    companyName: 'Airbnb',
    experienceYears: 2,
    summaryContext: 'Frontend-focused engineer with 2 years building production React apps. Experienced with TypeScript, testing, and performance optimization.',
    experiences: [
      {
        companyName: 'FinTech Labs',
        role: 'Frontend Developer',
        description: 'Built and maintained the customer-facing web application.',
        bulletPoints: ['Developed a React component library used across 3 product teams', 'Reduced bundle size by 30% through code splitting', 'Built real-time data visualization dashboards using D3.js'],
        technologies: ['React', 'TypeScript', 'D3.js', 'Webpack', 'Jest'],
      },
      {
        companyName: 'WebAgency Pro',
        role: 'Junior Developer',
        description: 'Built client websites and internal tools.',
        bulletPoints: ['Delivered 10+ client websites using React and Tailwind', 'Set up CI/CD pipeline using GitHub Actions'],
        technologies: ['React', 'Tailwind CSS', 'GitHub Actions', 'Vercel'],
      },
    ],
    projects: [
      {
        name: 'Design System',
        description: 'Internal component library with accessibility-first design.',
        technologies: ['React', 'TypeScript', 'Storybook', 'Tailwind CSS', 'Radix UI'],
        bulletPoints: ['Architected 30+ accessible UI components', 'Wrote comprehensive Storybook documentation'],
        impact: 'Adopted by 3 product teams',
      },
    ],
    skills: ['JavaScript', 'TypeScript', 'React', 'Tailwind CSS', 'Node.js', 'Git', 'Jest', 'HTML', 'CSS', 'Webpack', 'D3.js', 'Figma'],
    educations: [{ school: 'Georgia Tech', degree: 'B.S.', field: 'Computer Science' }],
    certificates: [],
    achievements: ['Open source contributor to React Testing Library'],
  },

  // ── 5 YoE ──────────────────────────────────────────────────────────────
  {
    name: '5 YoE',
    targetRole: 'Senior Full-Stack Engineer',
    companyName: 'Spotify',
    experienceYears: 5,
    summaryContext: 'Full-stack engineer with 5 years building scalable systems. Deep experience in React, Node.js, and cloud infrastructure. Led teams of 3-4 engineers.',
    experiences: [
      {
        companyName: 'CloudScale Inc',
        role: 'Senior Software Engineer',
        description: 'Led backend microservices team for the core platform.',
        bulletPoints: ['Architected event-driven microservices handling 10M+ daily requests', 'Reduced infrastructure costs by 35% through AWS optimization', 'Mentored 3 junior engineers through structured onboarding'],
        technologies: ['TypeScript', 'Node.js', 'AWS', 'PostgreSQL', 'Docker', 'Kubernetes'],
      },
      {
        companyName: 'DataViz Corp',
        role: 'Full-Stack Developer',
        description: 'Built data-intensive web applications for enterprise clients.',
        bulletPoints: ['Designed GraphQL API serving 50+ frontend queries', 'Built real-time data pipeline processing 100k events/min', 'Improved test coverage from 45% to 92%'],
        technologies: ['React', 'GraphQL', 'Python', 'MongoDB', 'Redis'],
      },
      {
        companyName: 'StartUply',
        role: 'Software Engineer',
        description: 'Early engineer building the MVP from scratch.',
        bulletPoints: ['Built full-stack MVP in 3 months using React and Node.js', 'Implemented Stripe payment integration processing $500k+ monthly'],
        technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      },
    ],
    projects: [
      {
        name: 'Open Source API Gateway',
        description: 'Lightweight API gateway for microservices.',
        technologies: ['Go', 'Docker', 'PostgreSQL', 'Redis', 'gRPC'],
        bulletPoints: ['Engineered a high-throughput API gateway in Go', 'Implemented rate limiting and request routing'],
        impact: '1.2k GitHub stars, used by 5 companies',
      },
      {
        name: 'Kubernetes Dashboard',
        description: 'Internal tool for visualizing cluster health.',
        technologies: ['React', 'TypeScript', 'Kubernetes', 'WebSocket'],
        bulletPoints: ['Built real-time cluster monitoring dashboard', 'Reduced incident response time by 60%'],
        impact: 'Adopted company-wide across 8 teams',
      },
    ],
    skills: ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'gRPC', 'Terraform', 'Git'],
    educations: [{ school: 'Carnegie Mellon University', degree: 'B.S.', field: 'Computer Science' }],
    certificates: [{ name: 'AWS Solutions Architect', issuer: 'Amazon Web Services' }, { name: 'CKAD', issuer: 'CNCF' }],
    achievements: ['Speaker at ReactConf 2023', 'Tech lead for 3-person team'],
  },

  // ── 10 YoE ─────────────────────────────────────────────────────────────
  {
    name: '10 YoE',
    targetRole: 'Engineering Manager',
    companyName: 'Netflix',
    experienceYears: 10,
    summaryContext: 'Engineering leader with 10 years of experience building and scaling distributed systems. Managed teams of 5-8 engineers. Deep expertise in cloud architecture, platform engineering, and team building.',
    experiences: [
      {
        companyName: 'StreamPlatform',
        role: 'Engineering Manager',
        description: 'Managed platform engineering team of 8 engineers.',
        bulletPoints: ['Led 8-engineer team building streaming infrastructure serving 5M+ users', 'Reduced platform incident rate by 80% through SRE practices', 'Designed hiring process that increased team diversity by 40%'],
        technologies: ['AWS', 'Kubernetes', 'Terraform', 'Prometheus', 'Grafana'],
      },
      {
        companyName: 'BigData Corp',
        role: 'Staff Engineer',
        description: 'Architected data processing platform for enterprise customers.',
        bulletPoints: ['Architected distributed data processing pipeline handling 1TB+ daily', 'Migrated monolith to microservices reducing deploy time by 90%', 'Defined technical roadmap adopted by 4 engineering teams'],
        technologies: ['Java', 'Python', 'Apache Spark', 'Kafka', 'Cassandra'],
      },
      {
        companyName: 'CloudNine',
        role: 'Senior Backend Engineer',
        description: 'Built core backend services for SaaS platform.',
        bulletPoints: ['Designed GraphQL federation layer serving 200+ microservices', 'Optimized database queries reducing p99 latency by 65%', 'Established coding standards and review process for 20-person team'],
        technologies: ['TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL', 'Redis'],
      },
      {
        companyName: 'EarlyStage',
        role: 'Software Engineer',
        description: 'Early employee building the core product.',
        bulletPoints: ['Built the first version of the product used by 10k+ customers', 'Designed CI/CD pipeline reducing release cycle from 2 weeks to daily'],
        technologies: ['Ruby on Rails', 'React', 'PostgreSQL', 'AWS'],
      },
    ],
    projects: [
      {
        name: 'Service Mesh Toolkit',
        description: 'Internal framework simplifying service mesh configuration.',
        technologies: ['Go', 'Kubernetes', 'Istio', 'Prometheus'],
        bulletPoints: ['Engineered internal service mesh toolkit adopted by 12 teams', 'Reduced service mesh onboarding time from 2 weeks to 2 days'],
        impact: 'Standardized across the organization',
      },
      {
        name: 'Incident Response Bot',
        description: 'Automated incident response system integrated with PagerDuty.',
        technologies: ['Python', 'Kubernetes', 'PagerDuty API', 'Slack API'],
        bulletPoints: ['Automated incident response reducing MTTR by 45%', 'Integrated with PagerDuty and Slack for alert routing'],
        impact: 'Handles 200+ incidents monthly',
      },
    ],
    skills: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'Ruby', 'React', 'Node.js', 'Kubernetes', 'AWS', 'GCP', 'Terraform', 'PostgreSQL', 'Redis', 'Kafka', 'GraphQL', 'Docker', 'Prometheus', 'Istio', 'Leadership', 'System Design'],
    educations: [
      { school: 'MIT', degree: 'M.S.', field: 'Computer Science' },
      { school: 'UC Berkeley', degree: 'B.S.', field: 'Computer Science' },
    ],
    certificates: [
      { name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services' },
      { name: 'Google Professional Cloud Architect', issuer: 'Google Cloud' },
    ],
    achievements: ['Built and scaled team from 3 to 8 engineers', 'Patent: Distributed streaming optimization (US2024XXX)'],
  },
];

// ─── Validation Functions ────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function findWeakPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return WEAK_PHRASES.filter((p) => lower.includes(p));
}

function findActionVerbs(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  return words.filter((w) => ACTION_VERBS.includes(w)).length;
}

function findRepeatedPhrases(sections: string[]): string[] {
  const seen = new Map<string, number>();
  const repeated: string[] = [];
  for (const text of sections) {
    // Check 5+ word sequences
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i <= words.length - 5; i++) {
      const phrase = words.slice(i, i + 5).join(' ');
      const count = (seen.get(phrase) || 0) + 1;
      seen.set(phrase, count);
      if (count === 2) repeated.push(phrase);
    }
  }
  return Array.from(new Set(repeated));
}

function getTechNames(persona: QAPersona): Set<string> {
  const techs = new Set(persona.skills.map((s) => s.toLowerCase()));
  for (const exp of persona.experiences) {
    exp.technologies.forEach((t) => techs.add(t.toLowerCase()));
  }
  for (const proj of persona.projects) {
    proj.technologies.forEach((t) => techs.add(t.toLowerCase()));
  }
  return techs;
}

// Normalize tech aliases so "Node" matches "Node.js", "Tailwind" matches "Tailwind CSS", etc.
const TECH_ALIASES: Record<string, string[]> = {
  'node.js': ['node'],
  'tailwind css': ['tailwind'],
  'd3.js': ['d3'],
  'next.js': ['nextjs', 'next'],
  'postgresql': ['postgres'],
  'ci/cd': ['cicd'],
  'react.js': ['reactjs'],
  'aws': ['amazon web services'],
  'gcp': ['google cloud'],
  'azure': ['microsoft azure'],
};

function normalizeTechAliases(knownTechs: Set<string>): Set<string> {
  const normalized = new Set<string>();
  for (const tech of knownTechs) {
    normalized.add(tech);
    const aliases = TECH_ALIASES[tech];
    if (aliases) aliases.forEach((a) => normalized.add(a));
  }
  return normalized;
}

function findHallucinatedTechs(text: string, knownTechs: Set<string>): string[] {
  const normalizedKnown = normalizeTechAliases(knownTechs);
  const techs = ['React', 'Angular', 'Vue', 'Node.js', 'TypeScript', 'JavaScript', 'Python',
    'Java', 'Go', 'Rust', 'Kotlin', 'Swift', 'Ruby', 'C++', 'C#', 'PostgreSQL', 'Postgres',
    'MongoDB', 'Redis', 'MySQL', 'Cassandra', 'DynamoDB', 'AWS', 'GCP', 'Azure', 'Docker',
    'Kubernetes', 'Terraform', 'GraphQL', 'REST', 'gRPC', 'Kafka', 'Spark', 'TensorFlow',
    'PyTorch', 'Next.js', 'Tailwind CSS', 'Sass', 'CSS', 'HTML', 'Jest', 'Cypress',
    'Storybook', 'Webpack', 'Vite', 'Git', 'Linux', 'Nginx', 'Stripe', 'Figma', 'D3.js',
    'WebSocket', 'Vercel', 'Prometheus', 'Grafana', 'Istio', 'ELK', 'Elasticsearch',
    'RabbitMQ', 'SQS', 'S3', 'Lambda', 'CloudFront', 'Route53', 'ECS', 'EKS',
    'CircleCI', 'Jenkins', 'GitHub Actions', 'CI/CD', 'Microservices', 'Serverless',
    'Redux', 'Zustand', 'MobX', 'RxJS', 'Bootstrap', 'Material UI', 'Radix UI',
    'OAuth', 'JWT'];
  const hallucinated: string[] = [];
  for (const tech of techs) {
    const regex = new RegExp(`\\b${tech.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text) && !normalizedKnown.has(tech.toLowerCase())) {
      hallucinated.push(tech);
    }
  }
  return Array.from(new Set(hallucinated));
}

/** Call LLM with JSON parsing and automatic retry on parse failure. */
async function callLLMWithJSON(
  system: string,
  userMsg: string,
  label: string,
  client: ReturnType<typeof getLLMClient>,
  tries = 2,
): Promise<any> {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await client.call([
        { role: 'system', content: attempt > 0 ? system + '\n\nCRITICAL: Respond with ONLY valid JSON. Start with { and end with }. No other text.' : system },
        { role: 'user', content: userMsg },
      ], { json: true, temperature: 0.1 });

      return parseJSON<any>(res.content);
    } catch (err) {
      if (attempt < tries - 1) {
        console.log(`  ⚠ ${label} — parse failed, retrying (${attempt + 1}/${tries})`);
      } else {
        throw err;
      }
    }
  }
  throw new Error(`Exhausted retries for ${label}`);
}

function detectUnprofessionalTone(text: string): string[] {
  const unprofessional = [
    /\bsuper\s+good\b/i, /\bsuper\s+cool\b/i, /\bawesome\b/i,
    /\bkinda\b/i, /\bgonna\b/i, /\bwanna\b/i, /\byou know\b/i,
    /\blike\b.*\breally\b/i, /\bhaha\b/i, /\blol\b/i,
    /\bsort of\b/i, /\bkind of\b/i,
  ];
  return unprofessional.filter((p) => p.test(text)).map((p) => p.source);
}

function countBullets(persona: QAPersona, resume: GeneratedResume): number {
  return resume.experiences.reduce((s, e) => s + e.bulletPoints.length, 0)
       + resume.projects.reduce((s, p) => s + p.bulletPoints.length, 0);
}

// ─── QA Runner ───────────────────────────────────────────────────────────────

async function runPromptQA(): Promise<void> {
  console.log('🧪 Prompt QA — Resume Generation Validation\n');
  console.log('='.repeat(70));

  // Initialize
  const provider = (process.env.LLM_PROVIDER || 'openrouter').toLowerCase().trim();
  const hasApiKey =
    provider === 'openrouter'
      ? Boolean(process.env.OPENROUTER_API_KEY)
      : Boolean(process.env.GEMINI_API_KEY);

  if (!hasApiKey) {
    console.log(`❌ No API key configured for provider "${provider}". Set OPENROUTER_API_KEY or GEMINI_API_KEY.\n`);
    process.exit(1);
  }

  console.log(`Provider: ${provider} | Model: ${process.env.LLM_MODEL || 'default'}\n`);

  initializeAIModule();
  const health = await checkAIModuleHealth();
  if (!health.healthy) {
    console.log('❌ AI module health check failed');
    process.exit(1);
  }

  const client = getLLMClient();
  const results: QAResult[] = [];
  const CHECK_EMOJI = { pass: '✓', fail: '✗' };

  for (let pi = 0; pi < PERSONAS.length; pi++) {
    const persona = PERSONAS[pi];
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`[${pi + 1}/${PERSONAS.length}] ${persona.name} → ${persona.targetRole} @ ${persona.companyName}`);
    console.log(`${'─'.repeat(70)}`);

    const rawOutputs: Record<string, string> = {};
    const result: QAResult = {
      persona: persona.name,
      summary: { pass: true, wordCount: 0, errors: [] },
      experienceBullets: { pass: true, avgWords: 0, errors: [] },
      projectBullets: { pass: true, avgWords: 0, maxTechs: 0, errors: [] },
      resume: { pass: true, totalWordCount: 0, weakPhrases: [], repeatedContent: [], hallucinatedTechs: [], noWeakVerbs: true, professionalTone: true, errors: [] },
      overallPass: true,
      rawOutputs: {},
    };

    try {
      // ── Step 1: Summary ──────────────────────────────────────────────
      const summaryUserContent = `Target Role: ${persona.targetRole}\nCompany: ${persona.companyName}\nYears of Experience: ${persona.experienceYears}\nTop Skills: ${persona.skills.join(', ')}\nRecent Roles: ${persona.experiences.map((e) => e.role).join(', ')}\nContext: ${persona.summaryContext}`;

      const summaryParsed = await callLLMWithJSON(
        summaryPrompt,
        summaryUserContent,
        `${persona.name} summary`,
        client,
      );
      const summaryText = typeof summaryParsed === 'string' ? summaryParsed : (summaryParsed?.summary || String(summaryParsed));
      rawOutputs.summary = JSON.stringify(summaryParsed);
      result.summary.wordCount = wordCount(summaryText);

      if (result.summary.wordCount < 30 || result.summary.wordCount > 45) {
        result.summary.pass = false;
        result.summary.errors.push(`Summary is ${result.summary.wordCount} words (target: 30–45)`);
      }

      const weakInSummary = findWeakPhrases(summaryText);
      if (weakInSummary.length > 0) {
        result.summary.pass = false;
        result.summary.errors.push(`Weak phrases in summary: ${weakInSummary.join(', ')}`);
      }

      console.log(`  Summary    ${result.summary.pass ? CHECK_EMOJI.pass : CHECK_EMOJI.fail} ${result.summary.wordCount} words${result.summary.errors.length ? ' — ' + result.summary.errors.join('; ') : ''}`);

      // ── Step 2: Experience Bullets ────────────────────────────────────
      // Build experiences in the format the prompt expects
      const expData = persona.experiences.map((e) => ({
        companyName: e.companyName,
        role: e.role,
        description: e.description,
        bulletPoints: e.bulletPoints,
      }));

      const expUserContent = `Rewrite these experience descriptions into high-impact bullet points:\n${JSON.stringify(expData, null, 2)}`;

      const expParsed = await callLLMWithJSON(
        experienceBulletsPrompt,
        expUserContent,
        `${persona.name} experience bullets`,
        client,
      );
      const expBullets: string[] = expParsed?.experiences ? Object.values(expParsed.experiences).flat() as string[] : [];
      rawOutputs.experienceBullets = JSON.stringify(expParsed);

      if (expBullets.length === 0) {
        result.experienceBullets.pass = false;
        result.experienceBullets.errors.push('No experience bullets parsed');
      } else {
        const wordCounts = expBullets.map(wordCount);
        result.experienceBullets.avgWords = Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length);

        const tooLong = wordCounts.filter((w) => w > 20);
        const tooShort = wordCounts.filter((w) => w < 10);
        if (tooLong.length > 0 || tooShort.length > 0) {
          result.experienceBullets.pass = false;
          if (tooLong.length > 0) result.experienceBullets.errors.push(`${tooLong.length} bullets > 20 words`);
          if (tooShort.length > 0) result.experienceBullets.errors.push(`${tooShort.length} bullets < 10 words`);
        }

        const weakInExp = findWeakPhrases(expBullets.join(' '));
        if (weakInExp.length > 0) {
          result.experienceBullets.pass = false;
          result.experienceBullets.errors.push(`Weak phrases: ${weakInExp.join(', ')}`);
        }
      }

      console.log(`  Experience ${result.experienceBullets.pass ? CHECK_EMOJI.pass : CHECK_EMOJI.fail} avg ${result.experienceBullets.avgWords} words/bullet${result.experienceBullets.errors.length ? ' — ' + result.experienceBullets.errors.join('; ') : ''}`);

      // ── Step 3: Project Bullets ───────────────────────────────────────
      const projData = persona.projects.map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        bulletPoints: p.bulletPoints,
        impact: p.impact,
      }));

      const projUserContent = `Rewrite these project descriptions into high-impact bullet points:\n${JSON.stringify(projData, null, 2)}`;

      const projParsed = await callLLMWithJSON(
        projectBulletsPrompt,
        projUserContent,
        `${persona.name} project bullets`,
        client,
      );
      const projBullets: string[] = projParsed?.projects
        ? Object.values(projParsed.projects).flat() as string[]
        : [];
      rawOutputs.projectBullets = JSON.stringify(projParsed);
      const projMap = projParsed?.projects || {};

      if (projBullets.length === 0) {
        result.projectBullets.pass = false;
        result.projectBullets.errors.push('No project bullets parsed');
      } else {
        const wordCounts = projBullets.map(wordCount);
        result.projectBullets.avgWords = Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length);

        const tooLong = wordCounts.filter((w) => w > 20);
        if (tooLong.length > 0) {
          result.projectBullets.pass = false;
          result.projectBullets.errors.push(`${tooLong.length} bullets > 20 words`);
        }

        // Check tech stack count per project
        for (const proj of persona.projects) {
          if (proj.technologies.length > 5) {
            result.projectBullets.pass = false;
            result.projectBullets.errors.push(`"${proj.name}" has ${proj.technologies.length} techs (max 5)`);
          }
        }
        result.projectBullets.maxTechs = Math.max(...persona.projects.map((p) => p.technologies.length));

        const weakInProj = findWeakPhrases(projBullets.join(' '));
        if (weakInProj.length > 0) {
          result.projectBullets.pass = false;
          result.projectBullets.errors.push(`Weak phrases: ${weakInProj.join(', ')}`);
        }
      }

      console.log(`  Projects   ${result.projectBullets.pass ? CHECK_EMOJI.pass : CHECK_EMOJI.fail} avg ${result.projectBullets.avgWords} words/bullet, max ${result.projectBullets.maxTechs} techs${result.projectBullets.errors.length ? ' — ' + result.projectBullets.errors.join('; ') : ''}`);

      // ── Step 4: Resume JSON (Compile) ─────────────────────────────────
      // Build the input the resume-json prompt expects
      const resumeInput = {
        summary: summaryText,
        experiences: persona.experiences.map((e, i) => ({
          companyName: e.companyName,
          role: e.role,
          location: 'Remote',
          startDate: '2020-01',
          endDate: i === 0 ? undefined : '2023-01',
          isCurrent: i === 0,
          description: e.description,
          bulletPoints: expBullets.filter(() => true) as string[],
        })),
        projects: persona.projects.map((p) => ({
          name: p.name,
          description: p.description,
          role: p.role || 'Contributor',
          technologies: p.technologies,
          bulletPoints: projBullets.filter(() => true) as string[],
          impact: p.impact,
        })),
        skills: persona.skills.map((s) => ({ name: s, category: 'General', level: 3 })),
        education: persona.educations.map((e) => ({
          school: e.school,
          degree: e.degree,
          field: e.field || undefined,
          startDate: '2017-09',
          endDate: '2021-05',
        })),
        certificates: persona.certificates.map((c) => ({ name: c.name, issuer: c.issuer })),
        achievements: persona.achievements,
      };

      const resumeUserContent = `Compile this resume data into final JSON:\n${JSON.stringify(resumeInput, null, 2)}`;

      const resumeParsed = await callLLMWithJSON(
        resumeJsonPrompt,
        resumeUserContent,
        `${persona.name} resume JSON`,
        client,
      );
      rawOutputs.resumeJson = JSON.stringify(resumeParsed);

      if (!resumeParsed || !resumeParsed.summary) {
        result.resume.pass = false;
        result.resume.errors.push('Failed to parse final resume JSON');
      } else {
        // Full resume text
        const rp = resumeParsed as any;
        const allBullets: string[] = [
          ...(rp.experiences || []).flatMap((e: any) => e.bulletPoints || []),
          ...(rp.projects || []).flatMap((p: any) => p.bulletPoints || []),
        ];
        const allText = [rp.summary, ...allBullets].join(' ');
        const rwc = wordCount(allText);
        result.resume.totalWordCount = rwc;

        // Weak phrases in entire resume
        result.resume.weakPhrases = findWeakPhrases(allText);

        // Repeated content across sections
        const allSections = [
          rp.summary,
          ...allBullets,
        ];
        result.resume.repeatedContent = findRepeatedPhrases(allSections);

        // Hallucinated technologies
        const knownTechs = getTechNames(persona);
        result.resume.hallucinatedTechs = findHallucinatedTechs(allText, knownTechs);

        // Action verb check
        const verbCount = findActionVerbs(allText);
        result.resume.noWeakVerbs = verbCount >= allBullets.length * 0.5;

        // Professional tone
        result.resume.professionalTone = detectUnprofessionalTone(allText).length === 0;

        // Assemble errors
        if (rwc > 900 && persona.experienceYears <= 7) {
          result.resume.errors.push(`Word count ${rwc} exceeds 1-page budget for ${persona.experienceYears} YoE`);
        }
        if (result.resume.weakPhrases.length > 0) {
          result.resume.errors.push(`Weak phrases: ${result.resume.weakPhrases.join(', ')}`);
        }
        if (result.resume.hallucinatedTechs.length > 0) {
          result.resume.errors.push(`Hallucinated techs: ${result.resume.hallucinatedTechs.slice(0, 5).join(', ')}`);
        }
        if (!result.resume.noWeakVerbs) {
          result.resume.errors.push('Insufficient action verbs across bullets');
        }
        if (!result.resume.professionalTone) {
          result.resume.errors.push('Unprofessional tone detected');
        }

        if (result.resume.errors.length > 0) {
          result.resume.pass = false;
        }
      }

      const resumeStatus = result.resume.pass ? CHECK_EMOJI.pass : CHECK_EMOJI.fail;
      console.log(`  Resume     ${resumeStatus} ${result.resume.totalWordCount} words${result.resume.errors.length ? ' — ' + result.resume.errors.join('; ') : ''}`);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.summary.pass = false;
      result.summary.errors.push(`LLM error: ${msg}`);
      result.resume.errors.push(`LLM error: ${msg}`);
      result.overallPass = false;
      console.log(`  ❌ LLM Error: ${msg}`);
    }

    // Overall
    result.overallPass = result.summary.pass && result.experienceBullets.pass
      && result.projectBullets.pass && result.resume.pass;
    result.rawOutputs = rawOutputs;
    results.push(result);
  }

  // ─── Final Report ──────────────────────────────────────────────────────────
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 PROMPT QA — FINAL REPORT');
  console.log('='.repeat(70));

  const allPass = results.every((r) => r.overallPass);
  const passed = results.filter((r) => r.overallPass).length;
  const failed = results.filter((r) => !r.overallPass).length;

  console.log(`\n  ${passed} passed, ${failed} failed out of ${results.length} personas\n`);

  for (const r of results) {
    const status = r.overallPass ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status} | ${r.persona}`);
    if (!r.summary.pass) console.log(`         Summary: ${r.summary.errors.join('; ')}`);
    if (!r.experienceBullets.pass) console.log(`         Experience: ${r.experienceBullets.errors.join('; ')}`);
    if (!r.projectBullets.pass) console.log(`         Projects: ${r.projectBullets.errors.join('; ')}`);
    if (!r.resume.pass) console.log(`         Resume: ${r.resume.errors.join('; ')}`);
  }

  console.log('\n' + '='.repeat(70));

  if (allPass) {
    console.log('\n✅ ALL PERSONAS PASSED PROMPT QA\n');
  } else {
    console.log(`\n❌ ${failed} persona(s) failed. Review and refine prompts, then re-run.\n`);
  }

  process.exit(allPass ? 0 : 1);
}

runPromptQA();
