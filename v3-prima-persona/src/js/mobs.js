/* ================= creature: materiali, modelli, comportamento ================= */
function buildMobMaterials() {
  Object.assign(MAT, {
    chef: std(0xf0ece2, .85), soot: std(0x1c1917, .95), scarfRed: std(0xa0302a, .85),
    armor: std(0x9aa3ad, .3, .85), plume: std(0xb02a30, .9), shieldWood: std(0x4a3020, .8),
    spider: std(0x2a2430, .55, .15), spiderB: std(0x463650, .5, .2), spiderEye: emis(0xd8ff9a, 0x70ff40, 3), spiderMark: emis(0x9ad070, 0x407a20, .8),
    queen: std(0x3c2252, .45, .25), queenMark: emis(0xb8f080, 0x50c020, 1.1),
    copper: std(0xb8693a, .35, .85), copperDark: std(0x6a3a22, .5, .7), eyeAmber: emis(0xffd890, 0xffa020, 5),
    mouth: emis(0x5a0a10, 0x300000, .6), tongue: std(0xd0606a, .6), teeth: std(0xf0ead8, .5), mimicEye: emis(0xfff0a0, 0xffc020, 6),
    coat: std(0x1a2346, .75), coatDark: std(0x111830, .8)
  });
  MAT.phantom = new THREE.MeshStandardMaterial({ color: lin(0xb8a8ff), emissive: lin(0x6a4ae0), emissiveIntensity: 1.4, transparent: true, opacity: .55, roughness: .4, depthWrite: false });
  MAT.phantomDark = new THREE.MeshStandardMaterial({ color: lin(0x2a2048), emissive: lin(0x20104a), emissiveIntensity: .8, transparent: true, opacity: .78, roughness: .6, depthWrite: false });
  MAT.phantomEye = new THREE.MeshStandardMaterial({ color: lin(0xf0e8ff), emissive: lin(0xb090ff), emissiveIntensity: 5, transparent: true, opacity: 1, roughness: .5 });
}
// ritratti: distanza, altezza dello sguardo, scala
const PORT = { ratto: [4.4, .5, 1.9], bigliettaio: [5.6, 1.3, 1], cuoco: [4.8, 1.05, 1], mimic: [4.2, .45, 1.25], fantasma: [4.8, 1.05, 1], ragno: [4.2, .4, 1.5], regina: [4.6, .55, .62], guardia: [4.6, 1.0, 1], automa: [4.2, .8, 1.05], capotreno: [4.8, .98, .72] };
function makeMobModel(type, wtype, still) {
  if (type === 'ratto') return ratModel();
  if (type === 'bigliettaio') return ghostModel();
  if (type === 'mimic') return mimicModel(still);
  if (type === 'fantasma') return phantomModel();
  if (type === 'ragno' || type === 'regina') return spiderModel(type === 'regina');
  if (type === 'automa') return automatonModel();
  return skeletonModel(type, wtype);
}

