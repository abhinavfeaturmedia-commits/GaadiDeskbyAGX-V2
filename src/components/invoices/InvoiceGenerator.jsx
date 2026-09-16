import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { modalStack } from '../../services/modalStack';
import { sendWhatsAppMessage } from '../../services/sharingService';
import {
  X,
  Printer,
  Share2,
  FileText,
  CheckCircle,
  Download,
  Building,
  Phone,
  Calendar,
  CreditCard
} from 'lucide-react';
import { downloadInvoicePdf, printInvoiceDocument } from '../../services/pdfService';

export const InvoiceGenerator = ({ booking, onClose }) => {
  const { business, formatCurrency, setWhatsAppData } = useApp();

  // Register with modalStack for Android Back Button
  useEffect(() => {
    modalStack.push('invoice_generator', onClose);
    return () => {
      modalStack.remove('invoice_generator');
    };
  }, [onClose]);
  const { showToast } = useToast();
  const invoiceRef = useRef();

  if (!booking) return null;

  const packageKm = Number(booking.estimatedKm || booking.billableKm || (Number(booking.daysCount || 1) * (booking.minKmPerDay || 250)));
  const ratePerKm = Number(booking.ratePerKm || 14);
  const basePackageFare = booking.tripType === 'Outstation'
    ? (Number(booking.baseFare) && Number(booking.baseFare) >= (packageKm * ratePerKm * 0.8) ? Number(booking.baseFare) : (packageKm * ratePerKm))
    : Number(booking.baseFare || 0);

  const isGst = booking.gstEnabled !== false && Boolean(business.gstin);
  const gstRate = Number(booking.gstPercent || 5);
  const halfGstRate = gstRate / 2;
  const taxableAmount = booking.taxableAmount !== undefined && booking.taxableAmount !== null
    ? Number(booking.taxableAmount)
    : Math.round((Number(booking.totalFare || 0) - Number(booking.tollParking || 0)) / (1 + (isGst ? gstRate / 100 : 0)));
  const cgstAmount = isGst ? Math.round(taxableAmount * (halfGstRate / 100)) : 0;
  const sgstAmount = isGst ? Math.round(taxableAmount * (halfGstRate / 100)) : 0;
  const totalAmount = booking.totalFare;

  const handlePrint = () => {
    try {
      if (invoiceRef.current) {
        printInvoiceDocument(invoiceRef.current, booking.invoiceNumber || booking.id);
      } else {
        window.print();
      }
    } catch {
      handleDownloadInvoice();
    }
  };

  const handleDownloadInvoice = async () => {
    const success = await downloadInvoicePdf(booking, business);
    if (success) {
      showToast("PDF Invoice ready & shared!", "success");
    } else {
      showToast("Failed to generate PDF invoice", "error");
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*TAX INVOICE - ${business.name}*\n` +
      `Invoice No: ${booking.invoiceNumber || booking.id}\n` +
      `Customer: ${booking.customerName}\n` +
      `Vehicle: ${booking.vehiclePlate}\n` +
      `Trip: ${booking.pickupLocation} ➔ ${booking.dropLocation}\n` +
      `Dates: ${new Date(booking.startDateTime).toLocaleDateString()} to ${new Date(booking.endDateTime).toLocaleDateString()}\n` +
      `Taxable Value: ${formatCurrency(taxableAmount)}\n` +
      (isGst ? `CGST (${halfGstRate}%): ${formatCurrency(cgstAmount)}\nSGST (${halfGstRate}%): ${formatCurrency(sgstAmount)}\n` : '') +
      (booking.tollParking > 0 ? `Toll & Parking: ${formatCurrency(booking.tollParking)}\n` : '') +
      `*Total Amount: ${formatCurrency(totalAmount)}*\n` +
      `Advance Paid: ${formatCurrency(booking.advancePaid || 0)}\n` +
      `*Balance Due: ${formatCurrency(booking.balancePending || 0)}*\n\n` +
      `Bank: ${business.bankName || 'HDFC Bank'} | A/C: ${business.bankAccount || '50200012345678'} | IFSC: ${business.bankIfsc || 'HDFC0001234'}\n` +
      `UPI: ${business.upiId || 'office@upi'}\n\n` +
      `Thank you for traveling with ${business.name || 'us'}!`;

    sendWhatsAppMessage(booking.customerPhone, text);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3 print:p-0 print:bg-white">
      <div className="modal-card-center max-w-[430px] w-full max-h-[92vh] flex flex-col shadow-2xl border border-card-border overflow-hidden print:max-w-none print:shadow-none print:border-none print:rounded-none">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-card-border flex items-center justify-between bg-[#FBF8F2] shrink-0 print:hidden">
          <div className="flex items-center space-x-2.5">
            <img src="/gaadidesk_logo.png" alt="GaadiDesk" className="w-6 h-6 rounded-lg object-cover shadow-xs" />
            <h3 className="text-sm font-extrabold text-[#1E232A]">
              {isGst ? 'GST Tax Invoice' : 'Trip Duty Slip & Bill'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Invoice Body */}
        <div ref={invoiceRef} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 text-xs text-gray-800 smooth-scroll-container">
          {/* Business Header */}
          <div className="border-b-2 border-gray-900 pb-3 space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base font-extrabold text-[#1E232A] uppercase">
                  {business.name}
                </h2>
                <p className="text-[10px] text-gray-600 max-w-[220px]">
                  {business.address}
                </p>
                <p className="text-[10px] text-gray-600">
                  Phone: {business.phone} • WhatsApp: {business.whatsapp}
                </p>
              </div>
              <div className="text-right">
                <span className="bg-gray-900 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  {isGst ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
                </span>
                <p className="text-[11px] font-bold text-gray-900 mt-1">
                  {booking.invoiceNumber || 'GD/2026-27/0101'}
                </p>
                <p className="text-[10px] text-gray-500">
                  Date: {new Date().toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            {business.gstin && (
              <p className="text-[11px] font-extrabold text-gray-900 pt-1">
                GSTIN: <span className="font-mono">{business.gstin}</span> (State: Maharashtra - 27)
              </p>
            )}
          </div>

          {/* Customer & Trip Details Box */}
          <div className="bg-[#FBF8F2] rounded-2xl p-3 border border-card-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-text-secondary uppercase font-bold block">Billed To:</span>
                <p className="font-extrabold text-gray-900 text-xs">{booking.customerName}</p>
                <p className="text-[10px] text-gray-600">{booking.customerPhone}</p>
                {booking.customerGstin && (
                  <p className="text-[10px] font-mono font-bold text-gray-800">GST: {booking.customerGstin}</p>
                )}
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase font-bold block">Vehicle & Driver:</span>
                <p className="font-bold text-gray-900 text-[11px]">{booking.vehiclePlate}</p>
                <p className="text-[10px] text-gray-600">Driver: {booking.driverName || 'Santosh More'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-card-border text-[11px]">
              <p className="font-semibold text-gray-800">
                Route: <span className="font-normal">{booking.pickupLocation} ➔ {booking.dropLocation}</span>
              </p>
              <p className="text-[10px] text-gray-600">
                Period: {new Date(booking.startDateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} to {new Date(booking.endDateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-gray-300 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-[10px] font-extrabold uppercase text-gray-700">
                <tr>
                  <th className="p-2 border-b border-gray-300">Description</th>
                  <th className="p-2 border-b border-gray-300">SAC</th>
                  <th className="p-2 border-b border-gray-300 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                <tr>
                  <td className="p-2">
                    <p className="font-bold">
                      {booking.tripType} Cab / Rental Service {booking.tripType === 'Outstation' ? `(${packageKm} KM Package)` : ''}
                    </p>
                    <p className="text-[10px] text-gray-500">Base package & hire charges</p>
                  </td>
                  <td className="p-2 font-mono text-[10px]">9966</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(basePackageFare)}</td>
                </tr>

                {Number(booking.extraKmCharges) > 0 && (
                  <tr>
                    <td className="p-2">
                      <p className="font-bold">Extra Distance Run</p>
                      <p className="text-[10px] text-gray-500">Beyond package allowance</p>
                    </td>
                    <td className="p-2 font-mono text-[10px]">9966</td>
                    <td className="p-2 text-right">{formatCurrency(booking.extraKmCharges)}</td>
                  </tr>
                )}

                {Number(booking.extraHoursCharges) > 0 && (
                  <tr>
                    <td className="p-2">
                      <p className="font-bold">Extra Hours / Overtime</p>
                      <p className="text-[10px] text-gray-500">{booking.extraHours} extra duty hours</p>
                    </td>
                    <td className="p-2 font-mono text-[10px]">9966</td>
                    <td className="p-2 text-right">{formatCurrency(booking.extraHoursCharges)}</td>
                  </tr>
                )}

                {Number(booking.driverBata) > 0 && (
                  <tr>
                    <td className="p-2">Driver Bata / Allowance</td>
                    <td className="p-2 font-mono text-[10px]">9966</td>
                    <td className="p-2 text-right">{formatCurrency(booking.driverBata)}</td>
                  </tr>
                )}

                {Number(booking.nightHalt) > 0 && (
                  <tr>
                    <td className="p-2">Night Halt Charge</td>
                    <td className="p-2 font-mono text-[10px]">9966</td>
                    <td className="p-2 text-right">{formatCurrency(booking.nightHalt)}</td>
                  </tr>
                )}

                {Number(booking.tollParking) > 0 && (
                  <tr>
                    <td className="p-2">Toll & Parking Reimbursable</td>
                    <td className="p-2 font-mono text-[10px]">9966</td>
                    <td className="p-2 text-right">{formatCurrency(booking.tollParking)}</td>
                  </tr>
                )}

                {Number(booking.discount) > 0 && (
                  <tr className="text-green-700">
                    <td className="p-2">Special Discount</td>
                    <td className="p-2 font-mono text-[10px]">9966</td>
                    <td className="p-2 text-right">-{formatCurrency(booking.discount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Calculation */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-600">Taxable Value:</span>
              <span className="font-bold">{formatCurrency(taxableAmount)}</span>
            </div>

            {isGst && (
              <>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">CGST @ {halfGstRate}%:</span>
                  <span className="font-bold">{formatCurrency(cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">SGST @ {halfGstRate}%:</span>
                  <span className="font-bold">{formatCurrency(sgstAmount)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t-2 border-gray-900">
              <span>Grand Total:</span>
              <span className="text-accent-amber">{formatCurrency(totalAmount)}</span>
            </div>

            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Advance Paid:</span>
              <span className="text-green-700">{formatCurrency(booking.advancePaid || 0)}</span>
            </div>

            <div className="flex justify-between text-xs font-extrabold text-red-700 pt-1 border-t border-dashed border-gray-300">
              <span>Balance Payable:</span>
              <span>{formatCurrency(booking.balancePending || 0)}</span>
            </div>
          </div>

          {/* Terms & Signatures */}
          <div className="pt-3 border-t border-gray-200 text-[9px] text-gray-500 space-y-1">
            <p>1. Toll, parking and state entry tax as per actual receipts.</p>
            <p>2. Subject to {business.city || 'Pune'} jurisdiction.</p>
            
            <div className="flex justify-between items-end pt-3">
              <div>
                <p className="font-bold text-gray-800">For {business.name}</p>
                <p className="text-[8px]">Authorized Fleet Signatory</p>
              </div>

              <div className="text-right flex flex-col items-end">
                {booking.customerSignature ? (
                  <div className="space-y-0.5">
                    <img
                      src={booking.customerSignature}
                      alt="Customer Signature"
                      className="h-9 max-w-[100px] object-contain border-b border-gray-800"
                    />
                    <p className="text-[8px] font-bold text-gray-800">Customer Digital Sign</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-24 border-b border-gray-400 mb-1"></div>
                    <p className="text-[8px]">Customer Signature</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Powered by GaadiDesk Watermark Stamp */}
          <div className="pt-2.5 mt-2 border-t border-gray-100 flex items-center justify-between text-[8px] text-gray-400">
            <div className="flex items-center space-x-1">
              <img src="/gaadidesk_logo.png" alt="GaadiDesk" className="w-3.5 h-3.5 rounded-sm object-cover opacity-75" />
              <span>Generated via <b>GaadiDesk by AGX</b> • Indian Fleet OS</span>
            </div>
            <span>Verified Computer Generated Bill</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="px-5 py-3 border-t border-card-border bg-[#FBF8F2] flex items-center space-x-2 shrink-0 print:hidden">
          <button
            onClick={handleDownloadInvoice}
            className="flex-1 py-2 rounded-full border border-card-border bg-white text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 tap-active shadow-xs cursor-pointer"
            title="Download PDF invoice file"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2 rounded-full border border-card-border bg-white text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 tap-active shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md hover:bg-emerald-700 tap-active cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
