import type { LanguageCode } from '@/lib/i18n/languages';

export interface TranslateResponse {
  translated: string;
  sourceLang: LanguageCode;
  alreadyInTarget: boolean;
}

export async function translateText(
  text: string,
  targetLang: LanguageCode,
): Promise<TranslateResponse> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { translated: trimmed, sourceLang: targetLang, alreadyInTarget: true };
  }
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, targetLang }),
    });
    if (!res.ok) {
      return { translated: trimmed, sourceLang: targetLang, alreadyInTarget: true };
    }
    const data = (await res.json()) as TranslateResponse;
    return {
      translated: data.translated || trimmed,
      sourceLang: data.sourceLang,
      alreadyInTarget: Boolean(data.alreadyInTarget),
    };
  } catch {
    return { translated: trimmed, sourceLang: targetLang, alreadyInTarget: true };
  }
}
