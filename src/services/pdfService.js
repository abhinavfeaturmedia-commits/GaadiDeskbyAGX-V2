import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * GaadiDesk Native PDF & Printable Document Service
 * Generates standards-compliant PDF 1.4 documents client-side with ZERO external dependencies.
 * Designed for ultra-fast, memory-efficient execution on 2GB RAM budget Android devices.
 */

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' && result.includes(',')
        ? result.split(',')[1]
        : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper to escape PDF text string literals
function escapePdfText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generate a valid PDF-1.4 vector document for a booking invoice
 * @param {Object} booking 
 * @param {Object} business 
 * @returns {Blob} application/pdf Blob
 */
export function buildInvoicePdfBlob(booking, business = {}) {
  const isGst = Boolean(business?.gstin && booking.gstEnabled !== false);
  const gstRate = Number(booking.gstPercent || 5);
  const halfGstRate = gstRate / 2;

  const totalFare = Number(booking.totalFare || 0);
  const tollParking = Number(booking.tollParking || 0);
  const taxableAmount = booking.taxableAmount !== undefined && booking.taxableAmount !== null
    ? Number(booking.taxableAmount)
    : Math.round((totalFare - tollParking) / (1 + (isGst ? gstRate / 100 : 0)));
  
  const cgstAmount = isGst ? Math.round(taxableAmount * (halfGstRate / 100)) : 0;
  const sgstAmount = isGst ? Math.round(taxableAmount * (halfGstRate / 100)) : 0;
  const advancePaid = Number(booking.advancePaid || 0);
  const balancePending = Number(booking.balancePending || Math.max(0, totalFare - advancePaid));

  const invoiceNo = booking.invoiceNumber || booking.id || 'INV-001';
  const invoiceDate = booking.invoiceDate || new Date().toISOString().slice(0, 10);
  const bizName = business?.name || 'Commercial Fleet Services';
  const bizPhone = business?.phone || '';
  const bizGstin = business?.gstin || '';
  const bizAddress = business?.address || business?.city || 'India';
  const custName = booking.customerName || 'Valued Customer';
  const custPhone = booking.customerPhone || '';
  const custGstin = booking.customerGstin || '';

  // Stream drawing commands
  const cmds = [];

  // Page coordinates: (0, 0) is bottom-left, (595.28, 841.89) is top-right (A4 standard)
  // Header background bar (Dark slate)
  cmds.push('0.07 0.09 0.15 rg'); // #121726
  cmds.push('36 765 523 48 re f');

  // Business Name & TAX INVOICE title in header
  cmds.push('1 1 1 rg'); // White text
  cmds.push('BT /F2 16 Tf 48 782 Td (' + escapePdfText(bizName.toUpperCase()) + ') Tj ET');
  cmds.push('0.83 0.94 0.36 rg'); // #D4F05B Lime accent
  cmds.push('BT /F2 11 Tf 460 782 Td (TAX INVOICE) Tj ET');

  // Business Meta details
  cmds.push('0.2 0.25 0.33 rg');
  let topY = 745;
  cmds.push('BT /F1 9 Tf 48 ' + topY + ' Td (Address: ' + escapePdfText(bizAddress) + ') Tj ET');
  topY -= 12;
  cmds.push('BT /F1 9 Tf 48 ' + topY + ' Td (Phone: ' + escapePdfText(bizPhone) + ') Tj ET');
  if (bizGstin) {
    topY -= 12;
    cmds.push('BT /F2 9 Tf 48 ' + topY + ' Td (GSTIN: ' + escapePdfText(bizGstin) + ') Tj ET');
  }

  // Invoice & Date box on right
  let invBoxY = 745;
  cmds.push('BT /F2 9 Tf 390 ' + invBoxY + ' Td (Invoice No: ' + escapePdfText(invoiceNo) + ') Tj ET');
  invBoxY -= 12;
  cmds.push('BT /F1 9 Tf 390 ' + invBoxY + ' Td (Date: ' + escapePdfText(invoiceDate) + ') Tj ET');
  invBoxY -= 12;
  cmds.push('BT /F1 9 Tf 390 ' + invBoxY + ' Td (SAC Code: 9966 / Passenger Transport) Tj ET');

  // Divider line
  cmds.push('0.85 0.85 0.85 RG 1 w');
  cmds.push('36 695 m 559 695 l S');

  // Billed To / Customer Section
  cmds.push('0.07 0.09 0.15 rg');
  cmds.push('BT /F2 10 Tf 48 680 Td (BILLED TO:) Tj ET');
  cmds.push('0.2 0.25 0.33 rg');
  cmds.push('BT /F2 10 Tf 48 666 Td (' + escapePdfText(custName) + ') Tj ET');
  cmds.push('BT /F1 9 Tf 48 653 Td (Phone: ' + escapePdfText(custPhone) + ') Tj ET');
  if (custGstin) {
    cmds.push('BT /F2 9 Tf 48 640 Td (Customer GSTIN: ' + escapePdfText(custGstin) + ') Tj ET');
  }

  // Trip Summary Box
  cmds.push('0.96 0.96 0.97 rg 360 635 199 55 re f');
  cmds.push('0.85 0.85 0.85 RG 1 w 360 635 199 55 re S');
  cmds.push('0.07 0.09 0.15 rg');
  cmds.push('BT /F2 9 Tf 370 675 Td (TRIP PARTICULARS) Tj ET');
  cmds.push('0.3 0.35 0.4 rg');
  cmds.push('BT /F1 8.5 Tf 370 662 Td (Route: ' + escapePdfText(booking.pickupLocation || '') + ' - ' + escapePdfText(booking.dropLocation || '') + ') Tj ET');
  cmds.push('BT /F1 8.5 Tf 370 649 Td (Vehicle: ' + escapePdfText(booking.vehiclePlate || 'Cab') + ' | ' + escapePdfText(booking.tripType || 'Trip') + ') Tj ET');

  // Table Header
  const tableY = 605;
  cmds.push('0.94 0.95 0.96 rg 36 ' + tableY + ' 523 20 re f');
  cmds.push('0.8 0.82 0.85 RG 1 w 36 ' + tableY + ' 523 20 re S');
  cmds.push('0.07 0.09 0.15 rg');
  cmds.push('BT /F2 9 Tf 46 ' + (tableY + 6) + ' Td (SL) Tj ET');
  cmds.push('BT /F2 9 Tf 75 ' + (tableY + 6) + ' Td (DESCRIPTION & HSN/SAC) Tj ET');
  cmds.push('BT /F2 9 Tf 360 ' + (tableY + 6) + ' Td (RATE/DETAILS) Tj ET');
  cmds.push('BT /F2 9 Tf 490 ' + (tableY + 6) + ' Td (AMOUNT INR) Tj ET');

  // Table Rows
  let curY = tableY - 24;
  const items = [
    {
      sl: '1',
      desc: 'Passenger Road Transport (' + (booking.tripType || 'Commercial Taxi Service') + ') - SAC 9966',
      details: `${booking.daysCount || 1} Day(s) / ${booking.estimatedKm || booking.actualKm || 0} KM`,
      amount: taxableAmount
    }
  ];

  if (tollParking > 0) {
    items.push({
      sl: '2',
      desc: 'Tolls, State Border Taxes & Parking Charges (At Actuals)',
      details: 'Highway Passes',
      amount: tollParking
    });
  }

  items.forEach(item => {
    cmds.push('0.88 0.9 0.92 RG 0.5 w 36 ' + curY + ' m 559 ' + curY + ' l S');
    cmds.push('0.2 0.25 0.33 rg');
    cmds.push('BT /F1 9 Tf 46 ' + (curY + 6) + ' Td (' + item.sl + ') Tj ET');
    cmds.push('BT /F1 9 Tf 75 ' + (curY + 6) + ' Td (' + escapePdfText(item.desc) + ') Tj ET');
    cmds.push('BT /F1 9 Tf 360 ' + (curY + 6) + ' Td (' + escapePdfText(item.details) + ') Tj ET');
    cmds.push('BT /F2 9 Tf 490 ' + (curY + 6) + ' Td (' + item.amount.toLocaleString('en-IN') + '.00) Tj ET');
    curY -= 22;
  });

  // Bottom Totals & GST Section
  cmds.push('0.85 0.85 0.85 RG 1 w 36 ' + curY + ' m 559 ' + curY + ' l S');
  curY -= 8;

  // Left Bank info box
  cmds.push('0.97 0.97 0.98 rg 36 ' + (curY - 95) + ' 270 95 re f');
  cmds.push('0.85 0.85 0.85 RG 0.8 w 36 ' + (curY - 95) + ' 270 95 re S');
  cmds.push('0.07 0.09 0.15 rg');
  cmds.push('BT /F2 8.5 Tf 46 ' + (curY - 14) + ' Td (BANK / UPI PAYMENT DETAILS) Tj ET');
  cmds.push('0.3 0.35 0.4 rg');
  cmds.push('BT /F1 8 Tf 46 ' + (curY - 28) + ' Td (Bank: ' + escapePdfText(business?.bankName || 'HDFC Bank') + ') Tj ET');
  cmds.push('BT /F1 8 Tf 46 ' + (curY - 40) + ' Td (Account: ' + escapePdfText(business?.bankAccount || '50200012345678') + ') Tj ET');
  cmds.push('BT /F1 8 Tf 46 ' + (curY - 52) + ' Td (IFSC: ' + escapePdfText(business?.bankIfsc || 'HDFC0001234') + ') Tj ET');
  cmds.push('BT /F2 8 Tf 46 ' + (curY - 66) + ' Td (UPI ID: ' + escapePdfText(business?.upiId || 'office@upi') + ') Tj ET');
  cmds.push('BT /F1 7.5 Tf 46 ' + (curY - 80) + ' Td (Instant reconciliation enabled via QR / UPI) Tj ET');

  // Right Totals Table
  const totRightX = 350;
  const totValX = 490;
  let totY = curY - 10;

  cmds.push('0.3 0.35 0.4 rg');
  cmds.push('BT /F1 9 Tf ' + totRightX + ' ' + totY + ' Td (Taxable Value:) Tj ET');
  cmds.push('BT /F1 9 Tf ' + totValX + ' ' + totY + ' Td (INR ' + taxableAmount.toLocaleString('en-IN') + '.00) Tj ET');
  totY -= 14;

  if (isGst) {
    cmds.push('BT /F1 8.5 Tf ' + totRightX + ' ' + totY + ' Td (CGST @ ' + halfGstRate + '%:) Tj ET');
    cmds.push('BT /F1 8.5 Tf ' + totValX + ' ' + totY + ' Td (INR ' + cgstAmount.toLocaleString('en-IN') + '.00) Tj ET');
    totY -= 14;

    cmds.push('BT /F1 8.5 Tf ' + totRightX + ' ' + totY + ' Td (SGST @ ' + halfGstRate + '%:) Tj ET');
    cmds.push('BT /F1 8.5 Tf ' + totValX + ' ' + totY + ' Td (INR ' + sgstAmount.toLocaleString('en-IN') + '.00) Tj ET');
    totY -= 14;
  }

  if (tollParking > 0) {
    cmds.push('BT /F1 8.5 Tf ' + totRightX + ' ' + totY + ' Td (Toll & Parking:) Tj ET');
    cmds.push('BT /F1 8.5 Tf ' + totValX + ' ' + totY + ' Td (INR ' + tollParking.toLocaleString('en-IN') + '.00) Tj ET');
    totY -= 14;
  }

  // Grand Total Highlight
  cmds.push('0.07 0.09 0.15 rg ' + (totRightX - 6) + ' ' + (totY - 5) + ' 215 22 re f');
  cmds.push('1 1 1 rg');
  cmds.push('BT /F2 10 Tf ' + totRightX + ' ' + (totY + 1) + ' Td (GRAND TOTAL:) Tj ET');
  cmds.push('0.83 0.94 0.36 rg');
  cmds.push('BT /F2 10 Tf ' + totValX + ' ' + (totY + 1) + ' Td (INR ' + totalFare.toLocaleString('en-IN') + '.00) Tj ET');
  totY -= 24;

  // Advance and Balance
  cmds.push('0.2 0.5 0.2 rg');
  cmds.push('BT /F1 9 Tf ' + totRightX + ' ' + totY + ' Td (Advance Received:) Tj ET');
  cmds.push('BT /F1 9 Tf ' + totValX + ' ' + totY + ' Td (INR ' + advancePaid.toLocaleString('en-IN') + '.00) Tj ET');
  totY -= 14;

  cmds.push('0.8 0.1 0.1 rg');
  cmds.push('BT /F2 9.5 Tf ' + totRightX + ' ' + totY + ' Td (BALANCE DUE:) Tj ET');
  cmds.push('BT /F2 9.5 Tf ' + totValX + ' ' + totY + ' Td (INR ' + balancePending.toLocaleString('en-IN') + '.00) Tj ET');

  // Terms & Authorized Signatory Footer
  const footerY = 440;
  cmds.push('0.85 0.85 0.85 RG 0.5 w 36 ' + footerY + ' m 559 ' + footerY + ' l S');
  cmds.push('0.5 0.55 0.6 rg');
  cmds.push('BT /F1 7.5 Tf 46 ' + (footerY - 14) + ' Td (Terms: Standard commercial cab operator terms apply. Computer generated tax invoice under GST SAC 9966.) Tj ET');
  cmds.push('BT /F2 8 Tf 420 ' + (footerY - 14) + ' Td (For ' + escapePdfText(bizName) + ') Tj ET');
  cmds.push('BT /F1 7.5 Tf 420 ' + (footerY - 40) + ' Td (Authorized Signatory / Digital Record) Tj ET');

  const contentStream = cmds.join('\n');
  const streamLength = contentStream.length;

  // Build PDF Objects
  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');
  objects.push('6 0 obj\n<< /Length ' + streamLength + ' >>\nstream\n' + contentStream + '\nendstream\nendobj\n');

  let body = '%PDF-1.4\n';
  const offsets = [0]; // 0th is dummy

  for (let i = 0; i < objects.length; i++) {
    offsets.push(body.length);
    body += objects[i];
  }

  const xrefOffset = body.length;
  body += 'xref\n';
  body += '0 ' + (objects.length + 1) + '\n';
  body += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    body += offStr + ' 00000 n \n';
  }

  body += 'trailer\n';
  body += '<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\n';
  body += 'startxref\n' + xrefOffset + '\n%%EOF\n';

  return new Blob([body], { type: 'application/pdf' });
}

