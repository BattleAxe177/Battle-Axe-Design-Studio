# Development Workflow

1. The GitHub repository is the master source tree.
2. Work locally in the cloned repository folder.
3. Copy/merge a new Battle Axe release into that folder.
4. Review changed files in GitHub Desktop.
5. Commit with a version/message.
6. Push `main`.
7. GitHub Actions runs checks, tests, build, and Pages deployment.
8. If the action is green, refresh the website. If red, open the failed action before changing anything else.

Do not delete and recreate the repository for normal updates. Do not manually upload flattened folders through the GitHub website.
