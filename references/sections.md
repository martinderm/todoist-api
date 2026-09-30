# Todoist Sections

Stand: 2026-09-30

## Kurzfassung

- `GET /api/v1/sections` listet Sections und nimmt `project_id` als Query-Param: ohne Wert alle Sections aller Projects, mit Wert die Sections eines Projects (dann wird `workspace_id` ignoriert).
- Zusätzliche Query-Params: `workspace_id` (integer, ignoriert bei gesetzt `project_id`), `cursor`, `limit` (Default 50, max 200), `public_key`.
- Der Endpunkt ist paginiert (`results` + `next_cursor`).
- `GET /api/v1/sections/{section_id}` lädt eine einzelne Section (keine Paginierung).
- `POST /api/v1/sections` legt eine Section an: Body `name` (required), `project_id` (required), optional `order` (integer) und `description` (string).

## Section-Objekt

Felder laut Response-Sample: `id`, `user_id`, `project_id`, `added_at`, `updated_at`, `archived_at`, `name`, `description`, `section_order`, `order_key`, `is_collapsed`, `is_archived`, `is_deleted`.

## Find-or-create-Muster

Für Idempotenz beim Section-Anlegen: vor `POST /sections` eine `GET /sections?project_id=<id>`-Liste ziehen und auf Namensgleichheit prüfen; existiert die Section, den vorhandenen Eintrag zurückgeben statt ein Duplikat anzulegen. Eine namensgleiche Section im selben Project ist von Todoist nicht verboten (kein Unique-Constraint dokumentiert) — die Prüfung ist die einzige wirksame Idempotenzen-Ebene. Paginierung beachten (Projekte mit mehr als `limit` Sections benötigen den `cursor`-Nachlauf).

## Praktische Regeln

1. `project_id` und `workspace_id` nicht gemeinsam auswerten: bei gesetztem `project_id` wird `workspace_id` ignoriert.
2. Beim Filter nach Sections einer Client-Gruppe immer das konkrete `project_id` setzen statt Client-seitig zu filtern.
3. `limit` über `200` erzeugt einen Validation Error.

## Minimalbeispiele

```bash
curl "https://api.todoist.com/api/v1/sections?project_id=6XGgm6PHrGgMpCFX&limit=50" \
  -H "Authorization: Bearer YOUR_TODOIST_TOKEN"
```

```bash
curl https://api.todoist.com/api/v1/sections \
  -X POST \
  -H "Authorization: Bearer YOUR_TODOIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Groceries","project_id":"6XGgm6PHrGgMpCFX"}'
```

## Quellen

- Todoist API
  - URL: https://developer.todoist.com/api/v1/
  - Relevante Stellen: get_sections_api_v1_sections_get, get_section_api_v1_sections__section_id__get, create_section_api_v1_sections_post, Pagination
  - Gelesen: 2026-09-30