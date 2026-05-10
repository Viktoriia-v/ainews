import type { CSSProperties, ReactNode } from 'react';

export type VerdictKey = 'true' | 'fake' | 'partly' | 'unclear';

export const VERDICT_THEME: Record<
  VerdictKey,
  { fg: string; bg: string; dot: string; ring: string }
> = {
  true: {
    fg: 'oklch(0.42 0.13 155)',
    bg: 'oklch(0.96 0.04 155)',
    dot: 'oklch(0.55 0.15 155)',
    ring: 'oklch(0.78 0.10 155)',
  },
  fake: {
    fg: 'oklch(0.46 0.16 25)',
    bg: 'oklch(0.96 0.04 25)',
    dot: 'oklch(0.58 0.18 25)',
    ring: 'oklch(0.78 0.12 25)',
  },
  partly: {
    fg: 'oklch(0.50 0.13 75)',
    bg: 'oklch(0.96 0.05 80)',
    dot: 'oklch(0.65 0.15 75)',
    ring: 'oklch(0.80 0.10 75)',
  },
  unclear: {
    fg: 'oklch(0.42 0.02 250)',
    bg: 'oklch(0.95 0.005 250)',
    dot: 'oklch(0.55 0.02 250)',
    ring: 'oklch(0.78 0.01 250)',
  },
};

export const VERDICT_GLYPH: Record<VerdictKey, ReactNode> = {
  true: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  ),
  fake: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  partly: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 7v6" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  ),
  unclear: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 9.5a3 3 0 1 1 4.2 2.7c-1 .5-1.7 1-1.7 2.3" />
      <circle cx="11.5" cy="18" r="0.7" fill="currentColor" />
    </svg>
  ),
};

export function SearchIcon({
  size = 18,
  color = 'currentColor',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

export function Logomark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" stroke="#111" strokeWidth="1.4" />
      <path
        d="M9 16.5l4.5 4.5L23 11"
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ConfidenceRing({
  value,
  theme,
  size = 110,
  label,
}: {
  value: number;
  theme: { dot: string };
  size?: number;
  label: string;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="oklch(0.93 0 0)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={theme.dot}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.22,.8,.36,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-inter), Inter, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: size * 0.26,
            fontWeight: 600,
            letterSpacing: -1,
            color: '#111',
          }}
        >
          {value}
          <span style={{ fontSize: size * 0.14, opacity: 0.5 }}>%</span>
        </div>
        <div
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: '#888',
            marginTop: 2,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: '#888',
        marginBottom: 12,
        fontFamily: 'var(--font-inter), Inter, sans-serif',
      }}
    >
      {children}
    </div>
  );
}

const FAVICON_PALETTE: Array<{ bg: string; fg: string }> = [
  { bg: '#0F4C81', fg: '#fff' },
  { bg: '#C8102E', fg: '#fff' },
  { bg: '#0B5FFF', fg: '#fff' },
  { bg: '#E8B931', fg: '#111' },
  { bg: '#1B5E20', fg: '#fff' },
  { bg: '#5B2A86', fg: '#fff' },
  { bg: '#FFF1E5', fg: '#111' },
  { bg: '#222222', fg: '#fff' },
  { bg: '#D72638', fg: '#fff' },
  { bg: '#3A6EA5', fg: '#fff' },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickFavicon(domain: string, name: string) {
  const palette = FAVICON_PALETTE[hashStr(domain) % FAVICON_PALETTE.length];
  const letter = (name || domain).trim().charAt(0).toUpperCase() || '?';
  return { color: palette.bg, textColor: palette.fg, favicon: letter };
}

export function Favicon({
  swatch,
  size = 28,
}: {
  swatch: { color: string; textColor: string; favicon: string };
  size?: number;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: 6,
    background: swatch.color,
    color: swatch.textColor,
    fontWeight: 700,
    fontSize: size * 0.42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    letterSpacing: -0.5,
    fontFamily: 'var(--font-inter), Inter, sans-serif',
    border:
      swatch.color.toUpperCase() === '#FFF1E5' ? '1px solid #e5e0d8' : 'none',
  };
  return <div style={style}>{swatch.favicon}</div>;
}
