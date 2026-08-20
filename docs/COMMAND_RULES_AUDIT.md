# Browser Engine Commander Rules Audit — alpha.5

The browser adapter now enforces the core command relationships explicitly:

- A commander's normal bonus applies to units assigned to that command within the scaled 3-inch command range.
- The side's first/flagged general can provide the wider scaled 4-inch general range.
- Command-test events record die, bonus, commander source, distance, range and outcome.
- After a side's units complete activation, each commander receives a commander movement phase of up to the scaled 4-inch allowance.
- Commanders hold position when all eligible units are already covered; this is logged as `commander_hold` rather than silently doing nothing.
- If coverage is inadequate, commanders move toward uncovered commanded troops while remaining at least the scaled 1 inch from enemies. The event log records coverage before and after movement.

This is an audit-oriented browser implementation. Commander combat/capture and every edge case remain subject to later parity testing against the consolidated engine.
