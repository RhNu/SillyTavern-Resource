import axios from 'axios';
import { z } from 'zod/v4';

export const info = {
  id: 'build-fixture',
  name: 'Build fixture',
  description: 'Build integration fixture',
};

export function hasHttpClient(): boolean {
  return typeof axios.get === 'function';
}

export function parsesBundledDependencySubpath(): boolean {
  return z.literal('bundled').parse('bundled') === 'bundled';
}

export async function loadOptionalCanvas(): Promise<unknown> {
  return import('canvas');
}
