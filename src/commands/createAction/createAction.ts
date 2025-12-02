import { createProject } from '@/libs';
import {
  ActionArgsType,
  ActionCommandType,
  CreateProjectParams,
  PromptCheckArgsType,
  RnuExecInfoType,
  ExtendedActionArgsType,
  ParsedVarsType,
} from '@/types';
import { parseVarsFile, extractVarsFromActionArgs, validateRequiredVars } from '@/utils';
import { actionMonorepoFileNames } from '@/configs';
import { runActionPromptArgTemplateFlag } from './runActionPromptArgTemplateFlag';
import { runActionPromptName } from './runActionPromptName';
import { getArgsRmList } from './getArgsRmList';
import { getExecList } from './getExecList';
import { runActionPromptCheckArgs } from './runActionPromptCheckArgs';
import { runActionPromptWhileInputsAddRmList } from './runActionPromptWhileInputsAddRmList';
import { runActionPromptArgRmFlag } from './runActionPromptArgRmFlag';
import { getRmFlagRmList } from './getRmFlagRmList';

export async function createAction(name?: string, actionArgs?: ActionArgsType) {
  try {
    console.log('🚀 Creating project...');
    const actionArgsParams = (actionArgs ?? {}) as ExtendedActionArgsType;

    // 檢查非互動模式
    const noInteraction = !!(
      actionArgsParams.noInteraction ||
      actionArgsParams.ni ||
      actionArgsParams.skipPrompt
    );

    // 顯示 deprecated 警告
    if (
      actionArgsParams.skipPrompt &&
      !actionArgsParams.noInteraction &&
      !actionArgsParams.ni
    ) {
      console.log(
        '⚠️  --skip-prompt is deprecated, please use --no-interaction or --ni instead',
      );
    }

    // 準備變數合併
    let varsFromFile: ParsedVarsType = {};
    let mergedVars: ParsedVarsType = {};

    // 處理 --vars-file
    if (actionArgsParams.varsFile) {
      const varsFileResult = parseVarsFile(
        actionArgsParams.varsFile,
        !!actionArgsParams.strict,
      );

      if (varsFileResult.errors.length > 0) {
        console.error('❌ Error parsing vars file:');
        for (const error of varsFileResult.errors) {
          console.error(`   ${error}`);
        }
        process.exit(2);
      }

      varsFromFile = varsFileResult.vars;
    }

    // 合併所有變數來源
    const mergeResult = extractVarsFromActionArgs(actionArgsParams, varsFromFile);

    if (mergeResult.errors.length > 0) {
      console.error('❌ Error merging variables:');
      for (const error of mergeResult.errors) {
        console.error(`   ${error}`);
      }
      process.exit(2);
    }

    if (mergeResult.warnings.length > 0) {
      for (const warning of mergeResult.warnings) {
        console.log(`⚠️  ${warning}`);
      }
    }

    mergedVars = mergeResult.merged;

    // 非互動模式的處理邏輯
    if (noInteraction) {
      return await runNonInteractiveMode(name, actionArgsParams, mergedVars);
    } else {
      return await runInteractiveMode(name, actionArgsParams, mergedVars);
    }
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'ExitPromptError') {
      console.log('👋 Input aborted by user (Ctrl+C)');
      process.exit(0);
    } else {
      const errorMessage = (error as { message?: string })?.message;
      if (errorMessage) {
        console.error('❌ Error:', errorMessage);
      } else {
        console.error('❌ Error:', error);
      }
      process.exit(1);
    }
  }
}

/**
 * 執行非互動模式
 */
async function runNonInteractiveMode(
  name: string | undefined,
  actionArgs: ExtendedActionArgsType,
  mergedVars: ParsedVarsType,
) {
  // 確定專案名稱和模板
  const projectName = name || (mergedVars.name as string);
  const template = (actionArgs.template as string) || (mergedVars.template as string);

  // 構建驗證物件
  const validationVars: ParsedVarsType = { ...mergedVars };
  if (projectName) validationVars.name = projectName;
  if (template) validationVars.template = template;

  // 驗證必要參數
  const validation = validateRequiredVars(validationVars, ['name', 'template']);

  if (!validation.isValid) {
    console.error('❌ Missing required parameters for non-interactive mode:');
    for (const missing of validation.missing) {
      console.error(`   - ${missing}`);
    }
    console.error('');
    console.error('Provide them via:');
    console.error('  --vars name=my-app,template=user/repo');
    console.error('  --vars-file ./my.vars');
    console.error('  Command arguments: npx start-ts-by my-app -t user/repo --ni');
    process.exit(2);
  }

  // 構建 removeList
  const removeList = buildRemoveList(actionArgs, mergedVars);

  // 構建 execList
  const execList = buildExecList(actionArgs, mergedVars);

  const params: CreateProjectParams = {
    name: projectName,
    template: template,
    removeList,
    execList,
    isMonorepo: actionArgs.monorepo === true,
  };

  await createProject(params);
}

/**
 * 執行互動模式（保持原有邏輯）
 */
