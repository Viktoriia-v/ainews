'use client';

import type { UIStrings } from '@/lib/i18n/dictionary';
import { VERDICT_GLYPH, VERDICT_THEME, type VerdictKey } from './atoms';
import { mapVerdict } from './adapter';

export interface SuggestDbHit {
  id: string;
  query: string;
  verdict: string;
  confidence: number;
  createdAt: string;
}

export interface SuggestData {
  db: SuggestDbHit[];
  llm: string[];
}

interface Props {
  t: UIStrings;
  data: SuggestData;
  loading: boolean;
  onPickDb: (hit: SuggestDbHit) => void;
  onPickLlm: (text: string) => void;
}

function timeAgo(iso: string, t: UIStrings): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} ${t.minutesAgo}`;
  if (min < 60 * 24) return `${Math.round(min / 60)} ${t.hoursAgo}`;
  return `${Math.round(min / (60 * 24))} ${t.daysAgo}`;
}

export function SuggestDropdown({ t, data, loading, onPickDb, onPickLlm }: Props) {
  const empty = data.db.length === 0 && data.llm.length === 0;
  if (empty && !loading) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        background: '#fff',
        borderRadius: 16,
        border: '1px solid oklch(0.92 0 0)',
        boxShadow:
          '0 12px 32px -8px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
        padding: 6,
        zIndex: 40,
        textAlign: 'left',
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        maxHeight: 420,
        overflowY: 'auto',
      }}
    >
      {data.db.length > 0 && (
        <div style={{ padding: '4px 4px 6px' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: '#888',
              padding: '4px 10px 6px',
            }}
          >
            {t.recentlyChecked}
          </div>
          {data.db.map((hit) => {
            const v: VerdictKey = mapVerdict(hit.verdict);
            const theme = VERDICT_THEME[v];
            return (
              <button
                key={hit.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPickDb(hit);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'oklch(0.97 0 0)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: theme.bg,
                    color: theme.fg,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                  aria-hidden
                >
                  {VERDICT_GLYPH[v]}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13,
                      color: '#111',
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {hit.query}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginTop: 3,
                      fontSize: 11,
                      color: '#888',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: theme.fg, fontWeight: 600 }}>
                      {t.states[v]}
                    </span>
                    <span>·</span>
                    <span>{hit.confidence}%</span>
                    <span>·</span>
                    <span>{timeAgo(hit.createdAt, t)}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {data.db.length > 0 && data.llm.length > 0 && (
        <div
          style={{
            height: 1,
            background: 'oklch(0.95 0 0)',
            margin: '4px 8px',
          }}
        />
      )}

      {data.llm.length > 0 && (
        <div style={{ padding: '4px 4px 6px' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: '#888',
              padding: '4px 10px 6px',
            }}
          >
            {t.aiSuggestions}
          </div>
          {data.llm.map((text) => (
            <button
              key={text}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onPickLlm(text);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                border: 'none',
                background: 'transparent',
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'oklch(0.97 0 0)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="oklch(0.55 0.13 280)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
                aria-hidden
              >
                <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
              </svg>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13,
                  color: '#222',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {text}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading && empty && (
        <div
          style={{
            padding: '14px 16px',
            fontSize: 12,
            color: '#888',
            textAlign: 'center',
          }}
        >
          …
        </div>
      )}
    </div>
  );
}
