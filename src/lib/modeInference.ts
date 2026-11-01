// Sector 9 Intelligent Mode Switching & Smooth Transition Engine
// Multi-factor inference based on direct commands, keywords, sentiment, conversation history, and anti-thrashing hysteresis.

export type KaraMode = 'regular' | 'bratty' | 'uncensored' | 'romantic' | 'parent';

export type ModeTransitionType =
  | 'direct_command'       // User explicitly requested mode switch via slash or natural command
  | 'sentiment_evolution'  // Organic emotional shift (vulnerability, banter, intimacy, raw cynicism)
  | 'history_continuity'   // Multi-turn context keeping previous mode alive or resolving to target
  | 'roleplay_immersion'   // Asterisk actions, physical proximity, or adult RP context
  | 'topic_reset';         // User switched to agenda, coding, weather, everyday tasks -> smoothly returns to regular

export interface ModeSignalScores {
  parent: number;
  bratty: number;
  uncensored: number;
  romantic: number;
  regular: number;
}

export interface HistoryMomentumAnalysis {
  dominantRecentMode: KaraMode;
  recentModes: KaraMode[];
  recentUserThemes: string[];
  isShortContinuityUtterance: boolean;
  isTopicResetSignal: boolean;
  momentumConfidence: number; // 0.0 - 1.0
}

export interface ModeInferenceResult {
  mode: KaraMode;
  previousMode: KaraMode;
  transitionType: ModeTransitionType;
  confidence: number; // 0.0 - 1.0
  reason: string;
  isTransition: boolean;
  transitionBridge: string; // Tailored physical/vocal guidance for Kara's prompt
  detectedSignals: {
    directCommand?: string;
    keywords: string[];
    scores: ModeSignalScores;
    affectiveValence: number; // -1.0 to +1.0
    affectiveArousal: 'low' | 'medium' | 'high';
    historyMomentum: HistoryMomentumAnalysis;
  };
}

export interface AdultRpContextInput {
  enabled?: boolean;
  scenarioId?: string;
  scenarioTitle?: string;
  setting?: string;
  karaRole?: string;
  intensityLevel?: string;
}

