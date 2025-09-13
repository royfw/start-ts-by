## [2025-09-12][START_TS_BY_001-1][gpt-5][Architect] 分析與設計 - `--no-interaction` 與非 JSON 輸入方案

### 一、功能規格設計

#### 1.1 新增 CLI 旗標定義

**主要旗標**

1. **`--no-interaction` / `--ni`**
   - **描述**：啟用完全非互動模式
   - **行為**：跳過所有 `inquirer.prompt` 調用
   - **相容性**：與現有 `--skip-prompt` 功能重疊，但語意更明確

2. **`--yes` / `-y`**
   - **描述**：自動採用所有預設值，跳過確認步驟
   - **行為**：當需要使用者確認時自動選擇預設選項
   - **搭配**：通常與 `--no-interaction` 一起使用

3. **`--vars <values>`**
   - **描述**：以非 JSON 格式提供變數設定
   - **支援格式**：
     - 單一鍵值對：`--vars name=my-app`
     - 多重鍵值對：`--vars name=my-app,template=user/repo`
     - 重複使用：`--vars name=my-app --vars template=user/repo`
     - 巢狀物件：`--vars project.name=my-app --vars project.version=1.0.0`
     - 陣列索引：`--vars removeList[0].field=README.md --vars removeList[0].isRemove=true`

4. **`--vars-file <path>`**
   - **描述**：從檔案讀取變數設定
   - **格式**：類 dotenv 的 `KEY=VALUE` 格式
   - **功能**：支援註解、巢狀鍵、檔案包含

#### 1.2 CLI 使用範例

**基本非互動使用**
```bash
# 最簡單的非互動模式
npx start-ts-by my-app -t royfuwei/starter-ts-app --no-interaction

# 使用別名
npx start-ts-by my-app -t royfuwei/starter-ts-app --ni

# 搭配自動確認
npx start-ts-by my-app -t royfuwei/starter-ts-app --ni --yes
```

**進階變數設定**
```bash
# 使用 --vars 設定基本參數
npx start-ts-by my-app -t user/repo --ni --vars name=my-app,template=user/repo

# 設定移除檔案清單
npx start-ts-by my-app -t user/repo --ni \
  --vars "removeList[0].field=README.md,removeList[0].isRemove=true" \
  --vars "removeList[1].field=.github,removeList[1].isRemove=false"

# 設定執行清單
npx start-ts-by my-app -t user/repo --ni \
  --vars "execList[0].key=gitInit,execList[0].isExec=true" \
  --vars "execList[1].key=npmInstall,execList[1].isExec=false"

# 使用檔案設定
npx start-ts-by my-app -t user/repo --ni --vars-file ./.stb.vars

# 混合使用（CLI 優先）
npx start-ts-by my-app -t user/repo --ni --vars-file ./.stb.vars --vars name=override-name
```

**模板來源語法範例**
```bash
# GitHub 標準格式
npx start-ts-by my-app --ni -t user/repo
npx start-ts-by my-app --ni -t user/repo#branch
npx start-ts-by my-app --ni -t user/repo#branch/subdir

# 自訂 Git 來源
npx start-ts-by my-app --ni -t git@gitlab.com:group/repo.git#dev/templates

# 本地資料夾
npx start-ts-by my-app --ni -t ./my-template
npx start-ts-by my-app --ni -t ./templates/basic-app
```

### 二、變數語法設計

#### 2.1 `--vars` 參數語法

**基本語法規則**
```bash
--vars key=value
--vars key1=value1,key2=value2
--vars "complex key=value with spaces"
```

**巢狀物件語法**
```bash
--vars project.name=my-app
--vars project.config.debug=true
--vars settings.database.host=localhost
```

**陣列索引語法**
```bash
--vars removeList[0].field=README.md
--vars removeList[0].isRemove=true
--vars removeList[1].field=.husky
--vars removeList[1].isRemove=false
```

**型別自動轉換**
- **布林值**：`true`、`false`、`yes`、`no`、`1`、`0`
- **數字**：自動辨識整數和浮點數
- **字串**：預設型別，支援引號包圍

