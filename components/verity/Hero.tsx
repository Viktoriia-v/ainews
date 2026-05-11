'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LanguageCode } from '@/lib/i18n/languages';
import type { UIStrings } from '@/lib/i18n/dictionary';
import { Logomark, SearchIcon } from './atoms';
import { LangSwitcher } from './LangSwitcher';
import {
  SuggestDropdown,
  type SuggestData,
  type SuggestDbHit,
} from './SuggestDropdown';

interface Props {
  t: UIStrings;
  lang: LanguageCode;
  onLang: (l: LanguageCode) => void;
  onSubmit: (q: string) => void;
  autoDetected: boolean;
  prefill?: string;
  error?: string | null;
}

const SUGGEST_MIN_CHARS = 3;
const SUGGEST_DEBOUNCE_MS = 300;

export function Hero({ t, lang, onLang, onSubmit, autoDetected, prefill = '', error }: Props) {
  const router = useRouter();
  const [val, setVal] = useState(prefill);
  const [focused, setFocused] = useState(false);
  const [suggest, setSuggest] = useState<SuggestData>({ db: [], llm: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const trimmed = val.trim();
    if (trimmed.length < SUGGEST_MIN_CHARS) {
      setSuggest({ db: [], llm: [] });
      setLoading(false);
      return;
    }
    const myId = ++reqIdRef.current;
    setLoading(true);
    const timer = setTimeout(() => {
      const ctrl = new AbortController();
      fetch(
        `/api/suggest?q=${encodeURIComponent(trimmed)}&lang=${encodeURIComponent(lang)}`,
        { signal: ctrl.signal },
      )
        .then((res) => (res.ok ? (res.json() as Promise<SuggestData>) : null))
        .then((data) => {
          if (myId !== reqIdRef.current || !data) return;
          setSuggest({ db: data.db ?? [], llm: data.llm ?? [] });
          setLoading(false);
        })
        .catch(() => {
          if (myId !== reqIdRef.current) return;
          setLoading(false);
        });
      return () => ctrl.abort();
    }, SUGGEST_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [val, lang]);

  const showDropdown =
    focused && val.trim().length >= SUGGEST_MIN_CHARS && (suggest.db.length > 0 || suggest.llm.length > 0 || loading);

  const handlePickDb = (hit: SuggestDbHit) => {
    setFocused(false);
    router.push(`/check/${hit.id}`);
  };
  const handlePickLlm = (text: string) => {
    setVal(text);
    inputRef.current?.focus();
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px clamp(16px, 4vw, 32px)',
        position: 'relative',
        minHeight: 'calc(100vh - 0px)',
      }}
    >
      <LangSwitcher lang={lang} onLang={onLang} pos="absolute" autoDetected={autoDetected} />
      <div style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 6,
          }}
        >
          <Logomark />
          <div
            style={{
              fontFamily: 'var(--font-instrument-serif), "Instrument Serif", serif',
              fontSize: 42,
              color: '#111',
              letterSpacing: -1,
              lineHeight: 1,
            }}
          >
            {t.productName}
          </div>
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#888',
            marginBottom: 32,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
          }}
        >
          {t.tagline}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = val.trim();
            if (q.length >= 5) {
              setFocused(false);
              onSubmit(q);
            }
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 20px',
                border: '1px solid oklch(0.88 0 0)',
                borderRadius: 999,
                background: '#fff',
                boxShadow:
                  '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px -12px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.2s, border-color 0.2s',
              }}
            >
              <SearchIcon size={18} color="#888" />
              <input
                ref={inputRef}
                autoFocus
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setTimeout(() => setFocused(false), 120);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setFocused(false);
                }}
                placeholder={t.placeholder}
                maxLength={1000}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 15,
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  background: 'transparent',
                  color: '#111',
                }}
              />
              <button
                type="submit"
                style={{
                  border: 'none',
                  background: val.trim().length >= 5 ? '#111' : 'oklch(0.92 0 0)',
                  color: val.trim().length >= 5 ? '#fff' : '#aaa',
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 13,
                  padding: '7px 16px',
                  borderRadius: 999,
                  cursor: val.trim().length >= 5 ? 'pointer' : 'default',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {t.submit}
              </button>
            </div>
            {showDropdown && (
              <SuggestDropdown
                t={t}
                data={suggest}
                loading={loading}
                onPickDb={handlePickDb}
                onPickLlm={handlePickLlm}
              />
            )}
          </div>
        </form>
        {error && (
          <div
            style={{
              marginTop: 14,
              fontSize: 13,
              color: 'oklch(0.46 0.16 25)',
              fontFamily: 'var(--font-inter), Inter, sans-serif',
            }}
          >
            {error}
          </div>
        )}
        {!showDropdown && (
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: '#aaa',
                alignSelf: 'center',
                marginRight: 4,
                fontFamily: 'var(--font-inter), Inter, sans-serif',
              }}
            >
              {t.suggestions}:
            </span>
            {t.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setVal(ex);
                  setFocused(false);
                  onSubmit(ex);
                }}
                style={{
                  border: '1px solid oklch(0.92 0 0)',
                  background: '#fff',
                  color: '#555',
                  borderRadius: 999,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 11,
          color: '#bbb',
          fontFamily: 'var(--font-inter), Inter, sans-serif',
        }}
      >
        {t.poweredBy}
      </div>
    </div>
  );
}
