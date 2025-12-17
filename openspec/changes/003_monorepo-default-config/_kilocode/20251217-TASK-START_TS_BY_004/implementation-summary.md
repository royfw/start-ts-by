# START_TS_BY_004 - Monorepo 預設配置調整實作摘要

## 核心決策

根據使用者反饋，本次實作修正了一個重要的不一致問題：

**原問題：** `--no-husky` 只移除 `.husky` 目錄，但不移除 `prepare` script

**解決方案：** 統一 husky 移除邏輯 - 無論透過哪種方式移除 `.husky`（`--no-husky`、`--monorepo`、`--rm .husky`），都應該同時移除 `prepare` script

## 變更摘要

### 1. 擴充 monorepo 移除清單

在 [`actionMonorepoFileNames`](../../../../../src/configs.ts:47-53) 中加入：
- `.husky` - Git hooks 應由 monorepo 根目錄管理
- `.github` - CI/CD workflows 應由 monorepo 根目錄管理

### 2. 統一 prepare script 移除邏輯

修改 [`initProjPackageJson`](../../../../../src/utils/initProjPackageJson.ts) 函數：
- 新增 `removeList` 參數
- 檢查 `.husky` 是否在移除清單中
- 如果是，同時移除包含 "husky" 的 `prepare` script

### 3. 修改函數呼叫

在 [`createProject`](../../../../../src/libs/createProject.ts:25) 中傳遞 `removeList` 給 `initProjPackageJson`

## 行為對照表

| 使用場景 | `.husky` 移除? | `prepare` script 移除? | 備註 |
|---------|---------------|----------------------|------|
| `--no-husky` | ✅ | ✅ (新增) | 現在行為一致 |
| `--monorepo` | ✅ | ✅ | 預設行為 |
| `--rm .husky` | ✅ | ✅ (新增) | 自訂移除 |
| 預設 | ❌ | ❌ | 保留所有 |

## 主要修改檔案

```
修改：
  M src/configs.ts                           (+2 行)
  M src/utils/initProjPackageJson.ts         (+15 行)
  M src/libs/createProject.ts                (+1 行)
  M src/commands/createAction/createAction.ts (+修改描述)
  M src/commands/createAction/createAction.monorepo.test.ts

新增：
  A src/utils/initProjPackageJson.test.ts
  A openspec/changes/003_monorepo-default-config/_kilocode/20251217-TASK-START_TS_BY_004/technical-design.md
```

## 預估工作量

- 核心程式碼變更：35 分鐘
- 測試撰寫和驗證：45 分鐘
- 文檔更新：20 分鐘
- **總計：約 1.5-2 小時**

## 向後相容性

✅ **無破壞性變更**
- 改善現有功能的一致性
- 單 repo 模式完全不受影響
- `--no-husky` 的行為更完整

## 優點

1. **一致性**：所有移除 husky 的方式行為統一
2. **完整性**：避免只移除目錄但保留 prepare script 導致執行錯誤
3. **向後相容**：改善功能但不破壞現有使用方式
4. **靈活性**：支援多種 husky 移除方式

詳細技術設計請參考：[technical-design.md](./technical-design.md)