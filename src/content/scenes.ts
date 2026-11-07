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

/**
 * Un plan de la composition : image découpée posée devant (ou derrière)
 * le tableau, à la manière d'un collage en profondeur.
 *  - depth : parallaxe au défilement (positif = recule, négatif = avance)
 *  - anim  : petite animation continue (flotter, se balancer, dériver…)
 */
export type Layer = {
  src: string;
  w: number;
  h: number;
  /** position et taille (CSS) dans la scène */
  style: Record<string, string | number>;
  depth?: number;
  anim?: "float" | "sway" | "drift" | "drift-rev" | "breathe" | "spin-slow";
  blend?: "screen" | "multiply" | "soft-light";
  opacity?: number;
  /** bords fondus (pour une image rectangulaire) */
  feather?: boolean;
  /** recouvre toute la scène */
  cover?: boolean;
  flip?: boolean;
  /** retourné à 180° (place les bords droits d'un découpage hors champ) */
  turn?: boolean;
  /** fondu d'un bord droit de découpage */
  fade?: "bottom" | "top";
  silhouette?: boolean;
  /** masqué sur petits écrans */
  desktopOnly?: boolean;
  /** devant le titre (sinon derrière) */
  front?: boolean;
  /**
   * Bords où le découpage source est droit (sujet coupé dans le fichier) :
   * ils sont fondus pour que l'élément paraisse entier, jamais tranché.
   * Repère de l'image d'origine (avant miroir / retournement).
   */
  edges?: ("top" | "bottom" | "left" | "right")[];
  /** Position et taille sur petit écran (≤ 768 px), dans le même repère */
  m?: { left?: string; right?: string; top?: string; bottom?: string; width?: string; height?: string };
};

export type Visual = {
  /** Fichier définitif dans /public. null = emplacement provisoire. */
  src: string | null;
  alt: string;
  /** Description de la ressource attendue, affichée dans l'emplacement */
  expected: string;
  width?: number;
  height?: number;
  /** cadrage (object-position) */
  position?: string;
  /**
   * Révélation propre à la scène (transition d'entrée) :
   * arch = arche · iris = lunette astronomique · shutters = volets de marbre
   * torn = papier déchiré · golden = rectangle d'or · sun = disque solaire
   */
  reveal?: "arch" | "iris" | "shutters" | "torn" | "golden" | "sun";
  /**
   * Petit écran : travelling horizontal (object-position x, en %) pour montrer
   * toute la largeur du tableau au fil du défilement au lieu d'en couper une partie.
   */
  pan?: [number, number];
  /** Mouvement de caméra (ordinateur) : départ → arrivée */
  camera?: { from: CamPose; to: CamPose };
  /** crédit de l'œuvre */
  credit?: string;
  layers?: Layer[];
};

