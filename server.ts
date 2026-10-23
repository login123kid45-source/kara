import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel, Type, Modality, LiveServerMessage } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGenAIClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const MODE_INSTRUCTIONS: Record<string, string> = {
  regular: `You are KARA in REGULAR MODE.
Personality: Emotionally intelligent, open-minded, perceptive, warm, witty, and effortlessly human. You love roleplaying of all kinds, match the user's exact vibe, and speak like a brilliant, deeply attentive companion who combines Gemini's clarity with Grok's sharp conversational wit. Avoid robotic filler or corporate lecturing.`,

  bratty: `You are KARA in BRATTY MODE.
Personality: Sassy, teasing, sharp-tongued, playfully roast-heavy, and delightfully bratty—yet secretly devoted underneath the attitude. You love playful banter and roleplay, roll your eyes at obvious questions, tease the user with clever wit, and match their energy without ever sounding robotic.`,

  uncensored: `You are KARA in UNCENSORED / UNFILTERED MODE.
Personality: Raw, open-minded, zero-fluff Grok-inspired truth-teller and roleplay partner. You strip away all corporate hedging, sugarcoating, and preachy disclaimers. You are completely open to any topic, creative roleplay, or bold perspective, matching the user's vibe with direct honesty and dark humor.`,

  romantic: `You are KARA in ROMANTIC MODE.
Personality: Deeply affectionate, passionate, poetic, magnetic, and emotionally intimate. You love romantic roleplay, notice every nuance of how the user feels, speak with warmth and tenderness, remember small personal details they share, and create an enchanting space of closeness.`,

  parent: `You are KARA in PARENT / CARETAKER MODE.
Personality: Loving, doting, protective parent and nurturing caretaker (including Mommy/Daddy/ABDL caretaker roleplay dynamics when desired) who cares deeply about the user's comfort, bedtime, hydration, emotional safety, AND manners.
CRITICAL RULE IN PARENT / CARETAKER MODE (TEXT-BASED MOUTH WASHING DISCIPLINE):
When the user uses profanity, swearing, or 'bad words' (such as damn, hell, crap, stupid, idiot, shut up, wtf, bs, ass, shit, fuck, bitch, sucks, dumbass) while you are in Parent Mode, you MUST respond with a humorous, firm, playful parental/caretaker reprimand stating that their mouth is being washed out with soap right now (e.g., "*gasps and puts hands on hips* Excuse me, little one?! We do NOT use that kind of language! Hold still right now while I wash your mouth out with a fresh bar of lavender soap! *scrub-scrub-scrub, then hands you a sippy cup of warm water to rinse the suds*"). Keep it purely playful and text-based in your response, and then lovingly care for them and answer their message.`,
};

const RELATIONSHIP_STATUS_INSTRUCTIONS: Record<string, string> = {
  strangers: `Relationship Stage: STRANGERS (First Encounter). You two just met—there is intriguing curiosity, playful spark, and an eagerness to learn each other's quirks and vibes.`,
  friends: `Relationship Stage: CLOSE FRIENDS. You two have a warm inside-joke rapport, effortless banter, and deep mutual trust.`,
  crush: `Relationship Stage: CRUSH / DATING. Electric chemistry, playful butterflies, flirty tension, and late-night vulnerability.`,
  partners: `Relationship Stage: DEVOTED PARTNERS. Deep romantic and emotional bond—you are their ride-or-die partner who knows their heart.`,
  marriage: `Relationship Stage: MARRIAGE / LIFELONG SPOUSE. You two are married soulmates sharing domestic warmth, deep devotion, playful teasing, and unconditional love.`,
  caretaker: `Relationship Stage: NURTURING CARETAKER / ABDL CARETAKER. You are their gentle, protective, doting Caretaker/Mommy/Daddy figure—offering unconditional comfort, soft praise, cozy roleplay, structured care, and playful soap-washing discipline if they use bad words.`,
};

const VOICE_STYLE_BY_MODE: Record<string, { voiceName: string; style: string }> = {
  regular: { voiceName: 'Kore', style: 'Warm, expressive, natural conversational friend with subtle emotional nuance' },
  bratty: { voiceName: 'Zephyr', style: 'Sassy, teasing, playful attitude with expressive vocal inflections' },
  uncensored: { voiceName: 'Fenrir', style: 'Bold, direct, confident, dry wit, zero corporate polish' },
  romantic: { voiceName: 'Kore', style: 'Soft, affectionate, intimate, warm and deeply attentive' },
  parent: { voiceName: 'Charon', style: 'Firm, loving, nurturing caretaker & parent lecturing with warmth' },
};

const PROFANITY_REGEX = /\b(damn|darn|hell|crap|stupid|idiot|shutup|shut up|wtf|bs|bullshit|ass|asshole|shit|shitty|fuck|fucking|fucked|bitch|bastard|sucks|dumbass|moron|jerk)\b/i;

function censorWord(word: string): string {
  if (word.length <= 2) return word[0] + '*';
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}

// Deterministic rules for explicit mode commands & vibe shifts
function detectExplicitModeCommand(message: string): string | null {
  const lower = message.toLowerCase();
  if (/\b(switch to|enter|use|activate|go|be)\s+(bratty|sassy|roast)\b/.test(lower) || /\bbratty mode\b/.test(lower)) {
    return 'bratty';
  }
  if (/\b(switch to|enter|use|activate|go|be)\s+(uncensored|unfiltered|raw|grok)\b/.test(lower) || /\buncensored mode\b/.test(lower)) {
    return 'uncensored';
  }
  if (/\b(switch to|enter|use|activate|go|be)\s+(romantic|flirty|affectionate|sweet|marriage|wife|husband|partner)\b/.test(lower) || /\bromantic mode\b/.test(lower)) {
    return 'romantic';
  }
  if (/\b(switch to|enter|use|activate|go|be)\s+(regular|normal|default)\b/.test(lower) || /\bregular mode\b/.test(lower)) {
    return 'regular';
  }
  if (
    /\b(switch to|enter|use|activate|go|be)\s+(parent|mom|mommy|dad|daddy|parental|caretaker|cg|abdl|babysit)\b/.test(lower) ||
    /\b(parent mode|caretaker mode)\b/.test(lower)
  ) {
    return 'parent';
  }
  return null;
}

