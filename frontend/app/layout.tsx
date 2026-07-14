import type { Metadata } from 'next'
import { Trirong, Quattrocento_Sans } from 'next/font/google'
import Script from 'next/script'
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
        <Script id="clarity-analytics" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "xma6kt9rls");`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
