import { beforeEach, expect, test, vi } from 'vitest';
import { showLoader } from '@util/ui/loader/loader';
import type { LoaderOptions, LoaderSession } from '@util/ui/loader/types';
import type { NovelAiImageService } from '../app/service';
import { WorkProgressStore, type WorkProgressInput } from '../app/work-progress';
import { mountProgressToast } from './progress-toast';

vi.mock('@util/ui/loader/loader', () => ({ showLoader: vi.fn() }));
vi.mock('../app/logger', () => ({ createLogger: () => ({ error: vi.fn() }) }));

const handles: { session: LoaderSession; options: LoaderOptions }[] = [];
beforeEach(() => {
  handles.length = 0;
  vi.mocked(showLoader).mockImplementation(options => {
    const session = {
      active: true,
      update: vi.fn(),
      hide: vi.fn(async () => {
        Object.assign(session, { active: false });
      }),
      stop: vi.fn(async () => {
        await options?.onStop?.(session);
        Object.assign(session, { active: false });
      }),
    } as unknown as LoaderSession;
    handles.push({ session, options: options! });
    return session;
  });
});

function setup() {
  const progress = new WorkProgressStore();
  let settingsListener: ((settings: unknown) => void) | undefined;
  const unsubscribeSettings = vi.fn();
  const service = {
    progress,
    settings: {
      get: () => ({ notifications: { progressToast: true } }),
      subscribe: (listener: typeof settingsListener) => {
        settingsListener = listener;
        return unsubscribeSettings;
      },
    },
  } as unknown as NovelAiImageService;
  const view = mountProgressToast(service);
  const item: WorkProgressInput = {
    id: 'generation-queue',
    kind: 'generation',
    status: 'running',
    title: '生图',
    detail: '<当前图片>',
    completed: 0,
    total: 2,
    cancel: { label: '中断全部生图', run: vi.fn() },
  };
  return {
    progress,
    view,
    item,
    unsubscribeSettings,
    setEnabled: (enabled: boolean) => settingsListener?.({ notifications: { progressToast: enabled } }),
  };
}

test('updates one non-blocking loader and cancels the latest focused work', async () => {
  const { progress, view, item } = setup();
  progress.upsert(item);
  expect(handles[0].options).toMatchObject({ blocking: false, toast: 'stoppable' });
  progress.upsert({ ...item, completed: 1 });
  expect(handles).toHaveLength(1);
  expect(handles[0].session.update).toHaveBeenLastCalledWith({
    message: '生图 · 处理中 · 50% · <当前图片>',
    stopTooltip: '中断全部生图',
  });
  const cancel = vi.fn(() => progress.remove('analysis'));
  progress.upsert({ ...item, id: 'analysis', kind: 'analysis', cancel: { label: '中断分析', run: cancel } });
  await handles[0].session.stop();
  expect(cancel).toHaveBeenCalledOnce();
  expect(item.cancel!.run).not.toHaveBeenCalled();
  expect(handles[1].options.message).toContain('生图');
  view.destroy();
});

test('keeps a static cancelling loader until asynchronous work finishes', async () => {
  const { progress, view, item } = setup();
  const cancel = vi.fn(() => progress.upsert({ ...item, status: 'cancelling' }));
  progress.upsert({ ...item, cancel: { label: '中断', run: cancel } });
  await handles[0].session.stop();
  expect(handles).toHaveLength(2);
  expect(handles[1].options).toMatchObject({ toast: 'static' });
  expect(handles[1].options.message).toContain('正在中断');
  expect(handles[1].session.hide).not.toHaveBeenCalled();
  progress.remove(item.id);
  expect(handles[1].session.hide).toHaveBeenCalledOnce();
  view.destroy();
});

test('settings and teardown hide only this loader without cancelling work', () => {
  const { progress, view, item, setEnabled, unsubscribeSettings } = setup();
  progress.upsert(item);
  setEnabled(false);
  expect(handles[0].session.hide).toHaveBeenCalledOnce();
  expect(item.cancel!.run).not.toHaveBeenCalled();
  progress.upsert({ ...item, completed: 1 });
  expect(handles).toHaveLength(1);
  setEnabled(true);
  expect(handles).toHaveLength(2);
  view.destroy();
  expect(handles[1].session.hide).toHaveBeenCalledOnce();
  expect(unsubscribeSettings).toHaveBeenCalledOnce();
  progress.upsert(item);
  expect(handles).toHaveLength(2);
});
