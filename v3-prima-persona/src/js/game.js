/* ================= logica di gioco (prima persona) ================= */
let STATE = 'title';
let p = null, pet = null, run = null, merchant = null;
let enemies = [], projs = [], picks = [], hazards = [], rings = [];
let hitstop = 0, shake = 0, clockMin = 3 * 60 + 12, clackT = 0;
const GRAV = 24, JUMP = 8.4, DJUMP = 7.6;

/* ---------- collisioni sul piano ---------- */
function passable(o, opt) { return (opt.rat && (o.kind === 'seat' || o.kind === 'table')) || (opt.fly && o.kind !== 'wall'); }
function collide(e, opt = {}) {
  e.blocked = false;
  for (const o of level.obs) {
    if (passable(o, opt) || e.y >= o.h - .05) continue;
    const cx = clamp(e.x, o.x0, o.x1), cz = clamp(e.z, o.z0, o.z1); let dx = e.x - cx, dz = e.z - cz; const d2 = dx * dx + dz * dz;
    if (d2 >= e.r * e.r) continue;
    e.blocked = true;
    if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (e.r - d) / d; e.x += dx * k; e.z += dz * k; }
    else { const l = e.x - o.x0, r = o.x1 - e.x, t = e.z - o.z0, b = o.z1 - e.z, m = Math.min(l, r, t, b); if (m === l) e.x = o.x0 - e.r; else if (m === r) e.x = o.x1 + e.r; else if (m === t) e.z = o.z0 - e.r; else e.z = o.z1 + e.r; }
  }
}
function groundAt(x, z, r, y) { let g = 0; for (const o of level.obs) if (o.walk && y >= o.h - .3 && x > o.x0 - r * .4 && x < o.x1 + r * .4 && z > o.z0 - r * .4 && z < o.z1 + r * .4) g = Math.max(g, o.h); return g; }
function floorAt(x, z) { let g = 0; for (const o of level.obs) if (o.walk && x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1) g = Math.max(g, o.h); return g; }
function blockedAt(x, z, r, opt) { for (const o of level.obs) { if (passable(o, opt) || o.h < .3) continue; if (x > o.x0 - r && x < o.x1 + r && z > o.z0 - r && z < o.z1 + r) return true; } return false; }
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
// nemici che in questo momento non si possono colpire (in caduta, che emergono, svaniti)
const untouchable = e => e.dead || e.falling || e.rising > 0 || (e.vis !== undefined && e.vis < .5);

/* ---------- cambio ambiente ---------- */
function clearEntities() {
  for (const e of enemies) { scene.remove(e.model); if (e.hpEl) e.hpEl.remove(); }
  for (const q of projs) scene.remove(q.mesh);
  for (const k of picks) scene.remove(k.mesh);
  for (const h of hazards) scene.remove(h.mesh);
  for (const r of rings) scene.remove(r.mesh);
  enemies = []; projs = []; picks = []; hazards = []; rings = []; merchant = null;
}
function setLevel(L) {
  clearEntities(); UI.clearDialog();
  if (level) { scene.remove(level.group); disposeGroup(level.group); }
  level = L; scene.add(L.group);
  moon.intensity = L.moonK || 1; hemi.intensity = L.hemiK || .5;
  const fog = L.fog || [0x0a1117, .021]; scene.fog.color.copy(lin(fog[0])); scene.fog.density = fog[1];
  Dust.mesh.material.color.copy(lin(L.dust || 0xffe0b0)); Dust.mesh.material.size = L.fireflies ? .11 : .07; Dust.mesh.material.opacity = L.fireflies ? .9 : .55;
  fitShadow(L); L.shadowDirty = 3;
  if (p) { p.x = L.start.x; p.z = L.start.z; p.y = 0; p.vx = p.vz = p.vy = 0; p.face = L.startYaw; p.slowT = 0; }
  LOOK.yaw = LOOK.lastYaw = L.startYaw; LOOK.pitch = LOOK.lastPitch = -.06; LOOK.land = 0;
  camTarget.set(L.start.x, 0, 0);
  Rain.setCount(Q.rain); Wind.setCount(Q.leaves); Dust.reset(); Puffs.reset();
  UI.zone(L);
}
function makePlayer() {
  const c = CLASSES.find(c => c.id === save.cls) || CLASSES[0];
  const w = validWeapon(save.startWeapon) ? save.startWeapon : starterWeapon(c);
  const P = { x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, r: .42, face: Math.PI / 2, cls: c, hp: c.hp, max: c.hp, weapon: w, onGround: true, jumps: 0, slideT: 0, slideCd: 0, parryT: 0, parryCd: 0, atkT: -1, atkDur: .22, atkKind: 'melee', atkCd: 0, swing: 0, swingDir: 0, smashT: 0, hitSet: null, slideHit: null, inv: 0, slowT: 0, dead: false, deadT: 0 };
  P.blob = new THREE.Mesh(BLOB_GEO(), MAT.blob); P.blob.scale.setScalar(.7); scene.add(P.blob);
  return P;
}
function buildPlayerModel() {
  if (p.model) scene.remove(p.model);
  p.model = playerModel(p.cls.id, save.outfit); setModelWeapon(p.model, p.weapon);
}
function applyClass() {
  const c = CLASSES.find(c => c.id === save.cls) || CLASSES[0];
  p.cls = c; p.max = p.hp = c.hp;
  if (!validWeapon(save.startWeapon)) p.weapon = starterWeapon(c);
  buildPlayerModel(); UI.player();
}
function petSpot(d = 2.1, a = .85) { const t = LOOK.yaw + a; return [p.x + Math.sin(t) * d, p.z + Math.cos(t) * d]; }
function makePet(x, z) {
  const m = robotModel(); scene.add(m); m.position.set(x, 0, z); m.rotation.y = .6;
  return { x, z, y: 0, vx: 0, vz: 0, face: .6, model: m };
}
function takeSpare() { const l = level && level.spare.pop(); if (l) level.group.remove(l); }
function giveSpare() { if (level && level.kind === 'wagon') addSpare(level); }
// compila in anticipo i materiali che compaiono durante il gioco, così non si blocca al primo colpo
let warmGroup = null;
function warmUp() {
  try {
    if (!warmGroup) {
      const mats = new Set(), sm = [chestModel(), coinModel(), heartModel(), lootBeam(0), lootBeam(1), lootBeam(2), slashMesh(2), cleaverModel(), merchantModel()];
      for (const t of Object.keys(MOBS)) sm.push(makeMobModel(t, MOBS[t].wpn[0]));
      for (const t of Object.keys(WT)) for (const r of [0, 1, 2]) sm.push(weaponModel(t, r));
      for (const k of ['arrow', 'quarrel', 'pellet', 'bolt', 'fire', 'ticket', 'coal', 'web']) sm.push(projMesh({ kind: k, from: 'p' }));
      sm.forEach(m => m.traverse(o => { if (o.material && !o.isLight) mats.add(o.material); }));
      [MAT.flash, MAT.gold, MAT.ticket, MAT.gem, MAT.neonGreen, MAT.cream, MAT.wood, MAT.steel, MAT.red, MAT.zap, MAT.eyeRed, MAT.fxGold, MAT.ringRed, MAT.ringTeal].forEach(m => mats.add(m));
      warmGroup = new THREE.Group();
      for (const m of mats) { const k = new THREE.Mesh(boxGeo(.01, .01, .01), m); k.castShadow = !m.transparent; k.receiveShadow = true; warmGroup.add(k); }
      glowSprite(warmGroup, 0, 0, 0, .01, 0xffffff, .1);
    }
    warmGroup.position.set(camTarget.x, -30, camTarget.z); scene.add(warmGroup);
    renderer.compile(scene, camera);
  } catch (e) { }
  if (warmGroup) scene.remove(warmGroup);
}
function startHub(intro) {
  STATE = 'play'; run = null;
  if (!p) p = makePlayer(); else { p.dead = false; p.hp = p.max = p.cls.hp; p.inv = 0; if (p.model) p.model.rotation.set(0, 0, 0); }
  p.weapon = validWeapon(save.startWeapon) ? save.startWeapon : (p.weapon && validWeapon(p.weapon) && !p.fromRun ? p.weapon : starterWeapon(p.cls));
  p.fromRun = false;
  setLevel(buildHub());
  buildPlayerModel();
  const ps = petSpot(2.2, .5); if (!pet) pet = makePet(ps[0], ps[1]); pet.x = ps[0]; pet.z = ps[1]; pet.vx = pet.vz = 0; pet.face = LOOK.yaw + Math.PI;
  UI.player(); UI.coins(); UI.map();
  if (intro) {
    UI.dialog(['...gzzt... Qui parla il capotreno.', 'Benvenuto a bordo, passeggero. Questo treno non si ferma mai. Davvero mai.', 'Prima di tutto dimmi chi sei. Il treno vuole ricordarsi la tua faccia.'], 'CAPOTRENO', () =>
      UI.classSelect(() => UI.dialog(['Bene. Il Vagone 1 è oltre la porta in fondo, a destra. Dieci vagoni ti separano dalla locomotiva.', 'Nella cabina trovi il bestiario, l\'armadio e la slot machine. Avvicinati e usa il tasto E.', 'Quel robottino si chiama Bullone. Ti seguirà ovunque. Non chiedermi perché.'], 'CAPOTRENO')));
  }
}
function startRun() {
  run = { coins: 0, kills: 0, n: 0, wave: -1, active: false, timer: 0, queue: [], cleared: false, t: 0, waves: [], bought: 0 };
  p.fromRun = true;
  enterWagon(1);
}
function enterWagon(n) {
  const W = WAGONS[n - 1];
  Object.assign(run, { n, wave: -1, active: false, timer: 0, queue: [], cleared: false, waves: W.waves, talkT: 0, shopT: 0, shop: null });
  PACE = paceFor(n);
  // ogni vagone si comincia con la vita piena
  const healed = p.hp < p.max; p.hp = p.max;
  setLevel(buildWagon(n));
  const ps = petSpot(2.2, .5); pet.x = ps[0]; pet.z = ps[1]; pet.vx = pet.vz = 0;
  UI.coins(); UI.map(); UI.player();
  UI.banner('VAGONE ' + n, W.name.toUpperCase());
  if (healed) UI.toast('Bullone ti ha rimesso in sesto: vita piena', '#6af08a');
  setTimeout(() => { if (run && run.n === n && STATE === 'play') UI.dialog(W.intro, 'CAPOTRENO'); }, 900);
}
function transition(fn) { UI.fade(true); setTimeout(() => { fn(); warmUp(); setTimeout(() => UI.fade(false), 80); }, 460); }

