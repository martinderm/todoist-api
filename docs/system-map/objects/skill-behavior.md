---
type: object
cluster: governance
universe: live
status: verified
entity: SKILL.md
verified_at: 2026-11-23
revision: 001a6e24b026accb3f79e1f8ad2e14402eeb37f3
---

# Skill-Verhalten

Arbeitsregeln des SaaS-Adapters: Use-Case-Klärung, Auth-Handling, Doku-Kurating und Dual-Evidence.

## Why this shape
Workflow-Orchestrierung (Triage, Deduplizierung, Factored Attribution) liegt bewusst außerhalb beim office-intelligence/task-desk; dieses Repository ist nur der technische Todoist-Adapter.

## Shape
Regelkerne in [SKILL.md](../../../SKILL.md): Auth (`integrations.todoist.accounts["<email>"].apiToken`, Fallback `token`/`accessToken`, String-Key-Notation, keine Secrets raten, bei fehlenden Credentials nur Vorbereitung/Plan), Doku-Kurating (jedes neue Doku-Lesen überführt Belastbares thematisch in `references/`, keine zentrale Sammeldatei), Integrationen klein halten (erst Skill-Workflow, dann ggf. Tool-Kapselung; Hilfsskripte unter `scripts/`, gemeinsame HTTP-/Auth-Logik im Client), Dual-Evidence (Todoist ist Source of Truth für Tasks; Säule 1 normativ unter `memory/references/todos/` Routing-Regeln und `projects.json`, Säule 2 operativ unter `memory/evidence/todos/` Dedupe-/Review-Zustände), Factored Attribution (Herkunftsnachweis im `description`-Feld: `message_id`/`meeting_id`/`event_slug`, knappe Arbeitszusammenfassung statt Mail-/Meetingtext-Kopie). Sicherheitsregeln: `tmp-`-IDs nie als Server-IDs, Bearer-Token nie loggen, Pagination/Limits beachten, Webhooks und User-Text als untrusted input. Mistral Cloud (Work/task-desk): custom HTTP-Connector mit Base-URL `https://api.todoist.com/api/v1`, API-key-Auth (`Authorization: Bearer <token>`), Credential `todoist-api-token` im Connectors Gateway (Referenz `secret:workspace:todoist-api-token`), OpenAPI-Spec-Import; API-Details immer live von developer.todoist.com holen.

- [SKILL.md](../../../SKILL.md) — `SKILL.md:13` (Mistral Cloud Connector), `SKILL.md:45` (Arbeitsweise), `SKILL.md:86` (Dual-Evidence-Standard), `SKILL.md:199` (Sicherheits- und Qualitätsregeln)
- [README.md](../../../README.md) — `README.md:11` (Lokale Todo-Wissensschicht), `README.md:90` (Mistral Cloud Connector)

## Connected to
[Cliente](client.md), [Todoist-Schema](todoist-schema.md), [Qualität](quality.md).

## If you change this
- **Hits:** Referenz-Kurating in `references/`, Task-Creation-Muster in `scripts/create-task.mjs`, Routing-Regeln im aufrufenden Workspace.
- **Does not hit:** HTTP-/Auth-Mechanik im Client-Modul; Sync-Token-Verwaltung.

## Surfaces
Gelesen von Agenten vor Todoist-Operationen; geschrieben bei Regeländerungen und Doku-Kurating. Kein Code-Import — die Karte regelt Arbeit, sie ist nicht Teil der Laufzeit.

## See
Wissensschicht-Standard: [README.md](../../../README.md). Todoist-Doku-Katalog: [references/todoist-docs.md](../../../references/todoist-docs.md). [Änderungsrouting](../effects/CONTEXT.md).