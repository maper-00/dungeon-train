/* ================= motore grafico ================= */
const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
const QUAL = {
  alta: { pr: 1.5, shadow: 2048, dyn: true, bloom: true, rain: 1500, leaves: 170, label: 'Alta' },
  media: { pr: 1.25, shadow: 2048, dyn: false, bloom: true, rain: 800, leaves: 100, label: 'Media' },
  bassa: { pr: .75, shadow: 0, bloom: false, rain: 380, leaves: 50, label: 'Bassa' }
};
if (!QUAL[save.quality]) save.quality = isTouch ? 'media' : 'alta';
let Q = QUAL[save.quality];

const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pr));
renderer.shadowMap.enabled = Q.shadow > 0;
renderer.shadowMap.type = Q.dyn ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = !!Q.dyn;
const HDR = renderer.capabilities.isWebGL2 && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
// con WebGL2 il tone mapping lo fa il passaggio finale su un buffer HDR; altrimenti lo fanno i materiali
renderer.toneMapping = HDR ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.background = lin(0x05080b);
scene.fog = new THREE.FogExp2(lin(0x0a1117), .0105);
// near alto: il buffer di profondità del post-processing è a 16 bit
const camera = new THREE.PerspectiveCamera(30, 1, 4, 320);

const composer = new THREE.EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: HDR ? THREE.HalfFloatType : THREE.UnsignedByteType }));
composer.addPass(new THREE.RenderPass(scene, camera));
const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), .8, .55, HDR ? .95 : .78);
bloom.enabled = Q.bloom;
composer.addPass(bloom);
const grade = new THREE.ShaderPass({
  uniforms: { tDiffuse: { value: null }, exposure: { value: 1.25 }, tone: { value: HDR ? 1 : 0 }, time: { value: 0 }, vig: { value: 1 }, res: { value: new THREE.Vector2(1, 1) }, flash: { value: 0 }, sat: { value: 1.06 } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float exposure,tone,time,vig,flash,sat;uniform vec2 res;varying vec2 vUv;
  vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
    if(tone>.5)c=aces(c*exposure);
    c=pow(max(c,0.),vec3(1./2.2));
    float l=dot(c,vec3(.299,.587,.114));
    c=mix(c*vec3(.92,1.02,1.08),c*vec3(1.06,1.,.92),smoothstep(.12,.7,l));
    c=mix(vec3(l),c,sat);
    vec2 d=vUv-.5;d.x*=res.x/res.y;c*=1.-vig*.42*dot(d,d);
    c+=(h(vUv*res+fract(time*7.)*91.)-.5)*.028;
    c=mix(c,vec3(.9,.18,.16),flash*.55);
    gl_FragColor=vec4(c,1.);}`
});
composer.addPass(grade);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pr));
  renderer.setSize(w, h, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  grade.uniforms.res.value.set(w, h);
}
addEventListener('resize', resize);

function applyQuality(name) {
  save.quality = name; persist(); Q = QUAL[name];
  bloom.enabled = Q.bloom;
  renderer.shadowMap.enabled = Q.shadow > 0;
  renderer.shadowMap.type = Q.dyn ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = !!Q.dyn;
  moon.castShadow = Q.shadow > 0;
  scene.traverse(o => { if (o.userData.cs) o.castShadow = !!Q.dyn; });
  if (level) { fitShadow(level); level.shadowDirty = 3; }
  if (Q.shadow > 0) { moon.shadow.mapSize.set(Q.shadow, Q.shadow); if (moon.shadow.map) { moon.shadow.map.dispose(); moon.shadow.map = null; } }
  scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); });
  Rain.setCount(Q.rain); Wind.setCount(Q.leaves);
  resize();
}

/* ---------- texture disegnate in codice ---------- */
const MAXANI = renderer.capabilities.getMaxAnisotropy();
function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function toTex(c, srgb = true, rep) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (rep) t.repeat.set(rep[0], rep[1]); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, MAXANI); return t;
}
function stoneTextures(seed) {
  const R = mulberry(seed), S = 512, N = 4, ts = S / N;
  const col = cvs(S, S), g = col.getContext('2d'), rou = cvs(S, S), r = rou.getContext('2d'), bmp = cvs(S, S), b = bmp.getContext('2d');
  g.fillStyle = '#0a0d0f'; g.fillRect(0, 0, S, S);
  r.fillStyle = 'rgb(245,245,245)'; r.fillRect(0, 0, S, S);
  b.fillStyle = '#141414'; b.fillRect(0, 0, S, S);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let rects = [[x * ts, y * ts, ts, ts]]; const u = R();
    if (u < .25) rects = [[x * ts, y * ts, ts / 2, ts], [x * ts + ts / 2, y * ts, ts / 2, ts]];
    else if (u < .45) rects = [[x * ts, y * ts, ts, ts / 2], [x * ts, y * ts + ts / 2, ts, ts / 2]];
    for (const [rx, ry, rw, rh] of rects) {
      const v = 30 + R() * 22, t = R() * 8;
      g.fillStyle = `rgb(${v | 0},${v + t * .2 | 0},${v + 2 + t * .5 | 0})`; g.fillRect(rx + 3, ry + 3, rw - 6, rh - 6);
      for (let k = 0; k < rw * rh / 80; k++) { const l = R() < .5 ? 255 : 0; g.fillStyle = `rgba(${l},${l},${l},${.03 + R() * .06})`; g.fillRect(rx + 3 + R() * (rw - 8), ry + 3 + R() * (rh - 8), 1 + R() * 2, 1 + R() * 2); }
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(rx + 3, ry + 3, rw - 6, 2); g.fillRect(rx + 3, ry + 3, 2, rh - 6);
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(rx + 3, ry + rh - 5, rw - 6, 2); g.fillRect(rx + rw - 5, ry + 3, 2, rh - 6);
      const rv = 150 + R() * 80 | 0; r.fillStyle = `rgb(${rv},${rv},${rv})`; r.fillRect(rx + 3, ry + 3, rw - 6, rh - 6);
      const bv = 200 + R() * 45 | 0; b.fillStyle = `rgb(${bv},${bv},${bv})`; b.fillRect(rx + 4, ry + 4, rw - 8, rh - 8);
      if (R() < .3) { g.strokeStyle = 'rgba(8,10,12,.7)'; g.lineWidth = 1; g.beginPath(); let cx = rx + 10 + R() * (rw - 20), cy = ry + 10 + R() * (rh - 20); g.moveTo(cx, cy); for (let k = 0; k < 5; k++) { cx += (R() - .5) * 28; cy += (R() - .5) * 28; g.lineTo(cx, cy); } g.stroke(); }
    }
  }
  for (let i = 0; i < 6; i++) {
    const px = R() * S, py = R() * S, pr = 40 + R() * 80;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const cx = px + ox, cy = py + oy;
      let gr = g.createRadialGradient(cx, cy, 0, cx, cy, pr); gr.addColorStop(0, 'rgba(5,9,13,.6)'); gr.addColorStop(.7, 'rgba(5,9,13,.38)'); gr.addColorStop(1, 'rgba(5,9,13,0)'); g.fillStyle = gr; g.fillRect(cx - pr, cy - pr, pr * 2, pr * 2);
      gr = r.createRadialGradient(cx, cy, 0, cx, cy, pr); gr.addColorStop(0, 'rgba(12,12,12,1)'); gr.addColorStop(.75, 'rgba(12,12,12,.92)'); gr.addColorStop(1, 'rgba(12,12,12,0)'); r.fillStyle = gr; r.fillRect(cx - pr, cy - pr, pr * 2, pr * 2);
    }
  }
  return { map: toTex(col), rough: toTex(rou, false), bump: toTex(bmp, false) };
}
function woodTexture(seed, base) {
  base = base || [92, 60, 37];
  const R = mulberry(seed), S = 512, c = cvs(S, S), g = c.getContext('2d'), rows = 8, rh = S / rows;
  for (let i = 0; i < rows; i++) {
    let x = -R() * 200;
    while (x < S) {
      const len = 140 + R() * 220, k = .78 + R() * .38;
      g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`; g.fillRect(x, i * rh, len, rh);
      for (let j = 0; j < 7; j++) { g.strokeStyle = `rgba(28,14,6,${.12 + R() * .16})`; g.lineWidth = 1; g.beginPath(); const yy = i * rh + 4 + R() * (rh - 8), ph = R() * 9; g.moveTo(x, yy); for (let s = 0; s <= len; s += 14) g.lineTo(x + s, yy + Math.sin(s * .045 + ph) * 2); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x + len - 2, i * rh, 2, rh);
      x += len;
    }
    g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(0, i * rh, S, 2);
    g.fillStyle = 'rgba(255,220,180,.07)'; g.fillRect(0, i * rh + 2, S, 1);
  }
  return toTex(c);
}
function gravelTexture(seed) {
  const R = mulberry(seed), S = 256, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#1b1916'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2800; i++) { const v = 26 + R() * 52 | 0; g.fillStyle = `rgb(${v + 7},${v + 3},${v - 2})`; const s = 1 + R() * 3; g.fillRect(R() * S, R() * S, s, s); }
  return toTex(c);
}
function landscapeTexture(seed) {
  const R = mulberry(seed), W = 1024, H = 256, c = cvs(W, H), g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#070b16'); sky.addColorStop(.6, '#132034'); sky.addColorStop(1, '#2a3346');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,240,210,${.2 + R() * .6})`; g.fillRect(R() * W, R() * H * .55, 1, 1); }
  const hill = (base, amp, f, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 4) { const t = x / W * TAU; g.lineTo(x, base - amp * (Math.sin(t * f) * .6 + Math.sin(t * f * 3 + 1.3) * .3 + Math.sin(t * f * 7 + .4) * .1)); } g.lineTo(W, H); g.fill(); };
  hill(170, 40, 2, '#1a2232'); hill(196, 28, 3, '#121822');
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(255,190,110,${.5 + R() * .5})`; g.fillRect(R() * W, 200 + R() * 30, 2, 2); }
  hill(226, 18, 5, '#0a0e14');
  return toTex(c);
}
function rugTexture() {
  const c = cvs(256, 128), g = c.getContext('2d');
  g.fillStyle = '#4a1219'; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#b8862e'; g.lineWidth = 3; g.strokeRect(8, 8, 240, 112); g.lineWidth = 1; g.strokeRect(15, 15, 226, 98);
  g.fillStyle = '#6a1c26'; for (let x = 30; x < 230; x += 20) for (let y = 30; y < 100; y += 20) { g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 6, y); g.lineTo(x, y + 6); g.lineTo(x - 6, y); g.fill(); }
  g.fillStyle = '#b8862e'; g.beginPath(); g.moveTo(128, 44); g.lineTo(148, 64); g.lineTo(128, 84); g.lineTo(108, 64); g.fill();
  g.fillStyle = '#4a1219'; g.beginPath(); g.moveTo(128, 52); g.lineTo(140, 64); g.lineTo(128, 76); g.lineTo(116, 64); g.fill();
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
function leafTexture() {
  const c = cvs(64, 64), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(32, 32, 26, 14, .5, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 46); g.lineTo(54, 18); g.stroke();
  const t = toTex(c); return t;
}
function glowTexture() {
  const c = cvs(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return toTex(c, false);
}
function shaftTexture() {
  const c = cvs(64, 256), g = c.getContext('2d');
  for (let x = 0; x < 64; x++) { const e = Math.sin(x / 63 * Math.PI); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, `rgba(255,255,255,${.9 * e})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, 0, 1, 256); }
  const t = toTex(c, false); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
