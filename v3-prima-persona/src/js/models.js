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
  MAT.fxGold = new THREE.MeshBasicMaterial({ color: lin(0xffd890), transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  MAT.ringTeal = new THREE.MeshBasicMaterial({ color: lin(0x62d4c7), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false });
  MAT.ringRed = new THREE.MeshBasicMaterial({ color: lin(0xff6a5a), transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false });
  MAT.ringWhite = new THREE.MeshBasicMaterial({ color: lin(0xf0ece2), transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
  MAT.blob = new THREE.MeshBasicMaterial({ map: TEX.glow, color: 0x000000, transparent: true, opacity: .55, depthWrite: false });
  MAT.window = emis(0x6a4a2a, 0xffa040, 1.3);
  MAT.flash = emis(0xffffff, 0xffffff, 1.3);
  MAT.brassClean = std(0xd2a050, .3, .92, { envMapIntensity: .9 });
  MAT.heart = new THREE.MeshPhysicalMaterial({ color: lin(0xff5060), emissive: lin(0xe02a3a), emissiveIntensity: 1.4, roughness: .08, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.6 });
  // personaggi: superfici morbide (pelliccia, velluto, osso) con una luce di contorno che li stacca dal buio
  const plush = TEX.plushP, fur = TEX.furP;
  const phys = (hex, o) => new THREE.MeshPhysicalMaterial(Object.assign({ color: lin(hex), roughness: .85 }, o));
  Object.assign(MAT, {
    cFur: rim(phys(0x8a7684, { map: fur.map, bumpMap: fur.bump, bumpScale: .015, sheen: 1, sheenColor: lin(0xf0d0e0), sheenRoughness: .45 }), 0xffc8a0, .45),
    cFurLight: rim(phys(0xe0cabc, { map: fur.map, bumpMap: fur.bump, bumpScale: .015, sheen: 1, sheenColor: lin(0xfff0e0), sheenRoughness: .45 }), 0xffc8a0, .35),
    cPink: rim(new THREE.MeshStandardMaterial({ color: lin(0xf0a0a4), emissive: lin(0x7a2028), emissiveIntensity: .55, roughness: .45 }), 0xff9080, .8, 2),
    cEye: phys(0x07050a, { roughness: .08, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 2 }),
    cWhite: phys(0xf4f0e8, { roughness: .2, clearcoat: .8, clearcoatRoughness: .1 }),
    cWhisker: std(0xf6eee2, .35),
    cBone: rim(new THREE.MeshStandardMaterial({ color: lin(0xf4e8d0), map: TEX.boneP.map, bumpMap: TEX.boneP.bump, bumpScale: .006, roughnessMap: TEX.boneP.rough, roughness: 1, emissive: lin(0x3a2410), emissiveIntensity: .3, envMapIntensity: .7 }), 0x9fe8ff, .55),
    cSocket: new THREE.MeshBasicMaterial({ color: lin(0x040203) }),
    cVest: rim(phys(0x3c4656, { map: plush.map, bumpMap: plush.bump, bumpScale: .008, sheen: .7, sheenColor: lin(0xa8c0e0), sheenRoughness: .5 }), 0x9fe8ff, .35),
    cHood: rim(phys(0xa02432, { map: plush.map, bumpMap: plush.bump, bumpScale: .008, roughness: .9, sheen: 1, sheenColor: lin(0xff8890), sheenRoughness: .42, side: THREE.DoubleSide }), 0xff9080, .4),
    cFelt: rim(phys(0x18161c, { roughness: .8, sheen: .8, sheenColor: lin(0x7a7a90), sheenRoughness: .5 }), 0x9fe8ff, .45),
    cRibbon: rim(phys(0xa81c2c, { roughness: .4, sheen: .6, sheenColor: lin(0xff9aa0) }), 0xff9080, .3),
    cEnamel: phys(0xeee2c6, { roughness: .28, clearcoat: .9, clearcoatRoughness: .12 }),
    cLens: phys(0xffc070, { emissive: lin(0xff9a30), emissiveIntensity: 2.6, roughness: .05, clearcoat: 1, clearcoatRoughness: 0 }),
    cGlove: phys(0xf6f2ea, { roughness: .6, sheen: .6, sheenColor: lin(0xffffff) }),
    cSkin: rim(new THREE.MeshStandardMaterial({ color: lin(0xeab894), roughness: .55, emissive: lin(0x50200e), emissiveIntensity: .3 }), 0xffc8a0, .45),
    cBeard: rim(phys(0xf2eee8, { map: fur.map, bumpMap: fur.bump, bumpScale: .01, roughness: .8, sheen: 1, sheenColor: lin(0xffffff), sheenRoughness: .5 }), 0xbfe8ff, .45),
    cHatPurple: rim(phys(0x5e3c9e, { map: plush.map, roughness: .85, sheen: 1, sheenColor: lin(0xd0b0ff), sheenRoughness: .4 }), 0xc8a0ff, .4),
    cGreen: rim(phys(0x3e6e36, { map: plush.map, roughness: .9, sheen: 1, sheenColor: lin(0xc0f0a8), sheenRoughness: .45, side: THREE.DoubleSide }), 0xb8f0a0, .35),
    cSteel: rim(Object.assign(MAT.steel.clone(), { bumpMap: null, roughness: .9, envMapIntensity: 1.1 }), 0xbfe8ff, .3),
    cGloveBlack: rim(std(0x2a2220, .5, 0, { envMapIntensity: .8 }), 0xffc8a0, .3),
    cBracer: rim(Object.assign(MAT.leatherTan.clone(), { bumpMap: null }), 0xffc8a0, .25),
    cBoneSoot: rim(new THREE.MeshStandardMaterial({ color: lin(0x8a7a68), map: TEX.boneP.map, bumpMap: TEX.boneP.bump, bumpScale: .006, roughnessMap: TEX.boneP.rough, roughness: 1, emissive: lin(0x3a1404), emissiveIntensity: .35 }), 0xffa060, .5),
    cChef: rim(phys(0xf4f0e6, { map: plush.map, bumpMap: plush.bump, bumpScale: .006, roughness: .9, sheen: .8, sheenColor: lin(0xffffff), sheenRoughness: .5 }), 0xbfe8ff, .35),
    cCoat: rim(phys(0x1a2248, { map: plush.map, bumpMap: plush.bump, bumpScale: .008, roughness: .85, sheen: .4, sheenColor: lin(0x4a5aa0), sheenRoughness: .5 }), 0x9fe8ff, .35),
    cPlume: rim(phys(0xc0202e, { map: fur.map, roughness: .9, sheen: 1, sheenColor: lin(0xff8a90), sheenRoughness: .4 }), 0xff9080, .4)
  });
  rim(MAT.ghost, 0xa8fff2, 1.4, 1.8); MAT.ghost.needsUpdate = true;
  for (const pair of outfitMats) for (const m of pair) { m.map = plush.map; m.bumpMap = plush.bump; m.bumpScale = .006; rim(m, 0xffc8a0, .25); m.needsUpdate = true; }
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
    for (const z of [-.12, .06]) M(wg('wire', () => cylZ(.039, .039, .014, 8)), MAT.brassClean, 0, 0, z);
    M(wg('pommel', () => new THREE.OctahedronGeometry(.062, 0)), MAT.brassClean, 0, 0, -.19);
    B(MAT.brassClean, .34, .05, .07, 0, 0, .13);
    for (const s of [-1, 1]) M(wg('qend', () => new THREE.OctahedronGeometry(.042, 0)), MAT.brassClean, s * .18, 0, .13);
    if (rar) M(wg('ggem', () => new THREE.OctahedronGeometry(.036, 0)), gem, 0, 0, .13).scale.set(1, 1.7, 1);
    M(wg('swordB', () => loftGeo(RHOMB, [[.15, .05, .017], [.32, .048, .018], [.86, .042, .015], [1.06, .003, .003]])), blade);
    for (const s of [-1, 1]) B(rune, .016, .004, .52, 0, s * .0135, .56);
  } else if (type === 'sciabola') {
    M(wg('grip8s', () => cylZ(.031, .033, .24, 8)), MAT.leather, 0, 0, -.03);
    B(MAT.brassClean, .07, .06, .07, .01, 0, -.17);
    B(MAT.brassClean, .2, .04, .06, .02, 0, .12);
    B(MAT.brassClean, .02, .022, .3, .085, 0, -.02); B(MAT.brassClean, .05, .022, .02, .07, 0, -.16);
    M(wg('sabreB', () => loftGeo(EDGE, [[.14, .045, .012], [.36, .044, .012, -.012], [.6, .042, .011, -.04], [.84, .036, .01, -.085], [1.0, .004, .003, -.13]])), blade);
    if (rar) M(wg('sabreR', () => loftGeo(RECT, [[.2, .006, .014, -.03], [.5, .006, .014, -.055], [.75, .005, .013, -.09]])), rune);
  } else if (type === 'ascia') {
    M(wg('axeH', () => loftGeo(OCT, [[-.24, .032, .032], [.4, .036, .036], [.84, .03, .03]])), MAT.woodDark);
    M(wg('grip8a', () => cylZ(.04, .04, .2, 8)), MAT.leather, 0, 0, -.1);
    M(wg('cap8', () => cylZ(.043, .043, .04, 8)), MAT.brassClean, 0, 0, -.25);
    B(MAT.steelDark, .11, .11, .16, 0, 0, .7);
    M(wg('axeB', () => slabGeo([[.05, -.08], [.16, -.12], [.26, -.2], [.34, -.19], [.38, -.07], [.39, .06], [.36, .17], [.3, .21], [.18, .14], [.05, .08]], .035)), blade, 0, 0, .7);
    const sp = M(wg('axeSp', () => new THREE.ConeGeometry(.045, .15, 4).rotateZ(Math.PI / 2)), MAT.steelDark, -.12, 0, .7); sp.rotation.x = Math.PI / 4;
    if (rar) B(rune, .02, .05, .26, .27, 0, .7);
  } else if (type === 'pugnale') {
    M(wg('grip6', () => cylZ(.03, .03, .17, 6)), MAT.leather, 0, 0, 0);
    M(wg('pomS', () => new THREE.OctahedronGeometry(.04, 0)), MAT.brassClean, 0, 0, -.1);
    B(MAT.brassClean, .17, .04, .05, 0, 0, .1);
    for (const s of [-1, 1]) { const q = B(MAT.brassClean, .05, .035, .035, s * .1, 0, .125); q.rotation.y = s * .6; }
    M(wg('daggerB', () => loftGeo(RHOMB, [[.12, .04, .013], [.36, .03, .011], [.5, .003, .003]])), blade);
    if (rar) B(rune, .012, .004, .22, 0, .012, .27);
  } else if (type === 'lancia') {
    M(wg('spearS', () => loftGeo(OCT, [[-.72, .03, .03], [1.3, .027, .027]])), MAT.woodDark);
    M(wg('spearG', () => cylZ(.036, .036, .3, 8)), MAT.leather, 0, 0, .05);
    M(wg('spearE', () => new THREE.ConeGeometry(.034, .1, 8).rotateX(-Math.PI / 2)), MAT.steelDark, 0, 0, -.76);
    M(wg('spearC', () => cylZ(.042, .036, .09, 8)), MAT.brassClean, 0, 0, 1.31);
    M(wg('spearB', () => loftGeo(RHOMB, [[1.34, .022, .013], [1.44, .075, .018], [1.62, .046, .014], [1.8, .003, .003]])), blade);
    for (let i = 0; i < 3; i++) { const t = B(MAT.red, .025, .14, .025, (i - 1) * .025, -.08, 1.26); t.rotation.z = (i - 1) * .3; }
    if (rar) B(rune, .012, .004, .2, 0, .015, 1.5);
  } else if (type === 'martello') {
    M(wg('hamH', () => loftGeo(OCT, [[-.28, .034, .034], [.82, .03, .03]])), MAT.woodDark);
    M(wg('grip8h', () => cylZ(.041, .041, .26, 8)), MAT.leather, 0, 0, -.12);
    B(MAT.brassClean, .09, .09, .06, 0, 0, -.3);
    B(MAT.steelDark, .42, .22, .22, 0, 0, .84);
    for (const s of [-1, 1]) { M(wg('hamF', () => new THREE.CylinderGeometry(.13, .14, .07, 8).rotateZ(Math.PI / 2)), blade, s * .24, 0, .84); B(MAT.brassClean, .03, .236, .236, s * .1, 0, .84); }
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
    B(MAT.leather, .14, .1, .1, 0, 0, .13); B(MAT.brassClean, .04, .04, .03, .05, .04, .15);
    for (const s of [-1, 1]) M(wg('bowT', () => new THREE.OctahedronGeometry(.03, 0)), MAT.brassClean, s * .45, 0, -.095);
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
    M(wg('blBar', () => cylZ(.032, .03, .64, 10)), MAT.brassClean, 0, .02, .42);
    M(wg('blBell', () => cylZ(.034, .078, .16, 12)), MAT.brassClean, 0, .02, .8);
    M(wg('blMouth', () => cylZ(.064, .064, .01, 12)), MAT.black, 0, .02, .878);
    for (const z of [.18, .44, .66]) M(wg('blBand', () => cylZ(.038, .038, .03, 10)), rar ? rune : MAT.steelDark, 0, .02, z);
    B(MAT.wood, .05, .04, .42, 0, -.03, .32);
    B(MAT.steelDark, .02, .06, .04, 0, .07, .06); B(MAT.steelDark, .016, .05, .02, 0, -.05, .04); B(MAT.brassClean, .02, .02, .12, 0, -.08, .05);
  } else if (type === 'bastone') {
    M(wg('stS', () => loftGeo(OCT, [[-.3, .032, .032], [.2, .037, .036, .01, 0], [.6, .033, .033, -.008, .006], [.96, .036, .036]])), MAT.woodDark);
    M(wg('stC', () => cylZ(.05, .056, .08, 8)), MAT.brassClean, 0, 0, .98);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU, pr = B(MAT.brassClean, .02, .02, .17, Math.cos(a) * .05, Math.sin(a) * .05, 1.08); pr.rotation.set(-Math.sin(a) * .35, Math.cos(a) * .35, 0); }
    const gm = M(wg('stGem', () => new THREE.OctahedronGeometry(.1, 0)), rar === 2 ? MAT.gemEpic : rar === 1 ? MAT.gemBlue : MAT.gem, 0, 0, 1.14); gm.scale.set(.9, .9, 1.35); g.userData.gem = gm;
  } else if (type === 'tomo') {
    B(MAT.leather, .035, .035, .32, 0, 0, .2);
    for (const s of [-1, 1]) {
      const h = pivot(g, 0, 0, .2); h.rotation.z = s * .26;
      bx(h, rar === 2 ? MAT.purple : rar === 1 ? MAT.navy : MAT.red, .21, .02, .32, s * .105, 0, 0);
      bx(h, MAT.paper, .19, .028, .29, s * .1, .02, 0);
      for (let i = 0; i < 3; i++) bx(h, MAT.zap, .11, .004, .015, s * .1, .036, -.07 + i * .07, false);
      bx(h, MAT.brassClean, .04, .025, .04, s * .19, 0, .14); bx(h, MAT.brassClean, .04, .025, .04, s * .19, 0, -.14);
    }
    const cr = M(wg('tomoC', () => new THREE.OctahedronGeometry(.05, 0)), rar === 2 ? MAT.gemEpic : MAT.zap, 0, .17, .2); cr.scale.y = 1.5; g.userData.gem = cr;
  } else if (type === 'lanterna') {
    M(wg('lnR', () => cylZ(.02, .02, .42, 6)), MAT.brassClean, 0, 0, .16);
    M(wg('grip8l', () => cylZ(.032, .032, .16, 8)), MAT.leather, 0, 0, 0);
    B(MAT.brassClean, .18, .03, .18, 0, -.11, .5);
    M(wg('lnTop', () => new THREE.CylinderGeometry(.02, .13, .1, 4).rotateY(Math.PI / 4)), MAT.brassClean, 0, .14, .5);
    B(MAT.brassClean, .015, .07, .015, 0, .21, .5);
    for (const [x, z] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) B(rar ? rune : MAT.brassCleanClean, .022, .22, .022, x, 0, .5 + z);
    bx(g, MAT.glassWarm, .14, .2, .14, 0, 0, .5, false);
    const f = M(wg('lnF', () => new THREE.OctahedronGeometry(.05, 0)), MAT.flame, 0, -.02, .5); f.scale.y = 1.6; f.castShadow = false; g.userData.gem = f;
  }
  if (g.userData.gem) g.userData.gem.userData.keep = true;
  return castAll(bake(g, 'w:' + type + ':' + rar));
}

/* ---------- personaggio del giocatore (schede di scelta e armadio) ---------- */
function playerModel(clsId, outfit) {
  const root = new THREE.Group(), om = outfitMats[outfit] || outfitMats[0];
  const body = pivot(root, 0, 0, 0);
  const legL = pivot(body, -.11, .86, 0), legR = pivot(body, .11, .86, 0);
  for (const L of [legL, legR]) {
    part(L, MAT.trousers, sg('pLeg', () => capsule(.06, .5)), 0, -.36, 0);
    part(L, MAT.leatherBlack, sg('pBootTop', () => new THREE.CylinderGeometry(.085, .072, .24, 14)), 0, -.62, 0);
    part(L, MAT.leatherBlack, sg('pBoot', () => blob(.075, .07, .17, 14, -.3)), 0, -.8, .06);
    part(L, MAT.leatherBlack, sg('pToe', () => taperTube([[0, -.8, .16], [0, -.78, .24], [0, -.72, .27]], t => .04 * (1 - t * .7), 8, 8)), 0, 0, 0);
  }
  const upper = pivot(body, 0, .86, 0);
  part(upper, om[0], sg('pCoat', () => lathe([[.27, -.2], [.25, 0], [.19, .2], [.22, .44], [.25, .58], [.17, .7], [.06, .74], [0, .745]], 22)));
  part(upper, MAT.leather, sg('pBelt', () => new THREE.TorusGeometry(.2, .032, 8, 24).rotateX(Math.PI / 2)), 0, .14, 0);
  part(upper, MAT.brassAged, sg('pBuckle', () => rbox(.08, .07, .03, .01)), 0, .14, .2);
  part(upper, om[1], sg('pCollar', () => new THREE.TorusGeometry(.13, .055, 8, 20).rotateX(Math.PI / 2)), 0, .7, 0);
  const cloak = pivot(upper, 0, .7, -.18);
  part(cloak, om[1], sg('pCloak', () => { const g = rbox(.56, 1.05, .035, .015, 1), P = g.attributes.position.array; for (let i = 0; i < P.length; i += 3) P[i + 2] += Math.sin(P[i] * 22) * .025 * (.5 - P[i + 1]) - (.5 - P[i + 1]) * .06; g.computeVertexNormals(); return g; }), 0, -.5, 0);
  const head = pivot(upper, 0, .76, 0);
  // testa grande, naso lungo, occhioni lucidi
  part(head, MAT.cSkin, sg('pHead', () => blob(.2, .22, .2, 24)), 0, .2, 0);
  part(head, MAT.cSkin, sg('pNose', () => new THREE.ConeGeometry(.045, .22, 14).rotateX(Math.PI / 2 + .35)), 0, .15, .26);
  for (const sx of [-1, 1]) { part(head, MAT.cWhite, sg('pEyeW', () => blob(.055, .062, .03, 14)), sx * .075, .25, .17); part(head, MAT.cEye, sg('pEye', () => sph(.03)), sx * .073, .245, .192); }
  const armL = pivot(upper, -.27, .62, 0), armR = pivot(upper, .27, .62, 0);
  for (const A of [armL, armR]) { part(A, om[0], sg('pSleeve', () => capsule(.065, .4)), 0, -.27, 0); part(A, MAT.cGlove, sg('pHand', () => blob(.06, .07, .06, 12)), 0, -.58, .02); }
  const hand = pivot(armR, 0, -.6, .04), handL = pivot(armL, 0, -.6, .04);
  if (clsId === 'cavaliere') {
    // elmo tondo con la feritoia e un pennacchio altissimo; due baffi a spirale escono da sotto
    part(head, MAT.cSteel, sg('pHelm', () => blob(.25, .27, .25, 24)), 0, .24, -.01);
    part(head, MAT.cSocket, sg('pSlit', () => rbox(.3, .035, .06, .015)), 0, .26, .225);
    for (const sx of [-1, 1]) part(head, MAT.ember, sg('pSlitEye', () => sph(.018)), sx * .07, .262, .24);
    part(head, MAT.brassAged, sg('pHelmBand', () => new THREE.TorusGeometry(.252, .016, 6, 28).rotateX(Math.PI / 2)), 0, .2, -.01);
    part(head, MAT.cPlume, sg('pPlume', () => taperTube([[0, .48, 0], [0, .72, -.06], [0, .86, -.24], [0, .8, -.46], [0, .62, -.56]], t => .06 * (1 - t * .6) + Math.sin(t * Math.PI) * .03, 30, 10)));
    for (const sx of [-1, 1]) part(head, MAT.cBeard, sg('pMust' + sx, () => taperTube([[0, .08, .22], [sx * .12, .06, .22], [sx * .22, .1, .16], [sx * .2, .18, .14], [sx * .14, .15, .16]], t => .03 * (1 - t * .7), 24, 8)));
    for (const sx of [-1, 1]) part(upper, MAT.cSteel, sg('pPaul', () => blob(.15, .1, .14, 16)), sx * .27, .66, 0, 0, 0, sx * -.3);
    part(upper, MAT.cSteel, sg('pBreast', () => blob(.23, .26, .16, 20)), 0, .42, .1);
  } else if (clsId === 'ranger') {
    // cappuccio con la punta lunghissima che ricade fino alla cintura, faretra sulla schiena
    part(head, MAT.cGreen, sg('pHood', () => new THREE.SphereGeometry(.27, 22, 14, Math.PI / 2 + .9, TAU - 1.8, 0, Math.PI * .72)), 0, .21, -.01);
    part(head, MAT.cGreen, sg('pHoodTip', () => taperTube([[0, .4, -.1], [0, .5, -.3], [.06, .36, -.52], [.1, .0, -.5], [.08, -.3, -.42]], t => .13 * (1 - t * .85), 32, 10)));
    part(upper, MAT.cGreen, sg('pMantle', () => lathe([[.3, .44], [.27, .58], [.18, .7], [.08, .74]], 20)));
    const q = part(upper, MAT.leather, sg('pQuiver', () => new THREE.CylinderGeometry(.07, .06, .6, 12)), .14, .42, -.24); q.rotation.z = -.35;
    for (let i = 0; i < 4; i++) { part(upper, MAT.cRibbon, sg('pFletch', () => rbox(.03, .12, .012, .004)), .25 + i * .025, .78 - i * .015, -.24 + (i - 1.5) * .025, 0, 0, -.35); }
  } else {
    // cappello altissimo e storto, barba lunga, occhialini tondi
    part(head, MAT.cHatPurple, sg('pBrim', () => lathe([[.0, 0], [.34, 0], [.36, .015], [.3, .035], [0, .04]], 28)), 0, .36, 0, -.06, 0, .05);
    part(head, MAT.cHatPurple, sg('pCone', () => taperTube([[0, .36, 0], [0, .56, -.02], [.03, .74, -.07], [.12, .86, -.1], [.22, .88, -.03]], t => .21 * Math.pow(1 - t, 1.1) + .012, 36, 16)));
    part(head, MAT.brassAged, sg('pHatBand', () => new THREE.TorusGeometry(.2, .02, 6, 24).rotateX(Math.PI / 2)), 0, .43, 0);
    part(head, MAT.gem, sg('pStar', () => new THREE.OctahedronGeometry(.04)), .19, .48, .1);
    part(head, MAT.cBeard, sg('pBeard', () => { const g = new THREE.ConeGeometry(.17, .62, 18); g.rotateX(Math.PI); return g; }), 0, -.18, .12, -.25, 0, 0);
    for (const sx of [-1, 1]) part(head, MAT.brassAged, sg('pSpec', () => new THREE.TorusGeometry(.05, .008, 6, 18)), sx * .075, .25, .205);
  }
  const parry = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), MAT.fxGold.clone()); parry.position.set(0, 1.1, .62); parry.material.opacity = 0; root.add(parry);
  root.userData = { body, upper, legL, legR, armL, armR, head, cloak, hand, handL, parry, weapon: null, phase: 0, clsId, outfit };
  return castAll(bake(root, 'p:' + clsId));
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
/* ---------- ratto del bagagliaio: pancione di velluto, orecchie enormi, occhi spaiati con monocolo, coltello tra i denti ---------- */
function ratModel() {
  const r = new THREE.Group(), body = pivot(r, 0, 0, 0), ph = Math.random() * 10;
  part(body, MAT.cFur, sg('ratBody', () => blob(.25, .23, .35, 22, .25)), 0, .29, -.07, -.18, 0, 0);
  part(body, MAT.cFurLight, sg('ratBelly', () => blob(.17, .14, .25, 16)), 0, .2, .02, -.12, 0, 0);
  part(body, MAT.cRibbon, sg('ratScarf', () => new THREE.TorusGeometry(.13, .035, 8, 20)), 0, .4, .18, Math.PI / 2 - .5, 0, 0);
  part(body, MAT.cRibbon, sg('ratKnot', () => blob(.05, .04, .03, 10)), .06, .33, .27, 0, 0, .5);
  const head = pivot(body, 0, .43, .27);
  part(head, MAT.cFur, sg('ratHead', () => blob(.155, .14, .17, 20)), 0, 0, 0);
  part(head, MAT.cFur, sg('ratSnout', () => new THREE.ConeGeometry(.095, .27, 18).rotateX(Math.PI / 2)), 0, -.035, .2);
  part(head, MAT.cPink, sg('ratNose', () => sph(.034)), 0, -.03, .335);
  for (const sx of [-1, 1]) part(head, MAT.cWhite, sg('ratTooth', () => rbox(.022, .05, .012, .005, 1)), sx * .012, -.075, .27);
  // occhi spaiati: uno enorme con il monocolo, uno piccolino
  const eyeL = pivot(head, -.085, .045, .12), eyeR = pivot(head, .08, .035, .14);
  part(eyeL, MAT.cEye, sg('ratEyeBig', () => sph(.066, 18, 14)));
  part(eyeL, MAT.eyeRed, sg('ratPupBig', () => sph(.02, 10, 8)), -.01, .012, .056);
  part(eyeR, MAT.cEye, sg('ratEyeSm', () => sph(.04, 14, 10)));
  part(eyeR, MAT.eyeRed, sg('ratPupSm', () => sph(.013, 8, 6)), .006, .008, .035);
  part(eyeL, MAT.brassAged, sg('ratMono', () => new THREE.TorusGeometry(.077, .009, 8, 24)), 0, 0, .035);
  part(head, MAT.brassAged, sg('ratChain', () => taperTube([[-.15, .03, .15], [-.2, -.08, .12], [-.18, -.2, .06], [-.11, -.3, .0]], () => .004, 16, 4)));
  // orecchie a ventaglio, rosa e controluce
  const earL = pivot(head, -.1, .1, -.02), earR = pivot(head, .1, .1, -.02);
  for (const [E, sx] of [[earL, -1], [earR, 1]]) {
    part(E, MAT.cPink, sg('ratEar', () => blob(.13, .15, .018, 18)), sx * .08, .1, .006, 0, sx * -.45, sx * -.3);
    part(E, MAT.cFur, sg('ratEarB', () => blob(.138, .158, .016, 18)), sx * .08, .1, -.01, 0, sx * -.45, sx * -.3);
  }
  // cartellino del bagaglio appeso all'orecchio destro
  part(earR, MAT.cWhisker, sg('ratTagStr', () => taperTube([[.15, .0, .0], [.18, -.06, .02], [.19, -.11, .03]], () => .003, 8, 4)));
  part(earR, MAT.paper, sg('ratTag', () => rbox(.055, .08, .004, .002)), .19, -.15, .03, 0, .3, .2);
  part(earR, MAT.cRibbon, sg('ratTagDot', () => new THREE.CircleGeometry(.012, 10)), .192, -.13, .034, 0, .3, 0);
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) part(head, MAT.cWhisker, sg('ratWhisk', () => new THREE.CylinderGeometry(.0018, .0028, .28, 4).translate(0, .14, 0)), sx * .045, -.04 + i * .014, .27, 0, sx * .35, -sx * (Math.PI / 2 - .3 + i * .28));
  // zampe: davanti braccine con le manine rosa, dietro cosce tonde e piedoni
  const legs = [[-.12, .16, 1], [.12, .16, 1], [-.15, -.2, 0], [.15, -.2, 0]].map(([x, z, front]) => {
    const p = pivot(body, x, .2, z);
    if (front) { part(p, MAT.cFur, sg('ratArm', () => capsule(.038, .1)), 0, -.08, .02); part(p, MAT.cPink, sg('ratPaw', () => blob(.04, .024, .055, 10)), 0, -.175, .04); }
    else { part(p, MAT.cFur, sg('ratHaunch', () => blob(.09, .11, .13, 14)), x > 0 ? .02 : -.02, .03, 0); part(p, MAT.cPink, sg('ratFoot', () => blob(.045, .024, .11, 10)), 0, -.175, .06); }
    return p;
  });
  // coda lunghissima che finisce in un ricciolo
  const tail = pivot(body, 0, .25, -.38);
  part(tail, MAT.cPink, sg('ratTail', () => taperTube([[0, 0, 0], [0, -.08, -.2], [.06, -.12, -.42], [.16, -.06, -.6], [.24, .08, -.7], [.22, .22, -.64], [.15, .22, -.56], [.15, .15, -.55]], t => .034 * (1 - t * .82), 48, 8)));
  const d = weaponModel('pugnale'); d.scale.setScalar(.7); d.rotation.set(0, Math.PI / 2, .12); d.position.set(-.14, -.075, .24); head.add(d);
  r.userData = {
    body, tail, legs, head,
    tick(t, dt, spd) {
      head.rotation.y = Math.sin(t * 2.3 + ph) * .18; head.rotation.x = Math.sin(t * 5.1 + ph) * .05 - .05;
      earL.rotation.x = Math.max(0, Math.sin(t * 6 + ph) - .85) * 3; earR.rotation.x = Math.max(0, Math.sin(t * 5.3 + ph + 1) - .85) * 3;
      const bl = (t * .6 + ph) % 3 < .1 ? .12 : 1; eyeL.scale.y = bl; eyeR.scale.y = (t * .6 + ph + .15) % 3 < .1 ? .12 : 1;
    }
  };
  addBlob(r, .7); return castAll(bake(r, 'rat'));
}

