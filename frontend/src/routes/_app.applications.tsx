import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Bell,
  Sparkles,
  Building2,
  Calendar,
  ClipboardCheck,
  Users,
  Award,
  XCircle,
  ArrowRight,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/applications")({
  head: () => ({ meta: [{ title: "Applications — CVPilot" }] }),
  component: ApplicationsPage,
});

const columns = [
  { key: "wishlist", label: "Wishlist", icon: Sparkles, count: 8, tone: "text-muted-foreground" },
  { key: "applied", label: "Applied", icon: Briefcase, count: 5, tone: "text-primary" },
  { key: "oa", label: "OA", icon: ClipboardCheck, count: 3, tone: "text-warning" },
  { key: "interview", label: "Interview", icon: Users, count: 2, tone: "text-primary" },
  { key: "offer", label: "Offer", icon: Award, count: 1, tone: "text-success" },
  { key: "rejected", label: "Rejected", icon: XCircle, count: 2, tone: "text-destructive" },
];

const sampleCards: Record<
  string,
  Array<{ company: string; role: string; date: string; logo: string }>
> = {
  wishlist: [
    { company: "Notion", role: "Product Engineer", date: "Wishlist · Jul 04", logo: "N" },
    { company: "Figma", role: "Design Engineer", date: "Wishlist · Jul 02", logo: "F" },
  ],
  applied: [
    { company: "Vercel", role: "Solutions Engineer", date: "Applied · Jul 05", logo: "V" },
    { company: "Linear", role: "Senior FE", date: "Applied · Jul 03", logo: "L" },
  ],
  oa: [{ company: "Google", role: "Frontend Engineer", date: "OA · Due Jul 09", logo: "G" }],
  interview: [{ company: "Stripe", role: "Product Engineer", date: "Onsite · Jul 12", logo: "S" }],
  offer: [
    { company: "Anthropic", role: "Design Engineer", date: "Offer · Exp. Jul 15", logo: "A" },
  ],
  rejected: [{ company: "OpenAI", role: "Applied Engineer", date: "Jun 22", logo: "O" }],
};

function ApplicationsPage() {
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState("");

  const join = () => {
    if (!email.trim()) {
      toast.error("Enter your email to join the waitlist");
      return;
    }
    setJoined(true);
    toast.success("You're on the waitlist");
  };

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Applications"
        subtitle="Track every application, status and follow-up in one focused inbox."
        actions={
          <Badge variant="secondary" className="rounded-full text-[11px]">
            Coming soon
          </Badge>
        }
      />

      {/* Hero waitlist card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-subtle"
      >
        <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-[1fr_1fr]">
          <div className="relative overflow-hidden p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent_60%)]" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Landing soon
              </span>
              <h2 className="mt-4 text-[24px] font-semibold tracking-tight sm:text-[28px]">
                A quiet inbox for every job you apply to.
              </h2>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
                Auto-log applications, remember follow-ups, connect resumes to interviews, and keep
                every offer letter in one place.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={joined}
                  placeholder="you@work.com"
                  aria-label="Email for waitlist"
                  className="h-10 sm:max-w-xs"
                />
                <Button onClick={join} disabled={joined} className="h-10 gap-1.5">
                  {joined ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> You're on the list
                    </>
                  ) : (
                    <>
                      Join waitlist <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-4 text-[11.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Bell className="h-3 w-3" /> Notify me at launch
                </span>
                <span>·</span>
                <span>842 people ahead of you</span>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative min-h-[240px] border-t border-border bg-surface p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--color-primary)_6%,transparent))]" />
            <div className="relative grid h-full grid-cols-3 gap-2">
              {["Wishlist", "Applied", "Interview"].map((label, i) => (
                <div
                  key={label}
                  className="flex flex-col rounded-lg border border-border bg-background/80 p-2.5 shadow-subtle"
                >
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {Array.from({ length: 3 - i }).map((_, k) => (
                      <div key={k} className="rounded-md border border-border bg-card p-2">
                        <div className="h-1.5 w-2/3 rounded bg-muted" />
                        <div className="mt-1 h-1 w-1/2 rounded bg-muted/60" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Kanban preview */}
      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight">Preview · Kanban board</h3>
          <span className="text-[12px] text-muted-foreground">Static preview</span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex flex-col rounded-2xl border border-border bg-card p-3 shadow-subtle"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                  <col.icon className={`h-3.5 w-3.5 ${col.tone}`} strokeWidth={1.75} />
                  {col.label}
                </div>
                <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {col.count}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {(sampleCards[col.key] ?? []).map((c) => (
                  <div
                    key={c.company}
                    className="rounded-lg border border-border bg-background p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-card font-mono text-[10px] font-semibold">
                        {c.logo}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-medium">{c.company}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{c.role}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {c.date}
                    </div>
                  </div>
                ))}
                {(sampleCards[col.key] ?? []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                    No cards yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature list */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: Building2,
            title: "Company timeline",
            body: "Every touchpoint, chronologically.",
          },
          {
            icon: ClipboardCheck,
            title: "Follow-up reminders",
            body: "Never let a warm lead go cold.",
          },
          { icon: Award, title: "Offer comparison", body: "TC, equity, timelines side-by-side." },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft"
          >
            <f.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <div className="mt-3 text-[13.5px] font-semibold">{f.title}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
