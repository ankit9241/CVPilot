/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Camera,
  FileCheck,
  FolderGit2,
  GripVertical,
  GraduationCap,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Trophy,
  User,
  Briefcase,
  Wrench,
  Upload,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Globe,
  Languages,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SECTION_KEYS = [
  "personal",
  "social",
  "education",
  "experience",
  "projects",
  "skills",
  "certificates",
  "achievements",
] as const;

type SectionKey = (typeof SECTION_KEYS)[number];

type CompletionResponse = {
  completionPct: number;
  missing: string[];
  sections: Record<string, number>;
};

type FieldType = "text" | "textarea" | "url" | "date" | "select" | "number" | "checkbox";

type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  help?: string;
};

type CrudSectionConfig = {
  key: SectionKey;
  title: string;
  description: string;
  endpoint: string;
  emptyState: string;
  fields: FieldSpec[];
  itemTitle: (item: any) => string;
  itemMeta?: (item: any) => string[];
  buildDraft: (item?: any) => Record<string, any>;
  buildPayload: (draft: Record<string, any>) => Record<string, any>;
};

const NAV: Array<{ key: SectionKey; label: string; icon: any }> = [
  { key: "personal", label: "Personal", icon: User },
  { key: "social", label: "Social links", icon: LinkIcon },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "projects", label: "Projects", icon: FolderGit2 },
  { key: "skills", label: "Skills", icon: Wrench },
  { key: "certificates", label: "Certificates", icon: FileCheck },
  { key: "achievements", label: "Achievements", icon: Trophy },
];

const SOCIAL_PLATFORM_OPTIONS = [
  "LINKEDIN",
  "GITHUB",
  "PORTFOLIO",
  "WEBSITE",
  "TWITTER",
  "LEETCODE",
  "CODEFORCES",
  "CODECHEF",
  "HACKERRANK",
  "MEDIUM",
  "DEV",
  "OTHER",
];

const SKILL_CATEGORY_OPTIONS = [
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "CLOUD",
  "DEVOPS",
  "LANGUAGE",
  "FRAMEWORK",
  "LIBRARY",
  "AI_ML",
  "TOOL",
  "SOFT",
  "OTHER",
];

const SKILL_LEVEL_OPTIONS = [
  { label: "Beginner", value: "1" },
  { label: "Novice", value: "2" },
  { label: "Intermediate", value: "3" },
  { label: "Advanced", value: "4" },
  { label: "Expert", value: "5" },
];

const EDUCATION_CONFIG: CrudSectionConfig = {
  key: "education",
  title: "Education",
  description: "Institutions, degrees, and academic details.",
  endpoint: "/profile/education",
  emptyState: "No education records yet.",
  fields: [
    { key: "school", label: "Institution", type: "text", placeholder: "Stanford University" },
    { key: "degree", label: "Degree", type: "text", placeholder: "B.Sc. Computer Science" },
    { key: "field", label: "Field of study", type: "text", placeholder: "Software Engineering" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "gpa", label: "GPA", type: "text", placeholder: "3.9 / 4.0" },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Honors, coursework, thesis, or focus area.",
    },
  ],
  itemTitle: (item) => item.school || item.institution || "Untitled education",
  itemMeta: (item) => [item.degree, item.field].filter(Boolean),
  buildDraft: (item) => ({
    school: item?.school || "",
    degree: item?.degree || "",
    field: item?.field || "",
    startDate: toDateInput(item?.startDate),
    endDate: toDateInput(item?.endDate),
    gpa: item?.gpa || "",
    description: item?.description || "",
  }),
  buildPayload: (draft) => ({
    school: draft.school?.trim(),
    degree: draft.degree?.trim(),
    field: draft.field?.trim() || undefined,
    startDate: toIsoDate(draft.startDate),
    endDate: toIsoDate(draft.endDate),
    gpa: draft.gpa?.trim() || undefined,
    description: draft.description?.trim() || undefined,
  }),
};

const EXPERIENCE_CONFIG: CrudSectionConfig = {
  key: "experience",
  title: "Experience",
  description: "Roles, responsibilities, and technologies used.",
  endpoint: "/profile/experience",
  emptyState: "No experience records yet.",
  fields: [
    { key: "companyName", label: "Company", type: "text", placeholder: "Linear" },
    { key: "role", label: "Position", type: "text", placeholder: "Senior Product Engineer" },
    { key: "employmentType", label: "Employment type", type: "text", placeholder: "Full-time" },
    { key: "location", label: "Location", type: "text", placeholder: "Remote" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date", help: "Leave blank if current." },
    {
      key: "isCurrent",
      label: "Current company",
      type: "checkbox",
      help: "Mark if you still work here.",
    },
    {
      key: "technologiesUsed",
      label: "Technologies used",
      type: "textarea",
      placeholder: "React, TypeScript, GraphQL",
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      placeholder: "What you owned and improved.",
    },
    {
      key: "achievements",
      label: "Achievements",
      type: "textarea",
      placeholder: "Improved performance..., Shipped...",
    },
  ],
  itemTitle: (item) => item.companyName || item.company || "Untitled experience",
  itemMeta: (item) => [item.role, item.employmentType, item.location].filter(Boolean),
  buildDraft: (item) => ({
    companyName: item?.companyName || item?.company || "",
    role: item?.role || item?.position || "",
    employmentType: item?.employmentType || "",
    location: item?.location || "",
    startDate: toDateInput(item?.startDate),
    endDate: toDateInput(item?.endDate),
    isCurrent: Boolean(item?.isCurrent ?? item?.currentCompany),
    technologiesUsed: joinList(item?.technologiesUsed),
    description: item?.description || "",
    achievements: joinList(item?.achievements),
  }),
  buildPayload: (draft) => ({
    companyName: draft.companyName?.trim(),
    role: draft.role?.trim(),
    employmentType: draft.employmentType?.trim() || undefined,
    location: draft.location?.trim() || undefined,
    startDate: toIsoDate(draft.startDate),
    endDate: toIsoDate(draft.endDate),
    isCurrent: Boolean(draft.isCurrent),
    technologiesUsed: splitList(draft.technologiesUsed),
    description: draft.description?.trim() || undefined,
    achievements: splitList(draft.achievements),
  }),
};

const PROJECT_CONFIG: CrudSectionConfig = {
  key: "projects",
  title: "Projects",
  description: "Showcase the work that best represents you.",
  endpoint: "/profile/projects",
  emptyState: "No projects yet.",
  fields: [
    { key: "name", label: "Title", type: "text", placeholder: "AI Resume Dashboard" },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      placeholder: "What the project does and why it matters.",
    },
    { key: "role", label: "Your role", type: "text", placeholder: "Lead frontend engineer" },
    {
      key: "stack",
      label: "Technologies",
      type: "textarea",
      placeholder: "React, TanStack Router, Prisma",
    },
    {
      key: "githubUrl",
      label: "GitHub URL",
      type: "url",
      placeholder: "https://github.com/you/project",
    },
    { key: "liveUrl", label: "Live URL", type: "url", placeholder: "https://project.example.com" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "featured", label: "Featured", type: "checkbox" },
    {
      key: "imageUrls",
      label: "Images",
      type: "textarea",
      placeholder: "https://.../shot-1.png, https://.../shot-2.png",
    },
    {
      key: "impact",
      label: "Impact",
      type: "textarea",
      placeholder: "Quantify results if possible.",
    },
  ],
  itemTitle: (item) => item.name || item.title || "Untitled project",
  itemMeta: (item) => [item.role, item.featured ? "Featured" : null].filter(Boolean),
  buildDraft: (item) => ({
    name: item?.name || item?.title || "",
    description: item?.description || "",
    role: item?.role || "",
    stack: joinList(item?.stack || item?.technologies),
    githubUrl: item?.githubUrl || "",
    liveUrl: item?.liveUrl || "",
    startDate: toDateInput(item?.startDate),
    endDate: toDateInput(item?.endDate),
    featured: Boolean(item?.featured),
    imageUrls: joinList(item?.imageUrls || item?.images),
    impact: item?.impact || "",
  }),
  buildPayload: (draft) => ({
    name: draft.name?.trim(),
    description: draft.description?.trim() || undefined,
    role: draft.role?.trim() || undefined,
    stack: splitList(draft.stack),
    githubUrl: draft.githubUrl?.trim() || undefined,
    liveUrl: draft.liveUrl?.trim() || undefined,
    startDate: toIsoDate(draft.startDate),
    endDate: toIsoDate(draft.endDate),
    featured: Boolean(draft.featured),
    imageUrls: splitList(draft.imageUrls),
    impact: draft.impact?.trim() || undefined,
  }),
};

