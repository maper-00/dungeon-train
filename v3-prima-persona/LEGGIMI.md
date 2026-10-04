# Dungeon Train in prima persona (v3)

La partita vista con gli occhi del personaggio: cabina letto, scelta della classe, poi dieci vagoni a tema fino alla locomotiva, dove aspetta il Capotreno.

- Pagina pubblicata con i dieci vagoni (privata): https://claude.ai/artifact/3Ajbs8J5GbtVbjd6Asrjhz (versione 1791111139-1a28)
- La pagina condivisa https://claude.ai/artifact/SuMEqPePmXT2YwKD6JkWJd mostra ancora la versione precedente, con il solo Vagone 1.
- `dungeon-train-fps.html`: la pagina pronta da aprire (three.js 0.147 da jsdelivr).
- `src/`: sorgenti. `python3 build.py dungeon-train-fps.html` ricostruisce la pagina; con `local` come secondo argomento crea una versione di prova che usa una copia locale di three.js in `../three/package/` ed espone `window.DBG` (con `DBG.tick(n)` per far avanzare il gioco di n fotogrammi nei test automatici).
- Ordine dei file: head.html, poi js/core.js, render.js, models.js, mobs.js, levels.js, wagons.js, game.js, view.js, ui.js, main.js.
  - `models.js`: classi, armi (`WT`), creature (`MOBS`), modelli delle armi e del giocatore.
  - `mobs.js`: modelli, comportamento (`AI`) e pose (`POSER`) delle creature nuove.
  - `levels.js`: cabina letto e Vagone 1. `wagons.js`: tabella dei dieci vagoni (`WAGONS`: ondate, dialoghi, bottega) e costruzione dei vagoni 2-10.
  - `view.js`: sguardo, telecamera, braccia e arma in primo piano, mira.

## I dieci vagoni

| # | Vagone | Nemici nuovi | Note |
|---|---|---|---|
| 1 | Carrozza passeggeri | ratti, scheletri, arcieri | mini boss: Bigliettaio Spettrale |
| 2 | Carrozza ristorante | Cuoco Scheletrico (mannaie a parabola) | tavoli apparecchiati da ribaltare, lampadari |
| 3 | Bagagliaio | Baule Mimetico (finge di essere un baule) | lanterne che dondolano, bottega a fine vagone |
| 4 | Vagone letto | Passeggero Fantasma (svanisce e riappare di lato) | cuccette, tende, luci da notte |
| 5 | Serra panoramica | Ragno delle Serre (salta) | boss: Regina delle Serre, tetto di vetro, lucciole |
| 6 | Vagone del carbone | Fuochista Scheletrico (carbone che lascia fiamme a terra) | a cielo aperto, bracieri e braci, bottega |
| 7 | Vagone blindato | Guardia Corazzata (scudo frontale) | casseforti, lingotti, porta del caveau, sirene |
| 8 | Officina a vapore | Automa a Molla (carica, si stordisce contro gli ostacoli) | tubi, ingranaggi che girano, forgia, vapore |
| 9 | Salone di prima classe | tutti insieme | pianoforte, camino, ritorno del Bigliettaio, bottega |
| 10 | Locomotiva | scorta del capotreno | boss finale: il Capotreno (tre fasi, onde d'urto da saltare); poi si tira il freno d'emergenza |

Nei vagoni 3, 6 e 9, a vagone libero, arriva la bottega del robot: tè (+2 vita), ingranaggio di scorta (+1 vita massima) e due armi, pagati con le monete della corsa. Ogni forziere dà monete e un cuore.

## Armi

Tredici tipi: spada, sciabola (critici frequenti), ascia, pugnale, lancia (affondo lungo), martello (schianto ad area che stordisce), falce (taglio larghissimo), arco, balestra (dardi che trapassano), trombone (rosata di pallini), bastone (dardo magico), tomo (fulmine che rimbalza tra i nemici), lanterna (palla di fuoco che esplode). Ogni creatura ha i suoi punti deboli, scritti nel bestiario.

## Grafica

- Pareti con texture in coordinate del mondo (pannelli di legno, carta da parati damascata, lamiere rivettate, mattoni), pavimenti a scacchi, parquet, lamiera striata, passatoie.
- Temporale: lampi che illuminano la scena anche dai finestrini, fulmini all'orizzonte e tuono in ritardo; luna visibile dai tetti aperti.
- Atmosfera per vagone: nebbia, colore della polvere, lucciole, braci, vapore, fumo della locomotiva.
- Armi con lame sagomate e rune luminose per le rarità, mani con dita, leggera aberrazione cromatica ai bordi.

## Comandi

- Computer: WASD per muoversi, mouse per guardare (il primo clic sulla scena cattura il mouse), clic sinistro attacca, destro o Q parry, Spazio salta (doppio salto), Shift scivola, E interagisce, frecce sinistra e destra per girarsi, Esc pausa.
- Telefono: joystick a sinistra, trascinare in qualsiasi altro punto per guardarsi intorno (anche partendo da un tasto), tasti Attacca, Parry, Usa, Salta, Scivola.

## Scelte fatte

- Se il browser non permette di catturare il mouse si passa al "mouse libero": muoverlo gira lo sguardo e vicino ai bordi dello schermo ci si continua a girare. Riprova a catturarlo al massimo ogni 4 secondi.
- La scivolata abbassa il personaggio: passa sotto frecce e biglietti del Bigliettaio.
- Armi e braccia sono modelli a parte attaccati alla telecamera, con pose in spazio telecamera; la mano resta nello stesso punto dello schermo su ogni formato. Il fendente lascia una scia luminosa.
- Nei vagoni col tetto chiuso i nemici emergono dal pavimento in un cerchio viola; dove il tetto è aperto cadono dall'alto (nella serra calano dal soffitto).
- Il numero di luci di ogni vagone resta fisso (le luci "di scorta" passano a boss e forzieri), così gli shader non si ricompilano a metà partita.
- Sul telefono in orizzontale braccio e arma sono un po' più piccoli e più bassi, per non coprire la scena dietro i tasti.

La v1 pixel art (`../v1-pixel-base/`) e la v2 3D dall'alto (`../v2-3d/`) restano come sono.
