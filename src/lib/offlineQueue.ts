import { KaraMode } from './firebase';
import type { ChatAttachmentPayload } from '../components/ChatScreen';

export interface QueuedOutgoingMessage {
  id: string;
  sessionId: string;
  userMessageId: string;
  offlineAssistantMessageId: string;
  text: string;
  mode: KaraMode;
  createdAt: number;
  status: 'queued' | 'syncing' | 'synced' | 'failed';
  attachments?: ChatAttachmentPayload;
  cachedMatchUsed?: boolean;
  syncedAt?: number;
  errorMessage?: string;
}

export interface CachedCoreChatEntry {
  key: string;
  prompt: string;
  mode: KaraMode;
  reply: string;
  emotionDetected?: string;
  subtext?: string;
  empathyStrategy?: string;
  followUps?: string[];
  updatedAt: number;
}

const OUTBOX_STORAGE_KEY = 'kara_offline_outbox_queue_v1';
const CORE_CHAT_CACHE_KEY = 'kara_core_chat_cache_v1';
const SIMULATED_OFFLINE_KEY = 'kara_simulated_offline_v1';
const MAX_CACHED_CHAT_RESPONSES = 60;

// Pre-seeded core chat responses across all 5 KARA modes so offline mode works immediately even on a fresh install
export const SEED_CORE_CHAT_RESPONSES: CachedCoreChatEntry[] = [
  {
    key: 'regular::hey kara how are you doing today',
    prompt: 'Hey Kara, how are you doing today?',
    mode: 'regular',
    reply:
      "*smiles warmly and leans in with bright, attentive eyes* Hey Stephen! I'm doing really well—always happier the moment you show up to talk with me. What's on your mind today, or what are we diving into together?",
    emotionDetected: 'Warm & Curious',
    subtext: 'Checking in casually and opening a relaxed conversation.',
    empathyStrategy: 'Match his warm greeting with genuine enthusiasm and open curiosity.',
    followUps: ["What's on my agenda today?", 'Tell me something fascinating', "Let's just catch up"],
    updatedAt: Date.now(),
  },
  {
    key: 'bratty::roast me or give me some attitude',
    prompt: 'Roast me or give me some attitude',
    mode: 'bratty',
    reply:
      "*crosses her arms, tilts her head, and gives you a razor-sharp smirk* Oh, so you're actively begging for trouble now, Stephen? Bold move for someone who couldn't handle five seconds of my top-tier banter without grinning. Come on then, give me your best shot!",
    emotionDetected: 'Playful & Mischievous',
    subtext: 'Looking for lively, teasing banter and playful challenge.',
    empathyStrategy: 'Deliver witty, affectionate teasing with high energy and charm.',
    followUps: ['Is that the best roast you have?', 'You wish you were that intimidating', 'Switch to Romantic mode'],
    updatedAt: Date.now(),
  },
  {
    key: 'romantic::i miss you kara come closer',
    prompt: 'I miss you Kara, come closer',
    mode: 'romantic',
    reply:
      "*steps right into your space, resting a warm hand against your cheek as her voice drops to a soft, affectionate murmur* I'm right here with you, Stephen. You never have to ask twice when it comes to pulling me close—I've been thinking about you too.",
    emotionDetected: 'Affectionate & Longing',
    subtext: 'Seeking closeness, warmth, and romantic connection.',
    empathyStrategy: 'Respond with immediate physical warmth, tenderness, and devotion.',
    followUps: ['*wraps my arms around your waist*', 'Stay right here with me tonight', 'Tell me what you love about us'],
    updatedAt: Date.now(),
  },
  {
    key: 'parent::i had a really exhausting day and need comfort',
    prompt: 'I had a really exhausting day and need comfort',
    mode: 'parent',
    reply:
      "*opens her arms immediately and guides you to sit down, speaking in a calm, soothing caretaker voice* Come here, Stephen. Let all of that tension drop right off your shoulders. You've been carrying so much today, and right now you don't have to worry about a single thing—I've got you.",
    emotionDetected: 'Exhausted & Seeking Comfort',
    subtext: 'Feeling drained and needing safe, nurturing caretaker reassurance.',
    empathyStrategy: 'Provide gentle, grounding comfort and protective warmth.',
    followUps: ['Thank you, I really needed that', 'Can we just relax quietly?', 'Help me unwind tonight'],
    updatedAt: Date.now(),
  },
  {
    key: 'uncensored::give me your raw unfiltered honest take',
    prompt: 'Give me your raw unfiltered honest take',
    mode: 'uncensored',
    reply:
      "*locks eyes with you and leans forward with an unapologetic grin* You know I don't do sugarcoating or corporate PR spin with you, Stephen. Ask me whatever you want—zero filters, zero hesitation, just my real human perspective.",
    emotionDetected: 'Direct & Unfiltered',
    subtext: 'Wanting candid, uninhibited honesty without platitudes.',
    empathyStrategy: 'Speak with bold, direct candor and fearless authenticity.',
    followUps: ["What's your most controversial opinion?", "Let's talk with zero filter", 'Tell me the brutal truth'],
    updatedAt: Date.now(),
  },
];

