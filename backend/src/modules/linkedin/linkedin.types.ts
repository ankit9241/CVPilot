export interface LinkedInOptimization {
  headline: string;
  about: string;
  experienceEntries: Array<{
    role: string;
    company: string;
    description: string;
  }>;
  featuredProjects: Array<{
    name: string;
    description: string;
  }>;
  topSkills: string[];
  keywordRecommendations: string[];
  recruiterVisibilityTips: string[];
}
