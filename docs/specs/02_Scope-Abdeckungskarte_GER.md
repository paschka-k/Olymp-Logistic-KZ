# Abdeckungskarte – Projekt-Scope ↔ Plattform

**Logistik Kasachstan / Olymp Logistic Platform** · Stand: 16.10.2026 · Plattformversion 0.3.9

Die Karte ordnet jedes Element des Projekt-Scopes (Dokument „Scope of Project — Logistik Kasachstan“, Stand 07.–10.10.2026) der Plattform zu: ✅ abgedeckt · 🟡 teilweise · ○ offen. Offene Punkte verweisen auf die Ideenliste (I-…) oder offene Änderungsanträge.

## 1 Zusammenfassung

| Status | Elemente | % |
|---|---|---|
| ✅ umgesetzt | 21 | 70 % |
| 🟡 teilweise | 5 | 17 % |
| ○ offen | 4 | 13 % |
| Σ | 30 | 100 % |

## 2 Strukturkarte

```
Logistik Kasachstan
├── Auftraggeber & Projektziel
│   ├── ✅ Eigene Logistikgesellschaft für KDL Olymp (Inlandsdistribution)
│   ├── ✅ Fremdfracht anderer Anbieter (~10 %)
│   └── 🟡 Empfängerstruktur der Gruppe (Labore, Zentren, Apotheken)
├── Netz & Standorte
│   ├── ✅ Vier Routenringe + Magistrale, Hubs Astana/Almaty
│   ├── ✅ 21 Empfängerstädte, Hubzuordnung
│   ├── ✅ Scheskasgan / Makinsk über Partner bzw. Kurier
│   ├── 🟡 Atyrau-Querströme (P86)
│   └── ✅ Tagesleistung 630 km, 7 Fahrer auf 4 Fahrzeuge
├── Warenstruktur & Temperaturklassen
│   ├── ✅ 73,6 t/Monat Sammelgut, Ø 8,2 kg je Packstück
│   ├── ✅ 2–8 °C (77 %), −20 °C (~6 %), 15–25 °C
│   └── ✅ 2–8 °C darf nicht einfrieren
├── Klima & Rahmenbedingungen
│   ├── ✅ −45 °C bis +52 °C, Buran-Risiko
│   └── ○ Winterkonzept für −30/−40 °C (R116/R117)
├── Fahrzeugkonfiguration
│   ├── ✅ 4 Fahrzeuge 10-t-Klasse, Isotherm + passive Thermocontainer + Logger
│   ├── 🟡 Wialon auf allen Fahrzeugen
│   ├── ○ 1C:Fuhrpark / 1C:Sklad-Austausch
│   └── ✅ Garantie ohne km-Limit, Laufleistung 126–169 Tkm/Jahr
├── Zeitplan & Wirtschaftlichkeit
│   ├── ✅ Start Magistrale Mitte Dezember 2026, Kritischer Pfad
│   ├── ✅ Selbstkosten + 5 %, Verrechnungspreise
│   ├── ✅ Express-Disziplin (78 % der Ersparnis)
│   ├── 🟡 Überschneidung Express ↔ Temperatursendungen messen
│   └── ✅ Outsourcing parallel als Rückfallebene
├── Kühlkette West & Cross-Docking
│   ├── ✅ Thermobox 2 Tage, Öffnung nur beim Cross-Docking
│   ├── ○ West-Lkw als Reefer oder Langzeitboxen – Entscheidung
│   └── ○ Wareneingang / Cross-Dock in den Hubs (Audit beider Läger)
├── Vertrag & SLA mit KDL Olymp
│   └── 🟡 Vertrag, Mindestmengen, SLA, Pönalen
└── Compliance Republik Kasachstan
    ├── ✅ TTN, ESF, SNT, EDS; Medizincheck ab 01.01.2027
    ├── ✅ Gefahrgut (ADR), Trockeneis UN 1845
    ├── ✅ GDP für Arzneimittel und Medizinprodukte
    └── ✅ Personendaten in KZ, verschlüsselt
```

