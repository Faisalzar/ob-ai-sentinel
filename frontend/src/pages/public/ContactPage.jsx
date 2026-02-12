import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Shield,
  Clock,
  Lock,
  Building,
  CheckCircle,
  Server,
  Send,
  AlertTriangle,
  Loader
} from 'lucide-react';
import ParticlesBackground from '../../components/reactbits/ParticlesBackground';
import Earth from '../../components/ui/globe';
import GradualBlur from '../../components/reactbits/GradualBlur';
import TargetCursor from '../../components/reactbits/TargetCursor';
import ScrambledText from '../../components/reactbits/ScrambledText';
import ElectricBorder from '../../components/reactbits/ElectricBorder';
import { sendContactMessage } from '../../services/contactService';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    try {
      setStatus('loading');
      await sendContactMessage(formData);
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        organization: '',
        subject: 'General Inquiry',
        message: ''
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setStatus('error');
      setErrorMessage(error.detail || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div className="contact-page relative w-full overflow-hidden">
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />

      <GradualBlur
        preset="page-footer"
        strength={4}
        opacity={0.7}
        zIndex={5}
      />

      {/* Background Particles */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15 }}>
        <ParticlesBackground color="rgba(168,85,247,0.4)" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-16 md:py-24">
        {/* Main Glass Card */}
        <div className="contact-card border bg-secondary/20 mx-auto max-w-5xl overflow-hidden rounded-[28px] border shadow-xl backdrop-blur-sm">
          <div className="grid md:grid-cols-2">

            {/* LEFT: FORM SECTION */}
            <div className="relative p-6 md:p-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex w-full gap-2 mb-8 items-end"
              >
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl" style={{
                  background: 'linear-gradient(to right, #fff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Contact
                </h2>
                <span className="text-4xl font-bold tracking-tight italic md:text-5xl" style={{ color: '#0ea5e9' }}>
                  Us
                </span>
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <motion.div className="space-y-2">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="sentinel-input w-full"
                      placeholder="Enter your name"
                      required
                    />
                  </motion.div>

                  <motion.div className="space-y-2">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="sentinel-input w-full"
                      placeholder="Enter your email"
                      required
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <motion.div className="space-y-2">
                    <label className="form-label">Organization</label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      className="sentinel-input w-full"
                      placeholder="Company Name"
                    />
                  </motion.div>

                  <motion.div className="space-y-2">
                    <label className="form-label">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="sentinel-input w-full"
                    >
                      <option>General Inquiry</option>
                      <option>Technical Support</option>
                      <option>Security Concern</option>
                      <option>Enterprise / Deployment</option>
                    </select>
                  </motion.div>
                </div>

                <motion.div className="space-y-2">
                  <label className="form-label">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="sentinel-input w-full h-40 resize-none"
                    placeholder="Enter your message"
                    required
                  ></textarea>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full submit-btn-gradient cursor-target"
                    style={{ position: 'relative', overflow: 'hidden' }}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader size={18} className="animate-spin" /> Sending...
                      </span>
                    ) : status === 'success' ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Message Sent!
                      </span>
                    ) : (
                      <span>Send Message</span>
                    )}
                  </button>
                </motion.div>
              </motion.form>
            </div>

            {/* RIGHT: ART SECTION */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative my-8 flex items-center justify-center overflow-hidden md:pr-8"
            >
              <div className="flex flex-col items-center justify-center overflow-hidden w-full h-full">
                <article className="relative mx-auto w-full h-full min-h-[400px] max-w-[450px] overflow-hidden rounded-3xl border bg-gradient-to-b from-[#0ea5e9] to-[#0ea5e9]/5 p-6 text-3xl tracking-tight text-white md:p-8 md:text-3xl lg:text-4xl flex flex-col justify-between"
                  style={{
                    background: 'linear-gradient(180deg, #e60a64 0%, rgba(230, 10, 100, 0.05) 100%)',
                    borderColor: 'rgba(230, 10, 100, 0.2)'
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <p style={{ fontWeight: 600, lineHeight: 1.2 }}>Presenting you with the best AI security possible.</p>
                  </div>

                  <div className="absolute -right-20 -bottom-20 z-0 mx-auto flex h-full w-full max-w-[300px] items-center justify-center transition-all duration-700 hover:scale-105 md:-right-28 md:-bottom-28 md:max-w-[550px]" style={{ opacity: 0.8 }}>
                    {/* Cobe Earth Implementation */}
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Earth
                        scale={0.85}
                        baseColor={[1, 0, 0.3]} // Pink
                        markerColor={[0, 0, 0]}
                        glowColor={[1, 0.3, 0.4]}
                      />
                    </div>
                  </div>
                </article>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Security & Privacy Section */}
      <section className="security-section">
        <div className="security-container">
          <motion.div
            className="security-title"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Security & Privacy Standards</h2>
          </motion.div>

          <div className="security-grid">
            <ElectricBorder color="#a855f7" className="security-item cursor-target">
              <Lock size={32} className="rb-text-purple-400" />
              <h4>Encrypted Communication</h4>
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <ScrambledText
                  radius={80}
                  duration={1.0}
                  speed={0.5}
                  scrambleChars="!<>-_\\/[]{}—=+*^?#________"
                  className="rb-text-sm rb-text-gray-400"
                  style={{ margin: 0, padding: 0 }}
                >
                  All data is transmitted via TLS 1.3.
                </ScrambledText>
              </div>
            </ElectricBorder>

            <ElectricBorder color="#3b82f6" className="security-item cursor-target">
              <Server size={32} className="rb-text-blue-400" />
              <h4>Secure Storage</h4>
              <p>Submissions stored in fortified, isolated databases.</p>
            </ElectricBorder>

            <ElectricBorder color="#22c55e" className="security-item cursor-target">
              <Shield size={32} className="rb-text-green-400" />
              <h4>No Third-Party Sharing</h4>
              <p>Your contact details are strictly confidential.</p>
            </ElectricBorder>

            <ElectricBorder color="#ef4444" className="security-item cursor-target">
              <CheckCircle size={32} className="rb-text-red-400" />
              <h4>Audit Logging</h4>
              <p>Every interaction is logged for compliance.</p>
            </ElectricBorder>
          </div>
        </div>
      </section>


    </div>
  );
};

export default ContactPage;
