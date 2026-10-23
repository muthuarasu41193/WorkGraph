import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WorkGraph",
    short_name: "WorkGraph",
    description: "Search the live job index.",
    start_url: "/",
    display: "standalone",
    background_color: "white",
    theme_color: "white",
    icons: [
      {
        src: "/brand/workgraph-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/workgraph-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  }
}
