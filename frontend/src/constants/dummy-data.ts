// Dummy data used across CVPilot UI. No backend required.

export const currentUser = {
  name: "Alex Larsen",
  email: "alex@cvpilot.io",
  role: "Senior Product Engineer",
  phone: "+1 (415) 555-0134",
  location: "San Francisco, CA",
  initials: "AL",
  profileCompletion: 68,
};

export const socialLinks = [
  {
    key: "linkedin",
    label: "LinkedIn",
    value: "linkedin.com/in/alexlarsen",
    placeholder: "https://linkedin.com/in/…",
  },
  {
    key: "github",
    label: "GitHub",
    value: "github.com/alexlarsen",
    placeholder: "https://github.com/…",
  },
  { key: "portfolio", label: "Portfolio", value: "alexlarsen.dev", placeholder: "https://…" },
  {
    key: "leetcode",
    label: "LeetCode",
    value: "leetcode.com/alexlarsen",
    placeholder: "https://leetcode.com/…",
  },
  { key: "twitter", label: "Twitter / X", value: "@alexlarsen", placeholder: "@handle" },
  { key: "dribbble", label: "Dribbble", value: "", placeholder: "https://dribbble.com/…" },
  { key: "behance", label: "Behance", value: "", placeholder: "https://behance.net/…" },
];

export const education = [
  {
    id: "e1",
    school: "Stanford University",
    degree: "M.S. Computer Science",
    field: "Human-Computer Interaction",
    start: "2018",
    end: "2020",
    gpa: "3.9 / 4.0",
  },
  {
    id: "e2",
    school: "University of Waterloo",
    degree: "B.Sc. Computer Science",
    field: "Software Engineering",
    start: "2014",
    end: "2018",
    gpa: "3.8 / 4.0",
  },
];

export const experience = [
  {
    id: "x1",
    company: "Linear",
    role: "Senior Product Engineer",
    start: "Jan 2023",
    end: "Present",
    location: "Remote",
    description:
      "Lead frontend architecture for the core issue tracker, focusing on performance and delight.",
    achievements: [
      "Cut initial load time by 42% through streaming and route-level splitting",
      "Shipped the redesigned command menu used by 300k+ daily active users",
      "Mentored 4 engineers across two product pods",
    ],
  },
  {
    id: "x2",
    company: "Stripe",
    role: "Product Engineer",
    start: "Jun 2020",
    end: "Dec 2022",
    location: "San Francisco, CA",
    description: "Built merchant-facing dashboards for the Payments and Billing surfaces.",
    achievements: [
      "Owned the Billing revenue chart, driving a 12% increase in plan upgrades",
      "Introduced a shared charts library adopted across 6 teams",
    ],
  },
  {
    id: "x3",
    company: "Airbnb",
    role: "Software Engineering Intern",
    start: "May 2019",
    end: "Aug 2019",
    location: "San Francisco, CA",
    description: "Worked on the trust and safety review pipeline.",
    achievements: ["Reduced manual review queue by 18% through smarter batching"],
  },
];

export const projects = [
  {
    id: "p1",
    name: "Pilot Studio",
    description: "A collaborative resume editor with real-time preview and version history.",
    stack: ["TypeScript", "React", "TanStack", "Postgres"],
    github: "github.com/alexlarsen/pilot-studio",
    live: "pilot.studio",
    duration: "2024 · 6 mo",
    impact: "Adopted by 12k+ makers in the first quarter.",
    role: "Founding Engineer",
    achievements: ["Featured on Product Hunt #2 of the day"],
  },
  {
    id: "p2",
    name: "Signal Graph",
    description: "Static-site analytics without cookies, built for the Fediverse.",
    stack: ["Rust", "Cloudflare Workers", "DuckDB"],
    github: "github.com/alexlarsen/signal-graph",
    live: "signal.graph",
    duration: "2023 · 4 mo",
    impact: "Sub-50ms p95 across 40 regions.",
    role: "Creator",
    achievements: ["OSS · 3.4k stars"],
  },
  {
    id: "p3",
    name: "Fieldbook OS",
    description: "A quiet, keyboard-first note-taking app for engineers.",
    stack: ["Swift", "SwiftUI", "SQLite"],
    github: "github.com/alexlarsen/fieldbook",
    live: "",
    duration: "2022 · 3 mo",
    impact: "10k+ TestFlight users.",
    role: "Designer & Engineer",
    achievements: [],
  },
];

