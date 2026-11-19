# Changelog

## 2.38.5 — 2026-11-19
- Pianificazione automatica: corretto, le ferie sui giorni MSV/SV venivano ignorate.

## 2.38.4 — 2026-11-19
- Proposta di pianificazione: per ogni fermo è indicata la zona dell'impianto.

## 2.38.3 — 2026-11-19
- Pianificazione automatica: le zone della persona sono un vincolo rigido (anche per gli impianti dedicati); controllo ripetuto alla conferma, i fermi fuori zona vengono scartati e segnalati.

## 2.38.2 — 2026-11-19
- Gantt per persona: il periodo parte dalla prima attività anche se è più vecchia di una settimana (le attività precedenti non restano più nascoste).

## 2.38.1 — 2026-11-19
- Pianificazione automatica: «Impianti prioritari fermi max a settimana» conta gli impianti prioritari diversi fermati nella settimana (lun–dom); mai due impianti prioritari fermi lo stesso giorno.

## 2.38.0 — 2026-11-19
- Pianificazione automatica: nuovo parametro «Fermi max a settimana per impianto prioritario» (predefinito 1, 0 = nessun limite).

## 2.37.0 — 2026-11-19
- Pianificazione automatica: impianti bilanciati a giri (un impianto non ha un nuovo fermo finché gli altri non hanno avuto il loro). Nuovo parametro «Passaggi in più per gli impianti prioritari» (predefinito 1).

## 2.36.0 — 2026-11-19
- Pianificazione automatica: i turni MSV (Mattina) e SV (Giornata) di Turni e ferie sono riconosciuti come lavorativi; in quei giorni la persona riceve solo impianti dello stabilimento di Settimo Vittone.

## 2.35.0 — 2026-11-19
- Pianificazione automatica: «Ore di manutenzione per turno» ora in % delle ore disponibili (manutentori in turno × 8 h, predefinito 60%). Ogni manutentore resta comunque al massimo a 8 ore.

## 2.34.0 — 2026-11-19
- Pianificazione automatica: corretta la chiusura con ✕ (la finestra a tutto schermo non si chiudeva).
- Nuovo parametro «Ore di manutenzione per turno (max per persona)», predefinito 8: oltre, il fermo viene diviso.

## 2.33.0 — 2026-11-19
- Pianificazione automatica: massimo 8 ore (480 min) per manutentore al giorno. I fermi più lunghi vengono divisi in più parti (per procedura), assegnate a più manutentori preferibilmente nello stesso giorno (conta come un solo fermo impianto) o in giorni diversi.

## 2.32.1 — 2026-11-19
- Pianificazione automatica a tutto schermo: corretto lo sfondo che si interrompeva scorrendo.

## 2.32.0 — 2026-11-19
- Pianificazione automatica: in «Esclusi dal giro» si può escludere una zona intera (tutti i suoi impianti) con una spunta.

## 2.31.0 — 2026-11-19
- Pianificazione automatica: finestra a tutto schermo.

## 2.30.2 — 2026-11-19
- Gantt «Per persona»: corretta la visualizzazione del numero di priorità.

## 2.30.1 — 2026-11-19
- Gantt «Per persona»: attività nello stesso ordine della priorità personale, con il numero di priorità accanto al nome.

## 2.30.0 — 2026-11-19
- Ingegneria: priorità personali e Gantt per persona allineati. Il riferimento è il Gantt: la priorità segue le date (inizio, poi fine). Riordinando le priorità (frecce o trascina) le attività si scambiano le date di inizio mantenendo la durata, e le dipendenti si spostano di conseguenza.

## 2.29.0 — 2026-11-19
- Pianificazione automatica: riquadro «Pianificazioni già presenti» nel periodo/zona/impianto scelti, con «🗑 Cancella» (anche solo quelle create in automatico; quelle già iniziate restano) per rifare la simulazione.
- Nuovo campo «Solo un impianto» per ripianificare un singolo impianto.

