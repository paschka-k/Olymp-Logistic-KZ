# Funktionsübersicht – Entwicklungsstand

**Olymp Logistic Platform** · Stand: 16.10.2026 · Plattformversion 0.3.9

Vollständige Übersicht der heute (Version 0.3.9) verfügbaren Funktionen: 17 Betriebsbildschirme, Register- und Verwaltungsseiten, Kunden- und Partnerportal, öffentliche Seiten und die technische Plattform. Im Anhang alle umgesetzten Änderungsanträge (FR) aus dem Änderungsregister.

## 1 Kennzahlen

|  | # |
|---|---|
| Änderungsanträge umgesetzt | 178 |
| teilweise umgesetzt | 2 |
| geplant / offene Frage | 5 |
| Fehler behoben / geschlossen | 37 |
| Betriebsbildschirme | 17 |
| Register-, Verwaltungs- und Portalseiten | 16 |
| Benutzerrollen | 11 |
| Sprachen der Oberfläche | 4 (RU, DE, EN, KK) |

## 2 Betriebsbildschirme 01–17

| Nr. | Bildschirm | Funktionen |
|---|---|---|
| 01 | **Übersicht** – Live-Monitoring | Live-Lagebild: KPI, laufende Touren, Alarmfeed mit Handlungsanweisungen, Hubwetter, Eingang externer Meldungen; Simulation von Alarmen nur in der Demo. |
| 02 | **Disponent** – Touren, Zuweisungen, Fahraufträge | Tourplanung je Abfahrt, Zuweisung Fahrzeug/Fahrer mit Ressourcen- und Doppelbuchungsprüfung, Fahraufträge, Eiltouren, Umplanung wegen Buran, Expressfreigaben, Tab „Plan“. |
| 03 | **Beladung und Gewicht** – Paletten, Volumen, Achsen | Ladeberechnung (Paletten, Volumen, Gewicht, Achsen, Höhe), Beladeansicht 2.0, Lkw-Finder mit Tourkosten, Aufteilung auf mehrere Fahrzeuge, Beladereihenfolge, Abfahrtsverwiegung, FEFO, Platzabgleich. |
| 04 | **Sendungen und Kennzeichnung** – PO, PL, SSCC, Artikel, Chargen | Aufträge, Positionen, Packstücke mit SSCC (GS1-128), Etikettendruck ZPL, Herstellerlogos, Scanner-Suche, Track & Trace je Packstück, Archiv. |
| 05 | **Thermostatus** – Laderaumkammern und Außentemperatur | Temperatur je Kammer/Thermocontainer, Außentemperatur, Grenzwertalarme, Thermochron-Journal (Tab), Logger und Kalibrierung. |
| 06 | **Wetter 3–7 Tage** – Prognose und Routenrisiken | Prognose 3–7 Tage je Routenstadt, Sturm-/Schneewarnungen (Kazhydromet), Straßensperrungen (KazAvtoZhol), Routenrisiken, Regel −45 °C. |
| 07 | **Sicherheit** – Vorfälle, Geozonen, ADR | Vorfälle und Alarme (Tür, Diebstahl, Brand, Panne, SOS), Geozonen, ADR/Trockeneis, Eskalation, Kontakte mit 1 Klick, Betriebsprotokoll. |
| 08 | **KZ-Dokumente** – Dokumentensatz und Tourfreigabe | Dokumentensatz je Tour (TTN, ESF, SNT, Fahrtenblatt), EDS-Signatur, Go/No-Go-Freigabe mit Datenprüfungen, Statusmeldungen IS ESF/ESUTD. |
| 09 | **Qualität** – Abweichungen, CAPA, Kalibrierung | Abweichungen, CAPA, Kalibrierung, Qualitätssperre betroffener Aufträge, GDP-Nachweise, Ereignisse aus der Fahrer-App. |
| 10 | **Fuhrpark** – Zustand, Wartung, Zulassungen | Fahrzeugzustand, Wartung, Zulassungen, Werkstatttickets, Garantie-Prognose, Fuhrparkregister (Tab) mit Ansichten, Aufnahme-Checkliste, Kalibrierung. |
| 11 | **Partner** – Service- und Logistikpartner, Übergabe von Sendungen | Service- und Logistikpartner mit Tarifen, SLA, Kapazität, GDP, Verträgen; Übergabe von Sendungen, Vergleich eigene Tour / Partner, Hubfilter. |
| 12 | **Personal** – Wo die Fahrer sind, Verfügbarkeit, Abwesenheiten | Wo die Fahrer sind, Verfügbarkeit, Abwesenheiten, Lenkzeit- und Stundenkonto, Medizincheck, ADR-/Führerscheinfristen. |
| 13 | **Fahrer-App** – Fahrerbildschirm auf Tour | Fahrer-App: Schichtbeginn, Fahrtenblatt, Routenpunkte, Scan, Thermochron, Ausnahmen, Retouren, Tankung, Vorfälle/SOS, Nachrichten, Bußgelder, Schichtende, offline, Kasachisch. |
| 14 | **Planung** – Kapazität, Szenarien, Ressourcen | 7-Tage-Kapazität, Szenarien, Ressourcen, Simulation Zielflotte, Arbeitstagekalender KZ. |
| 15 | **Berichte** – Berichte und KPI | Berichte und KPI (OTIF, Auslastung, Expressanteil), Bußgeld-Import und -Konto, Exporte. |
| 16 | **Kosten** – Diesel, Werkstatt, Ausfall, Versicherung, Steuern | Diesel, Werkstatt, Ausfall, Versicherung, Steuern; Ist-Kosten-Ledger, Entscheidung eigene Tour / extern mit Zwei-Unterschriften-Gate, Selbstkosten + 5 %. |
| 17 | **Ausgangsdaten** – Fragenkatalog · 150 Antworten · Validierung | Fragenkatalog mit 150 Antworten, Validierung, Planwerte mit Prüfstatus, kritischer Pfad, Rechts-/Steuerprüfpunkte. |

