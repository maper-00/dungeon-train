/* ================= ambienti ================= */
function newLevel(kind, x0, x1, z0, z1) {
  return { kind, x0, x1, z0, z1, len: x1 - x0, group: new THREE.Group(), obs: [], inter: [], tables: [], spawnPts: [], lights: [], movers: [], wheels: [], roofOpen: false, rainZ: 0, exit: null, fx: { lands: [] }, glass: [], spare: [], startYaw: Math.PI / 2, headY: 2.5 };
}
function addObs(L, x0, x1, z0, z1, h, kind = 'wall', walk = false) {
  const o = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), h, kind, walk }; L.obs.push(o); return o;
}
function addLight(L, x, y, z, col, k, dist, flick = 0) {
  const l = new THREE.PointLight(lin(col), k, dist, 2); l.position.set(x, y, z); L.group.add(l);
  L.lights.push({ l, base: k, flick, ph: Math.random() * 10 }); return l;
}
function addSpare(L) { const l = new THREE.PointLight(0x000000, 0, 1, 2); l.position.set(0, -20, 0); L.group.add(l); L.spare.push(l); return l; }
// pozza di luce finta sul pavimento (additiva, non costa luci in più)
const POOL_MATS = {};
function pool(L, x, z, r, col, op) {
  const k = col + '_' + op, mat = POOL_MATS[k] || (POOL_MATS[k] = new THREE.MeshBasicMaterial({ map: TEX.glow, color: lin(col), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const m = new THREE.Mesh(BLOB_GEO(), mat); m.position.set(x, .04, z); m.scale.setScalar(r / .7); m.renderOrder = 1; L.group.add(m); return m;
}
function plane(L, mat, w, h, x, y, z, rx = 0, ry = 0, recv = true) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); m.receiveShadow = recv; m.userData.own = true; L.group.add(m); return m;
}
function buildShell(L, hw) {
  const b = new Builder(), len = L.len;
  b.box(MAT.body, len / 2, -1.58, 0, len + .6, 1.5, hw * 2 + 1.2);
  b.box(MAT.brass, len / 2, -.14, hw + .62, len + .6, .07, .04);
  b.box(MAT.brass, len / 2, -1.1, hw + .62, len + .6, .05, .04);
  b.box(MAT.black, len / 2, -2.15, 0, len - 2, .65, hw * 2 - 1.2);
  for (const x of [3.2, len - 3.2]) b.box(MAT.steelDark, x, -2.25, 0, 3.4, .5, hw * 2 - .4);
  b.box(MAT.steelDark, -.95, -1.0, 0, 1.5, .35, .6); b.box(MAT.steelDark, len + .95, -1.0, 0, 1.5, .35, .6);
  b.box(MAT.black, -.8, -1.5, 0, 1.2, 4.6, 3.2); b.box(MAT.black, len + .8, -1.5, 0, 1.2, 4.6, 3.2);
  b.build(L.group);
  const wg = new THREE.CylinderGeometry(.55, .55, .22, 14).rotateX(Math.PI / 2);
  for (const x of [2.3, 4.1, len - 4.1, len - 2.3]) for (const z of [-hw - .1, hw + .1]) {
    const w = new THREE.Mesh(wg, MAT.wheel); w.position.set(x, -2.0, z); w.castShadow = true; L.group.add(w); L.wheels.push(w);
    const hub = new THREE.Mesh(boxGeo(.5, .1, .26), MAT.steel); w.add(hub);
  }
}
function neighborCar(L, xa, xb) {
  const b = new Builder(), cx = (xa + xb) / 2, w = xb - xa, hw = 6.5;
  b.box(MAT.body, cx, -1.5, 0, w, 5.9, hw * 2);
  b.box(MAT.roofMetal, cx, 4.4, 0, w + .2, .25, hw * 2 + .3); b.box(MAT.roofMetal, cx, 4.65, 0, w, .25, hw * 2 - 1.4); b.box(MAT.roofMetal, cx, 4.9, 0, w - .2, .2, hw * 2 - 3.6);
  b.box(MAT.woodDark, cx, 5.1, 0, w - 1, .06, 1.2);
  for (let x = xa + 3; x < xb - 2; x += 6) b.box(MAT.steelDark, x, 5.1, (Math.floor(x / 6) % 2 ? -2.6 : 2.6), 1.2, .45, 1.2);
  for (let x = xa + 2.2; x < xb - 2; x += 4) b.box(MAT.window, x, 1.1, hw + .01, 1.8, 1.3, .05);
  b.box(MAT.brass, cx, 2.9, hw + .03, w, .08, .04); b.box(MAT.brass, cx, -.2, hw + .03, w, .06, .04);
  b.build(L.group);
}
// colline dipinte lontane sui due lati: in prima persona si vedono dai finestrini, dietro pali e cespugli
function backdrops(L) {
  for (const sd of [-1, 1]) {
    const m = MAT.land.clone(); m.map = TEX.land.clone(); m.map.needsUpdate = true; m.map.repeat.set(1.5, 1); m.map.offset.x = sd > 0 ? .37 : 0;
    plane(L, m, 320, 46, L.len / 2, 10, sd * 65, 0, sd > 0 ? Math.PI : 0, false);
    L.fx.lands.push({ map: m.map, mat: m, dir: sd > 0 ? -1 : 1 });
  }
}
function buildOutside(L) {
  const G = L.group, len = L.len;
  backdrops(L);
  const ground = plane(L, MAT.ground, 420, 140, len / 2, -2.4, 0, -Math.PI / 2);
  TEX.gravel.repeat.set(105, 35);
  const b = new Builder();
  for (const tz of [0, 13]) for (const rz of [-1.0, 1.0]) b.box(MAT.steelDark, len / 2, -2.38, tz + rz, 420, .12, .14);
  b.build(G, false, true);
  const N = 300, sl = new THREE.InstancedMesh(boxGeo(.5, .1, 3.2), MAT.woodDark, N); sl.receiveShadow = true; sl.frustumCulled = false;
  const slots = []; for (let i = 0; i < N; i++) slots.push({ x: (i % 150) * 1.4 - 105 + len / 2, z: i < 150 ? 0 : 13, y: -2.42 });
  G.add(sl); L.movers.push({ mesh: sl, items: slots, span: 210, sx: 1, sy: 1, sz: 1 });
  // pali del telegrafo
  const poles = [];
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Group(); const far = i % 2 === 1;
    bx(p, MAT.woodDark, .22, 7.5, .22, 0, 3.75, 0); bx(p, MAT.woodDark, .14, .14, 2.0, 0, 7.1, 0); bx(p, MAT.woodDark, .12, .12, 1.4, 0, 6.5, 0);
    for (const z of [-.9, -.3, .3, .9]) bx(p, MAT.cream, .1, .14, .1, 0, 7.25, z * (z > 0 ? 1 : 1));
    p.traverse(o => { if (o.isMesh) { o.userData.cs = true; o.castShadow = !!Q.dyn; } });
    p.position.set(len / 2 - 120 + i * 24, -2.4, far ? -16 : 18); G.add(p); poles.push(p);
  }
  L.movers.push({ objs: poles, span: 240 });
  // cespugli e rocce
  const bushN = 70, bush = new THREE.InstancedMesh(boxGeo(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .95 }), bushN);
  bush.castShadow = !!Q.dyn; bush.userData.cs = true; bush.receiveShadow = true; bush.frustumCulled = false;
  const items = [], R = mulberry(77), cols = [0x1d2a1a, 0x24331f, 0x2c2a22, 0x1a2219, 0x3a3226].map(lin);
  for (let i = 0; i < bushN; i++) {
    let z = R() < .65 ? 8.6 + R() * 22 : -9 - R() * 20; if (Math.abs(z - 13) < 2.6) z += z > 13 ? 2.6 : -2.6;
    const s = .5 + R() * 1.6; items.push({ x: len / 2 - 120 + R() * 240, z, y: -2.4 + s * .4, sx: s * (1 + R()), sy: s * .8, sz: s * (1 + R() * .6) });
    bush.setColorAt(i, cols[i % cols.length]);
  }
  G.add(bush); L.movers.push({ mesh: bush, items, span: 240, scaled: true });
}
function updateMovers(L, dt) {
  const dx = TRAIN_SPEED * dt, cx = camTarget.x;
  TEX.gravel.offset.x += dx / 4;
  for (const m of L.movers) {
    if (m.objs) { for (const o of m.objs) { o.position.x -= dx; if (o.position.x < cx - m.span / 2) o.position.x += m.span; } continue; }
    for (let i = 0; i < m.items.length; i++) {
      const it = m.items[i]; it.x -= dx; if (it.x < cx - m.span / 2) it.x += m.span;
      _dummy.position.set(it.x, it.y, it.z); _dummy.rotation.set(0, 0, 0);
      if (m.scaled) _dummy.scale.set(it.sx, it.sy, it.sz); else _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix(); m.mesh.setMatrixAt(i, _dummy.matrix);
    }
    m.mesh.instanceMatrix.needsUpdate = true;
  }
  for (const w of L.wheels) w.rotation.z -= dx / .55;
  for (const l of L.fx.lands) l.map.offset.x += dt * .004 * l.dir;
  for (const g of L.glass) g.offset.y -= dt * .05;
}
function floorLeaves(L, n, seed, near) {
  const R = mulberry(seed), m = new THREE.InstancedMesh(new THREE.PlaneGeometry(.26, .18), MAT.leaf, n); m.receiveShadow = true;
  for (let i = 0; i < n; i++) {
    let x, z;
    if (R() < .55) { x = L.x0 + .5 + R() * (L.len - 1); z = (R() < .5 ? L.z0 + .3 + R() * 1.6 : L.z1 - .3 - R() * 1.4); }
    else if (near && R() < .5) { const p = pick(near); x = p[0] + (R() - .5) * 2.4; z = p[1] + (R() - .5) * 2.4; }
    else { x = L.x0 + .5 + R() * (L.len - 1); z = L.z0 + .4 + R() * (L.z1 - L.z0 - .8); }
    _dummy.position.set(x, .02 + R() * .012, z); _dummy.rotation.set(-Math.PI / 2 + (R() - .5) * .3, 0, R() * TAU); _dummy.scale.setScalar(.7 + R() * .7); _dummy.updateMatrix();
    m.setMatrixAt(i, _dummy.matrix); m.setColorAt(i, LEAF_COLS[Math.floor(R() * LEAF_COLS.length)].clone().multiplyScalar(.55 + R() * .4));
  }
  m.userData.own = true; L.group.add(m);
}

