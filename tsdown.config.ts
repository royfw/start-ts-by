/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { defineConfig, OutExtensionContext } from 'tsdown';
import { tsdownCopyPackageJsonPlugin } from './scripts/copyPackageJsonPlugin';
import fs from 'fs';
import { copyFilesPlugin } from './scripts/copyFilesPlugin';
import path from 'path';

const distDir = 'dist';
// 讀取 root package.json，標記 external
const pkg: Record<string, unknown> =
  JSON.parse(fs.readFileSync('./package.json', 'utf-8')) ?? {};
const dependencies: string[] = Object.keys(pkg.dependencies || {});
const peerDependencies: string[] = Object.keys(pkg.peerDependencies || {});
const externalDeps = [...dependencies, ...peerDependencies];

const copyFiles = (JSON.parse(fs.readFileSync('./copyFiles.json', 'utf-8')) ??
  []) as string[];

export default defineConfig({
  // 對應你原本的 inputFile = 'src/index.ts'
  entry: 'src/index.ts',

  // 對應原本 distDir = 'dist'
  outDir: path.join(distDir, 'bin'),
  platform: 'node',
  external: ['node:*'].concat(externalDeps),

  tsconfig: 'tsconfig.build.json',

  format: ['esm'],

  treeshake: true,

  target: 'es2023',

  // 清 dist（如果還是習慣自己跑 clean script，可以把這行拿掉）
  clean: true,

  dts: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  outExtensions: (context: OutExtensionContext) => {
    return {
      js: '.js',
    };
  },
  plugins: [
    tsdownCopyPackageJsonPlugin({
      distDir: 'dist',
    }),
    copyFilesPlugin({
      distDir: 'dist',
      files: copyFiles,
    }),
  ],
});
