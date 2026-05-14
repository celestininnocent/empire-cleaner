import type { Metadata, Viewport } from "next";
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

function appMetadataBase(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return new URL(fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv);
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return new URL(`https://${host}`);
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: appMetadataBase(),
  title: {
    default: `${siteConfig.businessName} — ${siteConfig.titleSuffix}`,
    template: `%s · ${siteConfig.businessName}`,
  },
  description: siteConfig.metaDescription,
  applicationName: siteConfig.businessName,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.businessName,
    title: `${siteConfig.businessName} — ${siteConfig.titleSuffix}`,
    description: siteConfig.metaDescription,
  },
  twitter: {
    card: "summary",
    title: `${siteConfig.businessName} — ${siteConfig.titleSuffix}`,
    description: siteConfig.metaDescription,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#141822" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseOrigin = supabasePreconnectOrigin();
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <head>
        {supabaseOrigin ? (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        ) : null}
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
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
