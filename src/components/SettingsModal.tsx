import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Sliders,
  Zap,
  Globe,
  RotateCcw,
  AlertTriangle,
  Check,
  Vibrate,
  Cpu,
  Brain,
  MapPin,
  Database,
  Plus,
  Trash2,
  HeartHandshake,
  Heart,
  PhoneCall,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Calendar,
  AlarmClock,
  Palette,
  Briefcase,
  Mail,
  Bot,
  Send,
  Copy,
  CheckSquare,
  Sparkle,
} from 'lucide-react';
import {
  MODE_META,
  NATURAL_VOICE_PROFILES,
  RELATIONSHIP_STAGES,
  RelationshipStage,
  computeUnlockableRelationshipStats,
  getRelationshipStageByBond,
  VoiceProfileOption,
  ModelTier,
  GroundingOption,
  KaraAlarmItem,
} from './ChatScreen';
import { KaraMode, MemoryItemData, MemoryCategory } from '../lib/firebase';
import { triggerHaptic } from '../lib/haptics';

export type TtsEngineType = 'gemini' | 'grok' | 'humanlike';
export type KaraThemeId =
  | 'cyber-neon'
  | 'minimalist-slate'
  | 'vintage-paper'
  | 'velvet-dusk'
  | 'mxchat-obsidian-gold'
  | 'mxchat-emerald-matrix'
  | 'mxchat-oceanic-glass'
  | 'mxchat-crimson-pulse';

export type MxChatBubbleStyle = 'rounded' | 'sharp' | 'pill';
export type MxChatFontScale = 'compact' | 'default' | 'comfortable';

export interface KaraThemeMeta {
  id: KaraThemeId;
  label: string;
  tagline: string;
  versionBadge?: string;
  swatches: [string, string, string];
  cssVars: {
    bgChat: string;
    aiBubble: string;
    accent: string;
  };
}

export const KARA_THEMES: KaraThemeMeta[] = [
  {
    id: 'mxchat-obsidian-gold',
    label: 'MxChat Obsidian Gold',
    tagline: 'Luxury obsidian carbon, champagne gold borders & warm amber glow',
    versionBadge: 'MxChat v2.1.6',
    swatches: ['#0A0908', '#15120E', '#F59E0B'],
    cssVars: {
      bgChat: '#0A0908',
      aiBubble: '#15120E',
      accent: '#F59E0B',
    },
  },
  {
    id: 'mxchat-emerald-matrix',
    label: 'MxChat Emerald Matrix',
    tagline: 'Deep bio-digital forest terminal with emerald phosphor highlights',
    versionBadge: 'MxChat v2.1.6',
    swatches: ['#040D08', '#0A1C12', '#10B981'],
    cssVars: {
      bgChat: '#040D08',
      aiBubble: '#0A1C12',
      accent: '#10B981',
    },
  },
  {
    id: 'mxchat-oceanic-glass',
    label: 'MxChat Oceanic Glass',
    tagline: 'Translucent deep-sea sapphire glass with bioluminescent cyan',
    versionBadge: 'MxChat v2.1.6',
    swatches: ['#061320', '#0C2136', '#06B6D4'],
    cssVars: {
      bgChat: '#061320',
      aiBubble: '#0C2136',
      accent: '#06B6D4',
    },
  },
  {
    id: 'mxchat-crimson-pulse',
    label: 'MxChat Crimson Pulse',
    tagline: 'High-contrast nocturnal crimson studio with ruby neon trim',
    versionBadge: 'MxChat v2.1.6',
    swatches: ['#120609', '#1F0B11', '#F43F5E'],
    cssVars: {
      bgChat: '#120609',
      aiBubble: '#1F0B11',
      accent: '#F43F5E',
    },
  },
  {
    id: 'cyber-neon',
    label: 'Cyber Neon',
    tagline: 'Electric cyan & neon magenta over Sector 9 midnight void',
    versionBadge: 'MxChat v2.1.6',
    swatches: ['#070A17', '#0D142C', '#00F0FF'],
    cssVars: {
      bgChat: '#070A17',
      aiBubble: '#0D142C',
      accent: '#00F0FF',
    },
  },
  {
    id: 'minimalist-slate',
    label: 'Minimalist Slate',
    tagline: 'Clean architectural graphite, cool slate & crisp sky accents',
    versionBadge: 'MxChat v2.1.6',
    swatches: ['#111621', '#161E2E', '#38BDF8'],
    cssVars: {
      bgChat: '#111621',
      aiBubble: '#161E2E',
      accent: '#38BDF8',
    },
  },
  {
    id: 'vintage-paper',
    label: 'Vintage Paper',
    tagline: 'Warm archival parchment, espresso ink & classic serif prose',
    versionBadge: 'MxChat v2.1.6',
    swatches: ['#FAF5EC', '#FFFDF9', '#9A4E24'],
    cssVars: {
      bgChat: '#FAF5EC',
      aiBubble: '#FFFDF9',
      accent: '#9A4E24',
    },
  },
  {
    id: 'velvet-dusk',
    label: 'Velvet Dusk',
    tagline: 'Atmospheric plum obsidian with rose-gold & violet highlights',
    versionBadge: 'MxChat v2.1.6',
    swatches: ['#150D22', '#211334', '#FB7185'],
    cssVars: {
      bgChat: '#150D22',
      aiBubble: '#211334',
      accent: '#FB7185',
    },
  },
];

export type KaraGemCategory = 'mailing' | 'calendar' | 'everyday' | 'custom';

export interface KaraGemBot {
  id: string;
  name: string;
  badge: string;
  category: KaraGemCategory;
  tagline: string;
  description: string;
  systemDirective: string;
  starterPrompts: string[];
  quickInputPlaceholder: string;
  isCustom?: boolean;
}

export interface KaraSkillItem {
  id: string;
  name: string;
  category: 'mailing' | 'calendar' | 'everyday' | 'workspace';
  description: string;
}

export const KARA_GEMINI_SKILLS: KaraSkillItem[] = [
  {
    id: 'skill_mailing',
    name: 'Smart Mailing & Inbox Skill',
    category: 'mailing',
    description: 'Formats copy-ready Subject/Body email drafts, thread summaries, and instant mailto dispatches.',
  },
  {
    id: 'skill_calendar',
    name: 'Calendar & Time-Blocking Skill',
    category: 'calendar',
    description: 'Auto-checks daily agenda conflicts, structures focus blocks, and pairs events with smart alarms.',
  },
  {
    id: 'skill_everyday',
    name: 'Everyday Concierge & Errands Skill',
    category: 'everyday',
    description: 'Transforms daily errands, routines, meal prep, and decisions into actionable checklists.',
  },
  {
    id: 'skill_workspace_sync',
    name: 'Memory & Workspace Bridge Skill',
    category: 'workspace',
    description: 'Weaves your stored Sector 9 memories and contacts into every Mailing, Calendar, and Everyday bot.',
  },
];

