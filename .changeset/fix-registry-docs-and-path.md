---
"start-ts-by": patch
---

fix(registry): fix documentation dead links and config path resolution

**Bug Fixes:**
- Fix VitePress documentation dead links in registry.md and registry.zh-TW.md
  - Change `./../README` to `./README.md` for VitePress compatibility
  - Remove links to internal technical design documents
- Fix registry-config.json path resolution after bundling
  - Move `getDefaultRegistryConfigPath()` to src/configs.ts for consistent path resolution
  - Use same logic as other config files (templates.json, package.json)
  - Update import path in test file

**Technical Details:**
- Ensure registry-config.json can be correctly located in bundled distribution
- Improve documentation navigation in VitePress environment
- All tests passing (8/8)