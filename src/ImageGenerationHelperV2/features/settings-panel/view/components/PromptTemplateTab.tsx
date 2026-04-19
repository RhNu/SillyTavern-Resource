import { useEffect, useState } from 'react';
import { getImageGenerationStore, useImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';
import { showSuccessToast, showWarningToast } from '@/ImageGenerationHelperV2/shared/toast';
import { HELP_TEXT, PROMPT_TEMPLATE_GUIDE } from '@/ImageGenerationHelperV2/features/settings-panel/view/meta';
import HelpMarker from '@/ImageGenerationHelperV2/features/settings-panel/view/components/HelpMarker';

export default function PromptTemplateTab() {
  const config = useImageGenerationStore(state => state.config);
  const updateConfig = useImageGenerationStore(state => state.updateConfig);
  const savePromptPresetAction = useImageGenerationStore(state => state.savePromptPreset);
  const deletePromptPresetAction = useImageGenerationStore(state => state.deletePromptPreset);
  const savePromptTemplateAction = useImageGenerationStore(state => state.savePromptTemplate);
  const deletePromptTemplateAction = useImageGenerationStore(state => state.deletePromptTemplate);
  const reinjectDefaultTemplatesAction = useImageGenerationStore(state => state.reinjectDefaultTemplates);

  const [promptPresetDraftName, setPromptPresetDraftName] = useState('');
  const [templateDraftName, setTemplateDraftName] = useState('');

  const promptPresetNames = Object.keys(config.prompt.presets.items);
  const templateNames = Object.keys(config.prompt.templates.items);
  const activePromptPresetName =
    (config.prompt.presets.selected in config.prompt.presets.items
      ? config.prompt.presets.selected
      : promptPresetNames[0]) ?? '';
  const activeTemplateName =
    (config.prompt.templates.selected in config.prompt.templates.items
      ? config.prompt.templates.selected
      : templateNames[0]) ?? '';
  const currentPromptPreset =
    config.prompt.presets.items[activePromptPresetName] ?? getImageGenerationStore().getActivePromptPreset();
  const currentTemplateContent =
    config.prompt.templates.items[activeTemplateName] ?? getImageGenerationStore().getActivePromptTemplate();

  useEffect(() => {
    setTemplateDraftName('');
  }, [config.prompt.templates.selected]);

  useEffect(() => {
    setPromptPresetDraftName('');
  }, [config.prompt.presets.selected]);

  const updateCurrentPromptPreset = (recipe: (draft: typeof currentPromptPreset) => void) => {
    if (!activePromptPresetName) {
      return;
    }

    updateConfig(draft => {
      const current = draft.prompt.presets.items[activePromptPresetName];
      if (!current) {
        return;
      }
      recipe(current);
    });
  };

  const savePromptPreset = () => {
    const nextName = promptPresetDraftName.trim();
    if (!nextName) {
      showWarningToast('请输入新的预设名称', '图片生成');
      return;
    }

    savePromptPresetAction(promptPresetDraftName);
    setPromptPresetDraftName('');
    showSuccessToast(`已保存提示词预设“${nextName}”`, '图片生成');
  };

  const deletePromptPreset = () => {
    if (promptPresetNames.length <= 1) {
      showWarningToast('至少需要保留一个提示词预设', '图片生成');
      return;
    }

    deletePromptPresetAction(activePromptPresetName);
    showSuccessToast(`已删除提示词预设“${activePromptPresetName}”`, '图片生成');
  };

  const saveTemplate = () => {
    const nextName = templateDraftName.trim();
    if (!nextName) {
      showWarningToast('请输入新的模板名称', '图片生成');
      return;
    }

    savePromptTemplateAction(templateDraftName, currentTemplateContent);
    setTemplateDraftName('');
    showSuccessToast(`已保存模板“${nextName}”`, '图片生成');
  };

  const deleteCurrentTemplate = () => {
    if (templateNames.length <= 1) {
      showWarningToast('至少需要保留一个模板', '图片生成');
      return;
    }

    deletePromptTemplateAction(activeTemplateName);
    showSuccessToast(`已删除模板“${activeTemplateName}”`, '图片生成');
  };

  const reinjectDefaultTemplates = () => {
    reinjectDefaultTemplatesAction();
    showSuccessToast('已重新注入默认模板', '图片生成');
  };

  return (
    <>
      <section className="imggen-section">
        <div className="imggen-section-header">
          <h4 className="imggen-section-title">前后缀预设</h4>
          <p className="imggen-section-desc">切换预设会直接切换当前提示词设置，编辑输入框时会立即写回当前预设。</p>
        </div>
        <div className="imggen-grid">
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>当前预设</span>
              <HelpMarker text={HELP_TEXT.promptPreset} />
            </span>
            <select
              className="text_pole"
              value={config.prompt.presets.selected}
              onChange={event => {
                const value = event.currentTarget.value;
                updateConfig(draft => {
                  draft.prompt.presets.selected = value;
                });
              }}
            >
              {promptPresetNames.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="imggen-field">
            <span>另存为预设名</span>
            <input
              className="text_pole"
              placeholder="输入新名称复制当前预设"
              type="text"
              value={promptPresetDraftName}
              onChange={event => setPromptPresetDraftName(event.currentTarget.value)}
            />
          </label>
        </div>
        <div className="imggen-actions">
          <button className="menu_button imggen-button" type="button" onClick={savePromptPreset}>
            另存为预设
          </button>
          <button className="menu_button imggen-button" type="button" onClick={deletePromptPreset}>
            删除当前预设
          </button>
        </div>
        <label className="imggen-field">
          <span>前缀</span>
          <textarea
            className="text_pole"
            rows={3}
            value={currentPromptPreset.prefix}
            onChange={event => {
              const value = event.currentTarget.value;
              updateCurrentPromptPreset(draft => {
                draft.prefix = value;
              });
            }}
          />
        </label>
        <label className="imggen-field">
          <span>后缀</span>
          <textarea
            className="text_pole"
            rows={3}
            value={currentPromptPreset.suffix}
            onChange={event => {
              const value = event.currentTarget.value;
              updateCurrentPromptPreset(draft => {
                draft.suffix = value;
              });
            }}
          />
        </label>
        <label className="imggen-field">
          <span className="imggen-label-line">
            <span>负面词</span>
            <HelpMarker text={HELP_TEXT.promptNegative} />
          </span>
          <textarea
            className="text_pole"
            rows={4}
            value={currentPromptPreset.negative}
            onChange={event => {
              const value = event.currentTarget.value;
              updateCurrentPromptPreset(draft => {
                draft.negative = value;
              });
            }}
          />
        </label>
        <label className="imggen-check">
          <input
            checked={currentPromptPreset.injectionMode === 'nai'}
            type="checkbox"
            onChange={event => {
              const checked = event.currentTarget.checked;
              updateCurrentPromptPreset(draft => {
                draft.injectionMode = checked ? 'nai' : 'plain';
              });
            }}
          />
          <span className="imggen-check-label">
            <span>NAI适配</span>
            <HelpMarker text={HELP_TEXT.promptInjectionMode} />
          </span>
        </label>
        <p className="imggen-hint">
          开启后，若提示词中包含 <span className="imggen-code">|</span> 多段结构，后缀只注入第一段。
        </p>
      </section>

      <section className="imggen-section">
        <div className="imggen-section-header">
          <h4 className="imggen-section-title">模板说明</h4>
          <p className="imggen-section-desc">模板继续保留自由文本编辑，运行时会自动把人物库内容替换进占位符。</p>
        </div>
        <div className="imggen-guide">
          <p className="imggen-hint">{PROMPT_TEMPLATE_GUIDE.summary}</p>
          <p className="imggen-inline-note">推荐标签顺序：{PROMPT_TEMPLATE_GUIDE.recommendedOrder}</p>
          <ul className="imggen-guide-list">
            {PROMPT_TEMPLATE_GUIDE.placeholders.map(item => (
              <li key={item.token}>
                <span className="imggen-code">{item.token}</span>
                <span>：{item.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="imggen-section">
        <div className="imggen-section-header">
          <h4 className="imggen-section-title">模板编辑器</h4>
          <p className="imggen-section-desc">
            当前模板会参与提示词生成消息拼装，也会提供人物占位符替换；编辑内容会立即写回当前模板。
          </p>
        </div>
        <div className="imggen-grid">
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>当前模板</span>
              <HelpMarker text={HELP_TEXT.promptTemplate} />
            </span>
            <select
              className="text_pole"
              value={config.prompt.templates.selected}
              onChange={event => {
                const value = event.currentTarget.value;
                updateConfig(draft => {
                  draft.prompt.templates.selected = value;
                });
              }}
            >
              {templateNames.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="imggen-field">
            <span>另存为模板名</span>
            <input
              className="text_pole"
              placeholder="输入新名称复制当前模板"
              type="text"
              value={templateDraftName}
              onChange={event => setTemplateDraftName(event.currentTarget.value)}
            />
          </label>
        </div>
        <label className="imggen-field">
          <span>模板内容</span>
          <textarea
            className="text_pole"
            rows={12}
            value={currentTemplateContent}
            onChange={event => {
              const value = event.currentTarget.value;
              if (!activeTemplateName) {
                return;
              }
              updateConfig(draft => {
                draft.prompt.templates.items[activeTemplateName] = value;
              });
            }}
          />
        </label>
        <div className="imggen-actions">
          <button className="menu_button imggen-button" type="button" onClick={saveTemplate}>
            另存为模板
          </button>
          <button className="menu_button imggen-button" type="button" onClick={deleteCurrentTemplate}>
            删除当前模板
          </button>
          <button className="menu_button imggen-button" type="button" onClick={reinjectDefaultTemplates}>
            重新注入默认模板
          </button>
        </div>
      </section>
    </>
  );
}
