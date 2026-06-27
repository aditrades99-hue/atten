import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance?date=${date}`);
      setRecords(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDuration = (hoursDecimal) => {
    if (!hoursDecimal) return '-';
    const totalMinutes = Math.round(parseFloat(hoursDecimal) * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="animate-fade-in">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html, #root {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-clean-table {
            border: 1px solid #000000 !important;
            width: 100% !important;
            border-collapse: collapse !important;
            background-color: #ffffff !important;
          }
          .print-clean-table th {
            border: 1px solid #000000 !important;
            background-color: #e5e7eb !important;
            color: #000000 !important;
            font-weight: bold !important;
            padding: 10px 8px !important;
            text-align: center !important;
            font-size: 14px !important;
          }
          .print-clean-table th:first-child {
            text-align: left !important;
          }
          .print-clean-table td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            padding: 10px 8px !important;
            background-color: #ffffff !important;
            font-size: 13px !important;
          }
          .print-clean-table tr {
            background-color: #ffffff !important;
            border-bottom: 1px solid #000000 !important;
          }
        }
      `}} />

      {/* Print-Only Header */}
      <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-black">
        <h1 className="text-3xl font-extrabold uppercase tracking-wide text-center">मारुती टेक्सटाइल अम्पायर</h1>
        <h2 className="text-xl font-bold text-gray-800 mt-2 text-center">कर्मचारी दैनिक हाजिरी रिपोर्ट (Daily Attendance Report)</h2>
        <div className="mt-4 flex justify-between text-sm font-mono text-gray-700">
          <span>मिति (Selected Date): <strong>{date}</strong></span>
          <span>प्रिन्ट मिति (Printed On): {new Date().toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-margin-edge print:hidden">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">हाजिरी रिपोर्ट</h1>
          <p className="font-technical-sm text-on-surface-variant uppercase tracking-widest mt-1">दैनिक ट्र्याकिङ</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="h-touch-target px-4 bg-surface-container border border-outline-variant rounded-lg font-technical-sm text-on-surface outline-none focus:border-primary flex-1 sm:flex-initial"
          />
          <button onClick={() => window.print()} className="bg-gradient-to-r from-primary to-primary/80 text-on-primary h-touch-target w-touch-target rounded-lg flex items-center justify-center hover:brightness-110 transition-all active:scale-95 shadow-md cursor-pointer" title="Print/Export">
             <span className="material-symbols-outlined">print</span>
          </button>
        </div>
      </div>

      <div className="bg-surface-container border border-outline-variant overflow-hidden rounded-lg print:border-none print:bg-white print:rounded-none">
        {loading ? (
          <div className="p-8 flex justify-center"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px] print-clean-table">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase w-[250px] print:w-auto">कर्मचारी (Staff Name)</th>
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase text-center border-l border-outline-variant/50 w-[120px] print:border-none">आगमन (Arrival)</th>
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase text-center w-[120px]">खाजा बाहिर (Lunch Out)</th>
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase text-center w-[120px]">खाजा फिर्ता (Lunch Return)</th>
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase text-center w-[120px]">प्रस्थान (Departure)</th>
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase text-right border-l border-outline-variant/50 print:hidden">पसलमा बिताएको समय (Time in Shop)</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan="6" className="p-admin-gutter text-center text-on-surface-variant font-technical-sm print:text-black">यस मितिको लागि कुनै रेकर्ड फेला परेन</td></tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-outline-variant hover:bg-surface-container-highest transition-colors group print:hover:bg-white">
                      <td className="p-admin-gutter">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-outline rounded-full shadow-inner flex items-center justify-center overflow-hidden border border-surface shrink-0 print:hidden">
                            {r.staff?.photo_url ? (
                               <img src={r.staff.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                               <span className="material-symbols-outlined text-on-surface-variant">person</span>
                            )}
                          </div>
                          <div>
                            <p className="font-body-md font-bold text-on-surface leading-tight print:text-black">{r.staff?.name}</p>
                            <p className="font-technical-sm text-on-surface-variant uppercase tracking-wider text-[10px] mt-0.5 print:hidden">{r.status}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-admin-gutter text-center border-l border-outline-variant/50 font-technical-sm text-on-surface print:border-none print:text-black">
                        <div className="flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-secondary print:hidden">login</span>
                          {formatTime(r.morning_arrival)}
                        </div>
                      </td>
                      
                      <td className="p-admin-gutter text-center font-technical-sm text-on-surface-variant print:text-black">
                        {r.lunch_departure ? formatTime(r.lunch_departure) : '--:--'}
                      </td>
                      
                      <td className="p-admin-gutter text-center font-technical-sm text-on-surface-variant print:text-black">
                        {r.lunch_return ? formatTime(r.lunch_return) : '--:--'}
                      </td>
                      
                      <td className="p-admin-gutter text-center font-technical-sm text-on-surface print:text-black">
                         <div className="flex items-center justify-center gap-1">
                          {r.evening_departure && <span className="material-symbols-outlined text-[14px] text-primary print:hidden">logout</span>}
                          {formatTime(r.evening_departure)}
                        </div>
                      </td>
                      
                      <td className="p-admin-gutter text-right border-l border-outline-variant/50 print:hidden">
                        {r.total_hours ? (
                          <span className="inline-flex items-center justify-center min-w-[70px] bg-outline-variant text-on-surface font-technical-sm px-2 py-1 rounded whitespace-nowrap">
                            {formatDuration(r.total_hours)}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant font-technical-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
