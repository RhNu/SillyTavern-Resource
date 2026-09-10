import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { NovelAiImageService } from '../app/service';
import { MODEL_IDS, SAMPLERS, SCHEDULES, type CharacterBindings, type Settings } from '../settings/schema';
import { requestPromptPresetName } from './prompt-preset-dialog';
import {
    addCharacter,
    createSettingsEditorModel,
    deleteSelectedPromptPreset,
    editSettings,
    removeCharacter,
    savePromptPreset as savePromptPresetSettings,
    saveSettings,
    scheduleSettingsSave,
    toggleCharacterBinding,
} from './settings-model';

type Tab = 'general' | 'templates' | 'image' | 'characters';

function Field(props: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="nai-settings__field">
      <span>{props.label}</span>
      {props.children}
      {props.hint && <small>{props.hint}</small>}
    </label>
  );
}

function Check(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="nai-settings__check">
      <span>{props.label}</span>
      <input type="checkbox" checked={props.checked} onChange={event => props.onChange(event.currentTarget.checked)} />
    </label>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={props.label}>
      <input
        className="text_pole"
        type="number"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={event => props.onChange(Number(event.currentTarget.value))}
      />
    </Field>
  );
}

export default function SettingsPanel(props: { service: NovelAiImageService; onClose: () => void }) {
  const initial = useMemo(() => createSettingsEditorModel(props.service), [props.service]);
  const [draft, setDraft] = useState(initial.draft);
  const [tab, setTab] = useState<Tab>('general');
  const [expandedCharacterIds, setExpandedCharacterIds] = useState<Record<string, boolean>>({});
  const [templateExpanded, setTemplateExpanded] = useState(false);
  const [status, setStatus] = useState('正在检查 imggen-novelai…');
  const [error, setError] = useState('');
  // Event currentTarget is cleared after the handler returns, so handlers must capture values before calling edit.
  const edit = (recipe: (next: Settings) => void) => setDraft(current => editSettings(current, recipe));

  useEffect(() => {
    let active = true;
    void props.service.backend
      .capabilities()
      .then(result => {
        if (active) setStatus(`插件 ${result.version} · ${result.configured ? 'Token 已配置' : 'Token 未配置'}`);
      })
      .catch(reason => {
        if (active) setStatus(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      active = false;
    };
  }, [props.service]);

  useEffect(() => {
    scheduleSettingsSave(props.service, draft);
  }, [draft, props.service]);

  const runAction = (action: () => Settings) => {
    try {
      setDraft(action());
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const save = () => {
    try {
      saveSettings(props.service, draft);
      toastr.success('设置已保存', 'NovelAI 图片助手');
      props.onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const savePromptPresetAs = async () => {
    try {
      const rawName = await requestPromptPresetName();
      if (rawName === undefined) return;

      const next = savePromptPresetSettings(draft, rawName);
      setDraft(next);
      setError('');
      toastr.success(`已另存为提示词预设“${rawName.trim()}”`, 'NovelAI 图片助手');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const template = draft.analysis.templates;
  const promptPresetNames = Object.keys(draft.generation.promptPresets.items);
  const promptPreset = draft.generation.promptPresets.items[draft.generation.promptPresets.selected]!;

  return (
    <div className="nai-settings">
      <header className="nai-settings__header">
        <div>
          <h3>NovelAI 图片助手</h3>
          <p>{status}</p>
        </div>
      </header>

      <nav className="nai-settings__tabs" aria-label="设置分组">
        {(
          [
            ['general', '工作流'],
            ['templates', '提示词'],
            ['image', '图像生成'],
            ['characters', '人物库'],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      <main className="nai-settings__panel">
        {tab === 'general' && (
          <>
            <section>
              <h4>自动化</h4>
              <Check
                label="启用脚本"
                checked={draft.enabled}
                onChange={value => edit(next => void (next.enabled = value))}
              />
              <Check
                label="自动分析新消息"
                checked={draft.analysis.auto}
                onChange={value => edit(next => void (next.analysis.auto = value))}
              />
              <Check
                label="分析后自动生图"
                checked={draft.analysis.autoGenerate}
                onChange={value => edit(next => void (next.analysis.autoGenerate = value))}
              />
              <div className="nai-settings__grid">
                <NumberField
                  label="最低楼层"
                  value={draft.analysis.minimumFloor}
                  min={0}
                  max={99999}
                  onChange={value => edit(next => void (next.analysis.minimumFloor = value))}
                />
                <NumberField
                  label="历史消息数"
                  value={draft.analysis.historyCount}
                  min={0}
                  max={100}
                  onChange={value => edit(next => void (next.analysis.historyCount = value))}
                />
                <NumberField
                  label="最短段落"
                  value={draft.analysis.minimumParagraphLength}
                  min={1}
                  max={2000}
                  onChange={value => edit(next => void (next.analysis.minimumParagraphLength = value))}
                />
                <NumberField
                  label="防抖毫秒"
                  value={draft.analysis.debounceMs}
                  min={0}
                  max={60000}
                  onChange={value => edit(next => void (next.analysis.debounceMs = value))}
                />
              </div>
            </section>
            <section>
              <h4>提示词模型</h4>
              <p className="nai-settings__hint">代理预设优先；留空时使用 OpenAI-compatible API。</p>
              <Field label="代理预设">
                <input
                  className="text_pole"
                  value={draft.analysis.proxyPreset}
                  onChange={event => {
                    const value = event.currentTarget.value;
                    edit(next => void (next.analysis.proxyPreset = value));
                  }}
                />
              </Field>
              <Field label="API URL">
                <input
                  className="text_pole"
                  value={draft.analysis.apiUrl}
                  onChange={event => {
                    const value = event.currentTarget.value;
                    edit(next => void (next.analysis.apiUrl = value));
                  }}
                />
              </Field>
              <Field label="API Key">
                <input
                  className="text_pole"
                  type="password"
                  value={draft.analysis.apiKey}
                  onChange={event => {
                    const value = event.currentTarget.value;
                    edit(next => void (next.analysis.apiKey = value));
                  }}
                />
              </Field>
              <div className="nai-settings__grid">
                <Field label="模型">
                  <input
                    className="text_pole"
                    value={draft.analysis.model}
                    onChange={event => {
                      const value = event.currentTarget.value;
                      edit(next => void (next.analysis.model = value));
                    }}
                  />
                </Field>
                <NumberField
                  label="最大 Tokens"
                  value={draft.analysis.maxTokens}
                  min={256}
                  max={32000}
                  onChange={value => edit(next => void (next.analysis.maxTokens = value))}
                />
              </div>
            </section>
          </>
        )}

        {tab === 'templates' && (
          <section>
            <h4>模型分流模板</h4>
            <div className="nai-settings__collapsible-heading">
              <p className="nai-settings__hint">按当前生图模型自动选择 V4.5 或 V5 规则。</p>
              <button
                type="button"
                className="menu_button"
                aria-expanded={templateExpanded}
                onClick={() => setTemplateExpanded(current => !current)}
              >
                {templateExpanded ? '收起模板' : '展开模板'}
                <i
                  className={['fa-solid', templateExpanded ? 'fa-chevron-up' : 'fa-chevron-down'].join(' ')}
                  aria-hidden="true"
                ></i>
              </button>
            </div>
            {templateExpanded && (
              <div className="nai-settings__collapsible-body">
                <Field label="V4.5 模板" hint="通常使用 Danbooru 标签串，自然语言理解较差。">
                  <textarea
                    className="text_pole"
                    rows={12}
                    value={template.v45}
                    onChange={event => {
                      const value = event.currentTarget.value;
                      edit(next => void (next.analysis.templates.v45 = value));
                    }}
                  />
                </Field>
                <Field label="V5 模板" hint="可使用自然语言、中文、标签或混合表达。">
                  <textarea
                    className="text_pole"
                    rows={12}
                    value={template.v5}
                    onChange={event => {
                      const value = event.currentTarget.value;
                      edit(next => void (next.analysis.templates.v5 = value));
                    }}
                  />
                </Field>
              </div>
            )}
          </section>
        )}

        {tab === 'image' && (
          <section>
            <h4>NovelAI 请求</h4>
            <Field label="生图模型">
              <select
                className="text_pole"
                value={draft.generation.model}
                onChange={event => {
                  const value = event.currentTarget.value as Settings['generation']['model'];
                  edit(next => void (next.generation.model = value));
                }}
              >
                {MODEL_IDS.map(model => (
                  <option key={model}>{model}</option>
                ))}
              </select>
            </Field>
            <div className="nai-settings__grid">
              <NumberField
                label="宽度"
                value={draft.generation.width}
                min={64}
                max={1600}
                step={64}
                onChange={value => edit(next => void (next.generation.width = value))}
              />
              <NumberField
                label="高度"
                value={draft.generation.height}
                min={64}
                max={1600}
                step={64}
                onChange={value => edit(next => void (next.generation.height = value))}
              />
              <NumberField
                label="步数"
                value={draft.generation.steps}
                min={1}
                max={50}
                onChange={value => edit(next => void (next.generation.steps = value))}
              />
              <NumberField
                label="CFG Scale"
                value={draft.generation.scale}
                min={0}
                max={10}
                step={0.1}
                onChange={value => edit(next => void (next.generation.scale = value))}
              />
              <NumberField
                label="超时毫秒"
                value={draft.generation.timeoutMs}
                min={10000}
                max={180000}
                step={1000}
                onChange={value => edit(next => void (next.generation.timeoutMs = value))}
              />
              <Field label="采样器">
                <select
                  className="text_pole"
                  value={draft.generation.sampler}
                  onChange={event => {
                    const value = event.currentTarget.value as Settings['generation']['sampler'];
                    edit(next => void (next.generation.sampler = value));
                  }}
                >
                  {SAMPLERS.map(sampler => (
                    <option key={sampler}>{sampler}</option>
                  ))}
                </select>
              </Field>
              <Field label="噪声调度">
                <select
                  className="text_pole"
                  value={draft.generation.schedule}
                  onChange={event => {
                    const value = event.currentTarget.value as Settings['generation']['schedule'];
                    edit(next => void (next.generation.schedule = value));
                  }}
                >
                  {SCHEDULES.map(schedule => (
                    <option key={schedule}>{schedule}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="种子" hint="留空表示随机">
              <input
                className="text_pole"
                type="number"
                value={draft.generation.seed ?? ''}
                onChange={event => {
                  const value = event.currentTarget.value;
                  edit(next => void (next.generation.seed = value ? Number(value) : null));
                }}
              />
            </Field>
            <div className="nai-settings__prompt-presets">
              <div className="nai-settings__section-heading">
                <div>
                  <h4>提示词预设</h4>
                  <p className="nai-settings__hint">切换预设会同时切换主提示词前缀、后缀和全局负面提示词。</p>
                </div>
              </div>
              <div className="nai-settings__grid nai-settings__preset-selector">
                <Field label="当前预设">
                  <select
                    className="text_pole"
                    value={draft.generation.promptPresets.selected}
                    onChange={event => {
                      const value = event.currentTarget.value;
                      edit(next => void (next.generation.promptPresets.selected = value));
                    }}
                  >
                    {promptPresetNames.map(name => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="nai-settings__preset-actions">
                  <button type="button" className="menu_button" onClick={() => void savePromptPresetAs()}>
                    另存为预设
                  </button>
                  <button
                    type="button"
                    className="menu_button"
                    onClick={() => runAction(() => deleteSelectedPromptPreset(draft))}
                  >
                    删除当前预设
                  </button>
                </div>
              </div>
              <Field label="主提示词前缀">
                <textarea
                  className="text_pole"
                  rows={2}
                  value={promptPreset.prefix}
                  onChange={event => {
                    const value = event.currentTarget.value;
                    edit(next => {
                      const current = next.generation.promptPresets.items[next.generation.promptPresets.selected];
                      if (current) current.prefix = value;
                    });
                  }}
                />
              </Field>
              <Field label="主提示词后缀">
                <textarea
                  className="text_pole"
                  rows={2}
                  value={promptPreset.suffix}
                  onChange={event => {
                    const value = event.currentTarget.value;
                    edit(next => {
                      const current = next.generation.promptPresets.items[next.generation.promptPresets.selected];
                      if (current) current.suffix = value;
                    });
                  }}
                />
              </Field>
              <Field label="全局负面提示词">
                <textarea
                  className="text_pole"
                  rows={3}
                  value={promptPreset.negative}
                  onChange={event => {
                    const value = event.currentTarget.value;
                    edit(next => {
                      const current = next.generation.promptPresets.items[next.generation.promptPresets.selected];
                      if (current) current.negative = value;
                    });
                  }}
                />
              </Field>
            </div>
          </section>
        )}

        {tab === 'characters' && (
          <section>
            <div className="nai-settings__section-heading">
              <div>
                <h4>人物参考库</h4>
                <p className="nai-settings__hint">未绑定的条目全局生效；多个绑定条件必须同时匹配。</p>
              </div>
              <button
                type="button"
                className="menu_button"
                onClick={() => {
                  const next = addCharacter(draft);
                  const characterId = next.characters.at(-1)!.id;
                  setDraft(next);
                  setExpandedCharacterIds(current => ({ ...current, [characterId]: true }));
                }}
              >
                新增人物
              </button>
            </div>
            <p className="nai-settings__context">
              当前：角色卡 {initial.context.character?.label ?? '无'} · 聊天 {initial.context.chat?.label ?? '无'} ·
              人设 {initial.context.persona?.label ?? '无'}
            </p>
            {draft.characters.length === 0 && <p className="nai-settings__empty">还没有人物参考。</p>}
            {draft.characters.map((character, index) => {
              const expanded = Boolean(expandedCharacterIds[character.id]);
              const detailsId = `nai-character-details-${character.id}`;
              const bindingLabels = (['character', 'chat', 'persona'] as const)
                .filter(kind => character.bindings[kind])
                .map(kind => (kind === 'character' ? '角色卡' : kind === 'chat' ? '聊天' : '人设'));

              return (
                <article
                  className={['nai-character', expanded ? 'is-expanded' : ''].filter(Boolean).join(' ')}
                  key={character.id}
                >
                  <button
                    type="button"
                    className="nai-character__toggle"
                    aria-controls={detailsId}
                    aria-expanded={expanded}
                    onClick={() =>
                      setExpandedCharacterIds(current => ({ ...current, [character.id]: !current[character.id] }))
                    }
                  >
                    <span className="nai-character__summary">
                      <strong>{character.name.trim() || `人物 ${index + 1}`}</strong>
                      <span
                        className={['nai-character__status', character.enabled ? '' : 'is-muted']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {character.enabled ? '已启用' : '已停用'}
                      </span>
                      <span className="nai-character__bindings-summary">
                        {bindingLabels.length > 0 ? `绑定：${bindingLabels.join('、')}` : '全局生效'}
                      </span>
                    </span>
                    <span className="nai-character__toggle-state">
                      {expanded ? '收起' : '展开'}
                      <i
                        className={['fa-solid', expanded ? 'fa-chevron-up' : 'fa-chevron-down'].join(' ')}
                        aria-hidden="true"
                      ></i>
                    </span>
                  </button>

                  {expanded && (
                    <div id={detailsId} className="nai-character__details">
                      <div className="nai-settings__section-heading">
                        <Check
                          label={`人物 ${index + 1}`}
                          checked={character.enabled}
                          onChange={value => edit(next => void (next.characters[index]!.enabled = value))}
                        />
                        <button
                          type="button"
                          className="menu_button"
                          onClick={() => setDraft(removeCharacter(draft, character.id))}
                        >
                          删除
                        </button>
                      </div>
                      <Field label="名称">
                        <input
                          className="text_pole"
                          value={character.name}
                          onChange={event => {
                            const value = event.currentTarget.value;
                            edit(next => void (next.characters[index]!.name = value));
                          }}
                        />
                      </Field>
                      <Field label="提示内容" hint="可以是自然语言、标签或两者混合；模型将其作为参考而非逐字复制。">
                        <textarea
                          className="text_pole"
                          rows={4}
                          value={character.content}
                          onChange={event => {
                            const value = event.currentTarget.value;
                            edit(next => void (next.characters[index]!.content = value));
                          }}
                        />
                      </Field>
                      <Field label="避免内容">
                        <textarea
                          className="text_pole"
                          rows={2}
                          value={character.negative}
                          onChange={event => {
                            const value = event.currentTarget.value;
                            edit(next => void (next.characters[index]!.negative = value));
                          }}
                        />
                      </Field>
                      <div className="nai-settings__bindings">
                        {(['character', 'chat', 'persona'] as const).map(kind => {
                          const bound = character.bindings[kind];
                          const label = kind === 'character' ? '角色卡' : kind === 'chat' ? '聊天' : '人设';
                          return (
                            <button
                              key={kind}
                              type="button"
                              className={`menu_button ${bound ? 'is-active' : ''}`}
                              onClick={() =>
                                runAction(() =>
                                  toggleCharacterBinding(
                                    draft,
                                    character.id,
                                    kind as keyof CharacterBindings,
                                    initial.context,
                                  ),
                                )
                              }
                            >
                              {bound ? `${label}: ${bound.label}` : `绑定当前${label}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>

      {error && <pre className="nai-settings__error">{error}</pre>}
      <footer className="nai-settings__actions">
        <span className="nai-settings__hint">更改会自动保存</span>
        <button
          type="button"
          className="menu_button menu_button_cancel"
          onClick={() => {
            props.service.settings.flush();
            props.onClose();
          }}
        >
          关闭
        </button>
        <button type="button" className="menu_button" onClick={save}>
          保存并关闭
        </button>
      </footer>
    </div>
  );
}
