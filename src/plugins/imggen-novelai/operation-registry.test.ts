import { describe, expect, test, vi } from 'vitest';
import { PluginError } from './errors.ts';
import { OperationRegistry } from './operation-registry.ts';

describe('OperationRegistry', () => {
  test('coalesces concurrent work and reuses a completed result', async () => {
    const registry = new OperationRegistry<string>();
    const action = vi.fn(async () => 'stored-path');

    const [first, second] = await Promise.all([
      registry.run('user:operation', 'same-request', action),
      registry.run('user:operation', 'same-request', action),
    ]);
    const third = await registry.run('user:operation', 'same-request', action);

    expect([first, second, third]).toEqual(['stored-path', 'stored-path', 'stored-path']);
    expect(action).toHaveBeenCalledOnce();
  });

  test('rejects operation id reuse with a different request', async () => {
    const registry = new OperationRegistry<string>();
    await registry.run('user:operation', 'first-request', async () => 'ok');

    expect(() => registry.run('user:operation', 'different-request', async () => 'bad')).toThrowError(
      expect.objectContaining<Partial<PluginError>>({ code: 'OPERATION_CONFLICT', statusCode: 409 }),
    );
  });

  test('allows retry after a failed operation', async () => {
    const registry = new OperationRegistry<string>();
    const action = vi.fn().mockRejectedValueOnce(new Error('failed')).mockResolvedValueOnce('retried');

    await expect(registry.run('user:operation', 'request', action)).rejects.toThrow('failed');
    await expect(registry.run('user:operation', 'request', action)).resolves.toBe('retried');
    expect(action).toHaveBeenCalledTimes(2);
  });
});
