import React from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    ShieldCheck,
    Cpu,
    Activity,
    Database,
    Globe,
    Lock,
    HardDrive
} from 'lucide-react';

export const SettingsSidebar = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'general', label: 'General', icon: Settings, description: 'System-wide preferences' },
        { id: 'ai', label: 'AI Detection', icon: Cpu, description: 'Engine & Model accuracy' },
        { id: 'security', label: 'Security', icon: ShieldCheck, description: 'MFA & Authentication' },
        { id: 'health', label: 'System Health', icon: Activity, description: 'Resource monitoring' }
    ];

    return (
        <div className="flex flex-col gap-2 w-full md:w-64 lg:w-72">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="group relative flex items-start gap-3 p-4 rounded-xl transition-all duration-300 text-left outline-none"
                    >
                        {/* Background Highlight */}
                        {isActive && (
                            <motion.div
                                layoutId="active-tab-bg"
                                className="absolute inset-0 bg-purple-500/10 border border-purple-500/20 rounded-xl"
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}

                        <div className={`relative p-2 rounded-lg transition-colors duration-300 ${isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-300'
                            }`}>
                            <Icon size={20} />
                        </div>

                        <div className="relative flex-1">
                            <span className={`block font-semibold transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                                }`}>
                                {tab.label}
                            </span>
                            <span className={`block text-xs transition-colors duration-300 ${isActive ? 'text-purple-400/80' : 'text-zinc-600 group-hover:text-zinc-500'
                                }`}>
                                {tab.description}
                            </span>
                        </div>

                        {/* Active Indicator Bar */}
                        {isActive && (
                            <motion.div
                                layoutId="active-tab-bar"
                                className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-purple-500 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
