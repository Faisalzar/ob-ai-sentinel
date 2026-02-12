import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
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
  SidebarRail,
} from "./sidebar";
import {
  LayoutDashboard,
  Users,
  FileText,
  Activity,
  Database,
  Shield,
  Zap,
  Bell,
  Settings,
  Moon,
  Sun,
  User,
  LogOut
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { title: "User Management", icon: Users, href: "/admin/users" },
  { title: "Detection Activity", icon: Activity, href: "/admin/uploads" },
  { title: "Threat Monitoring", icon: Shield, href: "/admin/alerts" },
  { title: "System Logs", icon: FileText, href: "/admin/logs" },
  { title: "System Settings", icon: Settings, href: "/admin/settings" },
];

export const AdminSidebar = memo(() => {
  const location = useLocation();
  const { logout } = useAuth();
  // Theme handling would typically be in a context, but we'll omit next-themes for now
  // and just use a placeholder or the parent's handling if available.

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">OB AI Sentinel</span>
                  <span className="truncate text-xs">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
});
AdminSidebar.displayName = "AdminSidebar";