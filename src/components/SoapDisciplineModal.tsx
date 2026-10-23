import React, { useState } from 'react';
import { Sparkles, Volume2, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SoapDisciplineModalProps {
  isOpen: boolean;
  offendingWord: string;
  scoldingMessage: string;
  soapWashCount: number;
  onCompleteScrub: () => void;
  onSpeakLecture: (text: string) => void;
  isSpeaking: boolean;
}

export const SoapDisciplineModal: React.FC<SoapDisciplineModalProps> = ({
  isOpen,
  offendingWord,
  scoldingMessage,
  soapWashCount,
  onCompleteScrub,
  onSpeakLecture,
  isSpeaking,
}) => {
  const [scrubProgress, setScrubProgress] = useState(0);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  if (!isOpen) return null;

  const handleScrubStep = (clientX?: number, clientY?: number) => {
    setScrubProgress((prev) => {
      const next = Math.min(100, prev + 8);
      return next;
    });

    const newBubble = {
      id: Date.now() + Math.random(),
      x: clientX ? (clientX % 260) + 20 : Math.floor(Math.random() * 240) + 20,
      y: clientY ? (clientY % 80) + 10 : Math.floor(Math.random() * 70) + 10,
      size: Math.floor(Math.random() * 18) + 10,
    };

    setBubbles((prev) => [...prev.slice(-14), newBubble]);
  };

  const isClean = scrubProgress >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-[#0F131C] border border-neutral-800 rounded-2xl p-6 text-neutral-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Parent Mode Discipline</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Offense #{soapWashCount}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              Time to Wash Your Mouth With Soap
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onSpeakLecture(scoldingMessage)}
            disabled={isSpeaking}
            className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isSpeaking ? 'Lecturing...' : 'Hear Lecture'}</span>
          </button>
        </div>

        {/* Custom Iridescent Soap Bar & Bubbles Visual Container */}
        <div
          onMouseMove={(e) => {
            if (e.buttons === 1 && !isClean) {
              handleScrubStep(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            }
          }}
          onClick={(e) => {
            if (!isClean) {
              handleScrubStep(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            }
          }}
          className="relative my-5 h-44 w-full rounded-xl bg-gradient-to-br from-[#131B2E] via-[#0B0F19] to-[#1A1429] border border-neutral-800 overflow-hidden select-none cursor-pointer flex flex-col items-center justify-center p-4"
        >
          {/* Floating dynamic suds */}
          {bubbles.map((b) => (
            <div
              key={b.id}
              style={{
                left: `${b.x}px`,
                top: `${b.y}px`,
                width: `${b.size}px`,
                height: `${b.size}px`,
              }}
              className="pointer-events-none absolute rounded-full border border-sky-300/40 bg-gradient-to-tr from-sky-400/20 to-fuchsia-300/30 backdrop-blur-xs transition-transform duration-150"
            />
          ))}

          {/* SVG Pearlescent Soap Bar */}
          <svg
            viewBox="0 0 220 110"
            className="w-40 h-24 drop-shadow-lg transition-transform duration-150 active:scale-95"
            aria-label="Artisanal pearlescent soap bar"
          >
            <defs>
              <linearGradient id="soapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="50%" stopColor="#BAE6FD" />
                <stop offset="100%" stopColor="#DDD6FE" />
              </linearGradient>
            </defs>
            <rect
              x="20"
              y="20"
              width="180"
              height="70"
              rx="28"
              fill="url(#soapGrad)"
              stroke="#7DD3FC"
              strokeWidth="2"
            />
            <rect
              x="38"
              y="32"
              width="144"
              height="46"
              rx="18"
              fill="none"
              stroke="#0284C7"
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
            <text
              x="110"
              y="60"
              textAnchor="middle"
              fill="#0369A1"
              fontSize="13"
              fontWeight="700"
              letterSpacing="2"
            >
              KARA SOAP CO.
            </text>
            <circle cx="45" cy="24" r="8" fill="#F0F9FF" fillOpacity="0.85" />
            <circle cx="62" cy="18" r="5" fill="#F0F9FF" fillOpacity="0.75" />
            <circle cx="172" cy="86" r="10" fill="#F0F9FF" fillOpacity="0.85" />
            <circle cx="188" cy="78" r="6" fill="#F0F9FF" fillOpacity="0.75" />
          </svg>

          <p className="mt-2 text-xs text-sky-200/90 text-center">
            {isClean
              ? 'Sparkling clean! Manners restored.'
              : `Click or drag across the soap bar to scrub away "${offendingWord}"`}
          </p>
        </div>

        {/* Parental Scolding Quote */}
        <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-200 leading-relaxed">
          <p className="font-medium text-white mb-1">KARA (Parent Mode):</p>
          <p className="text-neutral-300">“{scoldingMessage}”</p>
        </div>

        {/* Scrub Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Vocabulary Cleanliness</span>
            <span className="font-mono tabular-nums text-sky-400">{scrubProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 transition-all duration-150"
              style={{ width: `${scrubProgress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {!isClean ? (
            <button
              type="button"
              onClick={() => handleScrubStep()}
              className="px-4 py-2 text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Scrub With Soap (+8%)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setScrubProgress(0);
                setBubbles([]);
                onCompleteScrub();
              }}
              className="px-4 py-2 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Promise to Behave & Continue</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
