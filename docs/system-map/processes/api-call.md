---
type: process
universe: live
status: verified
entity: scripts/_todoist-client.mjs
consumes: [client.md]
produces: [cli.md]
verified_at: 2026-09-30
revision: 974c6a71dd12d6943b46380f869397
---

# API-Call (REST)

Einzelner REST-Aufruf von CLI-Skripten über den gemeinsamen Client.

## Why this shape
Jedes Skript validiert Argumente lokal, der Client bündelt Auth, URL-Bau, HTTP und Fehler-Envelope — Retries und Rate-Limits bewusst nicht im Client (CLI-Skripte bleiben dünn).

## Steps
1. CLI-Skript parst Argumente handgeschrieben und validiert Pflichtfelder (Nutzungsfehler: `printError` + exit 2, z. B. `scripts/list-tasks.mjs:39`).
2. Skript ruft `todoistRequest` mit `method`, `path`, `query`/`body` (`scripts/_todoist-client.mjs:106`).
3. Client liest per `loadApiToken` das Bearer-Token neu aus der Secrets-Kette (`scripts/_todoist-client.mjs:114`) — kein Caching; Account-Auflösung über `resolveAccount`.
4. `buildUrl` setzt Query-Params und lässt `undefined`/`null`/`''` weg (`scripts/_todoist-client.mjs:73`); Body wird als JSON serialisiert.
5. `fetch` (global) sendet an `https://api.todoist.com/api/v1...`; Response-Body wird als JSON (oder `{raw}`) gelesen (`scripts/_todoist-client.mjs:93`).
6. Nicht-ok: `buildError` hängt `status` und Body an das Error-Objekt (`http_<status>`); Skript gibt `printError`-Envelope auf stderr aus und beendet mit exit 1.
7. Ok: Skript reduziert die Antwort auf einen Envelope (`{ok, ...}`) via `printJson` auf stdout.

## If you change this
- **Hits:** Alle CLI-Skripte (`scripts/*.mjs`), Error-Envelope-Verbraucher, netzfreie Test-Strategie.
- **Does not hit:** Sync-Form-Encoding (`todoistSync` hat eigenen Pfad); kuratierte Referenzen.

## Surfaces
Externer Endpoint `api.todoist.com` (Bearer); aufgerufen von CLI-Skripten dieses Repos.

## See
Client-Karte: [Client](../objects/client.md). [Änderungsrouting](../effects/CONTEXT.md).