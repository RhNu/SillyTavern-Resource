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

type SlashCommandArgumentTypeMap = {
  readonly STRING: 'string';
  readonly NUMBER: 'number';
  readonly RANGE: 'range';
  readonly BOOLEAN: 'bool';
  readonly VARIABLE_NAME: 'varname';
  readonly CLOSURE: 'closure';
  readonly SUBCOMMAND: 'subcommand';
  readonly LIST: 'list';
  readonly DICTIONARY: 'dictionary';
};

type SlashCommandParserFlag = 1 | 2;

type SlashCommandParserFlags = Partial<Record<SlashCommandParserFlag, boolean>> & Record<number, boolean>;

type SlashCommandArgumentValue = string | SlashCommandClosure;

type SlashCommandArgumentDefaultValue = SlashCommandArgumentValue | null;

type SlashCommandNamedArgumentValue = SlashCommandArgumentValue | SlashCommandArgumentValue[];

type SlashCommandUnnamedArguments = SlashCommandArgumentValue | SlashCommandArgumentValue[];

type SlashCommandNamedArgumentsCapture = Record<string, SlashCommandNamedArgumentValue | undefined>;

type SlashCommandNamedArguments<TCapture extends object = SlashCommandNamedArgumentsCapture> =
  SlashCommandNamedArgumentsCapture &
    TCapture & {
      _scope: SlashCommandScope;
      _parserFlags: SlashCommandParserFlags;
      _abortController: SlashCommandAbortController;
      _debugController: SlashCommandDebugController;
      _hasUnnamedArgument: boolean;
    };

type SlashCommandReturnValue = string | SlashCommandClosure | null | undefined | void;

type SlashCommandCallback<
  TNamedArguments extends object = SlashCommandNamedArgumentsCapture,
  TUnnamedArguments extends SlashCommandUnnamedArguments = SlashCommandUnnamedArguments,
> = (
  namedArguments: SlashCommandNamedArguments<TNamedArguments>,
  unnamedArguments: TUnnamedArguments,
) => SlashCommandReturnValue | Promise<SlashCommandReturnValue>;

interface SlashCommandAbortSignal {
  isQuiet: boolean;
  paused: boolean;
  aborted: boolean;
  reason: string | null;
}

interface SlashCommandAbortController extends EventTarget {
  signal: SlashCommandAbortSignal;
  abort(reason?: string, isQuiet?: boolean): void;
  pause(reason?: string): void;
  continue(reason?: string): void;
}

interface SlashCommandBreakController {
  isBreak: boolean;
  break(): void;
}

interface SlashCommandDebugController {
  stack: SlashCommandClosure[];
  cmdStack: SlashCommandExecutor[];
  stepStack: boolean[];
  isStepping: boolean;
  isSteppingInto: boolean;
  isSteppingOut: boolean;
  namedArguments: object | undefined;
  unnamedArguments: SlashCommandUnnamedArguments | undefined;
  continuePromise: Promise<boolean> | null;
  continueResolver: ((isStepping: boolean) => void) | null;
  onBreakPoint: ((closure: SlashCommandClosure, executor: SlashCommandExecutor) => Promise<boolean>) | undefined;
  testStepping(closure: SlashCommandClosure): boolean;
  down(closure: SlashCommandClosure): void;
  up(): void;
  setExecutor(executor: SlashCommandExecutor): void;
  resume(): void;
  step(): void;
  stepInto(): void;
  stepOut(): void;
  awaitContinue(): Promise<boolean>;
  awaitBreakPoint(closure: SlashCommandClosure, executor: SlashCommandExecutor): Promise<boolean>;
}

interface SlashCommandClosureResult {
  interrupt: boolean;
  pipe: string;
  isBreak: boolean;
  isAborted: boolean;
  isQuietlyAborted: boolean;
  abortReason: string;
  isError: boolean;
  errorMessage: string;
}

interface SlashCommandNamedArgumentAssignment {
  start: number;
  end: number;
  name: string;
  value: SlashCommandArgumentValue;
}

interface SlashCommandUnnamedArgumentAssignment {
  start: number;
  end: number;
  value: SlashCommandArgumentValue;
}

interface SlashCommandScope {
  variableNames: string[];
  readonly allVariableNames: string[];
  variables: Record<string, SlashCommandArgumentValue | undefined>;
  macros: Record<string, SlashCommandArgumentValue | undefined>;
  readonly macroList: Array<{ key: string; value: SlashCommandArgumentValue }>;
  parent: SlashCommandScope | null;
  pipe: SlashCommandArgumentValue | undefined;
  getCopy(): SlashCommandScope;
  setMacro(key: string, value: SlashCommandArgumentValue, overwrite?: boolean): void;
  existsVariableInScope(key: string): boolean;
  existsVariable(key: string): boolean;
  letVariable(key: string, value?: SlashCommandArgumentValue): void;
  setVariable(
    key: string,
    value?: SlashCommandArgumentValue,
    index?: string | number | null,
    type?: string | null,
  ): SlashCommandArgumentValue | undefined;
  getVariable(key: string, index?: string | number | null): string | number | SlashCommandClosure;
}

