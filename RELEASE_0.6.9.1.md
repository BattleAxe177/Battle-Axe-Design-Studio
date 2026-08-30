# Battle Axe Design Studio v0.6.9.1

## Scenario Library + Tactical Planning / External AI Exchange

## Deployment Hotfix

- Repairs the GitHub Actions **Verify** failure in the first v0.6.9.0 package. The feature overlay advanced `VERSION`, while the inherited `index.html` still carried the previous hard-coded runtime/main-module cache version.
- Makes `VERSION` the build-time source of truth: the deployed `dist/index.html` receives the current runtime label, bootstrap messages, and `main.js?v=` cache key automatically.
- Copies `scenarios/` into `dist/`, which is required for the repository-hosted Scenario Library to load on GitHub Pages.
- Extends static deployment checks to require the Scenario Library catalog and to verify deployed version/cache-key parity.
- Browser-guards the v0.6.9.x release bootstrap so Node-based verification cannot accidentally dereference `window` or `document`.


**Baseline:** v0.6.8.1 Copy/Overwrite release  
**Package type:** Copy/Overwrite overlay — extract into the repository root and overwrite matching files.

### Scenario Library

- Adds a repository-hosted **Scenario Library** accessed from the Studio header.
- Reads a data-driven `scenarios/index.json` catalog and loads a selected scenario through the same migration/normalization path used by **Open Project**.
- Keeps editable Studio JSON as the canonical portable scenario/project format.
- Supports Published, Playtest, Sample, and Development catalog statuses.
- Fails gracefully when the catalog is unavailable or the site is being used offline.
- The initial catalog is intentionally empty: no development scenario is silently promoted to a published scenario.

### Tactical Plan interpretation — visible and fail-closed

- Adds a plain-English **Engine Interpretation** under written Tactical Plan fields.
- Shows resolved game terms, targets, named terrain, timing/release conditions, and execution notes.
- Written clauses that cannot be converted into a supported deterministic predicate block Playtest rather than silently falling back to an unrelated default.
- Zero-input Auto Plan remains available; a blank text field does not create an error.

### Formation-relative flank orders are executable

- “Attack the Confederate left flank”, “attack Mahone's right flank”, and equivalent supported wording now produce a real formation-relative target rather than a generic lateral maneuver.
- Left/right are calculated from the **target formation's current average facing and live footprint geometry**.
- The flank anchor therefore updates if the target formation wheels or changes orientation.
- The attacking command is assigned coherent frontage/wave destinations around the requested flank.
- Movement remains tied to the designated enemy side/formation after reaching the flank instead of reverting to an unrelated nearest target.
- Tactical scoring strongly discourages a premature frontal charge or a charge against an unrelated formation while a written flank mission is active, and rewards engagement from the requested flank.
- If a written reserve instruction includes a post-release action (for example, “then assault their left flank”), the command changes to that post-release order after the release condition latches.

### Exact named-terrain reserve release

- Supports deterministic triggers such as **“hold in reserve until the Confederates reach Willis Church Road.”**
- The parser resolves the written feature name against approved runtime terrain IDs.
- A trigger is satisfied when an eligible unit from the named/derived side (or named command) physically reaches/overlaps the resolved terrain geometry.
- Multiple map segments carrying the same resolved feature name are treated as one named terrain reference; contact with any matching segment satisfies the trigger.
- Release is latched at command level and logged with the triggering terrain feature and triggering unit.
- The same predicate gates both on-table Reserve behavior and off-table reserve entry; deployment turn remains an earliest-eligible-turn constraint, not a replacement for the written trigger.
- A command name that merely identifies the command receiving the order (for example, “Hold Simmons in reserve…”) is not mistakenly treated as the enemy trigger formation.

### Auto Tactical Planner — first command-planning layer

- Adds a visible **Preview Auto Plan** control.
- With no authored plan, Studio now creates a side-level concept including a main effort, supporting commands, screens/artillery roles, and a reserve where force structure permits.
- The generated plan is command-level: commands receive missions and units continue to execute through the common Battle Axe movement/combat engine.
- This is a deterministic planning layer, not a claim of human-general-level AI; future releases can deepen period doctrine and replanning without changing the scenario format.

### External AI Exchange — one file out / one file back

- Adds one-file ZIP exchange to the existing Scenario Design External AI bridge while retaining paste for short responses.
- Adds an **External AI Tactical Bridge** for playtest planning.
- Preferred workflow: download one request ZIP, give it to the external AI, receive one response ZIP, import once.
- A ZIP contains a single JSON payload (`request.json` or `response.json`); bare JSON and paste remain supported fallbacks.
- External AI output is validated before application; unknown command IDs, unsupported orders/postures, unresolved questions, and scenario-revision mismatches are rejected.
- The external AI proposes plans only. Battle Axe remains authoritative for rules, geometry, movement legality, collision, combat, and simulation state.

### Charge-through-unit verification

- v0.6.8.1 already uses continuous swept-footprint first-contact logic for charge paths.
- v0.6.9.1 adds release-owned regression coverage for both friendly and unintended-enemy intervening units between a charger and its declared target.
- A charge path encountering either must be rejected as `charge path blocked` rather than passing through the intervening base.

### Compatibility / architecture

- ACW remains a period supplement on the shared Battle Axe engine; these tactical geometry/release improvements are implemented in the common playtest path rather than by creating an ACW fork.
- No printed Battle Axe Core or Italian Wars rules text is changed by this release.
- Existing local project JSON import/export remains supported.
- The v0.6.9.1 playtest worker cache-busts the worker URL so the upgraded tactical engine is not accidentally bypassed by a cached v0.6.8.1 worker.

### Verification added

Release-owned tests cover:

- charge path blocked by an intervening friendly unit;
- charge path blocked by an unintended enemy unit;
- semantic resolution of Confederate left flank;
- exact named-terrain release interpretation;
- combined Reserve → named-terrain trigger → post-release flank assault interpretation;
- application of the v0.6.9.1 tactical engine transform to the v0.6.8.1 baseline;
- one-file AI ZIP exchange;
- Scenario Library / External AI / Auto Plan wiring.

