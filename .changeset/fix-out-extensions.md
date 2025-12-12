---
"start-ts-by": patch
---

Fix outExtensions configuration to properly append .js extension

Fixed an issue where the outExtensions configuration was missing the `.js` extension,
causing output files to be generated without proper extensions (e.g., `indexjs` instead of `index.js`).