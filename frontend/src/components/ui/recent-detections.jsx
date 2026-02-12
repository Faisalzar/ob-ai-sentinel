import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./button";
import {
    TrendingUp,
    ExternalLink,
    ShieldAlert,
    Calendar,
    Video,
    MoreHorizontal,
    Clock
} from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "./pagination";

// Helper function to format relative time
const getRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString();
};

const RecentDetectionsTableComponent = ({ detections = [] }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const detectionsPerPage = 8;

    // Calculate pagination
    const totalPages = Math.ceil(detections.length / detectionsPerPage);
    const startIndex = (currentPage - 1) * detectionsPerPage;
    const endIndex = startIndex + detectionsPerPage;
    const currentDetections = detections.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('ellipsis-start');

            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('ellipsis-end');
            if (totalPages > 1) pages.push(totalPages);
        }
        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="border border-white/10 bg-black/40 backdrop-blur-md rounded-xl p-3 sm:p-6 shadow-xl">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold sm:text-xl text-white">Recent Detections</h3>
                        <div className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20">
                            <Clock className="h-3 w-3" />
                            <span>Last 24 Hours</span>
                        </div>
                        {detections.length > 0 && (
                            <span className="text-sm text-gray-400 ml-2">
                                {startIndex + 1}-{Math.min(endIndex, detections.length)} of {detections.length}
                            </span>
                        )}
                    </div>
                    <p className="text-zinc-500 text-sm mt-1">
                        Latest alerts captured by your security system
                    </p>
                </div>
                <div className="flex items-center gap-2">
                </div>
            </div>

            <div className="space-y-2">
                {detections.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                        <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No detections in the last 24 hours</p>
                        <p className="text-sm mt-1">Your system is monitoring and will alert you of any threats</p>
                    </div>
                ) : (
                    currentDetections.map((item, index) => (
                        <motion.div
                            key={item.id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-white/5 flex flex-col items-start gap-4 rounded-lg p-4 transition-colors sm:flex-row sm:items-center border border-transparent hover:border-white/5"
                        >
                            <div className="flex w-full items-center gap-4 sm:w-auto">
                                <div className="relative">
                                    <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full
                        ${item.level === 'dangerous' ? 'bg-red-500/20 text-red-500' :
                                            item.level === 'caution' ? 'bg-orange-500/20 text-orange-500' :
                                                'bg-blue-500/20 text-blue-500'}
                    `}>
                                        {item.level === 'dangerous' ? <ShieldAlert size={20} /> : <Video size={20} />}
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="truncate text-sm font-medium text-white">{item.camera || "Unknown Stream"}</h4>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${item.level === "dangerous"
                                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                                : item.level === "caution"
                                                    ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                                }`}
                                        >
                                            {item.type?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-zinc-500 mt-1 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-4">
                                        <div className="flex items-center gap-1">
                                            <span className="font-mono text-xs text-purple-400">YOLOv8-L</span>
                                        </div>
                                        {item.confidence > 0 && (
                                            <div className="flex items-center gap-1">
                                                <span>{(item.confidence * 100).toFixed(0)}% Conf</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="ml-auto flex items-center gap-3">
                                <div className="text-zinc-500 flex items-center gap-1 text-xs font-mono">
                                    <Clock className="h-3 w-3" />
                                    <span>{getRelativeTime(item.time)}</span>
                                </div>

                                <Button variant="ghost" size="sm" className="ml-auto text-zinc-400 hover:text-white">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage > 1) handlePageChange(currentPage - 1);
                                        }}
                                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </motion.div>
                            </PaginationItem>

                            {pageNumbers.map((page, index) => {
                                if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                                    return (
                                        <PaginationItem key={`ellipsis-${index}`}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    );
                                }

                                const isActive = page === currentPage;
                                return (
                                    <PaginationItem key={page}>
                                        <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                            <PaginationLink
                                                href="#"
                                                isActive={isActive}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePageChange(page);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </motion.div>
                                    </PaginationItem>
                                );
                            })}

                            <PaginationItem>
                                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage < totalPages) handlePageChange(currentPage + 1);
                                        }}
                                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </motion.div>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
};

export const RecentDetectionsTable = memo(RecentDetectionsTableComponent);

RecentDetectionsTable.displayName = "RecentDetectionsTable";

