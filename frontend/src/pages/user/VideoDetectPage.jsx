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
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);

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

      if (data.upload_id) {
        setIsProcessing(true);
        startPolling(data.upload_id);
      }
    } catch (err) {
      setError(err.message || 'Video analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (uploadId) => {
    if (pollInterval) clearInterval(pollInterval);

    const interval = setInterval(async () => {
      try {
        const checkData = await api.get(`/uploads/${uploadId}`);
        if (checkData.is_processed) {
          // Processing complete!
          clearInterval(interval);
          setPollInterval(null);
          setIsProcessing(false);

          // Update result with final data
          setResult(prev => ({
            ...prev,
            summary: checkData.detection_summary,
            annotated_url: checkData.annotated_path ? `/api/v1/${checkData.annotated_path}` : null,
            warnings: []
          }));
        } else if (checkData.processing_error) {
          clearInterval(interval);
          setPollInterval(null);
          setIsProcessing(false);
          setError(`Processing failed: ${checkData.processing_error}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000); // Poll every 5 seconds

    setPollInterval(interval);
  };

  const handleReset = () => {
    if (pollInterval) clearInterval(pollInterval);
    setPollInterval(null);
    setIsProcessing(false);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
  };

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

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
          {loading || isProcessing ? (
            <div className="id-loading text-center p-8">
              <div className="id-spinner mx-auto mb-4"></div>
              <div className="id-loading-text text-lg text-purple-300">
                {loading ? "Uploading video..." : "Analyzing video... This may take a few minutes."}
              </div>
              {isProcessing && (
                <p className="text-zinc-400 text-sm mt-2">
                  Please keep this page open. We are analyzing the video frame by frame.
                </p>
              )}
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
        {result && !isProcessing && (
          <aside className="id-card">
            <div className="id-results-header mb-4 border-b border-zinc-800 pb-2">
              <h2 className="text-xl font-bold text-white">Analysis Results</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-2">Summary</h3>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-300">Total Objects Detected</span>
                    <span className="font-mono text-white bg-zinc-800 px-2 py-1 rounded">{result.summary?.total_detections || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-300">Dangerous Objects</span>
                    <span className={`font-mono px-2 py-1 rounded ${result.summary?.dangerous_count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-white'}`}>
                      {result.summary?.dangerous_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-zinc-300">Unique Classes</span>
                    <span className="font-mono text-white bg-zinc-800 px-2 py-1 rounded">
                      {result.summary?.classes_detected?.length || 0}
                    </span>
                  </div>
                </div>

                {result.summary?.classes_detected?.length > 0 && (
                  <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-2">Detected Classes</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.summary.classes_detected.map(cls => (
                        <span key={cls} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full border border-zinc-700">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-2">Annotated Video</h3>
                {result.annotated_url ? (
                  <div className="rounded-lg overflow-hidden border border-zinc-800 shadow-lg shadow-purple-900/20">
                    <video
                      src={import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}${result.annotated_url}` : result.annotated_url}
                      controls
                      autoPlay
                      loop
                      className="w-full h-auto bg-black"
                    />
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-500">
                    No annotated video generated
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default VideoDetectPage;
