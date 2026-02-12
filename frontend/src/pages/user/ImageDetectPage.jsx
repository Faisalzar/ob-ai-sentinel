import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/detection.css';
import { Download, RefreshCw, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '../../components/ui/dropzone';

const ImageDetectPage = () => {
  // State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [maxSizeMB, setMaxSizeMB] = useState(5);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const resp = await api.get('/system/settings');
      if (resp && resp.max_image_size_mb) {
        setMaxSizeMB(resp.max_image_size_mb);
      }
    } catch (err) {
      console.warn("Could not fetch remote settings, using default limit", err);
    }
  };

  // Handlers
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Reset previous state
    setResult(null);
    setError(null);

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image (JPG, PNG, WebP).');
      return;
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB.`);
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
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await api.uploadFile('/detect/image', formData);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  // Helper to extract coordinates safely
  const getBoxCoords = (det) => {
    const box = det.box || det.bbox;
    if (!box) return [0, 0, 0, 0];
    if (Array.isArray(box)) return box;
    return [box.x1, box.y1, box.x2, box.y2];
  };

  const getClassColor = (className) => {
    // Palette of vibrant colors (Roboflow-like style)
    const colors = [
      '#FF3838', '#FF9D97', '#FF701F', '#FFB21D', '#CFD231',
      '#48F90A', '#92CC17', '#3DDB86', '#1A9334', '#00D4BB',
      '#2C99A8', '#00C2FF', '#344593', '#6473FF', '#0018EC',
      '#8438FF', '#520085', '#CB38FF', '#FF95C8', '#FF37C7'
    ];
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
      hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    return colors[hash % colors.length];
  };

  const handleDownload = () => {
    // Create a temporary canvas to merge image and boxes
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    const img = imageRef.current;

    if (!img) return;

    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw boxes
    if (result && result.detections) {
      result.detections.forEach(det => {
        const [x1, y1, x2, y2] = getBoxCoords(det);
        const width = x2 - x1;
        const height = y2 - y1;

        // Color based on class name
        const color = getClassColor(det.class_name);

        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(x1, y1, width, height);

        // Label background
        ctx.fillStyle = color;
        const text = `${det.class_name} ${(det.confidence * 100).toFixed(0)}%`;
        const textWidth = ctx.measureText(text).width + 10;
        ctx.fillRect(x1, y1 - 24, textWidth, 24);

        // Label text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(text, x1 + 5, y1 - 6);
      });
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `detection-result-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  // Draw boxes on the overlay canvas when result changes or image loads
  useEffect(() => {
    if (!result || !imageRef.current || !canvasRef.current) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Match canvas size to displayed image size
    canvas.width = img.width;
    canvas.height = img.height;

    // Calculate scaling factor (intrinsic vs displayed)
    const scaleX = canvas.width / img.naturalWidth;
    const scaleY = canvas.height / img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    result.detections.forEach(det => {
      const [x1, y1, x2, y2] = getBoxCoords(det);

      // Validate coordinates
      if (x1 === undefined) return;

      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      const scaledWidth = (x2 - x1) * scaleX;
      const scaledHeight = (y2 - y1) * scaleY;

      // Determine color
      const color = getClassColor(det.class_name);

      // Draw Box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX1, scaledY1, scaledWidth, scaledHeight);

      // Draw Label
      const labelText = `${det.class_name} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = '600 12px Inter, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width + 12;
      const textHeight = 24;

      ctx.fillStyle = color;
      ctx.fillRect(scaledX1, scaledY1 - textHeight, textWidth, textHeight);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, scaledX1 + 6, scaledY1 - 7);
    });

  }, [result, previewUrl]);

  // Update canvas on resize
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current && canvasRef.current && result) {
        setResult({ ...result }); // Trigger re-render to recalculate positions
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [result]);

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
          Image Detection
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="id-subtitle"
        >
          Upload an image to detect objects using AI
        </motion.p>
      </header>

      <main className={`id-content ${result ? 'has-results' : ''}`}>

        {/* Section 1: Upload / Preview */}
        <section className="id-card p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <Dropzone
            onDrop={handleDrop}
            src={file ? [file] : undefined}
            accept={{ 'image/*': [] }}
            className={`w-full ${previewUrl ? 'border-none p-0 bg-transparent' : ''}`}
          >
            <DropzoneEmptyState supportText={`Supported: PNG, JPG, JPEG (Max ${maxSizeMB}MB)`} />
            <DropzoneContent>
              {previewUrl && (
                <div className="id-preview-container mt-0 relative">
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Preview"
                    className="id-image rounded-lg"
                    onLoad={() => {
                      if (result) setResult({ ...result });
                    }}
                  />
                  {result && <canvas ref={canvasRef} className="id-canvas rounded-lg" />}
                </div>
              )}
            </DropzoneContent>
          </Dropzone>

          {/* Actions / Loading */}
          {loading ? (
            <div className="id-loading">
              <div className="id-spinner"></div>
              <div className="id-loading-text">Analyzing image...</div>
            </div>
          ) : (
            <div className="id-actions p-4">
              {!result ? (
                <>
                  <button className="id-btn id-btn-secondary" onClick={handleReset} disabled={!file}>
                    <X size={18} /> Remove Image
                  </button>
                  <button
                    className="id-btn id-btn-primary"
                    onClick={handleDetect}
                    disabled={!file}
                    style={{ marginTop: 0 }} /* Override top margin for side-by-side */
                  >
                    <Check size={20} /> Detect Objects
                  </button>
                </>
              ) : (
                <>
                  <button className="id-btn id-btn-secondary" onClick={handleReset}>
                    <RefreshCw size={18} /> New Image
                  </button>
                  <button className="id-btn id-btn-primary" onClick={handleDownload}>
                    <Download size={18} /> Download Result
                  </button>
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

        {/* Section 2: Results List (Only visible if result exists) */}
        {result && (
          <aside className="id-card">
            <div className="id-results-header">
              <span className="id-results-title">Detected Objects</span>
              <span className="id-results-count">{result.detections.length} Found</span>
            </div>

            <div className="id-results-list">
              {result.detections.map((det, idx) => (
                <div key={idx} className="id-result-item">
                  <div className="id-result-row">
                    <span className="id-result-name">{det.class_name}</span>
                    <span className="id-result-conf">{(det.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="id-conf-bar">
                    <div
                      className="id-conf-fill"
                      style={{
                        width: `${det.confidence * 100}%`,
                        backgroundColor: getClassColor(det.class_name)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default ImageDetectPage;
