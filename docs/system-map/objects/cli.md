---
type: object
cluster: adapter
universe: live
status: verified
entity: scripts/create-tasks.mjs
verified_at: 2026-09-30
revision: 4f9918092a1eadfdd9d53dd0049cb07a4b7af510
---

# CLI

Dünne CLI-Skripte über dem gemeinsamen Client; jeder Aufruf ist ein JSON-Envelope auf stdout bzw. stderr.

## Why this shape
Skripte bleiben austauschbare Adapter; Argument-Parsing und Fehler-Semantik folgen einem gemeinsamen Muster. Kernlogik exportierbarer reiner Funktionen macht Batch- und Find-or-Create-Flüsse netzfrei testbar.

## Shape
Lesen: `list-tasks.mjs` listet Tasks mit `--limit` (1–200, Default 50), `--cursor`, `--project-id`, `--section-id`, `--label`, `--filter`, `--ids` als `GET /tasks`-Query und gibt `{ok, query, count, next_cursor, tasks}` aus; `list-projects.mjs` analog mit `--folder-id`/`--workspace-id` über `GET /projects`; `get-task.mjs` lädt ein Task positionell (`/tasks/<id>` mit `tmp-`-Guard). Schreiben: `create-task.mjs` baut aus `--content --description --project-id --section-id --priority --deadline-date --due-string` einen `POST /tasks`-Body (`deadline` als `{date}`, `due` als `{string}`) und gibt `{ok, task}` aus; `create-tasks.mjs` nimmt ein JSON-Array aus `--file <tasks.json>` oder `--stdin` (Felder wie create-task), validiert fail-loud vor dem ersten Request (`batch_payload_must_be_array`, `batch_empty`, `batch_entry_invalid:<i>:missing_content`, `batch_source_conflict`, `missing_batch_source`, `batch_file_not_found`; SyntaxError für invalides JSON) und erstellt sequenziell in Eingabereihenfolge — Einzelfehler werden pro Index gesammelt (`{ok, total, created, failed_count, results, failed}`, `ok:true ⇔ created>0`), exit 0 bei Teilerfolg, exit 1 bei Totalversagen; `quick-add-task.mjs` sendet Natural-Language-Kandidaten an `POST /tasks/quick`; `create-section.mjs` legt Sections per `POST /sections` an (`--name --project-id --order`) und prüft mit `--find-or-create` zuerst `GET /sections?project_id=` (paginiert, limit 200, Cursor-Nachlauf bis `next_cursor` null, exakter Namensvergleich) — Treffer liefert `{ok, section, created:false, existing:true}` ohne POST, Miss `created:true`; ohne Flag bleibt der direkte POST (`createSection`-Export mit `{ok, section}`). Sync: `sync-resources.mjs` ruft `todoistSync` mit `--sync-token` und `--resources` (Kommaliste oder JSON-Array) und gibt `{ok, requested, sync_token, full_sync, resource_keys, data}` aus. Alle Argument-Parser sind handgeschrieben ohne Dependencies; Nutzungs-/Validierungsfehler exit 2, API-Fehler exit 1; `main`-Skripte führen nur aus, wenn direkt aufgerufen (`process.argv[1]`-Pfadvergleich gegen `import.meta.url`, Import-freundlich).

- [scripts/list-tasks.mjs](../../../scripts/list-tasks.mjs) — `scripts/list-tasks.mjs:3` (parseArgs), `scripts/list-tasks.mjs:19` (--section-id), `scripts/list-tasks.mjs:39` (limit-Guard)
- [scripts/list-projects.mjs](../../../scripts/list-projects.mjs) — `scripts/list-projects.mjs:3`
- [scripts/get-task.mjs](../../../scripts/get-task.mjs) — `scripts/get-task.mjs:3`
- [scripts/create-task.mjs](../../../scripts/create-task.mjs) — `scripts/create-task.mjs:9` (parseArgs), `scripts/create-task.mjs:55` (Body)
- [scripts/create-tasks.mjs](../../../scripts/create-tasks.mjs) — `scripts/create-tasks.mjs:25` (parseTasksPayload), `scripts/create-tasks.mjs:79` (createTasks), `scripts/create-tasks.mjs:120` (readBatchSource)
- [scripts/quick-add-task.mjs](../../../scripts/quick-add-task.mjs) — `scripts/quick-add-task.mjs:9`
- [scripts/create-section.mjs](../../../scripts/create-section.mjs) — `scripts/create-section.mjs:36` (findSectionByName), `scripts/create-section.mjs:62` (findOrCreateSection), `scripts/create-section.mjs:80` (createSection)
- [scripts/sync-resources.mjs](../../../scripts/sync-resources.mjs) — `scripts/sync-resources.mjs:3` (parseResources), `scripts/sync-resources.mjs:23` (parseArgs)

## Connected to
[Client](client.md), [Todoist-Schema](todoist-schema.md), [Sync](sync.md), [Qualität](quality.md). Prozesse: [api-call](../processes/api-call.md), [sync-call](../processes/sync-call.md).

## If you change this
- **Hits:** CLI-Regressionen in `tests/` (cli-smoke, registry-smoke), README-Schnellstart, SKILL.md-Skriptverzeichnis, System-Map-Karten [CLI](cli.md) und [Qualität](quality.md).
- **Does not hit:** Secret-Resolvierung solange nur konsumiert; kuratierte Referenzen.

## Surfaces
CLI-Aufrufe aus dem Skill-Root; stdout ist maschinenlesbarer JSON-Envelope, stderr trägt Fehler. Aufgerufen von Agent-Workspaces und dem office-intelligence/task-desk-Workflow.

## See
Skriptverzeichnis und Einsatzregeln: [SKILL.md](../../../SKILL.md). Batch-Envelope-Referenz: [references/limits-and-errors.md](../../../references/limits-and-errors.md). [Änderungsrouting](../effects/CONTEXT.md).