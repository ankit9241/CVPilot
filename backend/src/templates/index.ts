import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { mapResumeToVariables as mapModern } from './modern/mapping';
import { mapResumeToVariables as mapClassic } from './classic/mapping';
import { mapResumeToVariables as mapJake } from './jake/mapping';
import { mapResumeToVariables as mapProfessional } from './professional/mapping';
import { mapResumeToVariables as mapCompact } from './compact/mapping';

export const templateMappers: Record<string, (resume: any, profile: any) => any> = {
  'tpl-modern': mapModern,
  'tpl-classic': mapClassic,
  'tpl-jake': mapJake,
  'tpl-professional': mapProfessional,
  'tpl-compact': mapCompact,
};

/**
 * Escape LaTeX special characters in text values
 */
export function escapeLatex(text: string | undefined | null): string {
  if (!text) return '';
  let str = String(text);

  // Normalize existing escapes to avoid double-escaping
  str = str
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}')
    .replace(/\\~/g, '~')
    .replace(/\\\^/g, '^');

  // Escape backslashes first via placeholder
  str = str.replace(/\\/g, '\u0000');

  // Escape special LaTeX characters
  str = str
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');

  // Replace placeholder with backslash command
  str = str.replace(/\u0000/g, '\\textbackslash{}');

  return str;
}

/**
 * Lightweight template-independent Mustache-like renderer
 */
export function renderTemplate(templateStr: string, data: any): string {
  let result = templateStr;

  // 1. Process lists/loops ({{#list}} ... {{/list}})
  const sectionRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(sectionRegex, (match, key, content) => {
    const items = data[key];
    if (Array.isArray(items)) {
      return items
        .map((item) => {
          // Render sub-template using item context
          const subData = { ...data };
          if (typeof item === 'object' && item !== null) {
            Object.assign(subData, item);
          } else {
            subData['.'] = item; // support dot syntax for primitives
          }
          return renderTemplate(content, subData);
        })
        .join('');
    }
    // Conditional rendering if key is truthy (but not an array)
    if (items) {
      return renderTemplate(content, data);
    }
    return '';
  });

  // 2. Process raw variables ({{{variable}}})
  const rawRegex = /\{\{\{([\w.]+)\}\}\}/g;
  result = result.replace(rawRegex, (match, pathStr) => {
    const val = getObjectPath(data, pathStr);
    return val !== undefined && val !== null ? String(val) : '';
  });

  // 3. Process standard escaped variables ({{variable}})
  const escapedRegex = /\{\{([\w.]+)\}\}/g;
  result = result.replace(escapedRegex, (match, pathStr) => {
    const val = getObjectPath(data, pathStr);
    return val !== undefined && val !== null ? escapeLatex(String(val)) : '';
  });

  return result;
}

