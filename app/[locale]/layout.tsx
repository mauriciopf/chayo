import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import type { Metadata } from 'next'
import '../globals.css'

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

  // Get messages using next-intl's getMessages (which will use our i18n.ts config)
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {/* ElevenLabs ConvAI Widget Script */}
        <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
      </head>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
        {/* ElevenLabs Widget */}
        <div dangerouslySetInnerHTML={{ __html: '<elevenlabs-convai agent-id="agent_01jyc95f0be1v9xww6h31366mw"></elevenlabs-convai>' }} />
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return locales.map((locale: string) => ({locale}));
}
