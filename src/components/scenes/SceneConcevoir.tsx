import Image from "next/image";
import type { Scene } from "@/content/scenes";
import { ChapterOpener } from "@/components/scene-kit/ChapterOpener";
import { SceneDecor } from "@/components/scene-kit/SceneLayer";
import { Folios, Lead } from "@/components/scene-kit/Editorial";
import { Provisoire, ProvisoireTag } from "@/components/scene-kit/Provisoire";
import { CanonLines } from "@/components/scene-kit/CanonLines";

/**
 * SCÈNE II — L'art de concevoir.
 * Après l'ouverture : la composition « atelier » — trois maquettes
 * d'interface posées à des profondeurs différentes, un lys en ornement,
 * et les tracés du canon qui relient le tout.
 */
export function SceneConcevoir({ scene }: { scene: Scene }) {
  return (
    <section id={scene.id} className="scene scene--jour" data-scene aria-label={scene.nav}>
      <ChapterOpener scene={scene} />
      <div className="scene__body">
        <SceneDecor items={scene.decor} />
        {scene.lead ? <Lead text={scene.lead} /> : null}

        <div className="atelier" data-atelier>
          <CanonLines className="atelier__canon" />
          <div className="atelier__frame atelier__frame--a" data-depth="0.12">
            <Provisoire label="Maquette d'interface — ordinateur" expected="Capture ou maquette d'écran d'un site réel, 1600 × 1000, format WebP." ratio="16 / 10" />
          </div>
          <div className="atelier__frame atelier__frame--b" data-depth="-0.08">
            <Provisoire label="Maquette d'interface — mobile" expected="Écran mobile du même projet, 780 × 1600." ratio="9 / 19" />
          </div>
          <div className="atelier__frame atelier__frame--c" data-depth="0.22">
            <Provisoire label="Planche d'identité" expected="Palette, typographies, détails graphiques d'un projet." ratio="4 / 5" />
          </div>
          <div className="atelier__ornament" data-depth="-0.18">
            <Image src="/provisoire/lys.webp" alt="" width={736} height={825} />
            <ProvisoireTag note="Lys : détourage automatique" />
          </div>
        </div>

        {scene.folios ? <Folios items={scene.folios} numeral={scene.numeral} /> : null}
      </div>
    </section>
  );
}
