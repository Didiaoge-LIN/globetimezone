export class OfflineFallback {
  private static DB_NAME = 'globetimezone-cache';
  private static STORE_NAME = 'timezone-data';

  static async saveTimeData(data: any): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      tx.objectStore(this.STORE_NAME).put(data, 'latest');
      return new Promise((resolve) => { tx.oncomplete = () => resolve(); });
    } catch (e) {
      console.warn('[Offline] Failed to cache time data:', e);
    }
  }

  static async loadTimeData(): Promise<any | null> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const data = await new Promise<any>((resolve) => {
        const req = tx.objectStore(this.STORE_NAME).get('latest');
        req.onsuccess = () => resolve(req.result);
      });
      return data || null;
    } catch (e) {
      return null;
    }
  }

  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(this.STORE_NAME);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}
