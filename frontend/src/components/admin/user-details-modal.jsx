import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Activity, Shield, Monitor, Mail, Calendar, Clock, MapPin, Smartphone } from 'lucide-react';

export const UserDetailsModal = ({ user, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!user) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'sessions', label: 'Sessions', icon: Monitor }
    ];

    const mockActivity = [
        { id: 1, action: 'Logged in', timestamp: '2 hours ago', icon: User, color: 'text-green-400' },
        { id: 2, action: 'Uploaded detection image', timestamp: '5 hours ago', icon: Activity, color: 'text-blue-400' },
        { id: 3, action: 'Changed password', timestamp: '1 day ago', icon: Shield, color: 'text-purple-400' },
        { id: 4, action: 'Enabled MFA', timestamp: '2 days ago', icon: Shield, color: 'text-green-400' },
    ];

    const mockSessions = [
        { id: 1, device: 'Chrome on Windows', ip: '192.168.1.1', location: 'New York, US', lastActive: '5 mins ago', current: true },
        { id: 2, device: 'Safari on iPhone', ip: '192.168.1.2', location: 'New York, US', lastActive: '2 hours ago', current: false },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                                <span className="text-2xl font-bold text-purple-400">
                                    {user.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                                <p className="text-sm text-zinc-400">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-white/10 px-6">
                        <div className="flex gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? 'text-purple-400'
                                            : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoCard icon={User} label="Role" value={user.role} />
                                    <InfoCard
                                        icon={Activity}
                                        label="Status"
                                        value={user.is_active ? 'Active' : 'Suspended'}
                                        valueColor={user.is_active ? 'text-green-400' : 'text-red-400'}
                                    />
                                    <InfoCard icon={Shield} label="MFA Status" value={user.mfa_state || 'DISABLED'} />
                                    <InfoCard
                                        icon={Mail}
                                        label="Email Verified"
                                        value={user.is_verified ? 'Yes' : 'No'}
                                        valueColor={user.is_verified ? 'text-green-400' : 'text-orange-400'}
                                    />
                                    <InfoCard
                                        icon={Calendar}
                                        label="Registered"
                                        value={user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                    />
                                    <InfoCard
                                        icon={Clock}
                                        label="Last Login"
                                        value={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                                <div className="space-y-3">
                                    {mockActivity.map((item) => (
                                        <div key={item.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
                                            <div className={`rounded-lg bg-white/10 p-2 ${item.color}`}>
                                                <item.icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">{item.action}</p>
                                                <p className="text-xs text-zinc-500">{item.timestamp}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <SecurityCard
                                        title="Multi-Factor Authentication"
                                        status={user.mfa_state === 'ENABLED' ? 'Enabled' : 'Disabled'}
                                        statusColor={user.mfa_state === 'ENABLED' ? 'text-green-400' : 'text-orange-400'}
                                        description={user.mfa_state === 'ENABLED' ? 'Account is protected with 2FA' : 'MFA is not enabled'}
                                    />
                                    <SecurityCard
                                        title="Password"
                                        status="Last changed 30 days ago"
                                        statusColor="text-zinc-400"
                                        description="Strong password policy enforced"
                                    />
                                    <SecurityCard
                                        title="Failed Login Attempts"
                                        status="0 in last 24 hours"
                                        statusColor="text-green-400"
                                        description="No suspicious activity detected"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'sessions' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
                                <div className="space-y-3">
                                    {mockSessions.map((session) => (
                                        <div key={session.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-lg bg-white/10 p-2 text-blue-400">
                                                        {session.device.includes('iPhone') ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white flex items-center gap-2">
                                                            {session.device}
                                                            {session.current && (
                                                                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Current</span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 mt-1">
                                                            <MapPin className="inline h-3 w-3 mr-1" />
                                                            {session.location} • {session.ip}
                                                        </p>
                                                        <p className="text-xs text-zinc-500">Last active: {session.lastActive}</p>
                                                    </div>
                                                </div>
                                                {!session.current && (
                                                    <button className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20">
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const InfoCard = ({ icon: Icon, label, value, valueColor = 'text-white' }) => (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-400">{label}</p>
        </div>
        <p className={`text-sm font-semibold ${valueColor}`}>{value}</p>
    </div>
);

const SecurityCard = ({ title, status, statusColor, description }) => (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
        </div>
        <p className="text-xs text-zinc-500">{description}</p>
    </div>
);
