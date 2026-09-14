# Battle Axe Design Studio — Current Work Handoff

Updated: September 12, 2026

## Repository state

- Repository: `C:\Users\scott\Desktop\Battle Axe Design Studio\Battle-Axe-Design-Studio`
- Branch: `main`
- Current version: `v0.6.9.1`
- Current commit: `8433f31 Add development scenarios to library`
- `origin/main` matches the current commit.
- The working tree contains the human-first authoring, command-model, rule-automation, external-AI-contract, and tactical-condition implementation described below.
- These changes have not been committed or pushed.

Recent delivery commits:

- `8433f31` — Add development scenarios to library
- `084a0fb` — Stabilize scenario review and tactical playtests
- `4122e23` — Add human-first scenario authoring and reliable playtests
- `5a65a81` — Battle Axe Design Studio v0.6.9.1

## Verification baseline

The current working tree was verified after the implementation pass:

- Automated tests: **271/271 passed**.
- Production build: passed.
- Static deployment check: passed.
- `git diff --check`: passed (only expected Windows line-ending notices).
- Fresh `dist/` browser smoke on fresh localhost ports: Glendale, Cerignola, and Pavia all loaded through Scenario Library migration; Source Intake, native Rule/Command/Reserve editors, tactical-plan interpretation, a two-turn deterministic Glendale run, AI authoring-pack download, replay/log rendering, and a clean browser console all passed.

Passing tests establish the current regression baseline. They do not replace live verification of collision geometry, drag behavior, congestion, battlefield synchronization, Publisher fidelity, or broad legacy import behavior.

## Product and architecture guardrails

Battle Axe Design Studio is a historical tabletop scenario-design and deterministic playtest tool. It should reconstruct historical problems and decisions without becoming a generic computer wargame or forcing the historical result.

Rule precedence is:

**Core Battle Axe → selected Period Supplement → accepted Scenario Override**

Key constraints:

- Keep common geometry, state, and genuinely universal rules in the core engine.
- Put recurring period behavior in period plugins.
- Keep one-battle exceptions in scenario data or accepted scenario rules.
- Never hard-code named scenarios in common engine logic.
- Preserve source evidence separately from Battle Axe translation and retain uncertainty.
- Maintain exactly two opposing sides and the generic Side → Command → subordinate Command(s) → Unit hierarchy.
- Treat parent/child IDs as authoritative and names as display text.
- Use one physical rotated-footprint model everywhere.
- Tactical AI follows **Commands plan; units execute.**
- External AI may interpret or propose; Battle Axe validates and adjudicates.
- JSON remains the portable canonical working format.

Read `AGENTS.md` before architectural changes. `BATTLE_AXE_CODEX_HANDOFF.md` is referenced by repository instructions but is not present in this checkout; this file is the current handoff record.

## Delivered recent work

### Current uncommitted implementation batch

- Source Intake now presents three explicit routes: Import AI Scenario Package, Paste AI Scenario Brief, and Start Manually.
- Scenario proposals preserve historical evidence, force proposals, and rule opportunities outside canonical state until the designer explicitly applies them.
- One imported rule opportunity produces one reference card; Create Rule opens the same native rule editor used for manual rules, and cancellation leaves no canonical rule behind.
- Scenario rules now separate authoritative tabletop prose from a validated, versioned structured Playtest implementation and a generated Engine Interpretation. Prose-only or stale rules cannot claim full automation.
- The initial safe automation slice supports validated setup-time Turn 1 initiative only. Unsupported actions fail closed instead of being executed or mislabeled.
- Command authoring now uses a shared native editor for manual and proposal-assisted flows, with parent command, command type, explicit commander status, commander role, and rating.
- Commanderless commands are intentional canonical records and survive migration/export; unresolved commander evidence remains distinct.
- Italian Wars owns its army-wide versus local command-authority policy. Army Commanders provide side-wide authority while in physical range, Subcommanders remain local, and bonuses do not stack. ACW hierarchy behavior is unchanged.
- Manual terrain creation, reserve-turn selection, and deployment-zone naming now use native Studio dialogs rather than browser prompts.
- Tactical conditions distinguish reached, occupied, entered, and crossed terrain. Crossing requires a strict boundary transition, is recorded from movement history, and latches by actor/feature.
- Reserve conditions evaluate recursive ANY/ALL/NOT trees, log their predicate traces once per command/turn, release exactly once, and expose the order transition.
- External tactical responses now require the exact contract version, scenario revision, canonical side key, command ownership, and valid unit/terrain/zone identifiers.
- The downloadable AI authoring ZIP contains coordinated proposal schema/template, tactical reference, authoring guide, and rule-automation schema; the deployment check verifies those entries.

