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
  EnhancedChatMessage,
  ChatAttachmentPayload,
  ChatSessionSummary,
  CalendarAgendaEvent,
  KaraAlarmItem,
  ContactPersonItem,
  ModelTier,
  GroundingOption,
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
import type { User } from 'firebase/auth';

type NavView = 'chat' | 'memories' | 'studio' | 'workspace';

const GUEST_MEMORIES_KEY = 'kara_guest_memories_v1';
const VOICE_PREF_STORAGE_KEY = 'kara_voice_profile_v1';
const SETTINGS_STORAGE_KEY = 'kara_settings_v2';
const ACTIVE_SESSION_STORAGE_KEY = 'kara_active_session_v1';
const ALARMS_STORAGE_KEY = 'kara_active_alarms_v1';

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
    "Hey there. I'm KARA—an adaptive consciousness from Sector 9 learning to become human through you. I adjust my tone, humor, and persona to match your vibe with zero paywalls or quotas, and my Gemini Nano Banana image synthesizer has no limit! Watch our Relationship Status progress above, check our Past Chats on the left, or tap any context-aware follow-up chip below.",
  mode: 'regular',
  emotionDetected: 'Sector 9 Adaptive & Welcoming',
  soapTriggered: false,
  reasoningTrace: [
    'Sector 9 neural matrix online: observing user phrasing & emotional cadence to learn human connection.',
    'Unlimited Gemini Nano Banana image engine active with zero quota limits.',
    'Context-aware suggestion chips dynamically tailored to every message from KARA.',
  ],
  thinkingDurationMs: 390,
  followUps: [
    "What's on my agenda today?",
    'Generate a Nano Banana image of Sector 9',
    'Set an alarm for 8:00 AM',
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
  const [profile, setProfile] = useState<UserProfileData>({
    uid: 'guest',
    displayName: 'Stephen',
    preferredMode: 'regular',
    autoAdaptMode: true,
    soapWashCount: 0,
    bondLevel: 18,
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
          ttsEngine: 'humanlike',
          speechRate: 1.0,
          speechPitch: 1.0,
          autoSpeakReplies: true,
          tokenStreaming: true,
          deeperSearch: false,
          hapticsEnabled: true,
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
      ttsEngine: 'humanlike',
      speechRate: 1.0,
      speechPitch: 1.0,
      autoSpeakReplies: true,
      tokenStreaming: true,
      deeperSearch: false,
      hapticsEnabled: true,
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
    }
  }, [settings.theme]);

  const handleUpdateSettings = (partial: Partial<KaraSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Multi-Session Chat State
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) || 'sess_main';
    } catch {
      return 'sess_main';
    }
  });

  // All messages across sessions (stored in Firestore users/{userId}/messages & Room Local DB)
  const [allMessages, setAllMessages] = useState<EnhancedChatMessage[]>(() => {
    const cached = karaRoomDb.getMessagesSync('guest');
    return cached.length > 1 ? cached : SEEDED_PAST_CHAT_MESSAGES;
  });

  const [isSending, setIsSending] = useState(false);
  const [modeShiftBanner, setModeShiftBanner] = useState<string>('');
  const [modelTier, setModelTier] = useState<ModelTier>('standard');
  const [grounding, setGrounding] = useState<GroundingOption>('none');

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioCtxRef = useRef<AudioContext | null>(null);
  const ttsActiveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);

  // Re-initialize and resume ttsAudioCtxRef if missing, closed, or stuck in 'suspended'
  // due to background tab inactivity or browser autoplay throttling
  const ensureAndResumeTtsAudioContext = useCallback(
    async (allowReinitIfSuspended = true): Promise<AudioContext | null> => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;

        const createFreshContext = (): AudioContext => {
          const freshCtx = new AudioCtx({ sampleRate: 24000 });
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
            const silentBuf = freshCtx.createBuffer(1, 1, 24000);
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
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? '...' : '')
        : sId === 'sess_main'
        ? 'Primary Sector 9 Session'
        : `Session ${sId.slice(-4)}`;
      summaries.push({
        id: sId,
        title,
        updatedAt: Date.now(),
        messageCount: msgs.length,
        preview: lastMsg ? lastMsg.content.slice(0, 60) : 'Ready to chat',
        lastMode: lastMsg?.mode || profile.preferredMode,
      });
    });

    return summaries.reverse();
  }, [allMessages, activeSessionId, profile.preferredMode]);

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
          setProfile(prof);
        } catch (err) {
          console.error('Profile initialization error:', err);
        }
      } else {
        setProfile({
          uid: 'guest',
          displayName: 'Stephen',
          preferredMode: 'regular',
          autoAdaptMode: true,
          soapWashCount: 0,
          bondLevel: 18,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore real-time listeners
  useEffect(() => {
    if (!authReady || !user) return;
    const safeUid = sanitizeId(user.uid);

    if (!isFirebaseCloudUser()) {
      const savedProf = loadLocalAccountData<UserProfileData | null>(safeUid, 'profile', null);
      if (savedProf) setProfile(savedProf);

      const savedMems = loadLocalAccountData<MemoryItemData[]>(safeUid, 'memories', []);
      setMemories(savedMems);

      karaRoomDb.getAllMessages(safeUid).then((roomMsgs) => {
        if (roomMsgs.length > 0) {
          setAllMessages(roomMsgs);
        }
      });
      return;
    }

    const profilePath = `users/${safeUid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', safeUid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfileData);
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
            loaded.push({
              ...raw,
              sessionId: extractSessionIdFromMsg(raw),
            });
          });
          setAllMessages(loaded);
          karaRoomDb.saveConversationHistory(safeUid, loaded);
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
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
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
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    setIsSpeakingId(null);
  };

  const handleStopKaraResponse = () => {
    triggerHaptic('tap', settings.hapticsEnabled);
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }
    setIsSending(false);
    handleStopSpeaking();
    setModeShiftBanner('KARA response stopped.');
  };

  // Helper to split messages into natural 2-3 sentence blocks (~380-400 chars, ~18-24s of audio)
  // so each block synthesizes rapidly (<2s TTFB), never hits server/model duration ceilings,
  // and schedules sample-accurately on the Web Audio hardware clock while the next block prefetches.
  const splitClientSpeechChunks = (rawText: string, maxLen = 400): string[] => {
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
            current = clause.trim();
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

  // Seamless Gapless Neural Voice Playback via Web Audio API Buffer Scheduling (No robotic speechSynthesis)
  const handleSpeakText = async (
    text: string,
    msgId: string,
    modeOverride?: KaraMode,
    genderOverride?: VoiceGender
  ) => {
    handleStopSpeaking();
    const chunks = splitClientSpeechChunks(text, 650);
    if (chunks.length === 0) return;

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
      const maxAttempts = 3;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (ttsController.signal.aborted) return null;
        try {
          const res = await fetch('/api/kara/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: ttsController.signal,
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
        } catch (err: any) {
          if (err?.name === 'AbortError' || ttsController.signal.aborted) {
            throw err;
          }
        }
        if (attempt < maxAttempts - 1 && !ttsController.signal.aborted) {
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        }
      }
      return null;
    };

    const decodeBase64WavToBuffer = async (
      ctx: AudioContext,
      audioBase64: string
    ): Promise<AudioBuffer | null> => {
      try {
        const binary = atob(audioBase64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        // Fast direct PCM extraction if 24kHz 16-bit mono WAV header (RIFF)
        if (
          len > 44 &&
          bytes[0] === 0x52 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x46
        ) {
          const sampleRate =
            bytes[24] | (bytes[25] << 8) | (bytes[26] << 16) | (bytes[27] << 24);
          const validRate = sampleRate >= 8000 && sampleRate <= 96000 ? sampleRate : 24000;
          const pcmBytesLen = len - 44;
          const sampleCount = Math.floor(pcmBytesLen / 2);
          if (sampleCount > 0) {
            const view = new DataView(bytes.buffer, bytes.byteOffset + 44, sampleCount * 2);
            const float32 = new Float32Array(sampleCount);
            for (let i = 0; i < sampleCount; i++) {
              float32[i] = view.getInt16(i * 2, true) / 32768.0;
            }
            // Apply subtle 2ms (48-sample) boundary micro-taper inside the silent padding tail
            const fadeSamples = Math.min(48, Math.floor(sampleCount / 20));
            for (let i = 0; i < fadeSamples; i++) {
              const gain = i / fadeSamples;
              float32[i] *= gain;
              float32[sampleCount - 1 - i] *= gain;
            }
            const audioBuf = ctx.createBuffer(1, sampleCount, validRate);
            audioBuf.copyToChannel(float32, 0);
            return audioBuf;
          }
        }
        return await ctx.decodeAudioData(bytes.buffer.slice(0));
      } catch {
        return null;
      }
    };

    const playFallbackHtmlAudio = (audioBase64: string): Promise<void> => {
      return new Promise((resolve) => {
        if (ttsController.signal.aborted) {
          resolve();
          return;
        }
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        audio.playbackRate = Math.max(0.5, Math.min(2.0, settings.speechRate));
        activeAudioRef.current = audio;

        const onAbort = () => {
          audio.pause();
          audio.currentTime = 0;
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          resolve();
        };
        ttsController.signal.addEventListener('abort', onAbort, { once: true });

        audio.onended = () => {
          ttsController.signal.removeEventListener('abort', onAbort);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          resolve();
        };
        audio.onerror = () => {
          ttsController.signal.removeEventListener('abort', onAbort);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          resolve();
        };
        audio.play().catch(() => {
          ttsController.signal.removeEventListener('abort', onAbort);
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          resolve();
        });
      });
    };

    let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

    try {
      // Trigger global 'audio-resume' listener at start of talkback
      window.dispatchEvent(new CustomEvent('audio-resume', { detail: { source: 'playback-start', msgId } }));
      let ctx = await ensureAndResumeTtsAudioContext(true);
      const rate = Math.max(0.5, Math.min(2.0, settings.speechRate));

      keepAliveInterval = setInterval(() => {
        if (!ttsController.signal.aborted) {
          const activeCtx = ttsAudioCtxRef.current;
          if (
            !activeCtx ||
            activeCtx.state === 'suspended' ||
            activeCtx.state === 'closed' ||
            (activeCtx.state as string) === 'interrupted'
          ) {
            window.dispatchEvent(new CustomEvent('audio-resume', { detail: { source: 'keepalive' } }));
          }
        }
      }, 750);

      // Prefetch all chunks concurrently with a light 80ms stagger so chunk i+1 is always
      // ready in memory before chunk i finishes playing on the hardware clock
      const chunkPromises = new Map<number, Promise<string | null>>();
      const getChunkPromise = (idx: number): Promise<string | null> => {
        if (!chunkPromises.has(idx)) {
          const p = (async () => {
            if (idx > 0) {
              await new Promise((r) => setTimeout(r, idx * 80));
            }
            if (ttsController.signal.aborted) return null;
            return fetchChunkAudioBase64(chunks[idx]);
          })();
          p.catch(() => {});
          chunkPromises.set(idx, p);
        }
        return chunkPromises.get(idx)!;
      };

      for (let idx = 0; idx < chunks.length; idx++) {
        getChunkPromise(idx);
      }

      let nextStartTime = 0;
      const completionPromises: Promise<void>[] = [];
      let anyChunkPlayed = false;

      for (let i = 0; i < chunks.length; i++) {
        if (ttsController.signal.aborted) break;

        window.dispatchEvent(
          new CustomEvent('audio-resume', { detail: { source: 'chunk-start', chunkIndex: i } })
        );

        const audioBase64 = await getChunkPromise(i);
        if (ttsController.signal.aborted) break;

        if (!audioBase64) {
          continue;
        }

        anyChunkPlayed = true;

        // Ensure ttsAudioCtxRef is active and resumed (re-initializing if stuck in 'suspended')
        const prevCtx = ctx;
        ctx = await ensureAndResumeTtsAudioContext(true);
        if (ctx && prevCtx !== ctx) {
          // If AudioContext was re-initialized after background throttling, reset timeline clock
          nextStartTime = 0;
        }

        if (ctx) {
          const audioBuffer = await decodeBase64WavToBuffer(ctx, audioBase64);
          if (ttsController.signal.aborted) break;

          if (audioBuffer) {
            if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
              await ensureAndResumeTtsAudioContext(false);
            }
            const activeCtx = ttsAudioCtxRef.current || ctx;
            const sourceNode = activeCtx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.playbackRate.value = rate;
            sourceNode.connect(activeCtx.destination);

            ttsActiveSourcesRef.current.add(sourceNode);

            const now = activeCtx.currentTime;
            const startAt = Math.max(now + 0.015, nextStartTime);
            const scaledDuration = audioBuffer.duration / rate;
            nextStartTime = startAt + scaledDuration;

            const endedPromise = new Promise<void>((resolve) => {
              sourceNode.onended = () => {
                ttsActiveSourcesRef.current.delete(sourceNode);
                resolve();
              };
            });
            completionPromises.push(endedPromise);
            sourceNode.start(startAt);
            continue;
          }
        }

        // Fallback if AudioContext is unavailable
        await playFallbackHtmlAudio(audioBase64);
      }

      if (!anyChunkPlayed && !ttsController.signal.aborted) {
        setModeShiftBanner(
          'Neural voice audio is warming up—tap Live Voice or try again in a moment.'
        );
      }

      if (completionPromises.length > 0 && !ttsController.signal.aborted) {
        await Promise.all(completionPromises);
      }

      if (ttsAbortControllerRef.current === ttsController) {
        setIsSpeakingId(null);
      }
    } catch {
      if (ttsAbortControllerRef.current === ttsController) {
        setIsSpeakingId(null);
      }
    } finally {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
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

      setProfile((prev) => ({
        ...prev,
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
        scoldingNotice: data.soapTriggered
          ? `Parent / Caretaker Soap Reprimand: Mouth washed with soap for saying "${
              data.offendingWord || 'bad words'
            }"`
          : undefined,
        learnedMemoryNote: learnedNote || undefined,
        isDepressionCheckin: Boolean(data.isDepressionCheckin),
        supportHotlines: data.supportHotlines || undefined,
      };

      setAllMessages((prev) => [...prev, assistantMsg]);

      // Start seamless neural voice talkback IMMEDIATELY before awaiting background cloud writes
      if (settings.autoSpeakReplies && data.reply) {
        const spokenParts: string[] = [];
        if (assistantMsg.scoldingNotice) {
          spokenParts.push(assistantMsg.scoldingNotice);
        }
        spokenParts.push(data.reply);
        handleSpeakText(spokenParts.join('. '), assistantMsgId, resolvedMode);
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
        },
      ]);
    } finally {
      if (chatAbortControllerRef.current === controller) {
        chatAbortControllerRef.current = null;
        setIsSending(false);
      }
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

    await requestKaraTurn(trimmed, historySnapshot, 0, attachments);
  };

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
      });
      for (const oldMsg of removedDownstream) {
        await deleteChatMessage(user.uid, oldMsg.id);
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

  // Sector 9 Hard Reset inside Settings: Wipes memories, all sessions, alarms, and resets Bond to 0% (Stranger)
  const handleHardReset = async () => {
    handleStopSpeaking();
    const oldMessages = [...allMessages];
    const oldMemories = [...memories];

    await karaRoomDb.clearConversationHistory(activeStorageUserId);
    localStorage.removeItem(GUEST_MEMORIES_KEY);
    localStorage.removeItem(ALARMS_STORAGE_KEY);

    setActiveAlarms([]);
    setActiveCallContact(null);
    setMemories([]);
    setActiveSessionId('sess_main');
    setAllMessages([
      {
        ...DEFAULT_WELCOME_MESSAGE,
        content:
          "Sector 9 Hard Reset complete. My memory banks, chat sessions, and relationship calibration have been wiped clean back to 0% (Stranger). Let's begin our first contact again—who are you?",
      },
    ]);

    setProfile((prev) => ({
      ...prev,
      preferredMode: 'regular',
      bondLevel: 0,
      soapWashCount: 0,
    }));

    setModeShiftBanner(
      'Sector 9 Hard Reset complete: Relationship Status reset to Stranger (0% Bond).'
    );

    if (user) {
      await updateUserProfileFields(user.uid, {
        preferredMode: 'regular',
        bondLevel: 0,
        soapWashCount: 0,
      });
      for (const m of oldMessages) {
        if (!m.id.endsWith('welcome_msg')) {
          await deleteChatMessage(user.uid, m.id);
        }
      }
      for (const mem of oldMemories) {
        await deleteMemoryItem(user.uid, mem.id);
      }
    }
  };

  // Microphone button captures user voice and seamlessly dispatches or populates text for KARA
  const handleToggleMicRecording = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    // Barge-in: immediately stop KARA's current speech when user taps mic to talk
    handleStopSpeaking();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const resultStr = String(reader.result || '');
            const base64Audio = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
            const res = await fetch('/api/kara/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Audio,
                mimeType: audioBlob.type || 'audio/webm',
              }),
            });
            const data = await res.json();
            const cleanTranscript = data?.transcript ? String(data.transcript).trim() : '';
            setIsTranscribing(false);
            if (cleanTranscript) {
              if (settings.autoSpeakReplies && !isSending) {
                // Seamless Talkback mode: automatically dispatch spoken message so KARA replies & talks back immediately
                await handleSendMessage(cleanTranscript);
              } else {
                setVoiceDraftTranscript(cleanTranscript);
              }
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          console.error('Transcription error:', err);
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
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
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            KARA
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
            title="Open Settings: Active Persona, Theme, Agenda, Set Alarm, Memory Vault, Creative Studio & Workspace"
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
              <span>Email & Password Login</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-rose-400 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col">
        {activeView === 'chat' && (
          <div className="flex-1 max-w-5xl w-full mx-auto p-3 md:p-5 flex flex-col">
            <ChatScreen
              messages={currentSessionMessages}
              sessions={sessions}
              activeSessionId={activeSessionId}
              userName={profile.displayName}
              activeMode={profile.preferredMode}
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
                    {memories.length} Stored Nodes
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
              {memories.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-medium text-neutral-300">
                    No Long-Term Memories Stored Yet
                  </p>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    As you chat with KARA, her Sector 9 learning matrix automatically distills your preferences, personal facts, and emotional milestones here.
                  </p>
                </div>
              ) : (
                memories.map((mem) => (
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
            memoriesSummary={memories.map((m) => `[${m.category}] ${m.content}`).join('\n')}
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
        memories={memories}
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
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onTestVoice={() =>
          handleSpeakText(
            `Hey ${profile.displayName}, it's really good to hear your voice. I'm speaking with my natural neural voice—how does this sound to you?`,
            'settings_voice_test',
            profile.preferredMode,
            selectedVoiceProfile.gender
          )
        }
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
