# Changelog

## 0.2.4

### Patch Changes

- af371a0: Add pnpm-workspace.yaml to --monorepo removal list

  - Include pnpm-workspace.yaml in the list of files removed by --monorepo flag
  - Prevent nested workspace conflicts when creating subprojects in monorepo
  - Update CLI descriptions and interactive prompts to reflect workspace config removal
  - Add comprehensive test coverage for the new removal file
  - Support templates from https://github.com/royfuwei/start-ts-templates

  BREAKING CHANGE: None (backward compatible, only adds removal item)

## 0.2.3

### Patch Changes

- d659e25: Fix outExtensions configuration to properly append .js extension

  Fixed an issue where the outExtensions configuration was missing the `.js` extension,
  causing output files to be generated without proper extensions (e.g., `indexjs` instead of `index.js`).

## 0.2.2

### Patch Changes

- 615a6ff: Migrate build tooling from esbuild/rollup to tsdown

  - Remove esbuild configuration files (esbuild.build.mjs, esbuild.dev.mjs)
  - Remove rollup configuration file (rollup.config.js)
  - Remove legacy test framework configs (jest.config.ts, jest.config.e2e.ts)
  - Add tsdown configuration file (tsdown.config.ts)
  - Convert build plugins from .mjs to .ts (copyFilesPlugin, copyPackageJsonPlugin)
  - Update package.json build scripts to use tsdown
  - Update tsconfig.build.json to adapt to new build tool
  - Remove unnecessary tsconfig files (tsconfig.esbuild.json, tsconfig.rollup.json)
  - Update dependencies (remove esbuild, rollup packages, add tsdown)
  - Update copyFiles.json to include README.md and LICENSE

## 0.2.1

### Patch Changes

- debd43b: Add three TypeScript library templates with different bundler options:

  - starter-ts-lib-rolldown: TypeScript library template using Rolldown bundler
  - starter-ts-lib-rollup: TypeScript library template using Rollup bundler
  - starter-ts-lib-esbuild: TypeScript library template using esbuild bundler

  Provide developers with more build tool choices to meet different project requirements

## 0.2.0

### Minor Changes

