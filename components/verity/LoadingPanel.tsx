'use client';

import { useEffect, useState } from 'react';
import type { UIStrings } from '@/lib/i18n/dictionary';

const SLOW_WARNING_AFTER_MS = 30_000;

export function LoadingPanel({ t, query }: { t: UIStrings; query: string }) {
  const [step, setStep] = useState(0);
  const [scanned, setScanned] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 6000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setScanned((s) => (s < 27 ? s + 1 : s)), 320);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), SLOW_WARNING_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px clamp(16px, 4vw, 32px)' }}>
      <div
        style={{
          fontSize: 13,
          color: '#888',
          marginBottom: 8,
          fontFamily: 'var(--font-inter), Inter, sans-serif',
        }}
      >
        {t.analyzing}
      </div>
      <div
        style={{
          fontSize: 22,
          fontFamily: 'var(--font-instrument-serif), "Instrument Serif", serif',
          color: '#111',
          marginBottom: 28,
          lineHeight: 1.3,
        }}
      >
        “{query}”
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {t.steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border:
                  i < step
                    ? 'none'
                    : `1.5px solid ${i === step ? '#111' : 'oklch(0.9 0 0)'}`,
                background: i < step ? '#111' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {i < step && (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
              )}
              {i === step && (
                <div
                  style={{
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '50%',
                    border: '1.5px solid #111',
                    borderTopColor: 'transparent',
                    animation: 'verity-spin 0.9s linear infinite',
                  }}
                />
              )}
            </div>
            <div
              style={{
                fontSize: 14,
                color: i <= step ? '#111' : '#aaa',
                fontWeight: i === step ? 500 : 400,
                transition: 'color 0.3s',
                fontFamily: 'var(--font-inter), Inter, sans-serif',
              }}
            >
              {s}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 36,
          padding: '12px 16px',
          background: 'oklch(0.97 0 0)',
          borderRadius: 8,
          fontSize: 12,
          color: '#666',
          fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>scanning · reuters · ap · bbc · nature · guardian · …</span>
        <span>
          <b style={{ color: '#111' }}>{scanned}</b> {t.sourcesScanned}
        </span>
      </div>
      {slow && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'oklch(0.97 0.01 80)',
            border: '1px solid oklch(0.92 0.04 80)',
            color: '#7a5b1a',
            fontSize: 13,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: 2 }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <div>{t.slowResponse}</div>
        </div>
      )}
    </div>
  );
}
