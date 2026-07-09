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
import { templates } from "@/constants/dummy-data";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Templates — CVPilot" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const [selected, setSelected] = useState<string>("t1");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["t1", "t3"]));
  const [preview, setPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

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
        actions={
          <Button size="sm" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Request a template
          </Button>
        }
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search templates…"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 text-[12px]">
          {["All", "Modern", "Classic", "Engineer", "Executive", "Minimal", "Corporate"].map(
            (t) => (
              <button
                key={t}
                className={cn(
                  "rounded-full border px-3 py-1 transition-colors",
                  t === "All"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const isSelected = selected === t.id;
          const isFav = favorites.has(t.id);
          return (
            <motion.div
              key={t.id}
              layout
              className={cn(
                "group overflow-hidden rounded-2xl border bg-card shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft",
                isSelected ? "border-primary/50 ring-2 ring-primary/15" : "border-border",
              )}
            >
              <div className="relative aspect-[3/4] border-b border-border bg-surface p-4">
                <button
                  onClick={() => toggleFav(t.id)}
                  className={cn(
                    "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md border border-border bg-background transition-colors",
                    isFav ? "text-warning" : "text-muted-foreground hover:text-warning",
                  )}
                  aria-label="Favorite"
                >
                  <Star className={cn("h-3.5 w-3.5", isFav && "fill-warning")} />
                </button>
                <div className="flex h-full flex-col rounded-md border border-border bg-background p-4">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="mt-1.5 h-2 w-24 rounded bg-muted/70" />
                  <div className="mt-4 space-y-1.5">
                    <div className="h-1.5 w-full rounded bg-muted/60" />
                    <div className="h-1.5 w-11/12 rounded bg-muted/60" />
                    <div className="h-1.5 w-10/12 rounded bg-muted/60" />
                  </div>
                  <div className="mt-4 h-2 w-24 rounded bg-muted" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 w-full rounded bg-muted/60" />
                    <div className="h-1.5 w-9/12 rounded bg-muted/60" />
                  </div>
                  <div className="mt-auto flex gap-2">
                    <div className="h-1.5 w-12 rounded bg-muted" />
                    <div className="h-1.5 w-10 rounded bg-muted" />
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    className="pointer-events-auto gap-1.5"
                    onClick={() => setPreview(t.id)}
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold tracking-tight">{t.name}</div>
                    <div className="text-[11.5px] text-muted-foreground">{t.tag}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className="gap-1.5"
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
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{t.tone}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{templates.find((t) => t.id === preview)?.name} · Preview</DialogTitle>
          </DialogHeader>
          <div className="mx-auto aspect-[8.5/11] w-full max-w-[520px] rounded-lg border border-border bg-background p-8">
            <div className="text-center">
              <div className="text-[18px] font-semibold tracking-tight">Alex Larsen</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                alex@cvpilot.io · San Francisco
              </div>
            </div>
            <div className="mt-6 border-t border-border pt-4">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Experience
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="text-[12px] font-semibold">Senior Product Engineer · Linear</div>
                  <div className="text-[10.5px] text-foreground/80">Jan 2023 – Present</div>
                </div>
                <div>
                  <div className="text-[12px] font-semibold">Product Engineer · Stripe</div>
                  <div className="text-[10.5px] text-foreground/80">Jun 2020 – Dec 2022</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
