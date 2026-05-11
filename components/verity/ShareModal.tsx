'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { UIStrings } from '@/lib/i18n/dictionary';
import { Logomark, VERDICT_GLYPH, VERDICT_THEME } from './atoms';
import type { DisplayResult } from './adapter';
import { buildShareContent, SHARE_PLATFORMS, type SharePlatform } from './shareLinks';

const ICONS: Record<SharePlatform['id'] | 'copy' | 'native', ReactNode> = {
  copy: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M11.944 0C5.348 0 0 5.348 0 11.944c0 6.597 5.348 11.945 11.944 11.945 6.597 0 11.945-5.348 11.945-11.945C23.889 5.348 18.541 0 11.944 0zm5.51 8.165l-1.84 8.665c-.137.617-.5.768-1.013.479l-2.798-2.063-1.35 1.298c-.149.149-.275.275-.563.275l.2-2.85 5.187-4.687c.225-.2-.05-.313-.348-.113l-6.412 4.037-2.762-.862c-.6-.188-.612-.6.125-.888l10.787-4.162c.5-.187.937.113.787.875z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
    </svg>
  ),
  threads: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.74-1.757-.504-.582-1.279-.88-2.31-.88h-.029c-.825 0-1.946.227-2.661 1.284L7.32 8.073c.95-1.405 2.495-2.18 4.345-2.18h.044c3.094.02 4.943 1.92 5.122 5.205q.18.075.34.158c1.508.71 2.611 1.785 3.19 3.111.808 1.84.886 4.84-1.514 7.187-1.835 1.794-4.063 2.628-7.272 2.65zm.92-8.665c-.252 0-.508.008-.76.022-1.842.103-2.99.95-2.918 2.143.072 1.225 1.346 1.737 2.61 1.668 1.176-.063 2.658-.522 2.886-3.476a10.6 10.6 0 0 0-1.818-.357z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  sms: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  native: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
};

const tileStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '12px 6px',
  border: '1px solid oklch(0.92 0 0)',
  borderRadius: 12,
  background: '#fff',
  color: '#222',
  cursor: 'pointer',
  fontFamily: 'var(--font-inter), Inter, sans-serif',
  fontSize: 11,
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'border-color 0.15s, background 0.15s',
};

function applyHover(el: HTMLElement) {
  el.style.borderColor = 'oklch(0.85 0 0)';
  el.style.background = 'oklch(0.98 0 0)';
}
function clearHover(el: HTMLElement) {
  el.style.borderColor = 'oklch(0.92 0 0)';
  el.style.background = '#fff';
}

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
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const content = buildShareContent(result, shareUrl, t);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: t.productName,
        text: content.text,
        url: shareUrl,
      });
    } catch {
      /* user cancelled or unsupported */
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
          maxHeight: 'calc(100vh - 24px)',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 16 }}>
          {t.share}
        </div>

        <div
          style={{
            padding: 'clamp(18px, 4vw, 24px)',
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
              {t.productName}
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>“{result.query}”</div>
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
            marginBottom: 16,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {shareUrl}
        </div>

        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#111',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            {ICONS.native}
            {t.shareVia}
          </button>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={handleCopy}
            style={{
              ...tileStyle,
              background: copied ? 'oklch(0.96 0.04 155)' : '#fff',
              color: copied ? 'oklch(0.42 0.13 155)' : '#222',
              borderColor: copied ? 'oklch(0.78 0.10 155)' : 'oklch(0.92 0 0)',
            }}
            onMouseEnter={(e) => {
              if (!copied) applyHover(e.currentTarget);
            }}
            onMouseLeave={(e) => {
              if (!copied) clearHover(e.currentTarget);
            }}
          >
            {ICONS.copy}
            <span>{copied ? t.copied : t.copyLink}</span>
          </button>

          {SHARE_PLATFORMS.map((p) => (
            <a
              key={p.id}
              href={p.buildHref(content, t)}
              target="_blank"
              rel="noopener noreferrer"
              style={tileStyle}
              onMouseEnter={(e) => applyHover(e.currentTarget)}
              onMouseLeave={(e) => clearHover(e.currentTarget)}
            >
              {ICONS[p.id]}
              <span>{p.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
