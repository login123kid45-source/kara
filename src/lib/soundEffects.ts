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
  | 'scold';

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
    emoji: '🧼',
    description: 'Rhythmic two-note caretaker chime when Parent mode catches bad language',
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
  if (/\b(scold|scolds|wags finger|tuts|shakes head|soap|wash your mouth|language)\b/.test(p)) {
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

  if (/\b(fuck|shit|bitch|asshole|damn|crap|hell)\b/.test(lower) && activeMode === 'parent') {
    chosen = 'scold';
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
