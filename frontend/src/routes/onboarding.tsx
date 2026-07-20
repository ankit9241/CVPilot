/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  PlaneTakeoff,
  Plus,
  Trash2,
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../store/auth-store";
import { api } from "../lib/api";

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

// ─── shared state lifted to page level ───────────────────────────────────────
interface BasicData {
  fullName: string;
  phone: string;
  headline: string;
  location: string;
  summary: string;
}

function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const total = stepsMeta.length;
  const progress = Math.round((step / total) * 100);

  // Basic info state (step 1) — lifted so Save&Continue can POST it
  const [basic, setBasic] = useState<BasicData>({
    fullName: "",
    phone: "",
    headline: "",
    location: "",
    summary: "",
  });

  // Pre-fill from Google profile once user loads
  useEffect(() => {
    if (user) {
      setBasic({
        fullName: user.profile?.fullName ?? "",
        phone: user.profile?.phone ?? "",
        headline: user.profile?.headline ?? "",
        location: user.profile?.location ?? "",
        summary: (user.profile as any)?.summary ?? "",
      });
    }
  }, [user]);

  // Auth guards
  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
    if (!isLoading && isAuthenticated && (user?.profile?.completionPct ?? 0) > 0)
      navigate({ to: "/dashboard" });
  }, [isLoading, isAuthenticated, user, navigate]);

  // Save current step data then advance
  const handleNext = async () => {
    setSaving(true);
    try {
      if (step === 1) {
        await api.put("/profile", {
          fullName: basic.fullName,
          phone: basic.phone,
          headline: basic.headline,
          location: basic.location,
          summary: basic.summary,
        });
      }
      // For steps 2-8, data is saved inline via their own Add/Delete handlers
      setStep((s) => Math.min(total, s + 1));
    } catch {
      // non-blocking
      setStep((s) => Math.min(total, s + 1));
    } finally {
      setSaving(false);
    }
  };

  const prev = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    setFinishing(true);
    try {
      // Recalculate completion server-side
      const result: any = await api.get("/profile/completion");
      const pct = result?.completionPct ?? 100;
      await api.put("/profile", { completionPct: Math.max(pct, 10) });
    } catch {
      // non-blocking
    } finally {
      setFinishing(false);
      navigate({ to: "/dashboard" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <Button variant="ghost" size="sm" onClick={handleFinish} disabled={finishing}>
            Skip setup
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
        {/* Stepper sidebar */}
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
              {step === 1 && <StepBasic basic={basic} setBasic={setBasic} />}
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
                    <Button variant="ghost" size="sm" onClick={() => setStep((s) => s + 1)}>
                      Skip
                    </Button>
                  )}
                  {step < total ? (
                    <Button size="sm" onClick={handleNext} disabled={saving} className="gap-1.5">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Save & continue <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleFinish}
                      disabled={finishing}
                      className="gap-1.5"
                    >
                      {finishing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Finish setup
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

// ─── helpers ─────────────────────────────────────────────────────────────────

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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-8 text-center">
      <p className="text-[13px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

function StepBasic({ basic, setBasic }: { basic: any; setBasic: (v: any) => void }) {
  const { user } = useAuthStore();
  const initials = (basic.fullName || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setBasic({ ...basic, [k]: e.target.value });

  return (
    <div>
      <StepHeader
        eyebrow="Step 1 of 9"
        title="Basic information"
        description="This appears on every resume you generate."
      />
      <div className="mt-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <Avatar className="h-16 w-16 border border-border">
          {user?.profile?.avatarUrl && <AvatarImage src={user.profile.avatarUrl} />}
          <AvatarFallback className="bg-primary/10 text-[16px] font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-[13px] font-medium">Profile photo</div>
          <div className="text-[12px] text-muted-foreground">
            Synced from Google · 400×400px recommended
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input
            value={basic.fullName}
            onChange={set("fullName")}
            className="h-10"
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Email">
          <Input
            value={user?.email ?? ""}
            disabled
            className="h-10 cursor-not-allowed bg-muted/50"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={basic.phone}
            onChange={set("phone")}
            className="h-10"
            placeholder="+91 98765 43210"
          />
        </Field>
        <Field label="Current role / headline">
          <Input
            value={basic.headline}
            onChange={set("headline")}
            className="h-10"
            placeholder="e.g. Software Engineer"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Location">
            <Input
              value={basic.location}
              onChange={set("location")}
              className="h-10"
              placeholder="e.g. Bangalore, India"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Summary"
            hint="2–3 sentences about you. Will appear at the top of every resume."
          >
            <Textarea
              value={basic.summary}
              onChange={set("summary")}
              rows={3}
              className="resize-none"
              placeholder="I'm a product-minded engineer passionate about..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Social Links ─────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { key: "LINKEDIN", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { key: "GITHUB", label: "GitHub", placeholder: "https://github.com/..." },
  { key: "PORTFOLIO", label: "Portfolio", placeholder: "https://yoursite.com" },
  { key: "TWITTER", label: "Twitter / X", placeholder: "https://twitter.com/..." },
  { key: "LEETCODE", label: "LeetCode", placeholder: "https://leetcode.com/..." },
];

function StepSocial() {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Load existing
  useEffect(() => {
    api
      .get<any[]>("/profile/social-links")
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((l: any) => {
          map[l.platform] = l.url;
        });
        setLinks(map);
      })
      .catch(() => {});
  }, []);

  const saveLink = async (platform: string, url: string) => {
    if (!url.trim()) return;
    setSaving(platform);
    try {
      await api.post("/profile/social-links", { platform, url: url.trim() });
    } catch {
      // ignore duplicate / validation errors
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <StepHeader
        eyebrow="Step 2 of 9"
        title="Social links"
        description="Add the ones that matter. They auto-save when you move to the next field."
      />
      <div className="mt-8 space-y-3">
        {SOCIAL_PLATFORMS.map((s) => (
          <div
            key={s.key}
            className="grid grid-cols-[110px_1fr_auto] items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <Label className="text-[13px] font-medium">{s.label}</Label>
            <Input
              value={links[s.key] ?? ""}
              placeholder={s.placeholder}
              onChange={(e) => setLinks({ ...links, [s.key]: e.target.value })}
              onBlur={(e) => saveLink(s.key, e.target.value)}
              className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            {saving === s.key && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Education ────────────────────────────────────────────────────────

interface EduItem {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade: string;
}
const emptyEdu = (): EduItem => ({
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startYear: "",
  endYear: "",
  grade: "",
});

function StepEducation() {
  const [items, setItems] = useState<EduItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<EduItem>(emptyEdu());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<EduItem[]>("/profile/education"));
    } catch {}
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/profile/education", form);
      await load();
      setForm(emptyEdu());
      setAdding(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/profile/education/${id}`);
      await load();
    } catch {}
  };

  const set = (k: keyof EduItem) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <StepHeader
        eyebrow="Step 3 of 9"
        title="Education"
        description="Add every degree, bootcamp or programme worth mentioning."
      />
      <div className="mt-8 space-y-3">
        {items.length === 0 && !adding && (
          <EmptyState label="No education added yet — click below to add." />
        )}
        {items.map((e) => (
          <div
            key={e.id}
            className="group rounded-2xl border border-border bg-card p-5 shadow-subtle"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold">{e.institution}</div>
                <div className="mt-0.5 text-[13px] text-foreground/80">{e.degree}</div>
                <div className="text-[12px] text-muted-foreground">
                  {e.fieldOfStudy} · {e.startYear} – {e.endYear}
                  {e.grade ? ` · GPA ${e.grade}` : ""}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => e.id && remove(e.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {adding && (
          <div className="rounded-2xl border border-primary/40 bg-card p-5 shadow-subtle">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="School / University">
                <Input
                  value={form.institution}
                  onChange={set("institution")}
                  className="h-9"
                  placeholder="MIT"
                />
              </Field>
              <Field label="Degree">
                <Input
                  value={form.degree}
                  onChange={set("degree")}
                  className="h-9"
                  placeholder="B.Tech"
                />
              </Field>
              <Field label="Field of study">
                <Input
                  value={form.fieldOfStudy}
                  onChange={set("fieldOfStudy")}
                  className="h-9"
                  placeholder="Computer Science"
                />
              </Field>
              <Field label="GPA / Grade">
                <Input
                  value={form.grade}
                  onChange={set("grade")}
                  className="h-9"
                  placeholder="3.8"
                />
              </Field>
              <Field label="Start year">
                <Input
                  value={form.startYear}
                  onChange={set("startYear")}
                  className="h-9"
                  placeholder="2020"
                />
              </Field>
              <Field label="End year">
                <Input
                  value={form.endYear}
                  onChange={set("endYear")}
                  className="h-9"
                  placeholder="2024"
                />
              </Field>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3 w-3 animate-spin" />} Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Add education
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 4: Experience ───────────────────────────────────────────────────────

interface ExpItem {
  id?: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}
const emptyExp = (): ExpItem => ({
  company: "",
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
});

function StepExperience() {
  const [items, setItems] = useState<ExpItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ExpItem>(emptyExp());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<ExpItem[]>("/profile/experience"));
    } catch {}
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/profile/experience", form);
      await load();
      setForm(emptyExp());
      setAdding(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/profile/experience/${id}`);
      await load();
    } catch {}
  };

  const set =
    (k: keyof ExpItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <StepHeader
        eyebrow="Step 4 of 9"
        title="Experience"
        description="Every role, every impact — as a timeline you can edit."
      />
      <div className="relative mt-8 space-y-4 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-border">
        {items.length === 0 && !adding && (
          <EmptyState label="No experience added yet — click below to add." />
        )}
        {items.map((x) => (
          <div
            key={x.id}
            className="group relative rounded-2xl border border-border bg-card p-5 shadow-subtle"
          >
            <span className="absolute -left-6 top-6 grid h-4 w-4 place-items-center rounded-full border-2 border-primary bg-background" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold">{x.title}</div>
                <div className="text-[13px] text-muted-foreground">
                  {x.company}
                  {x.location ? ` · ${x.location}` : ""}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  {x.startDate} – {x.current ? "Present" : x.endDate}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => x.id && remove(x.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {x.description && (
              <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">{x.description}</p>
            )}
          </div>
        ))}

        {adding && (
          <div className="relative rounded-2xl border border-primary/40 bg-card p-5 shadow-subtle">
            <span className="absolute -left-6 top-6 grid h-4 w-4 place-items-center rounded-full border-2 border-dashed border-border bg-background" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Job title">
                <Input
                  value={form.title}
                  onChange={set("title")}
                  className="h-9"
                  placeholder="Software Engineer"
                />
              </Field>
              <Field label="Company">
                <Input
                  value={form.company}
                  onChange={set("company")}
                  className="h-9"
                  placeholder="Google"
                />
              </Field>
              <Field label="Location">
                <Input
                  value={form.location}
                  onChange={set("location")}
                  className="h-9"
                  placeholder="Remote / Bangalore"
                />
              </Field>
              <Field label="Start date">
                <Input
                  value={form.startDate}
                  onChange={set("startDate")}
                  className="h-9"
                  placeholder="Jan 2022"
                />
              </Field>
              <Field label="End date">
                <Input
                  value={form.endDate}
                  onChange={set("endDate")}
                  className="h-9"
                  placeholder="Present"
                  disabled={form.current}
                />
              </Field>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="current"
                  checked={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.checked })}
                  className="accent-primary"
                />
                <label htmlFor="current" className="text-[13px]">
                  Currently working here
                </label>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description / achievements">
                  <Textarea
                    value={form.description}
                    onChange={set("description")}
                    rows={3}
                    className="resize-none"
                    placeholder="Describe your responsibilities and impact..."
                  />
                </Field>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3 w-3 animate-spin" />} Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="relative flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <span className="absolute -left-6 top-1/2 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full border-2 border-dashed border-border bg-background" />
            <Plus className="h-4 w-4" /> Add experience
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 5: Projects ─────────────────────────────────────────────────────────

interface ProjItem {
  id?: string;
  name: string;
  role: string;
  description: string;
  techStack: string;
  githubUrl: string;
  liveUrl: string;
  startDate: string;
  endDate: string;
}
const emptyProj = (): ProjItem => ({
  name: "",
  role: "",
  description: "",
  techStack: "",
  githubUrl: "",
  liveUrl: "",
  startDate: "",
  endDate: "",
});

function StepProjects() {
  const [items, setItems] = useState<ProjItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ProjItem>(emptyProj());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<ProjItem[]>("/profile/projects"));
    } catch {}
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const techStackArr = form.techStack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await api.post("/profile/projects", { ...form, techStack: techStackArr });
      await load();
      setForm(emptyProj());
      setAdding(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/profile/projects/${id}`);
      await load();
    } catch {}
  };

  const set =
    (k: keyof ProjItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <StepHeader
        eyebrow="Step 5 of 9"
        title="Projects"
        description="Ship-worthy work you want recruiters to see."
      />
      <div className="mt-8 grid grid-cols-1 gap-3">
        {items.length === 0 && !adding && (
          <EmptyState label="No projects added yet — click below to add." />
        )}
        {items.map((p) => (
          <div
            key={p.id}
            className="group rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all hover:shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold">{p.name}</div>
                <div className="text-[12px] text-muted-foreground">{p.role}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => p.id && remove(p.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {p.description}
            </p>
            {p.techStack && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(Array.isArray(p.techStack) ? p.techStack : String(p.techStack).split(",")).map(
                  (t: string) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="rounded-full text-[11px] font-normal"
                    >
                      {t.trim()}
                    </Badge>
                  ),
                )}
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="rounded-2xl border border-primary/40 bg-card p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Project name">
                <Input
                  value={form.name}
                  onChange={set("name")}
                  className="h-9"
                  placeholder="CVPilot"
                />
              </Field>
              <Field label="Your role">
                <Input
                  value={form.role}
                  onChange={set("role")}
                  className="h-9"
                  placeholder="Full-stack Developer"
                />
              </Field>
              <Field label="Start date">
                <Input
                  value={form.startDate}
                  onChange={set("startDate")}
                  className="h-9"
                  placeholder="Jun 2023"
                />
              </Field>
              <Field label="End date">
                <Input
                  value={form.endDate}
                  onChange={set("endDate")}
                  className="h-9"
                  placeholder="Present"
                />
              </Field>
              <Field label="GitHub URL">
                <Input
                  value={form.githubUrl}
                  onChange={set("githubUrl")}
                  className="h-9"
                  placeholder="https://github.com/..."
                />
              </Field>
              <Field label="Live URL">
                <Input
                  value={form.liveUrl}
                  onChange={set("liveUrl")}
                  className="h-9"
                  placeholder="https://..."
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Tech stack" hint="Comma-separated: React, Node.js, PostgreSQL">
                  <Input
                    value={form.techStack}
                    onChange={set("techStack")}
                    className="h-9"
                    placeholder="React, TypeScript, PostgreSQL"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <Textarea
                    value={form.description}
                    onChange={set("description")}
                    rows={3}
                    className="resize-none"
                    placeholder="What problem did it solve? What was the impact?"
                  />
                </Field>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3 w-3 animate-spin" />} Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Add project
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 6: Skills ───────────────────────────────────────────────────────────

const SKILL_CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Cloud",
  "DevOps",
  "AI",
  "Language",
  "Tool",
  "Soft",
  "Other",
];

function StepSkills() {
  const [skills, setSkills] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("Frontend");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setSkills(await api.get<any[]>("/profile/skills"));
    } catch {}
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const addSkill = async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      await api.post("/profile/skills", { name: input.trim(), category: category.toUpperCase() });
      await load();
      setInput("");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const removeSkill = async (id: string) => {
    try {
      await api.delete(`/profile/skills/${id}`);
      await load();
    } catch {}
  };

  const grouped = SKILL_CATEGORIES.reduce(
    (acc, cat) => {
      const items = skills.filter((s) => s.category.toUpperCase() === cat.toUpperCase());
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<string, typeof skills>,
  );

  return (
    <div>
      <StepHeader
        eyebrow="Step 6 of 9"
        title="Skills"
        description="Add your skills grouped by category."
      />
      <div className="mt-8 space-y-4">
        {/* Add skill input */}
        <div className="flex gap-2 rounded-2xl border border-border bg-card p-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-[12px] text-foreground"
          >
            {SKILL_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Type skill name + Enter"
            className="h-9 flex-1"
          />
          <Button size="sm" onClick={addSkill} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}{" "}
            Add
          </Button>
        </div>

        {skills.length === 0 && <EmptyState label="No skills added yet." />}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-[13px] font-semibold">{cat}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[12px]"
                >
                  {s.name}
                  <button
                    onClick={() => removeSkill(s.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${s.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 7: Certificates ─────────────────────────────────────────────────────

interface CertItem {
  id?: string;
  name: string;
  issuingOrg: string;
  issueDate: string;
  credentialId: string;
  credentialUrl: string;
}
const emptyCert = (): CertItem => ({
  name: "",
  issuingOrg: "",
  issueDate: "",
  credentialId: "",
  credentialUrl: "",
});

function StepCertificates() {
  const [items, setItems] = useState<CertItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<CertItem>(emptyCert());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<CertItem[]>("/profile/certificates"));
    } catch {}
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/profile/certificates", form);
      await load();
      setForm(emptyCert());
      setAdding(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/profile/certificates/${id}`);
      await load();
    } catch {}
  };

  const set = (k: keyof CertItem) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <StepHeader
        eyebrow="Step 7 of 9"
        title="Certificates"
        description="Add credentials you've earned."
      />
      <div className="mt-8 space-y-3">
        {items.length === 0 && !adding && <EmptyState label="No certificates added yet." />}
        {items.map((c) => (
          <div
            key={c.id}
            className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div>
              <div className="text-[14px] font-semibold">{c.name}</div>
              <div className="text-[12.5px] text-muted-foreground">
                {c.issuingOrg} · {c.issueDate}
              </div>
              {c.credentialId && (
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  ID: {c.credentialId}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => c.id && remove(c.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {adding && (
          <div className="rounded-2xl border border-primary/40 bg-card p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Certificate name">
                <Input
                  value={form.name}
                  onChange={set("name")}
                  className="h-9"
                  placeholder="AWS Solutions Architect"
                />
              </Field>
              <Field label="Issuing organisation">
                <Input
                  value={form.issuingOrg}
                  onChange={set("issuingOrg")}
                  className="h-9"
                  placeholder="Amazon Web Services"
                />
              </Field>
              <Field label="Issue date">
                <Input
                  value={form.issueDate}
                  onChange={set("issueDate")}
                  className="h-9"
                  placeholder="Mar 2024"
                />
              </Field>
              <Field label="Credential ID">
                <Input
                  value={form.credentialId}
                  onChange={set("credentialId")}
                  className="h-9"
                  placeholder="ABC-12345"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Credential URL">
                  <Input
                    value={form.credentialUrl}
                    onChange={set("credentialUrl")}
                    className="h-9"
                    placeholder="https://..."
                  />
                </Field>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3 w-3 animate-spin" />} Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-6 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Add certificate
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 8: Achievements ─────────────────────────────────────────────────────

interface AchItem {
  id?: string;
  title: string;
  date: string;
  description: string;
}
const emptyAch = (): AchItem => ({ title: "", date: "", description: "" });

function StepAchievements() {
  const [items, setItems] = useState<AchItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AchItem>(emptyAch());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<AchItem[]>("/profile/achievements"));
    } catch {}
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/profile/achievements", form);
      await load();
      setForm(emptyAch());
      setAdding(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/profile/achievements/${id}`);
      await load();
    } catch {}
  };

  const set =
    (k: keyof AchItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <StepHeader
        eyebrow="Step 8 of 9"
        title="Achievements"
        description="Awards, honours, moments that shaped your career."
      />
      <div className="mt-8 grid grid-cols-1 gap-3">
        {items.length === 0 && !adding && <EmptyState label="No achievements added yet." />}
        {items.map((a) => (
          <div key={a.id} className="group rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold">{a.title}</div>
                <div className="text-[12.5px] text-muted-foreground">{a.date}</div>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => a.id && remove(a.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {a.description && (
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {a.description}
              </p>
            )}
          </div>
        ))}

        {adding && (
          <div className="rounded-2xl border border-primary/40 bg-card p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Achievement title">
                  <Input
                    value={form.title}
                    onChange={set("title")}
                    className="h-9"
                    placeholder="Best Paper Award · IEEE 2024"
                  />
                </Field>
              </div>
              <Field label="Date">
                <Input
                  value={form.date}
                  onChange={set("date")}
                  className="h-9"
                  placeholder="Dec 2024"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Context / description">
                  <Textarea
                    value={form.description}
                    onChange={set("description")}
                    rows={2}
                    className="resize-none"
                    placeholder="Briefly describe the achievement..."
                  />
                </Field>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3 w-3 animate-spin" />} Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Add achievement
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 9: Review ───────────────────────────────────────────────────────────

function StepReview({ onEdit }: { onEdit: (n: number) => void }) {
  const { user } = useAuthStore();
  const [counts, setCounts] = useState({
    social: 0,
    edu: 0,
    exp: 0,
    proj: 0,
    skills: 0,
    certs: 0,
    ach: 0,
  });
  const [completion, setCompletion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [social, edu, exp, proj, skills, certs, ach, comp] = await Promise.all([
          api.get<any[]>("/profile/social-links").catch(() => []),
          api.get<any[]>("/profile/education").catch(() => []),
          api.get<any[]>("/profile/experience").catch(() => []),
          api.get<any[]>("/profile/projects").catch(() => []),
          api.get<any[]>("/profile/skills").catch(() => []),
          api.get<any[]>("/profile/certificates").catch(() => []),
          api.get<any[]>("/profile/achievements").catch(() => []),
          api.get<any>("/profile/completion").catch(() => ({ completionPct: 0 })),
        ]);
        setCounts({
          social: social.length,
          edu: edu.length,
          exp: exp.length,
          proj: proj.length,
          skills: skills.length,
          certs: certs.length,
          ach: ach.length,
        });
        setCompletion(comp?.completionPct ?? 0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rows = [
    { n: 1, label: "Basic info", value: user?.profile?.fullName || user?.email || "—" },
    { n: 2, label: "Social links", value: `${counts.social} added` },
    { n: 3, label: "Education", value: `${counts.edu} ${counts.edu === 1 ? "entry" : "entries"}` },
    { n: 4, label: "Experience", value: `${counts.exp} ${counts.exp === 1 ? "role" : "roles"}` },
    {
      n: 5,
      label: "Projects",
      value: `${counts.proj} ${counts.proj === 1 ? "project" : "projects"}`,
    },
    { n: 6, label: "Skills", value: `${counts.skills} skills` },
    { n: 7, label: "Certificates", value: `${counts.certs} certificates` },
    {
      n: 8,
      label: "Achievements",
      value: `${counts.ach} ${counts.ach === 1 ? "entry" : "entries"}`,
    },
  ];

  return (
    <div>
      <StepHeader
        eyebrow="Step 9 of 9"
        title="Review & finish"
        description="A quick summary before you enter your workspace."
      />
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-subtle">
        {loading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">
              Calculating profile completion…
            </span>
          </div>
        ) : (
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
        )}
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
