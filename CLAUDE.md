# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`start-ts-by` is a CLI tool (published as an npm package) that creates TypeScript/JavaScript projects from git repository templates or local folders. It uses `commander` for CLI parsing and `inquirer` for interactive prompts. No degit dependency — all template fetching is handled by native git commands or direct file copy.

## Prerequisites

- **Package manager**: pnpm 10.0.0 (enforced via `preinstall` script — npm/yarn will be rejected)
- **Node**: version specified in `.nvmrc`

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Build in watch mode + typecheck in parallel |
| `pnpm build` | One-shot build (clean + tsdown) |
| `pnpm typecheck` | TypeScript type check (`tsc --noEmit`) |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm test` | Run vitest unit tests (vitest is the primary test runner) |
| `pnpm vitest` | Run vitest in watch mode |
| `pnpm vitest:run` | Run vitest once (ci-friendly) |
| `pnpm vitest:e2e` | Run e2e tests (separate vitest config) |
| `pnpm vitest:e2e:run` | Run e2e tests once |
| `pnpm txs` | Run the CLI directly from source: `npx tsx src/index.ts` |
| `pnpm commit` | Interactive git commit via commitizen (conventional commits) |
| `pnpm changeset:add` | Add a changeset for versioning |

### Running a Single Test

`pnpm vitest src/utils/parseTemplateSource.test.ts` — pass the file path to filter to a single test file.

### CLI Development Workflow

1. Edit source in `src/`
2. Run `pnpm txs` to test CLI from source, or `pnpm dev` for auto-rebuild
3. The built binary lands at `dist/bin/index.js` (the `bin` entry in package.json)

## Architecture

### Entry Point

`src/index.ts` — Creates a `commander` Command, registers global `--list`/`--list-json`/`--list-verbose` flags via a `preAction` hook, and adds the `create` subcommand.

### Source Structure

```
src/
├── index.ts                  # CLI entry (commander setup, main())
├── configs.ts                # Project config loaded from package.json + templates.json
├── types.ts                  # Shared TypeScript types
├── commands/
│   ├── createAction/         # "create" subcommand implementation
│   │   ├── createAction.ts   # Main action handler (interactive + non-interactive modes)
│   │   ├── getArgsRmList.ts  # Build remove-list from --rm flag
│   │   ├── getExecList.ts    # Build exec-list from --git-init/--npm-install flags
│   │   ├── getRmFlagRmList.ts # Build remove-list for --monorepo flag
│   │   ├── runActionPrompt*.ts # Inquirer prompt handlers (name, template, remove flags)
│   │   └── vars*.ts          # Variable parsing (--vars, --vars-file)
│   └── listAction/           # "list" action — lists built-in + registry templates
├── libs/
│   └── createProject.ts      # Core orchestration: parse template → fetch → remove files → init package.json → run exec commands
└── utils/
    ├── parseTemplateSource.ts # Parse "user/repo#branch/subdir" into {repoUrl, ref, subdir, isGithub, isLocal}
    ├── templateToLocal.ts     # Clone git repo or copy local folder to target directory
    ├── getTargetDir.ts        # Resolve target directory for the new project
    ├── checkExistPathAndRemove.ts # Conditionally remove files/folders from the created project
    ├── initProjPackageJson.ts # Post-process package.json (rename, remove packageManager field in monorepo mode)
    ├── initProjReadMeMd.ts    # Overwrite README.md with project-specific content
    ├── execSyncByList.ts      # Run post-creation commands (git init, npm install)
    ├── varsParser.ts          # Parse "key=value" CLI strings into nested objects
    ├── varsMerge.ts           # Merge variables from multiple sources with priority ordering
    ├── varsFile.ts            # Parse .vars files (key=value format, supports includes)
    ├── pattern.ts             # Regex patterns for GitHub repo URLs
    └── registry/              # Registry system (load remote template catalogs, cache, resolve)
```

### Data Flow for `create` Command

1. `createAction()` parses CLI args and merges variables from `--vars`, `--vars-file`, and flag-derived values (priority: CLI vars > vars-file > flags > env > defaults)
2. In interactive mode, prompts the user for name, template source, and optional flags (monorepo, husky, git-init, npm-install)
3. `createProject()` orchestrates:
   - `parseTemplateSource()` — parses template string into `{repoUrl, ref, subdir, isGithub, isLocal}`
   - `templateToLocal()` — clones/copies the template to the target directory
   - `checkExistPathAndRemove()` — removes files per the `removeList` (from `--rm`, `--monorepo`, prompts)
   - `initProjPackageJson()` — renames package, strips `packageManager` field in monorepo mode
   - `initProjReadMeMd()` — writes project-specific README
   - `execSyncByList()` — runs `git init` and/or `npm install` if requested

### Template Source Parsing

The `parseTemplateSource()` utility handles these formats:
- `user/repo` → GitHub HTTPS URL
- `user/repo#branch` / `user/repo#branch/subdir`
- `git@host:org/repo.git#ref/subdir` → SSH URL
- `https://host/org/repo.git#ref/subdir`
- `./local-path` / `file:./local-path` → local directory copy

### Registry System

Templates can come from three sources: built-in (`templates.json`), registry (`registry-config.json` → remote `registry.json` files), or manual input. The registry system (`src/utils/registry/`) handles loading, caching, and resolving templates from remote sources.

### Build System

- **tsdown** (Rollup-based) bundles `src/index.ts` → `dist/bin/index.js`
- Custom plugins copy `package.json` and files listed in `copyFiles.json` to `dist/`
- `tsconfig.build.json` is used for the build; `tsconfig.json` for development
- Dependencies are externalized (not bundled)

## Testing

- **Vitest** is the primary test runner (unit + e2e)
- Test files are `*.test.ts` alongside source files
- E2E tests use a separate config: `vitest.config.e2e.mts`
- Tests use `@` path alias → `./src`
- Coverage is enabled by default (istanbul provider, reports in `.test/vitest/coverage`)
- Jest configs and scripts exist but are legacy — prefer vitest

## Git Workflow

- Use `pnpm commit` (commitizen) for conventional commit messages
- Husky hooks run lint-staged (vitest related + prettier + eslint --fix) on staged `.ts` files
- Changesets are used for version management (`pnpm changeset:add`, `changeset:version`)
- Publishing: `pnpm publish:dist` (runs `publish.sh` — builds, copies docs, publishes to npm)
