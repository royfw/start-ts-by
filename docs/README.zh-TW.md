# start-ts-by

快速透過 **任意 git 或本地模板** 建立 TypeScript 專案。
支援 GitHub/GitLab/自架 Git/SSH/HTTP/本地資料夾，彈性指定 branch/tag、子目錄。

---

## 🚀 快速開始

```sh
npx start-ts-by [專案名稱]
# 或
npx start-ts-by create [專案名稱]
```

### 互動式選單模式

```sh
npx start-ts-by
🚀 開始建立專案...
✔ 請輸入專案名稱 my-app
✔ 請輸入模板 (如 user/repo, ./local-path, git@domain:group/repo.git):
? 請選擇模板 (方向鍵選擇)
❯ royfw/starter-ts-app (Starter TypeScript App)
  royfw/starter-ts-lib (Starter TypeScript Library)
  ...
```

### 非互動模式

#### 基本用法

```sh
# 使用 --no-interaction (--ni) 旗標
npx start-ts-by my-app -t royfw/starter-ts-app --no-interaction
npx start-ts-by my-app -t royfw/starter-ts-app --ni

# 舊版 --skip-prompt 旗標（已棄用，建議使用 --no-interaction）
npx start-ts-by my-app --skip-prompt -t royfw/starter-ts-app
```

#### Monorepo 模式

```sh
# 非互動模式：移除 lock 檔案、workspace 設定、.npmrc、以及 package.json 中的 packageManager 欄位
npx start-ts-by my-app -t user/repo --monorepo --ni

# 結合其他旗標
npx start-ts-by my-app -t user/repo --monorepo --no-husky --ni

# 互動模式：預先指定 --monorepo 旗標
npx start-ts-by my-app -t user/repo --monorepo

# 互動模式：未指定時會在提示中詢問
npx start-ts-by my-app -t user/repo
# 在提示過程中會看到：
# ? 啟用 monorepo 模式？（移除 lock 檔案、workspace 設定、.npmrc 與 packageManager 欄位） (y/N)
```

`--monorepo` 旗標（或互動式提示）會自動移除與 monorepo 根層設定衝突的檔案：

- `pnpm-lock.yaml`、`pnpm-workspace.yaml`、`package-lock.json`、`yarn.lock`（lock 檔案與 workspace 設定）
- `.npmrc`（套件管理器設定）
- `.husky` 目錄以及 package.json 中包含 "husky" 的 `prepare` script
- `.github` 目錄（GitHub Actions workflows）
- package.json 中的 `packageManager` 欄位

**互動模式行為：**

- 如果在啟動時提供 `--monorepo` 旗標，在提示中會預先選中
- 如果未提供旗標，會在互動式提示中詢問
- 預設為 `false`（未啟用）- 按 Enter 跳過或輸入 'y' 啟用

這在建立 monorepo 的子專案時很有用，因為這些檔案應該在根層級管理。

#### 進階非互動模式與變數

```sh
# 使用 --vars 設定內嵌變數
npx start-ts-by my-app --ni --vars name=my-app,template=user/repo
npx start-ts-by my-app --ni --vars "removeList[0].field=README.md,removeList[0].isRemove=true"

# 使用 --vars-file 讀取設定檔
npx start-ts-by my-app --ni --vars-file ./project.vars

# 結合多個來源（--vars 會覆蓋 --vars-file）
npx start-ts-by my-app --ni --vars-file ./base.vars --vars template=user/custom-repo
```

#### 變數檔案格式 (.vars)

建立包含 key=value 對的 `.vars` 檔案：

```bash
# project.vars
name=my-awesome-app
template=user/repo

# removeList 巢狀變數
removeList[0].field=README.md
removeList[0].isRemove=true
removeList[1].field=.github
removeList[1].isRemove=false

# 執行選項
execList[0].key=gitInit
execList[0].command=git init
execList[0].isExec=true

# 檔案內容（@ 前綴從檔案讀取）
# token=@./secret-token.txt

# 包含其他變數檔案
# include: ./common.vars
```

#### 模板來源支援 branch/子目錄

```sh
npx start-ts-by my-app -t royfw/starter-ts-app#dev/subdir --ni
npx start-ts-by my-app -t git@your.gitlab:group/repo.git#v2/templates --ni
npx start-ts-by my-app -t ./my-template-folder/subdir --ni
```

### 列出可用的 Templates

```sh
# 列出所有可用 templates（易讀格式）
npx start-ts-by --list
npx start-ts-by -l

# 以 JSON 格式列出 templates（適合程式化使用）
npx start-ts-by --list-json

# 列出 templates 並包含描述（詳細模式）
npx start-ts-by --list-verbose
```

**範例輸出：**

