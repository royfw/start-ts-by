import { readFileSync } from 'fs';
import { ParsedVarsType, VarsParseResult } from '@/types';

/**
 * 解析 --vars 陣列為物件，支援巢狀鍵、陣列索引、@ 取檔、型別轉換
 * @param varsArray --vars 陣列參數
 * @param strict 是否為嚴格模式，遇到重複鍵時報錯
 * @returns 解析結果包含變數和錯誤
 */
export function parseVars(varsArray: string[], strict: boolean = false): VarsParseResult {
  const vars: ParsedVarsType = {};
  const errors: string[] = [];
  const duplicateKeys: Set<string> = new Set();

  for (const varString of varsArray) {
    // 處理逗號分隔的多個變數
    const pairs = varString
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);

    for (const pair of pairs) {
      try {
        const parsed = parseVarPair(pair);
        if (parsed) {
          const { key, value } = parsed;

          // 檢查重複鍵
          if (hasNestedKey(vars, key)) {
            if (strict) {
              errors.push(`Duplicate key detected: ${key}`);
              continue;
            } else {
              duplicateKeys.add(key);
            }
          }

          setNestedValue(vars, key, value);
        }
      } catch (error) {
        errors.push(`Failed to parse var pair "${pair}": ${(error as Error).message}`);
      }
    }
  }

  return { vars, errors };
}

/**
 * 解析單個 key=value 對
 */
function parseVarPair(
  pair: string,
): { key: string; value: string | number | boolean } | null {
  const equalIndex = pair.indexOf('=');
  if (equalIndex === -1) {
    throw new Error(`Invalid format, expected "key=value" but got "${pair}"`);
  }

  const key = pair.substring(0, equalIndex).trim();
  let rawValue = pair.substring(equalIndex + 1);

  if (!key) {
    throw new Error(`Empty key in "${pair}"`);
  }

  // 處理 @ 取檔
  if (rawValue.startsWith('@')) {
    const filePath = rawValue.substring(1);
    try {
      rawValue = readFileSync(filePath, 'utf-8').replace(/\n$/, ''); // 去除尾端換行
    } catch (error) {
      throw new Error(`Failed to read file "${filePath}": ${(error as Error).message}`);
    }
  }

  // 型別轉換
  const value = convertValue(rawValue);

  return { key, value };
}

/**
 * 轉換字串值為適當的型別
 */
function convertValue(value: string): string | number | boolean {
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number (integer)
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  // Number (float)
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // String (default)
  return value;
}

/**
 * 檢查是否已存在巢狀鍵
 */
function hasNestedKey(obj: ParsedVarsType, key: string): boolean {
  try {
    getNestedValue(obj, key);
    return true;
  } catch {
    return false;
  }
}

/**
 * 取得巢狀值
 */
function getNestedValue(obj: ParsedVarsType, key: string): ParsedVarsType[string] {
  const keys = parseKeyPath(key);
  let current: ParsedVarsType[string] = obj;

  for (const k of keys) {
    if (typeof k === 'string') {
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        current = current[k];
      } else {
        throw new Error(`Cannot access property "${k}" on non-object`);
      }
    } else {
      // Array index
      if (Array.isArray(current)) {
        current = current[k];
      } else {
        throw new Error(`Cannot access index "${k}" on non-array`);
      }
    }
  }

  return current;
}

/**
 * 設定巢狀值
 */
function setNestedValue(
  obj: ParsedVarsType,
  key: string,
  value: string | number | boolean,
): void {
  const keys = parseKeyPath(key);
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const nextK = keys[i + 1];

    if (typeof k === 'string') {
      if (!(k in current) || current[k] == null) {
        // 決定要創建物件還是陣列
        current[k] = typeof nextK === 'number' ? [] : {};
      }
      current = current[k] as ParsedVarsType;
    } else {
      // Array index
      if (!Array.isArray(current)) {
        throw new Error(`Cannot set array index "${k}" on non-array`);
      }

      // 擴展陣列長度
      while (current.length <= k) {
        current.push(typeof nextK === 'number' ? [] : {});
      }
      current = current[k] as ParsedVarsType;
    }
  }

  // 設定最終值
  const lastKey = keys[keys.length - 1];
  if (typeof lastKey === 'string') {
    current[lastKey] = value;
  } else {
    // Array index
    if (!Array.isArray(current)) {
      throw new Error(`Cannot set array index "${lastKey}" on non-array`);
    }
    while (current.length <= lastKey) {
      current.push(null);
    }
    current[lastKey] = value;
  }
}

/**
 * 解析鍵路徑，支援 a.b.c 和 list[0].field 格式
 */
function parseKeyPath(key: string): (string | number)[] {
  const result: (string | number)[] = [];
  let current = '';
  let inBracket = false;

  for (let i = 0; i < key.length; i++) {
    const char = key[i];

    if (char === '[' && !inBracket) {
      if (current) {
        result.push(current);
        current = '';
      }
      inBracket = true;
    } else if (char === ']' && inBracket) {
      if (current) {
        const index = parseInt(current, 10);
        if (isNaN(index)) {
          throw new Error(`Invalid array index: "${current}"`);
        }
        result.push(index);
        current = '';
      }
      inBracket = false;
    } else if (char === '.' && !inBracket) {
      if (current) {
        result.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    result.push(current);
  }

  if (inBracket) {
    throw new Error(`Unclosed bracket in key: "${key}"`);
  }

  return result;
}