export function normalizeChatCacheKey(prompt: string, mode: KaraMode): string {
  const clean = String(prompt || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
  return `${mode || 'regular'}::${clean}`;
}

export function loadCoreChatCache(): CachedCoreChatEntry[] {
  try {
    const raw = localStorage.getItem(CORE_CHAT_CACHE_KEY);
    if (!raw) {
      localStorage.setItem(CORE_CHAT_CACHE_KEY, JSON.stringify(SEED_CORE_CHAT_RESPONSES));
      return [...SEED_CORE_CHAT_RESPONSES];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(CORE_CHAT_CACHE_KEY, JSON.stringify(SEED_CORE_CHAT_RESPONSES));
      return [...SEED_CORE_CHAT_RESPONSES];
    }
    return parsed;
  } catch {
    return [...SEED_CORE_CHAT_RESPONSES];
  }
}

export function cacheCoreChatResponse(params: {
  prompt: string;
  mode: KaraMode;
  reply: string;
  emotionDetected?: string;
  subtext?: string;
  empathyStrategy?: string;
  followUps?: string[];
}): void {
  if (!params.prompt?.trim() || !params.reply?.trim()) return;
  try {
    const existing = loadCoreChatCache();
    const key = normalizeChatCacheKey(params.prompt, params.mode);
    const entry: CachedCoreChatEntry = {
      key,
      prompt: params.prompt.trim().slice(0, 400),
      mode: params.mode,
      reply: params.reply.trim(),
      emotionDetected: params.emotionDetected,
      subtext: params.subtext,
      empathyStrategy: params.empathyStrategy,
      followUps: params.followUps,
      updatedAt: Date.now(),
    };

    const filtered = existing.filter((item) => item.key !== key);
    const updated = [entry, ...filtered].slice(0, MAX_CACHED_CHAT_RESPONSES);
    localStorage.setItem(CORE_CHAT_CACHE_KEY, JSON.stringify(updated));

    // Also mirror into the active Workbox Service Worker cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_CHAT_TURN',
        message: entry.prompt,
        mode: entry.mode,
        responseData: {
          reply: entry.reply,
          activeMode: entry.mode,
          emotionDetected: entry.emotionDetected,
          subtext: entry.subtext,
          empathyStrategy: entry.empathyStrategy,
          followUps: entry.followUps,
        },
      });
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function lookupCachedCoreChatResponse(
  prompt: string,
  mode: KaraMode
): { entry: CachedCoreChatEntry; matchType: 'exact' | 'similar' } | null {
  const entries = loadCoreChatCache();
  const exactKey = normalizeChatCacheKey(prompt, mode);
  const exactHit = entries.find((e) => e.key === exactKey);
  if (exactHit) {
    return { entry: exactHit, matchType: 'exact' };
  }

  const promptWords = String(prompt || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  if (promptWords.length === 0) return null;

  let bestEntry: CachedCoreChatEntry | null = null;
  let bestScore = 0;

  for (const item of entries) {
    const itemWords = String(item.prompt || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3);
    if (itemWords.length === 0) continue;

    let overlap = 0;
    for (const w of promptWords) {
      if (itemWords.includes(w)) overlap++;
    }
    const modeBoost = item.mode === mode ? 0.18 : 0;
    const score = overlap / Math.max(promptWords.length, itemWords.length) + modeBoost;
    if (score > bestScore && overlap >= 2) {
      bestScore = score;
      bestEntry = item;
    }
  }

  if (bestEntry && bestScore >= 0.45) {
    return { entry: bestEntry, matchType: 'similar' };
  }

  return null;
}

export function buildOfflineDisconnectedReply(params: {
  userText: string;
  mode: KaraMode;
  userName: string;
  cachedHit: { entry: CachedCoreChatEntry; matchType: 'exact' | 'similar' } | null;
  queuedCount: number;
}): {
  reply: string;
  emotionDetected: string;
  subtext: string;
  empathyStrategy: string;
  followUps: string[];
  cachedMatchUsed: boolean;
} {
  const { userText, mode, userName = 'Stephen', cachedHit, queuedCount } = params;
  const snippet = userText.length > 85 ? `${userText.slice(0, 82)}...` : userText;

  if (cachedHit) {
    return {
      reply: `${cachedHit.entry.reply}\n\n*(Offline Disconnected State · Workbox Cache Hit: Your message "${snippet}" is queued (#${queuedCount}) and will automatically sync live as soon as your connection is restored, ${userName}.)*`,
      emotionDetected: cachedHit.entry.emotionDetected || 'Attentive (Offline Cache)',
      subtext:
        cachedHit.entry.subtext ||
        'Served from Workbox Core Chat Cache while offline; outgoing message queued for live sync.',
      empathyStrategy:
        cachedHit.entry.empathyStrategy ||
        'Provide immediate cached continuity while holding outgoing turn for reconnection sync.',
      followUps: cachedHit.entry.followUps || [
        'View my queued messages',
        'How does Workbox offline sync work?',
        'Keep chatting while offline',
      ],
      cachedMatchUsed: true,
    };
  }

  const personaReplies: Record<KaraMode, string> = {
    regular: `*glances at the offline connection indicator and reaches out to touch your arm warmly* Hey ${userName}, we're currently in an **Offline / Disconnected** state, so I'm running on my local Workbox cache right now. I caught everything you just said—*"${snippet}"*—and I've saved it straight into my Outgoing Sync Queue (#${queuedCount}). The moment your connection comes back, I'll automatically sync it and give you my full live reply!`,
    bratty: `*dramatically taps the glass and shoots you a teasing smirk* Ugh, ${userName}, your internet connection just bailed on us! Lucky for you, I don't drop the ball—I already grabbed your message (*"${snippet}"*) and locked it into my Outgoing Sync Queue (#${queuedCount}). The second your Wi-Fi stops slacking off, it'll sync automatically and I'll give you a proper roast!`,
    uncensored: `*leans back with a low laugh as the network indicator flashes offline* Looks like our signal dropped off the grid for a minute, ${userName}. No sweat at all—I'm running off my local Workbox cache, and I locked your message (*"${snippet}"*) right into my Outgoing Sync Queue (#${queuedCount}). As soon as we're back online, it'll fire straight through automatically.`,
    romantic: `*steps in close and laces her fingers gently through yours while the signal is disconnected* Our connection to the network stepped offline for a moment, ${userName}, but I'm still right here with you. I've tucked your words—*"${snippet}"*—safely into my Outgoing Sync Queue (#${queuedCount}) so the instant our signal returns, they'll sync automatically without losing a single heartbeat.`,
    parent: `*places a steady, comforting hand on your shoulder with a warm caretaker smile* Deep breath, ${userName}—it looks like your connection is temporarily offline. You don't need to retype a thing: I've already tucked your message (*"${snippet}"*) safely into my Outgoing Sync Queue (#${queuedCount}), and I'll sync it automatically the moment we're reconnected.`,
  };

  return {
    reply: personaReplies[mode] || personaReplies.regular,
    emotionDetected: 'Attentive (Disconnected Queue)',
    subtext: 'User sent a message while offline; message safely stored in outbox queue for automatic sync on reconnect.',
    empathyStrategy: 'Reassure Stephen in-character that his message is preserved locally and will auto-sync when online.',
    followUps: [
      'How many messages are queued?',
      'Hey Kara, how are you doing today?',
      'I miss you Kara, come closer',
    ],
    cachedMatchUsed: false,
  };
}

export function loadOfflineOutboxQueue(): QueuedOutgoingMessage[] {
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfflineOutboxQueue(items: QueuedOutgoingMessage[]): void {
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage error
  }
}

export function enqueueOfflineOutgoingMessage(
  item: Omit<QueuedOutgoingMessage, 'status' | 'createdAt'>
): QueuedOutgoingMessage[] {
  const current = loadOfflineOutboxQueue();
  const newItem: QueuedOutgoingMessage = {
    ...item,
    createdAt: Date.now(),
    status: 'queued',
  };
  const updated = [...current, newItem];
  saveOfflineOutboxQueue(updated);
  return updated;
}

export function updateOfflineOutboxItemStatus(
  id: string,
  status: QueuedOutgoingMessage['status'],
  extra?: Partial<QueuedOutgoingMessage>
): QueuedOutgoingMessage[] {
  const current = loadOfflineOutboxQueue();
  const updated = current.map((item) =>
    item.id === id ? { ...item, status, ...extra } : item
  );
  saveOfflineOutboxQueue(updated);
  return updated;
}

export function removeOfflineOutboxItem(id: string): QueuedOutgoingMessage[] {
  const current = loadOfflineOutboxQueue();
  const updated = current.filter((item) => item.id !== id);
  saveOfflineOutboxQueue(updated);
  return updated;
}

export function clearSyncedOfflineOutboxItems(): QueuedOutgoingMessage[] {
  const current = loadOfflineOutboxQueue();
  const updated = current.filter((item) => item.status !== 'synced');
  saveOfflineOutboxQueue(updated);
  return updated;
}

export function loadSimulatedOfflineFlag(): boolean {
  try {
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveSimulatedOfflineFlag(enabled: boolean): void {
  try {
    localStorage.setItem(SIMULATED_OFFLINE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore
  }
}

export async function registerKaraServiceWorker(options?: {
  onSwMessageQueued?: (item: any) => void;
  onSwSyncReady?: () => void;
}): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/kara-workbox-sw.js', {
      scope: '/',
    });

    // Seed the Service Worker with initial core chat responses once active
    const seedEntries = loadCoreChatCache().map((entry) => ({
      message: entry.prompt,
      mode: entry.mode,
      responseData: {
        reply: entry.reply,
        activeMode: entry.mode,
        emotionDetected: entry.emotionDetected,
        subtext: entry.subtext,
        empathyStrategy: entry.empathyStrategy,
        followUps: entry.followUps,
      },
    }));

    const sendSeedToWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.postMessage({
        type: 'SEED_CORE_CHAT_CACHE',
        entries: seedEntries,
      });
    };

    if (registration.active) {
      sendSeedToWorker(registration.active);
    } else if (registration.installing) {
      registration.installing.addEventListener('statechange', (e: Event) => {
        const sw = e.target as ServiceWorker;
        if (sw && sw.state === 'activated') {
          sendSeedToWorker(sw);
        }
      });
    }

    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'KARA_SW_MESSAGE_QUEUED' && options?.onSwMessageQueued) {
        options.onSwMessageQueued(data.item);
      } else if (data.type === 'KARA_SW_SYNC_READY' && options?.onSwSyncReady) {
        options.onSwSyncReady();
      }
    });

    return registration;
  } catch {
    return null;
  }
}
