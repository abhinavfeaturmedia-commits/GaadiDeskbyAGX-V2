/**
 * GaadiDesk In-App Version & Release Checker
 * Compares active client app version with latest published version.
 * Ensures Indian fleet operators can be notified when an updated APK or feature release is available.
 */

export const CURRENT_APP_VERSION = '1.0.1';

/**
 * Check if a newer version of GaadiDesk is available
 * @returns {Promise<{ hasUpdate: boolean, currentVersion: string, latestVersion: string, downloadUrl?: string, notes?: string }>}
 */
export async function checkForAppUpdate() {
  try {
    if (typeof window === 'undefined') {
      return { hasUpdate: false, currentVersion: CURRENT_APP_VERSION, latestVersion: CURRENT_APP_VERSION };
    }

    // Read cached latest version if any
    const remoteVersion = localStorage.getItem('gd_latest_version') || CURRENT_APP_VERSION;
    const hasUpdate = isVersionGreater(remoteVersion, CURRENT_APP_VERSION);

    return {
      hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: remoteVersion,
      notes: 'Performance improvements, native camera stabilization, and turn-by-turn Google Maps navigation.'
    };
  } catch (err) {
    return { hasUpdate: false, currentVersion: CURRENT_APP_VERSION, latestVersion: CURRENT_APP_VERSION };
  }
}

/**
 * Compare two semver strings (e.g. "1.1.0" > "1.0.1")
 */
export function isVersionGreater(vA, vB) {
  if (!vA || !vB) return false;
  const partsA = vA.replace(/[^0-9.]/g, '').split('.').map(Number);
  const partsB = vB.replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}
