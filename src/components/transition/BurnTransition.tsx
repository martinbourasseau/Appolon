"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionLevel } from "@/lib/motion-env";
import { BurnRenderer, type BurnState } from "./burn-gl";

gsap.registerPlugin(ScrollTrigger);

/** Fenêtre du défilement de la scène I consacrée au passage (fraction) */
const START = 0.5;
const PAINTING_A = "/provisoire/paysage.webp";
const PAINTING_B = "/scenes/concevoir/corot-san-bartolomeo.webp";

/**
 * Passage I → II : la scène I se consume depuis le soleil, la caméra
 * traverse la brèche et entre dans le tableau de la scène II.
 * Activé seulement si l'amorce de page a posé html[data-burn] (WebGL2,
 * mouvement non réduit) ; sinon la scène II garde son ouverture en arche.
 */
export function BurnTransition() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const canvas = ref.current;
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const stage = hero?.querySelector<HTMLElement>(".hero__stage");
    const level = motionLevel();
    if (!canvas || !hero || !stage || !root.dataset.burn || level === "reduced") {
      delete root.dataset.burn;
      return;
    }

    let r: BurnRenderer;
    try {
      r = new BurnRenderer(canvas, level === "lite" || window.innerWidth < 769 ? 260 : 650);
    } catch {
      delete root.dataset.burn;
      ScrollTrigger.refresh();
      return;
    }

    const mobile = () => window.innerWidth < 769;
    const state: BurnState = { p: 0, zoom: 1, origin: [0, 0], aRect: [0, 0, 1, 1] };
    let ready = false;
    let raf = 0;
    let live = false;
    let disposed = false;

    const resize = () => {
      r.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio, level === "lite" ? 1 : 1.5));
      // même cadrage que l'ouverture de la scène II (object-position, travelling mobile)
      r.bPos = [mobile() ? 0.12 : 0.5, 0.62];
    };
    resize();
    window.addEventListener("resize", resize);

    const measure = () => {
      const sun = stage.querySelector<HTMLElement>("[data-hero-sun]");
      const sky = stage.querySelector<HTMLElement>("[data-hero-sky]");
      if (state.p <= 0 && sun) {
        const saved = stage.style.transform;
        stage.style.transform = "none";
        const b = sun.getBoundingClientRect();
        stage.style.transform = saved;
        state.origin = [b.left + b.width / 2, b.top + b.height / 2];
      }
      if (sky) {
        const a = sky.getBoundingClientRect();
        state.aRect = [a.left, a.top, a.width, a.height];
      }
    };

    const frame = (t: number) => {
      if (disposed) return;
      measure();
      r.render(state, t / 1000);
      // en mouvement : flammes animées ; à l'arrêt complet (brûlé), une image suffit
      raf = live ? requestAnimationFrame(frame) : 0;
    };
    const wake = () => {
      if (!ready) return;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // le feu se poursuit pendant que la scène II monte sous le voile ; il s'achève
    // à l'instant où elle se fixe — même tableau, même cadrage : relais invisible
    const opener = document.querySelector<HTMLElement>("#concevoir [data-opener]");
    const sync = () => {
      // caméra : la scène II, vue de très près dans la brèche, se pose à son cadrage
      state.zoom = 1 + 0.4 * (1 - gsap.parseEase("power2.out")(state.p));
      live = state.p > 0 && state.p < 1;
      canvas.style.visibility = live ? "visible" : "hidden";
      if (live) wake();
    };

    const st = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      ...(opener ? { endTrigger: opener, end: "top top" } : { end: "bottom bottom" }),
      onUpdate: (s) => {
        const p = gsap.utils.clamp(0, 1, (s.progress - START) / (1 - START));
        state.p = p;
        // la caméra traverse : la scène I s'ouvre devant nous, la II s'approche dans la brèche
        gsap.set(stage, {
          scale: 1 + 0.85 * p * p,
          transformOrigin: `${state.origin[0]}px ${state.origin[1]}px`,
        });
        sync();
      },
    });

    r.load(PAINTING_A, PAINTING_B)
      .then(() => {
        if (disposed) return;
        ready = true;
        measure();
        frame(performance.now());
      })
      .catch(() => {
        // tableaux indisponibles : retour à l'ouverture classique
        delete root.dataset.burn;
        ScrollTrigger.refresh();
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      st.kill();
      window.removeEventListener("resize", resize);
      gsap.set(stage, { clearProps: "transform,transformOrigin" });
      r.dispose();
    };
  }, []);

  return <canvas ref={ref} className="burn" aria-hidden="true" />;
}
