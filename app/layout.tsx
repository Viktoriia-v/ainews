import type { Metadata } from 'next';
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { I18N } from '@/lib/i18n/dictionary';
import { resolveServerLang } from '@/lib/i18n/serverLang';

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-instrument-serif',
  weight: ['400'],
  style: ['normal', 'italic'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
});

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await resolveServerLang();
  const t = I18N[lang];
  return {
    title: `${t.productName} — ${t.tagline}`,
    description: t.tagline,
    openGraph: {
      title: t.productName,
      description: t.tagline,
      locale: lang,
      type: 'website',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { lang } = await resolveServerLang();
  return (
    <html
      lang={lang}
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