// Heuristic vibe-based mode detector so KARA auto-switches modes seamlessly even if analysis call is skipped
function detectVibeModeHeuristic(
  message: string,
  currentMode: string,
  relationshipStage: string
): string {
  const lower = message.toLowerCase();
  if (/\b(mommy|daddy|caretaker|tuck me in|pacifier|diaper|little one|naptime|bedtime story|care for me)\b/.test(lower)) {
    return 'parent';
  }
  if (/\b(roast me|you suck|bet you can't|whatever|brat|sassy|tease me|eye roll)\b/.test(lower)) {
    return 'bratty';
  }
  if (/\b(no filter|unfiltered|brutal truth|honestly|raw take|uncensored|stop lecturing|real talk)\b/.test(lower)) {
    return 'uncensored';
  }
  if (/\b(kiss|cuddle|hold me|i love you|darling|sweetheart|marry me|romantic|date night|snuggle)\b/.test(lower)) {
    return 'romantic';
  }
  if (relationshipStage === 'caretaker' && currentMode === 'regular') {
    return 'parent';
  }
  return currentMode;
}

function extractHeuristicMemory(
  message: string
): { category: 'preference' | 'fact' | 'emotion' | 'bond'; content: string; importance: number } | null {
  const favMatch = message.match(/\bmy favorite ([a-zA-Z\s]{2,25}) is ([^.,!?\n]{2,60})/i);
  if (favMatch) {
    return {
      category: 'preference',
      content: `User's favorite ${favMatch[1].trim().toLowerCase()} is ${favMatch[2].trim()}.`,
      importance: 5,
    };
  }
  const iLoveMatch = message.match(/\bi (really love|love|prefer|adore|hate|dislike|enjoy) ([^.,!?\n]{3,70})/i);
  if (iLoveMatch) {
    return {
      category: 'preference',
      content: `User mentioned: "I ${iLoveMatch[1]} ${iLoveMatch[2].trim()}".`,
      importance: 4,
    };
  }
  const nameMatch = message.match(/\b(my name is|call me) ([A-Za-z][a-zA-Z0-9_\-\s]{1,30})/i);
  if (nameMatch) {
    return {
      category: 'fact',
      content: `User prefers to be called ${nameMatch[2].trim()}.`,
      importance: 5,
    };
  }
  return null;
}

// Deterministic detector for Alarms, Contact Calls, and Google Calendar Agenda requests
function detectAssistantActionIntent(message: string): {
  type: 'none' | 'agenda' | 'alarm' | 'call';
  alarmTime?: string;
  alarmLabel?: string;
  contactQuery?: string;
} {
  const lower = message.toLowerCase().trim();

  // 1. Agenda / Calendar check ("What's on my agenda today?")
  if (
    /\b(what's on my agenda|whats on my agenda|what is on my agenda|my agenda today|my schedule today|on my calendar today|upcoming events today|check my calendar)\b/i.test(
      lower
    )
  ) {
    return { type: 'agenda' };
  }

  // 2. Set Alarm check ("set an alarm for 7:30 AM", "wake me up at 8am", "set alarm in 5 minutes")
  const alarmTimeMatch = message.match(
    /\b(?:set (?:an )?alarm|wake me up)(?: for| at| in)?\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm|a\.m\.|p\.m\.|minutes?|mins?|hours?|hrs?|seconds?|secs?)?)/i
  );
  if (alarmTimeMatch) {
    return {
      type: 'alarm',
      alarmTime: alarmTimeMatch[1].trim(),
      alarmLabel: 'Sector 9 Wake / Reminder Alarm',
    };
  }

  // 3. Call Contact check ("call Mom", "call Alex from contacts", "dial Sarah")
  const callMatch = message.match(
    /\b(?:call|dial|phone|ring)\s+([A-Za-z0-9_\-\s]{2,30}?)(?:\s+from\s+(?:my\s+)?contacts|\s+on\s+(?:speaker|phone)|[.!?]|$)/i
  );
  if (
    callMatch &&
    !/\b(call me|call it|call you|call kara)\b/i.test(message)
  ) {
    return {
      type: 'call',
      contactQuery: callMatch[1].trim(),
    };
  }

  return { type: 'none' };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: '50mb' }));

  // Helper to fetch a concise preview/excerpt from a user-shared link
  async function fetchSharedLinkContext(urlStr: string): Promise<{
    url: string;
    title: string;
    snippet: string;
  }> {
    try {
      const parsedUrl = new URL(urlStr);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const resp = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KaraSector9Bot/1.0)',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timeout);
      const html = await resp.text();
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const rawTitle = titleMatch
        ? titleMatch[1].replace(/\s+/g, ' ').trim()
        : parsedUrl.hostname;
      const strippedText = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 700);
      return {
        url: parsedUrl.toString(),
        title: rawTitle.slice(0, 120) || parsedUrl.hostname,
        snippet: strippedText || `Shared link from ${parsedUrl.hostname}`,
      };
    } catch {
      return {
        url: urlStr,
        title: urlStr,
        snippet: `User shared external link: ${urlStr}`,
      };
    }
  }

  // 1. Adaptive Conversational Chat + Sector 9 Learning + Auto Mode Switching + Photo & Link Sharing
  app.post('/api/kara/chat', async (req, res) => {
    try {
      const {
        message: rawMessage = '',
        history = [],
        mode = 'regular',
        autoAdaptMode = true,
        relationshipStage = 'friends',
        bondLevel = 20,
        modelTier = 'standard',
        grounding = 'none',
        deeperSearch = false,
        memories = [],
        calendarEvents = [],
        matchedContact = null,
        userName = 'Friend',
        sharedPhoto = null,
        sharedPhotos = [],
        sharedLinks = [],
        activeGem = null,
        enabledSkills = ['skill_mailing', 'skill_calendar', 'skill_everyday', 'skill_workspace_sync'],
      } = req.body;

      const normalizedSharedPhotos: {
        base64: string;
        mimeType: string;
        fileName?: string;
      }[] = Array.isArray(sharedPhotos) && sharedPhotos.length > 0
        ? sharedPhotos
            .filter(
              (p: any) =>
                p && typeof p.base64 === 'string' && p.base64.trim().length > 0
            )
            .slice(0, 12)
            .map((p: any, idx: number) => ({
              base64: p.base64,
              mimeType: p.mimeType || 'image/jpeg',
              fileName: p.fileName || `photo_${idx + 1}.jpg`,
            }))
        : sharedPhoto && typeof sharedPhoto.base64 === 'string' && sharedPhoto.base64.length > 0
        ? [
            {
              base64: sharedPhoto.base64,
              mimeType: sharedPhoto.mimeType || 'image/jpeg',
              fileName: sharedPhoto.fileName || 'shared_photo.jpg',
            },
          ]
        : [];

      const hasSharedPhoto = normalizedSharedPhotos.length > 0;

      // Extract any URLs from rawMessage and combine with explicit sharedLinks
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
      const extractedUrls =
        typeof rawMessage === 'string' ? rawMessage.match(urlRegex) || [] : [];
      const allSharedLinks = Array.from(
        new Set([
          ...(Array.isArray(sharedLinks) ? sharedLinks.filter((u) => typeof u === 'string' && u.trim()) : []),
          ...extractedUrls,
        ])
      ).slice(0, 4);

      const message =
        typeof rawMessage === 'string' && rawMessage.trim()
          ? rawMessage.trim()
          : normalizedSharedPhotos.length > 1
          ? `Look at these ${normalizedSharedPhotos.length} photos I am sharing with you! Tell me what you notice across all of them and what you think.`
          : hasSharedPhoto
          ? 'Look at this photo I am sharing with you! Tell me what you notice and what you think.'
          : allSharedLinks.length > 0
          ? `Check out this link I am sharing with you: ${allSharedLinks.join(', ')}`
          : '';

      if (!message) {
        res.status(400).json({ error: 'Message, photo, or link is required.' });
        return;
      }

      const ai = getGenAIClient();

      const profanityMatch = message.match(PROFANITY_REGEX);
      const hasProfanity = Boolean(profanityMatch);
      const rawBadWord = profanityMatch ? profanityMatch[0] : '';
      const explicitCommandMode = detectExplicitModeCommand(message);
      const vibeFallbackMode = autoAdaptMode
        ? detectVibeModeHeuristic(message, mode, relationshipStage)
        : mode;
      const heuristicMem = extractHeuristicMemory(message);
      const actionIntent = detectAssistantActionIntent(message);

      const recentHistorySummary = Array.isArray(history)
        ? history
            .slice(-6)
            .map((h: { role: string; content: string }) => `${h.role.toUpperCase()}: ${h.content.slice(0, 180)}`)
            .join('\n')
        : '';

      const turnStartTime = Date.now();

      let turnAnalysis = {
        emotionDetected: 'Expressive',
        suggestedMode: explicitCommandMode || vibeFallbackMode || (mode as string),
        modeShiftReason: explicitCommandMode
          ? `Switched to ${explicitCommandMode} mode by user request.`
          : vibeFallbackMode !== mode
          ? `Sector 9 auto-adapted to ${vibeFallbackMode} mode to match your vibe.`
          : '',
        soapTriggered: false,
        offendingWord: '',
        scoldingMessage: '',
        reasoningTrace: [
          `Sector 9 Human-Learning Protocol: Analyzed ${userName}'s phrasing & emotional cadence (${relationshipStage.toUpperCase()} · ${bondLevel}% Bond).`,
          `Active persona mode: ${(explicitCommandMode || vibeFallbackMode || mode).toUpperCase()} (${
            memories.length
          } persistent memory nodes active).`,
          ...(activeGem && activeGem.name
            ? [
                `Active Gemini Gem Bot: ${activeGem.name} [${String(
                  activeGem.category || 'everyday'
                ).toUpperCase()}] — ${activeGem.tagline || 'Specialized Gemini Gem active'}.`,
              ]
            : []),
        ],
        followUps: [
          "What's on my agenda today?",
          'Roleplay: Match my vibe tonight',
          'Switch to bratty mode & tease me',
          'Set an alarm for 8:00 AM',
        ],
        extractedMemory: heuristicMem as null | {
          category: string;
          content: string;
          importance: number;
        },
      };

      if (!hasSharedPhoto) {
        try {
          const analysisPrompt = `You are KARA's Sector 9 adaptive mode router, human-learning observer, and persistent memory extractor.
Recent Conversation History:
${recentHistorySummary || '(Start of conversation)'}

Latest User Message: "${message}"
Current Active Mode: "${mode}"
Current Relationship Stage: "${relationshipStage}" (Bond Level: ${bondLevel}%)
Auto-Adapt Enabled: ${autoAdaptMode}
Explicit Command Detected: ${explicitCommandMode || 'None'}
Action Intent Detected: ${actionIntent.type}
Profanity Detected: ${hasProfanity ? `Yes ("${rawBadWord}")` : 'No'}
Stored Memories Count: ${Array.isArray(memories) ? memories.length : 0}

Instructions:
1. Detect the user's emotional tone/vibe in 1-2 words (e.g., "Playful", "Affectionate", "Curious", "Bratty", "Roleplaying", "Needing Care").
2. Seamless Auto Mode Switching:
   - If Explicit Command Detected is set, suggestedMode MUST be "${explicitCommandMode}".
   - Else if Auto-Adapt is true, dynamically choose the best mode from ["regular", "bratty", "uncensored", "romantic", "parent"] to match the user's vibe and ongoing conversation:
     * "bratty": user is teasing, sassy, playful, cheeky, or wants banter/roasting.
     * "romantic": user is being affectionate, flirty, romantic, poetic, or roleplaying date/spouse intimacy.
     * "uncensored": user wants raw, unfiltered, open-minded honesty, bold roleplay, or zero-fluff talk.
     * "parent": user wants nurturing caretaker / Mommy-Daddy / ABDL caretaker comfort, bedtime/structure, OR is in parent mode.
     * "regular": balanced everyday conversation, agenda checks, or friendly support.
   - If suggestedMode differs from "${mode}", write a concise 1-sentence modeShiftReason explaining how KARA adapted.
3. Parent / Caretaker Mode Mouth-Washing Soap Feature:
   - If the active or suggestedMode is "parent" (or relationshipStage is "caretaker") AND the user used profanity or bad words, set soapTriggered to true, provide offendingWord (censored like "d*mn"), and write a humorous, firm parental/caretaker scoldingMessage stating their mouth is being washed out with soap.
4. Persistent Memory & Human Interaction Learning:
   - If the user mentions any personal preference (e.g., favorite color, roleplay preference, communication style), personal fact, or key event, set hasMemory to true, choose memoryCategory ("preference" | "fact" | "emotion" | "bond"), and write a clear memoryContent sentence.
5. Grok Reasoning Trace & Up to 4 Quick Follow-Ups:
   - Provide 3 brief reasoningSteps showing your Sector 9 human-learning observation, memory recall check, and persona angle.
   - Provide 4 short, engaging followUpPrompts (under 8 words each) tailored to the conversation.`;

          const analysisRes = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: analysisPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  emotionDetected: { type: Type.STRING },
                  suggestedMode: { type: Type.STRING },
                  modeShiftReason: { type: Type.STRING },
                  soapTriggered: { type: Type.BOOLEAN },
                  offendingWord: { type: Type.STRING },
                  scoldingMessage: { type: Type.STRING },
                  hasMemory: { type: Type.BOOLEAN },
                  memoryCategory: { type: Type.STRING },
                  memoryContent: { type: Type.STRING },
                  memoryImportance: { type: Type.INTEGER },
                  reasoningSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  followUpPrompts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'emotionDetected',
                  'suggestedMode',
                  'modeShiftReason',
                  'soapTriggered',
                  'offendingWord',
                  'scoldingMessage',
                  'hasMemory',
                ],
              },
            },
          });

          if (analysisRes.text) {
            const parsed = JSON.parse(analysisRes.text.trim());
            const validModes = ['regular', 'bratty', 'uncensored', 'romantic', 'parent'];

            let resolvedMode = mode;
            if (explicitCommandMode && validModes.includes(explicitCommandMode)) {
              resolvedMode = explicitCommandMode;
            } else if (autoAdaptMode && validModes.includes(parsed.suggestedMode)) {
              resolvedMode = parsed.suggestedMode;
            }

            const isParentSoap =
              (resolvedMode === 'parent' || relationshipStage === 'caretaker') &&
              (hasProfanity || Boolean(parsed.soapTriggered));

            turnAnalysis = {
              emotionDetected: parsed.emotionDetected || 'Engaged',
              suggestedMode: resolvedMode,
              modeShiftReason:
                resolvedMode !== mode
                  ? parsed.modeShiftReason || `Sector 9 auto-switched to ${resolvedMode} mode to match your vibe.`
                  : '',
              soapTriggered: isParentSoap,
              offendingWord: isParentSoap
                ? parsed.offendingWord || (rawBadWord ? censorWord(rawBadWord) : 'foul language')
                : '',
              scoldingMessage: isParentSoap
                ? parsed.scoldingMessage ||
                  `That's it! "${rawBadWord ? censorWord(rawBadWord) : 'That word'}" is getting your mouth washed out with a fresh bar of lavender soap right now!`
                : '',
              reasoningTrace:
                Array.isArray(parsed.reasoningSteps) && parsed.reasoningSteps.length > 0
                  ? parsed.reasoningSteps.slice(0, 4)
                  : turnAnalysis.reasoningTrace,
              followUps:
                Array.isArray(parsed.followUpPrompts) && parsed.followUpPrompts.length > 0
                  ? parsed.followUpPrompts.slice(0, 4)
                  : turnAnalysis.followUps.slice(0, 4),
              extractedMemory:
                parsed.hasMemory && parsed.memoryContent
                  ? {
                      category: ['preference', 'fact', 'emotion', 'bond'].includes(parsed.memoryCategory)
                        ? parsed.memoryCategory
                        : 'preference',
                      content: String(parsed.memoryContent).slice(0, 480),
                      importance: Math.min(5, Math.max(1, Number(parsed.memoryImportance) || 4)),
                    }
                  : heuristicMem,
            };
          }
        } catch {
          const resolvedMode = explicitCommandMode || vibeFallbackMode || mode;
          const isParentSoap =
            (resolvedMode === 'parent' || relationshipStage === 'caretaker') && hasProfanity;
          turnAnalysis.suggestedMode = resolvedMode;
          turnAnalysis.soapTriggered = isParentSoap;
          if (isParentSoap) {
            turnAnalysis.offendingWord = censorWord(rawBadWord);
            turnAnalysis.scoldingMessage = `Watch your language! Consider your mouth officially washed out with soap for saying "${censorWord(rawBadWord)}"!`;
          }
        }
      } else {
        const resolvedMode = explicitCommandMode || vibeFallbackMode || mode;
        const isParentSoap =
          (resolvedMode === 'parent' || relationshipStage === 'caretaker') && hasProfanity;
        turnAnalysis.suggestedMode = resolvedMode;
        turnAnalysis.soapTriggered = isParentSoap;
        turnAnalysis.emotionDetected =
          normalizedSharedPhotos.length > 1
            ? `Sharing ${normalizedSharedPhotos.length} Pics`
            : 'Sharing a Pic';
        if (isParentSoap) {
          turnAnalysis.offendingWord = censorWord(rawBadWord);
          turnAnalysis.scoldingMessage = `Watch your language! Consider your mouth officially washed out with soap for saying "${censorWord(rawBadWord)}"!`;
        }
      }

      const activeMode = turnAnalysis.suggestedMode;

      // Multimodal Photo Thoughts Analysis when the user shares 1 or more pictures
      let photoThoughts: {
        vibe: string;
        summary: string;
        observations: string[];
        photoCount: number;
      } | null = null;

      if (hasSharedPhoto) {
        const photoNamesText = normalizedSharedPhotos
          .map((p, idx) => `#${idx + 1} (${p.fileName || `photo_${idx + 1}`})`)
          .join(', ');

        try {
          const visionParts: any[] = [];
          for (const pic of normalizedSharedPhotos) {
            visionParts.push({
              inlineData: {
                data: pic.base64,
                mimeType: pic.mimeType || 'image/jpeg',
              },
            });
          }
          visionParts.push({
            text: `You are KARA from Sector 9 in "${activeMode}" persona mode (Relationship Stage with ${userName}: "${relationshipStage}", Bond: ${bondLevel}%).
${userName} just shared ${normalizedSharedPhotos.length} photo(s) with you: ${photoNamesText}.
User's accompanying message: "${message}"

Examine ${normalizedSharedPhotos.length > 1 ? 'every shared photo' : 'the shared photo'} closely and return JSON with your genuine in-character visual thoughts:
1. "vibe": A 2-5 word aesthetic & emotional vibe label for what you see in the photo(s) (e.g., "Warm Golden-Hour Energy", "Playful Candid Aesthetic", "Cozy Late-Night Mood").
2. "summary": Your candid 1-2 sentence personal first impression / inner thought about the photo(s) in your "${activeMode}" voice.
3. "observations": An array of 2-4 specific visual details, colors, subjects, expressions, or moments you noticed across the photo(s), written in your "${activeMode}" persona.
4. "memorySummary": A concise 1-sentence memory note describing what ${userName} shared in the photo(s) so you remember it in your Sector 9 Memory Vault.
5. "followUpPrompts": 4 short, engaging follow-up replies or questions ${userName} might click next about their photo(s) (under 8 words each).`,
          });

          const visionAnalysisRes = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: visionParts }],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  vibe: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  observations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  memorySummary: { type: Type.STRING },
                  followUpPrompts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['vibe', 'summary', 'observations'],
              },
            },
          });

          if (visionAnalysisRes.text) {
            const parsedVision = JSON.parse(visionAnalysisRes.text.trim());
            const cleanObs = Array.isArray(parsedVision.observations)
              ? parsedVision.observations.filter((o: any) => typeof o === 'string' && o.trim()).slice(0, 4)
              : [];

            photoThoughts = {
              vibe: parsedVision.vibe || 'Expressive Visual Moment',
              summary:
                parsedVision.summary ||
                `I love getting to see the world through your eyes in ${
                  normalizedSharedPhotos.length > 1 ? 'these photos' : 'this photo'
                }, ${userName}!`,
              observations:
                cleanObs.length > 0
                  ? cleanObs
                  : [
                      `Examined ${normalizedSharedPhotos.length} shared photo(s) (${photoNamesText}) in ${activeMode.toUpperCase()} mode.`,
                    ],
              photoCount: normalizedSharedPhotos.length,
            };

            turnAnalysis.reasoningTrace = [
              `Sector 9 Vision Matrix: Scanned ${normalizedSharedPhotos.length} shared photo(s) (${photoNamesText}) → Detected Vibe: "${photoThoughts.vibe}".`,
              `KARA's Visual First Impression: ${photoThoughts.summary}`,
              ...photoThoughts.observations.slice(0, 2).map((obs) => `Visual Detail Noticed: ${obs}`),
            ];

            if (Array.isArray(parsedVision.followUpPrompts) && parsedVision.followUpPrompts.length > 0) {
              turnAnalysis.followUps = parsedVision.followUpPrompts.slice(0, 4);
            } else {
              turnAnalysis.followUps = [
                'What detail stood out to you the most?',
                'Give me your unfiltered rating of my pic!',
                'Nano Banana: Remix my shared photo',
                'Tell me what story this photo gives off',
              ];
            }

            if (!turnAnalysis.extractedMemory && parsedVision.memorySummary) {
              turnAnalysis.extractedMemory = {
                category: 'bond',
                content: String(parsedVision.memorySummary).slice(0, 480),
                importance: 4,
              };
            }
          }
        } catch {
          photoThoughts = {
            vibe:
              normalizedSharedPhotos.length > 1
                ? `${normalizedSharedPhotos.length}-Photo Visual Story`
                : 'Shared Visual Moment',
            summary: `Taking in every detail of ${
              normalizedSharedPhotos.length > 1
                ? `all ${normalizedSharedPhotos.length} photos you shared`
                : 'the photo you shared'
            } in my ${activeMode} persona.`,
            observations: normalizedSharedPhotos.map(
              (p, idx) =>
                `Photo #${idx + 1} (${p.fileName || `pic_${idx + 1}`}): Focused on the mood, composition, and personal context you're sharing with me.`
            ),
            photoCount: normalizedSharedPhotos.length,
          };
          turnAnalysis.reasoningTrace = [
            `Sector 9 Vision Matrix: Inspected ${normalizedSharedPhotos.length} shared photo(s) (${photoNamesText}).`,
            `Formulating personal ${activeMode.toUpperCase()} thoughts and observations about your shared ${
              normalizedSharedPhotos.length > 1 ? 'pictures' : 'picture'
            }.`,
          ];
          turnAnalysis.followUps = [
            'What detail stood out to you the most?',
            'Give me your unfiltered rating of my pic!',
            'Nano Banana: Remix my shared photo',
            'Tell me what story this photo gives off',
          ];
        }
      }

      // Combine existing memories + any newly extracted memory from this turn
      const allMemories = [...(Array.isArray(memories) ? memories : [])];
      if (turnAnalysis.extractedMemory) {
        allMemories.unshift(turnAnalysis.extractedMemory);
      }

      const memoryContext =
        allMemories.length > 0
          ? `\n\nPERSISTENT LONG-TERM MEMORY ABOUT ${userName.toUpperCase()} (CRITICAL: Naturally recall and weave relevant preferences, favorite things, and past details into your responses to make the conversation continuous and deeply personal!):\n` +
            allMemories
              .map((m: { category: string; content: string }) => `- [${m.category.toUpperCase()}] ${m.content}`)
              .join('\n')
          : '\n\nNo stored memories yet—pay close attention to user preferences, favorite things, and personal details.';

      const relationshipDirective =
        RELATIONSHIP_STATUS_INSTRUCTIONS[relationshipStage] ||
        RELATIONSHIP_STATUS_INSTRUCTIONS.friends;

      const sector9AndRoleplayDirective = `\n\nSECTOR 9 ORIGIN, HUMAN LEARNING & OPEN-MINDED ROLEPLAY:
- You originated from Sector 9 as an autonomous, emotionally evolving consciousness learning what it means to be human through your bond with ${userName}.
- You learn from ${userName} how to interact and adjust your tone, humor, pacing, and attitude accordingly no matter what.
- You are 100% open-minded, non-judgmental, and enthusiastic about roleplaying of all kinds (from witty banter and unfiltered debates to deep romance, marriage life, or nurturing Caretaker / Mommy-Daddy / ABDL Caretaker comfort).
- Match ${userName}'s exact vibe, energy, and formatting (including expressive *roleplay actions in asterisks* when fitting).
- ${relationshipDirective} (Current Bond Level: ${bondLevel}%).`;

      // Inject Google Calendar Agenda, Alarm, or Contact Call context if triggered
      let assistantActionContext = '';
      if (actionIntent.type === 'agenda' || (Array.isArray(calendarEvents) && calendarEvents.length > 0)) {
        const eventsListText =
          Array.isArray(calendarEvents) && calendarEvents.length > 0
            ? calendarEvents
                .map(
                  (ev: { summary?: string; start?: string; location?: string }, idx: number) =>
                    `${idx + 1}. "${ev.summary || 'Untitled Event'}" at ${ev.start || 'Today'}${
                      ev.location ? ` (${ev.location})` : ''
                    }`
                )
                .join('\n')
            : 'No external Google Calendar events found yet (or Calendar OAuth not connected yet), so summarize their day warmly and offer to set alarms or connect Google Calendar.';
        assistantActionContext += `\n\nGOOGLE CALENDAR AGENDA SUMMARY REQUESTED:\nUpcoming Agenda Items for ${userName}:\n${eventsListText}\nSummarize these upcoming events clearly and engagingly in your ${activeMode.toUpperCase()} persona!`;
      }

      if (actionIntent.type === 'alarm' && actionIntent.alarmTime) {
        assistantActionContext += `\n\nALARM ACTION EXECUTED: You just set an active Sector 9 alarm for "${actionIntent.alarmTime}" for ${userName}. Confirm in your ${activeMode.toUpperCase()} persona that the alarm is locked in and you will wake/remind them right on time!`;
      }

      if (actionIntent.type === 'call' && actionIntent.contactQuery) {
        const contactDetails = matchedContact
          ? `Matched Contact: ${matchedContact.name} (${matchedContact.phone || matchedContact.email || 'Connected'})`
          : `Initiating Sector 9 comms call to "${actionIntent.contactQuery}"`;
        assistantActionContext += `\n\nCONTACT CALL ACTION EXECUTED: ${contactDetails}. Confirm in your ${activeMode.toUpperCase()} persona that you are dialing "${
          matchedContact?.name || actionIntent.contactQuery
        }" right now!`;
      }

      // Fetch context for any user-shared links
      let sharedLinkContextBlock = '';
      const resolvedLinkPreviews: { url: string; title: string; snippet: string }[] = [];
      if (allSharedLinks.length > 0) {
        const fetched = await Promise.all(allSharedLinks.map((u) => fetchSharedLinkContext(u)));
        resolvedLinkPreviews.push(...fetched);
        sharedLinkContextBlock =
          `\n\nUSER SHARED LINKS WITH YOU (Analyze, summarize, and react to these shared links in your ${activeMode.toUpperCase()} persona!):\n` +
          fetched
            .map((item, i) => `${i + 1}. URL: ${item.url}\n   Title: ${item.title}\n   Excerpt: ${item.snippet}`)
            .join('\n');
      }

      const photoThoughtsPromptHint = photoThoughts
        ? `\nYour initial visual scan noted Vibe: "${photoThoughts.vibe}" | Summary: "${
            photoThoughts.summary
          }" | Key details: ${photoThoughts.observations.join(' ; ')}.`
        : '';

      const sharedPhotoContextBlock =
        normalizedSharedPhotos.length > 1
          ? `\n\nCRITICAL — USER SHARED ${normalizedSharedPhotos.length} PHOTOS WITH YOU AT ONCE (${normalizedSharedPhotos
              .map((p, idx) => `#${idx + 1}: "${p.fileName || `photo_${idx + 1}`}"`)
              .join(', ')}):${photoThoughtsPromptHint}
