/* ================= logica di gioco (vista dall'alto) ================= */
let STATE = 'title';
let p = null, pet = null, run = null;
let enemies = [], projs = [], picks = [];
let hitstop = 0, shake = 0, clockMin = 3 * 60 + 12, clackT = 0;
const GRAV = 24, JUMP = 8.4, DJUMP = 7.6;
const Wv = [
  [['ratto', 1], ['ratto', 1], ['ratto', 1], ['ratto', 1], ['ratto', 1]],
  [['scheletro', 1], ['ratto', 2], ['arciere', 1], ['scheletro', 2], ['ratto', 1]],
  [['arciere', 2], ['scheletro', 2], ['ratto', 2], ['arciere', 1], ['bigliettaio', 3]]
];
const CAM = { yaw: -.24, pitch: .98, dist: 24, zoom: 1, zoomT: 1, focus: null };

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

/* ---------- cambio ambiente ---------- */
function clearEntities() {
  for (const e of enemies) { scene.remove(e.model); if (e.hpEl) e.hpEl.remove(); }
  for (const q of projs) scene.remove(q.mesh);
  for (const k of picks) scene.remove(k.mesh);
  enemies = []; projs = []; picks = [];
}
function setLevel(L) {
  clearEntities(); UI.clearDialog();
  if (level) { scene.remove(level.group); disposeGroup(level.group); }
  level = L; scene.add(L.group);
  moon.intensity = L.moonK || 1; hemi.intensity = L.hemiK || .5;
  fitShadow(L); L.shadowDirty = 3;
  if (p) { p.x = L.start.x; p.z = L.start.z; p.y = 0; p.vx = p.vz = p.vy = 0; }
  camTarget.set(L.start.x, 0, 0);
  Rain.setCount(Q.rain); Wind.setCount(Q.leaves); Dust.reset();
  UI.zone(L);
}
function makePlayer() {
  const c = CLASSES.find(c => c.id === save.cls) || CLASSES[0];
  const w = validWeapon(save.startWeapon) ? save.startWeapon : starterWeapon(c);
  const P = { x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, r: .42, face: Math.PI / 2, cls: c, hp: c.hp, max: c.hp, weapon: w, onGround: true, jumps: 0, slideT: 0, slideCd: 0, parryT: 0, parryCd: 0, atkT: -1, atkDur: .22, atkKind: 'melee', atkCd: 0, swing: 0, swingDir: 0, hitSet: null, slideHit: null, inv: 0, dead: false, deadT: 0 };
  P.ring = new THREE.Mesh(RING_GEO(), MAT.ringTeal); P.ring.renderOrder = 2; scene.add(P.ring);
  P.blob = new THREE.Mesh(BLOB_GEO(), MAT.blob); P.blob.scale.setScalar(.85); scene.add(P.blob);
  return P;
}
function buildPlayerModel() {
  if (p.model) scene.remove(p.model);
  p.model = playerModel(p.cls.id, save.outfit); setModelWeapon(p.model, p.weapon); scene.add(p.model);
}
function applyClass() {
  const c = CLASSES.find(c => c.id === save.cls) || CLASSES[0];
  p.cls = c; p.max = p.hp = c.hp;
  if (!validWeapon(save.startWeapon)) p.weapon = starterWeapon(c);
  buildPlayerModel(); UI.player();
}
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
      const mats = new Set(), sm = [ratModel(), skeletonModel('scheletro', 'ascia'), skeletonModel('arciere', 'arco'), ghostModel(), chestModel(), coinModel(), heartModel(), lootBeam(0), lootBeam(1), lootBeam(2), slashMesh(2)];
      for (const t of Object.keys(WT)) for (const r of [0, 1, 2]) sm.push(weaponModel(t, r));
      sm.forEach(m => m.traverse(o => { if (o.material) mats.add(o.material); }));
      [MAT.flash, MAT.gold, MAT.ticket, MAT.gem, MAT.neonGreen, MAT.cream, MAT.wood, MAT.steel, MAT.red].forEach(m => mats.add(m));
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
  if (!p) p = makePlayer(); else { p.dead = false; p.hp = p.max; p.inv = 0; if (p.model) p.model.rotation.set(0, 0, 0); }
  p.weapon = validWeapon(save.startWeapon) ? save.startWeapon : (p.weapon && validWeapon(p.weapon) && !p.fromRun ? p.weapon : starterWeapon(p.cls));
  p.fromRun = false;
  setLevel(buildHub());
  buildPlayerModel();
  if (!pet) pet = makePet(p.x - 1.2, p.z + .9); pet.x = p.x - 1.2; pet.z = p.z + .9;
  UI.player(); UI.coins(); UI.map();
  if (intro) {
    UI.dialog(['...gzzt... Qui parla il capotreno.', 'Benvenuto a bordo, passeggero. Questo treno non si ferma mai. Davvero mai.', 'Prima di tutto dimmi chi sei. Il treno vuole ricordarsi la tua faccia.'], 'CAPOTRENO', () =>
      UI.classSelect(() => UI.dialog(['Bene. Il Vagone 1 è oltre la porta in fondo, a destra.', 'Nella cabina trovi il bestiario, l\'armadio e la slot machine. Avvicinati e usa il tasto E.', 'Quel robottino si chiama Bullone. Ti seguirà ovunque. Non chiedermi perché.'], 'CAPOTRENO')));
  }
}
function startWagon() {
  run = { coins: 0, kills: 0, wave: -1, active: false, timer: 0, queue: [], cleared: false, t: 0 };
  p.fromRun = true;
  setLevel(buildWagon());
  pet.x = p.x - 1.2; pet.z = p.z + .9;
  UI.coins(); UI.map(); UI.player();
  UI.dialog(['Biglietto, prego.', '...Ah, non ce l\'hai. Peccato. I passeggeri di questa carrozza non sono molto ospitali.'], 'CAPOTRENO');
}
function transition(fn) { UI.fade(true); setTimeout(() => { fn(); warmUp(); setTimeout(() => UI.fade(false), 80); }, 460); }

