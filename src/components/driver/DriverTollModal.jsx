import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import {
  Receipt,
  X,
  Camera,
  CheckCircle2,
  IndianRupee,
  Sparkles
} from 'lucide-react';

export const DriverTollModal = () => {
  const {
    driverTollModalBooking,
    setDriverTollModalBooking,
    addDriverTripExpense,
    formatCurrency,
    t
  } = useApp();

  if (!driverTollModalBooking) return null;

  const [expenseType, setExpenseType] = useState('Toll'); // 'Toll' | 'Parking' | 'Fuel'
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [photoSnapped, setPhotoSnapped] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    addDriverTripExpense(driverTollModalBooking.id, {
      type: expenseType,
      amount: Number(amount),
      vehicleId: driverTollModalBooking.vehicleId,
      notes: notes || `${expenseType} plaza expense`,
      receiptPhoto: photoSnapped ? 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80' : null
    });

    setDriverTollModalBooking(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-4">
      <div className="modal-card-center bg-white rounded-3.5xl p-6 border-2 border-[#E5DFD3] shadow-2xl max-w-sm w-full max-h-[90vh] flex flex-col space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-900 flex items-center justify-center font-black">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                Log Highway Expense
              </h3>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                Trip: {driverTollModalBooking.id}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDriverTollModalBooking(null)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#111827] font-black hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 smooth-scroll-container pr-0.5">
            {/* Type Selector (Toll / Parking / Fuel) */}
            <div className="flex bg-[#F8F6F0] p-1 rounded-2xl border border-[#E5DFD3] gap-1">
              {['Toll', 'Parking', 'Fuel'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setExpenseType(type)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    expenseType === type
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-black text-[#111827] block mb-1">
                Amount Paid (₹)
              </label>
              <div className="flex items-center rounded-2xl border-2 border-[#E5DFD3] bg-white p-1 shadow-xs focus-within:border-[#111827]">
                <span className="px-3 text-sm font-black text-[#4B5563]">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 180"
                  className="w-full px-1 py-2 text-base font-black text-[#111827] focus:outline-none"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Note / Plaza Name */}
            <div>
              <label className="text-xs font-black text-[#111827] block mb-1">
                Location / Plaza Note
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Khed-Shivapur Toll Plaza"
                className="w-full p-2.5 rounded-2xl border-2 border-[#E5DFD3] text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
              />
            </div>

            {/* Receipt Photo Snap */}
            <button
              type="button"
              onClick={() => setPhotoSnapped(prev => !prev)}
              className={`w-full py-2.5 rounded-2xl border-2 border-dashed flex items-center justify-center space-x-2 text-xs font-black transition tap-active cursor-pointer ${
                photoSnapped
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-[#E5DFD3] bg-[#F8F6F0] text-[#111827]'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{photoSnapped ? '✓ Receipt Photo Attached' : '📸 Snap Toll Slip (Optional)'}</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-3 border-t border-[#E5DFD3] mt-3 shrink-0">
            <button
              type="button"
              onClick={() => setDriverTollModalBooking(null)}
              className="flex-1 py-3 rounded-full bg-gray-100 text-[#4B5563] font-black text-xs tap-active cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md tap-active cursor-pointer"
            >
              Add to Bill
            </button>
          </div>
        </form>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
