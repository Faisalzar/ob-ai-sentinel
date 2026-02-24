import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, RefreshCw, Upload, Sun, X, CheckCheck, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../../services/notificationService';

const DashboardHeader = ({
    searchQuery,
    onSearchChange,
    onRefresh,
    onExport,
    isRefreshing
}) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const popupRef = useRef(null);

    // Fetch notifications on mount and when popup opens
    useEffect(() => {
        fetchNotifications();

        // Polling every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close popup on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setIsPopupOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            // Get last 10 notifications for the dropdown
            const data = await notificationService.getNotifications(0, 10);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await notificationService.markAsRead(id, true);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        setIsLoading(true);
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        } finally {
            setIsLoading(false);
        }
    };

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
                <div className="relative" ref={popupRef}>
                    <button
                        onClick={() => {
                            setIsPopupOpen(!isPopupOpen);
                            if (!isPopupOpen) fetchNotifications();
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-md border border-white/10 transition-colors hover:bg-white/5 hover:text-white ${isPopupOpen ? 'bg-white/10 text-white' : 'bg-zinc-900/50 text-zinc-400'}`}
                    >
                        <div className="relative">
                            <Bell size={16} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[9px] font-bold text-white shadow-lg shadow-purple-500/20">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                    </button>

                    <AnimatePresence>
                        {isPopupOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
                            >
                                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/5">
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Bell className="h-4 w-4 text-purple-400" />
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            disabled={isLoading}
                                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                                        >
                                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[350px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                            <div className="rounded-full bg-white/5 p-3 mb-3">
                                                <Bell className="h-5 w-5 text-zinc-500" />
                                            </div>
                                            <p className="text-sm font-medium text-white">No notifications yet</p>
                                            <p className="text-xs text-zinc-500 mt-1">You're all caught up!</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/5">
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-4 transition-colors hover:bg-white/5 flex gap-3 ${!notification.is_read ? 'bg-purple-500/5' : ''}`}
                                                >
                                                    <div className="mt-0.5">
                                                        <div className={`rounded-full p-2 ${!notification.is_read ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-400'}`}>
                                                            <MessageSquare className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className={`text-sm font-medium truncate pr-2 ${!notification.is_read ? 'text-white' : 'text-zinc-300'}`}>
                                                                {notification.title}
                                                            </p>
                                                            <span className="text-[10px] text-zinc-500 whitespace-nowrap pt-0.5">
                                                                {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <p className={`text-xs break-words ${!notification.is_read ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                    {!notification.is_read && (
                                                        <div className="flex items-center">
                                                            <button
                                                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                                title="Mark as read"
                                                                className="h-2 w-2 rounded-full bg-purple-500 hover:bg-purple-400 hover:scale-150 transition-all cursor-pointer"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-white/10 p-2 bg-white/5">
                                    <button
                                        onClick={() => setIsPopupOpen(false)}
                                        className="w-full rounded-md py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Theme Toggle (Placeholder) */}
                <button className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white md:hidden">
                    <Sun size={16} />
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;
