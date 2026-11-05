import { KaraMode } from './firebase';

export type KaraSoundEffectType =
  | 'giggle'
  | 'laugh'
  | 'sigh'
  | 'gasp'
  | 'hum'
  | 'flirty'
  | 'tease'
  | 'kiss'
  | 'warm_chime'
  | 'thinking'
  | 'scold'
  | 'soap_bubbles';

export interface KaraSoundEffectMeta {
  id: KaraSoundEffectType;
  label: string;
  shortTag: string;
  emoji: string;
  description: string;
  category: 'vocal' | 'affection' | 'mood';
}

export const KARA_SOUND_EFFECT_CATALOG: Record<KaraSoundEffectType, KaraSoundEffectMeta> = {
  giggle: {
    id: 'giggle',
    label: 'Playful Giggle',
    shortTag: '*giggles*',
    emoji: '🤭',
    description: 'Light, bubbly melodic sparkle when Kara is amused or charmed',
    category: 'vocal',
  },
  laugh: {
    id: 'laugh',
    label: 'Warm Laugh',
    shortTag: '*laughs*',
    emoji: '😂',
    description: 'Bright, joyful harmonic cascade for funny moments and jokes',
    category: 'vocal',
  },
  sigh: {
    id: 'sigh',
    label: 'Contented Sigh',
    shortTag: '*sighs softly*',
    emoji: '😌',
    description: 'Soft, warm descending velvet chord for relief, fondness, or closeness',
    category: 'vocal',
  },
  gasp: {
    id: 'gasp',
    label: 'Surprised Gasp',
    shortTag: '*gasps*',
    emoji: '😮',
    description: 'Quick upward harmonic chime for plot twists, shock, or excitement',
    category: 'vocal',
  },
  hum: {
    id: 'hum',
    label: 'Thoughtful Hum',
    shortTag: '*hums*',
    emoji: '🎵',
    description: 'Gentle resonant two-note hum when Kara is listening or pondering',
    category: 'vocal',
  },
  flirty: {
    id: 'flirty',
    label: 'Flirty Purr',
    shortTag: '*winks*',
    emoji: '😏',
    description: 'Velvety rising harmonic interval for romantic tension and chemistry',
    category: 'affection',
  },
  tease: {
    id: 'tease',
    label: 'Bratty Tease',
    shortTag: '*smirks*',
    emoji: '😜',
    description: 'Sassy, playful staccato two-tone chime for cheeky comebacks',
    category: 'mood',
  },
  kiss: {
    id: 'kiss',
    label: 'Sweet Kiss',
    shortTag: '*kisses*',
    emoji: '💋',
    description: 'Soft, delicate bell harmonic for affection and romantic moments',
    category: 'affection',
  },
  warm_chime: {
    id: 'warm_chime',
    label: 'Heartfelt Warmth',
    shortTag: '*smiles warmly*',
    emoji: '💖',
    description: 'Tender acoustic chord for comforting or emotional connection',
    category: 'affection',
  },
  thinking: {
    id: 'thinking',
    label: 'Contemplative Pulse',
    shortTag: '*thinks*',
    emoji: '💭',
    description: 'Subtle, ultra-clean mellow note when Kara begins composing a thought',
    category: 'mood',
  },
  scold: {
    id: 'scold',
    label: 'Playful Tut-Tut',
    shortTag: '*tuts*',
    emoji: '☝️',
    description: 'Rhythmic two-note caretaker chime when Parent mode catches cheeky attitude',
    category: 'mood',
  },
  soap_bubbles: {
    id: 'soap_bubbles',
    label: 'Soap & Bubbles Wash',
    shortTag: '*scrub scrub*',
    emoji: '🧼🫧',
    description: 'Humorous cartoon bubbly lathering pops and squeaky-clean rub when mouth is washed with soap',
    category: 'mood',
  },
};

export interface ModeVocalFxPreset {
  mode: KaraMode;
  label: string;
  pitchScale: number;
  warmthCutoffHz: number;
  gainScale: number;
  primaryCues: KaraSoundEffectType[];
  description: string;
}

