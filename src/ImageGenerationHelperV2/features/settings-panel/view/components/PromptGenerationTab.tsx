import { useEffect, useState, type ChangeEvent } from 'react';
import { getImageGenerationStore, useImageGenerationStore } from '@/ImageGenerationHelperV2/config/store';
import { logError } from '@/ImageGenerationHelperV2/shared/log';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/ImageGenerationHelperV2/shared/toast';
import { HELP_TEXT } from '@/ImageGenerationHelperV2/features/settings-panel/view/meta';
import HelpMarker from '@/ImageGenerationHelperV2/features/settings-panel/view/components/HelpMarker';

function readNumberInput(event: ChangeEvent<HTMLInputElement>, fallback: number): number {
  return Number.isNaN(event.currentTarget.valueAsNumber) ? fallback : event.currentTarget.valueAsNumber;
}

function getApiHost(apiurl: string): string {
  const trimmed = apiurl.trim();
  if (!trimmed) {
    return '未设置地址';
  }

  try {
    return new URL(trimmed).host || trimmed;
  } catch {
    return trimmed;
  }
}

export default function PromptGenerationTab() {
  const config = useImageGenerationStore(state => state.config);
  const updateConfig = useImageGenerationStore(state => state.updateConfig);
  const saveApiPresetAction = useImageGenerationStore(state => state.saveApiPreset);
  const deleteApiPresetAction = useImageGenerationStore(state => state.deleteApiPreset);

  const [apiPresetDraftName, setApiPresetDraftName] = useState('');
  const [apiSettingsExpanded, setApiSettingsExpanded] = useState(false);
  const [contextFilterExpanded, setContextFilterExpanded] = useState(false);

  const apiPresetNames = Object.keys(config.independentApi.presets.items);
  const activeApiPresetName =
    (config.independentApi.presets.selected in config.independentApi.presets.items
      ? config.independentApi.presets.selected
      : apiPresetNames[0]) ?? '';
  const currentApiPreset =
    config.independentApi.presets.items[activeApiPresetName] ?? getImageGenerationStore().getActiveApiPreset();
  const apiSummary = [
    activeApiPresetName || '未命名预设',
    currentApiPreset.model.trim() || '未设置模型',
    getApiHost(currentApiPreset.apiurl),
  ].join(' · ');
  const filterCount = config.independentApi.filterTags
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean).length;
  const extractCount = config.independentApi.extractTags
    .split(',')
    .map(item => item.trim())
    .filter(Boolean).length;
  const contextFilterSummary =
    filterCount === 0 && extractCount === 0
      ? '当前未启用过滤规则或提取标签。'
      : `过滤规则 ${filterCount} 条 · 提取标签 ${extractCount} 条`;

  useEffect(() => {
    setApiPresetDraftName('');
  }, [config.independentApi.presets.selected]);

  const updateCurrentApiPreset = (recipe: (draft: typeof currentApiPreset) => void) => {
    if (!activeApiPresetName) {
      return;
    }

    updateConfig(draft => {
      const current = draft.independentApi.presets.items[activeApiPresetName];
      if (!current) {
        return;
      }
      recipe(current);
    });
  };

  const saveApiPreset = () => {
    const nextName = apiPresetDraftName.trim();
    if (!nextName) {
      showWarningToast('请输入新的 API 预设名称', '提示词生成');
      return;
    }

    saveApiPresetAction(apiPresetDraftName);
    setApiPresetDraftName('');
    showSuccessToast(`已保存 API 预设“${nextName}”`, '提示词生成');
  };

  const deleteApiPreset = () => {
    if (apiPresetNames.length <= 1) {
      showWarningToast('至少需要保留一个 API 预设', '提示词生成');
      return;
    }

    deleteApiPresetAction(activeApiPresetName);
    showSuccessToast(`已删除 API 预设“${activeApiPresetName}”`, '提示词生成');
  };

  const fetchModels = async () => {
    try {
      const models = await getModelList({
        apiurl: currentApiPreset.apiurl,
        key: currentApiPreset.key || undefined,
      });

      if (models.length === 0) {
        showWarningToast('没有获取到模型列表', '提示词生成');
        return;
      }

      updateCurrentApiPreset(draft => {
        draft.model = models[0]!;
      });
      showSuccessToast(`已获取 ${models.length} 个模型，当前选中 ${models[0]}`, '提示词生成');
    } catch (error) {
      logError('获取提示词生成模型列表失败', error);
      showErrorToast(error instanceof Error ? error.message : '获取模型失败', '提示词生成');
    }
  };

  return (
    <>
      <section className="imggen-section">
        <div className="imggen-section-header">
          <h4 className="imggen-section-title">提示词生成触发</h4>
          <p className="imggen-section-desc">
            第一页分别控制脚本总开关和自动提示词请求；这里仅配置自动请求的节奏、阈值和分析范围。
          </p>
        </div>
        <p className="imggen-hint">
          总开关和“自动请求提示词生成”开关都在第一个标签页；这里仅配置自动请求的条件、节奏和 API 参数。
        </p>
        <div className="imggen-grid">
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>最小楼层</span>
              <HelpMarker text={HELP_TEXT.independentMinFloor} />
            </span>
            <input
              className="text_pole"
              max="999"
              min="1"
              type="number"
              value={config.independentApi.minFloor}
              onChange={event => {
                const nextValue = readNumberInput(event, config.independentApi.minFloor);
                updateConfig(draft => {
                  draft.independentApi.minFloor = nextValue;
                });
              }}
            />
          </label>
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>历史消息数</span>
              <HelpMarker text={HELP_TEXT.independentHistoryCount} />
            </span>
            <input
              className="text_pole"
              max="10"
              min="1"
              type="number"
              value={config.independentApi.historyCount}
              onChange={event => {
                const nextValue = readNumberInput(event, config.independentApi.historyCount);
                updateConfig(draft => {
                  draft.independentApi.historyCount = nextValue;
                });
              }}
            />
          </label>
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>识别原文最小长度</span>
              <HelpMarker text={HELP_TEXT.independentParagraphMinLength} />
            </span>
            <input
              className="text_pole"
              max="200"
              min="1"
              type="number"
              value={config.independentApi.paragraphMinLength}
              onChange={event => {
                const nextValue = readNumberInput(event, config.independentApi.paragraphMinLength);
                updateConfig(draft => {
                  draft.independentApi.paragraphMinLength = nextValue;
                });
              }}
            />
          </label>
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>防抖(ms)</span>
              <HelpMarker text={HELP_TEXT.independentDebounceMs} />
            </span>
            <input
              className="text_pole"
              max="10000"
              min="200"
              step="100"
              type="number"
              value={config.independentApi.debounceMs}
              onChange={event => {
                const nextValue = readNumberInput(event, config.independentApi.debounceMs);
                updateConfig(draft => {
                  draft.independentApi.debounceMs = nextValue;
                });
              }}
            />
          </label>
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>重试次数</span>
              <HelpMarker text={HELP_TEXT.independentRetryCount} />
            </span>
            <input
              className="text_pole"
              max="10"
              min="0"
              type="number"
              value={config.independentApi.retryCount}
              onChange={event => {
                const nextValue = readNumberInput(event, config.independentApi.retryCount);
                updateConfig(draft => {
                  draft.independentApi.retryCount = nextValue;
                });
              }}
            />
          </label>
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>重试间隔(秒)</span>
              <HelpMarker text={HELP_TEXT.independentRetryDelaySeconds} />
            </span>
            <input
              className="text_pole"
              max="30"
              min="0"
              step="0.5"
              type="number"
              value={config.independentApi.retryDelaySeconds}
              onChange={event => {
                const nextValue = readNumberInput(event, config.independentApi.retryDelaySeconds);
                updateConfig(draft => {
                  draft.independentApi.retryDelaySeconds = nextValue;
                });
              }}
            />
          </label>
        </div>
      </section>

      <section className="imggen-section">
        <div className="imggen-section-header">
          <h4 className="imggen-section-title">API 预设</h4>
          <p className="imggen-section-desc">切换预设会直接切换当前 API 设置，编辑输入框时会立即写回当前预设。</p>
        </div>
        <div className="imggen-grid">
          <label className="imggen-field">
            <span>当前预设</span>
            <select
              className="text_pole"
              value={config.independentApi.presets.selected}
              onChange={event => {
                const value = event.currentTarget.value;
                updateConfig(draft => {
                  draft.independentApi.presets.selected = value;
                });
              }}
            >
              {apiPresetNames.map(name => (
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
              value={apiPresetDraftName}
              onChange={event => setApiPresetDraftName(event.currentTarget.value)}
            />
          </label>
        </div>
        <div className="imggen-actions">
          <button className="menu_button imggen-button" type="button" onClick={saveApiPreset}>
            另存为 API 预设
          </button>
          <button className="menu_button imggen-button" type="button" onClick={deleteApiPreset}>
            删除当前 API 预设
          </button>
        </div>
      </section>

      <section className="imggen-section">
        <button
          aria-expanded={apiSettingsExpanded}
          className="imggen-collapse-button"
          type="button"
          onClick={() => setApiSettingsExpanded(current => !current)}
        >
          <span className="imggen-collapse-copy">
            <span className="imggen-section-title">API 参数</span>
            <span className="imggen-section-desc">{apiSummary}</span>
          </span>
          <span className="imggen-collapse-state">
            <span>{apiSettingsExpanded ? '收起' : '展开'}</span>
            <i className={apiSettingsExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'}></i>
          </span>
        </button>
        {apiSettingsExpanded ? (
          <div className="imggen-collapse-body">
            <p className="imggen-section-desc">
              这里的字段会原样传给 <span className="imggen-code">generateRaw.custom_api</span>，source 固定为
              <span className="imggen-code">openai</span>。
            </p>
            <div className="imggen-grid">
              <label className="imggen-field imggen-span-2">
                <span className="imggen-label-line">
                  <span>API URL</span>
                  <HelpMarker text={HELP_TEXT.independentApiUrl} />
                </span>
                <input
                  className="text_pole"
                  type="text"
                  value={currentApiPreset.apiurl}
                  onChange={event => {
                    const value = event.currentTarget.value;
                    updateCurrentApiPreset(draft => {
                      draft.apiurl = value;
                    });
                  }}
                />
              </label>
              <label className="imggen-field imggen-span-2">
                <span className="imggen-label-line">
                  <span>API Key</span>
                  <HelpMarker text={HELP_TEXT.independentApiKey} />
                </span>
                <input
                  className="text_pole"
                  type="password"
                  value={currentApiPreset.key}
                  onChange={event => {
                    const value = event.currentTarget.value;
                    updateCurrentApiPreset(draft => {
                      draft.key = value;
                    });
                  }}
                />
              </label>
              <label className="imggen-field imggen-span-2">
                <span className="imggen-label-line">
                  <span>模型</span>
                  <HelpMarker text={HELP_TEXT.independentModel} />
                </span>
                <div className="imggen-inline">
                  <input
                    className="text_pole"
                    type="text"
                    value={currentApiPreset.model}
                    onChange={event => {
                      const value = event.currentTarget.value;
                      updateCurrentApiPreset(draft => {
                        draft.model = value;
                      });
                    }}
                  />
                  <button className="menu_button imggen-button" type="button" onClick={() => void fetchModels()}>
                    获取
                  </button>
                </div>
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Max Tokens</span>
                  <HelpMarker text={HELP_TEXT.independentMaxTokens} />
                </span>
                <input
                  className="text_pole"
                  max="32000"
                  min="1"
                  type="number"
                  value={currentApiPreset.max_tokens}
                  onChange={event => {
                    const nextValue = readNumberInput(event, currentApiPreset.max_tokens);
                    updateCurrentApiPreset(draft => {
                      draft.max_tokens = nextValue;
                    });
                  }}
                />
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Temperature</span>
                  <HelpMarker text={HELP_TEXT.independentTemperature} />
                </span>
                <input
                  className="text_pole"
                  max="2"
                  min="0"
                  step="0.1"
                  type="number"
                  value={currentApiPreset.temperature}
                  onChange={event => {
                    const nextValue = readNumberInput(event, currentApiPreset.temperature);
                    updateCurrentApiPreset(draft => {
                      draft.temperature = nextValue;
                    });
                  }}
                />
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Top P</span>
                  <HelpMarker text={HELP_TEXT.independentTopP} />
                </span>
                <input
                  className="text_pole"
                  max="1"
                  min="0"
                  step="0.05"
                  type="number"
                  value={currentApiPreset.top_p}
                  onChange={event => {
                    const nextValue = readNumberInput(event, currentApiPreset.top_p);
                    updateCurrentApiPreset(draft => {
                      draft.top_p = nextValue;
                    });
                  }}
                />
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Freq Penalty</span>
                  <HelpMarker text={HELP_TEXT.independentFrequencyPenalty} />
                </span>
                <input
                  className="text_pole"
                  max="2"
                  min="-2"
                  step="0.1"
                  type="number"
                  value={currentApiPreset.frequency_penalty}
                  onChange={event => {
                    const nextValue = readNumberInput(event, currentApiPreset.frequency_penalty);
                    updateCurrentApiPreset(draft => {
                      draft.frequency_penalty = nextValue;
                    });
                  }}
                />
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Presence Penalty</span>
                  <HelpMarker text={HELP_TEXT.independentPresencePenalty} />
                </span>
                <input
                  className="text_pole"
                  max="2"
                  min="-2"
                  step="0.1"
                  type="number"
                  value={currentApiPreset.presence_penalty}
                  onChange={event => {
                    const nextValue = readNumberInput(event, currentApiPreset.presence_penalty);
                    updateCurrentApiPreset(draft => {
                      draft.presence_penalty = nextValue;
                    });
                  }}
                />
              </label>
            </div>
          </div>
        ) : null}
      </section>

      <section className="imggen-section">
        <button
          aria-expanded={contextFilterExpanded}
          className="imggen-collapse-button"
          type="button"
          onClick={() => setContextFilterExpanded(current => !current)}
        >
          <span className="imggen-collapse-copy">
            <span className="imggen-section-title">上下文过滤</span>
            <span className="imggen-section-desc">
              在把最新楼层文本交给提示词生成前，先按顺序执行过滤规则或提取标签，减少无关内容。
            </span>
            <span className="imggen-inline-note">{contextFilterSummary}</span>
          </span>
          <span className="imggen-collapse-state">
            <span>{contextFilterExpanded ? '收起' : '展开'}</span>
            <i className={contextFilterExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'}></i>
          </span>
        </button>
        {contextFilterExpanded ? (
          <div className="imggen-collapse-body">
            <label className="imggen-field">
              <span className="imggen-label-line">
                <span>过滤规则</span>
                <HelpMarker text={HELP_TEXT.filterTags} />
              </span>
              <textarea
                className="text_pole"
                placeholder={'block:<small>\nbefore:</think>\nafter:[analysis]\npair:前缀|后缀\ntext:旁白'}
                rows={5}
                value={config.independentApi.filterTags}
                onChange={event => {
                  const value = event.currentTarget.value;
                  updateConfig(draft => {
                    draft.independentApi.filterTags = value;
                  });
                }}
              />
            </label>
            <label className="imggen-field">
              <span className="imggen-label-line">
                <span>提取标签</span>
                <HelpMarker text={HELP_TEXT.extractTags} />
              </span>
              <textarea
                className="text_pole"
                placeholder="<content>, [dialogue], 前缀|后缀"
                rows={3}
                value={config.independentApi.extractTags}
                onChange={event => {
                  const value = event.currentTarget.value;
                  updateConfig(draft => {
                    draft.independentApi.extractTags = value;
                  });
                }}
              />
            </label>
            <p className="imggen-hint">提示词生成会自动附带当前角色、聊天和用户人设绑定的人物库与世界书上下文。</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
