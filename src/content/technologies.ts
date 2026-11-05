/**
 * Technologies présentées dans la scène IV.
 *
 * ⚠ À COMPLÉTER PAR MARTIN. Seules figurent ici les technologies
 * effectivement utilisées pour construire ce site (voir package.json).
 * N'ajouter que des outils réellement maîtrisés ; aucun partenariat.
 */

export type Technology = {
  name: string;
  /** Ordre d'architecture associé : la fondation, la structure, l'ornement */
  order: "dorique" | "ionique" | "corinthien";
  role: string;
  /** true = utilisé dans ce projet ; false = à confirmer par Martin */
  confirmed: boolean;
};

export const orders = {
  dorique: { label: "Dorique", meaning: "La fondation", text: "Ce qui porte le site : langage, cadre, hébergement." },
  ionique: { label: "Ionique", meaning: "La structure", text: "Ce qui organise : composants, typage, données." },
  corinthien: { label: "Corinthien", meaning: "L'ornement", text: "Ce qui anime : mouvement, défilement, lumière." },
} as const;

export const technologies: Technology[] = [
  { name: "Next.js", order: "dorique", role: "Cadre de développement et rendu des pages", confirmed: true },
  { name: "Vercel", order: "dorique", role: "Hébergement et prévisualisations", confirmed: false },
  { name: "React", order: "ionique", role: "Composants d'interface", confirmed: true },
  { name: "TypeScript", order: "ionique", role: "Typage et fiabilité du code", confirmed: true },
  { name: "GSAP", order: "corinthien", role: "Animations liées au défilement", confirmed: true },
  { name: "Lenis", order: "corinthien", role: "Défilement fluide", confirmed: true },
];
