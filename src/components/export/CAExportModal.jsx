import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Building,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Receipt
} from 'lucide-react';

export const CAExportModal = ({ onClose }) => {
  const { business, bookings, expenses, customers, formatCurrency } = useApp();

  const [activeExportType, setActiveExportType] = useState('gstr1'); // 'gstr1' | 'expenses' | 'customers'
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  // 1. Generate GSTR-1 Sales Register CSV
  const generateGstr1Csv = () => {
    const headers = [
      "Invoice Number",
      "Invoice Date",
      "Customer Name",
      "Customer GSTIN",
      "Trip Type",
      "Route",
      "Vehicle Plate",
      "Taxable Value (INR)",
      "CGST (2.5% INR)",
      "SGST (2.5% INR)",
      "Tolls & Parking (INR)",
      "Total Invoice Value (INR)",
      "Payment Status",
      "Payment Mode"
    ];

    const billableBookings = bookings.filter(b => 
      (b.status === 'Completed' || Boolean(b.invoiceNumber)) && 
      b.status !== 'Cancelled' && 
      b.status !== 'Enquiry'
    );

    const rows = billableBookings.map(b => {
      const isGst = b.gstEnabled !== false;
      const rate = Number(b.gstPercent || 5);
      const halfRate = (rate / 2) / 100;
      const taxable = b.taxableAmount !== undefined && b.taxableAmount !== null
        ? Number(b.taxableAmount)
        : Math.round((Number(b.totalFare || 0) - Number(b.tollParking || 0)) / (1 + rate / 100));
      const cgst = isGst ? Math.round(taxable * halfRate) : 0;
      const sgst = isGst ? Math.round(taxable * halfRate) : 0;
      const toll = Number(b.tollParking || 0);
      const total = b.totalFare;
      const date = (b.startDateTime || b.createdAt || '').slice(0, 10);
      const cust = customers.find(c => c.id === b.customerId || c.name === b.customerName);

      return [
        `"${b.invoiceNumber || b.id}"`,
        `"${date}"`,
        `"${b.customerName || 'Direct Customer'}"`,
        `"${cust?.gstin || ''}"`,
        `"${b.tripType || 'Outstation'}"`,
        `"${b.pickupLocation || ''} to ${b.dropLocation || ''}"`,
        `"${b.vehiclePlate || ''}"`,
        taxable,
        cgst,
        sgst,
        toll,
        total,
        `"${Number(b.balancePending || 0) <= 0 ? 'Fully Paid' : 'Pending'}"`,
        `"${b.settlementPaymentMode || b.advanceMode || 'UPI'}"`
      ];
    });

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // 2. Generate Expense Vouchers CSV
  const generateExpensesCsv = () => {
    const headers = [
      "Voucher ID",
      "Expense Date",
      "Category",
      "Description / Particulars",
      "Vehicle Plate",
      "Amount (INR)",
      "Payment Mode",
      "Paid By"
    ];

    const rows = expenses.map(e => [
      `"${e.id}"`,
      `"${e.date || ''}"`,
      `"${e.category || 'General'}"`,
      `"${(e.description || e.notes || '').replace(/"/g, '""')}"`,
      `"${e.vehiclePlate || ''}"`,
      e.amount || 0,
      `"${e.paymentMode || 'Cash'}"`,
      `"${e.paidBy || 'Owner'}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // 3. Generate Customer Khata Receivables CSV
  const generateCustomerKhataCsv = () => {
    const headers = [
      "Customer ID",
      "Customer Name",
      "Phone",
      "Type",
      "GSTIN",
      "Total Completed Bookings",
      "Pending Receivables (INR)",
      "Address"
    ];

    const rows = customers.map(c => [
      `"${c.id}"`,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.type || 'Personal'}"`,
      `"${c.gstin || ''}"`,
      c.totalBookings || 0,
      c.pendingBalance || 0,
      `"${(c.address || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // Download Trigger Helper
  const downloadCsv = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportGstr1 = () => {
    const csv = generateGstr1Csv();
    downloadCsv(csv, `GSTR1_Sales_Register_${business.name.replace(/\s+/g, '_')}_FY2026-27.csv`);
  };

  const handleExportExpenses = () => {
    const csv = generateExpensesCsv();
    downloadCsv(csv, `Expense_Vouchers_Ledger_${business.name.replace(/\s+/g, '_')}_FY2026-27.csv`);
  };

  const handleExportCustomers = () => {
    const csv = generateCustomerKhataCsv();
    downloadCsv(csv, `Customer_Receivables_Khata_${business.name.replace(/\s+/g, '_')}.csv`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center max-w-[430px] w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E5DFD3] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#F8F6F0] shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                CA & Tally Audit Export
              </h3>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                Generate clean GST turnover & expense spreadsheets
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

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] smooth-scroll-container">
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-900 flex items-center gap-2 text-xs font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Downloaded: <b>{downloadSuccess}</b></span>
            </div>
          )}

          {/* Export Cards */}
          <div className="space-y-3">
            {/* 1. GSTR-1 Sales Card */}
            <div className="p-4 rounded-3xl bg-[#F8F6F0] border-2 border-[#E5DFD3] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white border border-[#E5DFD3] flex items-center justify-center font-black text-xs text-[#111827]">
                    1
                  </div>
                  <div>
                    <h4 className="font-black text-[#111827]">GSTR-1 Sales Register</h4>
                    <p className="text-[10px] text-[#4B5563] font-semibold">{bookings.length} Invoiced Duties • GST Breakdown</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-100 text-emerald-950 font-black px-2 py-0.5 rounded-full border border-emerald-300">
                  GSTR-1
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] font-medium leading-relaxed">
                Includes Invoice #, Taxable Value, CGST (2.5%), SGST (2.5%), Customer GSTIN, Place of Supply & Tolls.
              </p>
              <button
                onClick={handleExportGstr1}
                className="w-full py-2.5 rounded-2xl bg-[#111827] text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-black tap-active shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D4F05B]" />
                <span>Download GSTR-1 Excel / CSV</span>
              </button>
            </div>

            {/* 2. Expense Ledger Card */}
            <div className="p-4 rounded-3xl bg-[#F8F6F0] border-2 border-[#E5DFD3] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white border border-[#E5DFD3] flex items-center justify-center font-black text-xs text-[#111827]">
                    2
                  </div>
                  <div>
                    <h4 className="font-black text-[#111827]">Expense & Fuel Vouchers</h4>
                    <p className="text-[10px] text-[#4B5563] font-semibold">{expenses.length} Vouchers • Fuel, Workshop, Salaries</p>
                  </div>
                </div>
                <span className="text-[9px] bg-amber-100 text-amber-950 font-black px-2 py-0.5 rounded-full border border-amber-300">
                  EXPENSES
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] font-medium leading-relaxed">
                Itemized direct fleet expenses categorized for profit-and-loss tax deductible claims.
              </p>
              <button
                onClick={handleExportExpenses}
                className="w-full py-2.5 rounded-2xl bg-white border border-[#E5DFD3] text-[#111827] text-xs font-black flex items-center justify-center gap-2 hover:bg-gray-100 tap-active shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Expense Ledger CSV</span>
              </button>
            </div>

            {/* 3. Customer Khata Receivables Card */}
            <div className="p-4 rounded-3xl bg-[#F8F6F0] border-2 border-[#E5DFD3] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white border border-[#E5DFD3] flex items-center justify-center font-black text-xs text-[#111827]">
                    3
                  </div>
                  <div>
                    <h4 className="font-black text-[#111827]">Customer Receivables (Khata)</h4>
                    <p className="text-[10px] text-[#4B5563] font-semibold">{customers.length} Client Accounts • Outstanding Balances</p>
                  </div>
                </div>
                <span className="text-[9px] bg-blue-100 text-blue-950 font-black px-2 py-0.5 rounded-full border border-blue-300">
                  KHATA
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] font-medium leading-relaxed">
                Full list of corporate and personal customers with total trips taken and pending receivables balance.
              </p>
              <button
                onClick={handleExportCustomers}
                className="w-full py-2.5 rounded-2xl bg-white border border-[#E5DFD3] text-[#111827] text-xs font-black flex items-center justify-center gap-2 hover:bg-gray-100 tap-active shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Customer Khata CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5DFD3] bg-[#F8F6F0] text-center shrink-0">
          <p className="text-[10px] text-[#6B7280] font-semibold">
            Files are formatted for direct import into Microsoft Excel, Google Sheets, or TallyPrime.
          </p>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
