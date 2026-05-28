---
name: start-ts-by
description: >-
  Use when the user wants to create a new project from a template, scaffold a project,
  bootstrap from a git repo, initialize a project from boilerplate, or generate a new
  codebase from an existing repository. ALWAYS use this skill when the user asks to
  scaffold, bootstrap, create from template, start a new project from a repo, generate
  from repo, clone and customize, or set up a project based on an existing starter.
  Also triggers when the user mentions start-ts-by directly. This applies even if the
  user doesn't explicitly say template — phrases like "set up a new project like X",
  "clone this repo and customize it", "make a new project from", "initialize from
  boilerplate", "based on the Y template" all qualify. Do NOT use for: cloning an
  existing repo to work on it, writing components, debugging, refactoring, adding
  endpoints, writing tests, deploying, or setting up linting/formatting.
---

# start-ts-by

Scaffold new projects from git repository or local folder templates using the `start-ts-by` CLI tool.

## Overview

`start-ts-by` is an npm-published CLI that creates projects from git repo templates or local folders. It handles cloning/copying the template, removing unwanted files, renaming the package, and running post-creation commands like `git init` or `npm install`.

Install or run via: `npx start-ts-by [options] [name]`

## How to Use

### Basic Usage

**Interactive mode** (recommended for first time):
```bash
npx start-ts-by my-app
```
This prompts the user for template source, optional flags (monorepo, husky, git-init, npm-install), and files to remove.

**Non-interactive mode** (for automated workflows):
```bash
npx start-ts-by my-app -t user/repo --ni
```

### Template Source Formats

The `-t, --template` flag accepts these formats:

| Format | Example |
|--------|---------|
| GitHub shorthand | `user/repo` |
| GitHub with branch | `user/repo#branch` |
| GitHub with branch + subdir | `user/repo#branch/subdir` |
| SSH URL | `git@host:org/repo.git#ref/subdir` |
| HTTPS git URL | `https://host/org/repo.git#ref/subdir` |
| Local relative path | `./local-folder` |
| Local absolute path | `/absolute/path` |
| Local with file prefix | `file:./path` |

When the source is a git repository, only git-tracked files are copied (via `git ls-files`).

### Key Flags

| Flag | Description |
|------|-------------|
| `-t, --template <repo>` | Template source (required in non-interactive mode) |
| `--no-interaction, --ni` | Skip all prompts |
| `--monorepo` | Remove lock files, workspace config, .npmrc, .husky, .github, packageManager field |
| `--rm <files...>` | Remove specific files/folders after creation |
| `--no-husky` | Remove .husky directory |
| `--no-gitlab` | Remove GitLab CI/CD config (all files matching /gitlab/i) |
| `--no-deploy` | Remove deploy/.deploy configuration |
| `--git-init` | Run `git init` after creation |
| `--npm-install` | Run `npm install` after creation |
| `--vars <pairs...>` | Pass variables as `key=value` (supports nesting: `a.b=value`) |
| `--vars-file <path>` | Load variables from a file |
| `--yes, -y` | Use defaults and skip confirmations |
| `--list` | List all available built-in templates |

### Variable Passing

Variables can be passed via `--vars` with nested key support:

```bash
npx start-ts-by my-app -t user/repo --ni \
  --vars name=my-app,author.name="Roy",features[0].name="auth"
```

Priority order (highest to lowest): `--vars` > `--vars-file` > CLI flags > env vars > defaults.

### Finding Templates

Templates come from three sources: built-in, registry, or manual.

**Always run `npx start-ts-by --list` to get the current available templates** when the user doesn't specify a template source. Do not rely on hardcoded template names — they change over time. The `--list` output includes both built-in and registry templates.

For detailed output with descriptions: `npx start-ts-by --list-verbose`
For JSON format: `npx start-ts-by --list-json`

## Workflow

When the user asks to scaffold or create a project from a template:

1. **Determine the template source**:
   - If the user specified a template (e.g., "from royfw/my-repo" or "using Fastify template") → use it directly
   - If the user didn't specify a template → run `npx start-ts-by --list` to show available options, then ask the user to choose
2. **Determine project name** - Use the name the user provided, or ask them
3. **Identify flags** - Based on user intent, determine which flags to use:
   - If they want a standalone package inside a monorepo → add `--monorepo`
   - If they don't need GitLab CI → add `--no-gitlab`
   - If they don't need deployment config → add `--no-deploy`
   - If they want git initialized → add `--git-init`
   - If they want dependencies installed → add `--npm-install`
4. **Execute the command** - Run `npx start-ts-by` with the determined arguments
   - Use interactive mode if the user hasn't specified all details
   - Use `--ni` (non-interactive) if all parameters are clear
5. **Verify** - Check that the project was created successfully at the expected directory

## Common Mistakes

- **Forgetting `--ni` in non-interactive mode** without providing `--template` will cause the tool to exit with an error. Non-interactive mode requires both `name` and `template`.
- **Using wrong remove flag syntax**: `--rm` takes space-separated file names, not comma-separated: `--rm file1 file2` not `--rm file1,file2`
- **Template source confusion**: `user/repo` is GitHub shorthand. For other git hosts, use full HTTPS or SSH URLs.
- **Local path templates**: Use `./` prefix or `file:` prefix for local directories to distinguish from GitHub shorthand.
