/**
 * REGISTRE DES IMAGES D'APOLLON
 *
 * Chaque image du site est déclarée ici : sa scène de destination, son rôle
 * dans la composition, sa palette, son statut et son origine.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ RÈGLE NON NÉGOCIABLE : une image de palette « nuit » (tableaux     │
 * │ nocturnes, ciels étoilés) ne peut être affectée qu'à la scène III  │
 * │ « L'ingénierie » — la zone bleue. Toute autre affectation est      │
 * │ refusée par TypeScript (npm run typecheck) et au chargement.       │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Chaîne de préparation :
 *   assets/source/<lot>/      originaux reçus, jamais modifiés
 *   assets/scripts/prepare.py détourage, nettoyage, conversion WebP
 *   assets/prepared/          versions préparées, en attente de placement
 *   public/scenes/<scène>/    versions intégrées au site
 */

export type SceneId = "apparition" | "concevoir" | "ingenierie" | "outils" | "realisations" | "sur-mesure" | "contact";

/** La zone bleue nocturne */
export const BLUE_ZONE = "ingenierie" as const satisfies SceneId;

export type Role =
  | "ouverture" // image plein écran de l'ouverture de chapitre
  | "fond" // plan le plus éloigné
  | "plan-moyen"
  | "premier-plan"
  | "ornement"
  | "transition" // passage entre deux scènes
  | "illustration";

export type Status =
  | "provisoire" // affichée, à remplacer (signalée à l'écran)
  | "a-valider" // préparée, destination proposée, pas encore affichée
  | "definitif";

type Base = {
  id: string;
  /** chemin dans /public (affichée) ou dans /assets/prepared (en attente) */
  file: string;
  width: number;
  height: number;
  role: Role;
  status: Status;
  /** texte alternatif ; "" pour une image purement décorative */
  alt: string;
  /** œuvre, auteur, origine connue */
  source: string;
  /** droits d'utilisation : à confirmer tant que ce n'est pas vérifié */
  rights: "domaine-public" | "fourni-par-martin" | "a-verifier";
  /** remarques de qualité, préparation, limites */
  notes?: string;
};

/** Une image nocturne ne peut viser que la zone bleue (vérifié à la compilation). */
export type Asset =
  | (Base & { palette: "nuit"; scene: typeof BLUE_ZONE })
  | (Base & { palette: "jour" | "aube" | "neutre"; scene: Exclude<SceneId, never> });

