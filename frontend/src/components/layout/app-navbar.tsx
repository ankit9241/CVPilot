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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 px-4 sm:px-6 bg-[#FFFEFC]/90 backdrop-blur-md border-b border-[rgba(55,50,47,0.10)] transition-all">
      <SidebarTrigger className="h-8 w-8 text-[#18181B]/70 hover:text-[#18181B]" />
      <Separator orientation="vertical" className="h-5 bg-[rgba(55,50,47,0.10)]" />

      <Breadcrumb className="hidden md:block">
        <BreadcrumbList className="text-[13px]">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard" className="font-serif text-base text-[#18181B]/60 hover:text-[#18181B] transition-colors">
                CVPilot
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-[#18181B] font-sans">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <span className="text-[13px] font-medium text-[#18181B] md:hidden font-sans">{title}</span>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#18181B]/50" />
          <input
            type="search"
            placeholder="Search..."
            className="h-8.5 w-56 rounded-full border border-[rgba(55,50,47,0.12)] bg-[#F8F6F3] pl-9 pr-14 text-[12.5px] outline-none transition-all placeholder:text-[#18181B]/40 focus:border-[#18181B]/30 focus:bg-[#FFFEFC] lg:w-72"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded-full border border-[rgba(55,50,47,0.10)] bg-[#FFFEFC] px-2 font-mono text-[9.5px] font-medium text-[#18181B]/50 lg:inline-flex">
            ⌘K
          </kbd>
        </div>

        <button
          aria-label="Notifications"
          className="relative grid h-8 w-8 place-items-center rounded-full text-[#18181B]/70 transition-colors hover:bg-[#F4F1EC] hover:text-[#18181B]"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#18181B]" />
        </button>

        <Separator orientation="vertical" className="mx-1 h-5 bg-[rgba(55,50,47,0.10)]" />

        <Avatar className="h-8 w-8 border border-[rgba(55,50,47,0.12)]">
          {user?.profile?.avatarUrl && (
            <AvatarImage src={user.profile.avatarUrl} alt={user.profile.fullName} />
          )}
          <AvatarFallback className="bg-[#18181B] text-[11px] font-medium text-white font-mono">
            {getInitials(user?.profile?.fullName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