### Human-first authoring and proposal separation

- Scenario authoring distinguishes historical source evidence, proposed Battle Axe translation, accepted scenario state, and publication state.
- External proposals remain data and do not execute arbitrary JavaScript.
- Accepted scenario rules are separated from proposal/source material.
- Tactical free text is treated as an adapter to structured intent.
- The UI exposes an Engine Interpretation derived from executable tactical structure.
- Unsupported meaningful plan clauses fail closed instead of silently selecting a generic default.

### Tactical-plan stabilization

- The semantic plan adapter recognizes `Defend until Turn 4, then Assault`.
- It recognizes `Hold while no enemy unit has crossed <named terrain>, then Assault` and produces a canonical negated condition tree.
- Recursive `AND`, `OR`, and `NOT` condition validation exists.
- Reserve release state is latched in runtime command-release state, and released commands can switch to their post-release order.
- External tactical responses check scenario revision and command IDs and pass rich tactical intent through canonical validation.
- Commanderless command storage/import and deployment-reserve support exist.
- Review rendering exposes interpreted meaning, though detailed structured-condition presentation is incomplete.

### Scenario Library

Three current development scenarios are included:

- `scenarios/acw/glendale-1862.json`
- `scenarios/italian-wars/cerignola-1503.json`
- `scenarios/italian-wars/pavia-1525.json`

All are marked Development and have load/regression coverage. Glendale was migrated from schema 1.1 to 1.2. Cerignola and Pavia are current-format copies.

Preserved content warnings:

- Cerignola and Pavia still use canonical side display labels `Side A` and `Side B`.
- Cerignola’s location contains `Kingdom of Naple`.
- Glendale’s victory/instruction text refers to seven rules while canonical `scenarioRules` is empty.
- All three projects retain `Untitled Scenario` as `project.name`, although scenario metadata titles are correct.

These are content-authoring issues, not reasons to alter shared engine behavior.

## Tactical reconciliation audit

The latest audit compared the requested tactical behavior with the actual implementation. It found a stable but incomplete foundation.

### Fully implemented

- Parsing of turn-triggered defend-to-assault plans.
- Parsing of negated terrain-triggered hold-to-assault plans.
- Recursive Boolean condition validation.
- Fail-closed behavior for unsupported meaningful clauses.
- Canonical/source/proposal/publication separation.
- Scenario Library entries and automated load checks.

### Partially implemented

- Reserve release is latched in `ctx.commandRelease`, and `orderFor` can select a post-release order. The exact same-tick transition and end-to-end state machine still need explicit regression coverage.
- External AI validation checks revision and command IDs, and TacticalIntent validation checks terrain IDs. Response-version enforcement and all referenced entity classes are not yet comprehensive.
- Commanderless commands are supported in several storage, import, and deployment paths, but period-specific command authority is incomplete.
- Tactical review shows a readable interpretation but does not yet expose enough structured condition detail for full debugging.

### Not implemented or currently incorrect

1. **Historical terrain crossing is not tracked.**
   - `cross`, `reaches`, `occupies`, and `enters` currently compile to the same `terrain_occupied` predicate.
   - There is no `terrain_crossed` predicate or per-unit/per-feature crossing history.
   - A plan that says “once an enemy crosses the road” therefore behaves like present occupancy/reach, not a persistent historical event.

2. **Condition evaluation is not sufficiently inspectable.**
   - The engine emits `reserve_released`, but not a detailed condition-tree evaluation record showing predicate values, Boolean results, and order transitions.

3. **External AI response validation needs hardening.**
   - Response version is not strictly enforced.
   - Zone and unit references inside predicates are not comprehensively validated.
   - The short-response fallback label is `Paste response (fallback)` instead of the explicit `Paste AI response JSON (fallback)`.

