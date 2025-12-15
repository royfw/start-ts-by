import { describe, it, expect } from 'vitest';
import { getRmFlagRmList } from './getRmFlagRmList';
import { actionMonorepoFileNames } from '@/configs';

describe('getRmFlagRmList', () => {
  it('should convert string array to RemoveFileInfoType array', () => {
    const input = ['file1.txt', 'file2.md'];
    const result = getRmFlagRmList(input);

    expect(result).toEqual([
      { field: 'file1.txt', isRemove: true },
      { field: 'file2.md', isRemove: true },
    ]);
  });

  it('should handle empty array', () => {
    const result = getRmFlagRmList([]);
    expect(result).toEqual([]);
  });

  it('should handle monorepo files correctly', () => {
    const result = getRmFlagRmList(actionMonorepoFileNames);

    expect(result).toHaveLength(5);
    expect(result).toEqual([
      { field: 'pnpm-lock.yaml', isRemove: true },
      { field: 'pnpm-workspace.yaml', isRemove: true },
      { field: 'package-lock.json', isRemove: true },
      { field: 'yarn.lock', isRemove: true },
      { field: '.npmrc', isRemove: true },
    ]);
  });

  it('should set isRemove to true for all items', () => {
    const input = ['a', 'b', 'c'];
    const result = getRmFlagRmList(input);

    result.forEach((item) => {
      expect(item.isRemove).toBe(true);
    });
  });
});
