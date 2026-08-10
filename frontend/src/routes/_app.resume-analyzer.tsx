import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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
  head: () => ({ meta: [{ title: "Resume Analyzer — CVPilot" }] }),
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

const DEFAULT_JOB_DESCRIPTION = `Software Engineer (Full Stack)

Location: Bengaluru, India (Hybrid)

Experience: 1–3 Years

About the Role

We are looking for a Full Stack Software Engineer passionate about building scalable web applications and modern AI-powered products. You will work across frontend, backend, cloud infrastructure, and AI integrations to deliver production-ready software used by thousands of users.

You will collaborate closely with product managers, designers, and engineers to build reliable, performant, and user-centric applications.

Responsibilities
Design and develop scalable full-stack web applications using React, Next.js, Node.js, and TypeScript.
Build secure backend APIs following REST principles and modern authentication practices.
Optimize application performance through efficient database queries, caching, and backend improvements.
Design reusable frontend components with responsive and accessible UI.
Build and maintain production-grade cloud infrastructure.
Integrate AI services into customer-facing applications.
Implement secure file uploads and cloud storage solutions.
Write maintainable, well-tested, and documented code.
Participate in architecture discussions and code reviews.
Work closely with cross-functional teams to ship features quickly.

Required Skills
1–3 years of Full Stack development experience.
Strong JavaScript and TypeScript skills.
Experience with React.js and Next.js.
Strong knowledge of Node.js and Express.js.
Experience building RESTful APIs.
Experience with MongoDB or MySQL.
Experience implementing JWT authentication and role-based authorization.
Strong Git workflow knowledge.
Understanding of responsive UI development.
Familiarity with cloud platforms such as AWS.
Strong debugging and problem-solving skills.

Preferred Qualifications
Experience integrating AI APIs or LLMs.
Experience working with Whisper, Gemini, OpenAI, Anthropic, or similar models.
Experience with Redis caching.
Experience deploying applications on Vercel, Render, AWS, or similar platforms.
Knowledge of FFmpeg or media-processing pipelines.
Experience building SaaS products.
Knowledge of payment gateways like Stripe.
Understanding of scalable system design.

Nice to Have
Experience with Docker.
PostgreSQL.
CI/CD pipelines.
WebSockets.
Unit and integration testing.
Kubernetes.
GraphQL.

Tech Stack
React.js
Next.js
TypeScript
Node.js
Express.js
MongoDB
Redis
AWS
Docker
GitHub Actions
Tailwind CSS
Stripe
REST APIs

What We're Looking For

We're looking for engineers who demonstrate:

Strong ownership of projects.
Ability to ship production-ready software.
Clean, maintainable code.
Good communication skills.
Product thinking.
Strong debugging ability.
Continuous learning mindset.
Passion for AI-enabled software.`;

function AnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>(DEFAULT_JOB_DESCRIPTION);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStepItem[]>(
    INITIAL_ANALYSIS_STEPS.map((s) => ({ ...s, status: "pending" }))
  );

  const onDrop = (accepted: File[]) => {
    const f = accepted?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    multiple: false,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
  });

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Please upload a resume (PDF or DOCX) first");
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
    }
  };

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        category="ATS MATRIX"
        title="Resume Analyzer"
        subtitle="Upload any resume and get a full ATS, quality, and recruiter assessment — no account setup required."
      />

      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* Left: Upload */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="rounded-[20px] border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] p-6 space-y-5 shadow-soft">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10.5px] uppercase tracking-widest text-[#18181B]/50 font-medium">
                Resume file
              </Label>
              <div
                {...getRootProps()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(55,50,47,0.14)] bg-[#F8F6F3] px-4 py-10 text-center transition-colors hover:border-[#18181B]/40",
                  isDragActive && "border-[#18181B] bg-[#18181B]/5",
                  file && "border-[#18181B]/40 bg-[#FFFEFC]",
                )}
              >
                <input {...getInputProps()} />
                {file ? (
                  <>
                    <FileText className="h-8 w-8 text-[#18181B]" strokeWidth={1.5} />
                    <div className="mt-3 text-[13px] font-semibold text-[#18181B]">{file.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-[#18181B]/60 font-mono">
                      {(file.size / 1024 / 1024).toFixed(2)}MB · click to replace
                    </div>
                  </>
                ) : (
                  <>
                    <UploadCloud
                      className="h-9 w-9 text-[#18181B]/40"
                      strokeWidth={1.5}
                    />
                    <div className="mt-3 text-[13px] font-medium text-[#18181B]">
                      Drag & drop your resume
                    </div>
                    <div className="mt-1 text-[11.5px] text-[#18181B]/60 font-sans">
                      or <span className="text-[#18181B] underline underline-offset-2 font-medium">browse</span> to
                      upload
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#18181B]/50 font-mono">
                <FileSpreadsheet className="h-3 w-3" /> Supported: PDF, DOCX · max {MAX_SIZE_MB}MB
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jd-input" className="font-mono text-[10.5px] uppercase tracking-widest text-[#18181B]/50 font-medium flex items-center justify-between">
                <span>Target Job Description</span>
                <span className="font-normal text-[#18181B]/40 lowercase">(optional)</span>
              </Label>
              <Textarea
                id="jd-input"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description to score keyword & experience fit. Leave empty for a general ATS check."
                className="min-h-[180px] resize-y text-[13px] rounded-xl border border-[rgba(55,50,47,0.12)] bg-[#F8F6F3] p-3 text-[#18181B] focus:bg-[#FFFEFC]"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !file}
              className="w-full h-11 gap-1.5 font-medium rounded-full bg-[#18181B] text-white hover:bg-[#27272A] shadow-xs"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Analyze Resume
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Results / Progress */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
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
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card py-24 text-center shadow-subtle min-h-[450px]"
              >
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground/60 mb-4" strokeWidth={1.5} />
                <h3 className="text-[16px] font-semibold">Ready when you are</h3>
                <p className="mt-1.5 max-w-xs text-[12.5px] text-muted-foreground">
                  Upload a PDF or DOCX resume on the left, optionally add a job description, and run
                  the analysis.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {(() => {
                  const ats = result.ats.status === "success" ? result.ats.data : null;
                  const quality = result.quality.status === "success" ? result.quality.data : null;
                  const recruiter = result.recruiter.status === "success" ? result.recruiter.data : null;
                  const notApplicable = ats?.notApplicable ?? [];
                  const noJd = notApplicable.includes("keywordMatch");

                  return (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {ats ? (
                          <ScoreCard
                            title="Overall ATS Score"
                            value={ats.overallScore}
                            tone={ats.overallScore >= 80 ? "success" : "primary"}
                            hint={
                              noJd
                                ? "Scored on resume-structure categories only (no job description)."
                                : ats.overallScore >= 85
                                  ? "Strong — excellent JD alignment."
                                  : ats.overallScore >= 70
                                    ? "Fair — try editing to match missing keywords."
                                    : "Action required — low score."
                            }
                            icon={Shield}
                          />
                        ) : (
                          <UnavailableCard
                            title="Overall ATS Score"
                            reason={result.ats.status === "failed" ? result.ats.error : undefined}
                            icon={Shield}
                          />
                        )}
                        {quality ? (
                          <ScoreCard
                            title="Resume Quality"
                            value={quality.overallQualityScore}
                            tone={quality.overallQualityScore >= 80 ? "success" : "primary"}
                            hint="Writing, tone, conciseness and impact."
                            icon={Wand2}
                          />
                        ) : (
                          <UnavailableCard
                            title="Resume Quality"
                            reason={result.quality.status === "failed" ? result.quality.error : undefined}
                            icon={Wand2}
                          />
                        )}
                      </div>

                      {noJd && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-background p-4 text-[12.5px] text-muted-foreground">
                          <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>
                            <strong className="text-foreground">Add a Job Description</strong> to
                            evaluate role-specific compatibility. Keyword Match, Skills Match and
                            Experience Match are marked "Not applicable" and are excluded from your
                            ATS score.
                          </span>
                        </div>
                      )}

                      {/* Score breakdown bar */}
                      <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle space-y-4">
                        <div className="text-[13px] font-semibold">Rubric Breakdown</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            { label: "Keyword Match", key: "keywordMatch", score: ats?.scoreBreakdown.keywordMatch ?? 0, max: 30 },
                            { label: "Skills Match", key: "skillsMatch", score: ats?.scoreBreakdown.skillsMatch ?? 0, max: 20 },
                            { label: "Experience Relevance", key: "experienceRelevance", score: ats?.scoreBreakdown.experienceRelevance ?? 0, max: 20 },
                            { label: "Education", key: "education", score: ats?.scoreBreakdown.education ?? 0, max: 5 },
                            { label: "Formatting", key: "formatting", score: ats?.scoreBreakdown.formatting ?? 0, max: 5 },
                            { label: "Readability", key: "readability", score: ats?.scoreBreakdown.readability ?? 0, max: 5 },
                            { label: "Parseability", key: "parseability", score: ats?.scoreBreakdown.parseability ?? 0, max: 5 },
                            { label: "Grammar & Spelling", key: "grammarSpelling", score: ats?.scoreBreakdown.grammarSpelling ?? 0, max: 5 },
                            { label: "Impact", key: "impact", score: ats?.scoreBreakdown.impact ?? 0, max: 5 },
                          ].map((item) => {
                            const isNa = (notApplicable as string[]).includes(item.key);
                            const pct = Math.round((item.score / item.max) * 100);
                            const detail = ats?.detailedBreakdown?.find(
                              (d) => d.category.toLowerCase() === item.label.toLowerCase(),
                            );
                            return (
                              <div key={item.label} className="space-y-1">
                                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                                  <span>{item.label}</span>
                                  {isNa ? (
                                    <span className="font-semibold text-muted-foreground/70">N/A</span>
                                  ) : (
                                    <span>
                                      {item.score}/{item.max}
                                    </span>
                                  )}
                                </div>
                                {isNa ? (
                                  <div className="h-1.5 w-full rounded-full bg-muted/40" title="Requires a job description" />
                                ) : (
                                  <Progress value={pct} className="h-1.5" />
                                )}
                                {detail?.evidence?.length ? (
                                  <div className="space-y-0.5 text-[10.5px] text-success/90">
                                    {detail.evidence.map((e, i) => (
                                      <div key={i} className="truncate" title={e}>
                                        {e}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                {detail?.deductions?.length ? (
                                  <div className="space-y-0.5 text-[10.5px] text-warning/90">
                                    {detail.deductions.map((d, i) => (
                                      <div key={i} className="truncate" title={d}>
                                        {d}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Keywords comparison */}
                      {noJd ? (
                        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-subtle">
                          <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground/60 mb-2" />
                          <div className="text-[13px] font-semibold">Keyword Match — Not applicable</div>
                          <p className="mt-1 text-[12.5px] text-muted-foreground">
                            Add a Job Description to evaluate role-specific compatibility.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle flex flex-col min-h-[160px]">
                            <div className="text-[12.5px] font-semibold text-success flex items-center gap-1.5 mb-3">
                              <CheckCircle2 className="h-4 w-4" /> Matched Keywords
                            </div>
                            {(ats?.matchedKeywords ?? []).length === 0 ? (
                              <span className="text-[12px] text-muted-foreground">No matches found.</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 content-start">
                                {ats?.matchedKeywords.map((k) => (
                                  <Badge key={k} variant="secondary" className="rounded-full text-[11px] bg-success/5 border-success/35 text-success font-normal">
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
                            {(ats?.missingKeywords ?? []).length === 0 ? (
                              <span className="text-[12px] text-muted-foreground">All keywords matched!</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 content-start">
                                {ats?.missingKeywords.map((k) => (
                                  <Badge key={k} variant="outline" className="rounded-full text-[11px] bg-warning/5 border-warning/35 text-warning font-normal">
                                    {k}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recruiter review */}
                      {recruiter ? (
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle space-y-4">
                          <div className="flex items-center gap-2 text-[13px] font-semibold">
                            <User className="h-3.5 w-3.5 text-primary" /> Recruiter Review
                          </div>
                          <p className="text-[13px] leading-relaxed text-foreground/85">
                            {recruiter.firstImpression}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                            <Badge variant="secondary" className="rounded-full">
                              Hiring confidence: {recruiter.hiringConfidence}/10
                            </Badge>
                            <span className="font-medium">{recruiter.interviewRecommendation}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CheckList title="Strengths" items={recruiter.strengths} tone="success" />
                            <CheckList title="Weaknesses" items={recruiter.weaknesses} tone="warning" />
                          </div>
                        </div>
                      ) : result.recruiter.status === "failed" ? (
                        <UnavailableCard
                          title="Recruiter Review"
                          reason={result.recruiter.error}
                          icon={User}
                        />
                      ) : null}

                      {/* Resume quality */}
                      {quality ? (
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle space-y-4">
                          <div className="flex items-center gap-2 text-[13px] font-semibold">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" /> Resume Quality
                          </div>
                          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                            {quality.professionalReview}
                          </p>
                          <CheckList title="Quick wins" items={quality.quickWins} tone="primary" />
                        </div>
                      ) : result.quality.status === "failed" ? (
                        <UnavailableCard
                          title="Resume Quality"
                          reason={result.quality.error}
                          icon={MessageSquare}
                        />
                      ) : null}

                      {/* Top improvements */}
                      {(() => {
                        const tips = ats?.recruiterFeedback?.topImprovements ?? [];
                        if (tips.length === 0) return null;
                        return (
                          <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle">
                            <div className="flex items-center gap-2 text-[13px] font-semibold mb-4">
                              <Wand2 className="h-3.5 w-3.5 text-primary" /> Actionable Recommendations
                            </div>
                            <ol className="space-y-3.5">
                              {tips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                                    {idx + 1}
                                  </span>
                                  <span className="text-[13px] leading-relaxed text-foreground/85">{tip}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        );
                      })()}
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

function CheckList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "success" | "warning" | "primary";
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertTriangle : Wand2;
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-primary";
  return (
    <div>
      <div className={cn("text-[12px] font-semibold mb-2", color)}>{title}</div>
      {items.length === 0 ? (
        <span className="text-[12px] text-muted-foreground">None.</span>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-foreground/85">
              <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", color)} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Renders "Unavailable" instead of a fake 0 when an engine did not produce data. */
function UnavailableCard({
  title,
  reason,
  icon: Icon,
}: {
  title: string;
  reason?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-subtle flex flex-col justify-between min-h-[132px]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-warning" /> Unavailable
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        {reason && import.meta.env.DEV
          ? reason
          : "This analysis couldn't be completed. Please try again."}
      </p>
    </motion.div>
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
