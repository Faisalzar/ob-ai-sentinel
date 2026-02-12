import React, { useEffect, useState, useRef } from 'react';

const LOG_ENTRIES = [
    { text: "Stream source: CAM-02 (Secure Zone)", type: "info" },
    { text: "Object detected: WEAPON (0.91) - Status: ARMED", type: "danger" },
    { text: "ALERT: Threat detected. Logging incident #4092", type: "danger" },
    { text: "Notifying admin console...", type: "system" },
    { text: "Snapshot saved to secure storage.", type: "success" },
    { text: "System initialization sequence started...", type: "system" },
    { text: "Connecting to Roboflow Inference Server...", type: "system" },
];

export default function TerminalFeed() {
    // Start with empty logs
    const [logs, setLogs] = useState([]);
    const scrollRef = useRef(null);
    const indexRef = useRef(0);

    // Single robust effect to manage the feed
    useEffect(() => {
        // Initial populate to have something on screen immediately? 
        // Or let it type out? Let's let it type out for effect.

        const interval = setInterval(() => {
            setLogs((prevLogs) => {
                // Get the next log
                const nextLog = LOG_ENTRIES[indexRef.current];

                // Increment index, loop back to start if at end
                indexRef.current = (indexRef.current + 1) % LOG_ENTRIES.length;

                // Add new log to array
                const newLogs = [...prevLogs, nextLog];

                // Constant buffer size to prevent memory issues and keep feed clean
                if (newLogs.length > 7) {
                    newLogs.shift();
                }

                return newLogs;
            });
        }, 1500); // 1.5s delay between logs

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll effect
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const getColor = (type) => {
        switch (type) {
            case 'success': return '#4ade80'; // Green
            case 'warning': return '#facc15'; // Yellow
            case 'danger': return '#ef4444'; // Red (stronger)
            case 'system': return '#60a5fa'; // Blue
            case 'info': return '#9ca3af'; // Gray/Neutral
            default: return '#9ca3af';
        }
    };

    return (
        <div className="rb-relative rb-w-full rb-bg-transparent rb-overflow-hidden rb-p-0" style={{ fontFamily: 'monospace' }}>
            {/* Logs */}
            <div ref={scrollRef} className="rb-h-32 rb-overflow-hidden rb-relative">
                {/* Top/Bottom Fade for smooth scroll effect */}
                <div className="rb-absolute rb-inset-0 rb-z-10 rb-pointer-events-none"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(10,10,16,1) 0%, rgba(10,10,16,0) 15%, rgba(10,10,16,0) 85%, rgba(10,10,16,1) 100%)'
                    }}>
                </div>

                {logs.map((log, i) => {
                    // Safety check against undefined logs
                    if (!log) return null;

                    return (
                        <div key={i} className="rb-mb-1.5 rb-text-xs rb-tracking-wide rb-flex rb-items-start" style={{ color: getColor(log.type) }}>
                            <span className="rb-opacity-40 rb-mr-3 rb-shrink-0">
                                [{new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }).toLowerCase()}]
                            </span>
                            <span>{log.text}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
