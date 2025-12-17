import { readFileSync, existsSync } from 'fs';
import { RegistryConfig } from './types.js';
import { getDefaultRegistryConfigPath } from '@/configs.js';

/**
 * 載入 registry 設定檔
 * @param configPath 自訂設定檔路徑（選填）
 * @returns RegistryConfig 物件
 */
export function loadRegistryConfig(configPath?: string): RegistryConfig {
  const defaultConfig: RegistryConfig = {
    registries: [],
    cacheDir: '.cache/registries',
    cacheTTL: 3600000, // 1 hour in milliseconds
  };

  const targetPath = configPath || getDefaultRegistryConfigPath();

  // 如果檔案不存在，返回預設設定
  if (!existsSync(targetPath)) {
    return defaultConfig;
  }

  try {
    const fileContent = readFileSync(targetPath, 'utf-8');
    const config = JSON.parse(fileContent) as Partial<RegistryConfig>;

    // 合併預設值
    return {
      registries: config.registries || defaultConfig.registries,
      cacheDir: config.cacheDir || defaultConfig.cacheDir,
      cacheTTL: config.cacheTTL || defaultConfig.cacheTTL,
    };
  } catch (error) {
    // 解析錯誤時顯示警告並返回預設設定
    console.warn(`⚠️  Warning: Failed to load registry config from ${targetPath}`);
    if (error instanceof Error) {
      console.warn(`   Error: ${error.message}`);
    }
    return defaultConfig;
  }
}
