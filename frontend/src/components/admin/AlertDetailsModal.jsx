import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, CheckCircle, Clock, Save, AlertTriangle, User, FileText, Calendar } from 'lucide-react';
import API_BASE_URL from '../../services/apiConfig';

export const AlertDetailsModal = ({ alert, onClose, onUpdateStatus, onUpdateNote }) => {
    const [note, setNote] = useState(alert?.admin_notes || '');
    const [isEditingNote, setIsEditingNote] = useState(false);

    if (!alert) return null;

    const getPreviewUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/\\/g, '/');
        return `${API_BASE_URL.replace('/api/v1', '')}/${cleanPath}`;
    };

    const handleSaveNote = () => {
        onUpdateNote(alert.id, note);
        setIsEditingNote(false);
    };

    const getSeverityColor = (level) => {
        const l = level?.toUpperCase();
        if (l === 'DANGEROUS') return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (l === 'CAUTION') return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        if (l === 'HARMLESS') return 'text-green-500 bg-green-500/10 border-green-500/20';
        if (l === 'CRITICAL') return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (l === 'HIGH') return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        if (l === 'MEDIUM') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-6xl h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl flex"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Left: Image Preview */}
                    <div className="flex-1 bg-black flex items-center justify-center relative border-r border-white/10 p-4">
                        <img
                            src={getPreviewUrl(alert.image_path)}
                            alt={alert.object_name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null; // Prevent loop
                                // Try fallback if needed, but alert image path is specific
                                e.target.style.display = 'none';
                            }}
                        />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white font-mono text-xs">
                            {alert.filename}
                        </div>
                    </div>

                    {/* Right: Details & Actions */}
                    <div className="w-96 flex flex-col bg-zinc-900 border-l border-white/10">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <ShieldAlert className="text-red-500 h-5 w-5" />
                                    {alert.object_name}
                                </h3>
                                <p className="text-sm text-zinc-500 mt-1 font-mono">{alert.id}</p>
                            </div>
                            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Threat Level */}
                            <div>
                                <h4 className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Threat Level</h4>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getSeverityColor(alert.threat_level)}`}>
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-bold text-lg">{alert.threat_level}</span>
                                    <span className="opacity-75 text-sm ml-1">{alert.confidence}% Confidence</span>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h4 className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Review Status</h4>
                                <select
                                    value={alert.status || 'new'}
                                    onChange={(e) => onUpdateStatus(alert.id, e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                                >
                                    <option value="new">New</option>
                                    <option value="reviewed">Reviewed</option>
                                    <option value="acknowledged">Acknowledged</option>
                                </select>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Metadata</h4>

                                <div className="flex items-center gap-3 text-zinc-300">
                                    <div className="p-2 rounded bg-white/5"><User className="h-4 w-4" /></div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-zinc-500">User</p>
                                        <p className="text-sm truncate" title={alert.user_email}>{alert.user_email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-zinc-300">
                                    <div className="p-2 rounded bg-white/5"><Calendar className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-xs text-zinc-500">Date Detected</p>
                                        <p className="text-sm">{new Date(alert.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-zinc-300">
                                    <div className="p-2 rounded bg-white/5"><FileText className="h-4 w-4" /></div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-zinc-500">Source File</p>
                                        <p className="text-sm truncate" title={alert.filename}>{alert.filename}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div className="pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Admin Notes</h4>
                                    {!isEditingNote && (
                                        <button
                                            onClick={() => setIsEditingNote(true)}
                                            className="text-xs text-purple-400 hover:text-purple-300"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                {isEditingNote ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="w-full h-32 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
                                            placeholder="Add notes about this incident..."
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setIsEditingNote(false)}
                                                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveNote}
                                                className="px-3 py-1.5 rounded bg-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/30 flex items-center gap-1"
                                            >
                                                <Save className="h-3 w-3" /> Save Note
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsEditingNote(true)}
                                        className="min-h-[80px] rounded-lg border border-dashed border-white/10 bg-white/5 p-3 text-sm text-zinc-400 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all"
                                    >
                                        {note || "No notes added. Click to add..."}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
