import Image from "next/image";
import type { Scene } from "@/content/scenes";
import { site } from "@/content/site";
import { ChapterOpener } from "@/components/scene-kit/ChapterOpener";
import { Provisoire, ProvisoireTag } from "@/components/scene-kit/Provisoire";

/**
 * SCÈNE VII — Le contact.
 * Rien n'est simulé : chaque canal n'apparaît que s'il est renseigné
 * dans content/site.ts. Sinon, un emplacement provisoire le signale.
 */
export function SceneContact({ scene }: { scene: Scene }) {
  const { email, bookingUrl } = site.contact;
  return (
    <section id={scene.id} className="scene scene--aube scene--final" data-scene aria-label={scene.nav}>
      <ChapterOpener scene={scene} />
      <div className="scene__body contact">
        <div className="contact__lyre" data-depth="-0.12">
          <Image src="/provisoire/lyre.webp" alt="" width={442} height={602} />
          <ProvisoireTag note="Lyre : détourage automatique" />
        </div>
        <div className="contact__copy" data-reveal="stagger">
          {scene.lead ? <p className="contact__lead">{scene.lead}</p> : null}
          <div className="contact__actions">
            {email ? (
              <a className="btn btn--or" href={`mailto:${email}`}>
                Écrire à {email}
              </a>
            ) : null}
            {bookingUrl ? (
              <a className="btn" href={bookingUrl} target="_blank" rel="noopener">
                Réserver un échange
              </a>
            ) : null}
            {!email && !bookingUrl ? (
              <Provisoire
                label="Coordonnées"
                expected="Adresse e-mail, lien de réservation et/ou formulaire à confirmer par Martin. Aucun envoi n'est simulé."
                ratio="16 / 5"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
