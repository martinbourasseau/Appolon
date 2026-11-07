import type { Scene } from "@/content/scenes";
import { ChapterOpener } from "@/components/scene-kit/ChapterOpener";
import { SceneDecor } from "@/components/scene-kit/SceneLayer";
import { CanonLines } from "@/components/scene-kit/CanonLines";

/**
 * SCÈNE VI — Le sur-mesure.
 * Séquence fixée : les cinq temps se succèdent pendant que la spirale
 * du canon se trace — l'idée prend sa proportion (data-steps).
 */
export function SceneSurMesure({ scene }: { scene: Scene }) {
  const steps = scene.folios ?? [];
  return (
    <section id={scene.id} className="scene scene--jour" data-scene aria-label={scene.nav}>
      <ChapterOpener scene={scene} />
      <div className="scene__body scene__body--flush">
        <SceneDecor items={scene.decor} />
      </div>
      <div className="steps" data-steps style={{ ["--n" as string]: steps.length }}>
        <div className="steps__stage">
          <CanonLines className="steps__canon" />
          <p className="steps__count" aria-hidden="true">
            <span data-steps-count>1</span>
            <span className="steps__total">/ {steps.length}</span>
          </p>
          <ol className="steps__list">
            {steps.map((s, i) => (
              <li key={s.title} className="step" data-step>
                <span className="step__n">{["I", "II", "III", "IV", "V"][i]}</span>
                <h3 className="step__title">{s.title}</h3>
                <p className="step__text">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
