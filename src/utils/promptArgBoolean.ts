import { OptionsType } from '@/types';
import inquirer from 'inquirer';

export async function promptArgBoolean(
  key: string,
  message: string,
  defaultValue: boolean,
) {
  const res: OptionsType = await inquirer.prompt([
    { type: 'confirm', name: key, message, default: defaultValue },
  ]);
  return res[key] ?? defaultValue;
}
