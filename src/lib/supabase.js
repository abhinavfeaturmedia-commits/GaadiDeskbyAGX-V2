import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://xbeivqsjwjjrmxshyobv.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZWl2cXNqd2pqcm14c2h5b2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNzk4NTEsImV4cCI6MjEwMzY1NTg1MX0.7kKsTFeloOzfiWVMV5IJXhxql0grOmN2ueo0sKhM4kw';

export function getActiveBusinessId() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const savedUser = localStorage.getItem('gd_auth_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.businessId) return parsed.businessId;
    }
    const savedBiz = localStorage.getItem('gd_business');
    if (savedBiz) {
      const parsed = JSON.parse(savedBiz);
      if (parsed?.id) return parsed.id;
    }
  } catch {}
  return null;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    fetch: (url, options = {}) => {
      const bizId = getActiveBusinessId();
      const headers = new Headers(options.headers || {});
      if (bizId && !headers.has('x-business-id')) {
        headers.set('x-business-id', bizId);
      }
      return fetch(url, { ...options, headers });
    }
  }
});

/**
 * Checks connectivity with the Supabase PostgreSQL database and detects if project is paused
 * @param {number} timeoutMs - Timeout duration in milliseconds
 * @returns {Promise<{ isConnected: boolean, isPaused: boolean, error: string | null, status: number }>}
 */
export async function checkSupabaseHealth(timeoutMs = 6000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const probeUrl = `${supabaseUrl}/rest/v1/businesses?select=id&limit=1`;
    const response = await fetch(probeUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Range-Unit': 'items',
        'Range': '0-0'
      },
      signal: controller ? controller.signal : undefined
    });

    if (timeoutId) clearTimeout(timeoutId);

    // Supabase returns 503 Service Unavailable or 52x when paused/stopped
    if (response.status === 503 || response.status === 521 || response.status === 522 || response.status === 523) {
      console.warn('[Supabase Check]: Project is paused or stopped by administrator (HTTP ' + response.status + ')');
      broadcastStatus(false, true, `Supabase project paused (HTTP ${response.status})`, response.status);
      return {
        isConnected: false,
        isPaused: true,
        error: `Supabase project paused (HTTP ${response.status})`,
        status: response.status
      };
    }

    if (response.ok) {
      broadcastStatus(true, false, null, response.status);
      return { isConnected: true, isPaused: false, error: null, status: response.status };
    }

    // Inspect error text for actual admin pause keywords
    const bodyText = await response.text().catch(() => '');
    const isExplicitlyPaused = response.status === 503 ||
                               bodyText.toLowerCase().includes('project is paused') ||
                               bodyText.toLowerCase().includes('project is inactive') ||
                               bodyText.toLowerCase().includes('project has been paused');

    broadcastStatus(false, isExplicitlyPaused, bodyText || `HTTP ${response.status}`, response.status);
    return {
      isConnected: false,
      isPaused: isExplicitlyPaused,
      error: bodyText || `HTTP ${response.status}`,
      status: response.status
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    const isAbort = err.name === 'AbortError';
    const errMsg = isAbort ? 'Connection timed out' : (err?.message || 'Network offline');

    // NETWORK TIMEOUT OR OFFLINE SHOULD NEVER LOCK DOWN THE APP!
    // It simply means the mobile device is offline or has slow connectivity.
    console.info('[Supabase Health]: Network offline or connection timed out. Operating in offline-first mode.', errMsg);
    broadcastStatus(false, false, errMsg, isAbort ? 408 : 0);

    return {
      isConnected: false,
      isPaused: false, // Explicitly false so offline users can keep working
      error: errMsg,
      status: isAbort ? 408 : 0
    };
  }
}

/**
 * Helper to broadcast Supabase project status to any active listener in the app
 */
function broadcastStatus(isConnected, isPaused, error, status) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gaadidesk:supabase_status', {
      detail: { isConnected, isPaused, error, status }
    }));
  }
}

/**
 * Check if an error object or response represents a truly paused Supabase project
 */
export function isSupabasePausedError(error) {
  if (!error) return false;
  const str = String(error.message || error.details || error || '').toLowerCase();
  const status = error.status || error.code || 0;
  return status === 503 ||
         status === '503' ||
         str.includes('project is paused') ||
         str.includes('project is inactive') ||
         str.includes('project has been paused');
}

