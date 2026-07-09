import {
  LayoutDashboard,
  UserCircle,
  FileText,
  ScanSearch,
  Archive,
  Workflow,
  LayoutTemplate,
  Settings,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
}

export const mainNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Resume Studio", url: "/resume-studio", icon: FileText },
  { title: "Resume Analyzer", url: "/resume-analyzer", icon: ScanSearch },
  { title: "Resume Vault", url: "/resume-vault", icon: Archive },
  { title: "Workflow", url: "/workflow", icon: Workflow },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Applications", url: "/applications", icon: Briefcase, badge: "Soon" },
];

export const bottomNav: NavItem[] = [{ title: "Settings", url: "/settings", icon: Settings }];