- 6cb3ad2: BREAKING CHANGE: Migrate version management from standard-version to Changesets

  - Remove standard-version configuration file (.versionrc)
  - Remove standard-version related scripts from package.json
  - Add @changesets/cli as the new version management tool
  - Add .changeset/config.json configuration file
  - Update GitHub Actions workflows to support Changesets
  - Update release process to use `changeset version` and `changeset publish`

  This change affects the project's version release workflow. Developers need to use the new Changesets workflow to manage version changes.

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.2](https://github.com/royfuwei/start-ts-by/compare/v0.1.1...v0.1.2) (2025-12-02)

### Features

- **templates:** add royfuwei/starter-ts-fastify repo: TypeScript App - Fastify Framework ([af22825](https://github.com/royfuwei/start-ts-by/commit/af22825b9679741e87eee1d59911c0c63d1916b5))

### [0.1.1](https://github.com/royfuwei/start-ts-by/compare/v0.1.0...v0.1.1) (2025-12-02)

### Features

- implement --monorepo flag for monorepo subprojects ([1d07e8b](https://github.com/royfuwei/start-ts-by/commit/1d07e8bb79e03d105b579566dd63b245befb1e1b))
- **openspec:** add monorepo flag proposal and specs ([9ec0ff5](https://github.com/royfuwei/start-ts-by/commit/9ec0ff53fa3ee2c145aa12f54200ed0ab2f3c5ab))

## [0.1.0](https://github.com/royfuwei/start-ts-by/compare/v0.0.19...v0.1.0) (2025-12-01)

### ⚠ BREAKING CHANGES

- **config:** Remove npm scripts: release:patch, release:minor, release:major

### chore

- **config:** improve development workflow and TypeScript configuration ([f17f8a3](https://github.com/royfuwei/start-ts-by/commit/f17f8a327380f8730721b80f8bcf04fe8def25b0))

### [0.0.19](https://github.com/royfuwei/start-ts-by/compare/v0.0.18...v0.0.19) (2025-09-13)

### Features

- add non-interactive mode with --no-interaction flag ([d5cf291](https://github.com/royfuwei/start-ts-by/commit/d5cf291850c3a614aab9f1177f14595de65c6439))
- add type definitions for variable system ([cfc91c2](https://github.com/royfuwei/start-ts-by/commit/cfc91c2a21555155b45741d6f78de14d76c0a28c))
- add variable parsing utilities ([4f4a89e](https://github.com/royfuwei/start-ts-by/commit/4f4a89e2c862b6eb86a79883c4ddb48f5fa258b6))

### Bug Fixes

- resolve [@file](https://github.com/file) relative path resolution in varsFile ([82132b2](https://github.com/royfuwei/start-ts-by/commit/82132b20f854b0bcdef7bc098606b6e7b11d5d38))

### [0.0.18](https://github.com/royfuwei/start-ts-by/compare/v0.0.17...v0.0.18) (2025-06-19)

### Features

- add consts.ts ([2ac1fce](https://github.com/royfuwei/start-ts-by/commit/2ac1fce6e290ae82697f001b09a200b8e09da670))
- **templates:** add royfuwei/starter-ts-koa repo: TypeScript App - Koa Framework ([2a96e7e](https://github.com/royfuwei/start-ts-by/commit/2a96e7ebeffe52a62626a17ca49b949f9b8e7aa3))

### Bug Fixes

- **templatetolocal:** add rmSync .git dir ([930ebcc](https://github.com/royfuwei/start-ts-by/commit/930ebcce196a12a2aeafac54b1cbdcd2bcbf936c))

### [0.0.17](https://github.com/royfuwei/start-ts-by/compare/v0.0.16...v0.0.17) (2025-06-14)

### [0.0.16](https://github.com/royfuwei/start-ts-by/compare/v0.0.15...v0.0.16) (2025-06-14)

### [0.0.15](https://github.com/royfuwei/start-ts-by/compare/v0.0.14...v0.0.15) (2025-06-13)

### Features

- remove degit to get tempate use git cmd by parse template source ([08eb12f](https://github.com/royfuwei/start-ts-by/commit/08eb12f2a12d539ad09e4f14ed8e8c2a2c4d36e7))

### [0.0.14](https://github.com/royfuwei/start-ts-by/compare/v0.0.13...v0.0.14) (2025-04-17)

### [0.0.13](https://github.com/royfuwei/start-ts-by/compare/v0.0.12...v0.0.13) (2025-04-17)

### [0.0.12](https://github.com/royfuwei/start-ts-by/compare/v0.0.11...v0.0.12) (2025-04-17)

### [0.0.11](https://github.com/royfuwei/start-ts-by/compare/v0.0.10...v0.0.11) (2025-04-17)

### Features

- **command:** add --skip-prompt flag ([a9f0732](https://github.com/royfuwei/start-ts-by/commit/a9f073280ad496ccd1325fa6497a98d35e027288))
- **command:** runActionPromptArgTemplateFlag skip exist template ([89d3ee2](https://github.com/royfuwei/start-ts-by/commit/89d3ee2789f4ef46d8c2e13c3bb3963e91a49937))

### Bug Fixes

- **command:** runActionPromptArgRmFlag skip by empty --rm flag ([f96c469](https://github.com/royfuwei/start-ts-by/commit/f96c469a506627124a2a1a7bad8a9ff4fc2d850f))

### [0.0.10](https://github.com/royfuwei/start-ts-by/compare/v0.0.9...v0.0.10) (2025-04-17)

### [0.0.9](https://github.com/royfuwei/start-ts-by/compare/v0.0.8...v0.0.9) (2025-04-17)

### Features

- **command:** add getExFlagRmRemoveList and runActionPromptArgRm ([755c2bf](https://github.com/royfuwei/start-ts-by/commit/755c2bff9393c5080319b04095cf7c1096939d8b))
- **command:** adjust template prompt list information ([7c3b717](https://github.com/royfuwei/start-ts-by/commit/7c3b71701ec299749ad825529b407086a1e93332))
- **utils:** add degitTemplateToLocal util ([9914589](https://github.com/royfuwei/start-ts-by/commit/99145895e642d519b8181f81172b50ba1d9560ae))
- **utils:** add execSyncByList util for createProject to use ([44942a8](https://github.com/royfuwei/start-ts-by/commit/44942a83955218e7f953e2ced925d725e79dbd26))
- **utils:** add initProjReadMeMd ([6689699](https://github.com/royfuwei/start-ts-by/commit/668969973eeaa0767257327af41acb65e41b417a))
- **utils:** add promptArgBoolean, promptArgsWhileInputs ([85a154a](https://github.com/royfuwei/start-ts-by/commit/85a154a2658f7a048656d1ffb22712815a7f9a23))

### [0.0.8](https://github.com/royfuwei/start-ts-by/compare/v0.0.7...v0.0.8) (2025-04-16)

### Features

- **command:** createAction add promptActionArgsBoolean ([08335a1](https://github.com/royfuwei/start-ts-by/commit/08335a1996258e351fa86d9aa851a5c8dd81f79f))
- **command:** createAction add promptActionArgsWhileInputs ([d489bb9](https://github.com/royfuwei/start-ts-by/commit/d489bb9f8c55f32be4122981e96d8693e60a8fd8))

### [0.0.7](https://github.com/royfuwei/start-ts-by/compare/v0.0.6...v0.0.7) (2025-04-16)

### Features

- **commands:** createAction add removeList and execList flags ([b9facfd](https://github.com/royfuwei/start-ts-by/commit/b9facfd5fea6414e6e8e5e6a38973446ca9160b5))
- **utils:** adjust utils console.log file path to filename ([cf52812](https://github.com/royfuwei/start-ts-by/commit/cf528120d0d0a818073d609c22872fc407dac6c7))

### [0.0.6](https://github.com/royfuwei/start-ts-by/compare/v0.0.5...v0.0.6) (2025-04-16)

### [0.0.5](https://github.com/royfuwei/start-ts-by/compare/v0.0.4...v0.0.5) (2025-04-16)

### [0.0.4](https://github.com/royfuwei/start-ts-by/compare/v0.0.3...v0.0.4) (2025-04-16)

### [0.0.3](https://github.com/royfuwei/start-ts-by/compare/v0.0.2...v0.0.3) (2025-04-16)

### [0.0.2](https://github.com/royfuwei/start-ts-by/compare/v0.0.1...v0.0.2) (2025-04-15)

### Features

- add lib setProgramCommand ([c7df942](https://github.com/royfuwei/start-ts-by/commit/c7df9422df1159e5dd67ffa5cd60d278f394f3e2))
- add project configs.ts ([b6acfb6](https://github.com/royfuwei/start-ts-by/commit/b6acfb6f67b13f36f9bb8d5a1597456ef6509e2f))
- add types.ts ([4f7e60e](https://github.com/royfuwei/start-ts-by/commit/4f7e60e1f60498213fd814476b32e48f6210f9ee))

### [0.0.1](https://github.com/royfuwei/start-ts-by/compare/v0.0.0...v0.0.1) (2025-04-08)

### Features

- adjust getTemplateInfo resolve templates.json file ([9b1b78b](https://github.com/royfuwei/start-ts-by/commit/9b1b78b2cc87d938cc49fec7f3a2fc584d58e425))

## 0.0.0 (2025-04-08)

### Features

- **init:** initial project from starter-ts-bin ([dd5591f](https://github.com/royfuwei/start-ts-by/commit/dd5591fdee3dd47d2ac461355dc97f39943e0313))
- use import.meta.url to resolve templates.json file ([29e7440](https://github.com/royfuwei/start-ts-by/commit/29e7440a470197dcddd82979c2ea9296ce85c3a0))

### Bug Fixes

- remove getTemplateInfo ([181f4b6](https://github.com/royfuwei/start-ts-by/commit/181f4b6c9ff34c16d3952fc68572a365b5a497f9))
