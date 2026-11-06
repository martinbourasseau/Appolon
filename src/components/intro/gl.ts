/**
 * Moteur WebGL2 minimal de l'ouverture Apollon.
 *
 * Chaque « couche » est une image dessinée dans un quadrilatère dont la
 * géométrie est recopiée depuis l'élément DOM correspondant (mise en page
 * CSS + transformations GSAP du défilement). Le cadrage du canvas est donc
 * strictement identique à celui du DOM, sur tous les formats d'écran.
 *
 * Effet de révélation (fragment shader) :
 *   - un front qui part d'un point (le soleil, puis la tête d'Apollon),
 *   - déformé par un bruit fractal → bord irrégulier, « peint »,
 *   - souligné d'une lisière dorée lumineuse : la lumière d'Apollon,
 *   - étalonnage : brume froide et désaturée → couleurs pleines (uGrade).
 * Une fois la couche révélée (uReveal = 1), le bruit n'est plus calculé :
 * le coût revient à celui d'une simple image.
 */

const VERT = `#version 300 es
in vec2 aQuad;
uniform vec4 uRect;      // x, y, largeur, hauteur (px CSS, repère de la scène)
uniform mat3 uMatrix;    // transformation complète en px CSS
uniform vec2 uRes;       // taille de la scène (px CSS)
uniform vec4 uUv;        // u0, v0, u1, v1 (recadrage « cover »)
out vec2 vUv;
out vec2 vPx;
void main() {
  vec2 local = uRect.xy + aQuad * uRect.zw;
  vec2 px = (uMatrix * vec3(local, 1.0)).xy;
  vPx = px;
  vUv = mix(uUv.xy, uUv.zw, aQuad);
  vec2 clip = px / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vPx;
uniform sampler2D uTex;
uniform float uOpacity;
uniform float uReveal;   // 0 → 1
uniform vec2 uOrigin;    // point de départ du front (px CSS)
uniform float uNorm;     // normalisation des distances (px CSS)
uniform float uGrade;    // 0 brume → 1 couleurs pleines (par couche)
uniform float uSeed;
uniform float uTime;
uniform int uOctaves;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= uOctaves) break;
    v += a * vnoise(p);
    p = p * 2.03 + 17.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec4 c = texture(uTex, vUv);          // alpha prémultiplié
  if (c.a <= 0.001) discard;

  // étalonnage : brume d'avant l'aube → lumière pleine
  float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  vec3 mist = mix(vec3(l), c.rgb, 0.28) * vec3(0.9, 0.95, 1.04) + vec3(0.07, 0.08, 0.1) * c.a;
  c.rgb = mix(mist, c.rgb, uGrade);

  if (uReveal < 0.999) {
    vec2 p = (vPx - uOrigin) / uNorm;
    // bruit à deux échelles : grandes masses + touche de pinceau
    float n = fbm(vPx / uNorm * 4.6 + uSeed + vec2(0.0, uTime * 0.04));
    float fine = vnoise(vPx / uNorm * 38.0 + uSeed * 7.0);
    float field = length(p * vec2(1.0, 1.15)) * 1.1 + (n - 0.5) * 0.78 + (fine - 0.5) * 0.06;
    float front = uReveal * 1.95 - 0.14;
    float vis = smoothstep(front, front - 0.012, field);
    if (vis <= 0.0) discard;
    // lisière dorée : un liseré fin, comme la lumière qui gagne le relief
    float rim = smoothstep(front - 0.05, front - 0.004, field) * vis;
    vec3 gold = vec3(1.0, 0.76, 0.38);
    c.rgb = mix(c.rgb, gold * c.a, rim * 0.45) * (1.0 + rim * 0.35);
    c *= vis;
  }
  outColor = c * uOpacity;
}`;

export type Fit = "cover" | "fill";

export type LayerState = {
  /** élément animé (porte les transformations GSAP) */
  el: HTMLElement;
  /** image source */
  img: HTMLImageElement;
  fit: Fit;
  tex: WebGLTexture | null;
  /** géométrie au repos, sans transformation (px CSS, repère de la scène) */
  rest: { x: number; y: number; w: number; h: number; ox: number; oy: number };
  reveal: number;
  origin: [number, number];
  opacity: number;
  seed: number;
  /** profondeur pour le travelling d'ouverture (1 = paysage) */
  depth: number;
  /** étalonnage minimal de la couche (1 = jamais dans la brume : le soleil) */
  gradeFloor?: number;
};

