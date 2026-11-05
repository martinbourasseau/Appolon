# Apollon — création de sites web

Site du Groupe Bourasseau consacré à la conception et au développement de sites web.
Next.js 16 · React 19 · TypeScript · GSAP ScrollTrigger · Lenis.

```bash
npm install
npm run dev        # http://localhost:3003
npm run typecheck && npm run lint && npm run build
```

## État : structure provisoire

Tout ce qui est marqué **Provisoire** à l'écran (bandeau, cadres hachurés, pastilles)
attend une ressource définitive. Pour les retrouver dans le code : rechercher `Provisoire`.

| Où | Ressource attendue |
|---|---|
| Scène I | Paysage HD en 3 couches, statue d'Apollon HD détourée, calques du bras |
| Ouvertures II à VII | Une image plein écran 2560 × 1440 par scène (`content/scenes.ts → opener.src`) |
| Scène II | Maquettes d'interface et planche d'identité d'un projet réel |
| Scène IV | Liste des technologies maîtrisées (`content/technologies.ts`) |
| Scène V | Réalisations réelles (`content/realisations.ts`) |
| Scène VII / mentions | Coordonnées et informations légales (`content/site.ts`) |

Les images de `public/provisoire/` sont des versions de travail (détourage automatique,
basse définition) ; la statue vient du site du groupe.

## Structure

```
src/
  app/            page, layout (SEO, JSON-LD), robots, sitemap, mentions légales
  content/        site, scenes (7 scènes, textes provisoires), technologies, realisations
  components/
    layout/       Header, Sommaire (frise → rail → pastille mobile), Footer, SmoothScroll
    scene-kit/    ChapterOpener (arche + grand titre), Editorial (lettrine, folios),
                  CanonLines (tracés au nombre d'or), Provisoire
    scenes/       SceneApparition … SceneContact
    Motion.tsx    toutes les animations au défilement (attributs data-*)
```

## Mouvement

- Mise en scène fixe par `position: sticky` ; ScrollTrigger fournit la progression.
- Propriétés animées : transform, opacity, clip-path uniquement.
- `prefers-reduced-motion` : rien n'est animé, tout est visible.
- Appareils modestes : amplitudes réduites de moitié. Forçage : `?motion=full|lite|reduced`.
- Bras d'Apollon : ancre prévue (`data-hero-arm`), aucun mouvement simulé sans calques.

Aucune mise en production sans validation de Martin.
