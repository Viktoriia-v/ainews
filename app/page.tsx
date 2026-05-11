import { headers } from 'next/headers';
import { resolveServerLang } from '@/lib/i18n/serverLang';
import { isMobileFromUA } from '@/lib/responsive';
import { VerityApp } from '@/components/verity/VerityApp';

export default async function Home() {
  const { lang, autoDetected } = await resolveServerLang();
  const ua = (await headers()).get('user-agent');
  const initialIsMobile = isMobileFromUA(ua);
  return (
    <VerityApp
      initialLang={lang}
      initialAutoDetected={autoDetected}
      initialIsMobile={initialIsMobile}
    />
  );
}
