import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Github,
    Linkedin,
    Twitter,
    MessageCircle,
    ArrowDownLeft,
    Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/global.css';

const Footer = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper to handle "Guest clicking feature" -> Login
    const handleFeatureClick = (e, path) => {
        if (!user) {
            e.preventDefault();
            navigate('/login');
        }
    };

    if (!mounted) return null;

    // --- CONFIGURATION ---

    const publicNavigation = {
        product: [
            { name: 'Features', href: '/features' },
            { name: 'Live Detection', href: '/login', action: true },
            { name: 'Video Analysis', href: '/login', action: true },
            { name: 'Image Forensics', href: '/login', action: true },
        ],
        company: [
            { name: 'About Us', href: '/about' },
            { name: 'Contact', href: '/contact' },
        ],
        resources: [
            { name: 'Sign Up', href: '/register' },
            { name: 'Login', href: '/login' },
        ],
        // Removed Legal section as per request
    };

    const userNavigation = {
        dashboard: [
            { name: 'Dashboard', href: '/user/dashboard' },
            { name: 'History', href: '/user/history' },
            { name: 'Profile', href: '/user/profile' },
        ],
        support: [
            { name: 'Contact Support', href: '/user/contact' },
            { name: 'MFA Settings', href: '/user/profile#mfa' },
        ],
        // Removed Legal section as per request
    };

    const socialLinks = [
        { icon: Twitter, label: 'Twitter', href: '#' },
        { icon: Github, label: 'GitHub', href: '#' },
        { icon: MessageCircle, label: 'Discord', href: '#' },
        { icon: Linkedin, label: 'LinkedIn', href: '#' },
    ];

    // If user is logged in, show SIMPLIFIED footer based on role
    if (user) {
        // ADMIN FOOTER
        if (role === 'admin') {
            return (
                <footer className="w-full bg-[#050508] border-t border-purple-500/20 relative overflow-hidden text-white mt-auto">
                    <div className="animate-energy-flow h-[1px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80 absolute top-0 left-0 z-10" />

                    <div className="relative w-full px-6 md:px-12 py-8">
                        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <Cpu className="text-red-400" size={28} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold tracking-tight text-red-100">Ob AI Admin</span>
                                    <span className="text-sm text-gray-400">System Administration • {user.email}</span>
                                </div>
                            </div>

                            <div className="flex gap-8 text-base font-medium">
                                <Link to="/admin/dashboard" className="text-gray-400 hover:text-red-400 transition-colors">Dashboard</Link>
                                <Link to="/admin/users" className="text-gray-400 hover:text-red-400 transition-colors">Users</Link>
                                <Link to="/admin/profile#mfa" className="text-gray-400 hover:text-red-400 transition-colors">MFA Settings</Link>
                                <Link to="/admin/logs" className="text-gray-400 hover:text-red-400 transition-colors">System Logs</Link>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                &copy; {currentYear} Ob AI Sentinel Administrators
                            </p>
                        </div>
                    </div>
                </footer>
            );
        }

        // USER FOOTER (Existing)
        return (
            <footer className="w-full bg-[#050508] border-t border-purple-500/20 relative overflow-hidden text-white mt-auto">
                <div className="animate-energy-flow h-[1px] w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80 absolute top-0 left-0 z-10" />

                <div className="relative w-full px-6 md:px-12 py-12">
                    <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <Cpu className="text-purple-400" size={28} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tight">Ob AI Sentinel</span>
                                <span className="text-sm text-gray-400">Authenticated Session • {user.email}</span>
                            </div>
                        </div>

                        <div className="flex gap-8 text-base font-medium">
                            <div className="flex flex-col gap-4">
                                {userNavigation.dashboard.concat([{ name: 'About', href: '/about' }]).map(item => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className="group flex items-center gap-2 text-base text-gray-400 hover:text-white transition-all duration-300 -ml-4 hover:ml-0 hover:pl-4 hover:border-l hover:border-purple-500"
                                    >
                                        <ArrowDownLeft
                                            size={16}
                                            className="text-purple-500 opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 rotate-[225deg] md:rotate-0 md:group-hover:rotate-[225deg]"
                                        />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                            <div className="flex flex-col gap-4">
                                {userNavigation.support.map(item => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className="group flex items-center gap-2 text-base text-gray-400 hover:text-white transition-all duration-300 -ml-4 hover:ml-0 hover:pl-4 hover:border-l hover:border-purple-500"
                                    >
                                        <ArrowDownLeft
                                            size={16}
                                            className="text-purple-500 opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 rotate-[225deg] md:rotate-0 md:group-hover:rotate-[225deg]"
                                        />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-sm text-gray-500">
                            &copy; {currentYear} Ob AI Sentinel. All rights reserved.
                        </p>
                    </div>
                </div>
                <style>{`
            @keyframes energy-flow {
            0% { background-position: -100% 0; }
            100% { background-position: 100% 0; }
            }
            .animate-energy-flow {
            background-size: 200% 100%;
            animation: energy-flow 4s linear infinite;
            }
        `}</style>
            </footer>
        );
    }

    // --- PUBLIC FOOTER (Detailed) ---
    return (
        <footer className="w-full bg-[#050508] border-t border-purple-900/30 relative overflow-hidden text-white mt-20">

            {/* 1. Energy Flow Animation Line */}
            <div className="animate-energy-flow h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent absolute top-0 left-0 z-10" />

            <div className="relative w-full px-6 md:px-12 py-16">

                {/* Top Section */}
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16">

                    {/* Company Info */}
                    <div className="space-y-8 lg:col-span-2">
                        <Link to="/" className="inline-flex items-center gap-4 group">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-900/20 border border-purple-500/20 group-hover:border-purple-500/50 transition-all duration-500 group-hover:scale-105">
                                <Cpu className="text-purple-400" size={32} />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                                Ob AI Sentinel
                            </span>
                        </Link>

                        <p className="text-gray-400 text-base leading-relaxed max-w-md">
                            Building innovative solutions for modern businesses. Fast, reliable, and scalable automated surveillance.
                        </p>

                        <div className="flex items-center gap-3">
                            <div className="flex gap-3">
                                {socialLinks.map(({ icon: Icon, label, href }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        className="p-3 rounded-full border border-white/10 bg-white/5 hover:bg-purple-600 hover:border-purple-500 text-gray-300 hover:text-white transition-all duration-500 hover:scale-110 hover:-rotate-12 hover:shadow-lg hover:shadow-purple-500/20"
                                        aria-label={label}
                                    >
                                        <Icon size={20} />
                                    </a>
                                ))}
                            </div>
                        </div>



                        {/* "Developer" Large Text Effect */}
                        <h1 className="bg-gradient-to-b from-white/10 to-transparent bg-clip-text text-6xl font-extrabold text-transparent lg:text-8xl select-none pointer-events-none opacity-50">
                            Security
                        </h1>
                    </div>

                    {/* Navigation Links */}
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-10">
                        {(['product', 'company', 'resources']).map((section) => (
                            <div key={section} className="flex flex-col gap-6 w-full">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 border-l-2 border-purple-500/50 pl-4 mb-2">
                                    {section}
                                </h3>
                                <ul className="space-y-4">
                                    {publicNavigation[section]?.map((item) => (
                                        <li key={item.name}>
                                            <Link
                                                to={item.href}
                                                onClick={(e) => item.action ? handleFeatureClick(e, item.href) : null}
                                                className="group flex items-center gap-2 text-base text-gray-400 hover:text-white transition-all duration-300 -ml-4 hover:ml-0 hover:pl-4 hover:border-l hover:border-purple-500"
                                            >
                                                <ArrowDownLeft
                                                    size={16}
                                                    className="text-purple-500 opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 rotate-[225deg] md:rotate-0 md:group-hover:rotate-[225deg]"
                                                />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Bottom Section */}
                <div className="mt-20 pt-8 border-t border-white/10">
                    {/* Animation: Rotate 3D Line */}
                    <div className="animate-rotate-3d via-purple-500 h-px w-full bg-gradient-to-r from-transparent to-transparent mb-8 opacity-50" />

                    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-400">
                        <p>
                            &copy; {currentYear} Ob AI Sentinel | All rights reserved
                        </p>
                    </div>
                </div>

                {/* Decorative Bottom Gradient */}
                <span className="absolute inset-x-0 bottom-0 left-0 -z-10 h-1/3 w-full bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />
            </div>

            <style>{`
        /* ===== Animation Presets ===== */
        .animate-rotate-3d {
          animation: rotate3d 8s linear infinite;
        }

        .animate-energy-flow {
          animation: energy-flow 4s linear infinite;
          background-size: 200% 100%;
        }

        /* ===== Keyframes ===== */
        @keyframes rotate3d {
          0% {
            transform: rotateY(0);
          }
          100% {
            transform: rotateY(360deg);
          }
        }

        @keyframes energy-flow {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 100% 0;
          }
        }
      `}</style>
        </footer>
    );
};

export default Footer;
