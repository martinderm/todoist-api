---
type: object
cluster: adapter
universe: live
status: verified
entity: scripts/
verified_at: 2026-09-30
revision: 974c6a71dd12d6943b46380f815cb8534f869397
---

# CLI

Dünne CLI-Skripte über dem gemeinsamen Client; jeder Aufruf ist ein JSON-Envelope auf stdout bzw. stderr.

## Why this shape
Skripte bleiben austauschbare Adapter; Argument-Parsing und Fehler-Semantik folgen einem gemeinsamen Muster.

## Shape
Lesen: `list-tasks.mjs` listet Tasks mit `--limit` (1–200, Default 50), `--cursor`, `--project-id`, `--section-id`, `--label`, `--filter`, `--ids` als `GET /tasks`-Query und gibt `{ok, query, count, next_cursor, tasks}` aus; `list-projects.mjs` analog mit `--folder-id`/`--workspace-id` über `GET /projects`; `get-task.mjs` lädt ein Task positionell (`/tasks/<id>` mit `tmp-`-Guard). Schreiben: `create-task.mjs` baut aus `--content --description --project-id --section-id --priority --deadline-date --due-string` einen `POST /tasks`-Body (`deadline` als `{date}`, `due` als `{string}`) und gibt `{ok, task}` aus — kein Batch; `quick-add-task.mjs` sendet Natural-Language-Kandidaten an `POST /tasks/quick` (`--text --note --auto-reminder --parse-labels`); `create-section.mjs` legt Sections per `POST /sections` an (`--name --project-id --order`) ohne Existenzprüfung (Duplikatrisiko, GitHub Issue #2). Sync: `sync-resources.mjs` ruft `todoistSync` mit `--sync-token` und `--resources` (Kommaliste oder JSON-Array) und gibt `{ok, requested, sync_token, full_sync, resource_keys, data}` aus. Alle Argument-Parser sind handgeschrieben ohne Dependencies; Nutzungsfehler exit 2, API-Fehler exit 1.

- [scripts/list-tasks.mjs](../../../scripts/list-tasks.mjs) — `scripts/list-tasks.mjs:3` (parseArgs), `scripts/list-tasks.mjs:19` (--section-id), `scripts/list-tasks.mjs:39` (limit-Guard)
- [scripts/list-projects.mjs](../../../scripts/list-projects.mjs) — `scripts/list-projects.mjs:3`
- [scripts/get-task.mjs](../../../scripts/get-task.mjs) — `scripts/get-task.mjs:3`
- [scripts/create-task.mjs](../../../scripts/create-task.mjs) — `scripts/create-task.mjs:9` (parseArgs), `scripts/create-task.mjs:55` (Body)
- [scripts/quick-add-task.mjs](../../../scripts/quick-add-task.mjs) — `scripts/quick-add-task.mjs:9`
- [scripts/create-section.mjs](../../../scripts/create-section.mjs) — `scripts/create-section.mjs:9` (parseArgs), `scripts/create-section.mjs:48` (POST)
- [scripts/sync-resources.mjs](../../../scripts/sync-resources.mjs) — `scripts/sync-resources.mjs:3` (parseResources), `scripts/sync-resources.mjs:23` (parseArgs)

## Connected to
[Client](client.md), [Todoist-Schema](todoist-schema.md), [Sync](sync.md), [Qualität](quality.md). Prozesse: [api-call](../processes/api-call.md), [sync-call](../processes/sync-call.md).

## If you change this
- **Hits:** CLI-Regressionen in `tests/`, README-Schnellstart, SKILL.md-Skriptverzeichnis, System-Map-Karten [CLI](cli.md) und [Qualität](quality.md).
- **Does not hit:** Secret-Resolvierung solange nur konsumiert; kuratierte Referenzen.

## Surfaces
CLI-Aufrufe aus dem Skill-Root; stdout ist maschinenlesbarer JSON-Envelope, stderr trägt Fehler. Aufgerufen von Agent-Workspaces und dem office-intelligence/task-desk-Workflow.

## See
Skriptverzeichnis und Einsatzregeln: [SKILL.md](../../../SKILL.md). [Änderungsrouting](../effects/CONTEXT.md).