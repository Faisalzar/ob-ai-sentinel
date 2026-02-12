import React from 'react';
import { Search, Bell, RefreshCw, Upload, Sun } from 'lucide-react';

const DashboardHeader = ({
    searchQuery,
    onSearchChange,
    onRefresh,
    onExport,
    isRefreshing
}) => {
    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/10 bg-zinc-950/80 px-6 backdrop-blur-md">
            <div className="flex flex-1 items-center gap-4">
                <div className="hidden md:flex items-center text-sm text-zinc-400">
                    <span className="font-medium text-white">Dashboard</span>
                    <span className="mx-2">/</span>
                    <span>Overview</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="h-9 w-64 rounded-md border border-white/10 bg-zinc-900/50 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Refresh Button */}
                <button
                    onClick={onRefresh}
                    className={`
            flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white
            ${isRefreshing ? 'animate-spin text-purple-500' : ''}
          `}
                    title="Refresh Data"
                >
                    <RefreshCw size={16} />
                </button>

                {/* Notifications */}
                <button className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
                    <div className="relative">
                        <Bell size={16} />
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    </div>
                </button>

                {/* Theme Toggle (Placeholder) */}
                <button className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white md:hidden">
                    <Sun size={16} />
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;
