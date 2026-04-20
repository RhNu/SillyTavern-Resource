import {
  createPromptCharacter,
  getCurrentBindingContext,
  resolvePromptCharacters,
  type BindingContext,
  type BindingRef,
  type CharacterBindings,
  type PromptCharacter,
} from '@/ImgGenHelper/adapters/tavern/binding-context-gateway';
import { BUILTIN_TEMPLATE_NAI_NAME, createBuiltinTemplateItems } from '@/ImgGenHelper/config/defaults';
import {
  deleteNamedItem,
  getSelectedNamedItem,
  injectNamedItems,
  saveNamedItem,
  selectNamedItem,
} from '@/ImgGenHelper/config/named-items';
import { loadInitialConfig, persistConfig } from '@/ImgGenHelper/config/persistence';
import {
  NOVELAI_MODEL_OPTIONS,
  NOVELAI_SAMPLER_OPTIONS,
  NOVELAI_SCHEDULER_OPTIONS,
  createNextConfig,
  normalizeNovelAIImageConfig,
  type ApiConfig,
  type NovelAIImageConfig,
  type PromptPreset,
  type ScriptConfig,
} from '@/ImgGenHelper/config/schema';
import { klona } from 'klona';
import _ from 'lodash';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export {
  NOVELAI_MODEL_OPTIONS,
  NOVELAI_SAMPLER_OPTIONS,
  NOVELAI_SCHEDULER_OPTIONS,
  type ApiConfig,
  type BindingContext,
  type BindingRef,
  type CharacterBindings,
  type NovelAIImageConfig,
  type PromptCharacter,
  type PromptPreset,
  type ScriptConfig,
};

type SubscribeOptions<T> = {
  equalityFn?: (left: T, right: T) => boolean;
  fireImmediately?: boolean;
};

type ImageGenerationStoreState = {
  config: ScriptConfig;
  setConfig: (value: ScriptConfig | ((current: ScriptConfig) => ScriptConfig)) => void;
  updateConfig: (recipe: (draft: ScriptConfig) => void) => void;
  getActivePromptTemplate: () => string;
  getActivePromptPreset: () => PromptPreset;
  getActiveApiPreset: () => ApiConfig;
  getActiveImageConfig: () => NovelAIImageConfig;
  selectPromptTemplate: (name: string) => void;
  savePromptTemplate: (name: string, content?: string) => void;
  deletePromptTemplate: (name: string) => void;
  reinjectDefaultTemplates: () => void;
  applyPromptPreset: (name: string) => void;
  savePromptPreset: (name: string, preset?: Partial<PromptPreset>) => void;
  deletePromptPreset: (name: string) => void;
  applyApiPreset: (name: string) => void;
  saveApiPreset: (name: string, preset?: Partial<ApiConfig>) => void;
  deleteApiPreset: (name: string) => void;
  getCharacterEntry: (id: string) => PromptCharacter | undefined;
  createCharacterEntry: (
    overrides?: Partial<Omit<PromptCharacter, 'id' | 'bindings'>> & { bindings?: Partial<CharacterBindings> },
  ) => PromptCharacter;
  deleteCharacterEntry: (id: string) => void;
  getCurrentContext: () => BindingContext;
  getActiveCharacters: (context?: BindingContext) => PromptCharacter[];
  setCharacterBinding: (id: string, type: keyof CharacterBindings, binding: BindingRef | null) => boolean;
  bindCharacterToCurrentCharacter: (id: string) => boolean;
  unbindCharacterFromCurrentCharacter: (id: string) => boolean;
  bindCharacterToCurrentChat: (id: string) => boolean;
  unbindCharacterFromCurrentChat: (id: string) => boolean;
  bindCharacterToCurrentPersona: (id: string) => boolean;
  unbindCharacterFromCurrentPersona: (id: string) => boolean;
};

export type ImageGenerationStoreFacade = ReturnType<typeof createImageGenerationStoreFacade>;

function updateConfigWith(
  get: () => ImageGenerationStoreState,
  set: (value: Partial<ImageGenerationStoreState>) => void,
  recipe: (draft: ScriptConfig) => void,
) {
  const draft = klona(get().config);
  recipe(draft);
  set({ config: createNextConfig(get().config, draft) });
}

