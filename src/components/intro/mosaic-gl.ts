/**
 * OUVERTURE — la mosaïque d'Apollon.
 *
 * La composition de la scène I (paysage, soleil, statue — sans les nuages
 * ajoutés) est recomposée en tesselles de pierre. Chaque tesselle est une
 * petite dalle 3D (géométrie arrondie, épaisseur, relief) rendue en une seule
 * passe par instanciation (InstancedMesh) : quelques milliers de pierres, un
 * seul appel de dessin.
 *
 *   – Lit de pose : un mortier sombre, sur lequel se tracent les lignes du compas.
 *   – Les pierres partent de derrière le spectateur (au-delà de la caméra),
 *     traversent l'espace en courbe (Bézier), tournoient puis se posent à plat,
 *     en ralentissant, chacune à sa place.
 *   – Ordre de pose : le paysage depuis l'horizon, puis le soleil, le contour
 *     de la statue, son corps du socle vers le haut, enfin la tête.
 *   – Opus tessellatum pour le fond, opus vermiculatum (tesselles deux fois plus
 *     fines) pour la statue et le soleil : le visage reste reconnaissable.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type MosaicSource = {
  /** composition de référence (paysage + soleil + statue), en px CSS de la scène */
  image: HTMLCanvasElement;
  /** masque de la statue (alpha) au même format */
  statue: HTMLCanvasElement;
  /** masque du soleil (alpha) */
  sun: HTMLCanvasElement;
  statueBox: { x: number; y: number; w: number; h: number };
  sunCenter: { x: number; y: number };
  horizon: number;
};

export type MosaicOptions = { quality: "high" | "low" };

