# start-ts-by

[![NPM Version](https://img.shields.io/npm/v/start-ts-by)](https://www.npmjs.com/package/start-ts-by) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/royfw/start-ts-by)

Create ts/js projects from flexible templates using git and local folders.

---

## 🚀 Get Started

```sh
npx start-ts-by [projectName]
# or
npx start-ts-by create [projectName]
```

### Interactive Mode

```sh
npx start-ts-by
# Example workflow:
# 🚀 Start creating project...
# ✔ Enter project name: my-app
# ✔ Enter template (e.g. user/repo, ./local-path, git@domain:group/repo.git)
# ? Choose a template (Use arrow keys)
#   royfw/starter-ts-app (Starter TypeScript App)
#   royfw/starter-ts-lib (Starter TypeScript Library)
#   ...
```

### Non-interactive Mode

#### Basic Usage

```sh
# Using --no-interaction (--ni) flag
npx start-ts-by my-app -t royfw/starter-ts-app --no-interaction
npx start-ts-by my-app -t royfw/starter-ts-app --ni

# Legacy --skip-prompt flag (deprecated, use --no-interaction)
npx start-ts-by my-app --skip-prompt -t royfw/starter-ts-app
```

#### Monorepo Mode

```sh
# Non-interactive mode: Remove lock files, workspace config, .npmrc, and packageManager field
npx start-ts-by my-app -t user/repo --monorepo --ni

# Combine with other flags
npx start-ts-by my-app -t user/repo --monorepo --no-husky --ni

# Interactive mode: Specify --monorepo flag upfront
npx start-ts-by my-app -t user/repo --monorepo

# Interactive mode: Will prompt for monorepo mode if not specified
npx start-ts-by my-app -t user/repo
# During prompts, you'll see:
# ? Enable monorepo mode? (Remove lock files, workspace config, .npmrc, and packageManager field) (y/N)
```

The `--monorepo` flag (or interactive prompt) automatically removes files that conflict with monorepo root configuration:

- `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package-lock.json`, `yarn.lock` (lock files and workspace config)
- `.npmrc` (package manager config)
- `.husky` directory and `prepare` script containing "husky" in package.json
- `.github` directory (GitHub Actions workflows)
- `packageManager` field in package.json

**Interactive Mode Behavior:**

- If you provide `--monorepo` flag when starting, it will be pre-selected in the prompts
- If you don't provide the flag, you'll be asked during the interactive prompts
- Default is `false` (not enabled) - press Enter to skip or type 'y' to enable

This is useful when creating subprojects in a monorepo where these files should be managed at the root level.

#### Advanced Non-interactive with Variables

```sh
# Using --vars for inline variables
npx start-ts-by my-app --ni --vars name=my-app,template=user/repo
npx start-ts-by my-app --ni --vars "removeList[0].field=README.md,removeList[0].isRemove=true"

# Using --vars-file for configuration files
npx start-ts-by my-app --ni --vars-file ./project.vars

# Combining multiple sources (vars override vars-file)
npx start-ts-by my-app --ni --vars-file ./base.vars --vars template=user/custom-repo
```

#### Variable File Format (.vars)

Create a `.vars` file with key=value pairs:

```bash
# project.vars
name=my-awesome-app
template=user/repo

# Nested variables for removeList
removeList[0].field=README.md
removeList[0].isRemove=true
removeList[1].field=.github
removeList[1].isRemove=false

# Execution options
execList[0].key=gitInit
execList[0].command=git init
execList[0].isExec=true

# File content (@ prefix reads from file)
# token=@./secret-token.txt

# Include other vars files
# include: ./common.vars
```

#### Template Sources with Branches/Subdirectories

```sh
npx start-ts-by my-app -t royfw/starter-ts-app#dev/subdir --ni
npx start-ts-by my-app -t git@your.gitlab:group/repo.git#v2/templates --ni
npx start-ts-by my-app -t ./my-template-folder/subdir --ni
```

### List Available Templates

```sh
# List all available templates (human-readable format)
npx start-ts-by --list
npx start-ts-by -l

# List templates in JSON format (for programmatic use)
npx start-ts-by --list-json

# List templates with descriptions (verbose mode)
npx start-ts-by --list-verbose
```

**Example Output:**

```
📦 Available Templates:

📌 Built-in Templates (builtin)
  ├─ TypeScript Library
  ├─ TypeScript Application
  └─ Monorepo Template

🌐 start-ts-templates (registry)
  ├─ App (tsdown)
  └─ Library

✨ Total 5 templates from 2 sources
```

---

## 🌐 Registry Support

`start-ts-by` supports loading templates from external registries, allowing you to use community-provided template collections.

### Setting Up Registry

Create a `registry-config.json` file:

```json
{
  "registries": [
    {
      "name": "start-ts-templates",
      "url": "https://raw.githubusercontent.com/royfw/start-ts-templates/main/registry.json",
      "enabled": true
    }
  ],
  "cacheDir": ".cache/registries",
  "cacheTTL": 3600000
}
```

### Registry.json Format

External registries should provide a JSON file in the following format:

```json
{
  "repo": "your-org/your-templates-repo",
  "defaultRef": "main",
  "templates": [
    {
      "id": "template-id",
      "path": "templates/template-path",
      "title": "Template Display Name",
      "description": "Optional description"
    }
  ]
}
```

### Using Registry Templates

When running `npx start-ts-by create my-project`:

1. Select template source (Built-in / Registry / Manual input)
2. If you choose Registry, select a specific template
3. Or use `--list` to view all available templates

For detailed instructions, see [Registry Guide](./docs/registry.md) | [zh-TW](./docs/registry.zh-TW.md).

### Official Template Collection

The official template collection is maintained at [royfw/start-ts-templates](https://github.com/royfw/start-ts-templates):

- 📦 **Repository**: [github.com/royfw/start-ts-templates](https://github.com/royfw/start-ts-templates)
- 📋 **Registry**: Automatically configured with `registry-config.json`
- 🎯 **Templates**: TypeScript app/lib templates with modern tooling (tsdown, vitest, etc.)
- 📖 **Usage**: Templates are available in interactive mode or via `--list` command

---

## 📝 Supported Template Sources & Syntax

- **GitHub**

  - `user/repo`
  - `user/repo#branch`
  - `user/repo#branch/subdir`
  - `user/repo/subdir`

- **Custom Git / GitLab / Bitbucket / Gitea / etc.**

  - `git@your.gitlab:group/repo.git#branch/subdir`
  - `https://your.gitlab/group/repo.git#tag/subdir`

- **Local Folders**

  - `./my-template`
  - `./my-template/subdir`
  - `file:./my-template#subdir`

---

## ⚡ How It Works

- **Removed degit dependency.**
- Uses native `git` commands to clone repositories based on parsed template source.
- Local folders are copied directly.
- Supports branch/tag and subdirectory selection for all git sources.
- Works with GitHub, GitLab, private git servers, SSH/HTTP URLs, and local paths.

---

## CLI Help

```sh
npx start-ts-by --help

Usage: start-ts-by [options] [command]

Start TypeScript project by git repo or local folder templates

Options:
  -V, --version                     output the version number
  -l, --list                        List all available templates
  --list-json                       List all available templates in JSON format
  --list-verbose                    List all available templates with descriptions
  -h, --help                        display help for command

Commands:
  create [options] [name]  Create a new project from a git template (Default)
  help [command]           display help for command

# Create command options:
npx start-ts-by create --help

Options:
  -t, --template <repo>             Template source (user/repo, git@domain:group/repo.git, ./local-folder)
  --skip-prompt                     Skip prompt (deprecated, use --no-interaction)
  --no-interaction, --ni            Non-interactive mode, skip all prompts
  --yes, -y                         Use defaults and skip confirmations when applicable
  --vars <pairs...>                 Variables in key=value format, supports nested keys and arrays (can be used multiple times) (default: [])
  --vars-file <path>                Path to variables file (non-JSON, supports includes)
  --strict                          Strict mode: treat duplicate keys and type conflicts as errors
  --rm <files...>                   Remove files/folders after project creation
  --no-husky                        Remove .husky
  --github                          Keep .github/workflows
  --git-init                        Run git init after creation
  --npm-install                     Run npm install after creation
  --monorepo                        Remove monorepo conflicting files (lock files, workspace config, .npmrc, .husky, .github, prepare script, packageManager field)
  -h, --help                        display help for command
```

### Variable Priority (high to low)

1. `--vars` command line arguments
2. `--vars-file` file contents
3. Individual flags (`-t`, `--rm`, etc.)
4. Environment variables
5. Interactive input
6. Default values

### Error Handling

- Non-interactive mode requires `name` and `template` parameters
- Missing required parameters exit with code 2
- File read errors and parsing failures provide specific error messages
- `--strict` mode treats duplicate keys and type conflicts as errors (default: warnings)

---

## References

- [Development](./docs/development.md)

---

**Key changes:**

- degit is removed, all template fetching is handled by git commands or direct file copy.
- Template source string is parsed to support repo URLs, branches, tags, and subdirectories.
