'use client';

import { useState } from 'react';
import type { LanguageCode } from '@/lib/i18n/languages';
import type { UIStrings } from '@/lib/i18n/dictionary';
import { Logomark, SearchIcon } from './atoms';
import { LangSwitcher } from './LangSwitcher';

interface Props {
  t: UIStrings;
  lang: LanguageCode;
  onLang: (l: LanguageCode) => void;
  onSubmit: (q: string) => void;
  autoDetected: boolean;
  prefill?: string;
  error?: string | null;
}

export function Hero({ t, lang, onLang, onSubmit, autoDetected, prefill = '', error }: Props) {
  const [val, setVal] = useState(prefill);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
        position: 'relative',
        minHeight: 'calc(100vh - 0px)',
      }}
    >
      <LangSwitcher lang={lang} onLang={onLang} pos="absolute" autoDetected={autoDetected} />
      <div style={{ width: '100%', maxWidth: 640, textAlign: 'center', marginTop: -40 }}>
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
            if (q.length >= 5) onSubmit(q);
          }}
        >
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
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
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
