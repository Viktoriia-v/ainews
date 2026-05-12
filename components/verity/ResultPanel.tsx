'use client';

import { Fragment, useMemo, type ReactNode } from 'react';
import type { LanguageCode } from '@/lib/i18n/languages';
import type { UIStrings } from '@/lib/i18n/dictionary';
import {
  ConfidenceRing,
  SearchIcon,
  SectionLabel,
  VERDICT_GLYPH,
  VERDICT_THEME,
} from './atoms';
import { LangSwitcher } from './LangSwitcher';
import { SourceCard } from './SourceCard';
import type { DisplayResult } from './adapter';

const SRC_REGEX = /\(?\[?((?:src_[a-z0-9]+)(?:\s*[,;]\s*src_[a-z0-9]+)*)\]?\)?/g;

function scrollToSource(id: string): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(`source-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const original = el.style.boxShadow;
  el.style.boxShadow = '0 0 0 3px oklch(0.78 0.10 250)';
  setTimeout(() => {
    el.style.boxShadow = original;
  }, 1400);
}

function renderCited(text: string, idToNumber: Map<string, number>): ReactNode {
  if (!text) return text;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  SRC_REGEX.lastIndex = 0;
  while ((match = SRC_REGEX.exec(text)) !== null) {
    const ids = match[1].split(/[\s,;]+/).filter(Boolean);
    const refs = ids
      .map((id) => ({ id, num: idToNumber.get(id) }))
      .filter((r): r is { id: string; num: number } => typeof r.num === 'number');
    if (refs.length === 0) continue;
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).replace(/[\s ]+$/, ' ');
      parts.push(<Fragment key={`t-${key++}`}>{before}</Fragment>);
    }
    parts.push(
      <span
        key={`c-${key++}`}
        style={{ whiteSpace: 'nowrap', display: 'inline-flex', gap: 2 }}
      >
        {refs.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => scrollToSource(r.id)}
            style={{
              border: 'none',
              background: 'oklch(0.96 0.02 250)',
              color: 'oklch(0.45 0.13 250)',
              borderRadius: 4,
              padding: '0 5px',
              fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
              fontSize: '0.85em',
              fontWeight: 600,
              cursor: 'pointer',
              lineHeight: 1.4,
              verticalAlign: 'baseline',
            }}
          >
            {r.num}
          </button>
        ))}
      </span>,
    );
    lastIndex = SRC_REGEX.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<Fragment key={`t-${key++}`}>{text.slice(lastIndex)}</Fragment>);
  }
  return parts.length > 0 ? parts : text;
}

interface Props {
  t: UIStrings;
  result: DisplayResult;
  lang: LanguageCode;
  onLang: (l: LanguageCode) => void;
  onReset?: () => void;
  onShare: () => void;
  compact?: boolean;
  autoDetected?: boolean;
}

export function ResultPanel({
  t,
  result,
  lang,
  onLang,
  onReset,
  onShare,
  compact = false,
  autoDetected = false,
}: Props) {
  const theme = VERDICT_THEME[result.verdict];
  const used = result.sources.filter((s) => s.stance !== 'neutral');
  const others = result.sources.filter((s) => s.stance === 'neutral');
  const idToNumber = useMemo(() => {
    const m = new Map<string, number>();
    [...used, ...others].forEach((s, i) => m.set(s.id, i + 1));
    return m;
  }, [used, others]);
  const numberFor = (id: string) => idToNumber.get(id);

  return (
    <div
      style={{
        maxWidth: 880,
        margin: '0 auto',
        padding: compact
          ? 'clamp(16px, 4vw, 20px) clamp(12px, 4vw, 16px) 40px'
          : 'clamp(20px, 4vw, 28px) clamp(16px, 4vw, 32px) 60px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid oklch(0.92 0 0)',
              background: '#fff',
              borderRadius: 999,
              padding: '6px 12px',
              fontSize: 12,
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              color: '#555',
              cursor: 'pointer',
            }}
          >
            <SearchIcon size={13} />
            {t.new}
          </button>
        )}
        <div
          style={{
            flex: 1,
            fontSize: 13,
            color: '#666',
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          “{result.query}”
        </div>
        <LangSwitcher lang={lang} onLang={onLang} autoDetected={autoDetected} />
        <button
          type="button"
          onClick={onShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid oklch(0.92 0 0)',
            background: '#fff',
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            color: '#555',
            cursor: 'pointer',
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {t.share}
        </button>
      </div>

      <div
        style={{
          background: theme.bg,
          border: `1px solid ${theme.ring}`,
          borderRadius: 16,
          padding: compact ? 20 : 28,
          display: 'flex',
          gap: compact ? 18 : 28,
          alignItems: 'center',
          flexWrap: compact ? 'wrap' : 'nowrap',
        }}
      >
        <ConfidenceRing
          value={result.confidence}
          theme={theme}
          label={t.confidence}
          size={compact ? 92 : 118}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: '#fff',
              borderRadius: 999,
              color: theme.fg,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              marginBottom: 12,
            }}
          >
            {VERDICT_GLYPH[result.verdict]}
            <span>{t.states[result.verdict]}</span>
          </div>
          <div
            style={{
              fontSize: compact ? 22 : 30,
              fontFamily: 'var(--font-instrument-serif), "Instrument Serif", serif',
              color: '#111',
              lineHeight: 1.25,
              letterSpacing: -0.4,
            }}
          >
            {renderCited(result.summary, idToNumber)}
          </div>
        </div>
      </div>

      {result.verdict === 'unclear' && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 10,
            background: 'oklch(0.97 0.01 80)',
            border: '1px solid oklch(0.92 0.04 80)',
            fontSize: 13,
            color: '#7a5b1a',
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <div>{t.notEnough}</div>
        </div>
      )}

      <div
        style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '1.4fr 1fr',
          gap: 28,
        }}
      >
        <div>
          <SectionLabel>{t.summary}</SectionLabel>
          <div
            style={{
              fontSize: 15,
              color: '#222',
              lineHeight: 1.65,
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              marginBottom: 24,
            }}
          >
            {renderCited(result.summary, idToNumber)}
          </div>

          <SectionLabel>{t.why}</SectionLabel>
          <div
            style={{
              fontSize: 14,
              color: '#444',
              lineHeight: 1.65,
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              whiteSpace: 'pre-wrap',
            }}
          >
            {renderCited(result.explanation, idToNumber)}
          </div>
        </div>

        {result.contradictions.length > 0 && (
          <div>
            <SectionLabel>{t.contradiction}</SectionLabel>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {result.contradictions.map((c, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: '#444',
                    lineHeight: 1.5,
                    paddingLeft: 12,
                    borderLeft: '2px solid oklch(0.85 0.04 25)',
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                  }}
                >
                  {renderCited(c, idToNumber)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {used.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <SectionLabel>
            {t.sourcesUsed}{' '}
            <span style={{ color: '#bbb', fontWeight: 400 }}>· {used.length}</span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {used.map((s) => (
              <SourceCard key={s.id} source={s} t={t} number={numberFor(s.id)} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <SectionLabel>
            {t.otherSources}{' '}
            <span style={{ color: '#bbb', fontWeight: 400 }}>· {others.length}</span>
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {others.map((s) => (
              <SourceCard
                key={s.id}
                source={s}
                t={t}
                compact
                number={numberFor(s.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 36,
          padding: 16,
          borderRadius: 10,
          background: 'oklch(0.98 0 0)',
          fontSize: 12,
          color: '#777',
          lineHeight: 1.6,
          fontFamily: 'var(--font-inter), Inter, sans-serif',
        }}
      >
        <div style={{ fontWeight: 600, color: '#444', marginBottom: 4 }}>
          {t.methodology}
        </div>
        {t.methodologyText}
      </div>
    </div>
  );
}
