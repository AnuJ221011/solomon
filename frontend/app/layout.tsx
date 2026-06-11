import type { Metadata } from 'next'
import { Playfair_Display, Public_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers/Providers'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
    <html lang="en" className={`${playfair.variable} ${publicSans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