**檔案內容引用**
```bash
--vars token=@./secrets/api-token.txt
--vars config=@./config.json
```

#### 2.2 `--vars-file` 檔案格式

**基本 .stb.vars 檔案格式**
```ini
# 專案基本設定
name=my-awesome-app
template=royfuwei/starter-ts-app

# 移除檔案設定
removeList[0].field=README.md
removeList[0].isRemove=true
removeList[1].field=.github
removeList[1].isRemove=false

# 執行命令設定
execList[0].key=gitInit
execList[0].isExec=true
execList[1].key=npmInstall
execList[1].isExec=true

# 巢狀設定
project.version=1.0.0
project.description=My awesome TypeScript project
```

**進階檔案功能**
```ini
# 支援註解
# 這是註解行

# 支援包含其他檔案
include=./base-config.vars
include=./environment/dev.vars

# 支援多行值（使用反斜槓續行）
description=This is a long description \
that spans multiple lines

# 支援引用檔案內容
api_key=@./secrets/api.key
certificate=@./certs/ssl.pem
```

### 三、參數解析與優先序

#### 3.1 參數來源優先序

**優先序排列（高到低）**
1. **CLI `--vars` 參數**：最高優先權
2. **`--vars-file` 檔案**：中等優先權
3. **CLI 個別旗標**：如 `--template`、`--rm` 等
4. **環境變數**：系統環境變數
5. **互動輸入**：僅在非 `--no-interaction` 模式下
6. **預設值**：最低優先權

#### 3.2 參數合併策略

**物件合併**
- 深度合併巢狀物件
- 相同鍵值以高優先序覆蓋低優先序

**陣列合併**
- 完全替換，不進行元素級別合併
- 提供 `--vars-merge-arrays` 旗標控制合併行為（可選功能）

**衝突處理**
- 預設：警告並使用高優先序值
- 嚴格模式 `--strict`：將警告升級為錯誤

#### 3.3 變數映射表

**核心參數映射**
```typescript
interface NonInteractiveConfig {
  // 基本參數
  name: string;                    // 專案名稱
  template: string;                // 模板來源
  
  // 移除檔案清單
  removeList: {
    field: string;                 // 檔案/資料夾名稱
    isRemove: boolean;             // 是否移除
  }[];
  
  // 執行命令清單
  execList: {
    key: string;                   // 命令鍵值（gitInit, npmInstall）
    command: string;               // 實際命令
    isExec: boolean;               // 是否執行
  }[];
  
  // 檢查參數（對應互動確認）
  checkArgs: {
    husky: boolean;                // 保留 husky
    github: boolean;               // 保留 GitHub Actions
    gitInit: boolean;              // 執行 git init
    npmInstall: boolean;           // 執行 npm install
  };
}
```

### 四、錯誤處理設計

#### 4.1 必要參數檢查

**缺少必要參數錯誤**
```bash
❌ Error: Missing required parameters for non-interactive mode
Required: name, template
Provided: name
Missing: template

Suggestions:
  npx start-ts-by my-app -t royfuwei/starter-ts-app --no-interaction
  npx start-ts-by my-app --vars template=royfuwei/starter-ts-app --no-interaction
```

**型別錯誤**
```bash
❌ Error: Invalid parameter type
Parameter: removeList[0].isRemove
Expected: boolean
Received: "maybe"
Valid values: true, false, yes, no, 1, 0
```

#### 4.2 檔案相關錯誤

**設定檔案不存在**
```bash
❌ Error: Configuration file not found
File: ./.stb.vars
Current directory: /path/to/project

Suggestion: Create a .stb.vars file or use --vars instead
```

**引用檔案錯誤**
```bash
❌ Error: Referenced file not found
Reference: @./secrets/api-token.txt
Parameter: token

Suggestion: Ensure the file exists and is readable
```

#### 4.3 退出碼設計

- **0**: 成功執行
- **1**: 一般錯誤（缺少必要參數、型別錯誤等）
- **2**: 檔案系統錯誤（無法讀取設定檔、模板下載失敗等）
- **3**: 網路錯誤（無法存取 Git 倉庫等）
- **130**: 使用者中斷（Ctrl+C）