function getObjectPath(obj: any, pathStr: string): any {
  if (pathStr === '.') return obj['.'];
  return pathStr.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// ─── Skill name canonicalization ─────────────────────────────────────────────
const CANONICAL_SKILL_NAMES: Record<string, string> = {
  'node.js': 'Node.js', 'nodejs': 'Node.js',
  'next.js': 'Next.js', 'nextjs': 'Next.js',
  'react.js': 'React', 'reactjs': 'React',
  'vue.js': 'Vue.js', 'vuejs': 'Vue.js',
  'angular.js': 'Angular', 'angularjs': 'Angular',
  'typescript': 'TypeScript', 'javascript': 'JavaScript',
  'tailwind': 'Tailwind CSS', 'tailwindcss': 'Tailwind CSS',
  'shadcn': 'shadcn/ui', 'shadcn-ui': 'shadcn/ui',
  'framer motion': 'Framer Motion', 'framermotion': 'Framer Motion',
  'framer-motion': 'Framer Motion',
  'radix': 'Radix UI', 'radix-ui': 'Radix UI',
  'vite': 'Vite',
  'lottie': 'Lottie',
  'postgresql': 'PostgreSQL', 'postgres': 'PostgreSQL',
  'mongodb': 'MongoDB',
  'graphql': 'GraphQL',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes', 'k8s': 'Kubernetes',
  'aws': 'AWS', 'amazon web services': 'AWS',
  'gcp': 'GCP', 'google cloud': 'GCP',
  'azure': 'Azure',
  'github': 'GitHub', 'gitlab': 'GitLab',
  'ci/cd': 'CI/CD',
  'fastapi': 'FastAPI',
  'nestjs': 'NestJS', 'nest.js': 'NestJS',
  'expressjs': 'Express.js', 'express': 'Express.js',
  'prisma': 'Prisma',
  'redis': 'Redis',
  'mysql': 'MySQL',
  'sqlite': 'SQLite',
  'firebase': 'Firebase',
  'supabase': 'Supabase',
  'vercel': 'Vercel',
  'netlify': 'Netlify',
  'jest': 'Jest',
  'vitest': 'Vitest',
  'playwright': 'Playwright',
  'webpack': 'Webpack',
  'html': 'HTML', 'css': 'CSS',
  'sass': 'Sass', 'scss': 'SCSS',
  'python': 'Python', 'java': 'Java', 'rust': 'Rust', 'go': 'Go',
  'c++': 'C++', 'c#': 'C#', 'php': 'PHP', 'ruby': 'Ruby',
  'flutter': 'Flutter', 'dart': 'Dart',
  'react native': 'React Native',
  'tensorflow': 'TensorFlow', 'pytorch': 'PyTorch',
  'openai': 'OpenAI',
};

function canonicalizeSkillName(name: string): string {
  const key = name.toLowerCase().trim();
  return CANONICAL_SKILL_NAMES[key] ?? name;
}

// ─── Page-fit estimation ──────────────────────────────────────────────────────
// Letterpaper at 11pt, 0.5in margins → ~7.5in text width.
// At 11pt with typical leading ≈ 13pt, usable page height ≈ 9in - 1in margins.
// Lines per page ≈ (8 * 72) / 13 ≈ 44. Use 46 to be slightly generous.
const BASE_LINES_PER_PAGE = 46; // at 11pt, 0.5in margins
const BASE_CHARS_PER_LINE = 90;

interface LineBreakdown {
  total: number;
  header: number;
  summary: number;
  experiences: number;
  projects: number;
  skills: number;
  education: number;
  certifications: number;
  achievements: number;
}

interface FitEstimate {
  lines: LineBreakdown;
  totalLines: number;
  linesPerPage: number;
  overflowRatio: number;
}

/**
 * Estimate content height per section in lines.
 * Accounting for font size and margin adjustments via scale factor.
 */
function estimateLayout(
  resumeJson: any,
  fontPt: number,
  marginReduction: number, // inches shaved off each margin pair (total)
): FitEstimate {
  // Scale chars-per-line inversely with font size and margin expansion
  // Smaller font → more chars per line → fewer wrapped lines
  // Wider margins → fewer chars per line → more wrapped lines
  const fontScale = 11 / fontPt;
  const marginInches = 0.5 - marginReduction; // per side
  const textWidthInches = 8.5 - 2 * marginInches;
  const textHeightInches = 11 - 2 * marginInches;
  const cpl = Math.round(BASE_CHARS_PER_LINE * fontScale * (textWidthInches / 7.5));

  // Lines per page scales with available height and font leading
  const leadingScale = fontPt / 11; // smaller font = shorter leading = more lines
  const lpp = Math.round(BASE_LINES_PER_PAGE * leadingScale * (textHeightInches / 10));

  const b: LineBreakdown = {
    header: 0,
    summary: 0,
    experiences: 0,
    projects: 0,
    skills: 0,
    education: 0,
    certifications: 0,
    achievements: 0,
    total: 0,
  };

  // Header: name + contact line
  b.header = 3;

  // Summary
  const summary = resumeJson.summary || '';
  if (summary) {
    b.summary += 1.5;
    b.summary += Math.max(1, Math.ceil(summary.length / cpl));
  }

  // Experiences
  const experiences = resumeJson.experiences || [];
  if (experiences.length > 0) {
    b.experiences += 1.5; // section heading
    for (const exp of experiences) {
      b.experiences += 2; // subheading (company+role, dates+location)
      for (const bPt of (exp.bulletPoints || [])) {
        b.experiences += Math.max(1, Math.ceil((bPt as string).length / cpl));
      }
      b.experiences += 0.5; // trailing itemsep
    }
  }

  // Projects
  const projects = resumeJson.projects || [];
  if (projects.length > 0) {
    b.projects += 1.5;
    for (const proj of projects) {
      b.projects += 2; // project heading (name+techs, dates)
      for (const bPt of (proj.bulletPoints || [])) {
        b.projects += Math.max(1, Math.ceil((bPt as string).length / cpl));
      }
      b.projects += 0.5;
    }
  }

  // Skills (each category = 1 line)
  const skills = resumeJson.skills || [];
  if (skills.length > 0) { b.skills += 1.5; b.skills += skills.length; }

  // Education
  const education = resumeJson.education || [];
  if (education.length > 0) { b.education += 1.5; b.education += education.length * 2; }

  // Certifications
  const certs = resumeJson.certificates || [];
  if (certs.length > 0) { b.certifications += 1.5; b.certifications += certs.length; }

  // Achievements
  const achievements = resumeJson.achievements || [];
  if (achievements.length > 0) { b.achievements += 1.5; b.achievements += achievements.length; }

  b.total = b.header + b.summary + b.experiences + b.projects + b.skills + b.education + b.certifications + b.achievements;

  const overflowRatio = +(b.total / lpp).toFixed(2);

  return {
    lines: b,
    totalLines: Math.round(b.total * 10) / 10,
    linesPerPage: lpp,
    overflowRatio,
  };
}

export interface FitResult {
  resumeJson: any;
  layoutOverrides: string;
  report: {
    initialLines: LineBreakdown;
    initialTotal: number;
    initialOverflowRatio: number;
    actionsApplied: {
      summary: boolean;
      experienceBullets: boolean;
      projectBullets: boolean;
      projectTechStack: boolean;
      spacing: boolean;
      margins: boolean;
      font: boolean;
      enlargthispage: boolean;
    };
    finalFontPt: number;
    finalSubheadingItemSep: number;
    finalBulletItemSep: number;
    finalMarginReduction: number;
    finalLinesPerPage: number;
    finalEstimate: LineBreakdown;
    finalTotal: number;
    finalOverflowRatio: number;
    fitsOnePage: boolean;
    debug: string[];
  };
}

/**
 * Dynamic Fit Engine V1 — Intelligent Resume Layout.
 *
 * Estimates content height before rendering, then applies 7 adaptive
 * compression passes in priority order, re-estimating after each pass:
 *
 * 1. Summary compression (45→35→30 words)
 * 2. Experience bullet compression (20→18→16 words)
 * 3. Project bullet compression (20→18→16 words)
 * 4. Project tech stack reduction (5→4)
 * 5. Vertical spacing tightening (6→4→3pt subheading, 2→1pt bullet)
 * 6. Margin reduction (0.75→0.65→0.55in per side, min 0.4in)
 * 7. Adaptive typography (11→10.75→10.5→10.25→10→9.75→9.5pt)
 *
 * As absolute last resort: \enlargethispage{-\baselineskip} to reclaim 1 line.
 * Never compresses: company names, project names, dates, contacts, education.
 */
export function fitResumeToPage(resumeJson: any, isOnePage: boolean): FitResult {
  const EMPTY_REPORT: FitResult['report'] = {
    initialLines: { total: 0, header: 0, summary: 0, experiences: 0, projects: 0, skills: 0, education: 0, certifications: 0, achievements: 0 },
    initialTotal: 0, initialOverflowRatio: 1,
    actionsApplied: { summary: false, experienceBullets: false, projectBullets: false, projectTechStack: false, spacing: false, margins: false, font: false, enlargthispage: false },
    finalFontPt: 11, finalSubheadingItemSep: 6, finalBulletItemSep: 2, finalMarginReduction: 0,
    finalLinesPerPage: BASE_LINES_PER_PAGE,
    finalEstimate: { total: 0, header: 0, summary: 0, experiences: 0, projects: 0, skills: 0, education: 0, certifications: 0, achievements: 0 },
    finalTotal: 0, finalOverflowRatio: 1, fitsOnePage: false, debug: [],
  };

  if (!isOnePage) {
    return { resumeJson, layoutOverrides: '', report: EMPTY_REPORT };
  }

  const debug: string[] = [];
  const actions: FitResult['report']['actionsApplied'] = {
    summary: false, experienceBullets: false, projectBullets: false,
    projectTechStack: false, spacing: false, margins: false, font: false,
    enlargthispage: false,
  };

  let resume = JSON.parse(JSON.stringify(resumeJson));

  // Initial state
  let fontPt = 11;
  let marginReduction = 0; // inches off per side
  let subheadingItemSep = 6;
  let bulletItemSep = 2;

  let est = estimateLayout(resume, fontPt, marginReduction);
  const initialEst = { ...est };

  debug.push(`Initial estimate: ${est.totalLines} lines, overflow=${est.overflowRatio}`);

  // Guard: already fits
  if (est.overflowRatio <= 1.0) {
    return {
      resumeJson: resume,
      layoutOverrides: '',
      report: {
        ...EMPTY_REPORT,
        initialLines: initialEst.lines,
        initialTotal: initialEst.totalLines,
        initialOverflowRatio: initialEst.overflowRatio,
        finalEstimate: est.lines,
        finalTotal: est.totalLines,
        finalOverflowRatio: est.overflowRatio,
        fitsOnePage: true,
        debug,
      },
    };
  }

  // ─── PASS 1: Compress summary ─────────────────────────────────────────────
  // Try 35 words, then 30 words if still overflowing
  for (const maxWords of [35, 30]) {
    if (est.overflowRatio <= 1.0) break;
    if (resume.summary) {
      const before = resume.summary.split(/\s+/).length;
      resume.summary = trimWords(resume.summary, maxWords);
      const after = resume.summary.split(/\s+/).length;
      if (after < before) {
        actions.summary = true;
        est = estimateLayout(resume, fontPt, marginReduction);
        debug.push(`Summary compressed ${before}→${after} words (${maxWords} cap), now ${est.totalLines} lines`);
      }
    }
  }

  // ─── PASS 2: Compress experience bullets ──────────────────────────────────
  for (const maxWords of [18, 16]) {
    if (est.overflowRatio <= 1.0) break;
    let trimmed = false;
    resume.experiences = (resume.experiences || []).map((exp: any) => {
      const trimmedBullets = (exp.bulletPoints || []).map((b: string) => trimWords(b, maxWords));
      if (trimmedBullets.some((b: string, i: number) => b !== exp.bulletPoints?.[i])) trimmed = true;
      return { ...exp, bulletPoints: trimmedBullets };
    });
    if (trimmed) {
      actions.experienceBullets = true;
      est = estimateLayout(resume, fontPt, marginReduction);
      debug.push(`Experience bullets trimmed to ${maxWords} words, now ${est.totalLines} lines`);
    }
  }

  // ─── PASS 3: Compress project bullets ─────────────────────────────────────
  for (const maxWords of [18, 16]) {
    if (est.overflowRatio <= 1.0) break;
    let trimmed = false;
    resume.projects = (resume.projects || []).map((proj: any) => {
      const trimmedBullets = (proj.bulletPoints || []).map((b: string) => trimWords(b, maxWords));
      if (trimmedBullets.some((b: string, i: number) => b !== proj.bulletPoints?.[i])) trimmed = true;
      return { ...proj, bulletPoints: trimmedBullets };
    });
    if (trimmed) {
      actions.projectBullets = true;
      est = estimateLayout(resume, fontPt, marginReduction);
      debug.push(`Project bullets trimmed to ${maxWords} words, now ${est.totalLines} lines`);
    }
  }

  // ─── PASS 4: Reduce project tech stack ────────────────────────────────────
  if (est.overflowRatio > 1.0) {
    let reduced = false;
    resume.projects = (resume.projects || []).map((proj: any) => {
      const techs = proj.technologies || [];
      if (techs.length > 4) { reduced = true; return { ...proj, technologies: techs.slice(0, 4) }; }
      return proj;
    });
    if (reduced) {
      actions.projectTechStack = true;
      est = estimateLayout(resume, fontPt, marginReduction);
      debug.push(`Project tech stack reduced to 4, now ${est.totalLines} lines`);
    }
  }

  // ─── PASS 5: Tighten vertical spacing ─────────────────────────────────────
  if (est.overflowRatio > 1.0) {
    // Stage 1: moderate tightening
    subheadingItemSep = 4;
    bulletItemSep = 1;
    actions.spacing = true;
    est = estimateLayout(resume, fontPt, marginReduction);
    debug.push(`Spacing tightened (sub=4pt, bullet=1pt), now ${est.totalLines} lines / lpp=${est.linesPerPage}`);

    // Stage 2: aggressive tightening
    if (est.overflowRatio > 1.0) {
      subheadingItemSep = 3;
      est = estimateLayout(resume, fontPt, marginReduction);
      debug.push(`Spacing tightened further (sub=3pt), now ${est.totalLines} lines`);
    }
  }

  // ─── PASS 6: Reduce margins ───────────────────────────────────────────────
  // 0.50 → 0.40in per side (reducing margins gains ~3–5 lines)
  // Never below 0.4in per side (ATS-safe)
  for (const mr of [0.05, 0.10]) {
    if (est.overflowRatio <= 1.0) break;
    marginReduction = mr;
    actions.margins = true;
    est = estimateLayout(resume, fontPt, marginReduction);
    debug.push(`Margins reduced (−${mr * 2}in total), now ${est.totalLines} lines / lpp=${est.linesPerPage}`);
  }

  // ─── PASS 7: Adaptive font size (last resort before \enlargethispage) ─────
  const FONT_STEPS = [10.75, 10.5, 10.25, 10, 9.75, 9.5];
  for (const fp of FONT_STEPS) {
    if (est.overflowRatio <= 1.0) break;
    fontPt = fp;
    actions.font = true;
    est = estimateLayout(resume, fontPt, marginReduction);
    debug.push(`Font reduced to ${fp}pt, now ${est.totalLines} lines / lpp=${est.linesPerPage}`);
  }

  // ─── PASS 8 (LAST RESORT): \enlargethispage ──────────────────────────────
  if (est.overflowRatio > 1.0 && est.overflowRatio <= 1.05) {
    // Only use if very close (within 5%). This reclaims ~1 line.
    actions.enlargthispage = true;
    est = { ...est, overflowRatio: +(est.overflowRatio * 0.97).toFixed(2) };
    debug.push(`\\enlargethispage applied (was ${est.overflowRatio}, within 5% threshold)`);
  }

  // ─── Build layoutOverrides LaTeX snippet ──────────────────────────────────
  const latexParts: string[] = [];

  // Font size override
  if (fontPt < 11) {
    const leading = Math.round(fontPt * 1.2 * 10) / 10;
    latexParts.push(`% Fit engine: font override`);
    latexParts.push(`\\fontsize{${fontPt}}{${leading}}\\selectfont`);
  }

  // Margin override using \addtolength (works inside document body, unlike \geometry
  // which is preamble-only). Δ = marginReduction in inches per side. We add 2Δ to
  // textwidth/height and subtract Δ from the margin offsets.
  if (marginReduction > 0) {
    const delta = marginReduction.toFixed(2);
    latexParts.push(`% Fit engine: margin override (+${delta}in per side)`);
    latexParts.push(
      `\\addtolength{\\textwidth}{${(+marginReduction * 2).toFixed(2)}in}`,
      `\\addtolength{\\oddsidemargin}{-${delta}in}`,
      `\\addtolength{\\evensidemargin}{-${delta}in}`,
      `\\addtolength{\\textheight}{${(+marginReduction * 2).toFixed(2)}in}`,
      `\\addtolength{\\topmargin}{-${delta}in}`,
    );
  }

  // Spacing overrides
  if (subheadingItemSep !== 6 || bulletItemSep !== 2) {
    latexParts.push(
      `\\renewcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}, nosep, itemsep=${subheadingItemSep}pt]}`,
      `\\renewcommand{\\resumeItemListStart}{\\begin{itemize}[leftmargin=0.15in, label=\\textbullet{}, nosep, itemsep=${bulletItemSep}pt, topsep=1pt]}`,
    );
  }

  // \enlargethispage (last resort)
  if (actions.enlargthispage) {
    latexParts.push(`\\enlargethispage{-\\baselineskip}`);
  }

  return {
    resumeJson: resume,
    layoutOverrides: latexParts.join('\n'),
    report: {
      initialLines: initialEst.lines,
      initialTotal: initialEst.totalLines,
      initialOverflowRatio: initialEst.overflowRatio,
      actionsApplied: actions,
      finalFontPt: fontPt,
      finalSubheadingItemSep: subheadingItemSep,
      finalBulletItemSep: bulletItemSep,
      finalMarginReduction: marginReduction,
      finalLinesPerPage: est.linesPerPage,
      finalEstimate: est.lines,
      finalTotal: est.totalLines,
      finalOverflowRatio: est.overflowRatio,
      fitsOnePage: est.overflowRatio <= 1.0,
      debug,
    },
  };
}

const TECH_RANKINGS: Record<string, number> = {
  // Languages (100)
  typescript: 100, javascript: 100, rust: 100, go: 100, python: 100, java: 100, 'c++': 100, 'c#': 100, ruby: 100, php: 100, sql: 100, html: 100, css: 100, golang: 100,
  // Frameworks (90)
  react: 90, 'next.js': 90, nextjs: 90, vue: 90, angular: 90, svelte: 90, express: 90, fastapi: 90, 'spring boot': 90, django: 90, laravel: 90, nestjs: 90, 'nest.js': 90,
  // Databases (80)
  postgresql: 80, postgres: 80, mysql: 80, mongodb: 80, redis: 80, cassandra: 80, dynamodb: 80, oracle: 80, sqlite: 80, kafka: 80, rabbitmq: 80, prisma: 80,
  // Cloud / DevOps (70)
  aws: 70, docker: 70, kubernetes: 70, gcp: 70, azure: 70, terraform: 70, vercel: 70, netlify: 70, serverless: 70, lambda: 70, s3: 70,
  // Backend / APIs (60)
  graphql: 60, rest: 60, grpc: 60, 'node.js': 60, nodejs: 60, trpc: 60,
  // Tools / Testing (50)
  git: 50, vite: 50, webpack: 50, babel: 50, postman: 50, jest: 50, playwright: 50, cypress: 50, jenkins: 50, circleci: 50,
};

function getTechRank(tech: string): number {
  const normalized = tech.toLowerCase().trim();
  return TECH_RANKINGS[normalized] ?? 10;
}

function calculateYoE(experiences: any[]): number {
  let totalMonths = 0;
  for (const exp of experiences) {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);

    if (start && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, diffMonths);
    }
  }
  return Math.round((totalMonths / 12) * 10) / 10;
}

