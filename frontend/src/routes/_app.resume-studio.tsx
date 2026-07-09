import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generationHistory, currentUser, experience, projects } from "@/constants/dummy-data";

export const Route = createFileRoute("/_app/resume-studio")({
  head: () => ({ meta: [{ title: "Resume Studio — CVPilot" }] }),
  component: ResumeStudioPage,
});

function ResumeStudioPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("Senior Frontend Engineer");

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Resume Studio"
        subtitle="Paste a job, generate a precise resume, review it live."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => navigate({ to: "/workflow" })}>
              <Sparkles className="h-3.5 w-3.5" /> Generate resume
            </Button>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-12 space-y-4 lg:col-span-5">
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
                  placeholder="A short note about the company's tone, values, product…"
                  defaultValue="Google is a large, technical, product-driven company. Prefers concise, quantified impact and platform-scale thinking."
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
                  defaultValue={`About the role\nWe are looking for a senior frontend engineer to help us build the next generation of Google Cloud's console.\n\nWhat you'll do\n• Architect scalable, accessible interfaces used by millions of developers.\n• Partner with design on high-quality interactions.\n• Improve performance across critical rendering paths.\n\nWhat you'll bring\n• 5+ years of TypeScript / React experience.\n• Deep understanding of performance, a11y, and testing.\n• Experience with monorepos, design systems, and dev tools.\n\nBonus\n• GraphQL, Rust, or WebAssembly experience.\n• Contributions to open source.`}
                />
                <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
                  <span>1,247 characters</span>
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
            <ul className="mt-3 divide-y divide-border">
              {generationHistory.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-2 py-2.5 text-[12.5px]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{h.label}</div>
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

        {/* RIGHT */}
        <div className="col-span-12 space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-border bg-card shadow-subtle">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Live preview
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="gap-1.5 text-[12px]">
                  <Eye className="h-3 w-3" /> Full preview
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-[12px]">
                  <Download className="h-3 w-3" /> PDF
                </Button>
              </div>
            </div>
            <div className="p-5">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mx-auto aspect-[8.5/11] w-full max-w-[560px] rounded-lg border border-border bg-background p-8 shadow-soft"
              >
                <div className="text-center">
                  <div className="text-[18px] font-semibold tracking-tight">{currentUser.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {currentUser.email} · {currentUser.phone} · {currentUser.location}
                  </div>
                </div>
                <div className="mt-6 border-t border-border pt-4">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Experience
                  </div>
                  <div className="mt-3 space-y-3">
                    {experience.slice(0, 2).map((x) => (
                      <div key={x.id}>
                        <div className="flex items-baseline justify-between">
                          <div className="text-[12px] font-semibold">
                            {x.role} · {x.company}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {x.start} – {x.end}
                          </div>
                        </div>
                        <ul className="mt-1 space-y-0.5">
                          {x.achievements.slice(0, 2).map((a) => (
                            <li
                              key={a}
                              className="text-[10.5px] leading-relaxed text-foreground/80"
                            >
                              • {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Projects
                  </div>
                  <div className="mt-3 space-y-2">
                    {projects.slice(0, 2).map((p) => (
                      <div key={p.id}>
                        <div className="text-[12px] font-semibold">{p.name}</div>
                        <div className="text-[10.5px] leading-relaxed text-foreground/80">
                          {p.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Skills
                  </div>
                  <div className="mt-2 text-[10.5px] text-foreground/80">
                    TypeScript · React · TanStack · Node · GraphQL · Postgres · AWS · Cloudflare
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  ATS summary
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-[32px] font-semibold tracking-tight">88</span>
                  <span className="text-[13px] text-muted-foreground">/ 100</span>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full">
                Strong
              </Badge>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[88%] rounded-full bg-primary" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
              {[
                ["Keywords", "92%"],
                ["Formatting", "100%"],
                ["Verbs", "84%"],
                ["Structure", "96%"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-border bg-background p-3">
                  <div className="text-muted-foreground">{l}</div>
                  <div className="mt-1 text-[15px] font-semibold">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
