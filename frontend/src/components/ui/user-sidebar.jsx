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
    Video,
    FileText,
    Terminal,
    Shield,
    User,
    LogOut,
    ListVideo
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/user/dashboard" },
    { title: "Live Detection", icon: Video, href: "/user/detect/live" },
    { title: "Video Analysis", icon: ListVideo, href: "/user/detect/video" },
    { title: "Image Analysis", icon: FileText, href: "/user/detect/image" },
    { title: "History", icon: Terminal, href: "/user/history" },
];

function UserSidebarContent() {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <Sidebar collapsible="icon" className="border-r border-white/10 bg-black/90 text-white backdrop-blur-xl">
            <SidebarHeader className="border-b border-white/5 pb-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
                            <Link to="/user/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-bold text-white">Ob AI Sentinel</span>
                                    <span className="truncate text-xs text-purple-400">Enterprise Security</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-zinc-500">Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href;
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={`
                        relative overflow-hidden transition-all duration-300
                        ${isActive
                                                    ? "bg-purple-500/10 text-purple-400 shadow-[inset_4px_0_0_0_#a855f7]"
                                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                                }
                      `}
                                        >
                                            <Link to={item.href}>
                                                <Icon className={`h-5 w-5 ${isActive ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""}`} />
                                                <span className="font-medium">{item.title}</span>
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-50" />
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-white/5 pt-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Profile" className="hover:bg-white/5 text-zinc-300 hover:text-white">
                            <Link to="/user/profile">
                                <User className="h-4 w-4" />
                                <span>{user?.name || user?.email?.split('@')[0] || "Profile"}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={logout}
                            tooltip="Sign Out"
                            className="text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail className="hover:bg-purple-500/50" />
        </Sidebar>
    );
}

export const UserSidebar = memo(UserSidebarContent);
UserSidebar.displayName = "UserSidebar";
