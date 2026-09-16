import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { modalStack } from '../../services/modalStack';
import { hapticFeedback } from '../../lib/haptics';
import {
  sendWhatsAppMessage,
  shareViaNative,
  copyToClipboard,
  generateGoogleMapsRouteUrl,
  generateUpiPaymentLink,
  GAADIDESK_WATERMARK
} from '../../services/sharingService';
import {
  X,
  MessageSquare,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Car,
  User,
  CheckCircle2
} from 'lucide-react';

export const WhatsAppModal = ({ data, onClose }) => {
  const { business, formatCurrency } = useApp();
  const [copied, setCopied] = useState(false);
  const [reminderStage, setReminderStage] = useState(data.reminderStage || 1); // 1 | 2 | 3

  if (!data) return null;

  const type = data.type || 'booking'; // 'booking' | 'duty' | 'invoice' | 'reminder'
  const b = data.booking || {};
  const c = data.customer || {};

  let targetName = data.targetName || b.customerName || c.name || 'Client';
  let targetPhone = data.targetPhone || b.customerPhone || c.phone || '';

  if (type === 'duty') {
    targetName = b.driverName || 'Driver';
    targetPhone = b.driverPhone || '';
  }

  const generateWhatsAppMessage = () => {
    if (data.customMessage) {
      return data.customMessage + GAADIDESK_WATERMARK;
    }

    if (type === 'duty') {
      const mapsUrl = generateGoogleMapsRouteUrl(b.pickupLocation, b.dropLocation);
      const mapsLine = mapsUrl ? `🗺️ *Live Google Maps:* ${mapsUrl}\n` : '';

      return `*🚖 DRIVER DUTY SLIP - ${business.name.toUpperCase()}*\n\n` +
        `Hello *${b.driverName || 'Driver'}*,\n` +
        `You have been assigned the following duty:\n\n` +
        `📌 *Trip ID:* ${b.id}\n` +
        `🚗 *Vehicle:* ${b.vehiclePlate}\n` +
        `📍 *Pickup Address:* ${b.pickupLocation}\n` +
        `🏁 *Destination:* ${b.dropLocation}\n` +
        mapsLine +
        `🗓️ *Reporting Time:* ${new Date(b.startDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}\n\n` +
        `👤 *Passenger Name:* ${b.customerName}\n` +
        `📞 *Passenger Phone:* ${b.customerPhone}\n\n` +
        `💵 *Total Trip Fare:* ${formatCurrency(b.totalFare)}\n` +
        `✅ *Advance Collected:* ${formatCurrency(b.advancePaid)}\n` +
        `💰 *Cash to Collect from Customer:* ${formatCurrency(b.balancePending)}\n\n` +
        `⚠️ *Important Instructions:*\n` +
        `• Keep vehicle clean & wear uniform.\n` +
        `• Record Start KM and End KM in GaadiDesk App.\n` +
        `• Collect balance cash and deposit at office at trip end.\n\n` +
        `📞 *Office Support:* ${business.phone}` +
        GAADIDESK_WATERMARK;
    }

    if (type === 'reminder') {
      const balance = c.pendingBalance || b.balancePending || 0;
      const bizName = (business.name || 'Fleet Office').toUpperCase();
      const upiId = business.upiId || 'office@upi';
      const upiLink = business.upiId ? generateUpiPaymentLink({
        upiId: business.upiId,
        payeeName: business.name,
        amount: balance,
        note: `Payment from ${targetName}`
      }) : '';
      const upiClickSection = upiLink ? `\n📲 *1-Tap UPI Pay Link:* ${upiLink}\n` : '';

      if (reminderStage === 1) {
        // Stage 1: Gentle Friendly Check-in
        return `*💳 GENTLE PAYMENT REMINDER - ${bizName}*\n\n` +
          `Hello *${targetName}*,\n\n` +
          `Hope you had a comfortable journey with us! This is a gentle reminder regarding your pending trip balance of *${formatCurrency(balance)}*.\n\n` +
          `⚡ *UPI ID:* ${upiId}` +
          upiClickSection +
          `\nKindly clear the balance at your earliest convenience. Thank you!` +
          GAADIDESK_WATERMARK;
      } else if (reminderStage === 2) {
        // Stage 2: Due Today
        return `*📢 PAYMENT DUE TODAY - ${bizName}*\n\n` +
          `Dear *${targetName}*,\n\n` +
          `Your invoice balance of *${formatCurrency(balance)}* is scheduled for clearance today.\n\n` +
          `⚡ *UPI Payment:* ${upiId}` +
          upiClickSection +
          `\nPlease share a screenshot once payment is completed.\n` +
          `📞 *Office:* ${business.phone || 'Contact Office'}` +
          GAADIDESK_WATERMARK;
      } else {
        // Stage 3: Overdue Statement of Account
        return `*⚠️ OVERDUE STATEMENT OF ACCOUNT - ${bizName}*\n\n` +
          `Dear *${targetName}*,\n\n` +
          `This is a formal notice regarding your overdue balance of *${formatCurrency(balance)}* pending across past trips.\n\n` +
          `Kindly settle this amount immediately via UPI (${upiId}).` +
          upiClickSection +
          `\nIf already paid, please ignore this message.\n\n` +
          `_Office Accounts, ${business.name || 'Fleet Office'}_ • ${business.phone || ''}` +
          GAADIDESK_WATERMARK;
      }
    }

    if (type === 'invoice') {
      return `*🧾 TRIP SETTLEMENT & TAX RECEIPT - ${business.name.toUpperCase()}*\n\n` +
        `Dear *${b.customerName}*,\n` +
        `Thank you for traveling with ${business.name}! Here is your trip summary:\n\n` +
        `📌 *Invoice / Trip ID:* ${b.invoiceNumber || b.id}\n` +
        `📍 *Route:* ${b.pickupLocation} ➔ ${b.dropLocation}\n` +
        `🚗 *Vehicle:* ${b.vehiclePlate}\n` +
        `🛣️ *Distance Covered:* ${b.actualKm || b.estimatedKm} KM\n\n` +
        `💵 *Gross Trip Fare:* ${formatCurrency(b.totalFare)}\n` +
        `✅ *Total Amount Paid:* ${formatCurrency(b.totalPaid || (Number(b.advancePaid || 0) + Number(b.finalPaidAmount || 0)))}\n` +
        `⏳ *Remaining Balance:* ${formatCurrency(b.balancePending || 0)}\n\n` +
        `_We look forward to serving you again!_` +
        GAADIDESK_WATERMARK;
    }

    // Default Customer Booking Confirmation
    const routeMapsUrl = generateGoogleMapsRouteUrl(b.pickupLocation, b.dropLocation);
    const routeMapsLine = routeMapsUrl ? `🗺️ *Route Map:* ${routeMapsUrl}\n` : '';

    return `*🚖 BOOKING CONFIRMATION - ${business.name.toUpperCase()}*\n\n` +
      `Dear *${b.customerName}*,\n` +
      `Your booking is confirmed with details below:\n\n` +
      `📌 *Booking ID:* ${b.id}\n` +
      `🛣️ *Trip Type:* ${b.tripType}\n` +
      `📍 *Pickup:* ${b.pickupLocation}\n` +
      `🏁 *Drop:* ${b.dropLocation}\n` +
      routeMapsLine +
      `🗓️ *Date & Time:* ${new Date(b.startDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}\n\n` +
      `🚗 *Vehicle:* ${b.vehiclePlate}\n` +
      `👤 *Driver:* ${b.driverName || 'Will be assigned 2 hours prior'} (${b.driverPhone || 'Shared soon'})\n\n` +
      `💵 *Total Estimated Fare:* ${formatCurrency(b.totalFare)}\n` +
      `✅ *Advance Paid:* ${formatCurrency(b.advancePaid)}\n` +
      `⏳ *Balance Due:* ${formatCurrency(b.balancePending)}\n\n` +
      `📞 *Office Support:* ${business.phone}\n` +
      `_Thank you for choosing ${business.name}!_` +
      GAADIDESK_WATERMARK;
  };

  const messageText = generateWhatsAppMessage();

  // Register with modalStack for Android Back Button
  useEffect(() => {
    modalStack.push('whatsapp_modal', onClose);
    return () => {
      modalStack.remove('whatsapp_modal');
    };
  }, [onClose]);

  const handleCopy = async () => {
    await copyToClipboard(messageText);
    setCopied(true);
    hapticFeedback.light();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectWhatsApp = () => {
    hapticFeedback.medium();
    sendWhatsAppMessage(targetPhone, messageText);
  };

  const handleNativeShare = async () => {
    hapticFeedback.light();
    await shareViaNative({
      title: data.title || 'GaadiDesk WhatsApp Slip',
      text: messageText
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-4">
      <div className="modal-card-center bg-[#F8F6F0] rounded-4xl max-w-sm w-full max-h-[90vh] flex flex-col p-5 shadow-2xl border-2 border-[#E5DFD3] space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                {data.title || (type === 'duty' ? 'Driver Duty Slip' : type === 'reminder' ? 'Payment Reminder' : 'WhatsApp Slip')}
              </h3>
              <p className="text-[11px] text-[#4B5563] font-semibold">
                Send to {targetName} {targetPhone ? `(${targetPhone})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E5DFD3] flex items-center justify-center text-gray-500 hover:bg-gray-100 tap-active shadow-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Stage Template Selector for Dues */}
        {type === 'reminder' && (
          <div className="space-y-1 bg-white p-2.5 rounded-2xl border border-[#E5DFD3] shrink-0">
            <span className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider block">
              Select Dues Recovery Stage:
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { stage: 1, label: '1. Polite 💬' },
                { stage: 2, label: '2. Due Today 📢' },
                { stage: 3, label: '3. Overdue ⚠️' },
              ].map(s => (
                <button
                  key={s.stage}
                  type="button"
                  onClick={() => setReminderStage(s.stage)}
                  className={`py-1.5 rounded-xl text-[10px] font-black transition tap-active cursor-pointer ${
                    reminderStage === s.stage
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-[#F8F6F0] text-[#4B5563] border border-[#E5DFD3]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Preview in WhatsApp Green Bubble */}
        <div className="flex-1 min-h-0 bg-[#E7F7ED] rounded-3xl p-3.5 border border-emerald-300 text-xs font-mono text-[#111827] overflow-y-auto smooth-scroll-container shadow-inner leading-relaxed whitespace-pre-wrap">
          {messageText}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 pt-2 border-t border-[#E5DFD3] shrink-0">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-full border-2 border-[#E5DFD3] bg-white text-[#111827] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 tap-active shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5 text-[#111827]" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="p-2.5 rounded-full border-2 border-[#E5DFD3] bg-white text-[#111827] flex items-center justify-center hover:bg-gray-50 tap-active shadow-xs cursor-pointer"
            title="Share via other apps"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDirectWhatsApp}
            className="flex-2 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:bg-emerald-700 tap-active cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send WhatsApp</span>
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
