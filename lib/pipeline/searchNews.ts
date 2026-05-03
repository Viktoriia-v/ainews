import { randomUUID } from 'node:crypto';
import { tavilyClient } from '../tavily';
import { extractDomain } from '../sources/ratings';
import type { Claim, Source } from '../types';
import type { SourceCategory } from '../sources/ratings';

interface RawSource {
  id: string;
  url: string;
  title: string;
  content: string;
  domain: string;
  publishedDate: string;
  language: 'native' | 'english';
}

async function searchOne(query: string, lang: 'native' | 'english'): Promise<RawSource[]> {
  if (!query) return [];
  try {
    const res = await tavilyClient.search(query, {
      searchDepth: 'advanced',
      topic: 'news',
      days: 30,
      maxResults: 8,
      includeRawContent: 'markdown',
    });
    return res.results.map((r) => ({
      id: '',
      url: r.url,
      title: r.title,
      content: r.rawContent && r.rawContent.length > r.content.length ? r.rawContent : r.content,
      domain: extractDomain(r.url),
      publishedDate: r.publishedDate ?? '',
      language: lang,
    }));
  } catch (err) {
    console.warn(`[searchNews:${lang}] search failed:`, err);
    return [];
  }
}

export async function searchNews(claim: Claim): Promise<Omit<Source, 'category'>[]> {
  const [native, english] = await Promise.all([
    searchOne(claim.searchQueries.native, 'native'),
    searchOne(claim.searchQueries.english, 'english'),
  ]);

  const merged = [...native, ...english];
  const seen = new Set<string>();
  const deduped: RawSource[] = [];
  for (const r of merged) {
    if (!r.url || seen.has(r.url)) continue;
    seen.add(r.url);
    deduped.push({ ...r, id: `src_${randomUUID().slice(0, 8)}` });
  }
  return deduped as Omit<Source, 'category'>[] & { category?: SourceCategory }[];
}
