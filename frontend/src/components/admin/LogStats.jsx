import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Server, Database, Cpu, HardDrive } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const LogStats = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchHealth = async () => {
        try {
            const data = await adminService.getSystemHealth();
            setHealth(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch health", err);
            setLoading(false);
        }
    };

    if (loading) return null;

    const stats = [
        {
            title: 'System Status',
            value: health?.database === 'healthy' ? 'Operational' : 'Issues Detected',
            icon: Activity,
            color: health?.database === 'healthy' ? 'text-green-500' : 'text-red-500',
            bg: health?.database === 'healthy' ? 'bg-green-500/10' : 'bg-red-500/10',
            border: health?.database === 'healthy' ? 'border-green-500/20' : 'border-red-500/20',
        },
        {
            title: 'CPU Usage',
            value: `${health?.system?.cpu_percent || 0}%`,
            icon: Cpu,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            progress: health?.system?.cpu_percent || 0
        },
        {
            title: 'Memory Usage',
            value: `${health?.system?.memory_percent || 0}%`,
            icon: Server,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            progress: health?.system?.memory_percent || 0
        },
        {
            title: 'Disk Space',
            value: `${(health?.system?.disk_free_gb || 0).toFixed(1)} GB Free`,
            icon: HardDrive,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            progress: health?.system?.disk_percent || 0
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border ${stat.border} ${stat.bg} backdrop-blur-sm relative overflow-hidden`}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{stat.title}</p>
                            <h3 className={`text-2xl font-bold mt-1 ${stat.color} font-mono`}>{stat.value}</h3>
                        </div>
                        <div className={`p-2 rounded-lg bg-black/20 ${stat.color}`}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                    </div>

                    {stat.progress !== undefined && (
                        <div className="w-full bg-black/20 rounded-full h-1.5 mt-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stat.progress}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full rounded-full ${stat.color.replace('text-', 'bg-')}`}
                            />
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};
