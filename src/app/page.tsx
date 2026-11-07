import { scenes } from "@/content/scenes";
import { Header } from "@/components/layout/Header";
import { Sommaire } from "@/components/layout/Sommaire";
import { BandeauProvisoire, Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Motion } from "@/components/Motion";
import { ApolloIntro } from "@/components/intro/ApolloIntro";
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

const INTRO_BOOT = `(function(){try{var m=new URLSearchParams(location.search).get("motion");if(m==="reduced")return;if(m!=="full"&&m!=="lite"&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(!("WebGL2RenderingContext" in window))return;document.documentElement.dataset.intro="pending";document.documentElement.dataset.burn="1";}catch(e){}})();`;

/** La page : un seul récit en sept scènes */
export default function Page() {
  return (
    <>
      {/* Avant le premier affichage : prépare l'ouverture, sans attendre React (évite tout flash) */}
      <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT }} />
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
      <ApolloIntro />
      <Motion />
    </>
  );
}
