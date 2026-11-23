# Sources & Provenance — todoist-api

Stand: 2026-11-23

Dokumentiert, woher die API-Knowledge dieses Skills stammt und welche externen Quellen live konsultiert werden.

## Offizielle Todoist Developer Docs

- **Primärquelle:** https://developer.todoist.com — API-Details (Endpoints, Pagination, Rate Limits, Fehlercodes) immer live von dort holen, nie aus Memory übernehmen.
- **REST API v2:** Base-URL `https://api.todoist.com/rest/v2`, Auth `Authorization: Bearer <token>`, JSON.
- **Sync API v1:** Base-URL `https://api.todoist.com/sync/v1`.
- **Offizieller MCP-Server:** https://ai.todoist.net/mcp
- Gelesen: 2026-11-23

## Mistral Cloud (custom HTTP-Connector)

- Base-URL `https://api.todoist.com/rest/v2`, Bearer Token.
- Credential `todoist-api-token` liegt im Connectors Gateway; Referenz für Agents/Sandboxes: `secret:workspace:todoist-api-token`.
- Secret-Werte nie in Repo, PRs, Doku oder Chat eintragen.
- Anlage siehe README-Abschnitt „Mistral Cloud (Connector)“.

## Weitere kuratierte Referenzen

- Docs-Navigator: `references/todoist-docs.md`
