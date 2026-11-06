import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { indexable } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // L'exploration reste autorisée : c'est la balise noindex des pages qui
  // empêche l'indexation (un robots.txt bloquant empêcherait de la lire).
  return indexable
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${site.url}/sitemap.xml` }
    : { rules: { userAgent: "*", allow: "/" } };
}
