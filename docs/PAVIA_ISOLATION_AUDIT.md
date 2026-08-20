# Pavia Isolation Audit — v0.5.2.1

Pavia remains the development/regression sample scenario, but generic Studio modules must not assume Pavia-specific forces, terrain, commanders, coordinates or scenario rules.

## Allowed Pavia-specific locations
- `src/data/paviaProject.js`
- `projects/pavia/**`
- `projects/samples/pavia/**`
- tests/fixtures explicitly named for Pavia
- historical source examples used by the scenario extraction test harness

## Generic application rule
Generic modules may consume loaded project data but must not branch on Pavia, Mirabello, Pescara, Francis I, French/Imperial identities, or hard-coded Pavia coordinates in order to function.

The **Load Pavia Test Scenario** control loads the sample as a project fixture. **New Scenario** starts clean.
