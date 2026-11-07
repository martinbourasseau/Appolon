"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { motionLevel } from "@/lib/motion-env";
import { LayerRenderer, type Camera, type LayerState } from "./gl";

/**
 * OUVERTURE — « L'aube d'Apollon ».
 *
 * Principe repris de Shopify Editions Winter ’26 (analysé dans le navigateur) :
 * déclenchement automatique au chargement, un tracé de construction sur fond
 * sombre pendant le chargement, puis une scène en profondeur révélée par un
 * front irrégulier qui part d'un point et s'étend, pendant que la caméra recule.
 *
 * Identité Apollon :
 *   1. Nuit d'avant l'aube : les rayons du soleil se tracent au compas
 *      (le tracé suit le chargement réel des images).
 *   2. L'aube : le paysage naît depuis le soleil — front peint, lisière dorée —
 *      la caméra, d'abord plongée dans le paysage, recule et descend.
 *   3. La lumière touche la tête d'Apollon et descend le long du marbre.
 *   4. Le titre se lève derrière la statue ; la navigation apparaît.
 *
 * Le défilement n'est jamais bloqué. Après l'ouverture, le canvas continue de
 * recopier les mouvements de défilement définis dans Motion.tsx (parallaxe).
 * Mouvement réduit, absence de WebGL2 ou image en échec → aucune ouverture,
 * la scène DOM s'affiche normalement.
 *
 * Contrôle pour la validation : ?intro=1.8 fige l'ouverture à 1,8 s ;
 * window.__apollonIntro.seek(t) la positionne.
 */

type Spec = {
  key: string;
  el: string;
  img?: string;
  canvas: "back" | "front";
  fit: "cover" | "fill";
  depth: number;
  /** point de départ du front, en fraction de l'élément */
  origin: [number, number];
  /** élément dont le point d'origine est relatif (défaut : l'élément lui-même) */
  originEl?: string;
  gradeFloor?: number;
};

const SPECS: Spec[] = [
  { key: "sky", el: "[data-hero-sky]", img: "img", canvas: "back", fit: "cover", depth: 1, origin: [0.5, 0.5], originEl: "[data-hero-sun]" },
  { key: "sun", el: "[data-hero-sun]", canvas: "back", fit: "fill", depth: 0.75, origin: [0.5, 0.5], gradeFloor: 1 },
  { key: "far", el: "[data-hero-cloud='far']", canvas: "back", fit: "fill", depth: 1.35, origin: [0.75, 0.5] },
  { key: "statue", el: "[data-hero-statue]", img: ".hero__statue-img", canvas: "front", fit: "fill", depth: 1.7, origin: [0.6, 0.1] },
  { key: "near", el: "[data-hero-cloud='near']", canvas: "front", fit: "fill", depth: 3, origin: [0.3, 0.5] },
];

function waitImage(img: HTMLImageElement) {
  const done = () => img.decode().catch(() => undefined);
  if (img.complete && img.naturalWidth > 0) return done();
  return new Promise<void>((res, rej) => {
    img.addEventListener("load", () => done().then(() => res()), { once: true });
    img.addEventListener("error", () => rej(new Error(img.src)), { once: true });
  });
}

