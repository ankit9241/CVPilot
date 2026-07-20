export interface ATSScores {
  keywords: number;
  skills: number;
  experience: number;
  education: number;
  formatting: number;
  readability: number;
}

export interface ATSReport {
  overallScore: number;
  scores: ATSScores;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  warnings: string[];
  detailedBreakdown: Array<{
    category: string;
    score: number;
    description: string;
  }>;
}

export interface ATSWeights {
  keywords: number;
  skills: number;
  experience: number;
  education: number;
  formatting: number;
  readability: number;
}

export const DEFAULT_ATS_WEIGHTS: ATSWeights = {
  keywords: 0.35,
  skills: 0.25,
  experience: 0.20,
  formatting: 0.10,
  education: 0.05,
  readability: 0.05,
};
