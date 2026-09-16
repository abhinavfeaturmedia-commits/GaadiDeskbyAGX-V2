import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { uploadMediaToCloud, capturePhotoWithNative } from '../../services/storageService';
import { calculateSettlementFare } from '../../lib/fareEngine';
import { openDrivingNavigation } from '../../services/sharingService';
import {
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  Gauge,
  Camera,
  IndianRupee,
  Receipt,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  Clock,
  Car,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Check
} from 'lucide-react';

export const DriverActiveDuty = ({ booking }) => {
  const {
    t,
    vehicles,
    formatCurrency,
    startDriverTrip,
    completeDriverTrip,
    setDriverTollModalBooking,
    setDriverUpiModalData,
    expenses
  } = useApp();

  const vehicle = vehicles.find(v => v.id === booking.vehicleId);
  const isOngoing = booking.status === 'Ongoing';

  // Start Trip Form State
  const [showStartForm, setShowStartForm] = useState(false);
  const [startKmInput, setStartKmInput] = useState(booking.startKm || vehicle?.odometer || 64000);
  const [startPhotoUrl, setStartPhotoUrl] = useState(booking.startPhotoUrl || '');
  const [isUploadingStartPhoto, setIsUploadingStartPhoto] = useState(false);
  const startFileRef = useRef(null);

  // End Trip Form State
  const [showEndForm, setShowEndForm] = useState(false);
  const currentStartKm = Number(booking.startKm || booking.startOdometer || vehicle?.odometer || 64000);
  const defaultEndKm = currentStartKm + Number(booking.estimatedKm || 250);
  const [endKmInput, setEndKmInput] = useState(booking.endKm || defaultEndKm);
  const [endPhotoUrl, setEndPhotoUrl] = useState(booking.endPhotoUrl || '');
  const [isUploadingEndPhoto, setIsUploadingEndPhoto] = useState(false);
  const endFileRef = useRef(null);
  const [collectionMode, setCollectionMode] = useState('Cash'); // 'Cash' | 'UPI'
  const [settlementNotes, setSettlementNotes] = useState('');

  // Trip live calculations via Central Fare Engine
  const settlementCalc = calculateSettlementFare(booking, {
    startKm: currentStartKm,
    endKm: endKmInput,
    tollParking: Number(booking.tollParking || 0)
  });
  const actualKm = settlementCalc.actualKm;
  const extraKm = settlementCalc.extraKm;
  const ratePerKm = Number(booking.ratePerKm || 14);
  const extraKmCharges = settlementCalc.extraKmCharges;

  // Toll & Expenses logged on this specific trip
  const tripExpenses = expenses.filter(e => e.bookingId === booking.id);
  const totalTripToll = settlementCalc.tollParking;

  // Gross total & Net balance
  const baseFare = settlementCalc.packageBaseFare;
  const driverBata = settlementCalc.driverBata;
  const taxableAmount = settlementCalc.taxableAmount;
  const gstAmount = settlementCalc.gstAmount;
  const grossTotal = settlementCalc.grossTotal;
  const advancePaid = settlementCalc.advancePaid;
  const netDue = settlementCalc.netDue;

  // Handle Photo Uploads to Supabase Cloud Storage
  const handleStartPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingStartPhoto(true);
    const res = await uploadMediaToCloud(file, 'trip-meter-snaps', 'start_odometer');
    if (res.url) {
      setStartPhotoUrl(res.url);
    }
    setIsUploadingStartPhoto(false);
  };

  const handleEndPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEndPhoto(true);
    const res = await uploadMediaToCloud(file, 'trip-meter-snaps', 'end_odometer');
    if (res.url) {
      setEndPhotoUrl(res.url);
    }
    setIsUploadingEndPhoto(false);
  };

  // Native-First Snap Handlers (Prevents budget phone LMK kills & form reloads)
  const handleSnapStartPhoto = async () => {
    setIsUploadingStartPhoto(true);
    try {
      const nativeBlob = await capturePhotoWithNative();
      if (nativeBlob) {
        const res = await uploadMediaToCloud(nativeBlob, 'trip-meter-snaps', 'start_odometer');
        if (res.url) {
          setStartPhotoUrl(res.url);
        }
        setIsUploadingStartPhoto(false);
        return;
      }
    } catch (err) {
      console.warn('Native camera capture fallback:', err);
    }
    setIsUploadingStartPhoto(false);
    startFileRef.current?.click();
  };

  const handleSnapEndPhoto = async () => {
    setIsUploadingEndPhoto(true);
    try {
      const nativeBlob = await capturePhotoWithNative();
      if (nativeBlob) {
        const res = await uploadMediaToCloud(nativeBlob, 'trip-meter-snaps', 'end_odometer');
        if (res.url) {
          setEndPhotoUrl(res.url);
        }
        setIsUploadingEndPhoto(false);
        return;
      }
    } catch (err) {
      console.warn('Native camera capture fallback:', err);
    }
    setIsUploadingEndPhoto(false);
    endFileRef.current?.click();
  };

  // Handle Start Trip
  const handleStartSubmit = (e) => {
    e.preventDefault();
    if (!startKmInput || Number(startKmInput) <= 0) {
      alert("Please enter a valid starting odometer reading.");
      return;
    }
    startDriverTrip(booking.id, startKmInput, startPhotoUrl);
    setShowStartForm(false);
  };

  // Handle Complete Trip
  const handleCompleteSubmit = (payMode = 'Cash') => {
    if (Number(endKmInput) < currentStartKm) {
      alert("Ending Odometer reading cannot be less than Starting reading.");
      return;
    }

    completeDriverTrip(booking.id, {
      endKm: Number(endKmInput),
      endPhotoUrl: endPhotoUrl,
      tollParking: totalTripToll,
      driverBata,
      discount: 0,
      paymentMode: payMode,
      finalPaidAmount: netDue,
      notes: settlementNotes || `Meter: ${currentStartKm} KM to ${endKmInput} KM (${actualKm} KM total)`
    });

    setShowEndForm(false);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Active Duty Top Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#E5DFD3] shadow-soft space-y-4">
        {/* Status Pill & Trip Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
              isOngoing
                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              {isOngoing ? '🛣️ Trip in Progress' : '📋 Duty Assigned'}
            </span>
            <span className="text-xs font-black text-[#4B5563]">{booking.id}</span>
          </div>

          <span className="text-xs font-extrabold bg-gray-100 text-[#111827] px-2.5 py-1 rounded-full border border-gray-200">
            {booking.tripType}
          </span>
        </div>

        {/* Assigned Car Pill */}
        <div className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E5DFD3] flex items-center justify-center text-sm shadow-2xs">
              🚗
            </div>
            <div>
              <h4 className="text-xs font-black text-[#111827]">{booking.vehiclePlate}</h4>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                {isOngoing ? `Start Meter: ${currentStartKm} KM` : `Current Odometer: ${vehicle?.odometer || currentStartKm} KM`}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>

        {/* Customer Details & 1-Tap Connect Actions */}
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                Passenger / Customer
              </span>
              <h3 className="text-sm font-black text-emerald-950">{booking.customerName}</h3>
              <p className="text-xs text-emerald-800 font-bold">{booking.customerPhone}</p>
            </div>

            {/* Quick 1-Tap Actions: Call & WhatsApp */}
            <div className="flex items-center space-x-2">
              <a
                href={`tel:${booking.customerPhone}`}
                className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs hover:bg-emerald-700 tap-active"
                title="Call Passenger"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${booking.customerPhone?.replace(/\D/g, '')}?text=Namaste%20${encodeURIComponent(booking.customerName)},%20I%20am%20your%20GaadiDesk%20driver%20for%20your%20upcoming%20trip.`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs hover:bg-green-600 tap-active"
                title="WhatsApp Passenger"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {booking.notes && (
            <div className="text-[11px] font-semibold text-emerald-900 bg-white/80 p-2 rounded-xl border border-emerald-200">
              💬 <b>Customer Note:</b> {booking.notes}
            </div>
          )}
        </div>

        {/* Route Details with 1-Tap Google Maps Navigation */}
        <div className="space-y-2.5">
          <div className="flex items-start space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
              A
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black text-[#4B5563] uppercase">Pickup Location</span>
              <p className="text-xs font-black text-[#111827]">{booking.pickupLocation}</p>
              <span className="text-[10px] text-[#4B5563] font-semibold block mt-0.5">
                📅 {new Date(booking.startDateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => openDrivingNavigation(booking.pickupLocation)}
              className="px-2.5 py-1.5 rounded-full bg-[#111827] text-white text-[11px] font-black flex items-center gap-1 hover:bg-black tap-active shrink-0 shadow-xs cursor-pointer"
              title="Start Live Driving Navigation"
            >
              <Navigation className="w-3 h-3 text-[#D4F05B]" />
              <span>Map</span>
            </button>
          </div>

          <div className="border-l-2 border-dashed border-gray-300 ml-3 h-4" />

          <div className="flex items-start space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-red-100 text-red-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
              B
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black text-[#4B5563] uppercase">Drop Destination</span>
              <p className="text-xs font-black text-[#111827]">{booking.dropLocation}</p>
            </div>
            <button
              type="button"
              onClick={() => openDrivingNavigation(booking.dropLocation)}
              className="px-2.5 py-1.5 rounded-full bg-[#111827] text-white text-[11px] font-black flex items-center gap-1 hover:bg-black tap-active shrink-0 shadow-xs cursor-pointer"
              title="Start Live Driving Navigation"
            >
              <Navigation className="w-3 h-3 text-[#D4F05B]" />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Fare & Bata Summary Pill */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5DFD3]">
          <div className="p-2.5 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3]">
            <span className="text-[10px] font-black text-[#4B5563] uppercase block">Total Fare</span>
            <span className="text-sm font-black text-[#111827]">{formatCurrency(grossTotal)}</span>
            <span className="text-[10px] text-emerald-700 font-bold block">Advance: {formatCurrency(advancePaid)}</span>
          </div>

          <div className="p-2.5 bg-amber-50/80 rounded-2xl border border-amber-200">
            <span className="text-[10px] font-black text-amber-900 uppercase block">Your Driver Bata</span>
            <span className="text-sm font-black text-amber-950">{formatCurrency(driverBata)}</span>
            <span className="text-[10px] text-amber-800 font-bold block">Included Allowance</span>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* STAGE 1: NOT ONGOING YET -> START TRIP CONTROLS */}
      {/* ===================================================== */}
      {!isOngoing ? (
        <div className="bg-white rounded-3xl p-5 border-2 border-[#E5DFD3] shadow-soft space-y-3">
          <div className="flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-[#111827]">
              {t('driverStartTrip')}
            </h3>
          </div>
          <p className="text-xs text-[#4B5563] font-semibold">
            Lock starting odometer reading and snap odometer photo before picking up passenger.
          </p>

          {!showStartForm ? (
            <button
              onClick={() => setShowStartForm(true)}
              className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition tap-active flex items-center justify-center space-x-2"
            >
              <Gauge className="w-4 h-4" />
              <span>{t('driverStartTrip')}</span>
            </button>
          ) : (
            <form onSubmit={handleStartSubmit} className="space-y-3 pt-2 animate-fade-in">
              <div>
                <label className="text-xs font-black text-[#111827] block mb-1">
                  {t('driverStartKm')}
                </label>
                <div className="flex items-center rounded-2xl border-2 border-emerald-500 bg-white p-1 shadow-xs">
                  <input
                    type="number"
                    value={startKmInput}
                    onChange={e => setStartKmInput(e.target.value)}
                    className="w-full px-3 py-2 text-base font-black text-[#111827] focus:outline-none"
                    placeholder="e.g. 64200"
                    required
                  />
                  <span className="px-3 text-xs font-black text-[#4B5563]">KM</span>
                </div>
              </div>

              {/* Real Camera & Photo Capture for Start Odometer */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={startFileRef}
                onChange={handleStartPhotoChange}
                className="hidden"
              />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSnapStartPhoto}
                  disabled={isUploadingStartPhoto}
                  className={`w-full py-2.5 rounded-2xl border-2 border-dashed flex items-center justify-center space-x-2 text-xs font-black transition tap-active ${
                    startPhotoUrl
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-[#E5DFD3] bg-[#F8F6F0] text-[#111827]'
                  }`}
                >
                  {isUploadingStartPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Compressing & Uploading...</span>
                    </>
                  ) : startPhotoUrl ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>✓ Start Meter Photo Attached (Tap to retake)</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>📸 Snap Starting Meter Photo</span>
                    </>
                  )}
                </button>

                {startPhotoUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 h-24 w-full bg-black/5">
                    <img
                      src={startPhotoUrl}
                      alt="Starting Odometer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      Start Meter Photo
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowStartForm(false)}
                  className="flex-1 py-3 rounded-full bg-gray-100 text-[#4B5563] font-black text-xs tap-active"
                >
                  {t('btnCancel')}
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md tap-active flex items-center justify-center space-x-1"
                >
                  <span>Confirm & Start</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* ===================================================== */
        /* STAGE 2: ONGOING TRIP -> ON-ROAD TOLL & END SETTLEMENT */
        /* ===================================================== */
        <div className="space-y-4">
          {/* On-Road Expenses Card */}
          <div className="bg-white rounded-3xl p-5 border-2 border-[#E5DFD3] shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-[#EA580C]" />
                <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                  Highway Tolls & Expenses
                </h4>
              </div>
              <button
                onClick={() => setDriverTollModalBooking(booking)}
                className="px-3 py-1 rounded-full bg-[#111827] text-white text-xs font-black hover:bg-black tap-active shadow-xs flex items-center gap-1"
              >
                <span>+ Add Toll</span>
              </button>
            </div>

            {totalTripToll > 0 ? (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-amber-900 uppercase block">Total Toll Logged</span>
                  <span className="text-sm font-black text-amber-950">{formatCurrency(totalTripToll)}</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full">
                  Auto-Added to Bill
                </span>
              </div>
            ) : (
              <p className="text-xs text-[#4B5563] font-semibold bg-[#F8F6F0] p-2.5 rounded-2xl border border-[#E5DFD3]">
                No tolls logged yet. Tap <b>+ Add Toll</b> when crossing highway toll plazas.
              </p>
            )}
          </div>

          {/* End Trip & Settle Cockpit */}
          <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500 shadow-glow-lime space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-[#111827]">
                {t('driverEndTrip')}
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-[#111827] block mb-1">
                  {t('driverEndKm')} (Start was {currentStartKm} KM)
                </label>
                <div className="flex items-center rounded-2xl border-2 border-[#E5DFD3] bg-white p-1 shadow-xs focus-within:border-[#111827]">
                  <input
                    type="number"
                    value={endKmInput}
                    onChange={e => setEndKmInput(e.target.value)}
                    className="w-full px-3 py-2 text-base font-black text-[#111827] focus:outline-none"
                    placeholder={`e.g. ${defaultEndKm}`}
                    required
                  />
                  <span className="px-3 text-xs font-black text-[#4B5563]">KM</span>
                </div>
              </div>

              {/* Real Camera & Photo Capture for End Odometer */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={endFileRef}
                onChange={handleEndPhotoChange}
                className="hidden"
              />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSnapEndPhoto}
                  disabled={isUploadingEndPhoto}
                  className={`w-full py-2.5 rounded-2xl border-2 border-dashed flex items-center justify-center space-x-2 text-xs font-black transition tap-active ${
                    endPhotoUrl
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-[#E5DFD3] bg-[#F8F6F0] text-[#111827]'
                  }`}
                >
                  {isUploadingEndPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Compressing & Uploading...</span>
                    </>
                  ) : endPhotoUrl ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>✓ End Meter Photo Attached (Tap to retake)</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>📸 Snap Ending Meter Photo</span>
                    </>
                  )}
                </button>

                {endPhotoUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 h-24 w-full bg-black/5">
                    <img
                      src={endPhotoUrl}
                      alt="Ending Odometer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      End Meter Photo
                    </span>
                  </div>
                )}
              </div>

              {/* Meter Calculations Card */}
              <div className="p-3.5 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] space-y-2 text-xs">
                <div className="flex justify-between font-bold text-[#4B5563]">
                  <span>Total Distance Run:</span>
                  <span className="font-black text-[#111827]">{actualKm} KM</span>
                </div>
                {extraKm > 0 && (
                  <div className="flex justify-between font-bold text-amber-900">
                    <span>Extra KM Charges ({extraKm} KM × ₹{ratePerKm}):</span>
                    <span className="font-black">{formatCurrency(extraKmCharges)}</span>
                  </div>
                )}
                <div className="border-t border-[#E5DFD3] pt-2 flex justify-between items-baseline font-black">
                  <span className="text-sm text-[#111827]">Balance to Collect:</span>
                  <span className="text-base text-emerald-700">{formatCurrency(netDue)}</span>
                </div>
              </div>

              {/* Payment Collection Actions */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDriverUpiModalData({
                    booking,
                    amount: netDue,
                    endKm: Number(endKmInput || (currentStartKm + Number(booking.estimatedKm || 250))),
                    tollParking: booking.tollParking || 0,
                    driverBata: booking.driverBata || 0
                  })}
                  className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md tap-active flex items-center justify-center space-x-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t('driverShowUpiQr')} (₹{netDue})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteSubmit('Cash')}
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md tap-active flex items-center justify-center space-x-2"
                >
                  <IndianRupee className="w-4 h-4" />
                  <span>{t('driverCashCollected')} & End Trip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
