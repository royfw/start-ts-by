## [2025-09-12][START_TS_BY_001-1][gpt-5][Architect] 分析與設計 - `--no-interaction` 與非 JSON 輸入方案

### 一、現有架構分析

#### 1.1 CLI 入口點分析

**主要入口 ([`src/index.ts`](../../../src/index.ts))**
- 使用 `commander.js` 作為 CLI 框架
- 透過 [`setProgramCommand`](../../../src/utils/setProgramCommand.ts) 設定指令
- 目前支援 `create [name]` 指令作為主要入口點

**指令結構**
- 預設指令：`create [name]`
- 當前旗標：
  - `-t, --template <repo>`：模板來源
  - `--skip-prompt`：跳過互動提示
  - `--rm <files...>`：移除檔案清單
  - `--no-husky`：移除 .husky
  - `--github`：保留 .github/workflows
  - `--git-init`：執行 git init
  - `--npm-install`：執行 npm install

#### 1.2 互動式流程分析

**核心互動流程 ([`createAction.ts`](../../../src/commands/createAction/createAction.ts))**

```typescript
async function createAction(name?: string, actionArgs?: ActionArgsType) {
  // 1. 專案名稱確認
  const projectName = await runActionPromptName(name);
  
  // 2. 模板選擇
  const template = await runActionPromptArgTemplateFlag(actionArgs.template);
  
  // 3. CLI 旗標確認 (若未啟用 skipPrompt)
  if (!skipPrompt) {
    await runActionPromptCheckArgs(actionArgs, actionPromptCheckArgs);
  }
  
  // 4. 移除檔案處理
  const paramArgsRmList = getArgsRmList(actionArgs, rmFileNames, dotFileNames);
  const promptRmFlagRmList = skipPrompt ? [] : await runActionPromptArgRmFlag(actionArgs);
  const promptInputsRmList = skipPrompt ? [] : await runActionPromptWhileInputsAddRmList(...);
  
  // 5. 執行命令處理
  const paramArgsExecList = getExecList(actionArgs, actionExecList);
  
  // 6. 建立專案
  await createProject(params);
}
```

**詳細互動模組分析**

1. **專案名稱輸入** ([`runActionPromptName.ts`](../../../src/commands/createAction/runActionPromptName.ts))
   - 若未提供 `name` 參數，透過 `inquirer.prompt` 要求輸入
   - 預設值：`'my-app'`
   - 透過 [`getTargetDir`](../../../src/utils/getTargetDir.ts) 驗證目標路徑

2. **模板選擇** ([`runActionPromptArgTemplateFlag.ts`](../../../src/commands/createAction/runActionPromptArgTemplateFlag.ts))
   - 若未提供 `--template`，先詢問手動輸入
   - 若仍未輸入，從 [`templates.json`](../../../templates.json) 提供選單選擇
   - 支援格式：`user/repo`、`user/repo#branch`、`user/repo#branch/subdir` 等

3. **CLI 旗標確認** ([`runActionPromptCheckArgs.ts`](../../../src/commands/createAction/runActionPromptCheckArgs.ts))
   - 檢查預定義的旗標設定：`husky`、`github`、`gitInit`、`npmInstall`
   - 透過 [`promptArgBoolean`](../../../src/utils/promptArgBoolean.ts) 進行確認/修改

4. **移除檔案處理**
   - [`getArgsRmList.ts`](../../../src/commands/createAction/getArgsRmList.ts)：處理內建旗標 (如 `--no-husky`)
   - [`runActionPromptArgRmFlag.ts`](../../../src/commands/createAction/runActionPromptArgRmFlag.ts)：確認 `--rm` 旗標指定的檔案
   - [`runActionPromptWhileInputsAddRmList.ts`](../../../src/commands/createAction/runActionPromptWhileInputsAddRmList.ts)：互動式新增移除檔案清單

5. **執行命令處理** ([`getExecList.ts`](../../../src/commands/createAction/getExecList.ts))
   - 根據旗標決定是否執行 `git init` 和 `npm install`

#### 1.3 型別定義分析

**關鍵資料結構 ([`src/types.ts`](../../../src/types.ts))**

```typescript
export type ActionArgsType = {
  [key: string]: string | string[] | boolean | undefined;
};

export type RemoveFileInfoType = {
  field: string;
  isRemove: boolean;
};

export type RnuExecInfoType = {
  key: string;
  command: string;
  isExec: boolean;
};

export type CreateProjectParams = {
  name: string;
  template: string;
  removeList: RemoveFileInfoType[];
  execList: RnuExecInfoType[];
};

export type PromptCheckArgsType = {
  key: string;
  message: string;
};
```

#### 1.4 現有限制與問題點

1. **互動必要性**：缺少名稱或模板時必須進入互動模式
2. **`--skip-prompt` 局限**：只能跳過確認步驟，無法完全非互動
3. **參數傳遞複雜**：複雜的 `removeList` 和 `execList` 無法透過 CLI 參數直接設定
4. **缺乏批次設定**：無法透過設定檔案批次處理多個專案
5. **錯誤處理不足**：缺少必要參數時沒有明確錯誤訊息

### 二、設計需求分析

#### 2.1 使用情境分析

1. **CI/CD 管道**：需要完全非互動的專案建立
2. **批次處理**：一次建立多個相似專案
3. **腳本自動化**：在 shell script 中調用
4. **模板開發**：快速測試不同參數組合
5. **文件範例**：提供可重現的指令範例

#### 2.2 相容性要求

1. **向後相容**：現有互動流程必須保持不變
2. **漸進增強**：新功能不應影響現有使用者
3. **CLI 慣例**：符合常見 CLI 工具的使用模式
4. **跨平台**：支援不同作業系統的 shell 環境

### 三、技術考量

#### 3.1 依賴項分析

**現有依賴 ([`package.json`](../../../package.json))**
- `commander@^13.1.0`：CLI 框架，支援複雜旗標定義
- `inquirer@^12.5.0`：互動式輸入，需要在非互動模式下跳過

#### 3.2 解析器設計考量

1. **參數語法**：需要支援巢狀物件和陣列
2. **型別轉換**：自動辨識布林值、數字、字串
3. **檔案引用**：支援從外部檔案讀取設定
4. **合併策略**：多種參數來源的優先序處理
5. **錯誤處理**：清楚的錯誤訊息和建議修正方式

### 四、架構分析結論

現有架構具有良好的模組化設計，主要的互動邏輯都封裝在獨立的函式中，這為實現非互動模式提供了良好的基礎。需要的主要改動包括：

1. **條件分支**：在各個互動函式中加入非互動模式的條件判斷
2. **參數解析**：新增 `--vars` 和 `--vars-file` 的解析邏輯
3. **錯誤處理**：完善缺少必要參數時的錯誤訊息
4. **向後相容**：保持 `--skip-prompt` 的功能，建議使用者升級到 `--no-interaction`

整體來說，現有架構的設計讓這次的功能擴展可以較為平順地進行，不需要大規模重構。