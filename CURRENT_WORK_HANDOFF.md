# Battle Axe Design Studio — current work handoff

Use this file to continue the task in a fresh ChatGPT/Codex conversation.

## Repository state

- Repository: `C:\Users\scott\Desktop\Battle Axe Design Studio\Battle-Axe-Design-Studio`
- Branch: `main`
- Last committed release: `5a65a81` (`v0.6.9.1`)
- Working tree: intentionally dirty; the v0.6.9.1 tactical work and the playtest performance repair are uncommitted.
- Public Pages site is still the older deployed release until these changes are committed/pushed.
- Local preview: serve `dist/` on any free localhost port after rebuilding. Temporary verification servers have been stopped.

## Completed and verified before the performance repair

- Canonical `TacticalIntent` module and fail-closed tactical-plan interpretation.
- Geographic versus formation-relative flank semantics.
- Structured Boolean reserve predicates (`ANY` / `ALL`), including artillery-destroyed OR turn threshold.
- Direct structured External AI intent validation/application.
- ACW Charge and Receive Charge test logging.
- Release cache/version normalization and startup module-load diagnostics.
- The features in this section remain regression-protected by the current 252-test release manifest.

## Glendale performance problem

User supplied `C:\Users\scott\Downloads\Battle_of_Glendale_Frayser_s_Farm_Studio_Project (6).json`.
It contains 91 roster units, 42 placements, 8 turns, and an approved Obscuring feature named `Woodland 2` with 4,131 polygon points. Before repair, one turn took about 17.5–18.6 seconds and produced about 12.6 MB of replay data; an eight-turn run took about 94 seconds in the direct engine and could appear much longer in the browser because of worker transfer/rendering.

## Performance repair currently in the working tree

In `src/modules/playtestEngine.js`:

- `canShoot` now rejects non-shooters, out-of-arc, out-of-range, and invalid artillery targets before expensive LOS geometry.
- Terrain parts cache bounds; closed obscuring polygons use exact segment crossing rather than dense ray sampling.
- Unit LOS checks use a conservative footprint-radius prefilter before polygon intersection.
- Replay snapshots have a static actor catalog plus delta snapshots with periodic checkpoints (`replayEncoding: delta-v1`).
- Batch runs retain replay payload only for the first result, since the UI displays the first replay and aggregates the rest.

In `src/modules/playtestCenter.js`, replay hydration passes the actor catalog and snapshot list/index to `toPctSnapshot`.

The final one-turn Glendale benchmark took 7.3–8.1 seconds (seed 42) and produced a 0.41 MiB replay. Repeating the seed produced identical events, final units, final commanders, winner, and VP totals.

The final eight-turn Glendale benchmark took 359.0 seconds (about 5 minutes 59 seconds) and produced a 3.1 MiB replay containing 1,861 snapshots (19 checkpoints and 1,842 deltas). Hydrating every replay frame took 183.5 ms, retained all 91 units and 25 commanders, matched the final engine state, preserved monotonic destruction, and observed 49 reserve/inactive transitions. Replay storage and hydration are no longer the material bottleneck.

A two-game, one-turn batch took 21.2 seconds. It retained replay only for the first game while preserving complete result summaries for both games.

The LOS repair now uses a state-revision-aware cached actor AABB broad phase. It caches exact footprint polygons, bounds, centers, and conservative radii; rebuilds only after position, facing, participation, or footprint state changes; and preserves the existing exact segment/polygon test as authoritative. A linear cached AABB index outperformed a uniform-grid prototype for the current actor population and long off-table segments.

The repair also corrected inactive reserve commanders being considered visible tactical targets. Inactive commanders neither block LOS nor enter nearest-visible-enemy selection until deployed.

Final Glendale results with the saved Playtest tactical workspace:

- Core engine, one turn, seed 42: 6.2 seconds production (5.6–6.8 seconds across diagnostic runs), 0.415 MiB full result, 188 snapshots. Fixed-seed repeat and exhaustive-LOS comparison were identical in events, final units, final commanders, winner, and VP.
- Core engine, eight turns: 78.3 seconds, 3.10 MiB full result, 1,861 snapshots (19 checkpoints / 1,842 deltas), Imperial 25–10. This matches the prior meaningful eight-turn result while improving runtime from 359 seconds.
- Actual v0.6.9.1 browser-worker overlay: 5.8 seconds for one turn and 65.4 seconds for eight turns after excluding inactive commanders. The final eight-turn overlay replay has 1,833 snapshots (19 checkpoints / 1,814 deltas) and is about 3.19 MiB.
- Final one-turn diagnostics recorded 16,859 LOS calls, 44,220,592 potential exhaustive actor checks, 3,792,501 AABB candidates (91.4% reduction), and 422,362 exact footprint tests (99.0% reduction). Broad-phase query time was about 566 ms and cached footprint generation about 0.44 ms.

