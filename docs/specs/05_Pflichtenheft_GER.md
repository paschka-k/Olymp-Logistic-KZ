# Pflichtenheft – realisierte Funktionen

**Olymp Logistic Platform** · Stand: 16.10.2026 · Plattformversion 0.3.9

## 1 Zweck

Das Pflichtenheft beschreibt, **wie** die Anforderungen des Lastenhefts in der Plattform umgesetzt sind – je Anforderung LH-… die Lösung PH-…, der Ort in der Oberfläche und der Status. Grundlage ist der Code-Stand der Version 0.3.9 und das Änderungsregister (FR-01…190, BUG-01…37).

## 2 Systemüberblick

- Backend FastAPI + PostgreSQL 16, Datenbankmigrationen (Alembic), Betriebszustand je Entität mit Versionen und Delta-Antworten.
- Web-App React (Vite), Online-Demo im Browser mit fiktiven Daten und gleichem Verhalten wie der Server (Paritätstest).
- Sicherheit: Argon2id, TOTP-2FA, Sperre, CSRF, CSP/HSTS, Hub-Trennung, RBAC-Matrix, Verschlüsselung personenbezogener Daten, HMAC-verkettetes Audit.
- Betrieb: Docker-Compose-Stack, gehärtete Container, Integrations-Worker als einziger Dienst mit Internetzugang, verschlüsselte Backups, Health-Checks.
- Qualität: ≈ 1 560 Backend-Tests (auch in zufälliger Reihenfolge), 757 UI-Tests im Browser und gegen das echte Backend, 121 Layout-Tests, axe-Barrierefreiheit, CI in parallelen Teilläufen.
- Sprachen: RU, DE, EN, KK; Änderungsregister dreisprachig; Versionsnummer mit Build-Zeit.

**Architektur:** Browser → nginx (TLS, Sicherheitsheader, Ratenbegrenzung) → API (FastAPI, nur internes Netz) → PostgreSQL (getrennte Eigentümer- und Laufzeitrolle, Audit-Trigger). Der Integrations-Worker ist der einzige Dienst mit Internetzugang (Allowlist). Die Online-Demo läuft vollständig im Browser mit fiktiven Daten.

**Datenhaltung:** relationale Tabellen für Touren, Aufträge, Positionen, Packstücke, Buchungen, Kunden, Fahrer, Alarme, Kosten; Betriebszustand je Entität (JSONB) mit Versionen; versionierte Stammdaten; personenbezogene Felder verschlüsselt (Kontext Tabelle/Spalte/Zeile).

## 3 Umsetzung der funktionalen Anforderungen

### 3.1 Netz, Standorte und Stammdaten

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-A1 | LH-A1 | Ortsstamm mit IDs (KZ-AST …), Hubzuordnung nach P86, Umschlagpunkte statt Nebenlager; Linien und Ringe als Fahrpläne mit Haltestellen. | Stammdaten · Linien & Tarife · 14 Planung | FR-36, FR-37 | ✅ umgesetzt |
| PH-A2 | LH-A2 | Ortsstamm `locations.json` mit Alias-Auflösung; KATO-Prüfung und Importbefehl (`app.cli`), Prüfbericht. | Stammdaten · Eingang | FR-135, FR-169 | ✅ umgesetzt |
| PH-A3 | LH-A3 | Versionierte Stammdaten (`master_records`) mit Gültigkeit, Vier-Augen-Freigabe für Partnerstufe/-tarif, Prüfart „Planwert verifizieren“, „+ Neuer Eintrag“ für Hersteller, Fahrzeuge, Fahrer. | Stammdaten | FR-78, FR-174, FR-176 | ✅ umgesetzt |

### 3.2 Disposition und Tourplanung

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-B1 | LH-B1 | Tour-API mit Ressourcen- und Doppelbuchungsprüfung, Umplanung von Stopps, Abfahrten aus Buchungen. | 02 Disponent · Touren | FR-93, FR-94, FR-96 | ✅ umgesetzt |
| PH-B2 | LH-B2 | Freigabe-Gate `release.py` am Statusübergang „Abfahrt“; Override-Rechte `trips:override_release`, `trips:override_load`; Vermerk im Audit. | 08 KZ-Dokumente · 02 Disponent | FR-11, FR-91, FR-92, FR-114 | ✅ umgesetzt |
| PH-B3 | LH-B3 | `transitions.py`, Stornierung mit Freigabe der Kapazität und Webhook je Ereignis. | Touren · Aufträge | FR-95, FR-98 | ✅ umgesetzt |
| PH-B4 | LH-B4 | Live-Sicht `/api/v5/ops`, Versions-Polling mit Delta-Antworten, Eingang mit Routing auf die Fachbildschirme. | 01 Übersicht · Eingang | FR-71, FR-100, FR-131 | ✅ umgesetzt |

### 3.3 Beladung und Fahrzeugauswahl

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-C1 | LH-C1 | Serverseitige Ladeberechnung `loadcalc.py` mit TS-Spiegel und Paritätstest; Beladeansicht 2.0, Abfahrtsverwiegung, Packstückmaße. | 03 Beladung und Gewicht | FR-99, FR-140, FR-145, FR-146 | ✅ umgesetzt |
| PH-C2 | LH-C2 | Lkw-Finder mit vollständigem Tourkostenmodell, Mehrfahrzeug-Aufteilung, Beladereihenfolge nach Stopps. | 03 Beladung und Gewicht | FR-09, FR-139, FR-143, FR-144 | ✅ umgesetzt |

