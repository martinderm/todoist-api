# Sources & Provenance — todoist-api

Stand: 2026-11-23

Dokumentiert, woher die API-Knowledge dieses Skills stammt und welche externen Quellen live konsultiert werden.

## Offizielle Todoist Developer Docs

- **Primärquelle:** https://developer.todoist.com/api/v1/ — API-Details (Endpoints, Pagination, Rate Limits, Fehlercodes) immer live von dort holen, nie aus Memory übernehmen.
- **Aktuelle API (v1, unified REST+Sync):** Base-URL `https://api.todoist.com/api/v1`, Auth `Authorization: Bearer <token>`, JSON; Sync-Endpoint `POST https://api.todoist.com/api/v1/sync`.
- **Legacy (retired):** REST v2 (`https://api.todoist.com/rest/v2`) und Sync v1/v9 antworten mit HTTP 410 (abgeschaltet) — nicht mehr für Connector oder Skripte verwenden.
- **Offizieller MCP-Server:** https://ai.todoist.net/mcp
- Gelesen: 2026-11-23

## Mistral Cloud (custom HTTP-Connector)

- Base-URL `https://api.todoist.com/api/v1`, Auth als API key (`Authorization: Bearer <token>`).
- Credential `todoist-api-token` liegt im Connectors Gateway; Referenz für Agents/Sandboxes: `secret:workspace:todoist-api-token`.
- OpenAPI-Spec (OpenAPI 3.x, JSON/YAML — Datei oder öffentliche URL) wird im Studio importiert; daraus werden die Tools generiert (docs.mistral.ai/studio/connectors/http-connectors).
- Secret-Werte nie in Repo, PRs, Doku oder Chat eintragen.
- Anlage siehe README-Abschnitt „Mistral Cloud (Connector)“.

## Weitere kuratierte Referenzen

- Docs-Navigator: `references/todoist-docs.md`