Replay hydration, fixed-seed determinism, batch summary/replay retention, tactical intent, reserve predicates, and period tests pass in the current release manifest.

## Human-first authoring foundation added after the LOS repair

- Project schema is now 1.2.0 with canonical `sideA` / `sideB` IDs, separate `proposals`, `scenarioRules`, and `publication` records.
- Legacy French/Imperial projects and playtest workspace army orders migrate to neutral IDs while preserving historical labels.
- Source Intake validates Scenario Proposal 1.0 JSON, treats arbitrary narrative as evidence only, and keeps rigid headed source extraction as an explicit compatibility route.
- Rule opportunities are reference records; the designer must use Create Rule. Canonical rule text and automation are separate, with stale-automation validation after text edits.
- Imported proposed forces have record-level Create Command / Add Unit controls and never auto-populate the canonical roster.
- Publication narrative has dedicated fields and Publisher fallbacks.
- `docs/ai/` and the generated `Battle_Axe_AI_Authoring_Pack.zip` define the external authoring contract. The ZIP is linked from Source Intake and the Scenario Design AI bridge.
- Root `AGENTS.md` requires contract artifacts and tests to move together.

## Final verification on 2026-09-02

- Release manifest: 252/252 tests pass across 41 current test files.
- Static build: pass (`node scripts/build.mjs`).
- Static deployment check: pass (`node scripts/check.mjs`).
- Legacy Glendale 1.1.0 project loaded through the Scenario Library migration path and preserved 25 commands, 91 roster units, 42 unit placements, 13 commander placements, the compiled map, and Union/Confederate display labels while exporting neutral structural side IDs.
- Arbitrary Cerignola narrative remained evidence-only; a structured proposal created reference records without mutating canonical commands, units, or rules.
- Rule Opportunity → Create Rule, tabletop-only manual rules, stale-automation warnings, and proposed-force application were exercised in the browser. Applied proposed-force actions are now idempotent and visibly disabled.
- The AI Authoring Pack downloaded successfully and contained all six contract artifacts. Both AI bridge interfaces opened and rendered their import/review/apply controls.
- Proposal publication text populated only blank publication fields. The rebuilt Scenario Sheet showed concise copy, while the rebuilt Design Dossier showed the full historical narrative, full battlefield narrative, and designer/source material.
- The supplied Glendale scenario completed a one-turn deterministic browser playtest after the worker watchdog used its bounded main-thread fallback. No runtime error appeared in the verified fresh preview.
- Project export/import preservation is covered by the real Glendale data-path round-trip and release regression tests. The browser automation surface could not intercept the generated full-project JSON blob or drive the native file chooser, so a literal browser download-and-reopen loop remains a manual check.

## Regressions fixed during verification

- Source Intake no longer throws when routing a valid Scenario Proposal because the intake source name is initialized consistently.
- Proposal publication narrative is retained without overwriting existing designer prose.
- Proposed command/unit actions cannot be applied twice; applied records show disabled controls.
- Browser playtest workers now send a startup handshake and use bounded startup/execution watchdogs with a deterministic fallback instead of remaining on `Running…` indefinitely.
- Publisher Design Dossier now includes the full retained battlefield narrative before the map.
- The deployment check now expects neutral `sideA` and `sideB` authoring controls.

## Known limitations / next steps

1. Proposed-force cards currently implement **Create command** and **Add unit**. Commander selection and parent-command changes still use the canonical Force Builder/hierarchy workflow rather than separate proposal-card buttons.
2. The checked-in Scenario Library catalog contains no ready-to-play scenario. The bundled Pavia sample is a map/source fixture with no deployable force; the supplied Glendale file was used for the playable smoke test through a temporary, non-repository catalog entry.
3. A full eight-turn browser run was not repeated after adding the watchdog. The direct overlay benchmark remains about 65 seconds, and the one-turn browser smoke test completed within about 31 seconds including fallback delay.
4. Main-thread fallback can briefly make the page unresponsive while it preserves deterministic completion. A future repair may make worker startup fully reliable, but should preserve the watchdog.
5. Manually download and reopen a full-project JSON in a normal browser before release if that exact UI gesture is a release gate.
6. If the user accepts these limitations, commit and push the current working tree to `main` for live GitHub Pages testing. Do not commit or push without that approval.

Do not rewrite historical source evidence or hard-code Glendale-specific behavior into the common engine.
