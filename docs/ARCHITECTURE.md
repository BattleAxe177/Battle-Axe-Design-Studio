# Battle Axe Design Studio Architecture

The browser application is project-centric. The long-term modules share one project state and one battlefield feature database.

- **Map Studio:** immutable source intake, geometry extraction, interpretation, feature review, Geometry Explorer.
- **Scenario Studio:** factions, forces, objectives, victory conditions, external scenario rules, historical traceability.
- **Deployment Editor:** scenario-defined play space, 50 mm unit bases, 25 mm commanders, zones, entry points and facing.
- **Battle Axe Engine:** deterministic adjudication, replay, AI, batch playtests.
- **Analytics:** movement/combat/casualty/commander/congestion heat maps and balance statistics.
- **Publisher:** scenario documents and engine-ready packages.

Source-map files remain immutable. Derived gameplay geometry and semantics are stored separately and require review.
