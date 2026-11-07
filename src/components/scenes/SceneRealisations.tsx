import Image from "next/image";
import type { Scene } from "@/content/scenes";
import { realisations } from "@/content/realisations";
import { ChapterOpener } from "@/components/scene-kit/ChapterOpener";
import { SceneDecor } from "@/components/scene-kit/SceneLayer";
import { Provisoire } from "@/components/scene-kit/Provisoire";

/**
 * SCÈNE V — Les réalisations.
 * Galerie horizontale : la scène se fixe et les projets défilent de
 * droite à gauche au rythme du défilement vertical (data-gallery).
 * Liste vide → trois emplacements provisoires.
 */
export function SceneRealisations({ scene }: { scene: Scene }) {
  return (
    <section id={scene.id} className="scene scene--aube" data-scene aria-label={scene.nav}>
      <ChapterOpener scene={scene} />
      <div className="scene__body scene__body--flush">
        <SceneDecor items={scene.decor} />
      </div>
      <div className="gallery" data-gallery>
        <div className="gallery__stage">
          <ul className="gallery__track" data-gallery-track>
            {realisations.length
              ? realisations.map((r, i) => (
                  <li key={r.slug} className="work">
                    <div className="work__img">
                      <Image src={r.image.src} alt={r.image.alt} width={r.image.width} height={r.image.height} sizes="(max-width: 768px) 86vw, 60vw" />
                    </div>
                    <p className="work__meta">
                      <span>{String(i + 1).padStart(2, "0")}</span> {r.title} <em>{r.category}</em>
                    </p>
                  </li>
                ))
              : [1, 2, 3].map((n) => (
                  <li key={n} className="work">
                    <div className="work__img">
                      <Provisoire
                        label={`Réalisation ${n}`}
                        expected="Capture d'un site réel 2400 × 1500 + titre, catégorie, année et lien — sur indication de Martin."
                        ratio="16 / 10"
                      />
                    </div>
                    <p className="work__meta">
                      <span>0{n}</span> Projet à venir <em>Site web</em>
                    </p>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