/* ---------- scheletri: lunghi e ossuti, cranio enorme, occhi di brace. Il passeggero in panciotto e bombetta, l'arciere col cappuccio e un occhio solo,
   il cuoco col cappello che non finisce mai, il fuochista fuligginoso con gli occhialoni, la guardia in armatura, il Capotreno in redingote ---------- */
function skeletonModel(variant, wtype) {
  const s = new THREE.Group(), body = pivot(s, 0, 0, 0), ph = Math.random() * 10;
  const arch = variant === 'arciere', soot = variant === 'fuochista', boss = variant === 'capotreno', guard = variant === 'guardia', chef = variant === 'cuoco';
  const B = soot ? MAT.cBoneSoot : MAT.cBone, eyeM = boss ? MAT.eyeTeal : MAT.ember;
  const legL = pivot(body, -.11, .86, 0), legR = pivot(body, .11, .86, 0);
  for (const L of [legL, legR]) {
    part(L, B, sg('skFemur', () => capsule(.03, .34)), 0, -.21, 0);
    part(L, B, sg('skKnee', () => sph(.048)), 0, -.42, .012);
    part(L, B, sg('skTibia', () => capsule(.026, .32)), 0, -.62, 0);
    if (arch) { part(L, B, sg('skFoot', () => blob(.05, .03, .12, 10)), 0, -.83, .06); for (let i = 0; i < 3; i++) part(L, B, sg('skToe', () => capsule(.01, .04, 5)), -.025 + i * .025, -.845, .17, Math.PI / 2, 0, 0); }
    else if (guard) { part(L, MAT.cSteel, sg('skGreave', () => lathe([[.05, 0], [.055, .12], [.048, .3], [.04, .32]], 14)), 0, -.82, 0); part(L, MAT.cSteel, sg('skSabaton', () => blob(.06, .045, .14, 14, -.3)), 0, -.82, .06); }
    else { part(L, MAT.leatherBlack, sg('skShoe', () => blob(.058, .045, .14, 14, -.35)), 0, -.82, .06); if (!soot) part(L, boss ? MAT.cCoat : MAT.cGlove, sg('skSpat', () => new THREE.CylinderGeometry(.045, .066, .11, 12)), 0, -.76, 0); }
  }
  const upper = pivot(body, 0, .86, 0);
  part(upper, B, sg('skPelvis', () => lathe([[.05, -.07], [.13, -.05], [.15, .02], [.12, .07], [.05, .05], [.0, .06]], 18).scale(1, 1, .7)));
  for (let i = 0; i < 7; i++) part(upper, B, sg('skVert', () => blob(.03, .022, .03, 8)), 0, .08 + i * .075, -.05 - Math.sin(i / 6 * Math.PI) * .03);
  [[.12, .27], [.15, .35], [.155, .43], [.14, .51]].forEach(([R, y], i) => part(upper, B, sg('skRib' + i, () => { const g = new THREE.TorusGeometry(R, .014, 6, 20, Math.PI * 1.72); g.rotateZ(Math.PI / 2 + Math.PI * .14); g.rotateX(Math.PI / 2); g.scale(1, 1, .78); return g; }), 0, y, -.02, .22, 0, 0));
  part(upper, B, sg('skSternum', () => rbox(.035, .22, .02, .008)), 0, .3, .1, -.15, 0, 0);
  part(upper, B, sg('skClav', () => capsule(.02, .42).rotateZ(Math.PI / 2)), 0, .6, .02);
  for (let i = 0; i < 4; i++) part(upper, B, sg('skNeck', () => blob(.026, .02, .026, 8)), 0, .63 + i * .036, -.01);
  const head = pivot(upper, 0, .75, 0);
  part(head, B, sg('skCranium', () => blob(.18, .2, .2, 24)), 0, .21, -.02);
  part(head, B, sg('skMaxilla', () => blob(.13, .075, .11, 16)), 0, .085, .06);
  part(head, B, sg('skCheek', () => capsule(.025, .2, 6).rotateZ(Math.PI / 2)), 0, .12, .1);
  part(head, MAT.cSocket, sg('skNoseHole', () => new THREE.ConeGeometry(.024, .05, 3).rotateZ(Math.PI)), 0, .13, .16);
  if (arch) {
    part(head, MAT.cSocket, sg('skSockBig', () => blob(.075, .07, .035, 16)), 0, .2, .162);
    part(head, MAT.ember, sg('skEmberBig', () => sph(.032)), 0, .2, .178);
    part(head, MAT.brassAged, sg('skScope', () => new THREE.TorusGeometry(.085, .012, 8, 24)), 0, .2, .182);
    part(head, MAT.brassAged, sg('skScopeTube', () => tubeZ(.07, .085, .06, 18)), 0, .2, .21);
  } else for (const [sx, r] of [[-1, .058], [1, .048]]) {
    part(head, MAT.cSocket, sg('skSock' + sx, () => blob(r, r * .92, .03, 14)), sx * .075, .2, .155);
    part(head, eyeM, sg('skEmber' + sx, () => sph(r * .38)), sx * .075, .2, .17);
  }
  const jaw = pivot(head, 0, .07, 0);
  part(jaw, B, sg('skJaw', () => blob(.11, .045, .11, 14)), 0, -.035, .065);
  for (let i = 0; i < 6; i++) { part(jaw, B, sg('skTooth', () => rbox(.018, .03, .014, .005, 1)), -.05 + i * .02, 0, .16 - Math.abs(i - 2.5) * .01); part(head, B, sg('skTooth'), -.05 + i * .02, .055, .165 - Math.abs(i - 2.5) * .01); }
  const armL = pivot(upper, -.27, .6, 0), armR = pivot(upper, .27, .6, 0);
  for (const A of [armL, armR]) {
    part(A, B, sg('skShoulder', () => sph(.045)));
    part(A, B, sg('skHumerus', () => capsule(.024, .22)), 0, -.16, 0);
    part(A, B, sg('skElbow', () => sph(.036)), 0, -.31, 0);
    part(A, B, sg('skRadius', () => capsule(.02, .2)), 0, -.44, 0);
    part(A, B, sg('skPalm', () => blob(.035, .045, .022, 10)), 0, -.57, .02);
    for (let i = 0; i < 4; i++) part(A, B, sg('skFinger', () => capsule(.008, .07, 5)), -.024 + i * .016, -.63, .045, .7, 0, 0);
  }
  const hand = pivot(armR, 0, -.6, .03), handL = pivot(armL, 0, -.6, .03);
  let wm = null, shield = null, light = null;
  const vest = mat => {
    part(upper, mat, sg('skVestBack', () => rbox(.36, .44, .05, .02)), 0, .37, -.14);
    for (const sx of [-1, 1]) { part(upper, mat, sg('skVestSide', () => rbox(.05, .42, .22, .02)), sx * .17, .36, -.03); part(upper, mat, sg('skVestFront', () => rbox(.11, .42, .035, .015)), sx * .14, .36, .09, 0, sx * -.5, 0); }
  };
  const mustache = (mat, y, z, k = 1) => { for (const sx of [-1, 1]) part(head, mat, sg('skMust' + sx + k, () => taperTube([[0, 0, 0], [sx * .08 * k, .01, .0], [sx * .16 * k, -.02, -.03], [sx * .2 * k, .05, -.06], [sx * .16 * k, .09, -.06], [sx * .13 * k, .06, -.04]], t => .022 * k * (1 - t * .75), 26, 8)), 0, y, z); };
  if (arch) {
    part(upper, MAT.cHood, sg('skCape', () => { const g = new THREE.PlaneGeometry(.5, .78, 10, 6), P = g.attributes.position.array; for (let i = 0; i < P.length; i += 3) P[i + 2] = Math.sin(P[i] * 26) * .025 - (.39 - P[i + 1]) * .1; g.computeVertexNormals(); return g; }), 0, .26, -.17);
    part(upper, MAT.cHood, sg('skMantle', () => lathe([[.22, .52], [.2, .6], [.13, .67], [.06, .69]], 18)));
    const q = part(upper, MAT.leather, sg('skQuiver', () => new THREE.CylinderGeometry(.06, .05, .55, 12)), .12, .38, -.22); q.rotation.z = -.4;
    for (let i = 0; i < 3; i++) part(upper, MAT.cRibbon, sg('skFletch', () => rbox(.026, .1, .01, .004)), .23 + i * .02, .7 - i * .012, -.22 + (i - 1) * .025, 0, 0, -.4);
    part(head, MAT.cHood, sg('skHood', () => new THREE.SphereGeometry(.25, 22, 14, Math.PI / 2 + .85, TAU - 1.7, 0, Math.PI * .7)), 0, .2, -.02);
    part(head, MAT.cHood, sg('skHoodTip', () => taperTube([[0, .38, -.12], [0, .42, -.32], [0, .3, -.5], [.02, .08, -.56]], t => .1 * (1 - t * .85), 28, 10)));
  } else if (chef) {
    // giacca da cuoco doppiopetto, grembiule, fazzoletto rosso, cappello altissimo e un paio di baffi finti legati con lo spago
    part(upper, MAT.cChef, sg('skChefJacket', () => lathe([[.2, .02], [.21, .2], [.2, .42], [.22, .56], [.15, .66], [.06, .7]], 22)));
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) part(upper, MAT.cWhite, sg('skChefBtn', () => sph(.016, 8, 6)), sx * .08, .28 + i * .11, .2 - i * .004);
    part(upper, MAT.cChef, sg('skApron', () => { const g = new THREE.PlaneGeometry(.38, .62, 6, 6), P = g.attributes.position.array; for (let i = 0; i < P.length; i += 3) P[i + 2] = Math.sin(P[i] * 18) * .015 + Math.pow(Math.abs(P[i]), 2) * -.6; g.computeVertexNormals(); return g; }), 0, -.1, .2);
    part(upper, MAT.cRibbon, sg('skNecker', () => new THREE.TorusGeometry(.1, .03, 8, 18).rotateX(Math.PI / 2 - .4)), 0, .66, .02);
    part(upper, MAT.cRibbon, sg('skNeckKnot', () => new THREE.ConeGeometry(.05, .1, 10).rotateX(Math.PI)), .02, .58, .11, -.3, 0, 0);
    const hat = pivot(head, 0, .36, -.02); hat.rotation.z = .12;
    part(hat, MAT.cChef, sg('skToqueBand', () => new THREE.CylinderGeometry(.17, .16, .12, 20)), 0, .04, 0);
    part(hat, MAT.cChef, sg('skToque', () => lathe([[.16, .1], [.22, .22], [.26, .42], [.27, .6], [.24, .7], [.15, .76], [0, .78]], 22)), 0, 0, 0);
    for (let i = 0; i < 6; i++) part(hat, MAT.cChef, sg('skPuff', () => blob(.1, .09, .1, 12)), Math.cos(i) * .17, .7 + (i % 2) * .04, Math.sin(i) * .17);
    mustache(MAT.cFelt, .1, .19, .9); part(head, MAT.cWhisker, sg('skString', () => new THREE.TorusGeometry(.17, .004, 4, 24).rotateX(Math.PI / 2)), 0, .1, .02);
    wm = cleaverModel(); hand.add(wm);
  } else if (soot) {
    // fuochista: berretto di cuoio con gli occhialoni d'ottone, bretelle, sciarpa rossa, tutto coperto di fuliggine
    part(head, MAT.leatherBlack, sg('skCap', () => new THREE.SphereGeometry(.205, 20, 10, 0, TAU, 0, Math.PI * .5)), 0, .24, -.02, -.1, 0, 0);
    part(head, MAT.leatherBlack, sg('skCapVisor', () => new THREE.CylinderGeometry(.16, .16, .012, 18, 1, false, -Math.PI / 2, Math.PI)), 0, .25, .13, .2, 0, 0);
    for (const sx of [-1, 1]) { part(head, MAT.brassAged, sg('skGoggle', () => tubeZ(.055, .055, .05, 16)), sx * .075, .33, .14, -.5, 0, 0); part(head, MAT.cLens, sg('skGoggleLens', () => new THREE.CircleGeometry(.045, 16)), sx * .075, .345, .165, -.5, 0, 0); }
    part(head, MAT.leatherBlack, sg('skGoggleStrap', () => new THREE.TorusGeometry(.2, .012, 4, 28).rotateX(Math.PI / 2 - .3)), 0, .3, -.01);
    for (const sx of [-1, 1]) part(upper, MAT.leatherTan, sg('skBrace', () => taperTube([[0, 0, .13], [0, .3, .15], [0, .6, .05], [0, .55, -.1], [0, .1, -.12]], () => .016, 20, 4)), sx * .1, 0, 0);
    part(upper, MAT.cRibbon, sg('skScarf', () => new THREE.TorusGeometry(.11, .04, 8, 18).rotateX(Math.PI / 2 - .3)), 0, .65, .01);
    part(upper, MAT.cRibbon, sg('skScarfTail', () => taperTube([[.05, .62, .1], [.12, .5, .14], [.16, .36, .12]], t => .035 * (1 - t * .5), 10, 6)));
    part(upper, MAT.leatherBlack, sg('skBelt', () => new THREE.TorusGeometry(.13, .025, 6, 20).rotateX(Math.PI / 2)), 0, .06, 0);
    wm = shovelModel(); hand.add(wm);
  } else if (guard) {
    // armatura a piastre arrotondate, elmo a campana con la feritoia, pennacchio, scudo con lo stemma del treno
    part(upper, MAT.cSteel, sg('skCuirass', () => lathe([[.18, .05], [.22, .2], [.24, .4], [.22, .58], [.14, .66], [.06, .68]], 22)));
    part(upper, MAT.brassAged, sg('skCuirassBand', () => new THREE.TorusGeometry(.2, .015, 6, 26).rotateX(Math.PI / 2)), 0, .1, 0);
    for (const sx of [-1, 1]) part(upper, MAT.cSteel, sg('skPauldron', () => new THREE.SphereGeometry(.14, 16, 10, 0, TAU, 0, Math.PI * .5)), sx * .27, .6, 0, 0, 0, sx * -.4);
    part(upper, MAT.cSteel, sg('skFauld', () => lathe([[.2, -.16], [.19, .0], [.17, .06]], 22)), 0, 0, 0);
    part(head, MAT.cSteel, sg('skHelm', () => lathe([[.0, .44], [.12, .43], [.2, .36], [.23, .2], [.23, .02], [.24, -.02], [.2, -.03]], 24)), 0, 0, -.01);
    part(head, MAT.cSocket, sg('skHelmSlit', () => rbox(.3, .03, .06, .012)), 0, .21, .22);
    for (const sx of [-1, 1]) part(head, MAT.ember, sg('skSlitEye', () => sph(.016)), sx * .07, .212, .235);
    part(head, MAT.cPlume, sg('skGPlume', () => taperTube([[0, .43, 0], [0, .62, -.06], [0, .7, -.24], [0, .6, -.42]], t => .055 * (1 - t * .6) + Math.sin(t * Math.PI) * .025, 26, 10)));
    shield = pivot(upper, -.1, .3, .32);
    part(shield, MAT.oak, sg('skShield', () => { const g = rbox(.62, .92, .06, .05, 2), P = g.attributes.position.array; for (let i = 0; i < P.length; i += 3) P[i + 2] += -Math.pow(P[i] / .31, 2) * .05; g.computeVertexNormals(); return grainUV(g); }));
    part(shield, MAT.brassAged, sg('skShieldRim', () => { const g = rbox(.66, .96, .04, .05, 2), P = g.attributes.position.array; for (let i = 0; i < P.length; i += 3) P[i + 2] += -Math.pow(P[i] / .33, 2) * .05 - .006; g.computeVertexNormals(); return g; }));
    part(shield, MAT.cRibbon, sg('skShieldBand', () => rbox(.08, .86, .02, .008)), 0, 0, .035);
    part(shield, MAT.cSteel, sg('skBoss', () => new THREE.SphereGeometry(.1, 16, 10, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2)), 0, .05, .035);
  } else if (boss) {
    // il Capotreno: redingote blu fino ai piedi, doppio petto d'ottone, spalline con le frange, berretto altissimo, baffi enormi, monocolo
    part(upper, MAT.cCoat, sg('skCoat', () => lathe([[.3, -.78], [.27, -.4], [.22, 0], [.24, .3], [.26, .52], [.2, .64], [.08, .7], [0, .71]], 26)));
    part(upper, MAT.brassAged, sg('skCoatBelt', () => new THREE.TorusGeometry(.225, .02, 6, 26).rotateX(Math.PI / 2)), 0, .02, 0);
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) part(upper, MAT.brassAged, sg('skCoatBtn', () => sph(.022, 10, 8)), sx * .09, .16 + i * .12, .235);
    for (const sx of [-1, 1]) { part(upper, MAT.brassAged, sg('skEpaul', () => blob(.1, .035, .09, 14)), sx * .26, .64, 0, 0, 0, sx * -.25); for (let i = 0; i < 5; i++) part(upper, MAT.brassAged, sg('skFringe', () => new THREE.CylinderGeometry(.008, .008, .1, 4)), sx * (.29 + (i % 2) * .02), .57, -.06 + i * .03); }
    for (const A of [armL, armR]) part(A, MAT.cCoat, sg('skCoatSleeve', () => taperTube([[0, .02, 0], [0, -.25, .02], [0, -.5, 0]], t => .075 - t * .02, 10, 10)));
    const cap = pivot(head, 0, .36, -.02); cap.rotation.x = -.06;
    part(cap, MAT.cCoat, sg('skBossCap', () => lathe([[0, 0], [.19, 0], [.195, .04], [.23, .4], [.25, .44], [.22, .46], [0, .46]], 24)));
    part(cap, MAT.cRibbon, sg('skBossBand', () => lathe([[.196, .04], [.203, .1], [.196, .1]], 24)));
    part(cap, MAT.black, sg('skBossVisor', () => new THREE.CylinderGeometry(.21, .21, .014, 20, 1, false, -Math.PI / 2, Math.PI)), 0, .02, .06, .25, 0, 0);
    part(cap, MAT.brassAged, sg('skBossBadge', () => rbox(.09, .07, .015, .006)), 0, .18, .21, -.1, 0, 0);
    mustache(MAT.cBeard, .1, .17, 1.25);
    part(head, MAT.brassAged, sg('skBossMono', () => new THREE.TorusGeometry(.066, .009, 8, 22)), .075, .2, .185);
    part(head, MAT.brassAged, sg('skBossChain', () => taperTube([[.14, .2, .18], [.18, .05, .15], [.16, -.15, .12], [.12, -.28, .16]], () => .004, 16, 4)));
    const lan = weaponModel('lanterna', 2); lan.rotation.set(-1.3, 0, 0); lan.scale.setScalar(1.2); handL.add(lan);
    glowSprite(lan, 0, 0, .5, 1.6, 0xffa040, .55);
    light = new THREE.PointLight(lin(0xffa050), 1.5, 8, 2); light.position.set(0, -.2, .2); handL.add(light);
    wm = new THREE.Group(); part(wm, MAT.brassAged, sg('gPunchA', () => rbox(.04, .03, .32, .01)), .02, 0, .1, 0, .12, 0); part(wm, MAT.brassAged, sg('gPunchB', () => rbox(.04, .03, .32, .01)), -.02, -.03, .1, 0, -.12, 0); part(wm, MAT.steel, sg('gPunchJaw', () => rbox(.09, .07, .07, .015)), 0, -.01, .28); hand.add(wm);
  } else {
    // il passeggero: panciotto aperto sulle costole, bottoni, catena dell'orologio, farfallino, bombetta storta con il biglietto nel nastro
    vest(MAT.cVest);
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 3; i++) part(upper, MAT.brassAged, sg('skBtn', () => sph(.014, 8, 6)), sx * .1, .26 + i * .08, .125);
      part(upper, MAT.cRibbon, sg('skBow', () => new THREE.ConeGeometry(.035, .07, 10).rotateZ(Math.PI / 2)), sx * .035, .66, .06, 0, 0, sx > 0 ? Math.PI : 0);
    }
    part(upper, MAT.brassAged, sg('skChain', () => taperTube([[-.1, .3, .13], [0, .22, .15], [.1, .3, .13]], () => .005, 12, 4)));
    part(upper, MAT.cRibbon, sg('skBowKnot', () => sph(.018)), 0, .66, .065);
    const hat = pivot(head, .02, .37, -.02); hat.rotation.set(-.12, 0, -.22);
    part(hat, MAT.cFelt, sg('skBowler', () => lathe([[0, .17], [.09, .165], [.135, .12], [.14, .05], [.14, .02], [.2, .015], [.225, .035], [.225, .022], [.14, 0], [0, 0]], 24)));
    part(hat, MAT.cRibbon, sg('skHatBand', () => lathe([[.142, .02], [.143, .055], [.141, .055]], 24)));
    part(hat, MAT.ticket, sg('skTicket', () => rbox(.08, .05, .004, .002)), .1, .07, .08, 0, -.9, .2);
  }
  if (!wm) { wm = weaponModel(wtype); (wtype === 'arco' || wtype === 'balestra' ? handL : hand).add(wm); }
  s.userData = {
    body, upper, legL, legR, armL, armR, head, hand, weapon: wm, wtype: chef || soot || boss ? 'x' : wtype, shield, light, phase: Math.random() * 6, jaw,
    tick(t) { jaw.rotation.x = .08 + Math.max(0, Math.sin(t * 11 + ph)) * Math.max(0, Math.sin(t * 1.3 + ph)) * .35; head.rotation.y = Math.sin(t * .9 + ph) * .2; }
  };
  if (boss) s.scale.setScalar(1.45);
  addBlob(s, .8); return castAll(bake(s, 'sk:' + variant + ':' + wtype));
}

