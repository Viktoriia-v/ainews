import { llm, LLM_MODEL } from '../llm';
import {
  isLanguageCode,
  languageName,
  type LanguageCode,
} from '../i18n/languages';

const SYSTEM_PROMPT = `You translate a single short claim/news headline between languages.

Rules:
1. Detect the source language of the input.
2. If it is already in the target language, return the original verbatim and set "alreadyInTarget" to true.
3. Otherwise produce a faithful, idiomatic translation into the target language. Preserve named entities (people, places, brands) in their conventional spelling for the target language.
4. Keep the translation roughly the same length and style — it's a news claim, not prose.
5. Output via the translate_claim tool only.`;

const TOOL = {
  type: 'function' as const,
  function: {
    name: 'translate_claim',
    description: 'Detect source language and translate the text to the target language',
    parameters: {
      type: 'object',
      properties: {
        sourceLang: {
          type: 'string',
          description: 'ISO 639-1 code of the detected source language (en, ru, uk, lt, de, fr, es, it, pl, pt, tr, ja). If unknown use "en".',
        },
        translated: {
          type: 'string',
          description: 'The text in the target language (or the original if already in target).',
        },
        alreadyInTarget: {
          type: 'boolean',
          description: 'True if the input is already in the target language.',
        },
      },
      required: ['sourceLang', 'translated', 'alreadyInTarget'],
      additionalProperties: false,
    },
  },
};

export interface TranslateResult {
  translated: string;
  sourceLang: LanguageCode;
  alreadyInTarget: boolean;
}

const cache = new Map<string, TranslateResult>();
const CACHE_MAX = 200;

function cacheKey(text: string, target: LanguageCode): string {
  return `${target}::${text.trim().toLowerCase()}`;
}

export async function translateQuery(
  text: string,
  targetLang: LanguageCode,
): Promise<TranslateResult> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { translated: trimmed, sourceLang: targetLang, alreadyInTarget: true };
  }

  const key = cacheKey(trimmed, targetLang);
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  try {
    const completion = await llm.chat.completions.create({
      model: LLM_MODEL,
      max_tokens: 512,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Target language: ${targetLang} (${languageName(targetLang)})\nText: ${trimmed}`,
        },
      ],
      tools: [TOOL],
      tool_choice: { type: 'function', function: { name: 'translate_claim' } },
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== 'function') {
      return { translated: trimmed, sourceLang: targetLang, alreadyInTarget: true };
    }
    const args = JSON.parse(toolCall.function.arguments);
    const sourceLang: LanguageCode = isLanguageCode(args.sourceLang)
      ? args.sourceLang
      : targetLang;
    const translated = String(args.translated ?? trimmed).trim() || trimmed;
    const alreadyInTarget = Boolean(args.alreadyInTarget) || sourceLang === targetLang;

    const result: TranslateResult = {
      translated: alreadyInTarget ? trimmed : translated,
      sourceLang,
      alreadyInTarget,
    };

    if (cache.size >= CACHE_MAX) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }
    cache.set(key, result);
    return result;
  } catch (err) {
    console.warn('[translateQuery] failed:', err);
    return { translated: trimmed, sourceLang: targetLang, alreadyInTarget: true };
  }
}