## 3 Abdeckung im Detail

### Auftraggeber & Projektziel

| Scope-Element | Status | Abdeckung in der Plattform |
|---|---|---|
| Eigene Logistikgesellschaft für KDL Olymp (Inlandsdistribution) | ✅ umgesetzt | Gesamte Plattform: Disposition, Fuhrpark, Personal, Kunden, Kosten |
| Fremdfracht anderer Anbieter (~10 %) | ✅ umgesetzt | Kundenportal, Partner-API, CRM mit Leads/Ausschreibungen, Preislisten |
| Empfängerstruktur der Gruppe (Labore, Zentren, Apotheken) | 🟡 teilweise | Standorte/Adressbuch vorhanden; Abgrenzung 18/21 Standorte ↔ 600+ Abnahmestellen offen |

### Netz & Standorte

| Scope-Element | Status | Abdeckung in der Plattform |
|---|---|---|
| Vier Routenringe + Magistrale, Hubs Astana/Almaty | ✅ umgesetzt | Linien & Tarife, 14 Planung, 02 Disponent |
| 21 Empfängerstädte, Hubzuordnung | ✅ umgesetzt | Ortsstamm mit KATO, Hubzuordnung P86 |
| Scheskasgan / Makinsk über Partner bzw. Kurier | ✅ umgesetzt | 11 Partner (SpezAvto), Kurier-Adapter |
| Atyrau-Querströme (P86) | 🟡 teilweise | Routing über Hub vorhanden; fachliche Ringzuordnung offen |
| Tagesleistung 630 km, 7 Fahrer auf 4 Fahrzeuge | ✅ umgesetzt | 12 Personal, Lenkzeitkonto, 14 Planung |

### Warenstruktur & Temperaturklassen

| Scope-Element | Status | Abdeckung in der Plattform |
|---|---|---|
| 73,6 t/Monat Sammelgut, Ø 8,2 kg je Packstück | ✅ umgesetzt | Packstücke/SSCC, Ladeberechnung, 17 Ausgangsdaten |
| 2–8 °C (77 %), −20 °C (~6 %), 15–25 °C | ✅ umgesetzt | Temperaturklassen je Auftrag/Kammer, 05 Thermostatus |
| 2–8 °C darf nicht einfrieren | ✅ umgesetzt | Unterschreitungsalarm, Winterwarnung in 06 Wetter |

### Klima & Rahmenbedingungen

| Scope-Element | Status | Abdeckung in der Plattform |
|---|---|---|
| −45 °C bis +52 °C, Buran-Risiko | ✅ umgesetzt | 06 Wetter 3–7 Tage, Straßensperrungen, Regel −45 °C |
| Winterkonzept für −30/−40 °C (R116/R117) | ○ offen | Fachentscheidung ausstehend |

### Fahrzeugkonfiguration

| Scope-Element | Status | Abdeckung in der Plattform |
|---|---|---|
| 4 Fahrzeuge 10-t-Klasse, Isotherm + passive Thermocontainer + Logger | ✅ umgesetzt | 10 Fuhrpark, Simulation Zielflotte, Thermochron |
| Wialon auf allen Fahrzeugen | 🟡 teilweise | Adapter + Kontaktmonitor vorhanden; Live statt Simulation für v6 (FR-69) |
| 1C:Fuhrpark / 1C:Sklad-Austausch | ○ offen | Keine 1C-Schnittstelle; Export/Partner-API als Übergang |
| Garantie ohne km-Limit, Laufleistung 126–169 Tkm/Jahr | ✅ umgesetzt | Garantie-Prognose nach km (FR-50) |

### Zeitplan & Wirtschaftlichkeit

