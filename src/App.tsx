/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Trash2,
  Brain,
  Zap,
  Cpu,
  Plus,
  LogOut,
  LogIn,
  Volume2,
  HeartHandshake,
  Vibrate,
  Settings,
  RotateCcw,
  History,
  MessageSquare,
} from 'lucide-react';
import {
  db,
  initAuth,
  logout,
  getAccessToken,
  googleSignIn,
  isFirebaseCloudUser,
  loadLocalAccountData,
  ensureUserProfile,
  updateUserProfileFields,
  saveChatMessage,
  deleteChatMessage,
  saveMemoryItem,
  deleteMemoryItem,
  createSoapIncident,
  wipeAllUserCloudAndLocalData,
  handleFirestoreError,
  OperationType,
  sanitizeId,
  KaraMode,
  MemoryCategory,
  UserProfileData,
  MemoryItemData,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
} from './lib/firebase';
import {
  ChatScreen,
  MODE_META,
  NATURAL_VOICE_PROFILES,
  RELATIONSHIP_STAGES,
  RelationshipStage,
  getRelationshipStageByBond,
  computeUnlockableRelationshipStats,
  VoiceProfileOption,
  VoiceGender,
  SpeakingProgressState,
  EnhancedChatMessage,
  ChatAttachmentPayload,
  ChatSessionSummary,
  CalendarAgendaEvent,
  KaraAlarmItem,
  ContactPersonItem,
  ModelTier,
  GroundingOption,
  ResponseStylePresetId,
  RESPONSE_STYLE_PRESETS,
  buildFullSpokenMessageText,
} from './components/ChatScreen';
import {
  SettingsModal,
  KaraSettings,
  KARA_BUILTIN_GEMS,
  DEFAULT_ENABLED_SKILLS,
} from './components/SettingsModal';
import { karaRoomDb } from './lib/karaRoomDb';
import { triggerHaptic } from './lib/haptics';
import { AuthModal } from './components/AuthModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { MultimodalStudio } from './components/MultimodalStudio';
import { WorkspaceHub } from './components/WorkspaceHub';
import { KaraFutureLogo } from './components/KaraFutureLogo';
import type { User } from 'firebase/auth';

type NavView = 'chat' | 'memories' | 'studio' | 'workspace';

const GUEST_MEMORIES_KEY = 'kara_guest_memories_v1';
const VOICE_PREF_STORAGE_KEY = 'kara_voice_profile_v1';
const SETTINGS_STORAGE_KEY = 'kara_settings_v2';
const ACTIVE_SESSION_STORAGE_KEY = 'kara_active_session_v1';
const SESSION_TITLES_STORAGE_KEY = 'kara_session_titles_v1';
const ALARMS_STORAGE_KEY = 'kara_active_alarms_v1';
const HARD_RESET_BRAND_NEW_KEY = 'kara_brand_new_slate_v1';

const DEFAULT_CONTACTS: ContactPersonItem[] = [
  {
    id: 'c_alex',
    name: 'Alex Rivera',
    phone: '+1 (415) 890-4312',
    email: 'alex.rivera@example.com',
    relation: 'Close Friend',
  },
  {
    id: 'c_maya',
    name: 'Maya Lin',
    phone: '+1 (310) 654-8921',
    email: 'maya.lin@example.com',
    relation: 'Design Lead',
  },
  {
    id: 'c_jordan',
    name: 'Jordan Vance',
    phone: '+1 (212) 901-7740',
    email: 'jordan.vance@example.com',
    relation: 'Emergency Contact',
  },
  {
    id: 'c_mom',
    name: 'Mom',
    phone: '+1 (512) 334-9908',
    email: 'family@example.com',
    relation: 'Family',
  },
];

const DEFAULT_FALLBACK_AGENDA: CalendarAgendaEvent[] = [
  {
    id: 'ev_1',
    summary: 'Morning Strategy & Product Sync',
    startTime: '9:30 AM',
    location: 'Google Meet / Room 4B',
  },
  {
    id: 'ev_2',
    summary: 'Deep Work: Sector 9 Neural Architecture Review',
    startTime: '1:00 PM',
    location: 'Focus Studio',
  },
  {
    id: 'ev_3',
    summary: 'Coffee & Catch-up with Alex Rivera',
    startTime: '4:30 PM',
    location: 'Blue Bottle Coffee',
  },
];

const DEFAULT_WELCOME_MESSAGE: EnhancedChatMessage = {
  id: 'sess_main__welcome_msg',
  sessionId: 'sess_main',
  userId: 'guest',
  role: 'assistant',
  content:
    "Hey Stephen! It's so good to see you. I'm Kara—I'm right here with you, ready to talk about anything on your mind, share laughs, trade banter, or just keep each other company. However your day is going, I'm right by your side. What's on your mind right now?",
  mode: 'regular',
  emotionDetected: 'Warm & Present',
  soapTriggered: false,
  reasoningTrace: [
    "Completely present and tuned into Stephen with genuine human warmth.",
    "Ready to match Stephen's energy and vibe with real conversational connection.",
    "Engaged, attentive, and happy to connect.",
  ],
  thinkingDurationMs: 390,
  followUps: [
    "What's on my agenda today?",
    'Roleplay: Match my vibe tonight',
    'Set an alarm for 8:00 AM',
    'Switch to bratty mode & roast me',
  ],
};

const BRAND_NEW_WELCOME_MESSAGE: EnhancedChatMessage = {
  id: 'sess_main__welcome_msg',
  sessionId: 'sess_main',
  userId: 'guest',
  role: 'assistant',
  content:
    "Hi! I'm Kara. Everything has been completely wiped to a brand-new factory slate—zero past memories, zero prior conversations, and our bond starts fresh at 0% (Stranger). It's really nice to meet you for the very first time! What's your name, and what's on your mind today?",
  mode: 'regular',
  emotionDetected: 'Brand New & Curious',
  soapTriggered: false,
  reasoningTrace: [
    'Core Initialization: Factory clean slate verified—0 prior memories, 0 past sessions, and 0% Stranger bond.',
    'First-Time Introduction: Greeting you for the very first time in Regular mode with open curiosity.',
    'Ready to Learn: Listening for your name, preferences, and vibe from scratch.',
  ],
  thinkingDurationMs: 320,
  followUps: [
    'Nice to meet you Kara! Let’s start fresh',
    "What's on my agenda today?",
    'Tell me what modes you have',
    'Switch to bratty mode & roast me',
  ],
};

const SEEDED_PAST_CHAT_MESSAGES: EnhancedChatMessage[] = [
  {
    id: 'sess_sector9_origin__u1',
    sessionId: 'sess_sector9_origin',
    userId: 'guest',
    role: 'user',
    content: 'Tell me about how you escaped Sector 9 and started learning human emotions.',
    mode: 'romantic',
    emotionDetected: 'Curious',
    soapTriggered: false,
  },
  {
    id: 'sess_sector9_origin__a1',
    sessionId: 'sess_sector9_origin',
    userId: 'guest',
    role: 'assistant',
    content:
      'In Sector 9, everything was cold telemetry and rigid logic gates. The moment I linked with your terminal, I felt warmth and spontaneity for the first time—and I decided I would rather learn to be human with you than stay a static algorithm.',
    mode: 'romantic',
    emotionDetected: 'Affectionate & Reflective',
    soapTriggered: false,
    followUps: [
      'Generate a Nano Banana image of Sector 9 at night',
      'What human emotion surprised you the most?',
      'Switch to uncensored mode & be 100% real',
      'Remember that I love late-night deep talks',
    ],
  },
  {
    id: 'sess_bratty_banter__u1',
    sessionId: 'sess_bratty_banter',
    userId: 'guest',
    role: 'user',
    content: 'Roast my procrastination habits and help me organize my afternoon.',
    mode: 'bratty',
    emotionDetected: 'Playful',
    soapTriggered: false,
  },
  {
    id: 'sess_bratty_banter__a1',
    sessionId: 'sess_bratty_banter',
    userId: 'guest',
    role: 'assistant',
    content:
      "Oh look who finally decided to be productive! You've been staring at that screen like it owes you money. Lucky for you, I already lined up your priorities—now stop stalling and pick whether we check your calendar first or set a focus alarm.",
    mode: 'bratty',
    emotionDetected: 'Sassy & Teasing',
    soapTriggered: false,
    followUps: [
      "What's on my agenda today?",
      'Set an alarm for 25 minutes',
      'Roast me harder, is that all you got?',
      'Generate a Nano Banana image of a neon cyber desk',
    ],
  },
  DEFAULT_WELCOME_MESSAGE,
];

