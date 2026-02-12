import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, User, CheckCircle, XCircle, FileText,
    Settings, Shield, Trash2, LogIn, LogOut, Activity,
    Eye, Code
} from 'lucide-react';


export const LogList = ({ logs, startIndex = 0, selectedIds = [], onSelectRow, onSelectAll }) => {
    const [selectedLog, setSelectedLog] = useState(null);

    const allSelected = logs.length > 0 && logs.every(log => selectedIds.includes(log.id));
    const isPartial = logs.some(log => selectedIds.includes(log.id)) && !allSelected;

    const getActionConfig = (action) => {
        switch (action) {
            case 'login': return { icon: LogIn, color: 'text-green-400', bg: 'bg-green-500/10' };
            case 'logout': return { icon: LogOut, color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
            case 'upload': return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' };
            case 'delete': return { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/10' };
            case 'update_user': return { icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10' };
            case 'update_settings': return { icon: Settings, color: 'text-orange-400', bg: 'bg-orange-500/10' };
            case 'reset_mfa': return { icon: Shield, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
            default: return { icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
        }
    };

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-white/5 text-xs uppercase font-medium text-zinc-300">
                        <tr>
                            <th className="px-6 py-4 w-12">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={el => el && (el.indeterminate = isPartial)}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500/20 cursor-pointer"
                                />
                            </th>
                            <th className="px-2 py-4 w-12">#</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Resource</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence>
                            {logs.map((log, index) => {
                                const actionConfig = getActionConfig(log.action);
                                const ActionIcon = actionConfig.icon;
                                const isSuccess = log.status === 'success';

                                return (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={`group hover:bg-white/5 transition-colors ${selectedIds.includes(log.id) ? 'bg-purple-500/5' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(log.id)}
                                                onChange={() => onSelectRow(log.id)}
                                                className="h-4 w-4 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500/20 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-2 py-4 text-sm text-zinc-500 font-mono text-center">
                                            {(startIndex + index + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-zinc-500" />
                                                <span className="text-zinc-300 font-mono text-xs">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                                                    <span className="text-[10px] font-bold text-white">
                                                        {log.user_email?.charAt(0).toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <span className="text-white text-xs">{log.user_email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/5 ${actionConfig.bg}`}>
                                                <ActionIcon className={`h-3 w-3 ${actionConfig.color}`} />
                                                <span className={`text-xs font-medium ${actionConfig.color}`}>{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                                            {log.resource || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {isSuccess ? (
                                                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                                                )}
                                                <span className={isSuccess ? "text-green-500 text-xs" : "text-red-500 text-xs"}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Log Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Code className="h-5 w-5 text-purple-400" />
                                Log Details
                            </h2>
                            <button onClick={() => setSelectedLog(null)} className="text-zinc-400 hover:text-white">
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500 uppercase">Action</label>
                                    <p className="text-white font-medium">{selectedLog.action}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500 uppercase">Status</label>
                                    <p className={selectedLog.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                                        {selectedLog.status}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500 uppercase">User</label>
                                    <p className="text-white">{selectedLog.user_email}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500 uppercase">IP Address</label>
                                    <p className="text-white font-mono">{selectedLog.ip_address}</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs text-zinc-500 uppercase">Timestamp</label>
                                    <p className="text-white font-mono">{new Date(selectedLog.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-zinc-500 uppercase">Meta Data</label>
                                <div className="bg-black/50 border border-white/10 rounded-lg p-3 font-mono text-xs text-zinc-300 overflow-auto max-h-[200px]">
                                    <pre>{JSON.stringify(selectedLog.meta, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
};
