import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  History,
  Sparkles,
  Wand2,
  Target,
  Shield,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/resume-analyzer")({
  head: () => ({ meta: [{ title: "Resume Analyzer — CVPilot" }] }),
  component: AnalyzerPage,
});

interface ATSReport {
  overallScore: number;
  scores: {
    keywords: number;
    skills: number;
    experience: number;
    education: number;
    formatting: number;
    readability: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  warnings: string[];
  detailedBreakdown: Array<{
    category: string;
    score: number;
    description: string;
  }>;
}

function AnalyzerPage() {
  const [vaultList, setVaultList] = useState<any[]>([]);
  const [flatVersions, setFlatVersions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<ATSReport | null>(null);

  // Load vault list on mount
  useEffect(() => {
    let mounted = true;
    api
      .get<any[]>("/vault")
      .then((res) => {
        if (!mounted) return;
        setVaultList(res || []);

        // Flatten versions for easy selection and lookup
        const flat = (res || []).flatMap((c) =>
          (c.roles || []).flatMap((r: any) =>
            (r.versions || []).map((v: any) => ({
              id: v.id,
              savedResumeId: v.savedResumeId,
              companyName: c.company,
              role: r.role,
              title: v.name,
              fullName: `${c.company} - ${r.role} (${v.name})`,
              ats: v.ats,
              date: new Date(v.date).toLocaleDateString(),
            })),
          ),
        );
        setFlatVersions(flat);

        // Pre-select the first version if available
        if (flat.length > 0) {
          setSelectedVersionId(flat[0].id);
          // Fetch latest ATS run on mount for this pre-selected version
          fetchLatestReport(flat[0].savedResumeId);
        }
        setHistoryLoading(false);
      })
      .catch(() => {
        if (mounted) setHistoryLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const fetchLatestReport = async (savedResumeId: string) => {
    if (!savedResumeId) return;
    try {
      const data = await api.get<ATSReport>(`/ats/latest/${savedResumeId}`);
      if (data && data.overallScore !== undefined) {
        setReport(data);
      }
    } catch {
      // ignore failures on default fetch
    }
  };

  const handleAnalyze = async () => {
    if (!selectedVersionId) {
      toast.error("Please select a resume version to analyze");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Please enter a target Job Description");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await api.post<ATSReport>("/ats/analyze", {
        resumeVersionId: selectedVersionId,
        jobDescription: jobDescription.trim(),
      });
      setReport(res);
      toast.success("ATS analysis completed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze resume");
    } finally {
      setAnalyzing(false);
    }
  };

  const selectVersionFromHistory = (id: string) => {
    setSelectedVersionId(id);
    const matched = flatVersions.find((v) => v.id === id);
    if (matched) {
      fetchLatestReport(matched.savedResumeId);
    }
  };

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Resume Analyzer"
        subtitle="Score resumes against real ATS rubrics and get precise, actionable feedback."
      />

      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* Left Column: Controls & History */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="editorial-card p-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="resume-select" className="text-[13px] font-semibold">
                Select Resume Version
              </Label>
              {historyLoading ? (
                <div className="h-10 w-full rounded-md border border-input bg-muted animate-pulse" />
              ) : flatVersions.length === 0 ? (
                <div className="text-[12.5px] text-muted-foreground py-2">
                  No resumes found in Vault. Please generate one first.
                </div>
              ) : (
                <Select value={selectedVersionId} onValueChange={selectVersionFromHistory}>
                  <SelectTrigger id="resume-select" className="w-full">
                    <SelectValue placeholder="Choose a resume..." />
                  </SelectTrigger>
                  <SelectContent>
                    {flatVersions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jd-input" className="text-[13px] font-semibold">
                Target Job Description
              </Label>
              <Textarea
                id="jd-input"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here..."
                className="min-h-[220px] resize-y text-[13px]"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !selectedVersionId}
              className="w-full h-10 gap-1.5 font-medium"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Scoring...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Run ATS Audit
                </>
              )}
            </Button>
          </div>

          {/* Upload History */}
          <div className="rounded-2xl border border-border bg-card shadow-subtle">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-[13px] font-semibold">
              <History className="h-3.5 w-3.5 text-muted-foreground" /> Vault History
            </div>
            {historyLoading ? (
              <div className="p-8 text-center text-[12.5px] text-muted-foreground flex flex-col items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mb-1 text-primary" /> Loading vault...
              </div>
            ) : flatVersions.length === 0 ? (
              <div className="p-8 text-center text-[12.5px] text-muted-foreground">
                No history entries found.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {flatVersions.slice(0, 5).map((h) => (
                  <li
                    key={h.id}
                    onClick={() => selectVersionFromHistory(h.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 px-5 py-3 text-[12.5px] cursor-pointer hover:bg-muted/40 transition-colors",
                      selectedVersionId === h.id &&
                        "bg-muted/80 font-medium border-l-2 border-primary",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {h.companyName} - {h.role}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {h.title} · {h.date}
                      </div>
                    </div>
                    {h.ats > 0 && (
                      <Badge variant="secondary" className="rounded-full text-[11px]">
                        {h.ats}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic ATS Report */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 text-center shadow-subtle min-h-[450px]"
              >
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <h3 className="text-[16px] font-semibold">Running ATS Rubric Analysis</h3>
                <p className="mt-1.5 max-w-sm text-[12.5px] text-muted-foreground">
                  Evaluating keyword overlap, skills categories, experience duration, education
                  matches, formatting rules, and readability metrics...
                </p>
              </motion.div>
            ) : !report ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card py-24 text-center shadow-subtle min-h-[450px]"
              >
                <FileSpreadsheet
                  className="h-12 w-12 text-muted-foreground/60 mb-4"
                  strokeWidth={1.5}
                />
                <h3 className="text-[16px] font-semibold">Awaiting ATS Run</h3>
                <p className="mt-1.5 max-w-xs text-[12.5px] text-muted-foreground">
                  Select a resume version from the left panel, paste the target Job Description, and
                  execute audit to see results.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Score Summary cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ScoreCard
                    title="Overall ATS Score"
                    value={report.overallScore}
                    tone={report.overallScore >= 80 ? "success" : "primary"}
                    hint={
                      report.overallScore >= 85
                        ? "Strong — Excellent JD alignment."
                        : report.overallScore >= 70
                          ? "Fair — Try editing to match missing keywords."
                          : "Action required — Low score."
                    }
                    icon={Shield}
                  />
                  <ScoreCard
                    title="Keyword match"
                    value={report.scores.keywords}
                    tone={report.scores.keywords >= 80 ? "success" : "primary"}
                    hint={`Matched ${report.matchedKeywords.length} of ${
                      report.matchedKeywords.length + report.missingKeywords.length
                    } extracted keywords.`}
                    icon={Target}
                  />
                </div>

                {/* Score breakdown bar */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle space-y-4">
                  <div className="text-[13px] font-semibold">Rubric Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Skills Match", value: report.scores.skills },
                      { label: "Experience Match", value: report.scores.experience },
                      { label: "Education Match", value: report.scores.education },
                      { label: "Formatting Rules", value: report.scores.formatting },
                      { label: "Readability Metrics", value: report.scores.readability },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                          <span>{item.label}</span>
                          <span>{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keywords comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle flex flex-col min-h-[160px]">
                    <div className="text-[12.5px] font-semibold text-success flex items-center gap-1.5 mb-3">
                      <CheckCircle2 className="h-4 w-4" /> Matched Keywords
                    </div>
                    {report.matchedKeywords.length === 0 ? (
                      <span className="text-[12px] text-muted-foreground">No matches found.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 content-start">
                        {report.matchedKeywords.map((k) => (
                          <Badge
                            key={k}
                            variant="secondary"
                            className="rounded-full text-[11px] bg-success/5 border-success/35 text-success font-normal"
                          >
                            {k}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle flex flex-col min-h-[160px]">
                    <div className="text-[12.5px] font-semibold text-warning flex items-center gap-1.5 mb-3">
                      <AlertCircle className="h-4 w-4" /> Missing Keywords
                    </div>
                    {report.missingKeywords.length === 0 ? (
                      <span className="text-[12px] text-muted-foreground">
                        All keywords matched!
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 content-start">
                        {report.missingKeywords.map((k) => (
                          <Badge
                            key={k}
                            variant="outline"
                            className="rounded-full text-[11px] bg-warning/5 border-warning/35 text-warning font-normal"
                          >
                            {k}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Warnings & Strengths audit */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle space-y-4">
                  <div className="text-[13px] font-semibold">Audit Checklists</div>
                  <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {report.strengths.slice(0, 4).map((str, idx) => (
                      <li
                        key={`str-${idx}`}
                        className="flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-[12.5px]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span className="text-foreground/85 leading-relaxed">{str}</span>
                      </li>
                    ))}
                    {report.warnings.slice(0, 4).map((warn, idx) => (
                      <li
                        key={`warn-${idx}`}
                        className="flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-[12.5px]"
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                        <span className="text-foreground/85 leading-relaxed">{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions and tips */}
                {report.suggestions.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
                    <div className="flex items-center gap-2 text-[13px] font-semibold mb-4">
                      <Wand2 className="h-3.5 w-3.5 text-primary" /> Actionable Recommendations
                    </div>
                    <ol className="space-y-3.5">
                      {report.suggestions.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                            {idx + 1}
                          </span>
                          <span className="text-[13px] leading-relaxed text-foreground/85">
                            {tip}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface ScoreCardProps {
  title: string;
  value: number;
  hint: string;
  tone: "primary" | "success";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

function ScoreCard({ title, value, hint, tone, icon: Icon }: ScoreCardProps) {
  const barTone = tone === "success" ? "bg-success" : "bg-primary";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[36px] font-semibold tracking-tight">{value}</span>
        <span className="text-[13px] text-muted-foreground">/ 100</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", barTone)} style={{ width: `${value}%` }} />
      </div>
      <div className="mt-2 text-[12px] text-muted-foreground">{hint}</div>
    </motion.div>
  );
}
