import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import {
  X,
  Bell,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Car,
  IndianRupee,
  Wrench,
  CheckCheck,
  Check,
  ArrowRight
} from 'lucide-react';

export const NotificationModal = ({ onClose }) => {
  const {
    t,
    authUser,
    currentStaffRole,
    getSmartNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    setRenewalModalData,
    setSelectedTripDetailBooking,
    setCustomerSettlementData,
    setSelectedInvoiceBooking,
    setServiceModalVehicle,
    setDriverUpiModalData,
    setDriverActiveTab
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'urgent' | 'trips' | 'compliance' | 'money'

  const isDriver = authUser?.role === 'driver';
  const roleName = isDriver ? 'Driver' : (currentStaffRole || authUser?.role || 'Owner');
  const allNotifications = getSmartNotifications ? getSmartNotifications() : [];

  // Filter based on selected pill
  const filteredNotifications = allNotifications.filter(notif => {
    if (activeTabFilter === 'urgent') return notif.severity === 'critical' || notif.severity === 'urgent';
    if (activeTabFilter === 'trips') return notif.category === 'trips';
    if (activeTabFilter === 'compliance') return notif.category === 'compliance';
    if (activeTabFilter === 'money') return notif.category === 'money';
    return true;
  });

  const unreadCount = allNotifications.filter(n => !n.isRead).length;
  const urgentCount = allNotifications.filter(n => (n.severity === 'critical' || n.severity === 'urgent') && !n.isRead).length;
  const tripsCount = allNotifications.filter(n => n.category === 'trips' && !n.isRead).length;
  const complianceCount = allNotifications.filter(n => n.category === 'compliance' && !n.isRead).length;
  const moneyCount = allNotifications.filter(n => n.category === 'money' && !n.isRead).length;

  const handleAction = (notif) => {
    markNotificationAsRead(notif.id);
    onClose();

    switch (notif.actionType) {
      case 'RENEW_DOC':
        setRenewalModalData(notif.actionPayload);
        break;
      case 'SERVICE_VEHICLE':
        setServiceModalVehicle(notif.actionPayload);
        break;
      case 'ASSIGN_DRIVER':
      case 'VIEW_TRIP':
        setSelectedTripDetailBooking(notif.actionPayload);
        break;
      case 'VIEW_DRIVER_DUTY':
        if (setDriverActiveTab) setDriverActiveTab('duty');
        break;
      case 'COLLECT_CASH':
        if (setDriverUpiModalData) setDriverUpiModalData(notif.actionPayload);
        break;
      case 'SETTLE_CUSTOMER':
        setCustomerSettlementData(notif.actionPayload);
        break;
      case 'GENERATE_INVOICE':
        setSelectedInvoiceBooking(notif.actionPayload);
        break;
      default:
        break;
    }
  };

  const getCategoryIcon = (category, severity) => {
    if (severity === 'critical') return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
    switch (category) {
      case 'trips':
        return <Car className="w-3.5 h-3.5 text-blue-600" />;
      case 'compliance':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />;
      case 'money':
        return <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center bg-[#F8F6F0] rounded-3xl max-w-sm w-full p-4 shadow-2xl border-2 border-[#E5DFD3] flex flex-col max-h-[82vh] space-y-3 overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#E5DFD3] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="relative w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-bold shadow-xs shrink-0">
              <Bell className="w-4 h-4 text-amber-900" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-[#111827]">
                  {t('notifCenterTitle')}
                </h3>
                <span className="text-[8px] font-black bg-[#111827] text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  {roleName}
                </span>
              </div>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                {unreadCount > 0 ? `${unreadCount} unread radar alerts` : 'All alerts cleared'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white border border-[#E5DFD3] flex items-center justify-center text-gray-700 hover:bg-gray-100 tap-active shadow-xs shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {[
            { id: 'all', label: t('notifAllTab'), count: allNotifications.length },
            { id: 'urgent', label: t('notifUrgentTab'), count: urgentCount, isUrgent: true },
            { id: 'trips', label: t('notifTripsTab'), count: tripsCount },
            { id: 'compliance', label: t('notifComplianceTab'), count: complianceCount },
            { id: 'money', label: t('notifMoneyTab'), count: moneyCount }
          ].map(tab => {
            const isActive = activeTabFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabFilter(tab.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-all flex items-center gap-1 tap-active ${
                  isActive
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'bg-white border border-[#E5DFD3] text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.1 rounded-full text-[8px] font-black ${
                    isActive
                      ? tab.isUrgent ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'
                      : tab.isUrgent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications Scrollable List */}
        <div className="space-y-2 overflow-y-auto smooth-scroll-container flex-1 min-h-0 pr-0.5">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E5DFD3] shadow-xs space-y-1.5 my-auto">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-[#111827]">{t('notifEmptyTitle')}</h4>
              <p className="text-[10px] text-[#4B5563]">
                {t('notifEmptyDesc')}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isCritical = notif.severity === 'critical';
              const isUrgent = notif.severity === 'urgent';
              return (
                <div
                  key={notif.id}
                  className={`p-2.5 rounded-2xl border transition-all relative shadow-xs flex items-center justify-between gap-2 ${
                    notif.isRead
                      ? 'bg-white/60 border-gray-200 opacity-70'
                      : isCritical
                      ? 'bg-rose-50/90 border-rose-300'
                      : isUrgent
                      ? 'bg-amber-50/90 border-amber-300'
                      : notif.category === 'trips'
                      ? 'bg-blue-50/80 border-blue-200'
                      : notif.category === 'money'
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : 'bg-white border-[#E5DFD3]'
                  }`}
                >
                  {/* Left Info Column */}
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isCritical
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : isUrgent
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : notif.category === 'trips'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : notif.category === 'money'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getCategoryIcon(notif.category, notif.severity)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[11px] font-black text-[#111827] truncate leading-tight">
                          {notif.title}
                        </h4>
                        {notif.badgeText && (
                          <span className={`text-[7.5px] font-black px-1.2 py-0.1 rounded-sm uppercase tracking-wider shrink-0 ${
                            isCritical
                              ? 'bg-red-600 text-white'
                              : isUrgent
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}>
                            {notif.badgeText}
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] text-[#4B5563] font-semibold truncate leading-tight">
                        {notif.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right Action Button & Dismiss */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleAction(notif)}
                      className={`px-2.5 py-1 rounded-full text-[9.5px] font-black shadow-xs tap-active flex items-center gap-0.5 transition-all ${
                        isCritical || isUrgent
                          ? 'bg-[#111827] text-white hover:bg-black'
                          : 'bg-white border border-[#E5DFD3] text-[#111827] hover:bg-gray-50'
                      }`}
                    >
                      <span>{notif.actionLabel || 'View'}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>

                    {!notif.isRead && (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 tap-active"
                        title="Mark read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-2 border-t border-[#E5DFD3] flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => markAllNotificationsAsRead(allNotifications)}
            className="py-2 px-3 rounded-full bg-white border border-[#E5DFD3] text-[10.5px] font-black text-gray-700 hover:bg-gray-50 tap-active shadow-xs flex items-center justify-center gap-1 flex-1"
          >
            <CheckCheck className="w-3 h-3 text-emerald-600" />
            <span>{t('notifMarkAllRead')}</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-4 rounded-full bg-[#111827] text-white text-[10.5px] font-black hover:bg-black tap-active shadow-xs flex-1 text-center"
          >
            Close Radar
          </button>
        </div>

      </div>
    </div>,
    getModalPortalRoot()
  );
};

