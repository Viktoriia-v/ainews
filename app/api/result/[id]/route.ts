import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  const check = await prisma.check.findUnique({ where: { id } });
  if (!check) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    id: check.id,
    query: check.query,
    language: check.language,
    verdict: check.verdict,
    confidence: check.confidence,
    summary: check.summary,
    explanation: check.explanation,
    sources: check.sources,
    keySourceIds: check.keySources,
    contradictions: check.contradictions ?? [],
    factCheckHits: check.factCheckHits ?? [],
    processingMs: check.processingMs,
    createdAt: check.createdAt.toISOString(),
  });
}
