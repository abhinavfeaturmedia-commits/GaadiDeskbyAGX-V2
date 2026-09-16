import React, { useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../../context/AppContext';
import {
  Navigation,
  Clock,
  Wallet,
  User,
  Languages,
  Car,
  Bell,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';

export const DriverShell = ({ children }) => {
  const {
    authUser,
    t,
    language,
    toggleLanguage,
    driverActiveTab,
    setDriverActiveTab,
    drivers,
    getDriverVehicle,
    getDriverActiveTrip,
    getUnreadNotificationCount,
    setIsNotificationsOpen,
    quickDemoLogin,
    isCloudConnected,
    cloudSyncStatus,
    syncWithCloud
  } = useApp();

  const contentRef = useRef(null);

  const isStandalone = typeof window !== 'undefined' && Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone ||
    Capacitor.isNativePlatform() ||
    window.Capacitor?.isNativePlatform?.()
  );

  // Smooth Drag-to-Scroll Support for Driver Shell
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    let isDown = false;
    let startY = 0;
    let initialScrollTop = 0;

    const handleMouseDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button, input, select, textarea, a, [role="button"]')) {
        return;
      }
      isDown = true;
      startY = e.clientY;
      initialScrollTop = el.scrollTop;
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      const dy = e.clientY - startY;
      el.scrollTop = initialScrollTop - dy;
    };

    const handleMouseUp = () => {
      isDown = false;
    };

    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const notifCounts = getUnreadNotificationCount ? getUnreadNotificationCount('driver') : { total: 0, urgent: 0 };
  const badgeCount = notifCounts.total;
  const isUrgent = notifCounts.urgent > 0;

  const currentDriver = drivers.find(d => d.id === authUser?.driverId) || {
    name: authUser?.name || 'Driver',
    phone: authUser?.phone || '+91 98901 44321',
    status: 'Available'
  };

  const assignedVehicle = getDriverVehicle(authUser?.driverId);
  const activeTrip = getDriverActiveTrip(authUser?.driverId);
  const isOnTrip = Boolean(activeTrip && activeTrip.status === 'Ongoing');

  return (
    <div className={`phone-shell font-sans text-text-primary bg-canvas selection:bg-accent-lime selection:text-[#111827] ${isStandalone ? 'is-standalone is-native-app' : ''}`}>
      {/* Driver Top Header Bar */}
      <div className="px-5 app-header-safe-top pb-2.5 flex items-center justify-between border-b border-[#E5DFD3]/60 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        {/* Left: Driver Avatar & Status */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-sm bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center font-black text-emerald-950 text-base">
              {currentDriver.name?.charAt(0) || 'D'}
            </div>
            {/* Live Status Dot */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
              isOnTrip ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                isOnTrip
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {isOnTrip ? t('driverOnDuty') : t('driverReadyForDuty')}
              </span>
            </div>
            <h2 className="text-sm font-black text-[#111827] leading-tight truncate max-w-[150px]">
              {currentDriver.name}
            </h2>
          </div>
        </div>

        {/* Right Controls: Cloud Status, Vehicle Pill, Language Switcher & Alerts */}
        <div className="flex items-center space-x-2">
          {/* Supabase Cloud Sync Status Pill */}
          <button
            onClick={() => syncWithCloud(true)}
            className={`px-2 py-1 rounded-full border shadow-soft text-xs font-black flex items-center gap-1.5 transition-all tap-active ${
              cloudSyncStatus === 'synced'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                : cloudSyncStatus === 'syncing'
                ? 'bg-blue-50 border-blue-300 text-blue-900 animate-pulse'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
            title={cloudSyncStatus === 'synced' ? 'Supabase Connected & Synced (Click to Refresh)' : 'Syncing with Supabase...'}
          >
            {cloudSyncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
            ) : cloudSyncStatus === 'synced' ? (
              <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            ) : (
              <CloudOff className="w-3 h-3 text-amber-600" />
            )}
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
              {cloudSyncStatus === 'synced' ? 'Cloud' : cloudSyncStatus === 'syncing' ? 'Syncing' : 'Local'}
            </span>
          </button>

          {/* Assigned Car Pill */}
          {assignedVehicle && (
            <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 bg-gray-50 border border-[#E5DFD3] rounded-full text-[11px] font-black text-[#111827]">
              <Car className="w-3 h-3 text-[#EA580C]" />
              <span className="truncate max-w-[90px]">{assignedVehicle.plate.split(' ')[0]}</span>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-full bg-white border border-card-border shadow-soft text-xs font-bold flex items-center gap-1 text-gray-800 hover:bg-gray-50 tap-active"
            title="Switch Language / भाषा बदलें"
          >
            <Languages className="w-3.5 h-3.5 text-accent-peach" />
            <span className="text-[11px] font-extrabold">{language === 'en' ? 'हिन्दी' : 'ENG'}</span>
          </button>

          {/* Driver Notifications */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative w-9 h-9 rounded-full bg-white border border-card-border shadow-soft flex items-center justify-center text-gray-800 hover:bg-gray-50 tap-active"
            title="Driver Alerts"
          >
            <Bell className="w-4 h-4" />
            {badgeCount > 0 && (
              <span className={`absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs ${
                isUrgent ? 'bg-red-500 badge-pulse' : 'bg-emerald-600'
              }`}>
                {badgeCount}
              </span>
            )}
          </button>

          {/* Switch to Fleet Owner Demo Mode (Quick testing helper) */}
          <button
            onClick={quickDemoLogin}
            className="w-8 h-8 rounded-full bg-amber-50 border border-amber-300 shadow-soft flex items-center justify-center text-amber-900 hover:bg-amber-100 tap-active"
            title="Switch to Owner View (Demo)"
          >
            <span className="text-xs">🏢</span>
          </button>
        </div>
      </div>

      {/* Main Content View with Smooth Scroll & Drag Emulation */}
      <div
        ref={contentRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 pb-40 pt-3 smooth-scroll-container overscroll-y-auto select-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>

      {/* Driver Floating Bottom Navigation Dock (Raised above browser bars & simulator controls) */}
      <div className="floating-dock-container absolute left-0 right-0 w-full px-4 pointer-events-none z-40">
        <div className="frosted-dock rounded-full px-3 py-2 flex items-center justify-between pointer-events-auto shadow-dock border-2 border-emerald-500/20 bg-white/95 backdrop-blur-lg">
          {/* Duty Cockpit Tab */}
          <button
            onClick={() => setDriverActiveTab('duty')}
            className={`flex items-center space-x-1.5 transition-all tap-active ${
              driverActiveTab === 'duty'
                ? 'bg-[#111827] text-white font-black px-4 py-2 rounded-full shadow-md scale-105'
                : 'text-[#4B5563] hover:text-[#111827] px-3 py-2'
            }`}
          >
            <Navigation className={`w-4 h-4 ${driverActiveTab === 'duty' ? 'text-[#D4F05B] stroke-[2.5]' : ''}`} />
            <span className="text-xs font-black">{t('navDriverDuty')}</span>
          </button>

          {/* Trip History Tab */}
          <button
            onClick={() => setDriverActiveTab('trips')}
            className={`flex items-center space-x-1.5 transition-all tap-active ${
              driverActiveTab === 'trips'
                ? 'bg-[#111827] text-white font-black px-4 py-2 rounded-full shadow-md scale-105'
                : 'text-[#4B5563] hover:text-[#111827] px-3 py-2'
            }`}
          >
            <Clock className={`w-4 h-4 ${driverActiveTab === 'trips' ? 'text-[#D4F05B] stroke-[2.5]' : ''}`} />
            <span className="text-xs font-black">{t('navDriverTrips')}</span>
          </button>

          {/* Cash & Bata Wallet Tab */}
          <button
            onClick={() => setDriverActiveTab('wallet')}
            className={`flex items-center space-x-1.5 transition-all tap-active ${
              driverActiveTab === 'wallet'
                ? 'bg-[#111827] text-white font-black px-4 py-2 rounded-full shadow-md scale-105'
                : 'text-[#4B5563] hover:text-[#111827] px-3 py-2'
            }`}
          >
            <Wallet className={`w-4 h-4 ${driverActiveTab === 'wallet' ? 'text-[#D4F05B] stroke-[2.5]' : ''}`} />
            <span className="text-xs font-black">{t('navDriverWallet')}</span>
          </button>

          {/* Profile & DL Tab */}
          <button
            onClick={() => setDriverActiveTab('profile')}
            className={`flex items-center space-x-1.5 transition-all tap-active ${
              driverActiveTab === 'profile'
                ? 'bg-[#111827] text-white font-black px-4 py-2 rounded-full shadow-md scale-105'
                : 'text-[#4B5563] hover:text-[#111827] px-3 py-2'
            }`}
          >
            <User className={`w-4 h-4 ${driverActiveTab === 'profile' ? 'text-[#D4F05B] stroke-[2.5]' : ''}`} />
            <span className="text-xs font-black">{t('navDriverProfile')}</span>
          </button>
        </div>
      </div>

      {/* Dedicated Phone Modal Anchor for strictly contained driver dialogs & vouchers */}
      <div id="phone-modal-root" className="phone-modal-container" />
    </div>
  );
};
