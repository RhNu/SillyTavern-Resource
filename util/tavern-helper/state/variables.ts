import { klona } from 'klona';
import _ from 'lodash';

export function normalizeVariablesRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

export function readVariablesRecord(variableOption: VariableOption): Record<string, unknown> {
  return normalizeVariablesRecord(getVariables(variableOption));
}

export function readVariablesPath(variableOption: VariableOption, path: string): unknown {
  return _.get(readVariablesRecord(variableOption), path);
}

export function updateVariablesPath(
  variableOption: VariableOption,
  path: string,
  value: unknown,
  options: {
    removeIfUndefined?: boolean;
  } = {},
) {
  return updateVariablesWith(variables => {
    const nextVariables = normalizeVariablesRecord(variables);
    const nextValue = klona(value);

    if (options.removeIfUndefined && nextValue === undefined) {
      _.unset(nextVariables, path);
      return nextVariables;
    }

    _.set(nextVariables, path, nextValue);
    return nextVariables;
  }, variableOption);
}
