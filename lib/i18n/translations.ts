import type { LanguageCode } from './languages';

type TranslationKey =
  | 'app.title'
  | 'app.subtitle'
  | 'input.placeholder'
  | 'input.submit'
  | 'input.languageLabel'
  | 'loading.searching'
  | 'loading.analyzing'
  | 'loading.computing'
  | 'verdict.true'
  | 'verdict.fake'
  | 'verdict.partly_true'
  | 'verdict.unclear'
  | 'verdict.insufficient_data'
  | 'result.confidence'
  | 'result.summary'
  | 'result.explanation'
  | 'result.keySources'
  | 'result.allSources'
  | 'result.contradictions'
  | 'result.share'
  | 'result.shareCopied'
  | 'error.generic'
  | 'error.tooShort'
  | 'error.rateLimit';

const en: Record<TranslationKey, string> = {
  'app.title': 'AI Fact Checker',
  'app.subtitle': 'Check news and statements with AI',
  'input.placeholder': 'Enter a news headline or statement to verify...',
  'input.submit': 'Check',
  'input.languageLabel': 'Language of the claim',
  'loading.searching': 'Searching news sources...',
  'loading.analyzing': 'Analyzing sources...',
  'loading.computing': 'Computing verdict...',
  'verdict.true': 'True',
  'verdict.fake': 'Fake',
  'verdict.partly_true': 'Partly true',
  'verdict.unclear': 'Unclear',
  'verdict.insufficient_data': 'Not enough data',
  'result.confidence': 'Confidence',
  'result.summary': 'Summary',
  'result.explanation': 'Explanation',
  'result.keySources': 'Key sources',
  'result.allSources': 'All sources',
  'result.contradictions': 'Contradictions found',
  'result.share': 'Share',
  'result.shareCopied': 'Link copied!',
  'error.generic': 'Something went wrong. Please try again.',
  'error.tooShort': 'Please enter at least 5 characters',
  'error.rateLimit': 'Too many requests. Please wait a minute.',
};

export const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  en,
  uk: en,
  ru: en,
  lt: en,
  pl: en,
  fr: en,
  de: en,
  it: en,
  es: en,
  pt: en,
  tr: en,
  ja: en,
};

export function t(key: TranslationKey, lang: LanguageCode = 'en'): string {
  return translations[lang]?.[key] ?? translations.en[key];
}

export type { TranslationKey };