/* ---------- giocatore ---------- */
function moveInput() {
  let mx = (held.right ? 1 : 0) - (held.left ? 1 : 0) + joy.x, mz = (held.down ? 1 : 0) - (held.up ? 1 : 0) + joy.y;
  const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  const c = Math.cos(CAM.yaw), s = Math.sin(CAM.yaw);
  return { x: mx * c + mz * s, z: -mx * s + mz * c, l: Math.min(1, l) };
}
const ray = new THREE.Raycaster(), aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _v3 = new THREE.Vector3(), _nd = new THREE.Vector2();
function aimAngle(range) {
  if (!isTouch && performance.now() - mouse.t < 4000) {
    _nd.set(mouse.nx, mouse.ny); ray.setFromCamera(_nd, camera); aimPlane.constant = -(p.y + 1);
    if (ray.ray.intersectPlane(aimPlane, _v3)) return Math.atan2(_v3.x - p.x, _v3.z - p.z);
  }
  let best = null, bd = range * range;
  for (const e of enemies) {
    if (e.dead || e.falling || e.fadeIn > 0) continue;
    const dx = e.x - p.x, dz = e.z - p.z, dd = dx * dx + dz * dz;
    if (dd < bd) { const a = Math.atan2(dx, dz); if (isTouch || Math.abs(angDiff(p.face, a)) < 1.3) { bd = dd; best = a; } }
  }
  return best;
}
function updatePlayer(dt) {
  const c = p.cls, mv = moveInput();
  p.inv -= dt; p.parryT -= dt; p.parryCd -= dt; p.atkCd -= dt; p.slideCd -= dt; p.swing -= dt;
  if (p.atkT >= 0) { p.atkT += dt / p.atkDur; if (p.atkT >= 1) p.atkT = -1; }
  if (p.slideT > 0) {
    p.slideT -= dt; const k = Math.pow(.2, dt); p.vx *= k; p.vz *= k;
    if (Math.random() < .6) Sparks.emit(p.x, .1, p.z, 1, 0x8a7a6a, .6, .6, .4, 2);
  } else {
    const slow = p.atkT >= 0 && p.atkKind === 'melee' ? .55 : 1, sp = c.speed * slow, acc = (p.onGround ? 42 : 18) * dt;
    const tx = mv.x * sp, tz = mv.z * sp, cur = Math.hypot(p.vx, p.vz);
    if (cur > c.speed + .5 && !p.onGround) { p.vx *= Math.pow(.6, dt); p.vz *= Math.pow(.6, dt); p.vx += tx * dt * 2; p.vz += tz * dt * 2; }
    else { p.vx += clamp(tx - p.vx, -acc, acc); p.vz += clamp(tz - p.vz, -acc, acc); }
  }
  if (mv.l > .15 && p.atkT < 0 && p.slideT <= 0) p.face = turnTo(p.face, Math.atan2(mv.x, mv.z), 14 * dt);
  // salto e doppio salto (con lo slancio della scivolata)
  if (pressed.jump) {
    if (p.onGround) { p.vy = JUMP; p.jumps = 1; p.onGround = false; sfx('jump'); if (p.slideT > 0) { p.slideT = 0; const s = Math.hypot(p.vx, p.vz), k = Math.min(15, s + 1.5) / (s || 1); p.vx *= k; p.vz *= k; } }
    else if (p.jumps < 2) { p.vy = DJUMP; p.jumps = 2; sfx('jump'); Sparks.emit(p.x, p.y + .1, p.z, 10, 0xffe0a0, 2.5, .5, .35, 0); }
  }
  if (pressed.slide && p.onGround && p.slideT <= 0 && p.slideCd <= 0) {
    const dir = mv.l > .15 ? Math.atan2(mv.x, mv.z) : p.face, sp = c.perk === 'slide' ? 15 : 13;
    p.face = dir; p.vx = Math.sin(dir) * sp; p.vz = Math.cos(dir) * sp; p.slideT = c.perk === 'slide' ? .5 : .38; p.slideCd = .55; p.slideHit = new Set(); sfx('swing');
  }
  if ((pressed.attack || (held.attack && WT[p.weapon.type].kind !== 'melee')) && p.atkCd <= 0 && p.slideT <= 0) playerAttack();
  if (pressed.parry && p.parryCd <= 0) { p.parryT = c.perk === 'parry' ? .34 : .22; p.parryCd = .55; }
  p.x += p.vx * dt; p.z += p.vz * dt; p.vy -= GRAV * dt; p.y += p.vy * dt;
  collide(p);
  const g = groundAt(p.x, p.z, p.r, p.y);
  if (p.y <= g) { if (!p.onGround && p.vy < -7) { Sparks.emit(p.x, g + .05, p.z, 8, 0x9a8a7a, 2, .4, .4, 2); sfx('land'); } p.y = g; p.vy = 0; p.onGround = true; p.jumps = 0; }
  else if (p.y > g + .02) p.onGround = false;
  // colpi in mischia
  if (p.swing > 0) {
    const t = WT[p.weapon.type];
    for (const e of enemies) {
      if (e.dead || e.falling || p.hitSet.has(e)) continue;
      const dx = e.x - p.x, dz = e.z - p.z, dd = Math.hypot(dx, dz);
      if (dd < t.reach + e.r && Math.abs(angDiff(p.swingDir, Math.atan2(dx, dz))) < 1.2 && Math.abs(e.y - p.y) < 1.7) { p.hitSet.add(e); hitEnemy(e, p.weapon.dmg, p.weapon.type, p.weapon.crit, p.swingDir, t.kb); }
    }
  }
  if (p.slideT > 0) for (const e of enemies) if (!e.dead && !e.falling && !p.slideHit.has(e) && d2(p, e) < (p.r + e.r) ** 2 && e.y < 1) { p.slideHit.add(e); hitEnemy(e, c.perk === 'slide' ? 2 : 1, 'slide', 0, p.face, 6); }
  if (pressed.interact) { const it = nearInter(); if (it) it.fn(); }
  // modello
  p.model.position.set(p.x, p.y, p.z); p.model.rotation.y = p.face;
  posePlayer(p.model, { spd: Math.hypot(p.vx, p.vz), ground: p.onGround, slide: p.slideT > 0, atk: p.atkT, kind: p.atkKind, parry: p.parryT > 0 }, dt);
  p.model.visible = !(p.inv > 0 && Math.floor(T * 18) % 2);
  const fy = floorAt(p.x, p.z);
  p.ring.position.set(p.x, fy + .03, p.z); p.blob.position.set(p.x, fy + .02, p.z); p.blob.material.opacity = .55;
}
function playerAttack() {
  const w = p.weapon, t = WT[w.type];
  p.atkCd = w.cd; p.atkT = 0; p.atkKind = t.kind; p.atkDur = t.kind === 'melee' ? Math.min(.26, w.cd * .8) : .22;
  const a = aimAngle(t.kind === 'melee' ? 3.6 : 11); if (a !== null) p.face = a;
  if (t.kind === 'melee') {
    p.swing = .13; p.swingDir = p.face; p.hitSet = new Set(); sfx('swing');
    const s = slashMesh(t.reach, w.rar === 2 ? 0xd9a8ff : w.rar === 1 ? 0xa8ccff : 0xffe2a8);
    s.position.set(p.x, p.y + 1.0, p.z); s.rotation.y = p.face; scene.add(s); FX.push({ m: s, t: 0, life: .2, kind: 'slash' });
  } else {
    const mg = t.kind === 'magic', fx = Math.sin(p.face), fz = Math.cos(p.face);
    spawnProj({ from: 'p', x: p.x + fx * .6, y: p.y + 1.15, z: p.z + fz * .6, vx: fx * t.spd, vz: fz * t.spd, dmg: w.dmg, tag: w.type, crit: w.crit, kind: mg ? 'bolt' : 'arrow', pierce: mg && p.cls.perk === 'pierce', life: 1.6 });
    sfx(mg ? 'magic' : 'shoot');
    if (mg) Sparks.emit(p.x + fx * .7, p.y + 1.15, p.z + fz * .7, 8, 0xc98bff, 1.5, 1, .3, 0);
  }
}
function hurtPlayer(dmg, src) {
  if (p.dead) return false;
  if (p.parryT > 0) {
    p.parryT = 0; p.parryCd = .12; hitstop = .08; shake = Math.max(shake, .35); sfx('parry');
    Sparks.emit(p.x + Math.sin(p.face) * .7, p.y + 1.1, p.z + Math.cos(p.face) * .7, 22, 0xffe0a0, 4, 3, .4, 4);
    UI.dmg(p.x, p.y + 2.4, p.z, 'PARRY!', '#f6d79a');
    if (src.isProj) {
      src.from = 'p'; src.vx *= -1.5; src.vz *= -1.5; src.tag = 'reflect'; src.dmg = Math.max(2, src.dmg * 2); src.hit = new Set(); src.life = 1.6;
      src.mesh.traverse(o => { if (o.isMesh) o.material = MAT.gold; });
    } else { src.stun = 1.4; src.state = 'stun'; src.kbT = .2; const a = Math.atan2(src.x - p.x, src.z - p.z); src.vx = Math.sin(a) * 6; src.vz = Math.cos(a) * 6; }
    return false;
  }
  if (p.inv > 0) return false;
  if (p.slideT > 0 && !src.isProj) return false;
  p.hp -= dmg; p.inv = 1; shake = Math.max(shake, .45); hitstop = .05; sfx('hurt'); grade.uniforms.flash.value = .6;
  Chunks.emit(p.x, p.y + 1, p.z, 6, [0xd8424e, 0x9b2f35], 3, .1, .6);
  const a = Math.atan2(p.x - src.x, p.z - src.z); p.vx = Math.sin(a) * 7; p.vz = Math.cos(a) * 7; p.vy = 4;
  UI.player();
  if (p.hp <= 0) { p.hp = 0; playerDie(); }
  return true;
}
function playerDie() {
  p.dead = true; p.deadT = 0; sfx('die');
  Chunks.emit(p.x, p.y + 1, p.z, 24, [0xd8424e, 0xe8dcc0, 0x6a1f26], 5, .14, 1.2);
  const kept = Math.floor(run.coins / 2); save.bank += kept; save.runs++; save.startWeapon = null; persist();
  setTimeout(() => UI.end(false, kept), 1200);
}

