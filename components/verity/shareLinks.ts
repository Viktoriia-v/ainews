import type { UIStrings } from '@/lib/i18n/dictionary';
import type { DisplayResult } from './adapter';

const QUERY_TRUNCATE = 100;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

export interface ShareContent {
  text: string;
  url: string;
  full: string;
}

export function buildShareContent(
  result: DisplayResult,
  shareUrl: string,
  t: UIStrings,
): ShareContent {
  const verdict = t.states[result.verdict];
  const query = truncate(result.query, QUERY_TRUNCATE);
  const text = `“${query}” → ${verdict} (${result.confidence}%)`;
  const full = `${text}\n\n${shareUrl}\n— ${t.productName}`;
  return { text, url: shareUrl, full };
}

export interface SharePlatform {
  id: 'x' | 'telegram' | 'whatsapp' | 'threads' | 'email' | 'sms';
  label: string;
  buildHref: (c: ShareContent, t: UIStrings) => string;
}

export const SHARE_PLATFORMS: SharePlatform[] = [
  {
    id: 'x',
    label: 'X',
    buildHref: (c) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(c.text)}&url=${encodeURIComponent(c.url)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    buildHref: (c) =>
      `https://t.me/share/url?url=${encodeURIComponent(c.url)}&text=${encodeURIComponent(c.text)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    buildHref: (c) =>
      `https://wa.me/?text=${encodeURIComponent(`${c.text}\n${c.url}`)}`,
  },
  {
    id: 'threads',
    label: 'Threads',
    buildHref: (c) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(`${c.text}\n${c.url}`)}`,
  },
  {
    id: 'email',
    label: 'Email',
    buildHref: (c, t) =>
      `mailto:?subject=${encodeURIComponent(`${t.productName}: ${c.text}`)}&body=${encodeURIComponent(c.full)}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    buildHref: (c) =>
      `sms:?body=${encodeURIComponent(`${c.text}\n${c.url}`)}`,
  },
];
