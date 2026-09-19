/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RIVO Offline Outbox & IndexedDB Persistence Module
 * 
 * Provides local caching of Hub data for zero-latency (0ms) hydration
 * and a resilient Outbox queue for waiter calls, bill requests, and dish orders
 * when offline or on unstable restaurant connections.
 */

export interface CachedHubData {
  code: string;
  config?: any;
  venue?: any;
  device?: any;
  org?: any;
  hubConfig?: any;
  timestamp: number;
}

export interface OutboxItem {
  id: string;
  type: 'call' | 'bill' | 'order';
  url: string;
  method: string;
  body: any;
  headers?: Record<string, string>;
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  lastError?: string;
}

const DB_NAME = 'rivo_offline_db';
const DB_VERSION = 1;
const HUB_STORE = 'hub_cache';
const OUTBOX_STORE = 'service_outbox';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

let dbInstancePromise: Promise<IDBDatabase> | null = null;

/**
 * Native Promise-based IndexedDB connection initializer.
 * Creates 'hub_cache' (keyPath: code) and 'service_outbox' (keyPath: id).
 */
export function getDB(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    return Promise.reject(new Error('[OfflineOutbox] IndexedDB is not available outside browser environment'));
  }

  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  dbInstancePromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        // Store 1: hub_cache for instant 0ms hydration
        if (!db.objectStoreNames.contains(HUB_STORE)) {
          db.createObjectStore(HUB_STORE, { keyPath: 'code' });
        }

        // Store 2: service_outbox for offline calls, bills, and orders
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          const outboxStore = db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
          outboxStore.createIndex('status', 'status', { unique: false });
          outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => {
          dbInstancePromise = null;
        };
        db.onversionchange = () => {
          db.close();
          dbInstancePromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbInstancePromise = null;
        reject(request.error || new Error('[OfflineOutbox] Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        console.warn('[OfflineOutbox] IndexedDB upgrade blocked by another active connection.');
      };
    } catch (err) {
      dbInstancePromise = null;
      reject(err);
    }
  });

  return dbInstancePromise;
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('[OfflineOutbox] IDBRequest error'));
  });
}

function promisifyTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('[OfflineOutbox] IDBTransaction error'));
    transaction.onabort = () => reject(transaction.error || new Error('[OfflineOutbox] IDBTransaction aborted'));
  });
}

/**
 * Caches complete hub data (config + venue details) for instant 0ms hydration.
 */
export async function cacheLocalHubData(
  code: string,
  data: {
    config?: any;
    venue?: any;
    device?: any;
    org?: any;
    hubConfig?: any;
    [key: string]: any;
  }
): Promise<void> {
  if (!isBrowser() || !code) return;

  try {
    const db = await getDB();
    const tx = db.transaction(HUB_STORE, 'readwrite');
    const store = tx.objectStore(HUB_STORE);

    const record: CachedHubData = {
      code,
      config: data.config ?? data.hubConfig,
      venue: data.venue ?? data.org,
      device: data.device,
      org: data.org ?? data.venue,
      hubConfig: data.hubConfig ?? data.config,
      timestamp: Date.now(),
    };

    store.put(record);
    await promisifyTransaction(tx);
  } catch (err) {
    console.warn('[OfflineOutbox] cacheLocalHubData failed:', err);
  }
}

/**
 * Retrieves cached hub data by code for 0ms initial render before network revalidation.
 */
export async function getLocalHubData(code: string): Promise<CachedHubData | null> {
  if (!isBrowser() || !code) return null;

  try {
    const db = await getDB();
    const tx = db.transaction(HUB_STORE, 'readonly');
    const store = tx.objectStore(HUB_STORE);
    const req = store.get(code);
    const result = await promisifyRequest<CachedHubData | undefined>(req);
    return result || null;
  } catch (err) {
    console.warn('[OfflineOutbox] getLocalHubData failed:', err);
    return null;
  }
}

/**
 * Enqueues a call, bill request, or order to the offline outbox.
 * If online, triggers an immediate asynchronous drain attempt.
 */
