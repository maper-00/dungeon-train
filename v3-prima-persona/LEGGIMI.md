# Dungeon Train in prima persona (v3)

La partita vista con gli occhi del personaggio: cabina letto, scelta della classe, poi dieci vagoni a tema fino alla locomotiva, dove aspetta il Capotreno.

- Pagina condivisa (chiunque abbia il link): https://claude.ai/artifact/SuMEqPePmXT2YwKD6JkWJd, con i dieci vagoni e la difficoltà ridotta. Le versioni precedenti restano nella cronologia della pagina.
- `dungeon-train-fps.html`: la pagina pronta da aprire (three.js 0.147 da jsdelivr).
- `src/`: sorgenti. `python3 build.py dungeon-train-fps.html` ricostruisce la pagina; con `local` come secondo argomento crea una versione di prova che usa una copia locale di three.js in `../three/package/` ed espone `window.DBG` (con `DBG.tick(n)` per far avanzare il gioco di n fotogrammi nei test automatici).
- Ordine dei file: head.html, poi js/core.js, render.js, shapes.js, models.js, mobs.js, props.js, levels.js, wagons.js, game.js, view.js, ui.js, main.js.
  - `shapes.js`: forme morbide (`rbox`, `lathe`, `taperTube`, `blob`), texture realistiche disegnate in codice (legno venato, pelle, velluto capitonné, ottone spazzolato, tappeto persiano, etichette di viaggio, libri, il ritratto del capotreno), materiali, `Kit` per comporre gli oggetti, `rim` (luce di contorno dei personaggi) e `bake` (unisce i pezzi fermi dei modelli per avere poche draw call).
  - `models.js`: classi, armi (`WT`), creature (`MOBS`), modelli delle armi, del giocatore, di ratti, scheletri, Bigliettaio e Bullone.
  - `mobs.js`: modelli, comportamento (`AI`) e pose (`POSER`) delle creature nuove.
  - `props.js`: oggetti dei vagoni (valigie, casse, panche Pullman, tavoli, lampade, tende, letti, libreria, cassaforti, pianoforte, divani, botti, carbone...).
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

Nei vagoni 3, 6 e 9, a vagone libero, arriva la bottega del robot: ingranaggio di scorta (+1 vita massima) e due armi, pagati con le monete della corsa. Ogni forziere dà monete.

## Difficoltà

Il gioco è più facile di prima, soprattutto all'inizio, e la difficoltà cresce un vagone dopo l'altro.

