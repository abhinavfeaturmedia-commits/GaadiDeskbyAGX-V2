import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Tactile Haptic Feedback Engine for GaadiDesk
 * Provides real native physical motor vibration on Android devices via @capacitor/haptics
 * with graceful fallback to the Web Vibration API.
 */

export const hapticFeedback = {
  /**
   * Subtle tick - ideal for tab switches, quick pills, and normal button clicks
   */
  async light() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(10);
        }
      } catch {}
    }
  },

  /**
   * Medium tap - ideal for step advancement, card selection, modals
   */
  async medium() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(22);
        }
      } catch {}
    }
  },

  /**
   * Celebratory success pattern - ideal for "Booking Confirmed", "Trip Completed", "Payment Recorded"
   */
  async success() {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate([15, 40, 25]);
        }
      } catch {}
    }
  },

  /**
   * Warning / Clash vibration - ideal for "Car Clashed!", "License Expired!", "Validation Error"
   */
  async warning() {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate([40, 30, 40]);
        }
      } catch {}
    }
  }
};

export default hapticFeedback;
