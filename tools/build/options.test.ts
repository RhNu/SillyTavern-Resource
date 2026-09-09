import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBuildOptions } from './options.ts';

test('parses build flags and repeatable options', () => {
  assert.deepEqual(
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
    {
      mode: 'development',
      kinds: ['scripts', 'plugins'],
      targets: ['scripts/example', 'plugins/example'],
      verbose: true,
      useCache: false,
      clearCache: true,
      watch: false,
      help: false,
    },
  );
});

test('supports positional mode and makes watch builds developmental by default', () => {
  assert.equal(parseBuildOptions(['development']).mode, 'development');
  assert.equal(parseBuildOptions(['--watch']).mode, 'development');
  assert.equal(parseBuildOptions(['--help']).help, true);
});

test('rejects invalid CLI input', () => {
  assert.throws(() => parseBuildOptions(['--unknown']), /Unknown option/);
  assert.throws(() => parseBuildOptions(['--mode']), /value is missing/);
  assert.throws(() => parseBuildOptions(['--mode', 'staging']), /Unsupported mode/);
  assert.throws(() => parseBuildOptions(['unexpected']), /Unexpected positional argument/);
});
