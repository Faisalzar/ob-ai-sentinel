'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from './pagination';

export default function BasicPagination({
    totalPages = 10,
    initialPage = 1,
    siblingsCount = 1,
    onPageChange,
    className,
    variant = 'default',
    showDemo = false,
}) {
    const [currentPage, setCurrentPage] = useState(initialPage);

    useEffect(() => {
        setCurrentPage(initialPage);
    }, [initialPage]);

    // Generate page numbers array
    const generatePagination = () => {
        // Always show first and last page
        const firstPage = 1;
        const lastPage = totalPages;

        // Calculate range of pages to show around current page
        const leftSiblingIndex = Math.max(currentPage - siblingsCount, firstPage);
        const rightSiblingIndex = Math.min(currentPage + siblingsCount, lastPage);

        // Determine whether to show ellipses
        const shouldShowLeftDots = leftSiblingIndex > firstPage + 1;
        const shouldShowRightDots = rightSiblingIndex < lastPage - 1;

        // Initialize the array of page numbers
        const pageNumbers = [];

        // Always add first page
        pageNumbers.push(firstPage);

        // Add left ellipsis if needed
        if (shouldShowLeftDots) {
            pageNumbers.push('leftEllipsis');
        }

        // Add page numbers between ellipses
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
            if (i !== firstPage && i !== lastPage) {
                pageNumbers.push(i);
            }
        }

        // Add right ellipsis if needed
        if (shouldShowRightDots) {
            pageNumbers.push('rightEllipsis');
        }

        // Always add last page if it's not the same as first page
        if (lastPage !== firstPage) {
            pageNumbers.push(lastPage);
        }

        return pageNumbers;
    };

    const handlePageChange = (page) => {
        if (page === currentPage) return;

        setCurrentPage(page);
        onPageChange?.(page);
    };

    const pageNumbers = generatePagination();

    // Variants for motion animations
    const itemVariants = {
        initial: { opacity: 0, y: 5 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -5 },
        hover: { scale: 1.05, transition: { duration: 0.2 } },
    };

    // Get button style based on variant
    const getButtonStyle = (isActive) => {
        if (variant === 'outline') {
            return isActive
                ? 'border-primary text-primary hover:bg-primary/10'
                : 'border-border hover:border-primary/50 hover:text-primary';
        }

        if (variant === 'rounded') {
            return isActive
                ? 'bg-primary text-primary-foreground rounded-full'
                : 'hover:bg-muted rounded-full';
        }

        // Default variant
        return isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted';
    };

    return (
        <Pagination className={cn('py-4', className)}>
            <PaginationContent>
                <PaginationItem>
                    <motion.div
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        whileHover="hover"
                        variants={itemVariants}
                        transition={{ duration: 0.3 }}
                    >
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) {
                                    handlePageChange(currentPage - 1);
                                }
                            }}
                            className={cn(
                                currentPage <= 1 ? 'pointer-events-none opacity-50' : '',
                                variant === 'rounded' ? 'rounded-full' : '',
                            )}
                        />
                    </motion.div>
                </PaginationItem>

                {pageNumbers.map((page, index) => {
                    if (page === 'leftEllipsis' || page === 'rightEllipsis') {
                        return (
                            <PaginationItem key={`ellipsis-${index}`}>
                                <motion.div
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    variants={itemVariants}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <PaginationEllipsis />
                                </motion.div>
                            </PaginationItem>
                        );
                    }

                    const pageNum = page;
                    const isActive = pageNum === currentPage;

                    return (
                        <PaginationItem key={pageNum}>
                            <motion.div
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                whileHover="hover"
                                variants={itemVariants}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <PaginationLink
                                    href="#"
                                    isActive={isActive}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageChange(pageNum);
                                    }}
                                    className={cn(
                                        getButtonStyle(isActive),
                                        variant === 'outline' && 'border',
                                        'transition-all duration-200',
                                    )}
                                >
                                    {pageNum}
                                </PaginationLink>
                            </motion.div>
                        </PaginationItem>
                    );
                })}

                <PaginationItem>
                    <motion.div
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        whileHover="hover"
                        variants={itemVariants}
                        transition={{ duration: 0.3 }}
                    >
                        <PaginationNext
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) {
                                    handlePageChange(currentPage + 1);
                                }
                            }}
                            className={cn(
                                currentPage >= totalPages
                                    ? 'pointer-events-none opacity-50'
                                    : '',
                                variant === 'rounded' ? 'rounded-full' : '',
                            )}
                        />
                    </motion.div>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
