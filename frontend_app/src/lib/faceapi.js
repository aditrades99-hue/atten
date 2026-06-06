import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return true;
  try {
    const MODEL_URL = '/models';
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error("Error loading face models:", error);
    return false;
  }
};

export const getFaceDescriptor = async (imageElement) => {
  if (!modelsLoaded) await loadModels();
  
  let targetInput = imageElement;
  
  // Downscale input to 320x240 to make face detection 10x faster on low-end CPUs
  try {
    const isVideo = imageElement instanceof HTMLVideoElement;
    const width = isVideo ? imageElement.videoWidth : imageElement.width;
    const height = isVideo ? imageElement.videoHeight : imageElement.height;
    
    if (width > 400 || height > 300) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      targetInput = canvas;
    }
  } catch (err) {
    console.warn("Could not downscale face image, using original:", err);
  }

  const detection = await faceapi.detectSingleFace(targetInput).withFaceLandmarks().withFaceDescriptor();
  return detection ? detection.descriptor : null;
};
