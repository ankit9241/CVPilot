export interface TriggerWorkflowDto {
  resumeId?: string;
  templateId?: string;
  jobDescription: string;
  companyName?: string;
  targetRole?: string;
}

export interface GenerationSessionInitInput {
  companyName?: string;
  targetRole?: string;
  jobDescription: string;
}