```
📦 可用的 Templates:

📌 內建 Templates (builtin)
  ├─ TypeScript Library
  ├─ TypeScript Application
  └─ Monorepo Template

🌐 start-ts-templates (registry)
  ├─ App (tsdown)
  └─ Library

✨ 共 5 個 templates 來自 2 個來源
```

---

## 🌐 Registry 支援

`start-ts-by` 支援從外部 registry 載入 templates，讓你可以使用社群提供的 template 集合。

### 設定 Registry

建立 `registry-config.json` 檔案：

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

### Registry.json 格式

外部 registry 應提供以下格式的 JSON 檔案：

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

### 使用 Registry Templates

執行 `npx start-ts-by create my-project` 時：

1. 選擇 template 來源（內建 / Registry / 手動輸入）
2. 如果選擇 Registry，再選擇具體的 template
3. 或使用 `--list` 查看所有可用的 templates

詳細說明請參考 [Registry 使用指南](./registry.zh-TW.md)。

### 官方 Template 集合

請造訪 [start-ts-templates](https://github.com/royfw/start-ts-templates) repository 取得官方 template 集合與 registry 設定檔。

---

## 📝 支援的模板來源與語法

- **GitHub**
  `user/repo`
  `user/repo#branch`
  `user/repo#branch/subdir`
  `user/repo/subdir`

- **自架 Git、GitLab、Bitbucket、Gitea 等**
  `git@your.gitlab:group/repo.git#branch/subdir`
  `https://your.gitlab/group/repo.git#tag/subdir`

- **本地資料夾**
  `./my-template`
  `./my-template/subdir`
  `file:./my-template#subdir`

---

## ⚡ 運作方式

- **已移除 degit 相依，全部改用 git 指令。**
- 會根據解析後的模板來源，用 git clone 或直接複製資料夾。
- 當本地模板來源為 git 倉庫時，只會複製 git tracked 的檔案（與 `git clone` 行為一致），不會複製 `node_modules/`、`dist/`、`.env` 等被 `.gitignore` 忽略的檔案。
- 所有 git repo 均可指定 branch/tag 及子目錄。
- 相容 GitHub、GitLab、自架、私有 git、SSH/HTTP、本地路徑。

---

## CLI 說明

```sh
npx start-ts-by --help

Usage: start-ts-by [options] [command]

Start TypeScript project by git repo or local folder templates

Options:
  -V, --version                     顯示版本號
  -l, --list                        列出所有可用 templates
  --list-json                       以 JSON 格式列出所有可用 templates
  --list-verbose                    列出所有可用 templates 並包含描述
  -h, --help                        顯示說明

Commands:
  create [options] [name]  Create a new project from a git template (Default)
  help [command]           display help for command

# create 指令選項：
npx start-ts-by create --help

Options:
  -t, --template <repo>             模板來源 (user/repo, git@domain:group/repo.git, ./local-folder)
  --skip-prompt                     跳過提示（已棄用，建議使用 --no-interaction）
  --no-interaction, --ni            非互動模式，跳過所有提示
  --yes, -y                         使用預設值並跳過確認
  --vars <pairs...>                 Variables in key=value format, supports nested keys and arrays (can be used multiple times) (default: [])
  --vars-file <path>                變數檔案路徑（非 JSON，支援包含）
  --strict                          嚴格模式：將重複鍵和型別衝突視為錯誤
  --rm <files...>                   建立專案後要移除的檔案/資料夾
  --no-husky                        移除 .husky
  --github                          保留 .github/workflows
  --gitlab                          保留 .gitlab-ci.yml 和 GitLab CI/CD 設定
  --deploy                          保留 deploy/.deploy 設定
  --git-init                        建立後執行 git init
  --npm-install                     建立後執行 npm install
  --monorepo                        移除 monorepo 衝突檔案（lock 檔案、workspace 設定、.npmrc、.husky、.github、prepare script、packageManager 欄位）
  -h, --help                        顯示說明

```

### 變數優先序（由高到低）

1. `--vars` 命令列參數
2. `--vars-file` 檔案內容
3. 個別旗標（`-t`, `--rm` 等）
4. 環境變數
5. 互動式輸入
6. 預設值

### 錯誤處理

- 非互動模式需要 `name` 和 `template` 參數
- 缺少必要參數時以退出碼 2 結束
- 檔案讀取錯誤和解析失敗會提供具體錯誤訊息
- `--strict` 模式將重複鍵和型別衝突視為錯誤（預設：警告）

---

## 參考文件

- [Development](./development.md)

---

**重點說明：**

- 已經不再依賴 degit，所有模板皆以 git 指令或複製本地資料夾方式取得。
- Template source 字串可同時指定 repo、branch/tag、子目錄。