function glassTexture() {
  const R = mulberry(7), c = cvs(128, 256), g = c.getContext('2d');
  g.fillStyle = 'rgba(120,150,180,.12)'; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 60; i++) { const x = R() * 128, y = R() * 256, l = 10 + R() * 40; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(200,220,240,0)'); gr.addColorStop(1, 'rgba(200,220,240,.55)'); g.fillStyle = gr; g.fillRect(x, y, 1.5, l); g.fillStyle = 'rgba(220,235,250,.7)'; g.fillRect(x - .5, y + l, 2.5, 2.5); }
  return toTex(c);
}
function signTexture(text, sub) {
  const c = cvs(256, 96), g = c.getContext('2d');
  g.fillStyle = '#16100a'; g.fillRect(0, 0, 256, 96); g.strokeStyle = '#c8963c'; g.lineWidth = 4; g.strokeRect(4, 4, 248, 88);
  g.fillStyle = '#f2cf8a'; g.textAlign = 'center'; g.font = '600 34px Manrope, sans-serif'; g.fillText(text, 128, sub ? 50 : 60);
  if (sub) { g.font = '500 15px "JetBrains Mono", monospace'; g.fillStyle = '#9ba4a6'; g.fillText(sub, 128, 76); }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
const TEX = {};
function buildTextures() {
  TEX.stone = stoneTextures(11);
  TEX.wood = woodTexture(5);
  TEX.woodDark = woodTexture(9, [58, 38, 26]);
  TEX.gravel = gravelTexture(3);
  TEX.land = landscapeTexture(21);
  TEX.rug = rugTexture();
  TEX.leaf = leafTexture();
  TEX.glow = glowTexture();
  TEX.shaft = shaftTexture();
  TEX.glass = glassTexture();
}

/* ---------- materiali ---------- */
const MAT = {};
function std(hex, rough = .8, metal = 0, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: lin(hex), roughness: rough, metalness: metal, envMapIntensity: .55 }, extra || {})); }
function emis(hex, ehex, k, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: lin(hex), emissive: lin(ehex), emissiveIntensity: k, roughness: .5, envMapIntensity: .3 }, extra || {})); }
function buildMaterials() {
  Object.assign(MAT, {
    skin: std(0xd8a37c, .75), steel: std(0xa7b0ba, .32, .85), steelDark: std(0x4a5058, .45, .8), brass: std(0xc8963c, .32, .9),
    leather: std(0x4a2f22, .8), wood: std(0x6b4428, .72), woodDark: std(0x3a2417, .8), cream: std(0xe6dcc4, .7), paper: std(0xefe6d0, .9),
    bone: std(0xd8ccb0, .7), boneDark: std(0x2a2020, .95), velvet: std(0x6a1c28, .95), velvetDark: std(0x48121b, .95),
    teal: std(0x274244, .7, .15), tealDark: std(0x182c2e, .78, .1), slate: std(0x262c31, .8), black: std(0x0d0f12, .9),
    rat: std(0x625852, .9), ratPink: std(0xc4867f, .8), red: std(0x8e2630, .6), navy: std(0x1f2a52, .7), green: std(0x355a2c, .85),
    purple: std(0x4e3480, .75), white: std(0xe8e4dc, .6), robot: std(0xd9d2c0, .45, .2), robotDark: std(0x2a2d31, .5, .4),
    roofMetal: std(0x1d2a2d, .55, .5), body: std(0x1b2b2e, .6, .35), wheel: std(0x15171a, .5, .7),
    trunk: std(0x5a3520, .7), cushion: std(0x7a2230, .9), slotRed: std(0x7a1a24, .35, .4), gold: emis(0xffd27a, 0xf0a030, .35, { metalness: .9, roughness: .25 }),
    lamp: emis(0xffe2b0, 0xffa64a, 5), lampDim: emis(0x6b4a2a, 0x000000, 0), neon: emis(0xb8fff6, 0x3fe0d0, 3.2), neonRed: emis(0xff9a90, 0xff3a2a, 3.5), neonGreen: emis(0xa8ffb8, 0x3ae070, 3.5),
    eyeRed: emis(0xff7a5a, 0xff3a1a, 5), eyeTeal: emis(0xbffaf2, 0x40e8d8, 5), gem: emis(0xe0b0ff, 0xb060ff, 4), ember: emis(0xffb070, 0xff6a20, 4),
    ticket: emis(0xfff4dc, 0x9a8a60, .6), slotGlow: emis(0xfff0c8, 0xffc060, 3), bookGlow: emis(0xbffaf2, 0x40e8d8, 2.2),
    ghost: new THREE.MeshStandardMaterial({ color: lin(0x5fd4c6), emissive: lin(0x2bb8a8), emissiveIntensity: 1.6, transparent: true, opacity: .62, roughness: .4, depthWrite: false }),
    ghostCloth: new THREE.MeshStandardMaterial({ color: lin(0x1f2a52), emissive: lin(0x0c3a40), emissiveIntensity: .8, transparent: true, opacity: .85, roughness: .6 }),
    glass: new THREE.MeshStandardMaterial({ map: TEX.glass, color: lin(0x9fb6c8), transparent: true, opacity: .55, roughness: .08, metalness: 0, envMapIntensity: 1.2, depthWrite: false }),
    rug: new THREE.MeshStandardMaterial({ map: TEX.rug, roughness: .95 }),
    stoneFloor: new THREE.MeshStandardMaterial({ map: TEX.stone.map, roughnessMap: TEX.stone.rough, bumpMap: TEX.stone.bump, bumpScale: .035, roughness: 1, metalness: .05, envMapIntensity: 1.25 }),
    woodFloor: new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: .55, metalness: 0, envMapIntensity: .8 }),
    ground: new THREE.MeshStandardMaterial({ map: TEX.gravel, roughness: 1, color: lin(0x8a8a8a) }),
    leaf: new THREE.MeshStandardMaterial({ map: TEX.leaf, alphaTest: .5, side: THREE.DoubleSide, roughness: .8 }),
    land: new THREE.MeshBasicMaterial({ map: TEX.land, fog: false })
  });
}
const OUTFITS = [['Rosso vagone', 0x9b2f35, 0x6a1f26], ['Blu notte', 0x2f4a8a, 0x1f3160], ['Verde bottiglia', 0x2f6a4a, 0x1f4a33], ['Ottone', 0xb88a2e, 0x7d5c1c], ['Nero carbone', 0x3a3540, 0x24202a], ['Rosa salotto', 0xb0567e, 0x7a3a57]];
const outfitMats = OUTFITS.map(o => [std(o[1], .85), std(o[2], .9)]);

