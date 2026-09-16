import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { modalStack } from '../../services/modalStack';
import { hapticFeedback } from '../../lib/haptics';
import { sendWhatsAppMessage, copyToClipboard } from '../../services/sharingService';
import {
  X,
  Zap,
  Share2,
  Copy,
  Check,
  Calculator,
  Car,
  Calendar,
  Clock,
  Navigation,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const QuickQuoteModal = ({ onClose }) => {
  const { business, rateCards, formatCurrency, openNewBookingWithPrefill } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tripType, setTripType] = useState('Outstation'); // Outstation | Local | Airport | Rental | Package
  const [category, setCategory] = useState('Sedan'); // Sedan | MUV | SUV | EV | Hatchback
  const [pickupCity, setPickupCity] = useState(business.city || 'Pune');
  const [dropCity, setDropCity] = useState('');
  const [distanceKm, setDistanceKm] = useState(300);
  const [days, setDays] = useState(1);
  const [hours, setHours] = useState(8);
  const [tollParking, setTollParking] = useState(350);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  // Find active rate card
  const matchedRateCard = rateCards.find(rc => rc.tripType === tripType && rc.category === category)
    || rateCards.find(rc => rc.tripType === tripType)
    || rateCards[0] || {};

  // Dynamic Rate Calculation
  let baseFare = 0;
  let ratePerKm = matchedRateCard.perKmRate || matchedRateCard.extraKmRate || 14;
  let minKmPerDay = matchedRateCard.minKmPerDay || 250;
  let driverBata = 0;
  let nightHalt = 0;
  let calculatedKm = distanceKm;

  if (tripType === 'Outstation') {
    const minBillableKm = Math.max(distanceKm, days * minKmPerDay);
    calculatedKm = minBillableKm;
    baseFare = minBillableKm * ratePerKm;
    driverBata = days * (matchedRateCard.driverBata || 400);
    nightHalt = Math.max(0, days - 1) * (matchedRateCard.nightHalt || 300);
  } else if (tripType === 'Local' || tripType === 'Airport') {
    baseFare = matchedRateCard.basePrice || 1800;
    const extraKm = Math.max(0, distanceKm - (matchedRateCard.baseKm || 80));
    const extraHours = Math.max(0, hours - (matchedRateCard.baseHours || 8));
    baseFare += (extraKm * (matchedRateCard.extraKmRate || 14)) + (extraHours * (matchedRateCard.extraHourRate || 150));
    driverBata = 0;
    nightHalt = 0;
  } else if (tripType === 'Rental') {
    baseFare = days * (matchedRateCard.basePrice || 2200);
    driverBata = 0;
    nightHalt = 0;
  }

  const taxableAmount = baseFare + driverBata + nightHalt;
  const gstAmount = gstEnabled ? Math.round(taxableAmount * 0.05) : 0;
  const totalQuoteAmount = taxableAmount + gstAmount + Number(tollParking || 0);

  // Generate Quotation Message Text
  const generateQuoteText = () => {
    const routeText = dropCity ? `${pickupCity} ➔ ${dropCity}` : `${pickupCity} ${tripType} Tour`;
    let quote = `*QUOTATION - ${business.name.toUpperCase()}*\n`;
    if (customerName) quote += `*Hello ${customerName},*\n`;
    quote += `Thank you for contacting us. Here is your trip fare estimate:\n\n`;
    quote += `🚗 *Car Type:* ${category} (${tripType})\n`;
    quote += `📍 *Route:* ${routeText}\n`;
    if (tripType === 'Outstation') {
      quote += `⏱️ *Duration:* ${days} Day(s) (Min ${minKmPerDay} km/day)\n`;
      quote += `🛣️ *Est. Distance:* ~${calculatedKm} KM (@ ₹${ratePerKm}/km)\n`;
      quote += `👨‍✈️ *Driver Batta:* ₹${driverBata} (${days} days)\n`;
      if (nightHalt > 0) quote += `🌙 *Night Charges:* ₹${nightHalt}\n`;
    } else if (tripType === 'Local') {
      quote += `⏱️ *Package:* ${hours} Hours / ${distanceKm} KM\n`;
    }
    quote += `🛣️ *Toll & Parking:* ₹${tollParking} (Estimated / At actuals)\n`;
    if (gstEnabled) quote += `🏛️ *GST (5%):* ₹${gstAmount}\n`;
    quote += `\n💰 *ESTIMATED TOTAL FARE:* ${formatCurrency(totalQuoteAmount)}\n\n`;
    quote += `*Inclusions:* AC, Fuel, Professional Chauffeur, Sanitized Car.\n`;
    quote += `*Exclusions:* State entry taxes (if applicable), Parking at actuals.\n\n`;
    quote += `📞 *Call / WhatsApp:* ${business.phone}\n`;
    quote += `📍 ${business.address}`;
    return quote;
  };

  // Register with modalStack for Android Back Button
  useEffect(() => {
    modalStack.push('quick_quote_modal', onClose);
    return () => {
      modalStack.remove('quick_quote_modal');
    };
  }, [onClose]);

  const handleCopyQuote = async () => {
    const text = generateQuoteText();
    await copyToClipboard(text);
    setCopied(true);
    hapticFeedback.light();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = generateQuoteText();
    hapticFeedback.medium();
    sendWhatsAppMessage(customerPhone, text);
  };

  const handleConvertToBooking = () => {
    const now = new Date();
    const startDate = new Date(now.getTime() + 3600000);
    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}T${String(startDate.getHours()).padStart(2, '0')}:00`;
    const endDate = new Date(startDate.getTime() + Number(days || 1) * 86400000);
    const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:00`;

    openNewBookingWithPrefill({
      customerName,
      customerPhone,
      tripType,
      pickupLocation: pickupCity,
      dropLocation: dropCity,
      startDateTime: startStr,
      endDateTime: endStr,
      daysCount: Number(days || 1),
      estimatedKm: calculatedKm,
      ratePerKm,
      baseFare,
      driverBata,
      nightHalt,
      tollParking,
      gstEnabled,
      isFromQuote: true
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center bg-white rounded-4xl max-w-[430px] w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DFD3] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#F8F6F0] shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-2xl bg-[#D4F05B] flex items-center justify-center text-[#111827] shadow-xs">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                10-Second Instant Quotation
              </h3>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                Instant rate calculation & WhatsApp proposal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E5DFD3] flex items-center justify-center text-[#4B5563] hover:bg-gray-100 tap-active shadow-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] smooth-scroll-container">
          {/* Customer info (Optional) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Sharma"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#4B5563] block mb-1">WhatsApp Number</label>
              <input
                type="tel"
                placeholder="9822012345"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Trip Type & Car Category Pills */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#4B5563] uppercase tracking-wider block">1. Trip Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['Outstation', 'Local', 'Airport', 'Rental'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTripType(t)}
                  className={`py-1.5 rounded-xl text-xs font-black transition tap-active ${
                    tripType === t
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-[#F8F6F0] text-[#4B5563] border border-[#E5DFD3] hover:bg-gray-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#4B5563] uppercase tracking-wider block">2. Vehicle Class</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['Sedan', 'MUV', 'SUV', 'EV'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`py-1.5 rounded-xl text-xs font-black transition tap-active ${
                    category === c
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : 'bg-[#F8F6F0] text-[#4B5563] border border-[#E5DFD3] hover:bg-gray-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Route & Distance Parameters */}
          <div className="p-3.5 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Pickup City</label>
                <input
                  type="text"
                  value={pickupCity}
                  onChange={e => setPickupCity(e.target.value)}
                  className="w-full bg-white border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Destination Drop</label>
                <input
                  type="text"
                  placeholder="e.g. Shirdi / Mahabaleshwar"
                  value={dropCity}
                  onChange={e => setDropCity(e.target.value)}
                  className="w-full bg-white border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            {tripType === 'Outstation' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Est. Distance (KM)</label>
                  <input
                    type="number"
                    value={distanceKm}
                    onChange={e => setDistanceKm(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Trip Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Package Hours</label>
                  <input
                    type="number"
                    value={hours}
                    onChange={e => setHours(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Package KM</label>
                  <input
                    type="number"
                    value={distanceKm}
                    onChange={e => setDistanceKm(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-[#E5DFD3]">
              <label className="text-[11px] font-bold text-[#4B5563] flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gstEnabled}
                  onChange={e => setGstEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-black accent-black"
                />
                <span>Include 5% GST</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#4B5563]">Tolls: ₹</span>
                <input
                  type="number"
                  value={tollParking}
                  onChange={e => setTollParking(Number(e.target.value))}
                  className="w-16 bg-white border border-[#E5DFD3] rounded-lg px-1.5 py-0.5 text-xs font-bold text-right"
                />
              </div>
            </div>
          </div>

          {/* Quotation Summary Card */}
          <div className="bg-[#111827] text-white rounded-3xl p-4 space-y-2 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Estimated Total Fare</span>
                <h4 className="text-2xl font-black text-[#D4F05B] tracking-tight">
                  {formatCurrency(totalQuoteAmount)}
                </h4>
              </div>
              <span className="text-[10px] bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-full border border-white/10">
                {category} • ₹{ratePerKm}/km
              </span>
            </div>

            <div className="text-[10px] text-gray-300 grid grid-cols-2 gap-1 pt-2 border-t border-gray-800">
              <span>Base Rate: {formatCurrency(baseFare)}</span>
              <span>Driver Bata: {formatCurrency(driverBata)}</span>
              {nightHalt > 0 && <span>Night Charge: {formatCurrency(nightHalt)}</span>}
              <span>Toll & Tax: {formatCurrency(tollParking + gstAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5DFD3] bg-[#F8F6F0] space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyQuote}
              className="py-2.5 rounded-2xl bg-white border border-[#E5DFD3] text-[#111827] text-xs font-black flex items-center justify-center gap-1.5 hover:bg-gray-100 tap-active shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Quote'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 rounded-2xl bg-[#25D366] text-white text-xs font-black flex items-center justify-center gap-1.5 hover:bg-[#20bd5a] tap-active shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            onClick={handleConvertToBooking}
            className="w-full py-2.5 rounded-2xl bg-[#111827] text-white text-xs font-black flex items-center justify-center gap-1.5 hover:bg-black tap-active shadow-xs cursor-pointer"
          >
            <span>Book This Trip</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D4F05B]" />
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
