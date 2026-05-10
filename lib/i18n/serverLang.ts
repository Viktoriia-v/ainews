import { cookies, headers } from 'next/headers';
import { isLanguageCode, type LanguageCode } from './languages';

export const LANG_COOKIE = 'verity_lang';

export interface ResolvedLang {
  lang: LanguageCode;
  autoDetected: boolean;
}

export async function resolveServerLang(): Promise<ResolvedLang> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LANG_COOKIE)?.value;
  if (fromCookie && isLanguageCode(fromCookie)) {
    return { lang: fromCookie, autoDetected: false };
  }

  const hdrs = await headers();
  const accept = hdrs.get('accept-language');
  if (accept) {
    const candidates = accept
      .split(',')
      .map((p) => p.trim().split(';')[0].toLowerCase().split('-')[0]);
    for (const code of candidates) {
      if (isLanguageCode(code)) return { lang: code, autoDetected: true };
    }
  }
  return { lang: 'en', autoDetected: false };
}
