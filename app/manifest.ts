import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chez ya Nathy",
    short_name: "Chez ya Nathy",
    description: "La cuisine congolaise faite maison, livrée à Lyon et alentours",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF3E8",
    theme_color: "#E2572B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
