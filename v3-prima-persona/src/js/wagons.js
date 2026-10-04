/* ================= i dieci vagoni ================= */
// waves: [tipo, livello] per ondata; subs: sottotitolo del cartello di ogni ondata; shop: a vagone libero arriva la bottega
const WAGONS = [
  { name: 'Carrozza passeggeri', sign: 'PASSEGGERI', wx: 'TETTO APERTO', build: () => buildPassenger(),
    waves: [[['ratto', 1], ['ratto', 1], ['ratto', 1]], [['scheletro', 1], ['ratto', 1], ['scheletro', 1], ['arciere', 1]], [['scheletro', 1], ['bigliettaio', 1]]],
    subs: ['SCENDONO DAL TETTO SQUARCIATO', 'SCENDONO DAL TETTO SQUARCIATO', 'IL BIGLIETTAIO STA ARRIVANDO'],
    intro: ['Biglietto, prego.', '...Ah, non ce l\'hai. Peccato. I passeggeri di questa carrozza non sono molto ospitali.', 'Un consiglio: quando l\'anello ai piedi di un nemico lampeggia, sta per colpire. Spostati, oppure para al momento giusto.'],
    outro: ['Hai ripulito il primo vagone. Notevole.', 'Ne mancano nove fino alla locomotiva. Il prossimo è la carrozza ristorante: non toccare il pane, è del 1897.'] },
  { name: 'Carrozza ristorante', sign: 'RISTORANTE', wx: 'LAMPADARI ACCESI', build: () => buildDining(2),
    waves: [[['scheletro', 1], ['cuoco', 1], ['ratto', 1], ['scheletro', 1]], [['cuoco', 1], ['scheletro', 1], ['ratto', 1], ['cuoco', 1], ['ratto', 1]], [['cuoco', 2], ['scheletro', 2], ['arciere', 1], ['cuoco', 1], ['scheletro', 1]]],
    subs: ['ESCONO DALLE CUCINE', 'IL SERVIZIO CONTINUA', 'ARRIVA IL DESSERT'],
    intro: ['Benvenuto nella carrozza ristorante. Il menù di stasera: tu.', 'Lo chef è un po\' nervoso. Non lamentarti del servizio.'],
    outro: ['Conto pagato. Niente mancia, vedo.', 'Avanti il bagagliaio. Attento ai bauli: alcuni mordono.'] },
  { name: 'Bagagliaio', sign: 'BAGAGLIAIO', wx: 'LANTERNE A DONDOLO', shop: true, build: () => buildBaggage(3),
    waves: [[['ratto', 2], ['mimic', 2], ['ratto', 2], ['arciere', 2]], [['mimic', 2], ['scheletro', 2], ['ratto', 2], ['arciere', 2]], [['mimic', 2], ['arciere', 2], ['scheletro', 2], ['mimic', 2], ['cuoco', 2]]],
    subs: ['SBUCANO DAI BAGAGLI', 'QUALCOSA SI MUOVE TRA LE CASSE', 'I BAULI HANNO FAME'],
    intro: ['Il bagagliaio. Qui finisce tutto quello che i passeggeri dimenticano.', 'Anche i passeggeri, a volte.'],
    outro: ['Ordine ristabilito. Il mio robot di fiducia ha aperto bottega, se hai monete da spendere.', 'Poi c\'è il vagone letto. Cammina piano: i passeggeri dormono. Più o meno.'] },
  { name: 'Vagone letto', sign: 'VAGONE LETTO', wx: 'LUCI DA NOTTE', build: () => buildSleeper(4),
    waves: [[['fantasma', 2], ['scheletro', 2], ['fantasma', 2]], [['fantasma', 2], ['arciere', 2], ['fantasma', 2], ['scheletro', 2]], [['fantasma', 2], ['fantasma', 3], ['arciere', 2], ['scheletro', 2], ['fantasma', 2], ['cuoco', 2]]],
    subs: ['I DORMIENTI SI SVEGLIANO', 'BUSSANO DALLE CUCCETTE', 'NESSUNO DORME PIÙ'],
    intro: ['Shh. Vagone letto. I passeggeri riposano da centotrent\'anni.', 'Se qualcuno ti passa attraverso, non è maleducazione: è un fantasma.'],
    outro: ['Silenzio, finalmente.', 'Più avanti c\'è la serra. Qualcosa ha fatto il nido tra le orchidee. Qualcosa con molte zampe.'] },
  { name: 'Serra panoramica', sign: 'SERRA', wx: 'TETTO DI VETRO', build: () => buildGreenhouse(5),
    waves: [[['ragno', 2], ['arciere', 2], ['ragno', 2]], [['ragno', 2], ['cuoco', 2], ['ragno', 2], ['scheletro', 2]], [['regina', 3], ['ragno', 2]]],
    subs: ['CALANO DAL SOFFITTO', 'IL NIDO SI AGITA', 'LA REGINA DELLE SERRE'],
    intro: ['La serra panoramica. Un tempo ci si prendeva il tè tra le palme.', 'Ora si prende quello che cade dal soffitto.'],
    outro: ['La regina è caduta. Le orchidee ringraziano.', 'Il prossimo è il vagone del carbone, a cielo aperto. Prendi un ombrello.'] },
  { name: 'Vagone del carbone', sign: 'CARBONE', wx: 'A CIELO APERTO', shop: true, build: () => buildCoal(6),
    waves: [[['fuochista', 3], ['scheletro', 3], ['ratto', 3]], [['fuochista', 3], ['ragno', 3], ['scheletro', 3], ['arciere', 3]], [['fuochista', 3], ['fuochista', 3], ['scheletro', 3], ['ragno', 3], ['ratto', 3]]],
    subs: ['SALTANO GIÙ DAL TENDER', 'BRACI NELL\'ARIA', 'TUTTI I FUOCHISTI IN PIEDI'],
    intro: ['Il vagone del carbone. Il cuore nero del treno.', 'I fuochisti non hanno mai smesso di spalare. Non smettono nemmeno per te.'],
    outro: ['Ben fatto. Sei coperto di fuliggine, ma vivo.', 'Il robot ha riaperto bottega. Poi il vagone blindato: c\'è il tesoro della compagnia, e le guardie lo sanno.'] },
  { name: 'Vagone blindato', sign: 'BLINDATO', wx: 'SOTTO CHIAVE', build: () => buildVault(7),
    waves: [[['guardia', 3], ['arciere', 3], ['ratto', 3]], [['guardia', 3], ['mimic', 3], ['arciere', 3], ['cuoco', 3]], [['guardia', 3], ['guardia', 3], ['arciere', 3], ['fuochista', 3], ['mimic', 3]]],
    subs: ['ALLARME!', 'RINFORZI DALLA CASSAFORTE', 'L\'ULTIMA RONDA'],
    intro: ['Il vagone blindato. Oro, banconote, gioielli. E guardie che non vanno mai in pensione.', 'Tocca qualcosa e scatta l\'allarme. Ah, è già scattato.'],
    outro: ['Il tesoro è salvo. Più o meno.', 'Avanti l\'officina. Gli automi che ci lavorano hanno la molla un po\' tirata.'] },
  { name: 'Officina a vapore', sign: 'OFFICINA', wx: 'VAPORE E INGRANAGGI', build: () => buildWorkshop(8),
    waves: [[['automa', 3], ['ratto', 3], ['fuochista', 3]], [['automa', 3], ['guardia', 3], ['ragno', 3], ['arciere', 3]], [['automa', 4], ['guardia', 4], ['fuochista', 4], ['automa', 4]]],
    subs: ['SI CARICANO GLI AUTOMI', 'CATENA DI MONTAGGIO', 'PRESSIONE AL MASSIMO'],
    intro: ['L\'officina. Qui si riparano i pezzi del treno.', 'Gli automi a molla ti considerano un pezzo da riparare.'],
    outro: ['Ingranaggi fermi. Ottimo lavoro, meccanico.', 'Il prossimo è il salone di prima classe. Dopo, la locomotiva.'] },
  { name: 'Salone di prima classe', sign: 'SALONE', wx: 'PRIMA CLASSE', shop: true, build: () => buildLounge(9),
    waves: [[['fantasma', 4], ['scheletro', 4], ['guardia', 4], ['arciere', 4]], [['automa', 4], ['ragno', 4], ['fuochista', 4], ['fantasma', 4], ['mimic', 4]], [['bigliettaio', 5], ['fantasma', 4], ['arciere', 4], ['scheletro', 4]]],
    subs: ['LA PRIMA CLASSE SI ALZA', 'NIENTE BIGLIETTO, NIENTE PIANOFORTE', 'IL BIGLIETTAIO È TORNATO'],
    intro: ['Il salone di prima classe. Il mio preferito.', 'Mettiti comodo. Il mio bigliettaio ha chiesto di salutarti di persona. Di nuovo.'],
    outro: ['Anche il salone è tuo. Il robot ti aspetta con la bottega, per l\'ultima volta.', 'La porta davanti a te dà sulla locomotiva. Ti sto aspettando. Porta il biglietto.'] },
  { name: 'Locomotiva', sign: 'LOCOMOTIVA', wx: 'FUOCO E VAPORE', build: () => buildLoco(10),
    waves: [[['scheletro', 4], ['ratto', 4], ['fuochista', 4], ['guardia', 4]], [['capotreno', 4]]],
    subs: ['LA SCORTA DEL CAPOTRENO', 'IL CAPOTRENO'],
    intro: ['Eccoti. Finalmente ci vediamo in faccia.', 'Questo treno non si ferma, passeggero. Non si è mai fermato. Ho perso la chiave del freno tanti anni fa.', 'Vediamo se ce l\'hai tu.'],
    outro: ['...Il freno. È lì, accanto alla caldaia.', 'Tiralo, passeggero. Fallo fermare.'] }
];
const BOSS_WAGONS = [1, 5, 9, 10];
// ritmo dei nemici vagone per vagone: nei primi sono più lenti, attaccano meno spesso, caricano i colpi più a lungo,
// tirano proiettili più lenti e in mischia attaccano uno alla volta; la differenza si riduce fino alla locomotiva
const EASE = [1, .88, .76, .66, .58, .5, .43, .37, .31, .25];
function paceFor(n) {
  const k = EASE[n - 1] === undefined ? 0 : EASE[n - 1];
  return { k, spd: 1 - .2 * k, cd: 1 + .7 * k, tele: 1 + .5 * k, proj: 1 - .25 * k, slots: k > .6 ? 1 : 2 };
}
let PACE = paceFor(1);
function wagonInfo(L, n) {
  const W = WAGONS[n - 1]; L.n = n; L.name = W.name; L.tag = 'VAGONE / ' + String(n).padStart(2, '0'); L.wx = W.wx;
  L.obj = n < WAGONS.length ? 'Sopravvivi alle ondate e apri la porta del Vagone ' + (n + 1) : 'Sconfiggi il capotreno e ferma il treno';
}
function buildWagon(n) { return WAGONS[n - 1].build(); }

