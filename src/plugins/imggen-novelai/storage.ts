import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sanitize from 'sanitize-filename';
import type { UserDirectoryList } from '../@types/sillytavern-plugin.js';
import { PluginError } from './errors.ts';
import type { DecodedImage } from './response.ts';

export type StorageOptions = {
  characterName?: string;
  filename?: string;
};

export type StoredImage = {
  mode: 'stored';
  path: string;
  mime: DecodedImage['mime'];
  bytes: number;
};

function removeFileExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

function clientRelativePath(root: string, inputPath: string): string {
  if (!inputPath.startsWith(root)) {
    throw new PluginError(500, 'STORAGE_INVALID_PATH', '图片目标路径不在当前用户目录内');
  }
  return inputPath.slice(root.length).split(path.sep).join('/');
}

function formatForMime(mime: DecodedImage['mime']): 'png' | 'webp' {
  return mime === 'image/webp' ? 'webp' : 'png';
}

/** Mirrors SillyTavern's /api/images/upload path, naming and overwrite rules. */
export function resolveImageStoragePath(
  directories: UserDirectoryList,
  mime: DecodedImage['mime'],
  options: StorageOptions = {},
  now: () => number = Date.now,
): { absolutePath: string; clientPath: string } {
  const format = formatForMime(mime);
  const filename = options.filename ? `${removeFileExtension(options.filename)}.${format}` : `${now()}.${format}`;
  const cleanedFilename = sanitize(filename);
  if (!cleanedFilename) {
    throw new PluginError(400, 'STORAGE_INVALID_PATH', '清理后的图片文件名为空');
  }

  const characterName = options.characterName ? sanitize(options.characterName) : '';
  const absolutePath = characterName
    ? path.join(directories.userImages, characterName, cleanedFilename)
    : path.join(directories.userImages, cleanedFilename);
  return {
    absolutePath,
    clientPath: clientRelativePath(directories.root, absolutePath),
  };
}

export async function storeGeneratedImage(
  directories: UserDirectoryList,
  image: DecodedImage,
  options: StorageOptions = {},
): Promise<StoredImage> {
  const target = resolveImageStoragePath(directories, image.mime, options);
  const temporaryPath = `${target.absolutePath}.${randomUUID()}.tmp`;
  try {
    await fs.promises.mkdir(path.dirname(target.absolutePath), { recursive: true });
    await fs.promises.writeFile(
      temporaryPath,
      new Uint8Array(image.bytes.buffer, image.bytes.byteOffset, image.bytes.byteLength),
    );
    try {
      await fs.promises.rename(temporaryPath, target.absolutePath);
    } catch {
      // Windows cannot atomically replace an existing target; preserve native overwrite semantics.
      await fs.promises.copyFile(temporaryPath, target.absolutePath);
      await fs.promises.unlink(temporaryPath);
    }
    return {
      mode: 'stored',
      path: target.clientPath,
      mime: image.mime,
      bytes: image.bytes.byteLength,
    };
  } catch (error) {
    await fs.promises.rm(temporaryPath, { force: true }).catch(() => {});
    if (error instanceof PluginError) throw error;
    throw new PluginError(
      500,
      'STORAGE_FAILED',
      `保存图片失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
