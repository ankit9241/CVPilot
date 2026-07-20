import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { mainNav, bottomNav } from "@/constants/navigation";
import { useUIStore } from "@/store/ui-store";
import { templates } from "@/constants/templates";
import { api } from "@/lib/api";
import {
  Sparkles,
  Upload,
  ScanSearch,
  Archive,
  FileText,
  LayoutTemplate,
  User,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

export function CommandPalette() {
  const { commandMenuOpen, setCommandMenuOpen, toggleCommandMenu } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCommandMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCommandMenu]);

  const go = (path: string) => {
    setCommandMenuOpen(false);
    navigate({ to: path });
  };

  const run = (label: string, fn?: () => void) => {
    setCommandMenuOpen(false);
    if (fn) fn();
    else toast(label);
  };

  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    if (commandMenuOpen) {
      api
        .get<any[]>("/vault")
        .then((res) => {
          if (res) {
            setCompanies(Array.from(new Set(res.map((c) => c.company))));
          }
        })
        .catch(() => {});
    }
  }, [commandMenuOpen]);

  return (
    <CommandDialog open={commandMenuOpen} onOpenChange={setCommandMenuOpen}>
      <CommandInput placeholder="Search pages, resumes, templates, commands…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/resume-studio")}>
            <Sparkles className="mr-2 h-3.5 w-3.5" /> Generate resume
            <CommandShortcut>⌘G</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/resume-analyzer")}>
            <ScanSearch className="mr-2 h-3.5 w-3.5" /> Analyze existing resume
          </CommandItem>
          <CommandItem onSelect={() => run("Upload started")}>
            <Upload className="mr-2 h-3.5 w-3.5" /> Upload resume
          </CommandItem>
          <CommandItem onSelect={() => go("/resume-vault")}>
            <Archive className="mr-2 h-3.5 w-3.5" /> Open Resume Vault
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pages">
          {[...mainNav, ...bottomNav].map((n) => (
            <CommandItem key={n.url} onSelect={() => go(n.url)}>
              <n.icon className="mr-2 h-3.5 w-3.5" /> {n.title}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Companies">
          {companies.map((c) => (
            <CommandItem key={c} onSelect={() => go("/resume-vault")}>
              <Building2 className="mr-2 h-3.5 w-3.5" /> {c}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Templates">
          {templates.map((t) => (
            <CommandItem key={t.id} onSelect={() => go("/templates")}>
              <LayoutTemplate className="mr-2 h-3.5 w-3.5" /> {t.name}
              <span className="ml-auto text-[10.5px] text-muted-foreground">{t.tag}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/profile")}>
            <User className="mr-2 h-3.5 w-3.5" /> Profile
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <FileText className="mr-2 h-3.5 w-3.5" /> Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