/* ---------- compagno robot ---------- */
function updatePet(dt) {
  if (!pet) return;
  const back = p.face + Math.PI + .7, tx = p.x + Math.sin(back) * 1.5, tz = p.z + Math.cos(back) * 1.5;
  let dx = tx - pet.x, dz = tz - pet.z; const d = Math.hypot(dx, dz);
  if (d > 14) { pet.x = tx; pet.z = tz; }
  const sp = d > .3 ? Math.min(9, d * 3.2) : 0;
  pet.vx += ((d > 0 ? dx / d : 0) * sp - pet.vx) * Math.min(1, dt * 6); pet.vz += ((d > 0 ? dz / d : 0) * sp - pet.vz) * Math.min(1, dt * 6);
  pet.x += pet.vx * dt; pet.z += pet.vz * dt;
  pet.x = clamp(pet.x, level.x0 + .4, level.x1 - .4); pet.z = clamp(pet.z, level.z0 + .4, level.z1 - .4);
  const fy = floorAt(pet.x, pet.z); pet.y += (fy - pet.y) * Math.min(1, dt * 10);
  const s = Math.hypot(pet.vx, pet.vz);
  if (s > .4) pet.face = turnTo(pet.face, Math.atan2(pet.vx, pet.vz), 8 * dt); else pet.face = turnTo(pet.face, Math.atan2(p.x - pet.x, p.z - pet.z), 3 * dt);
  const m = pet.model, u = m.userData; u.phase += dt * (4 + s * 3);
  m.position.set(pet.x, pet.y + Math.abs(Math.sin(u.phase)) * .06 * Math.min(1, s), pet.z); m.rotation.y = pet.face;
  u.legs.forEach((l, i) => l.rotation.x = Math.sin(u.phase + (i % 2 ? Math.PI : 0)) * .5 * Math.min(1, s / 3));
  u.body.rotation.z = Math.sin(T * 2) * .03;
  u.light.intensity = 1.5 + Math.sin(T * 7) * .08;
}

