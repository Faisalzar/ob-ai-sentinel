import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, MessageSquare, AlertTriangle, CheckCircle, Clock, XCircle, ShieldAlert } from 'lucide-react';
import API_BASE_URL from '../../services/apiConfig';

export const AlertList = ({ alerts, onStatusChange, onAddNote, onView, startIndex = 0 }) => {

    const getPreviewUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/\\/g, '/');
        return `${API_BASE_URL.replace('/api/v1', '')}/${cleanPath}`;
    };

    const getSeverityConfig = (level) => {
        const l = level?.toUpperCase();
        if (l === 'DANGEROUS') return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
        if (l === 'CAUTION') return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
        if (l === 'HARMLESS') return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' };
        if (l === 'CRITICAL') return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
        if (l === 'HIGH') return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
        if (l === 'MEDIUM') return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
        return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'new': return { icon: Clock, color: 'text-red-400', label: 'New' };
            case 'reviewed': return { icon: Eye, color: 'text-yellow-400', label: 'Reviewed' };
            case 'acknowledged': return { icon: CheckCircle, color: 'text-green-400', label: 'Acknowledged' };
            case 'resolved': return { icon: CheckCircle, color: 'text-green-400', label: 'Resolved' };
            default: return { icon: Clock, color: 'text-zinc-400', label: status };
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-white/5 text-xs uppercase font-medium text-zinc-300">
                    <tr>
                        <th className="px-6 py-4 w-16">#</th>
                        <th className="px-6 py-4">Threat</th>
                        <th className="px-6 py-4">Object</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    <AnimatePresence>
                        {alerts.map((alert, index) => {
                            const severity = getSeverityConfig(alert.threat_level);
                            const StatusIcon = getStatusConfig(alert.status).icon;

                            return (
                                <motion.tr
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group hover:bg-white/5 transition-colors"
                                >
                                    <td className="px-6 py-4 text-sm text-zinc-500 font-mono">
                                        {(startIndex + index + 1).toString().padStart(2, '0')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium ${severity.bg} ${severity.color} ${severity.border}`}>
                                            <ShieldAlert className="h-3 w-3" />
                                            <span>{alert.threat_level}</span>
                                            <span className="opacity-75">({alert.confidence}%)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-10 w-16 overflow-hidden rounded bg-black/50 cursor-pointer hover:ring-2 ring-red-500/50 transition-all"
                                                onClick={() => onView(alert)}
                                            >
                                                {alert.image_path && (
                                                    <img
                                                        src={getPreviewUrl(alert.image_path)}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                )}
                                            </div>
                                            <span className="font-medium text-white">{alert.object_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-200">{alert.user_email}</span>
                                            <span className="text-xs text-zinc-500">{new Date(alert.timestamp).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-zinc-500 font-mono truncate max-w-[150px]" title={alert.filename}>
                                                {alert.filename}
                                            </span>
                                            {alert.admin_notes && (
                                                <div className="flex items-center gap-1 text-xs text-yellow-500/80 mt-1">
                                                    <MessageSquare className="h-3 w-3" />
                                                    <span className="truncate max-w-[150px]">{alert.admin_notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={alert.status || 'new'}
                                            onChange={(e) => onStatusChange(alert.id, e.target.value)}
                                            className="rounded border border-white/10 bg-black/50 px-2 py-1 text-xs text-white focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="new">New</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="acknowledged">Acknowledged</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onView(alert)}
                                                className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onAddNote(alert)}
                                                className={`p-1.5 hover:bg-white/10 rounded transition-colors ${alert.admin_notes ? 'text-yellow-400' : 'text-zinc-400 hover:text-white'}`}
                                                title="Add/Edit Note"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
};
