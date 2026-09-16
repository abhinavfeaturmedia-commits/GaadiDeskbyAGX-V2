import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { hapticFeedback } from '../../lib/haptics';
import { getModalPortalRoot } from '../../lib/modalContainer';
import {
  Navigation,
  Plus,
  Search,
  Filter,
  Phone,
  MessageSquare,
  FileText,
  Clock,
  MapPin,
  Car,
  User,
  ChevronRight,
  Check,
  Play,
  X,
  Gauge,
  Receipt,
  Sparkles
} from 'lucide-react';

export const BookingsList = () => {
  const {
    t,
    bookings,
    vehicles,
    drivers,
    setIsNewBookingOpen,
    setEditingBooking,
    setNewBookingPrefill,
    startTrip,
    setSettlementBooking,
    setSelectedInvoiceBooking,
    setSelectedTripDetailBooking,
    setWhatsAppData,
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

  const [dateFilter, setDateFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [startTripModal, setStartTripModal] = useState(null);
  const [startKmInput, setStartKmInput] = useState('');
  const [displayLimit, setDisplayLimit] = useState(15);

  const dateFilters = ['Today', 'Tomorrow', 'This Week', 'Upcoming', 'All'];
  const statuses = ['All', 'Ongoing', 'Driver Assigned', 'Confirmed', 'Completed', 'Cancelled'];

  // Reset pagination whenever filters or search query changes
  useEffect(() => {
    setDisplayLimit(15);
  }, [dateFilter, statusFilter, searchQuery]);

  const filteredBookings = bookings.filter(b => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const nextWeekTime = Date.now() + 7 * 86400000;
    const bDate = (b.startDateTime || '').split('T')[0];

    let matchesDate = true;
    if (dateFilter === 'Today') {
      matchesDate = bDate === todayStr || b.status === 'Ongoing';
    } else if (dateFilter === 'Tomorrow') {
      matchesDate = bDate === tomorrowStr;
    } else if (dateFilter === 'This Week') {
      const bTime = new Date(b.startDateTime).getTime();
      matchesDate = bTime >= Date.now() - 86400000 && bTime <= nextWeekTime;
    } else if (dateFilter === 'Upcoming') {
      const bTime = new Date(b.startDateTime).getTime();
      matchesDate = bTime >= Date.now() || b.status === 'Ongoing';
    }

    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesSearch =
      b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickupLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.dropLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehiclePlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesStatus && matchesSearch;
  });

  const visibleBookings = filteredBookings.slice(0, displayLimit);
  const hasMore = filteredBookings.length > displayLimit;
  const remainingCount = filteredBookings.length - displayLimit;

  const handleStartConfirm = () => {
    if (!startTripModal) return;
    hapticFeedback.success();
    startTrip(startTripModal.id, startKmInput ? Number(startKmInput) : null);
    setStartTripModal(null);
  };

  return (
    <div className="space-y-4 pt-1 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#111827]">
            {dateFilter === 'Today' ? t('tileTodayTrips') : `${dateFilter} Trips`}
          </h2>
          <p className="text-xs text-[#4B5563] font-semibold">
            {filteredBookings.length} bookings found ({bookings.length} total recorded)
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNewBooking}
          className="px-3.5 py-1.5 rounded-full bg-[#111827] text-white text-xs font-black flex items-center gap-1 shadow-sm tap-active cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D4F05B] pointer-events-none" />
          <span>New</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by customer, car, route, or trip ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border-2 border-[#E5DFD3] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827] shadow-xs"
        />
      </div>

      {/* Date Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
        {dateFilters.map(df => {
          const isActive = dateFilter === df;
          return (
            <button
              key={df}
              onClick={() => setDateFilter(df)}
              className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all tap-active ${
                isActive
                  ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-xs'
                  : 'bg-white border border-[#E5DFD3] text-[#4B5563] hover:bg-gray-50'
              }`}
            >
              {df}
            </button>
          );
        })}
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
        {statuses.map(st => {
          const isActive = statusFilter === st;
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all tap-active ${
                isActive
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'bg-white border-2 border-[#E5DFD3] text-[#374151] hover:bg-gray-50'
              }`}
            >
              {st}
            </button>
          );
        })}
      </div>

      {/* Bookings Card List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-[#E5DFD3] shadow-xs space-y-2">
            <Navigation className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-[#111827]">No bookings found</p>
            <p className="text-[11px] text-[#4B5563]">Tap "+ New" to create your next trip booking</p>
          </div>
        ) : (
          visibleBookings.map(b => {
            const isOngoing = b.status === 'Ongoing';
            const isConfirmed = b.status === 'Confirmed' || b.status === 'Driver Assigned';

            return (
              <div
                key={b.id}
                onClick={() => setSelectedTripDetailBooking(b)}
                className={`bg-white rounded-3xl p-4 border-2 transition-all shadow-xs space-y-3 cursor-pointer hover:border-[#111827] tap-active group ${
                  isOngoing ? 'border-emerald-400 ring-2 ring-emerald-100 hover:border-emerald-600' : 'border-[#E5DFD3]'
                }`}
              >
                {/* Trip Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-[#111827]">{b.id}</span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        isOngoing
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse'
                          : isConfirmed
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : b.status === 'Completed'
                          ? 'bg-gray-100 text-gray-800 border-gray-300'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black text-[#111827] bg-[#F8F6F0] px-2.5 py-0.5 rounded-full border border-[#E5DFD3]">
                      {b.tripType}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#111827] transition-colors" />
                  </div>
                </div>

                {/* Customer & Route */}
                <div>
                  <h4 className="text-sm font-black text-[#111827] flex items-center justify-between">
                    <span>{b.customerName}</span>
                    <span className="text-xs font-black text-[#EA580C]">
                      {formatCurrency(b.totalFare)}
                    </span>
                  </h4>
                  <p className="text-xs text-[#374151] font-bold mt-0.5 flex items-center gap-1 truncate">
                    <span>📍 {b.pickupLocation}</span>
                    <span>➔</span>
                    <span>{b.dropLocation}</span>
                  </p>
                  <p className="text-[11px] text-[#4B5563] mt-0.5">
                    🕒 {new Date(b.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Vehicle & Driver Details */}
                <div className="bg-[#F8F6F0] rounded-2xl p-2.5 border border-[#E5DFD3] flex items-center justify-between text-xs group-hover:bg-[#f3efe6] transition-colors">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#111827]">🚗 {b.vehiclePlate || 'Car Unassigned'}</p>
                    <p className="text-[11px] text-[#4B5563] font-semibold">
                      👤 {b.driverName || 'Driver Pending'} ({b.driverPhone || 'No phone'})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#4B5563] font-semibold">
                      Adv: {formatCurrency(b.advancePaid)}
                    </p>
                    <p className="text-xs font-black text-rose-700">
                      Bal: {formatCurrency(b.balancePending)}
                    </p>
                  </div>
                </div>

                {/* Trip Actions Bar */}
                <div className="flex items-center space-x-1.5 pt-1">
                  {/* WhatsApp Customer Confirmation */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWhatsAppData({ type: 'booking', booking: b });
                    }}
                    className="flex-1 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center justify-center gap-1 shadow-xs tap-active"
                    title="Send Booking Confirmation to Customer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Customer</span>
                  </button>

                  {/* WhatsApp Driver Duty Card */}
                  {b.driverPhone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWhatsAppData({ type: 'duty', booking: b });
                      }}
                      className="py-1.5 px-2.5 rounded-full bg-[#111827] hover:bg-black text-white text-[11px] font-black flex items-center justify-center gap-1 shadow-xs tap-active"
                      title="Send Duty Card to Driver"
                    >
                      <User className="w-3 h-3 text-[#D4F05B]" />
                      <span>Duty</span>
                    </button>
                  )}

                  {/* Lifecycle Action (Start Trip / End & Settle Trip) */}
                  {isConfirmed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const veh = vehicles.find(v => v.id === b.vehicleId);
                        setStartKmInput(veh?.odometer || 64000);
                        setStartTripModal(b);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#D4F05B] text-[#111827] text-[11px] font-black flex items-center gap-1 shadow-xs tap-active border border-[#BFDD38]"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start</span>
                    </button>
                  ) : isOngoing ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettlementBooking(b);
                      }}
                      className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1 shadow-xs tap-active hover:bg-emerald-700"
                    >
                      <Gauge className="w-3 h-3" />
                      <span>Settle Meter</span>
                    </button>
                  ) : null}

                  {/* Tax Invoice Modal */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInvoiceBooking(b);
                    }}
                    className="p-1.5 px-2.5 rounded-full bg-white border-2 border-[#E5DFD3] text-[#111827] text-[11px] font-black flex items-center gap-1 hover:bg-gray-50 tap-active shadow-xs"
                    title="Generate GST Invoice"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Bill</span>
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Pagination: Load More Trips for 2GB RAM budget phones */}
        {hasMore && (
          <div className="pt-2 pb-3">
            <button
              onClick={() => {
                hapticFeedback.light();
                setDisplayLimit(prev => prev + 15);
              }}
              className="w-full py-3 rounded-2xl bg-white border-2 border-[#E5DFD3] text-[#111827] text-xs font-black shadow-xs hover:bg-[#F8F6F0] tap-active transition flex items-center justify-center gap-1.5"
            >
              <span>Load More Trips ({remainingCount} remaining)</span>
            </button>
          </div>
        )}
      </div>

      {/* Start Trip Dialog */}
      {startTripModal && createPortal(
        <div className="absolute inset-0 z-50 modal-center-backdrop p-4">
          <div className="modal-card-center bg-[#F8F6F0] rounded-4xl max-w-[360px] w-full p-5 shadow-2xl border-2 border-[#E5DFD3] space-y-4">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-950 flex items-center justify-center font-bold">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <h3 className="text-sm font-black text-[#111827]">
                  Start Trip: {startTripModal.id}
                </h3>
              </div>
              <button
                onClick={() => setStartTripModal(null)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[#111827] hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#4B5563] font-semibold">
              Vehicle: <b>{startTripModal.vehiclePlate}</b> • Driver: <b>{startTripModal.driverName}</b>
            </p>

            <div>
              <label className="text-[11px] font-bold text-[#111827] block mb-1">
                Starting Odometer (KM)
              </label>
              <input
                type="number"
                value={startKmInput}
                onChange={e => setStartKmInput(e.target.value)}
                placeholder="e.g. 64200"
                className="w-full bg-white border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-mono font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2 shrink-0">
              <button
                onClick={() => setStartTripModal(null)}
                className="flex-1 py-2.5 rounded-full border-2 border-[#E5DFD3] text-xs font-black text-[#4B5563] hover:bg-gray-50 tap-active cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartConfirm}
                className="flex-1 py-2.5 rounded-full bg-[#111827] text-white text-xs font-black shadow-md hover:bg-black tap-active cursor-pointer"
              >
                Confirm & On-Road
              </button>
            </div>
          </div>
        </div>,
        getModalPortalRoot()
      )}
    </div>
  );
};
