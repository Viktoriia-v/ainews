import type { AgreementLevel, ClassifiedSources } from '../types';

export interface ConfidenceInput {
  sources: ClassifiedSources;
  agreementLevel: AgreementLevel;
  factCheckHit: boolean;
}

export function computeConfidence(input: ConfidenceInput): number {
  const { trusted, mainstream, unknown, usable } = input.sources;
  const total = usable.length;
  if (total === 0) return 0;

  const sourceQuality =
    (trusted.length * 1.0 + mainstream.length * 0.6 + unknown.length * 0.2) / total;

  const sourceCount = Math.min(total / 5, 1);

  const agreementMap: Record<AgreementLevel, number> = {
    high: 1.0,
    medium: 0.6,
    low: 0.3,
    none: 0,
  };
  const agreement = agreementMap[input.agreementLevel];
  const factCheck = input.factCheckHit ? 1 : 0;

  const score =
    0.35 * sourceQuality + 0.25 * sourceCount + 0.25 * agreement + 0.15 * factCheck;

  return Math.round(score * 100);
}
