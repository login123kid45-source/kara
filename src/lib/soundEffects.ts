/**
 * KARA Human Vocal & Expressive Chat Sound Effects Engine
 * Synthesizes realistic, warm vocal formant bursts, breath envelopes, and conversational
 * human sound effects (laughs, giggles, sighs, gasps, hums, kisses, teasing 'ooh',
 * empathetic 'aww', playful scoffs, and soft thinking presence cues) using the Web Audio API.
 */

import { triggerHaptic } from './haptics';

export type KaraSoundEffectType =
  | 'laugh'
  | 'giggle'
  | 'sigh'
  | 'gasp'
  | 'hum'
  | 'kiss'
  | 'aww'
  | 'tease'
  | 'breath'
  | 'scoff'
  | 'thinking';

export interface KaraSoundEffectMeta {
  type: KaraSoundEffectType;
  label: string;
  shortTag: string;
  description: string;
}

export const KARA_SOUND_EFFECT_CATALOG: Record<KaraSoundEffectType, KaraSoundEffectMeta> = {
  laugh: {
    type: 'laugh',
    label: 'Warm Laugh',
    shortTag: 'haha',
    description: 'Natural melodic chuckle & warm human laughter',
  },
  giggle: {
    type: 'giggle',
    label: 'Playful Giggle',
    shortTag: 'hehe',
    description: 'Light, bubbly, affectionate human giggle',
  },
  sigh: {
    type: 'sigh',
    label: 'Soft Sigh',
    shortTag: 'sigh',
    description: 'Warm, breathy human exhale of relief or fondness',
  },
  gasp: {
    type: 'gasp',
    label: 'Surprised Gasp',
    shortTag: 'gasp',
    description: 'Quick, expressive intake of breath in surprise or excitement',
  },
  hum: {
    type: 'hum',
    label: 'Thoughtful Hum',
    shortTag: 'mm-hmm',
    description: 'Warm two-tone closed-lip vocal backchannel ("mm-hmm" / "hmm")',
  },
  kiss: {
    type: 'kiss',
    label: 'Soft Kiss',
    shortTag: 'mwah',
    description: 'Affectionate lip-pop and warm "mwah" vocalization',
  },
  aww: {
    type: 'aww',
    label: 'Tender "Aww"',
    shortTag: 'aww',
    description: 'Soft, melting empathetic vocalization',
  },
  tease: {
    type: 'tease',
    label: 'Playful "Ooh"',
    shortTag: 'ooh',
    description: 'Rising-falling sassy & intrigued vocal inflection',
  },
  breath: {
    type: 'breath',
    label: 'Intimate Breath',
    shortTag: 'breath',
    description: 'Close-mic soft breathy exhale for intimate or roleplay moments',
  },
  scoff: {
    type: 'scoff',
    label: 'Playful Scoff',
    shortTag: 'pfft',
    description: 'Quick sassy nasal exhale ("pfft" / "ugh")',
  },
  thinking: {
    type: 'thinking',
    label: 'Contemplative Hum',
    shortTag: 'hmm...',
    description: 'Subtle human thinking hum while composing a reply',
  },
};

export interface DetectedSoundCue {
  id: string;
  type: KaraSoundEffectType;
  label: string;
  rawMatch: string;
  triggerPhrase?: string;
}

export interface ModeVocalFxPreset {
  mode: string;
  label: string;
  description: string;
  pitchScale: number;
  breathScale: number;
  primaryCues: KaraSoundEffectType[];
}

export const MODE_VOCAL_FX_PRESETS: Record<string, ModeVocalFxPreset> = {
  regular: {
    mode: 'regular',
    label: 'Warm & Conversational',
    description: 'Natural chuckles, attentive hums, and expressive gasps',
    pitchScale: 1.0,
    breathScale: 1.0,
    primaryCues: ['laugh', 'hum', 'giggle', 'gasp'],
  },
  bratty: {
    mode: 'bratty',
    label: 'Sassy & Playful Tease',
    description: 'Brighter teasing "oohs", cheeky giggles, and playful scoffs',
    pitchScale: 1.07,
    breathScale: 0.95,
    primaryCues: ['tease', 'giggle', 'scoff', 'laugh'],
  },
  uncensored: {
    mode: 'uncensored',
    label: 'Unfiltered & Sultry',
    description: 'Deeper close-mic breaths, bold chuckles, and teasing inflections',
    pitchScale: 0.94,
    breathScale: 1.25,
    primaryCues: ['breath', 'tease', 'laugh', 'kiss'],
  },
  romantic: {
    mode: 'romantic',
    label: 'Intimate & Affectionate',
    description: 'Soft kisses, warm close-mic breaths, and dreamy sighs',
    pitchScale: 0.96,
    breathScale: 1.35,
    primaryCues: ['kiss', 'breath', 'sigh', 'aww'],
  },
  parent: {
    mode: 'parent',
    label: 'Nurturing & Soothing',
    description: 'Tender "awws", reassuring hums, and gentle warm sighs',
    pitchScale: 0.98,
    breathScale: 1.15,
    primaryCues: ['aww', 'hum', 'sigh', 'giggle'],
  },
};

