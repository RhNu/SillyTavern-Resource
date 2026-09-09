import assert from 'node:assert/strict';
import test from 'node:test';
import { assertNoNestedProjects } from './discovery.ts';

test('detects nested projects including a project at the source root', () => {
  assert.doesNotThrow(() => assertNoNestedProjects(['alpha', 'beta'], 'scripts'));
  assert.throws(() => assertNoNestedProjects(['.', 'nested'], 'scripts'), /Nested scripts projects/);
  assert.throws(() => assertNoNestedProjects(['alpha', 'alpha/nested'], 'scripts'), /Nested scripts projects/);
});
