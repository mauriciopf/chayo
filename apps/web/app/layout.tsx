import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chayo AI',
  description: 'Tu asistente de IA para negocios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