export function ApolloIntro() {
  useEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const stage = hero?.querySelector<HTMLElement>(".hero__stage");
    const level = motionLevel();
    if (!hero || !stage || level === "reduced" || !root.dataset.intro || !LayerRenderer.supported()) {
      delete root.dataset.intro;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const freezeAt = params.has("intro") ? parseFloat(params.get("intro") || "0") : null;

    /* ── Canvases ──────────────────────────────────────────────── */
    const mk = (cls: string) => {
      const c = document.createElement("canvas");
      c.className = `hero__gl ${cls}`;
      c.setAttribute("aria-hidden", "true");
      return c;
    };
    const backCanvas = mk("hero__gl--back");
    const frontCanvas = mk("hero__gl--front");
    stage.prepend(backCanvas);
    stage.querySelector(".hero__statue")?.after(frontCanvas);

    let back: LayerRenderer;
    let front: LayerRenderer;
    try {
      back = new LayerRenderer(backCanvas);
      front = new LayerRenderer(frontCanvas);
    } catch {
      backCanvas.remove();
      frontCanvas.remove();
      delete root.dataset.intro;
      return;
    }
    const octaves = level === "lite" ? 3 : 5;
    // résolution de calcul : réduite pendant l'ouverture (front bruité, coûteux),
    // pleine ensuite (simples images, netteté maximale)
    const restDpr = level === "lite" ? 1.25 : 1.75;
    const introDpr = level === "lite" ? 1 : 1.25;
    let maxDpr = introDpr;
    back.octaves = front.octaves = octaves;
    root.dataset.intro = "gl";

    /* ── Couches ───────────────────────────────────────────────── */
    const layers: (LayerState & { spec: Spec })[] = [];
    for (const [i, spec] of SPECS.entries()) {
      const el = stage.querySelector<HTMLElement>(spec.el);
      if (!el) continue;
      const img = (spec.img ? el.querySelector<HTMLImageElement>(spec.img) : el) as HTMLImageElement | null;
      if (!img || img.tagName !== "IMG") continue;
      layers.push({
        spec,
        el,
        img,
        fit: spec.fit,
        tex: null,
        rest: { x: 0, y: 0, w: 1, h: 1, ox: 0, oy: 0 },
        reveal: 0,
        origin: [0, 0],
        opacity: 1,
        seed: 3.1 * (i + 1),
        depth: spec.depth,
        gradeFloor: spec.gradeFloor,
      });
    }
    const byKey = (k: string) => layers.find((l) => l.spec.key === k);
    const backLayers = layers.filter((l) => l.spec.canvas === "back");
    const frontLayers = layers.filter((l) => l.spec.canvas === "front");

    const cam: Camera = { progress: 0, focus: [0, 0], zoom: 1.05, tilt: 0.14 };
    const rays = stage.querySelector<SVGSVGElement>("[data-intro-rays]");

    /** Géométrie au repos : transformations GSAP retirées le temps de la mesure */
    const measure = () => {
      const s = stage.getBoundingClientRect();
      back.resize(s.width, s.height, maxDpr);
      front.resize(s.width, s.height, maxDpr);
      const rects = new Map<string, DOMRect>();
      for (const L of layers) {
        const saved = L.el.style.transform;
        L.el.style.transform = "none";
        const r = L.el.getBoundingClientRect();
        L.el.style.transform = saved;
        rects.set(L.spec.key, r);
        const [ox, oy] = getComputedStyle(L.el).transformOrigin.split(" ").map(parseFloat);
        L.rest = { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height, ox, oy };
      }
      for (const L of layers) {
        const ref = L.spec.originEl ? stage.querySelector<HTMLElement>(L.spec.originEl) : null;
        const R = ref ? rects.get(SPECS.find((x) => x.el === L.spec.originEl)?.key ?? "") ?? ref.getBoundingClientRect() : rects.get(L.spec.key)!;
        L.origin = [R.left - s.left + R.width * L.spec.origin[0], R.top - s.top + R.height * L.spec.origin[1]];
      }
      const st = byKey("statue");
      cam.focus = st ? [st.rest.x + st.rest.w / 2, st.rest.y + st.rest.h * 0.34] : [s.width / 2, s.height / 2];
      // rayons centrés sur le soleil
      const sun = rects.get("sun");
      if (rays && sun) {
        rays.style.left = `${sun.left - s.left + sun.width / 2}px`;
        rays.style.top = `${sun.top - s.top + sun.height / 2}px`;
      }
    };

    const draw = () => {
      back.render(backLayers, cam);
      front.render(frontLayers, cam);
    };

    /* ── État animé ────────────────────────────────────────────── */
    const st = { cam: 0, grade: 0, sky: 0, sun: 0, far: 0, statue: 0, near: 0 };
    const apply = () => {
      cam.progress = st.cam;
      back.grade = front.grade = st.grade;
      for (const L of layers) L.reveal = st[L.spec.key as keyof typeof st];
      draw();
    };

    const q = gsap.utils.selector(hero);
    const chrome = [".header", ".sommaire", ".bandeau-provisoire"].map((s) => document.querySelector(s)).filter(Boolean);
    const rayLines = rays ? Array.from(rays.querySelectorAll<SVGGeometryElement>("[data-ray]")) : [];
    gsap.set(rayLines, { strokeDasharray: 1, strokeDashoffset: 1 });

    // 1) chargement : les rayons se tracent, la progression suit les images
    const loader = { p: 0 };
    const drawRays = () =>
      rayLines.forEach((l, i) => {
        const local = gsap.utils.clamp(0, 1, loader.p * 1.35 - (i / rayLines.length) * 0.35);
        l.style.strokeDashoffset = String(1 - local);
      });
    // progression réelle : chaque image décodée fait avancer les rayons (lissé, jamais anticipé)
    let loaded = 0;
    const minLoader = gsap.to(loader, { p: 0, duration: 0.01 });
    const onLayerReady = () => {
      loaded += 1;
      gsap.to(loader, { p: (loaded / Math.max(1, layers.length)) * 0.9, duration: 0.45, ease: "power2.out", overwrite: true, onUpdate: drawRays });
    };

    // 2) ouverture : construite une fois les images prêtes (voir plus bas)
    let tl: gsap.core.Timeline | null = null;
    const isPlaying = () => Boolean(tl && tl.isActive());

    /* ── Rendu au repos : seulement si un mouvement de défilement a changé une couche ── */
    let last = "";
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(hero);
    const tick = (time: number) => {
      back.time = front.time = time;
      if (!visible || isPlaying()) return;
      const sig = layers.map((L) => getComputedStyle(L.el).transform).join("|");
      if (sig !== last) {
        last = sig;
        draw();
      }
    };

    const ro = new ResizeObserver(() => {
      measure();
      last = "";
      draw();
    });

    let cancelled = false;
    const fallback = () => {
      if (cancelled) return;
      cancelled = true;
      tl?.kill();
      minLoader.kill();
      backCanvas.remove();
      frontCanvas.remove();
      delete root.dataset.intro;
      gsap.from(q("[data-hero-sky], [data-hero-statue]"), { opacity: 0, duration: 1.2 });
    };

    const timeout = window.setTimeout(fallback, 6000);
    Promise.all(layers.map((L) => waitImage(L.img).then(onLayerReady)))
      .then(() => {
        if (cancelled) return;
        window.clearTimeout(timeout);
        for (const L of layers) L.tex = (L.spec.canvas === "back" ? back : front).texture(L.img);
        // 2) ouverture
        tl = gsap.timeline({ paused: true, onUpdate: apply, onComplete: () => {
            root.dataset.intro = "done";
            maxDpr = restDpr;
            measure();
            draw();
          },
        });
        tl.to(loader, { p: 1, duration: 0.35, ease: "power2.out", onUpdate: drawRays }, 0)
          .to(rays, { scale: 1.3, autoAlpha: 0, duration: 2, ease: "power2.inOut" }, 0.2)
          .to(st, { sky: 1, duration: 2.6, ease: "power2.inOut" }, 0.15)
          .to(st, { cam: 1, duration: 3.8, ease: "power3.inOut" }, 0.15)
          .to(st, { grade: 1, duration: 3.2, ease: "sine.inOut" }, 0.4)
          .to(st, { sun: 1, duration: 1.8, ease: "power2.out" }, 0.45)
          .to(st, { near: 1, duration: 1.6, ease: "power2.out" }, 0.3)
          .to(st, { far: 1, duration: 2, ease: "power2.out" }, 0.7)
          .to(st, { statue: 1, duration: 2.3, ease: "power2.inOut" }, 1.45)
          .fromTo(q(".hero__word .ch"), { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.4, stagger: 0.07, ease: "power3.out" }, 2.0)
          .fromTo(q(".hero__kicker"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1, ease: "power2.out" }, 2.6)
          .fromTo(q("[data-hero-light]"), { autoAlpha: 0 }, { autoAlpha: 0.35, duration: 2, ease: "sine.inOut" }, 2.0)
          .fromTo([...chrome, ...q(".hero__notes"), ...q(".hero__cue"), ...q(".hero__arm-anchor")], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: "power2.out", stagger: 0.08 }, 3.1)
          .set(q(".intro-veil"), { autoAlpha: 0 }, 4.2);
        measure();
        apply();
        ro.observe(stage);
        gsap.ticker.add(tick);
        const T = tl;
        if (freezeAt !== null) {
          T.pause().seek(freezeAt, false); // false : déclenche onUpdate/onComplete
          apply();
        }
        else T.play(0);
        (window as unknown as { __apollonIntro: object }).__apollonIntro = {
          tl: T,
          duration: T.duration(),
          seek: (t: number) => {
            T.pause().seek(t, false);
            apply();
          },
        };
      })
      .catch(fallback);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      tl?.kill();
      minLoader.kill();
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
      back.dispose();
      front.dispose();
      backCanvas.remove();
      frontCanvas.remove();
      delete root.dataset.intro;
    };
  }, []);

  return null;
}