export const MODE_VOCAL_FX_PRESETS: Record<KaraMode, ModeVocalFxPreset> = {
  regular: {
    mode: 'regular',
    label: 'Regular Warmth',
    pitchScale: 1.0,
    warmthCutoffHz: 2200,
    gainScale: 0.85,
    primaryCues: ['warm_chime', 'giggle', 'hum', 'laugh'],
    description: 'Warm, balanced, crystal-clear acoustic resonance',
  },
  romantic: {
    mode: 'romantic',
    label: 'Romantic Velvet',
    pitchScale: 0.94,
    warmthCutoffHz: 1850,
    gainScale: 0.82,
    primaryCues: ['flirty', 'kiss', 'sigh', 'warm_chime'],
    description: 'Velvety, intimate, low-pass smoothed romantic warmth',
  },
  bratty: {
    mode: 'bratty',
    label: 'Bratty Spark',
    pitchScale: 1.08,
    warmthCutoffHz: 2400,
    gainScale: 0.85,
    primaryCues: ['tease', 'giggle', 'laugh', 'gasp'],
    description: 'Bright, lively, playful melodic intervals',
  },
  uncensored: {
    mode: 'uncensored',
    label: 'Uncensored Resonance',
    pitchScale: 0.92,
    warmthCutoffHz: 1950,
    gainScale: 0.85,
    primaryCues: ['laugh', 'hum', 'flirty', 'gasp'],
    description: 'Deep, confident, uninhibited low-mid harmonic resonance',
  },
  parent: {
    mode: 'parent',
    label: 'Caretaker Comfort',
    pitchScale: 0.98,
    warmthCutoffHz: 2050,
    gainScale: 0.82,
    primaryCues: ['warm_chime', 'scold', 'sigh', 'hum'],
    description: 'Gentle, nurturing caretaker tones with playful tut-tut cues',
  },
};

export interface DetectedSoundCue {
  type: KaraSoundEffectType;
  phrase: string;
}

let sharedSfxAudioCtx: AudioContext | null = null;
let lastSfxPlayedAtMs = 0;

function getSfxAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedSfxAudioCtx || sharedSfxAudioCtx.state === 'closed') {
      sharedSfxAudioCtx = new AudioCtx();
    }
    if (sharedSfxAudioCtx.state === 'suspended') {
      sharedSfxAudioCtx.resume().catch(() => {});
    }
    return sharedSfxAudioCtx;
  } catch {
    return null;
  }
}

function getModeVocalProfile(mode?: KaraMode): ModeVocalFxPreset {
  if (!mode) return MODE_VOCAL_FX_PRESETS.regular;
  return MODE_VOCAL_FX_PRESETS[mode] || MODE_VOCAL_FX_PRESETS.regular;
}

/**
 * Pure, static-free acoustic tone synthesizer.
 * Uses only clean sine/triangle oscillators with raised-cosine/exponential gain ramps
 * and a warm low-pass filter — zero white/pink noise buffers and zero sawtooth buzz.
 */
interface PureToneNoteOptions {
  startTime: number;
  duration: number;
  freqStart: number;
  freqEnd?: number;
  freqMid?: number;
  gainPeak: number;
  waveType?: 'sine' | 'triangle';
  harmonicRatio?: number;
  harmonicGain?: number;
  mode?: KaraMode;
}

