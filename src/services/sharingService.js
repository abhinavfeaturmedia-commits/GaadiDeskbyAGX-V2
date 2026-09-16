import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

/**
 * Native Android & WhatsApp Sharing Service for GaadiDesk
 * Provides seamless direct-to-WhatsApp intent launches and native Android Share Sheet integration.
 */

/**
 * Clean phone number to digits and ensure 91 Indian country code
 * @param {string} phone 
 * @returns {string}
 */
/**
 * Generate a standard UPI payment URI intent link
 * @param {Object} options - { upiId, payeeName, amount, note, invoiceNo }
 * @returns {string} upi://pay?...
 */
export function generateUpiPaymentLink({ upiId, payeeName, amount, note, invoiceNo } = {}) {
  if (!upiId) return '';
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(payeeName || 'GaadiDesk Fleet Partner');
  const cleanNote = encodeURIComponent(note || (invoiceNo ? `Invoice ${invoiceNo}` : 'Trip Settlement'));
  const cleanAmt = amount && Number(amount) > 0 ? `&am=${Number(amount).toFixed(2)}` : '';
  return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${cleanName}${cleanAmt}&cu=INR&tn=${cleanNote}`;
}

/**
 * Generate a Google Maps route navigation link
 * @param {string} pickup
 * @param {string} drop
 * @returns {string}
 */
export function generateGoogleMapsRouteUrl(pickup, drop) {
  if (!pickup && !drop) return '';
  if (pickup && drop) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(drop)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(drop || pickup)}`;
}

/**
 * Open 1-Tap native Google Maps turn-by-turn driving navigation
 * On Android, directly launches Google Maps driving mode (google.navigation:q=...)
 * @param {string} destination - Target destination
 * @param {string} origin - Optional starting point
 */
export function openDrivingNavigation(destination, origin = '') {
  if (!destination) return false;
  const cleanDest = destination.trim();
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // On Android Native or Android browser, invoke native Google Maps turn-by-turn navigation directly
  if (Capacitor.isNativePlatform() || (isMobile && /android/i.test(navigator.userAgent))) {
    const navUri = `google.navigation:q=${encodeURIComponent(cleanDest)}&mode=d`;
    try {
      window.location.href = navUri;
      return true;
    } catch (e) {
      console.warn('[SharingService] Native driving navigation intent failed, falling back to web URL', e);
    }
  }

  // Web / Desktop / iOS fallback
  const webUrl = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(cleanDest)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanDest)}`;
  window.open(webUrl, '_blank');
  return true;
}

/**
 * Viral branding footer watermark
 */
export const GAADIDESK_WATERMARK = `\n\n📱 _Generated via GaadiDesk — All-in-One Fleet Office App_`;

/**
 * Clean phone number to digits and ensure 91 Indian country code
 * @param {string} phone 
 * @returns {string}
 */
export function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Send a message via WhatsApp using direct app URI intent on mobile with fallback
 * @param {string} phone - Target phone number
 * @param {string} text - Formatted message text
 */
export function sendWhatsAppMessage(phone, text) {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text || '');

  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // On Android/Mobile, attempt direct whatsapp:// protocol first to avoid browser redirects
  if (isMobile) {
    const directIntent = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;

    // Test launch via direct URI
    const start = Date.now();
    window.location.href = directIntent;

    // If direct intent didn't open WhatsApp app within 800ms, fallback to web URL
    setTimeout(() => {
      if (Date.now() - start < 1500) {
        const webUrl = cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodedText}`
          : `https://wa.me/?text=${encodedText}`;
        window.open(webUrl, '_blank');
      }
    }, 800);
    return;
  }

  // Desktop Web fallback
  const webUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  window.open(webUrl, '_blank');
}

/**
 * Trigger the native Android / Mobile Share Sheet
 * @param {Object} options - { title, text, url, dialogTitle }
 * @returns {Promise<boolean>} Whether native share was successfully executed
 */
export async function shareViaNative(options = {}) {
  const { title = 'GaadiDesk', text = '', url = '', dialogTitle = 'Share via GaadiDesk' } = options;

  // 1. Capacitor native Android share sheet
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title,
        text,
        url: url || undefined,
        dialogTitle
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[SharingService] Native share error:', err);
      }
      return false;
    }
  }

  // 2. Web Share API fallback
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text,
        url: url || undefined
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[SharingService] Web share canceled or failed:', err);
      }
      return false;
    }
  }
  return false;
}

/**
 * Robust copy-to-clipboard that works in both secure HTTPS and insecure Android WebViews
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // Try modern Clipboard API first
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }

  // Fallback for older Android WebViews / HTTP contexts
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('[SharingService] execCommand copy failed:', err);
    return false;
  }
}
