import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wand2,
  Target,
  Shield,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
  UploadCloud,
  FileText,
  User,
  MessageSquare,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  ListChecks,
  Award,
  Zap,
  Briefcase,
  GraduationCap,
  AlignLeft,
  FileCheck,
  RotateCcw,
  SlidersHorizontal,
  ThumbsUp,
  HelpCircle,
  FileCode,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { QuotaBadge } from "@/components/shared/quota-badge";
import { useUsage } from "@/hooks/use-usage";
import { useLimitModalStore } from "@/store/limit-modal-store";
import {
  AnalysisProgressPanel,
  AnalysisStepItem,
  INITIAL_ANALYSIS_STEPS,
  StepStatus,
} from "@/components/resume-analyzer/analysis-progress-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/resume-analyzer")({
  head: () => ({ meta: [{ title: "Resume Analyzer - CVPilot" }] }),
  component: AnalyzerPage,
});

interface ATSScoreBreakdown {
  parseability: number;
  formatting: number;
  keywordMatch: number;
  skillsMatch: number;
  experienceRelevance: number;
  education: number;
  grammarSpelling: number;
  readability: number;
  impact: number;
}

interface ATSReport {
  overallScore: number;
  scoreBreakdown: ATSScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  warnings: string[];
  errors: string[];
  strengths: string[];
  notApplicable?: Array<keyof ATSScoreBreakdown>;
  applicableCategories?: Array<keyof ATSScoreBreakdown>;
  detailedBreakdown: Array<{
    category: string;
    score: number;
    max: number;
    description: string;
    reason?: string;
    deductions?: string[];
    evidence?: string[];
  }>;
  recruiterFeedback?: {
    strengths: string[];
    weaknesses: string[];
    recruiterComments: string[];
    topImprovements: string[];
    keywordRecommendations: string[];
    formattingAdvice: string[];
  };
}

type EngineResult<T> =
  | { status: "success"; data: T }
  | { status: "failed"; error: string; data: null };

interface QualityReport {
  overallQualityScore: number;
  writingQuality: number;
  professionalTone: number;
  conciseness: number;
  readability: number;
  consistency: number;
  impact: number;
  redundancy: number;
  strengths: string[];
  weaknesses: string[];
  quickWins: string[];
  professionalReview: string;
}

interface RecruiterReview {
  firstImpression: string;
  interviewRecommendation: string;
  hiringConfidence: number;
  strengths: string[];
  weaknesses: string[];
  biggestConcerns: string[];
  topImprovements: string[];
  likelyInterviewQuestions: string[];
}

interface AnalysisResult {
  ats: EngineResult<ATSReport>;
  quality: EngineResult<QualityReport>;
  recruiter: EngineResult<RecruiterReview>;
}

const MAX_SIZE_MB = 10;
const STORAGE_KEY = "cvpilot_analyzer_session_v1";

const DEFAULT_JOB_DESCRIPTION = `Full Stack Developer - AI & SaaS

Location: Remote
Experience: 1–3 years

About the Role

We are looking for a Full Stack Developer to build and maintain modern,
scalable web applications and AI-powered SaaS products. You will work
across frontend, backend, APIs, databases, cloud infrastructure, and
AI-integrated workflows.

Responsibilities

• Build responsive and production-ready web applications using React.js,
  Next.js, TypeScript, and Tailwind CSS.
• Develop scalable backend services and RESTful APIs using Node.js and
  Express.js.
• Design authentication and authorization systems using JWT, RBAC, and
  secure middleware.
• Work with MongoDB and Redis for application data, caching, and query
  optimization.
• Integrate third-party APIs and services into production applications.
• Build and deploy cloud-based applications using AWS and modern
  deployment platforms.
• Develop AI-powered application features using APIs and AI/ML services.
• Work with media-processing pipelines and tools such as FFmpeg when
  required.
• Implement secure file-upload and storage workflows using cloud object
  storage and pre-signed URLs.
• Integrate payment systems and third-party SaaS services.
• Monitor and optimize application performance, API responsiveness,
  database queries, and overall user experience.
• Collaborate with product and design stakeholders to translate
  requirements into reliable production features.

Required Qualifications

• 1–3 years of hands-on software development experience through
  professional work, internships, or substantial production projects.
• Strong JavaScript and TypeScript fundamentals.
• Strong experience with React.js and Next.js.
• Backend development experience with Node.js and Express.js.
• Experience designing and consuming RESTful APIs.
• Experience with MongoDB or another NoSQL database.
• Understanding of Redis caching and database query optimization.
• Experience implementing JWT authentication and role-based access
  control.
• Familiarity with Git and GitHub.
• Strong understanding of responsive web development.
• Ability to build and deploy production-ready applications.

Preferred Qualifications

• Experience building AI-powered applications.
• Experience with generative AI APIs or AI/ML services.
• Experience with AWS S3 and pre-signed URLs.
• Experience with Stripe or other payment gateways.
• Experience with FFmpeg or video-processing pipelines.
• Experience deploying GPU-intensive workloads or serverless workloads.
• Experience with Python.
• Experience with SQL databases such as MySQL or PostgreSQL.
• Experience with automated testing and CI/CD.
• Experience working on SaaS products.

Nice to Have

• Experience with real-time applications.
• Experience with WebSockets.
• Experience with Docker and containerized deployments.
• Experience with GraphQL.
• Experience with Kubernetes or cloud orchestration.
• Experience designing systems for high-volume or concurrent users.`;

