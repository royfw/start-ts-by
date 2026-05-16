import { ParsedTemplateType } from '@/types';
import { resolve } from 'path';
import { githubPattern } from './pattern';

export function parseTemplateSource(input: string): ParsedTemplateType {
  let repoUrl = '';
  let ref = '';
  let subdir = '';
  let isGithub = false;
  let isLocal = false;

  // 拆分 #
  const [repoPart, refPart = ''] = input.split('#', 2);

  // 支援本地路徑判斷
  const isFilePrefix = repoPart.startsWith('file:');
  const isLocalPath =
    isFilePrefix ||
    repoPart.startsWith('./') ||
    repoPart.startsWith('../') ||
    repoPart.startsWith('/') ||
    /^[a-zA-Z]:\\/.test(repoPart); // Windows

  if (isLocalPath) {
    // local path: ./xxx 或 file:xxx
    isLocal = true;
    // file: 路徑，去掉前綴
    repoUrl = isFilePrefix ? repoPart.replace(/^file:/, '') : repoPart;
    // 統一轉成絕對路徑，避免相對難抓
    repoUrl = resolve(repoUrl);
    // 若 local path 也支援 /subdir
    const subdirIdx = repoUrl.match(/(.+?)(\/[\w./_-]+)$/);
    if (!refPart && subdirIdx) {
      repoUrl = subdirIdx[1];
      subdir = subdirIdx[2].replace(/^\//, '');
    }
    if (refPart) {
      // 一般 local path 不需要 branch，但還是容錯支援
      const idx = refPart.indexOf('/');
      if (idx !== -1) {
        ref = refPart.slice(0, idx);
        subdir = refPart.slice(idx + 1);
      } else {
        ref = refPart;
      }
    }
    return { repoUrl, ref, subdir, isGithub, isLocal };
  }

  // === 其他情境（同上一版） ===

  // GitHub 短格式
  const repoMatch = repoPart.match(githubPattern);
  if (repoMatch) {
    const [, user, project, possibleSubdir] = repoMatch;
    repoUrl = `https://github.com/${user}/${project}.git`;
    isGithub = true;
    if (!refPart && possibleSubdir) subdir = possibleSubdir.replace(/^\//, '');
  } else {
    // ssh, https, ssh://
    let mainRepo = repoPart;
    let possibleSubdir = '';
    const gitIdx = repoPart.indexOf('.git/');
    if (gitIdx !== -1) {
      mainRepo = repoPart.slice(0, gitIdx + 4);
      possibleSubdir = repoPart.slice(gitIdx + 5);
      if (!refPart && possibleSubdir) subdir = possibleSubdir;
    }
    repoUrl = mainRepo.endsWith('.git') ? mainRepo : mainRepo + '.git';
    isGithub = repoUrl.includes('github.com');
  }

  // 處理 refPart
  if (refPart) {
    const idx = refPart.indexOf('/');
    if (idx !== -1) {
      ref = refPart.slice(0, idx);
      subdir = refPart.slice(idx + 1);
    } else {
      ref = refPart;
    }
  }

  return { repoUrl, ref, subdir, isGithub, isLocal };
}