/* ---------- giocatore ---------- */
// avanti e indietro lungo lo sguardo, destra e sinistra di lato
function moveInput() {
  let fw = (held.up ? 1 : 0) - (held.down ? 1 : 0) - joy.y, st = (held.right ? 1 : 0) - (held.left ? 1 : 0) + joy.x;
  const l = Math.hypot(fw, st); if (l > 1) { fw /= l; st /= l; }
  const fx = Math.sin(LOOK.yaw), fz = Math.cos(LOOK.yaw);
  return { x: fw * fx - st * fz, z: fw * fz + st * fx, l: Math.min(1, l) };
}
// sul telefono un colpo gira un po' lo sguardo verso il nemico inquadrato
function nudgeAim(range) {
  if (!isTouch) return;
  const tg = aimTarget(range, .5); if (!tg.e) return;
  const a = Math.atan2(tg.x - p.x, tg.z - p.z); LOOK.yaw += clamp(angDiff(LOOK.yaw, a) * .5, -.3, .3);
}
function updatePlayer(dt) {
  const c = p.cls;
  // frecce sinistra e destra: girarsi senza mouse
  if (held.turnL) LOOK.yaw += 2.6 * dt; if (held.turnR) LOOK.yaw -= 2.6 * dt;
  p.face = LOOK.yaw;
  const mv = moveInput();
  p.inv -= dt; p.parryT -= dt; p.parryCd -= dt; p.atkCd -= dt; p.slideCd -= dt; p.swing -= dt; p.slowT -= dt;
  if (p.atkT >= 0) { p.atkT += dt / p.atkDur; if (p.atkT >= 1) p.atkT = -1; }
  if (p.slideT > 0) {
    p.slideT -= dt; const k = Math.pow(.2, dt); p.vx *= k; p.vz *= k;
    if (Math.random() < .6) Sparks.emit(p.x, .1, p.z, 1, 0x8a7a6a, .6, .6, .4, 2);
  } else {
    const slow = (p.atkT >= 0 && p.atkKind === 'melee' ? .55 : 1) * (p.slowT > 0 ? .5 : 1), sp = c.speed * slow, acc = (p.onGround ? 42 : 18) * dt;
    const tx = mv.x * sp, tz = mv.z * sp, cur = Math.hypot(p.vx, p.vz);
    if (cur > c.speed + .5 && !p.onGround) { p.vx *= Math.pow(.6, dt); p.vz *= Math.pow(.6, dt); p.vx += tx * dt * 2; p.vz += tz * dt * 2; }
    else { p.vx += clamp(tx - p.vx, -acc, acc); p.vz += clamp(tz - p.vz, -acc, acc); }
  }
  if (p.slowT > 0 && Math.random() < .2) Sparks.emit(p.x, .3, p.z, 1, 0xd8e8d0, .4, .3, .5, 1);
  // salto e doppio salto (con lo slancio della scivolata)
  if (pressed.jump) {
    if (p.onGround) { p.vy = JUMP; p.jumps = 1; p.onGround = false; sfx('jump'); if (p.slideT > 0) { p.slideT = 0; const s = Math.hypot(p.vx, p.vz), k = Math.min(15, s + 1.5) / (s || 1); p.vx *= k; p.vz *= k; } }
    else if (p.jumps < 2) { p.vy = DJUMP; p.jumps = 2; sfx('jump'); Sparks.emit(p.x, p.y + .1, p.z, 10, 0xffe0a0, 2.5, .5, .35, 0); }
  }
  if (pressed.slide && p.onGround && p.slideT <= 0 && p.slideCd <= 0) {
    const dir = mv.l > .15 ? Math.atan2(mv.x, mv.z) : p.face, sp = c.perk === 'slide' ? 15 : 13;
    p.slideDir = dir; p.vx = Math.sin(dir) * sp; p.vz = Math.cos(dir) * sp; p.slideT = c.perk === 'slide' ? .5 : .38; p.slideCd = .55; p.slideHit = new Set(); sfx('swing');
  }
  if ((pressed.attack || (held.attack && WT[p.weapon.type].kind !== 'melee')) && p.atkCd <= 0 && p.slideT <= 0) playerAttack();
  if (pressed.parry && p.parryCd <= 0) { p.parryT = c.perk === 'parry' ? .34 : .22; p.parryCd = .55; }
  p.x += p.vx * dt; p.z += p.vz * dt; p.vy -= GRAV * dt; p.y += p.vy * dt;
  // la testa non passa attraverso soffitto e travi
  if (p.y > level.headY) { p.y = level.headY; p.vy = Math.min(p.vy, 0); }
  collide(p);
  const g = groundAt(p.x, p.z, p.r, p.y);
  if (p.y <= g) {
    if (!p.onGround && p.vy < -3.5) { LOOK.land = .22; LOOK.landK = clamp((-p.vy - 3.5) / 7, .3, 1); if (p.vy < -7) { Sparks.emit(p.x, g + .05, p.z, 8, 0x9a8a7a, 2, .4, .4, 2); sfx('land'); } else sfx('step'); }
    p.y = g; p.vy = 0; p.onGround = true; p.jumps = 0;
  } else if (p.y > g + .02) p.onGround = false;
  // martello: lo schianto arriva un attimo dopo il gesto
  if (p.smashT > 0 && (p.smashT -= dt) <= 0) smash();
  // colpi in mischia: un ventaglio davanti allo sguardo, che segue la testa mentre si gira
  if (p.swing > 0 && p.swing <= .13) {
    const t = WT[p.weapon.type];
    for (const e of enemies) {
      if (untouchable(e) || p.hitSet.has(e)) continue;
      const dx = e.x - p.x, dz = e.z - p.z, dd = Math.hypot(dx, dz);
      if (dd < t.reach + e.r + .25 && Math.abs(angDiff(LOOK.yaw, Math.atan2(dx, dz))) < t.arc && e.y - p.y < 1.9 && p.y - e.y < 1.7) { p.hitSet.add(e); hitEnemy(e, p.weapon.dmg, p.weapon.type, p.weapon.crit, LOOK.yaw, t.kb); }
    }
  }
  if (p.slideT > 0) for (const e of enemies) if (!untouchable(e) && !p.slideHit.has(e) && d2(p, e) < (p.r + e.r) ** 2 && e.y < 1) { p.slideHit.add(e); hitEnemy(e, c.perk === 'slide' ? 2 : 1, 'slide', 0, p.slideDir, 6); }
  if (pressed.interact) { const it = nearInter(); if (it) it.fn(); }
  p.model.position.set(p.x, p.y, p.z); p.model.rotation.y = p.face;
  const fy = floorAt(p.x, p.z);
  p.blob.position.set(p.x, fy + .02, p.z); p.blob.material.opacity = .4;
}
// il punto da cui parte un colpo a distanza: la mano, un po' sotto e a destra dello sguardo
function muzzle() {
  const f = viewDir(new THREE.Vector3()), rx = -Math.cos(LOOK.yaw), rz = Math.sin(LOOK.yaw);
  return { f, x: p.x + f.x * .6 + rx * .14, y: p.y + LOOK.eyeNow - .14 + f.y * .6, z: p.z + f.z * .6 + rz * .14 };
}
function playerAttack() {
  const w = p.weapon, t = WT[w.type];
  p.atkCd = w.cd; p.atkT = 0; p.atkKind = t.kind; p.atkDur = t.kind === 'melee' ? Math.min(t.style === 'smash' ? .38 : .26, w.cd * .8) : .22;
  nudgeAim(t.kind === 'melee' ? t.reach + 1.5 : 16);
  if (t.kind === 'melee') {
    p.hitSet = new Set(); sfx('swing');
    if (t.style === 'smash') { p.smashT = .16; p.swing = 0; }
    else { p.swing = .13; p.swingDir = LOOK.yaw; if (t.style !== 'thrust') VM.atkSide *= -1; } // un fendente e un rovescio, a turno (la scia la disegnano le mani in primo piano)
    return;
  }
  if (t.style === 'chain') { castChain(w, t); return; }
  // il colpo parte dalla mano e va dove punta il mirino (con un piccolo aiuto se c'è un nemico vicino al centro)
  const mg = t.kind === 'magic', tg = aimTarget(mg ? 18 : 22, isTouch ? .2 : .09), m = muzzle();
  if (tg.e) { const tt = Math.hypot(tg.x - m.x, tg.z - m.z) / t.spd; tg.x += tg.e.vx * tt; tg.z += tg.e.vz * tt; }
  const dx = tg.x - m.x, dy = tg.y - m.y, dz = tg.z - m.z, dl = Math.hypot(dx, dy, dz) || 1;
  const n = t.shots || 1, kind = t.proj, per = n > 1 ? w.dmg / n : w.dmg;
  for (let i = 0; i < n; i++) {
    let vx = dx / dl, vy = dy / dl, vz = dz / dl;
    if (n > 1) { vx += rnd(-1, 1) * t.spread; vy += rnd(-1, 1) * t.spread * .6; vz += rnd(-1, 1) * t.spread; const l = Math.hypot(vx, vy, vz); vx /= l; vy /= l; vz /= l; }
    spawnProj({ from: 'p', x: m.x, y: m.y, z: m.z, vx: vx * t.spd, vy: vy * t.spd, vz: vz * t.spd, dmg: per, tag: w.type, crit: w.crit, kind, pierce: t.pierce || (kind === 'bolt' && p.cls.perk === 'pierce'), life: t.range ? t.range / t.spd : 1.6, boom: t.boom ? t.boom * (p.cls.perk === 'pierce' ? 1.2 : 1) : 0 });
  }
  sfx(kind === 'pellet' ? 'blast' : kind === 'fire' ? 'fire' : mg ? 'magic' : 'shoot'); LOOK.kick = kind === 'pellet' ? 1.6 : kind === 'quarrel' ? 1.1 : mg ? .5 : .8; VM.fire = 1;
  if (kind === 'pellet') { Sparks.emit(m.x + m.f.x * .5, m.y + m.f.y * .5, m.z + m.f.z * .5, 14, 0xffc070, 2.5, 1.5, .18, 0); Puffs.emit(m.x + m.f.x * .8, m.y + m.f.y * .8, m.z + m.f.z * .8, 2, .5, 0xb8b0a8, .25); shake = Math.max(shake, .2); }
  if (mg) Sparks.emit(m.x + m.f.x * .2, m.y + m.f.y * .2, m.z + m.f.z * .2, 8, kind === 'fire' ? 0xffa040 : 0xc98bff, 1.5, 1, .3, 0);
}
// martello: onda d'urto davanti, colpisce tutto quello che c'è intorno e stordisce
function smash() {
  const w = p.weapon, t = WT[w.type], f = viewDir(new THREE.Vector3()), cx = p.x + Math.sin(LOOK.yaw) * 1.6, cz = p.z + Math.cos(LOOK.yaw) * 1.6;
  let hit = 0;
  for (const e of enemies) {
    if (untouchable(e)) continue;
    const dx = e.x - p.x, dz = e.z - p.z, dd = Math.hypot(dx, dz);
    if ((Math.hypot(e.x - cx, e.z - cz) < 1.5 + e.r || (dd < t.reach + e.r && Math.abs(angDiff(LOOK.yaw, Math.atan2(dx, dz))) < t.arc)) && e.y - p.y < 1.9) { hitEnemy(e, w.dmg, w.type, w.crit, Math.atan2(dx, dz), t.kb); hit++; if (!e.dead && !MOBS[e.type].boss) { e.stun = Math.max(e.stun, t.stun); e.state = 'stun'; } }
  }
  const gy = floorAt(cx, cz);
  Chunks.emit(cx, gy + .1, cz, 10, [0x5a5048, 0x3a342e, 0x8a7a6a], 3.5, .1, .7); Sparks.emit(cx, gy + .1, cz, 18, 0xffd8a0, 3.5, 2, .4, 4); Puffs.emit(cx, gy + .2, cz, 3, 1.1, 0x9a9088, .3);
  shockwave(cx, cz, 9, 2.6, 0, 0xffd8a0);
  shake = Math.max(shake, hit ? .5 : .35); sfx('land'); sfx('hit'); LOOK.kick = 1.2; void f;
}
// fulmine: colpisce il nemico inquadrato e rimbalza sui più vicini
function castChain(w, t) {
  const m = muzzle(), tg = aimTarget(t.range, isTouch ? .25 : .12);
  sfx('zap'); LOOK.kick = .6; VM.fire = 1;
  if (!tg.e) { zapFX(m.x, m.y, m.z, tg.x, tg.y, tg.z); return; }
  const hit = new Set(); let cur = tg.e, fx = m.x, fy = m.y, fz = m.z, n = t.chain + (p.cls.perk === 'pierce' ? 1 : 0), dmg = w.dmg;
  while (cur && n-- > 0) {
    const cy = cur.y + HIT[cur.type][0];
    zapFX(fx, fy, fz, cur.x, cy, cur.z); hit.add(cur);
    hitEnemy(cur, dmg, w.type, w.crit, Math.atan2(cur.x - fx, cur.z - fz), 2, true);
    Sparks.emit(cur.x, cy, cur.z, 10, 0x9ac8ff, 2.5, 2, .3, 2);
    fx = cur.x; fy = cy; fz = cur.z; dmg = Math.max(1, dmg * .8);
    let best = null, bd = 6.5;
    for (const e of enemies) { if (untouchable(e) || hit.has(e)) continue; const d = Math.hypot(e.x - fx, e.z - fz); if (d < bd) { bd = d; best = e; } }
    cur = best;
  }
}
function zapFX(ax, ay, az, bx_, by, bz) {
  const g = new THREE.Group(), N = 7; let px = ax, py = ay, pz = az;
  for (let i = 1; i <= N; i++) {
    const k = i / N, j = i < N ? .35 : 0, nx = lerp(ax, bx_, k) + rnd(-j, j), ny = lerp(ay, by, k) + rnd(-j, j), nz = lerp(az, bz, k) + rnd(-j, j);
    const l = Math.hypot(nx - px, ny - py, nz - pz), s = new THREE.Mesh(boxGeo(1, 1, 1), MAT.zap);
    s.scale.set(.05, .05, l); s.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2); s.lookAt(nx, ny, nz); g.add(s);
    px = nx; py = ny; pz = nz;
  }
  scene.add(g); FX.push({ m: g, t: 0, life: .14, upd: (f, k) => { f.m.visible = Math.random() < .85; f.m.children.forEach(c => { c.scale.x = c.scale.y = .06 * (1 - k * .7); }); } });
}
function hurtPlayer(dmg, src) {
  if (p.dead) return false;
  if (p.parryT > 0 && !src.noParry) {
    p.parryT = 0; p.parryCd = .12; hitstop = .08; shake = Math.max(shake, .35); sfx('parry');
    const sp_ = frontPt(.8, -.25); Sparks.emit(sp_.x, sp_.y, sp_.z, 22, 0xffe0a0, 4, 3, .4, 4);
    const fp_ = frontPt(2.2, .35); UI.dmg(fp_.x, fp_.y, fp_.z, 'PARRY!', '#f6d79a');
    if (src.isProj) {
      // il colpo respinto torna verso il nemico inquadrato, o dritto dove si guarda
      const tg = aimTarget(20, .3), s = Math.max(9, Math.hypot(src.vx, src.vz)) * 1.5, dx = tg.x - src.x, dy = tg.y - src.y, dz = tg.z - src.z, dl = Math.hypot(dx, dy, dz) || 1;
      src.from = 'p'; src.vx = dx / dl * s; src.vy = dy / dl * s; src.vz = dz / dl * s; src.g = 0; src.tag = 'reflect'; src.dmg = Math.max(2, src.dmg * 2); src.hit = new Set(); src.life = 1.6;
      src.mesh.traverse(o => { if (o.isMesh) o.material = MAT.gold; });
    } else if (src.stun !== undefined) {
      const boss = MOBS[src.type] && MOBS[src.type].boss;
      src.stun = boss ? .9 : 1.4; src.state = 'stun'; src.kbT = .2; const a = Math.atan2(src.x - p.x, src.z - p.z); src.vx = Math.sin(a) * 6; src.vz = Math.cos(a) * 6;
      if (MOBS[src.type] && MOBS[src.type].shield) UI.dmg(src.x, 2.6, src.z, 'GUARDIA ABBASSATA', '#ffd890');
    }
    return false;
  }
  if (p.inv > 0) return false;
  if (p.slideT > 0 && !src.isProj && !src.noParry) return false;
  p.hp -= dmg; p.inv = 1; shake = Math.max(shake, .45); hitstop = .05; sfx('hurt'); grade.uniforms.flash.value = .6;
  const a = Math.atan2(p.x - src.x, p.z - src.z); p.vx = Math.sin(a) * 5; p.vz = Math.cos(a) * 5; p.vy = 3;
  UI.hurtFrom(angDiff(LOOK.yaw, a + Math.PI)); VM.recoil = 1; LOOK.kick = 1;
  UI.player();
  if (p.hp <= 0) { p.hp = 0; playerDie(); }
  return true;
}
function playerDie() {
  p.dead = true; p.deadT = 0; LOOK.deadT = 0; sfx('die');
  const fp_ = frontPt(1.2, -.4); Chunks.emit(fp_.x, fp_.y, fp_.z, 16, [0xd8424e, 0x9b2f35, 0x6a1f26], 4, .1, 1.0);
  const kept = Math.floor(run.coins / 2); save.bank += kept; save.runs++; save.startWeapon = null; save.best = Math.max(save.best || 0, run.n); persist();
  setTimeout(() => UI.end(false, kept), 1200);
}

