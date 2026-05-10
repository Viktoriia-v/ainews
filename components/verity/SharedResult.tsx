'use client';

import { useState } from 'react';
import { I18N, type UIStrings } from '@/lib/i18n/dictionary';
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/lib/i18n/languages';
import { ResultPanel } from './ResultPanel';
import { ShareModal } from './ShareModal';
import type { DisplayResult } from './adapter';
import { persistLang } from './langClient';

export function SharedResult({
  result,
  uiLang,
  checkLang,
}: {
  result: DisplayResult;
  uiLang: LanguageCode;
  checkLang: LanguageCode;
}) {
  const [lang, setLangRaw] = useState<LanguageCode>(uiLang);
  const [shareOpen, setShareOpen] = useState(false);

  const setLang = (l: LanguageCode) => {
    setLangRaw(l);
    persistLang(l);
  };

  const t: UIStrings = I18N[lang];
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/check/${result.id}`
      : `/check/${result.id}`;

  const checkLangName =
    SUPPORTED_LANGUAGES.find((l) => l.code === checkLang)?.nativeName ??
    checkLang.toUpperCase();
  const showAnalyzedBadge = lang !== checkLang;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#fafafa',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {showAnalyzedBadge && (
        <div
          style={{
            maxWidth: 880,
            margin: '20px auto 0',
            width: '100%',
            padding: '0 32px',
            fontFamily: 'var(--font-inter), Inter, sans-serif',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'oklch(0.95 0.01 80)',
              border: '1px solid oklch(0.88 0.04 80)',
              color: '#7a5b1a',
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {t.analyzedIn}: <b style={{ fontWeight: 600 }}>{checkLangName}</b>
          </div>
        </div>
      )}
      <ResultPanel
        t={t}
        result={result}
        lang={lang}
        onLang={setLang}
        onReset={undefined}
        onShare={() => setShareOpen(true)}
      />
      <div
        style={{
          maxWidth: 880,
          margin: '0 auto 40px',
          padding: '0 32px',
          width: '100%',
        }}
      >
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid oklch(0.92 0 0)',
            background: '#fff',
            borderRadius: 999,
            padding: '8px 14px',
            fontSize: 12,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            color: '#555',
            textDecoration: 'none',
          }}
        >
          ← {t.new}
        </a>
      </div>
      {shareOpen && (
        <ShareModal
          t={t}
          result={result}
          shareUrl={shareUrl}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
