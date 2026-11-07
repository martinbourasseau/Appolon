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

type Pose = { scale: number; x?: number; y?: number; rotate?: number };

/** Bord de papier déchiré (polygone à nombre de points fixe → interpolable) */
const TEAR = Array.from({ length: 23 }, (_, i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1);
function torn(base: number) {
  const pts = TEAR.map((r, i) => `${((i + 1) / 24) * 100}% ${base + (r - 0.5) * 7 + (i % 2 ? 2.2 : -1.4)}%`);
  return `polygon(0% ${base}%, ${pts.join(", ")}, 100% ${base}%, 100% 120%, 0% 120%)`;
}

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
          .to(q("[data-hero-copy]"), { opacity: 0, y: -30, duration: 0.12 }, 0.5);
        // sans le passage par le feu (WebGL indisponible) : sortie par la lumière du soleil
        if (!root.dataset.burn)
          gsap.fromTo(q("[data-hero-flare]"), { opacity: 0, scale: 0.3 }, {
            opacity: 1, scale: 1, ease: "power2.in",
            scrollTrigger: { trigger: hero, start: "80% bottom", end: "bottom bottom", scrub: 0.6 },
          });
      }

      /* ── OUVERTURES : chaque scène a sa propre révélation ──────────
       *  arch     arche qui s'ouvre (II)
       *  iris     lunette astronomique qui s'élargit (III, nuit)
       *  shutters volets de marbre cannelés qui se lèvent en décalé (IV)
       *  torn     le tableau monte derrière un bord de papier déchiré (V)
       *  golden   rectangle d'or qui se déploie depuis un angle (VI)
       *  sun      disque solaire qui se lève depuis l'horizon (VII)
       * puis : caméra (dolly / travelling), titre lettre à lettre, canon,
       * plans découpés en profondeur, et sortie sous la page qui monte. */
      gsap.utils.toArray<HTMLElement>("[data-opener]").forEach((op) => {
        const q = gsap.utils.selector(op);
        // la scène II arrive par le feu (BurnTransition) : son tableau est déjà plein écran
        const burnIn = Boolean(root.dataset.burn) && op.closest("#concevoir") !== null;
        const kind = burnIn ? "none" : op.dataset.revealKind ?? "arch";
        const lines = Array.from(op.querySelectorAll<SVGGeometryElement>(".opener__canon [data-draw]"));
        prepareDraw(lines);
        const cam = op.dataset.cam ? (JSON.parse(op.dataset.cam) as { from: Pose; to: Pose }) : null;
        const from = cam?.from ?? { scale: 1.25, y: 6 };
        const to = cam?.to ?? { scale: 1, y: -3 };
        const amp = (v = 0) => v * k * (desktop ? 1 : 0.5);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: op, start: burnIn ? "top top" : "top 85%", end: "bottom bottom", scrub: 0.6 },
        });

        const arch = q("[data-arch]");
        const R = { duration: 0.55, ease: "power1.inOut" };
        switch (kind) {
          case "iris":
            tl.fromTo(arch, { clipPath: "circle(9% at 50% 42%)" }, { clipPath: "circle(76% at 50% 50%)", ...R, ease: "power2.in" }, 0);
            break;
          case "sun":
            tl.fromTo(arch, { clipPath: "circle(5% at 50% 96%)" }, { clipPath: "circle(125% at 50% 96%)", ...R, ease: "power2.in" }, 0);
            break;
          case "golden":
            tl.fromTo(
              arch,
              { clipPath: desktop ? "inset(38.2% 0% 0% 61.8% round 70vh 0px 0px 0px)" : "inset(38.2% 0% 0% 38.2% round 60vw 0px 0px 0px)" },
              { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ...R },
              0,
            );
            break;
          case "torn":
            tl.fromTo(arch, { clipPath: torn(104) }, { clipPath: torn(-8), ...R, ease: "power2.inOut" }, 0);
            break;
          case "none":
            gsap.set(arch, { clipPath: "none" });
            // les plans découpés entrent en douceur après le relais
            tl.fromTo(q("[data-layer-depth]"), { opacity: 0 }, { opacity: 1, duration: 0.25, stagger: 0.04 }, 0.06);
            break;
          case "shutters":
            gsap.set(arch, { clipPath: "none" });
            tl.fromTo(q("[data-shutter]"), { scaleY: 1 }, { scaleY: 0, duration: 0.42, ease: "power2.inOut", stagger: { each: 0.035, from: "center" } }, 0.02);
            break;
          default: {
            const archFrom = desktop
              ? "inset(14% 32% 0% 32% round 50vw 50vw 0px 0px)"
              : "inset(18% 12% 0% 12% round 50vw 50vw 0px 0px)";
            tl.fromTo(arch, { clipPath: archFrom }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ...R }, 0);
          }
        }

        // caméra : dolly / travelling / roulis, propre à chaque tableau
        tl.fromTo(
          q("[data-opener-img]"),
          { scale: 1 + (from.scale - 1) * k, xPercent: amp(from.x), yPercent: amp(from.y), rotate: amp(from.rotate) },
          { scale: 1 + (to.scale - 1) * k, xPercent: amp(to.x), yPercent: amp(to.y), rotate: amp(to.rotate), duration: 1 },
          0,
        );

        // petit écran : travelling sur toute la largeur du tableau, rien n'est sacrifié
        const pan = op.dataset.pan?.split(",").map(Number);
        const painting = op.querySelector<HTMLImageElement>(".opener__painting");
        if (!desktop && pan && painting) {
          const y = (painting.style.objectPosition || "50% 50%").split(" ")[1] ?? "50%";
          tl.fromTo(painting, { objectPosition: `${pan[0]}% ${y}` }, { objectPosition: `${pan[1]}% ${y}`, duration: 1 }, 0);
        }

        // transition par la lumière : un voile lumineux traverse le tableau pendant qu'il s'ouvre
        const light = q("[data-opener-light]");
        if (kind === "none") {
          // pas de voile lumineux : le feu vient de passer
        } else if (kind === "iris") {
          tl.fromTo(light, { opacity: 0, scale: 0.4 }, { opacity: 0.75, scale: 1, duration: 0.22, ease: "power2.out" }, 0.08).to(light, { opacity: 0, scale: 1.6, duration: 0.3 }, 0.3);
        } else {
          tl.fromTo(light, { opacity: 0, xPercent: -60 }, { opacity: 0.85, xPercent: 0, duration: 0.25, ease: "sine.in" }, 0.12).to(light, { opacity: 0, xPercent: 60, duration: 0.3, ease: "sine.out" }, 0.37);
        }

        /* Typographie, d'après la référence : le grand titre naît au pied du tableau,
         * puis monte à travers l'image (plus vite que le décor) et laisse la place
         * au chapeau, qui s'élève à son tour sur le tableau. */
        const tStart = burnIn ? 0.12 : 0.45;
        if (burnIn) gsap.set(q(".opener__title .ch"), { yPercent: 0, opacity: 1 });
        else tl.fromTo(q(".opener__title .ch"), { yPercent: 105, opacity: 0, rotate: 4 }, { yPercent: 0, opacity: 1, rotate: 0, stagger: 0.025, duration: 0.3, ease: EASE_OUT }, 0.32);
        tl.to(q(".opener__title"), { y: () => -window.innerHeight * (desktop ? 0.5 : 0.42), duration: 0.5, ease: "power1.in" }, tStart);
        const lead = q("[data-opener-lead]");
        if (lead.length) {
          tl.fromTo(lead, { y: () => window.innerHeight * 0.22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.24, ease: EASE_OUT }, tStart + 0.18);
          // petit écran : décors et crédit s'effacent pour laisser lire le chapeau
          if (!desktop) tl.to(q(".layer--front, .opener__credit"), { opacity: 0.2, duration: 0.15 }, tStart + 0.14);
        }
        tl
          .fromTo(q(".opener__kicker"), { opacity: 0, y: 16, letterSpacing: "0.5em" }, { opacity: 1, y: 0, letterSpacing: "0.26em", duration: 0.25 }, 0.42)
          .to(lines, { strokeDashoffset: 0, stagger: 0.03, duration: 0.35 }, 0.55);

        // plans découpés : chacun glisse selon sa profondeur, pendant toute l'ouverture
        const vh = window.innerHeight;
        op.querySelectorAll<HTMLElement>("[data-layer-depth]").forEach((el) => {
          const d = parseFloat(el.dataset.layerDepth ?? "0") * k * (desktop ? 1 : 0.6);
          gsap.fromTo(
            el,
            { y: d * vh * 0.55 },
            { y: -d * vh * 0.55, ease: "none", scrollTrigger: { trigger: op, start: "top bottom", end: "bottom top", scrub: 0.8 } },
          );
        });

        // sortie : la page (bord de papier) monte sur le tableau, qui recule et s'assombrit
        const body = op.nextElementSibling as HTMLElement | null;
        if (body) {
          gsap
            .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: body, start: "top bottom", end: "top 15%", scrub: 0.6 } })
            .to(q("[data-opener-shade]"), { opacity: 1 }, 0)
            .to(q(".opener__arch"), { scale: 0.94, yPercent: -6 * k, transformOrigin: "50% 0%" }, 0)
            .to(q(".opener__title, .opener__kicker, [data-opener-lead]"), { yPercent: -40 * k, opacity: 0 }, 0);
        }
      });

      /* ── III → IV : l'aube ───────────────────────────────────── */
      document.querySelectorAll<HTMLElement>("[data-dawn]").forEach((d) => {
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: d, start: "top bottom", end: "bottom bottom", scrub: 0.6 } })
          .fromTo(d.querySelector(".dawn__stars"), { opacity: 1 }, { opacity: 0 }, 0)
          .fromTo(d.querySelector("[data-dawn-sun]"), { yPercent: 60, scale: 0.6, opacity: 0 }, { yPercent: 0, scale: 1.25, opacity: 1 }, 0.15);
      });

      /* ── II : maquettes en éventail, en perspective ───────────── */
      document.querySelectorAll<HTMLElement>("[data-atelier]").forEach((a) => {
        const frames = a.querySelectorAll<HTMLElement>(".atelier__frame");
        frames.forEach((f, i) => {
          const dir = i % 2 ? 1 : -1;
          gsap.fromTo(
            f,
            { rotationY: dir * 28 * k, rotationX: 14 * k, z: -160 * k, opacity: 0.2 },
            { rotationY: dir * -6 * k, rotationX: 0, z: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: a, start: "top 90%", end: "center 45%", scrub: 0.8 } },
          );
        });
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

    // boucles CSS (.anim-*) actives seulement pour les scènes visibles
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => ((e.target as HTMLElement).dataset.inview = e.isIntersecting ? "1" : "0")),
      { rootMargin: "20% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-scene]").forEach((el) => io.observe(el));

    // les hauteurs changent (galerie, images, atelier 3D) : recalcul des positions.
    // `load` a pu passer avant ce montage → recalcul immédiat, puis à chaque
    // changement réel de hauteur de la page (débouncé).
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    requestAnimationFrame(refresh);
    let lastH = document.body.scrollHeight;
    let rt = 0;
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      window.clearTimeout(rt);
      rt = window.setTimeout(refresh, 150);
    });
    ro.observe(document.body);

    return () => {
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(rt);
      window.removeEventListener("load", refresh);
      mm.revert();
      delete root.dataset.motion;
    };
  }, []);

  return null;
}
