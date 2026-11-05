/**
 * ─────────────────────────────────────────────────────────────
 *  CONFIGURATION CENTRALE — APOLLON
 *  Site du Groupe Bourasseau consacré à la création de sites web.
 * ─────────────────────────────────────────────────────────────
 *  Règle : rien n'est inventé. Un champ à `null` ou vide masque
 *  l'élément correspondant sur le site.
 */

import { siteUrl } from "@/lib/env";

export const site = {
  name: "Apollon",
  signature: "Apollon · Groupe Bourasseau",
  url: siteUrl,
  locale: "fr_FR",
  description:
    "Apollon conçoit et développe des sites web sur mesure : direction artistique, design d'interface, développement et mise en ligne. Une activité du Groupe Bourasseau, à Nantes.",

  /** Site parent (lien de retour) */
  parent: { name: "Le Groupe Bourasseau", href: "https://www.groupebourasseau.com" },

  location: "Nantes · Pays de la Loire · France" as string | null,

  /** Coordonnées : vides tant qu'elles ne sont pas confirmées. */
  contact: {
    email: null as string | null,
    bookingUrl: null as string | null,
    formEndpoint: null as string | null,
  },

  legal: {
    publisher: null as string | null,
    siret: null as string | null,
    address: null as string | null,
    host: null as string | null,
  },
} as const;
