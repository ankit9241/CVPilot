import { prisma } from '../../prisma/client';
import { getLLMClient } from '../../ai/llm/client';
import { parseJSON } from '../../ai/utils/json-parser';
import { extractTextFromPdf, extractTextFromDocx } from '../../ai/utils/extractor';
import { logger } from '../../logger/logger';

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  if (!clean || clean.toLowerCase() === 'present' || clean.toLowerCase() === 'current') {
    return null;
  }
  let normalized = clean;
  if (/^\d{4}$/.test(clean)) {
    normalized = `${clean}-01-01`;
  } else if (/^\d{4}-\d{2}$/.test(clean)) {
    normalized = `${clean}-01`;
  }
  const date = new Date(normalized);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function normalizeSkillCategory(category?: string): any {
  if (!category) return 'OTHER';
  const clean = category.trim().toUpperCase();
  const valid = [
    'FRONTEND',
    'BACKEND',
    'DATABASE',
    'CLOUD',
    'DEVOPS',
    'LANGUAGE',
    'FRAMEWORK',
    'LIBRARY',
    'AI_ML',
    'AI',
    'TOOL',
    'SOFT',
    'OTHER',
  ];
  if (valid.includes(clean)) return clean;
  if (clean === 'LANGUAGES') return 'LANGUAGE';
  if (clean === 'SOFT SKILLS' || clean === 'SOFT_SKILLS') return 'SOFT';
  if (clean === 'TOOLS') return 'TOOL';
  if (clean === 'DATABASES') return 'DATABASE';
  if (clean === 'LIBRARIES') return 'LIBRARY';
  if (clean === 'FRAMEWORKS') return 'FRAMEWORK';
  return 'OTHER';
}

function normalizeSocialPlatform(platform?: string): any {
  if (!platform) return 'OTHER';
  const clean = platform.trim().toUpperCase();
  const valid = [
    'LINKEDIN',
    'GITHUB',
    'PORTFOLIO',
    'WEBSITE',
    'LEETCODE',
    'CODEFORCES',
    'CODECHEF',
    'HACKERRANK',
    'MEDIUM',
    'DEV',
    'TWITTER',
    'DRIBBBLE',
    'BEHANCE',
    'OTHER',
  ];
  if (valid.includes(clean)) return clean;
  return 'OTHER';
}

