export interface ResumeContextPersonal {
  fullName: string;
  headline?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  socialLinks?: {
    platform: string;
    label?: string;
    url: string;
  }[];
}

export interface ResumeContextExperience {
  id: string;
  companyName: string;
  role: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
  technologiesUsed: string[];
  achievements: string[];
  relevanceScore?: number;
}

export interface ResumeContextProject {
  id: string;
  name: string;
  description?: string;
  role?: string;
  stack: string[];
  impact?: string;
  achievements: string[];
  featured: boolean;
  relevanceScore?: number;
}

export interface ResumeContextSkill {
  id: string;
  name: string;
  category: string;
  level?: number;
  relevanceScore?: number;
}

export interface ResumeContextEducation {
  id: string;
  school: string;
  degree: string;
  field?: string;
  gpa?: string;
  startDate?: Date;
  endDate?: Date;
  description?: string;
}

export interface ResumeContextCertificate {
  id: string;
  name: string;
  issuer: string;
  issuedAt?: Date;
  expiresAt?: Date;
  credentialUrl?: string;
}

export interface ResumeContextAchievement {
  id: string;
  title: string;
  context?: string;
  description?: string;
  date?: Date;
  url?: string;
}

export interface ParsedJobDescription {
  raw: string;
  title?: string;
  company?: string;
  location?: string;
  requirements: string[];
  responsibilities: string[];
  keywords: string[];
}

export interface ResumeContext {
  // Personal Information
  personalInfo: ResumeContextPersonal;
  professionalSummary?: string;

  // Content - Ranked
  experiences: ResumeContextExperience[];
  projects: ResumeContextProject[];
  skills: ResumeContextSkill[];

  // Additional Content
  educations: ResumeContextEducation[];
  certificates: ResumeContextCertificate[];
  achievements: ResumeContextAchievement[];

  // Job Context
  company: {
    id?: string;
    name: string;
    description?: string;
    industry?: string;
  };
  targetRole: string;
  jobDescription: ParsedJobDescription;
  extractedKeywords: string[];

  // Metadata
  generationSessionId: string;
  createdAt: Date;
}

export interface WorkflowStepResult {
  stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  duration?: number;
  error?: string;
}

export interface WorkflowExecutionContext {
  sessionId: string;
  userId: string;
  steps: WorkflowStepResult[];
  startTime: Date;
}
