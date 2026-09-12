import JSON5 from 'json5';
import { jsonrepair } from 'jsonrepair';

export function stringifyLiteralYaml(value: unknown): string {
  return YAML.stringify(value, { blockQuote: 'literal' });
}

function describeError(error: unknown): string {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

export function parseStructuredText(content: string): unknown {
  const preferJson = /^[[{]/s.test(content.trimStart());
  let firstYamlError: unknown;
  let json5Error: unknown;
  let jsonError: unknown;

  if (!preferJson) {
    try {
      return YAML.parseDocument(content, { merge: true }).toJS();
    } catch (error) {
      firstYamlError = error;
    }
  }

  try {
    // eslint-disable-next-line import-x/no-named-as-default-member
    return JSON5.parse(content);
  } catch (error) {
    json5Error = error;
  }

  try {
    return JSON.parse(jsonrepair(content));
  } catch (error) {
    jsonError = error;
  }

  try {
    return YAML.parseDocument(content, { merge: true }).toJS();
  } catch (lastYamlError) {
    throw new Error(
      stringifyLiteralYaml({
        ['要解析的字符串不是有效的 YAML/JSON/JSON5 格式']: {
          字符串内容: content,
          YAML错误信息: describeError(preferJson ? lastYamlError : firstYamlError),
          JSON5错误信息: describeError(json5Error),
          JSON错误信息: describeError(jsonError),
        },
      }),
    );
  }
}
