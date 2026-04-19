import { type ApplyResult, type ControllerConfig, type ControllerControl, type ControllerOperation } from './schema';

function applyOperationToPreset(
  operation: ControllerOperation,
  promptByName: Map<string, PresetPrompt[]>,
  missingTargets: Set<string>,
) {
  const prompts = promptByName.get(operation.target);
  if (!prompts?.length) {
    missingTargets.add(operation.target);
    return 0;
  }

  prompts.forEach(prompt => {
    prompt.enabled = operation.enabled;
  });

  return prompts.length;
}

function applyControlToPreset(
  control: ControllerControl,
  promptByName: Map<string, PresetPrompt[]>,
  missingTargets: Set<string>,
) {
  if (control.type === 'toggle') {
    return (control.value ? control.operations.on : control.operations.off).reduce(
      (count, operation) => count + applyOperationToPreset(operation, promptByName, missingTargets),
      0,
    );
  }

  const selectedOption = control.options.find(option => option.value === control.value);
  if (!selectedOption) {
    return 0;
  }

  return selectedOption.operations.reduce(
    (count, operation) => count + applyOperationToPreset(operation, promptByName, missingTargets),
    0,
  );
}

export async function applyConfigToInUsePreset(config: ControllerConfig): Promise<ApplyResult> {
  const preset = getPreset('in_use');
  const allPrompts = [...preset.prompts, ...preset.prompts_unused];
  const promptByName = new Map<string, PresetPrompt[]>();

  allPrompts.forEach(prompt => {
    if (!promptByName.has(prompt.name)) {
      promptByName.set(prompt.name, []);
    }

    promptByName.get(prompt.name)!.push(prompt);
  });

  const missingTargets = new Set<string>();
  let touchedPromptCount = 0;

  config.groups.forEach(group => {
    group.controls.forEach(control => {
      touchedPromptCount += applyControlToPreset(control, promptByName, missingTargets);
    });
  });

  await replacePreset('in_use', preset, { render: 'debounced' });

  return {
    touchedPromptCount,
    missingTargets: [...missingTargets],
  };
}
