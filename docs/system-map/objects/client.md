---
type: object
cluster: adapter
universe: live
status: verified
entity: scripts/_todoist-client.mjs
verified_at: 2026-09-30
revision: 4f9918092a1eadfdd9d53dd0049cb07a4b7af510
---

# Client

Gemeinsamer REST-/Sync-Client, Secrets-Resolvierung und Ausgabe-Envelope für alle Skripte.

## Why this shape
Auth, Endpoint und Fehlerausgabe an einer Stelle; CLI-Skripte bleiben dünne Adapter.

## Shape
REST-Requests laufen über `todoistRequest` (Base `https://api.todoist.com/api/v1`, Bearer-API-Token, Query-Builder schließt `undefined`/`null`/`''` aus) und Sync-Abrufe über `todoistSync` (POST `/sync` als `application/x-www-form-urlencoded` mit `sync_token` und `resource_types`-JSON). Das Token wird über `resolveToken` ermittelt: mit Injektion `secrets` (Test-Pfad, `resolveAccount`-Feldfolge `apiToken` → `token` → `accessToken`, Fehler `missing_account_ref`/`missing_api_token:<account>`), sonst über `loadApiToken` (Argument oder erster Key in `integrations.todoist.accounts`). `loadSecretsJson(candidatePaths = candidateSecretsPaths())` (exportiert für Test-Injektion) wählt den **ersten Kandidaten, dessen Dokument Todoist-Credentials** (`integrations.todoist.accounts` mit mindestens einem Eintrag) **enthält**; Kandidaten ohne Todoist-Anteil werden übersprungen. Enthält kein existierender Kandidat Todoist-Credentials, wird das erste existierende Dokument geliefert, sodass `loadApiToken` weiterhin `missing_account_ref` wirft. Bei einem Match wird der Scan beendet — späteres, ungültiges JSON in Restkandidaten wird dann nicht gelesen; ohne Match listet `missing_secrets_file:<tried>` alle Kandidaten. Workspace-Erkennung (`resolveWorkspaceRoot`, exportiert) nutzt `WORKSPACE_ROOT`-Env, logisches PWD, CWD-Ancestors und zwei Skriptherleitungen (`directScriptRoot` 2-up für Skill-in-skills-Layout, `deepScriptRoot` 3-up mit `.agents`-Basename-Schutz für Nestierung); ein Kandidat gilt als Root, wenn `settings.json`, `AGENTS.md`, `.agents` oder `secrets.json` direkt darin liegt. `candidateSecretsPaths` bildet pro Root `.agents/secrets.json` und `secrets.json`, danach `REPO_ROOT/secrets.json` und `~/.openclaw/secrets.json` (dedupliziert). `todoistRequest`/`todoistSync` akzeptieren optional `fetchImpl = fetch` und `secrets` (Default-Pfad byteidentisch ohne Injektion); bei HTTP-Fehlern (`http_<status>`) hängt der Fehler-Body am Error-Objekt; `printError` gibt einen JSON-Envelope `{ok:false,error,status,body}` auf stderr, `printJson` den Erfolgs-Envelope auf stdout. `assertServerId` weist leere IDs und `tmp-`-Platzhalter fail-loud ab (`placeholder_id_not_allowed`).

- [scripts/_todoist-client.mjs](../../../scripts/_todoist-client.mjs) — `scripts/_todoist-client.mjs:41` (looksLikeWorkspaceRoot), `scripts/_todoist-client.mjs:50` (candidateWorkspaceRoots), `scripts/_todoist-client.mjs:77` (resolveWorkspaceRoot), `scripts/_todoist-client.mjs:82` (candidateSecretsPaths), `scripts/_todoist-client.mjs:95` (hasTodoistCredentials), `scripts/_todoist-client.mjs:100` (loadSecretsJson), `scripts/_todoist-client.mjs:131` (resolveAccount), `scripts/_todoist-client.mjs:145` (loadApiToken), `scripts/_todoist-client.mjs:166` (resolveToken), `scripts/_todoist-client.mjs:199` (todoistRequest), `scripts/_todoist-client.mjs:227` (todoistSync), `scripts/_todoist-client.mjs:255` (assertServerId)

## Connected to
[CLI](cli.md), [Todoist-Schema](todoist-schema.md), [Sync](sync.md), [Qualität](quality.md). Prozesse: [api-call](../processes/api-call.md), [sync-call](../processes/sync-call.md).

## If you change this
- **Hits:** Alle Skripte unter `scripts/`, Secret-Regressionen in `tests/` (registry-smoke), Dokumentation der Secret-Konvention in README/SKILL.md.
- **Does not hit:** Kuratierte `references/`-Inhalte; Todoist-API-Verhalten selbst.

## Surfaces
Die Endpunkte sind extern (Todoist); alle Skripte importieren die Exporte dieses Moduls (`loadSecretsJson` und `resolveWorkspaceRoot` exportiert für Test-Injektion). Secrets liegen in Workspace-Konfigurationsdateien außerhalb des Repos.

## See
Secret-Pfade und deren Reihenfolge: `candidateSecretsPaths` in [scripts/_todoist-client.mjs](../../../scripts/_todoist-client.mjs) — `scripts/_todoist-client.mjs:82`. Secret-Konvention: [references/auth.md](../../../references/auth.md). Secret-Regressionen: [tests/registry-smoke.mjs](../../../tests/registry-smoke.mjs). [Änderungsrouting](../effects/CONTEXT.md).