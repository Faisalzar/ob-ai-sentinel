import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, email, role, mfaEnabled, ... }
  const [token, setToken] = useState(null); // access token if not using HttpOnly cookies
  const [loading, setLoading] = useState(true);

  // multi-step auth state
  const [authStep, setAuthStep] = useState('idle'); // 'idle' | 'email-otp' | 'mfa'
  const [pendingLogin, setPendingLogin] = useState(null); // { user, token, mfaRequired }
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    // On mount, try to hydrate auth state from storage
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
      } catch (_) {
        // ignore
      }
    }

    // Fetch system settings for maintenance mode check
    const fetchSettings = async () => {
      try {
        const data = await api.get('/system/settings');
        if (data && data.maintenance_mode !== undefined) {
          setMaintenanceMode(data.maintenance_mode);
        }
      } catch (err) {
        // If 503 or network error, might be in maintenance
        if (err.message?.includes('503') || err.message?.includes('maintenance')) {
          setMaintenanceMode(true);
        }
        // Silently ignore errors during public polling to keep logs clean
        if (err.message?.includes('401') || err.message?.includes('Session expired')) {
          setMaintenanceMode(false);
        } else {
          console.warn("Could not fetch system settings", err);
        }
      }
    };

    fetchSettings();

    // Poll for maintenance mode changes every 10 seconds
    const interval = setInterval(fetchSettings, 10000);

    setLoading(false);

    return () => clearInterval(interval);
  }, []);

  const persist = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken || null);
    localStorage.setItem('auth', JSON.stringify({ user: userData, token: accessToken || null }));
  };

  const login = (userData, accessToken) => {
    // finalize login after OTP/MFA
    persist(userData, accessToken);
    setPendingLogin(null);
    setAuthStep('idle');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPendingLogin(null);
    setAuthStep('idle');
    localStorage.removeItem('auth');
  };

  // called after /auth/login succeeds
  const beginLoginFlow = (userData, accessToken, mfaRequired, mfaToken) => {
    setPendingLogin({
      user: userData,
      token: accessToken,
      mfaRequired: !!mfaRequired,
      mfa_token: mfaToken
    });
    // Set appropriate step based on MFA status
    if (mfaRequired) {
      setAuthStep('mfa'); // Skip email OTP if MFA is enabled
    } else {
      setAuthStep('email-otp'); // Require email OTP if MFA is not enabled
    }
  };

  const completeEmailOtp = () => {
    console.log('completeEmailOtp called:', { pendingLogin });
    if (!pendingLogin) {
      console.warn('No pendingLogin found!');
      return;
    }
    if (pendingLogin.mfaRequired) {
      console.log('MFA required, setting authStep to mfa');
      setAuthStep('mfa');
    } else {
      console.log('No MFA required, calling login with user:', pendingLogin.user);
      login(pendingLogin.user, pendingLogin.token);
    }
  };

  const completeMfa = (userData, accessToken) => {
    if (!pendingLogin) return;

    // If specific data provided (e.g. from recovery), use it. Otherwise use pending.
    const finalUser = userData || pendingLogin.user;
    const finalToken = accessToken || pendingLogin.token;

    login(finalUser, finalToken);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    role: user?.is_admin ? 'admin' : user ? 'user' : 'guest',
    authStep,
    pendingLogin,
    beginLoginFlow,
    completeEmailOtp,
    completeMfa,
    maintenanceMode,
    setMaintenanceMode,
    updateUser: (updates) => {
      const newUser = { ...user, ...updates };
      setUser(newUser);
      localStorage.setItem('auth', JSON.stringify({ user: newUser, token }));
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
