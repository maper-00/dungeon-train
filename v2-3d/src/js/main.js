/* ================= telecamera ================= */
// orizzontale: vista di tre quarti come nel video; verticale (telefono): il treno scorre dal basso verso l'alto
let VIEW = null;
function viewParams() {
  const asp = innerWidth / Math.max(1, innerHeight);
  if (asp < .82) { const fov = 38, t = Math.tan(fov * Math.PI / 360); return { portrait: true, yaw: -Math.PI / 2 + .16, pitch: 1.1, fov, dist: clamp(10.2 / (2 * asp * t), 20, 42) }; }
  const fov = 30, t = Math.tan(fov * Math.PI / 360); return { portrait: false, yaw: -.24, pitch: .98, fov, dist: clamp(22.5 / (2 * asp * t), 20, 34) };
}
function updateView() {
  VIEW = viewParams(); CAM.yaw = VIEW.yaw;
  camera.fov = VIEW.fov; camera.updateProjectionMatrix();
  scene.fog.density = .0105 * 24 / VIEW.dist;
}
addEventListener('resize', updateView);
const lead = { x: 0, z: 0 }, _tg = new THREE.Vector3();
function updateCamera(dt) {
  const v = VIEW; let yaw = v.yaw, pitch = v.pitch, dist = v.dist;
  if (STATE === 'title' || STATE === 'starting' || !p || !level) {
    _tg.set(9.4, 0, v.portrait ? 0 : .3); camTarget.lerp(_tg, Math.min(1, dt * 2));
    yaw += Math.sin(T * .13) * .2; dist *= .9; pitch -= .05;
  } else {
    lead.x += (clamp(p.vx * .32, -2.4, 2.4) - lead.x) * Math.min(1, dt * 2.2);
    lead.z += (clamp(p.vz * .18, -1, 1) - lead.z) * Math.min(1, dt * 2.2);
    let tx = p.x + lead.x + (v.portrait ? 2.2 : 0), tz = p.z * (v.portrait ? .5 : .4) + lead.z * (v.portrait ? 1 : .5);
    if (v.portrait) tx = clamp(tx, level.x0 + 2, level.x1 + 1); else tx = clamp(tx, level.x0 + Math.min(7, level.len / 2), level.x1 - Math.min(7, level.len / 2));
    const k = Math.min(1, dt * 5); camTarget.x += (tx - camTarget.x) * k; camTarget.z += (tz - camTarget.z) * k;
  }
  const s = shake * shake * .55; shake = Math.max(0, shake - dt * 2.4);
  const cp = Math.cos(pitch), ox = rnd(-s, s), oz = rnd(-s, s);
  camera.position.set(camTarget.x + Math.sin(yaw) * cp * dist + ox, Math.sin(pitch) * dist, camTarget.z + Math.cos(yaw) * cp * dist + oz);
  camera.lookAt(camTarget.x + ox, .6, camTarget.z + oz);
  camera.updateMatrixWorld();
  placeMoon(camTarget);
}

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
  Rain.update(dt); Wind.update(dt); Sparks.update(dt); Chunks.update(dt); Dust.update(dt); updateFX(dt);
  updateCamera(dt);
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
    Rain.init(); Wind.init(); Sparks.init(); Chunks.init(); Dust.init();
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
