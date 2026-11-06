"use client";

import { useEffect, useRef } from "react";
import { motionLevel } from "@/lib/motion-env";

/**
 * Étoiles scintillantes — réservé à la zone bleue (scène III).
 * Un seul canvas, rendu uniquement quand la scène est visible,
 * figé (sans scintillement) si l'utilisateur préfère moins de mouvement.
 */
export function StarField({ density = 0.00018, className = "" }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const level = motionLevel();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    type Star = { x: number; y: number; r: number; p: number; s: number; c: string };
    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    const palette = ["#ffffff", "#e6f0ff", "#bcd6ff", "#9fe8ff", "#f4e3b0"];

    const seed = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const n = Math.round(w * h * density * (level === "lite" ? 0.6 : 1));
      stars = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.08 ? 1.4 + Math.random() * 1.2 : 0.4 + Math.random() * 0.8,
        p: Math.random() * Math.PI * 2,
        s: 0.6 + Math.random() * 1.8,
        // l'or reste rare : une étoile sur quarante
        c: i % 40 === 0 ? palette[4] : palette[Math.floor(Math.random() * 4)],
      }));
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = level === "reduced" ? 0.8 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.p + t * 0.001 * s.s));
        ctx.globalAlpha = a;
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.4) {
          // petite croix de lumière sur les étoiles brillantes
          ctx.globalAlpha = a * 0.45;
          ctx.fillRect(s.x - s.r * 4, s.y - 0.4, s.r * 8, 0.8);
          ctx.fillRect(s.x - 0.4, s.y - s.r * 4, 0.8, s.r * 8);
        }
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let visible = false;
    const loop = (t: number) => {
      draw(t);
      if (visible && level !== "reduced") raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    const ro = new ResizeObserver(() => {
      seed();
      draw(performance.now());
    });
    seed();
    draw(0);
    io.observe(canvas);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [density]);

  return <canvas ref={ref} className={`starfield ${className}`} aria-hidden="true" />;
}
