/**
 * Environnements : local, preview, production.
 *
 * Sur Vercel, les variables système VERCEL_ENV, VERCEL_URL et
 * VERCEL_PROJECT_PRODUCTION_URL sont fournies automatiquement au build ;
 * aucune variable n'est à créer à la main.
 *
 *  - NEXT_PUBLIC_SITE_URL (facultative) force l'adresse publique, par
 *    exemple quand un domaine personnalisé sera branché.
 *  - Production Vercel  → domaine de production du projet.
 *  - Preview Vercel     → adresse unique du déploiement, non indexée.
 *  - Local              → http://localhost:3003.
 *
 * À n'utiliser que côté serveur (métadonnées, sitemap, robots, JSON-LD).
 */

export type DeployEnv = "production" | "preview" | "development";

export const deployEnv: DeployEnv =
  process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : "development";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (deployEnv === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3003";
}

export const siteUrl = resolveSiteUrl();

/** Seule la production est indexable par les moteurs de recherche */
export const indexable = deployEnv === "production";
