"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import { Button } from "./button";
import { Input } from "./input";
import { SidebarTrigger } from "./sidebar";
import { Separator } from "./separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Bell,
  Search,
  Settings,
  Shield,
  User,
  LogOut
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const DashboardHeader = memo(
  ({ searchQuery, onSearchChange }) => {
    const { user, logout } = useAuth();

    return (
      <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center gap-2 border-b border-white/10 bg-black/80 backdrop-blur-md transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 text-zinc-400 hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-white/10" />
          <h1 className="hidden md:flex items-center gap-2 text-lg font-bold text-white tracking-wide">
            <Shield className="text-purple-500 fill-purple-500/20" size={20} />
            OB AI <span className="text-purple-400">SENTINEL</span>
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-4 px-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3">

            {/* Search Input - Hide on Mobile */}
            <div className="relative hidden md:block group">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-zinc-500 group-hover:text-purple-400 transition-colors" />
              <Input
                placeholder="Search events, cameras..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 w-64 border-zinc-800 bg-zinc-900/50 pl-10 text-sm text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-purple-500/50"
              />
            </div>

            <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-white/10 bg-zinc-900 p-0 hover:bg-zinc-800">
                  <User className="h-5 w-5 text-purple-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-white/10 bg-zinc-950 text-zinc-300">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-white">{user?.name || 'Admin User'}</p>
                    <p className="w-[200px] truncate text-xs text-zinc-500">{user?.email || 'admin@obsentinel.ai'}</p>
                  </div>
                </div>
                <Separator className="bg-white/10 my-1" />
                <DropdownMenuItem className="focus:bg-purple-500/10 focus:text-purple-400">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-purple-500/10 focus:text-purple-400">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <Separator className="bg-white/10 my-1" />
                <DropdownMenuItem onClick={logout} className="text-red-400 focus:bg-red-500/10 focus:text-red-300">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </motion.div>
        </div>
      </header>
    );
  },
);
DashboardHeader.displayName = "DashboardHeader";