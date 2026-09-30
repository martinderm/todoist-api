---
type: object
cluster: domain
universe: live
status: verified
entity: references/tasks.md
verified_at: 2026-09-30
revision: 974c6a71dd12d6943b46380f815cb8534f869397
---

# Todoist-Schema

Kuratierte Feldkataloge für Tasks, Projects und Sections; Quellbelege liegen in den Referenzdateien, nicht in Code-Schemata.

## Why this shape
Der Skill hält API-Wissen als kuratierte Markdown-Referenzen (Kein Code-Generated-Client); jeder Eintrag trägt URL und Lesedatum. Code-Seams (CLI-Bodies) zitate die relevanten Felder direkt.

## Shape
Tasks: `GET /tasks` unterstützt `project_id`, `section_id`, `label`, `filter`, `ids`, `cursor`, `limit` (Default 50, max 200); `POST /tasks` nimmt u. a. `content` (required), `description`, `project_id`, `section_id`, `priority` (1–4), `due` (`{string}` oder strukturiert), `deadline` (`{date}`); `POST /tasks/quick` nimmt `text`, `note`, `auto_reminder`, `parse_labels`. Projects: `GET /projects` mit `folder_id`/`workspace_id` (bei `folder_id` wird `workspace_id` ignoriert). Sections: `GET /sections?project_id=` (paginiert), `POST /sections` mit `name`, `project_id`, optional `order`, `description`; Section-Objekt u. a. mit `id`, `project_id`, `name`, `section_order`, `is_archived`. Idempotenz: kein `X-Request-Id` dokumentiert; Command-UUIDs in `/sync` sind die dokumentierte Retry-Ebene. Error-Envelope 4xx: `{error, error_code, error_extra, error_tag, http_code}` (z. B. 477 UNAUTHORIZED, 478 NOT_FOUND).

- [references/tasks.md](../../../references/tasks.md) — `references/tasks.md:7`
- [references/projects.md](../../../references/projects.md) — `references/projects.md:7`
- [references/sections.md](../../../references/sections.md) — `references/sections.md:7`
- [references/limits-and-errors.md](../../../references/limits-and-errors.md) — `references/limits-and-errors.md:5`

## Connected to
[CLI](cli.md), [Client](client.md), [Sync](sync.md), [Skill-Verhalten](skill-behavior.md).

## If you change this
- **Hits:** CLI-Body-Bau in `create-task.mjs`/`create-section.mjs`, Query-Bau in `list-*.mjs`, Referenz-Kurating in `references/`.
- **Does not hit:** Secret-Resolvierung; Sync-Token-Handling.

## Surfaces
Gelesen von Agenten bei API-Operation-Planung; geschrieben von Doku-Kurating (jedes neue Doku-Lesen führt belastbare Inhalte in die entsprechende Referenzdatei zurück).

## See
Docs-Navigator: [references/todoist-docs.md](../../../references/todoist-docs.md). Capability-Matrix: [references/capability-matrix.md](../../../references/capability-matrix.md). [Änderungsrouting](../effects/CONTEXT.md).