const CERTIFICATE_CONFIG: CrudSectionConfig = {
  key: "certificates",
  title: "Certificates",
  description: "Professional certifications and credentials.",
  endpoint: "/profile/certificates",
  emptyState: "No certificates yet.",
  fields: [
    { key: "name", label: "Certificate", type: "text", placeholder: "AWS Certified Developer" },
    { key: "issuer", label: "Issuer", type: "text", placeholder: "Amazon Web Services" },
    { key: "issuedAt", label: "Issue date", type: "date" },
    { key: "expiresAt", label: "Expiry date", type: "date" },
    { key: "credentialId", label: "Credential ID", type: "text", placeholder: "ABC-123" },
    { key: "credentialUrl", label: "Credential URL", type: "url", placeholder: "https://..." },
  ],
  itemTitle: (item) => item.name || "Untitled certificate",
  itemMeta: (item) => [item.issuer].filter(Boolean),
  buildDraft: (item) => ({
    name: item?.name || "",
    issuer: item?.issuer || "",
    issuedAt: toDateInput(item?.issuedAt),
    expiresAt: toDateInput(item?.expiresAt),
    credentialId: item?.credentialId || "",
    credentialUrl: item?.credentialUrl || "",
  }),
  buildPayload: (draft) => ({
    name: draft.name?.trim(),
    issuer: draft.issuer?.trim(),
    issuedAt: toIsoDate(draft.issuedAt),
    expiresAt: toIsoDate(draft.expiresAt),
    credentialId: draft.credentialId?.trim() || undefined,
    credentialUrl: draft.credentialUrl?.trim() || undefined,
  }),
};

