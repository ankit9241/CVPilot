import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  History,
  Sparkles,
  Wand2,
  Target,
  Shield,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { analyzerHistory } from "@/constants/dummy-data";

export const Route = createFileRoute("/_app/resume-analyzer")({
  head: () => ({ meta: [{ title: "Resume Analyzer — CVPilot" }] }),
  component: AnalyzerPage,
});

function AnalyzerPage() {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile({ name: accepted[0].name, size: accepted[0].size });
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Resume Analyzer"
        subtitle="Score resumes against real ATS rubrics and get precise, actionable feedback."
        actions={
          <Button size="sm" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Analyze again
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card px-8 py-14 text-center shadow-subtle transition-all",
              isDragActive ? "border-primary/60 bg-accent" : "border-border",
            )}
          >
            <input {...getInputProps()} />
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-background text-primary">
              <Upload className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="mt-5 text-[15px] font-semibold tracking-tight">
              {file ? "Ready to analyze" : "Drop a resume here"}
            </div>
            <div className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
              {file ? file.name : "PDF, DOCX or TXT · up to 10MB. We never store originals."}
            </div>
            {!file && (
              <Button size="sm" variant="outline" className="mt-5">
                Or click to browse
              </Button>
            )}
            {file && (
              <div className="mt-5 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[12px]">
                <FileText className="h-3.5 w-3.5 text-primary" />
                {file.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <ScoreCard
              title="ATS score"
              value={90}
              tone="primary"
              hint="Strong — above 85 is great"
              icon={Shield}
            />
            <ScoreCard
              title="Keyword match"
              value={94}
              tone="success"
              hint="24 of 27 required keywords matched"
              icon={Target}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-subtle">
            <div className="text-[13px] font-semibold">Formatting checks</div>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { ok: true, text: "Consistent bullet style" },
                { ok: true, text: "One column, ATS-safe" },
                { ok: true, text: "No images or tables in body" },
                { ok: false, text: "Two dates are missing month values" },
                { ok: true, text: "Font is a standard system family" },
                { ok: false, text: "Contact block is centered — left-align preferred" },
              ].map((c) => (
                <li
                  key={c.text}
                  className="flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-[12.5px]"
                >
                  {c.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  )}
                  <span className={c.ok ? "text-foreground/85" : "text-foreground"}>{c.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-subtle">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <Wand2 className="h-3.5 w-3.5 text-primary" /> Improvement tips
            </div>
            <ol className="mt-4 space-y-3">
              {[
                "Quantify your Stripe achievements — recruiters weight numbers heavily.",
                "Add 'observability' and 'monorepo' to your Skills section to match the JD.",
                "Consider a 2-line summary tailored to platform engineering.",
                "Move certifications above education for platform roles.",
              ].map((t, i) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-[13px] leading-relaxed text-foreground/85">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
            <div className="text-[13px] font-semibold">Section coverage</div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Contact", value: 100 },
                { label: "Summary", value: 60 },
                { label: "Experience", value: 92 },
                { label: "Projects", value: 78 },
                { label: "Skills", value: 85 },
                { label: "Education", value: 100 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium">{s.value}%</span>
                  </div>
                  <Progress value={s.value} className="mt-1 h-1.5" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
            <div className="text-[13px] font-semibold">Missing skills</div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Mentioned in the JD but absent from your resume.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Observability", "Monorepo", "Design systems", "WebAssembly", "Rust"].map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="rounded-full border-warning/40 bg-warning/5 text-[11px] font-normal text-warning"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-subtle">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-[13px] font-semibold">
              <History className="h-3.5 w-3.5 text-muted-foreground" /> Upload history
            </div>
            <ul className="divide-y divide-border">
              {analyzerHistory.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-2 px-5 py-3 text-[12.5px]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{h.name}</div>
                    <div className="text-[11px] text-muted-foreground">{h.date}</div>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    {h.ats}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  title,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  title: string;
  value: number;
  hint: string;
  tone: "primary" | "success";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
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
