"use client";
import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./button";
import {
  TrendingUp,
  Plus,
  Calendar,
  Mail,
  MapPin,
  MoreHorizontal,
  Trash2,
  Ban,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";


const UsersTableComponent = ({ users = [], onAddUser }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // Calculate pagination
  const totalPages = Math.ceil(users.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Show ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }

      // Show pages around current
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Show ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="border-border bg-card/40 rounded-xl border p-3 sm:p-6 text-white">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold sm:text-xl">Recent Users</h3>
          <p className="text-muted-foreground text-sm text-gray-400">
            Latest user registrations and activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {users.length > 0 && (
            <span className="text-sm text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, users.length)} of {users.length}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {currentUsers.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No recent users found.</p>
        ) : (
          currentUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group hover:bg-white/5 flex flex-col items-start gap-4 rounded-lg p-4 transition-colors sm:flex-row sm:items-center border border-white/5">
              <div className="flex w-full items-center gap-4 sm:w-auto">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div
                    className={`border-background absolute -right-1 -bottom-1 h-3 w-3 rounded-full border-2 ${user.is_active ? "bg-green-500" : "bg-red-500"}`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-sm font-medium text-white">{user.name}</h4>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${user.role === "admin"
                        ? "bg-purple-500/10 text-purple-500"
                        : "bg-blue-500/10 text-blue-500"
                        }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-4 text-gray-400">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {/* Location is not in our user model, removing or mocking if needed */}
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="text-muted-foreground flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto text-gray-400 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                    <DropdownMenuItem onClick={() => onAddUser(user, 'view')}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Info
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddUser(user, 'suspend')} className="text-orange-400 focus:text-orange-300">
                      <Ban className="mr-2 h-4 w-4" />
                      Suspend Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddUser(user, 'delete')} className="text-red-400 focus:text-red-300">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        handlePageChange(currentPage - 1);
                      }
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
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
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
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        handlePageChange(currentPage + 1);
                      }
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

export const UsersTable = memo(UsersTableComponent);
UsersTable.displayName = "UsersTable";