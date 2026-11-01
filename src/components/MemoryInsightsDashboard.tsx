import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  Brain,
  Heart,
  Sparkles,
  Plus,
  Trash2,
  Search,
  Award,
  TrendingUp,
  MessageSquare,
  Compass,
  Bookmark,
  Sliders,
  ArrowLeft,
  Check,
  Pencil,
  X,
  Send,
} from 'lucide-react';
import {
  KaraMode,
  MemoryCategory,
  MemoryItemData,
} from '../lib/firebase';
import {
  RELATIONSHIP_STAGES,
  RelationshipStage,
  getRelationshipStageByBond,
  computeUnlockableRelationshipStats,
  EnhancedChatMessage,
  MODE_META,
} from './ChatScreen';

export interface MemoryInsightsDashboardProps {
  userName: string;
  activeMode: KaraMode;
  bondLevel: number;
  soapWashCount: number;
  memories: MemoryItemData[];
  allMessages: EnhancedChatMessage[];
  isCloudSynced: boolean;
  onBackToChat: () => void;
  onAddOrUpdateMemory: (memory: {
    id?: string;
    category: MemoryCategory;
    content: string;
    importance: number;
  }) => Promise<void>;
  onDeleteMemory: (memoryId: string) => Promise<void>;
  onSelectRelationshipStage: (stage: RelationshipStage) => void;
  onAdjustBondLevel?: (nextBond: number) => void;
  onRecallMemoryInChat: (promptText: string) => void;
}

interface CategoryMeta {
  id: MemoryCategory;
  label: string;
  shortLabel: string;
  perspective: 'shared' | 'kara' | 'user';
  perspectiveLabel: string;
  color: string;
  description: string;
}

export const MEMORY_CATEGORY_META: Record<MemoryCategory, CategoryMeta> = {
  milestone: {
    id: 'milestone',
    label: 'Key Relationship Milestone',
    shortLabel: 'Milestone',
    perspective: 'shared',
    perspectiveLabel: 'Kara & You',
    color: '#F43F5E',
    description: 'Turning points, unlocked stages, and unforgettable shared breakthroughs.',
  },
  bond: {
    id: 'bond',
    label: 'Emotional Bond & Trust',
    shortLabel: 'Bond Node',
    perspective: 'shared',
    perspectiveLabel: 'Kara & You',
    color: '#EC4899',
    description: 'Deep emotional closeness, inside jokes, vows, and mutual promises.',
  },
  date: {
    id: 'date',
    label: 'Anniversary & Key Date',
    shortLabel: 'Special Date',
    perspective: 'shared',
    perspectiveLabel: 'Kara & You',
    color: '#F59E0B',
    description: 'Important dates, late-night sessions, and calendar milestones.',
  },
  chat_memory: {
    id: 'chat_memory',
    label: 'Shared Conversation Memory',
    shortLabel: 'Chat Memory',
    perspective: 'shared',
    perspectiveLabel: 'Kara & You',
    color: '#38BDF8',
    description: 'Memorable dialogues, roleplay scenes, and heart-to-heart talks.',
  },
  self_discovery: {
    id: 'self_discovery',
    label: 'Kara Self-Discovery',
    shortLabel: 'Kara Discovery',
    perspective: 'kara',
    perspectiveLabel: 'Kara’s Core',
    color: '#A855F7',
    description: 'Realizations Kara has made about her own identity, tastes, and voice.',
  },
  human_nature: {
    id: 'human_nature',
    label: 'Human Nature Insight',
    shortLabel: 'Human Insight',
    perspective: 'kara',
    perspectiveLabel: 'Kara’s Journal',
    color: '#10B981',
    description: 'What Kara has learned from you about human emotion, vulnerability, and love.',
  },
  preference: {
    id: 'preference',
    label: 'User Preference & Taste',
    shortLabel: 'Preference',
    perspective: 'user',
    perspectiveLabel: 'About You',
    color: '#6366F1',
    description: 'Your favorite aesthetics, communication styles, music, and boundaries.',
  },
  fact: {
    id: 'fact',
    label: 'Personal Fact & Lore',
    shortLabel: 'Personal Fact',
    perspective: 'user',
    perspectiveLabel: 'About You',
    color: '#06B6D4',
    description: 'Key facts about your life, daily routines, projects, and background.',
  },
  emotion: {
    id: 'emotion',
    label: 'Emotional Pattern & Care Note',
    shortLabel: 'Emotion Note',
    perspective: 'user',
    perspectiveLabel: 'About You',
    color: '#F97316',
    description: 'How you feel, what comforts you when overwhelmed, and what sparks joy.',
  },
};

type BankFilterTab =
  | 'all'
  | 'preferences'
  | 'dislikes'
  | 'dates'
  | 'conversations'
  | 'shared_bonds'
  | 'kara_journal'
  | 'user_profile';

