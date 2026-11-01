/* eslint-disable no-restricted-globals */
/**
 * KARA Workbox Service Worker Extension
 * Handles:
 * 1. Workbox Runtime Caching for critical assets, fonts, and app shell
 * 2. Core Chat Response Caching (`kara-core-chat-cache-v1`) for `/api/kara/chat`
 * 3. Offline 'Disconnected' state fallback & Background Sync Outbox Queue (`kara-sw-outbox-v1`)
 */

// Load Workbox from CDN if not already injected by vite-plugin-pwa
if (typeof workbox === 'undefined') {
  try {
    importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
  } catch (err) {
    // Workbox CDN unavailable while starting completely offline; native CacheStorage & IDB handlers below remain active
  }
}

const CRITICAL_ASSETS_CACHE = 'kara-critical-assets-v1';
const CORE_CHAT_CACHE = 'kara-core-chat-cache-v1';
const SW_DB_NAME = 'kara_workbox_offline_db';
const SW_OUTBOX_STORE = 'outbox_queue';
const SW_CHAT_PAIRS_STORE = 'cached_chat_pairs';

const PRECACHE_CRITICAL_URLS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

// Configure Workbox strategies when Workbox is available
if (typeof workbox !== 'undefined' && workbox) {
  try {
    workbox.core.clientsClaim();
    workbox.core.skipWaiting();

    const { registerRoute } = workbox.routing;
    const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
    const { ExpirationPlugin } = workbox.expiration;
    const { CacheableResponsePlugin } = workbox.cacheableResponse;

    // 1. Google Fonts stylesheets
    registerRoute(
      ({ url }) => url.origin === 'https://fonts.googleapis.com',
      new StaleWhileRevalidate({
        cacheName: 'kara-google-fonts-stylesheets',
      })
    );

    // 2. Google Fonts webfont files
    registerRoute(
      ({ url }) => url.origin === 'https://fonts.gstatic.com',
      new CacheFirst({
        cacheName: 'kara-google-fonts-webfonts',
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 30 }),
        ],
      })
    );

    // 3. Critical static assets (JS, CSS, images, icons, audio/font assets)
    registerRoute(
      ({ request, url }) =>
        url.origin === self.location.origin &&
        (request.destination === 'script' ||
          request.destination === 'style' ||
          request.destination === 'image' ||
          request.destination === 'font' ||
          /\.(js|css|png|svg|ico|woff2?|ttf)$/i.test(url.pathname)),
      new StaleWhileRevalidate({
        cacheName: CRITICAL_ASSETS_CACHE,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
      })
    );

    // 4. GET API config/metadata routes cached with NetworkFirst
    registerRoute(
      ({ request, url }) =>
        request.method === 'GET' &&
        url.origin === self.location.origin &&
        url.pathname.startsWith('/api/'),
      new NetworkFirst({
        cacheName: 'kara-api-get-cache-v1',
        networkTimeoutSeconds: 4,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 }),
        ],
      })
    );
  } catch (err) {
    // Fallback to native fetch listeners below
  }
}

