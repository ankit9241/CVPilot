/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Settings2,
  AlertTriangle,
  Link2,
  Palette,
  Check,
  Trash2,
  KeyRound,
  Camera,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — CVPilot" }] }),
  component: SettingsPage,
});

type Key =
  "profile" | "security" | "notifications" | "preferences" | "connected" | "appearance" | "danger";

const nav: {
  key: Key;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "preferences", label: "Preferences", icon: Settings2 },
  { key: "connected", label: "Connected accounts", icon: Link2 },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "danger", label: "Danger zone", icon: AlertTriangle },
];

function SettingsPage() {
  const [active, setActive] = useState<Key>("profile");
  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader title="Settings" subtitle="Preferences, integrations and account controls." category="ACCOUNT" />

      <div className="mt-8 grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3">
          <nav className="editorial-card sticky top-20 p-2 space-y-1">
            {nav.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors",
                  active === s.key
                    ? s.key === "danger"
                      ? "bg-destructive/10 text-destructive font-semibold"
                      : "bg-[#FFFEFC] text-[#18181B] border border-[rgba(55,50,47,0.12)] shadow-xs font-semibold"
                    : "text-[#18181B]/70 hover:bg-[#F4F1EC] hover:text-[#18181B]",
                )}
              >
                <s.icon className="h-3.5 w-3.5 text-[#18181B]/60" strokeWidth={1.5} />
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {active === "profile" && <ProfilePanel />}
              {active === "security" && <SecurityPanel />}
              {active === "notifications" && <NotificationsPanel />}
              {active === "preferences" && <PreferencesPanel />}
              {active === "connected" && <ConnectedPanel />}
              {active === "appearance" && <AppearancePanel />}
              {active === "danger" && <DangerPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="editorial-card">
      <div className="border-b border-[rgba(55,50,47,0.10)] p-6">
        <h2 className="font-serif text-[20px] font-normal leading-tight text-[#18181B]">{title}</h2>
        <p className="mt-1 text-[13px] text-[#18181B]/70 font-sans">{description}</p>
      </div>
      <div className="p-6">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-[rgba(55,50,47,0.10)] p-4 bg-[#F8F6F3]/50 rounded-b-[22px]">{footer}</div>}
    </div>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        {description && <div className="text-[12px] text-muted-foreground">{description}</div>}
      </div>
      {children}
    </div>
  );
}

function ProfilePanel() {
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.fullName || "");
      setHeadline(user.profile.headline || "");
      setLocation(user.profile.location || "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedProfile = await api.put<any>("/profile", {
        fullName,
        headline,
        location,
      });
      setUser({
        ...user!,
        profile: updatedProfile,
      });
      toast.success("Profile saved successfully");
    } catch (e) {
      toast.error("Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Card
      title="Profile"
      description="Public info visible on shared resumes and profile links."
      footer={
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      }
    >
      <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
        <Avatar className="h-14 w-14 border border-border">
          {user?.profile?.avatarUrl && <AvatarImage src={user.profile.avatarUrl} alt={fullName} />}
          <AvatarFallback className="bg-primary/10 text-[15px] font-semibold text-primary">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-[13px] font-medium">Profile photo</div>
          <div className="text-[12px] text-muted-foreground">JPG or PNG · 400 × 400px</div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[12px]">Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px]">Email</Label>
          <Input
            value={user?.email || ""}
            disabled
            className="h-10 bg-muted/50 cursor-not-allowed"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px]">Role / Headline</Label>
          <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px]">Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-10" />
        </div>
      </div>
    </Card>
  );
}

