import { scenes } from "@/content/scenes";
import { Header } from "@/components/layout/Header";
import { Sommaire } from "@/components/layout/Sommaire";
import { BandeauProvisoire, Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Motion } from "@/components/Motion";
import { SceneApparition } from "@/components/scenes/SceneApparition";
import { SceneConcevoir } from "@/components/scenes/SceneConcevoir";
import { SceneIngenierie } from "@/components/scenes/SceneIngenierie";
import { SceneOutils } from "@/components/scenes/SceneOutils";
import { SceneRealisations } from "@/components/scenes/SceneRealisations";
import { SceneSurMesure } from "@/components/scenes/SceneSurMesure";
import { SceneContact } from "@/components/scenes/SceneContact";

const byId = (id: string) => {
  const s = scenes.find((x) => x.id === id);
  if (!s) throw new Error(`Scène introuvable : ${id}`);
  return s;
};

/** La page : un seul récit en sept scènes */
export default function Page() {
  return (
    <>
      <Header />
      <Sommaire />
      <main id="contenu">
        <SceneApparition />
        <SceneConcevoir scene={byId("concevoir")} />
        <SceneIngenierie scene={byId("ingenierie")} />
        <SceneOutils scene={byId("outils")} />
        <SceneRealisations scene={byId("realisations")} />
        <SceneSurMesure scene={byId("sur-mesure")} />
        <SceneContact scene={byId("contact")} />
      </main>
      <Footer />
      <BandeauProvisoire />
      <SmoothScroll />
      <Motion />
    </>
  );
}
