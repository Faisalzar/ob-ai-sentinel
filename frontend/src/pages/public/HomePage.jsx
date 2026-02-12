import React, { useEffect, useRef } from 'react';
import { ChevronRight, Activity } from 'lucide-react';
import TerminalFeed from '../../components/reactbits/TerminalFeed';
import TargetCursor from '../../components/reactbits/TargetCursor';
import { Link } from 'react-router-dom';

// Sentinel Theme Colors
const colors = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
  accent: '#0ea5e9', // Sky 500
  accentGlow: '#38bdf8', // Sky 400
  purple: '#a855f7', // Purple 500
};

export default function HomePage() {
  const gradientRef = useRef(null);

  useEffect(() => {
    // Animate words
    const words = document.querySelectorAll('.word');
    words.forEach((word) => {
      const delay = parseInt(word.getAttribute('data-delay') || '0', 10);
      setTimeout(() => {
        word.style.animation = 'word-appear 0.8s ease-out forwards';
      }, delay);
    });

    // Mouse gradient
    const gradient = gradientRef.current;
    function onMouseMove(e) {
      if (gradient) {
        gradient.style.left = e.clientX - 192 + 'px';
        gradient.style.top = e.clientY - 192 + 'px';
        gradient.style.opacity = '1';
      }
    }
    function onMouseLeave() {
      if (gradient) gradient.style.opacity = '0';
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    // Word hover effects
    words.forEach((word) => {
      word.addEventListener('mouseenter', () => {
        word.style.textShadow = `0 0 20px ${colors.accent}`;
        word.style.color = colors.accentGlow;
      });
      word.addEventListener('mouseleave', () => {
        word.style.textShadow = 'none';
        word.style.color = '';
      });
    });

    // Click ripple effect
    function onClick(e) {
      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.left = e.clientX + 'px';
      ripple.style.top = e.clientY + 'px';
      ripple.style.width = '4px';
      ripple.style.height = '4px';
      ripple.style.background = colors.accent;
      ripple.style.borderRadius = '50%';
      ripple.style.transform = 'translate(-50%, -50%)';
      ripple.style.pointerEvents = 'none';
      ripple.style.animation = 'pulse-glow 1s ease-out forwards';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1000);
    }
    document.addEventListener('click', onClick);

    // Floating elements on scroll
    let scrolled = false;
    function onScroll() {
      if (!scrolled) {
        scrolled = true;
        document
          .querySelectorAll('.floating-element')
          .forEach((el, index) => {
            setTimeout(() => {
              el.style.animationPlayState = 'running';
            }, index * 200);
          });
      }
    }
    window.addEventListener('scroll', onScroll);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="font-sans relative min-h-screen w-full overflow-hidden bg-[#030005] text-slate-200">
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />

      {/* Styles for animations */}
      <style>{`
        @keyframes word-appear {
          0% { opacity: 0; transform: translateY(20px); filter: blur(5px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes pulse-glow {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; box-shadow: 0 0 10px ${colors.accent}; }
          100% { transform: translate(-50%, -50%) scale(20); opacity: 0; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .word {
          display: inline-block;
          opacity: 0;
          transition: all 0.3s ease;
          margin-right: 0.25em;
          cursor: default;
        }
        .corner-element {
          position: absolute;
          width: 100px;
          height: 100px;
          border-color: rgba(56, 189, 248, 0.2);
          opacity: 0;
          animation: fade-in 1s ease-out forwards;
        }
        .floating-element {
          position: absolute;
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          animation: float 6s ease-in-out infinite paused;
          z-index: 1;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-20px) rotate(var(--r, 0deg)); }
        }
      `}</style>

      {/* SVG Grid Background */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none z-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle cx="50%" cy="50%" r="400" fill="url(#grid)" opacity="0.5" />
      </svg>

      {/* Corner elements - Styled for Sentinel */}
      <div className="corner-element top-8 left-8 border-t-2 border-l-2 rounded-tl-xl" style={{ animationDelay: '1s' }}></div>
      <div className="corner-element top-8 right-8 border-t-2 border-r-2 rounded-tr-xl" style={{ animationDelay: '1.2s' }}></div>
      <div className="corner-element bottom-8 left-8 border-b-2 border-l-2 rounded-bl-xl" style={{ animationDelay: '1.4s' }}></div>
      <div className="corner-element bottom-8 right-8 border-b-2 border-r-2 rounded-br-xl" style={{ animationDelay: '1.6s' }}></div>

      {/* Floating elements */}
      <div className="floating-element" style={{ top: '25%', left: '15%', animationDelay: '2s', '--r': '45deg' }}></div>
      <div className="floating-element" style={{ top: '65%', right: '10%', animationDelay: '3s', '--r': '-15deg' }}></div>
      <div className="floating-element" style={{ bottom: '20%', left: '30%', animationDelay: '4s', '--r': '10deg' }}></div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-8 py-12 md:px-16 md:py-20">
        {/* Top tagline */}
        <div className="text-center mt-12">
          <h2
            className="font-mono text-xs font-light tracking-[0.2em] uppercase opacity-80 md:text-sm text-sky-300"
          >
            <span className="word" data-delay="0">System</span>
            <span className="word" data-delay="200">Online</span>
            <span className="word" data-delay="400">::</span>
            <span className="word" data-delay="600">Secure</span>
            <span className="word" data-delay="800">Connection</span>
          </h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-sky-500 to-transparent mx-auto mt-4 opacity-0" style={{ animation: 'fade-in 1s ease-out forwards 1s' }}></div>
        </div>

        {/* Main headline */}
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-4xl leading-tight font-extralight tracking-tight md:text-6xl lg:text-7xl text-white">
            <div className="mb-6 md:mb-8">
              <span className="word font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500" data-delay="1200">
                Secure
              </span>
              <span className="word" data-delay="1350">Object</span>
              <span className="word" data-delay="1500">Detection</span>
              <span className="word" data-delay="1650">&</span>
            </div>

            <div className="text-3xl leading-relaxed font-thin md:text-5xl lg:text-6xl text-slate-300">
              <span className="word" data-delay="1800" style={{ color: colors.accent }}>AI</span>
              <span className="word" data-delay="1950">Intelligence.</span>
            </div>

            <div className="mt-8 text-lg md:text-xl font-light text-slate-400 max-w-3xl mx-auto">
              <span className="word" data-delay="2100">Deploy</span>
              <span className="word" data-delay="2150">enterprise-grade</span>
              <span className="word" data-delay="2200">surveillance</span>
              <span className="word" data-delay="2250">with</span>
              <span className="word" data-delay="2300">real-time</span>
              <span className="word" data-delay="2350">threat</span>
              <span className="word" data-delay="2400">analysis.</span>
            </div>
          </h1>

          {/* Call to Actions */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 opacity-0" style={{ animation: 'fade-in 1s ease-out forwards 3s' }}>
            <Link to="/login" className="px-8 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-1 transition-all duration-300 cursor-target flex items-center gap-2">
              Open Console <ChevronRight size={18} />
            </Link>
            <Link to="/about" className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-target">
              Learn More
            </Link>
          </div>

          <div className="h-px w-full max-w-lg bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto mt-16"></div>
        </div>

        {/* Bottom Status / Terminal Preview */}
        <div className="text-center w-full max-w-4xl mt-12 relative z-20">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-700/50 rounded-lg p-1 overflow-hidden opacity-0" style={{ animation: 'fade-in 1s ease-out forwards 4s' }}>
            <div className="bg-[#020617] rounded-md p-4 border border-white/5 min-h-[150px] relative">
              {/* Glare */}
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/[0.03] to-transparent pointer-events-none z-10"></div>

              <div className="flex items-center gap-3 mb-3 opacity-50 pb-2 border-b border-white/5">
                <Activity size={14} className="text-purple-400" />
                <span className="text-[10px] uppercase tracking-widest font-mono text-slate-400">Live Inference Stream</span>
              </div>
              {/* Embedded Terminal Feed */}
              <div className="text-left font-mono text-xs md:text-sm h-[120px] overflow-hidden relative">
                <TerminalFeed />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mouse Gradient Follower */}
      <div
        id="mouse-gradient"
        ref={gradientRef}
        className="pointer-events-none fixed h-96 w-96 rounded-full opacity-0 blur-3xl transition-opacity duration-500 ease-out"
        style={{
          background: `radial-gradient(circle, ${colors.accent}15 0%, transparent 70%)`,
          zIndex: 5
        }}
      ></div>
    </div>
  );
}
