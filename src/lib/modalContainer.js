/**
 * Helper to dynamically resolve the modal portal container.
 * Prefers the dedicated '#phone-modal-root' inside MobileShell / DriverShell
 * so modals stay contained strictly within the phone screen frame and never
 * leak into desktop backgrounds or behind mobile simulator frames.
 */
export const getModalPortalRoot = () => {
  if (typeof document === 'undefined') return null;
  return document.getElementById('phone-modal-root') || document.body;
};
