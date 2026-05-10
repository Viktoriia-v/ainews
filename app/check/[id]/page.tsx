import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/client';
import { isLanguageCode, type LanguageCode } from '@/lib/i18n/languages';
import { adaptResult, type RawSource } from '@/components/verity/adapter';
import { SharedResult } from '@/components/verity/SharedResult';

interface PageContext {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageContext): Promise<Metadata> {
  const { id } = await params;
  const check = await prisma.check.findUnique({
    where: { id },
    select: { query: true, summary: true },
  });
  if (!check) return { title: 'Result not found — Verity' };
  const titleSnippet =
    check.query.length > 60 ? check.query.slice(0, 60) + '…' : check.query;
  return {
    title: `${titleSnippet} — Verity`,
    description: check.summary,
    openGraph: { title: titleSnippet, description: check.summary },
  };
}

export default async function CheckPage({ params }: PageContext) {
  const { id } = await params;
  const check = await prisma.check.findUnique({ where: { id } });
  if (!check) notFound();

  const sources = (check.sources ?? []) as unknown as RawSource[];
  const keySourceIds = (check.keySources ?? []) as unknown as string[];
  const contradictions = (check.contradictions ?? []) as unknown as string[];

  const result = adaptResult(
    {
      id: check.id,
      query: check.query,
      verdict: check.verdict,
      confidence: check.confidence,
      summary: check.summary,
      explanation: check.explanation,
      sources,
      keySourceIds,
      contradictions,
    },
    check.query,
  );

  const initialLang: LanguageCode = isLanguageCode(check.language)
    ? check.language
    : 'en';

  return <SharedResult result={result} initialLang={initialLang} />;
}
