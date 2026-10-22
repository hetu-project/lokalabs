/*
  AIUSD coin, rendered with three.js: brushed silver faces with an engraved guilloche pattern (drawn to a canvas and used
  as a bump map), a reeded edge, polished bevels that pick up a faint green-yellow iridescence, lit by a studio
  environment map. The front carries "AI"; the back carries a "1", the coin's face value. It sways slowly, tilts toward the pointer, turns over every few seconds and
  on click; it stops rendering off screen, and with reduced motion it only turns over on click. If WebGL or the module fails to load, the CSS coin underneath stays visible.

  Shared by / and /aiusd/: any element with data-coin and a <canvas> inside gets a coin; the class "gl" is added
  to it once the first frame is drawn, so the page can hide its fallback.
*/
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export async function mountCoin(wrap, canvas) {
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  // a bright studio for the reflections: a white-to-grey dome with a darker horizon band (gives the silver its
  // contrast), white softboxes above, left and in front, and one pale green-yellow softbox to the right for the rim glint
  const studio = new THREE.Scene();
  const gc = document.createElement('canvas'); gc.width = 4; gc.height = 256;
  const gg = gc.getContext('2d'), grd = gg.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.42, '#eef1ef'); grd.addColorStop(0.52, '#7d8481'); grd.addColorStop(0.62, '#d9dddb'); grd.addColorStop(1, '#f4f5f4');
  gg.fillStyle = grd; gg.fillRect(0, 0, 4, 256);
  const domeTex = new THREE.CanvasTexture(gc); domeTex.colorSpace = THREE.SRGBColorSpace;
  studio.add(new THREE.Mesh(new THREE.SphereGeometry(20, 64, 32), new THREE.MeshBasicMaterial({ map: domeTex, side: THREE.BackSide })));
  const box = (w, h, color, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); studio.add(m);
  };
  box(10, 4, 0xffffff, 2.4, [0, 9, 3]);
  box(4, 9, 0xffffff, 1.8, [-9, 1, 4]);
  // in front of the coin (what its face mirrors): a diagonal sweep from white to graphite
  const fc = document.createElement('canvas'); fc.width = fc.height = 256;
  const fg = fc.getContext('2d'), fgrd = fg.createLinearGradient(0, 0, 256, 256);
  fgrd.addColorStop(0, '#ffffff'); fgrd.addColorStop(0.3, '#f1f3f2'); fgrd.addColorStop(0.62, '#858b88'); fgrd.addColorStop(1, '#2c312e');
  fg.fillStyle = fgrd; fg.fillRect(0, 0, 256, 256);
  const frontTex = new THREE.CanvasTexture(fc); frontTex.colorSpace = THREE.SRGBColorSpace;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: frontTex, side: THREE.DoubleSide }));
  front.position.set(0, 0, 12); front.lookAt(0, 0, 0); studio.add(front);
  box(3, 9, 0xd9ff7a, 4.2, [9, -1, 2]);
  box(2, 6, 0xf2ff9a, 3.0, [-6, -6, 4]);
  scene.environment = pmrem.fromScene(studio, 0.015).texture;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 0, 5.4);

  if (document.fonts) await document.fonts.ready;   // the engraved lettering uses the page's typefaces
  // ---- face artwork: height map, white = raised. Both sides share it: the front carries "AI", the back a "1" ----
  const S = 1024, C = S / 2;
  const art = (mark, legend, size, dx, dy) => {
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    g.fillStyle = '#9c9c9c'; g.fillRect(0, 0, S, S);
    const ring = (r0, r1, col) => { g.beginPath(); g.arc(C, C, r1, 0, Math.PI * 2); g.arc(C, C, r0, 0, Math.PI * 2, true); g.fillStyle = col; g.fill(); };
    ring(C * 0.90, C * 0.995, '#f2f2f2');          // raised outer rim
    ring(C * 0.87, C * 0.885, '#4a4a4a');          // groove inside the rim
    // guilloche: overlapping rosette curves between the rim and the centre medallion
    g.lineWidth = 1.3; g.strokeStyle = 'rgba(240,240,240,.6)';
    for (let k = 0; k < 60; k++) {
      g.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.01) {
        const r = C * (0.63 + 0.07 * Math.sin(a * 16 + k * 0.105) + 0.02 * Math.sin(a * 48 + k * 0.3));
        const x = C + r * Math.cos(a), y = C + r * Math.sin(a);
        a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    // engraved legend between rim and guilloche
    g.save(); g.translate(C, C);
    g.font = `500 ${S * 0.042}px "Geist Mono", ui-monospace, monospace`; g.fillStyle = '#3c3c3c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...legend].forEach((ch, i) => { g.save(); g.rotate((i / legend.length) * Math.PI * 2); g.fillText(ch, 0, -C * 0.79); g.restore(); });
    g.restore();
    // centre medallion with the raised mark
    ring(C * 0.40, C * 0.43, '#efefef');
    g.beginPath(); g.arc(C, C, C * 0.40, 0, Math.PI * 2); g.fillStyle = '#8a8a8a'; g.fill();
    for (let r = C * 0.06; r < C * 0.39; r += C * 0.018) { g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.strokeStyle = 'rgba(120,120,120,.5)'; g.lineWidth = 1.2; g.stroke(); }
    g.font = `600 ${S * size}px "Inter Tight", system-ui, sans-serif`; g.fillStyle = '#f7f7f7'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText(mark, C + S * dx, C + S * dy);
    return c;
  };
  const c = art('AI', 'AIUSD · REDEEMABLE 1:1 · AIUSD · REDEEMABLE 1:1 · ', 0.29, -0.006, 0.104);

  const faceTex = new THREE.CanvasTexture(c);
  faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // the same artwork, softened into a colour map so engraved parts read slightly darker
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: 0xf3f5f4, metalness: 1, roughness: 0.3, bumpMap: faceTex, bumpScale: 1.6, envMapIntensity: 1.0,
    map: faceTex, clearcoat: 0.5, clearcoatRoughness: 0.25,
  });
  faceMat.map.colorSpace = THREE.SRGBColorSpace;
  faceMat.onBeforeCompile = (sh) => {           // lift the colour map so it only shades, never greys the metal out
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
      '#ifdef USE_MAP\n vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n diffuseColor.rgb *= mix(0.82, 1.0, sampledDiffuseColor.r);\n#endif');
  };

  const b = art('1', 'AIUSD · BACKED 1:1 BY USDC · AIUSD · BACKED 1:1 BY USDC · ', 0.34, -0.004, 0.122);
  const backTex = new THREE.CanvasTexture(b);
  backTex.anisotropy = renderer.capabilities.getMaxAnisotropy(); backTex.colorSpace = THREE.SRGBColorSpace;
  const backMat = faceMat.clone(); backMat.map = backTex; backMat.bumpMap = backTex; backMat.onBeforeCompile = faceMat.onBeforeCompile;

  // reeded edge
  const e = document.createElement('canvas'); e.width = 512; e.height = 8;
  const eg = e.getContext('2d');
  for (let x = 0; x < 512; x += 4) { eg.fillStyle = x % 8 ? '#3a3a3a' : '#e0e0e0'; eg.fillRect(x, 0, 4, 8); }
  const edgeTex = new THREE.CanvasTexture(e); edgeTex.wrapS = THREE.RepeatWrapping; edgeTex.repeat.set(24, 1);
  const edgeMat = new THREE.MeshPhysicalMaterial({ color: 0xe6ebe8, metalness: 1, roughness: 0.22, bumpMap: edgeTex, bumpScale: 0.8, envMapIntensity: 1.1 });
  const bevelMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef5ea, metalness: 1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3,
    iridescence: 0.9, iridescenceIOR: 1.45, iridescenceThicknessRange: [260, 420],
  });

  const R = 1, T = 0.17;
  const coin = new THREE.Group();
  const side = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, T, 256, 1, true), edgeMat);
  side.rotation.x = Math.PI / 2; coin.add(side);
  [1, -1].forEach((dir) => {
    const face = new THREE.Mesh(new THREE.CircleGeometry(R - 0.06, 256), dir > 0 ? faceMat : backMat);
    face.position.z = dir * T / 2; if (dir < 0) face.rotation.y = Math.PI;
    coin.add(face);
    const bevel = new THREE.Mesh(new THREE.TorusGeometry(R - 0.06, 0.06, 32, 256), bevelMat);
    bevel.position.z = dir * T / 2; coin.add(bevel);
  });
  scene.add(coin);

  // a soft key light and a faint green-yellow rim light, like the reference renders
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8dfdb, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-2, 3, 4); scene.add(key);
  const rim = new THREE.PointLight(0xc8f07a, 9, 8, 2); rim.position.set(2.4, -1.2, 1.2); scene.add(rim);

  const size = () => {
    const w = wrap.clientWidth;
    renderer.setSize(w, w, false);
    camera.aspect = 1; camera.updateProjectionMatrix();
  };
  size(); addEventListener('resize', size);

  let px = 0, py = 0, tx = 0, ty = 0, live = false, t0 = performance.now();
  // turning over: a half turn eased in and out, every few seconds and on click
  let side0 = wrap.dataset.coin === 'back' ? Math.PI : 0, flipFrom = 0, flipAt = -1, nextFlip = 3;   // data-coin="back" starts on the portrait
  const FLIP = 1.4, HOLD = 6;
  const flip = (t) => { if (flipAt >= 0) return; flipFrom = side0; flipAt = t; };
  canvas.style.cursor = 'pointer';
  canvas.addEventListener('click', () => {
    const t = (performance.now() - t0) / 1000;
    if (still) { side0 += Math.PI; wrap.dataset.side = Math.round(side0 / Math.PI) % 2 ? 'back' : 'front'; requestAnimationFrame(tick); return; }
    flip(t); nextFlip = t + FLIP + HOLD;
  });
  const turn = (t) => {
    if (!still && flipAt < 0 && t >= nextFlip) flip(t);
    if (flipAt < 0) return side0;
    const k = Math.min(1, (t - flipAt) / FLIP), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    if (k >= 1) { side0 = flipFrom + Math.PI; flipAt = -1; nextFlip = t + HOLD; wrap.dataset.side = Math.round(side0 / Math.PI) % 2 ? 'back' : 'front'; return side0; }
    return flipFrom + Math.PI * e;
  };
  wrap.closest('section').addEventListener('pointermove', (ev) => {
    const b = wrap.getBoundingClientRect();
    tx = ((ev.clientX - b.left) / b.width - 0.5) * 2; ty = ((ev.clientY - b.top) / b.height - 0.5) * 2;
  });
  const tick = (now) => {
    const t = (now - t0) / 1000;
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    coin.rotation.y = -0.62 + turn(t) + (still ? 0 : Math.sin(t * 0.45) * 0.34) + px * 0.28;
    coin.rotation.x = 0.16 + (still ? 0 : Math.sin(t * 0.31) * 0.05) + py * 0.18;
    renderer.render(scene, camera);
    if (live && !still) requestAnimationFrame(tick);
  };
  new IntersectionObserver(([en]) => {
    const was = live; live = en.isIntersecting;
    if (live && !was) requestAnimationFrame(tick);
  }, { rootMargin: '120px' }).observe(wrap);
  requestAnimationFrame((n) => { tick(n); wrap.classList.add('gl'); });
}
}

document.querySelectorAll('[data-coin]').forEach((w) => mountCoin(w, w.querySelector('canvas')));
