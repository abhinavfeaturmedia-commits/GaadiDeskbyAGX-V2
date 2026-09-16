/**
 * Offline Sync Queue for GaadiDesk
 * Stores optimistic database writes when the device is offline or on a weak connection.
 * Automatically flushes and syncs to Supabase when network connectivity returns.
 */

import { getAllPendingOfflinePhotos, deleteOfflinePhoto } from './offlineDb';
import { supabase } from '../lib/supabase';

const QUEUE_STORAGE_KEY = 'gd_offline_sync_queue';

/**
 * Get all pending actions from localStorage
 * @returns {Array<Object>}
 */
export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[SyncQueue] Failed to parse offline queue:', err);
    return [];
  }
}

/**
 * Save pending actions array to localStorage
 * @param {Array<Object>} queue 
 */
function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[SyncQueue] Failed to save offline queue:', err);
  }
}

/**
 * Enqueue a mutation to be retried when network is healthy
 * @param {string} type - Action type (e.g. 'SAVE_BOOKING', 'SAVE_EXPENSE')
 * @param {Object} payload - Entity data
 * @param {string} businessId - Business identifier
 */
export function enqueueOfflineAction(type, payload, businessId) {
  if (!type || !payload) return;

  const queue = getOfflineQueue();
  const queueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    payload,
    businessId: businessId || null,
    enqueuedAt: new Date().toISOString()
  };

  // If action is an update for an existing ID, replace previous pending action for that entity
  const existingIdx = queue.findIndex(item => item.type === type && item.payload?.id && item.payload.id === payload.id);
  if (existingIdx !== -1) {
    queue[existingIdx] = queueItem;
  } else {
    queue.push(queueItem);
  }

  saveOfflineQueue(queue);
  console.info(`[SyncQueue] Action '${type}' enqueued. Pending items: ${queue.length}`);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gaadidesk:queue_updated', {
      detail: { pendingCount: queue.length }
    }));
  }
}

/**
 * Get the number of pending unsynced offline actions
 * @returns {number}
 */
export function getPendingQueueCount() {
  return getOfflineQueue().length;
}

/**
 * Process and flush all pending offline actions using supabaseApi
 * @param {Object} supabaseApi - Active supabaseApi instance
 * @returns {Promise<{ flushed: number, remaining: number }>}
 */
export async function flushOfflineQueue(supabaseApi) {
  const queue = getOfflineQueue();
  if (!queue.length || !supabaseApi) {
    return { flushed: 0, remaining: 0 };
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    return { flushed: 0, remaining: queue.length };
  }

  console.info(`[SyncQueue] Starting flush of ${queue.length} pending offline actions...`);

  // 1. Flush pending offline photos from IndexedDB
  try {
    const pendingPhotos = await getAllPendingOfflinePhotos();
    if (pendingPhotos.length > 0) {
      console.info(`[SyncQueue] Flushing ${pendingPhotos.length} offline photos to Supabase Storage...`);
      for (const p of pendingPhotos) {
        try {
          const fileName = `${p.folderPrefix || 'odometer'}/${p.id}.jpg`;
          const { data, error } = await supabase.storage.from(p.bucket || 'trip-meter-snaps').upload(fileName, p.blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });
          if (!error && data) {
            await deleteOfflinePhoto(p.id);
            console.info(`[SyncQueue] Successfully synced offline photo ${p.id}`);
          }
        } catch (photoErr) {
          console.warn(`[SyncQueue] Failed to sync offline photo ${p.id}:`, photoErr?.message);
        }
      }
    }
  } catch (err) {
    console.warn('[SyncQueue] Photo flush error:', err);
  }

  const remainingQueue = [];
  let flushedCount = 0;

  for (const item of queue) {
    try {
      const bizId = item.businessId || undefined;
      switch (item.type) {
        case 'SAVE_BOOKING':
          await supabaseApi.saveBooking(item.payload, bizId);
          break;
        case 'SAVE_VEHICLE':
          await supabaseApi.saveVehicle(item.payload, bizId);
          break;
        case 'SAVE_DRIVER':
          await supabaseApi.saveDriver(item.payload, bizId);
          break;
        case 'SAVE_CUSTOMER':
          await supabaseApi.saveCustomer(item.payload, bizId);
          break;
        case 'SAVE_EXPENSE':
          await supabaseApi.saveExpense(item.payload, bizId);
          break;
        case 'SAVE_TRANSACTION':
          await supabaseApi.saveTransaction(item.payload, bizId);
          break;
        case 'SAVE_INVOICE':
          await supabaseApi.saveInvoice(item.payload, bizId);
          break;
        case 'SAVE_SERVICE':
          await supabaseApi.saveVehicleService(item.payload, bizId);
          break;
        case 'SAVE_DRIVER_SUBMISSION':
          await supabaseApi.saveDriverSubmission(item.payload, bizId);
          break;
        case 'SAVE_BUSINESS':
          await supabaseApi.saveBusiness(item.payload);
          break;
        case 'DELETE_BOOKING':
          await supabaseApi.deleteBooking(item.payload);
          break;
        case 'DELETE_VEHICLE':
          await supabaseApi.deleteVehicle(item.payload);
          break;
        case 'DELETE_DRIVER':
          await supabaseApi.deleteDriver(item.payload);
          break;
        case 'DELETE_CUSTOMER':
          await supabaseApi.deleteCustomer(item.payload);
          break;
        case 'DELETE_EXPENSE':
          await supabaseApi.deleteExpense(item.payload);
          break;
        case 'DELETE_TRANSACTION':
          await supabaseApi.deleteTransaction(item.payload);
          break;
        case 'DELETE_SERVICE':
          await supabaseApi.deleteVehicleService(item.payload);
          break;
        default:
          console.warn('[SyncQueue] Unknown queued action type:', item.type);
      }
      flushedCount++;
    } catch (err) {
      console.warn(`[SyncQueue] Failed to flush item ${item.id} (${item.type}):`, err?.message);
      const retries = (item.retries || 0) + 1;
      // Drop after 5 failed retries to prevent blocking the queue
      if (retries < 5) {
        remainingQueue.push({ ...item, retries, lastError: err?.message });
      } else {
        console.error(`[SyncQueue] Dropping poisoned queue item ${item.id} after 5 failed retries.`);
      }
    }
  }

  saveOfflineQueue(remainingQueue);
  console.info(`[SyncQueue] Flush complete. Flushed: ${flushedCount}, Remaining: ${remainingQueue.length}`);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gaadidesk:queue_updated', {
      detail: { pendingCount: remainingQueue.length }
    }));
  }

  return { flushed: flushedCount, remaining: remainingQueue.length };
}

/**
 * Initialize automatic listeners for online events
 * @param {Object} supabaseApi 
 */
export function initOfflineSyncListeners(supabaseApi) {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    console.info('[SyncQueue] Device is back online. Triggering automatic sync...');
    flushOfflineQueue(supabaseApi);
  });
}
