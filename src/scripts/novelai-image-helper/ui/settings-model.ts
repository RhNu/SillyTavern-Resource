import { z } from 'zod';
import type { NovelAiImageService } from '../app/service';
import { getCurrentBindingContext, type BindingContext } from '../platform/tavern/binding-context';
import {
  CharacterBindingsSchema,
  DEFAULT_PROMPT_TEMPLATE,
  SettingsSchema,
  type CharacterBindings,
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

export function addTemplate(settings: Settings, rawName: string): Settings {
  const name = rawName.trim();
  if (!name) throw new Error('模板名称不能为空');
  if (settings.analysis.templates.items[name]) throw new Error(`模板“${name}”已经存在`);
  return editSettings(settings, draft => {
    draft.analysis.templates.items[name] = structuredClone(DEFAULT_PROMPT_TEMPLATE);
    draft.analysis.templates.selected = name;
  });
}

export function deleteSelectedTemplate(settings: Settings): Settings {
  const names = Object.keys(settings.analysis.templates.items);
  if (names.length <= 1) throw new Error('至少需要保留一个提示词模板');
  return editSettings(settings, draft => {
    delete draft.analysis.templates.items[draft.analysis.templates.selected];
    draft.analysis.templates.selected = Object.keys(draft.analysis.templates.items)[0]!;
  });
}

export function restoreSelectedTemplate(settings: Settings): Settings {
  return editSettings(settings, draft => {
    draft.analysis.templates.items[draft.analysis.templates.selected] = structuredClone(DEFAULT_PROMPT_TEMPLATE);
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
  return service.settings.update(draft => Object.assign(draft, parsed.data));
}