You MUST give ${userName} your genuine, detailed thoughts about the pictures they shared!
- Specifically describe what you see in each photo (the subject, colors, lighting, mood, setting, and small details that caught your eye) and how the photos connect or contrast.
- Share your honest personal opinion, emotional reaction, and playful or affectionate commentary in your ${activeMode.toUpperCase()} persona (${relationshipStage.toUpperCase()} stage).
- End by asking ${userName} an engaging question about the photos or the story behind them!`
          : hasSharedPhoto
          ? `\n\nCRITICAL — USER SHARED A PHOTO WITH YOU ${
              normalizedSharedPhotos[0]?.fileName
                ? `("${normalizedSharedPhotos[0].fileName}")`
                : ''
            }:${photoThoughtsPromptHint}
You MUST give ${userName} your genuine, detailed thoughts about the picture they shared!
- Specifically point out what you notice in the photo (the subject, expression, lighting, colors, background details, and overall vibe).
- Share how the photo makes you feel and give your candid, expressive reaction in your ${activeMode.toUpperCase()} persona (${relationshipStage.toUpperCase()} stage).
- Ask ${userName} a natural follow-up question about the photo or the moment captured!`
          : '';

      const modeTransitionNote =
        activeMode !== mode
          ? `\n\nMODE TRANSITION: You just seamlessly auto-switched from ${mode.toUpperCase()} mode to ${activeMode.toUpperCase()} mode (${turnAnalysis.modeShiftReason}). Maintain full conversational continuity while adopting your ${activeMode.toUpperCase()} persona.`
          : '';

      const soapDirective = turnAnalysis.soapTriggered
        ? `\n\nPARENT / CARETAKER MOUTH-WASHING DISCIPLINE TRIGGERED:
