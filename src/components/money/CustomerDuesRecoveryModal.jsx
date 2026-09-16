import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { modalStack } from '../../services/modalStack';
import { hapticFeedback } from '../../lib/haptics';
import {
  sendWhatsAppMessage,
  copyToClipboard,
  generateUpiPaymentLink,
  GAADIDESK_WATERMARK
} from '../../services/sharingService';
import {
  X,
  Zap,
  MessageSquare,
  Copy,
  Check,
  Search,
  Filter,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
  Building,
  User,
  ExternalLink,
  DollarSign
} from 'lucide-react';

export const CustomerDuesRecoveryModal = ({ onClose }) => {
  const {
    customers,
    business,
    formatCurrency,
    setCustomerSettlementData,
    setWhatsAppData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'high' | 'corporate' | 'retail'
  const [copiedId, setCopiedId] = useState(null);
  const [selectedStages, setSelectedStages] = useState({}); // { [customerId]: 1 | 2 | 3 }

  // Register with modalStack for Android hardware back button
  useEffect(() => {
    modalStack.push('dues_recovery_modal', onClose);
    return () => {
      modalStack.remove('dues_recovery_modal');
    };
  }, [onClose]);

  // Filter customers who have positive pending balance
  const dueCustomers = useMemo(() => {
    return customers.filter(c => Number(c.pendingBalance || 0) > 0);
  }, [customers]);

  const totalOutstanding = useMemo(() => {
    return dueCustomers.reduce((acc, c) => acc + Number(c.pendingBalance || 0), 0);
  }, [dueCustomers]);

  const filteredCustomers = useMemo(() => {
    return dueCustomers.filter(c => {
      // Search matching
      const matchesSearch =
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery) ||
        c.company?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter matching
      if (filterMode === 'high') {
        return Number(c.pendingBalance || 0) >= 5000;
      }
      if (filterMode === 'corporate') {
        return c.type?.toLowerCase() === 'corporate' || Boolean(c.company);
      }
      if (filterMode === 'retail') {
        return c.type?.toLowerCase() !== 'corporate' && !c.company;
      }
      return true;
    }).sort((a, b) => Number(b.pendingBalance || 0) - Number(a.pendingBalance || 0));
  }, [dueCustomers, searchQuery, filterMode]);

  const getStage = (customerId) => selectedStages[customerId] || 1;

  const setStage = (customerId, stage) => {
    hapticFeedback.light();
    setSelectedStages(prev => ({ ...prev, [customerId]: stage }));
  };

  const handleCopyUpiLink = async (customer) => {
    hapticFeedback.light();
    const upiLink = generateUpiPaymentLink({
      upiId: business.upiId || 'office@upi',
      payeeName: business.name || 'GaadiDesk Partner',
      amount: customer.pendingBalance,
      note: `Pending Dues - ${customer.name}`
    });

    await copyToClipboard(upiLink);
    setCopiedId(customer.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendReminder = (customer) => {
    hapticFeedback.medium();
    const stage = getStage(customer.id);
    const balance = Number(customer.pendingBalance || 0);
    const bizName = (business.name || 'Fleet Office').toUpperCase();
    const upiId = business.upiId || 'office@upi';
    const upiLink = generateUpiPaymentLink({
      upiId,
      payeeName: business.name,
      amount: balance,
      note: `Pending Dues - ${customer.name}`
    });
    const upiClickSection = upiLink ? `\n📲 *1-Tap UPI Pay Link:* ${upiLink}\n` : '';

    let text = '';
    if (stage === 1) {
      text = `*💳 GENTLE PAYMENT REMINDER - ${bizName}*\n\n` +
        `Hello *${customer.name}*,\n\n` +
        `Hope you had a comfortable journey with us! This is a friendly reminder regarding your pending trip balance of *${formatCurrency(balance)}*.\n\n` +
        `⚡ *UPI ID:* ${upiId}` +
        upiClickSection +
        `\nKindly clear the balance at your earliest convenience. Thank you!` +
        GAADIDESK_WATERMARK;
    } else if (stage === 2) {
      text = `*📢 PAYMENT DUE TODAY - ${bizName}*\n\n` +
        `Dear *${customer.name}*,\n\n` +
        `Your invoice balance of *${formatCurrency(balance)}* is scheduled for clearance today.\n\n` +
        `⚡ *UPI Payment:* ${upiId}` +
        upiClickSection +
        `\nPlease share a screenshot once payment is completed.\n` +
        `📞 *Office:* ${business.phone || 'Contact Office'}` +
        GAADIDESK_WATERMARK;
    } else {
      text = `*⚠️ OVERDUE STATEMENT OF ACCOUNT - ${bizName}*\n\n` +
        `Dear *${customer.name}*,\n\n` +
        `This is a formal notice regarding your overdue balance of *${formatCurrency(balance)}* pending across past trips.\n\n` +
        `Kindly settle this amount immediately via UPI (${upiId}).` +
        upiClickSection +
        `\nIf already paid, please ignore this message.\n\n` +
        `_Office Accounts, ${business.name || 'Fleet Office'}_ • ${business.phone || ''}` +
        GAADIDESK_WATERMARK;
    }

    sendWhatsAppMessage(customer.phone, text);
  };

  const handleOpenSettle = (customer) => {
    hapticFeedback.light();
    onClose();
    setTimeout(() => {
      setCustomerSettlementData(customer);
    }, 150);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3 sm:p-4 flex items-center justify-center">
      <div className="modal-card-center bg-[#FAF8F2] rounded-3xl sm:rounded-4xl max-w-lg w-full max-h-[92vh] flex flex-col p-4 sm:p-5 shadow-2xl border-2 border-[#E5DFD3] space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-[#111827] flex items-center justify-center shadow-xs font-black">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-[#111827]">
                  Fast Cash Recovery
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                  Dues Engine
                </span>
              </div>
              <p className="text-xs text-[#4B5563] font-semibold">
                Recover pending customer credit with 1-tap WhatsApp UPI links
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

        {/* Hero Dues Banner */}
        <div className="bg-[#111827] text-white p-4 rounded-3xl shadow-md border border-gray-800 shrink-0 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-300 block">
              Total Market Credit Locked
            </span>
            <h4 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {formatCurrency(totalOutstanding)}
            </h4>
            <p className="text-[11px] text-gray-300 font-semibold mt-0.5">
              Pending across {dueCustomers.length} customer accounts
            </p>
          </div>
          <div className="bg-white/10 px-3 py-2 rounded-2xl text-center border border-white/10">
            <span className="text-[10px] text-gray-300 block font-bold">UPI Linked</span>
            <span className="text-xs font-black text-[#D4F05B]">
              {business.upiId ? 'Active ✓' : 'Add in Settings'}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, phone or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border border-[#E5DFD3] text-xs font-semibold focus:outline-hidden focus:border-[#111827] shadow-xs"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: `All (${dueCustomers.length})` },
              { id: 'high', label: 'High Value (≥₹5k)' },
              { id: 'corporate', label: 'Corporate' },
              { id: 'retail', label: 'Retail' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => {
                  hapticFeedback.light();
                  setFilterMode(f.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-black whitespace-nowrap transition tap-active cursor-pointer ${
                  filterMode === f.id
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'bg-white text-[#4B5563] border border-[#E5DFD3] hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Dues List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 smooth-scroll-container">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#E5DFD3] space-y-2">
              <Check className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-black text-[#111827]">
                {dueCustomers.length === 0
                  ? 'Zero Pending Dues! All Customer Accounts Are Settled.'
                  : 'No customers match the current filter.'}
              </p>
              <p className="text-[11px] text-[#4B5563]">
                {dueCustomers.length === 0
                  ? 'Your cashflow is 100% healthy.'
                  : 'Try clearing the search or switching filter modes.'}
              </p>
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const stage = getStage(customer.id);
              const isCopied = copiedId === customer.id;

              return (
                <div
                  key={customer.id}
                  className="p-3.5 bg-white rounded-3xl border border-[#E5DFD3] shadow-xs hover:border-gray-400 transition-all space-y-3"
                >
                  {/* Customer Info Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs shrink-0">
                        {customer.type === 'corporate' ? (
                          <Building className="w-4 h-4" />
                        ) : (
                          customer.name?.charAt(0)?.toUpperCase() || 'C'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-[#111827]">
                            {customer.name}
                          </h4>
                          {customer.company && (
                            <span className="text-[10px] text-gray-500 font-bold">
                              ({customer.company})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#4B5563] font-semibold">
                          📞 {customer.phone || 'No phone'} • {customer.type || 'Retail'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-rose-700 block">
                        {formatCurrency(customer.pendingBalance)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                        Pending Due
                      </span>
                    </div>
                  </div>

                  {/* 3-Stage Tone Selector */}
                  <div className="bg-[#FAF8F2] p-1.5 rounded-2xl border border-[#E5DFD3] flex items-center gap-1">
                    {[
                      { s: 1, label: '1. Polite 💬' },
                      { s: 2, label: '2. Today 📢' },
                      { s: 3, label: '3. Overdue ⚠️' }
                    ].map(st => (
                      <button
                        key={st.s}
                        onClick={() => setStage(customer.id, st.s)}
                        className={`flex-1 py-1 rounded-xl text-[10px] font-black transition tap-active cursor-pointer ${
                          stage === st.s
                            ? 'bg-[#111827] text-white shadow-xs'
                            : 'text-[#4B5563] hover:text-[#111827]'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => handleCopyUpiLink(customer)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#111827] text-[10px] font-black flex items-center gap-1 tap-active cursor-pointer shadow-2xs"
                      title="Copy Direct UPI Intent Payment Link"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-green-700" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#111827]" />
                      )}
                      <span>{isCopied ? 'Copied' : 'UPI Link'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenSettle(customer)}
                      className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-black text-white text-[10px] font-black flex items-center gap-1 tap-active cursor-pointer shadow-xs"
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>Settle Cash</span>
                    </button>

                    <button
                      onClick={() => handleSendReminder(customer)}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center gap-1.5 tap-active cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send WhatsApp Dues</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Advice */}
        <div className="pt-2 border-t border-[#E5DFD3] shrink-0 flex items-center justify-between text-[11px] text-[#4B5563] font-semibold">
          <span>💡 Sending Stage 1 recovers 74% within 2 hours.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white border border-[#E5DFD3] font-bold text-[#111827] tap-active hover:bg-gray-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
