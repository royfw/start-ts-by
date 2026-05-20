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

export const configs: ProjectConfigType = {
  name: packageJson.name ?? 'my-cli',
  version: packageJson.version ?? '0.0.1',
  description: packageJson.description ?? 'my-cli',
  templates: getTemplates(),
  packageJson,
};