/* ---------- pezzi comuni ---------- */
function glassFor(L) { const m = MAT.glass.clone(); m.map = TEX.glass.clone(); m.map.needsUpdate = true; L.glass.push(m.map); return m; }
const cylGeo = (r, h, n = 10, rTop) => new THREE.CylinderGeometry(rTop === undefined ? r : rTop, r, h, n);
function bCylY(b, mat, x, y, z, r, h, n = 10, rTop) { b.geo(mat, cylGeo(r, h, n, rTop).translate(x, y + h / 2, z)); }
function bCylX(b, mat, x, y, z, r, len, n = 10) { b.geo(mat, cylGeo(r, len, n).rotateZ(Math.PI / 2).translate(x, y, z)); }
function bCylZ(b, mat, x, y, z, r, len, n = 10) { b.geo(mat, cylGeo(r, len, n).rotateX(Math.PI / 2).translate(x, y, z)); }
function bBoxR(b, mat, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0) { b.geo(mat, new THREE.BoxGeometry(w, h, d).rotateX(rx).rotateZ(rz).rotateY(ry).translate(x, y, z)); }
// porta d'uscita a due ante con lampada rossa (verde a vagone libero) e cartello del vagone dopo
function exitDoor(L, n) {
  const len = L.len, G = L.group, door = new THREE.Group(); door.position.set(len, 0, 0); G.add(door);
  const leafA = doorLeaf(door, -.55), leafB = doorLeaf(door, .55);
  const lamp = bx(G, MAT.neonRed, .06, .12, .6, len - .08, 3.5, 0, false);
  const lampL = addLight(L, len - .6, 3.4, 0, 0xff4a3a, 1.4, 5);
  L.exit = { x: len - .9, z: 0, leaves: [leafA, leafB], open: 0, target: 0, lamp, lampL };
  plane(L, new THREE.MeshStandardMaterial({ map: signTexture('VAGONE ' + (n + 1), WAGONS[n].sign), roughness: .5, emissive: lin(0x3a2a10), emissiveIntensity: .6 }), 1.6, .6, len - .08, 3.85, 0, 0, -Math.PI / 2, false);
  pool(L, len - 1.2, 0, 2.4, 0xff4a3a, .16);
  L.inter.push({ id: 'exit', x: len - .9, z: 0, r: 1.8, label: 'Vagone ' + (n + 1), desc: WAGONS[n].name });
}
// guscio: pavimento, telaio e ruote, pareti con finestrini, testate con porte, tetto
function wagonShell(n, o) {
  const len = o.len, hw = 6, WH = 4.2, L = newLevel('wagon', 0, len, -hw, hw), G = L.group, b = new Builder();
  wagonInfo(L, n);
  Object.assign(L, { moonK: o.moonK || .7, hemiK: o.hemiK || .42, fog: o.fog, dust: o.dust, spawnMode: o.spawn || 'rise', dropY: o.dropY || 7.5, roofOpen: o.roof === 'open', rainZ: 0, stormK: o.roof === 'closed' ? .55 : 1, headY: o.roof === 'open' ? 6 : o.roof === 'glass' ? 3.6 : 2.45 });
  for (const t of o.floorTex || []) t.repeat.set(o.floorRep[0], o.floorRep[1]);
  plane(L, o.floor, len, hw * 2, len / 2, 0, 0, -Math.PI / 2);
  if (o.carpet) { o.carpet.map.repeat.set(len / 4, 1); plane(L, o.carpet, len - 3, 2.2, len / 2, .012, 0, -Math.PI / 2); }
  buildShell(L, hw);
  const glass = glassFor(L), wallH = o.wallH || WH, ww = o.winW || 2.6, y0 = o.winY0 || 1.4, y1 = o.winY1 || 3.2;
  for (const sd of [-1, 1]) {
    const zc = sd * (hw + .25), wins = (sd < 0 ? o.winsFar : o.winsNear) || o.wins || [];
    let px = 0;
    for (const cx of wins) {
      const a = cx - ww / 2, c = cx + ww / 2, tz = sd * hw;
      b.box(o.wall, (px + a) / 2, 0, zc, a - px, wallH, .5).box(o.wall, cx, 0, zc, ww, y0, .5).box(o.wall, cx, y1, zc, ww, wallH - y1, .5);
      b.box(o.trim, cx, y0 - .05, tz, ww + .2, .1, .14).box(o.trim, cx, y1 - .05, tz, ww + .2, .1, .14).box(o.trim, a - .05, y0, tz, .1, y1 - y0, .14).box(o.trim, c + .05, y0, tz, .1, y1 - y0, .14);
      if (o.bars) for (let x = a + .15; x < c - .05; x += .22) b.box(MAT.steelDark, x, y0, sd * (hw + .02), .04, y1 - y0, .04);
      if (o.mullion) b.box(o.trim, cx, y0, tz, .06, y1 - y0, .08).box(o.trim, cx, (y0 + y1) / 2, tz, ww, .05, .08);
      plane(L, glass, ww, y1 - y0, cx, (y0 + y1) / 2, sd * (hw + .08), 0, sd > 0 ? Math.PI : 0, false);
      px = c;
    }
    b.box(o.wall, (px + len) / 2, 0, zc, len - px, wallH, .5);
    if (o.wains) b.box(o.wains, len / 2, 0, sd * (hw - .04), len, o.wainsH || 1.2, .08);
    if (o.rail !== false) b.box(o.trim, len / 2, o.wainsH || 1.2, sd * (hw - .06), len, .06, .1);
    if (o.roof === 'closed') b.box(o.cornice || o.trim, len / 2, WH - .22, sd * (hw - .06), len, .22, .14);
    if (o.roof === 'open') b.box(o.trim, len / 2, wallH, sd * (hw + .25), len + .4, .1, .62);
  }
  const hwM = o.headWall || o.wall;
  for (const ex of o.noExit ? [0] : [0, len]) {
    const s = ex === 0 ? -1 : 1;
    b.box(hwM, ex + s * .25, 0, -3.55, .5, WH, 4.9).box(hwM, ex + s * .25, 0, 3.55, .5, WH, 4.9).box(hwM, ex + s * .25, 3.2, 0, .5, WH - 3.2, 2.2);
    b.box(o.trim, ex - s * .02, 0, -1.15, .1, 3.25, .1).box(o.trim, ex - s * .02, 0, 1.15, .1, 3.25, .1).box(o.trim, ex - s * .02, 3.2, 0, .1, .1, 2.4);
  }
  { const back = new THREE.Group(); back.position.set(.06, 0, 0); G.add(back); doorLeaf(back, -.55); doorLeaf(back, .55); }
  if (o.roof === 'closed') {
    const ceil = o.ceil || o.wall, rib = o.rib || o.trim;
    for (const sd of [-1, 1]) { b.box(ceil, len / 2, WH, sd * 4.15, len + .2, .2, 4.3); b.box(rib, len / 2, WH, sd * 2.06, len, .8, .12); }
    b.box(ceil, len / 2, WH + .78, 0, len + .2, .2, 4.3);
    for (let x = 2.2; x < len - 1; x += 3.2) for (const sd of [-1, 1]) b.box(MAT.clere, x, WH + .22, sd * 1.99, 1.6, .42, .03);
    for (let x = o.ribStep || 4; x < len - .5; x += o.ribStep || 4) { for (const sd of [-1, 1]) b.box(rib, x, WH - .16, sd * 4.1, .16, .16, 4.0); b.box(rib, x, WH + .6, 0, .14, .14, 4.1); }
  } else if (o.roof === 'glass') {
    const rise = 2.0, run_ = hw + .3, slope = Math.atan2(rise, run_), sl = Math.hypot(rise, run_);
    for (const sd of [-1, 1]) {
      const pg = plane(L, MAT.glassRoof, len, sl, len / 2, WH + rise / 2, sd * run_ / 2, sd * slope - Math.PI / 2, 0, false); pg.renderOrder = 2;
      for (let x = 0; x <= len + .01; x += 2.4) bBoxR(b, o.trim, x, WH + rise / 2, sd * run_ / 2, .1, .12, sl, -sd * slope);
      for (const f of [.33, .66]) b.box(o.trim, len / 2, WH + rise * f - .05, sd * run_ * (1 - f), len, .08, .08);
      b.box(o.trim, len / 2, WH - .1, sd * (hw - .05), len, .14, .2);
    }
    b.box(o.trim, len / 2, WH + rise - .08, 0, len + .2, .16, .2);
  }
  return { L, b, G, len, hw, WH };
}
// confini, esterno, punti di comparsa dei nemici, porte
function wagonFinish(S, o = {}) {
  const { L, b, G, len, hw } = S;
  addObs(L, -1, 0, -7, 7, 9); addObs(L, len, len + 1, -7, 7, 9); addObs(L, -1, len + 1, -7.5, -hw, 9); addObs(L, -1, len + 1, hw, 7.5, 9);
  if (!o.noExit) exitDoor(L, L.n);
  addLight(L, 1.2, 3.0, 0, o.entryCol || 0xffb060, 1.1, 6);
  b.build(G);
  buildOutside(L);
  neighborCar(L, -31.9, -.95); if (!o.noExit) neighborCar(L, len + .95, len + 32);
  for (let x = 6; x < len - 4; x += 2.4) for (const z of [-3.6, -1.2, 1.2, 3.6]) if (!insideAny(L, x, z, .7)) L.spawnPts.push([x, z]);
  addSpare(L); addSpare(L);
  L.start = { x: 3.0, z: .6 }; L.startYaw = Math.PI / 2;
  return L;
}
// applique a parete (braccio d'ottone e tulipano di vetro); light: aggiunge una luce vera, altrimenti solo una pozza finta
function sconce(L, b, x, sd, col, light, k = 2.4) {
  const z = sd * 6;
  wallLamp(b, x, 2.78, z - sd * .005, sd < 0 ? 0 : Math.PI);
  if (light) addLight(L, x, 2.9, z - sd * .8, col, k, 11, .1);
  pool(L, x, z - sd * 1.6, light ? 3.6 : 2.4, col, light ? .2 : .12);
}
// lampadario a otto bracci: rosone, catena, fusto dorato, candele accese e gocce di cristallo
function chandelier(L, b, x, z, light, col = 0xffc070) {
  const y = 3.25, k = new Kit(b, x, 0, z);
  k.lathe(MAT.gilt, [[0, 0], [.2, 0], [.18, -.04], [.06, -.08], [0, -.08]], 0, 4.98, 0, 20);
  for (let i = 0; i < Math.floor((4.9 - y - .35) / .07); i++) k.put(MAT.gilt, new THREE.TorusGeometry(.022, .006, 4, 8), 0, 4.88 - i * .07, 0, 0, i % 2 ? Math.PI / 2 : 0, 0);
  k.lathe(MAT.gilt, [[0, -.58], [.04, -.54], [.09, -.42], [.06, -.33], [.13, -.22], [.09, -.12], [.05, .08], [.08, .22], [.04, .32], [0, .34]], 0, y, 0, 18);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU, c = Math.cos(a), s = Math.sin(a), ex = c * .55, ez = s * .55;
    k.put(MAT.gilt, taperTube([[c * .07, -.2, s * .07], [c * .28, -.36, s * .28], [c * .48, -.34, s * .48], [ex, -.24, ez]], () => .014, 14, 5), 0, y, 0);
    k.lathe(MAT.gilt, [[0, 0], [.045, .005], [.05, .02], [.02, .025], [0, .025]], ex, y - .245, ez, 10);
    k.cyl(MAT.wax, .018, .018, .12, ex, y - .22, ez, 8);
    k.put(MAT.lamp, blob(.016, .035, .016, 8), ex, y - .06, ez);
    k.put(MAT.glassClear, new THREE.OctahedronGeometry(.028).scale(1, 1.8, 1), c * .38, y - .45, s * .38);
  }
  k.put(MAT.glassClear, new THREE.OctahedronGeometry(.06).scale(1, 1.8, 1), 0, y - .7, 0);
  glowSprite(L.group, x, y - .1, z, 2.2, col, .32);
  if (light) addLight(L, x, y - .4, z, col, 3.2, 14, .06);
  pool(L, x, z, 4.2, col, light ? .2 : .12);
}
// lampada industriale: asta, paralume smaltato, lampadina
function pendant(L, b, x, z, light, col = 0xffb060, mat = MAT.lamp, top = 4.98) {
  const y = 3.2, k = new Kit(b, x, 0, z);
  k.cyl(MAT.steelDark, .014, .014, top - y - .3, 0, y + .3, 0, 6);
  k.lathe(MAT.steelDark, [[0, .02], [.05, .02], [.05, -.04], [0, -.04]], 0, y + .36, 0, 10);
  k.lathe(MAT.shadeMetal, [[.045, .3], [.07, .27], [.18, .17], [.29, .06], [.31, .03]], 0, y, 0, 22);
  k.put(mat, new THREE.SphereGeometry(.07, 12, 10), 0, y + .14, 0);
  if (light) addLight(L, x, y - .1, z, col, 2.6, 11, .08);
  pool(L, x, z, light ? 3.4 : 2.4, col, light ? .2 : .12);
}
const seedOf = (x, y, z) => mulberry(Math.round(x * 97 + y * 13 + z * 31) + 7);
function crate(b, x, y, z, s, mat = MAT.wood) { crateBox(b, x, y, z, s, s, s, 0, seedOf(x, y, z), s > .9); }
function trunkProp(b, x, y, z, rot = 0) { suitcase(b, x, y, z, 1.0, .7, .66, rot, seedOf(x, y, z), 'trunk'); }
// botte a doghe con i cerchi di ferro
function barrel(b, x, y, z, r = .38, h = 1.0) {
  const k = new Kit(b, x, y, z), rr = f => r * (.86 + .14 * Math.sin(f * Math.PI));
  k.lathe(MAT.oak, [[0, 0], [rr(0), 0], [rr(.15), h * .15], [rr(.5), h * .5], [rr(.85), h * .85], [rr(1), h], [r * .8, h - .01], [0, h - .015]], 0, 0, 0, 18);
  for (const f of [.1, .3, .7, .9]) k.lathe(MAT.iron, [[rr(f) - .002, h * f - .025], [rr(f) + .01, h * f - .02], [rr(f) + .01, h * f + .02], [rr(f) - .002, h * f + .025]], 0, 0, 0, 18);
  k.cyl(MAT.oak, .03, .03, .02, r * .3, h - .01, 0, 8);
}
// palma in vaso di terracotta: tronco a segmenti e foglie piegate
function palm(L, b, x, z, s, R, y0 = 0) {
  new Kit(b, x, y0, z).lathe(MAT.terracotta, [[0, 0], [.28 * s, 0], [.34 * s, .08 * s], [.4 * s, .48 * s], [.45 * s, .52 * s], [.45 * s, .58 * s], [.38 * s, .58 * s], [.36 * s, .54 * s], [0, .54 * s]], 0, 0, 0, 18);
  bCylY(b, MAT.soil, x, y0 + .54 * s, z, .36 * s, .02, 14);
  let y = y0 + .55 * s, tx = x, tz = z;
  for (let i = 0; i < 5; i++) { const h = .45 * s; bCylY(b, MAT.woodDark, tx, y, tz, (.1 - i * .012) * s, h, 6, (.085 - i * .012) * s); y += h; tx += (R() - .5) * .06; tz += (R() - .5) * .06; }
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU + R() * .4; let sx = tx, sy = y, sz = tz;
    for (let j = 0; j < 3; j++) {
      const l = (.55 + R() * .2) * s, w = (.3 - j * .06) * s, ph = .25 + j * .5 + R() * .2;
      const g = new THREE.PlaneGeometry(l, w).rotateX(-Math.PI / 2).translate(l / 2, 0, 0).rotateZ(-ph).rotateY(-a).translate(sx, sy, sz);
      b.geo(j % 2 ? MAT.leafDark : MAT.leafGreen, g);
      const v = new THREE.Vector3(l, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -ph).applyAxisAngle(new THREE.Vector3(0, 1, 0), -a); sx += v.x; sy += v.y; sz += v.z;
    }
  }
}
function fern(b, x, y, z, s, R) {
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * TAU + R() * .5, l = (.5 + R() * .3) * s, ph = -.5 - R() * .5;
    b.geo(k % 2 ? MAT.leafDark : MAT.leafGreen, new THREE.PlaneGeometry(l, .16 * s).rotateX(-Math.PI / 2).translate(l / 2, 0, 0).rotateZ(ph).rotateY(-a).translate(x, y, z));
  }
}
// sedia da ristorante: gambe tornite, cuscino di velluto, schienale con la traversa curva
function chair(b, x, z, ry, mat = MAT.velvet) {
  const k = new Kit(b, x, 0, z, ry + Math.PI);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.lathe(MAT.varnishDark, [[.025, 0], [.03, .05], [.02, .2], [.03, .3], [.025, .42], [0, .42]], sx * .2, 0, sz * .2, 8);
  k.box(MAT.varnishDark, .5, .05, .5, 0, .4, 0, .015);
  k.box(mat === MAT.velvet ? MAT.tuftRed : mat, .48, .08, .48, 0, .45, .01, .035);
  for (const sx of [-1, 1]) k.box(MAT.varnishDark, .045, .7, .045, sx * .2, .42, .22, .012, .08, 0, 0);
  k.box(MAT.varnish, .5, .08, .06, 0, 1.05, .3, .025, .08, 0, 0);
  k.box(mat === MAT.velvet ? MAT.tuftRed : mat, .38, .36, .05, 0, .6, .24, .025, .08, 0, 0);
}

