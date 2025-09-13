import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseVarsFile, validateVarsFile, createExampleVarsFile } from './varsFile';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('varsFile', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'varsFile-test-'));
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('parseVarsFile', () => {
    it('should parse basic dotenv style variables', () => {
      const filePath = join(tempDir, 'basic.vars');
      const content = `# Comment line
# Another comment
name=test-app
version=1.0.0

# Empty line above
template=user/repo`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        name: 'test-app',
        version: '1.0.0',
        template: 'user/repo',
      });
    });

    it('should parse nested keys and array indices', () => {
      const filePath = join(tempDir, 'nested.vars');
      const content = `removeList[0].field=README.md
removeList[0].isRemove=true
removeList[1].field=.github
removeList[1].isRemove=false
config.database.host=localhost
config.database.port=5432`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        removeList: [
          { field: 'README.md', isRemove: true },
          { field: '.github', isRemove: false },
        ],
        config: {
          database: {
            host: 'localhost',
            port: 5432,
          },
        },
      });
    });

    it('should handle @file value extraction', () => {
      const tokenFile = join(tempDir, 'token.txt');
      const varsFile = join(tempDir, 'with-file.vars');

      writeFileSync(tokenFile, 'secret-token-123\n');
      writeFileSync(
        varsFile,
        `token=@${tokenFile}
name=test-app`,
      );

      const result = parseVarsFile(varsFile);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        token: 'secret-token-123',
        name: 'test-app',
      });
    });

    it('should handle @file with relative path', () => {
      const tokenFile = join(tempDir, 'token.txt');
      const varsFile = join(tempDir, 'with-relative-file.vars');

      writeFileSync(tokenFile, 'relative-token');
      writeFileSync(
        varsFile,
        `token=@./token.txt
name=test-app`,
      );

      const result = parseVarsFile(varsFile);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        token: 'relative-token',
        name: 'test-app',
      });
    });

    it('should handle include: directive with relative paths', () => {
      const includedFile = join(tempDir, 'included.vars');
      const mainFile = join(tempDir, 'main.vars');

      writeFileSync(includedFile, 'includedVar=from-included\nsharedVar=included-value');
      writeFileSync(
        mainFile,
        `mainVar=from-main
include: ./included.vars
sharedVar=main-value`,
      );

      const result = parseVarsFile(mainFile);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        mainVar: 'from-main',
        includedVar: 'from-included',
        sharedVar: 'main-value', // main file value should override included
      });
    });

    it('should handle multi-level includes', () => {
      const level3File = join(tempDir, 'level3.vars');
      const level2File = join(tempDir, 'level2.vars');
      const level1File = join(tempDir, 'level1.vars');

      writeFileSync(level3File, 'level3=value3');
      writeFileSync(
        level2File,
        `level2=value2
include: ./level3.vars`,
      );
      writeFileSync(
        level1File,
        `level1=value1
include: ./level2.vars`,
      );

      const result = parseVarsFile(level1File);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        level1: 'value1',
        level2: 'value2',
        level3: 'value3',
      });
    });

    it('should detect circular includes', () => {
      const fileA = join(tempDir, 'a.vars');
      const fileB = join(tempDir, 'b.vars');

      writeFileSync(
        fileA,
        `varA=valueA
include: ./b.vars`,
      );
      writeFileSync(
        fileB,
        `varB=valueB
include: ./a.vars`,
      );

      const result = parseVarsFile(fileA);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Circular include detected');
      expect(result.errors[0]).toContain('a.vars');
      expect(result.errors[0]).toContain('b.vars');
    });

    it('should handle self-circular include', () => {
      const selfFile = join(tempDir, 'self.vars');

      writeFileSync(
        selfFile,
        `var=value
include: ./self.vars`,
      );

      const result = parseVarsFile(selfFile);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Circular include detected');
    });

    it('should handle invalid line format', () => {
      const filePath = join(tempDir, 'invalid.vars');
      const content = `valid=value
invalid-line-without-equals
another=valid`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid format');
      expect(result.errors[0]).toContain('invalid-line-without-equals');
      expect(result.vars).toEqual({
        valid: 'value',
        another: 'valid',
      });
    });

    it('should handle invalid array index', () => {
      const filePath = join(tempDir, 'invalid-array.vars');
      const content = `list[abc]=value
list[0]=valid`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid array index');
      expect(result.vars).toEqual({
        list: ['valid'],
      });
    });

    it('should handle unclosed bracket', () => {
      const filePath = join(tempDir, 'unclosed.vars');
      const content = `list[0.field=value
valid=value`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Unclosed bracket');
      expect(result.vars).toEqual({
        valid: 'value',
      });
    });

    it('should handle non-existent @file', () => {
      const filePath = join(tempDir, 'missing-file.vars');
      const content = `token=@./non-existent.txt
valid=value`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to read file');
      expect(result.vars).toEqual({
        valid: 'value',
      });
    });

    it('should handle non-existent include file', () => {
      const filePath = join(tempDir, 'missing-include.vars');
      const content = `main=value
include: ./non-existent.vars`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Vars file not found');
      expect(result.vars).toEqual({
        main: 'value',
      });
    });

    it('should handle empty include path', () => {
      const filePath = join(tempDir, 'empty-include.vars');
      const content = `main=value
include:
another=value`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Empty include path');
      expect(result.vars).toEqual({
        main: 'value',
        another: 'value',
      });
    });

    it('should handle non-existent file', () => {
      const nonExistentPath = join(tempDir, 'non-existent.vars');

      const result = parseVarsFile(nonExistentPath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Vars file not found');
      expect(result.vars).toEqual({});
    });

    it('should handle strict mode with duplicate keys', () => {
      const filePath = join(tempDir, 'strict.vars');
      const content = `name=first
name=second`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath, true);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((err) => err.includes('Duplicate key detected'))).toBe(
        true,
      );
    });

    it('should handle non-strict mode with duplicate keys', () => {
      const filePath = join(tempDir, 'non-strict.vars');
      const content = `name=first
name=second`;

      writeFileSync(filePath, content);
      const result = parseVarsFile(filePath, false);

      expect(result.errors).toHaveLength(0);
      expect(result.vars).toEqual({
        name: 'second',
      });
    });
  });

  describe('validateVarsFile', () => {
    it('should validate existing file', () => {
      const filePath = join(tempDir, 'exists.vars');
      writeFileSync(filePath, 'test=value');

      const result = validateVarsFile(filePath);

      expect(result.isValid).toBe(true);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should handle non-existent file with suggestions', () => {
      const nonExistentPath = join(tempDir, 'missing.vars');
      const suggestionPath = join(tempDir, '.stb.vars');
      writeFileSync(suggestionPath, 'test=value');

      const result = validateVarsFile(nonExistentPath);

      expect(result.isValid).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toContain('does not exist');
      expect(result.suggestions.some((s) => s.includes('.stb.vars'))).toBe(true);
    });

    it('should handle non-existent file without suggestions', () => {
      const nonExistentPath = join(tempDir, 'missing.vars');

      const result = validateVarsFile(nonExistentPath);

      expect(result.isValid).toBe(false);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]).toContain('does not exist');
    });
  });

  describe('createExampleVarsFile', () => {
    it('should create valid example content', () => {
      const example = createExampleVarsFile();

      expect(example).toContain('# Example vars file');
      expect(example).toContain('name=my-awesome-app');
      expect(example).toContain('template=user/repo');
      expect(example).toContain('removeList[0].field=README.md');
      expect(example).toContain('execList[0].key=gitInit');
      expect(example).toContain('include: ./common.vars');
    });

    it('should create parseable content', () => {
      const example = createExampleVarsFile();
      const filePath = join(tempDir, 'example.vars');

      // Remove comment lines and include lines for parsing test
      const cleanedExample = example
        .split('\n')
        .filter(
          (line) => !line.trim().startsWith('#') && !line.trim().startsWith('include:'),
        )
        .filter((line) => line.trim().length > 0)
        .join('\n');

      writeFileSync(filePath, cleanedExample);
      const result = parseVarsFile(filePath);

      expect(result.errors).toHaveLength(0);
      expect(result.vars.name).toBe('my-awesome-app');
      expect(result.vars.template).toBe('user/repo');
    });
  });
});
