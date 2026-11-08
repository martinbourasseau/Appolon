import Image from "next/image";
import { ProvisoireTag } from "@/components/scene-kit/Provisoire";
import { IntroRays } from "@/components/intro/IntroRays";
import { BurnTransition } from "@/components/transition/BurnTransition";

/**
 * SCÈNE I — L'apparition.
 *
 * Composition en plans, du fond vers l'avant :
 *   ciel/paysage → lumière → soleil → GRAND TITRE → statue d'Apollon → texte.
 * (Les nuages découpés ajoutés ont été retirés : composition plus minérale.)
 * Le titre passe derrière la statue : c'est elle qui « tient » l'écran.
 *
 * Défilement (Motion.tsx, data-hero-*) : la scène reste fixée ~2 écrans ;
 * le soleil monte et tourne, la lumière se réchauffe, les nuages dérivent
 * à des vitesses différentes, la caméra avance légèrement vers la statue.
 *
 * Bras : un point d'ancrage est prévu (data-hero-arm) mais aucun mouvement
 * n'est simulé tant que les calques séparés ne sont pas fournis.
 *
 * ⚠ Toutes les images de cette scène sont PROVISOIRES.
 */
export function SceneApparition() {
  return (
    <section id="apparition" className="scene scene--apparition" data-scene data-hero aria-labelledby="hero-title">
      <div className="hero__stage">
        {/* Ouverture (MosaicIntro) : lit de pose sombre avant l'arrivée des pierres */}
        <div className="intro-veil" aria-hidden="true" />
        <div className="hero__sky" data-hero-sky>
          <Image
            src="/provisoire/paysage.webp"
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="hero__sky-img"
          />
        </div>
        <div className="hero__light" data-hero-light aria-hidden="true" />

        <Image src="/provisoire/soleil.webp" alt="" width={630} height={723} className="hero__sun" data-hero-sun loading="eager" />

        <h1 id="hero-title" className="hero__title" data-hero-title>
          <span className="hero__kicker">Création de sites web</span>
          <span className="hero__word" aria-label="Apollon">
            {Array.from("APOLLON").map((ch, i) => (
              <span key={i} className="ch" aria-hidden="true">
                {ch}
              </span>
            ))}
          </span>
        </h1>

        <div className="hero__statue" data-hero-statue>
          <Image
            src="/provisoire/apollon-statue.webp"
            alt="Statue d'Apollon couronné de laurier, appuyé sur sa lyre"
            width={678}
            height={1350}
            sizes="(max-width: 768px) 70vw, 34vw"
            loading="eager"
            className="hero__statue-img"
          />
          {/* Point d'ancrage du bras : épaule gauche de la statue (à droite à l'écran) */}
          <span className="hero__arm-anchor" data-hero-arm aria-hidden="true" />
        </div>


        <IntroRays />

        {/* Sortie par la lumière : le soleil envahit l'écran, l'arche de la scène II s'ouvre dans ce blanc */}
        <div className="hero__flare" data-hero-flare aria-hidden="true" />

        <div className="hero__copy" data-hero-copy>
          <p className="hero__line">
            La création web, comme <em>un art</em> et comme <em>une ingénierie</em>.
          </p>
        </div>

        <p className="hero__cue" aria-hidden="true">
          <span>Défiler</span>
        </p>

        <div className="hero__notes">
          <ProvisoireTag note="Paysage : 736 px, signé, droits à vérifier — remplacer par un paysage HD en 3 couches" />
          <ProvisoireTag note="Statue : version du site du groupe, basse définition — bras non animé" />
          <ProvisoireTag note="Soleil : détourage automatique sur fond blanc" />
        </div>
      </div>
      {/* Passage I → II : la scène se consume, la caméra entre dans le tableau suivant */}
      <BurnTransition />
    </section>
  );
}
