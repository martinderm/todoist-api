# todoist-api — System-Map

ICM Form 6; Karte des Repository-Istzustands. Einstieg für Änderungen, keine zweite Spezifikation.

| Frage | Karte |
| :--- | :--- |
| Skill-Arbeitsregeln, Dual-Evidence und Factored Attribution | [Skill-Verhalten](objects/skill-behavior.md) |
| REST-/Sync-Client, Secrets-Resolvierung und Ausgabe-Envelope | [Client](objects/client.md) |
| Todoist-Feldkataloge und Task-/Section-Schemas | [Todoist-Schema](objects/todoist-schema.md) |
| CLI-Skripte und ihre Argumente | [CLI](objects/cli.md) |
| Inkrementeller Sync über `/sync` | [Sync](objects/sync.md) |
| Tatsächliche API-Flüsse | [Prozesse](processes/CONTEXT.md) |
| Tests | [Qualität](objects/quality.md) |
| Was trifft eine Änderung? | [Auswirkungen](effects/CONTEXT.md) |

Namensfallen: Quick Add (`POST /tasks/quick`, Natural-Language-Eingabe) ist nicht der REST-Create (`POST /tasks`); ein clientseitiger `tmp-...`-Platzhalter (UI-Kontext, optimistic updates) ist nicht dasselbe wie ein Sync-`temp_id` (Command-Platzhalter mit `temp_id_mapping`); „Folder" (Projektgruppierung) und „Workspace" (Mandant) sind verschiedene Ressourcen. `list-tasks --section-id` mappt auf den Query-Param `section_id` von `GET /tasks`.

Lade [CONTEXT.md](CONTEXT.md) und nur die zum Auftrag passende Karte. Neue Aufgaben: [GitHub Issues](https://github.com/martinderm/todoist-api/issues). Metadatenregeln: [_meta/schema.md](_meta/schema.md).