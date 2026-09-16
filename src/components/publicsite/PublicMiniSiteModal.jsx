import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import {
  X,
  Globe,
  Share2,
  Copy,
  Check,
  Car,
  Star,
  ShieldCheck,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Send
} from 'lucide-react';

export const PublicMiniSiteModal = ({ onClose }) => {
  const { business, vehicles, rateCards, saveBooking, formatCurrency } = useApp();

  const [copied, setCopied] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    tripType: 'Outstation',
    pickup: 'Pune',
    drop: 'Mahabaleshwar',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    category: 'Sedan'
  });

  const publicUrl = `https://gaadidesk.in/${business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.phone) return;

    // Auto-create Enquiry in GaadiDesk central bookings
    saveBooking({
      tripType: inquiryForm.tripType,
      customerName: inquiryForm.name,
      customerPhone: inquiryForm.phone,
      pickupLocation: inquiryForm.pickup,
      dropLocation: inquiryForm.drop,
      startDateTime: `${inquiryForm.date}T08:00:00`,
      endDateTime: `${inquiryForm.date}T20:00:00`,
      status: 'Enquiry',
      baseFare: inquiryForm.category === 'MUV' ? 4500 : 3200,
      totalFare: inquiryForm.category === 'MUV' ? 4500 : 3200,
      advancePaid: 0,
      balancePending: inquiryForm.category === 'MUV' ? 4500 : 3200,
      notes: `Direct inquiry from public mini-website (${publicUrl})`
    });

    setInquirySubmitted(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center bg-white rounded-4xl max-w-[440px] w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DFD3] overflow-hidden">
        {/* Modal Top Control Bar */}
        <div className="px-5 py-3.5 border-b border-[#E5DFD3] flex items-center justify-between bg-[#F8F6F0] shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-2xl bg-[#111827] text-[#D4F05B] flex items-center justify-center font-black text-xs shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                Your Branded Public Mini-Website
              </h3>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                Live link for customer quotes & WhatsApp leads
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

        {/* Link URL Bar */}
        <div className="px-5 py-2.5 bg-white border-b border-[#E5DFD3] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-hidden text-xs font-mono text-[#4B5563]">
            <span className="text-emerald-700">🔒</span>
            <span className="truncate">{publicUrl}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1 rounded-full bg-[#F8F6F0] border border-[#E5DFD3] text-[11px] font-black text-[#111827] flex items-center gap-1 hover:bg-gray-100 tap-active shrink-0 shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Public Mini-Site Preview Frame */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-xs text-[#111827] smooth-scroll-container bg-[#FAF9F5]">
          {/* Hero Banner */}
          <div className="bg-[#111827] text-white rounded-3xl p-5 space-y-3 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/gaadidesk_logo.png" alt={business.name} className="w-8 h-8 rounded-xl object-cover" />
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Verified Fleet</span>
                </span>
              </div>
              <div className="flex items-center text-amber-400 text-xs font-bold gap-0.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>4.9 (180+ Trips)</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {business.name}
              </h2>
              <p className="text-xs text-gray-300 font-medium mt-0.5">
                Premium Outstation Cabs & Chauffeur Rentals across {business.city} & Maharashtra.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={`tel:${business.phone}`}
                className="px-3.5 py-1.5 rounded-full bg-white text-[#111827] text-xs font-black flex items-center gap-1.5 shadow-xs"
              >
                <Phone className="w-3 h-3" />
                <span>Call Now</span>
              </a>
              <a
                href={`https://wa.me/91${business.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hi ${business.name}, I want to book a cab.`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-black flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Transparent Rate Cards Showcase */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">
              Popular Transparent Rates
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-1">
                <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  Sedan Outstation
                </span>
                <p className="text-sm font-black text-[#111827]">₹12 – ₹14 / KM</p>
                <p className="text-[10px] text-[#4B5563]">Dzire / Aura AC • Min 250 km/day</p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-1">
                <span className="text-[10px] font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                  Innova Crysta 7S
                </span>
                <p className="text-sm font-black text-[#111827]">₹19 – ₹22 / KM</p>
                <p className="text-[10px] text-[#4B5563]">Family luxury AC • Professional driver</p>
              </div>
            </div>
          </div>

          {/* Fleet Showcase Carousel Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">
              Sanitized Fleet Showcase ({vehicles.length} Cars)
            </h4>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {vehicles.map(v => (
                <div key={v.id} className="w-36 shrink-0 bg-white rounded-2xl border border-[#E5DFD3] p-2.5 shadow-xs space-y-1.5">
                  <img src={v.image} alt={v.model} className="w-full h-20 rounded-xl object-cover" />
                  <h5 className="font-black text-[#111827] text-xs truncate">{v.brand} {v.model}</h5>
                  <p className="text-[10px] text-[#4B5563] font-semibold">{v.seats} Seats • {v.fuel}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Lead Inquiry Form */}
          <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-xs space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#EA580C]" />
              <h4 className="text-xs font-black text-[#111827]">Instant Trip Inquiry</h4>
            </div>

            {inquirySubmitted ? (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-center space-y-1">
                <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-black text-emerald-950">Inquiry Received!</p>
                <p className="text-[11px] text-emerald-800">
                  This trip has been captured directly into your GaadiDesk bookings as an <b>Enquiry</b>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={inquiryForm.name}
                    onChange={e => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    className="bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={inquiryForm.phone}
                    onChange={e => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    className="bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Pickup City"
                    value={inquiryForm.pickup}
                    onChange={e => setInquiryForm({ ...inquiryForm, pickup: e.target.value })}
                    className="bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Drop Destination"
                    value={inquiryForm.drop}
                    onChange={e => setInquiryForm({ ...inquiryForm, drop: e.target.value })}
                    className="bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-[#111827] text-white text-xs font-black flex items-center justify-center gap-1.5 hover:bg-black tap-active shadow-xs"
                >
                  <Send className="w-3.5 h-3.5 text-[#D4F05B]" />
                  <span>Submit Inquiry (Test Lead Capture)</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