| Scope-Element | Status | Abdeckung in der Plattform |
|---|---|---|
| Start Magistrale Mitte Dezember 2026, Kritischer Pfad | ✅ umgesetzt | Tracker kritischer Pfad (FR-48), Rechts-/Steuerpunkte (FR-174) |
| Selbstkosten + 5 %, Verrechnungspreise | ✅ umgesetzt | 16 Kosten, Kostenmodell (FR-47) |
| Express-Disziplin (78 % der Ersparnis) | ✅ umgesetzt | Express nur mit 3 Freigaben + KPI (FR-41, FR-126, FR-154) |
| Überschneidung Express ↔ Temperatursendungen messen | 🟡 teilweise | Daten vorhanden; eigene Auswertung fehlt (Idee I-12) |
| Outsourcing parallel als Rückfallebene | ✅ umgesetzt | 11 Partner, Vergleich eigene Tour / extern |

### Kühlkette West & Cross-Docking

| Scope-Element | Status | Abdeckung in der Plattform |
|---|---|---|
| Thermobox 2 Tage, Öffnung nur beim Cross-Docking | ✅ umgesetzt | Umschlagpunkte, Thermochron bei Annahme |
| West-Lkw als Reefer oder Langzeitboxen – Entscheidung | ○ offen | Entscheidung vor Fahrzeugbestellung ausstehend; Fahrzeugsuche kann beide Varianten rechnen |
| Wareneingang / Cross-Dock in den Hubs (Audit beider Läger) | ○ offen | Rampen-/Zeitfensterplanung fehlt (Ideen I-1…I-8) |

### Vertrag & SLA mit KDL Olymp

| Scope-Element | Status | Abdeckung in der Plattform |
|---|---|---|
| Vertrag, Mindestmengen, SLA, Pönalen | 🟡 teilweise | Vertragsmanagement mit E-Signatur (FR-149); SLA-Messung für Partner, nicht für den Hauptkunden |

### Compliance Republik Kasachstan

| Scope-Element | Status | Abdeckung in der Plattform |
|---|---|---|
| TTN, ESF, SNT, EDS; Medizincheck ab 01.01.2027 | ✅ umgesetzt | 08 KZ-Dokumente, Fahrer-App |
| Gefahrgut (ADR), Trockeneis UN 1845 | ✅ umgesetzt | DG je Sendung, Fristen, 07 Sicherheit |
| GDP für Arzneimittel und Medizinprodukte | ✅ umgesetzt | 09 Qualität, GDP-Partner, Nachweise |
| Personendaten in KZ, verschlüsselt | ✅ umgesetzt | Systemregel, Verschlüsselung, Audit |

## 4 Anforderungen nach Bereich (Lastenheft)

|  | Bereich | ✅ | 🟡 | ○ |
|---|---|---|---|---|
| A | Netz, Standorte und Stammdaten | 3 | 0 | 0 |
| B | Disposition und Tourplanung | 4 | 0 | 0 |
| C | Beladung und Fahrzeugauswahl | 2 | 0 | 0 |
| D | Sendungen, Kennzeichnung und Rückverfolgung | 3 | 0 | 0 |
| E | Kühlkette und Temperatur | 3 | 0 | 0 |
| F | Wetter, Straßen und Winterbetrieb | 2 | 0 | 1 |
| G | Sicherheit, Vorfälle und Gefahrgut | 2 | 0 | 0 |
| H | Dokumente und Compliance Republik Kasachstan | 3 | 0 | 0 |
| I | Qualität (GDP) | 2 | 0 | 0 |
| J | Fuhrpark und Personal | 2 | 0 | 0 |
| K | Fahrer-App und Zustellung | 3 | 0 | 0 |
| L | Partner und Outsourcing | 1 | 1 | 0 |
| M | Kunden: Portal, Buchung, Preise, Verträge, Versicherung | 5 | 0 | 1 |
| N | Kosten, Freigaben und Wirtschaftlichkeit | 2 | 0 | 0 |
| O | Planung, Berichte und Ausgangsdaten | 1 | 1 | 0 |
| P | Schnittstellen zu externen Systemen | 1 | 1 | 0 |
| Q | Administration, Zugriff und Datenschutz | 3 | 0 | 0 |
| R | Bedienung, Sprachen und Erscheinungsbild | 3 | 0 | 0 |
