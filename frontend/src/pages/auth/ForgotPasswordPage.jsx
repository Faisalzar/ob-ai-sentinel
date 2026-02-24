import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck, Cpu, Key, Lock, Bell, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ParticlesBackground from '../../components/reactbits/ParticlesBackground';
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import "./Auth.css";

const ForgotPasswordPage = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Auth Guard: Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && user) {
      if (role === 'admin') navigate('/admin/dashboard');
      else navigate('/user/dashboard');
    }
  }, [user, authLoading, role, navigate]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setStatus({
        type: "success",
        message: "If this email exists, a reset code has been sent."
      });
      setStep(2);
    } catch (err) {
      console.error("Forgot Password Error:", err);
      setStatus({
        type: "error",
        message: err.message || "Failed to send reset code. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);

    try {
      const data = await authService.verifyPasswordResetOtp(email, otp);
      setResetToken(data.reset_token);
      setStatus({
        type: "success",
        message: "Code verified. Please enter your new password."
      });
      setStep(3);
    } catch (err) {
      console.error("Verify Code Error:", err);
      setStatus({
        type: "error",
        message: err.message || "Invalid or expired code."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);

    try {
      await authService.resetPassword(resetToken, newPassword);
      setStatus({
        type: "success",
        message: "Password reset successful! Redirecting to login..."
      });
      setTimeout(() => navigate('/login', { state: { message: "Password reset successfully. Please login." } }), 2000);
    } catch (err) {
      console.error("Reset Password Error:", err);
      setStatus({
        type: "error",
        message: err.message || "Failed to reset password. The code might be expired."
      });
    } finally {
      setLoading(false);
    }
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
              Secure Account Recovery
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.6 }}>
              Regain access to your security dashboard quickly and securely. Your protection is our priority.
            </p>

            <div className="brand-feature-list">
              {[
                {
                  icon: <Key size={20} />,
                  title: 'Encrypted Reset Links',
                  desc: 'Time-sensitive secure tokens for your protection'
                },
                {
                  icon: <Lock size={20} />,
                  title: 'Two-Factor Verification',
                  desc: 'Verify your identity before resetting credentials'
                },
                {
                  icon: <Bell size={20} />,
                  title: 'Instant Notifications',
                  desc: 'Immediate alerts for any account activity'
                }
              ].map(({ icon, title, desc }, i) => (
                <div
                  key={i}
                  className="feature-item"
                  style={{ animationDelay: `${0.2 * (i + 1)}s` }}
                >
                  <div className="feature-icon">
                    {icon}
                  </div>
                  <div className="feature-text">
                    <h4>{title}</h4>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="auth-form-side">
            <div className="auth-form-container">
              <div className="auth-header-split">
                <h2>{step === 1 ? "Forgot Password?" : step === 2 ? "Verify Reset Code" : "Create New Password"}</h2>
                <p>
                  {step === 1 && "Enter your email to receive instructions"}
                  {step === 2 && "Enter the 6-digit code sent to your email"}
                  {step === 3 && "Secure your account with a strong new password"}
                </p>
              </div>

              <AnimatePresence>
                {status.message && (
                  <motion.div
                    className={`error-banner ${status.type === 'success' ? 'success-banner' : ''}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{
                      backgroundColor: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : undefined,
                      borderColor: status.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : undefined,
                      color: status.type === 'success' ? '#4ade80' : undefined
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>{status.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {step === 1 && (
                <motion.form key="step1" onSubmit={handleRequestCode} className="auth-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="input-wrapper">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail className="input-icon" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className="submit-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Code"}
                  </motion.button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form key="step2" onSubmit={handleVerifyCode} className="auth-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="input-wrapper">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Reset Code</label>
                    <div style={{ position: 'relative' }}>
                      <CheckCircle2 className="input-icon" />
                      <input
                        type="text"
                        placeholder="Enter the 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        required
                        autoComplete="one-time-code"
                        maxLength="6"
                        style={{ letterSpacing: '2px', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className="submit-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </motion.button>

                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="auth-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Didn't get the code? Try again
                    </button>
                  </div>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form key="step3" onSubmit={handleResetPassword} className="auth-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="input-wrapper">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock className="input-icon" />
                      <input
                        type="password"
                        placeholder="Must be at least 12 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    {newPassword && (
                      <div style={{ fontSize: '0.8rem', marginTop: '8px', color: newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? '#4ade80' : 'var(--text-secondary)' }}>
                        Requires: 12+ chars, uppercase, number, special char.
                      </div>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    className="submit-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </motion.button>
                </motion.form>
              )}

              <div className="auth-footer">
                <Link to="/login" className="auth-link">
                  Back to Login
                </Link>
                <div className="auth-divider">
                  <span>OR</span>
                </div>
                Don't have an account?
                <Link to="/register" className="auth-link">
                  Create Account
                </Link>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </ParticlesBackground>
  );
};

export default ForgotPasswordPage;
