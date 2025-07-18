import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import type { Metadata } from 'next'
import '../globals.css'
import LanguageSelector from '@/components/LanguageSelector'

// Define supported locales directly
const locales = ['en', 'es'];

export const metadata: Metadata = {
  metadataBase: new URL('https://chayo.ai'),
  title: 'Chayo AI – Tu Comadre Digital que Nunca Duerme | AI Business Automation',
  description: 'Chayo runs your business like a comadre who never sleeps. AI automation that learns your brand, handles customers 24/7, and grows your revenue. Set up in 5 minutes.',
  keywords: 'AI comadre, business automation, AI chatbot, customer service automation, Hispanic AI, Latina entrepreneur, automated booking, AI assistant, business growth',
  authors: [{ name: 'Chayo AI' }],
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  openGraph: {
    title: 'Chayo AI – Tu Comadre Digital que Nunca Duerme',
    description: 'AI automation that learns your brand, handles customers 24/7, and grows your revenue. Your digital comadre who never sleeps.',
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
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chayo AI – Tu Comadre Digital que Nunca Duerme',
    description: 'AI automation that learns your brand and handles customers 24/7. Your digital comadre who never sleeps.',
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
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get messages using next-intl's getMessages with explicit locale
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#a21caf" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-512x512.png" />
      </head>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <LanguageSelector />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return locales.map((locale: string) => ({locale}));
}
