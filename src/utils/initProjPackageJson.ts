import path from 'path';
import fs from 'fs';
import { PackageJsonType } from '@/types';

export function initProjPackageJson(
  targetDir: string,
  isInit = true,
  isMonorepo = false,
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

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.info(`📦 ${filename} initialized`);
  }
}
