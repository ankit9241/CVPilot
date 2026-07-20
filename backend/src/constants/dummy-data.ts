// Deterministic dummy data used by controllers while business logic is not
// implemented yet. Every controller returns shapes that match the eventual
// Prisma models so the frontend can integrate against a stable contract.

const now = () => new Date().toISOString();

export const dummyUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'alex@cvpilot.io',
  role: 'USER' as const,
  emailVerified: true,
  provider: 'EMAIL' as const,
  createdAt: '2024-06-01T10:00:00.000Z',
  updatedAt: now(),
};

export const dummyProfile = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: dummyUser.id,
  fullName: 'Alex Larsen',
  headline: 'Senior Product Engineer',
  phone: '+1 (415) 555-0134',
  location: 'San Francisco, CA',
  summary: 'Product-minded engineer focused on delightful, high-performance interfaces.',
  avatarUrl: null,
  completion: 68,
  createdAt: '2024-06-01T10:00:00.000Z',
  updatedAt: now(),
};

export const dummySocialLinks = [
  {
    id: 'sl-1',
    profileId: dummyProfile.id,
    platform: 'LINKEDIN',
    url: 'https://linkedin.com/in/alexlarsen',
    label: 'LinkedIn',
  },
  {
    id: 'sl-2',
    profileId: dummyProfile.id,
    platform: 'GITHUB',
    url: 'https://github.com/alexlarsen',
    label: 'GitHub',
  },
  {
    id: 'sl-3',
    profileId: dummyProfile.id,
    platform: 'PORTFOLIO',
    url: 'https://alexlarsen.dev',
    label: 'Portfolio',
  },
];

export const dummyEducation = [
  {
    id: 'edu-1',
    profileId: dummyProfile.id,
    school: 'Stanford University',
    degree: 'M.S. Computer Science',
    field: 'Human-Computer Interaction',
    startDate: '2018-09-01T00:00:00.000Z',
    endDate: '2020-06-01T00:00:00.000Z',
    gpa: '3.9 / 4.0',
  },
];

export const dummyExperience = [
  {
    id: 'exp-1',
    profileId: dummyProfile.id,
    company: 'Linear',
    role: 'Senior Product Engineer',
    location: 'Remote',
    startDate: '2023-01-01T00:00:00.000Z',
    endDate: null,
    isCurrent: true,
    description:
      'Lead frontend architecture for the core issue tracker, focusing on performance and delight.',
    achievements: [
      'Cut initial load time by 42% through streaming and route-level splitting',
      'Shipped the redesigned command menu used by 300k+ daily users',
    ],
  },
];

export const dummyProjects = [
  {
    id: 'proj-1',
    profileId: dummyProfile.id,
    name: 'Pilot Studio',
    description: 'A collaborative resume editor with real-time preview and version history.',
    role: 'Founding Engineer',
    stack: ['TypeScript', 'React', 'TanStack', 'Postgres'],
    githubUrl: 'https://github.com/alexlarsen/pilot-studio',
    liveUrl: 'https://pilot.studio',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: null,
    impact: 'Adopted by 12k+ makers in the first quarter.',
    achievements: ['Featured on Product Hunt #2 of the day'],
  },
];

export const dummySkills = [
  { id: 'sk-1', profileId: dummyProfile.id, name: 'React', category: 'FRONTEND', level: 5 },
  { id: 'sk-2', profileId: dummyProfile.id, name: 'TypeScript', category: 'LANGUAGE', level: 5 },
  { id: 'sk-3', profileId: dummyProfile.id, name: 'Postgres', category: 'DATABASE', level: 4 },
];

export const dummyCertificates = [
  {
    id: 'cert-1',
    profileId: dummyProfile.id,
    name: 'AWS Certified Solutions Architect',
    issuer: 'Amazon Web Services',
    issuedAt: '2024-03-01T00:00:00.000Z',
    credentialId: 'AWS-SA-C03-0421',
    url: null,
  },
];

export const dummyAchievements = [
  {
    id: 'ach-1',
    profileId: dummyProfile.id,
    title: 'Speaker · React Conf 2024',
    description: "Talk on 'Latency Budgets for Product Engineers'",
    date: '2024-05-01T00:00:00.000Z',
  },
];

