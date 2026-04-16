import { useEffect, useState } from 'react';
import type { BindingContext, BindingRef } from '@/ImageGenerationHelperV2/adapters/tavern/binding-context-gateway';
import { useImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';
import { showSuccessToast, showWarningToast } from '@/ImageGenerationHelperV2/shared/toast';
import { PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN } from '@/ImageGenerationHelperV2/features/prompt-generation/placeholders';
import { HELP_TEXT } from '@/ImageGenerationHelperV2/features/settings-panel/view/meta';
import HelpMarker from '@/ImageGenerationHelperV2/features/settings-panel/view/components/HelpMarker';

type BindingType = 'character' | 'chat' | 'persona';

const BINDING_ITEMS: {
  type: BindingType;
  label: string;
  bindActionLabel: string;
  unbindActionLabel: string;
}[] = [
  {
    type: 'character',
    label: '角色卡',
    bindActionLabel: '绑定当前',
    unbindActionLabel: '解绑',
  },
  {
    type: 'chat',
    label: '聊天',
    bindActionLabel: '绑定当前',
    unbindActionLabel: '解绑',
  },
  {
    type: 'persona',
    label: '用户人设',
    bindActionLabel: '绑定当前',
    unbindActionLabel: '解绑',
  },
] as const;

function bindingMatches(required: BindingRef | null, current: BindingRef | null): boolean {
  if (!required) {
    return true;
  }

  return Boolean(current && required.key === current.key);
}

function formatBindingState(required: BindingRef | null, current: BindingRef | null): string {
  if (!required) {
    return 'is-disabled';
  }

  return bindingMatches(required, current) ? 'is-active' : 'is-inactive';
}

function formatPersonaBindingState(required: BindingRef | null, currentContext: BindingContext): string {
  if (!required) {
    return 'is-disabled';
  }

  if (!currentContext.personaAvailable) {
    return 'is-inactive';
  }

  return bindingMatches(required, currentContext.persona) ? 'is-active' : 'is-inactive';
}

function formatBinding(binding: BindingRef | null, fallback: string): string {
  return binding?.label || fallback;
}

function resolveBindingState(type: BindingType, required: BindingRef | null, currentContext: BindingContext): string {
  return type === 'persona'
    ? formatPersonaBindingState(required, currentContext)
    : formatBindingState(required, currentContext[type]);
}

function formatBindingLabel(type: BindingType, required: BindingRef | null, currentContext: BindingContext): string {
  if (type === 'persona' && !currentContext.personaAvailable) {
    return required?.label || '当前不可用';
  }

  return formatBinding(required, '未绑定');
}

function getCurrentBinding(type: BindingType, currentContext: BindingContext): BindingRef | null {
  return type === 'persona' ? currentContext.persona : currentContext[type];
}

function getBindUnavailableText(type: BindingType): string {
  return type === 'character'
    ? '当前没有可绑定的角色卡'
    : type === 'chat'
      ? '当前没有可绑定的聊天'
      : '当前没有可绑定的用户人设';
}

function getBindSuccessText(type: BindingType): string {
  return type === 'character' ? '已绑定到当前角色卡' : type === 'chat' ? '已绑定到当前聊天' : '已绑定到当前用户人设';
}

function getUnbindSuccessText(type: BindingType): string {
  return type === 'character' ? '已解绑角色卡' : type === 'chat' ? '已解绑聊天' : '已解绑用户人设';
}

export default function CharacterLibraryTab() {
  const config = useImageGenerationStore(state => state.config);
  const createCharacterEntry = useImageGenerationStore(state => state.createCharacterEntry);
  const deleteCharacterEntry = useImageGenerationStore(state => state.deleteCharacterEntry);
  const getCurrentContext = useImageGenerationStore(state => state.getCurrentContext);
  const getActiveCharacters = useImageGenerationStore(state => state.getActiveCharacters);
  const bindCharacterToCurrentCharacter = useImageGenerationStore(state => state.bindCharacterToCurrentCharacter);
  const unbindCharacterFromCurrentCharacter = useImageGenerationStore(
    state => state.unbindCharacterFromCurrentCharacter,
  );
  const bindCharacterToCurrentChat = useImageGenerationStore(state => state.bindCharacterToCurrentChat);
  const unbindCharacterFromCurrentChat = useImageGenerationStore(state => state.unbindCharacterFromCurrentChat);
  const bindCharacterToCurrentPersona = useImageGenerationStore(state => state.bindCharacterToCurrentPersona);
  const unbindCharacterFromCurrentPersona = useImageGenerationStore(state => state.unbindCharacterFromCurrentPersona);
  const updateConfig = useImageGenerationStore(state => state.updateConfig);

  const [currentContext, setCurrentContext] = useState<BindingContext>(() => getCurrentContext());
  const [expandedCharacterIds, setExpandedCharacterIds] = useState<Record<string, boolean>>({});

  const activeCharacterIds = new Set(getActiveCharacters(currentContext).map(character => character.id));

  const refreshCurrentContext = () => {
    setCurrentContext(getCurrentContext());
  };

  useEffect(() => {
    refreshCurrentContext();

    const stops = [
      eventOn(tavern_events.CHAT_CHANGED, refreshCurrentContext).stop,
      eventOn(tavern_events.CHARACTER_PAGE_LOADED, refreshCurrentContext).stop,
      eventOn(tavern_events.CHARACTER_EDITED, refreshCurrentContext).stop,
      eventOn(tavern_events.SETTINGS_UPDATED, refreshCurrentContext).stop,
      eventOn(tavern_events.IMPERSONATE_READY, refreshCurrentContext).stop,
      eventOn(tavern_events.USER_MESSAGE_RENDERED, refreshCurrentContext).stop,
    ];

    return () => {
      stops.forEach(stop => stop());
    };
  }, []);

  useEffect(() => {
    const validIds = new Set(config.prompt.characters.map(character => character.id));

    setExpandedCharacterIds(current => {
      const nextEntries = Object.entries(current).filter(([id, expanded]) => expanded && validIds.has(id));
      return nextEntries.length === Object.keys(current).length ? current : Object.fromEntries(nextEntries);
    });
  }, [config.prompt.characters]);

  const toggleCharacterExpanded = (id: string) => {
    setExpandedCharacterIds(current => {
      const nextExpanded = !current[id];
      return nextExpanded
        ? { ...current, [id]: true }
        : Object.fromEntries(Object.entries(current).filter(([key]) => key !== id));
    });
  };

  const addCharacter = () => {
    const entry = createCharacterEntry({
      name: `人物${config.prompt.characters.length + 1}`,
    });

    setExpandedCharacterIds(current => ({
      ...current,
      [entry.id]: true,
    }));
    showSuccessToast(`已新增人物条目“${entry.name}”`, '图片生成');
  };

  const deleteCharacter = (id: string, name: string) => {
    deleteCharacterEntry(id);
    setExpandedCharacterIds(current => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
    showSuccessToast(`已删除人物条目“${name || '未命名人物'}”`, '图片生成');
  };

  const bindCharacter = (id: string, type: BindingType) => {
    refreshCurrentContext();

    const bound =
      type === 'character'
        ? bindCharacterToCurrentCharacter(id)
        : type === 'chat'
          ? bindCharacterToCurrentChat(id)
          : bindCharacterToCurrentPersona(id);

    if (!bound) {
      showWarningToast(getBindUnavailableText(type), '图片生成');
      return;
    }

    showSuccessToast(getBindSuccessText(type), '图片生成');
  };

  const unbindCharacter = (id: string, type: BindingType) => {
    const unbound =
      type === 'character'
        ? unbindCharacterFromCurrentCharacter(id)
        : type === 'chat'
          ? unbindCharacterFromCurrentChat(id)
          : unbindCharacterFromCurrentPersona(id);

    if (!unbound) {
      showWarningToast('解绑失败，请刷新后重试', '图片生成');
      return;
    }

    showSuccessToast(getUnbindSuccessText(type), '图片生成');
  };

  return (
    <>
      <section className="imggen-section">
        <div className="imggen-section-header">
          <h4 className="imggen-section-title">当前上下文</h4>
          <p className="imggen-section-desc">人物库会按当前角色卡、当前聊天和当前用户人设自动决定哪些条目生效。</p>
        </div>
        <div className="imggen-binding-summary">
          <div className="imggen-context-list">
            <span
              className={['imggen-context-chip', !currentContext.character ? 'is-disabled' : '']
                .filter(Boolean)
                .join(' ')}
            >
              <span className="imggen-context-title">角色卡</span>
              <span>{currentContext.character?.label || '未识别'}</span>
            </span>
            <span
              className={['imggen-context-chip', !currentContext.chat ? 'is-disabled' : ''].filter(Boolean).join(' ')}
            >
              <span className="imggen-context-title">聊天</span>
              <span>{currentContext.chat?.label || '未识别'}</span>
            </span>
            <span
              className={['imggen-context-chip', !currentContext.personaAvailable ? 'is-disabled' : '']
                .filter(Boolean)
                .join(' ')}
            >
              <span className="imggen-context-title">用户人设</span>
              <span>{currentContext.personaAvailable ? currentContext.persona?.label || '未识别' : '当前不可用'}</span>
            </span>
          </div>
          <p className="imggen-hint">
            未绑定条目始终生效；绑定了角色卡、聊天或用户人设的条目，只有在当前上下文命中时才会参与模板占位符替换。
          </p>
        </div>
      </section>

      <section className="imggen-section">
        <div className="imggen-section-header">
          <h4 className="imggen-section-title">人物库</h4>
          <p className="imggen-section-desc">
            人物条目会填入模板中的 <span className="imggen-code">{PROMPT_TEMPLATE_CHARACTER_LIST_TOKEN}</span> 占位符。
          </p>
        </div>
        <div className="imggen-actions">
          <button className="menu_button imggen-button" type="button" onClick={addCharacter}>
            新增人物条目
          </button>
          <HelpMarker text={HELP_TEXT.characterLibrary} />
        </div>
        {config.prompt.characters.length === 0 ? (
          <div className="imggen-empty">还没有人物条目，点击上方按钮新增。</div>
        ) : null}
        {config.prompt.characters.map(character => {
          const characterName = character.name.trim() || '未命名人物';
          const expanded = Boolean(expandedCharacterIds[character.id]);
          const bindingsPanelId = `imggen-character-bindings-${character.id}`;
          const detailsPanelId = `imggen-character-details-${character.id}`;

          return (
            <div
              key={character.id}
              className={['imggen-card', 'imggen-character-card', expanded ? 'is-expanded' : '']
                .filter(Boolean)
                .join(' ')}
            >
              <div className="imggen-character-header imggen-character-header-compact">
                <label className="imggen-check imggen-character-toggle">
                  <input
                    checked={character.enabled}
                    type="checkbox"
                    onChange={event => {
                      const checked = event.currentTarget.checked;
                      updateConfig(draft => {
                        const current = draft.prompt.characters.find(entry => entry.id === character.id);
                        if (current) {
                          current.enabled = checked;
                        }
                      });
                    }}
                  />
                  <span className="imggen-check-label">
                    <span>启用</span>
                    <HelpMarker text={HELP_TEXT.characterBinding} />
                  </span>
                </label>

                <button
                  aria-controls={detailsPanelId}
                  aria-expanded={expanded}
                  className="imggen-collapse-button imggen-character-collapse"
                  type="button"
                  onClick={() => toggleCharacterExpanded(character.id)}
                >
                  <span className="imggen-collapse-copy imggen-character-summary">
                    <span className="imggen-character-meta">
                      <span className="imggen-character-name">{characterName}</span>
                      <span
                        className={['imggen-status', activeCharacterIds.has(character.id) ? '' : 'is-muted']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {activeCharacterIds.has(character.id) ? '当前生效' : '当前未生效'}
                      </span>
                    </span>
                    <span className="imggen-binding-list imggen-character-chip-list">
                      {BINDING_ITEMS.map(item => (
                        <span
                          key={item.type}
                          className={[
                            'imggen-binding-chip',
                            resolveBindingState(item.type, character.bindings[item.type], currentContext),
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <span>{item.label}</span>
                          <span>{formatBindingLabel(item.type, character.bindings[item.type], currentContext)}</span>
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="imggen-collapse-state">
                    <span>{expanded ? '收起' : '展开'}</span>
                    <i className={expanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'}></i>
                  </span>
                </button>
              </div>

              {expanded ? (
                <div id={detailsPanelId} className="imggen-collapse-body">
                  <div className="imggen-grid">
                    <label className="imggen-field">
                      <span>人物名称</span>
                      <input
                        className="text_pole"
                        placeholder="人物名称"
                        type="text"
                        value={character.name}
                        onChange={event => {
                          const value = event.currentTarget.value;
                          updateConfig(draft => {
                            const current = draft.prompt.characters.find(entry => entry.id === character.id);
                            if (current) {
                              current.name = value;
                            }
                          });
                        }}
                      />
                    </label>
                    <label className="imggen-field imggen-span-2">
                      <span>人物内容</span>
                      <textarea
                        className="text_pole"
                        placeholder="固定特征、服装、画风锚点等"
                        rows={4}
                        value={character.content}
                        onChange={event => {
                          const value = event.currentTarget.value;
                          updateConfig(draft => {
                            const current = draft.prompt.characters.find(entry => entry.id === character.id);
                            if (current) {
                              current.content = value;
                            }
                          });
                        }}
                      />
                    </label>
                  </div>

                  <div className="imggen-binding-summary">
                    <div className="imggen-label-line">
                      <span className="imggen-section-title">绑定设置</span>
                      <HelpMarker text={HELP_TEXT.characterBinding} />
                    </div>
                    <div id={bindingsPanelId} className="imggen-binding-panel">
                      {BINDING_ITEMS.map(item => {
                        const requiredBinding = character.bindings[item.type];
                        const currentBinding = getCurrentBinding(item.type, currentContext);

                        return (
                          <div key={item.type} className="imggen-binding-row">
                            <div className="imggen-binding-row-main">
                              <span className="imggen-binding-row-title">
                                <span>{item.label}</span>
                                {item.type === 'persona' ? <HelpMarker text={HELP_TEXT.personaBinding} /> : null}
                              </span>
                              <span
                                className={[
                                  'imggen-binding-chip',
                                  resolveBindingState(item.type, requiredBinding, currentContext),
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <span>{formatBindingLabel(item.type, requiredBinding, currentContext)}</span>
                              </span>
                              <span className="imggen-inline-note">
                                当前上下文：
                                {currentBinding?.label || (item.type === 'persona' ? '当前不可用' : '未识别')}
                              </span>
                            </div>
                            <div className="imggen-binding-row-actions">
                              <button
                                className="menu_button imggen-button"
                                disabled={!currentBinding}
                                type="button"
                                onClick={() => bindCharacter(character.id, item.type)}
                              >
                                {item.bindActionLabel}
                              </button>
                              <button
                                className="menu_button imggen-button"
                                disabled={!requiredBinding}
                                type="button"
                                onClick={() => unbindCharacter(character.id, item.type)}
                              >
                                {item.unbindActionLabel}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="imggen-character-actions">
                    <button
                      className="menu_button redWarningBG imggen-button"
                      type="button"
                      onClick={() => deleteCharacter(character.id, characterName)}
                    >
                      删除人物条目
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>
    </>
  );
}
