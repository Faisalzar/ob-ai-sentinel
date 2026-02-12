import React from 'react';
import { Search, Grid, List as ListIcon, SlidersHorizontal, Trash2, RotateCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const UploadsFilter = ({
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    selectedCount,
    onClearSelection,
    onBulkDelete,
    onBulkReprocess
}) => {
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const hasActiveFilters = Object.values(filters).some(Boolean);

    return (
        <div className="mb-6 space-y-4">
            {/* Top Bar: Search & View Toggle */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                    {/* View Toggle */}
                    <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Grid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <ListIcon className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Filter Toggle (could expand a panel, for now just simple dropdowns) */}
                    <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 [&>option]:bg-zinc-900"
                    >
                        <option value="">All Types</option>
                        <option value="image">Images</option>
                        <option value="video">Videos</option>
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 [&>option]:bg-zinc-900"
                    >
                        <option value="">All Status</option>
                        <option value="processed">Processed</option>
                        <option value="processing">Processing</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-3"
                    >
                        <span className="text-sm font-medium text-purple-200">
                            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onBulkReprocess}
                                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                            >
                                <RotateCw className="h-3.5 w-3.5" />
                                Reprocess
                            </button>
                            <button
                                onClick={onBulkDelete}
                                className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </button>
                            <button
                                onClick={onClearSelection}
                                className="ml-2 rounded-full p-1 text-purple-300 hover:bg-purple-500/20 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
