# Battle Axe Design Studio Architecture

The browser application is project-centric. The long-term modules share one project state and one battlefield feature database.

- **Map Studio:** immutable source intake, geometry extraction, interpretation, feature review, Geometry Explorer.
- **Scenario Studio:** factions, forces, objectives, victory conditions, external scenario rules, historical traceability.
- **Deployment Editor:** scenario-defined play space, 50 mm unit bases, 25 mm commanders, zones, entry points and facing.
- **Battle Axe Engine:** deterministic adjudication, replay, AI, batch playtests.
- **Analytics:** movement/combat/casualty/commander/congestion heat maps and balance statistics.
- **Publisher:** scenario documents and engine-ready packages.

Source-map files remain immutable. Derived gameplay geometry and semantics are stored separately and require review.

## Scenario Builder alpha (v0.4.0-alpha.1)

Scenario authoring follows the same non-destructive pattern as map compilation:

`source evidence -> extracted observations -> optional Studio suggestions -> designer-approved scenario model`

Source observations record what an imported document says. Studio suggestions are separately stored design proposals and never become scenario rules automatically. Historical/source force records remain distinct from Battle Axe roster unit instances. Roster units reference canonical library profiles but may carry scenario-specific names, commanders, represented formations, notes, and traits without modifying the canonical profile.

The current static browser alpha directly extracts plain-text formats. PDF, DOCX, and image sources are registered as immutable evidence but require a later document-analysis service for reliable arbitrary/scanned-page extraction.
