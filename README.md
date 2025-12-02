# start-ts-by

[![NPM Version](https://img.shields.io/npm/v/start-ts-by)](https://www.npmjs.com/package/start-ts-by) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/royfuwei/start-ts-by) 

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
#   royfuwei/starter-ts-app (Starter TypeScript App)
#   royfuwei/starter-ts-lib (Starter TypeScript Library)
#   ...
```

### Non-interactive Mode

#### Basic Usage
```sh
# Using --no-interaction (--ni) flag
npx start-ts-by my-app -t royfuwei/starter-ts-app --no-interaction
npx start-ts-by my-app -t royfuwei/starter-ts-app --ni

# Legacy --skip-prompt flag (deprecated, use --no-interaction)
npx start-ts-by my-app --skip-prompt -t royfuwei/starter-ts-app
```

#### Monorepo Mode
```sh
# Non-interactive mode: Remove lock files, .npmrc, and packageManager field for monorepo subprojects
npx start-ts-by my-app -t user/repo --monorepo --ni

# Combine with other flags
npx start-ts-by my-app -t user/repo --monorepo --no-husky --ni

# Interactive mode: Specify --monorepo flag upfront
npx start-ts-by my-app -t user/repo --monorepo

# Interactive mode: Will prompt for monorepo mode if not specified
npx start-ts-by my-app -t user/repo
# During prompts, you'll see:
# ? Enable monorepo mode? (Remove lock files, .npmrc, and packageManager field) (y/N)
```

The `--monorepo` flag (or interactive prompt) automatically removes files that conflict with monorepo root configuration:
- `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock` (lock files)
- `.npmrc` (package manager config)
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
npx start-ts-by my-app -t royfuwei/starter-ts-app#dev/subdir --ni
npx start-ts-by my-app -t git@your.gitlab:group/repo.git#v2/templates --ni
npx start-ts-by my-app -t ./my-template-folder/subdir --ni
```

---

## 📝 Supported Template Sources & Syntax

* **GitHub**

  * `user/repo`
  * `user/repo#branch`
  * `user/repo#branch/subdir`
  * `user/repo/subdir`

* **Custom Git / GitLab / Bitbucket / Gitea / etc.**

  * `git@your.gitlab:group/repo.git#branch/subdir`
  * `https://your.gitlab/group/repo.git#tag/subdir`

* **Local Folders**

  * `./my-template`
  * `./my-template/subdir`
  * `file:./my-template#subdir`

---

## ⚡ How It Works

* **Removed degit dependency.**
* Uses native `git` commands to clone repositories based on parsed template source.
* Local folders are copied directly.
* Supports branch/tag and subdirectory selection for all git sources.
* Works with GitHub, GitLab, private git servers, SSH/HTTP URLs, and local paths.

---

## CLI Help

```sh
npx start-ts-by --help

Usage: start-ts-by [options] [command]

Start TypeScript project by git repo or local folder templates

Options:
  -V, --version                     output the version number
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
  --monorepo                        Remove monorepo conflicting files (lock files, .npmrc, packageManager field)
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

* [Development](./docs/development.md)

---

**Key changes:**

* degit is removed, all template fetching is handled by git commands or direct file copy.
* Template source string is parsed to support repo URLs, branches, tags, and subdirectories.