function SecurityPanel() {
  return (
    <>
      <Card
        title="Password"
        description="Change your account password."
        footer={<Button size="sm">Update password</Button>}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Current password</Label>
            <Input type="password" placeholder="••••••••" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">New password</Label>
            <Input type="password" placeholder="••••••••" className="h-10" />
          </div>
        </div>
      </Card>
      <Card title="Two-factor authentication" description="Extra security on every sign-in.">
        <Row label="Authenticator app" description="Use Authy, 1Password or any TOTP app.">
          <Switch defaultChecked />
        </Row>
        <div className="my-2 border-t border-border" />
        <Row label="Backup codes" description="Download one-time codes for account recovery.">
          <Button size="sm" variant="outline" className="gap-1.5">
            <KeyRound className="h-3.5 w-3.5" /> Generate
          </Button>
        </Row>
      </Card>
      <Card title="Sessions" description="Devices where you're currently signed in.">
        <ul className="divide-y divide-border">
          {[{ d: "Active Browser Session", w: "This device · Active now" }].map((s, i) => (
            <li key={s.d} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="text-[13px] font-semibold">{s.d}</div>
                <div className="text-[11.5px] text-muted-foreground">{s.w}</div>
              </div>
              <Badge variant="secondary" className="rounded-full text-[11px]">
                Current
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function NotificationsPanel() {
  return (
    <Card title="Notifications" description="Choose what CVPilot notifies you about, and how.">
      {[
        { l: "Resume ready", d: "When a generation finishes." },
        { l: "ATS score changes", d: "When a resume score changes by more than 5 points." },
        { l: "AI suggestions", d: "New suggestions for your profile or resumes." },
        { l: "Product updates", d: "New features and improvements." },
        { l: "Weekly digest", d: "A quiet summary every Friday." },
      ].map((n, i) => (
        <div key={n.l}>
          <Row label={n.l} description={n.d}>
            <Switch defaultChecked={i !== 3} />
          </Row>
          {i < 4 && <div className="border-t border-border" />}
        </div>
      ))}
    </Card>
  );
}

function PreferencesPanel() {
  return (
    <Card title="Preferences" description="Small choices that shape your workspace.">
      <Row label="Default template" description="Used when starting a new resume.">
        <Badge variant="secondary" className="rounded-full">
          Modern
        </Badge>
      </Row>
      <div className="border-t border-border" />
      <Row label="Language" description="Interface and generated resumes.">
        <Badge variant="secondary" className="rounded-full">
          English
        </Badge>
      </Row>
      <div className="border-t border-border" />
      <Row label="Timezone" description="Used in activity timestamps.">
        <Badge variant="secondary" className="rounded-full">
          Pacific · UTC−8
        </Badge>
      </Row>
      <div className="border-t border-border" />
      <Row label="Compact density" description="Tighter spacing across surfaces.">
        <Switch />
      </Row>
    </Card>
  );
}

function ConnectedPanel() {
  const { user } = useAuthStore();
  const accounts = [
    { n: "Google", d: user?.email || "Not connected", c: !!user?.email },
    { n: "GitHub", d: "Not connected", c: false },
    { n: "LinkedIn", d: "Not connected", c: false },
    { n: "Slack", d: "Not connected", c: false },
  ];
  return (
    <Card
      title="Connected accounts"
      description="Link accounts to import work history and enable single sign-on."
    >
      <div className="space-y-2">
        {accounts.map((a) => (
          <div
            key={a.n}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card font-mono text-[12px] font-semibold">
                {a.n[0]}
              </div>
              <div>
                <div className="text-[13px] font-medium">{a.n}</div>
                <div className="text-[11.5px] text-muted-foreground">{a.d}</div>
              </div>
            </div>
            {a.c ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full text-[11px]">
                  <Check className="mr-1 h-3 w-3" /> Connected
                </Badge>
                <Button size="sm" variant="ghost" className="text-[12px]">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline">
                Connect
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function AppearancePanel() {
  return (
    <Card
      title="Appearance"
      description="CVPilot is a considered light experience. Dark mode arriving soon."
    >
      <Row label="Theme">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            Warm cream · Light
          </Badge>
          <Badge variant="outline" className="rounded-full text-[11px]">
            Dark · Coming soon
          </Badge>
        </div>
      </Row>
      <div className="border-t border-border" />
      <Row label="Accent" description="Muted lavender is the CVPilot default.">
        <div className="flex gap-1.5">
          {["bg-primary", "bg-success", "bg-warning", "bg-destructive"].map((c) => (
            <span key={c} className={cn("h-6 w-6 rounded-full border border-border", c)} />
          ))}
        </div>
      </Row>
    </Card>
  );
}

function DangerPanel() {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-card shadow-subtle">
      <div className="border-b border-destructive/20 p-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-destructive">Danger zone</h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Irreversible account actions. Proceed with care.
        </p>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
          <div>
            <div className="text-[13px] font-medium">Delete account</div>
            <div className="text-[12px] text-muted-foreground">
              Permanently remove your profile, resumes and vault.
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  This will permanently remove your profile, every resume in your vault and every
                  template you saved. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2">
                <Label className="text-[12px]">
                  Type <span className="font-mono">DELETE</span> to confirm
                </Label>
                <Input className="mt-1.5 h-10" placeholder="DELETE" />
              </div>
              <DialogFooter>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  Delete account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
