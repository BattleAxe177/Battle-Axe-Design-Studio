# Battle Axe repository contract

Read `BATTLE_AXE_CODEX_HANDOFF.md` before architectural changes. Keep this file, the handoff, the authoring guide, proposal schema, templates, bridge contracts, migrations, and their tests synchronized whenever a canonical field or workflow changes.

- The human designer owns the canonical scenario. AI output is optional proposal/reference material until a designer explicitly applies it.
- Keep canonical scenario state, proposal/reference state, and publication narrative separate.
- Canonical sides are exactly `sideA` and `sideB`; historical names are display metadata and aliases. Accept and migrate legacy `French`/`Imperial` files, but do not export those keys as structural side IDs.
- Source intake routes explicit structured material. It must not silently mine arbitrary narrative into commands, rules, or canonical force structure.
- Battle Axe adjudicates. Never execute AI-provided code; validate data, IDs, schema versions, revisions, capabilities, and predicates.
- Preserve source evidence, uncertainty, and unknown extension fields. Do not silently rewrite printed rules or disputed history.
- Prefer one downloadable authoring ZIP and validate that its documents match the live import contract.

The full product, rules, geometry, tactical-AI, testing, and release instructions remain in `BATTLE_AXE_CODEX_HANDOFF.md` and the repository documentation.
