import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Loader2, MessageSquare, ArrowLeft, Image as ImageIcon, Film } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../services/apiConfig';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications(0, 100);
            setNotifications(data);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await notificationService.markAsRead(id, true);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        if (notifications.every(n => n.is_read)) return;
        setMarkingAll(true);
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        } finally {
            setMarkingAll(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="page min-h-screen bg-black">
            <header className="sentinel-topbar px-8 py-6 border-b border-white/10 backdrop-blur-md bg-black/50 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Bell className="h-6 w-6 text-purple-400" />
                            Your Notifications
                        </h1>
                        <p className="text-zinc-400 text-sm mt-1">Messages and updates from the administration team</p>
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="text-sm text-zinc-400">
                        {unreadCount > 0 ? (
                            <span className="text-purple-400 font-medium">You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}.</span>
                        ) : (
                            <span>All caught up.</span>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={markingAll}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-500" />
                            <p>Loading your notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="rounded-full bg-white/5 p-4 mb-4">
                                <Bell className="h-8 w-8 text-zinc-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white">No notifications</h3>
                            <p className="text-sm text-zinc-400 mt-2">You don't have any messages from the admin team yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            <AnimatePresence>
                                {notifications.map(notification => (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                        className={`p-6 transition-all duration-300 cursor-pointer ${!notification.is_read
                                                ? 'bg-purple-500/5 hover:bg-purple-500/10'
                                                : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className={`p-3 rounded-full ${!notification.is_read
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : 'bg-white/5 text-zinc-500'
                                                    }`}>
                                                    <MessageSquare className="h-5 w-5" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                    <h3 className={`text-base font-semibold ${!notification.is_read ? 'text-white' : 'text-zinc-300'
                                                        }`}>
                                                        {notification.title}
                                                    </h3>
                                                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </span>
                                                </div>

                                                <p className={`text-sm mb-4 leading-relaxed ${!notification.is_read ? 'text-zinc-300' : 'text-zinc-500'
                                                    }`}>
                                                    {notification.message}
                                                </p>

                                                {/* If there's a related file, we could fetch its thumbnail, or just show a badge */}
                                                {notification.related_upload_id && (
                                                    <div className="flex items-center gap-2 p-3 rounded-lg border border-white/5 bg-black/40 w-fit">
                                                        <span className="text-xs text-zinc-400">Relates to file ID:</span>
                                                        <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                                            ...{notification.related_upload_id.substring(notification.related_upload_id.length - 8)}
                                                        </span>
                                                        <button
                                                            className="ml-2 text-xs text-zinc-400 hover:text-white underline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/dashboard/history`); // Send them to history to find it
                                                            }}
                                                        >
                                                            View in History
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-shrink-0 flex items-start pt-2">
                                                {!notification.is_read ? (
                                                    <button
                                                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                        className="h-3 w-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 hover:scale-125 transition-transform"
                                                        title="Mark as read"
                                                    />
                                                ) : (
                                                    <span className="h-3 w-3 flex items-center justify-center">
                                                        <CheckCheck className="h-4 w-4 text-zinc-600" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default NotificationsPage;
