'use client';

import { useEffect, useRef, useState } from 'react';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/languages';
import { I18N } from '@/lib/i18n/dictionary';
import { SearchIcon } from './atoms';

interface Props {
  lang: LanguageCode;
  onLang: (l: LanguageCode) => void;
  pos?: 'static' | 'absolute';
  autoDetected?: boolean;
}

export function LangSwitcher({ lang, onLang, pos = 'static', autoDetected = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];
  const t = I18N[lang];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
    };
  }, [open]);

  const filtered = SUPPORTED_LANGUAGES.filter((l) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      l.nativeName.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.code.includes(q)
    );
  });

  return (
    <div
      ref={wrapRef}
      style={{
        position: pos === 'absolute' ? 'absolute' : 'relative',
        top: pos === 'absolute' ? 'clamp(12px, 3vw, 24px)' : 'auto',
        right: pos === 'absolute' ? 'clamp(12px, 3vw, 24px)' : 'auto',
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        zIndex: 30,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`${current.nativeName} (${current.name})`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1px solid oklch(0.92 0 0)',
          background: '#fff',
          borderRadius: 999,
          padding: '6px 10px 6px 12px',
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          color: '#333',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span style={{ fontWeight: 500 }}>{current.nativeName}</span>
        {autoDetected && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: 'oklch(0.45 0.13 155)',
              background: 'oklch(0.96 0.04 155)',
              padding: '2px 5px',
              borderRadius: 3,
            }}
          >
            {t.autoBadge}
          </span>
        )}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#999"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 'min(240px, calc(100vw - 24px))',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid oklch(0.92 0 0)',
            boxShadow:
              '0 12px 32px -8px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
            padding: 6,
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderBottom: '1px solid oklch(0.95 0 0)',
              marginBottom: 4,
            }}
          >
            <SearchIcon size={13} color="#aaa" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchLanguagePlaceholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 12,
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                color: '#111',
                background: 'transparent',
              }}
            />
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#999' }}>
                {t.noMatches}
              </div>
            )}
            {filtered.map((l) => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    onLang(l.code);
                    setOpen(false);
                    setQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    border: 'none',
                    background: active ? 'oklch(0.97 0 0)' : 'transparent',
                    padding: '8px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = 'oklch(0.98 0 0)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: '#888',
                      minWidth: 22,
                    }}
                  >
                    {l.code}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: '#111',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {l.nativeName}
                  </span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{l.name}</span>
                  {active && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#111"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
