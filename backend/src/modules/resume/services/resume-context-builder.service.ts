import { prisma } from '../../../prisma/client';
import { BadRequestError } from '../../../utils/errors';
import z from 'zod';
import {
  ResumeContext,
  ParsedJobDescription,
  ResumeContextExperience,
  ResumeContextProject,
  ResumeContextSkill,
  ResumeContextEducation,
  ResumeContextCertificate,
  ResumeContextAchievement,
} from '../../workflow/generation-session.types';

export class ResumeContextBuilderService {
  async build(
    userId: string,
    companyName: string,
    companyDescription: string | undefined,
    jobDescription: string,
  ): Promise<ResumeContext> {
    // 1. Validate basic inputs
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }
    if (!companyName || companyName.trim().length === 0) {
      throw new BadRequestError('Company name is required');
    }
    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new BadRequestError('Job description is required');
    }

    // 2. Fetch all profile data from PostgreSQL
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        experiences: true,
        projects: true,
        skills: true,
        educations: true,
        certificates: true,
        achievements: true,
        socialLinks: true,
      },
    });

    // 3. Add backend validation
    if (!profile) {
      throw new BadRequestError('Master Profile not found. Please complete your profile first.');
    }
    if (!profile.fullName || profile.fullName.trim().length === 0) {
      throw new BadRequestError('Profile fullName is missing. Please complete your personal info.');
    }
    if (!profile.experiences || profile.experiences.length === 0) {
      throw new BadRequestError(
        'Profile experiences are missing. Please add at least one experience.',
      );
    }
    if (!profile.skills || profile.skills.length === 0) {
      throw new BadRequestError('Profile skills are missing. Please add at least one skill.');
    }

    // 4. Parse job description
    const parsedJobDescription = this.parseJobDescription(jobDescription, companyName);
    const keywords = this.extractKeywords(parsedJobDescription);

    // 5. Rank and normalize Experiences
    // Sort experiences by recency (startDate desc, then endDate desc)
    const sortedRawExperiences = profile.experiences.slice().sort((a, b) => {
      const aStart = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bStart = b.startDate ? new Date(b.startDate).getTime() : 0;
      if (bStart !== aStart) return bStart - aStart;
      const aEnd = a.endDate ? new Date(a.endDate).getTime() : 0;
      const bEnd = b.endDate ? new Date(b.endDate).getTime() : 0;
      return bEnd - aEnd;
    });

    const experiences: ResumeContextExperience[] = sortedRawExperiences.map((exp) => ({
      id: exp.id,
      companyName: exp.companyName,
      role: exp.role,
      location: exp.location || undefined,
      startDate: exp.startDate ? new Date(exp.startDate) : undefined,
      endDate: exp.endDate ? new Date(exp.endDate) : undefined,
      isCurrent: exp.isCurrent,
      description: exp.description || undefined,
      technologiesUsed: Array.isArray(exp.technologiesUsed) ? exp.technologiesUsed : [],
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      relevanceScore: this.calculateRelevance(
        `${exp.role} ${exp.companyName} ${exp.description || ''} ${(exp.technologiesUsed || []).join(' ')}`,
        keywords,
      ),
    }));

    // 6. Rank and normalize Projects
    // Sort projects by featured desc, then date (startDate desc)
    const sortedRawProjects = profile.projects.slice().sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      const aStart = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bStart = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bStart - aStart;
    });

    const projects: ResumeContextProject[] = sortedRawProjects.map((proj) => ({
      id: proj.id,
      name: proj.name,
      description: proj.description || undefined,
      role: proj.role || undefined,
      stack: Array.isArray(proj.stack) ? proj.stack : [],
      impact: proj.impact || undefined,
      achievements: Array.isArray(proj.achievements) ? proj.achievements : [],
      featured: proj.featured,
      relevanceScore: this.calculateRelevance(
        `${proj.name} ${proj.description || ''} ${(proj.stack || []).join(' ')} ${proj.role || ''}`,
        keywords,
      ),
    }));

    // 7. Rank and normalize Skills
    // Sort skills by user ordering (sortOrder asc, then createdAt asc)
    const sortedRawSkills = profile.skills.slice().sort((a, b) => {
      const aOrder = a.sortOrder ?? 0;
      const bOrder = b.sortOrder ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Remove duplicate skills (case-insensitive)
    const uniqueSkillsMap = new Map<string, (typeof sortedRawSkills)[0]>();
    for (const skill of sortedRawSkills) {
      const lowerName = skill.name.trim().toLowerCase();
      if (!uniqueSkillsMap.has(lowerName)) {
        uniqueSkillsMap.set(lowerName, skill);
      }
    }
    const uniqueRawSkills = Array.from(uniqueSkillsMap.values());

    const skills: ResumeContextSkill[] = uniqueRawSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category || 'OTHER',
      level: skill.level || undefined,
      relevanceScore: this.calculateRelevance(skill.name, keywords),
    }));

    // 8. Normalize Educations
    const educations: ResumeContextEducation[] = profile.educations.map((e) => ({
      id: e.id,
      school: e.school,
      degree: e.degree,
      field: e.field || undefined,
      gpa: e.gpa || undefined,
      startDate: e.startDate ? new Date(e.startDate) : undefined,
      endDate: e.endDate ? new Date(e.endDate) : undefined,
      description: e.description || undefined,
    }));

    // 9. Normalize Certificates
    const certificates: ResumeContextCertificate[] = profile.certificates.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      issuedAt: c.issuedAt ? new Date(c.issuedAt) : undefined,
      expiresAt: c.expiresAt ? new Date(c.expiresAt) : undefined,
      credentialUrl: c.credentialUrl || undefined,
    }));

    // 10. Normalize Achievements
    const achievements: ResumeContextAchievement[] = profile.achievements.map((a) => ({
      id: a.id,
      title: a.title,
      context: a.context || undefined,
      description: a.description || undefined,
      date: a.date ? new Date(a.date) : undefined,
      url: a.url || undefined,
    }));

    // 11. Normalize Personal Info & Social Links
    const socialLinks = profile.socialLinks.map((sl) => ({
      platform: sl.platform,
      label: sl.label || undefined,
      url: sl.url,
    }));

    const resumeContext: ResumeContext = {
      personalInfo: {
        fullName: profile.fullName,
        headline: profile.headline || undefined,
        phone: profile.phone || undefined,
        location: profile.location || undefined,
        avatarUrl: profile.avatarUrl || undefined,
        socialLinks,
      },
      professionalSummary: profile.summary || undefined,
      experiences,
      projects,
      skills,
      educations,
      certificates,
      achievements,
      company: {
        name: companyName,
        description: companyDescription || undefined,
      },
      targetRole: parsedJobDescription.title || 'Software Engineer',
      jobDescription: parsedJobDescription,
      extractedKeywords: keywords,
      generationSessionId: `session-${Date.now()}`,
      createdAt: new Date(),
    };

    return resumeContext;
  }

  private parseJobDescription(raw: string, companyName: string): ParsedJobDescription {
    const lines = raw.split('\n').map((line) => line.trim());

    const parsed: ParsedJobDescription = {
      raw,
      title: undefined,
      company: companyName,
      location: undefined,
      requirements: [],
      responsibilities: [],
      keywords: [],
    };

    // Try to extract job title from the first 3 lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      if (
        line.length > 3 &&
        line.length < 80 &&
        !line.startsWith('-') &&
        !line.startsWith('*') &&
        (line.toLowerCase().includes('engineer') ||
          line.toLowerCase().includes('developer') ||
          line.toLowerCase().includes('manager') ||
          line.toLowerCase().includes('designer') ||
          line.toLowerCase().includes('architect') ||
          line.toLowerCase().includes('analyst') ||
          line.toLowerCase().includes('lead'))
      ) {
        parsed.title = line.replace(/^(role|title|position|job title)\s*:\s*/i, '').trim();
        break;
      }
    }

    if (!parsed.title && lines[0] && lines[0].length < 80 && !lines[0].startsWith('-')) {
      parsed.title = lines[0];
    }

    let currentSection = '';
    for (const line of lines) {
      if (
        line.toLowerCase().includes('requirement') ||
        line.toLowerCase().includes('qualification') ||
        line.toLowerCase().includes('require:')
      ) {
        currentSection = 'requirements';
      } else if (
        line.toLowerCase().includes('responsibilit') ||
        line.toLowerCase().includes('respons:')
      ) {
        currentSection = 'responsibilities';
      } else if (line.length > 0) {
        if (currentSection === 'requirements') {
          parsed.requirements.push(line);
        } else if (currentSection === 'responsibilities') {
          parsed.responsibilities.push(line);
        }
      }
    }

    return parsed;
  }

  private extractKeywords(jobDescription: ParsedJobDescription): string[] {
    const text = [
      jobDescription.raw,
      ...jobDescription.requirements,
      ...jobDescription.responsibilities,
    ]
      .join(' ')
      .toLowerCase();

    const keywords = new Set<string>();
    const wordMatches = text.match(/\b[a-z]+(?:\+\+|#)?\b/g);
    const words: string[] = wordMatches || [];

    const techKeywords = [
      'javascript',
      'typescript',
      'python',
      'java',
      'c#',
      'go',
      'rust',
      'react',
      'vue',
      'angular',
      'nodejs',
      'node.js',
      'express',
      'django',
      'flask',
      'spring',
      'sql',
      'mongodb',
      'postgresql',
      'mysql',
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes',
      'git',
      'rest',
      'graphql',
      'api',
      'frontend',
      'backend',
      'full-stack',
      'fullstack',
      'html',
      'css',
      'testing',
      'jest',
      'agile',
      'scrum',
      'linux',
      'windows',
      'mac',
      'ci/cd',
      'devops',
    ];

    for (const keyword of techKeywords) {
      if (words.includes(keyword)) {
        keywords.add(keyword);
      }
    }

    const phraseMatches = jobDescription.raw.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    for (const phrase of phraseMatches) {
      if (phrase.length > 2) {
        keywords.add(phrase);
      }
    }

    return Array.from(keywords).slice(0, 30);
  }

  private calculateRelevance(text: string, keywords: string[]): number {
    if (keywords.length === 0) return 0.5;

    const lowerText = text.toLowerCase();
    const matches = keywords.filter((keyword) => lowerText.includes(keyword.toLowerCase()));

    return Math.min(1, matches.length / keywords.length);
  }
}

export const resumeContextBuilderService = new ResumeContextBuilderService();