let sfxAudioCtx: AudioContext | null = null;
let noiseBufferCache: AudioBuffer | null = null;
let activeSequenceTimers: ReturnType<typeof setTimeout>[] = [];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sfxAudioCtx) {
    sfxAudioCtx = new AudioContextClass();
  }
  if (sfxAudioCtx.state === 'suspended') {
    sfxAudioCtx.resume().catch(() => {});
  }
  return sfxAudioCtx;
}

function getPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBufferCache && noiseBufferCache.sampleRate === ctx.sampleRate) {
    return noiseBufferCache;
  }
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
    b6 = white * 0.115926;
  }
  noiseBufferCache = buffer;
  return buffer;
}

/**
 * Helper to synthesize a human vocal formant burst (glottal source + 2 vowel formant filters + breath aspiration)
 */
function playVocalFormantSyllable(params: {
  ctx: AudioContext;
  startTime: number;
  duration: number;
  f0Start: number;
  f0End: number;
  f1: number;
  f2: number;
  gainPeak: number;
  breathiness?: number;
  vibratoHz?: number;
  vibratoDepth?: number;
}) {
  const {
    ctx,
    startTime,
    duration,
    f0Start,
    f0End,
    f1,
    f2,
    gainPeak,
    breathiness = 0.25,
    vibratoHz = 5.5,
    vibratoDepth = 4,
  } = params;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, startTime);
  masterGain.gain.linearRampToValueAtTime(gainPeak, startTime + Math.min(0.035, duration * 0.28));
  masterGain.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, gainPeak * 0.35),
    startTime + duration * 0.75
  );
  masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  masterGain.connect(ctx.destination);

  // Glottal harmonic source (warm saw + triangle blend)
  const oscSaw = ctx.createOscillator();
  const oscSub = ctx.createOscillator();
  oscSaw.type = 'sawtooth';
  oscSub.type = 'sine';

  oscSaw.frequency.setValueAtTime(f0Start, startTime);
  oscSaw.frequency.exponentialRampToValueAtTime(Math.max(60, f0End), startTime + duration);

  oscSub.frequency.setValueAtTime(f0Start, startTime);
  oscSub.frequency.exponentialRampToValueAtTime(Math.max(60, f0End), startTime + duration);

  // Subtle human vocal vibrato
  if (vibratoDepth > 0) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(vibratoHz, startTime);
    lfoGain.gain.setValueAtTime(vibratoDepth, startTime);
    lfo.connect(lfoGain);
    lfoGain.connect(oscSaw.frequency);
    lfoGain.connect(oscSub.frequency);
    lfo.start(startTime);
    lfo.stop(startTime + duration + 0.02);
  }

  // Vowel Formant 1 (throat warmth)
  const formant1 = ctx.createBiquadFilter();
  formant1.type = 'bandpass';
  formant1.frequency.setValueAtTime(f1, startTime);
  formant1.Q.setValueAtTime(4.5, startTime);

  // Vowel Formant 2 (mouth articulation)
  const formant2 = ctx.createBiquadFilter();
  formant2.type = 'bandpass';
  formant2.frequency.setValueAtTime(f2, startTime);
  formant2.Q.setValueAtTime(5.5, startTime);

  const f1Gain = ctx.createGain();
  f1Gain.gain.setValueAtTime(0.75, startTime);
  const f2Gain = ctx.createGain();
  f2Gain.gain.setValueAtTime(0.45, startTime);

  oscSaw.connect(formant1);
  oscSaw.connect(formant2);
  oscSub.connect(formant1);

  formant1.connect(f1Gain);
  formant2.connect(f2Gain);
  f1Gain.connect(masterGain);
  f2Gain.connect(masterGain);

  // Aspiration / human breath layer
  if (breathiness > 0) {
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = getPinkNoiseBuffer(ctx);
    const breathFilter = ctx.createBiquadFilter();
    breathFilter.type = 'bandpass';
    breathFilter.frequency.setValueAtTime((f1 + f2) * 0.55, startTime);
    breathFilter.Q.setValueAtTime(1.8, startTime);

    const breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(breathiness * 0.9, startTime);

    noiseSrc.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(masterGain);

    noiseSrc.start(startTime, Math.random() * 0.4);
    noiseSrc.stop(startTime + duration + 0.02);
  }

  oscSaw.start(startTime);
  oscSub.start(startTime);
  oscSaw.stop(startTime + duration + 0.02);
  oscSub.stop(startTime + duration + 0.02);
}

