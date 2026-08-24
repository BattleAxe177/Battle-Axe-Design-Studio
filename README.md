# Battle Axe Design Studio v0.6.2.0 — Common Engine Hardening + ACW Integration

This release keeps the **American Civil War** module on the shared Battle Axe rules/supplement architecture while hardening common movement geometry, deployment dragging, command-level tactical behavior, diagnostics, replay analysis, and legacy project import.

The release is intentionally not an ACW fork. The ACW plugin remains isolated behind the `Period Supplement` selector; common fixes are implemented in shared engine/editor modules so Italian Wars and future supplements can reuse them.

Important verification note: automated regression coverage is included for the new geometry, drag-lock, command traffic, reserve latch, screening, legacy migration and ACW plugin behavior. Items that still require convincing live-browser/tabletop verification are called out explicitly in the release notes rather than being declared finished merely because automated tests pass.

See `docs/RELEASE_0.6.2.0.md` for the implementation and verification status.
