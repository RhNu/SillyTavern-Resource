function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export async function uploadGeneratedImage(blob: Blob, signal?: AbortSignal): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const response = await fetch('/api/images/upload', {
    method: 'POST',
    headers: SillyTavern.getRequestHeaders(),
    signal,
    body: JSON.stringify({
      image: bytesToBase64(bytes),
      format: 'png',
      ch_name: SillyTavern.name2?.trim() || undefined,
      filename: `novelai_${Date.now()}`,
    }),
  });
  if (!response.ok) throw new Error(`上传图片失败 (${response.status})`);
  const payload = (await response.json()) as { path?: unknown; error?: unknown };
  if (typeof payload.path !== 'string' || !payload.path.trim()) {
    throw new Error(typeof payload.error === 'string' ? payload.error : '上传成功但没有返回图片路径');
  }
  return payload.path.trim();
}