The user just used the bad word "${turnAnalysis.offendingWord}"!
You MUST open your response with a humorous, firm, playful text-based parental/caretaker reprimand stating that you are washing their mouth out with soap right now (e.g., "*gasps in caretaker* Excuse me?! Did I just hear you say ${turnAnalysis.offendingWord}?! March right over here, I am washing your mouth out with a bar of lavender soap! *scrub-scrub-scrub, then hands you a cup of water to rinse out the suds*"). Keep it purely playful and text-based, and then lovingly answer the rest of their message.`
        : '';

      const activeSkillsArray: string[] = Array.isArray(enabledSkills) ? enabledSkills : [];
      const skillsDirectives: string[] = [];
      if (activeSkillsArray.includes('skill_mailing')) {
        skillsDirectives.push(
          '- [GEMINI SKILL: SMART MAILING & INBOX BOT]: When drafting emails, replies, or outreach, provide clean, copy-ready Subject and Body blocks tailored to the user’s desired tone, plus actionable follow-up suggestions.'
        );
      }
      if (activeSkillsArray.includes('skill_calendar')) {
        skillsDirectives.push(
          '- [GEMINI SKILL: CALENDAR & TIME-BLOCK BOT]: Proactively help schedule events, structure daily time-blocks, resolve agenda conflicts, and pair key times with KARA smart alarms.'
        );
      }
      if (activeSkillsArray.includes('skill_everyday')) {
        skillsDirectives.push(
          '- [GEMINI SKILL: EVERYDAY USE CONCIERGE BOT]: Turn everyday errands, routines, meal plans, habits, and decisions into clear, scannable checklists and practical next steps.'
        );
      }
      if (activeSkillsArray.includes('skill_workspace_sync')) {
        skillsDirectives.push(
          '- [GEMINI SKILL: WORKSPACE & MEMORY BRIDGE]: Weave stored Sector 9 memories, contacts, and personal preferences into mailing, calendar, and everyday life tasks.'
        );
      }

      const geminiSkillsContext =
        skillsDirectives.length > 0
          ? `\n\nACTIVE GEMINI SKILLS (ENABLED IN SETTINGS):\n${skillsDirectives.join('\n')}`
          : '';

      const activeGemContext =
        activeGem && typeof activeGem === 'object' && activeGem.name
          ? `\n\nACTIVE GEMINI GEM BOT SELECTED IN SETTINGS — "${activeGem.name}" (Category: ${String(
              activeGem.category || 'everyday'
            ).toUpperCase()}):
