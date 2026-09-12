import type { Simplify } from 'type-fest';

/** 与 SillyTavern `ARGUMENT_TYPE` 对应的小写参数类型表。 */
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

type EmptyObject = Record<never, never>;
type AnyNamedArguments = Record<string, SlashCommandNamedArgumentValue | undefined>;
type SlashCommandArgumentTypeList = SlashCommandArgumentProps['typeList'];
type SlashCommandDefaultValueInput = SlashCommandArgumentDefaultValue | boolean | number;

/** SillyTavern 原生布尔解析器识别的全部输入字符串。 */
export type SlashCommandBooleanInput = 'true' | 'false' | 'on' | 'off' | '1' | '0';

export type SlashCommandArgumentBuilderOptions = Omit<
  SlashCommandArgumentProps,
  'description' | 'typeList' | 'defaultValue'
> & {
  /** 数字和布尔值会在交给 SillyTavern 前转换为字符串。 */
  defaultValue?: SlashCommandDefaultValueInput;
};

export type SlashCommandNamedArgumentBuilderOptions = Omit<
  SlashCommandNamedArgumentProps,
  'name' | 'description' | 'typeList' | 'defaultValue'
> & {
  /** 数字和布尔值会在交给 SillyTavern 前转换为字符串。 */
  defaultValue?: SlashCommandDefaultValueInput;
};

/* -------------------------------------------------------------------------------------------------
 * Callback 类型推导
 * ------------------------------------------------------------------------------------------------- */

/** 从字符串或 SlashCommandEnumValue 风格的对象中提取 enumList 的字面量值。 */
type EnumItemValue<T> = T extends string ? T : T extends { value: infer Value extends string } ? Value : string;

type EnumListValue<T> = T extends readonly (infer Item)[] ? EnumItemValue<Item> : EnumItemValue<T>;
type TypeListItem<T> = T extends readonly (infer Item)[] ? Item : T;

/** 只有 typeList 精确地只包含某个类型时才窄化，混合类型仍保留通用值类型。 */
type TypeListContainsOnly<TTypeList, TExpected extends SlashCommandArgumentType> = [
  Exclude<TypeListItem<TTypeList>, TExpected>,
] extends [never]
  ? [Extract<TypeListItem<TTypeList>, TExpected>] extends [never]
    ? false
    : true
  : false;

type InferredSingleArgumentValue<TTypeList, TOptions> = TOptions extends { enumList: infer EnumList }
  ? EnumListValue<EnumList>
  : TypeListContainsOnly<TTypeList, 'bool'> extends true
    ? boolean
    : SlashCommandArgumentValue;

type InferredNamedArgumentValue<TTypeList, TOptions> = TOptions extends { acceptsMultiple: true }
  ? Array<InferredSingleArgumentValue<TTypeList, TOptions>>
  : InferredSingleArgumentValue<TTypeList, TOptions>;

type InferredNamedArgument<TName extends string, TTypeList, TOptions> = string extends TName
  ? AnyNamedArguments
  : TOptions extends { isRequired: true } | { defaultValue: Exclude<SlashCommandDefaultValueInput, null | undefined> }
    ? { [Key in TName]: InferredNamedArgumentValue<TTypeList, TOptions> }
    : { [Key in TName]?: InferredNamedArgumentValue<TTypeList, TOptions> };

type InferredNamedArgumentFromProps<TProps> = TProps extends { name: infer Name extends string }
  ? InferredNamedArgument<Name, TProps extends { typeList?: infer TypeList } ? TypeList : undefined, TProps>
  : AnyNamedArguments;

type MergeNamedArguments<TCurrent extends object, TAdded extends object> = Simplify<TCurrent & TAdded>;

/** 传给业务 callback 的稳定上下文，不再暴露 SillyTavern 混入具名参数的 `_...` 内部字段。 */
export type SlashCommandCallbackContext<TNamedArguments extends object = EmptyObject> = {
  /** 已应用默认值并按参数定义归一化的具名参数。 */
  named: TNamedArguments;
  /** 始终为数组；未提供位置参数时为空数组。 */
  unnamed: SlashCommandArgumentValue[];
  /** 当前 STScript 作用域。 */
  scope: SlashCommandScope;
  parserFlags: SlashCommandParserFlags;
  abortController: SlashCommandAbortController;
  debugController: SlashCommandDebugController;
};