## 3 Register, Verwaltung, Portale und öffentliche Seiten

| Seite | Funktionen |
|---|---|
| Eingang | Externe Meldungen (Connectoren, Webhooks, manuell) mit Routing auf die Fachbildschirme, übersetzte Texte. |
| Netzabdeckung | Mobilfunkmodell der Strecken, Funklöcher, Kontaktmonitor, SMS-Rückfallebene. |
| Buchungen | Kundenanfragen bestätigen/ablehnen/stornieren, Zähler neuer Anfragen, Angebots-/Vertragsmuster, Versicherungszertifikat. |
| Touren · Aufträge | Listen mit Paging und Suche (Auftrags-Nr., LOT, SSCC), Tracking-Links, Status. |
| Alarme | Ein gemeinsamer Alarmspeicher mit Quittung, Eskalation, Abschlussvermerk. |
| Transportversicherung | Police (Planwert), Schadenfälle aus Abweichungen mit Statusschritten. |
| Anfragen & Deals · Kunden · Aufgaben | CRM-Pipeline, Ausschreibungen, Kunden mit BIN-Prüfung und Preislisten, Aufgaben mit Fälligkeit. |
| Fahrer | Fahrerakten (Personendaten verschlüsselt), Konten für die Fahrer-App. |
| Linien & Tarife | Fahrpläne, Abfahrten, Ausnahmen, Tarife, Fahrzeuge je Linie. |
| Stammdaten | Versionierte Stammdaten, Planwerte, Hersteller, Routing-Werte, Vier-Augen-Freigaben. |
| Bereitschaft | Bereitschaftsplan für Eskalationen der Stufe 3. |
| Benutzer · Integrationen · Audit-Protokoll | Rollen, Geschäftsfunktionen, MFA; Connector-Katalog, API-Schlüssel, Webhooks; manipulationssicheres Audit. |
| Kundenportal: Transport buchen · Meine Buchungen | Abholung + Zustellung, Waren, Gefahrgut, Versicherung, Zahler, Express, Preis + Slots, Bestätigung per E-Mail/SMS, Angebote. |
| Partnerportal | Eigene Übergaben, ePOD-Upload, Selbst-Onboarding mit GDP-Nachweis. |
| Öffentlich: Anfrageformular · Tracking | Lead ins CRM, Sendungsverfolgung ohne Anmeldung und ohne Personendaten. |
| Hilfe | Artikel je Bildschirm, Rollenmatrix, Ablaufdiagramme, Animationen, geführte Touren. |

