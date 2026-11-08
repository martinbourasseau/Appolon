"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { motionLevel } from "@/lib/motion-env";
import type { Mosaic, MosaicSource } from "./mosaic-gl";

/**
 * OUVERTURE — « La mosaïque d'Apollon ».
 *
 *  1. Lit de pose sombre ; l'épure au compas se trace au rythme du
 *     chargement réel des images (aucune progression simulée).
 *  2. Les pierres arrivent de derrière le spectateur et se posent :
 *     paysage depuis l'horizon, soleil, contour de la statue, corps, tête.
 *  3. Lumière rasante qui révèle le relief, réglage final de la caméra.
 *  4. La mosaïque s'efface lentement sur l'image : la scène I reprend, avec
 *     son défilement et son passage par le feu vers la scène II, inchangés.
 *
 * Toucher, molette ou clavier accélèrent la pose (l'accès au site n'est
 * jamais bloqué). Mouvement réduit / sans WebGL2 : l'image s'affiche
 * directement. Validation : ?intro=2.5 fige l'ouverture à 2,5 s.
 */

/** Attend qu'une image soit réellement chargée (sondage léger : robuste aux
 *  images déjà chargées avant l'hydratation, dont l'événement « load » est passé) */
function waitImage(img: HTMLImageElement) {
  return new Promise<void>((res, rej) => {
    const check = () => {
      if (img.complete && img.naturalWidth > 0) return res();
      if (img.complete && img.currentSrc && img.naturalWidth === 0) return rej(new Error(img.src));
      window.setTimeout(check, 50);
    };
    check();
  });
}

/** Recompose la scène I (sans nuages) à partir des calques tels qu'ils sont posés à l'écran */
function compose(stage: HTMLElement): MosaicSource | null {
  const sr = stage.getBoundingClientRect();
  const W = Math.round(sr.width);
  const H = Math.round(sr.height);
  const sky = stage.querySelector<HTMLImageElement>(".hero__sky-img");
  const sun = stage.querySelector<HTMLImageElement>("[data-hero-sun]");
  const statue = stage.querySelector<HTMLImageElement>(".hero__statue-img");
  if (!sky || !sun || !statue) return null;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return [c, c.getContext("2d", { willReadFrequently: true })!] as const;
  };
  const rel = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height };
  };
  const [image, ci] = mk();
  // paysage en « cover », avec son object-position
  const box = rel(sky);
  const iw = sky.naturalWidth;
  const ih = sky.naturalHeight;
  const s = Math.max(box.w / iw, box.h / ih);
  const [px, py] = getComputedStyle(sky).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
  ci.drawImage(sky, box.x + (box.w - iw * s) * (px || 0.5), box.y + (box.h - ih * s) * (py || 0.5), iw * s, ih * s);
  const sb = rel(sun);
  const tb = rel(statue);
  ci.drawImage(sun, sb.x, sb.y, sb.w, sb.h);
  ci.drawImage(statue, tb.x, tb.y, tb.w, tb.h);
  const [st, cs] = mk();
  cs.drawImage(statue, tb.x, tb.y, tb.w, tb.h);
  const [so, co] = mk();
  co.drawImage(sun, sb.x, sb.y, sb.w, sb.h);
  return {
    image,
    statue: st,
    sun: so,
    statueBox: tb,
    sunCenter: { x: sb.x + sb.w / 2, y: sb.y + sb.h / 2 },
    horizon: H * 0.62,
  };
}

