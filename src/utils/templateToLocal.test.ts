import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { templateToLocal } from './templateToLocal';

describe('templateToLocal', () => {
  const tempRoots: string[] = [];

  const createTempDir = (prefix: string) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    tempRoots.push(dir);
    return dir;
  };

  afterEach(() => {
    for (const dir of tempRoots.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should remove .git metadata when copying from local template', () => {
    const sourceDir = createTempDir('template-source-');
    const targetDir = createTempDir('template-target-');

    fs.mkdirSync(path.join(sourceDir, '.git'), { recursive: true });
    fs.writeFileSync(path.join(sourceDir, '.git', 'HEAD'), 'ref: refs/heads/main\n');
    fs.writeFileSync(path.join(sourceDir, 'README.md'), '# template\n');

    templateToLocal(
      {
        repoUrl: sourceDir,
        ref: '',
        subdir: '',
        isGithub: false,
        isLocal: true,
      },
      targetDir,
    );

    expect(fs.existsSync(path.join(targetDir, '.git'))).toBe(false);
    expect(fs.readFileSync(path.join(targetDir, 'README.md'), 'utf-8')).toContain(
      'template',
    );
  });

  it('should remove common VCS metadata folders when copying from local template', () => {
    const sourceDir = createTempDir('template-source-');
    const targetDir = createTempDir('template-target-');

    fs.mkdirSync(path.join(sourceDir, '.hg'), { recursive: true });
    fs.mkdirSync(path.join(sourceDir, '.svn'), { recursive: true });
    fs.writeFileSync(path.join(sourceDir, 'index.ts'), 'export const ok = true;\n');

    templateToLocal(
      {
        repoUrl: sourceDir,
        ref: '',
        subdir: '',
        isGithub: false,
        isLocal: true,
      },
      targetDir,
    );

    expect(fs.existsSync(path.join(targetDir, '.hg'))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, '.svn'))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, 'index.ts'))).toBe(true);
  });
});
