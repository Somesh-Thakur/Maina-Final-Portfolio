/**
 * IndexedDB Offline Audio Caching Engine for Maina
 * Stores full high-fidelity 320kbps audio blobs + track metadata for offline listening
 */

import { Track } from '@/types';

const DB_NAME = 'maina_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'cached_tracks';

interface CachedRecord {
  id: string;
  track: Track;
  blob: Blob;
  cachedAt: number;
}

class OfflineStorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private blobUrlCache = new Map<string, string>();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async saveTrackOffline(track: Track): Promise<boolean> {
    try {
      // Fetch the actual audio file as a Blob
      const res = await fetch(track.audioUrl);
      if (!res.ok) throw new Error('Failed to fetch audio stream for offline cache');
      const blob = await res.blob();

      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record: CachedRecord = {
          id: track.id,
          track: { ...track, isOfflineCached: true },
          blob,
          cachedAt: Date.now(),
        };

        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error('[Offline Storage] Failed to cache track:', track.title, err);
      return false;
    }
  }

  async getOfflineTrackBlobUrl(trackId: string): Promise<string | null> {
    if (this.blobUrlCache.has(trackId)) {
      return this.blobUrlCache.get(trackId)!;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(trackId);

        req.onsuccess = () => {
          const record: CachedRecord | undefined = req.result;
          if (record && record.blob) {
            const url = URL.createObjectURL(record.blob);
            this.blobUrlCache.set(trackId, url);
            resolve(url);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async isTrackOffline(trackId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.count(trackId);
        req.onsuccess = () => resolve(req.result > 0);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async deleteOfflineTrack(trackId: string): Promise<void> {
    try {
      if (this.blobUrlCache.has(trackId)) {
        URL.revokeObjectURL(this.blobUrlCache.get(trackId)!);
        this.blobUrlCache.delete(trackId);
      }

      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(trackId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error('[Offline Storage] Failed to delete track:', trackId, err);
    }
  }

  async getAllOfflineTracks(): Promise<Track[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const records: CachedRecord[] = req.result || [];
          resolve(records.map((r) => r.track));
        };

        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}

export const offlineStorage = new OfflineStorageManager();
