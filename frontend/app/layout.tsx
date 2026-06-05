import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Solomon Bharat — India's B2B Wholesale Marketplace",
    template: "%s | Solomon Bharat",
  },
  description:
    "Discover unique Indian artisan brands. Wholesale pricing, verified sellers, direct from India to your boutique.",
  keywords: ["wholesale", "India", "artisan", "B2B", "marketplace", "boutique"],
  openGraph: {
    siteName: "Solomon Bharat",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#FFFFFF",
                border: "1px solid #E8E0D8",
                color: "#1A1A1A",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
