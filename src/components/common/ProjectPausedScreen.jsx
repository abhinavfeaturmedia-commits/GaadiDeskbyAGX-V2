import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Lock, AlertTriangle } from 'lucide-react';

export const ProjectPausedScreen = ({ onRetry, errorReason = '' }) => {
  const [retrying, setRetrying] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [lang, setLang] = useState('en'); // 'en' | 'hi'

  const handleManualRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      if (onRetry) await onRetry();
    } finally {
      setRetrying(false);
      setCountdown(15);
    }
  };

  // Auto-polling countdown every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleManualRetry();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRetry]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0A0D14] text-white flex flex-col items-center justify-between p-6 sm:p-8 select-none overflow-y-auto font-sans">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-red-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-600/10 blur-[130px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Header: Brand & Language Toggle */}
      <header className="relative z-10 w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black text-black text-sm">
            GD
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              GaadiDesk <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70">PRO</span>
            </span>
            <p className="text-[10px] text-white/40 tracking-wider uppercase font-medium">Smart Fleet Cloud</p>
          </div>
        </div>

        {/* Language switch */}
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors font-medium cursor-pointer"
        >
          {lang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
        </button>
      </header>

      {/* Main Lockdown Centerpiece */}
      <main className="relative z-10 my-auto w-full max-w-md flex flex-col items-center text-center py-6">
        {/* Pulsing Lock / Cloud Off Badge */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-3xl bg-red-500/20 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-b from-[#181D29] to-[#10141D] border border-red-500/30 flex items-center justify-center shadow-2xl">
            <ShieldAlert className="w-12 h-12 text-red-400" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-red-600 border-2 border-[#0A0D14] flex items-center justify-center shadow-md">
              <Lock className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-semibold tracking-wide mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>{lang === 'en' ? 'System Paused by Administrator' : 'एडमिन द्वारा सिस्टम बंद किया गया'}</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
          {lang === 'en' ? 'GaadiDesk Access Inactive' : 'गाड़ीडेस्क सिस्टम अभी बंद है'}
        </h1>

        {/* Explanation */}
        <p className="text-sm text-white/70 leading-relaxed max-w-sm mb-6">
          {lang === 'en' ? (
            <>
              This workspace has been temporarily paused from the central cloud dashboard.
              <span className="block mt-2 font-medium text-white/90">
                All services (Login, Registration, Driver Cockpit, and Operations) are locked.
              </span>
            </>
          ) : (
            <>
              यह GaadiDesk वर्कस्पेस सेंट्रल एडमिन द्वारा अस्थायी रूप से बंद (Pause) कर दिया गया है।
              <span className="block mt-2 font-medium text-white/90">
                लॉगिन, नया रजिस्ट्रेशन, ड्राइवर पोर्टल एवं सभी फीचर्स अभी बंद हैं।
              </span>
            </>
          )}
        </p>

        {/* Info Box for Clients / Testers */}
        <div className="w-full bg-[#121622] rounded-2xl p-4 border border-white/10 text-left mb-6 shadow-inner">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-white/80 space-y-1.5">
              <p className="font-semibold text-white">
                {lang === 'en' ? 'Evaluating or Testing this App?' : 'क्या आप यह ऍप टेस्ट कर रहे हैं?'}
              </p>
              <p className="text-white/60 leading-relaxed">
                {lang === 'en'
                  ? 'Access is under direct administrator control. As soon as the owner resumes the project in Supabase, this app will unlock automatically.'
                  : 'इस ऍप का नियंत्रण पूर्णतः एडमिन के पास है। जैसे ही ओनर सुपाबेस में प्रोजेक्ट रीज्यूम करेंगे, ऍप स्वतः चालू हो जाएगी।'}
              </p>
            </div>
          </div>

          {errorReason && (
            <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-white/40 flex items-center justify-between font-mono">
              <span>Status:</span>
              <span className="truncate max-w-[200px] text-red-300/80">{errorReason}</span>
            </div>
          )}
        </div>

        {/* Action Button: Manual Re-check */}
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={handleManualRetry}
            disabled={retrying}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
            <span>
              {retrying
                ? (lang === 'en' ? 'Checking Cloud Connection...' : 'कनेक्शन जाँचा जा रहा है...')
                : (lang === 'en' ? 'Re-check Connection' : 'पुनः कनेक्शन जाँचें')}
            </span>
          </button>

          {/* Auto-check progress text */}
          <p className="text-[11px] text-white/40 font-medium">
            {lang === 'en'
              ? `Auto-checking in ${countdown}s...`
              : `${countdown} सेकंड में ऑटो-चेक होगा...`}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-md pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Cloud Control Active
        </span>
        <span>GaadiDesk Enterprise Engine</span>
      </footer>
    </div>
  );
};