export interface ExtractedProfileDTO {
  personalInfo?: {
    fullName?: string;
    headline?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  experiences?: Array<{
    companyName: string;
    role: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
    technologiesUsed: string[];
    achievements: string[];
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    role?: string;
    stack: string[];
    liveUrl?: string;
    githubUrl?: string;
    achievements: string[];
    featured: boolean;
  }>;
  skills?: Array<{
    name: string;
    category: string;
  }>;
  educations?: Array<{
    school: string;
    degree: string;
    field?: string;
    gpa?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  certificates?: Array<{
    name: string;
    issuer: string;
    issuedAt?: string;
    expiresAt?: string;
    credentialUrl?: string;
  }>;
  achievements?: Array<{
    title: string;
    context?: string;
    description?: string;
    date?: string;
    url?: string;
  }>;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
}

export class ProfileImportService {
  /**
   * Parse uploaded profile file (PDF/DOCX) using Gemini LLM.
   */
  async parseImportFile(
    buffer: Buffer,
    mimeType: string,
    importerType: 'resume' | 'linkedin',
    originalName?: string,
  ): Promise<ExtractedProfileDTO> {
    let extractedText = '';
    const name = (originalName || '').toLowerCase();
    const mime = mimeType.toLowerCase();

    if (mime.includes('pdf') || name.endsWith('.pdf')) {
      extractedText = await extractTextFromPdf(buffer);
    } else if (
      mime.includes('officedocument.wordprocessingml') ||
      mime.includes('msword') ||
      mime.includes('docx') ||
      name.endsWith('.docx') ||
      name.endsWith('.doc')
    ) {
      extractedText = await extractTextFromDocx(buffer);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    if (!extractedText.trim()) {
      throw new Error('Extracted text from the file is empty.');
    }

    logger.info(`Extracted ${extractedText.length} characters of raw text for LLM parsing...`);

    const promptText = `
You are an expert system designed to parse resumes and LinkedIn profiles into a structured JSON format matching the Master Profile schema.
Here is the raw text extracted from the document:
---
${extractedText}
---

Analyze the text and extract all relevant information. Your output must be a single JSON object. Do not include any explanation, intro, or markdown formatting outside of the JSON block itself.

Target JSON Schema:
{
  "personalInfo": {
    "fullName": "Full name of the person",
    "headline": "Professional headline or current job title",
    "phone": "Phone number",
    "location": "City, State/Country",
    "summary": "Short professional summary (60-100 words)"
  },
  "experiences": [
    {
      "companyName": "Name of the company",
      "role": "Job title/role",
      "location": "Location (optional)",
      "startDate": "Start date (YYYY-MM format, or best guess)",
      "endDate": "End date (YYYY-MM format, or 'Present' if current)",
      "isCurrent": true/false,
      "description": "Short description of responsibilities/role",
      "technologiesUsed": ["List of technologies, programming languages, tools used in this job"],
      "achievements": ["List of bullet points describing key accomplishments and duties"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Description of the project",
      "role": "Role in the project (optional)",
      "stack": ["Technologies, languages, frameworks used in project"],
      "liveUrl": "Demo/live URL if available",
      "githubUrl": "GitHub repository URL if available",
      "achievements": ["Key achievements/bullet points for the project"],
      "featured": true/false (true if it's a major, significant project, false otherwise)
    }
  ],
  "skills": [
    {
      "name": "Name of the skill (e.g. React, Node.js, Project Management)",
      "category": "Category (e.g. LANGUAGES, FRONTEND, BACKEND, CLOUD, TOOLS, METHODOLOGIES)"
    }
  ],
  "educations": [
    {
      "school": "University or school name",
      "degree": "Degree name (e.g., Bachelor of Science)",
      "field": "Field of study/major (e.g., Computer Science)",
      "gpa": "GPA (optional)",
      "startDate": "Start date",
      "endDate": "End date",
      "description": "Any honors, courses, or descriptions"
    }
  ],
  "certificates": [
    {
      "name": "Name of certificate or license",
      "issuer": "Issuing organization",
      "issuedAt": "Date issued (YYYY-MM format)",
      "expiresAt": "Expiry date (YYYY-MM format, or null)",
      "credentialUrl": "Verification URL if available"
    }
  ],
  "achievements": [
    {
      "title": "Title of the award, honor, or achievement",
      "context": "Context or issuer of the achievement",
      "description": "Details about the achievement",
      "date": "Date received (YYYY-MM format)",
      "url": "Associated link if available"
    }
  ],
  "socialLinks": [
    {
      "platform": "Platform (e.g. LINKEDIN, GITHUB, TWITTER, PORTFOLIO)",
      "url": "Profile URL"
    }
  ]
}

Extraction Guidance for LinkedIn exports:
- Map 'Licenses & Certifications' to "certificates".
- Map 'Honors & Awards' to "achievements".
- Map 'Volunteer Experience' to "experiences" (setting companyName to organization name and description/role).
- Map 'Publications' or 'Patents' to "projects" or "achievements".
- Map 'Courses' or 'Organizations' details to "educations" or "skills".
- Map 'Portfolio' or contact links to "socialLinks".

Ensure you extract as much detail as possible. Do not hallucinate or make up information. If a section is missing, return an empty array or omit the field.

CRITICAL DATE RULE:
- Never guess or infer dates. For startDate/endDate/issuedAt/date: if the document does not explicitly state the date, return null (do not invent a value, do not approximate from context). "Present"/"current" → null for endDate and set isCurrent=true.
`;

    const client = getLLMClient();
    const response = await client.call(
      [
        { role: 'system', content: 'You are a precise document extractor returning valid JSON.' },
        { role: 'user', content: promptText },
      ],
      { temperature: 0.1 },
    );

    const result = parseJSON<ExtractedProfileDTO>(response.content);
    if (!result) {
      throw new Error('Failed to parse LLM extraction into valid JSON.');
    }
    return result;
  }

  /**
   * Merge reviewed profile data into PostgreSQL.
   */
  async mergeProfile(userId: string, data: ExtractedProfileDTO): Promise<any> {
    // 1. Get or create the Master Profile
    let profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId, fullName: data.personalInfo?.fullName || 'New User' },
      });
    }

    const profileId = profile.id;

