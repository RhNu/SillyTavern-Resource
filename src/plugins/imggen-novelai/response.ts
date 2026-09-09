import { unzipSync } from 'fflate';
import { PluginError } from './errors.ts';

export type DecodedImage = { bytes: Uint8Array; mime: 'image/png' | 'image/webp' };

function detectMime(bytes: Uint8Array): DecodedImage['mime'] | undefined {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return undefined;
}

function decodeImage(bytes: Uint8Array): DecodedImage {
  const mime = detectMime(bytes);
  if (!mime) {
    throw new PluginError(502, 'INVALID_UPSTREAM_RESPONSE', 'NovelAI 返回了不支持的图片格式');
  }
  return { bytes, mime };
}

export function decodeNovelAiImage(payload: Uint8Array): DecodedImage {
  try {
    const entries = Object.entries(unzipSync(payload)).filter(([name]) => /\.(png|webp)$/i.test(name));
    if (entries.length !== 1) {
      throw new PluginError(502, 'INVALID_UPSTREAM_RESPONSE', `NovelAI 应返回一张图片，实际返回 ${entries.length} 张`);
    }
    return decodeImage(entries[0][1]);
  } catch (error) {
    if (error instanceof PluginError) {
      throw error;
    }
    return decodeImage(payload);
  }
}
