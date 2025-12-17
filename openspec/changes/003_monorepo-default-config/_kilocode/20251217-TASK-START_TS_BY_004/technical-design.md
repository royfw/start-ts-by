# START_TS_BY_004 - Monorepo 預設配置調整技術設計文檔

## 重要更新

根據使用者反饋，本設計修正了一個重要問題：

**問題：** 原本 `--no-husky` 只移除 `.husky` 目錄但不移除 `prepare` script，這是不一致的。

**解決方案：** 統一 husky 移除邏輯，無論是透過 `--no-husky`、`--monorepo` 還是任何方式移除 `.husky`，都應該同時移除 `prepare` script。

## 1. 核心設計變更

### 1.1 統一的 Husky 移除邏輯

**原則：** 只要 `.husky` 目錄被移除，就應該移除 `prepare` script（如果包含 husky）

**實作方式：** 修改 [`createProject`](../../../../../src/libs/createProject.ts) 函數，將 `removeList` 傳遞給 [`initProjPackageJson`](../../../../../src/utils/initProjPackageJson.ts)，讓它能判斷 `.husky` 是否在移除清單中。

### 1.2 修改的函數簽名

#### 修改前：
```typescript
// src/utils/initProjPackageJson.ts
export function initProjPackageJson(
  targetDir: string,
  isInit = true,
  isMonorepo = false,  // ← 只能判斷 monorepo 模式
)
```

#### 修改後：
```typescript
// src/utils/initProjPackageJson.ts
export function initProjPackageJson(
  targetDir: string,
  isInit = true,
  isMonorepo = false,
  removeList: RemoveFileInfoType[] = [],  // ← 新增參數
)
```

### 1.3 判斷邏輯

```typescript
export function initProjPackageJson(
  targetDir: string,
  isInit = true,
  isMonorepo = false,
  removeList: RemoveFileInfoType[] = [],
) {
  const filename = 'package.json';
  const packageJsonPath = path.join(targetDir, filename);
  const projectName = path.basename(targetDir);
  const isExists = fs.existsSync(packageJsonPath);
  
  if (isInit && isExists) {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8'),
    ) as PackageJsonType;
    
    const originalName = packageJson.name;
    packageJson.name = projectName;
    packageJson.description = `A project created by ${originalName}`;
    packageJson.version = '0.0.0';

    // 在 monorepo 模式下移除 packageManager 欄位
    if (isMonorepo && packageJson.packageManager) {
      delete packageJson.packageManager;
      console.info(`🔧 Removed packageManager field for monorepo mode`);
    }

    // 檢查 .husky 是否在移除清單中
    const isHuskyRemoved = removeList.some(
      (item) => item.field === '.husky' && item.isRemove === true
    );

    // 如果 .husky 被移除，同時移除 husky 相關的 prepare script
    if (isHuskyRemoved && packageJson.scripts?.prepare) {
      if (packageJson.scripts.prepare.includes('husky')) {
        delete packageJson.scripts.prepare;
        console.info(`🔧 Removed prepare script (husky removed)`);
      }
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.info(`📦 ${filename} initialized`);
  }
}
```

## 2. 實作清單

### 2.1 必要變更（P0）

#### 變更 1: 更新 [`src/configs.ts`](../../../../../src/configs.ts:47-53)

```typescript
export const actionMonorepoFileNames = [
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'package-lock.json',
  'yarn.lock',
  '.npmrc',
  '.husky',      // ← 新增
  '.github',     // ← 新增
];
```

#### 變更 2: 更新 [`src/utils/initProjPackageJson.ts`](../../../../../src/utils/initProjPackageJson.ts)

```typescript
import { RemoveFileInfoType } from '@/types';  // ← 新增 import

export function initProjPackageJson(
  targetDir: string,
  isInit = true,
  isMonorepo = false,
  removeList: RemoveFileInfoType[] = [],  // ← 新增參數
) {
  // ... 現有邏輯 ...

  // 檢查 .husky 是否在移除清單中
  const isHuskyRemoved = removeList.some(
    (item) => item.field === '.husky' && item.isRemove === true
  );

  // 如果 .husky 被移除，同時移除 husky 相關的 prepare script
  if (isHuskyRemoved && packageJson.scripts?.prepare) {
    if (packageJson.scripts.prepare.includes('husky')) {
      delete packageJson.scripts.prepare;
      console.info(`🔧 Removed prepare script (husky removed)`);
    }
  }
  
  // ... 其餘邏輯 ...
}
```

#### 變更 3: 更新 [`src/libs/createProject.ts`](../../../../../src/libs/createProject.ts:25)

