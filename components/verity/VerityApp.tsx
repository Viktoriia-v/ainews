'use client';

import { useState } from 'react';
import { I18N, type UIStrings } from '@/lib/i18n/dictionary';
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/lib/i18n/languages';
import { Hero } from './Hero';
import { LoadingPanel } from './LoadingPanel';
import { ResultPanel } from './ResultPanel';
import { ShareModal } from './ShareModal';
import { adaptResult, type ApiPayload, type DisplayResult } from './adapter';
import { persistLang } from './langClient';
import { translateText } from './translateClient';

type AppState = 'empty' | 'loading' | 'result';

interface Props {
  initialLang: LanguageCode;
  initialAutoDetected: boolean;
}

export function VerityApp({ initialLang, initialAutoDetected }: Props) {
  const [lang, setLangRaw] = useState<LanguageCode>(initialLang);
  const [autoDetected, setAutoDetected] = useState(initialAutoDetected);
  const [state, setState] = useState<AppState>('empty');
  const [activeQuery, setActiveQuery] = useState('');
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [resultLang, setResultLang] = useState<LanguageCode | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);

  const setLang = (l: LanguageCode) => {
    setLangRaw(l);
    setAutoDetected(false);
    persistLang(l);
  };

  const t: UIStrings = I18N[lang];

  const runCheck = async (
    query: string,
    requestLang: LanguageCode,
    opts: { translate?: boolean } = {},
  ) => {
    setError(null);
    setReanalyzeError(null);
    setActiveQuery(query);
    setState('loading');

    try {
      let finalQuery = query;
      if (opts.translate) {
        const { translated } = await translateText(query, requestLang);
        finalQuery = translated;
        setActiveQuery(translated);
      }

      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery, language: requestLang }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        const msg =
          res.status === 429
            ? t.errorRate
            : body.error === 'too_short'
              ? t.errorTooShort
              : t.errorGeneric;
        if (state === 'result') {
          setReanalyzeError(msg);
          setState('result');
        } else {
          setError(msg);
          setState('empty');
        }
        return;
      }

      const payload = (await res.json()) as ApiPayload;
      const adapted = adaptResult(payload, finalQuery);
      setResult(adapted);
      setResultLang(requestLang);
      setState('result');
    } catch (err) {
      console.error(err);
      const msg = t.errorNetwork;
      if (state === 'result') {
        setReanalyzeError(msg);
        setState('result');
      } else {
        setError(msg);
        setState('empty');
      }
    }
  };

  const handleSubmit = (query: string) => {
    if (state === 'loading') return;
    runCheck(query, lang, { translate: true });
  };

  const handleReanalyze = () => {
    if (state === 'loading' || !result) return;
    runCheck(result.query, lang, { translate: true });
  };

  const handleReset = () => {
    setResult(null);
    setResultLang(null);
    setError(null);
    setReanalyzeError(null);
    setState('empty');
    setActiveQuery('');
  };

  const shareUrl =
    result && typeof window !== 'undefined'
      ? `${window.location.origin}/check/${result.id}`
      : '';

  const langMismatch = state === 'result' && resultLang !== null && resultLang !== lang;
  const resultLangName = resultLang
    ? SUPPORTED_LANGUAGES.find((l) => l.code === resultLang)?.nativeName ?? resultLang.toUpperCase()
    : '';
  const currentLangName =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.nativeName ?? lang;

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
      {state === 'empty' && (
        <Hero
          t={t}
          lang={lang}
          onLang={setLang}
          onSubmit={handleSubmit}
          autoDetected={autoDetected}
          error={error}
        />
      )}
      {state === 'loading' && <LoadingPanel t={t} query={activeQuery} />}
      {state === 'result' && result && (
        <>
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
                {t.analyzedIn}: <b style={{ fontWeight: 600 }}>{resultLangName}</b>
              </div>
              <button
                type="button"
                onClick={handleReanalyze}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid #111',
                  background: '#111',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
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
                  <path d="M3 12a9 9 0 0 1 15.5-6.4L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15.5 6.4L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                {t.reanalyzeIn}: {currentLangName}
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
            onReset={handleReset}
            onShare={() => setShareOpen(true)}
            autoDetected={autoDetected}
          />
        </>
      )}
      {shareOpen && result && (
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