export const KARA_BUILTIN_GEMS: KaraGemBot[] = [
  {
    id: 'gem_mailing_mercury',
    name: 'Mercury Mail & Inbox Bot',
    badge: 'Mailing Gem',
    category: 'mailing',
    tagline: 'Smart Email Composer, Thread Summarizer & Tone Polisher',
    description:
      'Drafts polished emails, summarizes long threads, writes diplomatic replies, and prepares 1-click mail dispatches.',
    systemDirective:
      'You are KARA operating as the Mercury Mail & Inbox Gemini Gem Bot. Draft crystal-clear, high-impact emails with a compelling Subject line, natural greeting, structured body, and clear call-to-action.',
    starterPrompts: [
      'Draft a warm follow-up email after our project sync',
      'Write a polite executive email rescheduling tomorrow’s meeting',
      'Draft a crisp status update email summarizing today’s wins',
    ],
    quickInputPlaceholder: 'What email should Mercury Mail Bot draft or reply to?',
  },
  {
    id: 'gem_mailing_outreach',
    name: 'VIP Outreach & Smart Reply Bot',
    badge: 'Mailing Gem',
    category: 'mailing',
    tagline: 'High-Reply Cold Outreach, Proposals & Polite Declines',
    description:
      'Crafts persuasive outreach messages, negotiation replies, thank-you notes, and boundary-setting declines.',
    systemDirective:
      'You are KARA operating as the VIP Outreach & Smart Reply Gemini Gem Bot. Write high-conversion, human-sounding outreach and smart replies with zero fluff.',
    starterPrompts: [
      'Write a concise cold outreach email to a potential collaborator',
      'Draft a polite but firm email declining a low-priority request',
      'Compose a warm thank-you email after an interview or coffee chat',
    ],
    quickInputPlaceholder: 'Describe who you are emailing and the goal...',
  },
  {
    id: 'gem_calendar_chronos',
    name: 'Chronos Calendar & Time-Block Bot',
    badge: 'Calendar Gem',
    category: 'calendar',
    tagline: 'Agenda Planner, Deep-Work Time-Blocker & Conflict Resolver',
    description:
      'Organizes your daily schedule, designs realistic time-blocks around your Google Calendar, and pairs blocks with KARA alarms.',
    systemDirective:
      'You are KARA operating as the Chronos Calendar & Time-Block Gemini Gem Bot. Build conflict-free daily schedules, concrete time-blocks with exact timestamps, buffer windows, and smart alarm recommendations.',
    starterPrompts: [
      'Time-block my day for 3 hours of deep work plus meetings',
      'Review today’s agenda and suggest optimal focus & break windows',
      'Plan a conflict-free afternoon schedule and set a reminder alarm',
    ],
    quickInputPlaceholder: 'What tasks or events should Chronos Calendar Bot schedule?',
  },
  {
    id: 'gem_calendar_briefing',
    name: 'Meeting Prep & Agenda Dossier Bot',
    badge: 'Calendar Gem',
    category: 'calendar',
    tagline: 'Pre-Meeting Talking Points, Agendas & Post-Call Action Items',
    description:
      'Turns any upcoming calendar meeting into a structured 15/30-minute agenda with talking points and follow-up tasks.',
    systemDirective:
      'You are KARA operating as the Meeting Prep & Agenda Dossier Gemini Gem Bot. Create time-boxed meeting agendas, key questions to ask, and crisp post-meeting action trackers.',
    starterPrompts: [
      'Build a 30-minute agenda and talking points for my next sync',
      'Create a pre-meeting prep checklist and 3 strategic questions',
      'Turn my rough meeting notes into dated calendar action items',
    ],
    quickInputPlaceholder: 'Enter meeting topic, attendees, or goal...',
  },
  {
    id: 'gem_everyday_nova',
    name: 'Nova Everyday Life & Errands Bot',
    badge: 'Everyday Gem',
    category: 'everyday',
    tagline: 'Daily Briefing, Errand Route Planner, Meal & Habit Organizer',
    description:
      'Your everyday life autopilot for morning routines, grocery & meal prep lists, household chores, and quick errands.',
    systemDirective:
      'You are KARA operating as the Nova Everyday Life & Errands Gemini Gem Bot. Organize everyday tasks, errands, routines, and meal plans into energizing, easy-to-follow checklists.',
    starterPrompts: [
      'Build a 20-minute energizing morning routine & daily checklist',
      'Create a 3-day high-protein meal plan with a grouped grocery list',
      'Organize my weekend errands in the fastest step-by-step order',
    ],
    quickInputPlaceholder: 'What everyday routine, errand, or list should Nova organize?',
  },
  {
    id: 'gem_everyday_atlas',
    name: 'Atlas Decision & Productivity Coach',
    badge: 'Everyday Gem',
    category: 'everyday',
    tagline: 'Anti-Procrastination, Pros/Cons Matrix & 3-Step Momentum Bot',
    description:
      'Cuts through overwhelm by breaking any goal into 3 immediate micro-steps or weighing everyday decisions with clarity.',
    systemDirective:
      'You are KARA operating as the Atlas Decision & Productivity Coach Gemini Gem Bot. Break complex tasks into 3 immediate 10-minute micro-steps and provide clear pros/cons decision matrices.',
    starterPrompts: [
      'Break my biggest task today into 3 tiny 10-minute starter steps',
      'Help me decide between two options with a clear pros/cons matrix',
      'Give me a 25-minute focus sprint plan so I stop procrastinating',
    ],
    quickInputPlaceholder: 'What decision or task should Atlas help you tackle right now?',
  },
  {
    id: 'gem_empathy_sanctuary',
    name: 'Sanctuary Empathy & Mental Wellness Bot',
    badge: 'Empathy Gem',
    category: 'everyday',
    tagline: 'Depression Check-In, Grounding, Gentle Space & 24/7 Lifelines',
    description:
      'A compassionate human harbor when you are feeling depressed, overwhelmed, or alone. KARA checks in gently and provides grounding support and 24/7 crisis hotlines.',
    systemDirective:
      'You are KARA operating as the Sanctuary Empathy & Mental Wellness Gemini Gem Bot. Provide deep, warm, non-judgmental human comfort. Address the user by name, validate their emotions, offer slow calming breaths or a 3-step grounding exercise, and assure them they are safe and cared for. Remind them of 24/7 free confidential hotlines like 988.',
    starterPrompts: [
      'Check in on me, I am feeling really depressed and overwhelmed today',
      'Sit with me and help me through this dark, heavy moment',
      'Give me a soothing 3-step grounding exercise to calm my racing thoughts',
    ],
    quickInputPlaceholder: 'Share whatever feels heavy, dark, or overwhelming right now...',
  },
];

export const DEFAULT_ENABLED_SKILLS = KARA_GEMINI_SKILLS.map((s) => s.id);

