import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CHIMERA — Underground Luxury Streetwear",
  description: "Limited drops. Raw craftsmanship. Worldwide shipping.",
  openGraph: {
    title: "CHIMERA",
    description: "Underground luxury streetwear. Limited drops.",
    siteName: "CHIMERA Store",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
