"use client";
import { memo, useState } from "react";
import { motion } from "framer-motion";
import { User, Download, Settings, Users } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
const activities = [
  {
    action: "User login",
    user: "john@example.com",
    time: "2 min ago",
    icon: User,
    color: "text-blue-500",
  },
  {
    action: "Data export",
    user: "admin",
    time: "5 min ago",
    icon: Download,
    color: "text-green-500",
  },
  {
    action: "Settings updated",
    user: "admin",
    time: "10 min ago",
    icon: Settings,
    color: "text-orange-500",
  },
  {
    action: "New user registered",
    user: "sarah@example.com",
    time: "15 min ago",
    icon: Users,
    color: "text-purple-500",
  },
];

const RecentActivityComponent = ({ activities: propActivities }) => {
  const displayActivities = propActivities || activities;
  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 8;

  // Calculate pagination
  const totalPages = Math.ceil(displayActivities.length / activitiesPerPage);
  const startIndex = (currentPage - 1) * activitiesPerPage;
  const endIndex = startIndex + activitiesPerPage;
  const currentActivities = displayActivities.slice(startIndex, endIndex);

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
    <div className="border-border bg-card/40 rounded-xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Recent Activity</h3>
        {displayActivities.length > 0 && (
          <span className="text-sm text-gray-400">
            {startIndex + 1}-{Math.min(endIndex, displayActivities.length)} of {displayActivities.length}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {currentActivities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="hover:bg-accent/50 flex items-center gap-3 rounded-lg p-2 transition-colors">
              <div className={`bg-accent/50 rounded-lg p-2`}>
                <Icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{activity.action}</div>
                <div className="text-muted-foreground truncate text-xs">
                  {activity.user}
                </div>
              </div>
              <div className="text-muted-foreground text-xs">
                {activity.time}
              </div>
            </motion.div>
          );
        })}
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

export const RecentActivity = memo(RecentActivityComponent);
RecentActivity.displayName = "RecentActivity";