const ACHIEVEMENT_CONFIG: CrudSectionConfig = {
  key: "achievements",
  title: "Achievements",
  description: "Awards, wins, and milestones worth highlighting.",
  endpoint: "/profile/achievements",
  emptyState: "No achievements yet.",
  fields: [
    { key: "title", label: "Title", type: "text", placeholder: "Winner of regional hackathon" },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      placeholder: "What happened and what it says about you.",
    },
    { key: "date", label: "Date", type: "date" },
    { key: "url", label: "URL", type: "url", placeholder: "https://..." },
  ],
  itemTitle: (item) => item.title || "Untitled achievement",
  itemMeta: (item) => [item.date ? formatShortDate(item.date) : null].filter(Boolean),
  buildDraft: (item) => ({
    title: item?.title || "",
    description: item?.description || item?.context || "",
    date: toDateInput(item?.date),
    url: item?.url || "",
  }),
  buildPayload: (draft) => ({
    title: draft.title?.trim(),
    description: draft.description?.trim() || undefined,
    context: draft.description?.trim() || undefined,
    date: toIsoDate(draft.date),
    url: draft.url?.trim() || undefined,
  }),
};

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [active, setActive] = useState<SectionKey>("personal");
  const queryClient = useQueryClient();
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalLoaded, setPersonalLoaded] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const snapshotRef = useRef("");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["profile-personal"],
    queryFn: () => api.get<any>("/profile"),
  });

  const { data: completion } = useQuery<CompletionResponse>({
    queryKey: ["profile-completion"],
    queryFn: () => api.get<CompletionResponse>("/profile/completion"),
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setHeadline(profile.headline || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
      setSummary(profile.summary || "");
      snapshotRef.current = JSON.stringify({
        fullName: profile.fullName || "",
        headline: profile.headline || "",
        phone: profile.phone || "",
        location: profile.location || "",
        summary: profile.summary || "",
      });
      setPersonalLoaded(true);
    }
  }, [profile]);

  const isDirty = useMemo(() => {
    if (!personalLoaded) return false;
    const current = JSON.stringify({ fullName, headline, phone, location, summary });
    return current !== snapshotRef.current;
  }, [fullName, headline, phone, location, summary, personalLoaded]);

  const bumpRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
  };

  const savePersonalMutation = useMutation({
    mutationFn: (payload: any) => api.put<any>("/profile", payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile-personal"], updated);
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
      snapshotRef.current = JSON.stringify({
        fullName: updated.fullName || "",
        headline: updated.headline || "",
        phone: updated.phone || "",
        location: updated.location || "",
        summary: updated.summary || "",
      });
      if (user) {
        setUser({
          ...user,
          profile: {
            ...(user.profile || ({} as any)),
            ...updated,
            completionPct: completion?.completionPct ?? user.profile?.completionPct ?? 0,
          },
        });
      }
      toast.success("Profile saved");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save profile");
    },
  });

  const savePersonal = async (
    override?: Partial<{
      fullName: string;
      headline: string;
      phone: string;
      location: string;
      summary: string;
      avatarUrl: string;
    }>,
  ) => {
    const payload = {
      fullName,
      headline,
      phone,
      location,
      summary,
      ...override,
    };
    setPersonalSaving(true);
    try {
      await savePersonalMutation.mutateAsync(payload);
    } catch {
      // handled in mutation onError
    } finally {
      setPersonalSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const key = `profile-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "-")}`;
    try {
      const presign = await api.post<{ key: string; url: string; method: "PUT" }>(
        "/uploads/presign",
        {
          key,
          contentType: file.type || "application/octet-stream",
        },
      );
      const uploadResult = await fetch(presign.url, {
        method: presign.method,
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });
      if (!uploadResult.ok) {
        throw new Error("Upload failed");
      }
      const download = await api.get<{ key: string; url: string }>(
        `/uploads/download/${encodeURIComponent(key)}`,
      );
      await savePersonal({ avatarUrl: download.url });
      toast.success("Profile image updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload profile image");
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const sectionCards = [
    {
      key: "personal",
      component: (
        <PersonalSection
          email={user?.email || profile?.email || ""}
          profile={profile}
          fullName={fullName}
          setFullName={setFullName}
          headline={headline}
          setHeadline={setHeadline}
          phone={phone}
          setPhone={setPhone}
          location={location}
          setLocation={setLocation}
          summary={summary}
          setSummary={setSummary}
          onUploadAvatar={handleAvatarUpload}
          onSaveNow={() => void savePersonal()}
          saving={personalSaving}
          isDirty={isDirty}
        />
      ),
    },
    {
      key: "social",
      component: <CrudSection config={socialConfig} onMutate={bumpRefresh} />,
    },
    {
      key: "education",
      component: <CrudSection config={EDUCATION_CONFIG} onMutate={bumpRefresh} />,
    },
    {
      key: "experience",
      component: <CrudSection config={EXPERIENCE_CONFIG} onMutate={bumpRefresh} />,
    },
    {
      key: "projects",
      component: <CrudSection config={PROJECT_CONFIG} onMutate={bumpRefresh} />,
    },
    { key: "skills", component: <SkillsSection onMutate={bumpRefresh} /> },
    {
      key: "certificates",
      component: <CrudSection config={CERTIFICATE_CONFIG} onMutate={bumpRefresh} />,
    },
    {
      key: "achievements",
      component: <CrudSection config={ACHIEVEMENT_CONFIG} onMutate={bumpRefresh} />,
    },
  ] as const;

  return (
    <div className="container-page py-8 lg:py-10">
      <PageHeader
        title="Profile"
        subtitle="Your master profile powers every resume and tailored export."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              Import Profile
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => void savePersonal()}
              disabled={personalSaving || !isDirty}
            >
              {personalSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {personalSaving ? "Saving..." : isDirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        }
      />

      <ProfileCompletion completion={completion} onJump={setActive} />

      <div className="mt-8 grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3">
          <nav className="sticky top-20 flex gap-1 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-2 lg:shadow-subtle">
            {NAV.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors lg:w-full",
                  active === item.key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {sectionCards.find((section) => section.key === active)?.component}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ProfileImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onMerged={() => {
          queryClient.invalidateQueries();
          bumpRefresh();
        }}
      />
    </div>
  );
}

function ProfileCompletion({
  completion,
  onJump,
}: {
  completion: CompletionResponse | null;
  onJump: (key: SectionKey) => void;
}) {
  const pct = completion?.completionPct ?? 0;
  const missing = completion?.missing ?? [];
  const sections = completion?.sections ?? {};

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-6"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr] lg:items-center">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth="3"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 100.5" }}
                animate={{ strokeDasharray: `${pct} 100.5` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-[15px] font-semibold">
              {pct}%
            </div>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold">Profile completion</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Computed live from the profile, education, experience, project, skills, and credential
              data.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SECTION_KEYS.map((section) => (
            <Badge
              key={section}
              variant={sections[section] >= 100 ? "default" : "secondary"}
              className="cursor-pointer capitalize"
              onClick={() => onJump(section)}
            >
              {section} {sections[section] ? `${sections[section]}%` : "0%"}
            </Badge>
          ))}
          {missing.length > 0 ? (
            <div className="w-full pt-2 text-[12.5px] text-muted-foreground">
              Still missing: {missing.map((item) => item.replace(/_/g, " ")).join(", ")}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[13px] font-medium text-success">
              <Check className="h-4 w-4" /> All key profile sections are complete.
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function PersonalSection({
  email,
  profile,
  fullName,
  setFullName,
  headline,
  setHeadline,
  phone,
  setPhone,
  location,
  setLocation,
  summary,
  setSummary,
  onUploadAvatar,
  onSaveNow,
  saving,
  isDirty,
}: {
  email: string;
  profile: any;
  fullName: string;
  setFullName: (value: string) => void;
  headline: string;
  setHeadline: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  summary: string;
  setSummary: (value: string) => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onSaveNow: () => void;
  saving: boolean;
  isDirty: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <SectionCard
      title="Personal information"
      description="Your name, contact details, and public profile photo."
    >
      <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
        <Avatar className="h-16 w-16 border border-border">
          {profile?.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={fullName || "Profile"} />
          )}
          <AvatarFallback className="bg-primary/10 text-[16px] font-semibold text-primary">
            {getInitials(fullName || email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium">Profile photo</div>
          <div className="text-[12px] text-muted-foreground">
            Upload a new image or keep the current Google avatar.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUploadAvatar(file);
              event.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-3.5 w-3.5" /> Upload image
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Email">
          <Input value={email} readOnly className="h-10 bg-muted/30" />
        </Field>
        <Field label="Phone">
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Location">
          <Input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Current role">
          <Input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="h-10"
            placeholder="Senior Product Engineer"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Professional summary">
            <Textarea
              rows={5}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Write a concise summary of your work and strengths."
            />
          </Field>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-[12.5px] text-muted-foreground">
        <span>
          {isDirty ? (
            <span className="text-amber-500 font-medium">You have unsaved changes.</span>
          ) : (
            <span className="text-muted-foreground">All personal details are saved.</span>
          )}
        </span>
        <Button
          size="sm"
          variant={isDirty ? "default" : "outline"}
          onClick={onSaveNow}
          disabled={saving || !isDirty}
          className="gap-1.5"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving..." : isDirty ? "Save now" : "Saved"}
        </Button>
      </div>
    </SectionCard>
  );
}

const socialConfig: CrudSectionConfig = {
  key: "social",
  title: "Social links",
  description: "LinkedIn, GitHub, portfolios, and custom links.",
  endpoint: "/profile/social-links",
  emptyState: "No social links added yet.",
  fields: [
    { key: "platform", label: "Platform", type: "select", options: SOCIAL_PLATFORM_OPTIONS },
    { key: "label", label: "Label", type: "text", placeholder: "Portfolio" },
    { key: "url", label: "URL", type: "url", placeholder: "https://your-site.com" },
  ],
  itemTitle: (item) => item.label || item.platform || "Link",
  itemMeta: (item) => [item.url],
  buildDraft: (item) => ({
    platform: item?.platform || "LINKEDIN",
    label: item?.label || "",
    url: item?.url || "",
  }),
  buildPayload: (draft) => ({
    platform: draft.platform,
    label: draft.label?.trim() || undefined,
    url: normalizeUrl(draft.url) || draft.url?.trim(),
  }),
};

function CrudSection({ config, onMutate }: { config: CrudSectionConfig; onMutate: () => void }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, any>>(config.buildDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: [config.key],
    queryFn: () => api.get<any[]>(config.endpoint),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string | null; payload: any }) => {
      if (id) {
        return api.patch<any>(`${config.endpoint}/${id}`, payload);
      } else {
        return api.post<any>(config.endpoint, payload);
      }
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: [config.key] });
      const previousItems = queryClient.getQueryData<any[]>([config.key]);

      const isEditing = Boolean(id);
      if (isEditing) {
        queryClient.setQueryData<any[]>([config.key], (old) =>
          old ? old.map((item) => (item.id === id ? { ...item, ...payload } : item)) : [],
        );
      } else {
        const tempId = `temp-${Date.now()}`;
        queryClient.setQueryData<any[]>([config.key], (old) =>
          old ? [...old, { id: tempId, ...payload }] : [{ id: tempId, ...payload }],
        );
      }

      return { previousItems };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData([config.key], context.previousItems);
      }
      toast.error(err?.message || `Failed to save ${config.title.toLowerCase()}`);
    },
    onSuccess: (data, variables) => {
      toast.success(`${config.title} ${variables.id ? "updated" : "added"}`);
      setEditingId(null);
      setDraft(config.buildDraft());
      onMutate();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [config.key] });
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${config.endpoint}/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [config.key] });
      const previousItems = queryClient.getQueryData<any[]>([config.key]);

      queryClient.setQueryData<any[]>([config.key], (old) =>
        old ? old.filter((item) => item.id !== id) : [],
      );

      return { previousItems };
    },
    onError: (err: any, id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData([config.key], context.previousItems);
      }
      toast.error(err?.message || `Failed to remove ${config.title.toLowerCase()}`);
    },
    onSuccess: (data, id) => {
      toast.success(`${config.title} removed`);
      if (editingId === id) {
        setEditingId(null);
        setDraft(config.buildDraft());
      }
      onMutate();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [config.key] });
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
    },
  });

  const startCreate = () => {
    setEditingId(null);
    setDraft(config.buildDraft());
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setDraft(config.buildDraft(item));
  };

  const saveItem = async () => {
    const payload = config.buildPayload(draft);
    if (!payload) return;
    setSaving(true);
    try {
      await saveMutation.mutateAsync({ id: editingId, payload });
    } catch {
      // Handled in mutation onError
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Handled in mutation onError
    }
  };

  if (isLoading) {
    return (
      <SectionCard title={config.title} description={config.description}>
        <div className="grid place-items-center py-14 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={config.title} description={config.description}>
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-[12.5px] text-muted-foreground">
            {config.emptyState}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-background p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[14px] font-semibold">{config.itemTitle(item)}</div>
                      {item.featured ? <Badge variant="secondary">Featured</Badge> : null}
                    </div>
                    {config.itemMeta?.(item)?.length ? (
                      <div className="mt-1 flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                        {config.itemMeta(item).map((meta: string) => (
                          <span key={meta}>{meta}</span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-2 space-y-1 text-[12.5px] text-muted-foreground">
                      {renderItemSummary(item, config.key)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => startEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => void deleteItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                {editingId ? "Edit entry" : "Add entry"}
              </h4>
              <p className="text-[12px] text-muted-foreground">
                {editingId
                  ? "Update the selected record."
                  : `Create a new ${config.title.toLowerCase().replace(/s$/, "")} record.`}
              </p>
            </div>
            {editingId ? (
              <Button variant="ghost" size="sm" onClick={startCreate}>
                Cancel edit
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {config.fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                help={field.help}
                className={field.type === "textarea" ? "sm:col-span-2" : undefined}
              >
                <FieldInput
                  field={field}
                  value={draft[field.key]}
                  onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                />
              </Field>
            ))}
          </div>

          <Button
            size="sm"
            className="mt-4 gap-1.5"
            onClick={() => void saveItem()}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {editingId ? "Save changes" : `Add ${config.title.replace(/s$/, "")}`}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function SkillsSection({ onMutate }: { onMutate: () => void }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ name: "", category: "FRONTEND", level: "3" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ["skills"],
    queryFn: async () => {
      const data = await api.get<any[]>("/profile/skills");
      return (data || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string | null; payload: any }) => {
      if (id) {
        return api.patch<any>(`/profile/skills/${id}`, payload);
      } else {
        return api.post<any>("/profile/skills", payload);
      }
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["skills"] });
      const previousItems = queryClient.getQueryData<any[]>(["skills"]) || [];

      if (id) {
        queryClient.setQueryData<any[]>(["skills"], (old) =>
          old ? old.map((item) => (item.id === id ? { ...item, ...payload } : item)) : [],
        );
      } else {
        const tempId = `temp-${Date.now()}`;
        const nextOrder = Math.max(0, ...previousItems.map((item) => item.sortOrder ?? 0)) + 1;
        queryClient.setQueryData<any[]>(["skills"], (old) =>
          old
            ? [...old, { id: tempId, ...payload, sortOrder: nextOrder }]
            : [{ id: tempId, ...payload, sortOrder: nextOrder }],
        );
      }

      return { previousItems };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["skills"], context.previousItems);
      }
      toast.error(err?.message || "Failed to save skill");
    },
    onSuccess: (data, variables) => {
      toast.success(`Skill ${variables.id ? "updated" : "added"}`);
      resetForm();
      onMutate();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/profile/skills/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["skills"] });
      const previousItems = queryClient.getQueryData<any[]>(["skills"]);

      queryClient.setQueryData<any[]>(["skills"], (old) =>
        old ? old.filter((item) => item.id !== id) : [],
      );

      return { previousItems };
    },
    onError: (err: any, id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["skills"], context.previousItems);
      }
      toast.error(err?.message || "Failed to remove skill");
    },
    onSuccess: (data, id) => {
      toast.success("Skill removed");
      if (editingId === id) resetForm();
      onMutate();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => api.patch("/profile/skills/reorder", { orderedIds }),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["skills"] });
      const previousItems = queryClient.getQueryData<any[]>(["skills"]) || [];

      const mapped = previousItems
        .slice()
        .sort((a, b) => {
          const aIndex = orderedIds.indexOf(a.id);
          const bIndex = orderedIds.indexOf(b.id);
          return aIndex - bIndex;
        })
        .map((item, index) => ({ ...item, sortOrder: index }));

      queryClient.setQueryData<any[]>(["skills"], mapped);

      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["skills"], context.previousItems);
      }
      toast.error("Failed to reorder skills");
    },
    onSuccess: () => {
      onMutate();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
    },
  });

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setDraft({
      name: item.name || "",
      category: item.category || "FRONTEND",
      level: String(item.level || 3),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft({ name: "", category: "FRONTEND", level: "3" });
  };

  const saveSkill = async () => {
    if (!draft.name.trim()) return;
    const payload = {
      name: draft.name.trim(),
      category: draft.category,
      level: Number(draft.level),
    };
    setSaving(true);
    try {
      if (editingId) {
        await saveMutation.mutateAsync({ id: editingId, payload });
      } else {
        const nextOrder = Math.max(0, ...items.map((item) => item.sortOrder ?? 0)) + 1;
        await saveMutation.mutateAsync({ payload: { ...payload, sortOrder: nextOrder } });
      }
    } catch {
      // Handled in mutation onError
    } finally {
      setSaving(false);
    }
  };

  const removeSkill = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Handled in mutation onError
    }
  };

  const reorder = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIndex = items.findIndex((item) => item.id === sourceId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = items.slice();
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    const orderedIds = next.map((item) => item.id);
    try {
      await reorderMutation.mutateAsync(orderedIds);
    } catch {
      // Handled in mutation onError
    }
  };

  const grouped = useMemo(() => {
    const categories = SKILL_CATEGORY_OPTIONS;
    return categories.map((category) => ({
      category,
      items: items.filter((item) => (item.category || "OTHER") === category),
    }));
  }, [items]);

  if (isLoading) {
    return (
      <SectionCard title="Skills" description="Categorized skills with drag-and-drop ordering.">
        <div className="grid place-items-center py-14 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Skills" description="Categorized skills with drag-and-drop ordering.">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Skill name">
            <Input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Field>
          <Field label="Category">
            <Select
              value={draft.category}
              onValueChange={(value) => setDraft((current) => ({ ...current, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace("_", "/")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Level">
            <Select
              value={draft.level}
              onValueChange={(value) => setDraft((current) => ({ ...current, level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => void saveSkill()} disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {editingId ? "Save changes" : "Add skill"}
          </Button>
          {editingId ? (
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {grouped.map((group) => (
            <div
              key={group.category}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.category.replace("_", "/")}
                </div>
                <Badge variant="secondary">{group.items.length}</Badge>
              </div>
              <div className="space-y-2">
                {group.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
                    No skills in this category.
                  </div>
                ) : (
                  group.items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDragId(item.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dragId && reorder(dragId, item.id)}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3",
                        dragId === item.id && "ring-2 ring-primary/40",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-[13px] font-semibold">{item.name}</div>
                          <div className="text-[12px] text-muted-foreground">
                            Level {item.level || 1}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => void removeSkill(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  help,
  className,
}: {
  label: string;
  children: React.ReactNode;
  help?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[12px]">{label}</Label>
      {children}
      {help ? <div className="text-[11.5px] text-muted-foreground">{help}</div> : null}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: any;
  onChange: (value: any) => void;
}) {
  if (field.type === "textarea") {
    return (
      <Textarea
        rows={4}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
    );
  }
  if (field.type === "select") {
    return (
      <Select value={String(value || field.options?.[0] || "")} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder || field.label} />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((option) => (
            <SelectItem key={option} value={option}>
              {option.replace(/_/g, "/")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.type === "checkbox") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
        <span className="text-[13px] text-foreground">{field.placeholder || "Enabled"}</span>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <Input
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        min={1}
        max={5}
      />
    );
  }
  const inputType = field.type === "date" ? "date" : field.type === "url" ? "url" : "text";
  return (
    <Input
      type={inputType}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
    />
  );
}

function renderItemSummary(item: any, section: SectionKey) {
  if (section === "social") {
    return (
      <>
        <div className="truncate">{item.url}</div>
        <div className="text-[11.5px] text-muted-foreground">{item.platform || "Custom"}</div>
      </>
    );
  }
  if (section === "education") {
    return (
      <>
        <div>{item.field || item.gpa || item.description || ""}</div>
        <div>{formatRange(item.startDate, item.endDate)}</div>
      </>
    );
  }
  if (section === "experience") {
    return (
      <>
        <div>{item.employmentType || "Employment type not set"}</div>
        <div>{joinDisplay(item.technologiesUsed)}</div>
      </>
    );
  }
  if (section === "projects") {
    return (
      <>
        <div>{joinDisplay(item.stack || item.technologies)}</div>
        <div>{item.githubUrl || item.liveUrl || "No URLs yet"}</div>
      </>
    );
  }
  if (section === "certificates") {
    return (
      <>
        <div>{item.credentialId || item.credentialUrl || "No credential info yet"}</div>
        <div>{formatRange(item.issuedAt, item.expiresAt)}</div>
      </>
    );
  }
  if (section === "achievements") {
    return (
      <>
        <div>{item.description || item.context || "No description yet"}</div>
        <div>{item.url || "No URL"}</div>
      </>
    );
  }
  return null;
}

function splitList(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: any): string {
  if (Array.isArray(value)) return value.join(", ");
  return typeof value === "string" ? value : "";
}

function joinDisplay(value: any): string {
  const text = joinList(value);
  return text || "Not set yet";
}

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toDateInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatShortDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatRange(start?: string | Date | null, end?: string | Date | null): string {
  const startLabel = formatShortDate(start);
  const endLabel = formatShortDate(end) || "Present";
  if (!startLabel && !endLabel) return "";
  return `${startLabel || "—"} → ${endLabel}`;
}

function normalizeUrl(value: string): string | null {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function getInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() || "")
      .join("") || "U"
  );
}

interface ProfileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerged: () => void;
}

export function ProfileImportModal({ isOpen, onClose, onMerged }: ProfileImportModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"select" | "uploading" | "review">("select");
  const [importerType, setImporterType] = useState<"resume" | "linkedin" | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [merging, setMerging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Retrieve existing items for duplicate warning check
  const existingExp = queryClient.getQueryData<any[]>(["experience"]) || [];
  const existingProj = queryClient.getQueryData<any[]>(["projects"]) || [];
  const existingSkills = queryClient.getQueryData<any[]>(["skills"]) || [];
  const existingEd = queryClient.getQueryData<any[]>(["education"]) || [];
  const existingCert = queryClient.getQueryData<any[]>(["certificates"]) || [];
  const existingAch = queryClient.getQueryData<any[]>(["achievements"]) || [];
  const existingSocial = queryClient.getQueryData<any[]>(["social"]) || [];

  if (!isOpen) return null;

  const triggerFileSelect = (type: "resume" | "linkedin") => {
    setImporterType(type);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep("uploading");
    setLoadingMessage("AI is analyzing and structuring your profile data...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("importerType", importerType || "resume");

    try {
      const res = await api.post<any>("/profile/import", formData);

      // Inject tempIds to make them easy to track
      const mapped = {
        personalInfo: res.personalInfo || {},
        experiences: (res.experiences || []).map((x: any) => ({
          ...x,
          _id: Math.random().toString(),
        })),
        projects: (res.projects || []).map((x: any) => ({ ...x, _id: Math.random().toString() })),
        skills: (res.skills || []).map((x: any) => ({ ...x, _id: Math.random().toString() })),
        educations: (res.educations || []).map((x: any) => ({
          ...x,
          _id: Math.random().toString(),
        })),
        certificates: (res.certificates || []).map((x: any) => ({
          ...x,
          _id: Math.random().toString(),
        })),
        achievements: (res.achievements || []).map((x: any) => ({
          ...x,
          _id: Math.random().toString(),
        })),
        socialLinks: (res.socialLinks || []).map((x: any) => ({
          ...x,
          _id: Math.random().toString(),
        })),
      };

      setData(mapped);
      setStep("review");
      setActiveTab("personal");
    } catch (err: any) {
      toast.error(err.message || "Failed to parse profile file.");
      setStep("select");
    }
  };

  const startEdit = (id: string, current: any) => {
    setEditingId(id);
    setEditForm({ ...current });
  };

  const saveEdit = (section: string, id: string) => {
    if (section === "personal") {
      setData((prev: any) => ({ ...prev, personalInfo: editForm }));
    } else {
      setData((prev: any) => ({
        ...prev,
        [section]: prev[section].map((x: any) => (x._id === id ? { ...editForm } : x)),
      }));
    }
    setEditingId(null);
    setEditForm(null);
  };

  const deleteItem = (section: string, id: string) => {
    setData((prev: any) => ({
      ...prev,
      [section]: prev[section].filter((x: any) => x._id !== id),
    }));
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      // Strip out tempIds
      const payload = {
        personalInfo: data.personalInfo,
        experiences: (data.experiences || []).map(({ _id, ...rest }: any) => rest),
        projects: (data.projects || []).map(({ _id, ...rest }: any) => rest),
        skills: (data.skills || []).map(({ _id, ...rest }: any) => rest),
        educations: (data.educations || []).map(({ _id, ...rest }: any) => rest),
        certificates: (data.certificates || []).map(({ _id, ...rest }: any) => rest),
        achievements: (data.achievements || []).map(({ _id, ...rest }: any) => rest),
        socialLinks: (data.socialLinks || []).map(({ _id, ...rest }: any) => rest),
      };

      await api.post("/profile/import/merge", payload);
      toast.success("Profile successfully imported and merged!");
      onMerged();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to merge profile.");
    } finally {
      setMerging(false);
    }
  };

  const renderPersonalReview = () => {
    const isEditing = editingId === "personal";
    const info = data.personalInfo;

    if (isEditing) {
      return (
        <div className="space-y-4 max-w-xl">
          <h3 className="font-semibold text-sm">Edit Personal Details</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input
                value={editForm.fullName || ""}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Headline</Label>
              <Input
                value={editForm.headline || ""}
                onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input
                value={editForm.location || ""}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Summary</Label>
              <Textarea
                rows={3}
                value={editForm.summary || ""}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => saveEdit("personal", "personal")}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border p-5 space-y-3 bg-card shadow-subtle max-w-xl">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-lg">{info.fullName || "No Name"}</h4>
            <p className="text-sm text-primary font-medium">{info.headline || "No Headline"}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => startEdit("personal", info)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
          <div>
            <strong>Phone:</strong> {info.phone || "—"}
          </div>
          <div>
            <strong>Location:</strong> {info.location || "—"}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          <strong>Summary:</strong> {info.summary || "—"}
        </div>
      </div>
    );
  };

  const renderExperiencesReview = () => {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">Experiences</h3>
        </div>
        {data.experiences.length === 0 ? (
          <p className="text-xs text-muted-foreground">No experiences extracted.</p>
        ) : (
          data.experiences.map((exp: any) => {
            const isEditing = editingId === exp._id;
            const isDuplicate = existingExp.some(
              (e: any) =>
                e.companyName.trim().toLowerCase() === exp.companyName.trim().toLowerCase() &&
                e.role.trim().toLowerCase() === exp.role.trim().toLowerCase(),
            );

            if (isEditing) {
              return (
                <div
                  key={exp._id}
                  className="rounded-xl border border-border p-5 space-y-3 bg-muted/10"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Company</Label>
                      <Input
                        value={editForm.companyName || ""}
                        onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Role</Label>
                      <Input
                        value={editForm.role || ""}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Location</Label>
                      <Input
                        value={editForm.location || ""}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        value={editForm.startDate || ""}
                        placeholder="YYYY-MM"
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input
                        value={editForm.endDate || ""}
                        placeholder="YYYY-MM"
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id={`current-${exp._id}`}
                      checked={!!editForm.isCurrent}
                      onChange={(e) => setEditForm({ ...editForm, isCurrent: e.target.checked })}
                    />
                    <Label htmlFor={`current-${exp._id}`} className="text-xs">
                      Current job
                    </Label>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      rows={2}
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Technologies Used (comma separated)</Label>
                    <Input
                      value={
                        Array.isArray(editForm.technologiesUsed)
                          ? editForm.technologiesUsed.join(", ")
                          : ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          technologiesUsed: e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Achievements (one per line)</Label>
                    <Textarea
                      rows={3}
                      value={
                        Array.isArray(editForm.achievements) ? editForm.achievements.join("\n") : ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          achievements: e.target.value
                            .split("\n")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit("experiences", exp._id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={exp._id}
                className="rounded-xl border border-border p-4 bg-card shadow-subtle hover:shadow-soft transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">{exp.role}</h4>
                    <p className="text-xs text-muted-foreground font-medium">
                      {exp.companyName} · {exp.location}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {exp.startDate || "—"} → {exp.isCurrent ? "Present" : exp.endDate || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => startEdit(exp._id, exp)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => deleteItem("experiences", exp._id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Skip
                    </Button>
                  </div>
                </div>
                {isDuplicate && (
                  <Badge
                    variant="warning"
                    className="mb-2 text-[10px] gap-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" /> Already exists in Master Profile (will
                    be merged)
                  </Badge>
                )}
                {exp.description && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded">
                    {exp.description}
                  </p>
                )}
                {exp.technologiesUsed?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exp.technologiesUsed.map((tech: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[9px] px-1 py-0">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
                {exp.achievements?.length > 0 && (
                  <ul className="list-disc pl-4 text-xs text-muted-foreground mt-2 space-y-0.5">
                    {exp.achievements.map((ach: string, i: number) => (
                      <li key={i}>{ach}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderProjectsReview = () => {
    return (
      <div className="space-y-4 max-w-2xl">
        <h3 className="font-semibold text-sm">Projects</h3>
        {data.projects.length === 0 ? (
          <p className="text-xs text-muted-foreground">No projects extracted.</p>
        ) : (
          data.projects.map((proj: any) => {
            const isEditing = editingId === proj._id;
            const isDuplicate = existingProj.some(
              (p: any) => p.name.trim().toLowerCase() === proj.name.trim().toLowerCase(),
            );

            if (isEditing) {
              return (
                <div
                  key={proj._id}
                  className="rounded-xl border border-border p-5 space-y-3 bg-muted/10"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Project Name</Label>
                      <Input
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Role</Label>
                      <Input
                        value={editForm.role || ""}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      rows={2}
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Live URL</Label>
                      <Input
                        value={editForm.liveUrl || ""}
                        onChange={(e) => setEditForm({ ...editForm, liveUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Github URL</Label>
                      <Input
                        value={editForm.githubUrl || ""}
                        onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Stack (comma separated)</Label>
                    <Input
                      value={Array.isArray(editForm.stack) ? editForm.stack.join(", ") : ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          stack: e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Key Achievements (one per line)</Label>
                    <Textarea
                      rows={3}
                      value={
                        Array.isArray(editForm.achievements) ? editForm.achievements.join("\n") : ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          achievements: e.target.value
                            .split("\n")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id={`feat-${proj._id}`}
                      checked={!!editForm.featured}
                      onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                    />
                    <Label htmlFor={`feat-${proj._id}`} className="text-xs">
                      Featured Project
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit("projects", proj._id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={proj._id}
                className="rounded-xl border border-border p-4 bg-card shadow-subtle hover:shadow-soft transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">{proj.name}</h4>
                    {proj.role && (
                      <p className="text-xs text-muted-foreground font-medium">Role: {proj.role}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => startEdit(proj._id, proj)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => deleteItem("projects", proj._id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Skip
                    </Button>
                  </div>
                </div>
                {isDuplicate && (
                  <Badge
                    variant="warning"
                    className="mb-2 text-[10px] gap-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" /> Already exists in Master Profile (will
                    be merged)
                  </Badge>
                )}
                {proj.description && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded">
                    {proj.description}
                  </p>
                )}
                {proj.stack?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {proj.stack.map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[9px] px-1 py-0">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                {(proj.liveUrl || proj.githubUrl) && (
                  <div className="flex gap-3 mt-2 text-xs text-primary font-medium">
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Live Demo
                      </a>
                    )}
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        <FolderGit2 className="h-3 w-3" /> Source Code
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderSkillsReview = () => {
    return (
      <div className="space-y-4 max-w-xl">
        <h3 className="font-semibold text-sm">Skills</h3>
        {data.skills.length === 0 ? (
          <p className="text-xs text-muted-foreground">No skills extracted.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.skills.map((skill: any) => {
              const isEditing = editingId === skill._id;
              const isDuplicate = existingSkills.some(
                (s: any) => s.name.trim().toLowerCase() === skill.name.trim().toLowerCase(),
              );

              if (isEditing) {
                return (
                  <div
                    key={skill._id}
                    className="rounded-xl border border-border p-3 space-y-2 bg-muted/10 col-span-1 sm:col-span-2"
                  >
                    <div>
                      <Label className="text-xs">Skill Name</Label>
                      <Input
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Select
                        value={editForm.category || "LANGUAGES"}
                        onValueChange={(val) => setEditForm({ ...editForm, category: val })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SKILL_CATEGORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => saveEdit("skills", skill._id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={skill._id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-subtle hover:border-primary/30 transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">{skill.name}</span>
                      {isDuplicate && (
                        <span
                          title="Exists in profile (will be merged)"
                          className="text-[10px] text-yellow-600 bg-yellow-500/10 rounded-full px-1.5 border border-yellow-500/20"
                        >
                          Dup
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase font-medium">
                      {skill.category || "LANGUAGES"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground"
                      onClick={() => startEdit(skill._id, skill)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteItem("skills", skill._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderEducationsReview = () => {
    return (
      <div className="space-y-4 max-w-2xl">
        <h3 className="font-semibold text-sm">Education</h3>
        {data.educations.length === 0 ? (
          <p className="text-xs text-muted-foreground">No education history extracted.</p>
        ) : (
          data.educations.map((ed: any) => {
            const isEditing = editingId === ed._id;
            const isDuplicate = existingEd.some(
              (e: any) =>
                e.school.trim().toLowerCase() === ed.school.trim().toLowerCase() &&
                e.degree.trim().toLowerCase() === ed.degree.trim().toLowerCase(),
            );

            if (isEditing) {
              return (
                <div
                  key={ed._id}
                  className="rounded-xl border border-border p-5 space-y-3 bg-muted/10"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">School / University</Label>
                      <Input
                        value={editForm.school || ""}
                        onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Degree</Label>
                      <Input
                        value={editForm.degree || ""}
                        onChange={(e) => setEditForm({ ...editForm, degree: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Field of Study</Label>
                      <Input
                        value={editForm.field || ""}
                        onChange={(e) => setEditForm({ ...editForm, field: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        value={editForm.startDate || ""}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input
                        value={editForm.endDate || ""}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">GPA</Label>
                    <Input
                      value={editForm.gpa || ""}
                      onChange={(e) => setEditForm({ ...editForm, gpa: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Description / Details</Label>
                    <Textarea
                      rows={2}
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit("educations", ed._id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={ed._id}
                className="rounded-xl border border-border p-4 bg-card shadow-subtle hover:shadow-soft transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">
                      {ed.degree} in {ed.field || "General Studies"}
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium">{ed.school}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {ed.startDate || "—"} → {ed.endDate || "—"} {ed.gpa ? `· GPA: ${ed.gpa}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => startEdit(ed._id, ed)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => deleteItem("educations", ed._id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Skip
                    </Button>
                  </div>
                </div>
                {isDuplicate && (
                  <Badge
                    variant="warning"
                    className="mb-2 text-[10px] gap-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" /> Already exists in Master Profile (will
                    be merged)
                  </Badge>
                )}
                {ed.description && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded">
                    {ed.description}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderCertificatesReview = () => {
    return (
      <div className="space-y-4 max-w-2xl">
        <h3 className="font-semibold text-sm">Certifications</h3>
        {data.certificates.length === 0 ? (
          <p className="text-xs text-muted-foreground">No certifications extracted.</p>
        ) : (
          data.certificates.map((cert: any) => {
            const isEditing = editingId === cert._id;
            const isDuplicate = existingCert.some(
              (c: any) => c.name.trim().toLowerCase() === cert.name.trim().toLowerCase(),
            );

            if (isEditing) {
              return (
                <div
                  key={cert._id}
                  className="rounded-xl border border-border p-5 space-y-3 bg-muted/10"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Certification Name</Label>
                      <Input
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Issuer</Label>
                      <Input
                        value={editForm.issuer || ""}
                        onChange={(e) => setEditForm({ ...editForm, issuer: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Issued At</Label>
                      <Input
                        value={editForm.issuedAt || ""}
                        onChange={(e) => setEditForm({ ...editForm, issuedAt: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Expires At</Label>
                      <Input
                        value={editForm.expiresAt || ""}
                        onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Credential URL</Label>
                    <Input
                      value={editForm.credentialUrl || ""}
                      onChange={(e) => setEditForm({ ...editForm, credentialUrl: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit("certificates", cert._id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cert._id}
                className="rounded-xl border border-border p-4 bg-card shadow-subtle hover:shadow-soft transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">{cert.name}</h4>
                    <p className="text-xs text-muted-foreground font-medium">
                      Issued by: {cert.issuer}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Issued: {cert.issuedAt || "—"}{" "}
                      {cert.expiresAt ? `· Expires: ${cert.expiresAt}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => startEdit(cert._id, cert)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => deleteItem("certificates", cert._id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Skip
                    </Button>
                  </div>
                </div>
                {isDuplicate && (
                  <Badge
                    variant="warning"
                    className="mb-2 text-[10px] gap-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" /> Already exists in Master Profile (will
                    be merged)
                  </Badge>
                )}
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline mt-2"
                  >
                    <ExternalLink className="h-3 w-3" /> View Credential
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderAchievementsReview = () => {
    return (
      <div className="space-y-4 max-w-2xl">
        <h3 className="font-semibold text-sm">Achievements</h3>
        {data.achievements.length === 0 ? (
          <p className="text-xs text-muted-foreground">No achievements extracted.</p>
        ) : (
          data.achievements.map((ach: any) => {
            const isEditing = editingId === ach._id;
            const isDuplicate = existingAch.some(
              (a: any) => a.title.trim().toLowerCase() === ach.title.trim().toLowerCase(),
            );

            if (isEditing) {
              return (
                <div
                  key={ach._id}
                  className="rounded-xl border border-border p-5 space-y-3 bg-muted/10"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Context / Issuer</Label>
                      <Input
                        value={editForm.context || ""}
                        onChange={(e) => setEditForm({ ...editForm, context: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      rows={2}
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input
                        value={editForm.date || ""}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">URL</Label>
                      <Input
                        value={editForm.url || ""}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit("achievements", ach._id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={ach._id}
                className="rounded-xl border border-border p-4 bg-card shadow-subtle hover:shadow-soft transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">{ach.title}</h4>
                    <p className="text-xs text-muted-foreground font-medium">{ach.context}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Date: {ach.date || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => startEdit(ach._id, ach)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => deleteItem("achievements", ach._id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Skip
                    </Button>
                  </div>
                </div>
                {isDuplicate && (
                  <Badge
                    variant="warning"
                    className="mb-2 text-[10px] gap-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" /> Already exists in Master Profile (will
                    be merged)
                  </Badge>
                )}
                {ach.description && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded">
                    {ach.description}
                  </p>
                )}
                {ach.url && (
                  <a
                    href={ach.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline mt-2"
                  >
                    <ExternalLink className="h-3 w-3" /> View Achievement Link
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderSocialLinksReview = () => {
    return (
      <div className="space-y-4 max-w-xl">
        <h3 className="font-semibold text-sm">Social Links</h3>
        {data.socialLinks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No social links extracted.</p>
        ) : (
          data.socialLinks.map((link: any) => {
            const isEditing = editingId === link._id;
            const isDuplicate = existingSocial.some(
              (s: any) => s.platform.trim().toLowerCase() === link.platform.trim().toLowerCase(),
            );

            if (isEditing) {
              return (
                <div
                  key={link._id}
                  className="rounded-xl border border-border p-4 space-y-3 bg-muted/10"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <Select
                        value={editForm.platform || "LINKEDIN"}
                        onValueChange={(val) => setEditForm({ ...editForm, platform: val })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">URL</Label>
                      <Input
                        value={editForm.url || ""}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit("socialLinks", link._id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={link._id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-subtle hover:border-primary/30 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase">{link.platform}</span>
                    {isDuplicate && (
                      <span
                        title="Platform exists (will be merged)"
                        className="text-[10px] text-yellow-600 bg-yellow-500/10 rounded-full px-1.5 border border-yellow-500/20"
                      >
                        Dup
                      </span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary truncate hover:underline block max-w-sm"
                  >
                    {link.url}
                  </a>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => startEdit(link._id, link)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteItem("socialLinks", link._id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl rounded-2xl border border-border bg-background shadow-lifted overflow-hidden">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={importerType === "resume" ? ".pdf,.docx,.doc" : ".pdf"}
          onChange={handleFileChange}
        />

        {step === "select" && (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Import Profile</h2>
                <p className="text-xs text-muted-foreground">
                  Extract details to master profile success.
                </p>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resume Card */}
              <div className="flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all shadow-subtle">
                <div className="flex items-center gap-3 mb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg">Import Resume</h3>
                </div>
                <div className="text-sm text-muted-foreground mb-4 space-y-1">
                  <p>
                    <strong>Supported:</strong> PDF, DOCX
                  </p>
                  <p className="text-xs">
                    Extract career history and build your Master Profile from an existing resume.
                  </p>
                </div>
                <Button className="mt-auto gap-2" onClick={() => triggerFileSelect("resume")}>
                  <Upload className="h-4 w-4" /> Upload Resume
                </Button>
              </div>

              {/* LinkedIn Card */}
              <div className="flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all shadow-subtle">
                <div className="flex items-center gap-3 mb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg">Import LinkedIn</h3>
                </div>
                <div className="text-sm text-muted-foreground mb-4 space-y-1">
                  <p>
                    <strong>Supported:</strong> LinkedIn PDF Export
                  </p>
                  <p className="text-xs">
                    Import complete profile, projects, certificates, honors, and skills.
                  </p>
                </div>
                <Button className="mt-auto gap-2" onClick={() => triggerFileSelect("linkedin")}>
                  <Upload className="h-4 w-4" /> Upload LinkedIn Export
                </Button>
              </div>
            </div>

            <div className="mt-6 flex gap-2 items-start rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Pro-tip</p>
                <p>
                  LinkedIn usually contains more complete information than a resume. You can import
                  both successively to build a comprehensive Master Profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "uploading" && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Profile File</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{loadingMessage}</p>
          </div>
        )}

        {step === "review" && data && (
          <div className="flex flex-col h-[80vh] max-h-[750px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-bold">Review Extracted Profile</h2>
                <p className="text-xs text-muted-foreground">
                  Review, edit, and skip sections before merging into your PostgreSQL Master
                  Profile.
                </p>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-52 border-r border-border bg-muted/10 p-3 flex flex-col gap-1 overflow-y-auto shrink-0">
                {[
                  { id: "personal", label: "Personal Info", count: data.personalInfo ? 1 : 0 },
                  { id: "experiences", label: "Experience", count: data.experiences.length },
                  { id: "projects", label: "Projects", count: data.projects.length },
                  { id: "skills", label: "Skills", count: data.skills.length },
                  { id: "educations", label: "Education", count: data.educations.length },
                  { id: "certificates", label: "Certifications", count: data.certificates.length },
                  { id: "achievements", label: "Achievements", count: data.achievements.length },
                  { id: "socialLinks", label: "Social Links", count: data.socialLinks.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setEditingId(null);
                      setEditForm(null);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors w-full",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              {/* Main review content list */}
              <div className="flex-1 p-6 overflow-y-auto bg-muted/5">
                {activeTab === "personal" && renderPersonalReview()}
                {activeTab === "experiences" && renderExperiencesReview()}
                {activeTab === "projects" && renderProjectsReview()}
                {activeTab === "skills" && renderSkillsReview()}
                {activeTab === "educations" && renderEducationsReview()}
                {activeTab === "certificates" && renderCertificatesReview()}
                {activeTab === "achievements" && renderAchievementsReview()}
                {activeTab === "socialLinks" && renderSocialLinksReview()}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-background shrink-0">
              <Button size="sm" variant="outline" onClick={() => setStep("select")}>
                Back to Upload
              </Button>
              <Button size="sm" onClick={handleMerge} disabled={merging}>
                {merging ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 mr-2" />
                    Accept and Merge Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