function playPureWarmTone(ctx: AudioContext, opts: PureToneNoteOptions): void {
  const {
    startTime,
    duration,
    freqStart,
    freqEnd = freqStart,
    freqMid,
    gainPeak,
    waveType = 'sine',
    harmonicRatio = 2.0,
    harmonicGain = 0.14,
    mode,
  } = opts;

  const profile = getModeVocalProfile(mode);
  const pScale = profile.pitchScale;
  const f0 = Math.max(80, Math.min(1800, freqStart * pScale));
  const f1 = Math.max(80, Math.min(1800, freqEnd * pScale));
  const fMid = freqMid ? Math.max(80, Math.min(1800, freqMid * pScale)) : (f0 + f1) * 0.5;

  const endTime = startTime + duration;
  const safePeak = Math.max(0.001, Math.min(0.18, gainPeak * profile.gainScale));

  const osc = ctx.createOscillator();
  osc.type = waveType;
  osc.frequency.setValueAtTime(f0, startTime);
  if (freqMid !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(fMid, startTime + duration * 0.48);
  }
  osc.frequency.exponentialRampToValueAtTime(f1, endTime);

  const subOsc = ctx.createOscillator();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(f0 * harmonicRatio, startTime);
  if (freqMid !== undefined) {
    subOsc.frequency.exponentialRampToValueAtTime(
      fMid * harmonicRatio,
      startTime + duration * 0.48
    );
  }
  subOsc.frequency.exponentialRampToValueAtTime(f1 * harmonicRatio, endTime);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(harmonicGain, startTime);

  const warmthFilter = ctx.createBiquadFilter();
  warmthFilter.type = 'lowpass';
  warmthFilter.frequency.setValueAtTime(profile.warmthCutoffHz, startTime);
  warmthFilter.Q.setValueAtTime(0.65, startTime);

  const envGain = ctx.createGain();
  const attackTime = Math.min(0.025, duration * 0.28);
  envGain.gain.value = 0.0001;
  envGain.gain.setValueAtTime(0.0001, startTime);
  envGain.gain.linearRampToValueAtTime(safePeak, startTime + attackTime);
  envGain.gain.setValueAtTime(
    safePeak,
    Math.max(startTime + attackTime, endTime - duration * 0.45)
  );
  envGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  osc.connect(warmthFilter);
  subOsc.connect(subGain);
  subGain.connect(warmthFilter);
  warmthFilter.connect(envGain);
  envGain.connect(ctx.destination);

  osc.start(startTime);
  subOsc.start(startTime);
  osc.stop(endTime + 0.015);
  subOsc.stop(endTime + 0.015);
}

/**
 * Play a synthesized Kara sound effect using pure, static-free harmonic chimes.
 */