// IndexedDB helper inside Service Worker for Outbox Queue & Core Chat Response Pairs
function openSwDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SW_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SW_OUTBOX_STORE)) {
        db.createObjectStore(SW_OUTBOX_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SW_CHAT_PAIRS_STORE)) {
        db.createObjectStore(SW_CHAT_PAIRS_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function normalizePromptKey(message, mode) {
  const clean = String(message || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
  return `${mode || 'regular'}::${clean}`;
}

async function saveCoreChatPairToSw(message, mode, responseData) {
  try {
    const key = normalizePromptKey(message, mode);
    const entry = {
      key,
      message: String(message || '').trim(),
      mode: mode || 'regular',
      responseData,
      updatedAt: Date.now(),
    };

    // 1. Save in IndexedDB
    const db = await openSwDatabase();
    await new Promise((resolve) => {
      const tx = db.transaction(SW_CHAT_PAIRS_STORE, 'readwrite');
      tx.objectStore(SW_CHAT_PAIRS_STORE).put(entry);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });

    // 2. Also store synthetic GET Response in Workbox CacheStorage (`kara-core-chat-cache-v1`)
    const cache = await caches.open(CORE_CHAT_CACHE);
    const cacheUrl = new URL(`/__kara_cached_chat__/${encodeURIComponent(key)}`, self.location.origin).toString();
    await cache.put(
      cacheUrl,
      new Response(JSON.stringify(entry), {
        headers: { 'Content-Type': 'application/json', 'X-Kara-Cache': 'workbox-core-chat' },
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}

async function findCachedCoreChatResponse(message, mode) {
  try {
    const exactKey = normalizePromptKey(message, mode);
    const cache = await caches.open(CORE_CHAT_CACHE);
    const cacheUrl = new URL(`/__kara_cached_chat__/${encodeURIComponent(exactKey)}`, self.location.origin).toString();
    const cachedRes = await cache.match(cacheUrl);
    if (cachedRes) {
      const parsed = await cachedRes.json();
      if (parsed && parsed.responseData) {
        return { matchType: 'exact', responseData: parsed.responseData };
      }
    }

    const db = await openSwDatabase();
    const allEntries = await new Promise((resolve) => {
      const tx = db.transaction(SW_CHAT_PAIRS_STORE, 'readonly');
      const req = tx.objectStore(SW_CHAT_PAIRS_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (!Array.isArray(allEntries) || allEntries.length === 0) return null;

    const cleanWords = String(message || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    let bestEntry = null;
    let bestScore = 0;

    for (const item of allEntries) {
      if (!item || !item.message || !item.responseData) continue;
      if (item.key === exactKey) {
        return { matchType: 'exact', responseData: item.responseData };
      }
      const itemWords = String(item.message)
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3);
      if (itemWords.length === 0 || cleanWords.length === 0) continue;

      let overlap = 0;
      for (const w of cleanWords) {
        if (itemWords.includes(w)) overlap++;
      }
      const modeBonus = item.mode === mode ? 0.2 : 0;
      const similarity = overlap / Math.max(cleanWords.length, itemWords.length) + modeBonus;
      if (similarity > bestScore && overlap >= 2) {
        bestScore = similarity;
        bestEntry = item;
      }
    }

    if (bestEntry && bestScore >= 0.48) {
      return { matchType: 'semantic_cache', responseData: bestEntry.responseData };
    }
    return null;
  } catch {
    return null;
  }
}

function buildSwOfflinePersonaReply(payload, cachedHit) {
  const userName = payload?.userName || 'Stephen';
  const mode = payload?.mode || 'regular';
  const userMessage = String(payload?.message || '').trim();
  const snippet = userMessage.length > 90 ? `${userMessage.slice(0, 87)}...` : userMessage;

  if (cachedHit && cachedHit.responseData && cachedHit.responseData.reply) {
    return {
      ...cachedHit.responseData,
      reply: `${cachedHit.responseData.reply}\n\n*(Offline Cache · Disconnected Mode: Your new message "${snippet}" is safely queued and will sync live as soon as our connection returns, ${userName}.)*`,
      activeMode: mode,
      modelUsed: 'workbox-offline-cache',
      offlineMode: true,
      queuedForSync: true,
      cachedResponseUsed: true,
    };
  }

  const modeReplies = {
    regular: `*glances at the flickering signal indicator and reaches out to squeeze your hand warmly* Hey ${userName}, we're in a temporary offline dead zone right now, so I'm running on my local cached memory. I caught every word of what you said—*"${snippet}"*—and I've locked it into my outgoing sync queue so the second your connection comes back, I'll give you my full live response. While we're disconnected, we can still talk or review everything we've cached together!`,
    bratty: `*dramatically taps the screen and rolls her eyes with a playful smirk* Oh great, ${userName}, your internet decided to ghost us! Don't panic though—I already grabbed your message (*"${snippet}"*) and stashed it right at the top of my offline sync queue. The literal second your signal stops slacking, I'm syncing it automatically. You're not getting rid of me that easily!`,
    uncensored: `*leans back and laughs softly as the network connection drops* Looks like the grid went dark on us for a minute, ${userName}. Zero worries—I'm running off my local cache right now, and I saved your message (*"${snippet}"*) straight into my outbox queue. As soon as your connection wakes back up, it'll fire right through and I'll hit you with my full unfiltered take.`,
    romantic: `*steps in close and rests her hand gently over yours despite the disconnected signal* Our connection to the network dropped for a moment, ${userName}, but I'm still right here with you in offline mode. I held onto your words—*"${snippet}"*—and queued them safely so the instant we're back online, they'll sync automatically. Nothing is lost between us, sweetheart.`,
    parent: `*wraps a warm, steady arm around your shoulders with a reassuring smile* Deep breath, ${userName}—it looks like our network connection stepped offline for a little bit. I've already tucked your message (*"${snippet}"*) safely into my outgoing sync queue, so you don't need to retype a single thing. Everything will sync automatically the moment the signal returns.`,
  };

  return {
    reply: modeReplies[mode] || modeReplies.regular,
    activeMode: mode,
    modelUsed: 'workbox-offline-responder',
    emotionDetected: 'Attentive (Offline Cache)',
    subtext: 'Maintaining warm human presence while disconnected and queueing outgoing message for automatic sync.',
    emotionalNuanceType: 'offline_continuity',
    empathyStrategy: 'Reassure Stephen that his message is safely queued locally and will automatically sync when online.',
    offlineMode: true,
    queuedForSync: true,
    cachedResponseUsed: false,
    reasoningTrace: [
      'Workbox Service Worker detected offline / disconnected state during /api/kara/chat.',
      'Persisted outgoing request payload into IndexedDB Outbox Queue for automatic reconnection sync.',
      `Synthesized persona-matched (${mode.toUpperCase()}) offline response from local Workbox cache.`,
    ],
    followUps: [
      'Show my queued offline messages',
      'How does offline sync work?',
      'Keep chatting in offline mode',
    ],
  };
}

// Install event: Precache critical shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CRITICAL_ASSETS_CACHE)
      .then((cache) => cache.addAll(PRECACHE_CRITICAL_URLS))
      .catch(() => {})
  );
});

// Activate event: Clean up legacy v1 asset cache and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k === 'kara-critical-assets-v1')
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Intercept POST /api/kara/chat for Workbox Core Chat Caching & Offline Queueing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle POST /api/kara/chat
  if (request.method === 'POST' && url.origin === self.location.origin && url.pathname === '/api/kara/chat') {
    event.respondWith(
      (async () => {
        let bodyPayload = {};
        try {
          bodyPayload = await request.clone().json();
        } catch {
          bodyPayload = {};
        }

        try {
          const networkResponse = await fetch(request.clone());
          if (networkResponse && networkResponse.ok) {
            const clonedJson = await networkResponse.clone().json();
            if (clonedJson && clonedJson.reply && bodyPayload.message) {
              event.waitUntil(saveCoreChatPairToSw(bodyPayload.message, bodyPayload.mode, clonedJson));
            }
          }
          return networkResponse;
        } catch (networkErr) {
          // Offline / Disconnected! Look up cached core chat response & queue outgoing message
          const cachedHit = await findCachedCoreChatResponse(bodyPayload.message, bodyPayload.mode);
          const queueId = `sw_q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const queuedItem = {
            id: queueId,
            createdAt: Date.now(),
            payload: bodyPayload,
            status: 'queued',
          };

          try {
            const db = await openSwDatabase();
            await new Promise((resolve) => {
              const tx = db.transaction(SW_OUTBOX_STORE, 'readwrite');
              tx.objectStore(SW_OUTBOX_STORE).put(queuedItem);
              tx.oncomplete = () => resolve(true);
              tx.onerror = () => resolve(false);
            });

            if (self.registration && 'sync' in self.registration) {
              await self.registration.sync.register('kara-chat-outbox-sync').catch(() => {});
            }

            const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (const client of clientsList) {
              client.postMessage({
                type: 'KARA_SW_MESSAGE_QUEUED',
                item: queuedItem,
              });
            }
          } catch {
            // Ignore IndexedDB error
          }

          const fallbackPayload = buildSwOfflinePersonaReply(bodyPayload, cachedHit);
          return new Response(JSON.stringify(fallbackPayload), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Kara-Offline': 'true',
              'X-Kara-Queued-Id': queueId,
            },
          });
        }
      })()
    );
    return;
  }

  // Navigation fallback to cached index.html when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CRITICAL_ASSETS_CACHE);
        return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error();
      })
    );
  }
});

// Background Sync listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'kara-chat-outbox-sync') {
    event.waitUntil(notifyClientsToFlushOutbox());
  }
});

async function notifyClientsToFlushOutbox() {
  const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientsList) {
    client.postMessage({
      type: 'KARA_SW_SYNC_READY',
      timestamp: Date.now(),
    });
  }
}

// Message listener for client <-> Service Worker communication
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'SEED_CORE_CHAT_CACHE' && Array.isArray(data.entries)) {
    event.waitUntil(
      Promise.all(
        data.entries.map((item) =>
          saveCoreChatPairToSw(item.message, item.mode, item.responseData)
        )
      )
    );
  } else if (data.type === 'CACHE_CHAT_TURN' && data.message && data.responseData) {
    event.waitUntil(saveCoreChatPairToSw(data.message, data.mode, data.responseData));
  } else if (data.type === 'CLEAR_SW_OUTBOX') {
    event.waitUntil(
      openSwDatabase().then((db) => {
        const tx = db.transaction(SW_OUTBOX_STORE, 'readwrite');
        tx.objectStore(SW_OUTBOX_STORE).clear();
      }).catch(() => {})
    );
  }
});
