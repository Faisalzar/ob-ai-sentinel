import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const SendMessageModal = ({ isOpen, onClose, upload }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen || !upload) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim() || !message.trim()) {
            setError('Please provide both a subject and message.');
            return;
        }

        if (!upload.user_id) {
            console.error('Missing user_id in upload object:', upload);
            setError('System Error: User information is missing for this file. Please refresh the page and try again.');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('SENDING MESSAGE. Upload user_id:', upload.user_id, 'Upload ID:', upload.id, 'Title:', title, 'Message:', message);
            await adminService.sendNotification({
                user_id: upload.user_id,
                title: title.trim(),
                message: message.trim(),
                related_upload_id: upload.id
            });

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setTitle('');
                setMessage('');
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to send message.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                                <MessageSquare className="h-5 w-5 text-purple-400" />
                                Message User
                            </h2>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="rounded text-zinc-400 transition-colors hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {success ? (
                                <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
                                    <div className="rounded-full bg-green-500/20 p-3 text-green-400">
                                        <Send className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white">Message Sent!</h3>
                                    <p className="text-sm text-zinc-400">The user has been notified.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 mb-4 flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 rounded text-purple-400">
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-zinc-400">Regarding file:</p>
                                            <p className="text-sm font-medium text-white truncate">{upload.filename}</p>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                            Subject <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Warning: Inappropriate Content"
                                            className="w-full rounded-md border border-white/10 bg-black/50 px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            maxLength={100}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                            Message <span className="text-red-400">*</span>
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Type your message to the user here..."
                                            rows={4}
                                            className="w-full resize-none rounded-md border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            maxLength={1000}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    Send Message
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
