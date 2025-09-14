import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VibeCoder — AI Website Generator',
  description: 'Type a prompt. Watch code stream. See your site live.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