interface SlashCommandExecutor {
  injectPipe: boolean;
  start: number;
  end: number;
  startNamedArgs: number;
  endNamedArgs: number;
  startUnnamedArgs: number;
  endUnnamedArgs: number;
  name: string;
  source: string;
  command: SlashCommand;
  namedArgumentList: SlashCommandNamedArgumentAssignment[];
  unnamedArgumentList: SlashCommandUnnamedArgumentAssignment[];
  parserFlags: SlashCommandParserFlags;
  readonly commandCount: number;
  onProgress: ((done: number, total: number) => void) | undefined;
}

interface SlashCommandClosure {
  scope: SlashCommandScope;
  executeNow: boolean;
  argumentList: SlashCommandNamedArgumentAssignment[];
  providedArgumentList: SlashCommandNamedArgumentAssignment[];
  executorList: SlashCommandExecutor[];
  abortController: SlashCommandAbortController | null;
  breakController: SlashCommandBreakController | null;
  debugController: SlashCommandDebugController | null;
  onProgress: ((done: number, total: number) => void) | undefined;
  rawText: string;
  fullText: string;
  parserContext: string;
  source: string;
  readonly commandCount: number;
  toString(): string;
  substituteWithMacroEngine(
    text: string,
    scope: SlashCommandScope,
    macroList: Array<{ key: string; value: SlashCommandArgumentValue }>,
  ): SlashCommandUnnamedArguments;
  substituteParams(text: string, scope?: SlashCommandScope | null): SlashCommandUnnamedArguments;
  getCopy(): SlashCommandClosure;
  execute(): Promise<SlashCommandClosureResult>;
  executeDirect(): AsyncGenerator<
    SlashCommandExecutor | { closure: SlashCommandClosure; executor: SlashCommandExecutor },
    SlashCommandClosureResult,
    boolean
  >;
  executeStep(): AsyncGenerator<SlashCommandExecutor, SlashCommandClosureResult | void, unknown>;
  testPaused(): Promise<void>;
  testAbortController(): Promise<SlashCommandClosureResult | undefined>;
  substituteNamedArguments(executor: SlashCommandExecutor, args: SlashCommandNamedArguments): Promise<void>;
  substituteUnnamedArgument(
    executor: SlashCommandExecutor,
    isFirst: boolean,
    args: SlashCommandNamedArguments,
  ): Promise<SlashCommandUnnamedArguments>;
}

interface SlashCommandEnumValue {
  value: string;
  description: string | null;
  type: SlashCommandEnumType;
  typeIcon: string;
  matchProvider: ((input: string) => boolean) | null;
  valueProvider: ((input: string) => string) | null;
  makeSelectable: boolean;
  toString(): string;
}

type SlashCommandEnumType = 'enum' | 'command' | 'namedArgument' | 'variable' | 'qr' | 'macro' | 'number' | 'name';

interface SlashCommandArgumentProps {
  description: string;
  typeList?: SlashCommandArgumentType | SlashCommandArgumentType[];
  isRequired?: boolean;
  acceptsMultiple?: boolean;
  defaultValue?: SlashCommandArgumentDefaultValue;
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
  callback?: SlashCommandCallback;
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
  defaultValue: SlashCommandArgumentDefaultValue;
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
  testSymbol(sequence: string | RegExp, offset?: number): boolean;
  testSymbolLooseyGoosey(sequence: string | RegExp, offset?: number): boolean;
  replaceGetvar(value: string): string;
  parse(
    text: string,
    verifyCommandNames?: boolean,
    flags?: SlashCommandParserFlags | null,
    abortController?: SlashCommandAbortController | null,
    debugController?: SlashCommandDebugController | null,
  ): SlashCommandClosure;
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
    defaultValue?: SlashCommandArgumentDefaultValue,
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
    defaultValue?: SlashCommandArgumentDefaultValue,
    enums?: SlashCommandEnumValue | string | Array<SlashCommandEnumValue | string>,
    aliases?: string | string[],
    enumProvider?: ((executor: SlashCommandExecutor, scope: SlashCommandScope) => SlashCommandEnumValue[]) | null,
    forceEnum?: boolean,
  ): SlashCommandNamedArgument;
  fromProps(props: SlashCommandNamedArgumentProps): SlashCommandNamedArgument;
}

interface SlashCommandEnumValueConstructor {
  new (
    value: string,
    description?: string | null,
    type?: SlashCommandEnumType | null,
    typeIcon?: string | null,
    matchProvider?: ((input: string) => boolean) | null,
    valueProvider?: ((input: string) => string) | null,
    makeSelectable?: boolean,
  ): SlashCommandEnumValue;
}

/**
 * 用于扩展 SillyTavern 的自定义字段。
 */
interface SillyTavernOverride {
  readonly SlashCommandParser: SlashCommandParserConstructor;
  readonly SlashCommand: SlashCommandConstructor;
  readonly SlashCommandArgument: SlashCommandArgumentConstructor;
  readonly SlashCommandNamedArgument: SlashCommandNamedArgumentConstructor;
  readonly SlashCommandEnumValue: SlashCommandEnumValueConstructor;
  readonly ARGUMENT_TYPE: SlashCommandArgumentTypeMap;
}

/**
 * 代码中可通过 `as ST` 修正类型:
 * const st = SillyTavern as ST;
 */
type ST = Omit<typeof SillyTavern, keyof SillyTavernOverride> & SillyTavernOverride;