/* ---------- 2: carrozza ristorante ---------- */
function buildDining(n) {
  const S = wagonShell(n, { len: 56, wall: MAT.paperRed, wains: MAT.woodDark, trim: MAT.gilt, cornice: MAT.woodDark, roof: 'closed', ceil: MAT.ceilCream, rib: MAT.gilt, ribStep: 3.5,
    floor: MAT.floorChecker, floorTex: [TEX.checker.map, TEX.checker.bump, TEX.checker.rough], floorRep: [28, 6], carpet: MAT.carpetRed, wins: [5.5, 12.5, 19.5, 26.5, 33.5, 40.5, 47.5], winW: 2.4,
    moonK: .55, hemiK: .45, fog: [0x140c0a, .018], dust: 0xffd0a0 });
  const { L, b, G, len } = S, R = mulberry(202);
  for (const x of [14, 28, 42]) chandelier(L, b, x, 0, true);
  for (const x of [9, 16, 23, 30, 37, 44]) for (const sd of [-1, 1]) sconce(L, b, x, sd, 0xffb060, false);
  // tavoli apparecchiati (si possono ribaltare) con due sedie ciascuno
  const spots = [[8, -3.6], [15, -3.6], [22, -3.6], [29, -3.6], [36, -3.6], [43, -3.6], [11.5, 3.6], [18.5, 3.6], [25.5, 3.6], [32.5, 3.6], [39.5, 3.6]];
  for (const [x, z] of spots) {
    const m = tableModel('cloth'); m.traverse(o => { if (o.userData.cs) { o.userData.cs = false; o.castShadow = true; } }); m.position.set(x, 0, z); G.add(m);
    const ob = addObs(L, x - .72, x + .72, z - .72, z + .72, .9, 'table', true);
    L.tables.push({ x, z, model: m, ob, state: 'up', hp: 3, cover: null, t: 0 });
    for (const s of [-1, 1]) { chair(b, x + s * 1.15, z, s > 0 ? -Math.PI / 2 : Math.PI / 2); addObs(L, x + s * 1.15 - .28, x + s * 1.15 + .28, z - .28, z + .28, .55, 'seat', true); }
  }
  // bancone del bar in fondo con bottiglie, specchio e sgabelli
  const bx0 = len - 10, bx1 = len - 3.6;
  b.box(MAT.woodDark, (bx0 + bx1) / 2, 0, -4.7, bx1 - bx0, 1.05, .9).box(MAT.marble, (bx0 + bx1) / 2, 1.05, -4.7, bx1 - bx0 + .2, .07, 1.05).box(MAT.brass, (bx0 + bx1) / 2, .2, -4.2, bx1 - bx0, .05, .05);
  for (let x = bx0 + .3; x < bx1; x += .7) b.box(MAT.wood, x, .1, -4.24, .5, .8, .02);
  for (const y of [1.6, 2.2, 2.8]) { b.box(MAT.woodDark, (bx0 + bx1) / 2, y, -5.8, bx1 - bx0, .05, .35); for (let x = bx0 + .2; x < bx1 - .1; x += .22 + R() * .1) bottle(b, x, y + .05, -5.78, .26 + R() * .1, R() < .5 ? MAT.bottleG : MAT.bottleA); }
  plane(L, MAT.clere, bx1 - bx0 - .4, .5, (bx0 + bx1) / 2, 3.35, -5.94, 0, 0, false);
  for (let x = bx0 + .6; x < bx1; x += 1.4) { stool(b, x, -3.7); addObs(L, x - .25, x + .25, -3.95, -3.45, .85, 'seat', true); }
  addObs(L, bx0, bx1, -5.9, -4.2, 1.12, 'crate', true);
  addLight(L, (bx0 + bx1) / 2, 2.6, -4.4, 0xffa850, 1.6, 7, .12);
  // leggio del maître all'ingresso e piante
  b.box(MAT.woodDark, 3.2, 0, -4.6, .6, 1.1, .5).box(MAT.brass, 3.2, 1.1, -4.6, .7, .05, .55); addObs(L, 2.9, 3.5, -4.85, -4.35, 1.15);
  for (const [x, z] of [[2.2, 4.8], [len - 2.2, 4.8]]) { palm(L, b, x, z, .9, R); addObs(L, x - .4, x + .4, z - .4, z + .4, 1.2); }
  return wagonFinish(S);
}

