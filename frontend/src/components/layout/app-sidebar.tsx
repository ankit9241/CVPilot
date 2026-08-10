import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, PlaneTakeoff } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mainNav, bottomNav } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../../store/auth-store";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout } = useAuthStore();

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname.startsWith(url);

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
    <Sidebar collapsible="icon" className="border-r border-[rgba(55,50,47,0.10)] bg-[#F8F6F3]">
      <SidebarHeader className="px-3 py-4 bg-[#F8F6F3]">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-1.5 group">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#18181B] text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
            <PlaneTakeoff className="h-3.5 w-3.5" />
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="font-serif text-xl font-medium tracking-tight text-[#18181B] leading-none">
                CVPilot
              </span>
              <span className="mt-0.5 truncate text-[9.5px] font-mono font-medium uppercase tracking-[0.14em] text-[#18181B]/50">
                Resume Intelligence
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 bg-[#F8F6F3]">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-2.5 text-[9.5px] font-mono font-semibold uppercase tracking-[0.15em] text-[#18181B]/50">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "h-9 rounded-xl text-[13px] font-medium text-[#18181B]/70 transition-all duration-200",
                      "hover:bg-[#F4F1EC] hover:text-[#18181B]",
                      "data-[active=true]:bg-[#FFFEFC] data-[active=true]:text-[#18181B] data-[active=true]:border data-[active=true]:border-[rgba(55,50,47,0.12)] data-[active=true]:shadow-xs data-[active=true]:font-semibold",
                    )}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4 shrink-0 text-[#18181B]/70" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="h-9 rounded-xl text-[13px] font-medium text-[#18181B]/70 hover:bg-[#F4F1EC] hover:text-[#18181B] data-[active=true]:bg-[#FFFEFC] data-[active=true]:text-[#18181B] data-[active=true]:border data-[active=true]:border-[rgba(55,50,47,0.12)] data-[active=true]:shadow-xs"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4 shrink-0 text-[#18181B]/70" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[rgba(55,50,47,0.10)] bg-[#F8F6F3] p-2">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-[#F4F1EC]",
            collapsed && "justify-center",
          )}
        >
          <Avatar className="h-8 w-8 shrink-0 border border-[rgba(55,50,47,0.12)]">
            {user?.profile?.avatarUrl && (
              <AvatarImage src={user.profile.avatarUrl} alt={user.profile.fullName} />
            )}
            <AvatarFallback className="bg-[#18181B] text-[11px] font-medium text-white">
              {getInitials(user?.profile?.fullName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-medium text-[#18181B]">
                  {user?.profile?.fullName || "User"}
                </span>
                <span className="truncate text-[11px] text-[#18181B]/60 font-sans">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="grid h-7 w-7 place-items-center rounded-lg text-[#18181B]/60 transition-colors hover:bg-[#FFFEFC] hover:text-[#18181B] border border-transparent hover:border-[rgba(55,50,47,0.10)]"
                aria-label="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
