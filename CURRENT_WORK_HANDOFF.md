# Battle Axe Design Studio — current work handoff

Use this file to continue from the current local working tree. Read `AGENTS.md` and the outer `BATTLE_AXE_CODEX_HANDOFF.md` before architectural changes.

## Repository state

- Repository: `C:\Users\scott\Desktop\Battle Axe Design Studio\Battle-Axe-Design-Studio`
- Branch: `main`
- Clean pushed baseline: `4122e23` (`Add human-first scenario authoring and reliable playtests`)
- Working tree: intentionally dirty with the focused post-release stabilization batch described below.
- Do not commit or push without the user's explicit approval.
- Local verification build: serve `dist/` on a fresh localhost port after rebuilding.

## Stabilization batch implemented on 2026-09-04

### Force proposals and review

- Structured AI force proposals render once, grouped as `AI proposed forces — <display name>`; empty duplicate source-tree panels are suppressed.
- Proposal cards no longer assume every force concept is a command. The designer can use a proposal as a command, add one selected canonical profile to an explicitly selected command, or assign a supported proposed commander to an explicitly selected command.
- Command application reconciles an existing command by proposal/name/commander before creating one, preventing duplicate canonical commands. Applied records remain idempotent and disabled.
- Proposal metadata, side labels, and publication prose remain proposal/review state. They prefill the review form but do not become canonical until `Save reviewed parameters`.
- Unresolved/TBD numeric values do not populate game length or table size.
- The review label is now `Scenario overview`; a concise proposed historical summary is used when canonical overview text is blank.

### Side identity and colors

- `sideA` and `sideB` remain the only structural IDs.
- Side display names are editable in Extraction Review and propagate through Force Builder, Turn 1 initiative, Deployment/Playtest, Publisher, and human-readable playtest results/reports.
- `scenarioSides.js` owns the shared display-name setter and side/command color resolver.
- Deployment, replay, and Publisher consume that shared resolver. Inline deployment/replay colors are applied strongly enough to supersede legacy presentation CSS.

### Tactical intent

- `Defend until Turn 4, then Assault` preserves Defend as the initial order, compiles Turn 4 as the release predicate, and compiles Assault as the post-release order.
- `Hold while no enemy unit has crossed <named terrain>, then Assault` preserves Hold, represents the negative guard with canonical `NOT`, and releases when the opposing side reaches the resolved terrain ID.
- `AND`, `OR`, and `NOT` condition trees validate recursively. Unsupported meaningful clauses remain blocked rather than silently approximated.
- The Playtest UI displays the canonical Engine Interpretation and a clear not-fully-understood message for blocked text.

### Replay and reports

- The replay UI now passes the complete snapshot list and current index into delta-v1 hydration. Arbitrary forward/backward scrubbing retains unchanged units and commanders.
- Human-readable results and reports resolve display side names; diagnostic JSON may retain structural IDs.

## Verification

- Release manifest: 260/260 tests pass across 42 current test files.
- Production build: pass (`node scripts/build.mjs`).
- Static deployment check: pass (`node scripts/check.mjs`).
- Live Cerignola project import verified in a fresh built preview:
  - no empty duplicate proposal trees;
  - proposal groups and canonical roster headings changed to the reviewed Spanish/French display names;
  - a Zamudio proposal reconciled to the existing `German Centre` command (3 commands before and after), then became Applied;
  - contextual command/unit/commander proposal controls rendered;
  - a two-turn deterministic run completed and showed the long Spanish/French names in winner and VP cards;
  - delta replay scrubbed to frame 51/131 with all 15 units and 6 commanders still present.
- Pure regression coverage also verifies proposal/canonical separation, unresolved numeric defaults, custom side names/colors, transition conditions, named-terrain negative guards, fail-closed conditions, shared rendering colors, and the replay UI hydration call.

## Performance context retained from the prior repair

The supplied Glendale project contains 91 roster units, 42 placements, 8 turns, and an approved 4,131-point obscuring polygon. The LOS broad phase, actor caching, replay delta encoding, and worker watchdog from commit `4122e23` remain intact. Prior verified overlay timing was about 5.8 seconds for one turn and 65.4 seconds for eight turns; replay storage/hydration is no longer the material bottleneck.

## KNOWN FUTURE TACTICAL ENGINE / UX WORK

The following items were intentionally documented, not fixed, in this focused batch:

1. Formation traffic and stronger command-level maneuver/deconfliction.
2. Whether and how commander bases should obstruct unit movement without creating artificial congestion.
3. Better prevention and diagnosis of repeated invalid-action loops.
4. More reactive Defend behavior and counterattack/replanning triggers.
5. Richer deployment and reinforcement proposal actions beyond the current explicit command/unit/commander controls.

## Recommended next action

Review the dirty diff, manually smoke-test any desired long Glendale run, then commit and push this stabilization batch only after explicit user approval. Do not hard-code Cerignola, Glendale, Pavia, or another named scenario into common logic.
