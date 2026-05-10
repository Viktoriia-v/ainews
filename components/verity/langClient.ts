import type { LanguageCode } from '@/lib/i18n/languages';

export const LANG_STORAGE_KEY = 'verity:lang';
export const LANG_COOKIE = 'verity_lang';

export function persistLang(lang: LanguageCode): void {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* noop */
  }
  try {
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* noop */
  }
}
