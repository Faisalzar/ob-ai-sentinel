import React from 'react';
import { Plus, Download, Share2, Settings } from 'lucide-react';

const QuickActions = ({ onAddUser, onExport }) => {
    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={onAddUser}
                    className="flex flex-col items-center justify-center p-4 rounded-lg bg-zinc-800/50 hover:bg-purple-500/20 hover:text-purple-400 text-zinc-400 transition-all border border-transparent hover:border-purple-500/30"
                >
                    <div className="p-2 bg-zinc-800 rounded-full mb-2">
                        <Plus size={20} />
                    </div>
                    <span className="text-sm font-medium">Add User</span>
                </button>

                <button
                    onClick={onExport}
                    className="flex flex-col items-center justify-center p-4 rounded-lg bg-zinc-800/50 hover:bg-blue-500/20 hover:text-blue-400 text-zinc-400 transition-all border border-transparent hover:border-blue-500/30"
                >
                    <div className="p-2 bg-zinc-800 rounded-full mb-2">
                        <Download size={20} />
                    </div>
                    <span className="text-sm font-medium">Export</span>
                </button>

                <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-zinc-800/50 hover:bg-green-500/20 hover:text-green-400 text-zinc-400 transition-all border border-transparent hover:border-green-500/30">
                    <div className="p-2 bg-zinc-800 rounded-full mb-2">
                        <Share2 size={20} />
                    </div>
                    <span className="text-sm font-medium">Share</span>
                </button>

                <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-zinc-800/50 hover:bg-orange-500/20 hover:text-orange-400 text-zinc-400 transition-all border border-transparent hover:border-orange-500/30">
                    <div className="p-2 bg-zinc-800 rounded-full mb-2">
                        <Settings size={20} />
                    </div>
                    <span className="text-sm font-medium">Config</span>
                </button>
            </div>
        </div>
    );
};

export default QuickActions;