export function MosaicIntro() {
  useEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const stage = hero?.querySelector<HTMLElement>(".hero__stage");
    const level = motionLevel();
    if (!hero || !stage || level === "reduced" || !root.dataset.intro) {
      delete root.dataset.intro;
      return;
    }
    root.dataset.intro = "mosaic";
    const params = new URLSearchParams(window.location.search);
    const freezeAt = params.has("intro") ? parseFloat(params.get("intro") || "0") : null;
    const q = gsap.utils.selector(stage);
    const chrome = Array.from(document.querySelectorAll<HTMLElement>(".header, .sommaire, .bandeau-provisoire"));

    // 1) épure au compas, tracée selon le chargement réel
    const rays = Array.from(stage.querySelectorAll<SVGGeometryElement>("[data-intro-rays] [data-ray]"));
    gsap.set(rays, { strokeDasharray: 1, strokeDashoffset: 1 });
    // (accolades : un tween GSAP est « thenable », il ne doit pas être renvoyé dans une promesse)
    const draw = (p: number) => {
      gsap.to(rays, { strokeDashoffset: 1 - p, duration: 0.45, ease: "power2.out", stagger: 0.012, overwrite: true });
    };
    const imgs = [".hero__sky-img", "[data-hero-sun]", ".hero__statue-img"]
      .map((s) => stage.querySelector<HTMLImageElement>(s))
      .filter((x): x is HTMLImageElement => !!x);
    let loaded = 0;

    let mosaic: Mosaic | null = null;
    let tl: gsap.core.Timeline | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let cancelled = false;
    const finish = () => {
      delete root.dataset.intro;
      gsap.set([...chrome, ...q(".hero__word .ch"), ...q(".hero__kicker"), ...q(".hero__notes"), ...q(".hero__cue")], { clearProps: "visibility,opacity" });
      mosaic?.dispose();
      mosaic = null;
      canvas?.remove();
      gsap.ticker.remove(tick);
      detach();
    };
    const fail = () => {
      if (cancelled) return;
      finish();
    };
    const tick = () => mosaic?.render();
    const speed = () => tl?.timeScale(4);
    const detach = () => ["wheel", "touchstart", "keydown", "pointerdown"].forEach((e) => window.removeEventListener(e, speed));
    const timeout = window.setTimeout(fail, 8000);

    Promise.all(imgs.map((im) => waitImage(im).then(() => draw(++loaded / (imgs.length + 1)))))
      .then(async () => {
        if (cancelled) return;
        const { Mosaic } = await import("./mosaic-gl");
        const src = compose(stage);
        if (!src || cancelled) return fail();
        draw(1);
        window.clearTimeout(timeout);
        canvas = document.createElement("canvas");
        canvas.className = "hero__mosaic";
        canvas.setAttribute("aria-hidden", "true");
        stage.appendChild(canvas);
        try {
          mosaic = new Mosaic(canvas, src.image.width, src.image.height, src, {
            quality: level === "full" && window.innerWidth > 768 ? "high" : "low",
          });
        } catch {
          return fail();
        }
        const M = mosaic;
        const D = M.duration;
        const prog = { t: 0, cam: 0, light: 0 };
        const R = D + 1.3; // la pose est finie : on laisse admirer la pierre, puis la révélation commence
        tl = gsap.timeline({ paused: true, onComplete: finish });
        tl.to(prog, { t: D + 0.1, duration: D + 0.1, ease: "none", onUpdate: () => M.update(prog.t) }, 0)
          .to(rays, { autoAlpha: 0, duration: 1.2, ease: "sine.in" }, 0.3)
          .to(prog, { cam: 1, duration: 2.2, ease: "power2.inOut", onUpdate: () => M.stage(prog.cam, prog.light) }, D - 1.4)
          .to(prog, { light: 1, duration: 2.0, ease: "sine.inOut", onUpdate: () => M.stage(prog.cam, prog.light) }, D - 0.9)
          // l'image apparaît sous la mosaïque, qui s'efface lentement
          .call(() => {
            gsap.set([...chrome, ...q(".hero__word .ch"), ...q(".hero__kicker"), ...q(".hero__notes"), ...q(".hero__cue")], { autoAlpha: 0 });
            root.dataset.intro = "reveal";
          }, [], R)
          .to(canvas, { autoAlpha: 0, duration: 2.6, ease: "sine.inOut" }, R + 0.1)
          .fromTo(q(".hero__word .ch"), { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.3, stagger: 0.06, ease: "power3.out" }, R + 0.5)
          .to(q(".hero__kicker"), { autoAlpha: 1, duration: 0.9 }, R + 1.0)
          .to([...chrome, ...q(".hero__notes"), ...q(".hero__cue")], { autoAlpha: 1, duration: 0.9, stagger: 0.06 }, R + 1.3);
        M.stage(0, 0);
        M.update(0);
        gsap.ticker.add(tick);
        if (freezeAt !== null && (isNaN(freezeAt) || freezeAt >= tl.duration())) {
          tl.kill();
          finish(); // ?intro=fin : état final directement
        } else if (freezeAt !== null) {
          tl.seek(freezeAt, false);
          M.render();
        } else {
          ["wheel", "touchstart", "keydown", "pointerdown"].forEach((e) => window.addEventListener(e, speed, { passive: true }));
          tl.play(0);
        }
        (window as unknown as { __apollonIntro: object }).__apollonIntro = {
          tl,
          tesserae: M.count,
          duration: tl.duration(),
          seek: (t: number) => {
            tl?.pause().seek(t, false);
            M.render();
          },
        };
      })
      .catch(fail);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      tl?.kill();
      detach();
      gsap.ticker.remove(tick);
      mosaic?.dispose();
      canvas?.remove();
      delete root.dataset.intro;
    };
  }, []);

  return null;
}