export const useImageGenerationStore = create<ImageGenerationStoreState>()(
  subscribeWithSelector((set, get) => ({
    config: loadInitialConfig(),

    setConfig: value => {
      const nextConfig = createNextConfig(get().config, value);
      if (!_.isEqual(get().config, nextConfig)) {
        set({ config: nextConfig });
      }
    },

    updateConfig: recipe => {
      updateConfigWith(get, set, recipe);
    },

    getActivePromptTemplate: () => {
      const state = get();
      return (
        getSelectedNamedItem(state.config.prompt.templates) ??
        createBuiltinTemplateItems()[BUILTIN_TEMPLATE_NAI_NAME] ??
        ''
      );
    },

    getActivePromptPreset: () =>
      getSelectedNamedItem(get().config.prompt.presets) ?? {
        prefix: 'best quality, masterpiece',
        suffix: '',
        negative: '',
        injectionMode: 'plain',
      },

    getActiveApiPreset: () =>
      getSelectedNamedItem(get().config.independentApi.presets) ?? {
        apiurl: 'https://api.deepseek.com',
        key: '',
        model: 'deepseek-chat',
        max_tokens: 8192,
        temperature: 0.9,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },

    getActiveImageConfig: () => normalizeNovelAIImageConfig(get().config.image),

    selectPromptTemplate: name => {
      updateConfigWith(get, set, draft => {
        draft.prompt.templates = selectNamedItem(draft.prompt.templates, name);
      });
    },

    savePromptTemplate: (name, content) => {
      updateConfigWith(get, set, draft => {
        draft.prompt.templates = saveNamedItem(
          draft.prompt.templates,
          name,
          content ?? getSelectedNamedItem(draft.prompt.templates) ?? '',
        );
      });
    },

    deletePromptTemplate: name => {
      updateConfigWith(get, set, draft => {
        draft.prompt.templates = deleteNamedItem(draft.prompt.templates, name);
      });
    },

    reinjectDefaultTemplates: () => {
      updateConfigWith(get, set, draft => {
        draft.prompt.templates = injectNamedItems(draft.prompt.templates, createBuiltinTemplateItems());
      });
    },

    applyPromptPreset: name => {
      updateConfigWith(get, set, draft => {
        draft.prompt.presets = selectNamedItem(draft.prompt.presets, name);
      });
    },

    savePromptPreset: (name, preset) => {
      updateConfigWith(get, set, draft => {
        const current = getSelectedNamedItem(draft.prompt.presets) ?? get().getActivePromptPreset();
        draft.prompt.presets = saveNamedItem(draft.prompt.presets, name, {
          ...current,
          ...preset,
        });
      });
    },

    deletePromptPreset: name => {
      updateConfigWith(get, set, draft => {
        draft.prompt.presets = deleteNamedItem(draft.prompt.presets, name);
      });
    },

    applyApiPreset: name => {
      updateConfigWith(get, set, draft => {
        draft.independentApi.presets = selectNamedItem(draft.independentApi.presets, name);
      });
    },

    saveApiPreset: (name, preset) => {
      updateConfigWith(get, set, draft => {
        const current = getSelectedNamedItem(draft.independentApi.presets) ?? get().getActiveApiPreset();
        draft.independentApi.presets = saveNamedItem(draft.independentApi.presets, name, {
          ...current,
          ...preset,
        });
      });
    },

    deleteApiPreset: name => {
      updateConfigWith(get, set, draft => {
        draft.independentApi.presets = deleteNamedItem(draft.independentApi.presets, name);
      });
    },

    getCharacterEntry: id => get().config.prompt.characters.find(character => character.id === id),

    createCharacterEntry: overrides => {
      const entry = createPromptCharacter(overrides);
      updateConfigWith(get, set, draft => {
        draft.prompt.characters.push(entry);
      });
      return entry;
    },

    deleteCharacterEntry: id => {
      updateConfigWith(get, set, draft => {
        draft.prompt.characters = draft.prompt.characters.filter(character => character.id !== id);
      });
    },

    getCurrentContext: () => getCurrentBindingContext(),

    getActiveCharacters: (context = getCurrentBindingContext()) =>
      resolvePromptCharacters(get().config.prompt.characters, context),

    setCharacterBinding: (id, type, binding) => {
      const entry = get().config.prompt.characters.find(character => character.id === id);
      if (!entry) {
        return false;
      }

      updateConfigWith(get, set, draft => {
        const current = draft.prompt.characters.find(character => character.id === id);
        if (current) {
          current.bindings[type] = binding ? klona(binding) : null;
        }
      });
      return true;
    },

    bindCharacterToCurrentCharacter: id => {
      const current = getCurrentBindingContext().character;
      return current ? get().setCharacterBinding(id, 'character', current) : false;
    },

    unbindCharacterFromCurrentCharacter: id => get().setCharacterBinding(id, 'character', null),

    bindCharacterToCurrentChat: id => {
      const current = getCurrentBindingContext().chat;
      return current ? get().setCharacterBinding(id, 'chat', current) : false;
    },

    unbindCharacterFromCurrentChat: id => get().setCharacterBinding(id, 'chat', null),

    bindCharacterToCurrentPersona: id => {
      const current = getCurrentBindingContext().persona;
      return current ? get().setCharacterBinding(id, 'persona', current) : false;
    },

    unbindCharacterFromCurrentPersona: id => get().setCharacterBinding(id, 'persona', null),
  })),
);

