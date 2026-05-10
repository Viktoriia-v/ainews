'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { I18N, type UIStrings } from '@/lib/i18n/dictionary';
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/lib/i18n/languages';
import { ResultPanel } from './ResultPanel';
import { ShareModal } from './ShareModal';
import { adaptResult, type ApiPayload, type DisplayResult } from './adapter';
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
  const router = useRouter();
  const [lang, setLangRaw] = useState<LanguageCode>(uiLang);
  const [shareOpen, setShareOpen] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);

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
  const langMismatch = lang !== checkLang;

  const handleReanalyze = async () => {
    if (reanalyzing) return;
    setReanalyzing(true);
    setReanalyzeError(null);
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: result.query, language: lang }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 429) setReanalyzeError(t.errorRate);
        else if (body.error === 'too_short') setReanalyzeError(t.errorTooShort);
        else setReanalyzeError(t.errorGeneric);
        setReanalyzing(false);
        return;
      }
      const payload = (await res.json()) as ApiPayload;
      const adapted = adaptResult(payload, result.query);
      router.push(`/check/${adapted.id}`);
    } catch (err) {
      console.error(err);
      setReanalyzeError(t.errorNetwork);
      setReanalyzing(false);
    }
  };

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
      {langMismatch && (
        <div
          style={{
            maxWidth: 880,
            margin: '20px auto 0',
            width: '100%',
            padding: '0 32px',
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center',
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
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={reanalyzing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid #111',
              background: reanalyzing ? 'oklch(0.92 0 0)' : '#111',
              color: reanalyzing ? '#888' : '#fff',
              fontSize: 11,
              fontWeight: 500,
              cursor: reanalyzing ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {reanalyzing ? (
              <>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: '1.5px solid currentColor',
                    borderTopColor: 'transparent',
                    animation: 'verity-spin 0.9s linear infinite',
                  }}
                />
                {t.reanalyzing}
              </>
            ) : (
              <>
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
                  <path d="M3 12a9 9 0 0 1 15.5-6.4L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15.5 6.4L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                {t.reanalyzeIn}: {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.nativeName ?? lang}
              </>
            )}
          </button>
          {reanalyzeError && (
            <span style={{ fontSize: 12, color: 'oklch(0.46 0.16 25)' }}>
              {reanalyzeError}
            </span>
          )}
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
