---
'start-ts-by': patch
---

### Bug Fixes

- **Local git template copy**: Only copy git-tracked files when copying from a local git repository template. Previously, using a local git repo as a template would copy all files including `node_modules/`, `dist/`, `.env` and other `.gitignore`'d files. Now it uses `git ls-files` to match `git clone` behavior.

- **parseTemplateSource**: Fixed incorrect path splitting for absolute paths like `/home/user/project` which were wrongly parsed as `repoUrl="/home"` + `subdir="user/project"`.
