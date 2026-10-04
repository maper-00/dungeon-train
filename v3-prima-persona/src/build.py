import sys, re
# uso: python3 build.py out.html [local]
out = sys.argv[1]; local = len(sys.argv) > 2 and sys.argv[2] == 'local'
base = '../three/package/' if local else 'https://cdn.jsdelivr.net/npm/three@0.147.0/'
libs = ['build/three.min.js', 'examples/js/shaders/CopyShader.js', 'examples/js/shaders/LuminosityHighPassShader.js',
        'examples/js/postprocessing/EffectComposer.js', 'examples/js/postprocessing/RenderPass.js', 'examples/js/postprocessing/ShaderPass.js',
        'examples/js/postprocessing/UnrealBloomPass.js', 'examples/js/utils/BufferGeometryUtils.js']
order = ['core', 'render', 'shapes', 'models', 'mobs', 'props', 'levels', 'wagons', 'game', 'view', 'ui', 'main']
head = open('head.html').read()
code = '\n'.join(open('js/%s.js' % n).read() for n in order)
if local: code += '\nwindow.DBG = { get p() { return p; }, get level() { return level; }, get run() { return run; }, get enemies() { return enemies; }, get picks() { return picks; }, get STATE() { return STATE; }, get pet() { return pet; }, interact, startRun, enterWagon, CLASSES, applyClass, starterWeapon, genWeapon, openShop, WAGONS, MOBS, WT, get merchant() { return merchant; }, get hazards() { return hazards; }, get rings() { return rings; }, Storm, Puffs, killEnemy, startHub, transition, UI, save, renderer, camera, scene, hitEnemy, hurtPlayer, spawnEnemy, applyQuality, LOOK, VM, aimTarget, lookBy, edgeTurn, mouse, nearInter, held, pressed, press, Q: () => Q, get projs() { return projs; }, FX, freeze: v => { hitstop = v; }, draw: () => { updateFPCamera(.016); updateViewModel(.016); UI.frame(.016); renderer.shadowMap.needsUpdate = true; composer.render(.016); }, tick: (n, dt = .033) => { for (let i = 0; i < n; i++) { hitstop = 0; T += dt; if (STATE === "play" && !UI.blocking()) updateGame(dt); updateLevelFx(dt); updateFX(dt); Sparks.update(dt); Chunks.update(dt); Puffs.update(dt); Storm.update(dt); for (const k in pressed) pressed[k] = false; } }, Rain, Wind, Sparks, Dust, Chunks, bloom, grade, composer, moon, ev: s => eval(s) };'
fail = '''function showFail(err) {
  if (err) console.error(err);
  if (document.querySelector('.fail')) return;
  const d = document.createElement('div'); d.className = 'fail';
  d.innerHTML = '<div><b>La grafica 3D non è partita.</b><br>Questo browser non riesce ad avviare WebGL. Prova con Chrome, Safari o Firefox aggiornati, oppure disattiva il risparmio energetico e ricarica la pagina.</div>';
  document.body.appendChild(d);
}'''
html = head + '\n' + '\n'.join('<script src="%s%s"></script>' % (base, l) for l in libs) + \
  '\n<script>\n(function () {\n"use strict";\n' + fail + '\ntry {\nif (!window.THREE || !THREE.EffectComposer || !THREE.UnrealBloomPass || !THREE.BufferGeometryUtils) throw new Error("three.js non caricato");\n' + code + '\n} catch (err) { showFail(err); }\n})();\n</script>\n'
if local: html = '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + html + '</body></html>'
open(out, 'w').write(html)
print(out, len(html), 'bytes')
