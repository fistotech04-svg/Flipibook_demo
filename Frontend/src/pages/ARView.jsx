import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const formatModelUrl = (url) => {
  if (!url) return '';
  let finalUrl = String(url).trim();

  // If it's a JSON string with url property
  if (finalUrl.startsWith('{') && (finalUrl.includes('url') || finalUrl.includes('fileUrl'))) {
    try {
      const parsed = JSON.parse(finalUrl);
      if (parsed.url || parsed.fileUrl) finalUrl = parsed.url || parsed.fileUrl;
    } catch (e) {}
  }

  // If it points to frontend origin with /uploads/, redirect to backend
  if (finalUrl.includes('/uploads/')) {
    const uploadsPath = finalUrl.substring(finalUrl.indexOf('/uploads/'));
    return `${backendUrl}${uploadsPath}`;
  }

  // If it's a relative path starting with /
  if (finalUrl.startsWith('/')) {
    return `${backendUrl}${finalUrl}`;
  }

  return finalUrl;
};

const ARView = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialUrl = searchParams.get('url');
  const modelId = searchParams.get('id');
  const [modelUrl, setModelUrl] = useState(() => formatModelUrl(initialUrl));
  const [loading, setLoading] = useState(!initialUrl && !!modelId);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Dynamically inject the model-viewer script if custom element is not yet registered
    if (typeof window !== 'undefined' && !window.customElements?.get('model-viewer')) {
      const existingScript = document.querySelector('script[src*="model-viewer"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
        document.head.appendChild(script);
      }
    }
  }, []);

  useEffect(() => {
    if (modelId) {
      setLoading(true);
      setError(null);
      axios.get(`${backendUrl}/api/3d-models/get-model/${modelId}`)
        .then(res => {
          if (res.data && (res.data.fileUrl || res.data.url)) {
            const rawUrl = res.data.fileUrl || res.data.url;
            setModelUrl(formatModelUrl(rawUrl));
          } else {
            setError("3D Model file not found on server.");
          }
        })
        .catch(err => {
          console.error("Failed to load model for AR:", err);
          setError("Failed to load 3D model metadata.");
        })
        .finally(() => setLoading(false));
    } else if (initialUrl) {
      setModelUrl(formatModelUrl(initialUrl));
      setLoading(false);
    }
  }, [modelId, initialUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-[100dvw] text-gray-500 font-medium bg-[#f0f0f0] gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading AR View...</span>
      </div>
    );
  }

  if (error || !modelUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-[100dvw] text-gray-600 font-medium bg-[#f0f0f0] p-6 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center max-w-sm">
          <svg className="w-12 h-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Model Unavailable</h2>
          <p className="text-sm text-gray-500 mb-4">{error || "No valid 3D model URL provided."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100dvw', height: '100dvh', margin: 0, padding: 0, backgroundColor: '#f0f0f0' }} className="relative overflow-hidden w-[100dvw] h-[100dvh]">
      <model-viewer
        src={modelUrl}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        autoplay
        camera-orbit="0deg 75deg 180%"
        field-of-view="35deg"
        min-camera-orbit="auto auto 30%"
        max-camera-orbit="auto auto 500%"
        shadow-intensity="1"
        shadow-softness="0.8"
        style={{ width: '100dvw', height: '100dvh' }}
        onError={(err) => {
          console.error("model-viewer load error:", err);
          setError("Failed to load or parse 3D model (.glb/.gltf).");
        }}
      >
        <button 
          slot="ar-button" 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-900 border border-gray-200/80 px-5 py-3 rounded-full font-semibold text-sm shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 z-50 cursor-pointer whitespace-nowrap pointer-events-auto"
        >
          <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 004 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.27 6.96L12 12.01l8.73-5.05" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22.08V12" />
          </svg>
          <span className="whitespace-nowrap leading-none">View in your space</span>
        </button>
      </model-viewer>
    </div>
  );
};

export default ARView;