/**
 * Triggers a direct, native client-side PDF download or Android Native Share
 * @param {Object} booking 
 * @param {Object} business 
 */
export async function downloadInvoicePdf(booking, business = {}) {
  try {
    const blob = buildInvoicePdfBlob(booking, business);
    const invoiceNum = (booking.invoiceNumber || booking.id || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Invoice_${invoiceNum}.pdf`;

    // 1. If running in native Android Capacitor container
    if (Capacitor.isNativePlatform()) {
      const base64Data = await blobToBase64(blob);
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      // Launch native Android Share Sheet directly with the created PDF file
      await Share.share({
        title: `Invoice ${invoiceNum}`,
        text: `Tax Invoice ${invoiceNum} from ${business?.name || 'Commercial Fleet Services'}`,
        url: savedFile.uri,
        dialogTitle: 'Share Tax Invoice PDF'
      });
      return true;
    }

    // 2. Desktop Web / Mobile Browser fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error('[pdfService] PDF generation or native share failed:', err);
    return false;
  }
}

/**
 * Directly share the PDF document via Native Android Share Sheet
 * @param {Object} booking 
 * @param {Object} business 
 */
export async function shareInvoicePdf(booking, business = {}) {
  return downloadInvoicePdf(booking, business);
}

/**
 * Prints the invoice using an off-screen iframe to trigger Android/system print-to-PDF
 * without including any application shell or buttons.
 * @param {HTMLElement} invoiceElement 
 * @param {string} invoiceNumber 
 */
export function printInvoiceDocument(invoiceElement, invoiceNumber = 'INV') {
  if (!invoiceElement) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${invoiceNumber}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; background: #fff; margin: 0; padding: 0; font-size: 12px; line-height: 1.4; }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        ${invoiceElement.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 250);
}