## 4 Rollen und Berechtigungen

Administrator, Disponent, Lager, Fahrer, Auditor, Betrachter, Kunde (Portal), Partner (Portal), Management, Finanzen, Qualität; Geschäftsfunktionen: Geschäftsführer, Leitung Analytik, Leitung Einkauf/Logistik, Leitung Logistik, Finanzcontroller, QA-Manager, Leitung Sicherheit.

## 5 Technische Plattform

- Backend FastAPI + PostgreSQL 16, Datenbankmigrationen (Alembic), Betriebszustand je Entität mit Versionen und Delta-Antworten.
- Web-App React (Vite), Online-Demo im Browser mit fiktiven Daten und gleichem Verhalten wie der Server (Paritätstest).
- Sicherheit: Argon2id, TOTP-2FA, Sperre, CSRF, CSP/HSTS, Hub-Trennung, RBAC-Matrix, Verschlüsselung personenbezogener Daten, HMAC-verkettetes Audit.
- Betrieb: Docker-Compose-Stack, gehärtete Container, Integrations-Worker als einziger Dienst mit Internetzugang, verschlüsselte Backups, Health-Checks.
- Qualität: ≈ 1 560 Backend-Tests (auch in zufälliger Reihenfolge), 757 UI-Tests im Browser und gegen das echte Backend, 121 Layout-Tests, axe-Barrierefreiheit, CI in parallelen Teilläufen.
- Sprachen: RU, DE, EN, KK; Änderungsregister dreisprachig; Versionsnummer mit Build-Zeit.

## 6 Teilweise umgesetzt und offen

| FR | Titel | Status | Hinweis |
|---|---|---|---|
| FR-49 | Abweichungen im Fragenkatalog mit KDL klären | offene Frage | Frage an KDL: Datenbestätigung steht noch aus. |
| FR-68 | Übergabe an Partner mit Scan in der App | geplant | Konzept: für v6 geplant; in das Plattform-Backlog übernommen. |
| FR-69 | Wialon und Tachograf statt Simulation | geplant | Konzept: für v6 geplant; in das Plattform-Backlog übernommen. |
| FR-70 | PIN-Login und Rolle „Fahrer“ | geplant | Konzept: für v6 geplant; in das Plattform-Backlog übernommen. |
| FR-138 | 2-s-Live-Tick vom App-Baum isolieren; Bildschirme per Code-Splitting; Bundle-Budget | teilweise | /s/overview 425,7 → 411,9 KB (Eingangsbereich jetzt eigener Chunk), Budget 425 KB hält; Leerlauf-Tick, Pause bei verstecktem Tab, Lazy-Bildschirme erledigt. Das Ziel 350 KB ist mit React nicht erreichbar: React + React-DOM allein 214 KB, Router 40 KB, Wörterbücher 33 KB (287 KB vor jedem App-Code). Entscheidung nötig: Budget 425 KB beibehalten oder Laufzeit auf Preact umstellen (compat, ≈ −180 KB; Framework-Wechsel, vollständiger Regressionslauf). |
| FR-171 | Sharding der UI-Suite | teilweise | CI in parallelen Teilläufen: pytest 4 × + 4 × zufällige Reihenfolge (ganze Module, nach gemessener Zeit verteilt), UI-Suite gegen das echte Backend 6 × (Schnitte aus gemessenen Laufzeiten, nie innerhalb der portierten Suite), eigener Job für statische Prüfungen / Migrationen; deterministisch (jeder Teillauf einzeln geprüft, Fehler als CI-Annotationen). Gesamtdauer 18 min → 5 min 20–35 s: das Ziel < 5 min verfehlt die Einrichtung der UI-Teilläufe (Playwright-Browser + Systempakete ≈ 1 min) – nächster Schritt: diese Jobs im Playwright-Container-Image ausführen. |
| FR-188 | WhatsApp-/Telegram-Benachrichtigungen – rechtliche Entscheidung zu Auslandsübermittlung und Kundeneinwilligung nötig | offene Frage | Offene Frage an die Rechtsberatung des Betreibers (Datenschutz). |

