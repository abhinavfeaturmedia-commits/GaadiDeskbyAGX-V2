import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  User,
  MapPin,
  FileText
} from 'lucide-react';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    loginUser,
    registerUser,
    loginWithGoogle,
    drivers,
    language,
    toggleLanguage
  } = useApp();

  const isHindi = language === 'hi';

  // Auth Channel: 'phone' | 'email'
  const [authChannel, setAuthChannel] = useState('phone');

  // Step state: 1: Credential Entry, 2: OTP, 3: Business Profile (Register only), 4: Plan Choice
  const [step, setStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState('right');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [emailRaw, setEmailRaw] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Business Profile Form (Clean zero-state for new registration)
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('Pune');
  const [gstin, setGstin] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(['Sedan', 'SUV', 'Airport Drops']);
  const [selectedPlan, setSelectedPlan] = useState('Starter (5 Cars)');

  if (!isAuthModalOpen) return null;

  // Format Phone with space grouping (e.g. 98220 12345)
  const formatPhoneDisplay = (digits) => {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  const handlePhoneInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneRaw(raw);
  };

  const goToNextStep = (nextStepNumber) => {
    setSlideDirection('right');
    setStep(nextStepNumber);
  };

  const goToPrevStep = (prevStepNumber) => {
    setSlideDirection('left');
    setStep(prevStepNumber);
  };

  // Step 1: Submit Phone or Email
  const handleCredentialSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (authChannel === 'phone') {
      if (phoneRaw.length < 10) {
        setErrorMsg(isHindi ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
        return;
      }
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailRaw.trim())) {
        setErrorMsg(isHindi ? 'कृपया वैध ईमेल या Gmail पता दर्ज करें' : 'Please enter a valid email or Gmail address');
        return;
      }
    }

    goToNextStep(2);
  };

  // Google 1-Tap OAuth
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setErrorMsg(err.message || 'Google Sign-In failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // OTP Input Change
  const handleOtpChange = (index, value) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanDigit;
    setOtp(newOtp);

    // Auto-advance to next input if digit entered
    if (cleanDigit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // OTP KeyDown (Backspace Reverse Navigation)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
        }
      }
    }
  };

  // OTP Paste Handling
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const digits = pastedData.split('');
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const lastIndex = Math.min(digits.length - 1, 5);
      const targetInput = document.getElementById(`otp-input-${lastIndex}`);
      if (targetInput) targetInput.focus();

      if (pastedData.length === 6) {
        setTimeout(() => {
          verifyAndProceed(pastedData);
        }, 150);
      }
    }
  };

  const handleAutoFillOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6']);
  };

  const verifyAndProceed = async (codeString) => {
    if (codeString.length !== 6) {
      setErrorMsg(isHindi ? 'कृपया 6 अंकों का OTP दर्ज करें' : 'Please enter 6-digit OTP');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        await loginUser({
          phone: authChannel === 'phone' ? phoneRaw : '',
          email: authChannel === 'email' ? emailRaw.trim().toLowerCase() : ''
        });
      } else {
        goToNextStep(3);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    verifyAndProceed(otp.join(''));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!businessName.trim() || !ownerName.trim()) {
      setErrorMsg(isHindi ? 'कृपया एजेंसी और मालिक का नाम भरें' : 'Please provide fleet & owner name');
      return;
    }
    setErrorMsg('');
    goToNextStep(4);
  };

  const handleFinalRegister = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await registerUser({
        phone: authChannel === 'phone' ? phoneRaw : '',
        email: authChannel === 'email' ? emailRaw.trim().toLowerCase() : '',
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        city,
        gstin: gstin.trim().toUpperCase(),
        businessTypes: selectedTypes,
        plan: selectedPlan
      });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBusinessType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3 sm:p-4">
      <div className="modal-card-center relative w-full max-w-md bg-white border-2 border-[#E5DFD3] rounded-3.5xl p-5 sm:p-7 text-[#111827] shadow-2xl max-h-[92vh] overflow-y-auto smooth-scroll-container">

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 border border-[#E5DFD3] text-[#111827] hover:bg-gray-200 transition tap-active shadow-xs font-black"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center justify-between pr-10 mb-4">
          <div className="flex items-center space-x-3">
            <img
              src="/gaadidesk_logo.png"
              alt="GaadiDesk by AGX"
              className="w-10 h-10 rounded-2xl object-cover shadow-sm ring-1 ring-black/5"
            />
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base font-black tracking-tight text-[#111827]">Gaadi<span className="text-[#22C55E]">Desk</span></span>
                <span className="text-[10px] font-bold text-[#4B5563]">by AGX</span>
              </div>
              <span className="text-[11px] block text-[#4B5563] font-bold">Fleet & Cab Management</span>
            </div>
          </div>

          <button
            onClick={toggleLanguage}
            className="text-xs font-black bg-gray-50 text-[#111827] px-2.5 py-1 rounded-full border border-[#E5DFD3] shadow-xs tap-active"
          >
            {language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
          </button>
        </div>

        {/* Mode Switch Tabs (Login vs Register) */}
        {step <= 2 && (
          <div className="flex bg-gray-100 p-1 rounded-full border border-[#E5DFD3] shadow-xs mb-4">
            <button
              onClick={() => { setAuthMode('register'); setStep(1); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-full text-xs font-black transition-all tap-active ${
                authMode === 'register'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              {isHindi ? 'नया खाता (14-दिन फ्री)' : 'Register (14-Day Free)'}
            </button>
            <button
              onClick={() => { setAuthMode('login'); setStep(1); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-full text-xs font-black transition-all tap-active ${
                authMode === 'login'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              {isHindi ? 'लॉगिन करें' : 'Login'}
            </button>
          </div>
        )}

        {/* Step Indicator Pills (When in Register Mode) */}
        {authMode === 'register' && (
          <div className="flex items-center justify-between mb-5 px-1">
            {[
              { num: 1, label: authChannel === 'phone' ? (isHindi ? 'फोन' : 'Phone') : 'Email' },
              { num: 2, label: 'OTP' },
              { num: 3, label: isHindi ? 'प्रोफाइल' : 'Profile' },
              { num: 4, label: isHindi ? 'प्लान' : 'Plan' },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                      step >= s.num
                        ? 'bg-[#111827] text-white'
                        : 'bg-gray-100 text-gray-400 border border-[#E5DFD3]'
                    }`}
                  >
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`text-[10px] font-black ${step >= s.num ? 'text-[#111827]' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mx-1 ${step > s.num ? 'bg-[#111827]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs font-black rounded-2xl flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ===================================================== */}
        {/* STEP 1: MOBILE NUMBER OR EMAIL/GMAIL ENTRY           */}
        {/* ===================================================== */}
        {step === 1 && (
          <form
            onSubmit={handleCredentialSubmit}
            className={`space-y-4 ${slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}`}
          >
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#111827]">
                {authMode === 'register'
                  ? (isHindi ? '14-दिन का निःशुल्क ट्रायल शुरू करें' : 'Start Your 14-Day Free Fleet Trial')
                  : (isHindi ? 'अपने GaadiDesk अकाउंट में लॉगिन करें' : 'Login to Your GaadiDesk Office')}
              </h3>
              <p className="text-xs text-[#4B5563] mt-0.5 font-semibold">
                {authChannel === 'phone'
                  ? (isHindi ? '10-अंकों का मोबाइल नंबर दर्ज करें।' : 'Enter your 10-digit mobile number for instant verification.')
                  : (isHindi ? 'अपना ईमेल या Gmail पता दर्ज करें।' : 'Enter your email or continue with your Google account.')}
              </p>
            </div>

            {/* Auth Channel Switcher (Phone vs Email) */}
            <div className="flex bg-gray-100 p-1 rounded-2xl border border-[#E5DFD3] shadow-xs">
              <button
                type="button"
                onClick={() => { setAuthChannel('phone'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all tap-active flex items-center justify-center space-x-1.5 ${
                  authChannel === 'phone'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthChannel('email'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all tap-active flex items-center justify-center space-x-1.5 ${
                  authChannel === 'email'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isHindi ? 'ईमेल / Gmail' : 'Email / Gmail'}</span>
              </button>
            </div>

            {/* CHANNEL A: MOBILE PHONE INPUT */}
            {authChannel === 'phone' && (
              <div className="space-y-1">
                <label htmlFor="mobile-number-input" className="text-xs font-black text-[#111827] block">
                  {isHindi ? 'मोबाइल नंबर / WhatsApp Number' : 'Mobile / WhatsApp Number'}
                </label>
                <div className="flex items-center rounded-2xl border-2 border-[#E5DFD3] bg-white overflow-hidden shadow-xs focus-within:border-[#111827]">
                  <div className="px-3 py-3 bg-gray-50 border-r border-[#E5DFD3] flex items-center space-x-1.5 text-xs font-black text-[#111827] select-none shrink-0">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    id="mobile-number-input"
                    type="tel"
                    maxLength={11}
                    value={formatPhoneDisplay(phoneRaw)}
                    onChange={handlePhoneInputChange}
                    placeholder="98220 12345"
                    className="w-full px-3 py-3 bg-white text-sm font-black text-[#111827] placeholder-gray-400 focus:outline-none tracking-wide"
                    autoFocus
                  />
                </div>

                {/* Real-time Driver Detection Badge */}
                {(() => {
                  const rawDigits = phoneRaw.replace(/\D/g, '');
                  const detectedDriver = drivers.find(d => {
                    const cleanDrv = (d.phone || '').replace(/\D/g, '');
                    return cleanDrv.endsWith(rawDigits.slice(-10)) || (rawDigits.length >= 10 && cleanDrv.includes(rawDigits.slice(-10)));
                  });

                  if (detectedDriver) {
                    return (
                      <div className="p-2.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between animate-fade-in shadow-xs mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">🚗</span>
                          <div>
                            <span className="text-xs font-black text-emerald-950 block">{detectedDriver.name}</span>
                            <span className="text-[10px] text-emerald-700 font-bold">Registered Driver Detected</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-2 py-0.5 rounded-full">
                          Duty Screen
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* CHANNEL B: EMAIL / GMAIL INPUT */}
            {authChannel === 'email' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="email-address-input" className="text-xs font-black text-[#111827] block">
                    {isHindi ? 'ईमेल या Gmail पता' : 'Email or Gmail Address'}
                  </label>
                  <div className="flex items-center rounded-2xl border-2 border-[#E5DFD3] bg-white overflow-hidden shadow-xs focus-within:border-[#111827]">
                    <div className="px-3 py-3 bg-gray-50 border-r border-[#E5DFD3] flex items-center text-xs font-black text-gray-500 select-none shrink-0">
                      <Mail className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                      id="email-address-input"
                      type="email"
                      value={emailRaw}
                      onChange={(e) => setEmailRaw(e.target.value)}
                      placeholder="owner@toursandtravels.com"
                      className="w-full px-3 py-3 bg-white text-sm font-black text-[#111827] placeholder-gray-400 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Google 1-Tap OAuth Button */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E5DFD3]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-2 text-gray-400 font-bold">or sign in with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-3 bg-white hover:bg-gray-50 border-2 border-[#E5DFD3] rounded-2xl text-xs font-black text-[#111827] shadow-xs transition tap-active flex items-center justify-center space-x-2.5"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#111827]" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>{isHindi ? 'Google / Gmail से 1-क्लिक लॉगिन' : 'Continue with Google / Gmail'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 1 Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#111827] hover:bg-black text-white font-black text-sm shadow-md transition tap-active flex items-center justify-center space-x-2"
            >
              <span>{isHindi ? 'OTP कोड प्राप्त करें' : 'Get Verification Code'}</span>
              <ArrowRight className="w-4 h-4 text-[#D4F05B]" />
            </button>
          </form>
        )}

        {/* ===================================================== */}
        {/* STEP 2: 6-DIGIT OTP VERIFICATION                     */}
        {/* ===================================================== */}
        {step === 2 && (
          <form
            onSubmit={handleVerifyOtp}
            className={`space-y-4 ${slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}`}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToPrevStep(1)}
                className="text-xs font-black text-[#4B5563] hover:text-[#111827] flex items-center space-x-1 tap-active"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{authChannel === 'phone' ? (isHindi ? 'नंबर बदलें' : 'Change Phone') : (isHindi ? 'ईमेल बदलें' : 'Change Email')}</span>
              </button>
              <span className="text-xs font-black text-[#EA580C]">
                {authChannel === 'phone' ? `+91 ${formatPhoneDisplay(phoneRaw)}` : emailRaw}
              </span>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-[#111827]">
                {isHindi ? 'सत्यापन कोड दर्ज करें' : 'Enter 6-Digit Verification Code'}
              </h3>
              <p className="text-xs text-[#4B5563] mt-0.5 font-semibold">
                {authChannel === 'phone'
                  ? (isHindi ? 'आपके मोबाइल पर 6-अंकों का OTP भेजा गया है।' : 'Enter the 6-digit code sent to your mobile number.')
                  : (isHindi ? 'आपके ईमेल पर भेजा गया सत्यापन कोड दर्ज करें।' : 'Enter the 6-digit code sent to your email address.')}
              </p>
            </div>

            {/* OTP 6 Boxes */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2 py-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-full h-11 sm:h-12 text-center text-lg font-black bg-white border-2 border-[#E5DFD3] rounded-xl text-[#111827] focus:outline-none focus:border-[#111827] shadow-xs"
                />
              ))}
            </div>

            {/* Auto-fill Helper */}
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="px-3 py-1 rounded-full bg-[#D4F05B] text-[#111827] font-black border border-[#BFDD38] hover:bg-[#c4e048] tap-active"
              >
                ⚡ Auto-fill Code (123456)
              </button>
              <span className="text-[10px] text-[#4B5563] font-bold">Resend in 24s</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-full bg-[#111827] hover:bg-black text-white font-black text-sm shadow-md transition tap-active flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>
                    {authMode === 'login'
                      ? (isHindi ? 'लॉगिन करें' : 'Verify & Enter Dashboard')
                      : (isHindi ? 'आगे बढ़ें (प्रोफाइल)' : 'Continue to Profile')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#D4F05B]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ===================================================== */}
        {/* STEP 3: BUSINESS PROFILE SETUP (REGISTER ONLY)       */}
        {/* ===================================================== */}
        {step === 3 && (
          <form
            onSubmit={handleProfileSubmit}
            className={`space-y-3.5 ${slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}`}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToPrevStep(2)}
                className="text-xs font-black text-[#4B5563] hover:text-[#111827] flex items-center space-x-1 tap-active"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <span className="text-xs font-black text-[#4B5563]">Step 3 of 4</span>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-[#111827]">
                {isHindi ? 'अपने ट्रेवल्स/फ्लीट का विवरण भरें' : 'Set Up Your Fleet Business'}
              </h3>
              <p className="text-xs text-[#4B5563] mt-0.5 font-semibold">
                {isHindi ? 'यह जानकारी आपके इनवॉइस और ड्यूटी स्लिप पर दिखाई देगी।' : 'This information will appear on your GST invoices & duty slips.'}
              </p>
            </div>

            <div className="space-y-2.5">
              <div>
                <label htmlFor="business-name-input" className="text-xs font-black text-[#111827] block mb-1">
                  {isHindi ? 'एजेंसी / कंपनी का नाम *' : 'Travels / Fleet Agency Name *'}
                </label>
                <input
                  id="business-name-input"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Pune City Tours & Travels"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#E5DFD3] rounded-2xl text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827] shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="owner-name-input" className="text-xs font-black text-[#111827] block mb-1">
                    {isHindi ? 'मालिक का नाम *' : 'Owner / Manager Name *'}
                  </label>
                  <input
                    id="owner-name-input"
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Amit Patil"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#E5DFD3] rounded-2xl text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827] shadow-xs"
                  />
                </div>
                <div>
                  <label htmlFor="city-select-input" className="text-xs font-black text-[#111827] block mb-1">
                    {isHindi ? 'शहर / बेस सिटी *' : 'Base City *'}
                  </label>
                  <select
                    id="city-select-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#E5DFD3] rounded-2xl text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827] shadow-xs"
                  >
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Kolhapur">Kolhapur</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Jaipur">Jaipur</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="gstin-input" className="text-xs font-black text-[#111827] block mb-1">
                  {isHindi ? 'GSTIN नंबर (वैकल्पिक)' : 'GSTIN Number (Optional)'}
                </label>
                <input
                  id="gstin-input"
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#E5DFD3] rounded-2xl text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827] shadow-xs uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#111827] block mb-1">
                  {isHindi ? 'गाड़ियों के प्रकार (Categories)' : 'Vehicle Categories in Your Fleet'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Sedan', icon: '🚗' },
                    { label: 'MUV', icon: '🚙' },
                    { label: 'SUV', icon: '🏎️' },
                    { label: 'Luxury', icon: '✨' },
                    { label: 'Airport Drops', icon: '✈️' },
                    { label: 'Outstation', icon: '🛣️' },
                  ].map((cat) => {
                    const isSelected = selectedTypes.includes(cat.label);
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => toggleBusinessType(cat.label)}
                        className={`px-3 py-1.5 rounded-full text-xs font-black transition-all tap-bounce flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-[#111827] text-white shadow-xs'
                            : 'bg-gray-100 border border-[#E5DFD3] text-[#374151] hover:bg-gray-200'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                        {isSelected && <span className="ml-0.5 text-[#D4F05B]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#111827] hover:bg-black text-white font-black text-sm shadow-md transition tap-active flex items-center justify-center space-x-2"
            >
              <span>{isHindi ? 'आगे बढ़ें (प्लान चुनें)' : 'Continue to Plan Selection'}</span>
              <ArrowRight className="w-4 h-4 text-[#D4F05B]" />
            </button>
          </form>
        )}

        {/* ===================================================== */}
        {/* STEP 4: PLAN SELECTION & 14-DAY TRIAL CONFIRMATION   */}
        {/* ===================================================== */}
        {step === 4 && (
          <div className={`space-y-3.5 ${slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}`}>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToPrevStep(3)}
                className="text-xs font-black text-[#4B5563] hover:text-[#111827] flex items-center space-x-1 tap-active"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <span className="text-xs font-black text-[#4B5563]">Step 4 of 4</span>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-[#111827]">
                {isHindi ? '14-दिन का फ्री ट्रायल एक्टिवेट करें' : 'Activate 14-Day Free Fleet Access'}
              </h3>
              <p className="text-xs text-[#4B5563] mt-0.5 font-semibold">
                {isHindi ? 'कोई अग्रिम भुगतान नहीं। 14 दिन पूरी तरह मुफ्त।' : 'No credit card needed. Full access to all fleet tools.'}
              </p>
            </div>

            {/* Plan Cards */}
            <div className="space-y-2">
              {[
                { name: 'Starter (5 Cars)', price: '₹499/mo', desc: 'Unlimited bookings, WhatsApp slips, clash guard' },
                { name: 'Growth (15 Cars)', price: '₹999/mo', desc: 'GST tax bills, 15-day RTO expiry radar, cash ledger', popular: true },
                { name: 'Business (35 Cars)', price: '₹1,799/mo', desc: 'Multi-staff access, corporate customer billing' },
              ].map((p) => {
                const isSelected = selectedPlan === p.name;
                return (
                  <div
                    key={p.name}
                    onClick={() => setSelectedPlan(p.name)}
                    className={`p-3 rounded-2.5xl border-2 transition-all cursor-pointer flex items-center justify-between tap-bounce ${
                      isSelected
                        ? 'bg-white border-[#111827] shadow-md'
                        : 'bg-gray-50 border-[#E5DFD3] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#111827] bg-[#111827]' : 'border-gray-400'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs font-black text-[#111827]">{p.name}</h4>
                          {p.popular && (
                            <span className="text-[9px] font-black uppercase bg-[#D4F05B] text-[#111827] px-1.5 py-0.2 rounded-full border border-[#BFDD38]">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#4B5563] font-semibold">{p.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#111827]">{p.price}</span>
                  </div>
                );
              })}
            </div>

            {/* Guarantee Tag */}
            <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-black flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>14-Day 100% Free Trial Activated • Cancel Anytime</span>
            </div>

            <button
              onClick={handleFinalRegister}
              disabled={isLoading}
              className="w-full py-3.5 rounded-full bg-[#111827] hover:bg-black text-white font-black text-sm shadow-md transition tap-active flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>🚀 {isHindi ? 'ट्रायल शुरू करें और डैशबोर्ड खोलें' : 'Launch 14-Day Free Fleet Office'}</span>
                  <ArrowRight className="w-4 h-4 text-[#D4F05B]" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>,
    getModalPortalRoot()
  );
};
