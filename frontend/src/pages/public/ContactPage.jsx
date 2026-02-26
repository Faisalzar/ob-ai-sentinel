import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import Earth from '../../components/ui/globe';
import { Label } from '../../components/ui/label';
import { Check, Loader2, Shield, Lock, CheckCircle, Server } from 'lucide-react';

import ParticlesBackground from '../../components/reactbits/ParticlesBackground';
import TargetCursor from '../../components/reactbits/TargetCursor';
import ScrambledText from '../../components/reactbits/ScrambledText';
import ElectricBorder from '../../components/reactbits/ElectricBorder';
import { sendContactMessage } from '../../services/contactService';
import './ContactPage.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const formRef = useRef(null);
  const isInView = useInView(formRef, { once: true, amount: 0.3 });

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
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setStatus('error');
      setErrorMessage(error.detail || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div className="contact-page relative w-full overflow-hidden min-h-screen bg-background text-foreground">
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />
      {/* Background Particles replacing SparklesCore for consistency */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <ParticlesBackground color="rgba(230,10,100,0.4)" />
      </div>

      <section className="relative w-full py-16 md:py-24">
        <div
          className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, #e60a64, transparent 70%)`,
          }}
        />
        <div
          className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full opacity-10 blur-[100px] pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, #e60a64, transparent 70%)`,
          }}
        />

        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="border-border/40 bg-secondary/20 mx-auto max-w-5xl overflow-hidden rounded-[28px] border shadow-xl backdrop-blur-sm">
            <div className="grid md:grid-cols-2">
              <div className="relative p-6 md:p-10" ref={formRef}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex w-full gap-2 mb-8 items-end"
                >
                  <h2 className="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
                    Contact
                  </h2>
                  <span className="text-[#e60a64] relative z-10 text-4xl font-bold tracking-tight italic md:text-5xl">
                    Us
                  </span>
                </motion.div>

                {errorMessage && status === 'error' && (
                  <div className="text-red-500 mb-4 text-sm">{errorMessage}</div>
                )}

                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.5, delay: 0.3 }}
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        className="bg-transparent border-border text-foreground"
                        required
                      />
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className="bg-transparent border-border text-foreground"
                        required
                      />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                    >
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        name="organization"
                        type="text"
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="Company Name"
                        className="bg-transparent border-border text-foreground"
                      />
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                    >
                      <Label htmlFor="subject">Subject</Label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                      >
                        <option value="General Inquiry" className="bg-background text-foreground">General Inquiry</option>
                        <option value="Technical Support" className="bg-background text-foreground">Technical Support</option>
                        <option value="Security Concern" className="bg-background text-foreground">Security Concern</option>
                        <option value="Enterprise / Deployment" className="bg-background text-foreground">Enterprise / Deployment</option>
                      </select>
                    </motion.div>
                  </div>

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Enter your message"
                      required
                      className="h-40 resize-none bg-transparent border-border text-foreground"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full"
                  >
                    <Button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-gradient-to-b from-[#e60a64] to-[#b3084e] text-white hover:opacity-90 transition-opacity border-none cursor-target"
                    >
                      {status === 'loading' ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </span>
                      ) : status === 'success' ? (
                        <span className="flex items-center justify-center">
                          <Check className="mr-2 h-4 w-4" />
                          Message Sent!
                        </span>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              </div>

              {/* RIGHT: ART SECTION WITH THE REQUESTED GLOBE WRAPPER */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="relative my-8 flex items-center justify-center overflow-hidden pr-8"
              >
                <div className="flex flex-col items-center justify-center overflow-hidden w-full h-full">
                  <article className="relative mx-auto h-[350px] min-h-60 max-w-[450px] overflow-hidden rounded-3xl border bg-gradient-to-b from-[#e60a64] to-[#e60a64]/5 p-6 text-3xl tracking-tight text-white md:h-[450px] md:min-h-80 md:p-8 md:text-4xl md:leading-[1.05] lg:text-5xl"
                    style={{ borderColor: 'rgba(230, 10, 100, 0.2)' }}
                  >
                    <div style={{ position: 'relative', zIndex: 10 }}>
                      Presenting you with the best AI security possible.
                    </div>

                    <div className="absolute -right-20 -bottom-20 z-10 mx-auto flex h-full w-full max-w-[300px] items-center justify-center transition-all duration-700 hover:scale-105 md:-right-28 md:-bottom-28 md:max-w-[550px]">
                      <Earth
                        scale={1.1}
                        baseColor={[1, 0, 0.3]} // Deep red/pink
                        markerColor={[0, 0, 0]}
                        glowColor={[1, 0.3, 0.4]}
                      />
                    </div>
                  </article>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy Section based on previous styling */}
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
}
