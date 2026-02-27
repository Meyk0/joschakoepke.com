import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://joschakoepke.com"),
  title: "Joscha Koepke",
  description:
    "Head of Product at Connectly AI. Building AI agents for WhatsApp commerce. Queryable via MCP.",
  openGraph: {
    title: "Joscha Koepke — Terminal",
    description: "A personal site you can query from Claude.",
    url: "https://joschakoepke.com",
    siteName: "Joscha Koepke",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joscha Koepke — Terminal",
    description: "A personal site you can query from Claude.",
  },
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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
