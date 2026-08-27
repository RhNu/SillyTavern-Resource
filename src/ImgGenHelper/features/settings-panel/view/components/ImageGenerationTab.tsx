import {
  getNekoaiPluginStatus,
  probeNekoaiPlugin,
  type NekoaiPluginStatus,
} from '@/ImgGenHelper/adapters/ai/plugin-backend-probe';
import {
  IMAGE_BACKEND_OPTIONS,
  NOVELAI_MODEL_OPTIONS,
  NOVELAI_SAMPLER_OPTIONS,
  NOVELAI_SCHEDULER_OPTIONS,
  useImageGenerationStore,
  type ImageBackend,
  type NovelAIImageConfig,
} from '@/ImgGenHelper/config/store';
import HelpMarker from '@/ImgGenHelper/features/settings-panel/view/components/HelpMarker';
import { HELP_TEXT } from '@/ImgGenHelper/features/settings-panel/view/meta';
import { useCallback, useEffect, useState, type ChangeEvent } from 'react';

const SIZE_PRESETS = [
  { value: 'portrait', label: 'Portrait (832x1216)', width: 832, height: 1216 },
  { value: 'landscape', label: 'Landscape (1216x832)', width: 1216, height: 832 },
  { value: 'square', label: 'Square (1024x1024)', width: 1024, height: 1024 },
] as const;

type SizePresetValue = (typeof SIZE_PRESETS)[number]['value'] | 'custom';

const sizePresetOptions: Array<{ value: SizePresetValue; label: string }> = [
  ...SIZE_PRESETS.map(preset => ({ value: preset.value, label: preset.label })),
  { value: 'custom', label: 'Custom' },
];

function readNumberInput(event: ChangeEvent<HTMLInputElement>, fallback: number): number {
  return Number.isNaN(event.currentTarget.valueAsNumber) ? fallback : event.currentTarget.valueAsNumber;
}

function resolveSizePresetValue(image: NovelAIImageConfig): SizePresetValue {
  const matchedPreset = SIZE_PRESETS.find(preset => preset.width === image.width && preset.height === image.height);
  return matchedPreset?.value ?? 'custom';
}

const BACKEND_STATUS_TEXT: Record<NekoaiPluginStatus, string> = {
  unknown: '正在探测后端插件…',
  available: '后端插件已连接',
  unavailable: '未检测到后端插件',
};

