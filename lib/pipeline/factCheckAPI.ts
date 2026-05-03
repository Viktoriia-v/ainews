import type { FactCheckHit } from '../types';

const ENDPOINT = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

interface GoogleClaimReview {
  publisher?: { name?: string; site?: string };
  url?: string;
  title?: string;
  textualRating?: string;
  reviewDate?: string;
  languageCode?: string;
}

interface GoogleClaim {
  text?: string;
  claimant?: string;
  claimDate?: string;
  claimReview?: GoogleClaimReview[];
}

interface GoogleResponse {
  claims?: GoogleClaim[];
}

export async function queryGoogleFactCheck(query: string): Promise<FactCheckHit[]> {
  const apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
  if (!apiKey || !query) return [];

  const url = new URL(ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('key', apiKey);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.warn(`[factCheck] HTTP ${res.status}: ${await res.text().catch(() => '')}`);
      return [];
    }
    const data = (await res.json()) as GoogleResponse;
    if (!data.claims) return [];

    return data.claims.map((c) => ({
      text: c.text ?? '',
      claimant: c.claimant,
      claimDate: c.claimDate,
      reviews: (c.claimReview ?? []).map((r) => ({
        publisher: r.publisher?.name ?? r.publisher?.site ?? 'Unknown',
        url: r.url ?? '',
        title: r.title ?? '',
        rating: r.textualRating ?? 'unrated',
        reviewDate: r.reviewDate,
      })),
    }));
  } catch (err) {
    console.warn('[factCheck] request failed:', err);
    return [];
  }
}
