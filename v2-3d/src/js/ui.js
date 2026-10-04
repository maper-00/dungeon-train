/* ================= interfaccia ================= */
const UI = (() => {
  const E = id => document.getElementById(id);
  const modal = E('modal'), titleEl = E('title'), dialogEl = E('dialog'), dText = E('dText'), dWho = E('dWho'), more = dialogEl.querySelector('.more');
  const promptEl = E('prompt'), pTitle = E('pTitle'), pDesc = E('pDesc'), pKey = E('pKey'), tbUse = E('tbUse');
  const floatersEl = E('floaters'), toastsEl = E('toasts'), bannerEl = E('banner'), fadeEl = E('fade');
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
    setText(E('zoneWx'), L.kind === 'wagon' ? 'TETTO APERTO' : 'PIOGGIA SUI VETRI');
    map(); objective(); coins();
  }
  function objText() {
    if (!level) return '';
    if (level.kind === 'hub') return save.cls ? level.obj : 'Scegli la tua classe';
    if (!run) return level.obj;
    if (run.cleared) return 'Carrozza libera: apri la porta del Vagone 2';
    if (run.wave < 0) return 'Avanza nella carrozza';
    if (!run.active) return 'Arriva un\'altra ondata…';
    return 'Ondata ' + (run.wave + 1) + ' di ' + Wv.length + ' · nemici rimasti: ' + (enemies.filter(e => !e.dead).length + run.queue.length);
  }
  function objective() { setText(E('objSub'), objText()); }
  function coins() {
    const inRun = run && level && level.kind === 'wagon';
    setText(E('coins'), inRun ? run.coins : save.bank);
    setText(E('orbs'), inRun ? run.kills : save.cleared);
    setText(E('orbsL'), inRun ? 'Nemici' : 'Vagoni');
  }
  function map() {
    const inW = level && level.kind === 'wagon', cl = run && run.cleared;
    let h = '<div class="w home' + (inW ? ' done' : ' cur') + '"></div>';
    for (let i = 1; i <= 3; i++) {
      const c = i === 1 ? (inW ? (cl ? ' done' : ' cur') : (save.cleared > 0 ? ' done' : '')) : '';
      h += '<div class="link"></div><div class="w' + c + '"></div>';
    }
    E('map').innerHTML = h + '<span class="more">…</span>';
    setText(E('mapTxt'), inW ? 'Vagone 1 di 20' : 'Cabina · 20 vagoni davanti');
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
    return '<b style="color:' + RAR[w.rar].c + '">' + esc(w.name) + '</b><div class="meta">' + RAR[w.rar].n.toUpperCase() + ' · LV ' + w.lvl + ' · ' + WT[w.type].n.toUpperCase() + '</div>' +
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
  const HPH = { ratto: 1.05, scheletro: 2.35, arciere: 2.35, bigliettaio: 3.0 };
  function placeHp(e) {
    const el = e.hpEl, want = e.type === 'bigliettaio' ? e.fadeIn <= 0 : e.hp < e.max;
    if (!want || e.falling) { show(el, false); return; }
    const s = project(e.x, e.y + HPH[e.type], e.z);
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
    modal.innerHTML = html; show(modal, true); M = opt || {}; releaseAll();
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
    if (e.target === modal) { if (M.closable) { sfx('tick'); closeModal(); } return; }
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-close')) { if (M.closable !== false || t.classList.contains('cta')) { sfx('tick'); closeModal(); } return; }
    if (M.click) M.click(t, e);
  });
  modal.addEventListener('focusin', e => { const t = e.target.closest('[data-nav]'); if (t && M && M.nav) M.nav(+t.dataset.i, t); });
  function modalKey(e) {
    if (e.code === 'Escape') { e.preventDefault(); if (M && M.closable) { sfx('tick'); closeModal(); } return; }
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
  const MOB_ORDER = ['ratto', 'scheletro', 'arciere', 'bigliettaio'];
  function bestiary() {
    let sel = 0; const known = MOB_ORDER.filter(t => save.kills[t]).length;
    const list = MOB_ORDER.map((t, i) => { const n = save.kills[t] || 0; return '<button class="opt' + (i === sel ? ' on' : '') + '" type="button" data-nav data-i="' + i + '">' + (n ? MOBS[t].name : '???') + '<span>' + (n ? '×' + n : '') + '</span></button>'; }).join('');
    openModal(panel(head('BESTIARIO', known + ' / ' + MOB_ORDER.length + ' CREATURE · SCONFIGGILE PER SCOPRIRE I PUNTI DEBOLI', true) + '<div class="best"><div class="blist">' + list + '</div><div class="bdet" id="bdet"></div></div>'), {
      closable: true,
      nav(i) {
        sel = i; modal.querySelectorAll('.opt').forEach((c, k) => c.classList.toggle('on', k === i));
        const t = MOB_ORDER[i], d = MOBS[t], n = save.kills[t] || 0, img = '<img src="' + mobPortrait(t) + '" alt="" class="' + (n ? '' : 'unknown') + '">';
        E('bdet').innerHTML = n
          ? img + '<div><h3>' + d.name + '</h3><div class="lbl" style="color:var(--amber)">SCONFITTI · ' + n + (d.elite ? ' · MINI BOSS' : '') + '</div><div class="lbl" style="color:#ff9a5a">PUNTO DEBOLE</div><p>' + d.weak + '</p><div class="lbl" style="color:var(--teal)">STORIA</div><p>' + d.lore + '</p></div>'
          : img + '<div><h3>???</h3><div class="lbl" style="color:var(--dim)">NON ANCORA INCONTRATO</div><p>Sconfiggi questa creatura per sbloccarne la scheda, i punti deboli e la storia. Si aggira nel Vagone 1.</p></div>';
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
      click(t) { if (t.dataset.i !== undefined) { this.nav(+t.dataset.i); sfx('tick'); } }
    });
  }

  /* slot machine */
  const ICON = {
    spada: '<g transform="rotate(45 32 32)" stroke="#2a2018" stroke-width="2"><rect x="29" y="5" width="6" height="35" fill="#cfd6de"/><rect x="20" y="40" width="24" height="5" fill="#c8963c"/><rect x="29.5" y="45" width="5" height="10" fill="#5a3a26"/><rect x="28" y="55" width="8" height="5" fill="#c8963c"/></g>',
    ascia: '<g transform="rotate(28 32 32)" stroke="#2a2018" stroke-width="2"><rect x="29.5" y="6" width="5" height="52" fill="#6b4428"/><path d="M34.5 9 L52 4 L54 27 L34.5 22 Z" fill="#cfd6de"/><rect x="27" y="8" width="10" height="14" fill="#4a5058"/></g>',
    pugnale: '<g transform="rotate(45 32 32)" stroke="#2a2018" stroke-width="2"><path d="M29 14 L32 8 L35 14 L35 38 L29 38 Z" fill="#cfd6de"/><rect x="22" y="38" width="20" height="4" fill="#c8963c"/><rect x="29.5" y="42" width="5" height="11" fill="#5a3a26"/></g>',
    arco: '<g stroke="#2a2018" stroke-width="2" fill="none"><path d="M22 7 Q50 32 22 57" stroke="#6b4428" stroke-width="5"/><path d="M22 7 L22 57" stroke-width="1.5"/><path d="M12 32 L52 32"/><path d="M53 32 L45 27 L45 37 Z" fill="#cfd6de"/><path d="M12 32 L8 28 M12 32 L8 36" stroke="#8e2630" stroke-width="2.5"/></g>',
    bastone: '<g transform="rotate(30 32 32)" stroke="#2a2018" stroke-width="2"><rect x="29.5" y="20" width="5" height="40" fill="#5a3a26"/><rect x="26.5" y="15" width="11" height="5" fill="#c8963c"/><rect x="25.5" y="2" width="13" height="13" fill="#c98bff" transform="rotate(45 32 8.5)"/></g>'
  };
  const icon = t => '<svg viewBox="0 0 64 64" aria-label="' + WT[t].n + '">' + ICON[t] + '</svg>';
  const TYPES = Object.keys(WT);
  function slot() {
    const cost = 25; let res = null;
    const bankTxt = () => 'IN BANCA: ' + save.bank + ' MONETE';
    const hint = '<div class="meta">Tre simboli uguali: arma di livello 3. Due uguali: livello 2.<br>L\'arma vale per la prossima corsa.</div>';
    openModal(panel(head('SLOT MACHINE', cost + ' MONETE · UN\'ARMA A CASO', true) +
      '<div class="reels">' + [0, 1, 2].map(i => '<div class="reel" id="r' + i + '">' + icon(TYPES[(i * 2) % 5]) + '</div>').join('') + '</div>' +
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

  /* fine corsa */
  function end(win, got) {
    STATE = 'end'; releaseAll(); clearDialog();
    const q = win ? '«Il Vagone 2 è chiuso per lavori. Torna in cabina e riposa: il treno, intanto, continua a girare.»' : '«Capita. Il treno ti riporta sempre in cabina. Metà delle monete restano a te.»';
    openModal(panel(head(win ? 'CARROZZA LIBERA' : 'SEI CADUTO', 'VAGONE 1 · CARROZZA PASSEGGERI', false) +
      '<div class="stats"><span>' + (win ? 'Monete guadagnate' : 'Monete tenute (metà)') + '</span><b>' + got + '</b><span>Nemici sconfitti</span><b>' + (run ? run.kills : 0) + '</b><span>Tempo</span><b>' + mmss(run ? run.t : 0) + '</b><span>Monete in banca</span><b>' + save.bank + '</b></div>' +
      '<p class="quote">' + q + '</p><div class="actions"><button class="cta" type="button" data-home>Torna alla cabina</button></div>', 520), {
      closable: false, focus: '[data-home]',
      click(t) { if (t.hasAttribute('data-home')) { closeModal(true); transition(() => startHub(false)); } }
    });
  }

  /* impostazioni */
  function settings() {
    const inRun = STATE === 'play' && run && level && level.kind === 'wagon' && p && !p.dead;
    const keys = isTouch
      ? [['Joystick', 'Tocca e trascina nella metà sinistra'], ['ATTACCA', 'Colpisce il nemico più vicino'], ['PARRY', 'Al momento giusto respinge colpi e frecce'], ['SALTA', 'Due volte per il doppio salto, anche sui sedili'], ['SCIVOLA', 'Scatto rasoterra, poi salta per lo slancio'], ['USA', 'Ribalta tavoli, raccoglie armi, apre porte']]
      : [['WASD', 'Muoviti (anche frecce)'], ['Mouse', 'Mira'], ['Clic / J', 'Attacca'], ['Destro / K', 'Parry: respinge colpi e frecce'], ['Spazio', 'Salta, due volte per il doppio salto'], ['Shift', 'Scivolata, poi salta per lo slancio'], ['E', 'Ribalta tavoli, raccogli armi, apri porte'], ['B', 'Bestiario'], ['M', 'Audio sì / no']];
    openModal(panel(head('IMPOSTAZIONI', 'SI SALVANO IN QUESTO BROWSER', true) +
      '<div class="lbl" style="color:var(--dim)">QUALITÀ GRAFICA</div><div class="seg">' + ['alta', 'media', 'bassa'].map(q => '<button type="button" data-q="' + q + '" class="' + (save.quality === q ? 'on' : '') + '">' + QUAL[q].label + '</button>').join('') + '</div>' +
      '<div class="lbl" style="color:var(--dim)">AUDIO</div><div class="seg"><button type="button" data-au="1" class="' + (save.muted ? '' : 'on') + '">Sì</button><button type="button" data-au="0" class="' + (save.muted ? 'on' : '') + '">No</button></div>' +
      '<div class="lbl" style="color:var(--dim)">COMANDI</div><div class="keys">' + keys.map(k => '<kbd>' + k[0] + '</kbd><span>' + k[1] + '</span>').join('') + '</div>' +
      '<div class="actions">' + (inRun ? '<button class="ghost" type="button" data-quit>Abbandona la corsa</button>' : '') + '<button class="cta" type="button" data-close>Riprendi</button></div>', 560), {
      closable: true, focus: '.cta',
      click(t) {
        if (t.dataset.q) { autoQ = true; applyQuality(t.dataset.q); modal.querySelectorAll('[data-q]').forEach(b => b.classList.toggle('on', b === t)); sfx('tick'); return; }
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
    const f = save.bank || save.cleared ? 'IN BANCA ' + save.bank + ' MONETE · ' + save.cleared + ' VAGONI RIPULITI' : (isTouch ? 'JOYSTICK A SINISTRA · TASTI A DESTRA' : 'WASD MUOVI · CLIC ATTACCA · SPAZIO SALTA · SHIFT SCIVOLA');
    setText(E('tfoot'), f);
    setTimeout(() => E('bStart').focus({ preventScroll: true }), 50);
  }
  function startGame() {
    if (STATE !== 'title') return;
    audioInit(); STATE = 'starting'; sfx('open');
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
    coins(); objective();
  }

  /* ---------- comandi ---------- */
  function init() {
    const ADV = ['Enter', 'NumpadEnter', 'Space', 'KeyE', 'KeyF', 'KeyJ', 'KeyZ'];
    addEventListener('keydown', e => {
      const code = e.code, act = KEYMAP[code];
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
    // mouse: mira, attacco (sinistro), parry (destro)
    const setMouse = e => { mouse.nx = e.clientX / innerWidth * 2 - 1; mouse.ny = -(e.clientY / innerHeight) * 2 + 1; mouse.t = performance.now(); };
    canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') setMouse(e); });
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      setMouse(e); audioInit(); try { canvas.focus({ preventScroll: true }); } catch (er) { }
      if (blocking()) return;
      if (e.button === 0) press('attack', true); else if (e.button === 2) press('parry', true);
    });
    addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') return; if (e.button === 0) press('attack', false); else if (e.button === 2) press('parry', false); });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
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
        press(a, true); b.classList.add('on');
      });
      const up = () => { press(a, false); b.classList.remove('on'); };
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

  return { init, clearDialog, zone, objective, coins, map, player, dialog, classSelect, bestiary, wardrobe, slot, end, settings, toast, banner, dmg, hpBar, placeHp, fade, blocking, frame, showTitle, startGame, closeModal };
})();
