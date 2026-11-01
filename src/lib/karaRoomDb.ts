import { EnhancedChatMessage } from '../components/ChatScreen';

const DB_NAME = 'kara_room_database_v1';
const DB_VERSION = 1;
const MESSAGES_TABLE = 'chat_messages_table';
const SYNC_MIRROR_PREFIX = 'kara_room_chat_mirror_v1_';
const LATEST_ACTIVE_MIRROR_KEY = 'kara_room_latest_active_mirror_v1';
const LAST_SAVED_MESSAGE_KEY = 'kara_last_saved_message_v1';

/**
 * Room-style Local Database & DAO (IndexedDB + Write-Through Sync Mirror)
 * Ensures KARA's conversation history and context persist across app restarts.
 */
class KaraRoomDatabase {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private getDb(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.resolve(null);
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(MESSAGES_TABLE)) {
              const store = db.createObjectStore(MESSAGES_TABLE, { keyPath: 'uid_msg_key' });
              store.createIndex('by_user', 'userId', { unique: false });
            }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  private getMirrorKey(userId: string): string {
    const clean = (userId || 'guest').replace(/[^a-zA-Z0-9_\-]/g, '_');
    return `${SYNC_MIRROR_PREFIX}${clean}`;
  }

  /**
   * Strip heavy base64 payloads only for the localStorage fallback mirror when quota is exceeded
   * (IndexedDB still retains the full base64 images).
   */
  private makeQuotaSafeMessages(messages: EnhancedChatMessage[], limitCount = 50): EnhancedChatMessage[] {
    return messages.slice(-limitCount).map((m, idx, arr) => {
      const isVeryLast = idx >= arr.length - 2;
      const copy: EnhancedChatMessage = { ...m };
      if (!isVeryLast) {
        if (copy.generatedImageUrl && copy.generatedImageUrl.length > 4000) {
          delete copy.generatedImageUrl;
        }
        if (copy.sharedPhotoUrl && copy.sharedPhotoUrl.length > 4000) {
          delete copy.sharedPhotoUrl;
        }
        if (copy.sharedPhotos && copy.sharedPhotos.length > 0) {
          delete copy.sharedPhotos;
        }
      }
      return copy;
    });
  }

  /**
   * Synchronous read from write-through cache for zero-flicker startup hydration
   */
  public getMessagesSync(userId: string): EnhancedChatMessage[] {
    try {
      const raw = localStorage.getItem(this.getMirrorKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Fallback to the latest active conversation mirror so reloads before auth hydration still restore the last message
      const fallbackRaw = localStorage.getItem(LATEST_ACTIVE_MIRROR_KEY);
      if (fallbackRaw) {
        const parsedFallback = JSON.parse(fallbackRaw);
        if (Array.isArray(parsedFallback) && parsedFallback.length > 0) {
          return parsedFallback;
        }
      }
      return [];
    } catch {
      return [];
    }
  }

  public getLastSavedMessageSync(): EnhancedChatMessage | null {
    try {
      const raw = localStorage.getItem(LAST_SAVED_MESSAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && parsed.id ? (parsed as EnhancedChatMessage) : null;
    } catch {
      return null;
    }
  }

  private writeMirrorSync(userId: string, messages: EnhancedChatMessage[]): void {
    if (!messages || messages.length === 0) return;
    const key = this.getMirrorKey(userId);
    const lastMsg = messages[messages.length - 1];

    // Always persist the single last message independently so it is 100% guaranteed to survive reloads
    if (lastMsg) {
      try {
        const compactLast: EnhancedChatMessage = { ...lastMsg };
        if (compactLast.generatedImageUrl && compactLast.generatedImageUrl.length > 120000) {
          delete compactLast.generatedImageUrl;
        }
        if (compactLast.sharedPhotoUrl && compactLast.sharedPhotoUrl.length > 120000) {
          delete compactLast.sharedPhotoUrl;
        }
        if (compactLast.sharedPhotos) {
          delete compactLast.sharedPhotos;
        }
        localStorage.setItem(LAST_SAVED_MESSAGE_KEY, JSON.stringify(compactLast));
      } catch {}
    }

    try {
      const serialized = JSON.stringify(messages.slice(-80));
      localStorage.setItem(key, serialized);
      localStorage.setItem(LATEST_ACTIVE_MIRROR_KEY, serialized);
    } catch {
      // QuotaExceededError fallback: strip heavy base64 images from older messages so text history & last message always save
      try {
        const compactSerialized = JSON.stringify(this.makeQuotaSafeMessages(messages, 40));
        localStorage.setItem(key, compactSerialized);
        localStorage.setItem(LATEST_ACTIVE_MIRROR_KEY, compactSerialized);
      } catch {
        try {
          const minimalSerialized = JSON.stringify(this.makeQuotaSafeMessages(messages, 15).map((m) => ({
            ...m,
            generatedImageUrl: undefined,
            sharedPhotoUrl: undefined,
            sharedPhotos: undefined,
          })));
          localStorage.setItem(key, minimalSerialized);
          localStorage.setItem(LATEST_ACTIVE_MIRROR_KEY, minimalSerialized);
        } catch {}
      }
    }
  }

  /**
   * Query all persisted messages for a user ordered chronologically
   */
  public async getAllMessages(userId: string): Promise<EnhancedChatMessage[]> {
    const cleanUserId = (userId || 'guest').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const syncCached = this.getMessagesSync(cleanUserId);
    const lastSavedMsg = this.getLastSavedMessageSync();

    const ensureLastSavedIncluded = (list: EnhancedChatMessage[]): EnhancedChatMessage[] => {
      if (!lastSavedMsg) return list;
      if (list.some((m) => m.id === lastSavedMsg.id)) return list;
      return [...list, lastSavedMsg];
    };

    const db = await this.getDb();
    if (!db) {
      return ensureLastSavedIncluded(syncCached);
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(MESSAGES_TABLE, 'readonly');
        const store = tx.objectStore(MESSAGES_TABLE);
        const index = store.index('by_user');
        const req = index.getAll(IDBKeyRange.only(cleanUserId));

        req.onsuccess = () => {
          const rows = Array.isArray(req.result) ? req.result : [];
          rows.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
          const cleaned: EnhancedChatMessage[] = rows.map((r) => {
            const copy = { ...r };
            delete copy.uid_msg_key;
            delete copy.sequenceOrder;
            return copy as EnhancedChatMessage;
          });
          if (cleaned.length > 0) {
            const combined = ensureLastSavedIncluded(cleaned);
            this.writeMirrorSync(cleanUserId, combined);
            resolve(combined);
          } else {
            resolve(ensureLastSavedIncluded(syncCached));
          }
        };
        req.onerror = () => resolve(ensureLastSavedIncluded(syncCached));
      } catch {
        resolve(ensureLastSavedIncluded(syncCached));
      }
    });
  }

