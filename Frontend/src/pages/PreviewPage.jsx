import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Icon } from '@iconify/react';
import FlipbookPreview from '../components/TemplateEditor/FlipbookPreview';
import { resolveUploadsPath, rewriteHtmlUploadsToSupabase } from '../utils/supabaseUtils';

const PreviewPage = () => {
  const [data, setData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const loadData = async () => {
      const searchParams = new URLSearchParams(location.search);
      const shareId = searchParams.get('shareId') || searchParams.get('v_id');

      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const currentUserEmail = user?.emailId || user?.email;

      if (!shareId) {
        setData({ error: true, errorMessage: "No flipbook ID specified for preview." });
        return;
      }

      try {
        const getBackendUrl = () => {
          if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
          const origin = window.location.origin;
          if (origin.includes('devtunnels.ms')) return origin.replace('-5173', '-5000');
          if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            const portMatch = origin.match(/:(\d+)/);
            if (portMatch) return origin.replace(portMatch[0], ':5000');
          }
          return 'http://localhost:5000';
        };
        const backendUrl = getBackendUrl();
        const params = currentUserEmail ? { emailId: currentUserEmail } : {};
        
        if (!currentUserEmail) {
          setData({ error: true, errorMessage: "Please login with the owner account to preview this flipbook." });
          return;
        }

        const res = await axios.get(`${backendUrl}/api/flipbook/public/get/${shareId}`, { params });

        if (!res.data?.isOwner) {
          setData({ error: true, errorMessage: "You do not have permission to preview another user's flipbook." });
          return;
        }

        if (res.data) {
          let processedData = res.data;

          const bUrl = processedData.meta?.baseUrl ? resolveUploadsPath(processedData.meta.baseUrl) : '';

          processedData.pages = (processedData.pages || []).filter(p => String(p.hide) !== '1' && p.isHidden !== true && String(p.isHidden) !== 'true').map(p => {
            let html = p.html || p.content || '';
            if (html.includes('nullassets/') && bUrl) html = html.split('nullassets/').join(`${bUrl}assets/`);
            if (html.includes('./assets/') && bUrl) html = html.split('./assets/').join(`${bUrl}assets/`);
            html = rewriteHtmlUploadsToSupabase(html);
            return { ...p, html };
          });

          const brandingObj = processedData.Customized_Settings?.Branding || {};
          const backgroundObj = processedData.Customized_Settings?.Background || {};
          const menuBarObj = processedData.Customized_Settings?.MenuBar || {};
          const otherSetupObj = processedData.Customized_Settings?.otherSetup || processedData.Customized_Settings?.othersetup || processedData.settings?.otherSetup || processedData.settings?.othersetup || {};
          const layoutsObj = processedData.Customized_Settings?.Layouts || {};
          const rawApp = processedData.Customized_Settings?.BookAppearance || processedData.Customized_Settings?.Appearance || processedData.settings?.BookAppearance || processedData.settings?.appearance || {};
          
          let validSpeed = rawApp.flipSpeed || 'Fast';
          if (validSpeed === 'medium') {
             validSpeed = 'Fast';
          } else if (validSpeed === 'Slow' && !rawApp.speedChanged) {
             validSpeed = 'Fast';
          }

          const appearanceObj = {
            texture: 'Plain White',
            hardCover: false,
            grainIntensity: 20,
            warmth: 0,
            textureScale: 0,
            opacity: 100,
            flipStyle: 'Classic Flip',
            flipSpeed: validSpeed,
            corner: 'Sharp',
            dropShadow: { active: true, color: '#4f4f4fff', opacity: 50, xAxis: 0, yAxis: 0, blur: 0, spread: 0 },
            ...rawApp,
            flipSpeed: validSpeed
          };
          const leadFormObj = processedData.Customized_Settings?.leadForm || processedData.Customized_Settings?.leadform || processedData.settings?.leadForm || processedData.settings?.leadform || {};
          const mergedSettings = {
            ...(processedData.meta || {}),
            FlipbookInfo: processedData.Customized_Settings?.FlipbookInfo || {},
            Branding: brandingObj,
            Background: backgroundObj,
            MenuBar: menuBarObj,
            Layouts: layoutsObj,
            BookAppearance: appearanceObj,
            otherSetup: otherSetupObj,
            leadForm: leadFormObj
          };

          setData({
            ...processedData,
            projectBaseUrl: bUrl,
            settings: mergedSettings,
            pageName: processedData.meta?.flipbookName || 'Preview'
          });
        }
      } catch (err) {
        console.error("Failed to fetch preview from backend DB:", err);
        setData({ error: true, errorMessage: err.response?.data?.message || "Failed to load flipbook data from database." });
      }
    };

    loadData();
  }, [location.search]);

  if (!data) {
    return (
      <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, backgroundColor: '#ffffff' }} />
    );
  }

  if (data.error) {
    const rawError = data.errorMessage || "No preview data found in database.";
    const isNoData = rawError === "No preview data found in database." || rawError === "No flipbook ID specified for preview.";

    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-slate-950 font-sans selection:bg-slate-900 selection:text-white relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="relative z-10 w-full max-w-[40vw] px-[2vw] text-center select-none animate-in fade-in duration-300">
          <div className="inline-flex items-center justify-center p-[0.75vw] mb-[2.5vw] rounded-[1vw] bg-slate-50 border border-slate-100 shadow-sm">
            {!isNoData ? (
              <Icon icon="lucide:lock" className="w-[2.5vw] h-[2.5vw] text-slate-800" />
            ) : (
              <Icon icon="lucide:eye-off" className="w-[2.5vw] h-[2.5vw] text-slate-800" />
            )}
          </div>

          <div className="space-y-[1.5vw]">
            <div className="space-y-[0.5vw]">
              <p className="text-[0.875vw] font-bold tracking-[0.2em] uppercase text-slate-400">
                {!isNoData ? "Access Restricted" : "No Preview Available"}
              </p>
              <h1 className="text-[3.5vw] font-extrabold tracking-tight text-slate-900 leading-tight">
                {!isNoData ? "Preview Restricted" : "No Preview Data Found"}
              </h1>
            </div>

            <p className="text-[1.125vw] text-slate-500 leading-relaxed max-w-[30vw] mx-auto">
              {!isNoData
                ? (rawError.toLowerCase().includes('permission') || rawError.toLowerCase().includes('owner') || rawError.toLowerCase().includes('user') || rawError.toLowerCase().includes('login')
                  ? "You do not have permission to preview another user's flipbook. Draft previews are strictly reserved for the owner account."
                  : rawError)
                : "No preview data found in database. Please return to the editor."}
            </p>
          </div>

          <div className="mt-[3vw] flex flex-col sm:flex-row items-center justify-center gap-[1vw]">
            <button
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = '/my-flipbooks';
                }
              }}
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-[0.5vw] px-[2vw] py-[1vw] bg-[#5551FF] text-white font-semibold rounded-full hover:bg-[#4338ca] transition-all duration-300 shadow-xl shadow-indigo-200 active:scale-95 text-[1vw] cursor-pointer"
            >
              <Icon icon="lucide:book-open" className="w-[1.25vw] h-[1.25vw]" />
              <span>Return to My Flipbooks</span>
            </button>

            <button
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = '/home';
                }
              }}
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-[0.5vw] px-[2vw] py-[1vw] bg-slate-950 text-white font-semibold rounded-full hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95 text-[1vw] cursor-pointer"
            >
              <Icon icon="lucide:home" className="w-[1.25vw] h-[1.25vw]" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="mt-[5vw] pt-[2.5vw] border-t border-slate-100">
            <p className="text-[0.75vw] text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} Fisto IDC. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pagesWithContent = data.pages.map(p => ({ ...p, content: p.html || '' }));

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <FlipbookPreview
        pages={pagesWithContent}
        pageName={data.pageName}
        onClose={() => window.close()}
        isMobile={false}
        isDoublePage={data.isDoublePage || false}
        targetPage={0}
        settings={data.settings || {}}
        baseUrl={data.projectBaseUrl || ''}
        v_id={data.v_id}
        isLoadingParent={false}
      />
    </div>
  );
};

export default PreviewPage;
