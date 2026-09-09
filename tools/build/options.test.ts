import { describe, expect, test } from 'vitest';
import { parseBuildOptions } from './options.ts';

describe('parseBuildOptions', () => {
  test('parses build flags and repeatable options', () => {
    expect(
      parseBuildOptions([
        '--mode',
        'development',
        '--kind',
        'scripts',
        '--kind=plugins',
        '--target',
        'scripts/example',
        '--target=scripts/example',
        '--target',
        'plugins/example',
        '--verbose',
        '--no-cache',
        '--clear-cache',
      ]),
    ).toEqual({
      mode: 'development',
      kinds: ['scripts', 'plugins'],
      targets: ['scripts/example', 'plugins/example'],
      verbose: true,
      useCache: false,
      clearCache: true,
      watch: false,
      help: false,
    });
  });

  test('supports positional mode and makes watch builds developmental by default', () => {
    expect(parseBuildOptions(['development']).mode).toBe('development');
    expect(parseBuildOptions(['--watch']).mode).toBe('development');
    expect(parseBuildOptions(['--help']).help).toBe(true);
  });

  test('rejects invalid CLI input', () => {
    expect(() => parseBuildOptions(['--unknown'])).toThrow(/Unknown option/);
    expect(() => parseBuildOptions(['--mode'])).toThrow(/value is missing/);
    expect(() => parseBuildOptions(['--mode', 'staging'])).toThrow(/Unsupported mode/);
    expect(() => parseBuildOptions(['unexpected'])).toThrow(/Unexpected positional argument/);
  });
});
