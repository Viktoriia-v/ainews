import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import type { Metadata } from 'next';

interface PageContext {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageContext): Promise<Metadata> {
  const { id } = await params;
  const check = await prisma.check.findUnique({
    where: { id },
    select: { query: true, summary: true, verdict: true },
  });
  if (!check) return { title: 'Result not found — AI Fact Checker' };

  const titleSnippet = check.query.length > 60 ? check.query.slice(0, 60) + '...' : check.query;
  return {
    title: `${titleSnippet} — AI Fact Checker`,
    description: check.summary,
    openGraph: {
      title: titleSnippet,
      description: check.summary,
    },
  };
}

export default async function CheckPage({ params }: PageContext) {
  const { id } = await params;
  const check = await prisma.check.findUnique({ where: { id } });
  if (!check) notFound();

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-20 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        <a href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← New check
        </a>

        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
          <h1 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Original query</h1>
          <p className="text-base">{check.query}</p>
        </div>

        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3 bg-white dark:bg-zinc-900">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <span
              className={
                'inline-block px-3 py-1 rounded-full text-sm font-semibold ' +
                verdictBadgeClasses(check.verdict)
              }
            >
              {humanVerdict(check.verdict)}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Confidence: {check.confidence}%
            </span>
          </div>

          <div className="text-sm">
            <h3 className="font-semibold mb-1">Summary</h3>
            <p className="text-zinc-700 dark:text-zinc-300">{check.summary}</p>
          </div>

          <div className="text-sm">
            <h3 className="font-semibold mb-1">Explanation</h3>
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {check.explanation}
            </p>
          </div>

          <div className="text-xs text-zinc-500">
            {check.processingMs} ms · {new Date(check.createdAt).toISOString()}
          </div>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-zinc-500">Raw JSON (debug)</summary>
          <pre className="mt-2 p-3 rounded bg-zinc-100 dark:bg-zinc-900 overflow-auto max-h-96">
            {JSON.stringify(check, null, 2)}
          </pre>
        </details>
      </div>
    </main>
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
