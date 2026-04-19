import { type ApplyResult, type ControllerConfig, type ControllerControl } from './schema';

function applyControlToPreset(
  control: ControllerControl,
  promptByName: Map<string, PresetPrompt[]>,
  missingTargets: Set<string>,
) {
  let touchedPromptCount = 0;

  if (control.type === 'switch') {
    control.targets.forEach(targetName => {
      const prompts = promptByName.get(targetName);
      if (!prompts?.length) {
        missingTargets.add(targetName);
        return;
      }

      prompts.forEach(prompt => {
        prompt.enabled = control.value;
        touchedPromptCount += 1;
      });
    });

    return touchedPromptCount;
  }

  control.options.forEach(option => {
    option.targets.forEach(targetName => {
      const prompts = promptByName.get(targetName);
      if (!prompts?.length) {
        missingTargets.add(targetName);
        return;
      }

      prompts.forEach(prompt => {
        prompt.enabled = option.value === control.value;
        touchedPromptCount += 1;
      });
    });
  });

  return touchedPromptCount;
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
    group.items.forEach(item => {
      item.controls.forEach(control => {
        touchedPromptCount += applyControlToPreset(control, promptByName, missingTargets);
      });
    });
  });

  await replacePreset('in_use', preset, { render: 'debounced' });

  return {
    touchedPromptCount,
    missingTargets: [...missingTargets],
  };
}
