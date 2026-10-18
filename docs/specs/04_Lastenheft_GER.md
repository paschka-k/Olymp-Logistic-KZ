# Lastenheft – Projektanforderungen

**Olymp Logistic Platform · Logistik Kasachstan** · Stand: 16.10.2026 · Plattformversion 0.3.9

## 1 Zweck des Dokuments

Das Lastenheft beschreibt, **was** die Plattform aus Sicht des Auftraggebers leisten muss. Die Umsetzung (das **Wie**) steht im Pflichtenheft; dort ist jede Anforderung LH-… mit ihrer Lösung PH-… verknüpft.

## 2 Ausgangssituation

KDL Olymp, die größte Laborkette Kasachstans, kauft jährlich bis zu 50 Mio. € Labor- und Medizinverbrauchsgüter ein. Die Inlandsdistribution aus den Großlägern Astana und Almaty an 21 Empfängerstädte läuft heute über Dienstleister (GarantA, KazExpress) zu Ist-Kosten von ≈ 24,2 Mio ₸/Monat; der Expressversand macht 36,3 % des Budgets bei 8,3 % des Gewichts aus. Aufgebaut wird eine eigene Logistikgesellschaft mit 4 Fahrzeugen der 10-t-Klasse (Isotherm + passive Thermocontainer mit Loggern), 7 Fahrern und vier Routenringen; Start der Magistrale Mitte Dezember 2026. Zusätzlich sollen ≈ 10 % Fremdfracht befördert werden.

## 3 Ziele

1. Eine Plattform für Disposition, Kühlkette, Dokumente, Fuhrpark, Personal, Partner, Kunden und Kosten – statt Tabellen und Messenger.
2. Lückenlose, nachweisbare Kühlkette (GDP) für 2–8 °C, −20 °C und 15–25 °C, einschließlich Winterbetrieb bis −45 °C.
3. Express-Disziplin und Kostentransparenz als Hebel der geplanten Ersparnis (≈ 83 Mio ₸/Jahr).
4. Rechtskonformität in der Republik Kasachstan (Dokumente, EDS, Medizincheck, personenbezogene Daten).
5. Selbstbedienung für Kunden und Partner (Buchung, Tracking, Portale, API).

## 4 Produkteinsatz

**Anwendungsbereiche:** Leitstand/Disposition der Hubs, Lager, Fahrer unterwegs, Qualität, Management/Finanzen, Kunden und Partner.

**Zielgruppen und Rollen:** Administrator, Disponent, Lager, Fahrer, Auditor, Betrachter, Kunde (Portal), Partner (Portal), Management, Finanzen, Qualität; Geschäftsfunktionen: Geschäftsführer, Leitung Analytik, Leitung Einkauf/Logistik, Leitung Logistik, Finanzcontroller, QA-Manager, Leitung Sicherheit.

**Betriebsbedingungen:** Server in Kasachstan, Browser (Desktop, Tablet, Smartphone), Fahrer-App auch ohne Mobilfunk.

## 5 Funktionale Anforderungen

### 5.1 Netz, Standorte und Stammdaten

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-A1 | Das System bildet die zwei Hubs Astana und Almaty, die 21 Empfängerstädte und die vier Routenringe (Magistrale, Nord, Ost, Süd, West) ab; jede Stadt ist genau einem Hub zugeordnet (Nord, Ost, West → Astana; Süd → Almaty). | FR-36, FR-37 |
| LH-A2 | Orte werden über eindeutige Kennungen (inkl. KATO-Code, Koordinaten, Namen RU/KK/DE/EN) geführt, nicht über Anzeigetexte; Schreibvarianten (Қарағанды, Karaganda) werden erkannt. | FR-135, FR-169 |
| LH-A3 | Stammdaten (Fahrzeuge, Partner, Tarife, Kostenparameter, Planwerte, Hersteller, Fahrer) sind in der Oberfläche pflegbar, versioniert und bei kritischen Werten im Vier-Augen-Prinzip freizugeben. | FR-78, FR-174, FR-176 |

