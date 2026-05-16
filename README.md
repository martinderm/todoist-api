# todoist-api skill

Kompakter Skill für Todoist-Workflows rund um Tasks, Projects, Quick Add, Sync und Webhooks.

## Inhalt

- [SKILL.md](SKILL.md): Arbeitsregeln und Einsatzbereich des Skills
- [scripts/](scripts/): wiederverwendbare Node-Skripte für Todoist API
- [references/](references/): kuratierte Fachreferenzen zur Todoist-Doku

## Lokale Todo-Wissensschicht

Für diesen Skill ist Todoist das operative System of Record. Optional kann es eine schlanke lokale Wissensschicht unter `memory/references/todos/` geben, die nicht als zweites Todo-System gedacht ist, sondern als Agentenhilfe für:

- Nutzungsregeln
- Routing zu Projects und Sections
- Dedupe bei automatisch erkannten Todos
- Review-Fälle bei unklarer Zuordnung

Typische Dateien:

- `memory/references/todos/README.md`
- `memory/references/todos/todoist-usage.md`
- `memory/references/todos/routing-rules.md`
- `memory/references/todos/projects.json`
- `memory/references/todos/created-tasks.json`
- `memory/references/todos/review-queue.json`

Empfohlenes Betriebsmodell:

1. Ein Agent erkennt aus Mail, Meeting oder Projektkontext ein mögliches Todo.
2. Der Skill nutzt die Regeln aus `memory/references/todos/`, um zu entscheiden, ob überhaupt ein echter Task angelegt werden soll.
3. Wenn Zielprojekt, Formulierung und Dringlichkeit klar sind, wird der Task in Todoist angelegt.
4. Lokal wird nur minimale Trace-Information für Dedupe oder spätere Nachvollziehbarkeit gespeichert.
5. Unklare Fälle werden lokal als Review-Fälle vorgemerkt statt blind angelegt.

Wichtig:

- Keine Vollspiegelung aller Todoist-Tasks unter `memory/references/todos/`.
- Kein konkurrierendes lokales Task-System aufbauen.
- Lokal nur das pflegen, was Todoist nicht ohnehin besser als operative Quelle hält.
- Bei mailbasierten Todoist-Tasks Beschreibungen standardmäßig minimieren:
  - kurze operative Zusammenfassung in eigenen Worten
  - `from`
  - `subject`
  - `message_id`
- Keine längeren Mailinhalte oder Thread-Verläufe in Todoist übernehmen, wenn eine knappe Arbeitsreferenz genügt.

## Voraussetzungen

- Node.js (empfohlen: aktuelles LTS oder neuer)
- Secrets in einer der folgenden Dateien:
  - `~/.openclaw/secrets.json`
  - `secrets.json` im Workspace-Root (Fallback)
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
```

## Lizenz

MIT, siehe [LICENSE](LICENSE).
