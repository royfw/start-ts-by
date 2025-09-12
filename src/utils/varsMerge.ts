import {
  ParsedVarsType,
  VarsMergeOptions,
  VarsMergeResult,
  ExtendedActionArgsType,
} from '@/types';
import { parseVars } from './varsParser';

/**
 * 深度合併多個變數物件，處理優先序與 strict 規則
 * 優先序：--vars > --vars-file > 個別旗標/參數 > 環境變數 > 互動輸入 > 預設值
 * @param sources 按優先序排列的變數來源陣列（高優先序在前）
 * @param options 合併選項
 * @returns 合併結果包含變數、警告和錯誤
 */
export function mergeVars(
  sources: ParsedVarsType[],
  options: VarsMergeOptions = {},
): VarsMergeResult {
  const { strict = false } = options;
  const merged: ParsedVarsType = {};
  const warnings: string[] = [];
  const errors: string[] = [];

  // 從低優先序到高優先序合併（後面的覆蓋前面的）
  for (let i = sources.length - 1; i >= 0; i--) {
    const source = sources[i];
    const mergeResult = deepMerge(merged, source, strict);

    Object.assign(merged, mergeResult.merged);
    warnings.push(...mergeResult.warnings);
    errors.push(...mergeResult.errors);
  }

  return { merged, warnings, errors };
}

/**
 * 深度合併兩個物件
 */
function deepMerge(
  target: ParsedVarsType,
  source: ParsedVarsType,
  strict: boolean,
): VarsMergeResult {
  const merged = JSON.parse(JSON.stringify(target)) as ParsedVarsType; // 深拷貝
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const [key, sourceValue] of Object.entries(source)) {
    if (key in merged) {
      const targetValue = merged[key];
      const keyPath = key;

      // 處理衝突
      const conflictResult = handleConflict(targetValue, sourceValue, keyPath, strict);
      merged[key] = conflictResult.value;
      warnings.push(...conflictResult.warnings);
      errors.push(...conflictResult.errors);
    } else {
      merged[key] = sourceValue;
    }
  }

  return { merged, warnings, errors };
}

/**
 * 處理鍵值衝突
 */
function handleConflict(
  targetValue: ParsedVarsType[string],
  sourceValue: ParsedVarsType[string],
  keyPath: string,
  strict: boolean,
): { value: ParsedVarsType[string]; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 型別檢查
  const targetType = getValueType(targetValue);
  const sourceType = getValueType(sourceValue);

  if (targetType !== sourceType) {
    const message = `Type conflict at "${keyPath}": expected ${targetType} but got ${sourceType}`;

    if (strict) {
      errors.push(message);
      return { value: targetValue, warnings, errors };
    } else {
      warnings.push(`${message}, using new value`);
      return { value: sourceValue, warnings, errors };
    }
  }

  // 相同型別的處理
  if (targetType === 'object' && sourceType === 'object') {
    // 遞迴合併物件
    const nestedResult = deepMerge(
      targetValue as ParsedVarsType,
      sourceValue as ParsedVarsType,
      strict,
    );
    warnings.push(...nestedResult.warnings);
    errors.push(...nestedResult.errors);
    return { value: nestedResult.merged, warnings, errors };
  } else if (targetType === 'array' && sourceType === 'array') {
    // 陣列合併：保留最大長度，以新值優先
    const targetArray = targetValue as ParsedVarsType[];
    const sourceArray = sourceValue as ParsedVarsType[];
    const mergedArray: ParsedVarsType[] = [...targetArray];

    for (let i = 0; i < sourceArray.length; i++) {
      if (i < mergedArray.length) {
        if (sourceArray[i] !== undefined && sourceArray[i] !== null) {
          const itemResult = handleConflict(
            mergedArray[i],
            sourceArray[i],
            `${keyPath}[${i}]`,
            strict,
          );
          mergedArray[i] = itemResult.value as ParsedVarsType;
          warnings.push(...itemResult.warnings);
          errors.push(...itemResult.errors);
        }
      } else {
        mergedArray.push(sourceArray[i]);
      }
    }
    return { value: mergedArray, warnings, errors };
  } else {
    // 原始型別：直接覆蓋
    const targetStr =
      typeof targetValue === 'object' ? JSON.stringify(targetValue) : String(targetValue);
    const sourceStr =
      typeof sourceValue === 'object' ? JSON.stringify(sourceValue) : String(sourceValue);
    const message = `Overriding "${keyPath}": "${targetStr}" -> "${sourceStr}"`;
    if (strict) {
      errors.push(`Duplicate key detected: ${keyPath}`);
      return { value: targetValue, warnings, errors };
    } else {
      warnings.push(message);
      return { value: sourceValue, warnings, errors };
    }
  }
}

