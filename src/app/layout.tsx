import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { siteConfig } from "@/config/site";
import { supabasePreconnectOrigin } from "@/lib/supabase/preconnect-origin";
import "./globals.css";

/** Google Ads gtag (override via Vercel: NEXT_PUBLIC_GOOGLE_ADS_ID). */
const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18096595779";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.businessName} — ${siteConfig.titleSuffix}`,
    template: `%s · ${siteConfig.businessName}`,
  },
  description: siteConfig.metaDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseOrigin = supabasePreconnectOrigin();
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <head>
        {supabaseOrigin ? (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <Script id="google-ads-gtag" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', ${JSON.stringify(GOOGLE_ADS_ID)});
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_ID)}`}
          strategy="lazyOnload"
        />
        {children}
      </body>
    </html>
  );
}
