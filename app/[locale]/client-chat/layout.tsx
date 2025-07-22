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
      <body className="min-h-screen bg-gray-50">
        <main className="container mx-auto max-w-4xl p-4">
          {children}
        </main>
      </body>
    </html>
  )
} 