### 5.2 Disposition und Tourplanung

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-B1 | Disponenten planen Touren je Abfahrt (Linie, Datum), weisen Fahrzeug und Fahrer zu, ändern und planen um; Doppelbuchungen von Fahrzeug oder Fahrer werden serverseitig verhindert. | FR-93, FR-94, FR-96 |
| LH-B2 | Eine Tour darf erst abfahren, wenn die Go/No-Go-Prüfung bestanden ist (Dokumente, Kalibrierung, Versicherung, Medizincheck, Plätze abgeglichen); Ausnahmen nur mit eigener Berechtigung und Begründung. | FR-11, FR-91, FR-92, FR-114 |
| LH-B3 | Statusübergänge von Touren und Aufträgen folgen einer festen Übergangstabelle; Stornierungen halten Stopp, Buchung und Kapazität konsistent. | FR-95, FR-98 |
| LH-B4 | Die Betriebssicht zeigt live: Touren heute, Positionen, Alarme, Eingang externer Meldungen; Änderungen anderer Benutzer werden ohne Neuladen sichtbar. | FR-71, FR-100, FR-131 |

### 5.3 Beladung und Fahrzeugauswahl

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-C1 | Für jede Tour wird die Beladung (Paletten, Volumen, Gewicht, Achslasten, Höhe) berechnet; Überladung von Achse, Fahrzeug oder Höhe wird immer angezeigt. | FR-99, FR-140, FR-145, FR-146 |
| LH-C2 | Die Fahrzeugsuche schlägt das passende Fahrzeug vor (Temperaturklasse, Nutzlast, Kosten je Tour) und teilt Ladung bei Bedarf auf mehrere Fahrzeuge auf. | FR-09, FR-139, FR-143, FR-144 |

### 5.4 Sendungen, Kennzeichnung und Rückverfolgung

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-D1 | Sendungen werden je Packstück mit SSCC (GS1-128) gekennzeichnet, gedruckt (ZPL) und per Scanner gesucht; jeder Scan ist in Track & Trace nachvollziehbar. | FR-01, FR-03, FR-04, FR-73 |
| LH-D2 | Beim Beladen und Entladen werden Plätze gegen den Auftrag abgeglichen (Fehlmenge, Übermenge); kurze Resthaltbarkeit wird gewarnt (FEFO). | FR-05, FR-06, FR-57 |
| LH-D3 | Empfänger und Kunden verfolgen eine Sendung ohne Anmeldung über einen Tracking-Link, ohne personenbezogene Daten zu sehen; ETA je Stopp. | FR-02, FR-112 |

### 5.5 Kühlkette und Temperatur

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-E1 | Die Temperatur je Kammer bzw. Thermocontainer wird überwacht; Grenzverletzungen (2–8 °C, −20 °C, 15–25 °C; Einfrieren von 2–8 °C-Ware) lösen Alarme aus. | FR-39, FR-101, FR-102 |
| LH-E2 | Passive Kühlkette: Thermocontainer und Logger (Thermochron) werden bei Annahme ausgelesen, im Journal dokumentiert und bei Abweichung an die Qualität übergeben. | FR-40, FR-58 |
| LH-E3 | Kritische Ereignisse (Stufe 3) werden nach Bereitschaftsplan eskaliert (SMS, E-Mail, Anruf) bis zur Quittung. | FR-104, FR-166 |

### 5.6 Wetter, Straßen und Winterbetrieb

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-F1 | Für jede Route werden Wetterprognose 3–7 Tage und Straßensperrungen (KazAvtoZhol, Kazhydromet) angezeigt und in die Planung einbezogen. | FR-16, FR-42, FR-106, FR-165 |
| LH-F2 | Winterregel: Unter −45 °C keine Abfahrt; Fahrzeitfenster der Läger (9–17 Uhr) fließen in die ETA ein. | FR-43, FR-44 |
| LH-F3 | Winterkonzept für −30/−40 °C auf Mehrtagesringen (Vorkonditionierung, Heizregel) ist abzubilden, sobald fachlich entschieden. | — (Scope R116/R117) |

### 5.7 Sicherheit, Vorfälle und Gefahrgut

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-G1 | Sicherheitsvorfälle (Tür offen außerhalb des Lieferpunkts, Diebstahl, SOS, Unfall, Panne) werden erfasst, eskaliert und mit Pflicht-Abschlussvermerk geschlossen. | FR-62, FR-105 |
| LH-G2 | Gefahrgut und Trockeneis (UN 1845, LQ) werden je Sendung erfasst; ADR-Bescheinigungen und Führerscheine werden auf Fristen überwacht; Gefahrgutbeauftragter benannt. | FR-10, FR-51, FR-115 |

