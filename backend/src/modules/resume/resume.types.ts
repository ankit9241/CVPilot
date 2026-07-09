export interface ResumeDomain {
  id: string;
  userId: string;
  templateId?: string;
  title: string;
  company?: string;
  role?: string;
  status: 'DRAFT' | 'GENERATING' | 'READY' | 'FAILED' | 'ARCHIVED';
  isFavorite: boolean;
  currentVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeVersionDomain {
  id: string;
  resumeId: string;
  versionNo: number;
  label?: string;
  contentJson: string;
  pdfUrl?: string;
  latexSource?: string;
  atsScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ATSReportDomain {
  id: string;
  resumeVersionId: string;
  score: number;
  keywordMatches: string;
  missingKeywords: string[];
  formattingIssues: string;
  recommendations: string;
  createdAt: string;
  updatedAt: string;
}
