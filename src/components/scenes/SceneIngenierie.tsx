import Image from "next/image";
import type { Scene } from "@/content/scenes";
import { StarField } from "@/components/scene-kit/StarField";
import { ChapterOpener } from "@/components/scene-kit/ChapterOpener";
import { SceneDecor } from "@/components/scene-kit/SceneLayer";
import { Folios, Lead } from "@/components/scene-kit/Editorial";

/**
 * SCÈNE III — L'ingénierie (nuit).
 * Une « tablette » de code gravée ligne à ligne, et le schéma
 * d'architecture d'un site qui se trace au défilement.
 * Le code affiché est un extrait réel de la structure de ce site.
 */
const code = [
  { t: "// src/app/page.tsx — la page en sept scènes", c: "cm" },
  { t: "export default function Page() {", c: "" },
  { t: "  return (", c: "" },
  { t: "    <main id=\"contenu\">", c: "tg" },
  { t: "      <SceneApparition />", c: "tg" },
  { t: "      <SceneConcevoir scene={II} />", c: "tg" },
  { t: "      <SceneIngenierie scene={III} />", c: "tg" },
  { t: "      …", c: "cm" },
  { t: "    </main>", c: "tg" },
  { t: "  );", c: "" },
  { t: "}", c: "" },
];

const layers = [
  { k: "Interface", d: "Composants, mise en page, mouvement" },
  { k: "Contenus", d: "Textes, images, données structurées" },
  { k: "Serveur", d: "Formulaires, routes, intégrations" },
  { k: "Hébergement", d: "Mise en ligne, prévisualisations" },
];

export function SceneIngenierie({ scene }: { scene: Scene }) {
  return (
    <section id={scene.id} className="scene scene--nuit" data-scene aria-label={scene.nav}>
      <ChapterOpener scene={scene} />
      <div className="scene__body">
        {/* Ciel de la zone bleue : l'aquarelle fournie par Martin, sous des étoiles vivantes */}
        <div className="night-sky" aria-hidden="true">
          <Image src="/scenes/ingenierie/nuit-aquarelle-constellations.webp" alt="" fill sizes="100vw" className="night-sky__img" />
          <Image src="/scenes/ingenierie/nuit-ciel-nebuleuse.webp" alt="" fill sizes="100vw" className="night-sky__nebula" />
          <StarField density={0.00012} />
        </div>
        <SceneDecor items={scene.decor} />
        {scene.lead ? <Lead text={scene.lead} /> : null}

        <div className="engine">
          <figure className="tablet" data-code>
            <figcaption className="tablet__cap">Extrait de la structure de ce site</figcaption>
            <pre>
              <code>
                {code.map((l, i) => (
                  <span key={i} className={`tablet__line ${l.c}`} data-code-line>
                    <span className="tablet__no">{String(i + 1).padStart(2, "0")}</span>
                    {l.t}
                    {"\n"}
                  </span>
                ))}
              </code>
            </pre>
          </figure>

          <ol className="strata" data-strata aria-label="Couches d'un site">
            {layers.map((l, i) => (
              <li key={l.k} className="stratum" data-stratum>
                <span className="stratum__n">{["α", "β", "γ", "δ"][i]}</span>
                <span className="stratum__k">{l.k}</span>
                <span className="stratum__d">{l.d}</span>
              </li>
            ))}
          </ol>
        </div>

        {scene.folios ? <Folios items={scene.folios} numeral={scene.numeral} /> : null}
      </div>
    </section>
  );
}
