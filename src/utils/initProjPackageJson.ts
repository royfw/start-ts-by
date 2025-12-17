import path from 'path';
import fs from 'fs';
import { PackageJsonType, RemoveFileInfoType } from '@/types';

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
      (item) => item.field === '.husky' && item.isRemove === true,
    );

    // 如果 .husky 被移除，同時移除 husky 相關的 prepare script
    if (isHuskyRemoved && packageJson.scripts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scripts = packageJson.scripts as any;
      if (
        typeof scripts === 'object' &&
        scripts.prepare &&
        typeof scripts.prepare === 'string' &&
        scripts.prepare.includes('husky')
      ) {
        delete scripts.prepare;
        console.info(`🔧 Removed prepare script (husky removed)`);
      }
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.info(`📦 ${filename} initialized`);
  }
}