```typescript
export async function createProject(params: CreateProjectParams) {
  const { name, template, removeList, execList, isMonorepo } = params;

  const targetDir = getTargetDir(name);

  const parsedTemplate = parseTemplateSource(template);
  templateToLocal(parsedTemplate, targetDir);

  for (const item of removeList) {
    checkExistPathAndRemove(targetDir, item.field, item.isRemove);
  }

  // Initialize package.json (傳遞 removeList)
  initProjPackageJson(targetDir, true, isMonorepo, removeList);  // ← 修改

  // Initialize README.md
  initProjReadMeMd(template, targetDir);

  const runExecCommandList = execList.filter((i) => i.isExec).map((i) => i.command);
  execSyncByList(runExecCommandList, { cwd: targetDir });

  console.log(`✅ Project "${name}" has been created at ${targetDir}`);

  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log('🎉 Start building your project!');
}
```

#### 變更 4: 更新 [`src/commands/createAction/createAction.ts`](../../../../../src/commands/createAction/createAction.ts:363-366) CLI 描述

```typescript
{
  flags: '--monorepo',
  description:
    'Remove monorepo conflicting files (lock files, workspace config, .npmrc, .husky, .github, packageManager field, prepare script)',
  defaultValue: false,
}
```

### 2.2 測試變更（P1）

#### 測試 1: 更新 [`src/commands/createAction/createAction.monorepo.test.ts`](../../../../../src/commands/createAction/createAction.monorepo.test.ts)

新增測試驗證 `.husky` 和 `.github` 被包含在移除清單中：

```typescript
describe('monorepo mode - husky and github removal', () => {
  it('should include .husky and .github in remove list when --monorepo is true', () => {
    const actionArgs: ExtendedActionArgsType = {
      monorepo: true,
    };

    const monorepoRmList =
      actionArgs.monorepo === true ? getRmFlagRmList(actionMonorepoFileNames) : [];

    expect(monorepoRmList).toHaveLength(7); // 5 + 2 新增的
    
    const fields = monorepoRmList.map((item) => item.field);
    expect(fields).toContain('.husky');
    expect(fields).toContain('.github');
    expect(fields).toContain('pnpm-lock.yaml');
    expect(fields).toContain('.npmrc');
  });
});
```

#### 測試 2: 新增 `src/utils/initProjPackageJson.test.ts`

建立完整的測試檔案驗證 `prepare` script 的移除邏輯。

### 2.3 文檔更新（P2）

更新 [`README.md`](../../../../../README.md)、[`docs/README.md`](../../../../../docs/README.md) 和 [`docs/README.zh-TW.md`](../../../../../docs/README.zh-TW.md)，說明統一的 husky 移除邏輯。

## 3. 行為比較表

| 場景 | `.husky` 移除? | `prepare` script 移除? | 說明 |
|------|---------------|----------------------|------|
| `--no-husky` | ✅ 是 | ✅ 是（新增） | 透過 boolean flag 移除 |
| `--monorepo` | ✅ 是 | ✅ 是 | 透過 monorepo 清單移除 |
| `--rm .husky` | ✅ 是 | ✅ 是（新增） | 透過自訂移除清單移除 |
| 預設（無旗標） | ❌ 否 | ❌ 否 | 保留所有檔案 |

**重要：** 無論透過哪種方式移除 `.husky`，`prepare` script 都會被一併移除（如果包含 husky）。

## 4. 優點

1. **一致性**：統一處理邏輯，無論透過哪種方式移除 husky
2. **完整性**：移除 `.husky` 的同時移除 `prepare` script，避免執行錯誤
3. **靈活性**：支援多種移除方式（`--no-husky`、`--monorepo`、`--rm`）
4. **向後相容**：改善現有功能，不破壞現有使用方式

## 5. 實作優先級

| 優先級 | 任務 | 預估時間 |
|--------|---------|----------|
| P0 | 更新 `actionMonorepoFileNames` | 5 分鐘 |
| P0 | 更新 `initProjPackageJson.ts` | 20 分鐘 |
| P0 | 更新 `createProject.ts` | 5 分鐘 |
| P0 | 更新 CLI 描述 | 5 分鐘 |
| P1 | 新增/更新測試 | 45 分鐘 |
| P1 | 執行並驗證測試 | 15 分鐘 |
| P2 | 更新文檔 | 20 分鐘 |

**總預估時間：** 約 2 小時

## 6. 總結

本設計修正了 husky 移除邏輯的不一致問題，確保：
- ✅ 無論透過哪種方式移除 `.husky`，`prepare` script 都會被一併移除
- ✅ `--no-husky` 和 `--monorepo` 的行為一致
- ✅ 程式碼更簡潔、邏輯更清晰
- ✅ 測試更完整

這個設計更符合使用者的預期和最佳實踐。