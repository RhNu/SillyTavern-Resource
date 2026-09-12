import { beforeEach, expect, test, vi } from 'vitest';
import { showChatInputWork, type ChatInputWorkOptions, type ChatInputWorkSession } from '@util/ui/chat-input-work';
import type { NovelAiImageService } from '../app/service';
import { WorkProgressStore, type WorkProgressInput } from '../app/work-progress';
import { mountChatInputWork } from './chat-input-work';

vi.mock('@util/ui/chat-input-work', () => ({ showChatInputWork: vi.fn() }));
vi.mock('../app/logger', () => ({ createLogger: () => ({ error: vi.fn() }) }));

let options: ChatInputWorkOptions[];
let sessions: ChatInputWorkSession[];

beforeEach(() => {
  options = [];
  sessions = [];
  vi.mocked(showChatInputWork).mockImplementation(initial => {
    options.push(initial ?? {});
    const session = {
      active: true,
      update: vi.fn(next => options.push(next)),
      destroy: vi.fn(() => Object.defineProperty(session, 'active', { value: false })),
    } as unknown as ChatInputWorkSession;
    sessions.push(session);
    return session;
  });
});

function setup() {
  const progress = new WorkProgressStore();
  const service = {
    progress,
    pauseQueue: vi.fn(),
    resumeQueue: vi.fn(),
  } as unknown as NovelAiImageService;
  return { progress, service, view: mountChatInputWork(service) };
}

const generation: WorkProgressInput = {
  id: 'generation-queue',
  kind: 'generation',
  status: 'running',
  title: '生图',
  detail: '第一张',
  completed: 0,
  total: 4,
  cancel: { label: '中断', run: vi.fn() },
};

test('blocks the chat input while generation is active and wires queue controls', () => {
  const { progress, service, view } = setup();
  progress.upsert(generation);
  expect(showChatInputWork).toHaveBeenCalledOnce();
  expect(options.at(-1)).toMatchObject({ progress: 0, indeterminate: true, state: 'running' });
  options.at(-1)?.onPause?.();
  options.at(-1)?.onStop?.();
  expect(service.pauseQueue).toHaveBeenCalledOnce();
  expect(generation.cancel!.run).toHaveBeenCalledOnce();

  progress.upsert({ ...generation, status: 'paused' });
  expect(sessions[0].update).toHaveBeenCalled();
  expect(options.at(-1)).toMatchObject({ progress: 0, indeterminate: false, state: 'paused' });
  options.at(-1)?.onResume?.();
  expect(service.resumeQueue).toHaveBeenCalledOnce();
  view.destroy();
});

test('analysis exposes stop but not pause and releases the input when work ends', () => {
  const { progress, view } = setup();
  progress.upsert({ ...generation, id: 'analysis', kind: 'analysis', total: undefined });
  expect(options.at(-1)).toMatchObject({ progress: undefined, state: 'running', onPause: undefined });
  progress.remove('analysis');
  expect(sessions[0].destroy).toHaveBeenCalledOnce();
  view.destroy();
});
