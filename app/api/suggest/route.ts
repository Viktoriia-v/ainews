import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { isLanguageCode, type LanguageCode } from '@/lib/i18n/languages';
import { suggestCompletions } from '@/lib/pipeline/suggestCompletions';

export const runtime = 'nodejs';

export interface SuggestDbHit {
  id: string;
  query: string;
  verdict: string;
  confidence: number;
  createdAt: string;
}

export interface SuggestResponse {
  db: SuggestDbHit[];
  llm: string[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const langParam = searchParams.get('lang');
  const lang: LanguageCode = isLanguageCode(langParam) ? langParam : 'en';

  if (q.length < 3) {
    const empty: SuggestResponse = { db: [], llm: [] };
    return NextResponse.json(empty);
  }
  if (q.length > 200) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }

  const [dbRowsSettled, llmSettled] = await Promise.allSettled([
    prisma.check.findMany({
      where: {
        query: { startsWith: q, mode: 'insensitive' },
        language: lang,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        query: true,
        verdict: true,
        confidence: true,
        createdAt: true,
      },
    }),
    suggestCompletions(q, lang),
  ]);

  const dbHits =
    dbRowsSettled.status === 'fulfilled'
      ? dbRowsSettled.value.map((r) => ({
          id: r.id,
          query: r.query,
          verdict: r.verdict,
          confidence: r.confidence,
          createdAt: r.createdAt.toISOString(),
        }))
      : [];
  const llmRaw = llmSettled.status === 'fulfilled' ? llmSettled.value : [];

  const dbQueries = new Set(dbHits.map((h) => h.query.toLowerCase()));
  const llm = llmRaw.filter((s) => !dbQueries.has(s.toLowerCase())).slice(0, 4);

  const body: SuggestResponse = { db: dbHits, llm };
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}
