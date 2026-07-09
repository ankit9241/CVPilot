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
import {
  currentUser,
  generationHistory,
  activityFeed,
  resumeVault,
  notifications,
} from "@/constants/dummy-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CVPilot" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowCompletion(currentUser.profileCompletion < 80), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title={`Welcome back, ${currentUser.name.split(" ")[0]}`}
        subtitle="Here's a quiet overview of your resume workspace."
        actions={
          <>
            <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <Button size="sm" asChild className="gap-1.5">
              <Link to="/resume-studio">
                <Sparkles className="h-3.5 w-3.5" /> New resume
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-12 gap-4">
        {/* Welcome + quick actions */}
        <WelcomeCard />
        <ProfileCompletionCard />

        <StatBlock
          label="Resume health"
          value="Excellent"
          hint="+4% vs last week"
          icon={Shield}
          tone="success"
        />
        <StatBlock
          label="Average ATS"
          value="89"
          hint="Across 8 resumes"
          icon={Wand2}
          tone="primary"
        />
        <StatBlock label="Generated" value="24" hint="This month" icon={FileText} tone="muted" />
        <StatBlock
          label="Vault size"
          value="12"
          hint="Resumes stored"
          icon={Archive}
          tone="muted"
        />

        <ContinueWorking />
        <QuickActions />

        <RecentResumeCard />
        <VaultShortcut />

        <ActivityTimeline />
        <RightColumn />
      </div>

      <AnimatePresence>
        {showCompletion && <CompletionToast onClose={() => setShowCompletion(false)} />}
      </AnimatePresence>
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
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-subtle">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent_60%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Ready to tailor
            </span>
            <h2 className="mt-3 text-[22px] font-semibold tracking-tight sm:text-[26px]">
              Your next application is 40 seconds away.
            </h2>
            <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
              Paste a job description in the studio and CVPilot will tailor your resume with
              precise, explainable edits.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild className="gap-1.5">
              <Link to="/resume-studio">
                Open Studio <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/resume-analyzer">Analyze existing</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileCompletionCard() {
  const pct = currentUser.profileCompletion;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="col-span-12 lg:col-span-4"
    >
      <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-subtle">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            Profile completion
          </span>
          <span className="text-[11px] text-muted-foreground">4 sections left</span>
        </div>
        <div className="mt-6 flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth="3"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 100.5" }}
                animate={{ strokeDasharray: `${pct} 100.5` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-[15px] font-semibold">
              {pct}%
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-relaxed text-foreground">
              Finish your profile to unlock more accurate tailoring.
            </p>
            <Button size="sm" variant="outline" asChild className="mt-3 gap-1.5">
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
  tone = "muted",
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone?: "primary" | "success" | "muted";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-success"
        : "text-muted-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="col-span-6 lg:col-span-3"
    >
      <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <Icon className={cn("h-4 w-4", toneClass)} strokeWidth={1.5} />
        </div>
        <div className="mt-3 text-[24px] font-semibold tracking-tight">{value}</div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">{hint}</div>
      </div>
    </motion.div>
  );
}

