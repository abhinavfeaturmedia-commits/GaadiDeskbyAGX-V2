import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { modalStack } from '../../services/modalStack';
import {
  X,
  CheckCircle2,
  Tag,
  Calculator,
  Car,
  Clock,
  Navigation,
  ShieldCheck,
  Fuel,
  Percent,
  Sparkles
} from 'lucide-react';

export const RateCardEditModal = ({ rateCard, onSave, onClose }) => {
  const [formData, setFormData] = useState(() => ({
    ...rateCard,
    perKmRate: rateCard.perKmRate ?? rateCard.extraKmRate ?? 14,
    extraKmRate: rateCard.extraKmRate ?? rateCard.perKmRate ?? 14,
    baseKm: rateCard.baseKm ?? rateCard.minKmPerDay ?? (rateCard.tripType === 'Outstation' ? 250 : 80),
    minKmPerDay: rateCard.minKmPerDay ?? rateCard.baseKm ?? 250,
    basePrice: rateCard.basePrice ?? 1800,
    baseHours: rateCard.baseHours ?? rateCard.includedHours ?? (rateCard.tripType === 'Airport' ? 4 : 8),
    extraHourRate: rateCard.extraHourRate ?? 150,
    driverBata: rateCard.driverBata ?? (rateCard.tripType === 'Outstation' ? 400 : 0),
    nightHalt: rateCard.nightHalt ?? (rateCard.tripType === 'Outstation' ? 300 : 0),
    securityDeposit: rateCard.securityDeposit ?? 5000,
    fuelPolicy: rateCard.fuelPolicy || 'Same to Same',
    defaultGstPercent: rateCard.defaultGstPercent ?? 5
  }));

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Register with global modalStack for Android hardware back button and Escape key
  useEffect(() => {
    modalStack.push('rate_card_modal', onClose);
    return () => {
      modalStack.remove('rate_card_modal');
    };
  }, [onClose]);

  const handleCloseModal = () => {
    if (typeof window !== 'undefined' && window.history.state?.rateCardModal) {
      window.history.back();
    }
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Sync duplicate aliases for engine compatibility
      if (field === 'perKmRate') updated.extraKmRate = value;
      if (field === 'extraKmRate' && prev.tripType === 'Outstation') updated.perKmRate = value;
      if (field === 'minKmPerDay') updated.baseKm = value;
      if (field === 'baseKm' && prev.tripType === 'Outstation') updated.minKmPerDay = value;
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      onSave(formData);
    }, 200);
  };

  const isOutstation = formData.tripType === 'Outstation';
  const isRental = formData.tripType === 'Rental';
  const isLocalOrAirport = formData.tripType === 'Local' || formData.tripType === 'Airport';

  return createPortal(
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
      className="modal-center-backdrop"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="modal-card-center max-w-[440px] bg-white rounded-3xl shadow-2xl border-2 border-[#E5DFD3] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#F8F6F0] px-5 py-4 border-b border-[#E5DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#111827] text-[#D4F05B] flex items-center justify-center font-black shadow-xs">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-[#111827]">
                  Edit Rate Card
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-950 font-bold px-2 py-0.2 rounded-full border border-amber-300">
                  {formData.category || 'Standard'}
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] font-semibold mt-0.5">
                {formData.tripType} Package Settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-white border border-[#E5DFD3] text-[#4B5563] hover:text-[#111827] flex items-center justify-center tap-active shadow-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tag & Category Summary Banner */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-700" />
              <div>
                <span className="font-bold text-amber-950">{formData.tripType}</span>
                <span className="text-amber-800 text-[11px]"> • {formData.category || 'Standard'} Category</span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md">
              ID: {formData.id}
            </span>
          </div>

          {/* Dynamic Rate Form Fields */}
          {isOutstation && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1 flex items-center gap-1">
                    <span>Rate / KM (₹)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.5"
                      value={formData.perKmRate}
                      onChange={e => handleChange('perKmRate', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1 flex items-center gap-1">
                    <span>Min KM / Day</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="50"
                      step="10"
                      value={formData.minKmPerDay}
                      onChange={e => handleChange('minKmPerDay', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-[#4B5563] font-bold">KM</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1">
                    Driver Bata (₹/day)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formData.driverBata}
                      onChange={e => handleChange('driverBata', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1">
                    Night Halt (₹/night)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formData.nightHalt}
                      onChange={e => handleChange('nightHalt', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLocalOrAirport && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1 flex items-center gap-1">
                    <span>Base Fare (₹)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="100"
                      step="50"
                      value={formData.basePrice}
                      onChange={e => handleChange('basePrice', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1 flex items-center gap-1">
                    <span>Extra KM Rate (₹)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.5"
                      value={formData.extraKmRate}
                      onChange={e => handleChange('extraKmRate', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1">
                    Included Hours
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={formData.baseHours}
                      onChange={e => handleChange('baseHours', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-[#4B5563] font-bold">Hrs</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1">
                    Included KM
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={formData.baseKm}
                      onChange={e => handleChange('baseKm', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-[#4B5563] font-bold">KM</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1">
                    Extra Hour Rate (₹/hr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="25"
                      value={formData.extraHourRate}
                      onChange={e => handleChange('extraHourRate', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1">
                    Driver Bata (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formData.driverBata}
                      onChange={e => handleChange('driverBata', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isRental && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1 flex items-center gap-1">
                    <span>Daily Rental Price (₹)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="100"
                      step="100"
                      value={formData.basePrice}
                      onChange={e => handleChange('basePrice', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1">
                    Security Deposit (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={formData.securityDeposit}
                      onChange={e => handleChange('securityDeposit', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1">
                    Extra KM Rate (₹/km)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#4B5563] font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formData.extraKmRate}
                      onChange={e => handleChange('extraKmRate', Number(e.target.value))}
                      className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl pl-7 pr-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-[#111827] block mb-1">
                    Fuel Policy
                  </label>
                  <select
                    value={formData.fuelPolicy}
                    onChange={e => handleChange('fuelPolicy', e.target.value)}
                    className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-black text-[#111827] focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Same to Same">Same to Same</option>
                    <option value="Company Fuel">Company Fuel</option>
                    <option value="Excluding Fuel">Excluding Fuel</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* GST % Configuration */}
          <div>
            <label className="text-[11px] font-black text-[#111827] block mb-1 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-[#4B5563]" />
              <span>Default GST Rate (%)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 5, 12, 18].map(gst => (
                <button
                  key={gst}
                  type="button"
                  onClick={() => handleChange('defaultGstPercent', gst)}
                  className={`py-1.5 rounded-xl text-xs font-black transition-all border ${
                    formData.defaultGstPercent === gst
                      ? 'bg-[#111827] text-white border-[#111827] shadow-xs'
                      : 'bg-[#F8F6F0] text-[#4B5563] border-[#E5DFD3] hover:bg-white'
                  }`}
                >
                  {gst}%
                </button>
              ))}
            </div>
          </div>

          {/* Quick Rate Calculation Preview Box */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-blue-950 font-black">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Fare Estimate Preview</span>
            </div>
            <p className="text-[11px] text-blue-900 font-semibold leading-relaxed">
              {isOutstation && (
                <>
                  A 2-day trip covering 500 km will calculate: Base{' '}
                  <span className="font-mono font-bold">₹{500 * Number(formData.perKmRate || 14)}</span> + Bata{' '}
                  <span className="font-mono font-bold">₹{2 * Number(formData.driverBata || 400)}</span> ={' '}
                  <span className="font-mono font-black text-blue-950">
                    ₹{(500 * Number(formData.perKmRate || 14)) + (2 * Number(formData.driverBata || 400))}
                  </span>{' '}
                  + GST.
                </>
              )}
              {isLocalOrAirport && (
                <>
                  Package includes <span className="font-bold">{formData.baseHours}h / {formData.baseKm}km</span> for{' '}
                  <span className="font-mono font-bold">₹{formData.basePrice}</span>. Extra travel billed at{' '}
                  <span className="font-mono font-bold">₹{formData.extraKmRate}/km</span> and{' '}
                  <span className="font-mono font-bold">₹{formData.extraHourRate}/hr</span>.
                </>
              )}
              {isRental && (
                <>
                  Standard self-drive rental: <span className="font-mono font-bold">₹{formData.basePrice}/day</span> with{' '}
                  <span className="font-mono font-bold">₹{formData.securityDeposit}</span> refundable security deposit.
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 py-2.5 text-xs font-black text-[#4B5563] bg-white hover:bg-gray-100 border border-[#E5DFD3] rounded-full tap-active transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-black text-white bg-[#111827] hover:bg-black rounded-full shadow-md tap-active flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4F05B]" />
              <span>{saveSuccess ? 'Saved!' : 'Save Rate Card'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
