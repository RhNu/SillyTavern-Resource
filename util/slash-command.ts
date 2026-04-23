export const slashCommandArgumentTypes = {
  string: 'string',
  number: 'number',
  range: 'range',
  bool: 'bool',
  varname: 'varname',
  closure: 'closure',
  subcommand: 'subcommand',
  list: 'list',
  dictionary: 'dictionary',
} as const satisfies Record<SlashCommandArgumentType, SlashCommandArgumentType>;

type AnyNamedArguments = Record<string, SlashCommandNamedArgumentValue | undefined>;

export type SlashCommandBooleanString = 'true' | 'false' | 'on' | 'off' | 'toggle';

type SlashCommandDefaultValueInput = SlashCommandArgumentDefaultValue | boolean | number;

type LiteralStringFromEnumItem<T> =
  T extends string ? T : T extends { value: infer Value extends string } ? Value : string;

type LiteralStringFromEnumList<T> =
  T extends readonly (infer Item)[] ? LiteralStringFromEnumItem<Item> : LiteralStringFromEnumItem<T>;

type SlashCommandArgumentTypeListItem<TTypeList> = TTypeList extends readonly (infer Item)[] ? Item : TTypeList;

type SlashCommandArgumentTypeListIsOnly<TTypeList, TType extends SlashCommandArgumentType> = [
  Exclude<SlashCommandArgumentTypeListItem<TTypeList>, TType>,
] extends [never]
  ? [Extract<SlashCommandArgumentTypeListItem<TTypeList>, TType>] extends [never]
    ? false
    : true
  : false;

type SlashCommandNamedArgumentSingleValue<TTypeList, TOptions> =
  TOptions extends { enumList: infer EnumList }
    ? LiteralStringFromEnumList<EnumList> | SlashCommandClosure
    : SlashCommandArgumentTypeListIsOnly<TTypeList, 'bool'> extends true
      ? SlashCommandBooleanString | SlashCommandClosure
    : SlashCommandArgumentValue;

type SlashCommandNamedArgumentInferredValue<TTypeList, TOptions> =
  TOptions extends { acceptsMultiple: true }
    ? SlashCommandNamedArgumentSingleValue<TTypeList, TOptions>[]
    : SlashCommandNamedArgumentSingleValue<TTypeList, TOptions>;

type SlashCommandNamedArgumentInference<TName extends string, TTypeList, TOptions> = string extends TName
  ? AnyNamedArguments
  : TOptions extends { isRequired: true }
    ? { [Key in TName]: SlashCommandNamedArgumentInferredValue<TTypeList, TOptions> }
    : { [Key in TName]?: SlashCommandNamedArgumentInferredValue<TTypeList, TOptions> | undefined };

type SlashCommandNamedArgumentPropsInference<TProps> = TProps extends { name: infer Name extends string }
  ? SlashCommandNamedArgumentInference<Name, TProps extends { typeList?: infer TypeList } ? TypeList : undefined, TProps>
  : AnyNamedArguments;

export type SlashCommandTypedCallback<TNamedArguments extends object = SlashCommandNamedArgumentsCapture> =
  (
    namedArguments: SlashCommandNamedArguments<TNamedArguments>,
    unnamedArguments: SlashCommandUnnamedArguments,
  ) => SlashCommandReturnValue | Promise<SlashCommandReturnValue>;

export type SlashCommandCallback = SlashCommandTypedCallback;

export type SlashCommandArgumentBuilderOptions = Omit<
  SlashCommandArgumentProps,
  'description' | 'typeList' | 'defaultValue'
> & {
  defaultValue?: SlashCommandDefaultValueInput;
};

export type SlashCommandNamedArgumentBuilderOptions = Omit<
  SlashCommandNamedArgumentProps,
  'name' | 'description' | 'typeList' | 'defaultValue'
> & {
  defaultValue?: SlashCommandDefaultValueInput;
};

