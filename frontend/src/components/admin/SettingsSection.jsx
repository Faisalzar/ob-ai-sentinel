import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SettingsSection = ({ title, description, children, id }) => {
    return (
        <motion.div
            key={id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
        >
            <div className="pb-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-zinc-400 text-sm mt-1">{description}</p>
            </div>
            <div className="space-y-6 pt-2">
                {children}
            </div>
        </motion.div>
    );
};

export const SettingsGroup = ({ label, children, description, inline = false }) => {
    return (
        <div className={`group flex flex-col gap-1 ${inline ? 'sm:flex-row sm:items-center sm:justify-between' : ''}`}>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-zinc-300 group-focus-within:text-purple-400 transition-colors">
                    {label}
                </label>
                {description && (
                    <span className="text-xs text-zinc-500">{description}</span>
                )}
            </div>
            <div className={`${inline ? 'mt-0' : 'mt-2'}`}>
                {children}
            </div>
        </div>
    );
};
