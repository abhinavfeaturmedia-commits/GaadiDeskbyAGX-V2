/**
 * IndexedDB Offline Database Layer for GaadiDesk
 * Eliminates the 5MB browser localStorage limit and safely stores binary photos
 * (odometer readings, fuel receipts, inspection snaps) offline when mobile network is unavailable.
 */

const DB_NAME = 'gaadidesk_offline_db';
const DB_VERSION = 1;
const STORE_PHOTOS = 'offline_photos';
const STORE_CACHE = 'offline_cache';

let dbInstancePromise = null;

function getDb() {
  if (dbInstancePromise) return dbInstancePromise;

  dbInstancePromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[OfflineDB] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbInstancePromise;
}

/**
 * Save an offline photo Blob to IndexedDB
 * @param {string} id - Unique identifier e.g. 'photo_1726142000_abc'
 * @param {Blob} blob - The compressed JPEG Blob
 * @param {Object} metadata - { bucket, folderPrefix, entityId }
 * @returns {Promise<string>} Local offline reference URI
 */
export async function saveOfflinePhoto(id, blob, metadata = {}) {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const record = {
        id,
        blob,
        bucket: metadata.bucket || 'trip-meter-snaps',
        folderPrefix: metadata.folderPrefix || 'odometer',
        entityId: metadata.entityId || null,
        createdAt: new Date().toISOString()
      };

      const req = store.put(record);
      req.onsuccess = () => {
        resolve(`offline://${id}`);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] saveOfflinePhoto error:', err);
    return null;
  }
}

/**
 * Retrieve an offline photo by ID
 * @param {string} id 
 * @returns {Promise<{ id: string, blob: Blob, bucket: string, folderPrefix: string } | null>}
 */
export async function getOfflinePhoto(id) {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] getOfflinePhoto error:', err);
    return null;
  }
}

/**
 * Delete an offline photo once successfully uploaded to cloud
 * @param {string} id 
 */
export async function deleteOfflinePhoto(id) {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] deleteOfflinePhoto error:', err);
    return false;
  }
}

/**
 * Get all pending offline photos awaiting cloud sync
 * @returns {Promise<Array<Object>>}
 */
export async function getAllPendingOfflinePhotos() {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] getAllPendingOfflinePhotos error:', err);
    return [];
  }
}

/**
 * Cache an entire entity collection (e.g. 'gd_bookings', 'gd_vehicles') into IndexedDB
 * Allows unlimited storage of thousands of trips and fleet records bypassing 5MB localStorage limit.
 * @param {string} key
 * @param {any} data
 * @returns {Promise<boolean>}
 */
export async function saveOfflineCache(key, data) {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      const store = tx.objectStore(STORE_CACHE);
      const record = {
        key,
        data,
        updatedAt: new Date().toISOString()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] saveOfflineCache error:', err);
    return false;
  }
}

/**
 * Retrieve cached entity data from IndexedDB
 * @param {string} key
 * @returns {Promise<any | null>}
 */
export async function getOfflineCache(key) {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.data ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] getOfflineCache error:', err);
    return null;
  }
}