/* ---------- nemici ---------- */
function spawnEnemy(type, lvl, x, z) {
  const d = MOBS[type], wtype = pick(d.wpn);
  const model = type === 'ratto' ? ratModel() : type === 'bigliettaio' ? ghostModel() : skeletonModel(type, wtype);
  scene.add(model);
  const fly = type === 'bigliettaio';
  if (fly) takeSpare();
  const e = { type, lvl, x, z, y: fly ? 1.3 : 7.5, vx: 0, vz: 0, vy: 0, r: type === 'ratto' ? .4 : fly ? .65 : .45, face: Math.atan2(p.x - x, p.z - z), hp: Math.round(d.hp * (1 + .35 * (lvl - 1))), state: 'walk', st: 0, cd: rnd(.7, 1.4), stun: 0, kbT: 0, bite: 0, flash: 0, falling: !fly, fadeIn: fly ? 1.2 : 0, weapon: wtype, model, spd: type === 'ratto' ? rnd(4.2, 5.0) : type === 'scheletro' ? rnd(2.4, 2.9) : fly ? 2.4 : 2.7, dashT: 0, dashCd: 4.5, tickCd: 2.4, seenWeak: false, phase: Math.random() * 6 };
  e.max = e.hp;
  e.ringMat = (fly ? MAT.ringTeal : MAT.ringRed).clone(); e.ring = addRing(model, e.ringMat, type === 'ratto' ? .75 : fly ? 1.3 : .9);
  model.position.set(x, e.y, z); model.rotation.y = e.face;
  e.hpEl = UI.hpBar(fly);
  if (fly) { sfx('ghost'); Sparks.emit(x, 1.5, z, 40, 0x62d4c7, 3, 3, 1, 0); }
  enemies.push(e); return e;
}
function hitEnemy(e, base, tag, crit, ang, kb) {
  const def = MOBS[e.type], m = def.mult[tag] || 1; let dmg = base * m; const cr = Math.random() * 100 < (crit || 0); if (cr) dmg *= 2; dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = .12; hitstop = Math.max(hitstop, .035); shake = Math.max(shake, .18); sfx('hit');
  if (kb && !def.elite) { e.vx = Math.sin(ang) * kb; e.vz = Math.cos(ang) * kb; e.kbT = .16; }
  UI.dmg(e.x, e.y + 2.0, e.z, cr ? dmg + '!' : String(dmg), cr ? '#ffd34a' : m > 1 ? '#ff9a5a' : '#ffffff');
  if (m > 1 && !e.seenWeak) { e.seenWeak = true; UI.dmg(e.x, e.y + 2.7, e.z, 'PUNTO DEBOLE', '#ff9a5a'); }
  Chunks.emit(e.x, e.y + .9, e.z, 4, e.type === 'bigliettaio' ? [0x62d4c7, 0x1f2a52] : e.type === 'ratto' ? [0x625852, 0xc4867f] : [0xd8ccb0, 0x9a8f78], 2.5, .09, .6);
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; run.kills++;
  const first = !save.kills[e.type]; save.kills[e.type] = (save.kills[e.type] || 0) + 1; persist();
  if (first) UI.toast('Nuova voce nel Bestiario: ' + MOBS[e.type].name, '#e9b45c');
  const col = e.type === 'bigliettaio' ? [0x62d4c7, 0x1f2a52, 0xc8963c] : e.type === 'ratto' ? [0x625852, 0xc4867f, 0x3a302c] : [0xd8ccb0, 0xc8bc9e, 0x2a2020];
  Chunks.emit(e.x, e.y + .8, e.z, e.type === 'bigliettaio' ? 40 : 18, col, 4, e.type === 'ratto' ? .1 : .13, 1.3);
  scene.remove(e.model); if (e.hpEl) e.hpEl.remove();
  if (e.type === 'bigliettaio') giveSpare();
  const elite = MOBS[e.type].elite, n = ri(2, 3) * e.lvl + (elite ? 14 : 0);
  for (let i = 0; i < n; i++) dropPick('coin', e.x, e.z);
  dropPick('weapon', e.x, e.z, genWeapon(e.weapon, e.lvl, elite ? .5 : 0));
  if (Math.random() < .18 || elite) dropPick('heart', e.x, e.z);
  if (elite) { shake = .8; hitstop = .15; }
}
function steer(e, tx, tz, speed, opt, dt) {
  let a = Math.atan2(tx - e.x, tz - e.z);
  for (const off of [0, .5, -.5, 1, -1, 1.6, -1.6, 2.3, -2.3]) { const aa = a + off; if (!blockedAt(e.x + Math.sin(aa) * 1.1, e.z + Math.cos(aa) * 1.1, e.r * .8, opt)) { a = aa; break; } }
  const k = Math.min(1, dt * 7); e.vx += (Math.sin(a) * speed - e.vx) * k; e.vz += (Math.cos(a) * speed - e.vz) * k;
}
function updateEnemy(e, dt) {
  e.flash -= dt; e.cd -= dt; e.bite -= dt; e.kbT -= dt; e.phase += dt;
  const u = e.model.userData, opt = { rat: e.type === 'ratto', fly: e.type === 'bigliettaio' };
  if (e.falling) {
    e.vy -= GRAV * dt; e.y += e.vy * dt;
    if (e.y <= 0) { e.y = 0; e.vy = 0; e.falling = false; sfx('land'); shake = Math.max(shake, .15); Chunks.emit(e.x, .1, e.z, 8, [0x5a5048, 0x3a342e], 2.5, .08, .6); Sparks.emit(e.x, .1, e.z, 10, 0x9a8a7a, 2.5, .5, .4, 1); }
    e.model.position.set(e.x, e.y, e.z); return;
  }
  if (e.fadeIn > 0) e.fadeIn -= dt;
  const dx = p.x - e.x, dz = p.z - e.z, dist = Math.hypot(dx, dz), toP = Math.atan2(dx, dz);
  if (e.stun > 0) { e.stun -= dt; e.vx *= .88; e.vz *= .88; if (e.stun <= 0) e.state = 'walk'; }
  else if (e.kbT > 0) { e.vx *= .9; e.vz *= .9; }
  else if (p.dead) { e.vx *= .9; e.vz *= .9; }
  else if (e.type === 'ratto') {
    steer(e, p.x, p.z, e.spd, opt, dt); e.face = turnTo(e.face, Math.atan2(e.vx, e.vz), 10 * dt);
    if (dist < e.r + p.r + .15 && e.bite <= 0 && p.y < .8) { e.bite = .9; hurtPlayer(1, e); }
  } else if (e.type === 'scheletro') {
    if (e.state === 'walk') { steer(e, p.x, p.z, dist > 1.6 ? e.spd : 0, opt, dt); e.face = turnTo(e.face, toP, 6 * dt); if (dist < 2.1 && e.cd <= 0 && p.y < 1.6) { e.state = 'windup'; e.st = .55; sfx('tick'); } }
    else if (e.state === 'windup') { e.vx *= .8; e.vz *= .8; e.face = turnTo(e.face, toP, 4 * dt); e.st -= dt; if (e.st <= 0) { e.state = 'strike'; e.st = .16; e.vx = Math.sin(e.face) * 6.5; e.vz = Math.cos(e.face) * 6.5; e.hitDone = false; sfx('swing'); } }
    else if (e.state === 'strike') { e.st -= dt; e.vx *= .85; e.vz *= .85; if (!e.hitDone && dist < 2.0 && Math.abs(angDiff(e.face, toP)) < 1.2 && p.y < 1.6) { e.hitDone = true; hurtPlayer(e.lvl > 1 ? 2 : 1, e); } if (e.st <= 0) { e.state = 'recover'; e.st = .5; } }
    else if (e.state === 'recover') { e.vx *= .85; e.vz *= .85; e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = rnd(.8, 1.3); } }
  } else if (e.type === 'arciere') {
    e.face = turnTo(e.face, toP, 7 * dt);
    if (e.state === 'draw') { e.vx *= .8; e.vz *= .8; e.st -= dt; if (e.st <= 0) { const s = 9.5; spawnProj({ from: 'e', isProj: true, x: e.x + Math.sin(toP) * .6, y: 1.15, z: e.z + Math.cos(toP) * .6, vx: Math.sin(toP) * s, vz: Math.cos(toP) * s, dmg: 1, kind: 'arrow', life: 3 }); sfx('shoot'); e.state = 'walk'; e.cd = rnd(1.5, 2.2); } }
    else {
      let tx = e.x, tz = e.z;
      if (dist < 5.5) { tx = e.x - dx; tz = e.z - dz; } else if (dist > 9.5) { tx = p.x; tz = p.z; } else { tx = e.x + Math.cos(toP) * 2; tz = e.z - Math.sin(toP) * 2; }
      steer(e, tx, tz, dist < 5.5 || dist > 9.5 ? e.spd : e.spd * .4, opt, dt);
      if (e.cd <= 0 && dist < 15) { e.state = 'draw'; e.st = .75; }
    }
  } else if (e.type === 'bigliettaio') {
    e.face = turnTo(e.face, toP, 5 * dt);
    if (e.dashT > 0) { e.dashT -= dt; e.vx = Math.sin(e.dashA) * 11; e.vz = Math.cos(e.dashA) * 11; if (Math.random() < .5) Sparks.emit(e.x, 1.4, e.z, 2, 0x62d4c7, .5, .5, .5, 0); }
    else {
      const want = 5.5, orbit = T * .6;
      const tx = p.x - Math.sin(toP + Math.sin(orbit) * .8) * want, tz = p.z - Math.cos(toP + Math.sin(orbit) * .8) * want;
      const k = Math.min(1, dt * 2); e.vx += ((tx - e.x) * 1.1 - e.vx) * k; e.vz += ((tz - e.z) * 1.1 - e.vz) * k;
      const sp = Math.hypot(e.vx, e.vz); if (sp > 4) { e.vx *= 4 / sp; e.vz *= 4 / sp; }
      e.tickCd -= dt; e.dashCd -= dt;
      if (e.tickCd <= 0 && e.fadeIn <= 0) { e.tickCd = 2.2; for (const da of [-.32, 0, .32]) spawnProj({ from: 'e', isProj: true, x: e.x, y: 1.3, z: e.z, vx: Math.sin(toP + da) * 7.5, vz: Math.cos(toP + da) * 7.5, dmg: 1, kind: 'ticket', life: 3.2 }); sfx('shoot'); }
      if (e.dashCd <= 0 && dist < 10 && e.fadeIn <= 0) { e.dashCd = rnd(4.2, 5.6); e.dashT = .55; e.dashA = toP; UI.dmg(e.x, 3.4, e.z, 'BIGLIETTO!', '#62d4c7'); sfx('ghost'); }
    }
    if (dist < e.r + p.r + .2 && e.bite <= 0 && e.fadeIn <= 0) { e.bite = 1; hurtPlayer(e.dashT > 0 ? 2 : 1, e); }
  }
  e.x += e.vx * dt; e.z += e.vz * dt;
  collide(e, opt);
  if (e.type === 'bigliettaio') { e.x = clamp(e.x, level.x0 + 1, level.x1 - 1); e.z = clamp(e.z, level.z0 + 1, level.z1 - 1); e.y = 1.3 + Math.sin(T * 2.2) * .15; }
  else e.y = 0;
  // posa del modello
  const m = e.model, spd = Math.hypot(e.vx, e.vz);
  m.position.set(e.x, e.y, e.z); m.rotation.y = e.face;
  const flash = e.flash > 0;
  if (e.type === 'ratto') {
    u.body.position.y = Math.abs(Math.sin(e.phase * 18)) * .05 * Math.min(1, spd / 2);
    u.tail.rotation.y = Math.sin(e.phase * 10) * .5; u.legs.forEach((l, i) => l.rotation.x = Math.sin(e.phase * 20 + (i % 2) * Math.PI) * .7 * Math.min(1, spd / 2));
  } else if (e.type === 'bigliettaio') {
    u.armL.rotation.x = Math.sin(T * 2) * .3 - .3; u.armR.rotation.x = e.tickCd < .4 ? -1.6 : -.4 + Math.sin(T * 2 + 1) * .2;
    u.body.rotation.x = e.dashT > 0 ? .5 : 0; u.light.intensity = 2.2 + Math.sin(T * 9) * .3;
    m.traverse(o => { if (o.isMesh && o.material.transparent) o.material.opacity = (o.material === MAT.ghost ? .62 : .85) * (e.fadeIn > 0 ? 1 - e.fadeIn / 1.2 : 1); });
  } else {
    const ph = e.phase * (4 + spd * 1.5), k = Math.min(1, spd / 2.5);
    u.legL.rotation.x = Math.sin(ph) * .7 * k; u.legR.rotation.x = -Math.sin(ph) * .7 * k; u.armL.rotation.x = -Math.sin(ph) * .4 * k; u.armR.rotation.x = Math.sin(ph) * .4 * k - .3;
    u.upper.rotation.y = 0; u.head.rotation.z = e.stun > 0 ? Math.sin(T * 12) * .25 : 0;
    if (e.state === 'windup') { u.armR.rotation.x = -2.7; u.upper.rotation.y = .6; }
    else if (e.state === 'strike') { u.armR.rotation.x = -1.3; u.upper.rotation.y = -.9; }
    else if (e.state === 'draw') { u.armL.rotation.x = -1.55; u.armR.rotation.x = -1.4; u.upper.rotation.y = -.25; }
    if (u.weapon) u.weapon.rotation.x = e.wtype === 'arco' ? -1.45 : -.6;
  }
  const warn = e.state === 'windup' || e.state === 'draw' || (e.type === 'bigliettaio' && e.tickCd < .5);
  e.ringMat.opacity = warn ? .5 + Math.sin(T * 30) * .4 : (e.type === 'bigliettaio' ? .5 : .35);
  e.ring.scale.setScalar((e.type === 'ratto' ? .75 : e.type === 'bigliettaio' ? 1.3 : .9) * (warn ? 1.25 : 1));
  if (flash !== e.wasFlash) { e.wasFlash = flash; m.traverse(o => { if (o.isMesh && o.material.emissive && !o.material.transparent) { if (flash) { o.userData.m0 = o.material; o.material = MAT.flash; } else if (o.userData.m0) { o.material = o.userData.m0; } } }); }
}
function separate() {
  for (let i = 0; i < enemies.length; i++) for (let j = i + 1; j < enemies.length; j++) {
    const a = enemies[i], b = enemies[j]; if (a.dead || b.dead || a.falling || b.falling) continue;
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), m = a.r + b.r;
    if (d < m && d > 1e-4) { const k = (m - d) / d * .5; a.x -= dx * k; a.z -= dz * k; b.x += dx * k; b.z += dz * k; }
  }
}

