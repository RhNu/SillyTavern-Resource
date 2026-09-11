import { afterEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../settings/schema';
import { NovelAiClient } from './client';

const bundle = {
  main: { positive: '1girl', negative: 'text' },
  characters: [],
};
const operationId = '11111111-1111-4111-8111-111111111111';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NovelAiClient v2 output modes', () => {
  test('requests server storage and parses a path descriptor without reading image bytes', async () => {
    vi.stubGlobal('SillyTavern', {
      name2: 'Alice',
      getRequestHeaders: () => ({ Authorization: 'session' }),
    });
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({
        requestId: 'request-id',
        operationId,
        seed: 42,
        model: DEFAULT_SETTINGS.generation.model,
        output: { mode: 'stored', path: '/user/images/Alice/image.png', mime: 'image/png', bytes: 123 },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await new NovelAiClient().generateStored(bundle, DEFAULT_SETTINGS.generation, operationId);

    expect(result.path).toBe('/user/images/Alice/image.png');
    expect(result.bytes).toBe(123);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/plugins/imggen-novelai/v2/generate');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      operationId,
      output: {
        mode: 'stored',
        storage: { characterName: 'Alice', filename: `novelai_${operationId}` },
      },
    });
  });

  test('can request a direct binary result without storage options', async () => {
    vi.stubGlobal('SillyTavern', { getRequestHeaders: () => ({}) });
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: {
            'Content-Type': 'image/png',
            'X-Imggen-Seed': '42',
            'X-Imggen-Model': DEFAULT_SETTINGS.generation.model,
            'X-Request-Id': 'request-id',
          },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await new NovelAiClient().generateBinary(bundle, DEFAULT_SETTINGS.generation, operationId);

    expect(result.blob.size).toBe(3);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(String(init?.body)).output).toEqual({ mode: 'binary' });
  });

  test('turns an invalid stored descriptor into a retryable protocol error', async () => {
    vi.stubGlobal('SillyTavern', { getRequestHeaders: () => ({}) });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ requestId: 'missing-output-fields' })),
    );

    await expect(
      new NovelAiClient().generateStored(bundle, DEFAULT_SETTINGS.generation, operationId),
    ).rejects.toMatchObject({ code: 'INVALID_STORED_RESPONSE' });
  });
});
