# Change: 新增 --monorepo 旗標以支援 Monorepo 專案模式

## Why

當使用者在 monorepo 環境下使用 start-ts-by 建立子專案時，模板中的某些檔案會與 monorepo 的管理機制衝突：

1. **套件管理器鎖定檔案**：`pnpm-lock.yaml`、`package-lock.json`、`yarn.lock` 應該由 monorepo 根目錄統一管理
2. **套件管理器設定**：`.npmrc` 可能包含與 monorepo 根目錄衝突的 registry 或設定
3. **packageManager 欄位**：`package.json` 中的 `packageManager` 欄位會強制使用特定版本的套件管理器，可能與 monorepo 的選擇衝突

目前使用者需要手動使用 `--rm` 逐一指定這些檔案，例如：
```sh
npx start-ts-by my-app -t user/repo --rm pnpm-lock.yaml package-lock.json yarn.lock .npmrc --ni
```

這種方式繁瑣且容易遺漏檔案。

## What Changes

新增 `--monorepo` CLI 旗標，作為移除 monorepo 不相容檔案的便捷方式：

- **新增 CLI 參數**：`--monorepo` 旗標（boolean，預設 `false`）
- **移除檔案清單**：
  - `pnpm-lock.yaml`
  - `package-lock.json`
  - `yarn.lock`
  - `.npmrc`
- **處理 package.json**：從生成的專案中移除 `packageManager` 欄位

使用範例：
```sh
# 互動模式
npx start-ts-by my-app -t user/repo --monorepo

# 非互動模式
npx start-ts-by my-app -t user/repo --monorepo --ni

# 與其他參數組合
npx start-ts-by my-app -t user/repo --monorepo --no-husky --ni
```

## Impact

### Affected Specs
- `project-creation` - 新增 monorepo 模式的專案建立需求

### Affected Code
- [`src/commands/createAction/createAction.ts`](../../../src/commands/createAction/createAction.ts) - 新增 `--monorepo` 參數處理邏輯
- [`src/commands/createAction/getArgsRmList.ts`](../../../src/commands/createAction/getArgsRmList.ts) - 可能需要擴充以支援 monorepo 模式的檔案移除
- [`src/libs/createProject.ts`](../../../src/libs/createProject.ts) - 可能需要處理 package.json 的 packageManager 欄位移除
- [`README.md`](../../../README.md) - 新增 `--monorepo` 使用文件和範例

### 向後相容性
- ✅ **無破壞性變更**：新參數為選用，不影響現有使用方式
- ✅ **保留彈性**：使用者仍可使用 `--rm` 自訂移除檔案清單
- ✅ `--monorepo` 與 `--rm` 可以組合使用

### 測試需求
- 單元測試：驗證 `--monorepo` 旗標正確產生移除清單
- 整合測試：確認檔案正確移除且 package.json 的 packageManager 欄位被移除
- E2E 測試：驗證完整的 monorepo 模式專案建立流程