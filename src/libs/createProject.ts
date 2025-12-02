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

export async function createProject(params: CreateProjectParams) {
  const { name, template, removeList, execList, isMonorepo } = params;

  const targetDir = getTargetDir(name);

  const parsedTemplate = parseTemplateSource(template);
  templateToLocal(parsedTemplate, targetDir);

  for (const item of removeList) {
    checkExistPathAndRemove(targetDir, item.field, item.isRemove);
  }

  // Initialize package.json
  initProjPackageJson(targetDir, true, isMonorepo);

  // Initialize README.md
  initProjReadMeMd(template, targetDir);

  const runExecCommandList = execList.filter((i) => i.isExec).map((i) => i.command);
  execSyncByList(runExecCommandList, { cwd: targetDir });

  console.log(`✅ Project "${name}" has been created at ${targetDir}`);

  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log('🎉 Start building your project!');
}
