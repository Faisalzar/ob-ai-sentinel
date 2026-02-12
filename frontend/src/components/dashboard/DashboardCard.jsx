import React from 'react';

const DashboardCard = ({ stat, index }) => {
    return (
        <div
            className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-500/30"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-zinc-400">
                    {stat.title}
                </p>
                <div className={`p-2 rounded-full ${stat.bgColor} ${stat.color}`}>
                    <stat.icon size={16} />
                </div>
            </div>
            <div className="flex items-baseline space-x-3">
                <div className="text-2xl font-bold text-white">
                    {stat.value}
                </div>
                <div className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 ${stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {stat.change}
                </div>
            </div>
            <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${stat.color.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.random() * 40 + 40}%` }}
                />
            </div>
        </div>
    );
};

export default DashboardCard;
