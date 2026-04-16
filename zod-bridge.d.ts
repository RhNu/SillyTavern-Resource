import type { ZodError as _ZodError, ZodObject as _ZodObject, ZodType as _ZodType } from 'zod';
import type { $ZodLooseShape, $ZodObjectConfig, $ZodTypeInternals } from 'zod/v4/core';

declare global {
  namespace z {
    interface ZodType<
      Output = unknown,
      Input = unknown,
      Internals extends $ZodTypeInternals<Output, Input> = $ZodTypeInternals<Output, Input>,
    > extends _ZodType<Output, Input, Internals> {}

    interface ZodObject<
      Shape extends $ZodLooseShape = $ZodLooseShape,
      Config extends $ZodObjectConfig = $ZodObjectConfig,
    > extends _ZodObject<Shape, Config> {}

    interface ZodError<T = unknown> extends _ZodError<T> {}
  }
}

export {};
