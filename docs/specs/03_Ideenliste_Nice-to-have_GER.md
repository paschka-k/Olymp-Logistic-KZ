# Offene Ideen und Nice-to-have

**Olymp Logistic Platform** · Stand: 16.10.2026 · Plattformversion 0.3.9

Sammlung offener Ideen, Wünsche und noch nicht beauftragter Erweiterungen – Quelle: Gespräche, Wettbewerbsanalyse (Wareneingang, 16.10.2026), Projekt-Scope, Roadmap und offene Änderungsanträge. Priorität aus Projektsicht, Aufwand S ≤ 1 Tag · M ≤ 1 Woche · L > 1 Woche. Eine Idee wird erst nach Freigabe zu einem Änderungsantrag (FR).

## Priorität: hoch

| ID | Idee | Nutzen | Quelle | Aufwand |
|---|---|---|---|---|
| I-1 | Wareneingang Hub: Eingangsliste je Lager (Richtung, Job, Prio, Status-Chips) | Überblick über alle ankommenden Fahrzeuge je Lager | Wettbewerbsanalyse 16.10. | M |
| I-3 | Abholung im Vorlauf (Abholdatum, Spediteur, Kennzeichen „folgt“, kg/m³/Stk je Stelle) | Planbarer Wareneingang | Wettbewerbsanalyse 16.10. | M |
| I-4 | Rampen-Zeitfenster (Be-/Entladen 30 min, Fixtermin) | Weniger Wartezeit am Tor | Wettbewerbsanalyse 16.10. | M |
| I-5 | Überzogene Standzeit rot mit Mouseover (Zeitraum, Minuten); Verzögerung ja/nein | Sofort sichtbare Engpässe | Wettbewerbsanalyse 16.10. | S |
| I-7 | Torcheck mit Kühlkette: Ist-Temperatur, Logger übernehmen, SSCC-Abgleich starten | GDP-Nachweis direkt am Eingang | Wettbewerbsanalyse 16.10. | M |
| I-12 | Auswertung Überschneidung Express ↔ Temperatursendungen | Absicherung von 78 % der geplanten Ersparnis | Scope · Validierung 10.10. | S |
| I-13 | SLA-Messung und Pönalen für den Hauptkunden KDL Olymp | Schutz bei 100 % Klumpenrisiko | Scope · offene Kernpunkte | M |
| I-14 | Winterkonzept als Regelwerk (Vorkonditionierung, Heizfenster, Winterzuschlag) | Sichere Kühlkette bei −30/−40 °C | Scope R116/R117 | M |
| I-16 | Wialon/Tachograf live statt Simulation (FR-69) | Echte GPS-, Temperatur- und Lenkzeitdaten | FR-69 | M |
| I-23 | Externer Penetrationstest vor Go-live | Unabhängige Sicherheitsbestätigung | ROADMAP · SECURITY | M |

## Priorität: mittel

| ID | Idee | Nutzen | Quelle | Aufwand |
|---|---|---|---|---|
| I-2 | Absender/Entladestellen als nummerierte Chips mit Klartext bei Mouseover, Farbe je Stand | Kompakte Liste, Details ohne Klick | Wettbewerbsanalyse 16.10. | S |
| I-6 | Standgeld automatisch in ₸ berechnen und in 16 Kosten buchen | Kosten von Wartezeiten transparent, weiterbelastbar | Wettbewerbsanalyse 16.10. | S |
| I-8 | Gespeicherte Ansichten, Spaltenfilter, Export in Listen | Schnelleres Arbeiten für Disposition und Lager | Wettbewerbsanalyse 16.10. | M |
| I-11 | WhatsApp/Telegram-Benachrichtigungen nach rechtlicher Freigabe (FR-188) | Bevorzugte Kanäle der Kunden in KZ | FR-188 | M |
| I-15 | 1C:Fuhrpark / 1C:Sklad-Schnittstelle | Keine Doppelerfassung in Buchhaltung und Lager | Scope Fahrzeugkonfiguration | L |
| I-17 | Übergabe an Partner mit Scan in der App (FR-68) | Lückenlose Kette bei Outsourcing-Strecken | FR-68 | M |
| I-18 | PIN-Login für Fahrer, Gerät unter MDM (FR-70) | Einfacher Schichtstart, gesicherte Geräte | FR-70 | M |
| I-19 | Native Fahrer-App (Android zuerst) mit Offline-SMS | Robuster Betrieb in Funklöchern | ROADMAP | L |
| I-22 | WebAuthn/FIDO2-Schlüssel für Administratoren | Phishing-resistente Anmeldung | ROADMAP | S |
| I-24 | KGD-Onlineprüfung aktivieren (Schnittstelle prüfen, Schlüssel beantragen) | Automatische Firmendaten bei BIN-Eingabe | FR-189 | S |
| I-26 | Muttersprachliche Prüfung der kasachischen Texte (≈ 2 100 markierte Texte) | Professionelle KK-Oberfläche | FR-170 | M |
| I-27 | Abgrenzung 21 Städte ↔ 27 Laborkomplexe ↔ 600+ Abnahmestellen, Scheskasgan in die Städtetabelle | Vollständige Empfängerstruktur | Scope | S |

## Priorität: niedrig

| ID | Idee | Nutzen | Quelle | Aufwand |
|---|---|---|---|---|
| I-9 | UI-Laufzeit Preact statt React (Bundle −180 KB, FR-138) | Ladeziel 350 KB erreichbar | FR-138 | L |
| I-10 | CI-UI-Teilläufe im Playwright-Container (CI < 5 min, FR-171) | Schnellere Rückmeldung bei jeder Änderung | FR-171 | S |
| I-20 | Satellitenkanal für Strecken ohne Netz | Kontakt auch auf dem Westring | ROADMAP | L |
| I-21 | KI-Assistent (Chat/Sprache) nur mit in KZ gehostetem Modell, nur öffentliche Inhalte | Antworten rund um die Uhr | ROADMAP Phase 2 | L |
| I-25 | Restliche 11 Herstellerlogos liefern und hochladen | Einheitliche Kennzeichnung auf Bildschirm 04 | FR-176 | S |
| I-28 | Rückladungs-/Beiladungsbörse für West- und Südstrecke | Zusatzerlös auf leeren Rückwegen | Scope Netz | M |

## Offene Änderungsanträge (bereits im Register)

| FR | Titel | Status |
|---|---|---|
| FR-49 | Abweichungen im Fragenkatalog mit KDL klären | offene Frage |
| FR-68 | Übergabe an Partner mit Scan in der App | geplant |
| FR-69 | Wialon und Tachograf statt Simulation | geplant |
| FR-70 | PIN-Login und Rolle „Fahrer“ | geplant |
| FR-138 | 2-s-Live-Tick vom App-Baum isolieren; Bildschirme per Code-Splitting; Bundle-Budget | teilweise |
| FR-171 | Sharding der UI-Suite | teilweise |
| FR-188 | WhatsApp-/Telegram-Benachrichtigungen – rechtliche Entscheidung zu Auslandsübermittlung und Kundeneinwilligung nötig | offene Frage |
