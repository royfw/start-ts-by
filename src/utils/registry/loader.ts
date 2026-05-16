import fs from 'node:fs/promises';
import { validateRegistry } from './validator.js';
import type { Registry } from './types.js';

/**
 * 從 URL 載入 registry.json
 * @param url - Registry JSON 檔案的 URL
 * @returns 驗證後的 Registry 物件
 * @throws {Error} 當網路錯誤、解析錯誤或驗證失敗時拋出錯誤
 */
export async function loadRegistryFromUrl(url: string): Promise<Registry> {
  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(
      `Unsupported protocol: ${parsedUrl.protocol}, only http and https are supported`,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });

    if (!response.ok) {
      throw new Error(`HTTP request failed with status code: ${response.status}`);
    }

    const jsonData: unknown = JSON.parse(await response.text());
    return validateRegistry(jsonData);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout (30 seconds)');
    }
    if (error instanceof SyntaxError) {
      throw new Error(`JSON parsing error: ${error.message}`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown error: ${String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 從本地檔案載入 registry.json
 * @param filePath - Registry JSON 檔案的本地路徑
 * @returns 驗證後的 Registry 物件
 * @throws {Error} 當檔案不存在、讀取錯誤、解析錯誤或驗證失敗時拋出錯誤
 */
export async function loadRegistryFromFile(filePath: string): Promise<Registry> {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string');
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const jsonData: unknown = JSON.parse(content);
    return validateRegistry(jsonData);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`JSON parsing error: ${error.message}`);
    }
    if (error instanceof Error && 'code' in error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      if (nodeError.code === 'EACCES') {
        throw new Error(`Permission denied to read file: ${filePath}`);
      }
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to read file: ${String(error)}`);
  }
}

/**
 * 載入 registry
 * @param url - Registry JSON 檔案的 URL
 * @returns 驗證後的 Registry 物件
 */
export async function loadRegistry(url: string): Promise<Registry> {
  return loadRegistryFromUrl(url);
}
