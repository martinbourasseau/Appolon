/**
 * Réalisations — uniquement des projets réels, ajoutés sur indication
 * de Martin. Tant que la liste est vide, la scène V affiche trois
 * emplacements provisoires.
 *
 * Image : /public/realisations/<slug>.webp, 2400 px de large conseillé.
 */
export type Realisation = {
  slug: string;
  title: string;
  category: string;
  year?: string;
  href?: string;
  image: { src: string; alt: string; width: number; height: number };
};

export const realisations: Realisation[] = [];
