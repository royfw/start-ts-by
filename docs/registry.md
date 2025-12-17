# Registry System Guide

## Overview

The Registry system allows `start-ts-by` to load template definitions from external sources, enabling the community to share and maintain template collections.

## Setting Up Registry

### 1. Create Configuration File

Create `registry-config.json` in your project root:

```json
{
  "registries": [
    {
      "name": "start-ts-templates",
      "url": "https://raw.githubusercontent.com/royfuwei/start-ts-templates/main/registry.json",
      "enabled": true
    }
  ],
  "cacheDir": ".cache/registries",
  "cacheTTL": 3600000
}
```

### 2. Configuration Options

- `registries`: Array of registry sources
  - `name`: Registry display name
  - `url`: URL of the registry JSON file
  - `enabled`: Whether the registry is enabled (default: true)
- `cacheDir`: Cache directory path (optional)
- `cacheTTL`: Cache time-to-live in milliseconds (optional)

## Creating Your Own Registry

### Registry.json Format

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

### Field Descriptions

#### Required Fields
- `repo`: GitHub repository (format: `owner/repo`)
- `defaultRef`: Default Git ref (branch/tag)
- `templates`: Array of template definitions

#### Template Required Fields
- `id`: Unique identifier (must be unique)
- `path`: Template path in the repository
- `title`: Display name

#### Optional Fields
- `version`: Registry version
- `name`: Registry name
- `description`: Registry description
- Template `description`: Template description

### Example Repository Structure

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

## Using Registry Templates

### Interactive Selection

When running `npx start-ts-by create my-project`:

1. Select template source (Built-in / Registry / Manual input)
2. If you choose Registry, select a specific template

### List Available Templates

```bash
# View all available templates
npx start-ts-by --list

# JSON format output
npx start-ts-by --list-json

# Include detailed descriptions
npx start-ts-by --list-verbose
```

**Example Output**:

```
📦 Available Templates:

📌 Built-in Templates (builtin)
  ├─ TypeScript Library
  ├─ TypeScript Application
  └─ Monorepo Template

🌐 start-ts-templates (registry)
  ├─ App (tsdown)
  └─ Library

✨ Total 5 templates from 2 sources
```

## Error Handling

If a registry cannot be loaded:
- The system will display a warning message
- Built-in templates remain available
- You can still manually input a GitHub URL

## Security Considerations

- Registry URLs must use HTTPS
- Use official or trusted registries
- The system validates registry.json format
- Template sources are public GitHub repositories

## Frequently Asked Questions

### Q: Are registries cached?
A: Yes, loaded registries are cached to improve performance. You can configure cache duration using `cacheTTL`.

### Q: Can I use a local registry.json?
A: The current system is designed to load from the network, but it can be modified to support local files.

### Q: How do I disable a specific registry?
A: Set the `enabled` field to `false` for the corresponding registry in `registry-config.json`.

### Q: Can I use multiple registries simultaneously?
A: Yes, you can add multiple registry configurations in the `registries` array.

### Q: Will a registry loading failure affect project creation?
A: No, even if a registry fails to load, you can still use built-in templates or manually input a GitHub URL.

## Advanced Usage

### Custom Cache Configuration

```json
{
  "registries": [...],
  "cacheDir": ".my-custom-cache",
  "cacheTTL": 7200000
}
```

- `cacheDir`: Custom cache directory location
- `cacheTTL`: Cache time-to-live in milliseconds, default is 3600000 (1 hour)

### Disable Specific Registry

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

## Reference Links

- [README - Registry Support](./README.md#-registry-support)