/* ---------- compagno robot ---------- */
function updatePet(dt) {
  if (!pet) return;
  const [tx, tz] = petSpot();
  let dx = tx - pet.x, dz = tz - pet.z; const d = Math.hypot(dx, dz);
  if (d > 14) { pet.x = tx; pet.z = tz; }
  const sp = d > .3 ? Math.min(9, d * 3.2) : 0;
  pet.vx += ((d > 0 ? dx / d : 0) * sp - pet.vx) * Math.min(1, dt * 6); pet.vz += ((d > 0 ? dz / d : 0) * sp - pet.vz) * Math.min(1, dt * 6);
  pet.x += pet.vx * dt; pet.z += pet.vz * dt;
  pet.x = clamp(pet.x, level.x0 + .4, level.x1 - .4); pet.z = clamp(pet.z, level.z0 + .4, level.z1 - .4);
  pet.r = .35; pet.y = pet.y || 0; collide(pet, { rat: true });
  const fy = floorAt(pet.x, pet.z); pet.y += (fy - pet.y) * Math.min(1, dt * 10);
  const s = Math.hypot(pet.vx, pet.vz);
  if (s > .4) pet.face = turnTo(pet.face, Math.atan2(pet.vx, pet.vz), 8 * dt); else pet.face = turnTo(pet.face, Math.atan2(p.x - pet.x, p.z - pet.z), 3 * dt);
  const m = pet.model, u = m.userData; u.phase += dt * (4 + s * 3);
  m.position.set(pet.x, pet.y + Math.abs(Math.sin(u.phase)) * .06 * Math.min(1, s), pet.z); m.rotation.y = pet.face;
  u.legs.forEach((l, i) => l.rotation.x = Math.sin(u.phase + (i % 2 ? Math.PI : 0)) * .5 * Math.min(1, s / 3));
  u.body.rotation.z = Math.sin(T * 2) * .03;
  u.light.intensity = 1.5 + Math.sin(T * 7) * .08;
  if (u.tick) u.tick(T, dt, s);
}

