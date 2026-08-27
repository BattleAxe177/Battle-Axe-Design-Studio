# Battle Axe Design Studio v0.6.7.0 — Command, ACW AI & Scenario Portability

This release starts from the v0.6.5.0 battlefield-authoring baseline and concentrates on force interpretation, command hierarchy, ACW battlefield behavior, core LOS legality, reserves, initiative overrides, and durable scenario JSON.

Highlights:

- historical OOB parsing now builds the command tree before mapping leaf formations to Battle Axe profiles, preserving Army/Division/Brigade relationships, commanders, ratings, status, and unresolved commands;
- the Glendale ACW regression fixture resolves to 82 explicit leaf units in 27 command nodes without turning narrative notes into units;
- Command Authority is hierarchical and generic: a commander can affect only units in that command or descendant commands, allowing ACW brigade/division/corps/army structures and shallower Italian Wars equivalents to share one mechanism;
- ACW command AI now treats cohesion as a tactical preference, improves commander placement, and varies frontage/depth behavior for Defend, Advance, Assault, Reserve, and Screen orders;
- LOS legality now includes friendly units and commanders as blockers, with exact tested rays/blockers retained for diagnostics; the Glendale event-328 friendly-cannon case is a deterministic regression test;
- reserve commands can enter at the end of the owning side's turn by point, edge, edge segment, or polygon zone, using commander-first deployment (or a temporary command unit when no commander exists) and receiving no action on their entry turn;
- scenarios can specify a one-side Turn-1 initiative override and return to normal initiative thereafter;
- scenario/project JSON is now schema-versioned and self-contained, retaining the compiled map, approved terrain/features, decisions, command hierarchy, roster, deployment/facing, reserve entry data, rules, and other project state;
- legacy import migration uses safe defaults, preserves unknown fields where practical, and surfaces migration steps/warnings after import rather than silently dropping data.

The v0.6.5.0 PowerPoint/SVG battlefield compiler and terrain-review behavior remain the release baseline. Functional battlefield/compiler logic is intentionally unchanged by this release.

See `docs/RELEASE_0.6.7.0.md` and `docs/VERIFICATION_0.6.7.0.md`.
