# Verification — v0.6.4.0 Update Package

## Packaging failure resolved

The earlier release attempt failed because the update installer contained an invalid nested JavaScript template literal. The installer has been rewritten and now passes `node --check`. A post-apply syntax gate was added so modified core JS cannot be reported as a successful update if it is syntactically invalid.

## Standalone regression harness

The v0.6.4.0 modules and Glendale fixture were executed in a minimal Node ESM harness before packaging.

Result: **7 passed / 0 failed**.

Covered invariants:

1. seven source-authored Glendale rules preserved as accepted SOURCE rules;
2. 13 Pennsylvania Reserve regiments + five batteries extracted without duplication;
3. James J. Archer remains a brigade commander and cannot become an `Archers` unit;
4. Longstreet and A. P. Hill subordinate brigades preserve parent command and remain unit-unresolved where regiments are absent;
5. roads suppress Difficult/Impassable movement only and never produce a speed bonus;
6. PowerPoint boundary coordinates transform into the rendered SVG frame;
7. boundary metadata aliases and black-frame SVG fallback are supported.

## Release-source verification boundary

This ZIP is an incremental update against the public v0.6.3.0 source tree rather than a bundled copy of that whole repository. The v0.6.3.0 release documentation identifies the shared rectangular geometry and ACW baseline this update targets. The updater validates the expected v0.6.3.0 version and exact source anchors before changing files, backs up originals, and fails instead of guessing when a required anchor is absent.

Because the complete v0.6.3.0 repository tree is not embedded in this package, its full release-owned test manifest and static GitHub Pages build are **not claimed as having been rerun inside this packaging environment**. Run the normal repository tests/build after applying the updater and before publishing.

## Mandatory live acceptance tests

- Glendale black border fills the battlefield viewport and terrain selection overlays the correct source geometry.
- The seven source rules appear immediately after intake analysis and survive edit/save/reload.
- Force Builder shows readable stacked Union/Confederate proposed OOBs and does not invent missing regiment rosters.
- Command bulk rotate changes facing only and is all-or-nothing when legality fails.
- A unit with any base portion on a road can move through underlying Difficult/Impassable terrain with normal Open movement distance, while non-movement effects from that terrain still adjudicate normally.
