import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
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
  Wand2,
  Cpu,
  Target,
  Shield,
  FileSearch,
  Zap,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { InfiniteSlider } from "@/components/shared/infinite-slider";

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
    <div className="w-full min-h-screen bg-[#F8F6F3] text-[#18181B] font-sans selection:bg-[#18181B]/10 overflow-x-hidden flex flex-col justify-start items-center">
      {/* Outer grid boundary frame matching Brilliance SaaS editorial layout */}
      <div className="w-full max-w-[1140px] px-3 sm:px-6 lg:px-8 relative flex flex-col min-h-screen border-l border-r border-[rgba(55,50,47,0.10)] bg-[#F8F6F3]">
        <SiteNav />
        <main className="w-full flex flex-col">
          <Hero />
          <TickerMarquee />
          <OperationsSection />
          <Features />
          <ArchitecturePipelineBentoSection />
          <ATSSection />
          <AIFeatures />
          <TestimonialsCarousel />
          <FAQ />
          <BrilliancePricing />
          <CTA />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-3 sm:top-4 z-50 w-full flex justify-center items-center py-2">
      <div className="w-full max-w-[760px] h-12 sm:h-14 px-3.5 sm:px-6 bg-[#FFFEFC]/90 backdrop-blur-md border border-[rgba(55,50,47,0.12)] shadow-[0px_4px_20px_rgba(0,0,0,0.03),0px_0px_0px_2px_white] rounded-full flex justify-between items-center transition-all duration-300">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-[#18181B] text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
            <PlaneTakeoff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
          <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#18181B]">CVPilot</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[13px] font-medium text-[#18181B]/70 md:flex">
          <a href="#features" className="transition-colors hover:text-[#18181B]">
            Features
          </a>
          <a href="#how" className="transition-colors hover:text-[#18181B]">
            Architecture
          </a>
          <a href="#pricing" className="transition-colors hover:text-[#18181B]">
            Pricing
          </a>
          <a href="#faq" className="transition-colors hover:text-[#18181B]">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex px-3 py-1.5 text-[13px] font-medium text-[#18181B]/80 hover:text-[#18181B] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-1.5 bg-[#18181B] text-white rounded-full text-[12px] sm:text-[13px] font-medium shadow-xs hover:bg-[#27272A] transition-all hover:scale-[1.02]"
          >
            Get started <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-12 pb-12 sm:pt-20 sm:pb-16 lg:pt-28 lg:pb-24 border-b border-[rgba(55,50,47,0.08)] overflow-hidden">
      <div className="mx-auto max-w-4xl text-center px-2 sm:px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center relative"
        >
          <h1 className="mt-5 sm:mt-7 font-serif text-[34px] xs:text-[44px] sm:text-[68px] lg:text-[80px] font-normal leading-[1.1] sm:leading-[1.08] tracking-tight text-[#18181B]">
            Resume intelligence,
            <br />
            <span className="text-[#18181B]/60 italic font-serif">quietly precise.</span>
          </h1>

          <p className="mt-4 sm:mt-6 max-w-xl text-[14px] sm:text-[18px] leading-relaxed text-[#18181B]/70 font-sans px-2">
            Streamline your resume creation with seamless AI automation for every job application, tailored by CVPilot.
          </p>

          {/* Glow effect container behind CTA button */}
          <div className="relative mt-7 sm:mt-9 flex flex-col items-center justify-center w-full sm:w-auto px-4">
            {/* Ambient warm radial glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[450px] h-[140px] sm:h-[180px] ambient-glow pointer-events-none rounded-full blur-xl -z-10" />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto relative z-10">
              <Link
                to="/onboarding"
                className="w-full sm:w-auto h-11 sm:h-12 px-8 bg-[#37322F] text-white rounded-full inline-flex items-center justify-center gap-2 text-sm font-medium shadow-[0px_4px_20px_rgba(55,50,47,0.25)] hover:bg-[#282422] transition-all hover:scale-[1.02]"
              >
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto h-11 sm:h-12 px-7 bg-white border border-[rgba(55,50,47,0.14)] text-[#18181B] rounded-full inline-flex items-center justify-center text-sm font-medium shadow-xs hover:bg-[#F4F1EC] transition-all"
              >
                Sign in
              </Link>
            </div>
          </div>

          <p className="mt-4 sm:mt-5 text-[11px] sm:text-[12px] text-[#18181B]/50 font-medium">
            No credit card required · Free forever plan · SOC 2 ready
          </p>
        </motion.div>

        {/* Mask Group Pattern Overlay (hidden on small mobile to avoid overflow and lag) */}
        <div className="hidden sm:block absolute top-[290px] md:top-[320px] lg:top-[350px] left-1/2 -translate-x-1/2 pointer-events-none z-0">
          <img
            src="/mask-group-pattern.svg"
            alt="Hero Grid Pattern"
            className="w-[1000px] md:w-[1800px] lg:w-[2400px] max-w-none h-auto opacity-40 mix-blend-multiply"
            style={{
              filter: "hue-rotate(15deg) saturate(0.7) brightness(1.2)",
            }}
          />
        </div>

        {/* Live Interface Preview Frame */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mt-10 sm:mt-14 max-w-4xl relative z-10"
        >
          <div className="rounded-[18px] sm:rounded-[22px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-2 sm:p-2.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.06)]">
            <div className="rounded-[14px] sm:rounded-[16px] border border-[rgba(55,50,47,0.08)] bg-[#F8F6F3] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[rgba(55,50,47,0.08)] px-3 sm:px-4 py-2.5 sm:py-3 bg-[#F4F1EC]/60">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#18181B]/20" />
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#18181B]/20" />
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#18181B]/20" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono text-[#18181B]/50">
                  cvpilot.io / workspace
                </span>
                <div className="h-2 w-10 sm:w-12 rounded-full bg-[#18181B]/10" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-0 min-h-[220px] sm:min-h-[280px]">
                <div className="hidden border-r border-[rgba(55,50,47,0.08)] p-4 sm:block bg-[#F8F6F3]">
                  <div className="space-y-1.5">
                    {[
                      "Dashboard",
                      "Master Profile",
                      "Resume Studio",
                      "ATS Analyzer",
                      "Resume Vault",
                    ].map((l, i) => (
                      <div
                        key={l}
                        className={
                          "rounded-lg px-3 py-2 text-[12px] font-medium transition-colors " +
                          (i === 0
                            ? "bg-[#FFFEFC] text-[#18181B] shadow-xs border border-[rgba(55,50,47,0.08)]"
                            : "text-[#18181B]/60 hover:text-[#18181B]")
                        }
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 sm:p-6 bg-[#FFFEFC]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-3.5 sm:h-4 w-32 sm:w-44 rounded bg-[#18181B]/10" />
                      <div className="mt-1.5 sm:mt-2 h-2.5 sm:h-3 w-48 sm:w-64 rounded bg-[#18181B]/5" />
                    </div>
                    <div className="h-6 sm:h-7 w-20 sm:w-24 rounded-full bg-[#18181B] opacity-80" />
                  </div>
                  <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                    {[
                      { title: "ATS Score", val: "94/100" },
                      { title: "Active Versions", val: "8 Resumes" },
                      { title: "Target Role", val: "Staff Designer" },
                      { title: "Tailored Speed", val: "38 seconds" },
                    ].map((card, i) => (
                      <div key={i} className="rounded-xl border border-[rgba(55,50,47,0.08)] bg-[#F8F6F3] p-2.5 sm:p-3.5">
                        <div className="text-[10px] sm:text-[11px] text-[#18181B]/60 font-medium">{card.title}</div>
                        <div className="mt-1 sm:mt-2 font-serif text-base sm:text-lg font-medium text-[#18181B]">{card.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TickerMarquee() {
  const stats = [
    { value: "100%", label: "ATS Score Accuracy", dept: "EVALUATION" },
    { value: "< 40s", label: "Tailoring Speed", dept: "INTELLIGENCE" },
    { value: "Zero", label: "AI Hallucination", dept: "PRECISION" },
    { value: "SOC 2", label: "Vault Security", dept: "PRIVACY" },
    { value: "PDF & TeX", label: "Export Formats", dept: "COMPLETENESS" },
  ];

  return (
    <div className="relative border-b border-[rgba(55,50,47,0.08)] bg-[#F4F1EC]/60 py-5 sm:py-7 select-none overflow-hidden">
      <div className="w-full relative overflow-hidden">
        <InfiniteSlider speed={35} gap={48}>
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3 sm:gap-4 whitespace-nowrap">
              <span className="font-serif text-2xl sm:text-4xl font-normal text-[#18181B] tracking-tight">
                {stat.value}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#18181B]/60 uppercase tracking-widest font-mono">
                {stat.label}
                <span className="block text-[8px] sm:text-[9px] text-[#18181B]/40 mt-0.5 font-sans">
                  {stat.dept}
                </span>
              </span>
            </div>
          ))}
        </InfiniteSlider>

        {/* Fade gradient edges */}
        <div className="bg-gradient-to-r from-[#F8F6F3] to-transparent absolute inset-y-0 left-0 w-12 sm:w-20 pointer-events-none z-10" />
        <div className="bg-gradient-to-l from-[#F8F6F3] to-transparent absolute inset-y-0 right-0 w-12 sm:w-20 pointer-events-none z-10" />
      </div>
    </div>
  );
}

/* Interactive Split Operations Section with Mobile Optimization */
function OperationsSection() {
  const [activeCard, setActiveCard] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveCard((curr) => (curr + 1) % 3);
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const featureTabs = [
    {
      title: "Plan your schedules",
      desc: "Explore your data, build your master profile, and bring your career history together.",
    },
    {
      title: "Data to insights in minutes",
      desc: "Transform raw job descriptions into actionable keyword coverage with AI analytics.",
    },
    {
      title: "Collaborate seamlessly",
      desc: "Work together in real-time with AI suggestions, live LaTeX, and PDF previews.",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="border-b border-[rgba(55,50,47,0.08)] py-14 sm:py-20 bg-[#F8F6F3]"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-4 text-center">
        <h2 className="font-serif text-[28px] xs:text-[34px] sm:text-[50px] font-normal leading-tight text-[#37322F]">
          Streamline your resume operations
        </h2>
        <p className="mt-2.5 sm:mt-3 text-[14px] sm:text-[17px] text-[#605A57] max-w-xl mx-auto font-sans px-2">
          Manage master profiles, analyze ATS data, and tailor resumes with your team all in one powerful platform.
        </p>

        {/* Split Container */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-4 sm:gap-6 items-stretch border border-[rgba(55,50,47,0.12)] rounded-[18px] sm:rounded-[20px] bg-[#FFFEFC] p-2.5 sm:p-3 shadow-soft overflow-hidden">
          {/* Left Cards List */}
          <div className="flex flex-col justify-between gap-2.5 sm:gap-3 p-1 sm:p-3">
            {featureTabs.map((tab, idx) => {
              const isActive = activeCard === idx;
              return (
                <div
                  key={tab.title}
                  onClick={() => {
                    setActiveCard(idx);
                    setProgress(0);
                  }}
                  className={`cursor-pointer rounded-xl p-4 sm:p-5 border text-left transition-all duration-300 relative overflow-hidden ${isActive
                      ? "bg-[#F8F6F3] border-[rgba(55,50,47,0.16)] shadow-xs"
                      : "bg-transparent border-transparent hover:bg-[#F8F6F3]/50"
                    }`}
                >
                  <h3 className="text-[15px] sm:text-[16px] font-semibold text-[#37322F] tracking-tight">
                    {tab.title}
                  </h3>
                  <p className="mt-1 sm:mt-1.5 text-[12px] sm:text-[13px] leading-relaxed text-[#605A57]">
                    {tab.desc}
                  </p>

                  {/* Active Progress Bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[rgba(55,50,47,0.10)]">
                      <div
                        className="h-full bg-[#37322F] transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Visual Panel with Motion (Hidden on small screens to keep mobile light & uncluttered) */}
          <div className="hidden sm:flex rounded-xl border border-[rgba(55,50,47,0.10)] bg-[#F0FDF4]/70 p-6 min-h-[300px] sm:min-h-[380px] flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center z-10">
              <span className="text-[11px] font-mono uppercase bg-emerald-700/10 text-emerald-800 px-3 py-1 rounded-full font-medium">
                {activeCard === 0 && "Master Profile Engine"}
                {activeCard === 1 && "ATS Match Matrix"}
                {activeCard === 2 && "Live TeX & PDF Preview"}
              </span>
              <span className="text-[12px] font-mono text-[#37322F]/50">CVPilot v1.0</span>
            </div>

            <div className="my-auto py-8 text-center relative z-10">
              <AnimatePresence mode="wait">
                {activeCard === 0 && (
                  <motion.div
                    key="card0"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 max-w-md mx-auto bg-white/80 p-6 rounded-2xl border border-emerald-900/10 shadow-xs"
                  >
                    <div className="flex justify-between text-xs font-medium text-emerald-900">
                      <span>Master Experience Blocks</span>
                      <span>14 Entries</span>
                    </div>
                    <div className="h-2 bg-emerald-200/60 rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-emerald-600 rounded-full" />
                    </div>
                    <p className="text-[12px] text-emerald-800/80">Categorized by Leadership, Systems Architecture, and Quantified Results</p>
                  </motion.div>
                )}

                {activeCard === 1 && (
                  <motion.div
                    key="card1"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 max-w-md mx-auto bg-white/80 p-6 rounded-2xl border border-emerald-900/10 shadow-xs"
                  >
                    <div className="font-serif text-3xl font-medium text-emerald-950">94% Keyword Coverage</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200/50 text-emerald-900 font-medium">React / TypeScript</div>
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200/50 text-emerald-900 font-medium">Distributed Systems</div>
                    </div>
                  </motion.div>
                )}

                {activeCard === 2 && (
                  <motion.div
                    key="card2"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 max-w-md mx-auto bg-white/80 p-6 rounded-2xl border border-emerald-900/10 shadow-xs text-left"
                  >
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-900 border-b border-emerald-100 pb-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Realtime PDF Compilation</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-800/80 bg-emerald-950/5 p-3 rounded-lg">
                      \documentclass&#123;article&#125;<br />
                      \begin&#123;document&#125;<br />
                      \textbf&#123;Senior Software Engineer&#125;<br />
                      \end&#123;document&#125;
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-right text-[11px] text-[#37322F]/50 font-mono z-10">
              Interactive Preview Surface
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

const featureItems = [
  {
    icon: FileText,
    title: "Resume Studio",
    desc: "A distraction-free, block-based editor with live PDF and LaTeX preview.",
  },
  {
    icon: ScanSearch,
    title: "Resume Analyzer",
    desc: "Match resumes to roles with precise, actionable ATS rubric feedback.",
  },
  {
    icon: Archive,
    title: "Resume Vault",
    desc: "Every version of every resume — organised, version-tracked and searchable.",
  },
  {
    icon: Workflow,
    title: "Workflow Engine",
    desc: "Visual pipelines that tailor, analyse and dispatch automatically.",
  },
  {
    icon: LayoutTemplate,
    title: "Editorial Templates",
    desc: "ATS-friendly templates curated for every engineering and design discipline.",
  },
  {
    icon: Sparkles,
    title: "AI Precision Assist",
    desc: "Considered suggestions that respect your voice, metrics and career story.",
  },
];

function Features() {
  return (
    <motion.section
      id="features"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="border-b border-[rgba(55,50,47,0.08)] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-4">
        <SectionHeader
          align="center"
          eyebrow="Platform Surfaces"
          title="Everything a modern job search needs"
          description="Six calm surfaces that work in concert — from initial draft to final application send."
        />
        <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureItems.map((f) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -4 }}
              className="group rounded-[18px] sm:rounded-[20px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-6 sm:p-7 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-[rgba(55,50,47,0.12)] bg-[#F8F6F3] text-[#18181B] transition-transform group-hover:scale-105">
                <f.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 sm:mt-5 text-[16px] sm:text-[17px] font-medium tracking-tight text-[#18181B] font-sans">{f.title}</h3>
              <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[14px] leading-relaxed text-[#18181B]/70">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* Consolidated Master Section: Architecture, Workflow & Bento Grid */
function ArchitecturePipelineBentoSection() {
  const steps = [
    {
      n: "01",
      title: "Build your Master Profile Vault",
      desc: "Store your career history, achievements, and technical metrics once in a decoupled, reusable structure.",
    },
    {
      n: "02",
      title: "Parse & Weight Target Role JDs",
      desc: "CVPilot analyzes target job descriptions for technical keywords, ATS rubric rules, and hiring signals.",
    },
    {
      n: "03",
      title: "Generate Tailored Resume & PDF",
      desc: "AI produces an ATS-verified, beautifully formatted resume compiled to PDF and LaTeX in under 40 seconds.",
    },
  ];

  const pipelineNodes = [
    "Profile Vault",
    "JD Parsing",
    "Keyword Weighting",
    "Rubric Match",
    "AI Tailoring",
    "LaTeX Build",
    "ATS Check",
    "Export PDF",
  ];

  const bentoCards = [
    {
      title: "Structured Master Profile Vault",
      desc: "Keep all your career history, metrics, and bullet points organized in one place. Decoupled from formatting so you can generate tailored resumes endlessly.",
      span: "md:col-span-2",
    },
    {
      title: "Precision ATS Rubric Match",
      desc: "Instant evaluation against Greenhouse, Lever, Ashby, and Workday parsing systems with actionable fix recommendations.",
      span: "md:col-span-1",
    },
    {
      title: "Instant TeX & PDF Compiler",
      desc: "Side-by-side raw LaTeX editor with instant 60fps PDF compilation and clean editorial typography.",
      span: "md:col-span-1",
    },
    {
      title: "Tone-Aware AI Co-Pilot Control",
      desc: "Inspect, accept, or reject every AI suggestion explicitly. Maintain total authorship and authentic tone over your career story.",
      span: "md:col-span-2",
    },
  ];

  return (
    <motion.section
      id="how"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="border-b border-[rgba(55,50,47,0.08)] py-16 sm:py-24 bg-[#F8F6F3]"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-4 text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 bg-white border border-[rgba(55,50,47,0.12)] rounded-full shadow-xs text-[11px] sm:text-xs font-medium text-[#37322F] mb-4 sm:mb-5">
          <Workflow className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-[#37322F]" />
          <span>End-to-End Architecture & Workflow</span>
        </div>

        <h2 className="font-serif text-[32px] xs:text-[40px] sm:text-[56px] font-normal leading-[1.1] sm:leading-[1.08] text-[#37322F] tracking-tight max-w-3xl mx-auto">
          The Architecture Behind Every Resume
        </h2>
        <p className="mt-3 sm:mt-4 text-[14px] sm:text-[18px] text-[#605A57] max-w-2xl mx-auto font-sans leading-relaxed px-2">
          From master profile indexing to AI keyword optimization and real-time PDF compilation — inspect, tweak, and automate every step.
        </p>

        {/* 1. Step-by-Step Architecture Pipeline */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 text-left">
          {steps.map((s) => (
            <motion.div
              key={s.n}
              whileHover={{ y: -4 }}
              className="rounded-[18px] sm:rounded-[20px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-6 sm:p-8 shadow-xs hover:shadow-soft transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <span className="font-serif text-3xl sm:text-4xl font-normal text-[#37322F]/40">{s.n}</span>
                <h3 className="mt-3 sm:mt-4 text-[16px] sm:text-[18px] font-medium tracking-tight text-[#37322F] font-serif">{s.title}</h3>
                <p className="mt-2 text-[13px] sm:text-[14px] leading-relaxed text-[#605A57]">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 2. Interactive Pipeline Node Flow (Scrollable or hidden on mobile to avoid clutter) */}
        <div className="hidden sm:block mt-10 overflow-x-auto pb-2">
          <div className="mx-auto flex min-w-[760px] items-center justify-between gap-3 rounded-[20px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 shadow-xs">
            {pipelineNodes.map((node, i) => (
              <div key={node} className="flex items-center gap-2.5">
                <div className="rounded-xl border border-[rgba(55,50,47,0.12)] bg-[#F8F6F3] px-3.5 py-2 text-[12px] font-medium text-[#37322F] shadow-xs">
                  {node}
                </div>
                {i < pipelineNodes.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-[#37322F]/40 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Detailed Bento Grid Feature Blocks */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
          {bentoCards.map((bento, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className={`${bento.span} rounded-[18px] sm:rounded-[20px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-6 sm:p-8 shadow-xs hover:shadow-soft transition-all duration-300 flex flex-col justify-between`}
            >
              <div>
                <h3 className="text-[18px] sm:text-[20px] font-medium text-[#37322F] font-serif tracking-tight">
                  {bento.title}
                </h3>
                <p className="mt-2 text-[13px] sm:text-[14px] leading-relaxed text-[#605A57]">
                  {bento.desc}
                </p>
              </div>
              <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-[rgba(55,50,47,0.06)] flex items-center justify-between text-[11px] sm:text-xs font-mono text-[#37322F]/50">
                <span>0{i + 1} / Capability System</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#37322F]/40" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function ATSSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="border-b border-[rgba(55,50,47,0.08)] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-4 grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2">
        <div>
          <span className="editorial-pill">
            ATS Evaluation
          </span>
          <h2 className="mt-4 sm:mt-5 font-serif text-[28px] xs:text-[34px] sm:text-[46px] font-normal leading-[1.1] tracking-tight text-[#18181B]">
            Beat the bots
            <br />
            <span className="text-[#18181B]/60 italic">without sounding like one.</span>
          </h2>
          <p className="mt-3 sm:mt-4 text-[14px] sm:text-[16px] leading-relaxed text-[#18181B]/70">
            Every resume is scored against a real ATS rubric — keyword coverage, formatting, action
            verbs, and quantitative impact. You get the exact score and actionable edits to raise it.
          </p>
          <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-[13px] sm:text-[14px]">
            {[
              "Keyword match against the JD",
              "Structural formatting & layout checks",
              "Action verb & metric quantification hints",
              "Complete section coverage report",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2.5 text-[#18181B]/80 font-medium">
                <Check className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#18181B]" /> {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[18px] sm:rounded-[22px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 sm:p-7 shadow-soft">
          <div className="flex items-center justify-between border-b border-[rgba(55,50,47,0.08)] pb-4 sm:pb-5">
            <div>
              <div className="text-[11px] sm:text-[12px] font-medium text-[#18181B]/50 font-mono uppercase">ATS Compatibility Score</div>
              <div className="mt-1 font-serif text-[42px] sm:text-[52px] font-normal tracking-tight text-[#18181B]">
                92<span className="text-[16px] sm:text-[18px] font-sans text-[#18181B]/50">/100</span>
              </div>
            </div>
            <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full bg-[#18181B] text-white">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 sm:mt-5 h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-[#F4F1EC]">
            <div className="h-full w-[92%] rounded-full bg-[#18181B]" />
          </div>
          <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 text-[12px] sm:text-[13px]">
            {[
              { l: "Keywords", v: "94%" },
              { l: "Formatting", v: "100%" },
              { l: "Verbs", v: "88%" },
              { l: "Structure", v: "96%" },
            ].map((x) => (
              <div key={x.l} className="rounded-xl border border-[rgba(55,50,47,0.08)] bg-[#F8F6F3] p-3 sm:p-3.5">
                <div className="text-[#18181B]/60 text-[11px] sm:text-[12px] font-medium">{x.l}</div>
                <div className="mt-1 text-[16px] sm:text-[18px] font-serif font-medium text-[#18181B]">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

const aiFeatures = [
  { icon: Wand2, t: "Tone-aware rewriting", d: "Match your voice perfectly to the target company's culture." },
  { icon: Target, t: "Keyword targeting", d: "Weight the exact technical skills and domain phrases the JD demands." },
  { icon: Cpu, t: "Model-agnostic", d: "Bring your own LLM API key or use CVPilot's optimized default." },
  {
    icon: FileSearch,
    t: "JD understanding",
    d: "Deeply parses requirements, nice-to-haves and hiring signals.",
  },
  { icon: Zap, t: "40-second generation", d: "From initial click to fully compiled PDF resume in under a minute." },
  {
    icon: MessageSquare,
    t: "Suggestion inbox",
    d: "Accept, reject or edit each AI recommendation with full control.",
  },
];

function AIFeatures() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="border-b border-[rgba(55,50,47,0.08)] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-4">
        <SectionHeader
          align="center"
          eyebrow="Intelligence Layer"
          title="Assistance that respects your voice"
          description="Suggestions you can inspect. Nothing enters your resume without explicit consent."
        />
        <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {aiFeatures.map((f) => (
            <motion.div
              key={f.t}
              whileHover={{ y: -4 }}
              className="rounded-[18px] sm:rounded-[20px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-6 sm:p-7 shadow-xs hover:shadow-soft transition-all duration-300"
            >
              <f.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#18181B]" strokeWidth={1.5} />
              <h3 className="mt-3.5 sm:mt-4 text-[15px] sm:text-[16px] font-medium tracking-tight text-[#18181B]">{f.t}</h3>
              <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[14px] leading-relaxed text-[#18181B]/70">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* Enhanced Testimonial Carousel with Mobile Responsiveness */
function TestimonialsCarousel() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const testimonials = [
    {
      quote:
        "In just a few minutes, we transformed our data into actionable insights. The process was seamless and incredibly efficient!",
      name: "Jamie Marshall",
      company: "Co-founder, Exponent",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202025%2C%2011_35_19%20AM-z4zSRLsbOQDp7MJS1t8EXmGNB6Al9Z.png",
    },
    {
      quote:
        "CVPilot has revolutionized how we handle custom contracts. The automation saves us hours every week and eliminates errors completely.",
      name: "Sarah Chen",
      company: "VP Operations, TechFlow",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202025%2C%2010_54_18%20AM-nbiecp92QNdTudmCrHr97uekrIPzCP.png",
    },
    {
      quote:
        "The resume tailoring automation is a game-changer. What used to take our candidates days now happens automatically with perfect accuracy.",
      name: "Marcus Rodriguez",
      company: "Finance Director, InnovateCorp",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202025%2C%2011_01_05%20AM-TBOe92trRxKn4G5So1m9D2h7LRH4PG.png",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 300);
    }, 12000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleNavigationClick = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTestimonial(index);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 300);
  };

  const handlePrev = () => {
    const nextIdx = activeTestimonial === 0 ? testimonials.length - 1 : activeTestimonial - 1;
    handleNavigationClick(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (activeTestimonial + 1) % testimonials.length;
    handleNavigationClick(nextIdx);
  };

  const current = testimonials[activeTestimonial];

  return (
    <motion.section
      id="testimonials"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="border-b border-[rgba(55,50,47,0.08)] py-16 sm:py-20 bg-[#F8F6F3]"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-4">
        <div className="border border-[rgba(55,50,47,0.12)] rounded-[20px] sm:rounded-[24px] bg-[#FFFEFC] p-6 sm:p-12 shadow-soft flex flex-col md:flex-row items-center gap-6 md:gap-12 relative overflow-hidden">
          {/* Left Avatar Image */}
          <div className="w-32 h-36 sm:w-48 sm:h-52 md:w-52 md:h-56 shrink-0 relative overflow-hidden rounded-xl sm:rounded-2xl border border-[rgba(55,50,47,0.12)] shadow-xs">
            <img
              src={current.image}
              alt={current.name}
              className="w-full h-full object-cover transition-all duration-700 ease-in-out"
              style={{
                opacity: isTransitioning ? 0.6 : 1,
                transform: isTransitioning ? "scale(0.95)" : "scale(1)",
              }}
            />
          </div>

          {/* Right Quote Content */}
          <div className="flex-1 flex flex-col justify-between h-full text-center md:text-left min-h-[180px] sm:min-h-[220px]">
            <div>
              <blockquote
                className="font-serif text-[20px] xs:text-[24px] sm:text-[34px] font-normal leading-[1.3] text-[#37322F] tracking-tight transition-all duration-700 ease-in-out"
                style={{
                  filter: isTransitioning ? "blur(4px)" : "blur(0px)",
                }}
              >
                "{current.quote}"
              </blockquote>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-[15px] sm:text-[16px] font-medium text-[#37322F]">{current.name}</div>
                <div className="text-[12px] sm:text-[13px] text-[#605A57] mt-0.5">{current.company}</div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[rgba(55,50,47,0.14)] bg-white flex items-center justify-center text-[#37322F] hover:bg-[#F4F1EC] transition-colors shadow-xs"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[rgba(55,50,47,0.14)] bg-white flex items-center justify-center text-[#37322F] hover:bg-[#F4F1EC] transition-colors shadow-xs"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

const faqs = [
  {
    q: "Do I need to bring my own OpenAI key?",
    a: "No. CVPilot ships with a default model. You can bring your own API key anytime if you prefer.",
  },
  {
    q: "Is my personal data private?",
    a: "Yes. Your profile and resumes belong entirely to you. We do not train on your data, and you can export or delete anytime.",
  },
  {
    q: "Does the ATS score reflect real ATS parsers?",
    a: "It's benchmarked against Greenhouse, Lever, Workday, and Ashby parsers for precise structure and keyword evaluation.",
  },
  {
    q: "Can I edit and export LaTeX code directly?",
    a: "Yes. CVPilot includes a full LaTeX editor with instant side-by-side PDF preview.",
  },
  {
    q: "Which file formats do you support?",
    a: "PDF, DOCX and JSON for input. High-resolution PDF and raw TeX for output.",
  },
  {
    q: "Is there a free plan available?",
    a: "Yes. Free forever for 1 resume, basic ATS analyzer, and 5 templates.",
  },
];

function FAQ() {
  return (
    <motion.section
      id="faq"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="border-b border-[rgba(55,50,47,0.08)] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-4xl px-3 sm:px-4">
        <SectionHeader align="center" eyebrow="Frequently Asked Questions" title="Answers to common questions" />
        <div className="mt-8 sm:mt-12 rounded-[18px] sm:rounded-[22px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] px-5 sm:px-8 py-3 sm:py-4 shadow-xs">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-[rgba(55,50,47,0.08)] py-1">
                <AccordionTrigger className="text-[14px] sm:text-[15px] font-medium text-[#18181B] hover:no-underline text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[13px] sm:text-[14px] leading-relaxed text-[#18181B]/70">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </motion.section>
  );
}

/* Brilliance SaaS Pricing Grid with Mobile Optimization */
function BrilliancePricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("annually");

  return (
    <motion.section
      id="pricing"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="border-b border-[rgba(55,50,47,0.08)] py-16 sm:py-20 bg-[#F8F6F3]"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-4 text-center">
        <SectionHeader
          align="center"
          eyebrow="Plans & Pricing"
          title="Choose the perfect plan for your career"
          description="Scale your job application velocity with flexible pricing. Start free, upgrade when you're ready."
        />

        {/* Annually / Monthly Toggle */}
        <div className="mt-8 sm:mt-12 relative flex justify-center items-center py-3 sm:py-4">
          <div className="w-full h-0 absolute left-0 top-1/2 border-t border-[rgba(55,50,47,0.12)] z-0" />

          <div className="relative z-10 bg-[#FFFEFC] border border-[rgba(55,50,47,0.12)] p-1 rounded-full shadow-xs flex items-center gap-1">
            <button
              onClick={() => setBillingPeriod("annually")}
              className={`px-4 sm:px-5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all ${billingPeriod === "annually"
                  ? "bg-[#37322F] text-white shadow-xs"
                  : "text-[#605A57] hover:text-[#37322F]"
                }`}
            >
              Annually
            </button>
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 sm:px-5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all ${billingPeriod === "monthly"
                  ? "bg-[#37322F] text-white shadow-xs"
                  : "text-[#605A57] hover:text-[#37322F]"
                }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* 3-Column Pricing Layout */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 border border-[rgba(55,50,47,0.12)] rounded-[18px] sm:rounded-[20px] bg-[#FFFEFC] overflow-hidden shadow-soft text-left">
          {/* Card 1: Starter */}
          <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-[rgba(55,50,47,0.12)] flex flex-col justify-between bg-white">
            <div>
              <h3 className="text-[18px] sm:text-[20px] font-medium text-[#37322F] font-sans">Starter</h3>
              <p className="mt-1 text-[12px] sm:text-[13px] text-[#605A57]">
                Perfect for individuals getting started.
              </p>
              <div className="mt-5 sm:mt-6 flex items-baseline gap-1">
                <span className="font-serif text-[44px] sm:text-[52px] font-normal text-[#37322F] leading-none">$0</span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-[#605A57] mt-1">per year, per user.</p>

              <div className="mt-5 sm:mt-6">
                <Link
                  to="/onboarding"
                  className="w-full h-10 sm:h-11 bg-[#37322F] text-white rounded-full inline-flex items-center justify-center text-xs font-medium shadow-xs hover:bg-[#282422] transition-colors"
                >
                  Start for free
                </Link>
              </div>

              <ul className="mt-6 sm:mt-8 space-y-2.5 sm:space-y-3 text-[12px] sm:text-[13px]">
                {[
                  "Up to 3 active resumes",
                  "Basic ATS analysis",
                  "Community support",
                  "Standard templates",
                  "Basic export tools",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[#37322F]">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#37322F] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Card 2: Professional (Featured Dark Charcoal Card) */}
          <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-[rgba(55,50,47,0.12)] flex flex-col justify-between bg-[#37322F] text-white relative">
            <div>
              <h3 className="text-[18px] sm:text-[20px] font-medium text-white font-sans">Professional</h3>
              <p className="mt-1 text-[12px] sm:text-[13px] text-white/70">
                Advanced features for active job seekers.
              </p>
              <div className="mt-5 sm:mt-6 flex items-baseline gap-1">
                <span className="font-serif text-[44px] sm:text-[52px] font-normal text-white leading-none">
                  {billingPeriod === "annually" ? "$16" : "$20"}
                </span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-white/60 mt-1">per year, per user.</p>

              <div className="mt-5 sm:mt-6">
                <Link
                  to="/onboarding"
                  className="w-full h-10 sm:h-11 bg-white text-[#37322F] rounded-full inline-flex items-center justify-center text-xs font-medium shadow-xs hover:bg-gray-100 transition-colors"
                >
                  Get started
                </Link>
              </div>

              <ul className="mt-6 sm:mt-8 space-y-2.5 sm:space-y-3 text-[12px] sm:text-[13px]">
                {[
                  "Unlimited active resumes",
                  "Advanced ATS rubric analysis",
                  "Priority support",
                  "All editorial templates",
                  "Advanced analytics & scoring",
                  "Workflow engine access",
                  "API & LaTeX export",
                  "Custom tailoring rules",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-white/90 font-medium">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Card 3: Enterprise */}
          <div className="p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div>
              <h3 className="text-[18px] sm:text-[20px] font-medium text-[#37322F] font-sans">Enterprise</h3>
              <p className="mt-1 text-[12px] sm:text-[13px] text-[#605A57]">
                Complete solution for teams & agencies.
              </p>
              <div className="mt-5 sm:mt-6 flex items-baseline gap-1">
                <span className="font-serif text-[44px] sm:text-[52px] font-normal text-[#37322F] leading-none">
                  {billingPeriod === "annually" ? "$160" : "$200"}
                </span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-[#605A57] mt-1">per year, per user.</p>

              <div className="mt-5 sm:mt-6">
                <Link
                  to="/onboarding"
                  className="w-full h-10 sm:h-11 bg-[#37322F] text-white rounded-full inline-flex items-center justify-center text-xs font-medium shadow-xs hover:bg-[#282422] transition-colors"
                >
                  Contact sales
                </Link>
              </div>

              <ul className="mt-6 sm:mt-8 space-y-2.5 sm:space-y-3 text-[12px] sm:text-[13px]">
                {[
                  "Everything in Professional",
                  "Dedicated account manager",
                  "24/7 priority support",
                  "Custom onboarding & setup",
                  "Advanced security & SSO",
                  "Team collaboration vault",
                  "Custom contracts",
                  "White-label options",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[#37322F]">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#37322F] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function CTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-4xl px-3 sm:px-4">
        <div className="relative overflow-hidden rounded-[20px] sm:rounded-[26px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] px-5 py-12 text-center shadow-soft sm:px-16 sm:py-16">
          <div className="relative z-10">
            <span className="editorial-pill">
              Ready to Upgrade?
            </span>
            <h2 className="mt-4 sm:mt-5 mx-auto max-w-2xl font-serif text-[28px] xs:text-[34px] sm:text-[50px] font-normal leading-[1.1] sm:leading-[1.08] tracking-tight text-[#18181B]">
              Bring calm precision to your career.
            </h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-lg text-[14px] sm:text-[16px] leading-relaxed text-[#18181B]/70 px-2">
              Join thousands of thoughtful professionals who trust CVPilot with their next move.
            </p>

            <div className="relative mt-6 sm:mt-8 flex flex-col items-center justify-center w-full">
              {/* Warm radial background ambient glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[450px] h-[140px] sm:h-[180px] ambient-glow pointer-events-none rounded-full blur-xl -z-10" />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto relative z-10">
                <Link
                  to="/onboarding"
                  className="w-full sm:w-auto h-11 sm:h-12 px-9 bg-[#37322F] text-white rounded-full inline-flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:bg-[#282422] transition-all hover:scale-[1.02]"
                >
                  Start for free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto h-11 sm:h-12 px-7 bg-white border border-[rgba(55,50,47,0.14)] text-[#18181B] rounded-full inline-flex items-center justify-center text-sm font-medium shadow-xs hover:bg-[#F4F1EC] transition-all"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(55,50,47,0.10)] py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-3 sm:px-4 grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-[1fr_2fr]">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-[#18181B] text-white">
              <PlaneTakeoff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#18181B]">CVPilot</span>
          </Link>
          <p className="mt-3 sm:mt-4 max-w-sm text-[13px] sm:text-[14px] leading-relaxed text-[#18181B]/60">
            AI-powered resume intelligence, quietly precise. Designed with editorial care.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:gap-8 text-[12px] sm:text-[13px] sm:grid-cols-4">
          {[
            { h: "Product", i: ["Features", "Pricing", "Changelog"] },
            { h: "Company", i: ["About", "Careers", "Contact", "Press"] },
            { h: "Resources", i: ["Blog", "Guides", "Support", "Status"] },
            { h: "Legal", i: ["Privacy", "Terms", "Security", "DPA"] },
          ].map((c) => (
            <div key={c.h}>
              <div className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-[#18181B]/50 font-mono">
                {c.h}
              </div>
              <ul className="mt-2.5 sm:mt-3.5 space-y-2 sm:space-y-2.5">
                {c.i.map((x) => (
                  <li key={x}>
                    <a
                      href="#"
                      className="text-[#18181B]/70 transition-colors hover:text-[#18181B]"
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
      <div className="mx-auto max-w-5xl px-3 sm:px-4 mt-8 sm:mt-12 border-t border-[rgba(55,50,47,0.08)] pt-5 sm:pt-6 text-[11px] sm:text-[12px] text-[#18181B]/50 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© {new Date().getFullYear()} CVPilot. All rights reserved.</span>
        <span className="font-mono text-[10px] sm:text-[11px]">Precision Resume OS v1.0</span>
      </div>
    </footer>
  );
}
