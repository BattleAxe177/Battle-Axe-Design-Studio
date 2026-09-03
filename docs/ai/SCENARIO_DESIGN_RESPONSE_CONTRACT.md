# Scenario Design response contract

Return exactly one JSON object matching `SCENARIO_PROPOSAL_SCHEMA.json`. It may optionally be wrapped between `---BEGIN BATTLE AXE SCENARIO PROPOSAL---` and `---END BATTLE AXE SCENARIO PROPOSAL---`. Do not use Markdown fences around JSON. Use `sideA`/`sideB`; include evidence and confidence where possible; preserve extra domain data inside `extensions`. Rule ideas belong in `proposals.ruleOpportunities` and force ideas in `proposals.forces`. Import is proposal-only and does not authorize canonical edits.
