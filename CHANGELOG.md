# Changelog

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
