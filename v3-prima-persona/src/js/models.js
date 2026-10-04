/* ================= dati di gioco ================= */
const CLASSES = [
  { id: 'cavaliere', name: 'Cavaliere', hp: 6, speed: 5.3, weapon: 'spada', perk: 'parry', desc: 'Più vita. La finestra di parry è più ampia.' },
  { id: 'ranger', name: 'Ranger', hp: 4, speed: 6.3, weapon: 'arco', perk: 'slide', desc: 'Più veloce. Scivolata più lunga e potente.' },
  { id: 'mago', name: 'Mago', hp: 4, speed: 5.7, weapon: 'bastone', perk: 'pierce', desc: 'I suoi dardi magici trapassano i nemici.' }
];
const WT = {
  spada: { n: 'Spada', kind: 'melee', dmg: 3, cd: .34, reach: 2.1, kb: 7 },
  ascia: { n: 'Ascia', kind: 'melee', dmg: 5, cd: .62, reach: 2.0, kb: 11 },
  pugnale: { n: 'Pugnale', kind: 'melee', dmg: 2, cd: .18, reach: 1.55, kb: 3 },
  arco: { n: 'Arco', kind: 'ranged', dmg: 2, cd: .42, spd: 17 },
  bastone: { n: 'Bastone', kind: 'magic', dmg: 3, cd: .55, spd: 11 }
};
const RAR = [{ n: 'Comune', c: '#d9d2c3', hex: 0xd9d2c3 }, { n: 'Raro', c: '#6aaeff', hex: 0x5fa8ff }, { n: 'Epico', c: '#c98bff', hex: 0xc77dff }];
const SUFF = ['del Fuochista', 'del Frenatore', 'della Terza Classe', 'del Vagone Letto', 'del Bigliettaio', 'della Locomotiva', 'del Binario Morto', 'del Passeggero Perduto', 'del Deviatore', 'della Carrozza Ristorante'];
function genWeapon(type, lvl, boost = 0) {
  const r = Math.random() + lvl * .07 + boost, rar = r > 1.08 ? 2 : r > .72 ? 1 : 0, t = WT[type];
  return { type, lvl, rar, name: t.n + ' ' + pick(SUFF), dmg: Math.max(1, Math.round(t.dmg * (1 + .3 * (lvl - 1)) * [1, 1.3, 1.7][rar])), cd: +(t.cd * (1 - .04 * (lvl - 1)) * (rar === 2 ? .9 : 1)).toFixed(2), crit: Math.round(3 + Math.random() * 6 + rar * 5) };
}
function starterWeapon(c) { return { type: c.weapon, lvl: 1, rar: 0, name: WT[c.weapon].n + ' di partenza', dmg: WT[c.weapon].dmg, cd: WT[c.weapon].cd, crit: 5 }; }
function validWeapon(w) { return w && WT[w.type] && typeof w.dmg === 'number' && typeof w.cd === 'number'; }
const MOBS = {
  ratto: { name: 'Ratto del Bagagliaio', hp: 4, wpn: ['pugnale'], mult: { slide: 3, ascia: 1.5 },
    weak: 'Una scivolata lo travolge (danno x3). Le asce lo finiscono subito. Passa sotto sedili e tavoli.',
    lore: 'Nati nei bagagli dimenticati. Rubano i coltelli dalla carrozza ristorante e non li restituiscono più.' },
  scheletro: { name: 'Passeggero Scheletrico', hp: 9, wpn: ['spada', 'ascia'], mult: { ascia: 1.5 },
    weak: 'Le armi pesanti gli spezzano le ossa (Ascia x1.5). Para il fendente quando alza l\'arma per stordirlo.',
    lore: 'Ha perso la sua fermata. Anzi, tutte le fermate. Aspetta ancora che il controllore gli timbri il biglietto.' },
  arciere: { name: 'Scheletro Arciere', hp: 6, wpn: ['arco'], mult: { reflect: 2, bastone: 1.3 },
    weak: 'Ribalta un tavolo e riparati dietro. Le frecce parate tornano indietro con danno doppio.',
    lore: 'Tira dal fondo del vagone. Dicono fosse campione di tiro, prima di salire sul treno sbagliato.' },
  bigliettaio: { name: 'Bigliettaio Spettrale', hp: 34, wpn: ['bastone', 'ascia'], mult: { bastone: 1.5, reflect: 2 }, elite: true,
    weak: 'La magia lo ferisce di più (Bastone x1.5). Para i biglietti per rispedirglieli.',
    lore: 'Il braccio destro del capotreno. Timbra biglietti che nessuno ha comprato. È molto zelante, anche da morto.' }
};

