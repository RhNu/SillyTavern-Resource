import { ExtensionSettingDrawer } from '@util/components/ExtensionSettingDrawer';
import { HelpMarker } from '@util/components/HelpMarker';
import { useEffect, useRef, useState } from 'react';
import type { PresetControllerRuntimeApi } from './runtime';
import type { ImportFormat } from './state';

type Props = {
  runtime: PresetControllerRuntimeApi;
};

export default function SettingsPanel({ runtime }: Props) {
  const [, forceUpdate] = useState(0);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const state = runtime.getState();

  useEffect(() => {
    return runtime.subscribe(() => {
      forceUpdate(value => value + 1);
    });
  }, [runtime]);

  const handleImportText = async () => {
    setImporting(true);
    try {
      await runtime.importConfig(importText);
    } finally {
      setImporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      await runtime.importConfig(await file.text(), file.name);
    } finally {
      setImporting(false);
    }
  };

  return (
    <ExtensionSettingDrawer title="通用预设控制器">
      <div className="preset-controller-settings">
        <section className="preset-controller-settings-panel">
          <div className="preset-controller-settings-row">
            <div className="preset-controller-settings-title-row">
              <div className="preset-controller-settings-title">同步设置</div>
              <HelpMarker
                className="preset-controller-settings-help"
                title="自动应用说明"
                text={[
                  '开启后，切换规则会自动同步到当前 in_use 预设。',
                  '关闭后，需要在悬浮面板里手动点击“应用到 in_use”。',
                ].join('\n\n')}
              />
            </div>
            <label className="preset-controller-settings-switch">
              <input
                checked={state.ui.autoApply}
                type="checkbox"
                onChange={event => runtime.setAutoApply(event.currentTarget.checked)}
              />
              <span>修改后自动应用</span>
            </label>
            <div className="preset-controller-settings-status">{state.statusText}</div>
          </div>
        </section>

        <section className="preset-controller-settings-panel">
          <div className="preset-controller-settings-title-row">
            <div className="preset-controller-settings-title">导入规则集</div>
            <HelpMarker
              className="preset-controller-settings-help"
              title="导入说明"
              text={[
                '支持 JSON 与 YAML。',
                '根级 $schema 字段会在导入时忽略，方便给编辑器挂 JSON Schema 提示。',
                'group 仅用于视觉分类，control 定义 UI 项，具体行为写在 operations 里。',
                'toggle 使用 operations.on / operations.off，radio 则由每个 option 自带 operations。',
                '当前只支持新版结构，旧版字段与旧版配置不会做任何兼容。',
                '导入成功后会立即替换当前规则，并同步到 in_use。',
              ].join('\n\n')}
            />
          </div>

          <textarea
            className="text_pole preset-controller-settings-textarea"
            placeholder="粘贴 JSON 或 YAML"
            value={importText}
            onChange={event => setImportText(event.currentTarget.value)}
          />

          <label className="preset-controller-settings-field">
            <span>导入格式</span>
            <select
              className="text_pole preset-controller-settings-select"
              value={state.ui.importFormat}
              onChange={event => runtime.setImportFormat(event.currentTarget.value as ImportFormat)}
            >
              <option value="auto">自动识别</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </select>
          </label>

          <div className="preset-controller-settings-actions">
            <button
              className="menu_button preset-controller-settings-button"
              disabled={importing || !importText.trim()}
              type="button"
              onClick={() => {
                void handleImportText();
              }}
            >
              {importing ? '导入中...' : '导入文本'}
            </button>

            <button
              className="menu_button preset-controller-settings-button"
              disabled={importing}
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              导入文件
            </button>
          </div>

          <input
            ref={fileInputRef}
            accept=".json,.yaml,.yml,.txt"
            hidden
            type="file"
            onChange={event => {
              const file = event.currentTarget.files?.[0];
              if (!file) {
                return;
              }

              void handleImportFile(file).finally(() => {
                event.currentTarget.value = '';
              });
            }}
          />
        </section>

        <section className="preset-controller-settings-panel">
          <div className="preset-controller-settings-title-row">
            <div className="preset-controller-settings-title">导出 JSON Schema</div>
            <HelpMarker
              className="preset-controller-settings-help"
              title="JSON Schema 说明"
              text={['导出后会生成 preset-controller.schema.json。', '可用于 JSON/YAML 编辑器的自动补全和校验。'].join(
                '\n\n',
              )}
            />
          </div>

          <div className="preset-controller-settings-actions">
            <button
              className="menu_button preset-controller-settings-button"
              type="button"
              onClick={() => runtime.exportJsonSchema()}
            >
              导出 Schema 文件
            </button>
          </div>
        </section>
      </div>
    </ExtensionSettingDrawer>
  );
}