export function playKaraSoundEffect(
  effect: KaraSoundEffectType,
  options?: {
    enabled?: boolean;
    volume?: number;
    mode?: KaraMode;
    emotionState?: string;
    autoSwitch?: boolean;
  }
): void {
  if (options?.enabled === false) return;

  const nowMs = Date.now();
  if (nowMs - lastSfxPlayedAtMs < 240) {
    return;
  }
  lastSfxPlayedAtMs = nowMs;

  const ctx = getSfxAudioContext();
  if (!ctx) return;

  const resolvedEffect =
    options?.autoSwitch !== false && options?.mode
      ? resolveAutoSwitchedEffect(effect, options.mode, options.emotionState)
      : effect;

  const vol = Math.max(0.05, Math.min(1.0, options?.volume ?? 0.5)) * 0.42;
  const now = ctx.currentTime + 0.01;
  const mode = options?.mode;

  try {
    switch (resolvedEffect) {
      case 'giggle': {
        const notes = [392, 440, 523.25];
        notes.forEach((freq, idx) => {
          playPureWarmTone(ctx, {
            startTime: now + idx * 0.075,
            duration: 0.085,
            freqStart: freq * 0.97,
            freqEnd: freq * 1.04,
            gainPeak: 0.14 * vol,
            waveType: 'sine',
            mode,
          });
        });
        break;
      }

      case 'laugh': {
        const notes = [349.23, 440, 523.25, 587.33];
        notes.forEach((freq, idx) => {
          playPureWarmTone(ctx, {
            startTime: now + idx * 0.085,
            duration: 0.095,
            freqStart: freq,
            freqEnd: freq * 1.03,
            gainPeak: 0.15 * vol * (1 - idx * 0.1),
            waveType: 'triangle',
            mode,
          });
        });
        break;
      }

      case 'sigh': {
        playPureWarmTone(ctx, {
          startTime: now,
          duration: 0.34,
          freqStart: 392,
          freqMid: 349.23,
          freqEnd: 293.66,
          gainPeak: 0.13 * vol,
          waveType: 'sine',
          mode,
        });
        break;
      }

      case 'gasp': {
        playPureWarmTone(ctx, {
          startTime: now,
          duration: 0.18,
          freqStart: 329.63,
          freqMid: 493.88,
          freqEnd: 587.33,
          gainPeak: 0.14 * vol,
          waveType: 'sine',
          mode,
        });
        break;
      }

      case 'hum': {
        playPureWarmTone(ctx, {
          startTime: now,
          duration: 0.28,
          freqStart: 293.66,
          freqMid: 329.63,
          freqEnd: 349.23,
          gainPeak: 0.12 * vol,
          waveType: 'sine',
          mode,
        });
        break;
      }

      case 'flirty': {
        playPureWarmTone(ctx, {
          startTime: now,
          duration: 0.16,
          freqStart: 329.63,
          freqEnd: 392.0,
          gainPeak: 0.13 * vol,
          waveType: 'sine',
          mode: mode || 'romantic',
        });
        playPureWarmTone(ctx, {
          startTime: now + 0.12,
          duration: 0.22,
          freqStart: 392.0,
          freqEnd: 493.88,
          gainPeak: 0.14 * vol,
          waveType: 'sine',
          mode: mode || 'romantic',
        });
        break;
      }

      case 'tease': {
        playPureWarmTone(ctx, {
          startTime: now,
          duration: 0.09,
          freqStart: 440,
          freqEnd: 466.16,
          gainPeak: 0.14 * vol,
          waveType: 'triangle',
          mode: mode || 'bratty',
        });
        playPureWarmTone(ctx, {
          startTime: now + 0.1,
          duration: 0.15,
          freqStart: 523.25,
          freqEnd: 587.33,
          gainPeak: 0.14 * vol,
          waveType: 'triangle',
          mode: mode || 'bratty',
        });
        break;
      }

      case 'kiss': {
        playPureWarmTone(ctx, {
          startTime: now,
          duration: 0.14,
          freqStart: 523.25,
          freqMid: 659.25,
          freqEnd: 783.99,
          gainPeak: 0.13 * vol,
          waveType: 'sine',
          mode: mode || 'romantic',
        });
        break;
      }

      case 'warm_chime': {
        playPureWarmTone(ctx, {
          startTime: now,
          duration: 0.26,
          freqStart: 349.23,
          freqEnd: 440.0,
          gainPeak: 0.12 * vol,
          waveType: 'sine',
          mode,
        });
        break;
      }

      case 'thinking': {
        playPureWarmTone(ctx, {
          startTime: now,
          duration: 0.2,
          freqStart: 293.66,
          freqEnd: 329.63,
          gainPeak: 0.09 * vol,
          waveType: 'sine',
          mode,
        });
        break;
      }

      case 'scold': {
        [0, 0.13].forEach((offset, idx) => {
          playPureWarmTone(ctx, {
            startTime: now + offset,
            duration: 0.085,
            freqStart: idx === 0 ? 392 : 329.63,
            freqEnd: idx === 0 ? 370 : 311.13,
            gainPeak: 0.14 * vol,
            waveType: 'triangle',
            mode: mode || 'parent',
          });
        });
        break;
      }

      case 'soap_bubbles': {
        // 1. Playful faux-gasp scold intro chime (2 tones: 440Hz -> 330Hz)
        [0, 0.08].forEach((offset, idx) => {
          playPureWarmTone(ctx, {
            startTime: now + offset,
            duration: 0.07,
            freqStart: idx === 0 ? 440 : 370,
            freqEnd: idx === 0 ? 415 : 330,
            gainPeak: 0.12 * vol,
            waveType: 'triangle',
            mode: mode || 'parent',
          });
        });

        // 2. Realistic frothy lathering suds noise (gentle fizzy foam hiss)
        try {
          const bufferSize = Math.floor(ctx.sampleRate * 0.45);
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.35;
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(2400, now + 0.12);
          filter.frequency.exponentialRampToValueAtTime(1100, now + 0.52);
          filter.Q.setValueAtTime(2.2, now + 0.12);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.001, now + 0.12);
          noiseGain.gain.linearRampToValueAtTime(0.065 * vol, now + 0.22);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.54);

          whiteNoise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(ctx.destination);

          whiteNoise.start(now + 0.12);
          whiteNoise.stop(now + 0.55);
        } catch {
          // ignore buffer restriction if any
        }

        // 3. Comical bubbly lathering pops (staggered upward frequency chirps: pop pop pop!)
        const bubblePops = [
          { time: 0.15, start: 420, end: 880, dur: 0.045 },
          { time: 0.21, start: 520, end: 1100, dur: 0.04 },
          { time: 0.27, start: 480, end: 950, dur: 0.05 },
          { time: 0.34, start: 600, end: 1320, dur: 0.038 },
          { time: 0.41, start: 550, end: 1200, dur: 0.042 },
          { time: 0.48, start: 700, end: 1480, dur: 0.035 },
          { time: 0.55, start: 820, end: 1650, dur: 0.032 },
        ];
        bubblePops.forEach((b) => {
          playPureWarmTone(ctx, {
            startTime: now + b.time,
            duration: b.dur,
            freqStart: b.start,
            freqEnd: b.end,
            gainPeak: 0.16 * vol,
            waveType: 'sine',
            mode: mode || 'parent',
          });
        });

        // 4. Cartoon "squeaky clean" scrub chirp (1250Hz -> 1850Hz -> 1350Hz)
        playPureWarmTone(ctx, {
          startTime: now + 0.62,
          duration: 0.12,
          freqStart: 1250,
          freqMid: 1850,
          freqEnd: 1350,
          gainPeak: 0.12 * vol,
          waveType: 'triangle',
          mode: mode || 'parent',
        });

        // 5. Clean sparkling finish chime (E6 bell ring)
        playPureWarmTone(ctx, {
          startTime: now + 0.76,
          duration: 0.24,
          freqStart: 1318.5,
          freqEnd: 1567.98,
          gainPeak: 0.11 * vol,
          waveType: 'sine',
          mode: mode || 'parent',
        });

        // 6. Water droplet rinse bloops (bloop, bloop!)
        playPureWarmTone(ctx, {
          startTime: now + 0.9,
          duration: 0.055,
          freqStart: 1760,
          freqEnd: 880,
          gainPeak: 0.11 * vol,
          waveType: 'sine',
          mode: mode || 'parent',
        });
        playPureWarmTone(ctx, {
          startTime: now + 0.98,
          duration: 0.065,
          freqStart: 2093,
          freqEnd: 1046,
          gainPeak: 0.12 * vol,
          waveType: 'sine',
          mode: mode || 'parent',
        });
        break;
      }
    }
  } catch {
    // Ignore audio context restriction errors
  }
}

