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
❯ royfuwei/starter-ts-app (Starter TypeScript App)
  royfuwei/starter-ts-lib (Starter TypeScript Library)
  ...
```

### 非互動模式

#### 基本用法
```sh
# 使用 --no-interaction (--ni) 旗標
npx start-ts-by my-app -t royfuwei/starter-ts-app --no-interaction
npx start-ts-by my-app -t royfuwei/starter-ts-app --ni

# 舊版 --skip-prompt 旗標（已棄用，建議使用 --no-interaction）
npx start-ts-by my-app --skip-prompt -t royfuwei/starter-ts-app
```

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
npx start-ts-by my-app -t royfuwei/starter-ts-app#dev/subdir --ni
npx start-ts-by my-app -t git@your.gitlab:group/repo.git#v2/templates --ni
npx start-ts-by my-app -t ./my-template-folder/subdir --ni
```

---

## 📝 支援的模板來源與語法

* **GitHub**
  `user/repo`
  `user/repo#branch`
  `user/repo#branch/subdir`
  `user/repo/subdir`

* **自架 Git、GitLab、Bitbucket、Gitea 等**
  `git@your.gitlab:group/repo.git#branch/subdir`
  `https://your.gitlab/group/repo.git#tag/subdir`

* **本地資料夾**
  `./my-template`
  `./my-template/subdir`
  `file:./my-template#subdir`

---

## ⚡ 運作方式

* **已移除 degit 相依，全部改用 git 指令。**
* 會根據解析後的模板來源，用 git clone 或直接複製資料夾。
* 所有 git repo 均可指定 branch/tag 及子目錄。
* 相容 GitHub、GitLab、自架、私有 git、SSH/HTTP、本地路徑。

---

## CLI 說明

```sh
npx start-ts-by --help

Usage: start-ts-by [options] [command]

Start TypeScript project by git repo or local folder templates

Options:
  -V, --version                     顯示版本號
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
  --git-init                        建立後執行 git init
  --npm-install                     建立後執行 npm install
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

* [Development](./development.md)

---

**重點說明：**

* 已經不再依賴 degit，所有模板皆以 git 指令或複製本地資料夾方式取得。
* Template source 字串可同時指定 repo、branch/tag、子目錄。
