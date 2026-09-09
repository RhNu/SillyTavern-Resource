declare module '*?raw' {
  const content: string;
  export default content;
}
declare module 'https://*';
declare module '*?url' {
  const content: string;
  export default content;
}
declare module '*.css' {
  const content: unknown;
  export default content;
}
declare module '*.scss' {
  const content: unknown;
  export default content;
}
declare module '*.html' {
  const content: string;
  export default content;
}
declare module '*.md' {
  const content: string;
  export default content;
}
declare module '*.yaml' {
  const content: any;
  export default content;
}

type PartialDeep<T> = import('type-fest').PartialDeep<T>;
type LiteralUnion<
  LiteralType,
  BaseType extends string | number | bigint | boolean | null | undefined = string,
> = import('type-fest').LiteralUnion<LiteralType, BaseType>;
type SetRequired<BaseType, Keys extends keyof BaseType> = import('type-fest').SetRequired<BaseType, Keys>;

/** 酒馆助手声明文件仍使用 type-fest 旧版的全局命名空间写法。 */
declare namespace TypeFest {
  type PartialDeep<T> = import('type-fest').PartialDeep<T>;
  type LiteralUnion<
    LiteralType,
    BaseType extends string | number | bigint | boolean | null | undefined = string,
  > = import('type-fest').LiteralUnion<LiteralType, BaseType>;
  type SetRequired<BaseType, Keys extends keyof BaseType> = import('type-fest').SetRequired<BaseType, Keys>;
}

declare const YAML: typeof import('yaml');

declare const z: typeof import('zod');
declare namespace z {
  export type infer<T> = import('zod').infer<T>;
  export type input<T> = import('zod').input<T>;
  export type output<T> = import('zod').output<T>;
}

declare module 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js' {
  export function registerMvuSchema(
    schema: z.ZodType<Record<string, any>> | (() => z.ZodType<Record<string, any>>),
  ): void;
}
