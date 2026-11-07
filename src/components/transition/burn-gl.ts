/**
 * Passage I → II : l'image se consume.
 *
 * Principe (implémentation originale, inspirée du passage entre les deux
 * premières compositions de Shopify Editions Winter '26) :
 *   1. un foyer s'allume sur le soleil d'Apollon ;
 *   2. une frontière organique (bruit fractal animé) s'étend : cœur blanc-or,
 *      flamme orange, lisière rouge, puis matière carbonisée et braises ;
 *   3. en avant du feu, le tableau se change en gravure lumineuse (contours
 *      extraits du paysage par un filtre de Sobel) — la matière s'embrase ;
 *   4. à travers la brèche apparaît la scène II, vue de loin puis de plus en
 *      plus près : la caméra traverse la frontière ;
 *   5. à la fin, la scène II occupe l'écran, cadrée exactement comme son
 *      ouverture (même tableau, même recadrage) : le relais est invisible.
 *
 * Le canvas ne dessine que ce qui change : le trou, le feu, les braises.
 * La scène I reste en DOM dessous (ses calques et son ouverture WebGL).
 */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uB;        // tableau de la scène II
uniform sampler2D uA;        // paysage de la scène I (pour la gravure lumineuse)
uniform vec2 uRes;           // px CSS
uniform vec2 uBSize;         // taille naturelle du tableau II
uniform vec2 uBPos;          // object-position (0..1)
uniform float uBZoom;        // caméra dans la brèche : >1 = vu de près… puis 1
uniform vec4 uARect;         // rectangle du paysage I à l'écran (px) : x, y, w, h
uniform vec2 uASize;
uniform vec2 uOrigin;        // foyer (px)
uniform float uP;            // progression 0 → 1
uniform float uMaxD;         // distance du foyer au coin le plus éloigné (repère isotrope)
uniform float uTime;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

// « cover » + object-position, comme le CSS de l'ouverture II
vec2 coverUv(vec2 uv, vec2 res, vec2 size, vec2 pos, float zoom, vec2 focus) {
  float s = max(res.x / size.x, res.y / size.y);
  vec2 drawn = size * s;
  vec2 off = (res - drawn) * pos;
  vec2 px = uv * res;
  px = focus + (px - focus) / zoom;
  return (px - off) / drawn;
}