/* ---------- mappa d'ambiente per riflessi caldi e bagnati ---------- */
function buildEnvironment() {
  try {
    const pm = new THREE.PMREMGenerator(renderer);
    const es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.BoxGeometry(60, 24, 60), new THREE.MeshBasicMaterial({ color: lin(0x0a0e12), side: THREE.BackSide })));
    const warm = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 3.6, 1.6) });
    const teal = new THREE.MeshBasicMaterial({ color: new THREE.Color(.6, 2.6, 2.4) });
    const cool = new THREE.MeshBasicMaterial({ color: new THREE.Color(.55, .7, 1.0) });
    const R = mulberry(4);
    for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, .6, 1.2), warm); m.position.set((R() - .5) * 50, 2 + R() * 8, (R() - .5) * 50); es.add(m); }
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.3, 4, .3), teal); m.position.set((R() - .5) * 50, 4, (R() - .5) * 50); es.add(m); }
    const sky = new THREE.Mesh(new THREE.BoxGeometry(40, .5, 40), cool); sky.position.set(-6, 11.5, -6); es.add(sky);
    const tex = pm.fromScene(es, .03).texture; pm.dispose();
    scene.environment = tex;
  } catch (e) { }
}

/* ---------- luci globali ---------- */
const hemi = new THREE.HemisphereLight(lin(0x5d6e80), lin(0x1c150f), .62);
scene.add(hemi);
const MOON_DIR = new THREE.Vector3(-.42, 1, -.6).normalize();
const moon = new THREE.DirectionalLight(lin(0xa9bfdc), 1.25);
moon.castShadow = Q.shadow > 0;
moon.shadow.mapSize.set(Q.shadow || 512, Q.shadow || 512);
Object.assign(moon.shadow.camera, { left: -26, right: 26, top: 22, bottom: -22, near: 1, far: 90 });
moon.shadow.bias = -.0005; moon.shadow.normalBias = .035;
scene.add(moon, moon.target);
const warmFill = new THREE.DirectionalLight(lin(0xffb46b), .32);
warmFill.position.set(-1, .55, .45);
scene.add(warmFill);
function placeMoon(t) {
  if (!Q.dyn) return; // ombre statiche: la luce resta inquadrata su tutto l'ambiente
  moon.position.copy(t).addScaledVector(MOON_DIR, 45); moon.target.position.copy(t);
}
const _sm = new THREE.Matrix4(), _sc = new THREE.Vector3();
function fitShadow(L) {
  const cam = moon.shadow.camera;
  if (Q.dyn) { Object.assign(cam, { left: -26, right: 26, top: 22, bottom: -22, near: 1, far: 90 }); cam.updateProjectionMatrix(); return; }
  const cx = (L.x0 + L.x1) / 2, cz = (L.z0 + L.z1) / 2;
  moon.target.position.set(cx, 0, cz); moon.position.set(cx, 0, cz).addScaledVector(MOON_DIR, 45);
  moon.updateMatrixWorld(); moon.target.updateMatrixWorld();
  cam.position.copy(moon.position); cam.lookAt(moon.target.position); cam.updateMatrixWorld(); _sm.copy(cam.matrixWorldInverse);
  let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity, e = Infinity, f = -Infinity;
  for (const x of [L.x0 - 1.5, L.x1 + 1.5]) for (const y of [-2.6, 5.6]) for (const z of [L.z0 - 2, L.z1 + 2]) {
    _sc.set(x, y, z).applyMatrix4(_sm); a = Math.min(a, _sc.x); b = Math.max(b, _sc.x); c = Math.min(c, _sc.y); d = Math.max(d, _sc.y); e = Math.min(e, _sc.z); f = Math.max(f, _sc.z);
  }
  Object.assign(cam, { left: a, right: b, bottom: c, top: d, near: Math.max(.1, -f - 2), far: -e + 2 }); cam.updateProjectionMatrix();
}

