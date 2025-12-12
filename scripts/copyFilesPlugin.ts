/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
// copyFilesPlugin.js
import fs from 'fs';
import path from 'path';

const copyFilesFn = async (distDir: string, files: string[]) => {
  files = files || [];
  console.log(`\nCopying ${files.join(', ')} files to: ${distDir}`);
  for (const file of files) {
    try {
      fs.accessSync(file, fs.constants.R_OK);
    } catch (err: unknown) {
      console.error(`\nFile not found: ${file}`);
      continue;
    }
    const srcPath = path.join(file);
    const destPath = path.join(distDir, file);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    console.log(`\nFile copied to: ${destPath}`);
  }
};

type CopyFilesPluginOptions = {
  distDir?: string;
  files?: string[];
};

export function copyFilesPlugin(options: CopyFilesPluginOptions) {
  const { distDir, files } = options;
  const name = 'copy-files-plugin';
  return {
    name,
    async closeBundle() {
      await copyFilesFn(distDir ?? 'dist', files ?? []);
    },
  };
}
