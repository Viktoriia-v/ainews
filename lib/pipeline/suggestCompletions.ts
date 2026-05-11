import { llm, LLM_MODEL } from '../llm';
import { languageName, type LanguageCode } from '../i18n/languages';

const SYSTEM_PROMPT = `You are an autocomplete service for a fact-checking tool. Given a partial query, return 3 plausible full claims that a user might want to fact-check, each starting with the partial query.

Rules:
1. Each completion MUST start with the user's prefix exactly (case-preserved when sensible).
2. Completions are claims about news, politics, science, technology, or public figures — things worth fact-checking.
3. Do NOT invent extreme or offensive content.
4. Output in the user's language.
5. Keep each completion under 100 characters.
6. Return diverse claims (different angles, not paraphrases).

Respond with the suggest_completions tool only.`;

const TOOL = {
  type: 'function' as const,
  function: {
    name: 'suggest_completions',
    description: 'Return 3 plausible claim completions starting with the prefix',
    parameters: {
      type: 'object',
      properties: {
        completions: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 5,
          description: 'Plausible full-claim completions, each starting with the prefix',
        },
      },
      required: ['completions'],
      additionalProperties: false,
    },
  },
};

interface CacheEntry {
  value: string[];
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): string[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function cacheSet(key: string, value: string[]): void {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function suggestCompletions(
  prefix: string,
  language: LanguageCode,
): Promise<string[]> {
  const trimmed = prefix.trim();
  if (trimmed.length < 3) return [];
  const cacheKey = `${language}::${trimmed.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const completion = await llm.chat.completions.create({
      model: LLM_MODEL,
      max_tokens: 256,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Language: ${language} (${languageName(language)})\nPrefix: ${trimmed}`,
        },
      ],
      tools: [TOOL],
      tool_choice: { type: 'function', function: { name: 'suggest_completions' } },
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== 'function') return [];
    const args = JSON.parse(toolCall.function.arguments);
    const raw = Array.isArray(args.completions) ? args.completions : [];
    const cleaned = raw
      .map((s: unknown) => String(s ?? '').trim())
      .filter((s: string) => s.length > 0 && s.length <= 200)
      .filter((s: string) => s.toLowerCase().startsWith(trimmed.toLowerCase()))
      .slice(0, 5);

    cacheSet(cacheKey, cleaned);
    return cleaned;
  } catch (err) {
    console.warn('[suggestCompletions] failed:', err);
    return [];
  }
}