type SlashCommandArgumentTypeList = SlashCommandArgumentProps['typeList'];

function getSlashCommandContext(): ST {
  return SillyTavern as ST;
}

function stringifySlashCommandArgumentValue(value: SlashCommandNamedArgumentValue | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map(item => String(item)).join('');
  }

  return String(value);
}

/**
 * 读取 STScript 布尔参数。
 *
 * SlashCommand 的 bool 参数在 callback 中仍是字符串，不能直接用 truthy/falsy 判断。
 */
export function isSlashCommandArgumentTrue(value: SlashCommandNamedArgumentValue | undefined): boolean {
  const normalized = stringifySlashCommandArgumentValue(value)?.trim().toLowerCase();
  return normalized === 'true' || normalized === 'on' || normalized === '1' || normalized === 'yes';
}

function normalizeDefaultValue(value: SlashCommandDefaultValueInput | undefined): SlashCommandArgumentDefaultValue | undefined {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }

  return value;
}

function normalizeDefaultValueOption<TProps extends { defaultValue?: SlashCommandDefaultValueInput }>(
  props: TProps,
): Omit<TProps, 'defaultValue'> & { defaultValue?: SlashCommandArgumentDefaultValue } {
  const { defaultValue, ...rest } = props;

  if (!('defaultValue' in props)) {
    return rest;
  }

  return {
    ...rest,
    defaultValue: normalizeDefaultValue(defaultValue),
  };
}

function createUnnamedArgumentProps(
  descriptionOrProps: string | SlashCommandArgumentProps,
  typeList?: SlashCommandArgumentTypeList,
  options: SlashCommandArgumentBuilderOptions = {},
): SlashCommandArgumentProps {
  if (typeof descriptionOrProps !== 'string') {
    return descriptionOrProps;
  }

  return {
    ...normalizeDefaultValueOption(options),
    description: descriptionOrProps,
    ...(typeList === undefined ? {} : { typeList }),
  };
}

function createNamedArgumentProps(
  nameOrProps: string | SlashCommandNamedArgumentProps,
  description?: string,
  typeList?: SlashCommandArgumentTypeList,
  options: SlashCommandNamedArgumentBuilderOptions = {},
): SlashCommandNamedArgumentProps {
  if (typeof nameOrProps !== 'string') {
    return nameOrProps;
  }

  if (description === undefined) {
    throw new Error(`Slash command named argument "${nameOrProps}" requires a description.`);
  }

  return {
    ...normalizeDefaultValueOption(options),
    name: nameOrProps,
    description,
    ...(typeList === undefined ? {} : { typeList }),
  };
}

/**
 * 斜杠命令流式构造器。
 *
 * 通过链式调用配置命令元信息、参数定义与回调。
 * 调用 build() 仅生成命令对象，调用 register() 会同时注册到解析器。
 */
export class SlashCommandBuilder<TNamedArguments extends object = Record<never, never>> {
  private readonly props: SlashCommandProps;

  private readonly namedArgumentProps: SlashCommandNamedArgumentProps[] = [];

  private readonly unnamedArgumentProps: SlashCommandArgumentProps[] = [];

  constructor(name: string) {
    this.props = { name };
  }

  /** 设置命令别名（可传入多个）。 */
  aliases(...aliases: string[]): this {
    this.props.aliases = aliases;
    return this;
  }

  /** 设置帮助文本（显示在命令说明中）。 */
  help(helpString: string): this {
    this.props.helpString = helpString;
    return this;
  }

  /** 设置命令返回值说明文本。 */
  returns(returns: string): this {
    this.props.returns = returns;
    return this;
  }

  /**
   * 启用位置参数拆分。
   *
   * @param count 可选的拆分数量上限。
   */
  splitUnnamedArgument(count?: number): this {
    this.props.splitUnnamedArgument = true;
    if (count !== undefined) {
      this.props.splitUnnamedArgumentCount = count;
    }
    return this;
  }

