export type BenchmarkRating = 'below-expectations' | 'meets-expectations' | 'above-expectations' | 'exceptional';

export interface BenchmarkCategory {
  rating: BenchmarkRating;
  score: number;      // 0-100
  justification: string;
}

export interface BenchmarkReport {
  role: string;
  seniority: 'junior' | 'mid' | 'senior' | 'lead';
  yearsOfExperience: number;
  disclaimer: string;

  categories: {
    projectQuality: BenchmarkCategory;
    experienceQuality: BenchmarkCategory;
    technicalBreadth: BenchmarkCategory;
    technicalDepth: BenchmarkCategory;
    leadership: BenchmarkCategory;
    impact: BenchmarkCategory;
    writing: BenchmarkCategory;
    atsReadiness: BenchmarkCategory;
    recruiterAppeal: BenchmarkCategory;
  };

  overallScore: number;             // weighted average 0-100
  percentileEstimate: string;       // e.g. "Top 25–35% for Senior Frontend Engineer"
  competitiveAdvantages: string[];  // 3-5: what makes this candidate stand out
  weakAreas: string[];              // 3-5: specific gaps vs the benchmark
  improvementPriorities: string[];  // 3-5: highest-ROI changes ranked
}
