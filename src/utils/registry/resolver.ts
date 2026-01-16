import { configs } from '@/configs.js';
import { loadRegistryConfig } from './config.js';
import { loadRegistry } from './loader.js';
import { Registry, ResolvedTemplate, RegistryTemplate } from './types.js';

/**
 * Template 來源介面
 */
export interface TemplateSource {
  type: 'builtin' | 'registry' | 'manual';
  name: string;
  templates: Array<{
    id: string;
    title: string;
    value: string;
    description?: string;
  }>;
}

/**
 * 取得所有 template 來源
 * @returns Promise<TemplateSource[]>
 */
export async function getAllTemplateSources(): Promise<TemplateSource[]> {
  const sources: TemplateSource[] = [];

  // 1. 載入外部 registries
  const registryConfig = loadRegistryConfig();
  const enabledRegistries = registryConfig.registries.filter((r) => r.enabled !== false);

  for (const registrySource of enabledRegistries) {
    try {
      const registry = await loadRegistry(registrySource.url, registryConfig);

      const registryTemplates = registry.templates.map((t: RegistryTemplate) => ({
        id: t.id,
        title: t.title,
        value: `registry:${registrySource.name}:${t.id}`,
        description: t.description || `${t.path}`,
      }));

      sources.push({
        type: 'registry',
        name: '(Registry) ' + registrySource.name,
        templates: registryTemplates,
      });
    } catch (error) {
      // 載入失敗時顯示警告但不中斷流程
      console.warn(`⚠️  Warning: Failed to load registry "${registrySource.name}"`);
      if (error instanceof Error) {
        console.warn(`   Error: ${error.message}`);
      }
    }
  }

  // 2. 載入內建 templates
  const builtinTemplates = configs.templates.map((t) => ({
    id: t.repo,
    title: t.name,
    value: `builtin:${t.repo}`,
    description: `GitHub: ${t.repo}`,
  }));

  sources.push({
    type: 'builtin',
    name: '(Default) Built-in Templates',
    templates: builtinTemplates,
  });

  return sources;
}

/**
 * 解析 template 值為實際的 template 資訊
 * @param value - template 值 (格式: builtin:repo 或 registry:name:id)
 * @returns Promise<ResolvedTemplate>
 */
export async function resolveTemplateValue(value: string): Promise<ResolvedTemplate> {
  // 處理內建 template
  if (value.startsWith('builtin:')) {
    const repo = value.replace('builtin:', '');
    return {
      source: 'builtin',
      template: repo,
      fullUrl: repo,
    };
  }

  // 處理 registry template
  if (value.startsWith('registry:')) {
    const parts = value.split(':');
    if (parts.length !== 3) {
      throw new Error(`Invalid registry template value: ${value}`);
    }

    const [, registryName, templateId] = parts;

    // 載入 registry
    const registryConfig = loadRegistryConfig();
    const registrySource = registryConfig.registries.find((r) => r.name === registryName);

    if (!registrySource) {
      throw new Error(`Registry not found: ${registryName}`);
    }

    const registry = await loadRegistry(registrySource.url, registryConfig);
    const template = registry.templates.find(
      (t: RegistryTemplate) => t.id === templateId,
    );

    if (!template) {
      throw new Error(`Template not found: ${templateId} in registry ${registryName}`);
    }

    // 構建完整的 GitHub URL
    const fullUrl = buildGitHubUrl(registry, template);

    return {
      source: 'registry',
      registryName,
      template,
      fullUrl,
    };
  }

  // 處理手動輸入（直接返回作為 GitHub URL）
  return {
    source: 'manual',
    template: value,
    fullUrl: value,
  };
}

/**
 * 構建完整的 GitHub URL
 * @param registry - Registry 物件
 * @param template - Template 物件
 * @returns 完整的 GitHub URL
 */
function buildGitHubUrl(registry: Registry, template: RegistryTemplate): string {
  const { repo, defaultRef } = registry;
  const { path } = template;

  // 格式: user/repo#ref/path
  if (path) {
    return `${repo}#${defaultRef}/${path}`;
  }

  // 格式: user/repo#ref
  return `${repo}#${defaultRef}`;
}
