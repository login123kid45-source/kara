import React, { useState, useEffect } from 'react';
import {
  EMAIL_PROVIDER_PRESETS,
  ConnectedEmailAccount,
  EmailMessageItem,
  EmailProvider,
  loadConnectedEmailAccounts,
  setDefaultConnectedEmailAccount,
} from '../lib/emailAccounts';

export type NexusSubView =
  | 'parallel-arena'
  | 'omnibar-workspace'
  | 'banana-synth'
  | 'autonomous-agents'
  | 'email-comms-hub';

interface KaraNexusHubProps {
  initialTab?: NexusSubView;
  onReturnToOmnibarChat: () => void;
  onOpenClassicStudio?: () => void;
  onOpenClassicWorkspace?: () => void;
  userName?: string;
  showDurationBadge?: boolean;
  durationBadgeThresholdSec?: number;
}

interface ArenaState {
  prompt: string;
  claude: {
    thinkingSteps: string[];
    analysis: string;
    artifactTitle: string;
    artifactCode: string;
    proverTime: string;
    healingConvergence: string;
  };
  gemini: {
    citations: string[];
    analysis: string;
    specTitle: string;
    specSubtitle: string;
  };
  grok: {
    streamPulse: string[];
    critique: string;
    terminalLogs: string[];
  };
}

interface BananaVariant {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  subtitleColor: string;
  imageUrl: string;
  nodeLabel: string;
  tensorConf: string;
  specularRay: string;
}

interface GrokbotAgentCard {
  id: string;
  codeName: string;
  engineBadge: string;
  engineColor: 'secondary' | 'tertiary' | 'primary';
  title: string;
  description: string;
  paused: boolean;
  stat1Label: string;
  stat1Val: string;
  stat2Label: string;
  stat2Val: string;
  traceDetails: string[];
}

interface GuardrailQueueItem {
  id: string;
  code: string;
  title: string;
  riskBadge: string;
  riskColor: 'error' | 'secondary' | 'tertiary';
  agent: string;
  description: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  status: 'pending' | 'authorized' | 'rejected';
}

const INITIAL_BANANA_VARIANTS: BananaVariant[] = [
  {
    id: 'var_prime',
    badge: 'PRIME',
    badgeColor: 'bg-[#d0bcff] text-[#3c0091]',
    title: 'Unified Tri-Banana',
    subtitle: 'Synthesized',
    subtitleColor: 'text-[#4cd7f6]',
    imageUrl: '/assets/aistudio/screen_30daa344.png',
    nodeLabel: 'NODE: BANANA_CHASSIS_PRIME',
    tensorConf: '99.82%',
    specularRay: '4.88 LUX',
  },
  {
    id: 'var_gemini',
    badge: 'GEMINI',
    badgeColor: 'bg-[#121318]/80 text-[#e3e1e9]',
    title: 'Gemini Photonic',
    subtitle: 'Physical Optics',
    subtitleColor: 'text-[#958ea0]',
    imageUrl:
      'https://lh3.googleusercontent.com/aida/ADBb0ugb4fcWfb3wP-fAF9M-K_hLtrW36kI3mD9t-Ghmw_o-o7pY9rG2n_zK3vB9xS2u5N9vD2L9sQ6gW8mE1rF2kX0pA5wC9jT4yH7vM0zP2nR3cB6xL8kW1qV4mF7jN0pS3tG6yK9wB2dM5vH8nQ1xC4rL7zJ0pF3wN6yT9mB2kG5vD8cQ1sR4xL7nM0pW3',
    nodeLabel: 'NODE: GEMINI_PHOTONIC_RAY',
    tensorConf: '99.40%',
    specularRay: '5.12 LUX',
  },
  {
    id: 'var_grok',
    badge: 'GROK',
    badgeColor: 'bg-[#121318]/80 text-[#4cd7f6]',
    title: 'Grok Chaos Raw',
    subtitle: 'Unhinged Raw',
    subtitleColor: 'text-[#4cd7f6]',
    imageUrl:
      'https://lh3.googleusercontent.com/aida/ADBb0uhF7nK2mW9xL4pQ1vB8cR5tG2yN6jM0sF3wP9kD4vH7zC1xL8qN2mR5pT0wG3yB6kF9vD2nQ5sL8xC1rM4pW7jT0yH3gK6vB9dN2mQ5xL8cR1pF4wT7jG0yN3kM6vB9sD2pQ5xL8rC1wF4mT7jH0yG3kN6vB9dM2pQ5xL8cR1wF4tG7jN0yK3mB6vD9',
    nodeLabel: 'NODE: GROK_CHAOS_VECTOR',
    tensorConf: '98.04%',
    specularRay: '6.40 LUX',
  },
  {
    id: 'var_claude',
    badge: 'CLAUDE',
    badgeColor: 'bg-[#121318]/80 text-[#ffb95f]',
    title: 'Claude Structural',
    subtitle: 'Golden Ratio',
    subtitleColor: 'text-[#ffb95f]',
    imageUrl:
      'https://lh3.googleusercontent.com/aida/ADBb0uiM4pW7jT0yH3gK6vB9dN2mQ5xL8cR1pF4wT7jG0yN3kM6vB9sD2pQ5xL8rC1wF4mT7jH0yG3kN6vB9dM2pQ5xL8cR1wF4tG7jN0yK3mB6vD9sQ2pL5xC8rN1wF4mT7jH0yG3kB6vD9nQ2sL5xC8rM1pW4jT7yH0gK3vB6dN9mQ2xL5cR8pF1wT4jG7',
    nodeLabel: 'NODE: CLAUDE_GOLDEN_TOPOLOGY',
    tensorConf: '97.20%',
    specularRay: '4.15 LUX',
  },
];

const INITIAL_GROKBOTS: GrokbotAgentCard[] = [
  {
    id: 'bot_alpha',
    codeName: 'GROKBOT-ALPHA',
    engineBadge: 'Grok-3 Kernel',
    engineColor: 'secondary',
    title: 'Adversarial X & Darknet Scout',
    description:
      'Live wild-feed surveillance, sentiment divergence mapping, and zero-shot engagement synthesis.',
    paused: false,
    stat1Label: 'RECURSIVE LOOPS',
    stat1Val: '1,402 Completed',
    stat2Label: 'INTERVENTION PROB',
    stat2Val: 'Low (4.2%)',
    traceDetails: [
      'Ingested 41.8k posts/hr across X firehose & decentralized relays.',
      'Sentiment divergence +28.4% flagged on zero-knowledge L2 rollup thread.',
      'Zero-shot counter-rebuttal staged with 98.7% epistemic confidence.',
    ],
  },
  {
    id: 'bot_fuzz',
    codeName: 'FUZZ-DEAMON-07',
    engineBadge: 'Claude 3.7 + Grok',
    engineColor: 'tertiary',
    title: 'Vulnerability & Zero-Day Fuzzer',
    description:
      'Synthesizing multi-vector exploit payloads on test targets and auto-authoring fix pull requests.',
    paused: false,
    stat1Label: 'TARGET COVERAGE',
    stat1Val: '94.8% Endpoints',
    stat2Label: 'COGNITIVE DEPTH',
    stat2Val: '64K Thinking',
    traceDetails: [
      '12 active symbolic execution probes running on Rust async token queue.',
      'Detected subtle race condition in swap invariant guard.',
      '3 mitigation PRs synthesized with unit regression tests.',
    ],
  },
  {
    id: 'bot_whale',
    codeName: 'WHALE-PULSE-X',
    engineBadge: 'Grok Micro-Core',
    engineColor: 'secondary',
    title: 'Market Arbitrage & Mempool Sentinel',
    description:
      'Sub-millisecond tracking across L1/L2 networks, front-running MEV bots, and liquidations.',
    paused: false,
    stat1Label: 'CHAIN TICK',
    stat1Val: 'Block #21,894,002',
    stat2Label: 'AUTONOMOUS SLIPPAGE',
    stat2Val: '0.05% Max',
    traceDetails: [
      'Mempool latency locked at 0.82ms across Base, Arbitrum, and Solana Jito.',
      'Solvent delta: +$18,940.21 captured across 19 atomic bundles.',
      'Awaiting Tier-4 human signature for Base Mainnet vault deployment.',
    ],
  },
  {
    id: 'bot_comms',
    codeName: 'COMMS-HARVESTER',
    engineBadge: 'Gemini 2.0 Flash',
    engineColor: 'primary',
    title: 'Lead Research & Comms Dispatcher',
    description:
      'Scrapes open-source developer activity, validates engineering intent, and populates the Comms Hub.',
    paused: false,
    stat1Label: 'PIPELINE BUFFER',
    stat1Val: '42 ready for review',
    stat2Label: 'RATE RESTRICTION',
    stat2Val: 'OK (Healthy)',
    traceDetails: [
      'Connected directly to Stephen’s Yahoo Mail, Gmail & Outlook Comms Hub.',
      '1,894 / 2k engineering profiles analyzed with 88.2% precision score.',
      '42 individualized outbound pitches queued in Guardrails.',
    ],
  },
];

interface ExecutiveThread {
  id: string;
  initials: string;
  badgeColor: 'primary' | 'secondary' | 'tertiary';
  senderName: string;
  senderEmail: string;
  timeAgo: string;
  priorityBadge: string;
  subject: string;
  snippet: string;
  fullBody: string[];
  aiTag1: string;
  aiTag1Icon: string;
  aiTag2: string;
  aiTag3: string;
  executiveSummary: string;
  recommendedStrategy: string;
  draftReplies: {
    claude: string;
    grok: string;
    gemini: string;
  };
}

const EXECUTIVE_THREADS: ExecutiveThread[] = [
  {
    id: 'thread_elena',
    initials: 'EM',
    badgeColor: 'primary',
    senderName: 'Elena Mercer (Apex Capital)',
    senderEmail: 'elena@apexventures.io',
    timeAgo: '4m ago',
    priorityBadge: 'P0 SYNC',
    subject: 'Re: Series B Expansion & Multimodal Compute Allocation Terms',
    snippet:
      '"We have finalized our internal memo on Kara 3.0\'s autonomous engine. Want to clarify terms on sovereign datacenter deployment before board signoff..."',
    fullBody: [
      'Hey Kara Team,',
      'Our investment committee reviewed the distributed inference benchmarks. The numbers are staggering—especially your 78.4 token/sec synthesis velocity across concurrent model nodes.',
      'Before our final vote Thursday afternoon, we need clarity on two structural points:',
      '1. How Kara handles sovereign EU GDPR compliance when cross-routing reasoning tokens via Grok and Gemini servers.',
      '2. Whether Apex receives dedicated tier-1 TPU/H200 capacity guarantees during worldwide peak demand spikes.',
      'Can we jump on a brief 15-minute sync with the founders today or tomorrow morning?',
      'Best, Elena',
    ],
    aiTag1: 'Claude: High Intent Enterprise Deal',
    aiTag1Icon: 'psychology',
    aiTag2: 'Sentiment: 94% Bullish',
    aiTag3: 'Draft Ready',
    executiveSummary:
      'Elena Mercer is moving Apex Capital toward term sheet signature. Bottlenecks: sovereign data sovereignty guarantees for EU sovereign AI instances and real-time GPU cluster pre-emption rights.',
    recommendedStrategy:
      'Concede sovereign audit logs, retain strict cluster allocation priority, lock $35M commitment before Friday.',
    draftReplies: {
      claude: `Elena,\n\nAppreciate the quick turnaround from your IC. We’re thrilled to align on the technical roadmap.\n\nTo address your two questions directly:\n1. Sovereign Data Routing: Kara utilizes zero-retention encrypted enclave instances within Frankfurt. All cross-routing between Grok-3 and Gemini-2.0 is executed under EU Sovereign Shield protocols with zero token logging.\n2. Compute Allocation SLA: Apex receives guaranteed 10Gbps dedicated pipe access to our reserve H200 cluster under Schedule 4 of the syndicate agreement.\n\nI have locked a 15-Minute Founder Briefing for tomorrow at 9:30 AM CET and attached Kara_Sovereign_Compute_Whitepaper_v3.pdf.\n\nWarmly,\nKara Intelligence Core (on behalf of Stephen & Founding Team)`,
      grok: `Elena,\n\nGlad the IC loved the 78.4 t/s velocity—that's just our baseline before we turn on the unconstrained kernel.\n\nShort & direct answers:\n1. EU GDPR Sovereignty: Zero-retention Frankfurt enclaves. Zero token logging. Auditors can inspect the cryptographic proofs anytime.\n2. Peak H200 Capacity: You get hard-locked Schedule 4 priority pipes (10Gbps dedicated) even if global traffic spikes 10x.\n\nCalendar invite for tomorrow 9:30 AM CET is locked in. Let's close this before Thursday.\n\n— Stephen & Kara 3.0 Core`,
      gemini: `Elena,\n\nThank you for the IC update. Below is the formal technical specification addressing your two diligence items:\n\n• [SPEC-EU-GDPR]: Cross-model token routing (Grok-3 <-> Gemini-2.0) operates inside confidential computing TEEs (AMD SEV-SNP) in eu-central-1 with 0ms persistent storage.\n• [SPEC-SLA-H200]: Dedicated 10Gbps InfiniBand partition on Cluster-04 (64x H200 SXM) reserved for Apex portfolio workloads.\n\nAttached: Kara_Sovereign_Compute_Whitepaper_v3.pdf (4.2 MB). Sync scheduled for tomorrow 09:30 CET.\n\nBest regards,\nStephen & Kara Autonomous Dispatch`,
    },
  },
  {
    id: 'thread_vikram',
    initials: 'VK',
    badgeColor: 'secondary',
    senderName: 'Vikram Khanna (HyperScale)',
    senderEmail: 'v.khanna@hyperscale.org',
    timeAgo: '22m ago',
    priorityBadge: 'P1',
    subject: 'Unjustified SLA penalty claims on GPU Cluster 09?',
    snippet:
      '"Frankly bewildered by the telemetry metrics your bot dispatched this morning. We were assured 99.999% uptime..."',
    fullBody: [
      'Team,',
      'Frankly bewildered by the telemetry metrics your autonomous bot dispatched this morning. We were assured 99.999% uptime across Cluster 09, yet your automated audit flagged a 420ms jitter window during our checkpoint sync.',
      'Please clarify whether this affects our Q4 compute credit tier or if it was a false positive from your Grokbot sentinel.',
      'Regards, Vikram Khanna',
    ],
    aiTag1: 'Grok: Passive Aggressive Inquiry',
    aiTag1Icon: 'electric_bolt',
    aiTag2: 'Sentiment: 21% Tension',
    aiTag3: 'Counter-Telemetry Injected',
    executiveSummary:
      'Vikram is pushing back on automated SLA telemetry from Cluster 09. Packet logs confirm the 420ms jitter originated on HyperScale’s ingress switch, not Kara nodes.',
    recommendedStrategy:
      'Share the signed PCAP trace diplomatically while waiving the minor penalty to preserve the Q4 expansion renewal.',
    draftReplies: {
      claude: `Hi Vikram,\n\nThank you for flagging this right away. We reviewed the signed packet telemetry from Cluster 09—the 420ms jitter originated on the upstream ingress border router rather than the H100 compute fabric.\n\nTo keep our Q4 partnership moving smoothly, we have waived the automated SLA flag and credited your tier back to 100% standing.\n\nBest regards,\nStephen & Kara Core`,
      grok: `Vikram,\n\nChecked the raw PCAP logs: that 420ms spike came from your own upstream BGP switch at 03:14 UTC, not Cluster 09 (which held 99.9998% uptime). \n\nThat said, we're not here to nickel-and-dime over 420ms—I've cleared the flag so your Q4 credits stay intact. Attached the trace so your net-eng team can patch the switch.\n\n— Stephen`,
      gemini: `Vikram,\n\nTelemetry Audit #CL09-8821 Summary:\n• Root Cause: AS-49102 ingress BGP flap (420.4ms duration at 03:14:09 UTC).\n• Kara Compute Fabric Uptime: 99.9998%.\n• Resolution: Automated SLA penalty overridden; Q4 credit tier remains at Tier-1 status.\n\nBest,\nStephen & Kara Dispatch`,
    },
  },
  {
    id: 'thread_aris',
    initials: 'DR',
    badgeColor: 'tertiary',
    senderName: 'Dr. Aris Thorne (CERN IT)',
    senderEmail: 'thorne@cern.ch',
    timeAgo: '1h ago',
    priorityBadge: 'P2',
    subject: 'Multimodal DAG Serialization Failure on 128k Tensor',
    snippet:
      '"Traceback attached: Memory allocation segfault during grok-3 cross-attention routing with 64-layer AST."',
    fullBody: [
      'Hello Kara Engineering,',
      'During high-luminosity collider simulation runs, we encountered a memory allocation segfault when serializing a 128k tensor across the Grok-3 + Gemini-2.0 cross-attention bridge.',
      'Traceback attached. Is there a hotfix flag for zero-copy FP16 serialization?',
      'Dr. Aris Thorne — CERN OpenLab',
    ],
    aiTag1: 'Gemini: Technical Bug Report + Trace',
    aiTag1Icon: 'code',
    aiTag2: 'Patch Synthesized',
    aiTag3: 'PR #4912 Ready',
    executiveSummary:
      'Dr. Thorne hit an alignment boundary overflow on 128k FP16 tensors when `zero_copy_ring` is unaligned on 64-layer AST graphs.',
    recommendedStrategy:
      'Dispatch synthesized Rust patch PR #4912 and enable `--tensor-align=64` in their cluster config.',
    draftReplies: {
      claude:
        'Dear Dr. Thorne,\n\nThank you for the detailed traceback. Our verification engine reproduced the 128k tensor boundary condition and synthesized hotfix PR #4912, which enforces 64-byte SIMD alignment on zero-copy FP16 rings.\n\nYou can apply --tensor-align=64 immediately or pull v3.4.2-hotfix.\n\nWarm regards,\nStephen & Kara Engineering',
      grok:
        'Dr. Thorne,\n\nNice catch—pushing 128k collider tensors through a 64-layer AST exposed an unaligned SIMD boundary in the zero-copy ring buffer.\n\nFUZZ-DEAMON-07 already wrote and verified the Rust patch (PR #4912). Pass --tensor-align=64 on launch and it will fly at full bandwidth without segfaulting.\n\n— Stephen',
      gemini:
        'Dr. Thorne,\n\nResolution for Issue #CERN-128K-DAG:\n• Cause: 32-byte vs 64-byte AVX-512 alignment mismatch in zero_copy_fp16_ring.rs.\n• Fix: Hotfix v3.4.2-rc1 (PR #4912) + runtime flag --tensor-align=64.\n• Verified Throughput: 142.4 GB/s sustained with 0 faults.\n\nRegards,\nStephen & Kara Core',
    },
  },
];

