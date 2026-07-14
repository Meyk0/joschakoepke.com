import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "@/styles/desktop-shell.css";
import "@/styles/app-windows.css";
import "@/styles/surf-game.css";
import "@/styles/mobile.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://joschakoepke.com"),
  title: "Joscha Koepke | AI Product Leader",
  description:
    "AI product leader who scaled agent platforms to $10M+ ARR and 40M+ monthly messages. Explore an evidence-grounded portfolio, projects, writing, and resume.",
  alternates: {
    canonical: "https://joschakoepke.com",
  },
  keywords: [
    "AI product leader",
    "AI agents",
    "LLM evaluation",
    "agent memory",
    "product leadership",
    "Joscha Koepke",
  ],
  openGraph: {
    title: "Joscha Koepke | AI Product Leader",
    description:
      "An evidence-grounded portfolio for an AI product leader who scaled agent platforms to $10M+ ARR and 40M+ monthly messages.",
    url: "https://joschakoepke.com",
    siteName: "Joscha Koepke",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joscha Koepke | AI Product Leader",
    description:
      "Explore an evidence-grounded AI product portfolio, projects, writing, and resume.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Joscha Koepke",
  jobTitle: "Head of Product",
  worksFor: {
    "@type": "Organization",
    name: "Connectly AI",
  },
  url: "https://joschakoepke.com",
  sameAs: [
    "https://linkedin.com/in/joschakoepke",
    "https://github.com/Meyk0",
  ],
  knowsAbout: [
    "AI agents",
    "LLM evaluation",
    "agent memory and personalization",
    "product leadership",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-30RF6GJR45"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-30RF6GJR45');
          `}
        </Script>
        <Analytics />
      </body>
    </html>
  );
}