export async function enqueueOutboxItem(item: {
  type: 'call' | 'bill' | 'order';
  url: string;
  method?: string;
  body: any;
  headers?: Record<string, string>;
}): Promise<OutboxItem> {
  const outboxItem: OutboxItem = {
    id: generateUUID(),
    type: item.type,
    url: item.url,
    method: item.method ? item.method.toUpperCase() : 'POST',
    body: item.body,
    headers: item.headers,
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  if (!isBrowser()) {
    return outboxItem;
  }

  try {
    const db = await getDB();
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    store.put(outboxItem);
    await promisifyTransaction(tx);

    // If online, kick off an asynchronous drain attempt without blocking caller
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        drainOutboxQueue().catch((err) => {
          console.warn('[OfflineOutbox] Immediate drain after enqueue encountered error:', err);
        });
      }, 50);
    }
  } catch (err) {
    console.warn('[OfflineOutbox] enqueueOutboxItem failed:', err);
  }

  return outboxItem;
}

/**
 * Returns the count of pending or failed items awaiting synchronization.
 */
export async function getPendingOutboxCount(): Promise<number> {
  if (!isBrowser()) return 0;

  try {
    const db = await getDB();
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    const store = tx.objectStore(OUTBOX_STORE);
    const req = store.getAll();
    const all = await promisifyRequest<OutboxItem[]>(req);
    if (!all || !Array.isArray(all)) return 0;
    return all.filter((i) => i.status === 'pending' || i.status === 'failed').length;
  } catch (err) {
    console.warn('[OfflineOutbox] getPendingOutboxCount failed:', err);
    return 0;
  }
}

let isDraining = false;

/**
 * Drains the offline outbox queue:
 * - Iterates items in 'pending' or 'failed' status in FIFO order.
 * - Performs fetch request.
 * - On success (res.ok): removes item from store and emits 'rivo:outbox-synced' CustomEvent.
 * - On failure: increments retryCount and updates lastError.
 */
export async function drainOutboxQueue(): Promise<{ sent: number; failed: number }> {
  if (!isBrowser()) {
    return { sent: 0, failed: 0 };
  }

  if (isDraining) {
    return { sent: 0, failed: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { sent: 0, failed: 0 };
  }

  isDraining = true;
  let sent = 0;
  let failed = 0;

  try {
    const db = await getDB();
    const readTx = db.transaction(OUTBOX_STORE, 'readonly');
    const store = readTx.objectStore(OUTBOX_STORE);
    const req = store.getAll();
    const items = await promisifyRequest<OutboxItem[]>(req);

    if (!items || items.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const itemsToProcess = items
      .filter((i) => i.status === 'pending' || i.status === 'failed')
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const item of itemsToProcess) {
      // Mark as syncing in database
      try {
        const updateTx = db.transaction(OUTBOX_STORE, 'readwrite');
        const updateStore = updateTx.objectStore(OUTBOX_STORE);
        item.status = 'syncing';
        updateStore.put(item);
        await promisifyTransaction(updateTx);
      } catch (statusErr) {
        console.warn('[OfflineOutbox] Could not mark item as syncing:', statusErr);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(item.headers || {}),
      };

      const bodyPayload = typeof item.body === 'string' ? item.body : JSON.stringify(item.body);

      try {
        const res = await fetch(item.url, {
          method: item.method || 'POST',
          headers,
          body: bodyPayload,
        });

        if (res.ok) {
          // Sync succeeded: remove item from store
          const deleteTx = db.transaction(OUTBOX_STORE, 'readwrite');
          const deleteStore = deleteTx.objectStore(OUTBOX_STORE);
          deleteStore.delete(item.id);
          await promisifyTransaction(deleteTx);

          // Emit CustomEvent with details
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('rivo:outbox-synced', {
                detail: {
                  id: item.id,
                  type: item.type,
                  url: item.url,
                  item,
                  responseStatus: res.status,
                  syncedAt: Date.now(),
                },
              })
            );
          }
          sent++;
        } else {
          // Server responded with error status
          const errorText = await res.text().catch(() => res.statusText || 'HTTP Error');
          const updateTx = db.transaction(OUTBOX_STORE, 'readwrite');
          const updateStore = updateTx.objectStore(OUTBOX_STORE);
          item.status = 'failed';
          item.retryCount += 1;
          item.lastError = `Server responded ${res.status}: ${errorText.slice(0, 300)}`;
          updateStore.put(item);
          await promisifyTransaction(updateTx);
          failed++;
        }
      } catch (fetchError: unknown) {
        // Network failure (offline, timeout, DNS)
        const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const updateTx = db.transaction(OUTBOX_STORE, 'readwrite');
        const updateStore = updateTx.objectStore(OUTBOX_STORE);
        item.status = 'failed';
        item.retryCount += 1;
        item.lastError = errorMsg;
        updateStore.put(item);
        await promisifyTransaction(updateTx);
        failed++;

        // If connection dropped during execution, break early to prevent excessive churn
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          break;
        }
      }
    }
  } catch (err) {
    console.warn('[OfflineOutbox] Error during queue drain:', err);
  } finally {
    isDraining = false;
  }

  return { sent, failed };
}

