# Dungeon Train in prima persona (v3)

La stessa partita della 3D dall'alto (v2), vista con gli occhi del personaggio: cabina letto, scelta della classe, Vagone 1 con le tre ondate, il Bigliettaio Spettrale e il forziere.

- Pagina pubblicata: https://claude.ai/artifact/SuMEqPePmXT2YwKD6JkWJd (versione 1790960889-cfe3)
- `dungeon-train-fps.html`: la pagina esattamente come pubblicata (three.js 0.147 da jsdelivr).
- `src/`: sorgenti. `python3 build.py dungeon-train-fps.html` ricostruisce la pagina; con `local` come secondo argomento crea una versione di prova che usa una copia locale di three.js in `../three/package/` ed espone `window.DBG`.
- Ordine dei file: head.html, poi js/core.js, render.js, models.js, levels.js, game.js, view.js, ui.js, main.js. `view.js` è nuovo: sguardo, telecamera, braccia e arma in primo piano, mira.

## Comandi

- Computer: WASD per muoversi, mouse per guardare (il primo clic sulla scena cattura il mouse), clic sinistro attacca, destro o Q parry, Spazio salta (doppio salto), Shift scivola, E interagisce, frecce sinistra e destra per girarsi, Esc pausa.
- Telefono: joystick a sinistra, trascinare in qualsiasi altro punto per guardarsi intorno (anche partendo da un tasto), tasti Attacca, Parry, Usa, Salta, Scivola.

## Scelte fatte

- Se il browser non permette di catturare il mouse si passa al "mouse libero": muoverlo gira lo sguardo e vicino ai bordi dello schermo ci si continua a girare. Riprova a catturarlo al massimo ogni 4 secondi.
- La scivolata abbassa il personaggio: passa sotto frecce e biglietti del Bigliettaio.
- Armi e braccia sono modelli a parte attaccati alla telecamera, con pose in spazio telecamera; la mano resta nello stesso punto dello schermo su ogni formato. Il fendente lascia una scia luminosa al posto dell'arco largo della vista dall'alto.
- Le stanze della v2 erano aperte verso la telecamera dall'alto: qui hanno soffitti, pareti complete e squarci nel tetto del vagone da cui entra la pioggia.
- Sul telefono in orizzontale braccio e arma sono un po' più piccoli e più bassi, per non coprire la scena dietro i tasti.

La v1 pixel art (`../v1-pixel-base/`) e la v2 3D dall'alto (`../v2-3d/`) restano come sono.
