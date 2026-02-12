import React, { useCallback, useState } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import RedirectIfAuthenticated from './components/common/RedirectIfAuthenticated';
import { AuthProvider } from './context/AuthContext';

// Public pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import FeaturesPage from './pages/public/FeaturesPage';
import ContactPage from './pages/public/ContactPage';
import MaintenancePage from './pages/public/MaintenancePage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import EmailOtpPage from './pages/auth/EmailOtpPage';
import MfaPage from './pages/auth/MfaPage';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import ImageDetectPage from './pages/user/ImageDetectPage';
import VideoDetectPage from './pages/user/VideoDetectPage';
import LiveDetectPage from './pages/user/LiveDetectPage';
import HistoryPage from './pages/user/HistoryPage';
import ProfileSecurityPage from './pages/user/ProfileSecurityPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUploadsPage from './pages/admin/AdminUploadsPage';
import AdminAlertsPage from './pages/admin/AdminAlertsPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminLayout from './pages/admin/AdminLayout';

import Footer from './components/layout/Footer';
import { useAuth } from './context/AuthContext';

function MaintenanceGuard({ children }) {
  const { maintenanceMode, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Define public landing pages and auth pages that should remain accessible
  const isLandingPage = ['/', '/about', '/features', '/contact'].includes(location.pathname);
  const isAuthPage = ['/login', '/register', '/forgot-password', '/email-otp', '/mfa'].includes(location.pathname);

  if (maintenanceMode && role !== 'admin' && !isLandingPage && !isAuthPage && location.pathname !== '/maintenance') {
    return <Navigate to="/maintenance" replace />;
  }

  return children;
}

function App() {
  const [theme, setTheme] = useState('dark');

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <AuthProvider>
      <AppContent theme={theme} handleToggleTheme={handleToggleTheme} />
    </AuthProvider>
  );
}

function AppContent({ theme, handleToggleTheme }) {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/email-otp', '/mfa'].includes(location.pathname);
  const isMaintenancePage = location.pathname === '/maintenance';

  return (
    <div className={`app-root theme-${theme} flex flex-col min-h-screen`}>
      {!isAuthPage && !isMaintenancePage && <Navbar onToggleTheme={handleToggleTheme} />}
      <main className="app-main flex-grow">
        <MaintenanceGuard>
          <Routes>
            {/* Public routes restricted if logged in */}
            <Route element={<RedirectIfAuthenticated />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/email-otp" element={<EmailOtpPage />} />
              <Route path="/mfa" element={<MfaPage />} />
            </Route>

            <Route path="/maintenance" element={<MaintenancePage />} />

            {/* Public routes accessible to everyone */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* User protected routes */}
            <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/detect/image" element={<ImageDetectPage />} />
              <Route path="/user/detect/video" element={<VideoDetectPage />} />
              <Route path="/user/detect/live" element={<LiveDetectPage />} />
              <Route path="/user/history" element={<HistoryPage />} />
              <Route path="/user/profile" element={<ProfileSecurityPage />} />
              <Route path="/user/contact" element={<ContactPage />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/uploads" element={<AdminUploadsPage />} />
                <Route path="/admin/alerts" element={<AdminAlertsPage />} />
                <Route path="/admin/logs" element={<AdminLogsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/profile" element={<ProfileSecurityPage />} />
              </Route>
            </Route>
          </Routes>
        </MaintenanceGuard>
      </main>
      <Footer />
    </div>
  );
}

export default App;