/**
 * Initializes listeners for online events, background sync, and backoff polling.
 * Returns a cleanup function to remove listeners and cancel timers.
 */
export function initOfflineSyncListeners(): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const handleOnline = () => {
    drainOutboxQueue().catch((err) => {
      console.warn('[OfflineOutbox] Online drain failed:', err);
    });
  };

  window.addEventListener('online', handleOnline);

  // Listen to Service Worker messages (e.g. SYNC_OUTBOX emitted on background sync)
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SYNC_OUTBOX') {
      drainOutboxQueue().catch((err) => {
        console.warn('[OfflineOutbox] SW sync drain failed:', err);
      });
    }
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleMessage);
  }

  // Background Sync API (if supported by browser & service worker)
  const hasSyncManager = typeof window !== 'undefined' && 'SyncManager' in (window as unknown as Record<string, unknown>);
  if ('serviceWorker' in navigator && hasSyncManager) {
    navigator.serviceWorker.ready
      .then((reg) => {
        const syncManager = (reg as unknown as { sync?: { register: (tag: string) => Promise<void> } }).sync;
        if (syncManager && typeof syncManager.register === 'function') {
          return syncManager.register('sync-service-calls');
        }
      })
      .catch((err) => {
        console.warn('[OfflineOutbox] Background sync registration skipped or failed:', err);
      });
  }

  // Lightweight backoff polling timer (every 20s) if there are pending items
  const intervalId = window.setInterval(async () => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
      const count = await getPendingOutboxCount();
      if (count > 0) {
        await drainOutboxQueue();
      }
    } catch (err) {
      console.warn('[OfflineOutbox] Periodic drain check failed:', err);
    }
  }, 20000);

  // Initial check upon listener setup
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    getPendingOutboxCount()
      .then((count) => {
        if (count > 0) {
          drainOutboxQueue().catch(() => {});
        }
      })
      .catch(() => {});
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
    window.clearInterval(intervalId);
  };
}

/**
 * Optional helper: returns all items currently in the outbox store (for UI/debugging).
 */
export async function getAllOutboxItems(): Promise<OutboxItem[]> {
  if (!isBrowser()) return [];

  try {
    const db = await getDB();
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    const store = tx.objectStore(OUTBOX_STORE);
    const req = store.getAll();
    const all = await promisifyRequest<OutboxItem[]>(req);
    return all || [];
  } catch (err) {
    console.warn('[OfflineOutbox] getAllOutboxItems failed:', err);
    return [];
  }
}

/**
 * Optional helper: removes a single item by ID from the outbox.
 */
export async function removeOutboxItem(id: string): Promise<void> {
  if (!isBrowser() || !id) return;

  try {
    const db = await getDB();
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    store.delete(id);
    await promisifyTransaction(tx);
  } catch (err) {
    console.warn('[OfflineOutbox] removeOutboxItem failed:', err);
  }
}

/**
 * Optional helper: clears cached hub data or specific code.
 */
export async function clearHubCache(code?: string): Promise<void> {
  if (!isBrowser()) return;

  try {
    const db = await getDB();
    const tx = db.transaction(HUB_STORE, 'readwrite');
    const store = tx.objectStore(HUB_STORE);
    if (code) {
      store.delete(code);
    } else {
      store.clear();
    }
    await promisifyTransaction(tx);
  } catch (err) {
    console.warn('[OfflineOutbox] clearHubCache failed:', err);
  }
}