export function resolveAutoSwitchedEffect(
  baseEffect: KaraSoundEffectType,
  mode: KaraMode,
  emotionState?: string
): KaraSoundEffectType {
  const emo = (emotionState || '').toLowerCase();

  if (
    baseEffect === 'kiss' ||
    baseEffect === 'gasp' ||
    baseEffect === 'scold' ||
    baseEffect === 'laugh'
  ) {
    return baseEffect;
  }

  if (mode === 'romantic') {
    if (baseEffect === 'warm_chime' || baseEffect === 'hum') return 'flirty';
    if (baseEffect === 'tease') return 'giggle';
    if (emo.includes('flirt') || emo.includes('passion') || emo.includes('affection')) {
      return 'flirty';
    }
  } else if (mode === 'bratty') {
    if (baseEffect === 'warm_chime' || baseEffect === 'hum') return 'tease';
    if (baseEffect === 'flirty') return 'tease';
    if (emo.includes('sassy') || emo.includes('cheeky') || emo.includes('playful')) {
      return 'tease';
    }
  } else if (mode === 'parent') {
    if (baseEffect === 'tease' || baseEffect === 'flirty') return 'warm_chime';
    if (emo.includes('scold') || emo.includes('stern')) return 'scold';
  } else if (mode === 'uncensored') {
    if (baseEffect === 'warm_chime') return 'hum';
    if (emo.includes('amused') || emo.includes('bold')) return 'laugh';
  }

  return baseEffect;
}

