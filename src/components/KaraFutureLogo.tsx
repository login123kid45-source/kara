import React, { useId } from 'react';
import { KaraMode } from '../lib/firebase';

export interface KaraFutureLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  mode?: KaraMode;
  isActive?: boolean;
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<KaraFutureLogoProps['size']>, number> = {
  xs: 20,
  sm: 26,
  md: 34,
  lg: 44,
  xl: 60,
};

const MODE_PALETTE: Record<
  KaraMode,
  {
    primary: string;
    secondary: string;
    tertiary: string;
    glowClass: string;
    wordmarkGradient: string;
  }
> = {
  regular: {
    primary: '#38bdf8', // sky-400
    secondary: '#818cf8', // indigo-400
    tertiary: '#e879f9', // fuchsia-400
    glowClass: 'drop-shadow-[0_0_10px_rgba(56,189,248,0.45)]',
    wordmarkGradient: 'from-white via-sky-200 to-indigo-300',
  },
  bratty: {
    primary: '#f472b6', // pink-400
    secondary: '#fbbf24', // amber-400
    tertiary: '#c084fc', // purple-400
    glowClass: 'drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]',
    wordmarkGradient: 'from-white via-pink-200 to-amber-300',
  },
  uncensored: {
    primary: '#c084fc', // purple-400
    secondary: '#f43f5e', // rose-500
    tertiary: '#38bdf8', // sky-400
    glowClass: 'drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]',
    wordmarkGradient: 'from-white via-purple-200 to-rose-300',
  },
  romantic: {
    primary: '#fb7185', // rose-400
    secondary: '#e879f9', // fuchsia-400
    tertiary: '#fbbf24', // amber-400
    glowClass: 'drop-shadow-[0_0_10px_rgba(251,113,133,0.5)]',
    wordmarkGradient: 'from-white via-rose-200 to-fuchsia-300',
  },
  parent: {
    primary: '#34d399', // emerald-400
    secondary: '#38bdf8', // sky-400
    tertiary: '#fbbf24', // amber-400
    glowClass: 'drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]',
    wordmarkGradient: 'from-white via-emerald-200 to-sky-300',
  },
};

export const KaraFutureLogo: React.FC<KaraFutureLogoProps> = ({
  size = 'md',
  mode = 'regular',
  isActive = false,
  showWordmark = false,
  subtitle,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const px = SIZE_MAP[size] || SIZE_MAP.md;
  const palette = MODE_PALETTE[mode] || MODE_PALETTE.regular;

  const coreGradId = `kara-core-grad-${uid}`;
  const ringGradId = `kara-ring-grad-${uid}`;
  const prismGradId = `kara-prism-grad-${uid}`;
  const bgRadId = `kara-bg-rad-${uid}`;

  return (
    <span className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      <span
        className={`relative inline-flex items-center justify-center shrink-0 transition-transform duration-300 ${
          isActive ? 'scale-105' : 'hover:scale-105'
        }`}
        style={{ width: px, height: px }}
      >
        <svg
          width={px}
          height={px}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full ${palette.glowClass}`}
          aria-label="KARA Futuristic Neural Emblem"
        >
          <defs>
            <radialGradient id={bgRadId} cx="50%" cy="50%" r="52%">
              <stop offset="0%" stopColor={palette.primary} stopOpacity="0.28" />
              <stop offset="65%" stopColor="#090d16" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#05070c" stopOpacity="0.98" />
            </radialGradient>

            <linearGradient id={coreGradId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={palette.primary} />
              <stop offset="52%" stopColor={palette.secondary} />
              <stop offset="100%" stopColor={palette.tertiary} />
            </linearGradient>

            <linearGradient id={ringGradId} x1="4" y1="32" x2="60" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={palette.primary} stopOpacity="0.9" />
              <stop offset="50%" stopColor={palette.tertiary} stopOpacity="0.35" />
              <stop offset="100%" stopColor={palette.secondary} stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id={prismGradId} x1="18" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor={palette.primary} />
              <stop offset="100%" stopColor={palette.tertiary} />
            </linearGradient>
          </defs>

          {/* Outer Futuristic Octagonal / Hex-Shield Chassis */}
          <polygon
            points="32,3 53,12 61,32 53,52 32,61 11,52 3,32 11,12"
            fill={`url(#${bgRadId})`}
            stroke={`url(#${coreGradId})`}
            strokeWidth="2"
          />

          {/* Subtle Inner Quantum Horizon Ring */}
          <circle
            cx="32"
            cy="32"
            r="23"
            stroke={`url(#${ringGradId})`}
            strokeWidth="1.25"
            strokeDasharray="6 3"
            className={isActive ? ' origin-center animate-spin' : ''}
            style={isActive ? { animationDuration: '9s' } : undefined}
          />

          {/* Tilted Orbital Neural Gyro Ellipse */}
          <ellipse
            cx="32"
            cy="32"
            rx="25"
            ry="10.5"
            transform="rotate(-28 32 32)"
            stroke={`url(#${coreGradId})`}
            strokeWidth="1.2"
            strokeOpacity="0.65"
          />

          {/* Precision Geometric Futuristic 'K' Prism Monogram */}
          {/* Left Vertical Neural Pillar */}
          <path
            d="M21 17.5C21 16.6716 21.6716 16 22.5 16H25.5C26.3284 16 27 16.6716 27 17.5V46.5C27 47.3284 26.3284 48 25.5 48H22.5C21.6716 48 21 47.3284 21 46.5V17.5Z"
            fill={`url(#${prismGradId})`}
          />

          {/* Upper Wing Blade of 'K' */}
          <path
            d="M29.5 31L40.8 16.8C41.35 16.12 42.18 15.75 43.05 15.75H45.2C46.45 15.75 47.15 17.18 46.37 18.15L35.4 31.6L29.5 31Z"
            fill={`url(#${prismGradId})`}
          />

          {/* Lower Cyber Wing Blade of 'K' */}
          <path
            d="M33.2 29.8L46.55 45.85C47.33 46.8 46.65 48.25 45.4 48.25H42.9C42.02 48.25 41.18 47.86 40.62 47.18L28.8 32.8L33.2 29.8Z"
            fill={`url(#${coreGradId})`}
          />

          {/* Central Singularity Spark / Neural Core Node */}
          <polygon
            points="31.5,27.2 35.8,32 31.5,36.8 27.2,32"
            fill="#ffffff"
          />

          {/* Orbital Satellite Nodes */}
          <circle cx="32" cy="6.5" r="2" fill={palette.primary} />
          <circle cx="57.5" cy="32" r="1.8" fill={palette.tertiary} />
          <circle cx="32" cy="57.5" r="1.8" fill={palette.secondary} />
          <circle cx="6.5" cy="32" r="2" fill={palette.primary} />
        </svg>
      </span>

      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={`font-display font-bold tracking-[0.14em] bg-gradient-to-r ${palette.wordmarkGradient} bg-clip-text text-transparent ${
              size === 'lg' || size === 'xl'
                ? 'text-xl'
                : size === 'sm' || size === 'xs'
                ? 'text-sm'
                : 'text-base'
            }`}
          >
            KARA
          </span>
          {subtitle && (
            <span className="text-[10px] font-mono tracking-wider text-sky-400/85 mt-0.5">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
};
