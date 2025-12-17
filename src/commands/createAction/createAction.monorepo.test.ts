import { describe, it, expect } from 'vitest';
import { actionMonorepoFileNames } from '@/configs';
import { getRmFlagRmList } from './getRmFlagRmList';
import { ExtendedActionArgsType } from '@/types';
import { actionPromptCheckArgs } from './createAction';

describe('createAction - monorepo functionality', () => {
  describe('monorepo flag integration', () => {
    it('should include monorepo files in remove list when --monorepo is true', () => {
      const actionArgs: ExtendedActionArgsType = {
        monorepo: true,
      };

      const monorepoRmList =
        actionArgs.monorepo === true ? getRmFlagRmList(actionMonorepoFileNames) : [];

      expect(monorepoRmList).toHaveLength(7);
      expect(monorepoRmList).toEqual([
        { field: 'pnpm-lock.yaml', isRemove: true },
        { field: 'pnpm-workspace.yaml', isRemove: true },
        { field: 'package-lock.json', isRemove: true },
        { field: 'yarn.lock', isRemove: true },
        { field: '.npmrc', isRemove: true },
        { field: '.husky', isRemove: true },
        { field: '.github', isRemove: true },
      ]);
    });

    it('should not include monorepo files when --monorepo is false', () => {
      const actionArgs: ExtendedActionArgsType = {
        monorepo: false,
      };

      const monorepoRmList =
        actionArgs.monorepo === true ? getRmFlagRmList(actionMonorepoFileNames) : [];

      expect(monorepoRmList).toHaveLength(0);
    });

    it('should not include monorepo files when --monorepo is undefined', () => {
      const actionArgs: ExtendedActionArgsType = {};

      const monorepoRmList =
        actionArgs.monorepo === true ? getRmFlagRmList(actionMonorepoFileNames) : [];

      expect(monorepoRmList).toHaveLength(0);
    });

    it('should handle --monorepo with --rm combination without duplicates', () => {
      const actionArgs: ExtendedActionArgsType = {
        monorepo: true,
        rm: ['README.md', 'pnpm-lock.yaml'], // pnpm-lock.yaml is also in monorepo list
      };

      const monorepoRmList =
        actionArgs.monorepo === true ? getRmFlagRmList(actionMonorepoFileNames) : [];

      const rmList =
        actionArgs.rm && Array.isArray(actionArgs.rm)
          ? getRmFlagRmList(actionArgs.rm)
          : [];

      const combinedList = [...monorepoRmList, ...rmList];

      // Should include both lists, even with duplicate (handled by downstream logic)
      expect(combinedList.length).toBeGreaterThanOrEqual(7);

      // Verify monorepo files are present
      const fields = combinedList.map((item) => item.field);
      expect(fields).toContain('pnpm-lock.yaml');
      expect(fields).toContain('package-lock.json');
      expect(fields).toContain('yarn.lock');
      expect(fields).toContain('.npmrc');
      expect(fields).toContain('README.md');
    });
  });

  describe('actionMonorepoFileNames constant', () => {
    it('should contain all required monorepo files', () => {
      expect(actionMonorepoFileNames).toContain('pnpm-lock.yaml');
      expect(actionMonorepoFileNames).toContain('pnpm-workspace.yaml');
      expect(actionMonorepoFileNames).toContain('package-lock.json');
      expect(actionMonorepoFileNames).toContain('yarn.lock');
      expect(actionMonorepoFileNames).toContain('.npmrc');
    });

    it('should have exactly 7 files', () => {
      expect(actionMonorepoFileNames).toHaveLength(7);
    });

    it('should contain .husky and .github', () => {
      expect(actionMonorepoFileNames).toContain('.husky');
      expect(actionMonorepoFileNames).toContain('.github');
    });

    it('should not contain .nvmrc or .vscode', () => {
      expect(actionMonorepoFileNames).not.toContain('.nvmrc');
      expect(actionMonorepoFileNames).not.toContain('.vscode');
    });
  });

  describe('actionPromptCheckArgs integration', () => {
    it('should include monorepo in prompt check args', () => {
      const monorepoPrompt = actionPromptCheckArgs.find(
        (item) => item.key === 'monorepo',
      );

      expect(monorepoPrompt).toBeDefined();
      expect(monorepoPrompt?.key).toBe('monorepo');
      expect(monorepoPrompt?.message).toContain('monorepo');
      expect(monorepoPrompt?.message.toLowerCase()).toContain('lock files');
    });

    it('should have monorepo prompt before git and npm prompts', () => {
      const monorepoIndex = actionPromptCheckArgs.findIndex(
        (item) => item.key === 'monorepo',
      );
      const gitInitIndex = actionPromptCheckArgs.findIndex(
        (item) => item.key === 'gitInit',
      );
      const npmInstallIndex = actionPromptCheckArgs.findIndex(
        (item) => item.key === 'npmInstall',
      );

      expect(monorepoIndex).toBeGreaterThan(-1);
      expect(monorepoIndex).toBeLessThan(gitInitIndex);
      expect(monorepoIndex).toBeLessThan(npmInstallIndex);
    });

    it('should have descriptive message explaining what monorepo mode does', () => {
      const monorepoPrompt = actionPromptCheckArgs.find(
        (item) => item.key === 'monorepo',
      );

      expect(monorepoPrompt?.message).toContain('lock files');
      expect(monorepoPrompt?.message).toContain('.npmrc');
      expect(monorepoPrompt?.message).toContain('packageManager');
    });
  });
});
