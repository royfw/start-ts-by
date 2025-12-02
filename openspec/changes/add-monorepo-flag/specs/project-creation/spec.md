# Project Creation Capability

## ADDED Requirements

### Requirement: Monorepo Mode Support
系統應提供 `--monorepo` 旗標，讓使用者可以建立適合 monorepo 環境的子專案，自動移除與 monorepo 管理機制衝突的檔案和設定。

#### Scenario: 使用 --monorepo 旗標建立專案
- **WHEN** 使用者執行 `npx start-ts-by my-app -t user/repo --monorepo`
- **THEN** 系統應從生成的專案中移除以下檔案：
  - `pnpm-lock.yaml`
  - `package-lock.json`
  - `yarn.lock`
  - `.npmrc`
- **AND** 系統應從 `package.json` 中移除 `packageManager` 欄位
- **AND** 專案建立成功

#### Scenario: --monorepo 與非互動模式組合
- **WHEN** 使用者執行 `npx start-ts-by my-app -t user/repo --monorepo --ni`
- **THEN** 系統應在非互動模式下建立專案
- **AND** 所有 monorepo 不相容的檔案應被移除
- **AND** 不應提示使用者任何問題

#### Scenario: --monorepo 與 --rm 參數組合使用
- **WHEN** 使用者執行 `npx start-ts-by my-app -t user/repo --monorepo --rm .husky`
- **THEN** 系統應移除 monorepo 檔案清單中的所有檔案
- **AND** 系統應額外移除 `.husky` 目錄
- **AND** 兩組移除清單應正確合併，不重複處理

#### Scenario: 不使用 --monorepo 時保持原有行為
- **WHEN** 使用者執行 `npx start-ts-by my-app -t user/repo`（不帶 `--monorepo`）
- **THEN** 系統不應自動移除任何 monorepo 相關檔案
- **AND** 行為應與現有版本完全相同（向後相容）

#### Scenario: 模板中不存在目標檔案時的處理
- **WHEN** 使用者使用 `--monorepo` 但模板中不包含某些鎖定檔案（如只有 `package-lock.json`）
- **THEN** 系統應僅移除存在的檔案
- **AND** 不應因檔案不存在而報錯
- **AND** 應成功完成專案建立

#### Scenario: package.json 不含 packageManager 欄位時的處理
- **WHEN** 使用者使用 `--monorepo` 但模板的 `package.json` 中沒有 `packageManager` 欄位
- **THEN** 系統應正常處理，不報錯
- **AND** 僅移除其他 monorepo 相關檔案
- **AND** `package.json` 結構保持正確

#### Scenario: 互動模式中的 --monorepo 參數
- **WHEN** 使用者在互動模式執行 `npx start-ts-by --monorepo`
- **THEN** 系統應提示輸入專案名稱
- **AND** 系統應提示選擇模板
- **AND** 在建立專案後自動移除 monorepo 相關檔案
- **AND** 不應再次詢問是否移除這些檔案

#### Scenario: 保留非衝突的專案設定檔
- **WHEN** 使用者使用 `--monorepo` 建立專案
- **THEN** 系統應保留 `.nvmrc` 檔案（不移除）
- **AND** 系統應保留 `.vscode` 目錄（不移除）
- **AND** 系統應保留其他不影響 monorepo 套件管理的設定檔

### Requirement: CLI 參數文件化
系統的 CLI help 和 README 文件應清楚說明 `--monorepo` 參數的用途和使用方式。

#### Scenario: CLI help 包含 --monorepo 說明
- **WHEN** 使用者執行 `npx start-ts-by create --help`
- **THEN** help 訊息應包含 `--monorepo` 參數
- **AND** description 應說明此參數用於移除 monorepo 不相容的檔案
- **AND** 應列出會被移除的檔案類型

#### Scenario: README 包含 monorepo 使用範例
- **WHEN** 使用者查看 README.md
- **THEN** 應包含 monorepo 模式的使用範例
- **AND** 應說明哪些檔案會被移除
- **AND** 應提供互動模式和非互動模式的範例

### Requirement: 移除檔案清單的可維護性
系統應將 monorepo 檔案清單定義為常數，方便未來維護和擴充。

#### Scenario: Monorepo 檔案清單定義為常數
- **WHEN** 開發者需要修改或擴充 monorepo 檔案清單
- **THEN** 應能在單一位置（常數定義）進行修改
- **AND** 修改應自動套用到所有使用此清單的邏輯

#### Scenario: 檔案清單的擴充性
- **WHEN** 未來需要新增更多 monorepo 不相容的檔案（如 `.yarnrc.yml`）
- **THEN** 僅需修改常數定義
- **AND** 不需修改核心邏輯
- **AND** 所有測試應自動覆蓋新增的檔案