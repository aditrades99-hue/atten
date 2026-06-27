import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import useStore from '../../store/useStore';
import FaceVerify from './FaceVerify';
import AbsenceReport from './AbsenceReport';
import { loadModels } from '../../lib/faceapi';

const KioskHome = () => {
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modals
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null); // 'arrived', 'lunch_out', 'lunch_return', 'departed'
  const [showReportModal, setShowReportModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null); // staff_id

  const navigate = useNavigate();

  useEffect(() => {
    // Preload models in background to make verification faster
    loadModels().catch(console.error);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchData();
    // Refresh data every 30 seconds to keep kiosk synced
    const syncTimer = setInterval(fetchData, 30000);
    return () => {
      clearInterval(timer);
      clearInterval(syncTimer);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, attRes] = await Promise.all([
        api.get('/staff'),
        api.get('/attendance')
      ]);
      setStaff(staffRes.data);
      setAttendance(attRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStaffStatus = (staffId) => {
    const record = attendance.find(a => a.staff_id === staffId);
    if (!record) return { status: 'absent', label: 'अनुपस्थित', color: 'bg-outline text-on-surface' };
    
    switch (record.status) {
      case 'present_morning':
      case 'present_afternoon':
      case 'present': return { status: 'present', label: 'उपस्थित', color: 'bg-secondary text-on-primary border-secondary shadow-[0_0_15px_rgba(138,154,91,0.4)]' };
      case 'on_lunch': return { status: 'lunch', label: 'खाजा समय', color: 'bg-primary text-on-primary border-primary' };
      case 'departed': return { status: 'departed', label: 'प्रस्थान', color: 'bg-surface-container-high text-on-surface-variant border-outline' };
      default: return { status: 'absent', label: 'अनुपस्थित', color: 'bg-outline text-on-surface' };
    }
  };

  const handleActionSelect = (staffMember, action) => {
    setSelectedStaff(staffMember);
    setSelectedAction(action);
    setShowActionMenu(null);
  };

  const handleVerificationSuccess = (newStatus) => {
    setSelectedStaff(null);
    setSelectedAction(null);
    fetchData(); // Refresh grid
  };

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col antialiased text-on-surface selection:bg-primary/20 animate-fade-in">
      {/* Kiosk Header */}
      <header className="h-[100px] bg-surface-container border-b border-outline-variant flex justify-between items-center px-margin-edge shadow-sm z-10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--color-primary)_0%,_transparent_40%)] opacity-5"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center border-2 border-primary shadow-sm">
            <span className="material-symbols-outlined text-primary text-3xl">fingerprint</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-wider leading-none">स्टाफट्र्याक</h1>
            <p className="font-technical-sm text-on-surface-variant tracking-[0.2em] uppercase mt-1">मारुती टेक्सटाइल अम्पायर</p>
          </div>
        </div>
        <div className="text-right relative z-10">
          <p className="font-display-lg text-[40px] text-on-surface tabular-nums tracking-tight leading-none">
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="font-label-caps text-on-surface-variant tracking-widest uppercase mt-1">
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Staff Grid Canvas */}
      <main className="flex-1 p-margin-edge overflow-y-auto bg-background">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-kiosk-gap max-w-[1600px] mx-auto">
          {staff.map(s => {
            const statusInfo = getStaffStatus(s.id);
            const isMenuOpen = showActionMenu === s.id;
            
            return (
              <div key={s.id} className="relative group perspective-1000">
                <div 
                  className={`
                    relative h-[300px] rounded-xl overflow-hidden border-2 transition-all duration-300 transform-style-3d
                    ${isMenuOpen ? 'scale-[1.02] shadow-xl z-20 border-primary' : 'border-outline-variant shadow-sm hover:scale-[1.02] hover:shadow-md'}
                    ${statusInfo.color}
                  `}
                >
                  {/* Base Card Content */}
                  <div className={`absolute inset-0 flex flex-col p-4 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                      <div className="w-24 h-24 rounded-full border-4 border-surface/50 overflow-hidden bg-surface shadow-inner shrink-0">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-container">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant">person</span>
                          </div>
                        )}
                      </div>
                      <div className="text-center w-full px-2">
                        <p className="font-headline-lg text-[22px] font-bold truncate leading-tight">{s.name}</p>
                        <p className="font-technical-sm text-xs opacity-80 uppercase tracking-widest mt-1 truncate">{s.role || 'स्टाफ'}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setShowActionMenu(s.id)}
                      className="w-full h-12 mt-4 bg-surface text-on-surface rounded-lg font-label-caps uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface-container transition-colors shadow-sm cursor-pointer"
                    >
                      स्थिति अद्यावधिक
                      <span className="material-symbols-outlined text-[18px]">touch_app</span>
                    </button>
                  </div>

                  {/* Action Menu Content (Flips in) */}
                  <div className={`absolute inset-0 bg-surface flex flex-col p-4 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-headline-lg text-[16px] text-on-surface truncate pr-2">{s.name}</span>
                      <button onClick={() => setShowActionMenu(null)} className="text-on-surface-variant hover:text-error shrink-0 cursor-pointer">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-2.5 justify-center">
                      <button 
                        onClick={() => handleActionSelect(s, 'arrived')}
                        disabled={statusInfo.status === 'present'}
                        className="h-11 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg font-label-caps uppercase flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">login</span> आगमन
                      </button>
                      <button 
                        onClick={() => handleActionSelect(s, 'lunch_out')}
                        disabled={statusInfo.status !== 'present'}
                        className="h-11 bg-primary/10 text-primary border border-primary/20 rounded-lg font-label-caps uppercase flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">local_cafe</span> खाजा बाहिर
                      </button>
                      <button 
                        onClick={() => handleActionSelect(s, 'lunch_return')}
                        disabled={statusInfo.status !== 'lunch'}
                        className="h-11 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg font-label-caps uppercase flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">keyboard_return</span> खाजा फिर्ता
                      </button>
                      <button 
                        onClick={() => handleActionSelect(s, 'departed')}
                        disabled={statusInfo.status === 'absent' || statusInfo.status === 'departed'}
                        className="h-11 bg-outline-variant text-on-surface border border-outline rounded-lg font-label-caps uppercase flex items-center justify-center gap-2 hover:bg-on-surface-variant hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">logout</span> प्रस्थान
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="h-[80px] bg-surface-container border-t border-outline-variant flex justify-between items-center px-margin-edge z-10">
        <button 
          onClick={() => setShowReportModal(true)}
          className="h-touch-target px-6 bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white rounded-lg font-label-caps uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">report_problem</span>
          अनुपस्थिति रिपोर्ट
        </button>
        
        <button 
          onClick={() => { useStore.getState().logout(); navigate('/admin/login'); }}
          className="h-touch-target px-6 bg-surface text-on-surface-variant hover:bg-error hover:text-white border border-outline-variant rounded-lg font-label-caps uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined">logout</span>
          बाहिर निस्कनुहोस्
        </button>
      </footer>

      {/* Verification Flow Overlay */}
      {selectedStaff && selectedAction && (
        <FaceVerify 
          staff={selectedStaff} 
          action={selectedAction} 
          onClose={() => { setSelectedStaff(null); setSelectedAction(null); }}
          onSuccess={handleVerificationSuccess}
        />
      )}

      {/* Absence Report Flow Overlay */}
      {showReportModal && (
        <AbsenceReport 
          staffList={staff}
          onCancel={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default KioskHome;
