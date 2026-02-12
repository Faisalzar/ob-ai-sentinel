import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export const LogsFilter = ({ searchQuery, setSearchQuery, filters, setFilters }) => {
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex flex-col gap-4 p-4 border-b border-white/10">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search logs by user, resource or IP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-zinc-600"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <div className="relative">
                        <select
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                            className="appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-2 pr-8 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 [&>option]:bg-zinc-900 cursor-pointer min-w-[140px]"
                        >
                            <option value="">All Actions</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="upload">Upload</option>
                            <option value="delete">Delete</option>
                            <option value="update_user">Update User</option>
                            <option value="update_settings">Update Settings</option>
                            <option value="reset_mfa">Reset MFA</option>
                            <option value="force_logout">Force Logout</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-2 pr-8 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 [&>option]:bg-zinc-900 cursor-pointer min-w-[140px]"
                        >
                            <option value="">All Status</option>
                            <option value="success">Success</option>
                            <option value="failure">Failure</option>
                            <option value="error">Error</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};
