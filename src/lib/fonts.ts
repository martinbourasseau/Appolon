import localFont from "next/font/local";

/*
 * Polices hébergées avec le site (fichiers Fontsource, sous-ensemble latin :
 * couvre le français, ligatures et ponctuation comprises). next/font les
 * précharge, les sert depuis le domaine du site et génère une police de
 * repli aux métriques ajustées : pas de saut de mise en page au chargement.
 * Seuls les styles réellement utilisés sont déclarés.
 */
export const serif = localFont({
  src: [
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-serif",
  display: "swap",
  // pas de préchargement : quatre fichiers qui concurrenceraient la statue sur
  // un réseau lent ; ils sont demandés dès la feuille de style analysée
  preload: false,
  fallback: ["Garamond", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const sans = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  adjustFontFallback: "Arial",
});
