/* ================= utilità ================= */
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function turnTo(a, b, step) { const d = angDiff(a, b); return Math.abs(d) <= step ? b : a + Math.sign(d) * step; }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* stato globale condiviso */
let level = null, T = 0;
const camTarget = new THREE.Vector3();

/* ================= salvataggio ================= */
// stessa chiave del prototipo pixel art: monete, bestiario e abito passano da una versione all'altra
const SK = 'dungeon-train-save-v1';
const save = { bank: 0, kills: {}, outfit: 0, cls: null, startWeapon: null, runs: 0, cleared: 0, best: 0, wins: 0, quality: null, muted: false, sens: 'media' };
try { const s = JSON.parse(localStorage.getItem(SK) || 'null'); if (s && typeof s === 'object') Object.assign(save, s); } catch (e) { }
if (!save.kills || typeof save.kills !== 'object') save.kills = {};
function persist() { try { localStorage.setItem(SK, JSON.stringify(save)); } catch (e) { } }

/* ================= audio sintetizzato ================= */
const AU = { ctx: null, master: null, clackT: 0 };
const SFX = {
  jump: [420, 640, .08, 'square', .035], hit: [220, 70, .1, 'square', .06], coin: [900, 1400, .06, 'square', .025],
  parry: [1300, 500, .16, 'triangle', .09], hurt: [170, 50, .22, 'sawtooth', .07], shoot: [620, 300, .07, 'triangle', .05],
  pick: [520, 980, .12, 'square', .045], tick: [700, 700, .03, 'square', .02], open: [200, 520, .3, 'triangle', .07],
  swing: [300, 160, .07, 'triangle', .045], flip: [140, 80, .14, 'square', .06], die: [300, 40, .4, 'sawtooth', .07],
  land: [120, 50, .12, 'sine', .12], step: [95, 55, .06, 'triangle', .035], magic: [880, 1760, .12, 'sine', .04], ghost: [180, 360, .5, 'sine', .05],
  zap: [2400, 300, .16, 'square', .04], whistle: [1180, 1320, .7, 'sine', .07], fire: [1800, 200, .28, 'noise', .16], blast: [3200, 260, .22, 'noise', .3], boom: [1400, 60, .6, 'noise', .42]
};
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = new AC(); AU.ctx = ctx;
    AU.master = ctx.createGain(); AU.master.gain.value = save.muted ? 0 : 1; AU.master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    // pioggia: rumore bianco filtrato
    const b1 = ctx.createBuffer(1, len, ctx.sampleRate), d1 = b1.getChannelData(0);
    for (let i = 0; i < len; i++) d1[i] = Math.random() * 2 - 1;
    const s1 = ctx.createBufferSource(); s1.buffer = b1; s1.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1100;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const g1 = ctx.createGain(); g1.gain.value = .045; s1.connect(hp).connect(lp).connect(g1).connect(AU.master); s1.start();
    // rombo del treno: rumore marrone
    const b2 = ctx.createBuffer(1, len, ctx.sampleRate), d2 = b2.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d2[i] = last * 3.5; }
    const s2 = ctx.createBufferSource(); s2.buffer = b2; s2.loop = true;
    const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 170;
    const g2 = ctx.createGain(); g2.gain.value = .25; s2.connect(lp2).connect(g2).connect(AU.master); s2.start();
  } catch (e) { AU.ctx = null; }
}
function sfx(n) {
  const ctx = AU.ctx; if (!ctx || save.muted) return; const d = SFX[n]; if (!d) return;
  try {
    const t = ctx.currentTime;
    if (d[3] === 'noise') { // colpi e scoppi: rumore con un filtro che si chiude
      const len = Math.ceil(ctx.sampleRate * d[2]), b = ctx.createBuffer(1, len, ctx.sampleRate), ch = b.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = 'lowpass';
      f.frequency.setValueAtTime(d[0], t); f.frequency.exponentialRampToValueAtTime(Math.max(30, d[1]), t + d[2]);
      g.gain.setValueAtTime(d[4], t); g.gain.exponentialRampToValueAtTime(.0001, t + d[2]);
      s.connect(f).connect(g).connect(AU.master); s.start(t); s.stop(t + d[2] + .02); return;
    }
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = d[3]; o.frequency.setValueAtTime(d[0], t); o.frequency.exponentialRampToValueAtTime(Math.max(30, d[1]), t + d[2]);
    g.gain.setValueAtTime(d[4], t); g.gain.exponentialRampToValueAtTime(.0001, t + d[2]);
    o.connect(g).connect(AU.master); o.start(t); o.stop(t + d[2] + .02);
  } catch (e) { }
}
function clack() { // il "ta-tum" delle ruote sulle giunture
  const ctx = AU.ctx; if (!ctx || save.muted) return;
  try {
    const t = ctx.currentTime;
    for (const off of [0, .14]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(74, t + off); o.frequency.exponentialRampToValueAtTime(40, t + off + .12);
      g.gain.setValueAtTime(.16, t + off); g.gain.exponentialRampToValueAtTime(.0001, t + off + .15);
      o.connect(g).connect(AU.master); o.start(t + off); o.stop(t + off + .17);
    }
  } catch (e) { }
}
function setMuted(m) { save.muted = m; persist(); if (AU.master) AU.master.gain.value = m ? 0 : 1; $('#bAudio').textContent = m ? 'Audio no' : 'Audio sì'; }

/* ================= input ================= */
const held = {}, pressed = {};
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'turnL', KeyD: 'right', ArrowRight: 'turnR',
  Space: 'jump', KeyJ: 'attack', KeyZ: 'attack', KeyK: 'parry', KeyX: 'parry', KeyQ: 'parry', ShiftLeft: 'slide', ShiftRight: 'slide', KeyL: 'slide', KeyC: 'slide',
  KeyE: 'interact', KeyF: 'interact', Enter: 'confirm', NumpadEnter: 'confirm', Escape: 'back', KeyB: 'bestiary', KeyM: 'mute'
};
function press(a, on) { if (on && !held[a]) pressed[a] = true; held[a] = on; }
function releaseAll() { for (const k in held) held[k] = false; joy.x = joy.y = 0; }
addEventListener('blur', releaseAll);
const mouse = { nx: 0, ny: 0, t: -1e9 };
const joy = { id: null, x: 0, y: 0, ox: 0, oy: 0 };
let isTouch = matchMedia('(pointer:coarse)').matches;
function enableTouch() { if (!document.body.classList.contains('touch')) { document.body.classList.add('touch'); isTouch = true; } }
if (isTouch) enableTouch();
addEventListener('touchstart', () => { enableTouch(); audioInit(); }, { passive: true });
