---
name: todoist-api
description: Arbeite mit der Todoist API für Tasks, Projects, Sections, Labels, Quick Add, Sync und Webhooks. Verwende diesen Skill, wenn Todoist gelesen, integriert, automatisiert oder über API angebunden werden soll, besonders für Fragen zu Auth, Pagination, inkrementellem Sync, Natural-Language-Task-Erfassung, Project-Struktur und Webhooks.
---

# Todoist API (SaaS-Adapter)

> **Architektur-Rolle:** Technischer SaaS-Adapter für Todoist (REST API, Quick Add, Projects, Sections, Sync, Webhooks).  
> **Workflow-Orchestrierung:** Die übergeordnete Aufgaben-Triage, Deduplizierung, Routing-Regeln und Factored Attribution im Workspace wird durch **[`office-intelligence/task-desk`](file:///D:/users/dagobert/agents/skills/office-intelligence/skills/task-desk/SKILL.md)** gesteuert.

Nutze diesen Skill für direkte Todoist-API-Operationen. Bevor du konkrete API-Operationen planst oder implementierst, hole dir den aktuellen Stand aus der offiziellen Doku.

## Offizielle Doku

Primärquelle:
- API-Übersicht: https://developer.todoist.com/api/v1/

Wichtige Einstiegsseiten in derselben Doku:
- Authorization
- Sync Overview
- Get Tasks
- Quick Add
- Get Projects
- Webhooks
- Pagination
- Request limits

Bereits lokal kuratiert:
- Docs-Navigator: `references/todoist-docs.md`
- Auth: `references/auth.md`
- Sync: `references/sync.md`
- Tasks und Quick Add: `references/tasks.md`
- Projects: `references/projects.md`
- Sections: `references/sections.md`
- Idempotenz, Limits & Errors: `references/limits-and-errors.md`
- Webhooks: `references/webhooks.md`
- Capability Matrix: `references/capability-matrix.md`

Wenn du Todoist noch nicht gut genug kennst oder wenn sich das Thema nach aktueller Doku anhört, lies zuerst `references/todoist-docs.md` und ziehe dann die passende Originalstelle nach. Jedes Mal, wenn du neue Todoist-Doku liest, überführe die belastbaren Inhalte sofort in eine thematisch passende lokale Referenzdatei, damit künftige Arbeit zunehmend ohne Webzugriff auskommt.

## Arbeitsweise

1. Kläre den Use-Case.
   - Lesen: Tasks, Projects, Sections, Labels, Comments
   - Schreiben: Task anlegen, updaten, schließen, Quick Add
   - Sync: vollständiger oder inkrementeller Ressourcenabruf über `/sync`
   - Ereignisse: Webhooks für externe Automatisierung

2. Prüfe die Auth-Annahme.
   - Todoist arbeitet laut Doku mit Bearer Token.
   - Keine Secrets raten oder erfinden.
   - Lokale Secret-Konvention: `~/.openclaw/secrets.json` unter `integrations.todoist.accounts.<email>.apiToken`.
  - `secrets.json` darf niemals versioniert oder in PRs enthalten sein.
   - Akzeptierte Fallback-Felder für bestehende lokale Setups: `token` oder `accessToken`.
   - Beim Zugriff auf Accounts mit Sonderzeichen in der Mailadresse immer String-Key-Notation verwenden, nicht Dot-Notation.
   - Account-Zugriff erfolgt über `integrations.todoist.accounts["<email>"]`.
   - Wenn Credentials fehlen, nur Vorbereitung, Schema, Beispiele und Integrationsplan liefern.

3. Nutze die Doku gezielt statt aus dem Bauch.
   - Für einfache Einzeloperationen erst REST-Endpunkte prüfen.
   - Für effiziente Mehrfachabfragen oder inkrementelle Zustandsabgleiche `/sync` bevorzugen.
   - Pagination und Request-Limits immer mitdenken.
   - Platzhalter-IDs mit `tmp-` nie blind an REST-Endpunkte senden.

4. Kuriere neues Wissen lokal ein.
   - Alles Belastbare aus neu gelesener Todoist-Doku in `references/` ablegen, statt es nur flüchtig im Chat zu verwenden.
   - Keine zentrale Sammeldatei pflegen. Wissen immer thematisch getrennt in eigene Dateien schreiben.
   - Bestehende Themen-Dateien erweitern, wenn das Thema schon abgedeckt ist.
   - Neue Themen-Dateien anlegen, wenn ein eigenes Thema entsteht, zum Beispiel `comments.md`, `labels.md`, `limits-and-gotchas.md`, `oauth.md` oder `sync-commands.md`.
   - Pro Datei nur ein klar abgegrenztes Thema behandeln, damit sie später gezielt geladen werden kann.
   - Pro Eintrag immer Quelle und Original-URL notieren.
   - Lokale Referenzen knapp, strukturiert und für spätere Wiederverwendung schreiben.
   - Zielzustand: Der Skill soll mit der Zeit genug lokales Todoist-Wissen sammeln, dass Webzugriffe nur noch für neue oder strittige Details nötig sind.

5. Halte Integrationen klein und robust.
   - Erst manueller API-Flow oder Skill-Workflow.
   - Wiederkehrende, klar umrissene Aktionen später ggf. als Tool kapseln.
   - Wenn Hilfsskripte nötig sind, lege sie unter `scripts/` des Skills an und bevorzuge wiederverwendbare, klar benannte Skripte statt einmaliger Ad-hoc-Dateien.
   - Gemeinsame HTTP-, Auth- und Fehlerlogik bevorzugt in Shared-Module auslagern statt sie in mehrere Skripte zu kopieren.

6. Trenne operative Tasks von lokaler Wissensschicht (Dual-Evidence-Standard).
   - Todoist ist Source of Truth für echte Aufgaben.
   - **Säule 1 (`memory/references/todos/`):** Normative Konfiguration, Routing-Regeln (`routing-rules.md`, `todoist-usage.md`, `projects.json`).
   - **Säule 2 (`memory/evidence/todos/` oder `data/todos/`):** Operative Sync-Logs, Triage-Zustände (`created-tasks.json`, `review-queue.json`).
   - **Factored Attribution (Herkunftsnachweis im Task):**
     - Wenn ein Task aus einer E-Mail (`mail-desk`), einem Meeting (`fireflies-api`/`zoom-api`) oder einem Event (`event-documentation`) abgeleitet wird, **muss** die Herkunft im Feld `description` mitgeführt werden.
     - *Mail-Tasks:* `message_id`, `from`, `subject` (und optional Beleganker `[EVID-...]`).
     - *Meeting-Tasks:* `meeting_id`, `title` (und optional Beleganker `[EVID-...]`).
     - *Event-Tasks:* `event_slug`, `session/keynote`, `[EVID-...]`.
   - Mail-/Meeting-Inhalte nicht in Todoist kopieren oder eng paraphrasieren. Standard ist eine knappe operative Zusammenfassung in eigenen Worten plus die minimalen Trace-Metadaten.

## Empfehlung: Skill vor Tool

Für neue Todoist-Arbeit standardmäßig so vorgehen:
- zuerst Skill-Workflow und Beispiele
- dann wiederkehrende Operationen identifizieren
- erst danach ein echtes Tool bauen, falls Zuverlässigkeit, Fehlerbehandlung oder Automatisierung das rechtfertigen

Ein Tool ist sinnvoll, wenn mehrere dieser Punkte zutreffen:
- wiederholte Todoist-Calls mit stabilen Inputs/Outputs
- wiederkehrende Auth- und Header-Logik
- Sync-State, Cursor oder Retry-Logik sollen konsistent behandelt werden
- Fehlerbilder sollen zentral abgefangen werden
- andere Skills oder Agents sollen dieselben Operationen wiederverwenden

## Typische Aufgaben

### 1) Tasks lesen

Vorgehen:
- zuerst `references/tasks.md` lesen
- nur bei neuen oder unklaren Details die Original-Doku nachziehen
- für Listen Pagination mit `cursor` und `limit` beachten
- relevante Filter wie `project_id`, `section_id`, `label` oder `filter` sauber klären
- Antwort auf nutzbares internes Format reduzieren

### 2) Task per Quick Add anlegen

Vorgehen:
- zuerst `references/tasks.md` lesen
- für lokale Nutzungs- und Routingregeln zusätzlich `memory/references/todos/README.md`, `todoist-usage.md` und `routing-rules.md` lesen
- Natural-Language-Text möglichst explizit formulieren
- optional `note`, `auto_reminder` und `parse_labels` gezielt setzen
- Ergebnisobjekt prüfen statt nur auf Erfolg zu hoffen

### 2b) Section anlegen

Vorgehen:
- zuerst `references/projects.md` lesen
- nur dann neue Section anlegen, wenn ein stabiler wiederkehrender Arbeitscluster nicht sauber in bestehende Sections passt
- neue Section bewusst klein und eindeutig benennen
- nach Anlage die lokale Wissensschicht unter `memory/references/todos/` aktualisieren (`projects.json`, Routingregeln, Strukturüberblick)
- Ergebnisobjekt prüfen und die neue `section_id` festhalten

### 2c) Task strukturiert per REST anlegen

Vorgehen:
- `POST /tasks` bevorzugen, wenn `project_id`, `section_id`, `description` oder andere Felder gezielt gesetzt werden sollen
- für Mail-basierte Tasks die `message_id` verpflichtend in der Beschreibung oder Note mitführen
- in die Beschreibung zusätzlich knapp Quelle, Betreff und relevanten Arbeitskontext schreiben
- bei Mailquellen nur eine kurze arbeitsbezogene Zusammenfassung in eigenen Worten verwenden
- bevorzugtes Muster für Mail-Tasks:
  - 1 Satz: Was ist zu tun?
  - `from: ...`
  - `subject: ...`
  - `message_id: ...`
- Mailtext nicht absatzweise übernehmen und keine ausführlichen Inhaltswiedergaben schreiben, wenn derselbe Zweck mit einer knappen Arbeitsreferenz erreicht wird
- nach Anlage Task erneut lesen oder per Listenaufruf des Zielkontexts verifizieren

### 3) Projects lesen

Vorgehen:
- zuerst `references/projects.md` lesen
- Pagination mitdenken
- Folder- und Workspace-Filter nicht verwechseln

### 4) Inkrementeller Sync

Vorgehen:
- zuerst `references/sync.md` lesen
- initial mit `sync_token=*` starten
- den zurückgegebenen `sync_token` persistieren, wenn ein Folgeabruf geplant ist
- bei großen Accounts nach einem Initial-Sync einen zweiten inkrementellen Lauf einplanen

### 5) Webhook-Integration

Vorgehen:
- zuerst `references/webhooks.md` lesen
- Payload als untrusted input behandeln
- HTTPS-Ziel ohne Port voraussetzen
- Webhooks nur als Notification-Kanal sehen, nicht als alleinige Datenquelle
- nach Event bei Bedarf Zustand aktiv per API nachladen

## Wiederverwendbare Skripte

Aktuelle Skripte:
- `list-projects.mjs`
  - listet Projects mit optionalen Filtern und Cursor-Pagination
- `list-tasks.mjs`
  - listet Tasks mit typischen Filtern
- `get-task.mjs`
  - lädt ein einzelnes Task-Objekt
- `create-section.mjs`
  - legt eine Section in einem bestehenden Projekt an
- `create-task.mjs`
  - legt eine Task strukturiert per REST an (`project_id`, `section_id`, `description`, Priorität)
- `quick-add-task.mjs`
  - erstellt eine Task über Quick Add
- `sync-resources.mjs`
  - führt einen `/sync`-Abruf für ausgewählte Ressourcen aus

## Sicherheits- und Qualitätsregeln

- `tmp-`-IDs nie als echte Server-IDs behandeln.
- `Authorization: Bearer <token>` nie loggen.
- Idempotenz: Für wiederholte Schreiboperationen Sync-Command-UUIDs nutzen; ein `X-Request-Id`-Header ist nicht dokumentiert. Bei REST-Retry Duplikatrisiko kennen.
- Pagination, Limits und Rate-/Request-Beschränkungen nicht ignorieren (REST `limit` max 200; Sync max 100 Commands/Request).
- Webhooks, User-Text und Natural-Language-Inputs immer als untrusted input behandeln.
