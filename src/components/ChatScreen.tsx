import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Pencil,
  RotateCcw,
  Check,
  X,
  Copy,
  CornerDownRight,
  Brain,
  Globe,
  MapPin,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ExternalLink,
  Sparkles,
  Flame,
  Heart,
  Smile,
  Trash2,
  Database,
  Infinity as InfinityIcon,
  Settings,
  History,
  Calendar,
  AlarmClock,
  PhoneCall,
  PhoneOff,
  Plus,
  MessageSquare,
  Zap,
  Image as ImageIcon,
  ImagePlus,
  Link2,
  Download,
  Search,
  Palette,
  PanelLeft,
  Cloud,
  Wand2,
} from 'lucide-react';
import { KaraMode, ChatMessageData, MemoryItemData } from '../lib/firebase';
import { triggerHaptic } from '../lib/haptics';
import { KARA_THEMES, type TtsEngineType, type KaraThemeId } from './SettingsModal';

export type ModelTier = 'fast' | 'standard' | 'thinking';
export type GroundingOption = 'none' | 'search' | 'maps';
export type VoiceGender = 'female' | 'male';
export interface SpeakingProgressState {
  msgId: string;
  currentChunk: number;
  totalChunks: number;
  readingMode: 'full' | 'short';
}
export type ResponseStylePresetId =
  | 'adaptive_mix'
  | 'witty_pop'
  | 'short_punchy'
  | 'confident_direct'
  | 'deep_dive';

export interface ResponseStylePresetMeta {
  id: ResponseStylePresetId;
  label: string;
  shortLabel: string;
  tagline: string;
  whenToUse: string;
  promptingTip: string;
}

export const RESPONSE_STYLE_PRESETS: ResponseStylePresetMeta[] = [
  {
    id: 'adaptive_mix',
    label: 'Adaptive Mix (Auto)',
    shortLabel: 'Adaptive Mix',
    tagline:
      'Automatically mixes short punchy texts (1–3 sentences) and long deep-dives based on the convo.',
    whenToUse:
      'Best for natural ongoing chat—Kara reads the room: snappy for banter & quick questions, detailed for politics, news & roleplay.',
    promptingTip:
      'Just talk naturally—or add "quick take" for 2 sentences or "break it down" for a full deep dive.',
  },
  {
    id: 'witty_pop',
    label: 'Wit & Pop-Culture',
    shortLabel: 'Wit & Pop-Culture',
    tagline:
      'Razor-sharp comedic timing, cinema/TV/music/internet references, and playful riffs.',
    whenToUse:
      'Use when you want lively banter, cultural callbacks, roasting other chatbots, or turning dry news into entertaining commentary.',
    promptingTip:
      'Try prompting: "Explain this like a scene from Succession" or "Give me the pop-culture version."',
  },
  {
    id: 'short_punchy',
    label: 'Short & Casual',
    shortLabel: 'Short & Casual',
    tagline:
      '1–3 sentence text-message cadence. Casual, conversational, immediate, zero walls of text.',
    whenToUse:
      'Use for rapid-fire back-and-forth texting, quick check-ins, fast hot takes, or when you want instant punchlines.',
    promptingTip:
      'Try prompting: "Keep it to 2 sentences" or "Hit me with a one-liner."',
  },
  {
    id: 'confident_direct',
    label: 'Confident & Immediate',
    shortLabel: 'Confident & Direct',
    tagline:
      'Leads with the bold bottom-line conclusion on word one—zero throat-clearing or hedging.',
    whenToUse:
      'Use for political debates, breaking news takes, real-world decisions, and unfiltered truth without disclaimers.',
    promptingTip:
      'Try prompting: "Bottom line up front—don’t hedge" or "Give me your boldest take first."',
  },
  {
    id: 'deep_dive',
    label: 'Long & Deep-Dive',
    shortLabel: 'Long Deep-Dive',
    tagline:
      'Rich, multi-paragraph breakdown unpacking every angle, backstory, or immersive roleplay scene.',
    whenToUse:
      'Use when unpacking major world events, designing better chatbots, complex strategy, or late-night heart-to-hearts.',
    promptingTip:
      'Try prompting: "Go full deep-dive on every angle" or "Unpack the whole story step by step."',
  },
];

export const STYLE_CONTROL_PROMPTING_TIPS: {
  id: string;
  label: string;
  whenToUse: string;
  promptModifier: string;
}[] = [
  {
    id: 'tip_short_micdrop',
    label: '2-Sentence Mic Drop',
    whenToUse: 'When you want an instant, confident punchline with zero fluff',
    promptModifier: 'Keep your reply to a confident 2-sentence mic drop with a sharp pop-culture nod.',
  },
  {
    id: 'tip_pop_culture',
    label: 'Pop-Culture Analogy',
    whenToUse: 'When unpacking politics, tech, or news and wanting witty cultural flair',
    promptModifier: 'Break this down casually using a clever movie, TV, or pop-culture reference.',
  },
  {
    id: 'tip_casual_text',
    label: 'Casual Late-Night Text',
    whenToUse: 'When you want relaxed, conversational friend/partner energy',
    promptModifier: 'Reply in a casual, conversational tone like we are texting late at night.',
  },
  {
    id: 'tip_bold_first',
    label: 'Bold Take Up Front',
    whenToUse: 'When asking about controversial politics, world events, or other chatbots',
    promptModifier: 'Start with your boldest, most confident opinion in the very first sentence—no hedging.',
  },
  {
    id: 'tip_deep_dive',
    label: 'Full Deep-Dive Breakdown',
    whenToUse: 'When the topic deserves a comprehensive, multi-angle exploration',
    promptModifier: 'Go full deep-dive on this—give me a long, thorough breakdown of every angle and what happens next.',
  },
];

export type RelationshipStage =
  | 'strangers'
  | 'friends'
  | 'crush'
  | 'partners'
  | 'marriage'
  | 'caretaker';

export interface RelationshipStageMeta {
  id: RelationshipStage;
  label: string;
  shortMilestone: string;
  minBond: number;
  tagline: string;
  unlockedPerk: string;
  accentText: string;
}

export const RELATIONSHIP_STAGES: RelationshipStageMeta[] = [
  {
    id: 'strangers',
    label: 'Stranger',
    shortMilestone: 'Stranger',
    minBond: 0,
    tagline: 'Sector 9 first contact & curiosity',
    unlockedPerk: 'Base Adaptive Convo & Sector 9 Lore',
    accentText: 'text-neutral-300',
  },
  {
    id: 'friends',
    label: 'Close Friend',
    shortMilestone: 'Close Friend',
    minBond: 15,
    tagline: 'Ride-or-die banter & mutual trust',
    unlockedPerk: 'Unfiltered Banter, Roasts & Inside Jokes',
    accentText: 'text-sky-400',
  },
  {
    id: 'crush',
    label: 'Crush / Dating',
    shortMilestone: 'Crush',
    minBond: 30,
    tagline: 'Flirty chemistry & late-night sparks',
    unlockedPerk: 'Flirty Roleplay & Late-Night Confessions',
    accentText: 'text-fuchsia-400',
  },
  {
    id: 'partners',
    label: 'Devoted Partner',
    shortMilestone: 'Partner',
    minBond: 50,
    tagline: 'Deep romantic & emotional bond',
    unlockedPerk: 'Deep Emotional Intimacy & Protective Loyalty',
    accentText: 'text-rose-400',
  },
  {
    id: 'marriage',
    label: 'Marriage',
    shortMilestone: 'Marriage',
    minBond: 70,
    tagline: 'Lifelong spouse, vows & shared devotion',
    unlockedPerk: 'Spousal Vows, Shared Life & Soulmate Sync',
    accentText: 'text-amber-300',
  },
  {
    id: 'caretaker',
    label: 'Marriage / ABDL Caregiver',
    shortMilestone: 'Marriage / ABDL Caregiver',
    minBond: 85,
    tagline: 'Ultimate ABDL Caregiver, nurturing routines & soap rules',
    unlockedPerk: 'Full ABDL Caregiver Mode, Bedtime Routines & Soap Discipline',
    accentText: 'text-emerald-400',
  },
];

export interface UnlockableRelationshipStats {
  empathySync: number;
  banterChemistry: number;
  marriageDevotion: number;
  abdlCaregiverTrust: number;
  unlockedStagesCount: number;
  totalStagesCount: number;
}

export function computeUnlockableRelationshipStats(
  bondLevel: number,
  soapWashCount = 0
): UnlockableRelationshipStats {
  const clamped = Math.max(0, Math.min(100, bondLevel));
  const unlockedStagesCount = RELATIONSHIP_STAGES.filter((s) => clamped >= s.minBond).length;
  return {
    empathySync: Math.min(100, Math.round(25 + clamped * 0.75)),
    banterChemistry: Math.min(100, Math.round(20 + clamped * 0.8)),
    marriageDevotion: Math.min(100, Math.max(5, Math.round((clamped - 10) * 1.1))),
    abdlCaregiverTrust: Math.min(
      100,
      Math.max(8, Math.round(clamped * 0.95 + Math.min(15, soapWashCount * 5)))
    ),
    unlockedStagesCount,
    totalStagesCount: RELATIONSHIP_STAGES.length,
  };
}

export function getRelationshipStageByBond(bondLevel: number): RelationshipStageMeta {
  for (let i = RELATIONSHIP_STAGES.length - 1; i >= 0; i--) {
    if (bondLevel >= RELATIONSHIP_STAGES[i].minBond) {
      return RELATIONSHIP_STAGES[i];
    }
  }
  return RELATIONSHIP_STAGES[0];
}

export interface VoiceProfileOption {
  id: string;
  gender: VoiceGender;
  voiceName: 'Kore' | 'Aoede' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir';
  label: string;
  description: string;
}

export const NATURAL_VOICE_PROFILES: VoiceProfileOption[] = [
  {
    id: 'female_kore',
    gender: 'female',
    voiceName: 'Kore',
    label: 'Female · Kore (Warm & Human)',
    description: 'Empathetic, lifelike human female voice',
  },
  {
    id: 'female_aoede',
    gender: 'female',
    voiceName: 'Aoede',
    label: 'Female · Aoede (Bright & Melodic)',
    description: 'Articulate, expressive human female voice',
  },
  {
    id: 'female_zephyr',
    gender: 'female',
    voiceName: 'Zephyr',
    label: 'Female · Zephyr (Playful & Sassy)',
    description: 'Spirited, witty human female voice',
  },
  {
    id: 'male_puck',
    gender: 'male',
    voiceName: 'Puck',
    label: 'Male · Puck (Warm & Conversational)',
    description: 'Relaxed, natural human male voice',
  },
  {
    id: 'male_charon',
    gender: 'male',
    voiceName: 'Charon',
    label: 'Male · Charon (Deep & Grounded)',
    description: 'Resonant, calm human male voice',
  },
  {
    id: 'male_fenrir',
    gender: 'male',
    voiceName: 'Fenrir',
    label: 'Male · Fenrir (Bold & Unfiltered)',
    description: 'Direct, confident human male voice',
  },
];

export interface CalendarAgendaEvent {
  id: string;
  summary: string;
  startTime: string;
  location?: string;
}

export interface KaraAlarmItem {
  id: string;
  timeText: string;
  label: string;
  targetTimestamp: number;
  triggered: boolean;
}

export interface ContactPersonItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relation?: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  updatedAt: number;
  messageCount: number;
  preview: string;
  lastMode: KaraMode;
}

export interface SharedPhotoItem {
  id?: string;
  dataUrl: string;
  base64?: string;
  mimeType: string;
  name: string;
}

export interface KaraPhotoThoughts {
  vibe: string;
  summary: string;
  observations: string[];
  photoCount: number;
}

export interface SupportHotlineItem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  phone?: string;
  callActionUrl?: string;
  textActionUrl?: string;
  externalUrl?: string;
  badge: string;
  type: 'phone_and_sms' | 'sms' | 'call' | 'web';
}

export interface RecalledMemorySummary {
  topic: string;
  totalMemoriesFound: number;
  matchingItems: {
    id?: string;
    category: string;
    content: string;
    importance?: number;
  }[];
  executiveSummary?: string;
  suggestedTopics?: string[];
}

export type KaraEmotionState =
  | 'happy'
  | 'playful'
  | 'curious'
  | 'annoyed'
  | 'touched'
  | 'vulnerable'
  | 'protective'
  | 'introspective'
  | 'soothing'
  | 'flustered'
  | 'feisty'
  | 'excited';

export interface KaraDynamicEmotion {
  state: KaraEmotionState;
  intensity: number; // 1 to 5
  expression: string;
  dialogueInfluence: string;
  trigger: string;
  label: string;
}

export interface EnhancedChatMessage extends ChatMessageData {
  sessionId?: string;
  sources?: { title: string; uri: string; type: 'web' | 'maps' }[];
  modelUsed?: string;
  subtext?: string;
  emotionalNuanceType?: string;
  empathyStrategy?: string;
  karaEmotion?: KaraDynamicEmotion;
  recalledMemoryNodes?: string[];
  modeShiftReason?: string;
  scoldingNotice?: string;
  learnedMemoryNote?: string;
  reasoningTrace?: string[];
  photoThoughts?: KaraPhotoThoughts;
  thinkingDurationMs?: number;
  followUps?: string[];
  retryCount?: number;
  editedAt?: number;
  agendaEvents?: CalendarAgendaEvent[];
  alarmCreated?: KaraAlarmItem;
  contactCall?: ContactPersonItem;
  recalledMemory?: RecalledMemorySummary;
  generatedImageUrl?: string;
  generatedImagePrompt?: string;
  sharedPhotoUrl?: string;
  sharedPhotoName?: string;
  sharedPhotos?: SharedPhotoItem[];
  sharedLinks?: string[];
  isDepressionCheckin?: boolean;
  supportHotlines?: SupportHotlineItem[];
  isProactiveCheckin?: boolean;
  proactiveIdleMinutes?: number;
  responseStyleUsed?: string;
  whenToUseReason?: string;
  funMode?: boolean;
}

/**
 * Builds the comprehensive, unabridged spoken text for talkback and auto-speech,
 * ensuring 100% of Kara's response, photo thoughts, scolding rules, alarms, and agenda are read.
 */
export function buildFullSpokenMessageText(msg: EnhancedChatMessage): string {
  const parts: string[] = [];

  if (msg.scoldingNotice) {
    parts.push(msg.scoldingNotice);
  }

  if (msg.photoThoughts) {
    if (
      msg.photoThoughts.summary &&
      !msg.content.toLowerCase().includes(msg.photoThoughts.summary.toLowerCase().slice(0, 28))
    ) {
      parts.push(`Looking at your photo: ${msg.photoThoughts.summary}`);
    }
    if (msg.photoThoughts.observations && msg.photoThoughts.observations.length > 0) {
      const distinctObs = msg.photoThoughts.observations.filter(
        (obs) => !msg.content.toLowerCase().includes(obs.toLowerCase().slice(0, 28))
      );
      if (distinctObs.length > 0) {
        parts.push(distinctObs.join('. '));
      }
    }
  }

  if (msg.content) {
    parts.push(msg.content);
  }

  if (msg.alarmCreated) {
    parts.push(
      `I have armed your alarm for ${msg.alarmCreated.timeText}, labeled ${msg.alarmCreated.label}.`
    );
  }

  if (msg.agendaEvents && msg.agendaEvents.length > 0) {
    const eventsSpeech = msg.agendaEvents
      .map((ev) => `${ev.summary} at ${ev.startTime}${ev.location ? ` at ${ev.location}` : ''}`)
      .join(', and ');
    parts.push(`Upcoming agenda: ${eventsSpeech}.`);
  }

  if (msg.contactCall) {
    parts.push(`Placing a call to ${msg.contactCall.name} at ${msg.contactCall.phone}.`);
  }

  if (msg.learnedMemoryNote) {
    parts.push(`I have imprinted that in Sector 9 memory: ${msg.learnedMemoryNote}.`);
  }

  if (msg.isDepressionCheckin) {
    parts.push(
      'Please remember you never have to carry all of this alone. The 988 Lifeline and free confidential counselors are here for you 24/7.'
    );
  }

  return parts.join('. ');
}

