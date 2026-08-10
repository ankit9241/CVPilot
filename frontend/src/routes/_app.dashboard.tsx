/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  Shield,
  Wand2,
  ArrowRight,
  ArrowUpRight,
  Archive,
  Plus,
  Upload,
  Bot,
  User as UserIcon,
  X,
  Play,
  ScanSearch,
  LayoutTemplate,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth-store";

import { InfiniteSlider } from "@/components/shared/infinite-slider";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CVPilot" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [showCompletion, setShowCompletion] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    api
      .get<any>("/resumes/dashboard-stats")
      .then((res) => {
        setStats(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const t = setTimeout(() => {
      const completion = user?.profile?.completionPct || 0;
      setShowCompletion(completion < 80);
    }, 1200);
    return () => clearTimeout(t);
  }, [user]);

  const name = user?.profile?.fullName || "User";

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        category="DASHBOARD"
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle="Here's a quiet overview of your resume intelligence workspace."
        actions={
          <>
            <Button variant="outline" size="sm" asChild className="hidden gap-1.5 sm:inline-flex rounded-full bg-[#FFFEFC] border border-[rgba(55,50,47,0.14)] text-[#18181B] hover:bg-[#F4F1EC]">
              <Link to="/resume-studio">
                <Upload className="h-3.5 w-3.5" /> Import
              </Link>
            </Button>
            <Button size="sm" asChild className="gap-1.5 rounded-full bg-[#18181B] text-white hover:bg-[#27272A] shadow-xs">
              <Link to="/resume-studio">
                <Sparkles className="h-3.5 w-3.5" /> New resume
              </Link>
            </Button>
          </>
        }
      />

      {/* Infinite Ticker Marquee matching Landing Page */}
      <DashboardTickerMarquee />

      <div className="mt-8 grid grid-cols-12 gap-4">
        {/* Welcome + quick actions */}
        <WelcomeCard />
        <ProfileCompletionCard />

        <StatBlock
          label="Applications"
          value={loading ? "..." : (stats?.applicationsCount || 0).toString()}
          hint="Tracked applications"
          icon={Shield}
        />
        <StatBlock
          label="Average ATS"
          value={loading ? "..." : (stats?.averageAts || 0).toString()}
          hint="Across all resumes"
          icon={Wand2}
        />
        <StatBlock
          label="Generated"
          value={loading ? "..." : (stats?.sessionsCount || 0).toString()}
          hint="Total versions"
          icon={FileText}
        />
        <StatBlock
          label="Vault size"
          value={loading ? "..." : (stats?.savedResumesCount || 0).toString()}
          hint="Saved resumes"
          icon={Archive}
        />

        <QuickActions />

        <RecentResumeCard stats={stats} />
        <VaultShortcut />

        <ActivityTimeline stats={stats} />
        <RightColumn />
      </div>

      <AnimatePresence>
        {showCompletion && (
          <CompletionToast
            pct={user?.profile?.completionPct ?? 0}
            onClose={() => setShowCompletion(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardTickerMarquee() {
  const tickerStats = [
    { value: "100%", label: "ATS Score Accuracy", dept: "EVALUATION" },
    { value: "< 40s", label: "Tailoring Speed", dept: "INTELLIGENCE" },
    { value: "Zero", label: "AI Hallucination", dept: "PRECISION" },
    { value: "SOC 2", label: "Vault Security", dept: "PRIVACY" },
    { value: "PDF & TeX", label: "Export Formats", dept: "COMPLETENESS" },
  ];

  return (
    <div className="relative border-y border-[rgba(55,50,47,0.08)] bg-[#F4F1EC]/60 py-3.5 select-none overflow-hidden my-4 rounded-2xl">
      <div className="w-full relative overflow-hidden">
        <InfiniteSlider speed={35} gap={48}>
          {tickerStats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3 whitespace-nowrap">
              <span className="font-serif text-2xl font-normal text-[#18181B] tracking-tight">
                {stat.value}
              </span>
              <span className="text-[10.5px] text-[#18181B]/60 uppercase tracking-widest font-mono">
                {stat.label}
                <span className="block text-[8.5px] text-[#18181B]/40 font-sans mt-0.5">
                  {stat.dept}
                </span>
              </span>
            </div>
          ))}
        </InfiniteSlider>
        <div className="bg-gradient-to-r from-[#F8F6F3] to-transparent absolute inset-y-0 left-0 w-12 pointer-events-none z-10" />
        <div className="bg-gradient-to-l from-[#F8F6F3] to-transparent absolute inset-y-0 right-0 w-12 pointer-events-none z-10" />
      </div>
    </div>
  );
}

function WelcomeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="col-span-12 lg:col-span-8"
    >
      <div className="rounded-[22px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-2.5 shadow-soft">
        <div className="rounded-[16px] border border-[rgba(55,50,47,0.08)] bg-[#F8F6F3] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[rgba(55,50,47,0.08)] px-4 py-2.5 bg-[#F4F1EC]/60">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#18181B]/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#18181B]/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#18181B]/20" />
            </div>
            <span className="text-[11px] font-mono text-[#18181B]/50">cvpilot.io / workspace / dashboard</span>
            <div className="h-2 w-12 rounded-full bg-[#18181B]/10" />
          </div>
          <div className="p-6 sm:p-8 relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_0%,rgba(55,50,47,0.06),transparent_75%)]" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="editorial-pill mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-[#18181B]" /> AI Tailoring Active
                </span>
                <h2 className="font-serif text-[26px] sm:text-[32px] font-normal leading-tight tracking-tight text-[#18181B]">
                  Your next application is 40 seconds away.
                </h2>
                <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-[#18181B]/70 font-sans">
                  Paste a job description in the studio and CVPilot will tailor your resume with precise, explainable edits.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button size="sm" asChild className="gap-1.5 font-medium rounded-full bg-[#18181B] text-white hover:bg-[#27272A] shadow-xs px-5 h-10">
                  <Link to="/resume-studio">
                    Open Studio <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="font-medium rounded-full bg-[#FFFEFC] border border-[rgba(55,50,47,0.14)] text-[#18181B] hover:bg-[#F4F1EC] px-4 h-10">
                  <Link to="/resume-analyzer">Analyze existing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileCompletionCard() {
  const { user } = useAuthStore();
  const pct = user?.profile?.completionPct ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="col-span-12 lg:col-span-4"
    >
      <div className="editorial-card flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#18181B]/50 font-medium">
            Profile completion
          </span>
          <span className="font-mono text-[10px] text-[#18181B]/40 uppercase tracking-wider">4 sections left</span>
        </div>
        <div className="mt-6 flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="rgba(55,50,47,0.10)"
                strokeWidth="3"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#18181B"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 100.5" }}
                animate={{ strokeDasharray: `${pct} 100.5` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center font-serif text-[18px] font-medium text-[#18181B]">
              {pct}%
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-relaxed text-[#18181B]/70 font-sans">
              Finish your profile to unlock more accurate tailoring.
            </p>
            <Button size="sm" variant="outline" asChild className="mt-3 gap-1.5 font-medium rounded-full bg-[#FFFEFC] border border-[rgba(55,50,47,0.14)] text-[#18181B] hover:bg-[#F4F1EC]">
              <Link to="/profile">
                Complete profile <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatBlock({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="col-span-6 lg:col-span-3"
    >
      <div className="rounded-[20px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-4.5 shadow-soft hover:shadow-medium transition-all h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-[#18181B]/50 font-medium">
            {label}
          </span>
          <div className="grid h-7 w-7 place-items-center rounded-full border border-[rgba(55,50,47,0.10)] bg-[#F8F6F3]">
            <Icon className="h-3.5 w-3.5 text-[#18181B]/70" strokeWidth={1.5} />
          </div>
        </div>
        <div>
          <div className="mt-3 font-serif text-[32px] font-normal leading-none tracking-tight text-[#18181B]">
            {value}
          </div>
          <div className="mt-1.5 font-sans text-[11.5px] text-[#18181B]/50">{hint}</div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickActions() {
  const actions = [
    {
      to: "/resume-studio",
      icon: Sparkles,
      title: "Generate resume",
      body: "Tailor to a job description in 40s.",
      dept: "INTELLIGENCE",
      tone: "bg-[#18181B] text-white",
    },
    {
      to: "/resume-analyzer",
      icon: ScanSearch,
      title: "Analyze resume",
      body: "Score, keywords and formatting.",
      dept: "ATS MATRIX",
      tone: "bg-[#F8F6F3] text-[#18181B] border border-[rgba(55,50,47,0.12)]",
    },
    {
      to: "/templates",
      icon: LayoutTemplate,
      title: "Browse templates",
      body: "Six premium layouts, always free.",
      dept: "GALLERY",
      tone: "bg-[#F8F6F3] text-[#18181B] border border-[rgba(55,50,47,0.12)]",
    },
    {
      to: "/workflow",
      icon: Zap,
      title: "See the pipeline",
      body: "Every step CVPilot runs, live.",
      dept: "PIPELINE",
      tone: "bg-[#F8F6F3] text-[#18181B] border border-[rgba(55,50,47,0.12)]",
    },
  ];
  return (
    <div className="col-span-12 my-2">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="editorial-pill">
            <span className="h-1.5 w-1.5 rounded-full bg-[#18181B]" />
            QUICK ACTIONS
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#18181B]/50 uppercase tracking-widest">Press ⌘K for commands</span>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
          >
            <Link
              to={a.to}
              className="group flex h-full flex-col rounded-[20px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl", a.tone)}>
                  <a.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="font-mono text-[9.5px] uppercase tracking-widest text-[#18181B]/40 font-medium">
                  {a.dept}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 font-serif text-[18px] font-normal text-[#18181B]">
                {a.title}
                <ArrowRight className="h-3.5 w-3.5 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#18181B]/60 font-sans">{a.body}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RecentResumeCard({ stats }: { stats: any }) {
  const latest = stats?.latestResume;
  const averageAts = stats?.averageAts || 0;

  if (!latest) {
    return (
      <div className="col-span-12 lg:col-span-8">
        <div className="flex min-h-75 flex-col items-center justify-center editorial-card p-10 text-center">
          <FileText className="h-10 w-10 text-[#18181B]/40" strokeWidth={1.5} />
          <div className="mt-4 font-serif text-[18px] font-normal text-[#18181B]">No resumes created yet</div>
          <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-[#18181B]/60 font-sans">
            Get started by crafting your first AI-tailored resume in the Resume Studio.
          </p>
          <Button size="sm" asChild className="mt-5 gap-1.5 rounded-full bg-[#18181B] text-white hover:bg-[#27272A]">
            <Link to="/resume-studio">
              <Sparkles className="h-3.5 w-3.5" /> Start tailoring
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="editorial-card">
        <div className="flex items-center justify-between border-b border-[rgba(55,50,47,0.10)] px-5 py-4">
          <div>
            <div className="text-[13px] font-semibold text-[#18181B]">Recent resume</div>
            <div className="text-[11.5px] text-[#18181B]/60">
              {latest.company} · {latest.title}
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-full bg-[#FFFEFC] border border-[rgba(55,50,47,0.14)] text-[#18181B] hover:bg-[#F4F1EC]" asChild>
            <Link to="/resume-vault">
              Open <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-[1fr_260px] gap-0">
          <div className="p-6">
            <div className="rounded-xl border border-[rgba(55,50,47,0.08)] bg-[#F8F6F3] p-6">
              <div className="h-4 w-40 rounded bg-[#18181B]/10" />
              <div className="mt-1.5 h-3 w-56 rounded bg-[#18181B]/5" />
              <div className="mt-5 h-2.5 w-24 rounded bg-[#18181B]/10" />
              <div className="mt-2 space-y-1.5">
                <div className="h-2 w-full rounded bg-[#18181B]/5" />
                <div className="h-2 w-11/12 rounded bg-[#18181B]/5" />
                <div className="h-2 w-10/12 rounded bg-[#18181B]/5" />
              </div>
              <div className="mt-5 h-2.5 w-28 rounded bg-[#18181B]/10" />
              <div className="mt-2 space-y-1.5">
                <div className="h-2 w-full rounded bg-[#18181B]/5" />
                <div className="h-2 w-9/12 rounded bg-[#18181B]/5" />
              </div>
              <div className="mt-5 h-2.5 w-20 rounded bg-[#18181B]/10" />
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <div className="h-2 rounded bg-[#18181B]/5" />
                <div className="h-2 rounded bg-[#18181B]/5" />
                <div className="h-2 rounded bg-[#18181B]/5" />
              </div>
            </div>
          </div>
          <div className="border-l border-[rgba(55,50,47,0.10)] p-5">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-[#18181B]/50 font-medium">
              ATS score
            </div>
            <div className="mt-2 font-serif text-[36px] font-normal leading-none text-[#18181B]">
              {averageAts}
              <span className="text-[13px] font-sans text-[#18181B]/50">/100</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#18181B]/10">
              <div className="h-full rounded-full bg-[#18181B]" style={{ width: `${averageAts}%` }} />
            </div>
            <div className="mt-6 space-y-2 text-[12px]">
              {[
                ["Keywords", `${Math.round(averageAts * 0.98)}%`],
                [
                  "Formatting",
                  `${Math.round(averageAts * 1.02) > 100 ? 100 : Math.round(averageAts * 1.02)}%`,
                ],
                ["Verbs", `${Math.round(averageAts * 0.95)}%`],
                [
                  "Structure",
                  `${Math.round(averageAts * 1.05) > 100 ? 100 : Math.round(averageAts * 1.05)}%`,
                ],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-[#18181B]/60">{l}</span>
                  <span className="font-medium text-[#18181B] font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VaultShortcut() {
  const [vault, setVault] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any[]>("/vault")
      .then((res) => setVault(res || []))
      .finally(() => setLoading(false));
  }, []);

  const flat = vault.flatMap((c) =>
    c.roles.flatMap((r: any) =>
      r.versions.map((v: any) => ({ ...v, company: c.company, role: r.role })),
    ),
  );
  const recent = flat.slice(0, 5);

  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="flex h-full flex-col editorial-card">
        <div className="flex items-center justify-between border-b border-[rgba(55,50,47,0.10)] px-5 py-4">
          <div>
            <div className="text-[13px] font-semibold text-[#18181B]">Resume Vault</div>
            <div className="text-[11.5px] text-[#18181B]/60 font-sans">
              {loading ? "…" : `${flat.length} resumes stored`}
            </div>
          </div>
          <Button size="sm" variant="ghost" className="rounded-full text-[12px] text-[#18181B]/70 hover:bg-[#F4F1EC]" asChild>
            <Link to="/resume-vault">View all</Link>
          </Button>
        </div>
        {!loading && recent.length === 0 ? (
          <div className="flex-1 p-8 text-center text-[12.5px] text-[#18181B]/50 font-sans">
            No resumes saved yet.
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-[rgba(55,50,47,0.08)]">
            {recent.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-[#F4F1EC]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[#18181B]">
                    {v.company} · {v.role}
                  </div>
                  <div className="truncate text-[11.5px] text-[#18181B]/60">
                    {v.name} · {v.date}
                  </div>
                </div>
                <Badge variant="secondary" className="rounded-full text-[10.5px] font-mono bg-[#18181B]/5 text-[#18181B] border border-[rgba(55,50,47,0.10)]">
                  {v.ats}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ActivityTimeline({ stats }: { stats: any }) {
  const activities = stats?.activities || [];

  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="editorial-card">
        <div className="flex items-center justify-between border-b border-[rgba(55,50,47,0.10)] px-5 py-4">
          <div className="text-[13px] font-semibold text-[#18181B]">Recent activity</div>
        </div>
        {activities.length === 0 ? (
          <div className="p-8 text-center text-[12.5px] text-[#18181B]/50 font-sans">
            No recent activity to show.
          </div>
        ) : (
          <ol className="relative divide-y divide-[rgba(55,50,47,0.08)]">
            {activities.map((a: any) => {
              const isAI =
                a.action.toLowerCase().includes("ai") ||
                a.action.toLowerCase().includes("generate");
              return (
                <li key={a.id} className="flex items-start gap-3 px-5 py-4">
                  <div
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[rgba(55,50,47,0.12)]",
                      isAI ? "bg-[#18181B] text-white" : "bg-[#FFFEFC] text-[#18181B]/70",
                    )}
                  >
                    {isAI ? <Bot className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px]">
                      <span className="font-medium text-[#18181B]">You</span>{" "}
                      <span className="text-[#18181B]/70">{a.action}</span>
                    </div>
                    <div className="text-[11.5px] text-[#18181B]/50 font-mono mt-0.5">
                      {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function RightColumn() {
  const suggestions: string[] = [];
  const notifications: any[] = [];

  return (
    <div className="col-span-12 space-y-4 lg:col-span-4">
      <div className="editorial-card p-5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#18181B]">
          <Sparkles className="h-3.5 w-3.5 text-[#18181B]" /> AI suggestions
        </div>
        {suggestions.length === 0 ? (
          <div className="mt-4 text-center text-[12.5px] text-[#18181B]/50 py-6 font-sans">
            No suggestions available. Create and analyze a resume in the studio to get AI
            suggestions.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {suggestions.map((s) => (
              <li
                key={s}
                className="rounded-xl border border-[rgba(55,50,47,0.08)] bg-[#F8F6F3] p-3 text-[12.5px] leading-relaxed text-[#18181B]/85"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="editorial-card p-5">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold text-[#18181B]">Applications</div>
          <Badge variant="secondary" className="rounded-full text-[10px] font-mono bg-[#18181B]/5 text-[#18181B] border border-[rgba(55,50,47,0.10)]">
            Coming soon
          </Badge>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#18181B]/60 font-sans">
          Track every application, status and follow-up from one focused inbox.
        </p>
        <Button size="sm" variant="outline" className="mt-4 w-full rounded-full bg-[#FFFEFC] border border-[rgba(55,50,47,0.14)] text-[#18181B] hover:bg-[#F4F1EC]">
          Join waitlist
        </Button>
      </div>

      <div className="editorial-card">
        <div className="border-b border-[rgba(55,50,47,0.10)] px-5 py-4 text-[13px] font-semibold text-[#18181B]">
          Notifications
        </div>
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-[12.5px] text-[#18181B]/50 font-sans">
            No new notifications.
          </div>
        ) : (
          <ul className="divide-y divide-[rgba(55,50,47,0.08)]">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    n.unread ? "bg-[#18181B]" : "bg-[rgba(55,50,47,0.20)]",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[#18181B]">{n.title}</div>
                  <div className="text-[12px] text-[#18181B]/60 font-sans">{n.body}</div>
                  <div className="mt-0.5 text-[11px] text-[#18181B]/40 font-mono">{n.when}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CompletionToast({ pct, onClose }: { pct: number; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.98 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}
      className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm"
    >
      <div className="relative overflow-hidden editorial-card p-5">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-[#18181B]/60 transition-colors hover:bg-[#F4F1EC]"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#18181B] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-[#18181B]">Finish your profile</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#18181B]/70 font-sans">
              You're at {pct}%. A complete profile unlocks sharper resume tailoring.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" asChild className="text-[12px] rounded-full bg-[#18181B] text-white hover:bg-[#27272A]">
                <Link to="/profile">Continue</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose} className="text-[12px] rounded-full text-[#18181B]/70 hover:bg-[#F4F1EC]">
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