export type SlashCommandCallback<TNamedArguments extends object = EmptyObject> = (
  context: SlashCommandCallbackContext<TNamedArguments>,
) => SlashCommandReturnValue | Promise<SlashCommandReturnValue>;

/* -------------------------------------------------------------------------------------------------
 * 运行时参数归一化
 * ------------------------------------------------------------------------------------------------- */

function getSlashCommandContext(): ST {
  return SillyTavern as ST;
}

function toTypeList(typeList: SlashCommandArgumentTypeList): SlashCommandArgumentType[] {
  if (typeList === undefined) return ['string'];
  return Array.isArray(typeList) ? typeList : [typeList];
}

function getEnumValues(enumList: SlashCommandArgumentProps['enumList']): string[] {
  if (enumList === undefined) return [];
  const items = Array.isArray(enumList) ? enumList : [enumList];
  return items.map(item => (typeof item === 'string' ? item : item.value));
}

function parseBooleanArgument(commandName: string, argumentName: string, value: SlashCommandArgumentValue): boolean {
  if (typeof value !== 'string') {
    throw new TypeError(`Slash command "/${commandName}": argument "${argumentName}" must be a boolean.`);
  }

  const normalized = value.trim().toLowerCase() as SlashCommandBooleanInput;
  if (normalized === 'true' || normalized === 'on' || normalized === '1') return true;
  if (normalized === 'false' || normalized === 'off' || normalized === '0') return false;
  throw new TypeError(`Slash command "/${commandName}": argument "${argumentName}" must be a boolean.`);
}

/** 根据构造器承诺的静态契约转换值；动态 enumProvider 无法在此处同步校验。 */
function normalizeNamedArgumentValue(
  commandName: string,
  props: SlashCommandNamedArgumentProps,
  value: SlashCommandNamedArgumentValue,
): unknown {
  const enumValues = getEnumValues(props.enumList);
  const normalizeSingle = (item: SlashCommandArgumentValue): SlashCommandArgumentValue | boolean => {
    if (enumValues.length > 0) {
      const stringValue = typeof item === 'string' ? item : undefined;
      if (stringValue === undefined || !enumValues.includes(stringValue)) {
        throw new TypeError(
          `Slash command "/${commandName}": argument "${props.name}" must be one of: ${enumValues.join(', ')}.`,
        );
      }
      return stringValue;
    }

    return typeListContainsOnly(toTypeList(props.typeList), 'bool')
      ? parseBooleanArgument(commandName, props.name, item)
      : item;
  };

  if (Array.isArray(value)) return value.map(normalizeSingle);
  const normalized = normalizeSingle(value);
  return props.acceptsMultiple ? [normalized] : normalized;
}

function typeListContainsOnly(typeList: SlashCommandArgumentType[], expected: SlashCommandArgumentType): boolean {
  return typeList.length > 0 && typeList.every(type => type === expected);
}

function hasDefaultValue(props: SlashCommandArgumentProps): boolean {
  return props.defaultValue !== undefined && props.defaultValue !== null;
}