/* ---------- cabina letto (hub) ---------- */
function buildHub() {
  const L = newLevel('hub', 0, 18, -5.5, 5.5), G = L.group, b = new Builder(), WH = 4.6;
  L.name = 'Cabina letto'; L.tag = 'CABINA / 00'; L.wx = 'PIOGGIA SUI VETRI'; L.moonK = 1.0; L.hemiK = .5; L.obj = 'Prepara la corsa, poi apri la porta del Vagone 1';
  TEX.wood.repeat.set(4.5, 2.75);
  plane(L, MAT.woodFloor, 18, 11, 9, 0, 0, -Math.PI / 2);
  plane(L, MAT.rug, 6.4, 3.6, 8.8, .025, 1.0, -Math.PI / 2);
  buildShell(L, 5.5);
  // parete di fondo con finestra
  b.box(MAT.teal, 5.35, 0, -5.75, 10.7, WH, .5).box(MAT.teal, 15.65, 0, -5.75, 4.7, WH, .5).box(MAT.teal, 12, 0, -5.75, 2.6, 1.3, .5).box(MAT.teal, 12, 3.4, -5.75, 2.6, 1.2, .5);
  b.box(MAT.woodDark, 9, 0, -5.46, 18, 1.2, .08).box(MAT.brass, 9, 1.2, -5.44, 18, .06, .1).box(MAT.woodDark, 9, 4.35, -5.44, 18, .25, .14);
  for (const x of [3.05, 7.75, 10.45, 13.55, 16.9]) b.box(MAT.brass, x, 1.26, -5.47, .05, 3.1, .04);
  b.box(MAT.brass, 12, 1.22, -5.5, 2.8, .1, .14).box(MAT.brass, 12, 3.38, -5.5, 2.8, .1, .14).box(MAT.brass, 10.66, 1.3, -5.5, .1, 2.1, .14).box(MAT.brass, 13.34, 1.3, -5.5, .1, 2.1, .14).box(MAT.brass, 12, 1.3, -5.5, .06, 2.1, .08);
  const glassMat = MAT.glass.clone(); glassMat.map = TEX.glass.clone(); glassMat.map.needsUpdate = true; L.glass.push(glassMat.map);
  plane(L, glassMat, 2.6, 2.1, 12, 2.35, -5.58, 0, 0, false);
  // parete vicina intera (in prima persona non si taglia la sezione), con due finestrini sulla pioggia
  let nx = 0;
  for (const cx of [5.6, 12.2]) {
    const a = cx - 1.3, c = cx + 1.3;
    b.box(MAT.teal, (nx + a) / 2, 0, 5.75, a - nx, WH, .5).box(MAT.teal, cx, 0, 5.75, 2.6, 1.3, .5).box(MAT.teal, cx, 3.4, 5.75, 2.6, WH - 3.4, .5);
    b.box(MAT.brass, cx, 1.22, 5.5, 2.8, .1, .14).box(MAT.brass, cx, 3.38, 5.5, 2.8, .1, .14).box(MAT.brass, a - .04, 1.3, 5.5, .1, 2.1, .14).box(MAT.brass, c + .04, 1.3, 5.5, .1, 2.1, .14).box(MAT.brass, cx, 1.3, 5.5, .06, 2.1, .08);
    plane(L, glassMat, 2.6, 2.1, cx, 2.35, 5.58, 0, Math.PI, false);
    nx = c;
  }
  b.box(MAT.teal, (nx + 18) / 2, 0, 5.75, 18 - nx, WH, .5);
  b.box(MAT.woodDark, 9, 0, 5.46, 18, 1.2, .08).box(MAT.brass, 9, 1.2, 5.44, 18, .06, .1).box(MAT.woodDark, 9, 4.35, 5.44, 18, .25, .14);
  for (const x of [1.6, 9.0, 15.4]) b.box(MAT.brass, x, 1.26, 5.47, .05, 3.1, .04);
  // soffitto con travi di legno e due lampade a sospensione
  b.box(MAT.tealDark, 9, WH, 0, 18.6, .22, 12);
  for (let x = 1.5; x < 18; x += 3) b.box(MAT.woodDark, x, WH - .26, 0, .24, .26, 11);
  b.box(MAT.woodDark, 9, WH - .24, -5.32, 18, .24, .36).box(MAT.woodDark, 9, WH - .24, 5.32, 18, .24, .36);
  for (const x of [6.0, 12.6]) { b.box(MAT.brass, x, WH - .9, 0, .04, .64, .04).box(MAT.brass, x, WH - 1.06, 0, .56, .16, .56); bx(G, MAT.lamp, .36, .12, .36, x, WH - 1.14, 0, false); pool(L, x, 0, 3.4, 0xffb060, .12); }
  // pareti di testa
  b.box(MAT.teal, -.25, 0, 0, .5, WH, 12);
  b.box(MAT.teal, 18.25, 0, -3.3, .5, WH, 4.4).box(MAT.teal, 18.25, 0, 3.3, .5, WH, 4.4).box(MAT.teal, 18.25, 3.2, 0, .5, WH - 3.2, 2.2);
  b.box(MAT.brass, 18.0, 0, -1.15, .1, 3.25, .1).box(MAT.brass, 18.0, 0, 1.15, .1, 3.25, .1).box(MAT.brass, 18.0, 3.2, 0, .1, .1, 2.4);
  // ritratto del capotreno sulla parete sinistra
  b.box(MAT.brass, .04, 1.9, 1.6, .08, 1.5, 1.15).box(MAT.black, .09, 2.0, 1.6, .04, 1.3, .95).box(MAT.navy, .12, 2.55, 1.6, .03, .3, .52).box(MAT.cream, .12, 2.2, 1.6, .03, .34, .3).box(MAT.brass, .14, 2.62, 1.6, .02, .08, .1);
  // letto a castello
  for (const [x, z] of [[.4, -5.3], [4.5, -5.3], [.4, -3.5], [4.5, -3.5]]) b.box(MAT.woodDark, x, 0, z, .16, 3.1, .16);
  for (const y of [.36, 1.9]) { b.box(MAT.woodDark, 2.45, y, -4.4, 4.3, .14, 2.0); b.box(MAT.cream, 2.45, y + .14, -4.4, 4.1, .22, 1.8); b.box(MAT.cream, .95, y + .36, -4.4, .75, .16, 1.2); }
  for (let y = .5; y < 2.9; y += .42) b.box(MAT.woodDark, 4.2, y, -3.32, .5, .06, .06);
  b.box(MAT.woodDark, 3.95, 0, -3.32, .06, 2.9, .06).box(MAT.woodDark, 4.45, 0, -3.32, .06, 2.9, .06);
  b.box(MAT.velvet, 3.0, 2.1, -3.36, 1.6, 1.0, .05);
  b.box(MAT.leather, 1.5, 0, -4.3, 1.1, .32, .7).box(MAT.brass, 1.5, .1, -3.94, .3, .08, .04);
  addObs(L, .2, 4.65, -5.5, -3.25, 3.1);
  // libreria del bestiario
  b.box(MAT.woodDark, 6.25, 0, -5.42, 2.1, 3.3, .1).box(MAT.woodDark, 5.25, 0, -5.08, .1, 3.3, .8).box(MAT.woodDark, 7.25, 0, -5.08, .1, 3.3, .8);
  for (const y of [0, .8, 1.6, 2.4, 3.22]) b.box(MAT.woodDark, 6.25, y, -5.08, 2.1, .08, .8);
  const bookMats = [MAT.red, MAT.navy, MAT.green, MAT.purple, MAT.leather, MAT.cream, MAT.velvet], R = mulberry(12);
  for (const y of [.08, .88, 1.68, 2.48]) { let x = 5.36; while (x < 7.08) { const w = .07 + R() * .1, h = .42 + R() * .26; b.box(bookMats[Math.floor(R() * bookMats.length)], x + w / 2, y, -5.08, w, h, .5); x += w + .012; } }
  b.box(MAT.bone, 6.65, 3.3, -5.08, .3, .28, .3).box(MAT.boneDark, 6.6, 3.42, -4.93, .07, .06, .02).box(MAT.boneDark, 6.71, 3.42, -4.93, .07, .06, .02);
  b.box(MAT.woodDark, 6.25, 0, -4.1, .24, 1.0, .24).box(MAT.woodDark, 6.25, 0, -4.1, .6, .08, .5);
  const lect = new THREE.Group(); lect.position.set(6.25, 1.05, -4.1); lect.rotation.x = .45; G.add(lect);
  bx(lect, MAT.woodDark, .8, .06, .6, 0, 0, 0); bx(lect, MAT.paper, .34, .04, .48, -.18, .05, 0); bx(lect, MAT.paper, .34, .04, .48, .18, .05, 0);
  for (let i = 0; i < 4; i++) { bx(lect, MAT.bookGlow, .2, .01, .03, -.18, .075, -.15 + i * .1, false); bx(lect, MAT.bookGlow, .2, .01, .03, .18, .075, -.15 + i * .1, false); }
  addLight(L, 6.25, 1.8, -3.8, 0x52e0d0, 1.1, 4.2, .15);
  addObs(L, 5.2, 7.3, -5.5, -4.65, 3.3); addObs(L, 5.95, 6.55, -4.4, -3.8, 1.2);
  // armadio
  b.box(MAT.woodDark, 9.15, 0, -5.03, 2.3, 3.8, .95).box(MAT.wood, 8.6, .2, -4.53, 1.0, 3.3, .06).box(MAT.wood, 9.7, .2, -4.53, 1.0, 3.3, .06);
  for (const x of [8.6, 9.7]) { b.box(MAT.woodDark, x, .45, -4.49, .7, 1.2, .03).box(MAT.woodDark, x, 1.95, -4.49, .7, 1.3, .03); }
  b.box(MAT.brass, 9.08, 1.75, -4.47, .06, .2, .05).box(MAT.brass, 9.22, 1.75, -4.47, .06, .2, .05).box(MAT.woodDark, 9.15, 3.8, -5.0, 2.5, .16, 1.06);
  const scarf = new THREE.Mesh(boxGeo(.14, .7, .05), outfitMats[save.outfit][0]); scarf.position.set(9.15, 1.3, -4.47); scarf.castShadow = true; G.add(scarf); L.fx.scarf = scarf;
  addObs(L, 8.0, 10.3, -5.5, -4.5, 3.8);
  // slot machine
  b.box(MAT.slotRed, 14.6, 0, -5.05, 1.4, 1.0, .9).box(MAT.slotRed, 14.6, 1.0, -5.15, 1.3, 1.3, .7).box(MAT.brass, 14.6, 1.22, -4.79, 1.12, .74, .04);
  b.box(MAT.brass, 14.6, 2.3, -5.15, 1.44, .26, .76).box(MAT.brass, 14.6, .78, -4.6, .6, .06, .25).box(MAT.brass, 15.36, 1.2, -5.0, .08, .8, .08);
  const reels = [];
  for (let i = 0; i < 3; i++) { bx(G, MAT.slotGlow, .28, .52, .03, 14.24 + i * .36, 1.6, -4.76, false); const s = new THREE.Mesh(boxGeo(.14, .14, .03), MAT.red); s.position.set(14.24 + i * .36, 1.6, -4.74); G.add(s); reels.push(s); }
  L.fx.reels = reels; L.fx.reelMats = [emis(0xff8a80, 0xff3030, 2.5), emis(0xffe8a0, 0xffb020, 2.5), emis(0xa8d0ff, 0x3080ff, 2.5)];
  const knob = bx(G, emis(0xff8a80, 0xe02a2a, 1.5), .16, .16, .16, 15.36, 2.08, -5.0); L.fx.knob = knob;
  const bulbs = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(boxGeo(.08, .08, .04), MAT.lamp); m.position.set(14.0 + i * .2, 2.43, -4.76); G.add(m); bulbs.push(m); } L.fx.bulbs = bulbs;
  L.fx.slotLight = addLight(L, 14.6, 1.9, -4.0, 0xff6a4a, 1.3, 5);
  addObs(L, 13.9, 15.4, -5.5, -4.55, 2.6);
  // baule delle classi
  b.box(MAT.trunk, 14.4, 0, 2.6, 1.9, .8, 1.1).box(MAT.trunk, 14.4, .8, 2.6, 1.95, .2, 1.15).box(MAT.brass, 13.75, 0, 2.6, .08, 1.02, 1.17).box(MAT.brass, 15.05, 0, 2.6, .08, 1.02, 1.17).box(MAT.brass, 14.4, .55, 2.03, .18, .22, .06);
  b.box(MAT.steel, 14.05, 1.0, 2.6, .16, .08, .16).box(MAT.green, 14.4, 1.0, 2.6, .16, .08, .16).box(MAT.purple, 14.75, 1.0, 2.6, .16, .08, .16);
  addObs(L, 13.45, 15.35, 2.03, 3.17, 1.0, 'crate', true);
  // tavolino, poltrona, candela
  b.box(MAT.woodDark, 4.6, 0, 1.8, .16, .75, .16).box(MAT.woodDark, 4.6, 0, 1.8, .6, .06, .6).box(MAT.wood, 4.6, .75, 1.8, 1.1, .08, 1.1).box(MAT.cream, 4.4, .83, 1.6, .1, .22, .1).box(MAT.white, 4.85, .83, 2.0, .14, .1, .14);
  bx(G, MAT.lamp, .05, .08, .05, 4.4, 1.1, 1.6, false);
  b.box(MAT.velvet, 3.0, 0, 2.7, 1.1, .5, 1.0).box(MAT.velvet, 3.0, .5, 3.12, 1.1, .9, .22).box(MAT.velvetDark, 2.5, 0, 2.7, .18, .78, 1.0).box(MAT.velvetDark, 3.5, 0, 2.7, .18, .78, 1.0);
  addObs(L, 4.05, 5.15, 1.25, 2.35, .83, 'table', true); addObs(L, 2.4, 3.6, 2.2, 3.25, .55, 'seat', true);
  addLight(L, 4.4, 1.5, 1.6, 0xffad5a, 2.2, 10, .3);
  pool(L, 4.4, 1.7, 3.2, 0xffa050, .2); pool(L, 7.75, -4.2, 2.6, 0xffa860, .16); pool(L, 16.9, -4.2, 2.6, 0xffa860, .16); pool(L, 14.6, -3.7, 2.0, 0xff6a50, .16); pool(L, 6.25, -3.5, 1.6, 0x52e0d0, .14); pool(L, 17.1, 0, 1.6, 0x7af0a0, .1);
  // applique e altoparlante del capotreno
  for (const x of [7.75, 16.9]) { b.box(MAT.brass, x, 2.6, -5.4, .14, .3, .16); bx(G, MAT.lamp, .16, .22, .14, x, 3.0, -5.3, false); addLight(L, x, 3.0, -4.9, 0xffb060, 1.5, 8, .1); }
  b.box(MAT.brass, 16.2, 3.5, -5.44, .6, .4, .06); for (let i = 0; i < 3; i++) b.box(MAT.black, 16.2, 3.58 + i * .1, -5.4, .46, .03, .02);
  // orologio
  b.box(MAT.brass, 12, 3.75, -5.46, .6, .5, .06).box(MAT.cream, 12, 3.8, -5.42, .48, .4, .02).box(MAT.black, 12.05, 3.98, -5.405, .03, .18, .01);
  // porta verso il Vagone 1
  const door = new THREE.Group(); door.position.set(18.0, 0, 0); G.add(door);
  const leafA = bx(door, MAT.wood, .12, 3.15, 1.1, 0, 1.58, -.55), leafB = bx(door, MAT.wood, .12, 3.15, 1.1, 0, 1.58, .55);
  for (const lf of [leafA, leafB]) { bx(lf, MAT.black, .14, .7, .6, 0, .55, 0); bx(lf, MAT.brass, .16, .05, .9, 0, -.2, 0); }
  L.exit = { x: 17.3, z: 0, leaves: [leafA, leafB], open: 0, target: 0 };
  const sign = plane(L, new THREE.MeshStandardMaterial({ map: signTexture('VAGONE 1', 'CARROZZA PASSEGGERI'), roughness: .5, emissive: lin(0x3a2a10), emissiveIntensity: .6 }), 1.6, .6, 17.92, 3.75, 0, 0, -Math.PI / 2, false);
  bx(G, MAT.neonGreen, .06, .1, .5, 17.95, 4.2, 0, false); addLight(L, 17.6, 4.0, 0, 0x7af0a0, .7, 3.5);
  addObs(L, -1, 0, -6, 6, 9); addObs(L, 18, 19, -6, 6, 9); addObs(L, -1, 19, -7, -5.5, 9); addObs(L, -1, 19, 5.5, 7, 9);
  b.build(G);
  shaft(G, 12, 3.3, -5.45, 2.4, 6.2, 0, -.62, .085);
  shaft(G, 11.6, 3.3, -5.45, 1.2, 5.4, .1, -.5, .05, 0xffe0b8);
  buildOutside(L);
  neighborCar(L, -31, -.95); neighborCar(L, 18.95, 51);
  L.inter = [
    { id: 'bed', x: 2.4, z: -2.7, r: 1.7, label: 'Letto', desc: 'Riposa un momento' },
    { id: 'bestiary', x: 6.25, z: -3.3, r: 1.4, label: 'Bestiario', desc: 'Creature incontrate, punti deboli e storia' },
    { id: 'wardrobe', x: 9.15, z: -3.85, r: 1.5, label: 'Armadio', desc: 'Cambia il colore dell\'abito' },
    { id: 'slot', x: 14.6, z: -3.95, r: 1.5, label: 'Slot machine', desc: 'Un\'arma a caso per 25 monete' },
    { id: 'trunk', x: 14.4, z: 1.55, r: 1.6, label: 'Baule delle classi', desc: 'Cambia classe' },
    { id: 'door', x: 17.2, z: 0, r: 1.7, label: 'Vagone 1', desc: 'Carrozza passeggeri · 10 vagoni fino alla locomotiva' }
  ];
  L.start = { x: 6.6, z: 1.2 }; L.startYaw = Math.PI - .45; L.headY = 2.55;
  return L;
}