/* ================= modelli a blocchi ================= */
function buildModelMaterials() {
  MAT.bladeRare = emis(0xc4dcff, 0x3f7fff, .9, { metalness: .8, roughness: .25 });
  MAT.bladeEpic = emis(0xecd0ff, 0x9a4aff, 1.3, { metalness: .8, roughness: .25 });
  MAT.trousers = std(0x2a2522, .9);
  MAT.heart = emis(0xff7080, 0xe02a3a, 2.2);
  MAT.fxGold = new THREE.MeshBasicMaterial({ color: lin(0xffd890), transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  MAT.ringTeal = new THREE.MeshBasicMaterial({ color: lin(0x62d4c7), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false });
  MAT.ringRed = new THREE.MeshBasicMaterial({ color: lin(0xff6a5a), transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false });
  MAT.ringWhite = new THREE.MeshBasicMaterial({ color: lin(0xf0ece2), transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
  MAT.blob = new THREE.MeshBasicMaterial({ map: TEX.glow, color: 0x000000, transparent: true, opacity: .55, depthWrite: false });
  MAT.window = emis(0x6a4a2a, 0xffa040, 1.3);
  MAT.flash = emis(0xffffff, 0xffffff, 2);
}
// oggetti che si muovono: proiettano ombre vere solo con la qualità alta (con le altre restano le ombre a macchia)
function castAll(g) { g.traverse(o => { if (o.isMesh && o.material && !o.material.transparent) { o.userData.cs = true; o.castShadow = !!Q.dyn; } }); return g; }
const RING_GEO = () => RING_GEO.g || (RING_GEO.g = new THREE.RingGeometry(.52, .58, 40).rotateX(-Math.PI / 2));
const BLOB_GEO = () => BLOB_GEO.g || (BLOB_GEO.g = new THREE.PlaneGeometry(1.4, 1.4).rotateX(-Math.PI / 2));
function addRing(g, mat, s = 1) { const r = new THREE.Mesh(RING_GEO(), mat); r.position.y = .03; r.scale.setScalar(s); r.renderOrder = 2; g.add(r); return r; }
function addBlob(g, s = 1) { const b = new THREE.Mesh(BLOB_GEO(), MAT.blob); b.position.y = .02; b.scale.setScalar(s); g.add(b); return b; }

function weaponModel(type, rar = 0) {
  const g = new THREE.Group(), blade = rar === 2 ? MAT.bladeEpic : rar === 1 ? MAT.bladeRare : MAT.steel;
  if (type === 'spada') { bx(g, MAT.leather, .07, .07, .26, 0, 0, -.02); bx(g, MAT.brass, .09, .09, .09, 0, 0, -.17); bx(g, MAT.brass, .32, .06, .07, 0, 0, .13); bx(g, blade, .09, .035, .92, 0, 0, .62); }
  else if (type === 'ascia') { bx(g, MAT.woodDark, .07, .07, 1.0, 0, 0, .28); bx(g, blade, .38, .05, .3, .16, 0, .68); bx(g, MAT.steelDark, .1, .1, .12, 0, 0, .7); }
  else if (type === 'pugnale') { bx(g, MAT.leather, .06, .06, .18, 0, 0, 0); bx(g, MAT.brass, .2, .05, .05, 0, 0, .1); bx(g, blade, .08, .03, .44, 0, 0, .34); }
  else if (type === 'arco') {
    for (let i = 0; i < 7; i++) { const a = -.95 + i * (1.9 / 6), x = Math.sin(a) * .55, z = Math.cos(a) * .55 - .42; const s = bx(g, rar ? blade : MAT.wood, .07, .07, .2, x, 0, z); s.rotation.y = a + Math.PI / 2; }
    bx(g, MAT.cream, .88, .02, .02, 0, 0, -.1); bx(g, MAT.leather, .14, .1, .1, 0, 0, .13);
  } else if (type === 'bastone') {
    bx(g, MAT.woodDark, .07, .07, 1.3, 0, 0, .35); bx(g, MAT.brass, .13, .13, .08, 0, 0, .98);
    const gem = bx(g, rar === 2 ? MAT.bladeEpic : MAT.gem, .17, .17, .17, 0, 0, 1.12); gem.rotation.set(.6, .6, 0); g.userData.gem = gem;
  }
  return castAll(g);
}
function playerModel(clsId, outfit) {
  const root = new THREE.Group(), om = outfitMats[outfit] || outfitMats[0];
  const body = pivot(root, 0, 0, 0);
  const legL = pivot(body, -.13, .86, 0), legR = pivot(body, .13, .86, 0);
  for (const L of [legL, legR]) { bx(L, MAT.trousers, .2, .62, .24, 0, -.33, 0); bx(L, MAT.leather, .22, .2, .32, 0, -.75, .04); }
  const upper = pivot(body, 0, .86, 0);
  bx(upper, om[0], .58, .66, .34, 0, .33, 0);
  bx(upper, MAT.leather, .6, .09, .36, 0, .05, 0); bx(upper, MAT.brass, .1, .08, .03, 0, .05, .19);
  bx(upper, om[1], .64, .13, .38, 0, .66, 0);
  const cloak = pivot(upper, 0, .7, -.18); bx(cloak, om[1], .6, 1.02, .07, 0, -.5, 0);
  const head = pivot(upper, 0, .72, 0);
  bx(head, MAT.skin, .34, .34, .34, 0, .2, 0); bx(head, MAT.black, .06, .06, .02, -.08, .22, .171); bx(head, MAT.black, .06, .06, .02, .08, .22, .171);
  const armL = pivot(upper, -.38, .62, 0), armR = pivot(upper, .38, .62, 0);
  for (const A of [armL, armR]) { bx(A, om[0], .17, .56, .2, 0, -.27, 0); bx(A, MAT.skin, .14, .14, .15, 0, -.6, 0); }
  const hand = pivot(armR, 0, -.6, .04), handL = pivot(armL, 0, -.6, .04);
  if (clsId === 'cavaliere') {
    bx(head, MAT.steel, .4, .3, .4, 0, .27, 0); bx(head, MAT.black, .3, .045, .02, 0, .25, .205); bx(head, MAT.steel, .05, .14, .03, 0, .17, .21); bx(head, MAT.red, .06, .14, .28, 0, .48, -.03);
    bx(upper, MAT.steel, .24, .15, .32, -.38, .68, 0); bx(upper, MAT.steel, .24, .15, .32, .38, .68, 0); bx(upper, MAT.steel, .5, .42, .05, 0, .38, .18);
  } else if (clsId === 'ranger') {
    bx(head, MAT.green, .4, .12, .4, 0, .42, 0); bx(head, MAT.green, .4, .4, .08, 0, .2, -.18); bx(head, MAT.green, .06, .38, .4, -.19, .2, 0); bx(head, MAT.green, .06, .38, .4, .19, .2, 0); bx(head, MAT.green, .16, .16, .14, 0, .34, -.26);
    const q = bx(upper, MAT.leather, .16, .62, .16, .17, .42, -.26); q.rotation.z = -.35;
    for (let i = 0; i < 3; i++) bx(upper, MAT.cream, .04, .14, .04, .27 + i * .04, .78 - i * .02, -.26 + (i - 1) * .04);
    bx(upper, MAT.green, .5, .3, .05, 0, .5, -.2);
  } else {
    bx(head, MAT.purple, .62, .05, .62, 0, .4, 0); bx(head, MAT.purple, .38, .2, .38, 0, .52, 0); bx(head, MAT.purple, .27, .2, .27, 0, .7, -.03);
    bx(head, MAT.purple, .17, .2, .17, 0, .88, -.08); bx(head, MAT.purple, .09, .14, .09, 0, 1.02, -.15); bx(head, MAT.brass, .4, .05, .4, 0, .45, 0);
    bx(head, MAT.white, .26, .22, .06, 0, .02, .17);
  }
  const parry = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), MAT.fxGold.clone()); parry.position.set(0, 1.1, .62); parry.material.opacity = 0; root.add(parry);
  root.userData = { body, upper, legL, legR, armL, armR, head, cloak, hand, handL, parry, weapon: null, phase: 0, clsId, outfit };
  return castAll(root);
}
function setModelWeapon(model, w) {
  const u = model.userData; if (u.weapon) u.weapon.parent.remove(u.weapon);
  const wm = weaponModel(w.type, w.rar); u.weapon = wm; u.wtype = w.type;
  (w.type === 'arco' ? u.handL : u.hand).add(wm);
}
function setModelOutfit(model, outfit) {
  const om = outfitMats[outfit] || outfitMats[0], old = model.userData.outfit;
  model.traverse(o => { if (!o.isMesh) return; if (o.material === outfitMats[old][0]) o.material = om[0]; else if (o.material === outfitMats[old][1]) o.material = om[1]; });
  model.userData.outfit = outfit;
}
// pose: s = {spd, ground, slide, atk (0..1 o -1), kind, parry, dead, aimUp}
function posePlayer(m, s, dt) {
  const u = m.userData, k = clamp(s.spd / 5, 0, 1.3);
  u.phase += dt * (3 + s.spd * 1.7);
  const sw = Math.sin(u.phase);
  u.body.rotation.set(0, 0, 0); u.body.position.y = 0; u.upper.rotation.set(0, 0, 0);
  u.legL.rotation.x = sw * .75 * k; u.legR.rotation.x = -sw * .75 * k;
  u.armL.rotation.set(-sw * .55 * k, 0, 0); u.armR.rotation.set(sw * .55 * k - .25, 0, 0);
  u.body.position.y = Math.abs(Math.cos(u.phase)) * .05 * k;
  u.upper.scale.y = 1 + Math.sin(T * 2.2) * .012;
  u.cloak.rotation.x = clamp(s.spd * .09, 0, .75) + Math.sin(T * 3.1) * .05;
  if (u.weapon) {
    const melee = WT[u.wtype].kind === 'melee';
    if (melee) { u.weapon.rotation.set(-.55, 0, 0); }
    else if (u.wtype === 'arco') { u.weapon.rotation.set(-1.45, 0, 0); u.armL.rotation.x = -.5; }
    else { u.weapon.rotation.set(-1.0, 0, 0); }
  }
  if (!s.ground) { u.legL.rotation.x = -.7; u.legR.rotation.x = .35; u.armL.rotation.x = -1.2; u.armR.rotation.x = -1.0; }
  if (s.atk >= 0) {
    const a = s.atk;
    if (s.kind === 'melee') { const e = 1 - Math.pow(1 - a, 3); u.upper.rotation.y = lerp(1.3, -1.35, e); u.armR.rotation.set(-1.5, 0, 0); if (u.weapon) u.weapon.rotation.set(-.05, 0, 0); }
    else if (s.kind === 'ranged') { u.armL.rotation.set(-1.55, 0, 0); u.armR.rotation.set(-1.45 + a * .4, 0, -.2); u.upper.rotation.y = -.2; }
    else { u.armR.rotation.set(-1.6 + Math.sin(a * Math.PI) * .5, 0, 0); if (u.weapon) u.weapon.rotation.set(-.2, 0, 0); }
  }
  if (s.slide) { u.body.rotation.x = -1.05; u.body.position.y = .22; u.legL.rotation.x = -.4; u.legR.rotation.x = -.2; u.armL.rotation.x = -2.4; }
  u.parry.material.opacity = s.parry ? .55 + Math.random() * .25 : Math.max(0, u.parry.material.opacity - dt * 4);
  if (s.parry) { u.armL.rotation.set(-1.6, 0, .3); }
  if (u.weapon && u.weapon.userData.gem) u.weapon.userData.gem.rotation.y += dt * 3;
}
function ratModel() {
  const r = new THREE.Group(), body = pivot(r, 0, 0, 0);
  bx(body, MAT.rat, .42, .3, .72, 0, .26, 0); bx(body, MAT.rat, .32, .26, .32, 0, .3, .46); bx(body, MAT.ratPink, .09, .07, .08, 0, .26, .64);
  bx(body, MAT.ratPink, .11, .13, .04, -.12, .47, .4); bx(body, MAT.ratPink, .11, .13, .04, .12, .47, .4);
  bx(body, MAT.eyeRed, .05, .05, .03, -.09, .35, .62); bx(body, MAT.eyeRed, .05, .05, .03, .09, .35, .62);
  const tail = pivot(body, 0, .24, -.36); bx(tail, MAT.ratPink, .05, .05, .62, 0, 0, -.31);
  const legs = [[-.16, .22], [.16, .22], [-.16, -.22], [.16, -.22]].map(([x, z]) => { const p = pivot(body, x, .14, z); bx(p, MAT.rat, .08, .14, .1, 0, -.07, 0); return p; });
  const d = weaponModel('pugnale'); d.scale.setScalar(.75); d.rotation.y = Math.PI / 2; d.position.set(-.18, .24, .62); body.add(d);
  r.userData = { body, tail, legs }; addBlob(r, .7); return castAll(r);
}
function skeletonModel(variant, wtype) {
  const s = new THREE.Group(), body = pivot(s, 0, 0, 0);
  const legL = pivot(body, -.11, .82, 0), legR = pivot(body, .11, .82, 0);
  for (const L of [legL, legR]) { bx(L, MAT.bone, .09, .72, .09, 0, -.36, 0); bx(L, MAT.bone, .14, .06, .22, 0, -.78, .04); }
  const upper = pivot(body, 0, .82, 0);
  bx(upper, MAT.bone, .34, .1, .18, 0, .02, 0); bx(upper, MAT.bone, .08, .5, .08, 0, .3, 0);
  for (let i = 0; i < 3; i++) bx(upper, MAT.bone, .42 - i * .03, .05, .24, 0, .26 + i * .11, 0);
  bx(upper, MAT.bone, .48, .07, .2, 0, .62, 0);
  const head = pivot(upper, 0, .66, 0);
  bx(head, MAT.bone, .32, .3, .32, 0, .2, 0); bx(head, MAT.bone, .26, .08, .26, 0, .02, .03);
  bx(head, MAT.boneDark, .09, .08, .02, -.08, .22, .162); bx(head, MAT.boneDark, .09, .08, .02, .08, .22, .162);
  bx(head, MAT.ember, .04, .04, .02, -.08, .22, .168); bx(head, MAT.ember, .04, .04, .02, .08, .22, .168);
  const armL = pivot(upper, -.28, .6, 0), armR = pivot(upper, .28, .6, 0);
  for (const A of [armL, armR]) { bx(A, MAT.bone, .07, .55, .07, 0, -.27, 0); bx(A, MAT.bone, .1, .1, .1, 0, -.58, 0); }
  const hand = pivot(armR, 0, -.58, .03), handL = pivot(armL, 0, -.58, .03);
  if (variant === 'arciere') {
    bx(head, MAT.red, .38, .14, .38, 0, .4, 0); bx(head, MAT.red, .38, .34, .07, 0, .22, -.17); bx(upper, MAT.red, .46, .12, .28, 0, .66, 0);
    bx(upper, MAT.red, .3, .5, .04, .05, .28, -.14);
  } else {
    bx(head, MAT.black, .42, .04, .42, 0, .36, 0); bx(head, MAT.black, .27, .16, .27, 0, .45, 0); bx(head, MAT.red, .28, .03, .28, 0, .4, 0);
    bx(upper, MAT.slate, .46, .44, .06, 0, .36, -.13); bx(upper, MAT.slate, .1, .44, .2, -.22, .36, -.04); bx(upper, MAT.slate, .1, .44, .2, .22, .36, -.04);
  }
  const wm = weaponModel(wtype); (wtype === 'arco' ? handL : hand).add(wm);
  s.userData = { body, upper, legL, legR, armL, armR, head, hand, weapon: wm, wtype, phase: Math.random() * 6 };
  addBlob(s, .8); return castAll(s);
}
function ghostModel() {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0);
  bx(body, MAT.ghost, .5, .3, .45, 0, .55, 0, false); bx(body, MAT.ghost, .36, .26, .32, 0, .3, -.06, false); bx(body, MAT.ghost, .22, .2, .2, 0, .1, -.14, false);
  bx(body, MAT.ghostCloth, .64, .72, .44, 0, 1.06, 0);
  for (let i = 0; i < 3; i++) bx(body, MAT.brass, .06, .06, .02, 0, 1.25 - i * .18, .225);
  bx(body, MAT.brass, .66, .05, .46, 0, .72, 0);
  const head = pivot(body, 0, 1.42, 0);
  bx(head, MAT.ghost, .42, .38, .38, 0, .18, 0, false); bx(head, MAT.eyeTeal, .08, .08, .02, -.1, .21, .195); bx(head, MAT.eyeTeal, .08, .08, .02, .1, .21, .195); bx(head, MAT.black, .18, .04, .02, 0, .08, .195);
  bx(head, MAT.navy, .48, .15, .48, 0, .44, 0); bx(head, MAT.black, .48, .03, .22, 0, .37, .26); bx(head, MAT.brass, .12, .08, .02, 0, .46, .245);
  const armL = pivot(body, -.42, 1.34, 0), armR = pivot(body, .42, 1.34, 0);
  for (const A of [armL, armR]) { bx(A, MAT.ghostCloth, .16, .5, .18, 0, -.25, 0); bx(A, MAT.ghost, .13, .13, .13, 0, -.56, 0, false); }
  const punch = pivot(armR, 0, -.6, .08); bx(punch, MAT.brass, .1, .1, .32, 0, 0, .12);
  const light = new THREE.PointLight(lin(0x52e0d0), 2.2, 8, 2); light.position.set(0, 1.2, .3); g.add(light);
  g.userData = { body, head, armL, armR, light };
  g.scale.setScalar(1.3); return castAll(g);
}
function robotModel() {
  const r = new THREE.Group(), body = pivot(r, 0, 0, 0);
  bx(body, MAT.robot, .56, .4, .5, 0, .52, 0); bx(body, MAT.robotDark, .44, .24, .04, 0, .54, .25);
  bx(body, MAT.lamp, .09, .09, .02, -.1, .55, .272); bx(body, MAT.lamp, .09, .09, .02, .1, .55, .272);
  bx(body, MAT.robot, .62, .06, .56, 0, .75, 0); bx(body, MAT.robotDark, .3, .1, .3, 0, .82, -.05);
  bx(body, MAT.steelDark, .03, .26, .03, .18, .92, -.12); bx(body, MAT.ember, .07, .07, .07, .18, 1.07, -.12);
  bx(body, MAT.brass, .1, .1, .06, -.18, .4, .26);
  const legs = [[-.2, .16], [.2, .16], [-.2, -.16], [.2, -.16]].map(([x, z]) => { const p = pivot(body, x, .34, z); bx(p, MAT.robotDark, .09, .3, .09, 0, -.15, 0); bx(p, MAT.robotDark, .14, .05, .16, 0, -.31, .02); return p; });
  const light = new THREE.PointLight(lin(0xffc47a), 1.5, 6, 2); light.position.set(0, 1.0, .4); r.add(light);
  r.userData = { body, legs, light, phase: 0 }; addBlob(r, .7); return castAll(r);
}
const COIN_GEO = () => COIN_GEO.g || (COIN_GEO.g = new THREE.CylinderGeometry(.17, .17, .05, 12).rotateX(Math.PI / 2));
function coinModel() { return new THREE.Mesh(COIN_GEO(), MAT.gold); }
function heartModel() {
  const g = new THREE.Group();
  bx(g, MAT.heart, .2, .2, .12, -.08, .1, 0, false); bx(g, MAT.heart, .2, .2, .12, .08, .1, 0, false);
  const d = bx(g, MAT.heart, .22, .22, .12, 0, -.04, 0, false); d.rotation.z = Math.PI / 4; return g;
}
function chestModel() {
  const g = new THREE.Group();
  bx(g, MAT.wood, 1.0, .5, .66, 0, .25, 0); bx(g, MAT.brass, 1.04, .06, .7, 0, .1, 0); bx(g, MAT.brass, 1.04, .06, .7, 0, .42, 0);
  const lid = pivot(g, 0, .5, -.33); bx(lid, MAT.wood, 1.0, .2, .66, 0, .1, .33); bx(lid, MAT.brass, 1.04, .05, .7, 0, .2, .33); bx(lid, MAT.brass, .14, .16, .06, 0, .02, .67);
  const glow = new THREE.PointLight(lin(0xffc060), 0, 6, 2); glow.position.set(0, 1, 0); g.add(glow);
  g.userData = { lid, glow }; return castAll(g);
}
function tableModel() {
  const g = new THREE.Group();
  bx(g, MAT.wood, 1.4, .1, 1.4, 0, .85, 0); bx(g, MAT.woodDark, 1.44, .05, 1.44, 0, .79, 0);
  for (const [x, z] of [[-.58, -.58], [.58, -.58], [-.58, .58], [.58, .58]]) bx(g, MAT.woodDark, .1, .78, .1, x, .4, z);
  bx(g, MAT.cream, .5, .02, .5, .1, .91, -.1); bx(g, MAT.brass, .08, .16, .08, -.35, .98, .3); bx(g, MAT.lamp, .06, .06, .06, -.35, 1.09, .3);
  return castAll(g);
}
function lootBeam(rar) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 3.2, 10, 1, true), new THREE.MeshBasicMaterial({ map: TEX.shaft, color: lin(RAR[rar].hex), transparent: true, opacity: rar ? .55 : .3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.geometry.rotateX(Math.PI); m.position.y = 1.6; m.userData.own = true; return m;
}
function slashMesh(reach, col = 0xffe2a8) {
  const N = 18, pos = [], colr = [], idx = [], r0 = .45, r1 = reach + .2, c = lin(col);
  for (let i = 0; i <= N; i++) {
    const a = -1.25 + 2.5 * i / N, f = Math.sin(i / N * Math.PI);
    pos.push(Math.sin(a) * r0, 0, Math.cos(a) * r0, Math.sin(a) * r1, 0, Math.cos(a) * r1);
    colr.push(c.r * f * .3, c.g * f * .3, c.b * f * .3, c.r * f * 1.6, c.g * f * 1.6, c.b * f * 1.6);
    if (i < N) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.userData.own = true; return m;
}

/* ---------- ritratti 3D per le schede (bestiario, classi) ---------- */
const PORTRAITS = {};
const pScene = new THREE.Scene();
const pCam = new THREE.PerspectiveCamera(26, 1, .1, 60);
pScene.add(new THREE.HemisphereLight(lin(0xc0ccd8), lin(0x1a1410), .9));
const pKey = new THREE.DirectionalLight(lin(0xffd3a0), 1.7); pKey.position.set(2, 3, 3); pScene.add(pKey);
const pRim = new THREE.DirectionalLight(lin(0x62d4c7), 1.3); pRim.position.set(-3, 2, -2.5); pScene.add(pRim);
const GAMMA = new Uint8Array(256).map((_, i) => Math.round(Math.pow(i / 255, 1 / 2.2) * 255));
function portrait(key, make, size = 192, dist = 4.2, lookY = .95) {
  if (PORTRAITS[key]) return PORTRAITS[key];
  try {
    const model = make(); model.rotation.y = .55; pScene.add(model);
    const rt = new THREE.WebGLRenderTarget(size, size);
    pCam.position.set(Math.sin(.25) * dist, lookY + .75, Math.cos(.25) * dist); pCam.lookAt(0, lookY, 0);
    const tm = renderer.toneMapping, env = pScene.environment;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; pScene.environment = scene.environment;
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(pScene, pCam);
    const buf = new Uint8Array(size * size * 4); renderer.readRenderTargetPixels(rt, 0, 0, size, size, buf);
    renderer.setRenderTarget(null); renderer.toneMapping = tm; pScene.environment = env; renderer.setClearColor(0x000000, 1);
    pScene.remove(model); rt.dispose();
    const c = cvs(size, size), g = c.getContext('2d'), img = g.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const si = ((size - 1 - y) * size + x) * 4, di = (y * size + x) * 4; img.data[di] = GAMMA[buf[si]]; img.data[di + 1] = GAMMA[buf[si + 1]]; img.data[di + 2] = GAMMA[buf[si + 2]]; img.data[di + 3] = buf[si + 3]; }
    g.putImageData(img, 0, 0); return (PORTRAITS[key] = c.toDataURL());
  } catch (e) { return ''; }
}
function mobPortrait(type) {
  return portrait('mob_' + type, () => type === 'ratto' ? (m => { m.scale.setScalar(1.9); return m; })(ratModel()) : type === 'bigliettaio' ? ghostModel() : skeletonModel(type === 'arciere' ? 'arciere' : 'scheletro', type === 'arciere' ? 'arco' : 'spada'), 192, type === 'bigliettaio' ? 5.6 : 4.4, type === 'ratto' ? .5 : type === 'bigliettaio' ? 1.3 : .95);
}
function classPortrait(id, outfit) {
  return portrait('cls_' + id + '_' + outfit, () => { const m = playerModel(id, outfit); setModelWeapon(m, starterWeapon(CLASSES.find(c => c.id === id))); posePlayer(m, { spd: 0, ground: true, atk: -1 }, 0); return m; });
}
