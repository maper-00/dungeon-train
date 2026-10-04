/* ================= prima persona: sguardo, telecamera, mani e arma ================= */
// yaw segue la convenzione del gioco: avanti = (sin yaw, cos yaw) sul piano x/z
const LOOK = {
  yaw: Math.PI / 2, pitch: -.06, eye: 1.62, eyeNow: 1.62, bobT: 0, bob: 0, land: 0, landK: 1, roll: 0, kick: 0, fovKick: 0,
  locked: false, canLock: true, lockOk: false, lockErr: 0, release: false, unlockT: -1e9, lockT: -1e9, fallback: false,
  swayX: 0, swayY: 0, lastYaw: 0, lastPitch: 0, stepT: 0, deadT: 0
};
const SENS = { bassa: .55, media: 1, alta: 1.6 };
function lookBy(dx, dy, k) { LOOK.yaw -= dx * k; LOOK.pitch = clamp(LOOK.pitch - dy * k, -1.4, 1.4); }
const _fw = new THREE.Vector3(), _ep = new THREE.Vector3();
function viewDir(out = _fw) { const cp = Math.cos(LOOK.pitch); return out.set(Math.sin(LOOK.yaw) * cp, Math.sin(LOOK.pitch), Math.cos(LOOK.yaw) * cp); }
function eyePos(out = _ep) { return out.set(p.x, p.y + LOOK.eyeNow, p.z); }
// un punto davanti agli occhi, per i testi che riguardano il giocatore (PARRY!, +1)
function frontPt(d = 2, up = .25) { const f = viewDir(new THREE.Vector3()); return { x: p.x + f.x * d, y: p.y + LOOK.eyeNow + f.y * d + up, z: p.z + f.z * d }; }

// campo visivo: circa 92° in orizzontale sugli schermi larghi, più stretto in verticale sui telefoni
function fpFov() {
  const asp = innerWidth / Math.max(1, innerHeight), h = 92 * Math.PI / 180;
  return clamp(2 * Math.atan(Math.tan(h / 2) / asp) * 180 / Math.PI, 56, 84);
}
let FOV = 64;
function updateView() {
  FOV = fpFov(); camera.fov = FOV; camera.updateProjectionMatrix();
}
addEventListener('resize', updateView);

// mouse libero: -1..1, positivo quando il puntatore è sul bordo sinistro
function edgeTurn() {
  if (!LOOK.fallback || LOOK.locked || isTouch || !mouse.in || performance.now() - mouse.t > 20000) return 0;
  const a = Math.abs(mouse.nx); return a > .86 ? -Math.sign(mouse.nx) * Math.min(1, (a - .86) / .12) : 0;
}

