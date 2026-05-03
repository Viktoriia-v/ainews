import { llm, LLM_MODEL } from '../llm';
import { languageName, type LanguageCode } from '../i18n/languages';
import type { Claim } from '../types';

const SYSTEM_PROMPT = `You are a claim extraction assistant for a fact-checking system. Your job is to take a user's input (which may be a question, news headline, statement, or rumor) and extract a clear, verifiable factual claim from it.

The user input may be in any of these languages: English, Ukrainian, Russian, Lithuanian, Polish, French, German, Italian, Spanish.

You must respond using the extract_claim tool.`;

const TOOL = {
  type: 'function' as const,
  function: {
    name: 'extract_claim',
    description: 'Extract a verifiable factual claim from user input',
    parameters: {
      type: 'object',
      properties: {
        original: {
          type: 'string',
          description:
            'The cleaned claim in the original language, phrased as a clear factual statement',
        },
        english: {
          type: 'string',
          description: 'Accurate English translation of the claim',
        },
        entities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key entities: names, places, organizations, dates, numbers',
        },
        searchQueries: {
          type: 'object',
          properties: {
            native: {
              type: 'string',
              description:
                'Optimized search query in original language (3-8 words, key terms only)',
            },
            english: {
              type: 'string',
              description: 'Optimized search query in English (3-8 words, key terms only)',
            },
          },
          required: ['native', 'english'],
          additionalProperties: false,
        },
      },
      required: ['original', 'english', 'entities', 'searchQueries'],
      additionalProperties: false,
    },
  },
};

export async function extractClaim(query: string, language: LanguageCode): Promise<Claim> {
  const userMessage = `Language: ${language} (${languageName(language)})\nUser input: ${query}`;

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await llm.chat.completions.create({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        tools: [TOOL],
        tool_choice: { type: 'function', function: { name: 'extract_claim' } },
      });

      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.type !== 'function') {
        throw new Error('No tool call in response');
      }
      const args = JSON.parse(toolCall.function.arguments);
      if (!args.original || !args.english || !args.searchQueries) {
        throw new Error('Missing required fields in extract_claim');
      }
      return {
        original: String(args.original),
        english: String(args.english),
        entities: Array.isArray(args.entities) ? args.entities.map(String) : [],
        searchQueries: {
          native: String(args.searchQueries.native ?? args.original),
          english: String(args.searchQueries.english ?? args.english),
        },
      };
    } catch (err) {
      lastError = err;
      console.warn(`[extractClaim] attempt ${attempt + 1} failed:`, err);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('extractClaim failed');
}
