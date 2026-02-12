import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../../services/adminService';
import { SettingsSidebar } from '../../components/admin/SettingsSidebar';
import { SettingsSection, SettingsGroup } from '../../components/admin/SettingsSection';
import { SettingsHealth } from '../../components/admin/SettingsHealth';
import {
  Save,
  RefreshCcw,
  ShieldAlert,
  Clock,
  Shield,
  Monitor,
  CheckCircle2
} from 'lucide-react';
import '../../styles/dashboard.css';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    max_image_size_mb: 5,
    max_video_size_mb: 50,
    otp_expiry_minutes: 10,
    primary_engine: 'roboflow',
    fallback_engine: 'yolov8',
    min_confidence: 40,
    detection_timeout: 30,
    max_login_attempts: 5,
    mfa_enforced_for_admins: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const data = await adminService.getSystemHealth();
      setHealth(data);
    } catch (err) {
      console.error("Health check failed", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsData, healthData] = await Promise.all([
        adminService.getSettings(),
        adminService.getSystemHealth()
      ]);

      // Merge with defaults to ensure all fields exist
      setSettings(prev => ({
        ...prev,
        ...settingsData
      }));
      setHealth(healthData);
    } catch (err) {
      console.error("Initialization error:", err);
      setError(err.message || 'Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
        type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setShowSuccess(false);
    try {
      const updated = await adminService.updateSettings(settings);
      setSettings(updated);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-purple-500/20" />
          <div className="absolute top-0 h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!settings && error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 mb-2">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">Initialization Error</h2>
        <p className="text-zinc-500 max-w-md">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-zinc-700"
        >
          <RefreshCcw size={16} />
          Retry Initialization
        </button>
      </div>
    );
  }

  // Final fallback to prevent crash if somehow settings is still null
  if (!settings && !loading) return <div className="text-white">Waiting for system configuration...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Monitor className="text-purple-500" />
            Control Center
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Configure your Ob AI Sentinel system parameters and security policies.</p>
        </motion.div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold"
              >
                <CheckCircle2 size={14} />
                Configuration Saved
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCcw size={18} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-all shadow-lg disabled:opacity-50 ${showSuccess ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                }`}
            >
              {saving ? (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              ) : showSuccess ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Applying...' : showSuccess ? 'Applied' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Settings Content Area */}
        <div className="flex-1 min-h-[500px] border border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none" />

          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <SettingsSection
                id="general"
                title="General Configuration"
                description="Manage core system behavior and operational flags."
              >
                <div className="grid grid-cols-1 gap-8">
                  <SettingsGroup
                    label="Maintenance Mode"
                    description="When enabled, non-admin users cannot access the system."
                    inline
                  >
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="maintenance_mode"
                        checked={settings.maintenance_mode}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 shadow-sm transition-colors group-hover:after:scale-110"></div>
                    </label>
                  </SettingsGroup>

                  <SettingsGroup
                    label="Max Image Upload Size"
                    description="Maximum size allowed for detection images (JPG/PNG/WebP)."
                  >
                    <div className="flex items-center gap-4 max-w-xs">
                      <input
                        type="number"
                        name="max_image_size_mb"
                        value={settings.max_image_size_mb}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                      />
                      <span className="text-zinc-500 text-sm font-medium">MB</span>
                    </div>
                  </SettingsGroup>

                  <SettingsGroup
                    label="Max Video Upload Size"
                    description="Maximum size allowed for detection videos (MP4/AVI/MOV)."
                  >
                    <div className="flex items-center gap-4 max-w-xs">
                      <input
                        type="number"
                        name="max_video_size_mb"
                        value={settings.max_video_size_mb}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                      />
                      <span className="text-zinc-500 text-sm font-medium">MB</span>
                    </div>
                  </SettingsGroup>

                  <SettingsGroup
                    label="OTP Session Lifetime"
                    description="Duration until security codes expire."
                  >
                    <div className="flex items-center gap-4 max-w-xs">
                      <div className="relative w-full">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input
                          type="number"
                          name="otp_expiry_minutes"
                          value={settings.otp_expiry_minutes}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                        />
                      </div>
                      <span className="text-zinc-500 text-sm font-medium whitespace-nowrap">Minutes</span>
                    </div>
                  </SettingsGroup>
                </div>
              </SettingsSection>
            )}

            {activeTab === 'ai' && (
              <SettingsSection
                id="ai"
                title="AI Detection Engine"
                description="Configure the primary and fallback inference models for object detection."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SettingsGroup label="Primary Engine">
                    <select
                      name="primary_engine"
                      value={settings.primary_engine}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer"
                    >
                      <option value="roboflow">Roboflow (Cloud Inference)</option>
                      <option value="yolov8">YOLOv8 (Edge Integration)</option>
                    </select>
                  </SettingsGroup>

                  <SettingsGroup label="Fallback Engine">
                    <select
                      name="fallback_engine"
                      value={settings.fallback_engine}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer"
                    >
                      <option value="roboflow">Roboflow (Cloud Inference)</option>
                      <option value="yolov8">YOLOv8 (Edge Integration)</option>
                      <option value="none">Disabled</option>
                    </select>
                  </SettingsGroup>

                  <SettingsGroup
                    label="Confidence Threshold"
                    description="Minimum probability to report a detection."
                  >
                    <div className="space-y-4 pt-2">
                      <input
                        type="range"
                        name="min_confidence"
                        min="1" max="100"
                        value={settings.min_confidence}
                        onChange={handleChange}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>1% (Aggressive)</span>
                        <span className="text-purple-400 font-bold text-sm bg-purple-500/10 px-2 py-0.5 rounded">{settings.min_confidence}%</span>
                        <span>100% (Strict)</span>
                      </div>
                    </div>
                  </SettingsGroup>

                  <SettingsGroup label="Inference Timeout">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name="detection_timeout"
                        value={settings.detection_timeout}
                        onChange={handleChange}
                        className="w-24 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white font-mono"
                      />
                      <span className="text-zinc-500 text-sm">Seconds</span>
                    </div>
                  </SettingsGroup>
                </div>
              </SettingsSection>
            )}

            {activeTab === 'security' && (
              <SettingsSection
                id="security"
                title="Security Governance"
                description="Manage authentication policies and access control."
              >
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SettingsGroup
                      label="Max Login Attempts"
                      description="Account lock threshold for failed attempts."
                    >
                      <input
                        type="number"
                        name="max_login_attempts"
                        value={settings.max_login_attempts}
                        onChange={handleChange}
                        className="w-32 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white font-mono"
                      />
                    </SettingsGroup>
                  </div>

                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-6">
                    <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                      <Shield size={16} className="text-purple-400" />
                      Administrator Policies
                    </h4>

                    <div className="space-y-4">
                      <div
                        onClick={() => handleChange({ target: { name: 'mfa_enforced_for_admins', type: 'checkbox', checked: !settings.mfa_enforced_for_admins } })}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex gap-4">
                          <div className={`p-2 rounded-lg transition-colors ${settings.mfa_enforced_for_admins ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-600'}`}>
                            <Shield size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Require MFA for Admins</p>
                            <p className="text-xs text-zinc-500">Adds an extra layer of protection to high-privilege accounts.</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${settings.mfa_enforced_for_admins ? 'bg-purple-500 border-purple-500' : 'border-white/10'
                          }`}>
                          {settings.mfa_enforced_for_admins && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                    <ShieldAlert className="text-yellow-500 shrink-0" size={20} />
                    <p className="text-xs text-yellow-500/80 leading-relaxed">
                      Security changes are audited and logged. Any modification to MFA policies will trigger an immediate notification to all active system administrators.
                    </p>
                  </div>
                </div>
              </SettingsSection>
            )}

            {activeTab === 'health' && (
              <SettingsSection
                id="health"
                title="System Health & Infrastructure"
                description="Real-time monitoring of server resources and service dependencies."
              >
                <SettingsHealth health={health} />
              </SettingsSection>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
