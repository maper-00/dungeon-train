/* ================= forme morbide, texture e materiali realistici ================= */
// rumore a valore che si ripete (le texture si affiancano senza cuciture); periodi diversi sui due assi
function vnoise(R, px, py = px) {
  const g = new Float32Array(px * py); for (let i = 0; i < g.length; i++) g[i] = R();
  return (u, v) => {
    const x = u * px, y = v * py, xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const x0 = ((xi % px) + px) % px, y0 = ((yi % py) + py) % py, x1 = (x0 + 1) % px, y1 = (y0 + 1) % py;
    const a = g[y0 * px + x0], b = g[y0 * px + x1], c = g[y1 * px + x0], d = g[y1 * px + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function fbm(R, px, py, oct = 4) {
  const ns = []; for (let o = 0; o < oct; o++) ns.push(vnoise(R, px << o, py << o));
  return (u, v) => { let s = 0, a = 1, t = 0; for (const n of ns) { s += n(u, v) * a; t += a; a *= .5; } return s / t; };
}
// disegna pixel per pixel tre mappe insieme: f(u, v, o) riempie o = [r, g, b (0..255), altezza, ruvidità (0..1)]
function paint(W, H, f) {
  const mk = () => { const c = cvs(W, H), g = c.getContext('2d'); return { c, g, d: g.createImageData(W, H) }; };
  const C = mk(), Hh = mk(), Ro = mk(), o = [0, 0, 0, .5, .5];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    o[3] = .5; o[4] = .5; f(x / W, y / H, o);
    const i = (y * W + x) * 4, h = clamp(o[3], 0, 1) * 255, r = clamp(o[4], 0, 1) * 255;
    C.d.data[i] = o[0]; C.d.data[i + 1] = o[1]; C.d.data[i + 2] = o[2]; C.d.data[i + 3] = 255;
    Hh.d.data[i] = Hh.d.data[i + 1] = Hh.d.data[i + 2] = h; Hh.d.data[i + 3] = 255;
    Ro.d.data[i] = Ro.d.data[i + 1] = Ro.d.data[i + 2] = r; Ro.d.data[i + 3] = 255;
  }
  C.g.putImageData(C.d, 0, 0); Hh.g.putImageData(Hh.d, 0, 0); Ro.g.putImageData(Ro.d, 0, 0);
  return { map: toTex(C.c), bump: toTex(Hh.c, false), rough: toTex(Ro.c, false), canvas: C.c };
}
const mix3 = (o, a, b, k) => { o[0] = a[0] + (b[0] - a[0]) * k; o[1] = a[1] + (b[1] - a[1]) * k; o[2] = a[2] + (b[2] - a[2]) * k; };

/* ---------- texture dei materiali ---------- */
// legno: la venatura corre lungo u (le coordinate UV dei pezzi la allineano al lato lungo)
function woodPBR(seed, dark, light, rings = 7, S = 512) {
  const R = mulberry(seed), warp = fbm(R, 2, 5, 2), fib = vnoise(R, 5, 260), fib2 = vnoise(R, 3, 70), mot = fbm(R, 2, 3, 2), pore = vnoise(R, 24, 340), knot = vnoise(R, 3, 2);
  return paint(S, S, (u, v, o) => {
    const w = warp(u, v), kn = Math.max(0, knot(u, v) - .78) * 5;
    const r = v * rings + w * 2.4 + Math.sin(u * TAU + w * 4) * .18 + kn * Math.sin(u * TAU * 3) * .6;
    const ring = Math.pow(Math.abs(Math.sin(r * Math.PI)), .55);
    const f = fib(u, v) * .65 + fib2(u, v) * .35, m = mot(u, v), pr = pore(u, v), pp = pr > .8 ? (pr - .8) * 5 : 0;
    const k = clamp(.18 + ring * .5 + (f - .5) * .55 + (m - .5) * .4 - pp * .35 - kn * .25, 0, 1);
    mix3(o, dark, light, k);
    o[3] = .55 + (ring - .5) * .25 + (f - .5) * .55 - pp * .5;
    o[4] = .55 + (m - .5) * .5 + (1 - ring) * .12 + pp * .2;
  });
}
// assi di una cassa: tavole verticali con fessure, chiodi e polvere
function cratePBR(seed, S = 512) {
  const R = mulberry(seed), fib = vnoise(R, 260, 6), fib2 = vnoise(R, 60, 3), mot = fbm(R, 3, 3, 4), N = 4, sh = [];
  for (let i = 0; i < N; i++) sh.push(.8 + R() * .35);
  return paint(S, S, (u, v, o) => {
    const p = u * N, i = Math.floor(p), f = p - i, seam = f < .025 || f > .975, edge = Math.min(f, 1 - f);
    const fb = fib(u, v) * .7 + fib2(u, v) * .3, m = mot(u, v);
    let k = clamp((.42 + (fb - .5) * .6 + (m - .5) * .45) * sh[i], 0, 1);
    const nail = Math.hypot((f - .5) * .55, ((v * 4 + .5) % 1) - .5) < .045 && (Math.abs(v * 4 % 1 - .25) < .1 || Math.abs(v * 4 % 1 - .75) < .1) ? 0 : 1;
    mix3(o, [54, 38, 24], [176, 136, 92], k);
    if (seam) { o[0] *= .25; o[1] *= .25; o[2] *= .25; }
    if (!nail) { o[0] = 70; o[1] = 64; o[2] = 60; }
    o[3] = seam ? 0 : clamp(.5 + Math.min(1, edge * 14) * .3 + (fb - .5) * .5, 0, 1) + (nail ? 0 : .3);
    o[4] = seam ? 1 : .78 + (m - .5) * .3 - (nail ? 0 : .3);
  });
}
// pelle: grana fine, macchie e pieghe; neutra, il colore lo dà il materiale
function leatherPBR(seed, S = 256) {
  const R = mulberry(seed), mot = fbm(R, 3, 3, 4), g1 = vnoise(R, 70, 70), g2 = vnoise(R, 140, 140), cr = fbm(R, 5, 5, 3), sc = vnoise(R, 24, 4);
  return paint(S, S, (u, v, o) => {
    const m = mot(u, v), g = g1(u, v) * .55 + g2(u, v) * .45, c = Math.abs(cr(u, v) - .5), crease = c < .018 ? 1 - c / .018 : 0, s = sc(u, v) > .86 ? 1 : 0;
    const k = clamp(.86 + (m - .5) * .18 + (g - .5) * .12 - crease * .16 + s * .05, 0, 1) * 255;
    o[0] = k; o[1] = k * .97; o[2] = k * .93;
    o[3] = .55 + (g - .5) * .7 - crease * .5;
    o[4] = .66 + (g - .5) * .25 - Math.max(0, m - .6) * 1.1 + crease * .1;
  });
}
// velluto capitonné: cuscinetti a rombo con bottoni nelle pieghe
function tuftPBR(S = 256, n = 2) {
  const R = mulberry(17), nap = vnoise(R, 64, 64), mot = fbm(R, 4, 4, 3);
  return paint(S, S, (u, v, o) => {
    const a = (u + v) * n, b = (u - v) * n, fa = a - Math.floor(a) - .5, fb = b - Math.floor(b) - .5;
    const pill = (1 - Math.pow(Math.abs(fa) * 2, 2.2)) * (1 - Math.pow(Math.abs(fb) * 2, 2.2));
    const dc = Math.hypot(.5 - Math.abs(fa), .5 - Math.abs(fb)), btn = dc < .07, crease = Math.min(.5 - Math.abs(fa), .5 - Math.abs(fb));
    const nn = nap(u, v), m = mot(u, v);
    const k = clamp(.58 + pill * .38 + (nn - .5) * .1 + (m - .5) * .12 - (crease < .03 ? .25 : 0), 0, 1);
    o[0] = o[1] = o[2] = (btn ? .5 + (1 - dc / .07) * .25 : k) * 255;
    o[3] = btn ? .35 + (1 - dc / .07) * .3 : pill * .9 + nn * .06;
    o[4] = .85 + (nn - .5) * .2;
  });
}
// velluto liscio, panno e lana: trama fitta più qualche variazione
function clothPBR(seed, S = 256, weave = 96, base = .86) {
  const R = mulberry(seed), mot = fbm(R, 3, 3, 4), fz = vnoise(R, 128, 128);
  return paint(S, S, (u, v, o) => {
    const w = (Math.sin(u * weave * TAU) * Math.sin(v * weave * TAU) + 1) * .5, m = mot(u, v), z = fz(u, v);
    const k = clamp(base + (w - .5) * .1 + (m - .5) * .22 + (z - .5) * .08, 0, 1) * 255;
    o[0] = k; o[1] = k; o[2] = k;
    o[3] = .5 + (w - .5) * .5 + (z - .5) * .2;
    o[4] = .9 + (z - .5) * .1;
  });
}
// coperta scozzese
function plaidPBR(S = 256) {
  const R = mulberry(23), z = vnoise(R, 128, 128);
  const band = t => { t = t * 4 % 1; return t < .14 ? 0 : t < .2 ? 1 : t < .5 ? 2 : t < .54 ? 3 : 2; };
  const C = [[120, 22, 30], [30, 58, 42], [86, 18, 26], [205, 170, 90]];
  return paint(S, S, (u, v, o) => {
    const a = band(u), b = band(v), tw = (Math.floor(u * 128) + Math.floor(v * 128)) % 2;
    const c = C[tw ? a : b], c2 = C[tw ? b : a], k = .78 + z(u, v) * .22;
    o[0] = (c[0] * .65 + c2[0] * .35) * k; o[1] = (c[1] * .65 + c2[1] * .35) * k; o[2] = (c[2] * .65 + c2[2] * .35) * k;
    o[3] = .5 + (tw - .5) * .4 + (z(u, v) - .5) * .3; o[4] = .95;
  });
}
// metallo spazzolato con patina (ottone, acciaio): striature lungo u, macchie scure nelle zone toccate meno
function metalPBR(seed, patina, S = 256) {
  const R = mulberry(seed), br = vnoise(R, 4, 220), br2 = vnoise(R, 2, 60), mot = fbm(R, 3, 3, 4), sp = vnoise(R, 30, 30);
  return paint(S, S, (u, v, o) => {
    const b = br(u, v) * .7 + br2(u, v) * .3, m = mot(u, v), pt = Math.max(0, m - .58) * 2.6, s = sp(u, v) > .9 ? 1 : 0;
    const k = clamp(.9 + (b - .5) * .14 - pt * .35 - s * .1, 0, 1) * 255;
    o[0] = k * (1 - pt * patina[0]); o[1] = k * (1 - pt * patina[1]); o[2] = k * (1 - pt * patina[2]);
    o[3] = .5 + (b - .5) * .2 - s * .3;
    o[4] = clamp(.3 + (b - .5) * .3 + pt * .5 + s * .2, 0, 1);
  });
}
// carta ingiallita
function paperPBR(S = 256) {
  const R = mulberry(41), mot = fbm(R, 3, 3, 4), fb = vnoise(R, 160, 160);
  return paint(S, S, (u, v, o) => {
    const m = mot(u, v), f = fb(u, v), k = clamp(.9 + (m - .5) * .2 + (f - .5) * .06, 0, 1);
    o[0] = 236 * k; o[1] = 226 * k; o[2] = 202 * k; o[3] = .5 + (f - .5) * .3; o[4] = .92;
  });
}
// pelliccia per i ratti: ciuffi allungati
function furPBR(S = 256) {
  const R = mulberry(52), s1 = vnoise(R, 90, 10), s2 = vnoise(R, 180, 18), mot = fbm(R, 3, 3, 3);
  return paint(S, S, (u, v, o) => {
    const s = s1(u, v) * .55 + s2(u, v) * .45, m = mot(u, v), k = clamp(.72 + (s - .5) * .55 + (m - .5) * .25, 0, 1) * 255;
    o[0] = k; o[1] = k; o[2] = k; o[3] = .3 + s * .7; o[4] = .9;
  });
}
// osso: liscio con venature e pori
function bonePBR(S = 256) {
  const R = mulberry(61), mot = fbm(R, 3, 3, 4), vn = fbm(R, 6, 2, 3), pr = vnoise(R, 120, 120);
  return paint(S, S, (u, v, o) => {
    const m = mot(u, v), c = Math.abs(vn(u, v) - .5), crack = c < .012 ? 1 - c / .012 : 0, p = pr(u, v) > .82 ? 1 : 0;
    const k = clamp(.86 + (m - .5) * .3 - crack * .35 - p * .08, 0, 1);
    o[0] = 238 * k; o[1] = 226 * k; o[2] = 200 * k; o[3] = .6 + (m - .5) * .2 - crack * .5 - p * .2; o[4] = .55 + (m - .5) * .3 + crack * .3;
  });
}

/* ---------- texture disegnate: etichette, libri, giornale, ritratto, orologio, rete ---------- */
function canvasTex(c, srgb = true) { const t = toTex(c, srgb); return t; }
// etichette di viaggio sulle valigie: atlante 4x2
const STICKERS = [['ROMA', 'TERMINI', '#b8342c', '#f1e2c0', 'o'], ['VENEZIA', 'S. LUCIA', '#1f4a7a', '#f2e6c8', 'c'], ['PARIGI', 'GARE DE LYON', '#f0d9a0', '#2c2a4a', 'r'], ['VIENNA', 'WESTBAHNHOF', '#2f6a4a', '#f3e9cf', 'o'],
  ['ISTANBUL', 'SIRKECI', '#c9862e', '#2a1a12', 'c'], ['TRIESTE', 'CENTRALE', '#e9e0c8', '#8a2430', 'r'], ['GRAND HOTEL', 'BAGAGLIO', '#6a2a5a', '#f2dcb0', 'o'], ['FRAGILE', 'MANEGGIARE', '#d8c070', '#7a1a1a', 'r']];
function stickerTexture() {
  const W = 1024, H = 512, c = cvs(W, H), g = c.getContext('2d'), R = mulberry(88);
  g.clearRect(0, 0, W, H);
  STICKERS.forEach(([t, s, bg, fg, shape], i) => {
    const cx = (i % 4) * 256 + 128, cy = Math.floor(i / 4) * 256 + 128;
    g.save(); g.translate(cx, cy);
    g.beginPath();
    if (shape === 'o') g.ellipse(0, 0, 118, 92, 0, 0, TAU); else if (shape === 'c') g.arc(0, 0, 112, 0, TAU); else { g.rect(-118, -80, 236, 160); }
    g.fillStyle = bg; g.fill(); g.lineWidth = 6; g.strokeStyle = fg; g.stroke();
    g.beginPath(); if (shape === 'o') g.ellipse(0, 0, 104, 78, 0, 0, TAU); else if (shape === 'c') g.arc(0, 0, 98, 0, TAU); else g.rect(-106, -68, 212, 136); g.lineWidth = 2; g.stroke();
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 ' + (t.length > 8 ? 30 : 40) + 'px Manrope, sans-serif'; g.fillText(t, 0, -8);
    g.font = '500 15px "JetBrains Mono", monospace'; g.fillText(s, 0, 30);
    g.fillRect(-60, 46, 120, 2);
    // usura: graffi e sbiaditure trasparenti
    g.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 90; k++) { g.globalAlpha = .15 + R() * .5; g.fillRect(-120 + R() * 240, -95 + R() * 190, 1 + R() * 6, 1 + R() * 2); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.restore();
  });
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// libri: 16 dorsi in alto, copertine e tagli delle pagine in basso
const BOOK_COLS = ['#5a1a22', '#1f2c4a', '#24402c', '#4a2a18', '#3a1f4a', '#6a4a1c', '#1a1a1e', '#7a2a1c', '#2c4a4a', '#5a3a2a', '#40202a', '#283a20', '#6a5a3a', '#1e3040', '#4a1a3a', '#3a3020'];
function bookTexture() {
  const S = 512, c = cvs(S, S), g = c.getContext('2d'), R = mulberry(9);
  for (let i = 0; i < 16; i++) {
    const x = i * 32, col = BOOK_COLS[i];
    g.fillStyle = col; g.fillRect(x, 0, 32, 384);
    const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(.3, 'rgba(255,255,255,.08)'); gr.addColorStop(.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.5)');
    g.fillStyle = gr; g.fillRect(x, 0, 32, 384);
    g.fillStyle = '#c9a050';
    const bands = R() < .5 ? [24, 34, 340, 350] : [40, 46, 300, 306, 330, 336];
    for (let k = 0; k < bands.length; k += 2) g.fillRect(x + 3, bands[k], 26, bands[k + 1] - bands[k]);
    if (R() < .7) { g.fillStyle = R() < .5 ? '#1a1410' : '#7a1a1a'; g.fillRect(x + 5, 80, 22, 90); g.fillStyle = '#c9a050'; for (let k = 0; k < 4; k++) g.fillRect(x + 9, 92 + k * 18, 14, 3); }
    else { g.fillStyle = '#c9a050'; for (let k = 0; k < 6; k++) g.fillRect(x + 10, 100 + k * 14, 12, 2); }
    for (let k = 0; k < 120; k++) { g.fillStyle = `rgba(${R() < .5 ? '255,240,210' : '0,0,0'},${R() * .1})`; g.fillRect(x + R() * 32, R() * 384, 1 + R() * 2, 1 + R() * 3); }
  }
  // copertine (in basso a sinistra) e pagine (in basso a destra)
  g.fillStyle = '#3a2418'; g.fillRect(0, 384, 256, 128);
  for (let k = 0; k < 300; k++) { g.fillStyle = `rgba(0,0,0,${R() * .15})`; g.fillRect(R() * 256, 384 + R() * 128, 2, 2); }
  g.fillStyle = '#e8dcc0'; g.fillRect(256, 384, 256, 128);
  for (let y = 386; y < 512; y += 2) { g.fillStyle = `rgba(120,100,70,${.1 + R() * .15})`; g.fillRect(256, y, 256, 1); }
  return canvasTex(c);
}
// giornale piegato
function newsTexture() {
  const W = 256, H = 256, c = cvs(W, H), g = c.getContext('2d'), R = mulberry(14);
  g.fillStyle = '#e4dcc6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1c1a18'; g.font = '700 26px Georgia, serif'; g.textAlign = 'center'; g.fillText('IL CORRIERE', W / 2, 32);
  g.font = '500 10px "JetBrains Mono", monospace'; g.fillText('DEL BINARIO · EDIZIONE DELLA NOTTE', W / 2, 46);
  g.fillRect(12, 52, W - 24, 2);
  g.font = '700 15px Georgia, serif'; g.textAlign = 'left'; g.fillText('TRENO SENZA FERMATE:', 14, 72); g.fillText('NESSUNO SCENDE', 14, 89);
  for (let col = 0; col < 3; col++) for (let y = 100; y < H - 10; y += 6) { const w = 60 + R() * 12; if (R() < .06) continue; g.fillStyle = 'rgba(30,26,22,.55)'; g.fillRect(14 + col * 80, y, w, 2); }
  g.fillStyle = 'rgba(30,26,22,.8)'; g.fillRect(176, 60, 66, 34);
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// ritratto a olio del capotreno: volto lungo e verdastro, berretto altissimo, baffi a spirale, un monocolo
function portraitTexture() {
  const W = 256, H = 320, c = cvs(W, H), g = c.getContext('2d'), R = mulberry(66);
  let gr = g.createRadialGradient(128, 130, 20, 128, 160, 220); gr.addColorStop(0, '#3a2e22'); gr.addColorStop(1, '#0e0a08'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const stroke = (x, y, w, h, col, a = .5) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, w, h, R() * .6 - .3, 0, TAU); g.fill(); g.globalAlpha = 1; };
  for (let i = 0; i < 400; i++) stroke(R() * W, R() * H, 4 + R() * 12, 2 + R() * 4, R() < .5 ? '#4a3a2a' : '#1a1410', .12);
  // giacca
  g.fillStyle = '#1b2440'; g.beginPath(); g.moveTo(40, H); g.quadraticCurveTo(60, 220, 128, 210); g.quadraticCurveTo(196, 220, 216, H); g.fill();
  g.fillStyle = '#c9a050'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(128, 240 + i * 20, 4, 0, TAU); g.fill(); }
  // collo lungo
  g.fillStyle = '#8fa48a'; g.fillRect(114, 170, 28, 46);
  // volto allungato
  gr = g.createLinearGradient(90, 90, 170, 190); gr.addColorStop(0, '#b9c8a8'); gr.addColorStop(1, '#6d7f68');
  g.fillStyle = gr; g.beginPath(); g.ellipse(128, 140, 36, 56, 0, 0, TAU); g.fill();
  for (let i = 0; i < 80; i++) stroke(100 + R() * 56, 100 + R() * 80, 3 + R() * 6, 1 + R() * 3, R() < .5 ? '#c9d6b6' : '#5a6a56', .2);
  // occhi piccoli e lontani, uno dietro il monocolo
  g.fillStyle = '#1a1210'; g.beginPath(); g.arc(112, 128, 4, 0, TAU); g.arc(146, 126, 6, 0, TAU); g.fill();
  g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(147, 124, 2, 0, TAU); g.fill();
  g.strokeStyle = '#d9b060'; g.lineWidth = 3; g.beginPath(); g.arc(146, 126, 13, 0, TAU); g.stroke();
  g.lineWidth = 1; g.beginPath(); g.moveTo(158, 132); g.quadraticCurveTo(170, 170, 160, 210); g.stroke();
  // naso lunghissimo e baffi a spirale
  g.fillStyle = '#7e9474'; g.beginPath(); g.moveTo(126, 128); g.quadraticCurveTo(122, 160, 134, 168); g.lineTo(128, 132); g.fill();
  g.strokeStyle = '#e8e2d2'; g.lineWidth = 5; g.lineCap = 'round';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(128, 172); g.bezierCurveTo(128 + s * 30, 168, 128 + s * 52, 180, 128 + s * 44, 158); g.arc(128 + s * 38, 160, 6, 0, s * 4); g.stroke(); }
  // berretto altissimo
  g.fillStyle = '#141c34'; g.beginPath(); g.moveTo(92, 96); g.lineTo(100, 8); g.quadraticCurveTo(128, -2, 156, 8); g.lineTo(164, 96); g.fill();
  g.fillStyle = '#0a0a0e'; g.beginPath(); g.ellipse(128, 98, 48, 9, 0, 0, TAU); g.fill();
  g.fillStyle = '#c9a050'; g.fillRect(118, 60, 20, 16); g.fillRect(96, 86, 64, 4);
  // vernice screpolata
  g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = .7;
  for (let i = 0; i < 70; i++) { let x = R() * W, y = R() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - .5) * 22; y += (R() - .5) * 22; g.lineTo(x, y); } g.stroke(); }
  gr = g.createRadialGradient(128, 160, 60, 128, 160, 200); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
