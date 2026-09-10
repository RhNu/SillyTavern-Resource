import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { HelpMarker } from '@util/components/HelpMarker';
import type { LlmCapabilities, LlmModel } from '../../../../util/llm-requester/contract';
import type { NovelAiImageService } from '../app/service';
import { MODEL_IDS, SAMPLERS, SCHEDULES, type CharacterBindings, type Settings } from '../settings/schema';
import { requestPromptPresetName } from './prompt-preset-dialog';
import CollapsibleSection from './CollapsibleSection';
import { ContextCleanupFields } from './ContextCleanupFields';
import {
  addCharacter,
  createSettingsEditorModel,
  deleteSelectedPromptPreset,
  editSettings,
  removeCharacter,
  savePromptPreset as savePromptPresetSettings,
  scheduleSettingsSave,
  toggleCharacterBinding,
} from './settings-model';

type Tab = 'general' | 'templates' | 'image' | 'characters';

type FieldHelp = {
  title: string;
  text: string;
};

type BackendStatus = {
  version?: string;
  ready: boolean;
  detail: string;
};

function getErrorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

function showSettingsError(reason: unknown): void {
  toastr.error(getErrorMessage(reason), 'NovelAI 图片助手');
}

function Field(props: { label: string; help?: FieldHelp; children: ReactNode }) {
  return (
    <div className="nai-settings__field">
      <div className="nai-settings__field-label">
        <span>{props.label}</span>
        {props.help && <HelpMarker title={props.help.title} text={props.help.text} />}
      </div>
      {props.children}
    </div>
  );
}

