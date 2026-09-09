import path from 'node:path';
import { rootDir, scriptsSrcDir, toPosix } from './config.ts';

export const resolveAlias = [
  { find: /^@\//, replacement: `${toPosix(scriptsSrcDir)}/` },
  { find: /^@util$/, replacement: toPosix(path.join(rootDir, 'util')) },
  { find: /^@util\//, replacement: `${toPosix(path.join(rootDir, 'util'))}/` },
  { find: /^@scripts$/, replacement: toPosix(scriptsSrcDir) },
  { find: /^@scripts\//, replacement: `${toPosix(scriptsSrcDir)}/` },
];

export const terserOptions = {
  compress: { ecma: 2020 as const, module: true, toplevel: true, passes: 3 },
  mangle: { module: true, toplevel: true },
  format: { ecma: 2020 as const, comments: false, beautify: false, preserve_annotations: false },
};