function trimWords(text: string, maxWords: number): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  
  let truncated = words.slice(0, maxWords).join(' ');
  if (!truncated.endsWith('.')) {
    truncated += '.';
  }
  return truncated;
}

export function preprocessAndBudgetResume(resumeJson: any): any {
  if (!resumeJson) return resumeJson;

  const resume = JSON.parse(JSON.stringify(resumeJson));

  const experiences = resume.experiences || [];
  const projects = resume.projects || [];
  const skills = resume.skills || [];
  const certificates = resume.certificates || [];
  const achievements = resume.achievements || [];
  const summaryText = resume.summary || '';

  const yoe = calculateYoE(experiences);
  const isOnePage = yoe <= 7;

  // Enforce YOE-based budgets
  let maxExperiences = isOnePage ? 2 : 4;
  let maxProjects = isOnePage ? 2 : 3;
  let maxSkillsCount = isOnePage ? 15 : 24;
  let maxCertificates = isOnePage ? 1 : 2;
  let maxAchievements = isOnePage ? 2 : 3;
  
  let maxBullets = isOnePage ? 3 : 4;
  let maxBulletWords = isOnePage ? 22 : 25;
  let maxSummaryWords = isOnePage ? 45 : 65;
  let maxProjectTechs = isOnePage ? 5 : 6;

  // Part 8: Dynamic page utilization when content is sparse
  if (isOnePage) {
    const rawExpCount = experiences.length;
    const rawProjCount = projects.length;
    const rawAchCount = achievements.length;

    if (rawExpCount <= 1 && rawProjCount <= 1) {
      maxBullets = 4;
      maxAchievements = Math.max(3, rawAchCount);
      maxCertificates = 2;
      maxSkillsCount = 20;
    } else if (rawExpCount <= 1) {
      maxProjects = 3;
      maxBullets = 4;
    } else if (rawProjCount <= 1) {
      maxExperiences = 3;
      maxBullets = 4;
    }
  }

  // 1. Experiences trimming
  const trimmedExperiences = experiences.slice(0, maxExperiences).map((exp: any) => {
    let bullets = exp.bulletPoints || [];
    bullets = bullets.slice(0, maxBullets).map((b: string) => trimWords(b, maxBulletWords));
    return {
      ...exp,
      description: '', // Choose ONE: choose bullets over long description
      bulletPoints: bullets,
    };
  });

  // 2. Projects trimming & tech ranking
  const trimmedProjects = projects.slice(0, maxProjects).map((proj: any) => {
    let bullets = proj.bulletPoints || [];
    bullets = bullets.slice(0, maxBullets).map((b: string) => trimWords(b, maxBulletWords));
    
    let techs = Array.isArray(proj.technologies) ? proj.technologies : [];
    // Sort tech stack by recruiter significance rank
    techs = techs
      .sort((a: string, b: string) => getTechRank(b) - getTechRank(a))
      .slice(0, maxProjectTechs);

    return {
      ...proj,
      description: '',
      technologies: techs,
      bulletPoints: bullets,
    };
  });

  // 3. Summary trimming
  const trimmedSummary = trimWords(summaryText, maxSummaryWords);

  // 4. Skills grouping (Part 6) with canonical names
  const groupedSkills: Record<string, string[]> = {};
  for (const sk of skills.slice(0, maxSkillsCount)) {
    const cat = sk.category || 'Other';
    const canonicalName = canonicalizeSkillName(sk.name);
    if (!groupedSkills[cat]) groupedSkills[cat] = [];
    if (!groupedSkills[cat].includes(canonicalName)) {
      groupedSkills[cat].push(canonicalName);
    }
  }
  const formattedSkills = Object.entries(groupedSkills).map(([category, names]) => ({
    category,
    name: names.join(' • '),
  }));

  // 5. Certificates & Achievements trimming
  const trimmedCertificates = certificates.slice(0, maxCertificates);
  const trimmedAchievements = achievements.slice(0, maxAchievements);

  return {
    ...resume,
    summary: trimmedSummary,
    experiences: trimmedExperiences,
    projects: trimmedProjects,
    skills: formattedSkills,
    certificates: trimmedCertificates,
    achievements: trimmedAchievements,
  };
}

