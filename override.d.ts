type SlashCommandArgumentType =
  | 'string'
  | 'number'
  | 'range'
  | 'bool'
  | 'varname'
  | 'closure'
  | 'subcommand'
  | 'list'
  | 'dictionary';

interface SlashCommandClosure {}

interface SlashCommandAbortController {}

interface SlashCommandDebugController {}

interface SlashCommandExecutor {}

interface SlashCommandScope {}

interface SlashCommandEnumValue {
  value: string;
  description: string | null;
  type: string;
  typeIcon: string;
  matchProvider: ((input: string) => boolean) | null;
  valueProvider: ((input: string) => string) | null;
  makeSelectable: boolean;
  toString(): string;
}

interface SlashCommandArgumentProps {
  description: string;
  typeList?: SlashCommandArgumentType | SlashCommandArgumentType[];
  isRequired?: boolean;
  acceptsMultiple?: boolean;
  defaultValue?: string | SlashCommandClosure | null;
  enumList?: SlashCommandEnumValue | string | Array<SlashCommandEnumValue | string>;
  enumProvider?: ((executor: SlashCommandExecutor, scope: SlashCommandScope) => SlashCommandEnumValue[]) | null;
  forceEnum?: boolean;
}

interface SlashCommandNamedArgumentProps extends SlashCommandArgumentProps {
  name: string;
  aliasList?: string | string[];
}

interface SlashCommandProps {
  name?: string;
  callback?: (
    namedArguments: Record<string, string | SlashCommandClosure | (string | SlashCommandClosure)[] | undefined> & {
      _scope: SlashCommandScope;
      _parserFlags: Record<number, boolean>;
      _abortController: SlashCommandAbortController;
      _debugController: SlashCommandDebugController;
      _hasUnnamedArgument: boolean;
    },
    unnamedArguments: string | SlashCommandClosure | (string | SlashCommandClosure)[],
  ) => string | SlashCommandClosure | Promise<string | SlashCommandClosure>;
  helpString?: string;
  splitUnnamedArgument?: boolean;
  splitUnnamedArgumentCount?: number;
  rawQuotes?: boolean;
  aliases?: string[];
  returns?: string;
  namedArgumentList?: SlashCommandNamedArgument[];
  unnamedArgumentList?: SlashCommandArgument[];
}

interface SlashCommandArgument {
  description: string;
  typeList: SlashCommandArgumentType[];
  isRequired: boolean;
  acceptsMultiple: boolean;
  defaultValue: string | SlashCommandClosure | null;
  enumList: SlashCommandEnumValue[];
  enumProvider: ((executor: SlashCommandExecutor, scope: SlashCommandScope) => SlashCommandEnumValue[]) | null;
  forceEnum: boolean;
}

interface SlashCommandNamedArgument extends SlashCommandArgument {
  name: string;
  aliasList: string[];
}

interface SlashCommand {
  name: string;
  callback: NonNullable<SlashCommandProps['callback']>;
  helpString: string;
  splitUnnamedArgument: boolean;
  splitUnnamedArgumentCount: number;
  rawQuotes: boolean;
  aliases: string[];
  returns: string;
  namedArgumentList: SlashCommandNamedArgument[];
  unnamedArgumentList: SlashCommandArgument[];
  helpCache: Record<string, HTMLElement>;
  helpDetailsCache: Record<string, DocumentFragment>;
  isExtension: boolean;
  isThirdParty: boolean;
  source: string;
  renderHelpItem(key?: string | null): HTMLElement;
  renderHelpDetails(key?: string | null): DocumentFragment;
}

interface SlashCommandParser {
  helpStrings: Record<string, string>;
  verifyCommandNames: boolean;
  text: string;
  index: number;
  abortController: SlashCommandAbortController;
  debugController: SlashCommandDebugController;
  scope: SlashCommandScope;
  closure: SlashCommandClosure;
  flags: Record<number, boolean>;
  jumpedEscapeSequence: boolean;
  closureIndex: { start: number; end: number }[];
  macroIndex: { start: number; end: number; name: string }[];
  commandIndex: SlashCommandExecutor[];
  scopeIndex: SlashCommandScope[];
  parserContext: string;
  userIndex: number;
  ahead: string;
  behind: string;
  char: string | undefined;
  endOfText: boolean;
  getHelpString(): string;
  take(length?: number): string;
  discardWhitespace(): void;
  testSymbol(sequence: string, offset?: number): boolean;
  testSymbolLooseyGoosey(sequence: string, offset?: number): boolean;
  replaceGetvar(value: string): string;
  parse(
    text: string,
    verifyCommandNames?: boolean,
    flags?: Record<number, boolean> | null,
    abortController?: SlashCommandAbortController | null,
    debugController?: SlashCommandDebugController | null,
  ): string | SlashCommandClosure | (string | SlashCommandClosure)[] | null;
}

interface SlashCommandParserConstructor {
  new (): SlashCommandParser;
  commands: Record<string, SlashCommand>;
  /** Deprecated */
  addCommand(command: string, callback: SlashCommand['callback'], aliases: string[], helpString?: string): void;
  addCommandObject(command: SlashCommand): void;
  addCommandObjectUnsafe(command: SlashCommand): void;
}

interface SlashCommandConstructor {
  new (): SlashCommand;
  fromProps(props: SlashCommandProps): SlashCommand;
}

interface SlashCommandArgumentConstructor {
  new (
    description: string,
    types: SlashCommandArgumentType | SlashCommandArgumentType[],
    isRequired?: boolean,
    acceptsMultiple?: boolean,
    defaultValue?: string | SlashCommandClosure | null,
    enums?: SlashCommandEnumValue | string | Array<SlashCommandEnumValue | string>,
    enumProvider?: ((executor: SlashCommandExecutor, scope: SlashCommandScope) => SlashCommandEnumValue[]) | null,
    forceEnum?: boolean,
  ): SlashCommandArgument;
  fromProps(props: SlashCommandArgumentProps): SlashCommandArgument;
}

interface SlashCommandNamedArgumentConstructor {
  new (
    name: string,
    description: string,
    types: SlashCommandArgumentType | SlashCommandArgumentType[],
    isRequired?: boolean,
    acceptsMultiple?: boolean,
    defaultValue?: string | SlashCommandClosure | null,
    enums?: SlashCommandEnumValue | string | Array<SlashCommandEnumValue | string>,
    aliases?: string | string[],
    enumProvider?: ((executor: SlashCommandExecutor, scope: SlashCommandScope) => SlashCommandEnumValue[]) | null,
    forceEnum?: boolean,
  ): SlashCommandNamedArgument;
  fromProps(props: SlashCommandNamedArgumentProps): SlashCommandNamedArgument;
}

/**
 * 用于扩展 SillyTavern 的自定义字段。
 */
interface SillyTavernOverride {
  readonly SlashCommandParser: SlashCommandParserConstructor;
  readonly SlashCommand: SlashCommandConstructor;
  readonly SlashCommandArgument: SlashCommandArgumentConstructor;
  readonly SlashCommandNamedArgument: SlashCommandNamedArgumentConstructor;
}

/**
 * 代码中可通过 `as ST` 修正类型:
 * const st = SillyTavern as ST;
 */
type ST = typeof SillyTavern & SillyTavernOverride;
