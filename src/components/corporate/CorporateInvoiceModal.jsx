import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { modalStack } from '../../services/modalStack';
import { sendWhatsAppMessage } from '../../services/sharingService';
import {
  X,
  Printer,
  Share2,
  Building,
  CheckSquare,
  Square,
  FileText,
  Calendar,
  CreditCard,
  Download,
  CheckCircle2,
  Check
} from 'lucide-react';

export const CorporateInvoiceModal = ({ customer, onClose }) => {
  const { business, bookings, formatCurrency, saveCorporateInvoice, invoices } = useApp();
  const invoiceRef = useRef();

  // Register with modalStack for Android Back Button
  useEffect(() => {
    modalStack.push('corporate_invoice_modal', onClose);
    return () => {
      modalStack.remove('corporate_invoice_modal');
    };
  }, [onClose]);

  // Find all completed bookings for this customer
  const customerBookings = bookings.filter(b =>
    (b.customerId === customer?.id ||
     (customer?.name && b.customerName?.toLowerCase() === customer.name.toLowerCase()) ||
     (customer?.phone && b.customerPhone && b.customerPhone.replace(/\D/g, '').slice(-10) === customer.phone.replace(/\D/g, '').slice(-10))) &&
    b.status === 'Completed'
  );

  const [selectedBookingIds, setSelectedBookingIds] = useState(
    customerBookings.map(b => b.id)
  );
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedTrips = customerBookings.filter(b => selectedBookingIds.includes(b.id));

  // Dynamic calculation of billing period based on selected trips
  const calcBillingPeriod = () => {
    if (!selectedTrips.length) return new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    const dates = selectedTrips
      .map(t => new Date(t.startDateTime || t.createdAt))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a - b);
    if (!dates.length) return 'Current Billing Period';
    const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
  };

  const billingPeriod = calcBillingPeriod();

  // Sequential GST-compliant corporate invoice numbering
  const [invoiceNumber] = useState(() => {
    const seq = String((invoices || []).length + 101).padStart(4, '0');
    return `GD/CORP/2026-27/${seq}`;
  });

  const [isSaved, setIsSaved] = useState(false);

  // Computations with Zero Toll Double-Counting
  const totalTaxable = selectedTrips.reduce((sum, b) => {
    if (b.taxableAmount !== undefined && b.taxableAmount !== null && Number(b.taxableAmount) > 0) {
      return sum + Number(b.taxableAmount);
    }
    const tolls = Number(b.tollParking || 0);
    const fareWithoutTolls = Math.max(0, Number(b.totalFare || 0) - tolls);
    return sum + (b.gstEnabled ? Math.round(fareWithoutTolls / 1.05) : fareWithoutTolls);
  }, 0);
  const totalTolls = selectedTrips.reduce((sum, b) => sum + Number(b.tollParking || 0), 0);
  const isGst = Boolean(customer?.gstin || business.gstin);
  const cgstAmount = isGst ? Math.round(totalTaxable * 0.025) : 0;
  const sgstAmount = isGst ? Math.round(totalTaxable * 0.025) : 0;
  const grandTotal = Math.round(totalTaxable + cgstAmount + sgstAmount + totalTolls);

  const toggleSelectTrip = (id) => {
    setSelectedBookingIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBookingIds.length === customerBookings.length) {
      setSelectedBookingIds([]);
    } else {
      setSelectedBookingIds(customerBookings.map(b => b.id));
    }
  };

  const handleSaveInvoiceRecord = () => {
    if (selectedBookingIds.length === 0) {
      alert("Please select at least one trip to generate the corporate invoice.");
      return null;
    }
    const saved = saveCorporateInvoice({
      invoiceNumber,
      customerId: customer?.id,
      customerName: customer?.name,
      billingPeriod,
      bookingIds: selectedBookingIds,
      taxableAmount: totalTaxable,
      gstAmount: cgstAmount + sgstAmount,
      totalAmount: grandTotal,
      status: 'Issued',
      notes: `Consolidated B2B tax invoice for ${customer?.name}`
    });
    setIsSaved(true);
    return saved;
  };

  const handlePrint = () => {
    if (!isSaved) handleSaveInvoiceRecord();
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!isSaved) handleSaveInvoiceRecord();
    let text = `*CONSOLIDATED CORPORATE TAX INVOICE*\n`;
    text += `*${business.name}*\n`;
    text += `Invoice No: ${invoiceNumber}\n`;
    text += `Client: ${customer.name}\n`;
    text += `Billing Period: ${billingPeriod}\n`;
    text += `Total Duties Billed: ${selectedTrips.length} Trips\n\n`;
    text += `*Summary of Charges:*\n`;
    text += `Taxable Amount: ${formatCurrency(totalTaxable)}\n`;
    if (isGst) {
      text += `CGST (2.5%): ${formatCurrency(cgstAmount)}\n`;
      text += `SGST (2.5%): ${formatCurrency(sgstAmount)}\n`;
    }
    text += `Tolls & Parking: ${formatCurrency(totalTolls)}\n`;
    text += `*GRAND TOTAL: ${formatCurrency(grandTotal)}*\n\n`;
    text += `Please process NEFT/RTGS payment to:\n`;
    text += `Bank: ${business.bankName || 'Bank of Maharashtra'} | A/C: ${business.bankAccount || 'Current A/C'} | IFSC: ${business.bankIfsc || 'MAHB0000123'}\n`;
    text += `UPI: ${business.upiId || 'office@upi'}\n\n`;
    text += `Thank you for your business!`;

    sendWhatsAppMessage(customer.phone, text);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3 print:p-0 print:bg-white">
      <div className="modal-card-center max-w-[540px] w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DFD3] overflow-hidden print:max-w-none print:shadow-none print:border-none print:rounded-none">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#E5DFD3] flex items-center justify-between bg-[#F8F6F0] shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-2xl bg-[#111827] text-[#D4F05B] flex items-center justify-center font-black text-xs">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                Corporate B2B Monthly Invoicing
              </h3>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                {customer?.name} • {selectedTrips.length} Trips Selected
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

        {/* Printable & Interactive Content Area */}
        <div ref={invoiceRef} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] smooth-scroll-container">
          {/* Trip Selector Strip (Hidden on print) */}
          <div className="bg-[#F8F6F0] p-3 rounded-2xl border border-[#E5DFD3] space-y-2 print:hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#111827]">
                Select Trips for this Statement:
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[10px] font-bold text-blue-700 hover:underline"
              >
                {selectedBookingIds.length === customerBookings.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-28 overflow-y-auto space-y-1.5 no-scrollbar">
              {customerBookings.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic">No completed trips found for this customer.</p>
              ) : (
                customerBookings.map(b => {
                  const isChecked = selectedBookingIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleSelectTrip(b.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition text-[11px] ${
                        isChecked ? 'bg-white border-[#111827]' : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-[#111827]" /> : <Square className="w-3.5 h-3.5 text-gray-400" />}
                        <span className="font-bold">{b.id}</span>
                        <span className="text-gray-500">({new Date(b.startDateTime).toLocaleDateString()})</span>
                        <span className="text-gray-700 truncate max-w-[140px]">{b.pickupLocation} ➔ {b.dropLocation}</span>
                      </div>
                      <span className="font-black text-[#111827]">{formatCurrency(b.totalFare)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Official Invoice Document Box */}
          <div className="border-2 border-gray-900 rounded-2xl p-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-900 pb-3">
              <div>
                <h2 className="text-base font-black text-gray-900 uppercase">
                  {business.name}
                </h2>
                <p className="text-[10px] text-gray-600 max-w-[240px]">{business.address}</p>
                <p className="text-[10px] text-gray-600 font-bold">GSTIN: {business.gstin || '27AABCS1429B1Z8'}</p>
                <p className="text-[10px] text-gray-600">Phone: {business.phone}</p>
              </div>

              <div className="text-right">
                <span className="bg-gray-900 text-white font-black text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  MASTER TAX INVOICE
                </span>
                <p className="text-xs font-black text-gray-900 mt-1">{invoiceNumber}</p>
                <p className="text-[10px] text-gray-600">Date: {invoiceDate}</p>
                <p className="text-[10px] text-gray-500 font-semibold">{billingPeriod}</p>
              </div>
            </div>

            {/* Billed To */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <span className="text-[9px] font-black text-gray-500 uppercase block">BILLED TO (CLIENT)</span>
              <h4 className="text-xs font-black text-gray-900">{customer?.name}</h4>
              {customer?.gstin && (
                <p className="text-[10px] text-gray-700 font-bold">Client GSTIN: <span className="font-mono">{customer.gstin}</span></p>
              )}
              <p className="text-[10px] text-gray-600">{customer?.address || 'Maharashtra, India'}</p>
              <p className="text-[10px] text-gray-600">Contact: {customer?.phone}</p>
            </div>

            {/* Itemized Trips Table */}
            <div>
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-900 text-gray-900 font-black">
                    <th className="py-1">Duty #</th>
                    <th className="py-1">Date</th>
                    <th className="py-1">Car</th>
                    <th className="py-1">Route / Description</th>
                    <th className="py-1 text-right">Toll</th>
                    <th className="py-1 text-right">Fare (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedTrips.map((b, idx) => (
                    <tr key={b.id}>
                      <td className="py-1 font-bold text-gray-900">{b.id}</td>
                      <td className="py-1 text-gray-600">{new Date(b.startDateTime).toLocaleDateString('en-GB')}</td>
                      <td className="py-1 text-gray-700 font-semibold">{b.vehiclePlate}</td>
                      <td className="py-1 text-gray-800">{b.pickupLocation} ➔ {b.dropLocation} ({b.tripType})</td>
                      <td className="py-1 text-right text-gray-600">{b.tollParking ? `₹${b.tollParking}` : '-'}</td>
                      <td className="py-1 text-right font-black text-gray-900">{formatCurrency(b.totalFare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="border-t-2 border-gray-900 pt-2 flex justify-between items-start">
              <div className="text-[9px] text-gray-500 space-y-0.5">
                <p>HSN / SAC Code: 9966 (Passenger Transport)</p>
                <p>Bank: {business.bankName || 'Bank'} | A/C: {business.bankAccount || 'Current A/C'}</p>
                <p>IFSC: {business.bankIfsc || 'MAHB0000123'} | UPI: {business.upiId || 'office@upi'}</p>
              </div>

              <div className="w-48 text-right text-[11px] space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Taxable Value:</span>
                  <span className="font-bold">{formatCurrency(totalTaxable)}</span>
                </div>
                {isGst && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST (2.5%):</span>
                      <span className="font-bold">{formatCurrency(cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST (2.5%):</span>
                      <span className="font-bold">{formatCurrency(sgstAmount)}</span>
                    </div>
                  </>
                )}
                {totalTolls > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tolls & Parking:</span>
                    <span className="font-bold">{formatCurrency(totalTolls)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 font-black text-sm pt-1 border-t border-gray-900">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-[#E5DFD3] bg-[#F8F6F0] flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-2xl bg-white border border-[#E5DFD3] text-[#111827] text-xs font-black flex items-center gap-1.5 hover:bg-gray-100 tap-active shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleSaveInvoiceRecord}
              disabled={isSaved}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 tap-active shadow-xs cursor-pointer ${
                isSaved
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-[#111827] text-white hover:bg-black'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-[#D4F05B]" />
              <span>{isSaved ? 'Saved to DB' : 'Save Invoice'}</span>
            </button>
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2 rounded-2xl bg-[#25D366] text-white text-xs font-black flex items-center gap-1.5 hover:bg-[#20bd5a] tap-active shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share WhatsApp</span>
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
