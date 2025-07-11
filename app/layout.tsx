import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* ElevenLabs ConvAI Widget Script */}
        <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
      </head>
      <body className={inter.className}>
        {children}
        {/* ElevenLabs Widget */}
        <div dangerouslySetInnerHTML={{ __html: '<elevenlabs-convai agent-id="agent_01jyc95f0be1v9xww6h31366mw"></elevenlabs-convai>' }} />
      </body>
    </html>
  )
}
