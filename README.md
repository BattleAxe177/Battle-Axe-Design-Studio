# Battle Axe Design Studio v0.6.5.0 — Map Authoring & ACW OOB Reliability

This release hardens the PowerPoint-first battlefield compiler and improves the ACW scenario workflow exposed by the Glendale test case.

Highlights:

- PowerPoint freeform rotation, flip, and grouped transforms are applied before terrain geometry is normalized;
- PowerPoint group alt text can supply semantic terrain metadata to child geometry, while explicit child metadata wins conflicts;
- authored PPT geometry is geometrically cross-checked against SVG detector output; an uploaded PDF remains a registered appearance reference rather than a competing geometry source;
- no-alt-text terrain can fall back to reviewable visual/style inference, including the Glendale woodland layer;
- grouped fences and creeks can inherit their parent semantic metadata instead of falling into Geometry Explorer solely because child segments have no alt text;
- promoted/reclassified Geometry Explorer objects receive canonical terrain names/categories while meaningful designer/source names are preserved;
- Road is now a first-class Terrain Review rule role, with no movement bonus and movement-only bypass of underlying Difficult/Impassable terrain;
- switching the Scenario Builder period supplement re-analyzes source evidence so an ACW OOB does not remain stuck with stale Italian Wars interpretation;
- the proposed-force display is a full historical command tree and preserves unresolved brigades rather than hiding or inventing their regiments;
- Terrain Review multi-feature controls remain sticky and now sit flush at the top of the review pane.

The ACW supplement remains a plugin on the shared Battle Axe engine. Existing deployment-facing authority, rectangular base geometry, command-level bulk rotation, battlefield crop synchronization, scenario-rule ingestion, Publisher behavior, and Italian Wars isolation are preserved.

See `docs/RELEASE_0.6.5.0.md` and `docs/VERIFICATION_0.6.5.0.md`.