async function runInteractiveMode(
  name: string | undefined,
  actionArgs: ExtendedActionArgsType,
  mergedVars: ParsedVarsType,
) {
  const skipPrompt = !!(
    actionArgs.skipPrompt ||
    actionArgs.noInteraction ||
    actionArgs.ni
  );

  // 使用合併後的變數作為初始值（如果有的話）
  const projectName = await runActionPromptName(
    name || (mergedVars.name as string) || undefined,
  );

  const template = await runActionPromptArgTemplateFlag(
    (actionArgs.template as string) || (mergedVars.template as string) || undefined,
  );

  if (!skipPrompt) await runActionPromptCheckArgs(actionArgs, actionPromptCheckArgs);

  // Get files/folders to remove
  const paramArgsRmList = getArgsRmList(
    actionArgs,
    actionRmFileNames,
    actionDotFileNames,
  );

  // 處理 --monorepo flag（需要在問答之後處理，因為問答可能修改 actionArgs.monorepo 的值）
  const monorepoRmList =
    actionArgs.monorepo === true ? getRmFlagRmList(actionMonorepoFileNames) : [];

  const promptRmFlagRmList = skipPrompt ? [] : await runActionPromptArgRmFlag(actionArgs);
  const promptInputsRmList = skipPrompt
    ? []
    : await runActionPromptWhileInputsAddRmList(
        'Enter files/folders to remove (press double enter to skip):',
      );
  const finalRemoveList = paramArgsRmList
    .concat(monorepoRmList)
    .concat(promptRmFlagRmList)
    .concat(promptInputsRmList);

  // execList
  const paramArgsExecList = getExecList(actionArgs, actionExecList);
  const finalExecList = paramArgsExecList;

  const params: CreateProjectParams = {
    name: projectName,
    template,
    removeList: finalRemoveList,
    execList: finalExecList,
    isMonorepo: actionArgs.monorepo === true,
  };

  await createProject(params);
}

/**
 * 構建 removeList
 */
function buildRemoveList(actionArgs: ExtendedActionArgsType, mergedVars: ParsedVarsType) {
  // 從 actionArgs 獲取基本列表
  const paramArgsRmList = getArgsRmList(
    actionArgs,
    actionRmFileNames,
    actionDotFileNames,
  );

  // 處理 --monorepo flag
  let monorepoRmList: any[] = [];
  if (actionArgs.monorepo === true) {
    monorepoRmList = getRmFlagRmList(actionMonorepoFileNames);
  }

  // 從 mergedVars 獲取額外的 removeList
  let varsRemoveList: any[] = [];
  if (mergedVars.removeList && Array.isArray(mergedVars.removeList)) {
    varsRemoveList = (mergedVars.removeList as any[]).map((item) => ({
      field: String(item.field || ''),
      isRemove: Boolean(item.isRemove),
    }));
  }

  return paramArgsRmList.concat(monorepoRmList).concat(varsRemoveList);
}

/**
 * 構建 execList
 */
function buildExecList(actionArgs: ExtendedActionArgsType, mergedVars: ParsedVarsType) {
  // 從 actionArgs 獲取基本列表
  let paramArgsExecList = getExecList(actionArgs, actionExecList);

  // 從 mergedVars 獲取額外的 execList
  if (mergedVars.execList && Array.isArray(mergedVars.execList)) {
    const varsExecList = (mergedVars.execList as any[]).map((item) => ({
      key: String(item.key || ''),
      command: String(item.command || ''),
      isExec: Boolean(item.isExec),
    }));
    paramArgsExecList = paramArgsExecList.concat(varsExecList);
  }

  return paramArgsExecList;
}

export const actionExecList: RnuExecInfoType[] = [
  {
    key: 'gitInit',
    command: 'git init',
    isExec: true,
  },
  {
    key: 'npmInstall',
    command: 'npm install',
    isExec: true,
  },
];

export const actionDotFileNames = ['husky', 'github'];
export const actionRmFileNames = ['husky', 'github'];

export const actionPromptCheckArgs: PromptCheckArgsType[] = [
  { key: 'husky', message: 'Keep husky?' },
  { key: 'github', message: 'Keep GitHub Actions?' },
  {
    key: 'monorepo',
    message:
      'Enable monorepo mode? (Remove lock files, .npmrc, and packageManager field)',
  },
  { key: 'gitInit', message: 'Initialize git?' },
  { key: 'npmInstall', message: 'Install dependencies?' },
];

export const createActionCommand: ActionCommandType = {
  name: 'create',
  description: 'Create a new project from a git template (Default)',
  flagsOptions: [
    {
      flags: '-t, --template <repo>',
      description:
        'Template source, e.g. user/repo, git@domain:group/repo.git, ./local-folder',
    },
    {
      flags: '--skip-prompt',
      description: 'Skip prompt (deprecated, use --no-interaction)',
      defaultValue: false,
    },
    {
      flags: '--no-interaction, --ni',
      description: 'Non-interactive mode, skip all prompts',
      defaultValue: false,
    },
    {
      flags: '--yes, -y',
      description: 'Use defaults and skip confirmations when applicable',
      defaultValue: false,
    },
    {
      flags: '--vars <pairs...>',
      description:
        'Variables in key=value format, supports nested keys and arrays (can be used multiple times)',
      defaultValue: [],
    },
    {
      flags: '--vars-file <path>',
      description: 'Path to variables file (non-JSON, supports includes)',
    },
    {
      flags: '--strict',
      description: 'Strict mode: treat duplicate keys and type conflicts as errors',
      defaultValue: false,
    },
    {
      flags: '--rm <files...>',
      description: 'Remove files/folders after project creation',
      defaultValue: [],
    },
    {
      flags: '--no-husky',
      description: 'Remove .husky',
    },
    {
      flags: '--github',
      description: 'Keep .github/workflows',
      defaultValue: false,
    },
    {
      flags: '--git-init',
      description: 'Run git init after creation',
      defaultValue: false,
    },
    {
      flags: '--npm-install',
      description: 'Run npm install after creation',
      defaultValue: false,
    },
    {
      flags: '--monorepo',
      description:
        'Remove monorepo conflicting files (lock files, .npmrc, packageManager field)',
      defaultValue: false,
    },
  ],
  commandOptions: {
    isDefault: true,
  },
  action: createAction,
};
