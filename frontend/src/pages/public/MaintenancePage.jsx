
import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, ShieldAlert, Cpu, ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ParticlesBackground from '../../components/reactbits/ParticlesBackground';

const MaintenancePage = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleReturnHome = () => {
        logout();
        navigate('/');
    };

    return (
        <ParticlesBackground color="rgba(168, 85, 247, 0.2)">
            <div className="flex min-h-screen flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative max-w-2xl w-full"
                >
                    {/* Main Card */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-12 text-center backdrop-blur-xl">
                        {/* Background Glow */}
                        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-purple-600/20 blur-[100px]" />
                        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-600/20 blur-[100px]" />

                        {/* Icon */}
                        <div className="relative mb-8 flex justify-center">
                            <div className="relative h-24 w-24">
                                <div className="absolute inset-0 animate-pulse rounded-full bg-purple-500/20 blur-2xl" />
                                <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50">
                                    <Hammer size={48} className="text-purple-500 animate-bounce" />
                                </div>
                            </div>
                        </div>

                        {/* Static Content */}
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
                                <ShieldAlert size={14} />
                                System Maintenance
                            </div>

                            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                                Shielding for <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Optimization</span>
                            </h1>

                            <p className="mx-auto max-w-md text-lg text-zinc-400 leading-relaxed">
                                Ob AI Sentinel is currently undergoing critical security upgrades and performance tuning. We'll be back online in a moment.
                            </p>
                        </div>

                        {/* Action Group */}
                        <div className="mt-12 flex flex-col items-center gap-4 md:flex-row md:justify-center">
                            <button
                                onClick={handleReturnHome}
                                className="group flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-black transition-all hover:bg-zinc-200"
                            >
                                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                                Return to Home
                            </button>

                            <a
                                href="mailto:support@obai.com"
                                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10"
                            >
                                <Mail size={18} />
                                Contact Security
                            </a>
                        </div>

                        {/* Footer Stats */}
                        <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/5 pt-8">
                            <div>
                                <div className="text-sm font-bold text-white">99.9%</div>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Uptime</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">TLS 1.3</div>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Security</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">ACTIVE</div>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Monitoring</div>
                            </div>
                        </div>
                    </div>

                    {/* Branding */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500">
                        <Cpu size={18} />
                        <span className="text-sm font-medium tracking-wide">Ob AI Sentinel Framework v2.0</span>
                    </div>
                </motion.div>
            </div>
        </ParticlesBackground>
    );
};

export default MaintenancePage;
