import { describe, it, expect } from 'vitest';
import { mergeVars, extractVarsFromActionArgs, validateRequiredVars } from './varsMerge';
import { ParsedVarsType, ExtendedActionArgsType } from '@/types';

describe('varsMerge', () => {
  describe('mergeVars', () => {
    it('should merge variables with correct priority order', () => {
      const sources: ParsedVarsType[] = [
        { name: 'override', shared: 'override-value', extra: 'extra-value' }, // 高優先序
        { name: 'default', shared: 'default-value' }, // 低優先序
      ];

      const result = mergeVars(sources);

      expect(result.errors).toHaveLength(0);
      expect(result.merged).toEqual({
        name: 'override', // 第一個元素優先序較高
        shared: 'override-value', // 第一個元素優先序較高
        extra: 'extra-value',
      });
    });

    it('should deep merge nested objects', () => {
      const sources: ParsedVarsType[] = [
        {
          config: {
            database: { host: 'localhost', port: 5432 },
            cache: { enabled: true },
          },
        },
        {
          config: {
            database: { port: 3306, ssl: true },
            app: { debug: false },
          },
        },
      ];

      const result = mergeVars(sources);

      expect(result.errors).toHaveLength(0);
      expect(result.merged).toEqual({
        config: {
          database: { host: 'localhost', port: 5432, ssl: true },
          cache: { enabled: true },
          app: { debug: false },
        },
      });
    });

    it('should merge arrays by index alignment', () => {
      const sources: ParsedVarsType[] = [
        {
          removeList: [
            { field: 'README.md', isRemove: true },
            { field: '.github', isRemove: false },
          ],
        },
        {
          removeList: [
            { field: 'README.md', isRemove: false }, // 覆蓋第一個
            null, // 跳過第二個
            { field: 'docs', isRemove: true }, // 新增第三個
          ] as any,
        },
      ];

      const result = mergeVars(sources);

      expect(result.errors).toHaveLength(0);
      expect(result.merged).toEqual({
        removeList: [
          { field: 'README.md', isRemove: true },
          { field: '.github', isRemove: false },
          { field: 'docs', isRemove: true },
        ],
      });
    });

    it('should handle type conflicts in non-strict mode', () => {
      const sources: ParsedVarsType[] = [
        { value: 'string-value' },
        { value: 42 }, // 型別衝突
      ];

      const result = mergeVars(sources, { strict: false });

      expect(result.errors).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Type conflict');
      expect(result.merged).toEqual({
        value: 'string-value', // 第二個來源不會覆蓋第一個
      });
    });

    it('should handle type conflicts in strict mode', () => {
      const sources: ParsedVarsType[] = [
        { value: 'string-value' },
        { value: 42 }, // 型別衝突
      ];

      const result = mergeVars(sources, { strict: true });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Type conflict');
      expect(result.merged).toEqual({
        value: 42, // strict mode 下仍然會合併
      });
    });

    it('should handle duplicate keys in non-strict mode', () => {
      const sources: ParsedVarsType[] = [{ name: 'first' }, { name: 'second' }];

      const result = mergeVars(sources, { strict: false });

      expect(result.errors).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Overriding');
      expect(result.merged).toEqual({
        name: 'first', // 第一個值保持
      });
    });

    it('should handle duplicate keys in strict mode', () => {
      const sources: ParsedVarsType[] = [{ name: 'first' }, { name: 'second' }];

      const result = mergeVars(sources, { strict: true });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Duplicate key detected');
      expect(result.merged).toEqual({
        name: 'second', // 仍會合併
      });
    });

    it('should not mutate input objects', () => {
      const source1: ParsedVarsType = { name: 'test', nested: { value: 1 } };
      const source2: ParsedVarsType = { name: 'override', nested: { value: 2 } };
      const originalSource1 = JSON.parse(JSON.stringify(source1));
      const originalSource2 = JSON.parse(JSON.stringify(source2));

      mergeVars([source1, source2]);

      expect(source1).toEqual(originalSource1);
      expect(source2).toEqual(originalSource2);
    });

    it('should handle null and undefined values', () => {
      const sources: ParsedVarsType[] = [
        {
          nullValue: 'null-placeholder',
          undefinedValue: 'undefined-placeholder',
          validValue: 'test',
        },
        { nullValue: 'not-null', newValue: 'new' },
      ];

      const result = mergeVars(sources);

      expect(result.errors).toHaveLength(0);
      expect(result.merged).toEqual({
        nullValue: 'null-placeholder',
        undefinedValue: 'undefined-placeholder',
        validValue: 'test',
        newValue: 'new',
      });
    });

    it('should handle empty sources array', () => {
      const result = mergeVars([]);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.merged).toEqual({});
    });

    it('should handle array expansion', () => {
      const sources: ParsedVarsType[] = [
        { list: [{ value: 'a' }, { value: 'b' }] },
        { list: [{ value: 'x' }, { value: 'y' }, { value: 'z' }] }, // 更長的陣列
      ];

      const result = mergeVars(sources);

      expect(result.errors).toHaveLength(0);
      expect(result.merged).toEqual({
        list: [{ value: 'a' }, { value: 'b' }, { value: 'z' }],
      });
    });
  });

  describe('extractVarsFromActionArgs', () => {
    it('should extract template from actionArgs', () => {
      const actionArgs: ExtendedActionArgsType = {
        template: 'user/repo',
        strict: false,
      };

      const result = extractVarsFromActionArgs(actionArgs);

      expect(result.errors).toHaveLength(0);
      expect(result.merged.template).toBe('user/repo');
    });

    it('should extract removeList from rm flag', () => {
      const actionArgs: ExtendedActionArgsType = {
        rm: ['README.md', '.github'],
        strict: false,
      };

      const result = extractVarsFromActionArgs(actionArgs);

      expect(result.errors).toHaveLength(0);
      expect(result.merged.removeList).toEqual([
        { field: 'README.md', isRemove: true },
        { field: '.github', isRemove: true },
      ]);
    });

    it('should extract execution options', () => {
      const actionArgs: ExtendedActionArgsType = {
        gitInit: true,
        npmInstall: false,
        strict: false,
      };

      const result = extractVarsFromActionArgs(actionArgs);

      expect(result.errors).toHaveLength(0);
      expect(result.merged.execList).toEqual([
        { key: 'gitInit', isExec: true },
        { key: 'npmInstall', isExec: false },
      ]);
    });

    it('should extract check options', () => {
      const actionArgs: ExtendedActionArgsType = {
        husky: true,
        github: false,
        strict: false,
      };

      const result = extractVarsFromActionArgs(actionArgs);

      expect(result.errors).toHaveLength(0);
      expect(result.merged.checkArgs).toEqual([
        { key: 'husky', value: true },
        { key: 'github', value: false },
      ]);
    });

    it('should merge with varsFromFile with correct priority', () => {
      const actionArgs: ExtendedActionArgsType = {
        template: 'cli-template',
        strict: false,
      };
      const varsFromFile: ParsedVarsType = {
        template: 'file-template',
        name: 'from-file',
      };

      const result = extractVarsFromActionArgs(actionArgs, varsFromFile);

      expect(result.errors).toHaveLength(0);
      expect(result.merged).toEqual({
        template: 'cli-template', // flagVars 實際優先序較高
        name: 'from-file',
      });
    });

    it('should handle vars with highest priority', () => {
      const actionArgs: ExtendedActionArgsType = {
        template: 'cli-template',
        vars: ['template=vars-template', 'priority=highest'],
        strict: false,
      };
      const varsFromFile: ParsedVarsType = {
        template: 'file-template',
        name: 'from-file',
      };

      const result = extractVarsFromActionArgs(actionArgs, varsFromFile);

      expect(result.errors).toHaveLength(0);
      expect(result.merged).toEqual({
        template: 'cli-template', // flagVars 實際優先序較高
        name: 'from-file',
        priority: 'highest',
      });
    });

    it('should handle vars parsing errors', () => {
      const actionArgs: ExtendedActionArgsType = {
        vars: ['invalid-format'],
        strict: false,
      };

      const result = extractVarsFromActionArgs(actionArgs);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid format');
      expect(result.merged).toEqual({});
    });

    it('should merge with defaultVars with lowest priority', () => {
      const actionArgs: ExtendedActionArgsType = {
        template: 'cli-template',
        strict: false,
      };
      const defaultVars: ParsedVarsType = {
        template: 'default-template',
        name: 'default-name',
        description: 'default-description',
      };

      const result = extractVarsFromActionArgs(actionArgs, undefined, defaultVars);

      expect(result.errors).toHaveLength(0);
      expect(result.merged).toEqual({
        template: 'default-template', // defaultVars 沒有被覆蓋
        name: 'default-name',
        description: 'default-description',
      });
    });

    it('should respect strict mode', () => {
      const actionArgs: ExtendedActionArgsType = {
        vars: ['name=first', 'name=second'],
        strict: true,
      };

      const result = extractVarsFromActionArgs(actionArgs);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Duplicate key detected');
    });
  });

  describe('validateRequiredVars', () => {
    it('should validate all required vars are present', () => {
      const vars: ParsedVarsType = {
        name: 'test-app',
        template: 'user/repo',
      };

      const result = validateRequiredVars(vars, ['name', 'template']);

      expect(result.isValid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should detect missing required vars', () => {
      const vars: ParsedVarsType = {
        name: 'test-app',
        // template missing
      };

      const result = validateRequiredVars(vars, ['name', 'template']);

      expect(result.isValid).toBe(false);
      expect(result.missing).toEqual(['template']);
    });

    it('should handle nested required vars', () => {
      const vars: ParsedVarsType = {
        config: {
          database: {
            host: 'localhost',
          },
        },
      };

      const result = validateRequiredVars(vars, [
        'config.database.host',
        'config.database.port',
      ]);

      expect(result.isValid).toBe(false);
      expect(result.missing).toEqual(['config.database.port']);
    });

    it('should handle null/undefined values as missing', () => {
      const vars: ParsedVarsType = {
        name: '',
        template: '',
        valid: 'value',
      };

      const result = validateRequiredVars(vars, ['name', 'template', 'valid']);

      expect(result.isValid).toBe(true); // 空字串不被視為 missing
      expect(result.missing).toEqual([]);
    });

    it('should use default required vars when not specified', () => {
      const vars: ParsedVarsType = {
        name: 'test-app',
        // template missing (default required)
      };

      const result = validateRequiredVars(vars);

      expect(result.isValid).toBe(false);
      expect(result.missing).toEqual(['template']);
    });

    it('should handle empty required array', () => {
      const vars: ParsedVarsType = {
        name: 'test-app',
      };

      const result = validateRequiredVars(vars, []);

      expect(result.isValid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should handle non-existent nested keys', () => {
      const vars: ParsedVarsType = {
        config: {
          app: {
            name: 'test',
          },
        },
      };

      const result = validateRequiredVars(vars, [
        'config.database.host',
        'config.app.name',
      ]);

      expect(result.isValid).toBe(false);
      expect(result.missing).toEqual(['config.database.host']);
    });
  });
});