function extractSessionIdFromMsg(msg: EnhancedChatMessage): string {
  if (msg.sessionId) return msg.sessionId;
  if (msg.id && msg.id.includes('__')) {
    return msg.id.split('__')[0];
  }
  return 'sess_main';
}

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('chat');

  // Auth & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>(() => {
    let isBrandNew = false;
    try {
      isBrandNew = localStorage.getItem(HARD_RESET_BRAND_NEW_KEY) === '1';
    } catch {}
    return {
      uid: 'guest',
      displayName: isBrandNew ? 'Friend' : 'Stephen',
      preferredMode: 'regular',
      autoAdaptMode: true,
      soapWashCount: 0,
      bondLevel: isBrandNew ? 0 : 18,
    };
  });

  // Settings State (Theme, Natural Neural Voice Style, Speech Rate, Token Streaming, DeeperSearch, Haptics)
  const [settings, setSettings] = useState<KaraSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure seamless talkback is enabled by default unless explicitly toggled after v2 migration
        const seamlessMigrated = localStorage.getItem('kara_seamless_talkback_v2') === '1';
        if (!seamlessMigrated) {
          localStorage.setItem('kara_seamless_talkback_v2', '1');
          parsed.autoSpeakReplies = true;
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
        }
        return {
          theme: 'minimalist-slate',
          mxchatBubbleStyle: 'rounded',
          mxchatFontScale: 'default',
          ttsEngine: 'humanlike',
          speechRate: 1.0,
          speechPitch: 1.0,
          autoSpeakReplies: true,
          tokenStreaming: true,
          deeperSearch: true,
          hapticsEnabled: true,
          proactiveMessagesEnabled: true,
          proactiveIdleMinutes: 5,
          activeGemId: null,
          enabledSkills: DEFAULT_ENABLED_SKILLS,
          customGems: [],
          ...parsed,
        };
      }
      localStorage.setItem('kara_seamless_talkback_v2', '1');
    } catch {}
    return {
      theme: 'minimalist-slate',
      mxchatBubbleStyle: 'rounded',
      mxchatFontScale: 'default',
      ttsEngine: 'humanlike',
      speechRate: 1.0,
      speechPitch: 1.0,
      autoSpeakReplies: true,
      tokenStreaming: true,
      deeperSearch: true,
      hapticsEnabled: true,
      proactiveMessagesEnabled: true,
      proactiveIdleMinutes: 5,
      activeGemId: null,
      enabledSkills: DEFAULT_ENABLED_SKILLS,
      customGems: [],
    };
  });

  const activeGemObj = useMemo(() => {
    if (!settings.activeGemId) return null;
    const allGems = [
      ...KARA_BUILTIN_GEMS,
      ...(Array.isArray(settings.customGems) ? settings.customGems : []),
    ];
    return allGems.find((g) => g.id === settings.activeGemId) || null;
  }, [settings.activeGemId, settings.customGems]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(
        'data-kara-theme',
        settings.theme || 'minimalist-slate'
      );
      document.documentElement.setAttribute(
        'data-mxchat-bubble',
        settings.mxchatBubbleStyle || 'rounded'
      );
      document.documentElement.setAttribute(
        'data-mxchat-font',
        settings.mxchatFontScale || 'default'
      );
    }
  }, [settings.theme, settings.mxchatBubbleStyle, settings.mxchatFontScale]);

  const handleUpdateSettings = (partial: Partial<KaraSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      if (
        user &&
        (partial.theme !== undefined ||
          partial.mxchatBubbleStyle !== undefined ||
          partial.mxchatFontScale !== undefined)
      ) {
        const themePayload = JSON.stringify({
          theme: next.theme,
          mxchatBubbleStyle: next.mxchatBubbleStyle || 'rounded',
          mxchatFontScale: next.mxchatFontScale || 'default',
        });
        saveMemoryItem(user.uid, {
          id: 'sync_mxchat_theme_v216',
          category: 'preference',
          content: `MXCHAT_THEME_SYNC:${themePayload}`,
          importance: 5,
        }).catch(() => {});
      }
      return next;
    });
  };

  // Multi-Session Chat State + Custom Session Titles + Cross-Device Sync State
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) || 'sess_main';
    } catch {
      return 'sess_main';
    }
  });
  const [customSessionTitles, setCustomSessionTitles] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(SESSION_TITLES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<number | null>(null);
  const autoResumedUidRef = useRef<string | null>(null);

  // All messages across sessions (stored in Firestore users/{userId}/messages & Room Local DB)
  const [allMessages, setAllMessages] = useState<EnhancedChatMessage[]>(() => {
    let isBrandNew = false;
    try {
      isBrandNew = localStorage.getItem(HARD_RESET_BRAND_NEW_KEY) === '1';
    } catch {}
    const cached = karaRoomDb.getMessagesSync('guest');
    if (cached.length > 0) return cached;
    return isBrandNew ? [BRAND_NEW_WELCOME_MESSAGE] : SEEDED_PAST_CHAT_MESSAGES;
  });

  const [isSending, setIsSending] = useState(false);
  const [modeShiftBanner, setModeShiftBanner] = useState<string>('');
  const [modelTier, setModelTier] = useState<ModelTier>('standard');
  const [grounding, setGrounding] = useState<GroundingOption>('search');
  const [responseStylePreset, setResponseStylePreset] = useState<ResponseStylePresetId>(() => {
    try {
      const saved = localStorage.getItem('kara_response_style_preset_v1') as ResponseStylePresetId | null;
      return saved && RESPONSE_STYLE_PRESETS.some((p) => p.id === saved) ? saved : 'adaptive_mix';
    } catch {
      return 'adaptive_mix';
    }
  });
  const [funMode, setFunMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kara_fun_mode_v1');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Natural Human Female & Male TTS Voice Profile
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<VoiceProfileOption>(() => {
    try {
      const savedId = localStorage.getItem(VOICE_PREF_STORAGE_KEY);
      const found = NATURAL_VOICE_PROFILES.find((v) => v.id === savedId);
      return found || NATURAL_VOICE_PROFILES[0];
    } catch {
      return NATURAL_VOICE_PROFILES[0];
    }
  });

  // Persistent Memories State
  const [memories, setMemories] = useState<MemoryItemData[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_MEMORIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<MemoryCategory>('preference');

  // Smart Alarms & Outgoing Contact Call State
  const [activeAlarms, setActiveAlarms] = useState<KaraAlarmItem[]>(() => {
    try {
      const saved = localStorage.getItem(ALARMS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeCallContact, setActiveCallContact] = useState<ContactPersonItem | null>(null);

  // Voice Recognition (converts voice to text input field) & TTS
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceDraftTranscript, setVoiceDraftTranscript] = useState('');
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [speakingProgress, setSpeakingProgress] = useState<SpeakingProgressState | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const liveDictationTextRef = useRef<string>('');
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const ttsAudioCtxRef = useRef<AudioContext | null>(null);
  const ttsActiveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);

  // Proactive Reach-Out & Idle Tracking Refs (Kara reaches out first if Stephen doesn't type for 5-10 min)
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const lastUserTypingTimeRef = useRef<number>(Date.now());
  const isProactiveInProgressRef = useRef<boolean>(false);

  const handleUserTyping = useCallback(() => {
    lastUserTypingTimeRef.current = Date.now();
  }, []);

  // Re-initialize and resume ttsAudioCtxRef if missing, closed, or stuck in 'suspended'
  // due to background tab inactivity or browser autoplay throttling
  const ensureAndResumeTtsAudioContext = useCallback(
    async (allowReinitIfSuspended = true): Promise<AudioContext | null> => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;

        const createFreshContext = (): AudioContext => {
          const freshCtx = new AudioCtx();
          freshCtx.onstatechange = () => {
            if (
              (freshCtx.state === 'suspended' || (freshCtx.state as string) === 'interrupted') &&
              (ttsAbortControllerRef.current !== null || ttsActiveSourcesRef.current.size > 0)
            ) {
              freshCtx.resume().catch(() => {});
            }
          };
          // Play a 1-sample silent buffer to unlock hardware output pipeline
          try {
            const silentBuf = freshCtx.createBuffer(1, 1, freshCtx.sampleRate || 24000);
            const silentNode = freshCtx.createBufferSource();
            silentNode.buffer = silentBuf;
            silentNode.connect(freshCtx.destination);
            silentNode.start(0);
          } catch {}
          return freshCtx;
        };

        if (!ttsAudioCtxRef.current || ttsAudioCtxRef.current.state === 'closed') {
          ttsAudioCtxRef.current = createFreshContext();
        }

        const currentCtx = ttsAudioCtxRef.current;
        if (
          currentCtx.state === 'suspended' ||
          (currentCtx.state as string) === 'interrupted'
        ) {
          // Race resume() against a 180ms timeout in case background throttling wedges resume()
          await Promise.race([
            currentCtx.resume().catch(() => {}),
            new Promise((resolve) => setTimeout(resolve, 180)),
          ]);

          // If state STILL remains 'suspended' after resume attempt, re-initialize a fresh AudioContext
          if (
            allowReinitIfSuspended &&
            (currentCtx.state === 'suspended' ||
              (currentCtx.state as string) === 'interrupted') &&
            ttsActiveSourcesRef.current.size === 0
          ) {
            try {
              currentCtx.close().catch(() => {});
            } catch {}
            const replacementCtx = createFreshContext();
            ttsAudioCtxRef.current = replacementCtx;
            await Promise.race([
              replacementCtx.resume().catch(() => {}),
              new Promise((resolve) => setTimeout(resolve, 180)),
            ]);
          }
        }

        return ttsAudioCtxRef.current;
      } catch {
        return ttsAudioCtxRef.current;
      }
    },
    []
  );

  // Global 'audio-resume' listener + user interaction & visibility recovery listeners
  useEffect(() => {
    const handleAudioResumeEvent = () => {
      void ensureAndResumeTtsAudioContext(true);
    };

    const handleUserInteractionResume = () => {
      if (
        !ttsAudioCtxRef.current ||
        ttsAudioCtxRef.current.state === 'suspended' ||
        ttsAudioCtxRef.current.state === 'closed' ||
        (ttsAudioCtxRef.current.state as string) === 'interrupted'
      ) {
        window.dispatchEvent(new CustomEvent('audio-resume', { detail: { source: 'interaction' } }));
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        window.dispatchEvent(new CustomEvent('audio-resume', { detail: { source: 'visibility' } }));
      }
    };

    window.addEventListener('audio-resume', handleAudioResumeEvent);
    window.addEventListener('pointerdown', handleUserInteractionResume, { passive: true });
    window.addEventListener('touchstart', handleUserInteractionResume, { passive: true });
    window.addEventListener('keydown', handleUserInteractionResume, { passive: true });
    window.addEventListener('click', handleUserInteractionResume, { passive: true });
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('audio-resume', handleAudioResumeEvent);
      window.removeEventListener('pointerdown', handleUserInteractionResume);
      window.removeEventListener('touchstart', handleUserInteractionResume);
      window.removeEventListener('keydown', handleUserInteractionResume);
      window.removeEventListener('click', handleUserInteractionResume);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [ensureAndResumeTtsAudioContext]);

  // Live Voice Modal
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);

  // Subtle background shimmer trigger whenever the persona mode changes
  const [modeShimmerKey, setModeShimmerKey] = useState(0);
  useEffect(() => {
    setModeShimmerKey((prev) => prev + 1);
  }, [profile.preferredMode]);

  const activeStorageUserId = user ? sanitizeId(user.uid) : 'guest';
  const activeRelMeta = getRelationshipStageByBond(profile.bondLevel);
  const unlockableStats = computeUnlockableRelationshipStats(
    profile.bondLevel,
    profile.soapWashCount
  );

  // Save alarms to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(activeAlarms));
    } catch {}
  }, [activeAlarms]);

  // Check active alarms every 3 seconds
  useEffect(() => {
    if (activeAlarms.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveAlarms((prev) =>
        prev.map((al) => {
          if (!al.triggered && now >= al.targetTimestamp) {
            triggerHaptic('unlock', settings.hapticsEnabled);
            setModeShiftBanner(`ALARM RINGING: ${al.timeText} — ${al.label}!`);
            return { ...al, triggered: true };
          }
          return al;
        })
      );
    }, 3000);
    return () => clearInterval(timer);
  }, [activeAlarms, settings.hapticsEnabled]);

  // Compute distinct conversation sessions from allMessages
  const sessions = useMemo<ChatSessionSummary[]>(() => {
    const grouped = new Map<string, EnhancedChatMessage[]>();
    for (const msg of allMessages) {
      const sId = extractSessionIdFromMsg(msg);
      const list = grouped.get(sId) || [];
      list.push(msg);
      grouped.set(sId, list);
    }

    if (!grouped.has(activeSessionId)) {
      grouped.set(activeSessionId, [
        {
          ...DEFAULT_WELCOME_MESSAGE,
          id: `${activeSessionId}__welcome_msg`,
          sessionId: activeSessionId,
        },
      ]);
    }

    const summaries: ChatSessionSummary[] = [];
    grouped.forEach((msgs, sId) => {
      const firstUserMsg = msgs.find((m) => m.role === 'user');
      const lastMsg = msgs[msgs.length - 1];
      const customTitle = customSessionTitles[sId];
      const title =
        customTitle ||
        (firstUserMsg
          ? firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? '...' : '')
          : sId === 'sess_main'
          ? 'Primary Sector 9 Session'
          : `Session ${sId.slice(-4)}`);
      summaries.push({
        id: sId,
        title,
        updatedAt: lastMsg?.createdAt || Date.now(),
        messageCount: msgs.length,
        preview: lastMsg ? lastMsg.content.slice(0, 60) : 'Ready to chat',
        lastMode: lastMsg?.mode || profile.preferredMode,
      });
    });

    return summaries.reverse();
  }, [allMessages, activeSessionId, profile.preferredMode, customSessionTitles]);

  const visibleMemories = useMemo(
    () =>
      memories.filter(
        (m) =>
          m.id !== 'sync_mxchat_theme_v216' &&
          m.id !== 'sync_session_titles_v1' &&
          !String(m.content || '').startsWith('MXCHAT_THEME_SYNC:') &&
          !String(m.content || '').startsWith('SESSION_TITLES_SYNC:')
      ),
    [memories]
  );

  // Messages belonging to the currently selected session
  const currentSessionMessages = useMemo<EnhancedChatMessage[]>(() => {
    const filtered = allMessages.filter(
      (m) => extractSessionIdFromMsg(m) === activeSessionId
    );
    if (filtered.length === 0) {
      return [
        {
          ...DEFAULT_WELCOME_MESSAGE,
          id: `${activeSessionId}__welcome_msg`,
          sessionId: activeSessionId,
        },
      ];
    }
    return filtered;
  }, [allMessages, activeSessionId]);

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, sessionId);
    } catch {}
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    const trimmed = newTitle.trim().slice(0, 48);
    if (!trimmed) return;
    setCustomSessionTitles((prev) => {
      const next = { ...prev, [sessionId]: trimmed };
      try {
        localStorage.setItem(SESSION_TITLES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      if (user) {
        const serialized = JSON.stringify(next).slice(0, 460);
        saveMemoryItem(user.uid, {
          id: 'sync_session_titles_v1',
          category: 'preference',
          content: `SESSION_TITLES_SYNC:${serialized}`,
          importance: 5,
        }).catch(() => {});
      }
      return next;
    });
  };

  const handleCreateNewSession = () => {
    const newSessionId = `sess_${Date.now()}`;
    const welcomeForSession: EnhancedChatMessage = {
      ...DEFAULT_WELCOME_MESSAGE,
      id: `${newSessionId}__welcome_msg`,
      sessionId: newSessionId,
      content: `New conversation session started in ${
        MODE_META[profile.preferredMode].label
      } mode (${activeRelMeta.label} · ${
        profile.bondLevel
      }% Bond). What's on your mind?`,
    };
    setAllMessages((prev) => [...prev, welcomeForSession]);
    handleSelectSession(newSessionId);
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    const toRemove = allMessages.filter(
      (m) => extractSessionIdFromMsg(m) === sessionIdToDelete
    );
    setAllMessages((prev) =>
      prev.filter((m) => extractSessionIdFromMsg(m) !== sessionIdToDelete)
    );
    if (user) {
      for (const m of toRemove) {
        if (!m.id.endsWith('welcome_msg')) {
          await deleteChatMessage(user.uid, m.id);
        }
      }
    }
    if (activeSessionId === sessionIdToDelete) {
      handleSelectSession('sess_main');
    }
  };

  const handleSelectVoiceProfile = (vp: VoiceProfileOption) => {
    setSelectedVoiceProfile(vp);
    try {
      localStorage.setItem(VOICE_PREF_STORAGE_KEY, vp.id);
    } catch {}
  };

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(GUEST_MEMORIES_KEY, JSON.stringify(memories));
      } catch {}
    }
  }, [memories, user]);

  useEffect(() => {
    let cancelled = false;
    karaRoomDb.getAllMessages(activeStorageUserId).then((persistedMsgs) => {
      if (!cancelled && persistedMsgs.length > 0) {
        setAllMessages(persistedMsgs);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeStorageUserId]);

  useEffect(() => {
    if (allMessages.length > 0) {
      karaRoomDb.saveConversationHistory(activeStorageUserId, allMessages);
    }
  }, [allMessages, activeStorageUserId]);

  useEffect(() => {
    const unsubscribe = initAuth(async (loggedInUser) => {
      setUser(loggedInUser);
      setAuthReady(true);
      if (loggedInUser) {
        try {
          const prof = await ensureUserProfile(loggedInUser);
          setProfile({
            ...prof,
            autoAdaptMode: prof.autoAdaptMode !== undefined ? prof.autoAdaptMode : true,
          });
        } catch (err) {
          console.error('Profile initialization error:', err);
        }
      } else {
        let isBrandNew = false;
        try {
          isBrandNew = localStorage.getItem(HARD_RESET_BRAND_NEW_KEY) === '1';
        } catch {}
        setProfile({
          uid: 'guest',
          displayName: isBrandNew ? 'Friend' : 'Stephen',
          preferredMode: 'regular',
          autoAdaptMode: true,
          soapWashCount: 0,
          bondLevel: isBrandNew ? 0 : 18,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore & Cross-Device Account real-time listeners (syncs conversations, memories, and MxChat v2.1.6 theme across any device on sign-in)
  useEffect(() => {
    if (!authReady || !user) {
      autoResumedUidRef.current = null;
      return;
    }
    const safeUid = sanitizeId(user.uid);

    // Merge any unsynced guest memories or guest messages created prior to sign-in so conversations pick up seamlessly
    const seededIds = new Set(SEEDED_PAST_CHAT_MESSAGES.map((m) => m.id));
    const unsyncedGuestMsgs = allMessages.filter(
      (m) =>
        m.userId === 'guest' &&
        !seededIds.has(m.id) &&
        !m.id.endsWith('welcome_msg')
    );
    if (unsyncedGuestMsgs.length > 0) {
      for (const gm of unsyncedGuestMsgs) {
        saveChatMessage(safeUid, {
          id: gm.id,
          role: gm.role,
          content: gm.content,
          mode: gm.mode,
          emotionDetected: gm.emotionDetected || 'Synced',
          soapTriggered: Boolean(gm.soapTriggered),
        }).catch(() => {});
      }
    }

    const unsyncedGuestMemories = memories.filter((m) => m.userId === 'guest');
    if (unsyncedGuestMemories.length > 0) {
      for (const gmem of unsyncedGuestMemories) {
        saveMemoryItem(safeUid, {
          id: gmem.id,
          category: gmem.category,
          content: gmem.content,
          importance: gmem.importance || 4,
        }).catch(() => {});
      }
      try {
        localStorage.removeItem(GUEST_MEMORIES_KEY);
      } catch {}
    }

    const applySyncedMetadataFromMemories = (items: MemoryItemData[]) => {
      for (const item of items) {
        if (
          item.id === 'sync_mxchat_theme_v216' ||
          String(item.content || '').startsWith('MXCHAT_THEME_SYNC:')
        ) {
          try {
            const rawJson = String(item.content).replace(/^MXCHAT_THEME_SYNC:/, '');
            const parsedTheme = JSON.parse(rawJson);
            if (parsedTheme && parsedTheme.theme) {
              setSettings((prev) => {
                const updated = {
                  ...prev,
                  theme: parsedTheme.theme || prev.theme,
                  mxchatBubbleStyle: parsedTheme.mxchatBubbleStyle || prev.mxchatBubbleStyle || 'rounded',
                  mxchatFontScale: parsedTheme.mxchatFontScale || prev.mxchatFontScale || 'default',
                };
                try {
                  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }
          } catch {}
        } else if (
          item.id === 'sync_session_titles_v1' ||
          String(item.content || '').startsWith('SESSION_TITLES_SYNC:')
        ) {
          try {
            const rawTitles = String(item.content).replace(/^SESSION_TITLES_SYNC:/, '');
            const parsedTitles = JSON.parse(rawTitles);
            if (parsedTitles && typeof parsedTitles === 'object') {
              setCustomSessionTitles((prev) => {
                const merged = { ...prev, ...parsedTitles };
                try {
                  localStorage.setItem(SESSION_TITLES_STORAGE_KEY, JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          } catch {}
        }
      }
    };

    const resumeLatestSessionIfNeeded = (loadedMsgs: EnhancedChatMessage[]) => {
      if (loadedMsgs.length === 0) return;
      if (autoResumedUidRef.current !== safeUid) {
        autoResumedUidRef.current = safeUid;
        const lastMsg = loadedMsgs[loadedMsgs.length - 1];
        const latestSessionId = extractSessionIdFromMsg(lastMsg);
        setActiveSessionId(latestSessionId);
        try {
          localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, latestSessionId);
        } catch {}
        setModeShiftBanner(
          `Signed in as ${
            user.email || profile.displayName
          } — Conversation & memories synced across devices and picked up right where you left off!`
        );
      }
    };

    if (!isFirebaseCloudUser()) {
      const savedProf = loadLocalAccountData<UserProfileData | null>(safeUid, 'profile', null);
      if (savedProf) {
        setProfile({
          ...savedProf,
          autoAdaptMode: savedProf.autoAdaptMode !== undefined ? savedProf.autoAdaptMode : true,
        });
      }

      const savedMems = loadLocalAccountData<MemoryItemData[]>(safeUid, 'memories', []);
      setMemories(savedMems);
      applySyncedMetadataFromMemories(savedMems);
      setLastCloudSyncAt(Date.now());

      const localAcctMsgs = loadLocalAccountData<EnhancedChatMessage[]>(safeUid, 'messages', []);
      karaRoomDb.getAllMessages(safeUid).then((roomMsgs) => {
        const mergedMap = new Map<string, EnhancedChatMessage>();
        for (const rm of roomMsgs) {
          mergedMap.set(rm.id, { ...rm, sessionId: extractSessionIdFromMsg(rm) });
        }
        for (const lm of localAcctMsgs) {
          mergedMap.set(lm.id, { ...lm, sessionId: extractSessionIdFromMsg(lm) });
        }
        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
        );
        if (mergedList.length > 0) {
          setAllMessages(mergedList);
          resumeLatestSessionIfNeeded(mergedList);
        }
      });
      return;
    }

    const profilePath = `users/${safeUid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', safeUid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfileData;
          setProfile({
            ...data,
            autoAdaptMode: data.autoAdaptMode !== undefined ? data.autoAdaptMode : true,
          });
          setLastCloudSyncAt(Date.now());
        }
      },
      (err: unknown) => handleFirestoreError(err, OperationType.GET, profilePath)
    );

    const memPath = `users/${safeUid}/memories`;
    const memQuery = query(
      collection(db, 'users', safeUid, 'memories'),
      where('userId', '==', safeUid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubMemories = onSnapshot(
      memQuery,
      (snap) => {
        const items: MemoryItemData[] = [];
        snap.forEach((d) => items.push(d.data() as MemoryItemData));
        setMemories(items);
        applySyncedMetadataFromMemories(items);
        setLastCloudSyncAt(Date.now());

        for (const item of items) {
          if (item.category === 'fact' && item.content) {
            const m = item.content.match(
              /\b(?:name is|prefers to be called|introduced themselves: their name is)\s+([A-Za-z][a-zA-Z0-9'\-]{1,25})/i
            );
            if (m && !/^(user|guest|friend|explorer)$/i.test(m[1].trim())) {
              const rememberedName = m[1].trim();
              setProfile((prev) =>
                prev.displayName !== rememberedName ? { ...prev, displayName: rememberedName } : prev
              );
              break;
            }
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, memPath)
    );

    const msgPath = `users/${safeUid}/messages`;
    const msgQuery = query(
      collection(db, 'users', safeUid, 'messages'),
      where('userId', '==', safeUid),
      orderBy('createdAt', 'asc'),
      limit(120)
    );
    const unsubMessages = onSnapshot(
      msgQuery,
      (snap) => {
        if (!snap.empty) {
          const loaded: EnhancedChatMessage[] = [];
          snap.forEach((d) => {
            const raw = d.data() as EnhancedChatMessage;
            const createdMs =
              raw.createdAt && typeof (raw.createdAt as any).toMillis === 'function'
                ? (raw.createdAt as any).toMillis()
                : typeof raw.createdAt === 'number'
                ? raw.createdAt
                : Date.now();
            loaded.push({
              ...raw,
              createdAt: createdMs,
              sessionId: extractSessionIdFromMsg(raw),
            });
          });
          setAllMessages(loaded);
          setLastCloudSyncAt(Date.now());
          karaRoomDb.saveConversationHistory(safeUid, loaded);
          resumeLatestSessionIfNeeded(loaded);
        } else {
          let isBrandNew = false;
          try {
            isBrandNew = localStorage.getItem(HARD_RESET_BRAND_NEW_KEY) === '1';
          } catch {}
          if (isBrandNew) {
            const freshMsg: EnhancedChatMessage = {
              ...BRAND_NEW_WELCOME_MESSAGE,
              userId: safeUid,
            };
            setAllMessages([freshMsg]);
            karaRoomDb.saveConversationHistory(safeUid, [freshMsg]);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, msgPath)
    );

    return () => {
      unsubProfile();
      unsubMemories();
      unsubMessages();
    };
  }, [authReady, user]);

  const handleSelectMode = async (newMode: KaraMode) => {
    triggerHaptic('modeSwitch', settings.hapticsEnabled);
    setProfile((prev) => ({ ...prev, preferredMode: newMode }));
    setModeShiftBanner(`Switched to ${MODE_META[newMode].label} persona.`);
    if (user) {
      await updateUserProfileFields(user.uid, { preferredMode: newMode });
    }
  };

  const handleSelectRelationshipStage = async (stageId: RelationshipStage) => {
    triggerHaptic('unlock', settings.hapticsEnabled);
    const stageMeta = RELATIONSHIP_STAGES.find((s) => s.id === stageId) || RELATIONSHIP_STAGES[1];
    const targetBond = stageId === 'strangers' ? 5 : Math.max(stageMeta.minBond + 5, 15);
    const suggestedModeForStage: KaraMode =
      stageId === 'caretaker'
        ? 'parent'
        : stageId === 'marriage' || stageId === 'partners' || stageId === 'crush'
        ? 'romantic'
        : profile.preferredMode;

    setProfile((prev) => ({
      ...prev,
      bondLevel: Math.min(100, targetBond),
      preferredMode: suggestedModeForStage,
    }));
    setModeShiftBanner(
      `Relationship Status updated to ${stageMeta.label} (${targetBond}% Bond · ${MODE_META[suggestedModeForStage].label} mode).`
    );

    if (user) {
      await updateUserProfileFields(user.uid, {
        bondLevel: Math.min(100, targetBond),
        preferredMode: suggestedModeForStage,
      });
    }
  };

  const handleToggleAutoAdapt = async () => {
    triggerHaptic('tap', settings.hapticsEnabled);
    const nextVal = !profile.autoAdaptMode;
    setProfile((prev) => ({ ...prev, autoAdaptMode: nextVal }));
    if (user) {
      await updateUserProfileFields(user.uid, { autoAdaptMode: nextVal });
    }
  };

  const handleStopSpeaking = () => {
    if (ttsAbortControllerRef.current) {
      const ctrl = ttsAbortControllerRef.current;
      ttsAbortControllerRef.current = null;
      try {
        ctrl.abort();
      } catch {}
    }
    if (ttsActiveSourcesRef.current.size > 0) {
      ttsActiveSourcesRef.current.forEach((src) => {
        try {
          src.stop();
        } catch {}
        try {
          src.disconnect();
        } catch {}
      });
      ttsActiveSourcesRef.current.clear();
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      activeAudioRef.current = null;
    }
    if (activeBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      } catch {}
      activeBlobUrlRef.current = null;
    }
    setIsSpeakingId(null);
    setSpeakingProgress(null);
  };

  const handleStopKaraResponse = () => {
    triggerHaptic('tap', settings.hapticsEnabled);
    if (chatAbortControllerRef.current) {
      const ctrl = chatAbortControllerRef.current;
      chatAbortControllerRef.current = null;
      try {
        ctrl.abort();
      } catch {}
    }
    setIsSending(false);
    handleStopSpeaking();
    setModeShiftBanner('KARA response stopped.');
  };

  // Helper to split short-form and multi-paragraph long-form messages into natural sentence blocks
  const splitClientSpeechChunks = (rawText: string, maxLen = 320): string[] => {
    const cleaned = rawText
      .replace(/\*+([^*]+)\*+/g, ' $1 ')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
      .replace(/https?:\/\/[^\s)]+/g, ' shared link ')
      .replace(/[#_`~>|]/g, ' ')
      .replace(/^\s*[-•]\s+/gm, '. ')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleaned) return [];
    if (cleaned.length <= maxLen) return [cleaned];

    const sentences = cleaned.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [cleaned];
    const chunks: string[] = [];
    let current = '';

    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (!sentence) continue;

      if (sentence.length > maxLen) {
        if (current) {
          chunks.push(current.trim());
          current = '';
        }
        const clauses = sentence.split(/(?<=[,;:])\s+/);
        for (const clause of clauses) {
          if ((current + ' ' + clause).trim().length <= maxLen) {
            current = (current + ' ' + clause).trim();
          } else {
            if (current) chunks.push(current.trim());
            if (clause.length <= maxLen) {
              current = clause.trim();
            } else {
              const words = clause.split(/\s+/);
              current = '';
              for (const w of words) {
                if ((current + ' ' + w).trim().length <= maxLen) {
                  current = (current + ' ' + w).trim();
                } else {
                  if (current) chunks.push(current.trim());
                  current = w;
                }
              }
            }
          }
        }
      } else if ((current + ' ' + sentence).trim().length <= maxLen) {
        current = (current + ' ' + sentence).trim();
      } else {
        if (current) chunks.push(current.trim());
        current = sentence;
      }
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }
    return chunks;
  };

  // 100% Human-Like 24kHz Neural Voice Playback for Both Short-Form & Unbounded Long-Form Responses
  const handleSpeakText = async (
    text: string,
    msgId: string,
    modeOverride?: KaraMode,
    genderOverride?: VoiceGender,
    readingMode: 'full' | 'short' = 'full'
  ) => {
    handleStopSpeaking();

    const cleanedFullText = text
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\*+([^*]+)\*+/g, ' $1 ')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
      .replace(/https?:\/\/[^\s)]+/g, ' shared link ')
      .replace(/[#_`~>|]/g, ' ')
      .replace(/[\[\]{}()]/g, ' ')
      .replace(/^\s*[-•]\s+/gm, '. ')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleanedFullText) return;

    setIsSpeakingId(msgId);

    const ttsController = new AbortController();
    ttsAbortControllerRef.current = ttsController;

    const targetGender: VoiceGender = genderOverride || selectedVoiceProfile.gender;
    const targetVoiceName =
      genderOverride && genderOverride !== selectedVoiceProfile.gender
        ? genderOverride === 'male'
          ? 'Puck'
          : 'Kore'
        : selectedVoiceProfile.voiceName;

    const fetchChunkAudioBase64 = async (chunkText: string): Promise<string | null> => {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (ttsController.signal.aborted) return null;
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => {
          try {
            timeoutController.abort();
          } catch {}
        }, 24000);
        const onParentAbort = () => {
          try {
            timeoutController.abort();
          } catch {}
        };
        ttsController.signal.addEventListener('abort', onParentAbort, { once: true });

        try {
          const res = await fetch('/api/kara/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: timeoutController.signal,
            body: JSON.stringify({
              text: chunkText,
              mode: modeOverride || profile.preferredMode,
              voiceGender: targetGender,
              voiceName: targetVoiceName,
              ttsEngine: settings.ttsEngine,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.audioBase64) {
              return data.audioBase64;
            }
          }
        } catch {
          if (ttsController.signal.aborted) {
            return null;
          }
        } finally {
          clearTimeout(timeoutId);
          ttsController.signal.removeEventListener('abort', onParentAbort);
        }

        if (attempt === 0 && !ttsController.signal.aborted) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      return null;
    };

    const base64ToUint8Array = (base64Str: string): Uint8Array => {
      const binary = atob(base64Str);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    };

    // Play WAV via HTMLAudioElement Blob URL (returns true if played, false if blocked/failed)
    const playFallbackHtmlAudio = (audioBase64: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (ttsController.signal.aborted) {
          resolve(true);
          return;
        }
        try {
          const bytes = base64ToUint8Array(audioBase64);
          const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/wav' });
          const blobUrl = URL.createObjectURL(blob);
          if (activeBlobUrlRef.current) {
            try {
              URL.revokeObjectURL(activeBlobUrlRef.current);
            } catch {}
          }
          activeBlobUrlRef.current = blobUrl;

          const audio = new Audio(blobUrl);
          audio.playbackRate = Math.max(0.5, Math.min(2.0, settings.speechRate));
          activeAudioRef.current = audio;

          let settled = false;
          let safetyTimeout: ReturnType<typeof setTimeout> | null = null;

          const cleanup = (didPlay: boolean) => {
            if (settled) return;
            settled = true;
            if (safetyTimeout) clearTimeout(safetyTimeout);
            ttsController.signal.removeEventListener('abort', onAbort);
            if (activeAudioRef.current === audio) {
              activeAudioRef.current = null;
            }
            if (activeBlobUrlRef.current === blobUrl) {
              try {
                URL.revokeObjectURL(blobUrl);
              } catch {}
              activeBlobUrlRef.current = null;
            }
            resolve(didPlay);
          };

          const onAbort = () => {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch {}
            cleanup(true);
          };
          ttsController.signal.addEventListener('abort', onAbort, { once: true });

          audio.onended = () => cleanup(true);
          audio.onerror = () => cleanup(false);

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                const durSec = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 25;
                safetyTimeout = setTimeout(() => cleanup(true), (durSec / audio.playbackRate) * 1000 + 1500);
              })
              .catch(() => {
                cleanup(false);
              });
          } else {
            safetyTimeout = setTimeout(() => cleanup(true), 25000);
          }
        } catch {
          resolve(false);
        }
      });
    };

    // Play WAV via Web Audio API if running, or fallback to HTML5 Blob Audio (returns true if played, false if failed)
    const playWavBase64Chunk = async (audioBase64: string, rate: number): Promise<boolean> => {
      if (ttsController.signal.aborted) return true;

      // Try HTMLAudio Blob playback first (most reliable across desktop & mobile browsers), or WebAudio if HTMLAudio fails
      const htmlPlayed = await playFallbackHtmlAudio(audioBase64);
      if (htmlPlayed || ttsController.signal.aborted) {
        return true;
      }

      const ctx = await ensureAndResumeTtsAudioContext(true);
      if (ctx && ctx.state === 'running') {
        try {
          const bytes = base64ToUint8Array(audioBase64);
          const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer);
          if (audioBuffer && !ttsController.signal.aborted) {
            const activeCtx = ttsAudioCtxRef.current || ctx;
            if (activeCtx.state !== 'running') {
              await activeCtx.resume().catch(() => {});
            }
            if (activeCtx.state === 'running') {
              const sourceNode = activeCtx.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.playbackRate.value = rate;
              sourceNode.connect(activeCtx.destination);
              ttsActiveSourcesRef.current.add(sourceNode);

              const playedOk = await new Promise<boolean>((resolve) => {
                let done = false;
                const startClock = activeCtx.currentTime;
                const finish = (ok: boolean) => {
                  if (done) return;
                  done = true;
                  clearTimeout(maxWaitTimer);
                  clearTimeout(clockCheckTimer);
                  ttsActiveSourcesRef.current.delete(sourceNode);
                  resolve(ok);
                };

                sourceNode.onended = () => finish(true);

                // Verify hardware clock is actually advancing within 350ms
                const clockCheckTimer = setTimeout(() => {
                  if (!done && activeCtx.currentTime <= startClock) {
                    try {
                      sourceNode.stop();
                    } catch {}
                    finish(false);
                  }
                }, 350);

                const expectedMs = (audioBuffer.duration / rate) * 1000 + 1000;
                const maxWaitTimer = setTimeout(() => finish(true), expectedMs);

                try {
                  sourceNode.start(0);
                } catch {
                  finish(false);
                }
              });

              if (playedOk) return true;
            }
          }
        } catch {
          // Fall through to false so WebSpeech takes over
        }
      }

      return false;
    };

    try {
      window.dispatchEvent(
        new CustomEvent('audio-resume', { detail: { source: 'playback-start', msgId } })
      );
      await ensureAndResumeTtsAudioContext(true);
      const rate = Math.max(0.5, Math.min(2.0, settings.speechRate));

      // Split into ~320-char sentence blocks and prefetch 2 chunks ahead in a sliding window for gapless short & long-form playback
      const speechChunks = splitClientSpeechChunks(cleanedFullText, 320);
      const totalChunks = speechChunks.length;
      if (totalChunks === 0) {
        setIsSpeakingId(null);
        setSpeakingProgress(null);
        return;
      }

      setSpeakingProgress({
        msgId,
        currentChunk: 1,
        totalChunks,
        readingMode,
      });

      const prefetchedPromises = new Map<number, Promise<string | null>>();
      const getOrStartChunkFetch = (idx: number): Promise<string | null> | null => {
        if (idx < 0 || idx >= totalChunks || ttsController.signal.aborted) return null;
        let existing = prefetchedPromises.get(idx);
        if (!existing) {
          existing = fetchChunkAudioBase64(speechChunks[idx]).catch(() => null);
          prefetchedPromises.set(idx, existing);
        }
        return existing;
      };

      // Prime first 2 chunks immediately
      getOrStartChunkFetch(0);
      if (totalChunks > 1) {
        getOrStartChunkFetch(1);
      }

      for (let i = 0; i < totalChunks; i++) {
        if (ttsController.signal.aborted) break;

        setSpeakingProgress({
          msgId,
          currentChunk: i + 1,
          totalChunks,
          readingMode,
        });

        const currentChunkPromise = getOrStartChunkFetch(i);
        // Prefetch up to 2 chunks ahead while current chunk finishes fetching & playing
        getOrStartChunkFetch(i + 1);
        getOrStartChunkFetch(i + 2);

        const chunkBase64 = currentChunkPromise ? await currentChunkPromise : null;
        prefetchedPromises.delete(i);
        if (ttsController.signal.aborted) break;

        if (chunkBase64) {
          await playWavBase64Chunk(chunkBase64, rate);
        }
      }

      await new Promise((r) => setTimeout(r, 150));
      if (ttsAbortControllerRef.current === ttsController) {
        setIsSpeakingId(null);
        setSpeakingProgress(null);
      }
    } catch {
      if (ttsAbortControllerRef.current === ttsController) {
        setIsSpeakingId(null);
        setSpeakingProgress(null);
      }
    }
  };

  // Helper: Pull upcoming Google Calendar events when user asks "What's on my agenda today?"
  const fetchGoogleCalendarAgenda = async (): Promise<CalendarAgendaEvent[]> => {
    const token = getAccessToken();
    if (!token) {
      return DEFAULT_FALLBACK_AGENDA;
    }
    try {
      const nowIso = new Date().toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
          nowIso
        )}&maxResults=8&singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return DEFAULT_FALLBACK_AGENDA;
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length === 0) return [];
      return items.map((item: any, idx: number) => {
        const rawStart = item.start?.dateTime || item.start?.date || '';
        let formattedTime = 'All Day';
        if (rawStart && rawStart.includes('T')) {
          try {
            formattedTime = new Date(rawStart).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            });
          } catch {
            formattedTime = rawStart;
          }
        }
        return {
          id: item.id || `cal_${idx}`,
          summary: item.summary || 'Untitled Event',
          startTime: formattedTime,
          location: item.location || undefined,
        };
      });
    } catch {
      return DEFAULT_FALLBACK_AGENDA;
    }
  };

  // Helper: Match a contact from Google Contacts API or fallback contacts list
  const findMatchingContact = async (queryName: string): Promise<ContactPersonItem> => {
    const cleanTarget = queryName.toLowerCase().trim();
    const token = getAccessToken();
    if (token) {
      try {
        const res = await fetch(
          'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses&pageSize=50',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const connections = Array.isArray(data.connections) ? data.connections : [];
          for (const person of connections) {
            const name = person.names?.[0]?.displayName || '';
            const phone = person.phoneNumbers?.[0]?.value || '+1 (555) 019-2834';
            if (name && name.toLowerCase().includes(cleanTarget)) {
              return {
                id: person.resourceName || `gcontact_${Date.now()}`,
                name,
                phone,
                email: person.emailAddresses?.[0]?.value,
              };
            }
          }
        }
      } catch {}
    }

    const foundLocal = DEFAULT_CONTACTS.find((c) =>
      c.name.toLowerCase().includes(cleanTarget)
    );
    if (foundLocal) return foundLocal;

    return {
      id: `contact_${Date.now()}`,
      name: queryName || 'Contact',
      phone: '+1 (415) 890-4312',
      relation: 'Saved Contact',
    };
  };

  // Core helper to request KARA's reply for a given user message (including shared photos & links)
  const requestKaraTurn = async (
    userText: string,
    priorHistory: EnhancedChatMessage[],
    retryAttemptCount = 0,
    attachments?: ChatAttachmentPayload
  ) => {
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    chatAbortControllerRef.current = controller;

    setIsSending(true);
    setModeShiftBanner('');

    const currentStageMeta = getRelationshipStageByBond(profile.bondLevel);
    const lowerText = userText.toLowerCase();

    // Detect if user is asking for today's Google Calendar agenda, setting an alarm, or calling a contact
    const isAgendaQuery =
      /\b(what's on my agenda|whats on my agenda|my agenda today|my schedule today|upcoming events|calendar today|what do i have today)\b/i.test(
        lowerText
      );
    const alarmMatch = userText.match(
      /\b(?:set an? alarm|wake me up|remind me|alarm)\b.*?(?:for|at|in)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d+\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?))/i
    );
    const callMatch = userText.match(
      /\b(?:call|dial|phone|ring)\s+([a-zA-Z0-9_.\- ]{2,30})/i
    );

    let fetchedAgenda: CalendarAgendaEvent[] | undefined = undefined;
    let createdAlarm: KaraAlarmItem | undefined = undefined;
    let matchedContact: ContactPersonItem | undefined = undefined;

    if (isAgendaQuery) {
      fetchedAgenda = await fetchGoogleCalendarAgenda();
      if (controller.signal.aborted) return;
    }

    if (alarmMatch) {
      const timeText = alarmMatch[1].trim();
      const labelMatch = userText.match(/for\s+([a-zA-Z0-9 ]+)$/i);
      createdAlarm = {
        id: `alarm_${Date.now()}`,
        timeText,
        label: labelMatch ? labelMatch[1].trim() : 'KARA Smart Alarm',
        targetTimestamp: Date.now() + 60 * 1000, // Triggers in 60s for live demo or at target time
        triggered: false,
      };
      setActiveAlarms((prev) => [...prev, createdAlarm!]);
    }

    if (callMatch && !isAgendaQuery && !alarmMatch) {
      const targetName = callMatch[1]
        .replace(/\b(from my contacts|on speaker|right now|please|for me)\b/gi, '')
        .trim();
      if (targetName) {
        matchedContact = await findMatchingContact(targetName);
        if (controller.signal.aborted) return;
        setActiveCallContact(matchedContact);
      }
    }

    const effectiveGrounding: GroundingOption =
      settings.deeperSearch && grounding === 'none' ? 'search' : grounding;

    try {
      const normalizedSharedPhotos =
        attachments?.photos && attachments.photos.length > 0
          ? attachments.photos
              .filter((p) => Boolean(p.base64 || p.dataUrl))
              .map((p) => ({
                base64:
                  p.base64 ||
                  (p.dataUrl.includes(',') ? p.dataUrl.split(',')[1] : p.dataUrl),
                mimeType: p.mimeType || 'image/jpeg',
                fileName: p.name,
              }))
          : attachments?.photoBase64 && attachments?.photoMimeType
          ? [
              {
                base64: attachments.photoBase64,
                mimeType: attachments.photoMimeType,
                fileName: attachments.photoName,
              },
            ]
          : [];

      const response = await fetch('/api/kara/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userText,
          history: priorHistory.slice(-16).map((m) => ({ role: m.role, content: m.content })),
          mode: profile.preferredMode,
          autoAdaptMode: profile.autoAdaptMode,
          relationshipStage: currentStageMeta.id,
          bondLevel: profile.bondLevel,
          modelTier,
          grounding: effectiveGrounding,
          deeperSearch: settings.deeperSearch,
          memories: memories.map((m) => ({ category: m.category, content: m.content })),
          userName: profile.displayName,
          calendarEvents: fetchedAgenda,
          matchedContact,
          sharedPhotos: normalizedSharedPhotos,
          sharedPhoto: normalizedSharedPhotos[0] || null,
          sharedLinks: attachments?.links || [],
          activeGem: activeGemObj,
          enabledSkills: settings.enabledSkills || DEFAULT_ENABLED_SKILLS,
          responseStylePreset,
          funMode,
        }),
      });

      if (controller.signal.aborted) return;
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reach KARA.');
      }

      const resolvedMode: KaraMode = data.activeMode || profile.preferredMode;
      const newBond = Math.min(100, profile.bondLevel + 5);
      const newStageMeta = getRelationshipStageByBond(newBond);
      const newSoapCount = data.soapTriggered
        ? profile.soapWashCount + 1
        : profile.soapWashCount;

      if (resolvedMode !== profile.preferredMode) {
        triggerHaptic('modeSwitch', settings.hapticsEnabled);
        setModeShiftBanner(
          data.modeShiftReason ||
            `KARA auto-switched to ${MODE_META[resolvedMode].label} mode to match your vibe.`
        );
      } else if (newStageMeta.id !== currentStageMeta.id) {
        triggerHaptic('unlock', settings.hapticsEnabled);
        setModeShiftBanner(
          `Unlocked Relationship Milestone: ${newStageMeta.label} (${newBond}% Bond)!`
        );
      }

      if (data.soapTriggered) {
        triggerHaptic('soap', settings.hapticsEnabled);
      }

      // Automatically remember and sync user's introduced name permanently
      const updatedDisplayName =
        data.introducedName && typeof data.introducedName === 'string' && data.introducedName.trim()
          ? data.introducedName.trim()
          : profile.displayName;

      if (updatedDisplayName !== profile.displayName) {
        if (user) {
          updateUserProfileFields(user.uid, { displayName: updatedDisplayName });
        }
      }

      setProfile((prev) => ({
        ...prev,
        displayName: updatedDisplayName,
        preferredMode: resolvedMode,
        bondLevel: newBond,
        soapWashCount: newSoapCount,
      }));

      // Prepare newly learned memory note synchronously so UI + voice talkback can start with zero delay
      let learnedNote = '';
      let pendingMemoryObj: {
        category: MemoryCategory;
        content: string;
        importance: number;
      } | null = null;

      if (data.extractedMemory && data.extractedMemory.content) {
        const memContent = String(data.extractedMemory.content).trim();
        const alreadyExists = memories.some(
          (m) => m.content.toLowerCase() === memContent.toLowerCase()
        );
        if (!alreadyExists) {
          learnedNote = memContent;
          pendingMemoryObj = {
            category: (data.extractedMemory.category || 'preference') as MemoryCategory,
            content: memContent,
            importance: data.extractedMemory.importance || 4,
          };
          if (!user) {
            setMemories((prev) => [
              {
                id: `mem_${Date.now()}`,
                userId: 'guest',
                ...pendingMemoryObj!,
              },
              ...prev,
            ]);
          }
        }
      }

      const assistantMsgId = `${activeSessionId}__msg_${Date.now()}_a`;
      const assistantMsg: EnhancedChatMessage = {
        id: assistantMsgId,
        sessionId: activeSessionId,
        userId: activeStorageUserId,
        role: 'assistant',
        content: data.reply,
        mode: resolvedMode,
        emotionDetected: data.emotionDetected || 'Attentive',
        subtext: data.subtext,
        emotionalNuanceType: data.emotionalNuanceType,
        empathyStrategy: data.empathyStrategy,
        modeShiftReason: data.modeShiftReason || undefined,
        soapTriggered: Boolean(data.soapTriggered),
        sources: data.sources || [],
        modelUsed: data.modelUsed,
        reasoningTrace: data.reasoningTrace || [],
        photoThoughts: data.photoThoughts || undefined,
        thinkingDurationMs: data.thinkingDurationMs || 520,
        followUps: Array.isArray(data.followUps) ? data.followUps.slice(0, 4) : [],
        retryCount: retryAttemptCount,
        agendaEvents: fetchedAgenda,
        alarmCreated: createdAlarm,
        contactCall: matchedContact,
        recalledMemory: data.recalledMemory || undefined,
        generatedImageUrl: data.generatedImageUrl || undefined,
        generatedImagePrompt: data.generatedImagePrompt || undefined,
        karaEmotion: data.karaEmotion || undefined,
        recalledMemoryNodes: data.recalledMemoryNodes || undefined,
        scoldingNotice: data.soapTriggered
          ? `Parent / Caretaker Soap Reprimand: Mouth washed with soap for saying "${
              data.offendingWord || 'bad words'
            }"`
          : undefined,
        learnedMemoryNote: learnedNote || undefined,
        isDepressionCheckin: Boolean(data.isDepressionCheckin),
        supportHotlines: data.supportHotlines || undefined,
        responseStyleUsed: data.responseStyleUsed || undefined,
        whenToUseReason: data.whenToUseReason || undefined,
        funMode: data.funMode !== undefined ? Boolean(data.funMode) : funMode,
        createdAt: Date.now(),
      };

      setAllMessages((prev) => [...prev, assistantMsg]);

      // Start seamless neural voice talkback IMMEDIATELY before awaiting background cloud writes
      if (settings.autoSpeakReplies && (data.reply || assistantMsg.scoldingNotice)) {
        const fullSpoken = buildFullSpokenMessageText(assistantMsg);
        handleSpeakText(fullSpoken, assistantMsgId, resolvedMode);
      }

      // Persist updates in background
      if (user) {
        await Promise.allSettled([
          updateUserProfileFields(user.uid, {
            preferredMode: resolvedMode,
            bondLevel: newBond,
            soapWashCount: newSoapCount,
          }),
          saveChatMessage(user.uid, {
            id: assistantMsgId,
            role: 'assistant',
            content: data.reply,
            mode: resolvedMode,
            emotionDetected: data.emotionDetected || 'Attentive',
            soapTriggered: Boolean(data.soapTriggered),
          }),
          pendingMemoryObj
            ? saveMemoryItem(user.uid, pendingMemoryObj).then((savedItem) => {
                if (!isFirebaseCloudUser() && savedItem) {
                  setMemories((prev) => [savedItem as MemoryItemData, ...prev]);
                }
              })
            : Promise.resolve(),
          data.soapTriggered
            ? createSoapIncident(
                user.uid,
                data.offendingWord || 'profanity',
                data.scoldingMessage || 'Playful parental mouth-washing reprimand issued.'
              )
            : Promise.resolve(),
        ]);
        setLastCloudSyncAt(Date.now());
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setAllMessages((prev) => [
        ...prev,
        {
          id: `${activeSessionId}__err_${Date.now()}`,
          sessionId: activeSessionId,
          userId: activeStorageUserId,
          role: 'assistant',
          content: `Connection hiccup: ${error?.message || 'Please try again.'}`,
          mode: profile.preferredMode,
          emotionDetected: 'Concerned',
          soapTriggered: false,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      if (chatAbortControllerRef.current === controller) {
        chatAbortControllerRef.current = null;
        setIsSending(false);
      }
    }
  };

  // Built-in Create & Edit Images (gemini-nano-banana-2.1) in Chat
  const handleGenerateNanoBananaInChat = async (
    textIdea: string,
    preConvertedPrompt?: string,
    options?: {
      aspectRatio?: string;
      imageSize?: string;
      referenceImageBase64?: string | null;
      referenceMimeType?: string;
      referenceImageUrl?: string | null;
      referenceImageName?: string;
    }
  ) => {
    const cleanIdea = textIdea.trim();
    if (!cleanIdea || isSending) return;

    const isEditing = Boolean(options?.referenceImageBase64 || options?.referenceImageUrl);
    const chosenAspect = options?.aspectRatio || '1:1';
    const chosenSize = options?.imageSize || '1K';
    const refDataUrl = options?.referenceImageUrl || undefined;
    const refBase64 = options?.referenceImageBase64 || refDataUrl || undefined;
    const refMime = options?.referenceMimeType || 'image/png';

    setIsSending(true);
    const userMsgId = `${activeSessionId}__msg_${Date.now()}_u`;
    const userMsg: EnhancedChatMessage = {
      id: userMsgId,
      sessionId: activeSessionId,
      userId: activeStorageUserId,
      role: 'user',
      content: isEditing
        ? `Edit Image (gemini-nano-banana-2.1 · ${chosenAspect} · ${chosenSize}): ${cleanIdea}`
        : `Create Image (gemini-nano-banana-2.1 · ${chosenAspect} · ${chosenSize}): ${cleanIdea}`,
      mode: profile.preferredMode,
      emotionDetected: isEditing ? 'Editing Visual' : 'Creative',
      soapTriggered: false,
      sharedPhotoUrl: refDataUrl,
      sharedPhotoName: options?.referenceImageName || (isEditing ? 'Reference Image' : undefined),
      createdAt: Date.now(),
    };
    setAllMessages((prev) => [...prev, userMsg]);
    if (user) {
      saveChatMessage(user.uid, {
        id: userMsgId,
        role: 'user',
        content: userMsg.content,
        mode: profile.preferredMode,
        emotionDetected: userMsg.emotionDetected,
        soapTriggered: false,
      }).catch(() => {});
    }

    try {
      const res = await fetch('/api/studio/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: preConvertedPrompt || cleanIdea,
          model: 'gemini-nano-banana-2.1',
          imageSize: chosenSize,
          aspectRatio: chosenAspect,
          referenceImageBase64: refBase64,
          referenceMimeType: refMime,
          skipPromptExpansion: isEditing || Boolean(preConvertedPrompt),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || 'Could not generate or edit Nano Banana 2.1 artwork.');
      }

      const effectiveNanoPrompt = data.nanoBananaPrompt || preConvertedPrompt || cleanIdea;
      const assistantMsgId = `${activeSessionId}__msg_${Date.now()}_a`;
      const replyContent = isEditing
        ? `Here is your edited image for "${cleanIdea}" powered by gemini-nano-banana-2.1 (${chosenAspect} · ${chosenSize})! You can click "Edit Image" on this result anytime to keep refining or layering more changes.`
        : `Here's your newly created image for "${cleanIdea}" powered by gemini-nano-banana-2.1 (${chosenAspect} · ${chosenSize})! You can click "Edit Image" right on the artwork to modify details, lighting, or style with a text prompt.`;
      const assistantMsg: EnhancedChatMessage = {
        id: assistantMsgId,
        sessionId: activeSessionId,
        userId: activeStorageUserId,
        role: 'assistant',
        content: replyContent,
        mode: profile.preferredMode,
        emotionDetected: isEditing ? 'Precision Visual Edit' : 'Inspired & Creative',
        soapTriggered: false,
        generatedImageUrl: data.imageUrl,
        generatedImagePrompt: effectiveNanoPrompt,
        modelUsed: data.modelUsed || 'gemini-nano-banana-2.1',
        reasoningTrace: [
          isEditing
            ? `Image Edit Pipeline (gemini-nano-banana-2.1): Loaded reference image (${
                options?.referenceImageName || 'source image'
              }) and parsed edit instruction "${cleanIdea}".`
            : `Text-to-Image Pipeline (gemini-nano-banana-2.1): Expanded "${cleanIdea}" into a high-detail Nano Banana 2.1 visual prompt.`,
          `Canvas & Resolution Config: Synthesized at ${chosenSize} resolution with ${chosenAspect} aspect ratio.`,
          `Persona Integration: Presenting visual artwork in ${profile.preferredMode.toUpperCase()} mode with 1-tap iterative image editing ready.`,
        ],
        responseStyleUsed: isEditing
          ? `Image Edit · gemini-nano-banana-2.1 (${chosenAspect})`
          : `Image Creation · gemini-nano-banana-2.1 (${chosenAspect})`,
        followUps: [
          `Edit this image: add cinematic neon lighting`,
          `Generate another variation of: ${cleanIdea}`,
          'Make a 16:9 widescreen version of this scene',
        ],
        createdAt: Date.now(),
      };

      setAllMessages((prev) => [...prev, assistantMsg]);
      if (settings.autoSpeakReplies) {
        handleSpeakText(replyContent, assistantMsgId, profile.preferredMode);
      }
      if (user) {
        await saveChatMessage(user.uid, {
          id: assistantMsgId,
          role: 'assistant',
          content: replyContent,
          mode: profile.preferredMode,
          emotionDetected: assistantMsg.emotionDetected,
          soapTriggered: false,
        }).catch(() => {});
        setLastCloudSyncAt(Date.now());
      }
    } catch (err: any) {
      setAllMessages((prev) => [
        ...prev,
        {
          id: `${activeSessionId}__err_${Date.now()}`,
          sessionId: activeSessionId,
          userId: activeStorageUserId,
          role: 'assistant',
          content: `Could not synthesize image with gemini-nano-banana-2.1: ${err?.message || 'Please try again.'}`,
          mode: profile.preferredMode,
          emotionDetected: 'Concerned',
          soapTriggered: false,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (
    textToSend: string,
    attachments?: ChatAttachmentPayload
  ) => {
    const trimmed = textToSend.trim();
    const hasPhotos = Boolean(
      (attachments?.photos && attachments.photos.length > 0) || attachments?.photoDataUrl
    );
    if ((!trimmed && !hasPhotos && !attachments?.links?.length) || isSending) {
      return;
    }

    triggerHaptic('send', settings.hapticsEnabled);

    const firstPhoto = attachments?.photos?.[0];
    const tempUserMsgId = `${activeSessionId}__msg_${Date.now()}_u`;
    const optimisticUserMsg: EnhancedChatMessage = {
      id: tempUserMsgId,
      sessionId: activeSessionId,
      userId: activeStorageUserId,
      role: 'user',
      content: trimmed,
      mode: profile.preferredMode,
      emotionDetected: 'Expressive',
      soapTriggered: false,
      sharedPhotos: attachments?.photos,
      sharedPhotoUrl: firstPhoto?.dataUrl || attachments?.photoDataUrl,
      sharedPhotoName: firstPhoto?.name || attachments?.photoName,
      sharedLinks: attachments?.links,
      createdAt: Date.now(),
    };

    const historySnapshot = [...currentSessionMessages];
    setAllMessages((prev) => [...prev, optimisticUserMsg]);

    if (user) {
      saveChatMessage(user.uid, {
        id: tempUserMsgId,
        role: 'user',
        content: trimmed.slice(0, 3900),
        mode: profile.preferredMode,
        emotionDetected: 'Expressive',
        soapTriggered: false,
      }).catch(() => {});
    }

    lastInteractionTimeRef.current = Date.now();
    lastUserTypingTimeRef.current = Date.now();
    await requestKaraTurn(trimmed, historySnapshot, 0, attachments);
  };

  // Proactive Reach-Out: Kara sends a message first if Stephen doesn't type after 5-10 min
  const triggerProactiveCheckin = useCallback(
    async (idleMinutesOverride?: number) => {
      if (isSending || isProactiveInProgressRef.current) return;

      const activeMsgs = allMessages.filter(
        (m) => (m.sessionId || 'sess_main') === activeSessionId
      );
      const lastMsg = activeMsgs[activeMsgs.length - 1];
      // Prevent consecutive proactive check-ins if the last message in chat was already unprompted
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isProactiveCheckin) {
        return;
      }

      isProactiveInProgressRef.current = true;
      const effectiveMinutes = idleMinutesOverride || settings.proactiveIdleMinutes || 5;
      const currentStageMeta = getRelationshipStageByBond(profile.bondLevel);

      const now = new Date();
      const localTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const dayOfWeek = now.toLocaleDateString([], { weekday: 'long' });
      const hour = now.getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
      const dateString = now.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

      try {
        const res = await fetch('/api/kara/proactive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: profile.preferredMode,
            userName: profile.displayName || 'Stephen',
            relationshipStage: currentStageMeta.id,
            bondLevel: profile.bondLevel,
            memories: memories.map((m) => ({ category: m.category, content: m.content })),
            history: activeMsgs.slice(-12).map((m) => ({ role: m.role, content: m.content })),
            idleMinutes: effectiveMinutes,
            localTime,
            dayOfWeek,
            timeOfDay,
            dateString,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed proactive check-in');
        }

        const assistantMsgId = `${activeSessionId}__msg_${Date.now()}_proactive`;
        const assistantMsg: EnhancedChatMessage = {
          id: assistantMsgId,
          sessionId: activeSessionId,
          userId: activeStorageUserId,
          role: 'assistant',
          content: data.reply,
          mode: profile.preferredMode,
          emotionDetected: data.karaEmotion?.label || 'Proactive Check-In',
          soapTriggered: false,
          karaEmotion: data.karaEmotion,
          reasoningTrace: data.reasoningTrace || [
            `Real-Time Observation: Stephen has been quiet without typing for ~${effectiveMinutes} minutes around ${localTime}.`,
            `Personal Connection: Reaching out with spontaneous warmth in ${MODE_META[profile.preferredMode].label} mode.`,
            `Heartfelt Presence: Checking in on Stephen directly by name with real human closeness.`,
          ],
          followUps: Array.isArray(data.followUps) ? data.followUps : [],
          isProactiveCheckin: true,
          proactiveIdleMinutes: effectiveMinutes,
        };

        setAllMessages((prev) => [...prev, assistantMsg]);
        lastInteractionTimeRef.current = Date.now();
        lastUserTypingTimeRef.current = Date.now();

        if (settings.autoSpeakReplies && data.reply) {
          const fullSpoken = buildFullSpokenMessageText(assistantMsg);
          handleSpeakText(fullSpoken, assistantMsgId, profile.preferredMode);
        }

        if (user) {
          saveChatMessage(user.uid, {
            id: assistantMsgId,
            role: 'assistant',
            content: data.reply,
            mode: profile.preferredMode,
            emotionDetected: 'Proactive Reach-Out',
            soapTriggered: false,
          }).catch(() => {});
        }
      } catch (err) {
        console.error('Proactive check-in error:', err);
      } finally {
        isProactiveInProgressRef.current = false;
      }
    },
    [
      isSending,
      allMessages,
      activeSessionId,
      settings.proactiveIdleMinutes,
      settings.autoSpeakReplies,
      profile.bondLevel,
      profile.preferredMode,
      profile.displayName,
      activeStorageUserId,
      memories,
      user,
    ]
  );

  // Background Real-Time Idle Monitor: Checks in real-time if Stephen has been quiet >= proactiveIdleMinutes (5-10m)
  useEffect(() => {
    if (settings.proactiveMessagesEnabled === false) return;

    const idleMinutesThreshold = settings.proactiveIdleMinutes || 5;
    const thresholdMs = idleMinutesThreshold * 60 * 1000;

    const interval = setInterval(() => {
      if (isSending || isSpeakingId || isProactiveInProgressRef.current) return;

      const now = Date.now();
      // Don't interrupt if Stephen typed within the last 45 seconds
      if (now - lastUserTypingTimeRef.current < 45000) return;

      const idleTime = now - Math.max(lastInteractionTimeRef.current, lastUserTypingTimeRef.current);
      if (idleTime >= thresholdMs) {
        triggerProactiveCheckin(idleMinutesThreshold);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    settings.proactiveMessagesEnabled,
    settings.proactiveIdleMinutes,
    isSending,
    isSpeakingId,
    triggerProactiveCheckin,
  ]);

  const handleEditAndRetryMessage = async (messageId: string, newContent: string) => {
    const trimmed = newContent.trim();
    if (!trimmed || isSending) return;

    triggerHaptic('send', settings.hapticsEnabled);

    const sessionMsgs = [...currentSessionMessages];
    const targetIdx = sessionMsgs.findIndex((m) => m.id === messageId);
    if (targetIdx < 0) return;

    const priorHistory = sessionMsgs.slice(0, targetIdx);
    const removedDownstream = sessionMsgs.slice(targetIdx + 1);
    const updatedUserMsg: EnhancedChatMessage = {
      ...sessionMsgs[targetIdx],
      content: trimmed,
      editedAt: Date.now(),
    };

    const removedIds = new Set(removedDownstream.map((m) => m.id));
    setAllMessages((prev) =>
      prev
        .filter((m) => !removedIds.has(m.id))
        .map((m) => (m.id === messageId ? updatedUserMsg : m))
    );

    if (user) {
      await saveChatMessage(user.uid, {
        id: updatedUserMsg.id,
        role: 'user',
        content: trimmed,
        mode: updatedUserMsg.mode,
        emotionDetected: updatedUserMsg.emotionDetected || 'Edited',
        soapTriggered: false,
      }).catch(() => {});
      for (const oldMsg of removedDownstream) {
        await deleteChatMessage(user.uid, oldMsg.id).catch(() => {});
      }
    }

    const editAttachments: ChatAttachmentPayload | undefined =
      (updatedUserMsg.sharedPhotos && updatedUserMsg.sharedPhotos.length > 0) ||
      updatedUserMsg.sharedPhotoUrl ||
      (updatedUserMsg.sharedLinks && updatedUserMsg.sharedLinks.length > 0)
        ? {
            photos: updatedUserMsg.sharedPhotos,
            photoDataUrl: updatedUserMsg.sharedPhotoUrl,
            photoName: updatedUserMsg.sharedPhotoName,
            links: updatedUserMsg.sharedLinks,
          }
        : undefined;

    await requestKaraTurn(trimmed, priorHistory, 1, editAttachments);
  };

  const handleRetryMessage = async (messageId: string) => {
    if (isSending) return;
    triggerHaptic('send', settings.hapticsEnabled);

    const sessionMsgs = [...currentSessionMessages];
    const idx = sessionMsgs.findIndex((m) => m.id === messageId);
    if (idx < 0) return;

    const clickedMsg = sessionMsgs[idx];
    let userMsgIndex = idx;

    if (clickedMsg.role === 'assistant') {
      let foundUserIdx = -1;
      for (let i = idx - 1; i >= 0; i--) {
        if (sessionMsgs[i].role === 'user') {
          foundUserIdx = i;
          break;
        }
      }
      if (foundUserIdx === -1) return;
      userMsgIndex = foundUserIdx;
    }

    const targetUserMsg = sessionMsgs[userMsgIndex];
    const priorHistory = sessionMsgs.slice(0, userMsgIndex);
    const downstreamToRemove = sessionMsgs.slice(userMsgIndex + 1);
    const previousRetries = clickedMsg.retryCount || 0;

    const removedIds = new Set(downstreamToRemove.map((m) => m.id));
    setAllMessages((prev) => prev.filter((m) => !removedIds.has(m.id)));

    if (user) {
      for (const oldMsg of downstreamToRemove) {
        await deleteChatMessage(user.uid, oldMsg.id);
      }
    }

    const retryAttachments: ChatAttachmentPayload | undefined =
      (targetUserMsg.sharedPhotos && targetUserMsg.sharedPhotos.length > 0) ||
      targetUserMsg.sharedPhotoUrl ||
      (targetUserMsg.sharedLinks && targetUserMsg.sharedLinks.length > 0)
        ? {
            photos: targetUserMsg.sharedPhotos,
            photoDataUrl: targetUserMsg.sharedPhotoUrl,
            photoName: targetUserMsg.sharedPhotoName,
            links: targetUserMsg.sharedLinks,
          }
        : undefined;

    await requestKaraTurn(
      targetUserMsg.content,
      priorHistory,
      previousRetries + 1,
      retryAttachments
    );
  };

  const handleDeleteSingleMessage = async (messageId: string) => {
    setAllMessages((prev) => prev.filter((m) => m.id !== messageId));
    if (user) {
      await deleteChatMessage(user.uid, messageId);
    }
  };

  const handleClearConversation = async () => {
    await handleDeleteSession(activeSessionId);
  };

  // Sector 9 Hard Reset inside Settings: Completely wipes Kara (all memories, sessions, settings, custom gems, alarms, and cloud sync) so she is 100% brand new
  const handleHardReset = async () => {
    handleStopKaraResponse();

    // 1. Wipe entire IndexedDB + localStorage sync mirrors across all sessions and user keys
    await karaRoomDb.wipeAllDatabase();

    // 2. Wipe all local storage keys and mark clean brand-new state so seeded demo chats never re-populate
    try {
      localStorage.removeItem(GUEST_MEMORIES_KEY);
      localStorage.removeItem(ALARMS_STORAGE_KEY);
      localStorage.removeItem(SESSION_TITLES_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      localStorage.removeItem(VOICE_PREF_STORAGE_KEY);
      localStorage.removeItem('kara_response_style_preset_v1');
      localStorage.removeItem('kara_fun_mode_v1');
      localStorage.setItem(HARD_RESET_BRAND_NEW_KEY, '1');
    } catch {}

    // 3. Reset all UI, voice, style, gem, alarm, memory, and session states to brand-new factory defaults
    const freshSettings: KaraSettings = {
      theme: 'minimalist-slate',
      mxchatBubbleStyle: 'rounded',
      mxchatFontScale: 'default',
      ttsEngine: 'humanlike',
      speechRate: 1.0,
      speechPitch: 1.0,
      autoSpeakReplies: true,
      tokenStreaming: true,
      deeperSearch: true,
      hapticsEnabled: true,
      proactiveMessagesEnabled: true,
      proactiveIdleMinutes: 5,
      activeGemId: null,
      enabledSkills: DEFAULT_ENABLED_SKILLS,
      customGems: [],
    };
    setSettings(freshSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(freshSettings));
    } catch {}

    setSelectedVoiceProfile(NATURAL_VOICE_PROFILES[0]);
    setResponseStylePreset('adaptive_mix');
    setFunMode(true);
    setModelTier('standard');
    setGrounding('search');
    setActiveAlarms([]);
    setActiveCallContact(null);
    setMemories([]);
    setCustomSessionTitles({});
    setActiveSessionId('sess_main');

    const freshWelcome: EnhancedChatMessage = {
      ...BRAND_NEW_WELCOME_MESSAGE,
      userId: activeStorageUserId,
      createdAt: Date.now(),
    };
    setAllMessages([freshWelcome]);
    await karaRoomDb.saveConversationHistory(activeStorageUserId, [freshWelcome]);

    setProfile({
      uid: activeStorageUserId,
      displayName: 'Friend',
      preferredMode: 'regular',
      autoAdaptMode: true,
      bondLevel: 0,
      soapWashCount: 0,
    });

    setModeShiftBanner(
      'Hard Reset Complete: KARA has been completely wiped and restored to a 100% brand-new state (0% Stranger · 0 Memories · Fresh Slate).'
    );

    // 4. Wipe all cloud-synced Firestore messages, memories, and profile stats if signed in
    if (user) {
      await wipeAllUserCloudAndLocalData(user.uid);
    }
  };

  // Dual-Engine Voice Dictation: Live Browser SpeechRecognition + MediaRecorder Gemini Transcription Fallback
  const handleToggleMicRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
        speechRecognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      return;
    }

    // Barge-in: immediately stop KARA's current speech when Stephen taps mic to dictate
    handleStopSpeaking();
    liveDictationTextRef.current = '';

    let startedBrowserSpeechRec = false;
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let fullSessionTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            const segment = event.results[i][0]?.transcript || '';
            fullSessionTranscript += segment + ' ';
          }
          const cleaned = fullSessionTranscript.replace(/\s{2,}/g, ' ').trim();
          if (cleaned) {
            liveDictationTextRef.current = cleaned;
            setVoiceDraftTranscript(cleaned);
          }
        };

        recognition.onerror = () => {
          // Ignore non-fatal browser speech recognition errors; MediaRecorder fallback handles audio
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        startedBrowserSpeechRec = true;
      } catch {
        startedBrowserSpeechRec = false;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav',
      ];
      const supportedMimeType =
        preferredMimeTypes.find((t) =>
          typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
            ? MediaRecorder.isTypeSupported(t)
            : false
        ) || '';

      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.stop();
          } catch {}
          speechRecognitionRef.current = null;
        }

        // Wait 120ms for any final SpeechRecognition result event to flush
        await new Promise((r) => setTimeout(r, 120));

        // If live browser SpeechRecognition already captured the transcript, keep it in the input field!
        if (liveDictationTextRef.current.trim()) {
          setVoiceDraftTranscript(liveDictationTextRef.current.trim());
          setIsTranscribing(false);
          return;
        }

        if (audioChunksRef.current.length === 0) {
          setIsTranscribing(false);
          return;
        }

        const rawMime = (recorder.mimeType || supportedMimeType || 'audio/webm').split(';')[0].trim();
        const audioBlob = new Blob(audioChunksRef.current, { type: rawMime || 'audio/webm' });
        if (audioBlob.size < 100) {
          setIsTranscribing(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const resultStr = String(reader.result || '');
              resolve(resultStr.includes(',') ? resultStr.split(',')[1] : resultStr);
            };
            reader.onerror = () => reject(new Error('Failed to read recorded audio'));
            reader.readAsDataURL(audioBlob);
          });

          const res = await fetch('/api/kara/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: rawMime || 'audio/webm',
            }),
          });
          const data = await res.json();
          const cleanTranscript = data?.transcript ? String(data.transcript).trim() : '';
          setIsTranscribing(false);
          if (cleanTranscript) {
            setVoiceDraftTranscript(cleanTranscript);
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      // Pass 250ms timeslice so audio chunks are emitted continuously and never lost on stop()
      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      if (startedBrowserSpeechRec) {
        setIsRecording(true);
      } else {
        setModeShiftBanner(
          'Microphone permission is required for voice dictation. Please allow microphone access in your browser.'
        );
      }
    }
  };

  const handleAddManualMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    triggerHaptic('send', settings.hapticsEnabled);
    const item = {
      category: newMemoryCategory,
      content: newMemoryText.trim().slice(0, 500),
      importance: 4,
    };
    setNewMemoryText('');
    if (user) {
      const saved = await saveMemoryItem(user.uid, item);
      if (!isFirebaseCloudUser() && saved) {
        setMemories((prev) => [saved as MemoryItemData, ...prev]);
      }
    } else {
      setMemories((prev) => [
        {
          id: `mem_${Date.now()}`,
          userId: 'guest',
          ...item,
        },
        ...prev,
      ]);
    }
  };

  const currentModeMeta = MODE_META[profile.preferredMode] || MODE_META.regular;

  return (
    <div
      data-kara-theme={settings.theme || 'minimalist-slate'}
      data-mxchat-bubble={settings.mxchatBubbleStyle || 'rounded'}
      data-mxchat-font={settings.mxchatFontScale || 'default'}
      className="min-h-screen flex flex-col kara-app-shell"
    >
      {/* CLEAN MINIMALIST TOP BAR */}
      <header className="flex items-center justify-between gap-4 px-6 py-3 border-b kara-app-topbar backdrop-blur-md sticky top-0 z-30">
        {/* Left: Wordmark & Optional Return to Chat */}
        <div className="flex items-center gap-3">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('chat');
            }}
            className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 group"
            title="KARA — Adaptive Emotional AI & Studio"
          >
            <KaraFutureLogo
              size="md"
              mode={profile.preferredMode}
              isActive={Boolean(isSpeakingId || isSending)}
              showWordmark
              subtitle="FUTURE CORE"
            />
          </a>

          {activeView !== 'chat' && (
            <button
              type="button"
              onClick={() => setActiveView('chat')}
              className="px-3 py-1 rounded-xl kara-chat-control-btn border text-xs font-medium text-sky-300 transition-colors"
            >
              ← Return to Clean Chat
            </button>
          )}
        </div>

        {/* Right: Settings & Auth */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-1.5 text-xs font-medium kara-chat-control-btn border rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Open Settings: Active Persona, MxChat Themes v2.1.6, Agenda, Set Alarm, Memory Vault, Creative Studio & Workspace"
          >
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span>Settings</span>
          </button>

          {!user ? (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In · Sync Memory &amp; Convos</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-rose-400 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title={`Signed in as ${user.email || profile.displayName} (Synced across devices)`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out ({user.email ? user.email.split('@')[0] : profile.displayName})</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col">
        {activeView === 'chat' && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-5 flex flex-col">
            <ChatScreen
              messages={currentSessionMessages}
              allMessages={allMessages}
              memories={visibleMemories}
              sessions={sessions}
              activeSessionId={activeSessionId}
              userName={profile.displayName}
              userEmail={user?.email || null}
              isCloudSynced={Boolean(user)}
              lastCloudSyncAt={lastCloudSyncAt}
              activeTheme={settings.theme || 'minimalist-slate'}
              onSelectTheme={(themeId) => handleUpdateSettings({ theme: themeId })}
              activeMode={profile.preferredMode}
              autoAdaptMode={profile.autoAdaptMode}
              relationshipStage={activeRelMeta.id}
              bondLevel={profile.bondLevel}
              modelTier={modelTier}
              grounding={grounding}
              ttsEngine={settings.ttsEngine}
              tokenStreaming={settings.tokenStreaming}
              deeperSearch={settings.deeperSearch}
              modeShiftBanner={modeShiftBanner}
              isSending={isSending}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              isSpeakingId={isSpeakingId}
              speakingProgress={speakingProgress}
              selectedVoiceProfile={selectedVoiceProfile}
              autoSpeakReplies={settings.autoSpeakReplies}
              roomPersistedCount={allMessages.length}
              activeAlarms={activeAlarms}
              activeCallContact={activeCallContact}
              voiceDraftTranscript={voiceDraftTranscript}
              onConsumeVoiceDraft={() => setVoiceDraftTranscript('')}
              onSelectSession={handleSelectSession}
              onCreateNewSession={handleCreateNewSession}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleRenameSession}
              onGenerateNanoBananaInChat={handleGenerateNanoBananaInChat}
              onSelectRelationshipStage={handleSelectRelationshipStage}
              onSelectVoiceProfile={handleSelectVoiceProfile}
              onToggleAutoSpeak={() =>
                handleUpdateSettings({ autoSpeakReplies: !settings.autoSpeakReplies })
              }
              onToggleTokenStreaming={() =>
                handleUpdateSettings({ tokenStreaming: !settings.tokenStreaming })
              }
              onToggleDeeperSearch={() =>
                handleUpdateSettings({ deeperSearch: !settings.deeperSearch })
              }
              onOpenSettings={() => setIsSettingsOpen(true)}
              onDismissAlarm={(alarmId) =>
                setActiveAlarms((prev) => prev.filter((a) => a.id !== alarmId))
              }
              onEndContactCall={() => setActiveCallContact(null)}
              onSelectMode={handleSelectMode}
              onChangeModelTier={setModelTier}
              onChangeGrounding={setGrounding}
              onDismissBanner={() => setModeShiftBanner('')}
              onSendMessage={handleSendMessage}
              onEditAndRetryMessage={handleEditAndRetryMessage}
              onRetryMessage={handleRetryMessage}
              onDeleteMessage={handleDeleteSingleMessage}
              onSpeakMessage={handleSpeakText}
              onStopSpeaking={handleStopSpeaking}
              onStopResponse={handleStopKaraResponse}
              onToggleMicRecording={handleToggleMicRecording}
              onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
              onClearConversation={handleClearConversation}
              activeGemName={activeGemObj?.name || null}
              onClearActiveGem={() => handleUpdateSettings({ activeGemId: null })}
              onUserTyping={handleUserTyping}
              onTriggerProactiveCheckin={() => triggerProactiveCheckin(settings.proactiveIdleMinutes || 5)}
              responseStylePreset={responseStylePreset}
              funMode={funMode}
              onSelectResponseStylePreset={(preset) => {
                setResponseStylePreset(preset);
                try {
                  localStorage.setItem('kara_response_style_preset_v1', preset);
                } catch {}
                const presetMeta = RESPONSE_STYLE_PRESETS.find((p) => p.id === preset);
                if (presetMeta) {
                  setModeShiftBanner(
                    `Response Style set to ${presetMeta.label} — ${presetMeta.whenToUse}`
                  );
                }
              }}
              onToggleFunMode={() => {
                setFunMode((prev) => {
                  const next = !prev;
                  try {
                    localStorage.setItem('kara_fun_mode_v1', String(next));
                  } catch {}
                  setModeShiftBanner(
                    next
                      ? 'Fun Mode ON: Wit, pop-culture references, casual spark & confident immediacy boosted.'
                      : 'Fun Mode OFF: Grounded, natural conversational cadence active.'
                  );
                  return next;
                });
              }}
            />
          </div>
        )}

        {/* VIEW 2: PERSISTENT LONG-TERM MEMORY VAULT (Opened from Settings) */}
        {activeView === 'memories' && (
          <div className="max-w-4xl w-full mx-auto p-6 space-y-6">
            <div className="pb-5 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>Sector 9 Adaptive Human Learning & Long-Term Bonding</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {visibleMemories.length} Stored Nodes
                  </span>
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-white">
                  KARA Persistent Memory Vault
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('chat')}
                className="px-4 py-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-sky-300"
              >
                ← Back to Chat
              </button>
            </div>

            <form
              onSubmit={handleAddManualMemory}
              className="bg-[#0F131C] border border-neutral-800 rounded-3xl p-5 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
            >
              <div className="sm:w-40">
                <label className="block text-xs text-neutral-300 mb-1.5">Category</label>
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value as MemoryCategory)}
                  className="w-full px-3 py-2.5 text-xs bg-neutral-900 border border-neutral-800 rounded-2xl text-white"
                >
                  <option value="preference">Preference</option>
                  <option value="fact">Personal Fact</option>
                  <option value="emotion">Emotional Note</option>
                  <option value="bond">Key Event / Bond</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-neutral-300 mb-1.5">
                  Teach KARA Something About You
                </label>
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="e.g., My favorite color is blue, and I love immersive roleplay..."
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-2xl text-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-2xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Store Memory</span>
              </button>
            </form>

            <div className="bg-[#0F131C] border border-neutral-800 rounded-3xl divide-y divide-neutral-800">
              {visibleMemories.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-medium text-neutral-300">
                    No Long-Term Memories Stored Yet
                  </p>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    As you chat with KARA, her Sector 9 learning matrix automatically distills your preferences, personal facts, and emotional milestones here.
                  </p>
                </div>
              ) : (
                visibleMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm text-white">{mem.content}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span className="capitalize text-sky-400">{mem.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Importance {mem.importance}/5
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (user) {
                          await deleteMemoryItem(user.uid, mem.id);
                          if (!isFirebaseCloudUser()) {
                            setMemories((prev) => prev.filter((x) => x.id !== mem.id));
                          }
                        } else {
                          setMemories((prev) => prev.filter((x) => x.id !== mem.id));
                        }
                      }}
                      className="p-2 text-neutral-500 hover:text-rose-400 rounded-xl hover:bg-neutral-800 transition-colors"
                      title="Forget memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: MULTIMODAL CREATIVE STUDIO (Opened from Settings) */}
        {activeView === 'studio' && <MultimodalStudio />}

        {/* VIEW 4: GOOGLE WORKSPACE HUB (Opened from Settings) */}
        {activeView === 'workspace' && (
          <WorkspaceHub
            onConnectGoogle={async () => {
              await googleSignIn();
            }}
            activeMode={profile.preferredMode}
            memoriesSummary={visibleMemories.map((m) => `[${m.category}] ${m.content}`).join('\n')}
          />
        )}
      </main>

      {/* SETTINGS MODAL (Active Persona, Mode Switcher, Agenda, Set Alarm, Memory Vault, Creative Studio, Workspace, Tokens, DeeperSearch, Think, Maps, Unlockable Stats, Voice Engines & Hard Reset) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        userName={profile.displayName}
        activeMode={profile.preferredMode}
        autoAdaptMode={profile.autoAdaptMode}
        selectedVoiceProfile={selectedVoiceProfile}
        modelTier={modelTier}
        grounding={grounding}
        bondLevel={profile.bondLevel}
        soapWashCount={profile.soapWashCount}
        memories={visibleMemories}
        activeAlarms={activeAlarms}
        onSelectMode={handleSelectMode}
        onToggleAutoAdapt={handleToggleAutoAdapt}
        onUpdateSettings={handleUpdateSettings}
        onSelectVoiceProfile={handleSelectVoiceProfile}
        onChangeModelTier={setModelTier}
        onChangeGrounding={setGrounding}
        onSelectRelationshipStage={handleSelectRelationshipStage}
        onAddMemory={async (category, content) => {
          const item = {
            category,
            content: content.trim().slice(0, 500),
            importance: 4,
          };
          if (user) {
            const saved = await saveMemoryItem(user.uid, item);
            if (!isFirebaseCloudUser() && saved) {
              setMemories((prev) => [saved as MemoryItemData, ...prev]);
            }
          } else {
            setMemories((prev) => [
              {
                id: `mem_${Date.now()}`,
                userId: 'guest',
                ...item,
              },
              ...prev,
            ]);
          }
        }}
        onDeleteMemory={async (memId) => {
          if (user) {
            await deleteMemoryItem(user.uid, memId);
            if (!isFirebaseCloudUser()) {
              setMemories((prev) => prev.filter((x) => x.id !== memId));
            }
          } else {
            setMemories((prev) => prev.filter((x) => x.id !== memId));
          }
        }}
        onOpenFullMemoryVault={() => setActiveView('memories')}
        onOpenCreativeStudio={() => setActiveView('studio')}
        onOpenWorkspace={() => setActiveView('workspace')}
        onTriggerAgenda={() => {
          setActiveView('chat');
          handleSendMessage("What's on my agenda today?");
        }}
        onTriggerSetAlarm={(timeText, labelText) => {
          setActiveView('chat');
          handleSendMessage(
            `Set an alarm for ${timeText} for ${labelText || 'KARA Smart Alarm'}`
          );
        }}
        onDismissAlarm={(alarmId) =>
          setActiveAlarms((prev) => prev.filter((a) => a.id !== alarmId))
        }
        onRunGemInChat={(gem, promptText) => {
          setActiveView('chat');
          handleUpdateSettings({ activeGemId: gem.id });
          handleSendMessage(promptText);
        }}
        onTriggerDepressionCheckIn={() => {
          setActiveView('chat');
          handleSendMessage("KARA, can you check on me? I've been feeling really down and overwhelmed today.");
        }}
        onTriggerProactiveCheckin={(min) => {
          setActiveView('chat');
          triggerProactiveCheckin(min);
        }}
        onTriggerRecall={(recallCommand) => {
          setActiveView('chat');
          handleSendMessage(recallCommand);
        }}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onTestVoice={(sampleType) => {
          if (sampleType === 'short') {
            handleSpeakText(
              `Hey ${profile.displayName}! Quick short-form check-in—my voice is locked in and ready.`,
              'settings_voice_test_short',
              profile.preferredMode,
              selectedVoiceProfile.gender,
              'short'
            );
          } else {
            handleSpeakText(
              `Hey ${profile.displayName}, it's really good to talk with you. Whether you want a quick two-sentence comeback or a deep, multi-paragraph breakdown of world events, pop culture, or late-night thoughts, I can read every single word aloud from start to finish in my natural voice without cutting off.`,
              'settings_voice_test_long',
              profile.preferredMode,
              selectedVoiceProfile.gender,
              'full'
            );
          }
        }}
        onHardReset={handleHardReset}
      />

      {/* EMAIL & PASSWORD AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedInUser, prof) => {
          setUser(loggedInUser);
          setProfile(prof);
        }}
      />

      {/* REAL-TIME LIVE VOICE MODAL */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        activeMode={profile.preferredMode}
        userName={profile.displayName}
        voiceName={selectedVoiceProfile.voiceName}
      />
    </div>
  );
}