### 3.4 Sendungen, Kennzeichnung und Rückverfolgung

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-D1 | LH-D1 | Tabellen Auftragspositionen/Packstücke, server-vergebene SSCC, `/api/packages/scan`, Etiketten mit Herstellerlogo. | 04 Sendungen und Kennzeichnung | FR-01, FR-03, FR-04, FR-73 | ✅ umgesetzt |
| PH-D2 | LH-D2 | Platzabgleich je SSCC beim Beladen und in der Fahrer-App, FEFO-Hinweis. | 03 Beladung · 13 Fahrer-App | FR-05, FR-06, FR-57 | ✅ umgesetzt |
| PH-D3 | LH-D3 | Öffentliche Tracking-Seite mit Token, Ereignis-Zeitleiste, ETA je Stopp; Archiv zugestellter Sendungen. | Tracking-Link · Aufträge | FR-02, FR-112 | ✅ umgesetzt |

### 3.5 Kühlkette und Temperatur

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-E1 | LH-E1 | Sensorzuordnung je Kammer, ein gemeinsamer Alarmspeicher (ALM-n), Auswertung aller Messquellen; Simulation nur in der Demo. | 05 Thermostatus · Alarme | FR-39, FR-101, FR-102 | ✅ umgesetzt |
| PH-E2 | LH-E2 | Thermochron-Import in App und Journal, Abweichung → Qualitätsereignis. | 05 Thermostatus · Journal | FR-40, FR-58 | ✅ umgesetzt |
| PH-E3 | LH-E3 | Ein Eskalationsdienst mit Outbox, Bereitschaftsplan (Kontakte verschlüsselt), Funktion `head_security`. | Bereitschaft · Alarme | FR-104, FR-166 | ✅ umgesetzt |

### 3.6 Wetter, Straßen und Winterbetrieb

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-F1 | LH-F1 | Prognose-Adapter (Open-Meteo-kompatibel, Anbieter umschaltbar), Sperrmeldungen als Eingang mit Gültigkeit, Routenrisiko je Strecke. | 06 Wetter 3–7 Tage · Eingang | FR-16, FR-42, FR-106, FR-165 | ✅ umgesetzt |
| PH-F2 | LH-F2 | Abfahrtsverbot im Go/No-Go, Lagerzeiten in der ETA-Berechnung. | 06 Wetter · 08 KZ-Dokumente | FR-43, FR-44 | ✅ umgesetzt |
| PH-F3 | LH-F3 | Noch keine fachliche Entscheidung; nur die Regel „−45 °C“ ist umgesetzt. | — | — (Scope R116/R117) | ○ offen |

### 3.7 Sicherheit, Vorfälle und Gefahrgut

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-G1 | LH-G1 | Vorfälle vom echten Fahrer/Fahrzeug, Geozonen, Kontakte mit 1 Klick, Abschlussvermerk. | 07 Sicherheit | FR-62, FR-105 | ✅ umgesetzt |
| PH-G2 | LH-G2 | DG-Datensatz je Sendung (`dg.py`), Fristenkontrolle, QMS-Regelung. | 07 Sicherheit · Buchung | FR-10, FR-51, FR-115 | ✅ umgesetzt |

### 3.8 Dokumente und Compliance Republik Kasachstan

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-H1 | LH-H1 | Dokumentensatz je Tour, ESF aus zugestelltem Auftrag, Statusmeldungen über den Eingang; Adapter ESF/ESUTD. | 08 KZ-Dokumente | FR-12, FR-53, FR-116 | ✅ umgesetzt |
| PH-H2 | LH-H2 | Medizincheck in Schichtbeginn-Checkliste und als Go/No-Go-Bedingung (`medcheck.py`). | 13 Fahrer-App · 08 KZ-Dokumente | FR-52, FR-114 | ✅ umgesetzt |
| PH-H3 | LH-H3 | Tracker kritischer Pfad, Planwerte mit Prüfstatus, Kostenmodell mit Aufschlag. | 17 Ausgangsdaten · 16 Kosten | FR-47, FR-48, FR-174 | ✅ umgesetzt |

### 3.9 Qualität (GDP)

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-I1 | LH-I1 | Qualitätssperre `coldchain.quality.check_delivery`, Rolle „Qualität“, CAPA-Liste. | 09 Qualität | FR-25, FR-103 | ✅ umgesetzt |
| PH-I2 | LH-I2 | GDP-Qualifikation mit Status/Versicherung, Partner-Selbst-Onboarding, Prüfung bei Übergabe. | 11 Partner · Partnerportal | FR-19, FR-117, FR-172 | ✅ umgesetzt |

### 3.10 Fuhrpark und Personal

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-J1 | LH-J1 | Fuhrparkregister mit Ansichten, Kalibrierung, Aufnahme-Checkliste, Werkstatt-Tickets, Garantie-Prognose nach km. | 10 Fuhrpark | FR-27, FR-50, FR-118, FR-141, FR-157, FR-158 | ✅ umgesetzt |
| PH-J2 | LH-J2 | Verfügbarkeitskalender, Stundenkonto, Bußgeldkonto mit Weiterbelastung, Lohnexport. | 12 Personal · Fahrer · 15 Berichte | FR-08, FR-46, FR-55, FR-120, FR-122, FR-123 | ✅ umgesetzt |

### 3.11 Fahrer-App und Zustellung

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-K1 | LH-K1 | App-Bildschirm an die eigene Tour gebunden, Offline-Warteschlange, Kasachisch verfügbar. | 13 Fahrer-App | FR-52…FR-67, FR-83 | ✅ umgesetzt |
| PH-K2 | LH-K2 | ePOD im verschlüsselten lokalen Objektspeicher (Hash-Prüfung), final / vorläufig per SMS. | 13 Fahrer-App · Aufträge | FR-107, FR-108 | ✅ umgesetzt |
| PH-K3 | LH-K3 | Abdeckungsmodell (23 Abschnitte), OL1-SMS (HMAC), Zustellstatus/Quittungs-Timeout, gelernte Funklöcher aus Telematiklücken. | Netzabdeckung | FR-109, FR-110, FR-111 | ✅ umgesetzt |

