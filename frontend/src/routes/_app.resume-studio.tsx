import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  RotateCcw,
  Upload,
  Wand2,
  History,
  Building2,
  Briefcase,
  FileText,
  Download,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/resume-studio")({
  head: () => ({ meta: [{ title: "Resume Studio — CVPilot" }] }),
  component: ResumeStudioPage,
});

function ResumeStudioPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("Senior Frontend Engineer");
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<any>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [companyDesc, setCompanyDesc] = useState(
    "Google is a large, technical, product-driven company. Prefers concise, quantified impact and platform-scale thinking.",
  );
  const [jobDesc, setJobDesc] = useState(
    `About the role\nWe are looking for a senior frontend engineer to help us build the next generation of Google Cloud's console.\n\nWhat you'll do\n• Architect scalable, accessible interfaces used by millions of developers.\n• Partner with design on high-quality interactions.\n• Improve performance across critical rendering paths.\n\nWhat you'll bring\n• 5+ years of TypeScript / React experience.\n• Deep understanding of performance, a11y, and testing.\n• Experience with monorepos, design systems, and dev tools.\n\nBonus\n• GraphQL, Rust, or WebAssembly experience.\n• Contributions to open source.`,
  );

  const [validationError, setValidationError] = useState<{
    personalInfo: boolean;
    experiences: boolean;
    skills: boolean;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get<any>("/profile").catch(() => null),
      api.get<any[]>("/profile/experience").catch(() => []),
      api.get<any[]>("/profile/projects").catch(() => []),
      api.get<any[]>("/profile/skills").catch(() => []),
      api.get<any[]>("/vault").catch(() => []),
    ])
      .then(([profileData, expData, projData, skillData, vaultData]) => {
        if (!mounted) return;
        setProfile(profileData);
        setExperiences(expData || []);
        setProjects(projData || []);
        setSkills(skillData || []);

        if (vaultData) {
          const flat = vaultData.flatMap((c) =>
            c.roles.flatMap((r: any) =>
              r.versions.map((v: any) => ({
                id: v.id,
                label: `${c.company} · ${r.role} · ${v.name}`,
                ats: v.ats || 85,
                date: new Date(v.date || v.createdAt || Date.now()).toLocaleDateString(),
              })),
            ),
          );
          setHistory(flat.slice(0, 5));
        }
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerate = async () => {
    // 1. Validate profile completion
    const isNameMissing =
      !profile?.fullName ||
      profile.fullName.trim() === "" ||
      profile.fullName.trim() === "New User";
    const isExpMissing = experiences.length === 0;
    const isSkillsMissing = skills.length === 0;

    if (isNameMissing || isExpMissing || isSkillsMissing) {
      setValidationError({
        personalInfo: isNameMissing,
        experiences: isExpMissing,
        skills: isSkillsMissing,
      });
      return;
    }

    setValidationError(null);
    setIsGenerating(true);

    try {
      // 2. Call backend initiate endpoint
      const response = await api.post<any>("/workflow", {
        input: {
          companyName: company,
          targetRole: role,
          jobDescription: jobDesc,
        },
      });

      // 3. Navigate to workflow page
      navigate({
        to: "/workflow",
        search: { sessionId: response.id },
      });
    } catch (err: any) {
      alert(
        "Failed to initiate generation session: " + (err.response?.data?.message || err.message),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setCompany("Google");
    setRole("Senior Frontend Engineer");
    setCompanyDesc("");
    setJobDesc("");
    setValidationError(null);
  };

  const formatYear = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).getFullYear().toString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Resume Studio"
        subtitle="Paste a job, generate a precise resume, review it live."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button
              size="sm"
              className="gap-1.5 animate-pulse"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Generate resume
                </>
              )}
            </Button>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* LEFT FORM COLUMN */}
        <div className="col-span-12 space-y-4 lg:col-span-5">
          {/* Validation Alert Box */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-[13px] space-y-3 shadow-sm"
            >
              <div className="font-semibold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Profile Completion Required
              </div>
              <p className="text-muted-foreground leading-relaxed">
                You must complete the following sections in your Master Profile before generating a
                resume:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-foreground/80 font-medium">
                {validationError.personalInfo && (
                  <li>Personal Information (A valid name must be provided)</li>
                )}
                {validationError.experiences && (
                  <li>Experiences (At least one professional experience is required)</li>
                )}
                {validationError.skills && <li>Skills (At least one skill is required)</li>}
              </ul>
              <div className="pt-1.5 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => navigate({ to: "/profile" })}
                >
                  Edit Master Profile
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setValidationError(null)}>
                  Dismiss
                </Button>
              </div>
            </motion.div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
            <div className="text-[13px] font-semibold">Target role</div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Company</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-10 pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Role</Label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-10 pl-8"
                  />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-[12px]">
                  Company description <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  rows={3}
                  value={companyDesc}
                  onChange={(e) => setCompanyDesc(e.target.value)}
                  placeholder="A short note about the company's tone, values, product…"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-subtle">
            <Tabs defaultValue="paste">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="text-[13px] font-semibold">Job description</div>
                <TabsList className="h-8 bg-background">
                  <TabsTrigger value="paste" className="text-[12px]">
                    Paste
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="text-[12px]">
                    Upload
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="paste" className="p-5">
                <Textarea
                  rows={12}
                  className="resize-none font-mono text-[12.5px]"
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Paste the full job description text here..."
                />
                <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
                  <span>{jobDesc.length} characters</span>
                  <span className="flex items-center gap-1">
                    <Wand2 className="h-3 w-3" /> Auto-parse enabled
                  </span>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="p-5">
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background py-12 text-center">
                  <Upload className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                  <div className="mt-3 text-[13px] font-medium">Drop the JD file here</div>
                  <div className="mt-1 text-[12px] text-muted-foreground">
                    PDF, DOCX or TXT · up to 5MB
                  </div>
                  <Button size="sm" variant="outline" className="mt-4">
                    Browse files
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <History className="h-3.5 w-3.5 text-muted-foreground" /> Generation history
            </div>
            {loading ? (
              <div className="mt-4 text-center text-[12.5px] text-muted-foreground py-4 flex flex-col items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mb-1 text-primary" /> Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="mt-4 text-center text-[12px] text-muted-foreground py-2">
                No recent generations.
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {history.map((h, idx) => (
                  <li
                    key={h.id || idx}
                    className="flex items-center justify-between gap-2 py-2.5 text-[12.5px]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{h.label}</div>
                      <div className="text-[11px] text-muted-foreground">{h.date}</div>
                    </div>
                    <Badge variant="secondary" className="rounded-full text-[11px]">
                      ATS {h.ats}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT PREVIEW COLUMN */}
        <div className="col-span-12 space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-border bg-card shadow-subtle">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Master Profile Preview
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-[12px]"
                  onClick={() => navigate({ to: "/profile" })}
                >
                  Edit Master Profile
                </Button>
              </div>
            </div>
            <div className="p-5">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mx-auto aspect-[8.5/11] w-full max-w-[560px] rounded-lg border border-border bg-background p-8 shadow-soft overflow-y-auto max-h-[500px]"
              >
                <div className="text-center">
                  <div className="text-[18px] font-semibold tracking-tight">
                    {profile?.fullName || "Loading Name..."}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {user?.email || "your.email@example.com"}
                    {profile?.phone ? ` · ${profile.phone}` : ""}
                    {profile?.location ? ` · ${profile.location}` : ""}
                  </div>
                </div>
                <div className="mt-6 border-t border-border pt-4 text-left">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Experience
                  </div>
                  <div className="mt-3 space-y-3">
                    {loading ? (
                      <div className="text-[11px] text-muted-foreground py-2 text-center">
                        Loading...
                      </div>
                    ) : experiences.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground py-2 text-center">
                        No experiences listed. Complete your profile.
                      </div>
                    ) : (
                      experiences.slice(0, 2).map((x) => {
                        const start = x.startDate ? formatYear(x.startDate) : "";
                        const end = x.isCurrent
                          ? "Present"
                          : x.endDate
                            ? formatYear(x.endDate)
                            : "";
                        const range = [start, end].filter(Boolean).join(" – ");
                        return (
                          <div key={x.id}>
                            <div className="flex items-baseline justify-between">
                              <div className="text-[12px] font-semibold">
                                {x.role} · {x.companyName}
                              </div>
                              <div className="text-[10px] text-muted-foreground">{range}</div>
                            </div>
                            <ul className="mt-1 space-y-0.5">
                              {x.achievements &&
                                x.achievements.slice(0, 2).map((a: string) => (
                                  <li
                                    key={a}
                                    className="text-[10.5px] leading-relaxed text-foreground/80"
                                  >
                                    • {a}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4 text-left">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Projects
                  </div>
                  <div className="mt-3 space-y-2">
                    {loading ? (
                      <div className="text-[11px] text-muted-foreground py-2 text-center">
                        Loading...
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground py-2 text-center">
                        No projects listed. Complete your profile.
                      </div>
                    ) : (
                      projects.slice(0, 2).map((p) => (
                        <div key={p.id}>
                          <div className="text-[12px] font-semibold">{p.name}</div>
                          <div className="text-[10.5px] leading-relaxed text-foreground/80">
                            {p.description}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4 text-left">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Skills
                  </div>
                  <div className="mt-2 text-[10.5px] text-foreground/80">
                    {loading
                      ? "Loading..."
                      : skills.length === 0
                        ? "No skills listed. Complete your profile."
                        : skills.map((s) => s.name).join(" · ")}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  ATS readiness
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-[32px] font-semibold tracking-tight">
                    {skills.length > 0 && experiences.length > 0 ? "88" : "0"}
                  </span>
                  <span className="text-[13px] text-muted-foreground">/ 100</span>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full">
                {skills.length > 0 && experiences.length > 0 ? "Strong" : "Incomplete"}
              </Badge>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: skills.length > 0 && experiences.length > 0 ? "88%" : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
