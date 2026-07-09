import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Star,
  Upload,
  Eye,
  Download,
  Copy,
  Trash2,
  RotateCw,
  MoreHorizontal,
  Building2,
  Folder,
  FileText,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { resumeVault } from "@/constants/dummy-data";

export const Route = createFileRoute("/_app/resume-vault")({
  head: () => ({ meta: [{ title: "Resume Vault — CVPilot" }] }),
  component: VaultPage,
});

function VaultPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [expanded, setExpanded] = useState<string | null>(resumeVault[0]?.company ?? null);
  const [selectedCompany, setSelectedCompany] = useState<string>(resumeVault[0]?.company ?? "");
  const [selectedRole, setSelectedRole] = useState<string | null>(
    resumeVault[0]?.roles[0]?.role ?? null,
  );

  const company = resumeVault.find((c) => c.company === selectedCompany);
  const roleData = company?.roles.find((r) => r.role === selectedRole);
  const versions = roleData?.versions ?? company?.roles.flatMap((r) => r.versions) ?? [];

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Resume Vault"
        subtitle="Every version of every resume — organised, searchable, always yours."
        actions={
          <Button size="sm" className="gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Upload resume
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* Tree */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card shadow-subtle">
            <div className="border-b border-border px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Companies
            </div>
            <ul className="p-2">
              {resumeVault.map((c) => (
                <li key={c.company}>
                  <button
                    onClick={() => {
                      setExpanded(expanded === c.company ? null : c.company);
                      setSelectedCompany(c.company);
                      setSelectedRole(c.roles[0]?.role ?? null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                      selectedCompany === c.company
                        ? "bg-accent text-foreground"
                        : "text-foreground/80 hover:bg-accent/60",
                    )}
                  >
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform",
                        expanded === c.company && "rotate-90",
                      )}
                    />
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-background font-mono text-[10.5px] font-semibold">
                      {c.logo}
                    </div>
                    <span className="truncate font-medium">{c.company}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {c.roles.reduce((acc, r) => acc + r.versions.length, 0)}
                    </span>
                  </button>
                  <AnimatePresence>
                    {expanded === c.company && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-8"
                      >
                        {c.roles.map((r) => (
                          <li key={r.role}>
                            <button
                              onClick={() => {
                                setSelectedCompany(c.company);
                                setSelectedRole(r.role);
                              }}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors",
                                selectedRole === r.role && selectedCompany === c.company
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                              )}
                            >
                              <Folder className="h-3 w-3 shrink-0" />
                              <span className="truncate">{r.role}</span>
                              <span className="ml-auto text-[11px]">{r.versions.length}</span>
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9">
          <div className="rounded-2xl border border-border bg-card shadow-subtle">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search versions, templates…" className="h-9 pl-8" />
              </div>
              <Select defaultValue="date">
                <SelectTrigger className="h-9 w-[150px] text-[12.5px]">
                  <Filter className="mr-1 h-3 w-3" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Newest first</SelectItem>
                  <SelectItem value="ats">Highest ATS</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex overflow-hidden rounded-md border border-border">
                <button
                  onClick={() => setView("grid")}
                  className={cn(
                    "grid h-9 w-9 place-items-center transition-colors",
                    view === "grid"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60",
                  )}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "grid h-9 w-9 place-items-center border-l border-border transition-colors",
                    view === "list"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60",
                  )}
                  aria-label="List view"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 border-b border-border px-5 py-2.5 text-[12px] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{selectedCompany}</span>
              {selectedRole && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span>{selectedRole}</span>
                </>
              )}
              <span className="ml-auto">{versions.length} versions</span>
            </div>

            {/* Body */}
            {view === "grid" ? (
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {versions.map((v) => (
                  <VersionCard
                    key={v.id}
                    v={v}
                    company={selectedCompany}
                    role={selectedRole ?? ""}
                  />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-medium">{v.name}</span>
                        {v.favorite && <Star className="h-3 w-3 fill-warning text-warning" />}
                      </div>
                      <div className="truncate text-[11.5px] text-muted-foreground">
                        {v.template} · {v.date}
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-full text-[11px]">
                      ATS {v.ats}
                    </Badge>
                    <RowActions />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

interface VaultVersion {
  id: string;
  name: string;
  ats: number;
  template: string;
  date: string;
  favorite: boolean;
}

function VersionCard({ v, company, role }: { v: VaultVersion; company: string; role: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group overflow-hidden rounded-xl border border-border bg-background shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="relative aspect-[3/4] border-b border-border bg-surface p-3">
        <button
          className={cn(
            "absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md border border-border bg-background transition-colors",
            v.favorite ? "text-warning" : "text-muted-foreground hover:text-warning",
          )}
          aria-label="Favorite"
        >
          <Star className={cn("h-3.5 w-3.5", v.favorite && "fill-warning")} />
        </button>
        <div className="flex h-full flex-col rounded-md border border-border bg-card p-4">
          <div className="h-2.5 w-24 rounded bg-muted" />
          <div className="mt-1 h-1.5 w-32 rounded bg-muted/70" />
          <div className="mt-3 space-y-1">
            <div className="h-1 w-full rounded bg-muted/60" />
            <div className="h-1 w-10/12 rounded bg-muted/60" />
            <div className="h-1 w-9/12 rounded bg-muted/60" />
          </div>
          <div className="mt-3 h-1.5 w-16 rounded bg-muted" />
          <div className="mt-1.5 space-y-1">
            <div className="h-1 w-full rounded bg-muted/60" />
            <div className="h-1 w-8/12 rounded bg-muted/60" />
          </div>
          <div className="mt-auto h-1.5 w-12 rounded bg-muted" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{v.name}</div>
            <div className="truncate text-[11.5px] text-muted-foreground">
              {company} · {role || "—"} · {v.template}
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full text-[11px]">
            {v.ats}
          </Badge>
        </div>
        <div className="mt-4 flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8 gap-1 px-2 text-[11.5px]">
            <Eye className="h-3 w-3" />
            Preview
          </Button>
          <Button size="sm" variant="ghost" className="h-8 gap-1 px-2 text-[11.5px]">
            <Download className="h-3 w-3" />
            PDF
          </Button>
          <div className="ml-auto">
            <RowActions />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RowActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="More">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="gap-2 text-[12.5px]">
          <Eye className="h-3.5 w-3.5" />
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-[12.5px]">
          <Download className="h-3.5 w-3.5" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-[12.5px]">
          <Copy className="h-3.5 w-3.5" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-[12.5px]">
          <RotateCw className="h-3.5 w-3.5" />
          Regenerate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-[12.5px] text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
