import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Zap,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Check,
  ShieldAlert,
  Car
} from 'lucide-react';

export const LandingPage = () => {
  const {
    openAuthModal,
    quickDemoLogin,
    language,
    toggleLanguage
  } = useApp();

  const isHindi = language === 'hi';
  const [openFaq, setOpenFaq] = useState(null);
  const [fleetSizeSlider, setFleetSizeSlider] = useState(8);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: isHindi ? 'क्या मेरे ड्राइवर इसे आसानी से समझ पाएंगे?' : 'Will my drivers be able to use it without confusion?',
      a: isHindi
        ? 'हाँ, बिल्कुल। बड़े टच बटन और हिंदी-इंग्लिश सपोर्ट के साथ कोई भी ड्राइवर सिर्फ 2 टैप में मीटर फोटो और टोल-डीजल का हिसाब भेज सकता है।'
        : 'Yes. Designed with big buttons and Hindi/English toggle. Any driver can submit odometer snaps and fuel receipts in just 2 taps.'
    },
    {
      q: isHindi ? 'क्या यह बिना इंटरनेट (हाईवे व घाट) पर भी चलेगा?' : 'Does it work without internet on highways and ghat routes?',
      a: isHindi
        ? 'हाँ, GaadiDesk 100% ऑफलाइन काम करता है। नेटवर्क न होने पर भी ट्रिप रिकॉर्ड होगी और सिग्नल मिलते ही अपने आप सिंक हो जाएगी।'
        : 'Yes. 100% offline-first. Record trips and expenses anywhere. Everything auto-syncs securely the second connectivity returns.'
    },
    {
      q: isHindi ? '14-दिन के ट्रायल के बाद क्या शुल्क है?' : 'What is the price after the 14-day free trial?',
      a: isHindi
        ? 'प्लान्स सिर्फ ₹499/माह से शुरू होते हैं (1 गाड़ी के डीजल से भी कम)। कोई लंबा कॉन्ट्रैक्ट नहीं, जब चाहें 1 क्लिक में बंद करें।'
        : 'Plans start at just ₹499/month (less than a single tank of diesel). No contracts, cancel anytime with one click.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#111827] font-sans antialiased selection:bg-[#EA580C] selection:text-white">
      
      {/* ---------------------------------------------------- */}
      {/* 1. TOP HEADER NAVIGATION                             */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#F8F6F0]/95 backdrop-blur-md border-b border-[#E5DFD3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2.5">
            <img
              src="/gaadidesk_logo.png"
              alt="GaadiDesk by AGX"
              className="w-9 h-9 rounded-2xl object-cover shadow-sm ring-1 ring-black/5"
            />
            <div className="flex items-baseline space-x-1">
              <span className="text-base sm:text-lg font-black tracking-tight text-[#111827]">Gaadi<span className="text-[#22C55E]">Desk</span></span>
              <span className="text-[10px] font-bold text-[#4B5563]">by AGX</span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full bg-white border border-[#E5DFD3] hover:border-gray-400 text-xs font-black text-[#111827] transition tap-active shadow-xs"
            >
              {isHindi ? 'English' : 'हिंदी'}
            </button>

            <button
              onClick={quickDemoLogin}
              className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#D4F05B] hover:bg-[#c2de4a] border border-[#BFDD38] text-[#111827] text-xs font-black transition tap-active shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHindi ? 'डेमो' : 'Demo'}</span>
            </button>

            <button
              onClick={() => openAuthModal('login')}
              className="hidden sm:block px-3 py-1 rounded-full bg-white hover:bg-gray-50 border border-[#E5DFD3] text-xs font-black text-[#111827] transition tap-active shadow-xs"
            >
              {isHindi ? 'लॉगिन' : 'Login'}
            </button>

            <button
              onClick={() => openAuthModal('register')}
              className="px-3.5 py-1.5 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-black shadow-md transition tap-active"
            >
              {isHindi ? 'फ्री ट्रायल' : 'Start Free'}
            </button>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. MINIMALIST PUNCHY HERO SECTION                   */}
      {/* ---------------------------------------------------- */}
      <section className="relative z-10 pt-8 sm:pt-14 pb-10 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        {/* Micro Pill Badge */}
        <div className="inline-flex items-center space-x-2 bg-white border border-[#E5DFD3] px-3.5 py-1 rounded-full shadow-xs mb-4">
          <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
          <span className="text-[11px] sm:text-xs font-black text-[#111827] tracking-wide">
            {isHindi ? '🇮🇳 भारतीय कैब व ट्रेवल्स ऑपरेटरों के लिए' : '🇮🇳 Built for Indian Fleet & Cab Operators'}
          </span>
        </div>

        {/* Short, Authoritative Headline (2 Lines Max) */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#111827] tracking-tight leading-[1.15] max-w-3xl mx-auto">
          {isHindi ? (
            <>
              न गाड़ियों की डबल बुकिंग, <br />
              <span className="text-[#EA580C]">न ड्राइवर कैश का नुकसान।</span>
            </>
          ) : (
            <>
              Stop Double-Booking Cars. <br />
              <span className="text-[#EA580C]">Stop Losing Driver Cash.</span>
            </>
          )}
        </h1>

        {/* Ultra-Short 1-Sentence Subtitle */}
        <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-[#374151] max-w-lg mx-auto font-bold leading-relaxed">
          {isHindi
            ? 'दिन में सिर्फ 10 मिनट अपने मोबाइल से पूरी फ्लीट चलाएं। 30 सेकंड में व्हाट्सएप बुकिंग स्लिप, GST बिल और पाई-पाई का हिसाब।'
            : 'Run your entire fleet from WhatsApp and your phone in 10 minutes a day. Instant duty slips, GST invoices, and zero cash leakage.'}
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => openAuthModal('register')}
            className="px-7 py-3.5 rounded-full bg-[#111827] hover:bg-black text-white font-black text-sm shadow-xl transition tap-active flex items-center space-x-2 scale-102 hover:scale-105"
          >
            <span>{isHindi ? '🚀 14-दिन का निःशुल्क ट्रायल शुरू करें' : '🚀 Start 14-Day Free Trial'}</span>
            <ArrowRight className="w-4 h-4 text-[#D4F05B]" />
          </button>

          <button
            onClick={quickDemoLogin}
            className="px-5 py-3.5 rounded-full bg-white hover:bg-gray-50 border-2 border-[#E5DFD3] text-[#111827] font-black text-sm shadow-xs transition tap-active flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4 text-[#EA580C]" />
            <span>{isHindi ? 'लाइव डेमो देखें' : 'Try Live Demo'}</span>
          </button>
        </div>

        {/* Minimalist 1-Line Trust Bar */}
        <p className="mt-4 text-xs font-bold text-[#6B7280]">
          ✓ No credit card required &nbsp;•&nbsp; 60-second setup &nbsp;•&nbsp; Works 100% offline
        </p>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 3. HARD PROOF METRICS STRIP (3 STATS ONLY)           */}
      {/* ---------------------------------------------------- */}
      <section className="py-4 sm:py-5 bg-white border-y border-[#E5DFD3]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 text-center">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#111827] block">0%</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#4B5563] block">
                {isHindi ? 'डबल बुकिंग क्लैश' : 'Double Bookings'}
              </span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#EA580C] block">₹0</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#4B5563] block">
                {isHindi ? 'लापता ड्राइवर कैश' : 'Lost Driver Cash'}
              </span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 block">30s</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#4B5563] block">
                {isHindi ? 'व्हाट्सएप बुकिंग स्लिप' : 'WhatsApp Slips'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. THE 3 CORE PILLARS (MINIMALIST 3-CARD BENTO)     */}
      {/* ---------------------------------------------------- */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-[11px] uppercase tracking-widest font-black text-[#EA580C]">Simple & Deadly Effective</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight mt-1">
            {isHindi ? '3 मुख्य फीचर्स, शून्य सिरदर्द' : '3 Core Tools. Zero Complexity.'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Clash Guard */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#E5DFD3] shadow-xs hover:shadow-md transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-950 flex items-center justify-center text-lg font-black">
              🛡️
            </div>
            <h3 className="text-base font-black text-[#111827]">
              {isHindi ? '1. स्मार्ट क्लैश गार्ड' : '1. Smart Clash Guard'}
            </h3>
            <p className="text-xs text-[#4B5563] font-bold leading-relaxed">
              {isHindi
                ? 'सिस्टम ओवरलैपिंग समय पकड़कर एक ही गाड़ी दो जगह बुक होने से पूरी तरह रोकता है। 2 AM की सिरदर्दी खत्म।'
                : 'Mathematically blocks duplicate bookings. You will never accidentally promise the same car to two parties.'}
            </p>
          </div>

          {/* Card 2: Cash Ledger */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#E5DFD3] shadow-xs hover:shadow-md transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-950 flex items-center justify-center text-lg font-black">
              💰
            </div>
            <h3 className="text-base font-black text-[#111827]">
              {isHindi ? '2. लाइव ड्राइवर लेजर' : '2. Live Cash & Fuel Ledger'}
            </h3>
            <p className="text-xs text-[#4B5563] font-bold leading-relaxed">
              {isHindi
                ? 'मीटर फोटो, डीजल रसीदें और टोल का पूरा हिसाब। रात 9 बजे ड्राइवर से पाई-पाई का पक्का हिसाब लें।'
                : 'Digital odometer photos and fuel slips. Know exact net cash collected and due at 9 PM every day.'}
            </p>
          </div>

          {/* Card 3: WhatsApp & GST */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#E5DFD3] shadow-xs hover:shadow-md transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-950 flex items-center justify-center text-lg font-black">
              ⚡
            </div>
            <h3 className="text-base font-black text-[#111827]">
              {isHindi ? '3. 30-सेकंड व्हाट्सएप स्लिप' : '3. 30-Sec WhatsApp Slips'}
            </h3>
            <p className="text-xs text-[#4B5563] font-bold leading-relaxed">
              {isHindi
                ? 'ग्राहक को बुकिंग स्लिप, ड्राइवर को ड्यूटी कार्ड और कॉर्पोरेट पार्टी को पक्का GST बिल 1 टैप में भेजें।'
                : '1-tap customer vouchers, driver duty cards, and professional GST invoices sent directly on WhatsApp.'}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 5. FAST FLEET SAVINGS CALCULATOR                     */}
      {/* ---------------------------------------------------- */}
      <section className="py-8 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-[#E5DFD3] shadow-md text-center">
          <span className="text-[11px] uppercase font-black text-[#EA580C] tracking-wider">Fast ROI Estimate</span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111827] mt-1">
            {isHindi ? 'आपकी मासिक बचत का अनुमान:' : 'How Much You Save Every Month:'}
          </h3>

          <div className="mt-6 max-w-md mx-auto space-y-2 text-left">
            <div className="flex justify-between items-center text-xs font-black text-[#111827]">
              <span>Fleet Size / गाड़ियाँ:</span>
              <span className="px-3 py-1 bg-[#111827] text-white rounded-full text-xs font-black">
                {fleetSizeSlider} {fleetSizeSlider === 1 ? 'Car' : 'Cars'}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="35"
              value={fleetSizeSlider}
              onChange={(e) => setFleetSizeSlider(Number(e.target.value))}
              className="w-full accent-[#111827] h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-[#F8F6F0] p-3.5 rounded-2xl border border-[#E5DFD3]">
              <span className="text-[11px] text-[#4B5563] font-black block">Recovered Cash Leakage</span>
              <span className="text-xl font-black text-[#EA580C] mt-0.5 block">₹{(fleetSizeSlider * 4200).toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-[#F8F6F0] p-3.5 rounded-2xl border border-[#E5DFD3]">
              <span className="text-[11px] text-[#4B5563] font-black block">Time Saved / Month</span>
              <span className="text-xl font-black text-emerald-700 mt-0.5 block">~{Math.round(fleetSizeSlider * 4)} hrs</span>
            </div>
          </div>

          <div className="mt-5 text-xs font-black text-emerald-950 bg-emerald-50 py-2.5 px-3 rounded-xl border border-emerald-200">
            Estimated Value: <span className="text-emerald-700 font-black">₹{(fleetSizeSlider * 4200).toLocaleString('en-IN')}/mo</span> vs Plan (Starts ₹499/mo)
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 6. THE NO-BRAINER OFFER & UNCONDITIONAL GUARANTEE   */}
      {/* ---------------------------------------------------- */}
      <section className="py-10 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="bg-[#111827] rounded-3xl p-6 sm:p-8 text-white text-center shadow-xl space-y-4">
          <span className="text-[11px] uppercase tracking-widest font-black text-[#D4F05B]">The 100% No-Brainer Guarantee</span>
          <h2 className="text-xl sm:text-2xl font-black">
            {isHindi ? '14 दिन मुफ्त चलाकर देखें। कोई रिस्क नहीं।' : 'Try It Free for 14 Days. Zero Risk.'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-bold max-w-lg mx-auto leading-relaxed">
            {isHindi
              ? 'यदि GaadiDesk पहले 7 दिनों में आपका 10+ घंटे का समय और 1 गाड़ी के डीजल जितना पैसा न बचाए, तो एक भी रुपया न दें। कोई क्रेडिट कार्ड नहीं चाहिए।'
              : 'If GaadiDesk does not save you 10+ hours and recover more cash than the price of a single tank of diesel in your first week, pay nothing. No credit card required.'}
          </p>

          <div className="pt-2">
            <button
              onClick={() => openAuthModal('register')}
              className="px-7 py-3.5 rounded-full bg-[#D4F05B] hover:bg-[#c2de4a] text-[#111827] font-black text-sm shadow-md transition tap-active inline-flex items-center space-x-2 scale-102 hover:scale-105"
            >
              <span>🚀 {isHindi ? '14-दिन का निःशुल्क ट्रायल शुरू करें' : 'Start 14-Day Free Trial Now'}</span>
              <ArrowRight className="w-4 h-4 text-[#111827]" />
            </button>
          </div>
          <span className="text-[10px] text-gray-400 block font-bold">Plans start at ₹499/mo after trial • Cancel anytime in 1 tap</span>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 7. QUICK 3-QUESTION FAQ ACCORDION                   */}
      {/* ---------------------------------------------------- */}
      <section className="py-8 px-4 sm:px-6 max-w-2xl mx-auto">
        <h3 className="text-xl font-black text-[#111827] text-center mb-5">
          {isHindi ? 'अक्सर पूछे जाने वाले सवाल' : 'Quick Answers'}
        </h3>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E5DFD3] shadow-xs overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left tap-active"
                >
                  <span className="text-xs font-black text-[#111827]">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#111827] transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 text-xs text-[#4B5563] leading-relaxed border-t border-gray-100 font-bold">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 8. FOOTER                                            */}
      {/* ---------------------------------------------------- */}
      <footer className="bg-white border-t border-[#E5DFD3] py-8 px-4 text-center text-xs text-[#4B5563] font-bold">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <img src="/gaadidesk_logo.png" alt="GaadiDesk" className="w-6 h-6 rounded-xl object-cover" />
            <span className="font-black text-[#111827]">Gaadi<span className="text-[#22C55E]">Desk</span></span>
            <span>— The Fleet Operating System</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button onClick={toggleLanguage} className="hover:text-[#111827] tap-active">
              {isHindi ? 'English' : 'हिंदी'}
            </button>
            <span>•</span>
            <button onClick={() => openAuthModal('login')} className="hover:text-[#111827] tap-active">
              Login
            </button>
            <span>•</span>
            <button onClick={() => openAuthModal('register')} className="hover:text-[#111827] tap-active">
              Free Trial
            </button>
          </div>
        </div>
        <p className="mt-4 text-[10px] text-[#6B7280]">
          © 2026 GaadiDesk Inc. Built for Indian Fleet Operators.
        </p>
      </footer>
    </div>
  );
};
