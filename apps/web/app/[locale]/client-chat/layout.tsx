import type { Metadata } from 'next'
import '../../globals.css'

export const metadata: Metadata = {
  title: 'Chat with AI Assistant | Chayo AI',
  description: 'Chat with your business AI assistant powered by Chayo AI',
  robots: 'noindex, nofollow', // Keep client chats private
}

export default function ClientChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-white overscroll-none">
        <main className="h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  )
} 