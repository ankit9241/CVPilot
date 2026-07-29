/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Star,
  Eye,
  Download,
  Trash2,
  RotateCw,
  MoreHorizontal,
  Building2,
  Folder,
  FileText,
  ChevronRight,
  Sparkles,
  Save,
  Loader2,
  X,
  ExternalLink,
  CheckCircle2,
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
import { api } from "../lib/api";

export const Route = createFileRoute("/_app/resume-vault")({
  head: () => ({ meta: [{ title: "Resume Vault — CVPilot" }] }),
  component: VaultPage,
});

function VaultPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [vault, setVault] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewVersion, setPreviewVersion] = useState<any | null>(null);

  const fetchVault = useCallback(() => {
    api
      .get<any[]>("/vault")
      .then((res) => {
        setVault(res || []);
        setLoading(false);
        if (res && res.length > 0 && !selectedCompany) {
          setExpanded(res[0].company);
          setSelectedCompany(res[0].company);
          setSelectedRole(res[0].roles?.[0]?.role || null);
        }
      })
      .catch(() => setLoading(false));
  }, [selectedCompany]);

  useEffect(() => {
    fetchVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (vault.length === 0) {
    return (
      <div className="container-page py-8 lg:py-10">
        <PageHeader
          title="Resume Vault"
          subtitle="Every version of every resume — organised, searchable, always yours."
        />
        <div className="editorial-card mt-8 flex flex-col items-center justify-center p-10 sm:p-14 text-center min-h-[400px]">
          <Folder className="h-12 w-12 text-muted-foreground/60" strokeWidth={1.5} />
          <div className="mt-4 font-serif text-[24px] font-normal text-foreground">Your Vault is empty</div>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
            Generate a resume from the Resume Studio — it will automatically appear here once
            complete.
          </p>
          <Button size="sm" asChild className="mt-6 gap-1.5 font-medium">
            <Link to="/resume-studio">
              <Sparkles className="h-3.5 w-3.5" /> Go to Resume Studio
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const company = vault.find((c) => c.company === selectedCompany);
  const roleData = company?.roles?.find((r: any) => r.role === selectedRole);
  const versions = roleData?.versions ?? company?.roles?.flatMap((r: any) => r.versions) ?? [];

  const filteredVersions = versions.filter((v: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.name?.toLowerCase().includes(q) || v.template?.toLowerCase().includes(q);
  });

  const handleSaveToVault = async (v: any) => {
    try {
      await api.post("/resumes", {
        versionId: v.id,
        title: `${selectedCompany} · ${selectedRole || v.role} – ${v.name}`,
        company: selectedCompany,
        role: selectedRole || v.role,
      });
      fetchVault();
    } catch (err: any) {
      alert("Failed to save: " + (err.message || "Unknown error"));
    }
  };

  const handleDelete = async (v: any) => {
    if (!v.savedResumeId) return;
    if (!confirm("Remove this resume from vault?")) return;
    try {
      await api.delete(`/resumes/${v.savedResumeId}`);
      fetchVault();
    } catch (err: any) {
      alert("Failed to delete: " + (err.message || "Unknown error"));
    }
  };

  const handleDownload = (v: any) => {
    if (!v.pdfUrl) {
      alert("No PDF available. Render a template first in Resume Studio.");
      return;
    }
    const a = document.createElement("a");
    a.href = v.pdfUrl;
    a.download = `${v.name || "resume"}.pdf`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRegenerate = (v: any) => {
    navigate({ to: "/workflow", search: { sessionId: v.sessionId } });
  };

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Resume Vault"
        subtitle="Every version of every resume — organised, searchable, always yours."
      />

      <div className="mt-8 grid grid-cols-12 gap-6">
        {/* Tree */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card shadow-subtle">
            <div className="border-b border-border px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Companies
            </div>
            <ul className="p-2">
              {vault.map((c) => (
                <li key={c.company}>
                  <button
                    onClick={() => {
                      setExpanded(expanded === c.company ? null : c.company);
                      setSelectedCompany(c.company);
                      setSelectedRole(c.roles?.[0]?.role ?? null);
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
                      {c.roles.reduce((acc: number, r: any) => acc + r.versions.length, 0)}
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
                        {c.roles.map((r: any) => (
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
                <Input
                  placeholder="Search versions, templates…"
                  className="h-9 pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select defaultValue="date">
                <SelectTrigger className="h-9 w-[150px] text-[12.5px]">
                  <Filter className="mr-1 h-3 w-3" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Newest first</SelectItem>
                  <SelectItem value="ats">Highest ATS</SelectItem>
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
              <span className="ml-auto">{filteredVersions.length} versions</span>
            </div>

            {/* Body */}
            {filteredVersions.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground p-8">
                <FileText className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-[13.5px] font-medium">No resumes found</p>
                <p className="text-[12px] mt-1">Try a different search or generate a new resume.</p>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVersions.map((v: any) => (
                  <VersionCard
                    key={v.id}
                    v={v}
                    company={selectedCompany}
                    role={selectedRole ?? ""}
                    onPreview={() => setPreviewVersion(v)}
                    onDownload={() => handleDownload(v)}
                    onSave={() => handleSaveToVault(v)}
                    onDelete={() => handleDelete(v)}
                    onRegenerate={() => handleRegenerate(v)}
                  />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredVersions.map((v: any) => (
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
                        {v.isSaved && (
                          <span title="Saved to vault">
                            <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                          </span>
                        )}
                        {v.favorite && <Star className="h-3 w-3 fill-warning text-warning" />}
                      </div>
                      <div className="truncate text-[11.5px] text-muted-foreground">
                        {v.template} · {new Date(v.date).toLocaleDateString()}
                      </div>
                    </div>
                    {v.ats > 0 && (
                      <Badge variant="secondary" className="rounded-full text-[11px]">
                        ATS {v.ats}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      {v.pdfUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewVersion(v)}
                          title="Preview PDF"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(v)}
                        disabled={!v.pdfUrl}
                        title="Download PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <RowActions
                        v={v}
                        onPreview={() => setPreviewVersion(v)}
                        onDownload={() => handleDownload(v)}
                        onSave={() => handleSaveToVault(v)}
                        onDelete={() => handleDelete(v)}
                        onRegenerate={() => handleRegenerate(v)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {previewVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setPreviewVersion(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-lifted overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div>
                  <div className="text-[14px] font-semibold">{previewVersion.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {selectedCompany} · {selectedRole} · {previewVersion.template}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {previewVersion.pdfUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5"
                      onClick={() => window.open(previewVersion.pdfUrl, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </Button>
                  )}
                  {previewVersion.pdfUrl && (
                    <Button
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => handleDownload(previewVersion)}
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </Button>
                  )}
                  {previewVersion.isSaved && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 gap-1.5"
                      onClick={() => {
                        handleDelete(previewVersion);
                        setPreviewVersion(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setPreviewVersion(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* PDF iframe */}
              <div className="h-[75vh] bg-muted/20">
                {previewVersion.pdfUrl ? (
                  <iframe
                    src={`${previewVersion.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="h-full w-full border-0"
                    title="Resume PDF Preview"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-[13.5px] font-medium">No PDF available</p>
                    <p className="text-[12px] mt-1 max-w-xs">
                      Go to the workflow page and switch templates to generate a PDF.
                    </p>
                    <Button
                      size="sm"
                      className="mt-4 gap-1.5"
                      onClick={() => {
                        setPreviewVersion(null);
                        navigate({
                          to: "/workflow",
                          search: { sessionId: previewVersion.sessionId },
                        });
                      }}
                    >
                      <RotateCw className="h-3.5 w-3.5" /> Go to Workflow
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface VersionCardProps {
  v: any;
  company: string;
  role: string;
  onPreview: () => void;
  onDownload: () => void;
  onSave: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}

function VersionCard({
  v,
  company,
  role,
  onPreview,
  onDownload,
  onSave,
  onDelete,
  onRegenerate,
}: VersionCardProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group overflow-hidden rounded-xl border border-border bg-background shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft"
    >
      {/* Thumbnail area */}
      <div className="relative aspect-[3/4] border-b border-border bg-surface">
        {v.pdfUrl ? (
          <iframe
            src={`${v.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
            className="h-full w-full border-0 pointer-events-none"
            title={`Preview – ${v.name}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col rounded-md bg-card p-4">
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
        )}
        {/* Overlay buttons on hover */}
        {v.pdfUrl && (
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              className="h-9 gap-1.5 shadow-sm"
              onClick={onPreview}
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button size="sm" className="h-9 gap-1.5 shadow-sm" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </div>
        )}
        {/* Status badges */}
        <div className="absolute left-2 top-2 flex gap-1">
          {v.isSaved && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success border border-success/20">
              <CheckCircle2 className="h-2.5 w-2.5" /> Saved
            </span>
          )}
        </div>
        <button
          className={cn(
            "absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md border border-border bg-background/90 transition-colors",
            v.favorite ? "text-warning" : "text-muted-foreground hover:text-warning",
          )}
          aria-label="Favorite"
        >
          <Star className={cn("h-3.5 w-3.5", v.favorite && "fill-warning")} />
        </button>
      </div>

      {/* Card footer */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{v.name}</div>
            <div className="truncate text-[11.5px] text-muted-foreground">
              {company} · {role || "—"}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {new Date(v.date).toLocaleDateString()}
            </div>
          </div>
          {v.ats > 0 && (
            <Badge variant="secondary" className="rounded-full text-[11px] shrink-0">
              ATS {v.ats}
            </Badge>
          )}
        </div>
        <div className="mt-4 flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 px-2 text-[11.5px]"
            onClick={onPreview}
            disabled={!v.pdfUrl}
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 px-2 text-[11.5px]"
            onClick={onDownload}
            disabled={!v.pdfUrl}
          >
            <Download className="h-3 w-3" />
            PDF
          </Button>
          {v.isSaved && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1 px-2 text-[11.5px] text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          )}
          <div className="ml-auto">
            <RowActions
              v={v}
              onPreview={onPreview}
              onDownload={onDownload}
              onSave={handleSave}
              onDelete={onDelete}
              onRegenerate={onRegenerate}
              saving={saving}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface RowActionsProps {
  v: any;
  onPreview: () => void;
  onDownload: () => void;
  onSave: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  saving?: boolean;
}

function RowActions({
  v,
  onPreview,
  onDownload,
  onSave,
  onDelete,
  onRegenerate,
  saving,
}: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="More">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {v.pdfUrl && (
          <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5" />
            Preview PDF
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={onDownload} disabled={!v.pdfUrl}>
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {!v.isSaved && (
          <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={onSave} disabled={saving}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save to Vault"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="gap-2 text-[12.5px]" onClick={onRegenerate}>
          <RotateCw className="h-3.5 w-3.5" />
          View in Studio
        </DropdownMenuItem>
        {v.isSaved && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-[12.5px] text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove from Vault
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
