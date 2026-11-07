"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionLevel } from "@/lib/motion-env";
import type { DeskHandle } from "./desk-gl";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { k: "Structure", t: "La grille, les proportions, l'ordre des contenus." },
  { k: "Style", t: "La palette, les typographies, la matière." },
  { k: "Contenus", t: "Les images, les textes, le mouvement." },
  { k: "En ligne", t: "Le site est publié, rapide et suivi." },
];

/**
 * L'atelier d'Apollon : la création d'un site, montrée concrètement.
 * La scène 3D n'est chargée qu'à l'approche (import dynamique), puis
 * pilotée par le défilement. Sans WebGL ou avec prefers-reduced-motion :
 * une image fixe de la même scène.
 */
export function DeskScene() {
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "live" | "static">("idle");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = root.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const level = motionLevel();
    const gl2 = typeof WebGLRenderingContext !== "undefined" && !!document.createElement("canvas").getContext("webgl2");
    if (level === "reduced" || !gl2) {
      const id = requestAnimationFrame(() => setState("static"));
      return () => cancelAnimationFrame(id);
    }

    let desk: DeskHandle | null = null;
    let st: ScrollTrigger | null = null;
    let cancelled = false;
    let lastX: number | null = null;
    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      desk?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      if (lastX !== null && e.pointerType === "mouse") desk?.rotate(((e.clientX - lastX) / r.width) * 2.4);
      if (lastX !== null) lastX = e.clientX;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") lastX = e.clientX;
    };
    const onUp = () => (lastX = null);

    const start = async () => {
      setState("loading");
      try {
        const { createDesk } = await import("./desk-gl");
        if (cancelled) return;
        const title = document.querySelector<HTMLElement>(".opener__title") ?? document.body;
        const serif = getComputedStyle(title).fontFamily;
        const sans = getComputedStyle(document.body).fontFamily;
        desk = createDesk(canvas, {
          quality: level === "full" && window.innerWidth > 768 ? "high" : "low",
          serif,
          sans,
          paintingSrc: "/scenes/concevoir/corot-san-bartolomeo.webp",
        });
        await desk.ready;
        if (cancelled) return;
        setState("live");
        st = ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (s) => {
            desk?.setProgress(s.progress);
            setStep(Math.min(STEPS.length - 1, Math.floor(s.progress * STEPS.length * 0.999)));
          },
          onToggle: (s) => desk?.setVisible(s.isActive),
        });
        desk.setVisible(st.isActive);
        desk.setProgress(st.progress);
        window.addEventListener("pointermove", onPointer, { passive: true });
        canvas.addEventListener("pointerdown", onDown);
        window.addEventListener("pointerup", onUp);
      } catch {
        setState("static");
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          void start();
        }
      },
      { rootMargin: "120% 0px" },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      st?.kill();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerdown", onDown);
      desk?.dispose();
    };
  }, []);

  return (
    <div ref={root} className={`desk desk--${state}`} data-desk>
      <div className="desk__stage">
        {/* l'atelier est posé dans le paysage du chapitre : les objets entrent dans le tableau */}
        <Image src="/scenes/outils/valenciennes-villa-farnese.webp" alt="" fill sizes="100vw" className="desk__backdrop" aria-hidden="true" />
        <div className="desk__veil" aria-hidden="true" />
        <p className="desk__kicker">L&apos;atelier</p>
        <canvas ref={canvasRef} className="desk__canvas" aria-hidden="true" />
        {state === "static" ? (
          <Image
            src="/scenes/outils/atelier-3d.webp"
            alt="Un ordinateur portable sur une table de marbre, entouré de fenêtres d'interface et d'une sphère armillaire dorée"
            width={1540}
            height={1000}
            sizes="(max-width: 768px) 100vw, 70vw"
            className="desk__poster"
          />
        ) : null}
        {state === "loading" ? (
          <div className="desk__loading" role="status">
            <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
              <circle cx="24" cy="24" r="6" />
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={i} x1="24" y1="5" x2="24" y2="12" transform={`rotate(${i * 30} 24 24)`} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </svg>
            <span>Préparation de l&apos;atelier…</span>
          </div>
        ) : null}
        <ol className="desk__steps" aria-label="Les étapes de création d'un site">
          {STEPS.map((s, i) => (
            <li key={s.k} className="desk__step" data-active={state !== "live" || i === step ? "" : undefined}>
              <span className="desk__n">{["I", "II", "III", "IV"][i]}</span>
              <span className="desk__k">{s.k}</span>
              <span className="desk__t">{s.t}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
