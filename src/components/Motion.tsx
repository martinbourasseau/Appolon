"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionLevel } from "@/lib/motion-env";

gsap.registerPlugin(ScrollTrigger);

/**
 * Chef d'orchestre des mouvements, déclarés dans le HTML :
 *
 *  data-hero-*          Scène I : plans du hero (ciel, soleil, nuages, statue…)
 *  data-opener          Ouvertures : arche, image, grand titre, tracés du canon
 *  data-reveal          Apparitions (="lines" | ="stagger")
 *  data-depth="0.15"    Parallaxe verticale (positif = plus lent que la page)
 *  data-draw            Traits SVG qui se dessinent
 *  data-code, data-strata   Scène III
 *  data-gallery         Scène V : galerie horizontale
 *  data-steps           Scène VI : séquence en cinq temps
 *
 * Principes : uniquement transform / opacity / clip-path ; la mise en
 * scène fixe repose sur position: sticky (CSS), ScrollTrigger ne fournit
 * que la progression. prefers-reduced-motion → rien n'est animé, tout
 * est visible. Appareils modestes → amplitudes réduites de moitié.
 */

const EASE_OUT = "power3.out";
const EASE_SOFT = "sine.inOut";

function prepareDraw(paths: SVGGeometryElement[]) {
  paths.forEach((p) => {
    const len = Math.ceil(p.getTotalLength?.() ?? 2000);
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
  });
}

