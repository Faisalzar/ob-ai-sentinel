import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../services/apiConfig';
import ResendTimer from '../../components/auth/ResendTimer';
import { motion, AnimatePresence } from 'framer-motion';
import ParticlesBackground from '../../components/reactbits/ParticlesBackground';
import { Mail, ShieldCheck, ArrowRight, Lock, Cpu, Cloud, Users } from 'lucide-react';
import "./Auth.css"; // Reusing Auth styles

const EmailOtpPage = () => {
  const { authStep, pendingLogin, completeEmailOtp, user } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const otpSentRef = useRef(false);

  // Redirect if no pending login
  useEffect(() => {
    if (!pendingLogin || authStep !== 'email-otp') {
      navigate('/login', { replace: true });
    }
  }, [pendingLogin, authStep, navigate]);

  // Send OTP on mount
  useEffect(() => {
    const sendOtp = async () => {
      if (otpSentRef.current) return;

      if (pendingLogin && !otpSent) {
        otpSentRef.current = true;
        try {
          await fetch(`${API_BASE_URL}/auth/send-email-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pendingLogin.user.email })
          });
          setOtpSent(true);
        } catch (err) {
          console.error('Failed to send OTP:', err);
          setError('Failed to send verification code. Please try again.');
        }
      }
    };
    sendOtp();
  }, [pendingLogin, otpSent]);

  // Handle navigation after verification
  useEffect(() => {
    if (otpVerified) {
      if (authStep === 'mfa') {
        navigate('/mfa', { replace: true });
      } else if (user && authStep === 'idle') {
        navigate('/user/dashboard', { replace: true });
      }
    }
  }, [otpVerified, authStep, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingLogin.user.email,
          otp_code: code
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid OTP code');

      completeEmailOtp();
      setOtpVerified(true);
    } catch (err) {
      if (err.message?.includes('503') || err.message?.includes('maintenance')) {
        navigate('/maintenance');
        return;
      }
      setError(err.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Mask email for display (e.g., j***@gmail.com)
  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    return `${name[0]}***@${domain}`;
  };

  return (
    <ParticlesBackground color="rgba(168, 85, 247, 0.2)">
      <div className="auth-centering-container">
        <motion.div
          className="auth-split-wrapper"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Left Side: Branding */}
          <div className="auth-brand-side">
            <div className="brand-row" style={{ alignItems: 'flex-start' }}>
              <Cpu className="brand-logo" strokeWidth={1.5} />
              <div className="brand-name">Ob AI Sentinel</div>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '1rem 0', lineHeight: 1.2 }}>
              Verify Your Identity
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.6 }}>
              We've sent a secure verification code to your email. Please enter it to access your dashboard.
            </p>

            <div className="brand-feature-list">
              <div className="feature-item" style={{ animationDelay: '0.2s' }}>
                <div className="feature-icon"><ShieldCheck size={20} /></div>
                <div className="feature-text">
                  <h4>Two-Factor Security</h4>
                  <p>Protecting your account with multi-layer authentication.</p>
                </div>
              </div>
              <div className="feature-item" style={{ animationDelay: '0.4s' }}>
                <div className="feature-icon"><Users size={20} /></div>
                <div className="feature-text">
                  <h4>Secure Access</h4>
                  <p>Only verified personnel can access system controls.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="auth-form-side">
            <div className="auth-form-container">
              <div className="auth-header-split">
                <div className="icon-badge">
                  <Mail size={24} className="text-purple-400" />
                </div>
                <h2>Check your inbox</h2>
                <p>
                  Enter the 6-digit code sent to <br />
                  <span className="font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                    {maskEmail(pendingLogin?.user?.email)}
                  </span>
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="error-banner"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <ShieldCheck size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-wrapper">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Verification Code</label>
                  <div style={{ position: 'relative' }}>
                    <Lock className="input-icon" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                      placeholder="• • • • • •"
                      className="text-center tracking-[0.5em] font-mono text-lg"
                      required
                      autoFocus
                      autoComplete="one-time-code"
                      style={{ letterSpacing: '0.5em', textAlign: 'center', paddingLeft: '1rem' }}
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting || code.length !== 6}
                >
                  {submitting ? "Verifying..." : "Verify & Continue"}
                  {!submitting && <ArrowRight size={18} />}
                </motion.button>

                <div className="auth-footer" style={{ flexDirection: 'column', gap: '8px' }}>
                  <p className="text-sm text-gray-400">Didn't receive the code?</p>
                  <ResendTimer
                    email={pendingLogin?.user?.email}
                    type="login"
                    onResend={() => console.log('Resent login OTP')}
                  />
                  <Link to="/login" className="auth-link text-xs mt-4">
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </ParticlesBackground>
  );
};

export default EmailOtpPage;