### 五、相容性設計

#### 5.1 向後相容策略

**保留現有旗標**
- `--skip-prompt` 繼續支援，但標示為 deprecated
- 行為保持不變，避免破壞現有腳本

**漸進升級提示**
```bash
⚠️  Warning: --skip-prompt is deprecated, use --no-interaction instead
   This flag will be removed in v1.0.0
   Migration: Replace --skip-prompt with --no-interaction --yes
```

#### 5.2 功能對應表

| 舊功能 | 新功能 | 說明 |
|--------|--------|------|
| `--skip-prompt` | `--no-interaction --yes` | 完全等價 |
| 無 | `--no-interaction` | 僅跳過互動，保留確認 |
| 無 | `--vars` | 新增變數設定 |
| 無 | `--vars-file` | 新增檔案設定 |

### 六、文檔更新計畫

#### 6.1 README.md 更新內容

**新增章節**
```markdown
### Non-Interactive Mode

For CI/CD pipelines and automated scripts:

```bash
# Basic non-interactive usage
npx start-ts-by my-app -t user/repo --no-interaction

# With custom variables
npx start-ts-by my-app -t user/repo --ni --vars name=my-app,gitInit=true

# Using configuration file
npx start-ts-by my-app -t user/repo --ni --vars-file ./.stb.vars
```

#### Variables Configuration

**Command Line Variables**
- `--vars key=value` - Set individual variables
- `--vars key1=value1,key2=value2` - Set multiple variables
- Nested: `--vars project.name=my-app`
- Arrays: `--vars removeList[0].field=README.md`

**Configuration File**
Create a `.stb.vars` file:
```ini
name=my-app
template=user/repo
removeList[0].field=README.md
removeList[0].isRemove=true
```
```

#### 6.2 CLI Help 更新

```bash
Usage: start-ts-by [options] [command]

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

Commands:
  create [options] [name]    Create new project from template (Default)

Create Command Options:
  -t, --template <repo>      Template source (required in non-interactive mode)
  --no-interaction, --ni     Run without interactive prompts
  -y, --yes                  Automatically confirm all prompts
  --vars <values>            Set variables (key=value,key2=value2)
  --vars-file <path>         Load variables from file (.stb.vars format)
  --skip-prompt              [DEPRECATED] Use --no-interaction --yes instead
  --rm <files...>            Remove files/folders after project creation
  --no-husky                 Remove .husky folder
  --github                   Keep .github/workflows
  --git-init                 Run git init after creation
  --npm-install              Run npm install after creation
  --strict                   Treat warnings as errors
```

### 七、實作計畫

#### 7.1 檔案修改清單

**核心檔案修改**

1. **[`src/types.ts`](../../../src/types.ts)**
   - 新增 `NonInteractiveConfig` 介面
   - 新增 `VarsParseResult` 型別
   - 擴展 `ActionArgsType` 包含新旗標

2. **[`src/commands/createAction/createAction.ts`](../../../src/commands/createAction/createAction.ts)**
   - 新增 `noInteraction` 參數檢查邏輯
   - 整合變數解析結果到現有流程
   - 修改條件判斷，支援非互動模式

3. **互動函式修改**
   - [`runActionPromptName.ts`](../../../src/commands/createAction/runActionPromptName.ts)：新增非互動模式分支
   - [`runActionPromptArgTemplateFlag.ts`](../../../src/commands/createAction/runActionPromptArgTemplateFlag.ts)：同上
   - [`runActionPromptCheckArgs.ts`](../../../src/commands/createAction/runActionPromptCheckArgs.ts)：同上
   - [`runActionPromptArgRmFlag.ts`](../../../src/commands/createAction/runActionPromptArgRmFlag.ts)：同上
   - [`runActionPromptWhileInputsAddRmList.ts`](../../../src/commands/createAction/runActionPromptWhileInputsAddRmList.ts)：同上

**新增檔案清單**