function ContinueWorking() {
  const item = generationHistory[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="col-span-12"
    >
      <div className="rounded-2xl border border-border bg-card shadow-subtle">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <Play className="h-3.5 w-3.5 text-primary" /> Continue where you left off
          </div>
          <span className="text-[11px] text-muted-foreground">Auto-saved · just now</span>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="flex items-center gap-3 p-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Last resume
              </div>
              <div className="truncate text-[13px] font-semibold">{item.label}</div>
              <div className="text-[11.5px] text-muted-foreground">
                Updated {item.date} · ATS {item.ats}
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="shrink-0">
              <Link to="/resume-studio">Resume</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 p-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                In progress
              </div>
              <div className="truncate text-[13px] font-semibold">Vercel · Solutions Engineer</div>
              <div className="text-[11.5px] text-muted-foreground">Generating · Step 4 of 11</div>
            </div>
            <Button size="sm" asChild className="shrink-0">
              <Link to="/workflow">Open</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 p-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Recent analysis
              </div>
              <div className="truncate text-[13px] font-semibold">Microsoft · AI Engineer v3</div>
              <div className="text-[11.5px] text-muted-foreground">Health 92 · Yesterday</div>
            </div>
            <Button size="sm" variant="outline" asChild className="shrink-0">
              <Link to="/resume-analyzer">Review</Link>
            </Button>
          </div>
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
      tone: "bg-primary/10 text-primary",
    },
    {
      to: "/resume-analyzer",
      icon: ScanSearch,
      title: "Analyze resume",
      body: "Score, keywords and formatting.",
      tone: "bg-warning/15 text-warning",
    },
    {
      to: "/templates",
      icon: LayoutTemplate,
      title: "Browse templates",
      body: "Six premium layouts, always free.",
      tone: "bg-success/15 text-success",
    },
    {
      to: "/workflow",
      icon: Zap,
      title: "See the pipeline",
      body: "Every step CVPilot runs, live.",
      tone: "bg-accent text-foreground",
    },
  ];
  return (
    <div className="col-span-12">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[13px] font-semibold tracking-tight">Quick actions</h3>
        <span className="text-[11.5px] text-muted-foreground">Press ⌘K for more</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
          >
            <Link
              to={a.to}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl", a.tone)}>
                <a.icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[14px] font-semibold tracking-tight">
                {a.title}
                <ArrowRight className="h-3.5 w-3.5 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{a.body}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RecentResumeCard() {
  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="rounded-2xl border border-border bg-card shadow-subtle">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-[13px] font-semibold">Recent resume</div>
            <div className="text-[11.5px] text-muted-foreground">
              Google · Frontend Engineer · v2
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5">
            Open <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-[1fr_260px] gap-0">
          <div className="p-6">
            <div className="rounded-lg border border-border bg-surface p-6">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="mt-1.5 h-3 w-56 rounded bg-muted/70" />
              <div className="mt-5 h-2.5 w-24 rounded bg-muted" />
              <div className="mt-2 space-y-1.5">
                <div className="h-2 w-full rounded bg-muted/60" />
                <div className="h-2 w-11/12 rounded bg-muted/60" />
                <div className="h-2 w-10/12 rounded bg-muted/60" />
              </div>
              <div className="mt-5 h-2.5 w-28 rounded bg-muted" />
              <div className="mt-2 space-y-1.5">
                <div className="h-2 w-full rounded bg-muted/60" />
                <div className="h-2 w-9/12 rounded bg-muted/60" />
              </div>
              <div className="mt-5 h-2.5 w-20 rounded bg-muted" />
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <div className="h-2 rounded bg-muted/60" />
                <div className="h-2 rounded bg-muted/60" />
                <div className="h-2 rounded bg-muted/60" />
              </div>
            </div>
          </div>
          <div className="border-l border-border p-5">
            <div className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
              ATS score
            </div>
            <div className="mt-2 text-[36px] font-semibold tracking-tight">
              90<span className="text-[13px] text-muted-foreground">/100</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[90%] rounded-full bg-primary" />
            </div>
            <div className="mt-6 space-y-2 text-[12px]">
              {[
                ["Keywords", "94%"],
                ["Formatting", "100%"],
                ["Verbs", "88%"],
                ["Structure", "96%"],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-medium">{v}</span>
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
  const flat = resumeVault.flatMap((c) =>
    c.roles.flatMap((r) => r.versions.map((v) => ({ ...v, company: c.company, role: r.role }))),
  );
  const recent = flat.slice(0, 5);
  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-subtle">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-[13px] font-semibold">Resume Vault</div>
            <div className="text-[11.5px] text-muted-foreground">{flat.length} resumes stored</div>
          </div>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/resume-vault">View all</Link>
          </Button>
        </div>
        <ul className="flex-1 divide-y divide-border">
          {recent.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">
                  {v.company} · {v.role}
                </div>
                <div className="truncate text-[11.5px] text-muted-foreground">
                  {v.name} · {v.date}
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full text-[11px] font-medium">
                {v.ats}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActivityTimeline() {
  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="rounded-2xl border border-border bg-card shadow-subtle">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="text-[13px] font-semibold">Recent activity</div>
          <Button size="sm" variant="ghost">
            View all
          </Button>
        </div>
        <ol className="relative divide-y divide-border">
          {activityFeed.map((a) => {
            const isAI = a.type === "ai";
            return (
              <li key={a.id} className="flex items-start gap-3 px-5 py-4">
                <div
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border",
                    isAI ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground",
                  )}
                >
                  {isAI ? <Bot className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px]">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">{a.when}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function RightColumn() {
  return (
    <div className="col-span-12 space-y-4 lg:col-span-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI suggestions
        </div>
        <ul className="mt-4 space-y-3">
          {[
            "Add measurable impact to your Stripe role (revenue, users).",
            "Two projects are missing tech stack tags.",
            "Consider a shorter summary tailored per role.",
          ].map((s) => (
            <li
              key={s}
              className="rounded-lg border border-border bg-background p-3 text-[12.5px] leading-relaxed text-foreground/85"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold">Applications</div>
          <Badge variant="secondary" className="rounded-full text-[11px]">
            Coming soon
          </Badge>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
          Track every application, status and follow-up from one focused inbox.
        </p>
        <Button size="sm" variant="outline" className="mt-4 w-full">
          Join waitlist
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-subtle">
        <div className="border-b border-border px-5 py-4 text-[13px] font-semibold">
          Notifications
        </div>
        <ul className="divide-y divide-border">
          {notifications.slice(0, 3).map((n) => (
            <li key={n.id} className="flex items-start gap-3 px-5 py-3">
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  n.unread ? "bg-primary" : "bg-border",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{n.title}</div>
                <div className="text-[12px] text-muted-foreground">{n.body}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{n.when}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CompletionToast({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.98 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}
      className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-lifted">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold">Finish your profile</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              You're at {currentUser.profileCompletion}%. A complete profile unlocks sharper resume
              tailoring.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" asChild className="text-[12px]">
                <Link to="/profile">Continue</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose} className="text-[12px]">
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
