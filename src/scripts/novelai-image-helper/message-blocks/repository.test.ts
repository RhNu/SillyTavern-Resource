import { afterEach, describe, expect, test, vi } from 'vitest';
import { ChatImageRepository, VARIABLE_KEY } from './repository';
import { imageBlock, mockTavern } from './fixtures/tavern';
import { buildAnchor } from '../domain/anchor';

afterEach(() => vi.unstubAllGlobals());

describe('chat image repository', () => {
  test('stores each image exactly once and reads only current floor references', () => {
    const host = mockTavern();
    const repository = new ChatImageRepository();
    let halfwaySize = 0;
    for (let index = 0; index < 100; index += 1) {
      const id = `image-${index.toString().padStart(3, '0')}`;
      host.addMessage(buildAnchor(id));
      repository.prepare([imageBlock(id)]);
      repository.finalize([id]);
      expect(Object.keys(repository.read(index).blocks)).toEqual([id]);
      if (index === 49) halfwaySize = JSON.stringify(host.state.variables).length;
    }
    expect(Object.keys(host.state.variables[VARIABLE_KEY].images)).toHaveLength(100);
    expect(JSON.stringify(host.state.variables).length).toBeLessThan(halfwaySize * 2.05);
    expect(host.state.variables.unrelated).toEqual({ keep: true });
    expect(host.state.variables[VARIABLE_KEY].images['image-000']).not.toHaveProperty('id');
    expect(host.state.variables[VARIABLE_KEY].images['image-000']).not.toHaveProperty('status');
  });

  test('queue phase changes do not write durable data and reload derives idle state', () => {
    const host = mockTavern();
    host.addMessage(buildAnchor('one'));
    const repository = new ChatImageRepository();
    repository.prepare([imageBlock('one')]);
    repository.finalize(['one']);
    host.write.mockClear();
    for (const status of ['queued', 'generating', 'uploading'] as const) {
      repository.update(0, 'one', block => ({ ...block, status }));
      expect(repository.find(0, 'one')?.status).toBe(status);
    }
    expect(host.write).not.toHaveBeenCalled();
    expect(new ChatImageRepository().find(0, 'one')?.status).toBe('draft');
  });

  test('keeps outputs and a small association checkpoint across reloads', () => {
    const host = mockTavern();
    host.addMessage(buildAnchor('one'));
    const repository = new ChatImageRepository();
    repository.prepare([imageBlock('one')]);
    repository.finalize(['one']);
    repository.update(0, 'one', block => ({
      ...block,
      status: 'ready',
      pendingAssociation: '/one.png',
      outputs: [{ url: '/one.png', seed: 12, model: 'model', createdAt: '2026-09-11' }],
    }));
    const restored = new ChatImageRepository().find(0, 'one');
    expect(restored).toMatchObject({
      status: 'failed',
      pendingAssociation: '/one.png',
      error: { stage: 'associate', retryable: true },
    });
    expect(restored?.outputs).toHaveLength(1);
  });

  test('reconciles references across inactive swipes and does not sweep unrelated transaction records', () => {
    const host = mockTavern();
    host.addMessage('active text', ['active text', buildAnchor('inactive')]);
    const repository = new ChatImageRepository();
    repository.prepare(['inactive', 'orphan', 'other-transaction'].map(imageBlock));
    repository.reconcile(['inactive', 'orphan']);
    expect(Object.keys(host.state.variables[VARIABLE_KEY].images).sort()).toEqual(['inactive', 'other-transaction']);
    expect(host.state.variables[VARIABLE_KEY].images.inactive.pending).toBeUndefined();
    expect(host.state.variables[VARIABLE_KEY].images['other-transaction'].pending).toBe(true);
    repository.reconcile();
    expect(Object.keys(host.state.variables[VARIABLE_KEY].images)).toEqual(['inactive']);
  });

  test.each(['chat', 'swipe', 'text', 'prompt', 'delete'] as const)(
    'invalidates an enqueued task on %s changes',
    change => {
      const host = mockTavern();
      const message = host.addMessage(buildAnchor('one'), [buildAnchor('one'), buildAnchor('one')]);
      const repository = new ChatImageRepository();
      repository.prepare([imageBlock('one')]);
      repository.finalize(['one']);
      const guard = repository.captureTask(0, 'one');
      expect(guard).not.toThrow();
      if (change === 'chat') host.state.chatId = 'different';
      if (change === 'swipe') message.swipe_id = 1;
      if (change === 'text') message.swipes[0] += 'edited';
      if (change === 'prompt')
        repository.update(0, 'one', block => ({
          ...block,
          prompt: { ...block.prompt, main: { positive: 'edited', negative: '' } },
        }));
      if (change === 'delete') host.state.messages = [];
      expect(guard).toThrow();
    },
  );

  test('persists bounded failures without attempt counters', () => {
    const host = mockTavern();
    host.addMessage(buildAnchor('one'));
    const repository = new ChatImageRepository();
    repository.prepare([imageBlock('one')]);
    repository.finalize(['one']);
    repository.update(0, 'one', block => ({
      ...block,
      status: 'failed',
      error: { code: 'NETWORK', message: 'x'.repeat(2000), stage: 'generate', attempts: 4, retryable: true },
    }));
    const failure = host.state.variables[VARIABLE_KEY].images.one.error;
    expect(failure.message).toHaveLength(500);
    expect(failure.attempts).toBeUndefined();
  });
});
