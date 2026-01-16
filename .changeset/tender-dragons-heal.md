---
'start-ts-by': patch
---

feat(registry): reorder template sources and update display names

Prioritize external registries over built-in templates by loading them first.
Prefix registry names with '(Registry)' and built-in templates with '(Default)' for better
clarity in the selection prompt. Update tests to reflect the naming changes.