/* ---------- modelli ---------- */
function cleaverModel() {
  const g = new THREE.Group();
  bx(g, MAT.woodDark, .045, .05, .17, 0, 0, 0); bx(g, MAT.brass, .055, .055, .02, 0, 0, .09);
  bx(g, MAT.steel, .025, .21, .27, 0, -.065, .24); bx(g, MAT.steelDark, .03, .03, .27, 0, .045, .24);
  return castAll(g);
}
function shovelModel() {
  const g = new THREE.Group();
  bx(g, MAT.woodDark, .045, .045, .95, 0, 0, .3); bx(g, MAT.woodDark, .16, .04, .04, 0, 0, -.18);
  bx(g, MAT.steelDark, .26, .03, .3, 0, 0, .9); bx(g, MAT.soot, .2, .036, .12, 0, .005, .95);
  bx(g, MAT.ember, .08, .04, .06, .04, .022, .93, false);
  return castAll(g);
}
function mimicModel(awake) {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0);
  bx(body, MAT.trunk, 1.0, .5, .66, 0, .25, 0);
  bx(body, MAT.brass, 1.04, .06, .7, 0, .1, 0); bx(body, MAT.brass, 1.04, .06, .7, 0, .42, 0);
  for (const x of [-.36, .36]) bx(body, MAT.woodDark, .08, .5, .7, x, .25, 0);
  bx(body, MAT.mouth, .9, .02, .56, 0, .495, 0, false);
  for (let i = 0; i < 7; i++) for (const z of [.27, -.27]) { const t = bx(body, MAT.teeth, .06, .1, .05, -.39 + i * .13, .54, z, false); t.rotation.z = i % 2 ? .15 : -.15; }
  const tongue = pivot(body, 0, .5, -.15); bx(tongue, MAT.tongue, .22, .05, .42, 0, .02, .2, false);
  const lid = pivot(body, 0, .5, -.33);
  bx(lid, MAT.trunk, 1.0, .2, .66, 0, .1, .33); bx(lid, MAT.brass, 1.04, .05, .7, 0, .2, .33); bx(lid, MAT.brass, .14, .16, .06, 0, .02, .67);
  for (const x of [-.36, .36]) bx(lid, MAT.woodDark, .08, .2, .7, x, .1, .33);
  for (let i = 0; i < 7; i++) bx(lid, MAT.teeth, .06, .1, .05, -.39 + i * .13, -.04, .6, false);
  for (const x of [-.2, .2]) bx(lid, MAT.mimicEye, .13, .02, .08, x, -.005, .42, false);
  const legs = [[-.4, .24], [.4, .24], [-.4, -.24], [.4, -.24]].map(([x, z]) => { const p = pivot(body, x, .06, z); bx(p, MAT.woodDark, .1, .22, .1, 0, -.05, 0); p.visible = !!awake; return p; });
  g.userData = { body, lid, tongue, legs };
  if (awake) { lid.rotation.x = -.95; body.position.y = .14; }
  addBlob(g, .9); return castAll(g);
}
function phantomModel() {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0);
  const mG = MAT.phantom.clone(), mD = MAT.phantomDark.clone(), mE = MAT.phantomEye.clone();
  bx(body, mG, .22, .26, .2, 0, .14, -.07, false); bx(body, mG, .34, .3, .28, 0, .38, -.03, false);
  bx(body, mD, .52, .64, .34, 0, .82, 0, false); bx(body, mD, .55, .06, .37, 0, .54, 0, false);
  for (let i = 0; i < 3; i++) bx(body, mE, .045, .045, .02, 0, 1.0 - i * .14, .175, false);
  const head = pivot(body, 0, 1.15, 0);
  bx(head, mG, .34, .34, .32, 0, .17, 0, false);
  for (const x of [-.08, .08]) bx(head, mE, .07, .05, .02, x, .19, .165, false);
  bx(head, mD, .46, .04, .46, 0, .36, 0, false); bx(head, mD, .28, .19, .28, 0, .47, 0, false);
  const armL = pivot(body, -.33, 1.07, 0), armR = pivot(body, .33, 1.07, 0);
  for (const A of [armL, armR]) { bx(A, mD, .14, .5, .16, 0, -.25, 0, false); bx(A, mG, .11, .11, .11, 0, -.55, 0, false); }
  const bag = pivot(armL, 0, -.6, 0); bx(bag, mD, .1, .32, .44, 0, -.2, 0, false); bx(bag, mE, .11, .04, .1, 0, -.02, 0, false);
  const glow = glowSprite(g, 0, .85, 0, 2.4, 0x9a7aff, .3);
  g.userData = { body, head, armL, armR, glow, mats: [[mG, .55], [mD, .78], [mE, 1]] };
  return g;
}
function spiderModel(queen) {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0), mB = queen ? MAT.queen : MAT.spider, mL = MAT.spiderB;
  bx(body, mB, .52, .4, .6, 0, .44, -.36); bx(body, mB, .4, .3, .42, 0, .52, -.42);
  bx(body, queen ? MAT.queenMark : MAT.spiderMark, .14, .02, .32, 0, .675, -.4, false);
  bx(body, mB, .34, .26, .34, 0, .38, .08);
  for (const [x, y] of [[-.06, .47], [.06, .47], [-.12, .43], [.12, .43]]) bx(body, MAT.spiderEye, .05, .05, .02, x, y, .255, false);
  for (const x of [-.06, .06]) bx(body, MAT.bone, .04, .13, .04, x, .28, .25);
  const legs = [];
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
    const hip = pivot(body, sd * .15, .42, .16 - i * .1); hip.rotation.y = sd * (i - 1.5) * .38;
    const up = bx(hip, mL, .36, .05, .05, sd * .15, .1, 0); up.rotation.z = sd * .55;
    const lo = bx(hip, mL, .05, .5, .05, sd * .34, -.12, 0); lo.rotation.z = sd * .35;
    legs.push({ hip, sd, i, ry: hip.rotation.y });
  }
  if (queen) {
    for (let i = 0; i < 5; i++) { const c = bx(body, MAT.queenMark, .04, .16, .04, -.12 + i * .06, .58, .12 - Math.abs(i - 2) * .02, false); c.rotation.z = (i - 2) * .2; }
    for (const x of [-.18, .18]) bx(body, MAT.queenMark, .06, .06, .3, x, .56, -.4, false);
    g.scale.setScalar(2.2);
  }
  g.userData = { body, legs };
  addBlob(g, .9); return castAll(g);
}
function automatonModel() {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0);
  const legL = pivot(body, -.17, .44, 0), legR = pivot(body, .17, .44, 0);
  for (const L of [legL, legR]) { bx(L, MAT.steelDark, .12, .36, .12, 0, -.18, 0); bx(L, MAT.copperDark, .2, .08, .28, 0, -.4, .04); }
  const upper = pivot(body, 0, .44, 0);
  const m = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); upper.add(o); return o; };
  m(wg('autoB', () => new THREE.CylinderGeometry(.34, .3, .62, 10)), MAT.copper, 0, .34, 0);
  for (const y of [.08, .34, .6]) m(wg('autoR', () => new THREE.CylinderGeometry(.355, .355, .05, 10)), MAT.brass, 0, y, 0);
  bx(upper, MAT.black, .3, .18, .04, 0, .36, .33);
  for (let i = 0; i < 3; i++) bx(upper, MAT.brass, .3, .02, .05, 0, .3 + i * .06, .34);
  const head = pivot(upper, 0, .66, 0);
  const dome = new THREE.Mesh(wg('autoH', () => new THREE.SphereGeometry(.25, 10, 5, 0, TAU, 0, Math.PI / 2)), MAT.copper); head.add(dome);
  const eye = bx(head, MAT.eyeAmber, .3, .05, .07, 0, .1, .19, false);
  bx(head, MAT.brass, .05, .16, .05, .1, .28, -.04); bx(head, MAT.brass, .08, .04, .08, .1, .37, -.04);
  const key = pivot(upper, 0, .4, -.34); bx(key, MAT.brass, .05, .05, .2, 0, 0, -.08);
  for (const s of [-1, 1]) bx(key, MAT.brass, .16, .26, .03, s * .1, 0, -.2);
  const armL = pivot(upper, -.4, .54, 0), armR = pivot(upper, .4, .54, 0);
  for (const A of [armL, armR]) { bx(A, MAT.copperDark, .1, .42, .1, 0, -.21, 0); bx(A, MAT.steel, .05, .17, .1, -.04, -.48, .03); bx(A, MAT.steel, .05, .17, .1, .04, -.48, .03); }
  g.userData = { body, upper, legL, legR, armL, armR, head, key, eye };
  addBlob(g, .8); return castAll(g);
}
function merchantModel() {
  const g = new THREE.Group(), b = new Builder();
  b.box(MAT.wood, 0, .42, 0, 2.0, .55, 1.0).box(MAT.woodDark, 0, .97, 0, 2.15, .08, 1.1).box(MAT.brass, 0, .4, .51, 2.0, .05, .03);
  for (const [x, z] of [[-1, -.5], [1, -.5], [-1, .5], [1, .5]]) b.box(MAT.brass, x, 1.0, z, .06, 1.3, .06);
  for (let i = 0; i < 6; i++) b.box(i % 2 ? MAT.cream : MAT.red, -1.0 + .175 + i * .35, 2.3, 0, .35, .07, 1.3);
  b.box(MAT.brass, 0, 2.37, 0, 2.2, .04, 1.36);
  for (let i = 0; i < 6; i++) b.box(i % 2 ? MAT.cream : MAT.red, -1.0 + .175 + i * .35, 2.08, .66, .35, .24, .03);
  b.build(g);
  for (const x of [-.65, .65]) { const w = new THREE.Mesh(wg('cartW', () => new THREE.CylinderGeometry(.38, .38, .08, 12).rotateX(Math.PI / 2)), MAT.woodDark); w.position.set(x, .38, .56); g.add(w); }
  const items = [['spada', -.6], ['balestra', 0], ['lanterna', .6]];
  for (const [t, x] of items) { const w = weaponModel(t, 1); w.scale.setScalar(.7); w.rotation.set(-Math.PI / 2 + .25, .5, 0); w.position.set(x, 1.08, .1); g.add(w); }
  const bot = robotModel(); bot.position.set(0, 0, -.9); bot.scale.setScalar(1.25); g.add(bot); bot.children.filter(c => c.isLight).forEach(c => bot.remove(c)); // niente luci in più: cambierebbero gli shader a metà partita
  bx(bot, MAT.black, .34, .26, .34, 0, 1.2, -.04); bx(bot, MAT.black, .5, .03, .5, 0, 1.08, -.04); bx(bot, MAT.red, .35, .05, .35, 0, 1.11, -.04);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .45), new THREE.MeshStandardMaterial({ map: signTexture('BOTTEGA', 'SI ACCETTANO MONETE'), roughness: .5, emissive: lin(0x3a2a10), emissiveIntensity: .7 }));
  sign.position.set(0, 1.55, .54); sign.userData.own = true; g.add(sign);
  glowSprite(g, 0, 1.9, .3, 2.6, 0xffb060, .35);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ---------- comportamenti ---------- */
