# 驗證 CLI help 與 README/docs 一致性 - 結論報告

## 執行摘要

已成功完成 CLI `--help` 輸出與文件內容的一致性驗證與修正。透過系統化的比對分析，識別並修正了 2 項主要差異，確保 CLI 工具的實際輸出與文件描述完全一致。

## 差異比對摘要

### 原始發現的差異：

1. **主命令描述不一致**
   - **實際 CLI 輸出**：`Start TypeScript project by git repo templates`
   - **文件描述**：`Start TypeScript project by git repo or local folder templates`
   - **根本原因**：package.json 中的 description 缺少 "or local folder" 部分

2. **--vars 選項描述不完整**
   - **實際 CLI 輸出**：`Variables in key=value format, supports nested keys and arrays (can be used multiple times)`
   - **文件描述**：缺少 "supports nested keys and arrays" 功能說明

### 其他驗證項目：
✅ `--no-interaction`/`--ni` - 一致性良好  
✅ `--yes`/`-y` - 一致性良好  
✅ `--vars-file` - 一致性良好  
✅ `--strict` - 一致性良好  
✅ `--skip-prompt` - 一致性良好（包含 deprecated 警告）  
✅ `--rm`、`--github`、`--git-init`、`--npm-install` - 一致性良好

## 修正項目清單

### 1. package.json
```diff
- "description": "Start TypeScript project by git repo templates",
+ "description": "Start TypeScript project by git repo or local folder templates",
```

### 2. README.md
```diff
- --vars <pairs...>                 Variables in key=value format (can be used multiple times)
+ --vars <pairs...>                 Variables in key=value format, supports nested keys and arrays (can be used multiple times)
```

### 3. docs/README.zh-TW.md
```diff
- --vars <pairs...>                 key=value 格式的變數（可重複使用）
+ --vars <pairs...>                 key=value 格式的變數，支援巢狀鍵和陣列（可重複使用）
```

## 技術驗證

### 本地資料夾支援確認
透過程式碼分析確認專案確實支援本地資料夾模板：

1. **`parseTemplateSource.ts`**：完整支援多種本地路徑格式
   - `./path`、`../path`、`/absolute/path`
   - `file:./path` 格式
   - Windows 路徑格式
   - 子目錄選擇功能

2. **`templateToLocal.ts`**：實作本地資料夾複製邏輯
   - 使用 `cpSync` 進行資料夾複製
   - 支援子目錄選擇

## 最終一致性結論

### 修正後 CLI help 核對結果：

#### 主命令輸出：
```
Usage: start-ts-by [options] [command]

Start TypeScript project by git repo or local folder templates ✅ 已修正

Options:
  -V, --version            output the version number
  -h, --help               display help for command

Commands:
  create [options] [name]  Create a new project from a git template (Default)
  help [command]           display help for command
```

#### create 子命令關鍵輸出：
```
--vars <pairs...>       Variables in key=value format, supports nested keys
                        and arrays (can be used multiple times) (default: []) ✅ 已修正
```

### 完整一致性驗證：

| 項目 | CLI 輸出 | 文件描述 | 狀態 |
|------|----------|----------|------|
| 主命令描述 | ✅ | ✅ | 一致 |
| --no-interaction/--ni | ✅ | ✅ | 一致 |
| --yes/-y | ✅ | ✅ | 一致 |
| --vars | ✅ | ✅ | 一致 |
| --vars-file | ✅ | ✅ | 一致 |
| --strict | ✅ | ✅ | 一致 |
| --skip-prompt | ✅ | ✅ | 一致 |
| 其他選項 | ✅ | ✅ | 一致 |

## 結論

**✅ 一致性驗證完成**：CLI `--help` 輸出與 README.md、docs/README.zh-TW.md 文件內容已達到完全一致。

**修正成效**：
- 解決了主命令描述的功能完整性問題
- 補充了 `--vars` 選項的進階功能說明
- 確保用戶能準確理解所有 CLI 選項的功能

**品質保證**：
- 所有修正均基於實際程式碼功能驗證
- 中英文文件同步更新
- 遵循「文件為主」的對齊原則

此驗證確保了 CLI 工具的文件準確性與用戶體驗一致性。