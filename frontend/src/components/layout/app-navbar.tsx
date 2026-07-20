import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { mainNav, bottomNav } from "@/constants/navigation";
import { useAuthStore } from "../../store/auth-store";

function usePageTitle() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const match = [...mainNav, ...bottomNav].find((i) =>
    i.url === "/dashboard" ? pathname === i.url : pathname.startsWith(i.url),
  );
  return match?.title ?? "Dashboard";
}

export function AppNavbar() {
  const title = usePageTitle();
  const { user } = useAuthStore();

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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="h-5" />

      <Breadcrumb className="hidden md:block">
        <BreadcrumbList className="text-[13px]">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                CVPilot
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <span className="text-[13px] font-medium md:hidden">{title}</span>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="h-8 w-56 rounded-md border border-border bg-surface pl-8 pr-14 text-[13px] outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10 lg:w-72"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
            ⌘K
          </kbd>
        </div>

        <button
          aria-label="Notifications"
          className="relative grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Avatar className="h-8 w-8 border border-border">
          {user?.profile?.avatarUrl && (
            <AvatarImage src={user.profile.avatarUrl} alt={user.profile.fullName} />
          )}
          <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
            {getInitials(user?.profile?.fullName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
