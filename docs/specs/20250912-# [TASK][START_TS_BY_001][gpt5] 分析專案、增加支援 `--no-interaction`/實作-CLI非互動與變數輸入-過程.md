## [2025-09-12][START_TS_BY_001-2][gpt-5][Code] 分析專案、增加支援 `--no-interaction` - 實作 CLI 非互動流程與變數輸入

### 任務概要

實作 `--no-interaction`（`--ni`）非互動模式與變數輸入功能（`--vars`、`--vars-file`，非 JSON），與現有互動式 UI 完整相容。

### 實作過程紀錄

#### 1. 分析現有專案結構
- 研究了現有的 commander.js 架構
- 分析 [`createAction.ts`](src/commands/createAction/createAction.ts) 的互動流程
- 了解各個 prompt 模組的作用和相互關係

#### 2. 新增型別定義
在 [`types.ts`](src/types.ts) 中新增：
- `ParsedVarsType`: 解析後的變數物件型別
- `VarsParseResult`: 變數解析結果
- `VarsFileInclude`: 檔案包含資訊
- `VarsMergeOptions` & `VarsMergeResult`: 變數合併相關
- `ExtendedActionArgsType`: 擴展的動作參數型別

#### 3. 核心工具模組開發

##### [`varsParser.ts`](src/utils/varsParser.ts)
- 解析 `--vars` 陣列為物件
- 支援巢狀鍵（`config.database.host`）
- 支援陣列索引（`removeList[0].field`）
- `@` 取檔功能（`token=@./file.txt`）
- 自動型別轉換（boolean, number, string）
- 嚴格模式重複鍵檢測
- 完整錯誤處理

##### [`varsFile.ts`](src/utils/varsFile.ts)
- dotenv 風格檔案解析
- 支援 `include: ./path/to.vars` 遞迴包含
- 循環包含檢測與錯誤報告
- 註解（`#`）和空白行處理
- 路徑驗證與修正建議

##### [`varsMerge.ts`](src/utils/varsMerge.ts)
- 深度物件合併
- 變數優先序處理：`--vars` > `--vars-file` > 個別旗標 > 預設值
- 型別衝突檢測與處理
- 嚴格模式與警告模式
- 必要參數驗證

#### 4. CLI 旗標整合
在 [`createActionCommand`](src/commands/createAction/createAction.ts) 中新增：
- `--no-interaction, --ni`: 非互動模式
- `--yes, -y`: 採用預設值
- `--vars <pairs...>`: 可重複的變數輸入
- `--vars-file <path>`: 變數檔案路徑
- `--strict`: 嚴格模式
- 保留 `--skip-prompt` 但標記為 deprecated

#### 5. 非互動流程實作
重構 [`createAction`](src/commands/createAction/createAction.ts)：
- 新增 `runNonInteractiveMode()` 函數
- 新增 `runInteractiveMode()` 函數（保持向後相容）
- 變數合併與驗證邏輯
- 必要參數檢查（name, template）
- 錯誤處理與退出碼 2

#### 6. 測試開發
創建 [`varsParser.test.ts`](src/utils/varsParser.test.ts)：
- 14 個測試案例涵蓋所有核心功能
- 達到 94.54% 代碼覆蓋率
- 測試包含：基本解析、型別轉換、巢狀鍵、陣列索引、檔案讀取、錯誤處理

#### 7. 文件更新
更新所有相關文件：
- [`README.md`](README.md): 主要專案說明
- [`docs/README.md`](docs/README.md): 英文文件
- [`docs/README.zh-TW.md`](docs/README.zh-TW.md): 繁體中文文件
- 新增完整的使用範例和變數檔案格式說明

### 技術亮點

1. **向後相容性**: 完整保留現有互動模式，僅在指定 `--no-interaction` 時切換
2. **靈活的變數輸入**: 支援多種格式和來源，優先序明確
3. **錯誤處理**: 詳細的錯誤訊息和修正建議
4. **型別安全**: 完整的 TypeScript 型別定義
5. **測試覆蓋**: 高覆蓋率的單元測試

### 挑戰與解決方案

1. **型別相容性**: 使用 `any` 型別在必要時處理動態巢狀結構
2. **循環包含檢測**: 實作包含堆疊追蹤機制
3. **變數優先序**: 清晰的合併邏輯與覆蓋規則
4. **錯誤訊息**: 提供具體的錯誤位置和修正建議

### 下一步改進建議

1. 為其他工具模組新增單元測試
2. 新增 E2E 測試驗證完整流程
3. 考慮加入環境變數支援
4. 優化錯誤訊息的本地化

### 檔案變更清單

**新增檔案:**
- `src/utils/varsParser.ts` - 變數解析工具
- `src/utils/varsFile.ts` - 變數檔案處理工具  
- `src/utils/varsMerge.ts` - 變數合併工具
- `src/utils/varsParser.test.ts` - 單元測試

**修改檔案:**
- `src/types.ts` - 新增變數相關型別
- `src/utils/index.ts` - 匯出新工具模組
- `src/commands/createAction/createAction.ts` - 整合非互動流程
- `README.md` - 更新使用說明
- `docs/README.md` - 更新英文文件
- `docs/README.zh-TW.md` - 更新中文文件

### 測試結果

```bash
✓ src/utils/varsParser.test.ts (14 tests passed)
Coverage: 94.54% statements, 87.14% branches, 100% functions
```

所有測試通過，核心變數解析功能達到高覆蓋率。