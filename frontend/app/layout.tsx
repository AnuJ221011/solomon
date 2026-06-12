import type { Metadata } from 'next'
import { Trirong, Quattrocento_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers/Providers'

// Editorial serif — homepage hero, brand storefront names only
const trirong = Trirong({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-playfair',
  display: 'swap',
})

// UI sans — all marketplace interface text (Quattrocento Sans: 400 + 700 only)
const quattrocentoSans = Quattrocento_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-public-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Solomon Bharat — India's Finest Wholesale Brands",
  description:
    'B2B wholesale marketplace connecting Indian artisan brands with international retailers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${trirong.variable} ${quattrocentoSans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