### 3.12 Partner und Outsourcing

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-L1 | LH-L1 | Partnerbildschirm mit Hubfilter, gemessenes SLA, Herabstufung, Vertragsverlängerung im Vier-Augen-Prinzip, Vergleich eigene Tour / Partner. | 11 Partner | FR-20, FR-21, FR-24, FR-26, FR-29, FR-45, FR-113, FR-121 | ✅ umgesetzt |
| PH-L2 | LH-L2 | Partnerportal und Rolle `partner` umgesetzt; Übergabe mit Scan in der App ist für v6 geplant (FR-68). | Partnerportal | FR-30, FR-68, FR-172 | 🟡 teilweise |

### 3.13 Kunden: Portal, Buchung, Preise, Verträge, Versicherung

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-M1 | LH-M1 | Kundenportal v3 mit Adressbuch, Adressvalidierung, Mehrstreckenrouting, Gewichtsplausibilität, Express mit 3 Freigaben. | Transport buchen | FR-146, FR-150, FR-151, FR-154, FR-155, FR-185 | ✅ umgesetzt |
| PH-M2 | LH-M2 | Angebote (QT-…), Preislisten, Vertragsvorlagen mit NCALayer-Signatur, NBK-Kursimport. | Kunden · Buchungen · Transport buchen | FR-147, FR-148, FR-149, FR-152 | ✅ umgesetzt |
| PH-M3 | LH-M3 | Zahlerabschnitt (verschlüsselte Kontakte), Prüfziffer offline + optionale KGD-Prüfung, Nachrichten-Outbox. | Transport buchen · Kunden | FR-186, FR-187, FR-189 | ✅ umgesetzt |
| PH-M4 | LH-M4 | Buchungspult mit Statusfilter, Zähler „Buchungen“, Hilfeartikel; Demo-Tabs synchronisiert (BUG-37). | Buchungen | FR-190 | ✅ umgesetzt |
| PH-M5 | LH-M5 | Versicherungsseite mit Policenkarte (Planwert), Schadenfällen und Statusschritten; Zertifikat (Muster). | Transportversicherung | FR-28, FR-153 | ✅ umgesetzt |
| PH-M6 | LH-M6 | Offen: rechtliche Entscheidung zur Auslandsübermittlung und Einwilligung erforderlich. | — | FR-188 | ○ offen |

### 3.14 Kosten, Freigaben und Wirtschaftlichkeit

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-N1 | LH-N1 | Drei Unterschriftsfelder je Geschäftsfunktion, Frist und Benachrichtigung, KPI-Anzeige. | 17 Ausgangsdaten · Buchungen | FR-41, FR-126, FR-154 | ✅ umgesetzt |
| PH-N2 | LH-N2 | Kostenledger `costledger.py`, Gate `costs.execute`, veraltete Freigaben nach Dieselpreisänderung. | 16 Kosten | FR-85, FR-125 | ✅ umgesetzt |

### 3.15 Planung, Berichte und Ausgangsdaten

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-O1 | LH-O1 | Kapazitätsplan aus echten Daten, Simulation auf Zielflotte, Berichte mit Bußgeld-Import. | 14 Planung · 15 Berichte | FR-38, FR-119 | ✅ umgesetzt |
| PH-O2 | LH-O2 | Bildschirm 17 mit Validierung; Klärung der Abweichungen mit KDL steht aus (FR-49). | 17 Ausgangsdaten | FR-35, FR-49 | 🟡 teilweise |

### 3.16 Schnittstellen zu externen Systemen

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-P1 | LH-P1 | Adapter mit Idempotenz, Signaturprüfung, Egress-Allowlist; Wialon-Adapter vorhanden, Live-Betrieb statt Simulation für v6 geplant (FR-69). | Integrationen | FR-07, FR-16, FR-69, FR-90, FR-128 | 🟡 teilweise |
| PH-P2 | LH-P2 | API v1.3 mit Scopes je API-Schlüssel, Idempotenz, signierte Webhooks, OpenAPI-Dokumentation. | Integrationen · API-Schlüssel | FR-30, FR-128 | ✅ umgesetzt |

### 3.17 Administration, Zugriff und Datenschutz

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-Q1 | LH-Q1 | RBAC-Matrix im Backend, generierte Zugriffsdateien, Test Rolle × Aktion, Prüfung der Freigabefunktionen. | Benutzer | FR-14, FR-85, FR-137, FR-167 | ✅ umgesetzt |
| PH-Q2 | LH-Q2 | Verschlüsselung `security/crypto.py`, Schlüsselrotation, `erase-person`, selbst gehostete Schriften und Bibliotheken. | — (Systemregel) | FR-82, FR-86, FR-89 | ✅ umgesetzt |
| PH-Q3 | LH-Q3 | Argon2id, TOTP, HMAC-verkettetes Audit, Backup-Job mit MAC und externer Kopie, tiefer Health-Check. | Audit-Protokoll · Benutzer | FR-15, FR-87, FR-129, FR-130 | ✅ umgesetzt |

### 3.18 Bedienung, Sprachen und Erscheinungsbild