## Anhang A – Alle umgesetzten Änderungsanträge nach Themen

### Konzept v2→v3 · Änderungsanträge Runde 1

| FR | Funktion |
|---|---|
| FR-01 | Barcodescanner im Suchfeld |
| FR-02 | Archiv zugestellter Sendungen |
| FR-03 | Track & Trace je SSCC |
| FR-04 | GS1-128-Druck und ZPL-Export |
| FR-05 | Warnung bei kurzer Resthaltbarkeit (FEFO) |
| FR-06 | Beladung nach Packstück (SSCC) statt nach Auftrag |
| FR-07 | Automatischer Import von Bußgeldbescheiden („Sergek“, eGov) |
| FR-08 | Lenkzeit aus dem Fahrtschreiber |
| FR-09 | Fahrzeugauswahl für eine Eiltour |
| FR-10 | Fristenkontrolle für ADR-Bescheinigung und Führerschein |
| FR-11 | Freigabesperre bei abgelaufener Kalibrierung und Versicherung |
| FR-12 | Echte TTN, ESF, SNT und elektronische Signatur (EDS) |
| FR-13 | Kasachische Version von Oberfläche und Dokumenten |
| FR-14 | Rollen und Zugriffsrechte |
| FR-15 | Datenhaltung und Backend |
| FR-16 | Echte Quellen für Prognose und Straßensperrungen |
| FR-17 | Tastatur und Screenreader |
| FR-18 | UI-Tests DE/EN und Regression in der CI |

### Konzept v3 · Runde 2: Partner & Übergabe

| FR | Funktion |
|---|---|
| FR-19 | GDP Pflicht für Übergabe 2–8 °C |
| FR-20 | Kapazitätsprüfung des Partners bei Übergabe |
| FR-21 | Übergabe ändert Tourplan, Dokumente und Track & Trace |
| FR-22 | Streckenabdeckung durch Partner |
| FR-23 | Kühlaggregat-Service auf jeder Kühlkettenstrecke |
| FR-24 | Automatische Herabstufung nach SLA |
| FR-25 | Sperren mit dem Modul „Qualität“ verknüpfen |
| FR-26 | Verlängerung von Partnerverträgen |
| FR-27 | Werkstattauftrag mit ETA, Kosten und Fahrzeugstatus |
| FR-28 | Haftung und Versicherung bei Übergabe |
| FR-29 | Partnertarife und Vergleich „eigene Tour / Partner“ |
| FR-30 | Partnerportal / API |
| FR-32 | Hubfilter auf dem Bildschirm „Partner“ |
| FR-33 | Notfall ↔ Partner: Kontakte mit 1 Klick |
| FR-34 | Statusfarben: grün, gelb, rot |

### Konzept v4–v5 · Runde 3: Fragenkatalog

| FR | Funktion |
|---|---|
| FR-35 | Bildschirm „Ausgangsdaten“ mit Validierung des Fragenkatalogs |
| FR-36 | 23 Städte und Hubzuordnung nach P86 |
| FR-37 | Umschlagpunkte statt Nebenlager (schließt FR-31) |
| FR-38 | Simulation auf Zielflotte 4 Fahrzeuge 10-t-Klasse |
| FR-39 | Passive Kühlkette: Container und Logger |
| FR-40 | Thermochron-Import bei Annahme und Journal |
| FR-41 | Express-Freigabe mit 3 Unterschriften + Anteils-KPI |
| FR-42 | Straßensperrungen aus KazAvtoZhol |
| FR-43 | Regel −45 °C: Abfahrtsverbot |
| FR-44 | Lagerzeiten 9–17 in der ETA |
| FR-45 | Reale Frachtführer: GarantA, KazExpress, KazGen, SpezAvto |
| FR-46 | 6-Tage-Woche, Sonntag Wartung; 7 Fahrer auf 4 Fahrzeuge |
| FR-47 | Selbstkosten + 5 % und Verrechnungspreise |
| FR-48 | Tracker kritischer Pfad |
| FR-50 | Prognose Garantieende nach Kilometern |
| FR-51 | Gefahrgutbeauftragter und QMS-Regelung |

