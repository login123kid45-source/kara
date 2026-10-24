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
} from 'lucide-react';
import { KaraMode, ChatMessageData } from '../lib/firebase';
import { triggerHaptic } from '../lib/haptics';
import type { TtsEngineType } from './SettingsModal';

export type ModelTier = 'fast' | 'standard' | 'thinking';
export type GroundingOption = 'none' | 'search' | 'maps';
export type VoiceGender = 'female' | 'male';
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

export interface EnhancedChatMessage extends ChatMessageData {
  sessionId?: string;
  sources?: { title: string; uri: string; type: 'web' | 'maps' }[];
  modelUsed?: string;
  subtext?: string;
  emotionalNuanceType?: string;
  empathyStrategy?: string;
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
  sharedPhotoUrl?: string;
  sharedPhotoName?: string;
  sharedPhotos?: SharedPhotoItem[];
  sharedLinks?: string[];
  isDepressionCheckin?: boolean;
  supportHotlines?: SupportHotlineItem[];
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
    label: 'Memory Recall: What do you remember?',
    prompt: '/recall all',
  },
  {
    label: "What's on my agenda today?",
    prompt: "What's on my agenda today?",
  },
  {
    label: 'Set an alarm for 8:00 AM',
    prompt: 'Set an alarm for 8:00 AM tomorrow for my morning routine',
  },
  {
    label: 'Roleplay: Match my vibe tonight',
    prompt: '*smiles warmly* Tell me about Sector 9 and match my vibe tonight!',
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
  isSpeakingThis: boolean;
  isReasoningOpen: boolean;
  copiedId: string | null;
  selectedVoiceProfile: VoiceProfileOption;
  ttsEngine: TtsEngineType;
  onToggleReasoning: (msgId: string) => void;
  onSpeakWithGender: (text: string, msgId: string, mode: KaraMode, gender: VoiceGender) => void;
  onStopSpeaking: () => void;
  onRetry: (msgId: string) => void;
  onCopy: (msgId: string, text: string) => void;
  onQuote: (text: string) => void;
  onDelete: (msgId: string) => void;
  onSelectQuickReply?: (promptText: string) => void;
}

