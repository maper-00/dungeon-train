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
  // velluto e metalli con la luce di contorno per ragni e automi
  const fur = TEX.furP, phys = (hex, o) => new THREE.MeshPhysicalMaterial(Object.assign({ color: lin(hex), roughness: .85 }, o));
  Object.assign(MAT, {
    cSpider: rim(phys(0x3a2a4a, { map: fur.map, bumpMap: fur.bump, bumpScale: .015, sheen: 1, sheenColor: lin(0xc8a0ff), sheenRoughness: .4 }), 0xc8ffb0, .5),
    cQueen: rim(phys(0x4a2266, { map: fur.map, bumpMap: fur.bump, bumpScale: .015, sheen: 1, sheenColor: lin(0xff9ad8), sheenRoughness: .4 }), 0xc8ffb0, .55),
    cSpiderLeg: rim(phys(0x1e1826, { roughness: .35, clearcoat: .8, clearcoatRoughness: .2 }), 0xc8ffb0, .4),
    cSpiderKnee: phys(0x7ae070, { emissive: lin(0x2a7a10), emissiveIntensity: .8, roughness: .3 }),
    cCopper: rim(Object.assign(MAT.brassAged.clone(), { color: lin(0xc87a4a) }), 0xffc8a0, .3)
  });
}
// ritratti: distanza, altezza dello sguardo, scala
const PORT = { ratto: [4.4, .55, 1.9], scheletro: [5.8, 1.15, 1], arciere: [5.8, 1.15, 1], fuochista: [5.8, 1.15, 1], bigliettaio: [6.6, 1.15, 1], cuoco: [6.6, 1.35, 1], mimic: [4.4, .5, 1.25], fantasma: [5.2, 1.0, 1], ragno: [4.8, .45, 1.1], regina: [5.6, .6, .55], guardia: [5.8, 1.15, 1], automa: [4.4, .8, 1.05], capotreno: [6.6, 1.3, .72] };
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
// mannaia da cucina: manico di noce con i rivetti, lama larga con il foro
function cleaverModel() {
  const g = new THREE.Group();
  part(g, MAT.varnishDark, sg('clvH', () => tubeZ(.024, .028, .17, 10)));
  for (const z of [-.04, .04]) part(g, MAT.brassAged, sg('clvRiv', () => sph(.008, 6, 5)), 0, .026, z);
  part(g, MAT.brassAged, sg('clvFer', () => tubeZ(.03, .03, .02, 10)), 0, 0, .09);
  part(g, MAT.steel, sg('clvB', () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.27, 0); s.quadraticCurveTo(.3, -.1, .27, -.21); s.lineTo(.02, -.21); s.lineTo(0, -.03); s.lineTo(0, 0); const h = new THREE.Path(); h.absarc(.22, -.045, .018, 0, TAU, true); s.holes.push(h); const g = new THREE.ExtrudeGeometry(s, { depth: .01, bevelEnabled: true, bevelThickness: .006, bevelSize: .004, bevelSegments: 1, curveSegments: 10 }); g.rotateY(-Math.PI / 2); g.translate(.005, .045, .1); return g; }));
  return castAll(bake(g, 'cleaver'));
}
// pala del carbone: manico a D, lama annerita con il carbone acceso sopra
function shovelModel() {
  const g = new THREE.Group();
  part(g, MAT.oak, sg('shvS', () => tubeZ(.022, .024, .95, 10)), 0, 0, .3);
  part(g, MAT.oak, sg('shvD', () => new THREE.TorusGeometry(.07, .016, 6, 14, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2)), 0, 0, -.18);
  part(g, MAT.iron, sg('shvB', () => { const g = rbox(.26, .02, .32, .008, 1), P = g.attributes.position.array; for (let i = 0; i < P.length; i += 3) P[i + 1] += Math.pow(P[i] / .13, 2) * .03; g.computeVertexNormals(); return g; }), 0, 0, .92);
  part(g, MAT.coal, sg('shvC', () => blob(.09, .03, .08, 10)), 0, .03, .93);
  part(g, MAT.ember, sg('shvE', () => blob(.035, .02, .03, 8)), .04, .05, .94, 0, 0, 0, false);
  return castAll(bake(g, 'shovel'));
}
// Baule Mimetico: un baule da viaggio vero, foderato di velluto rosso dentro, denti d'avorio, una lingua lunghissima,
// un unico occhio giallo nel coperchio e quattro zampe di poltrona con gli artigli d'ottone
function mimicModel(awake) {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0), b = new Builder(), k = new Kit(b);
  k.box(MAT.oak, 1.0, .5, .66, 0, 0, 0, .025);
  for (const x of [-.36, .36]) k.box(MAT.varnishDark, .08, .51, .675, x, -.005, 0, .012);
  k.box(MAT.brassAged, 1.02, .05, .68, 0, .06, 0, .01); k.box(MAT.brassAged, 1.02, .05, .68, 0, .43, 0, .01);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(MAT.brassAged, .1, .1, .1, sx * .47, 0, sz * .3, .015);
  k.box(MAT.velvetCurtain, .92, .02, .56, 0, .48, 0, .005);
  k.put(MAT.stickers, stickerPlane(.2, .16, 6), .2, .27, .332);
  b.build(body);
  for (let i = 0; i < 9; i++) for (const z of [.27, -.27]) part(body, MAT.cWhite, sg('mmTooth', () => new THREE.ConeGeometry(.028, .09, 8)), -.4 + i * .1, .54, z, 0, 0, i % 2 ? .12 : -.12, false);
  const tongue = pivot(body, 0, .5, -.15);
  part(tongue, MAT.cPink, sg('mmTongue', () => taperTube([[0, 0, 0], [0, .04, .18], [0, .02, .36], [0, .08, .5], [0, .14, .52]], t => .07 * (1 - t * .5), 20, 10).scale(1.4, .45, 1)), 0, .02, 0, 0, 0, 0, false);
  const lid = pivot(body, 0, .5, -.33), lb = new Builder(), lk = new Kit(lb);
  lk.put(MAT.oak, cylUV(new THREE.CylinderGeometry(.33, .33, 1.0, 20, 1, false, 0, Math.PI), 1, 1), 0, 0, .33, 0, 0, Math.PI / 2);
  for (const x of [-.36, .36]) lk.put(MAT.varnishDark, cylUV(new THREE.CylinderGeometry(.338, .338, .08, 20, 1, false, 0, Math.PI), .08, 1), x, 0, .33, 0, 0, Math.PI / 2);
  lk.put(MAT.velvetCurtain, new THREE.CircleGeometry(.31, 20, 0, Math.PI).scale(1.5, 1, 1).rotateX(Math.PI / 2), 0, -.005, .33);
  lk.box(MAT.brassAged, .14, .14, .03, 0, -.06, .665, .01);
  lb.build(lid); lid.scale.y = .62;
  for (let i = 0; i < 9; i++) part(lid, MAT.cWhite, sg('mmToothT', () => new THREE.ConeGeometry(.026, .08, 8).rotateX(Math.PI)), -.4 + i * .1, -.04, .62, 0, 0, 0, false);
  const eye = pivot(lid, 0, -.02, .36);
  part(eye, MAT.cWhite, sg('mmEye', () => blob(.13, .03, .1, 18)), 0, 0, 0, 0, 0, 0, false);
  part(eye, MAT.mimicEye, sg('mmIris', () => blob(.07, .012, .07, 16)), 0, -.022, .0, 0, 0, 0, false);
  part(eye, MAT.black, sg('mmPupil', () => blob(.014, .006, .055, 10)), 0, -.033, 0, 0, 0, 0, false);
  const legs = [[-.4, .24], [.4, .24], [-.4, -.24], [.4, -.24]].map(([x, z]) => {
    const p = pivot(body, x, .06, z), sx = Math.sign(x);
    part(p, MAT.varnishDark, sg('mmLeg' + sx, () => lathe([[.03, -.22], [.045, -.18], [.035, -.1], [.05, -.02], [.04, .04], [0, .05]], 10).rotateZ(sx * -.25)));
    for (let i = 0; i < 3; i++) part(p, MAT.brassAged, sg('mmClaw', () => new THREE.ConeGeometry(.018, .07, 6).rotateX(Math.PI / 2)), sx * .06 + (i - 1) * .03, -.22, .05);
    p.visible = !!awake; return p;
  });
  g.userData = { body, lid, tongue, legs, tick(t) { eye.position.x = Math.sin(t * .8) * .08; eye.scale.y = (t * .5) % 3.1 < .12 ? .2 : 1; } };
  if (awake) { lid.rotation.x = -.95; body.position.y = .14; }
  addBlob(g, .9); return castAll(bake(g, 'mimic'));
}
// Passeggero Fantasma: camicia da notte lunghissima, berretto da notte con il pon pon, mascherina sulla fronte, cuscino sotto il braccio
function phantomModel() {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0), ph = Math.random() * 10;
  const mG = MAT.phantom.clone(), mD = MAT.phantomDark.clone(), mE = MAT.phantomEye.clone();
  rim(mG, 0xd8c8ff, 1.2, 1.8); rim(mD, 0xb8a0ff, .8, 2.2);
  const tailGeo = lathe([[0, -.2], [.05, -.15], [.1, 0], [.17, .2], [.23, .45], [.27, .6], [.2, .66], [0, .68]], 20), base = Float32Array.from(tailGeo.attributes.position.array);
  const tail = part(body, mG, tailGeo, 0, 0, 0, 0, 0, 0, false); tail.userData.keep = true;
  part(body, mD, sg('phGown', () => lathe([[.34, .35], [.3, .55], [.24, .75], [.24, .95], [.27, 1.05], [.16, 1.12], [.05, 1.14], [0, 1.14]], 22)), 0, 0, 0, 0, 0, 0, false);
  for (let i = 0; i < 4; i++) part(body, mE, sg('phBtn', () => sph(.02, 8, 6)), 0, .7 + i * .1, .245 - i * .004, 0, 0, 0, false);
  part(body, mD, sg('phFrill', () => new THREE.TorusGeometry(.13, .035, 6, 18).rotateX(Math.PI / 2)), 0, 1.12, 0, 0, 0, 0, false);
  const head = pivot(body, 0, 1.15, 0);
  part(head, mG, sg('phHead', () => blob(.17, .19, .16, 20)), 0, .16, 0, 0, 0, 0, false);
  for (const sx of [-1, 1]) {
    part(head, mE, sg('phEye', () => blob(.05, .03, .02, 12)), sx * .07, .17, .145, 0, 0, sx * .15, false);
    part(head, mD, sg('phLid', () => new THREE.SphereGeometry(.055, 12, 6, 0, TAU, 0, Math.PI / 2).scale(1, .6, .5)), sx * .07, .18, .15, 0, 0, sx * .15, false);
  }
  part(head, mD, sg('phMask', () => rbox(.26, .06, .03, .015)), 0, .28, .14, -.3, 0, 0, false);
  part(head, mD, sg('phCap', () => taperTube([[0, .26, -.02], [0, .4, -.05], [.06, .5, -.2], [.14, .44, -.36], [.2, .3, -.42]], t => .17 * (1 - t * .85), 24, 14)), 0, 0, 0, 0, 0, 0, false);
  part(head, mE, sg('phPom', () => sph(.05, 10, 8)), .2, .26, -.43, 0, 0, 0, false);
  part(head, mG, sg('phMouth', () => blob(.03, .018, .01, 8)), 0, .07, .155, 0, 0, 0, false);
  const armL = pivot(body, -.27, 1.05, 0), armR = pivot(body, .27, 1.05, 0);
  for (const A of [armL, armR]) {
    part(A, mD, sg('phSleeve', () => taperTube([[0, 0, 0], [0, -.25, .02], [0, -.45, 0]], t => .07 + t * .025, 10, 10)), 0, 0, 0, 0, 0, 0, false);
    part(A, mG, sg('phHand', () => blob(.05, .06, .045, 10)), 0, -.52, .02, 0, 0, 0, false);
  }
  const bag = pivot(armL, 0, -.55, 0);
  part(bag, mD, sg('phPillow', () => rbox(.12, .3, .42, .06, 2)), 0, -.12, 0, 0, 0, 0, false);
  part(bag, mE, sg('phPillowLace', () => new THREE.TorusGeometry(.14, .01, 4, 18).scale(1, 1.2, 1.6).rotateY(Math.PI / 2)), .062, -.12, 0, 0, 0, 0, false);
  const glow = glowSprite(g, 0, .85, 0, 2.4, 0x9a7aff, .3);
  g.userData = {
    body, head, armL, armR, glow, mats: [[mG, .55], [mD, .78], [mE, 1]],
    tick(t) {
      const P = tailGeo.attributes.position.array;
      for (let i = 0; i < P.length; i += 3) { const y = base[i + 1], k = Math.pow(Math.max(0, (.6 - y) / .8), 1.6); P[i] = base[i] + Math.sin(t * 2.4 + y * 5 + ph) * .1 * k; P[i + 2] = base[i + 2] - k * .2; }
      tailGeo.attributes.position.needsUpdate = true;
    }
  };
  return bake(g, 'phantom');
}
// Ragno delle Serre: addome di velluto viola con un'orchidea che gli sboccia sulla schiena, occhioni lucidi a grappolo, zampe a giunti.
// La Regina porta una corona di fiori carnivori e un velo di ragnatela
function spiderModel(queen) {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0), mB = queen ? MAT.cQueen : MAT.cSpider, mL = MAT.cSpiderLeg;
  part(body, mB, sg('spAbd', () => blob(.27, .22, .32, 22, .1)), 0, .46, -.4, .25, 0, 0);
  part(body, queen ? MAT.queenMark : MAT.spiderMark, sg('spStripe', () => taperTube([[0, .66, -.18], [0, .7, -.36], [0, .62, -.6]], t => .05 * Math.sin(Math.PI * (.15 + t * .7)), 14, 8)), 0, 0, 0, 0, 0, 0, false);
  for (let i = 0; i < 5; i++) part(body, queen ? MAT.bloomPink : MAT.bloomTeal, sg('spPetal', () => blob(.07, .02, .12, 10).translate(0, 0, .1)), 0, .69, -.4, -.35, i / 5 * TAU, 0, false);
  part(body, MAT.mimicEye, sg('spPistil', () => sph(.035, 10, 8)), 0, .72, -.4, 0, 0, 0, false);
  part(body, mB, sg('spThorax', () => blob(.17, .14, .17, 18)), 0, .4, .06);
  part(body, mB, sg('spHead', () => blob(.12, .1, .1, 16)), 0, .43, .22);
  for (const [x, y, r] of [[-.05, .47, .045], [.05, .47, .045], [-.11, .44, .025], [.11, .44, .025], [-.03, .52, .02], [.03, .52, .02]]) {
    part(body, MAT.cEye, sg('spEyeB' + r, () => sph(r, 12, 10)), x, y, .29);
    part(body, MAT.spiderEye, sg('spEyeG' + r, () => sph(r * .45, 8, 6)), x + .006, y + .008, .29 + r * .85, 0, 0, 0, false);
  }
  for (const x of [-.04, .04]) part(body, MAT.cBone, sg('spFang', () => new THREE.ConeGeometry(.018, .1, 8).rotateX(Math.PI)), x, .33, .29, -.3, 0, 0);
  const legs = [];
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
    const hip = pivot(body, sd * .13, .42, .14 - i * .09); hip.rotation.y = sd * (i - 1.5) * .38;
    part(hip, mL, sg('spLegU' + sd, () => taperTube([[0, 0, 0], [sd * .18, .18, 0], [sd * .32, .2, 0]], t => .03 - t * .008, 10, 6)));
    part(hip, MAT.cSpiderKnee, sg('spKnee', () => sph(.03, 8, 6)), sd * .32, .2, 0);
    part(hip, mL, sg('spLegL' + sd, () => taperTube([[sd * .32, .2, 0], [sd * .44, .0, 0], [sd * .5, -.4, 0]], t => .022 * (1 - t * .7), 12, 6)));
    legs.push({ hip, sd, i, ry: hip.rotation.y });
  }
  if (queen) {
    for (let i = 0; i < 7; i++) { const a = (i - 3) * .32; part(body, MAT.bloomPink, sg('spCrownP', () => new THREE.ConeGeometry(.03, .14, 6)), Math.sin(a) * .1, .56, .18 + Math.cos(a) * .02 - .02, -.2, 0, a * .6, false); part(body, MAT.mimicEye, sg('spCrownG', () => sph(.016, 6, 5)), Math.sin(a) * .1, .64, .19, 0, 0, 0, false); }
    part(body, MAT.web, sg('spVeil', () => new THREE.SphereGeometry(.2, 16, 8, 0, TAU, 0, Math.PI * .45).scale(1.2, 1, 1.4)), 0, .44, -.02, -.4, 0, 0, false);
    g.scale.setScalar(2.2);
  }
  g.userData = { body, legs };
  addBlob(g, .9); return castAll(bake(g, queen ? 'queen' : 'spider'));
}
// Automa a Molla: una teiera di rame su due gambe, beccuccio per naso, coperchio per testa con l'occhio a feritoia, papillon e la chiave di carica
function automatonModel() {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0);
  const legL = pivot(body, -.16, .44, 0), legR = pivot(body, .16, .44, 0);
  for (const L of [legL, legR]) {
    part(L, MAT.steelDark, sg('auThigh', () => taperTube([[0, 0, 0], [0, -.16, .05], [0, -.34, 0]], () => .035, 8, 8)));
    part(L, MAT.brassAged, sg('auKnee', () => sph(.045)), 0, -.16, .05);
    part(L, MAT.copperDark, sg('auFoot', () => blob(.09, .05, .14, 12, -.3)), 0, -.38, .05);
  }
  const upper = pivot(body, 0, .44, 0);
  part(upper, MAT.cCopper, sg('auPot', () => lathe([[0, 0], [.22, 0], [.3, .08], [.35, .28], [.33, .48], [.26, .6], [.2, .64], [0, .64]], 24)));
  for (const y of [.08, .34]) part(upper, MAT.brassAged, sg('auBand' + y, () => new THREE.TorusGeometry(y < .2 ? .31 : .352, .016, 6, 28).rotateX(Math.PI / 2)), 0, y, 0);
  part(upper, MAT.cCopper, sg('auSpout', () => taperTube([[0, .2, .3], [0, .26, .45], [0, .4, .55], [0, .46, .6]], t => .06 * (1 - t * .5), 14, 10)));
  part(upper, MAT.cRibbon, sg('auBow', () => new THREE.ConeGeometry(.05, .1, 10).rotateZ(Math.PI / 2)), -.05, .58, .22, 0, 0, 0);
  part(upper, MAT.cRibbon, sg('auBow2', () => new THREE.ConeGeometry(.05, .1, 10).rotateZ(-Math.PI / 2)), .05, .58, .22, 0, 0, 0);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; part(upper, MAT.brassAged, sg('auRiv', () => sph(.012, 6, 5)), Math.sin(a) * .352, .34, Math.cos(a) * .352); }
  const head = pivot(upper, 0, .64, 0);
  part(head, MAT.cCopper, sg('auLid', () => lathe([[0, .2], [.08, .19], [.18, .12], [.22, .03], [.24, 0], [0, 0]], 22)));
  part(head, MAT.brassAged, sg('auKnob', () => lathe([[0, 0], [.04, 0], [.025, .04], [.05, .08], [0, .1]], 12)), 0, .19, 0);
  part(head, MAT.cSocket, sg('auVisor', () => rbox(.28, .06, .06, .02)), 0, .09, .17);
  const eye = new THREE.Mesh(sg('auEye', () => rbox(.24, .035, .03, .012)), MAT.eyeAmber); eye.position.set(0, .09, .195); eye.userData.keep = true; head.add(eye);
  const key = pivot(upper, 0, .36, -.33);
  part(key, MAT.brassAged, sg('rbKeyRod', () => tubeZ(.018, .018, .1, 8)), 0, 0, -.05);
  for (const sx of [-1, 1]) part(key, MAT.brassAged, sg('auKeyWing', () => blob(.1, .07, .015, 16)), sx * .1, 0, -.12);
  const armL = pivot(upper, -.36, .46, 0), armR = pivot(upper, .36, .46, 0);
  for (const [A, sx] of [[armL, -1], [armR, 1]]) {
    part(A, MAT.brassAged, sg('auShoulder', () => sph(.05)));
    part(A, MAT.copperDark, sg('auArm', () => taperTube([[0, 0, 0], [0, -.2, .03], [0, -.4, 0]], () => .03, 8, 8)));
    part(A, MAT.steel, sg('auSpring', () => { const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU * 4; pts.push([Math.cos(a) * .035, -.42 - i / 40 * .12, Math.sin(a) * .035]); } return taperTube(pts, () => .008, 60, 4); }));
    part(A, MAT.porcelain, sg('auCup', () => lathe([[0, 0], [.03, 0], [.045, .015], [.055, .06], [.05, .062], [.045, .02], [0, .018]], 16)), 0, -.6, .02);
  }
  g.userData = { body, upper, legL, legR, armL, armR, head, key, eye };
  addBlob(g, .8); return castAll(bake(g, 'automa'));
}
// la bottega di Bullone: carretto di legno con le ruote a raggi, tendone a strisce con la balza, armi in vetrina, Bullone col cilindro
function merchantModel() {
  const g = new THREE.Group(), b = new Builder(), k = new Kit(b);
  k.box(MAT.oak, 2.0, .55, 1.0, 0, .42, 0, .03); k.box(MAT.varnish, 2.16, .08, 1.12, 0, .97, 0, .025);
  k.box(MAT.brassAged, 2.02, .05, .03, 0, .62, .51, .01); k.box(MAT.velvetCurtain, 1.9, .02, .9, 0, 1.05, 0, .005);
  for (const [x, z] of [[-1, -.5], [1, -.5], [-1, .5], [1, .5]]) k.cyl(MAT.brassAged, .025, .025, 1.3, x, 1.0, z, 10);
  // tendone: tela a strisce bianche e rosse che ricade a festoni
  for (let i = 0; i < 6; i++) {
    const x = -1.0 + .175 + i * .35, m = i % 2 ? MAT.cChef : MAT.cRibbon;
    const roof = new THREE.PlaneGeometry(.35, 1.36, 2, 6), P = roof.attributes.position.array; for (let j = 0; j < P.length; j += 3) P[j + 2] = -Math.pow(P[j + 1] / .68, 2) * .12;
    roof.rotateX(-Math.PI / 2); roof.computeVertexNormals(); k.put(m, roof, x, 2.42, 0);
    const fr = new THREE.PlaneGeometry(.35, .28, 6, 2), F = fr.attributes.position.array; for (let j = 0; j < F.length; j += 3) if (F[j + 1] < 0) F[j + 1] -= Math.cos((F[j] / .175) * Math.PI / 2) * .06;
    k.put(m, fr, x, 2.18, .68);
  }
  k.cyl(MAT.brassAged, .022, .022, 2.2, 0, 2.31, .68, 10, 0, 0, Math.PI / 2);
  b.build(g);
  for (const x of [-.65, .65]) {
    const w = pivot(g, x, .38, .56);
    part(w, MAT.iron, sg('cartRim', () => new THREE.TorusGeometry(.36, .03, 6, 28)));
    part(w, MAT.varnishDark, sg('cartHub', () => tubeZ(.07, .07, .1, 12)));
    for (let i = 0; i < 8; i++) part(w, MAT.varnishDark, sg('cartSpoke', () => new THREE.CylinderGeometry(.014, .02, .34, 6).translate(0, .17, 0)), 0, 0, 0, 0, 0, i / 8 * TAU);
  }
  const items = [['spada', -.6], ['balestra', 0], ['lanterna', .6]];
  for (const [t, x] of items) { const w = weaponModel(t, 1); w.scale.setScalar(.7); w.rotation.set(-Math.PI / 2 + .25, .5, 0); w.position.set(x, 1.08, .1); g.add(w); }
  const bot = robotModel(); bot.position.set(0, 0, -.9); bot.scale.setScalar(1.25); g.add(bot); bot.children.filter(c => c.isLight).forEach(c => bot.remove(c)); // niente luci in più: cambierebbero gli shader a metà partita
  const hat = pivot(bot, .1, .74, .02); hat.rotation.z = -.25;
  part(hat, MAT.cFelt, sg('botHat', () => lathe([[0, .3], [.12, .3], [.12, .29], [.11, .06], [.18, .03], [.19, .015], [.11, 0], [0, 0]], 22)));
  part(hat, MAT.cRibbon, sg('botHatBand', () => lathe([[.112, .06], [.114, .1], [.112, .1]], 22)));
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