/* ---------- 3: bagagliaio ---------- */
function buildBaggage(n) {
  const S = wagonShell(n, { len: 60, wall: MAT.plateGreen, trim: MAT.steelDark, roof: 'closed', ceil: MAT.plateDark, rib: MAT.steelDark, ribStep: 3,
    floor: MAT.floorPlank, floorTex: [TEX.woodDark], floorRep: [10, 3], wins: [10, 25, 40, 55], winW: 1.6, winY0: 2.5, winY1: 3.4, bars: true, rail: false,
    moonK: .6, hemiK: .38, fog: [0x0e0c0a, .024], dust: 0xffe0b0 });
  const { L, b, G, len } = S, R = mulberry(303);
  // lanterne appese che dondolano
  L.fx.swing = [];
  for (const [i, x] of [6, 17, 28, 39, 50].entries()) {
    const pv = new THREE.Group(); pv.position.set(x, 4.9, i % 2 ? .8 : -.8); G.add(pv);
    hangingLantern(pv);
    glowSprite(pv, 0, -1.8, 0, 1.6, 0xffb060, .4);
    if (i % 2 === 0) { const l = new THREE.PointLight(lin(0xffb060), 2.6, 12, 2); l.position.set(0, -1.9, 0); pv.add(l); L.lights.push({ l, base: 2.6, flick: .12, ph: R() * 10 }); }
    L.fx.swing.push({ pv, ph: R() * 6, amp: .12 + R() * .06 });
    pool(L, x, pv.position.z, 3.4, 0xffa850, i % 2 === 0 ? .18 : .1);
  }
  // pile di casse, bauli, valigie e sacchi lungo le pareti; isole al centro come riparo
  const stack = (x, z, parts) => {
    let y = 0, w0 = 0, d0 = 0;
    parts.forEach((pt, i) => {
      if (pt === 't') { trunkProp(b, x, y, z, R() < .5 ? 0 : Math.PI); if (!i) { w0 = 1.04; d0 = .7; } y += .7; }
      else if (pt === 'b') { barrel(b, x, y, z); if (!i) { w0 = .8; d0 = .8; } y += 1.0; }
      else { crate(b, x + (i ? (R() - .5) * .2 : 0), y, z, pt); if (!i) { w0 = pt; d0 = pt; } y += pt; }
    });
    addObs(L, x - w0 / 2, x + w0 / 2, z - d0 / 2, z + d0 / 2, y, 'crate', true);
  };
  for (const [x, z, parts] of [[3.5, -5.2, [1.2, .8]], [7, -5.2, ['t', 't']], [9, -5.1, [1.4]], [13.5, -5.2, ['b']], [15, -5.1, [1.3, 1.0, .7]], [20, -5.2, ['t']], [23, -5.1, [1.2, 1.2]], [28.5, -5.2, ['b']], [31, -5.1, [1.4, .9]], [36, -5.2, ['t', 't']], [41, -5.1, [1.2]], [44.5, -5.2, ['b']], [47, -5.1, [1.3, 1.0]], [52, -5.2, ['t']], [56, -5.1, [1.2, .8, .6]],
    [5, 5.1, [1.3]], [8.5, 5.2, ['b']], [12, 5.1, [1.2, .9]], [17, 5.2, ['t']], [21, 5.1, [1.4, 1.0]], [26, 5.2, ['t', 't']], [32, 5.1, [1.2]], [34.5, 5.2, ['b']], [38, 5.1, [1.3, .8]], [43, 5.2, ['t']], [48, 5.1, [1.2, 1.2, .7]], [53, 5.2, ['b']], [57, 5.1, [1.3]],
    [18, 1.2, [1.2, .8]], [30, -1.4, [1.4]], [30, -.2, ['t']], [42, 1.0, [1.2, 1.0]], [50, -1.3, ['b']]]) stack(x, z, parts);
  // valigie sparse e sacchi della posta
  for (let i = 0; i < 22; i++) { const x = 4 + R() * (len - 8), z = (R() < .5 ? -1 : 1) * (3.6 + R() * .8); if (insideAny(L, x, z, .3)) continue; const w = .5 + R() * .4; suitcase(b, x, 0, z, w, .25 + R() * .15, .35 + R() * .2, R() * 3, R); }
  for (let i = 0; i < 8; i++) { const x = 6 + R() * (len - 12), z = (R() < .5 ? -1 : 1) * (4.2 + R() * .5); if (insideAny(L, x, z, .3)) continue; sack(b, x, z, R); }
  // rete del carico appesa alla parete vicina
  for (let x = 14; x <= 18; x += .4) b.box(MAT.cream, x, 1.6, 5.9, .03, 1.8, .03);
  for (let y = 1.6; y <= 3.4; y += .4) b.box(MAT.cream, 16, y, 5.9, 4, .03, .03);
  // i bauli mimetici si nascondono accanto alle pile, lontano dal corridoio
  L.mimicPts = [[11, -4.3], [19, 4.3], [27, -4.3], [34, 4.3], [40, -4.3], [46, 4.3], [54, -4.3]];
  return wagonFinish(S, { entryCol: 0xffb060 });
}

