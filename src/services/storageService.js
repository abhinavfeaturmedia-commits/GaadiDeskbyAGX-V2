import { supabase } from '../lib/supabase';
import { saveOfflinePhoto } from './offlineDb';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Capture a photo using native Android Camera with gallery prompt,
 * with fallback to web file input if running in desktop browser.
 * This prevents activity kills on 2GB RAM budget Android phones.
 * @returns {Promise<Blob | null>}
 */
export async function capturePhotoWithNative(source = CameraSource.Prompt) {
  if (Capacitor.isNativePlatform()) {
    try {
      const image = await Camera.getPhoto({
        quality: 75,
        width: 1280,
        correctOrientation: true,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: source
      });

      if (image && image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        return blob;
      }
    } catch (err) {
      if (err.message && (err.message.includes('User cancelled') || err.message.includes('cancelled'))) {
        return null;
      }
      console.warn('[StorageService] Capacitor Camera error, falling back to file input:', err);
    }
  }
  return null;
}

/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Shrinks 5-10MB mobile camera photos to ~100-180KB for fast uploads over 3G/4G.
 *
 * @param {File | Blob} file - The original image file from camera or file picker
 * @param {number} maxDimension - Maximum width or height in pixels (default: 1280)
 * @param {number} quality - JPEG compression quality 0.0 - 1.0 (default: 0.82)
 * @returns {Promise<Blob>} Compressed JPEG image Blob
 */
export async function compressImage(file, maxDimension = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    // If not an image, return raw file
    if (!file || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback to original if canvas toBlob fails
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (err) => {
        console.warn('[StorageService] Image load error during compression:', err);
        resolve(file); // Graceful fallback
      };
    };

    reader.onerror = (err) => {
      console.warn('[StorageService] FileReader error:', err);
      resolve(file); // Graceful fallback
    };
  });
}

/**
 * Uploads a document or camera snap to Supabase Cloud Storage.
 * If offline or network error, persists photo blob in IndexedDB so it is never lost.
 *
 * @param {File | Blob} rawFile - Image file or Blob
 * @param {string} bucket - Target Supabase bucket ('trip-meter-snaps' | 'vehicle-documents' | 'driver-documents' | 'inspection-photos')
 * @param {string} folderPrefix - Subfolder path (e.g. 'odometer', 'rc', 'dl', 'inspection')
 * @returns {Promise<{ success: boolean, url: string, error?: string, isOffline?: boolean }>}
 */
export async function uploadMediaToCloud(rawFile, bucket = 'trip-meter-snaps', folderPrefix = 'odometer') {
  if (!rawFile) {
    return { success: false, url: '', error: 'No file provided' };
  }

  try {
    // 1. Compress image to ~100-150KB
    const compressedBlob = await compressImage(rawFile, 1280, 0.82);

    // 2. Generate clean, collision-free filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const fileName = `${folderPrefix}/${timestamp}_${randomSuffix}.jpg`;

    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, compressedBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn('[StorageService Upload Error]: Storing photo safely in IndexedDB for later sync...', error.message);
      const photoId = `photo_${timestamp}_${randomSuffix}`;
      const offlineRef = await saveOfflinePhoto(photoId, compressedBlob, { bucket, folderPrefix });
      const previewUrl = URL.createObjectURL(compressedBlob);
      return { success: false, url: previewUrl, offlineRef, isOffline: true, error: error.message };
    }

    // 4. Retrieve public CDN URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path
    };
  } catch (err) {
    console.warn('[StorageService Exception]: Persisting photo in IndexedDB...', err);
    try {
      const compressedBlob = await compressImage(rawFile, 1280, 0.82);
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const offlineRef = await saveOfflinePhoto(photoId, compressedBlob, { bucket, folderPrefix });
      const previewUrl = URL.createObjectURL(compressedBlob);
      return { success: false, url: previewUrl, offlineRef, isOffline: true, error: err?.message || 'Network error' };
    } catch {
      return {
        success: false,
        url: '',
        error: err?.message || 'Upload failed'
      };
    }
  }
}
