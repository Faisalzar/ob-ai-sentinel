import React, { useState } from 'react';
import api from '../../services/api';
import '../../styles/detection.css';
import { Check, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '../../components/ui/dropzone';

const VideoDetectPage = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maxSizeMB, setMaxSizeMB] = useState(50);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const resp = await api.get('/system/settings');
        if (resp && resp.max_video_size_mb) {
          setMaxSizeMB(resp.max_video_size_mb);
        }
      } catch (err) {
        console.warn("Could not fetch remote settings, using default limit", err);
      }
    };
    fetchSettings();
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Reset
    setResult(null);
    setError('');

    // Validate
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please upload a valid video file.');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleDrop = (files) => {
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDetect = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await api.uploadFile('/detect/video', formData);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Video analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="id-page-container">
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

      <header className="id-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="id-title"
        >
          Video Analysis
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="id-subtitle"
        >
          Upload a video to detect objects and anomalies
        </motion.p>
      </header>

      <main className={`id-content ${result ? 'has-results' : ''}`}>
        <section className="id-card p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <Dropzone
            onDrop={handleDrop}
            src={file ? [file] : undefined}
            accept={{ 'video/*': [] }}
            maxSize={maxSizeMB * 1024 * 1024}
            className={`w-full ${previewUrl ? 'border-none p-0 bg-transparent' : ''}`}
          >
            <DropzoneEmptyState supportText={`Supports MP4, AVI, MOV (Max ${maxSizeMB}MB)`} />
            <DropzoneContent>
              {previewUrl && (
                <div className="id-preview-container mt-0 w-full relative">
                  <video
                    src={previewUrl}
                    controls
                    className="id-image rounded-lg w-full max-h-[600px]"
                  />
                </div>
              )}
            </DropzoneContent>
          </Dropzone>

          {/* Actions */}
          {loading ? (
            <div className="id-loading">
              <div className="id-spinner"></div>
              <div className="id-loading-text">Analyzing video frame by frame...</div>
            </div>
          ) : (
            <div className="id-actions p-4">
              {!result ? (
                <>
                  <button className="id-btn id-btn-secondary" onClick={handleReset} disabled={!file}>
                    <X size={18} /> Remove Video
                  </button>
                  <button
                    className="id-btn id-btn-primary"
                    onClick={handleDetect}
                    disabled={!file}
                    style={{ marginTop: 0 }}
                  >
                    <Check size={20} /> Start Analysis
                  </button>
                </>
              ) : (
                <>
                  <button className="id-btn id-btn-secondary" onClick={handleReset}>
                    <RefreshCw size={18} /> Process New Video
                  </button>
                  {/* Download button could be added here if backend returns processed video URL */}
                </>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: '1.5rem', color: '#ef4444', fontWeight: 500, textAlign: 'center' }}>
              {error}
            </div>
          )}
        </section>

        {/* Results Section */}
        {result && (
          <aside className="id-card">
            <div className="id-results-header">
              <span className="id-results-title">Analysis Results</span>
            </div>
            <div className="p-4 overflow-auto max-h-[500px] text-xs font-mono bg-zinc-950/50 rounded-lg border border-zinc-800 text-zinc-300">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default VideoDetectPage;
