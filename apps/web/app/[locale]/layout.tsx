import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import type { Metadata } from 'next'
import '../globals.css'

// Define supported locales directly
const locales = ['es'];

export const metadata: Metadata = {
  metadataBase: new URL('https://chayo.ai'),
  title: 'Chayo AI – Tu Comadre Digital que Nunca Duerme | Asistente de IA para negocios',
  description: 'Chayo es tu comadre digital que nunca duerme. Aprende tus necesidades de negocio, te acompaña 24/7 y te ayuda a hacer crecer tu negocio. Configuración en 5 minutos.',
  keywords: 'asistente de ia, negocios latinos, automatización en español, soporte 24/7, inteligencia artificial latina, crecimiento empresarial, asistente virtual hispano',
  authors: [{ name: 'Chayo AI' }],
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  openGraph: {
    title: 'Chayo AI – Tu Comadre Digital que Nunca Duerme',
    description: 'IA que aprende tus necesidades de negocio, te acompaña 24/7, y te ayuda a hacer crecer tu negocio. Tu comadre digital que nunca duerme.',
    type: 'website',
    url: 'https://chayo.ai',
    images: [
      {
        url: 'https://chayo.ai/chayo-logo.svg',
        width: 1200,
        height: 630,
        alt: 'Chayo AI Logo',
      },
    ],
    siteName: 'Chayo AI',
    locale: 'es_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chayo AI – Tu Comadre Digital que Nunca Duerme',
    description: 'IA que aprende tus necesidades de negocio y te acompaña 24/7. Tu comadre digital que nunca duerme.',
    images: ['https://chayo.ai/chayo-logo.svg'],
    site: '@ChayoAI',
    creator: '@ChayoAI',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chayo AI',
  },
}

export function generateViewport() {
  return {
    themeColor: '#9333ea',
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get messages using next-intl's getMessages with explicit locale
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head></head>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return locales.map((locale: string) => ({locale}));
}