function clockTexture() {
  const S = 256, c = cvs(S, S), g = c.getContext('2d');
  let gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, '#f2e8cf'); gr.addColorStop(1, '#c9b88f'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.translate(128, 128); g.fillStyle = '#1a1410'; g.strokeStyle = '#1a1410';
  for (let i = 0; i < 60; i++) { g.save(); g.rotate(i / 60 * TAU); g.fillRect(-1, -118, 2, i % 5 ? 6 : 14); g.restore(); }
  const N = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  g.font = '600 20px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  N.forEach((n, i) => { const a = i / 12 * TAU; g.fillText(n, Math.sin(a) * 88, -Math.cos(a) * 88); });
  g.font = '500 9px "JetBrains Mono", monospace'; g.fillText('FERROVIE DELLA NOTTE', 0, 40);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// rete del portabagagli (trasparente fuori dai fili)
function netTexture() {
  const S = 128, c = cvs(S, S), g = c.getContext('2d');
  g.strokeStyle = '#b89a6a'; g.lineWidth = 3;
  for (let i = -S; i < S * 2; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); g.beginPath(); g.moveTo(i, S); g.lineTo(i + S, 0); g.stroke(); }
  g.fillStyle = '#d8c090'; for (let x = 0; x < S; x += 32) for (let y = 0; y < S; y += 32) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.arc(x + 16, y + 16, 3, 0, TAU); g.fill(); }
  return canvasTex(c);
}
// monete coniate: rilievo con una piccola locomotiva
function coinBump() {
  const S = 128, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
  g.strokeStyle = '#c8c8c8'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 56, 0, TAU); g.stroke();
  g.fillStyle = '#d0d0d0';
  for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; g.beginPath(); g.arc(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46, 2, 0, TAU); g.fill(); }
  g.fillRect(36, 56, 44, 18); g.fillRect(70, 44, 14, 30); g.fillRect(42, 46, 8, 10); g.beginPath(); g.moveTo(84, 74); g.lineTo(94, 74); g.lineTo(84, 64); g.fill();
  g.fillStyle = '#909090'; for (const x of [46, 62, 78]) { g.beginPath(); g.arc(x, 78, 7, 0, TAU); g.fill(); }
  g.fillStyle = '#d0d0d0'; for (const x of [46, 62, 78]) { g.beginPath(); g.arc(x, 78, 4, 0, TAU); g.fill(); }
  return canvasTex(c, false);
}