/**
 * 取得值的型別
 */
function getValueType(value: ParsedVarsType[string]): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

/**
 * 從 ActionArgs 提取變數並按優先序組合
 */
export function extractVarsFromActionArgs(
  actionArgs: ExtendedActionArgsType,
  varsFromFile?: ParsedVarsType,
  defaultVars?: ParsedVarsType,
): VarsMergeResult {
  const sources: ParsedVarsType[] = [];
  const strict = !!actionArgs.strict;

  // 1. 預設值（最低優先序）
  if (defaultVars) {
    sources.push(defaultVars);
  }

  // 2. 環境變數（如有需要可在此處理）
  // sources.push(getEnvVars());

  // 3. 個別旗標/參數
  const flagVars = extractFlagVars(actionArgs);
  if (Object.keys(flagVars).length > 0) {
    sources.push(flagVars);
  }

  // 4. --vars-file
  if (varsFromFile && Object.keys(varsFromFile).length > 0) {
    sources.push(varsFromFile);
  }

  // 5. --vars（最高優先序，除了直接參數）
  if (actionArgs.vars && actionArgs.vars.length > 0) {
    const varsResult = parseVars(actionArgs.vars, strict);

    if (varsResult.errors.length > 0) {
      return {
        merged: {},
        warnings: [],
        errors: varsResult.errors,
      };
    }

    sources.push(varsResult.vars);
  }

  return mergeVars(sources, { strict });
}

/**
 * 從 actionArgs 提取個別旗標變數
 */
function extractFlagVars(actionArgs: ExtendedActionArgsType): ParsedVarsType {
  const flagVars: ParsedVarsType = {};

  // 提取 template
  if (actionArgs.template && typeof actionArgs.template === 'string') {
    flagVars.template = actionArgs.template;
  }

  // 提取 rm 列表
  if (actionArgs.rm && Array.isArray(actionArgs.rm)) {
    flagVars.removeList = actionArgs.rm.map((field) => ({
      field: String(field),
      isRemove: true,
    }));
  }

  // 提取執行選項
  const execOptions = ['gitInit', 'npmInstall'] as const;
  for (const option of execOptions) {
    if (
      option in actionArgs &&
      typeof (actionArgs as Record<string, unknown>)[option] === 'boolean'
    ) {
      if (!flagVars.execList) flagVars.execList = [];
      const execList = flagVars.execList as Array<{ key: string; isExec: boolean }>;
      execList.push({
        key: option,
        isExec: (actionArgs as Record<string, unknown>)[option] as boolean,
      });
    }
  }

  // 提取檢查選項
  const checkOptions = ['husky', 'github'] as const;
  for (const option of checkOptions) {
    if (
      option in actionArgs &&
      typeof (actionArgs as Record<string, unknown>)[option] === 'boolean'
    ) {
      if (!flagVars.checkArgs) flagVars.checkArgs = [];
      const checkArgs = flagVars.checkArgs as Array<{ key: string; value: boolean }>;
      checkArgs.push({
        key: option,
        value: (actionArgs as Record<string, unknown>)[option] as boolean,
      });
    }
  }

  return flagVars;
}

/**
 * 驗證必要參數
 */
export function validateRequiredVars(
  vars: ParsedVarsType,
  required: string[] = ['name', 'template'],
): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const key of required) {
    if (!hasDeepKey(vars, key) || getDeepValue(vars, key) == null) {
      missing.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * 檢查深層鍵是否存在
 */
function hasDeepKey(obj: ParsedVarsType, key: string): boolean {
  try {
    getDeepValue(obj, key);
    return true;
  } catch {
    return false;
  }
}

/**
 * 取得深層值
 */
function getDeepValue(obj: ParsedVarsType, key: string): ParsedVarsType[string] {
  const keys = key.split('.');
  let current: ParsedVarsType[string] = obj;

  for (const k of keys) {
    if (
      current &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      k in current
    ) {
      current = current[k];
    } else {
      throw new Error(`Key not found: ${key}`);
    }
  }

  return current;
}
