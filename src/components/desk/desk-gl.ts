/**
 * L'atelier d'Apollon — scène 3D (Three.js), entièrement procédurale :
 * aucun modèle externe, aucune texture téléchargée en dehors du tableau
 * déjà présent sur le site (affiché dans l'écran).
 *
 *  - une table antique : plateau de marbre sur deux tambours de colonne
 *  - un ordinateur portable dont l'écran montre un site qui se construit
 *    (structure → style → contenus → en ligne) au rythme du défilement
 *  - des fenêtres d'interface flottantes (palette, code, composants)
 *  - une sphère armillaire dorée, clin d'œil au dieu de la lumière
 *
 * Rendu à la demande : une image n'est calculée que si la scène est visible
 * et que quelque chose a changé (défilement, pointeur, flottement).
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type DeskOptions = {
  quality: "high" | "low";
  serif: string;
  sans: string;
  paintingSrc: string;
};

export type DeskHandle = {
  setProgress: (p: number) => void;
  setPointer: (x: number, y: number) => void;
  setVisible: (v: boolean) => void;
  ready: Promise<void>;
  dispose: () => void;
};

const MARBRE = "#efe8da";
const ENCRE = "#1d1a15";
const OR = "#a97c32";

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  draw(ctx);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { tex: t, cv, ctx };
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** Marbre veiné, dessiné une fois */
function marbleTexture() {
  return canvasTex(1024, 512, (c) => {
    c.fillStyle = "#f1ebdf";
    c.fillRect(0, 0, 1024, 512);
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let v = 0; v < 26; v++) {
      c.beginPath();
      let x = rnd() * 1024;
      let y = rnd() * 512;
      c.moveTo(x, y);
      for (let i = 0; i < 18; i++) {
        x += 30 + rnd() * 50;
        y += (rnd() - 0.5) * 60;
        c.lineTo(x, y);
      }
      c.strokeStyle = `rgba(${150 + rnd() * 40},${135 + rnd() * 30},${110 + rnd() * 20},${0.08 + rnd() * 0.18})`;
      c.lineWidth = 0.6 + rnd() * 2.4;
      c.stroke();
    }
  });
}

