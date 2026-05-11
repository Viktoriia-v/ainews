import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isLanguageCode } from '@/lib/i18n/languages';
import { translateQuery } from '@/lib/pipeline/translateQuery';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const data = body as { text?: unknown; targetLang?: unknown };
  const text = typeof data.text === 'string' ? data.text.trim() : '';
  const targetLang = isLanguageCode(data.targetLang) ? data.targetLang : null;

  if (text.length === 0) {
    return NextResponse.json({ error: 'empty_text' }, { status: 400 });
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }
  if (!targetLang) {
    return NextResponse.json({ error: 'invalid_target_lang' }, { status: 400 });
  }

  const result = await translateQuery(text, targetLang);
  return NextResponse.json({
    translated: result.translated,
    sourceLang: result.sourceLang,
    alreadyInTarget: result.alreadyInTarget,
  });
}