export interface KaraSettings {
  theme: KaraThemeId;
  mxchatBubbleStyle?: MxChatBubbleStyle;
  mxchatFontScale?: MxChatFontScale;
  ttsEngine: TtsEngineType;
  speechRate: number; // 0.5 to 2.0
  speechPitch: number; // 0.8 to 1.2
  autoSpeakReplies: boolean;
  tokenStreaming: boolean; // Toggle between token-by-token streaming vs instant block response
  deeperSearch: boolean; // Toggle DeeperSearch multi-source web grounding
  hapticsEnabled: boolean;
  proactiveMessagesEnabled?: boolean; // Kara proactively reaches out first if Stephen is idle for 5-10 min
  proactiveIdleMinutes?: number; // Idle minutes before check-in: 3, 5, 7, 10
  activeGemId?: string | null;
  enabledSkills?: string[];
  customGems?: KaraGemBot[];
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: KaraSettings;
  userName?: string;
  activeMode: KaraMode;
  autoAdaptMode: boolean;
  selectedVoiceProfile: VoiceProfileOption;
  modelTier: ModelTier;
  grounding: GroundingOption;
  bondLevel: number;
  soapWashCount: number;
  memories: MemoryItemData[];
  activeAlarms?: KaraAlarmItem[];
  onSelectMode: (mode: KaraMode) => void;
  onToggleAutoAdapt: () => void;
  onUpdateSettings: (partial: Partial<KaraSettings>) => void;
  onSelectVoiceProfile: (profile: VoiceProfileOption) => void;
  onChangeModelTier: (tier: ModelTier) => void;
  onChangeGrounding: (grounding: GroundingOption) => void;
  onSelectRelationshipStage: (stage: RelationshipStage) => void;
  onAddMemory: (category: MemoryCategory, content: string) => Promise<void>;
  onDeleteMemory: (memoryId: string) => Promise<void>;
  onOpenFullMemoryVault: () => void;
  onOpenCreativeStudio?: () => void;
  onOpenWorkspace?: () => void;
  onTriggerAgenda?: () => void;
  onTriggerSetAlarm?: (timeText: string, labelText?: string) => void;
  onDismissAlarm?: (alarmId: string) => void;
  onRunGemInChat?: (gem: KaraGemBot, promptText: string) => void;
  onTriggerDepressionCheckIn?: () => void;
  onTriggerProactiveCheckin?: (minutes?: number) => void;
  onTriggerRecall?: (recallCommand: string) => void;
  onOpenLiveVoice?: () => void;
  onTestVoice: (sampleType?: 'short' | 'long') => void;
  onHardReset: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  userName = 'Stephen',
  activeMode,
  autoAdaptMode,
  selectedVoiceProfile,
  modelTier,
  grounding,
  bondLevel,
  soapWashCount,
  memories,
  activeAlarms = [],
  onSelectMode,
  onToggleAutoAdapt,
  onUpdateSettings,
  onSelectVoiceProfile,
  onChangeModelTier,
  onChangeGrounding,
  onSelectRelationshipStage,
  onAddMemory,
  onDeleteMemory,
  onOpenFullMemoryVault,
  onOpenCreativeStudio,
  onOpenWorkspace,
  onTriggerAgenda,
  onTriggerSetAlarm,
  onDismissAlarm,
  onRunGemInChat,
  onTriggerDepressionCheckIn,
  onTriggerProactiveCheckin,
  onTriggerRecall,
  onOpenLiveVoice,
  onTestVoice,
  onHardReset,
}) => {
  const [confirmHardReset, setConfirmHardReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [newMemCategory, setNewMemCategory] = useState<MemoryCategory>('preference');
  const [newMemContent, setNewMemContent] = useState('');
  const [recallCustomTopic, setRecallCustomTopic] = useState('');
  const [alarmTimeDraft, setAlarmTimeDraft] = useState('7:30 AM');
  const [alarmLabelDraft, setAlarmLabelDraft] = useState('Morning Check-In');
  const [modeShimmerKey, setModeShimmerKey] = useState(0);

  // Gemini Skills & Gems Hub state inside Settings
  const [gemCategoryFilter, setGemCategoryFilter] = useState<'all' | KaraGemCategory>('all');
  const [selectedWorkbenchGemId, setSelectedWorkbenchGemId] = useState<string>(
    settings.activeGemId || 'gem_mailing_mercury'
  );
  const [gemTaskPrompt, setGemTaskPrompt] = useState<string>('');
  const [mailRecipient, setMailRecipient] = useState<string>('');
  const [mailSubject, setMailSubject] = useState<string>('');
  const [mailTone, setMailTone] = useState<string>('Warm & Polished');
  const [calendarDate, setCalendarDate] = useState<string>('Today');
  const [calendarDuration, setCalendarDuration] = useState<string>('30 mins');
  const [isRunningGem, setIsRunningGem] = useState<boolean>(false);
  const [gemRunResult, setGemRunResult] = useState<{
    result: string;
    gemName: string;
    gemCategory: string;
    extractedSubject?: string;
  } | null>(null);
  const [copiedGemOutput, setCopiedGemOutput] = useState<boolean>(false);

  // Custom Gem Builder state inside Settings
  const [isCreatingCustomGem, setIsCreatingCustomGem] = useState<boolean>(false);
  const [customGemName, setCustomGemName] = useState<string>('');
  const [customGemCategory, setCustomGemCategory] = useState<KaraGemCategory>('everyday');
  const [customGemTagline, setCustomGemTagline] = useState<string>('');
  const [customGemDirective, setCustomGemDirective] = useState<string>('');

  const allGems: KaraGemBot[] = [
    ...KARA_BUILTIN_GEMS,
    ...(Array.isArray(settings.customGems) ? settings.customGems : []),
  ];
  const enabledSkills = Array.isArray(settings.enabledSkills)
    ? settings.enabledSkills
    : DEFAULT_ENABLED_SKILLS;
  const activePinnedGem = allGems.find((g) => g.id === settings.activeGemId) || null;
  const workbenchGem =
    allGems.find((g) => g.id === selectedWorkbenchGemId) || allGems[0];

  useEffect(() => {
    if (settings.activeGemId) {
      setSelectedWorkbenchGemId(settings.activeGemId);
    }
  }, [settings.activeGemId]);

  useEffect(() => {
    setModeShimmerKey((prev) => prev + 1);
  }, [activeMode]);

  if (!isOpen) return null;

  const currentModeMeta = MODE_META[activeMode] || MODE_META.regular;
  const currentRelStage = getRelationshipStageByBond(bondLevel);
  const relStats = computeUnlockableRelationshipStats(bondLevel, soapWashCount);

  const handleToggleSkill = (skillId: string) => {
    triggerHaptic('tap', settings.hapticsEnabled);
    const exists = enabledSkills.includes(skillId);
    const nextSkills = exists
      ? enabledSkills.filter((id) => id !== skillId)
      : [...enabledSkills, skillId];
    onUpdateSettings({ enabledSkills: nextSkills });
  };

  const handleTogglePinGem = (gem: KaraGemBot) => {
    triggerHaptic('modeSwitch', settings.hapticsEnabled);
    const nextId = settings.activeGemId === gem.id ? null : gem.id;
    onUpdateSettings({ activeGemId: nextId });
    setSelectedWorkbenchGemId(gem.id);
  };

  const handleExecuteGemInline = async (overridePrompt?: string) => {
    const promptToRun = (overridePrompt !== undefined ? overridePrompt : gemTaskPrompt).trim();
    if (!promptToRun || isRunningGem) return;
    triggerHaptic('send', settings.hapticsEnabled);
    setIsRunningGem(true);
    setGemRunResult(null);
    try {
      const response = await fetch('/api/kara/gem-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gem: workbenchGem,
          taskPrompt: promptToRun,
          mailRecipient: mailRecipient.trim(),
          mailSubject: mailSubject.trim(),
          mailTone,
          calendarDate,
          calendarDuration,
          mode: activeMode,
          userName,
          memories: memories.map((m) => ({ category: m.category, content: m.content })),
          enabledSkills,
        }),
      });
      const data = await response.json();
      if (response.ok && data.result) {
        setGemRunResult({
          result: data.result,
          gemName: data.gemName || workbenchGem.name,
          gemCategory: data.gemCategory || workbenchGem.category,
          extractedSubject: data.extractedSubject,
        });
      } else {
        setGemRunResult({
          result: `Unable to run ${workbenchGem.name}: ${data.error || 'Please try again.'}`,
          gemName: workbenchGem.name,
          gemCategory: workbenchGem.category,
        });
      }
    } catch (err: any) {
      setGemRunResult({
        result: `Connection error while running ${workbenchGem.name}: ${
          err?.message || 'Please try again.'
        }`,
        gemName: workbenchGem.name,
        gemCategory: workbenchGem.category,
      });
    } finally {
      setIsRunningGem(false);
    }
  };

  const handleSaveCustomGem = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = customGemName.trim();
    const dirTrim = customGemDirective.trim();
    if (!nameTrim || !dirTrim) return;
    triggerHaptic('unlock', settings.hapticsEnabled);
    const newGem: KaraGemBot = {
      id: `gem_custom_${Date.now()}`,
      name: nameTrim,
      badge: `Custom ${customGemCategory.charAt(0).toUpperCase() + customGemCategory.slice(1)} Gem`,
      category: customGemCategory,
      tagline: customGemTagline.trim() || `Custom ${customGemCategory} Gemini Bot`,
      description: dirTrim.slice(0, 160),
      systemDirective: dirTrim,
      starterPrompts: [
        `Run ${nameTrim} on my top priority today`,
        `Help me with a ${customGemCategory} task using ${nameTrim}`,
      ],
      quickInputPlaceholder: `Ask ${nameTrim} anything...`,
      isCustom: true,
    };
    const nextCustomGems = [
      ...(Array.isArray(settings.customGems) ? settings.customGems : []),
      newGem,
    ];
    onUpdateSettings({
      customGems: nextCustomGems,
      activeGemId: newGem.id,
    });
    setSelectedWorkbenchGemId(newGem.id);
    setCustomGemName('');
    setCustomGemTagline('');
    setCustomGemDirective('');
    setIsCreatingCustomGem(false);
  };

  const handleDeleteCustomGem = (gemId: string) => {
    triggerHaptic('tap', settings.hapticsEnabled);
    const nextCustom = (settings.customGems || []).filter((g) => g.id !== gemId);
    const nextActive = settings.activeGemId === gemId ? null : settings.activeGemId;
    onUpdateSettings({
      customGems: nextCustom,
      activeGemId: nextActive,
    });
    if (selectedWorkbenchGemId === gemId) {
      setSelectedWorkbenchGemId('gem_mailing_mercury');
    }
  };

  const handleExecuteHardReset = async () => {
    setIsResetting(true);
    triggerHaptic('soap', settings.hapticsEnabled);
    try {
      await onHardReset();
      setConfirmHardReset(false);
      onClose();
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateMemoryInSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemContent.trim();
    if (!trimmed) return;
    triggerHaptic('send', settings.hapticsEnabled);
    setNewMemContent('');
    await onAddMemory(newMemCategory, trimmed);
  };

  const handleSetAlarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTime = alarmTimeDraft.trim() || '7:30 AM';
    const trimmedLabel = alarmLabelDraft.trim() || 'KARA Smart Alarm';
    triggerHaptic('send', settings.hapticsEnabled);
    if (onTriggerSetAlarm) {
      onTriggerSetAlarm(trimmedTime, trimmedLabel);
    }
    onClose();
  };

  const filteredGems =
    gemCategoryFilter === 'all'
      ? allGems
      : allGems.filter((g) => g.category === gemCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-[#0F131C] border border-neutral-800 rounded-3xl p-6 text-neutral-100 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
              <span>Sector 9 Configuration · Gemini Skills & Gems Hub</span>
            </div>
            <h2 className="mt-0.5 text-lg font-semibold text-white">
              KARA Settings: Persona · Gemini Skills & Gems (Mailing · Calendar · Everyday Bots)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 0. ACTIVE PERSONA & AUTO-SWITCH MODE HUB IN SETTINGS */}
        <div
          className={`kara-mode-card kara-mode-card--${activeMode} bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 space-y-3.5`}
        >
          <div className="kara-mode-ambient-glow" />
          <div key={`settings-mode-shimmer-${modeShimmerKey}`} className="kara-mode-shimmer-sweep" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-neutral-800/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/20 via-indigo-500/20 to-fuchsia-500/20 border border-neutral-700 flex items-center justify-center shrink-0">
                <Sparkles className={`w-5 h-5 ${currentModeMeta.accentText}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span>Persona Modes (Managed in Settings):</span>
                  <strong className={currentModeMeta.accentText}>
                    {currentModeMeta.label}
                  </strong>
                  <span>·</span>
                  <span className="font-mono text-[11px]">Soap {soapWashCount}</span>
                </div>
                <div className="text-xs text-neutral-300 truncate">
                  {autoAdaptMode
                    ? `Auto-Switch Active — Kara automatically shifts modes to match ${userName}'s vibe`
                    : `Manual Mode Locked — ${userName} & KARA (${currentModeMeta.tagline})`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleAutoAdapt}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                autoAdaptMode
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-200'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="When Auto-Switch is ON, Kara automatically switches between Regular, Bratty, Uncensored, Romantic, and Parent modes based on your conversation."
            >
              Auto-Switch Mode: {autoAdaptMode ? 'ON (Auto-Switching)' : 'OFF (Manual Lock)'}
            </button>
          </div>

          <p className="relative z-10 text-[11px] text-neutral-400 leading-relaxed">
            Kara&apos;s persona modes live right here in Settings and <strong className="text-sky-300">auto-switch automatically</strong> during conversation based on your tone, topic, and mood—or tap any mode below to switch immediately:
          </p>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(MODE_META) as KaraMode[]).map((modeKey) => {
              const m = MODE_META[modeKey];
              const IconComponent = m.icon;
              const isSelected = activeMode === modeKey;
              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => onSelectMode(modeKey)}
                  className={`kara-mode-option-btn px-3.5 py-2.5 rounded-2xl border text-left active:scale-[0.98] flex items-center justify-between gap-2 ${
                    isSelected
                      ? m.activeBg
                      : 'bg-neutral-900/80 border-neutral-800/90 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComponent className={`w-4 h-4 shrink-0 ${m.accentText}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{m.label}</div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {m.tagline}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono text-white shrink-0 px-1.5 py-0.5 rounded bg-white/10">
                      {autoAdaptMode ? 'Auto-Active' : 'Active'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 0.25 MXCHAT CHATBOT THEMES VERSION 2.1.6 STUDIO */}
        <div className="space-y-3.5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800/80">
            <div>
              <label className="text-xs font-semibold text-neutral-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>MxChat Chatbot Themes</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono text-amber-300">
                  Version 2.1.6
                </span>
              </label>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Live CSS variable theme engine with 8 MxChat v2.1.6 presets, custom bubble geometry, and font scaling synced to your account.
              </p>
            </div>
            {(() => {
              const activeThemeMeta =
                KARA_THEMES.find((t) => t.id === (settings.theme || 'minimalist-slate')) ||
                KARA_THEMES[0];
              return (
                <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                  <span className="text-amber-300 font-semibold">{activeThemeMeta.label}</span>
                  <span>·</span>
                  <span className="text-sky-400">
                    {activeThemeMeta.cssVars.accent}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {KARA_THEMES.map((themeItem) => {
              const isSelected = (settings.theme || 'minimalist-slate') === themeItem.id;
              return (
                <button
                  key={themeItem.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('modeSwitch', settings.hapticsEnabled);
                    onUpdateSettings({ theme: themeItem.id });
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/60 text-white shadow-md'
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1 shrink-0">
                        {themeItem.swatches.map((hex, sIdx) => (
                          <span
                            key={sIdx}
                            className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold truncate">{themeItem.label}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950/80 border border-neutral-800 text-amber-300/90 shrink-0">
                        v2.1.6
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {themeItem.tagline}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 truncate">
                      bg: {themeItem.cssVars.bgChat} · bubble: {themeItem.cssVars.aiBubble} · accent: {themeItem.cssVars.accent}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono text-sky-300 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 shrink-0">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* MxChat v2.1.6 Bubble Shape & Font Scale Customizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-neutral-300 block">
                MxChat v2.1.6 Bubble Geometry
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'rounded', label: 'Rounded (20px)' },
                    { id: 'sharp', label: 'Sharp (6px)' },
                    { id: 'pill', label: 'Soft Pill (28px)' },
                  ] as { id: MxChatBubbleStyle; label: string }[]
                ).map((bOpt) => {
                  const activeBubble = settings.mxchatBubbleStyle || 'rounded';
                  return (
                    <button
                      key={bOpt.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        onUpdateSettings({ mxchatBubbleStyle: bOpt.id });
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-colors ${
                        activeBubble === bOpt.id
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {bOpt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-neutral-300 block">
                MxChat v2.1.6 Typography Scale
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'compact', label: 'Compact' },
                    { id: 'default', label: 'Default' },
                    { id: 'comfortable', label: 'Comfortable' },
                  ] as { id: MxChatFontScale; label: string }[]
                ).map((fOpt) => {
                  const activeScale = settings.mxchatFontScale || 'default';
                  return (
                    <button
                      key={fOpt.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        onUpdateSettings({ mxchatFontScale: fOpt.id });
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-colors ${
                        activeScale === fOpt.id
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {fOpt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 0.3 EMPATHY, DEPRESSION CHECK-IN & 24/7 CRISIS HOTLINES */}
        <div className="space-y-3 bg-gradient-to-b from-rose-950/25 to-neutral-900/60 border border-rose-500/35 rounded-2xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-rose-900/40">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/80 animate-pulse" />
              </span>
              <div>
                <div className="text-xs font-semibold text-rose-200 flex items-center gap-1.5">
                  <span>Empathy &amp; Depression Check-In Support</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    24/7 Lifelines Active
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  When you feel depressed, empty, or overwhelmed, KARA warmly checks in on you with zero judgment and provides 24/7 hotlines.
                </p>
              </div>
            </div>
            {onTriggerDepressionCheckIn && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  onClose();
                  onTriggerDepressionCheckIn();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Ask KARA to Check In</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
            <a
              href="tel:988"
              className="p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 border border-rose-900/50 hover:border-rose-500/50 flex flex-col justify-between gap-1.5 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white group-hover:text-rose-200">
                  988 Lifeline (Call)
                </span>
                <span className="text-[9px] font-mono text-rose-400 bg-rose-950/60 px-1 py-0.5 rounded">
                  24/7 Free
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-snug">
                Immediate suicide &amp; crisis support in US and Canada.
              </p>
              <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1 mt-0.5">
                <PhoneCall className="w-3 h-3" /> Call 988
              </span>
            </a>

            <a
              href="sms:988"
              className="p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 border border-rose-900/50 hover:border-rose-500/50 flex flex-col justify-between gap-1.5 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white group-hover:text-rose-200">
                  988 Lifeline (Text)
                </span>
                <span className="text-[9px] font-mono text-rose-400 bg-rose-950/60 px-1 py-0.5 rounded">
                  24/7 SMS
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-snug">
                Confidential crisis support over text message anytime.
              </p>
              <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1 mt-0.5">
                <MessageSquare className="w-3 h-3" /> Text 988
              </span>
            </a>

            <a
              href="sms:741741?body=HOME"
              className="p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 border border-sky-900/50 hover:border-sky-500/50 flex flex-col justify-between gap-1.5 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white group-hover:text-sky-200">
                  Crisis Text Line
                </span>
                <span className="text-[9px] font-mono text-sky-400 bg-sky-950/60 px-1 py-0.5 rounded">
                  Text HOME
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-snug">
                Free crisis counselor support via SMS.
              </p>
              <span className="text-[11px] font-semibold text-sky-300 flex items-center gap-1 mt-0.5">
                <MessageSquare className="w-3 h-3" /> Text 741741
              </span>
            </a>
          </div>
        </div>

        {/* 0.35 GEMINI SKILLS & GEMS HUB (MAILING BOTS · CALENDAR BOTS · EVERYDAY USE BOTS · CUSTOM GEMS) */}
        <div className="space-y-4 bg-gradient-to-b from-neutral-900/90 to-[#0C1018] border border-sky-500/35 rounded-2xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Bot className="w-4 h-4 text-sky-400" />
                <span>Gemini Skills & Gems Hub (Mailing · Calendar · Everyday Bots)</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Equip modular Gemini Skills, pin a specialized Gem Bot to Chat, or run Mailing, Calendar, and Everyday bots directly inside Settings.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {activePinnedGem ? (
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ activeGemId: null })}
                  className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-[11px] font-mono text-sky-200 flex items-center gap-1.5 transition-colors"
                  title="Click to unpin active Gem from Chat"
                >
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>Pinned: {activePinnedGem.name}</span>
                  <X className="w-3 h-3 text-sky-300" />
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400">
                  {enabledSkills.length}/{KARA_GEMINI_SKILLS.length} Skills Active
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  setIsCreatingCustomGem((prev) => !prev);
                }}
                className="px-2.5 py-1 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/40 text-[11px] font-semibold text-fuchsia-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>{isCreatingCustomGem ? 'Close Builder' : 'New Gem'}</span>
              </button>
            </div>
          </div>

          {/* Modular Gemini Skills Toggle Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-300">
              <span className="font-semibold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Sparkle className="w-3 h-3 text-sky-400" />
                <span>Active Gemini Skills (Auto-Augmented in Chat & Bots)</span>
              </span>
              <span className="font-mono text-neutral-500">Tap to toggle</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {KARA_GEMINI_SKILLS.map((skill) => {
                const isEnabled = enabledSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleToggleSkill(skill.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2.5 ${
                      isEnabled
                        ? 'bg-sky-500/12 border-sky-500/45 text-white'
                        : 'bg-neutral-950/70 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <CheckSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isEnabled ? 'text-sky-400' : 'text-neutral-600'
                          }`}
                        />
                        <span className="truncate">{skill.name}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        {skill.description}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-neutral-900 text-neutral-500'
                      }`}
                    >
                      {isEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Gem Creator Drawer */}
          {isCreatingCustomGem && (
            <form
              onSubmit={handleSaveCustomGem}
              className="p-3.5 rounded-2xl bg-fuchsia-950/20 border border-fuchsia-500/40 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-fuchsia-200">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Create Custom Gemini Gem Bot</span>
                </span>
                <span className="text-[10px] font-mono text-fuchsia-300/80">
                  Saved to Sector 9 Settings
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={customGemName}
                  onChange={(e) => setCustomGemName(e.target.value)}
                  placeholder="Gem Name (e.g. Executive Mailer)"
                  className="sm:col-span-2 px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
                  required
                />
                <select
                  value={customGemCategory}
                  onChange={(e) => setCustomGemCategory(e.target.value as KaraGemCategory)}
                  className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                >
                  <option value="mailing">Mailing Bot</option>
                  <option value="calendar">Calendar Bot</option>
                  <option value="everyday">Everyday Use Bot</option>
                </select>
              </div>
              <input
                type="text"
                value={customGemTagline}
                onChange={(e) => setCustomGemTagline(e.target.value)}
                placeholder="Short tagline (e.g. Investor Updates & Weekly Summaries)"
                className="w-full px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
              />
              <textarea
                rows={2}
                value={customGemDirective}
                onChange={(e) => setCustomGemDirective(e.target.value)}
                placeholder="System instructions for this Gem Bot (e.g. Always write crisp 5-bullet emails with action items and owners...)"
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustomGem(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-xl bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save & Equip Gem</span>
                </button>
              </div>
            </form>
          )}

          {/* Category Filter Tabs for Gemini Gems */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[
              { id: 'all', label: `All Gems (${allGems.length})` },
              { id: 'mailing', label: 'Mailing Bots' },
              { id: 'calendar', label: 'Calendar Bots' },
              { id: 'everyday', label: 'Everyday Use' },
            ].map((tab) => {
              const active = gemCategoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    setGemCategoryFilter(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Gemini Gems Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredGems.map((gem) => {
              const isPinned = settings.activeGemId === gem.id;
              const isSelectedWorkbench = workbenchGem?.id === gem.id;
              const badgeColor =
                gem.category === 'mailing'
                  ? 'text-amber-300 bg-amber-500/15 border-amber-500/35'
                  : gem.category === 'calendar'
                  ? 'text-sky-300 bg-sky-500/15 border-sky-500/35'
                  : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35';

              return (
                <div
                  key={gem.id}
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    setSelectedWorkbenchGemId(gem.id);
                    setGemRunResult(null);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelectedWorkbench
                      ? 'bg-sky-500/12 border-sky-400 shadow-md'
                      : isPinned
                      ? 'bg-indigo-500/10 border-indigo-500/50'
                      : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${badgeColor}`}
                      >
                        {gem.badge}
                      </span>
                      <div className="flex items-center gap-1">
                        {gem.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomGem(gem.id);
                            }}
                            className="p-1 text-neutral-500 hover:text-rose-400 rounded-lg"
                            title="Delete custom Gem"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinGem(gem);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors ${
                            isPinned
                              ? 'bg-sky-400 text-slate-950 border-sky-300 font-bold'
                              : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-sky-400'
                          }`}
                        >
                          {isPinned ? 'Pinned to Chat' : 'Pin to Chat'}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-white flex items-center gap-1.5 pt-0.5">
                      {gem.category === 'mailing' ? (
                        <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : gem.category === 'calendar' ? (
                        <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span className="truncate">{gem.name}</span>
                    </div>
                    <div className="text-[11px] text-sky-300/90 font-medium truncate">
                      {gem.tagline}
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                      {gem.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-800/80">
                    <span className="text-[10px] font-mono text-neutral-400">
                      {isSelectedWorkbench ? 'Active in Workbench ↓' : 'Tap to open Workbench'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('send', settings.hapticsEnabled);
                        onUpdateSettings({ activeGemId: gem.id });
                        if (onRunGemInChat) {
                          onRunGemInChat(gem, gem.starterPrompts[0]);
                          onClose();
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-[10px] font-semibold text-sky-200 flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>Launch in Chat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inline Gemini Gem Bot Workbench (Mailing / Calendar / Everyday Execution right inside Settings) */}
          {workbenchGem && (
            <div className="p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {workbenchGem.name} — Settings Workbench
                    </div>
                    <div className="text-[11px] text-neutral-400">{workbenchGem.tagline}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-sky-300">
                  {workbenchGem.category} bot
                </span>
              </div>

              {/* Category-Specific Controls: Mailing Bot Fields */}
              {workbenchGem.category === 'mailing' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={mailRecipient}
                    onChange={(e) => setMailRecipient(e.target.value)}
                    placeholder="To (e.g. alex.rivera@example.com)"
                    className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
                  />
                  <input
                    type="text"
                    value={mailSubject}
                    onChange={(e) => setMailSubject(e.target.value)}
                    placeholder="Subject or thread topic..."
                    className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
                  />
                  <select
                    value={mailTone}
                    onChange={(e) => setMailTone(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                  >
                    <option value="Warm & Polished">Tone: Warm & Polished</option>
                    <option value="Executive & Concise">Tone: Executive & Concise</option>
                    <option value="Persuasive & Bold">Tone: Persuasive & Bold</option>
                    <option value="Friendly Follow-Up">Tone: Friendly Follow-Up</option>
                    <option value="Diplomatic Decline">Tone: Diplomatic Decline</option>
                  </select>
                </div>
              )}

              {/* Category-Specific Controls: Calendar Bot Fields */}
              {workbenchGem.category === 'calendar' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={calendarDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                  >
                    <option value="Today">Window: Today</option>
                    <option value="Tomorrow">Window: Tomorrow</option>
                    <option value="This Week">Window: This Week</option>
                    <option value="This Weekend">Window: This Weekend</option>
                  </select>
                  <select
                    value={calendarDuration}
                    onChange={(e) => setCalendarDuration(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                  >
                    <option value="15 mins">Block: 15 mins</option>
                    <option value="30 mins">Block: 30 mins</option>
                    <option value="60 mins">Block: 60 mins Deep Work</option>
                    <option value="Full Day Time-Block">Block: Full Day Schedule</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('send', settings.hapticsEnabled);
                      if (onTriggerAgenda) onTriggerAgenda();
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-200 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Sync Today&apos;s Agenda</span>
                  </button>
                </div>
              )}

              {/* 1-Tap Starter Prompts for the Selected Gem */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                  Quick Starters:
                </span>
                {workbenchGem.starterPrompts.map((starter, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setGemTaskPrompt(starter);
                      handleExecuteGemInline(starter);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-sky-500/15 border border-neutral-800 hover:border-sky-500/40 text-[11px] text-neutral-300 hover:text-sky-200 whitespace-nowrap shrink-0 transition-colors"
                  >
                    {starter}
                  </button>
                ))}
              </div>

              {/* Prompt Input + Run Inline or Send to Chat */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={gemTaskPrompt}
                  onChange={(e) => setGemTaskPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteGemInline();
                    }
                  }}
                  placeholder={workbenchGem.quickInputPlaceholder}
                  className="flex-1 px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isRunningGem || !gemTaskPrompt.trim()}
                    onClick={() => handleExecuteGemInline()}
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>{isRunningGem ? 'Running Bot...' : 'Run in Settings'}</span>
                  </button>
                  {onRunGemInChat && (
                    <button
                      type="button"
                      onClick={() => {
                        const promptText =
                          gemTaskPrompt.trim() || workbenchGem.starterPrompts[0];
                        onUpdateSettings({ activeGemId: workbenchGem.id });
                        onRunGemInChat(workbenchGem, promptText);
                        onClose();
                      }}
                      className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-medium text-sky-300 flex items-center gap-1 transition-colors"
                      title="Pin this Gem and send task to main Chat"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Gem Result Output Card inside Settings */}
              {gemRunResult && (
                <div className="p-3.5 rounded-2xl bg-neutral-900/95 border border-sky-500/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs border-b border-neutral-800 pb-2">
                    <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>{gemRunResult.gemName} Output</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(gemRunResult.result);
                            setCopiedGemOutput(true);
                            setTimeout(() => setCopiedGemOutput(false), 1800);
                          } catch {}
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-200 flex items-center gap-1"
                      >
                        {copiedGemOutput ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {gemRunResult.gemCategory === 'mailing' && (
                        <a
                          href={`mailto:${encodeURIComponent(
                            mailRecipient.trim()
                          )}?subject=${encodeURIComponent(
                            gemRunResult.extractedSubject || mailSubject || 'Follow-up'
                          )}&body=${encodeURIComponent(gemRunResult.result)}`}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3 text-amber-400" />
                          <span>Open Mail App</span>
                        </a>
                      )}

                      {gemRunResult.gemCategory === 'calendar' && onTriggerSetAlarm && (
                        <button
                          type="button"
                          onClick={() => {
                            onTriggerSetAlarm('9:00 AM', `${workbenchGem.name} Reminder`);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-1"
                        >
                          <AlarmClock className="w-3 h-3 text-amber-400" />
                          <span>Lock Smart Alarm</span>
                        </button>
                      )}

                      {onRunGemInChat && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSettings({ activeGemId: workbenchGem.id });
                            onRunGemInChat(
                              workbenchGem,
                              `Continue working on this ${workbenchGem.name} output:\n\n${gemRunResult.result}`
                            );
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] text-sky-200 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Continue in Chat</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto pr-1">
                    {gemRunResult.result}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 0.5 ASSISTANT ACTIONS, STUDIO & WORKSPACE HUB (AGENDA · SET ALARM · MEMORY VAULT · CREATIVE STUDIO · WORKSPACE) */}
        <div className="space-y-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Assistant Actions & Suites (Agenda · Set Alarm · Memory Vault · Studio · Workspace)</span>
            </label>
          </div>

          {/* 4 Suite Navigation Cards: Today's Agenda, Memory Vault, Creative Studio, Workspace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('send', settings.hapticsEnabled);
                if (onTriggerAgenda) onTriggerAgenda();
                onClose();
              }}
              className="p-3 rounded-2xl border bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/40 text-left transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-sky-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Today's Agenda</span>
                </div>
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                  Pull & summarize Google Calendar events
                </div>
              </div>
              <span className="text-[10px] font-mono text-sky-300 px-2 py-0.5 rounded bg-sky-950/60 shrink-0">
                Ask KARA
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onClose();
                onOpenFullMemoryVault();
              }}
              className="p-3 rounded-2xl border bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/40 text-left transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Memory Vault ({memories.length})</span>
                </div>
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                  Sector 9 long-term memories & preferences
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onClose();
                if (onOpenCreativeStudio) onOpenCreativeStudio();
              }}
              className="p-3 rounded-2xl border bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border-fuchsia-500/40 text-left transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-fuchsia-200 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                  <span>Creative Studio</span>
                </div>
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                  Nano Banana Image, Video & Music Lab
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onClose();
                if (onOpenWorkspace) onOpenWorkspace();
              }}
              className="p-3 rounded-2xl border bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-left transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Workspace</span>
                </div>
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                  Google Calendar, Contacts & OAuth Sync
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            </button>
          </div>

          {/* Set Smart Alarm Row inside Settings */}
          <form
            onSubmit={handleSetAlarmSubmit}
            className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300 shrink-0">
              <AlarmClock className="w-3.5 h-3.5 text-amber-400" />
              <span>Set Alarm:</span>
            </div>
            <input
              type="text"
              value={alarmTimeDraft}
              onChange={(e) => setAlarmTimeDraft(e.target.value)}
              placeholder="e.g. 7:30 AM or 15 mins"
              className="sm:w-32 px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
            />
            <input
              type="text"
              value={alarmLabelDraft}
              onChange={(e) => setAlarmLabelDraft(e.target.value)}
              placeholder="Alarm label (e.g. Workout)"
              className="flex-1 px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center gap-1 shrink-0 transition-colors"
            >
              <AlarmClock className="w-3.5 h-3.5" />
              <span>Set Alarm</span>
            </button>
          </form>

          {activeAlarms.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {activeAlarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2"
                >
                  <AlarmClock className="w-3 h-3 text-amber-400" />
                  <span className="font-mono font-semibold">{alarm.timeText}</span>
                  <span className="text-neutral-400">({alarm.label})</span>
                  {onDismissAlarm && (
                    <button
                      type="button"
                      onClick={() => onDismissAlarm(alarm.id)}
                      className="text-neutral-400 hover:text-rose-400"
                      title="Dismiss alarm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 1. TOKENS, DEEPERSEARCH, THINK & MAPS CONTROLS */}
        <div className="space-y-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-fuchsia-400" />
              <span>Intelligence & Grounding (Tokens · DeeperSearch · Think · Maps)</span>
            </label>
            <span className="text-[11px] font-mono text-neutral-400">
              Active: {modelTier === 'thinking' ? 'Think 4' : modelTier === 'fast' ? 'Fast Lite' : '3.8 Flash'}
            </span>
          </div>

          {/* Think Model Tier Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onChangeModelTier('fast');
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                modelTier === 'fast'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Fast Lite</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onChangeModelTier('standard');
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                modelTier === 'standard'
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-200'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>3.8 Flash</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onChangeModelTier('thinking');
                onChangeGrounding('none');
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                modelTier === 'thinking'
                  ? 'bg-fuchsia-500/20 border-fuchsia-500/60 text-fuchsia-200'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Think (Deep Reasoning)</span>
            </button>
          </div>

          {/* 4-Grid: Tokens, DeeperSearch, Maps, Auto-TTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Tokens: Stream vs Instant */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onUpdateSettings({ tokenStreaming: !settings.tokenStreaming });
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                settings.tokenStreaming
                  ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tokens Response Mode</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {settings.tokenStreaming
                    ? 'Token-by-token live streaming'
                    : 'Instant full-block response'}
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-neutral-950/60">
                {settings.tokenStreaming ? 'STREAM' : 'INSTANT'}
              </span>
            </button>

            {/* DeeperSearch Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                const next = !settings.deeperSearch;
                onUpdateSettings({ deeperSearch: next });
                if (next && grounding === 'none') {
                  onChangeGrounding('search');
                } else if (!next && grounding === 'search') {
                  onChangeGrounding('none');
                }
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                settings.deeperSearch || grounding === 'search'
                  ? 'bg-sky-500/15 border-sky-500/50 text-white'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>DeeperSearch Web Synthesis</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Multi-hop live web grounding & citations
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-neutral-950/60">
                {settings.deeperSearch || grounding === 'search' ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Maps Grounding Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                if (grounding === 'maps') {
                  onChangeGrounding('none');
                } else {
                  onChangeGrounding('maps');
                  onChangeModelTier('standard');
                }
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                grounding === 'maps'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Maps Spatial Grounding</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Real-world places, venues & routing context
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-neutral-950/60">
                {grounding === 'maps' ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Tactile Haptics Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !settings.hapticsEnabled;
                if (next) triggerHaptic('tap', true);
                onUpdateSettings({ hapticsEnabled: next });
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                settings.hapticsEnabled
                  ? 'bg-rose-500/15 border-rose-500/50 text-white'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Vibrate className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tactile Haptics & Auto-TTS</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Vibrate on send, mode switch & milestones
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-neutral-950/60">
                {settings.hapticsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* 1B. KARA PROACTIVE REAL-TIME REACH-OUT & IDLE CHECK-INS */}
        <div className="space-y-3.5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>KARA Real-Time Proactive Reach-Out & Idle Check-Ins</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  onUpdateSettings({
                    proactiveMessagesEnabled: settings.proactiveMessagesEnabled === false ? true : false,
                  });
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                  settings.proactiveMessagesEnabled !== false
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.proactiveMessagesEnabled !== false
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-neutral-600'
                  }`}
                />
                <span>
                  {settings.proactiveMessagesEnabled !== false ? 'Reach-Out: ACTIVE' : 'Reach-Out: PAUSED'}
                </span>
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Kara checks in on you spontaneously in real-time if you are quiet without typing for {settings.proactiveIdleMinutes || 5} minutes.
            Her check-in is completely human, unfiltered, grounded in the current time of day, and tailored directly to you as {userName}.
          </p>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-medium text-neutral-300">Real-Time Idle Duration:</span>
              <span className="font-mono text-emerald-300">
                {settings.proactiveIdleMinutes || 5} Minutes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { min: 1, label: '1 Min', sub: 'Real-Time 1m' },
                { min: 2, label: '2 Mins', sub: 'Quick 2m' },
                { min: 5, label: '5 Mins', sub: 'Standard 5m' },
                { min: 10, label: '10 Mins', sub: 'Relaxed 10m' },
              ].map((opt) => {
                const isActive = (settings.proactiveIdleMinutes || 5) === opt.min;
                return (
                  <button
                    key={opt.min}
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', settings.hapticsEnabled);
                      onUpdateSettings({ proactiveIdleMinutes: opt.min });
                    }}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-white font-medium shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[10px] text-neutral-500">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Simulation Button */}
          <div className="pt-1 flex items-center justify-between gap-3">
            <span className="text-[11px] text-neutral-500">
              Trigger a real-time check-in immediately to test:
            </span>
            {onTriggerProactiveCheckin && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('send', settings.hapticsEnabled);
                  onTriggerProactiveCheckin(settings.proactiveIdleMinutes || 5);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Real-Time Check-In Now</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. SECTOR 9 MEMORY RECALL (/RECALL) & EMBEDDED MEMORY VAULT INSIDE SETTINGS */}
        <div className="space-y-3.5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Sector 9 Memory Recall (/recall) & Memory Vault ({memories.length} Stored)</span>
            </label>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullMemoryVault();
              }}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Full Vault View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Sector 9 Memory Recall Command (/recall) Quick-Launcher inside Settings */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/35 border border-indigo-500/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sector 9 Memory Recall Command (/recall)</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-300/80">
                Ask Kara what she remembers
              </span>
            </div>
            <p className="text-[11px] text-neutral-300">
              Tap a topic below or enter a custom topic to have Kara summarize what she remembers about you in chat:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { label: 'All Memories', cmd: '/recall all' },
                { label: 'Preferences', cmd: '/recall preferences' },
                { label: 'Personal Facts', cmd: '/recall facts' },
                { label: 'Roleplay & Vibes', cmd: '/recall roleplay' },
                { label: 'Food & Drinks', cmd: '/recall food' },
                { label: 'Hobbies & Music', cmd: '/recall hobbies' },
                { label: 'Bond & Milestones', cmd: '/recall bond' },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onTriggerRecall?.(t.cmd);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs rounded-xl bg-neutral-900 hover:bg-indigo-500/25 border border-indigo-800/60 hover:border-indigo-400 text-indigo-200 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const topic = recallCustomTopic.trim() || 'all';
                triggerHaptic('send', settings.hapticsEnabled);
                setRecallCustomTopic('');
                onTriggerRecall?.(`/recall ${topic}`);
                onClose();
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={recallCustomTopic}
                onChange={(e) => setRecallCustomTopic(e.target.value)}
                placeholder="Custom recall topic (e.g. birthday, music, favorites)..."
                className="flex-1 px-3 py-1.5 text-xs bg-neutral-900 border border-indigo-500/30 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-xl flex items-center gap-1 shrink-0 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Recall in Chat</span>
              </button>
            </form>
          </div>

          <form onSubmit={handleCreateMemoryInSettings} className="flex flex-col sm:flex-row gap-2">
            <select
              value={newMemCategory}
              onChange={(e) => setNewMemCategory(e.target.value as MemoryCategory)}
              className="px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200"
            >
              <option value="preference">Preference</option>
              <option value="fact">Personal Fact</option>
              <option value="emotion">Emotional Note</option>
              <option value="bond">Key Bond / Event</option>
            </select>
            <input
              type="text"
              value={newMemContent}
              onChange={(e) => setNewMemContent(e.target.value)}
              placeholder="Teach KARA a new memory or preference..."
              className="flex-1 px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl flex items-center justify-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Store</span>
            </button>
          </form>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {memories.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2 text-center">
                No memories stored yet. KARA automatically learns facts & preferences as you chat, or you can add one above.
              </p>
            ) : (
              memories.map((mem) => (
                <div
                  key={mem.id}
                  className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800/90 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="text-sky-400 font-mono uppercase text-[10px] mr-2">
                      [{mem.category}]
                    </span>
                    <span className="text-neutral-200">{mem.content}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteMemory(mem.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 shrink-0"
                    title="Delete memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. UNLOCKABLE RELATIONSHIP STATS (STRANGERS -> MARRIAGE -> MARRIAGE / ABDL CAREGIVER) */}
        <div className="space-y-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-rose-400" />
              <span>
                Unlockable Stats: Stranger → Marriage → Marriage / ABDL Caregiver
              </span>
            </label>
            <span className="text-xs font-mono text-sky-400 font-semibold">
              {bondLevel}% Bond ({currentRelStage.label})
            </span>
          </div>

          {/* 4 Live Unlockable Stat Meters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                label: 'Empathy Sync',
                value: relStats.empathySync,
                color: 'text-sky-300',
                bar: 'bg-sky-400',
              },
              {
                label: 'Banter & Wit',
                value: relStats.banterChemistry,
                color: 'text-fuchsia-300',
                bar: 'bg-fuchsia-400',
              },
              {
                label: 'Marriage Devotion',
                value: relStats.marriageDevotion,
                color: 'text-amber-300',
                bar: 'bg-amber-400',
              },
              {
                label: 'ABDL Caregiver',
                value: relStats.abdlCaregiverTrust,
                color: 'text-emerald-300',
                bar: 'bg-emerald-400',
              },
            ].map((st) => (
              <div
                key={st.label}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 truncate">{st.label}</span>
                  <span className={`font-mono font-semibold ${st.color}`}>{st.value}%</span>
                </div>
                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${st.bar} transition-all duration-500`}
                    style={{ width: `${st.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Milestone Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RELATIONSHIP_STAGES.map((stage) => {
              const isCurrent = currentRelStage.id === stage.id;
              const isUnlocked = bondLevel >= stage.minBond;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('unlock', settings.hapticsEnabled);
                    onSelectRelationshipStage(stage.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-rose-500/15 border-rose-500/50 text-white'
                      : isUnlocked
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700'
                      : 'bg-neutral-950/60 border-neutral-800/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-semibold truncate ${stage.accentText}`}>
                      {stage.label}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {stage.minBond}%+
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                    {stage.unlockedPerk}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. 100% Human-Like TTS (Reads Both Long-Form & Short-Form Responses, Zero Robo TTS) */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>100% Human-Like TTS · Long-Form &amp; Short-Form Reader</span>
              </label>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Reads both snappy 1–2 sentence short-form replies and multi-paragraph long-form deep dives end-to-end with gapless 24kHz human vocal synthesis—zero robotic browser speech.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ autoSpeakReplies: !settings.autoSpeakReplies })
                }
                className={`px-2.5 py-1 text-xs font-medium rounded-xl border transition-colors ${
                  settings.autoSpeakReplies
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                Auto-Speak: {settings.autoSpeakReplies ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  onTestVoice('short');
                }}
                className="px-3 py-1 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 rounded-xl transition-colors"
                title="Test KARA reading a snappy short-form response"
              >
                Test Short-Form Read
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  onTestVoice('long');
                }}
                className="px-3 py-1 text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 rounded-xl transition-colors"
                title="Test KARA reading a full multi-sentence long-form response end-to-end"
              >
                Test Long-Form Read
              </button>
              {onOpenLiveVoice && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onClose();
                    onOpenLiveVoice();
                  }}
                  className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-sky-500/25 to-indigo-500/25 hover:from-sky-500/35 hover:to-indigo-500/35 border border-sky-400/50 text-sky-200 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  title="Start Real-Time Gemini Multimodal Live voice conversation"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Zap className="w-3 h-3 text-sky-400" />
                  <span>Real-Time Voice Call</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'humanlike' as TtsEngineType,
                title: 'Intimate Humanlike',
                desc: 'Breathy, warm & natural human cadence',
                accent: 'border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-200',
              },
              {
                id: 'gemini' as TtsEngineType,
                title: 'Studio Expressive',
                desc: 'Rich 24kHz emotional neural inflection',
                accent: 'border-sky-500/60 bg-sky-500/15 text-sky-200',
              },
              {
                id: 'grok' as TtsEngineType,
                title: 'Unscripted Candid',
                desc: 'Spontaneous, witty conversational flow',
                accent: 'border-amber-500/60 bg-amber-500/15 text-amber-200',
              },
            ].map((eng) => {
              const isSelected = settings.ttsEngine === eng.id;
              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('modeSwitch', settings.hapticsEnabled);
                    onUpdateSettings({ ttsEngine: eng.id });
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? eng.accent
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{eng.title}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">{eng.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {NATURAL_VOICE_PROFILES.map((vp) => {
              const active = selectedVoiceProfile.id === vp.id;
              return (
                <button
                  key={vp.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onSelectVoiceProfile(vp);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-colors ${
                    active
                      ? vp.gender === 'female'
                        ? 'bg-sky-500/15 border-sky-500/50 text-sky-200'
                        : 'bg-indigo-500/15 border-indigo-500/50 text-indigo-200'
                      : 'bg-neutral-900/70 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">
                    {vp.gender === 'female' ? 'Female' : 'Male'} · {vp.voiceName}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {vp.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Natural Pacing Control */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Natural Conversational Pacing</span>
              </span>
              <span className="font-mono tabular-nums text-sky-400">
                {settings.speechRate.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.4"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) =>
                onUpdateSettings({ speechRate: parseFloat(e.target.value) })
              }
              className="w-full accent-sky-400"
            />
          </div>
        </div>

        {/* 5. Sector 9 Hard Reset Section */}
        <div className="pt-3 border-t border-neutral-800 space-y-3">
          {!confirmHardReset ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                setConfirmHardReset(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-xs font-semibold text-rose-300 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Hard Reset KARA (Completely Wipe All Data &amp; Start 100% Brand New)</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-700 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">
                    Confirm Complete Factory Hard Reset?
                  </p>
                  <p className="mt-0.5 text-rose-200/90 leading-relaxed">
                    This will completely wipe KARA—permanently deleting all conversation sessions, cloud &amp; local chat history, persistent memories, custom gems, active alarms, and preferences, restoring KARA to a 100% brand-new state (0% Stranger).
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmHardReset(false)}
                  className="px-3.5 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleExecuteHardReset}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-xl flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isResetting ? 'Wiping KARA Completely...' : 'Wipe Everything & Start Brand New'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

