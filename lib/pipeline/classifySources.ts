import { classifyDomain } from '../sources/ratings';
import type { Source, ClassifiedSources } from '../types';

export function classifySources(rawSources: Omit<Source, 'category'>[]): ClassifiedSources {
  const all: Source[] = rawSources.map((s) => ({
    ...s,
    category: classifyDomain(s.domain),
  }));

  const usable = all.filter((s) => s.category !== 'unreliable');
  const trusted = usable.filter((s) => s.category === 'trusted');
  const mainstream = usable.filter((s) => s.category === 'mainstream');
  const unknown = usable.filter((s) => s.category === 'unknown');

  return { all, usable, trusted, mainstream, unknown };
}