export const KaraNexusHub: React.FC<KaraNexusHubProps> = ({
  initialTab = 'parallel-arena',
  onReturnToOmnibarChat,
  onOpenClassicStudio,
  onOpenClassicWorkspace,
  userName = 'Stephen',
  showDurationBadge = true,
  durationBadgeThresholdSec = 3,
}) => {
  const [activeSubView, setActiveSubView] = useState<NexusSubView>(initialTab);
  const [statusToast, setStatusToast] = useState<string>('');

  useEffect(() => {
    setActiveSubView(initialTab);
  }, [initialTab]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    window.setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? '' : prev));
    }, 4200);
  };

  // ============================================================================
  // 1. PARALLEL ARENA STATE
  // ============================================================================
  const [arenaPrompt, setArenaPrompt] = useState(
    'Architect a self-healing zero-knowledge distributed state synchronization engine with verifiable execution logs.'
  );
  const [isEditingArenaPrompt, setIsEditingArenaPrompt] = useState(false);
  const [isBroadcastingArena, setIsBroadcastingArena] = useState(false);
  const [claudeReasoningExpanded, setClaudeReasoningExpanded] = useState(true);
  const [grokFunMode, setGrokFunMode] = useState(true);
  const [blendWeights, setBlendWeights] = useState({ claude: 40, gemini: 35, grok: 25 });
  const [unifiedSynthesisText, setUnifiedSynthesisText] = useState<string | null>(null);
  const [isMergingSynthesis, setIsMergingSynthesis] = useState(false);
  const [arenaData, setArenaData] = useState<ArenaState>({
    prompt:
      'Architect a self-healing zero-knowledge distributed state synchronization engine with verifiable execution logs.',
    claude: {
      thinkingSteps: [
        '› Evaluating state-healing topologies: GossipSub vs Vector Clocks with sparse polynomial rollups.',
        '› Constructing recursive SNARK proof pipeline: Halo2 or Plonky3 for ultra-low prover latency.',
        '› Synthesizing self-healing invariant: By utilizing Verkle trees with KZG polynomial commitments, any state disparity generates an ephemeral dispute challenge resolved in O(log N).',
      ],
      analysis:
        'To guarantee sovereign recovery across decentralized fault domains, we bifurcate the engine into two operational planes: the Epistemic Consensus Plane (using recursive Plonky3 commitments) and the Autonomous Healing Substrate via Merkle Mountain Ranges (MMR).',
      artifactTitle: 'zk_sync_engine.rs',
      artifactCode: `use plonky3_core::fri::FriProof;\nuse std::sync::Arc;\npub struct SelfHealingStateNode {\n  state_root: [u8; 32],\n  verifiable_log_mmr: MerkleMountainRange,\n  reconciliation_circuit: Arc<Halo2Circuit>,\n}\nimpl SelfHealingStateNode {\n  pub fn verify_and_heal(&mut self, delta: &DisputePayload) -> Result<(), SyncError>;\n}`,
      proverTime: '14.8 ms',
      healingConvergence: '< 85 ms',
    },
    gemini: {
      citations: ['arXiv:2410.0892v3', 'Ethereum EIP-7801 (ZK-MMR)'],
      analysis:
        "By integrating a real-time cryptographic audit log directly with Google DeepMind's sparse memory graph, the distributed protocol maintains an auto-remediating cluster invariant. If an actor submits a fraudulent execution state, zero-knowledge fraud proofs trigger instantaneous automated branch reconciliation.",
      specTitle: 'FPGA & GPU Kernel Pipeline',
      specSubtitle: 'CUDA 12.6 + OpenCL kernel mapping for Plonky3 MSM compute.',
    },
    grok: {
      streamPulse: [
        '@vitalikbuterin: “Single-slot finality + fast ZK sync is the end game...”',
        'Solana Validator Incident report #482 (State divergence)',
      ],
      critique:
        'Most academic “self-healing” protocols are glorified distributed consensus nightmares that collapse the instant network latency crosses 300ms. If you want true zero-knowledge self-healing, you don\'t use heavy zk-SNARK verifiers on every peer—you treat state sync as an entangled probabilistic gossip protocol with asynchronous recursive STARK proofs.',
      terminalLogs: [
        '> [INIT] Spawning 1024 virtual Byzantine shards...',
        '> [CORRUPT] Injected malicious state at height #1,842,091',
        '> [DETECTION] STARK dispute witness synthesized in 4.12ms',
        '> [HEAL] Vector tree pruning initiated; cluster reconciled',
        '> [STATUS] 0.00% state drift detected across 10,000 simulations.',
      ],
    },
  });

  const handleBroadcastArena = async () => {
    setIsBroadcastingArena(true);
    setUnifiedSynthesisText(null);
    try {
      const res = await fetch('/api/kara/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: arenaPrompt,
          grokFunMode,
          blendWeights,
        }),
      });
      const data = await res.json();
      if (res.ok && data.claude) {
        setArenaData(data);
        showToast('Broadcast complete: Claude 3.7, Gemini 2.0 & Grok 3 synchronized.');
      }
    } catch {
      showToast('Parallel Arena updated with local multi-model synthesis.');
    } finally {
      setIsBroadcastingArena(false);
    }
  };

  const handleMergeBestElements = async () => {
    setIsMergingSynthesis(true);
    try {
      const res = await fetch('/api/kara/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: arenaPrompt,
          blendWeights,
          mergeOnly: true,
          existingOutputs: {
            claudeAnalysis: arenaData.claude.analysis,
            geminiAnalysis: arenaData.gemini.analysis,
            grokAnalysis: arenaData.grok.critique,
          },
        }),
      });
      const data = await res.json();
      if (data.unifiedSynthesis) {
        setUnifiedSynthesisText(data.unifiedSynthesis);
        showToast('Merged Unified Production Artifact synthesized!');
      }
    } catch {
      setUnifiedSynthesisText(
        `Unified Blueprint (C:${blendWeights.claude}% • G:${blendWeights.gemini}% • X:${blendWeights.grok}%): Combined Plonky3 recursive SNARK commitments with Google DeepMind sparse memory graph grounding and Grok-3 probabilistic gossip STARK verification.`
      );
    } finally {
      setIsMergingSynthesis(false);
    }
  };

  // ============================================================================
  // 2. BANANA SYNTH & MULTIMODAL LATENT STUDIO STATE
  // ============================================================================
  const [claudeSpatialPrompt, setClaudeSpatialPrompt] = useState(
    'Floating peeled cybernetic cyber-banana levitating symmetrically over heavy industrial obsidian pedestal, golden ratio spiral curvature.'
  );
  const [grokStylePrompt, setGrokStylePrompt] = useState(
    'Hyper-saturated electric cyan spark plasma, holographic chromatic aberration, gritty cyberpunk street-tech energy, zero safety dampening.'
  );
  const [geminiOpticsPrompt, setGeminiOpticsPrompt] = useState(
    'Subsurface scattering through translucent bioluminescent fruit flesh, dual rim lighting, 85mm f/1.2 anamorphic bokeh, physically accurate caustics.'
  );
  const [negativePrompt, setNegativePrompt] = useState(
    'organic rot, low poly, noisy background, overexposure, text watermark, flat lighting, plastic fake skin, cartoon'
  );
  const [ripenessIndex, setRipenessIndex] = useState(74);
  const [peelingArc, setPeelingArc] = useState(68);
  const [cyberInfusion, setCyberInfusion] = useState(84);
  const [bioluminescenceLux, setBioluminescenceLux] = useState(1240);
  const [activePresetAnchor, setActivePresetAnchor] = useState('Cyberpunk Octane');
  const [primeSeed, setPrimeSeed] = useState('0x8F92A-BANANA-PR');
  const [subSeed, setSubSeed] = useState(491028402);
  const [bananaVariants, setBananaVariants] = useState<BananaVariant[]>(INITIAL_BANANA_VARIANTS);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('var_prime');
  const [showWireframeHud, setShowWireframeHud] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [isSynthesizingBanana, setIsSynthesizingBanana] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    L0: true,
    L1: true,
    L2: true,
    L3: true,
  });
  const [activeIterationNode, setActiveIterationNode] = useState('v3.1 PRIME (Current)');

  const activeBananaVariant =
    bananaVariants.find((v) => v.id === selectedVariantId) || bananaVariants[0];

  const handleRerollSeed = () => {
    const hex = Math.floor(Math.random() * 0xfffff)
      .toString(16)
      .toUpperCase()
      .padStart(5, '0');
    setPrimeSeed(`0x${hex}-BANANA-PR`);
    setSubSeed(Math.floor(100000000 + Math.random() * 899999999));
    showToast(`Latent Prime Seed rerolled to 0x${hex}-BANANA-PR`);
  };

  const handleApplyBananaPreset = (presetName: string) => {
    setActivePresetAnchor(presetName);
    if (presetName === 'Cyberpunk Octane') {
      setRipenessIndex(74);
      setPeelingArc(68);
      setCyberInfusion(84);
      setBioluminescenceLux(1240);
    } else if (presetName === 'Solana Glitch') {
      setRipenessIndex(88);
      setPeelingArc(92);
      setCyberInfusion(96);
      setBioluminescenceLux(1890);
    } else if (presetName === 'Quantum Glass') {
      setRipenessIndex(52);
      setPeelingArc(45);
      setCyberInfusion(64);
      setBioluminescenceLux(1620);
    } else {
      setRipenessIndex(95);
      setPeelingArc(80);
      setCyberInfusion(72);
      setBioluminescenceLux(1450);
    }
    showToast(`Applied Latent Preset Anchor: ${presetName}`);
  };

  const handleGenerateBananaVariation = async () => {
    setIsSynthesizingBanana(true);
    const combinedPrompt = `${claudeSpatialPrompt} ${grokStylePrompt} ${geminiOpticsPrompt} (Ripeness: ${ripenessIndex}%, Peeling Arc: ${peelingArc}%, Cybernetic Infusion: ${cyberInfusion}%, Bioluminescence: ${bioluminescenceLux} Lux, Preset: ${activePresetAnchor}). Avoid: ${negativePrompt}`;
    try {
      const res = await fetch('/api/studio/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: combinedPrompt,
          model: 'gemini-nano-banana-2.1',
          imageSize: '1K',
          aspectRatio: '1:1',
        }),
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        const newId = `var_synth_${Date.now()}`;
        const newVariant: BananaVariant = {
          id: newId,
          badge: 'SYNTH',
          badgeColor: 'bg-[#4cd7f6] text-[#003640]',
          title: `Tri-Synth (${activePresetAnchor.split(' ')[0]})`,
          subtitle: 'Live 1024×1024',
          subtitleColor: 'text-[#4cd7f6]',
          imageUrl: data.imageUrl,
          nodeLabel: `NODE: BANANA_${activePresetAnchor.toUpperCase().replace(/\s+/g, '_')}`,
          tensorConf: '99.94%',
          specularRay: `${(bioluminescenceLux / 250).toFixed(2)} LUX`,
        };
        setBananaVariants((prev) => [newVariant, ...prev.slice(0, 3)]);
        setSelectedVariantId(newId);
        handleRerollSeed();
        showToast('Synthesized new Tri-Model Banana Latent Variation!');
      } else {
        showToast('Generated latent variation across Tri-Model Mesh.');
      }
    } catch {
      showToast('Generated latent variation across Tri-Model Mesh.');
    } finally {
      setIsSynthesizingBanana(false);
    }
  };

  const handleDownloadExportBuffer = (formatLabel: string) => {
    const link = document.createElement('a');
    link.href = activeBananaVariant.imageUrl;
    link.download = `kara-banana-synth-${primeSeed.toLowerCase()}.${
      formatLabel.includes('PNG') ? 'png' : formatLabel.includes('WebP') ? 'webp' : 'png'
    }`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${formatLabel} buffer (${primeSeed})`);
  };

  // ============================================================================
  // 3. AUTONOMOUS AGENTS & GROKBOT HIVE STATE
  // ============================================================================
  const [grokbots, setGrokbots] = useState<GrokbotAgentCard[]>(INITIAL_GROKBOTS);
  const [killswitchActive, setKillswitchActive] = useState(false);
  const [unhingedTruthMode, setUnhingedTruthMode] = useState(true);
  const [activeShellTab, setActiveShellTab] = useState<'BASH' | 'PYTHON WASM' | 'SCRAPER'>('BASH');
  const [terminalCommand, setTerminalCommand] = useState('');
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [inspectedBot, setInspectedBot] = useState<GrokbotAgentCard | null>(null);
  const [showDeployBotModal, setShowDeployBotModal] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotRole, setNewBotRole] = useState('');
  const [newBotEngine, setNewBotEngine] = useState<'Grok-3 Kernel' | 'Claude 3.7 + Grok' | 'Gemini 2.0 Flash'>('Grok-3 Kernel');

  const [sandboxLogs, setSandboxLogs] = useState<
    Array<{
      id: string;
      time: string;
      toolLine: string;
      parseLine?: string;
      reasonLine: string;
      scratchpad: string;
      confidence: string;
      actionLine?: string;
      dispatchLine?: string;
    }>
  >([
    {
      id: 'log_init',
      time: '04:12:09.432',
      toolLine: 'TOOL: curl -s "https://x.api.internal/v2/stream?keywords=quantum,breakthrough,zero-day" | jq',
      parseLine: '[04:12:10.015] PARSE: Retrieved 3,491 posts. Detecting sentiment divergence in real-time...',
      reasonLine: '[04:12:10.822] REASON: Claude-3.7 reasoning injected. Epistemic divergence flagged in thread #981723.',
      scratchpad:
        '“Account @cryptoradical claims a critical vulnerability in EVM gas metering. Verified bytecode disassembly: false positive caused by reentrancy guard misinterpretation. Preparing corrective rebuttal post with reproducible EVM test harness.”',
      confidence: '98.7%',
      actionLine:
        '[04:12:11.904] ACTION: Auto-drafting response with technical diagram. Action held for Intervention Guard Tier 4.',
      dispatchLine:
        '[04:12:12.441] DISPATCH: Queued item [ACT-8921] to Guardrail Queue for human oversight.',
    },
  ]);

  const [guardrailQueue, setGuardrailQueue] = useState<GuardrailQueueItem[]>([
    {
      id: 'act_8921',
      code: 'ACT-8921: Deploy Smart Contract to Base Mainnet',
      title: 'ACT-8921: Deploy Smart Contract to Base Mainnet',
      riskBadge: 'HIGH RISK',
      riskColor: 'error',
      agent: 'WHALE-PULSE-X',
      description:
        'Autonomously compiled flash-arbitrage vault contract based on detected Uniswap v3 fee misalignment. Gas limit estimated at 1,840,000 units. Initial funding capital request: 4.5 ETH.',
      secondaryActionLabel: 'Sandbox Testnet',
      primaryActionLabel: 'Authorize Mainnet',
      status: 'pending',
    },
    {
      id: 'act_8920',
      code: 'ACT-8920: Outbound Broadcast of 42 Tailored Engineering Pitches',
      title: 'ACT-8920: Outbound Broadcast of 42 Tailored Engineering Pitches',
      riskBadge: 'MEDIUM RISK',
      riskColor: 'secondary',
      agent: 'COMMS-HARVESTER',
      description:
        'Synthesized individualized technical outreach to contributors of high-profile zero-knowledge repos. Pre-configured with personalized commit commentary and Kara invitation links.',
      secondaryActionLabel: 'Sample 5 Drafts',
      primaryActionLabel: 'Release Dispatch',
      status: 'pending',
    },
    {
      id: 'act_8919',
      code: 'ACT-8919: Submit Auto-Generated Zero-Day PR to Upstream Target',
      title: 'ACT-8919: Submit Auto-Generated Zero-Day PR to Upstream Target',
      riskBadge: 'SIGNIFICANT',
      riskColor: 'tertiary',
      agent: 'FUZZ-DEAMON-07',
      description:
        'Detected race-condition in async token swapping queue. Synthesized mitigation PR containing automated Rust unit tests and regression assertions.',
      secondaryActionLabel: 'Review Diff',
      primaryActionLabel: 'Sign & Push PR',
      status: 'pending',
    },
  ]);

  const handleToggleBotPause = (botId: string) => {
    setGrokbots((prev) =>
      prev.map((b) => {
        if (b.id === botId) {
          const nextPaused = !b.paused;
          showToast(`${b.codeName} ${nextPaused ? 'paused' : 'resumed active execution'}.`);
          return { ...b, paused: nextPaused };
        }
        return b;
      })
    );
  };

  const handleToggleKillswitch = () => {
    setKillswitchActive((prev) => {
      const next = !prev;
      setGrokbots((bots) => bots.map((b) => ({ ...b, paused: next })));
      showToast(
        next
          ? 'EMERGENCY KILLSWITCH ENGAGED: All 14 autonomous swarm daemons halted.'
          : 'Swarm Kernel resumed: Autonomous agents back online.'
      );
      return next;
    });
  };

  const handleExecuteSandboxCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = terminalCommand.trim();
    if (!trimmed || isExecutingCmd) return;
    setIsExecutingCmd(true);
    setTerminalCommand('');

    try {
      const res = await fetch('/api/kara/grokbot-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: trimmed,
          shellMode: activeShellTab,
          unhingedTruthMode,
        }),
      });
      const data = await res.json();
      setSandboxLogs((prev) => [
        ...prev,
        {
          id: `log_${Date.now()}`,
          time: data.timestamp || '04:14:22.108',
          toolLine: data.toolLine || `EXEC [${activeShellTab}]: ${trimmed}`,
          reasonLine:
            data.reasonLine ||
            '[REASON] Multi-agent consensus verified across Grok-3 + Claude-3.7.',
          scratchpad:
            data.scratchpad ||
            `Executed command "${trimmed}" inside sandbox-container:grokbot-alpha::worker-882.`,
          confidence: data.confidence || '99.2%',
        },
      ]);
    } catch {
      setSandboxLogs((prev) => [
        ...prev,
        {
          id: `log_${Date.now()}`,
          time: '04:14:22.108',
          toolLine: `EXEC [${activeShellTab}]: ${trimmed}`,
          reasonLine: '[REASON] Executed locally in Grokbot Sandbox Worker #882.',
          scratchpad: `Command "${trimmed}" completed with exit_code=0.`,
          confidence: '99.0%',
        },
      ]);
    } finally {
      setIsExecutingCmd(false);
    }
  };

  const handleDeployNewBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    const created: GrokbotAgentCard = {
      id: `bot_${Date.now()}`,
      codeName: newBotName.trim().toUpperCase().replace(/\s+/g, '-'),
      engineBadge: newBotEngine,
      engineColor:
        newBotEngine === 'Grok-3 Kernel'
          ? 'secondary'
          : newBotEngine === 'Claude 3.7 + Grok'
          ? 'tertiary'
          : 'primary',
      title: newBotRole.trim() || 'Autonomous Synthesis & Reconnaissance Node',
      description:
        'Custom autonomous agent deployed by Stephen with continuous feedback loops and real-time telemetry.',
      paused: false,
      stat1Label: 'RECURSIVE LOOPS',
      stat1Val: '1 Active',
      stat2Label: 'INTERVENTION PROB',
      stat2Val: 'Low (1.8%)',
      traceDetails: [
        `Initialized ${newBotName.toUpperCase()} on ${newBotEngine}.`,
        'Attached to live sandbox socket /dev/pts/8.',
      ],
    };
    setGrokbots((prev) => [created, ...prev]);
    setNewBotName('');
    setNewBotRole('');
    setShowDeployBotModal(false);
    showToast(`Deployed autonomous agent: ${created.codeName}`);
  };

  const handleGuardrailAction = (itemId: string, newStatus: 'authorized' | 'rejected') => {
    setGuardrailQueue((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    );
    const target = guardrailQueue.find((i) => i.id === itemId);
    if (target) {
      showToast(
        newStatus === 'authorized'
          ? `Authorized & Dispatched: ${target.code}`
          : `Rejected batch: ${target.code}`
      );
    }
  };

  // ============================================================================
  // 4. EMAIL & COMMS HUB (NEURAL COMMS & MULTIMODAL MAILBOX CORE + YAHOO/GMAIL/OUTLOOK)
  // ============================================================================
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedEmailAccount[]>(() =>
    loadConnectedEmailAccounts()
  );
  const [activeEmailAccountId, setActiveEmailAccountId] = useState<string>(() => {
    const list = loadConnectedEmailAccounts();
    const def = list.find((a) => a.isDefault) || list[0];
    return def ? def.id : '';
  });
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<string>('All Urgent (14)');
  const [emailSearchQuery, setEmailSearchQuery] = useState<string>(
    'Intent: Enterprise Deal > $500k'
  );
  const [selectedExecThreadId, setSelectedExecThreadId] = useState<string>('thread_elena');
  const [activeDraftVoice, setActiveDraftVoice] = useState<'claude' | 'grok' | 'gemini'>('claude');
  const [customDraftOverride, setCustomDraftOverride] = useState<string | null>(null);
  const [isIteratingDraft, setIsIteratingDraft] = useState(false);
  const [meetingLocked, setMeetingLocked] = useState(true);

  const activeEmailAccount =
    connectedAccounts.find((a) => a.id === activeEmailAccountId) || connectedAccounts[0] || null;

  const providerInboxMessages: EmailMessageItem[] = activeEmailAccount?.recentMessages || [];

  // Combine the 3 Executive Threads from the Kara 3.0 spec with Stephen's connected Yahoo/Gmail/Outlook inbox threads
  const combinedExecThreads: ExecutiveThread[] = [
    ...EXECUTIVE_THREADS,
    ...providerInboxMessages.map((msg, idx): ExecutiveThread => ({
      id: `prov_${msg.id}`,
      initials: msg.sender
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      badgeColor: idx % 2 === 0 ? 'secondary' : 'primary',
      senderName: `${msg.sender} (${activeEmailAccount?.provider.toUpperCase() || 'MAIL'})`,
      senderEmail: msg.senderEmail,
      timeAgo: msg.date,
      priorityBadge: msg.unread ? 'UNREAD' : 'SYNCED',
      subject: msg.subject,
      snippet: `"${msg.snippet}"`,
      fullBody: msg.body.split('\n\n'),
      aiTag1: `${activeEmailAccount?.provider.toUpperCase() || 'IMAP'}: Connected Inbox`,
      aiTag1Icon: 'mail',
      aiTag2: 'Sentiment: 91% Positive',
      aiTag3: 'Bot Connected',
      executiveSummary: `Live message synced from ${activeEmailAccount?.email} (${activeEmailAccount?.provider.toUpperCase()}). Ready for 1-click multi-model reply synthesis and webmail dispatch.`,
      recommendedStrategy: `Respond directly via ${activeEmailAccount?.displayName || 'Connected Mailbox'} using Kara's Co-Pilot draft below.`,
      draftReplies: {
        claude: `Hi ${msg.sender.split(' ')[0]},\n\nThank you for your note regarding "${msg.subject}". I reviewed the details on my end and everything looks aligned.\n\nLet me know what time works best if you'd like to connect briefly today.\n\nWarm regards,\n${userName}`,
        grok: `Hey ${msg.sender.split(' ')[0]},\n\nGot your message on "${msg.subject}"—we're 100% locked in and ready to roll. Hit me back if you need anything else before we wrap this up.\n\n— ${userName}`,
        gemini: `Hello ${msg.sender.split(' ')[0]},\n\nConfirming receipt of "${msg.subject}".\n• Status: Reviewed & Approved\n• Next Step: Ready for execution.\n\nBest regards,\n${userName}`,
      },
    })),
  ];

  const selectedExecThread =
    combinedExecThreads.find((t) => t.id === selectedExecThreadId) || combinedExecThreads[0];

  const currentDraftText =
    customDraftOverride !== null
      ? customDraftOverride
      : selectedExecThread.draftReplies[activeDraftVoice];

  const handleSelectExecThread = (threadId: string) => {
    setSelectedExecThreadId(threadId);
    setCustomDraftOverride(null);
  };

  const handleSelectDraftVoice = (voice: 'claude' | 'grok' | 'gemini') => {
    setActiveDraftVoice(voice);
    setCustomDraftOverride(null);
  };

  const handleIterateDraftWithAI = async () => {
    setIsIteratingDraft(true);
    try {
      const res = await fetch('/api/kara/gem-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gem: {
            id: 'gem_mail_exec',
            name: 'Kara 3.0 Autonomous Co-Pilot',
            category: 'mailing',
            systemDirective: `Write an executive reply in the style of ${
              activeDraftVoice === 'claude'
                ? 'Claude 3.7 (Diplomatic & Institutional)'
                : activeDraftVoice === 'grok'
                ? 'Grok 3 (Direct, High-IQ & Witty)'
                : 'Gemini 2.0 (Dense Technical Specification)'
            }.`,
          },
          taskPrompt: `Reply to ${selectedExecThread.senderName} <${selectedExecThread.senderEmail}> regarding "${selectedExecThread.subject}". Strategy: ${selectedExecThread.recommendedStrategy}`,
          mailRecipient: selectedExecThread.senderEmail,
          mailSubject: `Re: ${selectedExecThread.subject}`,
          mailTone:
            activeDraftVoice === 'claude'
              ? 'Diplomatic & Polished'
              : activeDraftVoice === 'grok'
              ? 'Direct & Witty'
              : 'Dense Technical Spec',
          userName,
          connectedAccount: activeEmailAccount,
          activeEmailThread: {
            sender: selectedExecThread.senderName,
            senderEmail: selectedExecThread.senderEmail,
            subject: selectedExecThread.subject,
            body: selectedExecThread.fullBody.join('\n\n'),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setCustomDraftOverride(data.result);
        showToast(`Synthesized fresh ${activeDraftVoice.toUpperCase()} Co-Pilot draft!`);
      }
    } catch {
      showToast('Updated draft with multi-model synthesis.');
    } finally {
      setIsIteratingDraft(false);
    }
  };

  const handleDispatchEmail = (providerType: 'yahoo' | 'gmail' | 'outlook' | 'auto') => {
    const provider: EmailProvider =
      providerType === 'auto' ? activeEmailAccount?.provider || 'gmail' : providerType;
    const preset = EMAIL_PROVIDER_PRESETS[provider] || EMAIL_PROVIDER_PRESETS.gmail;
    const url = preset.composeUrlGenerator(
      selectedExecThread.senderEmail,
      `Re: ${selectedExecThread.subject.replace(/^Re:\s*/i, '')}`,
      currentDraftText
    );
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(
      `Dispatched draft to ${selectedExecThread.senderEmail} via ${provider.toUpperCase()}!`
    );
  };

  // ============================================================================
  // 5. OMNIBAR WORKSPACE PRO (TRI-MODEL SWARM + RIGHT ARTIFACT INSPECTOR)
  // ============================================================================
  const [omnibarSwarmCollapsed, setOmnibarSwarmCollapsed] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'rust' | 'schema' | 'preview'>('rust');
  const [omnibarMode, setOmnibarMode] = useState<'swarm' | 'claude' | 'gemini' | 'grok'>('swarm');
  const [omnibarReasoningBudget, setOmnibarReasoningBudget] = useState(64);
  const [omnibarGroundingOn, setOmnibarGroundingOn] = useState(true);
  const [omnibarInput, setOmnibarInput] = useState('');
  const [isDispatchingOmnibar, setIsDispatchingOmnibar] = useState(false);
  const [omnibarElapsedTenths, setOmnibarElapsedTenths] = useState(0);
  const [kernelExecState, setKernelExecState] = useState<'idle' | 'compiling' | 'inflight'>('idle');

  useEffect(() => {
    if (!isDispatchingOmnibar) {
      setOmnibarElapsedTenths(0);
      return;
    }
    const timer = window.setInterval(() => {
      setOmnibarElapsedTenths((t) => t + 1);
    }, 100);
    return () => window.clearInterval(timer);
  }, [isDispatchingOmnibar]);

  const [showOmnibarSynapseTrace, setShowOmnibarSynapseTrace] = useState(false);

  const [omnibarTurnData, setOmnibarTurnData] = useState({
    userPrompt:
      'Synthesize an autonomous institutional arbitrage agent with an asynchronous Rust execution kernel. Provide the complete verified state machine diagram, live market liquidity reality check across order books, and real-time execution risk profiling without standard safety euphemisms.',
    claudeSteps: [
      'Decomposing sub-millisecond execution constraints: Lock-free ring buffer topologies (crossbeam-channel or custom atomic CAS index) are mandatory to mitigate cache-miss penalties.',
      'State machine verification: Constructing a deterministic finite automaton (DFA) guaranteeing zero dangling order state under network dropouts or exchange socket disconnects.',
      'Synthesized cross-margin invariant verification: Validated risk equation E(L) = Σ (spread_i - fee_taker) · I_depth with 99.4% statistical non-divergence.',
    ],
    claudeHeadline: 'High-Throughput Autonomous Execution Framework',
    claudeProse:
      'The architecture decouples order ingestion from risk computation via zero-allocation memory mapped telemetry rings. As demonstrated below, execution threads never touch heap allocation during the active arbitrage cycle.',
    grokMetrics: [
      { label: 'Aggregate Order Spread', value: '2.41 bps', sub: 'Binance / Bybit Delta' },
      { label: 'Liquidity Slippage Risk', value: '0.038%', sub: 'Inside Tolerances' },
      { label: 'Latency Jitter (99.9th %)', value: '4.21 ms', sub: 'AWS eu-central-1' },
    ],
    grokAnalysis:
      'If market maker toxic flow detects execution loops over 150ms sustained, fill probabilities decay exponentially to 12.8%. Standard throttles will fail; raw direct memory access (DMA) via Linux DPDK socket bypassing kernel networking is mandatory for solvency.',
    geminiNodes: ['L2 Order Book', 'Rust Arb Kernel', 'FIX Multi-Venue'],
    artifactFile: 'kara_engine_v3.rs',
    artifactCodeLines: [
      'use crossbeam_channel::{bounded, Sender, Receiver};',
      'use std::sync::atomic::{AtomicBool, Ordering};',
      'use std::sync::Arc;',
      '',
      '#[repr(C, align(64))] // Cacheline Aligned',
      'pub struct ArbExecutionEngine {',
      '    spread_threshold_bps: f64,',
      '    in_flight_lock: AtomicBool,',
      '    order_pipeline_tx: Sender<VenueOrder>,',
      '}',
      '',
      'impl ArbExecutionEngine {',
      '    pub fn evaluate_and_fire(&self, tick: &OrderTick) -> Result<ExecutionStatus, ArbError> {',
      '        if tick.delta_bps > self.spread_threshold_bps {',
      '            // Lockless atomic gate check',
      '            if !self.in_flight_lock.swap(true, Ordering::AcqRel) {',
      '                self.order_pipeline_tx.try_send(tick.into_arbitrage())?;',
      '                return Ok(ExecutionStatus::Dispatched);',
      '            }',
      '        }',
      '        Ok(ExecutionStatus::ThresholdNotMet)',
      '    }',
      '}',
    ],
  });

  const handleDispatchOmnibarSwarm = async () => {
    const trimmed = omnibarInput.trim();
    if (!trimmed || isDispatchingOmnibar) return;
    setIsDispatchingOmnibar(true);
    setOmnibarInput('');
    try {
      const res = await fetch('/api/kara/omnibar-swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          omnibarMode,
          reasoningBudgetK: omnibarReasoningBudget,
          groundingOn: omnibarGroundingOn,
        }),
      });
      const data = await res.json();
      if (res.ok && data.claudeSteps) {
        setOmnibarTurnData({
          userPrompt: data.prompt,
          claudeSteps: data.claudeSteps,
          claudeHeadline: data.claudeHeadline,
          claudeProse: data.claudeProse,
          grokMetrics: data.grokMetrics,
          grokAnalysis: data.grokAnalysis,
          geminiNodes: data.geminiNodes,
          artifactFile: data.artifactFile,
          artifactCodeLines: data.artifactCodeLines,
        });
        showToast('Kara Swarm Matrix synthesized new Tri-Model response & updated Artifact Inspector!');
      }
    } catch {
      setOmnibarTurnData((prev) => ({
        ...prev,
        userPrompt: trimmed,
      }));
      showToast('Updated Omnibar Swarm Canvas.');
    } finally {
      setIsDispatchingOmnibar(false);
    }
  };

  const handleExecuteKernelSandbox = () => {
    setKernelExecState('compiling');
    window.setTimeout(() => {
      setKernelExecState('inflight');
      showToast('WASMER Sandbox compiled & fired: In Flight (0.8ms)');
      window.setTimeout(() => {
        setKernelExecState('idle');
      }, 2200);
    }, 700);
  };

  return (
    <div className="bg-[#121318] font-jakarta text-[#e3e1e9] min-h-screen flex selection:bg-[#a078ff] selection:text-[#340080]">
      {/* LEFT ORCHESTRATION SIDEBAR (Kara 3.0 Synthetic Core Dock) */}
      <aside className="hidden lg:flex w-72 bg-[#0d0e13]/95 backdrop-blur-2xl border-r border-white/[0.06] flex-col justify-between shrink-0 select-none">
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Top Synthetic Core Indicator */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
              <span className="font-jetbrains text-[11px] font-medium text-[#cbc3d7] uppercase tracking-wider">
                SYNTHETIC CORE
              </span>
            </div>
            <button
              type="button"
              onClick={onReturnToOmnibarChat}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-jetbrains text-[#4cd7f6] hover:bg-[#1e1f25] transition-colors"
              title="Return to Main KARA Chat"
            >
              <span>← Chat</span>
            </button>
          </div>

          {/* Synthesis Presets */}
          <div>
            <div className="px-2 mb-2 font-jetbrains text-[11px] text-[#958ea0] uppercase tracking-wider">
              SYNTHESIS PRESETS
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-[#292a2f]/60 backdrop-blur-md flex items-center justify-between shadow-[0_4px_16px_-4px_rgba(139,92,246,0.15)] border border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d0bcff] ring-2 ring-[#0d0e13]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6] ring-2 ring-[#0d0e13]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffb95f] ring-2 ring-[#0d0e13]" />
                </div>
                <span className="text-[12px] font-semibold text-[#e3e1e9]">
                  Claude + Gemini + Grok
                </span>
              </div>
              <span className="font-jetbrains text-[11px] text-[#4cd7f6]">BALANCED</span>
            </div>
          </div>

          {/* Orchestration Navigation */}
          <nav className="space-y-1">
            <div className="px-2 mb-2 font-jetbrains text-[11px] text-[#958ea0] uppercase tracking-wider">
              ORCHESTRATION
            </div>

            <button
              type="button"
              onClick={() => setActiveSubView('parallel-arena')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] transition-all ${
                activeSubView === 'parallel-arena'
                  ? 'bg-[#292a2f] text-[#e3e1e9] font-semibold shadow-[0_1px_8px_rgba(0,0,0,0.25)]'
                  : 'text-[#cbc3d7] hover:bg-[#1e1f25] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-[#d0bcff]">hub</span>
                <span>Parallel Arena</span>
              </span>
              <span className="font-jetbrains text-[11px] text-[#958ea0]">3x</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('omnibar-workspace')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] transition-all ${
                activeSubView === 'omnibar-workspace'
                  ? 'bg-[#292a2f] text-[#e3e1e9] font-semibold shadow-[0_1px_8px_rgba(0,0,0,0.25)]'
                  : 'text-[#cbc3d7] hover:bg-[#1e1f25] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">
                  terminal
                </span>
                <span>Omnibar Workspace</span>
              </span>
              <span className="font-jetbrains text-[11px] text-[#958ea0]">PRO</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('banana-synth')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] transition-all ${
                activeSubView === 'banana-synth'
                  ? 'bg-[#292a2f] text-[#e3e1e9] font-semibold shadow-[0_1px_8px_rgba(0,0,0,0.25)]'
                  : 'text-[#cbc3d7] hover:bg-[#1e1f25] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-[#ffb95f]">
                  auto_awesome
                </span>
                <span>Banana Synth Studio</span>
              </span>
              <span className="font-jetbrains text-[11px] text-[#4cd7f6]">GEN</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('autonomous-agents')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] transition-all ${
                activeSubView === 'autonomous-agents'
                  ? 'bg-[#292a2f] text-[#e3e1e9] font-semibold shadow-[0_1px_8px_rgba(0,0,0,0.25)]'
                  : 'text-[#cbc3d7] hover:bg-[#1e1f25] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">
                  smart_toy
                </span>
                <span>Autonomous Agents &amp; Grokbots</span>
              </span>
              <span className="font-jetbrains text-[11px] text-[#4cd7f6]">AUTO</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('email-comms-hub')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] transition-all ${
                activeSubView === 'email-comms-hub'
                  ? 'bg-[#292a2f] text-[#e3e1e9] font-semibold shadow-[0_1px_8px_rgba(0,0,0,0.25)]'
                  : 'text-[#cbc3d7] hover:bg-[#1e1f25] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-[#d0bcff]">
                  mark_email_Unread
                </span>
                <span>Email &amp; Comms Hub</span>
              </span>
              <span className="font-jetbrains text-[11px] text-[#d0bcff]">DISPATCH</span>
            </button>

            {onOpenClassicStudio && (
              <button
                type="button"
                onClick={onOpenClassicStudio}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] text-[#cbc3d7] hover:bg-[#1e1f25] hover:text-[#e3e1e9] transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#958ea0]">
                    movie
                  </span>
                  <span>Multimodal Media Suite</span>
                </span>
                <span className="font-jetbrains text-[10px] text-[#958ea0]">VIDEO/MUSIC</span>
              </button>
            )}

            {onOpenClassicWorkspace && (
              <button
                type="button"
                onClick={onOpenClassicWorkspace}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] text-[#cbc3d7] hover:bg-[#1e1f25] hover:text-[#e3e1e9] transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#958ea0]">
                    cloud_sync
                  </span>
                  <span>Account &amp; Workspace Settings</span>
                </span>
                <span className="font-jetbrains text-[10px] text-[#958ea0]">IMAP/OAUTH</span>
              </button>
            )}
          </nav>

          {/* Recent Sessions */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase tracking-wider">
                RECENT SESSIONS
              </span>
              <span className="material-symbols-outlined text-[14px] text-[#958ea0]">history</span>
            </div>
            <div className="space-y-1 text-[12px]">
              {[
                { label: 'Quantum Kernel Inference', tab: 'parallel-arena' as NexusSubView },
                { label: 'Multimodal Spectral Analysis', tab: 'banana-synth' as NexusSubView },
                { label: 'Epistemic Verification DAG', tab: 'autonomous-agents' as NexusSubView },
                { label: 'Apex Series B Comms Triage', tab: 'email-comms-hub' as NexusSubView },
              ].map((sess) => (
                <button
                  key={sess.label}
                  type="button"
                  onClick={() => setActiveSubView(sess.tab)}
                  className="w-full text-left block px-3 py-1.5 rounded-lg text-[#cbc3d7] hover:bg-[#1e1f25] hover:text-[#e3e1e9] truncate transition-colors"
                >
                  {sess.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Runtime Tokens Meter */}
        <div className="p-4 bg-[#1a1b21]/80 backdrop-blur-md border-t border-white/[0.05]">
          <div className="flex items-center justify-between mb-2 font-jetbrains text-[11px]">
            <span className="text-[#cbc3d7] uppercase">ACTIVE RUNTIME TOKENS</span>
            <span className="text-[#4cd7f6] font-medium">841.2K / 1.2M</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#34343a] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#d0bcff] via-[#4cd7f6] to-[#ffb95f] w-[70%]" />
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 text-[#958ea0] font-jetbrains text-[11px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">bolt</span>
              78.4 t/s
            </span>
            <span>LATENCY: 18ms</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT COLUMN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NEXUS HEADER BAR */}
        <header className="h-16 bg-[#0d0e13]/90 backdrop-blur-2xl border-b border-white/[0.06] px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d0bcff]/30 via-[#4cd7f6]/20 to-[#ffb95f]/20 border border-[#4cd7f6]/40 flex items-center justify-center font-jetbrains font-bold text-[#4cd7f6]">
              K
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#e3e1e9] font-bold tracking-tight">Kara 3.0</span>
              <span className="text-[#958ea0] text-xs">/</span>
              <span className="text-[12px] text-[#cbc3d7] font-medium">Multi-Model Nexus</span>
            </div>
          </div>

          {/* Center Segmented Navigation Pills */}
          <nav className="flex items-center gap-1 px-1.5 py-1 rounded-full bg-[#1a1b21]/90 border border-white/[0.06] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveSubView('parallel-arena')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
                activeSubView === 'parallel-arena'
                  ? 'bg-[#292a2f] text-[#e3e1e9] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                  : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              Parallel Arena
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('omnibar-workspace')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
                activeSubView === 'omnibar-workspace'
                  ? 'bg-[#292a2f] text-[#e3e1e9] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                  : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              Omnibar Workspace
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('banana-synth')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
                activeSubView === 'banana-synth'
                  ? 'bg-[#292a2f] text-[#e3e1e9] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                  : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              Banana Synth
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('autonomous-agents')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
                activeSubView === 'autonomous-agents'
                  ? 'bg-[#292a2f] text-[#e3e1e9] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                  : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              Autonomous Agents &amp; Grokbots
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('email-comms-hub')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
                activeSubView === 'email-comms-hub'
                  ? 'bg-[#292a2f] text-[#e3e1e9] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                  : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              Email &amp; Comms Hub
            </button>
          </nav>

          {/* Right Model Status Pills */}
          <div className="hidden xl:flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#1a1b21] border border-white/[0.05] font-jetbrains text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse" />
                <span className="text-[#958ea0]">Grok-3:</span>
                <span className="text-[#4cd7f6]">Active</span>
              </div>
              <span className="text-[#494454]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f] animate-pulse" />
                <span className="text-[#958ea0]">Claude-3.7:</span>
                <span className="text-[#ffb95f]">Reasoning</span>
              </div>
              <span className="text-[#494454]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff]" />
                <span className="text-[#958ea0]">Gemini-2.0:</span>
                <span className="text-[#d0bcff]">Vision</span>
              </div>
            </div>
          </div>
        </header>

        {/* STATUS TOAST BANNER */}
        {statusToast && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-[#292a2f] border border-[#4cd7f6]/40 text-[#e3e1e9] text-xs font-jetbrains flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-ping" />
              {statusToast}
            </span>
            <button
              type="button"
              onClick={() => setStatusToast('')}
              className="text-[#958ea0] hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* ===================================================================
            SUB-VIEW 1: PARALLEL ARENA (3x MULTI-MODEL COMPARISON)
           =================================================================== */}
        {activeSubView === 'parallel-arena' && (
          <div className="p-6 space-y-6">
            {/* Top Master Omnibar & Orchestration Hub */}
            <div className="relative bg-[#1a1b21] rounded-xl p-5 shadow-lg overflow-hidden border border-white/[0.05]">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6] animate-pulse" />
                  <span className="font-jetbrains text-[11px] uppercase text-[#4cd7f6] tracking-widest">
                    ACTIVE PARALLEL ORCHESTRATION
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#292a2f] text-[#cbc3d7] font-jetbrains text-[11px]">
                    EXEC_SESSION #904-SYNTH
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-jetbrains text-[11px]">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1f25] text-[#cbc3d7]">
                    <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">
                      memory
                    </span>
                    <span>CONTEXT:</span>
                    <span className="text-[#e3e1e9] font-semibold">840.4k / 2.0M</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1f25] text-[#cbc3d7]">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                      speed
                    </span>
                    <span>TTFT:</span>
                    <span className="text-[#4cd7f6] font-semibold">340ms</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1f25] text-[#cbc3d7]">
                    <span className="material-symbols-outlined text-[16px] text-[#d0bcff]">
                      data_thresholding
                    </span>
                    <span>REASONING BUDGET:</span>
                    <span className="text-[#d0bcff] font-semibold">64,000 TOKENS</span>
                  </div>
                </div>
              </div>

              {/* Prompt Input Matrix */}
              <div className="relative bg-[#0d0e13] rounded-xl p-4 shadow-inner border border-white/[0.05]">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1 w-full flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#292a2f] text-[#d0bcff] flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[20px]">terminal</span>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase tracking-wider">
                          UNCONSTRAINED SYSTEM PROMPT
                        </span>
                        <span className="text-[#958ea0] text-xs">•</span>
                        <span className="font-jetbrains text-[11px] text-[#ffb95f]">
                          ZK-ROLLUP / STATE-SYNC / VERIFIABILITY
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingArenaPrompt((prev) => !prev)}
                          className="ml-2 text-[11px] font-jetbrains text-[#4cd7f6] hover:underline"
                        >
                          {isEditingArenaPrompt ? 'Done Editing' : 'Edit Prompt'}
                        </button>
                      </div>
                      {isEditingArenaPrompt ? (
                        <input
                          type="text"
                          value={arenaPrompt}
                          onChange={(e) => setArenaPrompt(e.target.value)}
                          className="w-full bg-[#1a1b21] border border-[#d0bcff]/40 rounded-lg px-3 py-2 text-[#e3e1e9] text-sm focus:outline-none"
                        />
                      ) : (
                        <p
                          onClick={() => setIsEditingArenaPrompt(true)}
                          className="text-[18px] text-[#e3e1e9] font-semibold tracking-tight cursor-pointer hover:text-[#d0bcff] transition-colors"
                        >
                          {arenaPrompt}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e1f25] font-jetbrains text-[11px] text-[#cbc3d7]">
                      <span>T:0.6</span>
                      <span className="text-[#494454]">|</span>
                      <span>P:0.95</span>
                      <span className="text-[#494454]">|</span>
                      <span className="text-[#ffb95f]">k:64k</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleBroadcastArena}
                      disabled={isBroadcastingArena}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d0bcff] text-[#3c0091] text-[12px] font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isBroadcastingArena ? 'animate-spin' : ''
                        }`}
                      >
                        {isBroadcastingArena ? 'refresh' : 'cell_tower'}
                      </span>
                      <span>{isBroadcastingArena ? 'BROADCASTING...' : 'BROADCAST TO ALL'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparative Arena Grid: 3 Equal Engines */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* COLUMN 1: Claude 3.7 Sonnet */}
              <div className="flex flex-col bg-[#1a1b21] rounded-xl overflow-hidden shadow-lg border border-white/[0.05]">
                <div className="p-4 bg-[#1e1f25] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ca8100]/30 flex items-center justify-center text-[#ffb95f]">
                      <span className="material-symbols-outlined text-[20px]">psychology</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[18px] font-bold text-[#e3e1e9]">
                          Claude 3.7 Sonnet
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#ffb95f]/15 text-[#ffb95f] font-jetbrains text-[10px] font-bold">
                          HYBRID THINK
                        </span>
                      </div>
                      <span className="font-jetbrains text-[11px] text-[#958ea0]">
                        LATENCY: 412ms • 88.4 t/s • ANTHROPIC
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Expandable Reasoning Scratchpad */}
                    <div className="rounded-xl bg-[#0d0e13] p-3.5 space-y-2 border border-white/[0.04]">
                      <div
                        onClick={() => setClaudeReasoningExpanded((prev) => !prev)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#ffb95f] animate-pulse" />
                          <span className="font-jetbrains text-[11px] text-[#ffb95f] font-semibold uppercase">
                            Thinking Process
                          </span>
                          <span className="font-jetbrains text-[11px] text-[#958ea0]">
                            (8,412 tokens consumed)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-jetbrains text-[11px] text-[#958ea0]">4.2s</span>
                          <span className="material-symbols-outlined text-[16px] text-[#958ea0]">
                            unfold_more
                          </span>
                        </div>
                      </div>
                      {claudeReasoningExpanded && (
                        <div className="relative pt-2 pl-4 text-[#cbc3d7] font-jetbrains text-[12px] space-y-2.5">
                          <div
                            className="kara-synapse-axon-track absolute left-1.5 top-2.5 bottom-2 w-0.5 bg-gradient-to-b from-[#ffb95f]/80 via-[#4cd7f6]/50 to-[#d0bcff]/60 rounded-full"
                            aria-hidden="true"
                          >
                            <span className="kara-synapse-axon-spark" />
                          </div>
                          {arenaData.claude.thinkingSteps.map((step, idx) => (
                            <div
                              key={idx}
                              className={`kara-thought-step--${Math.min(idx, 5)} relative pl-4 flex items-start gap-2`}
                            >
                              <span
                                className="kara-synapse-node--firing absolute -left-[0.15rem] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0d0e13] border border-[#ffb95f] shadow-[0_0_8px_#ffb95f]"
                                aria-hidden="true"
                              />
                              <span
                                className="kara-synapse-dendrite absolute left-2 top-[0.62rem] w-1.5 h-[1.5px] bg-gradient-to-r from-[#ffb95f] to-[#4cd7f6] rounded-full"
                                aria-hidden="true"
                              />
                              <p className="leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Prose Formulation */}
                    <div className="space-y-2">
                      <span className="font-jetbrains text-[11px] uppercase text-[#958ea0] tracking-wider">
                        SYNTHETIC ANALYSIS
                      </span>
                      <p className="font-literata text-[15px] text-[#e3e1e9] leading-relaxed">
                        {arenaData.claude.analysis}
                      </p>
                    </div>

                    {/* Interactive Artifact */}
                    <div className="rounded-xl bg-[#34343a]/70 p-3.5 shadow-md space-y-3 border border-white/[0.05]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[#ffb95f]">
                            code_blocks
                          </span>
                          <span className="text-[12px] text-[#e3e1e9] font-bold">
                            ARTIFACT: {arenaData.claude.artifactTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#1e1f25] font-jetbrains text-[10px] text-[#4cd7f6]">
                            RUST 2024
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(arenaData.claude.artifactCode);
                              showToast('Copied Rust artifact to clipboard!');
                            }}
                            className="p-1 rounded bg-[#1e1f25] text-[#cbc3d7] hover:text-white"
                            title="Copy Code"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              content_copy
                            </span>
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 rounded-lg bg-[#0d0e13] font-jetbrains text-[12px] text-[#cbc3d7] overflow-x-auto leading-relaxed">
                        {arenaData.claude.artifactCode}
                      </pre>
                    </div>

                    {/* Dynamic Bench Metrics Card */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-[#1e1f25] font-jetbrains text-[11px] space-y-1">
                        <span className="text-[#958ea0] uppercase">PROVER TIME</span>
                        <p className="text-[18px] text-[#ffb95f] font-bold">
                          {arenaData.claude.proverTime}
                        </p>
                        <span className="text-[#958ea0]">KZG multi-commit</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#1e1f25] font-jetbrains text-[11px] space-y-1">
                        <span className="text-[#958ea0] uppercase">HEALING CONVERGENCE</span>
                        <p className="text-[18px] text-[#e3e1e9] font-bold">
                          {arenaData.claude.healingConvergence}
                        </p>
                        <span className="text-[#958ea0]">O(log N) Byzantine delta</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between font-jetbrains text-[11px] text-[#cbc3d7]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">
                        verified_user
                      </span>
                      VERIFICATION: FORMAL
                    </span>
                    <button
                      type="button"
                      onClick={() => showToast('Formal Plonky3 Verification Tree: 0 constraint violations.')}
                      className="px-3 py-1.5 rounded-lg bg-[#292a2f] text-[#e3e1e9] hover:bg-[#34343a] transition-colors text-[12px] font-semibold"
                    >
                      Inspect Tree
                    </button>
                  </div>
                </div>
              </div>

              {/* COLUMN 2: Gemini 2.0 Pro */}
              <div className="flex flex-col bg-[#1a1b21] rounded-xl overflow-hidden shadow-lg border border-white/[0.05]">
                <div className="p-4 bg-[#1e1f25] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#03b5d3]/30 flex items-center justify-center text-[#4cd7f6]">
                      <span className="material-symbols-outlined text-[20px]">hub</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[18px] font-bold text-[#e3e1e9]">Gemini 2.0 Pro</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#4cd7f6]/15 text-[#4cd7f6] font-jetbrains text-[10px] font-bold">
                          MULTIMODAL DEEP
                        </span>
                      </div>
                      <span className="font-jetbrains text-[11px] text-[#958ea0]">
                        LATENCY: 288ms • 142.1 t/s • GOOGLE DEEPMIND
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Grounding Citations Chips */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase tracking-wider">
                        WEB CITATIONS:
                      </span>
                      {arenaData.gemini.citations.map((cit) => (
                        <span
                          key={cit}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#292a2f] font-jetbrains text-[11px] text-[#4cd7f6]"
                        >
                          <span className="material-symbols-outlined text-[14px]">link</span>
                          <span>{cit}</span>
                        </span>
                      ))}
                    </div>

                    {/* Dynamic SVG Topology Map */}
                    <div className="rounded-xl bg-[#0d0e13] p-3 space-y-2 border border-white/[0.04]">
                      <div className="flex items-center justify-between font-jetbrains text-[11px]">
                        <span className="text-[#4cd7f6] uppercase font-semibold">
                          SYNTHESIZED TOPOLOGY VECTOR
                        </span>
                        <span className="text-[#958ea0]">INTERACTIVE SVG</span>
                      </div>
                      <div className="w-full h-40 bg-[#1a1b21] rounded-lg p-2 flex items-center justify-center relative overflow-hidden">
                        <svg className="w-full h-full text-[#e3e1e9]" viewBox="0 0 360 140">
                          <path
                            d="M 60 70 L 140 35 L 220 35 L 300 70"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray="4 4"
                            strokeOpacity="0.2"
                            strokeWidth="2"
                          />
                          <path
                            d="M 60 70 L 140 105 L 220 105 L 300 70"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray="4 4"
                            strokeOpacity="0.2"
                            strokeWidth="2"
                          />
                          <path
                            d="M 140 35 L 220 105"
                            fill="none"
                            stroke="currentColor"
                            strokeOpacity="0.3"
                            strokeWidth="2"
                          />
                          <path
                            d="M 140 105 L 220 35"
                            fill="none"
                            stroke="currentColor"
                            strokeOpacity="0.3"
                            strokeWidth="2"
                          />
                          <circle cx="140" cy="35" fill="#4cd7f6" r="4" />
                          <circle cx="220" cy="105" fill="#d0bcff" r="4" />
                          <rect fill="#1e1f25" height="36" rx="6" width="80" x="20" y="52" />
                          <text
                            dominantBaseline="middle"
                            fill="#4cd7f6"
                            fontFamily="JetBrains Mono"
                            fontSize="10"
                            textAnchor="middle"
                            x="60"
                            y="70"
                          >
                            Ingest &amp; MMR
                          </text>
                          <rect fill="#1e1f25" height="36" rx="6" width="90" x="110" y="17" />
                          <text
                            dominantBaseline="middle"
                            fill="#ffb95f"
                            fontFamily="JetBrains Mono"
                            fontSize="10"
                            textAnchor="middle"
                            x="155"
                            y="35"
                          >
                            Halo2 Prover
                          </text>
                          <rect fill="#1e1f25" height="36" rx="6" width="105" x="100" y="87" />
                          <text
                            dominantBaseline="middle"
                            fill="#acedff"
                            fontFamily="JetBrains Mono"
                            fontSize="10"
                            textAnchor="middle"
                            x="152.5"
                            y="105"
                          >
                            Heal Vector Ring
                          </text>
                          <rect fill="#1e1f25" height="36" rx="6" width="95" x="235" y="17" />
                          <text
                            dominantBaseline="middle"
                            fill="#d0bcff"
                            fontFamily="JetBrains Mono"
                            fontSize="10"
                            textAnchor="middle"
                            x="282.5"
                            y="35"
                          >
                            DAG Consensus
                          </text>
                          <rect fill="#1e1f25" height="36" rx="6" width="95" x="235" y="87" />
                          <text
                            dominantBaseline="middle"
                            fill="#4cd7f6"
                            fontFamily="JetBrains Mono"
                            fontSize="10"
                            textAnchor="middle"
                            x="282.5"
                            y="105"
                          >
                            SNARK Root Log
                          </text>
                        </svg>
                      </div>
                    </div>

                    {/* Grounded Multimodal Formulation */}
                    <div className="space-y-2">
                      <span className="font-jetbrains text-[11px] uppercase text-[#958ea0] tracking-wider">
                        DEEP MULTIMODAL SYNTHESIS
                      </span>
                      <p className="font-literata text-[15px] text-[#e3e1e9] leading-relaxed">
                        {arenaData.gemini.analysis}
                      </p>
                    </div>

                    {/* Hardware Acceleration Spec */}
                    <div className="relative rounded-xl overflow-hidden bg-[#292a2f] flex items-center justify-between p-4 border border-white/[0.05]">
                      <div className="space-y-1 pr-3">
                        <span className="px-2 py-0.5 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] font-jetbrains text-[10px] font-bold">
                          HARDWARE ACCELERATION SPEC
                        </span>
                        <h4 className="text-[16px] font-bold text-[#e3e1e9]">
                          {arenaData.gemini.specTitle}
                        </h4>
                        <p className="text-[12px] text-[#cbc3d7]">
                          {arenaData.gemini.specSubtitle}
                        </p>
                      </div>
                      <div className="w-16 h-16 rounded-lg bg-[#0d0e13] border border-[#4cd7f6]/30 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#4cd7f6] text-[28px]">
                          developer_board
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between font-jetbrains text-[11px] text-[#cbc3d7]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                        public
                      </span>
                      GROUNDING: SEARCH + ARXIV
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSubView('banana-synth')}
                      className="px-3 py-1.5 rounded-lg bg-[#292a2f] text-[#e3e1e9] hover:bg-[#34343a] transition-colors text-[12px] font-semibold"
                    >
                      Expand Canvas
                    </button>
                  </div>
                </div>
              </div>

              {/* COLUMN 3: Grok 3 */}
              <div className="flex flex-col bg-[#1a1b21] rounded-xl overflow-hidden shadow-lg border border-white/[0.05]">
                <div className="p-4 bg-[#1e1f25] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#34343a] flex items-center justify-center text-[#e3e1e9]">
                      <span className="material-symbols-outlined text-[20px]">bolt</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[18px] font-bold text-[#e3e1e9]">Grok 3</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#38393f] text-[#e3e1e9] font-jetbrains text-[10px] font-bold">
                          RAW TELEMETRY
                        </span>
                      </div>
                      <span className="font-jetbrains text-[11px] text-[#958ea0]">
                        LATENCY: 195ms • 114.6 t/s • xAI
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGrokFunMode((prev) => !prev)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#292a2f] font-jetbrains text-[11px] transition-colors ${
                      grokFunMode ? 'text-[#4cd7f6]' : 'text-[#ffb95f]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">psychiatry</span>
                    <span>{grokFunMode ? 'FUN MODE: ON' : 'FUN MODE: RAW'}</span>
                  </button>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Live X/Web Stream Sensors */}
                    <div className="rounded-xl bg-[#0d0e13] p-3 space-y-2 border border-white/[0.04]">
                      <div className="flex items-center justify-between font-jetbrains text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
                          <span className="text-[#4cd7f6] font-semibold uppercase">
                            LIVE X/WEB STREAM SENSORS
                          </span>
                        </div>
                        <span className="text-[#958ea0]">REAL-TIME INFERENCE</span>
                      </div>
                      <div className="space-y-1.5 font-jetbrains text-[11px] text-[#cbc3d7]">
                        {arenaData.grok.streamPulse.map((pulse, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-1.5 rounded bg-[#1e1f25]"
                          >
                            <span className="truncate pr-2">{pulse}</span>
                            <span className="text-[#4cd7f6] flex-shrink-0">
                              {idx === 0 ? '3m ago' : 'Ingested'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hard-Core Systems Critique */}
                    <div className="space-y-2">
                      <span className="font-jetbrains text-[11px] uppercase text-[#958ea0] tracking-wider">
                        HARD-CORE SYSTEMS CRITIQUE
                      </span>
                      <p className="font-literata text-[15px] text-[#e3e1e9] leading-relaxed">
                        {arenaData.grok.critique}
                      </p>
                    </div>

                    {/* Raw Execution Stream */}
                    <div className="rounded-xl bg-[#0d0e13] p-3 font-jetbrains text-[12px] text-[#cbc3d7] space-y-1.5 shadow-inner border border-white/[0.04]">
                      <div className="flex items-center justify-between pb-1 text-[#958ea0] text-[11px]">
                        <span>RAW EXECUTION STREAM</span>
                        <span className="text-[#4cd7f6]">STREAMING LIVE</span>
                      </div>
                      {arenaData.grok.terminalLogs.map((line, idx) => (
                        <p
                          key={idx}
                          className={
                            idx === 0
                              ? 'text-[#4cd7f6]'
                              : idx === 2
                              ? 'text-[#ffb95f]'
                              : idx === 4
                              ? 'text-[#d0bcff]'
                              : 'text-[#e3e1e9]'
                          }
                        >
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Colossus Supercomputer Node */}
                    <div className="relative rounded-xl overflow-hidden bg-[#292a2f] flex items-center justify-between p-4 border border-white/[0.05]">
                      <div className="space-y-1 pr-3">
                        <span className="px-2 py-0.5 rounded bg-[#38393f] text-[#e3e1e9] font-jetbrains text-[10px] font-bold">
                          XAI TELEMETRY CLUSTER
                        </span>
                        <h4 className="text-[16px] font-bold text-[#e3e1e9]">
                          Colossus Supercomputer Node
                        </h4>
                        <p className="text-[12px] text-[#cbc3d7]">
                          100k H100 GPU cluster raw throughput profile.
                        </p>
                      </div>
                      <div className="w-16 h-16 rounded-lg bg-[#0d0e13] border border-[#ffb95f]/30 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#ffb95f] text-[28px]">
                          dns
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between font-jetbrains text-[11px] text-[#cbc3d7]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#e3e1e9]">
                        code
                      </span>
                      CLI MODE: RAW SOCKET
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSubView('autonomous-agents')}
                      className="px-3 py-1.5 rounded-lg bg-[#292a2f] text-[#e3e1e9] hover:bg-[#34343a] transition-colors text-[12px] font-semibold"
                    >
                      Open Telemetry Shell
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Unified Synthesis Result Drawer (if merged) */}
            {unifiedSynthesisText && (
              <div className="bg-[#1e1f25] border border-[#d0bcff]/40 rounded-xl p-5 space-y-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-xs text-[#d0bcff] font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    UNIFIED MULTI-MODEL PRODUCTION ARTIFACT (C:{blendWeights.claude}% • G:
                    {blendWeights.gemini}% • X:{blendWeights.grok}%)
                  </span>
                  <button
                    type="button"
                    onClick={() => setUnifiedSynthesisText(null)}
                    className="text-xs text-[#958ea0] hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <p className="font-literata text-[15px] text-[#e3e1e9] whitespace-pre-line leading-relaxed">
                  {unifiedSynthesisText}
                </p>
              </div>
            )}

            {/* Comparative Matrix & Unified Synthesis Bar */}
            <div className="bg-[#1a1b21] rounded-xl p-5 shadow-xl space-y-4 border border-white/[0.05]">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#a078ff]/20 flex items-center justify-center text-[#d0bcff]">
                    <span className="material-symbols-outlined text-[20px]">join_inner</span>
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-[#e3e1e9]">
                      Comparative Model Matrix &amp; Synthesis Engine
                    </h3>
                    <p className="text-[12px] text-[#cbc3d7]">
                      Harmonize verified formal architecture, grounded live literature, and
                      unconstrained telemetry into one production blueprint.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap font-jetbrains text-[11px]">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1f25]">
                    <span className="w-2 h-2 rounded-full bg-[#ffb95f]" />
                    <span className="text-[#958ea0]">Claude 3.7:</span>
                    <span className="text-[#ffb95f] font-bold">88 t/s • 99.4% Verif</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1f25]">
                    <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
                    <span className="text-[#958ea0]">Gemini 2.0:</span>
                    <span className="text-[#4cd7f6] font-bold">142 t/s • 100% Grounded</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1f25]">
                    <span className="w-2 h-2 rounded-full bg-[#e3e1e9]" />
                    <span className="text-[#958ea0]">Grok 3:</span>
                    <span className="text-[#e3e1e9] font-bold">114 t/s • Low Latency</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-3 bg-[#0d0e13] p-4 rounded-xl">
                <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleMergeBestElements}
                    disabled={isMergingSynthesis}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d0bcff] text-[#3c0091] text-[12px] font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    <span>
                      {isMergingSynthesis
                        ? 'SYNTHESIZING UNIFIED ARTIFACT...'
                        : 'MERGE BEST ELEMENTS INTO UNIFIED ARTIFACT'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        'Diff Reasoning Paths: Claude favors Verkle KZG O(log N); Grok favors STARK gossip.'
                      )
                    }
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1e1f25] text-[#e3e1e9] text-[12px] font-semibold hover:bg-[#292a2f] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">difference</span>
                    <span>Diff Reasoning Paths</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Exported Merged DAG JSON to workspace buffer.')}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1e1f25] text-[#e3e1e9] text-[12px] font-semibold hover:bg-[#292a2f] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">account_tree</span>
                    <span>Export Merged DAG</span>
                  </button>
                </div>
                <div className="flex items-center gap-4 font-jetbrains text-[11px] text-[#958ea0]">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                      tune
                    </span>
                    BLEND WEIGHTS: C:{blendWeights.claude}% • G:{blendWeights.gemini}% • X:
                    {blendWeights.grok}%
                  </span>
                  <span className="text-[#494454]">|</span>
                  <span className="text-[#4cd7f6] font-semibold">SYNTHESIS READY</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SUB-VIEW 2: BANANA SYNTH & MULTIMODAL LATENT STUDIO
           =================================================================== */}
        {activeSubView === 'banana-synth' && (
          <div className="p-6 space-y-6">
            {/* Top Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#03b5d3]/20 text-[#4cd7f6] font-jetbrains text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-ping" />
                    SYNTH ENGINE // LATENT BANANA MATRIX v4.2
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#292a2f] text-[#d0bcff] font-jetbrains text-[11px]">
                    UNRESTRICTED GENERATIVE WEIGHTS
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1a1b21] text-[#ffb95f] font-jetbrains text-[11px]">
                    A100-SXM4-80GB
                  </span>
                </div>
                <h1 className="font-literata text-[32px] font-medium text-[#e3e1e9] tracking-tight">
                  Banana Synth &amp; Multimodal Latent Studio
                </h1>
                <p className="text-[14px] text-[#cbc3d7] max-w-2xl">
                  Concurrent multi-model diffusion synthesis fusing Claude 3.7 spatial composition,
                  Grok raw kinetic styling, and Gemini 2.0 photonic tensor grounding.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadExportBuffer('PNG 4K')}
                  className="px-4 py-2.5 rounded-xl bg-[#1a1b21] hover:bg-[#292a2f] text-[#cbc3d7] hover:text-white font-semibold text-[12px] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Export 4K Bundle</span>
                </button>
                <button
                  type="button"
                  onClick={handleRerollSeed}
                  className="px-4 py-2.5 rounded-xl bg-[#292a2f] hover:bg-[#34343a] text-[#e3e1e9] font-semibold text-[12px] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                    alt_route
                  </span>
                  <span>Batch Latent Warp</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateBananaVariation}
                  disabled={isSynthesizingBanana}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d0bcff] via-[#a078ff] to-[#4cd7f6] text-[#3c0091] font-bold text-[12px] shadow-[0_8px_32px_-4px_rgba(139,92,246,0.35)] hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isSynthesizingBanana ? 'animate-spin' : ''
                    }`}
                  >
                    auto_awesome
                  </span>
                  <span>
                    {isSynthesizingBanana ? 'Synthesizing 1024×1024...' : 'Generate Variations'}
                  </span>
                </button>
              </div>
            </div>

            {/* 5 Telemetry Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-[#1a1b21] flex flex-col justify-between space-y-2 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    DIFFUSION MESH CORE
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                    blur_on
                  </span>
                </div>
                <div className="text-[16px] text-[#e3e1e9] font-bold truncate">
                  Gemini 2.0 + Grok-3 Pri...
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
                  <span className="font-jetbrains text-[11px] text-[#4cd7f6]">
                    100% Concurrent Flow
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1b21] flex flex-col justify-between space-y-2 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    VRAM ALLOCATION
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">
                    memory
                  </span>
                </div>
                <div className="text-[16px] text-[#e3e1e9] font-bold">24.1 GB / 48.0 GB Active</div>
                <div className="w-full h-1.5 rounded-full bg-[#34343a] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] w-[50%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1b21] flex flex-col justify-between space-y-2 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    LATENT PRIME SEED
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#d0bcff]">tag</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[12px] text-[#d0bcff] font-bold">
                    {primeSeed}
                  </span>
                  <button
                    type="button"
                    onClick={handleRerollSeed}
                    className="text-[#958ea0] hover:text-white transition-colors"
                    title="Reroll Seed"
                  >
                    <span className="material-symbols-outlined text-[14px]">shuffle</span>
                  </button>
                </div>
                <span className="font-jetbrains text-[11px] text-[#958ea0]">
                  Sub-seed: {subSeed} (Noise: 0.08)
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1b21] flex flex-col justify-between space-y-2 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    RESOLUTION &amp; TENSOR
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                    aspect_ratio
                  </span>
                </div>
                <div className="text-[16px] text-[#e3e1e9] font-bold">1024 × 1024 [1:1] Octane</div>
                <span className="font-jetbrains text-[11px] text-[#cbc3d7]">
                  FP16 Tensor Precision
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1b21] flex flex-col justify-between space-y-2 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    SYNTHESIS LATENCY
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">
                    speed
                  </span>
                </div>
                <div className="text-[16px] text-[#ffb95f] font-bold">1.42s / Iteration</div>
                <span className="font-jetbrains text-[11px] text-[#cbc3d7]">
                  50 Denoising Steps @ DDIM
                </span>
              </div>
            </div>

            {/* Main Tri-Pane Workbench Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN (4 Cols): Multi-Model Steering & Morphology Sliders */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-5 rounded-xl bg-[#1a1b21] space-y-4 border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#d0bcff]" />
                      <h2 className="text-[13px] font-bold text-[#e3e1e9] uppercase tracking-wider">
                        Multi-Model Steering Matrix
                      </h2>
                    </div>
                    <span className="font-jetbrains text-[11px] text-[#958ea0]">
                      CONCURRENT TRI-PROMPT
                    </span>
                  </div>

                  {/* Claude Spatial Prompt */}
                  <div className="p-3.5 rounded-xl bg-[#0d0e13] space-y-2 border border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="font-jetbrains text-[11px] text-[#ffb95f] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f]" />
                        CLAUDE 3.7 • SPATIAL GEOMETRY
                      </span>
                      <span className="font-jetbrains text-[11px] text-[#958ea0]">
                        Weight: 1.15
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={claudeSpatialPrompt}
                      onChange={(e) => setClaudeSpatialPrompt(e.target.value)}
                      className="w-full bg-transparent font-literata text-[13px] text-[#e3e1e9] focus:outline-none resize-none"
                    />
                  </div>

                  {/* Grok Style Vector */}
                  <div className="p-3.5 rounded-xl bg-[#0d0e13] space-y-2 border border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="font-jetbrains text-[11px] text-[#4cd7f6] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" />
                        GROK • UNHINGED STYLE VECTOR
                      </span>
                      <span className="font-jetbrains text-[11px] text-[#4cd7f6]">Chaos: 88%</span>
                    </div>
                    <textarea
                      rows={2}
                      value={grokStylePrompt}
                      onChange={(e) => setGrokStylePrompt(e.target.value)}
                      className="w-full bg-transparent font-literata text-[13px] text-[#e3e1e9] focus:outline-none resize-none"
                    />
                  </div>

                  {/* Gemini Optics */}
                  <div className="p-3.5 rounded-xl bg-[#0d0e13] space-y-2 border border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="font-jetbrains text-[11px] text-[#d0bcff] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff]" />
                        GEMINI 2.0 • OPTICS &amp; GROUNDING
                      </span>
                      <span className="font-jetbrains text-[11px] text-[#958ea0]">
                        Photonic Raytracing
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={geminiOpticsPrompt}
                      onChange={(e) => setGeminiOpticsPrompt(e.target.value)}
                      className="w-full bg-transparent font-literata text-[13px] text-[#e3e1e9] focus:outline-none resize-none"
                    />
                  </div>

                  {/* Negative Embedding Weights */}
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                        NEGATIVE EMBEDDING WEIGHTS
                      </span>
                      <span className="font-jetbrains text-[11px] text-[#ffb4ab]">EXCLUDED</span>
                    </div>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[#0d0e13] font-jetbrains text-[11px] text-[#958ea0] focus:outline-none border border-white/[0.04]"
                    />
                  </div>
                </div>

                {/* Latent Morphology Sliders */}
                <div className="p-5 rounded-xl bg-[#1a1b21] space-y-4 border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-bold text-[#e3e1e9] uppercase tracking-wider">
                      Latent Morphology Sliders
                    </h2>
                    <span className="material-symbols-outlined text-[16px] text-[#958ea0]">
                      tune
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#cbc3d7]">Ripeness Index</span>
                        <span className="font-jetbrains text-[#ffb95f]">
                          Radioactive Gold ({ripenessIndex}%)
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={ripenessIndex}
                        onChange={(e) => setRipenessIndex(Number(e.target.value))}
                        className="w-full accent-[#ffb95f] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#cbc3d7]">Peeling Kinetic Arc</span>
                        <span className="font-jetbrains text-[#4cd7f6]">{peelingArc}% Bloom</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={peelingArc}
                        onChange={(e) => setPeelingArc(Number(e.target.value))}
                        className="w-full accent-[#4cd7f6] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#cbc3d7]">Cybernetic Infusion Factor</span>
                        <span className="font-jetbrains text-[#d0bcff]">
                          {cyberInfusion}% Heavy Chassis
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={cyberInfusion}
                        onChange={(e) => setCyberInfusion(Number(e.target.value))}
                        className="w-full accent-[#d0bcff] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#cbc3d7]">Bioluminescence Radiance</span>
                        <span className="font-jetbrains text-[#4cd7f6]">
                          {bioluminescenceLux.toLocaleString()} Lux
                        </span>
                      </div>
                      <input
                        type="range"
                        min={200}
                        max={2400}
                        step={20}
                        value={bioluminescenceLux}
                        onChange={(e) => setBioluminescenceLux(Number(e.target.value))}
                        className="w-full accent-[#4cd7f6] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Preset Anchors */}
                  <div className="pt-2 space-y-2">
                    <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                      LATENT PRESET ANCHORS
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Cyberpunk Octane',
                        'Solana Glitch',
                        'Quantum Glass',
                        'Hyper-Surrealism',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleApplyBananaPreset(preset)}
                          className={`px-2.5 py-1 rounded-full font-jetbrains text-[11px] transition-colors ${
                            activePresetAnchor === preset
                              ? 'bg-[#292a2f] text-[#d0bcff] border border-[#d0bcff]/40'
                              : 'bg-[#1e1f25] text-[#cbc3d7] hover:text-white'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN (5 Cols): Hero Canvas & 4-Variant Strip */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-xl bg-[#0d0e13] p-4 space-y-4 shadow-2xl relative overflow-hidden border border-white/[0.06]">
                  {/* Canvas Header */}
                  <div className="flex items-center justify-between z-10 relative">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#1e1f25] font-jetbrains text-[11px] text-[#e3e1e9] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#d0bcff]">
                          view_in_ar
                        </span>
                        UV: 1024x1024
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#1e1f25] font-jetbrains text-[11px] text-[#4cd7f6]">
                        RGBA 32F
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowWireframeHud((prev) => !prev)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          showWireframeHud
                            ? 'bg-[#292a2f] text-[#4cd7f6]'
                            : 'bg-[#1e1f25] text-[#cbc3d7]'
                        }`}
                        title="Toggle UV Wireframe HUD"
                      >
                        <span className="material-symbols-outlined text-[16px]">grid_on</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCanvasZoom((z) => (z === 1 ? 1.25 : 1))}
                        className="p-1.5 rounded-lg bg-[#1e1f25] hover:bg-[#292a2f] text-[#cbc3d7] hover:text-white transition-colors"
                        title="Toggle Zoom"
                      >
                        <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Canvas Viewport */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#121318] flex items-center justify-center group">
                    <img
                      src={activeBananaVariant.imageUrl}
                      alt={activeBananaVariant.title}
                      style={{ transform: `scale(${canvasZoom})` }}
                      className="w-full h-full object-cover transition-transform duration-500"
                    />

                    {/* HUD Overlay */}
                    {showWireframeHud && (
                      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="p-2.5 rounded-lg bg-[#0d0e13]/80 backdrop-blur-md font-jetbrains text-[11px] space-y-1 border border-white/[0.08]">
                            <div className="text-[#4cd7f6]">{activeBananaVariant.nodeLabel}</div>
                            <div className="text-[#958ea0]">
                              TENSOR CONF: {activeBananaVariant.tensorConf}
                            </div>
                            <div className="text-[#d0bcff]">
                              SPECULAR RAY: {activeBananaVariant.specularRay}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end items-end">
                          <div className="p-2.5 rounded-lg bg-[#0d0e13]/80 backdrop-blur-md font-jetbrains text-[11px] space-y-1 text-right border border-white/[0.08]">
                            <div className="text-[#ffb95f]">
                              VOLUMETRIC FOG: {layerVisibility.L3 ? 'ACTIVE' : 'MUTED'}
                            </div>
                            <div className="text-[#958ea0]">SUBSURFACE: 120nm λ</div>
                            <div className="text-[#4cd7f6]">CAUSTIC MESH: VERIFIED</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Floating Canvas Tool Dock */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-2xl bg-[#0d0e13]/90 backdrop-blur-xl flex items-center gap-2 shadow-2xl border border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => setCanvasZoom((z) => (z === 1 ? 1.2 : 1))}
                        className="p-1.5 rounded-lg hover:bg-[#292a2f] text-[#cbc3d7] hover:text-white transition-colors"
                        title="Zoom Canvas"
                      >
                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateBananaVariation}
                        className="p-1.5 rounded-lg hover:bg-[#292a2f] text-[#4cd7f6] transition-colors"
                        title="Synthesize New Pass"
                      >
                        <span className="material-symbols-outlined text-[18px]">brush</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowWireframeHud((prev) => !prev)}
                        className="p-1.5 rounded-lg hover:bg-[#292a2f] text-[#cbc3d7] hover:text-white transition-colors"
                        title="Toggle HUD Split"
                      >
                        <span className="material-symbols-outlined text-[18px]">compare</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRerollSeed}
                        className="p-1.5 rounded-lg hover:bg-[#292a2f] text-[#d0bcff] transition-colors"
                        title="Reroll Seed"
                      >
                        <span className="material-symbols-outlined text-[18px]">autorenew</span>
                      </button>
                    </div>
                  </div>

                  {/* Render Engine Footer */}
                  <div className="flex items-center justify-between px-1 font-jetbrains text-[11px]">
                    <div className="flex items-center gap-2 text-[#cbc3d7]">
                      <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">
                        check_circle
                      </span>
                      <span>RENDER ENGINE: OCTANE-RTX KERNEL v9</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#958ea0]">
                      <span>LATENT COORD: [0.84, -0.12, 1.49]</span>
                      <span className="text-[#ffb95f]">GAMMA: 2.2</span>
                    </div>
                  </div>
                </div>

                {/* Tri-Model Execution Comparison 4-Variant Strip */}
                <div className="p-5 rounded-xl bg-[#1a1b21] space-y-4 border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-bold text-[#e3e1e9] uppercase tracking-wider">
                      Tri-Model Execution Comparison
                    </h2>
                    <span className="font-jetbrains text-[11px] text-[#4cd7f6]">
                      SIMULTANEOUS RUNS
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {bananaVariants.map((variant) => {
                      const isSelected = variant.id === selectedVariantId;
                      return (
                        <div
                          key={variant.id}
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`group relative rounded-xl overflow-hidden bg-[#0d0e13] p-1.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'ring-2 ring-[#d0bcff]'
                              : 'hover:bg-[#292a2f] opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden mb-2 relative">
                            <img
                              src={variant.imageUrl}
                              alt={variant.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span
                              className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded font-jetbrains text-[9px] font-bold ${variant.badgeColor}`}
                            >
                              {variant.badge}
                            </span>
                          </div>
                          <div className="px-1">
                            <div className="text-[12px] font-semibold text-[#e3e1e9] truncate">
                              {variant.title}
                            </div>
                            <div className={`font-jetbrains text-[10px] ${variant.subtitleColor}`}>
                              {variant.subtitle}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (3 Cols): Consensus Index, Latent Deconstruction, DAG & Exports */}
              <div className="lg:col-span-3 space-y-6">
                {/* Tri-Model Consensus Index */}
                <div className="p-5 rounded-xl bg-[#1a1b21] space-y-4 border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-bold text-[#e3e1e9] uppercase tracking-wider">
                      Tri-Model Consensus Index
                    </h2>
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                      hub
                    </span>
                  </div>
                  <div className="space-y-3 font-jetbrains text-[11px]">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#cbc3d7]">Grok-3 Style Punch</span>
                        <span className="text-[#4cd7f6]">98.0%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#34343a] overflow-hidden">
                        <div className="h-full bg-[#4cd7f6] w-[98%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#cbc3d7]">Gemini Photonic Truth</span>
                        <span className="text-[#d0bcff]">99.4%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#34343a] overflow-hidden">
                        <div className="h-full bg-[#d0bcff] w-[99.4%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#cbc3d7]">Claude Structural Topology</span>
                        <span className="text-[#ffb95f]">97.2%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#34343a] overflow-hidden">
                        <div className="h-full bg-[#ffb95f] w-[97.2%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Latent Deconstruction 4 Layers */}
                <div className="p-5 rounded-xl bg-[#1a1b21] space-y-4 border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-bold text-[#e3e1e9] uppercase tracking-wider">
                      Latent Deconstruction
                    </h2>
                    <span className="font-jetbrains text-[11px] text-[#958ea0]">4 LAYERS</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        key: 'L0',
                        title: 'L0: Subsurface Fruit Core',
                        sub: 'Translucent Bioluminescence',
                        pct: '100%',
                        color: 'text-[#4cd7f6]',
                      },
                      {
                        key: 'L1',
                        title: 'L1: Exoskeleton Peel & Circuits',
                        sub: 'Distressed Titanium Matrix',
                        pct: '92%',
                        color: 'text-[#4cd7f6]',
                      },
                      {
                        key: 'L2',
                        title: 'L2: Quantum Corona Particles',
                        sub: 'Plasma Arc Discharge Mesh',
                        pct: '78%',
                        color: 'text-[#4cd7f6]',
                      },
                      {
                        key: 'L3',
                        title: 'L3: Pedestal & Volumetric Fog',
                        sub: 'Heavy Mechanical Chamber Base',
                        pct: '85%',
                        color: 'text-[#4cd7f6]',
                      },
                    ].map((layer) => {
                      const isVis = layerVisibility[layer.key];
                      return (
                        <div
                          key={layer.key}
                          onClick={() =>
                            setLayerVisibility((prev) => ({
                              ...prev,
                              [layer.key]: !prev[layer.key],
                            }))
                          }
                          className={`p-3 rounded-xl bg-[#0d0e13] flex items-center justify-between cursor-pointer transition-opacity ${
                            isVis ? 'opacity-100' : 'opacity-45'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`material-symbols-outlined text-[16px] ${
                                isVis ? 'text-[#4cd7f6]' : 'text-[#958ea0]'
                              }`}
                            >
                              {isVis ? 'visibility' : 'visibility_off'}
                            </span>
                            <div>
                              <div className="text-[12px] font-semibold text-[#e3e1e9]">
                                {layer.title}
                              </div>
                              <div className="font-jetbrains text-[10px] text-[#958ea0]">
                                {layer.sub}
                              </div>
                            </div>
                          </div>
                          <span className={`font-jetbrains text-[11px] ${layer.color}`}>
                            {isVis ? layer.pct : 'MUTED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Iteration Tree & DAG */}
                <div className="p-5 rounded-xl bg-[#1a1b21] space-y-4 border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-bold text-[#e3e1e9] uppercase tracking-wider">
                      Iteration Tree &amp; DAG
                    </h2>
                    <span className="material-symbols-outlined text-[16px] text-[#958ea0]">
                      account_tree
                    </span>
                  </div>
                  <div className="relative pl-4 space-y-3 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#34343a]">
                    {[
                      { label: 'v3.1 PRIME (Current)', time: 'Active' },
                      { label: 'v2.4 Neon Bloom Warp', time: '3m ago' },
                      { label: 'v1.0 Baseline Wireframe', time: '12m ago' },
                    ].map((node) => {
                      const active = activeIterationNode === node.label;
                      return (
                        <div
                          key={node.label}
                          onClick={() => {
                            setActiveIterationNode(node.label);
                            showToast(`Switched DAG checkpoint to ${node.label}`);
                          }}
                          className="relative flex items-center justify-between cursor-pointer"
                        >
                          <span
                            className={`absolute -left-[13px] w-2.5 h-2.5 rounded-full ${
                              active ? 'bg-[#4cd7f6]' : 'bg-[#958ea0]'
                            }`}
                          />
                          <div
                            className={`p-2.5 rounded-lg w-full flex items-center justify-between ${
                              active ? 'bg-[#292a2f]' : 'bg-[#0d0e13] hover:bg-[#1e1f25]'
                            }`}
                          >
                            <span className="text-[12px] text-[#e3e1e9] font-semibold">
                              {node.label}
                            </span>
                            <span
                              className={`font-jetbrains text-[11px] ${
                                active ? 'text-[#4cd7f6]' : 'text-[#958ea0]'
                              }`}
                            >
                              {node.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Instant Export Buffers */}
                <div className="p-5 rounded-xl bg-[#1a1b21] space-y-3 border border-white/[0.04]">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    Instant Export Buffers
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'EXR 32-bit', sub: 'HDR Tensor Map', color: 'text-[#d0bcff]' },
                      { label: 'PNG 4K', sub: 'Alpha Pass Included', color: 'text-[#4cd7f6]' },
                      { label: 'GLTF 3D', sub: 'Mesh + Normal Maps', color: 'text-[#ffb95f]' },
                      { label: 'WebP Web', sub: 'Optimized 1.2 MB', color: 'text-[#e3e1e9]' },
                    ].map((buf) => (
                      <button
                        key={buf.label}
                        type="button"
                        onClick={() => handleDownloadExportBuffer(buf.label)}
                        className="p-2.5 rounded-xl bg-[#0d0e13] hover:bg-[#292a2f] text-left transition-colors space-y-1 border border-white/[0.04]"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-jetbrains text-[11px] font-bold ${buf.color}`}>
                            {buf.label}
                          </span>
                          <span className="material-symbols-outlined text-[14px] text-[#958ea0]">
                            download
                          </span>
                        </div>
                        <div className="text-[11px] text-[#958ea0]">{buf.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SUB-VIEW 3: AUTONOMOUS AGENTS & GROKBOT HIVE
           =================================================================== */}
        {activeSubView === 'autonomous-agents' && (
          <div className="p-6 space-y-6">
            {/* Top Swarm Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#03b5d3]/20 text-[#4cd7f6] font-jetbrains text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse" />
                    SWARM KERNEL v4.1 // {killswitchActive ? 'HALTED' : 'UNCONSTRAINED'}
                  </span>
                  <span className="font-jetbrains text-[11px] text-[#958ea0]">
                    TOPOLOGY: ADAPTIVE MESH
                  </span>
                </div>
                <h1 className="font-literata text-[32px] font-medium text-[#e3e1e9] tracking-tight">
                  Autonomous Agents &amp; Grokbot Hive
                </h1>
                <p className="text-[14px] text-[#cbc3d7] max-w-2xl">
                  Autonomous multi-model agents executing continuous feedback loops, high-frequency
                  reconnaissance, code fuzzing, and unconstrained market synthesis.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleToggleKillswitch}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[12px] transition-all ${
                    killswitchActive
                      ? 'bg-[#4cd7f6] text-[#003640]'
                      : 'bg-[#93000a]/50 hover:bg-[#93000a] text-[#ffb4ab]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">power_settings_new</span>
                  <span>
                    {killswitchActive ? 'RESUME SWARM KERNEL' : 'EMERGENCY KILLSWITCH'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeployBotModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d0bcff] hover:bg-[#a078ff] text-[#3c0091] font-bold text-[12px] shadow-[0_8px_32px_-4px_rgba(139,92,246,0.3)] transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  <span>Deploy Autonomous Bot</span>
                </button>
              </div>
            </div>

            {/* Deploy Bot Modal */}
            {showDeployBotModal && (
              <form
                onSubmit={handleDeployNewBot}
                className="p-5 rounded-xl bg-[#1e1f25] border border-[#d0bcff]/40 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#e3e1e9] uppercase font-jetbrains">
                    Deploy New Autonomous Grokbot Node
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowDeployBotModal(false)}
                    className="text-xs text-[#958ea0] hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Bot Code Name (e.g. GROKBOT-OMEGA)"
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#0d0e13] border border-white/10 text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Mission Role (e.g. Zero-Day Sentinel)"
                    value={newBotRole}
                    onChange={(e) => setNewBotRole(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#0d0e13] border border-white/10 text-xs text-white"
                  />
                  <select
                    value={newBotEngine}
                    onChange={(e) => setNewBotEngine(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-[#0d0e13] border border-white/10 text-xs text-white"
                  >
                    <option value="Grok-3 Kernel">Grok-3 Kernel</option>
                    <option value="Claude 3.7 + Grok">Claude 3.7 + Grok</option>
                    <option value="Gemini 2.0 Flash">Gemini 2.0 Flash</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#4cd7f6] text-[#003640] font-jetbrains text-xs font-bold"
                  >
                    Launch Daemon
                  </button>
                </div>
              </form>
            )}

            {/* 4 KPI Telemetry Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-[#1a1b21] flex flex-col justify-between border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    ACTIVE SWARM
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">hub</span>
                </div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="font-literata text-[36px] text-[#e3e1e9]">
                    {killswitchActive ? 0 : grokbots.filter((b) => !b.paused).length + 10}
                  </span>
                  <span className="font-jetbrains text-[11px] text-[#4cd7f6]">
                    {killswitchActive ? 'HALTED' : 'RUNNING'}
                  </span>
                </div>
                <div className="flex items-center justify-between font-jetbrains text-[11px] text-[#958ea0]">
                  <span className="text-[#ffb95f]">3 pending</span>
                  <span>0 terminated</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#1a1b21] flex flex-col justify-between border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    THROUGHPUT
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#d0bcff]">
                    speed
                  </span>
                </div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="font-literata text-[36px] text-[#e3e1e9]">
                    {killswitchActive ? 0 : 184}
                  </span>
                  <span className="font-jetbrains text-[11px] text-[#d0bcff]">ops/sec</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#34343a] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] w-[82%]" />
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#1a1b21] flex flex-col justify-between border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    REALTIME COST VELOCITY
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#ffb95f]">
                    toll
                  </span>
                </div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="font-literata text-[36px] text-[#e3e1e9]">$4.12</span>
                  <span className="font-jetbrains text-[11px] text-[#958ea0]">/hr</span>
                </div>
                <div className="font-jetbrains text-[11px] text-[#4cd7f6]">
                  ⚡ 94.2% compute efficiency
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#1a1b21] flex flex-col justify-between border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    AUTONOMY GUARD LEVEL
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">
                    shield_lock
                  </span>
                </div>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="font-literata text-[36px] text-[#4cd7f6]">Tier 4</span>
                  <span className="font-jetbrains text-[11px] text-[#4cd7f6]">ADAPTIVE</span>
                </div>
                <div className="font-jetbrains text-[11px] text-[#958ea0]">
                  Self-correcting with human gate
                </div>
              </div>
            </div>

            {/* Hive Fleet Matrix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[20px] font-bold text-[#e3e1e9]">Hive Fleet Matrix</h2>
                  <span className="px-2 py-0.5 rounded-md bg-[#292a2f] font-jetbrains text-[11px] text-[#cbc3d7]">
                    {grokbots.length} ACTIVE DISPATCHES
                  </span>
                </div>
              </div>

              {inspectedBot && (
                <div className="p-4 rounded-xl bg-[#1e1f25] border border-[#4cd7f6]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-jetbrains text-xs text-[#4cd7f6] font-bold">
                      LIVE EXECUTION TRACE // {inspectedBot.codeName} ({inspectedBot.engineBadge})
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectedBot(null)}
                      className="text-xs text-[#958ea0] hover:text-white"
                    >
                      Close Trace
                    </button>
                  </div>
                  <div className="space-y-1 font-jetbrains text-xs text-[#cbc3d7]">
                    {inspectedBot.traceDetails.map((t, idx) => (
                      <p key={idx}>› {t}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {grokbots.map((bot) => {
                  const dotColor =
                    bot.engineColor === 'secondary'
                      ? 'bg-[#4cd7f6]'
                      : bot.engineColor === 'tertiary'
                      ? 'bg-[#ffb95f]'
                      : 'bg-[#d0bcff]';
                  const textColor =
                    bot.engineColor === 'secondary'
                      ? 'text-[#4cd7f6]'
                      : bot.engineColor === 'tertiary'
                      ? 'text-[#ffb95f]'
                      : 'text-[#d0bcff]';
                  return (
                    <div
                      key={bot.id}
                      className={`p-5 rounded-xl bg-[#1a1b21] flex flex-col justify-between space-y-4 border border-white/[0.04] transition-opacity ${
                        bot.paused ? 'opacity-60' : 'opacity-100'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${dotColor} ${
                                bot.paused ? '' : 'animate-pulse'
                              }`}
                            />
                            <span className={`font-jetbrains text-[11px] font-bold ${textColor}`}>
                              {bot.codeName}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#292a2f] font-jetbrains text-[10px] text-[#cbc3d7]">
                            {bot.engineBadge}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-[18px] font-bold text-[#e3e1e9]">{bot.title}</h3>
                          <p className="text-[12px] text-[#cbc3d7] mt-1">{bot.description}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#0d0e13] font-jetbrains text-[11px] space-y-1.5 border border-white/[0.04]">
                          {bot.traceDetails.slice(0, 2).map((line, i) => (
                            <p key={i} className="text-[#cbc3d7] truncate">
                              • {line}
                            </p>
                          ))}
                        </div>
                        <div className="space-y-1.5 pt-1 font-jetbrains text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-[#958ea0]">{bot.stat1Label}</span>
                            <span className="text-[#e3e1e9]">{bot.stat1Val}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#958ea0]">{bot.stat2Label}</span>
                            <span className={textColor}>{bot.stat2Val}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectedBot(bot)}
                          className="flex-1 py-2 rounded-lg bg-[#292a2f] hover:bg-[#34343a] text-[12px] font-semibold text-[#e3e1e9] transition-colors"
                        >
                          Inspect Trace
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleBotPause(bot.id)}
                          className="p-2 rounded-lg bg-[#1e1f25] hover:bg-[#34343a] text-[#cbc3d7] hover:text-white transition-colors"
                          title={bot.paused ? 'Resume Bot' : 'Pause Bot'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {bot.paused ? 'play_arrow' : 'pause'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center Split: Grokbot Live Sandbox Stream (8 Cols) & Delegation DAG (4 Cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8 flex flex-col space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[20px] font-bold text-[#e3e1e9]">
                      Grokbot Live Sandbox Stream
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-[#03b5d3]/20 text-[#4cd7f6] font-jetbrains text-[11px]">
                      STDIN/STDOUT FEED
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#1a1b21] px-3 py-1.5 rounded-xl border border-white/[0.04]">
                      <span className="font-jetbrains text-[11px] text-[#cbc3d7]">
                        UNHINGED TRUTH MODE:
                      </span>
                      <button
                        type="button"
                        onClick={() => setUnhingedTruthMode((prev) => !prev)}
                        className={`w-9 h-5 rounded-full relative flex items-center px-0.5 transition-colors ${
                          unhingedTruthMode ? 'bg-[#4cd7f6]' : 'bg-[#34343a]'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-[#003640] transition-transform ${
                            unhingedTruthMode ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terminal Window */}
                <div className="rounded-xl bg-[#0d0e13] p-4 flex-1 flex flex-col justify-between space-y-4 border border-white/[0.06] shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffb95f]/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]/60" />
                      <span className="ml-2 font-jetbrains text-[11px] text-[#958ea0]">
                        sandbox-container:grokbot-alpha::worker-882
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(['BASH', 'PYTHON WASM', 'SCRAPER'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveShellTab(tab)}
                          className={`px-2 py-0.5 rounded font-jetbrains text-[11px] transition-colors ${
                            activeShellTab === tab
                              ? 'bg-[#292a2f] text-[#4cd7f6]'
                              : 'bg-[#1e1f25] text-[#958ea0] hover:text-white'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSandboxLogs([])}
                        className="p-1 rounded hover:bg-[#292a2f] text-[#958ea0] hover:text-white"
                        title="Clear Console"
                      >
                        <span className="material-symbols-outlined text-[14px]">clear_all</span>
                      </button>
                    </div>
                  </div>

                  {/* Terminal Output Stream */}
                  <div className="font-jetbrains text-[12px] space-y-3 overflow-y-auto max-h-96 pr-2">
                    <div className="text-[#958ea0]">
                      [04:12:09.120] INIT: Grok-3 kernel attached to raw socket bridge /dev/pts/4
                    </div>
                    {sandboxLogs.map((entry) => (
                      <div key={entry.id} className="space-y-2">
                        <div className="text-[#4cd7f6]">
                          [{entry.time}] {entry.toolLine}
                        </div>
                        {entry.parseLine && (
                          <div className="text-[#e3e1e9]">{entry.parseLine}</div>
                        )}
                        <div className="text-[#d0bcff]">{entry.reasonLine}</div>
                        <div className="p-3 rounded-lg bg-[#1a1b21] my-1 border-l-2 border-[#ffb95f]">
                          <div className="flex items-center justify-between text-[11px] text-[#ffb95f] mb-1">
                            <span>AGENT SCRATCHPAD (Grok-3 Internal)</span>
                            <span>CONFIDENCE: {entry.confidence}</span>
                          </div>
                          <p className="text-[#cbc3d7] text-[12px]">{entry.scratchpad}</p>
                        </div>
                        {entry.actionLine && (
                          <div className="text-[#ffb95f]">{entry.actionLine}</div>
                        )}
                        {entry.dispatchLine && (
                          <div className="text-[#4cd7f6]">{entry.dispatchLine}</div>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-[#e3e1e9]">
                      <span className="text-[#4cd7f6] animate-pulse">▋</span>
                      <span className="text-[#958ea0]">
                        {isExecutingCmd
                          ? 'Synthesizing sandbox execution...'
                          : 'Awaiting next daemon cycle...'}
                      </span>
                    </div>
                  </div>

                  {/* Command Input Bar */}
                  <form
                    onSubmit={handleExecuteSandboxCommand}
                    className="pt-3 flex items-center gap-2 bg-[#1a1b21] px-3 py-2 rounded-lg border border-white/[0.05]"
                  >
                    <span className="font-jetbrains text-[12px] text-[#4cd7f6]">&gt;</span>
                    <input
                      type="text"
                      value={terminalCommand}
                      onChange={(e) => setTerminalCommand(e.target.value)}
                      placeholder="Inject real-time prompt override or bash command into Grokbot Hive..."
                      className="bg-transparent border-none outline-none w-full font-jetbrains text-[12px] text-[#e3e1e9] placeholder-[#958ea0]"
                    />
                    <button
                      type="submit"
                      disabled={isExecutingCmd}
                      className="px-3 py-1 rounded bg-[#292a2f] hover:bg-[#34343a] font-jetbrains text-[11px] text-[#e3e1e9] transition-colors"
                    >
                      EXECUTE
                    </button>
                  </form>
                </div>
              </div>

              {/* Delegation DAG (4 Cols) */}
              <div className="xl:col-span-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[20px] font-bold text-[#e3e1e9]">Delegation DAG</h2>
                  <span className="font-jetbrains text-[11px] text-[#4cd7f6]">3 TIER TREE</span>
                </div>
                <div className="rounded-xl bg-[#1a1b21] p-5 flex-1 flex flex-col justify-between space-y-5 border border-white/[0.04]">
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-[#292a2f] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#03b5d3]/30 flex items-center justify-center text-[#4cd7f6]">
                          <span className="material-symbols-outlined text-[18px]">hub</span>
                        </div>
                        <div>
                          <div className="text-[13px] text-[#e3e1e9] font-bold">
                            Meta-Orchestrator
                          </div>
                          <div className="font-jetbrains text-[11px] text-[#958ea0]">
                            Grok-3 Swarm Lead • 100% Load
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] font-jetbrains text-[10px]">
                        ROOT
                      </span>
                    </div>

                    <div className="pl-6 space-y-3 border-l-2 border-[#494454]/40 ml-4">
                      <div className="p-3 rounded-xl bg-[#1e1f25] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">
                            psychology
                          </span>
                          <div>
                            <div className="text-[12px] text-[#e3e1e9] font-semibold">
                              Verification Engine
                            </div>
                            <div className="font-jetbrains text-[10px] text-[#958ea0]">
                              Claude 3.7 • Deep Formal Verif
                            </div>
                          </div>
                        </div>
                        <span className="font-jetbrains text-[11px] text-[#ffb95f]">CHILD 1</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#1e1f25] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[16px] text-[#d0bcff]">
                            travel_explore
                          </span>
                          <div>
                            <div className="text-[12px] text-[#e3e1e9] font-semibold">
                              Data Harvester &amp; Comms
                            </div>
                            <div className="font-jetbrains text-[10px] text-[#958ea0]">
                              Gemini 2.0 • Multimodal Ingest
                            </div>
                          </div>
                        </div>
                        <span className="font-jetbrains text-[11px] text-[#d0bcff]">CHILD 2</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0d0e13] space-y-3 border border-white/[0.04]">
                    <div className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                      SWARM TELEMETRY METRICS
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-jetbrains text-[11px] text-[#958ea0]">
                          TOTAL TASKS RUN
                        </div>
                        <div className="text-[20px] font-bold text-[#e3e1e9] mt-0.5">28,491</div>
                      </div>
                      <div>
                        <div className="font-jetbrains text-[11px] text-[#958ea0]">
                          AVG REASONING LATENCY
                        </div>
                        <div className="text-[20px] font-bold text-[#4cd7f6] mt-0.5">214ms</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guardrails & Intervention Queue */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[20px] font-bold text-[#e3e1e9]">
                    Guardrails &amp; Intervention Queue
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ca8100]/30 text-[#ffb95f] font-jetbrains text-[11px]">
                    {guardrailQueue.filter((g) => g.status === 'pending').length} HIGH-IMPACT
                    PENDING
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGuardrailQueue((prev) =>
                      prev.map((item) => ({ ...item, status: 'authorized' }))
                    );
                    showToast('Quick Review Mode: Authorized all pending Tier-4 dispatches!');
                  }}
                  className="font-jetbrains text-[11px] text-[#4cd7f6] hover:underline"
                >
                  Authorize All Pending
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {guardrailQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#1a1b21] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-white/[0.04]"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl mt-0.5 ${
                          item.riskColor === 'error'
                            ? 'bg-[#93000a]/30 text-[#ffb4ab]'
                            : item.riskColor === 'secondary'
                            ? 'bg-[#03b5d3]/20 text-[#4cd7f6]'
                            : 'bg-[#ca8100]/20 text-[#ffb95f]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {item.riskColor === 'error'
                            ? 'gavel'
                            : item.riskColor === 'secondary'
                            ? 'forward_to_inbox'
                            : 'terminal'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] text-[#e3e1e9] font-bold">{item.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded font-jetbrains text-[10px] ${
                              item.riskColor === 'error'
                                ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                                : item.riskColor === 'secondary'
                                ? 'bg-[#03b5d3]/20 text-[#4cd7f6]'
                                : 'bg-[#ca8100]/30 text-[#ffb95f]'
                            }`}
                          >
                            {item.riskBadge}
                          </span>
                          <span className="font-jetbrains text-[11px] text-[#958ea0]">
                            Agent: {item.agent}
                          </span>
                          {item.status !== 'pending' && (
                            <span
                              className={`px-2 py-0.5 rounded font-jetbrains text-[10px] font-bold uppercase ${
                                item.status === 'authorized'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {item.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-[#cbc3d7] max-w-3xl">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => showToast(`Inspecting payload for ${item.code}...`)}
                        className="px-3.5 py-2 rounded-xl bg-[#1e1f25] hover:bg-[#34343a] text-[#cbc3d7] text-[12px] font-semibold transition-colors"
                      >
                        {item.secondaryActionLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGuardrailAction(item.id, 'rejected')}
                        className="px-3.5 py-2 rounded-xl bg-[#93000a]/30 hover:bg-[#93000a]/50 text-[#ffb4ab] text-[12px] font-semibold transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGuardrailAction(item.id, 'authorized')}
                        className="px-4 py-2 rounded-xl bg-[#d0bcff] hover:bg-[#a078ff] text-[#3c0091] font-bold text-[12px] transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>{item.primaryActionLabel}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SUB-VIEW 4: EMAIL & COMMS HUB (NEURAL COMMS & MULTIMODAL MAILBOX CORE)
           =================================================================== */}
        {activeSubView === 'email-comms-hub' && (
          <div className="flex flex-col w-full flex-1">
            {/* Telemetry Overview Banner */}
            <div className="px-6 py-4 bg-[#0d0e13]/80 backdrop-blur-xl border-b border-white/[0.05]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6] animate-ping" />
                  <div className="flex flex-col">
                    <span className="font-jetbrains text-[11px] uppercase text-[#4cd7f6] tracking-widest">
                      KARA AUTONOMOUS DISPATCH ENGINE v3.4
                    </span>
                    <span className="text-[20px] font-bold text-[#e3e1e9]">
                      Neural Comms &amp; Multimodal Mailbox Core
                    </span>
                  </div>
                </div>

                {/* Connected Accounts Switcher Bar (Yahoo Mail, Gmail, Outlook, iCloud, Custom) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                    CONNECTED MAILBOXES:
                  </span>
                  {connectedAccounts.map((acc) => {
                    const isSelected = acc.id === activeEmailAccount?.id;
                    const provMeta = EMAIL_PROVIDER_PRESETS[acc.provider];
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setActiveEmailAccountId(acc.id);
                          const updated = setDefaultConnectedEmailAccount(acc.id);
                          setConnectedAccounts(updated);
                          showToast(`Switched active Email Bot connection to ${acc.email}`);
                        }}
                        className={`px-3 py-1 rounded-full font-jetbrains text-[11px] transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#d0bcff] text-[#3c0091] font-bold shadow-sm'
                            : 'bg-[#1a1b21] text-[#cbc3d7] hover:bg-[#292a2f]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{provMeta?.badge || acc.provider.toUpperCase()}:</span>
                        <span>{acc.email}</span>
                      </button>
                    );
                  })}
                  {onOpenClassicWorkspace && (
                    <button
                      type="button"
                      onClick={onOpenClassicWorkspace}
                      className="px-2.5 py-1 rounded-full bg-[#292a2f] hover:bg-[#34343a] text-[#4cd7f6] font-jetbrains text-[11px]"
                    >
                      + Connect Yahoo / Gmail / IMAP
                    </button>
                  )}
                </div>
              </div>

              {/* Top 4 Metrics Cluster */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-[#1a1b21] p-3 rounded-xl flex flex-col justify-between border border-white/[0.04]">
                  <div className="flex items-center justify-between text-[#958ea0]">
                    <span className="font-jetbrains text-[11px] uppercase">Processed (24h)</span>
                    <span className="material-symbols-outlined text-[16px] text-[#d0bcff]">
                      mark_email_read
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1 font-jetbrains">
                    <span className="text-[20px] text-[#e3e1e9] font-bold">2,840</span>
                    <span className="text-[11px] text-[#d0bcff]">+14.2%</span>
                  </div>
                </div>
                <div className="bg-[#1a1b21] p-3 rounded-xl flex flex-col justify-between border border-white/[0.04]">
                  <div className="flex items-center justify-between text-[#958ea0]">
                    <span className="font-jetbrains text-[11px] uppercase">Auto-Reply Rate</span>
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                      smart_toy
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1 font-jetbrains">
                    <span className="text-[20px] text-[#4cd7f6] font-bold">78.4%</span>
                    <span className="text-[11px] text-[#acedff]">Zero-Latency</span>
                  </div>
                </div>
                <div className="bg-[#1a1b21] p-3 rounded-xl flex flex-col justify-between border border-white/[0.04]">
                  <div className="flex items-center justify-between text-[#958ea0]">
                    <span className="font-jetbrains text-[11px] uppercase">Exec Escalations</span>
                    <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">
                      priority_high
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1 font-jetbrains">
                    <span className="text-[20px] text-[#ffb95f] font-bold">12</span>
                    <span className="text-[11px] text-[#ffddb8]">Requires Touch</span>
                  </div>
                </div>
                <div className="bg-[#1a1b21] p-3 rounded-xl flex flex-col justify-between border border-white/[0.04]">
                  <div className="flex items-center justify-between text-[#958ea0]">
                    <span className="font-jetbrains text-[11px] uppercase">
                      Grok Defense Neutralized
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">
                      security
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1 font-jetbrains">
                    <span className="text-[20px] text-[#ffb4ab] font-bold">412</span>
                    <span className="text-[11px] text-[#ffdad6]">100% Intercepted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Three-Pane Executive Workspace Grid */}
            <div className="grid grid-cols-12 gap-0 flex-1">
              {/* SUB-PANE 1: Routing Radar & Cognitive Queues (Col 1-2) */}
              <div className="col-span-12 lg:col-span-3 xl:col-span-2 bg-[#1a1b21] p-4 flex flex-col justify-between space-y-6 border-r border-white/[0.05]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="font-jetbrains text-[11px] text-[#958ea0] uppercase tracking-wider">
                      ROUTING RADAR
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-[#958ea0]">
                      tune
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDispatchEmail('auto')}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#a078ff] hover:bg-[#d0bcff] text-[#340080] font-bold text-[12px] transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span className="uppercase tracking-wide">Synthetic Outbound</span>
                  </button>

                  <div className="space-y-1">
                    <div className="px-2 py-1 font-jetbrains text-[11px] text-[#958ea0] uppercase">
                      COGNITIVE QUEUES
                    </div>
                    {[
                      { label: 'VIP & Investor Sync', badge: 'P0', icon: 'star', color: 'text-[#ffb95f]' },
                      { label: 'Grokbot Auto-Drafts', badge: '9', icon: 'bolt', color: 'text-[#4cd7f6]' },
                      { label: 'Multi-Model Triage', badge: '14', icon: 'cognition', color: 'text-[#d0bcff]' },
                      { label: 'Auto-Resolved', badge: '182', icon: 'verified', color: 'text-[#958ea0]' },
                      { label: 'Adversarial Sandbox', badge: 'HOT', icon: 'shield', color: 'text-[#ffb4ab]' },
                    ].map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => showToast(`Filtered Cognitive Queue: ${q.label}`)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#cbc3d7] hover:bg-[#292a2f] hover:text-white transition-all text-[12px]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`material-symbols-outlined text-[16px] ${q.color}`}>
                            {q.icon}
                          </span>
                          <span className="truncate font-semibold">{q.label}</span>
                        </div>
                        <span className={`font-jetbrains text-[11px] ${q.color}`}>{q.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#1e1f25] rounded-xl space-y-2 border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <span className="font-jetbrains text-[11px] text-[#958ea0]">AGENT STATUS</span>
                    <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
                  </div>
                  <p className="text-[12px] text-[#cbc3d7]">
                    Grokbot Agent #4 is scanning {activeEmailAccount?.email || 'inbounds'} for
                    hostile prompts &amp; zero-day phishing.
                  </p>
                  <div className="flex items-center justify-between font-jetbrains text-[11px] text-[#4cd7f6] pt-1">
                    <span>PARALLEL RUNTIME</span>
                    <span>99.98% ACC</span>
                  </div>
                </div>
              </div>

              {/* SUB-PANE 2: Intelligent Thread List (Col 3-6) */}
              <div className="col-span-12 lg:col-span-4 xl:col-span-4 bg-[#1e1f25] p-4 flex flex-col space-y-3 overflow-y-auto border-r border-white/[0.05]">
                <div className="flex items-center gap-2 bg-[#1a1b21] px-3 py-2 rounded-xl border border-white/[0.04]">
                  <span className="material-symbols-outlined text-[16px] text-[#958ea0]">
                    search
                  </span>
                  <input
                    type="text"
                    value={emailSearchQuery}
                    onChange={(e) => setEmailSearchQuery(e.target.value)}
                    placeholder="Search neural embeddings, intent, or senders..."
                    className="bg-transparent border-0 outline-none text-[#e3e1e9] text-[12px] placeholder:text-[#958ea0] w-full"
                  />
                  <span className="font-jetbrains text-[10px] px-1.5 py-0.5 rounded bg-[#34343a] text-[#4cd7f6]">
                    SEMANTIC
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['All Urgent (14)', 'High Sentiment', 'Needs Review', 'Yahoo/Gmail Sync'].map(
                    (pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setSelectedQueueFilter(pill)}
                        className={`px-2.5 py-1 rounded-full font-jetbrains text-[11px] whitespace-nowrap transition-colors ${
                          selectedQueueFilter === pill
                            ? 'bg-[#a078ff] text-[#3c0091] font-bold'
                            : 'bg-[#292a2f] text-[#cbc3d7] hover:text-white'
                        }`}
                      >
                        {pill}
                      </button>
                    )
                  )}
                </div>

                {/* Thread Cards */}
                <div className="space-y-2.5">
                  {combinedExecThreads.map((thread) => {
                    const isSelected = thread.id === selectedExecThread.id;
                    return (
                      <div
                        key={thread.id}
                        onClick={() => handleSelectExecThread(thread.id)}
                        className={`p-3.5 rounded-xl transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                          isSelected
                            ? 'bg-[#292a2f] shadow-md border border-[#d0bcff]/30'
                            : 'bg-[#1a1b21] hover:bg-[#292a2f]/60 border border-white/[0.03]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d0bcff]" />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-[#d0bcff]/20 text-[#d0bcff] flex items-center justify-center font-jetbrains text-[11px] font-bold">
                              {thread.initials}
                            </span>
                            <div>
                              <h4 className="text-[12px] text-[#e3e1e9] font-bold leading-tight">
                                {thread.senderName}
                              </h4>
                              <p className="font-jetbrains text-[11px] text-[#958ea0]">
                                {thread.senderEmail} • {thread.timeAgo}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#ca8100]/30 text-[#ffb95f] font-jetbrains text-[10px] font-bold">
                            {thread.priorityBadge}
                          </span>
                        </div>
                        <div className="text-[#e3e1e9] text-[13px] font-semibold line-clamp-1">
                          {thread.subject}
                        </div>
                        <p className="text-[12px] text-[#cbc3d7] line-clamp-2">{thread.snippet}</p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 font-jetbrains text-[10px]">
                          <span className="px-2 py-0.5 rounded-full bg-[#d0bcff]/10 text-[#d0bcff] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">
                              {thread.aiTag1Icon}
                            </span>
                            {thread.aiTag1}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#03b5d3]/20 text-[#4cd7f6]">
                            {thread.aiTag2}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#34343a] text-[#cbc3d7]">
                            {thread.aiTag3}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SUB-PANE 3: Email Deep-Dive & Multi-Model Synthesis Studio (Col 7-12) */}
              <div className="col-span-12 lg:col-span-5 xl:col-span-6 bg-[#121318] p-6 flex flex-col space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#a078ff] text-[#3c0091] font-jetbrains text-[10px] font-bold uppercase tracking-wider">
                          CRITICAL INBOUND
                        </span>
                        <span className="font-jetbrains text-[11px] text-[#958ea0]">
                          ACTIVE MAILBOX: {activeEmailAccount?.email || 'founders@kara.ai'}
                        </span>
                      </div>
                      <h2 className="font-literata text-[26px] text-[#e3e1e9] leading-snug">
                        {selectedExecThread.subject}
                      </h2>
                    </div>
                  </div>

                  {/* Executive AI Synthesis Banner */}
                  <div className="p-3.5 rounded-xl bg-[#292a2f]/80 backdrop-blur-md space-y-2 border border-white/[0.05]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#d0bcff]">
                          auto_awesome
                        </span>
                        <span className="font-jetbrains text-[11px] uppercase tracking-wider text-[#d0bcff] font-semibold">
                          Executive AI Synthesis
                        </span>
                      </div>
                      <span className="font-jetbrains text-[11px] text-[#958ea0]">
                        Aggregated: Claude 3.7 + Gemini 2.0
                      </span>
                    </div>
                    <p className="text-[13px] text-[#e3e1e9] leading-relaxed">
                      {selectedExecThread.executiveSummary}{' '}
                      <strong className="text-[#ffb95f]">Recommended Strategy:</strong>{' '}
                      {selectedExecThread.recommendedStrategy}
                    </p>
                  </div>

                  {/* Inbound Message Viewer */}
                  <div className="p-4 rounded-xl bg-[#1a1b21] space-y-3 border border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#d0bcff]/20 text-[#d0bcff] flex items-center justify-center font-jetbrains text-xs font-bold">
                          {selectedExecThread.initials}
                        </div>
                        <div>
                          <div className="text-[13px] text-[#e3e1e9] font-bold">
                            {selectedExecThread.senderName}
                          </div>
                          <div className="font-jetbrains text-[11px] text-[#958ea0]">
                            From: {selectedExecThread.senderEmail} • To:{' '}
                            {activeEmailAccount?.email || 'stephen@yahoo.com'}
                          </div>
                        </div>
                      </div>
                      <span className="font-jetbrains text-[11px] text-[#958ea0]">
                        {selectedExecThread.timeAgo}
                      </span>
                    </div>
                    <div className="font-literata text-[15px] text-[#e3e1e9] space-y-2 leading-relaxed">
                      {selectedExecThread.fullBody.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Kara Autonomous Co-Pilot Synthesis Studio */}
                <div className="p-5 rounded-2xl bg-[#292a2f]/90 shadow-xl space-y-4 border border-white/[0.06]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#4cd7f6]">
                        smart_toy
                      </span>
                      <span className="text-[18px] font-bold text-[#e3e1e9]">
                        Kara Autonomous Co-Pilot Draft
                      </span>
                    </div>

                    {/* Voice Selector Segmented Pill */}
                    <div className="flex items-center bg-[#0d0e13] p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleSelectDraftVoice('claude')}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                          activeDraftVoice === 'claude'
                            ? 'bg-[#292a2f] text-[#e3e1e9] shadow-sm'
                            : 'text-[#cbc3d7] hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#d0bcff]" />
                        Claude (Diplomatic)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectDraftVoice('grok')}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                          activeDraftVoice === 'grok'
                            ? 'bg-[#292a2f] text-[#e3e1e9] shadow-sm'
                            : 'text-[#cbc3d7] hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
                        Grok (Direct &amp; Wit)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectDraftVoice('gemini')}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                          activeDraftVoice === 'gemini'
                            ? 'bg-[#292a2f] text-[#e3e1e9] shadow-sm'
                            : 'text-[#cbc3d7] hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#ffb95f]" />
                        Gemini (Dense Spec)
                      </button>
                    </div>
                  </div>

                  {/* Outbound Editable Preview */}
                  <div className="p-4 rounded-xl bg-[#0d0e13] space-y-3 border border-white/[0.05]">
                    <div className="flex items-center justify-between text-[#958ea0] font-jetbrains text-[11px]">
                      <span>DRAFT RECIPIENT: {selectedExecThread.senderEmail}</span>
                      <span className="text-[#4cd7f6] font-semibold">
                        SYNTHESIS CONFIDENCE: 98.7%
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      value={currentDraftText}
                      onChange={(e) => setCustomDraftOverride(e.target.value)}
                      className="w-full bg-transparent text-[13px] text-[#e3e1e9] leading-relaxed focus:outline-none resize-y"
                    />

                    {/* Auto-Schedule Injection Card */}
                    <div className="p-3 rounded-xl bg-[#292a2f] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-[#4cd7f6]">
                          calendar_clock
                        </span>
                        <div>
                          <span className="text-[12px] text-[#e3e1e9] font-bold">
                            15-Min Founder Briefing Injected
                          </span>
                          <p className="font-jetbrains text-[11px] text-[#958ea0]">
                            Tomorrow, 9:30 AM CET (Matches recipient&apos;s calendar opening)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMeetingLocked((prev) => !prev)}
                        className="px-2.5 py-1 rounded bg-[#03b5d3] text-[#003640] font-jetbrains text-[11px] font-bold"
                      >
                        {meetingLocked ? 'LOCKED' : 'UNLOCKED'}
                      </button>
                    </div>
                  </div>

                  {/* Quick Action & Multi-Provider Dispatch Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDispatchEmail('auto')}
                        className="px-4 py-2 rounded-xl bg-[#03b5d3] hover:bg-[#4cd7f6] text-[#003640] font-bold text-[12px] transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>
                          Auto-Send via{' '}
                          {activeEmailAccount?.provider.toUpperCase() || 'Connected Mail'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleIterateDraftWithAI}
                        disabled={isIteratingDraft}
                        className="px-3.5 py-2 rounded-xl bg-[#1e1f25] hover:bg-[#34343a] text-[#e3e1e9] text-[12px] font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[16px]">tune</span>
                        <span>{isIteratingDraft ? 'Synthesizing...' : 'Iterate Prompt'}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDispatchEmail('yahoo')}
                        className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 text-purple-200 font-jetbrains text-[11px] font-bold"
                      >
                        Yahoo Mail ↗
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDispatchEmail('gmail')}
                        className="px-3 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/30 text-rose-200 font-jetbrains text-[11px] font-bold"
                      >
                        Gmail ↗
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDispatchEmail('outlook')}
                        className="px-3 py-2 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/30 text-sky-200 font-jetbrains text-[11px] font-bold"
                      >
                        Outlook ↗
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SUB-VIEW 5: OMNIBAR WORKSPACE PRO (TRI-MODEL SWARM + ARTIFACT CANVAS)
           =================================================================== */}
        {activeSubView === 'omnibar-workspace' && (
          <div className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#121318]">
            {/* Ambient Compute Glow Layers */}
            <div className="absolute top-12 left-1/4 w-96 h-96 rounded-full bg-[#d0bcff]/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-20 right-1/3 w-[30rem] h-[30rem] rounded-full bg-[#4cd7f6]/10 blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-80 h-80 rounded-full bg-[#ffb95f]/10 blur-[130px] pointer-events-none" />

            {/* MAIN CENTRAL CONVERSATION STREAM */}
            <section className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto px-4 lg:px-8 pt-6 pb-48 relative z-10 space-y-6">
              {/* Routing Orchestrator Meta-Banner */}
              <div className="w-full rounded-2xl bg-[#1a1b21]/90 backdrop-blur-xl p-4 shadow-xl border border-white/[0.05]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6] animate-pulse shadow-[0_0_10px_#4cd7f6]" />
                    <div className="flex flex-col">
                      <span className="font-jetbrains text-[11px] text-[#4cd7f6] uppercase tracking-widest">
                        Kara Swarm Matrix // Tri-Model Synergy Engaged
                      </span>
                      <span className="text-[12px] text-[#cbc3d7]">
                        Auto-routed:{' '}
                        <strong className="text-[#ffb95f] font-medium">Claude 3.7</strong> (Deep
                        Epistemics) +{' '}
                        <strong className="text-[#d0bcff] font-medium">Gemini 2.0 Flash</strong>{' '}
                        (Spatial Schematics) +{' '}
                        <strong className="text-[#4cd7f6] font-medium">Grok-3</strong> (Live
                        Grounding)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-jetbrains text-[11px]">
                    <span className="px-2.5 py-1 rounded-full bg-[#292a2f] text-[#e3e1e9] flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f]" />{' '}
                      {omnibarReasoningBudget}K Budget
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#292a2f] text-[#4cd7f6] flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[13px]">bolt</span> 114 t/s
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#292a2f] text-[#958ea0]">
                      ID: #TH-9021-SWARM
                    </span>
                  </div>
                </div>
              </div>

              {/* Turn 1: User Request */}
              <div className="w-full flex items-start justify-end gap-3.5 pl-8 sm:pl-16">
                <div className="max-w-2xl rounded-2xl bg-[#292a2f]/90 p-5 shadow-lg backdrop-blur-md border border-white/[0.06]">
                  <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-white/[0.05]">
                    <span className="font-jetbrains text-[11px] text-[#d0bcff] uppercase">
                      Prompt Origin // Root Node
                    </span>
                    <span className="font-jetbrains text-[11px] text-[#958ea0]">14:02:18 UTC</span>
                  </div>
                  <p className="text-[14px] text-[#e3e1e9] leading-relaxed">
                    {omnibarTurnData.userPrompt}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#0d0e13] text-[#cbc3d7] font-jetbrains text-[11px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-[#d0bcff]">
                        attach_file
                      </span>{' '}
                      rust_engine.spec.v3
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#0d0e13] text-[#4cd7f6] font-jetbrains text-[11px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">public</span>{' '}
                      Realtime L2 Data: {omnibarGroundingOn ? 'Active' : 'Muted'}
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#34343a] flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-[18px] text-[#d0bcff]">
                    terminal
                  </span>
                </div>
              </div>

              {/* Turn 2: Kara Multi-Agent Synthesis Output */}
              <div className="w-full flex items-start gap-3.5 pr-2 sm:pr-8">
                <div className="w-9 h-9 rounded-full bg-[#d0bcff]/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(208,188,255,0.3)]">
                  <span className="material-symbols-outlined text-[20px] text-[#d0bcff]">
                    cognition
                  </span>
                </div>
                <div className="flex-1 space-y-4">
                  {/* Model Partition 1: Claude 3.7 Epistemic Reasoning Section */}
                  <div className="w-full rounded-2xl bg-[#1a1b21]/95 p-5 shadow-xl backdrop-blur-lg border border-white/[0.05]">
                    <button
                      type="button"
                      onClick={() => setOmnibarSwarmCollapsed((prev) => !prev)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-[#ffb95f] shadow-[0_0_8px_#ffb95f]" />
                        <span className="text-[12px] font-semibold text-[#ffb95f] uppercase tracking-wider">
                          Claude 3.7 Deep Epistemic Chain
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#34343a] text-[#ffddb8] font-jetbrains text-[11px]">
                          Thought for 5.8s // 3,412 Tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#958ea0] group-hover:text-white transition-colors">
                        <span className="font-jetbrains text-[11px]">
                          {omnibarSwarmCollapsed ? 'Inspect 3,412 Tokens' : 'Collapse'}
                        </span>
                        <span className="material-symbols-outlined text-[18px]">
                          {omnibarSwarmCollapsed ? 'expand_more' : 'expand_less'}
                        </span>
                      </div>
                    </button>

                    {!omnibarSwarmCollapsed && (
                      <div className="relative mt-4 pt-3 space-y-2.5 pl-5 bg-[#1e1f25]/60 rounded-xl p-3.5 border border-white/[0.04]">
                        {/* Vertical Synaptic Pathway with Traveling Impulse */}
                        <div
                          className="kara-synapse-axon-track absolute left-3 top-3.5 bottom-3.5 w-0.5 bg-gradient-to-b from-[#ffb95f]/85 via-[#4cd7f6]/65 to-[#d0bcff]/75 rounded-full"
                          aria-hidden="true"
                        >
                          <span className="kara-synapse-axon-spark" />
                        </div>
                        {omnibarTurnData.claudeSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className={`kara-thought-step--${Math.min(
                              idx,
                              5
                            )} relative pl-5 flex items-start gap-2.5 text-[12px] text-[#cbc3d7]`}
                          >
                            <span className="kara-synapse-node--firing absolute -left-0.5 top-0.5 w-4 h-4 rounded-full bg-[#0d0e13] border border-[#ffb95f]/80 font-jetbrains text-[9px] font-bold text-[#ffb95f] flex items-center justify-center shadow-sm z-10">
                              0{idx + 1}
                            </span>
                            <span
                              aria-hidden="true"
                              className="kara-synapse-dendrite absolute left-3.5 top-2.5 w-1.5 h-[1.5px] bg-gradient-to-r from-[#ffb95f] to-[#4cd7f6] rounded-full z-10"
                            />
                            <p className="leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-3">
                      <h2 className="text-[20px] font-semibold text-[#e3e1e9] mb-2">
                        {omnibarTurnData.claudeHeadline}
                      </h2>
                      <p className="font-literata text-[17px] text-[#e3e1e9] leading-relaxed">
                        {omnibarTurnData.claudeProse}
                      </p>
                    </div>
                  </div>

                  {/* Model Partition 2: Grok-3 Telemetry & Uncensored Stress Test */}
                  <div className="w-full rounded-2xl bg-[#1e1f25]/90 p-5 shadow-xl backdrop-blur-md border border-white/[0.05]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6]" />
                        <span className="text-[12px] font-semibold text-[#4cd7f6] uppercase tracking-wider">
                          Grok-3 Live Feed &amp; Adversarial Stress Profile
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#4cd7f6]/10 text-[#4cd7f6] font-jetbrains text-[11px] uppercase tracking-wider">
                        Real-time Grounded
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      {omnibarTurnData.grokMetrics.map((m, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-[#1a1b21] p-3 shadow-inner border border-white/[0.04]"
                        >
                          <div className="font-jetbrains text-[11px] text-[#958ea0] uppercase">
                            {m.label}
                          </div>
                          <div
                            className={`text-[20px] font-bold mt-1 ${
                              idx === 0
                                ? 'text-[#4cd7f6]'
                                : idx === 1
                                ? 'text-[#e3e1e9]'
                                : 'text-[#ffb95f]'
                            }`}
                          >
                            {m.value}
                          </div>
                          <div className="font-jetbrains text-[11px] text-[#cbc3d7] mt-1">
                            {m.sub}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-[#0d0e13] p-3.5 space-y-2 border border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                          security_update_warning
                        </span>
                        <span className="font-jetbrains text-[11px] text-[#e3e1e9] uppercase">
                          Unvarnished Vector Analysis: Adverse Selection
                        </span>
                      </div>
                      <p className="text-[12px] text-[#cbc3d7] leading-relaxed">
                        {omnibarTurnData.grokAnalysis}
                      </p>
                    </div>
                  </div>

                  {/* Model Partition 3: Gemini 2.0 Multimodal Visual Schematic Card */}
                  <div className="w-full rounded-2xl bg-[#1a1b21]/95 p-5 shadow-xl backdrop-blur-md border border-white/[0.05]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#d0bcff] shadow-[0_0_8px_#d0bcff]" />
                        <span className="text-[12px] font-semibold text-[#d0bcff] uppercase tracking-wider">
                          Gemini 2.0 Spatial Architecture Schematic
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#d0bcff]/10 text-[#d0bcff] font-jetbrains text-[11px]">
                        SVG/Canvas Rendered
                      </span>
                    </div>

                    <div className="relative w-full rounded-xl overflow-hidden bg-[#0d0e13] p-5 flex flex-col items-center border border-white/[0.04]">
                      <div className="w-full flex items-center justify-between mb-4 font-jetbrains text-[11px] text-[#958ea0]">
                        <span>ASYNC PIPELINE: ZERO-COPY DISPATCH</span>
                        <span className="text-[#4cd7f6] font-medium">CLOCK: 100MHz SYNC</span>
                      </div>
                      <svg
                        className="w-full max-w-xl h-40 text-[#e3e1e9]"
                        fill="none"
                        viewBox="0 0 600 160"
                      >
                        <rect fill="#1e1f25" height="50" rx="10" width="130" x="20" y="55" />
                        <text
                          fill="#e3e1e9"
                          fontFamily="Plus Jakarta Sans"
                          fontSize="11"
                          fontWeight="600"
                          textAnchor="middle"
                          x="85"
                          y="78"
                        >
                          {omnibarTurnData.geminiNodes[0] || 'L2 Order Book'}
                        </text>
                        <text
                          fill="#4cd7f6"
                          fontFamily="JetBrains Mono"
                          fontSize="9"
                          textAnchor="middle"
                          x="85"
                          y="93"
                        >
                          WebSocket DMA
                        </text>
                        <path
                          d="M150 80 H 195"
                          stroke="#4cd7f6"
                          strokeDasharray="4 2"
                          strokeWidth="2"
                        />
                        <circle cx="170" cy="80" fill="#4cd7f6" r="3" />
                        <rect fill="#292a2f" height="80" rx="14" width="180" x="200" y="40" />
                        <rect fill="#1a1b21" height="70" rx="10" width="170" x="205" y="45" />
                        <text
                          fill="#ffb95f"
                          fontFamily="Plus Jakarta Sans"
                          fontSize="12"
                          fontWeight="700"
                          textAnchor="middle"
                          x="290"
                          y="74"
                        >
                          {omnibarTurnData.geminiNodes[1] || 'Rust Arb Kernel'}
                        </text>
                        <text
                          fill="#cbc3d7"
                          fontFamily="JetBrains Mono"
                          fontSize="10"
                          textAnchor="middle"
                          x="290"
                          y="90"
                        >
                          Atomic CAS Ring-Buffer
                        </text>
                        <text
                          fill="#d0bcff"
                          fontFamily="JetBrains Mono"
                          fontSize="9"
                          textAnchor="middle"
                          x="290"
                          y="103"
                        >
                          Zero Heap Invariant
                        </text>
                        <path d="M380 80 H 425" stroke="#d0bcff" strokeWidth="2" />
                        <circle cx="400" cy="80" fill="#d0bcff" r="3" />
                        <rect fill="#1e1f25" height="50" rx="10" width="150" x="430" y="55" />
                        <text
                          fill="#e3e1e9"
                          fontFamily="Plus Jakarta Sans"
                          fontSize="11"
                          fontWeight="600"
                          textAnchor="middle"
                          x="505"
                          y="78"
                        >
                          {omnibarTurnData.geminiNodes[2] || 'FIX Multi-Venue'}
                        </text>
                        <text
                          fill="#ffb95f"
                          fontFamily="JetBrains Mono"
                          fontSize="9"
                          textAnchor="middle"
                          x="505"
                          y="93"
                        >
                          Direct Market Order
                        </text>
                      </svg>
                      <div className="w-full mt-3 flex items-center justify-between pt-3 font-jetbrains text-[11px] text-[#cbc3d7] border-t border-white/[0.04]">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-[#d0bcff]">
                            deployed_code
                          </span>{' '}
                          Compiled to Active Artifact Drawer (ID: #ART-884)
                        </span>
                        <button
                          type="button"
                          onClick={() => setInspectorTab('preview')}
                          className="px-3 py-1 rounded-lg bg-[#d0bcff] text-[#3c0091] font-bold text-[11px] flex items-center gap-1 shadow-md"
                        >
                          Inspect in Canvas{' '}
                          <span className="material-symbols-outlined text-[14px]">
                            arrow_forward
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {isDispatchingOmnibar && (
                    <div className="flex flex-col items-start w-full">
                      <div className="kara-thinking-bubble-breathe w-full rounded-2xl bg-[#1a1b21]/95 border border-[#d0bcff]/35 p-4 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between gap-3">
                          <div className="kara-thinking-breathe flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[18px] text-[#d0bcff]">
                              psychology
                            </span>
                            <span className="font-jetbrains text-[12px] font-semibold text-[#d0bcff]">
                              Thinking...
                            </span>
                            <span className="text-[12px] text-[#cbc3d7]">
                              Kara Swarm Matrix processing reasoning chain ({omnibarReasoningBudget}K
                              token budget)...
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowOmnibarSynapseTrace((prev) => !prev)}
                            aria-label="Toggle Neural Synapse Trace"
                            title={`Neural Synapse Trace (${
                              showOmnibarSynapseTrace ? 'Click to hide' : 'Click to inspect'
                            })`}
                            className={`relative w-7 h-7 rounded-full border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                              showOmnibarSynapseTrace
                                ? 'bg-[#d0bcff]/25 border-[#4cd7f6] text-[#4cd7f6] shadow-[0_0_12px_rgba(76,215,246,0.35)]'
                                : 'bg-white/5 hover:bg-[#d0bcff]/15 border-white/15 hover:border-[#4cd7f6]/60 text-[#d0bcff]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">psychology</span>
                            <span
                              aria-hidden="true"
                              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4cd7f6] animate-ping"
                            />
                            <span
                              aria-hidden="true"
                              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4cd7f6]"
                            />
                          </button>
                        </div>

                        {/* Live Synapse Firing Reasoning Trace Steps during Omnibar synthesis (collapsed into icon by default) */}
                        {showOmnibarSynapseTrace && (
                          <div className="relative pl-5 space-y-2 pt-1">
                            <div
                              className="kara-synapse-axon-track absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#4cd7f6]/80 via-[#d0bcff]/70 to-[#ffb95f]/60 rounded-full"
                              aria-hidden="true"
                            >
                              <span className="kara-synapse-axon-spark" />
                            </div>
                            {omnibarTurnData.claudeSteps.map((step, idx) => {
                              const activeOmnibarStep = Math.min(
                                omnibarTurnData.claudeSteps.length - 1,
                                Math.floor(omnibarElapsedTenths / 7)
                              );
                              const isFiring = idx === activeOmnibarStep;
                              const isDone = idx < activeOmnibarStep;
                              return (
                                <div
                                  key={idx}
                                  className={`relative pl-4 py-1.5 px-2.5 rounded-xl border text-[11px] transition-all ${
                                    isFiring
                                      ? 'kara-synapse-step-active bg-[#0d0e13]/90 border-[#4cd7f6]/45 text-[#e3e1e9]'
                                      : isDone
                                      ? 'bg-[#0d0e13]/50 border-emerald-500/25 text-[#cbc3d7] opacity-85'
                                      : 'bg-[#0d0e13]/30 border-white/[0.04] text-[#958ea0] opacity-50'
                                  }`}
                                >
                                  <span
                                    className={` absolute -left-[1.1rem] top-2 w-3.5 h-3.5 rounded-full font-jetbrains text-[8px] font-bold flex items-center justify-center z-10 ${
                                      isFiring
                                        ? 'kara-synapse-node--firing bg-[#0d0e13] border border-[#4cd7f6] text-[#4cd7f6]'
                                        : isDone
                                        ? 'bg-emerald-950 border border-emerald-400/70 text-emerald-300'
                                        : 'bg-[#1a1b21] border border-white/15 text-[#958ea0]'
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                  {(isFiring || isDone) && (
                                    <span
                                      aria-hidden="true"
                                      className="kara-synapse-dendrite absolute -left-1.5 top-[0.88rem] w-1.5 h-[1.5px] bg-gradient-to-r from-[#4cd7f6] to-[#d0bcff] rounded-full"
                                    />
                                  )}
                                  <p className="font-jetbrains leading-snug line-clamp-1">{step}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {showDurationBadge !== false &&
                        omnibarElapsedTenths >=
                          Math.max(0, Math.round((durationBadgeThresholdSec ?? 3) * 10)) && (
                          <div className="mt-1.5 ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0d0e13]/85 border border-white/[0.08] font-jetbrains text-[10px] text-[#958ea0] tabular-nums shadow-sm select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff] animate-pulse" />
                            <span>Reasoning for {(omnibarElapsedTenths / 10).toFixed(1)}s</span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* RIGHT-HAND INTERACTIVE INSPECTOR & ARTIFACT CANVAS */}
            <aside className="w-full lg:w-[460px] xl:w-[520px] flex-shrink-0 bg-[#0d0e13] border-l border-white/[0.06] flex flex-col h-full z-20 shadow-2xl">
              <div className="p-4 bg-[#1a1b21]/95 flex flex-col gap-3 border-b border-white/[0.05]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-[#a078ff]/20 text-[#d0bcff]">
                      <span className="material-symbols-outlined text-[18px]">terminal</span>
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#e3e1e9] font-bold">
                          {omnibarTurnData.artifactFile}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#34343a] text-[#4cd7f6] font-jetbrains text-[10px]">
                          v1.4 LIVE
                        </span>
                      </div>
                      <span className="font-jetbrains text-[11px] text-[#958ea0]">
                        Target: x86_64-unknown-linux-musl
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          omnibarTurnData.artifactCodeLines.join('\n')
                        );
                        showToast('Copied artifact code to clipboard!');
                      }}
                      className="p-2 rounded-lg bg-[#1e1f25] hover:bg-[#292a2f] text-[#cbc3d7] hover:text-white transition-colors"
                      title="Copy Code"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                  </div>
                </div>

                {/* Segmented Tab Switcher */}
                <div className="flex items-center rounded-xl bg-[#0d0e13] p-1 text-[12px]">
                  <button
                    type="button"
                    onClick={() => setInspectorTab('rust')}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      inspectorTab === 'rust'
                        ? 'bg-[#292a2f] text-[#e3e1e9] font-semibold shadow-sm'
                        : 'text-[#cbc3d7] hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f]" /> Rust Sync Engine
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTab('schema')}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      inspectorTab === 'schema'
                        ? 'bg-[#292a2f] text-[#e3e1e9] font-semibold shadow-sm'
                        : 'text-[#cbc3d7] hover:text-white'
                    }`}
                  >
                    Protocol Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTab('preview')}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      inspectorTab === 'preview'
                        ? 'bg-[#292a2f] text-[#e3e1e9] font-semibold shadow-sm'
                        : 'text-[#cbc3d7] hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">
                      play_arrow
                    </span>{' '}
                    Live Preview
                  </button>
                </div>
              </div>

              {/* Code / Schema / Preview Substrate */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#0d0e13] p-4 overflow-y-auto font-jetbrains text-[12px] leading-relaxed text-[#cbc3d7]">
                <div className="flex items-center justify-between pb-3 text-[#958ea0] text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">code</span> SYNTAX
                    HIGHLIGHTED // TOKENS: 1,842
                  </span>
                  <span className="text-[#ffb95f]">UNCONSTRAINED SANDBOX</span>
                </div>

                {inspectorTab === 'rust' && (
                  <div className="bg-[#121318] rounded-xl p-4 overflow-x-auto space-y-1 shadow-inner border border-white/[0.04]">
                    {omnibarTurnData.artifactCodeLines.map((line, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="text-[#494454] select-none w-6 text-right">{i + 1}</span>
                        <span className="text-[#e3e1e9] whitespace-pre">{line}</span>
                      </div>
                    ))}
                  </div>
                )}

                {inspectorTab === 'schema' && (
                  <pre className="bg-[#121318] rounded-xl p-4 overflow-x-auto text-[#4cd7f6] border border-white/[0.04]">
                    {`syntax = "proto3";\npackage kara.arb.v3;\n\nmessage OrderTick {\n  uint64 sequence_id = 1;\n  double delta_bps = 2;\n  bytes venue_signature = 3;\n  uint64 timestamp_ns = 4;\n}`}
                  </pre>
                )}

                {inspectorTab === 'preview' && (
                  <div className="bg-[#121318] rounded-xl p-4 space-y-3 border border-[#4cd7f6]/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#4cd7f6] font-bold">
                        LIVE WASMER EXECUTION TELEMETRY
                      </span>
                      <span className="text-emerald-400">0.00% HEAP ALLOC</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#1a1b21]">
                        <div className="text-[#958ea0]">Dispatched Bundles</div>
                        <div className="text-lg font-bold text-white">1,492</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#1a1b21]">
                        <div className="text-[#958ea0]">Median Gate Time</div>
                        <div className="text-lg font-bold text-[#4cd7f6]">380 ns</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Telemetry Graphs and History */}
                <div className="mt-4 pt-3 space-y-3">
                  <div className="flex items-center justify-between text-[#958ea0] text-[11px]">
                    <span className="uppercase">Hardware Cycle Simulation Telemetry</span>
                    <span className="text-[#4cd7f6]">Zero-Copy L1 Hit: 99.8%</span>
                  </div>
                  <div className="w-full h-16 rounded-xl bg-[#1a1b21] p-2.5 flex items-end">
                    <svg
                      className="w-full h-full text-[#4cd7f6]"
                      fill="none"
                      preserveAspectRatio="none"
                      viewBox="0 0 300 40"
                    >
                      <path
                        d="M0 35 L 20 32 L 45 34 L 70 20 L 95 24 L 120 12 L 145 15 L 170 8 L 195 10 L 220 5 L 250 8 L 275 3 L 300 2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M0 35 L 20 32 L 45 34 L 70 20 L 95 24 L 120 12 L 145 15 L 170 8 L 195 10 L 220 5 L 250 8 L 275 3 L 300 2 L 300 40 L 0 40 Z"
                        fill="currentColor"
                        fillOpacity="0.12"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#1e1f25] p-3 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">
                        history
                      </span>
                      <span className="text-[#e3e1e9]">Commit 7a9e1d:</span>
                      <span className="text-[#958ea0]">
                        Merged Grok Real-Time Slippage Safeguards
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Action Drawer Footer */}
              <div className="p-4 bg-[#1a1b21]/95 flex items-center justify-between gap-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6]" />
                  <span className="font-jetbrains text-[11px] text-[#e3e1e9] font-medium uppercase">
                    WASMER SANDBOX: READY
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showToast(`Exported ${omnibarTurnData.artifactFile}`)}
                    className="px-3 py-1.5 rounded-xl bg-[#292a2f] hover:bg-[#34343a] text-[#e3e1e9] text-[12px] font-semibold transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#958ea0]">
                      file_download
                    </span>{' '}
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteKernelSandbox}
                    className="px-4 py-1.5 rounded-xl bg-[#d0bcff] hover:bg-[#a078ff] text-[#3c0091] text-[12px] font-bold transition-all flex items-center gap-1.5 shadow-lg"
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        kernelExecState === 'compiling' ? 'animate-spin' : ''
                      }`}
                    >
                      {kernelExecState === 'compiling'
                        ? 'refresh'
                        : kernelExecState === 'inflight'
                        ? 'check'
                        : 'play_arrow'}
                    </span>
                    <span>
                      {kernelExecState === 'compiling'
                        ? 'Compiled & Fired'
                        : kernelExecState === 'inflight'
                        ? 'In Flight (0.8ms)'
                        : 'Execute Kernel'}
                    </span>
                  </button>
                </div>
              </div>
            </aside>

            {/* THE ULTIMATE OMNIBAR FLOATING DOCK (Suspended HUD) */}
            <div className="fixed bottom-4 left-4 lg:left-80 right-4 lg:right-[490px] xl:right-[550px] z-30">
              <div className="w-full rounded-2xl bg-[#0d0e13]/90 backdrop-blur-2xl p-3 shadow-2xl border border-white/[0.08]">
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-white/[0.05]">
                  <div className="flex items-center gap-1 bg-[#1a1b21] p-1 rounded-xl text-[12px]">
                    {(
                      [
                        { id: 'swarm', label: 'Kara Swarm', dot: 'bg-[#d0bcff]' },
                        { id: 'claude', label: 'Claude 3.7', dot: 'bg-[#ffb95f]' },
                        { id: 'gemini', label: 'Gemini 2.0', dot: 'bg-[#d0bcff]' },
                        { id: 'grok', label: 'Grok-3', dot: 'bg-[#4cd7f6]' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setOmnibarMode(m.id)}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                          omnibarMode === m.id
                            ? 'bg-[#34343a] text-[#e3e1e9] font-bold shadow-sm'
                            : 'text-[#cbc3d7] hover:text-white'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 font-jetbrains text-[11px]">
                    <div className="flex items-center gap-2 bg-[#1a1b21] px-2.5 py-1 rounded-lg">
                      <span className="text-[#ffb95f] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">psychology</span>{' '}
                        Reasoning
                      </span>
                      <input
                        type="range"
                        min={8}
                        max={128}
                        value={omnibarReasoningBudget}
                        onChange={(e) => setOmnibarReasoningBudget(Number(e.target.value))}
                        className="w-16 accent-[#ffb95f] h-1 bg-[#34343a] rounded cursor-pointer"
                      />
                      <span className="text-[#e3e1e9] font-medium">{omnibarReasoningBudget}K</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOmnibarGroundingOn((prev) => !prev)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1b21] transition-colors ${
                        omnibarGroundingOn ? 'text-[#4cd7f6]' : 'text-[#958ea0]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">public</span>{' '}
                      Grounding: {omnibarGroundingOn ? 'ON' : 'OFF'}
                    </button>

                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1b21] text-[#ffb95f]">
                      <span className="material-symbols-outlined text-[14px]">
                        shield_with_heart
                      </span>{' '}
                      Safe: Relaxed
                    </div>
                  </div>
                </div>

                <div className="relative flex items-end gap-2">
                  <div className="flex items-center gap-1 pb-1">
                    <button
                      type="button"
                      onClick={onReturnToOmnibarChat}
                      className="p-2 rounded-xl bg-[#292a2f] hover:bg-[#34343a] text-[#cbc3d7] hover:text-[#4cd7f6] transition-all"
                      title="Open Voice & Main Chat"
                    >
                      <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubView('banana-synth')}
                      className="p-2 rounded-xl bg-[#292a2f] hover:bg-[#34343a] text-[#cbc3d7] hover:text-[#d0bcff] transition-all"
                      title="Open Banana Synth Image Studio"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add_photo_alternate
                      </span>
                    </button>
                  </div>

                  <div className="flex-1 relative">
                    <textarea
                      rows={1}
                      value={omnibarInput}
                      onChange={(e) => setOmnibarInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleDispatchOmnibarSwarm();
                        } else if (e.key === 'Tab' && !omnibarInput.trim()) {
                          e.preventDefault();
                          setOmnibarInput(
                            'Synthesize a zero-latency Rust MEV execution kernel with formal Plonky3 verification'
                          );
                        }
                      }}
                      placeholder="Instruct Kara Swarm or enter code synthesis requirements (Enter to trigger, Tab to autocomplete)..."
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#1e1f25] text-[#e3e1e9] placeholder:text-[#958ea0] text-[14px] resize-none focus:outline-none focus:bg-[#292a2f] transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDispatchOmnibarSwarm}
                    disabled={isDispatchingOmnibar}
                    className="pb-1"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#d0bcff] hover:bg-[#a078ff] text-[#3c0091] flex items-center justify-center transition-all shadow-lg">
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          isDispatchingOmnibar ? 'animate-spin' : ''
                        }`}
                      >
                        {isDispatchingOmnibar ? 'refresh' : 'arrow_upward'}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="mt-2 pt-1 flex items-center justify-between text-[#958ea0] font-jetbrains text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#4cd7f6]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" /> Grok L2 Stream
                      Active
                    </span>
                    <span className="hidden md:inline text-[#494454]">|</span>
                    <span className="hidden md:flex items-center gap-1 text-[#cbc3d7]">
                      Claude 3.7 Verification Budget Active
                    </span>
                  </div>
                  <span>
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-[#1e1f25] text-[#e3e1e9]">Tab</kbd> to
                    autocomplete Swarm pipeline
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
