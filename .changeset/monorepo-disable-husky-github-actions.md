---
"start-ts-by": minor
---

**Monorepo mode now disables husky and GitHub Actions by default**

### New Features

The `--monorepo` flag (or interactive prompt) now automatically removes additional files that conflict with monorepo root configuration:

- `.husky` directory and `prepare` script containing "husky" in package.json
- `.github` directory (GitHub Actions workflows)

### Changes

- Add `.husky` and `.github` to actionMonorepoFileNames config
- Implement unified husky removal logic in initProjPackageJson
- Remove prepare script when .husky is removed via any method (--monorepo, --no-husky, or --rm)
- Update CLI descriptions and documentation (README.md, docs/README.md, docs/README.zh-TW.md)
- Add comprehensive test coverage for prepare script removal

### Rationale

- Husky is a repo-level policy and should not be enforced by monorepo scaffolds
- The `prepare` script can cause installation failures in monorepo/CI/Docker/non-git-init environments
- Disabling by default improves DX; users can opt-in if needed

### Usage

```bash
# Monorepo mode now removes .husky, .github, and prepare script
npx start-ts-by my-app -t user/repo --monorepo --ni

# Keep GitHub Actions if needed
npx start-ts-by my-app -t user/repo --monorepo --github --ni
```

### Testing

- All tests passing (154 passed / 154 total)
- New test file: src/utils/initProjPackageJson.test.ts
- Updated tests: createAction.monorepo.test.ts, getRmFlagRmList.test.ts