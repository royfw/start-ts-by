import { cpSync, existsSync, mkdirSync, rmSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';
import { ParsedTemplateType } from '@/types';

const vcsMetaPaths = ['.git', '.hg', '.svn'];

function removeVcsMetadata(targetDir: string) {
  for (const metaPath of vcsMetaPaths) {
    const fullPath = join(targetDir, metaPath);
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true, force: true });
    }
  }
}

function isGitRepo(dir: string): boolean {
  return existsSync(join(dir, '.git'));
}

function copyGitTrackedFiles(srcDir: string, targetDir: string, subdir: string) {
  const tracked = execSync('git ls-files', { cwd: srcDir }).toString().trim();
  if (!tracked) return;

  const files = tracked.split(/\r?\n/);

  for (const file of files) {
    const srcFile = join(srcDir, file);
    const relPath = relative(subdir, file);
    if (relPath.startsWith('..')) continue;
    const destFile = join(targetDir, relPath);
    if (statSync(srcFile, { throwIfNoEntry: false })?.isFile()) {
      mkdirSync(join(destFile, '..'), { recursive: true });
      cpSync(srcFile, destFile);
    }
  }
}

export function templateToLocal(parsed: ParsedTemplateType, targetDir: string) {
  if (parsed.isLocal) {
    // ==== Local Path ====
    const baseDir = parsed.repoUrl;
    let fromDir = baseDir;
    if (parsed.subdir) {
      fromDir = join(baseDir, parsed.subdir);
      if (!existsSync(fromDir))
        throw new Error(`Local subdirectory does not exist: ${fromDir}`);
    }

    mkdirSync(targetDir, { recursive: true });

    // If the source is a git repo, only copy tracked files (same as git clone)
    if (isGitRepo(baseDir)) {
      copyGitTrackedFiles(baseDir, targetDir, parsed.subdir || '.');
    } else {
      cpSync(fromDir, targetDir, { recursive: true });
    }

    removeVcsMetadata(targetDir);
    return;
  }

  // ==== Remote Git Repository ====
  // Create temporary directory
  const tmpDir = `${targetDir}_tmp_${Date.now()}`;
  mkdirSync(tmpDir, { recursive: true });

  // Compose git clone command
  const cloneCmd = parsed.ref
    ? `git clone --depth 1 --branch ${parsed.ref} ${parsed.repoUrl} "${tmpDir}"`
    : `git clone --depth 1 ${parsed.repoUrl} "${tmpDir}"`;
  execSync(cloneCmd, { stdio: 'inherit' });

  // ==== Copy subdirectory (if any) ====
  let fromDir = tmpDir;
  if (parsed.subdir) {
    fromDir = join(tmpDir, parsed.subdir);
    if (!existsSync(fromDir))
      throw new Error(`Remote subdirectory does not exist: ${fromDir}`);
  }
  mkdirSync(targetDir, { recursive: true });
  cpSync(fromDir, targetDir, { recursive: true });

  // Clean up temporary directory
  rmSync(tmpDir, { recursive: true, force: true });

  // Remove VCS metadata folders from the target
  removeVcsMetadata(targetDir);
}
