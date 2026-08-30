BATTLE AXE DESIGN STUDIO v0.6.9.1 — COPY / OVERWRITE PACKAGE

Starting point: v0.6.8.1 or the failed v0.6.9.0 overlay

INSTALL
1. Extract this ZIP directly into the root of your Battle-Axe-Design-Studio repository.
2. Choose Copy/Replace/Overwrite when prompted.
3. Commit the changed/new files and push normally.
4. GitHub Actions should run Verify, Build and Deploy.
5. After GitHub Pages deploys, hard-refresh the site once.

This package includes the complete v0.6.9.x feature overlay, so it can be applied directly over v0.6.8.1 or over the failed v0.6.9.0 commit.

v0.6.9.1 deployment hotfix:
- fixes the GitHub Actions Verify failure caused by VERSION advancing while index.html still carried the previous hard-coded runtime/main-module version;
- makes VERSION the authoritative release marker for the deployed site by injecting it during build;
- copies scenarios/ into dist so the new Scenario Library actually exists on GitHub Pages;
- adds deployment checks for runtime version, main-module cache key and Scenario Library catalog;
- guards the v0.6.9.x browser bootstrap from non-browser Node test imports.

The v0.6.9.x functional additions remain:
- Scenario Library infrastructure.
- Visible fail-closed Tactical Plan interpretation.
- Executable formation-relative left/right flank targeting.
- Executable named-terrain reserve release conditions.
- Post-release tactical-order transitions.
- Command-level Auto Tactical Planner preview/defaults.
- One-file External AI ZIP exchange for scenario design and playtest planning.
- Charge-through-unit regression coverage.

See RELEASE_0.6.9.1.md for details.
