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
import { runActionPromptArgTemplateFlag } from './runActionPromptArgTemplateFlag';
import { runActionPromptName } from './runActionPromptName';
import { getArgsRmList } from './getArgsRmList';
import { getExecList } from './getExecList';
import { runActionPromptCheckArgs } from './runActionPromptCheckArgs';
import { runActionPromptArgRmFlag } from './runActionPromptArgRmFlag';
import { runActionPromptWhileInputsAddRmList } from './runActionPromptWhileInputsAddRmList';
import { getRmFlagRmList } from './getRmFlagRmList';

const monorepoFileNames = [
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'package-lock.json',
  'yarn.lock',
  '.npmrc',
  '.husky',
  '.github',
];

const rmDotKeys = ['husky', 'github'];

const execCommands: { key: string; command: string }[] = [
  { key: 'gitInit', command: 'git init' },
  { key: 'npmInstall', command: 'npm install' },
];

export async function createAction(name?: string, actionArgs?: ActionArgsType) {
  try {
    console.log('🚀 Creating project...');
    const args = (actionArgs ?? {}) as ExtendedActionArgsType;

    // 檢查非互動模式
    const noInteraction = !!(args.noInteraction || args.ni || args.skipPrompt);

    // 顯示 deprecated 警告
    if (args.skipPrompt && !args.noInteraction && !args.ni) {
      console.log(
        '⚠️  --skip-prompt is deprecated, please use --no-interaction or --ni instead',
      );
    }

    // 準備變數合併
    let varsFromFile: ParsedVarsType = {};
    let mergedVars: ParsedVarsType = {};

    // 處理 --vars-file
    if (args.varsFile) {
      const varsFileResult = parseVarsFile(args.varsFile, !!args.strict);

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
    const mergeResult = extractVarsFromActionArgs(args, varsFromFile);

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
      return runNonInteractiveMode(name, args, mergedVars);
    } else {
      return await runInteractiveMode(name, args, mergedVars);
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
function runNonInteractiveMode(
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

  createProject(params);
}

/**
 * 執行互動模式（保持原有邏輯）
 */
async function runInteractiveMode(
  name: string | undefined,
  actionArgs: ExtendedActionArgsType,
  mergedVars: ParsedVarsType,
) {
  const projectName = await runActionPromptName(
    name || (mergedVars.name as string) || undefined,
  );

  const template = await runActionPromptArgTemplateFlag(
    (actionArgs.template as string) || (mergedVars.template as string) || undefined,
  );

  await runActionPromptCheckArgs(actionArgs, actionPromptCheckArgs);

  // Get files/folders to remove
  const paramArgsRmList = getArgsRmList(actionArgs, rmDotKeys, rmDotKeys);

  // 處理 --monorepo flag
  const monorepoRmList =
    actionArgs.monorepo === true ? getRmFlagRmList(monorepoFileNames) : [];

  const promptRmFlagRmList = await runActionPromptArgRmFlag(actionArgs);
  const promptInputsRmList = await runActionPromptWhileInputsAddRmList(
    'Enter files/folders to remove (press double enter to skip):',
  );
  const finalRemoveList = paramArgsRmList
    .concat(monorepoRmList)
    .concat(promptRmFlagRmList)
    .concat(promptInputsRmList);

  // execList
  const finalExecList = getExecList(actionArgs, actionExecList);

  const params: CreateProjectParams = {
    name: projectName,
    template,
    removeList: finalRemoveList,
    execList: finalExecList,
    isMonorepo: actionArgs.monorepo === true,
  };

  createProject(params);
}

/**
 * 構建 removeList
 */
function buildRemoveList(actionArgs: ExtendedActionArgsType, mergedVars: ParsedVarsType) {
  // 從 actionArgs 獲取基本列表
  const paramArgsRmList = getArgsRmList(actionArgs, rmDotKeys, rmDotKeys);

  // 處理 --monorepo flag
  const monorepoRmList =
    actionArgs.monorepo === true ? getRmFlagRmList(monorepoFileNames) : [];

  // 從 mergedVars 獲取額外的 removeList
  let varsRemoveList: Array<{ field: string; isRemove: boolean }> = [];
  if (mergedVars.removeList && Array.isArray(mergedVars.removeList)) {
    varsRemoveList = (
      mergedVars.removeList as Array<{ field?: unknown; isRemove?: unknown }>
    ).map((item) => ({
      field: typeof item.field === 'string' ? item.field : '',
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
    const varsExecList = (
      mergedVars.execList as Array<{ key?: unknown; command?: unknown; isExec?: unknown }>
    ).map((item) => ({
      key: typeof item.key === 'string' ? item.key : '',
      command: typeof item.command === 'string' ? item.command : '',
      isExec: Boolean(item.isExec),
    }));
    paramArgsExecList = paramArgsExecList.concat(varsExecList);
  }

  return paramArgsExecList;
}

const actionExecList: RnuExecInfoType[] = execCommands.map(({ key, command }) => ({
  key,
  command,
  isExec: true,
}));

export const actionPromptCheckArgs: PromptCheckArgsType[] = [
  { key: 'husky', message: 'Keep husky?' },
  { key: 'github', message: 'Keep GitHub Actions?' },
  {
    key: 'monorepo',
    message:
      'Enable monorepo mode? (Remove lock files, workspace config, .npmrc, and packageManager field)',
  },
  ...execCommands.map(({ key }) => ({
    key,
    message: key === 'gitInit' ? 'Initialize git?' : 'Install dependencies?',
  })),
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
        'Remove monorepo conflicting files (lock files, workspace config, .npmrc, .husky, .github, packageManager field, prepare script)',
      defaultValue: false,
    },
  ],
  commandOptions: {
    isDefault: true,
  },
  action: createAction,
};
