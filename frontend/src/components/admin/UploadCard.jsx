import React from 'react';
import { motion } from 'framer-motion';
import { FileImage, Film, AlertTriangle, Eye, RefreshCw, Trash2, CheckCircle, Clock } from 'lucide-react';
import API_BASE_URL from '../../services/apiConfig';

export const UploadCard = ({ upload, isSelected, onSelect, onView, onReprocess, onDelete }) => {

    // Helper to get full URL
    const getPreviewUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/\\/g, '/');
        return `${API_BASE_URL.replace('/api/v1', '')}/${cleanPath}`;
    };

    // Determine status color and icon
    const getStatusConfig = () => {
        if (!upload.is_processed) return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock, label: 'Processing' };

        const summary = upload.detection_summary || {};
        if (summary.dangerous > 0) return { color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertTriangle, label: 'Dangerous' };
        if (summary.caution > 0) return { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: AlertTriangle, label: 'Caution' };

        return { color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle, label: 'Safe' };
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${isSelected
                ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/50'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
        >
            {/* Selection Checkbox */}
            <div className="absolute left-3 top-3 z-20">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onSelect(upload.id);
                    }}
                    className="h-4 w-4 rounded border-white/30 bg-black/50 text-purple-500 focus:ring-purple-500/50"
                />
            </div>

            {/* Status Badge */}
            <div className={`absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-md ${statusConfig.bg} ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3" />
                <span>{statusConfig.label}</span>
            </div>

            {/* Preview/Thumbnail */}
            <div
                className="aspect-video w-full overflow-hidden bg-black/50 cursor-pointer"
                onClick={() => onView(upload)}
            >
                {upload.file_type === 'image' ? (
                    <img
                        src={getPreviewUrl(upload.annotated_path || upload.file_path)}
                        alt={upload.filename}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getPreviewUrl(upload.file_path);
                        }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-12 w-12 text-zinc-600" />
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(upload); }}
                        className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 hover:scale-110 transition-all"
                        title="View Details"
                    >
                        <Eye className="h-5 w-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onReprocess(upload.id); }}
                        className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 hover:scale-110 transition-all"
                        title="Reprocess"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(upload.id); }}
                        className="rounded-full bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30 hover:scale-110 transition-all"
                        title="Delete"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content info */}
            <div className="p-4">
                <h4 className="truncate text-sm font-medium text-white" title={upload.filename}>
                    {upload.filename}
                </h4>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                    <span>{upload.file_type.toUpperCase()}</span>
                </div>
            </div>
        </motion.div>
    );
};
