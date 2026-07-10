import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chez ya Nathy — Cuisine congolaise faite maison",
  description:
    "Commandez les plats congolais faits maison de Nathy, livrés à Lyon et alentours. Moambe, pondu, makayabu… le goût du pays, chez vous.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chez ya Nathy",
  },
  openGraph: {
    title: "Chez ya Nathy",
    description:
      "La cuisine congolaise faite maison, livrée à Lyon et alentours.",
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#E2572B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
