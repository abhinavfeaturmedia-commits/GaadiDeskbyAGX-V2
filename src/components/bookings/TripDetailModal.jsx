import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import {
  X,
  Navigation,
  MapPin,
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  MessageSquare,
  Receipt,
  Gauge,
  Play,
  IndianRupee,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Info,
  Edit3,
  Trash2
} from 'lucide-react';

export const TripDetailModal = ({ booking, onClose }) => {
  const {
    vehicles,
    drivers,
    formatCurrency,
    setSelectedInvoiceBooking,
    setSelectedVehicleDetail,
    setSettlementBooking,
    setWhatsAppData,
    startTrip,
    updateBookingStatus,
    openEditBooking,
    deleteBooking
  } = useApp();

  const [copiedId, setCopiedId] = useState(false);
  const [startKmInput, setStartKmInput] = useState('');
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  if (!booking) return null;

  const vehicle = vehicles.find(v => v.id === booking.vehicleId);
  const driver = drivers.find(d => d.id === booking.driverId);

  const isOngoing = booking.status === 'Ongoing';
  const isConfirmed = booking.status === 'Confirmed' || booking.status === 'Driver Assigned';
  const isCompleted = booking.status === 'Completed';
  const isCancelled = booking.status === 'Cancelled';

  const packageKm = Number(booking.estimatedKm || booking.billableKm || (Number(booking.daysCount || 1) * (booking.minKmPerDay || 250)));
  const ratePerKm = Number(booking.ratePerKm || 14);
  const effectiveBaseFare = booking.tripType === 'Outstation'
    ? (Number(booking.baseFare) && Number(booking.baseFare) >= (packageKm * ratePerKm * 0.8) ? Number(booking.baseFare) : (packageKm * ratePerKm))
    : Number(booking.baseFare || 0);

  // Format Dates
  const startDateFormatted = booking.startDateTime
    ? new Date(booking.startDateTime).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Not Scheduled';

  const startTimeFormatted = booking.startDateTime
    ? new Date(booking.startDateTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  const endDateFormatted = booking.endDateTime
    ? new Date(booking.endDateTime).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : '';

  const endTimeFormatted = booking.endDateTime
    ? new Date(booking.endDateTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  // Copy ID
  const handleCopyId = () => {
    navigator.clipboard?.writeText(booking.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Google Maps Navigation URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    booking.pickupLocation || ''
  )}&destination=${encodeURIComponent(booking.dropLocation || '')}`;

  // Start Trip Action
  const handleStartTrip = () => {
    const odo = startKmInput ? Number(startKmInput) : vehicle?.odometer || 64000;
    startTrip(booking.id, odo);
    setShowStartPrompt(false);
    onClose();
  };

  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');

  // Cancel Trip Action
  const handleCancelTrip = () => {
    updateBookingStatus(booking.id, 'Cancelled', { cancelReason });
    setShowCancelPrompt(false);
    onClose();
  };

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[9999] modal-center-backdrop p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-card-center bg-[#F8F6F0] w-full max-w-[440px] rounded-3xl sm:rounded-4xl max-h-[88vh] flex flex-col shadow-2xl border-2 border-[#E5DFD3] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-white px-5 py-3.5 border-b border-[#E5DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
                isOngoing
                  ? 'bg-emerald-100 text-emerald-900'
                  : isConfirmed
                  ? 'bg-blue-100 text-blue-900'
                  : isCompleted
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-[#111827] flex items-center gap-1.5">
                  <span>{booking.id}</span>
                  <button
                    onClick={handleCopyId}
                    title="Copy Trip ID"
                    className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </h3>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    isOngoing
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse'
                      : isConfirmed
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : isCompleted
                      ? 'bg-gray-100 text-gray-800 border-gray-300'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {isOngoing ? '● Active On-Road' : booking.status}
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] font-semibold">
                {booking.invoiceNumber || 'Invoice GD/2026/0101'} • {booking.tripType}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#111827] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto space-y-4 text-xs smooth-scroll-container">
          {/* 1. Route Banner & Google Maps Link */}
          <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4B5563]">
                Trip Route & Itinerary
              </span>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1 transition-colors"
              >
                <span>Navigate Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Visual Route Points */}
            <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-blue-500 before:to-rose-500">
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <p className="text-[10px] font-bold text-[#4B5563]">PICKUP LOCATION</p>
                <p className="text-xs font-black text-[#111827]">{booking.pickupLocation}</p>
                <p className="text-[11px] text-[#4B5563] mt-0.5 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>{startDateFormatted} at {startTimeFormatted}</span>
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                <p className="text-[10px] font-bold text-[#4B5563]">DROP LOCATION / DESTINATION</p>
                <p className="text-xs font-black text-[#111827]">{booking.dropLocation}</p>
                {booking.endDateTime && (
                  <p className="text-[11px] text-[#4B5563] mt-0.5 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-rose-600" />
                    <span>Expected: {endDateFormatted} at {endTimeFormatted}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Route Stats Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#F0EBE0]">
              <div className="bg-[#F8F6F0] rounded-2xl p-2 text-center border border-[#E5DFD3]">
                <p className="text-[9px] text-[#4B5563] font-bold uppercase">Estimated KM</p>
                <p className="text-xs font-black text-[#111827]">
                  {booking.estimatedKm || booking.minKmPerDay || 250} KM
                </p>
              </div>
              <div className="bg-[#F8F6F0] rounded-2xl p-2 text-center border border-[#E5DFD3]">
                <p className="text-[9px] text-[#4B5563] font-bold uppercase">Rate / KM</p>
                <p className="text-xs font-black text-[#111827]">
                  ₹{booking.ratePerKm || 14}/km
                </p>
              </div>
              <div className="bg-[#F8F6F0] rounded-2xl p-2 text-center border border-[#E5DFD3]">
                <p className="text-[9px] text-[#4B5563] font-bold uppercase">Duration</p>
                <p className="text-xs font-black text-[#111827]">
                  {booking.daysCount ? `${booking.daysCount} Days` : '1 Day'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Customer & Passenger Details */}
          <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4B5563]">
                Customer Details
              </span>
              <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                Personal / Corporate
              </span>
            </div>

            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-[#111827]">
                  {booking.customerName}
                </h4>
                <p className="text-xs font-semibold text-[#4B5563]">
                  📞 {booking.customerPhone || 'No phone recorded'}
                </p>
              </div>

              {/* Quick Communication Actions */}
              <div className="flex items-center space-x-1.5">
                {booking.customerPhone && (
                  <a
                    href={`tel:${booking.customerPhone}`}
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors tap-active"
                    title="Call Customer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setWhatsAppData({ type: 'booking', booking })}
                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors tap-active flex items-center gap-1 font-bold text-[10px]"
                  title="Send Booking WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Special Trip Notes */}
            {booking.notes && (
              <div className="bg-[#FFFBEB] rounded-2xl p-2.5 border border-amber-200 flex items-start space-x-2 text-[11px]">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-amber-900">Driver Notes: </span>
                  <span className="text-amber-800 font-medium">{booking.notes}</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Vehicle & Driver Assigned */}
          <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4B5563]">
                Fleet & Driver Assigned
              </span>
              <span className="text-[10px] font-bold bg-[#F8F6F0] text-[#111827] px-2 py-0.5 rounded-full border border-[#E5DFD3]">
                {vehicle?.category || 'MUV / Sedan'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Vehicle Card */}
              <div
                onClick={() => {
                  if (vehicle) {
                    onClose();
                    setSelectedVehicleDetail(vehicle);
                  }
                }}
                className={`bg-[#F8F6F0] rounded-2xl p-3 border border-[#E5DFD3] space-y-1 ${vehicle ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/60 transition-all' : ''}`}
                title={vehicle ? 'Click to view vehicle details' : ''}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-950 flex items-center justify-center font-bold">
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#4B5563]">VEHICLE</p>
                      <p className="text-xs font-black text-[#111827]">
                        {booking.vehiclePlate || 'Not Assigned'}
                      </p>
                    </div>
                  </div>
                  {vehicle && <ArrowRight className="w-3 h-3 text-[#4B5563]" />}
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] text-[#4B5563] font-semibold border-t border-[#E5DFD3]/60">
                  <span>Start Odo:</span>
                  <span className="font-mono font-bold text-[#111827]">
                    {booking.startOdometer || booking.startKm || vehicle?.odometer || 64000} KM
                  </span>
                </div>
              </div>

              {/* Driver Card */}
              <div className="bg-[#F8F6F0] rounded-2xl p-3 border border-[#E5DFD3] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-950 flex items-center justify-center font-bold">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#4B5563]">CHAUFFEUR</p>
                      <p className="text-xs font-black text-[#111827]">
                        {booking.driverName || 'Pending Assignment'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 pt-0.5">
                  {booking.driverPhone && (
                    <a
                      href={`tel:${booking.driverPhone}`}
                      className="flex-1 py-1 rounded-xl bg-white border border-[#E5DFD3] text-[#111827] text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50 tap-active"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>Call</span>
                    </a>
                  )}
                  {booking.driverPhone && (
                    <button
                      onClick={() => setWhatsAppData({ type: 'duty', booking })}
                      className="flex-1 py-1 rounded-xl bg-[#111827] text-white text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-black tap-active"
                    >
                      <MessageSquare className="w-3 h-3 text-[#D4F05B]" />
                      <span>Duty Slip</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Complete Fare & Billing Breakdown */}
          <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4B5563]">
                Fare & Financial Breakdown
              </span>
              <button
                onClick={() => {
                  onClose();
                  setSelectedInvoiceBooking(booking);
                }}
                className="text-[11px] font-black text-[#EA580C] bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-full border border-orange-200 flex items-center gap-1 transition-colors"
              >
                <Receipt className="w-3 h-3" />
                <span>GST Tax Invoice</span>
              </button>
            </div>

            {/* Financial Line Items */}
            <div className="space-y-1.5 text-xs text-[#374151]">
              <div className="flex justify-between">
                <span>
                  {booking.tripType === 'Outstation'
                    ? `Base Package (${packageKm} KM @ ₹${ratePerKm}/km)`
                    : 'Base Package Fare'}
                </span>
                <span className="font-bold text-[#111827]">{formatCurrency(effectiveBaseFare)}</span>
              </div>

              {Number(booking.extraKmCharges || 0) > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Extra Distance ({booking.extraKm || 0} KM @ ₹{ratePerKm}/km)</span>
                  <span className="font-bold">+{formatCurrency(booking.extraKmCharges)}</span>
                </div>
              )}

              {Number(booking.extraHoursCharges || 0) > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Extra Hours ({booking.extraHours || 0} hrs)</span>
                  <span className="font-bold">+{formatCurrency(booking.extraHoursCharges)}</span>
                </div>
              )}

              {Number(booking.driverBata || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Driver Allowance (Bata)</span>
                  <span className="font-bold text-[#111827]">+{formatCurrency(booking.driverBata)}</span>
                </div>
              )}

              {Number(booking.nightHalt || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Night Halt Charge</span>
                  <span className="font-bold text-[#111827]">+{formatCurrency(booking.nightHalt)}</span>
                </div>
              )}

              {Number(booking.tollParking || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Toll & Parking (Reimbursable)</span>
                  <span className="font-bold text-[#111827]">+{formatCurrency(booking.tollParking)}</span>
                </div>
              )}

              {booking.gstEnabled && (
                <div className="flex justify-between text-[#4B5563]">
                  <span>GST ({booking.gstPercent || 5}%)</span>
                  <span className="font-semibold">+{formatCurrency(booking.gstAmount || 0)}</span>
                </div>
              )}

              {Number(booking.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount Applied</span>
                  <span className="font-bold">- {formatCurrency(booking.discount)}</span>
                </div>
              )}

              {/* Total Row */}
              <div className="pt-2 border-t-2 border-dashed border-[#E5DFD3] flex justify-between items-center text-sm font-black text-[#111827]">
                <span>Total {isCompleted ? 'Final Bill' : 'Estimated Fare'}</span>
                <span className="text-[#EA580C] text-base">{formatCurrency(booking.totalFare)}</span>
              </div>

              {/* Advance & Pending Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-200">
                  <p className="text-[10px] text-emerald-800 font-bold">Advance Collected</p>
                  <p className="text-xs font-black text-emerald-950">
                    {formatCurrency(booking.advancePaid || 0)}
                  </p>
                  <p className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                    via {booking.advanceMode || 'Cash/UPI'}
                  </p>
                </div>

                <div className="bg-rose-50 rounded-2xl p-2.5 border border-rose-200">
                  <p className="text-[10px] text-rose-800 font-bold">Balance Due</p>
                  <p className="text-xs font-black text-rose-700">
                    {formatCurrency(booking.balancePending || 0)}
                  </p>
                  <p className="text-[9px] text-rose-600 font-semibold mt-0.5">
                    to collect at settlement
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Trip Lifecycle Confirmation / Cancellation Prompts */}
          {showStartPrompt && (
            <div className="bg-emerald-50 rounded-3xl p-4 border-2 border-emerald-300 space-y-3 animate-fade-in">
              <div className="flex items-center space-x-2 text-emerald-950 font-black text-xs">
                <Play className="w-4 h-4 fill-current text-emerald-600" />
                <span>Confirm Starting Trip Odometer</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Enter current vehicle odometer KM to mark this trip as Active On-Road:
              </p>
              <input
                type="number"
                placeholder={`Current Odo: ${vehicle?.odometer || 64000}`}
                value={startKmInput}
                onChange={e => setStartKmInput(e.target.value)}
                className="w-full bg-white border-2 border-emerald-300 rounded-2xl px-3 py-2 text-xs font-mono font-bold text-[#111827] focus:outline-none focus:border-emerald-600"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowStartPrompt(false)}
                  className="flex-1 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartTrip}
                  className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-xs"
                >
                  Start On-Road
                </button>
              </div>
            </div>
          )}

          {showCancelPrompt && (
            <div className="bg-rose-50 rounded-3xl p-4 border-2 border-rose-300 space-y-3 animate-fade-in">
              <div className="flex items-center space-x-2 text-rose-950 font-black text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Cancel Booking {booking.id}</span>
              </div>
              <div>
                <label className="text-[11px] font-bold text-rose-900 block mb-1">
                  Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full bg-white border border-rose-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-950 focus:outline-none"
                >
                  <option value="Customer requested cancellation">Customer requested cancellation</option>
                  <option value="Customer changed travel plan">Customer changed travel plan</option>
                  <option value="Vehicle technical breakdown">Vehicle technical breakdown</option>
                  <option value="Driver unavailable">Driver unavailable</option>
                  <option value="Duplicate booking / Mistake">Duplicate booking / Mistake</option>
                </select>
              </div>
              <p className="text-[10px] text-rose-800 bg-white/80 p-2 rounded-xl border border-rose-200 font-semibold">
                ✓ Releasing car {booking.vehiclePlate} and driver {booking.driverName}.<br />
                ✓ Any {formatCurrency(booking.balancePending)} pending customer dues will be immediately reversed in CRM.
              </p>
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => setShowCancelPrompt(false)}
                  className="flex-1 py-2 rounded-xl bg-white border border-rose-200 text-xs font-bold text-gray-700"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelTrip}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-white p-4 border-t border-[#E5DFD3] space-y-2 shrink-0">
          {/* Primary Action Button */}
          {isOngoing ? (
            <button
              onClick={() => {
                onClose();
                setSettlementBooking(booking);
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md tap-active"
            >
              <Gauge className="w-4 h-4" />
              <span>Settle Meter & Close Trip ({formatCurrency(booking.balancePending)} Due)</span>
            </button>
          ) : isConfirmed ? (
            <button
              onClick={() => setShowStartPrompt(true)}
              className="w-full py-3 rounded-2xl bg-[#D4F05B] hover:bg-[#c5e44a] text-[#111827] text-xs font-black flex items-center justify-center gap-2 shadow-md tap-active border border-[#BFDD38]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Trip & Dispatch Vehicle</span>
            </button>
          ) : isCompleted ? (
            <button
              onClick={() => {
                onClose();
                setSelectedInvoiceBooking(booking);
              }}
              className="w-full py-3 rounded-2xl bg-[#111827] hover:bg-black text-white text-xs font-black flex items-center justify-center gap-2 shadow-md tap-active"
            >
              <Receipt className="w-4 h-4 text-[#D4F05B]" />
              <span>View & Share Final GST Tax Invoice</span>
            </button>
          ) : null}

          {/* Quick Options Grid */}
          <div className={`grid ${!isCompleted ? 'grid-cols-4' : 'grid-cols-3'} gap-2 pt-1`}>
            {!isCompleted && (
              <button
                onClick={() => {
                  onClose();
                  openEditBooking(booking);
                }}
                className="py-2 px-1 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-[11px] font-black flex items-center justify-center gap-1 hover:bg-amber-100 tap-active"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                setSelectedInvoiceBooking(booking);
              }}
              className="py-2 px-1 rounded-xl bg-white border-2 border-[#E5DFD3] text-[#111827] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50 tap-active"
            >
              <Receipt className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>GST Bill</span>
            </button>

            <button
              onClick={() => {
                onClose();
                setWhatsAppData({ type: 'duty', booking });
              }}
              className="py-2 px-1 rounded-xl bg-white border-2 border-[#E5DFD3] text-[#111827] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50 tap-active"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Duty</span>
            </button>

            <button
              onClick={() => {
                onClose();
                setWhatsAppData({ type: 'booking', booking });
              }}
              className="py-2 px-1 rounded-xl bg-white border-2 border-[#E5DFD3] text-[#111827] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50 tap-active"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 px-1 text-[11px]">
            {!isCompleted && !isCancelled ? (
              <button
                onClick={() => setShowCancelPrompt(true)}
                className="font-bold text-rose-600 hover:text-rose-800 underline"
              >
                Cancel booking
              </button>
            ) : <div />}

            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to permanently delete Booking ${booking.id}? This cannot be undone.`)) {
                  deleteBooking(booking.id);
                  onClose();
                }
              }}
              className="font-bold text-gray-500 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3 text-gray-400 hover:text-rose-600" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