type ViewTab = "action_plan" | "skills_matrix" | "rubric" | "quality";

interface PersistedState {
  fileInfo: { name: string; size: number } | null;
  jobDescription: string;
  result: AnalysisResult | null;
  activeTab: ViewTab;
}

function AnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const { isLimitReached, getFeatureQuota, refetch: refetchUsage } = useUsage();
  const { openLimitModal } = useLimitModalStore();

  // Restore persisted state on mount to survive page refreshes
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        return parsed.fileInfo || null;
      }
    } catch { }
    return null;
  });

  const [jobDescription, setJobDescription] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_JOB_DESCRIPTION;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        if (typeof parsed.jobDescription === "string") return parsed.jobDescription;
      }
    } catch { }
    return DEFAULT_JOB_DESCRIPTION;
  });

  const [result, setResult] = useState<AnalysisResult | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        return parsed.result || null;
      }
    } catch { }
    return null;
  });

  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    if (typeof window === "undefined") return "action_plan";
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        if (parsed.activeTab) return parsed.activeTab;
      }
    } catch { }
    return "action_plan";
  });

  const [isJdExpanded, setIsJdExpanded] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywordSearch, setKeywordSearch] = useState<string>("");
  const [keywordFilter, setKeywordFilter] = useState<"all" | "matched" | "missing">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStepItem[]>(
    INITIAL_ANALYSIS_STEPS.map((s) => ({ ...s, status: "pending" }))
  );

  // Sync state to sessionStorage whenever key state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload: PersistedState = {
        fileInfo,
        jobDescription,
        result,
        activeTab,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to persist analyzer state to sessionStorage:", e);
    }
  }, [fileInfo, jobDescription, result, activeTab]);

  const onDrop = (accepted: File[]) => {
    const f = accepted?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
    setFileInfo({ name: f.name, size: f.size });
    setResult(null);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    multiple: false,
    noClick: !!(file || fileInfo), // Prevent double clicks on custom replace button
    maxSize: MAX_SIZE_MB * 1024 * 1024,
  });

  const handleReset = () => {
    setFile(null);
    setFileInfo(null);
    setResult(null);
    setError(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch { }
    toast.info("Cleared resume analysis. Upload a new resume to start.");
  };

  const handleAnalyze = async () => {
    if (!file) {
      if (fileInfo && result) {
        toast.info("Please select or drop the resume file to re-run live analysis.");
        openFileDialog();
        return;
      }
      toast.error("Please upload a resume (PDF or DOCX) first");
      return;
    }

    const atsQuota = getFeatureQuota("ATS_ANALYSIS");
    if (atsQuota.isExhausted) {
      openLimitModal({
        feature: "ATS_ANALYSIS",
        used: atsQuota.used,
        limit: atsQuota.limit,
        remaining: 0,
        resetAt: atsQuota.resetAt,
      });
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    const initialSteps: AnalysisStepItem[] = INITIAL_ANALYSIS_STEPS.map((s, idx) => ({
      ...s,
      status: idx === 0 ? "active" : "pending",
    }));
    setAnalysisSteps(initialSteps);

    const form = new FormData();
    form.append("resumeFile", file);
    if (jobDescription.trim()) form.append("jobDescription", jobDescription.trim());

    let receivedCompleteData: AnalysisResult | null = null;
    let hasStreamError = false;

    try {
      await api.postStream<
        | { type: "step"; stepId: string; status: StepStatus; error?: string }
        | { type: "complete"; data: AnalysisResult }
        | { type: "error"; error: string }
      >("/resume-analyzer/analyze-stream", form, (evt) => {
        if (evt.type === "step") {
          setAnalysisSteps((prev) =>
            prev.map((s) => {
              if (s.id === evt.stepId) {
                return { ...s, status: evt.status, errorDetail: evt.error };
              }
              return s;
            })
          );
        } else if (evt.type === "complete") {
          receivedCompleteData = evt.data;
          setAnalysisSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
          setResult(evt.data);
          toast.success("Analysis complete");
        } else if (evt.type === "error") {
          hasStreamError = true;
          setError(evt.error);
          setAnalysisSteps((prev) =>
            prev.map((s) =>
              s.status === "active"
                ? { ...s, status: "error", errorDetail: evt.error }
                : s
            )
          );
        }
      });

      if (!receivedCompleteData && !hasStreamError) {
        const res = await api.post<AnalysisResult>("/resume-analyzer/analyze", form);
        if (!res.ats) {
          setError("ATS analysis failed. Please try again.");
          setAnalysisSteps((prev) =>
            prev.map((s) => (s.status === "active" ? { ...s, status: "error" } : s))
          );
        } else {
          setAnalysisSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
          setResult(res);
          toast.success("Analysis complete");
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || "Failed to analyze resume";
      setError(errMsg);
      setAnalysisSteps((prev) =>
        prev.map((s) =>
          s.status === "active" ? { ...s, status: "error", errorDetail: errMsg } : s
        )
      );
    } finally {
      setAnalyzing(false);
      refetchUsage();
    }
  };

  const copyToClipboard = (text: string, id: string, label: string = "Copied to clipboard") => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyFullActionPlan = (
    recommendations: string[],
    quickWins: string[],
    firstImpression?: string
  ) => {
    const lines: string[] = ["# ATS Resume Action Plan\n"];
    if (firstImpression) {
      lines.push(`## Recruiter Assessment\n${firstImpression}\n`);
    }
    if (recommendations.length > 0) {
      lines.push("## High-Impact Recommendations");
      recommendations.forEach((rec, idx) => {
        lines.push(`${idx + 1}. ${rec}`);
      });
      lines.push("");
    }
    if (quickWins.length > 0) {
      lines.push("## Quick Wins (Writing & Verbs)");
      quickWins.forEach((qw) => {
        lines.push(`- ${qw}`);
      });
      lines.push("");
    }

    copyToClipboard(lines.join("\n"), "full_plan", "Full Action Plan copied to clipboard!");
  };

  const activeFileName = file?.name || fileInfo?.name || "";
  const activeFileSize = file?.size || fileInfo?.size || 0;

  return (
    <div className="container-page py-6 lg:py-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        category="ATS MATRIX & RECRUITER INTELLIGENCE"
        title="Resume Analyzer"
        subtitle="Get instant deterministic ATS scoring, recruiter review, and high-impact sentence revisions."
        actions={<QuotaBadge feature="ATS_ANALYSIS" />}
      />

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & JD Configuration */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 space-y-4 shadow-soft">
            {/* File Upload / Selected File Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-mono text-[10.5px] uppercase tracking-widest text-[#18181B]/60 font-medium">
                  1. Resume File
                </Label>
                {(file || fileInfo) && (
                  <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/5 font-mono">
                    {result ? "Analyzed" : "Ready to analyze"}
                  </Badge>
                )}
              </div>

              {file || fileInfo ? (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[rgba(55,50,47,0.14)] bg-[#F8F6F3]/60 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-[#18181B] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#18181B] truncate">{activeFileName}</p>
                      <p className="text-[11px] text-[#18181B]/55 font-mono">
                        {(activeFileSize / 1024 / 1024).toFixed(2)} MB · {activeFileName.split(".").pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={openFileDialog}
                      className="h-8 text-[11.5px] text-[#18181B]/70 hover:text-[#18181B] px-2 cursor-pointer"
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      title="Clear resume analysis"
                      className="h-8 w-8 p-0 text-[#18181B]/50 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(55,50,47,0.16)] bg-[#F8F6F3]/50 p-6 text-center transition-all hover:border-[#18181B]/40 hover:bg-[#F8F6F3]",
                    isDragActive && "border-[#18181B] bg-[#18181B]/5"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="h-10 w-10 rounded-full bg-[#18181B]/5 flex items-center justify-center text-[#18181B]/70 mb-2">
                    <UploadCloud className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="text-[12.5px] font-semibold text-[#18181B]">Click or drag resume here</p>
                  <p className="text-[11px] text-[#18181B]/50 font-mono mt-0.5">PDF or DOCX up to {MAX_SIZE_MB}MB</p>
                </div>
              )}
            </div>

            {/* Target Job Description Section (Collapsible & Compact) */}
            <div className="space-y-2 pt-2 border-t border-[rgba(55,50,47,0.08)]">
              <div
                onClick={() => setIsJdExpanded(!isJdExpanded)}
                className="flex items-center justify-between cursor-pointer py-1 select-none group"
              >
                <div className="flex items-center gap-2">
                  <Label className="font-mono text-[10.5px] uppercase tracking-widest text-[#18181B]/60 font-medium cursor-pointer">
                    2. Target Job Description
                  </Label>
                  <span className="text-[11px] text-[#18181B]/40 font-normal">(Optional)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#18181B]/60 group-hover:text-[#18181B]">
                  <span>{isJdExpanded ? "Collapse" : "Edit JD"}</span>
                  {isJdExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </div>

              {!isJdExpanded ? (
                <div
                  onClick={() => setIsJdExpanded(true)}
                  className="cursor-pointer p-3 rounded-xl border border-[rgba(55,50,47,0.1)] bg-[#F8F6F3]/40 hover:bg-[#F8F6F3] transition-colors flex items-center justify-between text-[12px]"
                >
                  <div className="flex items-center gap-2 text-[#18181B]/75 truncate">
                    <Target className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                    <span className="font-medium truncate">
                      {jobDescription.trim() ? jobDescription.split("\n")[0] || "Custom Job Description" : "No Job Description (General Assessment)"}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#18181B]/40 shrink-0 ml-2">
                    {jobDescription.trim() ? `${jobDescription.split(/\s+/).length} words` : "Add"}
                  </span>
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in-50 duration-200">
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description to score keyword & experience match..."
                    className="min-h-[160px] max-h-[280px] resize-y text-[12px] font-sans leading-relaxed rounded-xl border border-[rgba(55,50,47,0.14)] bg-[#F8F6F3] p-3 text-[#18181B] focus:bg-[#FFFEFC]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#18181B]/50 font-mono">
                    <span>{jobDescription.split(/\s+/).filter(Boolean).length} words</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setJobDescription("")}
                        className="hover:text-[#18181B] underline underline-offset-2 cursor-pointer"
                      >
                        Clear
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setJobDescription(DEFAULT_JOB_DESCRIPTION)}
                        className="hover:text-[#18181B] underline underline-offset-2 cursor-pointer"
                      >
                        Sample JD
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || (!file && !fileInfo)}
              className="w-full h-11 text-[13px] font-semibold rounded-xl bg-[#18181B] text-white hover:bg-[#27272A] shadow-soft transition-all duration-200 gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Analyzing Resume...
                </>
              ) : isLimitReached("ATS_ANALYSIS") ? (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-300" />
                  Monthly Limit Reached (0 left)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  {result ? "Re-Analyze Resume" : "Run Comprehensive Analysis"}
                </>
              )}
            </Button>

            {/* Quota Banner */}
            <QuotaBadge feature="ATS_ANALYSIS" variant="banner" />
          </div>
        </div>

        {/* Right Column: Dashboard & Interactive Tabs */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <AnimatePresence mode="wait">
            {analyzing || (error && !result) || analysisSteps.some((s) => s.status === "error") ? (
              <AnalysisProgressPanel
                key="progress"
                steps={analysisSteps}
                hasError={!!error || analysisSteps.some((s) => s.status === "error")}
                errorMessage={error}
                onRetry={handleAnalyze}
              />
            ) : !result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] py-20 px-6 text-center shadow-soft min-h-[460px]"
              >
                <div className="h-14 w-14 rounded-2xl bg-[#18181B]/5 flex items-center justify-center text-[#18181B]/60 mb-4 shadow-subtle">
                  <Sparkles className="h-7 w-7 text-[#18181B]/70" strokeWidth={1.5} />
                </div>
                <h3 className="text-[17px] font-semibold text-[#18181B]">Deterministic ATS & Recruiter Intelligence</h3>
                <p className="mt-2 max-w-md text-[13px] text-[#18181B]/60 leading-relaxed">
                  Upload your resume on the left to get a comprehensive breakdown: overall ATS score, verified keywords, recruiter hiring confidence, and targeted sentence revisions.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="secondary" className="text-[11px] rounded-full px-3 py-1 font-normal bg-[#F4F1EC] text-[#18181B]/70 border-0">
                    ✓ Anti-Hallucination Grounding
                  </Badge>
                  <Badge variant="secondary" className="text-[11px] rounded-full px-3 py-1 font-normal bg-[#F4F1EC] text-[#18181B]/70 border-0">
                    ✓ Deterministic Quality Rubric
                  </Badge>
                  <Badge variant="secondary" className="text-[11px] rounded-full px-3 py-1 font-normal bg-[#F4F1EC] text-[#18181B]/70 border-0">
                    ✓ Concrete Bullet Edits
                  </Badge>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result-dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {(() => {
                  const ats = result.ats.status === "success" ? result.ats.data : null;
                  const quality = result.quality.status === "success" ? result.quality.data : null;
                  const recruiter = result.recruiter.status === "success" ? result.recruiter.data : null;
                  const notApplicable = ats?.notApplicable ?? [];
                  const noJd = notApplicable.includes("keywordMatch");

                  const matchedCount = ats?.matchedKeywords?.length ?? 0;
                  const missingCount = ats?.missingKeywords?.length ?? 0;
                  const actionableTips = ats?.recruiterFeedback?.topImprovements ?? recruiter?.topImprovements ?? [];
                  const quickWins = quality?.quickWins ?? [];

                  return (
                    <>
                      {/* Top Executive Health Card (Scores & Verdict) */}
                      <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 shadow-soft space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(55,50,47,0.08)]">
                          {/* 1. Overall ATS Score */}
                          <div className="flex items-center gap-4">
                            <CircularScoreDial
                              score={ats?.overallScore ?? 0}
                              max={100}
                              size={72}
                              strokeWidth={7}
                              color={
                                (ats?.overallScore ?? 0) >= 80
                                  ? "#10B981"
                                  : (ats?.overallScore ?? 0) >= 65
                                    ? "#F59E0B"
                                    : "#EF4444"
                              }
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12px] font-mono uppercase tracking-wider text-[#18181B]/55 font-semibold">
                                  ATS Score
                                </span>
                              </div>
                              <p className="text-[13px] font-semibold text-[#18181B]">
                                {noJd
                                  ? "Structural Baseline"
                                  : (ats?.overallScore ?? 0) >= 85
                                    ? "Strong Alignment"
                                    : (ats?.overallScore ?? 0) >= 70
                                      ? "Fair Match"
                                      : "Needs Optimization"}
                              </p>
                              <p className="text-[11px] text-[#18181B]/55">
                                {noJd ? "Job-agnostic structure" : `${matchedCount} of ${matchedCount + missingCount} keywords`}
                              </p>
                            </div>
                          </div>

                          {/* 2. Resume Quality Score */}
                          <div className="flex items-center gap-4 pt-3 md:pt-0 md:pl-4">
                            <CircularScoreDial
                              score={quality?.overallQualityScore ?? 0}
                              max={100}
                              size={72}
                              strokeWidth={7}
                              color={
                                (quality?.overallQualityScore ?? 0) >= 80
                                  ? "#10B981"
                                  : (quality?.overallQualityScore ?? 0) >= 65
                                    ? "#F59E0B"
                                    : "#EF4444"
                              }
                            />
                            <div className="space-y-1">
                              <span className="text-[12px] font-mono uppercase tracking-wider text-[#18181B]/55 font-semibold">
                                Resume Quality
                              </span>
                              <p className="text-[13px] font-semibold text-[#18181B]">
                                {(quality?.overallQualityScore ?? 0) >= 80 ? "Professional Polish" : "Revision Suggested"}
                              </p>
                              <p className="text-[11px] text-[#18181B]/55">
                                {quickWins.length} quick wins available
                              </p>
                            </div>
                          </div>

                          {/* 3. Recruiter Verdict */}
                          <div className="flex flex-col justify-center pt-3 md:pt-0 md:pl-4 space-y-1.5">
                            <span className="text-[12px] font-mono uppercase tracking-wider text-[#18181B]/55 font-semibold">
                              Recruiter Verdict
                            </span>
                            <div className="flex items-center gap-2">
                              {recruiter?.interviewRecommendation ? (
                                <Badge
                                  className={cn(
                                    "px-2.5 py-0.5 text-[11px] font-bold tracking-wide rounded-full border shadow-2xs",
                                    recruiter.interviewRecommendation.includes("STRONG HIRE") || recruiter.interviewRecommendation.includes("HIRE")
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      : recruiter.interviewRecommendation.includes("PASS")
                                        ? "bg-rose-50 text-rose-800 border-rose-300"
                                        : "bg-amber-50 text-amber-900 border-amber-300"
                                  )}
                                >
                                  {recruiter.interviewRecommendation.split(" ")[0]}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[11px]">Reviewed</Badge>
                              )}
                              <span className="text-[12px] text-[#18181B]/75 font-medium">
                                {recruiter?.hiringConfidence ? `Confidence: ${recruiter.hiringConfidence}/10` : "Evaluation complete"}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#18181B]/55 line-clamp-2">
                              {recruiter?.firstImpression ? recruiter.firstImpression : "Full qualitative assessment generated below."}
                            </p>
                          </div>
                        </div>

                        {/* KPI Bar & Copy Action Plan Button */}
                        <div className="pt-3 border-t border-[rgba(55,50,47,0.08)] flex flex-wrap items-center justify-between gap-3 text-[12px]">
                          <div className="flex flex-wrap items-center gap-3 text-[#18181B]/75">
                            <span className="flex items-center gap-1.5 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <strong className="text-[#18181B]">{matchedCount}</strong> Matched Skills
                            </span>
                            <span className="text-[#18181B]/25">·</span>
                            <span className="flex items-center gap-1.5 font-medium">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                              <strong className="text-[#18181B]">{missingCount}</strong> Missing Gaps
                            </span>
                            <span className="text-[#18181B]/25">·</span>
                            <span className="flex items-center gap-1.5 font-medium">
                              <Zap className="h-3.5 w-3.5 text-indigo-600" />
                              <strong className="text-[#18181B]">{actionableTips.length + quickWins.length}</strong> Recommended Fixes
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyFullActionPlan(actionableTips, quickWins, recruiter?.firstImpression)}
                            className="h-8 text-[11.5px] rounded-lg border-[rgba(55,50,47,0.16)] bg-white hover:bg-[#F8F6F3] text-[#18181B] gap-1.5 shadow-2xs font-medium cursor-pointer"
                          >
                            {copiedId === "full_plan" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-[#18181B]/70" />}
                            Copy Full Action Plan
                          </Button>
                        </div>
                      </div>

                      {/* Segmented Tab Navigation Bar */}
                      <div className="flex items-center gap-1.5 p-1 bg-[#F4F1EC] rounded-xl border border-[rgba(55,50,47,0.08)] select-none">
                        <TabButton
                          active={activeTab === "action_plan"}
                          onClick={() => setActiveTab("action_plan")}
                          icon={ListChecks}
                          label="Action Plan & Revisions"
                          badge={actionableTips.length + quickWins.length}
                        />
                        <TabButton
                          active={activeTab === "skills_matrix"}
                          onClick={() => setActiveTab("skills_matrix")}
                          icon={Layers}
                          label="Keyword Matrix"
                          badge={matchedCount + missingCount}
                        />
                        <TabButton
                          active={activeTab === "rubric"}
                          onClick={() => setActiveTab("rubric")}
                          icon={Award}
                          label="ATS Rubric (9 Factors)"
                        />
                        <TabButton
                          active={activeTab === "quality"}
                          onClick={() => setActiveTab("quality")}
                          icon={Wand2}
                          label="Writing & Tone"
                        />
                      </div>

                      {/* Tab 1: Priority Action Plan & Revisions */}
                      {activeTab === "action_plan" && (
                        <div className="space-y-4 animate-in fade-in-50 duration-200">
                          {/* Recruiter First Impression Card */}
                          {recruiter?.firstImpression && (
                            <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 shadow-soft space-y-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-md bg-[#18181B]/5 flex items-center justify-center text-[#18181B]">
                                  <User className="h-3.5 w-3.5" />
                                </div>
                                <h4 className="text-[13px] font-semibold text-[#18181B]">Recruiter First Impression</h4>
                              </div>
                              <p className="text-[13px] leading-relaxed text-[#18181B]/85 bg-[#F8F6F3]/60 p-3.5 rounded-xl border border-[rgba(55,50,47,0.06)] italic">
                                "{recruiter.firstImpression}"
                              </p>
                            </div>
                          )}

                          {/* High-Impact Actionable Recommendations */}
                          {actionableTips.length > 0 && (
                            <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 shadow-soft space-y-3.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-700">
                                    <Zap className="h-3.5 w-3.5" />
                                  </div>
                                  <h4 className="text-[13px] font-semibold text-[#18181B]">
                                    High-Impact Resume Revisions ({actionableTips.length})
                                  </h4>
                                </div>
                                <span className="text-[11px] font-mono text-[#18181B]/50">Ranked by hiring impact</span>
                              </div>

                              <div className="space-y-3">
                                {actionableTips.map((tip, idx) => {
                                  const anchorMatch = tip.match(/^(?:In your\s+)?([A-Za-z0-9\s&]+?)(?:\s+role|\s+project|\s+experience)?(?:,\s*|\s*:\s*)([\s\S]*)$/i);
                                  const anchor = anchorMatch ? anchorMatch[1].trim() : "Experience";
                                  const body = anchorMatch ? anchorMatch[2].trim() : tip;

                                  return (
                                    <div
                                      key={idx}
                                      className="p-3.5 rounded-xl border border-[rgba(55,50,47,0.1)] bg-[#F8F6F3]/50 hover:bg-[#F8F6F3] transition-colors space-y-2 group"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="h-5 w-5 rounded-full bg-[#18181B] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                            {idx + 1}
                                          </span>
                                          <Badge variant="outline" className="text-[10.5px] font-medium bg-white text-[#18181B] border-[rgba(55,50,47,0.16)] px-2 py-0.5">
                                            🏢 {anchor}
                                          </Badge>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => copyToClipboard(tip, `tip_${idx}`, "Recommendation copied")}
                                          className="h-7 px-2 text-[11px] text-[#18181B]/60 hover:text-[#18181B] opacity-80 group-hover:opacity-100 cursor-pointer"
                                        >
                                          {copiedId === `tip_${idx}` ? <Check className="h-3 w-3 text-emerald-600 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                          Copy Fix
                                        </Button>
                                      </div>
                                      <p className="text-[12.5px] leading-relaxed text-[#18181B]/85 pl-7">{body}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Quick Wins (Sentence Polish & Verbs) */}
                          {quickWins.length > 0 && (
                            <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 shadow-soft space-y-3.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-md bg-amber-50 flex items-center justify-center text-amber-700">
                                    <Sparkles className="h-3.5 w-3.5" />
                                  </div>
                                  <h4 className="text-[13px] font-semibold text-[#18181B]">
                                    Quick Wins - Action Verbs & Polish ({quickWins.length})
                                  </h4>
                                </div>
                                <span className="text-[11px] font-mono text-[#18181B]/50">Targeted sentence edits</span>
                              </div>

                              <div className="space-y-2.5">
                                {quickWins.map((qw, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-xl border border-[rgba(55,50,47,0.08)] bg-white space-y-1.5 group"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold font-mono">
                                        <Wand2 className="h-3 w-3" /> Targeted Edit #{idx + 1}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(qw, `qw_${idx}`, "Quick win copied")}
                                        className="h-6 px-2 text-[10.5px] text-[#18181B]/60 hover:text-[#18181B] cursor-pointer"
                                      >
                                        {copiedId === `qw_${idx}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                    <p className="text-[12px] leading-relaxed text-[#18181B]/85 font-sans">{qw}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Strengths & Weaknesses Comparison Split */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strengths */}
                            <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-4.5 shadow-soft space-y-3">
                              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[13px]">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Verified Strengths ({recruiter?.strengths?.length ?? 0})
                              </div>
                              {(recruiter?.strengths ?? []).length === 0 ? (
                                <p className="text-[12px] text-[#18181B]/50">No verified strengths flagged.</p>
                              ) : (
                                <ul className="space-y-2">
                                  {recruiter?.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[12px] text-[#18181B]/85 leading-relaxed">
                                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                      <span>{s}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Weaknesses / Gaps */}
                            <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-4.5 shadow-soft space-y-3">
                              <div className="flex items-center gap-2 text-amber-800 font-semibold text-[13px]">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                Identified Gaps & Risks ({recruiter?.weaknesses?.length ?? 0})
                              </div>
                              {(recruiter?.weaknesses ?? []).length === 0 ? (
                                <p className="text-[12px] text-[#18181B]/50">No critical weaknesses detected.</p>
                              ) : (
                                <ul className="space-y-2">
                                  {recruiter?.weaknesses.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[12px] text-[#18181B]/85 leading-relaxed">
                                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                      <span>{w}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Keyword & Skills Matrix */}
                      {activeTab === "skills_matrix" && (
                        <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 shadow-soft space-y-4 animate-in fade-in-50 duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <h4 className="text-[13px] font-semibold text-[#18181B]">Role Keyword & Competency Matrix</h4>
                              <p className="text-[11.5px] text-[#18181B]/55">
                                Verified skills detected in your resume vs required & preferred JD terms.
                              </p>
                            </div>

                            {/* Live Keyword Search Input */}
                            <div className="relative w-full sm:w-60">
                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#18181B]/40" />
                              <input
                                type="text"
                                value={keywordSearch}
                                onChange={(e) => setKeywordSearch(e.target.value)}
                                placeholder="Search skills (e.g. react, docker)..."
                                className="w-full h-8 pl-8 pr-3 text-[12px] rounded-lg border border-[rgba(55,50,47,0.14)] bg-[#F8F6F3] text-[#18181B] placeholder:text-[#18181B]/40 focus:bg-white focus:outline-hidden"
                              />
                            </div>
                          </div>

                          {/* Filter Pills */}
                          <div className="flex items-center gap-2 text-[11.5px] border-b border-[rgba(55,50,47,0.08)] pb-3">
                            <button
                              type="button"
                              onClick={() => setKeywordFilter("all")}
                              className={cn(
                                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                                keywordFilter === "all" ? "bg-[#18181B] text-white" : "text-[#18181B]/60 hover:text-[#18181B]"
                              )}
                            >
                              All ({matchedCount + missingCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setKeywordFilter("matched")}
                              className={cn(
                                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                                keywordFilter === "matched" ? "bg-emerald-700 text-white" : "text-emerald-700 hover:bg-emerald-50"
                              )}
                            >
                              ✓ Matched ({matchedCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setKeywordFilter("missing")}
                              className={cn(
                                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                                keywordFilter === "missing" ? "bg-amber-700 text-white" : "text-amber-700 hover:bg-amber-50"
                              )}
                            >
                              ⚠ Missing Gaps ({missingCount})
                            </button>
                          </div>

                          {/* Matched Keywords Grid */}
                          {(keywordFilter === "all" || keywordFilter === "matched") && (
                            <div className="space-y-2">
                              <div className="text-[11.5px] font-mono uppercase tracking-wider text-emerald-800 font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Demonstrated In Resume (
                                {(ats?.matchedKeywords ?? []).filter((k) => k.toLowerCase().includes(keywordSearch.toLowerCase())).length}
                                )
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(ats?.matchedKeywords ?? [])
                                  .filter((k) => k.toLowerCase().includes(keywordSearch.toLowerCase()))
                                  .map((k) => (
                                    <Badge
                                      key={k}
                                      variant="secondary"
                                      className="rounded-full text-[11.5px] bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-medium px-2.5 py-0.5"
                                    >
                                      ✓ {k}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Missing Keywords Grid */}
                          {(keywordFilter === "all" || keywordFilter === "missing") && (
                            <div className="space-y-2 pt-2">
                              <div className="text-[11.5px] font-mono uppercase tracking-wider text-amber-800 font-semibold flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                Missing From Resume (
                                {(ats?.missingKeywords ?? []).filter((k) => k.toLowerCase().includes(keywordSearch.toLowerCase())).length}
                                )
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(ats?.missingKeywords ?? [])
                                  .filter((k) => k.toLowerCase().includes(keywordSearch.toLowerCase()))
                                  .map((k) => (
                                    <Badge
                                      key={k}
                                      variant="outline"
                                      className="rounded-full text-[11.5px] bg-amber-50 border border-amber-300 text-amber-900 font-medium px-2.5 py-0.5"
                                    >
                                      + {k}
                                    </Badge>
                                  ))}
                              </div>
                              <p className="text-[11px] text-[#18181B]/55 italic pt-1">
                                💡 Tip: Add these missing keywords ONLY if you have genuine hands-on experience; never fabricate skills.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 3: ATS Rubric (9 Factors Breakdown) */}
                      {activeTab === "rubric" && (
                        <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 shadow-soft space-y-4 animate-in fade-in-50 duration-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-[13px] font-semibold text-[#18181B]">Comprehensive 9-Factor ATS Rubric</h4>
                              <p className="text-[11.5px] text-[#18181B]/55">Deterministic breakdown of candidate fit & resume parsing signals.</p>
                            </div>
                            <span className="font-mono text-[12px] font-bold text-[#18181B]">
                              Total: {ats?.overallScore}/100
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Group 1: Role Compatibility (70 pts max) */}
                            <RubricCategoryCard
                              title="Role Compatibility"
                              totalScore={(ats?.scoreBreakdown.keywordMatch ?? 0) + (ats?.scoreBreakdown.skillsMatch ?? 0) + (ats?.scoreBreakdown.experienceRelevance ?? 0)}
                              maxScore={70}
                              items={[
                                { label: "Keyword Match", score: ats?.scoreBreakdown.keywordMatch ?? 0, max: 30, key: "keywordMatch" },
                                { label: "Skills Match", score: ats?.scoreBreakdown.skillsMatch ?? 0, max: 20, key: "skillsMatch" },
                                { label: "Experience Relevance", score: ats?.scoreBreakdown.experienceRelevance ?? 0, max: 20, key: "experienceRelevance" },
                              ]}
                              notApplicable={notApplicable as string[]}
                              detailed={ats?.detailedBreakdown}
                            />

                            {/* Group 2: Format & Parseability (15 pts max) */}
                            <RubricCategoryCard
                              title="Structure & Parseability"
                              totalScore={(ats?.scoreBreakdown.education ?? 0) + (ats?.scoreBreakdown.formatting ?? 0) + (ats?.scoreBreakdown.parseability ?? 0)}
                              maxScore={15}
                              items={[
                                { label: "Formatting", score: ats?.scoreBreakdown.formatting ?? 0, max: 5, key: "formatting" },
                                { label: "Parseability", score: ats?.scoreBreakdown.parseability ?? 0, max: 5, key: "parseability" },
                                { label: "Education", score: ats?.scoreBreakdown.education ?? 0, max: 5, key: "education" },
                              ]}
                              notApplicable={notApplicable as string[]}
                              detailed={ats?.detailedBreakdown}
                            />

                            {/* Group 3: Writing Impact (15 pts max) */}
                            <RubricCategoryCard
                              title="Writing Impact & Tone"
                              totalScore={(ats?.scoreBreakdown.readability ?? 0) + (ats?.scoreBreakdown.grammarSpelling ?? 0) + (ats?.scoreBreakdown.impact ?? 0)}
                              maxScore={15}
                              items={[
                                { label: "Readability", score: ats?.scoreBreakdown.readability ?? 0, max: 5, key: "readability" },
                                { label: "Grammar & Spelling", score: ats?.scoreBreakdown.grammarSpelling ?? 0, max: 5, key: "grammarSpelling" },
                                { label: "Impact & Metrics", score: ats?.scoreBreakdown.impact ?? 0, max: 5, key: "impact" },
                              ]}
                              notApplicable={notApplicable as string[]}
                              detailed={ats?.detailedBreakdown}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tab 4: Writing & Quality Review */}
                      {activeTab === "quality" && (
                        <div className="rounded-2xl border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-5 shadow-soft space-y-4 animate-in fade-in-50 duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-700">
                                <MessageSquare className="h-3.5 w-3.5" />
                              </div>
                              <h4 className="text-[13px] font-semibold text-[#18181B]">Professional Editorial Writing Review</h4>
                            </div>
                            <Badge variant="outline" className="text-[11px] font-mono text-[#18181B] bg-[#F8F6F3]">
                              Quality Score: {quality?.overallQualityScore ?? 85}/100
                            </Badge>
                          </div>

                          {quality?.professionalReview && (
                            <div className="p-4 rounded-xl border border-[rgba(55,50,47,0.08)] bg-[#F8F6F3]/50 leading-relaxed text-[13px] text-[#18181B]/85">
                              {quality.professionalReview}
                            </div>
                          )}

                          {/* Quality Dimension Bars */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            {[
                              { label: "Readability", score: quality?.readability ?? 85 },
                              { label: "Action Verbs & Tone", score: quality?.professionalTone ?? 85 },
                              { label: "Conciseness", score: quality?.conciseness ?? 85 },
                              { label: "Impact & Metrics", score: quality?.impact ?? 75 },
                            ].map((dim) => (
                              <div key={dim.label} className="p-3 rounded-xl border border-[rgba(55,50,47,0.08)] bg-white space-y-1.5">
                                <div className="flex justify-between text-[11px] font-medium text-[#18181B]/70">
                                  <span>{dim.label}</span>
                                  <span className="font-mono font-bold text-[#18181B]">{dim.score}%</span>
                                </div>
                                <Progress value={dim.score} className="h-1.5 bg-[#F4F1EC]" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Presentation Components ──────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[12px] font-medium transition-all duration-150 cursor-pointer text-center",
        active
          ? "bg-[#18181B] text-white shadow-xs font-semibold"
          : "text-[#18181B]/70 hover:text-[#18181B] hover:bg-black/5"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-white" : "text-[#18181B]/60")} />
      <span className="truncate">{label}</span>
      {typeof badge === "number" && (
        <span
          className={cn(
            "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
            active ? "bg-white/20 text-white" : "bg-[#18181B]/10 text-[#18181B]"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function CircularScoreDial({
  score,
  max,
  size = 70,
  strokeWidth = 6,
  color = "#10B981",
}: {
  score: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E1DA"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[17px] font-bold font-mono tracking-tight text-[#18181B] leading-none">
          {score}
        </span>
        <span className="text-[9px] font-mono text-[#18181B]/40 leading-tight">/{max}</span>
      </div>
    </div>
  );
}

function RubricCategoryCard({
  title,
  totalScore,
  maxScore,
  items,
  notApplicable,
  detailed,
}: {
  title: string;
  totalScore: number;
  maxScore: number;
  items: Array<{ label: string; score: number; max: number; key: string }>;
  notApplicable: string[];
  detailed?: Array<{ category: string; score: number; max: number; deductions?: string[]; evidence?: string[] }>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3.5 rounded-xl border border-[rgba(55,50,47,0.1)] bg-[#F8F6F3]/40 space-y-3">
      <div className="flex items-center justify-between border-b border-[rgba(55,50,47,0.06)] pb-2">
        <span className="text-[12px] font-semibold text-[#18181B]">{title}</span>
        <span className="text-[11.5px] font-mono font-bold text-[#18181B]">
          {totalScore}/{maxScore}
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((it) => {
          const isNa = notApplicable.includes(it.key);
          const pct = Math.round((it.score / it.max) * 100);
          const detail = detailed?.find((d) => d.category.toLowerCase() === it.label.toLowerCase());

          return (
            <div key={it.label} className="space-y-1 text-[11px]">
              <div className="flex justify-between text-[#18181B]/75 font-medium">
                <span>{it.label}</span>
                {isNa ? (
                  <span className="text-[#18181B]/40 font-mono">N/A</span>
                ) : (
                  <span className="font-mono font-semibold text-[#18181B]">
                    {it.score}/{it.max}
                  </span>
                )}
              </div>
              <Progress value={isNa ? 0 : pct} className="h-1 bg-[#EBE7E0]" />
              {expanded && detail?.evidence?.length ? (
                <div className="text-[10px] text-emerald-700 truncate font-mono pt-0.5">
                  {detail.evidence.slice(0, 2).join(", ")}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center text-[10.5px] font-mono text-[#18181B]/50 hover:text-[#18181B] pt-1 transition-colors cursor-pointer"
      >
        {expanded ? "Hide Details" : "View Factors & Evidence"}
      </button>
    </div>
  );
}
