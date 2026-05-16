import { RemoveFileInfoType } from '@/types';
import { promptArgsWhileInputs } from '@/utils/promptArgsWhileInputs';

export async function runActionPromptWhileInputsAddRmList(
  message: string,
): Promise<RemoveFileInfoType[]> {
  console.info('-------- Add remove files / folders');
  const inputs = await promptArgsWhileInputs(message);
  if (inputs.length === 0) {
    return [];
  }
  return inputs.map((field) => ({ field, isRemove: true }));
}
