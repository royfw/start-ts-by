# Implementation Tasks

## 1. 核心功能實作

### 1.1 新增 CLI 參數定義
- [ ] 在 [`createAction.ts`](../../../src/commands/createAction/createAction.ts:277) 的 `createActionCommand.flagsOptions` 中新增 `--monorepo` 參數
- [ ] 設定預設值為 `false`
- [ ] 撰寫清楚的 description

### 1.2 建立 monorepo 檔案清單常數
- [ ] 在 [`createAction.ts`](../../../src/commands/createAction/createAction.ts) 中新增 `actionMonorepoFileNames` 常數
- [ ] 包含檔案：`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `.npmrc`

### 1.3 整合到移除檔案邏輯
- [ ] 修改 [`getArgsRmList.ts`](../../../src/commands/createAction/getArgsRmList.ts) 或在 [`createAction.ts`](../../../src/commands/createAction/createAction.ts) 中處理 `--monorepo` 參數
- [ ] 當 `--monorepo` 為 `true` 時，將 monorepo 檔案清單加入 `removeList`
- [ ] 確保與現有 `--rm` 參數相容（可組合使用）

### 1.4 處理 package.json 的 packageManager 欄位
- [ ] 檢視 [`createProject.ts`](../../../src/libs/createProject.ts) 或相關檔案
- [ ] 實作移除 `packageManager` 欄位的邏輯
- [ ] 僅在 `--monorepo` 啟用時執行此操作
- [ ] 確保 JSON 格式正確（處理逗號、縮排等）

## 2. 測試

### 2.1 單元測試
- [ ] 為 `getArgsRmList` 或相關函式新增測試
- [ ] 測試案例：`--monorepo` 為 `true` 時產生正確的移除清單
- [ ] 測試案例：`--monorepo` 為 `false` 時不影響現有行為
- [ ] 測試案例：`--monorepo` 與 `--rm` 組合使用

### 2.2 整合測試
- [ ] 建立測試專案，驗證檔案確實被移除
- [ ] 驗證 `package.json` 的 `packageManager` 欄位被正確移除
- [ ] 測試互動模式和非互動模式

### 2.3 E2E 測試
- [ ] 完整流程測試：建立 monorepo 子專案
- [ ] 驗證所有目標檔案被移除
- [ ] 驗證專案可正常運作

## 3. 文件更新

### 3.1 README.md
- [ ] 在 [`README.md`](../../../README.md) 的 "Non-interactive Mode" 章節新增 `--monorepo` 範例
- [ ] 在 "CLI Help" 章節新增 `--monorepo` 參數說明
- [ ] 新增獨立的 "Monorepo Usage" 章節，說明使用情境和範例

### 3.2 CLI Help 文字
- [ ] 確認 `--monorepo` 的 description 清楚易懂
- [ ] 執行 `npx start-ts-by create --help` 驗證輸出

### 3.3 專案文件
- [ ] 如果有其他文件（如 [`docs/`](../../../docs/) 目錄），同步更新

## 4. 驗證與發布準備

### 4.1 程式碼品質
- [ ] 執行 `npm run lint` 確保無 linting 錯誤
- [ ] 執行 `npm run typecheck` 確保型別正確
- [ ] 執行所有測試 `npm test`

### 4.2 手動測試
- [ ] 測試互動模式使用 `--monorepo`
- [ ] 測試非互動模式 `--monorepo --ni`
- [ ] 測試與其他參數組合（如 `--monorepo --no-husky --ni`）
- [ ] 驗證生成的專案結構正確

### 4.3 文件一致性
- [ ] 確認 README.md 與實際 CLI help 輸出一致
- [ ] 確認所有範例程式碼可執行

## 5. 可選的改進（Optional）

### 5.1 互動模式增強
- [ ] 在互動模式中新增提示：「是否啟用 monorepo 模式？」
- [ ] 提供預設選項和說明文字

### 5.2 錯誤處理
- [ ] 當檔案不存在時給予友善的提示
- [ ] 處理 package.json 讀取/寫入錯誤

### 5.3 進階功能
- [ ] 考慮是否需要 `--no-monorepo` 的對應參數（目前預設為 false，可能不需要）
- [ ] 考慮是否需要讓使用者自訂 monorepo 檔案清單