| PH | LH | Umsetzung | Ort | FR | Status |
|---|---|---|---|---|---|
| PH-R1 | LH-R1 | Wörterbuch + Nachrichtenbausteine, kasachischer Katalog (Muttersprachler-Prüfung ausstehend), Sprachtest in der UI-Suite. | alle Bildschirme | FR-13, FR-135, FR-170 | ✅ umgesetzt |
| PH-R2 | LH-R2 | axe-core-Prüfung in CI (beide Designs), Navigationsschublade, Hilfe mit Diagrammen/Animationen, Touren. | alle Bildschirme · Hilfe | FR-17, FR-133, FR-134, FR-160 | ✅ umgesetzt |
| PH-R3 | LH-R3 | Design-Umschalter (Tokens, selbst gehostete Schriften), Duotone/Kachel-Symbole, Versionsstempel. | Seitenleiste | FR-177, FR-178, FR-179 | ✅ umgesetzt |

## 4 Nichtfunktionale Anforderungen – Umsetzung

| ID | Umsetzung / Nachweis | Status |
|---|---|---|
| NF-1 | Datenlokalisierung: Betrieb ausschließlich auf Servern in der Republik Kasachstan (Gesetz „Über personenbezogene Daten und ihren Schutz“). | ✅ umgesetzt |
| NF-2 | Leistung: `/api/v5/act` p95 < 300 ms bei 20 Benutzern, 2 Aktionen/s und Eingang 1/s (gemessen: 80 ms). | ✅ umgesetzt |
| NF-3 | Ladezeit: Startseite ≤ 400 KB JS gzip, Übersicht ≤ 425 KB (Ziel 350 KB nur mit Preact erreichbar – Entscheidung offen). | 🟡 teilweise |
| NF-4 | Verfügbarkeit: Health-Checks, Worker-Heartbeats, Alarmierung; Backup täglich 02:30 Asia/Almaty, Wiederherstellungstest. | ✅ umgesetzt |
| NF-5 | Sicherheit: OWASP-Kontrollen, Container-Härtung, Netzisolierung, statische Prüfung (bandit), Abhängigkeitsprüfung (pip-audit, npm audit) bei jedem Commit; externer Penetrationstest vor Go-live. | 🟡 teilweise |
| NF-6 | Qualität: automatisierte Tests (Backend ≈ 1 560, UI 757 im Browser und gegen das echte Backend, Layout 121, Barrierefreiheit), zufällige Testreihenfolge, CI < 5 min. | 🟡 teilweise |
| NF-7 | Wartbarkeit: eine Datenquelle, Datenbankmigrationen (Alembic), Parität Demo ↔ Server, Änderungsregister dreisprachig. | ✅ umgesetzt |
| NF-8 | Demo-Daten und Debug-Einstellungen nie auf einem Produktivserver; Online-Demo nur mit fiktiven Daten. | ✅ umgesetzt |

## 5 Qualitätssicherung

| Prüfung | Umfang | Ergebnis 16.10.2026 |
|---|---|---|
| Backend-Tests (pytest) | ≈ 1 560 Tests, normal und in zufälliger Reihenfolge | grün |
| UI-Tests im Browser (Online-Demo) | 757 Tests RU/DE/EN/KK + 121 Layout-Tests | grün |
| UI-Tests gegen das echte Backend | 757 Tests, 6 parallele Teilläufe | grün |
| Barrierefreiheit (axe-core) | 17 Bildschirme + 13 Seiten, RU/EN, beide Designs | 0 schwerwiegende Verstöße |
| Sicherheit | bandit, pip-audit, npm audit, Kundenisolation | ohne Befund |
| Parität Demo ↔ Server | 32 Fälle, 67 Aktionen; Ladeberechnung 45 Profile | identisch |
| Lasttest | 20 Benutzer, 2 Aktionen/s + Eingang 1/s | p95 80 ms |

## 6 Betrieb und Auslieferung

Docker-Compose-Stack mit Migrationen, Secrets außerhalb des Repositories, TLS-Zertifikat, Backup täglich 02:30 Asia/Almaty mit MAC und externer Kopie; Vorschau (Online-Demo) auf GitHub Pages mit Versionsnummer und Build-Zeit; Änderungsregister in DE/EN/RU.

## 7 Abweichungen und Restpunkte

| ID | Anforderung | Status | Stand |
|---|---|---|---|
| LH-F3 | Winterkonzept für −30/−40 °C auf Mehrtagesringen (Vorkonditionierung, Heizregel) ist abzubilden, sobald fachlich entschieden. | ○ offen | Noch keine fachliche Entscheidung; nur die Regel „−45 °C“ ist umgesetzt. |
| LH-L2 | Partner arbeiten in einem eigenen Portal (nur eigene Übergaben, ePOD-Upload, Selbst-Onboarding mit GDP-Nachweis); Übergabe mit Scan in der Partner-App. | 🟡 teilweise | Partnerportal und Rolle `partner` umgesetzt; Übergabe mit Scan in der App ist für v6 geplant (FR-68). |
| LH-M6 | Benachrichtigung über WhatsApp/Telegram. | ○ offen | Offen: rechtliche Entscheidung zur Auslandsübermittlung und Einwilligung erforderlich. |
| LH-O2 | Ausgangsdaten: der beantwortete Fragenkatalog (150 Antworten) mit Validierung, Abweichungen und offenen Punkten ist in der Plattform einsehbar. | 🟡 teilweise | Bildschirm 17 mit Validierung; Klärung der Abweichungen mit KDL steht aus (FR-49). |
| LH-P1 | Schnittstellen: Telematik (Wialon), Bußgelder (Sergek/eGov), ESF/ESUTD, Wetter, Straßen, Kurse (NBK), Kurierdienste, Frachtbörsen, Ausschreibungen (goszakup), Adressregister, KGD; nur der Integrations-Worker hat Internetzugang. | 🟡 teilweise | Adapter mit Idempotenz, Signaturprüfung, Egress-Allowlist; Wialon-Adapter vorhanden, Live-Betrieb statt Simulation für v6 geplant (FR-69). |
| NF-3 | Ladezeit: Startseite ≤ 400 KB JS gzip, Übersicht ≤ 425 KB (Ziel 350 KB nur mit Preact erreichbar – Entscheidung offen). | 🟡 teilweise |  |
| NF-5 | Sicherheit: OWASP-Kontrollen, Container-Härtung, Netzisolierung, statische Prüfung (bandit), Abhängigkeitsprüfung (pip-audit, npm audit) bei jedem Commit; externer Penetrationstest vor Go-live. | 🟡 teilweise |  |
| NF-6 | Qualität: automatisierte Tests (Backend ≈ 1 560, UI 757 im Browser und gegen das echte Backend, Layout 121, Barrierefreiheit), zufällige Testreihenfolge, CI < 5 min. | 🟡 teilweise |  |