### Konzept v5 · Fahrer-App

| FR | Funktion |
|---|---|
| FR-52 | Schichtbeginn: Medizincheck und Abfahrtskontrolle per Checkliste |
| FR-53 | Elektronisches Fahrtenblatt mit km-Stand und Kraftstoff |
| FR-54 | Tourdokumente in der App |
| FR-55 | Lenkzeit-Timer 4,5 h / 9 h und Fahrerwechsel |
| FR-56 | Routenpunkte mit Fenster 9–17, Wetter und Sperrungen |
| FR-57 | SSCC-Scan bei Entladung und Stückabgleich |
| FR-58 | Thermochron bei Annahme aus der App |
| FR-59 | Ausnahmen: Schaden, Fehlmenge, Annahmeverweigerung |
| FR-60 | Retouren: Thermoboxen, Leergut, Reklamationen, Verlagerungen |
| FR-61 | Tankung: Liter, Preis, km-Stand, Beleg |
| FR-62 | Vorfälle: SOS, Panne, Unfall, Sperrung, Verspätung |
| FR-63 | Disponentennachrichten mit Lesebestätigung |
| FR-64 | Bußgeldmitteilung an den Fahrer |
| FR-65 | Schichtende: km-Stand und Mängel |
| FR-66 | Profil: Berechtigungen und Verdienst |
| FR-67 | Offline-Warteschlange und Synchronisation |

### Eine Datenquelle & Architektur

| FR | Funktion |
|---|---|
| FR-71 | v5-Betriebsbildschirme aus echten DB-Touren/-Aufträgen speisen |
| FR-72 | Kollision der Tournummern zwischen DB und Referenz beseitigen |
| FR-73 | Auftragspositionen, Packstücke und SSCC als eigene Tabellen |
| FR-74 | Betriebszustand v5 aus einem JSON-Dokument in Tabellen verlagern |
| FR-75 | Versionierte Dokumenthistorie und Archivtabellen statt stiller Listenkürzung |
| FR-76 | Festes Szenariodatum durch ein Server-Geschäftsdatum ersetzen |
| FR-77 | Echte Datenbankmigrationen (Alembic) statt `create_all` |
| FR-78 | Referenz-Stammdaten bearbeitbar und versioniert machen |
| FR-79 | Seed über Service-Regeln plus Konsistenzprüfung |
| FR-80 | Kollisionsfreie Belegnummern |

### Sicherheit & Datenschutz

| FR | Funktion |
|---|---|
| FR-81 | Serverseitige Hub- und Rollenprojektion der Antworten von `/api/v5/state` und `/act` |
| FR-82 | Partnerkontakte und Personaldaten aus der Referenz-Payload entfernen |
| FR-83 | Fahrer-App an die eigene Tour des Fahrers binden |
| FR-84 | Keine simulierte Telemetrie und keine Alarm-Simulationsknöpfe im Produktivbetrieb |
| FR-85 | Fachrollen für Freigaben; Unterschriftsfelder an die Freigeberrolle binden |
| FR-86 | Rotation des `data_key` und Neuverschlüsselungs-Job umsetzen |
| FR-87 | Aggregiertes Audit abgewiesener eingehender Anfragen |
| FR-88 | Dokumentiertes Bereinigen von `inbound_nonce` umsetzen |
| FR-89 | Personennamen aus `v5_doc` heraushalten (oder verschlüsseln) und Löschung unterstützen |
| FR-90 | Persistente Idempotenz für externe Ereignisse |

### Tourablauf, Disposition & Go/No-Go-Freigabe

| FR | Funktion |
|---|---|
| FR-91 | Go/No-Go-Freigabe beim echten Abfahrtsübergang erzwingen |
| FR-92 | Fest codierte und textbasierte Freigabe-Gates durch Datenprüfungen ersetzen |
| FR-93 | Serverseitige Ressourcenprüfung und Doppelbuchungsprüfung |
| FR-94 | Bestehende Touren bearbeiten, umplanen und Zuordnungen lösen |
| FR-95 | Auftragsstornierung konsistent mit Stopp und Buchung machen |
| FR-96 | Gebuchte Abfahrt in den Auftrag übernehmen und Touren je Abfahrt planen |
| FR-97 | Abfahrtsausnahmen und ein einheitlicher Buchungshorizont |
| FR-98 | Fehlende Statusübergänge vervollständigen |
| FR-99 | Serverseitige Ladeberechnung für jede Tour und jedes Fahrzeug |
| FR-100 | „Touren heute“ und Alarmzähler korrigieren |

