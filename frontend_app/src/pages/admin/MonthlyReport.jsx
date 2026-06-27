import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MonthlyReport = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState({ current: 0, total: 0, message: '' });

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff && startDate && endDate) {
      fetchRecords();
    } else {
      setRecords([]);
    }
  }, [selectedStaff, startDate, endDate]);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to fetch staff', err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/monthly?staff_id=${selectedStaff}&start_date=${startDate}&end_date=${endDate}`);
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch monthly records', err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveMonth = async () => {
    if (!window.confirm(`के तपाईं पक्का ${startDate} देखि ${endDate} सम्मको डाटा डाउनलोड गरी टेलिग्राममा पठाउन चाहनुहुन्छ? (Download & send to Telegram?)`)) {
      return;
    }
    
    setArchiving(true);
    setArchiveProgress({ current: 0, total: staffList.length, message: 'Starting...' });

    for (let i = 0; i < staffList.length; i++) {
      const staff = staffList[i];
      setArchiveProgress({ current: i + 1, total: staffList.length, message: `Processing ${staff.name}...` });

      try {
        // Fetch data
        const res = await api.get(`/attendance/monthly?staff_id=${staff.id}&start_date=${startDate}&end_date=${endDate}`);
        const attendanceData = res.data;

        if (attendanceData && attendanceData.length > 0) {
          // Generate PDF
          const doc = new jsPDF();
          doc.text(`StaffTrack - Monthly Attendance Report`, 14, 15);
          doc.text(`Staff: ${staff.name} (${staff.role})`, 14, 25);
          doc.text(`Dates: ${startDate} to ${endDate}`, 14, 32);

          const tableData = attendanceData.map(r => [
            r.date,
            r.status,
            r.morning_arrival ? new Date(r.morning_arrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
            r.evening_departure ? new Date(r.evening_departure).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
            r.total_hours ? formatDuration(r.total_hours) : '-'
          ]);

          doc.autoTable({
            startY: 40,
            head: [['Date', 'Status', 'Arrival', 'Departure', 'Time in Shop']],
            body: tableData,
          });

          const fileName = `attendance_${staff.name.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`;
          
          // Auto Download
          doc.save(fileName);

          // Get Base64
          const pdfBase64 = doc.output('datauristring');

          // Send to Backend for Telegram
          await api.post('/attendance/archive-staff', {
            staffId: staff.id,
            staffName: staff.name,
            start_date: startDate,
            end_date: endDate,
            pdfBase64,
            fileName
          });
        }
      } catch (err) {
        console.error(`Failed to send report for ${staff.name}`, err);
      }
    }

    setArchiveProgress({ current: staffList.length, total: staffList.length, message: 'Complete! Sent to Telegram.' });
    
    // Refresh current view
    if (selectedStaff) {
      fetchRecords();
    }
    
    setTimeout(() => {
      setArchiving(false);
    }, 3000);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present_morning':
      case 'present_afternoon':
      case 'present':
        return <span className="text-secondary bg-secondary/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">उपस्थित</span>;
      case 'on_lunch':
        return <span className="text-tertiary bg-tertiary/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">खाजा समय</span>;
      case 'departed':
        return <span className="text-outline bg-outline/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">प्रस्थान</span>;
      case 'absent':
        return <span className="text-error bg-error/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">अनुपस्थित</span>;
      default:
        return <span className="text-on-surface-variant bg-surface-container-high px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{status || 'Unknown'}</span>;
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-margin-edge border-b border-outline-variant pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">मासिक रिपोर्ट</h1>
          <p className="font-technical-sm text-on-surface-variant uppercase tracking-widest mt-1">
            कर्मचारीको व्यक्तिगत उपस्थिति विवरण
          </p>
        </div>
        <button
          onClick={handleArchiveMonth}
          disabled={archiving || staffList.length === 0}
          className="bg-primary text-on-primary h-touch-target px-6 rounded-lg font-label-caps uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-md disabled:opacity-50 whitespace-nowrap"
        >
          {archiving ? (
            <span className="material-symbols-outlined animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined">send</span>
          )}
          डाउनलोड र टेलिग्राममा पठाउनुहोस् (Download & Send)
        </button>
      </div>

      {archiving && (
        <div className="bg-primary-container text-on-primary-container p-4 rounded-lg mb-6 border border-primary/20 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-caps uppercase text-sm tracking-wide">Archiving Progress</span>
            <span className="font-technical-sm">{archiveProgress.current} / {archiveProgress.total}</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(archiveProgress.current / archiveProgress.total) * 100}%` }}
            ></div>
          </div>
          <p className="font-technical-sm mt-2 text-primary">{archiveProgress.message}</p>
        </div>
      )}

      <div className="bg-surface-container border border-outline-variant rounded-lg p-admin-gutter mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-label-caps text-on-surface-variant uppercase mb-2">कर्मचारी छान्नुहोस्</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full h-touch-target px-4 bg-surface border border-outline-variant rounded focus:border-primary outline-none font-body-md"
            >
              <option value="">-- छान्नुहोस् --</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex gap-4">
            <div className="flex-1">
              <label className="block font-label-caps text-on-surface-variant uppercase mb-2">सुरु मिति (Start Date)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-touch-target px-4 bg-surface border border-outline-variant rounded focus:border-primary outline-none font-body-md"
              />
            </div>
            <div className="flex-1">
              <label className="block font-label-caps text-on-surface-variant uppercase mb-2">अन्तिम मिति (End Date)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-touch-target px-4 bg-surface border border-outline-variant rounded focus:border-primary outline-none font-body-md"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
        </div>
      ) : !selectedStaff ? (
        <div className="bg-surface-container-high border border-outline-variant rounded-lg p-8 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">person_search</span>
          <p className="font-body-md">विवरण हेर्नको लागि माथि कर्मचारी छान्नुहोस्।</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-surface-container-high border border-outline-variant rounded-lg p-8 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
          <p className="font-body-md">यस महिनाको कुनै हाजिरी रेकर्ड फेला परेन।</p>
        </div>
      ) : (
        <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="p-4 font-label-caps text-on-surface-variant uppercase tracking-wider">मिति</th>
                  <th className="p-4 font-label-caps text-on-surface-variant uppercase tracking-wider">स्थिति</th>
                  <th className="p-4 font-label-caps text-on-surface-variant uppercase tracking-wider">आगमन</th>
                  <th className="p-4 font-label-caps text-on-surface-variant uppercase tracking-wider">प्रस्थान</th>
                  <th className="p-4 font-label-caps text-on-surface-variant uppercase tracking-wider text-right">पसलमा बिताएको समय (Time in Shop)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="p-4 font-body-md font-medium text-on-surface">
                      {record.date}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="p-4 font-technical-sm text-on-surface-variant">
                      {formatTime(record.morning_arrival)}
                    </td>
                    <td className="p-4 font-technical-sm text-on-surface-variant">
                      {formatTime(record.evening_departure)}
                    </td>
                    <td className="p-4 font-technical-sm text-on-surface-variant text-right font-bold">
                      {record.total_hours ? formatDuration(record.total_hours) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;