/* ---------- nemici ---------- */
const SPEED = { ratto: [4.2, 5.0], scheletro: [2.4, 2.9], arciere: [2.6, 2.8], bigliettaio: [2.4, 2.4], cuoco: [2.5, 2.8], mimic: [0, 0], fantasma: [2.2, 2.6], ragno: [4.4, 5.0], regina: [2.6, 2.8], fuochista: [2.4, 2.7], guardia: [2.0, 2.2], automa: [2.6, 2.9], capotreno: [2.7, 2.7] };
// mode: roof cade dall'alto, rise emerge dal pavimento, fade appare (volanti), sleep finge di essere un baule
function spawnEnemy(type, lvl, x, z, mode) {
  const d = MOBS[type], wl = d.wpn.filter(w => lvl >= ((d.wpnLvl || {})[w] || 1)), wtype = pick(wl.length ? wl : d.wpn), model = makeMobModel(type, wtype);
  scene.add(model);
  const fly = !!d.fly; mode = mode || (fly ? 'fade' : 'roof');
  if (d.light || model.userData.light) takeSpare();
  const hpK = d.elite ? 1 + .25 * (lvl - 1) : 1 + .35 * (lvl - 1), sp = SPEED[type] || [2.5, 2.8];
  const e = { type, lvl, x, z, y: fly ? 1.3 : mode === 'roof' ? (level.dropY || 7.5) : mode === 'rise' ? -1.9 : 0, vx: 0, vz: 0, vy: 0, r: d.r, face: Math.atan2(p.x - x, p.z - z), hp: Math.round(d.hp * hpK), state: mode === 'sleep' ? 'sleep' : 'walk', st: 0, cd: rnd(.7, 1.4), stun: 0, kbT: 0, bite: 0, flash: 0,
    falling: mode === 'roof' && !fly, rising: mode === 'rise' ? .75 : 0, fadeIn: fly ? 1.2 : 0, weapon: wtype, model, spd: rnd(sp[0], sp[1]) * PACE.spd, dashT: 0, dashCd: 4.5, tickCd: 2.4, blinkCd: rnd(2.5, 4), wakeT: rnd(8, 12), side: Math.random() < .5 ? -1 : 1, seenWeak: false, phase: Math.random() * 6 };
  if (type === 'fantasma') e.vis = 1;
  if (type === 'bigliettaio') e.hov = 1.3;
  e.max = e.hp;
  e.ringMat = (fly ? MAT.ringTeal : MAT.ringRed).clone(); e.ring = addRing(model, e.ringMat, d.ring);
  model.position.set(x, e.y, z); model.rotation.y = e.face;
  e.hpEl = d.elite ? null : UI.hpBar(false);
  if (type === 'bigliettaio') { sfx('ghost'); Sparks.emit(x, 1.5, z, 40, 0x62d4c7, 3, 3, 1, 0); }
  if (type === 'fantasma') { sfx('ghost'); Sparks.emit(x, 1.2, z, 20, 0xb8a0ff, 2, 2, .8, 0); }
  if (mode === 'rise') { summonFX(x, z); }
  enemies.push(e); return e;
}
// cerchio di comparsa sul pavimento, polvere e scintille viola
function summonFX(x, z) {
  const gy = floorAt(x, z), m = new THREE.Mesh(RING_GEO(), MAT.ringRed.clone()); m.position.set(x, gy + .04, z); m.material.color.copy(lin(0xb070ff)); m.renderOrder = 2; scene.add(m);
  FX.push({ m, t: 0, life: .9, upd: (f, k) => { f.m.scale.setScalar(.6 + k * 1.4); f.m.material.opacity = .9 * (1 - k); } });
  Sparks.emit(x, gy + .1, z, 16, 0xb070ff, 1.6, 2.5, .7, 0); Puffs.emit(x, gy + .2, z, 2, .9, 0x6a5a7a, .3); sfx('ghost');
}
function hitEnemy(e, base, tag, crit, ang, kb, aoe) {
  const def = MOBS[e.type], m = def.mult[tag] || 1; let dmg = base * m; const cr = Math.random() * 100 < (crit || 0); if (cr) dmg *= 2;
  const top = e.y + HIT[e.type][0] + HIT[e.type][1] + .3;
  // lo scudo della guardia para i colpi frontali (non il martello, la magia ad area, la scivolata)
  if (def.shield && e.stun <= 0 && e.state !== 'strike' && e.state !== 'recover' && !aoe && tag !== 'martello' && tag !== 'slide' && Math.abs(angDiff(e.face, ang + Math.PI)) < 1.15) {
    dmg *= .4; sfx('parry'); Sparks.emit(e.x + Math.sin(e.face) * .5, e.y + 1.1, e.z + Math.cos(e.face) * .5, 12, 0xffe0a0, 3, 2, .3, 3);
    if (!e.blockTxt || T - e.blockTxt > .8) { e.blockTxt = T; UI.dmg(e.x, top, e.z, 'PARATO', '#c8d0d8'); }
    kb = kb * .3;
  }
  if (e.state === 'sleep') { dmg *= 2; UI.dmg(e.x, top + .5, e.z, 'SORPRESA!', '#ffcf5a'); }
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = .12; hitstop = Math.max(hitstop, .035); shake = Math.max(shake, .18); sfx('hit');
  if (kb && !def.elite && !e.air) { e.vx = Math.sin(ang) * kb; e.vz = Math.cos(ang) * kb; e.kbT = .16; }
  UI.dmg(e.x, top, e.z, cr ? dmg + '!' : String(dmg), cr ? '#ffd34a' : m > 1 ? '#ff9a5a' : '#ffffff');
  if (m > 1 && !e.seenWeak) { e.seenWeak = true; UI.dmg(e.x, top + .55, e.z, 'PUNTO DEBOLE', '#ff9a5a'); }
  if (tag !== 'slide') UI.hit(e.hp <= 0);
  Chunks.emit(e.x, e.y + HIT[e.type][0], e.z, 4, def.chunk.slice(0, 2), 2.5, .09, .6);
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  if (e.dead) return;
  const def = MOBS[e.type];
  e.dead = true; run.kills++;
  const first = !save.kills[e.type]; save.kills[e.type] = (save.kills[e.type] || 0) + 1; persist();
  if (first) UI.toast('Nuova voce nel Bestiario: ' + def.name, '#e9b45c');
  Chunks.emit(e.x, e.y + HIT[e.type][0], e.z, def.elite ? 40 : 18, def.chunk, 4, e.type === 'ratto' ? .1 : .13, 1.3);
  if (def.fly) Sparks.emit(e.x, e.y + 1, e.z, 24, def.chunk[0], 3, 2, .8, 0);
  scene.remove(e.model); if (e.hpEl) e.hpEl.remove();
  if (def.light || e.model.userData.light) giveSpare();
  const elite = def.elite, n = e.minion ? ri(0, 1) : ri(2, 3) * e.lvl + (elite ? 14 : 0) + (e.type === 'mimic' ? 6 : 0);
  for (let i = 0; i < n; i++) dropPick('coin', e.x, e.z);
  if (!e.minion || Math.random() < .3) dropPick('weapon', e.x, e.z, genWeapon(e.weapon, e.lvl, elite ? .5 : def.loot || 0));
  if (Math.random() < (e.minion ? .1 : .18) || elite) dropPick('heart', e.x, e.z);
  if (elite) { shake = .8; hitstop = .15; }
  if (def.boss) for (const m of enemies) if (m.minion && !m.dead) { m.hp = 0; killEnemy(m); }
}
function steer(e, tx, tz, speed, opt, dt) {
  let a = Math.atan2(tx - e.x, tz - e.z);
  for (const off of [0, .5, -.5, 1, -1, 1.6, -1.6, 2.3, -2.3]) { const aa = a + off; if (!blockedAt(e.x + Math.sin(aa) * 1.1, e.z + Math.cos(aa) * 1.1, e.r * .8, opt)) { a = aa; break; } }
  const k = Math.min(1, dt * 7); e.vx += (Math.sin(a) * speed - e.vx) * k; e.vz += (Math.cos(a) * speed - e.vz) * k;
}
const WARN = new Set(['windup', 'draw', 'throw', 'crouch', 'wind', 'stomp', 'spit', 'cast', 'aim']);
function updateEnemy(e, dt) {
  const def = MOBS[e.type], u = e.model.userData, opt = { rat: !!def.rat, fly: !!def.fly };
  // chi attacca alle spalle (fuori dallo sguardo) ricarica a metà velocità
  const seen = Math.abs(angDiff(LOOK.yaw, Math.atan2(e.x - p.x, e.z - p.z))) < 1.0, k = (seen ? 1 : .5) / PACE.cd;
  e.flash -= dt; e.cd -= dt * k; e.bite -= dt * k; e.kbT -= dt; e.phase += dt;
  if (e.falling) {
    e.vy -= GRAV * dt; e.y += e.vy * dt;
    if (e.y <= 0) { e.y = 0; e.vy = 0; e.falling = false; sfx('land'); shake = Math.max(shake, def.boss ? .6 : .15); Chunks.emit(e.x, .1, e.z, 8, [0x5a5048, 0x3a342e], 2.5, .08, .6); Sparks.emit(e.x, .1, e.z, 10, 0x9a8a7a, 2.5, .5, .4, 1); }
    e.model.position.set(e.x, e.y, e.z); return;
  }
  if (e.rising > 0) {
    e.rising -= dt; const k = Math.max(0, e.rising / .75); e.y = -1.9 * k * k;
    if (Math.random() < .5) Sparks.emit(e.x + rnd(-.4, .4), .05, e.z + rnd(-.4, .4), 1, 0xb070ff, .5, 1.5, .4, 0);
    if (e.rising <= 0) e.y = 0;
    e.model.position.set(e.x, e.y, e.z); e.model.rotation.y = e.face; return;
  }
  if (e.fadeIn > 0) e.fadeIn -= dt;
  const dx = p.x - e.x, dz = p.z - e.z, dist = Math.hypot(dx, dz), toP = Math.atan2(dx, dz);
  if (e.stun > 0) { e.stun -= dt; e.vx *= .88; e.vz *= .88; if (e.stun <= 0) e.state = 'walk'; }
  else if (e.kbT > 0) { e.vx *= .9; e.vz *= .9; }
  else if (p.dead) { e.vx *= .9; e.vz *= .9; }
  else if (AI[e.type]) AI[e.type](e, dt, { dx, dz, dist, toP, opt, k, tele: PACE.tele });
  // salti di bauli e ragni
  if (def.jumps && e.air) { e.vy -= GRAV * dt; e.y += e.vy * dt; if (e.y <= 0) { e.y = 0; e.vy = 0; e.air = false; e.landed = true; } }
  e.x += e.vx * dt; e.z += e.vz * dt;
  collide(e, opt);
  if (def.fly) {
    e.x = clamp(e.x, level.x0 + 1, level.x1 - 1); e.z = clamp(e.z, level.z0 + 1, level.z1 - 1);
    if (e.type === 'bigliettaio') { e.hov += ((e.state === 'tired' ? .75 : 1.3) - e.hov) * Math.min(1, dt * 4); e.y = e.hov + Math.sin(T * 2.2) * (e.state === 'tired' ? .05 : .15); }
    else e.y = .35 + Math.sin(T * 1.8 + e.phase) * .12;
  } else if (!def.jumps) e.y = 0;
  // posa del modello
  const m = e.model, spd = Math.hypot(e.vx, e.vz);
  m.position.set(e.x, e.y, e.z); m.rotation.y = e.face;
  if (POSER[e.type]) POSER[e.type](e, u, spd, dt); else poseHumanoid(e, u, spd);
  if (u.tick) u.tick(T, dt, spd); // animazioni secondarie: orecchie, mascelle, code di nebbia
  const warn = WARN.has(e.state) || (e.type === 'bigliettaio' && e.tickCd < .5);
  e.ringMat.opacity = e.state === 'sleep' || (e.vis !== undefined && e.vis < .5) ? 0 : warn ? .5 + Math.sin(T * 30) * .4 : (def.fly ? .5 : .35);
  e.ring.scale.setScalar(def.ring * (warn ? 1.25 : 1)); e.ring.position.y = (.03 - e.y) / m.scale.y;
  const flash = e.flash > 0;
  if (flash !== e.wasFlash) { e.wasFlash = flash; m.traverse(o => { if (o.isMesh && o.material.emissive && !o.material.transparent) { if (flash) { o.userData.m0 = o.material; o.material = MAT.flash; } else if (o.userData.m0) { o.material = o.userData.m0; } } }); }
}
function separate() {
  for (let i = 0; i < enemies.length; i++) for (let j = i + 1; j < enemies.length; j++) {
    const a = enemies[i], b = enemies[j]; if (a.dead || b.dead || a.falling || b.falling) continue;
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), m = a.r + b.r;
    if (d < m && d > 1e-4) { const k = (m - d) / d * .5; a.x -= dx * k; a.z -= dz * k; b.x += dx * k; b.z += dz * k; }
  }
}

