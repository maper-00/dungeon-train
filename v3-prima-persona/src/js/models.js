/* ================= dati di gioco ================= */
const CLASSES = [
  { id: 'cavaliere', name: 'Cavaliere', hp: 6, speed: 5.3, weapon: 'spada', perk: 'parry', desc: 'Più vita. La finestra di parry è più ampia.' },
  { id: 'ranger', name: 'Ranger', hp: 5, speed: 6.3, weapon: 'arco', perk: 'slide', desc: 'Più veloce. Scivolata più lunga e potente.' },
  { id: 'mago', name: 'Mago', hp: 5, speed: 5.7, weapon: 'bastone', perk: 'pierce', desc: 'I dardi trapassano i nemici, il fulmine rimbalza una volta in più.' }
];
// kind: melee (mischia), ranged (a distanza), magic. style cambia il gesto: thrust affondo, smash schianto, gun da imbracciare, chain fulmine, fire palla di fuoco
const WT = {
  spada: { n: 'Spada', kind: 'melee', dmg: 3, cd: .34, reach: 2.1, kb: 7, arc: 1.0, d: 'Fendenti equilibrati' },
  sciabola: { n: 'Sciabola', kind: 'melee', dmg: 3, cd: .25, reach: 2.0, kb: 5, arc: 1.1, critB: 10, d: 'Rapida, critici frequenti' },
  ascia: { n: 'Ascia', kind: 'melee', dmg: 5, cd: .62, reach: 2.0, kb: 11, arc: 1.0, d: 'Lenta ma pesante' },
  pugnale: { n: 'Pugnale', kind: 'melee', dmg: 2, cd: .18, reach: 1.55, kb: 3, arc: .9, critB: 6, d: 'Velocissimo, portata corta' },
  lancia: { n: 'Lancia', kind: 'melee', style: 'thrust', dmg: 4, cd: .5, reach: 3.1, kb: 9, arc: .42, d: 'Affondo lungo, trapassa la fila' },
  martello: { n: 'Martello', kind: 'melee', style: 'smash', dmg: 7, cd: .92, reach: 2.4, kb: 13, arc: 1.2, stun: .9, d: 'Schianto ad area che stordisce' },
  falce: { n: 'Falce', kind: 'melee', dmg: 4, cd: .58, reach: 2.6, kb: 6, arc: 1.65, d: 'Taglio larghissimo' },
  arco: { n: 'Arco', kind: 'ranged', dmg: 2, cd: .42, spd: 17, proj: 'arrow', d: 'Frecce a distanza' },
  balestra: { n: 'Balestra', kind: 'ranged', style: 'gun', dmg: 5, cd: .9, spd: 28, proj: 'quarrel', pierce: true, d: 'Dardi pesanti che trapassano' },
  trombone: { n: 'Trombone', kind: 'ranged', style: 'gun', dmg: 6, cd: .85, spd: 24, proj: 'pellet', shots: 5, spread: .11, range: 9, d: 'Rosata di pallini, letale da vicino' },
  bastone: { n: 'Bastone', kind: 'magic', dmg: 3, cd: .55, spd: 11, proj: 'bolt', d: 'Dardo magico' },
  tomo: { n: 'Tomo', kind: 'magic', style: 'chain', dmg: 3, cd: .72, chain: 3, range: 17, d: 'Fulmine che rimbalza tra i nemici' },
  lanterna: { n: 'Lanterna', kind: 'magic', style: 'fire', dmg: 4, cd: .85, spd: 12, proj: 'fire', boom: 2.6, d: 'Palla di fuoco che esplode' }
};
const RAR = [{ n: 'Comune', c: '#d9d2c3', hex: 0xd9d2c3 }, { n: 'Raro', c: '#6aaeff', hex: 0x5fa8ff }, { n: 'Epico', c: '#c98bff', hex: 0xc77dff }];
const SUFF = ['del Fuochista', 'del Frenatore', 'della Terza Classe', 'del Vagone Letto', 'del Bigliettaio', 'della Locomotiva', 'del Binario Morto', 'del Passeggero Perduto', 'del Deviatore', 'della Carrozza Ristorante', 'del Macchinista', 'della Serra', 'del Tesoriere', 'del Capostazione'];
function genWeapon(type, lvl, boost = 0) {
  const r = Math.random() + lvl * .07 + boost, rar = r > 1.08 ? 2 : r > .72 ? 1 : 0, t = WT[type];
  return { type, lvl, rar, name: t.n + ' ' + pick(SUFF), dmg: Math.max(1, Math.round(t.dmg * (1 + .3 * (lvl - 1)) * [1, 1.3, 1.7][rar])), cd: +(t.cd * (1 - .04 * (lvl - 1)) * (rar === 2 ? .9 : 1)).toFixed(2), crit: Math.round(3 + Math.random() * 6 + rar * 5 + (t.critB || 0)) };
}
function starterWeapon(c) { return { type: c.weapon, lvl: 1, rar: 0, name: WT[c.weapon].n + ' di partenza', dmg: WT[c.weapon].dmg, cd: WT[c.weapon].cd, crit: 5 }; }
function validWeapon(w) { return w && WT[w.type] && typeof w.dmg === 'number' && typeof w.cd === 'number'; }
// r raggio, hit [centro, mezza altezza] del bersaglio, hph altezza della barra vita, ring scala dell'anello, chunk colori delle schegge, where primo vagone in cui compare
const MOBS = {
  ratto: { name: 'Ratto del Bagagliaio', hp: 4, wpn: ['pugnale'], mult: { slide: 3, ascia: 1.5, falce: 1.5, trombone: 1.5 }, r: .4, hit: [.32, .36], hph: 1.05, ring: .75, chunk: [0x625852, 0xc4867f, 0x3a302c], rat: true, where: 1,
    weak: 'Morde e poi scappa: colpiscilo quando torna alla carica. Una scivolata lo travolge (danno x3). Asce, falci e trombone lo finiscono subito. Passa sotto sedili e tavoli.',
    lore: 'Nati nei bagagli dimenticati. Rubano i coltelli dalla carrozza ristorante e non li restituiscono più.' },
  scheletro: { name: 'Passeggero Scheletrico', hp: 9, wpn: ['spada', 'ascia', 'sciabola'], mult: { ascia: 1.5, martello: 1.8 }, r: .45, hit: [1.0, 1.0], hph: 2.35, ring: .9, chunk: [0xd8ccb0, 0xc8bc9e, 0x2a2020], where: 1,
    weak: 'Le armi pesanti gli spezzano le ossa (Ascia x1.5, Martello x1.8). Para il fendente quando alza l\'arma per stordirlo.',
    lore: 'Ha perso la sua fermata. Anzi, tutte le fermate. Aspetta ancora che il controllore gli timbri il biglietto.' },
  arciere: { name: 'Scheletro Arciere', hp: 6, wpn: ['arco', 'balestra'], wpnLvl: { balestra: 3 }, mult: { reflect: 2, bastone: 1.3, balestra: 1.4 }, r: .45, hit: [1.0, 1.0], hph: 2.35, ring: .9, chunk: [0xd8ccb0, 0x8e2630, 0x2a2020], where: 1,
    weak: 'Ribalta un tavolo e riparati dietro. Le frecce parate tornano indietro con danno doppio. La balestra lo trafigge (x1.4).',
    lore: 'Tira dal fondo del vagone. Dicono fosse campione di tiro, prima di salire sul treno sbagliato.' },
  bigliettaio: { name: 'Bigliettaio Spettrale', hp: 26, wpn: ['bastone', 'tomo'], mult: { bastone: 1.5, tomo: 1.5, reflect: 2 }, elite: true, fly: true, r: .65, hit: [1.35, 1.25], hph: 3.0, ring: 1.3, chunk: [0x62d4c7, 0x1f2a52, 0xc8963c], where: 1,
    weak: 'Prima dello scatto si ferma e grida «BIGLIETTO!»: spostati di lato. Dopo lo scatto resta stordito a mezz\'aria, ed è il momento di colpirlo. La magia lo ferisce di più (Bastone e Tomo x1.5). Para i biglietti per rispedirglieli.',
    lore: 'Il braccio destro del capotreno. Timbra biglietti che nessuno ha comprato. È molto zelante, anche da morto.' },
  cuoco: { name: 'Cuoco Scheletrico', hp: 8, wpn: ['sciabola', 'pugnale'], mult: { reflect: 2, sciabola: 1.5 }, r: .45, hit: [1.0, 1.0], hph: 2.6, ring: .9, chunk: [0xd8ccb0, 0xeeeae0, 0x8e2630], where: 2,
    weak: 'Lancia mannaie a parabola: parale e tornano indietro col danno doppio. Teme le sciabole (x1.5). Da vicino si gira lentamente.',
    lore: 'Cucina per una carrozza ristorante dove nessuno ordina più. Lancia mannaie a chi non lascia la mancia.' },
  mimic: { name: 'Baule Mimetico', hp: 12, wpn: ['martello', 'tomo', 'trombone', 'lancia', 'falce', 'lanterna'], mult: { martello: 1.5, lanterna: 1.5 }, r: .55, hit: [.45, .45], hph: 1.4, ring: 1.0, chunk: [0x6b4428, 0xc8963c, 0x9b2f35], jumps: true, loot: .35, where: 3,
    weak: 'Finge di essere un baule. Colpiscilo prima che si svegli: il primo colpo fa danno doppio. Dopo ogni salto resta a bocca aperta per un attimo. Martello e fuoco lo aprono in due (x1.5).',
    lore: 'Un baule smarrito che ha deciso di non farsi ritrovare. Dentro tiene armi rare e non le cede volentieri.' },
  fantasma: { name: 'Passeggero Fantasma', hp: 7, wpn: ['falce', 'bastone', 'tomo'], mult: { bastone: 1.5, tomo: 1.5, lanterna: 1.5, falce: 1.5 }, fly: true, r: .5, hit: [1.2, .9], hph: 2.4, ring: 1.0, chunk: [0xb8a8ff, 0x4a3a80, 0xe8e0ff], where: 4,
    weak: 'Quando svanisce non si può colpire: aspetta che riappaia e colpiscilo durante lo scatto. Magia, fuoco e falce lo feriscono di più (x1.5).',
    lore: 'Dorme ancora nel vagone letto e si sveglia solo per lamentarsi del rumore. Il rumore sei tu.' },
  ragno: { name: 'Ragno delle Serre', hp: 5, wpn: ['pugnale', 'balestra'], mult: { falce: 1.6, trombone: 1.6, slide: 2 }, r: .45, hit: [.35, .35], hph: 1.0, ring: .85, chunk: [0x2a2430, 0x7ae070, 0x4a3a50], rat: true, jumps: true, where: 5,
    weak: 'Si accuccia prima di saltare: scansalo di lato o paralo. Dopo il morso scappa e torna. Falce e trombone lo spazzano via (x1.6).',
    lore: 'Arrivato con una cassa di orchidee esotiche. Le orchidee sono morte, lui no.' },
  regina: { name: 'Regina delle Serre', hp: 58, wpn: ['falce', 'balestra', 'lanterna'], mult: { lanterna: 1.5, falce: 1.4, reflect: 2 }, elite: true, boss: true, r: 1.1, hit: [.75, .7], hph: 2.2, ring: .9, chunk: [0x3a2050, 0x9aff70, 0x6a3a90], jumps: true, where: 5,
    weak: 'Le palle di ragnatela parate tornano indietro (x2) e il fuoco la brucia (x1.5). Quando atterra dal salto manda un\'onda a terra: saltala.',
    lore: 'Ha trasformato la serra in un nido. Le piante carnivore le portano la colazione a letto.' },
  fuochista: { name: 'Fuochista Scheletrico', hp: 10, wpn: ['lanterna', 'martello'], mult: { reflect: 2, lancia: 1.5 }, r: .45, hit: [1.0, 1.0], hph: 2.4, ring: .9, chunk: [0xd8ccb0, 0x1a1716, 0xff8a40], where: 6,
    weak: 'Lancia carbone ardente che lascia fiamme a terra: non restarci sopra. Il carbone parato torna indietro (x2). La lancia lo tiene a distanza (x1.5).',
    lore: 'Ha spalato carbone per cent\'anni. Adesso spala anche i passeggeri.' },
  guardia: { name: 'Guardia Corazzata', hp: 16, wpn: ['lancia', 'martello'], mult: { martello: 2 }, shield: true, r: .5, hit: [1.0, 1.0], hph: 2.5, ring: 1.0, chunk: [0xa7b0ba, 0xd8ccb0, 0xc8963c], where: 7,
    weak: 'Lo scudo assorbe gran parte dei colpi frontali. Colpisci di lato o alle spalle, subito dopo il suo affondo, oppure para: stordita abbassa lo scudo. Il martello lo sfonda (x2).',
    lore: 'Sorveglia un tesoro che nessuno ricorda di aver caricato. Non ha mai preso un giorno di ferie.' },
  automa: { name: 'Automa a Molla', hp: 12, wpn: ['trombone', 'balestra'], mult: { tomo: 1.6, martello: 1.4 }, r: .5, hit: [.8, .8], hph: 1.95, ring: 1.0, chunk: [0xb8693a, 0xc8963c, 0x2a2d31], where: 8,
    weak: 'Prima della carica si ferma e gira la chiave: fatti da parte e lascialo sbattere contro un ostacolo, resterà stordito. Il fulmine lo manda in tilt (x1.6).',
    lore: 'Costruito per servire il tè in prima classe. Qualcuno gli ha dato troppa corda.' },
  capotreno: { name: 'Il Capotreno', hp: 100, wpn: ['tomo', 'lanterna', 'falce'], mult: { reflect: 2, tomo: 1.25, martello: 1.25 }, elite: true, boss: true, r: .8, hit: [1.5, 1.5], hph: 3.6, ring: 1.0, chunk: [0x1f2a52, 0xd8ccb0, 0xc8963c], where: 10,
    weak: 'Quando batte la lanterna a terra parte un\'onda: saltala. I biglietti parati tornano indietro (x2). Parare la lanternata lo stordisce per un attimo.',
    lore: 'La voce dell\'altoparlante. Ha costruito un treno che non si ferma mai, poi ha perso la chiave del freno. Forse ce l\'hai tu.' }
};
const HIT = {}; for (const k in MOBS) HIT[k] = MOBS[k].hit;