### Kühlkette, Alarme & Qualität

| FR | Funktion |
|---|---|
| FR-101 | Ein gemeinsamer Speicher für Alarme und Vorfälle |
| FR-102 | Sensorzuordnung je Kammer und Alarmauswertung für alle Messquellen |
| FR-103 | Qualitätssperre für von einer Abweichung betroffene Aufträge |
| FR-104 | Ein Eskalationsdienst für jedes Ereignis der Stufe 3 |
| FR-105 | SOS vom echten Fahrer/Fahrzeug; expliziter Hub; Pflicht-Abschlussvermerk |
| FR-106 | Echter Prognoseimport statt eines Aktualisierungszeitstempels |

### Zustellung, Fahrer-App, Netzabdeckung & SMS

| FR | Funktion |
|---|---|
| FR-107 | ePOD der Fahrer-App mit Stoppzustellung und Auftragsstatus verbinden |
| FR-108 | ePOD mit rechtlich verwertbaren Nachweisen |
| FR-109 | Alle Fahrzeuge über Telematik überwachen, nicht nur über die App |
| FR-110 | Zustellstatus und Quittungs-Timeout für Disponenten-SMS |
| FR-111 | Reale Funklöcher aus Telematiklücken lernen |
| FR-112 | ETA je Stopp und Ereignis-Zeitleiste im Tracking |
| FR-113 | Partnerübergabe in Aufträgen, Stopps und Tracking abbilden |

### Compliance & Staatsdokumente

| FR | Funktion |
|---|---|
| FR-114 | Vorfahrt-Medizincheck vor dem 01.01.2027 erzwingen |
| FR-115 | Gefahrgut- und Trockeneisdaten je Sendung |
| FR-116 | ESF aus dem zugestellten Auftrag erzeugen und eingehende Partnerrechnungen erfassen |
| FR-117 | GDP-Nachweise für Partnerstrecken |

### Ressourcen, Personal, Partner & Planung

| FR | Funktion |
|---|---|
| FR-118 | Werkstatttickets steuern Fahrzeugverfügbarkeit und Slotkapazität |
| FR-119 | 7-Tage-Kapazitätsplan aus echten Daten berechnen |
| FR-120 | Lenkzeitkonto der Fahrer und datenbasierte Eilzuordnung |
| FR-121 | Gemessenes Partner-SLA, Tageskapazität und kontrollierte Vertragsverlängerungen |
| FR-122 | Bußgelder dem Fahrer zum Tatzeitpunkt zuordnen |
| FR-123 | Bußgeldkonto mit Weiterbelastungsprozess |
| FR-124 | Echter Nachrichtenkanal zu Fahrern und Buchhaltung |

### Finanzen, Vertrieb & Partner-API

| FR | Funktion |
|---|---|
| FR-125 | Ist-Kosten-Ledger neben dem Bottom-up-Modell |
| FR-126 | Frist, Benachrichtigung und Wirkung für Express-Freigaben |
| FR-127 | Strukturierte Ausschreibungs-Leads, Aufgaben und Onboarding gewonnener Kunden |
| FR-128 | Strikte Idempotenz, GDP-Daten und Lebenszyklus-Endpunkte |

### Betrieb, UX, i18n, Tests & Performance

| FR | Funktion |
|---|---|
| FR-129 | Zuverlässiger Backup-Job: pipefail, separater MAC-Schlüssel, Zeitplan, externe Kopie, Fehleralarm |
| FR-130 | Worker-Zeitplanung je Task, Heartbeats, tiefer Health-Check und Alarmierung |
| FR-131 | Dokumentänderungen an offene Clients pushen oder pollen |
| FR-132 | Ein Navigationsmodell: doppelte Menüpunkte entfernen und Bildschirmnummerierung korrigieren |
| FR-133 | Navigationsschublade für Smartphone-Breite und Viewport-/Überlappungstests in der UI-Suite |
| FR-134 | Navigation als Links, Skip-Link, Statushinweise nicht nur über Farbe |
| FR-135 | Orts-/Standortstamm mit IDs; kasachische UI; Transliteration externer Texte |
| FR-136 | 494er-Suite in der CI gegen das echte Backend; Parität des Demo-Spiegels |
| FR-137 | Bildschirm- und Hilfeberechtigungen aus dem Backend generieren; vollständiger Test Rolle × Aktion |

