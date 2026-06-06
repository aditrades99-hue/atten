import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import CameraModal from '../../components/CameraModal';
import { loadModels, getFaceDescriptor } from '../../lib/faceapi';

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  
  // Face Registration State
  const [showCamera, setShowCamera] = useState(false);
  const [faceData, setFaceData] = useState({ descriptor: null, photoUrl: null });
  const [cameraStatus, setCameraStatus] = useState('मोडेल लोड गर्दै...');
  const [isCameraError, setIsCameraError] = useState(false);
  const videoRef = useRef();

  // Form state
  const [formData, setFormData] = useState({ name: '', role: '', phone: '', email: '' });

  useEffect(() => {
    fetchStaff();
    loadModels();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoLoaded = () => {
    setCameraStatus('अनुहार स्क्यान गर्दै...');
    captureFace();
  };

  const captureFace = async () => {
    if (!videoRef.current) return;
    try {
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) {
        setIsCameraError(true);
        setCameraStatus('अनुहार फेला परेन। फेरि प्रयास गर्दै...');
        setTimeout(() => { setIsCameraError(false); captureFace(); }, 500);
        return;
      }
      
      // Get photo
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      setFaceData({ descriptor: Array.from(descriptor), photoUrl });
      setCameraStatus('बायोमेट्रिक सुरक्षित भयो!');
      setTimeout(() => setShowCamera(false), 1000);
    } catch (err) {
      console.error(err);
      setIsCameraError(true);
      setCameraStatus('प्रणाली त्रुटि');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`के तपाईं पक्का ${name} लाई हटाउन चाहनुहुन्छ?`)) {
      try {
        await api.delete(`/staff/${id}`);
        fetchStaff();
      } catch (err) {
        console.error('Failed to delete staff:', err);
        alert('कर्मचारी हटाउन असफल भयो।');
      }
    }
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role || '',
      phone: staff.phone || '',
      email: staff.email || ''
    });
    setFaceData({
      descriptor: staff.face_descriptor || null,
      photoUrl: staff.photo_url || null
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/staff/${editingStaff.id}`, {
        role: formData.role,
        phone: formData.phone,
        email: formData.email,
        face_descriptor: faceData.descriptor,
        photo_url: faceData.photoUrl
      });
      setShowEditModal(false);
      setEditingStaff(null);
      setFormData({ name: '', role: '', phone: '', email: '' });
      setFaceData({ descriptor: null, photoUrl: null });
      fetchStaff();
    } catch (err) {
      console.error('Failed to edit staff:', err);
      alert('सम्पादन असफल भयो (Edit Failed)');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!faceData.descriptor) {
      alert('कृपया अनुहार दर्ता गर्नुहोस् (Capture Face)');
      return;
    }
    
    try {
      await api.post('/staff', { 
        ...formData, 
        face_descriptor: faceData.descriptor,
        photo_url: faceData.photoUrl 
      });
      setShowAddModal(false);
      setFormData({ name: '', role: '', phone: '', email: '' });
      setFaceData({ descriptor: null, photoUrl: null });
      fetchStaff();
    } catch (err) {
      console.error('Failed to add staff:', err);
      alert('Failed to add staff. Check console.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-margin-edge">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">कर्मचारी व्यवस्थापन</h1>
          <p className="font-technical-sm text-on-surface-variant uppercase tracking-widest mt-1">कुल {staff.length} दर्ता भएका प्रोफाइलहरू</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-on-primary h-touch-target px-6 rounded-lg font-label-caps uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-md"
        >
          <span className="material-symbols-outlined">person_add</span>
          नयाँ थप्नुहोस्
        </button>
      </div>

      <div className="bg-surface/80 backdrop-blur-md border border-outline-variant overflow-hidden rounded-xl shadow-sm">
        {loading ? (
           <div className="p-8 flex justify-center"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant">
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase whitespace-nowrap">विवरण</th>
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase whitespace-nowrap">सम्पर्क</th>
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase whitespace-nowrap text-center">बायोमेट्रिक</th>
                  <th className="p-admin-gutter font-label-caps text-on-surface-variant uppercase whitespace-nowrap text-right">कार्यहरू</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-outline-variant hover:bg-surface-container-highest/50 transition-colors group">
                    <td className="p-admin-gutter">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-outline rounded-full shadow-inner flex items-center justify-center overflow-hidden border-2 border-surface shrink-0">
                          {s.photo_url ? (
                             <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                             <span className="material-symbols-outlined text-on-surface-variant">person</span>
                          )}
                        </div>
                        <div>
                          <p className="font-headline-lg text-[18px] text-on-surface font-bold leading-tight">{s.name}</p>
                          <p className="font-technical-sm text-primary uppercase tracking-wider text-[11px] mt-1">{s.role || 'कर्मचारी'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-admin-gutter">
                      <div className="font-technical-sm text-on-surface-variant space-y-1 text-sm">
                        <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-outline">call</span> {s.phone || '-'}</p>
                        <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-outline">mail</span> {s.email || '-'}</p>
                      </div>
                    </td>
                    <td className="p-admin-gutter text-center">
                      {s.face_descriptor ? (
                        <div className="inline-flex flex-col items-center justify-center bg-secondary/10 text-secondary w-[80px] py-2 rounded border border-secondary/20 shadow-sm">
                          <span className="material-symbols-outlined text-[20px] mb-1">verified_user</span>
                          <span className="font-technical-sm text-[10px] uppercase tracking-wider">दर्ता भयो</span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center justify-center bg-error/10 text-error w-[80px] py-2 rounded border border-error/20 shadow-sm">
                          <span className="material-symbols-outlined text-[20px] mb-1">no_accounts</span>
                          <span className="font-technical-sm text-[10px] uppercase tracking-wider">बाँकी छ</span>
                        </div>
                      )}
                    </td>
                    <td className="p-admin-gutter text-right whitespace-nowrap">
                      <button 
                        onClick={() => handleEdit(s)}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors mr-2" 
                        title="सम्पादन गर्नुहोस् (Edit)"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id, s.name)}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-error/10 text-error transition-colors" 
                        title="हटाउनुहोस् (Delete)"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface/95 backdrop-blur-xl rounded-xl w-full max-w-md border border-outline-variant shadow-2xl animate-fade-in overflow-hidden">
             <div className="p-admin-gutter border-b border-outline-variant flex justify-between items-center bg-surface-container/50">
               <h2 className="font-headline-lg text-[20px]">नयाँ कर्मचारी थप्नुहोस्</h2>
               <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined">close</span></button>
             </div>
             <form onSubmit={handleAddSubmit} className="p-admin-gutter space-y-4">
               <div>
                 <label className="block font-label-caps text-on-surface-variant uppercase mb-1">पूरा नाम</label>
                 <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full h-10 border border-outline-variant bg-surface-container rounded px-3 outline-none focus:border-primary shadow-inner" required />
               </div>
               <div>
                 <label className="block font-label-caps text-on-surface-variant uppercase mb-1">भूमिका</label>
                 <input type="text" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="w-full h-10 border border-outline-variant bg-surface-container rounded px-3 outline-none focus:border-primary shadow-inner" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block font-label-caps text-on-surface-variant uppercase mb-1">फोन</label>
                   <input type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full h-10 border border-outline-variant bg-surface-container rounded px-3 outline-none focus:border-primary shadow-inner" />
                 </div>
                 <div>
                   <label className="block font-label-caps text-on-surface-variant uppercase mb-1">इमेल</label>
                   <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full h-10 border border-outline-variant bg-surface-container rounded px-3 outline-none focus:border-primary shadow-inner" />
                 </div>
               </div>
               
               <div className="pt-2">
                 <label className="block font-label-caps text-on-surface-variant uppercase mb-2">बायोमेट्रिक दर्ता (अनिवार्य)</label>
                 {faceData.descriptor ? (
                   <div className="flex items-center gap-3 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                     <img src={faceData.photoUrl} alt="Face" className="w-12 h-12 rounded-full object-cover border-2 border-secondary" />
                     <div className="flex-1">
                       <p className="font-body-md text-secondary font-bold">अनुहार दर्ता भयो</p>
                       <p className="font-technical-sm text-secondary/80">सफलतापूर्वक स्क्यान गरियो</p>
                     </div>
                     <button type="button" onClick={() => setShowCamera(true)} className="text-secondary hover:text-secondary/80"><span className="material-symbols-outlined">refresh</span></button>
                   </div>
                 ) : (
                   <button type="button" onClick={() => setShowCamera(true)} className="w-full h-24 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors">
                     <span className="material-symbols-outlined text-[32px]">face_retouching_natural</span>
                     <span className="font-label-caps uppercase tracking-widest">अनुहार स्क्यान गर्नुहोस्</span>
                   </button>
                 )}
               </div>

               <div className="pt-4 flex justify-end gap-2 border-t border-outline-variant mt-4">
                 <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 font-label-caps text-on-surface-variant hover:bg-surface-container-high rounded border border-transparent transition-colors">रद्द गर्नुहोस्</button>
                 <button type="submit" className="px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-on-primary font-label-caps rounded hover:brightness-110 transition-all shadow-md">थप्नुहोस्</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface/95 backdrop-blur-xl rounded-xl w-full max-w-md border border-outline-variant shadow-2xl animate-fade-in overflow-hidden">
             <div className="p-admin-gutter border-b border-outline-variant flex justify-between items-center bg-surface-container/50">
               <h2 className="font-headline-lg text-[20px]">कर्मचारी सम्पादन (Edit Staff)</h2>
               <button onClick={() => { setShowEditModal(false); setEditingStaff(null); setFaceData({ descriptor: null, photoUrl: null }); }} className="text-on-surface-variant hover:text-error">
                 <span className="material-symbols-outlined">close</span>
               </button>
             </div>
             <form onSubmit={handleEditSubmit} className="p-admin-gutter space-y-4">
               <div>
                 <label className="block font-label-caps text-on-surface-variant uppercase mb-1">पूरा नाम (Name - Cannot Edit)</label>
                 <input type="text" value={formData.name} disabled className="w-full h-10 border border-outline-variant bg-surface-container-high/60 opacity-70 rounded px-3 outline-none cursor-not-allowed" />
               </div>
               <div>
                 <label className="block font-label-caps text-on-surface-variant uppercase mb-1">भूमिका (Role)</label>
                 <input type="text" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="w-full h-10 border border-outline-variant bg-surface-container rounded px-3 outline-none focus:border-primary shadow-inner" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block font-label-caps text-on-surface-variant uppercase mb-1">फोन (Phone)</label>
                   <input type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full h-10 border border-outline-variant bg-surface-container rounded px-3 outline-none focus:border-primary shadow-inner" />
                 </div>
                 <div>
                   <label className="block font-label-caps text-on-surface-variant uppercase mb-1">इमेल (Email)</label>
                   <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full h-10 border border-outline-variant bg-surface-container rounded px-3 outline-none focus:border-primary shadow-inner" />
                 </div>
               </div>
               
               <div className="pt-2">
                 <label className="block font-label-caps text-on-surface-variant uppercase mb-2">बायोमेट्रिक दर्ता (Biometric Face Scan)</label>
                 {faceData.descriptor ? (
                   <div className="flex items-center gap-3 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                     {faceData.photoUrl ? (
                       <img src={faceData.photoUrl} alt="Face" className="w-12 h-12 rounded-full object-cover border-2 border-secondary" />
                     ) : (
                       <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center border-2 border-secondary"><span className="material-symbols-outlined text-secondary">face</span></div>
                     )}
                     <div className="flex-1">
                       <p className="font-body-md text-secondary font-bold">अनुहार दर्ता भयो</p>
                       <p className="font-technical-sm text-secondary/80">सफलतापूर्वक स्क्यान गरियो</p>
                     </div>
                     <button type="button" onClick={() => setShowCamera(true)} className="text-secondary hover:text-secondary/80"><span className="material-symbols-outlined">refresh</span></button>
                   </div>
                 ) : (
                   <button type="button" onClick={() => setShowCamera(true)} className="w-full h-24 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors">
                     <span className="material-symbols-outlined text-[32px]">face_retouching_natural</span>
                     <span className="font-label-caps uppercase tracking-widest">अनुहार स्क्यान गर्नुहोस्</span>
                   </button>
                 )}
               </div>

               <div className="pt-4 flex justify-end gap-2 border-t border-outline-variant mt-4">
                 <button type="button" onClick={() => { setShowEditModal(false); setEditingStaff(null); setFaceData({ descriptor: null, photoUrl: null }); }} className="px-4 py-2 font-label-caps text-on-surface-variant hover:bg-surface-container-high rounded border border-transparent transition-colors">रद्द गर्नुहोस्</button>
                 <button type="submit" className="px-6 py-2 bg-gradient-to-r from-primary to-primary/80 text-on-primary font-label-caps rounded hover:brightness-110 transition-all shadow-md">सुरक्षित गर्नुहोस्</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraModal 
          isOpen={true}
          onClose={() => setShowCamera(false)}
          videoRef={videoRef}
          onVideoLoaded={handleVideoLoaded}
          statusText={cameraStatus}
          isError={isCameraError}
        />
      )}
    </div>
  );
};

export default StaffList;