export default function ImageGenerationTab() {
  const config = useImageGenerationStore(state => state.config);
  const updateConfig = useImageGenerationStore(state => state.updateConfig);
  const [imageSettingsExpanded, setImageSettingsExpanded] = useState(false);
  const [pluginStatus, setPluginStatus] = useState<NekoaiPluginStatus>(getNekoaiPluginStatus);
  const [probing, setProbing] = useState(false);

  const refreshPluginStatus = useCallback(async () => {
    setProbing(true);
    try {
      setPluginStatus(await probeNekoaiPlugin());
    } finally {
      setProbing(false);
    }
  }, []);

  useEffect(() => {
    if (getNekoaiPluginStatus() === 'unknown') {
      void refreshPluginStatus();
    }
  }, [refreshPluginStatus]);

  const selectedSizePreset = resolveSizePresetValue(config.image);
  const modelText =
    NOVELAI_MODEL_OPTIONS.find(option => option.value === config.image.model)?.text ?? config.image.model;
  const backendText =
    IMAGE_BACKEND_OPTIONS.find(option => option.value === config.image.backend)?.text ?? config.image.backend;
  const imageSettingsSummary = [
    backendText,
    modelText,
    config.image.sampler,
    `${config.image.width}x${config.image.height}`,
  ].join(' · ');

  return (
    <>
      <section className="imggen-section">
        <div className="imggen-section-header">
          <h4 className="imggen-section-title">请求与渲染策略</h4>
          <p className="imggen-section-desc">
            这里控制图片生成的队列、真实超时中断和楼层渲染范围；自动图片生成开关已移到第一个标签页。
          </p>
        </div>
        <div className="imggen-toggle-list">
          <label className="imggen-check">
            <input
              checked={config.generation.sequential}
              type="checkbox"
              onChange={event => {
                const checked = event.currentTarget.checked;
                updateConfig(draft => {
                  draft.generation.sequential = checked;
                });
              }}
            />
            <span className="imggen-check-label">
              <span>顺序生图</span>
              <HelpMarker text={HELP_TEXT.sequential} />
            </span>
          </label>
          <label className="imggen-check">
            <input
              checked={config.generation.timeoutEnabled}
              type="checkbox"
              onChange={event => {
                const checked = event.currentTarget.checked;
                updateConfig(draft => {
                  draft.generation.timeoutEnabled = checked;
                });
              }}
            />
            <span className="imggen-check-label">
              <span>启用请求超时</span>
              <HelpMarker text={HELP_TEXT.timeoutEnabled} />
            </span>
          </label>
          <label className="imggen-check">
            <input
              checked={config.generation.renderLatestRefMessagesEnabled}
              type="checkbox"
              onChange={event => {
                const checked = event.currentTarget.checked;
                updateConfig(draft => {
                  draft.generation.renderLatestRefMessagesEnabled = checked;
                });
              }}
            />
            <span className="imggen-check-label">
              <span>限制聊天渲染楼层</span>
              <HelpMarker text={HELP_TEXT.renderLatestRefMessagesEnabled} />
            </span>
          </label>
        </div>
      </section>

      <section className="imggen-section">
        <button
          aria-expanded={imageSettingsExpanded}
          className="imggen-collapse-button"
          type="button"
          onClick={() => setImageSettingsExpanded(current => !current)}
        >
          <span className="imggen-collapse-copy">
            <span className="imggen-section-title">NovelAI 参数</span>
            <span className="imggen-section-desc">
              这里的参数将直接用于脚本自己的 NovelAI 请求，并在生成后上传到酒馆图片目录。
            </span>
            <span className="imggen-inline-note">{imageSettingsSummary}</span>
          </span>
          <span className="imggen-collapse-state">
            <span>{imageSettingsExpanded ? '收起' : '展开'}</span>
            <i className={imageSettingsExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'}></i>
          </span>
        </button>
        {imageSettingsExpanded ? (
          <div className="imggen-collapse-body">
            <div className="imggen-grid">
              <div className="imggen-field">
                <span className="imggen-label-line">
                  <span>生成后端</span>
                  <HelpMarker text={HELP_TEXT.imageBackend} />
                </span>
                <select
                  className="text_pole"
                  value={config.image.backend}
                  onChange={event => {
                    const value = event.currentTarget.value as ImageBackend;
                    updateConfig(draft => {
                      draft.image.backend = value;
                    });
                  }}
                >
                  {IMAGE_BACKEND_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </select>
                <div className="imggen-inline">
                  <div className="imggen-inline-note">{BACKEND_STATUS_TEXT[pluginStatus]}</div>
                  <button
                    className="imggen-button"
                    disabled={probing}
                    type="button"
                    onClick={() => void refreshPluginStatus()}
                  >
                    {probing ? '探测中…' : '重新探测'}
                  </button>
                </div>
              </div>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>模型</span>
                  <HelpMarker text={HELP_TEXT.imageModel} />
                </span>
                <select
                  className="text_pole"
                  value={config.image.model}
                  onChange={event => {
                    const value = event.currentTarget.value as NovelAIImageConfig['model'];
                    updateConfig(draft => {
                      draft.image.model = value;
                    });
                  }}
                >
                  {NOVELAI_MODEL_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </select>
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Sampler</span>
                  <HelpMarker text={HELP_TEXT.imageSampler} />
                </span>
                <select
                  className="text_pole"
                  value={config.image.sampler}
                  onChange={event => {
                    const value = event.currentTarget.value as NovelAIImageConfig['sampler'];
                    updateConfig(draft => {
                      draft.image.sampler = value;
                    });
                  }}
                >
                  {NOVELAI_SAMPLER_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Scheduler</span>
                  <HelpMarker text={HELP_TEXT.imageScheduler} />
                </span>
                <select
                  className="text_pole"
                  value={config.image.scheduler}
                  onChange={event => {
                    const value = event.currentTarget.value as NovelAIImageConfig['scheduler'];
                    updateConfig(draft => {
                      draft.image.scheduler = value;
                    });
                  }}
                >
                  {NOVELAI_SCHEDULER_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>步数</span>
                  <HelpMarker text={HELP_TEXT.imageSteps} />
                </span>
                <input
                  className="text_pole"
                  max="50"
                  min="1"
                  type="number"
                  value={config.image.steps}
                  onChange={event => {
                    const nextValue = readNumberInput(event, config.image.steps);
                    updateConfig(draft => {
                      draft.image.steps = nextValue;
                    });
                  }}
                />
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Scale</span>
                  <HelpMarker text={HELP_TEXT.imageScale} />
                </span>
                <input
                  className="text_pole"
                  max="20"
                  min="0"
                  step="0.1"
                  type="number"
                  value={config.image.scale}
                  onChange={event => {
                    const nextValue = readNumberInput(event, config.image.scale);
                    updateConfig(draft => {
                      draft.image.scale = nextValue;
                    });
                  }}
                />
              </label>
              <label className="imggen-field">
                <span>尺寸预设</span>
                <select
                  className="text_pole"
                  value={selectedSizePreset}
                  onChange={event => {
                    const preset = SIZE_PRESETS.find(entry => entry.value === event.currentTarget.value);
                    if (!preset) {
                      return;
                    }
                    updateConfig(draft => {
                      draft.image.width = preset.width;
                      draft.image.height = preset.height;
                    });
                  }}
                >
                  {sizePresetOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>宽度</span>
                  <HelpMarker text={HELP_TEXT.imageWidth} />
                </span>
                <input
                  className="text_pole"
                  max="2048"
                  min="64"
                  step="64"
                  type="number"
                  value={config.image.width}
                  onChange={event => {
                    const nextValue = readNumberInput(event, config.image.width);
                    updateConfig(draft => {
                      draft.image.width = nextValue;
                    });
                  }}
                />
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>高度</span>
                  <HelpMarker text={HELP_TEXT.imageHeight} />
                </span>
                <input
                  className="text_pole"
                  max="2048"
                  min="64"
                  step="64"
                  type="number"
                  value={config.image.height}
                  onChange={event => {
                    const nextValue = readNumberInput(event, config.image.height);
                    updateConfig(draft => {
                      draft.image.height = nextValue;
                    });
                  }}
                />
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Seed</span>
                  <HelpMarker text={HELP_TEXT.imageSeed} />
                </span>
                <input
                  className="text_pole"
                  min="-1"
                  step="1"
                  type="number"
                  value={config.image.seed}
                  onChange={event => {
                    const nextValue = readNumberInput(event, config.image.seed);
                    updateConfig(draft => {
                      draft.image.seed = nextValue;
                    });
                  }}
                />
              </label>
              <label className="imggen-field">
                <span className="imggen-label-line">
                  <span>Upscale Ratio</span>
                  <HelpMarker text={HELP_TEXT.imageUpscaleRatio} />
                </span>
                <input
                  className="text_pole"
                  max="4"
                  min="1"
                  step="0.1"
                  type="number"
                  value={config.image.upscaleRatio}
                  onChange={event => {
                    const nextValue = readNumberInput(event, config.image.upscaleRatio);
                    updateConfig(draft => {
                      draft.image.upscaleRatio = nextValue;
                    });
                  }}
                />
              </label>
            </div>
            <p className="imggen-hint">选择常见尺寸预设会直接写入宽高；手动修改宽高后会自动切换为 Custom。</p>
            <div className="imggen-toggle-list">
              <label className="imggen-check">
                <input
                  checked={config.image.anlasGuard}
                  type="checkbox"
                  onChange={event => {
                    const checked = event.currentTarget.checked;
                    updateConfig(draft => {
                      draft.image.anlasGuard = checked;
                    });
                  }}
                />
                <span className="imggen-check-label">
                  <span>Avoid spending Anlas</span>
                  <HelpMarker text={HELP_TEXT.imageAnlasGuard} />
                </span>
              </label>
              <label className="imggen-check">
                <input
                  checked={config.image.sm}
                  type="checkbox"
                  onChange={event => {
                    const checked = event.currentTarget.checked;
                    updateConfig(draft => {
                      draft.image.sm = checked;
                    });
                  }}
                />
                <span className="imggen-check-label">
                  <span>SMEA</span>
                  <HelpMarker text={HELP_TEXT.imageSm} />
                </span>
              </label>
              <label className="imggen-check">
                <input
                  checked={config.image.smDyn}
                  disabled={!config.image.sm}
                  type="checkbox"
                  onChange={event => {
                    const checked = event.currentTarget.checked;
                    updateConfig(draft => {
                      draft.image.smDyn = checked;
                    });
                  }}
                />
                <span className="imggen-check-label">
                  <span>SMEA Dynamic</span>
                  <HelpMarker text={HELP_TEXT.imageSmDyn} />
                </span>
              </label>
              <label className="imggen-check">
                <input
                  checked={config.image.decrisper}
                  type="checkbox"
                  onChange={event => {
                    const checked = event.currentTarget.checked;
                    updateConfig(draft => {
                      draft.image.decrisper = checked;
                    });
                  }}
                />
                <span className="imggen-check-label">
                  <span>Decrisper</span>
                  <HelpMarker text={HELP_TEXT.imageDecrisper} />
                </span>
              </label>
              <label className="imggen-check">
                <input
                  checked={config.image.varietyBoost}
                  type="checkbox"
                  onChange={event => {
                    const checked = event.currentTarget.checked;
                    updateConfig(draft => {
                      draft.image.varietyBoost = checked;
                    });
                  }}
                />
                <span className="imggen-check-label">
                  <span>Variety Boost</span>
                  <HelpMarker text={HELP_TEXT.imageVarietyBoost} />
                </span>
              </label>
            </div>
          </div>
        ) : null}
      </section>

      <section className="imggen-section">
        <div className="imggen-section-header">
          <h4 className="imggen-section-title">时序与重试</h4>
          <p className="imggen-section-desc">用于控制脚本内置 NovelAI 请求的排队、失败重试和中断超时。</p>
        </div>
        <div className="imggen-grid">
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>多图间隔(秒)</span>
              <HelpMarker text={HELP_TEXT.intervalSeconds} />
            </span>
            <input
              className="text_pole"
              max="30"
              min="0"
              step="0.5"
              type="number"
              value={config.generation.intervalSeconds}
              onChange={event => {
                const nextValue = readNumberInput(event, config.generation.intervalSeconds);
                updateConfig(draft => {
                  draft.generation.intervalSeconds = nextValue;
                });
              }}
            />
          </label>
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>重试次数</span>
              <HelpMarker text={HELP_TEXT.retryCount} />
            </span>
            <input
              className="text_pole"
              max="10"
              min="0"
              type="number"
              value={config.generation.retryCount}
              onChange={event => {
                const nextValue = readNumberInput(event, config.generation.retryCount);
                updateConfig(draft => {
                  draft.generation.retryCount = nextValue;
                });
              }}
            />
          </label>
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>重试间隔(秒)</span>
              <HelpMarker text={HELP_TEXT.retryDelaySeconds} />
            </span>
            <input
              className="text_pole"
              max="30"
              min="0"
              step="0.5"
              type="number"
              value={config.generation.retryDelaySeconds}
              onChange={event => {
                const nextValue = readNumberInput(event, config.generation.retryDelaySeconds);
                updateConfig(draft => {
                  draft.generation.retryDelaySeconds = nextValue;
                });
              }}
            />
          </label>
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>超时(秒)</span>
              <HelpMarker text={HELP_TEXT.timeoutSeconds} />
            </span>
            <input
              className="text_pole"
              max="600"
              min="30"
              type="number"
              value={config.generation.timeoutSeconds}
              onChange={event => {
                const nextValue = readNumberInput(event, config.generation.timeoutSeconds);
                updateConfig(draft => {
                  draft.generation.timeoutSeconds = nextValue;
                });
              }}
            />
          </label>
          <label className="imggen-field">
            <span className="imggen-label-line">
              <span>最近渲染楼层数</span>
              <HelpMarker text={HELP_TEXT.renderLatestRefMessagesCount} />
            </span>
            <input
              className="text_pole"
              disabled={!config.generation.renderLatestRefMessagesEnabled}
              max="999"
              min="1"
              type="number"
              value={config.generation.renderLatestRefMessagesCount}
              onChange={event => {
                const nextValue = readNumberInput(event, config.generation.renderLatestRefMessagesCount);
                updateConfig(draft => {
                  draft.generation.renderLatestRefMessagesCount = nextValue;
                });
              }}
            />
          </label>
        </div>
        <p className="imggen-hint">
          生成图片会优先保存到当前角色对应的图片子目录；没有当前角色上下文时回退到公共目录。
        </p>
      </section>
    </>
  );
}
