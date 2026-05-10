import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/client';
import { I18N } from '@/lib/i18n/dictionary';
import { isLanguageCode, type LanguageCode } from '@/lib/i18n/languages';
import { resolveServerLang } from '@/lib/i18n/serverLang';
import { adaptResult, type RawSource } from '@/components/verity/adapter';
import { SharedResult } from '@/components/verity/SharedResult';

interface PageContext {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageContext): Promise<Metadata> {
  const { id } = await params;
  const check = await prisma.check.findUnique({
    where: { id },
    select: { query: true, summary: true, language: true },
  });

  const { lang: uiLang } = await resolveServerLang();
  const tUi = I18N[uiLang];

  if (!check) {
    return { title: `${tUi.notFound} — ${tUi.productName}` };
  }

  const checkLang: LanguageCode = isLanguageCode(check.language)
    ? check.language
    : 'en';
  const tCheck = I18N[checkLang];

  const titleSnippet =
    check.query.length > 60 ? check.query.slice(0, 60) + '…' : check.query;

  return {
    title: `${titleSnippet} — ${tCheck.productName}`,
    description: check.summary,
    openGraph: {
      title: titleSnippet,
      description: check.summary,
      locale: checkLang,
      type: 'article',
    },
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

  const checkLang: LanguageCode = isLanguageCode(check.language)
    ? check.language
    : 'en';
  const { lang: uiLang } = await resolveServerLang();

  return <SharedResult result={result} uiLang={uiLang} checkLang={checkLang} />;
}