export type Camera = {
  /** 0 = plongé dans le paysage, 1 = cadrage final */
  progress: number;
  /** point focal du travelling (px CSS) */
  focus: [number, number];
  /** amplitude d'échelle au départ */
  zoom: number;
  /** décalage vertical au départ (fraction de la hauteur) — la caméra « descend » */
  tilt: number;
};

export class LayerRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private dpr = 1;
  private w = 1;
  private h = 1;
  octaves = 5;
  grade = 0;
  time = 0;

  static supported() {
    try {
      const c = document.createElement("canvas");
      return Boolean(c.getContext("webgl2"));
    } catch {
      return false;
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL2 indisponible");
    this.gl = gl;
    this.prog = this.program(VERT, FRAG);
    gl.useProgram(this.prog);
    for (const name of ["uRect", "uMatrix", "uRes", "uUv", "uTex", "uOpacity", "uReveal", "uOrigin", "uNorm", "uGrade", "uSeed", "uTime", "uOctaves"]) {
      this.u[name] = gl.getUniformLocation(this.prog, name);
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, "aQuad");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(this.u.uTex, 0);
  }

  private program(vs: string, fs: string) {
    const gl = this.gl;
    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
    return p;
  }

  texture(img: HTMLImageElement) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  resize(w: number, h: number, maxDpr: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    this.w = w;
    this.h = h;
    const W = Math.round(w * this.dpr);
    const H = Math.round(h * this.dpr);
    if (this.canvas.width !== W || this.canvas.height !== H) {
      this.canvas.width = W;
      this.canvas.height = H;
    }
  }

  render(layers: LayerState[], cam: Camera) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.uniform2f(this.u.uRes, this.w, this.h);
    gl.uniform1f(this.u.uNorm, Math.max(this.w, this.h * 1.2));
    gl.uniform1f(this.u.uTime, this.time);
    gl.uniform1i(this.u.uOctaves, this.octaves);
    gl.activeTexture(gl.TEXTURE0);

    for (const L of layers) {
      if (!L.tex || L.opacity <= 0 || L.reveal <= 0) continue;
      const r = L.rest;
      // 1) transformations GSAP de l'élément (défilement), autour de son transform-origin
      const m = new DOMMatrix(getComputedStyle(L.el).transform === "none" ? undefined : getComputedStyle(L.el).transform);
      const ox = r.x + r.ox;
      const oy = r.y + r.oy;
      let M = new DOMMatrix().translate(ox, oy).multiply(m).translate(-ox, -oy);
      // 2) travelling d'ouverture : échelle et descente selon la profondeur
      const k = (1 - cam.progress) * L.depth;
      const s = 1 + cam.zoom * k;
      const ty = cam.tilt * this.h * k;
      M = new DOMMatrix().translate(cam.focus[0], cam.focus[1] + ty).scale(s, s).translate(-cam.focus[0], -cam.focus[1]).multiply(M);

      // recadrage « cover » pour le paysage
      let uv: [number, number, number, number] = [0, 0, 1, 1];
      if (L.fit === "cover") {
        const iw = L.img.naturalWidth || 1;
        const ih = L.img.naturalHeight || 1;
        const sc = Math.max(r.w / iw, r.h / ih);
        const uw = r.w / sc / iw;
        const vh = r.h / sc / ih;
        uv = [(1 - uw) / 2, (1 - vh) / 2, (1 + uw) / 2, (1 + vh) / 2];
      }

      gl.bindTexture(gl.TEXTURE_2D, L.tex);
      gl.uniform4f(this.u.uRect, r.x, r.y, r.w, r.h);
      gl.uniformMatrix3fv(this.u.uMatrix, false, [M.a, M.b, 0, M.c, M.d, 0, M.e, M.f, 1]);
      gl.uniform4f(this.u.uUv, uv[0], uv[1], uv[2], uv[3]);
      gl.uniform1f(this.u.uOpacity, L.opacity);
      gl.uniform1f(this.u.uReveal, L.reveal);
      // le point d'origine suit la caméra
      const o = M.transformPoint(new DOMPoint(L.origin[0], L.origin[1]));
      gl.uniform2f(this.u.uOrigin, o.x, o.y);
      gl.uniform1f(this.u.uSeed, L.seed);
      gl.uniform1f(this.u.uGrade, Math.max(this.grade, L.gradeFloor ?? 0));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  dispose() {
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
