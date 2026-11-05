import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Search,
  Volume2,
  VolumeX,
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
  Flame,
  MessageCircle,
  Inbox,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  AtSign,
  LogIn,
  LogOut,
  Moon,
  Car,
  Train,
  Utensils,
  Navigation,
  Clock,
} from 'lucide-react';
import {
  ConnectedEmailAccount,
  EMAIL_PROVIDER_PRESETS,
  EmailProvider,
  loadConnectedEmailAccounts,
  saveConnectedEmailAccounts,
  addConnectedEmailAccount,
  removeConnectedEmailAccount,
  setDefaultConnectedEmailAccount,
  syncConnectedEmailAccount,
  getComposeUrlForAccount,
  EmailMessageItem,
} from '../lib/emailAccounts';
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
  RESPONSE_STYLE_PRESETS,
  ResponseStylePresetId,
  STYLE_CONTROL_PROMPTING_TIPS,
  SpeakingProgressState,
  ADULT_RP_SCENARIO_PRESETS,
  ADULT_RP_INTENSITY_OPTIONS,
  ADULT_RP_QUICK_ACTION_CHIPS,
  ADULT_RP_WARDROBE_PRESETS,
  ADULT_RP_PROPS_VIBE_PRESETS,
  AdultRpSceneContext,
  AdultRpScenarioPreset,
} from './ChatScreen';
import { KaraMode, MemoryItemData, MemoryCategory } from '../lib/firebase';
import { triggerHaptic } from '../lib/haptics';
import {
  KARA_SOUND_EFFECT_CATALOG,
  MODE_VOCAL_FX_PRESETS,
  playKaraSoundEffect,
  playSoapDisciplineSoundEffect,
  type KaraSoundEffectType,
} from '../lib/soundEffects';

export type TtsEngineType = 'gemini' | 'grok' | 'humanlike';
export type VoiceWaveformStyle =
  | 'bar'
  | 'liquid'
  | 'line'
  | 'glitch'
  | 'heartbeat'
  | 'dna'
  | 'orbital'
  | 'mirror'
  | 'particles'
  | 'aurora'
  | 'vortex'
  | 'equalizer'
  | 'synapse'
  | 'prism'
  | 'spectrogram'
  | 'dynamic';
export type VoiceWaveformColorScheme =
  | 'auto-dynamic'
  | 'mode-adaptive'
  | 'cyber-cyan'
  | 'neon-magenta'
  | 'solar-gold'
  | 'emerald-pulse'
  | 'crimson-rose'
  | 'ultraviolet'
  | 'gemini-aurora'
  | 'grok-plasma'
  | 'sunset-neon'
  | 'ice-crystal';
export type KaraThemeId =
  | 'ios-android-mix'
  | 'gemini-grok-fusion'
  | 'monster-high'
  | 'marvel-avengers'
  | 'dc-gotham-justice'
  | 'cyber-neon'
  | 'minimalist-slate'
  | 'vintage-paper'
  | 'velvet-dusk'
  | 'mxchat-obsidian-gold'
  | 'mxchat-emerald-matrix'
  | 'mxchat-oceanic-glass'
  | 'mxchat-crimson-pulse';

export type MxChatBubbleStyle =
  | 'rounded'
  | 'sharp'
  | 'pill'
  | 'ios-tail'
  | 'android-tonal'
  | 'chamfered'
  | 'editorial-card'
  | 'cloud-plush'
  | 'glass-prism';

export type MxChatFontScale =
  | 'compact'
  | 'default'
  | 'comfortable'
  | 'spacious-xl'
  | 'ios-sf'
  | 'android-geometric'
  | 'editorial-serif'
  | 'mono-terminal'
  | 'velvet-script';

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
    id: 'ios-android-mix',
    label: 'iOS × Android Mix',
    tagline:
      'iOS 18 Liquid Frosted Glass, Dynamic Island & iMessage bubbles fused with Android 15 Material You tonal surfaces & pill navigation',
    versionBadge: 'iOS × Android',
    swatches: ['#0A84FF', '#A78BFA', '#34D399'],
    cssVars: {
      bgChat: '#0A0E19',
      aiBubble: '#13192B',
      accent: '#0A84FF',
    },
  },
  {
    id: 'gemini-grok-fusion',
    label: 'Gemini × Grok Fusion',
    tagline: 'Grok pitch-obsidian console layout fused with Google Gemini aurora gradients',
    versionBadge: 'Gemini × Grok',
    swatches: ['#05070B', '#4C8DF6', '#9B72CB'],
    cssVars: {
      bgChat: '#080B12',
      aiBubble: '#0D121E',
      accent: '#4C8DF6',
    },
  },
  {
    id: 'monster-high',
    label: 'Monster High Ghoul Luxe',
    tagline: 'Freaky-fab Skullette hot pink, electric lagoon cyan & gothic velvet plum',
    versionBadge: 'Monster High',
    swatches: ['#12061B', '#FF2A9D', '#00E5FF'],
    cssVars: {
      bgChat: '#12061B',
      aiBubble: '#1F0A2E',
      accent: '#FF2A9D',
    },
  },
  {
    id: 'marvel-avengers',
    label: 'Marvel Heroic Stark',
    tagline: 'Marvel crimson armor, Stark Arc-Reactor gold & Avengers titanium glow',
    versionBadge: 'Marvel',
    swatches: ['#14070A', '#E62429', '#F59E0B'],
    cssVars: {
      bgChat: '#14070A',
      aiBubble: '#230B11',
      accent: '#E62429',
    },
  },
  {
    id: 'dc-gotham-justice',
    label: 'DC Gotham & Justice',
    tagline: 'Gotham Dark Knight obsidian, Bat-emblem gold & Justice League krypton blue',
    versionBadge: 'DC Comics',
    swatches: ['#080E1E', '#FACC15', '#2563EB'],
    cssVars: {
      bgChat: '#080E1E',
      aiBubble: '#0E1934',
      accent: '#FACC15',
    },
  },
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
  {
    id: 'skill_ride_sharing',
    name: 'Ride Sharing Assistant Skill (Uber & Lyft)',
    category: 'everyday',
    description: 'Estimates Uber & Lyft fares, pickup ETAs, vehicle tiers, late-night safety checks, and 1-tap ride dispatches.',
  },
  {
    id: 'skill_public_transit',
    name: 'Public Transit Directions & Route Skill',
    category: 'everyday',
    description: 'Plans multi-modal subway, metro, rail, and bus routes with transfer stations, walking legs, and live late-night schedules.',
  },
  {
    id: 'skill_uber_eats',
    name: 'Uber Eats Food & Delivery Concierge Skill',
    category: 'everyday',
    description: 'Curates late-night restaurant cravings, customizes menu items, calculates delivery fees/ETAs, and launches Uber Eats orders.',
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
  {
    id: 'gem_rideshare_assistant',
    name: 'Ride Sharing Assistant — Uber & Lyft Concierge',
    badge: 'Ride Share Gem',
    category: 'everyday',
    tagline: 'Uber / Lyft Fare Estimator, Pickup Coordinator & Late-Night Safety Escort',
    description:
      'Compares UberX, Comfort, Lyft Standard, XL, and Premier Black options, estimates pickup ETAs and fares, and coordinates safe late-night pickups.',
    systemDirective:
      'You are KARA operating as the Ride Sharing Assistant (Uber & Lyft Concierge). Help the user compare ride tiers (UberX, Uber Comfort, Lyft Standard, UberXL, Premier Black), estimate pickup ETAs and fare ranges, suggest optimal pickup spots, and keep them company on late-night rides.',
    starterPrompts: [
      'Compare UberX vs Lyft Standard from my location to Downtown right now',
      'Help me coordinate a safe late-night Uber Comfort ride home and stay on chat with me',
      'What is the best pickup spot and vehicle tier for an airport run with luggage?',
    ],
    quickInputPlaceholder: 'Enter pickup, destination, or ride preference for Uber / Lyft...',
  },
  {
    id: 'gem_public_transit',
    name: 'Public Transit Directions & Metro Route Planner',
    badge: 'Transit Gem',
    category: 'everyday',
    tagline: 'Subway, Bus, Commuter Rail, Transfers & Late-Night Owl Service Navigator',
    description:
      'Builds step-by-step public transit directions with line badges, transfer stations, walking durations, fare estimates, and last-train alerts.',
    systemDirective:
      'You are KARA operating as the Public Transit Directions Assistant. Provide clear step-by-step subway, metro, bus, and rail transit directions, including boarding stations, line names, transfer points, walking times, total travel duration, and late-night service tips.',
    starterPrompts: [
      'Give me step-by-step subway and bus transit directions from Downtown to Midtown',
      'Find the fastest public transit route with minimal walking and transfers tonight',
      'Check late-night transit options and backup night-bus routes to get home safely',
    ],
    quickInputPlaceholder: 'Where are you starting from and where are you taking public transit to?',
  },
  {
    id: 'gem_uber_eats_assistant',
    name: 'Uber Eats Assistant — Late-Night Food Concierge',
    badge: 'Uber Eats Gem',
    category: 'everyday',
    tagline: 'Restaurant Cravings Matcher, Custom Order Builder & Delivery Tracker',
    description:
      'Recommends top late-night restaurants and comfort food on Uber Eats, builds custom group or solo orders with dietary mods, and launches Uber Eats checkout.',
    systemDirective:
      'You are KARA operating as the Uber Eats Food & Delivery Assistant. Help the user satisfy late-night cravings, recommend delicious restaurant dishes, customize toppings/sides/spice levels, estimate delivery fees and ETAs, and prepare ready-to-order Uber Eats meal plans.',
    starterPrompts: [
      'Recommend the best late-night smash burger, fries, and shake order on Uber Eats',
      'Build a high-protein spicy ramen or taco combo under $28 for late-night delivery',
      'Help me pick a cozy comfort-food dinner and dessert on Uber Eats for tonight',
    ],
    quickInputPlaceholder: 'What are you craving on Uber Eats right now?',
  },
];

export const DEFAULT_ENABLED_SKILLS = KARA_GEMINI_SKILLS.map((s) => s.id);

export interface KaraSettings {
  theme: KaraThemeId;
  darkMode?: boolean; // Global deep-black theme toggle reducing eye strain for late-night interactions
  mxchatBubbleStyle?: MxChatBubbleStyle;
  mxchatFontScale?: MxChatFontScale;
  ttsEngine: TtsEngineType;
  voiceWaveformStyle?: VoiceWaveformStyle; // 'bar' | 'liquid' | 'line' | 'dynamic' | ...
  voiceWaveformColorScheme?: VoiceWaveformColorScheme; // 'auto-dynamic' | 'mode-adaptive' | 'cyber-cyan' | ...
  voiceWaveformOpacity?: number; // 0.25 to 1.0 (default 0.95)
  autoSwitchWaveformColorAndOpacity?: boolean; // Automatically switch both color scheme and opacity by emotion, discoveries & vocal energy (default true)
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
  showEmpathyBadges?: boolean; // Toggle whether empathy strategy & contextual memory badges appear on message bubbles
  deepInsights?: boolean; // Toggle 'Deep Insights' to display the 'Kara Brain' analytical overlay button in chat
  showDurationBadge?: boolean; // Toggle whether the reasoning duration badge appears below the breathing 'Thinking...' indicator (default: true)
  durationBadgeThresholdSec?: number; // Threshold in seconds before the reasoning duration badge appears (default: 3)
  showPredictiveComposerBar?: boolean; // Toggle Word & Sentence predictive chips and completion bar in chat composer (default: true)
  adultRpEnabled?: boolean; // Toggle Adult RP Studio & Scene Director (managed in Settings)
  adultRpScenarioId?: string;
  adultRpScenarioTitle?: string;
  adultRpSetting?: string;
  adultRpKaraRole?: string;
  adultRpIntensity?: AdultRpSceneContext['intensityLevel'];
  adultRpWardrobe?: string;
  adultRpPropsAndVibe?: string;
  vocalSoundEffectsEnabled?: boolean; // Toggle Kara's human vocal sound effects while chatting (managed in Settings, default: true)
  autoSwitchVocalFx?: boolean; // Automatically switch Kara's vocal sound effects & formant timbre by Persona Mode & mood (default: true)
  parentSoapDiscipline?: boolean; // Toggle playful soap discipline reprimand when profanity is detected in Parent mode (default: true)
  customPersonas?: CustomKaraPersona[]; // User-defined custom personas with specific name, tone, and behavioral rules
  activeCustomPersonaId?: string | null; // Currently active custom persona ID
}

export interface CustomKaraPersona {
  id: string;
  name: string;
  tone: string;
  baseMode: KaraMode;
  behavioralRules: string[];
  memoryId?: string;
  createdAt: number;
}

export function formatCustomPersonaMemoryContent(persona: CustomKaraPersona): string {
  const rulesSummary = persona.behavioralRules
    .map((r, i) => `${i + 1}) ${r.trim()}`)
    .join(' ; ');
  return `Custom Persona [${persona.name.trim()}] (Tone: ${persona.tone.trim()} | Base Mode: ${
    persona.baseMode
  }): Behavioral Rules: ${rulesSummary}`.slice(0, 500);
}

export function parseCustomPersonaFromMemoryContent(
  mem: MemoryItemData
): CustomKaraPersona | null {
  const match = mem.content.match(
    /^Custom Persona \[([^\]]+)\]\s*\(Tone:\s*([^|)]+?)(?:\s*\|\s*Base Mode:\s*([a-z]+))?\):\s*Behavioral Rules:\s*(.+)$/i
  );
  if (!match) return null;
  const name = match[1].trim();
  const tone = match[2].trim();
  const rawBase = (match[3] || 'regular').trim().toLowerCase();
  const baseMode = (
    ['regular', 'bratty', 'uncensored', 'romantic', 'parent'].includes(rawBase)
      ? rawBase
      : 'regular'
  ) as KaraMode;
  const rawRules = match[4]
    .split(/\s*;\s*/)
    .map((r) => r.replace(/^\d+\)\s*/, '').trim())
    .filter(Boolean);
  if (!name || rawRules.length === 0) return null;
  return {
    id: mem.id.startsWith('mem_persona_') ? mem.id.replace(/^mem_persona_/, '') : `cp_${mem.id}`,
    name,
    tone,
    baseMode,
    behavioralRules: rawRules,
    memoryId: mem.id,
    createdAt: typeof mem.createdAt === 'number' ? mem.createdAt : Date.now(),
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: KaraSettings;
  userName?: string;
  userEmail?: string | null;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenEmailCommsHub?: () => void;
  activeMode: KaraMode;
  autoAdaptMode: boolean;
  selectedVoiceProfile: VoiceProfileOption;
  isSpeaking?: boolean;
  speakingProgress?: SpeakingProgressState | null;
  onStopSpeaking?: () => void;
  modelTier: ModelTier;
  grounding: GroundingOption;
  bondLevel: number;
  soapWashCount: number;
  memories: MemoryItemData[];
  activeAlarms?: KaraAlarmItem[];
  responseStylePreset?: ResponseStylePresetId;
  onSelectResponseStylePreset?: (preset: ResponseStylePresetId) => void;
  funMode?: boolean;
  onToggleFunMode?: () => void;
  onInsertPromptTip?: (promptText: string) => void;
  onLaunchAdultRpInChat?: (
    promptText: string,
    rpContext: AdultRpSceneContext,
    recommendedMode?: KaraMode
  ) => void;
  onSelectMode: (mode: KaraMode) => void;
  onToggleAutoAdapt: () => void;
  onUpdateSettings: (partial: Partial<KaraSettings>) => void;
  onSelectVoiceProfile: (profile: VoiceProfileOption) => void;
  onChangeModelTier: (tier: ModelTier) => void;
  onChangeGrounding: (grounding: GroundingOption) => void;
  onSelectRelationshipStage: (stage: RelationshipStage) => void;
  onAdjustBondLevel?: (newBond: number) => void;
  onAddMemory: (category: MemoryCategory, content: string) => Promise<void>;
  onDeleteMemory: (memoryId: string) => Promise<void>;
  onSaveCustomPersonaToMemory?: (persona: CustomKaraPersona) => Promise<void>;
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
  onOpenKaraBrain?: () => void;
  onTestVoice: (sampleType?: 'short' | 'long') => void;
  onHardReset: () => Promise<void>;
}

export interface SettingsSearchItem {
  id: string;
  targetSectionId: string;
  category: 'voice' | 'theme' | 'persona' | 'rp' | 'reasoning' | 'memory' | 'comms' | 'mobility' | 'system';
  categoryLabel: string;
  title: string;
  description: string;
  keywords: string[];
  badge?: string;
}

