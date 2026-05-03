import { llm, LLM_MODEL } from '../llm';
import { languageName, type LanguageCode } from '../i18n/languages';
import type { Claim, ClassifiedSources, ClaudeAnalysis, FactCheckHit } from '../types';

const SYSTEM_PROMPT = `You are a fact-checking analyst. Given a claim and a set of news sources, your job is to determine whether the claim is supported, refuted, or unclear based on the evidence.

Rules:
1. Base your analysis ONLY on the provided sources. Do not use prior knowledge.
2. Trust ranking: "trusted" sources > "mainstream" > "unknown".
3. If sources contradict each other, document the contradictions explicitly.
4. If evidence is insufficient or conflicting, say so — do not guess.
5. Be neutral and avoid political bias.
6. Cite source IDs (not URLs) when referencing sources.

Verdict definitions:
- "true": the claim is clearly supported by multiple credible sources
- "fake": the claim is clearly refuted by credible sources
- "partly_true": some parts are supported, others refuted or exaggerated
- "unclear": evidence is mixed or sources conflict significantly
- "insufficient_data": not enough credible information to assess

You MUST respond using the analyze_claim tool.`;

const TOOL = {
  type: 'function' as const,
  function: {
    name: 'analyze_claim',
    description: 'Analyze a claim against the provided sources',
    parameters: {
      type: 'object',
      properties: {
        verdict: {
          type: 'string',
          enum: ['true', 'fake', 'partly_true', 'unclear', 'insufficient_data'],
        },
        summary: {
          type: 'string',
          description:
            "2-3 sentence neutral summary of what actually happened, in the user's original language",
        },
        explanation: {
          type: 'string',
          description:
            "Why this verdict was reached, referencing specific sources by ID. In user's original language. 3-5 sentences.",
        },
        keySourceIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of sources most directly supporting the verdict (typically 2-5)',
        },
        contradictions: {
          type: 'array',
          items: { type: 'string' },
          description:
            'List of significant contradictions between sources, if any. Empty array if none.',
        },
        agreementLevel: {
          type: 'string',
          enum: ['high', 'medium', 'low', 'none'],
          description:
            'How much sources agree: high = all agree, medium = mostly agree, low = mixed, none = direct contradictions',
        },
      },
      required: [
        'verdict',
        'summary',
        'explanation',
        'keySourceIds',
        'contradictions',
        'agreementLevel',
      ],
      additionalProperties: false,
    },
  },
};

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + '... [truncated]';
}

function buildUserMessage(
  claim: Claim,
  language: LanguageCode,
  sources: ClassifiedSources,
  factCheckHits: FactCheckHit[],
): string {
  const factCheckBlock =
    factCheckHits.length > 0
      ? `Google Fact Check results:\n${JSON.stringify(factCheckHits, null, 2)}`
      : 'Google Fact Check results: No matches found';

  const sourceBlocks = sources.usable
    .map(
      (s) =>
        `[Source ID: ${s.id} | Category: ${s.category} | Domain: ${s.domain}]
Title: ${s.title}
Published: ${s.publishedDate || 'unknown'}
Content:
${truncate(s.content, 4000)}`,
    )
    .join('\n\n');

  return `Claim (original): ${claim.original}
Claim (English): ${claim.english}
User language: ${language} (${languageName(language)})

${factCheckBlock}

Sources (${sources.usable.length} total):

${sourceBlocks}`;
}

export async function analyzeWithClaude(
  claim: Claim,
  language: LanguageCode,
  sources: ClassifiedSources,
  factCheckHits: FactCheckHit[],
): Promise<ClaudeAnalysis> {
  const userMessage = buildUserMessage(claim, language, sources, factCheckHits);

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
        tool_choice: { type: 'function', function: { name: 'analyze_claim' } },
      });

      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.type !== 'function') {
        throw new Error('No tool call in analyze_claim response');
      }
      const args = JSON.parse(toolCall.function.arguments);
      return {
        verdict: args.verdict,
        summary: String(args.summary ?? ''),
        explanation: String(args.explanation ?? ''),
        keySourceIds: Array.isArray(args.keySourceIds) ? args.keySourceIds.map(String) : [],
        contradictions: Array.isArray(args.contradictions) ? args.contradictions.map(String) : [],
        agreementLevel: args.agreementLevel ?? 'low',
      };
    } catch (err) {
      lastError = err;
      console.warn(`[analyzeWithClaude] attempt ${attempt + 1} failed:`, err);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('analyzeWithClaude failed');
}
