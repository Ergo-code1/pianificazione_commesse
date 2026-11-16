# Changelog

## 2.9.2 — 2026-11-16
- Configura impianto: elenco a spunta dei tipi di componente presenti; quelli spuntati vengono aggiunti con la sola descrizione e le loro procedure. Toccando un componente si aprono i dettagli (descrizione modificabile, procedure, ultima esecuzione).

## 2.9.1 — 2026-11-16
- Pianificazione manutenzione: pulsante «Elimina» in Da pianificare (salta la scadenza delle procedure scelte), Da ripianificare, In ritardo, Pianificate (con scelta se saltare la scadenza) e Fatte/Storico (toglie l'intervento e ripristina la scadenza precedente). La cronologia resta dentro ogni attività.
- Tolta la sezione «Registro» dal menu della manutenzione.

## 2.9.0 — 2026-11-16
- Salvataggi sicuri anche con più persone insieme: ogni salvataggio (commesse/persone, manutenzione, storico) avviene in una transazione che fonde le proprie modifiche con quelle fatte nel frattempo dagli altri, invece di sovrascriverle.
- Se un salvataggio non riesce (es. rete assente) viene ripetuto in automatico.
- Storico: chiusure fatte da altri visibili senza ricaricare (aggiornamento ogni minuto).

## 2.8.9 — 2026-11-16
- La manutenzione non resta più bloccata su «Caricamento»: se le procedure non arrivano si apre comunque (in sola lettura) e mostra il motivo.

## 2.8.8 — 2026-11-16
- Procedure di nuovo salvate insieme agli altri dati (il limite di 1 MB non era il problema). Recupero automatico delle procedure rimaste fuori dal salvataggio nelle versioni 2.8.5–2.8.7, con gli stessi codici e collegamenti.
- Nessun salvataggio se le procedure non sono ancora caricate (evita di cancellarle).

## 2.8.7 — 2026-11-16
- CORRETTO: pianificazioni e assegnazioni della manutenzione non venivano salvate sul server (Firestore rifiutava le foto per passo, salvate come «array dentro array», senza dare errore). Ora vengono convertite e salvate correttamente; anche lo storico delle attività chiuse.

## 2.8.6 — 2026-11-16
- Attività assegnate (manutenzione): pulsante «Diagnostica» con versione, dimensione dati, esito dell'ultimo salvataggio e confronto con i dati sul server.

## 2.8.5 — 2026-11-16
- Manutenzione: le procedure sono salvate in un documento separato; i dati principali (pianificazioni, assegnazioni) non superano più il limite di 1 MB di Firestore, che faceva fallire i salvataggi.
- Messaggio evidente se un salvataggio non riesce.

## 2.8.4 — 2026-11-16
- Protezione dati manutenzione: un'app rimasta a una versione vecchia (es. su iPhone) si ricarica da sola e non può più sovrascrivere pianificazioni e assegnazioni fatte con la versione nuova.

## 2.8.3 — 2026-11-16
- Aggiornamenti: l'app controlla se c'è una versione nuova all'apertura e quando torna in primo piano, e mostra «Aggiorna» (utile su iPhone con l'app installata).

## 2.8.2 — 2026-11-16
- Manutentori: le manutenzioni assegnate (per impianto o singole) compaiono sempre nella loro «Attività assegnate»; se il loro reparto non ha la sezione, viene aggiunta in automatico; all'accesso si apre direttamente l'elenco.
- Confronto dei nomi senza differenze di maiuscole e spazi; messaggio chiaro se i dati della manutenzione non sono leggibili.

## 2.8.1 — 2026-11-16
- Tolta la foto obbligatoria da tutti i passi di tutte le procedure.

## 2.8.0 — 2026-11-16
- Procedure: nuovi campi «Tempo stimato (minuti)» e «Materiali, attrezzature e DPI»; ogni passo ha le sue istruzioni (modificabili), visibili nell'attività con «Istruzioni».
- Documento procedura: si può collegare un documento già caricato invece di ricaricarlo; il file condiviso non viene cancellato finché lo usa un'altra procedura.
- Caricate una sola volta 71 procedure standard (PM001–PM071) collegate ai tipi componente; la Procedura LOTO è salvata una volta e collegata a tutte le procedure che la richiedono.

## 2.7.4 — 2026-11-16
- Pianifica manutenzione: mostrate anche le procedure non legate a un componente; messaggio chiaro (con «Configura ora») quando l'impianto non ha procedure.

## 2.7.3 — 2026-11-15
- Manutenzione: nei filtri e nelle scelte del manutentore compaiono solo le persone del reparto.

## 2.7.2 — 2026-11-15
- Le attività di manutenzione completate restano nella lista della persona («Completate») finché il responsabile le toglie (singole o tutte); restano comunque nello storico.

