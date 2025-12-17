/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listAction } from './listAction.js';
import type { TemplateSource } from '@/utils/registry/resolver';

// Mock dependencies
vi.mock('@/utils/registry/resolver', () => ({
  getAllTemplateSources: vi.fn(),
}));

describe('commands/listAction', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('listAction', () => {
    it('should list built-in templates', async () => {
      const { getAllTemplateSources } = await import('@/utils/registry/resolver');

      const mockSources: TemplateSource[] = [
        {
          type: 'builtin',
          name: 'Built-in Templates',
          templates: [
            {
              id: 'lib',
              title: 'TypeScript Library',
              value: 'builtin:user/repo1',
              description: 'GitHub: user/repo1',
            },
            {
              id: 'app',
              title: 'TypeScript Application',
              value: 'builtin:user/repo2',
              description: 'GitHub: user/repo2',
            },
          ],
        },
      ];

      vi.mocked(getAllTemplateSources).mockResolvedValue(mockSources);

      await listAction();

      expect(getAllTemplateSources).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalled();

      // 驗證輸出包含正確的內容
      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('📦 Available Templates:');
      expect(output).toContain('📌 Built-in Templates (builtin)');
      expect(output).toContain('TypeScript Library');
      expect(output).toContain('TypeScript Application');
      expect(output).toContain('✨ Total 2 template(s) from 1 source(s)');
    });

    it('should list external registry templates', async () => {
      const { getAllTemplateSources } = await import('@/utils/registry/resolver');

      const mockSources: TemplateSource[] = [
        {
          type: 'builtin',
          name: 'Built-in Templates',
          templates: [
            {
              id: 'lib',
              title: 'TypeScript Library',
              value: 'builtin:user/repo1',
              description: 'GitHub: user/repo1',
            },
          ],
        },
        {
          type: 'registry',
          name: 'start-ts-templates',
          templates: [
            {
              id: 'app-tsdown',
              title: 'App (tsdown)',
              value: 'registry:start-ts-templates:app-tsdown',
              description: 'templates/app-tsdown',
            },
            {
              id: 'lib',
              title: 'Library',
              value: 'registry:start-ts-templates:lib',
              description: 'templates/lib',
            },
          ],
        },
      ];

      vi.mocked(getAllTemplateSources).mockResolvedValue(mockSources);

      await listAction();

      expect(getAllTemplateSources).toHaveBeenCalledTimes(1);

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('📌 Built-in Templates (builtin)');
      expect(output).toContain('🌐 start-ts-templates (registry)');
      expect(output).toContain('App (tsdown)');
      expect(output).toContain('Library');
      expect(output).toContain('✨ Total 3 template(s) from 2 source(s)');
    });

    it('should output in JSON format', async () => {
      const { getAllTemplateSources } = await import('@/utils/registry/resolver');

      const mockSources: TemplateSource[] = [
        {
          type: 'builtin',
          name: 'Built-in Templates',
          templates: [
            {
              id: 'lib',
              title: 'TypeScript Library',
              value: 'builtin:user/repo1',
              description: 'GitHub: user/repo1',
            },
          ],
        },
      ];

      vi.mocked(getAllTemplateSources).mockResolvedValue(mockSources);

      await listAction({ json: true });

      expect(getAllTemplateSources).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);

      expect(parsed).toEqual(mockSources);
    });

    it('should show detailed information in verbose mode', async () => {
      const { getAllTemplateSources } = await import('@/utils/registry/resolver');

      const mockSources: TemplateSource[] = [
        {
          type: 'builtin',
          name: 'Built-in Templates',
          templates: [
            {
              id: 'lib',
              title: 'TypeScript Library',
              value: 'builtin:user/repo1',
              description: '基礎的 TypeScript library 模板',
            },
          ],
        },
      ];

      vi.mocked(getAllTemplateSources).mockResolvedValue(mockSources);

      await listAction({ verbose: true });

      expect(getAllTemplateSources).toHaveBeenCalledTimes(1);

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('TypeScript Library');
      expect(output).toContain('基礎的 TypeScript library 模板');
    });

    it('should handle empty templates list', async () => {
      const { getAllTemplateSources } = await import('@/utils/registry/resolver');

      const mockSources: TemplateSource[] = [
        {
          type: 'builtin',
          name: 'Built-in Templates',
          templates: [],
        },
      ];

      vi.mocked(getAllTemplateSources).mockResolvedValue(mockSources);

      await listAction();

      expect(getAllTemplateSources).toHaveBeenCalledTimes(1);

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('(no templates available)');
      expect(output).toContain('✨ Total 0 template(s) from 1 source(s)');
    });

    it('should handle loading errors', async () => {
      const { getAllTemplateSources } = await import('@/utils/registry/resolver');

      const mockError = new Error('Network error');
      vi.mocked(getAllTemplateSources).mockRejectedValue(mockError);

      await expect(listAction()).rejects.toThrow('process.exit called');

      expect(getAllTemplateSources).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Failed to load templates:',
        'Network error',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error type errors', async () => {
      const { getAllTemplateSources } = await import('@/utils/registry/resolver');

      vi.mocked(getAllTemplateSources).mockRejectedValue('String error');

      await expect(listAction()).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Failed to load templates:',
        'String error',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle templates without description', async () => {
      const { getAllTemplateSources } = await import('@/utils/registry/resolver');

      const mockSources: TemplateSource[] = [
        {
          type: 'builtin',
          name: 'Built-in Templates',
          templates: [
            {
              id: 'lib',
              title: 'TypeScript Library',
              value: 'builtin:user/repo1',
            },
          ],
        },
      ];

      vi.mocked(getAllTemplateSources).mockResolvedValue(mockSources);

      await listAction({ verbose: true });

      expect(getAllTemplateSources).toHaveBeenCalledTimes(1);

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('TypeScript Library');
      // 驗證不會因為缺少 description 而出錯
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