/* ---------- 4: vagone letto ---------- */
function buildSleeper(n) {
  const S = wagonShell(n, { len: 64, wall: MAT.wallNavy, wains: MAT.woodDark, trim: MAT.brass, cornice: MAT.woodDark, roof: 'closed', ceil: MAT.wallNavy, rib: MAT.woodDark, ribStep: 4,
    floor: MAT.woodFloor, floorTex: [TEX.wood], floorRep: [16, 3], carpet: MAT.carpetBlue, winsNear: [6, 14, 22, 30, 38, 46, 54], winsFar: [],
    moonK: .75, hemiK: .3, fog: [0x080a14, .026], dust: 0xb8c0ff });
  const { L, b, G, len } = S, R = mulberry(404);
  // scompartimenti con cuccette a castello lungo la parete di fondo; i tramezzi non fermano i fantasmi
  for (let x = 4; x <= 60; x += 8) { b.box(MAT.woodDark, x, 0, -4.2, .2, 4.2, 3.6).box(MAT.brass, x, 0, -2.42, .26, 4.2, .06); addObs(L, x - .1, x + .1, -6, -2.4, 4.2, 'part'); }
  for (let cx = 8; cx < 60; cx += 8) {
    for (const ox of [-2, 2]) {
      const x = cx + ox;
      for (const y of [.55, 2.05]) sleeperBunk(b, x, y, R);
      b.box(MAT.woodDark, x - 1.72, 0, -3.5, .1, 2.9, .1).box(MAT.woodDark, x + 1.72, 0, -3.5, .1, 2.9, .1);
      for (let y = .9; y < 2.5; y += .4) b.box(MAT.brass, x + 1.72, y, -3.44, .06, .04, .3);
      bx(G, MAT.purpleLamp, .12, .08, .08, x, 3.2, -5.85, false);
      addObs(L, x - 1.7, x + 1.7, -5.7, -3.5, .8, 'crate', true);
    }
    // tende: due drappi ai lati dello scompartimento, il centro resta aperto
    b.box(MAT.brass, cx, 3.55, -2.5, 7.6, .05, .05);
    for (const s of [-1, 1]) curtain(new Kit(b), cx + s * 2.95, .3, -2.5, 1.1, 3.22, .35, s > 0 ? MAT.velvetCurtain : MAT.velvetNavy);
    pool(L, cx, -4, 3.2, 0x9a6aff, .12);
  }
  for (const x of [12, 36]) addLight(L, x, 3.0, -4.2, 0x9a7aff, 1.6, 9, .25);
  for (const x of [8, 24, 40, 56]) pendant(L, b, x, 1.6, true, 0x9ab4ff, MAT.coldLamp);
  for (const x of [16, 32, 48]) pendant(L, b, x, 1.6, false, 0x9ab4ff, MAT.coldLamp);
  // corridoio: panchette ribaltabili sotto i finestrini e carrello del tè abbandonato
  for (const x of [10, 26, 42, 58]) { b.box(MAT.woodDark, x, .45, 5.6, .9, .06, .5).box(MAT.velvetDark, x, .5, 5.6, .86, .06, .46); }
  b.box(MAT.brass, 33, 0, 4.4, .9, .9, .5).box(MAT.wood, 33, .9, 4.4, 1.0, .05, .6).box(MAT.white, 32.8, .95, 4.3, .2, .14, .2).box(MAT.cream, 33.2, .95, 4.5, .1, .1, .1);
  addObs(L, 32.5, 33.5, 4.1, 4.7, 1.0, 'crate', true);
  // valigie dimenticate nel corridoio
  for (let i = 0; i < 9; i++) { const x = 5 + R() * (len - 10), z = 4.6 + R() * .8; if (insideAny(L, x, z, .2)) continue; suitcase(b, x, 0, z, .6, .3, .4, R() * 3, R); }
  return wagonFinish(S, { entryCol: 0x9ab4ff });
}

/* ---------- 5: serra panoramica ---------- */
function buildGreenhouse(n) {
  const wins = []; for (let x = 2.2; x < 58; x += 3) wins.push(x);
  const S = wagonShell(n, { len: 60, wall: MAT.ironFrame, trim: MAT.ironFrame, roof: 'glass', wins, winW: 2.6, winY0: 1.2, winY1: 4.05, mullion: true, wains: MAT.woodDark, rail: false,
    floor: MAT.stoneFloor, floorTex: [TEX.stone.map, TEX.stone.rough, TEX.stone.bump], floorRep: [15, 3],
    moonK: 1.1, hemiK: .5, fog: [0x08120e, .02], dust: 0xb8ff9a, spawn: 'roof', dropY: 5.8 });
  const { L, b, G, len } = S, R = mulberry(505);
  L.fireflies = true;
  // aiuole rialzate ai lati, interrotte da passaggi
  const beds = [[3, 14], [18, 29], [33, 44], [48, 57]];
  for (const sd of [-1, 1]) for (const [xa, xb] of beds) {
    const z0 = sd * 2.6, z1 = sd * 5.7, zc = (z0 + z1) / 2, dz = Math.abs(z1 - z0);
    b.box(MAT.woodDark, (xa + xb) / 2, 0, zc, xb - xa, .5, dz).box(MAT.woodDark, (xa + xb) / 2, .5, z0, xb - xa + .1, .06, .12);
    plane(L, MAT.soil, xb - xa - .2, dz - .2, (xa + xb) / 2, .52, zc, -Math.PI / 2);
    addObs(L, xa, xb, Math.min(z0, z1), Math.max(z0, z1), .52, 'crate', true);
    for (let x = xa + 1; x < xb - .5; x += 1.4 + R()) fern(b, x, .55, zc + (R() - .5) * 1.4, .9 + R() * .6, R);
  }
  for (const [x, sd] of [[8, -1], [23, 1], [38, -1], [52, 1], [12, 1], [42, 1], [27, -1]]) palm(L, b, x, sd * 4.2, 1.2 + R() * .3, R, .5);
  // fiori luminosi: le luci della serra
  const blooms = [[6, -3.4, 0x2ae0c8, 1], [20, 3.4, 0xff4aa0, 1], [31, -3.4, 0x2ae0c8, 0], [36, 3.4, 0xff4aa0, 1], [46, -3.4, 0x2ae0c8, 1], [55, 3.4, 0xff4aa0, 0]];
  for (const [x, z, col, light] of blooms) {
    const mat = col === 0x2ae0c8 ? MAT.bloomTeal : MAT.bloomPink;
    for (let i = 0; i < 5; i++) { const fx = x + (R() - .5) * 1.4, fz = z + (R() - .5) * .8, h = .5 + R() * .6; b.box(MAT.leafGreen, fx, .5, fz, .03, h, .03); b.box(mat, fx, .5 + h, fz, .14, .1, .14); }
    glowSprite(G, x, 1.4, z, 2.6, col, .3); pool(L, x, z, 3.2, col, .16);
    if (light) addLight(L, x, 1.6, z, col, 1.6, 8, .15);
  }
  // rampicanti che pendono dalle travi del tetto
  for (let x = 4.8; x < len - 2; x += 4.8) for (const sd of [-1, 1]) {
    const z = sd * (2 + R() * 2), top = 4.2 + 2 * (1 - Math.abs(z) / 6.3), l = 1 + R() * 1.6;
    for (let y = top; y > top - l; y -= .22) b.geo(R() < .5 ? MAT.leafGreen : MAT.leafDark, new THREE.PlaneGeometry(.22, .16).rotateY(R() * 3).translate(x + (R() - .5) * .1, y, z));
  }
  // vialetto con panchine in ferro e fontanella
  for (const [x, sd] of [[16, -1], [31, 1], [46, -1]]) { b.box(MAT.ironFrame, x, 0, sd * 2.25, 1.6, .45, .1).box(MAT.wood, x, .45, sd * 2.1, 1.6, .06, .4); addObs(L, x - .8, x + .8, sd * 2.1 - .22, sd * 2.1 + .22, .5, 'seat', true); }
  fountain(b, 31, 0);
  plane(L, MAT.glass, 1.4, 1.4, 31, .44, 0, -Math.PI / 2); addObs(L, 30.1, 31.9, -.9, .9, .5, 'crate', true);
  return wagonFinish(S, { entryCol: 0x9affc8 });
}

