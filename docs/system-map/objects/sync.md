---
type: object
cluster: domain
universe: live
status: verified
entity: scripts/sync-resources.mjs
verified_at: 2026-09-30
revision: 974c6a71dd12d6943b46380f815cb8534f869397
---

# Sync

Inkrementeller Zustandsabruf über den Sync-Endpunkt; der Skill liest, schreibt aber keine Sync-Commands.

## Why this shape
Effizienter Mehrressourcen-Abruf in einem Request statt vieler REST-Calls; Schreib-Batching (Command-UUIDs, `temp_id`) ist dokumentiert aber im Skill noch nicht verdrahtet.

## Shape
`sync-resources.mjs` parst `--sync-token` (Default `*`) und `--resources` (Kommaliste oder JSON-Array; Default `["projects","items","sections","labels"]`) und ruft `todoistSync` auf, das `sync_token` und `resource_types` als urlencoded Form an `POST /sync` sendet. Ausgabe: `{ok, requested, sync_token, full_sync, resource_keys, data}`. Für Folgeabrufe ist der zurückgegebene `sync_token` zu persistieren; `full_sync` unterscheidet Erst- von Delta-Abruf. Verwendete Resource-Typen umfassen u. a. `projects`, `items`, `sections`, `labels`; `items` sind Tasks in Sync-Sprech. Sync-Command-Batching (max. 100 Commands/Request, UUID-Idempotenz, `temp_id_mapping`) ist als Referenzwissen in `references/limits-and-errors.md` kuratiert, aber kein Skript führt Commands aus.

- [scripts/sync-resources.mjs](../../../scripts/sync-resources.mjs) — `scripts/sync-resources.mjs:3` (parseResources), `scripts/sync-resources.mjs:23` (parseArgs)
- [scripts/_todoist-client.mjs](../../../scripts/_todoist-client.mjs) — `scripts/_todoist-client.mjs:227` (todoistSync)
- [references/sync.md](../../../references/sync.md) — `references/sync.md:5`
- [references/limits-and-errors.md](../../../references/limits-and-errors.md) — `references/limits-and-errors.md:14`

## Connected to
[Client](client.md), [Todoist-Schema](todoist-schema.md), [CLI](cli.md), [Qualität](quality.md). Prozesse: [sync-call](../processes/sync-call.md).

## If you change this
- **Hits:** `todoistSync`-Export und dessen Aufrufer, Sync-Referenzen, Resource-Typ-Katalog.
- **Does not hit:** REST-Lesepfade (`list-tasks`, `get-task`); Secret-Konvention.

## Surfaces
Aufgerufen als CLI aus Agent-Workspaces; gelesen wird die externe Todoist-Sync-API. Kein lokaler Sync-Status im Repository (kein `sync_token`-Speicher).

## See
Kuratierte Sync-Regeln: [references/sync.md](../../../references/sync.md). [Änderungsrouting](../effects/CONTEXT.md).