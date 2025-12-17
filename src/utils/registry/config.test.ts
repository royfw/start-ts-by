import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { resolve } from 'path';
import { loadRegistryConfig, getDefaultRegistryConfigPath } from './config.js';
import { RegistryConfig } from './types.js';

const TEST_CONFIG_DIR = resolve(process.cwd(), '.test-config');
const TEST_CONFIG_PATH = resolve(TEST_CONFIG_DIR, 'registry-config.json');

describe('registry/config', () => {
  beforeEach(() => {
    // Create test directory
    if (!existsSync(TEST_CONFIG_DIR)) {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
  });

  describe('getDefaultRegistryConfigPath', () => {
    it('should return default registry-config.json path', () => {
      const path = getDefaultRegistryConfigPath();
      expect(path).toContain('registry-config.json');
      expect(path).not.toContain('src');
    });
  });

  describe('loadRegistryConfig', () => {
    it('should return default config when file does not exist', () => {
      const config = loadRegistryConfig('/non-existent-path/config.json');
      expect(config).toEqual({
        registries: [],
        cacheDir: '.cache/registries',
        cacheTTL: 3600000,
      });
    });

    it('should successfully load valid config file', () => {
      const validConfig: RegistryConfig = {
        registries: [
          {
            name: 'test-registry',
            url: 'https://example.com/registry.json',
            enabled: true,
          },
        ],
        cacheDir: '.custom-cache',
        cacheTTL: 7200000,
      };

      writeFileSync(TEST_CONFIG_PATH, JSON.stringify(validConfig, null, 2));

      const config = loadRegistryConfig(TEST_CONFIG_PATH);
      expect(config).toEqual(validConfig);
    });

    it('should merge default values when partial config is missing', () => {
      const partialConfig = {
        registries: [
          {
            name: 'test-registry',
            url: 'https://example.com/registry.json',
          },
        ],
      };

      writeFileSync(TEST_CONFIG_PATH, JSON.stringify(partialConfig, null, 2));

      const config = loadRegistryConfig(TEST_CONFIG_PATH);
      expect(config.registries).toEqual(partialConfig.registries);
      expect(config.cacheDir).toBe('.cache/registries');
      expect(config.cacheTTL).toBe(3600000);
    });

    it('should handle empty config file', () => {
      writeFileSync(TEST_CONFIG_PATH, JSON.stringify({}, null, 2));

      const config = loadRegistryConfig(TEST_CONFIG_PATH);
      expect(config).toEqual({
        registries: [],
        cacheDir: '.cache/registries',
        cacheTTL: 3600000,
      });
    });

    it('should return default config when JSON format is invalid', () => {
      writeFileSync(TEST_CONFIG_PATH, 'invalid json content');

      const config = loadRegistryConfig(TEST_CONFIG_PATH);
      expect(config).toEqual({
        registries: [],
        cacheDir: '.cache/registries',
        cacheTTL: 3600000,
      });
    });

    it('should use default path when no path is provided', () => {
      const config = loadRegistryConfig();
      // Should not throw error and return default config (assuming default path does not exist)
      expect(config).toBeDefined();
      expect(config.registries).toBeDefined();
      expect(config.cacheDir).toBeDefined();
      expect(config.cacheTTL).toBeDefined();
    });

    it('should handle registry with enabled field set to false', () => {
      const configWithDisabled: RegistryConfig = {
        registries: [
          {
            name: 'enabled-registry',
            url: 'https://example.com/enabled.json',
            enabled: true,
          },
          {
            name: 'disabled-registry',
            url: 'https://example.com/disabled.json',
            enabled: false,
          },
        ],
        cacheDir: '.cache/registries',
        cacheTTL: 3600000,
      };

      writeFileSync(TEST_CONFIG_PATH, JSON.stringify(configWithDisabled, null, 2));

      const config = loadRegistryConfig(TEST_CONFIG_PATH);
      expect(config.registries).toHaveLength(2);
      expect(config.registries[0].enabled).toBe(true);
      expect(config.registries[1].enabled).toBe(false);
    });
  });
});
