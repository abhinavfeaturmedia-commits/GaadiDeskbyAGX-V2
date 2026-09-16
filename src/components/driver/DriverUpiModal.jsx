import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import {
  QrCode,
  X,
  CheckCircle2,
  Copy,
  Sparkles,
  ShieldCheck,
  Building,
  ExternalLink,
  Smartphone
} from 'lucide-react';

export const DriverUpiModal = () => {
  const {
    driverUpiModalData,
    setDriverUpiModalData,
    business,
    completeDriverTrip,
    formatCurrency
  } = useApp();

  if (!driverUpiModalData) return null;

  const { booking, amount, endKm, tollParking, driverBata } = driverUpiModalData;
  const ownerUpiId = business.upiId || 'office@upi';
  const ownerBizName = business.name || 'Fleet Office';

  const [copied, setCopied] = useState(false);
  const [hasLaunchedUpiApp, setHasLaunchedUpiApp] = useState(false);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(ownerUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenUpiApp = () => {
    setHasLaunchedUpiApp(true);
    try {
      window.location.href = upiIntent;
    } catch (e) {
      console.warn('Failed to launch upiIntent:', e);
    }
  };

  const handlePaymentConfirmed = () => {
    const resolvedEndKm = Number(
      endKm ||
      booking.endKm ||
      booking.endOdometer ||
      (booking.startKm ? booking.startKm + 250 : 64250)
    );

    completeDriverTrip(booking.id, {
      endKm: resolvedEndKm,
      tollParking: Number(tollParking ?? booking.tollParking ?? 0),
      driverBata: Number(driverBata ?? booking.driverBata ?? 0),
      paymentMode: 'UPI',
      finalPaidAmount: Number(amount),
      notes: `Direct UPI payment of ${formatCurrency(amount)} verified by passenger.`
    });

    setDriverUpiModalData(null);
  };

  // Generate standard UPI QR URL via external QR provider with pre-filled amount & business name
  const upiIntent = `upi://pay?pa=${encodeURIComponent(ownerUpiId)}&pn=${encodeURIComponent(ownerBizName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`GaadiDesk Trip ${booking.id}`)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiIntent)}`;

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center bg-white rounded-3.5xl p-5 border-2 border-[#E5DFD3] shadow-2xl max-w-sm w-full flex flex-col max-h-[90vh]">
        {/* Pinned Header */}
        <div className="flex items-center justify-between shrink-0 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5 text-left">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-black shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                Scan & Pay Owner Bank
              </h3>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                Direct to {ownerBizName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDriverUpiModalData(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Middle */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3.5 text-center smooth-scroll-container">
          {/* Amount to Pay Banner */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
              Amount Due to Pay
            </span>
            <span className="text-2xl font-black text-emerald-950">
              {formatCurrency(amount)}
            </span>
          </div>

          {/* Dynamic UPI QR Image */}
          <div className="p-3.5 bg-white border-2 border-dashed border-[#E5DFD3] rounded-3xl shadow-inner inline-block mx-auto">
            <img
              src={qrUrl}
              alt="Owner UPI QR Code"
              className="w-44 h-44 mx-auto rounded-2xl object-contain"
            />
            <div className="flex items-center justify-center space-x-2 mt-2 text-[10px] font-bold text-[#4B5563]">
              <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
            </div>
          </div>

          {/* 1-Tap Mobile UPI Intent Button */}
          <button
            type="button"
            onClick={handleOpenUpiApp}
            className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-soft flex items-center justify-center gap-2 tap-active"
          >
            <Smartphone className="w-4 h-4" />
            <span>Pay with Any UPI App (GPay / PhonePe)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Post-Payment Return Instruction Banner */}
          {hasLaunchedUpiApp && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-left animate-fade-in">
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block">
                Payment Verification Step:
              </span>
              <p className="text-[11px] text-blue-950 mt-0.5 leading-tight">
                Once payment is done in Google Pay / PhonePe, return here and tap the green button below to complete trip settlement.
              </p>
            </div>
          )}

          {/* UPI ID Pill with Copy */}
          <div className="flex items-center justify-between p-2.5 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] text-xs">
            <div className="text-left truncate mr-2">
              <span className="text-[9px] text-[#4B5563] font-bold block">Fleet UPI ID:</span>
              <span className="font-mono font-black text-[#111827] text-[11px] truncate block">{ownerUpiId}</span>
            </div>
            <button
              onClick={handleCopyUpi}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#E5DFD3] text-[10px] font-black text-[#111827] hover:bg-gray-50 shrink-0"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 pt-3 border-t border-slate-100">
          <button
            onClick={handlePaymentConfirmed}
            className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md tap-active flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Customer Paid {formatCurrency(amount)} Online</span>
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