/* ---------- proiettili, raccolte, effetti ---------- */
const FX = [];
function spawnProj(o) {
  let mesh;
  if (o.kind === 'arrow') { mesh = new THREE.Group(); bx(mesh, o.from === 'p' ? MAT.cream : MAT.wood, .05, .05, .72, 0, 0, 0, false); bx(mesh, MAT.steel, .09, .09, .14, 0, 0, .4, false); bx(mesh, MAT.red, .12, .02, .14, 0, 0, -.32, false); }
  else if (o.kind === 'bolt') { mesh = new THREE.Mesh(boxGeo(.22, .22, .22), MAT.gem); glowSprite(mesh, 0, 0, 0, 1.1, 0xb070ff, .9); }
  else { mesh = new THREE.Mesh(boxGeo(.34, .03, .22), MAT.ticket); glowSprite(mesh, 0, 0, 0, .7, 0x62d4c7, .5); }
  mesh.position.set(o.x, o.y, o.z); mesh.rotation.y = Math.atan2(o.vx, o.vz); scene.add(mesh);
  o.mesh = mesh; o.hit = new Set(); o.r = o.kind === 'bolt' ? .25 : .18; projs.push(o); return o;
}
function updateProjs(dt) {
  for (const q of projs) {
    q.life -= dt; q.x += q.vx * dt; q.z += q.vz * dt;
    for (const o of level.obs) {
      if (q.y > o.h || (o.kind === 'cover' && q.from === 'p')) continue;
      if (q.x > o.x0 && q.x < o.x1 && q.z > o.z0 && q.z < o.z1) {
        q.life = 0; Sparks.emit(q.x, q.y, q.z, 6, q.kind === 'bolt' ? 0xc98bff : 0xffd8a0, 2, 1.5, .3, 4);
        if (o.kind === 'cover' && o.t) { o.t.hp--; sfx('flip'); Chunks.emit(q.x, q.y, q.z, 4, [0x6b4428, 0x3a2417], 2, .08, .6); if (o.t.hp <= 0) breakTable(o.t); }
        break;
      }
    }
    if (q.life <= 0) continue;
    if (q.from === 'e') {
      if (!p.dead && d2(q, p) < (p.r + q.r) ** 2 && Math.abs(q.y - (p.y + .9)) < 1.1) { const before = q.from; hurtPlayer(q.dmg, q); if (q.from === before) q.life = 0; }
    } else for (const e of enemies) {
      if (e.dead || e.falling || q.hit.has(e)) continue;
      if (d2(q, e) < (e.r + q.r) ** 2 && Math.abs(q.y - (e.y + .9)) < 1.3) { q.hit.add(e); hitEnemy(e, q.dmg, q.tag, q.crit, Math.atan2(q.vx, q.vz), 4); if (!q.pierce) { q.life = 0; break; } }
    }
    q.mesh.position.set(q.x, q.y, q.z);
    if (q.kind === 'ticket') q.mesh.rotation.y += dt * 12; else q.mesh.rotation.y = Math.atan2(q.vx, q.vz);
    if (q.kind === 'bolt') { q.mesh.rotation.x += dt * 8; if (Math.random() < .6) Sparks.emit(q.x, q.y, q.z, 1, 0xb070ff, .3, .3, .35, 0); }
  }
  projs = projs.filter(q => { if (q.life > 0) return true; scene.remove(q.mesh); return false; });
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
    if (k.kind === 'heart' && k.t > .4 && !p.dead && d2(k, p) < 1 && p.hp < p.max) { p.hp++; k.gone = true; sfx('pick'); UI.dmg(p.x, p.y + 2.3, p.z, '+1', '#ff7080'); UI.player(); continue; }
    k.vy -= GRAV * dt; k.x += k.vx * dt; k.z += k.vz * dt; k.y += k.vy * dt;
    const save_ = { x: k.x, z: k.z, y: 0, r: .2 }; collide(save_); k.x = save_.x; k.z = save_.z;
    const rest = (k.kind === 'chest' ? 0 : k.kind === 'heart' ? .55 : .17) + floorAt(k.x, k.z);
    if (k.y < rest) { k.y = rest; if (k.vy < -2.5 && k.kind !== 'chest') k.vy *= -.35; else { if (k.kind === 'chest' && k.vy < -2) { shake = .4; sfx('land'); Chunks.emit(k.x, .1, k.z, 10, [0x6b4428, 0xc8963c], 3, .1, .7); } k.vy = 0; } k.vx *= Math.pow(.02, dt); k.vz *= Math.pow(.02, dt); }
    k.mesh.position.set(k.x, k.y + (k.kind === 'heart' ? Math.sin(T * 3) * .08 : 0), k.z);
    if (k.kind === 'coin') k.mesh.rotation.y += dt * 4;
    if (k.kind === 'heart') k.mesh.rotation.y += dt * 2;
    if (k.kind === 'weapon') k.inner.rotation.y += dt * .8;
    if (k.kind === 'chest' && k.open) { const u = k.mesh.userData; u.lid.rotation.x = Math.max(-1.9, u.lid.rotation.x - dt * 6); u.glow.intensity = Math.max(0, 2.5 - (k.t - k.openT) * .8); }
  }
  picks = picks.filter(k => { if (!k.gone) return true; scene.remove(k.mesh); return false; });
}
function updateFX(dt) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i]; f.t += dt;
    if (f.kind === 'slash') { f.m.material.opacity = 1 - f.t / f.life; f.m.position.set(p.x, p.y + 1.0, p.z); }
    if (f.t >= f.life) { scene.remove(f.m); if (f.m.geometry && f.m.userData.own) f.m.geometry.dispose(); FX.splice(i, 1); }
  }
}

