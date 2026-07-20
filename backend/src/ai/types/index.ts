import { ResumeContext } from '../../modules/workflow';

export interface GeneratedExperience {
  companyName: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  bulletPoints: string[];
}

export interface GeneratedProject {
  name: string;
  description: string;
  role?: string;
  technologies: string[];
  bulletPoints: string[];
  impact?: string;
}

export interface GeneratedSkill {
  name: string;
  category: string;
  level?: number;
}

export interface GeneratedResume {
  summary: string;
  experiences: GeneratedExperience[];
  projects: GeneratedProject[];
  skills: GeneratedSkill[];
  education: Array<{
    school: string;
    degree: string;
    field?: string;
    gpa?: string;
    startDate?: string;
    endDate?: string;
  }>;
  certificates: Array<{
    name: string;
    issuer: string;
  }>;
  achievements: string[];
  metadata: {
    targetRole: string;
    companyName: string;
    generationSessionId: string;
    generatedAt: string;
    keywordMatches: string[];
    selectionRationale: string;
  };
}

export interface GraphState {
  // Input
  resumeContext: ResumeContext | null;

  // Current data
  currentResume: GeneratedResume | null;
  selectedExperiences: GeneratedExperience[] | null;
  selectedProjects: GeneratedProject[] | null;
  selectedSkills: GeneratedSkill[] | null;

  // Generated content
  generatedSummary: string | null;
  generatedExperienceBullets: Record<string, string[]> | null;
  generatedProjectBullets: Record<string, string[]> | null;
  generatedResumeJson: GeneratedResume | null;

  // Metadata
  metadata: {
    targetRole: string;
    companyName: string;
    generationSessionId: string;
    keywordMatches: string[];
    selectionRationale: string;
    errors: string[];
    timestamp: string;
  };
}