## Anhang – Umgesetzte Änderungsanträge mit Datum

### Konzept v2→v3 · Änderungsanträge Runde 1

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-01 | Barcodescanner im Suchfeld | Konzept v3 |
| FR-02 | Archiv zugestellter Sendungen | Konzept v3 |
| FR-03 | Track & Trace je SSCC | Konzept v3 |
| FR-04 | GS1-128-Druck und ZPL-Export | Konzept v3 |
| FR-05 | Warnung bei kurzer Resthaltbarkeit (FEFO) | Konzept v3 |
| FR-06 | Beladung nach Packstück (SSCC) statt nach Auftrag | Konzept v3 |
| FR-07 | Automatischer Import von Bußgeldbescheiden („Sergek“, eGov) | Konzept v3 |
| FR-08 | Lenkzeit aus dem Fahrtschreiber | Konzept v3 |
| FR-09 | Fahrzeugauswahl für eine Eiltour | Konzept v3 |
| FR-10 | Fristenkontrolle für ADR-Bescheinigung und Führerschein | Konzept v3 |
| FR-11 | Freigabesperre bei abgelaufener Kalibrierung und Versicherung | Konzept v3 |
| FR-12 | Echte TTN, ESF, SNT und elektronische Signatur (EDS) | Konzept v3 |
| FR-13 | Kasachische Version von Oberfläche und Dokumenten | Konzept v3 |
| FR-14 | Rollen und Zugriffsrechte | Konzept v3 |
| FR-15 | Datenhaltung und Backend | Konzept v3 |
| FR-16 | Echte Quellen für Prognose und Straßensperrungen | Konzept v3 |
| FR-17 | Tastatur und Screenreader | Konzept v3 |
| FR-18 | UI-Tests DE/EN und Regression in der CI | Konzept v3 |

### Konzept v3 · Runde 2: Partner & Übergabe

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-19 | GDP Pflicht für Übergabe 2–8 °C | Konzept v3 |
| FR-20 | Kapazitätsprüfung des Partners bei Übergabe | Konzept v3 |
| FR-21 | Übergabe ändert Tourplan, Dokumente und Track & Trace | Konzept v3 |
| FR-22 | Streckenabdeckung durch Partner | Konzept v3 |
| FR-23 | Kühlaggregat-Service auf jeder Kühlkettenstrecke | Konzept v3 |
| FR-24 | Automatische Herabstufung nach SLA | Konzept v3 |
| FR-25 | Sperren mit dem Modul „Qualität“ verknüpfen | Konzept v3 |
| FR-26 | Verlängerung von Partnerverträgen | Konzept v3 |
| FR-27 | Werkstattauftrag mit ETA, Kosten und Fahrzeugstatus | Konzept v3 |
| FR-28 | Haftung und Versicherung bei Übergabe | Konzept v3 |
| FR-29 | Partnertarife und Vergleich „eigene Tour / Partner“ | Konzept v3 |
| FR-30 | Partnerportal / API | Konzept v3 |
| FR-32 | Hubfilter auf dem Bildschirm „Partner“ | Konzept v3 |
| FR-33 | Notfall ↔ Partner: Kontakte mit 1 Klick | Konzept v3 |
| FR-34 | Statusfarben: grün, gelb, rot | Konzept v3 |

### Konzept v4–v5 · Runde 3: Fragenkatalog

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-35 | Bildschirm „Ausgangsdaten“ mit Validierung des Fragenkatalogs | Konzept v4/v5 |
| FR-36 | 23 Städte und Hubzuordnung nach P86 | Konzept v4/v5 |
| FR-37 | Umschlagpunkte statt Nebenlager (schließt FR-31) | Konzept v4/v5 |
| FR-38 | Simulation auf Zielflotte 4 Fahrzeuge 10-t-Klasse | Konzept v4/v5 |
| FR-39 | Passive Kühlkette: Container und Logger | Konzept v4/v5 |
| FR-40 | Thermochron-Import bei Annahme und Journal | Konzept v4/v5 |
| FR-41 | Express-Freigabe mit 3 Unterschriften + Anteils-KPI | Konzept v4/v5 |
| FR-42 | Straßensperrungen aus KazAvtoZhol | Konzept v4/v5 |
| FR-43 | Regel −45 °C: Abfahrtsverbot | Konzept v4/v5 |
| FR-44 | Lagerzeiten 9–17 in der ETA | Konzept v4/v5 |
| FR-45 | Reale Frachtführer: GarantA, KazExpress, KazGen, SpezAvto | Konzept v4/v5 |
| FR-46 | 6-Tage-Woche, Sonntag Wartung; 7 Fahrer auf 4 Fahrzeuge | Konzept v4/v5 |
| FR-47 | Selbstkosten + 5 % und Verrechnungspreise | Konzept v4/v5 |
| FR-48 | Tracker kritischer Pfad | Konzept v4/v5 |
| FR-50 | Prognose Garantieende nach Kilometern | Konzept v4/v5 |
| FR-51 | Gefahrgutbeauftragter und QMS-Regelung | Konzept v4/v5 |

