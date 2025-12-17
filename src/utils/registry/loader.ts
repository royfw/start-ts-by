import fs from 'node:fs/promises';
import https from 'node:https';
import http from 'node:http';
import { validateRegistry } from './validator.js';
import type { Registry, RegistryConfig } from './types.js';

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

  // 檢查 URL 格式
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }

  // 只支援 http 和 https 協議
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(
      `Unsupported protocol: ${parsedUrl.protocol}, only http and https are supported`,
    );
  }

  return new Promise((resolve, reject) => {
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const request = protocol.get(url, (response) => {
      // 檢查 HTTP 狀態碼
      if (
        !response.statusCode ||
        response.statusCode < 200 ||
        response.statusCode >= 300
      ) {
        // 處理重導向
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          // 遞迴處理重導向
          loadRegistryFromUrl(response.headers.location).then(resolve).catch(reject);
          return;
        }

        reject(new Error(`HTTP request failed with status code: ${response.statusCode}`));
        return;
      }

      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData: unknown = JSON.parse(data);
          const registry = validateRegistry(jsonData);
          resolve(registry);
        } catch (error) {
          if (error instanceof SyntaxError) {
            reject(new Error(`JSON parsing error: ${error.message}`));
          } else if (error instanceof Error) {
            reject(error);
          } else {
            reject(new Error(`Unknown error: ${String(error)}`));
          }
        }
      });
    });

    request.on('error', (error) => {
      reject(new Error(`Network request failed: ${error.message}`));
    });

    // 設定請求超時（30 秒）
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout (30 seconds)'));
    });
  });
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
    // 讀取檔案內容
    const content = await fs.readFile(filePath, 'utf-8');

    // 解析 JSON
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(content);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`JSON parsing error: ${error.message}`);
      }
      throw error;
    }

    // 驗證並返回
    return validateRegistry(jsonData);
  } catch (error) {
    if (error instanceof Error) {
      // 處理檔案不存在或無權限的錯誤
      if ('code' in error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          throw new Error(`File not found: ${filePath}`);
        }
        if (nodeError.code === 'EACCES') {
          throw new Error(`Permission denied to read file: ${filePath}`);
        }
      }

      // 如果已經是我們自己拋出的錯誤，直接傳遞
      if (
        error.message.startsWith('JSON parsing error:') ||
        error.message.startsWith('Registry')
      ) {
        throw error;
      }
    }

    throw new Error(
      `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 載入 registry（支援快取）
 * @param url - Registry JSON 檔案的 URL
 * @param config - Registry 設定
 * @returns 驗證後的 Registry 物件
 */
export async function loadRegistry(
  url: string,
  _config?: RegistryConfig,
): Promise<Registry> {
  // 目前先不實作快取，直接從 URL 載入
  // 未來可以根據 _config.cacheDir 和 _config.cacheTTL 實作快取機制
  return loadRegistryFromUrl(url);
}
