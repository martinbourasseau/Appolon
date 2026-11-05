"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionLevel } from "@/lib/motion-env";

gsap.registerPlugin(ScrollTrigger);

/**
 * Défilement adouci (Lenis), synchronisé avec ScrollTrigger sur la boucle
 * unique de gsap.ticker. Désactivé si l'utilisateur préfère moins de
 * mouvement ; le défilement natif reste alors intact.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (motionLevel() === "reduced") return;
    const lenis = new Lenis({ lerp: 0.1, anchors: true, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