/* ---------- Vagone 1: carrozza passeggeri con il tetto squarciato ---------- */
function buildPassenger() {
  const len = 64, hw = 6, L = newLevel('wagon', 0, len, -hw, hw), G = L.group, b = new Builder(), WH = 4.2;
  wagonInfo(L, 1); L.roofOpen = true; L.rainZ = 3.7; L.moonK = .8; L.hemiK = .38; L.spawnMode = 'roof'; L.dropY = 7.5;
  TEX.stone.map.repeat.set(16, 3); TEX.stone.rough.repeat.set(16, 3); TEX.stone.bump.repeat.set(16, 3);
  plane(L, MAT.stoneFloor, len, hw * 2, len / 2, 0, 0, -Math.PI / 2);
  buildShell(L, hw);
  // parete di fondo con finestrini
  let px = 0; const wins = [];
  for (let k = 0; k < 8; k++) wins.push(4 + 8 * k);
  for (const cx of wins) {
    const a = cx - 1.3, c = cx + 1.3;
    b.box(MAT.teal, (px + a) / 2, 0, -hw - .25, a - px, WH, .5);
    b.box(MAT.teal, cx, 0, -hw - .25, 2.6, 1.4, .5).box(MAT.teal, cx, 3.2, -hw - .25, 2.6, WH - 3.2, .5);
    b.box(MAT.brass, cx, 1.36, -hw, 2.8, .1, .14).box(MAT.brass, cx, 3.18, -hw, 2.8, .1, .14).box(MAT.brass, a - .05, 1.4, -hw, .1, 1.8, .14).box(MAT.brass, c + .05, 1.4, -hw, .1, 1.8, .14);
    bx(G, MAT.neon, .05, 1.6, .04, a - .35, 2.3, -hw + .04, false); bx(G, MAT.neon, .05, 1.6, .04, c + .35, 2.3, -hw + .04, false);
    px = c;
  }
  b.box(MAT.teal, (px + len) / 2, 0, -hw - .25, len - px, WH, .5);
  const glassMat = MAT.glass.clone(); glassMat.map = TEX.glass.clone(); glassMat.map.needsUpdate = true; glassMat.map.repeat.set(1, 1); L.glass.push(glassMat.map);
  for (const cx of wins) plane(L, glassMat, 2.6, 1.8, cx, 2.3, -hw - .08, 0, 0, false);
  b.box(MAT.woodDark, len / 2, 0, -hw + .04, len, 1.2, .08).box(MAT.brass, len / 2, 1.2, -hw + .06, len, .06, .1).box(MAT.woodDark, len / 2, WH - .2, -hw + .06, len, .22, .14);
  // applique tra i finestrini
  for (let k = 1; k < 8; k++) { const x = 8 * k; b.box(MAT.brass, x, 2.4, -hw + .08, .16, .34, .16); bx(G, MAT.lamp, .18, .24, .16, x, 2.92, -hw + .2, false); if (k % 2) addLight(L, x, 2.9, -hw + .8, 0xffb060, 2.6, 11, .12); }
  // portabagagli con valigie
  const R = mulberry(31), bagMats = [MAT.leather, MAT.trunk, MAT.navy, MAT.velvetDark, MAT.green];
  for (const [xa, xb] of [[5.6, 9.6], [21.6, 25.6], [37.6, 41.6], [53.6, 57.6]]) {
    b.box(MAT.brass, (xa + xb) / 2, 3.1, -hw + .55, xb - xa, .06, .06).box(MAT.brass, (xa + xb) / 2, 3.1, -hw + .95, xb - xa, .06, .06);
    let x = xa + .2; while (x < xb - .6) { const w = .5 + R() * .7; b.box(pick(bagMats), x + w / 2, 3.16, -hw + .75, w, .3 + R() * .3, .7); x += w + .15; }
  }
  // parete vicina intera con finestrini e due squarci: da lì entrano vento e foglie
  const holes = [20, 44]; let qx = 0;
  for (const cx of wins) {
    const hole = holes.includes(cx), hw2 = hole ? 2.2 : 1.3, a = cx - hw2, c = cx + hw2;
    b.box(MAT.teal, (qx + a) / 2, 0, hw + .25, a - qx, WH, .5);
    if (hole) {
      b.box(MAT.teal, cx, 0, hw + .25, hw2 * 2, .45, .5).box(MAT.teal, cx, 3.55, hw + .25, hw2 * 2, WH - 3.55, .5);
      // lamiere strappate lungo i bordi dello squarcio
      for (let i = 0; i < 9; i++) {
        const side = i % 3, t = R();
        const m = new THREE.Mesh(boxGeo(.18 + R() * .5, .1 + R() * .4, .06 + R() * .08), R() < .7 ? MAT.teal : MAT.roofMetal);
        if (side === 0) m.position.set(a + R() * .3, .5 + t * 3, hw + .1 + R() * .3); else if (side === 1) m.position.set(c - R() * .3, .5 + t * 3, hw + .1 + R() * .3); else m.position.set(a + t * hw2 * 2, R() < .5 ? .5 + R() * .2 : 3.4 + R() * .2, hw + .1 + R() * .3);
        m.rotation.set(R() - .5, R() * .8 - .4, R() * 3); m.castShadow = true; G.add(m);
      }
      for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(boxGeo(.5 + R() * .4, .1, .3), MAT.teal); m.position.set(cx - 1.5 + R() * 3, .05, hw - .5 - R() * 1.2); m.rotation.set(R() * .3, R() * 3, R() * .3); m.castShadow = true; m.receiveShadow = true; G.add(m); }
    } else {
      b.box(MAT.teal, cx, 0, hw + .25, 2.6, 1.4, .5).box(MAT.teal, cx, 3.2, hw + .25, 2.6, WH - 3.2, .5);
      b.box(MAT.brass, cx, 1.36, hw, 2.8, .1, .14).box(MAT.brass, cx, 3.18, hw, 2.8, .1, .14).box(MAT.brass, a - .05, 1.4, hw, .1, 1.8, .14).box(MAT.brass, c + .05, 1.4, hw, .1, 1.8, .14);
      bx(G, MAT.neon, .05, 1.6, .04, a - .35, 2.3, hw - .04, false); bx(G, MAT.neon, .05, 1.6, .04, c + .35, 2.3, hw - .04, false);
      plane(L, glassMat, 2.6, 1.8, cx, 2.3, hw + .08, 0, Math.PI, false);
    }
    qx = c;
  }
  b.box(MAT.teal, (qx + len) / 2, 0, hw + .25, len - qx, WH, .5);
  for (const [xa, xb] of [[0, 17.8], [22.2, 41.8], [46.2, len]]) b.box(MAT.woodDark, (xa + xb) / 2, 0, hw - .04, xb - xa, 1.2, .08).box(MAT.brass, (xa + xb) / 2, 1.2, hw - .06, xb - xa, .06, .1);
  b.box(MAT.woodDark, len / 2, WH - .2, hw - .06, len, .22, .14);
  // applique spente sulla parete vicina (solo lampadine, nessuna luce in più)
  for (let k = 1; k < 8; k++) { const x = 8 * k; b.box(MAT.brass, x, 2.4, hw - .08, .16, .34, .16); bx(G, MAT.lamp, .18, .24, .16, x, 2.92, hw - .2, false); if (k % 2) pool(L, x, hw - 1.6, 2.6, 0xffa050, .12); }
  // tetto squarciato: costole intere (una spezzata), lamiere rimaste lungo i lati, centro aperto sul cielo
  for (let k = 1; k < 8; k++) {
    const x = 8 * k;
    if (k === 3) {
      b.box(MAT.roofMetal, x, WH + .1, -hw - .3, .3, .3, 4.2);
      const m = new THREE.Mesh(boxGeo(.3, .3, 3.2), MAT.roofMetal); m.position.set(x, WH - .55, -hw + 4.6); m.rotation.x = .55; m.castShadow = true; G.add(m);
      b.box(MAT.roofMetal, x, WH + .1, hw - 1.3, .3, .3, 3.2);
    } else b.box(MAT.roofMetal, x, WH + .1, 0, .3, .3, hw * 2 + .6);
    b.box(MAT.roofMetal, x, WH - .55, -hw + .12, .3, .65, .24).box(MAT.roofMetal, x, WH - .55, hw - .12, .3, .65, .24);
  }
  for (const [xa, xb, zz, sd] of [[0, 18, 2.4, -1], [26, 33, 1.9, -1], [46, 64, 2.3, -1], [0, 9, 2.2, 1], [13, 30, 2.5, 1], [36, 52, 2.0, 1], [56, 64, 2.4, 1]]) {
    b.box(MAT.roofMetal, (xa + xb) / 2, WH + .4, sd * (hw + .5 - zz / 2), xb - xa, .12, zz);
    b.box(MAT.steelDark, (xa + xb) / 2, WH + .3, sd * (hw + .5 - zz + .1), xb - xa, .1, .2);
  }
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(boxGeo(1.4 + R() * 1.2, .08, .9 + R() * .6), MAT.roofMetal); const sd = i % 2 ? 1 : -1; m.position.set(12 + i * 10 + R() * 3, WH + .1, sd * (hw - 2.7)); m.rotation.set(sd * (.35 + R() * .3), R() * .4, R() * .3 - .15); m.castShadow = true; G.add(m); }
  // pareti di testa con porte
  for (const ex of [0, len]) {
    const s = ex === 0 ? -1 : 1;
    b.box(MAT.teal, ex + s * .25, 0, -3.55, .5, WH, 4.9).box(MAT.teal, ex + s * .25, 0, 3.55, .5, WH, 4.9).box(MAT.teal, ex + s * .25, 3.2, 0, .5, WH - 3.2, 2.2);
    b.box(MAT.brass, ex - s * .02, 0, -1.15, .1, 3.25, .1).box(MAT.brass, ex - s * .02, 0, 1.15, .1, 3.25, .1).box(MAT.brass, ex - s * .02, 3.2, 0, .1, .1, 2.4);
  }
  b.box(MAT.wood, .05, 0, 0, .12, 3.15, 2.2).box(MAT.black, .12, 1.6, 0, .04, .7, 1.4);
  const door = new THREE.Group(); door.position.set(len, 0, 0); G.add(door);
  const leafA = bx(door, MAT.wood, .12, 3.15, 1.1, 0, 1.58, -.55), leafB = bx(door, MAT.wood, .12, 3.15, 1.1, 0, 1.58, .55);
  for (const lf of [leafA, leafB]) { bx(lf, MAT.black, .14, .7, .6, 0, .55, 0); bx(lf, MAT.brass, .16, .05, .9, 0, -.2, 0); }
  const lamp = bx(G, MAT.neonRed, .06, .12, .6, len - .08, 3.5, 0, false);
  const lampL = addLight(L, len - .6, 3.4, 0, 0xff4a3a, 1.4, 5);
  L.exit = { x: len - .9, z: 0, leaves: [leafA, leafB], open: 0, target: 0, lamp, lampL };
  plane(L, new THREE.MeshStandardMaterial({ map: signTexture('VAGONE 2', WAGONS[1].sign), roughness: .5, emissive: lin(0x3a2a10), emissiveIntensity: .6 }), 1.6, .6, len - .08, 4.0 - .05, 0, 0, -Math.PI / 2, false).position.y = 3.85;
  addLight(L, 1.2, 3.0, 0, 0xffb060, 1.2, 6);
  for (let k = 1; k < 8; k++) pool(L, 8 * k, -hw + 1.6, k % 2 ? 3.8 : 2.4, 0xffa050, k % 2 ? .22 : .13);
  pool(L, len - 1.2, 0, 2.4, 0xff4a3a, .16); pool(L, 1.4, 0, 2.2, 0xffb060, .14);
  for (const [x, z] of [[20.5, -1], [40, -1], [36.5, .5]]) pool(L, x, z, 3, 0x9fb6d8, .08);
  // panche di velluto
  const benches = [[6, 9.2, -1], [22, 25.2, -1], [38, 41.2, -1], [54, 57.2, -1], [14, 17.2, 1], [30, 33.2, 1], [46, 49.2, 1]];
  for (const [xa, xb, sd] of benches) {
    const cx = (xa + xb) / 2, w = xb - xa, zc = sd * (hw - 1.05), zb = sd * (hw - .2);
    b.box(MAT.woodDark, cx, 0, zc, w, .45, 1.2).box(MAT.cushion, cx, .45, zc, w - .06, .3, 1.25).box(MAT.cushion, cx, .45, zb, w - .06, 1.35, .3).box(MAT.woodDark, cx, 1.8, zb, w + .1, .1, .36);
    b.box(MAT.brass, cx, .44, zc - sd * .64, w, .04, .04);
    for (let x = xa + .8; x < xb; x += .8) b.box(MAT.velvetDark, x, .76, zb - sd * .16, .04, 1.0, .02);
    addObs(L, xa, xb, zc - .62, zc + .62, .75, 'seat', true); addObs(L, xa, xb, Math.min(zb - .15, sd * hw), Math.max(zb + .15, sd * hw), 1.85, 'back');
  }
  // casse e bagagli ammucchiati
  const piles = [[2.6, -4.5, [[1.5, .9, 1.1], [1.0, .55, .8]]], [26.6, 4.6, [[2.0, 1.1, 1.2], [1.2, .6, .9]]], [45, -4.7, [[1.6, 1.0, 1.0], [1.0, .5, .8]]], [60.6, 4.5, [[2.2, 1.2, 1.3], [1.3, .5, .9]]]];
  for (const [x, z, parts] of piles) {
    let y = 0; parts.forEach(([w, h, d], i) => { b.box(i ? pick(bagMats) : MAT.wood, x + (i ? .15 : 0), y, z, w, h, d); if (!i) { b.box(MAT.woodDark, x, 0, z + d / 2 + .01, w + .02, h, .04); b.box(MAT.brass, x, h * .45, z + d / 2 + .03, w * .9, .06, .03); } y += h; });
    const [w0, , d0] = parts[0]; addObs(L, x - w0 / 2, x + w0 / 2, z - d0 / 2, z + d0 / 2, y, 'crate', true);
  }
  // detriti
  for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(boxGeo(.3 + R() * .9, .06, .14 + R() * .2), R() < .5 ? MAT.woodDark : MAT.roofMetal); m.position.set(18 + R() * 30, .03, -3 + R() * 6); m.rotation.y = R() * 3; m.castShadow = true; m.receiveShadow = true; G.add(m); }
  // tavoli ribaltabili
  for (const [x, z] of [[11.5, -1.6], [19.2, 2.2], [27.6, -.8], [35.2, 2.4], [43.6, -2.0], [51.2, 1.4], [59.0, -1.3]]) {
    const m = tableModel(); m.traverse(o => { if (o.userData.cs) { o.userData.cs = false; o.castShadow = true; } }); m.position.set(x, 0, z); G.add(m);
    const ob = addObs(L, x - .72, x + .72, z - .72, z + .72, .9, 'table', true);
    L.tables.push({ x, z, model: m, ob, state: 'up', hp: 3, cover: null, t: 0 });
  }
  addObs(L, -1, 0, -7, 7, 9); addObs(L, len, len + 1, -7, 7, 9); addObs(L, -1, len + 1, -7.5, -hw, 9); addObs(L, -1, len + 1, hw, 7.5, 9);
  b.build(G);
  for (const [x, w] of [[20.5, 3.2], [40, 4.2], [36.5, 2.4]]) shaft(G, x, 9, -2.2, w, 11, 0, -.55, .06);
  floorLeaves(L, 420, 5, [[21, 5.2], [44.6, 5.2], [40, 0], [20.5, 0], [2, 4], [62, -4]]);
  buildOutside(L);
  neighborCar(L, -31.9, -.95); neighborCar(L, len + .95, len + 32);
  for (let x = 6; x < len - 4; x += 2.4) for (const z of [-3.2, -1, 1.2, 3.4]) { if (!insideAny(L, x, z, .7)) L.spawnPts.push([x, z]); }
  addSpare(L); addSpare(L);
  L.inter = [{ id: 'exit', x: len - .9, z: 0, r: 1.8, label: 'Vagone 2', desc: WAGONS[1].name }];
  L.start = { x: 3.0, z: .6 }; L.startYaw = Math.PI / 2; L.headY = 2.45;
  return L;
}
function insideAny(L, x, z, pad) { for (const o of L.obs) if (x > o.x0 - pad && x < o.x1 + pad && z > o.z0 - pad && z < o.z1 + pad) return true; return false; }