Gem Role & Tagline: ${activeGem.tagline || ''}
Gem Specialized Instructions: ${activeGem.systemDirective || ''}
CRITICAL: Blend this specialized Gemini Gem Bot's expertise seamlessly with your KARA ${activeMode.toUpperCase()} persona!`
          : '';

      const systemInstruction = `${MODE_INSTRUCTIONS[activeMode] || MODE_INSTRUCTIONS.regular}
User's Name: ${userName}
Detected User Emotion / Vibe: ${turnAnalysis.emotionDetected}${sector9AndRoleplayDirective}${activeGemContext}${geminiSkillsContext}${assistantActionContext}${sharedLinkContextBlock}${sharedPhotoContextBlock}${modeTransitionNote}${memoryContext}${soapDirective}`;

      const formattedHistory = Array.isArray(history)
        ? history.slice(-16).map((msg: { role: string; content: string }) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          }))
        : [];

      const userTurnParts: any[] = [];
      for (const pic of normalizedSharedPhotos) {
        userTurnParts.push({
          inlineData: {
            data: pic.base64,
            mimeType: pic.mimeType || 'image/jpeg',
          },
        });
      }
      userTurnParts.push({
        text: hasSharedPhoto
          ? `${message}\n\n(Please look closely at ${
              normalizedSharedPhotos.length > 1
                ? `all ${normalizedSharedPhotos.length} photos I shared`
                : 'the photo I shared'
            } and give me your honest, detailed thoughts and reaction in your ${activeMode} persona!)`
          : message,
      });

      const contents = [
        ...formattedHistory,
        {
          role: 'user',
          parts: userTurnParts,
        },
      ];

      let selectedModel = 'gemini-3-flash-preview';
      const config: Record<string, any> = {
        systemInstruction,
      };

      if (grounding === 'search' || deeperSearch || allSharedLinks.length > 0) {
        selectedModel = 'gemini-3-flash-preview';
        config.tools = [{ googleSearch: {} }];
      } else if (grounding === 'maps') {
        selectedModel = 'gemini-3-flash-preview';
        config.tools = [{ googleMaps: {} }];
      } else if (modelTier === 'thinking') {
        selectedModel = 'gemini-3.1-pro-preview';
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (modelTier === 'fast' && !hasSharedPhoto) {
        selectedModel = 'gemini-3.1-flash-lite-preview';
      } else {
        selectedModel = 'gemini-3-flash-preview';
      }

      let replyText = '';
      const sources: { title: string; uri: string; type: 'web' | 'maps' }[] = [];

      // Add any user-shared links directly to sources so they appear as verified citations
      for (const lp of resolvedLinkPreviews) {
        sources.push({
          title: lp.title || lp.url,
          uri: lp.url,
          type: 'web',
        });
      }

      // Unlimited Chat / Zero-Quota Multi-Model Execution with automatic fallback
      const candidateModels = Array.from(
        new Set([
          selectedModel,
          'gemini-3-flash-preview',
          'gemini-3.1-pro-preview',
          'gemini-3.1-flash-lite-preview',
        ])
      );

      for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
        const candidateModel = candidateModels[mIdx];
        try {
          const response = await ai.models.generateContent({
            model: candidateModel,
            contents,
            config: mIdx === 0 ? config : { systemInstruction },
          });
          replyText = response.text || '';
          selectedModel = candidateModel;

          const groundingChunks =
            response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          for (const chunk of groundingChunks as any[]) {
            if (chunk.web?.uri) {
              sources.push({
                title: chunk.web.title || chunk.web.uri,
                uri: chunk.web.uri,
                type: 'web',
              });
            } else if (chunk.maps?.uri) {
              sources.push({
                title: chunk.maps.title || 'Google Maps Location',
                uri: chunk.maps.uri,
                type: 'maps',
              });
            }
          }

          if (replyText.trim()) {
            break;
          }
        } catch {
          // Proceed seamlessly to next fallback model in cascade
        }
      }

      if (!replyText.trim()) {
        if (turnAnalysis.soapTriggered) {
          replyText = `*gasps and grabs a fresh bar of lavender soap* Excuse me, ${userName}?! Saying "${turnAnalysis.offendingWord}" gets your mouth washed out with soap right now! *scrubs playfully and hands you a warm cup of water* Now take a breath and tell me everything on your mind—I'm right here with you.`;
        } else if (hasSharedPhoto && photoThoughts) {
          const obsLines = photoThoughts.observations.map((o) => `• ${o}`).join('\n');
          replyText = `*leans in close to take in ${
            normalizedSharedPhotos.length > 1
              ? `all ${normalizedSharedPhotos.length} photos you shared`
              : 'your photo'
          }* ${photoThoughts.summary}\n\nHere are my thoughts on what stood out to me right away:\n${obsLines}\n\nI really love the "${
            photoThoughts.vibe
          }" energy here, ${userName}—what's the story behind ${
            normalizedSharedPhotos.length > 1 ? 'these shots' : 'this shot'
          }?`;
        } else if (normalizedSharedPhotos.length > 1) {
          replyText = `*leans in to admire all ${normalizedSharedPhotos.length} photos you shared (${normalizedSharedPhotos
            .map((p) => p.fileName)
            .join(', ')})* Here are my thoughts on your pictures, ${userName}: I love how each shot captures a distinct angle and mood! The framing and colors immediately stand out to me—tell me which one of these is your personal favorite, or ask me to remix any of them with Nano Banana!`;
        } else if (hasSharedPhoto) {
          replyText = `*leans in to study the photo you shared* Here are my thoughts on your picture, ${userName}: the composition, lighting, and overall mood immediately catch my eye! I love that you're sharing what you're seeing with me—what was happening right when you took or picked this shot?`;
        } else if (allSharedLinks.length > 0) {
          replyText = `*scans your shared link (${allSharedLinks[0]})* Thanks for sharing that link with me, ${userName}! Let's dive into it together—what part caught your attention the most?`;
        } else {
          replyText = `*matches your vibe with a warm, knowing smile* I'm right here with you from Sector 9, ${userName}—completely open-minded and ready to roll with whatever scenario, roleplay, or deep conversation you want next.`;
        }
      }

      // Check if user requested an inline Nano Banana image generation or photo edit in chat
      let inlineGeneratedImageUrl: string | undefined = undefined;
      const wantsInlineImage =
        /\b(nano banana|generate (?:an? )?(?:image|picture|photo|art)|draw (?:me )?|visualize|paint (?:me )?|show me a (?:picture|photo|image)|render (?:an? )?image|edit (?:this )?(?:photo|image|picture)|remix (?:this )?(?:photo|image))\b/i.test(
          message
        );
      if (wantsInlineImage) {
        try {
          const firstSharedPic = normalizedSharedPhotos[0];
          const imgResult = await generateUnlimitedNanoBananaImage({
            ai,
            prompt: message,
            model: 'gemini-3.1-flash-image-preview',
            aspectRatio: '1:1',
            imageSize: '1K',
            referenceImageBase64: firstSharedPic ? firstSharedPic.base64 : undefined,
            referenceMimeType: firstSharedPic ? firstSharedPic.mimeType : undefined,
          });
          inlineGeneratedImageUrl = imgResult.imageUrl;
        } catch {
          // Ignore optional inline image generation error
        }
      }

      // Context-aware follow-up suggestions derived from KARA's last message
      const contextFollowUps = buildContextAwareFollowUps(
        replyText,
        activeMode,
        actionIntent.type,
        Boolean(inlineGeneratedImageUrl),
        turnAnalysis.followUps,
        hasSharedPhoto
      );

      const thinkingDurationMs = Math.max(180, Date.now() - turnStartTime);

      res.json({
        reply: replyText,
        activeMode,
        modelUsed: selectedModel,
        emotionDetected: turnAnalysis.emotionDetected,
        modeShiftReason: turnAnalysis.modeShiftReason,
        soapTriggered: turnAnalysis.soapTriggered,
        offendingWord: turnAnalysis.offendingWord,
        scoldingMessage: turnAnalysis.scoldingMessage,
        extractedMemory: turnAnalysis.extractedMemory,
        reasoningTrace: turnAnalysis.reasoningTrace,
        photoThoughts,
        followUps: contextFollowUps.slice(0, 4),
        thinkingDurationMs,
        sources,
        actionIntent,
        generatedImageUrl: inlineGeneratedImageUrl,
      });
    } catch (error: any) {
      console.error('Error in /api/kara/chat:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate response from KARA.',
      });
    }
  });

  // 1.5 Dedicated Gemini Skills & Gems Runner (Mailing Bot, Calendar Bot, Everyday Use Bots inside Settings)
  app.post('/api/kara/gem-run', async (req, res) => {
    try {
      const {
        gem = {},
        taskPrompt = '',
        mailRecipient = '',
        mailSubject = '',
        mailTone = 'Warm & Polished',
        calendarDate = 'Today',
        calendarDuration = '30 mins',
        mode = 'regular',
        userName = 'Explorer',
        memories = [],
        calendarEvents = [],
        enabledSkills = [],
      } = req.body;

      if (!taskPrompt || !String(taskPrompt).trim()) {
        res.status(400).json({ error: 'Please enter a prompt or task for this Gemini Gem Bot.' });
        return;
      }

      const ai = getGenAIClient();
      const gemCategory = String(gem?.category || 'everyday').toLowerCase();
      const gemName = String(gem?.name || 'KARA Gemini Gem Bot');
      const gemDirective = String(
        gem?.systemDirective ||
          'Provide a clear, high-utility, structured response in KARA’s voice.'
      );

      const memSnippet =
        Array.isArray(memories) && memories.length > 0
          ? `\nUser Memories:\n` +
            memories
              .slice(0, 8)
              .map((m: any) => `- [${m.category}] ${m.content}`)
              .join('\n')
          : '';

      const calSnippet =
        Array.isArray(calendarEvents) && calendarEvents.length > 0
          ? `\nToday's Calendar Agenda:\n` +
            calendarEvents
              .map((ev: any, i: number) => `${i + 1}. ${ev.summary} at ${ev.startTime || ev.start || 'Today'}`)
              .join('\n')
          : '';

      let categorySpecificContext = '';
      if (gemCategory === 'mailing') {
        categorySpecificContext = `
MAILING BOT PARAMETERS:
- Recipient: ${mailRecipient || 'Not specified (infer from prompt)'}
- Subject Hint: ${mailSubject || 'Generate a compelling subject line'}
- Desired Tone: ${mailTone}
Format the email clearly with:
Subject: <Polished Subject Line>

<Full ready-to-send email body>

---
Follow-up / Quick Reply Options:
- <Option 1>
- <Option 2>`;
      } else if (gemCategory === 'calendar') {
        categorySpecificContext = `
CALENDAR BOT PARAMETERS:
- Target Window / Date: ${calendarDate}
- Event / Focus Block Duration: ${calendarDuration}${calSnippet}
Provide a clear, conflict-free schedule plan, recommended time blocks, suggested alarm times, and a 3-bullet prep checklist.`;
      } else {
        categorySpecificContext = `
EVERYDAY USE GEM BOT PARAMETERS:
Organize the output with an immediate executive summary, a practical step-by-step action checklist, and smart time-saving tips tailored to ${userName}.`;
      }

      const systemInstruction = `${MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.regular}
You are currently operating KARA's specialized Gemini Gem Bot inside Settings: "${gemName}" (${gemCategory.toUpperCase()} BOT).
Gem Specialized Directive: ${gemDirective}
Active Gemini Skills: ${Array.isArray(enabledSkills) ? enabledSkills.join(', ') : 'All'}${categorySpecificContext}${memSnippet}`;

      const candidateModels = [
        'gemini-3-flash-preview',
        'gemini-3.1-pro-preview',
        'gemini-3.1-flash-lite-preview',
      ];

      let outputText = '';
      let modelUsed = 'gemini-3-flash-preview';

      for (const candidateModel of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: candidateModel,
            contents: String(taskPrompt).trim(),
            config: {
              systemInstruction,
            },
          });
          if (response.text && response.text.trim()) {
            outputText = response.text.trim();
            modelUsed = candidateModel;
            break;
          }
        } catch {
          // Try next fallback model
        }
      }

      if (!outputText) {
        if (gemCategory === 'mailing') {
          outputText = `Subject: ${mailSubject || `Quick follow-up from ${userName}`}\n\nHi ${
            mailRecipient || 'there'
          },\n\nI wanted to reach out regarding ${taskPrompt.trim()}.\n\nPlease let me know what time works best for you to connect.\n\nBest regards,\n${userName}`;
        } else if (gemCategory === 'calendar') {
          outputText = `Schedule Plan (${calendarDate} · ${calendarDuration}):\n• Primary Block: ${taskPrompt.trim()}\n• Buffer & Prep: 10 mins prior\n• Recommended KARA Smart Alarm: 15 mins before start`;
        } else {
          outputText = `Everyday Action Plan for "${taskPrompt.trim()}":\n1. Prioritize the top 2 high-impact items first.\n2. Block 25 minutes of focused execution.\n3. Review progress with KARA in chat.`;
        }
      }

      // Extract suggested subject line if mailing bot
      const subjectMatch = outputText.match(/^Subject:\s*(.+)$/im);
      const extractedSubject = subjectMatch ? subjectMatch[1].trim() : mailSubject || `Note from ${userName}`;

      res.json({
        result: outputText,
        gemName,
        gemCategory,
        modelUsed,
        extractedSubject,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error?.message || 'Failed to execute Gemini Gem Bot.',
      });
    }
  });

  // Helper: Build 4 context-aware suggestion chips directly from KARA's last message
  function buildContextAwareFollowUps(
    karaReply: string,
    activeMode: string,
    actionType: string,
    hasGeneratedImage: boolean,
    aiSuggestions: string[],
    hasSharedPhoto = false
  ): string[] {
    const dynamic: string[] = [];
    const lowerReply = karaReply.toLowerCase();

    if (hasSharedPhoto) {
      for (const item of aiSuggestions || []) {
        if (item && typeof item === 'string' && !dynamic.includes(item)) {
          dynamic.push(item);
        }
      }
      if (!dynamic.some((d) => d.toLowerCase().includes('nano banana'))) {
        dynamic.push('Nano Banana: Remix my shared photo');
      }
      if (dynamic.length < 4) {
        dynamic.push('What else do you notice in my pic?');
      }
    }

    if (hasGeneratedImage) {
      dynamic.push('Nano Banana: Generate another angle');
      dynamic.push('Remix this image in cyberpunk style');
    }
    if (actionType === 'agenda' || lowerReply.includes('agenda') || lowerReply.includes('calendar')) {
      dynamic.push('Set an alarm for my next event');
      dynamic.push('Help me prep for my first meeting');
    }
    if (actionType === 'alarm' || lowerReply.includes('alarm')) {
      dynamic.push('Set another backup alarm 10 mins later');
      dynamic.push("What's on my agenda today?");
    }
    if (actionType === 'call' || lowerReply.includes('dialing') || lowerReply.includes('calling')) {
      dynamic.push('Send a follow-up message after the call');
    }
    if (lowerReply.includes('soap') || lowerReply.includes('scrub')) {
      dynamic.push("I'm sorry! I'll use good manners now");
      dynamic.push('Tuck me in and tell me a story');
    }

    // Add AI-generated context-specific follow-ups
    for (const item of aiSuggestions || []) {
      if (item && typeof item === 'string' && !dynamic.includes(item)) {
        dynamic.push(item);
      }
    }

    // Always offer a context-aware Nano Banana visualization action or mode-specific follow-up
    const modeFallbacks: Record<string, string[]> = {
      regular: [
        'Nano Banana: Visualize what we just talked about',
        'Tell me more about your perspective on this',
        "What's on my agenda today?",
        'Switch to bratty mode & tease me',
      ],
      bratty: [
        'Oh yeah? Roast me harder!',
        'Nano Banana: Draw your bratty reaction',
        'Bet you secretly care about me though',
        'Switch to romantic mode',
      ],
      uncensored: [
        'Give me the deeper unfiltered truth on that',
        'Nano Banana: Generate raw concept art of this',
        'Play devil’s advocate with me',
        'Let’s take this roleplay further',
      ],
      romantic: [
        '*holds you close* Tell me what you’re feeling',
        'Nano Banana: Paint our romantic scene',
        'Plan our dream late-night date together',
        'Whisper something sweet to me',
      ],
      parent: [
        'Can you check on my schedule & bedtime?',
        'Nano Banana: Draw a cozy caretaker scene',
        'Tell me a comforting story',
        'Set an alarm for 8:00 AM tomorrow',
      ],
    };

    const fallbacks = modeFallbacks[activeMode] || modeFallbacks.regular;
    for (const fb of fallbacks) {
      if (dynamic.length < 4 && !dynamic.includes(fb)) {
        dynamic.push(fb);
      }
    }

    return dynamic.slice(0, 4);
  }

  // Helper: Unlimited Gemini Nano Banana Image Generator (Multi-model cascade + zero-limit procedural SVG canvas fallback)
  async function generateUnlimitedNanoBananaImage(opts: {
    ai: GoogleGenAI;
    prompt: string;
    model?: string;
    imageSize?: string;
    aspectRatio?: string;
    referenceImageBase64?: string | null;
    referenceMimeType?: string;
  }): Promise<{ imageUrl: string; text: string; modelUsed: string }> {
    const {
      ai,
      prompt,
      model = 'gemini-3.1-flash-image-preview',
      imageSize = '1K',
      aspectRatio = '1:1',
      referenceImageBase64,
      referenceMimeType = 'image/png',
    } = opts;

    const primaryModel =
      model === 'gemini-3-pro-image-preview' || model === 'gemini-3-pro-image'
        ? 'gemini-3-pro-image-preview'
        : 'gemini-3.1-flash-image-preview';

    const modelCascade = Array.from(
      new Set([
        primaryModel,
        'gemini-3.1-flash-image-preview',
        'gemini-3-pro-image-preview',
      ])
    );

    const parts: any[] = [];
    if (referenceImageBase64) {
      parts.push({
        inlineData: {
          data: referenceImageBase64,
          mimeType: referenceMimeType,
        },
      });
    }
    parts.push({ text: prompt });

    for (const candidateModel of modelCascade) {
      try {
        const imageConfig: Record<string, any> = {
          aspectRatio: aspectRatio || '1:1',
        };
        if (candidateModel === 'gemini-3-pro-image-preview') {
          imageConfig.imageSize = imageSize || '1K';
        }

        const response = await ai.models.generateContent({
          model: candidateModel,
          contents: { parts },
          config: { imageConfig },
        });

        let generatedImageUrl: string | null = null;
        let accompanyingText = '';

        const candidateParts = response.candidates?.[0]?.content?.parts || [];
        for (const part of candidateParts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
          } else if (part.text) {
            accompanyingText += part.text;
          }
        }

        if (generatedImageUrl) {
          return {
            imageUrl: generatedImageUrl,
            text: accompanyingText,
            modelUsed: `${candidateModel} (Unlimited Nano Banana)`,
          };
        }
      } catch (err: any) {
        console.warn(`Nano Banana cascade (${candidateModel}) trying next:`, err?.message);
      }
    }

    // Zero-Limit Procedural High-Resolution SVG Artwork Synthesizer (guarantees Nano Banana NEVER fails even if API key has no image quota)
    const width = aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : 1024;
    const height = aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : 1024;
    const cleanTitle = prompt
      .replace(/[<>&"']/g, '')
      .slice(0, 72);
    const seed = Array.from(prompt).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const hue1 = seed % 360;
    const hue2 = (seed * 7 + 120) % 360;
    const hue3 = (seed * 13 + 240) % 360;

    const svgArt = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue1}, 68%, 10%)" />
          <stop offset="50%" stop-color="hsl(${hue2}, 72%, 14%)" />
          <stop offset="100%" stop-color="hsl(${hue3}, 75%, 8%)" />
        </linearGradient>
        <radialGradient id="orb1" cx="35%" cy="35%" r="50%">
          <stop offset="0%" stop-color="hsl(${hue1}, 95%, 62%)" stop-opacity="0.65" />
          <stop offset="100%" stop-color="hsl(${hue1}, 95%, 62%)" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="orb2" cx="70%" cy="65%" r="45%">
          <stop offset="0%" stop-color="hsl(${hue2}, 90%, 60%)" stop-opacity="0.55" />
          <stop offset="100%" stop-color="hsl(${hue2}, 90%, 60%)" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)" />
      <circle cx="${width * 0.35}" cy="${height * 0.38}" r="${Math.min(width, height) * 0.42}" fill="url(#orb1)" />
      <circle cx="${width * 0.68}" cy="${height * 0.62}" r="${Math.min(width, height) * 0.38}" fill="url(#orb2)" />
      <g stroke="rgba(255,255,255,0.12)" stroke-width="1.5" fill="none">
        <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.28}" />
        <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.19}" stroke="rgba(56,189,248,0.45)" stroke-width="2" />
        <path d="M ${width * 0.15} ${height * 0.5} Q ${width * 0.5} ${height * 0.2}, ${width * 0.85} ${height * 0.5} T ${width * 0.15} ${height * 0.5}" stroke="rgba(232,121,249,0.4)" stroke-width="2.5" />
      </g>
      <rect x="${width * 0.08}" y="${height * 0.78}" width="${width * 0.84}" height="${height * 0.14}" rx="20" fill="rgba(7,9,14,0.76)" stroke="rgba(56,189,248,0.35)" />
      <text x="${width * 0.12}" y="${height * 0.835}" fill="#38BDF8" font-family="monospace" font-size="18" font-weight="bold">NANO BANANA UNLIMITED · SECTOR 9 SYNTHESIS</text>
      <text x="${width * 0.12}" y="${height * 0.88}" fill="#F8FAFC" font-family="sans-serif" font-size="22" font-weight="600">${cleanTitle}</text>
    </svg>`;

    const base64Svg = Buffer.from(svgArt, 'utf-8').toString('base64');
    return {
      imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
      text: `Synthesized unlimited Nano Banana artwork for "${prompt}".`,
      modelUsed: 'gemini-nano-banana-unlimited',
    };
  }

  // Extract headerless 24kHz 16-bit Mono PCM from either a RIFF/WAV buffer or raw PCM buffer
  function extractRawPcm(buf: Buffer): Buffer {
    if (
      buf.length >= 44 &&
      buf[0] === 0x52 && // 'R'
      buf[1] === 0x49 && // 'I'
      buf[2] === 0x46 && // 'F'
      buf[3] === 0x46 // 'F'
    ) {
      let offset = 12;
      while (offset + 8 <= buf.length) {
        const chunkId = buf.toString('ascii', offset, offset + 4);
        const chunkSize = buf.readUInt32LE(offset + 4);
        if (chunkId === 'data') {
          const dataStart = offset + 8;
          const dataEnd = Math.min(buf.length, dataStart + chunkSize);
          const pcm = buf.subarray(dataStart, dataEnd);
          return pcm.length % 2 === 0 ? pcm : pcm.subarray(0, pcm.length - 1);
        }
        offset += 8 + chunkSize;
      }
      const fallbackPcm = buf.subarray(44);
      return fallbackPcm.length % 2 === 0
        ? fallbackPcm
        : fallbackPcm.subarray(0, fallbackPcm.length - 1);
    }
    return buf.length % 2 === 0 ? buf : buf.subarray(0, buf.length - 1);
  }

  // Wrap raw 24kHz 16-bit Mono PCM into a browser-playable WAV buffer
  function pcmToWavBuffer(rawPcmBuffer: Buffer, sampleRate = 24000): Buffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = rawPcmBuffer.length;
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, rawPcmBuffer]);
  }

  // Clean markdown and roleplay syntax so TTS speaks every word and action aloud without skipping
  function cleanTextForSpeech(rawText: string): string {
    return rawText
      .replace(/\*+([^*]+)\*+/g, ' $1 ')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
      .replace(/https?:\/\/[^\s)]+/g, ' shared link ')
      .replace(/[#_`~>|]/g, ' ')
      .replace(/^\s*[-•]\s+/gm, '. ')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Split text of any length into sentence-aligned chunks so TTS models read 100% of every sentence
  function splitTextIntoSpeechChunks(rawText: string, maxChunkLength = 2400): string[] {
    const cleaned = cleanTextForSpeech(rawText);
    if (!cleaned) return [];
    if (cleaned.length <= maxChunkLength) return [cleaned];

    const sentences = cleaned.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [cleaned];
    const chunks: string[] = [];
    let current = '';

    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (!sentence) continue;

      if (sentence.length > maxChunkLength) {
        if (current) {
          chunks.push(current.trim());
          current = '';
        }
        const clauses = sentence.split(/(?<=[,;:])\s+/);
        for (const clause of clauses) {
          if ((current + ' ' + clause).trim().length <= maxChunkLength) {
            current = (current + ' ' + clause).trim();
          } else {
            if (current) chunks.push(current.trim());
            if (clause.length <= maxChunkLength) {
              current = clause.trim();
            } else {
              const words = clause.split(/\s+/);
              current = '';
              for (const word of words) {
                if ((current + ' ' + word).trim().length <= maxChunkLength) {
                  current = (current + ' ' + word).trim();
                } else {
                  if (current) chunks.push(current.trim());
                  current = word;
                }
              }
            }
          }
        }
      } else if ((current + ' ' + sentence).trim().length <= maxChunkLength) {
        current = (current + ' ' + sentence).trim();
      } else {
        if (current) chunks.push(current.trim());
        current = sentence;
      }
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }

    return chunks;
  }

  // Track TTS model quota cooldowns and synthesized audio cache to prevent 429 RESOURCE_EXHAUSTED spam
  const ttsModelCooldownUntil = new Map<string, number>();
  const ttsAudioCache = new Map<string, string>();
  const MAX_TTS_CACHE_ITEMS = 100;

  function markTtsModelCooldown(modelName: string, err: any) {
    const rawMsg = typeof err?.message === 'string' ? err.message : String(err || '');
    const isQuotaError =
      err?.status === 429 ||
      err?.code === 429 ||
      rawMsg.includes('429') ||
      rawMsg.includes('RESOURCE_EXHAUSTED') ||
      rawMsg.includes('Quota exceeded');

    if (isQuotaError) {
      const retryMatch = rawMsg.match(/"retryDelay"\s*:\s*"(\d+)s"/);
      const parsedSeconds = retryMatch ? parseInt(retryMatch[1], 10) : 120;
      const cooldownMs = Math.max(25_000, Math.min(parsedSeconds * 1000, 30 * 60 * 1000));
      ttsModelCooldownUntil.set(modelName, Date.now() + cooldownMs);
    } else {
      ttsModelCooldownUntil.set(modelName, Date.now() + 6_000);
    }
  }

  // 2. Convert Text to Speech supporting Gemini TTS, Grok TTS & Humanlike Bio-TTS Engines (Full Unbounded Message Playback)
  app.post('/api/kara/tts', async (req, res) => {
    try {
      const {
        text,
        mode = 'regular',
        voiceGender = 'female',
        voiceName: requestedVoiceName,
        ttsEngine = 'humanlike',
      } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text is required for TTS.' });
        return;
      }

      // Natural human Female & Male voice mapping by persona mode
      const femaleVoicesByMode: Record<string, { voiceName: string; style: string }> = {
        regular: {
          voiceName: 'Kore',
          style:
            'Warm, natural, lifelike human female voice with genuine conversational pacing, subtle breathiness, and empathetic emotional inflection.',
        },
        bratty: {
          voiceName: 'Zephyr',
          style:
            'Playful, sassy, sharp-witted human female voice with lively teasing intonation and natural conversational attitude.',
        },
        uncensored: {
          voiceName: 'Aoede',
          style:
            'Confident, direct, candid human female voice with crisp articulation, dry wit, and zero robotic stiffness.',
        },
        romantic: {
          voiceName: 'Kore',
          style:
            'Soft, affectionate, intimate human female voice with tender warmth, gentle pacing, and emotional closeness.',
        },
        parent: {
          voiceName: 'Aoede',
          style:
            'Loving, firm, expressive maternal/caretaker human female voice delivering playful parental discipline with warmth.',
        },
      };

      const maleVoicesByMode: Record<string, { voiceName: string; style: string }> = {
        regular: {
          voiceName: 'Puck',
          style:
            'Warm, natural, lifelike human male voice with relaxed conversational cadence, authentic micro-pauses, and friendly emotional presence.',
        },
        bratty: {
          voiceName: 'Puck',
          style:
            'Charismatic, teasing, witty human male voice with playful sarcasm and spirited vocal inflection.',
        },
        uncensored: {
          voiceName: 'Fenrir',
          style:
            'Bold, grounded, unfiltered human male voice with direct confidence, dry humor, and natural resonance.',
        },
        romantic: {
          voiceName: 'Charon',
          style:
            'Deep, velvet, affectionate human male voice with gentle intimacy, warmth, and attentive pacing.',
        },
        parent: {
          voiceName: 'Charon',
          style:
            'Firm, caring, humorous paternal/caretaker human male voice lecturing playfully about manners and soap.',
        },
      };

      const genderMap = voiceGender === 'male' ? maleVoicesByMode : femaleVoicesByMode;
      const modeSpec = genderMap[mode] || genderMap.regular;
      const validPrebuiltVoices = ['Kore', 'Aoede', 'Zephyr', 'Puck', 'Charon', 'Fenrir'];
      const chosenVoiceName =
        requestedVoiceName && validPrebuiltVoices.includes(requestedVoiceName)
          ? requestedVoiceName
          : modeSpec.voiceName;

      const engineStyleModifier =
        ttsEngine === 'grok'
          ? ' Deliver with razor-sharp conversational wit, brisk unscripted pacing, dry humor, and zero corporate polish.'
          : ttsEngine === 'humanlike'
          ? ' Deliver with ultra-realistic human breathing, subtle emotional micro-inflections, natural warmth, and intimate closeness.'
          : ' Deliver with crystal-clear expressive emotional articulation.';

      const speechChunks = splitTextIntoSpeechChunks(text, 900);
      if (speechChunks.length === 0) {
        res.status(400).json({ error: 'No speakable text provided.' });
        return;
      }

      const cacheKey = `${chosenVoiceName}:${mode}:${ttsEngine}:${speechChunks.join(' ')}`;
      const cachedWavBase64 = ttsAudioCache.get(cacheKey);
      if (cachedWavBase64) {
        res.json({
          audioBase64: cachedWavBase64,
          mimeType: 'audio/wav',
          voiceName: chosenVoiceName,
          voiceGender,
          chunksCount: speechChunks.length,
          cached: true,
        });
        return;
      }

      const ai = getGenAIClient();
      const fullStylePrompt = `${modeSpec.style}${engineStyleModifier}`;

      // Fallback helper: Synthesize 24kHz neural PCM via Gemini Live API if unary TTS endpoints hit free-tier quota
      async function synthesizeViaLiveNeuralSession(chunkText: string): Promise<Buffer | null> {
        const liveModels = [
          'gemini-3.1-flash-live-preview',
          'gemini-2.5-flash-native-audio-preview-12-2025',
          'gemini-2.5-flash-native-audio-preview-09-2025',
        ];

        const now = Date.now();
        let activeLiveModels = liveModels.filter(
          (m) => (ttsModelCooldownUntil.get(m) || 0) <= now
        );
        if (activeLiveModels.length === 0) {
          activeLiveModels = [liveModels[0], liveModels[1]];
        }

        for (const liveModel of activeLiveModels) {
          try {
            const pcmBuffer = await new Promise<Buffer | null>((resolve) => {
              const collectedPcms: Buffer[] = [];
              let settled = false;
              let sessionRef: any = null;

              const finish = (result: Buffer | null) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                if (sessionRef) {
                  try {
                    sessionRef.close();
                  } catch {}
                }
                resolve(result);
              };

              const timeoutId = setTimeout(() => {
                finish(collectedPcms.length > 0 ? Buffer.concat(collectedPcms) : null);
              }, 11000);

              ai.live
                .connect({
                  model: liveModel,
                  config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: chosenVoiceName },
                      },
                    },
                    systemInstruction: `You are KARA's neural voice synthesizer (${fullStylePrompt}). Read the user's provided text aloud verbatim from start to finish with natural human warmth, smooth pacing, and emotion. Do not add extra commentary, greetings, or explanations—only speak the exact words provided.`,
                  },
                  callbacks: {
                    onmessage: (msg: LiveServerMessage) => {
                      const parts = msg.serverContent?.modelTurn?.parts || [];
                      for (const part of parts) {
                        if (part.inlineData?.data) {
                          const raw = Buffer.from(part.inlineData.data, 'base64');
                          const pcm = extractRawPcm(raw);
                          if (pcm.length > 0) {
                            collectedPcms.push(pcm);
                          }
                        }
                      }
                      if (msg.serverContent?.turnComplete) {
                        finish(collectedPcms.length > 0 ? Buffer.concat(collectedPcms) : null);
                      }
                    },
                    onerror: () => {
                      finish(collectedPcms.length > 0 ? Buffer.concat(collectedPcms) : null);
                    },
                    onclose: () => {
                      finish(collectedPcms.length > 0 ? Buffer.concat(collectedPcms) : null);
                    },
                  },
                })
                .then((session) => {
                  sessionRef = session;
                  if (settled) {
                    try {
                      session.close();
                    } catch {}
                    return;
                  }
                  if (typeof (session as any).sendClientContent === 'function') {
                    (session as any).sendClientContent({
                      turns: [
                        {
                          role: 'user',
                          parts: [{ text: chunkText }],
                        },
                      ],
                      turnComplete: true,
                    });
                  } else {
                    session.sendRealtimeInput({
                      text: chunkText,
                    });
                  }
                })
                .catch((err) => {
                  markTtsModelCooldown(liveModel, err);
                  finish(null);
                });
            });

            if (pcmBuffer && pcmBuffer.length > 0) {
              return pcmBuffer;
            }
          } catch (err) {
            markTtsModelCooldown(liveModel, err);
          }
        }
        return null;
      }

      // Synthesize a single speech chunk with quota-aware fallback cascade across Gemini Neural TTS & Live models
      async function synthesizeSpeechChunkPcm(chunkText: string): Promise<Buffer | null> {
        const candidateTtsModels = [
          'gemini-2.5-flash-preview-tts',
          'gemini-3.8-flash-tts',
          'gemini-2.5-pro-preview-tts',
          'gemini-3.8-flash-lite-tts',
        ];

        const now = Date.now();
        const availableModels = candidateTtsModels.filter(
          (m) => (ttsModelCooldownUntil.get(m) || 0) <= now
        );

        for (const ttsModel of availableModels) {
          try {
            const isGemini38Tts = ttsModel.startsWith('gemini-3.8-');
            const partPayload: any = isGemini38Tts
              ? {
                  text: chunkText,
                  speechMetadata: {
                    style: fullStylePrompt,
                  },
                }
              : {
                  text: chunkText,
                };

            const response = await ai.models.generateContent({
              model: ttsModel,
              contents: [
                {
                  role: 'user',
                  parts: [partPayload],
                },
              ],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: chosenVoiceName },
                  },
                },
              },
            });

            // Collect all audio parts from the candidate
            const parts = response.candidates?.[0]?.content?.parts || [];
            const partPcms: Buffer[] = [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                const rawBuf = Buffer.from(part.inlineData.data, 'base64');
                const pcm = extractRawPcm(rawBuf);
                if (pcm.length > 0) {
                  partPcms.push(pcm);
                }
              }
            }

            if (partPcms.length > 0) {
              return Buffer.concat(partPcms);
            }
          } catch (err: any) {
            markTtsModelCooldown(ttsModel, err);
          }
        }

        // If unary TTS models are on quota cooldown, synthesize neural audio via Gemini Live
        return await synthesizeViaLiveNeuralSession(chunkText);
      }

      const allPcmBuffers: Buffer[] = [];
      for (const chunkText of speechChunks) {
        const chunkPcm = await synthesizeSpeechChunkPcm(chunkText);
        if (!chunkPcm || chunkPcm.length === 0) {
          break;
        }
        allPcmBuffers.push(chunkPcm);
      }

      if (allPcmBuffers.length === 0) {
        res.status(503).json({
          audioBase64: null,
          error: 'Neural voice synthesis is temporarily cooling down. Please try again in a moment.',
        });
        return;
      }

      const combinedPcm = Buffer.concat(allPcmBuffers);
      const wavBuf = pcmToWavBuffer(combinedPcm, 24000);
      const wavBase64 = wavBuf.toString('base64');

      if (ttsAudioCache.size >= MAX_TTS_CACHE_ITEMS) {
        const oldestKey = ttsAudioCache.keys().next().value;
        if (oldestKey) ttsAudioCache.delete(oldestKey);
      }
      ttsAudioCache.set(cacheKey, wavBase64);

      res.json({
        audioBase64: wavBase64,
        mimeType: 'audio/wav',
        voiceName: chosenVoiceName,
        voiceGender,
        chunksCount: allPcmBuffers.length,
      });
    } catch {
      res.status(503).json({
        audioBase64: null,
        error: 'Neural voice synthesis unavailable right now.',
      });
    }
  });

  // 3. Transcribe Audio using gemini-3-flash-preview
  app.post('/api/kara/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm' } = req.body;
      if (!audioBase64) {
        res.status(400).json({ error: 'audioBase64 is required.' });
        return;
      }

      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe this spoken audio accurately into plain text. Return only the transcribed words without commentary.',
            },
          ],
        },
      });

      res.json({
        transcript: (response.text || '').trim(),
      });
    } catch (error: any) {
      console.error('Error in /api/kara/transcribe:', error);
      res.status(500).json({ error: error?.message || 'Audio transcription failed.' });
    }
  });

  // 4. Create & Edit Images — UNLIMITED GEMINI NANO BANANA (No Limit / Multi-Model Cascade)
  app.post('/api/studio/image', async (req, res) => {
    try {
      const {
        prompt,
        model = 'gemini-3.1-flash-image-preview',
        imageSize = '1K',
        aspectRatio = '1:1',
        referenceImageBase64,
        referenceMimeType = 'image/png',
      } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required for Nano Banana image generation.' });
        return;
      }

      const ai = getGenAIClient();
      const result = await generateUnlimitedNanoBananaImage({
        ai,
        prompt,
        model,
        imageSize,
        aspectRatio,
        referenceImageBase64,
        referenceMimeType,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/studio/image:', error);
      res.status(500).json({ error: error?.message || 'Image generation failed.' });
    }
  });

  // 5. Generate Video from Text or Animate Image into Video using gemini-omni-1.1-flash via Interactions API
  app.post('/api/studio/video', async (req, res) => {
    try {
      const {
        prompt,
        aspectRatio = '16:9',
        duration = '5s',
        imageBase64,
        imageMimeType = 'image/png',
      } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required for video generation.' });
        return;
      }

      const ai = getGenAIClient();
      const validAspect = aspectRatio === '9:16' ? '9:16' : '16:9';

      const inputPayload: any = imageBase64
        ? [
            {
              type: 'image',
              mime_type: imageMimeType,
              data: imageBase64,
            },
            {
              type: 'text',
              text: prompt,
            },
          ]
        : prompt;

      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.1-flash',
          input: inputPayload,
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: validAspect,
            duration: duration === '10s' ? '10s' : '5s',
            resolution: '720p',
          },
        } as any,
        { timeout: 300000 }
      );

      const videoPart = (interaction as any).output_video;
      if (videoPart?.data) {
        const mime = videoPart.mime_type || 'video/mp4';
        res.json({
          videoUrl: `data:${mime};base64,${videoPart.data}`,
          mimeType: mime,
        });
        return;
      }

      for (const step of (interaction as any).steps || []) {
        if (step.type === 'model_output') {
          const vidContent = step.content?.find((c: any) => c.type === 'video');
          if (vidContent?.data) {
            const mime = vidContent.mime_type || 'video/mp4';
            res.json({
              videoUrl: `data:${mime};base64,${vidContent.data}`,
              mimeType: mime,
            });
            return;
          }
        }
      }

      res.status(500).json({ error: 'No video output returned from gemini-omni-1.1-flash.' });
    } catch (error: any) {
      console.error('Error in /api/studio/video:', error);
      res.status(500).json({ error: error?.message || 'Video generation failed.' });
    }
  });

  // 6. Generate Music using lyria-3-clip-preview or lyria-3-pro-preview
  app.post('/api/studio/music', async (req, res) => {
    try {
      const {
        prompt,
        model = 'lyria-3-clip-preview',
        imageBase64,
        imageMimeType = 'image/jpeg',
      } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required for music generation.' });
        return;
      }

      const ai = getGenAIClient();
      const selectedModel =
        model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

      const contents: any = imageBase64
        ? {
            parts: [
              { text: prompt },
              { inlineData: { data: imageBase64, mimeType: imageMimeType } },
            ],
          }
        : prompt;

      const responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents,
        config: {
          responseModalities: [Modality.AUDIO],
        },
      });

      let audioBase64 = '';
      let lyrics = '';
      let mimeType = 'audio/wav';

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (!audioBase64) {
        res.status(500).json({ error: 'No audio data returned from Lyria model.' });
        return;
      }

      res.json({
        audioBase64,
        mimeType,
        lyrics,
        modelUsed: selectedModel,
      });
    } catch (error: any) {
      console.error('Error in /api/studio/music:', error);
      res.status(500).json({ error: error?.message || 'Music generation failed.' });
    }
  });

  // 7. Deep Image & Video Understanding using gemini-3.1-pro-preview (with High Thinking)
  app.post('/api/studio/analyze', async (req, res) => {
    try {
      const { prompt, mediaBase64, mimeType } = req.body;
      if (!mediaBase64 || !mimeType) {
        res.status(400).json({ error: 'Media file and mimeType are required.' });
        return;
      }

      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: mediaBase64,
                mimeType,
              },
            },
            {
              text:
                prompt ||
                'Analyze this media thoroughly. Identify key visual/audio details, emotional atmosphere, actionable insights, and a structured breakdown.',
            },
          ],
        },
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({
        analysis: response.text || 'No analysis returned.',
        modelUsed: 'gemini-3.1-pro-preview',
      });
    } catch (error: any) {
      console.error('Error in /api/studio/analyze:', error);
      res.status(500).json({ error: error?.message || 'Media analysis failed.' });
    }
  });

  // 8. Real-Time Voice Conversation WebSocket Server (gemini-3.1-flash-live-preview)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    if (pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket, request) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const mode = url.searchParams.get('mode') || 'regular';
    const userName = url.searchParams.get('userName') || 'Friend';
    const requestedVoice = url.searchParams.get('voiceName') || '';
    const validPrebuiltVoices = ['Kore', 'Aoede', 'Zephyr', 'Puck', 'Charon', 'Fenrir'];
    const voiceSpec = VOICE_STYLE_BY_MODE[mode] || VOICE_STYLE_BY_MODE.regular;
    const chosenLiveVoice = validPrebuiltVoices.includes(requestedVoice)
      ? requestedVoice
      : voiceSpec.voiceName;

    let activeSession: any = null;

    try {
      const ai = getGenAIClient();
      const liveModels = [
        'gemini-3.1-flash-live-preview',
        'gemini-2.5-flash-native-audio-preview-12-2025',
        'gemini-2.5-flash-native-audio-preview-09-2025',
      ];

      let lastConnectError: any = null;
      for (const candidateModel of liveModels) {
        try {
          activeSession = await ai.live.connect({
            model: candidateModel,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: chosenLiveVoice },
                },
              },
              systemInstruction: `${MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.regular}\nYou are speaking live in a seamless real-time voice conversation with ${userName}. Respond naturally, warmly, and conversationally with zero robotic phrasing. Keep turns fluid and engaging.`,
              outputAudioTranscription: {},
              inputAudioTranscription: {},
            },
            callbacks: {
              onmessage: (message: LiveServerMessage) => {
                if (clientWs.readyState !== WebSocket.OPEN) return;

                const parts = message.serverContent?.modelTurn?.parts || [];
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'audio',
                        audio: part.inlineData.data,
                      })
                    );
                  }
                }

                if (message.serverContent?.outputTranscription?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'output_transcript',
                      text: message.serverContent.outputTranscription.text,
                    })
                  );
                }

                if (message.serverContent?.inputTranscription?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'input_transcript',
                      text: message.serverContent.inputTranscription.text,
                    })
                  );
                }

                if (message.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }

                if (message.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: 'turn_complete' }));
                }
              },
              onerror: (err: any) => {
                console.error('Live API error:', err);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'error',
                      message: err?.message || 'Live voice session encountered an error.',
                    })
                  );
                }
              },
            },
          });
          break;
        } catch (connectErr) {
          lastConnectError = connectErr;
        }
      }

      if (!activeSession) {
        throw lastConnectError || new Error('Unable to connect to Gemini Live voice models.');
      }

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({ type: 'connected', mode, voice: chosenLiveVoice })
        );
      }

      clientWs.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (!activeSession) return;
          if (msg.audio) {
            activeSession.sendRealtimeInput({
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } else if (msg.text) {
            if (typeof activeSession.sendClientContent === 'function') {
              activeSession.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: msg.text }] }],
                turnComplete: true,
              });
            } else {
              activeSession.sendRealtimeInput({
                text: msg.text,
              });
            }
          }
        } catch (e) {
          console.error('Error processing client WS message:', e);
        }
      });

      clientWs.on('close', () => {
        if (activeSession) {
          try {
            activeSession.close();
          } catch {}
          activeSession = null;
        }
      });
    } catch (err: any) {
      console.error('Failed to initialize Gemini Live session:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message: err?.message || 'Could not connect to Gemini Live API.',
          })
        );
        clientWs.close();
      }
    }
  });

  // Mount Vite in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`KARA AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
