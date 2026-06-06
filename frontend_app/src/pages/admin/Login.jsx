import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAdmin = useStore((state) => state.setAdmin);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        setAdmin(response.data.user, response.data.token);
        
        // Route based on role
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/kiosk');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or server error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col md:flex-row antialiased text-on-surface animate-fade-in">
      {/* Branding Section */}
      <div className="flex-1 bg-surface-container flex flex-col items-center justify-center p-margin-edge border-b md:border-b-0 md:border-r border-outline-variant relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)]"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-surface/80 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-primary mb-8 shadow-lg">
            <span className="material-symbols-outlined text-[48px] text-primary">fingerprint</span>
          </div>
          <h1 className="font-headline-lg text-display-lg text-primary mb-4 tracking-tight drop-shadow-md">स्टाफट्र्याक</h1>
          <p className="font-body-md text-on-surface-variant max-w-sm">
            मारुती टेक्सटाइल अम्पायरको लागि सुरक्षित अनुहार पहिचान र हाजिरी व्यवस्थापन प्रणाली।
          </p>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex-1 bg-surface/90 backdrop-blur-xl flex items-center justify-center p-margin-edge">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <h2 className="font-headline-lg text-headline-lg mb-2">प्रणाली पहुँच</h2>
            <p className="font-technical-sm text-on-surface-variant uppercase tracking-widest">प्रशासक र किओस्क टर्मिनल</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-error-container/80 backdrop-blur-sm text-on-error-container p-4 rounded-lg flex items-center gap-3 border border-error/20 shadow-sm animate-fade-in">
                <span className="material-symbols-outlined text-error">error</span>
                <span className="font-body-md text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block font-label-caps text-on-surface-variant uppercase mb-2">इमेल ठेगाना</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-touch-target bg-surface-container/50 backdrop-blur-sm pl-12 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md shadow-inner"
                  placeholder="admin@maruti.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-label-caps text-on-surface-variant uppercase mb-2">पासवर्ड</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-touch-target bg-surface-container/50 backdrop-blur-sm pl-12 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-touch-target mt-8 bg-gradient-to-r from-primary to-primary/80 text-on-primary font-label-caps uppercase tracking-widest rounded-lg hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined">login</span>
              )}
              {isLoading ? 'प्रमाणीकरण गर्दै...' : 'पहुँच अनलक गर्नुहोस्'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
