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
        category="PIPELINE"
        actions={
          <Badge variant="secondary" className="rounded-full font-mono text-[10.5px] uppercase tracking-widest bg-[#18181B]/5 text-[#18181B] border border-[rgba(55,50,47,0.10)] px-3 py-1">
            Coming soon
          </Badge>
        }
      />

      {/* Hero waitlist card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="editorial-card mt-8 overflow-hidden"
      >
        <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-[1fr_1fr]">
          <div className="relative overflow-hidden p-8 lg:p-10">
            <div className="relative">
              <span className="editorial-pill mb-3">
                <Sparkles className="h-3.5 w-3.5 text-[#18181B]" /> Landing soon
              </span>
              <h2 className="font-serif text-[26px] font-normal leading-tight tracking-tight text-[#18181B] sm:text-[32px]">
                A quiet inbox for every job you apply to.
              </h2>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-[#18181B]/70 font-sans">
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
                  className="h-10 sm:max-w-xs rounded-full border border-[rgba(55,50,47,0.14)] bg-[#F8F6F3] px-4 text-[13px] focus:bg-[#FFFEFC]"
                />
                <Button onClick={join} disabled={joined} className="h-10 gap-1.5 rounded-full bg-[#18181B] text-white hover:bg-[#27272A] shadow-xs px-5">
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

              <div className="mt-4 flex items-center gap-4 text-[11.5px] font-mono text-[#18181B]/50">
                <span className="inline-flex items-center gap-1.5">
                  <Bell className="h-3 w-3" /> Notify me at launch
                </span>
                <span>·</span>
                <span>842 people ahead of you</span>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative min-h-[240px] border-t border-[rgba(55,50,47,0.10)] bg-[#F8F6F3] p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="relative grid h-full grid-cols-3 gap-2">
              {["Wishlist", "Applied", "Interview"].map((label, i) => (
                <div
                  key={label}
                  className="flex flex-col rounded-xl border border-[rgba(55,50,47,0.10)] bg-[#FFFEFC] p-2.5 shadow-xs"
                >
                  <div className="font-mono text-[9.5px] font-medium uppercase tracking-widest text-[#18181B]/50">
                    {label}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {Array.from({ length: 3 - i }).map((_, k) => (
                      <div key={k} className="rounded-lg border border-[rgba(55,50,47,0.08)] bg-[#F8F6F3] p-2">
                        <div className="h-1.5 w-2/3 rounded bg-[#18181B]/10" />
                        <div className="mt-1 h-1 w-1/2 rounded bg-[#18181B]/5" />
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
          <h3 className="font-serif text-lg font-normal text-[#18181B]">Preview · Kanban board</h3>
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#18181B]/50">Static preview</span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex flex-col editorial-card p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#18181B]">
                  <col.icon className="h-3.5 w-3.5 text-[#18181B]" strokeWidth={1.75} />
                  {col.label}
                </div>
                <span className="rounded-full bg-[#18181B]/5 px-2 py-0.5 font-mono text-[10px] text-[#18181B]/60 border border-[rgba(55,50,47,0.10)]">
                  {col.count}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {(sampleCards[col.key] ?? []).map((c) => (
                  <div
                    key={c.company}
                    className="rounded-xl border border-[rgba(55,50,47,0.08)] bg-[#F8F6F3] p-2.5 transition-all hover:-translate-y-0.5 hover:bg-[#FFFEFC]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] font-mono text-[10px] font-semibold text-[#18181B]">
                        {c.logo}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-medium text-[#18181B]">{c.company}</div>
                        <div className="truncate text-[11px] text-[#18181B]/60 font-sans">{c.role}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10.5px] font-mono text-[#18181B]/50">
                      <Calendar className="h-3 w-3" /> {c.date}
                    </div>
                  </div>
                ))}
                {(sampleCards[col.key] ?? []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-[rgba(55,50,47,0.12)] p-3 text-center text-[11px] text-[#18181B]/40 font-mono">
                    Empty
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
            className="editorial-card p-5 transition-all hover:-translate-y-0.5"
          >
            <f.icon className="h-4 w-4 text-[#18181B]" strokeWidth={1.5} />
            <div className="mt-3 text-[14px] font-semibold text-[#18181B]">{f.title}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#18181B]/60 font-sans">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