/* ---------- Bigliettaio Spettrale: coda di nebbia, testa che fluttua sopra il colletto, berretto altissimo, baffi a ricciolo, biglietti che gli girano attorno ---------- */
function ghostModel() {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0);
  const tailGeo = lathe([[0, -.3], [.04, -.26], [.09, -.12], [.16, .08], [.23, .32], [.28, .55], [.3, .7], [.2, .78], [0, .8]], 24);
  const tail = part(body, MAT.ghost, tailGeo, 0, 0, 0, 0, 0, 0, false); tail.userData.keep = true; const base = Float32Array.from(tailGeo.attributes.position.array);
  part(body, MAT.ghostCloth, sg('gCoat', () => lathe([[.37, .42], [.34, .58], [.29, .74], [.3, .95], [.33, 1.14], [.3, 1.28], [.18, 1.38], [.06, 1.41], [0, 1.41]], 26)));
  part(body, MAT.brassAged, sg('gBelt', () => new THREE.TorusGeometry(.295, .022, 6, 28).rotateX(Math.PI / 2)), 0, .76, 0);
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) part(body, MAT.brassAged, sg('gBtn', () => sph(.024, 10, 8)), sx * .09, .86 + i * .12, .292 + (i === 2 ? .01 : 0));
  for (const sx of [-1, 1]) {
    part(body, MAT.brassAged, sg('gEpaul', () => blob(.1, .035, .09, 14)), sx * .27, 1.33, 0, 0, 0, sx * -.25);
    for (let i = 0; i < 5; i++) part(body, MAT.brassAged, sg('gFringe', () => new THREE.CylinderGeometry(.008, .008, .09, 4)), sx * (.3 + (i % 2) * .02), 1.27, -.06 + i * .03);
  }
  part(body, MAT.navy, sg('gCollar', () => lathe([[.13, 1.36], [.14, 1.44], [.12, 1.46]], 20)));
  const head = pivot(body, 0, 1.6, 0);
  part(head, MAT.ghost, sg('gFace', () => blob(.16, .23, .16, 22)), 0, .1, 0, 0, 0, 0, false);
  for (const sx of [-1, 1]) { part(head, MAT.eyeTeal, sg('gEye', () => sph(.058, 16, 12)), sx * .072, .17, .125); part(head, MAT.black, sg('gPupil', () => sph(.018)), sx * .066, .17, .18); }
  part(head, MAT.ghost, sg('gNose', () => new THREE.ConeGeometry(.028, .24, 12).rotateX(Math.PI / 2 + .55)), 0, .06, .2, 0, 0, 0, false);
  for (const sx of [-1, 1]) part(head, MAT.cBeard, sg('gMust' + sx, () => taperTube([[0, -.02, .16], [sx * .09, -.01, .17], [sx * .18, -.04, .14], [sx * .23, .03, .1], [sx * .19, .08, .1], [sx * .15, .04, .12]], t => .026 * (1 - t * .75), 28, 8)));
  const cap = pivot(head, 0, .27, -.01); cap.rotation.x = -.08;
  part(cap, MAT.navy, sg('gCap', () => lathe([[0, 0], [.17, 0], [.175, .04], [.21, .38], [.23, .42], [.2, .44], [0, .44]], 24)));
  part(cap, MAT.cRibbon, sg('gCapBand', () => lathe([[.176, .04], [.183, .1], [.176, .1]], 24)));
  part(cap, MAT.black, sg('gVisor', () => new THREE.CylinderGeometry(.2, .2, .014, 20, 1, false, -Math.PI / 2, Math.PI)), 0, .02, .06, .25, 0, 0);
  part(cap, MAT.brassAged, sg('gBadge', () => rbox(.08, .06, .015, .006)), 0, .17, .19, -.1, 0, 0);
  const armL = pivot(body, -.32, 1.3, 0), armR = pivot(body, .32, 1.3, 0);
  for (const A of [armL, armR]) {
    part(A, MAT.ghostCloth, sg('gSleeve', () => taperTube([[0, 0, 0], [.0, -.3, .03], [0, -.58, 0]], t => .085 - t * .03, 12, 10)));
    part(A, MAT.brassAged, sg('gCuff', () => new THREE.TorusGeometry(.055, .014, 6, 16).rotateX(Math.PI / 2)), 0, -.58, 0);
    part(A, MAT.cGlove, sg('gGlove', () => blob(.06, .075, .055, 12)), 0, -.66, .02);
  }
  // obliteratrice d'ottone nella destra, lanterna nella sinistra
  const punch = pivot(armR, 0, -.7, .06);
  part(punch, MAT.brassAged, sg('gPunchA', () => rbox(.04, .03, .32, .01)), .02, 0, .1, 0, .12, 0);
  part(punch, MAT.brassAged, sg('gPunchB', () => rbox(.04, .03, .32, .01)), -.02, -.03, .1, 0, -.12, 0);
  part(punch, MAT.steel, sg('gPunchJaw', () => rbox(.09, .07, .07, .015)), 0, -.01, .28);
  const lantern = pivot(armL, 0, -.78, .06);
  part(lantern, MAT.brassAged, sg('gLantTop', () => lathe([[0, .1], [.06, .08], [.07, .06], [0, .06]], 12)));
  part(lantern, MAT.brassAged, sg('gLantBot', () => lathe([[0, -.1], [.07, -.1], [.06, -.08], [0, -.08]], 12)));
  for (let i = 0; i < 4; i++) part(lantern, MAT.brassAged, sg('gLantBar', () => new THREE.CylinderGeometry(.006, .006, .16, 4)), Math.cos(i * TAU / 4) * .055, 0, Math.sin(i * TAU / 4) * .055);
  part(lantern, MAT.eyeTeal, sg('gLantFlame', () => blob(.035, .05, .035, 10)), 0, -.01, 0);
  part(lantern, MAT.brassAged, sg('gLantRing', () => new THREE.TorusGeometry(.03, .006, 4, 10)), 0, .14, 0);
  // biglietti in orbita
  const orbit = pivot(body, 0, .95, 0), tickets = [];
  for (let i = 0; i < 6; i++) { const t = part(orbit, MAT.ticket, sg('gTix', () => rbox(.13, .065, .004, .002)), Math.cos(i * TAU / 6) * .62, Math.sin(i * 2.1) * .2, Math.sin(i * TAU / 6) * .62); t.rotation.set(.3, -i * TAU / 6, .2); t.userData.keep = true; tickets.push(t); }
  const light = new THREE.PointLight(lin(0x52e0d0), 2.2, 8, 2); light.position.set(0, 1.2, .3); g.add(light);
  g.userData = {
    body, head, armL, armR, light,
    tick(t, dt) {
      const P = tailGeo.attributes.position.array;
      for (let i = 0; i < P.length; i += 3) { const y = base[i + 1], k = Math.pow(Math.max(0, (.75 - y) / 1.05), 1.6); P[i] = base[i] + Math.sin(t * 2.6 + y * 5) * .12 * k; P[i + 2] = base[i + 2] - k * .22 + Math.cos(t * 2.1 + y * 4) * .06 * k; }
      tailGeo.attributes.position.needsUpdate = true;
      orbit.rotation.y += dt * 1.1; for (let i = 0; i < tickets.length; i++) tickets[i].rotation.z = Math.sin(t * 4 + i) * .5;
      head.position.y = 1.6 + Math.sin(t * 1.9) * .035; head.rotation.z = Math.sin(t * 1.3) * .08;
      lantern.rotation.z = Math.sin(t * 2.4) * .2;
    }
  };
  g.scale.setScalar(1.15); return castAll(bake(g, 'ghost'));
}

