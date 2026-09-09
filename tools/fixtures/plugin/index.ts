import axios from 'axios';

export const info = {
  id: 'build-fixture',
  name: 'Build fixture',
  description: 'Build integration fixture',
};

export function hasHttpClient(): boolean {
  return typeof axios.get === 'function';
}

export async function loadOptionalCanvas(): Promise<unknown> {
  return import('canvas');
}
