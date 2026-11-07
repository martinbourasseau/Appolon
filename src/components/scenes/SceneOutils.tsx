import Image from "next/image";
import type { Scene } from "@/content/scenes";
import { orders, technologies } from "@/content/technologies";
import { ChapterOpener } from "@/components/scene-kit/ChapterOpener";
import { SceneDecor } from "@/components/scene-kit/SceneLayer";
import { ProvisoireTag } from "@/components/scene-kit/Provisoire";
import { DeskScene } from "@/components/desk/DeskScene";
import { WordCloud } from "@/components/scene-kit/WordCloud";

/**
 * SCÈNE IV — Les outils.
 * Les trois ordres d'architecture servent de classement :
 * dorique (fondation), ionique (structure), corinthien (ornement).
 * Les colonnes montent à des vitesses différentes au défilement.
 */
export function SceneOutils({ scene }: { scene: Scene }) {
  const keys = Object.keys(orders) as (keyof typeof orders)[];
  return (
    <section id={scene.id} className="scene scene--jour" data-scene aria-label={scene.nav}>
      <ChapterOpener scene={scene} />
      <div className="scene__body">
        <SceneDecor items={scene.decor} />

        <DeskScene />

        <WordCloud
          words={technologies.map((t) => t.name)}
          craft={["grille", "typographie", "palette", "mouvement", "accessibilité", "performance", "référencement", "maquette", "responsive", "hébergement"]}
          label="Les outils et les gestes du métier"
        />

        <div className="ordres">
          <div className="ordres__colonnes" data-depth="0.15">
            <Image src="/provisoire/colonnes.webp" alt="Les trois ordres : dorique, ionique, corinthien" width={730} height={1308} />
            <ProvisoireTag note="Colonnes : détourage automatique, basse définition" />
          </div>
          <div className="ordres__list" data-reveal="stagger">
            {keys.map((k) => (
              <div key={k} className="ordre">
                <p className="ordre__label">
                  {orders[k].label} <em>— {orders[k].meaning}</em>
                </p>
                <p className="ordre__text">{orders[k].text}</p>
                <ul className="ordre__techs">
                  {technologies
                    .filter((t) => t.order === k)
                    .map((t) => (
                      <li key={t.name} className={t.confirmed ? "" : "is-unconfirmed"}>
                        <span className="tech__name">{t.name}</span>
                        <span className="tech__role">{t.role}</span>
                        {t.confirmed ? null : <span className="tech__flag">à confirmer</span>}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <ProvisoireTag note="Liste limitée aux outils de ce site — à compléter par Martin" />
          </div>
        </div>
      </div>
    </section>
  );
}
