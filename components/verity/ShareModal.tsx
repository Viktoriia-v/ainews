'use client';

import { useEffect, useState } from 'react';
import type { UIStrings } from '@/lib/i18n/dictionary';
import { Logomark, VERDICT_GLYPH, VERDICT_THEME } from './atoms';
import type { DisplayResult } from './adapter';

export function ShareModal({
  t,
  result,
  shareUrl,
  onClose,
}: {
  t: UIStrings;
  result: DisplayResult;
  shareUrl: string;
  onClose: () => void;
}) {
  const theme = VERDICT_THEME[result.verdict];
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,20,20,0.4)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 'clamp(12px, 4vw, 24px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 460,
          padding: 'clamp(20px, 5vw, 28px)',
          fontFamily: 'var(--font-inter), Inter, sans-serif',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 16 }}>
          {t.share}
        </div>
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: theme.bg,
            border: `1px solid ${theme.ring}`,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Logomark size={18} />
            <div
              style={{
                fontFamily: 'var(--font-instrument-serif), "Instrument Serif", serif',
                fontSize: 18,
                color: '#111',
              }}
            >
              Verity
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>
            “{result.query}”
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: '#fff',
              borderRadius: 999,
              color: theme.fg,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {VERDICT_GLYPH[result.verdict]}
            {t.states[result.verdict]} · {result.confidence}%
          </div>
        </div>

        <div
          style={{
            padding: '10px 14px',
            background: 'oklch(0.97 0 0)',
            borderRadius: 8,
            fontSize: 12,
            color: '#555',
            fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
            marginBottom: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {shareUrl}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: copied ? 'oklch(0.42 0.13 155)' : '#111',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {copied ? t.copied : t.copyLink}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid oklch(0.9 0 0)',
              background: '#fff',
              color: '#111',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            {t.open}
          </a>
        </div>
      </div>
    </div>
  );
}