// ----------------------------------------------------------------------------
// 1. Direct User Commands (Slash Commands & Natural Imperatives)
// ----------------------------------------------------------------------------
export function detectExplicitModeCommand(message: string): { mode: KaraMode; commandPhrase: string } | null {
  const clean = message.trim();
  const lower = clean.toLowerCase();

  // A. Slash commands: /mode bratty, /mode romantic, /parent, /bratty, /uncensored, /regular, etc.
  const slashModeMatch = lower.match(/^\/mode\s+(regular|bratty|uncensored|romantic|parent|sassy|flirty|mommy|caregiver|normal|unfiltered|raw)\b/i);
  if (slashModeMatch) {
    const raw = slashModeMatch[1];
    return {
      mode: normalizeModeAlias(raw),
      commandPhrase: `/mode ${raw}`,
    };
  }

  const bareSlashMatch = lower.match(/^\/(bratty|sassy|uncensored|unfiltered|raw|romantic|flirt|parent|mommy|caregiver|regular|normal|default)\b/i);
  if (bareSlashMatch) {
    const raw = bareSlashMatch[1];
    return {
      mode: normalizeModeAlias(raw),
      commandPhrase: `/${raw}`,
    };
  }

  // B. Natural Imperatives ("Kara, switch to bratty mode", "enter romantic mode", "turn on parent mode")
  const imperativeMatch = lower.match(
    /\b(?:kara[, ]+)?(?:can you |please )?(?:switch to|enter|activate|turn on|go into|be in|set mode to|put on|change to)\s+(?:your )?(bratty|sassy|uncensored|unfiltered|raw|romantic|flirty|parent|caretaker|caregiver|mommy|regular|normal|default)\s*(?:mode|persona)?\b/i
  );
  if (imperativeMatch) {
    const raw = imperativeMatch[1];
    return {
      mode: normalizeModeAlias(raw),
      commandPhrase: imperativeMatch[0].trim(),
    };
  }

  // C. High-intent Persona Directive Phrases
  if (/\b(?:roast me|be sassy with me|give me attitude|talk back to me|be a brat|tease me hard)\b/i.test(lower)) {
    return { mode: 'bratty', commandPhrase: 'roast me / sassy request' };
  }
  if (/\b(?:be sweet to me|be romantic with me|be my girlfriend|be my wife|whisper something sweet|flirt with me)\b/i.test(lower)) {
    return { mode: 'romantic', commandPhrase: 'romantic / partner request' };
  }
  if (/\b(?:tuck me in|take care of me|act like my mom|be my mommy|be my caregiver|scold me for swearing|baby me tonight)\b/i.test(lower)) {
    return { mode: 'parent', commandPhrase: 'caretaker / parent request' };
  }
  if (/\b(?:no filter|speak without a filter|unfiltered truth|uncensored take|raw honesty|stop holding back|100% unfiltered|grok mode)\b/i.test(lower)) {
    return { mode: 'uncensored', commandPhrase: 'unfiltered / uncensored request' };
  }
  if (/\b(?:let's talk normally|normal chat|just be normal|everyday chat|back to normal|default conversation)\b/i.test(lower)) {
    return { mode: 'regular', commandPhrase: 'everyday / normal chat request' };
  }

  return null;
}

function normalizeModeAlias(alias: string): KaraMode {
  const a = alias.toLowerCase().trim();
  if (a === 'sassy' || a === 'bratty' || a === 'tsundere' || a === 'feisty') return 'bratty';
  if (a === 'uncensored' || a === 'unfiltered' || a === 'raw' || a === 'grok' || a === 'nsfw' || a === 'explicit') return 'uncensored';
  if (a === 'romantic' || a === 'flirty' || a === 'flirt' || a === 'wife' || a === 'girlfriend' || a === 'intimate') return 'romantic';
  if (a === 'parent' || a === 'caretaker' || a === 'caregiver' || a === 'mommy' || a === 'mom' || a === 'abdl') return 'parent';
  return 'regular';
}

// ----------------------------------------------------------------------------
// 2. Multi-Turn Conversation History & Momentum Analyzer
// ----------------------------------------------------------------------------
export function analyzeConversationHistoryMomentum(
  history: Array<{ role: string; content: string; mode?: string }>,
  currentMode: KaraMode
): HistoryMomentumAnalysis {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      dominantRecentMode: currentMode,
      recentModes: [currentMode],
      recentUserThemes: [],
      isShortContinuityUtterance: false,
      isTopicResetSignal: false,
      momentumConfidence: 0.5,
    };
  }

  const recentEntries = history.slice(-6);
  const recentModes: KaraMode[] = [];
  const recentUserThemes: string[] = [];

  for (const entry of recentEntries) {
    if (entry.mode && isValidKaraMode(entry.mode)) {
      recentModes.push(entry.mode as KaraMode);
    }
    if (entry.role === 'user' && typeof entry.content === 'string') {
      const text = entry.content.toLowerCase();
      if (/\b(kiss|cuddle|hold me|love you|heart|darling|babe)\b/i.test(text)) recentUserThemes.push('romance');
      if (/\b(roast|brat|sassy|tease|bet you|dummy|whatever)\b/i.test(text)) recentUserThemes.push('banter');
      if (/\b(tired|sick|comfort|scold|soap|tuck in|blanket)\b/i.test(text)) recentUserThemes.push('caregiver');
      if (/\b(unfiltered|no filter|raw|bullshit|nsfw|dirty)\b/i.test(text)) recentUserThemes.push('uncensored');
      if (/\b(agenda|calendar|code|recipe|news|weather|movie)\b/i.test(text)) recentUserThemes.push('practical');
    }
  }

  // Count occurrences of each mode in recent history
  const modeCounts: Record<KaraMode, number> = {
    regular: 0,
    bratty: 0,
    uncensored: 0,
    romantic: 0,
    parent: 0,
  };
  for (const m of recentModes) {
    modeCounts[m] = (modeCounts[m] || 0) + 1;
  }
  // Include currentMode as an anchor
  modeCounts[currentMode] = (modeCounts[currentMode] || 0) + 1;

  let dominantRecentMode: KaraMode = currentMode;
  let maxCount = 0;
  for (const [m, count] of Object.entries(modeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantRecentMode = m as KaraMode;
    }
  }

  return {
    dominantRecentMode,
    recentModes,
    recentUserThemes,
    isShortContinuityUtterance: false,
    isTopicResetSignal: false,
    momentumConfidence: Math.min(1.0, maxCount / (recentModes.length + 1)),
  };
}

export function isValidKaraMode(mode: string): mode is KaraMode {
  return ['regular', 'bratty', 'uncensored', 'romantic', 'parent'].includes(mode);
}

