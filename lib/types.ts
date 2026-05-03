import type { LanguageCode } from './i18n/languages';
import type { SourceCategory } from './sources/ratings';

export type Verdict = 'true' | 'fake' | 'partly_true' | 'unclear' | 'insufficient_data';
export type AgreementLevel = 'high' | 'medium' | 'low' | 'none';

export interface Claim {
  original: string;
  english: string;
  entities: string[];
  searchQueries: {
    native: string;
    english: string;
  };
}

export interface Source {
  id: string;
  url: string;
  title: string;
  content: string;
  domain: string;
  publishedDate: string;
  language: 'native' | 'english';
  category: SourceCategory;
}

export interface ClassifiedSources {
  all: Source[];
  usable: Source[];
  trusted: Source[];
  mainstream: Source[];
  unknown: Source[];
}

export interface FactCheckHit {
  text: string;
  claimant?: string;
  claimDate?: string;
  reviews: Array<{
    publisher: string;
    url: string;
    title: string;
    rating: string;
    reviewDate?: string;
  }>;
}

export interface ClaudeAnalysis {
  verdict: Verdict;
  summary: string;
  explanation: string;
  keySourceIds: string[];
  contradictions: string[];
  agreementLevel: AgreementLevel;
}

export interface PipelineResult {
  claim: Claim;
  verdict: Verdict;
  confidence: number;
  summary: string;
  explanation: string;
  sources: Source[];
  keySourceIds: string[];
  contradictions: string[];
  factCheckHits: FactCheckHit[];
  processingMs: number;
}

export interface CheckRequestBody {
  query: string;
  language: LanguageCode;
}
