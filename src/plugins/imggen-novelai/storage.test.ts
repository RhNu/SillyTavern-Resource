import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import type { UserDirectoryList } from '../@types/sillytavern-plugin.js';
import { resolveImageStoragePath, storeGeneratedImage } from './storage.ts';

const temporaryDirectories: string[] = [];
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function directories(): UserDirectoryList {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'imggen-storage-'));
  temporaryDirectories.push(root);
  return { root, backups: path.join(root, 'backups'), userImages: path.join(root, 'user', 'images') };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => fs.promises.rm(directory, { recursive: true })));
});

describe('native-compatible image storage', () => {
  test('uses the user image root and native timestamp naming by default', () => {
    const dirs = directories();
    const target = resolveImageStoragePath(dirs, 'image/png', {}, () => 12345);

    expect(target.absolutePath).toBe(path.join(dirs.userImages, '12345.png'));
    expect(target.clientPath).toBe('/user/images/12345.png');
  });

  test('sanitizes one character directory and replaces the supplied extension', () => {
    const dirs = directories();
    const target = resolveImageStoragePath(
      dirs,
      'image/webp',
      { characterName: 'Alice:Card', filename: 'scene.old.png' },
      () => 0,
    );

    expect(target.absolutePath).toBe(path.join(dirs.userImages, 'AliceCard', 'scene.old.webp'));
    expect(target.clientPath).toBe('/user/images/AliceCard/scene.old.webp');
  });

  test('creates directories, stores bytes and returns a browser path', async () => {
    const dirs = directories();
    const result = await storeGeneratedImage(dirs, { bytes: PNG, mime: 'image/png' }, { filename: 'result.jpeg' });

    expect(result).toEqual({ mode: 'stored', path: '/user/images/result.png', mime: 'image/png', bytes: PNG.length });
    expect(new Uint8Array(await fs.promises.readFile(path.join(dirs.userImages, 'result.png')))).toEqual(PNG);
  });

  test('keeps native overwrite semantics for an explicit filename', async () => {
    const dirs = directories();
    await storeGeneratedImage(dirs, { bytes: PNG, mime: 'image/png' }, { filename: 'same' });
    const replacement = new Uint8Array([1, 2, 3]);
    await storeGeneratedImage(dirs, { bytes: replacement, mime: 'image/png' }, { filename: 'same.webp' });

    expect(new Uint8Array(await fs.promises.readFile(path.join(dirs.userImages, 'same.png')))).toEqual(replacement);
  });
});
