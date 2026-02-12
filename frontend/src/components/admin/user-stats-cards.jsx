import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Activity } from 'lucide-react';

export const UserStatsCards = ({ stats }) => {
    const cards = [
        {
            title: 'Total Users',
            value: stats?.total_users || 0,
            icon: Users,
            color: 'from-purple-500/20 to-purple-600/20',
            iconColor: 'text-purple-400',
            borderColor: 'border-purple-500/30',
            trend: stats?.user_growth || '+12%',
            trendUp: true
        },
        {
            title: 'Active Users',
            value: stats?.active_users || 0,
            icon: UserCheck,
            color: 'from-green-500/20 to-green-600/20',
            iconColor: 'text-green-400',
            borderColor: 'border-green-500/30',
            percentage: stats?.total_users ? Math.round((stats.active_users / stats.total_users) * 100) : 0
        },
        {
            title: 'Suspended',
            value: stats?.suspended_users || 0,
            icon: UserX,
            color: 'from-red-500/20 to-red-600/20',
            iconColor: 'text-red-400',
            borderColor: 'border-red-500/30',
            percentage: stats?.total_users ? Math.round((stats.suspended_users / stats.total_users) * 100) : 0
        },
        {
            title: 'Online Now',
            value: stats?.online_users || 0,
            icon: Activity,
            color: 'from-blue-500/20 to-blue-600/20',
            iconColor: 'text-blue-400',
            borderColor: 'border-blue-500/30',
            live: true
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-gradient-to-br ${card.color} backdrop-blur-md p-6`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-400 mb-1">{card.title}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-white">{card.value}</h3>
                                {card.percentage !== undefined && (
                                    <span className="text-xs text-zinc-500">({card.percentage}%)</span>
                                )}
                            </div>
                            {card.trend && (
                                <p className={`text-xs mt-2 ${card.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                                    {card.trend} from last month
                                </p>
                            )}
                            {card.live && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-xs text-green-400">Live</span>
                                </div>
                            )}
                        </div>
                        <div className={`p-3 rounded-lg bg-white/5 ${card.iconColor}`}>
                            <card.icon className="h-6 w-6" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