type Tessera = {
  tx: number; ty: number; sx: number; sy: number; rz: number;
  s: THREE.Vector3; c: THREE.Vector3;
  axis: THREE.Vector3; ang: number;
  delay: number; dur: number;
  done: boolean;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/** Texture de pierre : marbre/travertin, veines et pores (niveaux de gris) */
function stoneTexture() {
  const S = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const c = cv.getContext("2d")!;
  const img = c.createImageData(S, S);
  const grid = (n: number) => Array.from({ length: (n + 1) * (n + 1) }, () => rnd());
  const g1 = grid(8);
  const g2 = grid(32);
  const sample = (g: number[], n: number, x: number, y: number) => {
    const fx = (x / S) * n, fy = (y / S) * n;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const ux = fx - ix, uy = fy - iy;
    const at = (i: number, j: number) => g[(j % (n + 1)) * (n + 1) + (i % (n + 1))];
    return lerp(lerp(at(ix, iy), at(ix + 1, iy), ux), lerp(at(ix, iy + 1), at(ix + 1, iy + 1), ux), uy);
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      let v = 0.8 + (sample(g1, 8, x, y) - 0.5) * 0.18 + (sample(g2, 32, x, y) - 0.5) * 0.12;
      const vein = Math.abs(Math.sin((x * 0.045 + y * 0.02 + sample(g1, 8, y, x) * 6) * 2.2));
      v -= (1 - Math.min(1, vein * 6)) * 0.08;
      if (rnd() < 0.012) v -= 0.18; // pores du travertin
      const k = (y * S + x) * 4;
      const b = Math.round(Math.min(1, Math.max(0, v)) * 255);
      img.data[k] = img.data[k + 1] = img.data[k + 2] = b;
      img.data[k + 3] = 255;
    }
  c.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  // texture de modulation (pas une couleur) : linéaire, pour ne pas assombrir les pierres
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export class Mosaic {
  readonly count: number;
  readonly duration: number;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private mesh: THREE.InstancedMesh;
  private tess: Tessera[] = [];
  private D: number;
  private key: THREE.DirectionalLight;
  private disposables: { dispose: () => void }[] = [];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private qz = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private sc = new THREE.Vector3();
  private Z = new THREE.Vector3(0, 0, 1);

  constructor(canvas: HTMLCanvasElement, private W: number, private H: number, src: MosaicSource, opts: MosaicOptions) {
    seed = 7;
    const high = opts.quality === "high";
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, high ? 1.5 : 1.25));
    this.renderer.setSize(W, H, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x1c1712, 1);

    const fov = 34;
    this.D = H / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    this.camera = new THREE.PerspectiveCamera(fov, W / H, 2, this.D * 8);
    this.camera.position.set(0, 0, this.D);

    /* lumière : ambiance de villa — une lumière rasante dorée révèle les reliefs */
    this.scene.add(new THREE.HemisphereLight(0xf7f4ee, 0x8c8478, 2.9));
    this.key = new THREE.DirectionalLight(0xfff0dc, 0.9);
    this.key.position.set(-W * 0.6, H * 0.7, this.D * 0.55);
    this.scene.add(this.key);
    const rim = new THREE.DirectionalLight(0xbcd0ff, 0.2);
    rim.position.set(W * 0.7, -H * 0.4, this.D * 0.4);
    this.scene.add(rim);

    /* ── échantillonnage de la composition ── */
    const read = (cv: HTMLCanvasElement) => cv.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, cv.width, cv.height).data;
    const px = read(src.image);
    const sm = read(src.statue);
    const sn = read(src.sun);
    const IW = src.image.width;
    const IH = src.image.height;
    const kx = IW / W;
    const ky = IH / H;
    const alpha = (data: Uint8ClampedArray, x: number, y: number) => {
      const ix = Math.min(IW - 1, Math.max(0, Math.round(x * kx)));
      const iy = Math.min(IH - 1, Math.max(0, Math.round(y * ky)));
      return data[(iy * IW + ix) * 4 + 3] / 255;
    };
    const avg = (x: number, y: number, r: number) => {
      let R = 0, G = 0, B = 0, n = 0;
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const ix = Math.min(IW - 1, Math.max(0, Math.round((x + i * r * 0.33) * kx)));
          const iy = Math.min(IH - 1, Math.max(0, Math.round((y + j * r * 0.33) * ky)));
          const k = (iy * IW + ix) * 4;
          R += px[k]; G += px[k + 1]; B += px[k + 2]; n++;
        }
      return [R / n / 255, G / n / 255, B / n / 255];
    };

    // tailles : fond ≈ 1/110 de la largeur (au moins 9 px), statue deux fois plus fine
    // budget mesuré sur un portable (≈ 30 ms/image à 11 000 pierres) : on vise ≈ 6 000
    const coarse = Math.max(high ? 13 : 9, Math.round(Math.max(W, H) / (high ? 100 : 74)));
    const fine = Math.max(5, Math.round(coarse * 0.55));
    const cells: { x: number; y: number; s: number; kind: "land" | "sun" | "edge" | "body" | "head" }[] = [];
    const SB = src.statueBox;
    const inFine = (x: number, y: number) => alpha(sm, x, y) > 0.35 || alpha(sn, x, y) > 0.45;

    // opus tessellatum : rangs décalés d'une demi-pierre, comme une pose à la main
    for (let r = 0, y = coarse / 2; y < H + coarse; r++, y += coarse)
      for (let x = r % 2 ? 0 : coarse / 2; x < W + coarse; x += coarse) {
        if (inFine(x, y)) continue;
        cells.push({ x, y, s: coarse, kind: "land" });
      }
    // opus vermiculatum : la statue et le soleil en pierres fines
    const fx0 = Math.min(SB.x, src.sunCenter.x - H * 0.2);
    const fx1 = Math.max(SB.x + SB.w, src.sunCenter.x + H * 0.2);
    const fy0 = Math.max(0, Math.min(SB.y, src.sunCenter.y - H * 0.2));
    const fy1 = Math.min(H, SB.y + SB.h);
    for (let r = 0, y = fy0 + fine / 2; y < fy1 + fine; r++, y += fine)
      for (let x = fx0 + (r % 2 ? fine / 2 : 0); x < fx1 + fine; x += fine) {
        const st = alpha(sm, x, y);
        if (st > 0.35) {
          const edge = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([i, j]) => alpha(sm, x + i * fine * 1.5, y + j * fine * 1.5) < 0.35);
          const head = y < SB.y + SB.h * 0.16;
          cells.push({ x, y, s: fine, kind: head ? "head" : edge ? "edge" : "body" });
        } else if (alpha(sn, x, y) > 0.45) cells.push({ x, y, s: fine, kind: "sun" });
      }
    this.count = cells.length;

    /* ── géométrie, matière ── */
    const geo = new RoundedBoxGeometry(1, 1, 0.42, 1, 0.14); // 1 segment : arêtes adoucies au moindre coût
    const tex = stoneTexture();
    const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 1.6, roughness: 0.58, metalness: 0 });
    // chaque pierre prend un morceau différent de la texture (veines jamais identiques)
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
        vec2 tOff = fract(vec2(float(gl_InstanceID) * 0.6180339, float(gl_InstanceID) * 0.4142136));
        #ifdef USE_MAP
          vMapUv = vMapUv * 0.35 + tOff;
        #endif
        #ifdef USE_BUMPMAP
          vBumpMapUv = vBumpMapUv * 0.35 + tOff;
        #endif`,
      );
    };
    this.disposables.push(geo, tex, mat);
    this.mesh = new THREE.InstancedMesh(geo, mat, this.count);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.mesh);

    /* lit de pose : mortier */
    const bed = new THREE.Mesh(
      new THREE.PlaneGeometry(W * 1.2, H * 1.2),
      new THREE.MeshStandardMaterial({ color: 0x3a3027, map: tex, roughness: 1 }),
    );
    bed.position.z = -coarse * 0.2;
    this.scene.add(bed);
    this.disposables.push(bed.geometry, bed.material as THREE.Material);

    /* ── chaque pierre : couleur, taille, trajectoire, ordre ── */
    const color = new THREE.Color();
    const maxH = Math.max(src.horizon, H - src.horizon);
    let last = 0;
    cells.forEach((cell, i) => {
      const [r, g, b] = avg(cell.x, cell.y, cell.s);
      // nuance minérale : légère désaturation + variation propre à chaque pierre
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      const v = (0.94 + rnd() * 0.12) * 1.3; // compense l'ombrage des joints et du relief
      const sat = cell.kind === "land" ? 0.86 : 0.92;
      color.setRGB(lerp(l, r, sat) * v, lerp(l, g, sat) * v, lerp(l, b, sat) * v, THREE.SRGBColorSpace);
      this.mesh.setColorAt(i, color);

      const tx = cell.x - W / 2 + (rnd() - 0.5) * cell.s * 0.1;
      const ty = H / 2 - cell.y + (rnd() - 0.5) * cell.s * 0.1;
      // départ : derrière le spectateur, réparti autour de l'axe ; quelques pierres frôlent la caméra
      const close = rnd() < 0.06;
      const spread = close ? 0.12 : 0.5 + rnd() * 0.9;
      const ang = rnd() * Math.PI * 2;
      const s = new THREE.Vector3(
        close ? Math.cos(ang) * W * spread : tx * (1.3 + rnd()) + Math.cos(ang) * W * spread,
        close ? Math.sin(ang) * H * spread : ty * (1.3 + rnd()) + Math.sin(ang) * H * spread,
        this.D * (1.12 + rnd() * 0.7),
      );
      const c = new THREE.Vector3(lerp(s.x, tx, close ? 0.4 : 0.75), lerp(s.y, ty, close ? 0.4 : 0.75), this.D * (close ? 0.82 : 0.25 + rnd() * 0.3));

      let delay = 0;
      let dur = 1.45 + rnd() * 0.6;
      switch (cell.kind) {
        case "land":
          delay = 0.35 + 1.7 * (Math.abs(cell.y - src.horizon) / maxH) + rnd() * 0.45;
          break;
        case "sun":
          delay = 1.35 + 0.5 * (Math.hypot(cell.x - src.sunCenter.x, cell.y - src.sunCenter.y) / (H * 0.2)) + rnd() * 0.25;
          break;
        case "edge":
          delay = 2.0 + 0.6 * (1 - (cell.y - SB.y) / SB.h) + rnd() * 0.2;
          break;
        case "body":
          delay = 2.45 + 1.0 * (1 - (cell.y - SB.y) / SB.h) + rnd() * 0.3;
          break;
        case "head":
          delay = 3.45 + rnd() * 0.45;
          dur = 1.3 + rnd() * 0.3;
          break;
      }
      delay *= 0.85; // rythme : pose complète en ≈ 5 s
      last = Math.max(last, delay + dur);
      const k = 0.9 + rnd() * 0.06; // joint fin : la pierre n'occupe pas toute sa case
      this.tess.push({
        tx, ty,
        sx: cell.s * k * (0.94 + rnd() * 0.1),
        sy: cell.s * k * (0.94 + rnd() * 0.1),
        rz: (rnd() - 0.5) * 0.12,
        s, c,
        axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        ang: 2 + rnd() * 4,
        delay, dur,
        done: false,
      });
    });
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    // pose terminée, puis lumière rasante, caméra qui se règle, révélation de l'image
    this.duration = last;
    this.update(0);
  }

  /** Positionne toutes les pierres à l'instant t (secondes) */
  update(t: number) {
    const { m, q, qz, p, sc, Z } = this;
    for (let i = 0; i < this.tess.length; i++) {
      const T = this.tess[i];
      const u = clamp01((t - T.delay) / T.dur);
      if (u >= 1 && T.done) continue;
      T.done = u >= 1;
      const e = 1 - Math.pow(1 - u, 3); // ralentit à l'approche
      const a = (1 - e) * (1 - e);
      const b = 2 * (1 - e) * e;
      const c = e * e;
      p.set(a * T.s.x + b * T.c.x + c * T.tx, a * T.s.y + b * T.c.y + c * T.ty, a * T.s.z + b * T.c.z);
      q.setFromAxisAngle(T.axis, T.ang * (1 - e) * (1 - e));
      qz.setFromAxisAngle(Z, T.rz);
      q.premultiply(qz);
      const thick = Math.min(T.sx, T.sy);
      sc.set(T.sx, T.sy, thick);
      m.compose(p, q, sc);
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Caméra et lumière (réglage final, balayage rasant) */
  stage(cam: number, light: number) {
    this.camera.position.set(lerp(this.W * 0.03, 0, cam), lerp(-this.H * 0.02, 0, cam), this.D * lerp(1.07, 1, cam));
    this.camera.lookAt(0, 0, 0);
    this.key.position.set(lerp(-this.W * 0.8, this.W * 0.7, light), this.H * 0.7, this.D * lerp(0.5, 0.3, Math.sin(light * Math.PI)));
    this.key.intensity = 0.9 + Math.sin(light * Math.PI) * 0.7;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.mesh.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
