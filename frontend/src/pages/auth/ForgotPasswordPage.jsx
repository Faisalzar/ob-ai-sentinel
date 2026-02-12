
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck, Cpu, Key, Lock, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ParticlesBackground from '../../components/reactbits/ParticlesBackground';
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import "./Auth.css";

const ForgotPasswordPage = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Auth Guard: Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && user) {
      if (role === 'admin') navigate('/admin/dashboard');
      else navigate('/user/dashboard');
    }
  }, [user, authLoading, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);

    try {
      // Use authService instead of direct fetch
      const data = await authService.requestPasswordReset(email);

      setStatus({
        type: "success",
        message: "If this email exists, a reset code has been sent."
      });
      setEmail("");

    } catch (err) {
      console.error("Forgot Password Error:", err);
      setStatus({
        type: "error",
        message: err.message || "Something went wrong. Please try again."
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
                <h2>Forgot Password?</h2>
                <p>Enter your email to receive instructions</p>
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

              <form onSubmit={handleSubmit} className="auth-form">
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
              </form>

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
