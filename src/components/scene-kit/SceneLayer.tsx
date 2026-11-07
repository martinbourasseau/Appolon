import Image from "next/image";
import type { CSSProperties } from "react";
import type { Layer } from "@/content/scenes";

/**
 * Un plan découpé de la composition (collage en profondeur).
 *
 * Trois niveaux d'éléments, pour ne jamais mélanger les transformations :
 *   .layer        position + parallaxe au défilement (GSAP, data-layer-depth / data-depth)
 *   .layer__flip  miroir éventuel
 *   .layer__img   petite animation continue (CSS : flotter, se balancer…)
 */
export function SceneLayer({ layer, inOpener = false, sizes = "40vw" }: { layer: Layer; inOpener?: boolean; sizes?: string }) {
  const mobile = Object.entries(layer.m ?? {}) as [string, string][];
  const style: CSSProperties = {
    ...(layer.style as CSSProperties),
    ...Object.fromEntries(mobile.map(([k, v]) => [`--m-${k}`, v])),
    ...(layer.opacity !== undefined ? { opacity: layer.opacity } : null),
    ...(layer.blend ? { mixBlendMode: layer.blend } : null),
  };
  const depthAttr = layer.depth !== undefined ? String(layer.depth) : undefined;
  const cls = [
    "layer",
    layer.cover ? "layer--cover" : "",
    layer.front ? "layer--front" : "",
    layer.desktopOnly ? "layer--desktop" : "",
    layer.silhouette ? "layer--silhouette" : "",
    layer.feather ? "layer--feather" : "",
    layer.fade ? `layer--fade-${layer.fade}` : "",
    ...mobile.map(([k]) => `layer--m-${k}`),
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={cls}
      style={style}
      aria-hidden="true"
      {...(inOpener ? { "data-layer-depth": depthAttr } : { "data-depth": depthAttr })}
    >
      <span className={`layer__flip${layer.flip ? " is-flipped" : ""}${layer.turn ? " is-turned" : ""}`}>
        <Image
          src={layer.src}
          alt=""
          width={layer.w}
          height={layer.h}
          sizes={layer.cover ? "100vw" : sizes}
          className={`layer__img${layer.anim ? ` anim-${layer.anim}` : ""}`}
          style={edgeMask(layer.edges)}
        />
      </span>
    </div>
  );
}

/** Fond les bords droits d'un découpage : l'élément paraît entier, sans tranche */
function edgeMask(edges?: Layer["edges"]): CSSProperties | undefined {
  if (!edges?.length) return undefined;
  const to = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;
  const g = edges.map((e) => `linear-gradient(to ${to[e]}, transparent 0%, #000 16%)`).join(", ");
  return { maskImage: g, WebkitMaskImage: g, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
}

/** Éléments animés posés sur les côtés du contenu d'une scène */
export function SceneDecor({ items }: { items?: Layer[] }) {
  if (!items?.length) return null;
  return (
    <div className="scene-decor" aria-hidden="true">
      {items.map((l, i) => (
        <SceneLayer key={i} layer={l} sizes="30vw" />
      ))}
    </div>
  );
}
