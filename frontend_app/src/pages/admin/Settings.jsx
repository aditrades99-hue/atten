import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    work_start_time: '09:00',
    late_threshold: '09:15',
    telegram_notifications: 'true',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (Object.keys(res.data).length > 0) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    }).catch(console.error);
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/settings', settings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearDevices = async () => {
    if (!window.confirm('के तपाईं पक्का सबै दर्ता गरिएका उपकरणहरू हटाउन चाहनुहुन्छ? (Are you sure you want to clear all registered devices?)')) return;
    try {
      await api.post('/devices/deregister');
      alert('सबै उपकरणहरू सफलतापूर्वक हटाइयो। (All devices cleared successfully.)');
    } catch (err) {
      console.error(err);
      alert('उपकरणहरू हटाउन असफल भयो। (Failed to clear devices.)');
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-margin-edge border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">प्रणाली सेटिङहरू</h1>
        <p className="font-technical-sm text-on-surface-variant uppercase tracking-widest mt-1">अनुप्रयोग कन्फिगरेसन</p>
      </div>

      <div className="space-y-8">
        {/* Work Hours Section */}
        <section className="bg-surface-container border border-outline-variant rounded-lg p-admin-gutter">
          <h2 className="font-headline-lg text-[20px] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">schedule</span>
            कार्य समय र नियमहरू
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-label-caps text-on-surface-variant uppercase mb-2">कार्यालय खुल्ने समय</label>
              <input 
                type="time" 
                value={settings.work_start_time}
                onChange={(e) => handleChange('work_start_time', e.target.value)}
                className="w-full h-touch-target px-4 bg-surface border border-outline-variant rounded focus:border-primary outline-none font-technical-sm" 
              />
            </div>
            <div>
              <label className="block font-label-caps text-on-surface-variant uppercase mb-2">ढिलो हुने समय (Alert Threshold)</label>
              <input 
                type="time" 
                value={settings.late_threshold}
                onChange={(e) => handleChange('late_threshold', e.target.value)}
                className="w-full h-touch-target px-4 bg-surface border border-outline-variant rounded focus:border-primary outline-none font-technical-sm text-error" 
              />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-surface-container border border-outline-variant rounded-lg p-admin-gutter">
          <h2 className="font-headline-lg text-[20px] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">notifications_active</span>
            सूचना सेटिङहरू
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-surface border border-outline-variant rounded">
            <div>
              <p className="font-body-md font-bold text-on-surface">टेलीग्राम सूचनाहरू (Telegram Alerts)</p>
              <p className="font-technical-sm text-on-surface-variant text-sm mt-1">प्रबन्धकलाई हाजिरी अलर्टहरू पठाउनुहोस्</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.telegram_notifications === 'true'}
                onChange={(e) => handleChange('telegram_notifications', e.target.checked ? 'true' : 'false')}
              />
              <div className="w-14 h-7 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
            </label>
          </div>
          <p className="mt-4 font-technical-sm text-on-surface-variant text-xs">नोट: Telegram Bot Token र Chat ID ब्याकइन्ड .env फाइलमा सेट हुनुपर्छ।</p>
        </section>

        {/* Security Section */}
        <section className="bg-surface-container border border-outline-variant rounded-lg p-admin-gutter">
          <h2 className="font-headline-lg text-[20px] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-error">security</span>
            सुरक्षा सेटिङहरू
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-surface border border-outline-variant rounded">
            <div>
              <p className="font-body-md font-bold text-on-surface">सबै दर्ता गरिएका उपकरणहरू हटाउनुहोस्</p>
              <p className="font-technical-sm text-on-surface-variant text-sm mt-1">यसले सबै उपकरणहरूको पहुँच रद्द गर्नेछ र उनीहरूलाई फेरि लगइन गर्न पासकोड आवश्यक पर्नेछ।</p>
            </div>
            <button 
              onClick={handleClearDevices}
              className="bg-error text-on-error h-touch-target px-4 sm:px-8 rounded-lg font-label-caps uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-md"
            >
              <span className="material-symbols-outlined">device_reset</span>
              हटाउनुहोस्
            </button>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-on-primary h-touch-target px-8 rounded-lg font-label-caps uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-md disabled:opacity-70"
          >
            {saving ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">save</span>}
            सुरक्षित गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
