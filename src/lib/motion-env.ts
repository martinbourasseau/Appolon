/**
 * Niveau d'animation :
 *  - "reduced" : préférence système (prefers-reduced-motion)
 *  - "lite"    : appareil modeste ou économie de données → intensités réduites
 *  - "full"    : expérience complète
 * Forçage manuel pour les tests : ?motion=full | lite | reduced
 */
export type MotionLevel = "full" | "lite" | "reduced";

type NavigatorExtras = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

export function motionLevel(): MotionLevel {
  if (typeof window === "undefined") return "full";
  const forced = new URLSearchParams(window.location.search).get("motion");
  if (forced === "full" || forced === "lite" || forced === "reduced") return forced;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
  const nav = navigator as NavigatorExtras;
  if (nav.connection?.saveData || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4) return "lite";
  return "full";
}
