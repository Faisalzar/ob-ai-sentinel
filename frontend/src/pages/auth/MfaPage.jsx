import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ResendTimer from '../../components/auth/ResendTimer';
import { motion, AnimatePresence } from 'framer-motion';
import ParticlesBackground from '../../components/reactbits/ParticlesBackground';
import { ShieldCheck, Lock, Smartphone, RefreshCw, ArrowRight, Cpu, Mail, AlertTriangle } from 'lucide-react';
import "./Auth.css";

const MfaPage = () => {
  const { authStep, pendingLogin, completeMfa, user } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  // Redirect if no pending login or wrong step
  useEffect(() => {
    if (!pendingLogin || authStep !== 'mfa') {
      navigate('/login', { replace: true });
    }
  }, [pendingLogin, authStep, navigate]);

  // Navigate after success
  useEffect(() => {
    if (mfaVerified) {
      if (user) {
        navigate('/user/dashboard', { replace: true });
      }
    }
  }, [mfaVerified, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let res;
      if (isRecovery) {
        // Recovery Flow
        res = await api.post('/auth/verify-mfa-recovery', {
          mfa_token: pendingLogin?.mfa_token,
          otp: code
        });
      } else {
        // Standard TOTP Flow
        res = await api.post('/auth/verify-mfa', {
          token: code,
          mfa_token: pendingLogin?.mfa_token
        });
      }

      completeMfa(res.user, res.access_token);
      setMfaVerified(true);
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

  const handleInitiateRecovery = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/initiate-mfa-recovery', {
        mfa_token: pendingLogin?.mfa_token
      });
      setIsRecovery(true);
      setCode('');
    } catch (err) {
      if (err.message?.includes('expired')) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(err.message || "Failed to initiate recovery");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pendingEmail = pendingLogin?.user?.email;

  // Mask email for display
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
              {isRecovery ? "Account Recovery" : "Two-Factor Security"}
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.6 }}>
              {isRecovery
                ? "Use your email to regain access if you've lost your authenticator device."
                : "Additional layer of security. Please authenticate using your mobile device."}
            </p>

            <div className="brand-feature-list">
              <div className="feature-item" style={{ animationDelay: '0.2s' }}>
                <div className="feature-icon">
                  {isRecovery ? <Mail size={20} /> : <Smartphone size={20} />}
                </div>
                <div className="feature-text">
                  <h4>{isRecovery ? "Email Verification" : "Authenticator App"}</h4>
                  <p>{isRecovery ? "Secure OTP sent to inbox" : "Google Authenticator / Authy"}</p>
                </div>
              </div>
              <div className="feature-item" style={{ animationDelay: '0.4s' }}>
                <div className="feature-icon"><Lock size={20} /></div>
                <div className="feature-text">
                  <h4>End-to-End Encryption</h4>
                  <p>Your session is protected by TLS 1.3 encryption.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="auth-form-side">
            <div className="auth-form-container">
              <div className="auth-header-split">
                <div className="icon-badge">
                  {isRecovery ? <RefreshCw size={24} className="text-blue-400" /> : <ShieldCheck size={24} className="text-purple-400" />}
                </div>
                <h2>{isRecovery ? "Recovery Mode" : "Authenticate"}</h2>
                <p>
                  {isRecovery
                    ? <span>Code sent to <span className="font-mono text-purple-300 bg-purple-500/10 px-2 rounded">{maskEmail(pendingEmail)}</span></span>
                    : "Enter the 6-digit code from your app"}
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
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-wrapper">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {isRecovery ? "Recovery OTP" : "Validator Code"}
                  </label>
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
                  className={`submit-btn ${isRecovery ? 'bg-blue-600 hover:bg-blue-500' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting || code.length !== 6}
                >
                  {submitting ? "Verifying..." : (isRecovery ? "Recover Account" : "Verify Session")}
                  {!submitting && <ArrowRight size={18} />}
                </motion.button>

                <div className="auth-footer" style={{ flexDirection: 'column', gap: '8px', marginTop: '1.5rem' }}>
                  {isRecovery ? (
                    <>
                      <ResendTimer
                        email={pendingEmail}
                        type="mfa_recovery"
                        onResend={() => setError('')} // Clear error on resend
                      />
                      <button
                        type="button"
                        onClick={() => setIsRecovery(false)}
                        className="auth-link text-sm mt-2"
                      >
                        Back to Authenticator
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInitiateRecovery}
                      className="auth-link text-sm text-gray-400 hover:text-white"
                      disabled={submitting}
                    >
                      Lost your authenticator?
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </ParticlesBackground>
  );
};

export default MfaPage;
