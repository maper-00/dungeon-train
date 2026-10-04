# Dungeon Train 3D (v2)

Versione 3D con vista dall'alto, nello stile del video caricato (luci calde, pavimento bagnato, pioggia, foglie, pannelli in vetro).

- Pagina pubblicata: https://claude.ai/artifact/4JKyMsGPhAf4i1qR3PVdNS (versione 1790946802-32dc)
- `dungeon-train-3d.html`: la pagina esattamente come pubblicata (three.js 0.147 da jsdelivr).
- `src/`: sorgenti. `python3 build.py dungeon-train-3d.html` ricostruisce la pagina; con `local` come secondo argomento crea una versione di prova che usa una copia locale di three.js in `../three/package/` ed espone `window.DBG`.
- Ordine dei file: head.html, poi js/core.js, render.js, models.js, levels.js, game.js, ui.js, main.js.
- Salvataggio condiviso con la v1 pixel art (chiave localStorage `dungeon-train-save-v1`).
- La v1 pixel art resta in `../v1-pixel-base/` e non va sovrascritta.