### Konzept v5 · Fahrer-App

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-52 | Schichtbeginn: Medizincheck und Abfahrtskontrolle per Checkliste | Konzept v5 |
| FR-53 | Elektronisches Fahrtenblatt mit km-Stand und Kraftstoff | Konzept v5 |
| FR-54 | Tourdokumente in der App | Konzept v5 |
| FR-55 | Lenkzeit-Timer 4,5 h / 9 h und Fahrerwechsel | Konzept v5 |
| FR-56 | Routenpunkte mit Fenster 9–17, Wetter und Sperrungen | Konzept v5 |
| FR-57 | SSCC-Scan bei Entladung und Stückabgleich | Konzept v5 |
| FR-58 | Thermochron bei Annahme aus der App | Konzept v5 |
| FR-59 | Ausnahmen: Schaden, Fehlmenge, Annahmeverweigerung | Konzept v5 |
| FR-60 | Retouren: Thermoboxen, Leergut, Reklamationen, Verlagerungen | Konzept v5 |
| FR-61 | Tankung: Liter, Preis, km-Stand, Beleg | Konzept v5 |
| FR-62 | Vorfälle: SOS, Panne, Unfall, Sperrung, Verspätung | Konzept v5 |
| FR-63 | Disponentennachrichten mit Lesebestätigung | Konzept v5 |
| FR-64 | Bußgeldmitteilung an den Fahrer | Konzept v5 |
| FR-65 | Schichtende: km-Stand und Mängel | Konzept v5 |
| FR-66 | Profil: Berechtigungen und Verdienst | Konzept v5 |
| FR-67 | Offline-Warteschlange und Synchronisation | Konzept v5 |

### Eine Datenquelle & Architektur

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-71 | v5-Betriebsbildschirme aus echten DB-Touren/-Aufträgen speisen | 11.10.2026…12 (Wellen 1–5) |
| FR-72 | Kollision der Tournummern zwischen DB und Referenz beseitigen | 11.10.2026…12 (Wellen 1–5) |
| FR-73 | Auftragspositionen, Packstücke und SSCC als eigene Tabellen | 11.10.2026…12 (Wellen 1–5) |
| FR-74 | Betriebszustand v5 aus einem JSON-Dokument in Tabellen verlagern | 15.10.2026 |
| FR-75 | Versionierte Dokumenthistorie und Archivtabellen statt stiller Listenkürzung | 11.10.2026…12 (Wellen 1–5) |
| FR-76 | Festes Szenariodatum durch ein Server-Geschäftsdatum ersetzen | 11.10.2026…12 (Wellen 1–5) |
| FR-77 | Echte Datenbankmigrationen (Alembic) statt `create_all` | 11.10.2026…12 (Wellen 1–5) |
| FR-78 | Referenz-Stammdaten bearbeitbar und versioniert machen | 11.10.2026…12 (Wellen 1–5) |
| FR-79 | Seed über Service-Regeln plus Konsistenzprüfung | 11.10.2026…12 (Wellen 1–5) |
| FR-80 | Kollisionsfreie Belegnummern | 11.10.2026…12 (Wellen 1–5) |

### Sicherheit & Datenschutz

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-81 | Serverseitige Hub- und Rollenprojektion der Antworten von `/api/v5/state` und `/act` | 11.10.2026…12 (Wellen 1–5) |
| FR-82 | Partnerkontakte und Personaldaten aus der Referenz-Payload entfernen | 11.10.2026…12 (Wellen 1–5) |
| FR-83 | Fahrer-App an die eigene Tour des Fahrers binden | 11.10.2026…12 (Wellen 1–5) |
| FR-84 | Keine simulierte Telemetrie und keine Alarm-Simulationsknöpfe im Produktivbetrieb | 11.10.2026…12 (Wellen 1–5) |
| FR-85 | Fachrollen für Freigaben; Unterschriftsfelder an die Freigeberrolle binden | 15.10.2026 |
| FR-86 | Rotation des `data_key` und Neuverschlüsselungs-Job umsetzen | 11.10.2026…12 (Wellen 1–5) |
| FR-87 | Aggregiertes Audit abgewiesener eingehender Anfragen | 11.10.2026…12 (Wellen 1–5) |
| FR-88 | Dokumentiertes Bereinigen von `inbound_nonce` umsetzen | 11.10.2026…12 (Wellen 1–5) |
| FR-89 | Personennamen aus `v5_doc` heraushalten (oder verschlüsseln) und Löschung unterstützen | 11.10.2026…12 (Wellen 1–5) |
| FR-90 | Persistente Idempotenz für externe Ereignisse | 11.10.2026…12 (Wellen 1–5) |

### Tourablauf, Disposition & Go/No-Go-Freigabe

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-91 | Go/No-Go-Freigabe beim echten Abfahrtsübergang erzwingen | 11.10.2026…12 (Wellen 1–5) |
| FR-92 | Fest codierte und textbasierte Freigabe-Gates durch Datenprüfungen ersetzen | 11.10.2026…12 (Wellen 1–5) |
| FR-93 | Serverseitige Ressourcenprüfung und Doppelbuchungsprüfung | 11.10.2026…12 (Wellen 1–5) |
| FR-94 | Bestehende Touren bearbeiten, umplanen und Zuordnungen lösen | 11.10.2026…12 (Wellen 1–5) |
| FR-95 | Auftragsstornierung konsistent mit Stopp und Buchung machen | 11.10.2026…12 (Wellen 1–5) |
| FR-96 | Gebuchte Abfahrt in den Auftrag übernehmen und Touren je Abfahrt planen | 11.10.2026…12 (Wellen 1–5) |
| FR-97 | Abfahrtsausnahmen und ein einheitlicher Buchungshorizont | 11.10.2026…12 (Wellen 1–5) |
| FR-98 | Fehlende Statusübergänge vervollständigen | 11.10.2026…12 (Wellen 1–5) |
| FR-99 | Serverseitige Ladeberechnung für jede Tour und jedes Fahrzeug | 11.10.2026…12 (Wellen 1–5) |
| FR-100 | „Touren heute“ und Alarmzähler korrigieren | 11.10.2026…12 (Wellen 1–5) |