function createCallbackContext<TNamedArguments extends object>(
  commandName: string,
  definitions: SlashCommandNamedArgumentProps[],
  unnamedDefinitions: SlashCommandArgumentProps[],
  rawNamed: SlashCommandNamedArguments,
  rawUnnamed: SlashCommandUnnamedArguments,
): SlashCommandCallbackContext<TNamedArguments> {
  const {
    _scope: scope,
    _parserFlags: parserFlags,
    _abortController: abortController,
    _debugController: debugController,
    _hasUnnamedArgument: hasUnnamedArgument,
    ...userNamedArguments
  } = rawNamed;

  for (const definition of definitions) {
    const aliases =
      definition.aliasList === undefined
        ? []
        : Array.isArray(definition.aliasList)
          ? definition.aliasList
          : [definition.aliasList];
    const suppliedName = [definition.name, ...aliases].find(name => userNamedArguments[name] !== undefined);
    let value = suppliedName === undefined ? undefined : userNamedArguments[suppliedName];

    for (const alias of aliases) delete userNamedArguments[alias];
    if (value === undefined && hasDefaultValue(definition)) value = definition.defaultValue ?? undefined;
    if (value === undefined) {
      if (definition.isRequired) {
        throw new TypeError(`Slash command "/${commandName}": required argument "${definition.name}" is missing.`);
      }
      delete userNamedArguments[definition.name];
      continue;
    }

    userNamedArguments[definition.name] = normalizeNamedArgumentValue(commandName, definition, value) as never;
  }

  const unnamed = hasUnnamedArgument ? (Array.isArray(rawUnnamed) ? [...rawUnnamed] : [rawUnnamed]) : [];
  for (const [index, definition] of unnamedDefinitions.entries()) {
    if (unnamed[index] === undefined && hasDefaultValue(definition)) unnamed[index] = definition.defaultValue!;
    if (unnamed[index] === undefined && definition.isRequired) {
      throw new TypeError(`Slash command "/${commandName}": required unnamed argument ${index + 1} is missing.`);
    }
  }

  return {
    named: userNamedArguments as TNamedArguments,
    unnamed,
    scope,
    parserFlags,
    abortController,
    debugController,
  };
}

function normalizeDefaultValue(
  value: SlashCommandDefaultValueInput | undefined,
): SlashCommandArgumentDefaultValue | undefined {
  return typeof value === 'boolean' || typeof value === 'number' ? String(value) : value;
}

/** 保留“未提供 defaultValue”和“显式提供 undefined”之间的对象形状差异。 */
function normalizeDefaultValueOption<TProps extends { defaultValue?: SlashCommandDefaultValueInput }>(
  props: TProps,
): Omit<TProps, 'defaultValue'> & { defaultValue?: SlashCommandArgumentDefaultValue } {
  const { defaultValue, ...rest } = props;
  return Object.hasOwn(props, 'defaultValue') ? { ...rest, defaultValue: normalizeDefaultValue(defaultValue) } : rest;
}