useImageGenerationStore.subscribe(
  state => state.config,
  config => {
    persistConfig(config);
  },
  { equalityFn: _.isEqual, fireImmediately: true },
);

function createImageGenerationStoreFacade(state = useImageGenerationStore.getState()) {
  return {
    get config() {
      return state.config;
    },
    get availableTemplates() {
      return state.config.prompt.templates.items;
    },
    setConfig: (value: ScriptConfig | ((current: ScriptConfig) => ScriptConfig)) => {
      useImageGenerationStore.getState().setConfig(value);
    },
    updateConfig: (recipe: (draft: ScriptConfig) => void) => {
      useImageGenerationStore.getState().updateConfig(recipe);
    },
    getActivePromptTemplate: () => state.getActivePromptTemplate(),
    getActivePromptPreset: () => state.getActivePromptPreset(),
    getActiveApiPreset: () => state.getActiveApiPreset(),
    getActiveImageConfig: () => state.getActiveImageConfig(),
    selectPromptTemplate: (name: string) => state.selectPromptTemplate(name),
    savePromptTemplate: (name: string, content?: string) => state.savePromptTemplate(name, content),
    deletePromptTemplate: (name: string) => state.deletePromptTemplate(name),
    reinjectDefaultTemplates: () => state.reinjectDefaultTemplates(),
    applyPromptPreset: (name: string) => state.applyPromptPreset(name),
    savePromptPreset: (name: string, preset?: Partial<PromptPreset>) => state.savePromptPreset(name, preset),
    deletePromptPreset: (name: string) => state.deletePromptPreset(name),
    applyApiPreset: (name: string) => state.applyApiPreset(name),
    saveApiPreset: (name: string, preset?: Partial<ApiConfig>) => state.saveApiPreset(name, preset),
    deleteApiPreset: (name: string) => state.deleteApiPreset(name),
    getCharacterEntry: (id: string) => state.getCharacterEntry(id),
    createCharacterEntry: (
      overrides?: Partial<Omit<PromptCharacter, 'id' | 'bindings'>> & { bindings?: Partial<CharacterBindings> },
    ) => state.createCharacterEntry(overrides),
    deleteCharacterEntry: (id: string) => state.deleteCharacterEntry(id),
    getCurrentContext: () => state.getCurrentContext(),
    getActiveCharacters: (context?: BindingContext) => state.getActiveCharacters(context),
    setCharacterBinding: (id: string, type: keyof CharacterBindings, binding: BindingRef | null) =>
      state.setCharacterBinding(id, type, binding),
    bindCharacterToCurrentCharacter: (id: string) => state.bindCharacterToCurrentCharacter(id),
    unbindCharacterFromCurrentCharacter: (id: string) => state.unbindCharacterFromCurrentCharacter(id),
    bindCharacterToCurrentChat: (id: string) => state.bindCharacterToCurrentChat(id),
    unbindCharacterFromCurrentChat: (id: string) => state.unbindCharacterFromCurrentChat(id),
    bindCharacterToCurrentPersona: (id: string) => state.bindCharacterToCurrentPersona(id),
    unbindCharacterFromCurrentPersona: (id: string) => state.unbindCharacterFromCurrentPersona(id),
  };
}

export function getImageGenerationStore(): ImageGenerationStoreFacade {
  return createImageGenerationStoreFacade();
}

export function subscribeImageGenerationStore<T>(
  selector: (state: ImageGenerationStoreState) => T,
  listener: (selected: T, previousSelected: T) => void,
  options?: SubscribeOptions<T>,
) {
  return useImageGenerationStore.subscribe(selector, listener, options);
}
