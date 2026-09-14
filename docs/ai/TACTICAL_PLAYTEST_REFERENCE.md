# Tactical and playtest reference

External AI interprets or proposes; Battle Axe adjudicates. Commands plan and units execute. Plans must be structured, inspectable, and limited to information the side could know. Formation-relative flanks depend on live target facing and are different from geographic ends. Unsupported meaningful clauses must fail closed. A deterministic run uses canonical commands, units, deployment, terrain, rules, and side IDs; proposal/reference and publication fields do not execute.

Tactical responses use `battle-axe-ai-response` version `1.0`, must echo the exact request `scenario_revision`, and must use canonical `sideA` / `sideB`, command IDs, unit IDs, terrain IDs, and zone IDs from that package. Names are display text and are never an ID fallback. `terrain_reached` and `terrain_occupied` inspect current position; `terrain_entered` and `terrain_crossed` are persistent movement-history predicates. Boolean conditions use `ANY`, `ALL`, and unary `NOT`.