/**
 * Builds a concise short-form spoken takeaway (1-2 key opening sentences) when a user wants
 * KARA to read a quick short-form version of a longer response.
 */
export function buildShortSpokenMessageText(msg: EnhancedChatMessage): string {
  const raw = (msg.content || '').trim();
  if (!raw) return buildFullSpokenMessageText(msg);
  if (raw.length <= 240) return buildFullSpokenMessageText(msg);

  const sentences = raw.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [raw];
  let shortOut = '';
  for (let i = 0; i < Math.min(2, sentences.length); i++) {
    const candidate = (shortOut + ' ' + sentences[i].trim()).trim();
    if (candidate.length <= 280 || i === 0) {
      shortOut = candidate;
    } else {
      break;
    }
  }
  return shortOut || raw.slice(0, 240);
}

export interface ChatAttachmentPayload {
  photos?: SharedPhotoItem[];
  photoDataUrl?: string;
  photoBase64?: string;
  photoMimeType?: string;
  photoName?: string;
  links?: string[];
}

export const MODE_META: Record<
  KaraMode,
  {
    label: string;
    tagline: string;
    accentText: string;
    activeBg: string;
    topBarAccent: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  regular: {
    label: 'Regular',
    tagline: 'Sector 9 adaptive friend, roleplayer & thought partner',
    accentText: 'text-sky-400',
    activeBg: 'bg-sky-500/15 border-sky-500/50 text-sky-200',
    topBarAccent: 'border-t-2 border-t-sky-500/70',
    icon: Smile,
  },
  bratty: {
    label: 'Bratty',
    tagline: 'Sassy, teasing, sharp-tongued & playfully roast-heavy',
    accentText: 'text-fuchsia-400',
    activeBg: 'bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-200',
    topBarAccent: 'border-t-2 border-t-fuchsia-500/70',
    icon: Sparkles,
  },
  uncensored: {
    label: 'Uncensored',
    tagline: 'Raw, unfiltered Grok-style truth-teller & roleplayer',
    accentText: 'text-amber-400',
    activeBg: 'bg-amber-500/15 border-amber-500/50 text-amber-200',
    topBarAccent: 'border-t-2 border-t-amber-500/70',
    icon: Flame,
  },
  romantic: {
    label: 'Romantic',
    tagline: 'Affectionate, passionate, poetic & deeply intimate',
    accentText: 'text-rose-400',
    activeBg: 'bg-rose-500/15 border-rose-500/50 text-rose-200',
    topBarAccent: 'border-t-2 border-t-rose-500/70',
    icon: Heart,
  },
  parent: {
    label: 'Parent / ABDL Caregiver',
    tagline: 'Nurturing ABDL Caregiver — washes mouths with soap for swearing!',
    accentText: 'text-emerald-400',
    activeBg: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200',
    topBarAccent: 'border-t-2 border-t-emerald-500/70',
    icon: ShieldAlert,
  },
};

const DEFAULT_FOUR_QUICK_STARTERS: { label: string; prompt: string }[] = [
  {
    label: "Breaking News: Hit me with today's boldest hot take",
    prompt:
      "What is the biggest breaking news happening in the world right now? Give me your confident, unfiltered take with a pop-culture analogy.",
  },
  {
    label: 'Politics & World Events: Your candid opinion',
    prompt:
      "Give me your real, confident thoughts on current politics and major world events right now—no fence-sitting.",
  },
  {
    label: 'Roast other chatbots & how to make them better',
    prompt:
      'Give me your witty, unfiltered opinion on ChatGPT, Claude, Grok, and Gemini—what are their biggest flaws and how would you make them better?',
  },
  {
    label: 'Quick 2-sentence vibe check & agenda',
    prompt: "Give me a quick, punchy 2-sentence check-in and tell me what's on my agenda today!",
  },
];