/* ---------- interazioni ---------- */
function nearInter() {
  if (!p || p.dead || !level) return null;
  let best = null, bd = 1e9; const cand = [];
  for (const it of level.inter) if (!it.cond || it.cond()) cand.push(it);
  for (const k of picks) {
    if (k.kind === 'weapon' && k.t > .5) cand.push({ x: k.x, z: k.z, r: 1.4, label: 'Raccogli ' + k.weapon.name, desc: RAR[k.weapon.rar].n + ' · Lv' + k.weapon.lvl + ' · scambia con la tua arma', pickRef: k, fn: () => swapWeapon(k) });
    if (k.kind === 'chest' && !k.open && k.vy === 0 && k.y < .3) cand.push({ x: k.x, z: k.z, r: 1.8, label: 'Apri il forziere', desc: 'Ricompensa del vagone', fn: () => openChest(k) });
  }
  for (const t of level.tables) if (t.state === 'up') cand.push({ x: t.x, z: t.z, r: 1.6, label: 'Ribalta il tavolo', desc: 'Riparo dalle frecce e dai biglietti', fn: () => flipTable(t) });
  for (const it of cand) { const dd = Math.hypot(it.x - p.x, it.z - p.z); if (dd < it.r && dd < bd) { bd = dd; best = it; } }
  if (best && !best.fn) best.fn = () => interact(best.id);
  return best;
}
function interact(id) {
  if (id === 'bed') UI.dialog(['Ti stendi un attimo. Il treno culla, sferraglia, culla.', 'Sogni binari che girano in tondo. Quando ti svegli, sei ancora qui.'], 'LETTO', () => { p.hp = p.max; UI.player(); });
  else if (id === 'bestiary') UI.bestiary();
  else if (id === 'wardrobe') UI.wardrobe();
  else if (id === 'slot') UI.slot();
  else if (id === 'trunk') UI.classSelect();
  else if (id === 'door') { sfx('open'); level.exit.target = 1; setTimeout(() => transition(startWagon), 350); }
  else if (id === 'exit') {
    if (!run || !run.cleared) { UI.toast('La porta è sigillata finché nella carrozza c\'è qualcuno che si muove.', '#ff9a8f'); sfx('hurt'); return; }
    for (const k of picks) if (k.kind === 'coin' && !k.gone) { k.gone = true; run.coins++; }
    STATE = 'end'; UI.coins();
    sfx('open'); level.exit.target = 1; save.bank += run.coins; save.cleared++; save.runs++; save.startWeapon = null; persist();
    setTimeout(() => UI.end(true, run.coins), 700);
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
  for (let i = 0; i < 30; i++) { const c = dropPick('coin', k.x, k.z); c.vy = rnd(6, 10); c.vx = rnd(-4, 4); c.vz = rnd(-4, 4); }
  Sparks.emit(k.x, 1, k.z, 40, 0xffd27a, 3, 5, .9, 3);
  UI.toast('Ricompensa del vagone: 30 monete', '#e9b45c');
}

/* ---------- ondate ---------- */
function startWave(i) {
  run.wave = i; run.active = true;
  UI.banner('ONDATA ' + (i + 1) + ' / ' + Wv.length, i === 2 ? 'IL BIGLIETTAIO STA ARRIVANDO' : 'SCENDONO DAL TETTO SQUARCIATO');
  let delay = .5;
  for (const [type, lvl] of Wv[i]) {
    let pt;
    if (type === 'bigliettaio') pt = [Math.min(level.len - 6, p.x + 9), 0];
    else { const c = level.spawnPts.filter(s => { const dd = (s[0] - p.x) ** 2 + (s[1] - p.z) ** 2; return dd > 30 && dd < 260; }); pt = pick(c.length ? c : level.spawnPts); }
    run.queue.push({ type, lvl, x: pt[0], z: pt[1], d: delay }); delay += .6;
  }
  if (i === 2) setTimeout(() => { if (STATE === 'play' && run && !p.dead) UI.toast('Capotreno: «Il mio bigliettaio è molto zelante.»', '#62d4c7'); }, 1800);
  UI.objective();
}
function updateWaves(dt) {
  run.t += dt;
  if (run.talkT > 0 && (run.talkT -= dt) <= 0) UI.dialog(['Hai ripulito il primo vagone. Notevole.', 'Ne mancano... beh, li ho persi di vista anch\'io. Prendi le tue monete e prosegui.'], 'CAPOTRENO');
  if (run.wave < 0 && p.x > 9) startWave(0);
  for (const q of run.queue) { q.d -= dt; if (q.d <= 0) { spawnEnemy(q.type, q.lvl, q.x, q.z); q.done = true; } }
  run.queue = run.queue.filter(q => !q.done);
  if (run.active && !run.queue.length && enemies.every(e => e.dead)) {
    run.active = false;
    if (run.wave >= Wv.length - 1) {
      run.cleared = true; UI.banner('CARROZZA LIBERA', 'LA PORTA DEL VAGONE 2 È APERTA');
      const ex = level.exit; ex.lamp.material = MAT.neonGreen; ex.lampL.color.copy(lin(0x6af08a));
      dropPick('chest', level.len - 6.5, 0);
      UI.objective();
      run.talkT = 1; // il capotreno parla a forziere atterrato, anche se il dispositivo va a scatti
    } else run.timer = 1.8;
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
  updateProjs(dt); updatePicks(dt); updateTables(dt);
  if (level.kind === 'wagon' && run && !p.dead) updateWaves(dt);
}
function updateLevelFx(dt) {
  if (!level) return;
  updateMovers(level, dt);
  for (const L of level.lights) { if (L.flick) L.l.intensity = L.base * (1 - L.flick * (.5 + .5 * Math.sin(T * 13 + L.ph) * Math.sin(T * 7.3 + L.ph * 2))); }
  const fx = level.fx;
  if (fx.reels) { if (Math.floor(T * 4) !== fx.rt) { fx.rt = Math.floor(T * 4); fx.reels.forEach((r, i) => r.material = fx.reelMats[(fx.rt + i) % 3]); } fx.bulbs.forEach((b, i) => b.material = (Math.floor(T * 5) + i) % 2 ? MAT.lamp : MAT.lampDim); fx.slotLight.intensity = 1.1 + Math.sin(T * 5) * .35; }
  if (fx.scarf) fx.scarf.rotation.z = Math.sin(T * 1.5) * .05;
  const ex = level.exit; if (ex) { if (Math.abs(ex.target - ex.open) > .002) level.shadowDirty = Math.max(level.shadowDirty || 0, 1); ex.open += (ex.target - ex.open) * Math.min(1, dt * 5); ex.leaves[0].position.z = -.55 - ex.open * 1.0; ex.leaves[1].position.z = .55 + ex.open * 1.0; }
}
