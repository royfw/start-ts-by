# 新增 varsFile與varsMerge 單元測試與覆蓋驗證-過程

## 子任務標題
[2025-09-13][START_TS_BY_001-3][gpt-5][Code] 分析專案、增加支援 `--no-interaction` - 新增 varsFile/varsMerge 單元測試與覆蓋驗證

## 背景
為了完成 `--no-interaction` 功能的開發，需要為核心的變數處理模組 `varsFile.ts` 和 `varsMerge.ts` 建立完整的單元測試，確保變數解析、檔案處理和合併邏輯的穩定性與正確性。

## 實作範圍
1. 建立 `src/utils/varsFile.test.ts` - 測試檔案變數解析功能
2. 建立 `src/utils/varsMerge.test.ts` - 測試變數合併邏輯
3. 執行測試並驗證覆蓋率 > 80%
4. 修復發現的實作缺陷

## 詳細執行步驟

### 步驟1：建立 varsFile.test.ts 測試檔案
創建了全面的測試覆蓋以下情境：

#### 基本功能測試
- dotenv 風格解析：註解、空行、基本 `key=value`
- 巢狀鍵與陣列索引：如 `a.b.c=1`、`list[0].name=foo`

#### @file 值擷取功能
- 絕對路徑檔案讀取
- 相對路徑檔案讀取
- 不存在檔案的錯誤處理

#### include: 指令測試
- 單層包含檔案
- 多層鏈式包含
- 循環包含偵測 (A -> B -> A)
- 自我循環偵測

#### 錯誤處理測試
- 無效行格式（缺 `=`）
- 無效陣列索引（如 `list[abc]`）
- 未關閉 `]`
- 空的 include 路徑
- 不存在的檔案

#### 模式測試
- strict 模式與重複鍵處理
- non-strict 模式行為

#### 輔助功能測試
- `validateVarsFile` 檔案驗證與建議
- `createExampleVarsFile` 範例內容生成

### 步驟2：建立 varsMerge.test.ts 測試檔案
創建了變數合併邏輯的完整測試：

#### 基本合併功能
- 優先序正確性驗證
- 深度物件合併
- 陣列索引對齊合併

#### 型別衝突處理
- non-strict 模式：警告並使用新值
- strict 模式：錯誤並保持原值

#### 重複鍵處理
- non-strict 模式：警告並覆蓋
- strict 模式：錯誤處理

#### extractVarsFromActionArgs 功能
- 從 CLI 參數提取變數
- 優先序驗證：`--vars` > `--vars-file` > 個別旗標 > 預設值
- `removeList`、`execList`、`checkArgs` 的提取
- 錯誤處理與驗證

#### validateRequiredVars 功能
- 必要參數驗證
- 巢狀鍵存在性檢查
- 缺失參數回報

#### 邊界條件測試
- 空陣列處理
- null/undefined 值處理
- 不可變性驗證

### 步驟3：執行測試與覆蓋率驗證
初次執行遇到多個失敗測試，主要問題包括：

#### 型別系統問題
`ParsedVarsType` 不允許 `null`、`undefined` 或純字串陣列，需要調整測試案例以符合型別定義。

#### 合併邏輯理解錯誤
原本誤解 `mergeVars` 的優先序處理邏輯，實際實作中：
- sources 陣列第一個元素（索引0）有較高優先序
- 從後往前迭代進行合併

#### @file 相對路徑問題
發現 `varsParser.ts` 中的 `@file` 處理未考慮相對路徑上下文，導致相對路徑解析失敗。

### 步驟4：缺陷修復
針對 @file 相對路徑問題進行修復：

#### 問題分析
`varsParser.ts` 第71行直接使用 `readFileSync(filePath)`，對於相對路徑如 `@./token.txt`，會相對於當前工作目錄而非 vars 檔案目錄解析。

#### 修復方案
在 `varsFile.ts` 中預處理 vars 陣列，將 `@file` 的相對路徑轉換為基於 vars 檔案目錄的絕對路徑：

```typescript
// 預處理 @file 路徑，將相對路徑轉換為絕對路徑
const processedVarsArray = varsArray.map(varLine => {
  const equalIndex = varLine.indexOf('=');
  if (equalIndex === -1) return varLine;
  
  const key = varLine.substring(0, equalIndex).trim();
  let value = varLine.substring(equalIndex + 1);
  
  // 處理 @file 相對路徑
  if (value.startsWith('@') && !value.startsWith('@/')) {
    const filePath = value.substring(1);
    if (!filePath.startsWith('/')) {
      // 相對路徑，轉換為基於當前 vars 檔案目錄的絕對路徑
      const absolutePath = resolve(dirname(resolvedPath), filePath);
      value = '@' + absolutePath;
    }
  }
  
  return key + '=' + value;
});
```

### 步驟5：最終測試結果
修復後重新執行測試：

#### 測試通過情況
- **總測試數量**: 49個
- **通過率**: 100% (49/49)
- **失敗數量**: 0

#### 覆蓋率結果
- **varsFile.ts**: 
  - 語句覆蓋率: 97.1%
  - 分支覆蓋率: 90.32%
  - 函數覆蓋率: 100%
  - 行覆蓋率: 98.48%

- **varsMerge.ts**:
  - 語句覆蓋率: 99.18%
  - 分支覆蓋率: 95.06%
  - 函數覆蓋率: 100%
  - 行覆蓋率: 99.12%

#### 未覆蓋程式碼分析
- varsFile.ts 未覆蓋行數: 54 (讀取檔案異常處理)
- varsMerge.ts 未覆蓋行數: 127 (陣列新增元素的邊界情況)

## 重點測試案例摘要

### varsFile 關鍵測試
1. **循環包含偵測**: 確保 A -> B -> A 的循環引用能正確偵測並回報錯誤
2. **相對路徑 @file**: 驗證 `@./token.txt` 能正確解析為相對於 vars 檔案的路徑
3. **多層包含**: 測試 level1 -> level2 -> level3 的深層包含能正確合併變數
4. **錯誤恢復**: 單行錯誤不影響其他行的正常解析

### varsMerge 關鍵測試
1. **優先序驗證**: 確認 flagVars > varsFromFile > defaultVars 的正確順序
2. **深度物件合併**: 巢狀物件的屬性能正確合併而不會覆蓋整個物件
3. **陣列索引對齊**: 陣列元素能按索引正確合併，包含跳過 null 元素的處理
4. **strict 模式行為**: 重複鍵和型別衝突在 strict 模式下正確回報錯誤

## 開發工具與環境
- **測試框架**: Vitest
- **覆蓋率工具**: Istanbul
- **檔案系統**: Node.js fs module
- **臨時目錄**: `fs.mkdtempSync` + `os.tmpdir()`
- **清理機制**: `afterEach` 中使用 `rmSync`

## 遇到的挑戰與解決
1. **型別約束**: TypeScript 嚴格型別檢查要求測試資料符合 `ParsedVarsType` 定義
2. **非同步清理**: 測試間的檔案清理需要適當的錯誤處理
3. **路徑解析**: 相對路徑的上下文處理需要在正確的層級進行
4. **優先序理解**: 需要通過實際執行結果來理解合併邏輯的真實行為

## 效益與價值
- 建立了穩固的測試基礎，覆蓋率均超過 90%
- 發現並修復了 @file 相對路徑處理的缺陷
- 驗證了變數合併邏輯的正確性
- 為後續 `--no-interaction` 功能提供了可靠的基礎模組