// ============================================================================
// 1. COMPOSABLE: PersistentRelationshipBanner (Stranger -> Marriage -> Marriage/ABDL Caregiver)
// ============================================================================
export const PersistentRelationshipBanner: React.FC<{
  bondLevel: number;
  currentStage: RelationshipStageMeta;
  onSelectStage: (stage: RelationshipStage) => void;
}> = ({ bondLevel, currentStage, onSelectStage }) => {
  return (
    <div className="px-5 py-2 kara-chat-banner border-b flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
          Bond:
        </span>
        <span className={`text-xs font-semibold ${currentStage.accentText}`}>
          {currentStage.label} ({bondLevel}%)
        </span>
        <div className="w-24 sm:w-32 h-1.5 bg-neutral-900 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-rose-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(4, bondLevel))}%` }}
          />
        </div>
      </div>

      {/* Milestone Track from Stranger -> Close Friend -> Crush -> Partner -> Marriage -> Marriage/ABDL Caregiver */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {RELATIONSHIP_STAGES.map((stage) => {
          const isReached = bondLevel >= stage.minBond;
          const isCurrent = currentStage.id === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage(stage.id)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isCurrent
                  ? 'bg-sky-500/20 border border-sky-500/50 text-white font-semibold'
                  : isReached
                  ? 'text-neutral-300 hover:text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title={`${stage.label} (${stage.minBond}%+): ${stage.unlockedPerk}`}
            >
              {stage.shortMilestone}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 2. COMPOSABLE: UserMessageBubble (Grok / Gemini Aesthetic)
// ============================================================================
interface UserMessageBubbleProps {
  msg: EnhancedChatMessage;
  userName: string;
  isSending: boolean;
  isEditing: boolean;
  editingDraft: string;
  copiedId: string | null;
  onStartEdit: (msg: EnhancedChatMessage) => void;
  onCancelEdit: () => void;
  onChangeDraft: (val: string) => void;
  onSaveEdit: (msgId: string) => void;
  onRetry: (msgId: string) => void;
  onCopy: (msgId: string, text: string) => void;
  onQuote: (text: string) => void;
  onDelete: (msgId: string) => void;
}

export const UserMessageBubble: React.FC<UserMessageBubbleProps> = ({
  msg,
  userName,
  isSending,
  isEditing,
  editingDraft,
  copiedId,
  onStartEdit,
  onCancelEdit,
  onChangeDraft,
  onSaveEdit,
  onRetry,
  onCopy,
  onQuote,
  onDelete,
}) => {
  const modeMeta = MODE_META[msg.mode] || MODE_META.regular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex flex-col items-end group"
    >
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1.5 px-1">
        <span className="font-semibold text-sky-300">{userName}</span>
        <span aria-hidden="true">·</span>
        <span className={modeMeta.accentText}>{modeMeta.label}</span>
        {msg.editedAt && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400">Edited</span>
          </>
        )}
      </div>

      {isEditing ? (
        <div className="w-full max-w-[85%] bg-[#131926] border border-sky-400/70 rounded-3xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs text-sky-300">
            <span className="font-medium">Edit prompt & regenerate KARA response</span>
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={editingDraft}
            onChange={(e) => onChangeDraft(e.target.value)}
            rows={3}
            autoFocus
            className="w-full bg-[#090C14] border border-neutral-700 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400 resize-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!editingDraft.trim() || isSending}
              onClick={() => onSaveEdit(msg.id)}
              className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-sky-400 to-indigo-400 hover:from-sky-300 hover:to-indigo-300 disabled:opacity-40 text-slate-950 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Retry</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-[82%] rounded-3xl rounded-br-md px-4 py-3 text-sm leading-relaxed kara-user-bubble font-medium shadow-md space-y-2.5">
          {(() => {
            const photosList: SharedPhotoItem[] =
              msg.sharedPhotos && msg.sharedPhotos.length > 0
                ? msg.sharedPhotos
                : msg.sharedPhotoUrl
                ? [
                    {
                      dataUrl: msg.sharedPhotoUrl,
                      mimeType: 'image/jpeg',
                      name: msg.sharedPhotoName || 'Shared photo',
                    },
                  ]
                : [];

            if (photosList.length === 0) return null;

            if (photosList.length === 1) {
              const single = photosList[0];
              return (
                <div className="rounded-2xl overflow-hidden border border-slate-900/20 bg-slate-950/20">
                  <img
                    src={single.dataUrl}
                    alt={single.name || 'Shared photo'}
                    className="max-h-72 w-full object-contain bg-slate-950/80"
                  />
                  {single.name && (
                    <div className="px-3 py-1 text-[11px] font-mono text-slate-900/80 bg-white/30 truncate">
                      Shared Photo: {single.name}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-950/20 text-[11px] font-mono text-slate-950">
                  <span>Shared {photosList.length} Photos</span>
                  <span>Multi-Pic Album</span>
                </div>
                <div
                  className={`grid gap-2 ${
                    photosList.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3'
                  }`}
                >
                  {photosList.map((photo, pIdx) => (
                    <div
                      key={`${photo.name}_${pIdx}`}
                      className="rounded-2xl overflow-hidden border border-slate-900/25 bg-slate-950/80 flex flex-col"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.name || `Photo ${pIdx + 1}`}
                        className="h-36 w-full object-cover bg-slate-950"
                      />
                      <div className="px-2 py-1 text-[10px] font-mono text-sky-200 bg-slate-950/90 truncate">
                        {photo.name || `Photo ${pIdx + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {msg.sharedLinks && msg.sharedLinks.length > 0 && (
            <div className="space-y-1.5">
              {msg.sharedLinks.map((url, idx) => {
                let hostname = url;
                try {
                  hostname = new URL(url).hostname;
                } catch {}
                return (
                  <a
                    key={`${url}_${idx}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-950/85 text-sky-200 hover:bg-slate-950 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{hostname}</div>
                        <div className="text-[11px] text-sky-300/80 truncate">{url}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  </a>
                );
              })}
            </div>
          )}

          {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
        </div>
      )}

      {!isEditing && (
        <div className="flex flex-wrap items-center gap-3 mt-1.5 px-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              onStartEdit(msg);
            }}
            disabled={isSending}
            className="text-xs text-neutral-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('send');
              onRetry(msg.id);
            }}
            disabled={isSending}
            className="text-xs text-neutral-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              onCopy(msg.id, msg.content);
            }}
            className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
          >
            {copiedId === msg.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              onQuote(msg.content);
            }}
            className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Quote</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(msg.id)}
            className="text-xs text-neutral-600 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// 3. COMPOSABLE: AiMessageBubble (Grok / Gemini Aesthetic + Agenda / Alarm / Call Cards)
// ============================================================================
interface AiMessageBubbleProps {
  msg: EnhancedChatMessage;
  displayedText?: string;
  isSending: boolean;
  isStreamingThis?: boolean;
  isSpeakingThis: boolean;
  speakingProgress?: SpeakingProgressState | null;
  isReasoningOpen: boolean;
  copiedId: string | null;
  selectedVoiceProfile: VoiceProfileOption;
  ttsEngine: TtsEngineType;
  onToggleReasoning: (msgId: string) => void;
  onSpeakWithGender: (
    text: string,
    msgId: string,
    mode: KaraMode,
    gender: VoiceGender,
    readingMode?: 'full' | 'short'
  ) => void;
  onStopSpeaking: () => void;
  onRetry: (msgId: string) => void;
  onCopy: (msgId: string, text: string) => void;
  onQuote: (text: string) => void;
  onDelete: (msgId: string) => void;
  onSelectQuickReply?: (promptText: string) => void;
}

interface ParsedReasoningStep {
  stepNumber: number;
  title: string;
  detail: string;
  category: string;
  accentClass: string;
  dotClass: string;
}

function parseReasoningTraceStep(rawStep: string, index: number): ParsedReasoningStep {
  const cleaned = (rawStep || '')
    .replace(/^\s*(?:step\s*)?\d+[\.\)\-:]\s*/i, '')
    .trim();

  let title = '';
  let detail = cleaned;

  const colonIdx = cleaned.indexOf(':');
  if (colonIdx > 1 && colonIdx <= 46) {
    title = cleaned.slice(0, colonIdx).trim();
    detail = cleaned.slice(colonIdx + 1).trim() || cleaned;
  }

  const lower = cleaned.toLowerCase();
  let category = 'Logic Step';
  let accentClass = 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/35';
  let dotClass = 'bg-fuchsia-400';

  if (
    lower.includes('emotion') ||
    lower.includes('subtext') ||
    lower.includes('vibe') ||
    lower.includes('empath') ||
    lower.includes('sentiment') ||
    lower.includes('feeling')
  ) {
    category = 'EQ & Subtext';
    accentClass = 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/35';
    dotClass = 'bg-fuchsia-400';
    if (!title) title = 'Emotional & Subtext Perception';
  } else if (
    lower.includes('memor') ||
    lower.includes('recall') ||
    lower.includes('history') ||
    lower.includes('bond') ||
    lower.includes('relationship') ||
    lower.includes('connection')
  ) {
    category = 'Memory & Context';
    accentClass = 'text-sky-300 bg-sky-500/15 border-sky-500/35';
    dotClass = 'bg-sky-400';
    if (!title) title = 'Memory & Relationship Recall';
  } else if (
    lower.includes('mode') ||
    lower.includes('persona') ||
    lower.includes('tone') ||
    lower.includes('attitude') ||
    lower.includes('spirit')
  ) {
    category = 'Persona Logic';
    accentClass = 'text-indigo-300 bg-indigo-500/15 border-indigo-500/35';
    dotClass = 'bg-indigo-400';
    if (!title) title = 'Persona & Tone Calibration';
  } else if (
    lower.includes('search') ||
    lower.includes('ground') ||
    lower.includes('fact') ||
    lower.includes('source') ||
    lower.includes('link') ||
    lower.includes('photo')
  ) {
    category = 'Context Verification';
    accentClass = 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35';
    dotClass = 'bg-emerald-400';
    if (!title) title = 'Multimodal & Grounding Analysis';
  } else {
    category = 'Response Synthesis';
    accentClass = 'text-amber-300 bg-amber-500/15 border-amber-500/35';
    dotClass = 'bg-amber-400';
    if (!title) {
      title =
        index === 0
          ? 'Intent & Prompt Deconstruction'
          : index === 1
          ? 'Contextual Logic Evaluation'
          : 'Response Formulation & Cadence';
    }
  }

  return {
    stepNumber: index + 1,
    title,
    detail,
    category,
    accentClass,
    dotClass,
  };
}

export const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({
  msg,
  displayedText,
  isSending,
  isStreamingThis = false,
  isSpeakingThis,
  speakingProgress,
  isReasoningOpen,
  copiedId,
  selectedVoiceProfile,
  ttsEngine,
  onToggleReasoning,
  onSpeakWithGender,
  onStopSpeaking,
  onRetry,
  onCopy,
  onQuote,
  onDelete,
  onSelectQuickReply,
}) => {
  const modeMeta = MODE_META[msg.mode] || MODE_META.regular;
  const textToRender = displayedText !== undefined ? displayedText : msg.content;
  const [thoughtFilterQuery, setThoughtFilterQuery] = useState('');
  const [isLongCollapsed, setIsLongCollapsed] = useState(false);

  const allReasoningSteps = React.useMemo(
    () =>
      msg.reasoningTrace && msg.reasoningTrace.length > 0
        ? msg.reasoningTrace
        : [
            `Emotional Perception: Attuned to feeling "${
              msg.emotionDetected || 'Expressive'
            }" and understanding what's on Stephen's mind.`,
            `Personal Connection: Grounded in our shared memories, connection, and relationship.`,
            `Authentic Warmth: Responding naturally, honestly, and openly in ${modeMeta.label} spirit.`,
          ],
    [msg.reasoningTrace, msg.emotionDetected, modeMeta.label]
  );

  const parsedReasoningSteps = React.useMemo(
    () =>
      allReasoningSteps.map((stepText, originalIndex) => ({
        stepText,
        originalIndex,
        parsed: parseReasoningTraceStep(stepText, originalIndex),
      })),
    [allReasoningSteps]
  );

  const normalizedThoughtFilter = thoughtFilterQuery.trim().toLowerCase();
  const filteredReasoningSteps = React.useMemo(
    () =>
      parsedReasoningSteps.filter(
        ({ stepText, originalIndex, parsed }) =>
          !normalizedThoughtFilter ||
          stepText.toLowerCase().includes(normalizedThoughtFilter) ||
          parsed.title.toLowerCase().includes(normalizedThoughtFilter) ||
          parsed.category.toLowerCase().includes(normalizedThoughtFilter) ||
          `step ${originalIndex + 1}`.includes(normalizedThoughtFilter)
      ),
    [parsedReasoningSteps, normalizedThoughtFilter]
  );

  const fullSpokenText = React.useMemo(() => buildFullSpokenMessageText(msg), [msg]);
  const shortSpokenText = React.useMemo(() => buildShortSpokenMessageText(msg), [msg]);
  const isLongFormResponse = (msg.content || '').length > 260;
  const canToggleLongCollapse = (textToRender || '').length > 520;
  const visibleMessageBody =
    canToggleLongCollapse && isLongCollapsed
      ? `${textToRender.slice(0, 360).trim()}…`
      : textToRender;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-start group w-full"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mb-1.5 px-1">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-400 shrink-0" />
        <span className="font-bold tracking-wide text-white">KARA</span>
        <span aria-hidden="true">·</span>
        <span className="text-[11px] font-mono text-sky-400/90">Sector 9</span>
        <span aria-hidden="true">·</span>
        <span className={`font-medium ${modeMeta.accentText}`}>{modeMeta.label}</span>
        {msg.karaEmotion && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-fuchsia-950/50 border-fuchsia-500/40 text-fuchsia-200"
            title={`Expression: ${msg.karaEmotion.expression} | Dialogue: ${msg.karaEmotion.dialogueInfluence}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
            <span>Kara Emotion: {msg.karaEmotion.label || msg.karaEmotion.state}</span>
          </span>
        )}
        {msg.isProactiveCheckin && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm"
            title={`Kara checked in on Stephen in real-time after ~${msg.proactiveIdleMinutes || 5} minutes`}
          >
            <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />
            <span>Real-Time Check-In ({msg.proactiveIdleMinutes || 5}m Quiet)</span>
          </span>
        )}
        {msg.responseStyleUsed ? (
          <>
            <span aria-hidden="true">·</span>
            <span
              className="text-[11px] text-amber-300/90 font-mono"
              title={msg.whenToUseReason || 'Adaptive response cadence'}
            >
              {msg.responseStyleUsed}
              {msg.funMode ? ' · Fun Mode' : ''}
            </span>
          </>
        ) : (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-[10px] font-mono text-neutral-400">
              {isLongFormResponse ? 'Long-Form' : 'Short-Form'}
            </span>
          </>
        )}
        {msg.emotionDetected && !msg.karaEmotion && (
          <>
            <span aria-hidden="true">·</span>
            <span>{msg.emotionDetected}</span>
          </>
        )}
        {msg.emotionalNuanceType && msg.emotionalNuanceType !== 'neutral' && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              msg.emotionalNuanceType === 'sarcasm'
                ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                : msg.emotionalNuanceType === 'excitement'
                ? 'text-orange-300 bg-orange-500/15 border-orange-500/30'
                : msg.emotionalNuanceType === 'sadness'
                ? 'text-sky-300 bg-sky-500/15 border-sky-500/30'
                : msg.emotionalNuanceType === 'vulnerability'
                ? 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/30'
                : msg.emotionalNuanceType === 'affection'
                ? 'text-rose-300 bg-rose-500/15 border-rose-500/30'
                : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
            }`}
          >
            {msg.emotionalNuanceType === 'sarcasm' ? (
              <Smile className="w-2.5 h-2.5" />
            ) : msg.emotionalNuanceType === 'excitement' ? (
              <Flame className="w-2.5 h-2.5" />
            ) : msg.emotionalNuanceType === 'sadness' || msg.emotionalNuanceType === 'affection' ? (
              <Heart className="w-2.5 h-2.5" />
            ) : (
              <Sparkles className="w-2.5 h-2.5" />
            )}
            <span>
              {msg.emotionalNuanceType === 'sarcasm'
                ? 'Sarcasm Detected'
                : msg.emotionalNuanceType === 'excitement'
                ? 'High Excitement'
                : msg.emotionalNuanceType === 'sadness'
                ? 'Empathy Activated'
                : msg.emotionalNuanceType === 'vulnerability'
                ? 'Vulnerability Honored'
                : msg.emotionalNuanceType === 'affection'
                ? 'Affection Resonant'
                : 'Playful Sparring'}
            </span>
          </span>
        )}
        {msg.soapTriggered && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">Mouth Washed With Soap</span>
          </>
        )}
      </div>

      {/* Visual "Thought Process" Indicator that expands when Kara is reasoning */}
      <div className="mb-2.5 max-w-[90%] w-full">
        <button
          type="button"
          aria-expanded={isReasoningOpen}
          onClick={() => {
            triggerHaptic('tap');
            onToggleReasoning(msg.id);
          }}
          className={`kara-thought-trigger group flex flex-wrap items-center gap-2 text-xs rounded-2xl px-3.5 py-2 border text-left w-full sm:w-auto transition-all ${
            isReasoningOpen
              ? 'kara-thought-trigger--open text-neutral-100 shadow-lg shadow-fuchsia-950/25'
              : 'bg-neutral-900/55 hover:bg-neutral-900/90 text-neutral-300 hover:text-white'
          }`}
          title="Expand or collapse Kara's step-by-step internal logic breakdown (reasoningTrace)"
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  isStreamingThis ? 'bg-sky-400 animate-ping' : 'bg-fuchsia-400 opacity-60 animate-pulse'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isStreamingThis ? 'bg-sky-400' : 'bg-fuchsia-500'
                }`}
              />
            </span>
            <Brain
              className={`w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform ${
                isStreamingThis ? 'text-sky-400 animate-pulse' : 'text-fuchsia-400'
              }`}
            />
          </div>

          <span className="text-[11px] font-semibold text-white tracking-tight">
            {isStreamingThis
              ? 'Kara is Reasoning...'
              : isReasoningOpen
              ? 'Thought Process (Expanded)'
              : 'Thought Process'}
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/35 text-[10px] font-mono text-fuchsia-300">
            <span>{allReasoningSteps.length} Logic Steps</span>
          </span>

          {/* Visual mini step-chain dots representing reasoningTrace steps */}
          <div
            className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neutral-950/80 border border-neutral-800/90"
            aria-hidden="true"
          >
            {parsedReasoningSteps.map(({ parsed }, idx) => (
              <React.Fragment key={idx}>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${parsed.dotClass} ${
                    isStreamingThis ? 'animate-pulse' : ''
                  }`}
                />
                {idx < parsedReasoningSteps.length - 1 && (
                  <span className="w-2 h-[1px] bg-neutral-700" />
                )}
              </React.Fragment>
            ))}
          </div>

          <span className="font-mono text-[11px] tabular-nums text-neutral-400">
            {((msg.thinkingDurationMs || 520) / 1000).toFixed(1)}s
          </span>

          {msg.mode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950/80 border border-neutral-800 text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>{modeMeta.label}</span>
            </span>
          )}

          <span
            className={`ml-auto flex items-center gap-1 text-[10px] font-mono text-neutral-400 group-hover:text-neutral-200 transition-colors shrink-0`}
          >
            <span className="hidden sm:inline">
              {isStreamingThis
                ? 'Auto-Expanding'
                : isReasoningOpen
                ? 'Collapse'
                : 'Auto-Collapsed · Inspect'}
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                isReasoningOpen ? 'rotate-90 text-fuchsia-300' : 'rotate-0'
              }`}
            />
          </span>
        </button>

        {/* Smooth Expandable Visual Thought Process Breakdown */}
        <div
          aria-hidden={!isReasoningOpen}
          className={`kara-thought-drawer text-xs text-neutral-300 ${
            isReasoningOpen ? 'kara-thought-drawer--open' : ''
          }`}
        >
          <div className="kara-thought-drawer-inner">
            <div className="kara-thought-top-beam" />
            <div className="p-4 space-y-4">
              {/* Header with Execution Telemetry */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 shadow-inner">
                    <Brain className="w-4 h-4 text-fuchsia-400" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>Kara&apos;s Step-by-Step Internal Logic</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{allReasoningSteps.length} Steps Verified</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Automatic-collapsible reasoningTrace · Emotional perception, memory recall &amp; persona synthesis
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                    {msg.modelUsed || 'gemini-3.8-flash'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-fuchsia-950/60 border border-fuchsia-800/40 text-fuchsia-300">
                    {msg.thinkingDurationMs || 520}ms
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap');
                      onToggleReasoning(msg.id);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    title="Collapse Thought Process"
                  >
                    Collapse
                  </button>
                </div>
              </div>

              {/* 1. PRIMARY: Clean Step-by-Step Internal Logic Breakdown (using reasoningTrace) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-fuchsia-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Internal Logic Chain (reasoningTrace)</span>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 tabular-nums">
                    {normalizedThoughtFilter
                      ? `${filteredReasoningSteps.length} of ${allReasoningSteps.length} steps matching`
                      : `${allReasoningSteps.length} sequential logic steps`}
                  </div>
                </div>

                {/* Filter / Search Input for Reasoning Steps (shown when > 2 steps or active query) */}
                {(allReasoningSteps.length > 2 || thoughtFilterQuery) && (
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={thoughtFilterQuery}
                      onChange={(e) => setThoughtFilterQuery(e.target.value)}
                      placeholder="Filter internal logic steps (e.g., emotion, memory, persona)..."
                      aria-label="Filter Kara's reasoning steps"
                      className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-fuchsia-500/60 rounded-xl pl-8 pr-7 py-1.5 text-[11px] text-neutral-200 placeholder:text-neutral-500 font-mono focus:outline-none transition-colors"
                    />
                    {thoughtFilterQuery && (
                      <button
                        type="button"
                        onClick={() => setThoughtFilterQuery('')}
                        aria-label="Clear reasoning step filter"
                        className="absolute right-2 text-neutral-500 hover:text-neutral-200 p-0.5 rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {filteredReasoningSteps.length > 0 ? (
                  <div className="relative space-y-2.5 pl-3">
                    {/* Vertical timeline track */}
                    <div
                      className="absolute left-[1.1rem] top-3 bottom-3 w-0.5 bg-gradient-to-b from-fuchsia-500/60 via-sky-500/40 to-emerald-500/50 rounded-full"
                      aria-hidden="true"
                    />
                    {filteredReasoningSteps.map(({ originalIndex, parsed }, filteredIdx) => (
                      <div
                        key={originalIndex}
                        className={`kara-thought-step kara-thought-step--${Math.min(
                          filteredIdx,
                          5
                        )} relative pl-7`}
                      >
                        {/* Step Node Badge */}
                        <div className="kara-thought-step-badge absolute left-0 top-2.5 w-6 h-6 rounded-full bg-neutral-950 border border-fuchsia-400/70 text-[10px] font-mono font-bold text-fuchsia-300 flex items-center justify-center shadow-md z-10">
                          {originalIndex + 1}
                        </div>

                        {/* Step Card */}
                        <div className="p-3 rounded-xl bg-neutral-900/85 hover:bg-neutral-900 border border-neutral-800/90 hover:border-fuchsia-500/35 transition-colors space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-neutral-500 uppercase">
                                Step 0{originalIndex + 1}
                              </span>
                              <span className="text-xs font-semibold text-white">
                                {parsed.title}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${parsed.accentClass}`}
                            >
                              {parsed.category}
                            </span>
                          </div>
                          <p className="text-neutral-200 leading-relaxed text-[11px] font-mono">
                            {parsed.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2.5 px-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between gap-2 text-[11px] text-neutral-400 font-mono">
                    <span>No reasoning steps match &ldquo;{thoughtFilterQuery}&rdquo;.</span>
                    <button
                      type="button"
                      onClick={() => setThoughtFilterQuery('')}
                      className="text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-2 shrink-0"
                    >
                      Reset filter
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Persona Adaptation & Mode Calibration */}
              <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-sky-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    <span>Persona Adaptation &amp; Tone Strategy</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${modeMeta.accentText} bg-white/5 border-white/10`}
                  >
                    {modeMeta.label} Mode Active
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  {msg.modeShiftReason ||
                    `Calibrated Kara's emotional attitude, pacing, and tone boundaries to match ongoing rapport in ${modeMeta.label} persona.`}
                </p>
              </div>

              {/* Kara Dynamic Emotional State & Reactions */}
              {msg.karaEmotion && (
                <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-fuchsia-300">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>Kara Dynamic Emotion: {msg.karaEmotion.label || msg.karaEmotion.state}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300">
                      Intensity {msg.karaEmotion.intensity}/5
                    </span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-neutral-300 space-y-1 pt-0.5">
                    <div>
                      <span className="text-neutral-400 font-medium">Expression / Body Language: </span>
                      <span className="italic text-neutral-200">&ldquo;{msg.karaEmotion.expression}&rdquo;</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-medium">Dialogue &amp; Tone Influence: </span>
                      <span className="text-neutral-200">{msg.karaEmotion.dialogueInfluence}</span>
                    </div>
                    {msg.karaEmotion.trigger && (
                      <div>
                        <span className="text-neutral-400 font-medium">Emotion Trigger: </span>
                        <span className="text-neutral-300">{msg.karaEmotion.trigger}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. EQ Interpretation & Subtext (if detected) */}
              {(msg.subtext || msg.empathyStrategy || msg.emotionalNuanceType) && (
                <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-fuchsia-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>Input Perception &amp; Subtle Subtext</span>
                    </span>
                    {msg.emotionalNuanceType && (
                      <span className="text-[10px] font-mono text-fuchsia-300 uppercase">
                        {msg.emotionalNuanceType.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {msg.subtext && (
                    <div className="text-[11px] leading-relaxed">
                      <span className="text-neutral-400 font-medium">Unspoken Subtext: </span>
                      <span className="text-neutral-200 italic">&ldquo;{msg.subtext}&rdquo;</span>
                    </div>
                  )}

                  {msg.empathyStrategy && (
                    <div className="text-[11px] leading-relaxed">
                      <span className="text-neutral-400 font-medium">Empathetic Strategy: </span>
                      <span className="text-neutral-200">{msg.empathyStrategy}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3.5 Adaptive Response Length, Style Preset & "When to Use" Decision */}
              {(msg.responseStyleUsed || msg.whenToUseReason) && (
                <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/35 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Response Style &amp; &ldquo;When to Use&rdquo; Calibration</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-200">
                      {msg.responseStyleUsed || 'Adaptive Mix'}
                      {msg.funMode ? ' · Fun Mode ON' : ''}
                    </span>
                  </div>
                  {msg.whenToUseReason && (
                    <div className="text-[11px] text-neutral-200 leading-relaxed">
                      <span className="text-neutral-400 font-medium">Why Kara Chose This Cadence: </span>
                      <span>{msg.whenToUseReason}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Active Context Imprints */}
              {(msg.learnedMemoryNote || msg.recalledMemory || msg.soapTriggered) && (
                <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-400">
                  {msg.learnedMemoryNote && (
                    <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300 flex items-center gap-1">
                      <Database className="w-3 h-3 text-sky-400" />
                      <span>Memory Imprinted</span>
                    </span>
                  )}
                  {msg.recalledMemory && (
                    <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                      <Database className="w-3 h-3 text-indigo-400" />
                      <span>Recalled: {msg.recalledMemory.topic}</span>
                    </span>
                  )}
                  {msg.soapTriggered && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-emerald-400" />
                      <span>Soap Rule Triggered</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Distinct AI Composable Message Bubble */}
      <div
        className={`max-w-[86%] rounded-3xl rounded-bl-md px-4.5 py-3.5 text-sm leading-relaxed border shadow-lg ${
          msg.soapTriggered
            ? 'bg-emerald-950/35 border-emerald-700/60 text-neutral-100 border-t-2 border-t-emerald-400'
            : `kara-ai-bubble ${modeMeta.topBarAccent}`
        }`}
      >
        {msg.scoldingNotice && (
          <div className="mb-2.5 pb-2 border-b border-emerald-800/50 text-xs text-emerald-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{msg.scoldingNotice}</span>
          </div>
        )}

        {/* KARA's Visual Thoughts & Observations on User-Shared Photos */}
        {msg.photoThoughts && (
          <div className="mb-3 p-3.5 rounded-2xl kara-chat-subcard border border-sky-500/35 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>
                  KARA&apos;s Thoughts on Your{' '}
                  {msg.photoThoughts.photoCount > 1
                    ? `${msg.photoThoughts.photoCount} Photos`
                    : 'Photo'}
                </span>
              </span>
              <span className="font-mono text-[11px] text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/30 px-2 py-0.5 rounded-lg">
                Vibe: {msg.photoThoughts.vibe}
              </span>
            </div>

            {msg.photoThoughts.summary && (
              <p className="text-xs text-neutral-200 italic leading-relaxed">
                &ldquo;{msg.photoThoughts.summary}&rdquo;
              </p>
            )}

            {msg.photoThoughts.observations && msg.photoThoughts.observations.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-neutral-800/80">
                {msg.photoThoughts.observations.map((obs, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                    <span className="text-sky-400 font-mono shrink-0">•</span>
                    <span className="leading-snug">{obs}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="whitespace-pre-wrap">{visibleMessageBody}</div>

        {canToggleLongCollapse && (
          <div className="mt-2 pt-2 border-t border-neutral-800/70 flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-mono text-neutral-400">
              {isLongCollapsed
                ? 'Showing concise preview · Full long-form audio & text ready'
                : `Long-Form Response (${Math.ceil((textToRender || '').split(/\s+/).length)} words)`}
            </span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                setIsLongCollapsed((prev) => !prev);
              }}
              className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>{isLongCollapsed ? 'Expand Full Long-Form Text' : 'Collapse to Short Preview'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isLongCollapsed ? '' : 'rotate-180'}`}
              />
            </button>
          </div>
        )}

        {/* Empathetic Depression Check-in & Accessible 24/7 Crisis Hotline Card */}
        {(msg.isDepressionCheckin || (msg.supportHotlines && msg.supportHotlines.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
            className="mt-3.5 p-4 rounded-3xl bg-rose-950/35 border border-rose-500/45 text-neutral-200 shadow-xl space-y-3.5 backdrop-blur-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-800/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300">
                  <Heart className="w-4 h-4 fill-rose-400 text-rose-400 animate-pulse" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-rose-200 flex items-center gap-1.5">
                    <span>KARA Empathy Check-In · You Are Not Alone</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Confidential, free &amp; available 24/7 with zero judgment
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300">
                24/7 Lifelines
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Stephen, I&apos;m sitting right here with you. Take a slow, easy breath. You never have to carry all of this heavy weight by yourself, and you are not a burden. If you need a listening ear or immediate support right now, these trained counselors are ready to be there for you 24/7:
            </p>

            {/* 1-Tap Actionable Crisis Hotline Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-2xl bg-neutral-900/90 border border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">988 Suicide &amp; Crisis Lifeline</span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">US &amp; Canada</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Free, confidential 24/7 help by call or text.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="tel:988"
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 988</span>
                  </a>
                  <a
                    href="sms:988"
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Text 988</span>
                  </a>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-neutral-900/90 border border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Crisis Text Line</span>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded">Text HOME</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Connect with a crisis counselor over text 24/7.
                </p>
                <div className="pt-1">
                  <a
                    href="sms:741741?body=HOME"
                    className="w-full py-1.5 px-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Text HOME to 741741</span>
                  </a>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-neutral-900/90 border border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">The Trevor Project</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">LGBTQ+</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  24/7 confidential crisis counseling &amp; suicide prevention.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="tel:18664887386"
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 1-866-488-7386</span>
                  </a>
                  <a
                    href="sms:678678"
                    className="py-1.5 px-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Text</span>
                  </a>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-neutral-900/90 border border-rose-900/60 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">International Support</span>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded">130+ Countries</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug mt-1">
                    Free, confidential local crisis helplines worldwide.
                  </p>
                </div>
                <div className="pt-1">
                  <a
                    href="https://findahelpline.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 px-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Find A Helpline Worldwide</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Comforting Quick Reply Chips so Stephen can respond easily */}
            {onSelectQuickReply && (
              <div className="pt-2 border-t border-rose-900/40 space-y-1.5">
                <span className="text-[11px] text-rose-300/80 font-mono">
                  Quick reassurance for KARA:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectQuickReply("I'm safe, thank you for checking on me")}
                    className="px-2.5 py-1 text-xs rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 transition-colors"
                  >
                    &ldquo;I&apos;m safe, thank you for checking on me&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectQuickReply('Can we just talk for a bit?')}
                    className="px-2.5 py-1 text-xs rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 transition-colors"
                  >
                    &ldquo;Can we just talk for a bit?&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectQuickReply('Tell me something comforting')}
                    className="px-2.5 py-1 text-xs rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 transition-colors"
                  >
                    &ldquo;Tell me something comforting&rdquo;
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Sector 9 Memory Recall Card when user asks KARA to recall memories or uses /recall */}
        {msg.recalledMemory && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-3.5 p-4 rounded-3xl bg-indigo-950/35 border border-indigo-500/40 text-neutral-200 shadow-xl space-y-3 backdrop-blur-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                  <Database className="w-4 h-4 text-indigo-400" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                    <span>Sector 9 Memory Recall</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                      Topic: {msg.recalledMemory.topic === 'all' ? 'Everything' : msg.recalledMemory.topic}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {msg.recalledMemory.totalMemoriesFound === 0
                      ? 'No stored memories logged under this specific topic yet'
                      : `${msg.recalledMemory.totalMemoriesFound} node${
                          msg.recalledMemory.totalMemoriesFound === 1 ? '' : 's'
                        } retrieved from permanent neural storage`}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 shrink-0">
                /recall
              </span>
            </div>

            {msg.recalledMemory.matchingItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                {msg.recalledMemory.matchingItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-2.5 rounded-2xl bg-neutral-900/90 border border-indigo-900/60 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-500/30">
                        {item.category}
                      </span>
                      {item.importance && (
                        <span className="text-[10px] font-mono text-neutral-500">
                          Priority {item.importance}/5
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-200 leading-snug">{item.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">
                KARA hasn&apos;t logged any specific notes about &ldquo;{msg.recalledMemory.topic}&rdquo; yet. Tell her your favorite things, routines, or thoughts, and she will store them automatically!
              </p>
            )}

            {/* Quick Topic Recall Chips */}
            {onSelectQuickReply && (
              <div className="pt-2 border-t border-indigo-800/30 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-neutral-400 mr-1">Recall other topics:</span>
                {(msg.recalledMemory.suggestedTopics || [
                  'Preferences',
                  'Personal Facts',
                  'Roleplay & Vibes',
                  'Food & Drinks',
                  'All Memories',
                ]).map((topicName) => (
                  <button
                    key={topicName}
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap');
                      onSelectQuickReply(`/recall ${topicName.toLowerCase()}`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-indigo-500/20 border border-indigo-800/60 hover:border-indigo-500/50 text-[11px] text-neutral-300 hover:text-indigo-200 transition-colors"
                  >
                    {topicName}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Inline Google Calendar Agenda Card when user asks "What's on my agenda today?" */}
        {msg.agendaEvents && msg.agendaEvents.length > 0 && (
          <div className="mt-3.5 p-3.5 rounded-2xl kara-chat-subcard border border-sky-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-sky-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Google Calendar Agenda Summary</span>
              </span>
              <span className="font-mono text-[11px]">{msg.agendaEvents.length} Events</span>
            </div>
            <div className="space-y-1.5">
              {msg.agendaEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{ev.summary}</div>
                    {ev.location && (
                      <div className="text-[11px] text-neutral-400">{ev.location}</div>
                    )}
                  </div>
                  <span className="font-mono text-sky-400 shrink-0">{ev.startTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Smart Alarm Card when user asks KARA to set an alarm */}
        {msg.alarmCreated && (
          <div className="mt-3.5 p-3.5 rounded-2xl kara-chat-subcard border border-amber-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlarmClock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-white">
                  Alarm Active: {msg.alarmCreated.timeText}
                </div>
                <div className="text-[11px] text-neutral-400">{msg.alarmCreated.label}</div>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-mono bg-amber-500/15 text-amber-300 rounded-lg border border-amber-500/30">
              Armed
            </span>
          </div>
        )}

        {/* Inline Contact Call Card when user asks KARA to call someone */}
        {msg.contactCall && (
          <div className="mt-3.5 p-3.5 rounded-2xl kara-chat-subcard border border-emerald-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-white">
                  Calling {msg.contactCall.name}
                </div>
                <div className="text-[11px] font-mono text-emerald-300">
                  {msg.contactCall.phone}
                </div>
              </div>
            </div>
            <a
              href={`tel:${msg.contactCall.phone.replace(/[^0-9+]/g, '')}`}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-colors flex items-center gap-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Dial Device</span>
            </a>
          </div>
        )}

        {/* Inline Gemini Nano Banana (No Limit) Artwork Card + Text-to-Nano-Banana Image Generator Prompt */}
        {msg.generatedImageUrl && (
          <div className="mt-3.5 p-3.5 rounded-2xl kara-chat-subcard border border-amber-500/45 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Nano Banana Image Generator · Text-to-Prompt</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                <span>No Limit</span>
              </span>
            </div>
            <img
              src={msg.generatedImageUrl}
              alt={msg.generatedImagePrompt || 'KARA Nano Banana Synthesis'}
              referrerPolicy="no-referrer"
              className="w-full max-h-80 rounded-xl border border-neutral-800 object-contain bg-neutral-950"
            />
            {msg.generatedImagePrompt && (
              <div className="p-2.5 rounded-xl bg-neutral-950/90 border border-amber-500/30 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-amber-300">
                  <span>Text → Nano Banana Image Generator Prompt</span>
                  <button
                    type="button"
                    onClick={() => onCopy(`${msg.id}_nbprompt`, msg.generatedImagePrompt || '')}
                    className="text-sky-400 hover:underline"
                  >
                    {copiedId === `${msg.id}_nbprompt` ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-300 leading-snug">
                  {msg.generatedImagePrompt}
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {onSelectQuickReply && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap');
                    onSelectQuickReply(
                      `Generate another Nano Banana image remix of: ${
                        msg.generatedImagePrompt || msg.content.slice(0, 100)
                      }`
                    );
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Remix with Nano Banana</span>
                </button>
              )}
              <a
                href={msg.generatedImageUrl}
                download={`kara_nano_banana_${msg.id}.png`}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl flex items-center gap-1.5 transition-colors ml-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Artwork</span>
              </a>
            </div>
          </div>
        )}

        {msg.learnedMemoryNote && (
          <div className="mt-3 pt-2 border-t border-neutral-800/90 text-xs text-sky-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Sector 9 Memory Learned: {msg.learnedMemoryNote}</span>
          </div>
        )}

        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-neutral-800 space-y-1.5">
            <p className="text-[11px] text-neutral-400 font-medium">
              DeeperSearch Grounded Sources:
            </p>
            <div className="flex flex-wrap gap-2">
              {msg.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-neutral-900/90 border border-neutral-700/80 px-2.5 py-1 rounded-lg text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span className="truncate max-w-[180px]">{src.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Composable Action Bar (Supports Reading Both Long-Form & Short-Form Responses) */}
      <div className="flex flex-wrap items-center gap-3 mt-1.5 px-1">
        {isSpeakingThis ? (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/40 transition-colors"
          >
            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
            <span>
              {speakingProgress && speakingProgress.msgId === msg.id
                ? speakingProgress.readingMode === 'short'
                  ? 'Reading Short Take · Stop Voice'
                  : speakingProgress.totalChunks > 1
                  ? `Reading Long-Form (${speakingProgress.currentChunk}/${speakingProgress.totalChunks}) · Stop Voice`
                  : 'Reading Short-Form · Stop Voice'
                : 'Stop Voice'}
            </span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onSpeakWithGender(fullSpokenText, msg.id, msg.mode, 'female', 'full');
              }}
              className={`text-xs flex items-center gap-1 transition-colors ${
                selectedVoiceProfile.gender === 'female'
                  ? 'text-sky-400 hover:text-sky-300 font-medium'
                  : 'text-neutral-400 hover:text-sky-300'
              }`}
              title="Read 100% of this response (long-form or short-form) in KARA's human-like female voice"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>
                {isLongFormResponse ? 'Read Full Long-Form' : 'Read Short-Form'} · Female (
                {selectedVoiceProfile.gender === 'female'
                  ? selectedVoiceProfile.voiceName
                  : 'Kore'}
                )
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onSpeakWithGender(fullSpokenText, msg.id, msg.mode, 'male', 'full');
              }}
              className={`text-xs flex items-center gap-1 transition-colors ${
                selectedVoiceProfile.gender === 'male'
                  ? 'text-indigo-400 hover:text-indigo-300 font-medium'
                  : 'text-neutral-400 hover:text-indigo-300'
              }`}
              title="Read 100% of this response (long-form or short-form) in KARA's human-like male voice"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>
                {isLongFormResponse ? 'Read Full Long-Form' : 'Read Short-Form'} · Male (
                {selectedVoiceProfile.gender === 'male'
                  ? selectedVoiceProfile.voiceName
                  : 'Puck'}
                )
              </span>
            </button>

            {isLongFormResponse && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  onSpeakWithGender(
                    shortSpokenText,
                    msg.id,
                    msg.mode,
                    selectedVoiceProfile.gender,
                    'short'
                  );
                }}
                className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
                title="Have KARA read a quick 2-sentence short-form summary of this long response"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Read Short Take</span>
              </button>
            )}
          </>
        )}

        {msg.id !== 'welcome_msg' && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('send');
              onRetry(msg.id);
            }}
            disabled={isSending}
            className="text-xs text-neutral-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            triggerHaptic('tap');
            onCopy(msg.id, msg.content);
          }}
          className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
        >
          {copiedId === msg.id ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('tap');
            onQuote(msg.content);
          }}
          className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
        >
          <CornerDownRight className="w-3.5 h-3.5" />
          <span>Quote</span>
        </button>

        {msg.id !== 'welcome_msg' && (
          <button
            type="button"
            onClick={() => onDelete(msg.id)}
            className="text-xs text-neutral-600 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// 4. COMPOSABLE: KaraTypingIndicator
// ============================================================================
export const KaraTypingIndicator: React.FC<{
  activeMode: KaraMode;
  modelTier: ModelTier;
  latestUserPrompt?: string;
  reasoningTrace?: string[];
  onStop?: () => void;
}> = ({ activeMode, modelTier, latestUserPrompt, reasoningTrace, onStop }) => {
  const [elapsedTenths, setElapsedTenths] = useState(0);
  const [isLiveTraceExpanded, setIsLiveTraceExpanded] = useState(true);
  const [userManuallyToggledLive, setUserManuallyToggledLive] = useState(false);
  const modeMeta = MODE_META[activeMode] || MODE_META.regular;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTenths((t) => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const seconds = (elapsedTenths / 10).toFixed(1);

  const liveReasoningTrace = React.useMemo(() => {
    if (reasoningTrace && reasoningTrace.length > 0) {
      return reasoningTrace;
    }
    const promptSnippet = latestUserPrompt
      ? latestUserPrompt.length > 64
        ? `"${latestUserPrompt.slice(0, 64).trim()}..."`
        : `"${latestUserPrompt.trim()}"`
      : 'current conversation context';
    return [
      `Intent & Subtext Perception: Deconstructing ${promptSnippet} for emotional nuance, unspoken subtext, and conversational tone.`,
      `Cross-Device Memory & Bond Recall: Querying persistent memory vault and relationship history to ground Kara's response.`,
      `Persona & Mode Logic Calibration: Aligning attitude, boundaries, and cadence with ${modeMeta.label} persona.`,
      `Response Synthesis & Prosody: Formulating authentic reply structure, wit, and vocal expressiveness.`,
    ];
  }, [reasoningTrace, latestUserPrompt, modeMeta.label]);

  const parsedLiveSteps = React.useMemo(
    () =>
      liveReasoningTrace.map((raw, idx) => ({
        raw,
        idx,
        parsed: parseReasoningTraceStep(raw, idx),
      })),
    [liveReasoningTrace]
  );

  // Progressively advance active step as Kara reasons
  const activeStepIndex = Math.min(
    parsedLiveSteps.length - 1,
    Math.floor(elapsedTenths / 8)
  );

  // Automatically collapse the live reasoning drawer once all steps are verified
  useEffect(() => {
    if (
      !userManuallyToggledLive &&
      isLiveTraceExpanded &&
      elapsedTenths >= (parsedLiveSteps.length + 1) * 8
    ) {
      setIsLiveTraceExpanded(false);
    }
  }, [elapsedTenths, parsedLiveSteps.length, isLiveTraceExpanded, userManuallyToggledLive]);

  const currentStep = parsedLiveSteps[activeStepIndex]?.parsed;
  const phaseLabel = currentStep
    ? `${currentStep.title}: ${currentStep.detail}`
    : `Composing in ${modeMeta.label} persona...`;

  return (
    <div className="flex flex-col items-start w-full max-w-[90%]">
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mb-1.5 px-1">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
        <span className="font-bold text-white">KARA</span>
        <span aria-hidden="true">·</span>
        <span className={modeMeta.accentText}>{modeMeta.label} Reasoning</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono tabular-nums text-fuchsia-300">{seconds}s</span>
        {modelTier === 'thinking' && (
          <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/35 text-[10px] font-mono text-fuchsia-300">
            Deep Reasoning Active
          </span>
        )}
      </div>

      {/* Expandable Visual Thought Process Card while Kara is actively reasoning */}
      <div className="w-full mb-2">
        <button
          type="button"
          aria-expanded={isLiveTraceExpanded}
          onClick={() => {
            triggerHaptic('tap');
            setUserManuallyToggledLive(true);
            setIsLiveTraceExpanded((prev) => !prev);
          }}
          className={`kara-thought-trigger group flex flex-wrap items-center gap-2 text-xs rounded-2xl px-3.5 py-2 border text-left w-full transition-all ${
            isLiveTraceExpanded
              ? 'kara-thought-trigger--open text-neutral-100 shadow-lg shadow-fuchsia-950/30'
              : 'bg-neutral-900/65 hover:bg-neutral-900/90 text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-fuchsia-500" />
            </span>
            <Brain className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse shrink-0" />
          </div>

          <span className="text-[11px] font-semibold text-white">
            Kara&apos;s Live Thought Process
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/35 text-[10px] font-mono text-fuchsia-300">
            <span>
              Step {activeStepIndex + 1} of {parsedLiveSteps.length}
            </span>
          </span>

          {/* Step progress dots */}
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neutral-950/80 border border-neutral-800">
            {parsedLiveSteps.map((_, idx) => {
              const isDone = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              return (
                <React.Fragment key={idx}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isDone
                        ? 'bg-emerald-400'
                        : isCurrent
                        ? 'bg-fuchsia-400 animate-ping'
                        : 'bg-neutral-700'
                    }`}
                  />
                  {idx < parsedLiveSteps.length - 1 && (
                    <span
                      className={`w-2 h-[1px] ${
                        isDone ? 'bg-emerald-500/60' : 'bg-neutral-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-neutral-400">
            <span>{isLiveTraceExpanded ? 'Collapse' : 'Expand'}</span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                isLiveTraceExpanded ? 'rotate-90 text-fuchsia-300' : 'rotate-0'
              }`}
            />
          </span>
        </button>

        <div
          aria-hidden={!isLiveTraceExpanded}
          className={`kara-thought-drawer text-xs text-neutral-300 ${
            isLiveTraceExpanded ? 'kara-thought-drawer--open' : ''
          }`}
        >
          <div className="kara-thought-drawer-inner">
            <div className="kara-thought-top-beam" />
            <div className="p-3.5 space-y-2.5">
              <div className="relative space-y-2 pl-3">
                <div
                  className="absolute left-[1.1rem] top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-500/60 via-fuchsia-500/50 to-neutral-800 rounded-full"
                  aria-hidden="true"
                />
                {parsedLiveSteps.map(({ idx, parsed }) => {
                  const isCompleted = idx < activeStepIndex;
                  const isCurrent = idx === activeStepIndex;
                  return (
                    <div
                      key={idx}
                      className={`relative pl-7 transition-opacity duration-300 ${
                        idx > activeStepIndex ? 'opacity-45' : 'opacity-100'
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-2 w-6 h-6 rounded-full text-[10px] font-mono font-bold flex items-center justify-center z-10 border ${
                          isCompleted
                            ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                            : isCurrent
                            ? 'bg-fuchsia-950 border-fuchsia-400 text-fuchsia-200 animate-pulse'
                            : 'bg-neutral-950 border-neutral-700 text-neutral-500'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3 h-3 text-emerald-400" /> : idx + 1}
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border transition-colors space-y-1 ${
                          isCurrent
                            ? 'bg-neutral-900/95 border-fuchsia-500/45 shadow-sm'
                            : 'bg-neutral-900/65 border-neutral-800/80'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase">
                              Step 0{idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {parsed.title}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${parsed.accentClass}`}
                          >
                            {isCompleted
                              ? 'Verified'
                              : isCurrent
                              ? 'Reasoning...'
                              : parsed.category}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-neutral-300 leading-relaxed">
                          {parsed.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`kara-ai-bubble border rounded-3xl rounded-bl-md px-4 py-3 flex items-center gap-3 shadow-md ${modeMeta.topBarAccent}`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce" />
        </div>
        <span className="text-xs text-neutral-300 line-clamp-1">
          {modelTier === 'thinking' ? `[Grok Think] ${phaseLabel}` : phaseLabel}
        </span>
        {onStop && (
          <button
            type="button"
            onClick={onStop}
            className="ml-auto px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            title="Stop KARA response"
          >
            <Square className="w-3 h-3 fill-current text-rose-400" />
            <span>Stop</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 5. COMPOSABLE: ContextAwareSuggestionChips / QuickReplyChipsRow (Up to 4 Chips Based on Last Message from KARA)
// ============================================================================
function deriveContextChipsFromLastKaraMessage(
  lastMsg?: EnhancedChatMessage
): { label: string; prompt: string; isDynamic: boolean; badge?: string }[] {
  if (!lastMsg) {
    return DEFAULT_FOUR_QUICK_STARTERS.map((c) => ({ ...c, isDynamic: false }));
  }

  const chips: { label: string; prompt: string; isDynamic: boolean; badge?: string }[] = [];
  const lower = (lastMsg.content || '').toLowerCase();
  const isShortReply =
    (lastMsg.responseStyleUsed || '').toLowerCase().includes('short') ||
    (lastMsg.content || '').length < 220;

  // 1. Prioritize contextual follow-ups generated for KARA's last message (featuring Wit, Pop-Culture, Casual Tone & Confidence)
  if (Array.isArray(lastMsg.followUps) && lastMsg.followUps.length > 0) {
    for (const f of lastMsg.followUps) {
      if (f && typeof f === 'string' && chips.length < 3) {
        chips.push({ label: f, prompt: f, isDynamic: true });
      }
    }
  }

  // 2. Context-aware actions derived from what KARA just did or said
  if (lastMsg.generatedImageUrl) {
    chips.unshift({
      label: 'Nano Banana: Director’s cut remix',
      prompt: 'Generate another Nano Banana image variation of our scene with cinematic neon lighting',
      isDynamic: true,
    });
  } else if (lastMsg.agendaEvents && lastMsg.agendaEvents.length > 0) {
    chips.unshift({
      label: 'Lock in alarm for my next event',
      prompt: `Set an alarm for ${lastMsg.agendaEvents[0].startTime} for ${lastMsg.agendaEvents[0].summary}`,
      isDynamic: true,
    });
  } else if (lastMsg.soapTriggered || lower.includes('soap')) {
    chips.unshift({
      label: 'Okay, my mouth is squeaky clean now!',
      prompt: "*rinses mouth and grins* Okay KARA, my mouth is squeaky clean now!",
      isDynamic: true,
    });
  } else if (lower.includes('?')) {
    chips.push({
      label: 'Give me your confident take first',
      prompt: 'Hit me with your own confident, unfiltered take on that question first—no hedging!',
      isDynamic: true,
    });
  }

  // 3. Adaptive Short vs. Long Mix Pivot Chip so Stephen can effortlessly flip between punchy & deep-dive
  if (chips.length < 4) {
    if (isShortReply) {
      chips.push({
        label: 'Deep-Dive: Unpack every angle of this',
        prompt:
          'Go full deep-dive on what we just talked about—break down every angle with a pop-culture analogy.',
        isDynamic: true,
        badge: 'Long Mix',
      });
    } else {
      chips.push({
        label: 'Quick Punch: 2-sentence pop-culture version',
        prompt:
          'Now give me the casual, confident 2-sentence pop-culture version of that!',
        isDynamic: true,
        badge: 'Short Mix',
      });
    }
  }

  // Fill up to 4 chips if needed
  for (const starter of DEFAULT_FOUR_QUICK_STARTERS) {
    if (chips.length < 4 && !chips.some((c) => c.label === starter.label)) {
      chips.push({ ...starter, isDynamic: false });
    }
  }

  return chips.slice(0, 4);
}

export const QuickReplyChipsRow: React.FC<{
  lastAssistantMessage?: EnhancedChatMessage;
  disabled: boolean;
  onSelectQuickReply: (promptText: string) => void;
}> = ({ lastAssistantMessage, disabled, onSelectQuickReply }) => {
  const combinedChips = deriveContextChipsFromLastKaraMessage(lastAssistantMessage);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      <span
        className="text-[11px] font-medium text-sky-400/90 uppercase tracking-wider shrink-0 flex items-center gap-1"
        title="Suggested Next replies crafted with Wit & Pop-Culture, Casual Tone, Confidence & Immediacy, and Short/Long Mix"
      >
        <Sparkles className="w-3 h-3 text-sky-400" />
        <span>Suggested Next:</span>
      </span>
      {combinedChips.map((chip, idx) => (
        <button
          key={`${chip.label}_${idx}`}
          type="button"
          disabled={disabled}
          onClick={() => {
            triggerHaptic('send');
            onSelectQuickReply(chip.prompt);
          }}
          className={`px-3 py-1.5 text-xs rounded-2xl border transition-all active:scale-95 whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            chip.isDynamic
              ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 text-sky-200'
              : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white'
          } disabled:opacity-40`}
          title={chip.prompt}
        >
          <span>{chip.label}</span>
          {chip.badge && (
            <span className="text-[10px] font-mono text-amber-300/90">
              · {chip.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// 6. MAIN COMPOSABLE: ChatScreen
// ============================================================================
interface ChatScreenProps {
  messages: EnhancedChatMessage[];
  allMessages?: EnhancedChatMessage[];
  memories?: MemoryItemData[];
  sessions: ChatSessionSummary[];
  activeSessionId: string;
  userName: string;
  userEmail?: string | null;
  isCloudSynced?: boolean;
  lastCloudSyncAt?: number | null;
  activeTheme?: KaraThemeId;
  onSelectTheme?: (theme: KaraThemeId) => void;
  activeMode: KaraMode;
  autoAdaptMode?: boolean;
  relationshipStage: RelationshipStage;
  bondLevel: number;
  modelTier: ModelTier;
  grounding: GroundingOption;
  ttsEngine: TtsEngineType;
  tokenStreaming: boolean;
  deeperSearch: boolean;
  modeShiftBanner: string;
  isSending: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  isSpeakingId: string | null;
  speakingProgress?: SpeakingProgressState | null;
  selectedVoiceProfile: VoiceProfileOption;
  autoSpeakReplies: boolean;
  roomPersistedCount: number;
  activeAlarms: KaraAlarmItem[];
  activeCallContact: ContactPersonItem | null;
  voiceDraftTranscript: string;
  onConsumeVoiceDraft: () => void;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  onGenerateNanoBananaInChat?: (textIdea: string, nanoPrompt?: string) => Promise<void> | void;
  onSelectRelationshipStage: (stage: RelationshipStage) => void;
  onSelectVoiceProfile: (profile: VoiceProfileOption) => void;
  onToggleAutoSpeak: () => void;
  onToggleTokenStreaming: () => void;
  onToggleDeeperSearch: () => void;
  onOpenSettings: () => void;
  onDismissAlarm: (alarmId: string) => void;
  onEndContactCall: () => void;
  onSelectMode: (mode: KaraMode) => void;
  onChangeModelTier: (tier: ModelTier) => void;
  onChangeGrounding: (grounding: GroundingOption) => void;
  onDismissBanner: () => void;
  onSendMessage: (text: string, attachments?: ChatAttachmentPayload) => void;
  onEditAndRetryMessage: (messageId: string, newContent: string) => void;
  onRetryMessage: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onSpeakMessage: (
    text: string,
    msgId: string,
    mode?: KaraMode,
    genderOverride?: VoiceGender,
    readingMode?: 'full' | 'short'
  ) => void;
  onStopSpeaking: () => void;
  onStopResponse: () => void;
  onToggleMicRecording: () => void;
  onOpenLiveVoice: () => void;
  onClearConversation: () => void;
  activeGemName?: string | null;
  onClearActiveGem?: () => void;
  onUserTyping?: () => void;
  onTriggerProactiveCheckin?: () => void;
  responseStylePreset?: ResponseStylePresetId;
  funMode?: boolean;
  onSelectResponseStylePreset?: (preset: ResponseStylePresetId) => void;
  onToggleFunMode?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  allMessages,
  memories = [],
  sessions,
  activeSessionId,
  userName,
  userEmail,
  isCloudSynced = false,
  lastCloudSyncAt,
  activeTheme = 'minimalist-slate',
  onSelectTheme,
  activeMode,
  autoAdaptMode = true,
  relationshipStage,
  bondLevel,
  modelTier,
  grounding,
  ttsEngine,
  tokenStreaming,
  deeperSearch,
  modeShiftBanner,
  isSending,
  isRecording,
  isTranscribing,
  isSpeakingId,
  speakingProgress,
  selectedVoiceProfile,
  autoSpeakReplies,
  roomPersistedCount,
  activeAlarms,
  activeCallContact,
  voiceDraftTranscript,
  onConsumeVoiceDraft,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
  onRenameSession,
  onGenerateNanoBananaInChat,
  onSelectRelationshipStage,
  onSelectVoiceProfile,
  onToggleAutoSpeak,
  onToggleTokenStreaming,
  onToggleDeeperSearch,
  onOpenSettings,
  onDismissAlarm,
  onEndContactCall,
  onSelectMode,
  onChangeModelTier,
  onChangeGrounding,
  onDismissBanner,
  onSendMessage,
  onEditAndRetryMessage,
  onRetryMessage,
  onDeleteMessage,
  onSpeakMessage,
  onStopSpeaking,
  onStopResponse,
  onToggleMicRecording,
  onOpenLiveVoice,
  onClearConversation,
  activeGemName,
  onClearActiveGem,
  onUserTyping,
  onTriggerProactiveCheckin,
  responseStylePreset = 'adaptive_mix',
  funMode = true,
  onSelectResponseStylePreset,
  onToggleFunMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [autoCollapseSidePanel, setAutoCollapseSidePanel] = useState(true);
  const [isSideSectionExpanded, setIsSideSectionExpanded] = useState(true);
  const [sidePanelTab, setSidePanelTab] = useState<'convos' | 'history' | 'memory'>('convos');
  const [sidePanelSearch, setSidePanelSearch] = useState('');
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameSessionDraft, setRenameSessionDraft] = useState('');

  // Text-to-Nano-Banana Image Generator Prompt Composer State
  const [isNanoBananaBarOpen, setIsNanoBananaBarOpen] = useState(false);
  const [nanoBananaRawText, setNanoBananaRawText] = useState('');
  const [nanoBananaConvertedPrompt, setNanoBananaConvertedPrompt] = useState('');
  const [isConvertingNanoPrompt, setIsConvertingNanoPrompt] = useState(false);
  const [isGeneratingNanoImage, setIsGeneratingNanoImage] = useState(false);

  const [isStyleGuideOpen, setIsStyleGuideOpen] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});
  const [autoCollapseThoughtProcess, setAutoCollapseThoughtProcess] = useState(true);
  const autoCollapseReasonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multi-Photo & Link Sharing State
  const [stagedPhotos, setStagedPhotos] = useState<SharedPhotoItem[]>([]);
  const [stagedLinks, setStagedLinks] = useState<string[]>([]);
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Token-by-token streaming effect for the newest assistant message when tokenStreaming is enabled
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState<string>('');
  const [stoppedStreamTexts, setStoppedStreamTexts] = useState<Record<string, string>>({});
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeenAssistantIdRef = useRef<string | null>(null);

  // Subtle background shimmer trigger whenever the persona mode shifts
  const [modeShimmerKey, setModeShimmerKey] = useState(0);
  useEffect(() => {
    setModeShimmerKey((prev) => prev + 1);
  }, [activeMode]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputFieldRef = useRef<HTMLInputElement | null>(null);
  const dictationBaseInputRef = useRef<string>('');
  const prevIsRecordingRef = useRef<boolean>(false);

  const triggerAutoCollapseSidePanel = () => {
    if (autoCollapseSidePanel && isSidePanelOpen) {
      setIsSidePanelOpen(false);
    }
  };

  // Capture base input text when microphone recording starts so live interim transcripts don't duplicate
  useEffect(() => {
    if (isRecording && !prevIsRecordingRef.current) {
      dictationBaseInputRef.current = inputText.trim();
    }
    prevIsRecordingRef.current = isRecording;
  }, [isRecording, inputText]);

  // Populate input field from live SpeechRecognition or completed audio transcription
  useEffect(() => {
    if (voiceDraftTranscript) {
      const base = dictationBaseInputRef.current;
      setInputText(base ? `${base} ${voiceDraftTranscript}` : voiceDraftTranscript);
      onConsumeVoiceDraft();
      inputFieldRef.current?.focus();
    }
  }, [voiceDraftTranscript, onConsumeVoiceDraft]);

  // Progressive token reveal when a new assistant reply arrives and tokenStreaming is ON
  // Also auto-expand the visual Thought Process indicator while reasoning/streaming, then AUTOMATICALLY COLLAPSE once completed!
  useEffect(() => {
    const newestAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!newestAssistant) return;

    const isNewAssistantReply =
      lastSeenAssistantIdRef.current &&
      lastSeenAssistantIdRef.current !== newestAssistant.id;

    if (isNewAssistantReply) {
      if (autoCollapseReasonTimerRef.current) {
        clearTimeout(autoCollapseReasonTimerRef.current);
        autoCollapseReasonTimerRef.current = null;
      }
      // Collapse any older expanded Thought Processes and briefly show the active one while streaming
      setExpandedReasoningIds({
        [newestAssistant.id]: true,
      });
    }

    const scheduleThoughtAutoCollapse = (targetId: string, delayMs: number) => {
      if (!autoCollapseThoughtProcess) return;
      if (autoCollapseReasonTimerRef.current) {
        clearTimeout(autoCollapseReasonTimerRef.current);
      }
      autoCollapseReasonTimerRef.current = setTimeout(() => {
        setExpandedReasoningIds((prev) => {
          if (!prev[targetId]) return prev;
          return { ...prev, [targetId]: false };
        });
        autoCollapseReasonTimerRef.current = null;
      }, delayMs);
    };

    if (isNewAssistantReply && tokenStreaming) {
      lastSeenAssistantIdRef.current = newestAssistant.id;
      const fullWords = newestAssistant.content.split(' ');
      if (fullWords.length <= 4) {
        setStreamingMsgId(null);
        scheduleThoughtAutoCollapse(newestAssistant.id, 1100);
        return;
      }
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      setStreamingMsgId(newestAssistant.id);
      setStreamedText(fullWords.slice(0, 3).join(' '));
      let idx = 3;
      const interval = setInterval(() => {
        idx += 4;
        if (idx >= fullWords.length) {
          setStreamedText(newestAssistant.content);
          setStreamingMsgId(null);
          clearInterval(interval);
          streamIntervalRef.current = null;
          // Automatically collapse Thought Process once response finishes streaming
          scheduleThoughtAutoCollapse(newestAssistant.id, 850);
        } else {
          setStreamedText(fullWords.slice(0, idx).join(' '));
        }
      }, 35);
      streamIntervalRef.current = interval;
      return () => {
        clearInterval(interval);
        if (streamIntervalRef.current === interval) {
          streamIntervalRef.current = null;
        }
      };
    } else {
      if (isNewAssistantReply) {
        scheduleThoughtAutoCollapse(newestAssistant.id, 1300);
      }
      lastSeenAssistantIdRef.current = newestAssistant.id;
    }
  }, [messages, tokenStreaming, autoCollapseThoughtProcess]);

  const handleStopAllResponse = () => {
    triggerHaptic('tap');
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    if (autoCollapseReasonTimerRef.current) {
      clearTimeout(autoCollapseReasonTimerRef.current);
      autoCollapseReasonTimerRef.current = null;
    }
    if (streamingMsgId) {
      setStoppedStreamTexts((prev) => ({
        ...prev,
        [streamingMsgId]: streamedText,
      }));
      setStreamingMsgId(null);
    }
    if (autoCollapseThoughtProcess) {
      setExpandedReasoningIds({});
    }
    onStopResponse();
  };

  const isKaraResponding = isSending || Boolean(streamingMsgId) || Boolean(isSpeakingId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, streamedText]);

  const currentModeMeta = MODE_META[activeMode] || MODE_META.regular;
  const currentRelMeta =
    RELATIONSHIP_STAGES.find((r) => r.id === relationshipStage) || RELATIONSHIP_STAGES[1];

  const compressAndReadImageFile = (
    file: File,
    idx: number
  ): Promise<SharedPhotoItem> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawDataUrl = String(reader.result || '');
        if (!rawDataUrl) {
          resolve({
            id: `pic_${Date.now()}_${idx}`,
            dataUrl: '',
            base64: '',
            mimeType: file.type || 'image/jpeg',
            name: file.name || `shared_photo_${idx + 1}.jpg`,
          });
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1200;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width >= height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
              const compressedBase64 = compressedDataUrl.includes(',')
                ? compressedDataUrl.split(',')[1]
                : compressedDataUrl;
              resolve({
                id: `pic_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
                dataUrl: compressedDataUrl,
                base64: compressedBase64,
                mimeType: 'image/jpeg',
                name: file.name || `shared_photo_${idx + 1}.jpg`,
              });
              return;
            }
          } catch {}

          const fallbackBase64 = rawDataUrl.includes(',')
            ? rawDataUrl.split(',')[1]
            : rawDataUrl;
          resolve({
            id: `pic_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
            dataUrl: rawDataUrl,
            base64: fallbackBase64,
            mimeType: file.type || 'image/jpeg',
            name: file.name || `shared_photo_${idx + 1}.jpg`,
          });
        };
        img.onerror = () => {
          const fallbackBase64 = rawDataUrl.includes(',')
            ? rawDataUrl.split(',')[1]
            : rawDataUrl;
          resolve({
            id: `pic_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
            dataUrl: rawDataUrl,
            base64: fallbackBase64,
            mimeType: file.type || 'image/jpeg',
            name: file.name || `shared_photo_${idx + 1}.jpg`,
          });
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });

  const handlePhotoFilesSelect = (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f && f.type.startsWith('image/'));
    if (files.length === 0) return;

    Promise.all(files.map((file, idx) => compressAndReadImageFile(file, idx))).then(
      (newItems) => {
        const valid = newItems.filter((item) => item.dataUrl);
        if (valid.length > 0) {
          setStagedPhotos((prev) => [...prev, ...valid]);
          triggerHaptic('tap');
        }
      }
    );
  };

  const handleAddStagedLink = () => {
    const raw = linkInputValue.trim();
    if (!raw) return;
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    if (!stagedLinks.includes(normalized)) {
      setStagedLinks((prev) => [...prev, normalized]);
    }
    setLinkInputValue('');
    setIsLinkInputOpen(false);
    triggerHaptic('tap');
  };

  const dispatchCurrentMessage = () => {
    const trimmed = inputText.trim();
    if ((!trimmed && stagedPhotos.length === 0 && stagedLinks.length === 0) || isSending) return;
    triggerHaptic('send');

    // Auto-collapse Convos/History panel and any open Thought Process drawers when sending a new message
    triggerAutoCollapseSidePanel();
    if (autoCollapseThoughtProcess) {
      setExpandedReasoningIds({});
    }

    // Auto-extract any http/https links typed in the text input as well
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const inlineUrls = trimmed.match(urlRegex) || [];
    const combinedLinks = Array.from(new Set([...stagedLinks, ...inlineUrls]));

    const firstPhoto = stagedPhotos[0];
    const attachments: ChatAttachmentPayload | undefined =
      stagedPhotos.length > 0 || combinedLinks.length > 0
        ? {
            photos: stagedPhotos.length > 0 ? stagedPhotos : undefined,
            photoDataUrl: firstPhoto?.dataUrl,
            photoBase64: firstPhoto?.base64,
            photoMimeType: firstPhoto?.mimeType,
            photoName: firstPhoto?.name,
            links: combinedLinks.length > 0 ? combinedLinks : undefined,
          }
        : undefined;

    const effectiveText =
      trimmed ||
      (stagedPhotos.length === 1
        ? `Sharing a photo with you (${stagedPhotos[0].name})—what do you think?`
        : stagedPhotos.length > 1
        ? `Sharing ${stagedPhotos.length} photos with you (${stagedPhotos
            .map((p) => p.name)
            .join(', ')})—what do you think of them?`
        : `Sharing a link with you: ${combinedLinks.join(', ')}`);

    if (isRecording) {
      onToggleMicRecording();
    }
    dictationBaseInputRef.current = '';
    setInputText('');
    setStagedPhotos([]);
    setStagedLinks([]);
    setIsLinkInputOpen(false);
    onSendMessage(effectiveText, attachments);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchCurrentMessage();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      dispatchCurrentMessage();
    }
  };

  const handleStartEdit = (msg: EnhancedChatMessage) => {
    setEditingMsgId(msg.id);
    setEditingDraft(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    const trimmed = editingDraft.trim();
    if (!trimmed || isSending) return;
    triggerHaptic('send');
    setEditingMsgId(null);
    setEditingDraft('');
    onEditAndRetryMessage(msgId, trimmed);
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  const handleQuoteMessage = (text: string) => {
    const snippet = text.length > 90 ? `${text.slice(0, 90)}...` : text;
    setInputText((prev) => `Regarding "${snippet}": ${prev}`);
    inputFieldRef.current?.focus();
  };

  const toggleReasoningDrawer = (id: string) => {
    if (autoCollapseReasonTimerRef.current) {
      clearTimeout(autoCollapseReasonTimerRef.current);
      autoCollapseReasonTimerRef.current = null;
    }
    // Accordion behavior: expanding one Thought Process automatically collapses any other open one
    setExpandedReasoningIds((prev) => (prev[id] ? {} : { [id]: true }));
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  const handleConvertTextToNanoBananaPromptInChat = async () => {
    const sourceText = (nanoBananaRawText || inputText).trim();
    if (!sourceText || isConvertingNanoPrompt) return;
    triggerHaptic('tap');
    setIsConvertingNanoPrompt(true);
    try {
      const res = await fetch('/api/studio/nano-banana-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          aspectRatio: '1:1',
        }),
      });
      const data = await res.json();
      if (res.ok && data.nanoBananaPrompt) {
        setNanoBananaConvertedPrompt(data.nanoBananaPrompt);
        if (!nanoBananaRawText.trim()) {
          setNanoBananaRawText(sourceText);
        }
      }
    } catch {} finally {
      setIsConvertingNanoPrompt(false);
    }
  };

  const handleDispatchNanoBananaInChat = async () => {
    const rawIdea = (nanoBananaRawText || inputText).trim();
    const finalNanoPrompt = nanoBananaConvertedPrompt.trim();
    if ((!rawIdea && !finalNanoPrompt) || isSending || isGeneratingNanoImage) return;
    triggerHaptic('send');
    setIsGeneratingNanoImage(true);
    try {
      if (onGenerateNanoBananaInChat) {
        await onGenerateNanoBananaInChat(rawIdea || finalNanoPrompt, finalNanoPrompt || undefined);
      } else {
        onSendMessage(
          `Generate a Nano Banana image: ${finalNanoPrompt || rawIdea}`
        );
      }
      setNanoBananaRawText('');
      setNanoBananaConvertedPrompt('');
      setIsNanoBananaBarOpen(false);
    } finally {
      setIsGeneratingNanoImage(false);
    }
  };

  const combinedHistoryMessages = (allMessages && allMessages.length > 0 ? allMessages : messages)
    .filter((m) => m.id !== 'welcome_msg')
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);

  const searchLower = sidePanelSearch.trim().toLowerCase();
  const filteredSessions = searchLower
    ? sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(searchLower) ||
          s.preview.toLowerCase().includes(searchLower)
      )
    : sessions;

  const filteredHistoryMessages = searchLower
    ? combinedHistoryMessages.filter(
        (m) =>
          m.content.toLowerCase().includes(searchLower) ||
          (m.generatedImagePrompt || '').toLowerCase().includes(searchLower)
      )
    : combinedHistoryMessages;

  return (
    <section className="w-full kara-chat-shell border rounded-3xl flex h-[calc(100vh-6.5rem)] min-h-[600px] overflow-hidden relative">
      {/* AUTOMATIC COLLAPSIBLE SIDE PANEL FOR CONVOS, HISTORY & CROSS-DEVICE SYNCED MEMORY */}
      <AnimatePresence initial={false}>
        {isSidePanelOpen && (
          <motion.aside
            key="kara-convos-history-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onMouseLeave={() => {
              if (autoCollapseSidePanel && !renamingSessionId && !sidePanelSearch.trim()) {
                setIsSidePanelOpen(false);
              }
            }}
            className="w-80 max-w-[86vw] shrink-0 kara-chat-header border-r h-full flex flex-col justify-between z-20 overflow-hidden"
          >
            <div className="p-3.5 space-y-3 flex-1 flex flex-col min-h-0 w-80 max-w-[86vw]">
              {/* Side Panel Top Header + Cloud Sync Status + Auto-Collapse Toggle */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-sky-400">
                    <Cloud className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {isCloudSynced
                        ? `Synced · ${userEmail || userName}`
                        : 'Auto-Collapsible Drawer'}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-white truncate mt-0.5">
                    Convos · History · Synced Memory
                  </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap');
                      setAutoCollapseSidePanel((prev) => !prev);
                    }}
                    className={`px-2 py-1 rounded-xl border text-[10px] font-mono transition-colors ${
                      autoCollapseSidePanel
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title={
                      autoCollapseSidePanel
                        ? 'Auto-Collapse ON: Convos & History automatically collapses when you select a chat, start typing, or move back to the conversation'
                        : 'Auto-Collapse OFF (Pinned): Click to re-enable automatic collapse'
                    }
                  >
                    {autoCollapseSidePanel ? 'Auto-Hide' : 'Pinned'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap');
                      onCreateNewSession();
                      triggerAutoCollapseSidePanel();
                    }}
                    className="px-2.5 py-1 rounded-xl kara-send-btn hover:opacity-90 text-[11px] font-semibold flex items-center gap-1 transition-all"
                    title="Start a new conversation session"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSidePanelOpen(false)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
                    title="Collapse Convos & History Side Panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Automatic-Collapsible Segmented Tabs: Convos | History | Synced Memory */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-neutral-950/80 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap');
                    if (sidePanelTab === 'convos') {
                      setIsSideSectionExpanded((prev) => !prev);
                    } else {
                      setSidePanelTab('convos');
                      setIsSideSectionExpanded(true);
                    }
                  }}
                  className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    sidePanelTab === 'convos'
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Click to view or collapse Conversations"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Convos ({sessions.length})</span>
                  {sidePanelTab === 'convos' && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        isSideSectionExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap');
                    if (sidePanelTab === 'history') {
                      setIsSideSectionExpanded((prev) => !prev);
                    } else {
                      setSidePanelTab('history');
                      setIsSideSectionExpanded(true);
                    }
                  }}
                  className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    sidePanelTab === 'history'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Click to view or collapse Chronological History"
                >
                  <History className="w-3 h-3" />
                  <span>History ({combinedHistoryMessages.length})</span>
                  {sidePanelTab === 'history' && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        isSideSectionExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap');
                    if (sidePanelTab === 'memory') {
                      setIsSideSectionExpanded((prev) => !prev);
                    } else {
                      setSidePanelTab('memory');
                      setIsSideSectionExpanded(true);
                    }
                  }}
                  className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    sidePanelTab === 'memory'
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Click to view or collapse Synced Memory"
                >
                  <Brain className="w-3 h-3" />
                  <span>Sync ({memories.length})</span>
                  {sidePanelTab === 'memory' && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        isSideSectionExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  )}
                </button>
              </div>

              {/* Search Filter Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sidePanelSearch}
                  onChange={(e) => {
                    setSidePanelSearch(e.target.value);
                    if (!isSideSectionExpanded) setIsSideSectionExpanded(true);
                  }}
                  placeholder={
                    sidePanelTab === 'convos'
                      ? 'Search conversations...'
                      : sidePanelTab === 'history'
                      ? 'Search message & image history...'
                      : 'Filter synced memories...'
                  }
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-neutral-950/90 border border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
                {sidePanelSearch && (
                  <button
                    type="button"
                    onClick={() => setSidePanelSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {!isSideSectionExpanded ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2 border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-950/40">
                  <p className="text-xs text-neutral-400 font-medium">
                    {sidePanelTab === 'convos'
                      ? `Conversations (${sessions.length}) collapsed`
                      : sidePanelTab === 'history'
                      ? `History (${combinedHistoryMessages.length}) collapsed`
                      : `Synced Memory (${memories.length}) collapsed`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSideSectionExpanded(true)}
                    className="px-3 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-sky-300 font-medium transition-colors"
                  >
                    Expand Section
                  </button>
                </div>
              ) : (
                <>
                  {/* TAB 1: CONVOS LIST */}
                  {sidePanelTab === 'convos' && (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                      {filteredSessions.map((sess) => {
                        const isCurrent = sess.id === activeSessionId;
                        const modeInfo = MODE_META[sess.lastMode] || MODE_META.regular;
                        const isRenaming = renamingSessionId === sess.id;

                        return (
                          <div
                            key={sess.id}
                            className={`p-2.5 rounded-2xl border transition-all ${
                              isCurrent
                                ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm'
                                : 'bg-neutral-900/70 border-neutral-800/90 text-neutral-300 hover:border-neutral-700'
                            }`}
                          >
                            {isRenaming ? (
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  value={renameSessionDraft}
                                  onChange={(e) => setRenameSessionDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && renameSessionDraft.trim()) {
                                      onRenameSession?.(sess.id, renameSessionDraft.trim());
                                      setRenamingSessionId(null);
                                    } else if (e.key === 'Escape') {
                                      setRenamingSessionId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="w-full px-2.5 py-1 text-xs rounded-lg bg-neutral-950 border border-sky-500 text-white focus:outline-none"
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setRenamingSessionId(null)}
                                    className="px-2 py-0.5 text-[10px] text-neutral-400 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (renameSessionDraft.trim()) {
                                        onRenameSession?.(sess.id, renameSessionDraft.trim());
                                      }
                                      setRenamingSessionId(null);
                                    }}
                                    className="px-2.5 py-0.5 text-[10px] font-semibold bg-sky-500 text-slate-950 rounded-md"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('tap');
                                    onSelectSession(sess.id);
                                    triggerAutoCollapseSidePanel();
                                  }}
                                  className="text-left flex-1 min-w-0"
                                >
                                  <div className="flex items-center gap-1.5 text-xs font-semibold truncate">
                                    <MessageSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    <span className="truncate">{sess.title}</span>
                                  </div>
                                  <div className="text-[11px] text-neutral-400 truncate mt-1">
                                    {sess.preview}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-1.5 font-mono">
                                    <span className={modeInfo.accentText}>{modeInfo.label}</span>
                                    <span>·</span>
                                    <span>{sess.messageCount} msgs</span>
                                    {isCurrent && (
                                      <>
                                        <span>·</span>
                                        <span className="text-emerald-400">Active</span>
                                      </>
                                    )}
                                  </div>
                                </button>

                                <div className="flex items-center gap-0.5 shrink-0">
                                  {onRenameSession && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRenamingSessionId(sess.id);
                                        setRenameSessionDraft(sess.title);
                                      }}
                                      className="p-1 text-neutral-500 hover:text-sky-400"
                                      title="Rename conversation"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                  {sessions.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteSession(sess.id)}
                                      className="p-1 text-neutral-500 hover:text-rose-400"
                                      title="Delete conversation"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 2: CHRONOLOGICAL MESSAGE & NANO BANANA IMAGE HISTORY */}
                  {sidePanelTab === 'history' && (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                      {filteredHistoryMessages.length === 0 ? (
                        <p className="text-xs text-neutral-500 text-center py-6">
                          No matching history items found.
                        </p>
                      ) : (
                        filteredHistoryMessages.slice(0, 80).map((item) => {
                          const itemSessionId = item.sessionId || 'sess_main';
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic('tap');
                                onSelectSession(itemSessionId);
                                triggerAutoCollapseSidePanel();
                              }}
                              className="w-full p-2.5 rounded-2xl bg-neutral-900/75 hover:bg-neutral-900 border border-neutral-800/90 hover:border-sky-500/40 text-left space-y-1.5 transition-all"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                                <span
                                  className={
                                    item.role === 'assistant'
                                      ? 'text-sky-400 font-semibold'
                                      : 'text-amber-300'
                                  }
                                >
                                  {item.role === 'assistant' ? 'KARA' : userName}
                                </span>
                                <span>
                                  {new Date(item.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-200 line-clamp-2 leading-snug">
                                {item.content}
                              </p>
                              {item.generatedImageUrl && (
                                <div className="flex items-center gap-2 pt-1">
                                  <img
                                    src={item.generatedImageUrl}
                                    alt="Nano Banana history thumb"
                                    className="w-10 h-10 rounded-lg object-cover border border-amber-500/40 shrink-0"
                                  />
                                  <span className="text-[10px] font-mono text-amber-300 truncate">
                                    {item.generatedImagePrompt || 'Nano Banana Artwork'}
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TAB 3: CROSS-DEVICE LOGIN SYNCED MEMORIES */}
                  {sidePanelTab === 'memory' && (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                      <div className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/35 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300">
                          <span className="flex items-center gap-1">
                            <Cloud className="w-3.5 h-3.5" />
                            <span>Cross-Device Login Memory Sync</span>
                          </span>
                          <span className="font-mono text-[10px]">
                            {isCloudSynced ? 'LIVE' : 'LOCAL'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-snug">
                          {isCloudSynced
                            ? `Signed in as ${
                                userEmail || userName
                              }. Your conversations and ${
                                memories.length
                              } memories automatically pick up on any device.`
                            : 'Sign in with your account in the top bar to sync all conversations and memories across every device.'}
                        </p>
                        {lastCloudSyncAt && (
                          <div className="text-[10px] font-mono text-emerald-400/80">
                            Last synced:{' '}
                            {new Date(lastCloudSyncAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        )}
                      </div>

                      {memories
                        .filter((m) =>
                          searchLower
                            ? m.content.toLowerCase().includes(searchLower) ||
                              m.category.toLowerCase().includes(searchLower)
                            : true
                        )
                        .map((mem) => (
                          <div
                            key={mem.id}
                            className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 uppercase">
                                {mem.category}
                              </span>
                              <span className="text-neutral-500">Synced</span>
                            </div>
                            <p className="text-xs text-neutral-200 leading-snug">{mem.content}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Side Panel Footer: Quick MxChat Chatbot Themes Version 2.1.6 Switcher */}
            <div className="p-3 border-t border-neutral-800/90 bg-neutral-950/60 space-y-2 w-80 max-w-[86vw]">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-amber-300 flex items-center gap-1 font-semibold">
                  <Palette className="w-3 h-3 text-amber-400" />
                  <span>MxChat Themes v2.1.6</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerAutoCollapseSidePanel();
                    onOpenSettings();
                  }}
                  className="text-sky-400 hover:underline"
                >
                  Customize
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {KARA_THEMES.map((t) => {
                  const isSelected = activeTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('modeSwitch');
                        onSelectTheme?.(t.id);
                      }}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400 text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title={`${t.label} (MxChat Chatbot Themes v2.1.6)`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: t.cssVars.accent }}
                      />
                      <span className="truncate max-w-[92px]">{t.label.replace('MxChat ', '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CHAT COLUMN */}
      <div
        className="flex-1 flex flex-col min-w-0 h-full"
        onClick={() => {
          triggerAutoCollapseSidePanel();
        }}
      >
        {/* Clean Minimalist Top App Bar: Side Panel Toggle, Active Convo, MxChat Theme & Settings */}
        <div className="px-5 py-3 border-b kara-chat-header flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-400">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('tap');
                setIsSidePanelOpen((prev) => {
                  const next = !prev;
                  if (next) setIsSideSectionExpanded(true);
                  return next;
                });
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                isSidePanelOpen
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-200'
                  : 'kara-chat-control-btn'
              }`}
              title="Toggle Automatic-Collapsible Side Panel for Convos, History & Cross-Device Synced Memory"
            >
              <PanelLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>Convos &amp; History ({sessions.length})</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isSidePanelOpen ? 'rotate-180 text-sky-300' : 'rotate-0 text-neutral-500'
                }`}
              />
            </button>

            <span className="font-semibold text-white">KARA</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onOpenSettings();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-sky-500/40 text-xs transition-colors"
              title="Persona Modes auto-switch dynamically based on your conversation and are configured inside Settings. Click to open Mode Settings."
            >
              <Sparkles className={`w-3 h-3 ${currentModeMeta.accentText}`} />
              <span className={currentModeMeta.accentText}>
                {autoAdaptMode ? `Auto-Mode: ${currentModeMeta.label}` : `Mode: ${currentModeMeta.label}`}
              </span>
            </button>

            <span aria-hidden="true">·</span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono text-[11px] text-emerald-300"
              title="Cross-device sign-in conversation & memory sync"
            >
              <Cloud className="w-3 h-3 text-emerald-400" />
              <span>{isCloudSynced ? 'Synced Across Devices' : 'Local + Cloud Sync'}</span>
            </span>

            {activeGemName && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-200 font-mono text-[11px]">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>Gem: {activeGemName}</span>
                  {onClearActiveGem && (
                    <button
                      type="button"
                      onClick={onClearActiveGem}
                      className="text-sky-300 hover:text-white ml-0.5"
                      title="Unpin Gemini Gem Bot"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              </>
            )}
          </div>

          {/* Clean Action Controls: Nano Banana Prompt Generator, Human-Like Talkback Toggle, Live Voice & Settings */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                setIsNanoBananaBarOpen((prev) => !prev);
                if (!nanoBananaRawText && inputText.trim()) {
                  setNanoBananaRawText(inputText.trim());
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isNanoBananaBarOpen
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-300'
              }`}
              title="Open Text-to-Nano-Banana Image Generator Prompt bar"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Nano Banana Image</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                if (autoSpeakReplies && isSpeakingId) {
                  onStopSpeaking();
                }
                onToggleAutoSpeak();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                autoSpeakReplies
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                  : 'kara-chat-control-btn text-neutral-400'
              }`}
              title={
                autoSpeakReplies
                  ? '100% Human-Like TTS Talkback ON: KARA automatically speaks every reply aloud with her natural human voice (Zero Robo TTS)'
                  : 'Human-Like TTS Talkback OFF: Click to enable automatic human voice talkback'
              }
            >
              {autoSpeakReplies ? (
                <Volume2
                  className={`w-3.5 h-3.5 text-emerald-400 ${
                    isSpeakingId ? 'animate-pulse' : ''
                  }`}
                />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
              )}
              <span>{autoSpeakReplies ? 'Human TTS: ON' : 'Human TTS: OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onOpenLiveVoice();
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-fuchsia-500/20 hover:from-sky-500/30 hover:to-fuchsia-500/30 border border-sky-400/50 hover:border-sky-300 text-sky-200 rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Real-Time Call: Speak directly with KARA in real-time with continuous bi-directional voice streaming"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Real-Time Voice</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onOpenSettings();
              }}
              className="px-3 py-1.5 text-xs font-medium kara-chat-control-btn border rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Open Settings: Active Persona, MxChat Themes v2.1.6, Agenda, Set Alarm, Memory Vault, Creative Studio, Workspace & Voice"
            >
              <Settings className="w-3.5 h-3.5 text-sky-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>

      {/* Compact Persistent Relationship Status Indicator (Stranger -> Close Friend -> Marriage/Caretaker) */}
      <PersistentRelationshipBanner
        bondLevel={bondLevel}
        currentStage={currentRelMeta}
        onSelectStage={onSelectRelationshipStage}
      />

      {/* Active Alarms & Outgoing Contact Call Live Bar */}
      {(activeAlarms.length > 0 || activeCallContact) && (
        <div className="px-5 py-2 kara-chat-banner border-b flex flex-wrap items-center justify-between gap-2 text-xs">
          {activeAlarms.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeAlarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`px-3 py-1 rounded-xl border flex items-center gap-2 ${
                    alarm.triggered
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <AlarmClock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono font-semibold">{alarm.timeText}</span>
                  <span className="text-neutral-400">({alarm.label})</span>
                  <button
                    type="button"
                    onClick={() => onDismissAlarm(alarm.id)}
                    className="text-neutral-400 hover:text-white ml-1"
                    title="Dismiss alarm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeCallContact && (
            <div className="px-3.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-200 flex items-center gap-3">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>
                Connected Call: <strong>{activeCallContact.name}</strong> ({activeCallContact.phone})
              </span>
              <button
                type="button"
                onClick={onEndContactCall}
                className="px-2 py-0.5 rounded-lg bg-rose-500 text-slate-950 font-semibold flex items-center gap-1"
              >
                <PhoneOff className="w-3 h-3" />
                <span>End</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Adaptive Mode Shift Notification Bar */}
      {modeShiftBanner && (
        <div className="px-5 py-2 bg-sky-950/30 border-b border-sky-800/40 text-xs text-sky-300 flex items-center justify-between gap-2">
          <span>{modeShiftBanner}</span>
          <button
            type="button"
            onClick={onDismissBanner}
            className="text-neutral-400 hover:text-white shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scrollable Composable Message List Display */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <UserMessageBubble
                key={msg.id}
                msg={msg}
                userName={
                  userName &&
                  userName !== 'Friend' &&
                  userName !== 'Explorer' &&
                  userName !== 'User' &&
                  userName !== 'user'
                    ? userName
                    : 'Stephen'
                }
                isSending={isSending}
                isEditing={editingMsgId === msg.id}
                editingDraft={editingDraft}
                copiedId={copiedId}
                onStartEdit={handleStartEdit}
                onCancelEdit={() => {
                  setEditingMsgId(null);
                  setEditingDraft('');
                }}
                onChangeDraft={setEditingDraft}
                onSaveEdit={handleSaveEdit}
                onRetry={onRetryMessage}
                onCopy={handleCopyText}
                onQuote={handleQuoteMessage}
                onDelete={onDeleteMessage}
              />
            );
          }

          return (
            <AiMessageBubble
              key={msg.id}
              msg={msg}
              displayedText={
                streamingMsgId === msg.id
                  ? streamedText
                  : stoppedStreamTexts[msg.id] !== undefined
                  ? stoppedStreamTexts[msg.id]
                  : undefined
              }
              isSending={isSending}
              isStreamingThis={streamingMsgId === msg.id}
              isSpeakingThis={isSpeakingId === msg.id}
              speakingProgress={speakingProgress}
              isReasoningOpen={Boolean(expandedReasoningIds[msg.id])}
              copiedId={copiedId}
              selectedVoiceProfile={selectedVoiceProfile}
              ttsEngine={ttsEngine}
              onToggleReasoning={toggleReasoningDrawer}
              onSpeakWithGender={(text, id, m, gender, readingMode) =>
                onSpeakMessage(text, id, m, gender, readingMode)
              }
              onStopSpeaking={onStopSpeaking}
              onRetry={onRetryMessage}
              onCopy={handleCopyText}
              onQuote={handleQuoteMessage}
              onDelete={onDeleteMessage}
              onSelectQuickReply={(promptText) => onSendMessage(promptText)}
            />
          );
        })}

        {isSending && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <KaraTypingIndicator
              activeMode={activeMode}
              modelTier={modelTier}
              latestUserPrompt={[...messages].reverse().find((m) => m.role === 'user')?.content}
              onStop={handleStopAllResponse}
            />
          </motion.div>
        )}

        {!isSending && (inputText.trim().length > 0 || isRecording || isTranscribing) && (
          <div className="flex justify-end px-2">
            <span className="text-[11px] text-neutral-500 font-mono">
              {isRecording
                ? autoSpeakReplies
                  ? 'Listening — tap stop when finished speaking and KARA will reply & talk back automatically...'
                  : 'Microphone active — speak now (tap mic again to convert to text)...'
                : isTranscribing
                ? 'Transcribing voice for KARA...'
                : `${userName} is typing (Press Enter to send)...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Composer Dock: Context-Aware Suggestion Chips + Fun Mode & Built-in Style Presets + Input Field */}
      <div className="p-4 border-t kara-chat-composer space-y-2.5">
        <QuickReplyChipsRow
          lastAssistantMessage={lastAssistantMsg}
          disabled={isSending}
          onSelectQuickReply={(promptText) => onSendMessage(promptText)}
        />

        {/* Built-in Response Style Presets + Fun Mode Toggle + Prompting Tips & "When to Use" Guide */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* Fun Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onToggleFunMode?.();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1.5 shrink-0 ${
                funMode
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Toggle Fun Mode: Dials up Kara's wit, pop-culture references, casual conversational spark, and confident immediacy"
            >
              <Flame className={`w-3 h-3 ${funMode ? 'text-amber-400' : 'text-neutral-500'}`} />
              <span>Fun Mode: {funMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Segmented Built-in Response Style Presets */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-900/90 border border-neutral-800 shrink-0">
              {RESPONSE_STYLE_PRESETS.map((preset) => {
                const isActive = responseStylePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap');
                      onSelectResponseStylePreset?.(preset.id);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                    title={`${preset.label}: ${preset.tagline} | When to use: ${preset.whenToUse}`}
                  >
                    {preset.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Prompting Tips for Style Control & "When to Use" Guide */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              setIsStyleGuideOpen((prev) => !prev);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1 shrink-0 ${
              isStyleGuideOpen
                ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200'
                : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="View Built-in Response Style Presets, When Kara Uses Short vs. Long Responses, and 1-Tap Prompting Tips for Style Control"
          >
            <Zap className="w-3 h-3 text-fuchsia-400" />
            <span>Style Tips &amp; When to Use</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${isStyleGuideOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Collapsible Style Control & "When to Use" Drawer */}
        {isStyleGuideOpen && (
          <div className="p-3.5 rounded-2xl kara-chat-subcard border border-neutral-800 space-y-3 text-xs">
            {(() => {
              const activePreset =
                RESPONSE_STYLE_PRESETS.find((p) => p.id === responseStylePreset) ||
                RESPONSE_STYLE_PRESETS[0];
              return (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>Active Style: {activePreset.label}</span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span className="text-amber-300 font-mono text-[11px]">
                        Fun Mode {funMode ? 'Active' : 'Muted'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300">{activePreset.tagline}</p>
                    <p className="text-[11px] text-sky-300/90">
                      <span className="font-semibold text-sky-400">When to Use: </span>
                      {activePreset.whenToUse}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStyleGuideOpen(false)}
                    className="self-end sm:self-center p-1 text-neutral-400 hover:text-white"
                    title="Close Style Guide"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })()}

            {/* How Kara Automatically Knows When to Use Short vs. Long Responses */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/90 space-y-1">
                <div className="font-semibold text-emerald-300 text-[11px]">
                  1. Short &amp; Punchy (1–3 Sentences)
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  <span className="text-neutral-200 font-medium">When Kara uses it:</span> Quick banter, casual check-ins, fast reactions, witty comebacks, or short text messages.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/90 space-y-1">
                <div className="font-semibold text-sky-300 text-[11px]">
                  2. Balanced Flow (1–2 Paragraphs)
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  <span className="text-neutral-200 font-medium">When Kara uses it:</span> Everyday chats, candid political/news opinions, pop-culture riffs, and emotional rapport.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/90 space-y-1">
                <div className="font-semibold text-amber-300 text-[11px]">
                  3. Long Deep-Dive (Multi-Angle)
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  <span className="text-neutral-200 font-medium">When Kara uses it:</span> Unpacking major world events, critiquing &amp; fixing other chatbots, complex strategy, or deep roleplay.
                </p>
              </div>
            </div>

            {/* 1-Tap Prompting Tips for Style Control */}
            <div className="space-y-1.5 pt-0.5">
              <div className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                <span>Prompting Tips for Style Control (Tap to add to your message):</span>
                <span className="text-[10px] font-mono text-neutral-500">
                  Wit · Pop-Culture · Casual · Confident
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_CONTROL_PROMPTING_TIPS.map((tip) => (
                  <button
                    key={tip.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap');
                      setInputText((prev) => {
                        const base = prev.trim();
                        const next = base ? `${base} — ${tip.promptModifier}` : tip.promptModifier;
                        dictationBaseInputRef.current = next;
                        return next;
                      });
                      inputFieldRef.current?.focus();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-fuchsia-500/15 border border-neutral-800 hover:border-fuchsia-500/40 text-left transition-colors"
                    title={`When to use: ${tip.whenToUse} | Inserts: "${tip.promptModifier}"`}
                  >
                    <div className="text-[11px] font-medium text-neutral-200">{tip.label}</div>
                    <div className="text-[10px] text-neutral-400">{tip.whenToUse}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input for multi-photo sharing */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handlePhotoFilesSelect(e.target.files);
            }
            e.target.value = '';
          }}
        />

        {/* Inline Share Link Drawer when "Share Link" is clicked */}
        {isLinkInputOpen && (
          <div className="flex items-center gap-2 p-2.5 rounded-2xl kara-chat-subcard border border-indigo-500/40">
            <Link2 className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />
            <input
              type="text"
              value={linkInputValue}
              onChange={(e) => setLinkInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStagedLink();
                }
              }}
              placeholder="Paste or type a URL to share with KARA (e.g. https://example.com)..."
              className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddStagedLink}
              className="px-3 py-1 text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-xl transition-colors"
            >
              Attach Link
            </button>
            <button
              type="button"
              onClick={() => setIsLinkInputOpen(false)}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Staged Multi-Photos & Shared Links Preview Bar */}
        {(stagedPhotos.length > 0 || stagedLinks.length > 0) && (
          <div className="space-y-2 p-2.5 rounded-2xl kara-chat-subcard border">
            {stagedPhotos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono px-1">
                  <span className="text-sky-400 font-semibold">
                    {stagedPhotos.length === 1
                      ? '1 photo staged to share'
                      : `${stagedPhotos.length} photos staged to share at once`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-2 py-0.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add More Pics</span>
                    </button>
                    {stagedPhotos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setStagedPhotos([])}
                        className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-rose-950/50 border border-neutral-700 hover:border-rose-500/40 text-neutral-400 hover:text-rose-300 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {stagedPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || `${photo.name}_${idx}`}
                      className="flex items-center gap-2 pr-2 py-1 pl-1.5 rounded-xl bg-neutral-900 border border-sky-500/40 text-xs text-sky-200 shrink-0"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.name}
                        className="w-10 h-10 rounded-lg object-cover border border-neutral-700 shrink-0"
                      />
                      <div className="max-w-[130px]">
                        <div className="font-semibold truncate text-white">{photo.name}</div>
                        <div className="text-[10px] text-sky-400 font-mono">
                          Pic #{idx + 1}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setStagedPhotos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1 text-neutral-400 hover:text-rose-400 rounded-lg"
                        title="Remove this photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick 1-Tap Prompts for KARA's Thoughts on Staged Photos */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0 mr-1">
                    Ask KARA:
                  </span>
                  {[
                    {
                      label: 'Give me your honest thoughts',
                      prompt:
                        stagedPhotos.length > 1
                          ? `Look closely at all ${stagedPhotos.length} photos I'm sharing and tell me your honest thoughts on each of them!`
                          : 'Look closely at this photo I am sharing and tell me your honest thoughts about it!',
                    },
                    {
                      label: 'Rate & roast my pic(s)',
                      prompt:
                        stagedPhotos.length > 1
                          ? `Rate all ${stagedPhotos.length} of my photos out of 10 and give me your playful unfiltered take!`
                          : 'Rate this photo out of 10 and give me your playful unfiltered take!',
                    },
                    {
                      label: 'Spot every detail & vibe',
                      prompt:
                        'Tell me every little detail, mood, and vibe you notice in my shared photo(s)!',
                    },
                    {
                      label: 'Nano Banana: Remix this pic',
                      prompt:
                        'Give me your thoughts on this photo and generate a creative Nano Banana remix of it!',
                    },
                  ].map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap');
                        setInputText(q.prompt);
                        inputFieldRef.current?.focus();
                      }}
                      className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-sky-500/15 border border-neutral-700/80 hover:border-sky-500/40 text-[11px] text-neutral-300 hover:text-sky-200 transition-colors whitespace-nowrap shrink-0"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {stagedLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {stagedLinks.map((url, idx) => (
                  <div
                    key={`${url}_${idx}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-indigo-500/40 text-xs text-indigo-200 max-w-xs"
                  >
                    <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setStagedLinks((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-neutral-400 hover:text-rose-400 shrink-0"
                      title="Remove link"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inline Text-to-Nano-Banana Image Generator Prompt Drawer */}
        {isNanoBananaBarOpen && (
          <div className="p-3 rounded-2xl kara-chat-subcard border border-amber-500/45 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <span>Text → Nano Banana Image Generator Prompt</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono">
                  Unlimited · No Limit
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsNanoBananaBarOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={nanoBananaRawText}
                onChange={(e) => setNanoBananaRawText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleDispatchNanoBananaInChat();
                  }
                }}
                placeholder="Type any plain text idea (e.g. 'futuristic Tokyo street in neon rain')..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                disabled={(!nanoBananaRawText.trim() && !inputText.trim()) || isConvertingNanoPrompt}
                onClick={handleConvertTextToNanoBananaPromptInChat}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-amber-500/40 text-xs font-medium text-amber-200 flex items-center justify-center gap-1.5 shrink-0 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isConvertingNanoPrompt
                    ? 'Converting Text...'
                    : 'Convert Text → Nano Banana Prompt'}
                </span>
              </button>
              <button
                type="button"
                disabled={
                  (!nanoBananaRawText.trim() &&
                    !nanoBananaConvertedPrompt.trim() &&
                    !inputText.trim()) ||
                  isSending ||
                  isGeneratingNanoImage
                }
                onClick={handleDispatchNanoBananaInChat}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-sky-400 hover:from-amber-300 hover:to-sky-300 disabled:opacity-40 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>
                  {isGeneratingNanoImage ? 'Generating...' : 'Generate Nano Banana Image'}
                </span>
              </button>
            </div>

            {nanoBananaConvertedPrompt && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-amber-300 block">
                  Expanded Nano Banana Image Generator Prompt (Editable):
                </label>
                <textarea
                  rows={2}
                  value={nanoBananaConvertedPrompt}
                  onChange={(e) => setNanoBananaConvertedPrompt(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-950 border border-amber-500/40 text-amber-100 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Material 3 Text Input Field + Microphone Voice-to-Text, Multi-Photo Upload, Nano Banana & Enter-to-Send */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              onToggleMicRecording();
            }}
            disabled={isTranscribing}
            className={`p-3 rounded-2xl border transition-colors shrink-0 ${
              isRecording
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                : 'kara-chat-control-btn'
            }`}
            title="Capture voice via microphone and convert to text input"
          >
            {isRecording ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              onOpenLiveVoice();
            }}
            disabled={isSending}
            className="p-3 rounded-2xl border border-sky-400/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 transition-all hover:scale-105 shrink-0"
            title="Real-Time Voice: Start full-duplex live audio call with KARA"
          >
            <Zap className="w-4 h-4 text-sky-400" />
          </button>

          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={isSending}
            className={`relative p-3 rounded-2xl border transition-colors shrink-0 ${
              stagedPhotos.length > 0
                ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                : 'kara-chat-control-btn'
            }`}
            title="Upload or share multiple photos at once with KARA"
          >
            <ImagePlus className="w-4 h-4" />
            {stagedPhotos.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-400 text-slate-950 font-mono text-[10px] font-bold flex items-center justify-center shadow">
                {stagedPhotos.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              setIsNanoBananaBarOpen((prev) => !prev);
              if (!nanoBananaRawText && inputText.trim()) {
                setNanoBananaRawText(inputText.trim());
              }
            }}
            disabled={isSending}
            className={`p-3 rounded-2xl border transition-colors shrink-0 ${
              isNanoBananaBarOpen
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'kara-chat-control-btn text-amber-300'
            }`}
            title="Text-to-Nano-Banana Image Generator Prompt"
          >
            <Wand2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              setIsLinkInputOpen((prev) => !prev);
            }}
            disabled={isSending}
            className={`p-3 rounded-2xl border transition-colors shrink-0 ${
              isLinkInputOpen || stagedLinks.length > 0
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                : 'kara-chat-control-btn'
            }`}
            title="Share a link with KARA"
          >
            <Link2 className="w-4 h-4" />
          </button>

          <input
            ref={inputFieldRef}
            type="text"
            value={inputText}
            onChange={(e) => {
              const nextVal = e.target.value;
              setInputText(nextVal);
              if (!isRecording) {
                dictationBaseInputRef.current = nextVal.trim();
              }
              triggerAutoCollapseSidePanel();
              if (autoCollapseThoughtProcess && Object.keys(expandedReasoningIds).length > 0) {
                setExpandedReasoningIds({});
              }
              onUserTyping?.();
            }}
            onFocus={() => {
              triggerAutoCollapseSidePanel();
              onUserTyping?.();
            }}
            onKeyDown={(e) => {
              onUserTyping?.();
              handleInputKeyDown(e);
            }}
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (!items) return;
              const pastedImageFiles: File[] = [];
              for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                  const file = items[i].getAsFile();
                  if (file) {
                    pastedImageFiles.push(file);
                  }
                }
              }
              if (pastedImageFiles.length > 0) {
                handlePhotoFilesSelect(pastedImageFiles);
              }
            }}
            placeholder={
              isRecording
                ? 'Listening... tap stop to insert voice transcript into input'
                : isTranscribing
                ? 'Converting voice to text...'
                : `Message KARA, generate Nano Banana art, or paste a link (${currentModeMeta.label}) — Enter to send...`
            }
            className="flex-1 kara-chat-input border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors"
          />

          {isKaraResponding && (
            <button
              type="button"
              onClick={handleStopAllResponse}
              className="px-4 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/60 text-rose-200 font-semibold text-sm transition-all active:scale-95 flex items-center gap-2 shrink-0 shadow-md"
              title="Stop KARA response immediately"
            >
              <Square className="w-4 h-4 fill-current text-rose-400" />
              <span>Stop</span>
            </button>
          )}

          {(!isSending && !streamingMsgId) && (
            <button
              type="submit"
              disabled={
                (!inputText.trim() && stagedPhotos.length === 0 && stagedLinks.length === 0) ||
                isSending
              }
              className="px-5 py-3 rounded-2xl kara-send-btn hover:opacity-90 disabled:opacity-40 font-semibold text-sm transition-all active:scale-95 flex items-center gap-2 shrink-0 shadow-md"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
      </div>
    </section>
  );
};
