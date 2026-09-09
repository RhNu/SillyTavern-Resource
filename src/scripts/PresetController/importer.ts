import { parse as parseYaml } from 'yaml';
import { type ControllerConfig, normalizeConfig, sanitizeImportedConfigRoot } from './schema';
import { type ImportFormat } from './state';

function resolveImportFormat(raw: string, formatHint: ImportFormat, sourceName?: string): 'json' | 'yaml' {
  if (formatHint === 'json' || formatHint === 'yaml') {
    return formatHint;
  }

  const lowerName = sourceName?.toLowerCase() ?? '';
  if (lowerName.endsWith('.json')) {
    return 'json';
  }

  if (lowerName.endsWith('.yaml') || lowerName.endsWith('.yml')) {
    return 'yaml';
  }

  const trimmed = raw.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'yaml';
}

export function parseImportedConfig(raw: string, formatHint: ImportFormat, sourceName?: string): ControllerConfig {
  const content = raw.trim();
  if (!content) {
    throw new Error('导入内容为空。');
  }

  const format = resolveImportFormat(content, formatHint, sourceName);
  if (format === 'json') {
    return normalizeConfig(sanitizeImportedConfigRoot(JSON.parse(content)));
  }

  return normalizeConfig(sanitizeImportedConfigRoot(parseYaml(content)));
}
