# Änderungsauswirkungen — Routing

Inputs: Änderungsauftrag. Nicht den gesamten Baum laden; die Karten tragen die Details.

| Änderung | Zuerst öffnen |
| :--- | :--- |
| Secrets-Resolvierung, Account-Auswahl | [Client](../objects/client.md), [Qualität](../objects/quality.md) |
| REST-Endpunkte, Request-/Response-Felder | [Todoist-Schema](../objects/todoist-schema.md), [CLI](../objects/cli.md) |
| CLI-Skript hinzufügen, Argumente, Ausgabeformat | [CLI](../objects/cli.md), [Qualität](../objects/quality.md) |
| Sync-Verhalten, Sync-Token, Ressourcen-Abruf | [Sync](../objects/sync.md), [Qualität](../objects/quality.md) |
| Arbeitsregeln, Referenz-Kurating, Routing | [Skill-Verhalten](../objects/skill-behavior.md) |
| tests/ erweitern | [Qualität](../objects/quality.md) |

Process: Hits/Does not hit der Karten gegen den konkreten Diff prüfen; Scope und passende Tests ableiten. Skripte und SKILL.md/Katalogreferenzen im selben Arbeitsschritt synchron halten.
Outputs: Änderungsliste und synchron aktualisierte Karten. Offene Arbeit als GitHub Issue.
Human Check: SKILL.md, Skriptverhalten und System-Map widersprechen sich nicht; Quelllinks bleiben gültig.