- Vita: ogni vagone si comincia con la vita piena, e tra un'ondata e l'altra Bullone ridà un cuore. Il Cavaliere ha 6 cuori, Ranger e Mago 5.
- Vagone 1: fa da introduzione, con tre ondate brevi e tutti i nemici di livello 1: tre ratti; due scheletri, un ratto e un arciere; infine uno scheletro insieme al Bigliettaio. All'ingresso il capotreno avverte che l'anello che lampeggia ai piedi di un nemico annuncia il colpo.
- Ritmo dei nemici (`paceFor` in `wagons.js`): nei primi vagoni si muovono più piano, attaccano meno spesso, caricano i colpi più a lungo, tirano proiettili più lenti e in mischia attaccano uno alla volta. La differenza si riduce vagone dopo vagone, ma un po' resta anche in locomotiva.
- Chi è fuori dallo sguardo ricarica gli attacchi a metà velocità: meno colpi alle spalle.
- I nemici normali tolgono un cuore a colpo, a qualsiasi livello. Due cuori li tolgono solo il Bigliettaio del salone quando scatta e il Capotreno.
- Ratti e ragni mordono e poi scappano. Ragni e bauli mordono solo atterrando addosso, e i bauli dopo ogni salto restano fermi un attimo. Gli arcieri usano la balestra solo dal livello 3. Lo scudo della guardia assorbe il 60% dei colpi frontali (prima l'85%). Cuochi e fuochisti lanciano meno spesso. L'automa annuncia la carica più a lungo e carica più piano.
- Boss: il Bigliettaio e il Capotreno si fermano e gridano «BIGLIETTO!» prima dello scatto, e il Bigliettaio dopo lo scatto resta stordito e basso per un attimo. La Regina evoca un ragno alla volta (due nella seconda fase). Il Capotreno ha meno vita e tira ventagli di biglietti più radi; le onde d'urto tolgono un cuore.
- I colpi a distanza mirano un po' più avanti del bersaglio che si muove, e l'aiuto alla mira col mouse è un po' più largo.
- Dal vagone 2 in poi quasi tutte le ondate hanno un nemico in meno.
- La bottega non vende più il tè e il forziere non dà più il cuore: la vita torna piena al vagone dopo.

Per misurare la difficoltà, un giocatore simulato da principiante ha giocato ogni vagone partendo con la vita piena e con un'arma comune del livello dei nemici di quel vagone. Il giocatore simulato vede solo quello che ha davanti, reagisce in ritardo, mira in modo impreciso, para e salta poco e non scivola. Partite vinte, prima e dopo le modifiche:

| Vagone | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Prima | 0/45 | 0/18 | 0/18 | 3/18 | 0/18 | 0/18 | 0/18 | – | – | – |
| Dopo | 44/45 | 16/18 | 14/18 | 18/18 | 11/18 | 14/18 | 14/18 | 11/18 | 16/18 | 12/18 |

18 partite sono sei per classe, 45 sono quindici per classe. Della versione precedente i vagoni 8-10 non sono stati misurati: già dal primo il giocatore simulato non andava avanti.

## Armi

Tredici tipi: spada, sciabola (critici frequenti), ascia, pugnale, lancia (affondo lungo), martello (schianto ad area che stordisce), falce (taglio larghissimo), arco, balestra (dardi che trapassano), trombone (rosata di pallini), bastone (dardo magico), tomo (fulmine che rimbalza tra i nemici), lanterna (palla di fuoco che esplode). Ogni creatura ha i suoi punti deboli, scritti nel bestiario.

## Grafica

- Pareti con texture in coordinate del mondo (pannelli di legno, carta da parati damascata, lamiere rivettate, mattoni), pavimenti a scacchi, parquet, lamiera striata, passatoie.
- Temporale: lampi che illuminano la scena anche dai finestrini, fulmini all'orizzonte e tuono in ritardo; luna visibile dai tetti aperti.
- Atmosfera per vagone: nebbia, colore della polvere, lucciole, braci, vapore, fumo della locomotiva.
- Armi con lame sagomate e rune luminose per le rarità, leggera aberrazione cromatica ai bordi.
- Personaggi strambi ma belli, fatti di forme morbide con una luce di contorno che li stacca dal buio, e con piccole animazioni proprie (`userData.tick`): il ratto ha orecchie enormi che si muovono, occhi spaiati con il monocolo, il cartellino del bagaglio e il coltello tra i denti; gli scheletri hanno il cranio grosso, gli occhi di brace e la mascella che batte (il passeggero in panciotto e bombetta, l'arciere col cappuccio e un occhio solo, il cuoco col cappello altissimo, il fuochista con gli occhialoni, la guardia in armatura, il Capotreno in redingote con i baffi enormi); il Bigliettaio ha la coda di nebbia che ondeggia e i biglietti che gli girano attorno; il fantasma va in giro in camicia da notte col cuscino; i ragni hanno un'orchidea sulla schiena; l'automa è una teiera di rame; il baule mimetico ha un solo occhio giallo e le zampe di poltrona; Bullone è una caldaia d'ottone su zampette da insetto. Anche le tre classi nelle schede sono nuove.
- Mani in prima persona arrotondate, con le dita chiuse sull'impugnatura dell'arma; manica, bracciale e guanto cambiano con la classe.
- Oggetti dei vagoni realistici: legno venato, pelle, velluto capitonné e ottone con texture disegnate in codice e coordinate in metri (la grana non si stira). Valigie con cinghie, angoli e etichette di viaggio, casse di assi con le scritte a spruzzo, panche Pullman, tavoli con centrino, tazza e lampada verde, tende di velluto ai finestrini, lampadari a candele, cassaforti con la manopola, lingotti, pianoforte a coda, tappeto persiano con le frange, ritratto a olio del capotreno.

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
