/**
 * ATS Engine V2 — Deterministic rubric scoring + AI qualitative feedback.
 *
 * Score breakdown (points, not percentages):
 *   Parseability .............. 15
 *   Formatting ................ 15
 *   Keyword Match ............. 20
 *   Skills Match .............. 15
 *   Experience Relevance ...... 15
 *   Education ................. 5
 *   Grammar & Spelling ........ 5
 *   Readability ............... 5
 *   Impact & Quantification ... 5
 *   ─────────────────────────────
 *   TOTAL .................... 100
 */

export interface ATSScoreBreakdown {
  parseability: number;        // 0–15
  formatting: number;          // 0–15
  keywordMatch: number;        // 0–20
  skillsMatch: number;         // 0–15
  experienceRelevance: number; // 0–15
  education: number;           // 0–5
  grammarSpelling: number;     // 0–5
  readability: number;         // 0–5
  impact: number;              // 0–5
}

export interface ATSRecruiterFeedback {
  strengths: string[];
  weaknesses: string[];
  recruiterComments: string[];
  topImprovements: string[];
  keywordRecommendations: string[];
  formattingAdvice: string[];
}

// ─── AI Recruiter Review ────────────────────────────────────────────────────
// A senior-recruiter persona review — distinct from the deterministic ATS score.

export interface RecruiterReview {
  firstImpression: string;
  interviewRecommendation: string;
  hiringConfidence: number;            // 1-10
  strengths: string[];
  weaknesses: string[];
  biggestConcerns: string[];
  topImprovements: string[];
  likelyInterviewQuestions: string[];
}

// ─── Resume Quality Report ──────────────────────────────────────────────────
// Writing & presentation quality analysis — NOT ATS scoring.

export interface QualityReport {
  overallQualityScore: number;         // 0-100
  writingQuality: number;              // 0-100
  professionalTone: number;            // 0-100
  conciseness: number;                 // 0-100
  readability: number;                 // 0-100
  consistency: number;                 // 0-100
  impact: number;                      // 0-100
  redundancy: number;                  // 0-100 (higher = less redundancy)
  strengths: string[];
  weaknesses: string[];
  quickWins: string[];
  professionalReview: string;
}

// ─── Resume Diff Report ─────────────────────────────────────────────────────
// Version-to-version comparison of meaningful content changes.

export interface DiffItem {
  previousVersion: string;
  improvedVersion: string;
  reason: string;
  expectedBenefit: string;
}

export interface SectionDiff {
  section: string;
  changes: DiffItem[];
}

export interface DiffReport {
  totalChanges: number;
  sections: SectionDiff[];
}

// ─── Resume Health Report ───────────────────────────────────────────────────
// Aggregated health dashboard — no LLM calls, pure data aggregation.

// ─── Interview Preparation ──────────────────────────────────────────────────

export type InterviewDifficulty = 'easy' | 'medium' | 'hard';
export type InterviewCategory = 'behavioral' | 'project' | 'technical' | 'followup' | 'general';

export interface InterviewQuestion {
  question: string;
  category: InterviewCategory;
  difficulty: InterviewDifficulty;
  whyAsked: string;
  idealAnswerOutline: string[];
  commonMistakes: string[];
  topicsToRevise: string[];
}

// ─── Cover Letter ────────────────────────────────────────────────────────────

export interface CoverLetter {
  text: string;
  wordCount: number;
}

export interface InterviewPrep {
  totalQuestions: number;
  sections: {
    behavioral: InterviewQuestion[];
    project: InterviewQuestion[];
    technical: InterviewQuestion[];
    followup: InterviewQuestion[];
  };
}

export interface HealthReport {
  healthScore: number;
  categories: {
    resumeHealth: number;
    atsCompatibility: number;
    recruiterAppeal: number;
    writingQuality: number;
    jobMatch: number;
    readability: number;
    professionalTone: number;
    impact: number;
    completeness: number;
  };
  topRisks: string[];
  topStrengths: string[];
  priorityImprovements: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
}

export interface ATSReport {
  overallScore: number;
  scoreBreakdown: ATSScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  warnings: string[];
  errors: string[];
  strengths: string[];
  detailedBreakdown: Array<{
    category: string;
    score: number;
    max: number;
    description: string;
  }>;
  recruiterFeedback?: ATSRecruiterFeedback;
}
