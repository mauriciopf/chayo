import type { Metadata } from 'next'
import '../../globals.css'

export const metadata: Metadata = {
  title: 'Chatea con tu asistente de IA | Chayo AI',
  description: 'Habla con tu asistente de negocio impulsado por Chayo AI',
  robots: 'noindex, nofollow', // Mantener privados los chats de clientes
}

export default function ClientChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
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
