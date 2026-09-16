import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, Zap, CheckCircle2 } from 'lucide-react';

export const SplashScreen = ({ onFinish, duration = 1600 }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar smoothly
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, duration / 22);

    // Trigger fade out slightly before finish
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, Math.max(duration - 350, 800));

    // Complete splash
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between px-6 py-12 select-none transition-all duration-400 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#080C16',
        backgroundImage:
          'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.14) 0%, rgba(6, 78, 59, 0.05) 45%, transparent 70%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)'
      }}
    >
      {/* Top Ambient Badge */}
      <div className="w-full flex items-center justify-between pt-2 max-w-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
            Fleet Intelligence v1.0
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Enterprise Secure</span>
        </div>
      </div>

      {/* Center Brand & Tagline Showcase */}
      <div className="flex flex-col items-center text-center max-w-sm w-full my-auto">
        {/* Glow halo behind logo */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-3xl blur-2xl animate-pulse"></div>
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-3xl p-1 bg-gradient-to-br from-emerald-400/40 via-slate-800 to-emerald-600/30 shadow-2xl shadow-emerald-950/80 border border-white/10 flex items-center justify-center overflow-hidden">
            <img
              src="/gaadidesk_logo.png"
              alt="GaadiDesk"
              className="w-full h-full object-cover rounded-2xl transform transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        {/* Brand Name */}
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Outfit']">
            Gaadi<span className="text-emerald-400">Desk</span>
          </h1>
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
            by AGX
          </span>
        </div>

        {/* Primary High-Impact Tagline */}
        <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-normal mb-2.5">
          Smart Fleet & Driver Operations
        </h2>

        {/* Sub-Tagline / Value Pillars */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-400/90 tracking-wide bg-emerald-950/40 border border-emerald-500/20 px-3.5 py-1.5 rounded-full mb-6">
          <span>Trips</span>
          <span className="text-slate-600">•</span>
          <span>Settlements</span>
          <span className="text-slate-600">•</span>
          <span>RTO Compliance</span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-56 h-1.5 bg-slate-800/90 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(52,211,153,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="w-full text-center pb-2">
        <p className="text-[11px] text-slate-400 tracking-wider">
          Simplifying Fleet Management for India's Transporters
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
