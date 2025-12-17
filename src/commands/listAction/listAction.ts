import { getAllTemplateSources } from '@/utils/registry/resolver';
import type { TemplateSource } from '@/utils/registry/resolver';

export interface ListOptions {
  json?: boolean; // 是否以 JSON 格式輸出
  verbose?: boolean; // 是否顯示詳細資訊
}

export async function listAction(options: ListOptions = {}): Promise<void> {
  try {
    const sources = await getAllTemplateSources();

    if (options.json) {
      // JSON 格式輸出
      console.log(JSON.stringify(sources, null, 2));
      return;
    }

    // 人類可讀的格式輸出
    printTemplateSources(sources, options.verbose);
  } catch (error) {
    console.error(
      '❌ Failed to load templates:',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

function printTemplateSources(sources: TemplateSource[], verbose = false): void {
  console.log('\n📦 Available Templates:\n');

  sources.forEach((source, index) => {
    // 來源標題
    const sourceIcon = source.type === 'builtin' ? '📌' : '🌐';
    console.log(`${sourceIcon} ${source.name} (${source.type})`);

    if (source.templates.length === 0) {
      console.log('  └─ (no templates available)');
    } else {
      // 列出該來源的所有 templates
      source.templates.forEach((template, tIndex) => {
        const isLast = tIndex === source.templates.length - 1;
        const prefix = isLast ? '  └─' : '  ├─';

        if (verbose && template.description) {
          console.log(`${prefix} ${template.title}`);
          console.log(`     ${template.description}`);
        } else {
          console.log(`${prefix} ${template.title}`);
        }
      });
    }

    // 來源之間的分隔
    if (index < sources.length - 1) {
      console.log('');
    }
  });

  // 總計
  const totalTemplates = sources.reduce((sum, s) => sum + s.templates.length, 0);
  console.log(
    `\n✨ Total ${totalTemplates} template(s) from ${sources.length} source(s)\n`,
  );
}
