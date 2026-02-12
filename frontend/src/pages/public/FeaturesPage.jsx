'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  Scan,
  ShieldAlert,
  Eye,
  LayoutDashboard,
  Bell,
  Server,
  Zap,
  Lock,
  Camera,
  Activity
} from 'lucide-react';
import TargetCursor from '../../components/reactbits/TargetCursor';
import ParticlesBackground from '../../components/reactbits/ParticlesBackground';

const features = [
  {
    step: 'Step 1',
    title: 'Connect Your Stream',
    content:
      'Seamlessly integrate any RTSP camera or USB webcam. Our system supports low-latency ingestion for real-time monitoring.',
    icon: <Camera className="text-purple-400 h-6 w-6" />,
    // Placeholder image - ideally this would be a screenshot of the camera setup
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
  },
  {
    step: 'Step 2',
    title: 'AI Detection & Analysis',
    content:
      'Advanced YOLOv8 models process every frame, identifying objects and classifying threats with military-grade precision.',
    icon: <Scan className="text-blue-400 h-6 w-6" />,
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop',
  },
  {
    step: 'Step 3',
    title: 'Real-time Alerts',
    content:
      'Receive instant notifications via email or dashboard for critical events. Never miss a security breach.',
    icon: <Bell className="text-red-400 h-6 w-6" />,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1470&auto=format&fit=crop',
  },
  {
    step: 'Step 4',
    title: 'Manage & Secure',
    content:
      'Control access, review logs, and manage multiple locations from a single, centralized secure dashboard.',
    icon: <ShieldAlert className="text-green-400 h-6 w-6" />,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
  },
];

export default function FeaturesPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (4000 / 100));
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [progress]);

  // Handle manual click on a feature
  const handleFeatureClick = (index) => {
    setCurrentFeature(index);
    setProgress(0); // Reset progress when manually clicked
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030005] text-white overflow-hidden p-8 md:p-12 pt-24">
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />

      {/* Background Particles from original theme */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15 }}>
        <ParticlesBackground color="rgba(168,85,247,0.4)" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="relative mx-auto mb-16 max-w-2xl sm:text-center">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tighter md:text-5xl bg-gradient-to-r from-white via-purple-300 to-white bg-clip-text text-transparent">
              Security in Four Steps
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              Ob AI Sentinel helps you connect, detect, and protect your assets with autonomous AI intelligence.
            </p>
          </div>
          {/* Ambient Glow */}
          <div
            className="absolute inset-0 mx-auto h-44 max-w-xs blur-[118px]"
            style={{
              background:
                'linear-gradient(152.92deg, rgba(168, 85, 247, 0.2) 4.54%, rgba(59, 130, 246, 0.26) 34.2%, rgba(168, 85, 247, 0.1) 77.55%)',
            }}
          ></div>
        </div>

        <hr className="bg-slate-800/60 border-none mx-auto mb-16 h-px w-1/2" />

        <div className="flex flex-col gap-12 md:grid md:grid-cols-2 md:gap-16 items-center">
          {/* Left Column: text steps */}
          <div className="order-2 space-y-10 md:order-1 w-full">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-6 md:gap-8 cursor-pointer group"
                onClick={() => handleFeatureClick(index)}
                initial={{ opacity: 0.3, x: -20 }}
                animate={{
                  opacity: index === currentFeature ? 1 : 0.4,
                  x: 0,
                  scale: index === currentFeature ? 1.02 : 1,
                }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <motion.div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full border-2 md:h-14 md:w-14 transition-all duration-300',
                      index === currentFeature
                        ? 'border-purple-500 bg-purple-500/10 text-purple-400 [box-shadow:0_0_20px_rgba(168,85,247,0.3)]'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 group-hover:border-slate-600',
                    )}
                  >
                    {feature.icon}
                  </motion.div>
                  {/* Connecting line */}
                  {index !== features.length - 1 && (
                    <div className={`absolute top-14 left-1/2 w-0.5 h-12 -ml-[1px] ${index === currentFeature ? 'bg-gradient-to-b from-purple-500/50 to-transparent' : 'bg-slate-800'}`}></div>
                  )}
                </div>

                <div className="flex-1 pt-1">
                  <h3 className={`text-xl font-semibold md:text-2xl mb-2 transition-colors duration-300 ${index === currentFeature ? 'text-white' : 'text-slate-400'}`}>
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                    {feature.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Image Preview */}
          <div
            className={cn(
              'relative order-1 h-[300px] w-full overflow-hidden rounded-2xl border border-purple-500/20 bg-slate-900/50 backdrop-blur-sm [box-shadow:0_0_40px_-10px_rgba(168,85,247,0.15)] md:order-2 md:h-[450px]',
            )}
          >
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 overflow-hidden rounded-2xl"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                      />

                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030005] via-transparent to-transparent opacity-90" />
                      <div className="absolute inset-0 bg-purple-500/5 mix-blend-overlay" />

                      {/* Floating Step Badge */}
                      <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2">
                        <span className="text-purple-300 text-sm font-medium tracking-wider uppercase">
                          {feature.step}
                        </span>
                      </div>
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
