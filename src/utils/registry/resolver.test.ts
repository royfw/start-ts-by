import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllTemplateSources, resolveTemplateValue } from './resolver.js';
import type { Registry } from './types.js';

// Mock dependencies
vi.mock('@/configs.js', () => ({
  configs: {
    templates: [
      { name: 'Test Template 1', repo: 'user/repo1' },
      { name: 'Test Template 2', repo: 'user/repo2' },
    ],
  },
}));

vi.mock('./config.js', () => ({
  loadRegistryConfig: vi.fn(() => ({
    registries: [],
    cacheDir: '.cache/registries',
    cacheTTL: 3600000,
  })),
}));

vi.mock('./loader.js', () => ({
  loadRegistry: vi.fn(),
}));

describe('registry/resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllTemplateSources', () => {
    it('should load built-in templates', async () => {
      const sources = await getAllTemplateSources();

      expect(sources).toHaveLength(1);
      expect(sources[0].type).toBe('builtin');
      expect(sources[0].name).toBe('(Default) Built-in Templates');
      expect(sources[0].templates).toHaveLength(2);
      expect(sources[0].templates[0].id).toBe('user/repo1');
      expect(sources[0].templates[0].title).toBe('Test Template 1');
      expect(sources[0].templates[0].value).toBe('builtin:user/repo1');
    });

    it('should handle empty built-in templates', async () => {
      const { loadRegistryConfig } = await import('./config.js');
      vi.mocked(loadRegistryConfig).mockReturnValue({
        registries: [],
        cacheDir: '.cache/registries',
        cacheTTL: 3600000,
      });

      const sources = await getAllTemplateSources();
      expect(sources[0].type).toBe('builtin');
    });
  });

  describe('resolveTemplateValue', () => {
    it('should resolve built-in template', async () => {
      const resolved = await resolveTemplateValue('builtin:user/repo');

      expect(resolved.source).toBe('builtin');
      expect(resolved.template).toBe('user/repo');
      expect(resolved.fullUrl).toBe('user/repo');
    });

    it('should resolve manually entered template', async () => {
      const resolved = await resolveTemplateValue('manual-user/manual-repo');

      expect(resolved.source).toBe('manual');
      expect(resolved.template).toBe('manual-user/manual-repo');
      expect(resolved.fullUrl).toBe('manual-user/manual-repo');
    });

    it('should resolve registry template', async () => {
      const { loadRegistryConfig } = await import('./config.js');
      const { loadRegistry } = await import('./loader.js');

      vi.mocked(loadRegistryConfig).mockReturnValue({
        registries: [
          {
            name: 'test-registry',
            url: 'https://example.com/registry.json',
            enabled: true,
          },
        ],
        cacheDir: '.cache/registries',
        cacheTTL: 3600000,
      });

      const mockRegistry: Registry = {
        repo: 'registry-user/registry-repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template1',
            path: 'templates/template1',
            title: 'Template 1',
          },
        ],
      };

      vi.mocked(loadRegistry).mockResolvedValue(mockRegistry);

      const resolved = await resolveTemplateValue('registry:test-registry:template1');

      expect(resolved.source).toBe('registry');
      expect(resolved.registryName).toBe('test-registry');
      expect(resolved.fullUrl).toBe(
        'registry-user/registry-repo#main/templates/template1',
      );
    });

    it('should throw error when registry does not exist', async () => {
      const { loadRegistryConfig } = await import('./config.js');

      vi.mocked(loadRegistryConfig).mockReturnValue({
        registries: [],
        cacheDir: '.cache/registries',
        cacheTTL: 3600000,
      });

      await expect(
        resolveTemplateValue('registry:non-existent:template1'),
      ).rejects.toThrow('Registry not found');
    });

    it('should throw error when template does not exist', async () => {
      const { loadRegistryConfig } = await import('./config.js');
      const { loadRegistry } = await import('./loader.js');

      vi.mocked(loadRegistryConfig).mockReturnValue({
        registries: [
          {
            name: 'test-registry',
            url: 'https://example.com/registry.json',
            enabled: true,
          },
        ],
        cacheDir: '.cache/registries',
        cacheTTL: 3600000,
      });

      const mockRegistry: Registry = {
        repo: 'registry-user/registry-repo',
        defaultRef: 'main',
        templates: [],
      };

      vi.mocked(loadRegistry).mockResolvedValue(mockRegistry);

      await expect(
        resolveTemplateValue('registry:test-registry:non-existent'),
      ).rejects.toThrow('Template not found');
    });
  });
});
