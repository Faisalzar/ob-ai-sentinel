import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, ShieldAlert, Video } from 'lucide-react';

const SystemOverview = ({ stats }) => {
    const cards = [
        {
            title: "Live Cameras",
            value: stats?.active_cameras || 0,
            icon: Video,
            color: "text-green-500",
            status: "Online",
            statusColor: "bg-green-500"
        },
        {
            title: "Threats Detected",
            value: stats?.dangerous_alerts || 0,
            icon: ShieldAlert,
            color: "text-red-500",
            status: "Critical",
            statusColor: "bg-red-500"
        },
        {
            title: "Models Running",
            value: "YOLOv8", // Placeholder or from prop
            icon: Activity,
            color: "text-purple-500",
            status: "Active",
            statusColor: "bg-purple-500"
        },
        {
            title: "System Health",
            value: "98%",
            icon: Cpu,
            color: "text-blue-500",
            status: "Optimal",
            statusColor: "bg-blue-500"
        }
    ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <motion.div
                    key={index}
                    whileHover={{ y: -5 }}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all hover:border-purple-500/30 hover:bg-white/10"
                >
                    <div className={`absolute top-0 right-0 p-3 opacity-20 ${card.color}`}>
                        <card.icon size={64} />
                    </div>
                    <div className="flex items-start justify-between">
                        <div className={`rounded-lg bg-white/5 p-2 ${card.color}`}>
                            <card.icon size={24} />
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs">
                            <span className={`h-1.5 w-1.5 rounded-full ${card.statusColor} animate-pulse`} />
                            <span className="text-zinc-400">{card.status}</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-white">{card.value}</h3>
                        <p className="text-sm text-zinc-400">{card.title}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default SystemOverview;
