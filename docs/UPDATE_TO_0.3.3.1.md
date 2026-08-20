# Update to v0.3.3.1

This patch fixes the GitHub Actions deployment failure in v0.3.3.

The failure occurred because `npm run verify` called `npm run check` before `npm run build`. The check intentionally validates files under `dist/`, so a clean GitHub runner could not find `dist/index.html`.

The corrected order is:

1. `npm test`
2. `npm run build`
3. `npm run check`

Copy this patch over the repository, commit, and push. The existing GitHub Pages workflow will redeploy automatically.
