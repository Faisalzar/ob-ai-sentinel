import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, FileCode, CheckCircle, AlertTriangle, Clock, Film, Image as ImageIcon } from 'lucide-react';
import API_BASE_URL from '../../services/apiConfig';

export const UploadPreviewModal = ({ upload, onClose }) => {
    if (!upload) return null;

    const getPreviewUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/\\/g, '/');
        return `${API_BASE_URL.replace('/api/v1', '')}/${cleanPath}`;
    };

    const getStatusColor = () => {
        if (!upload.is_processed) return 'text-yellow-400 bg-yellow-400/10';
        const summary = upload.detection_summary || {};
        if (summary.dangerous > 0) return 'text-red-400 bg-red-400/10';
        if (summary.caution > 0) return 'text-orange-400 bg-orange-400/10';
        return 'text-green-400 bg-green-400/10';
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-5xl h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl flex"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Left: Preview */}
                    <div className="flex-1 bg-black flex items-center justify-center relative border-r border-white/10 p-4">
                        {upload.file_type === 'image' ? (
                            <img
                                src={getPreviewUrl(upload.annotated_path || upload.file_path)}
                                alt={upload.filename}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = getPreviewUrl(upload.file_path); // Fallback to original if annotated fails
                                }}
                            />
                        ) : (
                            <video
                                controls
                                autoPlay
                                src={getPreviewUrl(upload.annotated_path || upload.file_path)}
                                className="max-h-full max-w-full"
                            />
                        )}
                    </div>

                    {/* Right: Metadata */}
                    <div className="w-80 flex flex-col bg-zinc-900 border-l border-white/10">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white break-all">{upload.filename}</h3>
                                <p className="text-sm text-zinc-500 mt-1">{upload.id}</p>
                            </div>
                            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Status */}
                            <div>
                                <h4 className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Status</h4>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                                    {upload.is_processed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                    <span>{upload.is_processed ? 'Processed' : 'Processing'}</span>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">Type</h4>
                                    <div className="flex items-center gap-2 text-white">
                                        {upload.file_type === 'image' ? <ImageIcon className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                                        <span className="capitalize">{upload.file_type}</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">Date</h4>
                                    <p className="text-white text-sm">{new Date(upload.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Detection Summary */}
                            {upload.detection_summary && (
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Detections</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 rounded bg-red-500/10 border border-red-500/20">
                                            <span className="text-sm text-red-400 font-medium">Dangerous</span>
                                            <span className="text-sm font-bold text-red-500">{upload.detection_summary.dangerous || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded bg-orange-500/10 border border-orange-500/20">
                                            <span className="text-sm text-orange-400 font-medium">Caution</span>
                                            <span className="text-sm font-bold text-orange-500">{upload.detection_summary.caution || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded bg-blue-500/10 border border-blue-500/20">
                                            <span className="text-sm text-blue-400 font-medium">Harmless</span>
                                            <span className="text-sm font-bold text-blue-500">{upload.detection_summary.harmless || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions area could go here */}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-zinc-900/50">
                            <button
                                onClick={onClose}
                                className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
