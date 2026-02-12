import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AuthenticatedImage from '../../components/common/AuthenticatedImage';
import TargetCursor from '../../components/ui/TargetCursor'; // Import TargetCursor
import '../../styles/detection.css'; // Use shared detection theme
import '../../styles/history.css';   // Custom overrides & cursor
import { Filter, Calendar, FileImage, FileVideo, Activity, X } from 'lucide-react';
import { motion } from 'framer-motion';

const HistoryPage = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, images, videos, live
  const [selectedUpload, setSelectedUpload] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.get('/user/stats');
      setUploads(data.recent_uploads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUploads = uploads.filter(upload => {
    // Filter by type (case-insensitive)
    const fileType = (upload.file_type || '').toLowerCase();
    const isLive = upload.filename === 'frame.jpg' ||
      upload.filename.startsWith('live_capture_') ||
      fileType === 'live';

    if (filter === 'images') return fileType === 'image' && !isLive;
    if (filter === 'videos') return fileType === 'video';
    if (filter === 'live') return isLive;
    return true; // all
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getThreatCount = (summary, level) => {
    if (!summary) return 0;
    return summary[`${level}_count`] || 0;
  };

  return (
    <div className="id-page-container">
      {/* Advanced Target Cursor */}
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor={true}
        parallaxOn={true}
        hoverDuration={0.2}
      />

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

      <header className="id-header z-10 relative">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="id-title"
        >
          Detection History
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="id-subtitle"
        >
          Review your past detections and security alerts
        </motion.p>
      </header>

      <main className="id-content max-w-6xl mx-auto z-10 relative" style={{ gridTemplateColumns: '1fr' }}>

        {/* Controls Bar */}
        <div className="id-card p-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 history-tabs">
            {[
              { id: 'all', label: 'All Records', icon: Activity },
              { id: 'images', label: 'Images', icon: FileImage },
              { id: 'videos', label: 'Videos', icon: FileVideo },
              { id: 'live', label: 'Live Captures', icon: Activity },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`
                            cursor-target
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${filter === tab.id
                    ? 'bg-[var(--id-primary-color)] text-white shadow-[0_0_15px_var(--id-primary-glow)] border border-transparent'
                    : 'bg-white/5 text-[var(--id-text-secondary)] border border-[var(--id-border-color)] hover:bg-white/10 hover:text-white'}
                        `}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadHistory}
            className="cursor-target id-btn id-btn-secondary text-sm px-4 py-2 h-10"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-center">
            {error}
          </div>
        )}

        {/* History Grid */}
        {loading ? (
          <div className="id-loading py-20">
            <div className="id-spinner"></div>
            <div className="id-loading-text">Loading history...</div>
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="id-card py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Filter className="text-[var(--id-text-secondary)]" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No records found</h3>
            <p className="text-[var(--id-text-secondary)]">Try adjusting your filters or upload new files.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUploads.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="id-card p-0 overflow-hidden flex flex-col h-full hover:border-[var(--id-primary-color)] transition-colors group"
              >
                {/* Status Bar */}
                <div className="px-4 py-3 border-b border-[var(--id-border-color)] flex justify-between items-center bg-black/20">
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--id-text-secondary)]">
                    <Calendar size={12} />
                    {formatDate(upload.created_at)}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-bold
                                ${upload.detection_summary?.has_dangerous_objects
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                    {upload.detection_summary?.has_dangerous_objects ? 'Threat' : 'Safe'}
                  </span>
                </div>

                {/* Thumbnail / Preview Resource */}
                <div className="relative aspect-video bg-black/50 group-hover:bg-black/30 transition-colors">
                  {upload.annotated_path ? (
                    <div
                      onClick={() => setSelectedUpload(upload)}
                      className="cursor-target w-full h-full cursor-pointer overflow-hidden relative group/image"
                    >
                      <AuthenticatedImage
                        src={`/api/v1/outputs/${upload.annotated_path.replace(/\\/g, '/').split('outputs/')[1]}`}
                        alt={upload.filename}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                        <span className="bg-black/70 text-white px-3 py-1.5 rounded-md text-sm border border-white/10 backdrop-blur-sm">
                          View Details
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--id-text-secondary)]">
                      <FileImage size={48} className="opacity-20" />
                    </div>
                  )}
                </div>

                {/* Detailed Stats */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-white mb-3 truncate" title={upload.filename}>
                    {upload.filename.replace('live_capture_', 'Live Capture ')}
                  </h3>

                  {upload.detection_summary && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-white/5 rounded p-2 text-center border border-white/5">
                        <div className="text-xs text-[var(--id-text-secondary)] uppercase">Total</div>
                        <div className="text-lg font-bold text-white">{upload.detection_summary.total_detections}</div>
                      </div>
                      <div className="bg-red-500/10 rounded p-2 text-center border border-red-500/20">
                        <div className="text-xs text-red-400/80 uppercase">Danger</div>
                        <div className="text-lg font-bold text-red-400">{getThreatCount(upload.detection_summary, 'dangerous')}</div>
                      </div>
                      <div className="bg-green-500/10 rounded p-2 text-center border border-green-500/20">
                        <div className="text-xs text-green-400/80 uppercase">Safe</div>
                        <div className="text-lg font-bold text-green-400">{getThreatCount(upload.detection_summary, 'harmless')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Full Screen Modal */}
      {selectedUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedUpload(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--id-card-bg)] border border-[var(--id-border-color)] rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--id-border-color)] flex justify-between items-center bg-black/20">
              <h2 className="text-lg font-bold text-white truncate max-w-2xl">{selectedUpload.filename}</h2>
              <button
                onClick={() => setSelectedUpload(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-[var(--id-text-secondary)] hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
              <AuthenticatedImage
                src={`/api/v1/outputs/${selectedUpload.annotated_path.replace(/\\/g, '/').split('outputs/')[1]}`}
                alt={selectedUpload.filename}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>

            {selectedUpload.detection_summary && (
              <div className="p-4 bg-black/20 border-t border-[var(--id-border-color)] text-sm text-[var(--id-text-secondary)] flex justify-between">
                <span>Detected: <span className="text-white">{selectedUpload.detection_summary.total_detections} objects</span></span>
                <span>Classes: <span className="text-white">{selectedUpload.detection_summary.classes_detected?.join(', ') || 'None'}</span></span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
