#!/usr/bin/env node

import { Command } from 'commander';
import { configs } from '@/configs';
import { createActionCommand } from '@/commands';
import { listAction } from '@/commands/listAction';

function main() {
  const program = new Command();

  program.name(configs.name).description(configs.description).version(configs.version);

  /* options */
  program
    .option('-l, --list', '列出所有可用的 templates')
    .option('--list-json', '以 JSON 格式列出所有可用的 templates')
    .option('--list-verbose', '列出所有可用的 templates（詳細模式）');

  /* command */
  const { action, description, flagsOptions, commandOptions } = createActionCommand;
  const programCommand = program.command('create [name]', commandOptions);
  programCommand.description(description);
  for (const flagsOption of flagsOptions) {
    const { flags, description, defaultValue } = flagsOption;
    programCommand.option(flags, description, defaultValue);
  }
  programCommand.action(action);

  // Check for list options before parsing
  program.hook('preAction', async (thisCommand) => {
    const opts = thisCommand.opts();

    if (opts.list || opts.listJson || opts.listVerbose) {
      await listAction({
        json: Boolean(opts.listJson),
        verbose: Boolean(opts.listVerbose || opts.list),
      });
      process.exit(0);
    }
  });

  program.parse(process.argv);
}

main();
