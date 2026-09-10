import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { NovelAiImageService } from '../app/service';
import { MODEL_IDS, SAMPLERS, SCHEDULES, type CharacterBindings, type Settings } from '../settings/schema';
import {
  addCharacter,
  addTemplate,
  createSettingsEditorModel,
  deleteSelectedTemplate,
  editSettings,
  removeCharacter,
  restoreSelectedTemplate,
  saveSettings,
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
  const [newTemplateName, setNewTemplateName] = useState('');
  const [status, setStatus] = useState('正在检查 imggen-novelai…');
  const [error, setError] = useState('');
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

  const template = draft.analysis.templates.items[draft.analysis.templates.selected]!;

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
            ['templates', '提示词模板'],
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
                  onChange={event => edit(next => void (next.analysis.proxyPreset = event.currentTarget.value))}
                />
              </Field>
              <Field label="API URL">
                <input
                  className="text_pole"
                  value={draft.analysis.apiUrl}
                  onChange={event => edit(next => void (next.analysis.apiUrl = event.currentTarget.value))}
                />
              </Field>
              <Field label="API Key">
                <input
                  className="text_pole"
                  type="password"
                  value={draft.analysis.apiKey}
                  onChange={event => edit(next => void (next.analysis.apiKey = event.currentTarget.value))}
                />
              </Field>
              <div className="nai-settings__grid">
                <Field label="模型">
                  <input
                    className="text_pole"
                    value={draft.analysis.model}
                    onChange={event => edit(next => void (next.analysis.model = event.currentTarget.value))}
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
            <p className="nai-settings__hint">系统会按当前生图模型自动选择 V4.5 或 V5 模板正文。</p>
            <Field label="当前模板">
              <select
                className="text_pole"
                value={draft.analysis.templates.selected}
                onChange={event => edit(next => void (next.analysis.templates.selected = event.currentTarget.value))}
              >
                {Object.keys(draft.analysis.templates.items).map(name => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </Field>
            <div className="nai-settings__inline">
              <input
                className="text_pole"
                placeholder="新模板名称"
                value={newTemplateName}
                onChange={event => setNewTemplateName(event.currentTarget.value)}
              />
              <button
                type="button"
                className="menu_button"
                onClick={() => runAction(() => addTemplate(draft, newTemplateName))}
              >
                新增
              </button>
              <button
                type="button"
                className="menu_button"
                onClick={() => runAction(() => deleteSelectedTemplate(draft))}
              >
                删除当前
              </button>
              <button
                type="button"
                className="menu_button"
                onClick={() => runAction(() => restoreSelectedTemplate(draft))}
              >
                恢复官方内容
              </button>
            </div>
            <Field label="V4.5 核心模板" hint="建议只要求小写 Danbooru 标签串；不要依赖自然语言理解。">
              <textarea
                className="text_pole"
                rows={12}
                value={template.v45}
                onChange={event =>
                  edit(
                    next =>
                      void (next.analysis.templates.items[next.analysis.templates.selected]!.v45 =
                        event.currentTarget.value),
                  )
                }
              />
            </Field>
            <Field label="V5 核心模板" hint="可使用自然语言、中文、标签或混合表达。">
              <textarea
                className="text_pole"
                rows={12}
                value={template.v5}
                onChange={event =>
                  edit(
                    next =>
                      void (next.analysis.templates.items[next.analysis.templates.selected]!.v5 =
                        event.currentTarget.value),
                  )
                }
              />
            </Field>
          </section>
        )}

        {tab === 'image' && (
          <section>
            <h4>NovelAI 请求</h4>
            <Field label="生图模型">
              <select
                className="text_pole"
                value={draft.generation.model}
                onChange={event =>
                  edit(
                    next => void (next.generation.model = event.currentTarget.value as Settings['generation']['model']),
                  )
                }
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
                  onChange={event =>
                    edit(
                      next =>
                        void (next.generation.sampler = event.currentTarget.value as Settings['generation']['sampler']),
                    )
                  }
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
                  onChange={event =>
                    edit(
                      next =>
                        void (next.generation.schedule = event.currentTarget
                          .value as Settings['generation']['schedule']),
                    )
                  }
                >
                  {SCHEDULES.map(schedule => (
                    <option key={schedule}>{schedule}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Seed" hint="留空表示随机">
              <input
                className="text_pole"
                type="number"
                value={draft.generation.seed ?? ''}
                onChange={event =>
                  edit(
                    next =>
                      void (next.generation.seed = event.currentTarget.value
                        ? Number(event.currentTarget.value)
                        : null),
                  )
                }
              />
            </Field>
            <Field label="主提示词前缀">
              <textarea
                className="text_pole"
                rows={2}
                value={draft.generation.prefix}
                onChange={event => edit(next => void (next.generation.prefix = event.currentTarget.value))}
              />
            </Field>
            <Field label="主提示词后缀">
              <textarea
                className="text_pole"
                rows={2}
                value={draft.generation.suffix}
                onChange={event => edit(next => void (next.generation.suffix = event.currentTarget.value))}
              />
            </Field>
            <Field label="全局负面提示词">
              <textarea
                className="text_pole"
                rows={3}
                value={draft.generation.negative}
                onChange={event => edit(next => void (next.generation.negative = event.currentTarget.value))}
              />
            </Field>
          </section>
        )}

        {tab === 'characters' && (
          <section>
            <div className="nai-settings__section-heading">
              <div>
                <h4>人物参考库</h4>
                <p className="nai-settings__hint">未绑定的条目全局生效；多个绑定条件必须同时匹配。</p>
              </div>
              <button type="button" className="menu_button" onClick={() => setDraft(addCharacter(draft))}>
                新增人物
              </button>
            </div>
            <p className="nai-settings__context">
              当前：角色卡 {initial.context.character?.label ?? '无'} · 聊天 {initial.context.chat?.label ?? '无'} ·
              人设 {initial.context.persona?.label ?? '无'}
            </p>
            {draft.characters.length === 0 && <p className="nai-settings__empty">还没有人物参考。</p>}
            {draft.characters.map((character, index) => (
              <article className="nai-character" key={character.id}>
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
                    onChange={event => edit(next => void (next.characters[index]!.name = event.currentTarget.value))}
                  />
                </Field>
                <Field label="提示内容" hint="可以是自然语言、标签或两者混合；模型将其作为参考而非逐字复制。">
                  <textarea
                    className="text_pole"
                    rows={5}
                    value={character.content}
                    onChange={event => edit(next => void (next.characters[index]!.content = event.currentTarget.value))}
                  />
                </Field>
                <Field label="避免内容">
                  <textarea
                    className="text_pole"
                    rows={2}
                    value={character.negative}
                    onChange={event =>
                      edit(next => void (next.characters[index]!.negative = event.currentTarget.value))
                    }
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
              </article>
            ))}
          </section>
        )}
      </main>

      {error && <pre className="nai-settings__error">{error}</pre>}
      <footer className="nai-settings__actions">
        <button type="button" className="menu_button menu_button_cancel" onClick={props.onClose}>
          取消
        </button>
        <button type="button" className="menu_button" onClick={save}>
          保存
        </button>
      </footer>
    </div>
  );
}
