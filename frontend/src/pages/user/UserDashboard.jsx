import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SystemOverview from '../../components/ui/system-overview';
import LiveThreatLog from '../../components/ui/live-threat-log';
import LiveCameraGrid from '../../components/ui/live-camera-grid';
import { RecentDetectionsTable } from '../../components/ui/recent-detections';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const UserDashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({
    active_cameras: 0,
    dangerous_alerts: 0,
    detections: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadStats = async () => {
    try {
      const data = await api.get('/user/stats');

      // Transform recent_uploads to detections format
      const detections = (data.recent_uploads || []).map(upload => ({
        id: upload.id,
        camera: upload.filename,
        type: upload.file_type,
        level: upload.detection_summary?.has_dangerous_objects ? 'dangerous' :
          upload.detection_summary?.caution_count > 0 ? 'caution' : 'info',
        confidence: upload.detection_summary?.total_detections > 0 ? 0.85 : 0,
        timestamp: new Date(upload.created_at).toLocaleString(),
        time: upload.created_at
      }));

      setStats({
        active_cameras: data.active_cameras ?? 0,
        dangerous_alerts: data.dangerous_alerts ?? 0,
        total_detections: data.total_detections ?? 0,
        detections: detections
      });
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white">
      {/* Animated Particles Background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"
        />
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 bg-black/40 backdrop-blur-md"
        >
          <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {getGreeting()}, {user?.name || 'User'}
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadStats}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-6 space-y-6 pb-10">
          {/* Section 1: System Overview Cards */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SystemOverview stats={stats} />
          </motion.section>

          {/* Section 2 & 3: Threat Intelligence + Live Cameras */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Live Threat Log (1/3 width on XL) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="xl:col-span-1"
            >
              <LiveThreatLog />
            </motion.div>

            {/* Live Camera Grid (2/3 width on XL) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="xl:col-span-2"
            >
              <LiveCameraGrid />
            </motion.div>
          </div>

          {/* Section 4: Recent Detections (Last 24 Hours) */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <RecentDetectionsTable detections={stats.detections} />
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
