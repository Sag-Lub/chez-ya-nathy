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
  title: "Chez ya Nathy | Cuisine congolaise et spécialités africaines",
  description:
    "Découvrez Chez ya Nathy, une cuisine congolaise et africaine faite maison. Commandez vos plats préférés en livraison ou en retrait.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chez ya Nathy",
  },
  openGraph: {
    title: "Chez ya Nathy | Cuisine congolaise et spécialités africaines",
    description:
      "Cuisine congolaise et spécialités africaines faites maison. Commandez en livraison ou en retrait, précommandez vos plats du week-end.",
    locale: "fr_FR",
    type: "website",
    siteName: "Chez ya Nathy",
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