### 5.8 Dokumente und Compliance Republik Kasachstan

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-H1 | Tourdokumente nach RK-Recht (TTN, ESF, SNT, Fahrtenblatt) werden erzeugt, elektronisch signiert (EDS/NCALayer) und an IS ESF / ESUTD übermittelt. | FR-12, FR-53, FR-116 |
| LH-H2 | Pflicht-Medizincheck vor Fahrtantritt (ab 01.01.2027) wird erzwungen. | FR-52, FR-114 |
| LH-H3 | Rechts- und Steuerpunkte (NDS-Registrierung vor Leasing, Selbstkosten + 5 %, Verrechnungspreise) werden als Prüfpunkte geführt. | FR-47, FR-48, FR-174 |

### 5.9 Qualität (GDP)

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-I1 | Abweichungen, CAPA und Kalibrierung werden im Qualitätsmodul geführt; von einer Abweichung betroffene Aufträge werden gesperrt (Quarantäne) bis zur Entscheidung. | FR-25, FR-103 |
| LH-I2 | GDP-Nachweise gelten auch für Partnerstrecken; 2–8 °C-Übergaben nur an GDP-qualifizierte Partner. | FR-19, FR-117, FR-172 |

### 5.10 Fuhrpark und Personal

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-J1 | Fuhrpark: Zustand, Wartung, Zulassungen, Werkstattaufträge mit ETA und Kosten; Werkstatttickets beeinflussen Verfügbarkeit und Slotkapazität. | FR-27, FR-50, FR-118, FR-141, FR-157, FR-158 |
| LH-J2 | Personal: Verfügbarkeit, Abwesenheiten, Lenkzeitkonto (4,5 h / 9 h), 6-Tage-Woche, 7 Fahrer auf 4 Fahrzeuge; Bußgelder werden dem Fahrer zum Tatzeitpunkt zugeordnet. | FR-08, FR-46, FR-55, FR-120, FR-122, FR-123 |

### 5.11 Fahrer-App und Zustellung

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-K1 | Die Fahrer-App führt durch die Schicht (Medizincheck, Abfahrtskontrolle, Fahrtenblatt, Routenpunkte, Scan, Thermochron, Ausnahmen, Tankung, Vorfälle, Schichtende) und funktioniert offline. | FR-52…FR-67, FR-83 |
| LH-K2 | Zustellnachweis (ePOD) mit Foto, Unterschrift, Zeit, Position und Temperaturbericht; rechtlich verwertbar und mit Auftragsstatus verknüpft. | FR-107, FR-108 |
| LH-K3 | Auf Strecken ohne Mobilfunk bleibt der Kontakt über SMS-Protokoll und Telematik erhalten; Funklöcher werden gelernt; Kontaktverlust wird stufenweise eskaliert. | FR-109, FR-110, FR-111 |

### 5.12 Partner und Outsourcing

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-L1 | Partner (Frachtführer GarantA, KazExpress, KazGen, SpezAvto) werden mit Tarifen, SLA, Kapazität und Verträgen geführt; Übergaben ändern Tourplan, Dokumente und Track & Trace. | FR-20, FR-21, FR-24, FR-26, FR-29, FR-45, FR-113, FR-121 |
| LH-L2 | Partner arbeiten in einem eigenen Portal (nur eigene Übergaben, ePOD-Upload, Selbst-Onboarding mit GDP-Nachweis); Übergabe mit Scan in der Partner-App. | FR-30, FR-68, FR-172 |

