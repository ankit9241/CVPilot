export interface PortfolioHero {
  name: string;
  tagline: string;
  subheadline: string;
  ctaLabel: string;
  ctaTarget: 'projects' | 'contact';
}

export interface PortfolioAbout {
  bio: string;                    // 2-3 paragraphs
  highlights: string[];           // 3-5 one-liners (years exp, specialisms, etc.)
}

export interface PortfolioProject {
  name: string;
  summary: string;                // 2-3 sentences
  bullets: string[];              // 2-4 impact bullets (reworded, not copied)
  technologies: string[];
  featured: boolean;
}

export interface PortfolioExperience {
  role: string;
  company: string;
  period: string;                 // "Jan 2022 – Present"
  summary: string;                // 2 sentences: scope + impact
}

export interface PortfolioSkillGroup {
  category: string;
  skills: string[];
}

export interface PortfolioContact {
  headline: string;               // "Let's build something together."
  body: string;                   // 1-2 sentences inviting contact
}

export interface PortfolioSEO {
  title: string;                  // "<Name> | <Role>"
  description: string;            // 140-160 chars for meta description
  keywords: string[];             // 10-15 terms
  ogTitle: string;
  ogDescription: string;
}

export interface PortfolioContent {
  hero: PortfolioHero;
  about: PortfolioAbout;
  projects: PortfolioProject[];
  experience: PortfolioExperience[];
  skills: PortfolioSkillGroup[];
  contact: PortfolioContact;
  seo: PortfolioSEO;
}