## 2.7.1 — 2026-11-15
- Manutenzione → Registro: cronologia di tutti gli eventi delle attività (pianificata, assegnata, spostata, completata, tolta, riaperta…); cronologia anche dentro ogni attività.
- Le attività scadute non vengono più tolte in automatico: restano sulla persona come «in ritardo · non conclusa»; il responsabile le sposta o le toglie («Togli e ripianifica»).
- Le attività tolte in automatico dalla versione precedente vengono rimesse sulle persone per oggi.
- Pianificazione: riquadri, calendario, pianificate e fatte per mese, poi l'elenco.

## 2.7.0 — 2026-11-15
- Ogni reparto (ente) è un ambiente a sé: una scheda per reparto, con le sezioni scelte in Impostazioni → Enti / reparti (Commesse, Attività assegnate, Gantt, Ore, Eventi, Masterplan, sezioni di manutenzione).
- Commesse, Masterplan e attività restano nel loro reparto; in «Attività assegnate» si vedono solo persone e attività del reparto.
- «Responsabile anche dei reparti»: una persona può gestire più reparti; spunta separata per le impostazioni della manutenzione.
- Persone e accessi: riquadro «Ruolo e permessi» ordinato, filtro per reparto e ricerca per nome.

## 2.6.0 — 2026-11-15
- Menu a tre aree: Ingegneria (Commesse, Attività assegnate, Gantt, Ore, Eventi), Manutenzione (Pianificazione, Attività assegnate, Impianti, Ricambi, Storico), Impostazioni (Persone e accessi, Masterplan, Impianti, Categorie, Tipi componente, Procedure).
- Ogni persona ha un'area; l'amministratore può aggiungere sezioni dell'altra area. Responsabile ingegneria e responsabile manutenzione (anche entrambi); facoltà di aggiungere attività a persone scelte.
- Su telefono la persona vede subito le proprie attività; scelta persona con pulsanti.
- Pianificazione: riquadri Da pianificare, Da ripianificare, In ritardo, Pianificate, Fatte; calendario; griglia dell'anno con pianificate e fatte (anche nella finestra di pianificazione).
- Impianti a riquadri con ultima e prossima manutenzione; scheda con da fare, fatte, note e ricambi. Categorie impianti a livelli.
- Ricambi segnalati durante le attività, elenco generale con «acquistato».
- Attività preventive e altre attività (anche senza impianto).
- Chiusura parziale (resta «da concludere» e segue lo scadenziario), attività non iniziate e scadute tornano da ripianificare, riapertura delle attività chiuse, nome del manutentore sulle attività.

## 2.5.0 — 2026-11-14
- Manutenzione → Pianificazione: calendario mensile per pianificare le manutenzioni degli impianti (data e manutentore), con elenco degli impianti da pianificare e in scadenza.
- In ogni manutenzione entrano solo le procedure scadute alla data scelta; si possono scegliere componenti interi o singole procedure.
- Le procedure ricordano l'ultima esecuzione: la successiva viene richiesta solo quando è passato l'intervallo (o dopo un evento registrato).
- Impianti mai manutenuti restano «da pianificare» fino alla prima manutenzione.
- Manutenzioni spostabili trascinandole nel calendario o cambiando la data.
- Le procedure del tipo di componente valgono per tutti i componenti di quel tipo: aggiungerne o toglierne una aggiorna tutti gli impianti.

## 2.4.0 — 2026-11-14
- Manutenzione: nuova grafica a schede, senza scorrimento orizzontale; sezioni con titolo e spiegazione.
- «Persone» rinominata «Attività assegnate»: le manutenzioni assegnate a una persona compaiono lì, raggruppate per impianto, e si eseguono da lì.
- Assegnazione di una singola attività o di tutte le attività di un impianto.
- Impostazioni: per ogni persona si scelgono le sezioni visibili.

## 2.3.0 — 2026-11-14
- Nuovo tab «Manutenzione»: impianti con componenti, configuratore dei tipi di componente con procedure standard, procedure (codice, frequenza a calendario / da ultima chiusura / a evento, passi con foto obbligatoria, documento allegato).
- Scadenziario automatico: alla chiusura di un'attività viene generata la successiva; eventi registrabili per le procedure «a evento».
- Situazione impianti (scaduti, in scadenza, attesa evento, in regola), attività assegnabili ai manutentori, «Le mie attività» con checklist e foto compresse.
- Storico per anno con filtri, esportazione Excel e rapporto PDF della singola attività.
- Nuovo permesso «Responsabile manutenzione» (Impostazioni → persone). Dati su Firestore in app/manut, manutStorico, manutFoto, manutDoc (richiede le regole aggiornate).

## 2.2.1 — 2026-11-12
- Archiviazione della singola attività (pulsante 🗄 sulla riga) invece dell'intera commessa; ✕ elimina definitivamente con conferma.
- «Attività archiviate» per anno nella colonna Commesse: ripristino nella sua commessa o eliminazione definitiva.

## 2.2.0 — 2026-11-12
- Backup notturno automatico di Firestore (GitHub Actions, conservato 30 giorni) con ripristino manuale.

## 2.1.1 — 2026-11-04
- Eventi: il gate creato da un'attività mantiene la descrizione dell'attività, senza aggiungere «Fine».

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
