import React from 'react';
import { Search, SlidersHorizontal, Trash2, RotateCw, X } from 'lucide-react';

export const AlertsFilter = ({
    searchQuery,
    setSearchQuery,
    filters,
    setFilters
}) => {
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="mb-6 space-y-4">
            {/* Top Bar: Search & Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search alerts, objects, or users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Severity Filter */}
                    <div className="relative">
                        <select
                            value={filters.severity}
                            onChange={(e) => handleFilterChange('severity', e.target.value)}
                            className="appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-8 text-sm text-white focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 [&>option]:bg-zinc-900"
                        >
                            <option value="">All Severities</option>
                            <option value="dangerous">Dangerous</option>
                            <option value="caution">Caution</option>
                            <option value="harmless">Harmless</option>
                        </select>
                        <SlidersHorizontal className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-8 text-sm text-white focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 [&>option]:bg-zinc-900"
                        >
                            <option value="">All Status</option>
                            <option value="new">New</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="acknowledged">Acknowledged</option>
                        </select>
                        <SlidersHorizontal className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};
