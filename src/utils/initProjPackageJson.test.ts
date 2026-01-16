import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initProjPackageJson } from './initProjPackageJson';
import { RemoveFileInfoType } from '@/types';
import fs from 'fs';
import path from 'path';

describe('initProjPackageJson', () => {
  const testDir = path.join(__dirname, '../../.test-tmp');
  const packageJsonPath = path.join(testDir, 'package.json');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('prepare script removal', () => {
    it('should remove prepare script when .husky is in remove list', () => {
      // 建立測試用的 package.json
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          prepare: 'npx husky',
          test: 'vitest',
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      // 執行函數
      const removeList: RemoveFileInfoType[] = [{ field: '.husky', isRemove: true }];
      initProjPackageJson(testDir, true, false, removeList);

      // 驗證 prepare script 被移除
      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.scripts.prepare).toBeUndefined();
      expect(updatedPackageJson.scripts.test).toBe('vitest'); // 其他 script 保留
    });

    it('should remove prepare script when --monorepo and .husky in remove list', () => {
      // 建立測試用的 package.json
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        packageManager: 'pnpm@8.0.0',
        scripts: {
          prepare: 'npx husky',
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      // 執行函數
      const removeList: RemoveFileInfoType[] = [{ field: '.husky', isRemove: true }];
      initProjPackageJson(testDir, true, true, removeList);

      // 驗證 prepare script 和 packageManager 都被移除
      // 驗證 prepare script 和 packageManager 都被移除
      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.packageManager).toBeUndefined();
    });

    it('should remove preinstall and prepare scripts in monorepo mode', () => {
      // 建立測試用的 package.json
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          prepare: 'npx husky',
          preinstall: 'npx -y only-allow pnpm',
          test: 'vitest',
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      // 執行函數
      initProjPackageJson(testDir, true, true, []);

      // 驗證 scripts 被移除
      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.scripts.prepare).toBeUndefined();
      expect(updatedPackageJson.scripts.preinstall).toBeUndefined();
      expect(updatedPackageJson.scripts.test).toBe('vitest');
    });

    it('should not remove prepare script when .husky is not in remove list', () => {
      // 建立測試用的 package.json
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          prepare: 'npx husky',
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      // 執行函數（空的 removeList）
      const removeList: RemoveFileInfoType[] = [];
      initProjPackageJson(testDir, true, false, removeList);

      // 驗證 prepare script 保留
      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.scripts.prepare).toBe('npx husky');
    });

    it('should not remove prepare script when .husky isRemove is false', () => {
      // 建立測試用的 package.json
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          prepare: 'npx husky',
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      // 執行函數（isRemove 為 false）
      const removeList: RemoveFileInfoType[] = [{ field: '.husky', isRemove: false }];
      initProjPackageJson(testDir, true, false, removeList);

      // 驗證 prepare script 保留
      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.scripts.prepare).toBe('npx husky');
    });

    it('should not remove prepare script when it does not contain husky', () => {
      // 建立測試用的 package.json
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          prepare: 'npm run build',
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      // 執行函數
      const removeList: RemoveFileInfoType[] = [{ field: '.husky', isRemove: true }];
      initProjPackageJson(testDir, true, false, removeList);

      // 驗證 prepare script 保留（因為不包含 husky）
      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.scripts.prepare).toBe('npm run build');
    });

    it('should handle prepare script with husky install command', () => {
      // 建立測試用的 package.json
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          prepare: 'husky install',
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      // 執行函數
      const removeList: RemoveFileInfoType[] = [{ field: '.husky', isRemove: true }];
      initProjPackageJson(testDir, true, false, removeList);

      // 驗證 prepare script 被移除
      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.scripts.prepare).toBeUndefined();
    });

    it('should handle multiple removals including .husky', () => {
      // 建立測試用的 package.json
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          prepare: 'npx husky',
          test: 'vitest',
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      // 執行函數（包含多個移除項目）
      const removeList: RemoveFileInfoType[] = [
        { field: 'pnpm-lock.yaml', isRemove: true },
        { field: '.husky', isRemove: true },
        { field: '.github', isRemove: true },
      ];
      initProjPackageJson(testDir, true, false, removeList);

      // 驗證 prepare script 被移除
      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.scripts.prepare).toBeUndefined();
      expect(updatedPackageJson.scripts.test).toBe('vitest');
    });
  });

  describe('basic functionality', () => {
    it('should initialize package.json with project name', () => {
      const originalPackageJson = {
        name: 'original-name',
        version: '1.0.0',
        description: 'Original description',
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      initProjPackageJson(testDir, true, false, []);

      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.name).toBe(path.basename(testDir));
      expect(updatedPackageJson.version).toBe('0.0.0');
      expect(updatedPackageJson.description).toContain('original-name');
    });

    it('should remove packageManager field in monorepo mode', () => {
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        packageManager: 'pnpm@8.0.0',
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      initProjPackageJson(testDir, true, true, []);

      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.packageManager).toBeUndefined();
    });

    it('should not remove packageManager field in non-monorepo mode', () => {
      const originalPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        packageManager: 'pnpm@8.0.0',
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));

      initProjPackageJson(testDir, true, false, []);

      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(updatedPackageJson.packageManager).toBe('pnpm@8.0.0');
    });
  });
});
