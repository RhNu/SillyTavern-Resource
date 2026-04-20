import path from 'node:path';
import { rootDir, srcDir, toPosix } from './config.mjs';

export const resolveAlias = [
  {
    find: /^@util$/,
    replacement: toPosix(path.join(rootDir, 'util')),
  },
  {
    find: /^@util\//,
    replacement: `${toPosix(path.join(rootDir, 'util'))}/`,
  },
  {
    find: /^@$/,
    replacement: toPosix(srcDir),
  },
  {
    find: /^@\//,
    replacement: `${toPosix(srcDir)}/`,
  },
];

export const terserOptions = {
  compress: {
    ecma: 2020,
    module: true,
    toplevel: true,
    passes: 3,
  },
  mangle: {
    module: true,
    toplevel: true,
  },
  format: {
    ecma: 2020,
    comments: false,
    beautify: false,
    preserve_annotations: false,
  },
};
