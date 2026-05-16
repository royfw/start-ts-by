import { ActionArgsType, PromptCheckArgsType } from '@/types';
import { promptArgBoolean } from '@/utils/promptArgBoolean';

export async function runActionPromptCheckArgs(
  actionArgsParams: ActionArgsType,
  promptCheckArgs: PromptCheckArgsType[] = [],
) {
  console.info('-------- Check CLI flags');
  for (const item of promptCheckArgs) {
    const { key, message } = item;
    const value = actionArgsParams[key];
    if (value === undefined) continue;
    if (typeof value !== 'boolean') continue;
    const promptValue = await promptArgBoolean(key, message, value);
    actionArgsParams[key] = promptValue as string | boolean | string[] | undefined;
  }
}
