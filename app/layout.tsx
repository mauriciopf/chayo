import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chayo AI — Weekly Branded Videos",
  description:
    "Upload your brand. We produce weekly AI-powered videos for your business — TikTok and Reels ready, delivered every week.",
  openGraph: {
    title: "Chayo AI — Weekly Branded Videos",
    description: "AI video production for modern brands. Weekly delivery, zero effort.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="antialiased bg-chayo-bg text-chayo-text">
        {children}
      </body>
    </html>
  );
}