/* ---------- costruttore a blocchi (unisce le geometrie per materiale) ---------- */
class Builder {
  constructor() { this.parts = new Map(); }
  box(mat, x, y, z, w, h, d, rotY) {
    const g = new THREE.BoxGeometry(w, h, d); if (rotY) g.rotateY(rotY); g.translate(x, y + h / 2, z);
    let a = this.parts.get(mat); if (!a) { a = []; this.parts.set(mat, a); } a.push(g); return this;
  }
  geo(mat, g) { let a = this.parts.get(mat); if (!a) { a = []; this.parts.set(mat, a); } a.push(g); return this; }
  build(parent, cast = true, recv = true) {
    const out = [];
    for (const [m, gs] of this.parts) {
      const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(gs, false);
      gs.forEach(g => g.dispose());
      const mesh = new THREE.Mesh(merged, m); mesh.castShadow = cast; mesh.receiveShadow = recv; mesh.userData.own = true;
      parent.add(mesh); out.push(mesh);
    }
    this.parts.clear(); return out;
  }
}
const GEO = {};
function boxGeo(w, h, d) { const k = w + '_' + h + '_' + d; return GEO[k] || (GEO[k] = new THREE.BoxGeometry(w, h, d)); }
function bx(parent, mat, w, h, d, x, y, z, cast = true) { const m = new THREE.Mesh(boxGeo(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
function pivot(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function disposeGroup(g) { g.traverse(o => { if (o.userData && o.userData.own && o.geometry) o.geometry.dispose(); }); }

/* ---------- particelle e atmosfera ---------- */
const TRAIN_SPEED = 26;
const Rain = {
  mesh: null, n: 0, data: null, pos: null, box: null,
  init() {
    const geo = new THREE.BufferGeometry();
    this.max = 1600; this.pos = new Float32Array(this.max * 6); this.data = new Float32Array(this.max * 4);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: lin(0xa9bdd0), transparent: true, opacity: .34, depthWrite: false }));
    this.mesh.frustumCulled = false; scene.add(this.mesh); this.setCount(Q.rain);
  },
  setCount(n) { this.n = Math.min(n, this.max); this.mesh.geometry.setDrawRange(0, this.n * 2); for (let i = 0; i < this.n; i++) this.spawn(i, true); },
  spawn(i, any) {
    const c = camTarget, d = this.data;
    for (let k = 0; k < 6; k++) {
      const x = c.x + rnd(-28, 28), z = c.z + rnd(-20, 16);
      if (level && !level.roofOpen && x > level.x0 - .3 && x < level.x1 + .3 && z > level.z0 - .3 && z < level.z1 + .3) continue;
      d[i * 4] = x; d[i * 4 + 2] = z; d[i * 4 + 1] = any ? rnd(-2, 15) : rnd(12, 16); d[i * 4 + 3] = rnd(17, 23); return;
    }
    d[i * 4 + 1] = -99;
  },
  update(dt) {
    const d = this.data, p = this.pos, wind = -5.5;
    for (let i = 0; i < this.n; i++) {
      let y = d[i * 4 + 1]; if (y < -50) { if (Math.random() < .02) this.spawn(i); continue; }
      const sp = d[i * 4 + 3]; y -= sp * dt; d[i * 4] += wind * dt; d[i * 4 + 1] = y;
      const x = d[i * 4], z = d[i * 4 + 2];
      const inside = level && x > level.x0 && x < level.x1 && z > level.z0 && z < level.z1;
      const floor = inside ? 0 : -2.4;
      if (y < floor) { if (inside && Math.random() < .25) Sparks.splash(x, z); this.spawn(i); continue; }
      const o = i * 6; p[o] = x; p[o + 1] = y; p[o + 2] = z; p[o + 3] = x - wind * .045; p[o + 4] = y + .55; p[o + 5] = z;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }
};
const _dummy = new THREE.Object3D();
const LEAF_COLS = [0xd08a2c, 0xb8621f, 0xe0b040, 0x8a4a1c, 0xc9a24a].map(h => lin(h));
const Wind = {
  mesh: null, n: 0, d: [],
  init() {
    this.max = 180; this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(.24, .17), MAT.leaf, this.max);
    this.mesh.frustumCulled = false; this.mesh.castShadow = false;
    for (let i = 0; i < this.max; i++) { this.d.push({}); this.mesh.setColorAt(i, pick(LEAF_COLS)); }
    scene.add(this.mesh); this.setCount(Q.leaves);
  },
  setCount(n) { this.n = Math.min(n, this.max); this.mesh.count = this.n; for (let i = 0; i < this.n; i++) this.spawn(i, true); },
  spawn(i, any) {
    const c = camTarget, L = this.d[i];
    for (let k = 0; k < 6; k++) {
      L.x = c.x + (any ? rnd(-26, 26) : rnd(22, 28)); L.z = c.z + rnd(-16, 14); L.y = rnd(.4, 6);
      if (!level || level.roofOpen || !(L.x > level.x0 && L.x < level.x1 && L.z > level.z0 && L.z < level.z1)) break;
      L.y = -50;
    }
    L.vx = -rnd(5, 10); L.vy = rnd(-.6, .4); L.vz = rnd(-1, 1); L.rx = rnd(0, TAU); L.ry = rnd(0, TAU); L.sx = rnd(2, 7); L.sy = rnd(2, 7); L.ph = rnd(0, TAU);
  },
  update(dt) {
    const c = camTarget;
    for (let i = 0; i < this.n; i++) {
      const L = this.d[i];
      L.x += L.vx * dt; L.y += (L.vy + Math.sin(T * 2 + L.ph) * .8) * dt; L.z += (L.vz + Math.cos(T * 1.3 + L.ph) * .6) * dt;
      L.rx += L.sx * dt; L.ry += L.sy * dt;
      if (L.x < c.x - 28 || L.y < -3 || L.y > 9) this.spawn(i);
      _dummy.position.set(L.x, L.y, L.z); _dummy.rotation.set(L.rx, L.ry, 0); _dummy.scale.setScalar(1); _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
};
// scintille e polvere (punti additivi) + schegge a cubetti
const Sparks = {
  max: 500, i: 0,
  init() {
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.max * 3); this.col = new Float32Array(this.max * 3); this.p = [];
    for (let i = 0; i < this.max; i++) { this.p.push({ l: 0 }); this.pos[i * 3 + 1] = -999; }
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mesh = new THREE.Points(geo, new THREE.PointsMaterial({ size: .16, map: TEX.glow, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    this.mesh.frustumCulled = false; scene.add(this.mesh);
  },
  emit(x, y, z, n, col, sp = 3, up = 2, life = .5, g = 6) {
    const c = col instanceof THREE.Color ? col : lin(col);
    for (let k = 0; k < n; k++) {
      const i = this.i = (this.i + 1) % this.max, P = this.p[i];
      P.x = x; P.y = y; P.z = z; P.vx = rnd(-sp, sp); P.vy = rnd(0, up); P.vz = rnd(-sp, sp); P.l = P.L = life * rnd(.6, 1.2); P.g = g;
      this.col[i * 3] = c.r * 2; this.col[i * 3 + 1] = c.g * 2; this.col[i * 3 + 2] = c.b * 2;
    }
  },
  splash(x, z) { const i = this.i = (this.i + 1) % this.max, P = this.p[i]; P.x = x; P.y = .03; P.z = z; P.vx = 0; P.vy = .6; P.vz = 0; P.l = P.L = .18; P.g = 4; this.col[i * 3] = .25; this.col[i * 3 + 1] = .3; this.col[i * 3 + 2] = .36; },
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      const P = this.p[i]; if (P.l <= 0) continue;
      P.l -= dt; P.vy -= P.g * dt; P.x += P.vx * dt; P.y += P.vy * dt; P.z += P.vz * dt;
      if (P.l <= 0) { this.pos[i * 3 + 1] = -999; continue; }
      this.pos[i * 3] = P.x; this.pos[i * 3 + 1] = P.y; this.pos[i * 3 + 2] = P.z;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.color.needsUpdate = true;
  }
};
const Chunks = {
  max: 260, i: 0,
  init() {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .7 }), this.max);
    this.mesh.castShadow = !!Q.dyn; this.mesh.userData.cs = true; this.mesh.frustumCulled = false; this.p = [];
    for (let i = 0; i < this.max; i++) { this.p.push({ l: 0 }); this.mesh.setColorAt(i, lin(0xffffff)); _dummy.position.set(0, -999, 0); _dummy.scale.setScalar(.001); _dummy.updateMatrix(); this.mesh.setMatrixAt(i, _dummy.matrix); }
    scene.add(this.mesh);
  },
  emit(x, y, z, n, cols, sp = 3.5, size = .12, life = .9) {
    for (let k = 0; k < n; k++) {
      const i = this.i = (this.i + 1) % this.max, P = this.p[i];
      Object.assign(P, { x, y, z, vx: rnd(-sp, sp), vy: rnd(1, sp * 1.4), vz: rnd(-sp, sp), l: life * rnd(.7, 1.2), s: size * rnd(.6, 1.3), rx: rnd(0, 3), ry: rnd(0, 3) });
      P.L = P.l; this.mesh.setColorAt(i, lin(Array.isArray(cols) ? pick(cols) : cols));
    }
    this.mesh.instanceColor.needsUpdate = true;
  },
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      const P = this.p[i]; if (P.l <= 0) continue;
      P.l -= dt; P.vy -= 18 * dt; P.x += P.vx * dt; P.y += P.vy * dt; P.z += P.vz * dt;
      if (P.y < P.s / 2) { P.y = P.s / 2; P.vy *= -.3; P.vx *= .6; P.vz *= .6; }
      P.rx += P.vx * dt * 3; P.ry += P.vz * dt * 3;
      const s = P.l <= 0 ? .001 : P.s * Math.min(1, P.l / P.L * 2);
      _dummy.position.set(P.x, P.l <= 0 ? -999 : P.y, P.z); _dummy.rotation.set(P.rx, P.ry, 0); _dummy.scale.setScalar(s); _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
};
const Dust = {
  init() {
    const n = 160, geo = new THREE.BufferGeometry(); this.n = n; this.pos = new Float32Array(n * 3); this.ph = new Float32Array(n);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mesh = new THREE.Points(geo, new THREE.PointsMaterial({ size: .07, map: TEX.glow, color: lin(0xffe0b0), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.mesh.frustumCulled = false; scene.add(this.mesh); this.reset();
  },
  reset() { const c = camTarget; for (let i = 0; i < this.n; i++) { this.pos[i * 3] = c.x + rnd(-14, 14); this.pos[i * 3 + 1] = rnd(.2, 4.5); this.pos[i * 3 + 2] = c.z + rnd(-6, 6); this.ph[i] = rnd(0, TAU); } },
  update(dt) {
    const c = camTarget;
    for (let i = 0; i < this.n; i++) {
      const o = i * 3; this.pos[o] += (Math.sin(T * .4 + this.ph[i]) * .15 - .12) * dt; this.pos[o + 1] += Math.cos(T * .5 + this.ph[i]) * .08 * dt; this.pos[o + 2] += Math.sin(T * .3 + this.ph[i] * 2) * .1 * dt;
      if (this.pos[o] < c.x - 15) this.pos[o] += 30; if (this.pos[o] > c.x + 15) this.pos[o] -= 30;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }
};
function shaft(parent, x, y, z, w, h, rotY, tilt, op, col) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: TEX.shaft, color: lin(col || 0xbfd2ff), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.geometry.translate(0, -h / 2, 0); m.position.set(x, y, z); m.rotation.set(tilt, rotY, 0, 'YXZ'); m.userData.own = true; m.userData.baseOp = op; parent.add(m); return m;
}
function glowSprite(parent, x, y, z, s, col, op = .8) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: lin(col), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
  sp.position.set(x, y, z); sp.scale.setScalar(s); parent.add(sp); return sp;
}
