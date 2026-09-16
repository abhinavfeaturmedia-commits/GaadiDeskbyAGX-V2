import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { modalStack } from '../../services/modalStack';
import { hapticFeedback } from '../../lib/haptics';
import { SignaturePad } from '../signature/SignaturePad';
import { calculateSettlementFare } from '../../lib/fareEngine';
import {
  X,
  CheckCircle2,
  Gauge,
  IndianRupee,
  Receipt,
  FileText,
  MessageCircle,
  Car,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PenTool,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const TripSettlementModal = ({ booking, onClose }) => {
  const {
    vehicles,
    drivers,
    completeTripAndSettle,
    formatCurrency,
    setSelectedInvoiceBooking,
    setWhatsAppData,
    setInspectionModalBooking
  } = useApp();

  const vehicle = vehicles.find(v => v.id === booking.vehicleId);
  const currentOdometer = vehicle?.odometer || booking.startKm || 64000;
  const packageKm = Number(booking.estimatedKm || booking.billableKm || 300);
  const ratePerKm = Number(booking.ratePerKm || 14);

  const [startKm, setStartKm] = useState(booking.startKm || currentOdometer);
  const [endKm, setEndKm] = useState(booking.startKm ? booking.startKm + packageKm : currentOdometer + packageKm);
  const [tollParking, setTollParking] = useState(booking.tollParking || 0);
  const [driverBata, setDriverBata] = useState(booking.driverBata || 0);
  const [nightHalt, setNightHalt] = useState(booking.nightHalt || 0);
  const [extraHours, setExtraHours] = useState(booking.extraHours || 0);
  const [extraHourRate, setExtraHourRate] = useState(booking.extraHourRate || 150);
  const [discount, setDiscount] = useState(booking.discount || 0);
  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' | 'Cash' | 'Bank' | 'Credit'
  const [notes, setNotes] = useState('');
  const [customerSignature, setCustomerSignature] = useState(booking.customerSignature || null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);

  // Settlement Calculation via Central Fare Engine
  const settlementCalc = calculateSettlementFare(booking, {
    startKm,
    endKm,
    tollParking,
    driverBata,
    nightHalt,
    extraHours,
    extraHourRate,
    discount
  });

  const [collectedNowInput, setCollectedNowInput] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const effectiveCollectedNow = collectedNowInput !== null ? Number(collectedNowInput) : settlementCalc.netDue;
  const finalBalanceRemaining = Math.max(0, settlementCalc.netDue - effectiveCollectedNow);

  // Register with modalStack for Android Back Button
  useEffect(() => {
    modalStack.push('trip_settlement_modal', onClose);
    return () => {
      modalStack.remove('trip_settlement_modal');
    };
  }, [onClose]);

  const handleSettle = async (actionType = 'invoice') => {
    if (isSubmitting) return;
    if (Number(endKm) < Number(startKm)) {
      alert("Ending Odometer reading cannot be less than Starting reading.");
      return;
    }

    setIsSubmitting(true);
    try {
      const settlementData = {
        startKm: settlementCalc.startKm,
        endKm: settlementCalc.endKm,
        actualKm: settlementCalc.actualKm,
        packageBaseFare: settlementCalc.packageBaseFare,
        kmFare: settlementCalc.kmFare,
        extraKm: settlementCalc.extraKm,
        extraKmCharges: settlementCalc.extraKmCharges,
        extraHours: settlementCalc.extraHours,
        extraHoursCharges: settlementCalc.extraHoursCharges,
        tollParking: settlementCalc.tollParking,
        driverBata: settlementCalc.driverBata,
        nightHalt: settlementCalc.nightHalt,
        discount: settlementCalc.discount,
        taxableAmount: settlementCalc.taxableAmount,
        gstAmount: settlementCalc.gstAmount,
        totalFare: settlementCalc.grossTotal,
        collectedNow: effectiveCollectedNow,
        finalPaidAmount: effectiveCollectedNow,
        settlementPaymentMode: paymentMode,
        settlementNotes: notes || `Meter settled: ${startKm} KM to ${endKm} KM (${settlementCalc.actualKm} KM total)`,
        customerSignature,
        balanceRemaining: finalBalanceRemaining
      };

      const completedBooking = completeTripAndSettle(booking.id, settlementData);
      hapticFeedback.success();
      onClose();

      if (actionType === 'invoice') {
        setSelectedInvoiceBooking(completedBooking);
      } else if (actionType === 'whatsapp') {
        setWhatsAppData({
          type: 'invoice',
          booking: completedBooking
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center bg-[#F8F6F0] rounded-4xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#E5DFD3] overflow-hidden">
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-[#E5DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black shadow-xs">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                Complete Trip & Settle Meter
              </h3>
              <p className="text-[11px] text-[#4B5563] font-semibold">
                Trip ID: {booking.id} • {booking.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#111827] hover:bg-gray-200 tap-active cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Settlement Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 smooth-scroll-container">
          
          {/* Trip Summary Card */}
          <div className="bg-white rounded-3xl p-3.5 border border-[#E5DFD3] shadow-xs space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#4B5563]">Route:</span>
              <span className="font-black text-[#111827]">{booking.pickupLocation} ➔ {booking.dropLocation}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#4B5563]">Vehicle & Driver:</span>
              <span className="font-bold text-[#111827]">{booking.vehiclePlate || 'Car'} • {booking.driverName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#4B5563]">Package / Base KM:</span>
              <span className="font-bold text-blue-700">
                {packageKm} KM @ ₹{ratePerKm}/km ({formatCurrency(settlementCalc.packageBaseFare)} Base)
              </span>
            </div>
          </div>

          {/* Odometer Meter Reading Input */}
          <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-xs space-y-3">
            <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Odometer Readings (KM)</span>
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                  Start Odometer
                </label>
                <input
                  type="number"
                  value={startKm}
                  onChange={e => setStartKm(Number(e.target.value))}
                  className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                  End Odometer
                </label>
                <input
                  type="number"
                  value={endKm}
                  onChange={e => setEndKm(Number(e.target.value))}
                  className="w-full bg-[#F8F6F0] border-2 border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-950 focus:outline-none"
                />
              </div>
            </div>

            {/* Smart Calculated Distance Ribbon */}
            <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-200 flex items-center justify-between text-xs font-black text-emerald-950">
              <span>Actual Run: {settlementCalc.actualKm} KM</span>
              <span>
                {settlementCalc.isWithinPackage
                  ? `Within ${packageKm} KM Package (Min Applied)`
                  : `+${settlementCalc.extraKm} Extra KM (+${formatCurrency(settlementCalc.extraKmCharges)})`}
              </span>
            </div>
          </div>

          {/* Toll & Highway Expense (Fastag / Receipts) */}
          <div className="bg-white rounded-3xl p-3.5 border border-[#E5DFD3] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#111827] uppercase tracking-wider block">
                Toll & Parking Receipts (₹)
              </label>
              <span className="text-[10px] text-[#4B5563] font-semibold">Fastag / Highway actuals</span>
            </div>
            <input
              type="number"
              value={tollParking}
              onChange={e => setTollParking(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
            />
          </div>

          {/* Collapsible Adjustments for Bata, Halts & Overtime */}
          <div className="bg-white rounded-3xl border border-[#E5DFD3] shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdjustments(!showAdjustments)}
              className="w-full p-3.5 flex items-center justify-between text-left text-xs font-black text-[#111827] hover:bg-gray-50 transition tap-active"
            >
              <span>Adjust Allowances, Halts & Overtime</span>
              {showAdjustments ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {showAdjustments && (
              <div className="p-3.5 pt-0 border-t border-gray-100 space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                      Driver Bata / Allowance (₹)
                    </label>
                    <input
                      type="number"
                      value={driverBata}
                      onChange={e => setDriverBata(Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                      Night Halt Charges (₹)
                    </label>
                    <input
                      type="number"
                      value={nightHalt}
                      onChange={e => setNightHalt(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                      Extra Hours (Overtime)
                    </label>
                    <input
                      type="number"
                      value={extraHours}
                      onChange={e => setExtraHours(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      value={discount}
                      onChange={e => setDiscount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rental 6-Point Return Inspection Check */}
          {booking.tripType === 'Rental' && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-black text-amber-950 block">Return Vehicle Inspection</span>
                <span className="text-[10px] text-amber-800">Check fuel level & verify return condition</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectionModalBooking(booking)}
                className="px-3 py-1.5 rounded-full bg-[#111827] text-white text-[10px] font-black tap-active shadow-xs"
              >
                📷 Inspect Car
              </button>
            </div>
          )}

          {/* Touchscreen Digital Signature Drawer */}
          <div className="bg-white rounded-3xl p-3.5 border-2 border-[#E5DFD3] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-[#EA580C]" />
                <span className="text-xs font-black text-[#111827]">Customer Duty Signature</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSignPad(!showSignPad)}
                className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition tap-active ${
                  customerSignature
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    : 'bg-[#F8F6F0] text-[#111827] border-[#E5DFD3]'
                }`}
              >
                {customerSignature ? 'Signed ✅ (Change)' : showSignPad ? 'Hide Pad' : '✍️ Take Sign'}
              </button>
            </div>

            {showSignPad && (
              <div className="pt-2 border-t border-[#E5DFD3] animate-fade-in">
                <SignaturePad
                  initialSignature={customerSignature}
                  onSave={(dataUrl) => setCustomerSignature(dataUrl)}
                  label="Customer Sign Pad"
                />
              </div>
            )}
          </div>

          {/* Final Billing & Payment Collection */}
          <div className="bg-white rounded-3xl p-4 border-2 border-[#111827] shadow-sm space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4B5563] font-semibold">
                <span>
                  {booking.tripType === 'Outstation' 
                    ? `Base Package (${packageKm} KM @ ₹${ratePerKm}/km):` 
                    : 'Base Package Fare:'}
                </span>
                <span className="font-bold text-[#111827]">{formatCurrency(settlementCalc.packageBaseFare)}</span>
              </div>

              {settlementCalc.extraKmCharges > 0 && (
                <div className="flex justify-between text-[#4B5563] font-semibold">
                  <span>Extra Distance ({settlementCalc.extraKm} KM × ₹{ratePerKm}):</span>
                  <span className="font-bold text-amber-700">+{formatCurrency(settlementCalc.extraKmCharges)}</span>
                </div>
              )}

              {settlementCalc.extraHoursCharges > 0 && (
                <div className="flex justify-between text-[#4B5563] font-semibold">
                  <span>Extra Hours ({extraHours} hrs × ₹{extraHourRate}):</span>
                  <span className="font-bold text-amber-700">+{formatCurrency(settlementCalc.extraHoursCharges)}</span>
                </div>
              )}

              {Number(driverBata) > 0 && (
                <div className="flex justify-between text-[#4B5563] font-semibold">
                  <span>Driver Bata / Allowance:</span>
                  <span className="font-bold text-[#111827]">+{formatCurrency(driverBata)}</span>
                </div>
              )}

              {Number(nightHalt) > 0 && (
                <div className="flex justify-between text-[#4B5563] font-semibold">
                  <span>Night Halt Charges:</span>
                  <span className="font-bold text-purple-700">+{formatCurrency(nightHalt)}</span>
                </div>
              )}

              {tollParking > 0 && (
                <div className="flex justify-between text-[#4B5563] font-semibold">
                  <span>Toll & Parking (Reimbursable):</span>
                  <span className="font-bold text-[#111827]">+{formatCurrency(tollParking)}</span>
                </div>
              )}

              {settlementCalc.gstAmount > 0 && (
                <div className="flex justify-between text-[#4B5563] font-semibold">
                  <span>GST ({booking.gstPercent || 5}% on taxable {formatCurrency(settlementCalc.taxableAmount)}):</span>
                  <span className="font-bold text-[#111827]">+{formatCurrency(settlementCalc.gstAmount)}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Discount Applied:</span>
                  <span className="font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-[#111827] pt-2 border-t border-gray-200">
                <span>Gross Bill:</span>
                <span>{formatCurrency(settlementCalc.grossTotal)}</span>
              </div>

              <div className="flex justify-between text-xs font-bold text-emerald-800">
                <span>Advance Paid Earlier:</span>
                <span>-{formatCurrency(settlementCalc.advancePaid)}</span>
              </div>

              <div className="flex justify-between text-base font-black text-[#EA580C] pt-1 border-t border-gray-200">
                <span>Net Balance Due:</span>
                <span>{formatCurrency(settlementCalc.netDue)}</span>
              </div>
            </div>

            {/* Collection Amount & Mode */}
            <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-black text-[#111827] block mb-1">
                  Amount Collected Now (₹)
                </label>
                <input
                  type="number"
                  value={effectiveCollectedNow}
                  onChange={e => setCollectedNowInput(Number(e.target.value))}
                  className="w-full bg-[#F8F6F0] border-2 border-emerald-400 rounded-xl px-3 py-2 text-xs font-mono font-black text-emerald-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-[#111827] block mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none"
                >
                  <option value="UPI">⚡ Direct UPI</option>
                  <option value="Cash">💵 Cash (Driver)</option>
                  <option value="Bank">🏦 Bank Transfer</option>
                  <option value="Credit">⏳ Credit (Due)</option>
                </select>
              </div>
            </div>

            {finalBalanceRemaining > 0 && (
              <p className="text-[10px] text-amber-800 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200">
                ⚠️ {formatCurrency(finalBalanceRemaining)} remaining balance will be added to {booking.customerName}'s account ledger.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-4 py-3 border-t border-[#E5DFD3] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSettle('whatsapp')}
            className={`flex-1 py-2.5 rounded-full text-white font-black text-xs shadow-md transition tap-active flex items-center justify-center space-x-1.5 cursor-pointer ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed opacity-75' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Settling...' : 'Settle & WhatsApp'}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSettle('invoice')}
            className={`flex-1 py-2.5 rounded-full text-white font-black text-xs shadow-md transition tap-active flex items-center justify-center space-x-1.5 cursor-pointer ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed opacity-75' : 'bg-[#111827] hover:bg-black'
            }`}
          >
            <Receipt className="w-4 h-4 text-[#D4F05B]" />
            <span>{isSubmitting ? 'Settling...' : 'Settle & GST Bill'}</span>
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
