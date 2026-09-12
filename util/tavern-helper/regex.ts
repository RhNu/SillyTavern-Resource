export function regexFromString(input: string, replaceMacros = false): RegExp | null {
  if (!input) return null;

  const makeRegex = (pattern: string, flags: string) => {
    const resolvedPattern = replaceMacros ? substitudeMacros(pattern) : pattern;
    return new RegExp(resolvedPattern, flags);
  };

  try {
    const match = input.match(/\/(.+)\/([a-z]*)/i);
    if (!match) return makeRegex(_.escapeRegExp(input), 'i');
    if (match[2] && !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(match[2])) return makeRegex(input, 'i');

    const flags = (match[2] ?? '').replaceAll('g', '');
    return makeRegex(match[1], flags.includes('i') ? flags : `${flags}i`);
  } catch {
    return null;
  }
}
