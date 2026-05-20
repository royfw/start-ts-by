import { readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { CreateProjectParams } from '@/types';
import {
  checkExistPathAndRemove,
  getTargetDir,
  initProjPackageJson,
  initProjReadMeMd,
  parseTemplateSource,
  templateToLocal,
} from '@/utils';
import { execSyncByList } from '@/utils/execSyncByList';

function scanAndRemoveByPattern(
  targetDir: string,
  pattern: RegExp,
  dir: string,
  relPrefix: string,
) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = relPrefix ? join(relPrefix, entry.name) : entry.name;
    const fullPath = join(dir, entry.name);
    if (pattern.test(relPath) || pattern.test(entry.name)) {
      rmSync(fullPath, { recursive: true, force: true });
      console.info(`🗑️  ${relPath} removed`);
    } else if (entry.isDirectory()) {
      scanAndRemoveByPattern(targetDir, pattern, fullPath, relPath);
    }
  }
}

function removeByPattern(targetDir: string, pattern: RegExp) {
  scanAndRemoveByPattern(targetDir, pattern, targetDir, '');
}

export function createProject(params: CreateProjectParams) {
  const { name, template, removeList, removePatterns, execList, isMonorepo } = params;

  const targetDir = getTargetDir(name);

  const parsedTemplate = parseTemplateSource(template);
  templateToLocal(parsedTemplate, targetDir);

  for (const item of removeList) {
    checkExistPathAndRemove(targetDir, item.field, item.isRemove);
  }

  // Remove files matching patterns (e.g. gitlab-related files)
  if (removePatterns) {
    for (const pattern of removePatterns) {
      removeByPattern(targetDir, pattern);
    }
  }

  // Initialize package.json
  initProjPackageJson(targetDir, true, isMonorepo, removeList);

  // Initialize README.md
  initProjReadMeMd(template, targetDir);

  const runExecCommandList = execList.filter((i) => i.isExec).map((i) => i.command);
  execSyncByList(runExecCommandList, { cwd: targetDir });

  console.log(`✅ Project "${name}" has been created at ${targetDir}`);
  console.log('🎉 Start building your project!');
}