    // 2. Perform DB updates in transaction
    return prisma.$transaction(
      async (tx) => {
        // A. Update Personal Info if present
        if (data.personalInfo) {
          const personalPatch: Record<string, any> = {};
          if (data.personalInfo.fullName) personalPatch.fullName = data.personalInfo.fullName;
          if (data.personalInfo.headline) personalPatch.headline = data.personalInfo.headline;
          if (data.personalInfo.phone) personalPatch.phone = data.personalInfo.phone;
          if (data.personalInfo.location) personalPatch.location = data.personalInfo.location;
          if (data.personalInfo.summary) personalPatch.summary = data.personalInfo.summary;

          if (Object.keys(personalPatch).length > 0) {
            await tx.profile.update({
              where: { id: profileId },
              data: personalPatch,
            });
          }
        }

        // B. Merge Experiences
        if (data.experiences && data.experiences.length > 0) {
          const existing = await tx.experience.findMany({ where: { profileId } });
          for (const item of data.experiences) {
            const match = existing.find(
              (e) =>
                e.companyName.trim().toLowerCase() === item.companyName.trim().toLowerCase() &&
                e.role.trim().toLowerCase() === item.role.trim().toLowerCase(),
            );

            const payload = {
              companyName: item.companyName,
              role: item.role,
              location: item.location || '',
              startDate: parseDate(item.startDate),
              endDate: parseDate(item.endDate),
              isCurrent: !!item.isCurrent,
              description: item.description || '',
              technologiesUsed: item.technologiesUsed || [],
              achievements: item.achievements || [],
            };

            if (match) {
              await tx.experience.update({
                where: { id: match.id },
                data: payload,
              });
            } else {
              await tx.experience.create({
                data: { profileId, ...payload },
              });
            }
          }
        }

        // C. Merge Projects
        if (data.projects && data.projects.length > 0) {
          const existing = await tx.project.findMany({ where: { profileId } });
          for (const item of data.projects) {
            const match = existing.find(
              (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
            );

            const payload = {
              name: item.name,
              description: item.description || '',
              role: item.role || '',
              stack: item.stack || [],
              liveUrl: item.liveUrl || '',
              githubUrl: item.githubUrl || '',
              achievements: item.achievements || [],
              featured: !!item.featured,
            };

            if (match) {
              await tx.project.update({
                where: { id: match.id },
                data: payload,
              });
            } else {
              await tx.project.create({
                data: { profileId, ...payload },
              });
            }
          }
        }

        // D. Merge Skills
        if (data.skills && data.skills.length > 0) {
          const existing = await tx.skill.findMany({ where: { profileId } });
          const maxSort = await tx.skill.aggregate({
            _max: { sortOrder: true },
            where: { profileId },
          });
          let currentMaxSort = maxSort._max.sortOrder ?? 0;

          for (const item of data.skills) {
            const match = existing.find(
              (s) => s.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
            );

            const payload = {
              name: item.name,
              category: normalizeSkillCategory(item.category),
            };

            if (match) {
              await tx.skill.update({
                where: { id: match.id },
                data: payload,
              });
            } else {
              currentMaxSort++;
              await tx.skill.create({
                data: {
                  profileId,
                  ...payload,
                  sortOrder: currentMaxSort,
                },
              });
            }
          }
        }

        // E. Merge Educations
        if (data.educations && data.educations.length > 0) {
          const existing = await tx.education.findMany({ where: { profileId } });
          for (const item of data.educations) {
            const match = existing.find(
              (e) =>
                e.school.trim().toLowerCase() === item.school.trim().toLowerCase() &&
                e.degree.trim().toLowerCase() === item.degree.trim().toLowerCase(),
            );

            const payload = {
              school: item.school,
              degree: item.degree,
              field: item.field || '',
              gpa: item.gpa || '',
              startDate: parseDate(item.startDate),
              endDate: parseDate(item.endDate),
              description: item.description || '',
            };

            if (match) {
              await tx.education.update({
                where: { id: match.id },
                data: payload,
              });
            } else {
              await tx.education.create({
                data: { profileId, ...payload },
              });
            }
          }
        }

        // F. Merge Certificates
        if (data.certificates && data.certificates.length > 0) {
          const existing = await tx.certificate.findMany({ where: { profileId } });
          for (const item of data.certificates) {
            const match = existing.find(
              (c) => c.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
            );

            const payload = {
              name: item.name,
              issuer: item.issuer,
              issuedAt: parseDate(item.issuedAt),
              expiresAt: parseDate(item.expiresAt),
              credentialUrl: item.credentialUrl || '',
            };

            if (match) {
              await tx.certificate.update({
                where: { id: match.id },
                data: payload,
              });
            } else {
              await tx.certificate.create({
                data: { profileId, ...payload },
              });
            }
          }
        }

        // G. Merge Achievements
        if (data.achievements && data.achievements.length > 0) {
          const existing = await tx.achievement.findMany({ where: { profileId } });
          for (const item of data.achievements) {
            const match = existing.find(
              (a) => a.title.trim().toLowerCase() === item.title.trim().toLowerCase(),
            );

            const payload = {
              title: item.title,
              context: item.context || '',
              description: item.description || '',
              date: parseDate(item.date),
              url: item.url || '',
            };

            if (match) {
              await tx.achievement.update({
                where: { id: match.id },
                data: payload,
              });
            } else {
              await tx.achievement.create({
                data: { profileId, ...payload },
              });
            }
          }
        }

        // H. Merge Social Links
        if (data.socialLinks && data.socialLinks.length > 0) {
          const existing = await tx.socialLink.findMany({ where: { profileId } });
          for (const item of data.socialLinks) {
            if (!item.url) continue;
            const match = existing.find(
              (l) => l.platform.trim().toLowerCase() === item.platform.trim().toLowerCase(),
            );

            const payload = {
              platform: normalizeSocialPlatform(item.platform),
              url: item.url,
              label: item.platform ? item.platform.toLowerCase() : 'link',
            };

            if (match) {
              await tx.socialLink.update({
                where: { id: match.id },
                data: payload,
              });
            } else {
              await tx.socialLink.create({
                data: { profileId, ...payload },
              });
            }
          }
        }

        return { success: true };
      },
      { maxWait: 15000, timeout: 30000 },
    );
  }
}

export const profileImportService = new ProfileImportService();
