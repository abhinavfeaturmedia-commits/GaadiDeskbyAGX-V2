import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Native Android Hardware & Environment Initializer for GaadiDesk
 * Seamlessly manages StatusBar color, Keyboard shifts, Network connectivity detection,
 * and Background RTO Document Expiry Alarms.
 */

export async function initNativeAndroidBridge() {
  if (typeof window === 'undefined') return;

  // 1. Android Status Bar Styling
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#FAF8F2' });
  } catch (err) {
    // Graceful on web or non-supported devices
  }

  // 2. Virtual Keyboard Adjustment
  try {
    Keyboard.addListener('keyboardWillShow', info => {
      document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });
  } catch (err) {}

  // 3. Native Network Status Monitoring
  try {
    Network.addListener('networkStatusChange', status => {
      window.dispatchEvent(new CustomEvent('gaadidesk:network_status', {
        detail: { connected: status.connected, connectionType: status.connectionType }
      }));
    });
  } catch (err) {}

  // 4. Background RTO Expiry Notifications Setup
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  } catch (err) {}
}

/**
 * Schedule native Android status bar notifications for vehicle document expiries
 * Runs at 9:00 AM on 15d, 7d, and 1d before expiry.
 * @param {Array<Object>} vehicles 
 */
export async function scheduleRtoExpiryAlerts(vehicles = []) {
  if (!vehicles || !vehicles.length) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;

    // Clear previously scheduled expiry alarms to avoid duplicates
    const pending = await LocalNotifications.getPending();
    if (pending.notifications?.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const notificationsToSchedule = [];
    const now = Date.now();
    let notificationId = 1000;

    vehicles.forEach(v => {
      const docTypes = [
        { key: 'insuranceExpiry', label: 'Insurance' },
        { key: 'pucExpiry', label: 'PUC' },
        { key: 'fitnessExpiry', label: 'Fitness' },
        { key: 'permitExpiry', label: 'Permit' }
      ];

      docTypes.forEach(doc => {
        const expiryDateStr = v[doc.key] || v.documents?.[doc.key];
        if (!expiryDateStr) return;

        const expiryTime = new Date(expiryDateStr).getTime();
        const diffDays = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));

        // If expiring in next 15 days, schedule morning 9:00 AM reminder
        if (diffDays >= 0 && diffDays <= 15) {
          notificationId++;

          // Schedule for 9:00:00 AM IST
          const alertDate = new Date();
          alertDate.setHours(9, 0, 0, 0);
          // If 9 AM has already passed today, schedule for 9 AM tomorrow
          if (alertDate.getTime() <= now) {
            alertDate.setDate(alertDate.getDate() + 1);
          }

          notificationsToSchedule.push({
            id: notificationId,
            title: `🚨 RTO Alert: ${v.plate || 'Vehicle'} ${doc.label}`,
            body: `${v.model || 'Car'} ${doc.label} expires in ${diffDays} day${diffDays === 1 ? '' : 's'}! Tap to renew and avoid RTO challan.`,
            schedule: {
              at: alertDate,
              allowWhileIdle: true
            },
            smallIcon: 'ic_launcher',
            extra: { vehicleId: v.id, docKey: doc.key }
          });
        }
      });
    });

    if (notificationsToSchedule.length > 0) {
      // Limit to 5 most urgent alerts to avoid spamming notification tray
      const urgentList = notificationsToSchedule.slice(0, 5);
      await LocalNotifications.schedule({ notifications: urgentList });
    }
  } catch (err) {
    console.warn('[NativeInit] scheduleRtoExpiryAlerts warning:', err);
  }
}