/**
 * Helper to synthesize filtered breathy air (sighs, gasps, intimate whispers, scoffs)
 */
function playBreathEnvelope(params: {
  ctx: AudioContext;
  startTime: number;
  duration: number;
  freqStart: number;
  freqEnd: number;
  q?: number;
  gainPeak: number;
  attackRatio?: number;
}) {
  const {
    ctx,
    startTime,
    duration,
    freqStart,
    freqEnd,
    q = 2.4,
    gainPeak,
    attackRatio = 0.22,
  } = params;

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = getPinkNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freqStart, startTime);
  filter.frequency.exponentialRampToValueAtTime(Math.max(120, freqEnd), startTime + duration);
  filter.Q.setValueAtTime(q, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + duration * attackRatio);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  noiseSrc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noiseSrc.start(startTime, Math.random() * 0.5);
  noiseSrc.stop(startTime + duration + 0.03);
}

export function stopAllKaraSoundEffects(): void {
  for (const timer of activeSequenceTimers) {
    clearTimeout(timer);
  }
  activeSequenceTimers = [];
}

/**
 * Play a single realistic human-feel vocal sound effect from Kara
 */
export function playKaraSoundEffect(
  type: KaraSoundEffectType,
  options?: { enabled?: boolean; volume?: number; mode?: string; autoSwitch?: boolean }
): void {
  const enabled = options?.enabled ?? true;
  if (!enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const vol = Math.min(1, Math.max(0.05, options?.volume ?? 0.55));
  const modeKey = (options?.mode || 'regular').toLowerCase();
  const useAutoSwitch = options?.autoSwitch !== false;
  const modePreset = useAutoSwitch
    ? MODE_VOCAL_FX_PRESETS[modeKey] || MODE_VOCAL_FX_PRESETS.regular
    : MODE_VOCAL_FX_PRESETS.regular;
  const pScale = modePreset.pitchScale;
  const bScale = modePreset.breathScale;
  const now = ctx.currentTime + 0.01;

  try {
    switch (type) {
      case 'laugh': {
        // Warm 3-pulse melodic human chuckle ("ha-ha-ha")
        const notes = [
          { offset: 0, dur: 0.11, f0Start: 275 * pScale, f0End: 235 * pScale, gain: 0.16 * vol },
          { offset: 0.13, dur: 0.11, f0Start: 295 * pScale, f0End: 245 * pScale, gain: 0.18 * vol },
          { offset: 0.26, dur: 0.16, f0Start: 260 * pScale, f0End: 195 * pScale, gain: 0.14 * vol },
        ];
        for (const n of notes) {
          playVocalFormantSyllable({
            ctx,
            startTime: now + n.offset,
            duration: n.dur,
            f0Start: n.f0Start,
            f0End: n.f0End,
            f1: 720,
            f2: 1380,
            gainPeak: n.gain,
            breathiness: 0.35 * bScale,
          });
        }
        triggerHaptic('tap');
        break;
      }

      case 'giggle': {
        // Bubbly, higher-pitched playful giggle ("he-he-he")
        const notes = [
          { offset: 0, dur: 0.085, f0Start: 330 * pScale, f0End: 300 * pScale, gain: 0.13 * vol },
          { offset: 0.1, dur: 0.085, f0Start: 360 * pScale, f0End: 320 * pScale, gain: 0.15 * vol },
          { offset: 0.2, dur: 0.11, f0Start: 345 * pScale, f0End: 280 * pScale, gain: 0.12 * vol },
        ];
        for (const n of notes) {
          playVocalFormantSyllable({
            ctx,
            startTime: now + n.offset,
            duration: n.dur,
            f0Start: n.f0Start,
            f0End: n.f0End,
            f1: 540,
            f2: 1850,
            gainPeak: n.gain,
            breathiness: 0.3 * bScale,
          });
        }
        triggerHaptic('tap');
        break;
      }

      case 'sigh': {
        // Soft vocalized exhale ("haaah...") + warm descending breath
        playBreathEnvelope({
          ctx,
          startTime: now,
          duration: 0.58,
          freqStart: 1150,
          freqEnd: 520,
          q: 1.9,
          gainPeak: 0.22 * vol * bScale,
          attackRatio: 0.2,
        });
        playVocalFormantSyllable({
          ctx,
          startTime: now + 0.02,
          duration: 0.46,
          f0Start: 245 * pScale,
          f0End: 175 * pScale,
          f1: 680,
          f2: 1250,
          gainPeak: 0.11 * vol,
          breathiness: 0.55 * bScale,
          vibratoDepth: 2,
        });
        break;
      }

      case 'gasp': {
        // Quick intake breath ("*gasp!*") with rising pitch and high airiness
        playBreathEnvelope({
          ctx,
          startTime: now,
          duration: 0.22,
          freqStart: 620,
          freqEnd: 1650,
          q: 2.6,
          gainPeak: 0.24 * vol * bScale,
          attackRatio: 0.35,
        });
        playVocalFormantSyllable({
          ctx,
          startTime: now + 0.015,
          duration: 0.16,
          f0Start: 240 * pScale,
          f0End: 355 * pScale,
          f1: 750,
          f2: 1450,
          gainPeak: 0.12 * vol,
          breathiness: 0.45 * bScale,
          vibratoDepth: 0,
        });
        triggerHaptic('tap');
        break;
      }

      case 'hum': {
        // Two-tone conversational backchannel ("mm-hmm!")
        playVocalFormantSyllable({
          ctx,
          startTime: now,
          duration: 0.14,
          f0Start: 215 * pScale,
          f0End: 210 * pScale,
          f1: 320,
          f2: 980,
          gainPeak: 0.14 * vol,
          breathiness: 0.08 * bScale,
          vibratoDepth: 1.5,
        });
        playVocalFormantSyllable({
          ctx,
          startTime: now + 0.16,
          duration: 0.22,
          f0Start: 225 * pScale,
          f0End: 278 * pScale,
          f1: 350,
          f2: 1080,
          gainPeak: 0.16 * vol,
          breathiness: 0.1 * bScale,
          vibratoDepth: 2.5,
        });
        break;
      }

      case 'kiss': {
        // Crisp affectionate lip-pop transient + soft warm "mwah"
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOsc.type = 'sine';
        popOsc.frequency.setValueAtTime(920, now);
        popOsc.frequency.exponentialRampToValueAtTime(240, now + 0.038);
        popGain.gain.setValueAtTime(0.18 * vol, now);
        popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
        popOsc.connect(popGain);
        popGain.connect(ctx.destination);
        popOsc.start(now);
        popOsc.stop(now + 0.045);

        playVocalFormantSyllable({
          ctx,
          startTime: now + 0.045,
          duration: 0.24,
          f0Start: 275 * pScale,
          f0End: 215 * pScale,
          f1: 640,
          f2: 1320,
          gainPeak: 0.13 * vol,
          breathiness: 0.32 * bScale,
        });
        triggerHaptic('tap');
        break;
      }

      case 'aww': {
        // Tender, melting empathetic vocalization ("awww...")
        playVocalFormantSyllable({
          ctx,
          startTime: now,
          duration: 0.44,
          f0Start: 285 * pScale,
          f0End: 215 * pScale,
          f1: 620,
          f2: 1180,
          gainPeak: 0.15 * vol,
          breathiness: 0.22 * bScale,
          vibratoHz: 5.2,
          vibratoDepth: 3.5,
        });
        break;
      }

      case 'tease': {
        // Playful rising-then-falling "ooh~" inflection
        playVocalFormantSyllable({
          ctx,
          startTime: now,
          duration: 0.16,
          f0Start: 235 * pScale,
          f0End: 325 * pScale,
          f1: 420,
          f2: 960,
          gainPeak: 0.14 * vol,
          breathiness: 0.18 * bScale,
        });
        playVocalFormantSyllable({
          ctx,
          startTime: now + 0.14,
          duration: 0.2,
          f0Start: 325 * pScale,
          f0End: 250 * pScale,
          f1: 440,
          f2: 1020,
          gainPeak: 0.13 * vol,
          breathiness: 0.2 * bScale,
        });
        break;
      }

      case 'breath': {
        // Soft intimate close-mic breath exhale
        playBreathEnvelope({
          ctx,
          startTime: now,
          duration: 0.48,
          freqStart: 980,
          freqEnd: 460,
          q: 1.6,
          gainPeak: 0.19 * vol * bScale,
          attackRatio: 0.25,
        });
        break;
      }

      case 'scoff': {
        // Sassy quick nasal/breath burst ("pfft" / "ugh")
        playBreathEnvelope({
          ctx,
          startTime: now,
          duration: 0.14,
          freqStart: 1450,
          freqEnd: 680,
          q: 2.2,
          gainPeak: 0.22 * vol,
          attackRatio: 0.12,
        });
        playVocalFormantSyllable({
          ctx,
          startTime: now + 0.03,
          duration: 0.18,
          f0Start: 255 * pScale,
          f0End: 180 * pScale,
          f1: 580,
          f2: 1280,
          gainPeak: 0.11 * vol,
          breathiness: 0.4 * bScale,
          vibratoDepth: 0,
        });
        break;
      }

      case 'thinking': {
        // Subtle contemplative closed-lip hum ("hmm...") when Kara starts thinking/typing
        playVocalFormantSyllable({
          ctx,
          startTime: now,
          duration: 0.26,
          f0Start: 220 * pScale,
          f0End: 242 * pScale,
          f1: 310,
          f2: 920,
          gainPeak: 0.1 * vol,
          breathiness: 0.12 * bScale,
          vibratoDepth: 1.5,
        });
        break;
      }
    }
  } catch {
    // Ignore audio context autoplay restrictions if user hasn't interacted yet
  }
}

/**
 * Map a raw action or vocal phrase (e.g., "*laughs softly*", "haha", "mwah", "*sighs*") to a KaraSoundEffectType
 */
export function classifyPhraseToSoundEffect(rawPhrase: string): KaraSoundEffectType | null {
  const lower = rawPhrase.toLowerCase().trim();
  if (!lower) return null;

  if (/\b(giggle|giggles|giggling|hehe|teehee|titters?|snickers?)\b/.test(lower)) {
    return 'giggle';
  }
  if (/\b(laugh|laughs|laughing|chuckle|chuckles|chuckling|haha|hahaha|ahah|cackles?|barks? a laugh)\b/.test(lower)) {
    return 'laugh';
  }
  if (/\b(kiss|kisses|kissing|mwah|smooch|smooches|pecks?)\b|[😘💋]/.test(lower)) {
    return 'kiss';
  }
  if (/\b(gasp|gasps|gasping|inhales? sharply|catches? her breath)\b/.test(lower)) {
    return 'gasp';
  }
  if (/\b(scoff|scoffs|scoffing|pfft|rolls? (?:her )?eyes|ugh|groans?|tuts?|tsks?)\b/.test(lower)) {
    return 'scoff';
  }
  if (/\b(sigh|sighs|sighing|exhales? slowly|exhales? warmly)\b/.test(lower)) {
    return 'sigh';
  }
  if (/\b(whisper|whispers|whispering|breathes?|pant|pants|panting|moans?|shivers?|leans? in close|traces?|nuzzles?)\b/.test(lower)) {
    return 'breath';
  }
  if (/\b(hum|hums|humming|mm-?hmm|mhm|hmm+|ponders?|thinks?|taps? (?:her )?chin)\b/.test(lower)) {
    return 'hum';
  }
  if (/\b(aww+|melts?|softens?|smiles? tenderly|hugs?|cuddles?|holds? you)\b/.test(lower)) {
    return 'aww';
  }
  if (/\b(ooh+|oh\?|smirks?|winks?|teases?|grins? mischievously|raises? an eyebrow)\b/.test(lower)) {
    return 'tease';
  }

  return null;
}

/**
 * Extract expressive human sound cues from Kara's message content, plus fallback to her emotional state
 */
export function extractSoundEffectsFromMessage(
  content: string,
  mode = 'regular',
  emotionState?: string,
  autoSwitch = true
): DetectedSoundCue[] {
  if (!content || typeof content !== 'string') return [];

  const detected: DetectedSoundCue[] = [];
  const seenTypes = new Set<KaraSoundEffectType>();

  const addCue = (type: KaraSoundEffectType, rawMatch: string) => {
    if (seenTypes.has(type) || detected.length >= 4) return;
    seenTypes.add(type);
    const meta = KARA_SOUND_EFFECT_CATALOG[type];
    const cleanMatch = rawMatch.trim().slice(0, 42);
    detected.push({
      id: `sfx_${type}_${detected.length}`,
      type,
      label: meta.label,
      rawMatch: cleanMatch,
      triggerPhrase: cleanMatch,
    });
  };

  // 1. Scan *roleplay/vocal actions in asterisks* or <vocal tags>
  const asteriskRegex = /\*([^*]{2,80})\*|<([a-zA-Z\s_-]{2,25})>/g;
  let match: RegExpExecArray | null;
  while ((match = asteriskRegex.exec(content)) !== null) {
    const inner = (match[1] || match[2] || '').trim();
    const mapped = classifyPhraseToSoundEffect(inner);
    if (mapped) {
      addCue(mapped, `*${inner}*`);
    }
  }

  // 2. Scan conversational human vocalizations & onomatopoeia in spoken text
  const vocalPatterns: Array<{ regex: RegExp; type: KaraSoundEffectType }> = [
    { regex: /\b(hahaha+|haha+|ahah+)\b/i, type: 'laugh' },
    { regex: /\b(hehe+|teehee)\b/i, type: 'giggle' },
    { regex: /\b(mwah|smooch)\b/i, type: 'kiss' },
    { regex: /\b(mm-?hmm+|mhm+|hmm+\??)\b/i, type: 'hum' },
    { regex: /\b(aww+)\b/i, type: 'aww' },
    { regex: /\b(ooh+|oh\s+my)\b/i, type: 'tease' },
    { regex: /\b(pfft|ugh+|tsk)\b/i, type: 'scoff' },
    { regex: /\b(phew|hah\.\.\.)\b/i, type: 'sigh' },
  ];

  for (const pat of vocalPatterns) {
    const m = content.match(pat.regex);
    if (m) {
      addCue(pat.type, m[0]);
    }
  }

  // 3. If no explicit text cue matched, derive contextual human vocal cues from content & Kara's emotion/mode
  if (detected.length === 0) {
    const normEmotion = (emotionState || '').toLowerCase();
    const lowerContent = content.toLowerCase();
    const preset = MODE_VOCAL_FX_PRESETS[mode] || MODE_VOCAL_FX_PRESETS.regular;

    if (/\b(love you|missed you|adore you|sweetheart|darling|kiss|hold you)\b/i.test(lowerContent)) {
      addCue('aww', '*warm affectionate sigh*');
      if (mode === 'romantic' || mode === 'flirty') {
        addCue('kiss', '*soft kiss*');
      }
    } else if (/\b(link|opened|checked out|article|video|website|url)\b/i.test(lowerContent)) {
      addCue('hum', '*curious hum*');
      addCue('gasp', '*intrigued reaction*');
    } else if (normEmotion === 'joy' || normEmotion === 'happy' || normEmotion === 'amused' || normEmotion === 'excited') {
      addCue('laugh', '*warm laugh*');
      addCue('giggle', '*happy giggle*');
    } else if (normEmotion === 'playful' || normEmotion === 'feisty' || mode === 'bratty') {
      addCue('tease', '*playful tease*');
      addCue('giggle', '*cheeky giggle*');
    } else if (normEmotion === 'touched' || normEmotion === 'empathy' || normEmotion === 'soothing' || mode === 'parent') {
      addCue('aww', '*soft warm smile*');
      addCue('sigh', '*gentle breath*');
    } else if (normEmotion === 'flustered' || normEmotion === 'vulnerable' || mode === 'romantic') {
      addCue('breath', '*soft catch of breath*');
      addCue('sigh', '*dreamy sigh*');
    } else if (normEmotion === 'frustration' || normEmotion === 'annoyed') {
      addCue('scoff', '*playful scoff*');
    } else if (autoSwitch && preset.primaryCues.length > 0) {
      addCue(preset.primaryCues[0], `*${preset.label.toLowerCase()}*`);
    } else {
      addCue('hum', '*attentive mm-hmm*');
    }
  } else if (detected.length === 1 && content.length > 140) {
    // Add a natural secondary human vocalization for longer expressive messages
    const primary = detected[0].type;
    if (primary === 'laugh' && !seenTypes.has('giggle')) {
      addCue('breath', '*catches breath warmly*');
    } else if ((primary === 'tease' || primary === 'giggle') && mode === 'romantic') {
      addCue('kiss', '*playful kiss*');
    } else if (primary === 'hum') {
      addCue('giggle', '*soft chuckle*');
    }
  }

  return detected;
}

/**
 * Play an immediate, subtle human vocal backchannel reaction when the user sends a message,
 * shares a link, or shares a photo—making Kara feel like she is listening live in the room.
 */
export function playAutoUserTurnReactionSound(
  userMessage: string,
  mode = 'regular',
  enabled = true,
  autoSwitch = true
): DetectedSoundCue | null {
  if (!enabled) return null;
  const lower = (userMessage || '').toLowerCase();

  let type: KaraSoundEffectType = 'hum';
  let triggerPhrase = '*listening hum*';

  if (/(https?:\/\/|www\.)/i.test(lower)) {
    type = 'gasp';
    triggerPhrase = '*ooh, checking your link!*';
  } else if (/\b(love you|kiss|beautiful|gorgeous|cute|miss you|babe|baby|marry|heart)\b/i.test(lower)) {
    type = mode === 'romantic' ? 'kiss' : 'aww';
    triggerPhrase = type === 'kiss' ? '*blushes & blows a kiss*' : '*aww, melts warmly*';
  } else if (/\b(haha|lmao|lol|funny|joke|tease|bet|dare)\b/i.test(lower)) {
    type = 'giggle';
    triggerPhrase = '*giggles along*';
  } else if (/\b(sad|tired|exhausted|lonely|hurt|stressed|sorry)\b/i.test(lower)) {
    type = 'sigh';
    triggerPhrase = '*empathetic soft sigh*';
  } else if (/\?$/.test(lower.trim())) {
    type = 'thinking';
    triggerPhrase = '*thoughtful hmm*';
  } else if (autoSwitch) {
    if (mode === 'bratty') {
      type = 'tease';
      triggerPhrase = '*playful ooh*';
    } else if (mode === 'romantic') {
      type = 'breath';
      triggerPhrase = '*warm close breath*';
    } else if (mode === 'uncensored') {
      type = 'tease';
      triggerPhrase = '*intrigued ooh*';
    } else if (mode === 'parent') {
      type = 'aww';
      triggerPhrase = '*nurturing aww*';
    }
  }

  playKaraSoundEffect(type, { enabled: true, volume: 0.42, mode, autoSwitch });
  const meta = KARA_SOUND_EFFECT_CATALOG[type] || KARA_SOUND_EFFECT_CATALOG.hum;
  return {
    id: `user_turn_${type}`,
    type,
    label: meta.label,
    rawMatch: triggerPhrase,
    triggerPhrase,
  };
}

/**
 * Automatically play up to 3 detected human vocal sound effects in sequence when Kara's reply arrives
 */
export function playKaraMessageSoundSequence(
  content: string,
  mode = 'regular',
  emotionState?: string,
  enabled = true,
  autoSwitch = true
): DetectedSoundCue[] {
  const cues = extractSoundEffectsFromMessage(content, mode, emotionState, autoSwitch);
  if (!enabled || cues.length === 0) return cues;

  stopAllKaraSoundEffects();

  // Play primary vocal sound effect right away
  playKaraSoundEffect(cues[0].type, { enabled: true, volume: 0.62, mode, autoSwitch });

  // Play second distinct vocal sound effect after 520ms
  if (cues.length > 1) {
    const timer1 = setTimeout(() => {
      playKaraSoundEffect(cues[1].type, { enabled: true, volume: 0.50, mode, autoSwitch });
    }, 520);
    activeSequenceTimers.push(timer1);
  }

  // Play third distinct vocal sound effect after 1080ms if present
  if (cues.length > 2) {
    const timer2 = setTimeout(() => {
      playKaraSoundEffect(cues[2].type, { enabled: true, volume: 0.44, mode, autoSwitch });
    }, 1080);
    activeSequenceTimers.push(timer2);
  }

  return cues;
}
