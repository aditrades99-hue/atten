import React, { useEffect, useState, useRef } from 'react';

const CameraModal = ({ isOpen, onClose, onVideoLoaded, videoRef, statusText, isError }) => {
  if (!isOpen) return null;

  useEffect(() => {
    let stream = null;
    const startVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam', err);
      }
    };
    
    startVideo();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, videoRef]);

  return (
    <div className="fixed inset-0 bg-background/95 flex items-center justify-center z-[100] p-4 transition-all duration-300">
      <div className="flex flex-col items-center">
        <div className={`relative w-80 h-80 rounded-full border-[3px] ${isError ? 'border-error/50' : 'border-primary/50'} flex items-center justify-center overflow-hidden bg-black/10`}>
          {/* Pulsing ring */}
          <div className={`absolute inset-0 border-[4px] ${isError ? 'border-error' : 'border-primary'} animate-pulse-ring rounded-full`}></div>
          <div className={`absolute inset-0 bg-gradient-to-b ${isError ? 'from-error/10' : 'from-primary/10'} to-transparent z-10`}></div>
          
          <video 
            ref={videoRef}
            onPlay={onVideoLoaded}
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror the local video
          />
          
          {/* Scanning line */}
          {!isError && (
            <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_#E2725B] animate-scan z-20"></div>
          )}
        </div>
        
        <div className="mt-margin-edge text-center">
          <h2 className={`font-headline-lg ${isError ? 'text-error' : 'text-primary'} uppercase tracking-widest`}>
            {statusText || 'बायोमेट्रिक्स प्रोसेसिंग'}
          </h2>
          <p className="font-technical-sm text-on-surface-variant mt-2">
            दृश्य क्षेत्रबाट बाहिर नजानुहोस्
          </p>
        </div>
        
        <button 
          className="mt-margin-edge font-label-caps text-on-surface-variant hover:text-error transition-colors px-6 py-2 border border-outline-variant rounded hover:bg-error/10" 
          onClick={onClose}
        >
          रद्द गर्नुहोस् (Cancel)
        </button>
      </div>
    </div>
  );
};

export default CameraModal;
