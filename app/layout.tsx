import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Manrope } from 'next/font/google'
import { SITE_NAME } from '@/lib/constants'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: `${SITE_NAME} Studio — AI-Powered Creation`,
  description: 'A futuristic AI studio for text, image, code, and website generation'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
  <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Script src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.6.2/dist/dotlottie-wc.js" type="module" strategy="afterInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
