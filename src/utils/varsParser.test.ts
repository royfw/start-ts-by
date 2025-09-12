import { describe, it, expect, afterEach } from 'vitest';
import { parseVars } from './varsParser';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('varsParser', () => {
  const testFilePath = join(__dirname, 'test-file.txt');

  afterEach(() => {
    // 清理測試檔案
    try {
      unlinkSync(testFilePath);
    } catch {
      // ignore
    }
  });

  describe('parseVars', () => {
    it('should parse simple key=value pairs', () => {
      const varsArray = ['name=test-app', 'version=1.0.0'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        name: 'test-app',
        version: '1.0.0',
      });
    });

    it('should parse comma-separated pairs', () => {
      const varsArray = ['name=test-app,version=1.0.0,debug=true'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        name: 'test-app',
        version: '1.0.0',
        debug: true,
      });
    });

    it('should convert boolean values', () => {
      const varsArray = ['isEnabled=true', 'isDisabled=false'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        isEnabled: true,
        isDisabled: false,
      });
    });

    it('should convert number values', () => {
      const varsArray = ['port=3000', 'version=1.5'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        port: 3000,
        version: 1.5,
      });
    });

    it('should handle nested keys', () => {
      const varsArray = ['config.database.host=localhost', 'config.database.port=5432'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        config: {
          database: {
            host: 'localhost',
            port: 5432,
          },
        },
      });
    });

    it('should handle array indices', () => {
      const varsArray = [
        'removeList[0].field=README.md',
        'removeList[0].isRemove=true',
        'removeList[1].field=.github',
        'removeList[1].isRemove=false',
      ];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        removeList: [
          {
            field: 'README.md',
            isRemove: true,
          },
          {
            field: '.github',
            isRemove: false,
          },
        ],
      });
    });

    it('should read file content with @ prefix', () => {
      // 創建測試檔案
      const fileContent = 'secret-token-123';
      writeFileSync(testFilePath, fileContent + '\n');

      const varsArray = [`token=@${testFilePath}`];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        token: fileContent, // 應該去除尾端換行
      });
    });

    it('should handle duplicate keys in non-strict mode', () => {
      const varsArray = ['name=first', 'name=second'];
      const result = parseVars(varsArray, false);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        name: 'second', // 最後一個值勝出
      });
    });

    it('should report duplicate keys in strict mode', () => {
      const varsArray = ['name=first', 'name=second'];
      const result = parseVars(varsArray, true);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some((err) => err.includes('Duplicate key detected: name')),
      ).toBe(true);
    });

    it('should handle invalid formats', () => {
      const varsArray = ['invalid-format', 'valid=value'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid format');
      expect(result.vars).toEqual({
        valid: 'value',
      });
    });

    it('should handle empty keys', () => {
      const varsArray = ['=value', 'valid=value'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Empty key');
      expect(result.vars).toEqual({
        valid: 'value',
      });
    });

    it('should handle file read errors', () => {
      const varsArray = ['token=@/non-existent-file.txt'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to read file');
    });

    it('should handle invalid array indices', () => {
      const varsArray = ['list[invalid].value=test'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid array index');
    });

    it('should handle unclosed brackets', () => {
      const varsArray = ['list[0.field=test'];
      const result = parseVars(varsArray);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Unclosed bracket');
    });
  });
});
