import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { FIRST_VISIT_SCRIPT } from "@/components/onboarding/first-visit";

// Fraunces pour les titres : une seule graisse (900), formes arrondies (axe SOFT à 100),
// taille optique automatique. Le fichier est hébergé avec l'app : 30 Ko au lieu des
// 118 Ko de la police variable complète. Licence SIL Open Font License.
const fraunces = localFont({
  src: "./fonts/fraunces-black-soft.woff2",
  variable: "--font-display",
  weight: "900",
  style: "normal",
  display: "swap",
  fallback: ["ui-serif", "Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

// Inter pour le texte et l'interface.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const TITLE = "Chez ya Nathy — Cuisine congolaise livrée à Lyon et alentours";
const DESCRIPTION =
  "La cuisine congolaise de Nathy, faite maison. Commande en livraison ou à emporter, et précommande les plats mijotés du week-end.";

/** Tailles d'écran iPhone couvertes : [largeur, hauteur, densité]. Fichiers dans public/splash/. */
const APPLE_SPLASH: [number, number, number][] = [
  [440, 956, 3], [430, 932, 3], [402, 874, 3], [393, 852, 3], [428, 926, 3],
  [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2],
]

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: TITLE, template: "%s — Chez ya Nathy" },
  description: DESCRIPTION,
  applicationName: "Chez ya Nathy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chez ya Nathy",
    // Écran de lancement iOS de la PWA installée : fond liboke + logo, pour éviter le flash blanc
    startupImage: APPLE_SPLASH.map(([w, h, ratio]) => ({
      url: `/splash/apple-${w * ratio}x${h * ratio}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
    })),
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "fr_FR",
    type: "website",
    siteName: "Chez ya Nathy",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF3E8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning : le script ci-dessous peut ajouter une classe à <html> avant React
    <html lang="fr" className={`${fraunces.variable} ${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: FIRST_VISIT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