export const skills: Record<string, string[]> = {
  Frontend: ["React", "TypeScript", "Tailwind CSS", "TanStack", "Framer Motion", "Vite"],
  Backend: ["Node.js", "Bun", "Hono", "GraphQL", "REST"],
  Database: ["Postgres", "SQLite", "Redis", "Prisma", "Drizzle"],
  Cloud: ["Cloudflare", "AWS", "Vercel", "Fly.io"],
  Languages: ["TypeScript", "Rust", "Python", "Go", "Swift"],
  DevOps: ["Docker", "GitHub Actions", "Terraform", "Nix"],
  AI: ["OpenAI", "Anthropic", "LangChain", "Embeddings"],
  Tools: ["Figma", "Linear", "Notion", "Raycast"],
};

export const certificates = [
  {
    id: "c1",
    name: "AWS Certified Solutions Architect",
    issuer: "Amazon Web Services",
    date: "Mar 2024",
    credential: "AWS-SA-C03-0421",
  },
  {
    id: "c2",
    name: "Google Cloud Professional Cloud Architect",
    issuer: "Google Cloud",
    date: "Nov 2023",
    credential: "GCP-PCA-9932",
  },
  {
    id: "c3",
    name: "Advanced React Patterns",
    issuer: "Epic React",
    date: "Jul 2023",
    credential: "ER-APR-2231",
  },
];

export const achievements = [
  {
    id: "a1",
    title: "Speaker · React Conf 2024",
    context: "Talk on 'Latency Budgets for Product Engineers'",
    date: "May 2024",
  },
  {
    id: "a2",
    title: "1st place · Cal Hacks",
    context: "Built Signal Graph in 36 hours with a team of 3",
    date: "Oct 2022",
  },
  {
    id: "a3",
    title: "Dean's Honour List",
    context: "Top 5% of graduating class",
    date: "2018",
  },
];

export const resumeVault = [
  {
    company: "Microsoft",
    logo: "M",
    roles: [
      {
        role: "AI Engineer",
        versions: [
          {
            id: "v1",
            name: "Version 1 · Base",
            ats: 82,
            template: "Modern",
            date: "Mar 12, 2024",
            favorite: true,
          },
          {
            id: "v2",
            name: "Version 2 · Recruiter feedback",
            ats: 88,
            template: "Modern",
            date: "Mar 18, 2024",
            favorite: false,
          },
          {
            id: "v3",
            name: "Version 3 · Final",
            ats: 92,
            template: "Professional",
            date: "Mar 22, 2024",
            favorite: true,
          },
        ],
      },
      {
        role: "ML Platform Engineer",
        versions: [
          {
            id: "v4",
            name: "Version 1 · Draft",
            ats: 78,
            template: "Classic",
            date: "Apr 2, 2024",
            favorite: false,
          },
        ],
      },
    ],
  },
  {
    company: "Google",
    logo: "G",
    roles: [
      {
        role: "Frontend Engineer",
        versions: [
          {
            id: "v5",
            name: "Version 1 · Base",
            ats: 84,
            template: "Jake",
            date: "Feb 8, 2024",
            favorite: false,
          },
          {
            id: "v6",
            name: "Version 2 · Tailored",
            ats: 90,
            template: "Jake",
            date: "Feb 14, 2024",
            favorite: true,
          },
        ],
      },
    ],
  },
  {
    company: "Amazon",
    logo: "A",
    roles: [
      {
        role: "SDE II",
        versions: [
          {
            id: "v7",
            name: "Version 1",
            ats: 76,
            template: "Minimal",
            date: "Jan 30, 2024",
            favorite: false,
          },
          {
            id: "v8",
            name: "Version 2 · Leadership principles",
            ats: 89,
            template: "Corporate",
            date: "Feb 3, 2024",
            favorite: true,
          },
        ],
      },
    ],
  },
  {
    company: "Vercel",
    logo: "V",
    roles: [
      {
        role: "Solutions Engineer",
        versions: [
          {
            id: "v9",
            name: "Version 1",
            ats: 87,
            template: "Modern",
            date: "Apr 10, 2024",
            favorite: false,
          },
        ],
      },
    ],
  },
];

