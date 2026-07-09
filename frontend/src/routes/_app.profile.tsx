import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Wrench,
  FileCheck,
  Trophy,
  Link as LinkIcon,
  Camera,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  currentUser,
  socialLinks,
  education,
  experience,
  projects,
  skills as skillsData,
  certificates,
  achievements,
} from "@/constants/dummy-data";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — CVPilot" }] }),
  component: ProfilePage,
});

type SectionKey =
  | "personal"
  | "education"
  | "experience"
  | "projects"
  | "skills"
  | "certificates"
  | "achievements"
  | "social";

const sections: {
  key: SectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { key: "personal", label: "Personal", icon: User },
  { key: "social", label: "Social links", icon: LinkIcon },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "projects", label: "Projects", icon: FolderGit2 },
  { key: "skills", label: "Skills", icon: Wrench },
  { key: "certificates", label: "Certificates", icon: FileCheck },
  { key: "achievements", label: "Achievements", icon: Trophy },
];

function ProfilePage() {
  const [active, setActive] = useState<SectionKey>("personal");
  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Profile"
        subtitle="Your master profile powers every resume CVPilot generates."
        actions={
          <Button size="sm" className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save changes
          </Button>
        }
      />

      <ProfileCompletion onJump={setActive} />

      <div className="mt-8 grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3">
          <nav className="sticky top-20 rounded-2xl border border-border bg-card p-2 shadow-subtle">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                  active === s.key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <s.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {active === "personal" && <PersonalSection />}
              {active === "social" && <SocialSection />}
              {active === "education" && <EducationSection />}
              {active === "experience" && <ExperienceSection />}
              {active === "projects" && <ProjectsSection />}
              {active === "skills" && <SkillsSection />}
              {active === "certificates" && <CertificatesSection />}
              {active === "achievements" && <AchievementsSection />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-subtle">
      <div className="flex items-start justify-between gap-3 border-b border-border p-6">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        </div>
        {actions}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px]">{label}</Label>
      {children}
    </div>
  );
}

