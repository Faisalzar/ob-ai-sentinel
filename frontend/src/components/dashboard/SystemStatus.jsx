import React from 'react';
import { CheckCircle2, AlertTriangle, Server, Wifi } from 'lucide-react';

const SystemStatus = () => {
    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                            <Server size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">API Server</p>
                            <p className="text-xs text-zinc-500">Uptime: 99.9%</p>
                        </div>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Operational
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                            <Wifi size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Camera Feed</p>
                            <p className="text-xs text-zinc-500">Latency: 24ms</p>
                        </div>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Stable
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-500/10 text-orange-500">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Storage</p>
                            <p className="text-xs text-zinc-500">85% Full</p>
                        </div>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium flex items-center gap-1">
                        Warning
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemStatus;