// mischia: rincorre, carica il colpo (avviso), affonda, recupera
function meleeAI(e, dt, c, o) {
  if (e.state === 'windup') { e.vx *= .8; e.vz *= .8; e.face = turnTo(e.face, c.toP, 4 * dt); e.st -= dt; if (e.st <= 0) { e.state = 'strike'; e.st = .16; e.vx = Math.sin(e.face) * o.lunge; e.vz = Math.cos(e.face) * o.lunge; e.hitDone = false; sfx('swing'); } }
  else if (e.state === 'strike') { e.st -= dt; e.vx *= .85; e.vz *= .85; if (!e.hitDone && c.dist < o.range - .1 && Math.abs(angDiff(e.face, c.toP)) < 1.2 && p.y < 1.6) { e.hitDone = true; hurtPlayer(o.dmg, e); } if (e.st <= 0) { e.state = 'recover'; e.st = o.recover || .5; } }
  else if (e.state === 'recover') { e.vx *= .85; e.vz *= .85; e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = rnd(.8, 1.3); } }
  else {
    e.state = 'walk';
    steer(e, p.x, p.z, c.dist > o.range * .76 ? e.spd : 0, c.opt, dt); e.face = turnTo(e.face, c.toP, 6 * dt);
    if (c.dist < o.range && e.cd <= 0 && p.y < 1.6 && attackers(e) < PACE.slots) { e.state = 'windup'; e.st = o.windup * c.tele; sfx('tick'); }
  }
}
const inMelee = e => e.state === 'windup' || e.state === 'strike' || e.state === 'recover';
// quanti altri nemici stanno già caricando o sferrando un colpo: nei primi vagoni si attacca uno alla volta
const attackers = e => enemies.filter(o => o !== e && !o.dead && (o.state === 'windup' || o.state === 'strike')).length;
// lancio a parabola verso dove sarà il giocatore
function lob(e, kind, dmg) {
  const hx = e.x + Math.sin(e.face) * .4, hz = e.z + Math.cos(e.face) * .4, hy = e.y + 1.7;
  const lead = .25 * (1 - PACE.k), tx = p.x + p.vx * lead, tz = p.z + p.vz * lead, dx = tx - hx, dz = tz - hz, d = Math.hypot(dx, dz), t = clamp(d / 10, .45, 1.25) / PACE.proj, g = 14;
  spawnProj({ from: 'e', isProj: true, x: hx, y: hy, z: hz, vx: dx / t, vz: dz / t, vy: (p.y + .9 - hy + .5 * g * t * t) / t, g, dmg, kind, life: 3 });
}
// tira da media distanza: si allontana se sei vicino, si avvicina se sei lontano, altrimenti gira di lato
function throwerAI(e, dt, c, kind, dmg) {
  e.face = turnTo(e.face, c.toP, 7 * dt);
  if (e.state === 'throw') { e.vx *= .8; e.vz *= .8; e.st -= dt; if (e.st <= 0) { lob(e, kind, dmg); sfx('swing'); e.state = 'walk'; e.cd = rnd(2.2, 3.2); } return; }
  e.state = 'walk';
  let tx = e.x, tz = e.z;
  if (c.dist < 4.5) { tx = e.x - c.dx; tz = e.z - c.dz; } else if (c.dist > 9) { tx = p.x; tz = p.z; } else { tx = e.x + Math.cos(c.toP) * 2 * e.side; tz = e.z - Math.sin(c.toP) * 2 * e.side; }
  steer(e, tx, tz, c.dist < 4.5 || c.dist > 9 ? e.spd : e.spd * .45, c.opt, dt);
  if (e.cd <= 0 && c.dist < 14) { e.state = 'throw'; e.st = e.st0 = .6 * c.tele; }
}
function ticketFan(e, n, step, sp) {
  const a0 = Math.atan2(p.x - e.x, p.z - e.z), y = e.y + 1.3;
  for (let i = 0; i < n; i++) { const da = (i - (n - 1) / 2) * step; spawnProj({ from: 'e', isProj: true, x: e.x, y, z: e.z, vx: Math.sin(a0 + da) * sp, vz: Math.cos(a0 + da) * sp, vy: (p.y + 1.1 - y) * sp / Math.max(2, Math.hypot(p.x - e.x, p.z - e.z)), dmg: 1, kind: 'ticket', life: 3.2 }); }
  sfx('shoot');
}
function minions(e) { return enemies.filter(m => !m.dead && m.minion).length; }
function summon(e, types) {
  for (let i = 0; i < types.length; i++) {
    if (minions(e) >= 3) break;
    const a = e.face + (i ? 1 : -1) * rnd(.9, 1.6), d = rnd(1.8, 2.6);
    const x = clamp(e.x + Math.sin(a) * d, level.x0 + 1.2, level.x1 - 1.2), z = clamp(e.z + Math.cos(a) * d, level.z0 + 1.2, level.z1 - 1.2);
    const m = spawnEnemy(types[i], Math.max(1, e.lvl - 1), x, z, 'rise'); m.minion = true;
  }
}
const AI = {
  ratto(e, dt, c) {
    // morde e scappa: dopo il morso si allontana per un attimo, poi torna alla carica
    if (e.state === 'flee') { e.st -= dt; steer(e, e.x - c.dx, e.z - c.dz, e.spd, c.opt, dt); e.face = turnTo(e.face, Math.atan2(e.vx, e.vz), 10 * dt); if (e.st <= 0) e.state = 'walk'; return; }
    e.state = 'walk';
    steer(e, p.x, p.z, e.spd, c.opt, dt); e.face = turnTo(e.face, Math.atan2(e.vx, e.vz), 10 * dt);
    if (c.dist < e.r + p.r + .15 && e.bite <= 0 && p.y < .8) { e.bite = .9; hurtPlayer(1, e); if (e.stun <= 0) { e.state = 'flee'; e.st = rnd(.7, 1.1) * c.tele; } }
  },
  scheletro(e, dt, c) { meleeAI(e, dt, c, { range: 2.1, windup: .55, lunge: 6.5, dmg: 1 }); },
  arciere(e, dt, c) {
    e.face = turnTo(e.face, c.toP, 7 * dt);
    const xb = e.weapon === 'balestra';
    if (e.state === 'draw') { e.vx *= .8; e.vz *= .8; e.st -= dt; if (e.st <= 0) { const s = xb ? 13 : 9.5, y = 1.4; spawnProj({ from: 'e', isProj: true, x: e.x + Math.sin(c.toP) * .6, y, z: e.z + Math.cos(c.toP) * .6, vx: Math.sin(c.toP) * s, vz: Math.cos(c.toP) * s, vy: (p.y + 1.2 - y) * s / Math.max(2, c.dist), dmg: 1, kind: xb ? 'quarrel' : 'arrow', life: 3 }); sfx('shoot'); e.state = 'walk'; e.cd = xb ? rnd(2.2, 2.9) : rnd(1.5, 2.2); } return; }
    e.state = 'walk';
    let tx = e.x, tz = e.z;
    if (c.dist < 5.5) { tx = e.x - c.dx; tz = e.z - c.dz; } else if (c.dist > 9.5) { tx = p.x; tz = p.z; } else { tx = e.x + Math.cos(c.toP) * 2 * e.side; tz = e.z - Math.sin(c.toP) * 2 * e.side; }
    steer(e, tx, tz, c.dist < 5.5 || c.dist > 9.5 ? e.spd : e.spd * .4, c.opt, dt);
    if (e.cd <= 0 && c.dist < 15) { e.state = 'draw'; e.st = (xb ? .9 : .75) * c.tele; }
  },
  bigliettaio(e, dt, c) {
    e.face = turnTo(e.face, c.toP, 5 * dt);
    // dopo lo scatto resta stordito e basso per un attimo: è il momento di colpirlo
    if (e.state === 'tired') { e.vx *= .9; e.vz *= .9; e.st -= dt; if (Math.random() < .25) Sparks.emit(e.x, e.y + 2.1, e.z, 1, 0x62d4c7, .5, .8, .5, 0); if (e.st <= 0) e.state = 'walk'; return; }
    // prima dello scatto si ferma e lo annuncia
    if (e.state === 'aim') { e.vx *= .85; e.vz *= .85; e.st -= dt; if (e.st <= 0) { e.state = 'dash'; e.dashT = .55; e.dashA = c.toP; sfx('ghost'); } return; }
    if (e.state === 'dash') {
      e.dashT -= dt; e.vx = Math.sin(e.dashA) * 11; e.vz = Math.cos(e.dashA) * 11; if (Math.random() < .5) Sparks.emit(e.x, 1.4, e.z, 2, 0x62d4c7, .5, .5, .5, 0);
      // ferisce solo passando attraverso chi gioca
      if (c.dist < e.r + p.r + .2 && e.bite <= 0) { e.bite = 1; hurtPlayer(e.lvl > 2 ? 2 : 1, e); }
      if (e.dashT <= 0) { e.state = 'tired'; e.st = 1.2 * c.tele; UI.dmg(e.x, e.y + 2.9, e.z, 'STORDITO', '#62d4c7'); }
      return;
    }
    e.state = 'walk'; e.dashT = 0;
    const want = 5.5, orbit = T * .6;
    const tx = p.x - Math.sin(c.toP + Math.sin(orbit) * .8) * want, tz = p.z - Math.cos(c.toP + Math.sin(orbit) * .8) * want;
    const k = Math.min(1, dt * 2); e.vx += ((tx - e.x) * 1.1 - e.vx) * k; e.vz += ((tz - e.z) * 1.1 - e.vz) * k;
    const sp = Math.hypot(e.vx, e.vz); if (sp > 4) { e.vx *= 4 / sp; e.vz *= 4 / sp; }
    e.tickCd -= dt * c.k; e.dashCd -= dt * c.k;
    if (e.tickCd <= 0 && e.fadeIn <= 0) { e.tickCd = e.lvl > 2 ? 1.8 : 2.2; ticketFan(e, e.lvl > 2 ? 5 : 3, .32, 7.5); }
    if (e.dashCd <= 0 && c.dist < 10 && e.fadeIn <= 0) { e.dashCd = rnd(4.2, 5.6); e.state = 'aim'; e.st = .5 * c.tele; UI.dmg(e.x, 3.4, e.z, 'BIGLIETTO!', '#62d4c7'); sfx('tick'); }
  },
  cuoco(e, dt, c) { if (inMelee(e) || c.dist < 2.0) meleeAI(e, dt, c, { range: 2.0, windup: .5, lunge: 5, dmg: 1 }); else throwerAI(e, dt, c, 'cleaver', 1); },
  fuochista(e, dt, c) { if (inMelee(e) || c.dist < 2.1) meleeAI(e, dt, c, { range: 2.2, windup: .55, lunge: 5.5, dmg: 1 }); else throwerAI(e, dt, c, 'coal', 1); },
  guardia(e, dt, c) { meleeAI(e, dt, c, { range: 2.4, windup: .72, lunge: 7.5, dmg: 1, recover: .85 }); },
  mimic(e, dt, c) {
    const u = e.model.userData;
    if (e.state === 'sleep') {
      e.vx = e.vz = 0; e.wakeT -= dt;
      if (c.dist < 3.2 || e.hp < e.max || e.wakeT <= 0) { e.state = 'wake'; e.st = .55; sfx('open'); shake = Math.max(shake, .25); UI.dmg(e.x, 1.5, e.z, 'È UN BAULE MIMETICO!', '#ffcf5a'); u.legs.forEach(l => l.visible = true); }
      return;
    }
    e.face = turnTo(e.face, c.toP, 9 * dt);
    if (e.state === 'wake') { e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = .15; } return; }
    if (e.air) return;
    // dopo ogni salto resta a bocca aperta per un attimo: è il momento di colpirlo
    if (e.landed) { e.landed = false; e.vx *= .15; e.vz *= .15; sfx('land'); Chunks.emit(e.x, .1, e.z, 4, [0x5a5048, 0x3a342e], 2, .07, .5); if (c.dist < e.r + p.r + .35 && e.bite <= 0 && p.y < 1) { e.bite = .9; hurtPlayer(1, e); } if (e.stun <= 0) { e.state = 'rest'; e.st = rnd(.45, .7) * c.tele; } }
    const k = Math.pow(.02, dt); e.vx *= k; e.vz *= k;
    if (e.state === 'rest') { e.st -= dt; if (e.st <= 0) e.state = 'walk'; return; }
    if (e.cd <= 0) { const s = Math.min(7.5, c.dist * 1.7 + 1); e.vy = 6; e.air = true; e.vx = Math.sin(c.toP) * s; e.vz = Math.cos(c.toP) * s; e.cd = rnd(.3, .55); }
  },
  fantasma(e, dt, c) {
    e.face = turnTo(e.face, c.toP, 5 * dt);
    if (e.state === 'fade') { e.vx *= .9; e.vz *= .9; e.st -= dt; e.vis = Math.max(0, e.st / .45); if (e.st <= 0) { e.state = 'hidden'; e.st = rnd(.6, 1.0); } return; }
    if (e.state === 'hidden') {
      e.vis = 0; e.vx = e.vz = 0; e.st -= dt;
      if (e.st <= 0) {
        const a = LOOK.yaw + pick([-1, 1]) * rnd(1.0, 2.2), d = rnd(2.8, 3.8);
        e.x = clamp(p.x + Math.sin(a) * d, level.x0 + 1, level.x1 - 1); e.z = clamp(p.z + Math.cos(a) * d, level.z0 + 1, level.z1 - 1);
        e.state = 'appear'; e.st = e.st0 = .55 * c.tele; Sparks.emit(e.x, 1.2, e.z, 16, 0xb8a0ff, 2, 2, .6, 0); sfx('ghost');
      }
      return;
    }
    if (e.state === 'appear') { e.vx = e.vz = 0; e.st -= dt; e.vis = 1 - Math.max(0, e.st) / e.st0; if (e.st <= 0) { e.state = 'lunge'; e.st = .5; e.dashA = c.toP; } return; }
    if (e.state === 'lunge') {
      e.vis = 1; e.st -= dt; e.vx = Math.sin(e.dashA) * 8; e.vz = Math.cos(e.dashA) * 8;
      if (c.dist < e.r + p.r + .3 && e.bite <= 0 && p.y < 1.9) { e.bite = 1; hurtPlayer(1, e); }
      if (e.st <= 0) { e.state = 'drift'; e.blinkCd = rnd(3.5, 5.5); }
      return;
    }
    e.state = 'drift'; e.vis = Math.min(1, (e.vis || 0) + dt * 2);
    const side = Math.sin(e.phase * 1.3) * 1.6, tx = p.x + Math.cos(c.toP) * side, tz = p.z - Math.sin(c.toP) * side, a = Math.atan2(tx - e.x, tz - e.z), k = Math.min(1, dt * 2.5);
    e.vx += (Math.sin(a) * e.spd - e.vx) * k; e.vz += (Math.cos(a) * e.spd - e.vz) * k;
    if (c.dist < e.r + p.r + .25 && e.bite <= 0 && p.y < 1.9) { e.bite = 1; hurtPlayer(1, e); }
    e.blinkCd -= dt * c.k; if (e.blinkCd <= 0 && c.dist < 9 && e.fadeIn <= 0) { e.state = 'fade'; e.st = .45; sfx('ghost'); }
  },
  ragno(e, dt, c) {
    if (e.air) return;
    // atterrando addosso morde; come i ratti, dopo il morso scappa per un attimo
    if (e.landed) {
      e.landed = false; e.vx *= .2; e.vz *= .2;
      const bit = c.dist < e.r + p.r + .3 && e.bite <= 0 && p.y < .8; if (bit) { e.bite = .9; hurtPlayer(1, e); }
      e.state = bit && e.stun <= 0 ? 'flee' : 'recover'; e.st = bit ? rnd(.7, 1.0) * c.tele : .45;
    }
    if (e.state === 'flee') { e.st -= dt; steer(e, e.x - c.dx, e.z - c.dz, e.spd, c.opt, dt); e.face = turnTo(e.face, Math.atan2(e.vx, e.vz), 10 * dt); if (e.st <= 0) e.state = 'walk'; return; }
    if (e.state === 'crouch') { e.vx *= .7; e.vz *= .7; e.face = turnTo(e.face, c.toP, 8 * dt); e.st -= dt; if (e.st <= 0) { const s = Math.min(10, c.dist * 2.1); e.vy = 5.2; e.air = true; e.vx = Math.sin(c.toP) * s; e.vz = Math.cos(c.toP) * s; sfx('jump'); e.state = 'leap'; } return; }
    if (e.state === 'recover') { e.vx *= .85; e.vz *= .85; e.st -= dt; if (e.st <= 0) e.state = 'walk'; return; }
    e.state = 'walk';
    const off = Math.sin(e.phase * 2.6) * 1.4, tx = p.x + Math.cos(c.toP) * off, tz = p.z - Math.sin(c.toP) * off;
    steer(e, tx, tz, e.spd, c.opt, dt); e.face = turnTo(e.face, Math.atan2(e.vx, e.vz), 10 * dt);
    if (c.dist < 5 && c.dist > 1.8 && e.cd <= 0) { e.state = 'crouch'; e.st = .38 * c.tele; e.cd = rnd(1.6, 2.4); sfx('tick'); }
    if (c.dist < e.r + p.r + .2 && e.bite <= 0 && p.y < .8) { e.bite = .9; hurtPlayer(1, e); if (e.stun <= 0) { e.state = 'flee'; e.st = rnd(.7, 1.0) * c.tele; } }
  },
  regina(e, dt, c) {
    const ph2 = e.hp < e.max * .5;
    if (!e.tm) e.tm = { web: 2.5, brood: 7, leap: 6 };
    if (e.air) return;
    if (e.landed) { e.landed = false; e.state = 'recover'; e.st = .8; e.vx = e.vz = 0; shake = Math.max(shake, .7); sfx('boom'); shockwave(e.x, e.z, 9, 11, 1, 0x9aff70); Chunks.emit(e.x, .1, e.z, 16, [0x3a342e, 0x5a5048, 0x9aff70], 4, .12, .8); }
    e.tm.web -= dt * c.k; e.tm.brood -= dt * c.k; e.tm.leap -= dt * c.k;
    if (e.state === 'spit') { e.vx *= .8; e.vz *= .8; e.face = turnTo(e.face, c.toP, 5 * dt); e.st -= dt; if (e.st <= 0) { const n = ph2 ? 3 : 1, a0 = c.toP, y = 1.2; for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .28; spawnProj({ from: 'e', isProj: true, x: e.x + Math.sin(a) * 1.2, y, z: e.z + Math.cos(a) * 1.2, vx: Math.sin(a) * 9, vz: Math.cos(a) * 9, vy: (p.y + 1 - y) * 9 / Math.max(2, c.dist), dmg: 1, kind: 'web', life: 3 }); } sfx('shoot'); e.state = 'walk'; } return; }
    if (e.state === 'brood') { e.vx *= .8; e.vz *= .8; e.st -= dt; if (e.st <= 0) { summon(e, ph2 ? ['ragno', 'ragno'] : ['ragno']); sfx('ghost'); e.state = 'walk'; } return; }
    if (e.state === 'crouch') { e.vx *= .7; e.vz *= .7; e.face = turnTo(e.face, c.toP, 6 * dt); e.st -= dt; if (e.st <= 0) { const s = Math.min(11, c.dist * 1.25); e.vy = 8.5; e.air = true; e.vx = Math.sin(c.toP) * s; e.vz = Math.cos(c.toP) * s; sfx('jump'); e.state = 'leap'; } return; }
    if (e.state === 'recover') { e.vx *= .8; e.vz *= .8; e.st -= dt; if (e.st <= 0) e.state = 'walk'; return; }
    e.state = 'walk';
    steer(e, p.x, p.z, c.dist > 4 ? e.spd : 0, c.opt, dt); e.face = turnTo(e.face, c.toP, 4 * dt);
    if (e.tm.leap <= 0 && c.dist > 3) { e.tm.leap = ph2 ? rnd(5, 6.5) : rnd(7, 9); e.state = 'crouch'; e.st = .75 * c.tele; UI.dmg(e.x, 3.2, e.z, 'SALTA!', '#9aff70'); }
    else if (e.tm.brood <= 0) { e.tm.brood = ph2 ? 8 : 11; e.state = 'brood'; e.st = .8 * c.tele; }
    else if (e.tm.web <= 0 && c.dist < 16) { e.tm.web = ph2 ? 2.2 : 3.2; e.state = 'spit'; e.st = .5 * c.tele; }
    if (c.dist < e.r + p.r + .2 && e.bite <= 0 && p.y < 1.2) { e.bite = 1; hurtPlayer(1, e); }
  },
  automa(e, dt, c) {
    if (e.state === 'wind') { e.vx *= .8; e.vz *= .8; e.face = turnTo(e.face, c.toP, 5 * dt); e.st -= dt; if (e.st <= 0) { e.state = 'charge'; e.st = 1.1; e.dashA = e.face; sfx('flip'); } return; }
    if (e.state === 'charge') {
      e.st -= dt; e.vx = Math.sin(e.dashA) * 10; e.vz = Math.cos(e.dashA) * 10;
      if (Math.random() < .5) Sparks.emit(e.x, .1, e.z, 2, 0xffc070, 1.5, 1, .3, 2);
      if (c.dist < e.r + p.r + .25 && e.bite <= 0 && p.y < 1.2) { e.bite = 1; hurtPlayer(1, e); e.state = 'recover'; e.st = .6; }
      else if (e.blocked && e.st < 1.02) { e.stun = 1.8; e.state = 'stun'; e.vx = -e.vx * .25; e.vz = -e.vz * .25; sfx('hit'); shake = Math.max(shake, .3); Sparks.emit(e.x, 1, e.z, 26, 0xffc070, 3, 3, .5, 4); UI.dmg(e.x, 2.3, e.z, 'STORDITO', '#ffc070'); }
      else if (e.st <= 0) { e.state = 'recover'; e.st = .5; }
      return;
    }
    if (e.state === 'recover') { e.vx *= .85; e.vz *= .85; e.st -= dt; if (e.st <= 0) e.state = 'walk'; return; }
    e.state = 'walk';
    steer(e, p.x, p.z, c.dist > 5 ? e.spd : e.spd * .3, c.opt, dt); e.face = turnTo(e.face, c.toP, 4 * dt);
    if (c.dist < 10 && c.dist > 2.5 && e.cd <= 0) { e.state = 'wind'; e.st = .9 * c.tele; e.cd = rnd(2.6, 3.6); sfx('tick'); }
    if (c.dist < e.r + p.r + .2 && e.bite <= 0 && p.y < 1) { e.bite = 1; hurtPlayer(1, e); }
  },
  capotreno(e, dt, c) {
    const f = e.hp / e.max, ph = f > .66 ? 1 : f > .33 ? 2 : 3;
    if (!e.tm) e.tm = { tk: 2.5, sum: 8, stomp: 4, dash: 4 };
    if (ph !== e.ph) { if (e.ph) { UI.banner('IL CAPOTRENO', ph === 2 ? 'FISCHIA LA PARTENZA' : 'A TUTTO VAPORE'); shake = .7; sfx('whistle'); e.state = 'roar'; e.st = 1.0; } e.ph = ph; }
    const tm = e.tm; tm.tk -= dt * c.k; tm.sum -= dt * c.k; tm.stomp -= dt * c.k; tm.dash -= dt * c.k;
    if (e.state === 'roar') { e.vx *= .8; e.vz *= .8; e.st -= dt; if (Math.random() < .5) Puffs.emit(e.x, 3.2, e.z, 1, .9); if (e.st <= 0) e.state = 'walk'; return; }
    if (e.state === 'cast') { e.vx *= .8; e.vz *= .8; e.face = turnTo(e.face, c.toP, 5 * dt); e.st -= dt; if (e.st <= 0) { ticketFan(e, ph === 1 ? 3 : 5, ph === 3 ? .24 : .3, 8.5); if (ph === 3 && !e.second) { e.second = true; e.st = .4; return; } e.second = false; e.state = 'walk'; } return; }
    if (e.state === 'stomp') { e.vx *= .7; e.vz *= .7; e.st -= dt; if (e.st <= 0) { shockwave(e.x, e.z, 8, 15, 1, 0xffb060); shake = .7; sfx('boom'); Puffs.emit(e.x, .4, e.z, 8, 1.4); e.state = 'recover'; e.st = .6; } return; }
    if (e.state === 'whistle') { e.vx *= .8; e.vz *= .8; e.st -= dt; if (e.st <= 0) { summon(e, ph === 1 ? ['ratto', 'ratto'] : ph === 2 ? ['scheletro', 'ratto'] : ['fuochista', 'scheletro']); e.state = 'walk'; } return; }
    if (e.state === 'aim') { e.vx *= .85; e.vz *= .85; e.face = turnTo(e.face, c.toP, 5 * dt); e.st -= dt; if (e.st <= 0) { e.state = 'dash'; e.st = .6; e.dashA = c.toP; sfx('ghost'); } return; }
    if (e.state === 'dash') { e.st -= dt; e.vx = Math.sin(e.dashA) * 12; e.vz = Math.cos(e.dashA) * 12; if (Math.random() < .6) Puffs.emit(e.x, 1, e.z, 1, .8); if (c.dist < e.r + p.r + .3 && e.bite <= 0) { e.bite = 1; hurtPlayer(2, e); } if (e.st <= 0 || (e.blocked && e.st < .5)) { e.state = 'recover'; e.st = .5; } return; }
    if (inMelee(e)) { meleeAI(e, dt, c, { range: 2.9, windup: ph === 3 ? .45 : .6, lunge: 7, dmg: 2, recover: .6 }); return; }
    e.state = 'walk';
    steer(e, p.x, p.z, c.dist > 2.6 ? e.spd * (ph === 3 ? 1.3 : 1) : 0, c.opt, dt); e.face = turnTo(e.face, c.toP, 5 * dt);
    if (c.dist < 2.9 && e.cd <= 0) { e.state = 'windup'; e.st = (ph === 3 ? .45 : .6) * c.tele; sfx('tick'); }
    else if (ph >= 2 && tm.stomp <= 0) { tm.stomp = ph === 3 ? 4.5 : 6.5; e.state = 'stomp'; e.st = .8 * c.tele; UI.dmg(e.x, 4.4, e.z, 'SALTA!', '#ffb060'); }
    else if (ph === 3 && tm.dash <= 0 && c.dist > 4) { tm.dash = 4; e.state = 'aim'; e.st = .5 * c.tele; UI.dmg(e.x, 4.4, e.z, 'BIGLIETTO!', '#62d4c7'); sfx('tick'); }
    else if (tm.sum <= 0) { tm.sum = ph === 3 ? 10 : 13; e.state = 'whistle'; e.st = .9; sfx('whistle'); }
    else if (tm.tk <= 0 && c.dist > 2.6) { tm.tk = ph === 1 ? 2.6 : 2.0; e.state = 'cast'; e.st = .45 * c.tele; }
  }
};

