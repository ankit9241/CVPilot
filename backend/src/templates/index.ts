import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { mapResumeToVariables as mapModern } from './modern/mapping';
import { mapResumeToVariables as mapClassic } from './classic/mapping';
import { mapResumeToVariables as mapJake } from './jake/mapping';
import { mapResumeToVariables as mapProfessional } from './professional/mapping';

export const templateMappers: Record<string, (resume: any, profile: any) => any> = {
  'tpl-modern': mapModern,
  'tpl-classic': mapClassic,
  'tpl-jake': mapJake,
  'tpl-professional': mapProfessional,
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

  // 4. Skills grouping (Part 6)
  const groupedSkills: Record<string, string[]> = {};
  for (const sk of skills.slice(0, maxSkillsCount)) {
    const cat = sk.category || 'Other';
    if (!groupedSkills[cat]) groupedSkills[cat] = [];
    if (!groupedSkills[cat].includes(sk.name)) {
      groupedSkills[cat].push(sk.name);
    }
  }
  const formattedSkills = Object.entries(groupedSkills).map(([category, names]) => ({
    category,
    name: names.join(' • '),
    level: 3,
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

    // 1. Convert GeneratedResume into template variables
    const variables = mapper(budgetedResume, profile);

    // 2. Load the template LaTeX from assets or database
    let latexSource = '';
    const folderName = templateId.replace('tpl-', '');
    const texPath = path.join(__dirname, folderName, 'template.tex');

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

    // 3. Render the LaTeX code
    return renderTemplate(latexSource, variables);
  }
}

export const templateEngineService = new TemplateEngineService();

/**
 * Seeding method to load templates into the database on startup
 */
export async function seedTemplates(prisma: PrismaClient) {
  const folders = ['modern', 'classic', 'jake', 'professional'];
  for (const folder of folders) {
    const texPath = path.join(__dirname, folder, 'template.tex');
    const templateId = `tpl-${folder}`;
    if (fs.existsSync(texPath)) {
      const latex = fs.readFileSync(texPath, 'utf8');
      await prisma.template.upsert({
        where: { id: templateId },
        update: { latexSource: latex },
        create: {
          id: templateId,
          name: folder.charAt(0).toUpperCase() + folder.slice(1),
          latexSource: latex,
        },
      });
    }
  }
}
