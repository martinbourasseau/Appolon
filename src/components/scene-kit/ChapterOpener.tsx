import Image from "next/image";
import type { Scene } from "@/content/scenes";
import { Provisoire } from "./Provisoire";
import { CanonLines } from "./CanonLines";
import { SceneLayer } from "./SceneLayer";
import { StarField } from "./StarField";

/**
 * Ouverture monumentale d'une scène — un collage en profondeur.
 *
 * Le bloc fait ~2,3 écrans de haut ; la « scène » intérieure reste fixée
 * pendant que le défilement :
 *   1. ouvre le tableau par un masque en arche (data-arch),
 *   2. fait remonter et resserrer le tableau (data-opener-img),
 *   3. décale chaque plan découpé selon sa profondeur (data-layer-depth),
 *   4. élève le grand titre lettre par lettre (data-title).
 * Les plans « front » passent devant le titre et débordent du cadre,
 * comme les figures découpées de la référence Shopify.
 * Animations : components/Motion.tsx ; boucles continues : CSS (.anim-*).
 */
export function ChapterOpener({ scene }: { scene: Scene }) {
  const dark = scene.tone === "nuit";
  const op = scene.opener;
  const back = op?.layers?.filter((l) => !l.front) ?? [];
  const front = op?.layers?.filter((l) => l.front) ?? [];
  return (
    <div
      className={`opener opener--${scene.tone} opener--${op?.reveal ?? "arch"}`}
      data-opener
      data-reveal-kind={op?.reveal ?? "arch"}
      data-pan={op?.pan ? op.pan.join(",") : undefined}
      data-cam={op?.camera ? JSON.stringify(op.camera) : undefined}
    >
      <div className="opener__stage">
        <div className="opener__arch" data-arch>
          {/* attente réelle : visible tant que le tableau n'est pas décodé (l'image le recouvre) */}
          <div className="opener__loading" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="44" height="44">
              <circle cx="24" cy="24" r="6" />
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={i} x1="24" y1="5" x2="24" y2="12" transform={`rotate(${i * 30} 24 24)`} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </svg>
          </div>
          <div className="opener__img" data-opener-img>
            {op?.src ? (
              <Image
                src={op.src}
                alt={op.alt}
                fill
                sizes="(max-width: 768px) 1600px, 100vw"
                quality={80}
                // le tableau II prend le relais du feu : il doit être prêt avant
                loading={scene.id === "concevoir" ? "eager" : "lazy"}
                style={{ objectPosition: op.position ?? "50% 50%" }}
                className={dark ? "opener__painting opener__painting--nuit" : "opener__painting"}
              />
            ) : (
              <Provisoire
                label={`Image d'ouverture — scène ${scene.numeral}`}
                expected={op?.expected ?? "Image plein écran 2560 × 1440"}
                tone={dark ? "sombre" : "clair"}
              />
            )}
          </div>
          {back.map((l, i) => (
            <SceneLayer key={i} layer={l} inOpener />
          ))}
          {dark ? <StarField className="opener__stars" /> : null}
          {op?.reveal === "shutters" ? (
            <div className="opener__shutters" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="opener__shutter" data-shutter />
              ))}
            </div>
          ) : null}
          <div className="opener__light" data-opener-light aria-hidden="true" />
          <div className="opener__veil" aria-hidden="true" />
          <CanonLines className="opener__canon" />
        </div>
        <p className="opener__kicker" data-reveal>
          <span className="numeral">{scene.numeral}</span>
          <span>{scene.kicker}</span>
        </p>
        <h2 className="opener__title" data-title aria-label={scene.title} style={{ ["--len" as string]: Array.from(scene.title).length }}>
          {Array.from(scene.title).map((ch, i) => (
            <span key={i} className="ch" aria-hidden="true">
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h2>
        {/* Le chapeau s'élève sur le tableau quand le titre est monté (comme un éditorial) */}
        {scene.lead && scene.id !== "contact" ? (
          <p className="opener__lead" data-opener-lead>
            <span className="lead__drop" aria-hidden="true">
              {scene.lead.charAt(0)}
            </span>
            <span className="sr-only">{scene.lead.charAt(0)}</span>
            {scene.lead.slice(1)}
          </p>
        ) : null}
        {front.map((l, i) => (
          <SceneLayer key={i} layer={l} inOpener sizes="50vw" />
        ))}
        {op?.credit ? <p className="opener__credit">{op.credit}</p> : null}
        {/* ombre portée par la page qui monte sur le tableau (transition de sortie) */}
        <div className="opener__shade" data-opener-shade aria-hidden="true" />
      </div>
    </div>
  );
}