  /**
   * Persist the entire conversation list atomically in both IndexedDB and write-through mirror
   */
  public async saveConversationHistory(
    userId: string,
    messages: EnhancedChatMessage[]
  ): Promise<void> {
    const cleanUserId = (userId || 'guest').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const bounded = messages.slice(-100);
    this.writeMirrorSync(cleanUserId, bounded);

    const db = await this.getDb();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(MESSAGES_TABLE, 'readwrite');
        const store = tx.objectStore(MESSAGES_TABLE);
        const index = store.index('by_user');
        const getKeysReq = index.getAllKeys(IDBKeyRange.only(cleanUserId));

        getKeysReq.onsuccess = () => {
          const existingKeys = Array.isArray(getKeysReq.result) ? getKeysReq.result : [];
          for (const key of existingKeys) {
            store.delete(key);
          }
          bounded.forEach((msg, idx) => {
            store.put({
              ...msg,
              userId: cleanUserId,
              uid_msg_key: `${cleanUserId}__${msg.id}`,
              sequenceOrder: idx,
            });
          });
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Clear all messages for a user in Room database
   */
  public async clearConversationHistory(userId: string): Promise<void> {
    const cleanUserId = (userId || 'guest').replace(/[^a-zA-Z0-9_\-]/g, '_');
    try {
      localStorage.removeItem(this.getMirrorKey(cleanUserId));
      localStorage.removeItem(LATEST_ACTIVE_MIRROR_KEY);
      localStorage.removeItem(LAST_SAVED_MESSAGE_KEY);
    } catch {}

    const db = await this.getDb();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(MESSAGES_TABLE, 'readwrite');
        const store = tx.objectStore(MESSAGES_TABLE);
        const index = store.index('by_user');
        const getKeysReq = index.getAllKeys(IDBKeyRange.only(cleanUserId));

        getKeysReq.onsuccess = () => {
          const existingKeys = Array.isArray(getKeysReq.result) ? getKeysReq.result : [];
          for (const key of existingKeys) {
            store.delete(key);
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Completely wipe the entire Room database and all localStorage sync mirrors
   * so KARA starts 100% brand new after a Hard Reset.
   */
  public async wipeAllDatabase(): Promise<void> {
    try {
      localStorage.removeItem(LATEST_ACTIVE_MIRROR_KEY);
      localStorage.removeItem(LAST_SAVED_MESSAGE_KEY);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SYNC_MIRROR_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch {}

    const db = await this.getDb();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(MESSAGES_TABLE, 'readwrite');
        const store = tx.objectStore(MESSAGES_TABLE);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export const karaRoomDb = new KaraRoomDatabase();