/* ---------- telecamera ---------- */
const _tmpV = new THREE.Vector3();
function setCam(x, y, z, yaw, pitch, roll = 0) {
  camera.position.set(x, y, z);
  camera.rotation.set(pitch, yaw + Math.PI, roll, 'YXZ');
}
function updateFPCamera(dt) {
  // titolo: carrellata lenta nella cabina, all'altezza degli occhi
  if (STATE === 'title' || STATE === 'starting' || !p || !level) {
    const t = T * .07, x = 2.4 + Math.sin(t) * .7, y = 2.05 + Math.sin(t * 1.7) * .05, z = 4.3;
    const tx = 11.5 + Math.sin(t * .8) * 2.2, ty = 1.25, tz = -3.2;
    const yaw = Math.atan2(tx - x, tz - z), pitch = Math.atan2(ty - y, Math.hypot(tx - x, tz - z));
    setCam(x, y, z, yaw, pitch);
    camTarget.set(x + Math.sin(yaw) * 6, 0, z + Math.cos(yaw) * 6);
    camera.updateMatrixWorld(); placeMoon(camTarget); return;
  }
  // occhi: si abbassano in scivolata, cadono a terra quando si muore
  let want = p.slideT > 0 ? .95 : 1.62;
  if (p.dead) { LOOK.deadT += dt; want = .32; }
  LOOK.eyeNow += (want - LOOK.eyeNow) * Math.min(1, dt * (p.dead ? 3 : 12));
  // dondolio della camminata
  const spd = Math.hypot(p.vx, p.vz), moving = p.onGround && spd > 1.2 && p.slideT <= 0 && !p.dead;
  if (moving) {
    const step0 = Math.floor(LOOK.bobT / Math.PI); LOOK.bobT += dt * (5.2 + spd * .9);
    if (Math.floor(LOOK.bobT / Math.PI) !== step0) sfx('step');
  }
  LOOK.bob += ((moving ? Math.min(1, spd / 5) : 0) - LOOK.bob) * Math.min(1, dt * 8);
  const bobY = Math.abs(Math.sin(LOOK.bobT)) * .055 * LOOK.bob, bobX = Math.cos(LOOK.bobT) * .035 * LOOK.bob;
  LOOK.land = Math.max(0, LOOK.land - dt * .9);
  const landY = Math.sin(Math.min(1, LOOK.land / .22) * Math.PI) * .16 * LOOK.landK;
  // inclinazione: scivolata, morte, scossoni
  const rollWant = p.dead ? Math.min(.55, LOOK.deadT * .9) : p.slideT > 0 ? .09 : 0;
  LOOK.roll += (rollWant - LOOK.roll) * Math.min(1, dt * 8);
  LOOK.kick = Math.max(0, LOOK.kick - dt * 6);
  const s = shake * shake; shake = Math.max(0, shake - dt * 2.4);
  const sy = rnd(-1, 1) * s * .035, sp = rnd(-1, 1) * s * .03;
  const rx = -Math.cos(LOOK.yaw), rz = Math.sin(LOOK.yaw); // destra
  setCam(p.x + rx * bobX, p.y + LOOK.eyeNow + bobY - landY, p.z + rz * bobX, LOOK.yaw + sy, LOOK.pitch + sp + LOOK.kick * .05, LOOK.roll + bobX * .25);
  // un po' di grandangolo in scivolata e negli scatti
  const fk = p.slideT > 0 ? 7 : 0; LOOK.fovKick += (fk - LOOK.fovKick) * Math.min(1, dt * 7);
  const f = FOV + LOOK.fovKick; if (Math.abs(camera.fov - f) > .01) { camera.fov = f; camera.updateProjectionMatrix(); }
  // il centro dell'azione (pioggia, ombre, paesaggio) sta qualche metro davanti
  camTarget.set(p.x + Math.sin(LOOK.yaw) * 7, 0, p.z + Math.cos(LOOK.yaw) * 7);
  camera.updateMatrixWorld(); placeMoon(camTarget);
}

