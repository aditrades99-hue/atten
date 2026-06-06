import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

const AbsenceReport = ({ onCancel, staffList }) => {
  const [reportedBy, setReportedBy] = useState('');
  const [absentStaff, setAbsentStaff] = useState('');
  const [reportType, setReportType] = useState('morning_no_show');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportedBy || !absentStaff) return alert('कृपया दुबै नामहरू छान्नुहोस्');
    
    setSubmitting(true);
    try {
      await api.post('/absence-reports', {
        reported_by: reportedBy,
        absent_staff_id: absentStaff,
        report_type: reportType,
        notes
      });
      // Show success briefly
      onCancel();
    } catch (err) {
      alert('रिपोर्ट पठाउन असफल भयो।');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/90 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-surface p-8 rounded-xl w-full max-w-md border border-outline-variant shadow-2xl">
        <div className="flex items-center gap-3 mb-6 border-b border-outline-variant pb-4">
           <span className="material-symbols-outlined text-[32px] text-error">report_problem</span>
           <h2 className="text-2xl font-bold font-headline-lg text-on-surface uppercase tracking-wider">अनुपस्थिति रिपोर्ट</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-label-caps text-on-surface-variant uppercase mb-2">रिपोर्ट गर्ने व्यक्ति</label>
            <select 
              className="w-full bg-surface-container border border-outline-variant rounded-lg p-3 outline-none focus:border-primary font-body-md" 
              value={reportedBy} 
              onChange={e => setReportedBy(e.target.value)} 
              required
            >
              <option value="">तपाईंको नाम छान्नुहोस्...</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-label-caps text-on-surface-variant uppercase mb-2">अनुपस्थित व्यक्ति</label>
            <select 
              className="w-full bg-surface-container border border-outline-variant rounded-lg p-3 outline-none focus:border-error font-body-md" 
              value={absentStaff} 
              onChange={e => setAbsentStaff(e.target.value)} 
              required
            >
              <option value="">अनुपस्थित कर्मचारी छान्नुहोस्...</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-label-caps text-on-surface-variant uppercase mb-2">कारण</label>
            <select 
              className="w-full bg-surface-container border border-outline-variant rounded-lg p-3 outline-none focus:border-primary font-body-md" 
              value={reportType} 
              onChange={e => setReportType(e.target.value)}
            >
              <option value="morning_no_show">बिहान नआएको</option>
              <option value="lunch_no_return">खाजाबाट नफर्केको</option>
              <option value="early_leave">चाँडै गएको</option>
            </select>
          </div>
          
          <div className="flex gap-4 mt-8 pt-4 border-t border-outline-variant">
            <button 
              type="button" 
              onClick={onCancel} 
              disabled={submitting}
              className="flex-1 p-3 rounded-lg font-label-caps uppercase tracking-wider bg-surface-container text-on-surface-variant hover:bg-surface-container-highest border border-outline-variant transition-colors"
            >
              रद्द गर्नुहोस्
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-1 p-3 rounded-lg font-label-caps uppercase tracking-wider bg-error text-on-error hover:brightness-110 flex justify-center items-center gap-2 transition-all shadow-md"
            >
              {submitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'पेश गर्नुहोस्'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AbsenceReport;