function PersonalSection() {
  return (
    <SectionCard title="Personal" description="How you appear on every resume and export.">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
        <Avatar className="h-16 w-16 border border-border">
          <AvatarFallback className="bg-primary/10 text-[16px] font-semibold text-primary">
            {currentUser.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-[13px] font-medium">Profile photo</div>
          <div className="text-[12px] text-muted-foreground">
            Recommended · 400 × 400px, JPG or PNG
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Camera className="h-3.5 w-3.5" /> Change
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input defaultValue={currentUser.name} className="h-10" />
        </Field>
        <Field label="Email">
          <Input defaultValue={currentUser.email} className="h-10" />
        </Field>
        <Field label="Phone">
          <Input defaultValue={currentUser.phone} className="h-10" />
        </Field>
        <Field label="Current role">
          <Input defaultValue={currentUser.role} className="h-10" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Location">
            <Input defaultValue={currentUser.location} className="h-10" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Professional summary">
            <Textarea
              rows={4}
              defaultValue="Senior product engineer with 6+ years shipping polished, high-performance web products at Stripe, Airbnb and Linear. Focused on quiet UX, latency budgets and durable systems."
            />
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}

function SocialSection() {
  return (
    <SectionCard
      title="Social links"
      description="Every link you add can be surfaced or hidden per resume."
    >
      <div className="space-y-3">
        {socialLinks.map((s) => (
          <div
            key={s.key}
            className="grid grid-cols-[110px_1fr_auto] items-center gap-3 rounded-lg border border-border bg-background p-3"
          >
            <Label className="text-[13px] font-medium">{s.label}</Label>
            <Input
              defaultValue={s.value}
              placeholder={s.placeholder}
              className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Badge
              variant={s.value ? "secondary" : "outline"}
              className="rounded-full text-[10.5px]"
            >
              {s.value ? "Linked" : "Not set"}
            </Badge>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function EducationSection() {
  return (
    <SectionCard
      title="Education"
      description="Every school, in reverse chronological order."
      actions={
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      }
    >
      <div className="space-y-3">
        {education.map((e) => (
          <div
            key={e.id}
            className="group rounded-xl border border-border bg-background p-5 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold">{e.school}</div>
                <div className="text-[13px] text-foreground/80">{e.degree}</div>
                <div className="text-[12px] text-muted-foreground">
                  {e.field} · {e.start} – {e.end} · GPA {e.gpa}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ExperienceSection() {
  return (
    <SectionCard
      title="Experience"
      description="Your roles as a timeline you can rearrange."
      actions={
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      }
    >
      <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
        {experience.map((x) => (
          <div key={x.id} className="relative rounded-xl border border-border bg-background p-5">
            <span className="absolute -left-6 top-6 grid h-4 w-4 place-items-center rounded-full border-2 border-primary bg-card" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold">{x.role}</div>
                <div className="text-[13px] text-muted-foreground">
                  {x.company} · {x.location} · {x.start} – {x.end}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">{x.description}</p>
            <ul className="mt-2 space-y-1">
              {x.achievements.map((a) => (
                <li key={a} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {a}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ProjectsSection() {
  return (
    <SectionCard
      title="Projects"
      description="Case studies and side projects."
      actions={
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {projects.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[14px] font-semibold">{p.name}</div>
                <div className="text-[12px] text-muted-foreground">
                  {p.role} · {p.duration}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              {p.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.stack.slice(0, 4).map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="rounded-full text-[10.5px] font-normal"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SkillsSection() {
  const [state, setState] = useState(skillsData);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  return (
    <SectionCard title="Skills" description="Grouped by category. Type + Enter to add.">
      <div className="space-y-4">
        {Object.entries(state).map(([cat, tags]) => (
          <div key={cat} className="rounded-xl border border-border bg-background p-4">
            <div className="text-[12.5px] font-semibold">{cat}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[12px]"
                >
                  {t}
                  <button
                    onClick={() => setState({ ...state, [cat]: tags.filter((x) => x !== t) })}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${t}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={inputs[cat] ?? ""}
                onChange={(e) => setInputs({ ...inputs, [cat]: e.target.value })}
                onKeyDown={(e) => {
                  const v = (inputs[cat] ?? "").trim();
                  if (e.key === "Enter" && v) {
                    e.preventDefault();
                    setState({ ...state, [cat]: [...tags, v] });
                    setInputs({ ...inputs, [cat]: "" });
                  }
                }}
                placeholder="Add tag…"
                className="min-w-[120px] flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CertificatesSection() {
  return (
    <SectionCard
      title="Certificates"
      description="Credentials and proof."
      actions={
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      }
    >
      <div className="space-y-3">
        {certificates.map((c) => (
          <div
            key={c.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4"
          >
            <div>
              <div className="text-[13.5px] font-semibold">{c.name}</div>
              <div className="text-[12px] text-muted-foreground">
                {c.issuer} · {c.date}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                ID: {c.credential}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function AchievementsSection() {
  return (
    <SectionCard
      title="Achievements"
      description="Wins worth telling."
      actions={
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {achievements.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13.5px] font-semibold">{a.title}</div>
                <div className="text-[12px] text-muted-foreground">{a.date}</div>
              </div>
              <Trophy className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{a.context}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ProfileCompletion({ onJump }: { onJump: (k: SectionKey) => void }) {
  const items: { key: SectionKey; label: string; done: boolean; hint?: string }[] = [
    { key: "personal", label: "Personal details", done: true },
    { key: "social", label: "Social links", done: false, hint: "Add Dribbble & Behance" },
    { key: "education", label: "Education", done: true },
    { key: "experience", label: "Experience", done: true },
    { key: "projects", label: "Projects", done: true },
    { key: "skills", label: "Skills", done: true },
    { key: "certificates", label: "Certificates", done: true },
    { key: "achievements", label: "Achievements", done: false, hint: "Add 1 more" },
  ];
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex items-center gap-4">
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
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Profile completion
            </div>
            <div className="mt-1 text-[15px] font-semibold tracking-tight">
              {done} of {items.length} sections
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Finish the last {items.length - done} to unlock sharper tailoring.
            </p>
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((it) => (
            <li key={it.key}>
              <button
                onClick={() => onJump(it.key)}
                className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                    it.done ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                  )}
                >
                  {it.done ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium">{it.label}</span>
                  {it.hint && !it.done && (
                    <span className="block truncate text-[11px] text-warning">{it.hint}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}
