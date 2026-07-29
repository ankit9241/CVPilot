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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-1.5 group">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft transition-transform duration-200 group-hover:scale-105">
            <PlaneTakeoff className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="font-serif text-xl font-medium tracking-tight text-foreground leading-none">
                CVPilot
              </span>
              <span className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Resume Intelligence
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80">
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
                      "h-9 rounded-lg text-[13px] font-medium text-sidebar-foreground/80 transition-all duration-200",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "data-[active=true]:bg-card data-[active=true]:text-foreground data-[active=true]:border data-[active=true]:border-border/60 data-[active=true]:shadow-subtle data-[active=true]:font-semibold",
                    )}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
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
                    className="h-9 rounded-lg text-[13px] font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent data-[active=true]:bg-card data-[active=true]:text-foreground data-[active=true]:border data-[active=true]:border-border/60 data-[active=true]:shadow-subtle"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-sidebar-accent",
            collapsed && "justify-center",
          )}
        >
          <Avatar className="h-8 w-8 shrink-0 border border-border">
            {user?.profile?.avatarUrl && (
              <AvatarImage src={user.profile.avatarUrl} alt={user.profile.fullName} />
            )}
            <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
              {getInitials(user?.profile?.fullName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-medium text-foreground">
                  {user?.profile?.fullName || "User"}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
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
