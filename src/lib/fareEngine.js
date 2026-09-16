/**
 * GaadiDesk Unified Fare & Tax Engine (SAC 9966 Compliant)
 * 
 * Single source of truth for:
 * - New Booking Wizard
 * - Trip Detail Modal
 * - Trip Settlement Modal
 * - Driver Active Duty View
 * - Invoices & Duty Slips
 * - WhatsApp Confirmations & Receipts
 */

/**
 * Calculates number of billing days and nights from start & end dates
 */
export const computeTripDaysAndNights = (startDateTime, endDateTime) => {
  if (!startDateTime || !endDateTime) {
    return { daysCount: 1, nightsCount: 0 };
  }
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return { daysCount: 1, nightsCount: 0 };
  }

  const diffMs = end.getTime() - start.getTime();
  const daysCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const nightsCount = Math.max(0, daysCount - 1);

  return { daysCount, nightsCount };
};

/**
 * Computes fare for a new or edited booking
 */
export const calculateBookingFare = (data = {}) => {
  const tripType = data.tripType || 'Outstation';
  const { daysCount, nightsCount } = computeTripDaysAndNights(data.startDateTime, data.endDateTime);
  const effectiveDays = Math.max(1, Number(data.daysCount || daysCount));

  let minKmPerDay = Number(data.minKmPerDay || 250);
  if (minKmPerDay <= 0) minKmPerDay = 250;

  const minPackageKm = effectiveDays * minKmPerDay;
  const rawEstimatedKm = Number(data.estimatedKm || 0);

  let billableKm = rawEstimatedKm;
  let baseFare = Number(data.baseFare || 0);
  const ratePerKm = Number(data.ratePerKm || 14);

  if (tripType === 'Outstation') {
    billableKm = Math.max(rawEstimatedKm, minPackageKm);
    baseFare = billableKm * ratePerKm;
  } else if (tripType === 'Rental') {
    const dailyRate = Number(data.dailyRate || data.baseFare || 2200);
    baseFare = effectiveDays * dailyRate;
  } else if (tripType === 'Local' || tripType === 'Airport') {
    baseFare = Number(data.baseFare || (tripType === 'Airport' ? 1200 : 1800));
  }

  const driverBata = Number(data.driverBata || 0);
  const nightHalt = Number(data.nightHalt || 0);
  const discount = Number(data.discount || 0);
  const tollParking = Number(data.tollParking || 0);

  // Taxable Services (SAC 9966)
  const taxableAmount = Math.max(0, baseFare + driverBata + nightHalt - discount);
  const gstEnabled = Boolean(data.gstEnabled);
  const gstPercent = Number(data.gstPercent !== undefined ? data.gstPercent : 5);
  const gstAmount = gstEnabled ? Math.round(taxableAmount * (gstPercent / 100)) : 0;

  // Toll & parking is pass-through disbursement (added at actuals after service GST)
  const totalFare = taxableAmount + gstAmount + tollParking;
  const advancePaid = Number(data.advancePaid || 0);
  const balancePending = Math.max(0, totalFare - advancePaid);

  return {
    tripType,
    daysCount: effectiveDays,
    nightsCount,
    minKmPerDay,
    minPackageKm,
    billableKm,
    baseFare,
    ratePerKm,
    driverBata,
    nightHalt,
    discount,
    tollParking,
    taxableAmount,
    gstEnabled,
    gstPercent,
    gstAmount,
    totalFare,
    advancePaid,
    balancePending,
    isMinKmApplied: tripType === 'Outstation' && billableKm > rawEstimatedKm
  };
};

/**
 * Computes settlement fare from odometer readings and extras
 * Guarantees zero under-billing: if actual KM < package KM, package base fare is preserved!
 */