### Angeforderte Funktionen (11./12.10.2026)

| FR | Funktion |
|---|---|
| FR-139 | Aufteilung auf mehrere Fahrzeuge |
| FR-140 | Beladeansicht 2.0 |
| FR-141 | Fahrzeugkalibrierung |
| FR-142 | Stammdaten Streckenbeschränkungen |
| FR-143 | Vollständiges Tourkostenmodell in der Fahrzeugsuche |
| FR-144 | Beladereihenfolge |
| FR-145 | Abfahrtsverwiegung |
| FR-146 | Packstückmaße |
| FR-147 | Angebote |
| FR-148 | Kundenpreislisten |
| FR-149 | Vertragsmanagement |
| FR-150 | Kundenadressbuch |
| FR-151 | Adressvalidierung |
| FR-152 | Tägliche Wechselkurse |
| FR-153 | Versicherungsmanagement |
| FR-154 | Express-Sendung aus dem Kundenportal |
| FR-155 | Mehrstreckenrouting über Hubs |
| FR-156 | KZ-Arbeitstagekalender |
| FR-157 | Checkliste für die Fahrzeugaufnahme |
| FR-158 | Ansichten des Fuhrparkregisters |
| FR-159 | Einstiegsseite Register & Administration |
| FR-160 | Geführte Touren in der Hilfe |

### Lücken aus der Umsetzung

| FR | Funktion |
|---|---|
| FR-161 | Änderungsregister |
| FR-162 | Demo-Snapshot aus dem Seed in der CI |
| FR-163 | Ein Nummernschema in Demo und Produktion |
| FR-164 | Regressionssuite Kundenisolation |
| FR-165 | Prognoseanbieter |
| FR-166 | Oberfläche für den Bereitschaftsplan |
| FR-167 | Abdeckungsprüfung der Freigabefunktionen |
| FR-168 | Testisolation |
| FR-169 | KATO-Verifizierung |
| FR-170 | Vervollständigung der kasachischen UI |
| FR-172 | Demo-Partnerkonto und Selbst-Onboarding von Partnern |
| FR-173 | Oberflächen für bestehende APIs |
| FR-174 | Rechts-/Steuer-Prüfpunkte |
| FR-175 | Deep Links |

### Angeforderte Funktionen (12.10.2026)

| FR | Funktion |
|---|---|
| FR-176 | Herstellerlogos auf Bildschirm 04 |
| FR-177 | Versionsnummer und Build-Datum/-Zeit in der Versionsanzeige |

### Angeforderte Funktionen (13.10.2026)

| FR | Funktion |
|---|---|
| FR-178 | Design-Umschalter: aktuelles Design ↔ Kökzhol-Markendesign |
| FR-179 | Navigationssymbole: Duotone (Olymp-Design) und Kacheln (Kökzhol-Design) |
| FR-180 | Eine Kennzeichnung für Fehler: BUG-xx (kein B-xx mehr) |

### Angeforderte Funktionen (15.10.2026)

| FR | Funktion |
|---|---|
| FR-185 | Gewichtsplausibilität einer Buchung (Warnungen, nie blockierend) |
| FR-186 | Buchende / zahlende Partei (Agent, Makler, Spediteur) mit eigener Rechnung |
| FR-187 | Buchungsbestätigung per E-Mail / SMS |
| FR-189 | BIN-/IIN-Prüfung und Datenübernahme (Prüfziffer offline, optionale KGD-Onlineprüfung) |
| FR-190 | Zähler „Buchungen“ im Menü für neue Anfragen + Hilfeartikel |

## Anhang B – Behobene Fehler

