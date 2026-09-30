---
type: object
cluster: quality
universe: live
status: verified
entity: tests/
verified_at: 2026-09-30
revision: 4f9918092a1eadfdd9d53dd0049cb07a4b7af510
---

# Qualität

Regressionen laufen über `node --test` mit importierbaren Hilfsfunktionen; kein Build-Schritt, keine externen Test-Dependencies.

## Why this shape
Der Skill ist reines Node (ESM); der eingebaute Test-Runner hält die Toolchain bei null Dependencies.

## Shape
`tests/` enthält Smoke-/Regressionstests (node:test + assert/strict, keine Dependencies), ausgeführt mit `node --test "tests/**/*.mjs"` (Node v24: Positional-Args sind Globs, ein Verzeichnis-Argument wird nicht discovered). Netzfreie Tests nutzen temporäre Verzeichnisse (`mkdtempSync`), injizierte Kandidatenpfade, `fetchImpl`- und `secrets`-Injektion in `todoistRequest`/`todoistSync` sowie fetch-loader-Spawns mit `WORKSPACE_ROOT`-Env statt Homedir-/Netz-Manipulation. `tests/registry-smoke.mjs` pinnt den Secrets-Fallback-Scan, Priorität und Fehlersemantik (`missing_secrets_file`, invalid-JSON-Throw, lazy scan); `tests/cli-smoke.mjs` pinnt Batch-Reihenfolge und Envelope (`{ok,total,created,failed_count,results,failed}`, exit-Semantik), find-or-create-Pagination und CLI-Validierungspfade. Kein Linter/Prettier konfiguriert.

- [tests/registry-smoke.mjs](../../../tests/registry-smoke.mjs) — `tests/registry-smoke.mjs:57`
- [tests/cli-smoke.mjs](../../../tests/cli-smoke.mjs) — `tests/cli-smoke.mjs:111`

## Connected to
[Client](client.md), [CLI](cli.md), [Todoist-Schema](todoist-schema.md), [Sync](sync.md).

## If you change this
- **Hits:** Verifikationskommandos in Runs, README-Test-Hinweise.
- **Does not hit:** Kuratierte Referenzen; Todoist-Endpunkte selbst.

## Surfaces
`node --test "tests/**/*.mjs"` ist der lokale Verifikationsbefehl ohne API-Token.

## See
Verifikationsreihenfolge im Run: [Änderungsrouting](../effects/CONTEXT.md).