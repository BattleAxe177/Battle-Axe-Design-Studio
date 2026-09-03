# Battle Axe Scenario Authoring Guide

Battle Axe Design Studio is human-first. The designer owns the canonical scenario; external AI may interpret evidence and propose material, but Battle Axe validates and adjudicates it.

## The three layers

1. **Canonical scenario state** contains the two sides, command hierarchy, units, deployment, victory conditions, and scenario rules actually used by the Studio.
2. **Proposal/reference state** contains force proposals, rule opportunities, terrain/deployment/victory proposals, unresolved questions, and source references. Importing this layer does not silently change the canonical scenario.
3. **Publication narrative** contains historical and battlefield narrative, source discussion, design rationale, and designer notes. Rich history belongs here rather than in executable fields.

Canonical side IDs are always `sideA` and `sideB`. Put names such as Union, Confederate, French, Imperial, Yorkist, Lancastrian, or army titles in `sideLabels`. The Studio migrates old `French` and `Imperial` structural keys for compatibility, but new material must not use them as IDs.

## Authoring workflow

1. Preserve source claims, citations, uncertainty, and disagreements. Do not turn uncertain history into an asserted fact.
2. Produce a `battle-axe-scenario-proposal` version `1.0` document using the supplied schema and template.
3. Put potential units and commands in `proposals.forces`, not in canonical commands.
4. Put possible special rules in `proposals.ruleOpportunities`. A human uses **Create Rule** to make one canonical.
5. Separate readable rule text from `engineStatus`, `engineText`, and `overrides`. If readable text changes later, the Studio marks non-tabletop automation stale until reviewed.
6. Paste or import the proposal through Source Intake. Unknown extension fields are preserved, and validation fails closed on invalid structural side IDs.

The Studio will not infer commands, forces, or rules from arbitrary narrative prose. A rigidly structured source document may be extracted as evidence, but canonical changes require explicit designer actions.

## Rule precedence

Core Battle Axe → selected Period Supplement → accepted Scenario Override. Do not rewrite printed RAW silently. Say whether an item is source evidence, a supplement rule, a scenario override, or a Studio implementation convention.

## Historical and tactical constraints

- Exactly two opposing sides; generic hierarchy is Side → Command → subordinate Command(s) → Unit.
- Parent/child IDs are authoritative; names are display text.
- Commands plan and units execute. Do not give units independent strategic objectives.
- Do not expose hidden scenario truth to an AI-controlled side.
- Preserve physical base footprint, facing, table-edge, collision, charge-contact, and deployment legality.

See the included schema, proposal template, starting prompt, and bridge contracts for exact machine-readable fields.
