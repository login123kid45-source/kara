import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
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

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setStatus('connecting');
    setErrorMsg('');
    setUserTranscript('');
    setKaraTranscript('');
    setIsKaraSpeaking(false);

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

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(2048, 1, 1);
        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current) return;
          if (ws.readyState === WebSocket.OPEN) {
            const channelData = e.inputBuffer.getChannelData(0);
            const pcm16k = downsampleTo16kHz(channelData, inputCtx.sampleRate || 16000);
            const base64Audio = floatTo16BitPCMBase64(pcm16k);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'connected') {
              setStatus('connected');
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
              const startAt = Math.max(now, nextStartTimeRef.current);
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
              setErrorMsg(msg.message || 'Live voice error');
            }
          } catch (err) {
            console.error('Error parsing Live WS frame:', err);
          }
        };

        ws.onerror = () => {
          if (!cancelled) {
            setStatus('error');
            setErrorMsg('WebSocket connection to Gemini Live interrupted.');
          }
        };
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err?.message || 'Microphone permission is required for Live Voice.');
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
  }, [isOpen, activeMode, userName, voiceName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#0F131C] border border-neutral-800 rounded-2xl p-6 text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>Seamless Neural Talkback</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{activeMode} Persona</span>
            </div>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Real-Time Voice Session
            </h2>
          </div>

          <span className="text-xs font-mono tabular-nums text-sky-400">
            {status === 'connecting'
              ? 'Connecting...'
              : status === 'connected'
              ? isKaraSpeaking
                ? 'KARA Speaking'
                : 'Listening Live'
              : 'Disconnected'}
          </span>
        </div>

        {/* Orbital Acoustic Visualizer */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div
            className={`relative w-32 h-32 rounded-full bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-fuchsia-500/20 border flex items-center justify-center transition-all duration-300 ${
              isKaraSpeaking
                ? 'border-sky-400 scale-105 shadow-[0_0_30px_rgba(56,189,248,0.28)]'
                : 'border-sky-400/30'
            }`}
          >
            <Volume2
              className={`w-10 h-10 text-sky-300 ${isKaraSpeaking ? 'animate-pulse' : ''}`}
            />
          </div>

          {status === 'error' ? (
            <p className="mt-4 text-xs text-rose-400 text-center max-w-xs">{errorMsg}</p>
          ) : (
            <p className="mt-4 text-xs text-neutral-400 text-center">
              {isMuted
                ? 'Microphone muted — tap Unmute to speak with KARA'
                : isKaraSpeaking
                ? 'KARA is talking back — speak anytime to interrupt naturally'
                : 'Speak naturally — KARA is listening in real time'}
            </p>
          )}
        </div>

        {/* Live Transcripts */}
        <div className="space-y-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 text-xs min-h-24">
          <div>
            <span className="text-neutral-500">You: </span>
            <span className="text-neutral-200">
              {userTranscript || 'Start speaking...'}
            </span>
          </div>
          <div>
            <span className="text-sky-400">KARA: </span>
            <span className="text-neutral-100">
              {karaTranscript || 'Listening for your voice...'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
              isMuted
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Voice Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};

