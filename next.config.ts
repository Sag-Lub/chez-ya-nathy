import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF puis WebP : les photos de plats d'origine pèsent plusieurs Mo,
    // next/image les sert à la bonne taille pour le téléphone.
    formats: ["image/avif", "image/webp"],
    // Les photos sont affichées en petit (rondes, de 48 à 264 px) : des paliers serrés
    // évitent d'envoyer un fichier deux fois trop grand à un téléphone.
    imageSizes: [64, 96, 128, 192, 256, 320, 384, 480],
    deviceSizes: [640, 828, 1200],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pxnqthmudmwybvuoizxh.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