### Kühlkette, Alarme & Qualität

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-101 | Ein gemeinsamer Speicher für Alarme und Vorfälle | 11.10.2026…12 (Wellen 1–5) |
| FR-102 | Sensorzuordnung je Kammer und Alarmauswertung für alle Messquellen | 11.10.2026…12 (Wellen 1–5) |
| FR-103 | Qualitätssperre für von einer Abweichung betroffene Aufträge | 11.10.2026…12 (Wellen 1–5) |
| FR-104 | Ein Eskalationsdienst für jedes Ereignis der Stufe 3 | 11.10.2026…12 (Wellen 1–5) |
| FR-105 | SOS vom echten Fahrer/Fahrzeug; expliziter Hub; Pflicht-Abschlussvermerk | 11.10.2026…12 (Wellen 1–5) |
| FR-106 | Echter Prognoseimport statt eines Aktualisierungszeitstempels | 11.10.2026…12 (Wellen 1–5) |

### Zustellung, Fahrer-App, Netzabdeckung & SMS

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-107 | ePOD der Fahrer-App mit Stoppzustellung und Auftragsstatus verbinden | 11.10.2026…12 (Wellen 1–5) |
| FR-108 | ePOD mit rechtlich verwertbaren Nachweisen | 11.10.2026…12 (Wellen 1–5) |
| FR-109 | Alle Fahrzeuge über Telematik überwachen, nicht nur über die App | 11.10.2026…12 (Wellen 1–5) |
| FR-110 | Zustellstatus und Quittungs-Timeout für Disponenten-SMS | 11.10.2026…12 (Wellen 1–5) |
| FR-111 | Reale Funklöcher aus Telematiklücken lernen | 11.10.2026…12 (Wellen 1–5) |
| FR-112 | ETA je Stopp und Ereignis-Zeitleiste im Tracking | 11.10.2026…12 (Wellen 1–5) |
| FR-113 | Partnerübergabe in Aufträgen, Stopps und Tracking abbilden | 11.10.2026…12 (Wellen 1–5) |

### Compliance & Staatsdokumente

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-114 | Vorfahrt-Medizincheck vor dem 01.01.2027 erzwingen | 11.10.2026…12 (Wellen 1–5) |
| FR-115 | Gefahrgut- und Trockeneisdaten je Sendung | 11.10.2026…12 (Wellen 1–5) |
| FR-116 | ESF aus dem zugestellten Auftrag erzeugen und eingehende Partnerrechnungen erfassen | 11.10.2026…12 (Wellen 1–5) |
| FR-117 | GDP-Nachweise für Partnerstrecken | 11.10.2026…12 (Wellen 1–5) |

### Ressourcen, Personal, Partner & Planung

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-118 | Werkstatttickets steuern Fahrzeugverfügbarkeit und Slotkapazität | 11.10.2026…12 (Wellen 1–5) |
| FR-119 | 7-Tage-Kapazitätsplan aus echten Daten berechnen | 11.10.2026…12 (Wellen 1–5) |
| FR-120 | Lenkzeitkonto der Fahrer und datenbasierte Eilzuordnung | 11.10.2026…12 (Wellen 1–5) |
| FR-121 | Gemessenes Partner-SLA, Tageskapazität und kontrollierte Vertragsverlängerungen | 11.10.2026…12 (Wellen 1–5) |
| FR-122 | Bußgelder dem Fahrer zum Tatzeitpunkt zuordnen | 11.10.2026…12 (Wellen 1–5) |
| FR-123 | Bußgeldkonto mit Weiterbelastungsprozess | 11.10.2026…12 (Wellen 1–5) |
| FR-124 | Echter Nachrichtenkanal zu Fahrern und Buchhaltung | 11.10.2026…12 (Wellen 1–5) |

### Finanzen, Vertrieb & Partner-API

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-125 | Ist-Kosten-Ledger neben dem Bottom-up-Modell | 11.10.2026…12 (Wellen 1–5) |
| FR-126 | Frist, Benachrichtigung und Wirkung für Express-Freigaben | 11.10.2026…12 (Wellen 1–5) |
| FR-127 | Strukturierte Ausschreibungs-Leads, Aufgaben und Onboarding gewonnener Kunden | 11.10.2026…12 (Wellen 1–5) |
| FR-128 | Strikte Idempotenz, GDP-Daten und Lebenszyklus-Endpunkte | 11.10.2026…12 (Wellen 1–5) |

