import React from 'react';
import { motion } from 'framer-motion';
import { Video, Cast, MoreVertical, Maximize2 } from 'lucide-react';

const CAMERAS = [
    { id: 1, name: 'Lobby Entrance', status: 'LIVE' },
    { id: 2, name: 'Parking Lot B', status: 'LIVE' },
    { id: 3, name: 'Server Room', status: 'LIVE' },
    { id: 4, name: 'Warehouse Access', status: 'OFFLINE' },
];

const LiveCameraGrid = () => {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CAMERAS.map((cam) => (
                <motion.div
                    key={cam.id}
                    whileHover={{ scale: 1.01 }}
                    className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-lg transition-all"
                >
                    {/* Placeholder for Video Stream */}
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
                        <Video size={48} className="text-zinc-700 opacity-50" />
                    </div>

                    {/* Overlay UI */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-90">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
                                <span className={`h-2 w-2 rounded-full ${cam.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
                                <span className="text-xs font-medium text-white">{cam.status}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-sm">
                                    <Maximize2 size={14} />
                                </button>
                                <button className="p-1.5 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-sm">
                                    <MoreVertical size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-medium text-white text-sm">{cam.name}</span>
                            <button className="flex items-center gap-1.5 rounded-md bg-purple-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 backdrop-blur-sm transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                <Cast size={12} />
                                View Stream
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default LiveCameraGrid;