void main() {
  vec2 px = vUv * uRes;
  float asp = uRes.x / uRes.y;
  vec2 q = (px - uOrigin) / uRes.y;           // repère isotrope
  float dist = length(q);

  // champ de combustion : distance au foyer, déformée par un bruit qui s'écoule
  vec2 flow = vec2(0.0, -uTime * 0.06);
  float n = fbm(vUv * vec2(asp, 1.0) * 3.2 + flow);
  float n2 = fbm(vUv * vec2(asp, 1.0) * 11.0 - flow * 2.0);
  float field = dist + (n - 0.5) * 0.42 + (n2 - 0.5) * 0.07;
  float reach = mix(-0.12, uMaxD + 0.3, uP);
  float d = field - reach;                     // < 0 : brûlé

  // ── à travers la brèche : la scène II, la caméra avance ──
  vec2 nrm = normalize(q + 1e-4);
  float heat = exp(-abs(d) * 40.0);
  vec2 buv = coverUv(vUv, uRes, uBSize, uBPos, uBZoom, uOrigin);
  buv += nrm * heat * 0.012 * vec2(1.0 / asp, 1.0);   // air chaud sur la lisière
  vec3 colB = texture(uB, buv).rgb;
  // voile de l'ouverture II (mêmes valeurs que .opener__veil) : relais sans saut
  float vy = vUv.y;
  float veil = vy < 0.3 ? mix(0.32, 0.0, vy / 0.3) : (vy < 0.5 ? 0.0 : mix(0.0, 0.55, (vy - 0.5) / 0.5));
  colB = mix(colB, vec3(0.078, 0.055, 0.031), veil);
  colB = mix(colB, colB * vec3(1.18, 0.96, 0.82) + 0.05, clamp(heat * 1.2, 0.0, 1.0)); // reflet du feu

  // ── la frontière ──
  float core = 1.0 - smoothstep(0.0, 0.010, abs(d + 0.004));
  float flame = 1.0 - smoothstep(0.0, 0.035, abs(d - 0.012));
  float ember = smoothstep(0.012, 0.03, d) * (1.0 - smoothstep(0.03, 0.11, d));
  float flick = 0.75 + 0.25 * sin(uTime * 9.0 + n2 * 30.0);
  vec3 cWhite = vec3(1.0, 0.96, 0.82);
  vec3 cGold = vec3(1.0, 0.72, 0.28);
  vec3 cOrange = vec3(0.98, 0.42, 0.08);
  vec3 cRed = vec3(0.62, 0.08, 0.03);

  // matière carbonisée, piquée de braises
  float specks = smoothstep(0.62, 0.8, fbm(vUv * vec2(asp, 1.0) * 26.0 + uTime * 0.3)) * ember;
  vec3 char = mix(vec3(0.07, 0.035, 0.02), cOrange * 1.4, specks * flick);
  float charA = ember * 0.92;

  // ── en avant du feu : le paysage se change en gravure lumineuse ──
  float ahead = smoothstep(0.02, 0.06, d) * (1.0 - smoothstep(0.06, 0.32, d));
  vec2 auv = (px - uARect.xy) / uARect.zw;
  float engrave = 0.0;
  if (ahead > 0.001 && auv.x > 0.0 && auv.x < 1.0 && auv.y > 0.0 && auv.y < 1.0) {
    vec2 tx = 1.5 / uASize;
    float tl = dot(texture(uA, auv + vec2(-tx.x, -tx.y)).rgb, vec3(0.33));
    float tc = dot(texture(uA, auv + vec2(0.0, -tx.y)).rgb, vec3(0.33));
    float tr = dot(texture(uA, auv + vec2(tx.x, -tx.y)).rgb, vec3(0.33));
    float ml = dot(texture(uA, auv + vec2(-tx.x, 0.0)).rgb, vec3(0.33));
    float mr = dot(texture(uA, auv + vec2(tx.x, 0.0)).rgb, vec3(0.33));
    float bl = dot(texture(uA, auv + vec2(-tx.x, tx.y)).rgb, vec3(0.33));
    float bc = dot(texture(uA, auv + vec2(0.0, tx.y)).rgb, vec3(0.33));
    float br = dot(texture(uA, auv + vec2(tx.x, tx.y)).rgb, vec3(0.33));
    float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
    float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
    engrave = smoothstep(0.12, 0.5, length(vec2(gx, gy))) * ahead;
  }
  // assombrissement de la scène I juste avant qu'elle ne brûle
  float scorch = (1.0 - smoothstep(0.02, 0.22, d)) * step(0.0, d);

  // ── composition (alpha prémultiplié) ──
  vec3 col = vec3(0.0);
  float a = 0.0;
  // voile de roussi + gravure dorée sur la scène I
  col = mix(col, vec3(0.16, 0.07, 0.03), scorch * 0.55);
  a = max(a, scorch * 0.55);
  col += vec3(1.0, 0.78, 0.42) * engrave * 0.9;
  a = max(a, engrave * 0.75);
  // carbonisé
  col = mix(col, char, charA);
  a = max(a, charA);
  // scène II dans la brèche
  float inside = 1.0 - smoothstep(-0.004, 0.0, d);
  col = mix(col, colB, inside);
  a = max(a, inside);
  // flammes
  vec3 fire = mix(cRed, cOrange, flame) ;
  fire = mix(fire, cGold, core * 0.8);
  fire = mix(fire, cWhite, core * core);
  float fireA = clamp(flame * 0.95 * flick + core, 0.0, 1.0) * step(0.001, uP) * (1.0 - step(0.999, uP));
  col = mix(col, fire * (1.2 + 0.4 * flick), fireA);
  a = max(a, fireA);
  // halo
  float halo = exp(-abs(d) * 12.0) * 0.35 * step(0.001, uP) * (1.0 - smoothstep(0.92, 1.0, uP));
  col += cOrange * halo;
  a = clamp(a + halo * 0.4, 0.0, 1.0);

  outColor = vec4(col, a);
}`;

/* braises et étincelles : un nuage de points qui suit la frontière */
const PVERT = `#version 300 es
in vec3 aSeed;               // angle, vitesse, taille
uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uP;
uniform float uMaxD;
uniform float uTime;
uniform float uDpr;
out float vLife;
out float vHot;
void main() {
  float asp = uRes.x / uRes.y;
  float reach = mix(-0.12, uMaxD + 0.3, uP);
  float life = fract(uTime * (0.22 + aSeed.y * 0.35) + aSeed.z * 17.0);
  float ang = aSeed.x + sin(uTime * 0.7 + aSeed.z * 40.0) * 0.08;
  float r = max(0.0, reach - 0.02 + life * (0.05 + aSeed.y * 0.12));
  vec2 p = uOrigin / uRes.y + vec2(cos(ang), sin(ang)) * r;
  p.y -= life * life * 0.12;                       // les braises montent
  p.x += sin(life * 6.0 + aSeed.z * 9.0) * 0.01;
  vec2 clip = vec2(p.x / asp, p.y) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLife = life;
  vHot = aSeed.y;
  float on = step(0.002, uP) * (1.0 - smoothstep(0.9, 1.0, uP));
  gl_PointSize = (1.5 + aSeed.z * 3.5) * (1.0 - life) * uDpr * on;
}`;

const PFRAG = `#version 300 es
precision mediump float;
in float vLife;
in float vHot;
out vec4 outColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float m = smoothstep(0.5, 0.0, length(c));
  vec3 col = mix(vec3(1.0, 0.9, 0.6), vec3(1.0, 0.38, 0.06), vLife);
  col = mix(col, vec3(1.0), step(0.85, vHot) * (1.0 - vLife));  // quelques étincelles blanches
  float a = m * (1.0 - vLife) * 0.95;
  outColor = vec4(col * a, a);
}`;

export type BurnState = {
  p: number;
  zoom: number;
  origin: [number, number];
  aRect: [number, number, number, number];
};

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const mk = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const p = gl.createProgram()!;
  const v = mk(gl.VERTEX_SHADER, vs);
  const f = mk(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  return p;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => im.decode().then(() => res(im), () => res(im));
    im.onerror = () => rej(new Error(src));
    im.src = src;
  });
}

export class BurnRenderer {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private pprog: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private pvao: WebGLVertexArrayObject;
  private texA: WebGLTexture | null = null;
  private texB: WebGLTexture | null = null;
  private aSize: [number, number] = [1, 1];
  private bSize: [number, number] = [1, 1];
  private count: number;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private pu: Record<string, WebGLUniformLocation | null> = {};
  private w = 1;
  private h = 1;
  private dpr = 1;
  bPos: [number, number] = [0.5, 0.5];

  constructor(private canvas: HTMLCanvasElement, particles: number) {
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) throw new Error("webgl2");
    this.gl = gl;
    this.prog = compile(gl, VERT, FRAG);
    this.pprog = compile(gl, PVERT, PFRAG);
    for (const k of ["uB", "uA", "uRes", "uBSize", "uBPos", "uBZoom", "uARect", "uASize", "uOrigin", "uP", "uTime", "uMaxD"]) this.u[k] = gl.getUniformLocation(this.prog, k);
    for (const k of ["uRes", "uOrigin", "uP", "uTime", "uDpr", "uMaxD"]) this.pu[k] = gl.getUniformLocation(this.pprog, k);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.count = particles;
    this.pvao = gl.createVertexArray()!;
    gl.bindVertexArray(this.pvao);
    const seeds = new Float32Array(particles * 3);
    for (let i = 0; i < particles; i++) {
      seeds[i * 3] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 1] = Math.random();
      seeds[i * 3 + 2] = Math.random();
    }
    const pb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const ploc = gl.getAttribLocation(this.pprog, "aSeed");
    gl.enableVertexAttribArray(ploc);
    gl.vertexAttribPointer(ploc, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  private upload(img: HTMLImageElement) {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /** Chargement réel des deux tableaux ; la promesse suit leur décodage */
  async load(aSrc: string, bSrc: string, onProgress?: (n: number) => void) {
    let done = 0;
    const tick = <T,>(x: T) => (onProgress?.(++done / 2), x);
    const [a, b] = await Promise.all([loadImage(aSrc).then(tick), loadImage(bSrc).then(tick)]);
    this.texA = this.upload(a);
    this.texB = this.upload(b);
    this.aSize = [a.naturalWidth, a.naturalHeight];
    this.bSize = [b.naturalWidth, b.naturalHeight];
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }

  render(s: BurnState, time: number) {
    const gl = this.gl;
    if (!this.texA || !this.texB) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (s.p <= 0) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texB);
    gl.uniform1i(this.u.uB, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texA);
    gl.uniform1i(this.u.uA, 1);
    gl.uniform2f(this.u.uRes, this.w, this.h);
    gl.uniform2f(this.u.uBSize, this.bSize[0], this.bSize[1]);
    gl.uniform2f(this.u.uBPos, this.bPos[0], this.bPos[1]);
    gl.uniform1f(this.u.uBZoom, s.zoom);
    gl.uniform4f(this.u.uARect, ...s.aRect);
    gl.uniform2f(this.u.uASize, this.aSize[0], this.aSize[1]);
    gl.uniform2f(this.u.uOrigin, s.origin[0], s.origin[1]);
    gl.uniform1f(this.u.uP, s.p);
    gl.uniform1f(this.u.uTime, time);
    const maxD = this.maxD(s.origin);
    gl.uniform1f(this.u.uMaxD, maxD);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (s.p < 0.98) {
      gl.useProgram(this.pprog);
      gl.uniform2f(this.pu.uRes, this.w, this.h);
      gl.uniform2f(this.pu.uOrigin, s.origin[0], s.origin[1]);
      gl.uniform1f(this.pu.uP, s.p);
      gl.uniform1f(this.pu.uTime, time);
      gl.uniform1f(this.pu.uDpr, this.dpr);
      gl.uniform1f(this.pu.uMaxD, maxD);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.bindVertexArray(this.pvao);
      gl.drawArrays(gl.POINTS, 0, this.count);
    }
    gl.bindVertexArray(null);
  }

  private maxD(o: [number, number]) {
    const cs = [[0, 0], [this.w, 0], [0, this.h], [this.w, this.h]];
    return Math.max(...cs.map(([x, y]) => Math.hypot(x - o[0], y - o[1]))) / this.h;
  }

  dispose() {
    const gl = this.gl;
    if (this.texA) gl.deleteTexture(this.texA);
    if (this.texB) gl.deleteTexture(this.texB);
    gl.deleteProgram(this.prog);
    gl.deleteProgram(this.pprog);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
