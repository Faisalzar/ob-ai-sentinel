import React, { useEffect, useRef, useState } from 'react';
import { Terminal, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

const MOCK_LOGS = [
    { id: 1, type: 'info', message: 'System initialized successfully', timestamp: '10:00:01' },
    { id: 2, type: 'success', message: 'Connected to Camera Stream #1', timestamp: '10:00:05' },
    { id: 3, type: 'success', message: 'Connected to Camera Stream #2', timestamp: '10:00:06' },
    { id: 4, type: 'warning', message: 'Motion detected in Zone B', timestamp: '10:15:22' },
    { id: 5, type: 'danger', message: 'THREAT DETECTED: Handgun (98% Conf)', timestamp: '10:15:24' },
    { id: 6, type: 'info', message: 'Processing alert dispatch...', timestamp: '10:15:25' },
    { id: 7, type: 'success', message: 'Alert sent to Admin Channel', timestamp: '10:15:26' },
];

const LiveThreatLog = () => {
    const [logs, setLogs] = useState(MOCK_LOGS);
    const scrollRef = useRef(null);

    // Simulate incoming logs
    useEffect(() => {
        const interval = setInterval(() => {
            const newLog = {
                id: Date.now(),
                type: Math.random() > 0.8 ? 'warning' : 'info',
                message: `System check: ${Math.random() > 0.5 ? 'Optimal' : 'Scanning...'}`,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            };
            setLogs(prev => [...prev.slice(-19), newLog]); // Keep last 20
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const getLogStyle = (type) => {
        switch (type) {
            case 'danger': return 'text-red-500';
            case 'warning': return 'text-orange-400';
            case 'success': return 'text-green-400';
            default: return 'text-blue-400';
        }
    };

    return (
        <div className="flex h-[300px] flex-col overflow-hidden rounded-xl border border-white/10 bg-black/80 font-mono text-sm backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 p-3">
                <Terminal size={16} className="text-purple-500" />
                <span className="font-semibold text-zinc-300">Live Threat Intelligence Feed</span>
                <div className="ml-auto flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/20" />
                </div>
            </div>

            <div ref={scrollRef} className="scrollbar-hide flex-1 overflow-y-auto p-4 space-y-1.5">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="shrink-0 text-zinc-500">[{log.timestamp}]</span>
                        <span className={getLogStyle(log.type)}>
                            {log.type === 'danger' && 'CRITICAL: '}
                            {log.type === 'warning' && 'WARN: '}
                            {log.type === 'success' && 'OK: '}
                            {log.type === 'info' && 'INFO: '}
                        </span>
                        <span className="text-zinc-300">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveThreatLog;
