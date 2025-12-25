import type { StorageManager as IStorageManager } from '../types';

export class StorageManager implements IStorageManager {
  private readonly STORAGE_PREFIX = 'office-attendance-tracker';
  private readonly MAX_RETRY_ATTEMPTS = 3;

  save(key: string, data: any): void {
    if (!this.isAvailable()) {
      console.warn('Local storage is not available');
      return;
    }

    const prefixedKey = this.getPrefixedKey(key);
    let attempts = 0;

    while (attempts < this.MAX_RETRY_ATTEMPTS) {
      try {
        const serializedData = JSON.stringify(data);
        localStorage.setItem(prefixedKey, serializedData);
        return;
      } catch (error) {
        attempts++;

        if (this.isQuotaExceededError(error)) {
          console.warn(`Storage quota exceeded on attempt ${attempts}. Attempting cleanup...`);
          this.handleQuotaExceeded();

          if (attempts === this.MAX_RETRY_ATTEMPTS) {
            console.error('Failed to save after quota cleanup attempts');
            throw new Error('Storage quota exceeded and cleanup failed');
          }
        } else {
          console.error('Failed to save to local storage:', error);
          throw error;
        }
      }
    }
  }

  load<T>(key: string): T | null {
    if (!this.isAvailable()) {
      return null;
    }

    const prefixedKey = this.getPrefixedKey(key);

    try {
      const item = localStorage.getItem(prefixedKey);
      if (!item) {
        return null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Failed to load from local storage (possible corruption):', error);

      // Handle corrupted data by removing the corrupted entry
      try {
        localStorage.removeItem(prefixedKey);
        console.warn(`Removed corrupted data for key: ${key}`);
      } catch (removeError) {
        console.error('Failed to remove corrupted data:', removeError);
      }

      return null;
    }
  }

  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      // Only clear keys with our prefix to avoid affecting other applications
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear local storage:', error);
    }
  }

  /**
   * Get storage usage information for debugging and monitoring
   */
  getStorageInfo(): { used: number; available: boolean; keys: string[] } {
    if (!this.isAvailable()) {
      return { used: 0, available: false, keys: [] };
    }

    let used = 0;
    const keys: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keys.push(key.replace(this.STORAGE_PREFIX + '_', ''));
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }

    return { used, available: true, keys };
  }

  private getPrefixedKey(key: string): string {
    return `${this.STORAGE_PREFIX}_${key}`;
  }

  private isQuotaExceededError(error: any): boolean {
    return error instanceof DOMException && (
      error.code === 22 || // QUOTA_EXCEEDED_ERR
      error.code === 1014 || // NS_ERROR_DOM_QUOTA_REACHED (Firefox)
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }

  private handleQuotaExceeded(): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      // Strategy: Remove oldest entries first (simple cleanup)
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      // Remove up to 25% of our keys to free up space
      const removeCount = Math.max(1, Math.floor(keysToRemove.length * 0.25));

      for (let i = 0; i < removeCount && i < keysToRemove.length; i++) {
        localStorage.removeItem(keysToRemove[i]);
      }

      console.log(`Removed ${removeCount} items to free up storage space`);
    } catch (error) {
      console.error('Failed to handle quota exceeded:', error);
    }
  }
}