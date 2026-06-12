import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "回声 Echo",
    short_name: "回声",
    description: "年轻职场人的本地第三空间",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e7",
    theme_color: "#f4f0e7",
    icons: [
      {
        src: "/echo-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
