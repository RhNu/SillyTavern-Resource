import { createLogger } from '@util/core/logger';
import { ExtensionSettingDrawer } from '@util/ui/extension-settings/ExtensionSettingDrawer';
import { HelpMarker } from '@util/ui/popup/HelpMarker';
import type { ReactPopupSession } from '@util/ui/popup/react';
import { useEffect, useRef, useState } from 'react';
import { openRulePopup } from './RulePopup';
import type { ModelFilterRuntime } from './runtime';
import type { ModelFilterBinding, ModelFilterRule } from './rules';
import { sameBinding } from './rules';

type Props = { runtime: ModelFilterRuntime };

const logger = createLogger('模型列表过滤');

function describeBinding(source: string, endpoint: string): string {
  return endpoint ? `${source} · ${endpoint}` : `${source} · 默认端点`;
}

function describeRule(rule: ModelFilterRule): string {
  return `${rule.mode === 'include' ? '只显示' : '隐藏'} · ${rule.match === 'regex' ? '正则' : '精确 ID'}`;
}

export default function SettingsPanel({ runtime }: Props) {
  const [, setVersion] = useState(0);
  const activePopup = useRef<ReactPopupSession | null>(null);
  useEffect(() => runtime.subscribe(() => setVersion(value => value + 1)), [runtime]);
  useEffect(
    () => () => {
      if (activePopup.current && !activePopup.current.isClosed) {
        void activePopup.current.cancel().catch(error => logger.error('卸载时关闭规则弹窗失败。', error));
      }
    },
    [],
  );

  const settings = runtime.getSettings();
  const binding = runtime.getBinding();
  const currentRule = binding ? settings.rules.find(rule => sameBinding(rule, binding)) : undefined;

  const editRule = (target: ModelFilterBinding, rule?: ModelFilterRule) => {
    if (activePopup.current && !activePopup.current.isClosed) return;
    try {
      const session = openRulePopup(runtime, target, rule);
      activePopup.current = session;
      void session.closed
        .catch(error => logger.error('规则弹窗异常结束。', error))
        .finally(() => {
          if (activePopup.current === session) activePopup.current = null;
        });
    } catch (error) {
      logger.error('打开规则弹窗失败。', error);
      toastr.error('无法打开规则编辑窗口。');
    }
  };

  return (
    <ExtensionSettingDrawer title="模型列表过滤">
      <div className="model-filter-panel">
        <div className="model-filter-heading">
          <label className="model-filter-check">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={event => runtime.setEnabled(event.currentTarget.checked)}
            />
            启用模型过滤
          </label>
          <HelpMarker
            title="过滤范围"
            text="只整理聊天补全来源的模型下拉列表和自定义端点的输入建议。匹配对象是模型 ID；已选中的模型会保留可见，脚本不会更改实际请求所用的模型。规则按来源和当前端点保存，与连接预设名称无关。"
          />
        </div>

        <div className="model-filter-context">
          当前连接：{binding ? describeBinding(binding.source, binding.endpoint) : '请先选择来源并填写有效端点 URL'}
        </div>
        <div className="model-filter-actions">
          <button
            type="button"
            className="menu_button"
            disabled={!binding}
            onClick={() => binding && editRule(binding, currentRule)}
          >
            {currentRule ? '编辑当前连接规则' : '新建当前连接规则'}
          </button>
        </div>

        <div className="model-filter-saved">
          <strong>已保存规则（{settings.rules.length}）</strong>
          {settings.rules.length === 0 ? (
            <p className="model-filter-empty">暂无规则。选择聊天补全来源后可为当前连接新建规则。</p>
          ) : (
            settings.rules.map(rule => (
              <div className="model-filter-saved-row" key={`${rule.source}\u0000${rule.endpoint}`}>
                <div className="model-filter-rule-summary">
                  <span>{describeBinding(rule.source, rule.endpoint)}</span>
                  <small>{describeRule(rule)}</small>
                </div>
                <div className="model-filter-row-actions">
                  <button type="button" className="menu_button" onClick={() => editRule(rule, rule)}>
                    编辑
                  </button>
                  <button type="button" className="menu_button" onClick={() => runtime.removeRule(rule)}>
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ExtensionSettingDrawer>
  );
}
