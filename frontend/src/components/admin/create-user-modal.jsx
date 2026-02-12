import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Shield, UserPlus, ChevronDown, Check } from 'lucide-react';

export const CreateUserModal = ({ onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            await onCreate(formData);
            onClose();
        } catch (error) {
            setErrors({ submit: error.message || 'Failed to create user' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 p-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Create New User</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                <User className="inline h-4 w-4 mr-1" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                placeholder="John Doe"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                <Mail className="inline h-4 w-4 mr-1" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                placeholder="john@example.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                        </div>

                        {/* Role */}
                        <div className="relative z-50">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                <Shield className="inline h-4 w-4 mr-1" />
                                Role
                            </label>
                            <CustomSelect
                                value={formData.role}
                                onChange={(value) => handleChange('role', value)}
                                options={[
                                    { value: 'USER', label: 'User' },
                                    { value: 'ADMIN', label: 'Admin' }
                                ]}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                <Lock className="inline h-4 w-4 mr-1" />
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                placeholder="••••••••"
                                minLength="8"
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                            <p className="mt-1 text-xs text-zinc-500">Minimum 8 characters</p>
                        </div>



                        {/* Error Message */}
                        {errors.submit && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                                <p className="text-sm text-red-400">{errors.submit}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const CustomSelect = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || value;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-left text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
                <span>{selectedLabel}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-xl z-50"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-zinc-800 ${value === option.value ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-300'
                                    }`}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check className="h-4 w-4" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
