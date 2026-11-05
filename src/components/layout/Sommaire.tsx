"use client";

import { useEffect, useRef } from "react";
import { scenes } from "@/content/scenes";

/**
 * Sommaire des sept scènes.
 *  - Pendant le hero : une frise horizontale sous la statue (data-mode="frise").
 *  - Ensuite : un rail vertical fixé à gauche, scène active soulignée
 *    (data-mode="rail").
 *  - Sur mobile : une pastille « II / VII · L'art de concevoir » qui ouvre
 *    la liste complète.
 * L'état est porté par des attributs DOM (pas de re-rendu React au défilement).
 */
export function Sommaire() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("[data-scene-link]"));
    const chip = nav.querySelector<HTMLElement>("[data-chip-label]");
    const sections = scenes
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const setActive = (id: string) => {
      const index = scenes.findIndex((s) => s.id === id);
      links.forEach((a) => {
        if (a.dataset.sceneLink === id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      if (chip && index >= 0) chip.textContent = `${scenes[index].numeral} / VII · ${scenes[index].nav}`;
      nav.dataset.mode = id === "apparition" ? "frise" : "rail";
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      // une scène devient active quand elle traverse le milieu de l'écran
      { rootMargin: "-50% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const close = () => ref.current?.removeAttribute("data-open");

  return (
    <nav ref={ref} className="sommaire" data-mode="frise" aria-label="Sommaire des scènes">
      <button
        type="button"
        className="sommaire__chip"
        aria-label="Ouvrir le sommaire"
        onClick={() => {
          const n = ref.current;
          if (!n) return;
          if (n.hasAttribute("data-open")) n.removeAttribute("data-open");
          else n.setAttribute("data-open", "");
        }}
      >
        <span data-chip-label>I / VII · L&apos;apparition</span>
      </button>
      <ol className="sommaire__list">
        {scenes.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} data-scene-link={s.id} onClick={close}>
              <span className="sommaire__num">{s.numeral}</span>
              <span className="sommaire__name">{s.nav}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