## 2.28.1 — 2026-11-18
- Pianificazione automatica: la % manutenzione è indicativa. Un fermo lungo va comunque a un manutentore libero (anche tutto il turno); non gli si aggiungono altri lavori oltre la quota.

## 2.28.0 — 2026-11-18
- Pianificazione automatica: «Esclusi dal giro» (impianti interi o singole macchine/componenti, con ricerca) e opzione «Un solo fermo per macchina» che raggruppa tutte le manutenzioni interne del periodo dello stesso impianto in un unico fermo.

## 2.27.0 — 2026-11-18
- Pianificazione automatica: colonna «Dedicato a» per manutentore (impianti con ricerca). Gli impianti dedicati vanno a quella persona se è in turno entro la tolleranza; altrimenti a un altro, segnalato nella proposta.

## 2.26.0 — 2026-11-18
- Pianificazione automatica: passo «4 · Priorità» con zone prioritarie e impianti prioritari (con ricerca); vengono pianificati per primi (prima gli impianti, poi le zone), segnati con ★ nella proposta.

## Beta — 2026-11-18 (2)
- 5 tocchi sul titolo: menu con «Simulazione» e «↺ Torna a Ergo Plan» cancella i dati Beta e li ricopia da Ergo Plan senza la simulazione dei 12 mesi.

## 2.25.1 — 2026-11-18
- Zone impianti per manutentore: spuntando una zona si spuntano anche tutte le sottozone; il pulsante mostra il numero di zone (nomi nel suggerimento) e la finestra non si sposta più a ogni spunta.

## 2.25.0 — 2026-11-18
- Pianificazione automatica: per ogni manutentore si scelgono le zone di impianti su cui può fare manutenzione (✎, con sottozone; nessuna = tutti). Sostituisce la scelta Impianti Settimo.

## 2.24.1 — 2026-11-18
- Pianificazione automatica: tabella manutentori allineata; Impianti Settimo con scelta No / Anche / Solo.

## 2.24.0 — 2026-11-18
- Pianificazione automatica: spunte per persona «anche» / «solo» impianti di Settimo (zona con «Settimo» nel nome); senza spunta la persona non riceve impianti di Settimo.

## 2.23.2 — 2026-11-18
- Pianificazione automatica e Carico persone: solo le persone dei reparti di manutenzione (non più ingegneria).

## 2.23.1 — 2026-11-18
- Sincronizza turni: legge un riepilogo per reparto (scritto in Turni e ferie da admin, responsabili e direttori) e li unisce.

## 2.23.0 — 2026-11-18
- Turni da «Turni e ferie»: pulsante «🔄 Sincronizza turni» (accesso con un utente di Turni e ferie, solo lettura); i turni restano condivisi in Ergo Plan (manutDoc/_turni) con data dell'ultima sincronizzazione.
- Gantt → Per persona: ferie e assenze di Turni e ferie sui giorni della persona.
- Pianificazione: avviso delle manutenzioni con il manutentore in ferie, assente, a riposo o in un altro turno.
- Nuova pagina «Carico persone»: per settimana ore turno, ore manutenzione, ore supporto al plant, % e giorni di assenza.
- Pianificazione automatica: elenco di tutti i manutentori del reparto, % manutenzione/supporto per persona, «Preventiva» (togliere dalle manutenzioni programmate) ed «Escludi da tutto»; tiene conto delle manutenzioni già pianificate; tolto il caricamento del file Excel.

## 2.22.0 — 2026-11-18
- Manutenzione → Pianificazione: «⚙ Pianificazione automatica». Si carica l'Excel dei turni (app Turni e ferie: Esporta → Excel → Turni), si scelgono reparto, manutentori, periodo, zona impianti, riserva per guasti/cambi modello, manutentori in programmata per turno, fermi max al giorno, turni e giorni preferiti, tolleranza; «Simula» mostra la proposta (fermi per giorno/turno, carico per persona, procedure escluse) da confermare o rifare. Niente viene salvato prima della conferma.