### 5.13 Kunden: Portal, Buchung, Preise, Verträge, Versicherung

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-M1 | Kunden buchen online: Abholung UND Zustellung mit Adresse, Waren (GDP/GLP/GMP-Kategorien), Gefahrgut, Gewicht, Packstückmaße, Versicherung, Express; Preis und Slots werden sofort angezeigt; nie „keine Verbindung“ – Routing über Hub. | FR-146, FR-150, FR-151, FR-154, FR-155, FR-185 |
| LH-M2 | Angebote mit Preisbindung, Kundenpreislisten (Rahmen/Spot, Rabatt, Dieselzuschlag), Verträge mit E-Signatur, Angebots-/Vertragsmuster; Preise in KZT mit EUR/USD zum NBK-Tageskurs. | FR-147, FR-148, FR-149, FR-152 |
| LH-M3 | Agent/Makler/Spediteur kann für den Kunden buchen und erhält eine eigene Rechnung; BIN/IIN wird geprüft; Buchungsbestätigung per E-Mail/SMS. | FR-186, FR-187, FR-189 |
| LH-M4 | Neue Kundenanfragen sind für die Disposition sofort sichtbar (Zähler im Menü), werden bestätigt, abgelehnt oder storniert und erzeugen bei Bestätigung den Auftrag. | FR-190 |
| LH-M5 | Transportversicherung: Versicherer/Police, Zertifikat je Sendung, Schadenfall aus einer Abweichung mit Betrag und Status. | FR-28, FR-153 |
| LH-M6 | Benachrichtigung über WhatsApp/Telegram. | FR-188 |

### 5.14 Kosten, Freigaben und Wirtschaftlichkeit

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-N1 | Express-Disziplin: Express nur mit Freigabe von drei Funktionen (GF, Analytik, Einkauf/Logistik) mit Frist; Expressanteil als KPI. | FR-41, FR-126, FR-154 |
| LH-N2 | Kosten: Bottom-up-Modell und Ist-Kosten-Ledger (Diesel, Werkstatt, Ausfall, Versicherung, Steuern); Entscheidung „eigene Tour / extern“ mit Zwei-Unterschriften-Gate. | FR-85, FR-125 |

### 5.15 Planung, Berichte und Ausgangsdaten

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-O1 | Planung: 7-Tage-Kapazitätsplan, Szenarien, Ressourcen; Berichte und KPI (OTIF, Auslastung, Expressanteil, Kosten je kg). | FR-38, FR-119 |
| LH-O2 | Ausgangsdaten: der beantwortete Fragenkatalog (150 Antworten) mit Validierung, Abweichungen und offenen Punkten ist in der Plattform einsehbar. | FR-35, FR-49 |

### 5.16 Schnittstellen zu externen Systemen

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-P1 | Schnittstellen: Telematik (Wialon), Bußgelder (Sergek/eGov), ESF/ESUTD, Wetter, Straßen, Kurse (NBK), Kurierdienste, Frachtbörsen, Ausschreibungen (goszakup), Adressregister, KGD; nur der Integrations-Worker hat Internetzugang. | FR-07, FR-16, FR-69, FR-90, FR-128 |
| LH-P2 | Partner-REST-API (v1) für Kunden-ERP: Slots, Angebote, Buchungen, Sendungsstatus, Webhooks mit Signatur. | FR-30, FR-128 |

### 5.17 Administration, Zugriff und Datenschutz

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-Q1 | Rollen und Rechte (Admin, Disponent, Lager, Fahrer, Auditor, Betrachter, Kunde, Partner, Management, Finanzen, Qualität) mit Hub-Trennung; Freigaben im Vier-Augen-Prinzip an Geschäftsfunktionen gebunden. | FR-14, FR-85, FR-137, FR-167 |
| LH-Q2 | Personenbezogene Daten bleiben in Kasachstan, werden verschlüsselt gespeichert (Kontext Tabelle/Spalte/Zeile), nie geloggt; Löschung/Pseudonymisierung möglich; keine externen KI-, Analyse-, CDN- oder Schriftdienste. | FR-82, FR-86, FR-89 |
| LH-Q3 | Anmeldung mit Passwort + 2FA (TOTP), Sperre nach Fehlversuchen, CSRF/CSP; jede Änderung im manipulationssicheren Audit-Log; verschlüsselte nächtliche Backups mit Wiederherstellungstest. | FR-15, FR-87, FR-129, FR-130 |

### 5.18 Bedienung, Sprachen und Erscheinungsbild

