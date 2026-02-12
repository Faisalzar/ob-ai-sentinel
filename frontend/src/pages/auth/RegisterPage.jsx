
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Cpu,
  Palette,
  Users,
  Cloud
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ParticlesBackground from '../../components/reactbits/ParticlesBackground';
import "./Auth.css";

const RegisterPage = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Auth Guard: Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && user) {
      if (role === 'admin') navigate('/admin/dashboard');
      else navigate('/user/dashboard');
    }
  }, [user, authLoading, role, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const apiData = {
        name: `${formData.name} ${formData.lastname}`,
        email: formData.email,
        password: formData.password
      };

      // Use authService instead of direct fetch
      // This handles the API URL correctly via apiConfig
      const data = await authService.register(apiData);

      // authService.register returns the data directly (apiClient handles response.json())
      // so we don't need independent response checking here as apiClient throws on error

      navigate("/login", { state: { message: "Account created! Please log in." } });

    } catch (err) {
      console.error("Register Error:", err);

      // Handle Maintenance Mode (503)
      if (err.message?.includes("503") || err.message?.includes("maintenance")) {
        navigate("/maintenance");
        return;
      }

      setError(err.message || "Registration failed.");
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
              Join the Future of Security
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.6 }}>
              Create an account to start monitoring your premises with state-of-the-art AI object detection.
            </p>

            <div className="brand-feature-list">
              {[
                {
                  icon: <Palette size={20} />,
                  title: 'Customizable Dashboards',
                  desc: 'Tailor your monitoring view to your specific needs'
                },
                {
                  icon: <Users size={20} />,
                  title: 'Team Collaboration',
                  desc: 'Share alerts and clips with your security personnel'
                },
                {
                  icon: <Cloud size={20} />,
                  title: 'Secure Cloud Storage',
                  desc: 'Encrypted storage for all your detection events'
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
                <h2>Create Account</h2>
                <p>Start your 14-day free trial</p>
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

              <form onSubmit={handleRegister} className="auth-form">
                <div className="form-row-grid">
                  <div className="input-wrapper">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>First Name</label>
                    <div style={{ position: 'relative' }}>
                      <User className="input-icon" />
                      <input
                        type="text"
                        name="name"
                        placeholder="John"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-wrapper">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Last Name</label>
                    <div style={{ position: 'relative' }}>
                      <User className="input-icon" />
                      <input
                        type="text"
                        name="lastname"
                        placeholder="Doe"
                        value={formData.lastname}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="input-wrapper">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="john.doe@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-wrapper">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
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

                <div className="input-wrapper">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
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
                  {loading ? "Creating Account..." : "Create Account"}
                </motion.button>
              </form>

              <div className="auth-footer">
                Already have an account?
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </ParticlesBackground>
  );
};

export default RegisterPage;
