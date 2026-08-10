import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Star, Check, X, Search, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Templates — CVPilot" }] }),
  component: TemplatesPage,
});

interface Template {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isPremium?: boolean;
  previewUrl?: string | null;
}

const categoryLabel = (c?: string | null) =>
  c ? c.charAt(0) + c.slice(1).toLowerCase() : "General";

function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selected, setSelected] = useState<string>("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const { user } = useAuthStore();
  const [experiences, setExperiences] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    api
      .get<Template[]>("/templates")
      .then((res) => {
        if (!mounted) return;
        const list = res || [];
        setTemplates(list);
        setFavorites(new Set(list.filter((t) => t.id === "tpl-jake").map((t) => t.id)));
        if (list.length > 0 && !selected) setSelected(list[0].id);
        setTemplatesLoading(false);
      })
      .catch(() => {
        if (mounted) setTemplatesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    api
      .get<any[]>("/profile/experience")
      .then((res) => setExperiences(res || []))
      .catch(() => {});
  }, []);

  const formatYear = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).getFullYear().toString();
    } catch {
      return dateStr;
    }
  };

  const filtered = templates.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));

  const toggleFav = (id: string) => {
    const s = new Set(favorites);
    if (s.has(id)) {
      s.delete(id);
    } else {
      s.add(id);
    }
    setFavorites(s);
  };

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Templates"
        subtitle="Elegant, ATS-friendly starting points curated for every discipline."
        category="GALLERY"
        actions={
          <Button size="sm" className="gap-1.5 rounded-full bg-[#18181B] text-white hover:bg-[#27272A] shadow-xs">
            <Sparkles className="h-3.5 w-3.5" /> Request a template
          </Button>
        }
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#18181B]/50" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search templates…"
            className="h-9 pl-9 rounded-full border border-[rgba(55,50,47,0.12)] bg-[#F8F6F3] text-[12.5px] focus:bg-[#FFFEFC]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
          {["All", "Modern", "Classic", "Engineer", "Executive", "Minimal", "Corporate"].map(
            (t) => (
              <button
                key={t}
                className={cn(
                  "rounded-full border px-3 py-1 uppercase tracking-wider transition-colors",
                  t === "All"
                    ? "border-[#18181B] bg-[#18181B] text-white shadow-xs"
                    : "border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] text-[#18181B]/70 hover:bg-[#F4F1EC] hover:text-[#18181B]",
                )}
              >
                {t}
              </button>
            ),
          )}
        </div>
      </div>

      {templatesLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl border border-[rgba(55,50,47,0.10)] bg-[#FFFEFC] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 editorial-card p-12 text-center text-[13px] text-[#18181B]/60 font-sans">
          No templates found. Try a different search.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const isSelected = selected === t.id;
            const isFav = favorites.has(t.id);
            return (
              <motion.div
                key={t.id}
                layout
                className={cn(
                  "editorial-card group overflow-hidden",
                  isSelected && "border-[#18181B] ring-2 ring-[#18181B]/15",
                )}
              >
                <div className="relative aspect-[3/4] border-b border-[rgba(55,50,47,0.10)] bg-[#F8F6F3] p-4">
                  <button
                    onClick={() => toggleFav(t.id)}
                    className={cn(
                      "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-[rgba(55,50,47,0.12)] bg-[#FFFEFC] transition-colors",
                      isFav ? "text-[#18181B]" : "text-[#18181B]/40 hover:text-[#18181B]",
                    )}
                    aria-label="Favorite"
                  >
                    <Star className={cn("h-3.5 w-3.5", isFav && "fill-[#18181B]")} />
                  </button>
                  {t.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.previewUrl}
                      alt={`${t.name} preview`}
                      className="h-full w-full rounded-xl border border-[rgba(55,50,47,0.10)] object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col rounded-xl border border-[rgba(55,50,47,0.10)] bg-[#FFFEFC] p-4">
                      <div className="h-3 w-32 rounded bg-[#18181B]/10" />
                      <div className="mt-1.5 h-2 w-24 rounded bg-[#18181B]/5" />
                      <div className="mt-4 space-y-1.5">
                        <div className="h-1.5 w-full rounded bg-[#18181B]/5" />
                        <div className="h-1.5 w-11/12 rounded bg-[#18181B]/5" />
                        <div className="h-1.5 w-10/12 rounded bg-[#18181B]/5" />
                      </div>
                      <div className="mt-4 h-2 w-24 rounded bg-[#18181B]/10" />
                      <div className="mt-2 space-y-1.5">
                        <div className="h-1.5 w-full rounded bg-[#18181B]/5" />
                        <div className="h-1.5 w-9/12 rounded bg-[#18181B]/5" />
                      </div>
                      <div className="mt-auto flex gap-2">
                        <div className="h-1.5 w-12 rounded bg-[#18181B]/10" />
                        <div className="h-1.5 w-10 rounded bg-[#18181B]/10" />
                      </div>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#18181B]/20 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      className="pointer-events-auto gap-1.5 rounded-full bg-[#18181B] text-white hover:bg-[#27272A] shadow-xs"
                      onClick={() => setPreview(t.id)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif text-[18px] font-normal text-[#18181B]">{t.name}</span>
                        {t.isPremium && (
                          <Badge variant="secondary" className="rounded-full text-[9.5px] font-mono bg-[#18181B]/5 text-[#18181B] border border-[rgba(55,50,47,0.10)]">
                            <Sparkles className="mr-0.5 h-2.5 w-2.5" /> Premium
                          </Badge>
                        )}
                      </div>
                      <div className="font-mono text-[10.5px] uppercase tracking-widest text-[#18181B]/50">
                        {categoryLabel(t.category)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "gap-1.5 rounded-full text-xs font-medium",
                        isSelected
                          ? "bg-[#18181B] text-white hover:bg-[#27272A]"
                          : "bg-[#FFFEFC] border border-[rgba(55,50,47,0.14)] text-[#18181B] hover:bg-[#F4F1EC]",
                      )}
                      onClick={() => setSelected(t.id)}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3 w-3" /> Selected
                        </>
                      ) : (
                        "Select"
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#18181B]/60 font-sans">
                    {t.description || "Elegant, ATS-friendly layout."}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{templates.find((t) => t.id === preview)?.name} · Preview</DialogTitle>
          </DialogHeader>
          <div className="mx-auto aspect-[8.5/11] w-full max-w-[520px] rounded-lg border border-border bg-background p-8">
            <div className="text-center">
              <div className="text-[18px] font-semibold tracking-tight">
                {user?.profile?.fullName || "Your Name"}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {user?.email || "your.email@example.com"}
                {user?.profile?.location ? ` · ${user.profile.location}` : ""}
              </div>
            </div>
            <div className="mt-6 border-t border-border pt-4 text-left">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Experience
              </div>
              <div className="mt-3 space-y-2">
                {experiences.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground py-2 text-center">
                    No experience records. Complete your profile to preview.
                  </div>
                ) : (
                  experiences.slice(0, 2).map((x) => {
                    const start = x.startDate ? formatYear(x.startDate) : "";
                    const end = x.isCurrent ? "Present" : x.endDate ? formatYear(x.endDate) : "";
                    const range = [start, end].filter(Boolean).join(" – ");
                    return (
                      <div key={x.id}>
                        <div className="text-[12px] font-semibold">
                          {x.role} · {x.companyName}
                        </div>
                        <div className="text-[10.5px] text-foreground/80">{range}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