export function classifyPhraseToSoundEffect(rawPhrase: string): KaraSoundEffectType | null {
  const p = rawPhrase.toLowerCase().trim();
  if (!p) return null;

  if (/\b(kiss|kisses|muah|smooch|peck|blows a kiss|lips)\b/.test(p)) {
    return 'kiss';
  }
  if (/\b(giggle|giggles|giggling|chuckle|chuckles|snicker|snickers|teehee|hehe)\b/.test(p)) {
    return 'giggle';
  }
  if (/\b(laugh|laughs|laughing|cackle|cackles|bursts out laughing|haha|lol|rofl)\b/.test(p)) {
    return 'laugh';
  }
  if (/\b(sigh|sighs|sighing|exhale|exhales|breath|breathes|melts|relieved)\b/.test(p)) {
    return 'sigh';
  }
  if (/\b(gasp|gasps|gasping|eyes widen|jaw drops|shocked|startled)\b/.test(p)) {
    return 'gasp';
  }
  if (
    /\b(soap|scrub|scrubbing|suds|bubbles|bubble pop|bubbles pop|wash your mouth|mouth with soap|mouth washed|lather|rinse|squeaky clean)\b/.test(
      p
    )
  ) {
    return 'soap_bubbles';
  }
  if (/\b(scold|scolds|wags finger|tuts|shakes head|language)\b/.test(p)) {
    return 'scold';
  }
  if (/\b(wink|winks|bites lip|purr|purrs|leans in close|traces|blush|blushes|flirt)\b/.test(p)) {
    return 'flirty';
  }
  if (
    /\b(smirk|smirks|rolls eyes|eye roll|crosses arms|raises an eyebrow|scoffs|tease|teases|poke|pokes)\b/.test(
      p
    )
  ) {
    return 'tease';
  }
  if (/\b(hum|hums|humming|ponders|tilts head|taps chin|thinks)\b/.test(p)) {
    return 'hum';
  }
  if (/\b(smile|smiles|grin|grins|hug|hugs|cuddle|cuddles|warmly|gently|softly)\b/.test(p)) {
    return 'warm_chime';
  }
  return null;
}

export function extractSoundEffectsFromMessage(
  content: string,
  mode?: KaraMode,
  emotionState?: string,
  autoSwitch = true
): DetectedSoundCue[] {
  if (!content) return [];
  const detected: DetectedSoundCue[] = [];

  const addUnique = (fx: KaraSoundEffectType, phrase: string) => {
    const mapped = autoSwitch && mode ? resolveAutoSwitchedEffect(fx, mode, emotionState) : fx;
    if (!detected.some((d) => d.type === mapped)) {
      detected.push({ type: mapped, phrase });
    }
  };

  const asteriskMatches = content.match(/\*([^*]+)\*/g) || [];
  for (const raw of asteriskMatches) {
    const inner = raw.slice(1, -1).trim();
    const classified = classifyPhraseToSoundEffect(inner);
    if (classified) {
      addUnique(classified, inner);
    }
  }

  const lower = content.toLowerCase();
  if (content.includes('🧼') || content.includes('🫧') || content.includes('🧽')) {
    addUnique('soap_bubbles', 'bubbles & soap suds');
  }
  if (/\b(haha|hehe|lmao|rofl|hilarious)\b/.test(lower)) {
    addUnique('giggle', 'laughs playfully');
  }
  if (/\b(muah|smooch|xoxo)\b/.test(lower)) {
    addUnique('kiss', 'blows a kiss');
  }
  if (/\b(ugh|pssh|whatever)\b/.test(lower) && mode === 'bratty') {
    addUnique('tease', 'smirks playfully');
  }
  if (/\b(hmm+|let me think)\b/.test(lower)) {
    addUnique('hum', 'hums thoughtfully');
  }

  const emo = (emotionState || '').toLowerCase();
  if (detected.length === 0) {
    if (emo.includes('amused') || emo.includes('joy') || emo.includes('playful')) {
      addUnique('giggle', 'giggles');
    } else if (emo.includes('flirt') || emo.includes('romantic') || emo.includes('passion')) {
      addUnique('flirty', 'winks warmly');
    } else if (emo.includes('feisty') || emo.includes('bratty') || emo.includes('sassy')) {
      addUnique('tease', 'smirks');
    } else if (emo.includes('touched') || emo.includes('fond') || emo.includes('tender')) {
      addUnique('sigh', 'sighs softly');
    } else if (emo.includes('surprised') || emo.includes('excited')) {
      addUnique('gasp', 'gasps');
    } else if (emo.includes('protective') || emo.includes('caring')) {
      addUnique('warm_chime', 'smiles warmly');
    }
  }

  if (detected.length === 0 && mode) {
    if (mode === 'romantic') addUnique('flirty', KARA_SOUND_EFFECT_CATALOG.flirty.shortTag);
    else if (mode === 'bratty') addUnique('tease', KARA_SOUND_EFFECT_CATALOG.tease.shortTag);
    else if (mode === 'parent') addUnique('warm_chime', KARA_SOUND_EFFECT_CATALOG.warm_chime.shortTag);
    else if (mode === 'uncensored') addUnique('hum', KARA_SOUND_EFFECT_CATALOG.hum.shortTag);
    else addUnique('warm_chime', KARA_SOUND_EFFECT_CATALOG.warm_chime.shortTag);
  }

  return detected.slice(0, 2);
}

