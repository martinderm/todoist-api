# todoist-api skill

Kompakter Skill für Todoist-Workflows rund um Tasks, Projects, Quick Add, Sync und Webhooks.

## Inhalt

- [SKILL.md](SKILL.md): Arbeitsregeln und Einsatzbereich des Skills
- [scripts/](scripts/): wiederverwendbare Node-Skripte für Todoist API
- [references/](references/): kuratierte Fachreferenzen zur Todoist-Doku
- [docs/system-map/README.md](docs/system-map/README.md): ICM System-Map (Repository-Katalog für Änderungen)

## Lokale Todo-Wissensschicht (Dual-Evidence-Standard)

Für diesen Skill ist Todoist das operative System of Record. Die lokale Wissensschicht trennt normatives Routing-Wissen (Säule 1) von flüchtigen Dedupe-/Review-States (Säule 2):

### Säule 1 (Normativ — `memory/references/todos/`):
- `README.md` — Zweck & Struktur der Todo-Konfiguration
- `todoist-usage.md` — Leitlinien für Prioritäten, Sections & Fälligkeiten
- `routing-rules.md` — Semantische Zuordnungsregeln zu Projekten
- `projects.json` — Lokaler Cache bekannter Projekt- und Section-IDs

### Säule 2 (Empirisch — `memory/evidence/todos/` oder `data/todos/`):
- `created-tasks.json` — Minimaler Trace- und Dedupe-Index bereits angelegter Tasks
- `review-queue.json` — Vorgemerkte unklare Triage-Fälle zur menschlichen Prüfung

Empfohlenes Betriebsmodell:

1. Ein Agent erkennt aus Mail (`mail-desk`), Meeting (`fireflies-api`/`zoom-api`) oder Event (`event-documentation`) ein mögliches Todo.
2. Der Skill nutzt die Regeln aus `memory/references/todos/`, um zu entscheiden, ob überhaupt ein echter Task angelegt werden soll.
3. Wenn Zielprojekt, Formulierung und Dringlichkeit klar sind, wird der Task in Todoist mit **Factored Attribution** angelegt (Herkunftsnachweis im Feld `description`).
4. Lokal wird nur minimale Trace-Information für Dedupe oder spätere Nachvollziehbarkeit gespeichert.
5. Unklare Fälle werden lokal als Review-Fälle vorgemerkt statt blind angelegt.

Wichtig:

- Keine Vollspiegelung aller Todoist-Tasks lokal.
- Kein konkurrierendes lokales Task-System aufbauen.
- Bei allen abgeleiteten Todoist-Tasks Beschreibungen standardmäßig minimieren:
  - kurze operative Handlungsanweisung in eigenen Worten
  - Herkunftsnachweis (`message_id`, `meeting_id`, `event_slug` oder Beleganker `[EVID-...]`)

## Voraussetzungen

- Node.js (empfohlen: aktuelles LTS oder neuer)
- Secrets in einer der folgenden Dateien (in dieser Reihenfolge geprüft, pro erkanntem Workspace-Root zuerst):
  - `<workspace>/.agents/secrets.json`
  - `<workspace>/secrets.json`
  - `secrets.json` im Skill-Root (Fallback)
  - `~/.openclaw/secrets.json`
- Die Kandidatenkette liest Dateien so lange, bis eine Todoist-Credentials (`integrations.todoist.accounts`) enthält; eine lokale `secrets.json` anderer Tools blockiert den Fallback nicht.
- Sicherheitsregel: `secrets.json` niemals committen oder in Pull Requests aufnehmen.

Erwartete Struktur:

```json
{
  "integrations": {
    "todoist": {
      "accounts": {
        "<email>": {
          "apiToken": "YOUR_TODOIST_TOKEN"
        }
      }
    }
  }
}
```

Akzeptierte Fallback-Felder für bestehende Setups: `token`, `accessToken`.

## Schnellstart

Vom Repo-Root [skills/todoist-api](skills/todoist-api):

```bash
node scripts/list-projects.mjs --limit 10
node scripts/list-tasks.mjs --limit 10
node scripts/quick-add-task.mjs --text "Review project plan tomorrow 10am #Inbox"
node scripts/sync-resources.mjs --resources projects,items,sections,labels
node scripts/create-tasks.mjs --file tasks.json
node scripts/create-section.mjs --name "MM Support" --project-id <project-id> --find-or-create
```

Tests (netzfrei, ohne API-Token):

```bash
node --test "tests/**/*.mjs"
```

## Lizenz

MIT, siehe [LICENSE](LICENSE).
