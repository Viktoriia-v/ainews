import type { LanguageCode } from '../i18n/languages';
import type { Claim, ClassifiedSources, PipelineResult, Verdict } from '../types';
import { extractClaim } from './extractClaim';
import { searchNews } from './searchNews';
import { queryGoogleFactCheck } from './factCheckAPI';
import { classifySources } from './classifySources';
import { analyzeWithClaude } from './analyzeWithClaude';
import { computeConfidence } from './computeConfidence';

function buildInsufficient(
  claim: Claim,
  classified: ClassifiedSources,
  start: number,
): PipelineResult {
  return {
    claim,
    verdict: 'insufficient_data',
    confidence: 0,
    summary: 'Not enough credible sources were found to evaluate this claim.',
    explanation:
      classified.usable.length === 0
        ? 'No relevant news sources were returned by the search.'
        : `Only ${classified.usable.length} usable source(s) were found — at least 2 are required for a meaningful verdict.`,
    sources: classified.all,
    keySourceIds: [],
    contradictions: [],
    factCheckHits: [],
    processingMs: Date.now() - start,
  };
}

export async function runPipeline(
  query: string,
  language: LanguageCode,
): Promise<PipelineResult> {
  const start = Date.now();

  const claim = await extractClaim(query, language);
  console.log('[pipeline] claim extracted:', claim.english);

  const [searchResults, factCheckResults] = await Promise.all([
    searchNews(claim),
    queryGoogleFactCheck(claim.english),
  ]);
  console.log(
    `[pipeline] tavily=${searchResults.length} factCheck=${factCheckResults.length}`,
  );

  const classified = classifySources(searchResults);
  console.log(
    `[pipeline] sources: trusted=${classified.trusted.length} mainstream=${classified.mainstream.length} unknown=${classified.unknown.length}`,
  );

  if (classified.usable.length < 2) {
    return buildInsufficient(claim, classified, start);
  }

  const analysis = await analyzeWithClaude(claim, language, classified, factCheckResults);
  console.log(`[pipeline] verdict=${analysis.verdict} agreement=${analysis.agreementLevel}`);

  const confidence = computeConfidence({
    sources: classified,
    agreementLevel: analysis.agreementLevel,
    factCheckHit: factCheckResults.length > 0,
  });

  const finalVerdict: Verdict = confidence < 30 ? 'insufficient_data' : analysis.verdict;

  return {
    claim,
    verdict: finalVerdict,
    confidence,
    summary: analysis.summary,
    explanation: analysis.explanation,
    sources: classified.all,
    keySourceIds: analysis.keySourceIds,
    contradictions: analysis.contradictions,
    factCheckHits: factCheckResults,
    processingMs: Date.now() - start,
  };
}