/* ---------- 6: vagone del carbone (a cielo aperto) ---------- */
function buildCoal(n) {
  const S = wagonShell(n, { len: 56, wall: MAT.plateDark, trim: MAT.steelDark, roof: 'open', wallH: 2.2, rail: false, headWall: MAT.plateDark,
    floor: MAT.floorSoot, floorTex: [TEX.diamond.map, TEX.diamond.bump], floorRep: [56, 12],
    moonK: 1.0, hemiK: .45, fog: [0x0c0a0a, .02], dust: 0xff9a50, spawn: 'roof', dropY: 8 });
  const { L, b, G, len } = S, R = mulberry(606);
  L.fx.embers = true;
  // costole esterne delle sponde
  for (let x = 2; x < len; x += 3) for (const sd of [-1, 1]) b.box(MAT.steelDark, x, 0, sd * 6.6, .2, 2.3, .2);
  // mucchi di carbone
  const heap = (x, z, r, h) => { coalHeap(b, x, z, r, h, R); addObs(L, x - r * .55, x + r * .55, z - r * .55, z + r * .55, h * .6, 'crate', true); };
  for (const [x, z, r, h] of [[5, -4.6, 1.6, 1.4], [10, 4.5, 1.8, 1.6], [15.5, -4.4, 2.0, 1.8], [22, 4.4, 1.6, 1.2], [27, -4.6, 1.8, 1.5], [33, 4.6, 2.0, 1.8], [38.5, -4.4, 1.6, 1.3], [44, 4.4, 1.8, 1.6], [49, -4.6, 1.9, 1.7], [53.5, 4.5, 1.4, 1.1], [19, -.6, 1.3, 1.0], [36, .8, 1.4, 1.1]]) heap(x, z, r, h);
  coalChunks(b, 3, len - 3, 10, 70, R);
  // bracieri accesi: luce che tremola e braci che salgono
  L.fx.braziers = [];
  for (const [x, z] of [[8, 0], [24.5, -1.5], [41, 1.5], [52, -.5]]) {
    brazier(b, x, z);
    for (let i = 0; i < 5; i++) { const m = bx(G, MAT.furnace, .14 + R() * .1, .14 + R() * .2, .14 + R() * .1, x + (R() - .5) * .4, .98, z + (R() - .5) * .4, false); m.rotation.set(R(), R(), R()); }
    glowSprite(G, x, 1.25, z, 2.4, 0xff8a30, .55);
    addLight(L, x, 1.7, z, 0xff8a40, 2.6, 10, .35); pool(L, x, z, 4, 0xff7a30, .22);
    addObs(L, x - .46, x + .46, z - .46, z + .46, .95);
    L.fx.braziers.push([x, z]);
  }
  // gru a portale con la benna
  for (const gx of [16, 40]) {
    for (const sd of [-1, 1]) b.box(MAT.steelDark, gx, 0, sd * 5.7, .3, 5.2, .3);
    b.box(MAT.steelDark, gx, 5.0, 0, .4, .35, 12).box(MAT.steel, gx, 4.7, 1.2, .6, .3, .6);
    b.box(MAT.steelDark, gx, 3.0, 1.2, .03, 1.7, .03).box(MAT.plateDark, gx, 2.4, 1.2, 1.0, .6, .8);
    for (const sd of [-1, 1]) addObs(L, gx - .15, gx + .15, sd * 5.7 - .15, sd * 5.7 + .15, 5.2);
  }
  // pale e carriola
  for (const [x, z, r] of [[12, -2.8, .4], [30, 2.6, -.6], [47, -2.4, 1.1]]) { bBoxR(b, MAT.woodDark, x, .05, z, 1.2, .05, .05, 0, r); bBoxR(b, MAT.steelDark, x + Math.cos(r) * .7, .04, z - Math.sin(r) * .7, .3, .03, .26, 0, r); }
  b.box(MAT.plateRust, 29, .3, -2.2, 1.0, .4, .7).box(MAT.coal, 29, .65, -2.2, .9, .12, .6); bCylX(b, MAT.black, 29.6, .2, -2.2, .2, .1, 10); addObs(L, 28.5, 29.6, -2.6, -1.8, .8, 'crate', true);
  return wagonFinish(S, { entryCol: 0xff9a50 });
}

/* ---------- 7: vagone blindato ---------- */
function buildVault(n) {
  const S = wagonShell(n, { len: 52, wall: MAT.plate, trim: MAT.steelDark, roof: 'closed', ceil: MAT.plateDark, rib: MAT.steelDark, ribStep: 2.6, headWall: MAT.plate,
    floor: MAT.floorDiamond, floorTex: [TEX.diamond.map, TEX.diamond.bump], floorRep: [52, 12], wins: [8, 20, 32, 44], winW: 1.2, winY0: 2.3, winY1: 3.1, bars: true, rail: false,
    moonK: .5, hemiK: .4, fog: [0x0a0c0e, .02], dust: 0xd8e4ff });
  const { L, b, G, len } = S, R = mulberry(707);
  for (const x of [7, 19, 33, 45]) { b.box(MAT.steelDark, x, 4.6, 0, .5, .16, .5); bx(G, MAT.coldLamp, .3, .14, .3, x, 4.5, 0, false); for (const s of [-1, 1]) b.box(MAT.steelDark, x + s * .17, 4.32, 0, .03, .28, .34); addLight(L, x, 4.1, 0, 0xcfe0ff, 2.4, 12, .05); pool(L, x, 0, 3.8, 0xcfe0ff, .16); }
  // sirene d'allarme che girano
  L.fx.beacons = [];
  for (const [x, sd] of [[13, -1], [39, 1]]) {
    const pv = new THREE.Group(); pv.position.set(x, 3.6, sd * 5.7); G.add(pv);
    bx(pv, MAT.steelDark, .3, .1, .3, 0, -.1, 0); const cone = bx(pv, MAT.alarm, .08, .2, .26, .1, .05, 0, false); bx(pv, MAT.alarm, .12, .16, .12, 0, .05, 0, false);
    const sp = glowSprite(pv, .2, .05, 0, 1.6, 0xff3020, .5);
    L.fx.beacons.push(pv); void cone; void sp;
  }
  addLight(L, 26, 3.4, -4.6, 0xff3020, 1.4, 10, .6);
  // casseforti, lingotti, sacchi di monete, armadietti
  const safe = (x, z, s, ry) => { safeBox(b, x, z, s, ry); addObs(L, x - s / 2, x + s / 2, z - s / 2, z + s / 2, s * 1.2, 'crate', true); };
  for (const [x, z, s] of [[4, -5.1, 1.2], [11, -5.1, 1.4], [17, 5.1, 1.2], [24, -5.1, 1.0], [35, 5.1, 1.4], [41, -5.1, 1.2], [48, 5.1, 1.2]]) safe(x, z, s, z < 0 ? 0 : Math.PI);
  const gold = (x, z) => {
    ingotPile(b, x, z);
    glowSprite(G, x, .5, z, 1.8, 0xffc060, .25);
    addObs(L, x - .65, x + .65, z - .5, z + .5, .55, 'crate', true);
  };
  for (const [x, z] of [[8, 4.6], [21, -1.6], [29, 4.6], [30.5, -4.6], [44, 1.4]]) gold(x, z);
  for (let i = 0; i < 12; i++) { const x = 4 + R() * (len - 8), z = (R() < .5 ? -1 : 1) * (3.4 + R() * 1.2); if (insideAny(L, x, z, .35)) continue; coinSack(b, x, z, R); }
  for (let x = 51 - 4.8; x < 51; x += .6) { b.box(MAT.plateGreen, x, 0, -5.6, .56, 2.4, .6); b.box(MAT.black, x, 1.9, -5.29, .4, .2, .02); }
  addObs(L, 51 - 5.1, 51, -5.9, -5.3, 2.4);
  // la porta del caveau sulla parete vicina
  const vx = 26, vz = 5.85;
  b.geo(MAT.steel, cylGeo(1.7, .3, 24).rotateX(Math.PI / 2).translate(vx, 2.0, vz));
  b.geo(MAT.steelDark, cylGeo(1.4, .34, 24).rotateX(Math.PI / 2).translate(vx, 2.0, vz - .02));
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.geo(MAT.brass, cylGeo(.08, .2, 8).rotateX(Math.PI / 2).translate(vx + Math.cos(a) * 1.55, 2.0 + Math.sin(a) * 1.55, vz - .12)); }
  for (let k = 0; k < 3; k++) bBoxR(b, MAT.brass, vx, 2.0, vz - .25, 1.8, .1, .08, 0, 0, k * Math.PI / 3);
  b.geo(MAT.brass, cylGeo(.25, .3, 12).rotateX(Math.PI / 2).translate(vx, 2.0, vz - .25));
  pool(L, vx, 4.2, 3, 0xcfe0ff, .1);
  // gabbie lungo il fondo con il tesoro dietro le sbarre
  for (const [xa, xb] of [[13, 19], [32, 38]]) { for (let x = xa; x <= xb + .01; x += .3) b.box(MAT.steelDark, x, 0, -3.9, .05, 3.6, .05); b.box(MAT.steelDark, (xa + xb) / 2, 3.55, -4.9, xb - xa, .08, 2.1); for (let i = 0; i < 4; i++) trunkProp(b, xa + .8 + i * 1.4, 0, -5.1, 0); addObs(L, xa, xb, -6, -3.85, 3.6); }
  L.mimicPts = [[6, 3.8], [15, 3.6], [27, -3.4], [37, 3.6], [47, -3.4]];
  return wagonFinish(S, { entryCol: 0xcfe0ff });
}

