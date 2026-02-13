---
'start-ts-by': patch
---

Fixed a registry selection bug in [`runActionPromptArgTemplateFlag`](src/commands/createAction/runActionPromptArgTemplateFlag.ts:1) by using the selected item index (instead of `type`) to identify the chosen registry. This resolves incorrect selection behavior when multiple registries are available.

Fixed local template import cleanup in [`templateToLocal`](src/utils/templateToLocal.ts:1) by adding `removeVcsMetadata()` to remove VCS metadata directories such as `.git`, `.hg`, and `.svn`. Added tests in [`templateToLocal.test`](src/utils/templateToLocal.test.ts:1) to verify metadata removal behavior.