/**
 * TemplateEngine Service converting GeneratedResume + Profile -> LaTeX
 */
export class TemplateEngineService {
  async render(resumeJson: any, templateId: string, profile: any): Promise<string> {
    const mapper = templateMappers[templateId];
    if (!mapper) {
      throw new Error(`Template mapper for "${templateId}" not found`);
    }

    // Preprocess, budget, and sort the resume data deterministically
    const budgetedResume = preprocessAndBudgetResume(resumeJson);

    // Dynamic fit engine: estimate page fit, compress if needed, produce layout overrides
    const experiences = budgetedResume.experiences || [];
    const yoe = calculateYoE(experiences);
    const fitResult = fitResumeToPage(budgetedResume, yoe <= 7);
    const fittedResume = fitResult.resumeJson;

    console.log(`[FitEngine] Template=${templateId} YOE=${yoe}
  Estimated Page Usage: ${Math.round(fitResult.report.initialOverflowRatio * 100)}%
  Summary Lines:         ${fitResult.report.initialLines.summary}
  Experience Lines:      ${fitResult.report.initialLines.experiences}
  Project Lines:         ${fitResult.report.initialLines.projects}
  Skill Lines:           ${fitResult.report.initialLines.skills}
  Education Lines:       ${fitResult.report.initialLines.education}
  Compression Applied:
    Summary:       ${fitResult.report.actionsApplied.summary ? 'YES' : 'NO'}
    Exp Bullets:   ${fitResult.report.actionsApplied.experienceBullets ? 'YES' : 'NO'}
    Proj Bullets:  ${fitResult.report.actionsApplied.projectBullets ? 'YES' : 'NO'}
    Proj TechStack: ${fitResult.report.actionsApplied.projectTechStack ? 'YES' : 'NO'}
    Spacing:       ${fitResult.report.actionsApplied.spacing ? 'YES' : 'NO'}
    Margins:       ${fitResult.report.actionsApplied.margins ? 'YES' : 'NO'}
    Font:          ${fitResult.report.actionsApplied.font ? 'YES' : 'NO'}
    EnlargePage:   ${fitResult.report.actionsApplied.enlargthispage ? 'YES' : 'NO'}
  Final Font:            ${fitResult.report.finalFontPt}pt
  Final Margins:         ${+(0.5 - fitResult.report.finalMarginReduction).toFixed(2)}in
  Final Spacing:         sub=${fitResult.report.finalSubheadingItemSep}pt, bullet=${fitResult.report.finalBulletItemSep}pt
  Final Lines:           ${fitResult.report.finalTotal} / ${fitResult.report.finalLinesPerPage} lpp
  Final Overflow:        ${fitResult.report.finalOverflowRatio}
  Final Page Count:      ${fitResult.report.fitsOnePage ? '1' : '2+'}
  Debug:                 ${fitResult.report.debug.join(' → ')}`);

    // 1. Convert GeneratedResume into template variables
    const variables = mapper(fittedResume, profile);

    // Inject layoutOverrides into template variables for the {{{layoutOverrides}}} placeholder
    variables.layoutOverrides = fitResult.layoutOverrides;

    // 2. Load and render shared components, inject into variables
    const components = ['header', 'education', 'experience', 'project', 'skills', 'footer'];
    for (const comp of components) {
      let compPath = path.join(__dirname, 'components', `${comp}.tex`);
      if (!fs.existsSync(compPath)) {
        compPath = path.join(process.cwd(), 'src', 'templates', 'components', `${comp}.tex`);
      }

      if (fs.existsSync(compPath)) {
        const compSource = fs.readFileSync(compPath, 'utf8');
        variables[`${comp}Component`] = renderTemplate(compSource, variables);
      } else {
        variables[`${comp}Component`] = '';
      }
    }

    // 3. Load the template LaTeX from assets or database
    let latexSource = '';
    const folderName = templateId.replace('tpl-', '');
    let texPath = path.join(__dirname, folderName, 'template.tex');
    if (!fs.existsSync(texPath)) {
      texPath = path.join(process.cwd(), 'src', 'templates', folderName, 'template.tex');
    }

    if (fs.existsSync(texPath)) {
      latexSource = fs.readFileSync(texPath, 'utf8');
    } else {
      const { prisma } = await import('../prisma/client');
      const t = await prisma.template.findUnique({ where: { id: templateId } });
      if (!t || !t.latexSource) {
        throw new Error(`LaTeX source for template "${templateId}" not found`);
      }
      latexSource = t.latexSource;
    }

    // 4. Render the LaTeX code
    return renderTemplate(latexSource, variables);
  }
}

export const templateEngineService = new TemplateEngineService();

/**
 * Seeding method to load templates into the database on startup
 */
export async function seedTemplates(prisma: PrismaClient) {
  const folders = ['modern', 'classic', 'jake', 'professional', 'compact'];
  for (const folder of folders) {
    let texPath = path.join(__dirname, folder, 'template.tex');
    if (!fs.existsSync(texPath)) {
      texPath = path.join(process.cwd(), 'src', 'templates', folder, 'template.tex');
    }
    const templateId = `tpl-${folder}`;
    if (fs.existsSync(texPath)) {
      const latex = fs.readFileSync(texPath, 'utf8');
      await prisma.template.upsert({
        where: { id: templateId },
        update: { latexSource: latex },
        create: {
          id: templateId,
          name: folder === 'compact' ? 'Compact ATS' : folder.charAt(0).toUpperCase() + folder.slice(1),
          latexSource: latex,
        },
      });
    }
  }
}
