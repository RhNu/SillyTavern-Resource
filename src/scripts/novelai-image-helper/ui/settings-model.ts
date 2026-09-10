import { z } from 'zod';
import type { NovelAiImageService } from '../app/service';
import { getCurrentBindingContext, type BindingContext } from '../platform/tavern/binding-context';
import {
  CharacterBindingsSchema,
  SettingsSchema,
  type CharacterBindings,
  type GenerationPromptPreset,
  type Settings,
} from '../settings/schema';

export type SettingsEditorModel = {
  draft: Settings;
  context: BindingContext;
};

export function createSettingsEditorModel(service: NovelAiImageService): SettingsEditorModel {
  return { draft: service.settings.get(), context: getCurrentBindingContext() };
}

export function editSettings(current: Settings, recipe: (draft: Settings) => void): Settings {
  const draft = structuredClone(current);
  recipe(draft);
  return draft;
}

function getSelectedPromptPreset(settings: Settings): GenerationPromptPreset {
  const selected = settings.generation.promptPresets.items[settings.generation.promptPresets.selected];
  if (!selected) throw new Error(`提示词预设不存在: ${settings.generation.promptPresets.selected}`);
  return selected;
}

export function savePromptPreset(settings: Settings, rawName: string): Settings {
  const name = rawName.trim();
  if (!name) throw new Error('提示词预设名称不能为空');
  if (settings.generation.promptPresets.items[name]) throw new Error(`提示词预设“${name}”已经存在`);
  const current = getSelectedPromptPreset(settings);

  return editSettings(settings, draft => {
    draft.generation.promptPresets.items[name] = structuredClone(current);
    draft.generation.promptPresets.selected = name;
  });
}

export function deleteSelectedPromptPreset(settings: Settings): Settings {
  const names = Object.keys(settings.generation.promptPresets.items);
  if (names.length <= 1) throw new Error('至少需要保留一个提示词预设');

  return editSettings(settings, draft => {
    delete draft.generation.promptPresets.items[draft.generation.promptPresets.selected];
    draft.generation.promptPresets.selected = Object.keys(draft.generation.promptPresets.items)[0]!;
  });
}

export function addCharacter(settings: Settings): Settings {
  return editSettings(settings, draft => {
    draft.characters.push({
      id: crypto.randomUUID(),
      name: '新人物',
      content: '填写人物身份、外貌、气质和需要保持连续的视觉信息。',
      negative: '',
      enabled: true,
      bindings: CharacterBindingsSchema.parse({ character: null, chat: null, persona: null }),
    });
  });
}

export function removeCharacter(settings: Settings, id: string): Settings {
  return editSettings(settings, draft => {
    draft.characters = draft.characters.filter(character => character.id !== id);
  });
}

export function toggleCharacterBinding(
  settings: Settings,
  id: string,
  kind: keyof CharacterBindings,
  context: BindingContext,
): Settings {
  const current = context[kind];
  if (!current)
    throw new Error(`当前没有可绑定的${kind === 'character' ? '角色卡' : kind === 'chat' ? '聊天' : '用户人设'}`);
  return editSettings(settings, draft => {
    const character = draft.characters.find(entry => entry.id === id);
    if (!character) throw new Error('人物条目不存在');
    character.bindings[kind] = character.bindings[kind]?.key === current.key ? null : structuredClone(current);
  });
}

export function saveSettings(service: NovelAiImageService, candidate: Settings): Settings {
  const parsed = SettingsSchema.safeParse(candidate);
  if (!parsed.success) throw new Error(z.prettifyError(parsed.error));
  return service.settings.replace(parsed.data);
}

export function scheduleSettingsSave(service: NovelAiImageService, candidate: Settings): boolean {
  const parsed = SettingsSchema.safeParse(candidate);
  if (!parsed.success) return false;
  service.settings.replace(parsed.data, { debounced: true });
  return true;
}
