# Playtest Center Browser Adapter — v0.4.0-alpha.3

## Governing baseline

The browser adapter is derived from **Battle Axe Engine v0.4.0 — Development Consolidation 1**, which incorporates engine work through alpha.11. The consolidated Python package remains the reference adjudication implementation.

## Implemented in the browser adapter

- deterministic seeded D6/D3 random stream
- canonical Italian Wars M/C/A/points/traits from the Studio unit library
- deployed scenario units and commanders
- scenario-defined table width/height
- movement and difficult-terrain movement reduction
- dangerous-terrain destruction test
- command tests and nearby commander bonus
- ranged fire (Shoot, Arquebus/Arquebuses, Pistols)
- artillery bombardment
- melee attack and break tests
- Fury, Pikes, Shock Cavalry attack-dice effects in the current simplified engagement model
- simple coalition victory and points-by-destroyed-unit result
- surprise/readiness adapter when an accepted scenario rule contains surprise/unalerted/readiness language
- garrison sortie adapter with a configurable activation turn
- event snapshots and five heat-map event families
- deterministic batch runs

## Not yet parity-complete

- rotated unit footprints and exact collision behavior
- facing/contact arcs and side/rear modifiers
- counter-charge
- exact wheel rules
- detailed line-of-sight sampling through Obscuring/Tall terrain
- commander escape/capture behavior
- arbitrary external scenario-rule Python modules
- objective package scoring and scenario-specific victory adjudication
- exact replay/event schema parity with Python alpha.11

These omissions are explicit. The Playtest Center is intended for early scenario-design feedback while parity work proceeds.