/* ---------- geometrie ---------- */
const _gm = new THREE.Matrix4(), _gq = new THREE.Quaternion(), _ge = new THREE.Euler(), _gs = new THREE.Vector3(1, 1, 1), _gp = new THREE.Vector3(), _gv = new THREE.Vector3();
// scatola con gli spigoli arrotondati (resta indicizzata: si unisce alle altre geometrie)
function rbox(w, h, d, r = .03, s = 2) {
  r = Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001);
  if (r < .004) return new THREE.BoxGeometry(w, h, d);
  const N = s * 2 + 1, g = new THREE.BoxGeometry(1, 1, 1, N, N, N), P = g.attributes.position.array, Nm = g.attributes.normal.array;
  const H = [w / 2 - r, h / 2 - r, d / 2 - r], c = [0, 0, 0], o = [0, 0, 0];
  for (let i = 0; i < P.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      const k = Math.round((P[i + a] + .5) * N);
      if (k <= s) { c[a] = -H[a]; o[a] = -Math.tan((s - k) / s * Math.PI / 4); } else { c[a] = H[a]; o[a] = Math.tan((k - s - 1) / s * Math.PI / 4); }
    }
    _gv.set(o[0], o[1], o[2]).normalize();
    P[i] = c[0] + _gv.x * r; P[i + 1] = c[1] + _gv.y * r; P[i + 2] = c[2] + _gv.z * r;
    Nm[i] = _gv.x; Nm[i + 1] = _gv.y; Nm[i + 2] = _gv.z;
  }
  return g;
}
// UV in metri proiettate sui tre assi, con la u lungo il lato più lungo (la venatura segue il pezzo)
function grainUV(g, sc = 1, off) {
  g.computeBoundingBox(); const bb = g.boundingBox, ext = [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z];
  const L = ext[0] >= ext[1] && ext[0] >= ext[2] ? 0 : ext[1] >= ext[2] ? 1 : 2;
  const P = g.attributes.position.array, N = g.attributes.normal.array, n = P.length / 3, uv = new Float32Array(n * 2);
  const ou = off ? off[0] : 0, ov = off ? off[1] : 0;
  for (let i = 0; i < n; i++) {
    const nx = Math.abs(N[i * 3]), ny = Math.abs(N[i * 3 + 1]), nz = Math.abs(N[i * 3 + 2]), A = nx >= ny && nx >= nz ? 0 : ny >= nz ? 1 : 2;
    let ua, va;
    if (A !== L) { ua = L; va = 3 - A - L; } else { ua = (L + 1) % 3; va = (L + 2) % 3; }
    uv[i * 2] = P[i * 3 + ua] * sc + ou; uv[i * 2 + 1] = P[i * 3 + va] * sc + ov;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
// per cilindri e torniti: la u corre lungo l'altezza (venatura del legno verticale), in metri
function cylUV(g, h, circ, sc = 1) {
  const uv = g.attributes.uv.array;
  for (let i = 0; i < uv.length; i += 2) { const u = uv[i], v = uv[i + 1]; uv[i] = v * h * sc; uv[i + 1] = u * circ * sc; }
  return g;
}
// cilindro coricato lungo z (manici, maniche): rt verso +z, rb verso -z, UV in metri
const tubeZ = (rt, rb, h, seg = 12) => cylUV(new THREE.CylinderGeometry(rt, rb, h, seg), h, (rt + rb) * Math.PI).rotateX(Math.PI / 2);
const sph = (r, w = 12, h = 10) => new THREE.SphereGeometry(r, w, h);
const capsule = (r, l, seg = 8) => new THREE.CapsuleGeometry(r, l, 4, seg);
// profilo tornito: punti [raggio, altezza] dal basso verso l'alto
function lathe(pts, seg = 16) {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(.0005, r), y)), seg);
  let h = 0, rm = 0; for (const [r, y] of pts) { h = Math.max(h, y); rm = Math.max(rm, r); }
  return cylUV(g, Math.max(.05, h), rm * TAU);
}
// tubo che si assottiglia: curve = punti [x,y,z], rf(t) = raggio lungo il tubo (0..1)
function taperTube(pts, rf, seg = 24, rad = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), closed);
  const fr = curve.computeFrenetFrames(seg, closed), pos = [], nor = [], uv = [], idx = [], P = new THREE.Vector3(), Nn = new THREE.Vector3();
  const len = curve.getLength();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg; curve.getPointAt(t, P); const r = rf(t), N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= rad; j++) {
      const a = j / rad * TAU, s = Math.sin(a), c = -Math.cos(a);
      Nn.set(c * N.x + s * B.x, c * N.y + s * B.y, c * N.z + s * B.z).normalize();
      pos.push(P.x + r * Nn.x, P.y + r * Nn.y, P.z + r * Nn.z); nor.push(Nn.x, Nn.y, Nn.z); uv.push(t * len, j / rad * .2);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b = a + rad + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
// sfera deformata (ellissoide), con un eventuale "peso" verso il basso
function blob(rx, ry, rz, seg = 16, sag = 0) {
  const g = new THREE.SphereGeometry(1, seg, Math.max(8, seg * .75 | 0)), P = g.attributes.position.array;
  for (let i = 0; i < P.length; i += 3) { const y = P[i + 1], k = 1 + sag * (-y) * .5; P[i] *= rx * k; P[i + 1] *= ry; P[i + 2] *= rz * k; }
  g.computeVertexNormals(); return g;
}
function xform(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _gm.compose(_gp.set(x, y, z), _gq.setFromEuler(_ge.set(rx, ry, rz)), _gs.set(sx, sy, sz)); g.applyMatrix4(_gm); _gs.set(1, 1, 1); return g;
}
// pezzo singolo come mesh (per i personaggi): geometria propria, ombre come bx
function part(parent, mat, g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true) {
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
}
// geometrie condivise dai pezzi dei personaggi (create una volta sola)
const SG = {};
function sg(key, make) { return SG[key] || (SG[key] = make()); }

// unisce per materiale i pezzi fermi di ogni snodo (molte meno draw call); le geometrie unite si riusano tra modelli uguali
const BAKED = {};
function bake(root, key) {
  const nodes = []; root.traverse(n => { if (!n.isMesh && !n.isSprite && !n.isLight) nodes.push(n); });
  nodes.forEach((node, ni) => {
    const slots = new Map();
    for (const c of node.children) if (c.isMesh && !c.isInstancedMesh && !c.userData.keep && !c.children.length) { let l = slots.get(c.material); if (!l) slots.set(c.material, l = []); l.push(c); }
    let si = 0;
    for (const [mat, list] of slots) {
      const k = key + '/' + ni + '/' + (si++); if (list.length < 2) continue;
      let g = BAKED[k];
      if (!g) {
        let gs = list.map(c => { c.updateMatrix(); return c.geometry.clone().applyMatrix4(c.matrix); });
        if (gs.some(x => !x.index)) gs = gs.map(x => x.index ? x.toNonIndexed() : x);
        gs.forEach(x => { for (const a of Object.keys(x.attributes)) if (a !== 'position' && a !== 'normal' && a !== 'uv') x.deleteAttribute(a); });
        g = BAKED[k] = THREE.BufferGeometryUtils.mergeBufferGeometries(gs, false);
      }
      const m = new THREE.Mesh(g, mat); m.castShadow = list.some(c => c.castShadow); m.receiveShadow = true; node.add(m);
      for (const c of list) node.remove(c);
    }
  });
  return root;
}
// oggetto composto: i pezzi si posano in coordinate locali e finiscono nel Builder già trasformati
class Kit {
  constructor(b, x = 0, y = 0, z = 0, ry = 0, s = 1) { this.b = b; this.M = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s)); }
  put(mat, g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { xform(g, x, y, z, rx, ry, rz); g.applyMatrix4(this.M); this.b.geo(mat, g); return this; }
  // scatola smussata appoggiata in y (come Builder.box), ruotata attorno al proprio centro
  box(mat, w, h, d, x, y, z, r = .012, rx = 0, ry = 0, rz = 0) { return this.put(mat, grainUV(rbox(w, h, d, r, r > .03 ? 2 : 1)), x, y + h / 2, z, rx, ry, rz); }
  // cilindro appoggiato in y (o coricato con rx/rz)
  cyl(mat, rt, rb, h, x, y, z, seg = 12, rx = 0, ry = 0, rz = 0) { const g = cylUV(new THREE.CylinderGeometry(rt, rb, h, seg), h, (rt + rb) * Math.PI); return this.put(mat, g, x, y + (rx || rz ? 0 : h / 2), z, rx, ry, rz); }
  lathe(mat, pts, x, y, z, seg = 16, rx = 0, ry = 0, rz = 0) { return this.put(mat, lathe(pts, seg), x, y, z, rx, ry, rz); }
  // tubo dritto da a a b (corrimano, montanti)
  rod(mat, r, a, b, seg = 8) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz), g = cylUV(new THREE.CylinderGeometry(r, r, l, seg, 1), l, r * TAU);
    _gq.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _gv.set(dx / l, dy / l, dz / l)); _gm.compose(_gp.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), _gq, _gs);
    g.applyMatrix4(_gm); g.applyMatrix4(this.M); this.b.geo(mat, g); return this;
  }
  // decalcomania su una faccia: rettangolo dell'atlante [u0, v0, u1, v1]
  decal(mat, w, h, x, y, z, ry, rect, rz = 0) {
    const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv.array;
    for (let i = 0; i < uv.length; i += 2) { uv[i] = rect[0] + uv[i] * (rect[2] - rect[0]); uv[i + 1] = rect[1] + uv[i + 1] * (rect[3] - rect[1]); }
    return this.put(mat, g, x, y, z, 0, ry, rz);
  }
}

