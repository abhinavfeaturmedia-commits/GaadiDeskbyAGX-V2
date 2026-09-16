/**
 * Date and Time Utilities for GaadiDesk
 * Enforces Indian Standard Time (IST - Asia/Kolkata / UTC+5:30)
 * Prevents UTC midnight drift where trips between 12:00 AM and 5:30 AM IST appear on the previous day.
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date in YYYY-MM-DD format strictly according to Indian Standard Time.
 * @param {Date} [date] - Optional Date object (defaults to current time)
 * @returns {string} - e.g. "2026-09-10"
 */
export function getTodayIst(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Returns tomorrow's date in YYYY-MM-DD format strictly according to IST.
 * @returns {string} - e.g. "2026-09-11"
 */
export function getTomorrowIst() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return getTodayIst(tomorrow);
}

/**
 * Formats a Date or ISO string into a human-friendly IST date (e.g. "10 Sep 2026")
 * @param {Date|string|number} dateOrIso 
 * @returns {string}
 */
export function formatIstDate(dateOrIso, options = {}) {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' || typeof dateOrIso === 'number' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '';

  const defaultOptions = {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  };

  return new Intl.DateTimeFormat('en-IN', defaultOptions).format(d);
}

/**
 * Formats a Date or ISO string into a human-friendly IST time (e.g. "02:30 PM")
 * @param {Date|string|number} dateOrIso 
 * @returns {string}
 */
export function formatIstTime(dateOrIso) {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' || typeof dateOrIso === 'number' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

/**
 * Checks if a given date string (YYYY-MM-DD or ISO) matches today's IST date.
 * @param {string} dateStr 
 * @returns {boolean}
 */
export function isDateTodayIst(dateStr) {
  if (!dateStr) return false;
  const isoPrefix = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  return isoPrefix === getTodayIst();
}

/**
 * Generates ISO string for datetime-local input fields initialized in IST.
 * @param {number} [offsetMs=0] - Offset in milliseconds from now
 * @returns {string} - "YYYY-MM-DDTHH:mm"
 */
export function getIstDateTimeInputString(offsetMs = 0) {
  const d = new Date(Date.now() + offsetMs);
  
  // Format parts in IST
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d);

  const getPart = (type) => parts.find(p => p.type === type)?.value || '00';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
}
