import React, { useEffect } from 'react';
import { App } from '@capacitor/app';

/**
 * Global Modal & Navigation Stack Manager for GaadiDesk
 * Coordinates Android hardware back button, mobile back gestures, and keyboard Escape
 * so modals, sub-views, and pages exit in proper hierarchical order rather than abruptly exiting the app.
 */

class ModalStackManager {
  constructor() {
    this.stack = [];
    this.hasHistoryPushed = false;
    this.isPopStateProcessing = false;
    this.lastExitBackPressTime = 0;
    this.exitToastCallback = null;
    this.tabBackHandler = null;

    if (typeof window !== 'undefined') {
      this.initListeners();
    }
  }

  setExitToastCallback(cb) {
    this.exitToastCallback = cb;
  }

  setTabBackHandler(cb) {
    this.tabBackHandler = cb;
  }

  initListeners() {
    // 1. Web popstate / browser back button listener
    window.addEventListener('popstate', (e) => {
      this.isPopStateProcessing = true;
      this.handleBackAction(e);
      setTimeout(() => {
        this.isPopStateProcessing = false;
      }, 50);
    });

    // 2. Escape key for desktop / keyboard users
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.stack.length > 0) {
        this.popAndCloseTop();
      }
    });

    // 3. Capacitor Native Android Back Button Bridge
    try {
      App.addListener('backButton', ({ canGoBack }) => {
        this.handleBackAction({ nativeCapacitor: true, canGoBack });
      });
    } catch (err) {
      console.warn('[ModalStack] Native App.addListener warning:', err);
    }
  }

  syncHistoryState() {
    if (typeof window === 'undefined') return;

    if (this.stack.length > 0) {
      if (!this.hasHistoryPushed) {
        try {
          window.history.pushState({ gaadiModalOpen: true }, '');
          this.hasHistoryPushed = true;
        } catch (e) {
          console.warn('[ModalStack] pushState failed:', e);
        }
      }
    } else {
      if (this.hasHistoryPushed) {
        this.hasHistoryPushed = false;
        // Never call window.history.back() programmatically in SPA lifecycle!
        // Calling history.back() triggers browser navigation / popstate which reloads pages or navigates away.
        // Instead, simply replace the state so gaadiModalOpen flag is cleared cleanly.
        try {
          if (window.history.state?.gaadiModalOpen) {
            window.history.replaceState(null, '');
          }
        } catch (e) {
          console.warn('[ModalStack] replaceState failed:', e);
        }
      }
    }
  }

  /**
   * Register a modal or sub-option to the active stack
   * @param {string} id - Unique identifier
   * @param {Function} closeFn - Callback to close this specific element
   */
  push(id, closeFn) {
    if (!id || typeof closeFn !== 'function') return;

    // Avoid duplicate registrations - update existing handler if already present
    const existingIdx = this.stack.findIndex(item => item.id === id);
    if (existingIdx !== -1) {
      this.stack[existingIdx].closeFn = closeFn;
      return;
    }

    this.stack.push({ id, closeFn });
    this.syncHistoryState();
  }

  /**
   * Remove a modal/option from the stack when closed normally
   * @param {string} id 
   */
  remove(id) {
    const idx = this.stack.findIndex(item => item.id === id);
    if (idx !== -1) {
      this.stack.splice(idx, 1);
      this.syncHistoryState();
    }
  }

  /**
   * Close the topmost modal or option
   * @returns {boolean} Whether an item was closed
   */
  popAndCloseTop() {
    if (this.stack.length === 0) return false;

    // Peek top modal first to allow sub-step navigation (returning false consumes back event without closing modal)
    const topModal = this.stack[this.stack.length - 1];
    if (topModal && typeof topModal.closeFn === 'function') {
      try {
        const result = topModal.closeFn();
        // If closeFn explicitly returned false, the modal handled an internal sub-step and should remain on stack
        if (result === false) {
          return true;
        }
      } catch (err) {
        console.warn('[ModalStack] Error invoking modal closeFn:', err);
      }
    }

    this.stack.pop();
    this.syncHistoryState();
    return true;
  }

  /**
   * Handle back action from Android hardware back, popstate, or gestures
   */
  handleBackAction(event) {
    // 1. Tier 1 & 2: If any modal, drawer, or option is on the stack, close top one
    if (this.stack.length > 0) {
      this.popAndCloseTop();
      return;
    }

    // 2. Tier 3: If no modal is open, check page/tab navigation history
    if (typeof this.tabBackHandler === 'function') {
      try {
        const handled = this.tabBackHandler();
        if (handled) {
          return;
        }
      } catch (err) {
        console.warn('[ModalStack] Error in tabBackHandler:', err);
      }
    }

    // 3. Tier 4: On root screen with nothing open -> Double-back to exit confirmation
    const now = Date.now();
    if (now - this.lastExitBackPressTime < 2000) {
      // Pressed twice within 2 seconds -> Clean native exit
      try {
        App.exitApp();
      } catch (err) {
        if (window.Capacitor?.Plugins?.App?.exitApp) {
          window.Capacitor.Plugins.App.exitApp();
        }
      }
    } else {
      this.lastExitBackPressTime = now;
      if (typeof this.exitToastCallback === 'function') {
        this.exitToastCallback();
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gaadidesk:exit_toast'));
      }
    }
  }

  getStackLength() {
    return this.stack.length;
  }
}

export const modalStack = new ModalStackManager();

/**
 * React Hook to cleanly register a modal or option with the Android back button stack
 * @param {boolean} isOpen - Whether the modal/option is currently open
 * @param {Function} onClose - Close handler
 * @param {string} modalId - Unique ID
 */
export function useModalBackRegistration(isOpen, onClose, modalId) {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      modalStack.push(modalId, () => {
        if (typeof onCloseRef.current === 'function') {
          onCloseRef.current();
        }
      });
      return () => {
        modalStack.remove(modalId);
      };
    }
  }, [isOpen, modalId]);
}
