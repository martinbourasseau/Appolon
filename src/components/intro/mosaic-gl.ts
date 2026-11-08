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
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

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
  mi: number; li: number;
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

/**
 * Formes de tesselles taillées « à la main » : quadrilatères irréguliers,
 * trapèzes presque triangulaires, pentagones. Extrudées avec un biseau
 * (arêtes adoucies, relief), normalisées dans un carré unité.
 */
function tesseraShapes(n: number) {
  const out: THREE.BufferGeometry[] = [];
  for (let k = 0; k < n; k++) {
    const kind = k % 5 === 4 ? "penta" : k % 5 === 3 ? "trap" : "quad";
    let pts: [number, number][];
    if (kind === "penta") {
      pts = Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + rnd() * 0.4;
        const r = 0.5 + (rnd() - 0.5) * 0.14;
        return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
      });
    } else if (kind === "trap") {
      const top = 0.12 + rnd() * 0.3; // côté supérieur très court : presque un triangle
      pts = [[-0.5, -0.5], [0.5, -0.5 + (rnd() - 0.5) * 0.1], [top / 2 + (rnd() - 0.5) * 0.2, 0.5], [-top / 2 + (rnd() - 0.5) * 0.2, 0.5]];
    } else {
      const j = () => (rnd() - 0.5) * 0.24;
      pts = [[-0.5 + j(), -0.5 + j()], [0.5 + j(), -0.5 + j()], [0.5 + j(), 0.5 + j()], [-0.5 + j(), 0.5 + j()]];
    }
    // normalisation dans [-0.5, 0.5] (le biseau est déduit)
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const sx = 0.93 / (Math.max(...xs) - Math.min(...xs));
    const sy = 0.93 / (Math.max(...ys) - Math.min(...ys));
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2((x - cx) * sx, (y - cy) * sy)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.06, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, -0.2);
    g.computeVertexNormals();
    out.push(g);
  }
  return out;
}

