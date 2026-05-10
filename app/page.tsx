import { resolveServerLang } from '@/lib/i18n/serverLang';
import { VerityApp } from '@/components/verity/VerityApp';

export default async function Home() {
  const { lang, autoDetected } = await resolveServerLang();
  return <VerityApp initialLang={lang} initialAutoDetected={autoDetected} />;
}
