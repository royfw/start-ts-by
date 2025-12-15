import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';
import { TemplateInfoType, PackageJsonType, ProjectConfigType } from '@/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templatesJsonPath = resolve(__dirname, '../templates.json');
const packageJsonPath = resolve(__dirname, '../package.json');

const getTemplates = (): TemplateInfoType[] => {
  const templates = JSON.parse(
    readFileSync(templatesJsonPath, 'utf-8'),
  ) as TemplateInfoType[];
  return templates ?? [];
};

const getPackageJson = (): PackageJsonType => {
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, 'utf-8'),
  ) as PackageJsonType;
  return packageJson ?? {};
};

const packageJson = getPackageJson();

/**
 * Monorepo 模式下需要移除的檔案清單
 * 這些檔案在 monorepo 環境中會與根目錄的套件管理機制衝突
 */
export const actionMonorepoFileNames = [
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'package-lock.json',
  'yarn.lock',
  '.npmrc',
];

export const configs: ProjectConfigType = {
  name: packageJson.name ?? 'my-cli',
  version: packageJson.version ?? '0.0.1',
  description: packageJson.description ?? 'my-cli',
  templates: getTemplates(),
  packageJson,
};
