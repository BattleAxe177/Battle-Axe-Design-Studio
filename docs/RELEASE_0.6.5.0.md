# Battle Axe Design Studio v0.6.5.0 — Map Authoring & ACW OOB Reliability

## Scope

v0.6.5.0 is a focused map-authoring and scenario-analysis update on the v0.6.4.0 ACW workflow baseline. The Glendale PowerPoint is used as a regression fixture for general PowerPoint authoring patterns rather than as a scenario-specific exception.

## PowerPoint rendered-geometry reconstruction

The structured PPTX compiler now reconstructs the geometry PowerPoint actually renders instead of assuming that an object's original local freeform path is already in final slide orientation.

- Shape rotation is read from DrawingML and applied around the authored shape center.
- Horizontal and vertical flip transforms are honored.
- Group translation/scale/rotation/flip transforms are composed with child transforms.
- Nested group transforms propagate to descendant geometry.
- Freeform, line, connector, and ordinary shape geometry are normalized only after these transforms are applied.
- Terrain-review reasons record when a PowerPoint rotation was applied, making transform handling auditable.

This directly addresses the common authoring pattern of drawing a feature, copying formatting, and then rotating the object afterward.

## PPTX / SVG / PDF source roles

The three-source workflow is now made more explicit:

- **PPTX** remains the semantic and authored-geometry authority: object hierarchy, alt text, authoring identity, freeform geometry, and DrawingML transforms.
- **SVG** remains the rendered vector/display source and now geometrically corroborates transformed PPT terrain footprints. Corroboration statistics are stored with the compiled battlefield rather than silently overriding authored geometry.
- **PDF** remains a registered appearance/reference source. It is not treated as machine-authoritative geometry in the browser compiler.

This means the system can catch/diagnose disagreements without letting the rendered source erase useful PowerPoint author metadata.

## Group semantic inheritance

PowerPoint maps may apply alt text either to individual shapes or to a group containing many child shapes. The compiler now supports both patterns.

- Explicit child alt text has highest priority.
- Otherwise, meaningful parent-group metadata propagates to otherwise-unclassified children.
- Nested group metadata propagates downward.
- If child and parent metadata resolve to different terrain classes, the child classification wins and the conflict is recorded in the feature reason.
- A stale parent label therefore cannot overwrite a more specific child label such as `Wetland`.

This allows grouped `Fences` and `Creeks - no game impact` source objects to retain their authored semantics even when the individual child segments have no alt text.

## Visual/style fallback for terrain without alt text

No alt text no longer implies that authored geometry is semantically useless. When neither the object nor any ancestor supplies terrain metadata, the compiler can use conservative, lower-confidence style/geometry inference and keep the result reviewable.

The first protected cases include:

- complex multipart green authored freeforms as woodland candidates;
- blue elongated linework as watercourse candidates;
- brown elongated linework as fence candidates;
- pale elongated route linework as road candidates.

These fallbacks intentionally carry lower interpretation confidence than author-supplied metadata.

## Terrain Review normalization and roads

Geometry Explorer promotion now behaves like resolution of a source candidate rather than merely copying an ugly machine label into the tabletop list.

- A promoted/reclassified machine-named item such as `Unclassified Shape 37` receives a canonical display identity such as `Fence N` once its class is resolved.
- The resolved feature moves into the normal category for that class immediately.
- Source/internal IDs remain stable for provenance.
- Meaningful source- or designer-authored names are not overwritten.

Road is now a first-class Battle Axe Terrain Review role.

- `Classification = Road` automatically carries the `Road` movement role.
- The rule is visible in Rules Context as **Road corridor**.
- Roads grant no movement bonus.
- For movement only, any unit with some portion of its base overlapping a Road ignores underlying Difficult/Impassable movement effects.
- Other terrain effects remain applicable.
- Generic `Track` remains a separate classification unless the designer explicitly makes it a Road.

Multi-feature Terrain Review controls remain conditional on selecting two or more features, but the sticky header and bulk bar now sit flush at the top of the scroll pane.

## ACW source analysis and proposed OOB

Changing the Scenario Builder period supplement now re-analyzes retained source text using the newly selected supplement vocabulary. This prevents an ACW scenario from retaining stale force interpretation produced while Italian Wars was selected.

The final designer-built roster and deployment are preserved during this source re-analysis.

The proposed force display now follows the historical command hierarchy rather than presenting a flat list of profile matches:

- higher command / division;
- brigade or artillery command;
- explicitly supplied regiment/battery formations;
- unresolved subordinate commands retained even when no regiment roster is supplied.

The Glendale ACW regression continues to require all 13 listed Pennsylvania Reserve regiments and five named batteries while preserving supporting and Confederate brigades with incomplete rosters as unresolved command nodes. No missing regiments are fabricated.

## Preserved v0.6.4.0 behavior

- authored black-border crop and map/overlay coordinate synchronization;
- source-authored scenario-rule ingestion;
- ACW canonical unit library and rectangular base support;
- individual and command-level deployment rotation;
- road movement engine policy;
- scenario isolation and stale-map protections;
- Publisher and Playtest use of authoritative Deployment facing;
- Italian Wars plugin isolation.

## Manual acceptance priorities

After publishing, live-browser testing should emphasize:

1. rotated Glendale crop fields align with the actual rendered fields;
2. grouped fences/creeks inherit their parent semantics and no longer flood Geometry Explorer as unrelated unknowns;
3. no-alt-text woodland is detected as reviewable terrain rather than silently lost;
4. classifying a promoted Geometry Explorer object as Fence/Road immediately renames/regroups machine-generated entries;
5. Road classification shows the Road corridor rule and movement behaves correctly through difficult/impassable surroundings;
6. changing Italian Wars → American Civil War refreshes the proposed OOB from the retained source without deleting the designer's final roster;
7. Union and Confederate proposed force trees remain readable at normal desktop widths.
