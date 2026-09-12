import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createScriptSettingsSync } from './script-settings';

type ExampleSettings = { enabled: boolean; count: number };

function parseSettings(value: unknown): ExampleSettings {
  if (
    !value ||
    typeof value !== 'object' ||
    !('enabled' in value) ||
    typeof value.enabled !== 'boolean' ||
    !('count' in value) ||
    typeof value.count !== 'number'
  ) {
    throw new Error('invalid settings');
  }
  return { enabled: value.enabled, count: value.count };
}

describe('createScriptSettingsSync', () => {
  let variables: Record<string, unknown>;
  let updateVariablesWithMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    variables = { feature: { settings: { enabled: false, count: 1 } } };
    vi.stubGlobal(
      'getVariables',
      vi.fn(() => variables),
    );
    updateVariablesWithMock = vi.fn(
      (updater: (current: Record<string, unknown>) => Record<string, unknown>, _option: VariableOption) => {
        variables = updater(variables);
        return variables;
      },
    );
    vi.stubGlobal('updateVariablesWith', updateVariablesWithMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('migrates a legacy path and writes normalized settings to a stable script target', () => {
    const sync = createScriptSettingsSync({
      key: 'feature',
      legacyPaths: ['feature.settings'],
      parse: parseSettings,
      defaultValue: { enabled: true, count: 0 },
      scriptId: 'feature-script',
    });

    expect(sync.load()).toEqual({ enabled: false, count: 1 });
    expect(variables.feature).toEqual({ enabled: false, count: 1 });
    expect(updateVariablesWithMock).toHaveBeenLastCalledWith(expect.any(Function), {
      type: 'script',
      script_id: 'feature-script',
    });
  });

  test('coalesces scheduled writes and supports explicit flushing', () => {
    variables = {};
    const sync = createScriptSettingsSync({
      key: 'feature',
      parse: parseSettings,
      defaultValue: { enabled: true, count: 0 },
      debounceMs: 500,
      scriptId: 'feature-script',
    });
    sync.load();
    updateVariablesWithMock.mockClear();

    sync.schedule({ enabled: true, count: 1 });
    sync.schedule({ enabled: true, count: 2 });
    vi.advanceTimersByTime(499);
    expect(updateVariablesWithMock).not.toHaveBeenCalled();

    sync.flush();
    expect(updateVariablesWithMock).toHaveBeenCalledOnce();
    expect(variables.feature).toEqual({ enabled: true, count: 2 });
    vi.advanceTimersByTime(1);
    expect(updateVariablesWithMock).toHaveBeenCalledOnce();
  });
});
