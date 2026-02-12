import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Cpu, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';

export const SettingsHealth = ({ health }) => {
    if (!health) return null;

    const services = [
        {
            label: 'Database',
            status: health.database,
            icon: Database,
            isHealthy: health.database === 'healthy',
            details: 'PostgreSQL instance connection'
        },
        {
            label: 'AI Inference Engine',
            status: health.ai_model,
            icon: Cpu,
            isHealthy: health.ai_model === 'loaded',
            details: 'YOLOv8 Model availability'
        }
    ];

    const metrics = [
        { label: 'CPU Usage', value: health.system.cpu_percent, unit: '%', icon: Activity, color: 'text-blue-400' },
        { label: 'Memory', value: health.system.memory_percent, unit: '%', icon: HardDrive, color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-6">
            {/* Services Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm group hover:border-white/10 transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg bg-black/40 ${service.isHealthy ? 'text-green-400' : 'text-yellow-400'}`}>
                                <service.icon size={20} />
                            </div>
                            {service.isHealthy ? (
                                <CheckCircle2 size={16} className="text-green-500" />
                            ) : (
                                <AlertCircle size={16} className="text-yellow-500" />
                            )}
                        </div>
                        <h3 className="text-white font-medium">{service.label}</h3>
                        <p className="text-xs text-zinc-500 mb-2 truncate">{service.details}</p>
                        <div className={`text-xs font-mono px-2 py-0.5 rounded-full inline-block ${service.isHealthy ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                            }`}>
                            {service.status.toUpperCase()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Metric Bars */}
            <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Resource Allocation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {metrics.map((metric, idx) => (
                        <div key={idx} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <metric.icon size={16} className={metric.color} />
                                    <span className="text-sm text-zinc-400 font-medium">{metric.label}</span>
                                </div>
                                <span className="text-sm text-white font-mono font-bold">{metric.value}{metric.unit}</span>
                            </div>
                            <div className="relative h-2 bg-black/40 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metric.value}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`absolute top-0 left-0 h-full rounded-full ${metric.value > 85 ? 'bg-red-500' : metric.value > 60 ? 'bg-yellow-500' : 'bg-purple-500'
                                        }`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* System info */}
            <div className="p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-3 text-zinc-500">
                    <Activity size={14} />
                    <span className="text-xs">Uptime monitor active since last kernel deployment.</span>
                </div>
            </div>
        </div>
    );
};
