import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nathy Food",
    short_name: "Nathy Food",
    description: "Commandez les plats cuisinés maison de Nathy",
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