export function createDesk(canvas: HTMLCanvasElement, opts: DeskOptions): DeskHandle {
  const high = opts.quality === "high";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: high, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, high ? 1.75 : 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  /* ── lumière : soleil chaud venant de la gauche, ciel doré ── */
  scene.add(new THREE.HemisphereLight(0xfff3df, 0x8b7a5e, 0.9));
  const sun = new THREE.DirectionalLight(0xffe7c2, 2.4);
  sun.position.set(-4, 7, 4);
  sun.castShadow = high;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -4;
  sun.shadow.camera.right = 4;
  sun.shadow.camera.top = 4;
  sun.shadow.camera.bottom = -4;
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 4;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xc9d6ff, 0.5);
  rim.position.set(5, 3, -4);
  scene.add(rim);

  const disposables: { dispose: () => void }[] = [env, pmrem];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

  /* ── table antique ── */
  const marble = marbleTexture();
  track(marble.tex);
  const marbleMat = track(new THREE.MeshStandardMaterial({ map: marble.tex, roughness: 0.32, metalness: 0 }));
  const top = new THREE.Mesh(track(new RoundedBoxGeometry(4.2, 0.16, 2.2, high ? 4 : 2, 0.04)), marbleMat);
  top.position.y = 1.5;
  top.castShadow = top.receiveShadow = high;
  scene.add(top);
  const goldMat = track(new THREE.MeshStandardMaterial({ color: 0xc89b4a, metalness: 1, roughness: 0.28 }));
  const trim = new THREE.Mesh(track(new THREE.BoxGeometry(4.16, 0.025, 2.16)), goldMat);
  trim.position.y = 1.41;
  scene.add(trim);
  const drumGeo = track(new THREE.CylinderGeometry(0.34, 0.38, 1.38, high ? 20 : 12, 1));
  for (const x of [-1.45, 1.45]) {
    const leg = new THREE.Mesh(drumGeo, marbleMat);
    leg.position.set(x, 0.69, 0);
    leg.castShadow = high;
    scene.add(leg);
  }
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 14)), track(new THREE.ShadowMaterial({ opacity: 0.22 })));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = high;
  scene.add(ground);

  /* ── ordinateur portable ── */
  const alu = track(new THREE.MeshStandardMaterial({ color: 0xcfcac1, metalness: 0.85, roughness: 0.34 }));
  const laptop = new THREE.Group();
  laptop.position.set(-0.15, 1.58, 0.1);
  laptop.rotation.y = 0.18;
  scene.add(laptop);
  const base = new THREE.Mesh(track(new RoundedBoxGeometry(1.6, 0.05, 1.06, 2, 0.02)), alu);
  base.castShadow = high;
  laptop.add(base);
  const keys = canvasTex(512, 340, (c) => {
    c.fillStyle = "#bdb8ae";
    c.fillRect(0, 0, 512, 340);
    c.fillStyle = "#2a2723";
    for (let r = 0; r < 5; r++) for (let k = 0; k < 13; k++) {
      roundRect(c, 22 + k * 36.4, 20 + r * 34, 31, 28, 4);
      c.fill();
    }
    roundRect(c, 170, 200, 172, 110, 8);
    c.fillStyle = "#c6c1b7";
    c.fill();
  });
  track(keys.tex);
  const keyboard = new THREE.Mesh(track(new THREE.PlaneGeometry(1.5, 1.0)), track(new THREE.MeshStandardMaterial({ map: keys.tex, roughness: 0.6 })));
  keyboard.rotation.x = -Math.PI / 2;
  keyboard.position.y = 0.026;
  laptop.add(keyboard);

  const hinge = new THREE.Group();
  hinge.position.set(0, 0.025, -0.53);
  laptop.add(hinge);
  const lid = new THREE.Mesh(track(new RoundedBoxGeometry(1.6, 1.02, 0.035, 2, 0.015)), alu);
  lid.position.set(0, 0.51, 0);
  lid.castShadow = high;
  hinge.add(lid);

  /* écran : un site qui se construit */
  const SW = 1024;
  const SH = 640;
  const screen = canvasTex(SW, SH, () => undefined);
  track(screen.tex);
  const screenMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(1.5, 0.94)), track(new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false })));
  screenMesh.position.set(0, 0.51, 0.0185);
  hinge.add(screenMesh);

  const painting = new Image();
  painting.decoding = "async";
  const paintingReady = new Promise<void>((res) => {
    painting.onload = () => res();
    painting.onerror = () => res();
  });
  painting.src = opts.paintingSrc;

  let drawnStep = -1;
  const drawScreen = (p: number) => {
    const step = Math.round(p * 60);
    if (step === drawnStep) return;
    drawnStep = step;
    const c = screen.ctx;
    const s1 = THREE.MathUtils.smoothstep(p, 0.0, 0.25); // structure
    const s2 = THREE.MathUtils.smoothstep(p, 0.22, 0.5); // style
    const s3 = THREE.MathUtils.smoothstep(p, 0.45, 0.75); // contenus
    const s4 = THREE.MathUtils.smoothstep(p, 0.78, 0.95); // en ligne
    c.fillStyle = "#14120f";
    c.fillRect(0, 0, SW, SH);
    // fond de page
    c.globalAlpha = 0.25 + 0.75 * s2;
    c.fillStyle = MARBRE;
    c.fillRect(0, 0, SW, SH);
    c.globalAlpha = 1;
    // grille de structure
    c.strokeStyle = `rgba(169,124,50,${0.65 * (1 - s3 * 0.7) * s1})`;
    c.lineWidth = 1.5;
    const cols = 12;
    for (let i = 0; i <= cols; i++) {
      const x = 64 + ((SW - 128) / cols) * i * s1 + (1 - s1) * (SW / 2 - 64);
      c.beginPath();
      c.moveTo(x, 70);
      c.lineTo(x, SH - 40);
      c.stroke();
    }
    // en-tête
    c.fillStyle = `rgba(29,26,21,${s1})`;
    c.fillRect(64, 30, 240 * s1, 10);
    c.strokeStyle = `rgba(29,26,21,${s1})`;
    roundRect(c, SW - 220, 22, 156, 30, 15);
    c.stroke();
    // arche du tableau
    const ax = 160;
    const aw = SW - 320;
    const ay = 92;
    const ah = 380;
    c.save();
    c.beginPath();
    c.moveTo(ax, ay + ah);
    c.lineTo(ax, ay + aw / 2.6);
    c.ellipse(ax + aw / 2, ay + aw / 2.6, aw / 2, aw / 2.6, 0, Math.PI, 0);
    c.lineTo(ax + aw, ay + ah);
    c.closePath();
    c.strokeStyle = `rgba(29,26,21,${0.6 * s1})`;
    c.stroke();
    c.clip();
    c.fillStyle = `rgba(201,188,159,${s2})`;
    c.fillRect(ax, ay, aw, ah);
    if (painting.complete && painting.naturalWidth && s3 > 0) {
      c.globalAlpha = s3;
      const r = painting.naturalWidth / painting.naturalHeight;
      const w = aw * (1.15 - 0.15 * s3);
      c.drawImage(painting, ax + (aw - w) / 2, ay + ah - w / r + 40, w, w / r);
      c.globalAlpha = 1;
    }
    c.restore();
    // grand titre
    c.textAlign = "center";
    c.fillStyle = s3 > 0 ? `rgba(251,243,228,${s3})` : "transparent";
    c.font = `400 ${118}px ${opts.serif}`;
    c.fillText("Apollon", SW / 2, ay + ah - 36 + (1 - s3) * 30);
    // blocs de texte
    for (let i = 0; i < 3; i++) {
      const w = (SW - 128) / 3 - 24;
      const x = 64 + i * (w + 36);
      c.fillStyle = `rgba(29,26,21,${0.85 * s2})`;
      c.fillRect(x, ay + ah + 34, w * 0.6 * s2, 12);
      c.fillStyle = `rgba(77,70,59,${0.45 * s2})`;
      c.fillRect(x, ay + ah + 58, w * s2, 8);
      c.fillRect(x, ay + ah + 74, w * 0.8 * s2, 8);
    }
    // mise en ligne : barre d'adresse et voyant
    if (s4 > 0) {
      c.globalAlpha = s4;
      c.fillStyle = "rgba(20,18,15,0.85)";
      roundRect(c, SW / 2 - 190, SH - 64, 380, 40, 20);
      c.fill();
      c.fillStyle = "#7fd18b";
      c.beginPath();
      c.arc(SW / 2 - 162, SH - 44, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#f3ecdf";
      c.font = `600 19px ${opts.sans}`;
      c.textAlign = "left";
      c.fillText("En ligne · apollon", SW / 2 - 140, SH - 37);
      c.globalAlpha = 1;
    }
    screen.tex.needsUpdate = true;
  };

  /* ── fenêtres d'interface flottantes ── */
  type Panel = { mesh: THREE.Mesh; base: THREE.Vector3; phase: number; at: number };
  const panels: Panel[] = [];
  const panel = (w: number, h: number, draw: (c: CanvasRenderingContext2D, W: number, H: number) => void, pos: [number, number, number], rotY: number, at: number) => {
    const W = 512;
    const H = Math.round((512 * h) / w);
    const t = canvasTex(W, H, (c) => {
      c.clearRect(0, 0, W, H);
      roundRect(c, 4, 4, W - 8, H - 8, 26);
      c.fillStyle = "rgba(251,247,239,0.96)";
      c.fill();
      c.strokeStyle = "rgba(169,124,50,0.5)";
      c.lineWidth = 2;
      c.stroke();
      draw(c, W, H);
    });
    track(t.tex);
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), track(new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide })));
    m.position.set(...pos);
    m.rotation.y = rotY;
    m.renderOrder = 2;
    scene.add(m);
    panels.push({ mesh: m, base: new THREE.Vector3(...pos), phase: panels.length * 1.7, at });
  };
  panel(0.9, 0.62, (c) => {
    c.fillStyle = ENCRE;
    c.font = `500 26px ${opts.sans}`;
    c.fillText("Palette", 34, 56);
    ["#efe8da", "#c9bc9f", "#a97c32", "#1d1a15", "#0c1326"].forEach((col, i) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(70 + i * 92, 140, 34, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(0,0,0,0.12)";
      c.stroke();
    });
    c.fillStyle = ENCRE;
    c.font = `400 110px ${opts.serif}`;
    c.fillText("Aa", 34, 300);
    c.font = `500 22px ${opts.sans}`;
    c.fillStyle = "#4d463b";
    c.fillText("Cormorant · Manrope", 210, 286);
  }, [-1.95, 2.55, -0.2], 0.42, 0.18);
  panel(0.86, 0.6, (c) => {
    c.font = `500 24px ui-monospace, Menlo, monospace`;
    const lines = [
      ["#a97c32", "<Scene"],
      ["#1d1a15", "  reveal=\"arch\""],
      ["#1d1a15", "  camera={dolly}"],
      ["#a97c32", "/>"],
      ["#7a7264", "// 60 images / s"],
    ];
    lines.forEach(([col, t], i) => {
      c.fillStyle = col;
      c.fillText(t, 40, 70 + i * 52);
    });
  }, [1.75, 2.7, -0.35], -0.45, 0.42);
  panel(0.74, 0.46, (c, W) => {
    roundRect(c, 40, 50, 220, 64, 32);
    c.fillStyle = ENCRE;
    c.fill();
    c.fillStyle = "#fbf3e4";
    c.font = `600 24px ${opts.sans}`;
    c.fillText("Parler d'un projet", 58, 90);
    roundRect(c, W - 160, 58, 100, 48, 24);
    c.fillStyle = OR;
    c.fill();
    c.fillStyle = "#fbf3e4";
    c.beginPath();
    c.arc(W - 84, 82, 18, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(29,26,21,0.25)";
    c.fillRect(40, 160, W - 80, 10);
    c.fillRect(40, 190, (W - 80) * 0.7, 10);
  }, [1.35, 1.95, 0.85], -0.3, 0.62);

  /* ── sphère armillaire ── */
  const armillary = new THREE.Group();
  armillary.position.set(1.45, 1.58, -0.35);
  scene.add(armillary);
  const stand = new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.12, 0.42, 16)), goldMat);
  stand.position.y = 0.21;
  armillary.add(stand);
  const rings = new THREE.Group();
  rings.position.y = 0.7;
  armillary.add(rings);
  const ringGeo = track(new THREE.TorusGeometry(0.28, 0.012, 8, high ? 96 : 48));
  [0, Math.PI / 2, Math.PI / 3].forEach((r, i) => {
    const ring = new THREE.Mesh(ringGeo, goldMat);
    ring.rotation.set(i === 2 ? Math.PI / 2 : 0, r, i === 2 ? 0.4 : 0);
    ring.castShadow = high;
    rings.add(ring);
  });
  const core = new THREE.Mesh(track(new THREE.SphereGeometry(0.07, 24, 16)), track(new THREE.MeshStandardMaterial({ color: 0xffd48a, emissive: 0xffb347, emissiveIntensity: 0.9, roughness: 0.4 })));
  rings.add(core);

  /* ── carnets ── */
  const bookMat = track(new THREE.MeshStandardMaterial({ color: 0x6b2d22, roughness: 0.7 }));
  const bookMat2 = track(new THREE.MeshStandardMaterial({ color: 0x24324f, roughness: 0.7 }));
  [bookMat, bookMat2].forEach((m, i) => {
    const b = new THREE.Mesh(track(new RoundedBoxGeometry(0.62, 0.07, 0.86, 2, 0.01)), m);
    b.position.set(-1.55, 1.62 + i * 0.075, 0.45);
    b.rotation.y = -0.2 + i * 0.16;
    b.castShadow = high;
    scene.add(b);
  });

  /* ── état ── */
  let progress = 0;
  const pointer = new THREE.Vector2();
  const pointerSmooth = new THREE.Vector2();
  let visible = false;
  let raf = 0;
  let disposed = false;
  const look = new THREE.Vector3(0, 2.0, 0);

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.9 ? 44 : 30;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const render = (time: number) => {
    const p = progress;
    // couvercle : fermé → ouvert (105°)
    const open = THREE.MathUtils.smoothstep(p, 0.02, 0.3);
    // fermé : couvercle rabattu sur le clavier (+90°) ; ouvert : incliné en arrière (~105°)
    hinge.rotation.x = Math.PI / 2 - 0.04 - open * (Math.PI / 2 - 0.04 + 0.24);
    drawScreen(THREE.MathUtils.clamp((p - 0.12) / 0.8, 0, 1));
    // caméra : travelling en arc, puis approche de l'écran
    const narrow = camera.aspect < 0.9;
    const az = (narrow ? THREE.MathUtils.lerp(-0.42, 0.12, p) : THREE.MathUtils.lerp(-0.62, 0.32, p)) + pointerSmooth.x * 0.06;
    const el = THREE.MathUtils.lerp(0.5, 0.28, p) + pointerSmooth.y * 0.03;
    const dist = THREE.MathUtils.lerp(narrow ? 9.2 : 8.2, narrow ? 6.4 : 5.6, THREE.MathUtils.smoothstep(p, 0.1, 0.9));
    camera.position.set(Math.sin(az) * dist * Math.cos(el), 2.0 + Math.sin(el) * dist, Math.cos(az) * dist * Math.cos(el));
    look.set(-0.1, THREE.MathUtils.lerp(1.8, 2.05, p) + (narrow ? 0.45 : 0), 0);
    camera.lookAt(look);
    // flottements
    const t = time / 1000;
    for (const P of panels) {
      const a = THREE.MathUtils.smoothstep(p, P.at, P.at + 0.18);
      // petit écran : les fenêtres se resserrent au-dessus de l'ordinateur
      const nx = narrow ? P.base.x * 0.42 : P.base.x;
      const ny = narrow ? P.base.y + 0.55 + Math.abs(P.base.x) * 0.12 : P.base.y;
      P.mesh.position.set(nx, ny + Math.sin(t * 0.9 + P.phase) * 0.05 - (1 - a) * 0.4, P.base.z);
      const m = P.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = a;
      P.mesh.visible = a > 0.01;
      P.mesh.scale.setScalar((0.85 + a * 0.15) * (narrow ? 0.78 : 1));
    }
    rings.rotation.y = t * 0.35 + p * 2;
    rings.rotation.z = Math.sin(t * 0.4) * 0.15;
    renderer.render(scene, camera);
  };

  const loop = (time: number) => {
    if (disposed) return;
    pointerSmooth.lerp(pointer, 0.06);
    if (visible) render(time);
    raf = requestAnimationFrame(loop);
  };

  const ready = Promise.all([paintingReady, document.fonts?.ready ?? Promise.resolve()]).then(() => {
    drawnStep = -1;
    render(performance.now());
    raf = requestAnimationFrame(loop);
  });

  return {
    ready,
    setProgress: (p) => (progress = p),
    setPointer: (x, y) => pointer.set(x, y),
    setVisible: (v) => (visible = v),
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
