import { afterEach, describe, expect, expectTypeOf, test, vi } from 'vitest';

import {
  slashCommand,
  slashCommandArgumentTypes,
  type SlashCommand,
  type SlashCommandAbortController,
  type SlashCommandArgument,
  type SlashCommandArgumentProps,
  type SlashCommandArgumentValue,
  type SlashCommandCallbackContext,
  type SlashCommandDebugController,
  type SlashCommandNamedArgument,
  type SlashCommandNamedArgumentProps,
  type SlashCommandNamedArguments,
  type SlashCommandParserFlags,
  type SlashCommandProps,
  type SlashCommandScope,
} from './slash-command';

function stubSillyTavernSlashCommands() {
  const namedFromProps = vi.fn(
    (props: SlashCommandNamedArgumentProps) => props as unknown as SlashCommandNamedArgument,
  );
  const unnamedFromProps = vi.fn((props: SlashCommandArgumentProps) => props as unknown as SlashCommandArgument);
  const commandFromProps = vi.fn((props: SlashCommandProps) => props as unknown as SlashCommand);
  const addCommandObject = vi.fn();
  const addCommandObjectUnsafe = vi.fn();

  vi.stubGlobal('SillyTavern', {
    SlashCommand: { fromProps: commandFromProps },
    SlashCommandArgument: { fromProps: unnamedFromProps },
    SlashCommandNamedArgument: { fromProps: namedFromProps },
    SlashCommandParser: { addCommandObject, addCommandObjectUnsafe },
  });

  return { namedFromProps, unnamedFromProps, commandFromProps, addCommandObject, addCommandObjectUnsafe };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('slashCommand type inference', () => {
  test('infers named argument shapes and split unnamed arguments', () => {
    const builder = slashCommand('typed')
      .named('enabled', 'boolean option', slashCommandArgumentTypes.bool)
      .named('cached', 'boolean option with default', slashCommandArgumentTypes.bool, { defaultValue: false })
      .named('mode', 'required enum', slashCommandArgumentTypes.string, {
        enumList: ['fast', 'safe'],
        isRequired: true,
      })
      .named({
        name: 'tag',
        description: 'repeatable enum',
        enumList: ['one', 'two'],
        acceptsMultiple: true,
      })
      .splitUnnamedArgument()
      .callback(context => {
        expectTypeOf(context.named.enabled).toEqualTypeOf<boolean | undefined>();
        expectTypeOf(context.named.cached).toEqualTypeOf<boolean>();
        expectTypeOf(context.named.mode).toEqualTypeOf<'fast' | 'safe'>();
        expectTypeOf(context.named.tag).toEqualTypeOf<Array<'one' | 'two'> | undefined>();
        expectTypeOf(context.unnamed).toEqualTypeOf<SlashCommandArgumentValue[]>();
        expectTypeOf(context.scope).toEqualTypeOf<SlashCommandScope>();
      });

    expectTypeOf(builder.build).returns.toEqualTypeOf<SlashCommand>();
  });

  test('requires a callback before build and register at compile time', () => {
    const assertIncompleteBuilder = () => {
      const incompleteBuilder = slashCommand('incomplete');
      // @ts-expect-error build is unavailable until callback() changes the builder state.
      incompleteBuilder.build();
      // @ts-expect-error register is unavailable until callback() changes the builder state.
      incompleteBuilder.register();

      const completedBuilder = incompleteBuilder.callback(() => undefined);
      // @ts-expect-error named arguments must be declared before callback() fixes its context type.
      completedBuilder.named('late', 'late argument');
    };
    expectTypeOf(assertIncompleteBuilder).toBeFunction();
  });
});

describe('SlashCommandBuilder', () => {
  test('normalizes shorthand props and adapts the native callback context', async () => {
    const stubs = stubSillyTavernSlashCommands();
    const callback = vi.fn();

    const command = slashCommand('  demo  ')
      .aliases('d')
      .help('Demo command')
      .returns('text')
      .rawQuotes()
      .named('enabled', 'toggle feature', slashCommandArgumentTypes.bool, { defaultValue: false })
      .unnamed('count', slashCommandArgumentTypes.number, { defaultValue: 3 })
      .callback(callback)
      .register();

    expect(stubs.namedFromProps).toHaveBeenCalledWith({
      name: 'enabled',
      description: 'toggle feature',
      typeList: 'bool',
      defaultValue: 'false',
    });
    expect(stubs.unnamedFromProps).toHaveBeenCalledWith({
      description: 'count',
      typeList: 'number',
      defaultValue: '3',
    });
    expect(stubs.commandFromProps).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'demo',
        aliases: ['d'],
        helpString: 'Demo command',
        returns: 'text',
        rawQuotes: true,
      }),
    );
    expect(stubs.addCommandObject).toHaveBeenCalledWith(command);
    expect(stubs.addCommandObjectUnsafe).not.toHaveBeenCalled();

    const nativeCallback = stubs.commandFromProps.mock.calls[0][0].callback!;
    const rawContext = {
      _scope: {} as SlashCommandScope,
      _parserFlags: {} as SlashCommandParserFlags,
      _abortController: {} as SlashCommandAbortController,
      _debugController: {} as SlashCommandDebugController,
      _hasUnnamedArgument: false,
    } as SlashCommandNamedArguments;
    await expect(nativeCallback(rawContext, '')).resolves.toBe('');
    expect(callback).toHaveBeenCalledWith({
      named: { enabled: false },
      unnamed: ['3'],
      scope: rawContext._scope,
      parserFlags: rawContext._parserFlags,
      abortController: rawContext._abortController,
      debugController: rawContext._debugController,
    } satisfies SlashCommandCallbackContext<{ enabled: boolean }>);
  });

  test('normalizes boolean values and canonicalizes named argument aliases', async () => {
    const stubs = stubSillyTavernSlashCommands();
    const callback = vi.fn(() => 'done');
    slashCommand('normalize')
      .named({
        name: 'enabled',
        aliasList: 'e',
        description: 'boolean option',
        typeList: slashCommandArgumentTypes.bool,
      })
      .callback(callback)
      .build();

    const nativeCallback = stubs.commandFromProps.mock.calls[0][0].callback!;
    await nativeCallback(
      {
        e: 'off',
        _scope: {} as SlashCommandScope,
        _parserFlags: {} as SlashCommandParserFlags,
        _abortController: {} as SlashCommandAbortController,
        _debugController: {} as SlashCommandDebugController,
        _hasUnnamedArgument: true,
      } as unknown as SlashCommandNamedArguments,
      'text',
    );

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ named: { enabled: false }, unnamed: ['text'] }));
  });

  test('rejects missing required arguments and values outside a static enum', async () => {
    const stubs = stubSillyTavernSlashCommands();
    slashCommand('validate')
      .named('mode', 'mode', slashCommandArgumentTypes.string, {
        enumList: ['fast', 'safe'],
        isRequired: true,
      })
      .callback(() => undefined)
      .build();

    const nativeCallback = stubs.commandFromProps.mock.calls[0][0].callback!;
    const metadata = {
      _scope: {} as SlashCommandScope,
      _parserFlags: {} as SlashCommandParserFlags,
      _abortController: {} as SlashCommandAbortController,
      _debugController: {} as SlashCommandDebugController,
      _hasUnnamedArgument: false,
    } as unknown as SlashCommandNamedArguments;

    await expect(nativeCallback(metadata, '')).rejects.toThrow('required argument "mode" is missing');
    await expect(
      nativeCallback({ ...metadata, mode: 'slow' } as unknown as SlashCommandNamedArguments, ''),
    ).rejects.toThrow('must be one of: fast, safe');
  });
});
