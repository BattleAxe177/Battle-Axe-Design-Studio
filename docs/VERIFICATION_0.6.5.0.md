# Verification — Battle Axe Design Studio v0.6.5.0

## Automated repository verification

The release-owned current test manifest contains 34 test files and completed with:

**188 tests passed / 0 failed.**

The v0.6.5.0 regression file adds coverage for:

- DrawingML shape rotation around the PowerPoint shape center and flip handling;
- source wording such as `Creeks - no game impact` preserving the Stream classification while clearing gameplay effects;
- Road classification carrying the explicit Road engine role;
- Track remaining separate from Road;
- machine-generated Geometry Explorer names being eligible for canonical rename while meaningful names are protected;
- Glendale ACW command hierarchy, supporting commands, and unresolved Confederate brigades;
- source re-analysis on supplement change;
- compiler source safeguards for group metadata inheritance and visual/style inference;
- Terrain Review canonical regrouping and sticky bulk-control placement;
- SVG corroboration metadata and truthful PDF reference-only status.

The prior v0.6.4.0 regression coverage remains in the current manifest and continues to protect source-authored scenario rules, the 13 McCall regiments, five batteries, Archer surname handling, no road movement bonus, and authoritative battlefield cropping.

## Build and static deployment verification

The release was also subjected to the normal static GitHub Pages build and deployment checks. The packaged tree is the same source tree verified by those checks.

## Important verification boundary

Automated tests verify code contracts and deterministic engine behavior; they do not prove visual correctness in every browser or PowerPoint-export combination. The following remain live acceptance tests:

- exact overlay registration of all rotated/freeform PowerPoint features;
- practical fence/wood inference quality on the uploaded Glendale map;
- selection/regrouping UX after promoting Geometry Explorer candidates;
- sticky bulk controls at multiple window sizes;
- road/base overlap in a real playtest with overlapping non-movement terrain effects;
- supplement switching after substantial designer-authored final-roster work.
