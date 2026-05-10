import type { UIStrings } from '@/lib/i18n/dictionary';
import { Favicon, pickFavicon } from './atoms';
import type { DisplaySource } from './adapter';

const STANCE_COLORS = {
  confirms: 'oklch(0.55 0.15 155)',
  refutes: 'oklch(0.58 0.18 25)',
  neutral: 'oklch(0.55 0.02 250)',
} as const;

function timeAgo(min: number, t: UIStrings): string {
  if (min < 60) return `${min} ${t.minutesAgo}`;
  if (min < 60 * 24) return `${Math.round(min / 60)} ${t.hoursAgo}`;
  return `${Math.round(min / (60 * 24))} ${t.daysAgo}`;
}

export function SourceCard({
  source,
  t,
  compact = false,
}: {
  source: DisplaySource;
  t: UIStrings;
  compact?: boolean;
}) {
  const stanceColor = STANCE_COLORS[source.stance];
  const stanceLabel = t[source.stance];
  const swatch = pickFavicon(source.domain, source.name);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        gap: 12,
        padding: compact ? 10 : 14,
        border: '1px solid oklch(0.92 0 0)',
        borderRadius: 10,
        background: '#fff',
        alignItems: 'flex-start',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'oklch(0.85 0 0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'oklch(0.92 0 0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Favicon swatch={swatch} size={compact ? 24 : 30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{source.name}</span>
          <span style={{ fontSize: 11, color: '#999' }}>{source.domain}</span>
          {source.minutesAgo > 0 && (
            <span style={{ fontSize: 11, color: '#999' }}>· {timeAgo(source.minutesAgo, t)}</span>
          )}
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: stanceColor,
              padding: '2px 7px',
              borderRadius: 4,
              background: `color-mix(in oklch, ${stanceColor} 10%, transparent)`,
              marginLeft: 'auto',
            }}
          >
            {stanceLabel}
          </span>
        </div>
        {!compact && source.quote && (
          <div
            style={{
              fontSize: 13,
              color: '#444',
              lineHeight: 1.5,
              fontStyle: 'italic',
              borderLeft: '2px solid oklch(0.9 0 0)',
              paddingLeft: 10,
              marginTop: 6,
            }}
          >
            “{source.quote}”
          </div>
        )}
      </div>
    </a>
  );
}
