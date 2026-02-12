import React from 'react';
import { BarChart3 } from 'lucide-react';

const DetectionChart = () => {
    // Mock data for the chart
    const data = [40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 25, 100];
    const max = Math.max(...data);

    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">Detection Activity</h3>
                    <p className="text-sm text-zinc-400">Detections over time</p>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <BarChart3 size={20} />
                </div>
            </div>

            {/* Simple CSS Bar Chart */}
            <div className="flex items-end justify-between h-64 gap-2">
                {data.map((value, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                        <div
                            className="w-full bg-purple-500/20 rounded-t-sm relative transition-all duration-300 hover:bg-purple-500/40 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                            style={{ height: `${(value / max) * 100}%` }}
                        >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity">
                                {value}
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-white/10 mt-1"></div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-zinc-500 px-1">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
            </div>
        </div>
    );
};

export default DetectionChart;
