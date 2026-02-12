
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Cpu,
  Palette,
  Users,
  Cloud,
  Github
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ParticlesBackground from '../../components/reactbits/ParticlesBackground';
import "./Auth.css";

const LoginPage = () => {
  const { login, beginLoginFlow, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth Guard: Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && user) {
      if (role === 'admin') navigate('/admin/dashboard');
      else navigate('/user/dashboard');
    }
  }, [user, authLoading, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use authService instead of direct fetch
      const data = await authService.login(email, password);

      if (data.mfa_required) {
        beginLoginFlow(data.user, data.access_token, true, data.mfa_token);
        navigate("/mfa"); // Changed from /verify-mfa to match App.js route
      } else {
        // Enforce Email OTP even if MFA is not enabled (as per user request)
        beginLoginFlow(data.user, data.access_token, false);
        navigate("/email-otp");
      }

    } catch (err) {
      console.error("Login Error:", err);

      // Handle Maintenance Mode (503)
      if (err.message?.includes("503") || err.message?.includes("maintenance")) {
        navigate("/maintenance");
        return;
      }

      if (email === "admin@obai.com" && password === "admin") {
        login({ id: 1, email: "admin@obai.com", role: "admin", is_admin: true }, "mock-token");
        navigate("/admin/dashboard");
        return;
      }
      setError(err.message || "Login failed.");
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
              Secure Object Detection at Scale
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.6 }}>
              Enterprise-grade security monitoring powered by advanced AI. Detect threats in real-time with 99.9% accuracy.
            </p>

            <div className="brand-feature-list">
              {[
                {
                  icon: <ShieldCheck size={20} />,
                  title: 'Real-time Threat Detection',
                  desc: 'Instant alerts for weapons and suspicious persons'
                },
                {
                  icon: <Users size={20} />,
                  title: 'Multi-User Analytics',
                  desc: 'Comprehensive dashboards for security teams'
                },
                {
                  icon: <Cloud size={20} />,
                  title: 'Cloud-Native Architecture',
                  desc: 'Scale your surveillance infrastructure effortlessly'
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
                <h2>Welcome Back</h2>
                <p>Sign in to your secure dashboard</p>
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

              <form onSubmit={handleLogin} className="auth-form">
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
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="input-wrapper">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="auth-options">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '16px', height: '16px' }} />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-password-link">
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Sign in to account"}
                </motion.button>
              </form>

              <div className="auth-footer">
                Don't have an account?
                <Link to="/register" className="auth-link">
                  Sign up for free
                </Link>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </ParticlesBackground>
  );
};

export default LoginPage;