export function Motion() {
  useEffect(() => {
    const level = motionLevel();
    const root = document.documentElement;
    if (level === "reduced") {
      root.dataset.motion = "reduced";
      return;
    }
    root.dataset.motion = level;
    const k = level === "lite" ? 0.5 : 1; // amplitude

    const mm = gsap.matchMedia();

    mm.add({ desktop: "(min-width: 769px)", mobile: "(max-width: 768px)" }, (ctx) => {
      const { desktop } = ctx.conditions as { desktop: boolean; mobile: boolean };

      /* ── SCÈNE I : entrée puis défilement ─────────────────────── */
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      if (hero) {
        const q = gsap.utils.selector(hero);
        // l'entrée est confiée à l'ouverture WebGL (ApolloIntro) quand elle est active
        if (!root.dataset.intro) gsap
          .timeline({ defaults: { ease: EASE_OUT } })
          .from(q("[data-hero-sky]"), { opacity: 0, scale: 1.18, duration: 2.2, ease: "power2.out" }, 0)
          .from(q("[data-hero-sun]"), { opacity: 0, yPercent: 30, duration: 2.4 }, 0.2)
          .from(q(".hero__word .ch"), { yPercent: 110, opacity: 0, duration: 1.4, stagger: 0.07 }, 0.35)
          .from(q(".hero__kicker"), { opacity: 0, y: 12, duration: 1 }, 0.9)
          .from(q("[data-hero-statue]"), { opacity: 0, yPercent: 6, scale: 1.04, duration: 2, ease: "power2.out" }, 0.5)
          .from(q("[data-hero-cloud]"), { opacity: 0, duration: 2 }, 0.8)
          .from(q(".hero__cue"), { opacity: 0, duration: 1 }, 1.6);

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.6 },
          })
          .to(q("[data-hero-sky]"), { scale: 1 - 0.06 * k, yPercent: -6 * k }, 0)
          .to(q("[data-hero-light]"), { opacity: 0.85 }, 0)
          .to(q("[data-hero-sun]"), { yPercent: -45 * k, rotate: 30, scale: 1 + 0.12 * k }, 0)
          .to(q("[data-hero-cloud='far']"), { xPercent: 35 * k }, 0)
          .to(q("[data-hero-cloud='near']"), { xPercent: -70 * k, yPercent: -40 * k }, 0)
          .to(q("[data-hero-title]"), { yPercent: -18 * k, scale: 0.94 }, 0)
          .to(q(".hero__word"), { opacity: 0.28, ease: EASE_SOFT }, 0.35)
          .to(q("[data-hero-statue]"), { scale: 1 + 0.08 * k, yPercent: -3 * k }, 0)
          .to(q(".hero__cue"), { opacity: 0, duration: 0.1 }, 0)
          .fromTo(q("[data-hero-copy]"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.25 }, 0.3)
          .to(q("[data-hero-copy]"), { opacity: 0, y: -30, duration: 0.2 }, 0.8);
      }

      /* ── OUVERTURES : arche → image → titre → canon ────────────── */
      gsap.utils.toArray<HTMLElement>("[data-opener]").forEach((op) => {
        const q = gsap.utils.selector(op);
        const lines = Array.from(op.querySelectorAll<SVGGeometryElement>(".opener__canon [data-draw]"));
        prepareDraw(lines);
        const archFrom = desktop
          ? "inset(14% 32% 0% 32% round 50vw 50vw 0px 0px)"
          : "inset(18% 12% 0% 12% round 50vw 50vw 0px 0px)";
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: op, start: "top 85%", end: "bottom bottom", scrub: 0.6 },
          })
          .fromTo(q("[data-arch]"), { clipPath: archFrom }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", duration: 0.55, ease: "power1.inOut" }, 0)
          .fromTo(q("[data-opener-img]"), { scale: 1 + 0.25 * k, yPercent: 6 * k }, { scale: 1, yPercent: -3 * k, duration: 1 }, 0)
          .fromTo(q(".opener__title .ch"), { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.025, duration: 0.3, ease: EASE_OUT }, 0.32)
          .fromTo(q(".opener__kicker"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.2 }, 0.45)
          .to(lines, { strokeDashoffset: 0, stagger: 0.03, duration: 0.35 }, 0.55);
      });

      /* ── APPARITIONS ──────────────────────────────────────────── */
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        if (el.closest("[data-opener]")) return; // géré par l'ouverture
        const mode = el.dataset.reveal;
        const targets = mode === "stagger" ? Array.from(el.children) : el;
        gsap.from(targets, {
          opacity: 0,
          y: mode === "lines" ? 36 : 28,
          duration: mode === "lines" ? 1.4 : 1.1,
          ease: EASE_OUT,
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        });
      });

      /* ── PARALLAXE ─────────────────────────────────────────────── */
      gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((el) => {
        const depth = parseFloat(el.dataset.depth ?? "0") * k;
        gsap.fromTo(
          el,
          { y: () => depth * window.innerHeight * 0.5 },
          {
            y: () => -depth * window.innerHeight * 0.5,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
          },
        );
      });

      /* ── CANON hors ouvertures (atelier) ───────────────────────── */
      gsap.utils.toArray<SVGSVGElement>(".atelier__canon").forEach((svg) => {
        const lines = Array.from(svg.querySelectorAll<SVGGeometryElement>("[data-draw]"));
        prepareDraw(lines);
        gsap.to(lines, {
          strokeDashoffset: 0,
          ease: "none",
          stagger: 0.05,
          scrollTrigger: { trigger: svg, start: "top 80%", end: "bottom 40%", scrub: 0.8 },
        });
      });

      /* ── SCÈNE III : code et strates ───────────────────────────── */
      document.querySelectorAll<HTMLElement>("[data-code]").forEach((el) => {
        gsap.from(el.querySelectorAll("[data-code-line]"), {
          opacity: 0,
          x: -12,
          stagger: 0.07,
          duration: 0.6,
          ease: EASE_OUT,
          scrollTrigger: { trigger: el, start: "top 75%", once: true },
        });
      });
      document.querySelectorAll<HTMLElement>("[data-strata]").forEach((el) => {
        gsap.from(el.querySelectorAll("[data-stratum]"), {
          opacity: 0,
          y: 30,
          stagger: 0.15,
          duration: 0.9,
          ease: EASE_OUT,
          scrollTrigger: { trigger: el, start: "top 75%", once: true },
        });
      });

      /* ── SCÈNE V : galerie horizontale (ordinateur) ────────────── */
      if (desktop) {
        document.querySelectorAll<HTMLElement>("[data-gallery]").forEach((g) => {
          const track = g.querySelector<HTMLElement>("[data-gallery-track]");
          if (!track) return;
          const travel = () => Math.max(0, track.scrollWidth - window.innerWidth);
          const setHeight = () => (g.style.height = `${window.innerHeight + travel()}px`);
          setHeight();
          gsap.to(track, {
            x: () => -travel(),
            ease: "none",
            scrollTrigger: {
              trigger: g,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.6,
              invalidateOnRefresh: true,
              onRefreshInit: setHeight,
            },
          });
        });
      }

      /* ── SCÈNE VI : les cinq temps ─────────────────────────────── */
      document.querySelectorAll<HTMLElement>("[data-steps]").forEach((s) => {
        const steps = Array.from(s.querySelectorAll<HTMLElement>("[data-step]"));
        const count = s.querySelector<HTMLElement>("[data-steps-count]");
        const lines = Array.from(s.querySelectorAll<SVGGeometryElement>(".steps__canon [data-draw]"));
        prepareDraw(lines);
        s.dataset.live = "true";
        let current = -1;
        const setStep = (i: number) => {
          if (i === current) return;
          current = i;
          steps.forEach((el, j) => el.toggleAttribute("data-active", j === i));
          steps.forEach((el, j) => el.toggleAttribute("data-past", j < i));
          if (count) count.textContent = String(i + 1);
        };
        setStep(0);
        gsap.to(lines, {
          strokeDashoffset: 0,
          ease: "none",
          stagger: 0.08,
          scrollTrigger: {
            trigger: s,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            onUpdate: (st) => setStep(Math.min(steps.length - 1, Math.floor(st.progress * steps.length))),
          },
        });
      });

      return () => {
        document.querySelectorAll<HTMLElement>("[data-gallery]").forEach((g) => (g.style.height = ""));
        document.querySelectorAll<HTMLElement>("[data-steps]").forEach((s) => delete s.dataset.live);
      };
    });

    // les images modifient les hauteurs : recalcul une fois tout chargé
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
      delete root.dataset.motion;
    };
  }, []);

  return null;
}
