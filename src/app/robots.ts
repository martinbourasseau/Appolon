import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { indexable } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return indexable
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${site.url}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
