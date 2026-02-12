import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, CheckCircle, Flame } from 'lucide-react';

export const AlertStats = ({ stats, alerts }) => {
    // Derived stats from alerts list (for status breakdown)
    // Note: This only counts loaded alerts (potentially paginated), 
    // but useful for immediate context if we assume we loaded recent ones.
    const unresolvedCount = alerts.filter(a => a.status === 'new').length;

    const statItems = [
        {
            label: 'Total Threats',
            value: stats?.total_alerts || 0,
            icon: ShieldAlert,
            color: 'from-red-500 to-red-600',
            bg: 'bg-red-500/10',
            text: 'text-red-400'
        },
        {
            label: 'Recent (24h)',
            value: stats?.recent_alerts || 0,
            icon: Clock,
            color: 'from-orange-500 to-orange-600',
            bg: 'bg-orange-500/10',
            text: 'text-orange-400'
        },
        {
            label: 'Active/New',
            value: unresolvedCount,
            icon: Flame,
            color: 'from-yellow-500 to-yellow-600',
            bg: 'bg-yellow-500/10',
            text: 'text-yellow-400'
        },
        {
            label: 'Resolved',
            value: (stats?.total_alerts || 0) - unresolvedCount, // Approximation
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            bg: 'bg-green-500/10',
            text: 'text-green-400'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statItems.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                            <h3 className="mt-2 text-2xl font-bold text-white">{stat.value}</h3>
                        </div>
                        <div className={`rounded-lg p-3 ${stat.bg} ${stat.text}`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
