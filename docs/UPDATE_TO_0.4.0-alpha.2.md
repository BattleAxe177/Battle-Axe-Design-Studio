# Update to v0.4.0-alpha.3

1. Extract the release ZIP somewhere outside your local GitHub repository.
2. Open the extracted folder until you can see `.github`, `src`, `public`, `tests`, `index.html`, and `package.json`.
3. Copy those contents into your local `Battle-Axe-Design-Studio` repository folder and replace existing files.
4. In GitHub Desktop confirm that changed files are listed.
5. Commit with: `Battle Axe Design Studio v0.4.0-alpha.3 map and deployment alpha`
6. Push origin.
7. Wait for the GitHub Actions deployment to turn green.
8. Hard-refresh the live site and confirm the header reports `v0.4.0-alpha.3`.

The release deliberately uses a new local-storage key. Existing alpha.1 scenario work will not be automatically loaded into alpha.2; alpha.1 data structures changed substantially to support command hierarchy and deployment.