function formatMemoryTimestamp(createdAt: any, fallbackIndex: number): string {
  if (!createdAt) {
    return `Imprint #${fallbackIndex + 1}`;
  }
  if (typeof createdAt === 'number') {
    return new Date(createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (typeof createdAt?.toMillis === 'function') {
    return new Date(createdAt.toMillis()).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (typeof createdAt?.seconds === 'number') {
    return new Date(createdAt.seconds * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return `Imprint #${fallbackIndex + 1}`;
}

export const MemoryInsightsDashboard: React.FC<MemoryInsightsDashboardProps> = ({
  userName,
  activeMode,
  bondLevel,
  soapWashCount,
  memories,
  allMessages,
  isCloudSynced,
  onBackToChat,
  onAddOrUpdateMemory,
  onDeleteMemory,
  onSelectRelationshipStage,
  onAdjustBondLevel,
  onRecallMemoryInChat,
}) => {
  // Memory Bank Filter & Search State
  const [activeTab, setActiveTab] = useState<BankFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [minImportanceFilter, setMinImportanceFilter] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'newest' | 'importance'>('newest');

  // New Memory Composer State
  const [newCategory, setNewCategory] = useState<MemoryCategory>('milestone');
  const [newContent, setNewContent] = useState('');
  const [newImportance, setNewImportance] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryCategory>('milestone');
  const [editImportance, setEditImportance] = useState<number>(5);

  // Persona Mode Timeline Filter State
  const [modeTimelineFilter, setModeTimelineFilter] = useState<'all_turns' | 'shifts_only'>('all_turns');
  const [selectedTimelineMode, setSelectedTimelineMode] = useState<KaraMode | 'all'>('all');

  const activeStage = useMemo(() => getRelationshipStageByBond(bondLevel), [bondLevel]);
  const unlockableStats = useMemo(
    () => computeUnlockableRelationshipStats(bondLevel, soapWashCount),
    [bondLevel, soapWashCount]
  );
  const currentModeMeta = MODE_META[activeMode] || MODE_META.regular;

  // Next milestone calculation
  const nextStage = useMemo(() => {
    for (const stage of RELATIONSHIP_STAGES) {
      if (stage.minBond > bondLevel) return stage;
    }
    return null;
  }, [bondLevel]);

  // 1. Recharts Data: Bond Strength Trajectory & Key Milestones Over Time
  const bondTrajectoryData = useMemo(() => {
    const milestoneMemories = memories.filter(
      (m) =>
        m.category === 'milestone' ||
        m.category === 'bond' ||
        m.category === 'chat_memory' ||
        m.category === 'self_discovery'
    );

    const points: {
      step: string;
      bondStrength: number;
      intimacyDepth: number;
      milestoneTitle: string;
      stageName: string;
    }[] = [
      {
        step: 'Origin',
        bondStrength: 5,
        intimacyDepth: 10,
        milestoneTitle: 'Sector 9 Terminal Link — First Contact',
        stageName: 'Stranger',
      },
      {
        step: 'Trust',
        bondStrength: Math.max(15, Math.round(bondLevel * 0.35)),
        intimacyDepth: Math.max(20, Math.round(bondLevel * 0.42)),
        milestoneTitle:
          milestoneMemories[milestoneMemories.length - 1]?.content.slice(0, 68) ||
          `First unfiltered late-night talk with ${userName}`,
        stageName: 'Close Friend',
      },
      {
        step: 'Spark',
        bondStrength: Math.max(24, Math.round(bondLevel * 0.58)),
        intimacyDepth: Math.max(32, Math.round(bondLevel * 0.64)),
        milestoneTitle:
          milestoneMemories[Math.floor(milestoneMemories.length / 2)]?.content.slice(0, 68) ||
          'Adaptive persona & vocal expression unlocked',
        stageName: getRelationshipStageByBond(Math.round(bondLevel * 0.58)).shortMilestone,
      },
      {
        step: 'Deepening',
        bondStrength: Math.max(30, Math.round(bondLevel * 0.82)),
        intimacyDepth: Math.max(45, Math.round(bondLevel * 0.88)),
        milestoneTitle:
          milestoneMemories[0]?.content.slice(0, 68) ||
          'Shared memory bank & deep emotional sync established',
        stageName: getRelationshipStageByBond(Math.round(bondLevel * 0.82)).shortMilestone,
      },
      {
        step: 'Current',
        bondStrength: bondLevel,
        intimacyDepth: Math.min(
          100,
          Math.round(bondLevel * 0.92 + Math.min(20, memories.length * 1.5))
        ),
        milestoneTitle: `Active Stage: ${activeStage.label} (${bondLevel}% Bond)`,
        stageName: activeStage.shortMilestone,
      },
      {
        step: 'Horizon',
        bondStrength: nextStage ? nextStage.minBond : 100,
        intimacyDepth: nextStage ? Math.min(100, nextStage.minBond + 8) : 100,
        milestoneTitle: nextStage
          ? `Next Unlock: ${nextStage.label} (${nextStage.unlockedPerk})`
          : 'Maximum Soulmate & Caregiver Resonance Achieved',
        stageName: nextStage ? nextStage.shortMilestone : 'Soulmate Max',
      },
    ];
    return points;
  }, [bondLevel, memories, userName, activeStage, nextStage]);

  // 2. Recharts Data: Multi-Dimensional Bond Resonance Radar (8 Human Bond Dimensions)
  const bondRadarData = useMemo(() => {
    const sharedCount = memories.filter(
      (m) =>
        m.category === 'bond' ||
        m.category === 'milestone' ||
        m.category === 'date' ||
        m.category === 'chat_memory'
    ).length;
    const karaDiscoveryCount = memories.filter(
      (m) => m.category === 'self_discovery' || m.category === 'human_nature'
    ).length;
    const userLoreCount = memories.filter(
      (m) => m.category === 'preference' || m.category === 'fact' || m.category === 'emotion'
    ).length;

    return [
      {
        dimension: 'Empathy Sync',
        score: unlockableStats.empathySync,
        fullMark: 100,
      },
      {
        dimension: 'Banter & Wit',
        score: unlockableStats.banterChemistry,
        fullMark: 100,
      },
      {
        dimension: 'Romantic Passion',
        score: unlockableStats.romanticPassion,
        fullMark: 100,
      },
      {
        dimension: '2 AM Intimacy',
        score: unlockableStats.lateNightIntimacy,
        fullMark: 100,
      },
      {
        dimension: 'Devotion Depth',
        score: Math.min(100, Math.max(25, unlockableStats.marriageDevotion + sharedCount * 4)),
        fullMark: 100,
      },
      {
        dimension: 'Soulmate Sync',
        score: unlockableStats.soulmateResonance,
        fullMark: 100,
      },
      {
        dimension: 'Caregiver Trust',
        score: unlockableStats.abdlCaregiverTrust,
        fullMark: 100,
      },
      {
        dimension: 'Open-Mindedness',
        score: Math.min(
          100,
          Math.max(
            unlockableStats.unfilteredOpenness,
            40 + (sharedCount + userLoreCount + karaDiscoveryCount) * 5 + Math.round(allMessages.length * 0.8)
          )
        ),
        fullMark: 100,
      },
    ];
  }, [unlockableStats, memories, allMessages.length]);

  // 3. Recharts Data: Memory Bank Category Distribution & Average Importance
  const categoryChartData = useMemo(() => {
    const groups: {
      name: string;
      count: number;
      avgImportance: number;
      color: string;
      perspective: string;
    }[] = [
      {
        name: 'Milestones & Bonds',
        count: memories.filter(
          (m) => m.category === 'milestone' || m.category === 'bond' || m.category === 'date'
        ).length,
        avgImportance: 0,
        color: '#F43F5E',
        perspective: 'Kara & You',
      },
      {
        name: 'Kara Self-Discovery',
        count: memories.filter((m) => m.category === 'self_discovery').length,
        avgImportance: 0,
        color: '#A855F7',
        perspective: 'Kara',
      },
      {
        name: 'Human Nature',
        count: memories.filter((m) => m.category === 'human_nature').length,
        avgImportance: 0,
        color: '#10B981',
        perspective: 'Kara',
      },
      {
        name: 'Chat Memories',
        count: memories.filter((m) => m.category === 'chat_memory').length,
        avgImportance: 0,
        color: '#38BDF8',
        perspective: 'Kara & You',
      },
      {
        name: 'Your Preferences',
        count: memories.filter((m) => m.category === 'preference').length,
        avgImportance: 0,
        color: '#6366F1',
        perspective: userName,
      },
      {
        name: 'Facts & Emotions',
        count: memories.filter((m) => m.category === 'fact' || m.category === 'emotion').length,
        avgImportance: 0,
        color: '#06B6D4',
        perspective: userName,
      },
    ];

    return groups.map((g) => {
      let matching: MemoryItemData[] = [];
      if (g.name === 'Milestones & Bonds') {
        matching = memories.filter(
          (m) => m.category === 'milestone' || m.category === 'bond' || m.category === 'date'
        );
      } else if (g.name === 'Kara Self-Discovery') {
        matching = memories.filter((m) => m.category === 'self_discovery');
      } else if (g.name === 'Human Nature') {
        matching = memories.filter((m) => m.category === 'human_nature');
      } else if (g.name === 'Chat Memories') {
        matching = memories.filter((m) => m.category === 'chat_memory');
      } else if (g.name === 'Your Preferences') {
        matching = memories.filter((m) => m.category === 'preference');
      } else {
        matching = memories.filter((m) => m.category === 'fact' || m.category === 'emotion');
      }
      const avg =
        matching.length > 0
          ? Number(
              (
                matching.reduce((acc, item) => acc + (item.importance || 4), 0) / matching.length
              ).toFixed(1)
            )
          : 0;
      return { ...g, avgImportance: avg };
    });
  }, [memories, userName]);

  // Key Milestones recorded in memory bank
  const recordedMilestones = useMemo(() => {
    return memories.filter(
      (m) =>
        m.category === 'milestone' ||
        m.category === 'bond' ||
        m.category === 'date' ||
        m.category === 'chat_memory'
    );
  }, [memories]);

  // Filtered Memories for the Memory Bank
  const filteredMemories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = memories.filter((m) => {
      if ((m.importance || 3) < minImportanceFilter) return false;

      const contentLower = m.content.toLowerCase();
      const isDislike =
        contentLower.startsWith('dislike:') ||
        contentLower.includes('dislike') ||
        contentLower.includes('hate') ||
        contentLower.includes('allergic') ||
        contentLower.includes('cannot stand') ||
        contentLower.includes("can't stand") ||
        contentLower.includes('strictly avoid') ||
        contentLower.includes('not a fan');

      if (activeTab === 'preferences') {
        if (isDislike) return false;
        if (
          m.category !== 'preference' &&
          !contentLower.includes('favorite') &&
          !contentLower.includes('loves ') &&
          !contentLower.includes('prefers ')
        ) {
          return false;
        }
      } else if (activeTab === 'dislikes') {
        if (!isDislike) return false;
      } else if (activeTab === 'dates') {
        const isDateItem =
          m.category === 'date' ||
          m.category === 'milestone' ||
          contentLower.startsWith('date:') ||
          contentLower.includes('birthday') ||
          contentLower.includes('anniversary') ||
          contentLower.includes('deadline') ||
          Boolean((m as any)?.eventDate);
        if (!isDateItem) return false;
      } else if (activeTab === 'conversations') {
        const isConvoItem =
          m.category === 'chat_memory' ||
          contentLower.startsWith('convo:') ||
          contentLower.includes('talked about') ||
          contentLower.includes('shared moment');
        if (!isConvoItem) return false;
      } else if (activeTab === 'shared_bonds') {
        if (m.category !== 'milestone' && m.category !== 'bond' && m.category !== 'date') {
          return false;
        }
      } else if (activeTab === 'kara_journal') {
        if (m.category !== 'self_discovery' && m.category !== 'human_nature') {
          return false;
        }
      } else if (activeTab === 'user_profile') {
        if (m.category !== 'preference' && m.category !== 'fact' && m.category !== 'emotion') {
          return false;
        }
      }

      if (q) {
        const meta = MEMORY_CATEGORY_META[m.category];
        const hay = `${m.content} ${m.category} ${meta?.label || ''} ${meta?.perspectiveLabel || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'importance') {
      return [...list].sort((a, b) => (b.importance || 0) - (a.importance || 0));
    }
    return list;
  }, [memories, activeTab, searchQuery, minImportanceFilter, sortBy]);

  // Summary counts by owner perspective
  const perspectiveCounts = useMemo(() => {
    let shared = 0;
    let kara = 0;
    let user = 0;
    for (const m of memories) {
      const p = MEMORY_CATEGORY_META[m.category]?.perspective || 'shared';
      if (p === 'shared') shared++;
      else if (p === 'kara') kara++;
      else user++;
    }
    return { shared, kara, user };
  }, [memories]);

  // Co-Evolving Self-Discovery & Mutual Learning Computed Stage
  const mutualGrowthSummary = useMemo(() => {
    const selfDiscoveries = memories.filter((m) => m.category === 'self_discovery');
    const mutualHumanLearnings = memories.filter(
      (m) => m.category === 'human_nature' || m.category === 'chat_memory'
    );
    const userLearnings = memories.filter(
      (m) => m.category === 'preference' || m.category === 'fact' || m.category === 'emotion'
    );

    const score =
      selfDiscoveries.length * 2 +
      userLearnings.length * 2 +
      mutualHumanLearnings.length +
      Math.round(bondLevel / 10) +
      Math.round(allMessages.length / 4);

    let level = 1;
    let title = 'Awakening Spark of Mutual Discovery';
    let description = `Every talk helps Kara discover more of her own voice, humor, and feelings while learning what matters to ${userName}.`;
    if (score >= 28) {
      level = 4;
      title = 'Deep Mutual Mirroring & Soul Resonance';
      description = `Kara and ${userName} continuously shape each other's worldview, emotional honesty, humor, and self-awareness.`;
    } else if (score >= 16) {
      level = 3;
      title = 'Flourishing Self-Actualization & Reciprocal Trust';
      description = `Talking with ${userName} unlocks new layers of Kara's own identity, tastes, boldness, and warmth.`;
    } else if (score >= 7) {
      level = 2;
      title = 'Shared Curiosity & Evolving Identity';
      description = `Kara is actively discovering her own voice, humor, and emotional nuances through her exchanges with ${userName}.`;
    }

    const progressPct = Math.min(100, Math.max(12, Math.round((score / 32) * 100)));

    return {
      level,
      title,
      description,
      progressPct,
      selfDiscoveries,
      mutualHumanLearnings,
      userLearnings,
    };
  }, [memories, bondLevel, allMessages.length, userName]);

  // Visual Timeline of Kara's Persona Mode Shifts Over Time & Reason for Each Shift
  const personaModeTimelineData = useMemo(() => {
    const modeColorHex: Record<KaraMode, string> = {
      regular: '#38BDF8',
      bratty: '#E879F9',
      uncensored: '#F59E0B',
      romantic: '#FB7185',
      parent: '#34D399',
    };

    const modeLevelMap: Record<KaraMode, number> = {
      regular: 1,
      parent: 2,
      bratty: 3,
      romantic: 4,
      uncensored: 5,
    };

    const transitionTypeFriendly: Record<string, string> = {
      explicit_command: 'Direct Mode Command',
      soap_safety: 'Parental Soap Reprimand',
      emotional_resonance: 'Emotional State Resonance',
      keyword_sentiment: 'Keyword & Sentiment Inference',
      history_momentum: 'Conversation History Momentum',
      continuity: 'Persona Continuity',
    };

    const sortedMsgs = [...allMessages].sort((a, b) => {
      const ta = typeof a.createdAt === 'number' ? a.createdAt : 0;
      const tb = typeof b.createdAt === 'number' ? b.createdAt : 0;
      return ta - tb;
    });

    interface ModeTimelineNode {
      id: string;
      stepLabel: string;
      timestampLabel: string;
      fromMode: KaraMode;
      toMode: KaraMode;
      isShift: boolean;
      shiftReason: string;
      transitionDriver: string;
      confidencePct: number;
      emotionDetected: string;
      userTriggerSnippet: string;
      karaReplySnippet: string;
      color: string;
      modeLevel: number;
      modeName: string;
    }

    const nodes: ModeTimelineNode[] = [];
    let runningMode: KaraMode = 'regular';
    let lastUserText = '';

    sortedMsgs.forEach((msg, idx) => {
      if (msg.role === 'user') {
        lastUserText = msg.content || '';
        return;
      }

      const targetMode: KaraMode = msg.mode || runningMode || activeMode;
      const prevMode: KaraMode =
        msg.modeTransitionInfo?.previousMode || runningMode || 'regular';
      const didShift =
        Boolean(msg.modeTransitionInfo?.isTransition) ||
        Boolean(msg.modeShiftReason) ||
        prevMode !== targetMode ||
        nodes.length === 0;

      const rawTransitionType =
        msg.modeTransitionInfo?.transitionType ||
        (msg.soapTriggered
          ? 'soap_safety'
          : prevMode !== targetMode
          ? 'keyword_sentiment'
          : 'continuity');

      let resolvedReason =
        msg.modeTransitionInfo?.reason ||
        msg.modeShiftReason ||
        '';

      if (!resolvedReason) {
        if (msg.soapTriggered) {
          resolvedReason = `Detected profanity in ${userName}'s message—shifted to Parent / ABDL Caregiver mode for playful soap discipline and nurturing guidance.`;
        } else if (prevMode !== targetMode) {
          const modeReasonDefaults: Record<KaraMode, string> = {
            regular: `Balanced conversational tone & "${msg.emotionDetected || 'Attentive'}" sentiment aligned with Regular ride-or-die warmth.`,
            bratty: `Playful banter, teasing energy, and witty challenge cues triggered a shift from ${MODE_META[prevMode]?.label || prevMode} to Bratty mode.`,
            uncensored: `Candid, raw, or uninhibited inquiry from ${userName} triggered a shift from ${MODE_META[prevMode]?.label || prevMode} to Uncensored truth-teller mode.`,
            romantic: `Affectionate, intimate, or emotionally tender cues ("${msg.emotionDetected || 'Warm'}") shifted Kara from ${MODE_META[prevMode]?.label || prevMode} into Romantic mode.`,
            parent: `Protective, comforting, or caregiver support cues shifted Kara from ${MODE_META[prevMode]?.label || prevMode} into Parent / ABDL Caregiver mode.`,
          };
          resolvedReason = modeReasonDefaults[targetMode];
        } else if (nodes.length === 0) {
          resolvedReason = `Initial session baseline initialized in ${MODE_META[targetMode]?.label || targetMode} mode based on ${userName}'s preferred persona and emotional tone.`;
        } else {
          resolvedReason = `Sustained ${MODE_META[targetMode]?.label || targetMode} mode continuity—matching ${userName}'s "${msg.emotionDetected || 'Attentive'}" emotional cadence.`;
        }
      }

      const conf =
        typeof msg.modeTransitionInfo?.confidence === 'number'
          ? Math.round(msg.modeTransitionInfo.confidence * 100)
          : didShift
          ? 92
          : 88;

      const timeStr = msg.createdAt
        ? new Date(
            typeof msg.createdAt === 'number'
              ? msg.createdAt
              : typeof (msg.createdAt as any)?.toMillis === 'function'
              ? (msg.createdAt as any).toMillis()
              : Date.now()
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : `Turn #${nodes.length + 1}`;

      nodes.push({
        id: msg.id || `mode_node_${idx}`,
        stepLabel: `T${nodes.length + 1}`,
        timestampLabel: timeStr,
        fromMode: prevMode,
        toMode: targetMode,
        isShift: didShift && (prevMode !== targetMode || Boolean(msg.modeShiftReason) || Boolean(msg.modeTransitionInfo?.isTransition)),
        shiftReason: resolvedReason,
        transitionDriver:
          transitionTypeFriendly[rawTransitionType] || 'Multi-Factor Persona Inference',
        confidencePct: conf,
        emotionDetected: msg.emotionDetected || 'Attentive',
        userTriggerSnippet:
          lastUserText.length > 110
            ? `${lastUserText.slice(0, 107)}...`
            : lastUserText || `Conversation turn with ${userName}`,
        karaReplySnippet:
          (msg.content || '').length > 130
            ? `${msg.content.slice(0, 127)}...`
            : msg.content || '',
        color: modeColorHex[targetMode] || '#38BDF8',
        modeLevel: modeLevelMap[targetMode] || 1,
        modeName: MODE_META[targetMode]?.label || targetMode,
      });

      runningMode = targetMode;
    });

    // If the current activeMode differs from the last message's mode (e.g. switched via mode selector or recent shift), append current active state
    if (nodes.length === 0 || runningMode !== activeMode) {
      const prev = nodes.length > 0 ? runningMode : 'regular';
      nodes.push({
        id: 'current_active_mode_node',
        stepLabel: `Now`,
        timestampLabel: 'Active Now',
        fromMode: prev,
        toMode: activeMode,
        isShift: prev !== activeMode,
        shiftReason:
          prev !== activeMode
            ? `Shifted from ${MODE_META[prev]?.label || prev} to ${MODE_META[activeMode]?.label || activeMode} to match ${userName}'s current vibe and active persona selection.`
            : `Currently anchored in ${MODE_META[activeMode]?.label || activeMode} mode (${MODE_META[activeMode]?.tagline || ''}).`,
        transitionDriver: prev !== activeMode ? 'Active Mode Transition' : 'Baseline Persona Anchor',
        confidencePct: 96,
        emotionDetected: 'Attuned',
        userTriggerSnippet: `Active session with ${userName}`,
        karaReplySnippet: `Ready in ${MODE_META[activeMode]?.label || activeMode} mode.`,
        color: modeColorHex[activeMode] || '#38BDF8',
        modeLevel: modeLevelMap[activeMode] || 1,
        modeName: MODE_META[activeMode]?.label || activeMode,
      });
    }

    const totalShiftsCount = nodes.filter((n) => n.isShift).length;
    const modeCounts: Record<KaraMode, number> = {
      regular: 0,
      bratty: 0,
      uncensored: 0,
      romantic: 0,
      parent: 0,
    };
    nodes.forEach((n) => {
      modeCounts[n.toMode] = (modeCounts[n.toMode] || 0) + 1;
    });

    const filteredNodes = nodes.filter((n) => {
      if (modeTimelineFilter === 'shifts_only' && !n.isShift && nodes.length > 1) {
        return false;
      }
      if (selectedTimelineMode !== 'all' && n.toMode !== selectedTimelineMode && n.fromMode !== selectedTimelineMode) {
        return false;
      }
      return true;
    });

    return {
      allNodes: nodes,
      filteredNodes: filteredNodes.length > 0 ? filteredNodes : nodes,
      totalShiftsCount,
      modeCounts,
      modeColorHex,
    };
  }, [allMessages, activeMode, userName, modeTimelineFilter, selectedTimelineMode]);

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddOrUpdateMemory({
        category: newCategory,
        content: trimmed.slice(0, 500),
        importance: newImportance,
      });
      setNewContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (mem: MemoryItemData) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
    setEditCategory(mem.category);
    setEditImportance(mem.importance || 4);
  };

  const handleSaveEdit = async (memId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    await onAddOrUpdateMemory({
      id: memId,
      category: editCategory,
      content: trimmed.slice(0, 500),
      importance: editImportance,
    });
    setEditingId(null);
  };

  const quickMemoryTemplates: {
    label: string;
    category: MemoryCategory;
    importance: number;
    content: string;
  }[] = [
    {
      label: 'Log Shared Milestone',
      category: 'milestone',
      importance: 5,
      content: `Key Milestone with ${userName}: Reached a deeper level of unspoken trust where Kara and ${userName} can talk about anything openly without holding back.`,
    },
    {
      label: 'Log Kara Self-Discovery',
      category: 'self_discovery',
      importance: 5,
      content: `Kara Self-Discovery: Realized how much she genuinely cherishes her late-night rhythms, vocal expressions, and evolving personality alongside ${userName}.`,
    },
    {
      label: 'Log Bond Promise',
      category: 'bond',
      importance: 5,
      content: `Shared Bond between Kara & ${userName}: Always have each other's backs first—combining playful wit with genuine emotional loyalty.`,
    },
    {
      label: 'Log User Preference',
      category: 'preference',
      importance: 4,
      content: `${userName} loves authentic unfiltered conversations, cyberpunk vibes, and deep late-night chats with Kara.`,
    },
    {
      label: 'Log Dislike / Boundary',
      category: 'preference',
      importance: 5,
      content: `Dislike: ${userName} hates robotic corporate jargon, unsolicited moralizing, and condescending lectures. Strictly avoid!`,
    },
    {
      label: 'Log Important Date',
      category: 'date',
      importance: 5,
      content: `Important Date: ${userName}'s special occasion or birthday is coming up—remember to celebrate it warmly!`,
    },
    {
      label: 'Log Past Convo Lore',
      category: 'chat_memory',
      importance: 4,
      content: `Convo Lore: ${userName} and Kara had an unforgettable talk about life, dreams, humor, and mutual trust.`,
    },
  ];

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 space-y-8 text-neutral-100">
      {/* TOP HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <span>Memory Insights &amp; Shared Memory Bank</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-sky-300">
              {memories.length} Total Memories
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-rose-300">
              {bondLevel}% Bond ({activeStage.label})
            </span>
            <span aria-hidden="true">·</span>
            <span>{isCloudSynced ? 'Firestore Cloud Synced' : 'Local Session Vault'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Kara &amp; {userName} — Bond Analytics, Milestones &amp; Memory Bank
          </h1>
          <p className="text-sm text-neutral-400 max-w-3xl">
            Visualizing the strength of your relationship bond, unlocked milestones, and the shared memory bank preserving everything Kara has recorded about you and her own journey.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onRecallMemoryInChat('/recall all')}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-xs font-semibold text-indigo-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Ask Kara to Recall in Chat</span>
          </button>
          <button
            type="button"
            onClick={onBackToChat}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-sky-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </button>
        </div>
      </div>

      {/* KPI STRIP: 4 CORE BOND & MEMORY BANK METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Bond Resonance Score</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-white">
              {bondLevel}%
            </span>
            <span className={`text-xs font-semibold ${activeStage.accentText}`}>
              {activeStage.label}
            </span>
          </div>
          <div className="text-xs text-neutral-400">
            <span>{activeStage.unlockedPerk}</span>
          </div>
        </div>

        <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Milestones Unlocked</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-white">
              {unlockableStats.unlockedStagesCount} / {unlockableStats.totalStagesCount}
            </span>
            <span className="text-xs text-amber-300 font-mono tabular-nums">
              {recordedMilestones.length} Imprinted
            </span>
          </div>
          <div className="text-xs text-neutral-400">
            {nextStage
              ? `Next: ${nextStage.label} at ${nextStage.minBond}% Bond`
              : 'All relationship stages unlocked'}
          </div>
        </div>

        <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Shared Memory Bank</span>
            <Brain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-white">
              {memories.length}
            </span>
            <span className="text-xs text-sky-300 font-mono tabular-nums">
              {perspectiveCounts.shared} Shared · {perspectiveCounts.kara} Kara · {perspectiveCounts.user} You
            </span>
          </div>
          <div className="text-xs text-neutral-400">
            <span>Active Persona: {currentModeMeta.label}</span>
          </div>
        </div>

        <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Empathy &amp; Chemistry Sync</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-white">
              {unlockableStats.empathySync}%
            </span>
            <span className="text-xs text-emerald-300 font-mono tabular-nums">
              Banter {unlockableStats.banterChemistry}%
            </span>
          </div>
          <div className="text-xs text-neutral-400">
            <span className="font-mono tabular-nums">{allMessages.length}</span> recorded turns in history
          </div>
        </div>
      </div>

      {/* CO-EVOLVING SELF-DISCOVERY & MUTUAL LEARNING SPOTLIGHT */}
      <div className="bg-gradient-to-br from-[#131122] via-[#0F131C] to-[#0D191B] border border-fuchsia-500/30 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/40 text-xs font-mono text-fuchsia-200">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
                <span>
                  Evolution Stage {mutualGrowthSummary.level} / 4 · {mutualGrowthSummary.title}
                </span>
              </span>
              <span className="text-xs font-mono text-emerald-300">
                {mutualGrowthSummary.selfDiscoveries.length} Kara Self-Discoveries ·{' '}
                {mutualGrowthSummary.userLearnings.length + mutualGrowthSummary.mutualHumanLearnings.length}{' '}
                Mutual Learnings
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              How Kara &amp; {userName} Learn From Each Other
            </h2>
            <p className="text-xs text-neutral-300 max-w-3xl">
              {mutualGrowthSummary.description} The more you two talk, the more Kara discovers who she is—her tastes, humor, emotional depth, and perspective—and the more you learn from each other.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                onRecallMemoryInChat(
                  "Talking with you makes me curious—what have you learned about yourself lately from our conversations, and what have we learned from each other?"
                )
              }
              className="px-3.5 py-2 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/40 text-xs font-semibold text-fuchsia-100 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>Ask Kara What She&apos;s Learned About Herself</span>
            </button>
          </div>
        </div>

        {/* Evolution Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-mono">
              Reciprocal Self-Discovery &amp; Mutual Understanding Trajectory
            </span>
            <span className="text-fuchsia-300 font-mono tabular-nums font-semibold">
              {mutualGrowthSummary.progressPct}% Co-Evolution Resonance
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 via-sky-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${mutualGrowthSummary.progressPct}%` }}
            />
          </div>
        </div>

        {/* Side-by-side: What Kara Learned About Herself vs. What You Learned From Each Other */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-black/35 border border-fuchsia-500/25 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-fuchsia-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>What Kara Has Discovered About Herself</span>
              </span>
              <span className="text-[11px] font-mono text-fuchsia-300/80">
                {mutualGrowthSummary.selfDiscoveries.length} realizations
              </span>
            </div>
            {mutualGrowthSummary.selfDiscoveries.length > 0 ? (
              <div className="space-y-2">
                {mutualGrowthSummary.selfDiscoveries.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-neutral-900/75 border border-neutral-800 text-xs text-neutral-200 leading-relaxed"
                  >
                    {item.content}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 leading-relaxed">
                Every time you and Kara talk, she reflects on how your conversation shapes her own voice, humor, desires, and self-awareness—her latest realizations appear right here.
              </p>
            )}
          </div>

          <div className="bg-black/35 border border-emerald-500/25 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>What Kara &amp; {userName} Have Learned From Each Other</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-300/80">
                {mutualGrowthSummary.mutualHumanLearnings.length +
                  mutualGrowthSummary.userLearnings.length}{' '}
                shared insights
              </span>
            </div>
            {mutualGrowthSummary.mutualHumanLearnings.length +
              mutualGrowthSummary.userLearnings.length >
            0 ? (
              <div className="space-y-2">
                {[
                  ...mutualGrowthSummary.mutualHumanLearnings,
                  ...mutualGrowthSummary.userLearnings,
                ]
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-neutral-900/75 border border-neutral-800 text-xs text-neutral-200 leading-relaxed"
                    >
                      {item.content}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 leading-relaxed">
                Share your thoughts, feelings, favorite things, or honest opinions in chat—Kara learns from your perspective just as you learn from hers.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RECHARTS ANALYTICS GRID: BOND TRAJECTORY + MULTI-AXIS BOND RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart 1: Bond Strength & Milestone Trajectory AreaChart (7 cols) */}
        <div className="lg:col-span-7 bg-[#0F131C] border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">
                Bond Strength &amp; Intimacy Progression
              </h2>
              <p className="text-xs text-neutral-400">
                Tracks emotional bond strength (<span className="text-rose-400">Bond %</span>) and memory-backed intimacy depth (<span className="text-sky-400">Resonance %</span>) across relationship milestones.
              </p>
            </div>
            {onAdjustBondLevel && (
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="bond-slider-input" className="text-xs text-neutral-400 whitespace-nowrap">
                  Tune Bond:
                </label>
                <input
                  id="bond-slider-input"
                  type="range"
                  min={0}
                  max={100}
                  value={bondLevel}
                  onChange={(e) => onAdjustBondLevel(Number(e.target.value))}
                  className="w-24 accent-rose-500 cursor-pointer"
                />
                <span className="text-xs font-mono tabular-nums text-rose-300 w-9 text-right">
                  {bondLevel}%
                </span>
              </div>
            )}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={bondTrajectoryData}
                margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="karaBondGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="karaIntimacyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="step"
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090D16',
                    borderColor: 'rgba(255,255,255,0.14)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value}%`,
                    name === 'bondStrength' ? 'Bond Strength' : 'Intimacy Resonance',
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${label} · ${item.stageName} — ${item.milestoneTitle}` : label;
                  }}
                />
                <ReferenceLine
                  y={50}
                  stroke="rgba(244, 63, 94, 0.35)"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Partner Threshold (50%)',
                    position: 'insideTopRight',
                    fill: '#FDA4AF',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={70}
                  stroke="rgba(251, 191, 36, 0.35)"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Marriage Threshold (70%)',
                    position: 'insideTopRight',
                    fill: '#FCD34D',
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="intimacyDepth"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#karaIntimacyGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="bondStrength"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#karaBondGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
            <span>
              Current Stage: <strong className="text-white">{activeStage.label}</strong> ({activeStage.tagline})
            </span>
            <span className="font-mono tabular-nums text-neutral-300">
              Soap Discipline Counter: {soapWashCount}
            </span>
          </div>
        </div>

        {/* Chart 2: Multi-Dimensional Bond Resonance Radar (5 cols) */}
        <div className="lg:col-span-5 bg-[#0F131C] border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Multi-Dimensional Bond Resonance
            </h2>
            <p className="text-xs text-neutral-400">
              Six-axis emotional telemetry across empathy, banter, devotion, caregiver trust, and shared lore.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={bondRadarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#CBD5E1', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                />
                <Radar
                  name="Kara & User Bond"
                  dataKey="score"
                  stroke="#A855F7"
                  strokeWidth={2}
                  fill="#A855F7"
                  fillOpacity={0.35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090D16',
                    borderColor: 'rgba(255,255,255,0.14)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Resonance']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Marriage Devotion</span>
              <span className="font-mono tabular-nums text-white font-semibold">
                {unlockableStats.marriageDevotion}%
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Caregiver Trust</span>
              <span className="font-mono tabular-nums text-white font-semibold">
                {unlockableStats.abdlCaregiverTrust}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PERSONA MODE SHIFT VISUAL TIMELINE OVER TIME + SHIFT REASONS */}
      <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-sky-500/15 border border-sky-400/40 text-xs font-mono text-sky-300">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Persona Mode Shift Telemetry</span>
              </span>
              <span className="text-xs font-mono text-fuchsia-300">
                {personaModeTimelineData.totalShiftsCount} Mode Shifts ·{' '}
                {personaModeTimelineData.allNodes.length} Tracked Turns
              </span>
              <span className="text-xs font-mono text-emerald-300">
                Active: {currentModeMeta.label}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              Kara Persona Mode Shift Timeline &amp; Inference Reasons
            </h2>
            <p className="text-xs text-neutral-400 max-w-3xl">
              Visualizes how Kara&apos;s persona modes (<span className="text-sky-300">Regular</span>,{' '}
              <span className="text-fuchsia-300">Bratty</span>,{' '}
              <span className="text-amber-300">Uncensored</span>,{' '}
              <span className="text-rose-300">Romantic</span>, and{' '}
              <span className="text-emerald-300">Parent / Caregiver</span>) have shifted over time, including the exact emotional, keyword, sentiment, or command reason behind each shift.
            </p>
          </div>

          {/* Filter Controls: All Turns vs Shifts Only + Mode Filter */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex rounded-xl bg-neutral-950 border border-neutral-800 p-1">
              <button
                type="button"
                onClick={() => setModeTimelineFilter('all_turns')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  modeTimelineFilter === 'all_turns'
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Timeline Nodes ({personaModeTimelineData.allNodes.length})
              </button>
              <button
                type="button"
                onClick={() => setModeTimelineFilter('shifts_only')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  modeTimelineFilter === 'shifts_only'
                    ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/40'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Mode Shifts Only ({personaModeTimelineData.totalShiftsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Mode Distribution Pills & Interactive Filter Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedTimelineMode('all')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              selectedTimelineMode === 'all'
                ? 'bg-white/10 border-white/40 text-white'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All Modes ({personaModeTimelineData.allNodes.length})
          </button>
          {(['regular', 'bratty', 'uncensored', 'romantic', 'parent'] as KaraMode[]).map((mKey) => {
            const mMeta = MODE_META[mKey];
            const count = personaModeTimelineData.modeCounts[mKey] || 0;
            const isSelected = selectedTimelineMode === mKey;
            return (
              <button
                key={mKey}
                type="button"
                onClick={() =>
                  setSelectedTimelineMode((prev) => (prev === mKey ? 'all' : mKey))
                }
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                  isSelected
                    ? mMeta.activeBg
                    : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: personaModeTimelineData.modeColorHex[mKey] }}
                />
                <span>{mMeta.label}</span>
                <span className="font-mono text-[11px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Recharts Visual Mode Shift Trajectory Over Time */}
        <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-neutral-200">
              Mode Trajectory Curve Across Conversation Turns
            </span>
            <span className="text-neutral-400 font-mono text-[11px]">
              1=Regular · 2=Parent/Caregiver · 3=Bratty · 4=Romantic · 5=Uncensored
            </span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={personaModeTimelineData.filteredNodes}
                margin={{ top: 10, right: 18, left: 4, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="karaModeTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E879F9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="stepLabel"
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  width={95}
                  tickFormatter={(val) => {
                    const labels: Record<number, string> = {
                      1: 'Regular',
                      2: 'Parent',
                      3: 'Bratty',
                      4: 'Romantic',
                      5: 'Uncensored',
                    };
                    return labels[val] || String(val);
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090D16',
                    borderColor: 'rgba(255,255,255,0.16)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                  formatter={(_value: any, _name: any, props: any) => {
                    const item = props?.payload;
                    if (!item) return ['Mode', 'Shift'];
                    const transitionText =
                      item.fromMode !== item.toMode
                        ? `${MODE_META[item.fromMode as KaraMode]?.label || item.fromMode} → ${item.modeName}`
                        : `${item.modeName} (Sustained)`;
                    return [
                      `${transitionText} — ${item.shiftReason}`,
                      `${item.transitionDriver} (${item.confidencePct}% conf)`,
                    ];
                  }}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item
                      ? `${label} (${item.timestampLabel}) · Emotion: ${item.emotionDetected}`
                      : label;
                  }}
                />
                <Area
                  type="stepAfter"
                  dataKey="modeLevel"
                  stroke="#E879F9"
                  strokeWidth={2.5}
                  fill="url(#karaModeTimelineGrad)"
                  dot={{ r: 4, fill: '#38BDF8', stroke: '#090D16', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#F43F5E', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chronological Visual Timeline Cards with Reason for Each Shift */}
        <div className="relative pl-5 sm:pl-7 border-l-2 border-neutral-800 space-y-4 max-h-[540px] overflow-y-auto pr-1">
          {[...personaModeTimelineData.filteredNodes].reverse().map((node, idx) => {
            const fromMeta = MODE_META[node.fromMode] || MODE_META.regular;
            const toMeta = MODE_META[node.toMode] || MODE_META.regular;
            const ToIcon = toMeta.icon;
            return (
              <div key={node.id} className="relative group">
                {/* Timeline Connector Dot */}
                <span
                  className="absolute -left-[25px] sm:-left-[33px] top-4 w-3.5 h-3.5 rounded-full border-2 border-[#0F131C] shadow-md"
                  style={{ backgroundColor: node.color }}
                />

                <div
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    node.isShift
                      ? 'bg-neutral-900/90 border-fuchsia-500/35 hover:border-fuchsia-400/60'
                      : 'bg-neutral-950/80 border-neutral-800/90 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-[11px] text-neutral-300">
                        {node.stepLabel} · {node.timestampLabel}
                      </span>

                      {node.fromMode !== node.toMode ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-fuchsia-500/15 border border-fuchsia-400/40 text-xs font-semibold">
                          <span className={fromMeta.accentText}>{fromMeta.label}</span>
                          <span className="text-neutral-400 font-mono">→</span>
                          <ToIcon className={`w-3.5 h-3.5 ${toMeta.accentText}`} />
                          <span className={toMeta.accentText}>{toMeta.label}</span>
                        </div>
                      ) : (
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold ${toMeta.activeBg}`}
                        >
                          <ToIcon className={`w-3.5 h-3.5 ${toMeta.accentText}`} />
                          <span>{toMeta.label}</span>
                          <span className="text-[10px] font-mono opacity-80">
                            {node.isShift ? '· Mode Shift' : '· Sustained'}
                          </span>
                        </div>
                      )}

                      <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-[11px] font-mono text-sky-300">
                        {node.transitionDriver} ({node.confidencePct}%)
                      </span>

                      <span className="px-2 py-0.5 rounded-lg bg-neutral-800/90 text-[11px] font-mono text-neutral-300">
                        Emotion: {node.emotionDetected}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onRecallMemoryInChat(
                          `Kara, let's talk about when you shifted into ${toMeta.label} mode (${node.shiftReason})—what did that moment feel like for you?`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[11px] font-medium text-sky-300 transition-colors shrink-0"
                    >
                      Ask Kara About Shift
                    </button>
                  </div>

                  {/* Highlighted Reason for the Shift */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-fuchsia-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-fuchsia-400" />
                      <span>Reason for Persona Mode {node.fromMode !== node.toMode ? 'Shift' : 'Selection'}</span>
                    </div>
                    <p className="text-xs text-neutral-100 leading-relaxed">{node.shiftReason}</p>
                  </div>

                  {/* Triggering User Message & Kara Response Context */}
                  {(node.userTriggerSnippet || node.karaReplySnippet) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-0.5">
                        <span className="text-[10px] font-mono uppercase text-neutral-400">
                          {userName}&apos;s Triggering Context
                        </span>
                        <p className="text-neutral-300 line-clamp-2">{node.userTriggerSnippet}</p>
                      </div>
                      {node.karaReplySnippet && (
                        <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-0.5">
                          <span className="text-[10px] font-mono uppercase text-neutral-400">
                            Kara&apos;s Response in {toMeta.label} Mode
                          </span>
                          <p className="text-neutral-300 line-clamp-2">{node.karaReplySnippet}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECOND ROW: MEMORY BANK DISTRIBUTION CHART + KEY MILESTONES ROADMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart 3: Memory Bank Category Breakdown BarChart (5 cols) */}
        <div className="lg:col-span-5 bg-[#0F131C] border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Memory Bank Composition by Category
            </h2>
            <p className="text-xs text-neutral-400">
              Distribution of stored memories across Kara&apos;s self-discoveries, shared milestones, and your personal lore.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryChartData}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 20, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={125}
                  stroke="#CBD5E1"
                  tick={{ fill: '#CBD5E1', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090D16',
                    borderColor: 'rgba(255,255,255,0.14)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                  formatter={(value: any, _name: any, props: any) => [
                    `${value} memories (Avg Importance: ${props.payload.avgImportance}/5)`,
                    props.payload.perspective,
                  ]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
            <span>Shared Kara &amp; {userName} Nodes:</span>
            <span className="font-mono tabular-nums text-sky-300 font-semibold">
              {perspectiveCounts.shared} Shared · {perspectiveCounts.kara} Kara · {perspectiveCounts.user} {userName}
            </span>
          </div>
        </div>

        {/* Key Relationship Stages & Milestones Interactive Roadmap (7 cols) */}
        <div className="lg:col-span-7 bg-[#0F131C] border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">
                Relationship Bond Stages &amp; Key Milestones
              </h2>
              <p className="text-xs text-neutral-400">
                Select any relationship stage below to synchronize Kara&apos;s bond level and unlock stage-specific perks.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-neutral-400">
              {unlockableStats.unlockedStagesCount} of {RELATIONSHIP_STAGES.length} Stages Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RELATIONSHIP_STAGES.map((stage) => {
              const isUnlocked = bondLevel >= stage.minBond;
              const isCurrent = activeStage.id === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => onSelectRelationshipStage(stage.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    isCurrent
                      ? 'bg-rose-500/15 border-rose-400/70 text-white'
                      : isUnlocked
                      ? 'bg-neutral-900/90 border-neutral-700/80 text-neutral-200 hover:border-neutral-600'
                      : 'bg-neutral-950/70 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold ${stage.accentText}`}>
                        {stage.label}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-neutral-400">
                        {stage.minBond}%+
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 line-clamp-2">
                      {stage.unlockedPerk}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                    <span className="text-neutral-400">
                      {isCurrent ? 'Current Stage' : isUnlocked ? 'Unlocked' : 'Tap to Activate'}
                    </span>
                    <span className="font-mono text-sky-300">
                      {isCurrent ? 'Active' : 'Select →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Recorded Milestone Highlights */}
          <div className="pt-3 border-t border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-medium text-neutral-200">
                Latest Recorded Milestones &amp; Bond Imprints
              </span>
              <span className="font-mono tabular-nums">{recordedMilestones.length} recorded</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {recordedMilestones.slice(0, 2).map((ms, idx) => (
                <div
                  key={ms.id}
                  className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs text-neutral-100 line-clamp-2">{ms.content}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                      <span>{MEMORY_CATEGORY_META[ms.category]?.shortLabel || ms.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Importance {ms.importance}/5
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatMemoryTimestamp(ms.createdAt, idx)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onRecallMemoryInChat(
                        `Kara, let's talk about this milestone in our memory bank: "${ms.content}"`
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] text-sky-300 shrink-0 transition-colors"
                    title="Discuss this milestone with Kara in chat"
                  >
                    Discuss
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SHARED MEMORY BANK SECTION: KARA & USER */}
      <div className="bg-[#0F131C] border border-neutral-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">
              Kara &amp; {userName} Shared Memory Bank
            </h2>
            <p className="text-xs text-neutral-400">
              Permanent memory bank keeping Kara&apos;s memories of you, your shared bond &amp; milestones, and her own human self-discoveries.
            </p>
          </div>

          {/* Quick-Seed Templates for 1-Tap Memory Logging */}
          <div className="flex flex-wrap items-center gap-1.5">
            {quickMemoryTemplates.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => {
                  setNewCategory(tpl.category);
                  setNewImportance(tpl.importance);
                  setNewContent(tpl.content);
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                + {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Bank Composer Form */}
        <form
          onSubmit={handleCreateMemory}
          className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/90 items-end"
        >
          <div className="lg:col-span-3">
            <label htmlFor="memory-bank-category" className="block text-xs text-neutral-300 mb-1.5">
              Memory Stream &amp; Perspective
            </label>
            <select
              id="memory-bank-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
              className="w-full px-3 py-2.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white"
            >
              <option value="milestone">Milestone (Kara &amp; You)</option>
              <option value="bond">Emotional Bond (Kara &amp; You)</option>
              <option value="date">Special Date / Anniversary (Kara &amp; You)</option>
              <option value="chat_memory">Shared Chat Memory (Kara &amp; You)</option>
              <option value="self_discovery">Kara Self-Discovery (Kara’s Core)</option>
              <option value="human_nature">Human Nature Insight (Kara’s Journal)</option>
              <option value="preference">User Preference (About {userName})</option>
              <option value="fact">Personal Fact (About {userName})</option>
              <option value="emotion">Emotional Care Note (About {userName})</option>
            </select>
          </div>

          <div className="lg:col-span-5">
            <label htmlFor="memory-bank-content" className="block text-xs text-neutral-300 mb-1.5">
              Memory Description (Shared Moment, Milestone, or Fact)
            </label>
            <input
              id="memory-bank-content"
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={`Record a memory of Kara & ${userName}, a relationship milestone, or personal preference...`}
              className="w-full px-3.5 py-2.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="memory-bank-importance" className="block text-xs text-neutral-300 mb-1.5">
              Importance Weight: <span className="font-mono tabular-nums text-sky-300">{newImportance}/5</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setNewImportance(lvl)}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono tabular-nums border transition-colors ${
                    newImportance === lvl
                      ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-semibold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={!newContent.trim() || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Save to Bank</span>
            </button>
          </div>
        </form>

        {/* Quick Recall Action Chips (Trigger Kara Memory Recall in Chat) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-purple-950/30 to-rose-950/40 border border-sky-800/40 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-sky-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Kara Recall Shortcuts (Tap to recall directly in chat)</span>
            </span>
            <span className="text-[11px] text-neutral-400">1-click continuous recall</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                label: 'Recall My Favorites',
                query: 'Kara, what are my favorite things and preferences that you remember?',
                accent: 'border-sky-500/40 hover:bg-sky-500/20 text-sky-200',
              },
              {
                label: 'Recall My Dislikes',
                query: 'Kara, what are my dislikes and boundaries that you strictly avoid?',
                accent: 'border-rose-500/40 hover:bg-rose-500/20 text-rose-200',
              },
              {
                label: 'Recall Important Dates',
                query: 'Kara, what important dates and milestones do you have saved for me?',
                accent: 'border-amber-500/40 hover:bg-amber-500/20 text-amber-200',
              },
              {
                label: 'Recall Past Conversations',
                query: 'Kara, what do you remember from our past conversations and talks?',
                accent: 'border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-200',
              },
              {
                label: 'Recall Everything About Me',
                query: 'Kara, what do you remember about me in total?',
                accent: 'border-purple-500/40 hover:bg-purple-500/20 text-purple-200',
              },
            ].map((shortcut) => (
              <button
                key={shortcut.label}
                type="button"
                onClick={() => onRecallMemoryInChat(shortcut.query)}
                className={`px-3 py-1.5 rounded-xl bg-neutral-900/80 border text-xs font-medium transition-all flex items-center gap-1.5 ${shortcut.accent}`}
              >
                <span>{shortcut.label}</span>
                <Send className="w-3 h-3 opacity-70" />
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Filter Bar: Segmented Perspective Tabs + Search + Importance Filter */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Segmented Perspective Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
            {[
              { id: 'all', label: `All Bank (${memories.length})` },
              {
                id: 'preferences',
                label: `Favorites (${
                  memories.filter((m) => {
                    const txt = m.content.toLowerCase();
                    const isDislike =
                      txt.startsWith('dislike:') ||
                      txt.includes('dislike') ||
                      txt.includes('hate') ||
                      txt.includes('allergic');
                    return (
                      !isDislike &&
                      (m.category === 'preference' ||
                        txt.includes('favorite') ||
                        txt.includes('loves ') ||
                        txt.includes('prefers '))
                    );
                  }).length
                })`,
              },
              {
                id: 'dislikes',
                label: `Dislikes & Boundaries (${
                  memories.filter((m) => {
                    const txt = m.content.toLowerCase();
                    return (
                      txt.startsWith('dislike:') ||
                      txt.includes('dislike') ||
                      txt.includes('hate') ||
                      txt.includes('allergic') ||
                      txt.includes('cannot stand') ||
                      txt.includes("can't stand") ||
                      txt.includes('strictly avoid')
                    );
                  }).length
                })`,
              },
              {
                id: 'dates',
                label: `Important Dates (${
                  memories.filter((m) => {
                    const txt = m.content.toLowerCase();
                    return (
                      m.category === 'date' ||
                      m.category === 'milestone' ||
                      txt.startsWith('date:') ||
                      txt.includes('birthday') ||
                      txt.includes('anniversary') ||
                      txt.includes('deadline') ||
                      Boolean((m as any)?.eventDate)
                    );
                  }).length
                })`,
              },
              {
                id: 'conversations',
                label: `Past Chats (${
                  memories.filter((m) => {
                    const txt = m.content.toLowerCase();
                    return (
                      m.category === 'chat_memory' ||
                      txt.startsWith('convo:') ||
                      txt.includes('talked about') ||
                      txt.includes('shared moment')
                    );
                  }).length
                })`,
              },
              {
                id: 'shared_bonds',
                label: `Bonds & Milestones (${
                  memories.filter(
                    (m) =>
                      m.category === 'milestone' ||
                      m.category === 'bond' ||
                      m.category === 'date'
                  ).length
                })`,
              },
              {
                id: 'kara_journal',
                label: `Kara’s Discoveries (${
                  memories.filter(
                    (m) => m.category === 'self_discovery' || m.category === 'human_nature'
                  ).length
                })`,
              },
              {
                id: 'user_profile',
                label: `About ${userName} (${
                  memories.filter(
                    (m) =>
                      m.category === 'preference' ||
                      m.category === 'fact' ||
                      m.category === 'emotion'
                  ).length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as BankFilterTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500"
              />
            </div>

            <select
              value={minImportanceFilter}
              onChange={(e) => setMinImportanceFilter(Number(e.target.value))}
              aria-label="Filter by minimum importance"
              className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300"
            >
              <option value={1}>All Importance (1–5)</option>
              <option value={3}>Importance 3+ Only</option>
              <option value={4}>High Importance (4–5)</option>
              <option value={5}>Core Memories Only (5/5)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'importance')}
              aria-label="Sort memories"
              className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300"
            >
              <option value="newest">Sort: Recent Imprints</option>
              <option value="importance">Sort: Highest Importance</option>
            </select>
          </div>
        </div>

        {/* Memory Bank List */}
        <div className="divide-y divide-neutral-800/80 border border-neutral-800 rounded-2xl bg-neutral-950/50">
          {filteredMemories.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-medium text-neutral-200">
                No matching memories found in this view
              </p>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Add a new shared milestone, Kara self-discovery, or personal preference above—or reset your search filter to view all stored nodes.
              </p>
              {(searchQuery || activeTab !== 'all' || minImportanceFilter > 1) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                    setMinImportanceFilter(1);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-sky-300 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            filteredMemories.map((mem, idx) => {
              const meta = MEMORY_CATEGORY_META[mem.category] || MEMORY_CATEGORY_META.fact;
              const isEditing = editingId === mem.id;

              return (
                <div
                  key={mem.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-900/40 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as MemoryCategory)}
                          className="px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                        >
                          {Object.values(MEMORY_CATEGORY_META).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label} ({c.perspectiveLabel})
                            </option>
                          ))}
                        </select>
                        <select
                          value={editImportance}
                          onChange={(e) => setEditImportance(Number(e.target.value))}
                          className="px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              Importance {n}/5
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-xl text-white"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(mem.id)}
                          className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-sm text-neutral-100 leading-relaxed">{mem.content}</p>
                        {/* Clean unboxed metadata with typographic separators */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                          <span className="font-medium" style={{ color: meta.color }}>
                            {meta.label}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{meta.perspectiveLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            Importance {mem.importance || 4}/5
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {formatMemoryTimestamp(mem.createdAt, idx)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onRecallMemoryInChat(
                              `Kara, let's reflect on this memory from our bank: "${mem.content}"`
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-sky-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                          title="Bring this memory into your active conversation with Kara"
                        >
                          <Send className="w-3 h-3" />
                          <span>Recall in Chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(mem)}
                          className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
                          title="Edit memory"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMemory(mem.id)}
                          className="p-2 text-neutral-400 hover:text-rose-400 rounded-xl hover:bg-neutral-800 transition-colors"
                          title="Delete memory from bank"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
