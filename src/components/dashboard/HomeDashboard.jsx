import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Car,
  Navigation,
  Wallet,
  Users,
  FileText,
  ShieldAlert,
  Sparkles,
  PlusCircle,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Play,
  Gauge,
  Zap,
  Wrench,
  IndianRupee
} from 'lucide-react';
import { FleetHealthRingWidget } from './FleetHealthRingWidget';
import { hapticFeedback } from '../../lib/haptics';

export const HomeDashboard = () => {
  const {
    t,
    language,
    business,
    vehicles,
    drivers,
    bookings,
    getDocumentAlerts,
    getServiceAlerts,
    getSmartNotifications,
    getFinancialStats,
    getFleetStats,
    setActiveTab,
    activePill,
    setActivePill,
    openMoreSubView,
    setIsNewBookingOpen,
    setEditingBooking,
    setNewBookingPrefill,
    setIsNotificationsOpen,
    setSelectedInvoiceBooking,
    setSettlementBooking,
    setSelectedTripDetailBooking,
    setIsQuickQuoteOpen,
    setServiceModalVehicle,
    formatCurrency
  } = useApp();

  const handleOpenNewBooking = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    hapticFeedback.medium();
    if (setEditingBooking) setEditingBooking(null);
    if (setNewBookingPrefill) setNewBookingPrefill(null);
    setIsNewBookingOpen(true);
  };

  const financialStats = getFinancialStats();
  const fleetStats = getFleetStats();
  const alerts = getDocumentAlerts ? getDocumentAlerts() : [];
  const serviceAlerts = getServiceAlerts ? getServiceAlerts() : [];
  const smartNotifs = getSmartNotifications ? getSmartNotifications() : [];
  const urgentSmartNotifs = smartNotifs.filter(n => (n.severity === 'critical' || n.severity === 'urgent') && !n.isRead);
  const primaryAlert = urgentSmartNotifs[0] || smartNotifs.find(n => !n.isRead);
  const totalUnreadNotifs = smartNotifs.filter(n => !n.isRead).length;

  // Find current on-trip or ongoing bookings
  const ongoingTrips = bookings.filter(b => b.status === 'Ongoing');
  const ongoingTrip = ongoingTrips[0] || bookings.find(b => b.status === 'Confirmed' || b.status === 'Driver Assigned');

  // Dynamic Real-Time Current Week Dates
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso);

  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Start from Sunday of current week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const isToday = iso === todayIso;

      // Check if there are active or scheduled bookings on this date
      const dateBookings = bookings.filter(b => {
        if (!b.startDateTime || b.status === 'Cancelled') return false;
        const bStart = b.startDateTime.split('T')[0];
        const bEnd = (b.endDateTime || b.startDateTime).split('T')[0];
        return iso >= bStart && iso <= bEnd;
      });

      return {
        day: dayLabels[i],
        date: d.getDate(),
        month: d.toLocaleString('default', { month: 'short' }),
        fullDate: d,
        iso: iso,
        isToday: isToday,
        hasTrips: dateBookings.length > 0,
        tripCount: dateBookings.length
      };
    });
  }, [bookings, todayIso]);

  // Find trips for the selected day
  const selectedDayInfo = weekDays.find(w => w.iso === selectedDateIso) || weekDays.find(w => w.isToday) || weekDays[0];
  const selectedDayTrips = bookings.filter(b => {
    if (!b.startDateTime || b.status === 'Cancelled') return false;
    const bStart = b.startDateTime.split('T')[0];
    const bEnd = (b.endDateTime || b.startDateTime).split('T')[0];
    return selectedDateIso >= bStart && selectedDateIso <= bEnd;
  });

  // Current Month & Year label
  const currentMonthYear = useMemo(() => {
    const d = selectedDayInfo?.fullDate || new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedDayInfo]);

  // Category Filter Pills
  const isHindi = language === 'hi';
  const pillCategories = [
    { id: 'all', label: isHindi ? 'ओवरव्यू' : 'Overview' },
    { id: 'bookings', label: isHindi ? 'बुकिंग्स' : 'Bookings' },
    { id: 'fleet', label: isHindi ? 'फ्लीट' : 'Fleet' },
    { id: 'money', label: isHindi ? 'हिसाब' : 'Money' },
    { id: 'papers', label: isHindi ? 'कागजात' : 'Papers Vault' },
    { id: 'customers', label: isHindi ? 'ग्राहक' : 'Customers' }
  ];

  const handlePillClick = (catId) => {
    setActivePill(catId);
    if (catId === 'bookings') {
      setActiveTab('trips');
    } else if (catId === 'fleet') {
      setActiveTab('fleet');
    } else if (catId === 'money') {
      setActiveTab('money');
    } else if (catId === 'papers') {
      openMoreSubView('papers');
      setActiveTab('more');
    } else if (catId === 'customers') {
      openMoreSubView('crm');
      setActiveTab('more');
    }
  };

  return (
    <div className="space-y-4 pt-1 animate-fade-in">
      {/* 1. Expressive Headline + Quick Quote Action */}
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-[#111827] tracking-tight leading-snug">
            {t('headerTitle')}
          </h1>
          <p className="text-xs text-[#8A8782] font-bold">
            {business.name} • {business.city} ({vehicles.length} Fleet Cars)
          </p>
        </div>

        <button
          onClick={() => setIsQuickQuoteOpen(true)}
          className="px-3.5 py-1.5 rounded-full bg-white border border-[#EFEAE2] text-[#111827] text-xs font-black flex items-center gap-1.5 shadow-soft hover:bg-gray-50 tap-active"
        >
          <Zap className="w-3.5 h-3.5 text-[#F39E36]" />
          <span>Quick Quote</span>
        </button>
      </div>

      {/* 2. Interactive Calendar Day Picker Strip (Real Dynamic Dates) */}
      <div className="bg-white rounded-3xl p-3.5 shadow-soft border border-[#EFEAE2]/80 space-y-2">
        {/* Month Header & Status */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#F39E36]" />
            <span className="text-xs font-black text-[#111827]">
              {currentMonthYear}
            </span>
          </div>
          {selectedDateIso !== todayIso && (
            <button
              onClick={() => setSelectedDateIso(todayIso)}
              className="text-[10px] font-extrabold text-[#F39E36] hover:underline flex items-center gap-0.5 tap-active"
            >
              <span>Back to Today</span>
            </button>
          )}
        </div>

        {/* 7 Days Row */}
        <div className="flex items-center justify-between">
          {weekDays.map((item) => {
            const isSelected = selectedDateIso === item.iso;
            return (
              <button
                key={item.iso}
                onClick={() => setSelectedDateIso(item.iso)}
                className="flex flex-col items-center space-y-1 py-1 px-2 rounded-2xl transition-all tap-active group relative"
              >
                <span className="text-[11px] font-bold text-[#8A8782]">{item.day}</span>
                <div className={`w-8 h-8 rounded-full flex flex-col items-center justify-center text-xs font-black transition-all relative ${
                  isSelected
                    ? 'bg-[#F39E36] text-white shadow-sm scale-110'
                    : item.isToday
                    ? 'text-[#111827] bg-[#FDF2E2] ring-1.5 ring-[#F39E36]/50'
                    : 'text-[#111827] hover:bg-gray-100'
                }`}>
                  <span>{item.date}</span>
                </div>
                {/* Trip Indicator Dot */}
                {item.hasTrips && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-[#F39E36]' : 'bg-[#111827]'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Summary Pill if has trips or selected */}
        {selectedDayTrips.length > 0 && (
          <div
            onClick={() => setActiveTab('trips')}
            className="pt-1 border-t border-[#EFEAE2]/60 flex items-center justify-between text-[11px] font-bold text-[#374151] cursor-pointer hover:text-[#111827] px-1 tap-active"
          >
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{selectedDayInfo?.isToday ? 'Today' : `${selectedDayInfo?.month} ${selectedDayInfo?.date}`}: {selectedDayTrips.length} {selectedDayTrips.length === 1 ? 'trip active/scheduled' : 'trips active/scheduled'}</span>
            </span>
            <span className="text-[10px] text-[#F39E36] font-black flex items-center">
              <span>View Trips</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        )}
      </div>

      {/* 3. 2-Column Bento Metrics Grid (matching Screen 3 in app_ui_ux.jpg) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bento 1: Fleet On-Road */}
        <div
          onClick={() => setActiveTab('trips')}
          className="bg-white rounded-3xl p-4 shadow-soft border border-[#EFEAE2]/80 cursor-pointer tap-active transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#EBF7EE] flex items-center justify-center text-emerald-700 shadow-xs">
              <Car className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#8A8782]">{t('carsOnTrip')}</span>
          </div>
          <div className="pt-2">
            <div className="text-xl font-black text-[#111827]">
              {fleetStats.onTrip} <span className="text-xs font-semibold text-[#8A8782]">/ {vehicles.length}</span>
            </div>
            <div className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{fleetStats.free} Ready for trip</span>
            </div>
          </div>
        </div>

        {/* Bento 2: Today Revenue */}
        <div
          onClick={() => setActiveTab('money')}
          className="bg-white rounded-3xl p-4 shadow-soft border border-[#EFEAE2]/80 cursor-pointer tap-active transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#FDF2E2] flex items-center justify-center text-[#F39E36] shadow-xs">
              <IndianRupee className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#8A8782]">{t('todayCollection')}</span>
          </div>
          <div className="pt-2">
            <div className="text-xl font-black text-[#111827]">
              ₹{(financialStats.totalCollectedToday / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] font-extrabold text-[#F39E36] flex items-center gap-1 pt-0.5">
              <span>₹{(financialStats.pendingCustomers / 1000).toFixed(1)}k dues</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Category Filter Tabs (Honey Caramel Active Pill matching app_ui_ux.jpg) */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
        {pillCategories.map(cat => {
          const isActive = activePill === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handlePillClick(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap tap-active ${
                isActive
                  ? 'bg-[#F39E36] text-white shadow-xs scale-102'
                  : 'bg-white border border-[#EFEAE2]/80 text-[#8A8782] hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 5. Smart Radar Alert Banner (if any unread alerts) */}
      {primaryAlert && (
        <div
          onClick={() => setIsNotificationsOpen(true)}
          className={`rounded-3xl p-3.5 flex items-center justify-between cursor-pointer shadow-soft border tap-active transition-all ${
            primaryAlert.severity === 'critical'
              ? 'bg-rose-50/80 border-rose-200 text-rose-950'
              : primaryAlert.severity === 'urgent'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : primaryAlert.category === 'trips'
              ? 'bg-blue-50/80 border-blue-200 text-blue-950'
              : primaryAlert.category === 'money'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-yellow-50/80 border-yellow-200 text-yellow-950'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
              primaryAlert.severity === 'critical'
                ? 'bg-rose-200 text-rose-900'
                : primaryAlert.severity === 'urgent'
                ? 'bg-amber-200 text-amber-900'
                : primaryAlert.category === 'trips'
                ? 'bg-blue-200 text-blue-900'
                : primaryAlert.category === 'money'
                ? 'bg-emerald-200 text-emerald-900'
                : 'bg-yellow-200 text-yellow-900'
            }`}>
              {primaryAlert.severity === 'critical' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : primaryAlert.category === 'trips' ? (
                <Car className="w-5 h-5" />
              ) : primaryAlert.category === 'money' ? (
                <IndianRupee className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-[#111827]">
                {primaryAlert.title}
              </p>
              <p className="text-[11px] text-[#8A8782] font-bold line-clamp-1">
                {primaryAlert.subtitle}
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs shrink-0 ${
            primaryAlert.severity === 'critical' || primaryAlert.severity === 'urgent'
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-[#111827] text-white'
          }`}>
            {totalUnreadNotifs} {totalUnreadNotifs === 1 ? 'Alert' : 'Alerts'}
          </span>
        </div>
      )}

      {/* 6. Periodic Maintenance Overdue Alert Banner (if any) */}
      {serviceAlerts.some(sa => sa.isOverdue) && (
        <div
          onClick={() => openMoreSubView('papers')}
          className="bg-rose-50/80 border border-rose-200 rounded-3xl p-3.5 flex items-center justify-between cursor-pointer shadow-soft tap-active"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-200 flex items-center justify-center text-rose-900 font-bold">
              <Wrench className="w-5 h-5 text-rose-900" />
            </div>
            <div>
              <p className="text-xs font-black text-rose-950">
                Car Service Overdue: {serviceAlerts.find(sa => sa.isOverdue)?.vehiclePlate}
              </p>
              <p className="text-[11px] text-rose-800 font-bold">
                Odometer service interval exceeded. Tap to log workshop invoice.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-rose-200 text-rose-950 px-2.5 py-1 rounded-full shadow-xs">
            Service Due
          </span>
        </div>
      )}

      {/* 7. Fleet Health Ring & Distribution Card (matching Screen 3 in app_ui_ux.jpg) */}
      <FleetHealthRingWidget />

      {/* 8. Fleet Status Pulse Matrix (Mood-History Style matching Screen 1 in app_ui_ux.jpg) */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-[#EFEAE2]/80 space-y-3 stagger-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
            {t('fleetPulseTitle')}
          </h3>
          <button
            onClick={() => setActiveTab('fleet')}
            className="text-[#8A8782] hover:text-[#111827] p-1 font-bold text-xs"
          >
            View Fleet ➔
          </button>
        </div>

        {/* 5 Pastel Status Circles */}
        <div className="flex items-center justify-between pt-1 px-1">
          {/* Free Cars */}
          <div
            onClick={() => setActiveTab('fleet')}
            className="flex flex-col items-center space-y-1 cursor-pointer tap-active"
          >
            <div className="w-12 h-12 rounded-full bg-[#EBF7EE] border border-green-200 flex items-center justify-center text-green-700 shadow-xs">
              <span className="text-base">🟢</span>
            </div>
            <span className="text-[11px] font-black text-[#111827]">{fleetStats.free}</span>
            <span className="text-[9px] font-bold text-[#8A8782]">{t('carsFree')}</span>
          </div>

          {/* On-Road */}
          <div
            onClick={() => setActiveTab('trips')}
            className="flex flex-col items-center space-y-1 cursor-pointer tap-active"
          >
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
              <span className="text-base">🚖</span>
            </div>
            <span className="text-[11px] font-black text-[#111827]">{fleetStats.onTrip}</span>
            <span className="text-[9px] font-bold text-[#8A8782]">{t('carsOnTrip')}</span>
          </div>

          {/* Workshop */}
          <div
            onClick={() => setActiveTab('fleet')}
            className="flex flex-col items-center space-y-1 cursor-pointer tap-active"
          >
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] border border-red-200 flex items-center justify-center text-red-700 shadow-xs">
              <span className="text-base">🔧</span>
            </div>
            <span className="text-[11px] font-black text-[#111827]">{fleetStats.workshop}</span>
            <span className="text-[9px] font-bold text-[#8A8782]">{t('carsMaintenance')}</span>
          </div>

          {/* Today Collection */}
          <div
            onClick={() => setActiveTab('money')}
            className="flex flex-col items-center space-y-1 cursor-pointer tap-active"
          >
            <div className="w-12 h-12 rounded-full bg-[#E0F2FE] border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs">
              <span className="text-base">💵</span>
            </div>
            <span className="text-[11px] font-black text-[#111827]">
              ₹{(financialStats.totalCollectedToday / 1000).toFixed(1)}k
            </span>
            <span className="text-[9px] font-bold text-[#8A8782]">{t('todayCollection')}</span>
          </div>

          {/* Expiry Alerts */}
          <div
            onClick={() => setIsNotificationsOpen(true)}
            className="flex flex-col items-center space-y-1 cursor-pointer tap-active"
          >
            <div className="w-12 h-12 rounded-full bg-[#FCE7F3] border border-pink-200 flex items-center justify-center text-pink-700 shadow-xs">
              <span className="text-base">⚠️</span>
            </div>
            <span className="text-[11px] font-black text-[#111827]">{alerts.length}</span>
            <span className="text-[9px] font-bold text-[#8A8782]">Alerts</span>
          </div>
        </div>
      </div>

      {/* 9. Quick Actions Carousel (matching Screen 1 Actions in app_ui_ux.jpg) */}
      <div className="space-y-2 stagger-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
            Quick Operations
          </h3>
          <button
            type="button"
            onClick={handleOpenNewBooking}
            className="text-xs font-black text-[#F39E36] flex items-center gap-0.5 cursor-pointer hover:underline tap-active bg-transparent border-0 p-0"
          >
            <span>+ Create Booking</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Tile 1: New Booking */}
          <div
            onClick={handleOpenNewBooking}
            role="button"
            tabIndex={0}
            className="bg-white rounded-3xl p-4 shadow-soft border border-[#EFEAE2]/80 hover:border-[#F39E36]/50 cursor-pointer transition-all tap-active flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#111827]">{t('tileNewBooking')}</h4>
              <p className="text-[10px] text-[#8A8782] font-semibold">{t('tileNewBookingSub')}</p>
            </div>
          </div>

          {/* Tile 2: Today's Trips */}
          <div
            onClick={() => setActiveTab('trips')}
            className="bg-white rounded-3xl p-4 shadow-soft border border-[#EFEAE2]/80 hover:border-[#F39E36]/50 cursor-pointer transition-all tap-active flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-700 font-bold shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <Navigation className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#111827]">{t('tileTodayTrips')}</h4>
              <p className="text-[10px] text-[#8A8782] font-semibold">
                {bookings.filter(b => b.status === 'Ongoing').length} active on-road
              </p>
            </div>
          </div>

          {/* Tile 3: Cars Fleet */}
          <div
            onClick={() => setActiveTab('fleet')}
            className="bg-white rounded-3xl p-4 shadow-soft border border-[#EFEAE2]/80 hover:border-[#F39E36]/50 cursor-pointer transition-all tap-active flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#111827]">{t('tileFleet')}</h4>
              <p className="text-[10px] text-[#8A8782] font-semibold">
                {vehicles.length} cars registered
              </p>
            </div>
          </div>

          {/* Tile 4: Daily Money */}
          <div
            onClick={() => setActiveTab('money')}
            className="bg-white rounded-3xl p-4 shadow-soft border border-[#EFEAE2]/80 hover:border-[#F39E36]/50 cursor-pointer transition-all tap-active flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#111827]">{t('tileMoney')}</h4>
              <p className="text-[10px] text-[#8A8782] font-semibold">
                {formatCurrency(financialStats.pendingCustomers)} due
              </p>
            </div>
          </div>

          {/* Tile 5: Customers CRM */}
          <div
            onClick={() => openMoreSubView('crm')}
            className="bg-white rounded-3xl p-4 shadow-soft border border-[#EFEAE2]/80 hover:border-[#F39E36]/50 cursor-pointer transition-all tap-active flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-700 font-bold shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#111827]">{t('tileCustomers')}</h4>
              <p className="text-[10px] text-[#8A8782] font-semibold">{t('tileCustomersSub')}</p>
            </div>
          </div>

          {/* Tile 6: Papers & Vault */}
          <div
            onClick={() => openMoreSubView('papers')}
            className="bg-white rounded-3xl p-4 shadow-soft border border-[#EFEAE2]/80 hover:border-[#F39E36]/50 cursor-pointer transition-all tap-active flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-700 font-bold shadow-xs mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#111827]">RTO Papers Vault</h4>
              <p className="text-[10px] text-[#8A8782] font-semibold">RC, Insurance, PUC Radar</p>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Active Trip Spotlight (Hero Player Card - matching Screen 2 in app_ui_ux.jpg) */}
      {ongoingTrip ? (
        <div
          onClick={() => setSelectedTripDetailBooking(ongoingTrip)}
          className="bg-white rounded-3xl p-5 shadow-soft border border-[#EFEAE2]/80 space-y-4 stagger-3 cursor-pointer transition-all tap-active group"
        >
          {/* Header Bar: Status Badge & Trip Type Pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black text-[#111827] uppercase tracking-wider">
                {ongoingTrip.status === 'Ongoing' ? 'Active Trip On-Road' : 'Next Scheduled Dispatch'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-black bg-[#FDF2E2] text-[#C97514] px-3 py-0.5 rounded-full border border-[#F39E36]/30">
                {ongoingTrip.tripType || 'Outstation'}
              </span>
              <span className="text-xs font-bold text-[#8A8782] group-hover:text-[#111827] transition-colors pl-1">
                Details ›
              </span>
            </div>
          </div>

          {/* Customer & Vehicle Headline */}
          <div className="space-y-1">
            <h4 className="text-lg font-black text-[#111827] tracking-tight leading-snug group-hover:text-emerald-800 transition-colors">
              {ongoingTrip.customerName}
            </h4>
            <p className="text-xs text-[#8A8782] font-bold flex items-center gap-1.5">
              <span className="text-[#111827] font-extrabold">🚗 {ongoingTrip.vehiclePlate}</span>
              <span>•</span>
              <span>{ongoingTrip.driverName || 'Assigned Driver'}</span>
            </p>
          </div>

          {/* Spacious Visual Route Timeline (No crammed single lines!) */}
          <div className="bg-[#FAF8F2] rounded-2xl p-3.5 border border-[#EFEAE2]/80 space-y-2.5">
            {/* Pickup Node */}
            <div className="flex items-start space-x-2.5">
              <div className="flex flex-col items-center mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
                <div className="w-0.5 h-6 bg-[#E5DFD3] my-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8782]">Pickup Point</span>
                <p className="text-xs font-black text-[#111827] truncate leading-tight">
                  {ongoingTrip.pickupLocation || 'Pickup Location'}
                </p>
              </div>
            </div>

            {/* Dropoff Node */}
            <div className="flex items-start space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F39E36] ring-4 ring-amber-100 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8782]">Drop Destination</span>
                <p className="text-xs font-black text-[#111827] truncate leading-tight">
                  {ongoingTrip.dropLocation || 'Drop Location'}
                </p>
              </div>
            </div>
          </div>

          {/* 2-Column Fare & Due Bento Grid (Clean, Bold, High Contrast) */}
          <div className="grid grid-cols-2 gap-3 pt-0.5">
            <div className="bg-white rounded-2xl p-3 border border-[#EFEAE2]/80 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8782]">Total Fare</span>
              <span className="text-base font-black text-[#111827] pt-0.5">
                {formatCurrency(ongoingTrip.totalFare)}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-[#EFEAE2]/80 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8782]">Pending Due</span>
              <span className={`text-base font-black pt-0.5 ${Number(ongoingTrip.balancePending || 0) > 0 ? 'text-[#EA580C]' : 'text-emerald-700'}`}>
                {formatCurrency(ongoingTrip.balancePending)}
              </span>
            </div>
          </div>

          {/* Balanced Action Bar with Generous Tap Target */}
          <div className="flex items-center space-x-2.5 pt-1">
            {ongoingTrip.status === 'Ongoing' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSettlementBooking(ongoingTrip);
                }}
                className="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-soft tap-active"
              >
                <Gauge className="w-4 h-4" />
                <span>Settle Meter & Collect</span>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('trips');
                }}
                className="flex-1 py-3 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-black flex items-center justify-center gap-2 shadow-soft tap-active"
              >
                <Navigation className="w-4 h-4 text-[#DDF262]" />
                <span>View in Trips Dispatch</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedInvoiceBooking(ongoingTrip);
              }}
              className="px-5 py-3 rounded-full bg-white border border-[#EFEAE2] text-[#111827] text-xs font-black flex items-center gap-1.5 hover:bg-gray-50 tap-active shadow-soft"
              title="Generate Invoice / Bill"
            >
              <FileText className="w-3.5 h-3.5 text-[#8A8782]" />
              <span>Bill</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-[#EFEAE2]/80 text-center space-y-3 stagger-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto text-xl shadow-xs">
            🚖
          </div>
          <div>
            <h4 className="text-sm font-black text-[#111827]">No Active Trips</h4>
            <p className="text-xs text-[#8A8782] font-semibold mt-0.5 max-w-xs mx-auto">
              Create your first booking to track driver dispatch, live duty, and payment settlements.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewBooking}
            className="px-5 py-2.5 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-black shadow-xs tap-active inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#D4F05B]" />
            <span>+ Create First Booking</span>
          </button>
        </div>
      )}
    </div>
  );
};
