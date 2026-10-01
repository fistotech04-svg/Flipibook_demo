import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-slate-950 font-sans selection:bg-slate-900 selection:text-white relative">
      {/* Subtle grid background for a tech/premium feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="relative z-10 w-full max-w-[40vw] px-[2vw] text-center">
        <div className="inline-flex items-center justify-center p-[0.75vw] mb-[2.5vw] rounded-[1vw] bg-slate-50 border border-slate-100 shadow-sm">
          <Ghost className="w-[2.5vw] h-[2.5vw] text-slate-900" strokeWidth={1.5} />
        </div>

        <div className="space-y-[1.5vw]">
          <div className="space-y-[0.5vw]">
            <p className="text-[0.875vw] font-bold tracking-[0.2em] uppercase text-slate-400">
              Error 404
            </p>
            <h1 className="text-[3.5vw] font-extrabold tracking-tight text-slate-900 leading-tight">
              Page not found.
            </h1>
          </div>

          <p className="text-[1.125vw] text-slate-500 leading-relaxed max-w-[30vw] mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="mt-[3vw] flex flex-col sm:flex-row items-center justify-center gap-[1vw]">
          <button
            onClick={() => navigate('/home')}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-[0.5vw] px-[2vw] py-[1vw] bg-slate-950 text-white font-semibold rounded-full hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95 overflow-hidden text-[1vw]"
          >
            <Home className="w-[1.25vw] h-[1.25vw]" />
            <span>Back to Home</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-[0.5vw] px-[2vw] py-[1vw] bg-white text-slate-600 font-semibold rounded-full border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 active:scale-95 text-[1vw]"
          >
            <ArrowLeft className="w-[1.25vw] h-[1.25vw] transition-transform group-hover:-translate-x-[0.25vw]" />
            <span>Go back</span>
          </button>
        </div>

        <div className="mt-[6vw] pt-[3vw] border-t border-slate-100">
          <div className="flex flex-col items-center gap-[1vw]">
             <div className="flex items-center gap-[0.5vw] text-slate-400">
                <span className="text-[0.75vw] font-semibold uppercase tracking-widest text-slate-300">Navigation Error</span>
             </div>
             <p className="text-[0.75vw] text-slate-400">
               © 2026 Fisto IDC. All rights reserved.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
