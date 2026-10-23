import { EnhancedChatMessage } from '../components/ChatScreen';

const DB_NAME = 'kara_room_database_v1';
const DB_VERSION = 1;
const MESSAGES_TABLE = 'chat_messages_table';
const SYNC_MIRROR_PREFIX = 'kara_room_chat_mirror_v1_';

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
   * Synchronous read from write-through cache for zero-flicker startup hydration
   */
  public getMessagesSync(userId: string): EnhancedChatMessage[] {
    try {
      const raw = localStorage.getItem(this.getMirrorKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeMirrorSync(userId: string, messages: EnhancedChatMessage[]): void {
    try {
      localStorage.setItem(
        this.getMirrorKey(userId),
        JSON.stringify(messages.slice(-100))
      );
    } catch {}
  }

  /**
   * Query all persisted messages for a user ordered chronologically
   */
  public async getAllMessages(userId: string): Promise<EnhancedChatMessage[]> {
    const cleanUserId = (userId || 'guest').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const db = await this.getDb();
    if (!db) {
      return this.getMessagesSync(cleanUserId);
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
            this.writeMirrorSync(cleanUserId, cleaned);
            resolve(cleaned);
          } else {
            resolve(this.getMessagesSync(cleanUserId));
          }
        };
        req.onerror = () => resolve(this.getMessagesSync(cleanUserId));
      } catch {
        resolve(this.getMessagesSync(cleanUserId));
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
}

export const karaRoomDb = new KaraRoomDatabase();
