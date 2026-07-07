import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account"],
    },
    sitemap: "https://www.vform-nutrition.com/sitemap.xml",
  };
}
