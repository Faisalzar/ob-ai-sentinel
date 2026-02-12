import React, { useState, useRef, useEffect } from 'react';
import '../../styles/detection.css';
import '../../styles/live-detect.css'; // Keep for specific video-container styles if needed, but override with detection.css where possible
import { Camera, Video, StopCircle, Play, Pause, Smartphone, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const LiveDetectPage = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = back
  const [isMobile, setIsMobile] = useState(false);
  const [detections, setDetections] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);        // overlay for drawing boxes (full size)
  const captureCanvasRef = useRef(null);  // hidden canvas for downscaled snapshots
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const inFlightRef = useRef(false);
  const isDetectingRef = useRef(false);  // ref for state access in loop
  const captureSizeRef = useRef({ w: 0, h: 0 }); // store last capture dimensions
  const DETECTION_PERIOD_MS = 500; // Faster detection for live feel

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  // Get available camera devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }
    };
    getDevices();
  }, [selectedDevice]);

  // Ensure video plays when stream is ready and component updates
  useEffect(() => {
    if (isStreaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [isStreaming]);

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

  // Start camera stream
  const startCamera = async () => {
    try {
      setError('');

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Configure constraints
      const constraints = {
        video: isMobile ? {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsStreaming(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(`Camera access error: ${err.message}`);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    // Stop detection first
    if (isDetecting) {
      stopDetection();
    }
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  // Switch camera (mobile)
  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    if (isStreaming) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(newFacingMode);
      }, 100);
    }
  };

  // Capture frame and send to backend for detection
  const captureAndDetect = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Set overlay canvas size to match the current video frame (for drawing boxes)
    if (canvasRef.current) {
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
    }

    // Downscale capture to reduce bandwidth/CPU (e.g., 640px wide)
    const captureCanvas = captureCanvasRef.current;
    if (!captureCanvas) return;
    const targetWidth = Math.min(640, video.videoWidth || 640);
    const aspect = (video.videoHeight || 480) / (video.videoWidth || 640);
    const targetHeight = Math.round(targetWidth * aspect);
    captureCanvas.width = targetWidth;
    captureCanvas.height = targetHeight;
    captureSizeRef.current = { w: targetWidth, h: targetHeight };
    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    // Convert capture canvas to blob
    captureCanvas.toBlob(async (blob) => {
      if (!blob) {
        return;
      }

      try {
        // Create unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `live_capture_${timestamp}.jpg`;

        const formData = new FormData();
        formData.append('file', blob, filename);

        // Get token from localStorage
        let token = null;
        const authData = localStorage.getItem('auth');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            token = parsed.token;
          } catch (e) {
            console.error('Error parsing auth data:', e);
          }
        }

        if (!token) {
          setError('Authentication token not found. Please login again.');
          return;
        }

        const response = await fetch('http://127.0.0.1:8000/api/v1/detect/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
          keepalive: false,
        });

        if (response.ok) {
          const data = await response.json();
          setDetections(data.detections || []);
          drawDetections(data.detections || []);
        } else if (response.status === 401) {
          setError('Session expired. Please login again.');
          stopDetection();
        } else {
          // Silent fail for single frame errors to allow retries
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    }, 'image/jpeg', 0.7);
  };

  // Draw detection boxes on canvas overlay
  const drawDetections = (dets) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Clear previous drawings
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each detection
    dets.forEach(det => {
      const { bbox, class_name, confidence } = det;

      // Scale coordinates from CAPTURE size to overlay canvas size
      const baseW = captureSizeRef.current.w || canvas.width;
      const baseH = captureSizeRef.current.h || canvas.height;
      const scaleX = canvas.width / baseW;
      const scaleY = canvas.height / baseH;

      const x = bbox.x1 * scaleX;
      const y = bbox.y1 * scaleY;
      const width = (bbox.x2 - bbox.x1) * scaleX;
      const height = (bbox.y2 - bbox.y1) * scaleY;

      // Choose color based on class
      const color = getClassColor(class_name);

      // Draw bounding box (Stroke only, no fill)
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.strokeRect(x, y, width, height);

      // Draw label background
      const label = `${class_name} ${(parseFloat(confidence) * 100).toFixed(0)}%`;
      context.font = 'bold 16px Inter, sans-serif';
      const textWidth = context.measureText(label).width + 10;

      context.fillStyle = color;
      context.fillRect(x, y - 24, textWidth, 24);

      // Draw label text
      context.fillStyle = '#000000';
      context.fillText(label, x + 5, y - 6);
    });
  };

  // Start continuous detection
  const startDetection = () => {
    if (!isStreaming) return;
    setError('');
    setIsDetecting(true);
    isDetectingRef.current = true;

    // Avoid overlapping requests: run a self-scheduling loop
    const loop = async () => {
      if (!isDetectingRef.current) return;

      if (!inFlightRef.current) {
        inFlightRef.current = true;
        try {
          await captureAndDetect();
        } catch (err) {
          console.error(err);
        } finally {
          inFlightRef.current = false;
        }
      }
      detectionIntervalRef.current = setTimeout(loop, DETECTION_PERIOD_MS);
    };

    loop();
  };

  // Stop continuous detection
  const stopDetection = () => {
    setIsDetecting(false);
    isDetectingRef.current = false;
    if (detectionIntervalRef.current) {
      clearTimeout(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetections([]);
    // Clear overlay
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopDetection();
    };
  }, []);

  // Restart camera when facing mode changes (mobile)
  useEffect(() => {
    if (isMobile && isStreaming) {
      startCamera();
    }
  }, [facingMode]);

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
          Live Detection
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="id-subtitle"
        >
          Real-time object detection from your camera
        </motion.p>
      </header>

      <main className={`id-content ${detections.length > 0 ? 'has-results' : ''}`}>

        {/* Main Card: controls & video */}
        <section className="id-card p-0 overflow-hidden border-0 bg-transparent shadow-none">

          {/* Controls Bar */}
          <div className={`p-4 mb-4 rounded-xl border border-[nav-border-color] bg-[var(--id-card-bg)] backdrop-blur-md flex flex-wrap gap-4 items-center justify-center relative z-10 transition-all duration-300 ${isStreaming ? 'opacity-100' : 'opacity-100'}`}>
            {/* Desktop: Camera selection */}
            {!isMobile && devices.length > 1 && (
              <div className="relative">
                <Monitor className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  disabled={isStreaming}
                  className="pl-10 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-purple-500 focus:outline-none appearance-none cursor-pointer"
                >
                  {devices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mobile: Front/Back camera toggle */}
            {isMobile && (
              <button
                onClick={switchCamera}
                disabled={!isStreaming}
                className="id-btn id-btn-secondary"
              >
                <Smartphone size={18} />
                {facingMode === 'user' ? 'Front' : 'Back'}
              </button>
            )}

            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>

            {!isStreaming ? (
              <button onClick={startCamera} className="id-btn id-btn-primary" style={{ margin: 0, width: 'auto' }}>
                <Camera size={20} /> Start Camera
              </button>
            ) : (
              <button onClick={stopCamera} className="id-btn id-btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                <StopCircle size={20} /> Stop Camera
              </button>
            )}

            {isStreaming && (
              <>
                {!isDetecting ? (
                  <button onClick={startDetection} className="id-btn id-btn-primary" style={{ margin: 0, width: 'auto' }}>
                    <Play size={20} /> Start Detection
                  </button>
                ) : (
                  <button onClick={stopDetection} className="id-btn id-btn-secondary" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
                    <Pause size={20} /> Pause
                  </button>
                )}
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Video Container */}
          <div className="id-preview-container relative w-full bg-black rounded-lg overflow-hidden border border-[var(--id-border-color)]" style={{ width: '100%', minHeight: '480px' }}>
            {isStreaming ? (
              <div className="relative w-full h-full flex justify-center items-center bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => {
                    if (videoRef.current) videoRef.current.play();
                  }}
                  className="w-full h-full object-contain max-h-[70vh]"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[480px] text-[var(--id-text-secondary)]">
                <Video size={64} className="mb-4 opacity-50" />
                <p>Camera is stopped. Click "Start Camera" to begin.</p>
              </div>
            )}
            {/* hidden capture canvas */}
            <canvas ref={captureCanvasRef} style={{ display: 'none' }} />
          </div>

        </section>

        {/* Results Sidebar */}
        {detections.length > 0 && (
          <aside className="id-card">
            <div className="id-results-header">
              <span className="id-results-title">Live Objects</span>
              <span className="id-results-count">{detections.length}</span>
            </div>

            <div className="id-results-list">
              {detections.map((det, idx) => (
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

export default LiveDetectPage;
