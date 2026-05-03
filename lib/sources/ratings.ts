export type SourceCategory = 'trusted' | 'mainstream' | 'unknown' | 'unreliable';

export const SOURCE_RATINGS: Record<string, SourceCategory> = {
  // === TRUSTED (international, high standards) ===
  'reuters.com': 'trusted',
  'apnews.com': 'trusted',
  'bbc.com': 'trusted',
  'bbc.co.uk': 'trusted',
  'afp.com': 'trusted',
  'bloomberg.com': 'trusted',
  'ft.com': 'trusted',
  'economist.com': 'trusted',
  'nytimes.com': 'trusted',
  'washingtonpost.com': 'trusted',
  'theguardian.com': 'trusted',
  'wsj.com': 'trusted',
  'npr.org': 'trusted',
  'pbs.org': 'trusted',
  'bellingcat.com': 'trusted',

  // === EN MAINSTREAM ===
  'cnn.com': 'mainstream',
  'cbsnews.com': 'mainstream',
  'nbcnews.com': 'mainstream',
  'abcnews.go.com': 'mainstream',
  'usatoday.com': 'mainstream',
  'politico.com': 'mainstream',
  'axios.com': 'mainstream',
  'theatlantic.com': 'mainstream',

  // === UK (Ukrainian) ===
  'suspilne.media': 'trusted',
  'pravda.com.ua': 'trusted',
  'radiosvoboda.org': 'trusted',
  'hromadske.ua': 'trusted',
  'kyivindependent.com': 'trusted',
  'liga.net': 'mainstream',
  'nv.ua': 'mainstream',
  'censor.net': 'mainstream',
  'ukrinform.ua': 'mainstream',
  'unian.ua': 'mainstream',
  'gordonua.com': 'mainstream',
  'lb.ua': 'mainstream',
  'epravda.com.ua': 'mainstream',

  // === RU (Russian, independent) ===
  'meduza.io': 'trusted',
  'novayagazeta.eu': 'trusted',
  'svoboda.org': 'trusted',
  'currenttime.tv': 'trusted',
  'theins.ru': 'mainstream',
  'republic.ru': 'mainstream',

  // === LT (Lithuanian) ===
  'lrt.lt': 'trusted',
  'delfi.lt': 'mainstream',
  '15min.lt': 'mainstream',
  'bns.lt': 'mainstream',
  'lrytas.lt': 'mainstream',

  // === PL (Polish) ===
  'tvn24.pl': 'trusted',
  'wyborcza.pl': 'trusted',
  'rp.pl': 'trusted',
  'polskieradio.pl': 'trusted',
  'onet.pl': 'mainstream',
  'wp.pl': 'mainstream',
  'polsatnews.pl': 'mainstream',
  'notesfrompoland.com': 'mainstream',

  // === FR (French) ===
  'lemonde.fr': 'trusted',
  'liberation.fr': 'trusted',
  'france24.com': 'trusted',
  'rfi.fr': 'trusted',
  'lefigaro.fr': 'mainstream',
  'francetvinfo.fr': 'mainstream',
  'lesechos.fr': 'mainstream',

  // === DE (German) ===
  'dw.com': 'trusted',
  'spiegel.de': 'trusted',
  'sueddeutsche.de': 'trusted',
  'faz.net': 'trusted',
  'zeit.de': 'trusted',
  'tagesschau.de': 'trusted',
  'welt.de': 'mainstream',

  // === IT (Italian) ===
  'ansa.it': 'trusted',
  'rainews.it': 'trusted',
  'repubblica.it': 'mainstream',
  'corriere.it': 'mainstream',
  'ilsole24ore.com': 'mainstream',
  'lastampa.it': 'mainstream',

  // === ES (Spanish) ===
  'elpais.com': 'trusted',
  'efe.com': 'trusted',
  'rtve.es': 'trusted',
  'elmundo.es': 'mainstream',
  'abc.es': 'mainstream',
  'lavanguardia.com': 'mainstream',

  // === UNRELIABLE (drop from results) ===
  'rt.com': 'unreliable',
  'sputniknews.com': 'unreliable',
  'tass.ru': 'unreliable',
  'tass.com': 'unreliable',
  'pravda.ru': 'unreliable',
  'globalresearch.ca': 'unreliable',
  'zerohedge.com': 'unreliable',
  'infowars.com': 'unreliable',
  'naturalnews.com': 'unreliable',
  'beforeitsnews.com': 'unreliable',
};

export function classifyDomain(domain: string): SourceCategory {
  const cleaned = domain.replace(/^www\./i, '').toLowerCase();
  return SOURCE_RATINGS[cleaned] ?? 'unknown';
}

export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}