function createUnnamedArgumentProps(
  descriptionOrProps: string | SlashCommandArgumentProps,
  typeList?: SlashCommandArgumentTypeList,
  options: SlashCommandArgumentBuilderOptions = {},
): SlashCommandArgumentProps {
  if (typeof descriptionOrProps !== 'string') return descriptionOrProps;
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
  if (typeof nameOrProps !== 'string') return nameOrProps;
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

/* -------------------------------------------------------------------------------------------------
 * Fluent command builder
 * ------------------------------------------------------------------------------------------------- */

/**
 * 斜杠命令流式构造器。
 *
 * 泛型状态会随链式调用累积：具名参数定义决定 callback 上下文中 `named` 的字段；
 * 设置 callback 后才允许 build/register，也不再允许追加会改变参数类型的具名参数。
 * 这些状态都只存在于类型层，不会改变生成的 SillyTavern 原生对象。
 */
export class SlashCommandBuilder<TNamedArguments extends object = EmptyObject, THasCallback extends boolean = false> {
  /** 让状态泛型参与结构类型判定；`declare` 不会产生运行时代码。 */
  declare private readonly typeState: {
    namedArguments: TNamedArguments;
    hasCallback: THasCallback;
  };

  private readonly props: SlashCommandProps;
  private readonly namedArgumentProps: SlashCommandNamedArgumentProps[] = [];
  private readonly unnamedArgumentProps: SlashCommandArgumentProps[] = [];

  constructor(name: string) {
    this.props = { name };
  }

  /** 替换命令别名列表。 */
  aliases(...aliases: string[]): this {
    this.props.aliases = aliases;
    return this;
  }

  /** 设置自动补全和命令浏览器显示的帮助文本。 */
  help(helpString: string): this {
    this.props.helpString = helpString;
    return this;
  }

  /** 设置命令浏览器显示的返回值说明；它不会转换 callback 的真实返回值。 */
  returns(returns: string): this {
    this.props.returns = returns;
    return this;
  }

  /** 让 SillyTavern 解析器保留各位置参数的边界；包装后的 callback 始终接收数组。 */
  splitUnnamedArgument(count?: number): this {
    this.props.splitUnnamedArgument = true;
    if (count !== undefined) this.props.splitUnnamedArgumentCount = count;
    return this;
  }

  /** 控制是否保留位置参数最外层的原始引号；省略参数表示启用，命令初始状态为禁用。 */
  rawQuotes(enabled = true): this {
    this.props.rawQuotes = enabled;
    return this;
  }

  /**
   * 添加具名参数，并把参数名、枚举字面量、bool、多值和必填状态累积到 callback 类型中。
   * 可传完整原生 props，也可使用 `(name, description, typeList, options)` 简写。
   */
  named<const TProps extends SlashCommandNamedArgumentProps>(
    this: SlashCommandBuilder<TNamedArguments, false>,
    props: TProps,
  ): SlashCommandBuilder<MergeNamedArguments<TNamedArguments, InferredNamedArgumentFromProps<TProps>>, false>;
  named<
    const TName extends string,
    const TTypeList extends SlashCommandArgumentTypeList | undefined = undefined,
    const TOptions extends SlashCommandNamedArgumentBuilderOptions = EmptyObject,
  >(
    this: SlashCommandBuilder<TNamedArguments, false>,
    name: TName,
    description: string,
    typeList?: TTypeList,
    options?: TOptions,
  ): SlashCommandBuilder<
    MergeNamedArguments<TNamedArguments, InferredNamedArgument<TName, TTypeList, TOptions>>,
    false
  >;
  named(
    nameOrProps: string | SlashCommandNamedArgumentProps,
    description?: string,
    typeList?: SlashCommandArgumentTypeList,
    options: SlashCommandNamedArgumentBuilderOptions = {},
  ): SlashCommandBuilder<AnyNamedArguments, false> {
    this.namedArgumentProps.push(createNamedArgumentProps(nameOrProps, description, typeList, options));
    return this as unknown as SlashCommandBuilder<AnyNamedArguments, false>;
  }

  /** 添加位置参数定义；包装层会处理默认值和必填校验，callback 中始终以数组读取。 */
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

  /**
   * 设置业务回调，并将 SillyTavern 的松散参数适配成稳定上下文。
   * null/undefined 返回值会转换为空字符串，避免原生执行器产生无意义的返回值警告。
   */
  callback(
    this: SlashCommandBuilder<TNamedArguments, false>,
    callback: SlashCommandCallback<TNamedArguments>,
  ): SlashCommandBuilder<TNamedArguments, true> {
    this.props.callback = async (rawNamed, rawUnnamed) => {
      const context = createCallbackContext<TNamedArguments>(
        this.props.name?.trim() ?? '',
        this.namedArgumentProps,
        this.unnamedArgumentProps,
        rawNamed,
        rawUnnamed,
      );
      return (await callback(context)) ?? '';
    };
    return this as unknown as SlashCommandBuilder<TNamedArguments, true>;
  }

  /** 构建原生 SlashCommand 对象但不注册。 */
  build(this: SlashCommandBuilder<TNamedArguments, true>): SlashCommand {
    const name = this.props.name?.trim();
    if (!name) throw new Error('Slash command name cannot be empty.');
    if (!this.props.callback) {
      // 覆盖 JavaScript 调用者、any 以及其他绕过编译期状态检查的情况。
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

  /** 构建并通过带保留名称检查的 SillyTavern API 注册命令。 */
  register(this: SlashCommandBuilder<TNamedArguments, true>): SlashCommand {
    const command = this.build();
    getSlashCommandContext().SlashCommandParser.addCommandObject(command);
    return command;
  }

  /** 构建并跳过保留名称检查进行注册；仅用于兼容 SillyTavern 内部命令名。 */
  registerUnsafe(this: SlashCommandBuilder<TNamedArguments, true>): SlashCommand {
    const command = this.build();
    getSlashCommandContext().SlashCommandParser.addCommandObjectUnsafe(command);
    return command;
  }
}

/** 创建一个尚未设置 callback 的斜杠命令构造器。 */
export function slashCommand(name: string): SlashCommandBuilder {
  return new SlashCommandBuilder(name);
}
