import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';
import {
  TemplateInfoType,
  PackageJsonType,
  ProjectConfigType,
  RegistryConfig,
} from '@/types';
import { loadRegistryConfig } from '@/utils/registry/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templatesJsonPath = resolve(__dirname, '../templates.json');
const packageJsonPath = resolve(__dirname, '../package.json');

/**
 * 取得預設的 registry 設定檔路徑
 * @returns 預設的 registry-config.json 路徑
 */
export function getDefaultRegistryConfigPath(): string {
  // 從 src/configs.ts 往上一層到專案根目錄
  return resolve(__dirname, '../registry-config.json');
}

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
 *
 * - 套件管理器鎖定檔案和設定：由 monorepo 根目錄統一管理
 * - .husky：Git hooks 應由 monorepo 根目錄統一管理
 * - .github：CI/CD workflows 應由 monorepo 根目錄統一管理
 */
export const actionMonorepoFileNames = [
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'package-lock.json',
  'yarn.lock',
  '.npmrc',
  '.husky',
  '.github',
];

export const configs: ProjectConfigType = {
  name: packageJson.name ?? 'my-cli',
  version: packageJson.version ?? '0.0.1',
  description: packageJson.description ?? 'my-cli',
  templates: getTemplates(),
  packageJson,
};

// Registry 設定管理
let cachedRegistryConfig: RegistryConfig | null = null;

/**
 * 取得 registry 設定（帶快取）
 */
export function getRegistryConfig(): RegistryConfig {
  if (!cachedRegistryConfig) {
    cachedRegistryConfig = loadRegistryConfig();
  }
  return cachedRegistryConfig;
}

/**
 * 清除 registry 設定快取（用於測試）
 */
export function clearRegistryConfigCache(): void {
  cachedRegistryConfig = null;
}
