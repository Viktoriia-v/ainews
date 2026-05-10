import type { Verdict } from '@/lib/types';
import type { VerdictKey } from './atoms';

export type Stance = 'confirms' | 'refutes' | 'neutral';

export interface RawSource {
  id: string;
  url: string;
  title: string;
  content?: string;
  domain: string;
  publishedDate?: string;
  category?: 'trusted' | 'mainstream' | 'unknown' | string;
}

export interface DisplaySource {
  id: string;
  url: string;
  name: string;
  domain: string;
  quote: string;
  stance: Stance;
  weight: number;
  minutesAgo: number;
}

export interface DisplayResult {
  id: string;
  query: string;
  verdict: VerdictKey;
  confidence: number;
  summary: string;
  explanation: string;
  contradictions: string[];
  sources: DisplaySource[];
  keyIds: Set<string>;
}

export function mapVerdict(v: Verdict | string): VerdictKey {
  switch (v) {
    case 'true':
      return 'true';
    case 'fake':
      return 'fake';
    case 'partly_true':
      return 'partly';
    default:
      return 'unclear';
  }
}

export function categoryWeight(c?: string): number {
  if (c === 'trusted') return 90;
  if (c === 'mainstream') return 75;
  return 45;
}

export function deriveStance(verdict: VerdictKey, isKey: boolean): Stance {
  if (!isKey) return 'neutral';
  if (verdict === 'fake') return 'refutes';
  return 'confirms';
}

export function minutesSince(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}

export function deriveName(domain: string, title?: string): string {
  if (!domain) return title?.split(/\s[-—|]\s/)[0] ?? 'Source';
  const root = domain.replace(/^www\./, '').split('.')[0];
  return root.charAt(0).toUpperCase() + root.slice(1);
}

export function trimQuote(content?: string, max = 180): string {
  if (!content) return '';
  const flat = content.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max).replace(/[\s,;:.\-—]+\S*$/, '') + '…';
}

export interface ApiPayload {
  id: string;
  query?: string;
  verdict: Verdict | string;
  confidence: number;
  summary: string;
  explanation: string;
  sources: RawSource[];
  keySourceIds?: string[];
  contradictions?: string[] | null;
}

export function adaptResult(payload: ApiPayload, query: string): DisplayResult {
  const verdict = mapVerdict(payload.verdict);
  const keyIds = new Set(payload.keySourceIds ?? []);
  const sources: DisplaySource[] = (payload.sources ?? []).map((s) => {
    const isKey = keyIds.has(s.id);
    return {
      id: s.id,
      url: s.url,
      name: deriveName(s.domain, s.title),
      domain: s.domain,
      quote: trimQuote(s.content ?? s.title),
      stance: deriveStance(verdict, isKey),
      weight: isKey ? Math.max(75, categoryWeight(s.category)) : categoryWeight(s.category),
      minutesAgo: minutesSince(s.publishedDate),
    };
  });

  return {
    id: payload.id,
    query: payload.query ?? query,
    verdict,
    confidence: payload.confidence,
    summary: payload.summary,
    explanation: payload.explanation,
    contradictions: payload.contradictions ?? [],
    sources,
    keyIds,
  };
}
