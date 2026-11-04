# Changelog

## 2.1.0 — 2026-11-04
- Responsabile di ente: nuovo tab «Persone ente» per aggiungere persone al proprio ente, creare/togliere accessi, reimpostare password, impostare i permessi e rimuovere persone (non sé stesso, altri responsabili o amministratori).
- Il flag «Responsabile ente» viene salvato anche su Firebase per le regole di sicurezza (richiede le nuove regole Firestore).

## 2.0.0 — 2026-11-04
- Ambienti separati per ente: ogni commessa appartiene a un ente; chi fa parte di un ente vede solo commesse, attività, persone ed eventi del suo ente.
- Il responsabile di ente crea e gestisce le commesse e le attività del suo ente.
- Amministratore: tendina «Ente» in testata per passare da un ente all'altro (o vedere tutti); in «Modifica intestazione» sposta una commessa di ente.
- Masterplan: ente del modello (o per tutti gli enti) al posto dell'ente per riga.

## 1.9.0 — 2026-11-04
- Enti / reparti: l'amministratore crea gli enti (Impostazioni → Enti / reparti) e assegna ogni persona a un ente.
- Ogni persona vede solo le attività del proprio ente (Commesse, Persone, Gantt, Eventi, esportazioni); l'amministratore vede tutto.
- Responsabile di ente: aggiunge e modifica le attività del suo ente e vede le persone del suo ente.
- Le attività hanno un ente (scelto nella scheda o preso dalla persona assegnata); ente anche nelle righe del masterplan, nell'importazione Excel e nell'export.

## 1.8.1 — 2026-11-03
- Accessi: una persona rimossa e poi aggiunta di nuovo viene riattivata con lo stesso account (stessa password di prima).

## 1.8.0 — 2026-11-03
- Gantt diagramma: banda mesi/giorni fissa in alto e titolo commessa sempre visibile durante lo scorrimento; scorrimento per almeno un anno.
- Esporta…: scelta di formato (PDF, Excel, Project), commesse, persona, periodo e contenuti (diagramma, attività, gate, ore per voce). PDF su più pagine.

## 1.7.1 — 2026-11-03
- Persone: ordine «Per date (Gantt)» per data di inizio, poi di fine (senza date in fondo).

## 1.7.0 — 2026-11-03
- Persone: ordine «Come Gantt» (commessa per priorità, poi ordine di pianificazione) oppure «Priorità personale» con trascinamento.
- Gantt diagramma: date impostabili trascinando sulla riga (anche per attività senza date); barre spostabili e allungabili anche da telefono con pressione prolungata; diagramma esteso di 3 settimane oltre l'ultima data.

## 1.6.0 — 2026-11-03
- Persone: date di inizio e fine modificabili direttamente sul box (con permesso di modifica).
- Gantt: filtro per persona (o non assegnate); nel diagramma le barre si trascinano col mouse per spostare le date e si allungano dal bordo destro; tocco/clic apre la scheda.
- Correzione: calcolo date e giorno di oggi nel fuso orario locale.

## 1.5.0 — 2026-11-03
- Commesse: «Chiudi commessa» / «Riapri commessa» ed «Elimina» (con conferma) nell'intestazione. Le commesse chiuse escono da Persone, Gantt (tutte), Ore ed Eventi, restano consultabili in sola lettura dalla sezione «commesse chiuse».

## 1.4.0 — 2026-11-03
- Commesse: «Modifica intestazione» (codice, descrizione, cliente) ed eliminazione commessa.
- Ore: budget e consuntivo per voci configurabili (Progetto meccanico, Progetto elettrico, Assemblaggio meccanico, Assemblaggio elettrico, Software, Robot, Gestione), gestibili in Impostazioni; foglio Ore nell'export Excel.
- Eventi: campi del nuovo gate non più sovrapposti.
- Smartphone: Gantt diagramma leggibile (nomi su due righe, righe più alte), Ore senza caselle sovrapposte.

## 1.3.0 — 2026-11-03
- Persone: descrizione commessa accanto a codice e date; riordino tenendo premuto e trascinando (numerazione automatica); «Annulla avvio» per tornare a non avviata.
- Commesse: righe senza sovrapposizioni (stato e azioni sotto il nome), pulsante ◆ per inviare la riga agli eventi, pulsante ⛓ per dettagli e attivazione automatica.
- Attivazione automatica: una riga si attiva da sola quando sono concluse le righe da cui dipende (esportata anche in Project come collegamento).
- Gantt: mostra anche le attività senza date.
- Eventi: impaginazione rifatta. Ore: colonne budget, consuntivo e scostamento allineate.

## 1.2.4 — 2026-11-03
- Pulsante «Installa Ergo Plan» nell'app (Android/Chrome) e istruzioni per iPhone.

## 1.2.3 — 2026-11-03
- Installazione: nuovo id app e service worker, per separarla da Turni e Ferie.

## 1.2.2 — 2026-11-03
- Installazione: identità e ambito propri (id/scope /pianificazione_commesse/) per non confondersi con Turni e Ferie.

## 1.2.1 — 2026-11-03
- Smartphone: Gantt con vista Elenco (predefinita sul telefono), commesse e ore a schede senza scorrimento orizzontale, tab su due righe.

## 1.2.0 — 2026-11-03
- Gantt: voci e sottovoci su più livelli (frecce ← →), voci calcolate dalle sottovoci, inserimento come sottovoce.
- Impostazioni: permessi per persona (aggiunge attività, modifica/elimina attività, crea commesse e responsabili).

## 1.1.0 — 2026-11-03
- Gantt: aggiunta e modifica delle attività direttamente dal diagramma (+ Attività su ogni commessa, clic su nome o barra per modificare); le attività finiscono nella commessa.

## 1.0.0 — 2026-11-03
- Accessi come Turni e Ferie: nome utente nome+cognome (3+3), password iniziale 123 da cambiare al primo accesso, "Ricorda l'accesso", recupero password via email, Il mio account.
- Masterplan con voci e sottovoci, importazione da Excel e Project (XML), nuova commessa da masterplan o vuota.
- Gantt con mesi e anno, esportazione Project (XML).

- Prima versione: commesse con priorità e responsabili, persone, Gantt, ore, eventi/gate, impostazioni.
- Accesso con nome utente e password (Firebase Authentication), dati condivisi su Firestore.
- Esportazione PDF ed Excel.
