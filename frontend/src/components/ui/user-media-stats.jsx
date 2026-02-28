import React from 'react';
import { motion } from 'framer-motion';
import { Image, Video, Radio, Activity } from 'lucide-react';

const UserMediaStats = ({ stats }) => {
    // Fallbacks if stats not fully loaded
    const safeStats = stats || {};

    const MEDIA_CARDS = [
        {
            id: 1,
            label: 'Images Scanned',
            count: safeStats.image_count || 0,
            icon: Image,
            color: 'from-blue-600/20 to-blue-900/20',
            iconColor: 'text-blue-400'
        },
        {
            id: 2,
            label: 'Videos Analyzed',
            count: safeStats.video_count || 0,
            icon: Video,
            color: 'from-purple-600/20 to-purple-900/20',
            iconColor: 'text-purple-400'
        },
        {
            id: 3,
            label: 'Live Streams',
            count: safeStats.live_count || 0,
            icon: Radio,
            color: 'from-emerald-600/20 to-emerald-900/20',
            iconColor: 'text-emerald-400'
        },
        {
            id: 4,
            label: 'Total AI Detections',
            count: safeStats.total_detections || 0,
            icon: Activity,
            color: 'from-red-600/20 to-rose-900/20',
            iconColor: 'text-rose-400'
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {MEDIA_CARDS.map((card, index) => {
                const Icon = card.icon;
                return (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${card.color} p-6 shadow-lg backdrop-blur-md`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-400 mb-1">{card.label}</p>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {card.count.toLocaleString()}
                                </h3>
                            </div>
                            <div className={`p-4 rounded-full bg-black/40 ${card.iconColor} shadow-inner`}>
                                <Icon size={28} />
                            </div>
                        </div>

                        {/* Decorative background circle */}
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
                    </motion.div>
                );
            })}
        </div>
    );
};

export default UserMediaStats;