/* ---------- 8: officina a vapore ---------- */
function buildWorkshop(n) {
  const S = wagonShell(n, { len: 60, wall: MAT.plateCopper, wains: MAT.brick, trim: MAT.steelDark, roof: 'closed', ceil: MAT.plateDark, rib: MAT.steelDark, ribStep: 3, headWall: MAT.plateDark,
    floor: MAT.floorDiamond, floorTex: [TEX.diamond.map, TEX.diamond.bump], floorRep: [60, 12], wins: [10, 30, 50], winW: 2.0,
    moonK: .55, hemiK: .42, fog: [0x100b08, .022], dust: 0xffc890 });
  const { L, b, G, len } = S, R = mulberry(808);
  // tubi lungo le pareti e sul soffitto, con flange e valvole
  for (const sd of [-1, 1]) for (const [y, r, m] of [[2.55, .14, MAT.copper], [3.35, .1, MAT.steelDark], [3.85, .18, MAT.copper]]) {
    bCylX(b, m, len / 2, y, sd * 5.6, r, len - .6, 10);
    for (let x = 2; x < len; x += 4) bCylX(b, MAT.brass, x, y, sd * 5.6, r + .04, .1, 10);
  }
  bCylX(b, MAT.copper, len / 2, 4.55, -1.4, .22, len, 12); bCylX(b, MAT.steelDark, len / 2, 4.6, 1.2, .14, len, 10);
  for (const [x, sd] of [[7, -1], [19, 1], [33, -1], [45, 1], [55, -1]]) handwheel(b, x, 2.55, sd * 5.36, .2, sd);
  // manometri
  for (const x of [5, 15, 25, 35, 45, 55]) { bCylZ(b, MAT.brass, x, 1.9, -5.86, .2, .06, 14); b.geo(MAT.gauge, cylGeo(.16, .02, 14).rotateX(Math.PI / 2).translate(x, 1.9, -5.82)); bBoxR(b, MAT.red, x + .04, 1.92, -5.8, .14, .015, .01, 0, 0, .7); }
  // ingranaggi che girano sulla parete di fondo
  L.fx.gears = [];
  for (const [x, y, r, sp] of [[22, 2.6, 1.1, .5], [24.05, 3.4, .6, -.92], [40, 2.4, 1.3, -.4], [42.4, 1.2, .7, .75]]) {
    const gr = new THREE.Group(); gr.position.set(x, y, -5.75); G.add(gr);
    const disc = new THREE.Mesh(wg('gear' + r, () => new THREE.CylinderGeometry(r, r, .14, 18).rotateX(Math.PI / 2)), MAT.brass); gr.add(disc);
    const nT = Math.round(r * 12); for (let k = 0; k < nT; k++) { const a = k / nT * TAU, t = bx(gr, MAT.brass, .14, .18, .14, Math.cos(a) * (r + .06), Math.sin(a) * (r + .06), 0); t.rotation.z = a; }
    bx(gr, MAT.steelDark, r * 1.4, .1, .16, 0, 0, .02); bx(gr, MAT.steelDark, .1, r * 1.4, .16, 0, 0, .02);
    gr.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
    L.fx.gears.push({ m: gr, sp });
  }
  // forgia con la bocca incandescente
  const fx0 = 12, fz0 = 4.6;
  b.box(MAT.brick, fx0, 0, fz0, 2.4, 1.6, 1.5).box(MAT.brick, fx0, 1.6, fz0 + .2, 1.6, 1.4, 1.0).box(MAT.steelDark, fx0, 3.0, fz0 + .3, .6, 2.0, .6);
  bx(G, MAT.furnace, 1.0, .5, .1, fx0, .8, fz0 - .76, false); glowSprite(G, fx0, 1.05, fz0 - .9, 2.4, 0xff7a20, .6);
  addLight(L, fx0, 1.3, fz0 - 1.4, 0xff7a30, 3.0, 10, .4); pool(L, fx0, fz0 - 1.6, 3.4, 0xff6a20, .24);
  addObs(L, fx0 - 1.2, fx0 + 1.2, fz0 - .75, fz0 + .75, 3.0);
  b.box(MAT.steelDark, fx0 + 2.6, 0, fz0 - .3, .5, .55, .4).box(MAT.steelDark, fx0 + 2.6, .55, fz0 - .3, .9, .25, .35).box(MAT.steelDark, fx0 + 3.05, .65, fz0 - .3, .3, .1, .2); addObs(L, fx0 + 2.15, fx0 + 3.1, fz0 - .55, fz0 - .05, .8, 'crate', true);
  // banchi da lavoro con attrezzi
  for (const [x, z] of [[26, 4.9], [36, 4.9], [50, -4.9], [6, -4.9]]) {
    new Kit(b).box(MAT.oak, 2.6, .12, .9, x, .9, z, .02); for (const s of [-1, 1]) new Kit(b).box(MAT.iron, .1, .9, .8, x + s * 1.2, 0, z, .02);
    for (let i = 0; i < 4; i++) b.box(pick([MAT.steel, MAT.brass, MAT.red, MAT.steelDark]), x - .9 + i * .55, 1.02, z + (R() - .5) * .4, .12 + R() * .3, .06 + R() * .12, .1 + R() * .2, R() * 3);
    addObs(L, x - 1.3, x + 1.3, z - .45, z + .45, 1.02, 'crate', true);
  }
  // caldaiette verticali e prese di vapore nel pavimento
  for (const [x, z] of [[17, -4.6], [30, -1.6], [46, 4.6]]) { bCylY(b, MAT.copper, x, 0, z, .7, 2.6, 14); for (const y of [.3, 1.3, 2.3]) bCylY(b, MAT.brass, x, y, z, .73, .08, 14); b.geo(MAT.copper, new THREE.SphereGeometry(.7, 14, 6, 0, TAU, 0, Math.PI / 2).translate(x, 2.6, z)); bCylY(b, MAT.steelDark, x, 2.9, z, .1, 1.4, 8); addObs(L, x - .7, x + .7, z - .7, z + .7, 3.2); }
  L.fx.vents = [];
  for (const [x, z] of [[9, 1.2], [21, -1.8], [34, 1.6], [48, -1.2], [56, 1.4]]) { b.box(MAT.black, x, .005, z, .9, .02, .6); for (let i = 0; i < 4; i++) b.box(MAT.steelDark, x - .3 + i * .2, .01, z, .06, .02, .6); L.fx.vents.push([x, z, R() * 2]); }
  for (const x of [8, 22, 38, 52]) pendant(L, b, x, 0, x % 2 === 0 && x !== 22, 0xffb060, MAT.lamp);
  addLight(L, 31, 3.5, 0, 0xcfe0ff, 1.4, 12);
  return wagonFinish(S, { entryCol: 0xffb060 });
}