## 2.21.0 — 2026-11-18
- Manutenzione: procedure Moretto PM093–PM105 (fascicolo MP, trimestrali, 10 min) e 62 macchine nella categoria «Impianto materia prima (Moretto)».

## Beta — 2026-11-18
- Nuovo ambiente Ergo Plan Beta (/beta/), generato con tools/make_beta.py: dati separati (collezioni beta_*), copia iniziale da Ergo Plan, simulazione 12 mesi delle manutenzioni non svolte (escluse fornitore ed evento), 5 tocchi sul titolo per aggiornarla a oggi.

## 2.20.1 — 2026-11-18
- Backup dati: «⬆ Ricarica backup…» (solo admin) — conferma scrivendo RIPRISTINA, scarica prima una copia dei dati attuali, poi ricarica l'app.

## 2.20.0 — 2026-11-18
- Impostazioni → Persone e accessi (solo admin): «⬇ Scarica backup», copia completa dei dati in un file JSON sul PC.

## 2.19.4 — 2026-11-18
- Gantt: «🗄 Archivia» nella scheda dell'attività (clic sul nome o sulla barra).

## 2.19.3 — 2026-11-18
- Gantt: pallino colorato dello stato accanto al nome di ogni attività (diagramma, elenco, per persona).
- Gantt: la larghezza dei giorni si adatta per mostrare un mese intero (31 giorni) nello schermo.

## 2.19.2 — 2026-11-18
- Gantt: colori distinti per stato — da fare blu, in corso arancio, conclusa verde, non attiva grigio a righe.

## 2.19.1 — 2026-11-18
- Gantt: barra di scorrimento orizzontale anche in alto (sempre visibile) e pulsanti ◀ Oggi ▶.

## 2.19.0 — 2026-11-18
- Impostazioni → «Giorni festivi»: calendario annuale, si tocca un giorno per segnarlo festivo; pulsante per aggiungere le festività nazionali (con Pasquetta).
- I festivi non contano nella durata delle attività, negli spostamenti delle collegate e nel carico per persona; nel Gantt sono ombreggiati.

## 2.18.6 — 2026-11-18
- «Invia a eventi»: usa la data di fine dell'attività, o l'inizio se manca la fine (non più la data di oggi).

## 2.18.5 — 2026-11-18
- Gantt: trascinando una barra la durata in giorni lavorativi resta uguale.

## 2.18.4 — 2026-11-18
- Legami e spostamenti mantengono la durata in giorni lavorativi (non cambia più attraversando i fine settimana).

## 2.18.3 — 2026-11-18
- Durata in giorni lavorativi (Commesse e scheda attività): con inizio e durata la fine si calcola da sola; cambiando l'inizio la durata resta uguale.

## 2.18.2 — 2026-11-18
- Quando si lega un'attività (⛓), parte il giorno lavorativo dopo la fine della precedente (mantenendo la durata); le date restano modificabili.

## 2.18.1 — 2026-11-18
- Commesse: cambiando la data di inizio (o di fine) di un'attività si spostano anche le attività collegate.
- Togliendo tutti i legami ⛓ l'attività torna attiva e non resta più «in attesa».

## 2.18.0 — 2026-11-18
- La pagina non torna più in cima dopo segnalazioni o modifiche: resta la posizione di scorrimento (anche orizzontale nel Gantt).
- Commesse/Gantt: spostando un'attività (date, trascinamento, scheda) le attività collegate «⛓ dopo» che seguono si spostano degli stessi giorni, a catena.
- Gantt: nuova vista «Per persona» con il carico giornaliero (1/2/3+ attività, giorni sovrapposti evidenziati) e le attività aperte di ciascuno.

## 2.17.2 — 2026-11-18
- Segnalazioni: pulsante «Modifica» (autore o responsabile, se non archiviata) in elenco, scheda impianto ed esecuzione attività.