/* ---------- luce di contorno per i personaggi: si staccano dal buio come in un film d'animazione ---------- */
function rim(m, col, k = .5, pw = 2.6) {
  const c = lin(col).multiplyScalar(k);
  m.onBeforeCompile = sh => {
    sh.uniforms.rimC = { value: c }; sh.uniforms.rimP = { value: pw };
    sh.fragmentShader = 'uniform vec3 rimC;\nuniform float rimP;\n' + sh.fragmentShader.replace('#include <output_fragment>', 'outgoingLight += rimC * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), rimP);\n#include <output_fragment>');
  };
  m.customProgramCacheKey = () => 'rim';
  return m;
}

/* ---------- materiali realistici: rivestono quelli esistenti e ne aggiungono di nuovi ---------- */
function pbr(hex, T, rough = 1, metal = 0, bump = .02, extra) {
  return new THREE.MeshStandardMaterial(Object.assign({ color: lin(hex), map: T.map, roughnessMap: T.rough, bumpMap: T.bump, bumpScale: bump, roughness: rough, metalness: metal, envMapIntensity: .6 }, extra || {}));
}
function velvet(hex, T, sheenHex, extra) {
  return new THREE.MeshPhysicalMaterial(Object.assign({ color: lin(hex), map: T.map, bumpMap: T.bump, bumpScale: .03, roughness: .88, metalness: 0, sheen: 1, sheenRoughness: .42, sheenColor: lin(sheenHex), envMapIntensity: .35 }, extra || {}));
}
function buildPropMaterials() {
  const wood = woodPBR(5, [62, 36, 20], [158, 104, 62], 7), oak = woodPBR(19, [70, 50, 32], [178, 140, 96], 5, 256), crate = cratePBR(31);
  const leather = leatherPBR(13), tuft = tuftPBR(), plush = clothPBR(29, 256, 110, .82), linen = clothPBR(37, 256, 64, .95), wool = plaidPBR();
  const brass = metalPBR(43, [.35, .2, .45]), steel = metalPBR(47, [.25, .22, .18]), paper = paperPBR(), fur = furPBR(), bone = bonePBR();
  [wood, oak, crate].forEach(t => { t.map.anisotropy = t.bump.anisotropy = Math.min(8, MAXANI); });
  for (const t of [leather.map, leather.bump, leather.rough]) t.repeat.set(3, 3);
  Object.assign(TEX, { woodP: wood, oakP: oak, crateP: crate, leatherP: leather, tuftP: tuft, plushP: plush, linenP: linen, woolP: wool, brassP: brass, steelP: steel, paperP: paper, furP: fur, boneP: bone });
  TEX.stickers = stickerTexture(); TEX.books = bookTexture(); TEX.news = newsTexture(); TEX.portrait = portraitTexture(); TEX.clock = clockTexture(); TEX.net = netTexture(); TEX.coin = coinBump();
  // i materiali di base diventano realistici (stesse tinte medie di prima)
  const up = (m, T, o) => { Object.assign(m, { map: T.map, roughnessMap: T.rough, bumpMap: T.bump }, o); m.needsUpdate = true; };
  up(MAT.wood, wood, { color: lin(0xd8c8b8), roughness: .9, bumpScale: .012 });
  up(MAT.woodDark, wood, { color: lin(0x8a7a70), roughness: .95, bumpScale: .012 });
  up(MAT.trunk, wood, { color: lin(0xb89a80), roughness: .9, bumpScale: .012 });
  up(MAT.leather, leather, { color: lin(0x6a4430), roughness: 1, bumpScale: .005 });
  up(MAT.brass, brass, { color: lin(0xd6a24a), roughness: 1, bumpScale: .004 });
  up(MAT.steel, steel, { color: lin(0xb4bcc6), roughness: 1, bumpScale: .003 });
  up(MAT.steelDark, steel, { color: lin(0x50565e), roughness: 1.3, bumpScale: .003 });
  up(MAT.cream, linen, { roughness: 1, bumpScale: .006 }); MAT.cream.color = lin(0xece4ce);
  up(MAT.paper, paper, { roughness: 1, bumpScale: .004 });
  for (const k of ['velvet', 'velvetDark', 'cushion']) up(MAT[k], plush, { roughness: 1, bumpScale: .01 });
  Object.assign(MAT, {
    // legni per mobili: noce lucidato, rovere, assi delle casse
    varnish: pbr(0xe8d8c8, wood, .62, 0, .01, { envMapIntensity: .9 }),
    varnishDark: pbr(0x8c766a, wood, .58, 0, .01, { envMapIntensity: .9 }),
    oak: pbr(0xffffff, oak, .95, 0, .014),
    crate: pbr(0xe8dcc8, crate, 1, 0, .03),
    // pelli e tessuti
    leatherTan: pbr(0xb07848, leather, 1, 0, .005), leatherBlack: pbr(0x2e2624, leather, .9, 0, .005), leatherRed: pbr(0x8a2a24, leather, 1, 0, .005),
    leatherGreen: pbr(0x34503a, leather, 1, 0, .005), leatherNavy: pbr(0x2a3450, leather, 1, 0, .005), leatherCream: pbr(0xd8c8a8, leather, 1, 0, .005),
    canvasTan: pbr(0xb8a078, linen, 1, 0, .01),
    sackcloth: pbr(0x9a8058, linen, 1, 0, .02),
    tuftRed: velvet(0x9a2a3a, tuft, 0xff9aa8), tuftGreen: velvet(0x2f5a44, tuft, 0x9affc8),
    velvetCurtain: velvet(0x7a1e2c, plush, 0xff8090, { side: THREE.DoubleSide }),
    velvetNavy: velvet(0x23305e, plush, 0x9ab0ff, { side: THREE.DoubleSide }),
    linen: pbr(0xf2ecdc, linen, 1, 0, .006), plaid: pbr(0xffffff, wool, 1, 0, .015),
    pillow: pbr(0xf4f0e6, linen, 1, 0, .006),
    // metalli
    brassAged: pbr(0xc89448, brass, 1, .95, .004), iron: pbr(0x3a3836, steel, 1.6, .85, .004), chrome: pbr(0xe0e6ec, steel, .5, 1, .002),
    // vetro, porcellana, cera, fiamma
    porcelain: new THREE.MeshPhysicalMaterial({ color: lin(0xf6f2ea), roughness: .18, clearcoat: .6, clearcoatRoughness: .1, envMapIntensity: .9 }),
    terracotta: pbr(0xc8744a, paper, 1, 0, .006),
    shadeMetal: std(0x2c3c36, .38, .65, { side: THREE.DoubleSide, envMapIntensity: .9 }),
    glassClear: new THREE.MeshStandardMaterial({ color: lin(0xdfe8f0), transparent: true, opacity: .32, roughness: .04, metalness: .1, envMapIntensity: 2, depthWrite: false }),
    tea: new THREE.MeshStandardMaterial({ color: lin(0x3a1a0a), roughness: .05, envMapIntensity: 1.2 }),
    shade: emis(0xfff0d8, 0xffb060, 1.9, { roughness: .3, side: THREE.DoubleSide }),
    shadeGreen: emis(0xbfffd8, 0x30c070, 1.4, { roughness: .2, side: THREE.DoubleSide }),
    bulb: emis(0xffffff, 0xffd8a0, 6),
    wax: emis(0xf4ead2, 0x6a4a20, .25, { roughness: .6 }),
    // carta stampata e decalcomanie
    stickers: new THREE.MeshStandardMaterial({ map: TEX.stickers, alphaTest: .5, roughness: .75, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    books: new THREE.MeshStandardMaterial({ map: TEX.books, roughness: .7, envMapIntensity: .5 }),
    news: new THREE.MeshStandardMaterial({ map: TEX.news, roughness: .9, side: THREE.DoubleSide }),
    portrait: new THREE.MeshStandardMaterial({ map: TEX.portrait, roughness: .45, envMapIntensity: .6 }),
    clockFace: new THREE.MeshStandardMaterial({ map: TEX.clock, roughness: .4 }),
    net: new THREE.MeshStandardMaterial({ map: TEX.net, alphaTest: .45, side: THREE.DoubleSide, roughness: .9 }),
    stencil: new THREE.MeshStandardMaterial({ color: lin(0x1a1410), transparent: true, opacity: .75, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false })
  });
  MAT.stencil.map = stencilTexture(); MAT.stencil.color = lin(0xffffff);
  const rug = persianRug(); Object.assign(MAT.rug, { map: rug.map, bumpMap: rug.bump, bumpScale: .02, alphaTest: .5, roughness: 1, color: lin(0xffffff) }); MAT.rug.needsUpdate = true;
  for (const k of ['stickers', 'stencil', 'net', 'news', 'bookGlow', 'shade', 'shadeGreen', 'bulb', 'clockFace', 'glassClear']) MAT[k].userData.noCast = true;
}
// tappeto persiano: medaglione centrale, angoli, bordure a motivi, fiori nel campo, frange ai lati corti (trasparenti fuori dai fili)
function persianRug() {
  const W = 1024, H = 576, M = 34, c = cvs(W, H), g = c.getContext('2d', { willReadFrequently: true }), R = mulberry(57);
  const x0 = M, x1 = W - M, w = x1 - x0;
  g.clearRect(0, 0, W, H);
  // frange
  for (let y = 6; y < H - 6; y += 5) for (const [a, b] of [[2, x0], [x1, W - 2]]) { g.strokeStyle = `rgba(${226 - R() * 30},${212 - R() * 30},${178 - R() * 30},1)`; g.lineWidth = 2.2; g.beginPath(); g.moveTo(a + R() * 6, y + (R() - .5) * 3); g.lineTo(b, y); g.stroke(); }
  const rect = (i, col) => { g.fillStyle = col; g.fillRect(x0 + i, i, w - i * 2, H - i * 2); };
  rect(0, '#2a1416'); rect(6, '#c79a46'); rect(10, '#1b2440'); rect(52, '#c79a46'); rect(56, '#e8d6b0'); rect(60, '#5c141c');
  // motivi della bordura: rosette e rombi alternati
  const bord = (x, y, k) => { g.save(); g.translate(x, y); if (k % 2) { g.fillStyle = '#b8862e'; g.beginPath(); g.moveTo(0, -12); g.lineTo(12, 0); g.lineTo(0, 12); g.lineTo(-12, 0); g.fill(); g.fillStyle = '#8a1e26'; g.fillRect(-4, -4, 8, 8); } else { g.fillStyle = '#d8c08a'; for (let i = 0; i < 6; i++) { g.rotate(TAU / 6); g.beginPath(); g.ellipse(0, -8, 4, 8, 0, 0, TAU); g.fill(); } g.fillStyle = '#8a1e26'; g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fill(); } g.restore(); };
  let k = 0; for (let x = x0 + 40; x < x1 - 30; x += 38) { bord(x, 31, k); bord(x, H - 31, k++); }
  for (let y = 70; y < H - 60; y += 38) { bord(x0 + 31, y, k); bord(x1 - 31, y, k++); }
  // fiori sparsi nel campo
  const cx = W / 2, cy = H / 2;
  for (let i = 0; i < 160; i++) {
    const x = x0 + 80 + R() * (w - 160), y = 80 + R() * (H - 160); if (Math.hypot((x - cx) / 300, (y - cy) / 170) < 1) continue;
    g.save(); g.translate(x, y); g.rotate(R() * TAU); g.fillStyle = pick(['#a8323a', '#c79a46', '#2a3a5c', '#3a5a40']);
    g.beginPath(); g.ellipse(0, 0, 3 + R() * 3, 7 + R() * 5, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(0, -8, 2.5, 0, TAU); g.fill(); g.restore();
  }
  // angoli
  for (const [ax, ay, a0] of [[x0 + 60, 60, 0], [x1 - 60, 60, Math.PI / 2], [x1 - 60, H - 60, Math.PI], [x0 + 60, H - 60, -Math.PI / 2]]) {
    g.save(); g.translate(ax, ay); g.rotate(a0);
    g.fillStyle = '#1b2440'; g.beginPath(); g.moveTo(0, 0); g.lineTo(150, 0); g.quadraticCurveTo(120, 90, 0, 110); g.fill();
    g.strokeStyle = '#c79a46'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#b8862e'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(20 + i * 22, 18 + Math.sin(i) * 6, 5, 0, TAU); g.fill(); }
    g.restore();
  }
  // medaglione a strati
  const med = (rx, ry, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU, r = 1 + .08 * Math.sin(a * 8); g.lineTo(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r); } g.fill(); };
  med(300, 165, '#c79a46'); med(290, 156, '#1b2440'); med(240, 128, '#e8d6b0'); med(232, 122, '#7a1a24'); med(150, 82, '#c79a46'); med(142, 76, '#1b2440'); med(70, 40, '#e8d6b0'); med(62, 34, '#a8323a');
  for (let i = 0; i < 16; i++) { g.save(); g.translate(cx, cy); g.rotate(i / 16 * TAU); g.scale(1, .56); g.fillStyle = i % 2 ? '#d8c08a' : '#3a5a40'; g.beginPath(); g.ellipse(0, -190, 14, 30, 0, 0, TAU); g.fill(); g.restore(); }
  for (let i = 0; i < 8; i++) { g.save(); g.translate(cx, cy); g.rotate(i / 8 * TAU); g.scale(1, .56); g.fillStyle = '#c79a46'; g.beginPath(); g.ellipse(0, -105, 9, 20, 0, 0, TAU); g.fill(); g.restore(); }
  // pelo consumato: rumore, macchie più chiare lungo il passaggio
  const id = g.getImageData(0, 0, W, H), d = id.data, mot = fbm(R, 6, 4, 4), pile = vnoise(R, 512, 288);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; if (!d[i + 3]) continue;
    const u = x / W, v = y / H, wear = Math.max(0, mot(u, v) - .55) * 1.4 * Math.exp(-Math.pow((v - .5) * 3, 2)), n = .86 + pile(u, v) * .22;
    for (let k = 0; k < 3; k++) d[i + k] = clamp((d[i + k] * n) * (1 - wear * .5) + wear * 70, 0, 255);
  }
  g.putImageData(id, 0, 0);
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = Math.min(8, MAXANI);
  const bc = cvs(512, 288), bg = bc.getContext('2d'), bi = bg.createImageData(512, 288);
  for (let y = 0; y < 288; y++) for (let x = 0; x < 512; x++) { const i = (y * 512 + x) * 4, v = (pile(x / 512, y / 288) * .7 + R() * .3) * 255; bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = v; bi.data[i + 3] = 255; }
  bg.putImageData(bi, 0, 0);
  return { map: t, bump: toTex(bc, false) };
}
// scritte a spruzzo sulle casse
function stencilTexture() {
  const c = cvs(512, 256), g = c.getContext('2d');
  g.fillStyle = '#20180f'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '800 64px Manrope, sans-serif'; g.fillText('FRAGILE', 256, 70);
  g.font = '700 34px "JetBrains Mono", monospace'; g.fillText('DT · 07 · MERCI', 256, 150);
  g.beginPath(); g.moveTo(236, 250); g.lineTo(236, 210); g.lineTo(216, 210); g.lineTo(256, 180); g.lineTo(296, 210); g.lineTo(276, 210); g.lineTo(276, 250); g.fill();
  const R = mulberry(3); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) { g.globalAlpha = R() * .6; g.fillRect(R() * 512, R() * 256, 1 + R() * 4, 1 + R() * 4); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
