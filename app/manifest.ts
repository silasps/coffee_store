import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-Coffee",
    short_name: "E-Coffee",
    description: "Cardápio digital para cafeterias",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8F0",
    theme_color: "#3A1A00",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/svg+xml",
      },
    ],
  };
}
