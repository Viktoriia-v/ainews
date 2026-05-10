import type { AgreementLevel, ClassifiedSources } from '../types';

export interface ConfidenceInput {
  sources: ClassifiedSources;
  agreementLevel: AgreementLevel;
  factCheckHit: boolean;
  llmConfidence: number | null;
}

function sourceQualityScore(sources: ClassifiedSources): number {
  const { trusted, mainstream, unknown, usable } = sources;
  if (usable.length === 0) return 0;
  return (
    (trusted.length * 1.0 + mainstream.length * 0.6 + unknown.length * 0.2) /
    usable.length
  );
}

function fallbackScore(input: ConfidenceInput): number {
  const sourceQuality = sourceQualityScore(input.sources);
  const sourceCount = Math.min(input.sources.usable.length / 5, 1);
  const agreementMap: Record<AgreementLevel, number> = {
    high: 1.0,
    medium: 0.6,
    low: 0.3,
    none: 0,
  };
  const agreement = agreementMap[input.agreementLevel];
  const factCheck = input.factCheckHit ? 1 : 0;
  const score =
    0.30 * sourceQuality + 0.20 * sourceCount + 0.40 * agreement + 0.10 * factCheck;
  return Math.round(score * 100);
}

export function computeConfidence(input: ConfidenceInput): number {
  if (input.sources.usable.length === 0 && input.llmConfidence == null) return 0;

  if (input.llmConfidence == null) return fallbackScore(input);

  let score = input.llmConfidence;

  if (input.factCheckHit) score = Math.min(100, score + 5);

  const sourceQuality = sourceQualityScore(input.sources);
  if (sourceQuality < 0.3 && input.sources.usable.length < 2) {
    score = Math.min(score, 60);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
