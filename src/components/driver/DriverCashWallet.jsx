import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { sendWhatsAppMessage } from '../../services/sharingService';
import {
  Wallet,
  IndianRupee,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Receipt,
  Sparkles,
  Building,
  History,
  X,
  Share2,
  Copy
} from 'lucide-react';
import { useModalBackRegistration } from '../../services/modalStack';

export const DriverCashWallet = () => {
  const {
    authUser,
    business,
    drivers = [],
    driverSubmissions = [],
    getDriverCashStats,
    submitDriverCash,
    formatCurrency,
    t
  } = useApp();

  const driverId = authUser?.driverId;
  const stats = getDriverCashStats(driverId);
  const driverName = drivers.find(d => d.id === driverId)?.name || authUser?.name || 'Driver';

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitAmount, setSubmitAmount] = useState(stats.netCashDue > 0 ? stats.netCashDue : '');
  const [submitNotes, setSubmitNotes] = useState('Daily cash collection handover to office');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastVoucher, setLastVoucher] = useState(null);

  // Android Back Button Registrations for Driver Cash Modals
  useModalBackRegistration(isSubmitModalOpen, () => setIsSubmitModalOpen(false), 'driver_cash_submit_modal');
  useModalBackRegistration(Boolean(lastVoucher), () => setLastVoucher(null), 'driver_cash_voucher_modal');

  const handleCashHandover = (e) => {
    e.preventDefault();
    if (!submitAmount || Number(submitAmount) <= 0) {
      alert("Please enter a valid handover amount.");
      return;
    }

    const sub = submitDriverCash(driverId, submitAmount, submitNotes);
    setIsSubmitModalOpen(false);
    
    // Set voucher for instant digital WhatsApp sharing
    setLastVoucher({
      amount: Number(submitAmount),
      notes: submitNotes,
      date: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      driverName,
      businessName: business?.name || 'Fleet Office'
    });

    setSuccessMsg(`🎉 Successfully recorded handover of ${formatCurrency(submitAmount)} to fleet office!`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleShareVoucherWhatsApp = () => {
    if (!lastVoucher) return;
    const text = `*CASH HANDOVER VOUCHER*\n` +
      `🏢 Fleet: ${lastVoucher.businessName}\n` +
      `👤 Driver: ${lastVoucher.driverName}\n` +
      `💰 Amount Submitted: ${formatCurrency(lastVoucher.amount)}\n` +
      `📝 Note: ${lastVoucher.notes}\n` +
      `📅 Date: ${lastVoucher.date}\n` +
      `✅ Verified & Recorded in GaadiDesk Central Ledger`;
    sendWhatsAppMessage(business.whatsapp || business.phone, text);
  };

  // Get submission history from context state (with fallback to localStorage)
  const subs = driverSubmissions && driverSubmissions.length > 0
    ? driverSubmissions
    : JSON.parse(localStorage.getItem('gd_driver_submissions') || '[]');
  const driverSubs = subs.filter(s => s.driverId === driverId);

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-[#111827]">
          {t('navDriverWallet')}
        </h2>
        <p className="text-xs text-[#4B5563] font-semibold">
          Daily cash collection, Bata earnings & office reconciliation
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 text-xs font-black flex items-center space-x-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Cash Balance Hero Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-5 shadow-xl space-y-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#D4F05B]">
            Net Cash Due to Submit
          </span>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#D4F05B]" />
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-black text-white">
            {formatCurrency(stats.netCashDue)}
          </h3>
          <p className="text-xs text-gray-300 font-semibold mt-1">
            Cash in your pocket after deducting your Bata allowance & highway tolls.
          </p>
        </div>

        <button
          onClick={() => {
            setSubmitAmount(stats.netCashDue > 0 ? stats.netCashDue : '');
            setIsSubmitModalOpen(true);
          }}
          disabled={stats.netCashDue <= 0}
          className={`w-full py-3 rounded-full font-black text-xs transition tap-active shadow-md flex items-center justify-center space-x-2 ${
            stats.netCashDue > 0
              ? 'bg-[#D4F05B] text-[#111827] hover:bg-lime-400'
              : 'bg-white/10 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{t('driverSubmitCash')}</span>
        </button>
      </div>

      {/* Breakdown Breakdown Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Cash Collected */}
        <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-soft space-y-1">
          <div className="flex items-center space-x-1 text-emerald-600">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">{t('driverCashCollected')}</span>
          </div>
          <span className="text-lg font-black text-[#111827] block">
            {formatCurrency(stats.cashCollected)}
          </span>
          <span className="text-[10px] text-[#4B5563] font-semibold block">From Passenger Fares</span>
        </div>

        {/* Total Bata Allowance */}
        <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-soft space-y-1">
          <div className="flex items-center space-x-1 text-amber-600">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">{t('driverTotalBata')}</span>
          </div>
          <span className="text-lg font-black text-[#111827] block">
            {formatCurrency(stats.totalBata)}
          </span>
          <span className="text-[10px] text-[#4B5563] font-semibold block">Earned Duty Allowance</span>
        </div>

        {/* Reimbursable Tolls */}
        <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-soft space-y-1">
          <div className="flex items-center space-x-1 text-blue-600">
            <Receipt className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">Toll Reimbursed</span>
          </div>
          <span className="text-lg font-black text-[#111827] block">
            {formatCurrency(stats.reimbursableExpenses)}
          </span>
          <span className="text-[10px] text-[#4B5563] font-semibold block">Paid From Pocket</span>
        </div>

        {/* Cash Handed Over */}
        <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-soft space-y-1">
          <div className="flex items-center space-x-1 text-purple-600">
            <Building className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">Submitted to Office</span>
          </div>
          <span className="text-lg font-black text-[#111827] block">
            {formatCurrency(stats.cashSubmitted)}
          </span>
          <span className="text-[10px] text-[#4B5563] font-semibold block">Settled in Ledger</span>
        </div>
      </div>

      {/* Submission History List */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#E5DFD3] shadow-soft space-y-3">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-[#4B5563]" />
          <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">
            Office Handover Log
          </h4>
        </div>

        {driverSubs.length === 0 ? (
          <p className="text-xs text-[#4B5563] font-semibold bg-[#F8F6F0] p-3 rounded-2xl border border-[#E5DFD3]">
            No previous handovers recorded yet. When you submit cash at the fleet office, tap <b>Handover Cash to Office</b> to keep records clean.
          </p>
        ) : (
          <div className="space-y-2">
            {driverSubs.map(sub => (
              <div
                key={sub.id}
                className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] flex items-center justify-between text-xs"
              >
                <div>
                  <h5 className="font-black text-[#111827]">{formatCurrency(sub.amount)} Handed Over</h5>
                  <p className="text-[10px] text-[#4B5563] font-semibold">{sub.notes}</p>
                </div>
                <span className="text-[10px] font-bold text-[#4B5563]">
                  {new Date(sub.date).toLocaleDateString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Handover Modal */}
      {isSubmitModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] modal-center-backdrop p-4">
          <div className="modal-card-center bg-white rounded-3.5xl p-5 border-2 border-[#E5DFD3] shadow-2xl max-w-sm w-full flex flex-col max-h-[90vh]">
            {/* Pinned Header */}
            <div className="flex items-center justify-between shrink-0 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                  <Building className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-[#111827]">
                  {t('driverSubmitCash')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="driverHandoverForm" onSubmit={handleCashHandover} className="flex-1 min-h-0 flex flex-col">
              {/* Scrollable Middle */}
              <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3.5 smooth-scroll-container">
                {/* Visual Formula Breakdown */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-1.5 text-xs">
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Calculation Summary
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Trip Cash Collected:</span>
                    <span className="font-extrabold text-gray-900">{formatCurrency(stats.cashCollected)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>- Driver Bata Earned:</span>
                    <span className="font-extrabold">-{formatCurrency(stats.totalBata)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>- Reimbursable Tolls:</span>
                    <span className="font-extrabold">-{formatCurrency(stats.reimbursableExpenses)}</span>
                  </div>
                  {stats.cashSubmitted > 0 && (
                    <div className="flex justify-between text-purple-700">
                      <span>- Earlier Submissions:</span>
                      <span className="font-extrabold">-{formatCurrency(stats.cashSubmitted)}</span>
                    </div>
                  )}
                  <div className="border-t border-stone-200 pt-1.5 flex justify-between font-black text-sm text-[#111827]">
                    <span>Net Balance Due:</span>
                    <span className="text-emerald-700">{formatCurrency(stats.netCashDue)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-[#111827] block mb-1">
                    Handover Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={submitAmount}
                    onChange={e => setSubmitAmount(e.target.value)}
                    className="w-full p-3 rounded-2xl border-2 border-[#E5DFD3] text-lg font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    placeholder="e.g. 5000"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-[#111827] block mb-1">
                    Settlement Note
                  </label>
                  <input
                    type="text"
                    value={submitNotes}
                    onChange={e => setSubmitNotes(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border-2 border-[#E5DFD3] text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    placeholder="e.g. Handed to Ramesh bhai at office counter"
                  />
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="shrink-0 pt-3 border-t border-slate-100 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-3 rounded-full bg-gray-100 hover:bg-gray-200 text-[#4B5563] font-black text-xs tap-active transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md tap-active transition-colors"
                >
                  Confirm Handover
                </button>
              </div>
            </form>
          </div>
        </div>,
        getModalPortalRoot()
      )}

      {/* Digital WhatsApp Voucher Modal */}
      {lastVoucher && createPortal(
        <div className="fixed inset-0 z-[9999] modal-center-backdrop p-4 animate-fade-in">
          <div className="modal-card-center bg-white rounded-3.5xl p-6 border-2 border-[#E5DFD3] shadow-2xl max-w-sm w-full space-y-4 animate-scale-up">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl">
                🧾
              </div>
              <h3 className="text-base font-black text-[#111827]">Cash Handover Voucher</h3>
              <p className="text-xs text-gray-500 font-bold">Successfully Recorded in Ledger</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Fleet Business:</span>
                <span className="font-extrabold text-[#111827]">{lastVoucher.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Driver Name:</span>
                <span className="font-extrabold text-[#111827]">{lastVoucher.driverName}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-1.5">
                <span className="text-gray-500">Amount Handed:</span>
                <span className="font-black text-emerald-700 text-sm">{formatCurrency(lastVoucher.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date & Time:</span>
                <span className="font-bold text-gray-700">{lastVoucher.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Notes:</span>
                <span className="font-bold text-gray-700 truncate max-w-[170px]">{lastVoucher.notes}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleShareVoucherWhatsApp}
                className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md tap-active transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Receipt on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setLastVoucher(null)}
                className="w-full py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs tap-active transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        getModalPortalRoot()
      )}
    </div>
  );
};
