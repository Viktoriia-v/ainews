'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/languages';

interface ApiResult {
  id: string;
  verdict: string;
  confidence: number;
  summary: string;
  explanation: string;
  processingMs: number;
  [k: string]: unknown;
}

const STAGE_MESSAGES = [
  'Searching news sources...',
  'Analyzing sources...',
  'Computing verdict...',
];

export function CheckForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<(typeof SUPPORTED_LANGUAGES)[number]['code']>('en');
  const [loading, setLoading] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setResult(null);

    if (query.trim().length < 5) {
      setError('Please enter at least 5 characters');
      return;
    }

    setLoading(true);
    setStageIdx(0);
    const stageTimer = setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STAGE_MESSAGES.length - 1));
    }, 6000);

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), language }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 429) setError('Too many requests. Please wait a minute.');
        else if (errBody.error === 'too_short') setError('Please enter at least 5 characters');
        else setError('Something went wrong. Please try again.');
        return;
      }

      const data = (await res.json()) as ApiResult;
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Network error — please try again');
    } finally {
      clearInterval(stageTimer);
      setLoading(false);
    }
  }

  function copyShareLink() {
    if (!result) return;
    const url = `${window.location.origin}/check/${result.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <textarea
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Enter a news headline or statement to verify..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          maxLength={1000}
        />

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <label className="text-sm flex flex-col gap-1 flex-1">
            <span className="text-zinc-600 dark:text-zinc-400">Language of the claim</span>
            <select
              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2"
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value as (typeof SUPPORTED_LANGUAGES)[number]['code'])
              }
              disabled={loading}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 font-medium self-end sm:self-auto h-10"
          >
            {loading ? 'Checking...' : 'Check'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-700 dark:text-zinc-300">
          <div className="animate-pulse">{STAGE_MESSAGES[stageIdx]}</div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <span
              className={
                'inline-block px-3 py-1 rounded-full text-sm font-semibold ' +
                verdictBadgeClasses(result.verdict)
              }
            >
              {humanVerdict(result.verdict)}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Confidence: {result.confidence}%
            </span>
          </div>

          <div className="text-sm">
            <h3 className="font-semibold mb-1">Summary</h3>
            <p className="text-zinc-700 dark:text-zinc-300">{result.summary}</p>
          </div>

          <div className="text-sm">
            <h3 className="font-semibold mb-1">Explanation</h3>
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {result.explanation}
            </p>
          </div>

          <div className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{result.processingMs} ms</span>
            <span>·</span>
            <button
              type="button"
              onClick={copyShareLink}
              className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Copy share link
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => router.push(`/check/${result.id}`)}
              className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Open result page
            </button>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-zinc-500 dark:text-zinc-400">
              Raw JSON (debug)
            </summary>
            <pre className="mt-2 p-3 rounded bg-zinc-100 dark:bg-zinc-900 overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function humanVerdict(v: string): string {
  return (
    {
      true: 'True',
      fake: 'Fake',
      partly_true: 'Partly true',
      unclear: 'Unclear',
      insufficient_data: 'Not enough data',
    }[v] ?? v
  );
}

function verdictBadgeClasses(v: string): string {
  switch (v) {
    case 'true':
      return 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200';
    case 'fake':
      return 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200';
    case 'partly_true':
      return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200';
    default:
      return 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200';
  }
}