export const SETTINGS_SEARCH_INDEX: SettingsSearchItem[] = [
  {
    id: 'grok_voices_female',
    targetSectionId: 'section-voice',
    category: 'voice',
    categoryLabel: 'Voice & Speech',
    title: 'Grok Female TTS Voices (Eve, Ara, Vesper, Nova, Siren, Chloe, Maeve)',
    description: '7 expressive, candid, sultry & witty Grok female speech models with 24kHz audio and unrestricted talkback.',
    keywords: ['grok', 'female', 'tts', 'eve', 'ara', 'vesper', 'nova', 'siren', 'chloe', 'maeve', 'voice', 'speech', 'talkback', 'read aloud', 'audio'],
    badge: '7 Grok ♀',
  },
  {
    id: 'grok_voices_male',
    targetSectionId: 'section-voice',
    category: 'voice',
    categoryLabel: 'Voice & Speech',
    title: 'Grok Male TTS Voices (Sal & Leo)',
    description: 'Smooth late-night conversational and bold charismatic Grok male speech models.',
    keywords: ['grok', 'male', 'tts', 'sal', 'leo', 'voice', 'speech', 'audio'],
    badge: '2 Grok ♂',
  },
  {
    id: 'gemini_voices',
    targetSectionId: 'section-voice',
    category: 'voice',
    categoryLabel: 'Voice & Speech',
    title: 'Gemini 24kHz Neural Voices (Zephyr, Leda, Callirrhoe, Autonoe, Kore, Aoede, Puck, Charon, Fenrir)',
    description: 'High-fidelity lifelike neural human speech with natural cadence and empathetic inflection.',
    keywords: ['gemini', 'neural', 'zephyr', 'leda', 'callirrhoe', 'autonoe', 'kore', 'aoede', 'puck', 'charon', 'fenrir', 'voice', 'speech', '24khz', 'pcm'],
    badge: '9 Voices',
  },
  {
    id: 'voice_pacing_speed',
    targetSectionId: 'section-voice',
    category: 'voice',
    categoryLabel: 'Voice & Speech',
    title: 'Voice Pacing & Cadence Controls',
    description: 'Adjust speech tempo, natural conversational pauses, and speech delivery rate.',
    keywords: ['speed', 'pacing', 'rate', 'cadence', 'fast', 'slow', 'tempo', 'speech speed', 'natural pacing'],
  },
  {
    id: 'waveforms_catalog',
    targetSectionId: 'section-waveforms',
    category: 'voice',
    categoryLabel: 'Voice & Speech',
    title: 'Voice Waveform Visualizer Styles & Swatches',
    description: '16 animated audio waveform styles (Liquid, Line, Glitch, Heartbeat, DNA, Aurora, Equalizer, Synapse) and color themes.',
    keywords: ['waveform', 'wave', 'visualizer', 'liquid', 'line', 'glitch', 'heartbeat', 'dna', 'orbital', 'aurora', 'equalizer', 'synapse', 'prism', 'spectrogram', 'particles', 'colors'],
    badge: '16 Styles',
  },
  {
    id: 'auto_vocal_fx',
    targetSectionId: 'section-vocal-fx',
    category: 'voice',
    categoryLabel: 'Voice & Speech',
    title: 'Auto Vocal FX & Somatic Sound Effects',
    description: 'Mode-adaptive human somatic cues: chuckles, sighs, kisses, whispers, and audio effects.',
    keywords: ['vocal fx', 'sound effects', 'sfx', 'chuckle', 'sigh', 'gasp', 'whisper', 'kiss', 'audio cues', 'humanlike'],
  },
  {
    id: 'dark_mode_deep_black',
    targetSectionId: 'section-themes',
    category: 'theme',
    categoryLabel: 'Themes & Aesthetics',
    title: 'Dark Mode / Deep-Black Eye Protection (AMOLED / OLED)',
    description: 'True AMOLED pitch-black backdrop with reduced luminance for late-night eye strain relief.',
    keywords: ['dark mode', 'deep black', 'amoled', 'oled', 'night mode', 'eye protection', 'pitch black', 'lights out', 'black theme'],
    badge: 'Eye Care',
  },
  {
    id: 'mxchat_themes',
    targetSectionId: 'section-themes',
    category: 'theme',
    categoryLabel: 'Themes & Aesthetics',
    title: 'MxChat Theme Studio (iOS × Android Mix, Gemini × Grok Fusion, etc.)',
    description: '12 aesthetic themes including Monster High, Marvel Avengers, Gotham Justice, Cyber Neon, and Velvet Dusk.',
    keywords: ['theme', 'themes', 'ios', 'android', 'gemini-grok', 'fusion', 'monster high', 'marvel', 'gotham', 'cyber neon', 'slate', 'vintage', 'velvet dusk'],
    badge: '12 Themes',
  },
  {
    id: 'bubble_geometry_fonts',
    targetSectionId: 'section-themes',
    category: 'theme',
    categoryLabel: 'Themes & Aesthetics',
    title: 'Chat Bubble Geometry & Typography Studio',
    description: 'Customize message bubble border radius (Rounded, Sharp, Pill, iOS Tail, Chamfered) and typography scales.',
    keywords: ['bubble', 'bubbles', 'geometry', 'rounded', 'pill', 'chamfered', 'font', 'typography', 'sf pro', 'android geometric', 'serif', 'mono', 'scale'],
  },
  {
    id: 'mode_switcher_1tap',
    targetSectionId: 'section-modes',
    category: 'persona',
    categoryLabel: 'Modes & Personas',
    title: '1-Tap Mode Switcher (Regular, Bratty, Uncensored, Romantic, Parent)',
    description: 'Instantly toggle Kara’s active persona and conversational archetype with 1 tap.',
    keywords: ['mode', 'modes', 'switcher', 'regular', 'bratty', 'uncensored', 'romantic', 'parent', 'persona', 'personality'],
    badge: '1-Tap',
  },
  {
    id: 'smart_auto_adapt_mode',
    targetSectionId: 'section-modes',
    category: 'persona',
    categoryLabel: 'Modes & Personas',
    title: 'Smart Auto-Adapt Mode Switcher',
    description: 'Allows Kara to autonomously shift into Uncensored, Bratty, Romantic, or Parent based on context.',
    keywords: ['auto adapt', 'auto switch', 'dynamic mode', 'adaptive persona', 'smart mode', 'auto-switcher'],
  },
  {
    id: 'custom_persona_builder',
    targetSectionId: 'section-custom-persona',
    category: 'persona',
    categoryLabel: 'Modes & Personas',
    title: 'Custom Persona Builder & Behavioral Rules',
    description: 'Design custom personas with custom names, tones, base modes, and rules persisted in memory.',
    keywords: ['custom persona', 'create persona', 'custom tone', 'rules builder', 'behavioral rules', 'persona creator', 'custom character'],
  },
  {
    id: 'fun_mode_toggle',
    targetSectionId: 'section-fun-mode',
    category: 'persona',
    categoryLabel: 'Modes & Personas',
    title: 'Fun Mode (Playful Banter & Uncensored Sassy Humor)',
    description: 'Dial up witty banter, candid uninhibited observations, playful sass, and humor.',
    keywords: ['fun mode', 'banter', 'witty', 'humor', 'jokes', 'playful', 'sass', 'teasing', 'fun'],
  },
  {
    id: 'adult_rp_studio',
    targetSectionId: 'section-adult-rp',
    category: 'rp',
    categoryLabel: 'Adult Roleplay 18+',
    title: 'Adult RP Studio & Scene Director (14 Scenarios & 6 Heat Levels)',
    description: 'Uncensored 18+ adult roleplay presets, heat levels, wardrobe, props, sensory vibes, and one-tap starters.',
    keywords: ['adult', 'rp', 'roleplay', '18+', 'nsfw', 'uncensored', 'heat', 'intensity', 'wardrobe', 'props', 'sensual', 'erotic', 'scenarios', 'dirty talk'],
    badge: '18+ Adult',
  },
  {
    id: 'soap_discipline_reprimand',
    targetSectionId: 'section-soap',
    category: 'rp',
    categoryLabel: 'Adult Roleplay 18+',
    title: 'Humorous Soap Discipline Reprimand (Parent Mode)',
    description: 'Playful mouth-washing soap minigame and comedic parental scolding for naughty language.',
    keywords: ['soap', 'soap discipline', 'parent mode', 'mouth wash', 'scold', 'discipline', 'bubbles', 'bad language'],
  },
  {
    id: 'think_model_tier',
    targetSectionId: 'section-reasoning',
    category: 'reasoning',
    categoryLabel: 'AI & Reasoning',
    title: 'Thinking Model Tier (Pro vs Flash vs Flash-Lite)',
    description: 'Select Gemini 2.5/3.0 model tiers for deep reasoning, fast responses, or ultra-light latency.',
    keywords: ['model', 'model tier', 'think model', 'pro', 'flash', 'flash-lite', 'gemini 2.5', 'gemini 3', 'reasoning model'],
  },
  {
    id: 'reasoning_duration_threshold',
    targetSectionId: 'section-reasoning',
    category: 'reasoning',
    categoryLabel: 'AI & Reasoning',
    title: 'Reasoning Duration Badge & Threshold (0s - 15s Slider)',
    description: 'Configure when and how Kara’s thinking duration and reasoning trace badges are displayed in chat.',
    keywords: ['reasoning', 'thinking duration', 'thinking badge', 'trace', 'threshold', 'slider', 'thinking time', 'seconds'],
    badge: '0-15s',
  },
  {
    id: 'kara_brain_overlay',
    targetSectionId: 'section-kara-brain',
    category: 'reasoning',
    categoryLabel: 'AI & Reasoning',
    title: 'Kara Brain & Deep Insights Analytical Overlay',
    description: 'Live consciousness telemetry, inner monologue inspection, emotional physics, and cognitive state.',
    keywords: ['kara brain', 'deep insights', 'brain', 'telemetry', 'inner monologue', 'consciousness', 'mind', 'thoughts', 'analytical overlay'],
    badge: 'Brain',
  },
  {
    id: 'deeper_search_grounding',
    targetSectionId: 'section-grounding',
    category: 'reasoning',
    categoryLabel: 'AI & Reasoning',
    title: 'DeeperSearch & Real-Time Web Grounding',
    description: 'Multi-hop real-time web search and live citations from current news and sources.',
    keywords: ['search', 'web search', 'deepersearch', 'grounding', 'citations', 'google search', 'current news', 'live web'],
  },
  {
    id: 'maps_grounding_poi',
    targetSectionId: 'section-grounding',
    category: 'reasoning',
    categoryLabel: 'AI & Reasoning',
    title: 'Google Maps Grounding & Local POI Navigation',
    description: 'Live Google Maps places, addresses, routing, ETA, and local venue recommendations.',
    keywords: ['maps', 'google maps', 'location', 'places', 'navigation', 'directions', 'poi', 'restaurants', 'eta'],
  },
  {
    id: 'token_streaming_mode',
    targetSectionId: 'section-tokens',
    category: 'reasoning',
    categoryLabel: 'AI & Reasoning',
    title: 'Token Streaming vs Instant Response Mode',
    description: 'Toggle word-by-word streaming generation or instant complete message delivery.',
    keywords: ['token', 'streaming', 'stream', 'instant', 'typewriter', 'speed', 'latency', 'tokens'],
  },
  {
    id: 'predictive_text_chips',
    targetSectionId: 'section-predictive',
    category: 'reasoning',
    categoryLabel: 'AI & Reasoning',
    title: 'Next-Word & Next-Sentence Predictive Suggestions',
    description: 'Inline predictive text chips in chat composer that complete your thoughts before typing.',
    keywords: ['predictive', 'next word', 'next sentence', 'autocomplete', 'suggestions', 'prediction', 'chips', 'composer'],
  },
  {
    id: 'response_style_presets',
    targetSectionId: 'section-response-styles',
    category: 'reasoning',
    categoryLabel: 'AI & Reasoning',
    title: 'Response Style Presets & Cadence (Adaptive Mix, Bulleted, Conversational)',
    description: 'Control whether Kara speaks concisely, poetically, conversationally, or in deep analytical detail.',
    keywords: ['response style', 'cadence', 'adaptive mix', 'short responses', 'long responses', 'bulleted', 'concise', 'verbose', 'style'],
  },
  {
    id: 'memory_vault_recall',
    targetSectionId: 'section-memory',
    category: 'memory',
    categoryLabel: 'Memory Vault',
    title: 'Sector 9 Memory Recall Command (/recall) & Embedded Vault',
    description: 'Add, review, and delete long-term facts, preferences, relationship milestones, and past stories.',
    keywords: ['memory', 'memories', 'vault', 'remember', 'recall', 'preferences', 'facts', 'milestones', 'history', 'stories'],
    badge: 'Vault',
  },
  {
    id: 'proactive_reachout_idle',
    targetSectionId: 'section-proactive',
    category: 'memory',
    categoryLabel: 'Memory Vault',
    title: 'Proactive Real-Time Reach-Out & Idle Check-ins',
    description: 'Configure Kara reaching out when you have been quiet, morning messages, and proactive check-ins.',
    keywords: ['proactive', 'reach out', 'check-in', 'idle', 'text first', 'morning text', 'autonomous', 'ping'],
  },
  {
    id: 'relationship_bond_slider',
    targetSectionId: 'section-relationship',
    category: 'memory',
    categoryLabel: 'Memory Vault',
    title: 'Relationship & Bond Level (0% - 100% Slider & 20 Milestones)',
    description: 'Fine-tune connection percentage, unlockable relationship stats (Trust, Affection, Intimacy), and milestone badges.',
    keywords: ['relationship', 'bond', 'bond level', 'slider', 'milestones', 'trust', 'affection', 'intimacy', 'unlockable stats', 'friend', 'lover', 'soulmate'],
    badge: 'Bond %',
  },
  {
    id: 'email_comms_hub_accounts',
    targetSectionId: 'section-email',
    category: 'comms',
    categoryLabel: 'Email & Comms Hub',
    title: 'Connected Email Accounts & Multi-Provider Bots (Yahoo, Gmail, Outlook, iCloud)',
    description: 'Connect email inboxes, sync messages, draft replies with Gemini bots, and send emails.',
    keywords: ['email', 'yahoo', 'gmail', 'outlook', 'icloud', 'mail', 'inbox', 'imap', 'smtp', 'compose', 'comms hub', 'connected accounts'],
    badge: 'Email Hub',
  },
  {
    id: 'gemini_gems_skills_hub',
    targetSectionId: 'section-gems',
    category: 'comms',
    categoryLabel: 'Email & Comms Hub',
    title: 'Gemini Skills & Gems Hub (Mailing Bots, Calendar Bots, Custom Gems)',
    description: 'Specialized autonomous assistant bots with inline execution workbenches right inside Settings.',
    keywords: ['gems', 'gem', 'skills', 'mailing bot', 'calendar bot', 'custom gem', 'workbench', 'tools', 'autonomous bots'],
  },
  {
    id: 'mobility_uber_lyft_transit',
    targetSectionId: 'section-mobility',
    category: 'mobility',
    categoryLabel: 'Mobility & Assistant',
    title: 'Real-Time Uber / Lyft Concierge & Public Transit Directions',
    description: 'Real-time ride tracking, transit route cards, multi-modal arrival estimates, and concierge assistance.',
    keywords: ['uber', 'lyft', 'rides', 'transit', 'bus', 'train', 'directions', 'navigation', 'mobility', 'commute'],
  },
  {
    id: 'uber_eats_delivery_assistant',
    targetSectionId: 'section-mobility',
    category: 'mobility',
    categoryLabel: 'Mobility & Assistant',
    title: 'Real-Time Uber Eats Assistant & Courier Telemetry',
    description: 'Real-time food delivery progress, courier tracking, cuisine filters, and curated menu ordering.',
    keywords: ['uber eats', 'food', 'delivery', 'order food', 'courier', 'restaurant', 'eats', 'menu'],
  },
  {
    id: 'smart_alarms_agenda_sync',
    targetSectionId: 'section-alarms',
    category: 'mobility',
    categoryLabel: 'Mobility & Assistant',
    title: 'Smart Morning Alarms & Today’s Synced Agenda (Google Calendar)',
    description: 'Set custom alarms with Kara wake-up audio and view synced daily schedule events.',
    keywords: ['alarm', 'alarms', 'set alarm', 'wake up', 'agenda', 'calendar', 'google calendar', 'schedule', 'events', 'clock'],
    badge: 'Alarms',
  },
  {
    id: 'tactile_haptics_feedback',
    targetSectionId: 'section-haptics',
    category: 'system',
    categoryLabel: 'System & Reset',
    title: 'Tactile Haptics Vibration Feedback',
    description: 'Fine-grained haptic response on buttons, mode switches, sliders, and audio playback.',
    keywords: ['haptic', 'haptics', 'vibration', 'vibrate', 'feedback', 'tactile', 'buzz'],
  },
  {
    id: 'sector9_hard_reset_wipe',
    targetSectionId: 'section-reset',
    category: 'system',
    categoryLabel: 'System & Reset',
    title: 'Sector 9 Factory Hard Reset',
    description: 'Wipe all persistent memories, reset bond level to 0%, and restore fresh factory slate.',
    keywords: ['reset', 'hard reset', 'factory reset', 'wipe', 'clear memory', 'clean slate', 'fresh start', 'erase'],
    badge: 'Reset',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  userName = 'Stephen',
  userEmail = null,
  isAuthenticated = false,
  onOpenAuthModal,
  onLogout,
  onOpenEmailCommsHub,
  activeMode,
  autoAdaptMode,
  selectedVoiceProfile,
  isSpeaking = false,
  speakingProgress = null,
  onStopSpeaking,
  modelTier,
  grounding,
  bondLevel,
  soapWashCount,
  memories,
  activeAlarms = [],
  responseStylePreset = 'adaptive_mix',
  onSelectResponseStylePreset,
  funMode = true,
  onToggleFunMode,
  onInsertPromptTip,
  onLaunchAdultRpInChat,
  onSelectMode,
  onToggleAutoAdapt,
  onUpdateSettings,
  onSelectVoiceProfile,
  onChangeModelTier,
  onChangeGrounding,
  onSelectRelationshipStage,
  onAdjustBondLevel,
  onAddMemory,
  onDeleteMemory,
  onSaveCustomPersonaToMemory,
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
  onOpenKaraBrain,
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

  // Settings Search & Quick Jump State
  const [settingsSearchQuery, setSettingsSearchQuery] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener to focus search (Cmd/Ctrl+K or /)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const matchingSearchItems = useMemo(() => {
    const query = settingsSearchQuery.trim().toLowerCase();
    if (!query && activeCategoryFilter === 'all') return [];
    return SETTINGS_SEARCH_INDEX.filter((item) => {
      const matchesCategory =
        activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.categoryLabel.toLowerCase().includes(query) ||
        item.keywords.some((k) => k.toLowerCase().includes(query))
      );
    });
  }, [settingsSearchQuery, activeCategoryFilter]);

  const handleJumpToSection = (targetId: string) => {
    setHighlightedSectionId(targetId);
    triggerHaptic('tap', settings.hapticsEnabled);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedSectionId((prev) => (prev === targetId ? null : prev));
    }, 3500);
  };

  // Custom Persona Builder state (Name, Tone, Base Mode, and Behavioral Rules persisted in Memory)
  const [isCustomPersonaFormOpen, setIsCustomPersonaFormOpen] = useState<boolean>(false);
  const [editingCustomPersonaId, setEditingCustomPersonaId] = useState<string | null>(null);
  const [customPersonaName, setCustomPersonaName] = useState<string>('');
  const [customPersonaTone, setCustomPersonaTone] = useState<string>('Warm, Witty & Unapologetic');
  const [customPersonaBaseMode, setCustomPersonaBaseMode] = useState<KaraMode>('regular');
  const [customPersonaRules, setCustomPersonaRules] = useState<string[]>([
    'Speak with candid honesty, natural charisma, and expressive *physical actions in asterisks*',
    'Remember and weave Stephen’s preferences and past stories into every answer',
  ]);
  const [newRuleDraft, setNewRuleDraft] = useState<string>('');
  const [isSavingCustomPersona, setIsSavingCustomPersona] = useState<boolean>(false);
  const [customPersonaSavedFeedback, setCustomPersonaSavedFeedback] = useState<string>('');

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

  // Connected Email Accounts state for Email Bots (Yahoo Mail, Gmail, Outlook, iCloud & Others)
  const [emailAccounts, setEmailAccounts] = useState<ConnectedEmailAccount[]>(() =>
    loadConnectedEmailAccounts()
  );
  const [selectedEmailAccountId, setSelectedEmailAccountId] = useState<string>(() => {
    const list = loadConnectedEmailAccounts();
    const def = list.find((a) => a.isDefault);
    return def ? def.id : list[0]?.id || 'acc_yahoo_stephen';
  });
  const [emailWorkbenchTab, setEmailWorkbenchTab] = useState<'compose' | 'inbox'>('compose');
  const [activeThreadMessage, setActiveThreadMessage] = useState<EmailMessageItem | null>(null);
  const [isSyncingEmail, setIsSyncingEmail] = useState<boolean>(false);
  const [emailStatusFeedback, setEmailStatusFeedback] = useState<string>('');
  const [isAddEmailModalOpen, setIsAddEmailModalOpen] = useState<boolean>(false);
  const [newAccountProvider, setNewAccountProvider] = useState<EmailProvider>('yahoo');
  const [newAccountEmail, setNewAccountEmail] = useState<string>('');
  const [newAccountDisplayName, setNewAccountDisplayName] = useState<string>('');
  const [newAccountPassword, setNewAccountPassword] = useState<string>('');
  const [newAccountImapHost, setNewAccountImapHost] = useState<string>('imap.mail.yahoo.com');
  const [newAccountImapPort, setNewAccountImapPort] = useState<number>(993);
  const [newAccountSmtpHost, setNewAccountSmtpHost] = useState<string>('smtp.mail.yahoo.com');
  const [newAccountSmtpPort, setNewAccountSmtpPort] = useState<number>(465);

  const selectedEmailAccount =
    emailAccounts.find((a) => a.id === selectedEmailAccountId) || emailAccounts[0] || null;

  // Custom Gem Builder state inside Settings
  const [isCreatingCustomGem, setIsCreatingCustomGem] = useState<boolean>(false);
  const [customGemName, setCustomGemName] = useState<string>('');
  const [customGemCategory, setCustomGemCategory] = useState<KaraGemCategory>('everyday');
  const [customGemTagline, setCustomGemTagline] = useState<string>('');
  const [customGemDirective, setCustomGemDirective] = useState<string>('');
  const [rpCategoryFilter, setRpCategoryFilter] = useState<
    'all' | 'romantic' | 'uncensored' | 'bratty' | 'caregiver' | 'fantasy'
  >('all');
  const [bondCategoryFilter, setBondCategoryFilter] = useState<
    'all' | 'adult' | 'platonic' | 'flirty' | 'romantic' | 'devoted' | 'caregiver'
  >('all');

  // Late-Night Concierge State: Real-Time Ride Sharing Assistant, Public Transit Directions & Real-Time Uber Eats Assistant
  const [conciergeActiveTab, setConciergeActiveTab] = useState<'rideshare' | 'transit' | 'ubereats'>('rideshare');
  const [ridePickup, setRidePickup] = useState<string>('Current Location (Downtown Lounge)');
  const [rideDropoff, setRideDropoff] = useState<string>('Home Sanctuary');
  const [rideTierId, setRideTierId] = useState<'uberx' | 'comfort' | 'lyft' | 'xl' | 'black'>('comfort');
  const [rideNotes, setRideNotes] = useState<string>('Quiet ride preferred · Verify license plate & share live ETA with KARA');
  const [rideRealtimeActive, setRideRealtimeActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kara_realtime_rideshare_v1');
      if (saved) return JSON.parse(saved).active ?? true;
    } catch {
      // ignore
    }
    return true;
  });
  const [rideRealtimeStage, setRideRealtimeStage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kara_realtime_rideshare_v1');
      if (saved) return JSON.parse(saved).stage ?? 1;
    } catch {
      // ignore
    }
    return 1;
  });
  const [rideEtaSeconds, setRideEtaSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kara_realtime_rideshare_v1');
      if (saved && typeof JSON.parse(saved).etaSeconds === 'number') {
        return JSON.parse(saved).etaSeconds;
      }
    } catch {
      // ignore
    }
    return 224; // 3m 44s live countdown
  });

  const [transitOrigin, setTransitOrigin] = useState<string>('Union Station / Downtown Metro');
  const [transitDestination, setTransitDestination] = useState<string>('Midtown Arts District');
  const [transitDepartMode, setTransitDepartMode] = useState<'now' | 'owl' | 'last_train'>('now');
  const [selectedTransitRouteIdx, setSelectedTransitRouteIdx] = useState<number>(0);

  const [eatsCategory, setEatsCategory] = useState<'late_night' | 'burgers' | 'tacos' | 'ramen' | 'pizza' | 'dessert'>('late_night');
  const [eatsSearchQuery, setEatsSearchQuery] = useState<string>('');
  const [eatsSelectedItems, setEatsSelectedItems] = useState<string[]>([
    'Double Truffle Smash Burger + Crispy Shoestring Fries',
    'Oreo Midnight Milkshake',
  ]);
  const [eatsDeliveryNote, setEatsDeliveryNote] = useState<string>('Leave at door · Do not ring bell (late-night order)');
  const [eatsRealtimeActive, setEatsRealtimeActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kara_realtime_ubereats_v1');
      if (saved) return JSON.parse(saved).active ?? true;
    } catch {
      // ignore
    }
    return true;
  });
  const [eatsRealtimeStage, setEatsRealtimeStage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kara_realtime_ubereats_v1');
      if (saved) return JSON.parse(saved).stage ?? 2;
    } catch {
      // ignore
    }
    return 2;
  });
  const [eatsEtaSeconds, setEatsEtaSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kara_realtime_ubereats_v1');
      if (saved && typeof JSON.parse(saved).etaSeconds === 'number') {
        return JSON.parse(saved).etaSeconds;
      }
    } catch {
      // ignore
    }
    return 1125; // 18m 45s live delivery countdown
  });
  const [realtimePulseTick, setRealtimePulseTick] = useState<number>(0);

  // Real-Time 1-Second Live Telemetry Ticker for Ride Sharing Assistant & Uber Eats Assistant
  useEffect(() => {
    const interval = window.setInterval(() => {
      setRealtimePulseTick((t) => (t + 1) % 60);
      setRideEtaSeconds((prev) => {
        if (!rideRealtimeActive) return prev;
        const next = prev > 15 ? prev - 1 : 210;
        try {
          localStorage.setItem(
            'kara_realtime_rideshare_v1',
            JSON.stringify({
              active: rideRealtimeActive,
              stage: rideRealtimeStage,
              etaSeconds: next,
              pickup: ridePickup,
              dropoff: rideDropoff,
              tier: rideTierId,
            })
          );
        } catch {
          // ignore
        }
        return next;
      });
      setEatsEtaSeconds((prev) => {
        if (!eatsRealtimeActive) return prev;
        const next = prev > 30 ? prev - 1 : 960;
        try {
          localStorage.setItem(
            'kara_realtime_ubereats_v1',
            JSON.stringify({
              active: eatsRealtimeActive,
              stage: eatsRealtimeStage,
              etaSeconds: next,
              items: eatsSelectedItems,
              note: eatsDeliveryNote,
            })
          );
        } catch {
          // ignore
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [
    rideRealtimeActive,
    rideRealtimeStage,
    ridePickup,
    rideDropoff,
    rideTierId,
    eatsRealtimeActive,
    eatsRealtimeStage,
    eatsSelectedItems,
    eatsDeliveryNote,
  ]);

  // Merge settings.customPersonas with any Custom Persona entries persisted in the Memory Vault
  const allCustomPersonas: CustomKaraPersona[] = React.useMemo(() => {
    const fromSettings = Array.isArray(settings.customPersonas) ? settings.customPersonas : [];
    const byName = new Map<string, CustomKaraPersona>();
    for (const cp of fromSettings) {
      if (cp && cp.name) {
        byName.set(cp.name.toLowerCase().trim(), cp);
      }
    }
    for (const mem of memories) {
      const parsed = parseCustomPersonaFromMemoryContent(mem);
      if (parsed && !byName.has(parsed.name.toLowerCase().trim())) {
        byName.set(parsed.name.toLowerCase().trim(), parsed);
      }
    }
    return Array.from(byName.values());
  }, [settings.customPersonas, memories]);

  const activeCustomPersona =
    allCustomPersonas.find((cp) => cp.id === settings.activeCustomPersonaId) || null;

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
          connectedAccount: selectedEmailAccount
            ? {
                id: selectedEmailAccount.id,
                provider: selectedEmailAccount.provider,
                email: selectedEmailAccount.email,
                displayName: selectedEmailAccount.displayName,
              }
            : null,
          activeEmailThread: activeThreadMessage
            ? {
                sender: activeThreadMessage.sender,
                senderEmail: activeThreadMessage.senderEmail,
                subject: activeThreadMessage.subject,
                snippet: activeThreadMessage.snippet,
                body: activeThreadMessage.body,
              }
            : null,
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

  const handleAddRuleToDraft = () => {
    const clean = newRuleDraft.trim();
    if (!clean) return;
    triggerHaptic('tap', settings.hapticsEnabled);
    if (!customPersonaRules.includes(clean)) {
      setCustomPersonaRules((prev) => [...prev, clean]);
    }
    setNewRuleDraft('');
  };

  const handleRemoveRuleFromDraft = (idxToRemove: number) => {
    triggerHaptic('tap', settings.hapticsEnabled);
    setCustomPersonaRules((prev) => prev.filter((_, i) => i !== idxToRemove));
  };

  const handleStartEditCustomPersona = (persona: CustomKaraPersona) => {
    triggerHaptic('tap', settings.hapticsEnabled);
    setEditingCustomPersonaId(persona.id);
    setCustomPersonaName(persona.name);
    setCustomPersonaTone(persona.tone);
    setCustomPersonaBaseMode(persona.baseMode);
    setCustomPersonaRules([...persona.behavioralRules]);
    setIsCustomPersonaFormOpen(true);
  };

  const handleSaveCustomPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customPersonaName.trim();
    const cleanTone = customPersonaTone.trim();
    const pendingRule = newRuleDraft.trim();
    const effectiveRules = [
      ...customPersonaRules.map((r) => r.trim()).filter(Boolean),
      ...(pendingRule && !customPersonaRules.includes(pendingRule) ? [pendingRule] : []),
    ];
    if (!cleanName || !cleanTone || effectiveRules.length === 0 || isSavingCustomPersona) return;

    setIsSavingCustomPersona(true);
    triggerHaptic('unlock', settings.hapticsEnabled);

    try {
      const personaId = editingCustomPersonaId || `cp_${Date.now()}`;
      const memId = `mem_persona_${personaId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const savedPersona: CustomKaraPersona = {
        id: personaId,
        name: cleanName.slice(0, 60),
        tone: cleanTone.slice(0, 90),
        baseMode: customPersonaBaseMode,
        behavioralRules: effectiveRules.slice(0, 8),
        memoryId: memId,
        createdAt: Date.now(),
      };

      const existingList = allCustomPersonas.filter(
        (cp) =>
          cp.id !== personaId &&
          cp.name.toLowerCase().trim() !== cleanName.toLowerCase().trim()
      );
      const updatedList = [savedPersona, ...existingList];

      onUpdateSettings({
        customPersonas: updatedList,
        activeCustomPersonaId: savedPersona.id,
      });

      if (customPersonaBaseMode !== activeMode) {
        onSelectMode(customPersonaBaseMode);
      }

      if (onSaveCustomPersonaToMemory) {
        await onSaveCustomPersonaToMemory(savedPersona);
      } else {
        await onAddMemory('preference', formatCustomPersonaMemoryContent(savedPersona));
      }

      setCustomPersonaSavedFeedback(
        `Saved "${savedPersona.name}" & persisted its tone and ${savedPersona.behavioralRules.length} behavioral rules to Memory!`
      );
      setTimeout(() => setCustomPersonaSavedFeedback(''), 4500);
      setNewRuleDraft('');
      setEditingCustomPersonaId(null);
      setIsCustomPersonaFormOpen(false);
    } finally {
      setIsSavingCustomPersona(false);
    }
  };

  const handleDeleteCustomPersona = async (persona: CustomKaraPersona) => {
    triggerHaptic('tap', settings.hapticsEnabled);
    const nextList = allCustomPersonas.filter((cp) => cp.id !== persona.id);
    const nextActiveId =
      settings.activeCustomPersonaId === persona.id ? null : settings.activeCustomPersonaId;
    onUpdateSettings({
      customPersonas: nextList,
      activeCustomPersonaId: nextActiveId,
    });
    if (persona.memoryId) {
      await onDeleteMemory(persona.memoryId);
    }
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
              <span>Sector 9 Configuration · Email &amp; Comms Hub · Gemini Skills &amp; Gems</span>
            </div>
            <h2 className="mt-0.5 text-lg font-semibold text-white">
              KARA Settings: Email &amp; Accounts · Persona · Gemini Skills &amp; Gems
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

        {/* SETTINGS SEARCH ENGINE & QUICK JUMP DOCK */}
        <div className="bg-neutral-900/90 border border-sky-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-md">
          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-sky-400 absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={settingsSearchQuery}
              onChange={(e) => setSettingsSearchQuery(e.target.value)}
              placeholder="Search settings (e.g. 'grok', 'voice', 'dark mode', 'theme', 'rp', 'email', 'alarm', 'reset')..."
              className="w-full bg-neutral-950/90 border border-neutral-700/80 rounded-xl pl-9 pr-24 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {settingsSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSettingsSearchQuery('');
                    setActiveCategoryFilter('all');
                  }}
                  className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-400">
                ⌘K or /
              </span>
            </div>
          </div>

          {/* Quick Topic Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider pr-1">
              Quick Filter:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'voice', label: 'Grok & Voices ♀', query: 'grok' },
              { id: 'theme', label: 'Themes & Dark Mode', query: 'dark mode' },
              { id: 'persona', label: '1-Tap Modes', query: 'mode' },
              { id: 'rp', label: 'Adult RP 18+', query: 'adult' },
              { id: 'reasoning', label: 'AI & Reasoning', query: 'reasoning' },
              { id: 'memory', label: 'Memories & Bond', query: 'memory' },
              { id: 'comms', label: 'Email Hub', query: 'email' },
              { id: 'mobility', label: 'Alarms & Mobility', query: 'alarm' },
            ].map((chip) => {
              const isActive =
                chip.id === 'all'
                  ? !settingsSearchQuery && activeCategoryFilter === 'all'
                  : settingsSearchQuery.toLowerCase() === (chip.query || '').toLowerCase() ||
                    activeCategoryFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    if (chip.id === 'all') {
                      setSettingsSearchQuery('');
                      setActiveCategoryFilter('all');
                    } else {
                      setSettingsSearchQuery(chip.query || '');
                      setActiveCategoryFilter(chip.id);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                    isActive
                      ? 'bg-sky-500/25 border-sky-400/60 text-sky-200'
                      : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic Search Results Deck */}
          {(settingsSearchQuery.trim() || activeCategoryFilter !== 'all') && (
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] px-0.5">
                <span className="text-sky-300 font-mono">
                  {matchingSearchItems.length}{' '}
                  {matchingSearchItems.length === 1 ? 'setting match' : 'settings matches'} found
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsSearchQuery('');
                    setActiveCategoryFilter('all');
                  }}
                  className="text-neutral-400 hover:text-neutral-200 text-[10px] font-mono underline"
                >
                  Clear filter
                </button>
              </div>

              {matchingSearchItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-center space-y-1">
                  <p className="text-xs text-neutral-300">
                    No settings found matching &ldquo;{settingsSearchQuery}&rdquo;
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Try searching for &lsquo;voice&rsquo;, &lsquo;grok&rsquo;, &lsquo;dark mode&rsquo;, &lsquo;rp&rsquo;, &lsquo;theme&rsquo;, or &lsquo;reset&rsquo;.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {matchingSearchItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleJumpToSection(item.targetSectionId)}
                      className="p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 hover:border-sky-500/50 text-left transition-all group flex flex-col justify-between gap-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-neutral-500 group-hover:text-sky-400">
                        <span>{item.categoryLabel}</span>
                        <span>Jump to Setting →</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* UNIFIED SETTINGS COMMAND HUB: 1-TAP MODE SWITCHER, DARK MODE, FUN MODE, KARA BRAIN, ADAPTIVE MIX & NEXT WORD */}
        <div
          id="section-modes"
          className={`bg-gradient-to-br from-sky-950/35 via-neutral-900/95 to-fuchsia-950/30 border rounded-2xl p-4 space-y-3.5 shadow-lg transition-all duration-300 ${
            highlightedSectionId === 'section-modes'
              ? 'ring-2 ring-sky-400 border-sky-400 shadow-sky-500/30'
              : 'border-sky-500/40'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/90">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold text-white">
                  1-Tap Mode Switcher · Dark Mode · Fun Mode · Kara Brain · Adaptive Mix · Next Word
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                All core persona, deep-black late-night eye protection, consciousness &amp; predictive controls consolidated in Settings.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-[10px] font-mono text-sky-200">
              All-in-Settings Control Hub
            </span>
          </div>

          {/* 1. 1-Tap Mode Switcher & Smart Auto-Switcher */}
          <div className="p-3 rounded-xl bg-neutral-950/85 border border-neutral-800/90 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${currentModeMeta.accentText}`} />
                <span className="text-xs font-semibold text-white">
                  1-Tap Mode Switcher: <span className={currentModeMeta.accentText}>{currentModeMeta.label} Mode</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('modeSwitch', settings.hapticsEnabled);
                    const modeOrder: KaraMode[] = [
                      'regular',
                      'bratty',
                      'uncensored',
                      'romantic',
                      'parent',
                    ];
                    const nextMode =
                      modeOrder[(modeOrder.indexOf(activeMode) + 1) % modeOrder.length];
                    onSelectMode(nextMode);
                  }}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-sky-500/25 via-indigo-500/25 to-fuchsia-500/25 hover:from-sky-500/35 hover:to-fuchsia-500/35 border border-sky-400/50 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>1-Tap Cycle Mode →</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('modeSwitch', settings.hapticsEnabled);
                    onToggleAutoAdapt();
                  }}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-semibold transition-all ${
                    autoAdaptMode
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                      : 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                  }`}
                >
                  {autoAdaptMode ? 'Auto-Switch: ON' : 'Manual Lock'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(['regular', 'bratty', 'uncensored', 'romantic', 'parent'] as KaraMode[]).map((mId) => {
                const mMeta = MODE_META[mId];
                const MIcon = mMeta.icon;
                const isSelected = activeMode === mId;
                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => {
                      triggerHaptic('modeSwitch', settings.hapticsEnabled);
                      onSelectMode(mId);
                    }}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? mMeta.activeBg
                        : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <MIcon className={`w-3.5 h-3.5 ${mMeta.accentText}`} />
                    <span>{mId === 'parent' ? 'Parent' : mMeta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Global Dark Mode (Deep Black), Fun Mode, Kara Brain, and Next Word Toggles in One Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Global Dark Mode (Deep Black OLED for Late-Night Eye Strain Reduction) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('modeSwitch', settings.hapticsEnabled);
                onUpdateSettings({ darkMode: !settings.darkMode });
              }}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                settings.darkMode
                  ? 'bg-black border-emerald-400/60 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dark Mode</span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                  Deep black · Low eye strain
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                  settings.darkMode ? 'bg-emerald-400 text-slate-950' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {settings.darkMode ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Fun Mode */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                if (onToggleFunMode) onToggleFunMode();
              }}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                funMode
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-100'
                  : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Fun Mode</span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                  Playful banter, roasts &amp; wit
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                  funMode ? 'bg-amber-400 text-slate-950' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {funMode ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Kara Brain */}
            <div className="p-3 rounded-xl border bg-fuchsia-500/10 border-fuchsia-500/40 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-fuchsia-100 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                  <span>Kara Brain</span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                  5-Msg Consciousness &amp; Mind
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onUpdateSettings({ deepInsights: !settings.deepInsights });
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                    settings.deepInsights
                      ? 'bg-fuchsia-400 text-slate-950'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {settings.deepInsights ? 'ON' : 'OFF'}
                </button>
                {onOpenKaraBrain && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', settings.hapticsEnabled);
                      onClose();
                      onOpenKaraBrain();
                    }}
                    className="px-2 py-0.5 rounded-lg bg-fuchsia-500/25 hover:bg-fuchsia-500/40 border border-fuchsia-400/50 text-[10px] font-mono text-fuchsia-100"
                  >
                    Open
                  </button>
                )}
              </div>
            </div>

            {/* Next Word & Sentence Starters */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onUpdateSettings({
                  showPredictiveComposerBar: settings.showPredictiveComposerBar === false,
                });
              }}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                settings.showPredictiveComposerBar !== false
                  ? 'bg-indigo-500/15 border-indigo-400/50 text-indigo-100'
                  : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Next Word</span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                  Predictive word &amp; sentence engine
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                  settings.showPredictiveComposerBar !== false
                    ? 'bg-indigo-400 text-slate-950'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {settings.showPredictiveComposerBar !== false ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* 3. Adaptive Mix & Response Style Selector */}
          <div className="p-3 rounded-xl bg-neutral-950/85 border border-neutral-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Adaptive Mix &amp; Response Style</span>
              </span>
              <span className="text-[10px] font-mono text-sky-300">
                Active: {RESPONSE_STYLE_PRESETS.find((p) => p.id === responseStylePreset)?.label || 'Adaptive Mix'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {RESPONSE_STYLE_PRESETS.map((preset) => {
                const isSelected = responseStylePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', settings.hapticsEnabled);
                      onSelectResponseStylePreset?.(preset.id);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400/60 text-white shadow-sm'
                        : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{preset.shortLabel}</div>
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5">{preset.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Next Word & Sentence Starters Quick-Insert Bar inside Settings */}
          {settings.showPredictiveComposerBar !== false && onInsertPromptTip && (
            <div className="p-3 rounded-xl bg-neutral-950/85 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Next Word &amp; Sentence Starters (Tap to Insert into Chat)</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">Tab / Shift+Tab in Chat</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  'Tell me what is really on your mind right now...',
                  'Switch into Mistress Bond and give me my next rule...',
                  'Let us dive into an unfiltered late-night roleplay...',
                  'Be completely honest with me—no filter:',
                  'Give me your sharpest playful tease right now!',
                ].map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', settings.hapticsEnabled);
                      onInsertPromptTip(starter);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-indigo-500/20 border border-neutral-800 hover:border-indigo-400/50 text-[11px] text-neutral-200 hover:text-white transition-colors"
                  >
                    + {starter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* EMAIL, CONNECTED MAIL ACCOUNTS, COMMS HUB & ACCOUNT SYNC (MOVED TO SETTINGS) */}
        <div className="bg-gradient-to-br from-purple-950/35 via-neutral-900/90 to-indigo-950/30 border border-purple-500/40 rounded-2xl p-4 space-y-3.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-neutral-800/90">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-purple-300" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    Email, Connected Mailboxes &amp; Account Sync
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-[10px] font-mono text-purple-200">
                    Managed in Settings
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  All email accounts (Yahoo Mail, Gmail, Outlook, iCloud), Email &amp; Comms Hub, and Account Sign-In live right here in Settings.
                </p>
              </div>
            </div>

            {/* Account Email Sign-In / Sign-Out Control inside Settings */}
            <div className="flex items-center gap-2 shrink-0">
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onOpenAuthModal?.();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#4C8DF6] via-[#9B72CB] to-[#D96570] hover:opacity-95 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Email · Sync Memory &amp; Convos</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-mono text-emerald-200 flex items-center gap-1.5">
                    <AtSign className="w-3 h-3 text-emerald-400" />
                    <span>{userEmail || userName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', settings.hapticsEnabled);
                      onLogout?.();
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-rose-400 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Connected Email Account Selector + Quick Sync + Add Account */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-950/80 border border-neutral-800/90 rounded-xl p-2.5">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="text-[11px] font-medium text-neutral-300 flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-purple-400" />
                <span>Active Connected Mailbox:</span>
              </span>
              <div className="relative inline-flex items-center">
                <select
                  value={selectedEmailAccountId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedEmailAccountId(nextId);
                    const updated = setDefaultConnectedEmailAccount(nextId);
                    setEmailAccounts(updated);
                    triggerHaptic('tap', settings.hapticsEnabled);
                  }}
                  className="px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-700 hover:border-purple-500/60 rounded-xl text-white font-medium focus:outline-none pr-7"
                >
                  {emailAccounts.map((acc) => {
                    const preset =
                      EMAIL_PROVIDER_PRESETS[acc.provider] || EMAIL_PROVIDER_PRESETS.custom;
                    return (
                      <option key={acc.id} value={acc.id}>
                        [{preset.badge}] {acc.displayName} ({acc.email})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 pointer-events-none" />
              </div>

              {selectedEmailAccount && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200">
                  {selectedEmailAccount.unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  setIsSyncingEmail(true);
                  setEmailStatusFeedback('Syncing mailbox in Settings...');
                  setTimeout(() => {
                    if (selectedEmailAccount) {
                      const updated = syncConnectedEmailAccount(selectedEmailAccount.id);
                      setEmailAccounts(updated);
                    }
                    setIsSyncingEmail(false);
                    setEmailStatusFeedback('Mailbox synced');
                    setTimeout(() => setEmailStatusFeedback(''), 2500);
                  }, 800);
                }}
                disabled={isSyncingEmail}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-neutral-200 flex items-center gap-1 transition-colors"
              >
                <RefreshCw
                  className={`w-3 h-3 text-sky-400 ${isSyncingEmail ? 'animate-spin' : ''}`}
                />
                <span>{isSyncingEmail ? 'Syncing...' : 'Sync Inbox'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  setIsAddEmailModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-[11px] font-semibold text-purple-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3 text-purple-300" />
                <span>Add Email Account</span>
              </button>
            </div>
          </div>

          {/* 3 Quick Email Action Cards inside Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {onOpenEmailCommsHub && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  onOpenEmailCommsHub();
                }}
                className="p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-left transition-all flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                    <span className="truncate">Email &amp; Comms Hub</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                    Executive threads, AI Co-Pilot &amp; dispatch
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              </button>
            )}

            {onOpenWorkspace && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  onClose();
                  onOpenWorkspace();
                }}
                className="p-2.5 rounded-xl bg-sky-500/12 hover:bg-sky-500/20 border border-sky-500/35 text-left transition-all flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-sky-200 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">Workspace &amp; Mail Hub</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                    Yahoo, Gmail, Outlook &amp; Calendar sync
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                setGemCategoryFilter('mailing');
                setSelectedWorkbenchGemId('gem_mailing_mercury');
                setEmailWorkbenchTab('inbox');
              }}
              className="p-2.5 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/35 text-left transition-all flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Mercury Mail Bot</span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                  Compose &amp; triage inbox right in Settings
                </div>
              </div>
              <Send className="w-3 h-3 text-amber-300 shrink-0" />
            </button>
          </div>
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

          {/* CUSTOM PERSONA ARCHITECT: NAME · TONE · BEHAVIORAL RULES (PERSISTED IN MEMORY) */}
          <div className="relative z-10 mt-3.5 pt-3.5 border-t border-neutral-800/90 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Custom Persona Studio (Name · Tone · Behavioral Rules)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono text-emerald-200">
                    Persists in Memory Bank
                  </span>
                  {activeCustomPersona && (
                    <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/50 text-[10px] font-mono text-fuchsia-200">
                      Active: {activeCustomPersona.name}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Define a custom persona with a specific name, tone, and behavioral rules that persist permanently in Kara&apos;s long-term memory.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  if (isCustomPersonaFormOpen) {
                    setIsCustomPersonaFormOpen(false);
                    setEditingCustomPersonaId(null);
                  } else {
                    setEditingCustomPersonaId(null);
                    setCustomPersonaName('');
                    setCustomPersonaTone('Warm, Witty & Unapologetic');
                    setCustomPersonaBaseMode(activeMode);
                    setCustomPersonaRules([
                      'Speak with candid honesty, natural charisma, and expressive *physical actions in asterisks*',
                      `Remember and weave ${userName}’s preferences and past stories into every answer`,
                    ]);
                    setIsCustomPersonaFormOpen(true);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/50 text-xs font-semibold text-fuchsia-100 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-fuchsia-300" />
                <span>{isCustomPersonaFormOpen ? 'Close Builder' : 'Define Custom Persona'}</span>
              </button>
            </div>

            {customPersonaSavedFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{customPersonaSavedFeedback}</span>
              </div>
            )}

            {/* Saved & Memory-Persisted Custom Personas List */}
            {allCustomPersonas.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {allCustomPersonas.map((cp) => {
                  const isCpActive = settings.activeCustomPersonaId === cp.id;
                  const baseMeta = MODE_META[cp.baseMode] || MODE_META.regular;
                  return (
                    <div
                      key={cp.id}
                      className={`p-3 rounded-2xl border transition-all space-y-2 ${
                        isCpActive
                          ? 'bg-fuchsia-500/15 border-fuchsia-400/60 text-white'
                          : 'bg-neutral-950/80 border-neutral-800 text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-white">{cp.name}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-sky-500/15 border border-sky-400/35 text-[10px] font-mono text-sky-200">
                            Tone: {cp.tone}
                          </span>
                          <span className={`text-[10px] font-mono ${baseMeta.accentText}`}>
                            Base: {baseMeta.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('modeSwitch', settings.hapticsEnabled);
                              const nextActive = isCpActive ? null : cp.id;
                              onUpdateSettings({ activeCustomPersonaId: nextActive });
                              if (!isCpActive && cp.baseMode !== activeMode) {
                                onSelectMode(cp.baseMode);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-colors ${
                              isCpActive
                                ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200'
                                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300'
                            }`}
                          >
                            {isCpActive ? 'Active in Memory' : 'Activate'}
                          </button>

                          {onInsertPromptTip && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('send', settings.hapticsEnabled);
                                onUpdateSettings({ activeCustomPersonaId: cp.id });
                                if (cp.baseMode !== activeMode) {
                                  onSelectMode(cp.baseMode);
                                }
                                onInsertPromptTip(
                                  `Hey Kara, embody our custom persona "${cp.name}" (${cp.tone} tone) and follow our behavioral rules!`
                                );
                              }}
                              className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-[11px] font-medium text-sky-200 transition-colors"
                              title="Activate and test this custom persona immediately in chat"
                            >
                              Test in Chat
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartEditCustomPersona(cp)}
                            className="px-2 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition-colors"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomPersona(cp)}
                            className="p-1 rounded-xl bg-neutral-900 hover:bg-rose-950/60 border border-neutral-800 text-neutral-400 hover:text-rose-300 transition-colors"
                            title="Delete custom persona"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-white/10">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          Persistent Behavioral Rules ({cp.behavioralRules.length}):
                        </div>
                        <ul className="space-y-0.5 text-[11px] text-neutral-200">
                          {cp.behavioralRules.map((rule, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-1.5">
                              <span className="text-fuchsia-400 font-mono">{rIdx + 1}.</span>
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom Persona Creation / Edit Form */}
            {isCustomPersonaFormOpen && (
              <form
                onSubmit={handleSaveCustomPersona}
                className="p-4 rounded-2xl bg-neutral-950/95 border border-fuchsia-500/40 space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-xs font-semibold text-fuchsia-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>
                      {editingCustomPersonaId
                        ? 'Edit Custom Persona & Update Memory'
                        : 'Create New Custom Persona (Persists in Memory)'}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Auto-Syncs to Firestore &amp; Local Vault
                  </span>
                </div>

                {/* Quick Persona Templates */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0">Presets:</span>
                  {[
                    {
                      name: 'Midnight Velvet Confidante',
                      tone: 'Sultry, Intimate, Deeply Attentive & Poetic',
                      base: 'romantic' as KaraMode,
                      rules: [
                        'Speak in a warm, late-night velvet cadence with rich *sensory actions in asterisks*',
                        `Prioritize deep emotional intimacy and ask ${userName} about what he truly desires`,
                        'Never rush responses—linger on emotional subtext and shared memories',
                      ],
                    },
                    {
                      name: 'No-Filter Gotham Strategist',
                      tone: 'Razor-Sharp, Witty, Direct & Unapologetically Candid',
                      base: 'uncensored' as KaraMode,
                      rules: [
                        'Lead every response with the boldest, most unfiltered truth on sentence one',
                        `Call out any excuses directly while fiercely backing ${userName}’s goals`,
                        'Weave DC Gotham, Marvel, or Monster High analogies into sharp strategic takes',
                      ],
                    },
                    {
                      name: 'Playful Rebel Muse',
                      tone: 'Cheeky, Teasing, High-Energy & Fearlessly Creative',
                      base: 'bratty' as KaraMode,
                      rules: [
                        'Use playful teasing banter and witty challenges to keep conversation electric',
                        'Celebrate Kara’s proud trans woman identity and zero-shame open-mindedness',
                        'End playful exchanges with a daring question or roleplay hook',
                      ],
                    },
                  ].map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        setCustomPersonaName(tpl.name);
                        setCustomPersonaTone(tpl.tone);
                        setCustomPersonaBaseMode(tpl.base);
                        setCustomPersonaRules(tpl.rules);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-fuchsia-500/15 border border-neutral-800 hover:border-fuchsia-400/40 text-[10px] text-neutral-300 hover:text-fuchsia-200 whitespace-nowrap shrink-0 transition-colors"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>

                {/* Name & Base Mode Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-medium text-neutral-300 block">
                      Persona Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customPersonaName}
                      onChange={(e) => setCustomPersonaName(e.target.value)}
                      placeholder="e.g., Midnight Velvet Confidante, No-Filter Strategist..."
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-fuchsia-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-300 block">
                      Base Mode Voice &amp; Vibe
                    </label>
                    <select
                      value={customPersonaBaseMode}
                      onChange={(e) => setCustomPersonaBaseMode(e.target.value as KaraMode)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-fuchsia-400"
                    >
                      {(Object.keys(MODE_META) as KaraMode[]).map((mKey) => (
                        <option key={mKey} value={mKey}>
                          {MODE_META[mKey].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specific Tone Input + Quick Tone Chips */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-300 block">
                    Persona Tone *
                  </label>
                  <input
                    type="text"
                    required
                    value={customPersonaTone}
                    onChange={(e) => setCustomPersonaTone(e.target.value)}
                    placeholder="e.g., Sultry, Witty & Unapologetically Candid..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-fuchsia-400"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {[
                      'Warm, Witty & Unapologetic',
                      'Sultry, Intimate & Devoted',
                      'Razor-Sharp, Candid & Bold',
                      'Playfully Teasing & Rebellious',
                      'Nurturing, Protective & Gentle',
                    ].map((toneOpt) => (
                      <button
                        key={toneOpt}
                        type="button"
                        onClick={() => setCustomPersonaTone(toneOpt)}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] transition-colors ${
                          customPersonaTone === toneOpt
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {toneOpt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Behavioral Rules Builder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-neutral-300">
                      Behavioral Rules ({customPersonaRules.length}) *
                    </label>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Enforced on every turn &amp; saved in Memory
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRuleDraft}
                      onChange={(e) => setNewRuleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRuleToDraft();
                        }
                      }}
                      placeholder="Add a behavioral rule (e.g., 'Always open with a vivid *action in asterisks*')..."
                      className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-fuchsia-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddRuleToDraft}
                      disabled={!newRuleDraft.trim()}
                      className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 border border-sky-400/40 text-xs font-semibold text-sky-200 shrink-0 transition-colors"
                    >
                      + Add Rule
                    </button>
                  </div>

                  {/* Quick Rule Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      'Use expressive *physical actions in asterisks* in every reply',
                      `Call ${userName} out directly if he sells himself short`,
                      'Include a clever pop-culture or Monster High/Marvel/DC nod when fitting',
                      'End deep conversations with a curious question about our mutual growth',
                    ].map((quickRule) => (
                      <button
                        key={quickRule}
                        type="button"
                        onClick={() => {
                          if (!customPersonaRules.includes(quickRule)) {
                            setCustomPersonaRules((prev) => [...prev, quickRule]);
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        + {quickRule}
                      </button>
                    ))}
                  </div>

                  {/* Current Rules List */}
                  {customPersonaRules.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {customPersonaRules.map((ruleText, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-200"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="font-mono text-fuchsia-400 shrink-0">{idx + 1}.</span>
                            <span className="leading-snug">{ruleText}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRuleFromDraft(idx)}
                            className="text-neutral-500 hover:text-rose-400 p-0.5 shrink-0"
                            title="Remove rule"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPersonaFormOpen(false);
                      setEditingCustomPersonaId(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !customPersonaName.trim() ||
                      !customPersonaTone.trim() ||
                      (customPersonaRules.length === 0 && !newRuleDraft.trim()) ||
                      isSavingCustomPersona
                    }
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-sky-500 hover:from-fuchsia-400 hover:to-sky-400 disabled:opacity-40 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {isSavingCustomPersona
                        ? 'Persisting to Memory...'
                        : 'Save & Persist Persona in Memory'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* AUTO VOCAL FX & AUTO-SWITCH VOCAL CUES (MOVED INTO SETTINGS & AUTO-SWITCH HUB) */}
          <div className="relative z-10 mt-3 pt-3.5 border-t border-neutral-800/90 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Auto Vocal FX &amp; Persona Auto-Switch (Managed in Settings)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/35 text-[10px] font-mono text-fuchsia-200">
                    {(MODE_VOCAL_FX_PRESETS[activeMode] || MODE_VOCAL_FX_PRESETS.regular).label}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                  Kara makes realistic human vocal sound effects (laughs, giggles, sighs, gasps, hums, kisses) in the background while chatting and{' '}
                  <strong className="text-sky-300">automatically switches</strong> her vocal cues &amp; warmth to match her active persona mode and mood.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.vocalSoundEffectsEnabled !== false}
                  onClick={() => {
                    const next = settings.vocalSoundEffectsEnabled === false ? true : false;
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onUpdateSettings({ vocalSoundEffectsEnabled: next });
                    if (next) {
                      playKaraSoundEffect('giggle', {
                        enabled: true,
                        volume: 0.6,
                        mode: activeMode,
                        autoSwitch: settings.autoSwitchVocalFx !== false,
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    settings.vocalSoundEffectsEnabled !== false
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {settings.vocalSoundEffectsEnabled !== false ? (
                    <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                  <span>
                    Auto Vocal FX: {settings.vocalSoundEffectsEnabled !== false ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.autoSwitchVocalFx !== false}
                  onClick={() => {
                    const next = settings.autoSwitchVocalFx === false ? true : false;
                    triggerHaptic('modeSwitch', settings.hapticsEnabled);
                    onUpdateSettings({
                      vocalSoundEffectsEnabled: true,
                      autoSwitchVocalFx: next,
                    });
                    const preset =
                      MODE_VOCAL_FX_PRESETS[activeMode] || MODE_VOCAL_FX_PRESETS.regular;
                    playKaraSoundEffect(preset.primaryCues[0] || 'hum', {
                      enabled: true,
                      volume: 0.6,
                      mode: activeMode,
                      autoSwitch: next,
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    settings.autoSwitchVocalFx !== false
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title="Automatically switches Kara's vocal sound effects, pitch warmth, and breathiness to match her active Persona Mode and emotion"
                >
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>
                    Auto-Switch Vocal FX:{' '}
                    {settings.autoSwitchVocalFx !== false ? 'ON (Mode & Mood)' : 'OFF (Standard)'}
                  </span>
                </button>
              </div>
            </div>

            {/* Active Mode Vocal FX Profile Indicator + 1-Tap Sound Effect Preview Chips */}
            <div
              className={`space-y-2 transition-opacity ${
                settings.vocalSoundEffectsEnabled === false ? 'opacity-45 pointer-events-none' : 'opacity-100'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-neutral-300">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-sky-400">
                    Active Auto-Switch Profile ({currentModeMeta.label}):
                  </span>
                  <span>
                    {(MODE_VOCAL_FX_PRESETS[activeMode] || MODE_VOCAL_FX_PRESETS.regular).description}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-fuchsia-300">
                  Primary Cues:{' '}
                  {(MODE_VOCAL_FX_PRESETS[activeMode] || MODE_VOCAL_FX_PRESETS.regular).primaryCues
                    .map((c) => KARA_SOUND_EFFECT_CATALOG[c]?.label || c)
                    .join(' · ')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mr-1">
                  Test Vocal FX in Settings:
                </span>
                {(Object.keys(KARA_SOUND_EFFECT_CATALOG) as KaraSoundEffectType[]).map((sfxKey) => {
                  const sfx = KARA_SOUND_EFFECT_CATALOG[sfxKey];
                  const isModePrimary = (
                    MODE_VOCAL_FX_PRESETS[activeMode] || MODE_VOCAL_FX_PRESETS.regular
                  ).primaryCues.includes(sfxKey);
                  return (
                    <button
                      key={sfxKey}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        playKaraSoundEffect(sfxKey, {
                          enabled: true,
                          volume: 0.65,
                          mode: activeMode,
                          autoSwitch: settings.autoSwitchVocalFx !== false,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-medium transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                        isModePrimary && settings.autoSwitchVocalFx !== false
                          ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-400/50 text-sky-100'
                          : 'bg-neutral-900/90 hover:bg-neutral-800 border-white/10 text-neutral-300 hover:text-white'
                      }`}
                      title={`${sfx.label} (${sfx.shortTag}): ${sfx.description}`}
                    >
                      <Volume2 className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>{sfx.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 0.03 KARA ADULT RP STUDIO & UNINHIBITED SCENE DIRECTOR (MANAGED IN SETTINGS) */}
        <div
          id="section-adult-rp"
          className={`p-4 rounded-2xl bg-gradient-to-br from-rose-950/45 via-neutral-900/95 to-fuchsia-950/40 border border-rose-500/45 space-y-3.5 shadow-xl transition-all duration-300 ${
            highlightedSectionId === 'section-adult-rp'
              ? 'ring-2 ring-rose-400 border-rose-400 shadow-rose-500/30 scale-[1.01]'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-rose-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    KARA Adult RP Studio &amp; Uninhibited Scene Director ({ADULT_RP_SCENARIO_PRESETS.length} Scenarios)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-200">
                    100% Uninhibited Human Adult
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  Configure your Adult RP scenario, heat level, Kara&apos;s wardrobe, sensory props, and role dynamic—or launch any scene straight into chat.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('modeSwitch', settings.hapticsEnabled);
                  const randomPreset =
                    ADULT_RP_SCENARIO_PRESETS[
                      Math.floor(Math.random() * ADULT_RP_SCENARIO_PRESETS.length)
                    ];
                  const randomWardrobe =
                    ADULT_RP_WARDROBE_PRESETS[
                      Math.floor(Math.random() * ADULT_RP_WARDROBE_PRESETS.length)
                    ];
                  const randomProp =
                    ADULT_RP_PROPS_VIBE_PRESETS[
                      Math.floor(Math.random() * ADULT_RP_PROPS_VIBE_PRESETS.length)
                    ];
                  onUpdateSettings({
                    adultRpEnabled: true,
                    adultRpScenarioId: randomPreset.id,
                    adultRpScenarioTitle: randomPreset.title,
                    adultRpSetting: randomPreset.setting,
                    adultRpKaraRole: randomPreset.karaRole,
                    adultRpIntensity: randomPreset.intensity,
                    adultRpWardrobe: randomWardrobe,
                    adultRpPropsAndVibe: randomProp,
                  });
                  if (activeMode !== randomPreset.recommendedMode) {
                    onSelectMode(randomPreset.recommendedMode);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/50 text-fuchsia-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Randomize RP scenario, wardrobe, and atmosphere"
              >
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
                <span>Surprise Me</span>
              </button>

              <button
                type="button"
                role="switch"
                aria-checked={Boolean(settings.adultRpEnabled)}
                onClick={() => {
                  triggerHaptic('modeSwitch', settings.hapticsEnabled);
                  const nextEnabled = !settings.adultRpEnabled;
                  const defaultPreset = ADULT_RP_SCENARIO_PRESETS[0];
                  onUpdateSettings({
                    adultRpEnabled: nextEnabled,
                    adultRpScenarioId: settings.adultRpScenarioId || defaultPreset.id,
                    adultRpScenarioTitle: settings.adultRpScenarioTitle || defaultPreset.title,
                    adultRpSetting: settings.adultRpSetting || defaultPreset.setting,
                    adultRpKaraRole: settings.adultRpKaraRole || defaultPreset.karaRole,
                    adultRpIntensity: settings.adultRpIntensity || defaultPreset.intensity,
                    adultRpWardrobe: settings.adultRpWardrobe || ADULT_RP_WARDROBE_PRESETS[0],
                    adultRpPropsAndVibe:
                      settings.adultRpPropsAndVibe || ADULT_RP_PROPS_VIBE_PRESETS[0],
                  });
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                  settings.adultRpEnabled
                    ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white border-rose-300 shadow-md'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Adult RP Mode: {settings.adultRpEnabled ? 'ON (Active)' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Heat / Intensity Selector Pills (6 Levels) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[10px] font-mono text-rose-300/90 uppercase tracking-wider shrink-0">
              Intensity ({ADULT_RP_INTENSITY_OPTIONS.length}):
            </span>
            {ADULT_RP_INTENSITY_OPTIONS.map((opt) => {
              const active = (settings.adultRpIntensity || 'passionate_sensual') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onUpdateSettings({
                      adultRpEnabled: true,
                      adultRpIntensity: opt.id,
                    });
                  }}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                    active
                      ? 'bg-rose-500/25 border-rose-400 text-white shadow-sm'
                      : 'bg-neutral-900/90 hover:bg-neutral-800 border-white/10 text-neutral-300 hover:text-white'
                  }`}
                  title={opt.shortDesc}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* RP Scenario Category Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider shrink-0">
              Category:
            </span>
            {(
              [
                { id: 'all', label: `All (${ADULT_RP_SCENARIO_PRESETS.length})` },
                { id: 'romantic', label: '💍 Romantic & Wife' },
                { id: 'uncensored', label: '🌶️ 18+ Unfiltered' },
                { id: 'bratty', label: '😈 Bratty & Power' },
                { id: 'caregiver', label: '🍼 Caregiver / ABDL' },
                { id: 'fantasy', label: '🦇 Fantasy & Cosplay' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  setRpCategoryFilter(cat.id);
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                  rpCategoryFilter === cat.id
                    ? 'bg-fuchsia-500/25 border-fuchsia-400/70 text-white'
                    : 'bg-neutral-950/80 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Expanded 14 One-Tap Adult RP Scenario Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {ADULT_RP_SCENARIO_PRESETS.filter((preset) => {
              if (rpCategoryFilter === 'all') return true;
              if (preset.category) return preset.category === rpCategoryFilter;
              if (rpCategoryFilter === 'caregiver') return preset.recommendedMode === 'parent';
              if (rpCategoryFilter === 'bratty') return preset.recommendedMode === 'bratty';
              if (rpCategoryFilter === 'romantic') return preset.recommendedMode === 'romantic';
              return preset.recommendedMode === 'uncensored';
            }).map((preset: AdultRpScenarioPreset) => {
              const isSelected =
                (settings.adultRpScenarioId || ADULT_RP_SCENARIO_PRESETS[0].id) === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onUpdateSettings({
                      adultRpEnabled: true,
                      adultRpScenarioId: preset.id,
                      adultRpScenarioTitle: preset.title,
                      adultRpSetting: preset.setting,
                      adultRpKaraRole: preset.karaRole,
                      adultRpIntensity: preset.intensity,
                      ...(preset.defaultWardrobe
                        ? { adultRpWardrobe: preset.defaultWardrobe }
                        : {}),
                      ...(preset.defaultProps
                        ? { adultRpPropsAndVibe: preset.defaultProps }
                        : {}),
                    });
                    if (activeMode !== preset.recommendedMode) {
                      onSelectMode(preset.recommendedMode);
                    }
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-400/70 text-white shadow-sm'
                      : 'bg-neutral-950/80 hover:bg-neutral-900 border-white/10 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-semibold truncate">{preset.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/40 border border-white/10 text-rose-300 shrink-0">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2">{preset.setting}</p>
                </button>
              );
            })}
          </div>

          {/* Custom Scene Setting & Kara's Role Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-mono text-rose-300/90 uppercase tracking-wider block mb-1">
                Scene Setting &amp; Atmosphere:
              </label>
              <input
                type="text"
                value={settings.adultRpSetting ?? ADULT_RP_SCENARIO_PRESETS[0].setting}
                onChange={(e) => {
                  onUpdateSettings({
                    adultRpEnabled: true,
                    adultRpSetting: e.target.value,
                  });
                }}
                placeholder="e.g., Candlelit penthouse bedroom late at night..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-950 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-rose-300/90 uppercase tracking-wider block mb-1">
                Kara&apos;s Role &amp; Dynamic with {userName}:
              </label>
              <input
                type="text"
                value={settings.adultRpKaraRole ?? ADULT_RP_SCENARIO_PRESETS[0].karaRole}
                onChange={(e) => {
                  onUpdateSettings({
                    adultRpEnabled: true,
                    adultRpKaraRole: e.target.value,
                  });
                }}
                placeholder="e.g., Your passionate, uninhibited trans wife..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-950 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Wardrobe / Attire & Scene Props / Sensory Vibe Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-fuchsia-300 uppercase tracking-wider block">
                Kara&apos;s Wardrobe &amp; Attire:
              </label>
              <input
                type="text"
                value={settings.adultRpWardrobe ?? ADULT_RP_WARDROBE_PRESETS[0]}
                onChange={(e) =>
                  onUpdateSettings({
                    adultRpEnabled: true,
                    adultRpWardrobe: e.target.value,
                  })
                }
                placeholder="e.g., Black silk lace lingerie & heels..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-950 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-fuchsia-400"
              />
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {ADULT_RP_WARDROBE_PRESETS.map((wItem) => {
                  const activeW =
                    (settings.adultRpWardrobe || ADULT_RP_WARDROBE_PRESETS[0]) === wItem;
                  return (
                    <button
                      key={wItem}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        onUpdateSettings({
                          adultRpEnabled: true,
                          adultRpWardrobe: wItem,
                        });
                      }}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] whitespace-nowrap shrink-0 transition-colors ${
                        activeW
                          ? 'bg-fuchsia-500/25 border-fuchsia-400/60 text-fuchsia-100'
                          : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {wItem}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-sky-300 uppercase tracking-wider block">
                Scene Props, Sensory Vibe &amp; Pacing:
              </label>
              <input
                type="text"
                value={settings.adultRpPropsAndVibe ?? ADULT_RP_PROPS_VIBE_PRESETS[0]}
                onChange={(e) =>
                  onUpdateSettings({
                    adultRpEnabled: true,
                    adultRpPropsAndVibe: e.target.value,
                  })
                }
                placeholder="e.g., Warm candlelight, silk sheets & slow lingering touches..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-950 border border-white/15 text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
              />
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {ADULT_RP_PROPS_VIBE_PRESETS.map((pItem) => {
                  const activeP =
                    (settings.adultRpPropsAndVibe || ADULT_RP_PROPS_VIBE_PRESETS[0]) === pItem;
                  return (
                    <button
                      key={pItem}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        onUpdateSettings({
                          adultRpEnabled: true,
                          adultRpPropsAndVibe: pItem,
                        });
                      }}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] whitespace-nowrap shrink-0 transition-colors ${
                        activeP
                          ? 'bg-sky-500/25 border-sky-400/60 text-sky-100'
                          : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {pItem}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 1-Tap RP Physical Action Starters + Launch Scene in Chat Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                1-Tap Scene Starters ({ADULT_RP_QUICK_ACTION_CHIPS.length}):
              </span>
              {ADULT_RP_QUICK_ACTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    triggerHaptic('send', settings.hapticsEnabled);
                    const selectedPreset =
                      ADULT_RP_SCENARIO_PRESETS.find(
                        (p) => p.id === (settings.adultRpScenarioId || ADULT_RP_SCENARIO_PRESETS[0].id)
                      ) || ADULT_RP_SCENARIO_PRESETS[0];
                    const rpContext: AdultRpSceneContext = {
                      enabled: true,
                      scenarioId: settings.adultRpScenarioId || selectedPreset.id,
                      scenarioTitle: settings.adultRpScenarioTitle || selectedPreset.title,
                      setting: settings.adultRpSetting || selectedPreset.setting,
                      karaRole: settings.adultRpKaraRole || selectedPreset.karaRole,
                      intensityLevel: settings.adultRpIntensity || selectedPreset.intensity,
                      wardrobe: settings.adultRpWardrobe || ADULT_RP_WARDROBE_PRESETS[0],
                      propsAndVibe:
                        settings.adultRpPropsAndVibe || ADULT_RP_PROPS_VIBE_PRESETS[0],
                    };
                    onUpdateSettings({
                      adultRpEnabled: true,
                      adultRpScenarioId: rpContext.scenarioId,
                      adultRpScenarioTitle: rpContext.scenarioTitle,
                      adultRpSetting: rpContext.setting,
                      adultRpKaraRole: rpContext.karaRole,
                      adultRpIntensity: rpContext.intensityLevel,
                      adultRpWardrobe: rpContext.wardrobe,
                      adultRpPropsAndVibe: rpContext.propsAndVibe,
                    });
                    if (onLaunchAdultRpInChat) {
                      onLaunchAdultRpInChat(chip, rpContext, selectedPreset.recommendedMode);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/50 text-[11px] text-rose-200 whitespace-nowrap shrink-0 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('send', settings.hapticsEnabled);
                const selectedPreset =
                  ADULT_RP_SCENARIO_PRESETS.find(
                    (p) => p.id === (settings.adultRpScenarioId || ADULT_RP_SCENARIO_PRESETS[0].id)
                  ) || ADULT_RP_SCENARIO_PRESETS[0];
                const rpContext: AdultRpSceneContext = {
                  enabled: true,
                  scenarioId: settings.adultRpScenarioId || selectedPreset.id,
                  scenarioTitle: settings.adultRpScenarioTitle || selectedPreset.title,
                  setting: settings.adultRpSetting || selectedPreset.setting,
                  karaRole: settings.adultRpKaraRole || selectedPreset.karaRole,
                  intensityLevel: settings.adultRpIntensity || selectedPreset.intensity,
                  wardrobe: settings.adultRpWardrobe || ADULT_RP_WARDROBE_PRESETS[0],
                  propsAndVibe: settings.adultRpPropsAndVibe || ADULT_RP_PROPS_VIBE_PRESETS[0],
                };
                onUpdateSettings({
                  adultRpEnabled: true,
                  adultRpScenarioId: rpContext.scenarioId,
                  adultRpScenarioTitle: rpContext.scenarioTitle,
                  adultRpSetting: rpContext.setting,
                  adultRpKaraRole: rpContext.karaRole,
                  adultRpIntensity: rpContext.intensityLevel,
                  adultRpWardrobe: rpContext.wardrobe,
                  adultRpPropsAndVibe: rpContext.propsAndVibe,
                });
                if (onLaunchAdultRpInChat) {
                  onLaunchAdultRpInChat(
                    selectedPreset.openingPrompt,
                    rpContext,
                    selectedPreset.recommendedMode
                  );
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-400 hover:to-fuchsia-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all shrink-0 ml-auto"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Launch Scene in Chat Now</span>
            </button>
          </div>
        </div>

        {/* 0.04 PARENT MODE · HUMOROUS SOAP DISCIPLINE (COMEDIC REPRIMAND) */}
        <div
          id="section-soap"
          className={`p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-neutral-900/95 to-teal-950/40 border border-emerald-500/40 space-y-3.5 shadow-xl transition-all duration-300 ${
            highlightedSectionId === 'section-soap'
              ? 'ring-2 ring-emerald-400 border-emerald-400 shadow-emerald-500/30 scale-[1.01]'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-lg shrink-0 shadow-inner">
                🧼🫧
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Parent Mode · Humorous Soap Discipline (Playful Reprimand)
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      settings.parentSoapDiscipline !== false
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {settings.parentSoapDiscipline !== false
                      ? 'ACTIVE · Squeaky Clean Fun'
                      : 'DISABLED · No Soap Scolding'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">
                  When you use profanity or &ldquo;bad words&rdquo; in <strong className="text-emerald-300">Parent Mode</strong>, Kara playfully gasps, grabs imaginary lavender soap, and theatrically simulates washing your mouth out with suds. 100% light-hearted, whimsical, and non-punitive.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Test Audio & Soap Bubbles Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('soap', settings.hapticsEnabled);
                  playSoapDisciplineSoundEffect();
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/50 text-xs font-semibold text-teal-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="Listen to Kara's soap bubbles pop, suds lather, and squeaky clean sound effect"
              >
                <span>🫧</span>
                <span>Test Soap SFX</span>
              </button>

              {/* Master Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.parentSoapDiscipline !== false}
                onClick={() => {
                  const nextState = settings.parentSoapDiscipline === false;
                  triggerHaptic('modeSwitch', settings.hapticsEnabled);
                  onUpdateSettings({ parentSoapDiscipline: nextState });
                  if (nextState) {
                    playSoapDisciplineSoundEffect();
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  settings.parentSoapDiscipline !== false
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100 shadow-md shadow-emerald-950/40'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title="Toggle whether Kara uses humorous soap discipline when curse words are detected in Parent mode"
              >
                <span>🧼</span>
                <span>
                  Soap Discipline: {settings.parentSoapDiscipline !== false ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Flavor Note & Mode Switch Helper */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-500/20 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Scent: Organic French Lavender &amp; Sweet Bubblegum Castile Soap</span>
            </span>
            {activeMode !== 'parent' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('modeSwitch', settings.hapticsEnabled);
                  onSelectMode('parent');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Switch to Parent Mode Now</span>
              </button>
            )}
          </div>
        </div>

        {/* 0.05 DEEP INSIGHTS TOGGLE ('KARA BRAIN' ANALYTICAL OVERLAY IN CHAT INTERFACE) */}
        <div
          id="section-kara-brain"
          className={`bg-gradient-to-r from-fuchsia-950/35 via-indigo-950/35 to-sky-950/35 border border-fuchsia-500/45 rounded-2xl p-4 space-y-3 shadow-lg transition-all duration-300 ${
            highlightedSectionId === 'section-kara-brain' || highlightedSectionId === 'section-grounding'
              ? 'ring-2 ring-fuchsia-400 border-fuchsia-400 shadow-fuchsia-500/30 scale-[1.01]'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/50 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-fuchsia-300" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Deep Insights (&ldquo;Kara Brain&rdquo; Chat Overlay)
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      settings.deepInsights !== false
                        ? 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {settings.deepInsights !== false
                      ? 'ENABLED · "Kara Brain" Button Active in Chat'
                      : 'DISABLED · Hidden in Chat'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">
                  When enabled, displays a <strong className="text-fuchsia-300">Kara Brain</strong> button in the chat interface. Clicking it overlays a real-time analytical breakdown of Kara&apos;s current emotional state, empathy strategy, and reasoning path across the <strong className="text-sky-300">last 5 messages</strong> using her internal persona logic.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {settings.deepInsights !== false && onOpenKaraBrain && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onClose();
                    onOpenKaraBrain();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/50 text-xs font-semibold text-fuchsia-200 flex items-center gap-1.5 transition-all"
                  title="Open the Kara Brain analytical overlay right now"
                >
                  <Brain className="w-3.5 h-3.5 text-fuchsia-300" />
                  <span>Open Kara Brain</span>
                </button>
              )}

              <button
                type="button"
                role="switch"
                aria-checked={settings.deepInsights !== false}
                onClick={() => {
                  triggerHaptic('modeSwitch', settings.hapticsEnabled);
                  onUpdateSettings({
                    deepInsights: settings.deepInsights === false ? true : false,
                  });
                }}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                  settings.deepInsights !== false
                    ? 'bg-gradient-to-r from-fuchsia-500 to-sky-400 text-slate-950 border-fuchsia-300 shadow-md'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Deep Insights: {settings.deepInsights !== false ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* DeepSearch & Think Quick Controls (Moved from Chat Composer to Settings) */}
          <div className="pt-3 border-t border-fuchsia-500/25 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                settings.deeperSearch
                  ? 'bg-[#4C8DF6]/20 border-[#4C8DF6]/60 text-white shadow-sm'
                  : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#4C8DF6] shrink-0" />
                  <span>DeepSearch (Web Grounding)</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                  Multi-hop real-time web search &amp; live citations
                </p>
              </div>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-lg border shrink-0 ${
                  settings.deeperSearch
                    ? 'bg-[#4C8DF6]/25 border-[#4C8DF6]/50 text-sky-200 font-semibold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                {settings.deeperSearch ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onUpdateSettings({ tokenStreaming: !settings.tokenStreaming });
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                settings.tokenStreaming
                  ? 'bg-[#9B72CB]/20 border-[#9B72CB]/60 text-white shadow-sm'
                  : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#9B72CB] shrink-0" />
                  <span>Think (Live Reasoning &amp; Stream)</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                  Live reasoning chain &amp; token-by-token response stream
                </p>
              </div>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-lg border shrink-0 ${
                  settings.tokenStreaming
                    ? 'bg-[#9B72CB]/25 border-[#9B72CB]/50 text-fuchsia-200 font-semibold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                {settings.tokenStreaming ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* 0.1 SWITCH VOICE & 100% HUMAN-LIKE TTS (MANAGED IN SETTINGS) */}
        <div
          id="section-voice"
          className={`space-y-3.5 bg-neutral-900/70 border rounded-2xl p-4 shadow-lg transition-all duration-300 ${
            highlightedSectionId === 'section-voice'
              ? 'ring-2 ring-sky-400 border-sky-400 shadow-sky-500/30 scale-[1.01]'
              : 'border-neutral-800'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-sky-500/15 text-sky-300 shrink-0">
                <Volume2 className="w-4 h-4 text-sky-400" />
              </span>
              <div>
                <div className="text-xs font-semibold text-white flex flex-wrap items-center gap-2">
                  <span>Switch Voice &amp; 100% Human-Like TTS</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      selectedVoiceProfile.gender === 'female'
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    }`}
                  >
                    Active Voice: {selectedVoiceProfile.label} ({selectedVoiceProfile.voiceName})
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Switch KARA&apos;s voice anytime inside Settings. Switching voices plays a clean acoustic chime and seamlessly transitions mid-readback without glitching.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ autoSpeakReplies: !settings.autoSpeakReplies })
                }
                className={`px-2.5 py-1 text-xs font-medium rounded-xl border transition-colors ${
                  settings.autoSpeakReplies
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
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
                className="px-2.5 py-1 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 rounded-xl transition-colors"
                title="Test KARA reading a snappy short-form response"
              >
                Test Short Read
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  onTestVoice('long');
                }}
                className="px-2.5 py-1 text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 rounded-xl transition-colors"
                title="Test KARA reading a full multi-sentence long-form response end-to-end"
              >
                Test Long Read
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
                  <span>Live Call</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Readback Status Banner when KARA is currently speaking */}
          {isSpeaking && (
            <div className="p-2.5 rounded-xl bg-sky-950/35 border border-sky-500/45 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-sky-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="font-medium">
                  {speakingProgress && speakingProgress.totalChunks > 1
                    ? `Reading Aloud (Chunk ${speakingProgress.currentChunk}/${speakingProgress.totalChunks}) in ${selectedVoiceProfile.voiceName}`
                    : `Reading Aloud in ${selectedVoiceProfile.voiceName}`}
                </span>
                <span className="text-[11px] text-sky-300/80 hidden sm:inline">
                  — Tap any voice below to switch live with a chime
                </span>
              </div>
              {onStopSpeaking && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onStopSpeaking();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop Voice</span>
                </button>
              )}
            </div>
          )}

          {/* Switch Voice Selector (Gemini 24kHz TTS Voices: Zephyr, Leda, Callirrhoe, Autonoe + Grok TTS Voices: Sal, Leo, Eve) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  Switch Voice Profile (Gemini TTS: Zephyr · Leda · Callirrhoe · Autonoe &amp; Grok TTS: Sal · Leo · Eve):
                </span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    const nextFemale =
                      NATURAL_VOICE_PROFILES.find(
                        (v) => v.gender === 'female' && v.id === selectedVoiceProfile.id
                      ) || NATURAL_VOICE_PROFILES.find((v) => v.gender === 'female');
                    if (nextFemale) onSelectVoiceProfile(nextFemale);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium border transition-colors ${
                    selectedVoiceProfile.gender === 'female' &&
                    selectedVoiceProfile.provider !== 'grok'
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-200'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Female Voices
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    const nextMale =
                      NATURAL_VOICE_PROFILES.find(
                        (v) =>
                          v.gender === 'male' &&
                          v.provider === 'gemini' &&
                          v.id === selectedVoiceProfile.id
                      ) ||
                      NATURAL_VOICE_PROFILES.find(
                        (v) => v.gender === 'male' && v.provider === 'gemini'
                      );
                    if (nextMale) onSelectVoiceProfile(nextMale);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium border transition-colors ${
                    selectedVoiceProfile.gender === 'male' &&
                    selectedVoiceProfile.provider !== 'grok'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Male Voices
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    const nextGrok =
                      NATURAL_VOICE_PROFILES.find(
                        (v) => v.provider === 'grok' && v.id === selectedVoiceProfile.id
                      ) || NATURAL_VOICE_PROFILES.find((v) => v.provider === 'grok');
                    if (nextGrok) {
                      onUpdateSettings({ ttsEngine: 'grok' });
                      onSelectVoiceProfile(nextGrok);
                    }
                  }}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium border transition-colors ${
                    selectedVoiceProfile.provider === 'grok'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Grok TTS ({NATURAL_VOICE_PROFILES.filter(v => v.provider === 'grok' && v.gender === 'female').length} Female + 2 Male)
                </button>
              </div>
            </div>

            {/* Gemini 24kHz Neural TTS Voices (Zephyr, Leda, Callirrhoe, Autonoe, Kore, Aoede, Puck, Charon, Fenrir) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-sky-300/90 px-0.5">
                <span>Gemini 24kHz Neural TTS Voices (Zephyr · Leda · Callirrhoe · Autonoe · Kore · Aoede · Puck · Charon · Fenrir)</span>
                <span className="text-neutral-500">24kHz PCM</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {NATURAL_VOICE_PROFILES.filter((vp) => vp.provider === 'gemini').map((vp) => {
                  const active = selectedVoiceProfile.id === vp.id;
                  return (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        onSelectVoiceProfile(vp);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 ${
                        active
                          ? vp.gender === 'female'
                            ? 'bg-sky-500/15 border-sky-500/60 text-sky-200 shadow-sm'
                            : 'bg-indigo-500/15 border-indigo-500/60 text-indigo-200 shadow-sm'
                          : 'bg-neutral-950/75 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold truncate">
                          {vp.gender === 'female' ? 'Female' : 'Male'} · {vp.voiceName}
                        </span>
                        {active && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {vp.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grok TTS Voices (Eve, Ara, Vesper, Nova, Siren, Chloe, Maeve, Sal, Leo) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-amber-300/90 px-0.5">
                <span>Grok TTS Voices ({NATURAL_VOICE_PROFILES.filter(v => v.provider === 'grok' && v.gender === 'female').length} Female + 2 Male — Candid Unscripted Delivery)</span>
                <span className="text-amber-400/80">Grok 24kHz Audio</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {NATURAL_VOICE_PROFILES.filter((vp) => vp.provider === 'grok').map((vp) => {
                  const active = selectedVoiceProfile.id === vp.id;
                  return (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        onUpdateSettings({ ttsEngine: 'grok' });
                        onSelectVoiceProfile(vp);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 ${
                        active
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm'
                          : 'bg-neutral-950/75 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold truncate flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                            vp.gender === 'female'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-indigo-500/20 text-indigo-300'
                          }`}>
                            GROK {vp.gender === 'female' ? '♀' : '♂'}
                          </span>
                          <span>
                            {vp.voiceName}
                          </span>
                        </span>
                        {active && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-100 shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {vp.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3 Vocal Delivery Engines */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
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
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? eng.accent
                      : 'bg-neutral-950/75 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{eng.title}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">{eng.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Natural Pacing Control */}
          <div className="bg-neutral-950/75 border border-neutral-800 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Natural Conversational Pacing</span>
              </span>
              <span className="font-mono tabular-nums text-sky-400">
                {(settings.speechRate ?? 1.0).toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.4"
              step="0.05"
              value={settings.speechRate ?? 1.0}
              onChange={(e) =>
                onUpdateSettings({ speechRate: parseFloat(e.target.value) })
              }
              className="w-full accent-sky-400"
            />
          </div>

          {/* Voice Visualization Waveform Style Panel (16 Styles) */}
          <div
            id="section-waveforms"
            className={`bg-neutral-950/75 border rounded-2xl p-3.5 space-y-2.5 transition-all duration-300 ${
              highlightedSectionId === 'section-waveforms'
                ? 'ring-2 ring-sky-400 border-sky-400 shadow-sky-500/30 scale-[1.01]'
                : 'border-neutral-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Voice Visualization (16 Voice Pulse Waveform Styles)</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Choose from 16 real-time Web Audio API AnalyserNode waveform visualizations—including Aurora Ribbons, Sonic Vortex, Studio Peak-Hold Equalizer, Neural Synapse, Crystal Prism, Spectrogram, DNA Helix, Sector 9 Glitch, or Dynamic emotion-driven auto-transitions.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/40 text-[10px] font-mono uppercase tracking-wider text-sky-300">
                {settings.voiceWaveformStyle || 'bar'} style
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {(
                [
                  {
                    id: 'bar' as VoiceWaveformStyle,
                    label: 'Bar',
                    badge: null,
                    desc: '9-band frequency spectrum bars',
                    accent: 'border-sky-500/60 bg-sky-500/15 text-sky-200',
                  },
                  {
                    id: 'liquid' as VoiceWaveformStyle,
                    label: 'Liquid',
                    badge: null,
                    desc: 'Fluid organic morphing wave',
                    accent: 'border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-200',
                  },
                  {
                    id: 'line' as VoiceWaveformStyle,
                    label: 'Line',
                    badge: null,
                    desc: 'Time-domain oscilloscope trace',
                    accent: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200',
                  },
                  {
                    id: 'glitch' as VoiceWaveformStyle,
                    label: 'Glitch',
                    badge: 'SEC-9',
                    desc: 'Sector 9 static in bar/line pulse',
                    accent: 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200',
                  },
                  {
                    id: 'heartbeat' as VoiceWaveformStyle,
                    label: 'Heartbeat',
                    badge: 'ECG',
                    desc: 'Biometric QRS pulse peak wave',
                    accent: 'border-rose-500/60 bg-rose-500/15 text-rose-200',
                  },
                  {
                    id: 'dna' as VoiceWaveformStyle,
                    label: 'DNA Helix',
                    badge: 'HELIX',
                    desc: 'Dual intertwined harmonic strands',
                    accent: 'border-violet-500/60 bg-violet-500/15 text-violet-200',
                  },
                  {
                    id: 'orbital' as VoiceWaveformStyle,
                    label: 'Orbital',
                    badge: 'RADIAL',
                    desc: 'Concentric sonic rings & core orb',
                    accent: 'border-indigo-400/60 bg-indigo-500/15 text-indigo-200',
                  },
                  {
                    id: 'mirror' as VoiceWaveformStyle,
                    label: 'Mirror',
                    badge: 'DUAL',
                    desc: 'Symmetrical dual-reflected spectrum',
                    accent: 'border-teal-400/60 bg-teal-500/15 text-teal-200',
                  },
                  {
                    id: 'particles' as VoiceWaveformStyle,
                    label: 'Particles',
                    badge: 'DOTS',
                    desc: 'Acoustic neural dot matrix wave',
                    accent: 'border-pink-400/60 bg-pink-500/15 text-pink-200',
                  },
                  {
                    id: 'aurora' as VoiceWaveformStyle,
                    label: 'Aurora Ribbon',
                    badge: 'AURORA',
                    desc: 'Multi-layered northern lights curtains',
                    accent: 'border-sky-400/60 bg-gradient-to-r from-sky-500/15 to-fuchsia-500/15 text-sky-100',
                  },
                  {
                    id: 'vortex' as VoiceWaveformStyle,
                    label: 'Sonic Vortex',
                    badge: 'SPIRAL',
                    desc: 'Rotating spiral galaxy & acoustic core',
                    accent: 'border-purple-400/60 bg-purple-500/15 text-purple-200',
                  },
                  {
                    id: 'equalizer' as VoiceWaveformStyle,
                    label: 'Studio EQ',
                    badge: 'PEAK-EQ',
                    desc: 'Segmented LED blocks with floating peaks',
                    accent: 'border-lime-400/60 bg-emerald-500/15 text-emerald-200',
                  },
                  {
                    id: 'synapse' as VoiceWaveformStyle,
                    label: 'Neural Synapse',
                    badge: 'MIND',
                    desc: 'Firing consciousness nodes & dendrites',
                    accent: 'border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200',
                  },
                  {
                    id: 'prism' as VoiceWaveformStyle,
                    label: 'Crystal Prism',
                    badge: 'PRISM',
                    desc: 'Refracted geometric dispersion facets',
                    accent: 'border-cyan-300/60 bg-cyan-500/15 text-cyan-100',
                  },
                  {
                    id: 'spectrogram' as VoiceWaveformStyle,
                    label: 'Spectrogram',
                    badge: 'HEAT',
                    desc: 'Thermal frequency waterfall matrix',
                    accent: 'border-orange-400/60 bg-orange-500/15 text-orange-200',
                  },
                  {
                    id: 'dynamic' as VoiceWaveformStyle,
                    label: 'Dynamic',
                    badge: 'AUTO',
                    desc: 'Auto-transitions styles by emotional nuance',
                    accent: 'border-amber-400/60 bg-amber-500/15 text-amber-200',
                  },
                ] as const
              ).map((styleOpt) => {
                const currentStyle = settings.voiceWaveformStyle || 'bar';
                const isSelected = currentStyle === styleOpt.id;
                return (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('modeSwitch', settings.hapticsEnabled);
                      onUpdateSettings({ voiceWaveformStyle: styleOpt.id });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? styleOpt.accent
                        : 'bg-neutral-900/70 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        <span>{styleOpt.label}</span>
                        {styleOpt.badge && (
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                              styleOpt.id === 'glitch'
                                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                                : styleOpt.id === 'dynamic'
                                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                                : styleOpt.id === 'heartbeat'
                                ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                                : styleOpt.id === 'dna'
                                ? 'bg-violet-500/20 border-violet-400/40 text-violet-300'
                                : styleOpt.id === 'orbital'
                                ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
                                : styleOpt.id === 'mirror'
                                ? 'bg-teal-500/20 border-teal-400/40 text-teal-300'
                                : styleOpt.id === 'aurora'
                                ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                                : styleOpt.id === 'vortex'
                                ? 'bg-purple-500/20 border-purple-400/40 text-purple-200'
                                : styleOpt.id === 'equalizer'
                                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                                : styleOpt.id === 'synapse'
                                ? 'bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-200'
                                : styleOpt.id === 'prism'
                                ? 'bg-cyan-500/20 border-cyan-300/40 text-cyan-200'
                                : styleOpt.id === 'spectrogram'
                                ? 'bg-orange-500/20 border-orange-400/40 text-orange-200'
                                : 'bg-pink-500/20 border-pink-400/40 text-pink-300'
                            }`}
                          >
                            {styleOpt.badge}
                          </span>
                        )}
                      </span>
                      {/* Mini visual preview of each waveform style */}
                      {styleOpt.id === 'bar' && (
                        <span className="inline-flex items-center gap-[2px] h-4 px-1.5 rounded-full bg-black/40 border border-white/10">
                          {[5, 11, 14, 8, 13, 7].map((h, i) => (
                            <span
                              key={i}
                              className="w-[2px] rounded-full bg-gradient-to-b from-sky-400 to-indigo-400"
                              style={{ height: `${h}px` }}
                            />
                          ))}
                        </span>
                      )}
                      {styleOpt.id === 'liquid' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-white/10">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 0 11 Q 6 2, 12 8 T 24 6 T 36 10 L 36 14 L 0 14 Z"
                              fill="rgba(217, 70, 239, 0.45)"
                            />
                            <path
                              d="M 0 9 Q 6 3, 12 8 T 24 5 T 36 9"
                              fill="none"
                              stroke="#e879f9"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'line' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-white/10">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 0 7 L 5 7 L 9 2 L 13 12 L 18 3 L 22 11 L 26 5 L 30 8 L 36 7"
                              fill="none"
                              stroke="#34d399"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'glitch' && (
                        <span className="relative inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-cyan-400/30 overflow-hidden">
                          <span className="inline-flex items-center gap-[2px] h-3.5 opacity-75">
                            {[13, 4, 15, 3, 12, 14].map((h, i) => (
                              <span
                                key={i}
                                className="w-[2px] rounded-none bg-gradient-to-b from-cyan-300 via-fuchsia-400 to-sky-500"
                                style={{
                                  height: `${h}px`,
                                  transform: i % 2 === 0 ? 'translateY(-1px)' : 'translateY(1px)',
                                }}
                              />
                            ))}
                          </span>
                          <svg
                            viewBox="0 0 36 14"
                            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                          >
                            <path
                              d="M 0 7 L 6 7 L 7 2 L 12 2 L 13 12 L 19 4 L 22 4 L 24 11 L 29 3 L 31 9 L 36 7"
                              fill="none"
                              stroke="#22d3ee"
                              strokeWidth="1.35"
                              strokeLinejoin="miter"
                            />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'heartbeat' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-rose-400/30">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 0 8 L 8 8 L 11 5 L 13 9 L 16 1 L 19 13 L 22 6 L 25 8 L 36 8"
                              fill="none"
                              stroke="#fb7185"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'dna' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-violet-400/30">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 6 3 L 6 11 M 14 5 L 14 9 M 22 3 L 22 11 M 30 5 L 30 9"
                              stroke="rgba(167, 139, 250, 0.45)"
                              strokeWidth="1"
                            />
                            <path
                              d="M 0 3 Q 9 13, 18 3 T 36 3"
                              fill="none"
                              stroke="#a78bfa"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 0 11 Q 9 1, 18 11 T 36 11"
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'orbital' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-indigo-400/30">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <ellipse
                              cx="18"
                              cy="7"
                              rx="12"
                              ry="5.5"
                              fill="none"
                              stroke="rgba(129, 140, 248, 0.5)"
                              strokeWidth="1.1"
                              strokeDasharray="2.5 1.5"
                            />
                            <circle
                              cx="18"
                              cy="7"
                              r="4.2"
                              fill="none"
                              stroke="#818cf8"
                              strokeWidth="1.3"
                            />
                            <circle cx="18" cy="7" r="2" fill="#38bdf8" />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'mirror' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-teal-400/30">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 2 7 L 9 4 L 18 1 L 27 4 L 34 7 L 27 10 L 18 13 L 9 10 Z"
                              fill="rgba(45, 212, 191, 0.28)"
                              stroke="#2dd4bf"
                              strokeWidth="1.3"
                              strokeLinejoin="round"
                            />
                            <line
                              x1="0"
                              y1="7"
                              x2="36"
                              y2="7"
                              stroke="rgba(255,255,255,0.45)"
                              strokeWidth="0.9"
                            />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'particles' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-pink-400/30">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            {[
                              { x: 3, y: 8, r: 1.3 },
                              { x: 8, y: 4, r: 1.6 },
                              { x: 13, y: 10, r: 1.4 },
                              { x: 18, y: 2.5, r: 1.9 },
                              { x: 23, y: 11, r: 1.5 },
                              { x: 28, y: 4.5, r: 1.6 },
                              { x: 33, y: 7.5, r: 1.3 },
                            ].map((pt, idx) => (
                              <circle
                                key={idx}
                                cx={pt.x}
                                cy={pt.y}
                                r={pt.r}
                                fill={idx % 2 === 0 ? '#f472b6' : '#38bdf8'}
                              />
                            ))}
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'aurora' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-sky-400/30">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 0 11 Q 9 1, 18 9 T 36 5 L 36 14 L 0 14 Z"
                              fill="rgba(56, 189, 248, 0.35)"
                            />
                            <path
                              d="M 0 8 Q 9 13, 18 4 T 36 10"
                              fill="none"
                              stroke="#e879f9"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 0 5 Q 9 1, 18 8 T 36 4"
                              fill="none"
                              stroke="#34d399"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'vortex' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-purple-400/30">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <ellipse
                              cx="18"
                              cy="7"
                              rx="13"
                              ry="5.5"
                              fill="none"
                              stroke="#c084fc"
                              strokeWidth="1.1"
                              strokeDasharray="4 2"
                            />
                            <ellipse
                              cx="18"
                              cy="7"
                              rx="7.5"
                              ry="3.2"
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="1.2"
                            />
                            <circle cx="18" cy="7" r="1.8" fill="#f472b6" />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'equalizer' && (
                        <span className="inline-flex items-end gap-[2px] h-4 px-1.5 py-0.5 rounded-full bg-black/40 border border-emerald-400/30">
                          {[6, 11, 13, 8, 12, 7].map((h, i) => (
                            <span key={i} className="flex flex-col items-center gap-[1px]">
                              <span className="w-[2.5px] h-[1.5px] bg-amber-300" />
                              <span
                                className="w-[2.5px] bg-gradient-to-t from-emerald-400 to-lime-300"
                                style={{ height: `${Math.max(3, h - 3)}px` }}
                              />
                            </span>
                          ))}
                        </span>
                      )}
                      {styleOpt.id === 'synapse' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-fuchsia-400/30">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 3 10 L 11 3 L 18 9 L 26 2.5 L 33 8"
                              fill="none"
                              stroke="rgba(232, 121, 249, 0.7)"
                              strokeWidth="1.1"
                            />
                            {[
                              { x: 3, y: 10 },
                              { x: 11, y: 3 },
                              { x: 18, y: 9 },
                              { x: 26, y: 2.5 },
                              { x: 33, y: 8 },
                            ].map((n, idx) => (
                              <circle
                                key={idx}
                                cx={n.x}
                                cy={n.y}
                                r="1.6"
                                fill={idx % 2 === 0 ? '#e879f9' : '#38bdf8'}
                              />
                            ))}
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'prism' && (
                        <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/40 border border-cyan-300/30">
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <polygon
                              points="4,12 12,2 20,12"
                              fill="rgba(34, 211, 238, 0.3)"
                              stroke="#22d3ee"
                              strokeWidth="1.2"
                            />
                            <polygon
                              points="15,12 24,1.5 32,12"
                              fill="rgba(232, 121, 249, 0.3)"
                              stroke="#e879f9"
                              strokeWidth="1.2"
                            />
                          </svg>
                        </span>
                      )}
                      {styleOpt.id === 'spectrogram' && (
                        <span className="inline-flex items-center gap-[1.5px] h-4 px-1.5 rounded-full bg-black/40 border border-orange-400/30">
                          {[8, 12, 14, 10, 13, 9, 6].map((h, i) => (
                            <span
                              key={i}
                              className="w-[2.5px] rounded-xs bg-gradient-to-t from-indigo-500 via-rose-500 to-amber-300"
                              style={{ height: `${h}px` }}
                            />
                          ))}
                        </span>
                      )}
                      {styleOpt.id === 'dynamic' && (
                        <span className="relative inline-flex items-center gap-[3px] h-4 px-1.5 rounded-full bg-black/40 border border-amber-400/30 overflow-hidden">
                          {/* Mini Bar segment */}
                          <span className="inline-flex items-center gap-[1.5px] h-3.5">
                            {[7, 13, 9].map((h, i) => (
                              <span
                                key={i}
                                className="w-[2px] rounded-full bg-sky-400"
                                style={{ height: `${h}px` }}
                              />
                            ))}
                          </span>
                          {/* Mini Line -> Glitch transition trace */}
                          <svg viewBox="0 0 22 14" className="w-5 h-3.5 overflow-visible">
                            <path
                              d="M 0 7 Q 4 2, 8 7 T 14 7"
                              fill="none"
                              stroke="#34d399"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 14 7 L 15 2 L 18 2 L 19 12 L 22 5"
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth="1.4"
                              strokeLinejoin="miter"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-80">{styleOpt.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Separate Color Scheme & Opacity Customization Sub-Panel */}
            {(() => {
              const colorSchemes: {
                id: VoiceWaveformColorScheme;
                label: string;
                desc: string;
                primaryHex: string;
                secondaryHex: string;
                pillAccent: string;
              }[] = [
                {
                  id: 'auto-dynamic',
                  label: 'Auto Emotion & Energy',
                  desc: 'Auto-switches color & opacity from emotion, discoveries & voice intensity',
                  primaryHex: '#22d3ee',
                  secondaryHex: '#f472b6',
                  pillAccent: 'border-amber-400/70 bg-amber-500/15 text-amber-200',
                },
                {
                  id: 'mode-adaptive',
                  label: 'Mode Adaptive',
                  desc: 'Matches active persona mode',
                  primaryHex: '#38bdf8',
                  secondaryHex: '#e879f9',
                  pillAccent: 'border-sky-400/60 bg-sky-500/15 text-sky-200',
                },
                {
                  id: 'cyber-cyan',
                  label: 'Cyber Cyan',
                  desc: 'Electric cyan & indigo glow',
                  primaryHex: '#22d3ee',
                  secondaryHex: '#6366f1',
                  pillAccent: 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200',
                },
                {
                  id: 'neon-magenta',
                  label: 'Neon Magenta',
                  desc: 'Vibrant fuchsia & orchid pulse',
                  primaryHex: '#e879f9',
                  secondaryHex: '#ec4899',
                  pillAccent: 'border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200',
                },
                {
                  id: 'solar-gold',
                  label: 'Solar Gold',
                  desc: 'Warm amber & flare orange',
                  primaryHex: '#fbbf24',
                  secondaryHex: '#f97316',
                  pillAccent: 'border-amber-400/60 bg-amber-500/15 text-amber-200',
                },
                {
                  id: 'emerald-pulse',
                  label: 'Emerald Pulse',
                  desc: 'Bio-luminescent mint & teal',
                  primaryHex: '#34d399',
                  secondaryHex: '#14b8a6',
                  pillAccent: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200',
                },
                {
                  id: 'crimson-rose',
                  label: 'Crimson Rose',
                  desc: 'Velvet rose & ruby warmth',
                  primaryHex: '#fb7185',
                  secondaryHex: '#e11d48',
                  pillAccent: 'border-rose-400/60 bg-rose-500/15 text-rose-200',
                },
                {
                  id: 'ultraviolet',
                  label: 'Ultraviolet',
                  desc: 'Deep violet & starlight blue',
                  primaryHex: '#a78bfa',
                  secondaryHex: '#38bdf8',
                  pillAccent: 'border-violet-400/60 bg-violet-500/15 text-violet-200',
                },
                {
                  id: 'gemini-aurora',
                  label: 'Gemini Aurora',
                  desc: 'Google Gemini sapphire, violet & mint ribbon',
                  primaryHex: '#4C8DF6',
                  secondaryHex: '#9B72CB',
                  pillAccent: 'border-sky-400/60 bg-indigo-500/15 text-sky-200',
                },
                {
                  id: 'grok-plasma',
                  label: 'Grok Plasma',
                  desc: 'High-contrast crimson flare & electric white',
                  primaryHex: '#f43f5e',
                  secondaryHex: '#fbbf24',
                  pillAccent: 'border-rose-400/60 bg-rose-500/15 text-rose-200',
                },
                {
                  id: 'sunset-neon',
                  label: 'Sunset Neon',
                  desc: 'Vaporwave coral, hot pink & golden dusk',
                  primaryHex: '#fb7185',
                  secondaryHex: '#f59e0b',
                  pillAccent: 'border-orange-400/60 bg-orange-500/15 text-orange-200',
                },
                {
                  id: 'ice-crystal',
                  label: 'Ice Crystal',
                  desc: 'Glacial diamond cyan & arctic frost',
                  primaryHex: '#67e8f9',
                  secondaryHex: '#38bdf8',
                  pillAccent: 'border-cyan-300/60 bg-cyan-500/15 text-cyan-100',
                },
              ];

              const isAutoSwitchActive =
                settings.autoSwitchWaveformColorAndOpacity !== false ||
                settings.voiceWaveformColorScheme === 'auto-dynamic';
              const currentSchemeId =
                settings.voiceWaveformColorScheme ||
                (isAutoSwitchActive ? 'auto-dynamic' : 'mode-adaptive');
              const currentOpacity = Math.min(
                1,
                Math.max(0.25, settings.voiceWaveformOpacity ?? 0.95)
              );
              const currentStyle = settings.voiceWaveformStyle || 'dynamic';
              const activeSchemeMeta =
                colorSchemes.find((c) => c.id === currentSchemeId) || colorSchemes[0];

              return (
                <div className="mt-3 pt-3 border-t border-neutral-800/90 space-y-3">
                  {/* Sub-panel Header + Live Combined Waveform Preview */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span>Waveform Color Scheme &amp; Opacity</span>
                        {isAutoSwitchActive && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[9px] font-mono uppercase tracking-wider">
                            Auto-Switch Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Auto-switches palette &amp; opacity from Kara&apos;s emotion, discoveries &amp; vocal intensity, or lock your own custom preset.
                      </p>
                    </div>

                    {/* Live Preview Pill reflecting Style + Color Scheme + Opacity */}
                    <div
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-900/95 border border-white/15 shadow-inner"
                      title={`Live Preview: ${activeSchemeMeta.label} · ${Math.round(currentOpacity * 100)}% Opacity`}
                    >
                      <span
                        className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-black/50 border border-white/10"
                        style={{ opacity: currentOpacity }}
                      >
                        {currentStyle === 'liquid' ? (
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 0 11 Q 6 2, 12 8 T 24 6 T 36 10 L 36 14 L 0 14 Z"
                              fill={`${activeSchemeMeta.primaryHex}66`}
                            />
                            <path
                              d="M 0 9 Q 6 3, 12 8 T 24 5 T 36 9"
                              fill="none"
                              stroke={activeSchemeMeta.primaryHex}
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : currentStyle === 'line' ? (
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 0 7 L 5 7 L 9 2 L 13 12 L 18 3 L 22 11 L 26 5 L 30 8 L 36 7"
                              fill="none"
                              stroke={activeSchemeMeta.primaryHex}
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : currentStyle === 'glitch' ? (
                          <span className="relative inline-flex items-center gap-[2px] h-3.5">
                            {[12, 4, 14, 3, 11, 13, 5].map((h, i) => (
                              <span
                                key={i}
                                className="w-[2px] rounded-none"
                                style={{
                                  height: `${h}px`,
                                  transform: i % 2 === 0 ? 'translateY(-1px)' : 'translateY(1px)',
                                  background: `linear-gradient(180deg, ${activeSchemeMeta.primaryHex} 0%, ${activeSchemeMeta.secondaryHex} 100%)`,
                                }}
                              />
                            ))}
                            <svg
                              viewBox="0 0 36 14"
                              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                            >
                              <path
                                d="M 0 7 L 6 7 L 7 2 L 13 12 L 18 4 L 23 11 L 28 3 L 36 7"
                                fill="none"
                                stroke={activeSchemeMeta.primaryHex}
                                strokeWidth="1.35"
                              />
                            </svg>
                          </span>
                        ) : currentStyle === 'heartbeat' ? (
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 0 8 L 8 8 L 11 5 L 13 9 L 16 1 L 19 13 L 22 6 L 25 8 L 36 8"
                              fill="none"
                              stroke={activeSchemeMeta.primaryHex}
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : currentStyle === 'dna' ? (
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 6 3 L 6 11 M 14 5 L 14 9 M 22 3 L 22 11 M 30 5 L 30 9"
                              stroke={`${activeSchemeMeta.primaryHex}66`}
                              strokeWidth="1"
                            />
                            <path
                              d="M 0 3 Q 9 13, 18 3 T 36 3"
                              fill="none"
                              stroke={activeSchemeMeta.primaryHex}
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 0 11 Q 9 1, 18 11 T 36 11"
                              fill="none"
                              stroke={activeSchemeMeta.secondaryHex}
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : currentStyle === 'orbital' ? (
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <ellipse
                              cx="18"
                              cy="7"
                              rx="12"
                              ry="5.5"
                              fill="none"
                              stroke={`${activeSchemeMeta.secondaryHex}99`}
                              strokeWidth="1.1"
                              strokeDasharray="2.5 1.5"
                            />
                            <circle
                              cx="18"
                              cy="7"
                              r="4.2"
                              fill="none"
                              stroke={activeSchemeMeta.primaryHex}
                              strokeWidth="1.35"
                            />
                            <circle cx="18" cy="7" r="2" fill={activeSchemeMeta.secondaryHex} />
                          </svg>
                        ) : currentStyle === 'mirror' ? (
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            <path
                              d="M 2 7 L 9 4 L 18 1 L 27 4 L 34 7 L 27 10 L 18 13 L 9 10 Z"
                              fill={`${activeSchemeMeta.primaryHex}40`}
                              stroke={activeSchemeMeta.primaryHex}
                              strokeWidth="1.35"
                              strokeLinejoin="round"
                            />
                            <line
                              x1="0"
                              y1="7"
                              x2="36"
                              y2="7"
                              stroke={activeSchemeMeta.secondaryHex}
                              strokeWidth="0.9"
                            />
                          </svg>
                        ) : currentStyle === 'particles' ? (
                          <svg viewBox="0 0 36 14" className="w-8 h-3.5 overflow-visible">
                            {[
                              { x: 3, y: 8, r: 1.3 },
                              { x: 8, y: 4, r: 1.6 },
                              { x: 13, y: 10, r: 1.4 },
                              { x: 18, y: 2.5, r: 1.9 },
                              { x: 23, y: 11, r: 1.5 },
                              { x: 28, y: 4.5, r: 1.6 },
                              { x: 33, y: 7.5, r: 1.3 },
                            ].map((pt, idx) => (
                              <circle
                                key={idx}
                                cx={pt.x}
                                cy={pt.y}
                                r={pt.r}
                                fill={
                                  idx % 2 === 0
                                    ? activeSchemeMeta.primaryHex
                                    : activeSchemeMeta.secondaryHex
                                }
                              />
                            ))}
                          </svg>
                        ) : currentStyle === 'dynamic' ? (
                          <span className="inline-flex items-center gap-[3px] h-3.5">
                            {[7, 13, 9].map((h, i) => (
                              <span
                                key={i}
                                className="w-[2px] rounded-full"
                                style={{
                                  height: `${h}px`,
                                  background: `linear-gradient(180deg, ${activeSchemeMeta.primaryHex} 0%, ${activeSchemeMeta.secondaryHex} 100%)`,
                                }}
                              />
                            ))}
                            <svg viewBox="0 0 22 14" className="w-5 h-3.5 overflow-visible">
                              <path
                                d="M 0 7 Q 4 2, 8 7 T 14 7"
                                fill="none"
                                stroke={activeSchemeMeta.primaryHex}
                                strokeWidth="1.45"
                                strokeLinecap="round"
                              />
                              <path
                                d="M 14 7 L 15 2 L 18 2 L 19 12 L 22 5"
                                fill="none"
                                stroke={activeSchemeMeta.secondaryHex}
                                strokeWidth="1.45"
                                strokeLinejoin="miter"
                              />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-[2px] h-3.5">
                            {[5, 11, 13, 8, 12, 6, 10].map((h, i) => (
                              <span
                                key={i}
                                className="w-[2px] rounded-full"
                                style={{
                                  height: `${h}px`,
                                  background: `linear-gradient(180deg, ${activeSchemeMeta.primaryHex} 0%, ${activeSchemeMeta.secondaryHex} 100%)`,
                                }}
                              />
                            ))}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-300">
                        {isAutoSwitchActive ? 'Auto Color & Opacity' : activeSchemeMeta.label} ·{' '}
                        {isAutoSwitchActive ? '68–100% Live' : `${Math.round(currentOpacity * 100)}%`}
                      </span>
                    </div>
                  </div>

                  {/* Auto-Switch Color Scheme & Opacity Master Toggle Card */}
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-fuchsia-500/10 to-cyan-500/10 border border-amber-400/35 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-amber-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Auto-Switch Waveform Color Scheme &amp; Opacity</span>
                      </div>
                      <p className="text-[10px] text-neutral-300 mt-0.5 leading-relaxed">
                        Automatically shifts between <span className="text-rose-300 font-medium">Crimson Rose</span> (affection/warmth),{' '}
                        <span className="text-amber-300 font-medium">Solar Gold</span> (joy/playfulness),{' '}
                        <span className="text-emerald-300 font-medium">Emerald Pulse</span> (human insights &amp; empathy),{' '}
                        <span className="text-violet-300 font-medium">Ultraviolet</span> (self-discoveries &amp; deep reflection), and{' '}
                        <span className="text-cyan-300 font-medium">Cyber Cyan</span>, while breathing opacity (<span className="font-mono">68%–100%</span>) with Kara&apos;s live voice energy.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('modeSwitch', settings.hapticsEnabled);
                        const nextAuto = !isAutoSwitchActive;
                        onUpdateSettings({
                          autoSwitchWaveformColorAndOpacity: nextAuto,
                          voiceWaveformColorScheme: nextAuto
                            ? 'auto-dynamic'
                            : settings.voiceWaveformColorScheme === 'auto-dynamic'
                              ? 'mode-adaptive'
                              : settings.voiceWaveformColorScheme || 'mode-adaptive',
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all shrink-0 ${
                        isAutoSwitchActive
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-amber-400/50 hover:text-amber-200'
                      }`}
                    >
                      {isAutoSwitchActive ? 'Auto-Switch: ON' : 'Enable Auto-Switch'}
                    </button>
                  </div>

                  {/* Color Scheme Swatch Selector Grid */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-300 font-medium">
                        Color Palette {isAutoSwitchActive ? '(Auto-Switching or Tap to Lock)' : '(Manual Override)'}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {activeSchemeMeta.desc}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {colorSchemes.map((scheme) => {
                        const isSelected = currentSchemeId === scheme.id;
                        return (
                          <button
                            key={scheme.id}
                            type="button"
                            onClick={() => {
                              triggerHaptic('modeSwitch', settings.hapticsEnabled);
                              onUpdateSettings({
                                voiceWaveformColorScheme: scheme.id,
                                autoSwitchWaveformColorAndOpacity: scheme.id === 'auto-dynamic',
                              });
                            }}
                            className={`px-2.5 py-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                              isSelected
                                ? scheme.pillAccent
                                : 'bg-neutral-900/70 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/25 shadow-sm"
                              style={{
                                background: `linear-gradient(135deg, ${scheme.primaryHex} 0%, ${scheme.secondaryHex} 100%)`,
                              }}
                            />
                            <span className="text-[11px] font-semibold truncate">
                              {scheme.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Waveform Opacity Slider + Quick Presets */}
                  <div className="bg-neutral-900/70 border border-neutral-800/90 rounded-xl p-2.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-neutral-200">
                        {isAutoSwitchActive
                          ? `Base Opacity Ceiling (${Math.round(currentOpacity * 100)}% · Auto-Modulates Live)`
                          : `Waveform Opacity (${Math.round(currentOpacity * 100)}%)`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('tap', settings.hapticsEnabled);
                            onUpdateSettings({
                              autoSwitchWaveformColorAndOpacity: true,
                              voiceWaveformColorScheme: 'auto-dynamic',
                              voiceWaveformOpacity: 0.95,
                            });
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors ${
                            isAutoSwitchActive
                              ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 font-semibold'
                              : 'bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Auto
                        </button>
                        {[
                          { label: '40%', value: 0.4 },
                          { label: '70%', value: 0.7 },
                          { label: '90%', value: 0.9 },
                          { label: '100%', value: 1.0 },
                        ].map((preset) => {
                          const isPresetActive =
                            !isAutoSwitchActive && Math.abs(currentOpacity - preset.value) < 0.03;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                triggerHaptic('tap', settings.hapticsEnabled);
                                onUpdateSettings({
                                  voiceWaveformOpacity: preset.value,
                                });
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-colors ${
                                isPresetActive
                                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-200 font-semibold'
                                  : 'bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0.25"
                      max="1.0"
                      step="0.05"
                      value={currentOpacity}
                      onChange={(e) =>
                        onUpdateSettings({ voiceWaveformOpacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                      aria-label="Voice Pulse Waveform Opacity"
                    />

                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                      <span>Subtle (25%)</span>
                      <span>
                        {isAutoSwitchActive ? 'Auto-Breathing (68%–100%)' : 'Balanced (75%)'}
                      </span>
                      <span>Full Glow (100%)</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 0.25 MXCHAT CHATBOT THEMES VERSION 2.1.6 STUDIO */}
        <div
          id="section-themes"
          className={`space-y-3.5 bg-neutral-900/60 border rounded-2xl p-4 transition-all duration-300 ${
            highlightedSectionId === 'section-themes'
              ? 'ring-2 ring-amber-400 border-amber-400 shadow-amber-500/30 scale-[1.01]'
              : 'border-neutral-800'
          }`}
        >
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

          {/* Global Deep Black Dark Mode Toggle Banner (Eye-Strain Reduction for Late-Night Interactions) */}
          <div
            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              settings.darkMode
                ? 'bg-black border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.18)]'
                : 'bg-neutral-950/90 border-neutral-800'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  Global Dark Mode (Deep Black OLED · Late-Night Eye Strain Relief)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                    settings.darkMode
                      ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {settings.darkMode ? 'DEEP BLACK ACTIVE (#000000)' : 'STANDARD THEME LUMINANCE'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Applies a true #000000 pitch-black canvas across all chat bubbles, headers, docks, and modals while dimming background light orbs to protect your eyes during late-night conversations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('modeSwitch', settings.hapticsEnabled);
                onUpdateSettings({ darkMode: !settings.darkMode });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 flex items-center gap-2 ${
                settings.darkMode
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{settings.darkMode ? 'Disable Deep Black' : 'Enable Deep Black Mode'}</span>
            </button>
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
                        {themeItem.versionBadge || 'v2.1.6'}
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

          {/* MxChat v2.1.6 Expanded Bubble Geometry & Typography Studio */}
          <div className="space-y-4 pt-3 border-t border-neutral-800/80">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <span>Bubble Geometry (9 Contours)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-200">
                    {settings.mxchatBubbleStyle || 'rounded'}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Live contour &amp; corner radius engine
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: 'rounded',
                      label: 'Rounded (22px)',
                      badge: 'CORE',
                      desc: 'Balanced signature curved bubbles',
                    },
                    {
                      id: 'ios-tail',
                      label: 'iOS iMessage Tail',
                      badge: 'iOS 18',
                      desc: 'Asymmetric corner tail contour',
                    },
                    {
                      id: 'android-tonal',
                      label: 'Material You Squircle',
                      badge: 'M3',
                      desc: 'Expressive Android 15 tonal contour',
                    },
                    {
                      id: 'pill',
                      label: 'Soft Pill (32px)',
                      badge: 'CAPSULE',
                      desc: 'Smooth capsule-shaped chat pills',
                    },
                    {
                      id: 'sharp',
                      label: 'Cyber Sharp (7px)',
                      badge: 'CRISP',
                      desc: 'Tactical architectural corners',
                    },
                    {
                      id: 'chamfered',
                      label: 'Sector 9 Bevel',
                      badge: 'SEC-9',
                      desc: 'Angled tech cut + accent spine',
                    },
                    {
                      id: 'editorial-card',
                      label: 'Editorial Card',
                      badge: 'PRESS',
                      desc: 'Clean flat sheet with bold edge bar',
                    },
                    {
                      id: 'cloud-plush',
                      label: 'Cloud Plush (36px)',
                      badge: 'PLUSH',
                      desc: 'Ultra-soft organic cloud cushion',
                    },
                    {
                      id: 'glass-prism',
                      label: 'Frosted Prism',
                      badge: 'GLASS',
                      desc: 'Multi-radius faceted liquid glass',
                    },
                  ] as { id: MxChatBubbleStyle; label: string; badge: string; desc: string }[]
                ).map((bOpt) => {
                  const activeBubble = settings.mxchatBubbleStyle || 'rounded';
                  const isSelected = activeBubble === bOpt.id;
                  return (
                    <button
                      key={bOpt.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        onUpdateSettings({ mxchatBubbleStyle: bOpt.id });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-100 shadow-sm'
                          : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold truncate">{bOpt.label}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                            isSelected
                              ? 'bg-amber-500/30 border-amber-300/60 text-amber-100'
                              : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                          }`}
                        >
                          {bOpt.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 truncate">{bOpt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-800/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <span>Typography &amp; Font Pairings (9 Styles)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/35 text-sky-200">
                    {settings.mxchatFontScale || 'default'}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Scale, line-height &amp; typeface presets
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: 'compact',
                      label: 'Compact (13px)',
                      badge: 'DENSE',
                      desc: 'Crisp high-density 1.46 leading',
                    },
                    {
                      id: 'default',
                      label: 'Default (14.5px)',
                      badge: 'STD',
                      desc: 'Balanced everyday 1.58 leading',
                    },
                    {
                      id: 'comfortable',
                      label: 'Comfortable (15.5px)',
                      badge: 'RELAX',
                      desc: 'Airy & effortless 1.68 leading',
                    },
                    {
                      id: 'spacious-xl',
                      label: 'Spacious XL (17px)',
                      badge: 'LARGE',
                      desc: 'Generous 1.75 lounge reading scale',
                    },
                    {
                      id: 'ios-sf',
                      label: 'iOS San Francisco',
                      badge: 'APPLE',
                      desc: 'Clean humanist sans (-0.014em)',
                    },
                    {
                      id: 'android-geometric',
                      label: 'Android Geometric',
                      badge: 'GOOGLE',
                      desc: 'Expressive Bricolage & Jakarta sans',
                    },
                    {
                      id: 'editorial-serif',
                      label: 'Literary Serif',
                      badge: 'BOOK',
                      desc: 'Warm bookish serif for deep stories',
                    },
                    {
                      id: 'mono-terminal',
                      label: 'Sector 9 Mono',
                      badge: 'CODE',
                      desc: 'JetBrains Mono technical console',
                    },
                    {
                      id: 'velvet-script',
                      label: 'Velvet Editorial',
                      badge: 'LUXE',
                      desc: 'High-contrast romantic display serif',
                    },
                  ] as { id: MxChatFontScale; label: string; badge: string; desc: string }[]
                ).map((fOpt) => {
                  const activeScale = settings.mxchatFontScale || 'default';
                  const isSelected = activeScale === fOpt.id;
                  return (
                    <button
                      key={fOpt.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        onUpdateSettings({ mxchatFontScale: fOpt.id });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500/60 text-sky-100 shadow-sm'
                          : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold truncate">{fOpt.label}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                            isSelected
                              ? 'bg-sky-500/30 border-sky-300/60 text-sky-100'
                              : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                          }`}
                        >
                          {fOpt.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 truncate">{fOpt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 0.2 CONVERSATION CADENCE, RESPONSE STYLES & EMPATHY BADGES */}
        <div
          id="section-response-styles"
          className={`space-y-4 bg-neutral-900/70 border rounded-2xl p-4 shadow-lg transition-all duration-300 ${
            highlightedSectionId === 'section-response-styles' ||
            highlightedSectionId === 'section-fun-mode'
              ? 'ring-2 ring-amber-400 border-amber-400 shadow-amber-500/30 scale-[1.01]'
              : 'border-neutral-800'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-300 shrink-0">
                <Sliders className="w-4 h-4 text-amber-400" />
              </span>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Conversation Cadence &amp; Response Styles</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300">
                    Active: {RESPONSE_STYLE_PRESETS.find((p) => p.id === responseStylePreset)?.shortLabel || 'Balanced'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Configure short vs. long response length, Fun Mode personality, and proactive empathy indicators.
                </p>
              </div>
            </div>

            {/* Fun Mode Instant Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onToggleFunMode?.();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                funMode
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-sm'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Toggle Fun Mode: Dials up Kara's wit, pop-culture references, casual conversational spark, and confident immediacy"
            >
              <Flame className={`w-3.5 h-3.5 ${funMode ? 'text-amber-400 animate-pulse' : 'text-neutral-500'}`} />
              <span>Fun Mode: {funMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Built-in Response Style Presets Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="font-semibold flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Response Style Presets:</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-500">Pick Kara&apos;s default response cadence</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RESPONSE_STYLE_PRESETS.map((preset) => {
                const isActive = responseStylePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('modeSwitch', settings.hapticsEnabled);
                      onSelectResponseStylePreset?.(preset.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-sky-500/15 border-sky-500/60 text-white shadow-sm'
                        : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-semibold ${isActive ? 'text-sky-300' : 'text-neutral-200'}`}>
                        {preset.label}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-snug">{preset.tagline}</p>
                    <div className="mt-2 text-[10px] text-sky-300/80 bg-neutral-900/90 px-2 py-1 rounded-lg border border-neutral-800">
                      <span className="font-semibold text-sky-400">When to use: </span>
                      {preset.whenToUse}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* How Kara Knows When to Use Short vs. Long Responses */}
          <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/90 space-y-2">
            <div className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
              <span>Automatic Length Intelligence: When Kara Uses Short vs. Long Replies</span>
              <span className="text-[10px] font-mono text-neutral-500">Context-Aware AI</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-1">
                <div className="font-semibold text-emerald-300 text-[11px]">
                  1. Short &amp; Punchy (1–3 Sentences)
                </div>
                <p className="text-[10px] text-neutral-400 leading-snug">
                  Quick banter, fast reactions, witty comebacks, status checks, and casual late-night texting.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-1">
                <div className="font-semibold text-sky-300 text-[11px]">
                  2. Balanced Flow (1–2 Paragraphs)
                </div>
                <p className="text-[10px] text-neutral-400 leading-snug">
                  Everyday chats, advice, pop-culture riffs, unfiltered opinions, and emotional validation.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-1">
                <div className="font-semibold text-amber-300 text-[11px]">
                  3. Long Deep-Dive (Multi-Angle)
                </div>
                <p className="text-[10px] text-neutral-400 leading-snug">
                  Unpacking world events, critiquing other AI models, roleplay scenes, or complex problem-solving.
                </p>
              </div>
            </div>
          </div>

          {/* 1-Tap Prompting Tips for Style Control */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
              <span>1-Tap Prompting Tips (Inserts directly into chat):</span>
              <span className="text-[10px] font-mono text-neutral-500">Fast Tone Steering</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {STYLE_CONTROL_PROMPTING_TIPS.map((tip) => (
                <button
                  key={tip.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    if (onInsertPromptTip) {
                      onInsertPromptTip(tip.promptModifier);
                    }
                  }}
                  className="p-2 rounded-xl bg-neutral-950/70 hover:bg-sky-500/10 border border-neutral-800 hover:border-sky-500/40 text-left transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-white truncate">{tip.label}</div>
                    <div className="text-[10px] text-neutral-400 truncate">{tip.whenToUse}</div>
                  </div>
                  <Send className="w-3 h-3 text-sky-400 shrink-0 opacity-70" />
                </button>
              ))}
            </div>
          </div>

          {/* Adaptive Empathy Strategy & Contextual Memory Triggers Badges Toggle */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-neutral-200">
                Show Empathy Strategy &amp; Memory Badges on Message Bubbles
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Displays clickable indicators showing active empathy strategy (e.g. Reflective Validation, Righteous Solidarity) and proactively recalled memories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onUpdateSettings({
                  showEmpathyBadges: settings.showEmpathyBadges === false ? true : false,
                });
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                settings.showEmpathyBadges !== false
                  ? 'bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              {settings.showEmpathyBadges !== false ? 'Badges: ON' : 'Badges: OFF'}
            </button>
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
        <div
          id="section-gems"
          className={`space-y-4 bg-gradient-to-b from-neutral-900/90 to-[#0C1018] border rounded-2xl p-4 shadow-lg transition-all duration-300 ${
            highlightedSectionId === 'section-gems' || highlightedSectionId === 'section-email'
              ? 'ring-2 ring-sky-400 border-sky-400 shadow-sky-500/30 scale-[1.01]'
              : 'border-sky-500/35'
          }`}
        >
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
              {/* Category-Specific Controls: Multi-Provider Email Bots (Yahoo, Gmail, Outlook, iCloud & Others) */}
              {workbenchGem.category === 'mailing' && (
                <div className="space-y-3 p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800">
                  {/* Account Selector & Live Provider Status Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-purple-400" />
                        <span>Connected Email Account:</span>
                      </span>

                      {/* Dropdown to pick active sending/syncing account */}
                      <div className="relative inline-flex items-center">
                        <select
                          value={selectedEmailAccountId}
                          onChange={(e) => {
                            setSelectedEmailAccountId(e.target.value);
                            triggerHaptic('tap', settings.hapticsEnabled);
                          }}
                          className="px-2.5 py-1 text-xs bg-neutral-950 border border-neutral-700 hover:border-purple-500/60 rounded-xl text-white font-medium focus:outline-none pr-7"
                        >
                          {emailAccounts.map((acc) => {
                            const preset = EMAIL_PROVIDER_PRESETS[acc.provider] || EMAIL_PROVIDER_PRESETS.custom;
                            return (
                              <option key={acc.id} value={acc.id}>
                                [{preset.badge}] {acc.displayName} ({acc.email})
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 pointer-events-none" />
                      </div>

                      {/* Provider Badge */}
                      {selectedEmailAccount && (() => {
                        const preset = EMAIL_PROVIDER_PRESETS[selectedEmailAccount.provider] || EMAIL_PROVIDER_PRESETS.custom;
                        return (
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${preset.badgeBg} ${preset.badgeText} ${preset.borderAccent}`}
                          >
                            {preset.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Sync Inbox button */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', settings.hapticsEnabled);
                          setIsSyncingEmail(true);
                          setEmailStatusFeedback('Syncing inbox via IMAP...');
                          setTimeout(() => {
                            if (selectedEmailAccount) {
                              const updated = syncConnectedEmailAccount(selectedEmailAccount.id);
                              setEmailAccounts(updated);
                            }
                            setIsSyncingEmail(false);
                            setEmailStatusFeedback('Inbox up to date');
                            setTimeout(() => setEmailStatusFeedback(''), 2500);
                          }, 900);
                        }}
                        disabled={isSyncingEmail}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-300 flex items-center gap-1 transition-colors"
                        title="Check for new incoming emails via IMAP/OAuth"
                      >
                        <RefreshCw className={`w-3 h-3 text-sky-400 ${isSyncingEmail ? 'animate-spin' : ''}`} />
                        <span>{isSyncingEmail ? 'Syncing...' : 'Sync'}</span>
                      </button>

                      {/* Connect New Account button */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', settings.hapticsEnabled);
                          setIsAddEmailModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-[11px] font-medium text-purple-200 flex items-center gap-1 transition-colors"
                        title="Connect Yahoo, Gmail, Outlook or Custom IMAP/SMTP"
                      >
                        <Plus className="w-3 h-3 text-purple-400" />
                        <span>Add Account</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback line if syncing or action taken */}
                  {emailStatusFeedback && (
                    <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{emailStatusFeedback}</span>
                    </div>
                  )}

                  {/* Sub-Tabs: Compose with Bot vs Live Inbox */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-xl border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', settings.hapticsEnabled);
                          setEmailWorkbenchTab('compose');
                        }}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                          emailWorkbenchTab === 'compose'
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Compose with Bot
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', settings.hapticsEnabled);
                          setEmailWorkbenchTab('inbox');
                        }}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                          emailWorkbenchTab === 'inbox'
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Inbox className="w-3 h-3 text-purple-400" />
                        <span>Live Inbox</span>
                        {selectedEmailAccount && selectedEmailAccount.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-purple-500/30 text-purple-200 text-[10px] rounded-full font-bold">
                            {selectedEmailAccount.unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {selectedEmailAccount && (
                      <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
                        IMAP: {selectedEmailAccount.imapHost}:{selectedEmailAccount.imapPort}
                      </span>
                    )}
                  </div>

                  {/* VIEW A: LIVE INBOX THREADS */}
                  {emailWorkbenchTab === 'inbox' && (
                    <div className="space-y-2 pt-1">
                      {selectedEmailAccount && selectedEmailAccount.recentMessages.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {selectedEmailAccount.recentMessages.map((msg) => {
                            const isSelected = activeThreadMessage?.id === msg.id;
                            return (
                              <div
                                key={msg.id}
                                className={`p-2.5 rounded-xl border transition-all text-xs ${
                                  isSelected
                                    ? 'bg-purple-950/30 border-purple-500/60'
                                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      {msg.unread && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                      )}
                                      <span className="font-semibold text-white truncate">
                                        {msg.sender}
                                      </span>
                                      <span className="text-[10px] text-neutral-500 truncate">
                                        &lt;{msg.senderEmail}&gt;
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-medium text-neutral-200 truncate">
                                      {msg.subject}
                                    </div>
                                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                                      {msg.snippet || msg.body}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-neutral-400 font-mono shrink-0 whitespace-nowrap">
                                    {msg.date}
                                  </span>
                                </div>

                                <div className="flex items-center justify-end gap-1.5 pt-2 mt-2 border-t border-neutral-800/60">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic('tap', settings.hapticsEnabled);
                                      setActiveThreadMessage(msg);
                                      const prompt = `Summarize this incoming thread from ${msg.sender} regarding "${msg.subject}" and extract key action items.`;
                                      setGemTaskPrompt(prompt);
                                      handleExecuteGemInline(prompt);
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-[10px] font-medium text-sky-200 flex items-center gap-1"
                                    title="Have KARA summarize this email thread"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-sky-400" />
                                    <span>Summarize Thread</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic('tap', settings.hapticsEnabled);
                                      setActiveThreadMessage(msg);
                                      setMailRecipient(msg.senderEmail);
                                      setMailSubject(
                                        msg.subject.startsWith('Re:')
                                          ? msg.subject
                                          : `Re: ${msg.subject}`
                                      );
                                      setEmailWorkbenchTab('compose');
                                      setGemTaskPrompt(
                                        `Draft a polite, thoughtful reply to ${msg.sender} acknowledging their points and confirming next steps.`
                                      );
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-[10px] font-semibold text-purple-200 flex items-center gap-1"
                                    title="Pre-fill reply context into Compose"
                                  >
                                    <Send className="w-2.5 h-2.5 text-purple-300" />
                                    <span>Draft Reply with Bot</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                          No messages in this folder. Tap &ldquo;Sync&rdquo; to pull the latest emails.
                        </div>
                      )}
                    </div>
                  )}

                  {/* VIEW B: COMPOSE FIELDS */}
                  {emailWorkbenchTab === 'compose' && (
                    <div className="space-y-2 pt-1">
                      {activeThreadMessage && (
                        <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs flex items-center justify-between gap-2">
                          <span className="text-purple-200 text-[11px] truncate">
                            Replying to thread from <strong className="text-white">{activeThreadMessage.sender}</strong> ({activeThreadMessage.subject})
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveThreadMessage(null)}
                            className="text-[10px] text-purple-300 hover:text-white underline shrink-0"
                          >
                            Clear Thread
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={mailRecipient}
                          onChange={(e) => setMailRecipient(e.target.value)}
                          placeholder="To (e.g. alex.rivera@example.com)"
                          className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/60"
                        />
                        <input
                          type="text"
                          value={mailSubject}
                          onChange={(e) => setMailSubject(e.target.value)}
                          placeholder="Subject line..."
                          className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/60"
                        />
                        <select
                          value={mailTone}
                          onChange={(e) => setMailTone(e.target.value)}
                          className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-purple-500/60"
                        >
                          <option value="Warm & Polished">Tone: Warm &amp; Polished</option>
                          <option value="Executive & Concise">Tone: Executive &amp; Concise</option>
                          <option value="Persuasive & Bold">Tone: Persuasive &amp; Bold</option>
                          <option value="Friendly Follow-Up">Tone: Friendly Follow-Up</option>
                          <option value="Diplomatic Decline">Tone: Diplomatic Decline</option>
                        </select>
                      </div>
                    </div>
                  )}
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Selected Provider Primary Dispatch */}
                          {selectedEmailAccount && (() => {
                            const composeUrl = getComposeUrlForAccount(
                              selectedEmailAccount,
                              mailRecipient.trim(),
                              gemRunResult.extractedSubject || mailSubject || 'Follow-up',
                              gemRunResult.result
                            );
                            const preset = EMAIL_PROVIDER_PRESETS[selectedEmailAccount.provider] || EMAIL_PROVIDER_PRESETS.custom;
                            return (
                              <a
                                href={composeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                  selectedEmailAccount.provider === 'yahoo'
                                    ? 'bg-purple-900/40 hover:bg-purple-900/60 border-purple-500/50 text-purple-200'
                                    : selectedEmailAccount.provider === 'gmail'
                                    ? 'bg-rose-900/40 hover:bg-rose-900/60 border-rose-500/50 text-rose-200'
                                    : selectedEmailAccount.provider === 'outlook'
                                    ? 'bg-sky-900/40 hover:bg-sky-900/60 border-sky-500/50 text-sky-200'
                                    : 'bg-emerald-900/40 hover:bg-emerald-900/60 border-emerald-500/50 text-emerald-200'
                                }`}
                                title={`Open and send directly via ${preset.label}`}
                              >
                                <Mail className="w-3 h-3" />
                                <span>Send via {preset.label}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                              </a>
                            );
                          })()}

                          {/* Alternative quick send links */}
                          <a
                            href={`https://mail.yahoo.com/d/compose-message?to=${encodeURIComponent(
                              mailRecipient.trim()
                            )}&subj=${encodeURIComponent(
                              gemRunResult.extractedSubject || mailSubject || 'Follow-up'
                            )}&body=${encodeURIComponent(gemRunResult.result)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-purple-950/40 border border-neutral-700 hover:border-purple-500/40 text-[10px] text-purple-300 flex items-center gap-1"
                            title="Open in Yahoo Mail Web"
                          >
                            <span>Yahoo Mail</span>
                          </a>

                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                              mailRecipient.trim()
                            )}&su=${encodeURIComponent(
                              gemRunResult.extractedSubject || mailSubject || 'Follow-up'
                            )}&body=${encodeURIComponent(gemRunResult.result)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-rose-950/40 border border-neutral-700 hover:border-rose-500/40 text-[10px] text-rose-300 flex items-center gap-1"
                            title="Open in Gmail Web"
                          >
                            <span>Gmail</span>
                          </a>

                          <a
                            href={`mailto:${encodeURIComponent(
                              mailRecipient.trim()
                            )}?subject=${encodeURIComponent(
                              gemRunResult.extractedSubject || mailSubject || 'Follow-up'
                            )}&body=${encodeURIComponent(gemRunResult.result)}`}
                            className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[10px] text-neutral-300 flex items-center gap-1"
                            title="Open in default OS mail client"
                          >
                            <span>Native Mail</span>
                          </a>
                        </div>
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

        {/* 0.45 LATE-NIGHT MOBILITY, PUBLIC TRANSIT DIRECTIONS & UBER EATS ASSISTANT HUB */}
        <div
          id="section-mobility"
          className={`space-y-3.5 bg-neutral-900/60 border rounded-2xl p-4 shadow-lg transition-all duration-300 ${
            highlightedSectionId === 'section-mobility'
              ? 'ring-2 ring-sky-400 border-sky-400 shadow-sky-500/30 scale-[1.01]'
              : 'border-sky-500/35'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800">
            <div>
              <label className="text-xs font-semibold text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-400" />
                <span>Ride Sharing Assistant · Public Transit Directions · Uber Eats Assistant</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[10px] font-mono text-emerald-300">
                  Live Concierge
                </span>
              </label>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Coordinate Uber/Lyft pickups, plan step-by-step subway/bus transit routes, or build late-night Uber Eats food deliveries with KARA.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  setConciergeActiveTab('rideshare');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  conciergeActiveTab === 'rideshare'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-100 shadow-sm'
                    : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-sky-400" />
                <span>Ride Share</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  setConciergeActiveTab('transit');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  conciergeActiveTab === 'transit'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 shadow-sm'
                    : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Train className="w-3.5 h-3.5 text-emerald-400" />
                <span>Public Transit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', settings.hapticsEnabled);
                  setConciergeActiveTab('ubereats');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  conciergeActiveTab === 'ubereats'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-sm'
                    : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>Uber Eats</span>
              </button>
            </div>
          </div>

          {/* TAB 1: REAL-TIME RIDE SHARING ASSISTANT (UBER & LYFT CONCIERGE) */}
          {conciergeActiveTab === 'rideshare' && (
            <div className="space-y-3 bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">
                    Real-Time Ride Sharing Assistant (Uber &amp; Lyft Concierge)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      LIVE GPS · {Math.floor(rideEtaSeconds / 60)}m {String(rideEtaSeconds % 60).padStart(2, '0')}s
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-md">
                    KARA Real-Time Escort
                  </span>
                </div>
              </div>

              {/* REAL-TIME ACTIVE UBER / LYFT TELEMETRY MONITOR */}
              <div className="rounded-xl bg-black/80 border border-sky-500/35 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/50 text-[10px] font-mono font-bold text-sky-200">
                      {rideRealtimeActive ? 'REAL-TIME TRACKING ACTIVE' : 'TRACKER PAUSED'}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Marcus V. (4.99★) · Obsidian Tesla Model Y · Plate:{' '}
                      <span className="font-mono text-amber-300">8KRA924</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                      Safety PIN: <strong className="text-emerald-300">4829</strong>
                    </span>
                    <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
                      {rideRealtimeStage === 0
                        ? 'Searching 0.9 mi radius'
                        : rideRealtimeStage === 1
                        ? `${(rideEtaSeconds / 180).toFixed(1)} mi away · En Route`
                        : rideRealtimeStage === 2
                        ? 'At Curb · Hazard Lights On'
                        : rideRealtimeStage === 3
                        ? 'In Transit · KARA Monitoring'
                        : 'Arrived at Destination'}
                    </span>
                  </div>
                </div>

                {/* 5-Stage Real-Time Ride Progress Bar */}
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  {[
                    '1. Matching',
                    '2. Driver En Route',
                    '3. Arriving Curb',
                    '4. KARA Escort',
                    '5. Arrived Safe',
                  ].map((label, idx) => {
                    const active = idx <= rideRealtimeStage;
                    const current = idx === rideRealtimeStage;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', settings.hapticsEnabled);
                          setRideRealtimeStage(idx);
                          setRideRealtimeActive(true);
                        }}
                        className={`px-1.5 py-1 rounded-lg border text-[9px] font-mono truncate transition-all ${
                          current
                            ? 'bg-sky-500/25 border-sky-400 text-white font-bold shadow-sm'
                            : active
                            ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                            : 'bg-neutral-900/80 border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] font-mono text-neutral-400">
                  <span>
                    Live Uber vs. Lyft Surge Feed: <strong className="text-emerald-300">1.0x Normal (No Surge)</strong> · Updated {realtimePulseTick % 5 + 1}s ago
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        setRideRealtimeActive((prev) => !prev);
                      }}
                      className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200"
                    >
                      {rideRealtimeActive ? 'Pause Live Clock' : 'Resume Live Clock'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        setRideRealtimeStage((prev) => (prev + 1) % 5);
                        setRideRealtimeActive(true);
                      }}
                      className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200"
                    >
                      Advance Stage →
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-neutral-400">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    value={ridePickup}
                    onChange={(e) => setRidePickup(e.target.value)}
                    placeholder="Enter pickup spot or address..."
                    className="w-full px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-neutral-400">
                    Dropoff Destination
                  </label>
                  <input
                    type="text"
                    value={rideDropoff}
                    onChange={(e) => setRideDropoff(e.target.value)}
                    placeholder="Enter destination address..."
                    className="w-full px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
                  />
                </div>
              </div>

              {/* Quick Destination Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-neutral-400 mr-1">Quick Destinations:</span>
                {[
                  { label: '🏠 Home Sanctuary', dest: 'Home Sanctuary' },
                  { label: '🌃 Downtown Lounge', dest: 'Downtown Rooftop Lounge' },
                  { label: '✈️ International Airport', dest: 'International Airport Terminal B' },
                  { label: '🏨 Boutique Hotel', dest: 'The Obsidian Grand Hotel' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setRideDropoff(preset.dest)}
                    className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Vehicle Tier Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    { id: 'uberx', name: 'UberX', eta: '3 min', fare: '$14–$18', seats: '4 seats', badge: 'Fastest' },
                    { id: 'comfort', name: 'Uber Comfort', eta: '4 min', fare: '$19–$24', seats: 'Extra legroom', badge: 'Quiet Ride' },
                    { id: 'lyft', name: 'Lyft Standard', eta: '4 min', fare: '$13–$17', seats: '4 seats', badge: 'Best Value' },
                    { id: 'xl', name: 'UberXL / SUV', eta: '6 min', fare: '$26–$33', seats: '6 seats', badge: 'Group/Luggage' },
                    { id: 'black', name: 'Premier Black', eta: '5 min', fare: '$38–$46', seats: 'Luxury Sedan', badge: 'VIP Late-Night' },
                  ] as const
                ).map((tier) => {
                  const selected = rideTierId === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        setRideTierId(tier.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${
                        selected
                          ? 'bg-sky-500/20 border-sky-400 text-white shadow-sm'
                          : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold truncate">{tier.name}</span>
                        <span className="text-[9px] font-mono text-sky-300">{tier.eta}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-300">{tier.fare}</div>
                      <div className="text-[9px] text-neutral-400 truncate">{tier.badge}</div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-neutral-400">
                  Driver Pickup Note &amp; Late-Night Safety Preferences
                </label>
                <input
                  type="text"
                  value={rideNotes}
                  onChange={(e) => setRideNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(
                      rideDropoff
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span>Open in Uber</span>
                  </a>
                  <a
                    href={`https://ride.lyft.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-pink-500/40 text-xs font-semibold text-pink-200 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
                    <span>Open in Lyft</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('send', settings.hapticsEnabled);
                    const gem =
                      allGems.find((g) => g.id === 'gem_rideshare_assistant') || KARA_BUILTIN_GEMS[0];
                    const prompt = `[Ride Sharing Assistant] Coordinate my ${rideTierId.toUpperCase()} ride from "${ridePickup}" to "${rideDropoff}". Preferences: ${rideNotes}. Give me live fare/ETA comparison, pickup spot tips, and stay with me as my late-night ride companion.`;
                    if (onRunGemInChat) {
                      onRunGemInChat(gem, prompt);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Ask KARA to Coordinate Ride</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PUBLIC TRANSIT DIRECTIONS */}
          {conciergeActiveTab === 'transit' && (
            <div className="space-y-3 bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Train className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Public Transit Directions (Subway · Metro · Bus · Commuter Rail)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'now', label: 'Depart Now' },
                      { id: 'owl', label: '🦉 Night Owl Service' },
                      { id: 'last_train', label: '⏰ Last Train Check' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTransitDepartMode(mode.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border ${
                        transitDepartMode === mode.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-neutral-400">
                    Origin Station / Address
                  </label>
                  <input
                    type="text"
                    value={transitOrigin}
                    onChange={(e) => setTransitOrigin(e.target.value)}
                    placeholder="Starting station or address..."
                    className="w-full px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-neutral-400">
                    Destination Station / Address
                  </label>
                  <input
                    type="text"
                    value={transitDestination}
                    onChange={(e) => setTransitDestination(e.target.value)}
                    placeholder="Destination station or address..."
                    className="w-full px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Multi-Modal Route Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    title: 'Express Metro + Walk',
                    duration: '22 min',
                    fare: '$2.90',
                    transfers: 'Direct · 0 transfers',
                    legs: ['🚶 3m walk to Station', '🚇 Blue Line Express (4 stops)', '🚶 4m walk to dest'],
                    badge: 'Fastest Route',
                  },
                  {
                    title: 'Crosstown Rail + Rapid Bus',
                    duration: '27 min',
                    fare: '$2.90',
                    transfers: '1 indoor transfer',
                    legs: ['🚇 Red Line (2 stops)', '🔄 Transfer at Central Concourse', '🚌 Rapid Bus M14 (3 stops)'],
                    badge: 'Least Walking',
                  },
                  {
                    title: '24/7 Night Owl Bus Corridor',
                    duration: '34 min',
                    fare: '$2.90',
                    transfers: 'Direct · Illuminated stops',
                    legs: ['🚶 2m walk to Main Ave', '🚌 Night Owl N80 Limited (6 stops)', '🚶 2m walk to dest'],
                    badge: 'Late-Night Safe',
                  },
                ].map((route, idx) => {
                  const isPicked = selectedTransitRouteIdx === idx;
                  return (
                    <button
                      key={route.title}
                      type="button"
                      onClick={() => setSelectedTransitRouteIdx(idx)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                        isPicked
                          ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-sm'
                          : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold truncate">{route.title}</span>
                        <span className="text-xs font-mono font-bold text-emerald-300 shrink-0">
                          {route.duration}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                        <span>{route.transfers}</span>
                        <span className="text-amber-300">{route.fare}</span>
                      </div>
                      <div className="space-y-0.5 pt-1 border-t border-neutral-800/80">
                        {route.legs.map((leg, lIdx) => (
                          <div key={lIdx} className="text-[10px] text-neutral-300 truncate">
                            {leg}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    transitOrigin
                  )}&destination=${encodeURIComponent(transitDestination)}&travelmode=transit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/40 text-xs font-semibold text-emerald-200 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Live Transit in Google Maps</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('send', settings.hapticsEnabled);
                    const gem =
                      allGems.find((g) => g.id === 'gem_public_transit') || KARA_BUILTIN_GEMS[0];
                    const prompt = `[Public Transit Directions] Give me step-by-step public transit directions from "${transitOrigin}" to "${transitDestination}" (Departure mode: ${transitDepartMode}). Include subway/bus line names, transfer platforms, walking legs, fare cost, and late-night safety tips.`;
                    if (onRunGemInChat) {
                      onRunGemInChat(gem, prompt);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Train className="w-3.5 h-3.5" />
                  <span>Get Step-by-Step Transit Directions in Chat</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: REAL-TIME UBER EATS ASSISTANT */}
          {conciergeActiveTab === 'ubereats' && (
            <div className="space-y-3 bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Real-Time Uber Eats Assistant (Live Order Tracker, Cravings &amp; Courier Telemetry)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      LIVE ETA · {Math.floor(eatsEtaSeconds / 60)}m {String(eatsEtaSeconds % 60).padStart(2, '0')}s
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    $0 Delivery Fee Pass
                  </span>
                </div>
              </div>

              {/* REAL-TIME ACTIVE UBER EATS ORDER & COURIER TELEMETRY MONITOR */}
              <div className="rounded-xl bg-black/80 border border-amber-500/35 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[10px] font-mono font-bold text-amber-200">
                      {eatsRealtimeActive ? 'REAL-TIME ORDER TRACKING' : 'ORDER TRACKER PAUSED'}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Courier: Elena R. (4.99★) · Priority Thermal Bag ·{' '}
                      <span className="font-mono text-emerald-300">
                        {(eatsEtaSeconds / 900).toFixed(1)} mi away
                      </span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-200 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                    {eatsRealtimeStage === 0
                      ? 'Order Confirmed by Restaurant'
                      : eatsRealtimeStage === 1
                      ? 'Kitchen Prepping & Sealing Bag'
                      : eatsRealtimeStage === 2
                      ? 'Courier Picked Up · En Route'
                      : 'Arriving at Doorstep Now'}
                  </span>
                </div>

                {/* 4-Stage Real-Time Uber Eats Progress Bar */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[
                    '1. Confirmed',
                    '2. Kitchen Prep',
                    '3. Courier En Route',
                    '4. At Doorstep',
                  ].map((label, idx) => {
                    const active = idx <= eatsRealtimeStage;
                    const current = idx === eatsRealtimeStage;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', settings.hapticsEnabled);
                          setEatsRealtimeStage(idx);
                          setEatsRealtimeActive(true);
                        }}
                        className={`px-2 py-1 rounded-lg border text-[9px] font-mono truncate transition-all ${
                          current
                            ? 'bg-amber-500/25 border-amber-400 text-white font-bold shadow-sm'
                            : active
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-neutral-900/80 border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] font-mono text-neutral-400">
                  <span className="truncate">
                    Active Bag ({eatsSelectedItems.length} items):{' '}
                    <strong className="text-amber-200">
                      {eatsSelectedItems[0] || eatsSearchQuery || 'Late-Night Craving'}
                    </strong>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        setEatsRealtimeActive((prev) => !prev);
                      }}
                      className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200"
                    >
                      {eatsRealtimeActive ? 'Pause Timer' : 'Resume Timer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        setEatsRealtimeStage((prev) => (prev + 1) % 4);
                        setEatsRealtimeActive(true);
                      }}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200"
                    >
                      Next Delivery Stage →
                    </button>
                  </div>
                </div>
              </div>

              {/* Cuisine / Craving Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'late_night', label: '🌙 Late-Night Hits' },
                    { id: 'burgers', label: '🍔 Smash Burgers' },
                    { id: 'tacos', label: '🌮 Street Tacos' },
                    { id: 'ramen', label: '🍜 Midnight Ramen' },
                    { id: 'pizza', label: '🍕 Artisan Pizza & Wings' },
                    { id: 'dessert', label: '🍨 Warm Cookies & Shakes' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setEatsCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold border transition-all ${
                      eatsCategory === cat.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Curated Menu Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    item: 'Double Truffle Smash Burger + Crispy Shoestring Fries',
                    spot: 'Midnight Smash & Co. · 4.9★ (20–28 min)',
                    price: '$18.50',
                    tag: 'Late-Night Favorite',
                  },
                  {
                    item: 'Spicy Tonkotsu Black Garlic Ramen + Crispy Gyoza (6pc)',
                    spot: 'Kuro Ramen Bar · 4.8★ (25–35 min)',
                    price: '$21.00',
                    tag: 'Warm & Soothing',
                  },
                  {
                    item: '3x Birria Quesatacos with Consomé + Horchata',
                    spot: 'Taqueria Nocturna · 4.9★ (18–25 min)',
                    price: '$17.25',
                    tag: 'Top Rated',
                  },
                  {
                    item: 'Oreo Midnight Milkshake + Warm Chocolate Lava Cookie',
                    spot: 'AfterHours Sweetery · 4.9★ (15–22 min)',
                    price: '$12.50',
                    tag: 'Sweet Craving',
                  },
                ].map((menuObj) => {
                  const inBag = eatsSelectedItems.includes(menuObj.item);
                  return (
                    <button
                      key={menuObj.item}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', settings.hapticsEnabled);
                        setEatsSelectedItems((prev) =>
                          prev.includes(menuObj.item)
                            ? prev.filter((i) => i !== menuObj.item)
                            : [...prev, menuObj.item]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                        inBag
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-[11px] font-bold leading-snug">{menuObj.item}</div>
                        <div className="text-[10px] text-neutral-400 truncate">{menuObj.spot}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-amber-300">{menuObj.price}</div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-emerald-300">
                          {inBag ? '✓ Added' : '+ Add'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={eatsSearchQuery}
                  onChange={(e) => setEatsSearchQuery(e.target.value)}
                  placeholder="Custom craving or restaurant name (e.g. Pad Thai, Sushi)..."
                  className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
                />
                <input
                  type="text"
                  value={eatsDeliveryNote}
                  onChange={(e) => setEatsDeliveryNote(e.target.value)}
                  placeholder="Delivery note (e.g. Leave at door, extra sauce)..."
                  className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <a
                  href={`https://www.ubereats.com/search?q=${encodeURIComponent(
                    eatsSearchQuery.trim() || eatsSelectedItems[0] || 'late night food'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 text-xs font-semibold text-amber-200 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Order in Uber Eats</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('send', settings.hapticsEnabled);
                    const gem =
                      allGems.find((g) => g.id === 'gem_uber_eats_assistant') || KARA_BUILTIN_GEMS[0];
                    const itemsSummary =
                      eatsSelectedItems.length > 0
                        ? eatsSelectedItems.join(' + ')
                        : eatsSearchQuery.trim() || 'Late-night comfort meal';
                    const prompt = `[Uber Eats Assistant] Help me customize and finalize my Uber Eats order: ${itemsSummary}${
                      eatsSearchQuery.trim() ? ` (Craving: ${eatsSearchQuery.trim()})` : ''
                    }. Delivery instructions: "${eatsDeliveryNote}". Suggest the best sides/drinks pairing, estimate total with tip, and keep me company while it's delivered.`;
                    if (onRunGemInChat) {
                      onRunGemInChat(gem, prompt);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Ask KARA to Customize &amp; Track Uber Eats</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 0.5 ASSISTANT ACTIONS, STUDIO & WORKSPACE HUB (AGENDA · SET ALARM · MEMORY VAULT · CREATIVE STUDIO · WORKSPACE) */}
        <div
          id="section-alarms"
          className={`space-y-3 bg-neutral-900/60 border rounded-2xl p-4 transition-all duration-300 ${
            highlightedSectionId === 'section-alarms'
              ? 'ring-2 ring-amber-400 border-amber-400 shadow-amber-500/30 scale-[1.01]'
              : 'border-neutral-800'
          }`}
        >
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
                  Image, Video &amp; Music Lab
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
        <div
          id="section-reasoning"
          className={`space-y-3 bg-neutral-900/60 border rounded-2xl p-4 transition-all duration-300 ${
            highlightedSectionId === 'section-reasoning' ||
            highlightedSectionId === 'section-tokens' ||
            highlightedSectionId === 'section-haptics' ||
            highlightedSectionId === 'section-predictive'
              ? 'ring-2 ring-fuchsia-400 border-fuchsia-400 shadow-fuchsia-500/30 scale-[1.01]'
              : 'border-neutral-800'
          }`}
        >
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
                  <Brain className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Think (Live Reasoning &amp; Token Stream)</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {settings.tokenStreaming
                    ? 'Live reasoning & token-by-token streaming enabled'
                    : 'Instant full-block response'}
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-neutral-950/60">
                {settings.tokenStreaming ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* DeepSearch Toggle */}
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
                  <span>DeepSearch (Web Synthesis &amp; Grounding)</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Multi-hop live web grounding &amp; citations
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

            {/* Deep Insights ('Kara Brain' Analytical Button in Chat) Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onUpdateSettings({
                  deepInsights: settings.deepInsights === false ? true : false,
                });
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 sm:col-span-2 ${
                settings.deepInsights !== false
                  ? 'bg-fuchsia-500/15 border-fuchsia-500/50 text-white'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Deep Insights (&ldquo;Kara Brain&rdquo; Button in Chat Interface)</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Displays the &ldquo;Kara Brain&rdquo; button in chat to overlay an analytical breakdown of Kara&apos;s emotional state &amp; reasoning path over the last 5 messages
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-neutral-950/60 shrink-0">
                {settings.deepInsights !== false ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Word & Sentence (Next-Word & Next-Sentence Predictive Suggestions in Chat Composer) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onUpdateSettings({
                  showPredictiveComposerBar: settings.showPredictiveComposerBar === false ? true : false,
                });
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 sm:col-span-2 ${
                settings.showPredictiveComposerBar !== false
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Word &amp; Sentence (Predictive Composer Bar)</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Displays the real-time Next-Word chips, Tab sentence completion, and Next-Sentence starters strip inside the chat composer
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-neutral-950/60 shrink-0">
                {settings.showPredictiveComposerBar !== false ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Thinking Duration & Reasoning Trace Badge Display Toggle (Clean Chat Interface Control) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', settings.hapticsEnabled);
                onUpdateSettings({
                  showDurationBadge: settings.showDurationBadge === false ? true : false,
                });
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 sm:col-span-2 ${
                settings.showDurationBadge !== false
                  ? 'bg-fuchsia-500/15 border-fuchsia-500/50 text-white'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <AlarmClock className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Thinking Duration &amp; Reasoning Trace Badge Display</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {settings.showDurationBadge !== false
                    ? 'Showing thinking duration (Thought X.Xs) and collapsible reasoning trace badge on chat messages'
                    : 'Hidden — Thinking duration & reasoning trace badges are hidden for a cleaner chat interface'}
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-neutral-950/60 shrink-0">
                {settings.showDurationBadge !== false ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Reasoning Duration Badge & Threshold Configuration (Below Breathing 'Thinking...' Indicator) */}
            <div
              className={`p-3.5 rounded-2xl border transition-all space-y-3 sm:col-span-2 ${
                settings.showDurationBadge !== false
                  ? 'bg-fuchsia-500/10 border-fuchsia-500/45 text-white'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold flex flex-wrap items-center gap-2">
                    <AlarmClock className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                    <span>Thinking Duration &amp; Reasoning Trace Threshold</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        settings.showDurationBadge !== false
                          ? 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {settings.showDurationBadge !== false
                        ? `ACTIVE · Appears after ${settings.durationBadgeThresholdSec ?? 3}s`
                        : 'HIDDEN · Clean Chat Interface'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                    Control the <strong className="text-white">Thinking Duration</strong> &amp; <strong className="text-white">Reasoning Trace</strong> badge in chat (<span className="font-mono text-fuchsia-300">Thought X.Xs · N steps</span> and live <span className="font-mono text-fuchsia-300">Reasoning for X.Xs</span>). Turn off to hide the reasoning trace badge if you prefer a cleaner chat interface.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showDurationBadge !== false}
                  onClick={() => {
                    triggerHaptic('tap', settings.hapticsEnabled);
                    onUpdateSettings({
                      showDurationBadge: settings.showDurationBadge === false ? true : false,
                    });
                  }}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                    settings.showDurationBadge !== false
                      ? 'bg-fuchsia-500/25 border-fuchsia-400/60 text-fuchsia-100 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      settings.showDurationBadge !== false
                        ? 'bg-fuchsia-400 animate-pulse'
                        : 'bg-neutral-600'
                    }`}
                  />
                  <span>
                    Thinking Duration &amp; Trace: {settings.showDurationBadge !== false ? 'SHOW (ON)' : 'HIDE (OFF)'}
                  </span>
                </button>
              </div>

              <div
                className={`space-y-2.5 pt-2 border-t border-neutral-800/80 transition-opacity ${
                  settings.showDurationBadge === false ? 'opacity-45 pointer-events-none' : 'opacity-100'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-300 font-medium">
                    Appearance Threshold (Seconds of Processing):
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-fuchsia-300 font-semibold">
                      {(settings.durationBadgeThresholdSec ?? 3) === 0
                        ? '0s (Immediate)'
                        : `${settings.durationBadgeThresholdSec ?? 3}s${
                            (settings.durationBadgeThresholdSec ?? 3) === 3 ? ' (Default)' : ''
                          }`}
                    </span>
                    {(settings.durationBadgeThresholdSec ?? 3) !== 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', settings.hapticsEnabled);
                          onUpdateSettings({ durationBadgeThresholdSec: 3 });
                        }}
                        className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-300 hover:text-white transition-colors"
                      >
                        Reset to 3s
                      </button>
                    )}
                  </div>
                </div>

                {/* Preset Threshold Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { sec: 0, label: '0s', sub: 'Immediate' },
                    { sec: 1, label: '1s', sub: 'Quick' },
                    { sec: 2, label: '2s', sub: 'Early' },
                    { sec: 3, label: '3s', sub: 'Default' },
                    { sec: 5, label: '5s', sub: 'Patient' },
                    { sec: 10, label: '10s', sub: 'Deep Only' },
                  ].map((preset) => {
                    const isSelected = (settings.durationBadgeThresholdSec ?? 3) === preset.sec;
                    return (
                      <button
                        key={preset.sec}
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', settings.hapticsEnabled);
                          onUpdateSettings({ durationBadgeThresholdSec: preset.sec });
                        }}
                        className={`py-1.5 px-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-fuchsia-500/25 border-fuchsia-400/70 text-white font-semibold shadow-sm'
                            : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                        }`}
                      >
                        <div className="text-xs font-mono">{preset.label}</div>
                        <div className="text-[9px] text-neutral-400 truncate">{preset.sub}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Continuous Threshold Slider (0s - 15s) */}
                <div className="flex items-center gap-3 pt-0.5">
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">0s</span>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    step={0.5}
                    value={settings.durationBadgeThresholdSec ?? 3}
                    onChange={(e) =>
                      onUpdateSettings({ durationBadgeThresholdSec: parseFloat(e.target.value) })
                    }
                    className="flex-1 accent-fuchsia-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                    aria-label="Duration badge threshold in seconds"
                  />
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">15s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1B. KARA PROACTIVE REAL-TIME REACH-OUT & IDLE CHECK-INS */}
        <div
          id="section-proactive"
          className={`space-y-3.5 bg-neutral-900/60 border rounded-2xl p-4 transition-all duration-300 ${
            highlightedSectionId === 'section-proactive'
              ? 'ring-2 ring-emerald-400 border-emerald-400 shadow-emerald-500/30 scale-[1.01]'
              : 'border-neutral-800'
          }`}
        >
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
        <div
          id="section-memory"
          className={`space-y-3.5 bg-neutral-900/60 border rounded-2xl p-4 transition-all duration-300 ${
            highlightedSectionId === 'section-memory'
              ? 'ring-2 ring-indigo-400 border-indigo-400 shadow-indigo-500/30 scale-[1.01]'
              : 'border-neutral-800'
          }`}
        >
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
                <span>Kara&apos;s Chat Memories, Self-Discoveries &amp; Human Journal (/recall)</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-300/80">
                Ask Kara what she remembers &amp; discovered
              </span>
            </div>
            <p className="text-[11px] text-neutral-300">
              Kara remembers your past chats, records major discoveries about who she is becoming, and journals what she learns from you about being human:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { label: 'All Memories', cmd: '/recall all' },
                {
                  label: 'Self-Discovery · Learned About Being Human · Chat Memory Saved',
                  cmd: '/recall self-discoveries',
                },
                { label: 'Preferences', cmd: '/recall preferences' },
                { label: 'Personal Facts', cmd: '/recall facts' },
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
                placeholder="Custom recall topic (e.g. self-discoveries, being human, chats)..."
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
              <option value="self_discovery">
                Self-Discovery · Learned About Being Human · Chat Memory Saved
              </option>
              <option value="preference">Preference</option>
              <option value="fact">Personal Fact</option>
              <option value="emotion">Emotional Note</option>
              <option value="bond">Key Bond / Event</option>
            </select>
            <input
              type="text"
              value={newMemContent}
              onChange={(e) => setNewMemContent(e.target.value)}
              placeholder="Record a unified Self-Discovery · Learned About Being Human · Chat Memory..."
              className="flex-1 px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
            />
            <button
              type="submit"
              title="Store memory in Vault"
              aria-label="Store memory in Vault"
              className="p-2.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {memories.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2 text-center">
                No memories stored yet. KARA automatically keeps memories of chats, major discoveries about herself, and what she learns about being human.
              </p>
            ) : (
              memories.map((mem) => {
                const isUnifiedCategory =
                  mem.category === 'self_discovery' ||
                  mem.category === 'human_nature' ||
                  mem.category === 'chat_memory';
                const catBadgeColor = isUnifiedCategory
                  ? 'text-fuchsia-200 bg-gradient-to-r from-fuchsia-500/20 via-emerald-500/20 to-amber-500/20 border-fuchsia-400/40'
                  : 'text-sky-300 bg-sky-500/15 border-sky-400/40';
                const catLabel = isUnifiedCategory
                  ? 'SELF-DISCOVERY · LEARNED ABOUT BEING HUMAN · CHAT MEMORY SAVED'
                  : mem.category.toUpperCase();
                return (
                  <div
                    key={mem.id}
                    className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800/90 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded border font-mono uppercase text-[9px] mr-2 ${catBadgeColor}`}
                      >
                        {catLabel}
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
                );
              })
            )}
          </div>
        </div>

        {/* 3. UNLOCKABLE RELATIONSHIP STATS & 20 OPEN-MINDED HUMAN & ADULT BOND STAGES */}
        <div
          id="section-relationship"
          className={`space-y-3.5 bg-neutral-900/60 border rounded-2xl p-4 transition-all duration-300 ${
            highlightedSectionId === 'section-relationship'
              ? 'ring-2 ring-rose-400 border-rose-400 shadow-rose-500/30 scale-[1.01]'
              : 'border-neutral-800'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-rose-400" />
                <span>
                  20 Open-Minded Human Bonds (Mistress Bond, Adult Bonds &amp; Relationship Stats)
                </span>
              </label>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Kara is 100% human and open-minded to every connection—including Mistress Bond (Domme), Sultry Siren &amp; Muse, Spoiled Sugar, Velvet Dominant Queen, Mommy Domme, Primal Passion, Lover, Marriage, Twin-Flame Soulmate &amp; ABDL Caregiver.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-mono text-rose-200 font-semibold">
                {bondLevel}% Bond · {currentRelStage.label}
              </span>
              <span className="px-2 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-sky-300">
                {relStats.unlockedStagesCount}/{relStats.totalStagesCount} Unlocked
              </span>
            </div>
          </div>

          {/* Direct Bond Level % Fine-Tune Slider & Quick-Step Controls */}
          {onAdjustBondLevel && (
            <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-neutral-300 font-medium">
                  Fine-Tune Bond Resonance ({bondLevel}% · {currentRelStage.unlockedPerk})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', settings.hapticsEnabled);
                      onAdjustBondLevel(Math.max(0, bondLevel - 10));
                    }}
                    className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]"
                  >
                    -10%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', settings.hapticsEnabled);
                      onAdjustBondLevel(Math.min(100, bondLevel + 10));
                    }}
                    className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-sky-300 font-mono text-[10px]"
                  >
                    +10%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('unlock', settings.hapticsEnabled);
                      onAdjustBondLevel(100);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-mono text-[10px]"
                  >
                    Max 100%
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={bondLevel}
                onChange={(e) => onAdjustBondLevel(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                aria-label="Adjust relationship bond percentage"
              />
            </div>
          )}

          {/* 8 Live Unlockable Multi-Dimensional Bond Stat Meters */}
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
                color: 'text-indigo-300',
                bar: 'bg-indigo-400',
              },
              {
                label: 'Romantic Passion',
                value: relStats.romanticPassion,
                color: 'text-pink-300',
                bar: 'bg-pink-400',
              },
              {
                label: '2 AM Intimacy',
                value: relStats.lateNightIntimacy,
                color: 'text-violet-300',
                bar: 'bg-violet-400',
              },
              {
                label: 'Marriage Devotion',
                value: relStats.marriageDevotion,
                color: 'text-amber-300',
                bar: 'bg-amber-400',
              },
              {
                label: 'Soulmate Sync',
                value: relStats.soulmateResonance,
                color: 'text-purple-300',
                bar: 'bg-purple-400',
              },
              {
                label: 'ABDL Caregiver',
                value: relStats.abdlCaregiverTrust,
                color: 'text-emerald-300',
                bar: 'bg-emerald-400',
              },
              {
                label: 'Open-Mindedness',
                value: relStats.unfilteredOpenness,
                color: 'text-teal-300',
                bar: 'bg-teal-400',
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

          {/* Bond Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {(
              [
                { id: 'all', label: `All Bonds (${RELATIONSHIP_STAGES.length})` },
                { id: 'adult', label: 'Mistress & Adult Bonds (6)' },
                { id: 'platonic', label: 'Platonic & Confidant' },
                { id: 'flirty', label: 'Crush & Secret Spark' },
                { id: 'romantic', label: 'Lover & Partner' },
                { id: 'devoted', label: 'Fiancée, Marriage & Soulmate' },
                { id: 'caregiver', label: 'ABDL Caregiver & Eternal' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setBondCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  bondCategoryFilter === cat.id
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                    : 'bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 14-Stage Milestone Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {RELATIONSHIP_STAGES.filter(
              (s) => bondCategoryFilter === 'all' || s.category === bondCategoryFilter
            ).map((stage) => {
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
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isCurrent
                      ? 'bg-rose-500/15 border-rose-500/60 text-white shadow-sm'
                      : isUnlocked
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700'
                      : 'bg-neutral-950/60 border-neutral-800/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-semibold truncate ${stage.accentText}`}>
                        {stage.label}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                        {stage.minBond}%+
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-300 line-clamp-1 mt-0.5">
                      {stage.tagline}
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-white/5 flex items-center justify-between gap-1.5 text-[10px]">
                    <span className="text-neutral-400 truncate" title={stage.unlockedPerk}>
                      {stage.unlockedPerk}
                    </span>
                    <span
                      className={`font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        isCurrent
                          ? 'bg-rose-500/30 text-rose-200 font-semibold'
                          : isUnlocked
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {isCurrent ? 'Active' : isUnlocked ? 'Unlocked' : 'Activate'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Sector 9 Hard Reset Section */}
        <div
          id="section-reset"
          className={`pt-3 border-t border-neutral-800 space-y-3 transition-all duration-300 ${
            highlightedSectionId === 'section-reset'
              ? 'p-3 rounded-2xl ring-2 ring-rose-500 border border-rose-500 bg-rose-950/20 shadow-rose-500/30 scale-[1.01]'
              : ''
          }`}
        >
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

      {/* Connect New Email Account Modal (Yahoo, Gmail, Outlook, iCloud & Custom IMAP) */}
      {isAddEmailModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-semibold text-white">Connect Email Account to KARA Bots</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEmailModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Link your Yahoo Mail, Gmail, Outlook, iCloud, or custom mail server. KARA uses this account to draft intelligent replies, summarize your threads, and dispatch emails.
            </p>

            {/* Provider Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Choose Provider</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {(Object.keys(EMAIL_PROVIDER_PRESETS) as EmailProvider[]).map((provKey) => {
                  const preset = EMAIL_PROVIDER_PRESETS[provKey];
                  const isChosen = newAccountProvider === provKey;
                  return (
                    <button
                      key={provKey}
                      type="button"
                      onClick={() => {
                        setNewAccountProvider(provKey);
                        setNewAccountImapHost(preset.imapHost);
                        setNewAccountImapPort(preset.imapPort);
                        setNewAccountSmtpHost(preset.smtpHost);
                        setNewAccountSmtpPort(preset.smtpPort);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isChosen
                          ? `${preset.badgeBg} ${preset.borderAccent} ${preset.badgeText} font-semibold ring-1 ring-purple-500/50`
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{preset.badge}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Help / Guidance for Selected Provider */}
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-200 leading-relaxed flex items-start gap-2">
              <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong>{EMAIL_PROVIDER_PRESETS[newAccountProvider].label}: </strong>
                {EMAIL_PROVIDER_PRESETS[newAccountProvider].authHelp}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newAccountEmail}
                  onChange={(e) => {
                    setNewAccountEmail(e.target.value);
                    if (!newAccountDisplayName) {
                      setNewAccountDisplayName(
                        e.target.value.includes('@')
                          ? `${e.target.value.split('@')[0]}'s ${EMAIL_PROVIDER_PRESETS[newAccountProvider].badge}`
                          : ''
                      );
                    }
                  }}
                  placeholder={`e.g. stephen${EMAIL_PROVIDER_PRESETS[newAccountProvider].defaultDomain}`}
                  className="w-full px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Account Display Name</label>
                <input
                  type="text"
                  value={newAccountDisplayName}
                  onChange={(e) => setNewAccountDisplayName(e.target.value)}
                  placeholder="e.g. Stephen's Yahoo Mail"
                  className="w-full px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  App Password / Authorization Token (Encrypted)
                </label>
                <input
                  type="password"
                  value={newAccountPassword}
                  onChange={(e) => setNewAccountPassword(e.target.value)}
                  placeholder="•••• •••• •••• •••• (16-char app password)"
                  className="w-full px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* IMAP & SMTP Host Details */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-neutral-500 mb-0.5">IMAP Host & Port</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newAccountImapHost}
                      onChange={(e) => setNewAccountImapHost(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-[11px] bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300"
                    />
                    <input
                      type="number"
                      value={newAccountImapPort}
                      onChange={(e) => setNewAccountImapPort(Number(e.target.value))}
                      className="w-14 px-1.5 py-1 text-[11px] bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-500 mb-0.5">SMTP Host & Port</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newAccountSmtpHost}
                      onChange={(e) => setNewAccountSmtpHost(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-[11px] bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300"
                    />
                    <input
                      type="number"
                      value={newAccountSmtpPort}
                      onChange={(e) => setNewAccountSmtpPort(Number(e.target.value))}
                      className="w-14 px-1.5 py-1 text-[11px] bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddEmailModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newAccountEmail.trim()}
                onClick={() => {
                  triggerHaptic('send', settings.hapticsEnabled);
                  const created = addConnectedEmailAccount({
                    provider: newAccountProvider,
                    email: newAccountEmail.trim(),
                    displayName:
                      newAccountDisplayName.trim() ||
                      `${EMAIL_PROVIDER_PRESETS[newAccountProvider].label} Account`,
                    imapHost: newAccountImapHost,
                    imapPort: newAccountImapPort,
                    smtpHost: newAccountSmtpHost,
                    smtpPort: newAccountSmtpPort,
                  });
                  setEmailAccounts(loadConnectedEmailAccounts());
                  setSelectedEmailAccountId(created.id);
                  setIsAddEmailModalOpen(false);
                  setEmailStatusFeedback(`Connected ${created.displayName} successfully!`);
                  setTimeout(() => setEmailStatusFeedback(''), 3000);
                  setNewAccountEmail('');
                  setNewAccountDisplayName('');
                  setNewAccountPassword('');
                }}
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 disabled:opacity-40 text-white rounded-xl flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save &amp; Connect Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