4. **Scenario-rule automation remains largely declarative.**
   - A rule can be marked `engineStatus: 'automated'` with only `engineText`.
   - Changing rule text marks automation stale, but validation of an automated rule mainly checks that Engine Interpretation is nonblank.
   - There is no sufficiently strict structured implementation schema connecting the authoring claim to executable behavior.

5. **Italian Wars command authority is not explicit.**
   - The generic engine uses hierarchy ancestry.
   - The American Civil War supplement supplies `commandRules`.
   - The Italian Wars supplement does not yet provide a corresponding Army Commander/Subcommander authority rule or hook.

## Important code map

- `src/modules/tacticalIntent.js`
  - Canonical TacticalIntent version, compilation, recursive condition validation, external intent normalization, and legacy modifier adapter.
  - Current predicates include `turn_reached`, `unit_destroyed`, and `terrain_occupied`; no `terrain_crossed` yet.

- `src/modules/tacticalPlanner690.js`
  - Manual-plan semantic adapter, tactical intent context, and external tactical request context.

- `src/modules/playtestEngine690Patch.js`
  - Runtime patch containing injected condition evaluation, terrain release state, release-by-intent logic, reserve release, order selection, and `ctx.commandRelease` latching.

- `src/modules/playtestEngine.js`
  - Base playtest engine: plan derivation, order selection, reserve release, runtime construction, deterministic run loop, movement geometry/events, command bonus/authority, and eligible reserve deployment.

- `src/modules/externalAiExchange.js`
  - Tactical request/response exchange, validation, review HTML, application to live UI, and dialog behavior.

- `src/modules/scenarioBuilder.js`
  - Rule editor, suggestion saving, rule inspector, scenario validation, and source/proposal UI.

- `src/modules/scenarioProposal.js`
  - Proposal import/separation and accepted scenario-rule handling.

- `src/rules/supplements/americanCivilWar.js`
  - Existing period-specific `commandRules` example.

- `src/rules/supplements/italianWars.js`
  - Italian Wars supplement; currently lacks the requested explicit command-authority distinction.

## Recommended next implementation batch

Continue with a scoped reconciliation/repair batch, not a broad redesign:

1. Add a generic canonical `terrain_crossed` predicate.
2. Track historical crossing state during movement, keyed by feature and unit.
   - For line features, require a true side transition rather than touch or near-contact.
   - For polygon features, require a boundary transition rather than simple presence.
3. Resolve terrain references strictly and block unknown or ambiguous names.
4. Make the Reserve state machine exact, latched, and reset for every new run.
5. Add inspectable condition-tree evaluation and current-order transition events to debug/AAR output.
6. Strengthen External AI checks for version, scenario revision, side, command, terrain, zone, and unit references; clarify the JSON fallback label.
7. Introduce validated structured scenario-rule automation or explicitly defer that larger feature without claiming rules are automated.
8. Add an Italian Wars authority hook and commanderless-command coverage without changing American Civil War behavior.
9. Add scenario-independent regression tests, then perform live browser smoke tests for the visual and interactive paths.

Required live regression cases include:

- `attack the southern flank of the union line` must mean an attack on the target formation’s live southern/relative flank as intended, not flank security.
- `release once a union artillery unit is destroyed, or by turn 3, whichever happens first` must compile as an `OR` release condition, not a fire preference.
- A terrain-crossing trigger must stay false for approach, touch, or nearby movement and become persistently true only after a valid crossing.
- A released reserve must immediately and permanently use its post-release order for that run.
- Invalid external IDs or stale revisions must be rejected without mutating the scenario.
- A new playtest run must not inherit release or crossing state from the previous run.

## Known later tactical work

After the reconciliation batch is stable:

- Formation traffic and congestion.
- Commander obstruction and movement interaction.
- Prevention of repeated invalid-action loops.
- More reactive Defend behavior.
- Richer deployment and reinforcement proposals.
- Consolidation of the v0.6.9.1 runtime source-transformation/string-patch overlay into canonical modules, performed incrementally with regression parity.

## Release and workflow notes

- `VERSION` remains the release source of truth.
- Verify built/deployed artifacts, not only source tests.
- Confirm Scenario Library/static assets are copied into deployment output.
- Keep worker/cache versions aligned.
- Release notes should distinguish implemented, regression-protected, live-verified, unresolved, and not-applicable work.
- Do not commit or push future changes without explicit user approval.