/* ================= modelli a blocchi ================= */
function buildModelMaterials() {
  MAT.bladeRare = emis(0xc4dcff, 0x3f7fff, .9, { metalness: .8, roughness: .25 });
  MAT.bladeEpic = emis(0xecd0ff, 0x9a4aff, 1.3, { metalness: .8, roughness: .25 });
  MAT.runeRare = emis(0xbcd8ff, 0x3a7aff, 3.2); MAT.runeEpic = emis(0xf0d8ff, 0xa040ff, 4);
  MAT.gemBlue = emis(0xa8d0ff, 0x3080ff, 4); MAT.gemEpic = emis(0xf4dcff, 0xc050ff, 5);
  MAT.zap = emis(0xeef6ff, 0x8ac8ff, 7); MAT.flame = emis(0xfff0c0, 0xff7a20, 6); MAT.web = emis(0xf4f8f0, 0x9ab0a8, 1.4);
  MAT.glassWarm = new THREE.MeshStandardMaterial({ color: lin(0xffc080), emissive: lin(0xff8a30), emissiveIntensity: 1.6, transparent: true, opacity: .5, depthWrite: false, roughness: .2 });
  MAT.trousers = std(0x2a2522, .9);
  MAT.heart = emis(0xff7080, 0xe02a3a, 2.2);
  MAT.fxGold = new THREE.MeshBasicMaterial({ color: lin(0xffd890), transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  MAT.ringTeal = new THREE.MeshBasicMaterial({ color: lin(0x62d4c7), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false });
  MAT.ringRed = new THREE.MeshBasicMaterial({ color: lin(0xff6a5a), transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false });
  MAT.ringWhite = new THREE.MeshBasicMaterial({ color: lin(0xf0ece2), transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
  MAT.blob = new THREE.MeshBasicMaterial({ map: TEX.glow, color: 0x000000, transparent: true, opacity: .55, depthWrite: false });
  MAT.window = emis(0x6a4a2a, 0xffa040, 1.3);
  MAT.flash = emis(0xffffff, 0xffffff, 1.3);
  buildMobMaterials();
}
// oggetti che si muovono: proiettano ombre vere solo con la qualità alta (con le altre restano le ombre a macchia)
function castAll(g) { g.traverse(o => { if (o.isMesh && o.material && !o.material.transparent) { o.userData.cs = true; o.castShadow = !!Q.dyn; } }); return g; }
const RING_GEO = () => RING_GEO.g || (RING_GEO.g = new THREE.RingGeometry(.52, .58, 40).rotateX(-Math.PI / 2));
const BLOB_GEO = () => BLOB_GEO.g || (BLOB_GEO.g = new THREE.PlaneGeometry(1.4, 1.4).rotateX(-Math.PI / 2));
function addRing(g, mat, s = 1) { const r = new THREE.Mesh(RING_GEO(), mat); r.position.y = .03; r.scale.setScalar(s); r.renderOrder = 2; g.add(r); return r; }
function addBlob(g, s = 1) { const b = new THREE.Mesh(BLOB_GEO(), MAT.blob); b.position.y = .02; b.scale.setScalar(s); g.add(b); return b; }

/* ---------- geometrie sagomate (lame, manici, archi) ---------- */
const WG = {};
const wg = (k, f) => WG[k] || (WG[k] = f());
// solido a sezioni lungo +z: profile è un poligono 2D antiorario; ogni anello è [z, scala x, scala y, spostamento x, spostamento y]
function loftGeo(profile, rings) {
  const pos = [], P = profile.length;
  const pt = (r, i) => [(r[3] || 0) + profile[i][0] * r[1], (r[4] || 0) + profile[i][1] * r[2], r[0]];
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < P; i++) {
    const j = (i + 1) % P, a0 = pt(rings[k], i), a1 = pt(rings[k], j), b0 = pt(rings[k + 1], i), b1 = pt(rings[k + 1], j);
    pos.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0);
  }
  const cap = (r, flip) => {
    if (r[1] < .003 && r[2] < .003) return;
    const c = [r[3] || 0, r[4] || 0, r[0]];
    for (let i = 0; i < P; i++) { const a = pt(r, i), b = pt(r, (i + 1) % P); if (flip) pos.push(...c, ...b, ...a); else pos.push(...c, ...a, ...b); }
  };
  cap(rings[0], true); cap(rings[rings.length - 1], false);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  g.computeVertexNormals(); return g;
}
const RHOMB = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const EDGE = [[1, 0], [.15, 1], [-1, .75], [-1, -.75], [.15, -1]];
const RECT = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
const POLY = n => Array.from({ length: n }, (_, i) => [Math.cos(i / n * TAU), Math.sin(i / n * TAU)]);
const OCT = POLY(8);
// lastra sagomata: pts nel piano (x verso l'esterno, y lungo l'arma), spessore in y del modello
function slabGeo(pts, depth, bev = .006) {
  const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, -depth / 2); g.rotateX(Math.PI / 2); return g;
}
// cilindro lungo +z centrato nell'origine
const cylZ = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r1, r0, h, n).rotateX(Math.PI / 2);
const tubeGeo = (pts, r, seg = 20, rad = 5) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, rad, false);
function curvePts(n, f) { const out = []; for (let i = 0; i <= n; i++) out.push(f(i / n)); return out; }