4. **`src/utils/parseVarsArgument.ts`**
   - 解析 `--vars` 參數字串
   - 支援巢狀鍵與陣列索引
   - 型別自動轉換邏輯

5. **`src/utils/parseVarsFile.ts`**
   - 讀取並解析 `.stb.vars` 檔案
   - 支援註解、包含檔案、檔案引用
   - 錯誤處理與驗證

6. **`src/utils/mergeConfigSources.ts`**
   - 實現參數來源優先序合併
   - 深度物件合併邏輯
   - 衝突檢測與警告

7. **`src/utils/validateNonInteractiveConfig.ts`**
   - 驗證非互動模式必要參數
   - 型別檢查與錯誤訊息生成
   - 提供修正建議

**CLI 設定更新**

8. **[`src/commands/createAction/createAction.ts`](../../../src/commands/createAction/createAction.ts) - flagsOptions**
   ```typescript
   flagsOptions: [
     // ... 現有旗標
     {
       flags: '--no-interaction, --ni',
       description: 'Run without interactive prompts',
       defaultValue: false,
     },
     {
       flags: '-y, --yes',
       description: 'Automatically confirm all prompts',
       defaultValue: false,
     },
     {
       flags: '--vars <values>',
       description: 'Set variables (key=value,key2=value2)',
     },
     {
       flags: '--vars-file <path>',
       description: 'Load variables from file',
     },
     {
       flags: '--strict',
       description: 'Treat warnings as errors',
       defaultValue: false,
     },
   ]
   ```

#### 7.2 實作流程建議

**階段一：基礎非互動功能**
1. 實作基本的 `--no-interaction` 旗標
2. 修改現有互動函式支援跳過邏輯
3. 確保必要參數檢查機制

**階段二：變數解析功能**
1. 實作 `--vars` 參數解析
2. 實作 `--vars-file` 檔案讀取
3. 實作參數合併與優先序邏輯

**階段三：錯誤處理與使用者體驗**
1. 完善錯誤訊息與退出碼
2. 新增警告與建議機制
3. 實作 `--strict` 模式

**階段四：測試與文檔**
1. 新增單元測試覆蓋所有新功能
2. 新增 e2e 測試驗證完整流程
3. 更新文檔與 CLI help

#### 7.3 測試案例設計

**單元測試案例**

1. **`parseVarsArgument.test.ts`**
   - 基本鍵值對解析
   - 巢狀物件語法
   - 陣列索引語法
   - 型別轉換邏輯
   - 錯誤輸入處理

2. **`parseVarsFile.test.ts`**
   - 基本檔案讀取
   - 註解與空白行處理
   - 檔案包含功能
   - 檔案引用功能
   - 檔案不存在錯誤

3. **`mergeConfigSources.test.ts`**
   - 參數優先序驗證
   - 深度物件合併
   - 陣列替換邏輯
   - 衝突檢測機制

**E2E 測試案例**

1. **基本非互動模式**
   ```bash
   npm test -- --testNamePattern="non-interactive basic usage"
   ```

2. **變數設定測試**
   ```bash
   npm test -- --testNamePattern="vars parameter parsing"
   ```

3. **檔案設定測試**
   ```bash
   npm test -- --testNamePattern="vars-file configuration"
   ```

4. **錯誤處理測試**
   ```bash
   npm test -- --testNamePattern="error handling and validation"
   ```

### 八、總結

此設計方案提供了完整的非互動模式功能，同時保持與現有架構的相容性。主要特色包括：

1. **完整的非互動支援**：透過 `--no-interaction` 和相關旗標
2. **彈性的變數設定**：支援 CLI 參數和檔案兩種方式
3. **清晰的優先序規則**：避免設定衝突與混淆
4. **完善的錯誤處理**：提供清楚的錯誤訊息和修正建議
5. **向後相容性**：不破壞現有使用方式
6. **可擴展架構**：為未來功能擴展奠定基礎

這個設計可以滿足各種自動化需求，從簡單的 CI/CD 專案建立到複雜的批次處理任務，同時保持良好的使用者體驗和開發者友善的 API。