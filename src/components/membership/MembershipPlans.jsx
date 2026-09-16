import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { initiateMembershipPayment } from '../../services/paymentService';
import {
  X,
  Check,
  Zap,
  ShieldCheck,
  Crown,
  Sparkles,
  Tag,
  CreditCard,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export const MembershipPlans = ({ onClose }) => {
  const { business, updateBusiness, formatCurrency, t, recordTransaction } = useApp();

  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successPlan, setSuccessPlan] = useState(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      vehicles: 5,
      staff: 1,
      driverLogins: 5,
      monthlyPrice: 499,
      yearlyPrice: 4999,
      description: 'Ideal for small owner-drivers & fleets',
      badge: 'POPULAR'
    },
    {
      id: 'growth',
      name: 'Growth Plan',
      vehicles: 15,
      staff: 3,
      driverLogins: 15,
      monthlyPrice: 1499,
      yearlyPrice: 14999,
      description: 'Typical city cab & outstation operator',
      badge: 'RECOMMENDED'
    },
    {
      id: 'business',
      name: 'Business Fleet',
      vehicles: 40,
      staff: 8,
      driverLogins: 40,
      monthlyPrice: 2999,
      yearlyPrice: 29999,
      description: 'Multi-driver agency with high volume',
      badge: 'PRO'
    },
    {
      id: 'agency',
      name: 'Agency Enterprise',
      vehicles: 100,
      staff: 15,
      driverLogins: 100,
      monthlyPrice: 4999,
      yearlyPrice: 49999,
      description: 'Large travel agency & rental mix',
      badge: 'UNLIMITED'
    }
  ];

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'MAHA50') {
      setDiscountPercent(50);
      setCouponMessage('🎉 Coupon MAHA50 applied! Flat 50% OFF on SaaS membership.');
    } else {
      setDiscountPercent(0);
      setCouponMessage('❌ Invalid coupon code. Try MAHA50');
    }
  };

  const handleUpgrade = (plan) => {
    const rawPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const finalAmount = Math.round(rawPrice * (1 - discountPercent / 100));

    setIsProcessing(true);
    initiateMembershipPayment({
      plan,
      billingCycle,
      finalAmount,
      business,
      onSuccess: (paymentData) => {
        const expiryDate = new Date();
        if (billingCycle === 'yearly') {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        updateBusiness({
          membershipPlan: plan.id,
          membershipStatus: 'Active Pro',
          vehicleLimit: plan.vehicles,
          staffLimit: plan.staff,
          membershipExpires: expiryDate.toISOString().split('T')[0]
        });

        // Record SaaS membership payment in business ledger
        if (recordTransaction) {
          recordTransaction({
            type: 'Expense',
            category: 'Software & Membership',
            amount: finalAmount,
            paymentMode: 'Online Gateway',
            notes: `GaadiDesk ${plan.name} (${billingCycle}) - Ref: ${paymentData.paymentId}`,
            date: new Date().toISOString().split('T')[0]
          });
        }

        setIsProcessing(false);
        setSuccessPlan(plan);
      },
      onFailure: (err) => {
        setIsProcessing(false);
        console.warn('[Membership Payment Cancelled/Failed]:', err);
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center bg-[#FBF8F2] rounded-4xl max-w-[430px] w-full max-h-[92vh] flex flex-col shadow-2xl border border-card-border overflow-hidden">
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-card-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src="/gaadidesk_logo.png"
              alt="GaadiDesk Logo"
              className="w-9 h-9 rounded-2xl object-cover shadow-xs ring-1 ring-black/5"
            />
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">{t('membershipTitle')}</h3>
              <p className="text-[11px] text-text-secondary">Official B2B SaaS Plans</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 smooth-scroll-container">
          {successPlan ? (
            <div className="bg-white rounded-3xl p-6 text-center border border-green-200 shadow-soft space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h4 className="text-base font-extrabold text-gray-900">
                🎉 Congratulations! You are on {successPlan.name}
              </h4>
              <p className="text-xs text-text-secondary">
                Your account now supports up to <b>{successPlan.vehicles} vehicles</b> and <b>{successPlan.staff} staff logins</b>. Valid till 30 August 2027.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-full bg-accent-amber text-white text-xs font-bold shadow-glow-amber"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Billing Toggle (Monthly / Yearly) */}
              <div className="bg-white rounded-2xl p-1 border border-card-border flex items-center shadow-xs">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    billingCycle === 'monthly' ? 'bg-accent-lime text-[#1E232A] shadow-xs' : 'text-gray-500'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    billingCycle === 'yearly' ? 'bg-accent-lime text-[#1E232A] shadow-xs' : 'text-gray-500'
                  }`}
                >
                  <span>Yearly (2 Mos Free)</span>
                  <span className="text-[9px] bg-red-500 text-white px-1 rounded-sm">SAVE 17%</span>
                </button>
              </div>

              {/* Coupon Box */}
              <div className="bg-white rounded-2xl p-3 border border-card-border space-y-1.5 shadow-soft">
                <div className="flex items-center space-x-2">
                  <Tag className="w-3.5 h-3.5 text-accent-amber" />
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. MAHA50)"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="flex-1 bg-[#FBF8F2] border border-card-border rounded-xl px-2.5 py-1 text-xs font-mono font-bold uppercase text-gray-900 focus:outline-none"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-3 py-1 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className="text-[10px] font-bold text-green-700">{couponMessage}</p>
                )}
              </div>

              {/* Hormozi 14-Day 5X ROI Risk-Reversal Guarantee */}
              <div className="bg-gradient-to-br from-emerald-950 via-gray-900 to-[#111827] text-white p-3.5 rounded-3xl border-2 border-emerald-500/50 shadow-md space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-400 text-gray-950 flex items-center justify-center font-black text-xs shrink-0">
                    🛡️
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block">
                      14-Day 5X ROI Guarantee
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      Zero financial risk for your travel business
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-200 leading-relaxed">
                  Use GaadiDesk's <b>Fast Cash WhatsApp Dues Recovery</b> tool. If you do not recover at least <b className="text-emerald-300">5X your plan fee</b> in overdue customer credit within 14 days, message us for a <b>100% immediate UPI refund</b> — and keep your plan free for an extra month!
                </p>
                <div className="flex items-center gap-3 text-[10px] text-gray-300 font-bold pt-1.5 border-t border-white/10">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3 h-3" /> 100% Money-Back
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3 h-3" /> Instant UPI Credit
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3 h-3" /> WhatsApp Support
                  </span>
                </div>
              </div>

              {/* Plans List */}
              <div className="space-y-3">
                {plans.map(plan => {
                  const isCurrent = business.membershipPlan === plan.id;
                  let rawPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                  let finalPrice = discountPercent > 0 ? Math.round(rawPrice * (1 - discountPercent / 100)) : rawPrice;

                  return (
                    <div
                      key={plan.id}
                      className={`bg-white rounded-3xl p-4 border transition-all shadow-soft space-y-3 ${
                        isCurrent ? 'border-2 border-accent-amber ring-2 ring-accent-amber/20' : 'border-card-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-extrabold text-gray-900">{plan.name}</h4>
                            <span className="text-[9px] font-extrabold bg-accent-lime text-[#1E232A] px-2 py-0.5 rounded-full">
                              {plan.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-gray-900">
                            {formatCurrency(finalPrice)}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#FBF8F2] rounded-2xl p-2.5 border border-card-border space-y-1 text-xs text-gray-700">
                        <div className="flex items-center space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>Up to <b>{plan.vehicles} Vehicles</b> in Fleet</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span><b>{plan.driverLogins || plan.vehicles} Driver Logins</b> & Live Duty Cockpit</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span><b>{plan.staff} Staff Login</b> Accounts</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>Unlimited WhatsApp Slips & GST Invoices</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>Auto Expiry Alerts & Conflict Detection</span>
                        </div>
                      </div>

                      <button
                        disabled={isCurrent || isProcessing}
                        onClick={() => handleUpgrade(plan)}
                        className={`w-full py-2.5 rounded-full text-xs font-extrabold transition-all tap-active flex items-center justify-center gap-1.5 ${
                          isCurrent
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-accent-amber text-white shadow-glow-amber hover:bg-amber-600'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isCurrent ? 'Current Active Plan' : `Pay ${formatCurrency(finalPrice)} via UPI / Card`}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
