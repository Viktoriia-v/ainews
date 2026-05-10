'use client';

import { useEffect, useState } from 'react';
import {
  detectBrowserLang,
  I18N,
  type UIStrings,
} from '@/lib/i18n/dictionary';
import {
  isLanguageCode,
  type LanguageCode,
} from '@/lib/i18n/languages';
import { ResultPanel } from './ResultPanel';
import { ShareModal } from './ShareModal';
import type { DisplayResult } from './adapter';

const LANG_STORAGE_KEY = 'verity:lang';

export function SharedResult({
  result,
  initialLang,
}: {
  result: DisplayResult;
  initialLang: LanguageCode;
}) {
  const [lang, setLangRaw] = useState<LanguageCode>(initialLang);
  const [autoDetected, setAutoDetected] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && isLanguageCode(saved)) {
        setLangRaw(saved);
        return;
      }
    } catch {
      /* noop */
    }
    const detected = detectBrowserLang();
    if (detected !== initialLang) {
      setLangRaw(detected);
      setAutoDetected(true);
    }
  }, [initialLang]);

  const setLang = (l: LanguageCode) => {
    setAutoDetected(false);
    setLangRaw(l);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {
      /* noop */
    }
  };

  const t: UIStrings = I18N[lang];
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/check/${result.id}`
      : `/check/${result.id}`;

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
      <ResultPanel
        t={t}
        result={result}
        lang={lang}
        onLang={setLang}
        onReset={undefined}
        onShare={() => setShareOpen(true)}
        autoDetected={autoDetected}
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
