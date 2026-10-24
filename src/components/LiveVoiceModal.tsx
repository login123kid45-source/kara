import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  RefreshCw,
  Send,
  Zap,
  Radio,
  Sparkles,
} from 'lucide-react';
import { KaraMode } from '../lib/firebase';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: KaraMode;
  userName: string;
  voiceName?: string;
}

function downsampleTo16kHz(buffer: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000 || inputSampleRate <= 0) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / 16000;
  const newLength = Math.max(1, Math.round(buffer.length / sampleRateRatio));
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function floatTo16BitPCMBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  activeMode,
  userName,
  voiceName,
}) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isKaraSpeaking, setIsKaraSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [karaTranscript, setKaraTranscript] = useState('');
  const [userAudioLevel, setUserAudioLevel] = useState<number>(0);
  const [textInput, setTextInput] = useState('');
  const [reconnectKey, setReconnectKey] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const isMutedRef = useRef<boolean>(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const stopAllScheduledAudio = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {}
      try {
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current.clear();
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    setIsKaraSpeaking(false);
  };

  const sendTextMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setUserTranscript(trimmed);
    wsRef.current.send(JSON.stringify({ text: trimmed }));
    setTextInput('');
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setStatus('connecting');
    setErrorMsg('');
    setUserTranscript('');
    setKaraTranscript('');
    setIsKaraSpeaking(false);
    setUserAudioLevel(0);

    const startLiveSession = async () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/live?mode=${encodeURIComponent(
          activeMode
        )}&userName=${encodeURIComponent(userName)}&voiceName=${encodeURIComponent(
          voiceName || ''
        )}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioCtx({ sampleRate: 16000 });
        const outputCtx = new AudioCtx({ sampleRate: 24000 });
        inputCtxRef.current = inputCtx;
        outputCtxRef.current = outputCtx;
        nextStartTimeRef.current = 0;

        await inputCtx.resume().catch(() => {});
        await outputCtx.resume().catch(() => {});

        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (mediaErr: any) {
          console.warn('Microphone access denied or not available:', mediaErr);
          // If mic is denied in iframe, still allow text-prompting into the live Gemini session
          setErrorMsg(
            'Microphone access was not granted. You can still type prompts below to hear KARA speak live!'
          );
        }

        if (cancelled) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }

        if (stream) {
          streamRef.current = stream;
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(2048, 1, 1);

          // Route through a zero-gain node before destination to prevent local feedback/echo
          const zeroGain = inputCtx.createGain();
          zeroGain.gain.value = 0;

          source.connect(processor);
          processor.connect(zeroGain);
          zeroGain.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (isMutedRef.current) {
              setUserAudioLevel(0);
              return;
            }
            const channelData = e.inputBuffer.getChannelData(0);

            // Compute audio volume RMS for real-time visualizer reactivity
            let sum = 0;
            for (let i = 0; i < channelData.length; i++) {
              sum += channelData[i] * channelData[i];
            }
            const rms = Math.sqrt(sum / channelData.length);
            setUserAudioLevel(Math.min(1, rms * 6));

            // While KARA is actively speaking, gate low-energy ambient/speaker bleed (< 0.04 RMS)
            // so she never falsely interrupts herself mid-sentence; allow intentional user barge-in (>= 0.04 RMS)
            if (activeSourcesRef.current.size > 0 && rms < 0.04) {
              return;
            }

            if (ws.readyState === WebSocket.OPEN) {
              const pcm16k = downsampleTo16kHz(channelData, inputCtx.sampleRate || 16000);
              const base64Audio = floatTo16BitPCMBase64(pcm16k);
              ws.send(JSON.stringify({ audio: base64Audio }));
            }
          };
        }

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'connected') {
              setStatus('connected');
              if (!streamRef.current) {
                // If connected but no mic, keep status connected for text-to-live-voice
                setErrorMsg('');
              }
            } else if (msg.type === 'audio' && msg.audio && outputCtxRef.current) {
              const ctx = outputCtxRef.current;
              if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
              }
              const binary = atob(msg.audio);
              const len = binary.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              const sampleCount = Math.floor(bytes.byteLength / 2);
              if (sampleCount <= 0) return;

              const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
              const float32 = new Float32Array(sampleCount);
              for (let i = 0; i < sampleCount; i++) {
                float32[i] = view.getInt16(i * 2, true) / 32768.0;
              }

              const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
              audioBuffer.copyToChannel(float32, 0);

              const sourceNode = ctx.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(ctx.destination);

              activeSourcesRef.current.add(sourceNode);
              setIsKaraSpeaking(true);

              sourceNode.onended = () => {
                activeSourcesRef.current.delete(sourceNode);
                if (activeSourcesRef.current.size === 0) {
                  setIsKaraSpeaking(false);
                }
              };

              const now = ctx.currentTime;
              // Add a 45ms jitter buffer when starting a new speech burst so consecutive
              // WebSocket frames concatenate seamlessly without underrun cutouts
              const startAt =
                nextStartTimeRef.current > now ? nextStartTimeRef.current : now + 0.045;
              sourceNode.start(startAt);
              nextStartTimeRef.current = startAt + audioBuffer.duration;
            } else if (msg.type === 'input_transcript' && msg.text) {
              setUserTranscript((prev) => (prev + ' ' + msg.text).trim().slice(-240));
            } else if (msg.type === 'output_transcript' && msg.text) {
              setKaraTranscript((prev) => (prev + ' ' + msg.text).trim().slice(-320));
            } else if (msg.type === 'interrupted') {
              // Seamless barge-in: immediately stop all queued KARA audio chunks when user speaks
              stopAllScheduledAudio();
            } else if (msg.type === 'error') {
              setStatus('error');
              setErrorMsg(msg.message || 'Live voice session error');
            }
          } catch (err) {
            console.error('Error parsing Live WS frame:', err);
          }
        };

        ws.onerror = () => {
          if (!cancelled) {
            setStatus('error');
            setErrorMsg('WebSocket connection to Gemini Live was interrupted or unable to connect.');
          }
        };
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err?.message || 'Unable to establish real-time audio session.');
        }
      }
    };

    startLiveSession();

    return () => {
      cancelled = true;
      stopAllScheduledAudio();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (inputCtxRef.current) {
        inputCtxRef.current.close().catch(() => {});
        inputCtxRef.current = null;
      }
      if (outputCtxRef.current) {
        outputCtxRef.current.close().catch(() => {});
        outputCtxRef.current = null;
      }
    };
  }, [isOpen, activeMode, userName, voiceName, reconnectKey]);

  if (!isOpen) return null;

  // Visualizer scale calculation reacting dynamically to user volume or Kara's voice
  const visualizerScale = isKaraSpeaking
    ? 'scale-110 shadow-[0_0_35px_rgba(56,189,248,0.45)] border-sky-400'
    : userAudioLevel > 0.1
    ? 'scale-105 shadow-[0_0_25px_rgba(16,185,129,0.35)] border-emerald-400'
    : 'scale-100 border-sky-400/30';

  const samplePrompts = [
    `Hey Kara, how's Sector 9?`,
    `Check in on me, what's on your mind?`,
    `Tell me something funny today`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-[#0F131C] border border-neutral-800 rounded-3xl p-6 text-neutral-100 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1 text-sky-400 font-mono">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Gemini 3.8 Multimodal Live
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{activeMode} Persona</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-white flex items-center gap-2">
              <span>Real-Time Bi-Directional Voice</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                16kHz In · 24kHz Out
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : status === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-mono tabular-nums text-neutral-300">
              {status === 'connecting'
                ? 'Connecting...'
                : status === 'connected'
                ? isKaraSpeaking
                  ? 'KARA Talking'
                  : userAudioLevel > 0.15
                  ? 'User Speaking'
                  : 'Listening Live'
                : 'Offline'}
            </span>
          </div>
        </div>

        {/* Acoustic Orbital Visualizer */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div
            className={`relative w-36 h-36 rounded-full bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-fuchsia-500/20 border flex items-center justify-center transition-all duration-200 ${visualizerScale}`}
          >
            <div className="absolute inset-2 rounded-full border border-sky-400/20 animate-spin [animation-duration:8s]" />
            <Volume2
              className={`w-12 h-12 text-sky-300 transition-transform ${
                isKaraSpeaking ? 'animate-bounce text-sky-200' : 'text-sky-400'
              }`}
            />
          </div>

          {status === 'error' ? (
            <div className="mt-4 flex flex-col items-center gap-2 text-center max-w-sm">
              <p className="text-xs text-rose-400">{errorMsg || 'Connection interrupted.'}</p>
              <button
                type="button"
                onClick={() => setReconnectKey((k) => k + 1)}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-sky-300 border border-neutral-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconnect to Live API</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-xs text-neutral-300 font-medium">
                {isMuted
                  ? 'Microphone muted — tap Unmute to talk'
                  : isKaraSpeaking
                  ? 'KARA is speaking live — start talking anytime to interrupt naturally (barge-in)'
                  : userAudioLevel > 0.15
                  ? 'Transmitting user voice stream...'
                  : 'Speak into your microphone — continuous real-time conversation'}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Full-duplex zero-delay audio with instantaneous interrupt support
              </p>
            </div>
          )}
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="space-y-2 bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-4 text-xs min-h-[90px] shadow-inner">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-semibold shrink-0">You:</span>
            <span className="text-neutral-200 break-words flex-1">
              {userTranscript || <span className="text-neutral-500 italic">Listening...</span>}
            </span>
          </div>
          <div className="flex items-start gap-2 pt-1 border-t border-neutral-800/60">
            <span className="text-sky-400 font-semibold shrink-0">KARA:</span>
            <span className="text-neutral-100 break-words flex-1">
              {karaTranscript || (
                <span className="text-neutral-500 italic">Waiting for speech...</span>
              )}
            </span>
          </div>
        </div>

        {/* Quick prompt injection buttons for instant live audio talkback */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-neutral-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            Quick prompt:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendTextMessage(p)}
              disabled={status !== 'connected'}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Live Text Injection Bar (Send text directly into the full-duplex live session) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendTextMessage(textInput);
          }}
          className="mt-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={status !== 'connected'}
            placeholder="Type a message into the live voice stream..."
            className="flex-1 bg-neutral-900/90 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || status !== 'connected'}
            className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 shrink-0"
            title="Send into live voice channel"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

        {/* Action Controls */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className={`px-4 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isMuted
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-neutral-400">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full-Duplex</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-md"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
