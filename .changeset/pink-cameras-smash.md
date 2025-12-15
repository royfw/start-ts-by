---
"start-ts-by": patch
---

Add pnpm-workspace.yaml to --monorepo removal list

- Include pnpm-workspace.yaml in the list of files removed by --monorepo flag
- Prevent nested workspace conflicts when creating subprojects in monorepo
- Update CLI descriptions and interactive prompts to reflect workspace config removal
- Add comprehensive test coverage for the new removal file
- Support templates from https://github.com/royfuwei/start-ts-templates

BREAKING CHANGE: None (backward compatible, only adds removal item)
