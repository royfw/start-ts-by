# Registry 系統使用指南

## 概述

Registry 系統允許 `start-ts-by` 從外部來源載入 template 定義，讓社群可以分享和維護 template 集合。

## 設定 Registry

### 1. 建立設定檔

在專案根目錄建立 `registry-config.json`：

```json
{
  "registries": [
    {
      "name": "start-ts-templates",
      "url": "https://raw.githubusercontent.com/royfw/start-ts-templates/main/registry.json",
      "enabled": true
    }
  ],
  "cacheDir": ".cache/registries",
  "cacheTTL": 3600000
}
```

### 2. 設定選項說明

- `registries`: Registry 來源陣列
  - `name`: Registry 顯示名稱
  - `url`: Registry JSON 檔案的 URL
  - `enabled`: 是否啟用（預設為 true）
- `cacheDir`: 快取目錄路徑（選用）
- `cacheTTL`: 快取有效期（毫秒，選用）

## 建立自己的 Registry

### Registry.json 格式

```json
{
  "repo": "your-org/your-templates-repo",
  "defaultRef": "main",
  "version": "1.0.0",
  "name": "My Templates",
  "description": "A collection of TypeScript templates",
  "templates": [
    {
      "id": "unique-template-id",
      "path": "templates/template-directory",
      "title": "Human-readable Template Name",
      "description": "Optional template description"
    }
  ]
}
```

### 欄位說明

#### 必要欄位

- `repo`: GitHub repository (格式: `owner/repo`)
- `defaultRef`: 預設 Git ref (branch/tag)
- `templates`: Template 定義陣列

#### Template 必要欄位

- `id`: 唯一識別碼（不可重複）
- `path`: Template 在 repository 中的路徑
- `title`: 顯示名稱

#### 選用欄位

- `version`: Registry 版本
- `name`: Registry 名稱
- `description`: Registry 描述
- Template 的 `description`: Template 描述

### 範例 Repository 結構

```
your-templates-repo/
├── registry.json
└── templates/
    ├── app-basic/
    │   ├── package.json
    │   └── src/
    ├── app-advanced/
    │   ├── package.json
    │   └── src/
    └── lib/
        ├── package.json
        └── src/
```

## 使用 Registry Templates

### 互動式選擇

執行 `npx start-ts-by create my-project` 時：

1. 選擇 template 來源（內建 / Registry / 手動輸入）
2. 如果選擇 Registry，再選擇具體的 template

### 列出可用 Templates

```bash
# 查看所有可用 templates
npx start-ts-by --list

# JSON 格式輸出
npx start-ts-by --list-json

# 包含詳細描述
npx start-ts-by --list-verbose
```

**範例輸出**：

```
📦 可用的 Templates:

📌 內建 Templates (builtin)
  ├─ TypeScript Library
  ├─ TypeScript Application
  └─ Monorepo Template

🌐 start-ts-templates (registry)
  ├─ App (tsdown)
  └─ Library

✨ 共 5 個 templates 來自 2 個來源
```

## 錯誤處理

如果無法載入 registry：

- 系統會顯示警告訊息
- 仍可使用內建 templates
- 可選擇手動輸入 GitHub URL

## 安全性考量

- Registry URL 僅支援 HTTPS
- 建議使用官方或可信任的 registry
- 系統會驗證 registry.json 格式
- Template 來源為公開的 GitHub repositories

## 常見問題

### Q: Registry 會快取嗎？

A: 是的，載入的 registry 會被快取以提升效能。可透過 `cacheTTL` 設定快取時間。

### Q: 可以使用本地 registry.json 嗎？

A: 目前系統設計為從網路載入，但可以透過修改程式碼支援本地檔案。

### Q: 如何停用某個 registry？

A: 在 `registry-config.json` 中將對應 registry 的 `enabled` 設為 `false`。

### Q: 可以同時使用多個 registry 嗎？

A: 可以，在 `registries` 陣列中新增多個 registry 設定即可。

### Q: Registry 載入失敗會影響專案建立嗎？

A: 不會，即使 registry 載入失敗，你仍然可以使用內建 templates 或手動輸入 GitHub URL。

## 進階使用

### 自訂快取設定

```json
{
  "registries": [...],
  "cacheDir": ".my-custom-cache",
  "cacheTTL": 7200000
}
```

- `cacheDir`: 自訂快取目錄位置
- `cacheTTL`: 快取有效期（毫秒），預設為 3600000（1小時）

### 停用特定 Registry

```json
{
  "registries": [
    {
      "name": "primary-registry",
      "url": "https://example.com/registry.json",
      "enabled": true
    },
    {
      "name": "backup-registry",
      "url": "https://backup.example.com/registry.json",
      "enabled": false
    }
  ]
}
```

## 參考連結

- [README - Registry 支援](./README.md#-registry-support)
