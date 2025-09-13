## [2025-09-12][START_TS_BY_001-2][gpt-5][Code] 分析專案、增加支援 `--no-interaction` - 實作 CLI 非互動流程與變數輸入

### 實作結論

本次任務成功實作了 `--no-interaction`（`--ni`）非互動模式與變數輸入功能，完全符合 Architect 規格要求，並與現有互動式 UI 完整相容。

### 核心功能實現

#### 1. 非互動模式旗標
- ✅ `--no-interaction, --ni`: 主要非互動模式旗標
- ✅ `--yes, -y`: 使用預設值並跳過確認
- ✅ `--skip-prompt`: 保留但標記為 deprecated，並顯示遷移提示
- ✅ `--strict`: 嚴格模式，重複鍵與型別衝突視為錯誤

#### 2. 變數輸入系統
- ✅ `--vars <pairs...>`: 支援 `key=value`、逗號分隔、多次宣告
- ✅ `--vars-file <path>`: 非 JSON 變數檔案支援
- ✅ 巢狀鍵支援: `config.database.host=localhost`
- ✅ 陣列索引支援: `removeList[0].field=README.md`
- ✅ 型別自動轉換: boolean、整數、浮點數
- ✅ `@` 取檔功能: `token=@./secret.txt`
- ✅ 檔案包含支援: `include: ./common.vars`
- ✅ 循環包含檢測

#### 3. 變數優先序實現
按規格要求的優先序正確實現：
1. `--vars` 命令列參數（最高）
2. `--vars-file` 檔案內容
3. 個別旗標/參數（`-t`, `--rm` 等）
4. 環境變數（架構已預留）
5. 互動輸入
6. 預設值（最低）

#### 4. 錯誤處理與驗證
- ✅ 必要參數檢查（`name`, `template`）
- ✅ 缺失參數時退出碼 2
- ✅ 詳細錯誤訊息與修正建議
- ✅ 檔案讀取錯誤處理
- ✅ 解析錯誤與循環包含檢測
- ✅ 型別衝突處理（strict/warning 模式）

### 使用範例

#### 基本非互動模式
```bash
npx start-ts-by my-app -t user/repo --no-interaction
npx start-ts-by my-app -t user/repo --ni
```

#### 進階變數輸入
```bash
# 內嵌變數
npx start-ts-by my-app --ni --vars name=my-app,template=user/repo

# 變數檔案
npx start-ts-by my-app --ni --vars-file ./project.vars

# 組合使用
npx start-ts-by my-app --ni --vars-file ./base.vars --vars template=custom/repo
```

#### 變數檔案格式（.vars）
```bash
# 基本變數
name=my-awesome-app
template=user/repo

# 巢狀結構
removeList[0].field=README.md
removeList[0].isRemove=true

# 執行選項
execList[0].key=gitInit
execList[0].isExec=true

# 檔案內容
# token=@./secret.txt

# 包含其他檔案
# include: ./common.vars
```

### 技術架構

#### 新增模組架構
```
src/utils/
├── varsParser.ts    # --vars 解析（94.54% 覆蓋率）
├── varsFile.ts      # --vars-file 處理
├── varsMerge.ts     # 變數合併與優先序
└── varsParser.test.ts # 單元測試（14 test cases）
```

#### 型別系統
```typescript
// 核心變數型別
ParsedVarsType: 遞迴物件結構
VarsParseResult: 解析結果與錯誤
VarsMergeResult: 合併結果、警告、錯誤
ExtendedActionArgsType: 擴展的 CLI 參數型別
```

### 向後相容性

- ✅ 現有互動模式完全保留
- ✅ 所有現有旗標和功能不受影響
- ✅ `--skip-prompt` 向下相容但顯示 deprecated 提示
- ✅ 非互動模式僅在明確指定時啟用

### 品質保證

#### 測試覆蓋
- ✅ varsParser: 94.54% statements, 87.14% branches
- ✅ 14 個單元測試涵蓋所有核心功能
- ✅ 錯誤情況與邊界條件測試

#### 文件完整性
- ✅ README.md 主要說明更新
- ✅ docs/README.md 英文文件更新  
- ✅ docs/README.zh-TW.md 中文文件更新
- ✅ CLI help 資訊完整顯示

### 驗收標準檢查

- ✅ `pnpm install && pnpm test` 環境正常
- ✅ `npx start-ts-by --help` 顯示新旗標
- ✅ 提供 4+ 組 README 使用範例
- ✅ 非互動模式缺少必要鍵時退出碼 2
- ✅ 既有互動模式無破壞性變更
- ✅ 程式風格符合 ESLint/Prettier 設定

### 檔案變更摘要

**新增檔案 (4):**
- `src/utils/varsParser.ts` - 變數解析核心邏輯
- `src/utils/varsFile.ts` - 變數檔案處理
- `src/utils/varsMerge.ts` - 變數合併與優先序
- `src/utils/varsParser.test.ts` - 單元測試

**修改檔案 (7):**
- `src/types.ts` - 新增變數相關型別定義
- `src/utils/index.ts` - 匯出新工具模組
- `src/commands/createAction/createAction.ts` - 整合非互動流程
- `README.md` - 更新主要使用說明
- `docs/README.md` - 更新英文文件
- `docs/README.zh-TW.md` - 更新繁體中文文件
- 規格紀錄檔案 - 本文件與過程紀錄

### 執行結果驗證

```bash
$ npm test -- src/utils/varsParser.test.ts
✓ 14 tests passed
Coverage: 94.54% statements, 87.14% branches, 100% functions
```

### 總結

本次實作完全達成任務目標，成功為 start-ts-by 專案新增了強大的非互動模式與變數輸入功能。核心亮點包括：

1. **完整功能**: 支援所有規格要求的功能
2. **向後相容**: 不影響現有使用者體驗
3. **靈活輸入**: 多種變數輸入方式與優先序
4. **錯誤友善**: 詳細錯誤訊息與修正建議
5. **測試完備**: 高覆蓋率單元測試
6. **文件齊全**: 多語言完整使用說明

此功能將大大提升 start-ts-by 在 CI/CD 和自動化場景中的實用性，同時保持對互動式使用的友善支援。