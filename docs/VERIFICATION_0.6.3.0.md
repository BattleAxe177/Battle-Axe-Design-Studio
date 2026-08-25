# Verification — v0.6.3.0

## Automated release verification

The release-owned test manifest is `tests/current-tests.json`.

Final verification target:

- Release manifest: `0.6.3.0`
- Manifest-owned test files: 32
- Automated tests: **174 passed / 0 failed**
- Static build: **passed**
- Static deployment check: **passed**

## New v0.6.3.0 regression coverage

`tests/v0630_acw_custom_bases.test.mjs` verifies:

- legacy square bases migrate to explicit width/depth without changing the footprint;
- 50 × 25 mm bases are frontage-by-depth and remain rotation-aware;
- edge touch is legal while penetration is illegal;
- explicit/fixed `baseMm` remains square under rectangular scenario defaults;
- scenario rectangular defaults and per-unit overrides reach runtime geometry;
- a base-size change that creates an overlapping deployment is detected and blocks playtest start;
- the ACW plugin exposes the exact four published profiles plus a clearly non-RAW 50 × 25 Studio recommendation;
- ACW 1-inch commander influence is measured using physical base gap;
- ACW brigade-line AI uses actual frontage and depth for lateral slots and successive waves;
- authoring, Deployment, replay, and Publisher all expose/consume rectangular dimensions.

Prior release-manifest tests continue to cover the ACW rules plugin, common-engine geometry, charge/contact/conform, deployment drag lock, replay diagnostics, reserve/screen behavior, battlefield synchronization, scenario isolation, legacy import, Publisher print colors, and starting-facing preservation.

## Manual/live verification still required

The following should be tested in the deployed Studio before being considered closed in practical use:

1. Deploy a brigade of 50 × 25 mm regiments at multiple facings and verify there is no visible overlap when legality says clear.
2. Change an already-deployed scenario from 25 × 25 or 50 × 50 to 50 × 25 and confirm illegal placements are visibly flagged and playtest is blocked until corrected.
3. Drag a rectangular unit from center, corner, and near-edge grab points; verify the original grabbed point stays under the cursor.
4. Rotate long bases near friendly units and battlefield edges; verify illegal rotations are rejected.
5. Run large offensive commands through constrained frontage and review first-wave/follow-up/support behavior and blocker-first sequencing.
6. Test Screen orders with Sharpshooters and Cavalry on irregular terrain.
7. Test long bases manning oblique linear Defensive features.
8. Print/export a deployment map with rectangular Union/Confederate bases and verify proportions, facing, labels, and side colors.
9. Load representative older scenario JSON files and confirm in-memory migration plus post-migration geometry warnings.
10. Smoke-test Battlefield Workspace, Geometry Explorer, Deployment, Playtest, and Publisher against the same active battlefield/crop after importing a new map.

The release notes intentionally do not claim these live behaviors are fully proven merely because automated tests pass.
