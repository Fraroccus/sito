# Tris nel Corpo Fungiforme

Gioco web: tris contro una mosca (Drosophila) simulata, il cui "cervello" è un circuito reale
del corpo fungiforme costruito da dati veri del connettoma FlyWire (FAFB).

Sito statico puro, nessun framework, nessuna build: `index.html` carica via `fetch()` i file
dati accanto a sé (`.json`, `mbon_meshes.glb`, `draco/`). Deploy su Vercel a costo zero di
configurazione — basta collegare questo repo, preset "Other"/nessun framework, nessun build
command, output = la cartella stessa.

Per il contesto completo del progetto (cosa è reale nei dati, pipeline di costruzione, storico
versioni) vedi `CLAUDE.md` nel repo principale del progetto (non incluso qui: questa è solo la
cartella deliverable pronta per il deploy).
