import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, onLunch: 0, departed: 0, late: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [staffStatus, setStaffStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, eventsRes, attRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/events?limit=5'),
          api.get('/attendance')
        ]);
        setStats(statsRes.data);
        setRecentEvents(eventsRes.data);
        setStaffStatus(attRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'present_morning':
      case 'present_afternoon':
      case 'present':
        return <span className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 border border-secondary/20 rounded"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse-ring"></span><span className="font-technical-sm text-technical-sm">उपस्थित</span></span>;
      case 'on_lunch':
        return <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 border border-primary/20 rounded"><span className="w-2 h-2 rounded-full bg-primary"></span><span className="font-technical-sm text-technical-sm">खाजा समय</span></span>;
      case 'absent':
        return <span className="inline-flex items-center gap-2 bg-on-surface-variant/10 text-on-surface-variant px-3 py-1 border border-outline rounded"><span className="w-2 h-2 rounded-full bg-on-surface-variant"></span><span className="font-technical-sm text-technical-sm">अनुपस्थित</span></span>;
      case 'departed':
        return <span className="inline-flex items-center gap-2 bg-outline-variant text-on-surface-variant px-3 py-1 rounded"><span className="w-2 h-2 rounded-full bg-on-surface-variant"></span><span className="font-technical-sm text-technical-sm">प्रस्थान</span></span>;
      default:
        return <span className="inline-flex items-center gap-2 bg-error/10 text-error px-3 py-1 border border-error/20 rounded"><span className="w-2 h-2 rounded-full bg-error"></span><span className="font-technical-sm text-technical-sm">अज्ञात</span></span>;
    }
  };

  const getEventIcon = (type) => {
    switch(type) {
      case 'arrived':
      case 'lunch_return': return { icon: 'login', color: 'bg-secondary', text: 'text-on-primary' };
      case 'lunch_out': return { icon: 'coffee', color: 'bg-primary', text: 'text-on-primary' };
      case 'departed': return { icon: 'logout', color: 'bg-outline', text: 'text-on-surface' };
      case 'verification_failed': return { icon: 'warning', color: 'bg-error', text: 'text-on-error' };
      default: return { icon: 'sync', color: 'bg-primary/20', text: 'text-primary' };
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-64"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>;
  }

  const attendanceRate = stats.total > 0 ? Math.round((stats.present + stats.onLunch + stats.departed) / stats.total * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-admin-gutter mb-margin-edge">
        {/* Total Staff */}
        <div className="bg-surface-container border border-outline-variant p-admin-gutter group hover:border-primary transition-all rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-on-surface-variant">badge</span>
            <span className="font-technical-sm text-primary">सक्रिय</span>
          </div>
          <p className="font-label-caps text-on-surface-variant uppercase tracking-widest mb-1">कुल कर्मचारी</p>
          <p className="font-display-lg text-on-surface">{stats.total}</p>
        </div>
        
        {/* Present Today */}
        <div className="bg-surface-container border border-outline-variant p-admin-gutter group hover:border-secondary transition-all rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-on-surface-variant">check_circle</span>
            <span className="font-technical-sm text-secondary">{attendanceRate}% उपस्थिति</span>
          </div>
          <p className="font-label-caps text-on-surface-variant uppercase tracking-widest mb-1">आज उपस्थित</p>
          <p className="font-display-lg text-on-surface">{stats.present}</p>
        </div>
        
        {/* On Lunch */}
        <div className="bg-surface-container border border-outline-variant p-admin-gutter group hover:border-primary transition-all rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-on-surface-variant">coffee</span>
          </div>
          <p className="font-label-caps text-on-surface-variant uppercase tracking-widest mb-1">खाजा समय</p>
          <p className="font-display-lg text-on-surface">{stats.onLunch}</p>
        </div>
        
        {/* Late/Absent */}
        <div className="bg-surface-container border border-outline-variant p-admin-gutter group hover:border-error transition-all rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-on-surface-variant">timer</span>
            <span className="font-technical-sm text-error">सतर्कता</span>
          </div>
          <p className="font-label-caps text-on-surface-variant uppercase tracking-widest mb-1">अनुपस्थित</p>
          <p className="font-display-lg text-on-surface">{stats.absent}</p>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin-edge">
        {/* Staff Status Table */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container border border-outline-variant overflow-hidden rounded-lg">
            <div className="px-admin-gutter py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h2 className="font-headline-lg text-[20px] text-on-surface">कर्मचारी स्थिति</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase">कर्मचारी</th>
                    <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase">भूमिका</th>
                    <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase text-right">स्थिति</th>
                  </tr>
                </thead>
                <tbody>
                  {staffStatus.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-admin-gutter text-center text-on-surface-variant font-technical-sm">आजको कुनै डाटा छैन</td>
                    </tr>
                  ) : (
                    staffStatus.map((record) => (
                      <tr key={record.id} className="border-b border-outline-variant hover:bg-surface-container-highest transition-colors group">
                        <td className="p-admin-gutter flex items-center gap-3">
                          <div className="w-10 h-10 bg-outline rounded shadow-inner flex items-center justify-center overflow-hidden">
                            {record.staff?.photo_url ? (
                              <img src={record.staff.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant">person</span>
                            )}
                          </div>
                          <div>
                            <p className="font-body-md font-bold text-on-surface">{record.staff?.name}</p>
                          </div>
                        </td>
                        <td className="p-admin-gutter font-body-md text-on-surface-variant">{record.staff?.role || '-'}</td>
                        <td className="p-admin-gutter text-right">
                          {getStatusBadge(record.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-4">
          <div className="bg-surface-container border border-outline-variant flex flex-col h-full overflow-hidden rounded-lg">
            <div className="px-admin-gutter py-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">sensors</span>
              <h2 className="font-headline-lg text-[20px] text-on-surface">प्रत्यक्ष गतिविधि</h2>
            </div>
            <div className="flex-1 p-admin-gutter space-y-6 overflow-y-auto max-h-[600px]">
              {recentEvents.length === 0 ? (
                 <p className="text-on-surface-variant font-technical-sm text-center">कुनै गतिविधि छैन</p>
              ) : (
                recentEvents.map((ev, idx) => {
                  const { icon, color, text } = getEventIcon(ev.event_type);
                  return (
                    <div key={ev.id} className="flex gap-4 relative">
                      {idx !== recentEvents.length - 1 && <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-outline-variant"></div>}
                      <div className={`z-10 w-[24px] h-[24px] rounded-full ${color} flex items-center justify-center`}>
                        <span className={`material-symbols-outlined ${text} text-[14px]`}>{icon}</span>
                      </div>
                      <div>
                        <p className="font-body-md text-on-surface"><span className="font-bold">{ev.staff?.name}</span> {ev.event_type.replace('_', ' ')}</p>
                        <p className="font-technical-sm text-on-surface-variant">
                          {new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • 
                          {ev.verification_success ? ' प्रमाणित' : ' असफल'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