/** Palette finie de pierres (k-moyennes) : un mosaïste choisit parmi des tesselles taillées */
function palette(colors: number[][], k: number) {
  const C = Array.from({ length: k }, (_, i) => [...colors[Math.floor((i / k) * colors.length)]]);
  const assign = new Array(colors.length).fill(0);
  for (let it = 0; it < 7; it++) {
    for (let i = 0; i < colors.length; i++) {
      let best = 0;
      let bd = Infinity;
      for (let j = 0; j < k; j++) {
        const d = (colors[i][0] - C[j][0]) ** 2 + (colors[i][1] - C[j][1]) ** 2 + (colors[i][2] - C[j][2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      assign[i] = best;
    }
    const sum = Array.from({ length: k }, () => [0, 0, 0, 0]);
    colors.forEach((c, i) => { const s = sum[assign[i]]; s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; s[3]++; });
    sum.forEach((s, j) => { if (s[3]) C[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  return assign.map((a) => C[a]);
}

export class Mosaic {
  readonly count: number;
  readonly duration: number;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private meshes: THREE.InstancedMesh[] = [];
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
    // reflets discrets du marbre poli
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.22;
    this.disposables.push(env, pmrem);
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

    /* ── POSE EN « ANDAMENTO » ─────────────────────────────────────
     * Comme dans la mosaïque de référence : les rangs de pierres suivent des
     * courbes. Le fond est posé en anneaux concentriques autour de la statue ;
     * la statue en pierres fines qui épousent ses contours (opus vermiculatum),
     * le soleil en pierres rayonnantes. Longueurs, largeurs, formes et angles
     * varient d'une pierre à l'autre ; les joints restent visibles. */
    // budget mesuré sur un portable réel : 8 600 pierres ≈ 25-38 ms/image → on vise ≈ 6 500
    const coarse = Math.max(high ? 15 : 10, Math.round(Math.max(W, H) / (high ? 86 : 70)));
    const fine = Math.max(4, Math.round(coarse * 0.45));
    type Cell = { x: number; y: number; L: number; T: number; o: number; kind: "land" | "sun" | "edge" | "body" | "head" };
    const cells: Cell[] = [];
    const SB = src.statueBox;
    const inFine = (x: number, y: number) => alpha(sm, x, y) > 0.35 || alpha(sn, x, y) > 0.45;
    const C0 = { x: SB.x + SB.w / 2, y: SB.y + SB.h * 0.42 };

    // fond : anneaux concentriques autour de la statue
    const maxR = Math.hypot(Math.max(C0.x, W - C0.x), Math.max(C0.y, H - C0.y)) + coarse;
    for (let R = coarse * 0.8; R < maxR; R += coarse * (0.86 + rnd() * 0.1)) {
      let th = rnd() * Math.PI * 2;
      const end = th + Math.PI * 2 - coarse / R;
      while (th < end) {
        const L = coarse * (0.7 + rnd() * 0.75);
        const d = (L + coarse * 0.07) / R;
        const a = th + d / 2;
        th += d;
        const x = C0.x + Math.cos(a) * R;
        const y = C0.y + Math.sin(a) * R;
        if (x < -coarse || x > W + coarse || y < -coarse || y > H + coarse || inFine(x, y)) continue;
        cells.push({ x, y, L, T: coarse * (0.78 + rnd() * 0.14), o: a + Math.PI / 2, kind: "land" });
      }
    }
    // statue : pierres fines alignées sur les contours (normale du masque)
    const h = fine * 1.6;
    // la tête est posée encore plus fin : le visage doit rester lisible
    const headY = SB.y + SB.h * 0.16;
    for (let y = Math.max(0, SB.y); y < Math.min(H, SB.y + SB.h); ) {
      const f = y < headY ? fine * 0.72 : fine;
      for (let x = SB.x; x < SB.x + SB.w; x += f * 0.84) {
        const jx = x + (rnd() - 0.5) * f * 0.3;
        const jy = y + (rnd() - 0.5) * f * 0.3;
        if (alpha(sm, jx, jy) <= 0.35) continue;
        const gx = alpha(sm, jx + h, jy) - alpha(sm, jx - h, jy);
        const gy = alpha(sm, jx, jy + h) - alpha(sm, jx, jy - h);
        const edge = Math.hypot(gx, gy) > 0.25;
        const o = edge ? Math.atan2(gy, gx) + Math.PI / 2 : (rnd() - 0.5) * 0.5;
        cells.push({ x: jx, y: jy, L: f * (0.85 + rnd() * 0.35), T: f * (0.82 + rnd() * 0.12), o, kind: jy < headY ? "head" : edge ? "edge" : "body" });
      }
      y += f * 0.84;
    }
    // soleil : pierres rayonnantes
    const sr = H * 0.22;
    for (let y = src.sunCenter.y - sr; y < src.sunCenter.y + sr; y += fine * 0.85)
      for (let x = src.sunCenter.x - sr; x < src.sunCenter.x + sr; x += fine * 0.85) {
        const jx = x + (rnd() - 0.5) * fine * 0.3;
        const jy = y + (rnd() - 0.5) * fine * 0.3;
        if (alpha(sn, jx, jy) <= 0.45 || alpha(sm, jx, jy) > 0.35) continue;
        const o = Math.atan2(jy - src.sunCenter.y, jx - src.sunCenter.x);
        cells.push({ x: jx, y: jy, L: fine * (0.9 + rnd() * 0.5), T: fine * (0.75 + rnd() * 0.15), o, kind: "sun" });
      }
    this.count = cells.length;

    /* ── géométrie, matière ── */
    const shapes = tesseraShapes(high ? 10 : 6);
    const tex = stoneTexture();
    const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 2.2, roughness: 0.46, metalness: 0 });
    // chaque pierre prend un morceau différent de la texture (veines jamais identiques)
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
        vec2 tOff = fract(vec2(float(gl_InstanceID) * 0.6180339, float(gl_InstanceID) * 0.4142136));
        #ifdef USE_MAP
          vMapUv = vMapUv * 0.4 + tOff;
        #endif
        #ifdef USE_BUMPMAP
          vBumpMapUv = vBumpMapUv * 0.4 + tOff;
        #endif`,
      );
    };
    this.disposables.push(...shapes, tex, mat);
    const shapeOf = cells.map(() => Math.floor(rnd() * shapes.length));
    const counts = shapes.map((_, k) => shapeOf.filter((x) => x === k).length);
    this.meshes = shapes.map((g, k) => {
      const m = new THREE.InstancedMesh(g, mat, Math.max(1, counts[k]));
      m.count = counts[k];
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.scene.add(m);
      return m;
    });
    const localIdx = new Array(shapes.length).fill(0);

    /* lit de pose : mortier */
    const bed = new THREE.Mesh(
      new THREE.PlaneGeometry(W * 1.2, H * 1.2),
      new THREE.MeshStandardMaterial({ color: 0x6f6658, map: tex, roughness: 1 }), // joints de mortier clair
    );
    bed.position.z = -fine * 0.25;
    this.scene.add(bed);
    this.disposables.push(bed.geometry, bed.material as THREE.Material);

    /* ── chaque pierre : couleur, taille, trajectoire, ordre ── */
    const color = new THREE.Color();
    const maxH = Math.max(src.horizon, H - src.horizon);
    let last = 0;
    // couleurs prélevées sur la scène, puis ramenées à une palette finie de pierres
    const sampled = cells.map((c) => avg(c.x, c.y, Math.max(c.L, c.T)));
    const quant = palette(sampled, high ? 40 : 30);
    cells.forEach((cell, i) => {
      const [r0, g0, b0] = quant[i];
      // chaque pierre garde sa propre nuance ; le contour de la statue est souligné d'un rang plus sombre
      const v = (0.93 + rnd() * 0.14) * 1.28 * (cell.kind === "edge" ? 0.78 : 1);
      const warm = (rnd() - 0.5) * 0.04;
      color.setRGB((r0 + warm) * v, g0 * v, (b0 - warm) * v, THREE.SRGBColorSpace);
      const mi = shapeOf[i];
      const li = localIdx[mi]++;
      this.meshes[mi].setColorAt(li, color);

      const tx = cell.x - W / 2;
      const ty = H / 2 - cell.y;
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
      this.tess.push({
        mi, li,
        tx, ty,
        sx: cell.L,
        sy: cell.T,
        rz: -cell.o + (rnd() - 0.5) * 0.16, // orientation du rang (repère écran → monde : y inversé)
        s, c,
        axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        ang: 2 + rnd() * 4,
        delay, dur,
        done: false,
      });
    });
    this.meshes.forEach((m) => m.instanceColor && (m.instanceColor.needsUpdate = true));
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
      this.meshes[T.mi].setMatrixAt(T.li, m);
    }
    for (const mm of this.meshes) mm.instanceMatrix.needsUpdate = true;
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
    this.meshes.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