export const dummyTemplates = [
  {
    id: 'tpl-modern',
    name: 'Modern',
    category: 'MODERN',
    tag: 'Popular',
    isPremium: false,
    previewUrl: null,
    tone: 'Balanced grid, generous whitespace.',
  },
  {
    id: 'tpl-classic',
    name: 'Classic',
    category: 'CLASSIC',
    tag: 'Timeless',
    isPremium: false,
    previewUrl: null,
    tone: 'Serif-first, editorial rhythm.',
  },
  {
    id: 'tpl-jake',
    name: 'Jake',
    category: 'MINIMAL',
    tag: 'Engineer favourite',
    isPremium: false,
    previewUrl: null,
    tone: 'Compact single-page density.',
  },
  {
    id: 'tpl-professional',
    name: 'Professional',
    category: 'PROFESSIONAL',
    tag: 'Executive',
    isPremium: true,
    previewUrl: null,
    tone: 'Confident header, quiet body.',
  },
];

export const dummyResumes = [
  {
    id: 'res-1',
    userId: dummyUser.id,
    templateId: 'tpl-modern',
    title: 'Google · Frontend Engineer',
    company: 'Google',
    role: 'Frontend Engineer',
    status: 'READY',
    atsScore: 90,
    isFavorite: true,
    latestVersion: 2,
    createdAt: '2024-02-08T00:00:00.000Z',
    updatedAt: '2024-02-14T00:00:00.000Z',
  },
  {
    id: 'res-2',
    userId: dummyUser.id,
    templateId: 'tpl-professional',
    title: 'Microsoft · AI Engineer',
    company: 'Microsoft',
    role: 'AI Engineer',
    status: 'READY',
    atsScore: 92,
    isFavorite: true,
    latestVersion: 3,
    createdAt: '2024-03-12T00:00:00.000Z',
    updatedAt: '2024-03-22T00:00:00.000Z',
  },
];

export const dummyResumeVersions = [
  {
    id: 'rv-1',
    resumeId: 'res-1',
    label: 'Base',
    version: 1,
    atsScore: 84,
    contentJson: {},
    createdAt: '2024-02-08T00:00:00.000Z',
  },
  {
    id: 'rv-2',
    resumeId: 'res-1',
    label: 'Tailored',
    version: 2,
    atsScore: 90,
    contentJson: {},
    createdAt: '2024-02-14T00:00:00.000Z',
  },
];

export const dummyAtsReport = {
  id: 'ats-1',
  resumeId: 'res-1',
  score: 90,
  keywordMatches: 24,
  keywordMisses: ['distributed systems', 'observability', 'GraphQL federation'],
  formattingIssues: [],
  recommendations: [
    'Add a metric to the "Optimized checkout" bullet.',
    'Mirror the JD phrase "component library" in your Stripe role.',
  ],
  createdAt: now(),
};

export const dummyWorkflowRuns = [
  {
    id: 'wf-1',
    userId: dummyUser.id,
    resumeId: 'res-1',
    status: 'RUNNING',
    progress: 62,
    currentStep: 'Experience Optimization',
    startedAt: now(),
    finishedAt: null,
  },
];

export const dummyWorkflowLogs = [
  {
    id: 'wl-1',
    runId: 'wf-1',
    step: 'Master Profile',
    level: 'INFO',
    message: 'Reading profile, projects and skills…',
    at: now(),
  },
  {
    id: 'wl-2',
    runId: 'wf-1',
    step: 'Company Analysis',
    level: 'INFO',
    message: 'Researching company signals and tone.',
    at: now(),
  },
];

export const dummyApplications = [
  {
    id: 'app-1',
    userId: dummyUser.id,
    resumeId: 'res-1',
    company: 'Google',
    role: 'Frontend Engineer',
    location: 'Mountain View, CA',
    status: 'INTERVIEW',
    salary: '$220k',
    jobUrl: 'https://careers.google.com/jobs/results/1',
    appliedAt: '2024-02-15T00:00:00.000Z',
    notes: 'Recruiter reached out via LinkedIn.',
  },
  {
    id: 'app-2',
    userId: dummyUser.id,
    resumeId: 'res-2',
    company: 'Microsoft',
    role: 'AI Engineer',
    location: 'Redmond, WA',
    status: 'APPLIED',
    salary: '$210k',
    jobUrl: null,
    appliedAt: '2024-03-24T00:00:00.000Z',
    notes: null,
  },
];

export const dummyApplicationStages = [
  {
    id: 'stage-1',
    applicationId: 'app-1',
    from: 'APPLIED',
    to: 'INTERVIEW',
    note: 'Screening call scheduled',
    at: '2024-02-20T00:00:00.000Z',
  },
];

export const dummySettings = {
  id: 'set-1',
  userId: dummyUser.id,
  theme: 'system',
  language: 'en',
  timezone: 'America/Los_Angeles',
  emailNotifications: true,
  productUpdates: true,
  weeklyDigest: false,
  preferences: {},
  updatedAt: now(),
};
