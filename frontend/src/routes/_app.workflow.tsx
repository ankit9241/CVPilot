import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { workflowSteps } from "@/constants/dummy-data";

export const Route = createFileRoute("/_app/workflow")({
  head: () => ({ meta: [{ title: "Workflow — CVPilot" }] }),
  component: WorkflowPage,
});

type Status = "idle" | "running" | "completed" | "future";

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
        "w-[220px] rounded-xl border bg-card p-3 text-left shadow-soft transition-all",
        status === "completed" && "border-success/40",
        status === "running" && "border-primary/50 shadow-lifted",
        status === "idle" && "border-border",
        status === "future" && "border-dashed border-border opacity-70",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-1.5 !w-1.5 !border-0 !bg-border"
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <StatusPill status={status} />
      </div>
      <div className="mt-1.5 text-[13px] font-semibold tracking-tight">{title}</div>
      <div className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
        {status === "running" && "In progress…"}
        {status === "completed" && "Completed"}
        {status === "idle" && "Waiting"}
        {status === "future" && "Future ready"}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1.5 !w-1.5 !border-0 !bg-border"
      />
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
        <Check className="h-2.5 w-2.5" /> Done
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Running
      </span>
    );
  }
  if (status === "future") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        Future
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      Idle
    </span>
  );
}

const nodeTypes = { step: StepNode };

function WorkflowPage() {
  const [progress, setProgress] = useState(3); // number of completed steps
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setProgress((p) => (p >= workflowSteps.length ? p : p + 1));
    }, 2600);
    return () => clearInterval(t);
  }, [running]);

  const complete = progress >= workflowSteps.length;

  const { nodes, edges } = useMemo(() => {
    const n: Node<StepNodeData>[] = workflowSteps.map((s, i) => {
      const col = i % 2;
      const status: Status =
        i < progress ? "completed" : i === progress ? (running ? "running" : "idle") : "future";
      return {
        id: s.id,
        position: { x: col === 0 ? 40 : 320, y: i * 130 },
        type: "step",
        data: { title: s.title, detail: s.detail, status, index: i },
      };
    });
    const e: Edge[] = workflowSteps.slice(0, -1).map((s, i) => ({
      id: `${s.id}-${workflowSteps[i + 1].id}`,
      source: s.id,
      target: workflowSteps[i + 1].id,
      animated: i < progress,
      style: {
        stroke: i < progress ? "var(--color-primary)" : "var(--color-border)",
        strokeWidth: 1.5,
      },
    }));
    return { nodes: n, edges: e };
  }, [progress, running]);

  const activityLog = workflowSteps.slice(0, Math.min(progress + 1, workflowSteps.length));
  const currentStep = workflowSteps[Math.min(progress, workflowSteps.length - 1)];

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Workflow"
        subtitle="A visual pipeline of every step CVPilot takes to tailor your resume."
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                setProgress(0);
                setRunning(true);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restart
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setRunning((r) => !r)}>
              {running ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Resume
                </>
              )}
            </Button>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* Flow canvas */}
        <div className="col-span-12 xl:col-span-8">
          <div className="h-[640px] overflow-hidden rounded-2xl border border-border bg-surface shadow-subtle">
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
          </div>
        </div>

        {/* Right column: estimate + activity */}
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Estimated time
              </div>
              <Badge variant="secondary" className="rounded-full text-[11px]">
                {complete ? "Ready" : running ? "Generating" : "Paused"}
              </Badge>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[32px] font-semibold tracking-tight">
                {complete ? "0s" : `${Math.max(0, (workflowSteps.length - progress) * 3)}s`}
              </span>
              <span className="text-[12px] text-muted-foreground">remaining</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${(progress / workflowSteps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-2 text-[11.5px] text-muted-foreground">
              Step {Math.min(progress + 1, workflowSteps.length)} of {workflowSteps.length}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-subtle">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Bot className="h-3.5 w-3.5 text-primary" /> AI activity
              </div>
              <span className="text-[11px] text-muted-foreground">Live</span>
            </div>
            <ul className="max-h-[300px] space-y-3 overflow-y-auto p-5">
              <AnimatePresence initial={false}>
                {activityLog.map((s, i) => {
                  const done = i < progress;
                  const active = i === progress && running;
                  return (
                    <motion.li
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-start gap-3"
                    >
                      <div
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]",
                          done && "bg-success/15 text-success",
                          active && "bg-primary/15 text-primary",
                          !done && !active && "bg-muted text-muted-foreground",
                        )}
                      >
                        {done ? (
                          <Check className="h-3 w-3" />
                        ) : active ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-[12.5px] font-medium">{s.title}</div>
                          <div className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
                            {done ? `+${(i + 1) * 3}s` : active ? "now" : "queued"}
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

          {complete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/30 bg-card p-5 shadow-soft"
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Resume ready
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                Google · Frontend Engineer v3 · ATS 91. Saved to your vault.
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
                <Button size="sm" variant="outline">
                  Open in Studio
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
