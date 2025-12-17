#!/usr/bin/env node

import { Command } from 'commander';
import { configs } from '@/configs';
import { createActionCommand } from '@/commands';
import { listAction } from '@/commands/listAction';
import { setProgramCommand } from '@/utils';

function main() {
  const program = new Command();

  program.name(configs.name).description(configs.description).version(configs.version);

  /* options */
  program
    .option('-l, --list', '列出所有可用的 templates')
    .option('--list-json', '以 JSON 格式列出所有可用的 templates')
    .option('--list-verbose', '列出所有可用的 templates（詳細模式）');

  /* command */
  setProgramCommand(program, 'create [name]', createActionCommand);

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