export type CamPose = { scale: number; x?: number; y?: number; rotate?: number };

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
  /** Éléments animés posés sur les côtés du contenu */
  decor?: Layer[];
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
      src: "/scenes/concevoir/corot-san-bartolomeo.webp",
      width: 2560,
      height: 1592,
      position: "50% 62%",
      reveal: "arch", pan: [12, 78], camera: { from: { scale: 1 }, to: { scale: 1.1, y: -3 } },
      alt: "Rome, l'île Tibérine et ses ponts sous un ciel de plein jour, peinture de Corot",
      expected: "",
      credit: "Camille Corot, L'île et le pont San Bartolomeo, Rome, 1825-28 — domaine public",
      layers: [
        { src: "/scenes/concevoir/nuages-dores.webp", w: 735, h: 245, style: { left: "5vw", top: "3svh", width: "46vw" }, m: { left: "5vw", top: "10svh", width: "80vw" }, depth: 0.3, anim: "drift", feather: true, blend: "screen", opacity: 0.85 },
        { src: "/provisoire/nuage-peint.webp", w: 640, h: 344, style: { right: "3vw", top: "17svh", width: "22vw" }, m: { right: "4vw", top: "24svh", width: "38vw" }, depth: 0.2, anim: "drift-rev" },
        { src: "/provisoire/lys.webp", w: 736, h: 825, edges: ["right", "bottom"], style: { left: "2.5vw", bottom: "5svh", width: "14vw" }, m: { left: "4vw", bottom: "19svh", width: "30vw" }, depth: -0.25, anim: "sway", front: true },
        { src: "/provisoire/nuage-grave.webp", w: 579, h: 251, style: { right: "2.5vw", bottom: "6svh", width: "17vw" }, m: { right: "4vw", bottom: "21svh", width: "34vw" }, depth: -0.15, anim: "drift", front: true },
      ],
    },
    decor: [
      { src: "/provisoire/nuage-grave.webp", w: 579, h: 251, desktopOnly: true, style: { right: "2vw", top: "38%", width: "15vw" }, depth: 0.2, anim: "drift" },
    ],
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
      src: "/scenes/ingenierie/nuit-aquarelle-constellations.webp",
      width: 736,
      height: 1308,
      position: "50% 40%",
      reveal: "iris", camera: { from: { scale: 1.45, rotate: -5 }, to: { scale: 1.04, rotate: 0 } },
      alt: "Ciel nocturne à l'aquarelle, constellations et étoiles",
      expected: "",
      credit: "Aquarelle nocturne aux constellations — fournie par Martin",
      layers: [
        { src: "/scenes/ingenierie/nuit-ciel-nebuleuse.webp", w: 638, h: 1134, style: {}, cover: true, blend: "screen", opacity: 0.55, anim: "breathe", depth: 0.2 },
        { src: "/scenes/ingenierie/nuit-nuage-etoile.webp", w: 734, h: 734, edges: ["bottom", "left"], style: { right: "3vw", top: "9svh", width: "24vw" }, m: { right: "3vw", top: "26svh", width: "42vw" }, turn: true, depth: 0.35, anim: "drift-rev" },
        { src: "/scenes/ingenierie/nuit-nuage-etoile.webp", w: 734, h: 734, edges: ["bottom", "left"], style: { left: "2.5vw", bottom: "5svh", width: "19vw" }, m: { left: "3vw", bottom: "19svh", width: "36vw" }, depth: -0.3, anim: "float", front: true },
      ],
    },
    decor: [
      { src: "/scenes/ingenierie/nuit-nuage-etoile.webp", w: 734, h: 734, edges: ["bottom", "left"], desktopOnly: true, style: { left: "1.5vw", top: "30%", width: "17vw" }, depth: 0.25, anim: "float", opacity: 0.8, fade: "bottom" },
      { src: "/scenes/ingenierie/nuit-nuage-etoile.webp", w: 734, h: 734, edges: ["bottom", "left"], desktopOnly: true, style: { right: "1.5vw", top: "64%", width: "17vw" }, flip: true, depth: -0.2, anim: "drift-rev", opacity: 0.7, fade: "bottom" },
    ],
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
      src: "/scenes/outils/valenciennes-villa-farnese.webp",
      width: 2560,
      height: 1620,
      position: "50% 58%",
      reveal: "shutters", pan: [18, 76], camera: { from: { scale: 1.16, x: -4 }, to: { scale: 1, x: 2 } },
      alt: "Ruines de la villa Farnèse sous un ciel clair, étude de Valenciennes",
      expected: "",
      credit: "Pierre-Henri de Valenciennes, À la villa Farnèse, les ruines, v. 1780 — Louvre, domaine public",
      layers: [
        { src: "/provisoire/nuage-peint.webp", w: 640, h: 344, style: { left: "34vw", top: "5svh", width: "26vw" }, m: { left: "20vw", top: "22svh", width: "56vw" }, depth: 0.3, anim: "drift" },
        { src: "/scenes/outils/colonnade.webp", w: 668, h: 1192, edges: ["top", "left"], style: { left: "2.5vw", bottom: "4svh", height: "56svh" }, m: { left: "4vw", bottom: "19svh", height: "30svh" }, depth: -0.3, front: true },
        { src: "/scenes/outils/rideau-colonne.webp", w: 249, h: 887, style: { right: "2.5vw", bottom: "4svh", height: "70svh" }, depth: -0.2, anim: "sway", front: true, desktopOnly: true },
      ],
    },
    decor: [
      { src: "/provisoire/lys.webp", w: 736, h: 825, edges: ["right", "bottom"], style: { right: "2vw", bottom: "6%", width: "13vw" }, depth: -0.15, anim: "sway", desktopOnly: true },
    ],
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
      src: "/scenes/realisations/eckersberg-arches-colisee.webp",
      width: 2560,
      height: 1659,
      position: "50% 50%",
      reveal: "torn", pan: [32, 68], camera: { from: { scale: 2.1, y: 4 }, to: { scale: 1, y: 0 } },
      alt: "Vue sur Rome à travers trois arches du Colisée, peinture d'Eckersberg",
      expected: "",
      credit: "C. W. Eckersberg, Vue à travers trois arches du Colisée, 1815 — domaine public",
      layers: [
        { src: "/provisoire/nuage-grave.webp", w: 579, h: 251, style: { left: "3vw", top: "10svh", width: "22vw" }, m: { left: "4vw", top: "22svh", width: "44vw" }, depth: 0.25, anim: "drift" },
        { src: "/scenes/realisations/globe.webp", w: 560, h: 854, edges: ["bottom"], style: { right: "3vw", bottom: "5svh", height: "34svh" }, m: { right: "5vw", bottom: "19svh", height: "21svh" }, depth: -0.3, anim: "float", front: true },
      ],
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
      src: "/scenes/sur-mesure/corot-civita-castellana.webp",
      width: 2560,
      height: 1841,
      position: "50% 45%",
      reveal: "golden", pan: [12, 70], camera: { from: { scale: 1.2, x: 3, rotate: 2 }, to: { scale: 1, x: -2, rotate: 0 } },
      alt: "Rochers dominant une vallée boisée à Civita Castellana, étude de Corot",
      expected: "",
      credit: "Camille Corot, Civita Castellana, rochers dominant la vallée boisée, 1826-27 — domaine public",
      layers: [
        { src: "/provisoire/nuage-peint.webp", w: 640, h: 344, style: { right: "8vw", top: "6svh", width: "22vw" }, m: { right: "5vw", top: "22svh", width: "46vw" }, depth: 0.3, anim: "drift-rev" },
        { src: "/scenes/sur-mesure/ruines-arche.webp", w: 498, h: 797, edges: ["bottom", "left", "right"], style: { right: "2.5vw", bottom: "4svh", height: "46svh" }, m: { right: "4vw", bottom: "19svh", height: "26svh" }, depth: -0.3, anim: "breathe", front: true },
        { src: "/provisoire/lys.webp", w: 736, h: 825, edges: ["right", "bottom"], style: { left: "2.5vw", bottom: "5svh", width: "13vw" }, depth: -0.2, anim: "sway", front: true, desktopOnly: true },
      ],
    },
    decor: [
      { src: "/provisoire/nuage-peint.webp", w: 640, h: 344, desktopOnly: true, style: { left: "2vw", top: "12%", width: "15vw" }, depth: 0.2, anim: "drift" },
    ],
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
      src: "/scenes/contact/kuindzhi-coucher-rouge.webp",
      width: 2560,
      height: 1857,
      position: "50% 50%",
      reveal: "sun", pan: [40, 60], camera: { from: { scale: 1.12, y: -6 }, to: { scale: 1.02, y: 2 } },
      alt: "Coucher de soleil rouge sur le Dniepr, peinture de Kuindzhi",
      expected: "",
      credit: "Arkhip Kuindzhi, Coucher de soleil rouge sur le Dniepr, 1905-08 — Metropolitan Museum, domaine public",
      layers: [
        { src: "/provisoire/apollon-statue.webp", w: 678, h: 1350, style: { left: "50%", bottom: "2svh", height: "68%", translate: "-50% 0" }, m: { bottom: "2svh", height: "60%" }, silhouette: true, depth: 0.1 },
        { src: "/scenes/contact/pivoines.webp", w: 631, h: 928, edges: ["right", "bottom"], style: { left: "2.5vw", bottom: "5svh", height: "33svh" }, m: { left: "4vw", bottom: "20svh", height: "21svh" }, depth: -0.3, anim: "sway", front: true },
        { src: "/provisoire/lyre.webp", w: 442, h: 602, edges: ["bottom"], style: { right: "4vw", bottom: "30svh", height: "24svh" }, depth: -0.2, anim: "float", front: true, desktopOnly: true },
      ],
    },
    tone: "aube",
  },
];
