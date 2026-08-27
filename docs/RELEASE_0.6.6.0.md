# Battle Axe Design Studio v0.6.6.0 — Workflow Reliability Hotfix

This is a full copy/overwrite release built from the v0.6.3.0 source baseline, with the source files included in the package.

## Fixed
- Scenario-only JSON imports now recover the scenario title and table size instead of appearing to load a blank 48x48 project.
- Full Studio project exports preserve playtest workspace state and battlefield/terrain project state.
- PowerPoint freeform geometry now applies shape rotation, flips, and group transforms before terrain geometry is normalized.
- Group-level PowerPoint alt text is inherited by child geometry when the child has no explicit description; child metadata remains authoritative when present.
- Geometry Explorer promotions normalize machine-generated names after classification and regroup under the accepted terrain family.
- Road is a first-class Terrain Review rule effect. Roads confer no speed bonus and create a movement-only Open corridor when any part of the unit footprint overlaps the road.
- ACW force extraction recognizes Union/Confederate headings, brigade headings, inline ranked commanders, and parent division/command context more reliably.
- Deployment Editor adds command-level bulk rotation while retaining per-unit facing controls.
- Terrain Review multi-select controls remain sticky at the top of the feature list.

## Packaging
This ZIP is intended for the established workflow: extract, copy all files into the Battle-Axe-Design-Studio repository, overwrite matching files, commit, and Push origin.
