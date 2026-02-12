import React from 'react';
import { MoreVertical, ShieldAlert, Film, Video, Eye } from 'lucide-react';

const RecentDetectionsTable = () => {
    const detections = [
        {
            id: "DET-001",
            camera: "Lobby Camera 01",
            type: "Gun Detected",
            confidence: "98%",
            status: "High Risk",
            time: "2 mins ago",
            icon: ShieldAlert,
            color: "text-red-500"
        },
        {
            id: "DET-002",
            camera: "Parking Lot B",
            type: "Person",
            confidence: "92%",
            status: "Verified",
            time: "15 mins ago",
            icon: Video,
            color: "text-blue-500"
        },
        {
            id: "DET-003",
            camera: "Main Entrance",
            type: "Suspicious Activity",
            confidence: "85%",
            status: "Review Needed",
            time: "1 hour ago",
            icon: Eye,
            color: "text-orange-500"
        },
        {
            id: "DET-004",
            camera: "Corridor A",
            type: "Movement",
            confidence: "78%",
            status: "Logged",
            time: "2 hours ago",
            icon: Film,
            color: "text-zinc-500"
        }
    ];

    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Recent Detections</h3>
                    <p className="text-sm text-zinc-400">Latest security events captured</p>
                </div>
                <button className="text-sm text-purple-400 hover:text-purple-300">View All</button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">Event ID</th>
                            <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">Camera</th>
                            <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</th>
                            <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                            <th className="text-right py-3 px-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {detections.map((item) => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 text-sm font-medium text-white whitespace-nowrap">
                                    {item.id}
                                </td>
                                <td className="py-4 px-6 text-sm text-zinc-400 whitespace-nowrap">
                                    {item.camera}
                                </td>
                                <td className="py-4 px-6 text-sm whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <item.icon size={16} className={item.color} />
                                        <span className="text-zinc-300">{item.type}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-sm whitespace-nowrap">
                                    <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.status === 'High Risk' ? 'bg-red-500/10 text-red-500' :
                                            item.status === 'Verified' ? 'bg-blue-500/10 text-blue-500' :
                                                item.status === 'Review Needed' ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-zinc-500/10 text-zinc-500'}
                  `}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-zinc-500 text-right whitespace-nowrap">
                                    {item.time}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentDetectionsTable;