/* ---------- Bullone: caldaia d'ottone su zampette da insetto, un occhio solo, la chiave per la carica sulla schiena ---------- */
function robotModel() {
  const r = new THREE.Group(), body = pivot(r, 0, 0, 0);
  part(body, MAT.brassAged, sg('rbBoiler', () => lathe([[0, .3], [.2, .3], [.27, .37], [.3, .48], [.29, .62], [.23, .72], [.12, .77], [0, .78]], 26)));
  part(body, MAT.cEnamel, sg('rbBand', () => lathe([[.302, .455], [.312, .5], [.31, .56], [.3, .6]], 26)));
  for (const y of [.445, .61]) for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = y < .5 ? .3 : .296; part(body, MAT.brassAged, sg('rbRivet', () => sph(.011, 6, 5)), Math.sin(a) * rr, y, Math.cos(a) * rr); }
  // l'occhio: oblò con la lente accesa e una palpebra di latta
  const eye = pivot(body, 0, .55, .27);
  part(eye, MAT.brassAged, sg('rbEyeRing', () => new THREE.TorusGeometry(.105, .024, 10, 28)), 0, 0, .02);
  part(eye, MAT.cLens, sg('rbLens', () => blob(.09, .09, .05, 20)), 0, 0, .02);
  part(eye, MAT.black, sg('rbPupil', () => new THREE.CircleGeometry(.03, 16)), 0, 0, .072);
  const lid = pivot(eye, 0, 0, .02);
  part(lid, MAT.brassAged, sg('rbLid', () => new THREE.SphereGeometry(.112, 20, 8, 0, TAU, 0, Math.PI * .42)), 0, 0, 0, Math.PI / 2 - .5, 0, 0);
  // comignolo, antenna con la lampadina, chiave di carica
  part(body, MAT.iron, sg('rbChim', () => lathe([[.04, 0], [.04, .14], [.065, .18], [.06, .2], [.035, .19], [.0, .19]], 14)), -.1, .74, -.06);
  part(body, MAT.ember, sg('rbChimGlow', () => new THREE.CircleGeometry(.034, 12).rotateX(-Math.PI / 2)), -.1, .93, -.06);
  part(body, MAT.steelDark, sg('rbAnt', () => taperTube([[0, 0, 0], [.02, .12, -.02], [.0, .24, .02], [.03, .3, .0]], () => .007, 12, 4)), .12, .74, -.02);
  part(body, MAT.ember, sg('rbBulb', () => sph(.035)), .15, 1.04, -.02);
  const key = pivot(body, 0, .53, -.31);
  part(key, MAT.brassAged, sg('rbKeyRod', () => tubeZ(.018, .018, .1, 8)), 0, 0, -.05);
  for (const sx of [-1, 1]) part(key, MAT.brassAged, sg('rbKeyWing', () => blob(.07, .05, .012, 14)), sx * .07, 0, -.1);
  const legs = [[-.19, .15], [.19, .15], [-.19, -.15], [.19, -.15]].map(([x, z]) => {
    const p = pivot(body, x, .34, z), sx = Math.sign(x);
    part(p, MAT.brassAged, sg('rbHip', () => sph(.04)));
    part(p, MAT.iron, sg('rbThigh' + sx, () => taperTube([[0, 0, 0], [sx * .1, .02, 0], [sx * .15, -.1, 0]], () => .016, 8, 6)));
    part(p, MAT.brassAged, sg('rbKnee', () => sph(.026)), sx * .15, -.1, 0);
    part(p, MAT.iron, sg('rbShin' + sx, () => taperTube([[sx * .15, -.1, 0], [sx * .14, -.22, 0], [sx * .12, -.31, 0]], t => .014 - t * .006, 8, 6)));
    part(p, MAT.brassAged, sg('rbFoot', () => lathe([[0, 0], [.04, 0], [.03, .02], [0, .025]], 10)), sx * .12, -.335, 0);
    return p;
  });
  const light = new THREE.PointLight(lin(0xffc47a), 1.5, 6, 2); light.position.set(0, 1.0, .4); r.add(light);
  r.userData = {
    body, legs, light, phase: 0,
    tick(t, dt, spd) { key.rotation.z += dt * (1.5 + spd); const bl = t % 4.2 < .14 ? 1 : 0; lid.rotation.x = bl ? .9 : Math.sin(t * .7) * .1; eye.rotation.y = Math.sin(t * .8) * .2; }
  };
  addBlob(r, .7); return castAll(bake(r, 'robot'));
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
  return portrait('cls_' + id + '_' + outfit, () => { const m = playerModel(id, outfit); setModelWeapon(m, starterWeapon(CLASSES.find(c => c.id === id))); posePlayer(m, { spd: 0, ground: true, atk: -1 }, 0); return m; }, 192, 5.4, 1.22);
}
