import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { runPipeline } from '@/lib/pipeline';
import { isLanguageCode, type LanguageCode } from '@/lib/i18n/languages';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limit', retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec ?? 60) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const data = body as { query?: unknown; language?: unknown };
  const query = typeof data.query === 'string' ? data.query.trim() : '';
  const language = isLanguageCode(data.language) ? (data.language as LanguageCode) : null;

  if (query.length < 5) {
    return NextResponse.json({ error: 'too_short' }, { status: 400 });
  }
  if (query.length > 1000) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }
  if (!language) {
    return NextResponse.json({ error: 'invalid_language' }, { status: 400 });
  }

  try {
    const result = await runPipeline(query, language);

    const saved = await prisma.check.create({
      data: {
        query,
        language,
        verdict: result.verdict,
        confidence: result.confidence,
        summary: result.summary,
        explanation: result.explanation,
        sources: result.sources as unknown as Prisma.InputJsonValue,
        keySources: result.keySourceIds as unknown as Prisma.InputJsonValue,
        factCheckHits: result.factCheckHits as unknown as Prisma.InputJsonValue,
        contradictions: result.contradictions as unknown as Prisma.InputJsonValue,
        processingMs: result.processingMs,
      },
      select: { id: true },
    });

    return NextResponse.json({
      id: saved.id,
      verdict: result.verdict,
      confidence: result.confidence,
      summary: result.summary,
      explanation: result.explanation,
      sources: result.sources,
      keySourceIds: result.keySourceIds,
      contradictions: result.contradictions,
      factCheckHits: result.factCheckHits,
      processingMs: result.processingMs,
    });
  } catch (err) {
    console.error('[api/check] pipeline failed:', err);
    return NextResponse.json({ error: 'pipeline_failed' }, { status: 500 });
  }
}