/* ---------- armi: impugnatura nell'origine, puntano verso +z ---------- */
// tip: distanza della punta (serve alla scia del fendente in prima persona)
const WTIP = { spada: 1.06, sciabola: 1.0, ascia: .86, pugnale: .5, lancia: 1.8, martello: 1.0, falce: 1.2, arco: .3, balestra: .62, trombone: .86, bastone: 1.2, tomo: .3, lanterna: .6 };
function weaponModel(type, rar = 0) {
  const g = new THREE.Group(), blade = rar === 2 ? MAT.bladeEpic : rar === 1 ? MAT.bladeRare : MAT.steel;
  const rune = rar === 2 ? MAT.runeEpic : rar === 1 ? MAT.runeRare : MAT.steelDark;
  const gem = rar === 2 ? MAT.gemEpic : rar === 1 ? MAT.gemBlue : MAT.gem;
  const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const B = (mat, w, h, d, x, y, z) => bx(g, mat, w, h, d, x, y, z);
  if (type === 'spada') {
    M(wg('grip8', () => cylZ(.034, .034, .26, 8)), MAT.leather, 0, 0, -.03);
    for (const z of [-.12, .06]) M(wg('wire', () => cylZ(.039, .039, .014, 8)), MAT.brass, 0, 0, z);
    M(wg('pommel', () => new THREE.OctahedronGeometry(.062, 0)), MAT.brass, 0, 0, -.19);
    B(MAT.brass, .34, .05, .07, 0, 0, .13);
    for (const s of [-1, 1]) M(wg('qend', () => new THREE.OctahedronGeometry(.042, 0)), MAT.brass, s * .18, 0, .13);
    if (rar) M(wg('ggem', () => new THREE.OctahedronGeometry(.036, 0)), gem, 0, 0, .13).scale.set(1, 1.7, 1);
    M(wg('swordB', () => loftGeo(RHOMB, [[.15, .05, .017], [.32, .048, .018], [.86, .042, .015], [1.06, .003, .003]])), blade);
    for (const s of [-1, 1]) B(rune, .016, .004, .52, 0, s * .0135, .56);
  } else if (type === 'sciabola') {
    M(wg('grip8s', () => cylZ(.031, .033, .24, 8)), MAT.leather, 0, 0, -.03);
    B(MAT.brass, .07, .06, .07, .01, 0, -.17);
    B(MAT.brass, .2, .04, .06, .02, 0, .12);
    B(MAT.brass, .02, .022, .3, .085, 0, -.02); B(MAT.brass, .05, .022, .02, .07, 0, -.16);
    M(wg('sabreB', () => loftGeo(EDGE, [[.14, .045, .012], [.36, .044, .012, -.012], [.6, .042, .011, -.04], [.84, .036, .01, -.085], [1.0, .004, .003, -.13]])), blade);
    if (rar) M(wg('sabreR', () => loftGeo(RECT, [[.2, .006, .014, -.03], [.5, .006, .014, -.055], [.75, .005, .013, -.09]])), rune);
  } else if (type === 'ascia') {
    M(wg('axeH', () => loftGeo(OCT, [[-.24, .032, .032], [.4, .036, .036], [.84, .03, .03]])), MAT.woodDark);
    M(wg('grip8a', () => cylZ(.04, .04, .2, 8)), MAT.leather, 0, 0, -.1);
    M(wg('cap8', () => cylZ(.043, .043, .04, 8)), MAT.brass, 0, 0, -.25);
    B(MAT.steelDark, .11, .11, .16, 0, 0, .7);
    M(wg('axeB', () => slabGeo([[.05, -.08], [.16, -.12], [.26, -.2], [.34, -.19], [.38, -.07], [.39, .06], [.36, .17], [.3, .21], [.18, .14], [.05, .08]], .035)), blade, 0, 0, .7);
    const sp = M(wg('axeSp', () => new THREE.ConeGeometry(.045, .15, 4).rotateZ(Math.PI / 2)), MAT.steelDark, -.12, 0, .7); sp.rotation.x = Math.PI / 4;
    if (rar) B(rune, .02, .05, .26, .27, 0, .7);
  } else if (type === 'pugnale') {
    M(wg('grip6', () => cylZ(.03, .03, .17, 6)), MAT.leather, 0, 0, 0);
    M(wg('pomS', () => new THREE.OctahedronGeometry(.04, 0)), MAT.brass, 0, 0, -.1);
    B(MAT.brass, .17, .04, .05, 0, 0, .1);
    for (const s of [-1, 1]) { const q = B(MAT.brass, .05, .035, .035, s * .1, 0, .125); q.rotation.y = s * .6; }
    M(wg('daggerB', () => loftGeo(RHOMB, [[.12, .04, .013], [.36, .03, .011], [.5, .003, .003]])), blade);
    if (rar) B(rune, .012, .004, .22, 0, .012, .27);
  } else if (type === 'lancia') {
    M(wg('spearS', () => loftGeo(OCT, [[-.72, .03, .03], [1.3, .027, .027]])), MAT.woodDark);
    M(wg('spearG', () => cylZ(.036, .036, .3, 8)), MAT.leather, 0, 0, .05);
    M(wg('spearE', () => new THREE.ConeGeometry(.034, .1, 8).rotateX(-Math.PI / 2)), MAT.steelDark, 0, 0, -.76);
    M(wg('spearC', () => cylZ(.042, .036, .09, 8)), MAT.brass, 0, 0, 1.31);
    M(wg('spearB', () => loftGeo(RHOMB, [[1.34, .022, .013], [1.44, .075, .018], [1.62, .046, .014], [1.8, .003, .003]])), blade);
    for (let i = 0; i < 3; i++) { const t = B(MAT.red, .025, .14, .025, (i - 1) * .025, -.08, 1.26); t.rotation.z = (i - 1) * .3; }
    if (rar) B(rune, .012, .004, .2, 0, .015, 1.5);
  } else if (type === 'martello') {
    M(wg('hamH', () => loftGeo(OCT, [[-.28, .034, .034], [.82, .03, .03]])), MAT.woodDark);
    M(wg('grip8h', () => cylZ(.041, .041, .26, 8)), MAT.leather, 0, 0, -.12);
    B(MAT.brass, .09, .09, .06, 0, 0, -.3);
    B(MAT.steelDark, .42, .22, .22, 0, 0, .84);
    for (const s of [-1, 1]) { M(wg('hamF', () => new THREE.CylinderGeometry(.13, .14, .07, 8).rotateZ(Math.PI / 2)), blade, s * .24, 0, .84); B(MAT.brass, .03, .236, .236, s * .1, 0, .84); }
    M(wg('hamSp', () => new THREE.ConeGeometry(.05, .16, 4).rotateX(Math.PI / 2)), MAT.steel, 0, 0, 1.02);
    if (rar) for (const s of [-1, 1]) B(rune, .12, .005, .1, 0, s * .112, .84);
  } else if (type === 'falce') {
    M(wg('scyS', () => loftGeo(OCT, [[-.62, .03, .03], [1.15, .027, .027, .0, .0]])), MAT.woodDark);
    for (const z of [.12, .62]) B(MAT.wood, .03, .17, .04, 0, .09, z);
    B(MAT.steelDark, .09, .08, .1, .02, 0, 1.13);
    const yo = t => .05 + .1 * Math.sin(Math.PI * t * .9) - .32 * t * t;
    const out = curvePts(10, t => [.05 + .95 * t, yo(t)]), inn = curvePts(10, t => [.05 + .95 * t, yo(t) - .11 * Math.pow(1 - t, .8)]).reverse();
    M(wg('scyB', () => slabGeo(out.concat(inn.slice(1)), .022, .004)), blade, 0, 0, 1.12);
    if (rar) B(rune, .5, .03, .03, .38, 0, 1.12);
  } else if (type === 'arco') {
    const limb = rar ? blade : MAT.wood;
    M(wg('bowL', () => tubeGeo([[-.475, 0, -.07]].concat(curvePts(10, t => { const a = -.95 + 1.9 * t; return [Math.sin(a) * .55, 0, Math.cos(a) * .55 - .42]; }), [[.475, 0, -.07]]), .028, 24, 5)), limb);
    B(MAT.leather, .14, .1, .1, 0, 0, .13); B(MAT.brass, .04, .04, .03, .05, .04, .15);
    for (const s of [-1, 1]) M(wg('bowT', () => new THREE.OctahedronGeometry(.03, 0)), MAT.brass, s * .45, 0, -.095);
    bx(g, MAT.cream, .88, .02, .02, 0, 0, -.1);
  } else if (type === 'balestra') {
    M(wg('xbS', () => loftGeo(RECT, [[-.34, .035, .07, 0, -.03], [-.12, .035, .05, 0, -.005], [.52, .03, .035]])), MAT.wood);
    B(MAT.steelDark, .03, .02, .62, 0, .045, .2);
    const prod = rar ? blade : MAT.steel;
    M(wg('xbP', () => tubeGeo(curvePts(8, t => { const x = -.34 + .68 * t; return [x, .045, .5 - .12 * (x / .34) ** 2]; }), .022, 14, 5)), prod);
    for (const s of [-1, 1]) { const dx = s * .34, dz = .38 - .17, l = Math.hypot(dx, dz), st = bx(g, MAT.cream, .012, .012, l, dx / 2, .05, .17 + dz / 2); st.rotation.y = Math.atan2(dx, dz); }
    B(MAT.wood, .018, .018, .4, 0, .07, .36); M(wg('xbTip', () => new THREE.ConeGeometry(.02, .07, 4).rotateX(Math.PI / 2)), MAT.steel, 0, .07, .59);
    B(MAT.steelDark, .02, .07, .03, 0, -.06, .05); B(MAT.steel, .16, .02, .02, 0, .045, .6); for (const s of [-1, 1]) B(MAT.steel, .02, .02, .07, s * .08, .045, .63);
    if (rar) B(rune, .012, .006, .3, 0, .056, .2);
  } else if (type === 'trombone') {
    M(wg('blSt', () => loftGeo(RECT, [[-.34, .032, .08, 0, -.075], [-.06, .03, .05, 0, -.015], [.14, .028, .038]])), MAT.wood);
    M(wg('blBar', () => cylZ(.032, .03, .64, 10)), MAT.brass, 0, .02, .42);
    M(wg('blBell', () => cylZ(.034, .078, .16, 12)), MAT.brass, 0, .02, .8);
    M(wg('blMouth', () => cylZ(.064, .064, .01, 12)), MAT.black, 0, .02, .878);
    for (const z of [.18, .44, .66]) M(wg('blBand', () => cylZ(.038, .038, .03, 10)), rar ? rune : MAT.steelDark, 0, .02, z);
    B(MAT.wood, .05, .04, .42, 0, -.03, .32);
    B(MAT.steelDark, .02, .06, .04, 0, .07, .06); B(MAT.steelDark, .016, .05, .02, 0, -.05, .04); B(MAT.brass, .02, .02, .12, 0, -.08, .05);
  } else if (type === 'bastone') {
    M(wg('stS', () => loftGeo(OCT, [[-.3, .032, .032], [.2, .037, .036, .01, 0], [.6, .033, .033, -.008, .006], [.96, .036, .036]])), MAT.woodDark);
    M(wg('stC', () => cylZ(.05, .056, .08, 8)), MAT.brass, 0, 0, .98);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU, pr = B(MAT.brass, .02, .02, .17, Math.cos(a) * .05, Math.sin(a) * .05, 1.08); pr.rotation.set(-Math.sin(a) * .35, Math.cos(a) * .35, 0); }
    const gm = M(wg('stGem', () => new THREE.OctahedronGeometry(.1, 0)), rar === 2 ? MAT.gemEpic : rar === 1 ? MAT.gemBlue : MAT.gem, 0, 0, 1.14); gm.scale.set(.9, .9, 1.35); g.userData.gem = gm;
  } else if (type === 'tomo') {
    B(MAT.leather, .035, .035, .32, 0, 0, .2);
    for (const s of [-1, 1]) {
      const h = pivot(g, 0, 0, .2); h.rotation.z = s * .26;
      bx(h, rar === 2 ? MAT.purple : rar === 1 ? MAT.navy : MAT.red, .21, .02, .32, s * .105, 0, 0);
      bx(h, MAT.paper, .19, .028, .29, s * .1, .02, 0);
      for (let i = 0; i < 3; i++) bx(h, MAT.zap, .11, .004, .015, s * .1, .036, -.07 + i * .07, false);
      bx(h, MAT.brass, .04, .025, .04, s * .19, 0, .14); bx(h, MAT.brass, .04, .025, .04, s * .19, 0, -.14);
    }
    const cr = M(wg('tomoC', () => new THREE.OctahedronGeometry(.05, 0)), rar === 2 ? MAT.gemEpic : MAT.zap, 0, .17, .2); cr.scale.y = 1.5; g.userData.gem = cr;
  } else if (type === 'lanterna') {
    M(wg('lnR', () => cylZ(.02, .02, .42, 6)), MAT.brass, 0, 0, .16);
    M(wg('grip8l', () => cylZ(.032, .032, .16, 8)), MAT.leather, 0, 0, 0);
    B(MAT.brass, .18, .03, .18, 0, -.11, .5);
    M(wg('lnTop', () => new THREE.CylinderGeometry(.02, .13, .1, 4).rotateY(Math.PI / 4)), MAT.brass, 0, .14, .5);
    B(MAT.brass, .015, .07, .015, 0, .21, .5);
    for (const [x, z] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) B(rar ? rune : MAT.brass, .022, .22, .022, x, 0, .5 + z);
    bx(g, MAT.glassWarm, .14, .2, .14, 0, 0, .5, false);
    const f = M(wg('lnF', () => new THREE.OctahedronGeometry(.05, 0)), MAT.flame, 0, -.02, .5); f.scale.y = 1.6; f.castShadow = false; g.userData.gem = f;
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
  const eye = variant === 'capotreno' ? MAT.eyeTeal : MAT.ember;
  bx(head, MAT.boneDark, .09, .08, .02, -.08, .22, .162); bx(head, MAT.boneDark, .09, .08, .02, .08, .22, .162);
  bx(head, eye, .04, .04, .02, -.08, .22, .168); bx(head, eye, .04, .04, .02, .08, .22, .168);
  const armL = pivot(upper, -.28, .6, 0), armR = pivot(upper, .28, .6, 0);
  for (const A of [armL, armR]) { bx(A, MAT.bone, .07, .55, .07, 0, -.27, 0); bx(A, MAT.bone, .1, .1, .1, 0, -.58, 0); }
  const hand = pivot(armR, 0, -.58, .03), handL = pivot(armL, 0, -.58, .03);
  let wm = null, shield = null, light = null;
  if (variant === 'arciere') {
    bx(head, MAT.red, .38, .14, .38, 0, .4, 0); bx(head, MAT.red, .38, .34, .07, 0, .22, -.17); bx(upper, MAT.red, .46, .12, .28, 0, .66, 0);
    bx(upper, MAT.red, .3, .5, .04, .05, .28, -.14);
  } else if (variant === 'cuoco') {
    bx(head, MAT.chef, .36, .1, .36, 0, .38, 0); bx(head, MAT.chef, .44, .3, .44, 0, .58, 0); bx(head, MAT.chef, .3, .12, .3, .04, .76, -.02);
    bx(upper, MAT.chef, .4, .6, .04, 0, .2, .13); bx(upper, MAT.chef, .44, .05, .26, 0, .0, 0); bx(upper, MAT.scarfRed, .3, .08, .24, 0, .6, .02);
    wm = cleaverModel(); hand.add(wm);
  } else if (variant === 'fuochista') {
    bx(head, MAT.soot, .38, .1, .4, 0, .38, -.01); bx(head, MAT.soot, .36, .03, .16, 0, .34, .22);
    for (const x of [-.12, .12]) bx(upper, MAT.leather, .06, .56, .24, x, .32, 0);
    bx(upper, MAT.scarfRed, .32, .1, .26, 0, .6, .01); bx(upper, MAT.soot, .3, .2, .05, 0, .12, .12);
    wm = shovelModel(); hand.add(wm);
  } else if (variant === 'guardia') {
    bx(head, MAT.armor, .4, .34, .4, 0, .22, 0); bx(head, MAT.black, .3, .04, .02, 0, .24, .205); bx(head, MAT.armor, .06, .16, .03, 0, .16, .21);
    bx(head, MAT.plume, .06, .22, .36, 0, .48, -.03);
    bx(upper, MAT.armor, .46, .5, .26, 0, .34, 0); bx(upper, MAT.armor, .2, .14, .3, -.3, .64, 0); bx(upper, MAT.armor, .2, .14, .3, .3, .64, 0);
    bx(upper, MAT.brass, .48, .04, .28, 0, .1, 0);
    shield = pivot(upper, -.1, .3, .32);
    bx(shield, MAT.shieldWood, .62, .92, .06, 0, 0, 0); bx(shield, MAT.brass, .66, .05, .07, 0, .45, 0); bx(shield, MAT.brass, .66, .05, .07, 0, -.45, 0);
    bx(shield, MAT.brass, .05, .92, .07, -.31, 0, 0); bx(shield, MAT.brass, .05, .92, .07, .31, 0, 0); bx(shield, MAT.steel, .2, .2, .06, 0, .05, .04);
    bx(shield, MAT.red, .05, .7, .065, 0, 0, .005);
  } else if (variant === 'capotreno') {
    bx(upper, MAT.coat, .52, .66, .3, 0, .33, 0); bx(upper, MAT.coatDark, .54, .08, .32, 0, .08, 0);
    for (let i = 0; i < 4; i++) { bx(upper, MAT.brass, .05, .05, .02, -.09, .5 - i * .12, .16); bx(upper, MAT.brass, .05, .05, .02, .09, .5 - i * .12, .16); }
    for (const x of [-.3, .3]) { bx(upper, MAT.brass, .18, .05, .26, x, .67, 0); for (let i = 0; i < 3; i++) bx(upper, MAT.brass, .02, .08, .02, x - .06 + i * .06, .62, .12); }
    bx(body, MAT.coat, .5, .55, .1, 0, .55, -.13); bx(body, MAT.coat, .2, .5, .08, -.15, .55, .12); bx(body, MAT.coat, .2, .5, .08, .15, .55, .12);
    bx(head, MAT.coat, .4, .17, .42, 0, .41, 0); bx(head, MAT.black, .4, .03, .16, 0, .34, .23); bx(head, MAT.brass, .14, .08, .02, 0, .43, .215); bx(head, MAT.red, .41, .03, .43, 0, .35, 0);
    for (const A of [armL, armR]) bx(A, MAT.coat, .12, .45, .12, 0, -.22, 0);
    const lan = weaponModel('lanterna', 2); lan.rotation.set(-1.3, 0, 0); lan.scale.setScalar(1.2); handL.add(lan);
    glowSprite(lan, 0, 0, .5, 1.6, 0xffa040, .55);
    light = new THREE.PointLight(lin(0xffa050), 1.5, 8, 2); light.position.set(0, -.2, .2); handL.add(light);
    wm = new THREE.Group(); bx(wm, MAT.brass, .06, .06, .2, 0, 0, .05); bx(wm, MAT.brass, .1, .04, .12, 0, .04, .18); hand.add(wm);
  } else {
    bx(head, MAT.black, .42, .04, .42, 0, .36, 0); bx(head, MAT.black, .27, .16, .27, 0, .45, 0); bx(head, MAT.red, .28, .03, .28, 0, .4, 0);
    bx(upper, MAT.slate, .46, .44, .06, 0, .36, -.13); bx(upper, MAT.slate, .1, .44, .2, -.22, .36, -.04); bx(upper, MAT.slate, .1, .44, .2, .22, .36, -.04);
  }
  if (!wm) { wm = weaponModel(wtype); (wtype === 'arco' || wtype === 'balestra' ? handL : hand).add(wm); }
  s.userData = { body, upper, legL, legR, armL, armR, head, hand, weapon: wm, wtype: variant === 'cuoco' || variant === 'fuochista' || variant === 'capotreno' ? 'x' : wtype, shield, light, phase: Math.random() * 6 };
  if (variant === 'capotreno') s.scale.setScalar(1.45);
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
function tableModel(kind) {
  const g = new THREE.Group();
  if (kind === 'cloth') {
    bx(g, MAT.wood, 1.4, .08, 1.4, 0, .82, 0); bx(g, MAT.cloth, 1.5, .03, 1.5, 0, .875, 0);
    for (const s of [-1, 1]) { bx(g, MAT.cloth, 1.5, .32, .02, 0, .73, s * .75); bx(g, MAT.cloth, .02, .32, 1.5, s * .75, .73, 0); }
    for (const [x, z] of [[-.58, -.58], [.58, -.58], [-.58, .58], [.58, .58]]) bx(g, MAT.woodDark, .1, .6, .1, x, .3, z);
    for (const [x, z] of [[-.4, -.25], [.4, .25]]) { bx(g, MAT.white, .28, .015, .28, x, .9, z); bx(g, MAT.steel, .03, .01, .2, x + .2, .9, z); bx(g, MAT.cream, .06, .12, .06, x, .96, z - .25); }
    bx(g, MAT.bottleG, .08, .28, .08, .12, 1.03, -.12); bx(g, MAT.cream, .03, .06, .03, .12, 1.2, -.12);
    bx(g, MAT.brass, .1, .03, .1, -.1, .9, .12); bx(g, MAT.cream, .04, .14, .04, -.1, .98, .12); bx(g, MAT.lamp, .04, .05, .04, -.1, 1.07, .12);
    return castAll(g);
  }
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
  const pp = PORT[type] || [4.4, .95, 1];
  return portrait('mob_' + type, () => { const md = makeMobModel(type, MOBS[type].wpn[0], true); if (pp[2] !== 1) md.scale.multiplyScalar(pp[2]); return md; }, 192, pp[0], pp[1]);
}
function classPortrait(id, outfit) {
  return portrait('cls_' + id + '_' + outfit, () => { const m = playerModel(id, outfit); setModelWeapon(m, starterWeapon(CLASSES.find(c => c.id === id))); posePlayer(m, { spd: 0, ground: true, atk: -1 }, 0); return m; });
}
