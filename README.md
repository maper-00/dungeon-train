# Dungeon Train

Roguelite ambientato su un treno in corsa: si avanza vagone dopo vagone, ognuno a tema e generato proceduralmente, combattendo mob che lasciano armi, con negozi ogni tot vagoni, boss e una modalità infinita.

Il prototipo esiste in tre versioni. Sono tutte pagine HTML autonome: basta scaricarle e aprirle nel browser (la v2 e la v3 caricano three.js da internet, quindi serve la connessione).

| Cartella | Versione | File da aprire |
|---|---|---|
| `v1-pixel-base/` | Pixel art 2D, vista laterale | `dungeon-train.html` |
| `v2-3d/` | 3D con vista dall'alto | `dungeon-train-3d.html` |
| `v3-prima-persona/` | 3D in prima persona | `dungeon-train-fps.html` |

## Cosa c'è già

Cabina letto con scelta della classe (Cavaliere, Ranger, Mago), bestiario, armadio e slot machine per le armi.

Nella versione in prima persona (v3) la corsa attraversa dieci vagoni a tema fino alla locomotiva: carrozza passeggeri, ristorante, bagagliaio, vagone letto, serra, vagone del carbone, vagone blindato, officina, salone di prima classe e locomotiva. Ci sono 13 creature (con tre boss: Bigliettaio Spettrale, Regina delle Serre e il Capotreno), 13 tipi di armi, una bottega ogni tre vagoni e il freno d'emergenza da tirare alla fine. La difficoltà cresce un vagone dopo l'altro: il primo fa da introduzione e ogni vagone si comincia con la vita piena. I dettagli sono in `v3-prima-persona/LEGGIMI.md`.

La v1 pixel art e la v2 dall'alto si fermano al Vagone 1.

## Sorgenti

La v2 e la v3 hanno i sorgenti divisi in `src/`. La pagina si ricostruisce con:

```
cd v2-3d/src
python3 build.py ../dungeon-train-3d.html
```

(nella v3 il file è `dungeon-train-fps.html`). Il file `LEGGIMI.md` di ogni cartella spiega i dettagli e, per la v3, i comandi.
