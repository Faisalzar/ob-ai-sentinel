import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ProfileCard from '../../components/ui/ProfileCard';
import SpotlightCard from '../../components/reactbits/SpotlightCard';
import '../../styles/profile.css';

const ProfileSecurityPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMessage, setMfaMessage] = useState({ text: '', type: '' });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setMfaEnabled(user.mfa_enabled || false);
    }
  }, [user]);

  // Check URL hash for MFA section
  useEffect(() => {
    if (window.location.hash === '#mfa') {
      setActiveTab('security');
    }
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match', type: 'error' });
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ text: 'Password must be at least 8 characters', type: 'error' });
      setPasswordLoading(false);
      return;
    }

    try {
      await api.post('/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordMessage({ text: error.message, type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEnableMfa = async () => {
    setMfaLoading(true);
    setMfaMessage({ text: '', type: '' });

    try {
      const data = await api.post('/auth/enable-mfa', {});

      // Backend returns qr_code_uri (otpauth://...), convert to QR code image
      const qrCodeUri = data.qr_code_uri || data.qr_code || '';

      if (qrCodeUri) {
        // Use a QR code API service to generate the image
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUri)}`;
        setQrCodeUrl(qrImageUrl);
        setShowQrCode(true);
        setMfaMessage({ text: 'Scan the QR code with your authenticator app', type: 'info' });
      } else {
        setMfaMessage({ text: 'Failed to generate QR code', type: 'error' });
      }
    } catch (error) {
      setMfaMessage({ text: error.message, type: 'error' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaMessage({ text: '', type: '' });

    try {
      await api.post('/auth/confirm-mfa', { token: mfaCode });
      setMfaEnabled(true);
      setShowQrCode(false);
      setMfaCode('');
      setMfaMessage({ text: 'MFA enabled successfully!', type: 'success' });
    } catch (error) {
      setMfaMessage({ text: error.message, type: 'error' });
    } finally {
      setMfaLoading(false);
    }
  };

  const [disablePassword, setDisablePassword] = useState('');

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    setMfaLoading(true);
    setMfaMessage({ text: '', type: '' });

    try {
      await api.post('/auth/disable-mfa', { password: disablePassword });
      setMfaEnabled(false);
      setMfaMessage({ text: 'MFA disabled successfully', type: 'success' });
      setDisablePassword('');
    } catch (error) {
      setMfaMessage({ text: error.message, type: 'error' });
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="profile-page animate-fade-in-up">
      <div className="profile-header">
        <h1>Profile & Security</h1>
        <p className="profile-subtitle">Manage your account identity and secure your access credentials</p>
      </div>

      <div className="profile-tabs-container">
        <button
          className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Details
        </button>
        <button
          className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security Settings
        </button>
      </div>

      <div className="profile-content-container" style={{ marginTop: '2rem' }}>

        {/* PROFILE TAB CONTENT */}
        {activeTab === 'profile' && (
          <div className="profile-tab-content animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <div style={{ width: '100%', maxWidth: '500px' }}>
                <ProfileCard
                  name={fullName || user?.name || 'User'}
                  title="Security Professional"
                  handle={email?.split('@')[0] || 'user'}
                  email={email}
                  status="Active"
                  contactText="Edit Profile"
                  showUserInfo={true}
                  enableTilt={true}
                  enableMobileTilt={false}
                  editable={true}
                  onSave={async (data) => {
                    console.log('ProfileCard onSave called with:', data);
                    setProfileLoading(true);
                    setProfileMessage({ text: '', type: '' });
                    try {
                      // Use Auth endpoint as fallback since user endpoint might 404
                      console.log('Sending PUT request to /auth/update-profile...');
                      const response = await api.put('/auth/update-profile', { name: data.name });
                      console.log('API Response:', response);

                      setFullName(data.name);
                      updateUser({ name: data.name }); // Update global state
                      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
                    } catch (error) {
                      console.error('Profile update failed:', error);
                      setProfileMessage({ text: error.message || 'Failed to update profile', type: 'error' });
                    } finally {
                      setProfileLoading(false);
                    }
                  }}
                  behindGlowEnabled={true}
                  behindGlowColor="rgba(14, 165, 233, 0.4)"
                  behindGlowSize="60%"
                />

                {profileMessage.text && (
                  <div className={`alert alert-${profileMessage.type} mt-4`} style={{ marginTop: '1rem' }}>
                    {profileMessage.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB CONTENT */}
        {activeTab === 'security' && (
          <div className="security-tab-content animate-fade-in-up">
            <div className="security-grid">

              {/* Password Change Card */}
              <SpotlightCard className="security-card" spotlightColor="rgba(0, 229, 255, 0.2)">
                <div className="security-card-header-new">
                  <div className="sc-icon-wrapper">
                    <span role="img" aria-label="lock" style={{ fontSize: '1.5rem' }}>🔒</span>
                  </div>
                  <div className="sc-title-group">
                    <h3>Password Security</h3>
                    <p>Update your access credentials</p>
                  </div>
                </div>

                <div className="security-card-body">
                  {passwordMessage.text && (
                    <div className={`alert alert-${passwordMessage.type}`}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        id="currentPassword"
                        type="password"
                        className="sentinel-input"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        id="newPassword"
                        type="password"
                        className="sentinel-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        minLength={8}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        className="sentinel-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={passwordLoading}
                        style={{ width: '100%' }}
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </SpotlightCard>

              {/* MFA Card */}
              <SpotlightCard className="security-card" id="mfa" spotlightColor="rgba(0, 229, 255, 0.2)">
                <div className="security-card-header-new">
                  <div className="sc-icon-wrapper">
                    <span role="img" aria-label="shield" style={{ fontSize: '1.5rem' }}>🛡️</span>
                  </div>
                  <div className="sc-title-group">
                    <h3>Two-Factor Auth</h3>
                    <p>Secure account access</p>
                  </div>
                </div>

                <div className="security-card-body">
                  <div className={`mfa-visual-status ${mfaEnabled ? 'enabled' : 'disabled'}`}>
                    <span style={{ fontWeight: 600 }}>Status:</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                      {mfaEnabled ? 'ACTIVE' : 'INACTIVE'}
                      <span className={`h-2 w-2 rounded-full ${mfaEnabled ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    </span>
                  </div>

                  {mfaMessage.text && (
                    <div className={`alert alert-${mfaMessage.type}`}>
                      {mfaMessage.text}
                    </div>
                  )}

                  {!mfaEnabled ? (
                    !showQrCode ? (
                      <div className="text-center space-y-4">
                        <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.95rem' }}>
                          Add an extra layer of security. We'll ask for a code from your authenticator app when you login.
                        </p>
                        <button
                          onClick={handleEnableMfa}
                          className="btn-primary"
                          disabled={mfaLoading}
                          style={{ width: '100%' }}
                        >
                          {mfaLoading ? 'Initializing...' : 'Enable 2FA'}
                        </button>
                      </div>
                    ) : (
                      <div className="mfa-setup-container" style={{ textAlign: 'center' }}>
                        <div className="qr-code-wrapper">
                          {qrCodeUrl && (
                            <img src={qrCodeUrl} alt="MFA QR Code" width="180" height="180" style={{ display: 'block' }} />
                          )}
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                          Scan with Google Authenticator or Authy
                        </p>

                        <div className="verification-input-group">
                          <input
                            type="text"
                            className="verification-input"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value)}
                            placeholder="000 000"
                            maxLength={6}
                            autoFocus
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              setShowQrCode(false);
                              setQrCodeUrl('');
                              setMfaMessage({ text: '', type: '' });
                            }}
                            className="btn-secondary"
                            disabled={mfaLoading}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#cbd5e1',
                              padding: '0.75rem',
                              borderRadius: '8px',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleVerifyMfa}
                            className="btn-primary"
                            disabled={mfaLoading}
                          >
                            {mfaLoading ? '...' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        Your account is currently protected with Two-Factor Authentication.
                      </p>

                      <form onSubmit={handleDisableMfa} className="pt-4 border-t border-white/5">
                        <h4 style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                          Disable 2FA
                        </h4>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <input
                            type="password"
                            className="sentinel-input"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            placeholder="Confirm Password"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn-danger"
                          disabled={mfaLoading}
                          style={{ width: '100%' }}
                        >
                          {mfaLoading ? 'Processing...' : 'Disable'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </SpotlightCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSecurityPage;