  /**
   * 控制是否保留原始引号。
   *
   * @param enabled 默认 true。
   */
  rawQuotes(enabled = true): this {
    this.props.rawQuotes = enabled;
    return this;
  }

  /**
   * 添加具名参数定义。
   *
   * 支持直接传入完整参数对象，或按 name/description/typeList/options 逐项构建。
   */
  named<const TProps extends SlashCommandNamedArgumentProps>(
    props: TProps,
  ): SlashCommandBuilder<TNamedArguments & SlashCommandNamedArgumentPropsInference<TProps>>;
  named<
    const TName extends string,
    const TTypeList extends SlashCommandArgumentTypeList | undefined = undefined,
    const TOptions extends SlashCommandNamedArgumentBuilderOptions = Record<never, never>,
  >(
    name: TName,
    description: string,
    typeList?: TTypeList,
    options?: TOptions,
  ): SlashCommandBuilder<TNamedArguments & SlashCommandNamedArgumentInference<TName, TTypeList, TOptions>>;
  named(
    nameOrProps: string | SlashCommandNamedArgumentProps,
    description?: string,
    typeList?: SlashCommandArgumentTypeList,
    options: SlashCommandNamedArgumentBuilderOptions = {},
  ): SlashCommandBuilder<TNamedArguments & AnyNamedArguments> {
    this.namedArgumentProps.push(createNamedArgumentProps(nameOrProps, description, typeList, options));
    return this as unknown as SlashCommandBuilder<TNamedArguments & AnyNamedArguments>;
  }

  /**
   * 添加位置参数定义。
   *
   * 支持直接传入完整参数对象，或按 description/typeList/options 逐项构建。
   */
  unnamed(props: SlashCommandArgumentProps): this;
  unnamed(
    description: string,
    typeList?: SlashCommandArgumentTypeList,
    options?: SlashCommandArgumentBuilderOptions,
  ): this;
  unnamed(
    descriptionOrProps: string | SlashCommandArgumentProps,
    typeList?: SlashCommandArgumentTypeList,
    options: SlashCommandArgumentBuilderOptions = {},
  ): this {
    this.unnamedArgumentProps.push(createUnnamedArgumentProps(descriptionOrProps, typeList, options));
    return this;
  }

  /** 设置命令回调。调用 build/register 前必须提供。 */
  callback(callback: SlashCommandTypedCallback<TNamedArguments>): this {
    this.props.callback = callback as SlashCommandProps['callback'];
    return this;
  }

  /**
   * 构建 SlashCommand 对象（不注册）。
   *
   * 会校验命令名与回调是否已设置。
   */
  build(): SlashCommand {
    const name = this.props.name?.trim();
    if (!name) {
      throw new Error('Slash command name cannot be empty.');
    }
    if (!this.props.callback) {
      throw new Error(`Slash command "${name}" requires a callback before build/register.`);
    }

    const st = getSlashCommandContext();
    return st.SlashCommand.fromProps({
      ...this.props,
      name,
      namedArgumentList: this.namedArgumentProps.map(props => st.SlashCommandNamedArgument.fromProps(props)),
      unnamedArgumentList: this.unnamedArgumentProps.map(props => st.SlashCommandArgument.fromProps(props)),
    });
  }

  /** 构建并注册命令，返回已注册的命令对象。 */
  register(): SlashCommand {
    const command = this.build();
    getSlashCommandContext().SlashCommandParser.addCommandObject(command);
    return command;
  }

  /** 构建并跳过名称合法性检查进行注册。通常只应在兼容酒馆内部保留命令名时使用。 */
  registerUnsafe(): SlashCommand {
    const command = this.build();
    getSlashCommandContext().SlashCommandParser.addCommandObjectUnsafe(command);
    return command;
  }
}

/**
 * 创建斜杠命令构造器实例。
 *
 * @param name 命令名称。
 */
export function slashCommand(name: string): SlashCommandBuilder {
  return new SlashCommandBuilder(name);
}
