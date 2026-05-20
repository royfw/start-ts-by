---
'start-ts-by': minor
---

### Features

- **GitLab CI/CD and deploy config control**: Added `--gitlab` and `--deploy` flags with interactive prompts. When `--gitlab` is not set, all files and directories containing "gitlab" (case-insensitive) are removed recursively. When `--deploy` is not set, `deploy/` and `.deploy/` directories are removed.
