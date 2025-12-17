import inquirer from 'inquirer';
import { getAllTemplateSources, resolveTemplateValue } from '@/utils/registry/resolver';

export async function runActionPromptArgTemplateFlag(arg?: string) {
  const template: string | undefined = arg ? String(arg) : undefined;

  // 如果已經提供 template，直接返回
  if (template) {
    return template;
  }

  try {
    // 使用 while loop 支援返回上一層
    while (true) {
      // 載入所有 template 來源
      const sources = await getAllTemplateSources();

      // 第一層：選擇來源
      const sourceChoices = [
        ...sources.map((source) => ({
          name: `${source.name} (${source.templates.length} templates)`,
          value: source.type,
          short: source.name,
        })),
        {
          name: '🔗 Manual GitHub URL Input',
          value: 'manual',
          short: 'Manual Input',
        },
      ];

      const sourceResponse = await inquirer.prompt([
        {
          type: 'list',
          name: 'source',
          message: 'Choose template source:',
          choices: sourceChoices,
        },
      ]);

      // 處理取消（Ctrl+C）
      if (!sourceResponse.source) {
        console.error('❌ Template selection cancelled');
        process.exit(1);
      }

      // 手動輸入模式
      if (sourceResponse.source === 'manual') {
        const manualResponse = await inquirer.prompt([
          {
            type: 'input',
            name: 'template',
            message: 'Enter template (e.g., user/repo, user/repo/path, user/repo#tag):',
            validate: (value: string) => {
              if (value.length === 0) {
                return 'Template cannot be empty';
              }
              return true;
            },
          },
        ]);

        if (!manualResponse.template) {
          continue; // 返回第一層
        }

        // 顯示使用的 template
        console.log(`\n✅ Using template: ${manualResponse.template}\n`);

        return String(manualResponse.template);
      }

      // 第二層：從選定來源選擇具體 template
      const selectedSource = sources.find((s) => s.type === sourceResponse.source);
      if (!selectedSource || selectedSource.templates.length === 0) {
        console.error('❌ No templates available');
        process.exit(1);
      }

      const templateChoices = [
        ...selectedSource.templates.map((t) => ({
          name: `${t.title}${t.description ? ` - ${t.description}` : ''}`,
          value: t.value,
          short: t.title,
        })),
        {
          name: '← Back',
          value: '__back__',
          short: 'Back',
        },
      ];

      const templateResponse = await inquirer.prompt([
        {
          type: 'list',
          name: 'template',
          message: `Choose template from ${selectedSource.name}:`,
          choices: templateChoices,
        },
      ]);

      // 處理取消
      if (!templateResponse.template) {
        console.error('❌ Template selection cancelled');
        process.exit(1);
      }

      // 處理返回
      if (templateResponse.template === '__back__') {
        continue; // 返回第一層
      }

      // 解析 template 值為實際 URL
      const resolved = await resolveTemplateValue(String(templateResponse.template));

      if (!resolved.fullUrl) {
        console.error('❌ Failed to resolve template URL');
        continue; // 返回第一層重試
      }

      // 顯示組合後的 template 位置
      console.log(`\n✅ Using template: ${resolved.fullUrl}\n`);

      return resolved.fullUrl;
    }
  } catch (error) {
    console.error(
      '❌ Failed to load templates:',
      error instanceof Error ? error.message : String(error),
    );

    // Fallback to manual input mode
    console.log('\n⚠️  Falling back to manual input mode\n');
    const manualResponse = await inquirer.prompt([
      {
        type: 'input',
        name: 'template',
        message: 'Enter template (e.g., user/repo):',
        validate: (value: string) => {
          if (value.length === 0) {
            return 'Template cannot be empty';
          }
          return true;
        },
      },
    ]);

    if (!manualResponse.template) {
      console.error('❌ Invalid template name');
      process.exit(1);
    }

    // 顯示使用的 template
    console.log(`\n✅ Using template: ${manualResponse.template}\n`);

    return String(manualResponse.template);
  }
}
