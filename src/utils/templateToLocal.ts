import { cpSync, existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
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

export function templateToLocal(parsed: ParsedTemplateType, targetDir: string) {
  if (parsed.isLocal) {
    // ==== Local Path ====
    let fromDir = parsed.repoUrl;
    if (parsed.subdir) {
      fromDir = join(parsed.repoUrl, parsed.subdir);
      if (!existsSync(fromDir))
        throw new Error(`Local subdirectory does not exist: ${fromDir}`);
    }
    mkdirSync(targetDir, { recursive: true });
    cpSync(fromDir, targetDir, { recursive: true });
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
