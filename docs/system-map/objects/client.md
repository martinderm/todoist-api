---
type: object
cluster: adapter
universe: live
status: verified
entity: scripts/_todoist-client.mjs
verified_at: 2026-09-30
revision: 974c6a71dd12d6943b46380f815cb8534f869397
---

# Client

Gemeinsamer REST-/Sync-Client, Secrets-Resolvierung und Ausgabe-Envelope für alle Skripte.

## Why this shape
Auth, Endpoint und Fehlerausgabe an einer Stelle; CLI-Skripte bleiben dünne Adapter.

## Shape
REST-Requests laufen über `todoistRequest` (Base `https://api.todoist.com/api/v1`, Bearer-API-Token, Query-Builder schließt `undefined`/`null`/`''` aus) und Sync-Abrufe über `todoistSync` (POST `/sync` als `application/x-www-form-urlencoded` mit `sync_token` und `resource_types`-JSON). Das Token wird über `loadApiToken` ermittelt: Account-Referenz aus Argument oder erstem Key in `integrations.todoist.accounts`, Feldfolge `apiToken` → `token` → `accessToken`; Fehler `missing_account_ref` bzw. `missing_api_token:<account>`. `loadSecretsJson` iteriert Kandidatenpfade in fester Reihenfolge (`secrets.json` im CWD, `LEGACY_WORKSPACE_ROOT`, `REPO_ROOT`, `~/.openclaw/secrets.json`) und liefer das **erste existierende** Dokument ohne Todoist-Credential-Prüfung — Multi-Service-Workspaces mit fremder lokaler `secrets.json` erhalten daher `missing_account_ref`, obwohl spätere Kandidaten Todoist-Tokens halten (GitHub Issue #1). `todoistRequest`/`todoistSync` verendern `loadApiToken` fest (kein Token-Caching, keine fetch-Injektion); bei HTTP-Fehlern (`http_<status>`) hängt der Body am Error-Objekt; `printError` gibt einen JSON-Envelope `{ok:false,error,status,body}` auf stderr, `printJson` den Erfolgs-Envelope auf stdout. `assertServerId` weist leere IDs und `tmp-`-Platzhalter fail-loud ab (`placeholder_id_not_allowed`).

- [scripts/_todoist-client.mjs](../../../scripts/_todoist-client.mjs) — `scripts/_todoist-client.mjs:13` (candidateSecretsPaths), `scripts/_todoist-client.mjs:22` (loadSecretsJson), `scripts/_todoist-client.mjs:38` (resolveAccount), `scripts/_todoist-client.mjs:52` (loadApiToken), `scripts/_todoist-client.mjs:106` (todoistRequest), `scripts/_todoist-client.mjs:134` (todoistSync), `scripts/_todoist-client.mjs:162` (assertServerId)

## Connected to
[CLI](cli.md), [Todoist-Schema](todoist-schema.md), [Sync](sync.md), [Qualität](quality.md). Prozesse: [api-call](../processes/api-call.md), [sync-call](../processes/sync-call.md).

## If you change this
- **Hits:** Alle Skripte unter `scripts/`, Secret-Regressionen in `tests/`, Dokumentation der Secret-Konvention in README/SKILL.md.
- **Does not hit:** Kuratierte `references/`-Inhalte; Todoist-API-Verhalten selbst.

## Surfaces
Die Endpunkte sind extern (Todoist); alle Skripte importieren die Exporte dieses Moduls; `loadSecretsJson` ist in dieser Revision noch nicht exportiert. Secrets liegen in Workspace-Konfigurationsdateien außerhalb des Repos.

## See
Secret-Pfade und deren Reihenfolge: `candidateSecretsPaths` in [scripts/_todoist-client.mjs](../../../scripts/_todoist-client.mjs) — `scripts/_todoist-client.mjs:13`. Secret-Konvention: [references/auth.md](../../../references/auth.md). [Änderungsrouting](../effects/CONTEXT.md).