/* ---------- 9: salone di prima classe ---------- */
function buildLounge(n) {
  const S = wagonShell(n, { len: 64, wall: MAT.paperGreen, wains: MAT.woodDark, wainsH: .9, trim: MAT.gilt, cornice: MAT.gilt, roof: 'closed', ceil: MAT.ceilCream, rib: MAT.gilt, ribStep: 4,
    floor: MAT.floorParquet, floorTex: [TEX.parquet], floorRep: [32, 6], winsNear: [5, 13, 21, 29, 37, 45, 53, 59], winsFar: [5, 13, 21, 29, 37, 53, 59], winW: 3.0, winY0: 1.0, winY1: 3.5,
    moonK: .7, hemiK: .46, fog: [0x0c100c, .017], dust: 0xffe4b0 });
  const { L, b, G, len } = S, R = mulberry(909);
  for (const x of [12, 32, 52]) chandelier(L, b, x, 0, true, 0xffd090);
  // tappeti
  for (const x of [12, 32, 52]) plane(L, MAT.rug, 7, 4.4, x, .014, 0, -Math.PI / 2);
  TEX.rug.repeat.set(1, 1);
  // pianoforte a coda
  const px = 22, pz = -3.8;
  grandPiano(b, px, pz);
  addObs(L, px - 1.3, px + 1.35, pz - .75, pz + .75, 1.05, 'crate', true);
  // poltrone attorno a tavolini con lampade
  const lampTable = (x, z) => { lampTableProp(b, x, z); bx(G, MAT.bulb, .08, .08, .08, x, 1.0, z, false); pool(L, x, z, 2.2, 0xffc070, .14); addObs(L, x - .45, x + .45, z - .45, z + .45, .7, 'table', true); };
  for (const [x, z] of [[8, 3.8], [16, -3.6], [28, 3.8], [36, -3.6], [44, 3.8], [56, -3.6]]) {
    lampTable(x, z);
    for (const s of [-1, 1]) { const cx = x + s * 1.2; armchair(b, cx, z, -s * Math.PI / 2); addObs(L, cx - .4, cx + .4, z - .4, z + .4, .55, 'seat', true); }
  }
  // divani lungo le pareti e piante
  for (const [x, sd] of [[24, 1], [40, 1], [48, -1]]) { sofa(b, x, sd * 5.3, 2.6, sd); addObs(L, x - 1.3, x + 1.3, sd * 4.85, sd * 5.75, .55, 'seat', true); }
  for (const [x, z] of [[3, -5], [3, 5], [61, -5], [61, 5], [32, -5.1]]) { palm(L, b, x, z, .95, R); addObs(L, x - .4, x + .4, z - .4, z + .4, 1.2); }
  // camino elettrico con specchio e il ritratto del capotreno
  const fx = 44, fz = -5.75;
  b.box(MAT.marble, fx, 0, fz, 2.4, 1.3, .5).box(MAT.marble, fx, 1.3, fz + .05, 2.7, .12, .7); bx(G, MAT.furnace, 1.2, .5, .06, fx, .45, fz + .26, false);
  glowSprite(G, fx, .7, fz + .5, 2, 0xff8a40, .45); pool(L, fx, fz + 1.4, 2.6, 0xff8a40, .2); addLight(L, fx, .9, fz + 1, 0xff9a50, 1.2, 6, .3);
  { const k = new Kit(b, fx, 0, fz + .25); for (const [w, h, px, py] of [[1.5, .14, 0, 1.55], [1.5, .14, 0, 3.4], [.14, 1.71, -.68, 1.69], [.14, 1.71, .68, 1.69]]) k.box(MAT.gilt, w, h, .1, px, py, 0, .04); for (const sx of [-1, 1]) for (const y of [1.62, 3.47]) k.put(MAT.gilt, sph(.07, 12, 8), sx * .68, y, .05); k.put(MAT.portrait, new THREE.PlaneGeometry(1.22, 1.6), 0, 2.5, .0); }
  addObs(L, fx - 1.35, fx + 1.35, -6, -5.2, 1.4);
  // carrello del bar
  b.box(MAT.gilt, 6, .2, -4.4, 1.0, .04, .6).box(MAT.gilt, 6, .8, -4.4, 1.0, .04, .6); for (let i = 0; i < 4; i++) b.box(i % 2 ? MAT.bottleA : MAT.bottleG, 5.65 + i * .23, .84, -4.4, .08, .28, .08); addObs(L, 5.5, 6.5, -4.7, -4.1, .9);
  for (const x of [8, 20, 36, 56]) sconce(L, b, x, -1, 0xffc070, false);
  return wagonFinish(S, { entryCol: 0xffd090 });
}

/* ---------- 10: locomotiva ---------- */
function buildLoco(n) {
  const S = wagonShell(n, { len: 48, wall: MAT.plateDark, trim: MAT.brass, roof: 'open', wallH: 2.2, rail: false, headWall: MAT.plateDark, noExit: true,
    floor: MAT.floorSoot, floorTex: [TEX.diamond.map, TEX.diamond.bump], floorRep: [48, 12],
    moonK: 1.0, hemiK: .45, fog: [0x0e0a08, .018], dust: 0xff9a50, spawn: 'rise' });
  const { L, b, G, len } = S, R = mulberry(1010);
  L.fx.embers = true; L.fx.stack = true;
  // tender: carbone lungo le sponde
  for (const [x, z, r, h] of [[5, -4.6, 1.8, 1.5], [11, 4.6, 1.6, 1.3], [17, -4.5, 1.9, 1.6], [23, 4.5, 1.7, 1.4]]) { coalHeap(b, x, z, r, h, R); addObs(L, x - r * .55, x + r * .55, z - r * .55, z + r * .55, h * .6, 'crate', true); }
  // cabina: tetto, colonne e finestrini laterali sopra le sponde
  const cx0 = 30;
  b.box(MAT.plateDark, (cx0 + len) / 2, 4.2, 0, len - cx0 + .4, .2, 13).box(MAT.brass, (cx0 + len) / 2, 4.1, 0, len - cx0, .08, 12.6);
  for (let x = cx0; x <= len; x += 3) for (const sd of [-1, 1]) b.box(MAT.plateDark, x, 2.2, sd * 6.25, .4, 2.0, .5);
  for (let x = cx0 + 1.5; x < len; x += 3) for (const sd of [-1, 1]) b.box(MAT.brass, x, 2.2, sd * 6.0, 2.6, .06, .1);
  // la caldaia: il retro della locomotiva, con la bocca del fuoco
  const bz = len - .4;
  b.box(MAT.plateDark, bz, 0, 0, .8, 4.2, 12.6);
  b.geo(MAT.steelDark, cylGeo(2.6, .6, 28).rotateZ(Math.PI / 2).translate(bz - .5, 2.4, 0));
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; b.geo(MAT.brass, cylGeo(.07, .16, 6).rotateZ(Math.PI / 2).translate(bz - .85, 2.4 + Math.sin(a) * 2.35, Math.cos(a) * 2.35)); }
  b.box(MAT.brick, bz - .9, .5, 0, .3, 1.5, 2.2); bx(G, MAT.furnace, .08, 1.0, 1.6, bz - 1.06, 1.25, 0, false);
  for (const s of [-1, 1]) { const d = bx(G, MAT.steelDark, .1, 1.3, .9, bz - 1.12, 1.25, s * 1.25); d.rotation.y = s * .5; }
  glowSprite(G, bz - 1.5, 1.25, 0, 3.0, 0xff6a20, .55);
  addLight(L, bz - 2.6, 1.4, 0, 0xff7020, 2.8, 16, .3); pool(L, bz - 3, 0, 5, 0xff6a20, .24);
  // manometri, leve, tubi e il fischio
  for (const [y, z] of [[3.3, -1.6], [3.5, 0], [3.3, 1.6]]) { b.geo(MAT.brass, cylGeo(.32, .1, 16).rotateZ(Math.PI / 2).translate(bz - 1.0, y, z)); b.geo(MAT.gauge, cylGeo(.26, .02, 16).rotateZ(Math.PI / 2).translate(bz - 1.06, y, z)); bBoxR(b, MAT.red, bz - 1.08, y, z, .01, .22, .02, .7); }
  for (const sd of [-1, 1]) { bCylY(b, MAT.copper, bz - 1.0, 0, sd * 3.5, .12, 4.2, 8); bCylX(b, MAT.copper, bz - 2.5, 3.7, sd * 3.5, .1, 3, 8); }
  bCylY(b, MAT.brass, bz - 1.4, 3.8, -2.6, .08, .5, 8);
  addObs(L, bz - 1.2, len, -6, 6, 4.2);
  // il freno d'emergenza: si può tirare solo a capotreno sconfitto
  const lv = new THREE.Group(); lv.position.set(len - 3.4, 0, -3.8); G.add(lv);
  bx(lv, MAT.brass, .6, .3, .6, 0, .15, 0); bx(lv, MAT.steelDark, .3, .5, .3, 0, .5, 0);
  const arm = pivot(lv, 0, .75, 0); bx(arm, MAT.steel, .08, 1.3, .08, 0, .65, 0); bx(arm, MAT.red, .22, .22, .22, 0, 1.35, 0); arm.rotation.z = .5;
  bx(lv, MAT.alarm, .2, .06, .2, 0, .32, .32, false);
  L.fx.brake = { arm, t: 0, pull: false };
  addObs(L, len - 3.75, len - 3.05, -4.15, -3.45, 1.2);
  L.inter.push({ id: 'brake', x: len - 3.4, z: -3.0, r: 1.8, label: 'Freno d\'emergenza', desc: 'Ferma il treno', cond: () => run && run.cleared });
  for (const x of [34, 42]) pendant(L, b, x, 0, false, 0xffb060, MAT.lamp, 4.1);
  L.noNeighbor = true;
  return wagonFinish(S, { noExit: true, entryCol: 0xff9a50 });
}