## 2.17.1 — 2026-11-18
- Nuova segnalazione: filtro Zona (con sottozone) per trovare l'impianto.

## 2.17.0 — 2026-11-18
- Manutenzione: la scheda «Ricambi» diventa «Segnalazioni»: note e ricambi necessari degli impianti in un unico punto, con filtri (aperte, note, ricambi da acquistare/acquistati, archiviate), zona e impianto. «+ Nuova segnalazione» per tutti.
- Il responsabile segna i ricambi acquistati (nell'attività di origine compare «acquistato il … da …») e archivia/ripristina le segnalazioni.
- Esecuzione attività: «Segnala nota» per l'impianto. Scheda impianto: riquadro «Segnalazioni».

## 2.16.3 — 2026-11-17
- «Aggiungimi alle persone»: si sceglie il nome con cui comparire (diventa anche il nome dell'account).

## 2.16.2 — 2026-11-17
- Persone e accessi: per ogni persona «Assegnabile anche in» altri reparti (es. Ingegneria e Manutenzione): compare negli elenchi di assegnazione di quei reparti.
- Se l'amministratore non è tra le persone, pulsante «Aggiungimi alle persone» per potersi assegnare attività.

## 2.16.1 — 2026-11-17
- Esecuzione attività: «Ricambi utilizzati» con spunta «Da riacquistare» (non spuntata di default), modificabile anche dopo; solo quelli spuntati vanno nell'elenco da acquistare.

## 2.16.0 — 2026-11-17
- Scheda impianto: sezione «Documenti» (verbale prima verifica, dichiarazione CE/libretto, certificato di taratura, verbale verifica periodica, altro) con componente, data e scadenza; apri, nuova versione, modifica, elimina. Max 700 KB per file.
- Documenti in scadenza (scaduti o entro la finestra) in Pianificazione → Prossime scadenze; in scheda arancione entro 60 giorni, rosso se scaduti.
- Diagnostica: spazio usato dai documenti.
- Nuovo tipo «Carroponte» (PM087–PM091) aggiunto una sola volta; PM092 verifica periodica triennale (carroponte con 10 anni o meno) da aggiungere a mano al componente.

## 2.15.1 — 2026-11-17
- Scheda impianto: «Dismetti impianto» spostato in fondo alla scheda e colorato di rosso.

## 2.15.0 — 2026-11-17
- Impianti: pulsante «Dismetti» (con conferma) che elimina attività aperte e manutenzioni in calendario dell'impianto; lo storico resta. «Ripristina impianto» per riattivarlo.
- Spunta «Mostra dismessi» in Manutenzione → Impianti e Impostazioni → Impianti; senza spunta i dismessi sono nascosti (anche da Pianificazione e Inserimento rapido).

## 2.14.9 — 2026-11-17
- Manutenzione → Impianti (scheda impianto, «Da fare»): data ultima esecuzione e pulsante «Pianifica» anche qui; se già pianificata mostra la data.

## 2.14.8 — 2026-11-17
- Configura impianto: accanto alla data di ultima esecuzione di ogni procedura, pulsante «Pianifica gg/mm/aaaa» che crea il prossimo intervento in base alla cadenza (raggruppato con le altre procedure dello stesso impianto nello stesso giorno). Se già pianificata mostra la data.

## 2.14.7 — 2026-11-17
- Pianificazione: filtro Zona (con sottozone, o «Senza zona») applicato a riquadri, elenchi, calendario e griglia annuale.
- Procedure: spunta «Intervento fornitore esterno obbligatorio» (badge 🏢 in procedure e attività).
- Nuovi tipi «Serbatoio in pressione» (PM077–PM080) e «Compressore a vite» (PM081–PM086), aggiunti automaticamente una sola volta; PM079, PM080, PM082, PM083, PM085 con fornitore esterno.
- Tipo «Essiccatore» separato (PM084 interno). Tagliando compressore e controllo F-gas essiccatore uniti in PM082 «Intervento annuale fornitore esterno»; PM085 eliminata. Correzione automatica una sola volta sui dati già importati.

## 2.14.6 — 2026-11-17
- Inserimento rapido: filtro zona per gli impianti già inseriti (come zona in alto, tutte, senza zona o una zona con le sottozone) e conteggio.

## 2.14.5 — 2026-11-17
- Finestre: trascinando il mouse fuori dalla finestra non si chiudono più. L'inserimento rapido si chiude solo con ✕ o Annulla.

## 2.14.4 — 2026-11-17
- Inserimento rapido: ogni nuova riga ha il suo menu Zona; di default usa la zona scelta in alto, ma si può cambiare riga per riga.

## 2.14.3 — 2026-11-17
- Impostazioni → Impianti: filtro per zona (include le sottozone) e conteggio impianti mostrati.

## 2.14.2 — 2026-11-16
- Inserimento rapido: clic sul ✓ verde di un impianto già inserito toglie quel componente con le sue procedure e attività aperte (dopo conferma; lo storico resta).

## 2.14.1 — 2026-11-16
- Inserimento rapido: la spunta in testa alla colonna aggiunge il componente (con le procedure) anche a tutti gli impianti già inseriti mostrati, dopo conferma.

## 2.14.0 — 2026-11-16
- Nuovo tipo «Termoregolatore HB-Therm» con procedure dal manuale (cap. 9.3–9.4): PM074 trimestrale (~1000 h), PM075 semestrale (~2000 h, con LOTO), PM076 ogni 18 mesi (~6000 h, con LOTO). Aggiunte automaticamente una sola volta.

## 2.13.2 — 2026-11-16
- Inserimento rapido: incolla da Excel a colonne (Nome | Descrizione | Commessa | Cliente), sia in «Incolla elenco» sia direttamente in una cella della tabella (riempie righe e colonne da lì in avanti). Accettato anche il separatore «;».

## 2.13.1 — 2026-11-16
- Impianti: nuovo campo «Descrizione» (nuovo impianto, configura, inserimento rapido, ricerca). «Incolla elenco» mette il testo dopo il nome in Descrizione (non più in Commessa).

## 2.13.0 — 2026-11-16
- Inserimento rapido: «Incolla elenco» trasforma un elenco (una riga per impianto: nome, poi descrizione in «Commessa») in righe della matrice; i nomi doppi diventano «(2)».

## 2.12.8 — 2026-11-16
- Inserimento rapido a tutto schermo.

## 2.12.7 — 2026-11-16
- Inserimento rapido: campi della tabella visibili (bordo e sfondo), tendina zona a larghezza piena, caselle di spunta a misura.

## 2.12.6 — 2026-11-16
- Inserimento rapido: i componenti già presenti sugli impianti esistenti sono indicati con un ✓ verde ben visibile.

## 2.12.5 — 2026-11-16
- Inserimento rapido: la spunta sugli impianti già inseriti aggiunge subito il componente con le procedure; la tabella non torna più in cima dopo ogni modifica.

## 2.12.4 — 2026-11-16
- Inserimento rapido: colonna «Zona» modificabile sugli impianti già inseriti (salvataggio immediato).

## 2.12.3 — 2026-11-16
- Inserimento rapido: commessa e cliente degli impianti già inseriti modificabili (salvataggio immediato).

## 2.12.2 — 2026-11-16
- Impianti: etichette «Codice» → «Nome» e «Nome» → «Commessa» (nuovo impianto, configura, inserimento rapido, ordinamento). Dati invariati.

## 2.12.1 — 2026-11-16
- Inserimento rapido: sotto le righe nuove compaiono gli impianti già inseriti della zona (tutti se nessuna zona) con i componenti presenti; si possono spuntare componenti mancanti da aggiungere.
- Impianti (vista e impostazioni): «Ordina per» codice, nome, zona o tipo componente.

## 2.12.0 — 2026-11-16
- Impostazioni → Impianti: «Inserimento rapido» con zona unica (esistente o nuova) e matrice impianti × tipi componente; ogni spunta crea il componente con le sue procedure.

## 2.11.2 — 2026-11-16
- Intervento non programmato: la scelta dell'elemento compariva per errore nel modulo «Altra attività»; ora è nel modulo giusto.

## 2.11.1 — 2026-11-16
- Intervento non programmato: scelta facoltativa dell'elemento; le preventive mostrate sono solo quelle dell'elemento scelto; ore facoltative dell'impianto o dell'elemento selezionato. Protezione dal doppio salvataggio.
- Storico e scheda impianto: «Dettaglio attività» apribile con passi eseguiti, note, ricambi e ore, senza stampare il PDF.

## 2.11.0 — 2026-11-16
- Manutenzione: «+ Intervento non programmato» per tutti (impianto, causale, descrizione, ricambi con codice/descrizione/quantità, ore impiegate min 0,5). Con «Manutenzione preventiva» si sceglie la preventiva dell'impianto: dopo conferma è segnata eseguita e ripianificata da quella data.
- Ore lavorate impianto: gli elementi sommano la differenza rispetto all'intervento precedente; un valore scritto sull'elemento diventa il suo riferimento. Ore inferiori alle precedenti solo per responsabile/admin.

## 2.10.1 — 2026-11-16
- Prossime scadenze: il periodo in giorni è un'impostazione salvata, uguale per tutti (la cambia il responsabile manutenzione).

## 2.10.0 — 2026-11-16
- Prossime scadenze: giorni di avviso modificabili direttamente su ogni riga (valgono per la procedura su tutti gli impianti) e periodo del riquadro regolabile (predefinito 90 giorni).

## 2.9.9 — 2026-11-16
- Pianificazione: nuovo riquadro «Prossime scadenze» con le procedure che scadono nei prossimi 90 giorni (data, giorni mancanti, impianto, componente, avviso), evidenziate quelle già nel periodo di avviso, con «Pianifica».

## 2.9.8 — 2026-11-16
- Procedure: campo «Avviso (giorni prima della scadenza)», impostato su tutte (mensili 7 gg, trimestrali 15, semestrali 30, annuali 60; modificabile): la procedura compare «In scadenza» e in «Da pianificare» con quell'anticipo.
- Nuovo tipo «Scaffalature»: PM072 Ispezione visiva trimestrale UNI EN 15635 (foto cartello e foto scaffalature) e PM073 Ispezione annuale persona competente.

## 2.9.7 — 2026-11-16
- Procedure: tolte tutte le richieste di foto obbligatorie e di caricare rapporti, verbali o certificati (es. PM007, PM011, PM018, PM033, PM039, PM043, PM049); si aggiungono a mano se servono. Aggiornamento automatico una sola volta.

## 2.9.6 — 2026-11-16
- Procedure PM015–PM018 riscritte per la pressa a iniezione plastica (LOTO con accumulatori, gruppo iniezione caldo e piano mobile; ugello, cilindro, fasce riscaldanti, ginocchiera, olio idraulico, sicurezze EN 201). Aggiornamento automatico una sola volta.

## 2.9.5 — 2026-11-16
- Procedure: riquadro «Documenti comuni» in alto (es. Procedura LOTO) con documento attuale, in quante procedure è usato, «Apri» e «Carica nuova versione» (vale per tutte le procedure).

## 2.9.4 — 2026-11-16
- Documento condiviso (es. Procedura LOTO): dalla procedura si carica la nuova versione e viene sostituita in tutte le procedure che la usano, senza duplicare il file.

## 2.9.3 — 2026-11-16
- Procedure raggruppate per tipo componente (es. Robot 6 assi): si tocca il gruppo per vedere tutte le sue procedure; ricerca per codice o descrizione.
- Nuova procedura: codice progressivo proposto (es. PM072), modificabile; controllo codici doppi. Dal gruppo, «+ Procedura per…» la collega subito a quel tipo.

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
