---
type: process
universe: live
status: verified
entity: scripts/sync-resources.mjs
consumes: [client.md, sync.md]
produces: [cli.md]
verified_at: 2026-09-30
revision: 974c6a71dd12d6943b46380f869397
---

# Sync-Call

Zustandsabruf (Voll- oder Delta) über `POST /sync`.

## Why this shape
Ein Request für mehrere Ressourcentypen mit `sync_token`-Fortsetzung; Schreib-Commands sind dokumentiert aber im Skill noch nicht ausgeführt.

## Steps
1. CLI parst `--sync-token` (Default `*`) und `--resources` (Default `projects,items,sections,labels`; Kommaliste oder JSON-Array) (`scripts/sync-resources.mjs:3`, `scripts/sync-resources.mjs:23`).
2. `todoistSync` liest das Bearer-Token frisch über `loadApiToken` (`scripts/_todoist-client.mjs:139`).
3. Client sendet Form-encoded `sync_token` und `resource_types`-JSON an `POST /sync` (`scripts/_todoist-client.mjs:144`).
4. Nicht-ok: Fehler-Envelope über `buildError`/`printError` mit exit 1; ok: Envelope `{ok, requested, sync_token, full_sync, resource_keys, data}` (`scripts/sync-resources.mjs:47`).
5. Aufrufer persistiert den neuen `sync_token` für Delta-Folgeabrufe (Regel: `references/sync.md`), `full_sync` gibt an, ob der Abruf vollständig war.

## If you change this
- **Hits:** `todoistSync`-Export, `sync-resources.mjs`, Rate-Limit-Beachtung (100 full/1000 partial per 15 min), Resource-Typ-Katalog.
- **Does not hit:** REST-Lesepfade; Secret-Resolvierung selbst.

## Surfaces
Externer Endpoint `api.todoist.com/api/v1/sync` (Bearer); aufgerufen aus Agent-Workspaces. Kein Sync-Token-Speicher im Repository.

## See
Sync-Karte: [Sync](../objects/sync.md). Limits/Idempotenz: [references/limits-and-errors.md](../../../references/limits-and-errors.md). [Änderungsrouting](../effects/CONTEXT.md).