import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import api from '../lib/api';

const AdminLayout = ({ children }) => {
  const admin = useStore((state) => state.admin);
  const logout = useStore((state) => state.logout);
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();

  useEffect(() => {
    fetchNotifications();
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/dashboard/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { to: '/admin/dashboard', icon: 'dashboard', label: 'ड्यासबोर्ड' },
    { to: '/admin/staff', icon: 'groups', label: 'कर्मचारी व्यवस्थापन' },
    { to: '/admin/attendance', icon: 'description', label: 'हाजिरी रिपोर्ट' },
    { to: '/admin/monthly-report', icon: 'calendar_month', label: 'मासिक रिपोर्ट' },
    { to: '/admin/settings', icon: 'settings', label: 'प्रणाली सेटिङहरू' },
  ];

  return (
    <div className="antialiased overflow-x-hidden text-on-surface min-h-screen relative bg-surface">
      {/* Background Glass Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar Navigation Shell */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface/60 backdrop-blur-2xl border-r border-outline-variant z-40 hidden md:flex flex-col py-margin-edge gap-base shadow-2xl print:hidden">
        <div className="px-admin-gutter mb-8">
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase drop-shadow-md">प्रशासनिक टर्मिनल</h1>
          <p className="font-label-caps text-label-caps text-on-surface-variant mt-2 tracking-widest">स्टाफट्र्याक संस्करण २.४</p>
        </div>
        <nav className="flex flex-col gap-2 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-base px-4 py-3 rounded-lg transition-all duration-300 ease-in-out ${
                  isActive
                    ? 'text-primary font-bold bg-primary/10 shadow-inner'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:pl-6'
                }`
              }
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{item.icon}</span>
              <span className="font-label-caps text-label-caps tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-admin-gutter space-y-4">
           <div className="p-4 bg-surface-container/50 backdrop-blur-md rounded-xl border border-outline-variant shadow-inner">
            <p className="font-technical-sm text-technical-sm text-on-surface mb-2 uppercase">प्रणाली स्थिति</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse-ring shadow-[0_0_10px_var(--color-secondary)]"></div>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">बायोमेट्रिक सक्रिय</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white transition-colors rounded-xl font-label-caps uppercase tracking-widest shadow-sm hover:shadow-lg"
          >
            <span className="material-symbols-outlined">logout</span>
            लगआउट गर्नुहोस्
          </button>
        </div>
      </aside>

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 md:left-[280px] right-0 h-[72px] bg-surface/70 backdrop-blur-xl border-b border-outline-variant flex justify-between items-center px-margin-edge z-30 w-full transition-colors duration-300 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-inner">
            <span className="material-symbols-outlined text-primary">fingerprint</span>
          </div>
          <span className="font-headline-lg-mobile text-[24px] leading-[1.2] font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">स्टाफट्र्याक</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative cursor-pointer hover:bg-surface-container-high p-2 rounded-full transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              {unreadCount > 0 && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface animate-pulse"></div>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-surface/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-outline-variant overflow-hidden animate-fade-in origin-top-right">
                <div className="p-4 border-b border-outline-variant bg-surface-container/50">
                  <h3 className="font-headline-lg text-[16px]">सूचनाहरू</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant font-technical-sm">
                      कुनै नयाँ सूचना छैन
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-outline-variant/50 hover:bg-surface-container/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-start gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'absence' ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'}`}>
                             <span className="material-symbols-outlined text-[16px]">{n.type === 'absence' ? 'person_off' : 'notifications_active'}</span>
                           </div>
                           <div>
                             <p className="font-headline-lg text-[14px] leading-tight mb-1">{n.title}</p>
                             <p className="font-body-md text-sm text-on-surface-variant line-clamp-2">{n.message}</p>
                             <p className="font-technical-sm text-[10px] text-on-surface-variant/70 mt-2">
                               {new Date(n.created_at).toLocaleTimeString('ne-NP', { hour: '2-digit', minute:'2-digit' })}
                             </p>
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 border-l border-outline-variant pl-6">
            <div className="text-right hidden sm:block">
              <p className="font-label-caps text-label-caps text-primary tracking-wide">{admin?.email}</p>
              <p className="font-technical-sm text-[10px] text-on-surface-variant uppercase tracking-widest">सुपरिवेक्षक</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-surface-container-high flex items-center justify-center overflow-hidden shadow-inner">
               <span className="material-symbols-outlined text-primary">shield_person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="relative z-10 pt-[88px] md:pl-[312px] md:pr-margin-edge pb-[80px] md:pb-margin-edge min-h-screen print:pt-0 print:pl-0 print:pr-0 print:pb-0 print:m-0">
        {children}
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-[72px] bg-surface/80 backdrop-blur-2xl border-t border-outline-variant z-50 transition-all duration-150 pb-safe print:hidden">
        {navItems.map((item) => (
           <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 transition-transform duration-300 ${
                  isActive
                    ? 'text-primary scale-110 drop-shadow-md'
                    : 'text-on-surface-variant scale-90 hover:scale-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-12 h-10 flex items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-primary/20' : 'bg-transparent'}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                  </div>
                  <span className={`font-technical-sm text-[10px] mt-1 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
                </>
              )}
           </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AdminLayout;
