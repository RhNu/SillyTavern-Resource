import { z } from 'zod';

export const CONFIG_SCHEMA_VERSION = 3;

const NonEmptyStringSchema = z.string().trim().min(1);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

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
      code: 'custom',
      path: [...pathPrefix, index, fieldName],
      message,
    });
  });
}

export const SetPromptEnabledOperationSchema = z
  .object({
    type: z.literal('set-prompt-enabled'),
    target: NonEmptyStringSchema.describe('提示词目标名称。'),
    enabled: z.boolean().describe('是否启用该提示词。'),
  })
  .describe('将指定提示词设为启用或禁用。');

export const ControlOperationSchema = z.discriminatedUnion('type', [SetPromptEnabledOperationSchema]).describe('控制器操作。');

export const ToggleControlSchema = z
  .object({
    type: z.literal('toggle'),
    id: NonEmptyStringSchema.describe('操作 ID，需全局唯一。'),
    label: NonEmptyStringSchema.optional().describe('显示名称。'),
    description: NonEmptyStringSchema.optional().describe('操作说明。'),
    value: z.boolean().optional().describe('当前开关值。'),
    operations: z
      .object({
        on: z.array(ControlOperationSchema).default([]).describe('开关打开时执行的操作。'),
        off: z.array(ControlOperationSchema).default([]).describe('开关关闭时执行的操作。'),
      })
      .prefault({})
      .describe('toggle 在不同状态下执行的操作列表。'),
  })
  .describe('开关操作。根据当前 value 执行 operations.on 或 operations.off。')
  .transform(value => ({
    ...value,
    value: value.value ?? false,
  }));

export const RadioOptionSchema = z
  .object({
    value: NonEmptyStringSchema.describe('选项值。'),
    label: NonEmptyStringSchema.describe('选项显示名称。'),
    description: NonEmptyStringSchema.optional().describe('选项说明。'),
    operations: z.array(ControlOperationSchema).default([]).describe('选中该选项时执行的操作。'),
  })
  .describe('单个互斥选项。');

export const RadioControlSchema = z
  .object({
    type: z.literal('radio'),
    id: NonEmptyStringSchema.describe('操作 ID，需全局唯一。'),
    label: NonEmptyStringSchema.optional().describe('显示名称。'),
    description: NonEmptyStringSchema.optional().describe('操作说明。'),
    value: NonEmptyStringSchema.optional().describe('当前选中的 option.value。'),
    options: z.array(RadioOptionSchema).min(1).describe('互斥选项列表。'),
  })
  .describe('单选操作。仅当前 value 对应的选项会执行它的 operations。')
  .superRefine((control, ctx) => {
    const selectedValue = control.value ?? control.options[0]?.value;
    if (!selectedValue || !control.options.some(option => option.value === selectedValue)) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'radio 的 value 必须对应 options 里的 value',
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
    description: control.description,
    options: control.options,
    value: control.value ?? control.options[0]!.value,
  }));

export const ControlSchema = z
  .discriminatedUnion('type', [ToggleControlSchema, RadioControlSchema])
  .describe('操作定义。');

export const GroupSchema = z
  .object({
    id: NonEmptyStringSchema.describe('分组 ID，需唯一。'),
    title: NonEmptyStringSchema.describe('分组标题。仅用于界面展示。'),
    description: NonEmptyStringSchema.optional().describe('分组说明。仅用于界面展示。'),
    controls: z.array(ControlSchema).default([]).describe('分组下的操作标签列表。'),
  })
  .describe('视觉分组，仅负责组织操作标签。');

export const ControllerConfigSchema = z
  .object({
    schema: z.literal(CONFIG_SCHEMA_VERSION).default(CONFIG_SCHEMA_VERSION).describe('配置格式版本。'),
    title: z.string().default('通用预设控制器').describe('控制器标题。'),
    description: z.string().default('将界面 control 映射为对 in_use 预设执行的 operations').describe('控制器说明文本。'),
    groups: z.array(GroupSchema).default([]).describe('视觉分组列表。'),
  })
  .describe('PresetController 配置根对象。')
  .prefault({})
  .superRefine((config, ctx) => {
    addDuplicateIssues(
      ctx,
      config.groups.map(group => group.id),
      ['groups'],
      'id',
      'group.id 不能重复',
    );

    const seenControls = new Map<string, [number, number]>();
    config.groups.forEach((group, groupIndex) => {
      group.controls.forEach((control, controlIndex) => {
        const seen = seenControls.get(control.id);
        if (seen) {
          ctx.addIssue({
            code: 'custom',
            path: ['groups', groupIndex, 'controls', controlIndex, 'id'],
            message: 'control.id 必须全局唯一',
          });
          ctx.addIssue({
            code: 'custom',
            path: ['groups', seen[0], 'controls', seen[1], 'id'],
            message: 'control.id 必须全局唯一',
          });
          return;
        }

        seenControls.set(control.id, [groupIndex, controlIndex]);
      });
    });
  });

export type SetPromptEnabledOperation = z.infer<typeof SetPromptEnabledOperationSchema>;
export type ControllerOperation = z.infer<typeof ControlOperationSchema>;
export type ToggleControl = z.infer<typeof ToggleControlSchema>;
export type RadioControl = z.infer<typeof RadioControlSchema>;
export type ControllerControl = z.infer<typeof ControlSchema>;
export type ControllerConfig = z.infer<typeof ControllerConfigSchema>;

export type ControlLocation = {
  groupIndex: number;
  controlIndex: number;
};

export type ApplyResult = {
  touchedPromptCount: number;
  missingTargets: string[];
};

export function sanitizeImportedConfigRoot(raw: unknown): unknown {
  if (!isRecord(raw) || !Object.prototype.hasOwnProperty.call(raw, '$schema')) {
    return raw;
  }

  const { $schema: _ignored, ...rest } = raw;
  return rest;
}

export function normalizeConfig(raw: unknown): ControllerConfig {
  return ControllerConfigSchema.parse(isRecord(raw) ? raw : {});
}

export function createControllerConfigJsonSchema() {
  return z.toJSONSchema(ControllerConfigSchema, { io: 'input' });
}

export function stringifyControllerConfigJsonSchema() {
  return JSON.stringify(createControllerConfigJsonSchema(), null, 2);
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