export const assets: Asset[] = [
  /* ── Scène I — en place, provisoires ─────────────────────────── */
  { id: "paysage-hero", file: "/provisoire/paysage.webp", width: 736, height: 510, scene: "apparition", role: "fond", palette: "aube", status: "provisoire", alt: "", source: "Paysage peint, signé (auteur à identifier)", rights: "a-verifier", notes: "Trop petit pour le zoom d'ouverture : 3840 px de large nécessaires." },
  { id: "statue-apollon", file: "/provisoire/apollon-statue.webp", width: 678, height: 1350, scene: "apparition", role: "premier-plan", palette: "aube", status: "provisoire", alt: "Statue d'Apollon couronné de laurier, appuyé sur sa lyre", source: "Site du Groupe Bourasseau", rights: "fourni-par-martin", notes: "Image aplatie : aucun mouvement de bras possible sans calques séparés." },
  { id: "soleil", file: "/provisoire/soleil.webp", width: 630, height: 723, scene: "apparition", role: "plan-moyen", palette: "aube", status: "provisoire", alt: "", source: "Lot du 05/11", rights: "a-verifier" },
  { id: "nuage-peint", file: "/provisoire/nuage-peint.webp", width: 640, height: 344, scene: "apparition", role: "plan-moyen", palette: "aube", status: "provisoire", alt: "", source: "Lot du 05/11", rights: "a-verifier" },
  { id: "nuage-grave", file: "/provisoire/nuage-grave.webp", width: 579, height: 251, scene: "apparition", role: "premier-plan", palette: "aube", status: "provisoire", alt: "", source: "Lot du 05/11", rights: "a-verifier" },

  /* ── Lot du 06/11 — préparées, destinations proposées ─────────── */
  { id: "nuit-aquarelle-constellations", file: "/assets/prepared/nuit-aquarelle-constellations.webp", width: 736, height: 1308, scene: "ingenierie", role: "fond", palette: "nuit", status: "a-valider", alt: "", source: "Aquarelle bleue aux constellations dorées (auteur à identifier)", rights: "a-verifier", notes: "Portrait : idéal en mobile ; à agrandir ×3,5 en ordinateur." },
  { id: "nuit-ciel-nebuleuse", file: "/assets/prepared/nuit-ciel-nebuleuse.webp", width: 638, height: 1134, scene: "ingenierie", role: "plan-moyen", palette: "nuit", status: "a-valider", alt: "", source: "Ciel étoilé et nébuleuse (auteur à identifier)", rights: "a-verifier" },
  { id: "nuit-nuage-etoile", file: "/assets/prepared/nuit-nuage-etoile.webp", width: 734, height: 734, scene: "ingenierie", role: "premier-plan", palette: "nuit", status: "a-valider", alt: "", source: "Nuage étoilé à l'aquarelle (auteur à identifier)", rights: "a-verifier", notes: "Détouré automatiquement." },
  { id: "arion-dauphin", file: "/assets/prepared/arion-dauphin.webp", width: 671, height: 431, scene: "concevoir", role: "ouverture", palette: "jour", status: "a-valider", alt: "Arion, la lyre à la main, porté par un dauphin sur une mer agitée", source: "François Boucher, Arion sur le dauphin, 1748 — Princeton University Art Museum", rights: "domaine-public", notes: "Sujet : Arion, et non Apollon. Version HD disponible auprès du musée." },
  { id: "arion-detail-lyre", file: "/assets/prepared/arion-detail-lyre.webp", width: 355, height: 530, scene: "concevoir", role: "ouverture", palette: "jour", status: "a-valider", alt: "Arion levant les yeux, la lyre à la main", source: "François Boucher, Arion sur le dauphin (détail)", rights: "domaine-public", notes: "Recadrage portrait pour mobile." },
  { id: "panini-capriccio", file: "/assets/prepared/panini-capriccio.webp", width: 736, height: 537, scene: "outils", role: "ouverture", palette: "jour", status: "a-valider", alt: "Capriccio de ruines romaines : Colisée, colonne Trajane, arc de Constantin, temple de Castor et Pollux", source: "Giovanni Paolo Panini, Capriccio romain (XVIIIe s.)", rights: "domaine-public" },
  { id: "colonnade", file: "/assets/prepared/colonnade.webp", width: 668, height: 1192, scene: "outils", role: "premier-plan", palette: "neutre", status: "a-valider", alt: "", source: "Dessin au lavis d'une colonnade corinthienne (auteur à identifier)", rights: "a-verifier", notes: "Détouré ; liseré blanc d'origine rogné." },
  { id: "ruines-arche", file: "/assets/prepared/ruines-arche.webp", width: 498, height: 797, scene: "sur-mesure", role: "plan-moyen", palette: "neutre", status: "a-valider", alt: "", source: "Dessin de ruines à l'arche (auteur à identifier)", rights: "a-verifier", notes: "Détouré ; ouverture de l'arche rendue transparente." },
  { id: "nuages-dores", file: "/assets/prepared/nuages-dores.webp", width: 735, height: 245, scene: "concevoir", role: "transition", palette: "aube", status: "a-valider", alt: "", source: "Nuages dorés, peinture numérique (auteur à identifier)", rights: "a-verifier", notes: "Bandeau étroit : passage de la scène I à la scène II." },
  { id: "pivoines", file: "/assets/prepared/pivoines.webp", width: 631, height: 928, scene: "contact", role: "ornement", palette: "neutre", status: "a-valider", alt: "", source: "Pivoines peintes en empâtement (auteur à identifier)", rights: "a-verifier", notes: "Détourées ; léger halo sombre d'origine sur certains bords." },
  { id: "cherubin", file: "/assets/prepared/cherubin.webp", width: 651, height: 710, scene: "contact", role: "ornement", palette: "neutre", status: "a-valider", alt: "", source: "Chérubin au bouquet (auteur à identifier)", rights: "a-verifier", notes: "Détouré ; traces isolées supprimées." },
  { id: "lion", file: "/assets/prepared/lion.webp", width: 592, height: 811, scene: "realisations", role: "ornement", palette: "neutre", status: "a-valider", alt: "", source: "Chromolithographie de lion (auteur à identifier)", rights: "a-verifier", notes: "Damier de fausse transparence supprimé ; destination à confirmer par Martin." },
];

/* Contrôle au chargement (filet de sécurité en plus de TypeScript) */
for (const a of assets as { id: string; palette: string; scene: string }[]) {
  if (a.palette === "nuit" && a.scene !== BLUE_ZONE) {
    throw new Error(`Image nocturne « ${a.id} » hors de la zone bleue (${a.scene}).`);
  }
}

export const assetsFor = (scene: SceneId, opts: { includePending?: boolean } = {}) =>
  assets.filter((a) => a.scene === scene && (opts.includePending || a.status !== "a-valider"));
