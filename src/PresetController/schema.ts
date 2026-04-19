import { z } from 'zod';

const NonEmptyStringSchema = z.string().trim().min(1);

function findDuplicateIndexes(values: string[]): number[] {
  const firstIndexByValue = new Map<string, number>();
  const duplicateIndexes = new Set<number>();

  values.forEach((value, index) => {
    const firstIndex = firstIndexByValue.get(value);
    if (typeof firstIndex === 'number') {
      duplicateIndexes.add(firstIndex);
      duplicateIndexes.add(index);
      return;
    }

    firstIndexByValue.set(value, index);
  });

  return [...duplicateIndexes];
}

function addDuplicateIssues(
  ctx: z.RefinementCtx,
  values: string[],
  pathPrefix: (string | number)[],
  fieldName: string,
  message: string,
) {
  findDuplicateIndexes(values).forEach(index => {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [...pathPrefix, index, fieldName],
      message,
    });
  });
}

export const PositionPercentSchema = z.object({
  xPercent: z.number(),
  yPercent: z.number(),
});

export const TargetNamesSchema = z
  .union([NonEmptyStringSchema, z.array(NonEmptyStringSchema).min(1)])
  .transform(value => {
    const list = Array.isArray(value) ? value : [value];
    return [...new Set(list)];
  });

export const SwitchControlSchema = z
  .object({
    type: z.literal('switch'),
    id: NonEmptyStringSchema,
    label: NonEmptyStringSchema.optional(),
    targets: TargetNamesSchema,
    value: z.boolean().optional(),
  })
  .transform(value => ({
    ...value,
    value: value.value ?? false,
  }));

export const RadioOptionSchema = z.object({
  value: NonEmptyStringSchema,
  label: NonEmptyStringSchema,
  targets: TargetNamesSchema,
});

export const RadioControlSchema = z
  .object({
    type: z.literal('radio'),
    id: NonEmptyStringSchema,
    label: NonEmptyStringSchema.optional(),
    value: NonEmptyStringSchema.optional(),
    selected: NonEmptyStringSchema.optional(),
    options: z.array(RadioOptionSchema).min(1),
  })
  .superRefine((control, ctx) => {
    const selectedValue = control.value ?? control.selected ?? control.options[0]?.value;
    if (!selectedValue || !control.options.some(option => option.value === selectedValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'radio 的 value/selected 必须对应 options 里的 value',
      });
    }

    addDuplicateIssues(
      ctx,
      control.options.map(option => option.value),
      ['options'],
      'value',
      'radio option.value 不能重复',
    );
  })
  .transform(control => ({
    type: 'radio' as const,
    id: control.id,
    label: control.label,
    options: control.options,
    value: control.value ?? control.selected ?? control.options[0]!.value,
  }));

export const ControlSchema = z.discriminatedUnion('type', [SwitchControlSchema, RadioControlSchema]);

export const LabeledItemSchema = z.object({
  id: NonEmptyStringSchema,
  label: NonEmptyStringSchema,
  description: NonEmptyStringSchema.optional(),
  controls: z.array(ControlSchema).min(1),
});

export const GroupSchema = z
  .object({
    id: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    description: NonEmptyStringSchema.optional(),
    items: z.array(LabeledItemSchema).default([]),
  })
  .superRefine((group, ctx) => {
    addDuplicateIssues(
      ctx,
      group.items.map(item => item.id),
      ['items'],
      'id',
      '同一 group 下 item.id 不能重复',
    );
  });

export const ControllerConfigSchema = z
  .object({
    schema: z.literal('preset-controller/v1').default('preset-controller/v1'),
    title: z.string().default('通用预设控制器'),
    description: z.string().default('将规则映射到 in_use 预设提示词开关'),
    groups: z.array(GroupSchema).default([]),
  })
  .prefault({})
  .superRefine((config, ctx) => {
    addDuplicateIssues(
      ctx,
      config.groups.map(group => group.id),
      ['groups'],
      'id',
      'group.id 不能重复',
    );

    const seenControls = new Map<string, [number, number, number]>();
    config.groups.forEach((group, groupIndex) => {
      group.items.forEach((item, itemIndex) => {
        item.controls.forEach((control, controlIndex) => {
          const seen = seenControls.get(control.id);
          if (seen) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['groups', groupIndex, 'items', itemIndex, 'controls', controlIndex, 'id'],
              message: 'control.id 必须全局唯一',
            });
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['groups', seen[0], 'items', seen[1], 'controls', seen[2], 'id'],
              message: 'control.id 必须全局唯一',
            });
            return;
          }

          seenControls.set(control.id, [groupIndex, itemIndex, controlIndex]);
        });
      });
    });
  });

export const UiStateSchema = z
  .object({
    collapsed: z.boolean().default(false),
    autoApply: z.boolean().default(true),
    position: PositionPercentSchema.optional(),
    groupCollapsed: z.record(z.string(), z.boolean()).default({}),
    importFormat: z.enum(['auto', 'json', 'yaml']).default('auto'),
  })
  .prefault({});

export const ImportFormatSchema = z.enum(['auto', 'json', 'yaml']);

export type Position = {
  x: number;
  y: number;
};

export type PositionPercent = z.infer<typeof PositionPercentSchema>;
export type SwitchControl = z.infer<typeof SwitchControlSchema>;
export type RadioControl = z.infer<typeof RadioControlSchema>;
export type ControllerControl = z.infer<typeof ControlSchema>;
export type ControllerConfig = z.infer<typeof ControllerConfigSchema>;
export type UiState = z.infer<typeof UiStateSchema>;
export type ImportFormat = z.infer<typeof ImportFormatSchema>;

export type ControlLocation = {
  groupIndex: number;
  itemIndex: number;
  controlIndex: number;
};

export type StatusLevel = 'idle' | 'working' | 'success' | 'warning' | 'error';

export type ControllerState = {
  config: ControllerConfig;
  ui: UiState;
  dirty: boolean;
  applying: boolean;
  statusLevel: StatusLevel;
  statusText: string;
};

export type ApplyResult = {
  touchedPromptCount: number;
  missingTargets: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeConfig(raw: unknown): ControllerConfig {
  return ControllerConfigSchema.parse(isRecord(raw) ? raw : {});
}

export function normalizeUiState(raw: unknown): UiState {
  return UiStateSchema.parse(isRecord(raw) ? raw : {});
}

export function formatError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map(issue => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join('; ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
