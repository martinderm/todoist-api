---
type: object
cluster: quality
universe: live
status: stub
entity: tests/
verified_at: 2026-09-30
revision: 974c6a71dd12d6943b46380f869397
---

# Qualität

Tests fehlen in dieser Revision vollständig (`status: stub`); dieses Repository hat keine `tests/`-Struktur, kein Testskript und keine Test-Dependencies. Verifikation ist bis zum Aufbau von `tests/` nur manuell (CLI-Smoke-Aufrufe) oder über aufrufende Workspaces möglich.

## Why this shape (target)
fireflies-api-Muster ist Referenz: `node --test` mit `node:test` + `assert/strict`, null Dependencies, netzfreie Tests über Injektion (Secrets-Pfade, fetch-Impl) statt Homedir-/Netz-Manipulation.

## Shape (target)
Geplanter Aufbau im Zuge der GitHub-Issues: `tests/` mit `node --test "tests/**/*.mjs"` (Node v24: Positional-Args sind Globs), Regressionen für Secret-Resolvierung (T1) und CLI-Verhalten (T2). Details nach Implementierung hier synchronisieren.

- [SKILL.md](../../../SKILL.md) — Sicherheits- und Qualitätsregeln
- [scripts/_todoist-client.mjs](../../../scripts/_todoist-client.mjs) — Testseam-Kandidaten (`loadSecretsJson`-Export, fetch-Injektion)

## Connected to
[Client](client.md), [CLI](cli.md).

## If you change this
- **Hits:** Verifikationskommandos in Runs, README-Hinweise.
- **Does not hit:** Externe Todoist-API; kuratierte Referenzen.

## Surfaces
Geplant: lokales `node --test` ohne API-Token; bis dahin keine automatisierte Verifikation.

## See
Analog-Muster: `../fireflies-api/docs/system-map/objects/quality.md` (Workspace-Sibling). [Änderungsrouting](../effects/CONTEXT.md).