export const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({
  msg,
  displayedText,
  isSending,
  isSpeakingThis,
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

  const allReasoningSteps = React.useMemo(
    () =>
      msg.reasoningTrace && msg.reasoningTrace.length > 0
        ? msg.reasoningTrace
        : [
            `Input Decoding: Analyzed input sentiment ("${
              msg.emotionDetected || 'Expressive'
            }") and user conversational intent.`,
            `Context Correlation: Correlated with Sector 9 memories, conversational history, and relationship bond.`,
            `Persona Synthesis: Formulated human companion dialogue tailored to ${modeMeta.label} persona.`,
          ],
    [msg.reasoningTrace, msg.emotionDetected, modeMeta.label]
  );

  const normalizedThoughtFilter = thoughtFilterQuery.trim().toLowerCase();
  const filteredReasoningSteps = React.useMemo(
    () =>
      allReasoningSteps
        .map((stepText, originalIndex) => ({ stepText, originalIndex }))
        .filter(
          ({ stepText, originalIndex }) =>
            !normalizedThoughtFilter ||
            stepText.toLowerCase().includes(normalizedThoughtFilter) ||
            `step ${originalIndex + 1}`.includes(normalizedThoughtFilter)
        ),
    [allReasoningSteps, normalizedThoughtFilter]
  );

  const fullSpokenText = React.useMemo(() => {
    const spokenSegments: string[] = [];
    if (msg.scoldingNotice) {
      spokenSegments.push(msg.scoldingNotice);
    }
    if (msg.photoThoughts) {
      if (
        msg.photoThoughts.summary &&
        !msg.content
          .toLowerCase()
          .includes(msg.photoThoughts.summary.toLowerCase().slice(0, 28))
      ) {
        spokenSegments.push(msg.photoThoughts.summary);
      }
      if (msg.photoThoughts.observations && msg.photoThoughts.observations.length > 0) {
        const distinctObs = msg.photoThoughts.observations.filter(
          (obs) => !msg.content.toLowerCase().includes(obs.toLowerCase().slice(0, 28))
        );
        if (distinctObs.length > 0) {
          spokenSegments.push(distinctObs.join('. '));
        }
      }
    }
    if (msg.content) {
      spokenSegments.push(msg.content);
    }
    return spokenSegments.join('. ');
  }, [msg.content, msg.photoThoughts, msg.scoldingNotice]);

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
        {msg.emotionDetected && (
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

      {/* Subtle, Collapsible Thought Process Indicator Visualizing Kara's Reasoning & Persona Adaptation */}
      <div className="mb-2 max-w-[88%] w-full">
        <button
          type="button"
          aria-expanded={isReasoningOpen}
          onClick={() => {
            triggerHaptic('tap');
            onToggleReasoning(msg.id);
          }}
          className={`kara-thought-trigger group flex items-center gap-2 text-xs rounded-xl px-3 py-1.5 border text-left ${
            isReasoningOpen
              ? 'kara-thought-trigger--open text-neutral-100'
              : 'bg-neutral-900/45 hover:bg-neutral-900/85 text-neutral-400 hover:text-neutral-200'
          }`}
          title="Inspect Kara's internal thought process, reasoning steps, subtext perception, and persona adaptation"
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-60 ${
                  isReasoningOpen ? 'animate-pulse' : 'animate-ping'
                }`}
              />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500" />
            </span>
            <Brain className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 group-hover:scale-110 transition-transform" />
          </div>

          <span className="font-mono text-[11px] tabular-nums text-neutral-300">
            Thought for {((msg.thinkingDurationMs || 520) / 1000).toFixed(1)}s
          </span>

          <span aria-hidden="true" className="text-neutral-600">
            ·
          </span>

          <span className="text-[11px] font-medium text-neutral-300 truncate">
            {isReasoningOpen ? 'Hide Thought Process' : 'Kara’s Thought Process'}
          </span>

          {msg.mode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950/80 border border-neutral-800 text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>{modeMeta.label}</span>
            </span>
          )}

          <span
            className={`ml-auto text-neutral-500 group-hover:text-neutral-300 transition-transform duration-300 shrink-0 ${
              isReasoningOpen ? 'rotate-90 text-fuchsia-300' : 'rotate-0'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* Pure CSS Smooth Height Transition (0fr -> 1fr) + Subtle Glowing Border */}
        <div
          aria-hidden={!isReasoningOpen}
          className={`kara-thought-drawer text-xs text-neutral-300 ${
            isReasoningOpen ? 'kara-thought-drawer--open' : ''
          }`}
        >
          <div className="kara-thought-drawer-inner">
            <div className="kara-thought-top-beam" />
            <div className="p-4 space-y-3.5">
              {/* Header with Execution Telemetry */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300">
                    <Brain className="w-3.5 h-3.5 text-fuchsia-400" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>Kara&apos;s Reasoning &amp; Persona Adaptation</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Transparent internal cognition trace &amp; EQ perception
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
                </div>
              </div>

              {/* 1. Persona Adaptation & Mode Calibration */}
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

              {/* 2. EQ Interpretation & Subtext (if detected) */}
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

              {/* 3. Visualized Sequential Reasoning Steps */}
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-mono">
                    Sequential Reasoning Steps
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 tabular-nums">
                    {normalizedThoughtFilter
                      ? `${filteredReasoningSteps.length} of ${allReasoningSteps.length} matching`
                      : `${allReasoningSteps.length} steps`}
                  </div>
                </div>

                {/* Filter / Search Input for Reasoning Steps */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={thoughtFilterQuery}
                    onChange={(e) => setThoughtFilterQuery(e.target.value)}
                    placeholder="Filter reasoning steps (e.g., sentiment, memory, persona)..."
                    aria-label="Filter Kara's reasoning steps"
                    className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-fuchsia-500/60 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-neutral-200 placeholder:text-neutral-500 font-mono focus:outline-none transition-colors"
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

                {filteredReasoningSteps.length > 0 ? (
                  <div className="space-y-2.5 pl-1 border-l-2 border-fuchsia-500/35 ml-2 pt-0.5">
                    {filteredReasoningSteps.map(({ stepText, originalIndex }, filteredIdx) => (
                      <div
                        key={originalIndex}
                        className={`kara-thought-step kara-thought-step--${Math.min(
                          filteredIdx,
                          5
                        )} relative pl-4 text-xs`}
                      >
                        <div className="kara-thought-step-badge absolute -left-[1.3rem] top-0.5 w-4 h-4 rounded-full bg-neutral-900 border border-fuchsia-400 text-[10px] font-mono text-fuchsia-300 flex items-center justify-center shadow-sm">
                          {originalIndex + 1}
                        </div>
                        <p className="text-neutral-200 leading-relaxed font-mono text-[11px]">
                          {stepText}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2.5 px-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between gap-2 text-[11px] text-neutral-400 font-mono">
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

        <div className="whitespace-pre-wrap">{textToRender}</div>

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

        {/* Inline Gemini Nano Banana (No Limit) Artwork Card */}
        {msg.generatedImageUrl && (
          <div className="mt-3.5 p-3.5 rounded-2xl kara-chat-subcard border border-sky-500/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>Gemini Nano Banana · Unlimited Generation</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                <span>No Limit</span>
              </span>
            </div>
            <img
              src={msg.generatedImageUrl}
              alt="KARA Nano Banana Synthesis"
              referrerPolicy="no-referrer"
              className="w-full max-h-80 rounded-xl border border-neutral-800 object-contain bg-neutral-950"
            />
            <div className="flex items-center justify-end gap-2">
              <a
                href={msg.generatedImageUrl}
                download={`kara_nano_banana_${msg.id}.png`}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl flex items-center gap-1.5 transition-colors"
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

      {/* AI Composable Action Bar */}
      <div className="flex flex-wrap items-center gap-3 mt-1.5 px-1">
        {isSpeakingThis ? (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Stop Voice</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onSpeakWithGender(fullSpokenText, msg.id, msg.mode, 'female');
              }}
              className={`text-xs flex items-center gap-1 transition-colors ${
                selectedVoiceProfile.gender === 'female'
                  ? 'text-sky-400 hover:text-sky-300 font-medium'
                  : 'text-neutral-400 hover:text-sky-300'
              }`}
              title="Listen in KARA's natural female neural voice"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>
                Natural Female (
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
                onSpeakWithGender(fullSpokenText, msg.id, msg.mode, 'male');
              }}
              className={`text-xs flex items-center gap-1 transition-colors ${
                selectedVoiceProfile.gender === 'male'
                  ? 'text-indigo-400 hover:text-indigo-300 font-medium'
                  : 'text-neutral-400 hover:text-indigo-300'
              }`}
              title="Listen in KARA's natural male neural voice"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>
                Natural Male (
                {selectedVoiceProfile.gender === 'male'
                  ? selectedVoiceProfile.voiceName
                  : 'Puck'}
                )
              </span>
            </button>
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
  onStop?: () => void;
}> = ({ activeMode, modelTier, onStop }) => {
  const [elapsedTenths, setElapsedTenths] = useState(0);
  const modeMeta = MODE_META[activeMode] || MODE_META.regular;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTenths((t) => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const seconds = (elapsedTenths / 10).toFixed(1);
  const phaseLabel =
    elapsedTenths < 12
      ? 'Sector 9 neural matrix adapting to your vibe...'
      : elapsedTenths < 25
      ? 'Recalling persistent memory & relationship stage...'
      : `Composing in ${modeMeta.label} persona...`;

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1.5 px-1">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
        <span className="font-bold text-white">KARA</span>
        <span aria-hidden="true">·</span>
        <span className={modeMeta.accentText}>{modeMeta.label} typing</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono tabular-nums text-neutral-500">{seconds}s</span>
      </div>

      <div
        className={`kara-ai-bubble border rounded-3xl rounded-bl-md px-4 py-3 flex items-center gap-3 shadow-md ${modeMeta.topBarAccent}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce" />
        </div>
        <span className="text-xs text-neutral-300">
          {modelTier === 'thinking' ? `[Grok Think] ${phaseLabel}` : phaseLabel}
        </span>
        {onStop && (
          <button
            type="button"
            onClick={onStop}
            className="ml-2 px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
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
): { label: string; prompt: string; isDynamic: boolean }[] {
  if (!lastMsg) {
    return DEFAULT_FOUR_QUICK_STARTERS.map((c) => ({ ...c, isDynamic: false }));
  }

  const chips: { label: string; prompt: string; isDynamic: boolean }[] = [];
  const lower = (lastMsg.content || '').toLowerCase();

  // 1. Prioritize contextual follow-ups generated for KARA's last message
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
      label: 'Nano Banana: Generate another variation',
      prompt: 'Generate another Nano Banana image variation of our scene with dramatic lighting',
      isDynamic: true,
    });
  } else if (lastMsg.agendaEvents && lastMsg.agendaEvents.length > 0) {
    chips.unshift({
      label: 'Set alarm for my next event',
      prompt: `Set an alarm for ${lastMsg.agendaEvents[0].startTime} for ${lastMsg.agendaEvents[0].summary}`,
      isDynamic: true,
    });
  } else if (lastMsg.soapTriggered || lower.includes('soap')) {
    chips.unshift({
      label: "I'm sorry! I'll use good words",
      prompt: "*rinses mouth and pouts* I'm sorry KARA, I promise I'll use good manners now!",
      isDynamic: true,
    });
  } else if (lower.includes('?')) {
    // KARA asked a question in her last message
    chips.push({
      label: 'Tell me what you think first',
      prompt: 'I want to hear your honest take on that question first—what do you think?',
      isDynamic: true,
    });
  }

  // 3. Always include a context-aware Unlimited Nano Banana visual action based on KARA's last message
  const snippet = lastMsg.content
    .replace(/\*([^*]+)\*/g, '$1')
    .slice(0, 55)
    .trim();
  const hasNanoChip = chips.some((c) => c.label.toLowerCase().includes('nano banana'));
  if (!hasNanoChip) {
    chips.push({
      label: 'Nano Banana: Visualize this (No Limit)',
      prompt: `Generate a Nano Banana image visualizing our current moment: "${snippet}"`,
      isDynamic: true,
    });
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
      <span className="text-[11px] font-medium text-sky-400/90 uppercase tracking-wider shrink-0 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-sky-400" />
        <span>Suggested Next ({combinedChips.length}/4):</span>
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
          className={`px-3 py-1.5 text-xs rounded-2xl border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
            chip.isDynamic
              ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 text-sky-200'
              : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white'
          } disabled:opacity-40`}
          title={chip.prompt}
        >
          {chip.label}
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
  sessions: ChatSessionSummary[];
  activeSessionId: string;
  userName: string;
  activeMode: KaraMode;
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
    genderOverride?: VoiceGender
  ) => void;
  onStopSpeaking: () => void;
  onStopResponse: () => void;
  onToggleMicRecording: () => void;
  onOpenLiveVoice: () => void;
  onClearConversation: () => void;
  activeGemName?: string | null;
  onClearActiveGem?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  sessions,
  activeSessionId,
  userName,
  activeMode,
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
}) => {
  const [inputText, setInputText] = useState('');
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multi-Photo & Link Sharing State
  const [stagedPhotos, setStagedPhotos] = useState<SharedPhotoItem[]>([]);
  const [stagedLinks, setStagedLinks] = useState<string[]>([]);
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [isRecallPickerOpen, setIsRecallPickerOpen] = useState(false);
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

  // When voice-to-text finishes transcribing, populate the input field so the user can review or press Enter to send
  useEffect(() => {
    if (voiceDraftTranscript) {
      setInputText((prev) =>
        prev.trim() ? `${prev.trim()} ${voiceDraftTranscript}` : voiceDraftTranscript
      );
      onConsumeVoiceDraft();
      inputFieldRef.current?.focus();
    }
  }, [voiceDraftTranscript, onConsumeVoiceDraft]);

  // Progressive token reveal when a new assistant reply arrives and tokenStreaming is ON
  useEffect(() => {
    const newestAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!newestAssistant) return;

    if (
      lastSeenAssistantIdRef.current &&
      lastSeenAssistantIdRef.current !== newestAssistant.id &&
      tokenStreaming
    ) {
      lastSeenAssistantIdRef.current = newestAssistant.id;
      const fullWords = newestAssistant.content.split(' ');
      if (fullWords.length <= 4) {
        setStreamingMsgId(null);
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
      lastSeenAssistantIdRef.current = newestAssistant.id;
    }
  }, [messages, tokenStreaming]);

  const handleStopAllResponse = () => {
    triggerHaptic('tap');
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    if (streamingMsgId) {
      setStoppedStreamTexts((prev) => ({
        ...prev,
        [streamingMsgId]: streamedText,
      }));
      setStreamingMsgId(null);
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
    setExpandedReasoningIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <section className="w-full kara-chat-shell border rounded-3xl flex flex-col h-[calc(100vh-6.5rem)] min-h-[600px] overflow-hidden relative">
      {/* Chat History Sessions Sidebar Drawer (Firestore & Room DB multi-session switcher) */}
      {isHistoryDrawerOpen && (
        <div className="absolute inset-0 z-30 flex bg-black/70 backdrop-blur-sm">
          <div className="w-80 max-w-[85%] kara-chat-header border-r h-full flex flex-col p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[11px] font-mono text-sky-400 uppercase">
                  Firestore & Room Sessions
                </span>
                <h3 className="text-sm font-semibold text-white">
                  Conversation History
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap');
                onCreateNewSession();
                setIsHistoryDrawerOpen(false);
              }}
              className="w-full py-2.5 px-3.5 rounded-2xl kara-send-btn hover:opacity-90 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Chat Session</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sessions.map((sess) => {
                const isCurrent = sess.id === activeSessionId;
                const modeInfo = MODE_META[sess.lastMode] || MODE_META.regular;
                return (
                  <div
                    key={sess.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                      isCurrent
                        ? 'bg-sky-500/15 border-sky-500/50 text-white'
                        : 'bg-neutral-900/70 border-neutral-800/90 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap');
                        onSelectSession(sess.id);
                        setIsHistoryDrawerOpen(false);
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
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-1.5 font-mono">
                        <span className={modeInfo.accentText}>{modeInfo.label}</span>
                        <span>·</span>
                        <span>{sess.messageCount} msgs</span>
                      </div>
                    </button>

                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteSession(sess.id)}
                        className="p-1 text-neutral-500 hover:text-rose-400 shrink-0"
                        title="Delete chat session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className="flex-1"
            onClick={() => setIsHistoryDrawerOpen(false)}
          />
        </div>
      )}

      {/* Clean Minimalist Top App Bar: Chat History Drawer Button, Persistent Relationship Status & Settings */}
      <div className="px-5 py-3 border-b kara-chat-header flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-400">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              setIsHistoryDrawerOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl kara-chat-control-btn border flex items-center gap-1.5 transition-colors"
            title="Open Past Chats Drawer"
          >
            <History className="w-3.5 h-3.5 text-sky-400" />
            <span>Chats ({sessions.length})</span>
          </button>

          <span className="font-semibold text-white">KARA</span>
          <span aria-hidden="true">·</span>
          <span
            className="font-mono flex items-center gap-1 text-emerald-400"
            title="Unlimited Chat · Zero Paywalls"
          >
            <InfinityIcon className="w-3.5 h-3.5" />
            <span>Unlimited</span>
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

        {/* Clean Action Controls: Seamless Talkback Toggle, Live Voice & Settings */}
        <div className="flex flex-wrap items-center gap-2">
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
                ? 'Seamless Talkback ON: KARA automatically speaks every reply aloud with gapless neural voice'
                : 'Seamless Talkback OFF: Click to enable automatic voice talkback'
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
            <span>{autoSpeakReplies ? 'Talkback: ON' : 'Talkback: OFF'}</span>
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
            title="Open Settings: Active Persona, Theme, Agenda, Set Alarm, Memory Vault, Creative Studio, Workspace & Voice"
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
                userName={userName}
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
              isSpeakingThis={isSpeakingId === msg.id}
              isReasoningOpen={Boolean(expandedReasoningIds[msg.id])}
              copiedId={copiedId}
              selectedVoiceProfile={selectedVoiceProfile}
              ttsEngine={ttsEngine}
              onToggleReasoning={toggleReasoningDrawer}
              onSpeakWithGender={(text, id, m, gender) =>
                onSpeakMessage(text, id, m, gender)
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

      {/* Bottom Composer Dock: Context-Aware Suggestion Chips + Token/DeeperSearch/Nano Banana Toggles + Input Field */}
      <div className="p-4 border-t kara-chat-composer space-y-3">
        <QuickReplyChipsRow
          lastAssistantMessage={lastAssistantMsg}
          disabled={isSending}
          onSelectQuickReply={(promptText) => onSendMessage(promptText)}
        />

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

        {/* Memory Recall Topic Quick-Launcher Drawer */}
        {isRecallPickerOpen && (
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Sector 9 Memory Recall Command (/recall)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsRecallPickerOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-300">
              Select a quick topic or type <code className="text-indigo-300 bg-neutral-900 px-1 py-0.5 rounded font-mono">/recall [topic]</code> to summarize what KARA remembers about you:
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
                    triggerHaptic('tap');
                    setIsRecallPickerOpen(false);
                    onSendMessage(t.cmd);
                  }}
                  className="px-2.5 py-1 text-xs rounded-xl bg-neutral-900 hover:bg-indigo-500/25 border border-indigo-800/60 hover:border-indigo-400 text-indigo-200 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
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

        {/* Material 3 Text Input Field + Microphone Voice-to-Text, Multi-Photo Upload & Enter-to-Send */}
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

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              setIsRecallPickerOpen((prev) => !prev);
            }}
            disabled={isSending}
            className={`p-3 rounded-2xl border transition-colors shrink-0 ${
              isRecallPickerOpen
                ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
                : 'kara-chat-control-btn hover:text-indigo-300'
            }`}
            title="Memory Recall (/recall): Ask KARA what she remembers about specific topics"
          >
            <Database className="w-4 h-4 text-indigo-400" />
          </button>

          <input
            ref={inputFieldRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleInputKeyDown}
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
                : `Message KARA, share multiple pics, or paste a link (${currentModeMeta.label}) — Enter to send...`
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
    </section>
  );
};