| ID | Anforderung | Bezug (FR) |
|---|---|---|
| LH-R1 | Oberfläche in Russisch, Deutsch, Englisch und Kasachisch; Daten- und Systemtexte übersetzt statt transliteriert; auf DE/EN keine kyrillischen Texte. | FR-13, FR-135, FR-170 |
| LH-R2 | Bedienbar mit Tastatur und Screenreader (WCAG 2.1 AA), auf Smartphone-Breite nutzbar, Statushinweise nicht nur über Farbe; Hilfe mit Ablaufdiagrammen und geführten Touren. | FR-17, FR-133, FR-134, FR-160 |
| LH-R3 | Markendesign umschaltbar (Olymp ↔ Kökzhol), Navigationssymbole, Versionsnummer mit Build-Zeit. | FR-177, FR-178, FR-179 |

## 6 Nichtfunktionale Anforderungen

| ID | Anforderung |
|---|---|
| NF-1 | Datenlokalisierung: Betrieb ausschließlich auf Servern in der Republik Kasachstan (Gesetz „Über personenbezogene Daten und ihren Schutz“). |
| NF-2 | Leistung: `/api/v5/act` p95 < 300 ms bei 20 Benutzern, 2 Aktionen/s und Eingang 1/s (gemessen: 80 ms). |
| NF-3 | Ladezeit: Startseite ≤ 400 KB JS gzip, Übersicht ≤ 425 KB (Ziel 350 KB nur mit Preact erreichbar – Entscheidung offen). |
| NF-4 | Verfügbarkeit: Health-Checks, Worker-Heartbeats, Alarmierung; Backup täglich 02:30 Asia/Almaty, Wiederherstellungstest. |
| NF-5 | Sicherheit: OWASP-Kontrollen, Container-Härtung, Netzisolierung, statische Prüfung (bandit), Abhängigkeitsprüfung (pip-audit, npm audit) bei jedem Commit; externer Penetrationstest vor Go-live. |
| NF-6 | Qualität: automatisierte Tests (Backend ≈ 1 560, UI 757 im Browser und gegen das echte Backend, Layout 121, Barrierefreiheit), zufällige Testreihenfolge, CI < 5 min. |
| NF-7 | Wartbarkeit: eine Datenquelle, Datenbankmigrationen (Alembic), Parität Demo ↔ Server, Änderungsregister dreisprachig. |
| NF-8 | Demo-Daten und Debug-Einstellungen nie auf einem Produktivserver; Online-Demo nur mit fiktiven Daten. |

## 7 Rahmenbedingungen

- Gesetz der RK „Über personenbezogene Daten und ihren Schutz“ (Datenlokalisierung), Steuerkodex (NDS 16 %), IS ESF / ESUTD, EDS über NCALayer.
- GDP der EAWU für Arzneimittel/Medizinprodukte, ADR (Trockeneis UN 1845, LQ), Pflicht-Medizincheck ab 01.01.2027.
- Keine Übermittlung personenbezogener Daten an externe KI-, Analyse-, CDN- oder Schriftdienste; alles selbst gehostet.

## 8 Schnittstellen (gefordert)

Wialon (Telematik), Sergek/eGov (Bußgelder), IS ESF/ESUTD, Kazhydromet/Prognose, KazAvtoZhol, NBK-Kurse, SMS-Gateways (SMSC.kz, Mobizon), Kurierdienste (CDEK, Yandex), Frachtbörsen (ATI, Lardi), goszakup, Adressregister, KGD (BIN), Partner-REST-API mit Webhooks, optional 1C.

## 9 Abnahmekriterien

- Jede Anforderung LH-… hat im Pflichtenheft eine Lösung mit Status und Testnachweis.
- Alle automatischen Tests grün (Backend, UI im Browser und gegen das echte Backend, Layout, Barrierefreiheit, Sicherheitsprüfungen).
- READY-Checkliste aus `CLAUDE.md` auf dem Produktivserver erfüllt (HTTPS, 2FA, Backup, Health-Checks, Tracking ohne Personendaten).

## 10 Offene Punkte

Siehe Pflichtenheft Kapitel „Abweichungen“ und die Ideenliste; fachlich offen: Winterkonzept, West-Reefer-Entscheidung, SLA mit KDL Olymp, Abweichungen im Fragenkatalog (FR-49), WhatsApp/Telegram (FR-188).
