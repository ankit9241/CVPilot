import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  PlaneTakeoff,
  Sparkles,
  ScanSearch,
  Archive,
  Workflow,
  LayoutTemplate,
  FileText,
  Check,
  Star,
  Upload,
  Wand2,
  Cpu,
  Target,
  Shield,
  FileSearch,
  Zap,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/section-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { templates } from "@/constants/dummy-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CVPilot — AI-powered Resume Intelligence Platform" },
      {
        name: "description",
        content:
          "CVPilot is a calm, premium workspace to craft, analyse and manage every resume — tailored to every role.",
      },
      { property: "og:title", content: "CVPilot — Resume Intelligence" },
      {
        property: "og:description",
        content: "Craft, analyse and manage every resume in one quiet workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <Hero />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <WorkflowIllustration />
      <ATSSection />
      <AIFeatures />
      <TemplatesShowcase />
      <Testimonials />
      <FAQ />
      <Pricing />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <PlaneTakeoff className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">CVPilot</span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#templates" className="transition-colors hover:text-foreground">
            Templates
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild className="gap-1.5">
            <Link to="/onboarding">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent_70%)]" />
      <div className="container-page py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground shadow-subtle">
            <Sparkles className="h-3 w-3 text-primary" />
            Introducing CVPilot 1.0
          </span>
          <h1 className="mt-6 text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[60px]">
            Resume intelligence,
            <br />
            <span className="text-muted-foreground">quietly precise.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
            CVPilot is a calm, focused workspace to craft, analyse and manage every version of every
            resume — tailored to every role you go after.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="h-11 gap-1.5 px-5 text-[14px]">
              <Link to="/onboarding">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11 px-5 text-[14px]">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-5 text-[12px] text-muted-foreground">
            No credit card required · Free forever plan · SOC 2 ready
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="rounded-2xl border border-border bg-card p-2 shadow-lifted">
            <div className="rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="ml-3 text-[11px] text-muted-foreground">
                  cvpilot.io / dashboard
                </span>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-0">
                <div className="hidden border-r border-border p-4 sm:block">
                  <div className="space-y-1.5">
                    {[
                      "Dashboard",
                      "Profile",
                      "Resume Studio",
                      "Resume Analyzer",
                      "Resume Vault",
                    ].map((l, i) => (
                      <div
                        key={l}
                        className={
                          "rounded-md px-2 py-1.5 text-[11px] " +
                          (i === 0
                            ? "bg-card font-medium text-foreground shadow-subtle"
                            : "text-muted-foreground")
                        }
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-4 w-40 rounded-md bg-muted" />
                  <div className="mt-2 h-3 w-64 rounded-md bg-muted/70" />
                  <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 rounded-lg border border-border bg-card p-3">
                        <div className="h-2.5 w-16 rounded bg-muted" />
                        <div className="mt-3 h-4 w-10 rounded bg-muted/80" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-40 rounded-lg border border-border bg-card" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const logos = ["Linear", "Stripe", "Vercel", "Notion", "Framer", "Raycast"];
  return (
    <section className="border-b border-border py-14">
      <div className="container-page">
        <p className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Trusted by careful people at
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((l) => (
            <span
              key={l}
              className="text-[18px] font-semibold tracking-tight text-muted-foreground/70"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const featureItems = [
  {
    icon: FileText,
    title: "Resume Studio",
    desc: "A distraction-free, block-based editor with live preview.",
  },
  {
    icon: ScanSearch,
    title: "Resume Analyzer",
    desc: "Match resumes to roles with precise, actionable feedback.",
  },
  {
    icon: Archive,
    title: "Resume Vault",
    desc: "Every version of every resume — organised and searchable.",
  },
  {
    icon: Workflow,
    title: "Workflow",
    desc: "Visual pipelines that tailor, analyse and dispatch automatically.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates",
    desc: "ATS-friendly templates curated for every discipline.",
  },
  {
    icon: Sparkles,
    title: "AI Assist",
    desc: "Considered suggestions that respect your voice and story.",
  },
];

function Features() {
  return (
    <section id="features" className="border-b border-border py-24">
      <div className="container-page">
        <SectionHeader
          align="center"
          eyebrow="Platform"
          title="Everything a modern job search needs"
          description="Six calm surfaces that work in concert — from first draft to final send."
        />
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {featureItems.map((f) => (
            <div key={f.title} className="group bg-card p-7 transition-colors hover:bg-accent">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background text-primary transition-transform group-hover:-translate-y-0.5">
                <f.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "01",
    title: "Build your master profile",
    desc: "Once — every experience, project and skill in one place.",
  },
  {
    n: "02",
    title: "Paste a job description",
    desc: "CVPilot analyses tone, keywords and expectations.",
  },
  {
    n: "03",
    title: "Generate a tailored resume",
    desc: "A precise, ATS-ready resume in about 40 seconds.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="border-b border-border py-24">
      <div className="container-page">
        <SectionHeader
          align="center"
          eyebrow="How it works"
          title="Three quiet steps, endlessly repeatable"
        />
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-card p-7 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className="font-mono text-[12px] text-muted-foreground">{s.n}</span>
              <h3 className="mt-3 text-[16px] font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowIllustration() {
  const nodes = ["Profile", "JD Parse", "Keywords", "Match", "Optimize", "Build", "ATS", "Ready"];
  return (
    <section className="border-b border-border py-24">
      <div className="container-page">
        <SectionHeader
          align="center"
          eyebrow="Workflow"
          title="The pipeline behind every resume"
          description="A visual, node-based flow you can inspect, tweak and rerun."
        />
        <div className="mt-14 overflow-x-auto">
          <div className="mx-auto flex min-w-[720px] items-center justify-between gap-2 rounded-2xl border border-border bg-card p-6 shadow-subtle">
            {nodes.map((n, i) => (
              <div key={n} className="flex items-center gap-2">
                <div className="rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-medium shadow-subtle">
                  {n}
                </div>
                {i < nodes.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ATSSection() {
  return (
    <section className="border-b border-border py-24">
      <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            ATS
          </span>
          <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">
            Beat the bots
            <br />
            without sounding like one.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Every resume is scored against a real ATS rubric — keyword coverage, formatting, action
            verbs, quantification. You get the score and the exact edits to raise it.
          </p>
          <ul className="mt-6 space-y-3 text-[14px]">
            {[
              "Keyword match against the JD",
              "Structural formatting checks",
              "Verb & quantification hints",
              "Section coverage report",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2 text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-muted-foreground">ATS Score</div>
              <div className="mt-1 text-[44px] font-semibold tracking-tight">
                92<span className="text-[16px] text-muted-foreground">/100</span>
              </div>
            </div>
            <Shield className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[92%] rounded-full bg-primary" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-[12px]">
            {[
              { l: "Keywords", v: "94%" },
              { l: "Formatting", v: "100%" },
              { l: "Verbs", v: "88%" },
              { l: "Structure", v: "96%" },
            ].map((x) => (
              <div key={x.l} className="rounded-lg border border-border bg-background p-3">
                <div className="text-muted-foreground">{x.l}</div>
                <div className="mt-1 text-[16px] font-semibold">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const aiFeatures = [
  { icon: Wand2, t: "Tone-aware rewriting", d: "Match your voice to the company's culture." },
  { icon: Target, t: "Keyword targeting", d: "Weight the exact phrases the JD asks for." },
  { icon: Cpu, t: "Model-agnostic", d: "Bring your own model or use CVPilot's default." },
  {
    icon: FileSearch,
    t: "JD understanding",
    d: "Extracts requirements, nice-to-haves and signals.",
  },
  { icon: Zap, t: "40-second generation", d: "From click to compiled PDF in under a minute." },
  {
    icon: MessageSquare,
    t: "Suggestion inbox",
    d: "Accept, reject or edit each AI change explicitly.",
  },
];

function AIFeatures() {
  return (
    <section className="border-b border-border py-24">
      <div className="container-page">
        <SectionHeader
          align="center"
          eyebrow="AI"
          title="Assistance that respects your voice"
          description="Suggestions you can inspect. Nothing lands in your resume without your consent."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiFeatures.map((f) => (
            <div
              key={f.t}
              className="rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <f.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <h3 className="mt-4 text-[14px] font-semibold tracking-tight">{f.t}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplatesShowcase() {
  return (
    <section id="templates" className="border-b border-border py-24">
      <div className="container-page">
        <SectionHeader
          align="center"
          eyebrow="Templates"
          title="A quiet library of ATS-friendly designs"
          description="Six starting points. Every one editable, every one exportable to PDF."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.slice(0, 6).map((t) => (
            <div
              key={t.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="aspect-[3/4] border-b border-border bg-surface p-4">
                <div className="flex h-full flex-col rounded-md border border-border bg-background p-4">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="mt-1.5 h-2 w-20 rounded bg-muted/70" />
                  <div className="mt-4 space-y-1.5">
                    <div className="h-1.5 w-full rounded bg-muted/60" />
                    <div className="h-1.5 w-11/12 rounded bg-muted/60" />
                    <div className="h-1.5 w-9/12 rounded bg-muted/60" />
                  </div>
                  <div className="mt-4 h-2 w-24 rounded bg-muted" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 w-full rounded bg-muted/60" />
                    <div className="h-1.5 w-10/12 rounded bg-muted/60" />
                  </div>
                  <div className="mt-auto h-2 w-16 rounded bg-muted" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="text-[14px] font-semibold tracking-tight">{t.name}</h3>
                  <p className="text-[12px] text-muted-foreground">{t.tag}</p>
                </div>
                <Button size="sm" variant="outline" className="text-[12px]">
                  Preview
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const quotes = [
  {
    q: "It feels like Linear for job applications.",
    by: "Priya M.",
    role: "Product Designer, Figma",
  },
  {
    q: "The calmest resume tool I've ever used. The ATS scores are eerily accurate.",
    by: "Jordan K.",
    role: "Staff Engineer, Stripe",
  },
  {
    q: "Finally, a workspace that respects my attention. I ship 3× more applications.",
    by: "Mia T.",
    role: "PM, Ramp",
  },
  {
    q: "The workflow view is chef's kiss. I know exactly what the AI is doing.",
    by: "Sam O.",
    role: "Founding Engineer",
  },
  {
    q: "Templates are gorgeous and the vault keeps my career tidy.",
    by: "Isla R.",
    role: "Design Lead, Linear",
  },
  {
    q: "Went from 4 recruiter calls to 14 in a month. Not a placebo.",
    by: "Diego V.",
    role: "SDE, Amazon",
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="border-b border-border py-24">
      <div className="container-page">
        <SectionHeader
          align="center"
          eyebrow="Loved by careful people"
          title="Trusted by designers, engineers and operators"
        />
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((t) => (
            <figure
              key={t.by}
              className="rounded-2xl border border-border bg-card p-7 shadow-subtle transition-transform hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-[14px] leading-relaxed text-foreground">
                "{t.q}"
              </blockquote>
              <figcaption className="mt-5 text-[12px]">
                <span className="font-medium text-foreground">{t.by}</span>{" "}
                <span className="text-muted-foreground">· {t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Do I need to bring my own OpenAI key?",
    a: "No. CVPilot ships with a default model. You can bring your own key later if you prefer.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your profile and resumes are yours. We don't train on your data and you can export or delete anytime.",
  },
  {
    q: "Does the ATS score reflect real systems?",
    a: "It's benchmarked against Greenhouse, Lever, Workday and Ashby parsers. Not a perfect proxy, but close.",
  },
  {
    q: "Can I use my own templates?",
    a: "Yes. You can upload LaTeX or HTML templates and use them in the studio.",
  },
  {
    q: "Which file formats do you support?",
    a: "PDF, DOCX and LaTeX for input. PDF and LaTeX for output.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Free forever for 1 resume, basic analyzer and 5 templates.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="border-b border-border py-24">
      <div className="container-page">
        <SectionHeader align="center" eyebrow="FAQ" title="Answers to common questions" />
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-card px-6 shadow-subtle">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-[14px] font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Free",
    price: "$0",
    tag: "For getting started",
    features: ["1 resume", "Basic analyzer", "5 templates", "Community support"],
  },
  {
    name: "Pro",
    price: "$12",
    tag: "For active job seekers",
    features: [
      "Unlimited resumes",
      "Advanced analyzer",
      "All templates",
      "Workflows",
      "Priority support",
    ],
    featured: true,
  },
  {
    name: "Team",
    price: "$29",
    tag: "For career coaches",
    features: [
      "Everything in Pro",
      "Shared vault",
      "Roles & permissions",
      "SSO",
      "Custom branding",
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="border-b border-border py-24">
      <div className="container-page">
        <SectionHeader
          align="center"
          eyebrow="Pricing"
          title="Simple, predictable pricing"
          description="Start free. Upgrade only when CVPilot becomes indispensable."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                "rounded-2xl border p-7 shadow-subtle transition-transform hover:-translate-y-0.5 " +
                (p.featured ? "border-primary/40 bg-card shadow-soft" : "border-border bg-card")
              }
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold tracking-tight">{p.name}</h3>
                {p.featured && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{p.tag}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-[36px] font-semibold tracking-tight">{p.price}</span>
                <span className="text-[13px] text-muted-foreground">/ month</span>
              </div>
              <Button
                className="mt-6 h-10 w-full text-[13px]"
                variant={p.featured ? "default" : "outline"}
                asChild
              >
                <Link to="/onboarding">Choose {p.name}</Link>
              </Button>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-b border-border py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 text-center shadow-soft sm:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent_60%)]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-[30px] font-semibold leading-tight tracking-tight sm:text-[40px]">
              Bring calm precision to your career.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              Join thousands of thoughtful professionals who trust CVPilot with their next move.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="h-11 gap-1.5 px-5 text-[14px]">
                <Link to="/onboarding">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11 px-5 text-[14px]">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="py-12">
      <div className="container-page grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr]">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <PlaneTakeoff className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">CVPilot</span>
          </Link>
          <p className="mt-4 max-w-sm text-[13px] text-muted-foreground">
            AI-powered resume intelligence, quietly precise.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-[13px] sm:grid-cols-4">
          {[
            { h: "Product", i: ["Features", "Pricing", "Templates", "Changelog"] },
            { h: "Company", i: ["About", "Careers", "Contact", "Press"] },
            { h: "Resources", i: ["Blog", "Guides", "Support", "Status"] },
            { h: "Legal", i: ["Privacy", "Terms", "Security", "DPA"] },
          ].map((c) => (
            <div key={c.h}>
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                {c.h}
              </div>
              <ul className="mt-3 space-y-2">
                {c.i.map((x) => (
                  <li key={x}>
                    <a
                      href="#"
                      className="text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="container-page mt-10 border-t border-border pt-6 text-[12px] text-muted-foreground">
        © {new Date().getFullYear()} CVPilot. All rights reserved.
      </div>
    </footer>
  );
}
