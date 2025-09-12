import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { ParsedVarsType, VarsParseResult, VarsFileInclude } from '@/types';
import { parseVars } from './varsParser';

/**
 * 讀取並解析 vars-file，支援 include: 與循環偵測
 * @param filePath 檔案路徑
 * @param strict 是否為嚴格模式
 * @returns 解析結果包含變數和錯誤
 */
export function parseVarsFile(
  filePath: string,
  strict: boolean = false,
): VarsParseResult {
  const includeStack: VarsFileInclude[] = [];
  return parseVarsFileRecursive(filePath, strict, includeStack);
}

/**
 * 遞迴解析 vars-file
 */
function parseVarsFileRecursive(
  filePath: string,
  strict: boolean,
  includeStack: VarsFileInclude[],
): VarsParseResult {
  const resolvedPath = resolve(filePath);

  // 檢查循環包含
  for (const included of includeStack) {
    if (included.path === resolvedPath) {
      const chain = includeStack.map((i) => i.path).join(' -> ') + ` -> ${resolvedPath}`;
      return {
        vars: {},
        errors: [`Circular include detected: ${chain}`],
      };
    }
  }

  // 檢查檔案是否存在
  if (!existsSync(resolvedPath)) {
    return {
      vars: {},
      errors: [`Vars file not found: ${resolvedPath}`],
    };
  }

  // 讀取檔案內容
  let content: string;
  try {
    content = readFileSync(resolvedPath, 'utf-8');
  } catch (error) {
    return {
      vars: {},
      errors: [`Failed to read vars file "${resolvedPath}": ${(error as Error).message}`],
    };
  }

  // 加入包含堆疊
  const currentInclude: VarsFileInclude = {
    path: resolvedPath,
    includedFrom:
      includeStack.length > 0 ? includeStack[includeStack.length - 1].path : undefined,
  };
  includeStack.push(currentInclude);

  const vars: ParsedVarsType = {};
  const errors: string[] = [];
  const lines = content.split('\n');
  const varsArray: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();

    // 跳過空白行和註解
    if (!line || line.startsWith('#')) {
      continue;
    }

    // 處理 include: 指令
    if (line.startsWith('include:')) {
      const includePath = line.substring(8).trim();
      if (!includePath) {
        errors.push(`${resolvedPath}:${lineNum}: Empty include path`);
        continue;
      }

      // 解析相對路徑
      const fullIncludePath = resolve(dirname(resolvedPath), includePath);
      const includeResult = parseVarsFileRecursive(fullIncludePath, strict, [
        ...includeStack,
      ]);

      // 合併結果
      Object.assign(vars, includeResult.vars);
      errors.push(...includeResult.errors);
      continue;
    }

    // 驗證 KEY=VALUE 格式
    if (!line.includes('=')) {
      errors.push(
        `${resolvedPath}:${lineNum}: Invalid format, expected "KEY=VALUE" but got "${line}"`,
      );
      continue;
    }

    // 收集變數行
    varsArray.push(line);
  }

  // 移除包含堆疊
  includeStack.pop();

  // 解析收集到的變數
  if (varsArray.length > 0) {
    const parseResult = parseVars(varsArray, strict);
    Object.assign(vars, parseResult.vars);
    errors.push(...parseResult.errors);
  }

  return { vars, errors };
}

/**
 * 驗證 vars-file 路徑並提供修正建議
 */
export function validateVarsFile(filePath: string): {
  isValid: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];

  if (!existsSync(filePath)) {
    suggestions.push(`File "${filePath}" does not exist`);

    // 提供可能的修正建議
    const commonNames = ['.stb.vars', 'vars.txt', 'variables.env', '.env.vars'];
    const dir = dirname(filePath);

    for (const name of commonNames) {
      const suggestedPath = resolve(dir, name);
      if (existsSync(suggestedPath)) {
        suggestions.push(`Did you mean "${suggestedPath}"?`);
      }
    }

    return { isValid: false, suggestions };
  }

  return { isValid: true, suggestions: [] };
}

/**
 * 創建範例 vars-file 內容
 */
export function createExampleVarsFile(): string {
  return `# Example vars file for start-ts-by
# Comments start with #
# Empty lines are ignored

# Basic variables
name=my-awesome-app
template=user/repo

# Nested variables
removeList[0].field=README.md
removeList[0].isRemove=true
removeList[1].field=.github
removeList[1].isRemove=false

# Execution options
execList[0].key=gitInit
execList[0].command=git init
execList[0].isExec=true

# Check arguments
checkArgs[0].key=husky
checkArgs[0].message=Keep husky?

# File content (@ prefix reads from file)
# token=@./secret-token.txt

# Include other vars files
# include: ./common.vars
# include: ./environment-specific.vars
`;
}
