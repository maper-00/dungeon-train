/* ================= oggetti realistici dei vagoni ================= */
// rettangolo dell'etichetta i nell'atlante 4x2 (la tela è capovolta: v = 1 in alto)
function stickerRect(i) { const c = i % 4, r = Math.floor(i / 4) % 2; return [c * .25 + .004, 1 - (r + 1) * .5 + .008, (c + 1) * .25 - .004, 1 - r * .5 - .008]; }
// libro i dell'atlante: dorso, copertina, pagine
function bookGeo(w, h, d, i) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv.array, sp = [i * 32 / 512, 128 / 512, (i + 1) * 32 / 512, 1], cov = [0, 0, .5, .25], pag = [.5, 0, 1, .25];
  // facce di BoxGeometry: +x, -x, +y, -y, +z, -z (4 vertici ciascuna); il dorso guarda +z
  const rect = [cov, cov, pag, pag, sp, pag];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const j = (f * 4 + k) * 2, r = rect[f]; uv[j] = r[0] + uv[j] * (r[2] - r[0]); uv[j + 1] = r[1] + uv[j + 1] * (r[3] - r[1]); }
  return g;
}
const LUGGAGE = () => [MAT.leather, MAT.leatherTan, MAT.leatherBlack, MAT.leatherRed, MAT.leatherGreen, MAT.leatherNavy, MAT.leatherCream];
// valigia (w lunghezza, h spessore, d profondità): la faccia +z ha maniglia e serrature
function suitcase(b, x, y, z, w, h, d, ry, R, kind) {
  const k = new Kit(b, x, y, z, ry), L = LUGGAGE(), m = kind === 'trunk' ? MAT.canvasTan : L[Math.floor(R() * L.length)];
  const strap = m === MAT.leatherBlack ? MAT.leatherTan : MAT.leatherBlack, rr = Math.min(.045, h * .16);
  k.box(m, w, h, d, 0, 0, 0, rr);
  if (kind === 'trunk') {
    // baule da viaggio: listelli di legno, angolari e serratura d'ottone, maniglie di cuoio ai lati
    for (const sx of [-1, 1]) k.box(MAT.varnish, .07, h + .02, d + .02, sx * (w / 2 - .14), -.01, 0, .012);
    k.box(MAT.varnish, w + .02, .06, d + .02, 0, h * .62, 0, .012); k.box(MAT.varnish, w + .02, .05, d + .02, 0, .04, 0, .012);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0, 1]) k.put(MAT.brassAged, grainUV(new THREE.BoxGeometry(.11, .11, .11)), sx * (w / 2 - .045), .045 + sy * (h - .09), sz * (d / 2 - .045));
    k.box(MAT.brassAged, .12, .14, .03, 0, h * .5, d / 2 + .005, .01);
    for (const sx of [-1, 1]) k.put(MAT.leatherBlack, new THREE.TorusGeometry(.08, .016, 6, 12, Math.PI), sx * (w / 2 + .01), h * .55, 0, 0, Math.PI / 2, -Math.PI / 2 * sx);
  } else {
    // cucitura del coperchio, cinghie con fibbia, angoli rinforzati, maniglia e due serrature
    k.box(MAT.leatherBlack, w + .006, .018, d + .006, 0, h * .64, 0, .008);
    for (const sx of [-1, 1]) {
      k.box(strap, .07, h + .016, d + .016, sx * w * .28, -.008, 0, .014);
      k.box(MAT.brassAged, .085, .065, .018, sx * w * .28, h * .5, d / 2 + .012, .006);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0, 1]) k.put(strap, grainUV(new THREE.BoxGeometry(.07, .07, .07)), sx * (w / 2 - .028), .028 + sy * (h - .056), sz * (d / 2 - .028));
    k.put(strap, new THREE.TorusGeometry(.075, .015, 6, 12, Math.PI), 0, h * .55, d / 2 + .005, Math.PI / 2, 0, 0);
    for (const sx of [-1, 1]) { k.box(MAT.brassAged, .03, .03, .03, sx * .1, h * .55 - .015, d / 2 + .006, .005); k.box(MAT.brassAged, .06, .04, .016, sx * w * .17, h * .64 - .03, d / 2 + .006, .006); }
  }
  // etichette di viaggio sul davanti e sopra
  const n = 1 + Math.floor(R() * 2.4);
  for (let i = 0; i < n; i++) {
    const s = Math.min(.24, h * .75) * (.8 + R() * .3), on = R() < .5 && i > 0;
    if (on) k.put(MAT.stickers, stickerPlane(s * 1.2, s, Math.floor(R() * 8)), (R() - .5) * (w - .5), h + .004, (R() - .5) * (d - .4), -Math.PI / 2, 0, R() * .8 - .4);
    else k.put(MAT.stickers, stickerPlane(s * 1.2, s, Math.floor(R() * 8)), (R() - .5) * (w * .8 - s), h * .5, d / 2 + .004, 0, 0, R() * .5 - .25);
  }
}
function stickerPlane(w, h, i) { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv.array, r = stickerRect(i); for (let j = 0; j < uv.length; j += 2) { uv[j] = r[0] + uv[j] * (r[2] - r[0]); uv[j + 1] = r[1] + uv[j + 1] * (r[3] - r[1]); } return g; }
// cappelliera rotonda
function hatbox(b, x, y, z, r, h, R) {
  const k = new Kit(b, x, y, z, R() * 3), m = pick([MAT.leatherCream, MAT.leatherRed, MAT.leatherNavy]);
  k.cyl(m, r, r, h, 0, 0, 0, 24); k.cyl(m === MAT.leatherCream ? MAT.leatherNavy : MAT.leatherCream, r + .012, r + .012, h * .24, 0, h * .76, 0, 24);
  k.put(MAT.leatherBlack, new THREE.TorusGeometry(r * .4, .012, 6, 14, Math.PI), 0, h, 0, 0, 0, 0);
  k.put(MAT.stickers, stickerPlane(r * .9, r * .75, Math.floor(R() * 8)), 0, h + .013, 0, -Math.PI / 2, 0, R() * 3);
}
// borsa da dottore: pancia morbida, telaio d'ottone, doppia maniglia
function doctorBag(b, x, y, z, w, ry, R) {
  const k = new Kit(b, x, y, z, ry), m = pick([MAT.leatherBlack, MAT.leather, MAT.leatherTan]), h = w * .62, d = w * .45;
  k.put(m, grainUV(blob(w / 2, h / 2, d / 2, 18, .25)), 0, h / 2, 0, 0, 0, 0);
  k.rod(MAT.brassAged, .012, [-w * .42, h * .9, 0], [w * .42, h * .9, 0]);
  k.put(m, new THREE.TorusGeometry(w * .2, .016, 6, 14, Math.PI), 0, h * .93, 0);
  k.box(MAT.brassAged, .05, .04, .03, 0, h * .78, d * .42, .008);
}
// cassa di legno: tavole, cornice con diagonale, angolari di ferro, scritte a spruzzo
function crateBox(b, x, y, z, w, h, d, ry, R, label = true) {
  const k = new Kit(b, x, y, z, ry), t = .075, e = .026;
  k.box(MAT.crate, w - .03, h - .03, d - .03, 0, .015, 0, 0);
  const diag = Math.atan2(h - 2 * t, w - 2 * t), dl = Math.hypot(h - 2 * t, w - 2 * t) - .02;
  for (const sz of [-1, 1]) {
    const zz = sz * (d / 2 - e / 2);
    k.box(MAT.oak, w, t, e, 0, 0, zz, 0); k.box(MAT.oak, w, t, e, 0, h - t, zz, 0);
    for (const sx of [-1, 1]) k.box(MAT.oak, t, h - 2 * t, e, sx * (w / 2 - t / 2), t, zz, 0);
    k.box(MAT.oak, dl, t * .85, e * .9, 0, h / 2 - t * .425, zz, 0, 0, 0, sz * diag);
  }
  const dg = Math.atan2(h - 2 * t, d - 2 * t), dd = Math.hypot(h - 2 * t, d - 2 * t) - .02;
  for (const sx of [-1, 1]) {
    const xx = sx * (w / 2 - e / 2);
    for (const sz of [-1, 1]) k.box(MAT.oak, e, h - 2 * t, t, xx, t, sz * (d / 2 - t / 2 - e), 0);
    k.box(MAT.oak, e * .9, t * .85, dd, xx, h / 2 - t * .425, 0, 0, sx * dg, 0, 0);
  }
  for (const sx of [-1, 1]) k.box(MAT.oak, t, e, d - 2 * e, sx * (w / 2 - t / 2 - .04), h - .005, 0, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0, 1]) {
    k.box(MAT.iron, .12, .03, .12, sx * (w / 2 - .055), sy ? h - .02 : -.01, sz * (d / 2 - .055), 0);
    k.box(MAT.iron, .03, .14, .03, sx * (w / 2 - .005), sy ? h - .14 : 0, sz * (d / 2 - .005), 0);
  }
  if (label) { const s = Math.min(w * .6, h * 1.4); k.decal(MAT.stencil, s, s * .5, 0, h * .52, d / 2 + .004, 0, [0, 0, 1, 1], (R() - .5) * .1); }
}
// lampada a muro: piastra, braccio curvo, paralume a tulipano con la lampadina dentro
function wallLamp(b, x, y, z, ry, mat) {
  const k = new Kit(b, x, y, z, ry);
  k.lathe(MAT.brassAged, [[0, -.01], [.07, -.01], [.085, .01], [.07, .03], [0, .035]], 0, 0, 0, 16, Math.PI / 2, 0, 0);
  k.put(MAT.brassAged, taperTube([[0, 0, .03], [0, .06, .13], [0, .16, .2], [0, .22, .22]], t => .016 - t * .004, 12, 6), 0, -.2, 0);
  k.lathe(MAT.brassAged, [[0, 0], [.035, 0], [.03, .04], [.018, .05]], 0, .0, .22, 10);
  k.lathe(mat || MAT.shade, [[.03, .03], [.06, .05], [.085, .12], [.1, .2], [.11, .23], [.104, .235]], 0, -.04, .22, 18);
  k.put(MAT.bulb, new THREE.SphereGeometry(.035, 10, 8), 0, .13, .22);
}
// lampadario a sospensione: catenella, rosone, paralume di vetro
function hangLamp(b, x, y, z, drop, mat) {
  const k = new Kit(b, x, y, z, 0);
  k.lathe(MAT.brassAged, [[0, 0], [.14, 0], [.12, -.04], [.03, -.07], [0, -.07]], 0, 0, 0, 18);
  for (let i = 0; i < Math.floor(drop / .07); i++) k.put(MAT.brassAged, new THREE.TorusGeometry(.022, .006, 4, 8), 0, -.1 - i * .07, 0, 0, i % 2 ? Math.PI / 2 : 0, 0);
  const yb = -drop - .1;
  k.lathe(MAT.brassAged, [[0, .1], [.04, .1], [.05, .04], [.03, 0], [0, 0]], 0, yb, 0, 14);
  k.lathe(mat || MAT.shade, [[.035, .02], [.12, -.05], [.24, -.18], [.3, -.26], [.31, -.28], [.29, -.28]], 0, yb, 0, 24);
  k.put(MAT.bulb, new THREE.SphereGeometry(.06, 12, 10), 0, yb - .1, 0);
}
// tenda di velluto con pieghe, nel sistema di un Kit; tied > 0 la raccoglie verso x = 0 all'altezza della fascia
function curtain(k, x, y, z, w, h, tied = 0, mat) {
  const g = new THREE.PlaneGeometry(w, h, 18, 6), P = g.attributes.position.array, ph = (x * 7.3 + z * 3.1) % 6;
  for (let i = 0; i < P.length; i += 3) {
    const u = P[i] / w + .5, v = P[i + 1] / h + .5, gather = tied * Math.pow(Math.max(0, 1 - Math.abs(v - .38) * 2.4), 1.4);
    P[i] = (u - .5) * w * (1 - gather * .7);
    P[i + 2] = Math.sin(u * w * 30 + ph) * .04 * (1 + gather * 1.5) + Math.sin(u * w * 11 + ph * 2) * .02;
  }
  g.computeVertexNormals();
  k.put(mat || MAT.velvetCurtain, g, x, y + h / 2, z);
}
// finestrino con mantovana di noce e due tende raccolte; sd = lato della parete (-1 in fondo, 1 vicino)
function windowDrapes(b, cx, y0, zw, sd, ytop) {
  const k = new Kit(b, cx, 0, zw, sd < 0 ? 0 : Math.PI);
  k.box(MAT.varnishDark, 3.25, .24, .16, 0, ytop + .04, .09, .03);
  k.box(MAT.brassAged, 3.2, .03, .02, 0, ytop + .07, .175, .008);
  for (const sx of [-1, 1]) {
    curtain(k, sx * 1.36, y0 - .12, .12, .5, ytop - y0 + .2, .75);
    k.put(MAT.brassAged, new THREE.TorusGeometry(.05, .012, 6, 12), sx * 1.36, y0 + .62, .16, 0, 0, 0);
  }
}
// panca Pullman: zoccolo di noce, seduta e schienale in velluto capitonné, braccioli torniti, corrimano d'ottone
function bench(b, xa, xb, zc, zb, sd, R) {
  const cx = (xa + xb) / 2, w = xb - xa, k = new Kit(b, cx, 0, (zc + zb) / 2, sd > 0 ? Math.PI : 0), dz = Math.abs(zb - zc);
  // in locale lo schienale sta verso -z, la seduta verso +z
  const zs = dz / 2, zbk = -dz / 2;
  k.box(MAT.varnishDark, w - .1, .44, 1.1, 0, 0, zs, .03);
  k.box(MAT.varnish, w - .3, .26, .03, 0, .08, zs + .555, .01);
  k.box(MAT.brassAged, w - .1, .05, .025, 0, .01, zs + .56, .008);
  k.box(MAT.tuftRed, w - .12, .3, 1.16, 0, .44, zs + .02, .1);
  k.rod(MAT.velvetDark, .03, [-(w - .2) / 2, .735, zs + .58], [(w - .2) / 2, .735, zs + .58], 8);
  k.box(MAT.tuftRed, w - .16, 1.08, .24, 0, .7, zbk + .05, .1, -.08, 0, 0);
  k.box(MAT.varnishDark, w, 1.45, .12, 0, .42, zbk - .12, .03);
  k.box(MAT.varnish, w + .1, .1, .38, 0, 1.8, zbk - .04, .04);
  k.rod(MAT.brassAged, .022, [-w / 2 + .1, 1.98, zbk + .08], [w / 2 - .1, 1.98, zbk + .08], 10);
  for (const sx of [-1, 1]) {
    k.box(MAT.brassAged, .04, .1, .04, sx * (w / 2 - .14), 1.88, zbk + .08, .01);
    const ax = sx * (w / 2 - .02);
    k.box(MAT.varnish, .14, .1, 1.0, ax, .92, zs - .05, .045);
    k.lathe(MAT.varnishDark, [[.05, 0], [.04, .06], [.03, .2], [.045, .26], [.03, .34], [.04, .44], [.035, .48]], ax, .44, zs + .32, 12);
    k.box(MAT.varnishDark, .1, .55, .9, ax, .4, zs - .12, .02);
  }
  // cose dimenticate dai passeggeri
  const r = R();
  if (r < .3) { const nx = (R() - .5) * (w - 1); k.put(MAT.news, new THREE.PlaneGeometry(.42, .3), nx, .755, zs + .1, -Math.PI / 2, 0, R() * 1.5 - .75); k.put(MAT.news, new THREE.PlaneGeometry(.42, .3), nx + .03, .76, zs + .12, -Math.PI / 2 + .03, 0, R() - .5); }
  else if (r < .55) bowler(k, (R() - .5) * (w - 1), .745, zs + .1, R() * 3);
  else if (r < .75) k.put(MAT.leatherBlack, grainUV(rbox(.32, .07, .22, .02)), (R() - .5) * (w - 1), .78, zs + .1, 0, R() * 3, 0);
}
function bowler(k, x, y, z, ry) {
  k.lathe(MAT.leatherBlack, [[.0, .15], [.08, .15], [.115, .11], [.12, .05], [.12, .02], [.18, .015], [.2, .03], [.2, .02], [.12, 0], [0, 0]], x, y, z, 20, 0, ry, 0);
  k.lathe(MAT.velvetDark, [[.122, .02], [.124, .05], [.122, .05]], x, y, z, 20);
}
// tavolo ribaltabile (gruppo mobile): piano di noce, gambe tornite, centrino, lampada, tazza, giornale
function tableModel(kind) {
  const g = new THREE.Group(), b = new Builder(), k = new Kit(b);
  if (kind === 'cloth') {
    // tavolo da ristorante: tovaglia di lino che ricade a pieghe, piatti, posate, calici, bottiglia e candeliere
    k.box(MAT.varnish, 1.4, .06, 1.4, 0, .8, 0, .02);
    for (const [x, z] of [[-.58, -.58], [.58, -.58], [-.58, .58], [.58, .58]]) k.lathe(MAT.varnishDark, [[.045, 0], [.04, .04], [.028, .3], [.045, .42], [.035, .6], [.05, .76], [0, .8]], x, 0, z, 10);
    k.box(MAT.linen, 1.5, .012, 1.5, 0, .86, 0, .005);
    for (let sd = 0; sd < 4; sd++) {
      const c = new THREE.PlaneGeometry(1.5, .34, 24, 3), P = c.attributes.position.array;
      for (let i = 0; i < P.length; i += 3) { const v = .17 - P[i + 1]; P[i + 2] = Math.sin(P[i] * 26) * .012 * v / .34 + v * .05; }
      c.computeVertexNormals(); k.put(MAT.linen, c, Math.sin(sd * Math.PI / 2) * .752, .7, Math.cos(sd * Math.PI / 2) * .752, 0, sd * Math.PI / 2, 0);
    }
    for (const [x, z, a] of [[-.38, -.28, 0], [.38, .28, Math.PI]]) {
      k.lathe(MAT.porcelain, [[0, 0], [.12, 0], [.15, .012], [.155, .02], [.12, .012], [0, .01]], x, .866, z, 24);
      k.box(MAT.chrome, .012, .004, .2, x + Math.cos(a) * .2, .868, z, .002); k.box(MAT.chrome, .014, .004, .19, x - Math.cos(a) * .2, .868, z, .002);
      k.lathe(MAT.glassClear, [[0, 0], [.035, 0], [.006, .01], [.005, .09], [.02, .1], [.038, .16], [.035, .2], [.033, .2], [.035, .16], [.018, .105], [0, .1]], x - Math.cos(a) * .05, .866, z - Math.cos(a) * .2, 16);
      k.put(MAT.linen, new THREE.ConeGeometry(.05, .12, 3), x + Math.cos(a) * .06, .93, z + Math.cos(a) * .05, 0, .5, 0);
    }
    k.lathe(MAT.bottleG, [[0, 0], [.04, 0], [.042, .02], [.042, .18], [.03, .23], [.014, .27], [.014, .32], [.017, .33], [0, .33]], .14, .866, -.1, 16);
    k.cyl(MAT.cream, .016, .016, .03, .14, 1.19, -.1, 8);
    k.lathe(MAT.brassAged, [[0, 0], [.06, 0], [.065, .01], [.02, .02], [.015, .16], [.03, .17], [.02, .18], [0, .18]], -.12, .866, .14, 14);
    k.lathe(MAT.wax, [[0, 0], [.016, 0], [.016, .14], [.012, .15], [0, .15]], -.12, 1.04, .14, 10);
    k.put(MAT.flame, blob(.012, .03, .012, 8), -.12, 1.215, .14);
    b.build(g);
    return castAll(g);
  }
  k.box(MAT.varnish, 1.4, .06, 1.4, 0, .86, 0, .025);
  k.box(MAT.varnishDark, 1.3, .1, 1.3, 0, .76, 0, .015);
  for (const [x, z] of [[-.58, -.58], [.58, -.58], [-.58, .58], [.58, .58]]) k.lathe(MAT.varnishDark, [[.05, 0], [.045, .04], [.03, .12], [.028, .3], [.05, .42], [.034, .52], [.04, .64], [.055, .7], [.055, .78], [0, .78]], x, 0, z, 12);
  // centrino di lino che ricade sui due bordi
  k.box(MAT.linen, .52, .008, 1.42, .1, .92, 0, .003);
  for (const sz of [-1, 1]) k.box(MAT.linen, .52, .18, .008, .1, .76, sz * .711, .003);
  // lampada da tavolo
  k.lathe(MAT.brassAged, [[0, 0], [.09, 0], [.1, .015], [.07, .03], [.02, .05], [.016, .3], [.025, .32], [0, .32]], -.38, .92, .32, 18);
  k.lathe(MAT.shadeGreen, [[.05, .3], [.09, .32], [.15, .38], [.17, .42], [.16, .43]], -.38, .92, .32, 20);
  k.put(MAT.bulb, new THREE.SphereGeometry(.035, 10, 8), -.38, 1.27, .32);
  // tazza e piattino
  k.lathe(MAT.porcelain, [[0, 0], [.08, 0], [.095, .012], [.09, .016], [.03, .012], [0, .012]], .38, .92, -.3, 20);
  k.lathe(MAT.porcelain, [[0, .012], [.03, .012], [.045, .03], [.055, .08], [.052, .085], [.046, .08], [.04, .03], [0, .028]], .38, .92, -.3, 20);
  k.put(MAT.tea, new THREE.CircleGeometry(.047, 18), .38, .99, -.3, -Math.PI / 2, 0, 0);
  k.put(MAT.porcelain, new THREE.TorusGeometry(.022, .006, 6, 10), .435, .97, -.3, 0, 0, 0);
  k.put(MAT.news, new THREE.PlaneGeometry(.44, .31), -.05, .932, -.18, -Math.PI / 2, 0, .35);
  b.build(g);
  return castAll(g);
}
// forziere: assi di rovere, bande di ferro, angolari d'ottone, coperchio a botte con la cerniera dietro
function chestModel() {
  const g = new THREE.Group(), b = new Builder(), k = new Kit(b);
  k.box(MAT.oak, 1.0, .5, .66, 0, 0, 0, .02);
  for (const x of [-.32, .32]) k.box(MAT.iron, .07, .506, .672, x, -.003, 0, .01);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(MAT.brassAged, .1, .12, .1, sx * .47, 0, sz * .3, .015);
  k.box(MAT.brassAged, .16, .2, .03, 0, .26, .335, .012);
  k.box(MAT.black, .025, .06, .01, 0, .3, .352, .003);
  // monete che si vedono quando si apre
  k.put(MAT.gold, grainUV(blob(.42, .1, .26, 16)), 0, .48, 0);
  b.build(g);
  const lid = pivot(g, 0, .5, -.33), lb = new Builder(), lk = new Kit(lb);
  lk.put(MAT.oak, cylUV(new THREE.CylinderGeometry(.33, .33, 1.0, 20, 1, false, 0, Math.PI), 1, 1), 0, 0, .33, 0, 0, Math.PI / 2);
  for (const x of [-.32, .32]) lk.put(MAT.iron, cylUV(new THREE.CylinderGeometry(.338, .338, .07, 20, 1, false, 0, Math.PI), .07, 1), x, 0, .33, 0, 0, Math.PI / 2);
  lk.box(MAT.brassAged, .14, .12, .03, 0, -.02, .665, .01);
  lb.build(lid);
  lid.scale.y = .62;
  const glow = new THREE.PointLight(lin(0xffc060), 0, 6, 2); glow.position.set(0, 1, 0); g.add(glow);
  g.userData = { lid, glow }; return castAll(g);
}
// moneta coniata con il bordo zigrinato
const COIN_GEO = () => COIN_GEO.g || (COIN_GEO.g = new THREE.CylinderGeometry(.17, .17, .045, 28).rotateX(Math.PI / 2));
function coinModel() {
  if (!MAT.coin) { MAT.coin = MAT.gold.clone(); MAT.coin.bumpMap = TEX.coin; MAT.coin.bumpScale = .004; }
  return new THREE.Mesh(COIN_GEO(), MAT.coin);
}
// cuore di cristallo rosso
function heartModel() {
  const geo = sg('heart', () => {
    const s = new THREE.Shape(); s.moveTo(0, -.2); s.bezierCurveTo(.06, -.12, .22, -.04, .22, .08); s.bezierCurveTo(.22, .19, .12, .24, .06, .2); s.bezierCurveTo(.03, .18, .01, .15, 0, .13);
    s.bezierCurveTo(-.01, .15, -.03, .18, -.06, .2); s.bezierCurveTo(-.12, .24, -.22, .19, -.22, .08); s.bezierCurveTo(-.22, -.04, -.06, -.12, 0, -.2);
    const g = new THREE.ExtrudeGeometry(s, { depth: .06, bevelEnabled: true, bevelThickness: .04, bevelSize: .035, bevelSegments: 4, curveSegments: 16 }); g.center(); return g;
  });
  const g = new THREE.Group(); const m = new THREE.Mesh(geo, MAT.heart); g.add(m); return g;
}
// anta di porta a pannelli con vetro smerigliato, maniglia e battiscopa d'ottone (gruppo mobile)
function doorLeaf(parent, z) {
  const g = new THREE.Group(); g.position.set(0, 0, z); parent.add(g);
  const b = new Builder(), k = new Kit(b), hz = z < 0 ? .4 : -.4;
  k.box(MAT.varnish, .1, 3.15, 1.1, 0, 0, 0, .012);
  for (const sx of [-1, 1]) {
    k.box(MAT.varnishDark, .03, .9, .78, sx * .055, .3, 0, .02);
    k.box(MAT.varnishDark, .03, .08, .9, sx * .055, 1.32, 0, .015);
    k.box(MAT.varnishDark, .03, .08, .9, sx * .055, 2.9, 0, .015);
    k.box(MAT.varnishDark, .03, 1.5, .08, sx * .055, 1.4, -.41, .015); k.box(MAT.varnishDark, .03, 1.5, .08, sx * .055, 1.4, .41, .015);
    k.box(MAT.brassAged, .02, .2, 1.06, sx * .055, .02, 0, .008);
    k.lathe(MAT.brassAged, [[.03, 0], [.025, .04], [.012, .05], [.03, .1], [0, .11]], sx * .05, 1.45, hz, 12, 0, 0, sx * -Math.PI / 2);
  }
  k.box(MAT.glass, .04, 1.4, .72, 0, 1.45, 0, .005);
  b.build(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
// portabagagli: due tubi d'ottone su mensole, rete sotto
function rack(b, xa, xb, y, z0, z1) {
  const k = new Kit(b);
  for (const z of [z0 + .02, (z0 + z1) / 2, z1]) k.rod(MAT.brassAged, .022, [xa, y, z], [xb, y, z], 10);
  for (let x = xa + .2; x <= xb - .1; x += (xb - xa - .3) / 2) {
    k.put(MAT.brassAged, taperTube([[x, y + .02, z1 + .02], [x, y - .25, z0 + .2], [x, y - .55, z0]], () => .018, 10, 6));
    k.lathe(MAT.brassAged, [[0, 0], [.05, 0], [.04, .02], [0, .025]], x, y - .55, z0 + .005, 12, Math.PI / 2, 0, 0);
  }
  const net = new THREE.PlaneGeometry(xb - xa, z1 - z0, 1, 1), uv = net.attributes.uv.array; for (let i = 0; i < uv.length; i += 2) { uv[i] *= (xb - xa) * 4; uv[i + 1] *= (z1 - z0) * 4; }
  k.put(MAT.net, net, (xa + xb) / 2, y - .03, (z0 + z1) / 2, -Math.PI / 2, 0, 0);
}

/* ---------- arredi della cabina letto ---------- */
function portraitFrame(b, x, z) {
  const k = new Kit(b, x, 0, z, Math.PI / 2);
  for (const [w, h, px, py] of [[1.15, .13, 0, 1.9], [1.15, .13, 0, 3.27], [.13, 1.24, -.51, 2.03], [.13, 1.24, .51, 2.03]]) k.box(MAT.brassAged, w, h, .09, px, py, .045, .035);
  for (const [w, h, px, py] of [[.94, .04, 0, 2.02], [.94, .04, 0, 3.23], [.04, 1.17, -.455, 2.04], [.04, 1.17, .455, 2.04]]) k.box(MAT.varnishDark, w, h, .05, px, py, .03, .01);
  for (const sx of [-1, 1]) for (const y of [1.965, 3.335]) k.put(MAT.brassAged, new THREE.SphereGeometry(.055, 12, 8), sx * .51, y, .09);
  k.put(MAT.portrait, new THREE.PlaneGeometry(.9, 1.13), 0, 2.645, .03);
  k.box(MAT.brassAged, .34, .07, .015, 0, 1.75, .02, .006);
}
function bunkBed(b) {
  const k = new Kit(b), R = mulberry(71);
  for (const [x, z] of [[.4, -5.3], [4.5, -5.3], [.4, -3.5], [4.5, -3.5]]) k.lathe(MAT.varnishDark, [[.09, 0], [.08, .05], [.062, .12], [.062, 2.92], [.08, 2.98], [.08, 3.04], [.05, 3.08], [.07, 3.15], [.04, 3.22], [0, 3.24]], x, 0, z, 14);
  for (const y of [.36, 1.9]) {
    for (const z of [-5.3, -3.5]) k.box(MAT.varnish, 4.0, .16, .08, 2.45, y, z, .02);
    for (const x of [.4, 4.5]) k.box(MAT.varnish, .08, .16, 1.72, x, y, -4.4, .02);
    k.box(MAT.varnishDark, 4.0, .05, 1.74, 2.45, y + .06, -4.4, .01);
    k.box(MAT.pillow, 4.0, .22, 1.72, 2.45, y + .1, -4.4, .07);
    k.box(MAT.plaid, 2.9, .05, 1.8, 2.95, y + .31, -4.38, .025);
    k.box(MAT.plaid, 2.9, .36, .05, 2.95, y + .0, -3.47, .022);
    k.box(MAT.linen, .32, .056, 1.82, 1.42, y + .31, -4.38, .025);
    k.put(MAT.pillow, blob(.36, .085, .52, 16), .95, y + .41, -4.45, .04, .1, .06);
  }
  for (const x of [3.95, 4.45]) k.box(MAT.varnishDark, .06, 2.9, .06, x, 0, -3.32, .015);
  for (let y = .5; y < 2.9; y += .42) k.cyl(MAT.varnish, .024, .024, .5, 4.2, y, -3.32, 8, 0, 0, Math.PI / 2);
  k.rod(MAT.brassAged, .016, [.45, 3.14, -3.42], [4.45, 3.14, -3.42]);
  curtain(k, 1.0, 2.1, -3.4, .8, 1.04, .7); curtain(k, 3.15, 2.1, -3.4, 1.5, 1.04, 0);
  suitcase(b, 1.55, 0, -4.35, 1.1, .3, .7, Math.PI + .06, R);
  doctorBag(b, 3.3, 0, -4.0, .46, -.4, R);
}
function bookcase(b) {
  const k = new Kit(b), R = mulberry(12);
  k.box(MAT.varnishDark, 2.1, 3.3, .05, 6.25, 0, -5.45, .01);
  for (const x of [5.25, 7.25]) k.box(MAT.varnishDark, .08, 3.36, .82, x, 0, -5.08, .015);
  k.box(MAT.varnishDark, 2.2, .12, .84, 6.25, 0, -5.06, .02);
  for (const y of [.8, 1.6, 2.4]) { k.box(MAT.varnish, 1.96, .05, .78, 6.25, y, -5.08, .01); k.box(MAT.varnish, 1.96, .07, .025, 6.25, y - .02, -4.69, .008); }
  k.box(MAT.varnish, 2.36, .14, .92, 6.25, 3.3, -5.05, .035); k.box(MAT.varnishDark, 2.26, .08, .88, 6.25, 3.24, -5.06, .02);
  for (const y0 of [.12, .85, 1.65, 2.45]) {
    let x = 5.31;
    while (x < 7.16) {
      const r = R();
      if (r < .08) { // pila di libri coricati
        let yy = y0; for (let j = 0; j < 3; j++) { const w = .26 + R() * .06, h = .045 + R() * .03; k.put(MAT.books, bookGeo(h, w, .28, Math.floor(R() * 16)), x + .15, yy + h / 2, -4.86, 0, R() * .2 - .1, Math.PI / 2); yy += h; }
        x += .34; continue;
      }
      if (r < .14) { x += .06 + R() * .1; continue; }
      const w = .045 + R() * .06, h = .38 + R() * .3, d = .26 + R() * .12, lean = R() < .07 ? .18 : 0;
      if (x + w > 7.18) break;
      k.put(MAT.books, bookGeo(w, h, d, Math.floor(R() * 16)), x + w / 2 + lean * h * .5, y0 + h / 2 * Math.cos(lean), -4.71 - d / 2, 0, 0, -lean);
      x += w + .004 + lean * h * .6;
    }
  }
  // teschio stravagante con tre orbite e una candela consumata
  k.put(MAT.bone, blob(.16, .15, .18, 18), 6.7, 3.6, -5.02); k.put(MAT.bone, grainUV(rbox(.18, .1, .14, .04)), 6.7, 3.48, -4.93);
  for (const [ex, ey, er] of [[-.06, 3.62, .04], [.06, 3.62, .04], [0, 3.71, .028]]) k.put(MAT.black, new THREE.SphereGeometry(er, 10, 8), 6.7 + ex, ey, -4.87);
  k.lathe(MAT.wax, [[0, 0], [.035, 0], [.033, .12], [.02, .13], [0, .13]], 5.85, 3.44, -5.0, 10);
  k.lathe(MAT.varnishDark, [[.3, 0], [.28, .04], [.1, .07], [.07, .2], [.09, .35], [.06, .5], [.06, .86], [.1, .96], [.14, 1.0], [0, 1.01]], 6.25, 0, -4.1, 16);
}
function openBook(g) {
  const b = new Builder(), k = new Kit(b);
  k.box(MAT.varnish, .8, .05, .6, 0, -.03, 0, .015);
  k.box(MAT.leatherRed, .78, .025, .55, 0, .02, 0, .008);
  const hAt = u => .05 + Math.sin(Math.min(1, u * 1.6) * Math.PI / 2) * .035 * (1 - u * .5);
  for (const sx of [-1, 1]) {
    const pg = new THREE.PlaneGeometry(.36, .5, 12, 1).rotateX(-Math.PI / 2), P = pg.attributes.position.array;
    for (let i = 0; i < P.length; i += 3) { const u = P[i] / .36 + .5; P[i] = (sx > 0 ? u : u - 1) * .36; P[i + 1] = hAt(sx > 0 ? u : 1 - u); }
    pg.computeVertexNormals();
    k.put(MAT.paper, pg, 0, 0, 0);
    k.box(MAT.paper, .34, .03, .48, sx * .19, .02, 0, .008);
    for (let i = 0; i < 5; i++) k.box(MAT.bookGlow, .22, .004, .022, sx * .2, hAt(.55) - .002, -.17 + i * .085, .001);
  }
  b.build(g, false, true);
}
function wardrobeProp(b) {
  const k = new Kit(b);
  k.box(MAT.varnishDark, 2.3, 3.6, .9, 9.15, .12, -5.03, .02);
  k.box(MAT.varnishDark, 2.4, .12, .98, 9.15, 0, -5.0, .025);
  k.box(MAT.varnishDark, 2.42, .08, 1.0, 9.15, 3.7, -5.0, .02); k.box(MAT.varnish, 2.54, .14, 1.08, 9.15, 3.78, -4.98, .035);
  for (const x of [8.6, 9.7]) {
    k.box(MAT.varnish, 1.06, 3.36, .05, x, .22, -4.56, .015);
    for (const [y, h] of [[.45, 1.2], [1.9, 1.4]]) { k.box(MAT.varnishDark, .8, h, .03, x, y, -4.53, .03); k.box(MAT.varnish, .66, h - .14, .03, x, y + .07, -4.512, .02); }
  }
  for (const x of [9.05, 9.25]) k.lathe(MAT.brassAged, [[.022, 0], [.018, .03], [.01, .04], [.035, .07], [0, .085]], x, 1.78, -4.535, 12, Math.PI / 2, 0, 0);
}
function scarfGeo() {
  const g = rbox(.15, .76, .03, .012, 1), P = g.attributes.position.array;
  for (let i = 0; i < P.length; i += 3) { const v = .38 - P[i + 1]; P[i + 2] += Math.sin(v * 7) * .03 + v * .02; P[i] += Math.sin(v * 5 + 1) * .02; }
  g.translate(0, -.38, 0); g.computeVertexNormals(); return g;
}
function slotCabinet(b) {
  const k = new Kit(b);
  k.box(MAT.slotRed, 1.4, 1.0, .9, 14.6, 0, -5.05, .05);
  k.box(MAT.chrome, 1.44, .05, .94, 14.6, .95, -5.05, .02); k.box(MAT.chrome, 1.44, .06, .94, 14.6, 0, -5.05, .02);
  k.box(MAT.slotRed, 1.3, 1.3, .7, 14.6, 1.0, -5.15, .07);
  k.box(MAT.brassAged, 1.12, .74, .04, 14.6, 1.22, -4.79, .02);
  k.box(MAT.chrome, 1.18, .07, .07, 14.6, 1.27, -4.78, .025); k.box(MAT.chrome, 1.18, .07, .07, 14.6, 1.88, -4.78, .025);
  for (const x of [14.02, 15.18]) k.box(MAT.chrome, .07, .68, .07, x, 1.24, -4.78, .025);
  k.box(MAT.brassAged, 1.44, .26, .76, 14.6, 2.3, -5.15, .05);
  k.put(MAT.brassAged, cylUV(new THREE.CylinderGeometry(.38, .38, 1.44, 24, 1, false, 0, Math.PI), 1.44, 1.2), 14.6, 2.56, -5.15, 0, 0, Math.PI / 2);
  k.box(MAT.chrome, .62, .07, .27, 14.6, .76, -4.6, .025); k.box(MAT.black, .5, .02, .18, 14.6, .8, -4.6, .005);
  k.box(MAT.black, .16, .05, .02, 14.6, 1.12, -4.765, .005);
  k.cyl(MAT.chrome, .028, .028, .9, 15.36, 1.18, -5.0, 10);
  k.lathe(MAT.chrome, [[0, -.07], [.09, -.07], [.1, -.05], [.1, .05], [.09, .07], [0, .07]], 15.32, 1.2, -5.0, 16, 0, 0, Math.PI / 2);
}
function classTrunk(b) {
  const R = mulberry(5); suitcase(b, 14.4, 0, 2.6, 1.9, 1.0, 1.1, Math.PI, R, 'trunk');
  const k = new Kit(b);
  // un elmo, una faretra, un cristallo: le tre classi
  k.put(MAT.steel, new THREE.SphereGeometry(.13, 16, 8, 0, TAU, 0, Math.PI / 2), 13.95, 1.0, 2.6);
  k.box(MAT.steelDark, .3, .03, .3, 13.95, 1.0, 2.6, .012);
  k.cyl(MAT.leather, .06, .05, .34, 14.38, 1.06, 2.6, 12, 0, .3, Math.PI / 2);
  for (let i = 0; i < 3; i++) k.cyl(MAT.cream, .006, .006, .2, 14.6 + i * .02, 1.07 + i * .015, 2.56 + i * .03, 5, 0, .3, Math.PI / 2);
  k.put(MAT.gem, new THREE.OctahedronGeometry(.1), 14.85, 1.1, 2.6, .3, .4, 0);
}
function sideTable(b, G) {
  const k = new Kit(b);
  k.lathe(MAT.varnishDark, [[.28, 0], [.26, .03], [.1, .06], [.06, .1], [.05, .3], [.08, .4], [.045, .55], [.06, .7], [.09, .74], [0, .75]], 4.6, 0, 1.8, 16);
  k.cyl(MAT.varnish, .55, .55, .07, 4.6, .75, 1.8, 36);
  k.lathe(MAT.brassAged, [[0, 0], [.09, 0], [.095, .012], [.03, .025], [.022, .07], [.04, .085], [.03, .095], [0, .095]], 4.4, .82, 1.6, 16);
  k.lathe(MAT.wax, [[0, 0], [.024, 0], [.024, .2], [.02, .215], [0, .21]], 4.4, .9, 1.6, 12);
  k.lathe(MAT.porcelain, [[0, 0], [.08, 0], [.095, .012], [.09, .016], [.03, .012], [0, .012]], 4.85, .82, 2.0, 20);
  k.lathe(MAT.porcelain, [[0, .012], [.03, .012], [.045, .03], [.055, .08], [.052, .085], [.046, .08], [.04, .03], [0, .028]], 4.85, .82, 2.0, 20);
  k.put(MAT.tea, new THREE.CircleGeometry(.047, 18), 4.85, .89, 2.0, -Math.PI / 2, 0, 0);
  k.put(MAT.books, bookGeo(.3, .05, .22, 3), 4.72, .845, 2.16, 0, .5, 0);
  const fl = new THREE.Mesh(blob(.018, .05, .018, 10), MAT.flame); fl.position.set(4.4, 1.16, 1.6); G.add(fl);
  glowSprite(G, 4.4, 1.16, 1.6, .35, 0xffb050, .7);
}
function armchair(b, x, z, ry) {
  const k = new Kit(b, x, 0, z, ry);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.lathe(MAT.varnishDark, [[.035, 0], [.045, .05], [.03, .13], [.045, .17], [0, .18]], sx * .42, 0, sz * .36, 10);
  k.box(MAT.velvetDark, 1.0, .24, .88, 0, .17, 0, .05);
  k.box(MAT.tuftRed, .74, .18, .78, 0, .38, .05, .08);
  k.box(MAT.tuftRed, .8, 1.02, .22, 0, .42, -.36, .09, -.14, 0, 0);
  for (const sx of [-1, 1]) {
    k.box(MAT.velvet, .16, .34, .82, sx * .43, .24, .02, .05);
    k.cyl(MAT.velvet, .1, .1, .82, sx * .43, .64, .02, 16, Math.PI / 2, 0, 0);
    k.cyl(MAT.velvetDark, .085, .085, .02, sx * .43, .64, .435, 16, Math.PI / 2, 0, 0);
    k.box(MAT.velvet, .14, .62, .42, sx * .43, .7, -.26, .06, 0, sx * .2, 0);
  }
  k.box(MAT.plaid, .5, .03, .6, .15, .58, .02, .015, 0, .3, -.05);
}
function hornSpeaker(b, x, y, z) {
  const k = new Kit(b, x, y, z, 0);
  k.lathe(MAT.brassAged, [[0, -.01], [.09, -.01], [.1, .02], [0, .03]], 0, 0, 0, 16, Math.PI / 2, 0, 0);
  k.put(MAT.iron, taperTube([[0, 0, .02], [0, .02, .12], [0, -.02, .2]], () => .015, 8, 6));
  k.lathe(MAT.brassAged, [[0, -.02], [.05, 0], [.035, .06], [.04, .14], [.06, .22], [.1, .3], [.17, .37], [.2, .39], [.19, .392], [.16, .37], [.09, .29], [.05, .21], [.03, .13], [.02, .06], [0, .04]], 0, -.03, .2, 22, Math.PI / 2 - .35, 0, 0);
}
function wallClock(b, x, y, z) {
  const k = new Kit(b, x, y, z, 0);
  k.lathe(MAT.brassAged, [[0, 0], [.3, 0], [.325, .02], [.325, .07], [.3, .095], [.28, .085], [0, .085]], 0, 0, 0, 36, Math.PI / 2, 0, 0);
  k.put(MAT.clockFace, new THREE.CircleGeometry(.278, 36), 0, 0, .087);
  for (const [l, w, a] of [[.15, .022, -2.0], [.22, .014, -.9]]) { const g = rbox(w, l, .006, .003, 1); g.translate(0, l / 2 - .03, 0); k.put(MAT.black, g, 0, 0, .093, 0, 0, a); }
  k.put(MAT.brassAged, new THREE.SphereGeometry(.018, 10, 8), 0, 0, .095);
}

// portabagagli pieno: valigie, cappelliere, borse da dottore e qualche baule (zw = parete, il davanti guarda la corsia)
function luggageRack(b, xa, xb, zw, R, y = 3.1) {
  const sd = zw < 0 ? 1 : -1, z0 = zw + sd * .42, z1 = zw + sd * 1.0, zc = zw + sd * .72, ry = sd > 0 ? 0 : Math.PI;
  if (sd > 0) rack(b, xa, xb, y, z0, z1); else rack(b, xa, xb, y, z1, z0);
  let x = xa + .2;
  while (x < xb - .6) {
    const r = R(), w = .55 + R() * .6;
    if (r < .14) { hatbox(b, x + .22, y + .03, zc, .22, .26, R); x += .6; continue; }
    if (r < .26) { doctorBag(b, x + .25, y + .03, zc, .5, ry + R() - .5, R); x += .62; continue; }
    const h = .22 + R() * .26; suitcase(b, x + w / 2, y + .03, zc, w, h, .58, ry + (R() - .5) * .08, R, R() < .2 ? 'trunk' : 0);
    if (h < .34 && R() < .5) suitcase(b, x + w / 2 + (R() - .5) * .1, y + .03 + h, zc, w * .8, .18 + R() * .1, .5, ry + (R() - .5) * .2, R);
    x += w + .1;
  }
}

/* ---------- arredi dei vagoni 2-10 ---------- */
// bottiglia di vetro con l'etichetta e il tappo
function bottle(b, x, y, z, h, mat) {
  const k = new Kit(b, x, y, z);
  k.lathe(mat, [[0, 0], [.038, 0], [.04, .02], [.04, h * .62], [.03, h * .74], [.014, h * .86], [.014, h * .97], [.017, h], [0, h]], 0, 0, 0, 14);
  k.cyl(MAT.paper, .041, .041, h * .22, 0, h * .2, 0, 14);
  k.cyl(MAT.leather, .013, .013, .03, 0, h, 0, 6);
}
// sgabello da bar: piede d'ottone, cuscino capitonné
function stool(b, x, z) {
  const k = new Kit(b, x, 0, z);
  k.lathe(MAT.brassAged, [[0, 0], [.22, 0], [.23, .02], [.06, .05], [.04, .1], [.035, .7], [.07, .74], [0, .75]], 0, 0, 0, 18);
  k.put(MAT.brassAged, new THREE.TorusGeometry(.16, .012, 6, 20).rotateX(Math.PI / 2), 0, .32, 0);
  k.put(MAT.tuftRed, grainUV(blob(.23, .07, .23, 18)), 0, .8, 0);
}
// sacco della posta: tela grezza legata in cima
function sack(b, x, z, R) {
  const k = new Kit(b, x, 0, z, R() * TAU), h = .55 + R() * .2;
  k.put(MAT.sackcloth, grainUV(blob(.27, h / 2, .2, 16, 1.1)), 0, h / 2, 0, (R() - .5) * .2, 0, (R() - .5) * .25);
  k.put(MAT.sackcloth, grainUV(blob(.12, .08, .1, 10)), 0, h * .93, 0);
  k.put(MAT.sackcloth, new THREE.ConeGeometry(.09, .18, 10), 0, h + .05, 0, Math.PI, 0, 0);
  k.put(MAT.leather, new THREE.TorusGeometry(.06, .014, 5, 12).rotateX(Math.PI / 2), 0, h * .97, 0);
  k.decal(MAT.stencil, .26, .13, 0, h * .45, .245, 0, [0, .4, 1, .75]);
}
// lanterna da tempesta appesa: cappello d'ottone, vetro caldo, fiamma
function hangingLantern(pv) {
  part(pv, MAT.steelDark, sg('hlChain', () => new THREE.CylinderGeometry(.012, .012, 1.6, 5)), 0, -.8, 0, 0, 0, 0, false);
  part(pv, MAT.brassAged, sg('hlTop', () => lathe([[0, .14], [.04, .12], [.14, .02], [.15, 0], [0, 0]], 16)), 0, -1.7, 0);
  part(pv, MAT.brassAged, sg('hlRing', () => new THREE.TorusGeometry(.04, .01, 5, 12)), 0, -1.53, 0);
  part(pv, MAT.glassWarm, sg('hlGlass', () => lathe([[.07, 0], [.1, .08], [.11, .14], [.08, .24], [.06, .26]], 16)), 0, -1.96, 0, 0, 0, 0, false);
  part(pv, MAT.lamp, sg('hlFlame', () => blob(.03, .07, .03, 10)), 0, -1.83, 0, 0, 0, 0, false);
  part(pv, MAT.brassAged, sg('hlBase', () => lathe([[0, 0], [.12, 0], [.13, .03], [.09, .05], [0, .05]], 16)), 0, -2.0, 0);
  for (let i = 0; i < 4; i++) part(pv, MAT.brassAged, sg('hlBar', () => new THREE.CylinderGeometry(.006, .006, .3, 4)), Math.cos(i * TAU / 4) * .105, -1.84, Math.sin(i * TAU / 4) * .105);
}
// cuccetta del vagone letto: telaio di noce, materasso, cuscino, coperta che ricade
function sleeperBunk(b, x, y, R) {
  const k = new Kit(b), cov = pick([MAT.plaid, MAT.velvetCurtain, MAT.leatherNavy]);
  k.box(MAT.varnishDark, 3.4, .14, 2.2, x, y - .1, -4.6, .02);
  k.box(MAT.pillow, 3.3, .2, 2.0, x, y + .04, -4.6, .07);
  k.put(MAT.pillow, blob(.25, .07, .5, 14), x - 1.3, y + .3, -4.6, 0, .1, 0);
  k.box(cov, 2.5, .05, 2.06, x + .35, y + .23, -4.6, .02);
  k.box(cov, 2.5, .3, .04, x + .35, y - .05, -3.56, .015);
  k.box(MAT.linen, .3, .055, 2.08, x - .85, y + .235, -4.6, .02);
}
// cassaforte: corpo d'acciaio con i filetti d'oro, porta con la manopola a combinazione, maniglia a tre razze, cerniere
function safeBox(b, x, z, s, ry) {
  const k = new Kit(b, x, 0, z, ry), h = s * 1.2;
  k.box(MAT.plateDark, s, h, s, 0, 0, 0, .04);
  k.box(MAT.brassAged, s * .94, .02, .01, 0, h * .05, s / 2 + .002, .005); k.box(MAT.brassAged, s * .94, .02, .01, 0, h * .95, s / 2 + .002, .005);
  k.box(MAT.steelDark, s * .8, h * .78, .05, 0, h * .11, s / 2, .02);
  k.box(MAT.brassAged, s * .7, .012, .006, 0, h * .14, s / 2 + .03, .003); k.box(MAT.brassAged, s * .7, .012, .006, 0, h * .85, s / 2 + .03, .003);
  k.lathe(MAT.brassAged, [[0, 0], [.13, 0], [.14, .02], [.11, .05], [.05, .07], [0, .075]], 0, h * .62, s / 2 + .02, 24, Math.PI / 2, 0, 0);
  k.put(MAT.black, new THREE.CircleGeometry(.07, 20), 0, h * .62, s / 2 + .096);
  const hub = [s * .22, h * .38, s / 2 + .05];
  k.lathe(MAT.chrome, [[0, 0], [.04, 0], [.04, .06], [0, .07]], hub[0], hub[1], hub[2], 12, Math.PI / 2, 0, 0);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; k.put(MAT.chrome, new THREE.CylinderGeometry(.012, .012, .2, 6).translate(0, .1, 0), hub[0], hub[1], hub[2] + .07, 0, 0, a); k.put(MAT.chrome, new THREE.SphereGeometry(.022, 8, 6), hub[0] - Math.sin(a) * .2, hub[1] + Math.cos(a) * .2, hub[2] + .07); }
  for (const f of [.25, .75]) k.cyl(MAT.steelDark, .03, .03, h * .12, -s * .41, h * f - h * .06, s / 2 + .02, 10);
  k.box(MAT.steelDark, s * .9, .1, s * .9, 0, -.0, 0, .02);
}
// lingotti d'oro impilati su un bancale
const INGOT = () => sg('ingot', () => { const g = new THREE.CylinderGeometry(.15, .19, .1, 4, 1).rotateY(Math.PI / 4), P = g.attributes.position.array; for (let i = 0; i < P.length; i += 3) P[i + 2] *= .55; g.computeVertexNormals(); return g; });
function ingotPile(b, x, z) {
  const k = new Kit(b, x, 0, z);
  k.box(MAT.oak, 1.3, .14, 1.0, 0, 0, 0, .01);
  for (let l = 0; l < 3; l++) for (let i = 0; i < 4 - l; i++) for (let j = 0; j < 2; j++) k.put(MAT.gold, INGOT().clone(), -.45 + l * .15 + i * .3, .2 + l * .1, -.2 + j * .4, 0, (l % 2) * Math.PI, 0);
}
// sacchetto di monete
function coinSack(b, x, z, R) {
  const k = new Kit(b, x, 0, z, R() * TAU);
  k.put(MAT.sackcloth, grainUV(blob(.22, .22, .2, 14, 1.0)), 0, .22, 0);
  k.put(MAT.sackcloth, new THREE.ConeGeometry(.08, .16, 10), 0, .49, 0, Math.PI, 0, 0);
  k.put(MAT.leatherRed, new THREE.TorusGeometry(.05, .014, 5, 12).rotateX(Math.PI / 2), 0, .42, 0);
  for (let i = 0; i < 4; i++) k.put(MAT.coin || MAT.gold, new THREE.CylinderGeometry(.06, .06, .015, 14), .2 + i * .04, .008 + i * .012, .12 - i * .02, 0, i, 0);
}
// volantino di una valvola: anello, quattro razze, mozzo
function handwheel(b, x, y, z, r, sd, mat = MAT.leatherRed) {
  const k = new Kit(b, x, y, z, sd > 0 ? Math.PI : 0);
  k.put(mat, new THREE.TorusGeometry(r, r * .12, 8, 24), 0, 0, .06);
  for (let i = 0; i < 4; i++) k.put(mat, new THREE.CylinderGeometry(r * .07, r * .07, r * 2, 6), 0, 0, .06, 0, 0, i * Math.PI / 4 * 2 + Math.PI / 4);
  k.lathe(MAT.brassAged, [[0, 0], [r * .25, 0], [r * .2, .1], [0, .12]], 0, 0, -.02, 12, Math.PI / 2, 0, 0);
}
// pianoforte a coda: cassa sagomata laccata nera, coperchio sollevato, tastiera, gambe tornite, lira dei pedali, leggio
function grandPiano(b, x, z, ry = 0) {
  const k = new Kit(b, x, 0, z, ry), sh = new THREE.Shape();
  sh.moveTo(-1.2, -.7); sh.lineTo(-1.2, .7); sh.lineTo(.2, .7); sh.bezierCurveTo(.9, .7, .9, .1, 1.3, 0); sh.bezierCurveTo(1.45, -.06, 1.4, -.7, 1.0, -.7); sh.lineTo(-1.2, -.7);
  const body = new THREE.ExtrudeGeometry(sh, { depth: .34, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2, curveSegments: 16 }).rotateX(-Math.PI / 2);
  k.put(MAT.piano, body, 0, .7, 0);
  const lid = new THREE.ExtrudeGeometry(sh, { depth: .025, bevelEnabled: false, curveSegments: 16 }).rotateX(-Math.PI / 2).translate(0, 0, .7);
  k.put(MAT.piano, lid, 0, 1.06, 0, .55, 0, 0);
  k.rod(MAT.brassAged, .012, [.2, 1.06, .62], [.2, 1.45, .3]);
  k.box(MAT.keys, .3, .05, 1.3, -1.32, .92, 0, .01);
  for (let i = 0; i < 18; i++) if (i % 7 !== 2 && i % 7 !== 6) k.box(MAT.piano, .16, .03, .03, -1.28, .965, -.6 + i * .07, .005);
  k.box(MAT.piano, .06, .1, 1.36, -1.48, .88, 0, .01);
  for (const [lx, lz] of [[-1.05, -.55], [-1.05, .55], [1.05, -.4]]) k.lathe(MAT.piano, [[.07, 0], [.05, .05], [.06, .2], [.05, .45], [.07, .6], [.08, .7], [0, .7]], lx, 0, lz, 12);
  k.box(MAT.piano, .08, .55, .3, -.85, .05, 0, .02); for (const pz of [-.06, 0, .06]) k.box(MAT.brassAged, .1, .015, .025, -.92, .06, pz, .005);
  k.box(MAT.piano, .03, .3, .8, -1.0, 1.04, 0, .01, 0, 0, .25);
  k.box(MAT.paper, .01, .24, .32, -1.02, 1.08, -.18, .004, 0, 0, .25); k.box(MAT.paper, .01, .24, .32, -1.02, 1.08, .18, .004, 0, 0, .25);
  k.box(MAT.tuftRed, .45, .1, .8, -1.9, .45, 0, .04);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.lathe(MAT.piano, [[.03, 0], [.025, .2], [.035, .4], [0, .45]], -1.9 + sx * .17, 0, sz * .33, 8);
}
// divano capitonné con i braccioli a rotolo (sd: lato della parete)
function sofa(b, x, z, w, sd) {
  const k = new Kit(b, x, 0, z, sd > 0 ? Math.PI : 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.lathe(MAT.varnishDark, [[.04, 0], [.05, .05], [.035, .13], [.05, .17], [0, .18]], sx * (w / 2 - .1), 0, sz * .32, 10);
  k.box(MAT.velvetDark, w, .26, .86, 0, .16, 0, .05);
  k.box(MAT.tuftGreen, w - .3, .18, .7, 0, .4, .05, .07);
  k.box(MAT.tuftGreen, w - .2, .7, .22, 0, .42, -.36, .08, -.12, 0, 0);
  for (const sx of [-1, 1]) { k.box(MAT.velvet, .16, .3, .82, sx * (w / 2 - .08), .24, 0, .05); k.cyl(MAT.velvet, .1, .1, .82, sx * (w / 2 - .08), .6, 0, 14, Math.PI / 2, 0, 0); }
}
// tavolino con la lampada di stoffa a frange
function lampTableProp(b, x, z) {
  const k = new Kit(b, x, 0, z);
  k.lathe(MAT.varnishDark, [[.22, 0], [.2, .03], [.07, .06], [.05, .25], [.08, .4], [.04, .6], [.08, .64], [0, .65]], 0, 0, 0, 14);
  k.cyl(MAT.gilt, .45, .45, .04, 0, .65, 0, 28);
  k.lathe(MAT.brassAged, [[0, 0], [.08, 0], [.09, .02], [.04, .05], [.025, .3], [0, .3]], 0, .69, 0, 14);
  k.lathe(MAT.shade, [[.12, .38], [.2, .28], [.24, .2], [.23, .19]], 0, .69, 0, 20);
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; k.cyl(MAT.gilt, .006, .006, .06, Math.cos(a) * .232, .82, Math.sin(a) * .232, 4); }
}
// fontanella di marmo a due vasche
function fountain(b, x, z) {
  const k = new Kit(b, x, 0, z);
  k.lathe(MAT.marble, [[0, 0], [.92, 0], [.95, .05], [.9, .4], [.95, .45], [.86, .47], [.82, .2], [0, .2]], 0, 0, 0, 30);
  k.lathe(MAT.marble, [[.12, .2], [.1, .5], [.16, .6], [.08, .75], [.12, .85], [.38, 1.1], [.4, 1.15], [.34, 1.14], [.1, 1.0], [0, 1.0]], 0, 0, 0, 22);
  k.put(MAT.marble, sph(.07, 12, 10), 0, 1.2, 0);
}
// braciere su tre zampe con la griglia
function brazier(b, x, z) {
  const k = new Kit(b, x, 0, z);
  k.lathe(MAT.iron, [[.1, .3], [.3, .45], [.44, .8], [.46, .9], [.42, .9], [.4, .82], [.26, .5], [0, .46]], 0, 0, 0, 18);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; k.put(MAT.iron, taperTube([[Math.cos(a) * .12, .4, Math.sin(a) * .12], [Math.cos(a) * .32, .2, Math.sin(a) * .32], [Math.cos(a) * .4, 0, Math.sin(a) * .4]], () => .025, 8, 5)); }
  k.put(MAT.iron, new THREE.TorusGeometry(.44, .02, 6, 24).rotateX(Math.PI / 2), 0, .9, 0);
  k.put(MAT.coal, grainUV(blob(.38, .08, .38, 14)), 0, .86, 0);
}
// mucchio di carbone: cono bitorzoluto coperto di pezzi spigolosi
function coalHeap(b, x, z, r, h, R) {
  const g = new THREE.ConeGeometry(r, h, 30, 10), P = g.attributes.position.array, n = vnoise(R, 9, 7), n2 = vnoise(R, 23, 15);
  for (let i = 0; i < P.length; i += 3) { const y = (P[i + 1] + h / 2) / h; if (y > .01 && y < .99) { const a = Math.atan2(P[i + 2], P[i]) / TAU + .5, k = 1 + (n(a, y) - .5) * .55 + (n2(a, y) - .5) * .18; P[i] *= k; P[i + 2] *= k; P[i + 1] += (n(y, a) - .5) * .15 * h; } }
  g.computeVertexNormals(); g.translate(0, h / 2, 0);
  const k = new Kit(b, x, 0, z); k.put(MAT.coal, g);
  for (let i = 0; i < 26; i++) { const t = R(), a = R() * TAU, rr = r * (1 - t) * (.85 + R() * .2), sz = .06 + R() * .12; k.put(MAT.coal, new THREE.DodecahedronGeometry(sz, 0), Math.cos(a) * rr, t * h * .95 + sz * .3, Math.sin(a) * rr, R() * 3, R() * 3, 0); }
}
// pezzi di carbone sparsi sul pavimento
function coalChunks(b, x0, x1, zr, n, R) {
  const k = new Kit(b);
  for (let i = 0; i < n; i++) { const sz = .05 + R() * .1; k.put(MAT.coal, new THREE.DodecahedronGeometry(sz, 0), x0 + R() * (x1 - x0), sz * .6, (R() - .5) * zr, R() * 3, R() * 3, R() * 3); }
}