/* ---------- proiettili, esplosioni, pericoli a terra ---------- */
const FX = [];
function projMesh(o) {
  const k = o.kind; let mesh;
  if (k === 'arrow') { mesh = new THREE.Group(); bx(mesh, o.from === 'p' ? MAT.cream : MAT.wood, .05, .05, .72, 0, 0, 0, false); bx(mesh, MAT.steel, .09, .09, .14, 0, 0, .4, false); bx(mesh, MAT.red, .12, .02, .14, 0, 0, -.32, false); }
  else if (k === 'quarrel') { mesh = new THREE.Group(); bx(mesh, MAT.wood, .05, .05, .5, 0, 0, 0, false); bx(mesh, MAT.steel, .1, .1, .16, 0, 0, .3, false); bx(mesh, MAT.brass, .1, .02, .1, 0, 0, -.22, false); if (o.from === 'p') glowSprite(mesh, 0, 0, 0, .5, 0xa8ccff, .35); }
  else if (k === 'pellet') { mesh = new THREE.Mesh(boxGeo(.06, .06, .06), MAT.ember); glowSprite(mesh, 0, 0, 0, .35, 0xffb060, .6); }
  else if (k === 'bolt') { mesh = new THREE.Mesh(boxGeo(.22, .22, .22), MAT.gem); glowSprite(mesh, 0, 0, 0, 1.1, 0xb070ff, .9); }
  else if (k === 'fire') { mesh = new THREE.Mesh(wg('fireB', () => new THREE.OctahedronGeometry(.17, 0)), MAT.flame); glowSprite(mesh, 0, 0, 0, 1.6, 0xff8a30, .85); }
  else if (k === 'cleaver') { mesh = cleaverModel(); mesh.traverse(c => c.castShadow = false); }
  else if (k === 'coal') { mesh = new THREE.Mesh(boxGeo(.22, .2, .2), MAT.soot2); bx(mesh, MAT.ember, .12, .21, .12, 0, 0, 0, false); glowSprite(mesh, 0, 0, 0, 1.0, 0xff7a20, .7); }
  else if (k === 'web') { mesh = new THREE.Mesh(wg('webB', () => new THREE.OctahedronGeometry(.2, 0)), MAT.web); glowSprite(mesh, 0, 0, 0, 1.0, 0xd8f0c0, .45); }
  else { mesh = new THREE.Mesh(boxGeo(.34, .03, .22), MAT.ticket); glowSprite(mesh, 0, 0, 0, .7, 0x62d4c7, .5); }
  return mesh;
}
function spawnProj(o) {
  if (o.from === 'e' && !o.g) { o.vx *= PACE.proj; o.vz *= PACE.proj; if (o.vy) o.vy *= PACE.proj; }
  const mesh = projMesh(o);
  o.vy = o.vy || 0; o.g = o.g || 0; mesh.position.set(o.x, o.y, o.z); orientProj(o, mesh); scene.add(mesh);
  o.mesh = mesh; o.hit = new Set(); o.r = o.kind === 'bolt' || o.kind === 'fire' || o.kind === 'web' ? .25 : o.kind === 'pellet' ? .12 : .18; projs.push(o); return o;
}
function orientProj(o, m) {
  if (o.kind === 'ticket' || o.kind === 'cleaver' || o.kind === 'coal' || o.kind === 'web' || o.kind === 'fire') return;
  m.rotation.set(-Math.atan2(o.vy, Math.hypot(o.vx, o.vz)), Math.atan2(o.vx, o.vz), m.rotation.z, 'YXZ');
}
// fine corsa di un proiettile: esplode, lascia fiamme o fa scintille
function projEnd(q, x, y, z, wall) {
  q.life = 0;
  if (q.kind === 'fire' && q.from === 'p') explode(x, Math.max(.3, y), z, q.boom || 2.4, q.dmg, q.crit, q.tag);
  else if (q.kind === 'coal' && q.from === 'e') { const gy = floorAt(x, z); firePatch(x, z, gy, 1.0, 2.6); Sparks.emit(x, gy + .2, z, 14, 0xff8a30, 2, 2.5, .5, 3); }
  else Sparks.emit(x, y, z, wall ? 6 : 5, q.kind === 'bolt' ? 0xc98bff : q.kind === 'web' ? 0xd8f0c0 : 0xffd8a0, 2, 1.5, .3, 4);
}
function updateProjs(dt) {
  for (const q of projs) {
    q.life -= dt; q.vy -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    if (q.y < .05 || q.y > level.headY + 4) { if (q.y < .05) projEnd(q, q.x, .08, q.z); else q.life = 0; continue; }
    for (const o of level.obs) {
      if (q.y > o.h || (o.kind === 'cover' && q.from === 'p') || (o.kind === 'part' && q.kind === 'web')) continue;
      if (q.x > o.x0 && q.x < o.x1 && q.z > o.z0 && q.z < o.z1) {
        projEnd(q, q.x, q.y, q.z, true);
        if (o.kind === 'cover' && o.t) { o.t.hp--; sfx('flip'); Chunks.emit(q.x, q.y, q.z, 4, [0x6b4428, 0x3a2417], 2, .08, .6); if (o.t.hp <= 0) breakTable(o.t); }
        break;
      }
    }
    if (q.life <= 0) continue;
    if (q.from === 'e') {
      // in scivolata si passa sotto frecce e biglietti
      const top = p.y + (p.slideT > 0 ? 1.0 : 1.85);
      if (!p.dead && d2(q, p) < (p.r + q.r) ** 2 && q.y + q.r > p.y && q.y - q.r < top) {
        const before = q.from, hurt = hurtPlayer(q.dmg, q);
        if (q.from === before) { q.life = 0; if (hurt && q.kind === 'web') { p.slowT = 2.6; const fp_ = frontPt(1.8, .2); UI.dmg(fp_.x, fp_.y, fp_.z, 'INVISCHIATO', '#d8f0c0'); } if (q.kind === 'coal') Sparks.emit(q.x, q.y, q.z, 12, 0xff8a30, 2, 2, .4, 3); }
      }
    } else for (const e of enemies) {
      if (untouchable(e) || q.hit.has(e)) continue;
      if (d2(q, e) < (e.r + q.r) ** 2 && Math.abs(q.y - (e.y + HIT[e.type][0])) < HIT[e.type][1] + q.r) {
        q.hit.add(e);
        if (q.kind === 'fire') { projEnd(q, q.x, q.y, q.z); break; }
        hitEnemy(e, q.dmg, q.tag, q.crit, Math.atan2(q.vx, q.vz), q.kind === 'pellet' ? 2.5 : 4);
        if (!q.pierce) { q.life = 0; break; }
      }
    }
    q.mesh.position.set(q.x, q.y, q.z);
    if (q.kind === 'ticket') q.mesh.rotation.y += dt * 12;
    else if (q.kind === 'cleaver') { q.mesh.rotation.y = Math.atan2(q.vx, q.vz); q.mesh.rotation.x += dt * 16; }
    else if (q.kind === 'coal' || q.kind === 'web') { q.mesh.rotation.x += dt * 7; q.mesh.rotation.z += dt * 5; if (q.kind === 'coal' && Math.random() < .5) Sparks.emit(q.x, q.y, q.z, 1, 0xff7a20, .3, .5, .4, -1); }
    else if (q.kind === 'fire') { q.mesh.rotation.x += dt * 9; q.mesh.rotation.y += dt * 6; if (Math.random() < .8) Sparks.emit(q.x, q.y, q.z, 1, 0xffa040, .4, .6, .35, -1.5); }
    else orientProj(q, q.mesh);
    if (q.kind === 'bolt') { q.mesh.rotation.z += dt * 8; if (Math.random() < .6) Sparks.emit(q.x, q.y, q.z, 1, 0xb070ff, .3, .3, .35, 0); }
  }
  projs = projs.filter(q => { if (q.life > 0) return true; scene.remove(q.mesh); return false; });
}
// esplosione della lanterna: danno ad area, fiammata, anello di fuoco
function explode(x, y, z, r, dmg, crit, tag) {
  for (const e of enemies) {
    if (untouchable(e)) continue;
    const d = Math.hypot(e.x - x, e.z - z);
    if (d < r + e.r && Math.abs(e.y + HIT[e.type][0] - y) < 2.4) hitEnemy(e, d < r * .5 ? dmg : Math.max(1, dmg * .7), tag, crit, Math.atan2(e.x - x, e.z - z), 7, true);
  }
  Sparks.emit(x, y, z, 46, 0xffa040, 5, 4, .6, 3); Sparks.emit(x, y, z, 20, 0xffe0a0, 3, 3, .35, 2); Puffs.emit(x, y, z, 4, 1.6, 0x5a4a40, .35);
  const s = glowSprite(scene, x, y, z, .5, 0xff9a40, 1); FX.push({ m: s, t: 0, life: .3, upd: (f, k) => { f.m.scale.setScalar(.5 + k * r * 1.6); f.m.material.opacity = .75 * (1 - k); } });
  shockwave(x, z, 10, r, 0, 0xff8a30);
  shake = Math.max(shake, .4); sfx('boom');
}
function firePatch(x, z, gy, r, life) {
  const m = new THREE.Mesh(BLOB_GEO(), new THREE.MeshBasicMaterial({ map: TEX.glow, color: lin(0xff6a20), transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.position.set(x, gy + .05, z); m.scale.setScalar(r / .7); m.renderOrder = 2; scene.add(m);
  hazards.push({ x, z, y: gy, r, t: 0, life, mesh: m, noParry: true, kind: 'fire' });
}
// onda d'urto che corre sul pavimento: si evita saltando (dmg 0: solo effetto)
function shockwave(x, z, spd, max, dmg, col) {
  const gy = floorAt(x, z), m = new THREE.Mesh(RING_GEO(), new THREE.MeshBasicMaterial({ color: lin(col || 0xffd8a0), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(x, gy + .06, z); m.renderOrder = 2; scene.add(m);
  rings.push({ x, z, r: .3, spd, max, dmg, mesh: m, hitDone: !dmg, noParry: true });
}
function updateHazards(dt) {
  for (const h of hazards) {
    h.t += dt; const k = h.t / h.life;
    h.mesh.material.opacity = (k < .1 ? k * 8 : 1 - Math.max(0, (k - .7) / .3)) * (.7 + Math.sin(T * 20 + h.x) * .15);
    if (Math.random() < .6) Sparks.put(h.x + rnd(-h.r, h.r) * .7, h.y + .1, h.z + rnd(-h.r, h.r) * .7, rnd(-.3, .3), rnd(1.5, 3), rnd(-.3, .3), Math.random() < .5 ? 0xff7a20 : 0xffc060, rnd(.3, .6), 1);
    if (!p.dead && p.y < h.y + .35 && Math.hypot(p.x - h.x, p.z - h.z) < h.r * .85) hurtPlayer(1, h);
  }
  hazards = hazards.filter(h => { if (h.t < h.life) return true; scene.remove(h.mesh); return false; });
  for (const r of rings) {
    r.r += r.spd * dt; const k = r.r / r.max;
    r.mesh.scale.setScalar(r.r / .55); r.mesh.material.opacity = .9 * (1 - k);
    if (!r.hitDone && !p.dead) { const d = Math.hypot(p.x - r.x, p.z - r.z); if (Math.abs(d - r.r) < .45 && p.y < .45) { r.hitDone = true; hurtPlayer(r.dmg, r); } }
  }
  rings = rings.filter(r => { if (r.r < r.max) return true; scene.remove(r.mesh); return false; });
}
function dropPick(kind, x, z, weapon) {
  let mesh, k = { kind, x, z, y: .8, vx: rnd(-3, 3), vy: rnd(4.5, 7.5), vz: rnd(-3, 3), t: 0 };
  if (kind === 'coin') mesh = coinModel();
  else if (kind === 'heart') { mesh = heartModel(); k.vx *= .5; k.vz *= .5; }
  else if (kind === 'weapon') { mesh = new THREE.Group(); const w = weaponModel(weapon.type, weapon.rar); w.traverse(o => o.castShadow = false); w.position.y = .12; w.rotation.y = rnd(0, 3); mesh.add(w); mesh.add(lootBeam(weapon.rar)); glowSprite(mesh, 0, .3, 0, 1.4, RAR[weapon.rar].hex, weapon.rar ? .55 : .3); k.weapon = weapon; k.vx *= .6; k.vz *= .6; k.inner = w; }
  else if (kind === 'chest') { takeSpare(); mesh = chestModel(); k.y = 7; k.vx = k.vz = 0; k.vy = 0; k.open = false; }
  mesh.position.set(x, k.y, z); scene.add(mesh); k.mesh = mesh; picks.push(k); return k;
}
function updatePicks(dt) {
  for (const k of picks) {
    k.t += dt;
    if (k.kind === 'coin' && k.t > .35 && !p.dead) {
      const dx = p.x - k.x, dz = p.z - k.z, dd = Math.hypot(dx, dz);
      if (dd < 3.6) { const s = 13 / Math.max(dd, .3); k.x += dx * s * dt * .5; k.z += dz * s * dt * .5; k.y += (p.y + .8 - k.y) * Math.min(1, dt * 8); if (dd < .7) { k.gone = true; if (run) run.coins++; else save.bank++; sfx('coin'); Sparks.emit(k.x, k.y, k.z, 5, 0xffd27a, 1.5, 2, .35, 2); UI.coins(); } k.mesh.position.set(k.x, k.y, k.z); k.mesh.rotation.y += dt * 9; continue; }
    }
    if (k.kind === 'heart' && k.t > .4 && !p.dead && d2(k, p) < 1 && p.hp < p.max) { p.hp++; k.gone = true; sfx('pick'); const fp_ = frontPt(1.6, .1); UI.dmg(fp_.x, fp_.y, fp_.z, '+1', '#ff7080'); UI.player(); continue; }
    k.vy -= GRAV * dt; k.x += k.vx * dt; k.z += k.vz * dt; k.y += k.vy * dt;
    const save_ = { x: k.x, z: k.z, y: 0, r: .2 }; collide(save_); k.x = save_.x; k.z = save_.z;
    const rest = (k.kind === 'chest' ? 0 : k.kind === 'heart' ? .55 : .17) + floorAt(k.x, k.z);
    if (k.y < rest) { k.y = rest; if (k.vy < -2.5 && k.kind !== 'chest') k.vy *= -.35; else { if (k.kind === 'chest' && k.vy < -2) { shake = .4; sfx('land'); Chunks.emit(k.x, .1, k.z, 10, [0x6b4428, 0xc8963c], 3, .1, .7); } k.vy = 0; } k.vx *= Math.pow(.02, dt); k.vz *= Math.pow(.02, dt); }
    k.mesh.position.set(k.x, k.y + (k.kind === 'heart' ? Math.sin(T * 3) * .08 : 0), k.z);
    if (k.kind === 'coin') k.mesh.rotation.y += dt * 4;
    if (k.kind === 'heart') k.mesh.rotation.y += dt * 2;
    if (k.kind === 'weapon') { k.inner.rotation.y += dt * .8; if (k.inner.userData.gem) k.inner.userData.gem.rotation.y += dt * 3; }
    if (k.kind === 'chest' && k.open) { const u = k.mesh.userData; u.lid.rotation.x = Math.max(-1.9, u.lid.rotation.x - dt * 6); u.glow.intensity = Math.max(0, 2.5 - (k.t - k.openT) * .8); }
  }
  picks = picks.filter(k => { if (!k.gone) return true; scene.remove(k.mesh); return false; });
}
function updateFX(dt) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i]; f.t += dt;
    if (f.t >= f.life) { if (f.m.parent) f.m.parent.remove(f.m); if (f.m.geometry && f.m.userData.own) f.m.geometry.dispose(); FX.splice(i, 1); continue; }
    if (f.upd) f.upd(f, f.t / f.life);
  }
}

/* ---------- interazioni ---------- */
function nearInter() {
  if (!p || p.dead || !level) return null;
  let best = null, bd = 1e9; const cand = [];
  for (const it of level.inter) if (!it.cond || it.cond()) cand.push(it);
  if (merchant) cand.push({ x: merchant.x, z: merchant.z + 1.1, r: 2.0, label: 'Bottega del robot', desc: 'Cure, vita in più e armi per le monete della corsa', fn: () => UI.shop() });
  for (const k of picks) {
    if (k.kind === 'weapon' && k.t > .5) cand.push({ x: k.x, z: k.z, r: 1.4, label: 'Raccogli ' + k.weapon.name, desc: RAR[k.weapon.rar].n + ' · Lv' + k.weapon.lvl + ' · scambia con la tua arma', pickRef: k, fn: () => swapWeapon(k) });
    if (k.kind === 'chest' && !k.open && k.vy === 0 && k.y < .3) cand.push({ x: k.x, z: k.z, r: 1.8, label: 'Apri il forziere', desc: 'Ricompensa del vagone', fn: () => openChest(k) });
  }
  for (const t of level.tables) if (t.state === 'up') cand.push({ x: t.x, z: t.z, r: 1.6, label: 'Ribalta il tavolo', desc: 'Riparo dalle frecce e dai biglietti', fn: () => flipTable(t) });
  for (const it of cand) {
    const dx = it.x - p.x, dz = it.z - p.z, dd = Math.hypot(dx, dz); if (dd > it.r + .35) continue;
    const ang = Math.abs(angDiff(LOOK.yaw, Math.atan2(dx, dz))); if (dd > .8 && ang > 1.0) continue;
    const sc = dd * .6 + ang * 1.4; if (sc < bd) { bd = sc; best = it; }
  }
  if (best && !best.fn) best.fn = () => interact(best.id);
  return best;
}
function interact(id) {
  if (id === 'bed') UI.dialog(['Ti stendi un attimo. Il treno culla, sferraglia, culla.', 'Sogni binari che girano in tondo. Quando ti svegli, sei ancora qui.'], 'LETTO', () => { p.hp = p.max; UI.player(); });
  else if (id === 'bestiary') UI.bestiary();
  else if (id === 'wardrobe') UI.wardrobe();
  else if (id === 'slot') UI.slot();
  else if (id === 'trunk') UI.classSelect();
  else if (id === 'door') { sfx('open'); level.exit.target = 1; setTimeout(() => transition(startRun), 350); }
  else if (id === 'exit') {
    if (!run || !run.cleared) { UI.toast('La porta è sigillata finché nella carrozza c\'è qualcuno che si muove.', '#ff9a8f'); sfx('hurt'); return; }
    if (STATE !== 'play' || run.leaving) return;
    for (const k of picks) if (k.kind === 'coin' && !k.gone) { k.gone = true; run.coins++; }
    run.leaving = true; UI.coins();
    sfx('open'); level.exit.target = 1; save.cleared++; save.best = Math.max(save.best || 0, run.n); persist();
    const next = run.n + 1;
    setTimeout(() => transition(() => { run.leaving = false; enterWagon(next); }), 450);
  }
  else if (id === 'brake') {
    if (!run || !run.cleared || STATE !== 'play') return;
    for (const k of picks) if (k.kind === 'coin' && !k.gone) { k.gone = true; run.coins++; }
    STATE = 'end'; UI.coins();
    level.fx.brake.pull = true; sfx('open'); sfx('whistle'); shake = 1.2;
    save.bank += run.coins; save.cleared++; save.wins = (save.wins || 0) + 1; save.runs++; save.best = 10; save.startWeapon = null; persist();
    setTimeout(() => { shake = 1; sfx('land'); }, 700);
    setTimeout(() => UI.end(true, run.coins), 2200);
  }
}
function swapWeapon(k) {
  const old = p.weapon; p.weapon = k.weapon; k.weapon = old;
  k.mesh.remove(k.inner); k.inner = weaponModel(old.type, old.rar); k.inner.traverse(o => o.castShadow = false); k.inner.position.y = .12; k.mesh.add(k.inner);
  k.mesh.children.forEach(c => { if (c.isMesh && c.geometry.type === 'CylinderGeometry') c.material.color.copy(lin(RAR[old.rar].hex)); });
  k.t = 0; k.vy = 3; setModelWeapon(p.model, p.weapon); sfx('pick');
  UI.toast(p.weapon.name + ' · Lv' + p.weapon.lvl, RAR[p.weapon.rar].c); UI.player();
}
function flipTable(t) {
  const dx = t.x - p.x, dz = t.z - p.z; let d;
  if (Math.abs(dx) > Math.abs(dz)) d = new THREE.Vector3(Math.sign(dx) || 1, 0, 0); else d = new THREE.Vector3(0, 0, Math.sign(dz) || 1);
  t.state = 'flipping'; t.t = 0; t.dir = d;
  const pv = new THREE.Group(); pv.position.set(t.x + d.x * .7, 0, t.z + d.z * .7); level.group.add(pv);
  level.group.remove(t.model); t.model.position.set(-d.x * .7, 0, -d.z * .7); pv.add(t.model); t.pivot = pv; t.axis = new THREE.Vector3(d.z, 0, -d.x);
  level.obs.splice(level.obs.indexOf(t.ob), 1);
  const cx = t.x + d.x * 1.55, cz = t.z + d.z * 1.55;
  t.cover = d.x ? addObs(level, cx - .13, cx + .13, t.z - .72, t.z + .72, 1.45, 'cover') : addObs(level, t.x - .72, t.x + .72, cz - .13, cz + .13, 1.45, 'cover');
  t.cover.t = t; sfx('flip'); shake = Math.max(shake, .25); level.shadowDirty = 24;
  Chunks.emit(t.x, .3, t.z, 8, [0x6b4428, 0xc8963c], 2.5, .08, .6);
}
function breakTable(t) {
  t.state = 'broken'; level.obs.splice(level.obs.indexOf(t.cover), 1);
  Chunks.emit(t.x + t.dir.x * 1.5, .7, t.z + t.dir.z * 1.5, 18, [0x6b4428, 0x3a2417, 0xc8963c], 4, .14, 1.1);
  t.pivot.parent.remove(t.pivot); level.shadowDirty = 2;
}
function updateTables(dt) {
  for (const t of level.tables) if (t.state === 'flipping') { t.t = Math.min(1, t.t + dt * 4.5); const e = t.t < 1 ? 1 - Math.pow(1 - t.t, 3) : 1; t.pivot.quaternion.setFromAxisAngle(t.axis, e * Math.PI / 2); if (t.t >= 1) t.state = 'flipped'; }
}
function openChest(k) {
  k.open = true; k.openT = k.t; sfx('open'); shake = .3;
  const n = 20 + run.n * 5;
  for (let i = 0; i < n; i++) { const c = dropPick('coin', k.x, k.z); c.vy = rnd(6, 10); c.vx = rnd(-4, 4); c.vz = rnd(-4, 4); }
  Sparks.emit(k.x, 1, k.z, 40, 0xffd27a, 3, 5, .9, 3);
  UI.toast('Ricompensa del vagone: ' + n + ' monete', '#e9b45c');
}
// la bottega: arriva a vagone libero nei vagoni con la bottega
function openShop() {
  if (merchant) return;
  const x = level.len - 9, z = 3.4, m = merchantModel(); m.position.set(x, 0, z); m.rotation.y = Math.PI; level.group.add(m);
  merchant = { x, z, model: m };
  addObs(level, x - 1.05, x + 1.05, z - .55, z + 1.6, 1.0);
  Sparks.emit(x, 1, z, 30, 0xffd27a, 2.5, 3, .8, 2); Puffs.emit(x, .5, z, 4, 1.4, 0xb8b0a8, .3); sfx('open');
  const lvl = Math.min(5, 1 + Math.ceil(run.n / 2)), types = Object.keys(WT);
  run.shop = { items: [{ kind: 'max', price: 30 + run.bought * 10 }, { kind: 'weapon', w: genWeapon(pick(types), lvl, .3) }, { kind: 'weapon', w: genWeapon(pick(types), lvl, .55) }] };
  for (const it of run.shop.items) if (it.w) it.price = 18 + it.w.lvl * 4 + it.w.rar * 14;
  level.shadowDirty = 3;
}

/* ---------- ondate ---------- */
function bossSpot(type) {
  if (type === 'capotreno') return [level.len - 7, 0];
  return [clamp(p.x + Math.sin(LOOK.yaw) * 9, 6, level.len - 6), clamp(p.z + Math.cos(LOOK.yaw) * 9, -3, 3)];
}
function startWave(i) {
  const W = WAGONS[run.n - 1];
  run.wave = i; run.active = true;
  UI.banner('ONDATA ' + (i + 1) + ' / ' + run.waves.length, W.subs[i] || '');
  let delay = .5;
  for (const [type, lvl] of run.waves[i]) {
    const def = MOBS[type]; let pt, mode;
    if (def.elite) { pt = bossSpot(type); mode = type === 'regina' ? 'roof' : type === 'capotreno' ? 'rise' : 'fade'; }
    else if (type === 'mimic') {
      // i bauli mimetici compaiono fuori dalla vista, vicino ai bagagli
      const pts = (level.mimicPts || level.spawnPts).filter(s => !enemies.some(e => Math.abs(e.x - s[0]) < 1 && Math.abs(e.z - s[1]) < 1) && !run.queue.some(q => q.x === s[0] && q.z === s[1]));
      const hidden = pts.filter(s => Math.abs(angDiff(LOOK.yaw, Math.atan2(s[0] - p.x, s[1] - p.z))) > 1.2 && (s[0] - p.x) ** 2 + (s[1] - p.z) ** 2 > 16);
      pt = pick(hidden.length ? hidden : pts.length ? pts : level.spawnPts); mode = 'sleep';
    } else {
      // quasi sempre arrivano davanti a chi gioca, ogni tanto alle spalle
      const c = level.spawnPts.filter(s => { const dd = (s[0] - p.x) ** 2 + (s[1] - p.z) ** 2; return dd > 30 && dd < 260; });
      const v = c.filter(s => Math.abs(angDiff(LOOK.yaw, Math.atan2(s[0] - p.x, s[1] - p.z))) < 1.0);
      pt = pick(v.length && Math.random() < .8 + .2 * PACE.k ? v : c.length ? c : level.spawnPts);
      mode = def.fly ? 'fade' : level.spawnMode || 'roof';
    }
    run.queue.push({ type, lvl, x: pt[0], z: pt[1], d: delay, mode }); delay += .6 * PACE.cd;
  }
  const last = run.waves[i].find(([t]) => MOBS[t].boss || MOBS[t].elite);
  if (last) setTimeout(() => { if (STATE === 'play' && run && !p.dead) UI.toast(last[0] === 'capotreno' ? 'Capotreno: «Biglietto, prego.»' : last[0] === 'regina' ? 'Capotreno: «Non guardarla negli otto occhi.»' : 'Capotreno: «Il mio bigliettaio è molto zelante.»', '#62d4c7'); }, 1800);
  UI.objective();
}
function updateWaves(dt) {
  run.t += dt;
  if (run.talkT > 0 && (run.talkT -= dt) <= 0) UI.dialog(WAGONS[run.n - 1].outro, 'CAPOTRENO');
  if (run.shopT > 0 && (run.shopT -= dt) <= 0) { openShop(); UI.toast('È arrivata la bottega del robot', '#e9b45c'); }
  if (run.wave < 0 && p.x > 9) startWave(0);
  for (const q of run.queue) { q.d -= dt; if (q.d <= 0) { spawnEnemy(q.type, q.lvl, q.x, q.z, q.mode); q.done = true; } }
  run.queue = run.queue.filter(q => !q.done);
  if (run.active && !run.queue.length && enemies.every(e => e.dead)) {
    run.active = false;
    if (run.wave >= run.waves.length - 1) {
      run.cleared = true; const last = run.n >= WAGONS.length;
      UI.banner(last ? 'IL CAPOTRENO È CADUTO' : 'CARROZZA LIBERA', last ? 'TIRA IL FRENO D\'EMERGENZA' : 'LA PORTA DEL VAGONE ' + (run.n + 1) + ' È APERTA');
      const ex = level.exit; if (ex) { ex.lamp.material = MAT.neonGreen; ex.lampL.color.copy(lin(0x6af08a)); }
      dropPick('chest', last ? level.len - 8 : level.len - 6.5, last ? 1.5 : 0);
      if (WAGONS[run.n - 1].shop) run.shopT = .8; // arriva appena prima che il capotreno ne parli
      UI.objective();
      run.talkT = 1; // il capotreno parla a forziere atterrato, anche se il dispositivo va a scatti
    } else {
      run.timer = 1.8 * PACE.cd;
      if (p.hp < p.max) { p.hp++; UI.player(); UI.toast('Bullone ti rimette in sesto: +1 vita', '#6af08a'); sfx('pick'); if (pet) Sparks.emit(pet.x, .8, pet.z, 16, 0x6af08a, 2, 2, .6, 1); }
    }
  }
  if (!run.active && run.timer > 0) { run.timer -= dt; if (run.timer <= 0) startWave(run.wave + 1); }
  enemies = enemies.filter(e => !e.dead);
}

/* ---------- aggiornamento ---------- */
function updateGame(dt) {
  if (!p.dead) updatePlayer(dt);
  else { p.deadT += dt; p.model.rotation.z = Math.min(Math.PI / 2, p.deadT * 4); p.model.position.y = Math.max(-.2, p.y - p.deadT * .4); }
  updatePet(dt);
  for (const e of enemies) if (!e.dead) updateEnemy(e, dt);
  separate();
  updateProjs(dt); updatePicks(dt); updateTables(dt); updateHazards(dt);
  if (level.kind === 'wagon' && run && !p.dead) updateWaves(dt);
}
function updateLevelFx(dt) {
  if (!level) return;
  updateMovers(level, dt);
  for (const L of level.lights) { if (L.flick) L.l.intensity = L.base * (1 - L.flick * (.5 + .5 * Math.sin(T * 13 + L.ph) * Math.sin(T * 7.3 + L.ph * 2))); }
  const fx = level.fx;
  if (fx.reels) { if (Math.floor(T * 4) !== fx.rt) { fx.rt = Math.floor(T * 4); fx.reels.forEach((r, i) => r.material = fx.reelMats[(fx.rt + i) % 3]); } fx.bulbs.forEach((b, i) => b.material = (Math.floor(T * 5) + i) % 2 ? MAT.lamp : MAT.lampDim); fx.slotLight.intensity = 1.1 + Math.sin(T * 5) * .35; }
  if (fx.scarf) fx.scarf.rotation.z = Math.sin(T * 1.5) * .05;
  // lanterne che dondolano col treno, ingranaggi, sirene, vapore, braci
  if (fx.swing) for (const s of fx.swing) { s.pv.rotation.z = Math.sin(T * 1.6 + s.ph) * s.amp; s.pv.rotation.x = Math.sin(T * 1.1 + s.ph * 2) * s.amp * .5; }
  if (fx.gears) for (const g of fx.gears) g.m.rotation.z += g.sp * dt;
  if (fx.beacons) for (const b of fx.beacons) b.rotation.y += dt * 5;
  if (fx.vents) for (const v of fx.vents) { v[2] -= dt; if (v[2] <= 0) { v[2] = rnd(.15, .4); Puffs.emit(v[0], .2, v[1], 1, 1.1, 0xd8dde2, .22); } }
  if (fx.braziers && Math.random() < .5) { const b = pick(fx.braziers); Sparks.put(b[0] + rnd(-.3, .3), 1.1, b[1] + rnd(-.3, .3), rnd(-.4, .4) - 1.5, rnd(1.5, 3), rnd(-.4, .4), Math.random() < .5 ? 0xff8a30 : 0xffc060, rnd(.6, 1.2), -.5); }
  if (fx.embers && Math.random() < .7) Sparks.put(camTarget.x + rnd(14, 26), rnd(3.5, 8), rnd(-7, 7), -rnd(9, 15), rnd(-.5, .8), rnd(-.6, .6), Math.random() < .6 ? 0xff7a20 : 0xffc060, rnd(1.2, 2.2), -.3);
  if (fx.stack && Math.random() < .25) Puffs.emit(level.len + 8, 7.5, 0, 1, 4, 0x3a3634, .45, -14);
  if (fx.brake && fx.brake.pull) fx.brake.arm.rotation.z += (-.6 - fx.brake.arm.rotation.z) * Math.min(1, dt * 6);
  if (level.fireflies) Dust.mesh.material.opacity = .65 + Math.sin(T * 3) * .25;
  const ex = level.exit; if (ex) { if (Math.abs(ex.target - ex.open) > .002) level.shadowDirty = Math.max(level.shadowDirty || 0, 1); ex.open += (ex.target - ex.open) * Math.min(1, dt * 5); ex.leaves[0].position.z = -.55 - ex.open * 1.0; ex.leaves[1].position.z = .55 + ex.open * 1.0; }
}
