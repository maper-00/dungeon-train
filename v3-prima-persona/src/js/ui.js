/* ================= interfaccia ================= */
const UI = (() => {
  const E = id => document.getElementById(id);
  const modal = E('modal'), titleEl = E('title'), dialogEl = E('dialog'), dText = E('dText'), dWho = E('dWho'), more = dialogEl.querySelector('.more');
  const promptEl = E('prompt'), pTitle = E('pTitle'), pDesc = E('pDesc'), pKey = E('pKey'), tbUse = E('tbUse');
  const floatersEl = E('floaters'), toastsEl = E('toasts'), bannerEl = E('banner'), fadeEl = E('fade');
  const xh = E('xhair'), hurtEl = E('hurt'), lockHint = E('lockHint'), edgeL = E('edgeL'), edgeR = E('edgeR'), bossEl = E('bossbar'), bossName = E('bossName'), bossHp = E('bossHp');
  const txt = new WeakMap();
  function setText(el, v) { v = String(v); if (txt.get(el) !== v) { txt.set(el, v); el.textContent = v; } }
  function show(el, on) { if (el.hidden === on) el.hidden = !on; }
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  const _p = new THREE.Vector3();
  function project(x, y, z) { _p.set(x, y, z).project(camera); return { x: (_p.x + 1) / 2 * innerWidth, y: (1 - _p.y) / 2 * innerHeight, ok: _p.z > -1 && _p.z < 1 }; }
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  /* ---------- HUD ---------- */
  function zone(L) {
    setText(E('zoneTag'), L.tag); setText(E('zoneName'), L.name);
    setText(E('zoneWx'), L.wx || 'PIOGGIA SUI VETRI');
    map(); objective(); coins();
  }
  function objText() {
    if (!level) return '';
    if (level.kind === 'hub') return save.cls ? level.obj : 'Scegli la tua classe';
    if (!run) return level.obj;
    if (run.cleared) return run.n >= WAGONS.length ? 'Tira il freno d\'emergenza accanto alla caldaia' : merchant ? 'Passa dalla bottega, poi apri la porta del Vagone ' + (run.n + 1) : 'Carrozza libera: apri la porta del Vagone ' + (run.n + 1);
    if (run.wave < 0) return 'Avanza nella carrozza';
    if (!run.active) return 'Arriva un\'altra ondata…';
    return 'Ondata ' + (run.wave + 1) + ' di ' + run.waves.length + ' · nemici rimasti: ' + (enemies.filter(e => !e.dead).length + run.queue.length);
  }
  function objective() { setText(E('objSub'), objText()); }
  function coins() {
    const inRun = run && level && level.kind === 'wagon';
    setText(E('coins'), inRun ? run.coins : save.bank);
    setText(E('orbs'), inRun ? run.kills : save.cleared);
    setText(E('orbsL'), inRun ? 'Nemici' : 'Vagoni');
  }
  // la mappa del treno: cabina, poi i dieci vagoni (bordo rosso: boss, punto dorato: bottega)
  function map() {
    const inW = level && level.kind === 'wagon' && run, n = inW ? run.n : 0, cl = run && run.cleared;
    let h = '<div class="w home' + (inW ? ' done' : ' cur') + '"></div>';
    for (let i = 1; i <= WAGONS.length; i++) {
      let c = inW ? (i < n || (i === n && cl) ? ' done' : i === n ? ' cur' : '') : (i <= (save.best || 0) ? ' seen' : '');
      if (BOSS_WAGONS.includes(i)) c += ' boss'; if (WAGONS[i - 1].shop) c += ' shop';
      h += '<div class="link"></div><div class="w' + c + '" title="' + i + ' · ' + WAGONS[i - 1].name + '"></div>';
    }
    E('map').innerHTML = h;
    setText(E('mapTxt'), inW ? 'Vagone ' + n + ' di ' + WAGONS.length + ' · ' + WAGONS[n - 1].name : 'Cabina · ' + WAGONS.length + ' vagoni fino alla locomotiva');
  }
  function weaponLine(w) {
    return '<span style="color:' + RAR[w.rar].c + '">' + esc(w.name) + '</span><small>DANNO ' + w.dmg + ' · RICARICA ' + w.cd + 's · CRIT ' + w.crit + '%</small>';
  }
  function player() {
    if (!p) return;
    setText(E('pName'), p.cls.name); setText(E('clsName'), p.cls.name);
    const k = Math.max(0, p.hp / p.max);
    E('hpBar').style.width = (k * 100) + '%'; E('hpBarWrap').classList.toggle('low', p.hp <= Math.max(1, p.max / 3));
    setText(E('hpTxt'), 'VITA ' + Math.max(0, p.hp) + ' / ' + p.max);
    E('wpn').innerHTML = weaponLine(p.weapon);
  }
  function cmp(a, b, lowBetter) { if (a === b) return ''; const up = lowBetter ? a < b : a > b; return ' <i class="' + (up ? 'up' : 'down') + '">' + (up ? '▲' : '▼') + '</i>'; }
  function weaponMini(w, cur) {
    return '<span style="color:' + RAR[w.rar].c + '">' + RAR[w.rar].n + ' · Lv' + w.lvl + '</span> · Danno ' + w.dmg + cmp(w.dmg, cur.dmg) + ' · ' + w.cd + 's' + cmp(w.cd, cur.cd, true) + ' · Crit ' + w.crit + '%' + cmp(w.crit, cur.crit);
  }
  function weaponCard(w, cur) {
    return '<b style="color:' + RAR[w.rar].c + '">' + esc(w.name) + '</b><div class="meta">' + RAR[w.rar].n.toUpperCase() + ' · LV ' + w.lvl + ' · ' + WT[w.type].n.toUpperCase() + '</div><div class="meta" style="margin-top:-4px">' + WT[w.type].d + '</div>' +
      '<div class="st"><span>Danno</span><span>' + w.dmg + cmp(w.dmg, cur.dmg) + '</span><span>Ricarica</span><span>' + w.cd + ' s' + cmp(w.cd, cur.cd, true) + '</span><span>Critico</span><span>' + w.crit + '%' + cmp(w.crit, cur.crit) + '</span></div>';
  }

  /* ---------- testi volanti, barre vita, avvisi ---------- */
  const floats = [];
  function dmg(x, y, z, text, color) {
    const d = document.createElement('div'); d.className = 'dmg'; d.textContent = text; d.style.color = color || '#fff';
    if (text.length > 4) d.style.fontSize = '12px';
    floatersEl.appendChild(d); floats.push({ d, x, y, z, t: 0, life: text.length > 4 ? 1.1 : .8, ox: rnd(-.3, .3) });
    if (floats.length > 40) floats.shift().d.remove();
  }
  function hpBar(boss) { const d = document.createElement('div'); d.className = 'hpb' + (boss ? ' boss' : ''); d.innerHTML = '<i></i>'; d.hidden = true; floatersEl.appendChild(d); return d; }
  function placeHp(e) {
    const el = e.hpEl, want = e.hp < e.max && e.state !== 'sleep' && (e.vis === undefined || e.vis > .5);
    if (!want || e.falling || e.rising > 0) { show(el, false); return; }
    const s = project(e.x, e.y + MOBS[e.type].hph, e.z);
    if (!s.ok) { show(el, false); return; }
    show(el, true); el.style.left = s.x.toFixed(1) + 'px'; el.style.top = s.y.toFixed(1) + 'px'; el.firstChild.style.width = Math.max(0, e.hp / e.max * 100) + '%';
  }
  function toast(text, color) {
    const t = document.createElement('div'); t.className = 'toast glass'; t.textContent = text;
    if (color) t.style.borderLeft = '2px solid ' + color;
    toastsEl.appendChild(t); while (toastsEl.children.length > 3) toastsEl.firstChild.remove();
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 450); }, 3200);
  }
  let bannerT = 0;
  function banner(text, sub) {
    bannerEl.innerHTML = esc(text) + (sub ? '<small>' + esc(sub) + '</small>' : ''); bannerEl.classList.add('on');
    clearTimeout(bannerT); bannerT = setTimeout(() => bannerEl.classList.remove('on'), 2400);
  }
  function hit(kill) { xh.classList.remove('hit', 'kill'); void xh.offsetWidth; xh.classList.add('hit'); if (kill) xh.classList.add('kill'); }
  // rel: angolo della fonte rispetto allo sguardo (positivo = a sinistra); l'arco rosso indica da che parte
  function hurtFrom(rel) {
    const i = document.createElement('i'); i.style.transform = 'rotate(' + (-rel).toFixed(3) + 'rad)'; hurtEl.appendChild(i);
    setTimeout(() => i.remove(), 950); while (hurtEl.children.length > 4) hurtEl.firstChild.remove();
  }
  let fadeOn = false;
  function fade(on) { fadeOn = on; fadeEl.classList.toggle('on', on); }

  /* ---------- dialoghi ---------- */
  const dlg = { active: false, q: [], lines: null, i: 0, line: '', shown: 0, done: null };
  function dialog(lines, who, done) {
    dlg.q.push({ lines, who, done });
    if (!dlg.active) nextDialog();
  }
  function nextDialog() {
    const d = dlg.q.shift(); if (!d) return;
    dlg.active = true; dlg.lines = d.lines; dlg.i = 0; dlg.done = d.done; releaseAll();
    setText(dWho, d.who || 'CAPOTRENO'); dialogEl.style.borderTopColor = d.who && d.who !== 'CAPOTRENO' ? 'var(--amber)' : 'var(--teal)'; dWho.style.color = dialogEl.style.borderTopColor;
    talk(true); showLine();
  }
  function showLine() {
    dlg.line = dlg.lines[dlg.i]; dlg.shown = 0; setText(dText, '');
    const last = dlg.i >= dlg.lines.length - 1;
    setText(more, isTouch ? (last ? 'TOCCA PER CHIUDERE' : 'TOCCA ▸') : (last ? 'CHIUDI ▸' : 'AVANTI ▸'));
  }
  // mentre si parla i pannelli in basso si nascondono (vedi body.talking nel CSS)
  function talk(on) { show(dialogEl, on); document.body.classList.toggle('talking', on); }
  function clearDialog() { dlg.q.length = 0; dlg.active = false; dlg.done = null; talk(false); }
  function advance(skipAll) {
    if (!dlg.active) return;
    if (!skipAll && dlg.shown < dlg.line.length) { dlg.shown = dlg.line.length; setText(dText, dlg.line); return; }
    if (!skipAll && dlg.i < dlg.lines.length - 1) { dlg.i++; sfx('tick'); showLine(); return; }
    dlg.active = false; talk(false);
    const fn = dlg.done; dlg.done = null;
    if (fn) fn();
    if (!dlg.active) nextDialog();
  }

  /* ---------- pannelli modali ---------- */
  let M = null; // { closable, onClose, click(e,t), nav(i), timer }
  function openModal(html, opt) {
    if (M && M.timer) clearInterval(M.timer);
    modal.innerHTML = html; show(modal, true); M = opt || {}; releaseAll(); unlock();
    const f = modal.querySelector(M.focus || '.on[data-nav], [data-nav], .cta, button'); if (f) f.focus({ preventScroll: true });
  }
  function closeModal(silent) {
    if (!M) return;
    const m = M; M = null; if (m.timer) clearInterval(m.timer);
    show(modal, false); modal.innerHTML = ''; try { canvas.focus({ preventScroll: true }); } catch (e) { }
    if (!silent && m.onClose) m.onClose();
  }
  modal.addEventListener('click', e => {
    if (!M) return;
    if (e.target === modal) { if (M.closable) { sfx('tick'); closeModal(); } }
    else {
      const t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-close')) { if (M.closable !== false || t.classList.contains('cta')) { sfx('tick'); closeModal(); } }
      else if (M.click) M.click(t, e);
    }
    // chiuso il pannello con un clic, il mouse torna a guidare lo sguardo
    if (modal.hidden && (STATE === 'play' || STATE === 'end')) lock();
  });
  modal.addEventListener('focusin', e => { const t = e.target.closest('[data-nav]'); if (t && M && M.nav) M.nav(+t.dataset.i, t); });
  function modalKey(e) {
    if (e.code === 'Escape') { e.preventDefault(); if (M && M.closable) { sfx('tick'); closeModal(); } return; }
    // Invio su una scelta: sceglie e conferma, così con la sola tastiera non si resta fermi
    if ((e.code === 'Enter' || e.code === 'NumpadEnter') && M && M.enter) {
      const t = document.activeElement;
      if (t && t.dataset && t.dataset.i !== undefined && modal.contains(t)) { e.preventDefault(); if (!e.repeat) M.enter(+t.dataset.i); return; }
    }
    const dir = { ArrowLeft: -1, ArrowUp: -1, KeyA: -1, KeyW: -1, ArrowRight: 1, ArrowDown: 1, KeyD: 1, KeyS: 1 }[e.code];
    if (dir) {
      e.preventDefault();
      const items = [...modal.querySelectorAll('[data-nav]')]; if (!items.length) return;
      let i = items.indexOf(document.activeElement); if (i < 0) i = items.findIndex(x => x.classList.contains('on'));
      i = (Math.max(0, i) + dir + items.length) % items.length; items[i].focus({ preventScroll: true }); sfx('tick');
    }
  }
  const head = (title, sub, closable) => '<div class="head"><div><h2 id="mT">' + title + '</h2><div class="sub">' + sub + '</div></div>' + (closable ? '<button class="ghost x" type="button" data-close aria-label="Chiudi">✕</button>' : '') + '</div>';
  const panel = (inner, w) => '<div class="panel glass" role="dialog" aria-modal="true" aria-labelledby="mT"' + (w ? ' style="width:min(' + w + 'px,100%)"' : '') + '>' + inner + '</div>';

  /* scelta della classe */
  const PERK = { parry: 'PARRY AMPIO', slide: 'SCIVOLATA LUNGA', pierce: 'DARDI PERFORANTI' };
  function classSelect(done) {
    const closable = !!save.cls; let sel = Math.max(0, CLASSES.findIndex(c => c.id === save.cls));
    const cards = CLASSES.map((c, i) => '<button class="card' + (i === sel ? ' on' : '') + '" type="button" data-nav data-i="' + i + '"><img src="' + classPortrait(c.id, save.outfit) + '" alt=""><div><div class="tag">' + WT[c.weapon].n.toUpperCase() + ' · ' + PERK[c.perk] + '</div><b>' + c.name + '</b><div class="hp" aria-label="' + c.hp + ' cuori">' + '♥'.repeat(c.hp) + '</div><p>' + c.desc + '</p></div></button>').join('');
    openModal(panel(head('CHI SEI?', 'SCEGLI LA CLASSE · PUOI CAMBIARLA DAL BAULE IN CABINA', closable) + '<div class="cards">' + cards + '</div><div class="actions"><button class="cta" type="button" data-ok>Parti come ' + CLASSES[sel].name + '</button></div>'), {
      closable, onClose: () => { if (done) done(); },
      nav(i) { sel = i; modal.querySelectorAll('.card').forEach((c, k) => c.classList.toggle('on', k === i)); setText(modal.querySelector('[data-ok]'), 'Parti come ' + CLASSES[i].name); },
      enter(i) { this.nav(i); this.click(modal.querySelector('[data-ok]')); },
      click(t) {
        if (t.dataset.i !== undefined) { this.nav(+t.dataset.i); sfx('tick'); return; }
        if (t.hasAttribute('data-ok')) {
          const c = CLASSES[sel], changed = save.cls !== c.id; save.cls = c.id; persist(); applyClass(); sfx('pick');
          if (changed) toast('Classe: ' + c.name + ' · ' + WT[p.weapon.type].n, '#e9b45c');
          objective(); closeModal();
        }
      }
    });
  }

  /* bestiario */
  const MOB_ORDER = Object.keys(MOBS);
  function bestiary() {
    let sel = 0; const known = MOB_ORDER.filter(t => save.kills[t]).length;
    const list = MOB_ORDER.map((t, i) => { const n = save.kills[t] || 0; return '<button class="opt' + (i === sel ? ' on' : '') + '" type="button" data-nav data-i="' + i + '">' + (n ? MOBS[t].name : '???') + '<span>' + (n ? '×' + n : '') + '</span></button>'; }).join('');
    openModal(panel(head('BESTIARIO', known + ' / ' + MOB_ORDER.length + ' CREATURE · SCONFIGGILE PER SCOPRIRE I PUNTI DEBOLI', true) + '<div class="best"><div class="blist">' + list + '</div><div class="bdet" id="bdet"></div></div>'), {
      closable: true,
      nav(i) {
        sel = i; modal.querySelectorAll('.opt').forEach((c, k) => c.classList.toggle('on', k === i));
        const t = MOB_ORDER[i], d = MOBS[t], n = save.kills[t] || 0, img = '<img src="' + mobPortrait(t) + '" alt="" class="' + (n ? '' : 'unknown') + '">';
        E('bdet').innerHTML = n
          ? img + '<div><h3>' + d.name + '</h3><div class="lbl" style="color:var(--amber)">SCONFITTI · ' + n + (d.boss ? ' · BOSS' : d.elite ? ' · MINI BOSS' : '') + ' · DAL VAGONE ' + d.where + '</div><div class="lbl" style="color:#ff9a5a">PUNTO DEBOLE</div><p>' + d.weak + '</p><div class="lbl" style="color:var(--teal)">STORIA</div><p>' + d.lore + '</p></div>'
          : img + '<div><h3>???</h3><div class="lbl" style="color:var(--dim)">NON ANCORA INCONTRATO</div><p>Sconfiggi questa creatura per sbloccarne la scheda, i punti deboli e la storia. Si aggira ' + (d.boss || d.elite ? 'in fondo al Vagone ' : 'dal Vagone ') + d.where + '.</p></div>';
      },
      click(t) { if (t.dataset.i !== undefined) { this.nav(+t.dataset.i); sfx('tick'); } }
    });
    M.nav(0);
  }

  /* armadio */
  function wardrobe() {
    const cls = p ? p.cls.id : (save.cls || 'cavaliere');
    const sw = OUTFITS.map((o, i) => '<button class="sw' + (i === save.outfit ? ' on' : '') + '" type="button" data-nav data-i="' + i + '" aria-label="' + o[0] + '" style="background:linear-gradient(135deg,' + hex(o[1]) + ' 50%,' + hex(o[2]) + ' 50%)"></button>').join('');
    openModal(panel(head('ARMADIO', 'IL COLORE DELL\'ABITO · SI SALVA DA SOLO', true) + '<div class="bdet"><img id="wImg" src="' + classPortrait(cls, save.outfit) + '" alt=""><div><h3 id="wName">' + OUTFITS[save.outfit][0] + '</h3><p>Mantello, giacca e maniche cambiano colore. Il treno si ricorderà di te così.</p><div class="swatches">' + sw + '</div></div></div><div class="actions"><button class="cta" type="button" data-close>Fatto</button></div>', 560), {
      closable: true,
      nav(i) {
        if (i === save.outfit) return;
        save.outfit = i; persist();
        modal.querySelectorAll('.sw').forEach((c, k) => c.classList.toggle('on', k === i));
        E('wImg').src = classPortrait(cls, i); setText(E('wName'), OUTFITS[i][0]);
        if (p && p.model) setModelOutfit(p.model, i);
        if (level && level.fx.scarf) level.fx.scarf.material = outfitMats[i][0];
      },
      click(t) { if (t.dataset.i !== undefined) { this.nav(+t.dataset.i); sfx('tick'); } },
      enter(i) { this.nav(i); sfx('tick'); closeModal(); }
    });
  }

  /* slot machine */
  const ICON = {
    spada: '<g transform="rotate(45 32 32)" stroke="#2a2018" stroke-width="2"><rect x="29" y="5" width="6" height="35" fill="#cfd6de"/><rect x="20" y="40" width="24" height="5" fill="#c8963c"/><rect x="29.5" y="45" width="5" height="10" fill="#5a3a26"/><rect x="28" y="55" width="8" height="5" fill="#c8963c"/></g>',
    ascia: '<g transform="rotate(28 32 32)" stroke="#2a2018" stroke-width="2"><rect x="29.5" y="6" width="5" height="52" fill="#6b4428"/><path d="M34.5 9 L52 4 L54 27 L34.5 22 Z" fill="#cfd6de"/><rect x="27" y="8" width="10" height="14" fill="#4a5058"/></g>',
    pugnale: '<g transform="rotate(45 32 32)" stroke="#2a2018" stroke-width="2"><path d="M29 14 L32 8 L35 14 L35 38 L29 38 Z" fill="#cfd6de"/><rect x="22" y="38" width="20" height="4" fill="#c8963c"/><rect x="29.5" y="42" width="5" height="11" fill="#5a3a26"/></g>',
    arco: '<g stroke="#2a2018" stroke-width="2" fill="none"><path d="M22 7 Q50 32 22 57" stroke="#6b4428" stroke-width="5"/><path d="M22 7 L22 57" stroke-width="1.5"/><path d="M12 32 L52 32"/><path d="M53 32 L45 27 L45 37 Z" fill="#cfd6de"/><path d="M12 32 L8 28 M12 32 L8 36" stroke="#8e2630" stroke-width="2.5"/></g>',
    bastone: '<g transform="rotate(30 32 32)" stroke="#2a2018" stroke-width="2"><rect x="29.5" y="20" width="5" height="40" fill="#5a3a26"/><rect x="26.5" y="15" width="11" height="5" fill="#c8963c"/><rect x="25.5" y="2" width="13" height="13" fill="#c98bff" transform="rotate(45 32 8.5)"/></g>',
    sciabola: '<g transform="rotate(45 32 32)" stroke="#2a2018" stroke-width="2"><path d="M29.5 40 Q25 22 34 4 Q37 22 35 40 Z" fill="#cfd6de"/><rect x="22" y="40" width="20" height="4" fill="#c8963c"/><rect x="29.5" y="44" width="5" height="11" fill="#5a3a26"/><path d="M40 43 Q45 51 35 57" fill="none" stroke="#c8963c" stroke-width="3"/></g>',
    lancia: '<g transform="rotate(45 32 32)" stroke="#2a2018" stroke-width="2"><rect x="30" y="17" width="4" height="45" fill="#6b4428"/><path d="M32 2 L38 13 L32 20 L26 13 Z" fill="#cfd6de"/><rect x="28" y="19" width="8" height="4" fill="#c8963c"/><path d="M29 24 l-4 8 M35 24 l4 8" stroke="#8e2630" stroke-width="2.5"/></g>',
    martello: '<g transform="rotate(30 32 32)" stroke="#2a2018" stroke-width="2"><rect x="29.5" y="18" width="5" height="42" fill="#6b4428"/><rect x="15" y="5" width="34" height="16" fill="#8a929c"/><rect x="21" y="5" width="3" height="16" fill="#c8963c"/><rect x="40" y="5" width="3" height="16" fill="#c8963c"/></g>',
    falce: '<g transform="rotate(12 32 32)" stroke="#2a2018" stroke-width="2"><rect x="29.5" y="7" width="5" height="55" fill="#6b4428"/><path d="M32 8 Q49 1 59 19 Q46 10 34 15 Z" fill="#cfd6de"/><rect x="22" y="34" width="10" height="4" fill="#6b4428"/></g>',
    balestra: '<g stroke="#2a2018" stroke-width="2"><rect x="29" y="18" width="6" height="40" fill="#6b4428"/><path d="M10 23 Q32 10 54 23" fill="none" stroke="#8a929c" stroke-width="4"/><path d="M10 23 L32 31 L54 23" fill="none" stroke-width="1.5"/><rect x="31" y="7" width="2" height="25" fill="#cfd6de"/><path d="M32 3 l-3.5 6 h7 z" fill="#cfd6de"/></g>',
    trombone: '<g transform="rotate(-35 32 32)" stroke="#2a2018" stroke-width="2"><path d="M5 37 L22 30 L24 41 L8 47 Z" fill="#6b4428"/><rect x="22" y="29" width="28" height="7" fill="#c8963c"/><path d="M50 27 L60 21 L60 44 L50 38 Z" fill="#c8963c"/></g>',
    tomo: '<g stroke="#2a2018" stroke-width="2"><path d="M7 18 Q20 13 32 20 L32 53 Q20 46 7 50 Z" fill="#efe6d0"/><path d="M57 18 Q44 13 32 20 L32 53 Q44 46 57 50 Z" fill="#efe6d0"/><path d="M37 25 L43 25 L39 34 L45 34 L36 47 L39 37 L34 37 Z" fill="#8ac8ff"/><path d="M13 27 h13 M13 33 h13 M13 39 h10" stroke="#9ba4a6"/></g>',
    lanterna: '<g stroke="#2a2018" stroke-width="2"><path d="M26 5 h12 v6 h-12 z" fill="#c8963c"/><path d="M19 13 h26 l-3 7 h-20 z" fill="#c8963c"/><rect x="22" y="20" width="20" height="28" fill="#ffb060"/><path d="M32 26 q6 8 0 16 q-6 -8 0 -16" fill="#fff0c0" stroke="none"/><rect x="19" y="48" width="26" height="5" fill="#c8963c"/><path d="M22 20 v28 M42 20 v28" stroke="#c8963c" stroke-width="3"/></g>'
  };
  const icon = t => '<svg viewBox="0 0 64 64" aria-label="' + WT[t].n + '">' + ICON[t] + '</svg>';
  const TYPES = Object.keys(WT);
  function slot() {
    const cost = 25; let res = null;
    const bankTxt = () => 'IN BANCA: ' + save.bank + ' MONETE';
    const hint = '<div class="meta">' + TYPES.length + ' armi possibili. Tre simboli uguali: livello 3. Due uguali: livello 2.<br>L\'arma vale per la prossima corsa.</div>';
    openModal(panel(head('SLOT MACHINE', cost + ' MONETE · UN\'ARMA A CASO', true) +
      '<div class="reels">' + [0, 1, 2].map(i => '<div class="reel" id="r' + i + '">' + icon(TYPES[(i * 4) % TYPES.length]) + '</div>').join('') + '</div>' +
      '<div class="res" id="sres">' + hint + '</div>' +
      '<div class="actions"><span class="saved" id="sBank" style="margin-right:auto;align-self:center">' + bankTxt() + '</span><button class="ghost" type="button" data-skip hidden>Lascia</button><button class="ghost" type="button" data-take hidden>Prendi</button><button class="cta" type="button" data-spin>Gira · ' + cost + ' monete</button></div>', 540), {
      closable: true, focus: '[data-spin]',
      click(t) {
        const spinB = modal.querySelector('[data-spin]'), takeB = modal.querySelector('[data-take]'), skipB = modal.querySelector('[data-skip]');
        if (t.hasAttribute('data-spin')) {
          if (save.bank < cost) { sfx('hurt'); E('sres').innerHTML = '<div class="meta" style="color:#ff8f86">Servono ' + cost + ' monete. Ne hai ' + save.bank + '. Le trovi nei vagoni.</div>'; return; }
          save.bank -= cost; persist(); coins(); setText(E('sBank'), bankTxt()); sfx('coin');
          M.closable = false; spinB.disabled = true; show(takeB, false); show(skipB, false); res = null;
          E('sres').innerHTML = '<div class="meta">Gira…</div>';
          if (level && level.fx.knob) level.fx.knob.position.y = 1.9;
          const f = [pick(TYPES), pick(TYPES), pick(TYPES)], stop = [9, 14, 19]; let tick = 0;
          M.timer = setInterval(() => {
            tick++;
            for (let i = 0; i < 3; i++) if (tick <= stop[i]) E('r' + i).innerHTML = icon(tick === stop[i] ? f[i] : pick(TYPES));
            if (stop.includes(tick)) sfx('tick');
            if (tick >= stop[2]) {
              clearInterval(M.timer); M.timer = 0;
              const same = (f[0] === f[1]) + (f[1] === f[2]) + (f[0] === f[2]);
              res = genWeapon(f[1], 1 + Math.min(2, same), same * .25); sfx('open');
              if (level && level.fx.knob) level.fx.knob.position.y = 2.08;
              E('sres').innerHTML = '<div class="wc" style="border-top-color:' + RAR[res.rar].c + '">' + weaponCard(res, p.weapon) + '</div>';
              M.closable = true; spinB.disabled = false; setText(spinB, 'Gira ancora · ' + cost); show(takeB, true); show(skipB, true); takeB.classList.add('cta'); takeB.classList.remove('ghost'); spinB.classList.remove('cta'); spinB.classList.add('ghost'); takeB.focus({ preventScroll: true });
            }
          }, 75);
          return;
        }
        if (t.hasAttribute('data-take') && res) {
          p.weapon = res; save.startWeapon = res; persist(); setModelWeapon(p.model, res); player(); sfx('pick');
          toast('Equipaggiata: ' + res.name, RAR[res.rar].c); closeModal(); return;
        }
        if (t.hasAttribute('data-skip')) { res = null; closeModal(); }
      }
    });
  }


  /* bottega del robot (nei vagoni 3, 6 e 9, a vagone libero) */
  function shop() {
    if (!run || !run.shop) return;
    const S = run.shop;
    const card = (it, i) => {
      const can = !it.sold && run.coins >= it.price && !(it.kind === 'heal' && p.hp >= p.max);
      let body;
      if (it.kind === 'heal') body = '<b>Tè caldo del robot</b><div class="meta">CURA · +2 VITA</div><p class="note">Bollente, dolce, vagamente metallico.</p>';
      else if (it.kind === 'max') body = '<b>Ingranaggio di scorta</b><div class="meta">VITA MASSIMA +1 · CURA TUTTO</div><p class="note">Va avvitato da qualche parte. Meglio non chiedere dove.</p>';
      else body = weaponCard(it.w, p.weapon);
      return '<div class="item' + (it.sold ? ' sold' : '') + '">' + body + '<button class="' + (can ? 'cta' : 'ghost') + '" type="button" data-buy="' + i + '"' + (can ? '' : ' disabled') + '>' + (it.sold ? 'Venduto' : 'Compra · ' + it.price) + '</button></div>';
    };
    const draw = () => { E('shopItems').innerHTML = S.items.map(card).join(''); setText(E('shopCoins'), 'MONETE DELLA CORSA: ' + run.coins); };
    openModal(panel(head('BOTTEGA DEL ROBOT', 'SI PAGA CON LE MONETE DELLA CORSA', true) + '<div class="shop" id="shopItems"></div><div class="actions"><span class="saved" id="shopCoins" style="margin-right:auto;align-self:center"></span><button class="cta" type="button" data-close>Riparti</button></div>', 680), {
      closable: true, focus: '[data-close]',
      click(t) {
        if (t.dataset.buy === undefined) return;
        const it = S.items[+t.dataset.buy]; if (!it || it.sold || run.coins < it.price) { sfx('hurt'); return; }
        run.coins -= it.price; sfx('coin');
        if (it.kind === 'heal') { p.hp = Math.min(p.max, p.hp + 2); }
        else if (it.kind === 'max') { p.max++; p.hp = p.max; it.sold = true; run.bought++; }
        else { const old = p.weapon; p.weapon = it.w; setModelWeapon(p.model, it.w); it.sold = true; if (merchant) dropPick('weapon', merchant.x - 1.8, merchant.z - 1.4, old); toast('Equipaggiata: ' + it.w.name, RAR[it.w.rar].c); }
        sfx('pick'); player(); coins(); draw();
      }
    });
    draw();
  }

  /* fine corsa */
  function end(win, got) {
    STATE = 'end'; releaseAll(); clearDialog();
    const n = run ? run.n : 1, W = WAGONS[n - 1];
    const q = win ? '«Il treno rallenta, stride, si ferma. Per la prima volta in centotrent\'anni si sente solo la pioggia. Grazie, passeggero.»' : '«Capita. Il treno ti riporta sempre in cabina. Metà delle monete restano a te.»';
    openModal(panel(head(win ? 'IL TRENO SI È FERMATO' : 'SEI CADUTO', win ? 'DIECI VAGONI · LOCOMOTIVA' : 'VAGONE ' + n + ' · ' + W.name.toUpperCase(), false) +
      '<div class="stats"><span>' + (win ? 'Monete guadagnate' : 'Monete tenute (metà)') + '</span><b>' + got + '</b><span>Vagoni superati</span><b>' + (win ? WAGONS.length : n - 1) + ' / ' + WAGONS.length + '</b><span>Nemici sconfitti</span><b>' + (run ? run.kills : 0) + '</b><span>Tempo</span><b>' + mmss(run ? run.t : 0) + '</b><span>Monete in banca</span><b>' + save.bank + '</b></div>' +
      '<p class="quote">' + q + '</p><div class="actions"><button class="cta" type="button" data-home>Torna alla cabina</button></div>', 520), {
      closable: false, focus: '[data-home]',
      click(t) { if (t.hasAttribute('data-home')) { closeModal(true); transition(() => startHub(false)); } }
    });
  }

  /* impostazioni */
  function settings() {
    const inRun = STATE === 'play' && run && level && level.kind === 'wagon' && p && !p.dead;
    const keys = isTouch
      ? [['Joystick', 'Tocca e trascina nella metà sinistra per camminare'], ['Trascina', 'Nel resto dello schermo per guardarti intorno, anche partendo da un tasto'], ['ATTACCA', 'Colpisce quello che hai davanti, con un piccolo aiuto nella mira'], ['PARRY', 'Al momento giusto respinge colpi e frecce'], ['SALTA', 'Due volte per il doppio salto, anche sui sedili'], ['SCIVOLA', 'Scatto rasoterra: passi sotto frecce e biglietti'], ['USA', 'Ribalta tavoli, raccoglie armi, apre porte']]
      : [['WASD', 'Cammina e spostati di lato'], ['Mouse', LOOK.fallback ? 'Guardati intorno; vicino ai bordi dello schermo ti giri' : 'Guardati intorno (clicca sulla scena per catturarlo)'], ['← →', 'Girati con la tastiera'], ['Clic / J', 'Attacca verso il mirino'], ['Destro / Q', 'Parry: respinge colpi e frecce'], ['Spazio', 'Salta, due volte per il doppio salto'], ['Shift', 'Scivolata: passi sotto frecce e biglietti'], ['E', 'Ribalta tavoli, raccogli armi, apri porte'], ['B', 'Bestiario'], ['M', 'Audio sì / no'], ['Esc', 'Pausa e mouse libero']];
    openModal(panel(head('IMPOSTAZIONI', 'SI SALVANO IN QUESTO BROWSER', true) +
      '<div class="lbl" style="color:var(--dim)">QUALITÀ GRAFICA</div><div class="seg">' + ['alta', 'media', 'bassa'].map(q => '<button type="button" data-q="' + q + '" class="' + (save.quality === q ? 'on' : '') + '">' + QUAL[q].label + '</button>').join('') + '</div>' +
      '<div class="lbl" style="color:var(--dim)">SENSIBILITÀ DELLO SGUARDO</div><div class="seg">' + [['bassa', 'Bassa'], ['media', 'Media'], ['alta', 'Alta']].map(s => '<button type="button" data-sens="' + s[0] + '" class="' + ((save.sens || 'media') === s[0] ? 'on' : '') + '">' + s[1] + '</button>').join('') + '</div>' +
      '<div class="lbl" style="color:var(--dim)">AUDIO</div><div class="seg"><button type="button" data-au="1" class="' + (save.muted ? '' : 'on') + '">Sì</button><button type="button" data-au="0" class="' + (save.muted ? 'on' : '') + '">No</button></div>' +
      '<div class="lbl" style="color:var(--dim)">COMANDI</div><div class="keys">' + keys.map(k => '<kbd>' + k[0] + '</kbd><span>' + k[1] + '</span>').join('') + '</div>' +
      '<div class="actions">' + (inRun ? '<button class="ghost" type="button" data-quit>Abbandona la corsa</button>' : '') + '<button class="cta" type="button" data-close>Riprendi</button></div>', 560), {
      closable: true, focus: '.cta',
      click(t) {
        if (t.dataset.q) { autoQ = true; applyQuality(t.dataset.q); modal.querySelectorAll('[data-q]').forEach(b => b.classList.toggle('on', b === t)); sfx('tick'); return; }
        if (t.dataset.sens) { save.sens = t.dataset.sens; persist(); modal.querySelectorAll('[data-sens]').forEach(b => b.classList.toggle('on', b === t)); sfx('tick'); return; }
        if (t.dataset.au) { setMuted(t.dataset.au === '0'); audioInit(); modal.querySelectorAll('[data-au]').forEach(b => b.classList.toggle('on', b === t)); sfx('tick'); return; }
        if (t.hasAttribute('data-quit')) {
          const kept = Math.floor(run.coins / 2); save.bank += kept; save.runs++; save.startWeapon = null; persist();
          closeModal(true); transition(() => { startHub(false); toast('Corsa abbandonata: tieni ' + kept + ' monete', '#e9b45c'); });
        }
      }
    });
  }

  /* ---------- titolo ---------- */
  function showTitle() {
    document.body.classList.add('intitle'); show(titleEl, true);
    const f = save.bank || save.cleared ? 'IN BANCA ' + save.bank + ' MONETE · ' + save.cleared + ' VAGONI RIPULITI' + (save.wins ? ' · TRENO FERMATO ' + save.wins + (save.wins > 1 ? ' VOLTE' : ' VOLTA') : save.best ? ' · RECORD: VAGONE ' + save.best : '') : (isTouch ? 'JOYSTICK A SINISTRA · TRASCINA A DESTRA PER GUARDARE' : 'WASD MUOVI · MOUSE GUARDA · CLIC ATTACCA · SPAZIO SALTA');
    setText(E('tfoot'), f);
    setTimeout(() => E('bStart').focus({ preventScroll: true }), 50);
  }
  function startGame() {
    if (STATE !== 'title') return;
    audioInit(); STATE = 'starting'; sfx('open'); lock();
    show(titleEl, false); document.body.classList.remove('intitle');
    transition(() => startHub(true));
  }

  /* ---------- ogni fotogramma ---------- */
  let wFor = null;
  function blocking() { return !modal.hidden || dlg.active || !titleEl.hidden || fadeOn; }
  function frame(dt) {
    if (dlg.active && dlg.shown < dlg.line.length) { dlg.shown = Math.min(dlg.line.length, dlg.shown + dt * 62); setText(dText, dlg.line.slice(0, Math.floor(dlg.shown))); }
    const it = STATE === 'play' && p && !p.dead && !blocking() ? nearInter() : null;
    show(promptEl, !!it);
    if (it) {
      const w = it.pickRef && it.pickRef.weapon, key = w ? w.name + w.dmg + w.cd + '|' + p.weapon.name + p.weapon.dmg : 'd' + it.label + (it.desc || '');
      setText(pTitle, it.label); setText(pKey, isTouch ? 'USA' : 'E');
      if (wFor !== key) { wFor = key; pDesc.innerHTML = w ? weaponMini(w, p.weapon) : esc(it.desc || ''); pTitle.style.color = w ? RAR[w.rar].c : ''; promptEl.style.borderTop = w ? '2px solid ' + RAR[w.rar].c : ''; }
    } else wFor = null;
    tbUse.classList.toggle('hot', !!it);
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.t += dt;
      if (f.t >= f.life) { f.d.remove(); floats.splice(i, 1); continue; }
      const s = project(f.x + f.ox, f.y + f.t * 1.2, f.z), k = f.t / f.life;
      f.d.style.left = s.x.toFixed(1) + 'px'; f.d.style.top = s.y.toFixed(1) + 'px'; f.d.style.opacity = s.ok ? (1 - k * k * k).toFixed(2) : 0;
      f.d.style.transform = 'translate(-50%,-50%) scale(' + (f.t < .1 ? 1 + (1 - f.t / .1) * .45 : 1).toFixed(2) + ')';
    }
    for (const e of enemies) if (!e.dead && e.hpEl) placeHp(e);
    const boss = STATE === 'play' && enemies.find(e => !e.dead && MOBS[e.type].elite && !e.minion);
    show(bossEl, !!boss); document.body.classList.toggle('bossfight', !!boss);
    if (boss) { setText(bossName, MOBS[boss.type].name.toUpperCase() + (boss.lvl > 1 ? ' · LV ' + boss.lvl : '')); bossHp.style.width = Math.max(0, boss.hp / boss.max * 100).toFixed(1) + '%'; }
    coins(); objective();
    const playing = STATE === 'play' && p && !p.dead && level, free = playing && modal.hidden && titleEl.hidden && !fadeOn;
    show(xh, free);
    if (free) { const t = WT[p.weapon.type], m = t.kind === 'melee'; xh.classList.toggle('on', !!aimTarget(m ? t.reach + .7 : 22, m ? .35 : 0).e); }
    show(lockHint, free && !dlg.active && !isTouch && !LOOK.locked && !LOOK.fallback);
    const et = free ? edgeTurn() : 0; edgeL.style.opacity = Math.max(0, et).toFixed(2); edgeR.style.opacity = Math.max(0, -et).toFixed(2);
    document.body.classList.toggle('aiming', free && LOOK.fallback && !isTouch);
  }
  function canLook() { return STATE === 'play' && p && !p.dead && modal.hidden && titleEl.hidden && !fadeOn; }

  /* ---------- puntatore bloccato (Pointer Lock) ---------- */
  // se il browser o la pagina non lo permettono, si passa al mouse libero: si guarda muovendolo e ai bordi ci si gira
  function lock() {
    if (isTouch || LOOK.locked || !canvas.requestPointerLock) return;
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => lockFail()); } catch (er) { lockFail(); }
  }
  function unlock() { if (document.pointerLockElement) { LOOK.release = true; try { document.exitPointerLock(); } catch (er) { } } }
  function lockFail() {
    if (LOOK.locked || LOOK.lockOk || LOOK.fallback) return;
    LOOK.fallback = true; toast('Mouse libero: muovilo per guardarti intorno, vicino ai bordi dello schermo ti giri', '#62d4c7');
  }
  let retryT = 0;
  function lockRetry() { const n = performance.now(); if (n - retryT > 4000) { retryT = n; lock(); } }

  /* ---------- comandi ---------- */
  function init() {
    const ADV = ['Enter', 'NumpadEnter', 'Space', 'KeyE', 'KeyF', 'KeyJ', 'KeyZ'];
    addEventListener('keydown', e => {
      const code = e.code, act = KEYMAP[code];
      // l'Esc che ha appena sbloccato il mouse ha già messo in pausa: non deve anche chiudere la pausa
      if (code === 'Escape' && performance.now() - LOOK.unlockT < 300) { e.preventDefault(); return; }
      if (!titleEl.hidden) {
        if (code === 'Escape') { e.preventDefault(); if (modal.hidden) settings(); else if (M && M.closable) closeModal(); return; }
        if (!modal.hidden) { modalKey(e); return; }
        if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') { e.preventDefault(); if (!e.repeat) startGame(); }
        return;
      }
      if (!modal.hidden) { modalKey(e); return; }
      if (dlg.active) { if (ADV.includes(code) || code === 'Escape') { e.preventDefault(); if (!e.repeat) advance(code === 'Escape'); } return; }
      if (!act) return;
      if (code.startsWith('Arrow') || code === 'Space') e.preventDefault();
      if (e.repeat) return;
      if (fadeOn || STATE !== 'play') return;
      if (act === 'back') { settings(); return; }
      if (act === 'bestiary') { bestiary(); return; }
      if (act === 'mute') { setMuted(!save.muted); return; }
      press(act === 'confirm' ? 'interact' : act, true);
    });
    addEventListener('keyup', e => { const act = KEYMAP[e.code]; if (act) press(act === 'confirm' ? 'interact' : act, false); });
    // mouse: sguardo, attacco (sinistro), parry (destro). mousedown e non pointerdown: con due tasti premuti insieme arrivano entrambi
    const sens = () => SENS[save.sens] || 1;
    addEventListener('mousemove', e => {
      mouse.nx = e.clientX / innerWidth * 2 - 1; mouse.ny = -(e.clientY / innerHeight) * 2 + 1; mouse.t = performance.now(); mouse.in = true;
      if (isTouch || !canLook() || !(LOOK.locked || LOOK.fallback)) return;
      // appena catturato il mouse alcuni browser mandano un salto enorme: si scarta
      const mx = e.movementX || 0, my = e.movementY || 0;
      if (performance.now() - LOOK.lockT < 120 || Math.abs(mx) > 260 || Math.abs(my) > 260) return;
      lookBy(mx, my, .0022 * sens());
    });
    document.addEventListener('mouseout', e => { if (!e.relatedTarget) mouse.in = false; });
    canvas.addEventListener('mousedown', e => {
      audioInit(); try { canvas.focus({ preventScroll: true }); } catch (er) { }
      if (STATE !== 'play' || !modal.hidden || !titleEl.hidden || fadeOn || isTouch) return;
      if (dlg.active) { if (e.button === 0) advance(); lock(); return; }
      if (!LOOK.locked && !LOOK.fallback) { lock(); return; } // il primo clic cattura il mouse e non attacca
      if (LOOK.fallback) lockRetry();
      if (e.button === 0) press('attack', true); else if (e.button === 2) press('parry', true);
    });
    addEventListener('mouseup', e => { if (e.button === 0) press('attack', false); else if (e.button === 2) press('parry', false); });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      const on = document.pointerLockElement === canvas; LOOK.locked = on;
      if (on) { LOOK.lockOk = true; LOOK.fallback = false; LOOK.lockT = performance.now(); return; }
      LOOK.unlockT = performance.now(); releaseAll();
      if (LOOK.release) { LOOK.release = false; return; }
      // Esc durante il gioco: pausa sulle impostazioni
      if (STATE === 'play' && modal.hidden && titleEl.hidden && !dlg.active) settings();
    });
    document.addEventListener('pointerlockerror', lockFail);
    // touch: trascinare fuori dal joystick (o partendo da un tasto) gira lo sguardo
    const lzone = E('lzone'), look = { id: null, x: 0, y: 0 };
    const lookDrag = (dx, dy) => { if (canLook()) lookBy(dx, dy, .0058 * sens()); };
    lzone.addEventListener('pointerdown', e => {
      e.preventDefault(); enableTouch(); audioInit();
      if (dlg.active) { advance(); return; }
      if (look.id !== null) return;
      look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; try { lzone.setPointerCapture(e.pointerId); } catch (er) { }
    });
    lzone.addEventListener('pointermove', e => { if (e.pointerId !== look.id) return; const dx = e.clientX - look.x, dy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY; lookDrag(dx, dy); });
    const endLook = e => { if (e.pointerId === look.id) look.id = null; };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => lzone.addEventListener(n, endLook));
    // touch: joystick mobile nella metà sinistra
    const tzone = E('tzone'), jbase = E('jbase'), jknob = E('jknob'), R = 46;
    tzone.addEventListener('pointerdown', e => {
      if (joy.id !== null) return; e.preventDefault(); enableTouch(); audioInit();
      if (dlg.active) { advance(); return; }
      joy.id = e.pointerId; try { tzone.setPointerCapture(e.pointerId); } catch (er) { }
      const r = tzone.getBoundingClientRect(); joy.ox = e.clientX; joy.oy = e.clientY;
      jbase.style.left = (e.clientX - r.left) + 'px'; jbase.style.top = (e.clientY - r.top) + 'px'; jbase.style.opacity = 1; jknob.style.transform = '';
    });
    tzone.addEventListener('pointermove', e => {
      if (e.pointerId !== joy.id) return;
      let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const l = Math.hypot(dx, dy);
      if (l > R * 1.6) { const k = (l - R * 1.6) / l; joy.ox += dx * k; joy.oy += dy * k; const r = tzone.getBoundingClientRect(); jbase.style.left = (joy.ox - r.left) + 'px'; jbase.style.top = (joy.oy - r.top) + 'px'; dx = e.clientX - joy.ox; dy = e.clientY - joy.oy; }
      const l2 = Math.hypot(dx, dy); if (l2 > R) { dx *= R / l2; dy *= R / l2; }
      joy.x = dx / R; joy.y = dy / R; if (Math.hypot(joy.x, joy.y) < .14) joy.x = joy.y = 0;
      jknob.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    });
    const endJoy = e => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; jbase.style.opacity = 0; };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => tzone.addEventListener(n, endJoy));
    for (const b of document.querySelectorAll('.tb')) {
      const a = b.dataset.a;
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); enableTouch(); audioInit(); try { b.setPointerCapture(e.pointerId); } catch (er) { }
        if (dlg.active) { advance(); return; }
        if (blocking()) return;
        press(a, true); b.classList.add('on'); b._d = { id: e.pointerId, x: e.clientX, y: e.clientY, go: false };
      });
      b.addEventListener('pointermove', e => {
        const d = b._d; if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (!d.go) { if (Math.hypot(dx, dy) < 12) return; d.go = true; }
        d.x = e.clientX; d.y = e.clientY; lookDrag(dx, dy);
      });
      const up = () => { press(a, false); b.classList.remove('on'); b._d = null; };
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => b.addEventListener(n, up));
      b.addEventListener('contextmenu', e => e.preventDefault());
    }
    dialogEl.addEventListener('click', () => advance());
    promptEl.addEventListener('click', () => { const it = STATE === 'play' && !blocking() ? nearInter() : null; if (it) it.fn(); });
    E('bAudio').addEventListener('click', () => { audioInit(); setMuted(!save.muted); });
    E('bSet').addEventListener('click', () => { if (modal.hidden) settings(); });
    E('bStart').addEventListener('click', startGame);
    setMuted(save.muted);
  }

  return { init, clearDialog, zone, objective, coins, map, player, dialog, classSelect, bestiary, wardrobe, slot, shop, end, settings, toast, banner, dmg, hpBar, placeHp, fade, blocking, frame, showTitle, startGame, closeModal, hit, hurtFrom, lock };
})();