/**
 * Automatically infer and play a single subtle cue when the user sends a message.
 */
export function playAutoUserTurnReactionSound(
  userText: string,
  activeMode: KaraMode,
  enabled = true,
  autoSwitch = true
): KaraSoundEffectType | null {
  if (!enabled || !userText) return null;
  const lower = userText.toLowerCase();

  let chosen: KaraSoundEffectType = 'hum';

  if (
    (/\b(fuck|shit|bitch|asshole|damn|crap|hell|bastard|ass|dick|piss|cunt)\b/.test(lower) ||
      /\b(soap|bubbles|suds|mouth with soap|wash my mouth|clean mouth)\b/.test(lower) ||
      userText.includes('🧼') ||
      userText.includes('🫧') ||
      userText.includes('🧽')) &&
    activeMode === 'parent'
  ) {
    chosen = 'soap_bubbles';
  } else if (/\b(love you|kiss|sexy|hot|babe|sweetheart|darling|miss you|cuddle)\b/.test(lower)) {
    chosen = activeMode === 'romantic' ? 'kiss' : 'flirty';
  } else if (/\b(haha|lol|lmao|funny|joke|roast)\b/.test(lower)) {
    chosen = 'giggle';
  } else if (/\b(wow|omg|no way|shocking|seriously|wtf)\b/.test(lower)) {
    chosen = 'gasp';
  } else if (activeMode === 'bratty') {
    chosen = 'tease';
  } else if (activeMode === 'romantic') {
    chosen = 'flirty';
  } else if (activeMode === 'parent') {
    chosen = 'warm_chime';
  } else {
    chosen = 'thinking';
  }

  playKaraSoundEffect(chosen, {
    enabled: true,
    volume: 0.32,
    mode: activeMode,
    autoSwitch,
  });

  return chosen;
}

/**
 * Play a single gentle cue for an incoming Kara assistant reply when TTS speech is not active.
 */
export function playKaraMessageSoundSequence(
  content: string,
  mode?: KaraMode,
  emotionState?: string,
  enabled = true,
  autoSwitch = true
): DetectedSoundCue[] {
  if (!enabled) return [];
  const effects = extractSoundEffectsFromMessage(content, mode, emotionState, autoSwitch);
  if (effects.length > 0) {
    playKaraSoundEffect(effects[0].type, {
      enabled: true,
      volume: 0.35,
      mode,
      emotionState,
      autoSwitch,
    });
  }
  return effects;
}

/**
 * Directly play the hilarious soap bubbles discipline audio effect (bubbly lathering pops + cartoon squeaky clean rub).
 */
export function playSoapDisciplineSoundEffect(volume = 0.42): void {
  playKaraSoundEffect('soap_bubbles', {
    enabled: true,
    volume,
    mode: 'parent',
  });
}

