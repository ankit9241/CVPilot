import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Sparkles,
  Check,
  Loader2,
  Clock,
  Bot,
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye,
  AlertTriangle,
  FileText,
  Save,
  Trash2,
  ArrowLeft,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { z } from "zod";

const workflowSearchSchema = z.object({
  sessionId: z.string().optional(),
});

export const Route = createFileRoute("/_app/workflow")({
  validateSearch: (search) => workflowSearchSchema.parse(search),
  head: () => ({ meta: [{ title: "Workflow — CVPilot" }] }),
  component: WorkflowPage,
});

type Status = "idle" | "running" | "completed" | "future" | "failed";

interface StepNodeData extends Record<string, unknown> {
  title: string;
  detail: string;
  status: Status;
  index: number;
}

function StepNode({ data }: NodeProps<Node<StepNodeData>>) {
  const { title, status, index } = data;
  return (
    <div
      className={cn(
        "w-[220px] rounded-2xl border bg-[#FFFEFC] p-3.5 text-left shadow-subtle transition-all",
        status === "completed" && "border-[rgba(55,50,47,0.20)]",
        status === "running" && "border-[#18181B] shadow-lifted bg-[#18181B]/[0.03]",
        status === "idle" && "border-[rgba(55,50,47,0.12)]",
        status === "future" && "border-dashed border-[rgba(55,50,47,0.12)] opacity-70",
        status === "failed" && "border-destructive/50 bg-destructive/5",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-1.5 !w-1.5 !border-0 !bg-[#18181B]/30"
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-[#18181B]/50 font-medium">
          {String(index + 1).padStart(2, "0")}
        </span>
        <StatusPill status={status} />
      </div>
      <div className="mt-1.5 text-[13px] font-semibold text-[#18181B] tracking-tight">{title}</div>
      <div className="mt-1 text-[11.5px] leading-relaxed text-[#18181B]/60 font-sans">
        {status === "running" && "In progress…"}
        {status === "completed" && "Completed"}
        {status === "idle" && "Waiting"}
        {status === "future" && "Queued"}
        {status === "failed" && "Failed"}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1.5 !w-1.5 !border-0 !bg-[#18181B]/30"
      />
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#18181B]/5 px-2 py-0.5 font-mono text-[9.5px] font-medium text-[#18181B] border border-[rgba(55,50,47,0.10)] uppercase tracking-wider">
        <Check className="h-2.5 w-2.5" /> Done
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#18181B] px-2 py-0.5 font-mono text-[9.5px] font-medium text-white shadow-xs uppercase tracking-wider">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Active
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[9.5px] font-medium text-destructive uppercase tracking-wider">
        <AlertTriangle className="h-2.5 w-2.5" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(55,50,47,0.12)] bg-[#F8F6F3] px-2 py-0.5 font-mono text-[9.5px] font-medium text-[#18181B]/50 uppercase tracking-wider">
      Queued
    </span>
  );
}

const nodeTypes = { step: StepNode };

const WORKFLOW_STEPS = [
  { id: "step-1", title: "Reading Profile", detail: "Reading and validating master profile data…" },
  {
    id: "step-2",
    title: "Analyzing Job Description",
    detail: "Extracting responsibilities and requirements…",
  },
  {
    id: "step-3",
    title: "Selecting Experiences",
    detail: "Ranking and selecting experiences by relevance…",
  },
  {
    id: "step-4",
    title: "Selecting Projects",
    detail: "Ranking and selecting projects by relevance…",
  },
  { id: "step-5", title: "Selecting Skills", detail: "Ranking and selecting skills by relevance…" },
  {
    id: "step-6",
    title: "Generating Summary",
    detail: "Crafting a targeted professional summary…",
  },
  {
    id: "step-7",
    title: "Rewriting Experience",
    detail: "Rewriting experience bullet points for maximum impact…",
  },
  {
    id: "step-8",
    title: "Rewriting Projects",
    detail: "Rewriting project descriptions with metrics…",
  },
  {
    id: "step-9",
    title: "Building Resume",
    detail: "Compiling the final tailored resume JSON structure…",
  },
  { id: "step-10", title: "Finalizing", detail: "Completing resume generation session…" },
];

function WorkflowPage() {
  const navigate = useNavigate();
  const { sessionId } = Route.useSearch();

  const hasExecutedRef = useRef(false);
  const lastSessionIdRef = useRef<string | null>(null);
  if (lastSessionIdRef.current !== (sessionId || null)) {
    lastSessionIdRef.current = sessionId || null;
    hasExecutedRef.current = false;
  }

  const [session, setSession] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tpl-jake");
  const [latexCode, setLatexCode] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"preview" | "pdf" | "latex">("preview");

  useEffect(() => {
    console.log(
      "[API Call] GET /templates triggered because: component mounted to retrieve available templates",
    );
    api
      .get<any[]>("/templates")
      .then((res) => {
        setDbTemplates(res || []);
      })
      .catch(() => {});
  }, []);

  const handleSwitchTemplate = async (templateId: string) => {
    if (!generatedResume?.versionId) return;
    try {
      setIsRendering(true);
      setSelectedTemplateId(templateId);
      console.log(
        `[API Call] POST /resumes/versions/${generatedResume.versionId}/render triggered because: selected template changed to "${templateId}"`,
      );
      const updatedVersion = await api.post<any>(
        `/resumes/versions/${generatedResume.versionId}/render`,
        {
          templateId,
        },
      );
      if (updatedVersion) {
        if (updatedVersion.latexCode) {
          setLatexCode(updatedVersion.latexCode);
        }
        if (updatedVersion.pdfUrl) {
          setPdfUrl(updatedVersion.pdfUrl);
        }
      }
    } catch (err: any) {
      alert("Failed to render template: " + (err.response?.data?.message || err.message));
    } finally {
      setIsRendering(false);
    }
  };

  const steps = useMemo(() => {
    if (session?.aiMode === "development") {
      return [
        {
          id: "step-1",
          title: "Reading Profile",
          detail: "Reading and validating master profile data…",
        },
        {
          id: "step-2",
          title: "Analyzing Job Description",
          detail: "Extracting responsibilities and requirements…",
        },
        {
          id: "step-3",
          title: "Preparing Resume Content",
          detail: "Rewriting experiences and projects…",
        },
        {
          id: "step-4",
          title: "Building Resume",
          detail: "Compiling the final tailored resume JSON structure…",
        },
        {
          id: "step-5",
          title: "Generating Resume",
          detail: "Compressing resume to match page constraints…",
        },
        {
          id: "step-6",
          title: "Checking ATS",
          detail: "Running initial ATS scoring on compressed resume…",
        },
        {
          id: "step-7",
          title: "Optimizing Resume",
          detail: "Rewriting sections to match target keywords & scores…",
        },
        {
          id: "step-8",
          title: "Checking ATS Again",
          detail: "Evaluating final optimized resume match metrics…",
        },
        {
          id: "step-9",
          title: "Generating PDF",
          detail: "Compiling LaTeX template to standard PDF format…",
        },
        {
          id: "step-10",
          title: "Completed",
          detail: "Saving optimized resume to user Vault…",
        },
      ];
    }
    return [
      {
        id: "step-1",
        title: "Reading Profile",
        detail: "Reading and validating master profile data…",
      },
      {
        id: "step-2",
        title: "Analyzing Job Description",
        detail: "Extracting responsibilities and requirements…",
      },
      {
        id: "step-3",
        title: "Selecting Experiences",
        detail: "Ranking and selecting experiences by relevance…",
      },
      {
        id: "step-4",
        title: "Selecting Projects",
        detail: "Ranking and selecting projects by relevance…",
      },
      {
        id: "step-5",
        title: "Selecting Skills",
        detail: "Ranking and selecting skills by relevance…",
      },
      {
        id: "step-6",
        title: "Generating Summary",
        detail: "Crafting a targeted professional summary…",
      },
      {
        id: "step-7",
        title: "Rewriting Experience",
        detail: "Rewriting experience bullet points for maximum impact…",
      },
      {
        id: "step-8",
        title: "Rewriting Projects",
        detail: "Rewriting project descriptions with metrics…",
      },
      {
        id: "step-9",
        title: "Building Resume",
        detail: "Compiling the final tailored resume JSON structure…",
      },
      {
        id: "step-10",
        title: "Generating Resume",
        detail: "Compressing resume to match page constraints…",
      },
      {
        id: "step-11",
        title: "Checking ATS",
        detail: "Running initial ATS scoring on compressed resume…",
      },
      {
        id: "step-12",
        title: "Optimizing Resume",
        detail: "Rewriting sections to match target keywords & scores…",
      },
      {
        id: "step-13",
        title: "Checking ATS Again",
        detail: "Evaluating final optimized resume match metrics…",
      },
      {
        id: "step-14",
        title: "Generating PDF",
        detail: "Compiling LaTeX template to standard PDF format…",
      },
      {
        id: "step-15",
        title: "Completed",
        detail: "Saving optimized resume to user Vault…",
      },
    ];
  }, [session?.aiMode]);

  // Poll log updates
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let active = true;
    const fetchSessionAndLogs = async () => {
      try {
        console.log(
          `[API Call] GET /workflow/${sessionId} & /logs triggered because: polling log updates (session status: ${session?.status || "unknown"})`,
        );
        const [sessData, logsData] = await Promise.all([
          api.get<any>(`/workflow/${sessionId}`),
          api.get<any[]>(`/workflow/${sessionId}/logs`),
        ]);

        if (!active) return;
        setSession(sessData);
        setLogs(logsData || []);
        setError(sessData.errorMessage || null);
        setLoading(false);

        if (sessData.status === "COMPLETED") {
          // If complete, fetch the generated version json if not loaded
          console.log(
            `[API Call] GET /resumes/${sessionId}/versions triggered because: session completed, fetching resume versions`,
          );
          const versions = await api.get<any[]>(`/resumes/${sessionId}/versions`).catch(() => []);
          const latest = versions[versions.length - 1];
          if (latest) {
            if (latest.resumeJson && !generatedResume) {
              setGeneratedResume({
                ...latest.resumeJson,
                versionId: latest.id,
              });
            }
            if (latest.latexCode) {
              setLatexCode(latest.latexCode);
            }
            if (latest.pdfUrl) {
              const getBaseUrl = (u: string) => u.split("?")[0];
              setPdfUrl((currentVal) => {
                if (!currentVal || getBaseUrl(currentVal) !== getBaseUrl(latest.pdfUrl)) {
                  return latest.pdfUrl;
                }
                return currentVal;
              });
            } else if (latest.id && !pdfUrl && !(window as any)[`rendering_${latest.id}`]) {
              // pdfUrl is null in DB — auto-trigger a render to compile and upload it
              (window as any)[`rendering_${latest.id}`] = true;
              setIsRendering(true);
              console.log(
                `[API Call] POST /resumes/versions/${latest.id}/render triggered because: completed session missing compiled PDF`,
              );
              api
                .post<any>(`/resumes/versions/${latest.id}/render`, {
                  templateId: sessData.selectedTemplateId || "tpl-jake",
                })
                .then((updatedVersion) => {
                  if (updatedVersion?.pdfUrl) {
                    setPdfUrl(updatedVersion.pdfUrl);
                  }
                  if (updatedVersion?.latexCode) {
                    setLatexCode(updatedVersion.latexCode);
                  }
                })
                .catch((e) => {
                  console.error("Auto-rendering failed:", e);
                  setError("PDF rendering failed: " + (e?.response?.data?.message || e?.message || "Unknown error"));
                })
                .finally(() => {
                  setIsRendering(false);
                  (window as any)[`rendering_${latest.id}`] = false;
                });
            }
          }
          if (sessData.selectedTemplateId) {
            setSelectedTemplateId(sessData.selectedTemplateId);
          }
          setLoading(false);
          console.log("[Polling] Stopping log poll because session completed");
          if (interval) clearInterval(interval);
        } else if (sessData.status === "FAILED") {
          setLoading(false);
          setExecuting(false);
          console.log("[Polling] Stopping log poll because session failed");
          if (interval) clearInterval(interval);
        }
      } catch (err: any) {
        console.error("Error polling session/logs", err);
      }
    };

    fetchSessionAndLogs();
    const interval = setInterval(fetchSessionAndLogs, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [sessionId, generatedResume]);

  // Elapsed timer when running
  useEffect(() => {
    if (session?.status !== "PROCESSING" && session?.status !== "QUEUED") {
      return;
    }
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [session?.status]);

  // Trigger execution
  const executeGeneration = async () => {
    if (!sessionId) return;
    try {
      setExecuting(true);
      setError(null);
      setGeneratedResume(null);
      setElapsed(0);

      console.log(
        `[API Call] POST /workflow/${sessionId}/execute triggered because: starting/retrying generation`,
      );
      const response = await api.post<any>(`/workflow/${sessionId}/execute`);
      setGeneratedResume(response);
      setExecuting(false);
    } catch (err: any) {
      setExecuting(false);
      setError(err.response?.data?.message || err.message || "Failed to generate resume");
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    if (hasExecutedRef.current) return;

    // Wait for the initial session fetch to complete before deciding whether
    // to auto-trigger. Without this guard, the effect fires while session===null
    // (before the first poll returns), skips the status check, and re-executes
    // an already-COMPLETED session on every page refresh.
    if (loading) return;

    if (session) {
      if (
        session.status === "COMPLETED" ||
        session.status === "FAILED" ||
        session.status === "PROCESSING"
      ) {
        console.log(
          `[Workflow] Skipping auto-execution because session status is "${session.status}"`,
        );
        hasExecutedRef.current = true;
        return;
      }
    }

    if (!executing && !generatedResume) {
      hasExecutedRef.current = true;
      console.log(
        `[Workflow] Automatically triggering executeGeneration because session is new and not yet started`,
      );
      executeGeneration();
    }
  }, [sessionId, session, executing, generatedResume, loading]);

  // Map database logs to step status
  const stepStates = useMemo(() => {
    const states: Record<string, Status> = {};
    steps.forEach((step) => {
      // Find logs for this stepName
      const stepLogs = logs.filter((l) => l.stepName === step.title);
      const isCompleted = stepLogs.some((l) => l.status === "COMPLETED");
      const isInProgress = stepLogs.some((l) => l.status === "IN_PROGRESS");
      const isFailed = stepLogs.some((l) => l.status === "FAILED");

      if (isCompleted) {
        states[step.title] = "completed";
      } else if (isInProgress) {
        states[step.title] = "running";
      } else if (isFailed) {
        states[step.title] = "failed";
      } else {
        states[step.title] = "future";
      }
    });
    return states;
  }, [logs, steps]);

  // Current progress calculations
  const progressIndex = useMemo(() => {
    const idx = steps.findIndex((s) => stepStates[s.title] !== "completed");
    return idx === -1 ? steps.length : idx;
  }, [stepStates, steps]);

  const progressPercent = useMemo(() => {
    return (progressIndex / steps.length) * 100;
  }, [progressIndex, steps]);

  // React Flow Nodes & Edges
  const { nodes, edges } = useMemo(() => {
    const n: Node<StepNodeData>[] = steps.map((s, i) => {
      const col = i % 2;
      const stepStatus = stepStates[s.title] || "future";
      return {
        id: s.id,
        position: { x: col === 0 ? 40 : 320, y: i * 130 },
        type: "step",
        data: { title: s.title, detail: s.detail, status: stepStatus, index: i },
      };
    });

    const e: Edge[] = steps.slice(0, -1).map((s, i) => {
      const sourceState = stepStates[s.title];
      const animated = sourceState === "completed" || sourceState === "running";
      return {
        id: `${s.id}-${steps[i + 1].id}`,
        source: s.id,
        target: steps[i + 1].id,
        animated,
        style: {
          stroke:
            sourceState === "completed"
              ? "var(--color-success)"
              : sourceState === "running"
                ? "var(--color-primary)"
                : "var(--color-border)",
          strokeWidth: 1.5,
        },
      };
    });

    return { nodes: n, edges: e };
  }, [stepStates, steps]);

  const handleSaveDraft = async () => {
    if (!generatedResume) return;
    try {
      setIsSavingDraft(true);
      const companyName = generatedResume.metadata?.companyName || session?.companyName || "Target";
      const targetRole = generatedResume.metadata?.targetRole || session?.targetRole || "Role";
      console.log("[API Call] POST /resumes triggered because: user clicked Save Draft");
      await api.post("/resumes", {
        versionId: generatedResume.versionId,
        title: `${companyName} – ${targetRole}`,
        company: companyName,
        role: targetRole,
      });
      navigate({ to: "/resume-vault" });
    } catch (err: any) {
      alert("Failed to save: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) {
      alert("No PDF available yet. Switch to PDF Preview tab and generate one first.");
      return;
    }
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${session?.companyName || "resume"}-${session?.targetRole || "cv"}.pdf`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDiscard = () => {
    navigate({ to: "/resume-studio" });
  };

  if (!sessionId) {
    return (
      <div className="container-page py-12 text-center max-w-md mx-auto space-y-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">No active session</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please start resume generation by providing target role and pasting job details first.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/resume-studio" })} className="w-full">
          Go to Resume Studio
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        category="PIPELINE"
        title="Workflow"
        subtitle={
          session
            ? `Tailoring resume for ${session.targetRole} @ ${session.companyName}`
            : "A visual pipeline of every step CVPilot takes to tailor your resume."
        }
        actions={
          generatedResume ? (
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full bg-[#FFFEFC] border border-[rgba(55,50,47,0.14)] text-[#18181B] hover:bg-[#F4F1EC]"
                onClick={handleDownloadPdf}
                disabled={!pdfUrl}
                title={pdfUrl ? "Download PDF" : "No PDF yet — switch to PDF Preview tab"}
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full bg-[#FFFEFC] border border-[rgba(55,50,47,0.14)] text-[#18181B] hover:bg-[#F4F1EC]"
                onClick={executeGeneration}
                disabled={executing}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Regenerate
              </Button>
              <Button
                size="sm"
                className="gap-1.5 rounded-full bg-[#18181B] text-white hover:bg-[#27272A] shadow-xs px-4"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
              >
                <Save className="h-3.5 w-3.5" /> {isSavingDraft ? "Saving…" : "Save to Vault"}
              </Button>
            </div>
          ) : error ? (
            <Button size="sm" className="gap-1.5 rounded-full bg-[#18181B] text-white hover:bg-[#27272A] shadow-xs" onClick={executeGeneration}>
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </Button>
          ) : null
        }
      />

      {/* Observability: Show failed node and display the backend error alert */}
      {error && (
        <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-destructive font-sans">
                Resume Generation Failed
              </h4>
              <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-relaxed font-sans">
                {error}
              </p>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0 w-full md:w-auto">
            <Button size="sm" onClick={executeGeneration} className="gap-1.5 w-full md:w-auto">
              <RotateCcw className="h-3.5 w-3.5" /> Retry Execution
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate({ to: "/resume-studio" })}
              className="gap-1.5 w-full md:w-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Restart Session
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* Left Column: Canvas or Resume Preview */}
        <div className="col-span-12 lg:col-span-8">
          <AnimatePresence mode="wait">
            {generatedResume ? (
              <motion.div
                key="resume-preview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                {/* Template Selector & Tab Switcher Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-sm font-sans">
                  <div className="flex items-center gap-2 flex-1 max-w-[280px]">
                    <span className="text-[12px] font-semibold text-muted-foreground whitespace-nowrap">
                      Template:
                    </span>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={handleSwitchTemplate}
                      disabled={isRendering}
                    >
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {dbTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.isPremium ? "⭐" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex rounded-lg bg-muted p-1 h-9 self-end sm:self-auto">
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={cn(
                        "rounded-md px-3 text-[12px] font-medium transition-all",
                        activeTab === "preview"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Visual Preview
                    </button>
                    <button
                      onClick={() => setActiveTab("pdf")}
                      className={cn(
                        "rounded-md px-3 text-[12px] font-medium transition-all",
                        activeTab === "pdf"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      PDF Preview
                    </button>
                    <button
                      onClick={() => setActiveTab("latex")}
                      className={cn(
                        "rounded-md px-3 text-[12px] font-medium transition-all",
                        activeTab === "latex"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      LaTeX Source
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-8 shadow-subtle min-h-[500px] max-h-[640px] overflow-y-auto">
                  {activeTab === "preview" ? (
                    <div className="space-y-6 font-sans">
                      <div className="border-b border-border pb-4">
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                          {generatedResume.summary ? "Tailored Resume Preview" : "Resume Output"}
                        </h2>
                        <p className="text-primary font-semibold text-lg mt-1">
                          {generatedResume.metadata?.targetRole || session?.targetRole}
                        </p>
                        <p className="text-muted-foreground text-sm mt-0.5">
                          Prepared for{" "}
                          {generatedResume.metadata?.companyName || session?.companyName}
                        </p>
                      </div>

                      {generatedResume.summary && (
                        <div className="space-y-2">
                          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
                            Professional Summary
                          </h3>
                          <p className="text-[13.5px] leading-relaxed text-foreground">
                            {generatedResume.summary}
                          </p>
                        </div>
                      )}

                      {generatedResume.experiences && generatedResume.experiences.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                            Professional Experience
                          </h3>
                          {generatedResume.experiences.map((exp: any, i: number) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[13.5px] font-semibold">
                                <span>
                                  {exp.role} @ {exp.companyName}
                                </span>
                              </div>
                              <p className="text-[12.5px] text-muted-foreground leading-relaxed italic">
                                {exp.description}
                              </p>
                              <ul className="list-disc pl-5 text-[13px] space-y-1 leading-relaxed text-foreground">
                                {exp.bulletPoints?.map((ach: string, j: number) => (
                                  <li key={j}>{ach}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {generatedResume.projects && generatedResume.projects.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                            Projects
                          </h3>
                          {generatedResume.projects.map((proj: any, i: number) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[13.5px] font-semibold">
                                <span>
                                  {proj.name} {proj.role ? `— ${proj.role}` : ""}
                                </span>
                              </div>
                              <p className="text-[12.5px] text-muted-foreground leading-relaxed italic">
                                {proj.description}
                              </p>
                              <ul className="list-disc pl-5 text-[13px] space-y-1 leading-relaxed text-foreground">
                                {proj.bulletPoints?.map((ach: string, j: number) => (
                                  <li key={j}>{ach}</li>
                                ))}
                              </ul>
                              {proj.technologies && proj.technologies.length > 0 && (
                                <div className="text-[11.5px] text-muted-foreground">
                                  <strong>Technologies:</strong> {proj.technologies.join(", ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {generatedResume.skills && generatedResume.skills.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                            Key Skills
                          </h3>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {generatedResume.skills.map((skill: any, i: number) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="rounded-md font-normal text-[12px]"
                              >
                                {skill.name} {skill.level ? `(${skill.level}/5)` : ""}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {generatedResume.education && generatedResume.education.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                            Education
                          </h3>
                          {generatedResume.education.map((edu: any, i: number) => (
                            <div key={i} className="text-[13px] flex justify-between">
                              <div>
                                <strong className="font-semibold">{edu.degree}</strong> in{" "}
                                {edu.field || "General studies"}
                                <div className="text-muted-foreground text-[12px]">
                                  {edu.school}
                                </div>
                              </div>
                              <span className="text-muted-foreground text-[12px]">
                                {edu.startDate ? new Date(edu.startDate).getFullYear() : ""} -{" "}
                                {edu.endDate ? new Date(edu.endDate).getFullYear() : "Present"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {generatedResume.certificates && generatedResume.certificates.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                            Certifications
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {generatedResume.certificates.map((cert: any, i: number) => (
                              <div key={i} className="text-[12.5px]">
                                <span className="font-medium text-foreground">{cert.name}</span>
                                <span className="text-muted-foreground"> · {cert.issuer}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {generatedResume.achievements && generatedResume.achievements.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                            Achievements
                          </h3>
                          <ul className="list-disc pl-5 text-[13px] space-y-1">
                            {generatedResume.achievements.map((ach: string, i: number) => (
                              <li key={i}>{ach}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : activeTab === "pdf" ? (
                    <div className="space-y-4 h-full min-h-[480px]">
                      <div className="flex flex-wrap items-center justify-between gap-3 font-sans">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          Generated PDF Document
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            onClick={() => window.open(pdfUrl, "_blank")}
                            disabled={!pdfUrl || isRendering}
                          >
                            <Eye className="h-3.5 w-3.5" /> View PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = pdfUrl;
                              a.download = "resume.pdf";
                              a.target = "_blank";
                              a.click();
                            }}
                            disabled={!pdfUrl || isRendering}
                          >
                            <Download className="h-3.5 w-3.5" /> Download PDF
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => handleSwitchTemplate(selectedTemplateId)}
                            disabled={isRendering}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Regenerate PDF
                          </Button>
                        </div>
                      </div>
                      {isRendering ? (
                        <div className="flex h-[350px] items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : pdfUrl ? (
                        <div className="w-full h-[480px] rounded-lg border border-border overflow-hidden bg-muted/20">
                          <iframe
                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            className="w-full h-full border-0"
                            title="PDF Resume Preview"
                          />
                        </div>
                      ) : (
                        <div className="flex h-[350px] flex-col items-center justify-center text-center text-muted-foreground font-sans">
                          <FileText className="h-8 w-8 mb-2 opacity-50" />
                          No PDF available. Try regenerating or switching templates.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 font-sans">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          Generated LaTeX Source
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5"
                          onClick={() => {
                            navigator.clipboard.writeText(latexCode);
                            alert("LaTeX copied to clipboard!");
                          }}
                        >
                          Copy Code
                        </Button>
                      </div>
                      {isRendering ? (
                        <div className="flex h-[350px] items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <pre className="p-4 rounded-lg bg-muted/60 text-[12px] font-mono overflow-auto max-h-[480px] leading-relaxed border border-border select-all text-foreground">
                          {latexCode ||
                            "% No LaTeX rendered yet. Try switching templates or check console."}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="flow-canvas"
                className="h-[640px] overflow-hidden rounded-2xl border border-border bg-surface shadow-subtle relative"
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  proOptions={{ hideAttribution: true }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  zoomOnScroll={false}
                  panOnScroll
                  minZoom={0.4}
                  maxZoom={1.2}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="var(--color-border)"
                  />
                </ReactFlow>
                {(session?.status === "PROCESSING" || session?.status === "QUEUED") && (
                  <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] pointer-events-none flex items-center justify-center">
                    <div className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-lifted flex items-center gap-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-[12.5px] font-medium tracking-tight">
                        AI Tailoring Active...
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Time estimates, live progress, and session summary */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Session Summary Card */}
          {session?.status === "COMPLETED" && session.summary && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-soft space-y-4 font-sans">
              <div className="flex items-center gap-2 text-[13.5px] font-bold text-primary">
                <Sparkles className="h-4 w-4 animate-pulse" /> Generation Summary
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12.5px]">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Total Duration
                  </div>
                  <div className="font-semibold">
                    {session.summary.totalDuration?.toFixed(1) || 0}s
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Execution Mode
                  </div>
                  <div className="font-semibold capitalize">
                    {session.summary.executionMode || "development"}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    LLM Provider
                  </div>
                  <div className="font-semibold">{session.summary.llmProvider}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Model
                  </div>
                  <div
                    className="font-semibold text-xs font-mono truncate max-w-[140px]"
                    title={session.summary.model}
                  >
                    {session.summary.model?.split("/").pop()}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Input Tokens
                  </div>
                  <div className="font-semibold font-mono">
                    {session.summary.inputTokens?.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Output Tokens
                  </div>
                  <div className="font-semibold font-mono">
                    {session.summary.outputTokens?.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Total Tokens
                  </div>
                  <div className="font-semibold font-mono text-primary">
                    {session.summary.totalTokens?.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Retries
                  </div>
                  <div className="font-semibold">{session.summary.totalRetries || 0}</div>
                </div>
              </div>
              <div className="border-t border-primary/10 pt-3 space-y-2 text-[11px] text-muted-foreground font-mono">
                <div className="flex justify-between">
                  <span>Session ID:</span>
                  <span
                    className="truncate max-w-[120px] select-all"
                    title={session.summary.sessionId}
                  >
                    {session.summary.sessionId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Version ID:</span>
                  <span
                    className="truncate max-w-[120px] select-all"
                    title={session.summary.versionId}
                  >
                    {session.summary.versionId || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Time Tracking Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Time tracking
              </div>
              <Badge variant="secondary" className="rounded-full text-[11px] font-medium">
                {generatedResume
                  ? "Ready"
                  : error
                    ? "Failed"
                    : session?.status === "PROCESSING" || session?.status === "QUEUED"
                      ? "Generating"
                      : "Idle"}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Elapsed
                </div>
                <div className="text-2xl font-bold tracking-tight">{elapsed}s</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Est. Remaining
                </div>
                <div className="text-2xl font-bold tracking-tight text-primary">
                  {generatedResume
                    ? "0s"
                    : error
                      ? "—"
                      : `${Math.max(0, (steps.length - progressIndex) * 2.5)}s`}
                </div>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${generatedResume ? 100 : progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-2 text-[11.5px] text-muted-foreground flex justify-between">
              <span>
                Step {generatedResume ? steps.length : Math.min(progressIndex + 1, steps.length)} of{" "}
                {steps.length}
              </span>
              <span>{Math.round(generatedResume ? 100 : progressPercent)}% complete</span>
            </div>
          </div>

          {/* ATS Optimization History */}
          {session?.atsRuns && session.atsRuns.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle font-sans space-y-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Target className="h-3.5 w-3.5 text-primary" /> ATS Optimization History
              </div>
              <div className="flex flex-col items-center gap-2 py-1">
                {session.atsRuns.map((run: any, idx: number) => {
                  const isFinal =
                    idx === session.atsRuns.length - 1 && session.status === "COMPLETED";
                  return (
                    <div key={run.id} className="flex flex-col items-center w-full">
                      {idx > 0 && <div className="h-4 w-0.5 bg-border my-1" />}
                      <div className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[12px] font-medium text-muted-foreground">
                          {isFinal ? "Final Score" : `Iteration ${run.iterationNumber}`}
                        </span>
                        <Badge
                          variant={isFinal ? "default" : "secondary"}
                          className="font-semibold"
                        >
                          {run.overallScore} / 100
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Progress Logs */}
          <div className="rounded-2xl border border-border bg-card shadow-subtle font-sans">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Bot className="h-3.5 w-3.5 text-primary" /> Live AI updates
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                {(session?.status === "PROCESSING" || session?.status === "QUEUED") && (
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                )}{" "}
                Logs
              </span>
            </div>
            <ul className="max-h-[380px] space-y-3.5 overflow-y-auto p-5">
              <AnimatePresence initial={false}>
                {steps.map((s, i) => {
                  const stepStatus = stepStates[s.title] || "future";
                  const done = stepStatus === "completed";
                  const active = stepStatus === "running";
                  const stepFailed = stepStatus === "failed";

                  return (
                    <motion.li
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3"
                    >
                      <div
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold font-mono",
                          done && "bg-success/15 text-success",
                          active && "bg-primary/15 text-primary",
                          stepFailed && "bg-destructive/15 text-destructive",
                          !done && !active && !stepFailed && "bg-muted text-muted-foreground",
                        )}
                      >
                        {done ? (
                          <Check className="h-3 w-3" />
                        ) : active ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : stepFailed ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={cn(
                              "text-[12.5px] font-medium tracking-tight",
                              active && "text-primary",
                              stepFailed && "text-destructive",
                            )}
                          >
                            {s.title}
                          </div>
                          <div className="shrink-0 font-mono text-[10px] text-muted-foreground">
                            {done ? "Done" : active ? "Active" : stepFailed ? "Failed" : "Queued"}
                          </div>
                        </div>
                        <div className="text-[11.5px] leading-relaxed text-muted-foreground">
                          {s.detail}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
