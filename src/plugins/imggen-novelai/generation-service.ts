import type { GenerateRequest } from './api.ts';
import { requestNovelAiImage } from './client.ts';
import { decodeNovelAiImage, type DecodedImage } from './response.ts';
import { buildNovelAiRequest } from './wire.ts';

export type GeneratedAsset = {
  image: DecodedImage;
  seed: number;
  model: GenerateRequest['model'];
};

export async function generateAsset(
  token: string,
  request: GenerateRequest,
  signal?: AbortSignal,
): Promise<GeneratedAsset> {
  const built = buildNovelAiRequest(request);
  const payload = await requestNovelAiImage(token, built.body, signal);
  return {
    image: decodeNovelAiImage(payload),
    seed: built.seed,
    model: request.model,
  };
}
