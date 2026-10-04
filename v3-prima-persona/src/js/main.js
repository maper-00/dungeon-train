/* ================= ciclo principale ================= */
let last = 0, lastClock = -1, autoQ = false, perfT = 0, perfN = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const raw = Math.max(0, (now - last) / 1000); last = now;
  const dt = Math.min(.05, raw);
  T += dt;
  let ran = true;
  if (STATE === 'play' && p && level && !UI.blocking()) {
    if (hitstop > 0) { hitstop -= dt; ran = false; } else updateGame(dt);
    // se il dispositivo arranca, abbassa la qualità una volta per sessione
    if (!autoQ) {
      perfT += Math.min(raw, .25); perfN++;
      if (perfT > 4) {
        if (perfN / perfT < 28 && save.quality !== 'bassa') { applyQuality(save.quality === 'alta' ? 'media' : 'bassa'); UI.toast('Qualità grafica ridotta per un gioco più fluido', '#9ba4a6'); if (save.quality === 'bassa') autoQ = true; }
        else autoQ = true;
        perfT = 0; perfN = 0;
      }
    }
  }
  updateLevelFx(dt);
  Rain.update(dt); Wind.update(dt); Sparks.update(dt); Chunks.update(dt); Dust.update(dt); Puffs.update(dt); Storm.update(dt); updateFX(dt);
  // mouse libero (senza Pointer Lock): vicino ai bordi lo sguardo continua a girare
  if (STATE === 'play' && !UI.blocking()) LOOK.yaw += edgeTurn() * 2.4 * dt;
  updateFPCamera(dt); updateViewModel(dt);
  UI.frame(dt);
  clockMin += dt / 1.5; const cm = Math.floor(clockMin) % 1440;
  if (cm !== lastClock) { lastClock = cm; $('#clock').textContent = String(Math.floor(cm / 60)).padStart(2, '0') + ':' + String(cm % 60).padStart(2, '0'); }
  clackT -= dt; if (clackT <= 0) { clackT = 1.05; clack(); }
  if (!Q.dyn && level && level.shadowDirty > 0) { renderer.shadowMap.needsUpdate = true; level.shadowDirty--; }
  grade.uniforms.time.value = T; grade.uniforms.flash.value = Math.max(0, grade.uniforms.flash.value - dt * 2.2);
  composer.render(dt);
  if (ran) for (const k in pressed) pressed[k] = false;
}

/* ================= avvio ================= */
function boot() {
  try {
    buildTextures(); buildMaterials(); buildModelMaterials(); buildEnvironment();
    Rain.init(); Wind.init(); Sparks.init(); Chunks.init(); Dust.init(); Puffs.init(); Storm.init();
    updateView(); resize();
    UI.init();
    setLevel(buildHub());
    pet = makePet(7.4, 2.4);
    camTarget.set(9.4, 0, .3);
    warmUp();
    UI.showTitle();
    document.addEventListener('visibilitychange', () => { if (!AU.ctx) return; if (document.hidden) AU.ctx.suspend(); else if (STATE !== 'title') AU.ctx.resume(); });
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); showFail(); });
    requestAnimationFrame(t => { last = t; loop(t); });
  } catch (err) { showFail(err); }
}
const fontsReady = document.fonts && document.fonts.load
  ? Promise.race([Promise.all([document.fonts.load('600 34px Manrope'), document.fonts.load('500 15px "JetBrains Mono"'), document.fonts.load('300 20px Manrope')]), new Promise(r => setTimeout(r, 1800))])
  : Promise.resolve();
fontsReady.catch(() => { }).then(boot);