/* ---------- pose ---------- */
function poseHumanoid(e, u, spd) {
  const ph = e.phase * (4 + spd * 1.5), k = Math.min(1, spd / 2.5);
  u.legL.rotation.x = Math.sin(ph) * .7 * k; u.legR.rotation.x = -Math.sin(ph) * .7 * k; u.armL.rotation.x = -Math.sin(ph) * .4 * k; u.armR.rotation.x = Math.sin(ph) * .4 * k - .3;
  u.armL.rotation.z = 0; u.upper.rotation.set(0, 0, 0); u.head.rotation.set(0, 0, e.stun > 0 ? Math.sin(T * 12) * .25 : 0);
  const s = e.state;
  if (s === 'windup') { u.armR.rotation.x = -2.7; u.upper.rotation.y = .6; }
  else if (s === 'strike') { u.armR.rotation.x = -1.3; u.upper.rotation.y = -.9; }
  else if (s === 'draw') { u.armL.rotation.x = -1.55; u.armR.rotation.x = -1.4; u.upper.rotation.y = -.25; }
  else if (s === 'throw') { const t = 1 - e.st / (e.st0 || .6); u.armR.rotation.x = -2.9 + t * .4; u.upper.rotation.y = .5; u.upper.rotation.x = -.15; }
  else if (s === 'cast') { u.armL.rotation.x = -2.2; u.armR.rotation.x = -2.0; u.upper.rotation.x = -.15; }
  else if (s === 'stomp') { u.armL.rotation.x = -3.0 + Math.sin(T * 30) * .05; u.upper.rotation.x = -.2; }
  else if (s === 'whistle') { u.armR.rotation.set(-2.5, 0, .4); u.head.rotation.x = -.3; }
  else if (s === 'roar') { u.head.rotation.x = -.5; u.armL.rotation.set(-.6, 0, -.6); u.armR.rotation.set(-.6, 0, .6); u.upper.rotation.x = -.2; }
  else if (s === 'dash') { u.upper.rotation.x = .4; u.armL.rotation.x = .6; u.armR.rotation.x = .6; }
  else if (s === 'aim') { u.armR.rotation.x = -2.4; u.upper.rotation.x = -.15; }
  if (u.weapon) u.weapon.rotation.x = u.wtype === 'arco' || u.wtype === 'balestra' ? -1.45 : -.6;
  if (u.shield) { const down = e.stun > 0 || s === 'strike' || s === 'recover'; u.shield.rotation.x += ((down ? 1.0 : 0) - u.shield.rotation.x) * .2; u.shield.position.y += ((down ? .02 : .3) - u.shield.position.y) * .2; }
}
const POSER = {
  ratto(e, u, spd) { u.body.position.y = Math.abs(Math.sin(e.phase * 18)) * .05 * Math.min(1, spd / 2); u.tail.rotation.y = Math.sin(e.phase * 10) * .5; u.legs.forEach((l, i) => l.rotation.x = Math.sin(e.phase * 20 + (i % 2) * Math.PI) * .7 * Math.min(1, spd / 2)); },
  bigliettaio(e, u) {
    const tired = e.state === 'tired', aim = e.state === 'aim';
    u.armL.rotation.x = tired ? .3 : Math.sin(T * 2) * .3 - .3; u.armR.rotation.x = aim ? -2.4 : tired ? .3 : e.tickCd < .4 ? -1.6 : -.4 + Math.sin(T * 2 + 1) * .2;
    u.body.rotation.x += ((e.state === 'dash' ? .5 : tired ? -.35 : aim ? -.15 : 0) - u.body.rotation.x) * .2; u.body.rotation.z = tired ? Math.sin(T * 5) * .12 : 0;
    u.light.intensity = tired ? .9 + Math.sin(T * 9) * .2 : 2.2 + Math.sin(T * 9) * .3;
    e.model.traverse(o => { if (o.isMesh && o.material.transparent) o.material.opacity = (o.material === MAT.ghost ? .62 : .85) * (e.fadeIn > 0 ? 1 - e.fadeIn / 1.2 : 1); });
  },
  mimic(e, u, spd) {
    const awake = e.state !== 'sleep';
    u.body.position.y += ((awake ? .14 : 0) - u.body.position.y) * .25;
    const open = !awake ? 0 : e.state === 'wake' ? -1.2 * (1 - e.st / .55) : e.air ? -1.15 : -(.35 + .45 * Math.abs(Math.sin(T * 9)));
    u.lid.rotation.x += (open - u.lid.rotation.x) * .4;
    u.tongue.rotation.x = awake ? -.3 - Math.sin(T * 7) * .25 : 0;
    u.legs.forEach((l, i) => l.rotation.x = e.air ? -.6 : Math.sin(T * 14 + i * 1.7) * .4 * Math.min(1, spd / 2));
    u.body.rotation.z = e.state === 'wake' ? Math.sin(T * 40) * .06 : 0;
  },
  fantasma(e, u, spd) {
    const v = e.vis === undefined ? 1 : e.vis, fl = e.flash > 0 ? 3 : 1, fade = e.fadeIn > 0 ? 1 - e.fadeIn / 1.2 : 1;
    for (const [m, op] of u.mats) { m.opacity = op * v * fade; m.emissiveIntensity = (m === u.mats[2][0] ? 5 : 1.2) * fl; }
    u.glow.material.opacity = .3 * v * fade;
    u.body.rotation.x = e.state === 'lunge' ? .45 : Math.sin(T * 1.7 + e.phase) * .05;
    u.armR.rotation.x = e.state === 'lunge' ? -1.5 : -.2 + Math.sin(T * 2 + e.phase) * .2; u.armL.rotation.x = Math.sin(T * 2.3 + e.phase) * .15;
    u.head.rotation.z = Math.sin(T * 1.3 + e.phase) * .12;
  },
  ragno(e, u, spd) {
    const k = Math.min(1, spd / 3), crouch = e.state === 'crouch';
    u.body.position.y = crouch ? -.12 : e.state === 'brood' ? Math.sin(T * 20) * .03 : Math.abs(Math.sin(e.phase * 16)) * .03 * k;
    u.body.rotation.x = crouch ? .18 : e.air ? -.2 : 0;
    for (const L of u.legs) { const ph = e.phase * 16 + L.i * Math.PI / 2 + (L.sd > 0 ? Math.PI : 0); L.hip.rotation.z = (e.air ? -L.sd * .35 : crouch ? L.sd * .25 : 0) + Math.max(0, Math.sin(ph)) * .35 * k * L.sd; L.hip.rotation.y = L.ry + Math.cos(ph) * .18 * k; }
  },
  automa(e, u, spd, dt) {
    const ph = e.phase * (5 + spd), k = Math.min(1, spd / 2.5), ch = e.state === 'charge', wd = e.state === 'wind';
    u.legL.rotation.x = Math.sin(ph) * .6 * k; u.legR.rotation.x = -Math.sin(ph) * .6 * k;
    u.armL.rotation.x = ch ? -1.4 : -Math.sin(ph) * .4 * k; u.armR.rotation.x = ch ? -1.4 : Math.sin(ph) * .4 * k;
    u.upper.rotation.x = ch ? .35 : wd ? -.1 : 0;
    u.key.rotation.z += (wd ? 26 : ch ? 12 : 3) * dt;
    u.head.rotation.z = e.stun > 0 ? Math.sin(T * 14) * .3 : 0;
    const em = wd || ch ? MAT.eyeRed : MAT.eyeAmber; if (u.eye.material !== em && u.eye.material !== MAT.flash) u.eye.material = em;
    if (e.stun > 0 && Math.random() < .15) Sparks.emit(e.x, 1.4, e.z, 3, 0xffc070, 1.5, 1.5, .3, 2);
  }
};
POSER.regina = POSER.ragno;
