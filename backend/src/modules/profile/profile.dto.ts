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
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  achievements?: string[];
}

export interface ProjectDto {
  name: string;
  description?: string;
  role?: string;
  stack?: string[];
  githubUrl?: string;
  liveUrl?: string;
  startDate?: string;
  endDate?: string;
  impact?: string;
  achievements?: string[];
}

export interface SkillDto {
  name: string;
  category?: string;
  level?: number;
}

export interface CertificateDto {
  name: string;
  issuer: string;
  issuedAt?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface AchievementDto {
  title: string;
  context?: string;
  date?: string;
}
