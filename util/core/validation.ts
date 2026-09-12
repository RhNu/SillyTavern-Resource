import { toDotPath } from 'zod/v4/core';

export function prettifyErrorWithInput(error: z.ZodError): string {
  return _([...error.issues])
    .sortBy(issue => issue.path?.length ?? 0)
    .flatMap(issue => {
      const lines = [`✖ ${issue.message}`];
      if (issue.path?.length) lines.push(`  → 路径: ${toDotPath(issue.path)}`);
      if (issue.input !== undefined) lines.push(`  → 输入: ${JSON.stringify(issue.input)}`);
      return lines;
    })
    .join('\n');
}