function Check(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="nai-settings__check">
      <input type="checkbox" checked={props.checked} onChange={event => props.onChange(event.currentTarget.checked)} />
      <span>{props.label}</span>
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

export default function SettingsPanel(props: { service: NovelAiImageService }) {
  const initial = useMemo(() => createSettingsEditorModel(props.service), [props.service]);
  const [draft, setDraft] = useState(initial.draft);
  const [tab, setTab] = useState<Tab>('general');
  const [expandedCharacterIds, setExpandedCharacterIds] = useState<Record<string, boolean>>({});
  const [templateOpen, setTemplateOpen] = useState(false);
  const [promptModelOpen, setPromptModelOpen] = useState(false);
  const [generationAdvancedOpen, setGenerationAdvancedOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    ready: false,
    detail: '正在检查 imggen-novelai 后端。',
  });
  const [llmCapabilities, setLlmCapabilities] = useState<LlmCapabilities>();
  const [promptModels, setPromptModels] = useState<LlmModel[]>([]);
  const [promptModelStatus, setPromptModelStatus] = useState('正在读取 Provider。');
  // Event currentTarget is cleared after the handler returns, so handlers must capture values before calling edit.
  const edit = (recipe: (next: Settings) => void) => setDraft(current => editSettings(current, recipe));

  useEffect(() => {
    let active = true;
    void props.service.backend
      .capabilities()
      .then(result => {
        if (!active) return;
        setBackendStatus({
          version: result.version,
          ready: result.configured,
          detail: result.configured
            ? 'imggen-novelai 后端连接正常，且服务端已配置 NOVELAI_TOKEN。'
            : '已连接 imggen-novelai 后端，但服务端未配置 NOVELAI_TOKEN。',
        });
      })
      .catch(reason => {
        if (active) {
          setBackendStatus({ ready: false, detail: `无法连接 imggen-novelai 后端：${getErrorMessage(reason)}` });
        }
      });
    return () => {
      active = false;
    };
  }, [props.service]);

  useEffect(() => {
    const controller = new AbortController();
    void props.service.llmRequester
      .capabilities(controller.signal)
      .then(result => {
        setLlmCapabilities(result);
        if (!result.runtimeCompatible) {
          setPromptModelStatus('llm-requester 与当前 SillyTavern 运行时不兼容。');
          return;
        }
        setDraft(current => {
          const selected = result.providers.find(provider => provider.id === current.analysis.connection.providerId);
          const provider = selected ?? result.providers[0];
          if (!provider) return current;
          const credentialId = provider.credentials.some(item => item.id === current.analysis.connection.credentialId)
            ? current.analysis.connection.credentialId
            : ((provider.credentials.find(item => item.active) ?? provider.credentials[0])?.id ?? '');
          if (
            provider.id === current.analysis.connection.providerId &&
            credentialId === current.analysis.connection.credentialId
          ) {
            return current;
          }
          return editSettings(current, next => {
            next.analysis.connection.providerId = provider.id;
            next.analysis.connection.credentialId = credentialId;
            next.analysis.model = '';
          });
        });
      })
      .catch(reason => setPromptModelStatus(`无法连接 llm-requester：${getErrorMessage(reason)}`));
    return () => controller.abort();
  }, [props.service]);

  useEffect(() => {
    const provider = llmCapabilities?.providers.find(item => item.id === draft.analysis.connection.providerId);
    if (!provider || !llmCapabilities?.runtimeCompatible) return;
    if (provider.credentialRequired && !draft.analysis.connection.credentialId) {
      const timer = window.setTimeout(() => {
        setPromptModels([]);
        setPromptModelStatus(`请先在 SillyTavern 中保存 ${provider.label} 密钥。`);
      });
      return () => window.clearTimeout(timer);
    }
    if (provider.baseUrl.mode === 'custom') {
      try {
        const url = new URL(draft.analysis.connection.baseUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        const timer = window.setTimeout(() => {
          setPromptModels([]);
          setPromptModelStatus('请输入有效的 Custom Base URL。');
        });
        return () => window.clearTimeout(timer);
      }
    }

    const controller = new AbortController();
    const timer = window.setTimeout(
      () => {
        setPromptModels([]);
        setPromptModelStatus('正在获取模型列表。');
        void props.service.llmRequester
          .models(
            {
              providerId: provider.id,
              ...(draft.analysis.connection.credentialId
                ? { credentialId: draft.analysis.connection.credentialId }
                : {}),
              ...(provider.baseUrl.mode === 'custom' ? { baseUrl: draft.analysis.connection.baseUrl } : {}),
            },
            controller.signal,
          )
          .then(result => {
            setPromptModels(result.models);
            setPromptModelStatus(
              result.models.length ? `已获取 ${result.models.length} 个模型。` : 'Provider 没有返回模型。',
            );
            setDraft(current => {
              if (result.models.some(model => model.id === current.analysis.model)) return current;
              return editSettings(current, next => void (next.analysis.model = result.models[0]?.id ?? ''));
            });
          })
          .catch(reason => {
            if (!controller.signal.aborted) setPromptModelStatus(`获取模型失败：${getErrorMessage(reason)}`);
          });
      },
      provider.baseUrl.mode === 'custom' ? 400 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    draft.analysis.connection.baseUrl,
    draft.analysis.connection.credentialId,
    draft.analysis.connection.providerId,
    llmCapabilities,
    props.service,
  ]);

  useEffect(() => {
    scheduleSettingsSave(props.service, draft);
  }, [draft, props.service]);

  const runAction = (action: () => Settings) => {
    try {
      setDraft(action());
    } catch (reason) {
      showSettingsError(reason);
    }
  };

  const savePromptPresetAs = async () => {
    try {
      const rawName = await requestPromptPresetName();
      if (rawName === undefined) return;

      const next = savePromptPresetSettings(draft, rawName);
      setDraft(next);
      toastr.success(`已另存为提示词预设“${rawName.trim()}”`, 'NovelAI 图片助手');
    } catch (reason) {
      showSettingsError(reason);
    }
  };

  const template = draft.analysis.templates;
  const promptPresetNames = Object.keys(draft.generation.promptPresets.items);
  const promptPreset = draft.generation.promptPresets.items[draft.generation.promptPresets.selected]!;
  const promptProvider = llmCapabilities?.providers.find(
    provider => provider.id === draft.analysis.connection.providerId,
  );

  return (
    <div className="nai-settings">
      <header className="nai-settings__header">
        <div className="nai-settings__title-row">
          <h3>NovelAI 图片助手</h3>
          <div className="nai-settings__header-status" aria-label="后端状态">
            <span
              className={['nai-settings__status-dot', backendStatus.ready ? 'is-ready' : 'is-error'].join(' ')}
              aria-label={backendStatus.ready ? '后端正常' : '后端异常'}
            ></span>
            <span className="nai-settings__version-badge">v{backendStatus.version ?? '—'}</span>
            <HelpMarker title="后端状态" text={backendStatus.detail} />
          </div>
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
              <div className="nai-settings__checks">
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
              </div>
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
            <ContextCleanupFields
              value={draft.analysis.cleanup}
              onChange={cleanup => edit(next => void (next.analysis.cleanup = cleanup))}
            />
            <CollapsibleSection
              title="提示词模型"
              contentId="nai-prompt-model-details"
              open={promptModelOpen}
              onOpenChange={setPromptModelOpen}
            >
              <Field label="Provider">
                <select
                  className="text_pole"
                  value={draft.analysis.connection.providerId}
                  disabled={!llmCapabilities?.runtimeCompatible}
                  onChange={event => {
                    const providerId = event.currentTarget.value;
                    const provider = llmCapabilities?.providers.find(item => item.id === providerId);
                    edit(next => {
                      next.analysis.connection.providerId = providerId;
                      next.analysis.connection.credentialId =
                        (provider?.credentials.find(item => item.active) ?? provider?.credentials[0])?.id ?? '';
                      next.analysis.model = '';
                    });
                  }}
                >
                  {(llmCapabilities?.providers ?? []).map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.label}
                    </option>
                  ))}
                </select>
              </Field>
              {promptProvider?.baseUrl.mode === 'custom' && (
                <Field label="OpenAI-compatible Base URL">
                  <input
                    className="text_pole"
                    placeholder={promptProvider.baseUrl.placeholder}
                    value={draft.analysis.connection.baseUrl}
                    onChange={event => {
                      const value = event.currentTarget.value;
                      edit(next => void (next.analysis.connection.baseUrl = value));
                    }}
                  />
                </Field>
              )}
              <div className="nai-settings__grid">
                <Field
                  label="凭证"
                  help={{ title: '凭证来源', text: '选项读取自当前 SillyTavern 用户的密码管理器，不会传给浏览器。' }}
                >
                  <select
                    className="text_pole"
                    value={draft.analysis.connection.credentialId}
                    disabled={!promptProvider}
                    onChange={event => {
                      const credentialId = event.currentTarget.value;
                      edit(next => {
                        next.analysis.connection.credentialId = credentialId;
                        next.analysis.model = '';
                      });
                    }}
                  >
                    {!promptProvider?.credentialRequired && <option value="">不使用密钥</option>}
                    {promptProvider?.credentialRequired && promptProvider.credentials.length === 0 && (
                      <option value="">没有已保存的凭证</option>
                    )}
                    {promptProvider?.credentials.map(credential => (
                      <option key={credential.id} value={credential.id}>
                        {credential.label}
                        {credential.active ? '（当前）' : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="模型">
                  <select
                    className="text_pole"
                    value={draft.analysis.model}
                    disabled={promptModels.length === 0}
                    onChange={event => {
                      const value = event.currentTarget.value;
                      edit(next => void (next.analysis.model = value));
                    }}
                  >
                    {promptModels.length === 0 && <option value="">暂无模型</option>}
                    {promptModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="nai-settings__empty">{promptModelStatus}</p>
              <NumberField
                label="最大 Tokens"
                value={draft.analysis.maxTokens}
                min={256}
                max={32000}
                onChange={value => edit(next => void (next.analysis.maxTokens = value))}
              />
            </CollapsibleSection>
          </>
        )}

        {tab === 'templates' && (
          <CollapsibleSection
            title="模型分流模板"
            contentId="nai-model-template-details"
            open={templateOpen}
            onOpenChange={setTemplateOpen}
          >
            <Field
              label="V4.5 模板"
              help={{ title: 'V4.5 模板说明', text: '通常使用 Danbooru 标签串；当前生图模型为 V4.5 时使用。' }}
            >
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
            <Field
              label="V5 模板"
              help={{ title: 'V5 模板说明', text: '可使用自然语言、中文、标签或混合表达；当前生图模型为 V5 时使用。' }}
            >
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
          </CollapsibleSection>
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
            </div>
            <CollapsibleSection
              title="高级生成参数"
              contentId="nai-generation-advanced-details"
              open={generationAdvancedOpen}
              onOpenChange={setGenerationAdvancedOpen}
            >
              <div className="nai-settings__grid">
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
              <Field label="种子" help={{ title: '种子说明', text: '留空表示每次随机生成。' }}>
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
            </CollapsibleSection>
            <div className="nai-settings__prompt-presets">
              <div className="nai-settings__section-heading nai-settings__section-heading--center">
                <div className="nai-settings__title-with-help">
                  <h4>提示词预设</h4>
                  <HelpMarker title="提示词预设说明" text="切换预设会同时切换主提示词前缀、后缀和全局负面提示词。" />
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
              <div className="nai-settings__title-with-help">
                <h4>人物参考库</h4>
                <HelpMarker title="人物参考库说明" text="未绑定的条目全局生效；绑定多个条件时必须同时匹配。" />
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
            <div className="nai-settings__context-badges" aria-label="当前绑定上下文">
              {(
                [
                  ['角色卡', initial.context.character?.label ?? '无'],
                  ['聊天', initial.context.chat?.label ?? '无'],
                  ['人设', initial.context.persona?.label ?? '无'],
                ] as const
              ).map(([kind, value]) => (
                <span className="nai-settings__badge nai-settings__context-badge" key={kind}>
                  <span className="nai-settings__badge-label">{kind}</span>
                  <span className="nai-settings__badge-value">{value}</span>
                </span>
              ))}
            </div>
            {draft.characters.length === 0 && <p className="nai-settings__empty">还没有人物参考。</p>}
            {draft.characters.map((character, index) => {
              const expanded = Boolean(expandedCharacterIds[character.id]);
              const detailsId = `nai-character-details-${character.id}`;
              const bindingLabels = (['character', 'chat', 'persona'] as const)
                .filter(kind => character.bindings[kind])
                .map(kind => (kind === 'character' ? '角色卡' : kind === 'chat' ? '聊天' : '人设'));

              return (
                <CollapsibleSection
                  className="nai-character"
                  key={character.id}
                  title={
                    <span className="nai-character__summary">
                      <strong>{character.name.trim() || `人物 ${index + 1}`}</strong>
                      <span
                        className={['nai-character__badge', character.enabled ? '' : 'is-muted']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {character.enabled ? '启用' : '停用'}
                      </span>
                      {bindingLabels.length > 0 ? (
                        bindingLabels.map(label => (
                          <span className="nai-character__badge" key={label}>
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="nai-character__badge">全局</span>
                      )}
                    </span>
                  }
                  contentId={detailsId}
                  open={expanded}
                  onOpenChange={open => setExpandedCharacterIds(current => ({ ...current, [character.id]: open }))}
                >
                  <div className="nai-character__details">
                    <div className="nai-settings__section-heading">
                      <Check
                        label="启用"
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
                    <Field
                      label="提示内容"
                      help={{
                        title: '提示内容说明',
                        text: '可以使用自然语言、标签或两者混合；模型会将其作为参考，而不是逐字复制。',
                      }}
                    >
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
                </CollapsibleSection>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