/* ---------- mani e arma in primo piano ---------- */
// il modello vive vicino alla telecamera (scala .3): resta davanti al mondo anche contro una parete.
// Le pose sono direzioni nello spazio della telecamera (x destra, y su, -z avanti): braccio e arma vi si orientano.
const VM = { root: null, key: '', u: null, sx: 0, sy: 0, atkSide: 1, recoil: 0, post: 0, postSide: 1, wasAtk: false, tp: [], fire: 0 };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const Z_NEG = V3(0, 0, -1), _va = V3(0, 0, 0), _vd = V3(0, 0, 0), _vh = V3(0, 0, 0), _vn = V3(0, 0, 0), _vq = new THREE.Quaternion(), _vr = new THREE.Quaternion();
function vmBox(parent, mat, w, h, d, x, y, z) { const m = new THREE.Mesh(boxGeo(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; }
function cuffMat(cls) { return cls === 'cavaliere' ? MAT.steel : cls === 'ranger' ? MAT.leather : MAT.brass; }
const ARM = .78; // dalla spalla al centro della mano
function buildArm(root, side, om, cls) {
  // la manica sta in un gruppo a parte: si allunga quando la mano deve arrivare più lontano
  const sh = pivot(root, side * .5, -.6, .12), sl = pivot(sh, 0, 0, 0);
  vmBox(sl, om[0], .16, .16, .66, 0, 0, -.33);
  vmBox(sl, om[1], .18, .18, .08, 0, 0, -.1);
  vmBox(sl, cuffMat(cls), .18, .18, .13, 0, 0, -.62);
  if (cls === 'cavaliere') vmBox(sl, MAT.steelDark, .19, .045, .24, 0, .095, -.48);
  const hand = pivot(sh, 0, 0, -ARM), skin = cls === 'cavaliere' ? MAT.steelDark : MAT.skin;
  vmBox(hand, skin, .14, .15, .15, 0, 0, 0);
  vmBox(hand, skin, .05, .06, .12, -side * .085, .04, -.03);
  // nocche e dita chiuse sull'impugnatura
  for (let i = 0; i < 4; i++) { vmBox(hand, skin, .032, .04, .05, (i - 1.5) * .034, .065, -.06); vmBox(hand, skin, .032, .05, .04, (i - 1.5) * .034, -.02, -.085); }
  if (cls === 'cavaliere') vmBox(hand, MAT.steel, .15, .03, .16, 0, .085, .01);
  const grip = new THREE.Group(); hand.add(grip);
  return { sh, sl, hand, grip, base: sh.position.clone() };
}
// orienta il braccio lungo a e l'arma che tiene lungo d (roll: rotazione dell'arma sul proprio asse)
function aimArm(A, a, d, roll = 0, len = ARM) {
  A.sh.quaternion.setFromUnitVectors(Z_NEG, _va.copy(a).normalize());
  A.sl.scale.z = len / ARM; A.hand.position.z = -len;
  if (!d) return;
  _vq.setFromUnitVectors(Z_NEG, _vd.copy(d).normalize());
  if (roll) _vq.multiply(_vr.setFromAxisAngle(Z_NEG, roll));
  A.grip.quaternion.copy(A.sh.quaternion).invert().multiply(_vq);
}
const handAt = (A, a, out) => out.copy(a).normalize().multiplyScalar(ARM).add(A.sh.position);
// lunghezza utile della lama per la scia del fendente
const VMS = { spada: .62, sciabola: .64, ascia: .66, pugnale: .8, lancia: .5, martello: .58, falce: .5, bastone: .6, arco: .68, balestra: .74, trombone: .86, tomo: .72, lanterna: .8 };
const REACHL = t => [(WTIP[t] || 1) * (VMS[t] || .62), (WTIP[t] || 1) * .38 * (VMS[t] || .62)];
function buildViewModel() {
  if (VM.root) camera.remove(VM.root);
  const om = outfitMats[save.outfit] || outfitMats[0], cls = p.cls.id, w = p.weapon, kind = WT[w.type].kind;
  const root = new THREE.Group(); root.scale.setScalar(.3); camera.add(root);
  const R = buildArm(root, 1, om, cls), L = buildArm(root, -1, om, cls);
  const wm = weaponModel(w.type, w.rar); wm.scale.setScalar(VMS[w.type] || .62);
  let arrow = null, strA = null, strB = null;
  if (w.type === 'arco') {
    // arco verticale nella sinistra: la pancia (+z del modello) guarda avanti, la lunghezza (x) va in verticale
    wm.rotation.set(0, Math.PI, -Math.PI / 2, 'ZYX'); L.grip.add(wm);
    wm.traverse(o => { if (o.isMesh && o.material === MAT.cream) o.visible = false; });
    strA = vmBox(wm, MAT.cream, 1, .018, .018, 0, 0, 0); strB = vmBox(wm, MAT.cream, 1, .018, .018, 0, 0, 0);
    arrow = new THREE.Group(); vmBox(arrow, MAT.cream, .04, .04, .92, 0, 0, .46); vmBox(arrow, MAT.steel, .08, .08, .14, 0, 0, .95); vmBox(arrow, MAT.red, .02, .1, .16, 0, 0, .06);
    arrow.position.x = .15; wm.add(arrow); // poggia sopra la mano, sulla finestra dell'arco
  } else {
    // la lama (o il bastone, la canna, il libro) esce dal pugno in avanti
    wm.rotation.set(0, Math.PI, 0); wm.position.z = w.type === 'bastone' ? .3 * VMS.bastone : 0; R.grip.add(wm);
  }
  // riflesso dorato della parata: un bagliore morbido davanti al braccio
  const parry = glowSprite(root, -.1, -.12, -1.0, 1.5, 0xffd890, 0);
  // bagliore della magia sul pomolo del bastone
  let gemGlow = null; const gm = wm.userData.gem;
  if (gm) gemGlow = glowSprite(wm, gm.position.x, gm.position.y, gm.position.z, w.type === 'lanterna' ? 1.3 : .9, w.type === 'lanterna' ? 0xff8a30 : w.type === 'tomo' ? 0x8ac8ff : 0xb070ff, .0);
  // scia del fendente: una striscia che segue la punta dell'arma
  const N = 12, tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3)); tg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  const idx = []; for (let i = 0; i < N - 1; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } tg.setIndex(idx);
  const trail = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  trail.visible = false; root.add(trail);
  root.traverse(o => { o.userData.cs = false; if (o.isMesh || o.isSprite) { o.castShadow = false; o.receiveShadow = !o.material.transparent; o.frustumCulled = false; } });
  VM.root = root; VM.tp = [];
  VM.u = { R, L, wm, arrow, strA, strB, parry, gemGlow, kind, style: WT[w.type].style, type: w.type, rar: w.rar, trail, N, tcol: lin(w.rar === 2 ? 0xd9a8ff : w.rar === 1 ? 0xa8ccff : 0xffe2a8) };
  VM.key = cls + '|' + w.type + w.rar + '|' + save.outfit;
}
const easeOut = t => 1 - Math.pow(1 - t, 3);
// pose (spazio telecamera): braccio a, arma d
const POSE = {
  rest: { a: V3(-.05, .3, -.95), d: V3(-.24, .62, -.75), r: .15 },
  magic: { a: V3(-.05, .3, -.95), d: V3(-.14, .78, -.6), r: 0 },
  cast: { a: V3(-.08, .22, -.97), d: V3(-.16, .36, -.92), r: 0 },
  // fendente da destra a sinistra (side 1) e rovescio da sinistra a destra (side -1)
  sw1: [{ a: V3(.35, .5, -.8), d: V3(.75, .55, -.35), r: .3 }, { a: V3(0, .25, -.97), d: V3(-.45, .3, -.84), r: .9 }, { a: V3(-.5, .02, -.87), d: V3(-.97, -.12, -.2), r: 1.4 }],
  sw2: [{ a: V3(-.45, .45, -.77), d: V3(-.8, .45, -.4), r: -.4 }, { a: V3(0, .2, -.98), d: V3(.45, .2, -.87), r: -1.0 }, { a: V3(.5, -.05, -.86), d: V3(.95, -.2, -.25), r: -1.5 }],
  bowL: V3(.38, .32, -.87),
  guard: V3(.48, .4, -.78),
  // lancia: affondo dritto verso il mirino
  spear: { a: V3(.02, .22, -.97), d: V3(-.14, .2, -.97), r: 0 }, spearHit: { a: V3(-.1, .12, -.99), d: V3(-.1, .1, -.99), r: 0 },
  // martello: su sopra la testa, poi giù a terra
  smash: [{ a: V3(.22, .85, -.48), d: V3(.1, .9, .42), r: 0 }, { a: V3(0, -.08, -1), d: V3(-.05, -.85, -.52), r: 0 }],
  // armi da imbracciare, libro, lanterna
  gun: { a: V3(-.02, .26, -.96), d: V3(-.16, -.03, -1), r: 0 },
  book: { a: V3(-.12, .25, -.96), d: V3(-.1, .78, -.62), r: 0 }, bookCast: { a: V3(-.1, .18, -.98), d: V3(-.05, .5, -.86), r: 0 },
  lantern: { a: V3(-.05, .3, -.95), d: V3(-.15, .45, -.88), r: 0 }, lanternCast: { a: V3(-.06, .2, -.98), d: V3(-.05, .18, -.98), r: 0 }
};
const _pa = V3(0, 0, 0), _pd = V3(0, 0, 0);
function lerpPose(P0, P1, t, out) { out.a.copy(P0.a).lerp(P1.a, t); out.d.copy(P0.d).lerp(P1.d, t); out.r = lerp(P0.r, P1.r, t); return out; }
const _ps = { a: V3(0, 0, 0), d: V3(0, 0, 0), r: 0 };
function smashPose(a, out) {
  const K = POSE.smash;
  if (a < .35) return lerpPose(POSE.rest, K[0], easeOut(a / .35), out);
  if (a < .5) return lerpPose(K[0], K[1], (a - .35) / .15, out);
  if (a < .75) return lerpPose(K[1], K[1], 0, out);
  return lerpPose(K[1], POSE.rest, (a - .75) / .25, out);
}
function swingPose(side, a, out) {
  const K = side > 0 ? POSE.sw1 : POSE.sw2;
  return a < .5 ? lerpPose(K[0], K[1], a / .5, out) : lerpPose(K[1], K[2], (a - .5) / .5, out);
}
function updateViewModel(dt) {
  if (!p) return;
  const key = p.cls.id + '|' + p.weapon.type + p.weapon.rar + '|' + save.outfit;
  if (key !== VM.key) buildViewModel();
  const root = VM.root, u = VM.u;
  root.visible = !p.dead && STATE !== 'title';
  if (!root.visible) { u.trail.visible = false; VM.tp.length = 0; return; }
  // ritardo dell'arma quando si gira lo sguardo
  const dyaw = angDiff(LOOK.lastYaw, LOOK.yaw), dp = LOOK.pitch - LOOK.lastPitch; LOOK.lastYaw = LOOK.yaw; LOOK.lastPitch = LOOK.pitch;
  VM.sx += (clamp(dyaw * 2.2, -.12, .12) - VM.sx) * Math.min(1, dt * 10);
  VM.sy += (clamp(-dp * 2.2, -.1, .1) - VM.sy) * Math.min(1, dt * 10);
  const R = u.R, L = u.L, a = p.atkT, attacking = a >= 0, breath = Math.sin(T * 1.8) * .012;
  const asp = innerWidth / Math.max(1, innerHeight), vh = camera.fov * Math.PI / 360, hh = Math.atan(Math.tan(vh) * asp);
  R.sh.position.copy(R.base); L.sh.position.copy(L.base); R.sh.position.y += breath; L.sh.position.y += breath * .8;
  L.sh.visible = false; R.sh.visible = true; L.hand.scale.setScalar(1);
  // col telefono in verticale la mano sta sopra i tasti; in orizzontale scende come sul computer
  let anchor = R, anchorA = POSE.rest.a, fx = .56, fy = isTouch && asp < 1 ? -.4 : -.62, Pt = null;
  // con il campo verticale stretto (schermi bassi e larghi) braccio e arma si rimpiccioliscono, senza spostarsi sullo schermo
  const vs = Math.min(1, Math.tan(vh) / .577) * (isTouch && asp > 1 ? .9 : 1);
  let thr = 0;
  if (u.kind === 'melee' && u.style === 'thrust') {
    const k = attacking ? Math.sin(Math.min(1, a) * Math.PI) : 0; thr = k;
    const P = lerpPose(POSE.spear, POSE.spearHit, k, _ps); aimArm(R, P.a, P.d, P.r);
  } else if (u.kind === 'melee' && u.style === 'smash') {
    const P = attacking ? smashPose(a, _ps) : POSE.rest; _pa.copy(P.a); _pa.y += breath * .5; aimArm(R, _pa, P.d, P.r);
    const ln = REACHL(u.type);
    if (attacking && a > .3 && a < .55) { const h = handAt(R, P.a, _vh), dn = _vd.copy(P.d).normalize(); VM.tp.push({ t: T, x: h.x + dn.x * ln[0], y: h.y + dn.y * ln[0], z: h.z + dn.z * ln[0], mx: h.x + dn.x * ln[1], my: h.y + dn.y * ln[1], mz: h.z + dn.z * ln[1] }); }
  } else if (u.style === 'gun') {
    VM.fire = Math.max(0, VM.fire - dt * 6);
    _pd.copy(POSE.gun.d); _pd.y += VM.fire * .35; aimArm(R, POSE.gun.a, _pd, 0); anchorA = POSE.gun.a;
  } else if (u.kind === 'melee') {
    let P = POSE.rest;
    if (attacking) { P = swingPose(VM.atkSide, easeOut(a), _ps); VM.wasAtk = true; VM.postSide = VM.atkSide; }
    else {
      if (VM.wasAtk) { VM.wasAtk = false; VM.post = 1; }
      if (VM.post > 0) { VM.post = Math.max(0, VM.post - dt / .2); const k = VM.post * VM.post * (3 - 2 * VM.post); P = lerpPose(POSE.rest, swingPose(VM.postSide, 1, { a: V3(0, 0, 0), d: V3(0, 0, 0), r: 0 }), k, _ps); }
    }
    _pa.copy(P.a); _pa.y += breath * .5; aimArm(R, _pa, P.d, P.r);
    // scia della punta
    const ln = REACHL(u.type);
    if (attacking) {
      const h = handAt(R, P.a, _vh), dn = _vd.copy(P.d).normalize();
      VM.tp.push({ t: T, x: h.x + dn.x * ln[0], y: h.y + dn.y * ln[0], z: h.z + dn.z * ln[0], mx: h.x + dn.x * ln[1], my: h.y + dn.y * ln[1], mz: h.z + dn.z * ln[1] });
    }
  } else if (u.kind === 'magic') {
    const P0 = u.type === 'tomo' ? POSE.book : u.type === 'lanterna' ? POSE.lantern : POSE.magic, P1 = u.type === 'tomo' ? POSE.bookCast : u.type === 'lanterna' ? POSE.lanternCast : POSE.cast;
    let P = P0;
    if (attacking) P = lerpPose(P0, P1, Math.sin(Math.min(1, a) * Math.PI), _ps);
    aimArm(R, P.a, P.d, P.r); anchorA = P0.a;
    // la lanterna arde sempre, il tomo sfrigola, il bastone si accende quando lancia
    if (u.gemGlow) { const g = u.gemGlow.material, base = u.type === 'lanterna' ? .55 + Math.sin(T * 17) * .08 + Math.sin(T * 7) * .06 : u.type === 'tomo' ? .3 + Math.max(0, Math.sin(T * 23)) * .25 : 0; g.opacity = attacking && a < .3 ? .95 : Math.max(base, (g.opacity || 0) - dt * 2.5); }
  } else {
    // arco: la sinistra lo regge a sinistra del mirino, puntato verso il centro; il braccio si allunga quanto serve
    L.sh.visible = true; R.sh.visible = false; anchor = null; L.sh.position.set(-.42, -.88 + breath, 0); L.hand.scale.setScalar(.7);
    const dep = .8, hL = _vh.set(dep * Math.tan(-.3 * hh), dep * Math.tan((isTouch ? -.3 : -.42) * vh) + breath, -dep);
    // la freccia converge verso il mirino poco davanti: così si vede tutta, in diagonale
    const aimD = _vd.set(-hL.x, -hL.y, -2.0 + dep).normalize();
    _va.copy(hL).sub(L.sh.position); aimArm(L, _va, aimD, -.5, _va.length()); Pt = hL;
    const ready = p.atkCd <= .05, draw = attacking ? 0 : clamp(1 - p.atkCd / Math.max(.05, p.weapon.cd), 0, 1), pull = attacking ? 0 : Math.min(1, draw * 1.15);
    const zn = -.1 - pull * .3;
    u.arrow.visible = ready || draw > .5; u.arrow.position.z = zn + .02;
    // la corda è una V che va dalle punte dei flettenti alla cocca della freccia
    for (const [s, m] of [[1, u.strA], [-1, u.strB]]) { const dx = .15 - s * .448, dz = zn + .1, l = Math.hypot(dx, dz); m.position.set((s * .448 + .15) / 2, 0, (-.1 + zn) / 2); m.rotation.set(0, Math.atan2(-dz, dx), 0); m.scale.x = l; }
  }
  // posizione generale: l'arma sta nello stesso punto dello schermo su ogni formato, più dondolio, scivolata, rinculo
  let ox = 0, oy = 0;
  if (anchor) { const h0 = Pt = handAt(anchor, anchorA, _vn), dep = -h0.z; ox = dep * Math.tan(fx * hh) - h0.x; oy = dep * Math.tan(fy * vh) - h0.y; }
  // la scala gira attorno alla mano: resta alla stessa distanza e nello stesso punto dello schermo
  const k1 = 1 - vs; ox += Pt.x * k1; oy += Pt.y * k1; root.scale.setScalar(.3 * vs);
  const bx_ = Math.cos(LOOK.bobT) * .05 * LOOK.bob, by_ = -Math.abs(Math.sin(LOOK.bobT)) * .045 * LOOK.bob;
  VM.recoil = Math.max(0, VM.recoil - dt * 5);
  root.position.set((ox + VM.sx + bx_) * .3, (oy + by_ + VM.sy - (p.slideT > 0 ? .1 : 0) - (p.onGround ? 0 : .03)) * .3 - VM.recoil * .02, Pt.z * k1 * .3 + VM.recoil * .02 - thr * .1 + (u.style === 'gun' ? VM.fire * .025 : 0));
  root.rotation.set(VM.recoil * .25, 0, p.slideT > 0 ? .22 : 0);
  // parata: un braccio si alza davanti, con il lampo dorato
  if (p.parryT > 0) { const G = u.kind === 'ranged' ? R : L; G.sh.visible = true; if (G === R) { R.sh.position.copy(R.base); aimArm(R, _va.set(-POSE.guard.x, POSE.guard.y, POSE.guard.z), null); } else aimArm(L, POSE.guard, null); }
  u.parry.material.opacity = p.parryT > 0 ? .55 + Math.random() * .2 : Math.max(0, u.parry.material.opacity - dt * 3);
  if (u.wm.userData.gem) u.wm.userData.gem.rotation.y += dt * 3;
  if (u.rar === 2) { MAT.runeEpic.emissiveIntensity = 3.4 + Math.sin(T * 4) * 1.3; MAT.bladeEpic.emissiveIntensity = 1.1 + Math.sin(T * 4) * .4; }
  updateTrail(u);
}
function updateTrail(u) {
  const tp = VM.tp, life = .13;
  while (tp.length && T - tp[0].t > life) tp.shift();
  while (tp.length > u.N) tp.shift();
  const m = u.trail; m.visible = tp.length > 1; if (!m.visible) return;
  const pos = m.geometry.attributes.position, col = m.geometry.attributes.color, c = u.tcol;
  for (let i = 0; i < u.N; i++) {
    const q = tp[Math.min(i, tp.length - 1)], k = i < tp.length ? Math.max(0, 1 - (T - q.t) / life) * (i / Math.max(1, tp.length - 1)) : 0;
    pos.setXYZ(i * 2, q.x, q.y, q.z); pos.setXYZ(i * 2 + 1, q.mx, q.my, q.mz);
    col.setXYZ(i * 2, c.r * k * 1.4, c.g * k * 1.4, c.b * k * 1.4); col.setXYZ(i * 2 + 1, 0, 0, 0);
  }
  pos.needsUpdate = true; col.needsUpdate = true;
}

/* ---------- mira: verso il centro dello schermo, con un piccolo aiuto ---------- */
// centro e mezza altezza dei bersagli, sopra i piedi del nemico
function aimTarget(range, assist) {
  const f = viewDir(new THREE.Vector3()), ey = p.y + LOOK.eyeNow;
  let best = null, bs = 1e9;
  for (const e of enemies) {
    if (untouchable(e) || e.fadeIn > 0 || e.state === 'sleep') continue;
    const c = HIT[e.type], tx = e.x - p.x, ty = e.y + c[0] - ey, tz = e.z - p.z, d = Math.hypot(tx, ty, tz);
    if (d > range || d < .01) continue;
    const ang = Math.acos(clamp((tx * f.x + ty * f.y + tz * f.z) / d, -1, 1)), tol = assist + Math.atan2(c[1] * .7, d);
    if (ang < tol && ang / tol + d * .01 < bs) { bs = ang / tol + d * .01; best = e; }
  }
  if (!best) return { x: p.x + f.x * range, y: ey + f.y * range, z: p.z + f.z * range, e: null };
  return { x: best.x, y: best.y + HIT[best.type][0], z: best.z, e: best };
}