| BUG | Titel |
|---|---|
| BUG-37 | Online-Demo: eine in einem zweiten Tab gebuchte Sendung fehlt in «Buchungen» des ersten Tabs |
| BUG-36 | Übersicht: ein älterer kritischer Alarm konnte aus der Alarmliste fallen |
| BUG-35 | Goldene Status-Chips im Kökzhol-Design unter WCAG-Kontrast |
| BUG-34 | Eingang: Connector-Meldungen auf EN / DE als transliteriertes Russisch (und Russisch beim Überfahren) |
| BUG-33 | Alarm-Simulationsknöpfe im Kökzhol-Design unsichtbar |
| BUG-32 | Express-Sendung mit 3-Personen-Freigabe nicht auffindbar (nur auf Bildschirm 17 „Ausgangsdaten“) |
| BUG-31 | Browserverlauf zeigt nur „Olymp Logistic“/„Hilfe und Anleitungen“ – der Bereich ist nicht erkennbar |
| BUG-30 | Transportversicherung zeigt nur ₸ |
| BUG-29 | Bereich Paletten / Temperatur hat kein Gewicht |
| BUG-28 | „Keine Linie verbindet Abholung und Ziel“ wird Kunden angezeigt |
| BUG-27 | Abhol-/Ziellisten im Portal bieten „KDL Olymp · Hub/Niederlassung“ an; externe Kunden versenden von/zu eigenen Standorten |
| BUG-26 | Orte auf EN/DE-Seiten (Portal) auf Russisch |
| BUG-25 | Abholung und Ziel fehlen / dieselbe Stadt doppelt („Almaty · KDL Olymp · Almaty“) |
| BUG-24 | GitHub Pages 404 für das private Plattform-Repo |
| BUG-23 | Spalten der Fuhrparktabelle brechen bei ≈1080 px auf einen Buchstaben je Zeile zusammen |
| BUG-22 | Ladebild/Kacheln nicht synchron mit markierten Aufträgen (übergebene Aufträge blieben markiert) |
| BUG-21 | Beladung & Gewicht: Überladungen (Achse, Gesamt, Höhe) nicht immer sichtbar |
| BUG-20 | Disponent: Tourpanel verdeckt beim Scrollen den „Feed der Fahrer-App“ |
| BUG-19 | CI-Fehler (Frontend-Audit) |
| BUG-18 | GitHub: Warnungen „LF will be replaced by CRLF“ |
| BUG-17 | update-from-zip.ps1: PowerShell „Parameter File erfordert einen Pfad“ |
| BUG-16 | update-github.ps1: „FAILED … link expired“ — keine Datei aktualisiert |
| BUG-15 | Befund V-22 (Budget) wurde nach Wahl des Kühlaufbaus nicht kritisch |
| BUG-14 | Test der erweiterten Flotte suchte „Thermo King“ in der Zeile |
| BUG-13 | Einkammer-V07 2–8 °C zeigte „2–8 / 15–25 / −20 °C“ |
| BUG-12 | Erweiterte Flotte: „HOWO · aktive Kühlung“ = 4 statt 1 |
| BUG-11 | Netzstatus im Telefon brach bei 360 px auf 2 Zeilen um |
| BUG-10 | Annahmefenster Karaganda 14:00–17:00, aber ETA 11:05 als „im Fenster“ markiert |
| BUG-09 | Szenario „Brand“ bot ein „Ersatzfahrzeug V04-Reserve“ an |
| BUG-08 | Eiltour wurde einem Fahrer ohne freies Fahrzeug zugeordnet |
| BUG-07 | Erwartet wurden 18 Partner und 4 bei den Hauptlagern |
| BUG-06 | ZPL-Test suchte Packstück L18, das nicht auf der Tour ist |
| BUG-05 | Test „Anhänger ohne Temperaturführung“ schlug fehl |
| BUG-04 | FR-32: Filter „Almaty“ zeigte 6 statt 5 Partner |
| BUG-03 | Filter „Städte auf der Route“ erwartete Atyrau |
| BUG-02 | DE-Version: russischer Text „По городам“ im Tab „Validierung“ sichtbar |
| BUG-01 | Express-Unterschrift: bei schnellem Klicken überschrieb die zweite Unterschrift die erste |
