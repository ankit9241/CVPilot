import { z } from 'zod';

export const analyzeAtsSchema = z.object({
  resumeVersionId: z.string().uuid('Invalid resumeVersionId format'),
  jobDescription: z.string().optional(),
});

export type AnalyzeAtsInput = z.infer<typeof analyzeAtsSchema>;

export const diffSchema = z.object({
  oldVersionId: z.string().uuid('Invalid oldVersionId format'),
  newVersionId: z.string().uuid('Invalid newVersionId format'),
});

export type DiffInput = z.infer<typeof diffSchema>;

export const interviewPrepSchema = z.object({
  resumeVersionId: z.string().uuid('Invalid resumeVersionId format'),
  // Optional: pass pre-fetched results from client to skip redundant LLM calls
  atsReport: z.record(z.unknown()).optional(),
  recruiterReview: z.record(z.unknown()).optional(),
});

export type InterviewPrepInput = z.infer<typeof interviewPrepSchema>;

export const coverLetterSchema = z.object({
  resumeVersionId: z.string().uuid('Invalid resumeVersionId format'),
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
});

export type CoverLetterInput = z.infer<typeof coverLetterSchema>;