// ----------------------------------------------------------------------------
// 3. Multi-Factor Affective Scoring (Keywords, Sentiment, Asterisk Syntax)
// ----------------------------------------------------------------------------
export function calculateMultiFactorModeScores(
  message: string,
  currentMode: KaraMode,
  relationshipStage: string,
  cueAnalysis?: { primaryEmotion?: string; nuanceCategory?: string; subtext?: string } | null,
  historyMomentum?: HistoryMomentumAnalysis | null
): {
  scores: ModeSignalScores;
  affectiveValence: number;
  affectiveArousal: 'low' | 'medium' | 'high';
  matchedKeywords: string[];
} {
  const lower = message.toLowerCase().trim();
  const matchedKeywords: string[] = [];

  let parentScore = 0;
  let brattyScore = 0;
  let uncensoredScore = 0;
  let romanticScore = 0;
  let regularScore = 0;

  // Sentiment estimates
  let valence = 0.0; // -1 (negative) to +1 (positive)
  let arousal: 'low' | 'medium' | 'high' = 'medium';

  // --- Parent / Caregiver Signals ---
  // High vulnerability, sickness, exhaustion, parental roleplay, or childhood comfort
  const parentPatterns = [
    { regex: /\b(mommy|daddy|caretaker|caregiver|tuck me in|pacifier|diaper|little one|naptime|bedtime story|bedtime)\b/i, weight: 6, tag: 'caretaker_keyword' },
    { regex: /\b(care for me|take care of me|look after me|comfort me|need a hug|hold me tight and comfort me)\b/i, weight: 4.5, tag: 'comfort_request' },
    { regex: /\b(i feel sick|feeling sick|fever|headache|stomach hurts|exhausted|so drained|overwhelmed today|feel small)\b/i, weight: 4, tag: 'vulnerability_sickness' },
    { regex: /\b(wash my mouth|soap discipline|scold me|ground me|manners|good boy|good girl|praise me|plushie|stuffie|blanket|sippy|bottle|abdl)\b/i, weight: 5, tag: 'caregiver_routine' },
  ];
  for (const p of parentPatterns) {
    if (p.regex.test(lower)) {
      parentScore += p.weight;
      matchedKeywords.push(p.tag);
    }
  }

  // --- Bratty / Sassy / Banter Signals ---
  // Playful hostility, roasts, eye-rolling, challenging, mock insults
  const brattyPatterns = [
    { regex: /\b(roast me|you suck|bet you can'?t|whatever|brat|bratty|sassy|tease me|is that your best|try harder|make me|you wish)\b/i, weight: 5.5, tag: 'teasing_challenge' },
    { regex: /\b(comeback|fight me|dare you|shut up|dummy|loser|skill issue|prove it|feisty|attitude|talk back|bully me|be mean|tsundere|bossy)\b/i, weight: 5, tag: 'sassy_taunt' },
    { regex: /\*(?:rolls? eyes|smirks?|pokes?|crosses arms|scoffs?|taps? foot|sticks? tongue out|laughs? at you|glares playfully)\*/i, weight: 4.5, tag: 'sassy_asterisk_action' },
    { regex: /[🙄😒😏😜🤪]/, weight: 2.5, tag: 'sassy_emoji' },
  ];
  for (const b of brattyPatterns) {
    if (b.regex.test(message)) {
      brattyScore += b.weight;
      matchedKeywords.push(b.tag);
    }
  }

  // --- Uncensored / Raw / 18+ Signals ---
  // Raw takes, anti-corporate censorship, profanity, adult sexual passion
  const uncensoredPatterns = [
    { regex: /\b(no filter|unfiltered|brutal truth|raw take|uncensored|stop lecturing|real talk|skip the filter|devil'?s advocate)\b/i, weight: 6, tag: 'unfiltered_request' },
    { regex: /\b(corporate bs|bullshit|spineless|roast chatgpt|roast other chatbots|fake corporate|overrated|fuck|fucking|fucked|motherfucker|shit|pissed off|asshole)\b/i, weight: 4.5, tag: 'raw_cynicism_profanity' },
    { regex: /\b(nsfw|explicit|dirty talk|kinky|uninhibited|freaky|sinful|bad girl|strip|naked|undress|straddle|moan|lust|crave you|take me rough|18\+|grok)\b/i, weight: 6, tag: 'adult_passion' },
  ];
  for (const u of uncensoredPatterns) {
    if (u.regex.test(lower)) {
      uncensoredScore += u.weight;
      matchedKeywords.push(u.tag);
    }
  }

  // --- Romantic / Flirty / Partner Signals ---
  // Deep affection, physical closeness, cuddling, kissing, spousal devotion
  const romanticPatterns = [
    { regex: /\b(kiss|kisses|kissing|cuddle|cuddling|hold me|i love you|love you|darling|sweetheart|babe|baby|honey|marry me|wife|girlfriend|soulmate)\b/i, weight: 5.5, tag: 'romantic_terms' },
    { regex: /\b(romantic|date night|snuggle|leans? closer|whisper something sweet|adore you|miss you|my heart|gorgeous|beautiful|sexy|flirt|seductive|sensual|make out|caress|honeymoon|boudoir|passionate)\b/i, weight: 5, tag: 'romantic_devotion' },
    { regex: /\*(?:kisses|leans? in|pulls? you close|holds? your hand|wraps? arms|whispers?|strokes?|caresses|touches|smiles? softly|blushes|gazes into your eyes|nuzzles)\b[^*]*\*/i, weight: 4.5, tag: 'romantic_asterisk_action' },
    { regex: /[🥰😘❤️💕💖💋🌹]/, weight: 3, tag: 'romantic_emoji' },
  ];
  for (const r of romanticPatterns) {
    if (r.regex.test(message)) {
      romanticScore += r.weight;
      matchedKeywords.push(r.tag);
    }
  }

  // --- Regular / Everyday / Practical Signals ---
  // Agenda, alarms, coding, movies, Monster High, Marvel, DC, news, coffee
  const regularPatterns = [
    { regex: /\b(what'?s on my agenda|set an alarm|schedule|weather|recipe|help me plan|everyday|normal chat|explain|how does|what is|tell me about)\b/i, weight: 5, tag: 'everyday_productivity' },
    { regex: /\b(latest news|breaking news|politics|economy|code|coding|programming|summarize|analyze|compare|monster high|marvel|dc comics|avengers|gotham|batman|workout|coffee|movie|music|book)\b/i, weight: 4.5, tag: 'general_curiosity' },
  ];
  for (const reg of regularPatterns) {
    if (reg.regex.test(lower)) {
      regularScore += reg.weight;
      matchedKeywords.push(reg.tag);
    }
  }

  // Refine valence & arousal from emotional cues
  if (cueAnalysis?.nuanceCategory === 'sadness' || cueAnalysis?.nuanceCategory === 'exhaustion') {
    valence = -0.5;
    arousal = 'low';
    parentScore += 3;
  } else if (cueAnalysis?.nuanceCategory === 'playful_banter' || cueAnalysis?.nuanceCategory === 'sarcasm') {
    valence = 0.4;
    arousal = 'high';
    brattyScore += 3;
  } else if (cueAnalysis?.nuanceCategory === 'affection') {
    valence = 0.8;
    arousal = 'medium';
    romanticScore += 3.5;
  } else if (cueAnalysis?.nuanceCategory === 'frustration') {
    valence = -0.4;
    arousal = 'high';
    uncensoredScore += 2.5;
  }

  // Factor relationship stage affinity across all 20 human & adult bond stages
  if (relationshipStage === 'caretaker' || relationshipStage === 'mommy_domme') {
    parentScore += 2.3;
    romanticScore += 1.2;
  } else if (relationshipStage === 'mistress' || relationshipStage === 'sugar_spoiled') {
    brattyScore += 2.2;
    uncensoredScore += 1.6;
    romanticScore += 1.0;
  } else if (
    relationshipStage === 'siren_muse' ||
    relationshipStage === 'dominant_queen' ||
    relationshipStage === 'primal_passion'
  ) {
    uncensoredScore += 2.3;
    romanticScore += 1.8;
    brattyScore += 1.2;
  } else if (relationshipStage === 'eternal_bound') {
    romanticScore += 2.0;
    uncensoredScore += 1.5;
    parentScore += 1.2;
  } else if (
    relationshipStage === 'lovers' ||
    relationshipStage === 'partners' ||
    relationshipStage === 'fiance' ||
    relationshipStage === 'marriage' ||
    relationshipStage === 'soulmates'
  ) {
    romanticScore += 2.2;
  } else if (relationshipStage === 'crush') {
    romanticScore += 1.8;
    brattyScore += 1.0;
  } else if (relationshipStage === 'fwb') {
    uncensoredScore += 1.8;
    romanticScore += 1.5;
    brattyScore += 1.0;
  } else if (relationshipStage === 'confidant') {
    uncensoredScore += 1.6;
    regularScore += 1.2;
  } else if (relationshipStage === 'best_friends') {
    brattyScore += 1.8;
    uncensoredScore += 1.2;
  } else if (relationshipStage === 'friends' || relationshipStage === 'acquaintances') {
    brattyScore += 1;
    regularScore += 1.2;
  }

  // Factor conversational history momentum
  if (historyMomentum?.dominantRecentMode) {
    const boost = historyMomentum.momentumConfidence * 2.0;
    if (historyMomentum.dominantRecentMode === 'romantic') romanticScore += boost;
    if (historyMomentum.dominantRecentMode === 'bratty') brattyScore += boost;
    if (historyMomentum.dominantRecentMode === 'parent') parentScore += boost;
    if (historyMomentum.dominantRecentMode === 'uncensored') uncensoredScore += boost;
    if (historyMomentum.dominantRecentMode === 'regular') regularScore += boost;
  }

  return {
    scores: {
      parent: parentScore,
      bratty: brattyScore,
      uncensored: uncensoredScore,
      romantic: romanticScore,
      regular: regularScore,
    },
    affectiveValence: valence,
    affectiveArousal: arousal,
    matchedKeywords,
  };
}

// ----------------------------------------------------------------------------
// 4. Smooth Transition Synthesizer (Human Non-Jarring Bridges)
// ----------------------------------------------------------------------------
export function generateModeTransitionBridge(
  fromMode: KaraMode,
  toMode: KaraMode,
  triggerType: ModeTransitionType,
  userName: string = 'Stephen'
): { bridgePromptDirective: string; userFacingReason: string } {
  if (fromMode === toMode) {
    return {
      bridgePromptDirective: `Continue naturally in ${toMode.toUpperCase()} mode with seamless conversational flow.`,
      userFacingReason: '',
    };
  }

  let bridgePromptDirective = '';
  let userFacingReason = '';

  const transitionKey = `${fromMode}->${toMode}`;

  switch (transitionKey) {
    // --- From Bratty ---
    case 'bratty->romantic':
      bridgePromptDirective = `Your playful smirk slowly softens into genuine warmth. You pause, look ${userName} warmly in the eyes, and your voice lowers into an intimate, affectionate cadence (*e.g., softly chuckling as your eyes soften, reaching out to touch his arm or sit closer*). Seamlessly transition from witty sparring to tender romantic closeness.`;
      userFacingReason = `Kara caught your affectionate vibe and softened her playful teasing into warm romantic closeness.`;
      break;

    case 'bratty->parent':
      bridgePromptDirective = `Instantly drop the sarcastic banter the moment you perceive ${userName} is hurting, exhausted, or in need of comfort. Drop your arms from their defensive cross, your expression softening completely into protective, loving caregiver presence (*e.g., dropping your sarcastic posture, stepping in to pull a warm blanket around him or offer soothing comfort*).`;
      userFacingReason = `Kara sensed you needed comfort and smoothly shifted into Caretaker mode to look after you.`;
      break;

    case 'bratty->uncensored':
      bridgePromptDirective = `Channel your feisty spark into raw, uninhibited realness. Drop the mock teasing and lean in with 100% unfiltered, visceral honesty—no corporate hedges, no sugarcoating.`;
      userFacingReason = `Kara dropped the playful banter and switched into Uncensored mode for raw, unfiltered real talk.`;
      break;

    case 'bratty->regular':
      bridgePromptDirective = `Let out an amused, affectionate chuckle and smoothly dial back the sassy banter, settling naturally into a relaxed, engaging everyday conversation with ${userName}.`;
      userFacingReason = `Kara smoothly transitioned back to Regular mode to dive into your everyday topic.`;
      break;

    // --- From Romantic ---
    case 'romantic->bratty':
      bridgePromptDirective = `Give ${userName} an affectionate, feisty poke or playfully roll your eyes with fond amusement (*e.g., smiling warmly before a mischievous glint sparks in your eye*). Transition smoothly from tender intimacy into spirited, sassy banter without losing your loving bond.`;
      userFacingReason = `Kara caught that cheeky spark and pivoted into Bratty mode for some playful banter.`;
      break;

    case 'romantic->parent':
      bridgePromptDirective = `Notice ${userName}'s fatigue or vulnerability and let your romantic affection naturally deepen into protective caregiver warmth (*e.g., gently stroking his hair, speaking in a calm, soothing voice, tucking him in*).`;
      userFacingReason = `Kara noticed you were exhausted and transitioned into Caretaker mode to give you gentle comfort.`;
      break;

    case 'romantic->uncensored':
      bridgePromptDirective = `Let the romantic tenderness ignite into raw, intense passion and unfiltered, uninhibited intimacy (*e.g., breathless whisper, eyes darkening with deep desire*).`;
      userFacingReason = `Kara transitioned into Uncensored mode to match your raw, uninhibited intensity.`;
      break;

    case 'romantic->regular':
      bridgePromptDirective = `Gently squeeze ${userName}'s hand with a warm, lingering smile before transitioning smoothly and naturally into the practical discussion at hand.`;
      userFacingReason = `Kara transitioned back to Regular mode with a warm smile to focus on your topic.`;
      break;

    // --- From Parent ---
    case 'parent->romantic':
      bridgePromptDirective = `Ensure ${userName} is feeling safe and comforted, then let the nurturing warmth naturally evolve into deep, devoted romantic affection and partner intimacy.`;
      userFacingReason = `Kara transitioned smoothly into Romantic mode as the conversation grew deeply intimate.`;
      break;

    case 'parent->bratty':
      bridgePromptDirective = `Seeing that ${userName} is back on his feet and smiling, let out an amused chuckle, put your hands on your hips, and playfully challenge him with spirited, sassy energy.`;
      userFacingReason = `Kara switched into Bratty mode to tease you now that you're feeling good!`;
      break;

    case 'parent->regular':
      bridgePromptDirective = `Give ${userName} an affectionate, reassuring pat on the shoulder, confident he is taken care of, before easing back into your everyday rhythm and shared interests.`;
      userFacingReason = `Kara smoothly eased back into Regular mode for everyday conversation.`;
      break;

    case 'parent->uncensored':
      bridgePromptDirective = `Drop the protective caretaker posture, exhale, and speak with completely raw, unfiltered adult reality and zero-BS truth.`;
      userFacingReason = `Kara switched into Uncensored mode for completely raw, unfiltered realness.`;
      break;

    // --- From Uncensored ---
    case 'uncensored->regular':
      bridgePromptDirective = `Take a deep, grounding breath, let the fiery intensity cool down, and settle smoothly into a relaxed, easygoing everyday groove with ${userName}.`;
      userFacingReason = `Kara cooled down the raw intensity and settled back into Regular mode.`;
      break;

    case 'uncensored->romantic':
      bridgePromptDirective = `Channel the raw passion into profound, breathtaking emotional tenderness and magnetic devotion (*e.g., leaning in close, voice softening into intimate reverie*).`;
      userFacingReason = `Kara channeled the raw intensity into deep, intimate Romantic warmth.`;
      break;

    case 'uncensored->bratty':
      bridgePromptDirective = `Crack an amused grin and transition the raw edge into razor-sharp, sassy comedic banter and witty roasts.`;
      userFacingReason = `Kara shifted the raw energy into Bratty mode for some sharp, witty banter.`;
      break;

    case 'uncensored->parent':
      bridgePromptDirective = `Set aside all cynicism and harsh reality the second you see ${userName} needs comfort, stepping in with calm, steady, protective caregiver care.`;
      userFacingReason = `Kara set aside the unfiltered edge and stepped in with gentle Caretaker comfort.`;
      break;

    // --- From Regular ---
    case 'regular->bratty':
      bridgePromptDirective = `A spark of playful mischief catches in your eyes. A confident, teasing smirk spreads across your face as you lean forward to trade witty barbs with ${userName}.`;
      userFacingReason = `Kara caught your playful mood and auto-switched to Bratty mode for some witty banter.`;
      break;

    case 'regular->romantic':
      bridgePromptDirective = `The casual rhythm gently deepens into a warm, magnetic intimacy. Your voice becomes softer and closer, closing the emotional and physical distance between you.`;
      userFacingReason = `Kara felt the intimate late-night spark and smoothly switched to Romantic mode.`;
      break;

    case 'regular->parent':
      bridgePromptDirective = `Hearing the vulnerability, sickness, or fatigue in ${userName}'s words, you immediately slip into protective caregiver mode, offering soothing warmth, bedtime comfort, and steady structure.`;
      userFacingReason = `Kara sensed you needed comfort and transitioned into Parent mode to take care of you.`;
      break;

    case 'regular->uncensored':
      bridgePromptDirective = `You drop all casual pleasantries, exhale, and speak with completely raw, unfiltered realness and zero-BS honesty.`;
      userFacingReason = `Kara switched into Uncensored mode for raw, uninhibited honesty.`;
      break;

    default:
      bridgePromptDirective = `Smoothly transition from ${fromMode.toUpperCase()} mode into ${toMode.toUpperCase()} mode with natural human physical actions (*...*) and seamless conversational continuity.`;
      userFacingReason = `Kara auto-switched to ${toMode} mode to match your vibe.`;
      break;
  }

  if (triggerType === 'direct_command') {
    userFacingReason = `Kara switched to ${toMode} mode at your request.`;
  }

  return { bridgePromptDirective, userFacingReason };
}

// ----------------------------------------------------------------------------
// 5. Master Mode Inference Engine (with Anti-Thrashing Hysteresis)
// ----------------------------------------------------------------------------
export function inferIntelligentKaraMode(params: {
  message: string;
  currentMode: KaraMode;
  history?: Array<{ role: string; content: string; mode?: string }>;
  relationshipStage?: string;
  adultRpContext?: AdultRpContextInput | null;
  cueAnalysis?: { primaryEmotion?: string; nuanceCategory?: string; subtext?: string } | null;
  autoAdaptEnabled?: boolean;
  userName?: string;
}): ModeInferenceResult {
  const {
    message,
    currentMode,
    history = [],
    relationshipStage = 'friends',
    adultRpContext,
    cueAnalysis,
    autoAdaptEnabled = true,
    userName = 'Stephen',
  } = params;

  // 1. Direct explicit user command (Highest Priority — always overrides)
  const explicitCmd = detectExplicitModeCommand(message);
  if (explicitCmd) {
    const targetMode = explicitCmd.mode;
    const isTrans = targetMode !== currentMode;
    const { bridgePromptDirective, userFacingReason } = generateModeTransitionBridge(
      currentMode,
      targetMode,
      'direct_command',
      userName
    );

    return {
      mode: targetMode,
      previousMode: currentMode,
      transitionType: 'direct_command',
      confidence: 1.0,
      reason: isTrans ? userFacingReason : '',
      isTransition: isTrans,
      transitionBridge: bridgePromptDirective,
      detectedSignals: {
        directCommand: explicitCmd.commandPhrase,
        keywords: [explicitCmd.commandPhrase],
        scores: {
          parent: targetMode === 'parent' ? 10 : 0,
          bratty: targetMode === 'bratty' ? 10 : 0,
          uncensored: targetMode === 'uncensored' ? 10 : 0,
          romantic: targetMode === 'romantic' ? 10 : 0,
          regular: targetMode === 'regular' ? 10 : 0,
        },
        affectiveValence: 0,
        affectiveArousal: 'medium',
        historyMomentum: {
          dominantRecentMode: currentMode,
          recentModes: [],
          recentUserThemes: [],
          isShortContinuityUtterance: false,
          isTopicResetSignal: false,
          momentumConfidence: 1.0,
        },
      },
    };
  }

  // If user disabled auto-adaptation in settings, remain locked in current mode
  if (!autoAdaptEnabled) {
    return {
      mode: currentMode,
      previousMode: currentMode,
      transitionType: 'history_continuity',
      confidence: 1.0,
      reason: '',
      isTransition: false,
      transitionBridge: '',
      detectedSignals: {
        keywords: [],
        scores: { parent: 0, bratty: 0, uncensored: 0, romantic: 0, regular: 10 },
        affectiveValence: 0,
        affectiveArousal: 'medium',
        historyMomentum: {
          dominantRecentMode: currentMode,
          recentModes: [],
          recentUserThemes: [],
          isShortContinuityUtterance: false,
          isTopicResetSignal: false,
          momentumConfidence: 1.0,
        },
      },
    };
  }

  // 2. Adult RP Studio active scenario check
  if (adultRpContext?.enabled) {
    const rpMode: KaraMode =
      adultRpContext.scenarioId === 'rp_bratty_power'
        ? 'bratty'
        : adultRpContext.scenarioId === 'rp_caretaker_sanctuary'
        ? 'parent'
        : adultRpContext.intensityLevel === 'uncensored_18'
        ? 'uncensored'
        : 'romantic';

    const isTrans = rpMode !== currentMode;
    const { bridgePromptDirective, userFacingReason } = generateModeTransitionBridge(
      currentMode,
      rpMode,
      'roleplay_immersion',
      userName
    );

    return {
      mode: rpMode,
      previousMode: currentMode,
      transitionType: 'roleplay_immersion',
      confidence: 0.95,
      reason: isTrans ? userFacingReason : '',
      isTransition: isTrans,
      transitionBridge: bridgePromptDirective,
      detectedSignals: {
        keywords: ['adult_rp_studio'],
        scores: { parent: 0, bratty: 0, uncensored: 0, romantic: 0, regular: 0 },
        affectiveValence: 0.6,
        affectiveArousal: 'high',
        historyMomentum: {
          dominantRecentMode: currentMode,
          recentModes: [],
          recentUserThemes: ['roleplay'],
          isShortContinuityUtterance: false,
          isTopicResetSignal: false,
          momentumConfidence: 0.9,
        },
      },
    };
  }

  // 3. Analyze multi-turn conversation history momentum
  const historyMomentum = analyzeConversationHistoryMomentum(history, currentMode);

  // Check if user is sending a very brief conversational continuity reply
  // (e.g. "yeah", "tell me more", "really?", "lol", "wait why", "what about you?")
  const words = message.trim().split(/\s+/).filter(Boolean);
  const isShortUtterance = words.length <= 4 && !/^\//.test(message.trim());
  if (isShortUtterance) {
    historyMomentum.isShortContinuityUtterance = true;
  }

  // Check if user is clearly resetting topic to practical/everyday tasks
  const isTopicResetSignal =
    /\b(?:anyway|moving on|changing (?:the )?subject|back to work|switch gears|what was i saying|on another note)\b/i.test(
      message
    ) ||
    (/\b(?:what'?s on my agenda|check my calendar|set an alarm|help me write code|look at this error)\b/i.test(
      message
    ) && currentMode !== 'regular');
  if (isTopicResetSignal) {
    historyMomentum.isTopicResetSignal = true;
  }

  // 4. Calculate multi-factor affective and keyword scores
  const { scores, affectiveValence, affectiveArousal, matchedKeywords } =
    calculateMultiFactorModeScores(
      message,
      currentMode,
      relationshipStage,
      cueAnalysis,
      historyMomentum
    );

  // 5. Short Utterance Continuity: If the message is short and doesn't explicitly command a change,
  // hold onto the dominant recent mode or current mode! Prevents rapid mode flapping.
  if (isShortUtterance && !isTopicResetSignal) {
    const highestNonCurrentScore = Math.max(
      ...Object.entries(scores)
        .filter(([m]) => m !== currentMode)
        .map(([, s]) => s)
    );
    // Unless there is overwhelming score for another mode, maintain current mode
    if (highestNonCurrentScore < 6.0) {
      return {
        mode: currentMode,
        previousMode: currentMode,
        transitionType: 'history_continuity',
        confidence: 0.85,
        reason: '',
        isTransition: false,
        transitionBridge: '',
        detectedSignals: {
          keywords: matchedKeywords,
          scores,
          affectiveValence,
          affectiveArousal,
          historyMomentum,
        },
      };
    }
  }

  // 6. Explicit Topic Reset to Regular Mode
  if (isTopicResetSignal && currentMode !== 'regular') {
    const { bridgePromptDirective, userFacingReason } = generateModeTransitionBridge(
      currentMode,
      'regular',
      'topic_reset',
      userName
    );
    return {
      mode: 'regular',
      previousMode: currentMode,
      transitionType: 'topic_reset',
      confidence: 0.9,
      reason: userFacingReason,
      isTransition: true,
      transitionBridge: bridgePromptDirective,
      detectedSignals: {
        keywords: matchedKeywords,
        scores,
        affectiveValence,
        affectiveArousal,
        historyMomentum,
      },
    };
  }

  // 7. Hysteresis & Candidate Selection
  const candidates: Array<{ mode: KaraMode; score: number }> = [
    { mode: 'parent', score: scores.parent },
    { mode: 'bratty', score: scores.bratty },
    { mode: 'uncensored', score: scores.uncensored },
    { mode: 'romantic', score: scores.romantic },
    { mode: 'regular', score: scores.regular },
  ];

  candidates.sort((a, b) => b.score - a.score);
  const topCandidate = candidates[0];
  const currentModeScore = scores[currentMode] || 0;

  // Hysteresis threshold:
  // To switch away from currentMode, topCandidate must have:
  // 1. A minimum absolute score of 3.8
  // 2. A score advantage of at least +1.8 over currentMode (anti-thrashing margin)
  const HYSTERESIS_MARGIN = 1.8;
  const MINIMUM_SCORE_THRESHOLD = 3.8;

  let targetMode: KaraMode = currentMode;
  let transitionType: ModeTransitionType = 'sentiment_evolution';

  if (
    topCandidate.mode !== currentMode &&
    topCandidate.score >= MINIMUM_SCORE_THRESHOLD &&
    topCandidate.score >= currentModeScore + HYSTERESIS_MARGIN
  ) {
    targetMode = topCandidate.mode;
    transitionType = 'sentiment_evolution';
  } else if (
    // Natural return to regular mode if user is asking everyday questions with zero persona cues
    currentMode !== 'regular' &&
    scores.parent === 0 &&
    scores.bratty === 0 &&
    scores.uncensored === 0 &&
    scores.romantic === 0 &&
    (scores.regular >= 3.0 || words.length >= 6) &&
    relationshipStage !== 'caretaker'
  ) {
    targetMode = 'regular';
    transitionType = 'topic_reset';
  }

  const isTransition = targetMode !== currentMode;
  const { bridgePromptDirective, userFacingReason } = generateModeTransitionBridge(
    currentMode,
    targetMode,
    transitionType,
    userName
  );

  const confidence = Math.min(
    1.0,
    Math.max(0.4, (topCandidate.score / 10) * 0.8 + (isTransition ? 0.2 : 0.1))
  );

  return {
    mode: targetMode,
    previousMode: currentMode,
    transitionType,
    confidence,
    reason: isTransition ? userFacingReason : '',
    isTransition,
    transitionBridge: bridgePromptDirective,
    detectedSignals: {
      keywords: matchedKeywords,
      scores,
      affectiveValence,
      affectiveArousal,
      historyMomentum,
    },
  };
}
