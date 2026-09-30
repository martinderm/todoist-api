# Todoist Idempotenz, Limits & Error-Semantik

Stand: 2026-09-30

## Idempotenz

- Ein `X-Request-Id`-Header ist in der offiziellen API-Doku **nicht dokumentiert**; es existiert kein generischer REST-Retry-ID-Mechanismus.
- Die einzige dokumentierte Idempotenzebene liegt in der Sync API: **Command-UUIDs**. Todoist führt einen Command mit bereits verwendeter UUID nicht erneut aus — Clients können sicher retryen, ohne doppelt zu schreiben.
- Rest-Creating ist demnach nicht nativ idempotent: Retry nach Netzfehler vor dem Response kann Duplikate erzeugen. Bei Schreiboperationen über `/sync` daher `uuid` pro Command stabil und wiederholbar wählen.

## Sync-Batching

- `/sync` nimmt ein `commands`-Form-Field mit JSON-Array von Commands; changes können in einem Commit gebündelt werden.
- Command-Form: `{type, uuid, temp_id?, args}`; für Task-Erstellung `type: "item_add"` mit `args: {content (required), description, project_id, section_id, priority (1-4), due, deadline, labels, auto_reminder, ...}`.
- `temp_id` ist ein Client-vergebener Platzhalter; die Antwort mappt ihn unter `temp_id_mapping: {"<temp_id>": "<echte ID>"}`. Andere Commands im selben Request können sich auf `temp_id` beziehen (z. B. `project_add` + `item_add`).
- `section_id` in `item_add`-Args: `null` für Tasks ohne Section.
- Ein clientseitiger `tmp-...`-Platzhalter (UI-Kontext, optimistic updates) ist NICHT dasselbe wie ein Sync-`temp_id`; `tmp-`-IDs scheitern an REST-Endpunkten (Validation Error, z. B. `Non-base32 digit found`).

## Limits

- Max. **100 Commands** pro Sync-Request (zählt als ein Request).
- Sync-Rate-Limits: 1000 partial syncs / 15 min, 100 full syncs / 15 min.
- 1 MiB Request-Body-Limit für POST; Header max. 65 KiB; Upload-Timeout 5 min, Standard-Request-Timeout 15 s.
- REST-Pagination: `limit` Default 50, max 200 (`>200` → Validation Error); `cursor` ist opak und nur mit identischen Request-Parametern wiederverwendbar; `next_cursor: null` markiert das Ende.

## Error-Envelope

REST 4xx (application/json):

```json
{
  "error": "<message>",
  "error_code": 477,
  "error_extra": { "retry_after": 3, "event_id": "<hash>" },
  "error_tag": "UNAUTHORIZED",
  "http_code": 401
}
```

- Bekannte error_code-Beispiele: 477 `UNAUTHORIZED` (mit RFC-6750 `WWW-Authenticate`-Challenge), 478 `NOT_FOUND`.
- `error_extra`-Felder u. a.: `argument`, `explanation`, `retry_after` (auch außerhalb 429), `workspace_id`, `max_count`, `event_id`, `project_id`.
- Sync-Command-Fehler stehen pro Command unter `sync_status["<command-uuid>"]` in derselben Envelope-Form; `400`-Command-Fehler sind terminal (nicht retryen).
- 429 Too Many Requests möglich (Rate-Limits oben).

## Praktische Regeln

1. Batch-Task-Erstellung über `item_add`-Commands mit bis zu 100 Commands pro Request; Client-seitige Loop über `POST /tasks` nur bei kleinen Mengen oder wenn Einzelergebnisse sofort pro Task gebraucht werden.
2. Command-UUIDs deterministisch aus Task-Attributen ableiten (z. B. Hash aus content+project_id+message_id) für sicheres Retry.
3. Kein `X-Request-Id`-Header senden (nicht dokumentiert; SKILL.md-Anforderung „wenn die Doku sie vorsieht" greift nicht).

## Quellen

- Todoist API
  - URL: https://developer.todoist.com/api/v1/
  - Relevante Stellen: Sync Overview (Command UUID, Temporary resource ID, Batching commands, Response / Error), Request limits, Pagination
  - Gelesen: 2026-09-30