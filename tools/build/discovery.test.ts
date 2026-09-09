import { expect, test } from 'vitest';
import { assertNoNestedProjects } from './discovery.ts';

test('detects nested projects including a project at the source root', () => {
  expect(() => assertNoNestedProjects(['alpha', 'beta'], 'scripts')).not.toThrow();
  expect(() => assertNoNestedProjects(['.', 'nested'], 'scripts')).toThrow(/Nested scripts projects/);
  expect(() => assertNoNestedProjects(['alpha', 'alpha/nested'], 'scripts')).toThrow(/Nested scripts projects/);
});
