import React, { useRef, useState, useEffect } from 'react';
import CameraModal from '../../components/CameraModal';
import { loadModels, getFaceDescriptor } from '../../lib/faceapi';
import * as faceapi from 'face-api.js';
import api from '../../lib/api';

const FaceVerify = ({ staff, action, onClose, onSuccess }) => {
  const videoRef = useRef();
  const [status, setStatus] = useState('मोडेल लोड गर्दै...');
  const [isError, setIsError] = useState(false);
  const isVerifyingRef = useRef(false);
  
  useEffect(() => {
    // Pre-load models when component mounts
    loadModels().then(success => {
      if (!success) {
        setStatus('अनुहार पहिचान मोडेल लोड गर्न असफल');
        setIsError(true);
      }
    });
  }, []);

  const handleVideoLoaded = () => {
    if (isVerifyingRef.current) return;
    setStatus('अनुहार खोज्दै...');
    verifyFace();
  };

  const capturePhoto = (video) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // un-mirror for save
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const verifyFace = async () => {
    if (!videoRef.current || isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    
    try {
      // 1. Get live descriptor
      setStatus('विश्लेषण गर्दै...');
      const liveDescriptor = await getFaceDescriptor(videoRef.current);
      
      if (!liveDescriptor) {
        setIsError(true);
        setStatus('अनुहार फेला परेन। फेरि प्रयास गर्नुहोस्।');
        setTimeout(() => {
           setIsError(false);
           isVerifyingRef.current = false;
           verifyFace(); // Retry
        }, 500);
        return;
      }

      // 2. Compare with stored descriptor
      let isMatch = false;
      
      if (!staff.face_descriptor) {
         setIsError(true);
         setStatus('बायोमेट्रिक दर्ता गरिएको छैन। प्रशासकलाई सम्पर्क गर्नुहोस्।');
         setTimeout(() => onClose(), 3000);
         return;
      }

      setStatus('प्रमाणीकरण गर्दै...');
      const storedDescriptor = new Float32Array(Object.values(staff.face_descriptor));
      const distance = faceapi.euclideanDistance(liveDescriptor, storedDescriptor);
      
      // Threshold: < 0.6 is generally a match for SSD Mobilenet
      if (distance <= 0.6) {
         isMatch = true;
      } else {
         console.log(`Face mismatch. Distance: ${distance}`);
      }

      const photoUrl = capturePhoto(videoRef.current); // Normally upload this to Supabase Storage

      // 3. Send result to backend
      const res = await api.post('/attendance/mark', {
        staffId: staff.id,
        action: action,
        verificationSuccess: isMatch,
        photoUrl: null // Not actually saving base64 to DB to avoid huge rows, in prod upload to S3 first
      });

      if (res.data.success && isMatch) {
        setStatus('सफलतापूर्वक प्रमाणित!');
        setTimeout(() => {
          onSuccess(res.data.status);
        }, 1500);
      } else {
        setIsError(true);
        setStatus('पहिचान मेल खाएन। पहुँच अस्वीकार गरियो।');
        setTimeout(() => {
          onClose(); // Auto close on strict failure
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      setStatus('प्रणाली त्रुटि');
    }
  };

  return (
    <CameraModal 
      isOpen={true} 
      onClose={onClose} 
      onVideoLoaded={handleVideoLoaded} 
      videoRef={videoRef}
      statusText={status}
      isError={isError}
    />
  );
};

export default FaceVerify;
