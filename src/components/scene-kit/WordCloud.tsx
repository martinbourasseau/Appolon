"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { motionLevel } from "@/lib/motion-env";

/**
 * Les outils et les gestes du métier — un nuage de mots vivant.
 *
 * D'après le passage « commandes » de Shopify Editions Winter '26, observé
 * dans le navigateur :
 *   – chaque mot flotte sur son plan, à son rythme (jamais deux pareils) ;
 *   – près du curseur, les mots grossissent et s'assombrissent, les autres
 *     reculent (effet de loupe, sensation de profondeur) ;
 *   – le mot survolé devient une petite carte d'encre avec son rôle, et un
 *     soleil d'Apollon apparaît à côté.
 * Toucher et clavier : un appui / le focus ouvre la carte. Mouvement réduit :
 * pas de flottement ni de loupe, les cartes restent accessibles.
 */
export type CloudItem = { w: string; detail?: string; craft?: boolean };

const rand = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return x - Math.floor(x);
};

export function WordCloud({ items, label }: { items: CloudItem[]; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const uid = useId();

  // composition déterministe : outils et gestes entrecroisés, 4 colonnes, profondeurs variées
  const placed = items
    .map((it, i) => ({ it, key: rand(i * 7 + it.w.length) }))
    .sort((a, b) => a.key - b.key)
    .map(({ it }, i) => {
      const cols = 4;
      const depth = [0.05, 0.12, 0.22, 0.32][Math.floor(rand(i * 3 + 1) * 4)];
      return {
        ...it,
        left: 4 + (i % cols) * (80 / cols) + rand(i * 5 + 2) * 6,
        top: 8 + Math.floor(i / cols) * 24 + rand(i * 5 + 3) * 10,
        size: 1 + depth * 6.4,
        depth,
      };
    });
  const rows = Math.ceil(placed.length / 4);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const level = motionLevel();
    const words = Array.from(el.querySelectorAll<HTMLElement>(".wordcloud__in"));
    if (level === "reduced") return;
    const ctx = gsap.context(() => {
      // flottement : amplitudes, durées et départs propres à chaque mot
      words.forEach((w, i) => {
        const r = (k: number) => rand(i * 11 + k);
        gsap.to(w, { y: (r(1) - 0.5) * 18, duration: 3 + r(2) * 3, ease: "sine.inOut", yoyo: true, repeat: -1, delay: -r(3) * 4 });
        gsap.to(w, { x: (r(4) - 0.5) * 14, duration: 4 + r(5) * 4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: -r(6) * 5 });
        gsap.to(w, { rotation: (r(7) - 0.5) * 2.4, duration: 5 + r(8) * 3, ease: "sine.inOut", yoyo: true, repeat: -1, delay: -r(9) * 5 });
      });
    }, el);

    // effet de loupe autour du curseur (souris seulement)
    if (!matchMedia("(pointer: fine)").matches) return () => ctx.revert();
    const sc = words.map((w) => gsap.quickTo(w, "scale", { duration: 0.6, ease: "power3.out" }));
    const op = words.map((w) => gsap.quickTo(w, "opacity", { duration: 0.6, ease: "power3.out" }));
    let raf = 0;
    let mx = -1e4;
    let my = -1e4;
    const update = () => {
      raf = 0;
      words.forEach((w, i) => {
        const b = w.getBoundingClientRect();
        const d = Math.hypot(b.left + b.width / 2 - mx, b.top + b.height / 2 - my);
        const near = Math.exp(-((d / 210) ** 2));
        sc[i](0.9 + near * 0.45);
        op[i](0.5 + near * 0.5);
      });
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onLeave = () => {
      words.forEach((_, i) => {
        sc[i](1);
        op[i](1);
      });
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      ctx.revert();
    };
  }, []);

  // un appui en dehors referme la carte (toucher)
  useEffect(() => {
    if (active === null) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(".wordcloud__w")) setActive(null);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [active]);

  return (
    <div
      ref={root}
      className={`wordcloud${active !== null ? " has-active" : ""}`}
      style={{ height: `${Math.max(38, rows * 15 + 12)}svh` }}
      role="list"
      aria-label={label}
    >
      {placed.map((it, i) => {
        const on = active === i;
        const id = `${uid}-${i}`;
        return (
          <div
            key={it.w}
            role="listitem"
            className="wordcloud__slot"
            data-depth={it.depth}
            style={{ left: `${it.left}%`, top: `${it.top}%`, ["--fs" as string]: `${it.size}rem` }}
          >
            <button
              type="button"
              className={`wordcloud__w${it.craft ? " is-craft" : ""}${it.depth < 0.1 ? " is-faint" : ""}${on ? " is-active" : ""}`}
              aria-expanded={it.detail ? on : undefined}
              aria-describedby={it.detail ? id : undefined}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setActive((a) => (a === i ? null : a))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((a) => (a === i ? null : a))}
              onClick={() => setActive((a) => (a === i ? null : i))}
            >
              <span className="wordcloud__in">
                <span className="wordcloud__label">
                  {!it.craft ? <i aria-hidden="true">/</i> : null}
                  {it.w}
                </span>
                {it.detail ? (
                  <span className="wordcloud__detail" id={id} role="note">
                    {it.detail}
                  </span>
                ) : null}
                <svg className="wordcloud__sun" viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r="6" />
                  {Array.from({ length: 12 }).map((_, k) => (
                    <line key={k} x1="20" y1="3" x2="20" y2="9" transform={`rotate(${k * 30} 20 20)`} />
                  ))}
                </svg>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
