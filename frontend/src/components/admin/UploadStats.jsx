import React from 'react';
import { motion } from 'framer-motion';
import { FileImage, Film, AlertTriangle, Database } from 'lucide-react';

export const UploadStats = ({ uploads }) => {
    // Calculate stats
    const totalUploads = uploads.length;
    const images = uploads.filter(u => u.file_type === 'image').length;
    const videos = uploads.filter(u => u.file_type === 'video').length;
    const dangerous = uploads.filter(u =>
        u.detection_summary && (u.detection_summary.dangerous > 0 || u.detection_summary.caution > 0)
    ).length;

    // Estimate storage (mock calculation since we don't have real file sizes in this view)
    // Assuming avg image 2MB, video 15MB
    const totalSizeMB = (images * 2) + (videos * 15);
    const storageDisplay = totalSizeMB > 1024
        ? `${(totalSizeMB / 1024).toFixed(1)} GB`
        : `${totalSizeMB} MB`;

    const stats = [
        {
            label: 'Total Assets',
            value: totalUploads,
            icon: Database,
            color: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-500/10',
            text: 'text-blue-400'
        },
        {
            label: 'Images',
            value: images,
            icon: FileImage,
            color: 'from-purple-500 to-purple-600',
            bg: 'bg-purple-500/10',
            text: 'text-purple-400'
        },
        {
            label: 'Videos',
            value: videos,
            icon: Film,
            color: 'from-pink-500 to-pink-600',
            bg: 'bg-pink-500/10',
            text: 'text-pink-400'
        },
        {
            label: 'Threats Detected',
            value: dangerous,
            icon: AlertTriangle,
            color: 'from-red-500 to-red-600',
            bg: 'bg-red-500/10',
            text: 'text-red-400'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
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
