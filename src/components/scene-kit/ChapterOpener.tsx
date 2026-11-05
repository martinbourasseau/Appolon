import Image from "next/image";
import type { Scene } from "@/content/scenes";
import { Provisoire } from "./Provisoire";
import { CanonLines } from "./CanonLines";

/**
 * Ouverture monumentale d'une scène.
 *
 * Le bloc fait ~2,2 écrans de haut ; la « scène » intérieure reste fixée
 * pendant que le défilement :
 *   1. ouvre l'image par un masque en arche (data-arch),
 *   2. fait remonter et resserrer l'image (data-opener-img),
 *   3. élève le grand titre lettre par lettre (data-title).
 * Les animations sont pilotées par components/Motion.tsx.
 */
export function ChapterOpener({ scene }: { scene: Scene }) {
  const dark = scene.tone === "nuit";
  return (
    <div className={`opener opener--${scene.tone}`} data-opener>
      <div className="opener__stage">
        <div className="opener__arch" data-arch>
          <div className="opener__img" data-opener-img>
            {scene.opener?.src ? (
              <Image src={scene.opener.src} alt={scene.opener.alt} fill sizes="100vw" />
            ) : (
              <Provisoire
                label={`Image d'ouverture — scène ${scene.numeral}`}
                expected={scene.opener?.expected ?? "Image plein écran 2560 × 1440"}
                tone={dark ? "sombre" : "clair"}
              />
            )}
          </div>
          <CanonLines className="opener__canon" />
        </div>
        <p className="opener__kicker" data-reveal>
          <span className="numeral">{scene.numeral}</span>
          <span>{scene.kicker}</span>
        </p>
        <h2 className="opener__title" data-title aria-label={scene.title}>
          {Array.from(scene.title).map((ch, i) => (
            <span key={i} className="ch" aria-hidden="true">
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h2>
      </div>
    </div>
  );
}
