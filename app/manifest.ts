import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chez ya Nathy",
    short_name: "Chez ya Nathy",
    description: "La cuisine congolaise de Nathy, livrée à Lyon et alentours",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fr",
    // Écran de lancement de la PWA installée : même fond liboke que l'écran de bienvenue.
    background_color: "#E2572B",
    theme_color: "#E2572B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/lancement-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/lancement-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