export const calculateSettlementFare = (booking = {}, inputs = {}) => {
  const tripType = booking.tripType || 'Outstation';
  const startKm = Number(inputs.startKm !== undefined ? inputs.startKm : (booking.startKm || booking.startOdometer || 0));
  const endKm = Number(inputs.endKm !== undefined ? inputs.endKm : (booking.endKm || booking.endOdometer || startKm));
  const actualKm = Math.max(0, endKm - startKm);

  const ratePerKm = Number(booking.ratePerKm || 14);
  const minPackageKm = Number(booking.daysCount || 1) * Number(booking.minKmPerDay || 250);
  const packageKm = tripType === 'Outstation'
    ? Math.max(Number(booking.estimatedKm || 0), Number(booking.billableKm || 0), minPackageKm)
    : Number(booking.baseKm || 80);
  const packageBaseFare = Number(booking.baseFare || (packageKm * ratePerKm));

  let kmFare = packageBaseFare;
  let extraKm = 0;
  let extraKmCharges = 0;

  if (tripType === 'Outstation') {
    if (actualKm > packageKm) {
      extraKm = actualKm - packageKm;
      extraKmCharges = extraKm * ratePerKm;
      kmFare = packageBaseFare + extraKmCharges;
    } else {
      // Within package allowance — preserve agreed package base fare!
      extraKm = 0;
      extraKmCharges = 0;
      kmFare = packageBaseFare;
    }
  } else if (tripType === 'Local' || tripType === 'Airport') {
    const baseAllowanceKm = Number(booking.baseKm || 80);
    if (actualKm > baseAllowanceKm) {
      extraKm = actualKm - baseAllowanceKm;
      extraKmCharges = extraKm * ratePerKm;
    }
    kmFare = packageBaseFare + extraKmCharges;
  } else {
    kmFare = packageBaseFare;
  }

  // Extra duty hours (overtime)
  const extraHours = Number(inputs.extraHours !== undefined ? inputs.extraHours : (booking.extraHours || 0));
  const extraHourRate = Number(inputs.extraHourRate !== undefined ? inputs.extraHourRate : (booking.extraHourRate || 150));
  const extraHoursCharges = Math.max(0, extraHours * extraHourRate);

  // Allowances & Adjustments
  const driverBata = Number(inputs.driverBata !== undefined ? inputs.driverBata : (booking.driverBata || 0));
  const nightHalt = Number(inputs.nightHalt !== undefined ? inputs.nightHalt : (booking.nightHalt || 0));
  const discount = Number(inputs.discount !== undefined ? inputs.discount : (booking.discount || 0));
  const tollParking = Number(inputs.tollParking !== undefined ? inputs.tollParking : (booking.tollParking || 0));

  // Taxable Base
  const taxableAmount = Math.max(0, kmFare + extraHoursCharges + driverBata + nightHalt - discount);
  const gstEnabled = Boolean(booking.gstEnabled);
  const gstPercent = Number(booking.gstPercent !== undefined ? booking.gstPercent : 5);
  const gstAmount = gstEnabled ? Math.round(taxableAmount * (gstPercent / 100)) : 0;

  // Gross Bill Total
  const grossTotal = taxableAmount + gstAmount + tollParking;
  const advancePaid = Number(booking.advancePaid || 0);
  const netDue = Math.max(0, grossTotal - advancePaid);

  const inputPaid = inputs.collectedNow !== undefined ? inputs.collectedNow : inputs.finalPaidAmount;
  const collectedNow = Number(inputPaid !== undefined && inputPaid !== null ? inputPaid : netDue);
  const totalCollected = advancePaid + collectedNow;
  const balanceRemaining = Math.max(0, grossTotal - totalCollected);

  return {
    startKm,
    endKm,
    actualKm,
    packageKm,
    packageBaseFare,
    extraKm,
    extraKmCharges,
    kmFare,
    extraHours,
    extraHourRate,
    extraHoursCharges,
    driverBata,
    nightHalt,
    discount,
    tollParking,
    taxableAmount,
    gstEnabled,
    gstPercent,
    gstAmount,
    grossTotal,
    advancePaid,
    netDue,
    collectedNow,
    totalCollected,
    balanceRemaining,
    isWithinPackage: actualKm <= packageKm
  };
};
