import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, ArrowRight, Cpu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onToggleTheme }) => {
  const { user, role, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items based on role
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Uploads', href: '/admin/uploads' },
        { name: 'Alerts', href: '/admin/alerts' },
        { name: 'Logs', href: '/admin/logs' },
        { name: 'Settings', href: '/admin/settings' },
      ];
    } else if (role === 'user') {
      return [
        { name: 'Dashboard', href: '/user/dashboard' },
        {
          name: 'Detect',
          href: '/user/detect/image',
          hasDropdown: true,
          dropdownItems: [
            { name: 'Image Detection', href: '/user/detect/image', description: 'Analyze images' },
            { name: 'Video Detection', href: '/user/detect/video', description: 'Process videos' },
            { name: 'Live Detection', href: '/user/detect/live', description: 'Real-time monitoring' },
          ],
        },
        { name: 'History', href: '/user/history' },
        { name: 'Contact', href: '/user/contact' },
        { name: 'About', href: '/about' },
      ];
    } else {
      return [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Features', href: '/features' },
        { name: 'Contact', href: '/contact' },
      ];
    }
  };

  const navItems = getNavItems();

  const headerVariants = {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
  };

  const mobileMenuVariants = {
    closed: { opacity: 0, height: 0 },
    open: { opacity: 1, height: 'auto' },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <motion.header
      className="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
      variants={headerVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        backdropFilter: isScrolled ? 'blur(20px)' : 'none',
        backgroundColor: isScrolled ? 'rgba(5, 5, 8, 0.9)' : 'transparent',
        boxShadow: isScrolled ? '0 8px 32px rgba(168, 85, 247, 0.1)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Link
              to={role === 'admin' ? '/admin/dashboard' : role === 'user' ? '/user/dashboard' : '/'}
              className="flex items-center space-x-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/20">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                Ob AI Sentinel
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 lg:flex">
            {navItems.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-1 font-medium transition-colors duration-200 ${isActive ? 'text-purple-400' : 'text-gray-300 hover:text-purple-400'
                    }`
                  }
                >
                  <span>{item.name}</span>
                  {item.hasDropdown && (
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  )}
                </NavLink>

                {item.hasDropdown && (
                  <AnimatePresence>
                    {activeDropdown === item.name && (
                      <motion.div
                        className="absolute top-full left-0 mt-2 w-64 overflow-hidden rounded-xl border border-purple-500/20 bg-[#050508]/95 shadow-xl backdrop-blur-lg"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2 }}
                      >
                        {item.dropdownItems?.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.name}
                            to={dropdownItem.href}
                            className="block px-4 py-3 transition-colors duration-200 hover:bg-purple-500/10"
                          >
                            <div className="font-medium text-white">{dropdownItem.name}</div>
                            {dropdownItem.description && (
                              <div className="text-sm text-gray-400">{dropdownItem.description}</div>
                            )}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center space-x-4 lg:flex">
            {role === 'guest' ? (
              <>
                <Link
                  to="/login"
                  className="font-medium text-gray-300 transition-colors duration-200 hover:text-purple-400"
                >
                  Sign In
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/50"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <div
                  className="relative"
                  onMouseEnter={() => setActiveDropdown('profile')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className="flex items-center space-x-2 rounded-lg px-3 py-2 text-gray-300 transition-colors duration-200 hover:bg-purple-500/10 hover:text-purple-400">
                    <User className="h-5 w-5" />
                    <span className="font-medium">{role === 'admin' ? 'Admin' : user?.email?.split('@')[0] || 'Profile'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'profile' && (
                      <motion.div
                        className="absolute top-full right-0 mt-2 w-56 overflow-hidden rounded-xl border border-purple-500/20 bg-[#050508]/95 shadow-xl backdrop-blur-lg"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2 }}
                      >
                        {role === 'user' && (
                          <>
                            <Link
                              to="/user/profile"
                              className="block px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-purple-500/10"
                            >
                              Profile & Security
                            </Link>
                            <Link
                              to="/user/profile#mfa"
                              className="block px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-purple-500/10"
                            >
                              MFA Settings
                            </Link>
                          </>
                        )}
                        {role === 'admin' && (
                          <Link
                            to="/admin/profile#mfa"
                            className="block px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-purple-500/10"
                          >
                            MFA Settings
                          </Link>
                        )}
                        <button
                          onClick={logout}
                          className="block w-full px-4 py-3 text-left font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/10"
                        >
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <motion.button
            className="rounded-lg p-2 text-gray-300 transition-colors duration-200 hover:bg-purple-500/10 lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="overflow-hidden lg:hidden"
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="mt-4 space-y-2 rounded-xl border border-purple-500/20 bg-[#050508]/95 py-4 shadow-xl backdrop-blur-lg">
                {navItems.map((item) => (
                  <div key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `block px-4 py-3 font-medium transition-colors duration-200 ${isActive ? 'text-purple-400 bg-purple-500/10' : 'text-gray-300 hover:bg-purple-500/10'
                        }`
                      }
                      onClick={() => !item.hasDropdown && setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </NavLink>
                    {item.hasDropdown && item.dropdownItems?.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.name}
                        to={dropdownItem.href}
                        className="block px-8 py-2 text-sm text-gray-400 transition-colors duration-200 hover:bg-purple-500/10 hover:text-purple-400"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {dropdownItem.name}
                      </Link>
                    ))}
                  </div>
                ))}

                <div className="space-y-2 border-t border-purple-500/20 px-4 pt-4">
                  {role === 'guest' ? (
                    <>
                      <Link
                        to="/login"
                        className="block w-full rounded-lg py-2.5 text-center font-medium text-gray-300 transition-colors duration-200 hover:bg-purple-500/10"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="block w-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 py-2.5 text-center font-medium text-white transition-all duration-200 hover:shadow-lg"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </>
                  ) : (
                    <>
                      {role === 'user' && (
                        <>
                          <Link
                            to="/user/profile"
                            className="block w-full rounded-lg py-2.5 text-center font-medium text-gray-300 transition-colors duration-200 hover:bg-purple-500/10"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Profile & Security
                          </Link>
                          <Link
                            to="/user/profile#mfa"
                            className="block w-full rounded-lg py-2.5 text-center font-medium text-gray-300 transition-colors duration-200 hover:bg-purple-500/10"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            MFA Settings
                          </Link>
                        </>
                      )}
                      {role === 'admin' && (
                        <Link
                          to="/admin/settings"
                          className="block w-full rounded-lg py-2.5 text-center font-medium text-gray-300 transition-colors duration-200 hover:bg-purple-500/10"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Admin Settings
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full rounded-lg py-2.5 text-center font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/10"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Navbar;
