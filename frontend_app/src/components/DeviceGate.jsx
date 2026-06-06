import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getDeviceToken, setDeviceToken } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const DeviceGate = ({ children }) => {
  const [deviceAuthorized, setDeviceAuthorized] = useState(null); // null = loading
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  // Check device status on mount
  useEffect(() => {
    checkDevice();

    // Listen for device-blocked events from the API interceptor
    const handler = () => {
      setDeviceAuthorized(false);
      checkDevice();
    };
    window.addEventListener('device-blocked', handler);
    return () => window.removeEventListener('device-blocked', handler);
  }, []);

  async function checkDevice() {
    try {
      const token = getDeviceToken();
      const res = await axios.get(`${API_BASE}/devices/status`, {
        headers: token ? { 'X-Device-Token': token } : {},
      });
      setDeviceAuthorized(res.data.currentDeviceAuthorized);
    } catch (err) {
      console.error('Device check failed:', err);
      // If server is down, allow through (so dev doesn't get locked out)
      if (!err.response) {
        setDeviceAuthorized(true);
      } else {
        setDeviceAuthorized(false);
      }
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setRegistering(true);

    try {
      const res = await axios.post(`${API_BASE}/devices/register`, {
        passcode,
      });
      if (res.data.success) {
        setDeviceToken(res.data.token);
        setDeviceAuthorized(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'दर्ता असफल भयो');
    } finally {
      setRegistering(false);
    }
  }

  // Loading state
  if (deviceAuthorized === null) {
    return (
      <div className="min-h-[100dvh] bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">sync</span>
          <p className="font-technical-sm text-on-surface-variant uppercase tracking-widest">उपकरण प्रमाणीकरण जाँच...</p>
        </div>
      </div>
    );
  }

  // Authorized → render the app
  if (deviceAuthorized) {
    return children;
  }

  // NOT authorized → render the device registration gate
  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col items-center justify-center p-6 antialiased text-on-surface animate-fade-in">
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-error/20 blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 bg-error/10 border-2 border-error/40 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-error/10">
            <span className="material-symbols-outlined text-[56px] text-error">shield_lock</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-center mb-2">🔒 उपकरण प्रतिबन्ध</h1>
          <p className="font-body-md text-on-surface-variant text-center max-w-sm">
            यो प्रणाली केवल अधिकृत उपकरणहरूबाट मात्र पहुँच गर्न सकिन्छ। कृपया तपाईंको उपकरण दर्ता गर्नुहोस्।
          </p>
        </div>

        <form onSubmit={handleRegister} className="bg-surface-container border border-outline-variant rounded-xl p-6 shadow-lg animate-fade-in">
          <h2 className="font-label-caps text-on-surface-variant uppercase mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">key</span>
            सुरक्षा पासकोड प्रविष्ट गर्नुहोस्
          </h2>

          {error && (
            <div className="bg-error-container/80 text-on-error-container p-3 rounded-lg flex items-center gap-2 border border-error/20 mb-4 animate-fade-in">
              <span className="material-symbols-outlined text-error text-lg">warning</span>
              <span className="font-body-md text-sm">{error}</span>
            </div>
          )}

          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">password</span>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full h-touch-target bg-surface/50 pl-12 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md"
              placeholder="उपकरण पासकोड..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={registering}
            className="w-full h-touch-target bg-gradient-to-r from-primary to-primary/80 text-on-primary font-label-caps uppercase tracking-widest rounded-lg hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {registering ? (
              <span className="material-symbols-outlined animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined">verified_user</span>
            )}
            {registering ? 'दर्ता गर्दै...' : 'यो उपकरण दर्ता गर्नुहोस्'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="font-technical-sm text-on-surface-variant/40 uppercase tracking-widest text-[10px]">
            मारुती टेक्सटाइल अम्पायर • सुरक्षित उपकरण लक प्रणाली
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeviceGate;
