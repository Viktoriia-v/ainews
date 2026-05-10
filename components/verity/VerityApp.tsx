'use client';

import { useState } from 'react';
import { I18N, type UIStrings } from '@/lib/i18n/dictionary';
import type { LanguageCode } from '@/lib/i18n/languages';
import { Hero } from './Hero';
import { LoadingPanel } from './LoadingPanel';
import { ResultPanel } from './ResultPanel';
import { ShareModal } from './ShareModal';
import { adaptResult, type ApiPayload, type DisplayResult } from './adapter';
import { persistLang } from './langClient';

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
  const [shareOpen, setShareOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLang = (l: LanguageCode) => {
    setLangRaw(l);
    setAutoDetected(false);
    persistLang(l);
  };

  const t: UIStrings = I18N[lang];

  const handleSubmit = async (query: string) => {
    if (state === 'loading') return;
    setError(null);
    setActiveQuery(query);
    setState('loading');

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language: lang }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 429) setError(t.errorRate);
        else if (body.error === 'too_short') setError(t.errorTooShort);
        else setError(t.errorGeneric);
        setState('empty');
        return;
      }

      const payload = (await res.json()) as ApiPayload;
      const adapted = adaptResult(payload, query);
      setResult(adapted);
      setState('result');
    } catch (err) {
      console.error(err);
      setError(t.errorNetwork);
      setState('empty');
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setState('empty');
    setActiveQuery('');
  };

  const shareUrl =
    result && typeof window !== 'undefined'
      ? `${window.location.origin}/check/${result.id}`
      : '';

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
        <ResultPanel
          t={t}
          result={result}
          lang={lang}
          onLang={setLang}
          onReset={handleReset}
          onShare={() => setShareOpen(true)}
          autoDetected={autoDetected}
        />
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