### Betrieb, UX, i18n, Tests & Performance

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-129 | Zuverlässiger Backup-Job: pipefail, separater MAC-Schlüssel, Zeitplan, externe Kopie, Fehleralarm | 11.10.2026…12 (Wellen 1–5) |
| FR-130 | Worker-Zeitplanung je Task, Heartbeats, tiefer Health-Check und Alarmierung | 11.10.2026…12 (Wellen 1–5) |
| FR-131 | Dokumentänderungen an offene Clients pushen oder pollen | 11.10.2026…12 (Wellen 1–5) |
| FR-132 | Ein Navigationsmodell: doppelte Menüpunkte entfernen und Bildschirmnummerierung korrigieren | 11.10.2026…12 (Wellen 1–5) |
| FR-133 | Navigationsschublade für Smartphone-Breite und Viewport-/Überlappungstests in der UI-Suite | 11.10.2026…12 (Wellen 1–5) |
| FR-134 | Navigation als Links, Skip-Link, Statushinweise nicht nur über Farbe | 15.10.2026 |
| FR-135 | Orts-/Standortstamm mit IDs; kasachische UI; Transliteration externer Texte | 15.10.2026 |
| FR-136 | 494er-Suite in der CI gegen das echte Backend; Parität des Demo-Spiegels | 11.10.2026…12 (Wellen 1–5) |
| FR-137 | Bildschirm- und Hilfeberechtigungen aus dem Backend generieren; vollständiger Test Rolle × Aktion | 11.10.2026…12 (Wellen 1–5) |
| FR-138 | 2-s-Live-Tick vom App-Baum isolieren; Bildschirme per Code-Splitting; Bundle-Budget | 11.10.2026…12 (Wellen 1–5) |

### Angeforderte Funktionen (11./12.10.2026)

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-139 | Aufteilung auf mehrere Fahrzeuge | 12.10.2026 |
| FR-140 | Beladeansicht 2.0 | 12.10.2026 |
| FR-141 | Fahrzeugkalibrierung | 12.10.2026 |
| FR-142 | Stammdaten Streckenbeschränkungen | 12.10.2026 |
| FR-143 | Vollständiges Tourkostenmodell in der Fahrzeugsuche | 12.10.2026 |
| FR-144 | Beladereihenfolge | 12.10.2026 |
| FR-145 | Abfahrtsverwiegung | 12.10.2026 |
| FR-146 | Packstückmaße | 12.10.2026 |
| FR-147 | Angebote | 12.10.2026 |
| FR-148 | Kundenpreislisten | 15.10.2026 |
| FR-149 | Vertragsmanagement | 13.10.2026 |
| FR-150 | Kundenadressbuch | 12.10.2026 |
| FR-151 | Adressvalidierung | 12.10.2026 |
| FR-152 | Tägliche Wechselkurse | 12.10.2026 |
| FR-153 | Versicherungsmanagement | 15.10.2026 |
| FR-154 | Express-Sendung aus dem Kundenportal | 12.10.2026 |
| FR-155 | Mehrstreckenrouting über Hubs | 12.10.2026 |
| FR-156 | KZ-Arbeitstagekalender | 12.10.2026 |
| FR-157 | Checkliste für die Fahrzeugaufnahme | 12.10.2026 |
| FR-158 | Ansichten des Fuhrparkregisters | 12.10.2026 |
| FR-159 | Einstiegsseite Register & Administration | 12.10.2026 |
| FR-160 | Geführte Touren in der Hilfe | 12.10.2026 |

### Lücken aus der Umsetzung

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-161 | Änderungsregister | 12.10.2026 |
| FR-162 | Demo-Snapshot aus dem Seed in der CI | 13.10.2026 |
| FR-163 | Ein Nummernschema in Demo und Produktion | 15.10.2026 |
| FR-164 | Regressionssuite Kundenisolation | 12.10.2026 |
| FR-165 | Prognoseanbieter | 15.10.2026 |
| FR-166 | Oberfläche für den Bereitschaftsplan | 12.10.2026 |
| FR-167 | Abdeckungsprüfung der Freigabefunktionen | 12.10.2026 |
| FR-168 | Testisolation | 15.10.2026 |
| FR-169 | KATO-Verifizierung | 15.10.2026 |
| FR-170 | Vervollständigung der kasachischen UI | 15.10.2026 |
| FR-171 | Sharding der UI-Suite | 16.10.2026 |
| FR-172 | Demo-Partnerkonto und Selbst-Onboarding von Partnern | 12.10.2026 |
| FR-173 | Oberflächen für bestehende APIs | 12.10.2026 |
| FR-174 | Rechts-/Steuer-Prüfpunkte | 12.10.2026 |
| FR-175 | Deep Links | 12.10.2026 |

### Angeforderte Funktionen (12.10.2026)

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-176 | Herstellerlogos auf Bildschirm 04 | 12.10.2026 |
| FR-177 | Versionsnummer und Build-Datum/-Zeit in der Versionsanzeige | 12.10.2026 |

### Angeforderte Funktionen (13.10.2026)

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-178 | Design-Umschalter: aktuelles Design ↔ Kökzhol-Markendesign | 13.10.2026 |
| FR-179 | Navigationssymbole: Duotone (Olymp-Design) und Kacheln (Kökzhol-Design) | 13.10.2026 |
| FR-180 | Eine Kennzeichnung für Fehler: BUG-xx (kein B-xx mehr) | 13.10.2026 |

### Angeforderte Funktionen (15.10.2026)

| FR | Funktion | Umgesetzt |
|---|---|---|
| FR-185 | Gewichtsplausibilität einer Buchung (Warnungen, nie blockierend) | 15.10.2026 |
| FR-186 | Buchende / zahlende Partei (Agent, Makler, Spediteur) mit eigener Rechnung | 15.10.2026 |
| FR-187 | Buchungsbestätigung per E-Mail / SMS | 15.10.2026 |
| FR-189 | BIN-/IIN-Prüfung und Datenübernahme (Prüfziffer offline, optionale KGD-Onlineprüfung) | 15.10.2026 |
| FR-190 | Zähler „Buchungen“ im Menü für neue Anfragen + Hilfeartikel | 15.10.2026 |
