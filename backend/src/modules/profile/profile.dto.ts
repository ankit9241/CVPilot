export interface UpsertProfileDto {
  fullName: string;
  headline?: string;
  phone?: string;
  location?: string;
  summary?: string;
  avatarUrl?: string;
}

export interface SocialLinkDto {
  platform: string;
  url: string;
  label?: string;
}

export interface EducationDto {
  school: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

export interface ExperienceDto {
  company?: string;
  companyName?: string;
  position?: string;
  role: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  currentCompany?: boolean;
  description?: string;
  technologiesUsed?: string[];
  achievements?: string[];
}

export interface ProjectDto {
  title?: string;
  name: string;
  description?: string;
  role?: string;
  technologies?: string[];
  stack?: string[];
  githubUrl?: string;
  liveUrl?: string;
  startDate?: string;
  endDate?: string;
  featured?: boolean;
  impact?: string;
  achievements?: string[];
}

export interface SkillDto {
  name: string;
  category?: string;
  level?: number;
  sortOrder?: number;
}

export interface CertificateDto {
  name: string;
  issuer: string;
  issuedAt?: string;
  expiresAt?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface AchievementDto {
  title: string;
  context?: string;
  description?: string;
  date?: string;
  url?: string;
}