export const generationHistory = [
  { id: "h1", label: "Google · Frontend Engineer · v2", ats: 90, date: "2h ago" },
  { id: "h2", label: "Microsoft · AI Engineer · v3", ats: 92, date: "Yesterday" },
  { id: "h3", label: "Amazon · SDE II · v2", ats: 89, date: "3 days ago" },
  { id: "h4", label: "Vercel · Solutions Engineer · v1", ats: 87, date: "1 week ago" },
];

export const activityFeed = [
  {
    id: "af1",
    who: "You",
    what: "generated a resume for Google · Frontend",
    when: "2h ago",
    type: "generate",
  },
  {
    id: "af2",
    who: "CVPilot AI",
    what: "improved ATS score from 84 → 90",
    when: "2h ago",
    type: "ai",
  },
  { id: "af3", who: "You", what: "uploaded a new template", when: "Yesterday", type: "upload" },
  {
    id: "af4",
    who: "CVPilot AI",
    what: "found 3 keyword gaps in Amazon · SDE II",
    when: "3d ago",
    type: "ai",
  },
  {
    id: "af5",
    who: "You",
    what: "added Signal Graph to Projects",
    when: "1w ago",
    type: "profile",
  },
];

export const notifications = [
  {
    id: "n1",
    title: "Resume ready",
    body: "Google · Frontend Engineer v2 is ready to review.",
    when: "2h ago",
    unread: true,
  },
  {
    id: "n2",
    title: "ATS improvement",
    body: "Microsoft · AI Engineer v3 reached 92.",
    when: "Yesterday",
    unread: true,
  },
  {
    id: "n3",
    title: "New template",
    body: "Editorial template just landed in the gallery.",
    when: "2d ago",
    unread: false,
  },
  {
    id: "n4",
    title: "Weekly digest",
    body: "You generated 4 resumes this week.",
    when: "5d ago",
    unread: false,
  },
];

export const templates = [
  { id: "t1", name: "Modern", tag: "Popular", tone: "Balanced grid, generous whitespace." },
  { id: "t2", name: "Classic", tag: "Timeless", tone: "Serif-first, editorial rhythm." },
  { id: "t3", name: "Jake", tag: "Engineer favourite", tone: "Compact single-page density." },
  { id: "t4", name: "Professional", tag: "Executive", tone: "Confident header, quiet body." },
  { id: "t5", name: "Minimal", tag: "Quiet", tone: "One column, zero decoration." },
  { id: "t6", name: "Corporate", tag: "Consulting", tone: "Structured columns, formal tone." },
];

export const analyzerHistory = [
  { id: "ah1", name: "Google_Frontend_v2.pdf", ats: 90, date: "2h ago" },
  { id: "ah2", name: "Microsoft_AI_v3.pdf", ats: 92, date: "Yesterday" },
  { id: "ah3", name: "Amazon_SDE_v2.pdf", ats: 89, date: "3d ago" },
  { id: "ah4", name: "Vercel_SE_v1.pdf", ats: 87, date: "1w ago" },
];

export const workflowSteps = [
  { id: "s1", title: "Master Profile", detail: "Reading profile, projects and skills…" },
  { id: "s2", title: "Company Analysis", detail: "Researching company signals and tone." },
  {
    id: "s3",
    title: "Job Description Parser",
    detail: "Extracting responsibilities and requirements.",
  },
  { id: "s4", title: "Keyword Extraction", detail: "Identifying priority keywords and ranking." },
  { id: "s5", title: "Project Matching", detail: "Finding matching projects and impact metrics." },
  { id: "s6", title: "Experience Optimization", detail: "Optimizing bullet phrasing and verbs." },
  { id: "s7", title: "Resume Builder", detail: "Assembling sections and hierarchy." },
  { id: "s8", title: "LaTeX Generation", detail: "Compiling to typesetted PDF." },
  { id: "s9", title: "ATS Analysis", detail: "Scoring against ATS rubric." },
  { id: "s10", title: "Optimization Loop", detail: "Iteratively improving weak sections." },
  { id: "s11", title: "Resume Ready", detail: "Final resume is ready to download." },
];
