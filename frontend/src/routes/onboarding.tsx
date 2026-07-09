import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  PlaneTakeoff,
  Plus,
  Trash2,
  Pencil,
  Upload,
  Sparkles,
  User,
  Link as LinkIcon,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Wrench,
  Award,
  Trophy,
  FileCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  currentUser,
  education,
  experience,
  projects,
  skills as skillsData,
  certificates,
  achievements,
  socialLinks,
} from "@/constants/dummy-data";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Get started — CVPilot" }] }),
  component: OnboardingPage,
});

const stepsMeta = [
  { id: 1, title: "Basic info", icon: User, required: true },
  { id: 2, title: "Social links", icon: LinkIcon, required: false },
  { id: 3, title: "Education", icon: GraduationCap, required: false },
  { id: 4, title: "Experience", icon: Briefcase, required: false },
  { id: 5, title: "Projects", icon: FolderGit2, required: false },
  { id: 6, title: "Skills", icon: Wrench, required: false },
  { id: 7, title: "Certificates", icon: FileCheck, required: false },
  { id: 8, title: "Achievements", icon: Trophy, required: false },
  { id: 9, title: "Review", icon: Award, required: true },
];

function OnboardingPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const total = stepsMeta.length;
  const progress = Math.round((step / total) * 100);

  const next = () => setStep((s) => Math.min(total, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="container-page flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <PlaneTakeoff className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">CVPilot</span>
          </Link>
          <div className="hidden items-center gap-3 text-[12px] text-muted-foreground sm:flex">
            <span>
              Step {step} of {total}
            </span>
            <span className="h-3 w-px bg-border" />
            <span>{progress}% complete</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Skip setup</Link>
          </Button>
        </div>
        <div className="h-1 w-full bg-border">
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </header>

      <div className="container-page grid flex-1 grid-cols-1 gap-8 py-10 lg:grid-cols-[260px_1fr] lg:py-14">
        {/* Stepper */}
        <aside className="hidden lg:block">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Setup
          </p>
          <h2 className="mt-2 text-[18px] font-semibold tracking-tight">Complete your profile</h2>
          <ol className="mt-6 space-y-1">
            {stepsMeta.map((s) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setStep(s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-all",
                      active && "bg-card shadow-subtle",
                      !active && "hover:bg-accent",
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold transition-colors",
                        done && "border-primary bg-primary text-primary-foreground",
                        active && !done && "border-primary text-primary",
                        !active && !done && "border-border text-muted-foreground",
                      )}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <s.icon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{s.title}</span>
                        {s.required && (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mx-auto max-w-2xl"
            >
              {step === 1 && <StepBasic />}
              {step === 2 && <StepSocial />}
              {step === 3 && <StepEducation />}
              {step === 4 && <StepExperience />}
              {step === 5 && <StepProjects />}
              {step === 6 && <StepSkills />}
              {step === 7 && <StepCertificates />}
              {step === 8 && <StepAchievements />}
              {step === 9 && <StepReview onEdit={setStep} />}

              <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prev}
                  disabled={step === 1}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <div className="flex items-center gap-2">
                  {step > 1 && step < total && !stepsMeta[step - 1].required && (
                    <Button variant="ghost" size="sm" onClick={next}>
                      Skip
                    </Button>
                  )}
                  {step < total ? (
                    <Button size="sm" onClick={next} className="gap-1.5">
                      Save & continue <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => navigate({ to: "/dashboard" })}
                      className="gap-1.5"
                    >
                      Finish setup <Sparkles className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function StepHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </span>
      <h1 className="mt-2 text-[26px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px]">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StepBasic() {
  return (
    <div>
      <StepHeader
        eyebrow="Step 1 of 9"
        title="Basic information"
        description="This appears on every resume you generate."
      />
      <div className="mt-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <Avatar className="h-16 w-16 border border-border">
          <AvatarFallback className="bg-primary/10 text-[16px] font-semibold text-primary">
            {currentUser.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-[13px] font-medium">Profile photo</div>
          <div className="text-[12px] text-muted-foreground">
            JPG or PNG · 400×400px recommended
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Upload
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
      </div>
    </div>
  );
}

function StepSocial() {
  return (
    <div>
      <StepHeader
        eyebrow="Step 2 of 9"
        title="Social links"
        description="Add the ones that matter. Skip the rest — it's fine."
      />
      <div className="mt-8 space-y-3">
        {socialLinks.map((s) => (
          <div
            key={s.key}
            className="grid grid-cols-[110px_1fr] items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <Label className="text-[13px] font-medium">{s.label}</Label>
            <Input
              defaultValue={s.value}
              placeholder={s.placeholder}
              className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepEducation() {
  return (
    <div>
      <StepHeader
        eyebrow="Step 3 of 9"
        title="Education"
        description="Add every degree, bootcamp or programme worth mentioning."
      />
      <div className="mt-8 space-y-3">
        {education.map((e) => (
          <div
            key={e.id}
            className="group rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all hover:shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold">{e.school}</div>
                <div className="mt-0.5 text-[13px] text-foreground/80">{e.degree}</div>
                <div className="text-[12px] text-muted-foreground">
                  {e.field} · {e.start} – {e.end} · GPA {e.gpa}
                </div>
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          <Plus className="h-4 w-4" /> Add education
        </button>
      </div>
    </div>
  );
}

function StepExperience() {
  return (
    <div>
      <StepHeader
        eyebrow="Step 4 of 9"
        title="Experience"
        description="Every role, every impact — as a timeline you can edit."
      />
      <div className="relative mt-8 space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
        {experience.map((x) => (
          <div
            key={x.id}
            className="relative rounded-2xl border border-border bg-card p-5 shadow-subtle"
          >
            <span className="absolute -left-6 top-6 grid h-4 w-4 place-items-center rounded-full border-2 border-primary bg-background" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold">{x.role}</div>
                <div className="text-[13px] text-muted-foreground">
                  {x.company} · {x.location}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  {x.start} – {x.end}
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
            <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">{x.description}</p>
            <ul className="mt-3 space-y-1.5">
              {x.achievements.map((a) => (
                <li key={a} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {a}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <button className="relative flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          <span className="absolute -left-6 top-1/2 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full border-2 border-dashed border-border bg-background" />
          <Plus className="h-4 w-4" /> Add experience
        </button>
      </div>
    </div>
  );
}

function StepProjects() {
  return (
    <div>
      <StepHeader
        eyebrow="Step 5 of 9"
        title="Projects"
        description="Ship-worthy work you want the world (and recruiters) to see."
      />
      <div className="mt-8 grid grid-cols-1 gap-3">
        {projects.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all hover:shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold">{p.name}</div>
                <div className="text-[12px] text-muted-foreground">
                  {p.role} · {p.duration}
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
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {p.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.stack.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full text-[11px] font-normal">
                  {t}
                </Badge>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-muted-foreground">
              {p.github && <span>↗ {p.github}</span>}
              {p.live && <span>↗ {p.live}</span>}
              <span>Impact: {p.impact}</span>
            </div>
          </div>
        ))}
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          <Plus className="h-4 w-4" /> Add project
        </button>
      </div>
    </div>
  );
}

function StepSkills() {
  const [input, setInput] = useState("");
  const [state, setState] = useState(skillsData);
  return (
    <div>
      <StepHeader
        eyebrow="Step 6 of 9"
        title="Skills"
        description="Group by category. Type + Enter to add a tag."
      />
      <div className="mt-8 space-y-4">
        {Object.entries(state).map(([cat, tags]) => (
          <div key={cat} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-[13px] font-semibold">{cat}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[12px]"
                >
                  {t}
                  <button
                    onClick={() => setState({ ...state, [cat]: tags.filter((x) => x !== t) })}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${t}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim()) {
                    e.preventDefault();
                    setState({ ...state, [cat]: [...tags, input.trim()] });
                    setInput("");
                  }
                }}
                placeholder="Add tag…"
                className="min-w-[120px] flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCertificates() {
  return (
    <div>
      <StepHeader
        eyebrow="Step 7 of 9"
        title="Certificates"
        description="Add credentials and upload proof if you'd like."
      />
      <div className="mt-8 space-y-3">
        {certificates.map((c) => (
          <div
            key={c.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div>
              <div className="text-[14px] font-semibold">{c.name}</div>
              <div className="text-[12.5px] text-muted-foreground">
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
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-6 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          <Upload className="h-4 w-4" /> Add certificate · drop file or click
        </button>
      </div>
    </div>
  );
}

function StepAchievements() {
  return (
    <div>
      <StepHeader
        eyebrow="Step 8 of 9"
        title="Achievements"
        description="Awards, honours, moments that shaped your career."
      />
      <div className="mt-8 grid grid-cols-1 gap-3">
        {achievements.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold">{a.title}</div>
                <div className="text-[12.5px] text-muted-foreground">{a.date}</div>
              </div>
              <Trophy className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{a.context}</p>
          </div>
        ))}
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          <Plus className="h-4 w-4" /> Add achievement
        </button>
      </div>
    </div>
  );
}

function StepReview({ onEdit }: { onEdit: (n: number) => void }) {
  const completion = 92;
  const rows = [
    { n: 1, label: "Basic info", value: currentUser.name, ok: true },
    {
      n: 2,
      label: "Social links",
      value: `${socialLinks.filter((s) => s.value).length} added`,
      ok: true,
    },
    { n: 3, label: "Education", value: `${education.length} entries`, ok: true },
    { n: 4, label: "Experience", value: `${experience.length} roles`, ok: true },
    { n: 5, label: "Projects", value: `${projects.length} projects`, ok: true },
    {
      n: 6,
      label: "Skills",
      value: `${Object.values(skillsData).flat().length} tags across ${Object.keys(skillsData).length} categories`,
      ok: true,
    },
    { n: 7, label: "Certificates", value: `${certificates.length} certificates`, ok: true },
    { n: 8, label: "Achievements", value: `${achievements.length} entries`, ok: true },
  ];
  return (
    <div>
      <StepHeader
        eyebrow="Step 9 of 9"
        title="Review & finish"
        description="A quick summary before you enter your workspace."
      />
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16">
            <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeDasharray={`${(completion / 100) * 100.5} 100.5`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-[13px] font-semibold">
              {completion}%
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Profile complete</div>
            <div className="text-[12.5px] text-muted-foreground">
              Great start. You can refine anything anytime from your profile.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map((r) => (
          <div key={r.n} className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-success/15 text-success">
                <Check className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-[13px] font-medium">{r.label}</div>
                <div className="text-[12px] text-muted-foreground">{r.value}</div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onEdit(r.n)} className="text-[12px]">
              Edit
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
