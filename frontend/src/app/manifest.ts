import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Career OS",
    short_name: "Career OS",
    description: "The modern operating system for careers and recruitment.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8E7C9",
    theme_color: "#064E3B",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

