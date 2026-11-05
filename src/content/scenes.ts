/**
 * Les sept scènes du récit Apollon.
 *
 * Chaque scène suit le même rythme éditorial :
 *   1. une ouverture monumentale (image plein écran + grand titre),
 *   2. une phrase d'introduction à lettrine,
 *   3. des « folios » : de courts blocs titre + une ou deux phrases.
 *
 * ⚠ TEXTES PROVISOIRES — à relire et valider avant mise en ligne.
 * `visual` décrit l'image attendue : tant que `src` est null, un
 * emplacement « Provisoire » est affiché à sa place.
 */

export type Visual = {
  /** Fichier définitif dans /public. null = emplacement provisoire. */
  src: string | null;
  alt: string;
  /** Description de la ressource attendue, affichée dans l'emplacement */
  expected: string;
};

export type Folio = { title: string; text: string };

export type Scene = {
  id: string;
  numeral: string;
  /** Libellé du sommaire */
  nav: string;
  /** Titre monumental de l'ouverture */
  title: string;
  /** Surtitre de l'ouverture */
  kicker: string;
  /** Phrase d'introduction (la première lettre devient lettrine) */
  lead?: string;
  folios?: Folio[];
  opener?: Visual;
  /** Ambiance de la scène : jour (marbre clair) ou nuit (bleu profond) */
  tone: "jour" | "nuit" | "aube";
};

export const scenes: Scene[] = [
  {
    id: "apparition",
    numeral: "I",
    nav: "L'apparition",
    title: "Apollon",
    kicker: "Création de sites web",
    tone: "aube",
  },
  {
    id: "concevoir",
    numeral: "II",
    nav: "L'art de concevoir",
    title: "Concevoir",
    kicker: "Direction artistique · Design d'interface",
    lead: "Avant la première ligne de code, il y a un regard : ce que le site doit faire ressentir, et dans quel ordre.",
    folios: [
      { title: "Direction artistique", text: "Un univers propre, des images, des matières et une typographie choisis pour ce que vous avez à dire." },
      { title: "Design d'interface", text: "Des écrans composés comme des pages : hiérarchie, rythme, respiration." },
      { title: "Expérience utilisateur", text: "Un parcours clair, du premier regard jusqu'à la prise de contact." },
      { title: "Identité visuelle", text: "Couleurs, formes et usages réunis en un système cohérent, prêt à durer." },
    ],
    opener: {
      src: null,
      alt: "",
      expected: "Image plein écran 2560 × 1440 : composition « atelier » — esquisses, maquettes d'interface, marbre et lumière du jour.",
    },
    tone: "jour",
  },
  {
    id: "ingenierie",
    numeral: "III",
    nav: "L'ingénierie",
    title: "Ingénierie",
    kicker: "Développement · Architecture · Performance",
    lead: "La beauté d'un site tient aussi à ce qu'on ne voit pas : sa structure, sa vitesse, sa solidité.",
    folios: [
      { title: "Interface", text: "Des composants précis, accessibles, qui se comportent de la même façon sur chaque écran." },
      { title: "Serveur", text: "Les données, les formulaires et les contenus, branchés proprement derrière la façade." },
      { title: "Architecture", text: "Un code organisé pour évoluer sans se fragiliser." },
      { title: "Performance et référencement", text: "Des pages légères, rapides à charger et lisibles par les moteurs de recherche." },
    ],
    opener: {
      src: null,
      alt: "",
      expected: "Image plein écran 2560 × 1440 : ciel nocturne ou temple de nuit, sur lequel apparaîtront des tracés de code et de structure.",
    },
    tone: "nuit",
  },
  {
    id: "outils",
    numeral: "IV",
    nav: "Les outils",
    title: "Les outils",
    kicker: "Technologies employées",
    lead: "Chaque ordre d'architecture a sa fonction. Les outils aussi.",
    opener: {
      src: null,
      alt: "",
      expected: "Image plein écran : les trois ordres (dorique, ionique, corinthien) en haute définition, sur fond transparent ou paysage.",
    },
    tone: "jour",
  },
  {
    id: "realisations",
    numeral: "V",
    nav: "Les réalisations",
    title: "Réalisations",
    kicker: "Sites conçus et développés",
    lead: "Des sites réels, présentés tels qu'ils sont en ligne.",
    opener: {
      src: null,
      alt: "",
      expected: "Image d'ouverture ou capture plein écran d'une réalisation choisie par Martin.",
    },
    tone: "aube",
  },
  {
    id: "sur-mesure",
    numeral: "VI",
    nav: "Le sur-mesure",
    title: "Sur mesure",
    kicker: "D'une idée à un site en ligne",
    lead: "Une idée devient un site en cinq temps, sans étape escamotée.",
    folios: [
      { title: "Écouter", text: "Comprendre votre activité, vos visiteurs et ce que le site doit accomplir." },
      { title: "Esquisser", text: "Structure des pages, direction artistique, premières maquettes." },
      { title: "Concevoir", text: "Les écrans définitifs, validés ensemble avant le développement." },
      { title: "Développer", text: "Le site construit, testé sur ordinateur et sur mobile." },
      { title: "Mettre en ligne", text: "Publication, référencement de base et prise en main." },
    ],
    opener: {
      src: null,
      alt: "",
      expected: "Image plein écran : la lyre ou les mains d'un sculpteur — l'idée qui prend forme.",
    },
    tone: "jour",
  },
  {
    id: "contact",
    numeral: "VII",
    nav: "Le contact",
    title: "Parlons-en",
    kicker: "Un projet de site web",
    lead: "Décrivez-nous votre projet : nous revenons vers vous pour en parler.",
    opener: {
      src: null,
      alt: "",
      expected: "Image finale plein écran : coucher de soleil sur le paysage du hero, Apollon de dos ou en silhouette.",
    },
    tone: "aube",
  },
];
