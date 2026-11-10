import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF puis WebP : les photos de plats d'origine pèsent plusieurs Mo,
    // next/image les sert à la bonne taille pour le téléphone.
    formats: ["image/avif", "image/webp"],
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
